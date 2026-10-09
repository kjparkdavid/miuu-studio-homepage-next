// HTTP API for the Diary Chase leaderboard.
//   POST /start                 -> { runId }                  (called when the player taps Start / Play again)
//   POST /submit {runId, deviceId, name, time, acorns, bumps} -> ranks (only catches are submitted)
//   GET  /board?scope=week|all[&deviceId=] -> top entries
// Firestore layout (clients have no direct access; see firestore.rules):
//   runs/{runId}            one per race start; used once
//   bests/{scope}_{device}  best catch per device per scope ("2026-W41" or "all")
//   ratelimits/{ip}_{slot}  request counters
const crypto = require("crypto");
const { Timestamp } = require("firebase-admin/firestore");
const { RULES, weekId, checkScore, cleanName, DEVICE_RE } = require("./rules");

const LIMITS = { start: 40, submit: 15, windowMs: 10 * 60 * 1000 };
const BOARD_CACHE_MS = 15000;

function createApi({ db, now = () => Date.now(), salt = "" }) {
  const hash = (s) => crypto.createHash("sha256").update(salt + ":" + s).digest("hex").slice(0, 32);
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
    const nm = cleanName(b.name);
    if (!nm.ok) return send(res, 400, { error: nm.reason });
    if (!(await rateLimit(ip, "submit"))) return send(res, 429, { error: "slow_down" });

    const t = now();
    const device = hash(b.deviceId);
    const scopes = [weekId(t), "all"];
    let result;
    try {
      result = await db.runTransaction(async (tx) => {
        const runRef = db.collection("runs").doc(b.runId);
        const run = await tx.get(runRef);
        if (!run.exists) throw httpError(404, "unknown_run");
        if (run.get("used")) throw httpError(409, "run_used");
        const check = checkScore({ time: b.time, acorns: b.acorns, bumps: b.bumps }, (t - run.get("startedAt")) / 1000);
        if (!check.ok) throw httpError(400, check.reason);
        const refs = scopes.map((s) => db.collection("bests").doc(`${s}_${device}`));
        const prev = await Promise.all(refs.map((r) => tx.get(r)));
        tx.update(runRef, { used: true, time: check.time, acorns: b.acorns, name: nm.name, device });
        const out = {};
        scopes.forEach((s, i) => {
          const old = prev[i].exists ? prev[i].data() : null;
          const improved = !old || check.time < old.time;
          if (improved) tx.set(refs[i], { scope: s, name: nm.name, time: check.time, acorns: b.acorns, updatedAt: t });
          out[s] = { best: improved ? check.time : old.time, improved };
        });
        return out;
      });
    } catch (e) {
      if (e.status) return send(res, e.status, { error: e.message });
      throw e;
    }
    // rank = number of devices strictly faster than this device's best, plus one
    const ranks = {};
    for (const s of scopes) {
      const agg = await db.collection("bests").where("scope", "==", s).where("time", "<", result[s].best).count().get();
      ranks[s === "all" ? "all" : "week"] = { rank: agg.data().count + 1, best: result[s].best, improved: result[s].improved };
    }
    boardCache.clear();
    send(res, 200, { time: Math.round(b.time * 100) / 100, weekId: scopes[0], ...ranks });
  }

  async function board(req, res) {
    const scopeParam = req.query.scope === "all" ? "all" : "week";
    const scope = scopeParam === "all" ? "all" : weekId(now());
    let cached = boardCache.get(scope);
    if (!cached || now() - cached.at > BOARD_CACHE_MS) {
      const snap = await db.collection("bests").where("scope", "==", scope)
        .orderBy("time", "asc").orderBy("acorns", "desc").limit(RULES.boardSize).get();
      cached = { at: now(), entries: snap.docs.map((d) => ({ id: d.id, name: d.get("name"), time: d.get("time"), acorns: d.get("acorns") })) };
      boardCache.set(scope, cached);
    }
    const mine = typeof req.query.deviceId === "string" && DEVICE_RE.test(req.query.deviceId) ? `${scope}_${hash(req.query.deviceId)}` : null;
    res.set("Cache-Control", mine ? "private, no-store" : "public, max-age=15");
    send(res, 200, {
      scope: scopeParam, weekId: weekId(now()),
      entries: cached.entries.map(({ id, ...e }, i) => ({ rank: i + 1, ...e, me: id === mine })),
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
