// Sky / plane track — ported from source/sky.py (the sky reel's renderer).
// The camera follows a rainbow road through the air: path_y is the road's height, with 0 the cloud
// layer. You take off from a meadow under the clouds, fly over the cloud sea, past the cloud pillars
// and the sky castle, drop into the storm under the clouds and climb back out into the sunset.
import { mulberry32 } from "./track.js";

export const N = 1300;
export const SEG_LEN = 200;
export const CAM_H = 520;
export const ISLAND_END = 40, CLIMB_END = 80, SEA_END = 300, PILLAR_END = 520, CASTLE_END = 700, STORM_END = 950, RISE_END = 975;
export const P_STOP = RISE_END + 55.5;
export const BRAKE_FROM = RISE_END + 5;
export const ESCAPE = RISE_END - 2;         // the thief gets away once it bursts out above the clouds again
export const TIRED_FROM = STORM_END - 130;  // where the storm starts to wear it out
export const ROAD = 760;                    // half-width of the rainbow road
export const ARCH_SEG = 196;                // the rainbow arch you fly through for a boost
export const GROUND_Y = -3600, STORM_FLOOR = -5600;
export const LIGHTNING = [CASTLE_END + 20, CASTLE_END + 75, CASTLE_END + 140, STORM_END - 70, STORM_END - 25];

export const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const clampI = (i) => Math.max(0, Math.min(N - 1, i));

export function zoneOf(i) {
  for (const [b, z] of [[ISLAND_END, "island"], [CLIMB_END, "climb"], [SEA_END, "sea"], [PILLAR_END, "pillar"], [CASTLE_END, "castle"], [STORM_END, "storm"], [RISE_END, "rise"]]) {
    if (i < b) return z;
  }
  return "above";
}
export const ZONE_TITLES = { climb: "Take off!", sea: "Cloud Sea", pillar: "Cloud Pillars", castle: "Sky Castle", storm: "Thunderstorm", rise: "Going up!" };

function keyinterp(pts, i) {
  if (i <= pts[0][0]) return pts[0][1];
  for (let k = 0; k < pts.length - 1; k++) {
    const [a, ya] = pts[k], [b, yb] = pts[k + 1];
    if (i >= a && i <= b) { const t = (i - a) / (b - a); return ya + (yb - ya) * (0.5 - 0.5 * Math.cos(Math.PI * t)); }
  }
  return pts[pts.length - 1][1];
}
const PY = [[0, GROUND_Y], [ISLAND_END, GROUND_Y], [ISLAND_END + 3, GROUND_Y + 10], [ISLAND_END + 27, 900], [CLIMB_END + 10, 950], [200, 1050], [SEA_END, 900], [420, 1150], [PILLAR_END, 1050],
  [560, 1500], [CASTLE_END, 1500], [CASTLE_END + 4, 1480], [CASTLE_END + 32, -2600], [CASTLE_END + 50, -2700], [860, -2800],
  [STORM_END - 12, -2750], [STORM_END - 9, -2740], [RISE_END, 800], [N, 800]];
const und = (i) => smooth((i - 110) / 40) * (1 - smooth((i - (STORM_END - 40)) / 30)) * (220 * Math.sin((2 * Math.PI * i) / 110) + 100 * Math.sin((2 * Math.PI * i) / 47 + 1.0));
export const pathY = (i) => keyinterp(PY, i) + und(i);
// per-segment cache (the renderer asks for this thousands of times a frame)
export const PATH_Y = new Float32Array(N + 2);
for (let i = 0; i < N + 2; i++) PATH_Y[i] = pathY(Math.min(i, N - 1));
// the ground far below: the meadow until the castle, the storm's dark floor after it
export const belowFloor = (i) => (i < CASTLE_END ? GROUND_Y : STORM_FLOOR);

