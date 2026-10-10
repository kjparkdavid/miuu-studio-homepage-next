// Squirrel Burrow track — ported from source/burrow6.py (the reel's renderer).
// Zones, colors, curves, hills, speed profile and scenery placement match the video.

export const N = 1330;
export const SEG_LEN = 200;
export const ROAD_W = 760;
export const CAM_H = 640;
export const CAM_DEPTH = 1 / Math.tan((50 * Math.PI) / 180);
export const BAND = 3;
export const LIP = 52, ENTRANCE = 74, EXIT = 1080;
export const P_STOP = 1130.5;

export const mod = (i) => ((i % N) + N) % N;
const F_ = (1080 - 74) / (850 - 74);
export const M = (i) => (i <= 74 ? i : Math.round(74 + (i - 74) * F_));
export const inside = (i) => { i = mod(i); return i >= ENTRANCE && i < EXIT; };

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mixArr = (a, b, t) => [
  (a[0] + (b[0] - a[0]) * t) | 0,
  (a[1] + (b[1] - a[1]) * t) | 0,
  (a[2] + (b[2] - a[2]) * t) | 0,
];

// ---------------- zones ----------------
export const Z = {
  out:     { wall: [[0, 0, 0], [0, 0, 0]], floor: [[178, 222, 168], [164, 212, 156]], road: [[222, 198, 166], [212, 188, 156]], rumble: [[248, 236, 230], [244, 150, 182]], lane: [246, 238, 224], glow: [255, 226, 206], R: 0, speed: 1.0 },
  roots:   { wall: [[110, 74, 56], [124, 86, 64]], floor: [[150, 106, 76], [142, 100, 72]], road: [[206, 168, 124], [196, 158, 116]], rumble: [[246, 228, 196], [170, 112, 80]], lane: [242, 226, 196], glow: [255, 196, 132], R: 1400, speed: 1.05 },
  store:   { wall: [[170, 112, 62], [184, 124, 70]], floor: [[198, 148, 92], [188, 140, 86]], road: [[236, 202, 146], [226, 192, 136]], rumble: [[255, 240, 200], [206, 124, 72]], lane: [255, 240, 206], glow: [255, 216, 150], R: 2500, speed: 0.85 },
  grotto:  { wall: [[56, 50, 104], [66, 58, 118]], floor: [[72, 62, 120], [64, 56, 110]], road: [[104, 94, 162], [96, 86, 152]], rumble: [[170, 240, 236], [120, 92, 184]], lane: [176, 246, 240], glow: [84, 72, 156], R: 1750, speed: 1.0 },
  village: { wall: [[152, 98, 88], [164, 108, 96]], floor: [[188, 132, 112], [178, 124, 106]], road: [[234, 200, 172], [224, 190, 162]], rumble: [[248, 234, 222], [228, 132, 152]], lane: [246, 232, 220], glow: [255, 198, 172], R: 1950, speed: 0.8 },
  warp:    { wall: [[88, 72, 150], [100, 84, 166]], floor: [[118, 98, 176], [110, 92, 166]], road: [[170, 150, 222], [160, 140, 212]], rumble: [[255, 255, 255], [242, 160, 212]], lane: [255, 244, 255], glow: [236, 206, 255], R: 1500, speed: 1.45 },
};
export const ZONES = [
  [0, 74, "out"], [74, M(200), "roots"], [M(200), M(360), "store"], [M(360), M(520), "grotto"],
  [M(520), M(700), "village"], [M(700), 1080, "warp"], [1080, 1330, "out"],
];
export const ZONE_TITLES = { roots: "Squirrel Burrow", store: "Acorn Storage", grotto: "Glow Grotto", village: "Squirrel Village", warp: "Warp Tunnel" };

export function zoneOf(i) {
  i = mod(i);
  for (const [a, b, z] of ZONES) if (i >= a && i < b) return z;
  return "out";
}

const TR = 14;
function blendInfo(i) {
  i = mod(i);
  for (let k = 1; k < ZONES.length - 1; k++) {
    const [a, b, z] = ZONES[k];
    if (i >= a && i < b) {
      if (i - a < TR && k > 1) return [ZONES[k - 1][2], z, 0.5 + (0.5 * (i - a)) / TR];
      if (b - i <= TR && k < ZONES.length - 2) return [z, ZONES[k + 1][2], 0.5 * (1 - (b - i) / TR)];
      return [z, z, 1.0];
    }
  }
  return ["out", "out", 1.0];
}
const smooth = (t) => t * t * (3 - 2 * t);

