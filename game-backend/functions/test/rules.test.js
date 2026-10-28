const test = require("node:test");
const assert = require("node:assert");
const { weekId, scopeIds, checkScore, cleanName, cleanControl, cleanCountry, RULES } = require("../lib/rules");

test("weekId follows ISO weeks in UTC", () => {
  assert.equal(weekId(Date.UTC(2026, 9, 9, 12)), "2026-W41");      // Fri Oct 9 2026
  assert.equal(weekId(Date.UTC(2026, 9, 12, 0, 0)), "2026-W42");   // Monday 00:00 UTC starts a new week
  assert.equal(weekId(Date.UTC(2026, 9, 11, 23, 59)), "2026-W41"); // Sunday night is still the old week
  assert.equal(weekId(Date.UTC(2021, 0, 1)), "2020-W53");          // Jan 1 can belong to last year's week
});

test("checkScore accepts a normal catch", () => {
  const r = checkScore({ time: 24.567, acorns: 60, bumps: 2 }, 32);
  assert.deepEqual(r, { ok: true, caught: true, time: 24.57, order: 24.57 });
});

test("checkScore rejects impossible or forged runs", () => {
  assert.equal(checkScore({ time: 12, acorns: 10 }, 60).reason, "implausible_time");
  assert.equal(checkScore({ time: 14.2, acorns: 10 }, 60).ok, true);   // quick but possible on the burrow
  assert.equal(checkScore({ time: 25, acorns: 999 }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: 25, acorns: 1.5 }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: "25", acorns: 1 }, 60).reason, "bad_time");
  assert.equal(checkScore({ time: NaN, acorns: 1 }, 60).reason, "bad_time");
  // claimed 25s race but only 20s passed since /start (plus the 3.2s countdown has to fit too)
  assert.equal(checkScore({ time: 25, acorns: 1 }, 20).reason, "too_fast_for_run");
  assert.equal(checkScore({ time: 25, acorns: 1 }, 25 + RULES.countdown - RULES.tolerance).ok, true);
});

test("each stage has its own limits and its own boards", () => {
  assert.equal(checkScore({ time: 24, acorns: 110 }, 60).ok, true);                       // burrow by default, all 110 acorns
  assert.equal(checkScore({ time: 24, acorns: 111 }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: 13, acorns: 80, stage: "ocean" }, 60).ok, true);        // fine in the sea, too quick for the burrow
  assert.equal(checkScore({ time: 13, acorns: 80, stage: "burrow" }, 60).reason, "implausible_time");
  assert.equal(checkScore({ time: 19, acorns: 96, stage: "ocean" }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: 18.4, acorns: 135, bumps: 23, stage: "sky" }, 60).ok, true);   // the sky's fastest line, every star
  assert.equal(checkScore({ time: 15, acorns: 40, stage: "sky" }, 60).reason, "implausible_time");   // the crow can't be caught that early
  assert.equal(checkScore({ time: 20, acorns: 136, stage: "sky" }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: 30, acorns: 20, stage: "sky", caught: false, gap: 16 }, 60).ok, true);
  assert.equal(checkScore({ time: 15.1, acorns: 140, bumps: 30, stage: "halloween" }, 60).ok, true);   // the fastest line, every candy
  assert.equal(checkScore({ time: 12, acorns: 40, stage: "halloween" }, 60).reason, "implausible_time");   // the ghost can't be caught that early
  assert.equal(checkScore({ time: 20, acorns: 141, stage: "halloween" }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: 32, acorns: 20, stage: "halloween", caught: false, gap: 34 }, 60).ok, true);
  assert.equal(checkScore({ time: 25, acorns: 1, stage: "moon" }, 60).reason, "bad_stage");
  assert.equal(checkScore({ time: 25, acorns: 1, stage: "__proto__" }, 60).reason, "bad_stage");
  const t = Date.UTC(2026, 9, 9, 12);
  assert.deepEqual(scopeIds("burrow", t), { week: "2026-W41", all: "all" });               // unchanged ids for existing scores
  assert.deepEqual(scopeIds("ocean", t), { week: "ocean:2026-W41", all: "ocean:all" });
  assert.deepEqual(scopeIds("sky", t), { week: "sky:2026-W41", all: "sky:all" });
});