// ---------------- curves ----------------
const ease = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);
const cv = [];
const straight = (n) => { for (let i = 0; i < n; i++) cv.push(0); };
function curve(enter, hold, leave, c) {
  for (let i = 0; i < enter; i++) cv.push(ease(0, c, i / enter));
  for (let i = 0; i < hold; i++) cv.push(c);
  for (let i = 0; i < leave; i++) cv.push(ease(c, 0, i / leave));
}
straight(112);
for (const c of [7.0, -7.5, 7.5, -7.0, 7.5, -8.0]) { curve(9, 95, 14, c); straight(20); }
straight(N - cv.length);
export const curves = Float32Array.from(cv);
export function curveAt(p) {
  const i = Math.floor(p), f = p - i;
  return curves[clampI(i)] * (1 - f) + curves[clampI(i + 1)] * f;
}

// ---------------- speed profile ----------------
const SPEEDS = { island: 1.0, climb: 1.15, sea: 1.0, pillar: 1.0, castle: 0.85, storm: 1.05, rise: 1.35, above: 1.2 };
export const VS = new Float32Array(N);
{
  const vs = Array.from({ length: N }, (_, i) => SPEEDS[zoneOf(i)]);
  const h = 20;
  for (let i = 0; i < N; i++) { let s = 0, n = 0; for (let j = Math.max(0, i - h); j <= Math.min(N - 1, i + h); j++) { s += vs[j]; n++; } VS[i] = s / n; }
  const bump = (a, b, gain) => { for (let i = a - 6; i < b + 6; i++) VS[i] *= 1 + (gain - 1) * smooth((i - (a - 6)) / 6) * (1 - smooth((i - b) / 6)); };
  bump(ISLAND_END + 3, ISLAND_END + 27, 0.6);     // the steep climb through the clouds
  bump(CASTLE_END - 8, CASTLE_END + 2, 0.7);      // slow at the lip...
  bump(CASTLE_END + 4, CASTLE_END + 34, 1.45);    // ...then the drop into the storm
  bump(STORM_END - 20, STORM_END - 12, 0.8);
  bump(STORM_END - 9, RISE_END, 0.75);
}
export const speedAt = (p) => VS[clampI(Math.floor(p))];

// ---------------- colours along the way ----------------
// top / hor: the sky from above the clouds; fog: what distance fades into; ca / cb: the cloud sea's
// two bands; ua / ub: the clouds' underside; ga / gb: the ground far below; sun, stars, rain: 0..1
const P = (top, hor, fog, ca, cb, sun, o = {}) => ({ top, hor, fog, ca, cb, sun, sunc: [255, 244, 214], stars: 0, ua: [66, 58, 100], ub: [58, 50, 92], ga: [34, 34, 66], gb: [30, 30, 60], rain: 0, ...o });
const MEADOW = { ua: [246, 242, 252], ub: [240, 236, 250], ga: [176, 226, 164], gb: [166, 218, 156] };
const DAY = P([126, 178, 244], [255, 220, 234], [244, 228, 242], [250, 248, 253], [238, 234, 248], 1, MEADOW);
const SEA = P([108, 174, 246], [214, 236, 255], [222, 236, 252], [250, 250, 253], [232, 238, 252], 1, { ...MEADOW, ua: [246, 244, 252], ub: [240, 238, 250] });
const PILLAR = P([140, 166, 242], [255, 214, 236], [248, 226, 242], [252, 244, 250], [242, 228, 244], 1);
const CASTLE = P([150, 128, 222], [255, 196, 170], [255, 212, 198], [255, 232, 222], [248, 214, 208], 1, { sunc: [255, 230, 170] });
const STORM = P([30, 24, 58], [76, 62, 114], [60, 50, 96], [70, 62, 106], [62, 54, 96], 0, { rain: 1 });
const ABOVE = P([40, 42, 116], [255, 170, 160], [252, 198, 192], [255, 218, 226], [246, 198, 216], 1, { sunc: [255, 214, 160], stars: 1 });
const PALK = [[0, DAY], [CLIMB_END, SEA], [SEA_END - 20, SEA], [SEA_END + 20, PILLAR], [PILLAR_END - 10, PILLAR], [PILLAR_END + 30, CASTLE],
  [CASTLE_END + 10, CASTLE], [CASTLE_END + 26, STORM], [STORM_END - 2, STORM], [RISE_END - 2, ABOVE], [N, ABOVE]];