export const SEGC = [];
for (let i = 0; i < N; i++) {
  let [za, zb, t] = blendInfo(i);
  if (za === zb) t = 1.0;
  t = smooth(t);
  const A = Z[za], B = Z[zb];
  const c = {};
  for (const key of ["wall", "floor", "road", "rumble"]) c[key] = [0, 1].map((j) => mixArr(A[key][j], B[key][j], t));
  for (const key of ["lane", "glow"]) c[key] = mixArr(A[key], B[key], t);
  c.R = inside(i) ? A.R + (B.R - A.R) * t : 0;
  c.zone = zoneOf(i);
  SEGC.push(c);
}
SEGC[ENTRANCE].R = Z.roots.R;

export function edgeR(segi) {
  const c = SEGC[mod(segi)];
  if (c.R) return c.R;
  return SEGC[mod(segi - 1)].R || Z.roots.R;
}

// ---------------- track ----------------
const ease = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);
const curvesArr = [];
const straight = (n) => { for (let i = 0; i < n; i++) curvesArr.push(0); };
function curve(enter, hold, leave, c) {
  for (let i = 0; i < enter; i++) curvesArr.push(ease(0, c, i / enter));
  for (let i = 0; i < hold; i++) curvesArr.push(c);
  for (let i = 0; i < leave; i++) curvesArr.push(ease(c, 0, i / leave));
}
straight(110);              // meadow + drop + landing
curve(22, 100, 22, 4.0);    // T1 right  (roots -> store)
straight(16);
curve(22, 100, 22, -4.5);   // T2 left   (store)
straight(16);
curve(22, 100, 22, 4.5);    // T3 right  (store -> grotto)
straight(16);
curve(22, 100, 22, -4.5);   // T4 left   (grotto -> village)
straight(16);
curve(22, 100, 22, 4.0);    // T5 right  (village -> warp)
straight(16);
curve(22, 100, 22, -5.0);   // T6 left   (warp)
straight(N - curvesArr.length);
export const curves = Float32Array.from(curvesArr);

export function curveAt(p) {
  const i = Math.floor(p), f = p - i;
  return curves[mod(i)] * (1 - f) + curves[mod(i + 1)] * f;
}

const FY_PTS = [[0, 0], [52, 0], [74, -2650], [92, -2900], [M(200), -2950], [M(280), -2950], [M(360), -3050], [M(425), -3350], [M(480), -3050], [M(520), -3050], [M(720), -3000], [1080, 0], [1330, 0]];
const FLOOR_Y = new Float32Array(N);
for (let i = 0; i < N; i++) {
  for (let k = 0; k < FY_PTS.length - 1; k++) {
    const [a, ya] = FY_PTS[k], [b, yb] = FY_PTS[k + 1];
    if (i >= a && i <= b) { const t = (i - a) / (b - a); FLOOR_Y[i] = ya + (yb - ya) * (0.5 - 0.5 * Math.cos(Math.PI * t)); break; }
  }
}
export const floorY = (i) => FLOOR_Y[mod(i)];

// speed profile (relative), smoothed like the video
const vs = new Float32Array(N);
for (let i = 0; i < N; i++) vs[i] = Z[zoneOf(i)].speed;
for (let i = 52; i < 96; i++) vs[i] = 1.15;   // the plunge
for (let i = 96; i < 130; i++) vs[i] = 0.85;  // calm landing
export const VS = new Float32Array(N);
{
  const kk = 61, h = (kk / 2) | 0;
  for (let i = 0; i < N; i++) { let s = 0; for (let j = i - h; j <= i + h; j++) s += vs[mod(j)]; VS[i] = s / kk; }
}
export const speedAt = (p) => VS[mod(Math.floor(p))];

