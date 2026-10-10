// Sea / submarine track — ported from source/sea.py (the ocean reel's renderer).
// The camera follows a "current" ribbon through open water: path_y is the ribbon's height
// (0 = the surface, negative = deeper), floor_y the sea bed far below it.
import { mulberry32 } from "./track.js";

export const N = 1500;
export const SEG_LEN = 200;
export const CAM_H = 520;
export const DOCK_END = 40, DIVE_END = 80, REEF_END = 300, KELP_END = 520, WRECK_END = 700, ABYSS_END = 950, BLUE_END = 952, RISE_END = 975;
export const P_STOP = RISE_END + 55.5;
export const BRAKE_FROM = RISE_END + 5;
export const ESCAPE = ABYSS_END - 12;       // the thief gets away once it starts the climb to the surface
export const RIBBON = 760;                  // half-width of the current you ride
export const DOCK_W = 900;
export const WHALE_SEG = 196;

export const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const clampI = (i) => Math.max(0, Math.min(N - 1, i));

export function zoneOf(i) {
  for (const [b, z] of [[DOCK_END, "dock"], [DIVE_END, "dive"], [REEF_END, "reef"], [KELP_END, "kelp"], [WRECK_END, "wreck"], [ABYSS_END, "abyss"], [BLUE_END, "blue"], [RISE_END, "rise"]]) {
    if (i < b) return z;
  }
  return "surface";
}
export const ZONE_TITLES = { reef: "Coral Reef", kelp: "Kelp Forest", wreck: "Shipwreck", abyss: "The Abyss", rise: "Going up!" };

function keyinterp(pts, i) {
  if (i <= pts[0][0]) return pts[0][1];
  for (let k = 0; k < pts.length - 1; k++) {
    const [a, ya] = pts[k], [b, yb] = pts[k + 1];
    if (i >= a && i <= b) { const t = (i - a) / (b - a); return ya + (yb - ya) * (0.5 - 0.5 * Math.cos(Math.PI * t)); }
  }
  return pts[pts.length - 1][1];
}
const PY = [[0, 260], [DOCK_END, 260], [DIVE_END, -1500], [200, -1350], [REEF_END, -1650], [420, -1900], [KELP_END, -2000],
  [560, -2500], [WRECK_END, -2500], [WRECK_END + 4, -2530], [WRECK_END + 32, -5450], [WRECK_END + 50, -5520], [860, -5450], [ABYSS_END - 12, -5400], [ABYSS_END - 9, -5390], [RISE_END, -270], [N, -270]];
const CLR = [[0, 2360], [DOCK_END, 2360], [DIVE_END, 650], [REEF_END, 650], [330, 820], [KELP_END, 820], [545, 520], [WRECK_END, 520],
  [WRECK_END + 4, 520], [WRECK_END + 32, 1500], [ABYSS_END - 20, 1500], [RISE_END, 6000], [N, 6000]];
const und = (i) => smooth((i - 110) / 40) * (1 - smooth((i - (BLUE_END - 40)) / 40)) * (240 * Math.sin((2 * Math.PI * i) / 110) + 110 * Math.sin((2 * Math.PI * i) / 47 + 1.0));
export const pathY = (i) => keyinterp(PY, i) + und(i);
export const floorY = (i) => pathY(i) - keyinterp(CLR, i);
// per-segment caches (the renderer asks for these thousands of times a frame)
export const PATH_Y = new Float32Array(N + 2), FLOOR_Y = new Float32Array(N + 2);
for (let i = 0; i < N + 2; i++) { PATH_Y[i] = pathY(Math.min(i, N - 1)); FLOOR_Y[i] = floorY(Math.min(i, N - 1)); }

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
const SPEEDS = { dock: 1.0, dive: 1.15, reef: 1.0, kelp: 1.0, wreck: 0.85, abyss: 1.05, blue: 1.0, rise: 1.35, surface: 1.2 };
export const VS = new Float32Array(N);
{
  const vs = Array.from({ length: N }, (_, i) => SPEEDS[zoneOf(i)]);
  const h = 20;
  for (let i = 0; i < N; i++) { let s = 0, n = 0; for (let j = Math.max(0, i - h); j <= Math.min(N - 1, i + h); j++) { s += vs[j]; n++; } VS[i] = s / n; }
  const bump = (a, b, gain) => { for (let i = a - 6; i < b + 6; i++) VS[i] *= 1 + (gain - 1) * smooth((i - (a - 6)) / 6) * (1 - smooth((i - b) / 6)); };
  bump(WRECK_END - 8, WRECK_END + 2, 0.7);      // slow at the lip...
  bump(WRECK_END + 4, WRECK_END + 34, 1.45);    // ...then the plunge
  bump(ABYSS_END - 20, ABYSS_END - 12, 0.8);
  bump(ABYSS_END - 9, RISE_END, 0.75);
}
export const speedAt = (p) => VS[clampI(Math.floor(p))];

