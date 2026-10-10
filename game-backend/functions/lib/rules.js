// Pure leaderboard rules: score plausibility, nickname filter, week ids. No Firebase imports.

// Per-stage limits. minTime sits a little under what the perfect-line test bot manages on that stage.
// A miss ends when the thief reaches its escape point: minMissTime sits a little under the soonest
// that can happen (thief at full pace with the player right behind it), and maxGap is the escape
// point itself, the furthest behind anyone can be.
const STAGES = {
  burrow: { minTime: 14, maxItems: 110, minMissTime: 25, maxGap: 1090 },     // bot: ~16.4s; 110 acorns; escape at 28.0s, 1086 units in
  ocean: { minTime: 14.5, maxItems: 95, minMissTime: 21, maxGap: 940 },      // bot: ~16.9s; 95 starfish; escape at 23.1s, 938 units in
};

const RULES = {
  maxTime: 300,
  minGap: 2,            // the game counts anything closer than this as a catch
  missBase: 1000,       // board order: a catch sorts by its time, a miss by missBase + gap, so below every catch
  countdown: 3.2,       // always shown between /start and the race clock starting
  tolerance: 1.5,       // seconds of slack for clocks / network
  nameMin: 2,
  nameMax: 12,
  boardSize: 20,
};

// ISO-8601 week id in UTC, e.g. "2026-W41". Weeks start Monday 00:00 UTC.
function weekId(ms) {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7; // Mon=0
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = 1 + Math.floor((thursday - yearStart) / (7 * 86400000));
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const round2 = (n) => Math.round(n * 100) / 100;

// `caught` is left out by game versions from before misses could be added: those only sent catches.
// For a miss, `time` is how long the chase lasted and `gap` how far ahead the thief was when it escaped.
function checkScore({ time, acorns, bumps, stage = "burrow", caught = true, gap }, elapsedSec) {
  if (typeof stage !== "string" || !Object.hasOwn(STAGES, stage)) return { ok: false, reason: "bad_stage" };
  const st = STAGES[stage];
  if (typeof caught !== "boolean") return { ok: false, reason: "bad_result" };
  if (typeof time !== "number" || !Number.isFinite(time)) return { ok: false, reason: "bad_time" };
  if (!Number.isInteger(acorns) || acorns < 0 || acorns > st.maxItems) return { ok: false, reason: "bad_acorns" };
  if (bumps !== undefined && (!Number.isInteger(bumps) || bumps < 0 || bumps > 100)) return { ok: false, reason: "bad_bumps" };
  if (!caught && (typeof gap !== "number" || !Number.isFinite(gap) || gap < RULES.minGap || gap > st.maxGap)) return { ok: false, reason: "bad_gap" };
  if (time < (caught ? st.minTime : st.minMissTime) || time > RULES.maxTime) return { ok: false, reason: "implausible_time" };
  // the race can't have taken longer than the time since this run's /start
  if (elapsedSec + RULES.tolerance < time + RULES.countdown) return { ok: false, reason: "too_fast_for_run" };
  const t = round2(time);
  if (caught) return { ok: true, caught, time: t, order: t };
  return { ok: true, caught, time: t, gap: round2(gap), order: round2(RULES.missBase + gap) };
}

// Words are matched after lowercasing, undoing common leetspeak and dropping spaces/punctuation.
const BLOCKED = [
  // substring match, so skip words hiding inside innocent ones (grape, peacock, Essex)
  "fuck", "shit", "bitch", "cunt", "dick", "pussy", "nigg", "faggot", "slut", "whore", "rapist",
  "nazi", "hitler", "porn", "penis", "vagina", "asshole", "bastard", "retard",
  "씨발", "시발", "ㅅㅂ", "ㅆㅂ", "병신", "ㅂㅅ", "좆", "개새", "새끼", "지랄", "꺼져", "미친", "섹스", "보지", "자지", "니미", "애미", "느금",
];
const RESERVED = ["miuustudio", "miuunote", "official", "admin", "moderator"];
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", "@": "a", $: "s", "!": "i" };

const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;
const graphemes = (s) => (segmenter ? [...segmenter.segment(s)].length : [...s].length);

function cleanName(raw) {
  if (typeof raw !== "string") return { ok: false, reason: "name_missing" };
  let name = raw.normalize("NFKC").replace(/[​-‏‪-‮⁠-⁯﻿]/g, "");
  name = name.replace(/\s+/g, " ").trim();
  const n = graphemes(name);
  if (n < RULES.nameMin) return { ok: false, reason: "name_too_short" };
  if (n > RULES.nameMax) return { ok: false, reason: "name_too_long" };
  if (!/^[\p{L}\p{M}\p{N}\p{Extended_Pictographic}‍️ _.\-']+$/u.test(name)) return { ok: false, reason: "name_chars" };
  const squashed = [...name.toLowerCase()].map((c) => LEET[c] ?? c).join("").replace(/[\s_.\-']/g, "");
  if (BLOCKED.some((w) => squashed.includes(w))) return { ok: false, reason: "name_blocked" };
  if (RESERVED.some((w) => squashed.includes(w))) return { ok: false, reason: "name_reserved" };
  return { ok: true, name };
}

const DEVICE_RE = /^[A-Za-z0-9-]{16,64}$/;

// How the player steered, shown as an icon next to their time. Self-reported and optional: older
// game versions don't send it, and anything unexpected is dropped rather than refused.
const CONTROLS = ["tilt", "touch", "keyboard"];
const cleanControl = (raw) => (typeof raw === "string" && CONTROLS.includes(raw) ? raw : null);

// The player's country, shown as a flag. The game works it out on the device from its time zone and
// sends only the two-letter code; like the control it is self-reported, optional, and dropped when it
// isn't one of the ISO 3166 codes.
const COUNTRIES = new Set("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" "));
const cleanCountry = (raw) => (typeof raw === "string" && COUNTRIES.has(raw) ? raw : null);

// Board scope ids. The burrow keeps its original ids ("all", "2026-W41"); other stages are prefixed.
function scopeIds(stage, ms) {
  const pre = stage === "burrow" ? "" : stage + ":";
  return { week: pre + weekId(ms), all: pre + "all" };
}

module.exports = { RULES, STAGES, CONTROLS, weekId, scopeIds, checkScore, cleanName, cleanControl, cleanCountry, DEVICE_RE };
