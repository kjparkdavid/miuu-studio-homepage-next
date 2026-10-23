// Halloween track — ported from source/halloween_outrun_v9.py (the Halloween reel's renderer).
// A drive through a dusk pumpkin patch, a graveyard, a haunted street and a crypt, then a candy-corn
// bridge that plunges over a misty chasm and a moon road up into the night, ending at a haunted house.
// path_y is the road's height: a rollercoaster of hills, with the big drop on the bridge.
import { mulberry32 } from "./track.js";

export const N = 1400;
export const SEG_LEN = 200;
export const CAM_H = 520;
export const PATCH_END = 230, GRAVE_END = 350, STREET_END = 470, TUNNEL_END = 690, BRIDGE_END = 790, SKY_END = 960;
export const DROP_A = TUNNEL_END + 14, DROP_B = TUNNEL_END + 40;   // the plunge off the bridge
export const P_STOP = SKY_END + 55.5;
export const BRAKE_FROM = SKY_END + 5;
export const ESCAPE = SKY_END - 2;          // the thief gets away once it reaches the end of the moon road
export const TIRED_FROM = TUNNEL_END + 50;  // where the thief starts to wear out: once off the bridge's drop
export const HOUSE_SEG = Math.floor(P_STOP) + 38;
export const END_ROAD = HOUSE_SEG - 1;      // the road stops at the haunted house (a hill hides the end)
export const RW = 720;                      // half-width of the road
export const RIB_R = 1500;                  // the crypt's vault
export const MIST_Y = -4300;                // the chasm's misty floor
export const BOO_SEG = STREET_END + 12;     // the ghost that flies at the windshield in the crypt
export const SWARMS = [STREET_END - 14, BRIDGE_END - 10];   // bats swooping past the camera

export const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const clampI = (i) => Math.max(0, Math.min(N - 1, i));

export function zoneOf(i) {
  for (const [b, z] of [[PATCH_END, "patch"], [GRAVE_END, "grave"], [STREET_END, "street"], [TUNNEL_END, "tunnel"], [BRIDGE_END, "bridge"], [SKY_END, "sky"]]) {
    if (i < b) return z;
  }
  return "arrival";
}
export const ZONE_TITLES = { patch: "Pumpkin Patch", grave: "Graveyard", street: "Haunted Street", tunnel: "The Crypt", bridge: "Candy Corn Bridge", sky: "Moon Road" };
// the zones on the bridge and above it, where the road hangs over the chasm
export const overChasm = (i) => i >= TUNNEL_END;
export const inTunnel = (i) => i >= STREET_END && i < TUNNEL_END;

// ---------------- heights ----------------
function keyinterp(pts, i) {
  if (i <= pts[0][0]) return pts[0][1];
  for (let k = 0; k < pts.length - 1; k++) {
    const [a, ya] = pts[k], [b, yb] = pts[k + 1];
    if (i >= a && i <= b) { const t = (i - a) / (b - a); return ya + (yb - ya) * (0.5 - 0.5 * Math.cos(Math.PI * t)); }
  }
  return pts[pts.length - 1][1];
}
const PY = [[0, 0], [DROP_A, 0], [DROP_B, -2600], [TUNNEL_END + 70, -2450], [BRIDGE_END + 10, 400], [SKY_END - 40, 2000], [N, 2000]];
function und(i) {
  const w = smooth((i - 60) / 30) * (1 - smooth((i - (TUNNEL_END - 25)) / 20)) + smooth((i - (BRIDGE_END + 10)) / 20) * (1 - smooth((i - (SKY_END - 45)) / 25));
  const q = i - 60;
  return w * (640 * Math.sin((2 * Math.PI * q) / 124) + 240 * Math.sin((2 * Math.PI * q) / 53 + 0.7));
}
export const pathY = (i) => keyinterp(PY, i) + und(i);
// per-segment cache (the renderer asks for this thousands of times a frame)
export const PATH_Y = new Float32Array(N + 2);
for (let i = 0; i < N + 2; i++) PATH_Y[i] = pathY(Math.min(i, N - 1));
export const slopeAt = (p) => (pathY(p + 3) - pathY(p)) / (3 * SEG_LEN);

// ---------------- curves: three slaloms, each a left sweep straight into a right one ----------------
const ease = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);
const cv = [];
const straight = (n) => { for (let i = 0; i < n; i++) cv.push(0); };
function slalom(enter, hold, swap, leave, c1, c2) {
  for (let i = 0; i < enter; i++) cv.push(ease(0, c1, i / enter));
  for (let i = 0; i < hold; i++) cv.push(c1);
  for (let i = 0; i < swap; i++) cv.push(ease(c1, c2, i / swap));
  for (let i = 0; i < hold; i++) cv.push(c2);
  for (let i = 0; i < leave; i++) cv.push(ease(c2, 0, i / leave));
}
straight(112);
for (const [c1, c2] of [[-7.0, 7.5], [-7.5, 7.0], [-7.5, 8.0]]) { slalom(9, 110, 16, 14, c1, c2); straight(20); }
straight(N - cv.length);
export const curves = Float32Array.from(cv);
export function curveAt(p) {
  const i = Math.floor(p), f = p - i;
  return curves[clampI(i)] * (1 - f) + curves[clampI(i + 1)] * f;
}

