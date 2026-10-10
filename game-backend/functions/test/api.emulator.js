// Runs against the Firebase emulators (functions + firestore). Start them first:
//   npx firebase-tools@13 emulators:start --project demo-miuu-game
// Uses a fake clock: the API under test is created in-process with an injected `now`,
// pointed at the Firestore emulator, so we don't have to wait 25 real seconds per run.
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.GCLOUD_PROJECT ??= "demo-miuu-game";
const test = require("node:test");
const assert = require("node:assert");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { createApi } = require("../lib/api");
const { RULES } = require("../lib/rules");

initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = getFirestore();
let clock = Date.UTC(2026, 9, 9, 12);
const api = createApi({ db, now: () => clock, salt: "test" });

function call(method, path, { body, query = {}, ip = "1.2.3.4" } = {}) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200, headers: {},
      status(c) { this.statusCode = c; return this; },
      set(k, v) { this.headers[k] = v; return this; },
      json(b) { resolve({ status: this.statusCode, body: b, headers: this.headers }); },
    };
    api({ method, path, body, query, headers: { "x-forwarded-for": ip } }, res);
  });
}
const dev = (n) => `device-${String(n).padStart(12, "0")}`;
async function race(device, name, time, { acorns = 40, wait = time + 6, ip, control, country, stage, gap } = {}) {
  const s = await call("POST", "/start", { ip });
  clock += wait * 1000;
  const miss = gap === undefined ? {} : { caught: false, gap };
  return call("POST", "/submit", { ip, body: { runId: s.body.runId, deviceId: device, name, time, acorns, bumps: 1, control, country, stage, ...miss } });
}

