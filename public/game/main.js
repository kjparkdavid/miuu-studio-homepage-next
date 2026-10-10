import { W, H, S, WW, loadImages, outlinedText, drawSprite } from "./renderer.js";
import { STAGES, STAGE_ORDER } from "./stages.js";
import { mulberry32 } from "./track.js";
import { Tilt, TouchKeys } from "./input.js";
import { sfx } from "./sfx.js";
import * as lb from "./leaderboard.js";
import { track, trackPageView, storeLink, shareUrl, share, challengeTime } from "./analytics.js";

// ---------------- tuning (a stage can override any of these in its `tune`) ----------------
const T_BASE = {
  baseSpeed: 38,          // segments / second at speed profile 1.0
  steerRate: 2300,        // world units / second at full lock
  centrifugal: 300,       // world units / second per unit of curve
  offroadMult: 0.6,
  boostAdd: 0.45,         // +45% speed while boosting
  boostTime: 1.4,
  acornsPerBoost: 8,
  bumpSlow: 0.45,
  squirrelPace: 1.2,      // squirrel speed vs. the player's clean cruising speed
  squirrelTired: 0.65,    // multiplier once the squirrel reaches the warp tunnel
  squirrelRubber: 0.22,   // how much the thief eases off when it is far ahead (0 = never)
  squirrelStartGap: 9,
  catchGap: 2,
  levelHorizon: 0.5,      // tilt mode: how much the scene counter-rotates to stay level
};
const T = { ...T_BASE };

const params = new URLSearchParams(location.search);
// Every stage in STAGE_ORDER is offered on the start screen. (?stage=ocean still jumps straight to one.)
const OCEAN_PUBLIC = true;
let ST = STAGES[params.get("stage")] || STAGES.burrow;
// A shared link carries the sender's catch time to beat (?b=24.3) for the stage it opens.
const challenge = challengeTime() ? { time: challengeTime(), stage: ST.id } : null;
const DEBUG = params.has("debug");
let BOT = Number(params.get("bot") || 0);   // 1 = center line, 2 = racing line (debug only)

// ---------------- setup ----------------
const stage = document.getElementById("stage");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const ui = {
  title: document.getElementById("title"),
  start: document.getElementById("startBtn"),
  modeTilt: document.getElementById("modeTilt"),
  modeTouch: document.getElementById("modeTouch"),
  modeNote: document.getElementById("modeNote"),
  result: document.getElementById("result"),
  resultTitle: document.getElementById("resultTitle"),
  resultSub: document.getElementById("resultSub"),
  resultImg: document.getElementById("resultImg"),
  resultStats: document.getElementById("resultStats"),
  again: document.getElementById("againBtn"),
  mute: document.getElementById("muteBtn"),
  toast: document.getElementById("toast"),
  loading: document.getElementById("loading"),
  stagePick: document.getElementById("stagePick"),
  mapRow: document.getElementById("mapRow"),
  share: document.getElementById("shareBtn"),
  appLink: document.getElementById("appLink"),
  tagline: document.getElementById("tagline"),
};

const tilt = new Tilt();
const touch = new TouchKeys(canvas, () => requestBoost());
const isTouchDevice = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
let mode = isTouchDevice && Tilt.supported() ? "tilt" : "touch";
let renderScale = 1;
let qualityCap = 2;   // lowered automatically if frames take too long

function setMode(m) {
  mode = m;
  ui.modeTilt.classList.toggle("on", m === "tilt");
  ui.modeTouch.classList.toggle("on", m === "touch");
  ui.modeNote.textContent = m === "tilt"
    ? "Hold your phone like a steering wheel and turn it."
    : isTouchDevice ? "Drag sideways, or put two thumbs down and twist." : "Use ← → (or A / D). Space to boost.";
}
ui.modeTilt.onclick = () => setMode("tilt");
ui.modeTouch.onclick = () => setMode("touch");
if (!Tilt.supported()) ui.modeTilt.disabled = true;
setMode(mode);

function toast(msg, ms = 2600) {
  ui.toast.textContent = msg;
  ui.toast.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => ui.toast.classList.remove("show"), ms);
}

