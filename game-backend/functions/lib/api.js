// HTTP API for the Diary Chase leaderboard.
//   POST /start                 -> { runId }                  (called when the player taps Start / Play again)
//   POST /submit {runId, deviceId, name, time, acorns, bumps[, stage, control, country, caught, gap]} -> ranks
//   GET  /board?scope=week|all[&stage=][&deviceId=] -> top entries, plus the caller's own entry when it is further down
// Catches rank by time; misses (caught: false, gap = how far ahead the thief was) rank below every
// catch, closest first. Both sort on one stored field, `order` (see rules.js).
// Firestore layout (clients have no direct access; see firestore.rules):
//   runs/{runId}            one per race start; used once
//   bests/{scope}_{device}  best result per device per scope ("2026-W41" or "all")
//   ratelimits/{ip}_{slot}  request counters
const crypto = require("crypto");
const { Timestamp } = require("firebase-admin/firestore");
const { RULES, STAGES, weekId, scopeIds, checkScore, cleanName, cleanControl, cleanCountry, DEVICE_RE } = require("./rules");

const LIMITS = { start: 40, submit: 40, windowMs: 10 * 60 * 1000 };   // every race can end in a submit now, and each needs its own /start
const BOARD_CACHE_MS = 15000;

// What the board shows for a stored best. Entries from before misses existed have no `caught` or `order`.
const orderOf = (e) => e.order ?? e.time;
function publicEntry(e) {
  const caught = e.caught !== false;
  return { name: e.name, caught, time: e.time, ...(caught ? {} : { gap: e.gap }), acorns: e.acorns, control: cleanControl(e.control), country: cleanCountry(e.country) };
}