const lerp = (a, b, t) => a + (b - a) * t;
export function palette(p) {
  for (let k = 0; k < PALK.length - 1; k++) {
    const [a, A] = PALK[k], [b, B] = PALK[k + 1];
    if (p >= a && p <= b) {
      if (A === B) return A;
      const t = smooth((p - a) / (b - a)), out = {};
      for (const key in A) out[key] = Array.isArray(A[key]) ? [lerp(A[key][0], B[key][0], t), lerp(A[key][1], B[key][1], t), lerp(A[key][2], B[key][2], t)] : lerp(A[key], B[key], t);
      return out;
    }
  }
  return ABOVE;
}

// ---------------- scenery placements ----------------
const rng = mulberry32(21);
const side = () => (rng() < 0.5 ? -1 : 1);
const int = (n) => Math.floor(rng() * n);
export const objs = new Map();   // seg -> [{kind, x, anchor: 'road'|'path'|'abs', y, flip}]
const add = (i, kind, x, anchor, y = 0, flip = false) => { if (!objs.has(i)) objs.set(i, []); objs.get(i).push({ kind, x, anchor, y, flip }); };
const BALLOONS = ["bal1", "bal2", "bal3", "bal4"];
// the meadow runway
for (let i = 0; i < ISLAND_END - 2; i += 3) {
  const sd = Math.floor(i / 3) % 2 ? 1 : -1;
  add(i, ["tree_p", "tree_g", "tree_o"][Math.floor(i / 3) % 3], sd * (1500 + rng() * 1200), "road");
  if (i % 6 === 0) add(i + 1, ["flag_p", "flag_b", "flag_y"][Math.floor(i / 6) % 3], -sd * 960, "road");
}
add(18, "sock", 1300, "road");
// billboards for the app: one at the start line, two where the plane comes to rest
add(12, "sign_miuu", -1500, "road");
add(RISE_END + 30, "sign_miuu", -1400, "road", -40);
add(RISE_END + 66, "sign_miuu", 1350, "road", -40);
// puffs standing on the cloud sea, wherever you fly above it
for (let i = 10; i < CASTLE_END + 20; i += 3) for (let k = 0; k < 2; k++) add(i, "puff" + int(4), side() * (1300 + rng() * 6000), "abs", 0);
for (let i = RISE_END + 4; i < N - 30; i += 3) add(i, "puff" + int(4), side() * (1300 + rng() * 6000), "abs", 0);
// balloons and floating islands over the cloud sea
for (let i = CLIMB_END + 6; i < SEA_END; i += 9) add(i, BALLOONS[int(4)], side() * (1300 + rng() * 2600), "path", 200 + rng() * 1400);
for (let i = CLIMB_END + 30; i < SEA_END; i += 40) add(i, "isl_t", side() * (5000 + rng() * 3000), "path", -1800 + rng() * 1200);
// cloud towers
for (let i = SEA_END - 10; i < PILLAR_END + 10; i += 7) add(i, "tower" + int(3), (Math.floor(i / 7) % 2 ? -1 : 1) * (3200 + rng() * 4000), "abs", 0);
for (let i = SEA_END + 5; i < PILLAR_END; i += 14) add(i, BALLOONS[int(4)], side() * (1300 + rng() * 1800), "path", 300 + rng() * 900);
// castle islands
for (let i = PILLAR_END + 10, j = 0; i < CASTLE_END - 4; i += 16, j++) {
  const sd = j % 2 ? -1 : 1;
  add(i, "isl_c", sd * (3600 + rng() * 2500), "path", -900 + rng() * 1600, sd > 0);
}
for (let i = PILLAR_END + 18; i < CASTLE_END - 10; i += 22) add(i, "isl_t", side() * (6000 + rng() * 3000), "path", -2400 + rng() * 1400);
for (let i = RISE_END + 30; i < N - 40; i += 26) add(i, BALLOONS[int(4)], side() * (1600 + rng() * 2600), "path", -200 + rng() * 1200);