// Fit a 9:16 stage into the viewport. If the OS auto-rotates mid-race, counter-rotate so the
// game stays glued to the phone (the phone *is* the wheel).
function layout() {
  let ang = 0;
  if (state.phase !== "title" && mode === "tilt") {
    ang = screen.orientation && typeof screen.orientation.angle === "number" ? screen.orientation.angle : (window.orientation || 0);
    ang = ((ang % 360) + 360) % 360;
  }
  const vw = window.innerWidth, vh = window.innerHeight;
  const swap = ang === 90 || ang === 270;
  const availW = swap ? vh : vw, availH = swap ? vw : vh;
  const scale = Math.min(availW / W, availH / H);
  const cw = Math.round(W * scale), ch = Math.round(H * scale);
  stage.style.width = cw + "px";
  stage.style.height = ch + "px";
  stage.style.transform = `translate(-50%, -50%) rotate(${-ang}deg)`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderScale = Math.min(qualityCap, (cw * dpr) / W);
  const bw = Math.round(W * renderScale), bh = Math.round(H * renderScale);
  if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
}
window.addEventListener("resize", layout);
window.addEventListener("orientationchange", () => setTimeout(layout, 120));

// ---------------- intro clip (packed frames; iPhone can't play transparent WebM) ----------------
const intros = {};            // stage id -> { img, frames, order, fps, dur, played }
let intro = null;             // the current stage's intro, once loaded
function loadIntro(st) {
  if (intros[st.id]) { intro = intros[st.id].img ? intros[st.id] : null; return; }
  const entry = (intros[st.id] = { played: false });
  intro = null;
  const img = new Image();
  const data = fetch(st.intro + ".json").then((r) => r.json());
  const pic = new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = st.intro + ".webp"; });
  Promise.all([data, pic]).then(([d]) => {
    Object.assign(entry, { img, ...d, dur: d.order.length / d.fps });
    if (ST === st) intro = entry;
  }).catch(() => {});
}
const WHEEL_SLIDE = 0.45;

// ---------------- game state ----------------
const state = { phase: "loading" };
let gp = ST.buildGameplay();
let best = null;
function loadBest() {
  best = null;
  try { best = JSON.parse(localStorage.getItem(`miuu-${ST.id}-best`) || "null"); } catch {}
}

function reset() {
  gp = ST.buildGameplay();
  for (const p of ST.pads) p.used = false;
  Object.assign(state, {
    phase: "countdown", t: 0, phaseT: 0, raceT: 0,
    pos: 0, speed: 0, camX: 0, steer: 0, wheelDeg: 0,
    pitch: 0, lean: 0, yaw: 0, shake: 0, stun: 0,
    boostT: 0, boostE: 0, meter: 0, acorns: 0, bumps: 0,
    sqPos: T.squirrelStartGap, sqSpeed: 0, sqX: 0, sqRun: 0, caught: false, escaped: false,
    pop: [], flyers: [], banner: null, zoneShown: "", finishT: 0, offroad: false, hb: null, lastResult: null,
  });
  ST.onReset(state);
}

// How many races this device has started on the current stage (for "tries until the first win").
function nextAttempt() {
  let n = 1;
  try { n = (Number(localStorage.getItem(`miuu-plays-${ST.id}`)) || 0) + 1; localStorage.setItem(`miuu-plays-${ST.id}`, String(n)); } catch {}
  return n;
}
function beginRace() {
  reset();
  state.attempt = nextAttempt();
  lb.onRaceStart();
  track("game_start", { stage: ST.id, control: mode, attempt: state.attempt });
}

function requestBoost() {
  if (state.phase !== "play" || state.caught || state.escaped) return;
  if (state.meter >= T.acornsPerBoost) {
    state.meter = 0;
    startBoost("Boost!");
  }
}
function startBoost(label) {
  state.boostT = T.boostTime;
  banner(label, 1.0);
  sfx.boost();
  vibrate(30);
}
function banner(text, dur = 1.2, size = 64) { state.banner = { text, t: 0, dur, size }; }
function vibrate(ms) {
  try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch {}
}

