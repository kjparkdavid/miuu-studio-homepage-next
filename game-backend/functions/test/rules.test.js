const test = require("node:test");
const assert = require("node:assert");
const { weekId, checkScore, cleanName, RULES } = require("../lib/rules");

test("weekId follows ISO weeks in UTC", () => {
  assert.equal(weekId(Date.UTC(2026, 9, 9, 12)), "2026-W41");      // Fri Oct 9 2026
  assert.equal(weekId(Date.UTC(2026, 9, 12, 0, 0)), "2026-W42");   // Monday 00:00 UTC starts a new week
  assert.equal(weekId(Date.UTC(2026, 9, 11, 23, 59)), "2026-W41"); // Sunday night is still the old week
  assert.equal(weekId(Date.UTC(2021, 0, 1)), "2020-W53");          // Jan 1 can belong to last year's week
});

test("checkScore accepts a normal catch", () => {
  const r = checkScore({ time: 24.567, acorns: 60, bumps: 2 }, 32);
  assert.deepEqual(r, { ok: true, time: 24.57 });
});

test("checkScore rejects impossible or forged runs", () => {
  assert.equal(checkScore({ time: 12, acorns: 10 }, 60).reason, "implausible_time");
  assert.equal(checkScore({ time: 25, acorns: 999 }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: 25, acorns: 1.5 }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: "25", acorns: 1 }, 60).reason, "bad_time");
  assert.equal(checkScore({ time: NaN, acorns: 1 }, 60).reason, "bad_time");
  // claimed 25s race but only 20s passed since /start (plus the 3.2s countdown has to fit too)
  assert.equal(checkScore({ time: 25, acorns: 1 }, 20).reason, "too_fast_for_run");
  assert.equal(checkScore({ time: 25, acorns: 1 }, 25 + RULES.countdown - RULES.tolerance).ok, true);
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