// bird flocks crossing the road: {seg, x0, yrel, vx, n}
export const FLOCKS = [];
{
  const segs = [];
  for (let s = CLIMB_END + 14; s < PILLAR_END + 20; s += 28) segs.push(s);
  segs.push(RISE_END + 20);
  segs.forEach((seg, j) => FLOCKS.push({ seg, x0: (rng() * 2 - 1) * 900, yrel: 400 + rng() * 900, vx: (j % 2 ? 1 : -1) * (18 + rng() * 12), n: 5 + int(5) }));
}
// the giant angel rising out of the cloud sea while you pass [p0, p1]
export const ANGEL = { D: 80, p0: PILLAR_END - 10, p1: CASTLE_END - 2, x0: -30000, x1: 30000, y: -7000, rise: 2500, fog: 0.25 };
// stone arches over the castle bridge
export const BRIDGE_FROM = PILLAR_END + 25;
export const ARCHES = new Set();
for (let i = PILLAR_END + 30; i < CASTLE_END - 6; i += 9) ARCHES.add(i);

// ---------------- gameplay layer (new for the game) ----------------
// The rainbow arch boosts whoever flies through it (it spans the whole road); the other pads sit on
// the short straights between the big sweeps.
export const PADS = [
  { seg: ARCH_SEG - 2, x: 0, w: ROAD, arch: true }, { seg: 374, x: -200 }, { seg: 512, x: 200 },
  { seg: 650, x: 0 }, { seg: 788, x: -200 }, { seg: 870, x: -300 },
];
export const PAD_LEN = 4;
export const GIFT = 5;   // stars in a gift box
const BIRDS = ["hb_yellow", "hb_blue"];

// Everything here is a treat: lines of stars, hearts and gems, a few gift boxes, and Ki's birds
// sitting in the road. A bird costs nothing to hit (it is sent flying), so the birds are put where
// the player is already being led, the opposite of the other stages' hazards.
export function buildGameplay(seed = 31) {
  const r = mulberry32(seed);
  const pk = (arr) => arr[Math.floor(r() * arr.length)];
  const pickups = new Map();   // seg -> [{x, kind, worth, taken}]
  const obstacles = new Map(); // seg -> [{x, kind, y, hit}]
  const nearPad = (s, d) => PADS.some((p) => Math.abs(p.seg - s) < d);
  const noGo = (s) => s > CASTLE_END - 12 && s < CASTLE_END + 40;   // keep the drop into the storm clear
  const put = (map, s, o) => { if (!map.has(s)) map.set(s, []); map.get(s).push(o); };
  for (let g = 62, j = 0; g < STORM_END - 32; g += 34, j++) {   // nothing on the climb out
    let x1 = 0;
    if (!nearPad(g + 6, 12) && !noGo(g + 6)) {
      const c = curves[g + 6];
      let x0;
      if (Math.abs(c) > 1) x0 = x1 = Math.sign(c) * 380;   // inside line of the sweep
      else { x0 = pk([-380, 0, 380]); x1 = pk([-380, 0, 380]); }
      const kind = ["it_star", "it_heart", "it_gem"][j % 3];
      for (let k = 0; k < 5; k++) put(pickups, g + k * 3, { x: x0 + ((x1 - x0) * k) / 4, kind, worth: 1, taken: false });
    }
    const o = g + 20;
    if (j % 2 === 0 && o >= 100 && !nearPad(o, 8) && !noGo(o)) {
      if (j % 4 === 0) for (const x of [-520, 0, 520]) put(obstacles, o, { x, kind: "hb_grey", y: 120, hit: false });   // a row of crows: no way round
      else put(obstacles, o, { x: x1, kind: BIRDS[(j >> 2) % 2], y: 120, hit: false });
    }
    if (j % 4 === 1 && !nearPad(g + 27, 8) && !noGo(g + 27)) put(pickups, g + 27, { x: 0, kind: "it_gift", worth: GIFT, taken: false });
  }
  return { pickups, obstacles };
}