// ---------------- start flow ----------------
ui.start.addEventListener("click", () => {
  // iOS: the motion permission prompt must be requested directly inside the tap.
  const perm = mode === "tilt" ? tilt.requestPermission() : Promise.resolve(false);
  sfx.unlock();
  tryFullscreenPortrait();
  perm.then(async (ok) => {
    if (mode === "tilt") {
      let result = ok ? "granted" : "denied";
      if (ok) { tilt.start(); ok = await tilt.waitForData(); if (!ok) result = "no_data"; }
      track("tilt_permission", { result });
      if (!ok) { setMode("touch"); toast("Motion sensor not available, so touch steering is on."); }
    }
    ui.title.classList.add("hide");
    beginRace();
    if (intro && !intro.played) { intro.played = true; state.phase = "intro"; }
    layout();
  });
});
ui.again.addEventListener("click", () => {
  ui.result.classList.add("hide");
  track("play_again", { stage: ST.id });
  beginRace();
  layout();
});
ui.share.addEventListener("click", async () => {
  const r = state.lastResult;
  if (!r) return;
  const tx = ST.text;
  const text = r.caught
    ? `I caught the ${tx.thief} in ${r.time.toFixed(1)}s in Miuu's Diary Chase ${tx.thiefEmoji} Can you beat me?`
    : `The ${tx.thief} got away with Miuu's diary ${tx.thiefEmoji} Can you catch it?`;
  const method = await share({ text, url: shareUrl(ST.id, r.caught ? r.time : null) });
  if (method === "copy") toast("Link copied! Paste it to a friend.");
  if (method) track("share", { stage: ST.id, method, result: r.caught ? "caught" : "escaped" });
});
{
  // "Get the Miuu Note app" goes straight to this phone's store, credited to the game
  const link = storeLink();
  ui.appLink.href = link.href;
  if (link.store) {
    ui.appLink.target = "_blank";
    ui.appLink.rel = "noopener";   // no noreferrer: App Store Connect credits miuunote.site as the web referrer
    ui.appLink.addEventListener("click", () => track("store_click", { store: link.store, placement: "game" }));
  }
}
canvas.addEventListener("pointerdown", () => {
  if (state.phase === "intro" && intro && state.phaseT < intro.dur) state.phaseT = intro.dur;   // tap to skip
});
ui.mute.addEventListener("click", () => { sfx.muted = !sfx.muted; ui.mute.textContent = sfx.muted ? "🔇" : "🔊"; });

function tryFullscreenPortrait() {
  // Android only: lock portrait so big turns can't flip the screen. iOS ignores this.
  if (!/Android/i.test(navigator.userAgent)) return;
  const el = document.documentElement;
  if (!el.requestFullscreen) return;
  el.requestFullscreen({ navigationUI: "hide" })
    .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock("portrait"))
    .catch(() => {});
}

// ---------------- update ----------------
const COUNT = 3.2;
function update(dt) {
  const s = state;
  s.t += dt; s.phaseT += dt;

  // steering input
  let target = 0;
  if (mode === "tilt") target = tilt.steer();
  else target = touch.touching() ? touch.touchSteer() : touch.keyboardSteer(dt);
  if (BOT && s.phase === "play") target = BOT === 4 ? humanSteer(dt) : botSteer();
  const autopilot = s.caught || s.escaped || s.phase === "finish";
  if (autopilot) target = Math.max(-1, Math.min(1, -s.camX / 500 + (ST.curveAt(s.pos) * T.centrifugal) / T.steerRate));
  s.steer += (target - s.steer) * Math.min(1, dt * 14);

  if (s.phase === "intro" && s.phaseT >= intro.dur + WHEEL_SLIDE) { s.phase = "countdown"; s.phaseT = 0; }

  if (s.phase === "countdown") {
    const prev = Math.ceil(COUNT - (s.phaseT - dt));
    const now = Math.ceil(COUNT - s.phaseT);
    if (now !== prev && now > 0 && now <= 3) sfx.tick();
    if (mode === "tilt" && s.phaseT < COUNT - 0.15) tilt.calibrate();
    if (s.phaseT >= COUNT) { s.phase = "play"; s.phaseT = 0; sfx.go(); banner("Go!", 0.8, 80); }
  }

  const racing = s.phase === "play" || s.phase === "finish" || s.phase === "done";
  if (racing) {
    // speed
    const profile = ST.speedAt(s.pos);
    s.boostT = Math.max(0, s.boostT - dt);
    const be = s.boostT > 0 ? Math.min(1, (T.boostTime - s.boostT) / 0.15) * Math.min(1, s.boostT / 0.45) : 0;
    s.boostE = be;
    const lat = ST.lateral(s.pos);
    s.offroad = Math.abs(s.camX) > ST.roadHalf;
    let tgt = T.baseSpeed * profile * (1 + T.boostAdd * be) * (s.offroad ? T.offroadMult : 1);
    if (s.pos > ST.brakeFrom) tgt = T.baseSpeed * Math.sqrt(Math.max(0, (ST.stop - s.pos) / (ST.stop - ST.brakeFrom)));
    s.stun = Math.max(0, s.stun - dt);
    if (s.stun > 0) tgt *= 0.5;
    const launch = s.phase === "play" ? Math.min(1, s.phaseT / 1.2) : 1;
    const accel = tgt > s.speed ? 1.6 * (0.4 + launch) : 3.0;
    s.speed += (tgt - s.speed) * Math.min(1, dt * accel);
    if (s.pos > ST.brakeFrom) s.speed = Math.min(s.speed, Math.max(0.3, tgt));

    const prevPos = s.pos;
    s.pos = Math.min(ST.stop, s.pos + s.speed * dt);
    const sr = s.speed / T.baseSpeed;

    // lateral: steering vs. the curve pushing you wide
    s.camX += s.steer * T.steerRate * Math.min(1, sr + 0.2) * dt;
    s.camX -= ST.curveAt(s.pos) * sr * T.centrifugal * dt;
    if (Math.abs(s.camX) > lat.limit) {
      s.camX = Math.sign(s.camX) * lat.limit;
      if (s.speed > T.baseSpeed * 0.5 && lat.wall) { s.speed *= 1 - 1.5 * dt; s.shake = Math.max(s.shake, 0.4); }
    }
    if (s.offroad) s.shake = Math.max(s.shake, 0.25);

    // collisions with things on segments we just passed
    for (let seg = Math.floor(prevPos) + 1; seg <= Math.floor(s.pos); seg++) collide(ST.wrap(seg));
    // boost pads
    for (const pd of ST.pads) {
      if (s.pos >= pd.seg && s.pos < pd.seg + ST.padLen && Math.abs(s.camX - pd.x) < 300 && !pd.used) {
        pd.used = true;
        startBoost("Boost!");
      }
    }
    // zone title
    const z = ST.zoneOf(s.pos);
    if (z !== s.zoneShown && ST.zoneTitles[z]) { s.zoneShown = z; }
    ST.onUpdate(s, prevPos, dt);

    updateSquirrel(dt);
    if (s.phase === "play" && !s.caught) s.raceT += dt;
    // the result card (and leaderboard) waits until the car has rolled to a stop
    if (s.pos >= ST.stop - 0.05 && s.speed < 1.5) {
      s.finishT += dt;
      if (s.finishT > 0.6 && s.phase !== "done") finish();
    }
  }

  // camera feel (same recipe as the reel: look into curves, lean, pitch with the hill)
  const look = ST.curveAt(s.pos + 7) * ST.cam.look;
  s.lean += (look - s.lean) * Math.min(1, dt * 3);
  s.yaw = -s.lean * ST.cam.yawK;
  s.pitch += (ST.pitchTarget(s.pos) - s.pitch) * Math.min(1, dt * 9);
  s.shake = Math.max(0, s.shake - dt * 1.5);
  s.wheelDeg = s.steer * 60;
  if (s.banner) { s.banner.t += dt; if (s.banner.t > s.banner.dur) s.banner = null; }
  s.pop = s.pop.filter((p) => (p.t += dt) < p.dur);
  s.flyers = s.flyers.filter((f) => (f.t += dt) < 0.65);
}

