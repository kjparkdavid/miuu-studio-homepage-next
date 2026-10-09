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
async function race(device, name, time, { acorns = 40, wait = time + 6, ip } = {}) {
  const s = await call("POST", "/start", { ip });
  clock += wait * 1000;
  return call("POST", "/submit", { ip, body: { runId: s.body.runId, deviceId: device, name, time, acorns, bumps: 1 } });
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

test("rate limit kicks in for a flood from one IP", async () => {
  let last;
  for (let i = 0; i < 45; i++) last = await call("POST", "/start", { ip: "5.5.5.5" });
  assert.equal(last.status, 429);
});