function createApi({ db, now = () => Date.now(), salt = "" }) {
  const hash = (s) => crypto.createHash("sha256").update(salt + ":" + s).digest("hex").slice(0, 32);
  const ahead = (scope, order) => db.collection("bests").where("scope", "==", scope).where("order", "<", order).count().get().then((a) => a.data().count);
  const boardCache = new Map(); // scopeId -> { at, entries }

  async function rateLimit(ip, kind) {
    const slot = Math.floor(now() / LIMITS.windowMs);
    const ref = db.collection("ratelimits").doc(`${hash(ip)}_${kind}_${slot}`);
    const count = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const n = (snap.exists ? snap.get("n") : 0) + 1;
      tx.set(ref, { n, expireAt: Timestamp.fromMillis(now() + 2 * LIMITS.windowMs) });
      return n;
    });
    return count <= LIMITS[kind];
  }

  async function start(req, res, ip) {
    if (!(await rateLimit(ip, "start"))) return send(res, 429, { error: "slow_down" });
    const ref = db.collection("runs").doc();
    await ref.set({ startedAt: now(), used: false, expireAt: Timestamp.fromMillis(now() + 24 * 3600 * 1000) });
    send(res, 200, { runId: ref.id });
  }

  async function submit(req, res, ip) {
    const b = req.body || {};
    if (typeof b.runId !== "string" || !/^[A-Za-z0-9]{10,40}$/.test(b.runId)) return send(res, 400, { error: "bad_run" });
    if (typeof b.deviceId !== "string" || !DEVICE_RE.test(b.deviceId)) return send(res, 400, { error: "bad_device" });
    const stage = b.stage === undefined ? "burrow" : b.stage;
    if (!Object.hasOwn(STAGES, stage)) return send(res, 400, { error: "bad_stage" });
    const nm = cleanName(b.name);
    if (!nm.ok) return send(res, 400, { error: nm.reason });
    const control = cleanControl(b.control), country = cleanCountry(b.country);
    const how = { ...(control && { control }), ...(country && { country }) };   // each left off the documents when unknown
    if (!(await rateLimit(ip, "submit"))) return send(res, 429, { error: "slow_down" });

    const t = now();
    const device = hash(b.deviceId);
    const ids = scopeIds(stage, t);
    const scopes = [ids.week, ids.all];
    let result;
    try {
      result = await db.runTransaction(async (tx) => {
        const runRef = db.collection("runs").doc(b.runId);
        const run = await tx.get(runRef);
        if (!run.exists) throw httpError(404, "unknown_run");
        if (run.get("used")) throw httpError(409, "run_used");
        const check = checkScore({ time: b.time, acorns: b.acorns, bumps: b.bumps, stage, caught: b.caught, gap: b.gap }, (t - run.get("startedAt")) / 1000);
        if (!check.ok) throw httpError(400, check.reason);
        const { ok, ...score } = check;   // caught, time, order, and gap for a miss
        const entry = { name: nm.name, acorns: b.acorns, ...score, ...how };
        const refs = scopes.map((s) => db.collection("bests").doc(`${s}_${device}`));
        const prev = await Promise.all(refs.map((r) => tx.get(r)));
        tx.update(runRef, { used: true, stage, device, ...entry });
        const out = {};
        scopes.forEach((s, i) => {
          const old = prev[i].exists ? prev[i].data() : null;
          const improved = !old || entry.order < orderOf(old);   // any catch beats any miss
          if (improved) tx.set(refs[i], { scope: s, ...entry, updatedAt: t });
          out[s] = { best: improved ? entry : old, improved };
        });
        return out;
      });
    } catch (e) {
      if (e.status) return send(res, e.status, { error: e.message });
      throw e;
    }
    // rank = number of devices strictly ahead of this device's best, plus one. `best` is the catch
    // time (null when the best is a miss, which has `gap` instead).
    const ranks = {};
    for (const s of scopes) {
      const { best, improved } = result[s];
      const caught = best.caught !== false;
      ranks[s === ids.all ? "all" : "week"] = { rank: (await ahead(s, orderOf(best))) + 1, improved, caught, best: caught ? best.time : null, ...(caught ? {} : { gap: best.gap }) };
    }
    boardCache.clear();
    send(res, 200, { time: Math.round(b.time * 100) / 100, stage, weekId: weekId(t), ...ranks });
  }

  async function board(req, res) {
    const scopeParam = req.query.scope === "all" ? "all" : "week";
    const stage = req.query.stage === undefined ? "burrow" : req.query.stage;
    if (!Object.hasOwn(STAGES, stage)) return send(res, 400, { error: "bad_stage" });
    const scope = scopeIds(stage, now())[scopeParam];
    let cached = boardCache.get(scope);
    if (!cached || now() - cached.at > BOARD_CACHE_MS) {
      const snap = await db.collection("bests").where("scope", "==", scope)
        .orderBy("order", "asc").orderBy("acorns", "desc").limit(RULES.boardSize).get();
      cached = { at: now(), entries: snap.docs.map((d) => ({ id: d.id, ...publicEntry(d.data()) })) };
      boardCache.set(scope, cached);
    }
    const mine = typeof req.query.deviceId === "string" && DEVICE_RE.test(req.query.deviceId) ? `${scope}_${hash(req.query.deviceId)}` : null;
    // the caller's own entry when it isn't among the top ones, so the board can show it underneath
    let own;
    if (mine && !cached.entries.some((e) => e.id === mine)) {
      const doc = await db.collection("bests").doc(mine).get();
      if (doc.exists) own = { rank: (await ahead(scope, orderOf(doc.data()))) + 1, ...publicEntry(doc.data()) };
    }
    res.set("Cache-Control", mine ? "private, no-store" : "public, max-age=15");
    send(res, 200, {
      scope: scopeParam, stage, weekId: weekId(now()),
      entries: cached.entries.map(({ id, ...e }, i) => ({ rank: i + 1, ...e, me: id === mine })),
      ...(own ? { mine: own } : {}),
    });
  }

  return async function handler(req, res) {
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";
    const path = (req.path || "/").replace(/\/+$/, "") || "/";
    try {
      if (req.method === "POST" && path === "/start") return await start(req, res, ip);
      if (req.method === "POST" && path === "/submit") return await submit(req, res, ip);
      if (req.method === "GET" && path === "/board") return await board(req, res);
      send(res, 404, { error: "not_found" });
    } catch (e) {
      console.error(e);
      send(res, 500, { error: "server_error" });
    }
  };
}

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
function send(res, status, body) { res.status(status).json(body); }

module.exports = { createApi, LIMITS };