function botSteer() {
  const s = state;
  let want = 0;
  if (BOT >= 2) {
    for (let k = BOT === 3 ? 4 : 1; k < (BOT === 3 ? 14 : 30); k++) {
      const seg = ST.wrap(Math.floor(s.pos) + k);
      const pk = gp.pickups.get(seg), ob = gp.obstacles.get(seg);
      const pad = ST.pads.find((p) => p.seg === seg);
      if (pad) { want = pad.x; break; }
      if (pk && !pk[0].taken) { want = pk[0].x; break; }
      if (ob && Math.abs(ob[0].x - want) < 330) { want = ob[0].x > 0 ? ob[0].x - 400 : ob[0].x + 400; break; }
    }
  }
  if (s.meter >= T.acornsPerBoost && (BOT !== 3 || Math.random() < 0.01)) requestBoost();
  const sr = s.speed / T.baseSpeed;
  return Math.max(-1, Math.min(1, (want - s.camX) / 400 + (ST.curveAt(s.pos) * T.centrifugal * sr) / T.steerRate));
}

// ---------------- human-like test player (bot 4, debug only) ----------------
// Used to estimate how often real people would win. `window.__human` overrides these.
//   delay      seconds between seeing something and the hands reacting
//   gain       how hard they correct (world units of error for full lock; bigger = lazier)
//   noise      steering wobble (fraction of full lock)
//   look       how many segments ahead they plan for
//   ff         how well they anticipate a curve's push (1 = perfectly)
//   lapse      attention lapses per second (each freezes their plan for ~0.4-0.9s)
//   dodge/pad/collect  chance they notice and go for an obstacle / boost pad / pickup line
//   boostDelay mean seconds to react to "Double tap!"; boostNever = chance they never use it
const HUMAN = { delay: 0.25, gain: 650, noise: 0.15, look: 14, ff: 0.85, lapse: 0.1, dodge: 0.8, pad: 0.8, collect: 0.85, boostDelay: 1.5, boostNever: 0 };
let humanSeed = 1;
function humanSteer(dt) {
  const s = state, P = { ...HUMAN, ...(window.__human || {}) };
  const hb = (s.hb ||= { rand: mulberry32(window.__humanSeed ?? humanSeed++), q: [], n: 0, lapseT: 0, want: 0, fullT: 0, boostAt: null, never: null, notice: new Map() });
  const rand = hb.rand;
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  if (hb.never === null) hb.never = rand() < P.boostNever;
  // do they notice this thing at all? decided once per object
  const notices = (key, p) => { if (!hb.notice.has(key)) hb.notice.set(key, rand() < p); return hb.notice.get(key); };
  if (hb.lapseT > 0) hb.lapseT -= dt;
  else {
    if (rand() < P.lapse * dt) hb.lapseT = 0.4 + rand() * 0.5;
    let want = 0;
    for (let k = 1; k < P.look; k++) {
      const seg = ST.wrap(Math.floor(s.pos) + k);
      const pk = gp.pickups.get(seg), ob = gp.obstacles.get(seg);
      const pad = ST.pads.find((p) => p.seg === seg);
      if (pad && notices("p" + seg, P.pad)) { want = pad.x; break; }
      if (pk && !pk[0].taken && notices("k" + Math.floor(seg / 15), P.collect)) { want = pk[0].x; break; }
      if (ob && !ob[0].hit && Math.abs(ob[0].x - want) < 330 && notices("o" + seg, P.dodge)) { want = ob[0].x > 0 ? ob[0].x - 400 : ob[0].x + 400; break; }
    }
    hb.want = want;
  }
  hb.n += -hb.n * 2 * dt + P.noise * Math.sqrt(4 * dt) * gauss();   // slow wobble
  const sr = s.speed / T.baseSpeed;
  const ideal = Math.max(-1, Math.min(1, (hb.want - s.camX) / P.gain + (P.ff * ST.curveAt(s.pos) * T.centrifugal * sr) / T.steerRate + hb.n));
  hb.q.push({ t: s.t, v: ideal });
  while (hb.q.length > 1 && hb.q[1].t <= s.t - P.delay) hb.q.shift();
  if (s.meter >= T.acornsPerBoost && !hb.never) {
    if (hb.boostAt === null) { hb.boostAt = -Math.log(1 - rand()) * P.boostDelay; hb.fullT = 0; }
    hb.fullT += dt;
    if (hb.fullT >= hb.boostAt) { hb.boostAt = null; requestBoost(); }
  }
  return hb.q[0].t <= s.t - P.delay ? hb.q[0].v : 0;
}