// ---------------- speed profile: each zone a little faster, quicker downhill, slower up ----------------
const SPEEDS = { patch: 1.0, grave: 1.0, street: 1.0, tunnel: 1.1, bridge: 1.15, sky: 1.2, arrival: 1.1 };
export const VS = new Float32Array(N);
{
  const vs = Array.from({ length: N }, (_, i) => SPEEDS[zoneOf(i)]);
  const h = 20;
  for (let i = 0; i < N; i++) {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - h); j <= Math.min(N - 1, i + h); j++) { s += vs[j]; n++; }
    const sl = slopeAt(i);
    VS[i] = (s / n) * (1 + 1.6 * Math.max(0, -sl) - 0.6 * Math.max(0, sl));
  }
}
export const speedAt = (p) => VS[clampI(Math.floor(p))];

// ---------------- colours along the way (palette_zones.json) ----------------
// sky: which picture of sky_layers/ shows; fog: what distance fades into; dens: how fast it does
export const ENV = {
  patch: { sky: "sky_dusk", fog: [118, 62, 96], dens: 2.6 },
  grave: { sky: "sky_grave", fog: [70, 86, 88], dens: 3.0 },
  street: { sky: "sky_grave", fog: [70, 86, 88], dens: 3.0 },
  tunnel: { sky: "sky_night", fog: [34, 24, 40], dens: 3.2 },
  bridge: { sky: "sky_night", fog: [76, 52, 106], dens: 2.2 },
  sky: { sky: "sky_night", fog: [76, 52, 106], dens: 2.2 },
  arrival: { sky: "sky_night", fog: [76, 52, 106], dens: 2.0 },
};
// where one zone's sky and fog fade into the next: [segment, half-width of the fade, zone after]
const FADES = [[PATCH_END, 14, "grave"], [STREET_END, 10, "tunnel"], [TUNNEL_END - 30, 30, "bridge"], [BRIDGE_END, 10, "sky"], [SKY_END, 10, "arrival"]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// { a, b, t: sky pictures and how far a has faded into b; fog; dens } for the camera's position
export function envAt(pos) {
  const here = ENV[zoneOf(Math.floor(pos))];
  for (const [b, w, next] of FADES) {
    if (pos < b - w || pos > b + w) continue;
    const A = ENV[zoneOf(b - w - 1)], B = ENV[next], t = smooth((pos - (b - w)) / (2 * w));
    return { a: A.sky, b: B.sky, t, fog: lerp3(A.fog, B.fog, t), dens: A.dens + (B.dens - A.dens) * t };
  }
  return { a: here.sky, b: here.sky, t: 0, fog: here.fog, dens: here.dens };
}
// the road and the ground under it, by zone: [band A, band B] (a band is three segments)
export const GROUND = { patch: [[48, 58, 46], [44, 52, 42]], grave: [[46, 48, 56], [42, 44, 52]], street: [[46, 48, 56], [42, 44, 52]], tunnel: [[52, 46, 62], [46, 40, 56]] };
export const ROADS = {
  patch: { road: [[74, 62, 96], [68, 56, 90]], rumble: [[246, 134, 52], [40, 28, 54]], lane: [255, 196, 120] },
  grave: { road: [[66, 60, 84], [60, 54, 78]], rumble: [[130, 210, 96], [36, 30, 52]], lane: [220, 232, 200] },
  street: { road: [[66, 60, 84], [60, 54, 78]], rumble: [[130, 210, 96], [36, 30, 52]], lane: [220, 232, 200] },
  tunnel: { road: [[64, 58, 76], [58, 52, 70]], rumble: [[200, 70, 64], [40, 30, 48]], lane: [236, 206, 160] },
};

// ---------------- scenery placements ----------------
const rng = mulberry32(9);
const side = () => (rng() < 0.5 ? -1 : 1);
const int = (n) => Math.floor(rng() * n);
// seg -> [{kind, x, anchor, y, k}]: anchor "ground" stands on the road's height, "float" bobs above it,
// "pop" rises out of the ground as you come near, "hang" hangs from the crypt's roof, "abs" is a fixed
// height; k staggers the animated ones
export const objs = new Map();
const add = (i, kind, x, anchor = "ground", y = 0) => {
  i = Math.floor(i);
  if (!objs.has(i)) objs.set(i, []);
  const list = objs.get(i);
  list.push({ kind, x, anchor, y, k: list.length + i * 7 });
};
// 1 · the dusk pumpkin patch: jack-o'-lanterns lining the road
for (let i = 2; i < PATCH_END + 6; i += 3) for (const sg of [-1, 1]) add(i, "jack", sg * (950 + rng() * 80));
for (let i = 4; i < PATCH_END; i += 2) add(i, "pumpkin", side() * (1300 + rng() * 3200));
for (let i = 6; i < PATCH_END + 20; i += 5) add(i, rng() < 0.5 ? "deadtree_0" : "deadtree_1", side() * (1900 + rng() * 3600));
for (const [i, sg] of [[24, 1], [110, -1], [190, 1]]) add(i, "scarecrow", sg * 1600);
for (let i = 60; i < STREET_END; i += 9) add(i, "eyes", side() * (3600 + rng() * 2600), "float", 250 + rng() * 450);
// 2 · the graveyard, then the haunted street
for (let i = PATCH_END; i < GRAVE_END; i += 2) add(i, "tombstone_" + int(3), side() * (1150 + rng() * 2300));
for (let i = PATCH_END; i < GRAVE_END; i += 4) for (const sg of [-1, 1]) add(i, "fence", sg * 1020);
for (let i = PATCH_END + 3; i < GRAVE_END; i += 5) add(i, "hand", side() * (1000 + rng() * 1500));
for (const [i, sg] of [[PATCH_END + 30, -1], [PATCH_END + 75, 1], [GRAVE_END + 40, -1]]) add(i, "cauldron", sg * 1500);
for (let i = PATCH_END + 12, k = 0; i < GRAVE_END; i += 22, k++) add(i, "skeleton", (k % 2 ? 1 : -1) * (1300 + rng() * 600));
for (let i = 30; i < PATCH_END; i += 14) add(i, "tombstone_" + int(3), side() * (1500 + rng() * 1800));
for (let i = 40; i < STREET_END; i += 11) add(i, "eyes_red", side() * (3000 + rng() * 2500), "float", 200 + rng() * 300);
for (let i = GRAVE_END - 6, k = 0; i < STREET_END - 8; i += 8, k++) add(i, "house_" + (k % 2), (k % 2 ? 1 : -1) * (2250 + rng() * 250));
for (let i = GRAVE_END, k = 0; i < STREET_END; i += 6, k++) add(i, "lamppost", (k % 2 ? 1 : -1) * 960);
for (let i = PATCH_END + 8, k = 0; i < STREET_END - 10; i += 9, k++) add(i, "ghost", (k % 2 ? 1 : -1) * (1100 + rng() * 400), "pop", 120);
for (let i = PATCH_END; i < STREET_END; i += 6) add(i, "jack", side() * 960);
// string lights over the haunted street
export const LIGHT_SEGS = new Set();
for (let i = GRAVE_END + 4; i < STREET_END - 4; i += 10) LIGHT_SEGS.add(i);
// 3 · the crypt. The vault's outline, -1..1 across and 0..1.35 up (times RIB_R).
export const UNIT = [[-1, 0], [-1, 0.35]];
for (let k = 1; k < 20; k++) { const a = Math.PI - (Math.PI * k) / 20; UNIT.push([Math.cos(a), 0.35 + Math.sin(a)]); }
UNIT.push([1, 0.35], [1, 0]);
for (let i = STREET_END + 8; i < TUNNEL_END - 4; i += 11) add(i, "cobweb_arch", 0);
// skull-lined walls (the reel has three rows every other segment; a row every fourth is plenty at this size)
for (let i = STREET_END + 1; i < TUNNEL_END; i += 4) for (const sg of [-1, 1]) for (const h of [420, 760, 1100]) add(i, "skull", sg * (RIB_R - 120 - h * 0.05), "ground", h + (rng() * 2 - 1) * 60);
for (let i = STREET_END + 6, k = 0; i < TUNNEL_END - 4; i += 9, k++) add(i, "coffin", (k % 2 ? 1 : -1) * (RIB_R - 260));
for (let i = STREET_END + 3, k = 0; i < TUNNEL_END; i += 6, k++) add(i, "sconce", (k % 2 ? -1 : 1) * (RIB_R - 160), "ground", 1350);
for (let i = STREET_END + 14; i < TUNNEL_END - 6; i += 15) add(i, "cage", side() * (380 + rng() * 420), "hang", 700 + rng() * 300);
for (let i = STREET_END + 4; i < TUNNEL_END; i += 4) {   // red eyes in holes in the walls
  const [ux, uy] = UNIT[[3, 4, 5, 6, 16, 17, 18, 19][int(8)]];
  add(i, "eyes_red", ux * RIB_R * 0.93, "ground", uy * RIB_R * 0.93 - 80);
}
for (const [k, i] of [STREET_END + 40, STREET_END + 120, STREET_END + 190].entries()) add(i, "skeleton", (k % 2 ? 1 : -1) * (RIB_R - 380));
// 4/5 · mist in the chasm under the bridge and the moon road, and things floating beside the road
for (let i = TUNNEL_END - 20; i < SKY_END + 120; i += 2) add(i, "mist_cloud", side() * (1600 + rng() * 9000), "abs", MIST_Y + 300 + rng() * 1700);
for (let i = BRIDGE_END + 6, k = 0; i < SKY_END - 10; i += 9, k++) add(i, "jack", (k % 2 ? 1 : -1) * (1300 + rng() * 1300), "float", 300 + rng() * 800);
for (let i = BRIDGE_END + 10, k = 0; i < SKY_END; i += 7, k++) add(i, "candle", (k % 2 ? -1 : 1) * (900 + rng() * 900), "float", 500 + rng() * 700);
for (let i = BRIDGE_END + 20, k = 0; i < SKY_END - 20; i += 22, k++) add(i, "ghost", (k % 2 ? 1 : -1) * (1500 + rng() * 600), "float", 400 + rng() * 500);
// the arrival: the haunted house where the car comes to rest, jack-o'-lanterns at its gate
add(HOUSE_SEG, "haunted_house", 0, "ground", -420);
for (const d of [8, 16, 26]) for (const sg of [-1, 1]) add(Math.floor(P_STOP) + d, "jack", sg * 980);
// billboards for the app, as on the other stages: one at the start line, one where the car stops
add(12, "sign_miuu", -1500);
add(Math.floor(P_STOP) + 4, "sign_miuu", -1400);

// ---------------- gameplay layer (new for the game) ----------------
// Pads sit at the zone changes (where the reel boosts) and on the inside line of the sweeps.
export const PADS = [
  { seg: PATCH_END - 6, x: 0 }, { seg: 380, x: -250 }, { seg: STREET_END - 8, x: 0 }, { seg: 580, x: 300 },
  { seg: TUNNEL_END - 6, x: 0 }, { seg: 760, x: -300 }, { seg: 870, x: 300 },
];
export const PAD_LEN = 4;
export const GIFT = 5;   // candies in a gift pumpkin
const CANDIES = ["candy_pink", "candycorn", "candy_mint", "lollipop", "candy_orange"];

// Lines of candy along the road, a gift pumpkin now and then, and spiders hanging in the lane. A spider
// costs nothing to hit (it is blasted into the sky), so, as the sky's birds, they hang where the player
// is already being led: at the end of the candy line before them, and now and then a row of three.
export function buildGameplay(seed = 41) {
  const r = mulberry32(seed);
  const pk = (arr) => arr[Math.floor(r() * arr.length)];
  const pickups = new Map();   // seg -> [{x, kind, worth, taken}]
  const obstacles = new Map(); // seg -> [{x, kind, hit}]
  const nearPad = (s, d) => PADS.some((p) => Math.abs(p.seg - s) < d);
  // keep the plunge off the bridge and the crypt's mouth clear
  const noGo = (s) => (s > DROP_A - 14 && s < DROP_B + 6) || Math.abs(s - STREET_END) < 6;
  const put = (map, s, o) => { if (!map.has(s)) map.set(s, []); map.get(s).push(o); };
  for (let g = 60, j = 0; g < SKY_END - 30; g += 34, j++) {
    let x1 = 0;
    if (!nearPad(g + 6, 12) && !noGo(g + 6)) {
      const c = curves[g + 6];
      let x0;
      if (Math.abs(c) > 1) x0 = x1 = Math.sign(c) * 380;   // inside line of the sweep
      else { x0 = pk([-380, 0, 380]); x1 = pk([-380, 0, 380]); }
      for (let k = 0; k < 5; k++) put(pickups, g + k * 3, { x: x0 + ((x1 - x0) * k) / 4, kind: CANDIES[(j + k) % 5], worth: 1, taken: false });
    }
    const o = g + 20;
    if (j % 2 === 0 && o >= 110 && !nearPad(o, 8) && !noGo(o)) {
      if (j % 4 === 0) for (const x of [-520, 0, 520]) put(obstacles, o, { x, kind: "spider", hit: false });   // a row of them: no way round
      else put(obstacles, o, { x: x1, kind: "spider", hit: false });
    }
    if (j % 4 === 1 && !nearPad(g + 27, 8) && !noGo(g + 27)) put(pickups, g + 27, { x: x1, kind: "gift_pumpkin", worth: GIFT, taken: false });
  }
  return { pickups, obstacles };
}
