// Leaderboard client: talks to the `api` Cloud Function (see /game-backend). Any finished race can be
// added: catches rank by time, misses below them by how far ahead the thief was when it got away.

// Firebase project miuu-diary-chase, function `api` (see /game-backend).
import { track } from "./analytics.js";
import { detectCountry, flag, countryName } from "./countries.js";

const DEFAULT_API = "https://us-central1-miuu-diary-chase.cloudfunctions.net/api";
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const API = (local && new URLSearchParams(location.search).get("api")) || DEFAULT_API;
export const enabled = !!API;

const MESSAGES = {
  name_blocked: "Let's pick a kinder name 💜",
  name_reserved: "That name is reserved, try another",
  name_too_short: "Name needs at least 2 characters",
  name_too_long: "Name can be up to 12 characters",
  name_chars: "Letters, numbers and emoji only",
  name_missing: "Type a name first",
  too_fast_for_run: "We couldn't verify this run",
  implausible_time: "We couldn't verify this run",
  bad_gap: "We couldn't verify this run",
  run_used: "This run is already on the board",
  unknown_run: "We couldn't verify this run",
  slow_down: "Too many tries. Take a breather and try again",
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
function deviceId() {
  let id = store.get("miuu-device");
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^A-Za-z0-9-]/g, "");
    store.set("miuu-device", id);
  }
  return id;
}

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    cache: "no-store", // the board must show your new score right after submitting; the server caches instead
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "network"), { code: data.error || "network" });
  return data;
}

let stage = "burrow";   // which stage's board we read and write
let item = "🌰";        // what that stage's pickups look like
export function setStage(id, itemEmoji = "🌰") { stage = id; item = itemEmoji; }

let run = null; // Promise<runId | null> for the race in progress
export function onRaceStart() {
  if (!enabled) return;
  run = call("POST", "/start").then((d) => d.runId).catch(() => null);
}

// ---------------- UI ----------------
const $ = (id) => document.getElementById(id);
let last = null;    // { caught, time, gap (misses only), acorns, bumps, control }
const views = {};   // list element id -> scope currently shown (ignores stale responses)

export function initUI() {
  if (!enabled) return;
  $("boardBtn").hidden = false;
  $("boardBtn").onclick = () => openBoard("week");
  $("boardClose").onclick = () => $("board").classList.add("hide");
  $("tabWeek").onclick = () => openBoard("week");
  $("tabAll").onclick = () => openBoard("all");
  $("rTabWeek").onclick = () => showBoard("rBoardList", "rTabWeek", "rTabAll", "week");
  $("rTabAll").onclick = () => showBoard("rBoardList", "rTabWeek", "rTabAll", "all");
  $("lbForm").addEventListener("submit", (e) => { e.preventDefault(); submit(); });
}

export function showResult(result) {
  last = result;
  if (!enabled) return;
  $("lbBox").hidden = false;
  $("lbForm").hidden = false;
  $("lbNote").textContent = "";
  $("lbRank").textContent = "";
  $("lbName").value = store.get("miuu-name") || "";
  $("lbSend").disabled = false;
  // desktop: put the cursor in the name box (on phones that would pop the keyboard over the board)
  if (!matchMedia("(pointer: coarse)").matches) setTimeout(() => $("lbName").focus(), 50);
  showBoard("rBoardList", "rTabWeek", "rTabAll", "week");
}