function collide(seg) {
  const s = state;
  const pk = gp.pickups.get(seg);
  if (pk) for (const p of pk) {
    if (!p.taken && Math.abs(s.camX - p.x) < 260) {
      p.taken = true; s.acorns++;
      const wasFull = s.meter >= T.acornsPerBoost;
      s.meter = Math.min(T.acornsPerBoost, s.meter + 1);
      sfx.pickup(s.acorns);
      s.pop.push({ t: 0, dur: 0.5, x: W / 2 + (p.x - s.camX) * 0.25, y: 560 });
      if (!wasFull && s.meter >= T.acornsPerBoost) { sfx.ready(); vibrate(15); }
    }
  }
  const ob = gp.obstacles.get(seg);
  if (ob) for (const o of ob) {
    if (!o.hit && Math.abs(s.camX - o.x) < 320) {
      o.hit = true; s.bumps++;
      s.speed *= T.bumpSlow; s.stun = 0.6; s.shake = 1;
      s.boostT = 0;
      sfx.bump(); vibrate([40, 30, 40]);
      banner("Bonk!", 0.7, 56);
      ST.onBonk(s, o);
    }
  }
}

function updateSquirrel(dt) {
  const s = state;
  const hopT = s.t;
  if (s.caught || s.escaped) {
    // scurries off sideways (empty-handed if caught)
    s.sqRun += dt;
    s.sqPos += s.speed * dt * 0.6 + dt * 4;
    s.sqX += (s.sqX >= 0 ? 1 : -1) * (900 + s.sqRun * 4000) * dt;
    return;
  }
  if (s.phase !== "play") return;
  const gap = s.sqPos - s.pos;
  // smooth rubber band: the squirrel eases off when far ahead so it never leaves the screen
  const far = Math.max(0, Math.min(1, (gap - 35) / 45));
  const tired = ST.tired(s.sqPos) ? T.squirrelTired : 1;   // runs out of steam near the end
  const k = T.squirrelPace * tired * (1 - T.squirrelRubber * far * far * (3 - 2 * far));
  const launch = Math.min(1, s.phaseT / 0.6);
  s.sqSpeed = T.baseSpeed * ST.speedAt(s.sqPos) * k * launch;
  s.sqPos += s.sqSpeed * dt;
  s.sqX = ST.thief.motion(hopT, s.sqPos).x;

  if (s.sqPos - s.pos < T.catchGap) {
    s.caught = true; s.sqRun = 0;
    s.sqX = s.camX > 0 ? -200 : 200;
    sfx.win(); vibrate([60, 40, 120]);
    banner("Got it!", 1.6, 84);
    s.pop.push({ t: 0, dur: 1.4, big: true });
  } else if (s.sqPos >= ST.escapeAt) {
    s.escaped = true; s.sqRun = 0; s.escapeGap = s.sqPos - s.pos;
    s.phase = "finish";
    sfx.lose();
    banner("It got away…", 1.6, 52);
  }
}