// ---------------- scenery placements (same rules as the video) ----------------
const rng = mulberry32(5);
const choice = (arr) => arr[Math.floor(rng() * arr.length)];
export const sprites = new Map(); // idx -> [{kind, x, y}]
const add = (i, kind, x, y = 0) => {
  i = mod(i);
  if (!sprites.has(i)) sprites.set(i, []);
  sprites.get(i).push({ kind, x, y });
};
for (const i of [...range(0, LIP - 4, 4), ...range(EXIT + 2, N, 4)]) {
  const side = Math.floor(i / 4) % 2 ? 1 : -1;
  add(i, ["tree_p", "tree_g", "tree_o"][Math.floor(i / 4) % 3], side * (1700 + rng() * 700));
  add(i + 2, "flowers", -side * (1050 + rng() * 250));
}
add(28, "sign_burrow", 1500);
// billboards for the app: one at the start line, two where the car comes to rest
add(12, "sign_miuu", -1500);
add(EXIT + 22, "sign_miuu", -1450);
add(EXIT + 60, "sign_miuu", 1350);
for (const i of range(M(56), M(200), 5)) {
  if (rng() < 0.7) {
    const side = choice([-1, 1]);
    add(i, rng() < 0.6 ? "mush" : "acorn", side * (1000 + rng() * 200));
  }
}
add(M(186), "sign_store", 1180);
for (const i of range(M(206), M(356), 10)) {
  const side = Math.floor(i / 10) % 2 ? -1 : 1;
  add(i, "pile", side * 1750);
  if (Math.floor(i / 10) % 3 === 0) add(i + 5, "squirrel", -side * 1050);
  add(i + 5, "acorn", side * 1050);
}
add(M(346), "sign_grotto", 1150);
for (const i of range(M(364), M(518), 6)) {
  const side = Math.floor(i / 6) % 2 ? -1 : 1;
  add(i, Math.floor(i / 6) % 3 ? "glow_c" : "glow_p", side * (1250 + rng() * 250));
}
export const FIREFLIES = new Map();
for (const i of range(M(360), M(522), 2)) {
  const list = [];
  for (let k = 0; k < 4; k++) {
    list.push({ x: (rng() * 2 - 1) * 1300, y: 250 + rng() * 1400, ph: rng() * 6.28, col: rng() < 0.6 ? "rgb(255,255,210)" : "rgb(220,255,250)" });
  }
  FIREFLIES.set(i, list);
}
add(M(506), "sign_village", 1250);
for (const i of range(M(526), M(698), 11)) {
  const side = Math.floor(i / 11) % 2 ? -1 : 1;
  add(i, "door", side * 1700);
  add(i + 5, "door", -side * 1700);
}
for (const i of range(M(530), M(690), 22)) {
  const side = Math.floor(i / 22) % 2 ? 1 : -1;
  add(i, "squirrel", side * 1080);
  add(i + 8, "flowers", -side * 1100);
}
add(M(690), "sign_warp", 1150);
for (const i of range(M(704), 1076, 7)) {
  const c = curves[mod(i + 6)];
  if (Math.abs(c) > 1.5) add(i, c < 0 ? "chev_l" : "chev_r", c < 0 ? 1150 : -1150);
  else if (rng() < 0.6) add(i, "crystal", choice([-1, 1]) * (1080 + rng() * 200));
}

function range(a, b, step) { const out = []; for (let i = a; i < b; i += step) out.push(i); return out; }

// ---------------- gameplay layer (new for the game) ----------------
// Boost pads sit on the inside line of curves or weave across straights.
export const PADS = [
  { seg: 215, x: 300 }, { seg: 420, x: -250 }, { seg: 582, x: 250 },
  { seg: 742, x: 0 }, { seg: 902, x: -250 }, { seg: 1000, x: -300 },
];
export const PAD_LEN = 4;

export function buildGameplay(seed = 11) {
  const r = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const pickups = new Map();   // seg -> [{x, taken}]
  const obstacles = new Map(); // seg -> [{x, kind, hit}]
  const nearPad = (s, d) => PADS.some((p) => Math.abs(p.seg - s) < d);
  for (let g = 100; g < 1062; g += 36) {
    if (!nearPad(g + 6, 12)) {
      const c = curves[g + 6];
      let x0, x1;
      if (Math.abs(c) > 1) x0 = x1 = Math.sign(c) * 420;   // inside line of the curve
      else { x0 = pick([-420, 0, 420]); x1 = pick([-420, 0, 420]); }
      for (let k = 0; k < 5; k++) {
        const s = g + k * 3;
        if (!pickups.has(s)) pickups.set(s, []);
        pickups.get(s).push({ x: x0 + ((x1 - x0) * k) / 4, taken: false });
      }
    }
    const o = g + 20;
    if (o >= 140 && !nearPad(o, 10) && r() < 0.6) {
      const c = curves[o];
      const x = Math.abs(c) > 1 ? -Math.sign(c) * 450 : pick([-450, 0, 450]);   // outside line punishes drifting wide
      const z = zoneOf(o);
      obstacles.set(o, [{ x, kind: z === "grotto" || z === "warp" ? "crystal_ob" : "mush_ob", hit: false }]);
    }
  }
  return { pickups, obstacles };
}
