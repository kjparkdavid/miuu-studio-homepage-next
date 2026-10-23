// Halloween stage renderer — ported from render_scene() / frame() in source/halloween_outrun_v9.py.
// Logical canvas 540x960, same projection constants as the burrow. Painted the way the sky is: the road,
// the ground and the crypt's vault a band (three segments) at a time, far to near.
import { W, H, S, VP, IMG, mix, hash01, drawSprite, registerSprites, glow, makeVignette } from "./renderer.js";
import { CAM_DEPTH } from "./track.js";
import {
  N, SEG_LEN, CAM_H, STREET_END, TUNNEL_END, END_ROAD, RW, RIB_R, MIST_Y, BOO_SEG,
  pathY, PATH_Y, curves, zoneOf, overChasm, inTunnel, envAt, GROUND, ROADS, objs, LIGHT_SEGS, UNIT, PADS, PAD_LEN,
} from "./halloween-track.js";

const DD = 150;
const BIG = 40000;
const OUTLINE = [44, 30, 66];
const CANDY_LANES = [[222, 172, 70], [214, 112, 46], [224, 204, 186]];   // outside in (the road is symmetric)
const SKIRT = [60, 40, 84];
const MIST = [[86, 66, 118], [80, 60, 110]];
const WALL = [[74, 66, 92], [66, 58, 84]], ROOT = [104, 94, 124], MORTAR = [36, 30, 50];

// Every picture here is the asset pack's, under the same name: drop a new drawing over the file and the
// game picks it up. The thief (witch_back_*) and bg_title are stand-ins made by tools/make_halloween_assets.py.
const F = (n) => "halloween/" + n;
const NAMES = [
  "jack", "jack_dim", "pumpkin", "deadtree_0", "deadtree_1", "scarecrow", "tombstone_0", "tombstone_1", "tombstone_2",
  "fence", "hand_0", "hand_1", "cauldron_0", "cauldron_1", "cauldron_2", "house_0", "house_1", "lamppost",
  "ghost_0", "ghost_1", "ghost_2", "ghost_3", "ghost_boo", "eyes_open", "eyes_closed", "eyes_red_open", "eyes_red_closed",
  "skull", "coffin_closed", "coffin_open", "sconce", "cage", "skeleton_0", "skeleton_1", "cobweb_arch", "candle",
  "mist_cloud", "haunted_house", "haunted_house_lightning", "lightning_bolt", "bat_up", "bat_down",
  "candy_pink", "candy_mint", "candy_orange", "lollipop", "candycorn", "gift_pumpkin",
  "spider", "spider_hit", "spider_hit_squash", "spider_impact_0", "spider_impact_1", "spider_impact_2", "spider_impact_3", "spider_impact_4",
  "web_smear", "cockpit_frame", "cockpit_console", "cockpit_wheel", "charm_pumpkin",
  "bucket_fill_0", "bucket_fill_1", "bucket_fill_2", "bucket_fill_3", "bucket_fill_4", "bucket_fill_5",
  "witch_back_diary", "witch_back_empty",
];
export const HALLOWEEN_FILES = Object.fromEntries(NAMES.map((n) => [n, F(n)]));
Object.assign(HALLOWEEN_FILES, { sky_dusk: F("sky_dusk"), sky_grave: F("sky_graveyard"), sky_night: F("sky_night_bloodmoon"), app_icon: "app_icon" });
// world widths (the road's half-width is 720), as in the reel
const HW_WW = {
  jack: 470, jack_dim: 470, pumpkin: 380, deadtree_0: 1500, deadtree_1: 1500, scarecrow: 800,
  tombstone_0: 420, tombstone_1: 420, tombstone_2: 420, fence: 900, hand_0: 300, hand_1: 300,
  cauldron_0: 560, cauldron_1: 560, cauldron_2: 560, house_0: 2300, house_1: 2300, lamppost: 360,
  ghost_0: 560, ghost_1: 560, ghost_2: 560, ghost_3: 560, ghost_boo: 600, spider: 900, spider_hit: 900,
  eyes_open: 300, eyes_closed: 300, eyes_red_open: 360, eyes_red_closed: 360, cobweb_arch: 3300, candle: 150,
  mist_cloud: 5200, haunted_house: 9000, haunted_house_lightning: 9000, skull: 230, coffin_closed: 520, coffin_open: 520,
  sconce: 300, cage: 520, skeleton_0: 520, skeleton_1: 520,
  candy_pink: 230, candy_mint: 230, candy_orange: 230, lollipop: 160, candycorn: 150, gift_pumpkin: 600,
  witch_back_diary: 640, witch_back_empty: 640,
};
registerSprites(HALLOWEEN_FILES, HW_WW);
export const HALLOWEEN_KEYS = Object.keys(HALLOWEEN_FILES);