async function submit() {
  if (!last) return;
  const name = $("lbName").value;
  const btn = $("lbSend"), note = $("lbNote");
  btn.disabled = true;
  note.textContent = "Saving…";
  try {
    const runId = await run;
    if (!runId) throw Object.assign(new Error("network"), { code: "network" });
    const score = { time: Math.round(last.time * 100) / 100, caught: last.caught, ...(last.caught ? {} : { gap: Math.round(last.gap * 100) / 100 }) };
    const r = await call("POST", "/submit", { runId, stage, deviceId: deviceId(), name, ...score, acorns: last.acorns, bumps: last.bumps, control: last.control, country: detectCountry() || undefined });
    store.set("miuu-name", name.trim());
    track("leaderboard_submit", { stage, result: last.caught ? "caught" : "escaped", rank_week: r.week.rank, rank_all: r.all.rank });   // ranks only, never the nickname
    $("lbForm").hidden = true;
    note.textContent = "";
    // one entry per player per board, their best: a run that beats neither changes nothing, so say so plainly
    const mark = (b) => (b.caught === false ? `${metres(b.gap)} m behind` : `${b.best.toFixed(2)}s`);
    $("lbRank").textContent = (r.week.improved || r.all.improved ? "Saved! " : `Your best stays ${mark(r.week)} · `) + `#${r.week.rank} this week · #${r.all.rank} all-time`;
    showBoard("rBoardList", "rTabWeek", "rTabAll", views.rBoardList || "week", true);
  } catch (e) {
    btn.disabled = false;
    note.textContent = MESSAGES[e.code] || "The leaderboard is offline right now";
    if (e.code === "run_used" || e.code === "too_fast_for_run" || e.code === "unknown_run") $("lbForm").hidden = true;
  }
}

function openBoard(s) {
  if ($("board").classList.contains("hide")) track("leaderboard_open", { stage });
  $("board").classList.remove("hide");
  showBoard("boardList", "tabWeek", "tabAll", s);
}

// reveal: scroll the list to the player's own row (used right after they add a score)
async function showBoard(listId, weekTab, allTab, s, reveal = false) {
  views[listId] = s;
  $(weekTab).classList.toggle("on", s === "week");
  $(allTab).classList.toggle("on", s === "all");
  const list = $(listId);
  if (!list.children.length || list.dataset.stage !== stage) list.replaceChildren(row("…", "Loading"));
  list.dataset.stage = stage;
  try {
    const d = await call("GET", `/board?scope=${s}&stage=${stage}&deviceId=${encodeURIComponent(deviceId())}`);
    if (views[listId] !== s) return;
    if (!d.entries.length) {
      list.replaceChildren(empty(s === "week" ? "Nobody on the board yet this week. Be the first!" : "Nobody on the board yet. Be the first!"));
      return;
    }
    const rows = [];
    const add = (e, rank, me) => rows.push(row(rank, e.name, e.control, score(e), `${item} ${e.acorns}`, me, e.country));
    d.entries.forEach((e, i) => {
      // catches come first; this line marks where the misses start
      if (e.caught === false && (i === 0 || d.entries[i - 1].caught !== false)) rows.push(divider("Almost caught it · how far behind"));
      add(e, medal(e.rank), e.me);
    });
    if (d.mine) { rows.push(divider("⋯")); add(d.mine, String(d.mine.rank), true); }   // your own entry, further down than the board shows
    list.replaceChildren(...rows);
    const me = reveal && list.querySelector(".me");
    if (me) list.scrollTop += Math.max(0, me.getBoundingClientRect().bottom - list.getBoundingClientRect().bottom);
  } catch {
    list.replaceChildren(empty("The leaderboard is offline right now"));
  }
}

const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : String(r));
const metres = (gap) => Math.max(1, Math.round(gap * 2));   // same rounding as "It was 12 m ahead" on the result card
const score = (e) => (e.caught === false ? `💨 ${metres(e.gap)} m` : `${e.time.toFixed(2)}s`);
// How each score was steered. Scores saved before this was recorded have no icon.
const CONTROLS = { tilt: ["📱", "Tilt"], touch: ["👆", "Touch"], keyboard: ["⌨️", "Keyboard"] };
function row(rank, name, control, time = "", acorns = "", me = false, country = null) {
  const li = document.createElement("li");
  if (me) li.className = "me";
  const [icon, label] = CONTROLS[control] || ["", ""];
  const labels = { fl: flag(country) && countryName(country), ct: label };   // the two picture-only cells
  for (const [cls, text] of [["rk", rank], ["fl", flag(country)], ["nm", name], ["ct", icon], ["tm", time], ["ac", acorns]]) {
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text; // names are user text: never innerHTML
    if (labels[cls]) { span.title = labels[cls]; span.setAttribute("role", "img"); span.setAttribute("aria-label", labels[cls]); }
    li.append(span);
  }
  return li;
}
function empty(text) {
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = text;
  return li;
}
function divider(text) {
  const li = document.createElement("li");
  li.className = "sep";
  li.textContent = text;
  return li;
}
