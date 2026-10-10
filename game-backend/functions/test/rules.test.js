const test = require("node:test");
const assert = require("node:assert");
const { weekId, scopeIds, checkScore, cleanName, cleanControl, RULES } = require("../lib/rules");

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
  assert.equal(checkScore({ time: 16, acorns: 10 }, 60).ok, true);   // quick but possible on the burrow
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
  assert.equal(checkScore({ time: 16, acorns: 80, stage: "burrow" }, 60).ok, true);       // fine in the burrow, too quick for the sea
  assert.equal(checkScore({ time: 16, acorns: 80, stage: "ocean" }, 60).reason, "implausible_time");
  assert.equal(checkScore({ time: 19, acorns: 96, stage: "ocean" }, 60).reason, "bad_acorns");
  assert.equal(checkScore({ time: 25, acorns: 1, stage: "sky" }, 60).reason, "bad_stage");
  assert.equal(checkScore({ time: 25, acorns: 1, stage: "__proto__" }, 60).reason, "bad_stage");
  const t = Date.UTC(2026, 9, 9, 12);
  assert.deepEqual(scopeIds("burrow", t), { week: "2026-W41", all: "all" });               // unchanged ids for existing scores
  assert.deepEqual(scopeIds("ocean", t), { week: "ocean:2026-W41", all: "ocean:all" });
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