// things that light up: colour, glow size (x the picture's width), height of its centre (x the picture's
// height), strength. Emissive ones also fade less into the fog.
const GLOWS = {
  jack: ["255,140,40", 2.4, 0.45, 0.55], jack_dim: ["255,140,40", 2.1, 0.45, 0.4], lamppost: ["255,180,80", 1.9, 0.86, 0.6],
  candle: ["255,200,100", 3.4, 0.9, 0.6], cauldron_0: ["140,255,80", 1.9, 0.55, 0.55], cauldron_1: ["140,255,80", 1.9, 0.55, 0.55],
  cauldron_2: ["140,255,80", 1.9, 0.55, 0.55], eyes_open: ["190,255,110", 1.6, 0.5, 0.4], haunted_house: ["255,170,80", 1.1, 0.45, 0.35],
  sconce: ["255,140,50", 3.0, 0.55, 0.65], eyes_red_open: ["255,60,50", 1.5, 0.5, 0.45],
};
const EMISSIVE = new Set(["jack", "jack_dim", "lamppost", "candle", "cauldron_0", "cauldron_1", "cauldron_2", "eyes_open", "house_0", "house_1", "haunted_house", "haunted_house_lightning", "sconce", "eyes_red_open"]);
const GLOW_N = 100;   // no glows beyond this many segments: lost in the fog anyway

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Camera height for a position: rides CAM_H above the road.
export const camYOf = (pos) => pathY(pos) + CAM_H;

let VIGNETTE = null;
// what the cockpit shows, kept from the last frame drawn
const dash = { speed: 0, boost: 0, t: 0, items: 0 };