test("cleanName keeps friendly names", () => {
  for (const n of ["Kiki", "민지", "ねこ 好き", "Grape", "Peacock_7", "Essex", "Ana-Lu", "🐿️ fan", "O'Neil"]) {
    assert.equal(cleanName(n).ok, true, n);
  }
  assert.equal(cleanName("  Sleepy   Acorn ").name, "Sleepy Acorn");
});

test("cleanName blocks abuse, impersonation and junk", () => {
  assert.equal(cleanName("f.u.c.k").reason, "name_blocked");
  assert.equal(cleanName("sh1t head").reason, "name_blocked");
  assert.equal(cleanName("씨발").reason, "name_blocked");
  assert.equal(cleanName("MiuuStudio").reason, "name_reserved");
  assert.equal(cleanName("Miuu Note").reason, "name_reserved");
  assert.equal(cleanName("a").reason, "name_too_short");
  assert.equal(cleanName("abcdefghijklm").reason, "name_too_long");
  assert.equal(cleanName("<script>").reason, "name_chars");
  assert.equal(cleanName("a‮b‮c").name, "abc");
  assert.equal(cleanName(42).reason, "name_missing");
});

test("cleanControl keeps the three known controls and drops everything else", () => {
  assert.deepEqual(["tilt", "touch", "keyboard"].map(cleanControl), ["tilt", "touch", "keyboard"]);
  for (const bad of [undefined, null, "", "Tilt", "gamepad", "__proto__", 1, ["tilt"], { control: "tilt" }]) assert.equal(cleanControl(bad), null);
});

test("checkScore takes misses, which always sort below catches", () => {
  const miss = checkScore({ time: 29.4, acorns: 30, bumps: 4, caught: false, gap: 6.126 }, 40);
  assert.deepEqual(miss, { ok: true, caught: false, time: 29.4, gap: 6.13, order: 1006.13 });
  const slowestCatch = checkScore({ time: RULES.maxTime, acorns: 1 }, 400);
  const closestMiss = checkScore({ time: 30, acorns: 1, caught: false, gap: RULES.minGap }, 40);
  assert.ok(slowestCatch.order < closestMiss.order);
  assert.ok(closestMiss.order < miss.order);                                    // closer misses rank higher
  for (const gap of [undefined, null, "6", NaN, 1.9, -5, 1091]) assert.equal(checkScore({ time: 30, acorns: 1, caught: false, gap }, 40).reason, "bad_gap", String(gap));
  assert.equal(checkScore({ time: 30, acorns: 1, caught: false, gap: 1090 }, 40).ok, true);     // still at the start line when it escaped
  assert.equal(checkScore({ time: 30, acorns: 1, caught: false, gap: 941, stage: "ocean" }, 40).reason, "bad_gap");
  // the thief needs a while to reach its escape point, longer in the burrow than in the sea
  assert.equal(checkScore({ time: 22, acorns: 1, caught: false, gap: 5 }, 40).reason, "implausible_time");
  assert.equal(checkScore({ time: 22, acorns: 1, caught: false, gap: 5, stage: "ocean" }, 40).ok, true);
  assert.equal(checkScore({ time: 30, acorns: 1, caught: false, gap: 5 }, 20).reason, "too_fast_for_run");
  for (const caught of ["no", 0, null]) assert.equal(checkScore({ time: 30, acorns: 1, caught, gap: 5 }, 40).reason, "bad_result");
  assert.equal(checkScore({ time: 24, acorns: 1, gap: 5 }, 40).caught, true);  // older game versions send no `caught`: a catch
});

test("cleanCountry keeps real two-letter country codes and drops everything else", () => {
  assert.deepEqual(["KR", "US", "GB", "AQ"].map(cleanCountry), ["KR", "US", "GB", "AQ"]);
  for (const bad of [undefined, null, "", "kr", "KOR", "ZZ", "XX", "U", "__proto__", "constructor", 82, ["KR"]]) assert.equal(cleanCountry(bad), null, String(bad));
});