test.before(async () => {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${process.env.GCLOUD_PROJECT}/databases/(default)/documents`, { method: "DELETE" });
});

test("a catch lands on both boards with ranks", async () => {
  const r = await race(dev(1), "Kiki", 26.4);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.week.rank, r.body.all.rank, r.body.week.improved], [1, 1, true]);
  assert.equal(r.body.weekId, "2026-W41");
});

test("faster players rank above; slower retries don't replace a best", async () => {
  const fast = await race(dev(2), "Momo", 24.1);
  assert.equal(fast.body.all.rank, 1);
  const slower = await race(dev(2), "Momo", 30);
  assert.equal(slower.status, 200);
  assert.deepEqual([slower.body.all.best, slower.body.all.improved, slower.body.all.rank], [24.1, false, 1]);
  const b = await call("GET", "/board", { query: { scope: "all", deviceId: dev(2) } });
  assert.deepEqual(b.body.entries.map((e) => [e.rank, e.name, e.time, e.me]), [[1, "Momo", 24.1, true], [2, "Kiki", 26.4, false]]);
});

test("forged or replayed runs are refused", async () => {
  const s = await call("POST", "/start", { ip: "9.9.9.9" });
  clock += 10 * 1000; // only 10s since start
  const tooQuick = await call("POST", "/submit", { ip: "9.9.9.9", body: { runId: s.body.runId, deviceId: dev(3), name: "Speedy", time: 25, acorns: 5 } });
  assert.deepEqual([tooQuick.status, tooQuick.body.error], [400, "too_fast_for_run"]);
  const ok = await race(dev(3), "Lumi", 27, { ip: "9.9.9.9" });
  assert.equal(ok.status, 200);
  const runs = await db.collection("runs").where("name", "==", "Lumi").get();
  const replay = await call("POST", "/submit", { ip: "9.9.9.9", body: { runId: runs.docs[0].id, deviceId: dev(3), name: "Lumi", time: 22, acorns: 5 } });
  assert.deepEqual([replay.status, replay.body.error], [409, "run_used"]);
  const unknown = await call("POST", "/submit", { body: { runId: "AAAAAAAAAAAAAAAAAAAA", deviceId: dev(3), name: "Lumi", time: 25, acorns: 5 } });
  assert.equal(unknown.status, 404);
  const rude = await race(dev(4), "f u c k", 25);
  assert.deepEqual([rude.status, rude.body.error], [400, "name_blocked"]);
});

test("weekly board resets on Monday but all-time keeps everyone", async () => {
  clock = Date.UTC(2026, 9, 12, 1); // Monday of the next week
  const w = await call("GET", "/board", { query: { scope: "week" } });
  assert.equal(w.body.weekId, "2026-W42");
  assert.equal(w.body.entries.length, 0);
  const all = await call("GET", "/board", { query: { scope: "all" } });
  assert.ok(all.body.entries.length >= 3);
  const r = await race(dev(5), "Nunu", 28);
  assert.deepEqual([r.body.week.rank, r.body.all.rank], [1, 4]);
});

test("ocean scores go on the ocean boards only", async () => {
  const s = await call("POST", "/start", { ip: "7.7.7.7" });
  clock += 30 * 1000;
  const r = await call("POST", "/submit", { ip: "7.7.7.7", body: { runId: s.body.runId, stage: "ocean", deviceId: dev(6), name: "Bubbles", time: 19.4, acorns: 60, bumps: 0 } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual([r.body.stage, r.body.week.rank, r.body.all.rank], ["ocean", 1, 1]);
  const sea = await call("GET", "/board", { query: { scope: "all", stage: "ocean" } });
  assert.deepEqual(sea.body.entries.map((e) => e.name), ["Bubbles"]);
  const land = await call("GET", "/board", { query: { scope: "all" } });
  assert.ok(!land.body.entries.some((e) => e.name === "Bubbles"));
  const bad = await call("GET", "/board", { query: { scope: "all", stage: "moon" } });
  assert.equal(bad.status, 400);
});

test("the board shows how each best was steered", async () => {
  await race(dev(7), "Tilty", 27, { control: "tilt", ip: "6.6.6.1" });
  await race(dev(8), "Keys", 27.5, { control: "keyboard", ip: "6.6.6.2" });
  await race(dev(9), "Oldie", 28.5, { ip: "6.6.6.3" });                       // older game version: no control sent
  await race(dev(10), "Odd", 29, { control: "gamepad", ip: "6.6.6.4" });      // unknown values are dropped, not refused
  await race(dev(7), "Tilty", 31, { control: "touch", ip: "6.6.6.1" });       // slower retry keeps the best's icon
  const b = await call("GET", "/board", { query: { scope: "week" } });
  const how = Object.fromEntries(b.body.entries.map((e) => [e.name, e.control]));
  assert.deepEqual([how.Tilty, how.Keys, how.Oldie, how.Odd], ["tilt", "keyboard", null, null]);
  await race(dev(7), "Tilty", 25, { control: "touch", ip: "6.6.6.1" });       // a new best brings its own icon
  const b2 = await call("GET", "/board", { query: { scope: "week" } });
  assert.equal(b2.body.entries.find((e) => e.name === "Tilty").control, "touch");
});

test("misses go below every catch, closest first, and a catch replaces a miss", async () => {
  const far = await race(dev(11), "Faraway", 30, { gap: 10, ip: "8.8.1.1" });
  assert.equal(far.status, 200, JSON.stringify(far.body));
  assert.deepEqual(far.body.week, { rank: 6, improved: true, caught: false, best: null, gap: 10 });   // five catches this week
  const near = await race(dev(12), "Nearly", 31, { gap: 4, ip: "8.8.1.2" });
  assert.deepEqual([near.body.week.rank, near.body.week.gap], [6, 4]);
  let b = await call("GET", "/board", { query: { scope: "week", deviceId: dev(11) } });
  assert.deepEqual(b.body.entries.slice(-3).map((e) => [e.rank, e.name, e.caught, e.gap, e.me]), [[5, "Odd", true, undefined, false], [6, "Nearly", false, 4, false], [7, "Faraway", false, 10, true]]);
  assert.equal(b.body.mine, undefined);                                          // already on the board: nothing to pin
  const worse = await race(dev(12), "Nearly", 31, { gap: 9, ip: "8.8.1.2" });    // a worse miss keeps the better one
  assert.deepEqual(worse.body.week, { rank: 6, improved: false, caught: false, best: null, gap: 4 });
  const caught = await race(dev(11), "Faraway", 40, { ip: "8.8.1.1" });          // slowest catch still beats the closest miss
  assert.deepEqual(caught.body.week, { rank: 6, improved: true, caught: true, best: 40 });
  const again = await race(dev(11), "Faraway", 30, { gap: 3, ip: "8.8.1.1" });   // and a later miss doesn't undo it
  assert.deepEqual(again.body.week, { rank: 6, improved: false, caught: true, best: 40 });
  b = await call("GET", "/board", { query: { scope: "week" } });
  assert.deepEqual(b.body.entries.slice(-2).map((e) => [e.name, e.caught, e.time, e.gap]), [["Faraway", true, 40, undefined], ["Nearly", false, 31, 4]]);
  const forged = await race(dev(13), "Sneaky", 30, { gap: 0.5, ip: "8.8.1.3" });
  assert.deepEqual([forged.status, forged.body.error], [400, "bad_gap"]);
});

test("your own entry comes back even when it is below the top of the board", async () => {
  for (let i = 0; i < RULES.boardSize + 2; i++) {
    const r = await race(dev(100 + i), `Miss${i}`, 24, { stage: "ocean", gap: 5 + i, ip: `8.9.0.${i}` });
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
  const last = dev(100 + RULES.boardSize + 1);
  const b = await call("GET", "/board", { query: { scope: "week", stage: "ocean", deviceId: last } });
  assert.equal(b.body.entries.length, RULES.boardSize);
  assert.deepEqual(b.body.entries.slice(0, 2).map((e) => [e.name, e.caught]), [["Bubbles", true], ["Miss0", false]]);   // this week's one ocean catch, then the misses
  assert.ok(b.body.entries.every((e) => !e.me));
  // Bubbles and 21 closer misses are ahead
  assert.deepEqual(b.body.mine, { rank: RULES.boardSize + 3, name: `Miss${RULES.boardSize + 1}`, caught: false, time: 24, gap: 5 + RULES.boardSize + 1, acorns: 40, control: null, country: null });
  const anon = await call("GET", "/board", { query: { scope: "week", stage: "ocean" } });
  assert.equal(anon.body.mine, undefined);
});

test("scores saved before misses existed still count as catches", async () => {
  const crypto = require("crypto");
  const id = crypto.createHash("sha256").update("test:" + dev(50)).digest("hex").slice(0, 32);
  await db.collection("bests").doc(`all_${id}`).set({ scope: "all", name: "Veteran", time: 20, acorns: 50, updatedAt: clock });   // no caught, no order
  const miss = await race(dev(50), "Veteran", 30, { gap: 3, ip: "8.8.2.1" });
  assert.deepEqual([miss.body.all.improved, miss.body.all.caught, miss.body.all.best], [false, true, 20]);
  assert.deepEqual([miss.body.week.improved, miss.body.week.caught, miss.body.week.gap], [true, false, 3]);
});

test("the board shows each player's country when the game sent one", async () => {
  await race(dev(60), "Seoulite", 33, { country: "KR", ip: "6.7.0.1" });
  await race(dev(61), "Nowhere", 33.5, { country: "ZZ", ip: "6.7.0.2" });       // not a country: dropped, score still counts
  await race(dev(62), "Oldgame", 34, { ip: "6.7.0.3" });                          // older game version: none sent
  let b = await call("GET", "/board", { query: { scope: "week" } });
  const where = () => Object.fromEntries(b.body.entries.map((e) => [e.name, e.country]));
  assert.deepEqual([where().Seoulite, where().Nowhere, where().Oldgame], ["KR", null, null]);
  await race(dev(60), "Seoulite", 32, { country: "JP", ip: "6.7.0.1" });          // a new best carries where it was set
  b = await call("GET", "/board", { query: { scope: "week" } });
  assert.equal(where().Seoulite, "JP");
});

test("rate limit kicks in for a flood from one IP", async () => {
  let last;
  for (let i = 0; i < 45; i++) last = await call("POST", "/start", { ip: "5.5.5.5" });
  assert.equal(last.status, 429);
});
