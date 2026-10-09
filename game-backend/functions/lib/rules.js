// Pure leaderboard rules: score plausibility, nickname filter, week ids. No Firebase imports.

const RULES = {
  minTime: 21,          // the perfect-line test bot catches the squirrel in ~23.7s
  maxTime: 300,
  maxAcorns: 105,       // acorns placed on the burrow track
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

function checkScore({ time, acorns, bumps }, elapsedSec) {
  if (typeof time !== "number" || !Number.isFinite(time)) return { ok: false, reason: "bad_time" };
  if (!Number.isInteger(acorns) || acorns < 0 || acorns > RULES.maxAcorns) return { ok: false, reason: "bad_acorns" };
  if (bumps !== undefined && (!Number.isInteger(bumps) || bumps < 0 || bumps > 100)) return { ok: false, reason: "bad_bumps" };
  if (time < RULES.minTime || time > RULES.maxTime) return { ok: false, reason: "implausible_time" };
  // the race can't have taken longer than the time since this run's /start
  if (elapsedSec + RULES.tolerance < time + RULES.countdown) return { ok: false, reason: "too_fast_for_run" };
  return { ok: true, time: Math.round(time * 100) / 100 };
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

module.exports = { RULES, weekId, checkScore, cleanName, DEVICE_RE };