function finish() {
  const s = state;
  s.phase = "done";
  const time = s.raceT;
  let isBest = false;
  if (s.caught && (!best || time < best.time)) {
    best = { time, acorns: s.acorns };
    isBest = true;
    try { localStorage.setItem(`miuu-${ST.id}-best`, JSON.stringify(best)); } catch {}
  }
  ui.resultTitle.textContent = s.caught ? "yay!" : s.escapeGap < 12 ? "So close!" : "It got away!";
  const tx = ST.text;
  ui.resultSub.textContent = s.caught ? tx.win : tx.lose;
  ui.resultImg.src = s.caught ? "img/miuu_diary.png" : ST.loseImg;
  ui.resultStats.innerHTML = s.caught
    ? `<b>${time.toFixed(1)}s</b> catch time${isBest ? " · new best!" : best ? ` · best ${best.time.toFixed(1)}s` : ""}<br>${tx.item} ${s.acorns} ${tx.items} · ${s.bumps} bonks`
    : `It was ${Math.max(1, Math.round(s.escapeGap * 2))} m ahead ${tx.where}<br>${tx.item} ${s.acorns} ${tx.items} · ${s.bumps} bonks`;
  if (s.caught && challenge && challenge.stage === ST.id) {
    ui.resultStats.innerHTML += time < challenge.time
      ? `<br>🎉 You beat your friend's ${challenge.time.toFixed(1)}s!`
      : `<br>Your friend's time to beat: ${challenge.time.toFixed(1)}s`;
  }
  s.lastResult = { caught: s.caught, time };
  ui.share.textContent = s.caught ? "📣 Challenge a friend" : "📣 Dare a friend to catch it";
  track("race_end", {
    stage: ST.id, control: mode, result: s.caught ? "caught" : "escaped", time_s: Math.round(time * 10) / 10,
    items: s.acorns, bonks: s.bumps, attempt: s.attempt || 0, challenged: challenge && challenge.stage === ST.id ? 1 : 0,
  });
  lb.showResult({ caught: s.caught, time, acorns: s.acorns, bumps: s.bumps });
  ui.result.classList.remove("hide");
}

// ---------------- draw ----------------
function draw() {
  const s = state;
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  const jitter = Math.sin(s.t * 26) * (0.3 + 0.6 * (s.speed / T.baseSpeed) + s.boostE * 1.5 + s.shake * 6);
  const leanRot = (-Math.max(-ST.cam.leanMax, Math.min(ST.cam.leanMax, s.lean * ST.cam.leanK)) * Math.PI) / 180;
  const tiltRot = mode === "tilt" && s.phase !== "title" ? (-tilt.angle() * T.levelHorizon * Math.PI) / 180 : 0;
  const entities = [];
  if (s.phase !== "intro" && (!(s.caught || s.escaped) || s.sqRun < 1.2)) {
    entities.push({ kind: s.caught ? ST.thief.empty : ST.thief.carry, pos: s.sqPos, x: s.sqX, y: ST.thief.motion(s.t, s.sqPos).y });
  }
  const fx = {};
  if (s.fxT) for (const k in s.fxT) fx[k] = s.t - s.fxT[k];
  ST.render(ctx, {
    pos: s.pos, camX: s.camX, pitch: s.pitch, yaw: s.yaw, jitter, t: s.t,
    rot: leanRot + tiltRot + Math.sin(s.t * 40) * s.shake * 0.01,
    speedNorm: s.phase === "countdown" || s.phase === "intro" ? 0 : Math.min(1.6, s.speed / T.baseSpeed), boostE: s.boostE,
    pickups: gp.pickups, obstacles: gp.obstacles, entities, fx, flyers: s.flyers,
  });
  if (s.phase === "intro") {
    const e = s.phaseT - intro.dur;
    if (e < 0) {
      const i = intro.order[Math.min(intro.order.length - 1, Math.floor(s.phaseT * intro.fps))];
      const f = intro.frames[i];
      if (f) ctx.drawImage(intro.img, f.sx, f.sy, f.sw, f.sh, f.x, f.y, f.w, f.h);
    } else {
      const k = Math.min(1, e / WHEEL_SLIDE);
      ST.drawCockpit(ctx, 0, 520 * (1 - k) * (1 - k), true);
    }
  } else ST.drawCockpit(ctx, s.wheelDeg);
  drawHud();
}

