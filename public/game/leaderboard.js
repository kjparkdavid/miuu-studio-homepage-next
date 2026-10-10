// Leaderboard client: talks to the `api` Cloud Function (see /game-backend). Only catches can be submitted.

// Firebase project miuu-diary-chase, function `api` (see /game-backend).
import { track } from "./analytics.js";

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
let last = null;    // { caught, time, acorns, bumps, control }
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
  const form = $("lbForm");
  form.hidden = !result.caught;
  $("lbNote").textContent = result.caught ? "" : "Catch the squirrel to get on the leaderboard 🏆";
  $("lbRank").textContent = "";
  $("lbName").value = store.get("miuu-name") || "";
  $("lbSend").disabled = false;
  // desktop: put the cursor in the name box (on phones that would pop the keyboard over the board)
  if (result.caught && !matchMedia("(pointer: coarse)").matches) setTimeout(() => $("lbName").focus(), 50);
  showBoard("rBoardList", "rTabWeek", "rTabAll", "week");
}

async function submit() {
  if (!last || !last.caught) return;
  const name = $("lbName").value;
  const btn = $("lbSend"), note = $("lbNote");
  btn.disabled = true;
  note.textContent = "Saving…";
  try {
    const runId = await run;
    if (!runId) throw Object.assign(new Error("network"), { code: "network" });
    const r = await call("POST", "/submit", { runId, stage, deviceId: deviceId(), name, time: Math.round(last.time * 100) / 100, acorns: last.acorns, bumps: last.bumps, control: last.control });
    store.set("miuu-name", name.trim());
    track("leaderboard_submit", { stage, rank_week: r.week.rank, rank_all: r.all.rank });   // ranks only, never the nickname
    $("lbForm").hidden = true;
    note.textContent = "";
    $("lbRank").textContent = `#${r.week.rank} this week · #${r.all.rank} all-time` + (r.all.improved ? "" : ` (your best is ${r.all.best.toFixed(2)}s)`);
    showBoard("rBoardList", "rTabWeek", "rTabAll", views.rBoardList || "week");
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

async function showBoard(listId, weekTab, allTab, s) {
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
      list.replaceChildren(empty(s === "week" ? "No catches yet this week. Be the first!" : "No catches yet. Be the first!"));
      return;
    }
    list.replaceChildren(...d.entries.map((e) => row(medal(e.rank), e.name, e.control, `${e.time.toFixed(2)}s`, `${item} ${e.acorns}`, e.me)));
  } catch {
    list.replaceChildren(empty("The leaderboard is offline right now"));
  }
}

const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : String(r));
// How each score was steered. Scores saved before this was recorded have no icon.
const CONTROLS = { tilt: ["📱", "Tilt"], touch: ["👆", "Touch"], keyboard: ["⌨️", "Keyboard"] };
function row(rank, name, control, time = "", acorns = "", me = false) {
  const li = document.createElement("li");
  if (me) li.className = "me";
  const [icon, label] = CONTROLS[control] || ["", ""];
  for (const [cls, text] of [["rk", rank], ["nm", name], ["ct", icon], ["tm", time], ["ac", acorns]]) {
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text; // names are user text: never innerHTML
    if (cls === "ct" && label) { span.title = label; span.setAttribute("role", "img"); span.setAttribute("aria-label", label); }
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