// ---------------- water colours by camera depth ----------------
const WATER = [[0, [156, 228, 238], [222, 250, 252], [120, 204, 224]],
  [1000, [120, 212, 228], [186, 242, 248], [78, 170, 206]],
  [1450, [104, 200, 196], [160, 232, 226], [60, 150, 160]],
  [2000, [76, 148, 192], [120, 196, 222], [40, 96, 150]],
  [2600, [40, 64, 128], [60, 90, 150], [20, 30, 80]],
  [3100, [20, 26, 70], [30, 40, 92], [10, 12, 40]],
  [9000, [20, 26, 70], [30, 40, 92], [10, 12, 40]]];
const mixA = (a, b, t) => { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
// -> [fog, top, bottom] colours as [r,g,b] arrays
export function water(depth, pos) {
  const d = Math.max(0, depth);
  let out = [WATER[6][1], WATER[6][2], WATER[6][3]];
  for (let k = 0; k < WATER.length - 1; k++) {
    const [a, fa, ta, ba] = WATER[k], [b, fb, tb, bb] = WATER[k + 1];
    if (d >= a && d <= b) { const t = (d - a) / (b - a); out = [mixA(fa, fb, t), mixA(ta, tb, t), mixA(ba, bb, t)]; break; }
  }
  // the water turns bright blue as you climb out of the abyss
  const bw = smooth((pos - (ABYSS_END - 10)) / 90);
  if (bw > 0) {
    const lt = smooth((pos - ABYSS_END) / (BLUE_END - ABYSS_END));
    out = [mixA(out[0], mixA([40, 86, 160], [104, 186, 234], lt), bw), mixA(out[1], mixA([70, 130, 200], [180, 234, 250], lt), bw), mixA(out[2], mixA([20, 50, 120], [56, 130, 200], lt), bw)];
  }
  return out;
}

// ---------------- scenery placements ----------------
const rng = mulberry32(9);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const side = () => (rng() < 0.5 ? -1 : 1);
export const objs = new Map();   // seg -> [{kind, x, anchor: 'floor'|'path'|'abs', y}]
const add = (i, kind, x, anchor, y = 0) => { if (!objs.has(i)) objs.set(i, []); objs.get(i).push({ kind, x, anchor, y }); };
const REEF_KINDS = ["coral_p", "coral_l", "fan_o", "fan_p", "brain", "anem", "anem2", "rock", "weed", "star", "shell"];
for (let i = DIVE_END - 20; i < REEF_END + 10; i += 2) for (let k = 0; k < 2; k++) add(i, pick(REEF_KINDS), side() * (1050 + rng() * 2600), "floor");
for (let i = REEF_END; i < KELP_END; i += 4) add(i, pick(["rock", "weed", "shell", "star", "anem"]), side() * (1050 + rng() * 1800), "floor");
for (let i = KELP_END; i < WRECK_END; i += 5) add(i, pick(["barrel", "weed", "shell", "rock"]), side() * (1000 + rng() * 700), "floor");
add(KELP_END + 70, "chest", 1150, "floor");
add(KELP_END + 128, "chest", -1150, "floor");
for (let i = WRECK_END + 20; i < ABYSS_END - 10; i += 6) {
  const sd = side();
  add(i, rng() < 0.5 ? "jelly_p" : "jelly_c", sd * (900 + rng() * 2200), "path", 200 + rng() * 1500);
  if (rng() < 0.18) add(i + 3, "angler", -sd * (1200 + rng() * 600), "path", 100 + rng() * 300);
}
[RISE_END + 20, RISE_END + 48, RISE_END + 75, RISE_END + 110].forEach((i, j) => add(i, "buoy", (j % 2 ? 1 : -1) * (1500 + rng() * 900), "abs", -70));
for (const i of [10, 22, 34]) add(i, "buoy", (i % 2 ? 1 : -1) * 1500, "abs", -70);

// fish schools crossing the path: {seg, x0, yrel, vx, colour, n}
export const SCHOOLS = [];
for (let seg = DIVE_END + 10, j = 0; seg < KELP_END + 40; seg += 26, j++) {
  SCHOOLS.push({ seg, x0: (rng() * 2 - 1) * 900, yrel: 200 + rng() * 900, vx: (j % 2 ? 1 : -1) * (14 + rng() * 14), ci: j % 5, n: 5 + Math.floor(rng() * 5) });
}
// giants drifting through the background while you pass [p0, p1]
export const GIANTS = [
  { kind: "bigwhale", D: 80, p0: REEF_END - 25, p1: KELP_END + 25, x0: -40000, x1: 40000, y: -300, fog: 0.38 },
  { kind: "gangler", glow: "gangler_glow", flip: true, D: 58, p0: WRECK_END + 15, p1: WRECK_END + 150, x0: 34000, x1: -34000, y: -7500, fog: 0.3 },
  { kind: "oar", D: 50, p0: ABYSS_END - 125, p1: ABYSS_END + 15, x0: -26000, x1: 58000, y: 900, fog: 0.25 },
];
export const RIB_SEGS = new Set();
for (let i = KELP_END + 30; i < WRECK_END - 10; i += 9) RIB_SEGS.add(i);

// ---------------- gameplay layer (new for the game) ----------------
// Pads sit on the inside of the big sweeps or on the short straights between them.
export const PADS = [
  { seg: WHALE_SEG - 2, x: 300 }, { seg: 374, x: -200 }, { seg: 512, x: 200 },
  { seg: 650, x: 0 }, { seg: 788, x: -200 }, { seg: 870, x: -300 },
];
export const PAD_LEN = 4;

export function buildGameplay(seed = 23) {
  const r = mulberry32(seed);
  const pk = (arr) => arr[Math.floor(r() * arr.length)];
  const pickups = new Map();
  const obstacles = new Map();
  const nearPad = (s, d) => PADS.some((p) => Math.abs(p.seg - s) < d);
  const noGo = (s) => s > WRECK_END - 12 && s < WRECK_END + 40;   // keep the plunge clear
  for (let g = 96; g < ESCAPE - 20; g += 34) {
    if (!nearPad(g + 6, 12) && !noGo(g + 6)) {
      const c = curves[g + 6];
      let x0, x1;
      if (Math.abs(c) > 1) x0 = x1 = Math.sign(c) * 400;
      else { x0 = pk([-400, 0, 400]); x1 = pk([-400, 0, 400]); }
      for (let k = 0; k < 5; k++) {
        const s = g + k * 3;
        if (!pickups.has(s)) pickups.set(s, []);
        pickups.get(s).push({ x: x0 + ((x1 - x0) * k) / 4, taken: false });
      }
    }
    const o = g + 19;
    if (o >= 130 && !nearPad(o, 10) && !noGo(o) && r() < 0.62) {
      const c = curves[o];
      const x = Math.abs(c) > 1 ? -Math.sign(c) * 430 : pk([-430, 0, 430]);
      const z = zoneOf(o);
      const kind = z === "abyss" ? "ob_jelly" : r() < 0.5 ? "ob_fish_p" : "ob_fish_b";
      obstacles.set(o, [{ x, kind, hit: false, y: z === "abyss" ? 150 : 120 }]);
    }
  }
  return { pickups, obstacles };
}
