// Leaderboard client: talks to the `api` Cloud Function (see /game-backend). Only catches can be submitted.

// Set after the Firebase project is deployed, e.g. "https://us-central1-<project>.cloudfunctions.net/api".
const DEFAULT_API = "";
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
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "network"), { code: data.error || "network" });
  return data;
}

let run = null; // Promise<runId | null> for the race in progress
export function onRaceStart() {
  if (!enabled) return;
  run = call("POST", "/start").then((d) => d.runId).catch(() => null);
}

// ---------------- UI ----------------
const $ = (id) => document.getElementById(id);
let last = null;    // { caught, time, acorns, bumps }
let scope = "week";

export function initUI() {
  if (!enabled) return;
  $("boardBtn").hidden = false;
  $("boardBtn").onclick = () => openBoard("week");
  $("resultBoardBtn").onclick = () => openBoard("week");
  $("boardClose").onclick = () => $("board").classList.add("hide");
  $("tabWeek").onclick = () => openBoard("week");
  $("tabAll").onclick = () => openBoard("all");
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
    const r = await call("POST", "/submit", { runId, deviceId: deviceId(), name, time: Math.round(last.time * 100) / 100, acorns: last.acorns, bumps: last.bumps });
    store.set("miuu-name", name.trim());
    $("lbForm").hidden = true;
    note.textContent = "";
    $("lbRank").textContent = `#${r.week.rank} this week · #${r.all.rank} all-time` + (r.all.improved ? "" : ` (your best is ${r.all.best.toFixed(2)}s)`);
  } catch (e) {
    btn.disabled = false;
    note.textContent = MESSAGES[e.code] || "The leaderboard is offline right now";
    if (e.code === "run_used" || e.code === "too_fast_for_run" || e.code === "unknown_run") $("lbForm").hidden = true;
  }
}

async function openBoard(s) {
  scope = s;
  $("board").classList.remove("hide");
  $("tabWeek").classList.toggle("on", s === "week");
  $("tabAll").classList.toggle("on", s === "all");
  const list = $("boardList");
  list.replaceChildren(row("…", "Loading", "", ""));
  try {
    const d = await call("GET", `/board?scope=${s}&deviceId=${encodeURIComponent(deviceId())}`);
    if (scope !== s) return;
    if (!d.entries.length) {
      list.replaceChildren(empty(s === "week" ? "No catches yet this week. Be the first!" : "No catches yet. Be the first!"));
      return;
    }
    list.replaceChildren(...d.entries.map((e) => row(medal(e.rank), e.name, `${e.time.toFixed(2)}s`, `🌰 ${e.acorns}`, e.me)));
  } catch {
    list.replaceChildren(empty("The leaderboard is offline right now"));
  }
}

const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : String(r));
function row(rank, name, time, acorns, me = false) {
  const li = document.createElement("li");
  if (me) li.className = "me";
  for (const [cls, text] of [["rk", rank], ["nm", name], ["tm", time], ["ac", acorns]]) {
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text; // names are user text: never innerHTML
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