// ---------------- frame ----------------
// view = { pos, camX, camY, pitch, yaw, jitter, rot, t, speedNorm, boostE, pickups, obstacles, entities, fx, flyers, items }
export function renderHalloween(ctx, view) {
  if (!VIGNETTE) VIGNETTE = makeVignette("30,10,40", 1.1);
  const { pos, camX, camY, pitch, yaw, t } = view;
  Object.assign(dash, { speed: view.speedNorm, boost: view.boostE, t, items: view.items || 0 });
  const env = envAt(pos);
  const FOG = env.fog;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const vp = VP + view.jitter;
  const hz = vp - CAM_DEPTH * S * Math.tan(pitch);
  const cx0 = W / 2 + yaw;
  const base = Math.floor(pos), pct = pos - base;
  const position = pos * SEG_LEN;
  const fx = view.fx || {};
  const flash = (k) => k >= 0 && k < 0.2;   // a lightning strike lights the haunted house for a moment
  const lit = [0, 1, 2].some((j) => flash(fx["bolt" + j]));

  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(view.rot); ctx.translate(-W / 2, -H / 2);

  // the sky: one picture per zone (horizon 428 px down it), cross-faded between zones, slid a little with the steering
  ctx.fillStyle = "rgb(14,10,28)"; ctx.fillRect(-W, -H, W * 3, H * 3);
  const sx = W / 2 - 530 + Math.max(-150, Math.min(150, yaw * 0.4)), sy = hz - 428;
  ctx.drawImage(IMG[env.a], sx, sy, 1060, 1070);
  if (env.t > 0.01 && env.b !== env.a) { ctx.globalAlpha = env.t; ctx.drawImage(IMG[env.b], sx, sy, 1060, 1070); ctx.globalAlpha = 1; }
  for (let k = 0; k < 7; k++) {   // bats far away
    const bx = ((hash01(k, 1) * 1060 + t * (20 + 15 * hash01(k, 2))) % 1060) + sx;
    const by = hz - (100 + hash01(k, 3) * 350) + Math.sin(t * 1.4 + k) * 10, bw = 17 + 10 * hash01(k, 4);
    ctx.drawImage(IMG[(Math.floor(t * 10) + k) % 2 ? "bat_up" : "bat_down"], bx, by, bw, bw * 0.6);
  }

  // segment edges
  const EZ = new Float32Array(DD + 1), EX = new Float32Array(DD + 1), EY = new Float32Array(DD + 1);
  let x = 0, dx = -(curves[Math.min(base, N - 1)] * pct);
  for (let n = 0; n <= DD; n++) {
    const segi = base + n;
    EZ[n] = segi * SEG_LEN - position; EX[n] = x; EY[n] = PATH_Y[Math.min(segi, N - 1)];
    x += dx; dx += curves[Math.min(segi, N - 1)];
  }
  let PX = 0, PY = 0, PS = 0;
  const projRaw = (z, ex, wx, Y) => {
    const dy = Y - camY;
    const z2 = Math.max(25, z * cp - dy * sp);
    PS = CAM_DEPTH / z2;
    PX = cx0 + PS * (ex + wx - camX) * S;
    PY = vp - PS * (dy * cp + z * sp) * S;
  };
  const proj = (n, wx, Y) => projRaw(EZ[n], EX[n], wx, Y);
  const lastEdge = Math.min(DD, N - 1 - base);
  const fogOf = (n) => 1 - Math.exp(-((n / DD) ** 2) * env.dens);
  // a ribbon along the road from edge a to edge b (b further), between x0 and x1, yOff above the road
  const ribbon = (a, b, x0, x1, yOff) => {
    for (let e = a; e <= b; e++) { proj(e, x0, EY[e] + yOff); e === a ? ctx.moveTo(PX, PY) : ctx.lineTo(PX, PY); }
    for (let e = b; e >= a; e--) { proj(e, x1, EY[e] + yOff); ctx.lineTo(PX, PY); }
    ctx.closePath();
  };
  const strip = (a, b, x0, x1, fill, yOff = 0) => { ctx.fillStyle = fill; ctx.beginPath(); ribbon(a, b, x0, x1, yOff); ctx.fill(); };
  // quad between edge n (height Y1) and the next edge (height Y2), from xa to xb
  const quad = (n, xa, xb, Y1, Y2, fill) => {
    ctx.fillStyle = fill; ctx.beginPath();
    proj(n, xa, Y1); ctx.moveTo(PX, PY); proj(n, xb, Y1); ctx.lineTo(PX, PY);
    proj(n + 1, xb, Y2); ctx.lineTo(PX, PY); proj(n + 1, xa, Y2); ctx.lineTo(PX, PY);
    ctx.closePath(); ctx.fill();
  };
  // a ring standing across the road at edge n: the band between two sizes (x, y) of the vault's outline
  const ring = (n, Y, sIn, sOut, fill) => {
    ctx.fillStyle = fill; ctx.beginPath();
    for (let k = 0; k < UNIT.length; k++) { proj(n, UNIT[k][0] * RIB_R * sIn[0], Y + UNIT[k][1] * RIB_R * sIn[1]); k ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY); }
    for (let k = UNIT.length - 1; k >= 0; k--) { proj(n, UNIT[k][0] * RIB_R * sOut[0], Y + UNIT[k][1] * RIB_R * sOut[1]); ctx.lineTo(PX, PY); }
    ctx.closePath(); ctx.fill();
  };
  const sprite = (kind, n, wx, Y, fog, opts = {}) => {
    if (fog > 0.97) return;
    proj(n, wx, Y);
    const g = GLOWS[kind];
    if (g && n < GLOW_N) {
      const tw = HW_WW[kind] * PS * S, th = (tw * IMG[kind].naturalHeight) / IMG[kind].naturalWidth;
      if (tw > 2) glow(ctx, g[0], PX, PY - th * g[2], (tw * g[1]) / 2, g[3] * (1 - fog * 0.7));
    }
    drawSprite(ctx, kind, PX, PY, opts.scale ?? PS, opts.squash ?? 1, { alpha: 1 - Math.min(1, EMISSIVE.has(kind) ? fog * 0.35 : fog), maxW: opts.maxW });
  };

  // ---- pass 1: the chasm's misty floor under the bridge and the moon road ----
  for (let n = DD - 1; n >= 0; n--) {
    const segi = base + n;
    if (EZ[n] <= 60 || segi >= N - 1 || !overChasm(segi)) continue;
    if (segi % 3 !== 2 && n !== DD - 1) continue;   // a band at a time, from its far end
    const a = Math.max(0, n - (segi % 3));
    proj(a, 0, MIST_Y); const ya = PY;
    proj(Math.min(lastEdge, n + 1), 0, MIST_Y);
    ctx.fillStyle = mix(MIST[Math.floor(segi / 3) % 2], FOG, Math.max(fogOf(n), 0.35));
    ctx.fillRect(-W, Math.min(ya, PY), W * 3, Math.abs(ya - PY) + 1);
  }

  // ---- pass 2: the ground, the road, the crypt and everything standing on them, far to near ----
  const run = (a, b, z, band) => {   // segments a..b, all in zone z, all in one band
    const e1 = Math.min(lastEdge, b + 1), f = fogOf((a + b + 1) / 2);
    if (GROUND[z]) strip(a, e1, -BIG, BIG, mix(GROUND[z][band], FOG, f));
    if (z === "tunnel") {
      ctx.fillStyle = mix(WALL[band], FOG, f); ctx.beginPath();
      for (let k = 0; k < UNIT.length - 1; k++) {
        const [u0, v0] = UNIT[k], [u1, v1] = UNIT[k + 1];
        for (let e = a; e <= e1; e++) { proj(e, u0 * RIB_R, EY[e] + v0 * RIB_R); e === a ? ctx.moveTo(PX, PY) : ctx.lineTo(PX, PY); }
        for (let e = e1; e >= a; e--) { proj(e, u1 * RIB_R, EY[e] + v1 * RIB_R); ctx.lineTo(PX, PY); }
        ctx.closePath();
      }
      ctx.fill();
      // mortar courses along the vault
      proj(a, 0, EY[a]);
      ctx.lineWidth = Math.max(1, PS * 14 * S); ctx.strokeStyle = mix(MORTAR, FOG, f); ctx.beginPath();
      for (let k = 1; k < UNIT.length - 1; k += 3) {
        for (let e = a; e <= e1; e++) { proj(e, UNIT[k][0] * RIB_R, EY[e] + UNIT[k][1] * RIB_R); e === a ? ctx.moveTo(PX, PY) : ctx.lineTo(PX, PY); }
      }
      ctx.stroke();
    }
    const rb = Math.min(e1, END_ROAD - base);   // the road stops at the haunted house
    if (rb <= a) return;
    const R = ROADS[z];
    if (R) {
      strip(a, rb, -RW - 120, RW + 120, mix(R.rumble[band], FOG, f));
      strip(a, rb, -RW, RW, mix(R.road[band], FOG, f));
      if (band === 0) strip(a, rb, -22, 22, mix(R.lane, FOG, f));
    } else {   // the candy-corn road over the chasm, with a skirt hanging under each edge
      ctx.fillStyle = mix(SKIRT, FOG, f); ctx.beginPath();
      for (const sg of [-1, 1]) {
        for (let e = a; e <= rb; e++) { proj(e, sg * RW, EY[e]); e === a ? ctx.moveTo(PX, PY) : ctx.lineTo(PX, PY); }
        for (let e = rb; e >= a; e--) { proj(e, sg * RW, EY[e] - 220); ctx.lineTo(PX, PY); }
        ctx.closePath();
      }
      ctx.fill();
      const sh = band ? 1 : 0.9;
      CANDY_LANES.forEach((c, k) => strip(a, rb, -RW * (1 - k / 3), RW * (1 - k / 3), mix(c.map((v) => v * sh), FOG, f)));
    }
  };
  let top = true;   // the first (furthest) segment drawn
  for (let n = DD - 1; n >= 0; n--) {
    if (EZ[n] <= 60) continue;
    const segi = base + n;
    if (segi >= N - 1 || segi > END_ROAD + 40) continue;
    const band = Math.floor(segi / 3) % 2;
    const fog = fogOf(n);
    const py1 = EY[n], py2 = EY[n + 1];
    const zn = zoneOf(segi);

    // a band at a time, painted when its furthest segment comes up, so that everything standing in the
    // band still lands on top of it; split where the zone changes
    if (segi % 3 === 2 || top) {
      let a = n - (segi % 3);
      while (a < n && EZ[a] <= 60) a++;
      for (let e = a; e <= n;) {
        const z = zoneOf(base + e);
        let b = e;
        while (b < n && zoneOf(base + b + 1) === z) b++;
        run(e, b, z, band);
        e = b + 1;
      }
    }
    top = false;

    if (zn === "tunnel") {
      if (segi % 6 === 0) ring(n, py1, [0.9, 0.9], [1, 1], mix(ROOT, FOG, fog));   // the vault's ribs
      if (segi % 2 === 0 && n < 90) {   // mortar between the blocks
        ctx.strokeStyle = mix(MORTAR, FOG, fog); ctx.lineWidth = Math.max(1, (CAM_DEPTH / Math.max(25, EZ[n])) * 16 * S);
        ctx.beginPath();
        UNIT.forEach(([ux, uy], k) => { proj(n, ux * RIB_R, py1 + uy * RIB_R); k ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY); });
        ctx.stroke();
      }
      if (segi === TUNNEL_END - 1) ring(n + 1, py2, [0.93, 0.93], [1, 1], mix([255, 150, 60], FOG, fog * 0.4));   // light at the way out
    }
    // the crypt's front: a mound with the arch in it, a skull above and a lantern either side
    if (segi === STREET_END) {
      ring(n, py1, [1, 1], [3.5, 2.7], mix([40, 32, 52], FOG, fog));
      ring(n, py1, [1, 1], [3.3, 2.5], mix([88, 80, 104], FOG, fog));
      const sc = CAM_DEPTH / Math.max(25, EZ[n]);
      sprite("skull", n, 0, py1 + RIB_R * 1.42, fog, { scale: sc * 3.2 });
      for (const sg of [-1, 1]) sprite("sconce", n, sg * RIB_R * 1.25, py1 + 900, fog, { scale: sc * 2 });
    }
    // string lights over the haunted street
    if (LIGHT_SEGS.has(segi)) {
      ctx.strokeStyle = mix(OUTLINE, FOG, fog); ctx.lineWidth = Math.max(1, (CAM_DEPTH / Math.max(25, EZ[n])) * 14 * S);
      ctx.beginPath();
      const bulbs = [];
      for (let k = 0; k <= 16; k++) {
        const u = (k / 16) * 2 - 1;
        proj(n, u * 1250, py1 + 1550 - 300 * (1 - u * u));
        k ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY);
        if (k % 2) bulbs.push([PX, PY, ["255,150,50", "150,255,100", "190,130,255"][(k >> 1) % 3]]);
      }
      ctx.stroke();
      const r = Math.max(1.5, PS * 50 * S);
      for (const [bx, by, col] of bulbs) {
        if (n < GLOW_N) glow(ctx, col, bx, by, r * 3, 0.6 * (1 - fog));
        ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    // posts along the bridge's edges, lamps along the moon road's
    if (overChasm(segi) && segi <= END_ROAD && segi % 2 === 0) {
      for (const sg of [-1, 1]) {
        proj(n, sg * (RW + 40), py1); const x0 = PX, y0 = PY, w = Math.max(1, PS * 60 * S);
        proj(n, sg * (RW + 40), py1 + 300);
        if (zn === "bridge") {
          ctx.fillStyle = mix([255, 240, 220], FOG, fog); ctx.fillRect(x0 - w / 2, PY, w, y0 - PY);
          ctx.fillStyle = mix([250, 148, 60], FOG, fog); ctx.fillRect(x0 - w / 2, (PY + y0) / 2, w, (y0 - PY) / 2);
        } else {
          proj(n, sg * (RW + 30), py1 + 40);
          const r = Math.max(1.5, PS * 45 * S);
          if (n < GLOW_N) glow(ctx, "255,150,60", PX, PY, r * 3.5, 0.5 * (1 - fog));
          ctx.fillStyle = "rgb(255,210,140)"; ctx.beginPath(); ctx.arc(PX, PY, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (zn === "bridge") {   // the rail between the posts
        ctx.strokeStyle = mix([250, 148, 60], FOG, fog); ctx.lineWidth = Math.max(1, PS * 40 * S); ctx.beginPath();
        for (const sg of [-1, 1]) { proj(n, sg * (RW + 40), py1 + 260); ctx.moveTo(PX, PY); proj(n + 1, sg * (RW + 40), py2 + 260); ctx.lineTo(PX, PY); }
        ctx.stroke();
      }
    }
    // boost pads: glowing chevrons on the road
    for (const pd of PADS) {
      if (segi < pd.seg || segi >= pd.seg + PAD_LEN) continue;
      const glowing = 0.5 + 0.5 * Math.sin(t * 10 - (segi - pd.seg));
      quad(n, pd.x - 200, pd.x + 200, py1 + 4, py2 + 4, mix([255, 130, 40], [255, 236, 170], glowing * 0.6 + fog * 0.3));
      ctx.fillStyle = mix([170, 255, 110], FOG, fog * 0.5);
      ctx.beginPath();
      proj(n, pd.x - 150, py1 + 6); ctx.moveTo(PX, PY); proj(n + 1, pd.x, py2 + 6); ctx.lineTo(PX, PY); proj(n, pd.x + 150, py1 + 6); ctx.lineTo(PX, PY);
      proj(n, pd.x + 90, py1 + 6); ctx.lineTo(PX, PY);
      projRaw(EZ[n] + SEG_LEN * 0.55, EX[n] + (EX[n + 1] - EX[n]) * 0.55, pd.x, py1 + (py2 - py1) * 0.55 + 6); ctx.lineTo(PX, PY);
      proj(n, pd.x - 90, py1 + 6); ctx.lineTo(PX, PY); ctx.closePath();
      ctx.fill();
    }

    // scenery
    const list = objs.get(segi);
    if (list) for (const o of list) {
      let Y = py1 + o.y, kind = o.kind;
      if (o.anchor === "float") Y += Math.sin(t * 1.6 + segi) * 70;
      else if (o.anchor === "pop") {
        const rise = smooth01((40 - (segi - pos)) / 14);
        if (rise < 0.05) continue;
        Y = py1 - 420 + (420 + o.y) * rise + Math.sin(t * 3 + segi) * 30 * rise;
      } else if (o.anchor === "hang") {
        Y = py1 + RIB_R * 1.3 - o.y - 300 + Math.sin(t * 2.2 + segi) * 80;
        ctx.strokeStyle = mix([60, 50, 80], FOG, fog); ctx.lineWidth = Math.max(1, (CAM_DEPTH / Math.max(25, EZ[n])) * 26 * S);
        ctx.beginPath(); proj(n, o.x, py1 + RIB_R * 1.33); ctx.moveTo(PX, PY); proj(n, o.x, Y + 300); ctx.lineTo(PX, PY); ctx.stroke();
      } else if (o.anchor === "abs") Y = o.y + Math.sin(t * 0.6 + segi) * 60;
      const f30 = Math.floor(t * 30);
      if (kind === "jack") kind = hash01(o.k, Math.floor(f30 / 3)) < 0.12 ? "jack_dim" : "jack";
      else if (kind === "ghost") kind = "ghost_" + ((Math.floor(f30 / 6) + o.k) % 4);
      else if (kind === "hand") kind = "hand_" + ((Math.floor(f30 / 9) + o.k) % 2);
      else if (kind === "cauldron") kind = "cauldron_" + ((Math.floor(f30 / 5) + o.k) % 3);
      else if (kind === "eyes") kind = (f30 + o.k * 13) % 75 < 5 ? "eyes_closed" : "eyes_open";
      else if (kind === "eyes_red") kind = (f30 + o.k * 11) % 64 < 6 ? "eyes_red_closed" : "eyes_red_open";
      else if (kind === "coffin") kind = segi - pos < 30 ? "coffin_open" : "coffin_closed";
      else if (kind === "skeleton") kind = "skeleton_" + ((Math.floor(f30 / 6) + o.k) % 2);
      else if (kind === "haunted_house" && lit) kind = "haunted_house_lightning";
      if (kind === "sign_miuu") { proj(n, o.x, Y); drawSprite(ctx, kind, PX, PY, PS, 1, { alpha: 1 - fog }); continue; }
      sprite(kind, n, o.x, Y, fog, { maxW: kind === "haunted_house" || kind === "haunted_house_lightning" ? W * 4 : undefined });
    }
    // the ghost that flies at the windshield, waiting in the road until you reach it
    if (segi === BOO_SEG && pos < BOO_SEG - 2.3) sprite("ghost_boo", n, 0, py1 + 420 + Math.sin(t * 9) * 40, fog * 0.5);

    // spiders hanging in the lane, each on its thread, glowing so they show from far away
    const obs = view.obstacles.get(segi);
    if (obs) for (const o of obs) {
      if (o.hit) continue;
      const Y = py1 + 380 + Math.sin(t * 7.5 + segi * 1.3) * 45;
      const sc = CAM_DEPTH / Math.max(25, EZ[n] * cp - (Y - camY) * sp), minS = Math.max(sc, 27 / (HW_WW.spider * S));
      const topY = py1 + (inTunnel(segi) ? RIB_R * 1.33 : 3200);
      ctx.strokeStyle = mix([236, 232, 246], FOG, fog); ctx.lineWidth = Math.max(1, sc * 12 * S);
      ctx.beginPath(); proj(n, o.x, topY); ctx.moveTo(PX, PY); proj(n, o.x, Y + 700); ctx.lineTo(PX, PY); ctx.stroke();
      proj(n, o.x, Y);
      const th = HW_WW.spider * minS * S * 0.89;
      glow(ctx, "170,255,120", PX, PY - th * 0.5, Math.max(13, th * 1.1), 0.6 * (1 - fog * 0.5));
      drawSprite(ctx, "spider", PX, PY, minS, 1, { alpha: 1 - fog * 0.15 });
    }
    // candy waiting on the road, spinning, each with a shadow and a glow
    const pk = view.pickups.get(segi);
    if (pk) pk.forEach((p, j) => {
      if (p.taken) return;
      const big = p.kind === "gift_pumpkin";
      const Y = py1 + (big ? 200 + Math.abs(Math.sin(t * 4.8)) * 160 : 150 + Math.sin(t * 6 + segi) * 22);
      proj(n, p.x, py1);
      const rs = PS * (big ? 150 : 90) * S;
      if (rs > 1) { ctx.fillStyle = mix([20, 12, 30], FOG, fog * 0.6); ctx.beginPath(); ctx.ellipse(PX, PY, rs, rs * 0.28, 0, 0, Math.PI * 2); ctx.fill(); }
      proj(n, p.x, Y);
      const sc = Math.max(PS, (big ? 27 : 20) / (HW_WW[p.kind] * S));
      const th = (HW_WW[p.kind] * sc * S * IMG[p.kind].naturalHeight) / IMG[p.kind].naturalWidth;
      glow(ctx, big ? "255,200,120" : "255,236,200", PX, PY - th * 0.5, Math.max(19, HW_WW[p.kind] * sc * S * 1.3), 0.9 * (1 - fog * 0.3));
      drawSprite(ctx, p.kind, PX, PY, sc, 0.25 + 0.75 * Math.abs(Math.cos(t * (big ? 3 : 6) + segi + j)), { alpha: 1 - fog * 0.15 });
    });

    // the thief (and anything else that lives at a fractional position)
    for (const ent of view.entities) {
      if (Math.floor(ent.pos) !== segi) continue;
      const f = ent.pos - segi;
      const ez = EZ[n] + (EZ[n + 1] - EZ[n]) * f;
      if (ez <= 60) continue;
      projRaw(ez, EX[n] + (EX[n + 1] - EX[n]) * f, ent.x, pathY(ent.pos) + ent.y);
      drawSprite(ctx, ent.kind, PX, PY, PS, 1, { alpha: 1 - Math.min(1, fog * 0.5) });
    }
  }
  ctx.restore();

  // ---- screen-space effects ----
  // the crypt's light flickers
  if (inTunnel(Math.floor(pos)) && hash01(Math.floor(t * 15), 9) < 0.14) { ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(0, 0, W, H); }
  // speed lines
  const inten = Math.min(1.3, 0.5 * view.speedNorm + 0.9 * view.boostE);
  if (inten > 0.05) {
    const cy = Math.min(650, Math.max(150, hz));
    ctx.strokeStyle = "rgba(250,245,255,0.8)"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = 0; k < 40 * inten; k++) {
      const a = Math.random() * Math.PI * 2, r0 = (380 + Math.random() * 320) / 2, r1 = r0 + ((140 + Math.random() * 240) * (0.7 + 0.5 * inten)) / 2;
      ctx.moveTo(cx0 + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx0 + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
    ctx.stroke();
  }
  ctx.drawImage(VIGNETTE, 0, 0);
  drawFx(ctx, fx, cx0, hz);
  drawFlyers(ctx, view.flyers || []);
  // a flash of light where you burst out of the crypt; the lightning over the haunted house
  let k = fx.exit * 30;
  if (k >= 0 && k < 10) { ctx.fillStyle = `rgba(200,255,170,${0.45 * (1 - k / 10)})`; ctx.fillRect(0, 0, W, H); }
  for (let j = 0; j < 3; j++) {
    k = Math.floor(fx["bolt" + j] * 30);
    if (!(k >= 0 && k < 7)) continue;
    if (k === 0 || k === 2) {
      const r = seeded(j * 31 + 5);
      let bx = W * (0.3 + r() * 0.4), by = 30;
      ctx.beginPath(); ctx.moveTo(bx, by);
      while (by < 320) { bx += (r() - 0.5) * 60; by += 20 + r() * 25; ctx.lineTo(bx, by); }
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgb(255,250,230)"; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.fillStyle = `rgba(235,230,255,${[0.55, 0.15, 0.45, 0.25, 0.12, 0.06, 0.02][k]})`; ctx.fillRect(0, 0, W, H);
  }
}

const smooth01 = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };

function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// ---------------- bats swooping past, the ghost at the windshield (fx values are seconds since each event) ----------------
function drawFx(ctx, fx, cx0, hz) {
  for (const key of ["swarm0", "swarm1"]) {
    const d = fx[key] * 30;
    if (!(d >= 0 && d < 40)) continue;
    const r = seeded(key === "swarm0" ? 3 : 11);
    for (let b = 0; b < 18; b++) {
      const a = r() * Math.PI * 2, sp = 0.6 + r() * 0.8, ox = (r() * 2 - 1) * 60, oy = (r() * 2 - 1) * 40;
      const dist = ((d * 9 + d * d * 0.9) * sp) / 2;
      const x = W / 2 + ox + Math.cos(a) * dist, y = 380 + oy + Math.sin(a) * dist * 0.8;
      const h = (9 * (1 + d * 0.16 * sp) ** 1.5) / 1;
      ctx.drawImage(IMG[(Math.floor(d / 2) + b) % 2 ? "bat_up" : "bat_down"], x - h * 0.85, y - h / 2, h * 1.7, h);
    }
  }
  const d = fx.boo * 30;
  if (d >= 0 && d < 12) {
    const img = IMG.ghost_boo, h0 = 220, aspect = img.naturalWidth / img.naturalHeight;
    for (const [gd, ga] of [[d - 2, 0.2], [d - 1, 0.4], [d, 1]]) {
      if (gd < 0) continue;
      const e = (gd / 8) ** 1.6, h = h0 * (1 + (1.6 * gd) / 8), w = h * aspect;
      ctx.save(); ctx.globalAlpha = ga;
      ctx.translate(cx0 + W * 0.9 * e, 380 - H * 0.8 * e); ctx.rotate(((20 * gd) / 8) * (Math.PI / 180));
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }
}

// ---------------- a spider you hit is blasted into the sky (flyers: {t, dur, kind, dx, spin}) ----------------
// It squashes against the glass with a burst of stars, then spins away up into the sky, shrinking to a
// twinkle (the sky's birds' flight), and leaves a web on the glass that fades in half a second.
export const FLY_TIME = 0.95;
function drawFlyers(ctx, flyers) {
  for (const fl of flyers) {
    const d = fl.t * 30;
    const c0x = W / 2 + fl.dx, c0y = 430, h0 = 230;
    const dir = Math.abs(fl.dx) < 45 ? (fl.spin > 0 ? 0.3 : -0.3) : Math.sign(fl.dx);   // dead centre: straight up
    if (d >= 1 && d < 16) {
      const a = Math.min(1, d / 2) * 0.75 * (1 - smooth01((d - 7) / 8));
      const sm = IMG.web_smear, w = sm.naturalWidth * 0.42, h = sm.naturalHeight * 0.42;
      ctx.save(); ctx.globalAlpha = a;
      ctx.drawImage(sm, Math.max(150, Math.min(W - 150, c0x)) - w / 2, Math.max(210, Math.min(600, c0y)) - h / 2, w, h);
      ctx.restore();
    }
    if (d < 5) {
      const star = IMG["spider_impact_" + Math.floor(d)], s = 330;
      ctx.drawImage(star, c0x - s / 2, c0y - s / 2, s, s);
    }
    if (fl.t < 0.07) {   // flat against the glass
      const img = IMG.spider_hit_squash, w = h0 * 1.6, h = (w * img.naturalHeight) / img.naturalWidth;
      ctx.drawImage(img, c0x - w / 2, c0y + h0 * 0.14 - h / 2, w, h);
      ctx.fillStyle = "rgba(230,255,220,0.3)"; ctx.fillRect(0, 0, W, H);
      continue;
    }
    const img = IMG.spider_hit, aspect = img.naturalWidth / img.naturalHeight;
    const pose = (time) => {
      const u = clamp01((time - 0.07) / (FLY_TIME - 0.07)), e = 1 - (1 - u) ** 2.4;
      // a tighter arc than the birds', kept inside the windshield so the twinkle shows
      return { u, x: Math.max(70, Math.min(W - 70, c0x + dir * (40 + 80 * e))), y: c0y - 270 * e - 50 * Math.sin(u * Math.PI), scale: 1.1 - 0.98 * e ** 1.2, rot: fl.spin * 24 * (time - 0.07) };
    };
    for (const [lag, alpha] of [[0.07, 0.18], [0.035, 0.4], [0, 1]]) {   // two ghosts trail behind
      if (fl.t - lag < 0.07) continue;
      const p = pose(fl.t - lag), h = h0 * p.scale, w = h * aspect;
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    const p = pose(fl.t);
    if (p.u > 0.8) {   // ...and a twinkle where it vanishes
      const s = 26 * Math.sin(((p.u - 0.8) / 0.2) * Math.PI);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.u * 3);
      ctx.fillStyle = "#fff"; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const rr = i % 2 ? s * 0.22 : s, a = (i * Math.PI) / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}

// ---------------- cockpit: the window frame, the dashboard, the candy bucket, the wheel with Miuu's paws ----------------
// Placed as in the reel (1080x1920 there, half here). The bucket fills as candy comes in.
export const BUCKET_FULL = 60;
export function drawHalloweenCockpit(ctx, deg, dy = 0) {
  if (dy > 2000) return;
  const k = Math.max(0, 1 - dy / 520);
  ctx.save(); ctx.globalAlpha = k; ctx.drawImage(IMG.cockpit_frame, 0, 0, W, H); ctx.restore();
  // the pumpkin charm swinging from the mirror
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(W / 2, 23); ctx.rotate(((deg * 0.35 + Math.sin(dash.t * 3.6) * 6) * Math.PI) / 180);
  ctx.drawImage(IMG.charm_pumpkin, -30, 0, 60, 150);
  ctx.restore();
  ctx.drawImage(IMG.cockpit_console, 0, 780 + dy, W, 190);
  // the speedometer's needle (its face is part of the console)
  const gx = 65, gy = 915 + dy, na = ((-220 + 200 * Math.min(1, dash.speed / 1.3 + dash.boost * 0.15) + Math.sin(dash.t * 21) * 4) * Math.PI) / 180;
  ctx.strokeStyle = "rgb(240,120,150)"; ctx.lineWidth = 4; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * 25, gy + Math.sin(na) * 25); ctx.stroke();
  ctx.fillStyle = "rgb(75,58,110)"; ctx.beginPath(); ctx.arc(gx, gy, 5, 0, Math.PI * 2); ctx.fill();
  const level = Math.min(5, Math.ceil((5 * dash.items) / BUCKET_FULL));
  ctx.drawImage(IMG["bucket_fill_" + level], 442, 832 + dy, 92, 92);
  ctx.save();
  ctx.translate(W / 2, 900 + dy); ctx.rotate((deg * 0.8 * Math.PI) / 180);
  ctx.drawImage(IMG.cockpit_wheel, -275, -275, 550, 550);
  ctx.restore();
}