function drawHud() {
  const s = state;
  if (s.phase === "title") return;
  if (s.phase === "intro") {
    if (s.phaseT < intro.dur) outlinedText(ctx, "tap to skip", W - 70, 40, 16, { alpha: 0.85 });
    return;
  }
  if (s.phase === "countdown") {
    const n = Math.ceil(COUNT - s.phaseT);
    if (mode === "tilt") {
      outlinedText(ctx, "Hold your phone", W / 2, 200, 34);
      outlinedText(ctx, "like a wheel!", W / 2, 242, 34);
    } else if (isTouchDevice) {
      outlinedText(ctx, "Put your thumbs here!", W / 2, 220, 30);
      ctx.save();
      ctx.setLineDash([8, 8]); ctx.lineWidth = 4; ctx.strokeStyle = "#fff"; ctx.fillStyle = "rgba(255,160,190,0.35)";
      for (const x of [W * 0.22, W * 0.78]) { ctx.beginPath(); ctx.arc(x, 760, 52, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    } else {
      outlinedText(ctx, "← →  to steer", W / 2, 220, 34);
    }
    if (n >= 1 && n <= 3) {
      const f = 1 - (n - (COUNT - s.phaseT));
      outlinedText(ctx, String(n), W / 2, 520, 110 * (1.25 - 0.25 * f));
    }
    return;
  }
  // top bar: acorns · chase gap · time
  ctx.save();
  ctx.fillStyle = "rgba(75,58,110,0.55)";
  roundRect(ctx, 14, 14, W - 28, 54, 27); ctx.fill();
  drawSprite(ctx, ST.pickupKind, 46, 59, 34 / (WW[ST.pickupKind] * S));
  ctx.font = "800 24px Poppins, system-ui, sans-serif"; ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
  ctx.textAlign = "left"; ctx.fillText(String(s.acorns), 70, 42);
  ctx.textAlign = "right"; ctx.fillText(s.raceT.toFixed(1) + "s", W - 34, 42);
  // chase meter
  const gap = Math.max(0, s.sqPos - s.pos);
  const mx0 = 150, mx1 = W - 130, my = 42;
  ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 6; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(mx0, my); ctx.lineTo(mx1, my); ctx.stroke();
  const frac = Math.min(1, gap / 60);
  ctx.fillStyle = "#b9a0f0"; ctx.beginPath(); ctx.arc(mx0, my, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#4b3a6e"; ctx.lineWidth = 3; ctx.stroke();
  if (!s.caught && !s.escaped) {
    const sx = mx0 + 18 + frac * (mx1 - mx0 - 18);
    ctx.font = "22px system-ui"; ctx.textAlign = "center"; ctx.fillText(ST.text.thiefEmoji, sx, my + 1);
    ctx.font = "700 13px Poppins, system-ui"; ctx.fillStyle = "#fff";
    ctx.fillText(Math.round(gap * 2) + " m", (mx0 + sx) / 2, my + 19);
  }
  ctx.restore();

  // boost meter (acorns toward a double-tap boost)
  const full = s.meter >= T.acornsPerBoost;
  const bw = 200, bx = (W - bw) / 2, by = 84;
  ctx.save();
  ctx.fillStyle = "rgba(75,58,110,0.45)"; roundRect(ctx, bx, by, bw, 14, 7); ctx.fill();
  ctx.fillStyle = full ? `hsl(${(s.t * 300) % 360},90%,75%)` : "#f7a8c8";
  roundRect(ctx, bx, by, (bw * s.meter) / T.acornsPerBoost, 14, 7); ctx.fill();
  ctx.restore();
  if (full && s.phase === "play" && !s.caught) {
    const pulse = 1 + 0.08 * Math.sin(s.t * 10);
    outlinedText(ctx, mode === "touch" && !isTouchDevice ? "Press space!" : "Double tap!", W / 2, 150, 34 * pulse, { fill: "#fff" });
  }
  // zone title card
  if (ST.zoneTitles[s.zoneShown]) {
    const zt = zoneTitleTimer(s);
    if (zt > 0) outlinedText(ctx, ST.zoneTitles[s.zoneShown], W / 2, 215, 30, { alpha: Math.min(1, zt) });
  }
  // banner
  if (s.banner) {
    const b = s.banner;
    const pop = Math.min(1, b.t / 0.12);
    const fade = Math.min(1, (b.dur - b.t) / 0.25);
    outlinedText(ctx, b.text, W / 2, 330, b.size * (0.7 + 0.3 * pop), { alpha: fade });
  }
  // pickup pops / big acorn on catch
  for (const p of s.pop) {
    if (p.big) {
      const k = p.t / p.dur;
      const sc = 0.0016 * (k < 0.2 ? k / 0.2 : 1) * (1 + 0.05 * Math.sin(p.t * 12));
      drawSprite(ctx, "diary", W / 2, 600 - 40 * Math.sin(k * Math.PI), sc);
    } else {
      outlinedText(ctx, "+1", p.x, p.y - p.t * 120, 26, { alpha: 1 - p.t / p.dur });
    }
  }
  if (DEBUG) drawDebug();
}

let lastZone = null, zoneT0 = 0;
function zoneTitleTimer(s) {
  if (s.zoneShown !== lastZone) { lastZone = s.zoneShown; zoneT0 = s.t; }
  const e = s.t - zoneT0;
  return e < 2.2 ? Math.min(1, (2.2 - e) / 0.4) : 0;
}

function drawDebug() {
  const g = tilt.g || { x: 0, y: 0, z: 0 };
  const lines = [
    `stage ${ST.id}  mode ${mode}  events ${tilt.events}  conv ${tilt.conv}`,
    `g ${g.x.toFixed(2)} ${g.y.toFixed(2)} ${g.z.toFixed(2)}`,
    `angle ${tilt.angle().toFixed(1)}°  steer ${state.steer.toFixed(2)}`,
    `orient ${screen.orientation ? screen.orientation.angle : window.orientation}  pos ${state.pos.toFixed(1)}  v ${state.speed.toFixed(1)}`,
    `camX ${state.camX.toFixed(0)}  sq ${(state.sqPos - state.pos).toFixed(1)}`,
    `fps ${(1000 / perf.interval).toFixed(0)}  work ${perf.work.toFixed(1)}ms  scale ${renderScale.toFixed(2)}`,
  ];
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, 110, 360, lines.length * 18 + 10);
  ctx.fillStyle = "#0f0"; ctx.font = "13px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, 14, 116 + i * 18));
  ctx.restore();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// ---------------- loop ----------------
let last = performance.now();
const perf = { work: 0, interval: 16.7 };
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  perf.interval += ((now - last) - perf.interval) * 0.05;
  last = now;
  if (state.phase !== "loading") {
    const t0 = performance.now();
    if (state.phase !== "title" && !(DEBUG && window.__freeze)) update(dt);
    draw();
    perf.work += (performance.now() - t0 - perf.work) * 0.05;
    // adaptive resolution: step down if we can't hold ~60fps
    if (state.phase === "play" && now - (perf.lastAdjust || 0) > 1500 && perf.work > 12 && renderScale > 0.9) {
      perf.lastAdjust = now;
      qualityCap = Math.max(0.85, renderScale * 0.8);
      layout();
    }
  }
  requestAnimationFrame(frame);
}

// title screen backdrop: idle at the start line
function idleState() {
  reset();
  state.phase = "title";
}

// ---------------- stages ----------------
async function selectStage(id) {
  ST = STAGES[id] || STAGES.burrow;
  Object.assign(T, T_BASE, ST.tune);
  state.phase = "loading";
  ui.loading.classList.remove("hide");
  await loadImages("img/", ST.imageKeys);
  loadBest();
  loadIntro(ST);
  lb.setStage(ST.id);
  ui.title.style.backgroundImage = `url(${ST.titleBg})`;
  ui.tagline.textContent = challenge && challenge.stage === ST.id
    ? `🏁 A friend caught the ${ST.text.thief} in ${challenge.time.toFixed(1)}s. Can you beat it?`
    : ST.tag;
  for (const b of ui.stagePick.querySelectorAll("button")) b.classList.toggle("on", b.dataset.stage === ST.id);
  ui.loading.classList.add("hide");
  idleState();
  layout();
}
function initStagePicker() {
  if (!OCEAN_PUBLIC && !params.has("stage")) return;   // one stage: nothing to pick
  ui.mapRow.hidden = false;
  for (const id of STAGE_ORDER) {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.stage = id;
    b.textContent = `${STAGES[id].emoji} ${STAGES[id].name}`;
    b.onclick = () => { if (ST.id !== id && state.phase === "title") { track("stage_select", { stage: id }); selectStage(id); } };
    ui.stagePick.append(b);
  }
}

(async function boot() {
  try { await document.fonts.load("800 30px Poppins"); } catch {}
  trackPageView();
  lb.initUI();
  initStagePicker();
  await selectStage(ST.id);
  requestAnimationFrame(frame);
})();

if (DEBUG) window.__game = { state, T, tilt, update, reset, selectStage, stage: () => ST, setBot: (b) => (BOT = b) };
