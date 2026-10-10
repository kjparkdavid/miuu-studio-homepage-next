// Ocean stage renderer — ported from render_scene() / frame() in source/sea.py.
// Logical canvas 540x960, same projection constants as the burrow.
import { W, H, S, VP, IMG, mix, hash01, drawSprite, registerSprites } from "./renderer.js";
import { CAM_DEPTH } from "./track.js";
import {
  N, SEG_LEN, CAM_H, DOCK_END, DIVE_END, REEF_END, KELP_END, WRECK_END, ABYSS_END, RISE_END, DOCK_W, WHALE_SEG,
  smooth, zoneOf, pathY, PATH_Y, FLOOR_Y, curves, water, objs, SCHOOLS, GIANTS, RIB_SEGS, PADS, PAD_LEN,
} from "./ocean-track.js";

const DD = 150;
const BIG = 40000;
const DARK = [34, 28, 60];
const SEA = [[126, 206, 228], [116, 196, 222]];
const SEA_FAR = [196, 230, 240];
const RIB_R = 1500;
const FRAMES_PER_SEG = 1 / 1.36;   // the reel moved ~1.36 segments per frame; used to time fly-bys by position

const F = (n) => "ocean/" + n;
export const OCEAN_FILES = {
  whale: F("whale_cute"), jelly_p: F("jellyfish_pink"), jelly_c: F("jellyfish_cyan"), angler: F("anglerfish_small"),
  coral_p: F("coral_branch_pink"), coral_l: F("coral_branch_lavender"), fan_o: F("coral_fan_orange"), fan_p: F("coral_fan_pink"),
  brain: F("brain_coral"), anem: F("anemone_pink"), anem2: F("anemone_orange"), rock: F("rock_seaweed"), star: F("starfish"),
  shell: F("shell"), weed: F("seaweed"), chest: F("treasure_chest"), barrel: F("barrel"), buoy: F("buoy"),
  fish0: F("fish_color0"), fish1: F("fish_color1"), fish2: F("fish_color2"), fish3: F("fish_color3"), fish4: F("fish_color4"),
  bigwhale: F("giant_whale_silhouette"), gangler: F("giant_anglerfish"), gangler_glow: F("giant_anglerfish_glow_layer"),
  // gameplay + cockpit
  // Ki's hand-drawn characters: the ones you bonk out of the way, as in the reel
  o_pickup: F("starfish"), ob_fish_p: F("ki_fish_pink"), ob_fish_b: F("ki_fish_blue"), ob_jelly: F("ki_jellyfish"),
  fish_diary: F("fish_back_with_diary"), fish_empty: F("fish_back_empty"),
  helm: F("helm"), porthole: F("porthole_frame"), console: F("console"), o_miuu: F("miuu_back"),
};
const OCEAN_WW = {
  whale: 3600, jelly_p: 520, jelly_c: 520, angler: 620, coral_p: 560, coral_l: 560, fan_o: 640, fan_p: 640, brain: 620,
  anem: 540, anem2: 540, rock: 760, star: 300, shell: 300, weed: 460, chest: 640, barrel: 360, buoy: 380,
  fish0: 430, fish1: 430, fish2: 430, fish3: 430, fish4: 430, bigwhale: 30000, gangler: 26000, gangler_glow: 26000,
  o_pickup: 210, ob_fish_p: 500, ob_fish_b: 500, ob_jelly: 520,
  fish_diary: 520, fish_empty: 520,
};
registerSprites(OCEAN_FILES, OCEAN_WW);
export const OCEAN_KEYS = Object.keys(OCEAN_FILES);
const EMISSIVE = new Set(["jelly_p", "jelly_c", "angler", "chest", "ob_jelly"]);

const UNIT = [[-1, 0], [-1, 0.35]];
for (let k = 1; k < 20; k++) { const a = Math.PI - (Math.PI * k) / 20; UNIT.push([Math.cos(a), 0.35 + Math.sin(a)]); }
UNIT.push([1, 0.35], [1, 0]);

const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

// Camera height for a position: rides CAM_H above the ribbon, bobbing gently while above water.
export function camYOf(pos, t) {
  let cy = pathY(pos) + CAM_H;
  if (cy > 0) cy += Math.sin(t * 5.1) * (pos < DIVE_END ? 9 : 26);
  return cy;
}

// ---------------- static layers ----------------
let SKY = null, VIGNETTE = null;
function makeSky() {
  const c = document.createElement("canvas");
  c.width = W * 2; c.height = H;
  const x = c.getContext("2d");
  const ox = W * 0.5;
  const g = x.createLinearGradient(0, 0, 0, VP);
  g.addColorStop(0, "rgb(140,176,238)"); g.addColorStop(0.6, "rgb(246,200,222)"); g.addColorStop(1, "rgb(255,230,214)");
  x.fillStyle = g; x.fillRect(0, 0, c.width, VP);
  x.fillStyle = "rgb(255,230,214)"; x.fillRect(0, VP, c.width, H - VP);
  const mx = (frac) => ox + W / 2 + (frac - 0.5) * 760;   // the reel's wider "margin" frame -> our coordinates
  const sx = mx(0.62), sy = VP - 110;
  x.fillStyle = "rgb(255,226,216)"; x.beginPath(); x.arc(sx, sy, 90, 0, Math.PI * 2); x.fill();
  x.fillStyle = "rgb(255,240,206)"; x.beginPath(); x.arc(sx, sy, 60, 0, Math.PI * 2); x.fill();
  let seed = 4;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  x.fillStyle = "rgb(255,248,252)";
  for (let k = -3; k < 10; k++) {
    const cx = mx(0.05 + k * 0.15 + r() * 0.05), cy = (0.08 + r() * 0.2) * VP, sc = (1.0 + r() * 0.8) * 0.5;
    for (const [dx, dy, rr] of [[-110, 10, 60], [-45, -25, 80], [35, -10, 70], [100, 15, 55], [0, 25, 70]]) {
      x.beginPath(); x.arc(cx + dx * sc, cy + dy * sc, rr * sc, 0, Math.PI * 2); x.fill();
    }
  }
  // far island + lighthouse
  const ix = mx(0.22);
  x.fillStyle = "rgb(176,186,226)";
  x.beginPath(); x.moveTo(ix - 130, VP + 2);
  for (let i = 0; i <= 30; i++) { const tt = i / 30; x.lineTo(ix + (tt - 0.5) * 260, VP - 35 * Math.sin(tt * Math.PI) ** 0.7); }
  x.lineTo(ix + 130, VP + 2); x.fill();
  const lx = ix + 20, ly = VP - 33;
  x.fillStyle = "rgb(255,250,250)";
  x.beginPath(); x.moveTo(lx - 8, ly); x.lineTo(lx + 8, ly); x.lineTo(lx + 5, ly - 55); x.lineTo(lx - 5, ly - 55); x.fill();
  x.fillStyle = "rgb(250,160,190)";
  for (let k = 0; k < 3; k++) { const y0 = ly - (10 + k * 17); x.fillRect(lx - 7 + k, y0 - 6, 14 - k * 2, 6); }
  x.fillStyle = "rgb(255,236,170)"; x.fillRect(lx - 6, ly - 66, 12, 11);
  x.fillStyle = "rgb(150,128,200)"; x.beginPath(); x.moveTo(lx - 8, ly - 66); x.lineTo(lx + 8, ly - 66); x.lineTo(lx, ly - 76); x.fill();
  return c;
}
function makeVignette() {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.translate(W / 2, H * 0.42);
  x.scale(1, (H * 0.62) / (W * 0.75));
  const g = x.createRadialGradient(0, 0, 0, 0, 0, W * 0.75);
  for (const [s, a] of [[0, 0], [0.5, 0.095], [0.7, 0.186], [0.85, 0.27], [1, 0.38]]) g.addColorStop(s, `rgba(16,18,50,${a})`);
  x.fillStyle = g; x.fillRect(-W * 2, -H * 2, W * 4, H * 4);
  return c;
}

// ---------------- frame ----------------
// view = { pos, camX, camY, pitch, yaw, jitter, rot, t, speedNorm, boostE, pickups, obstacles, entities, fx, flyers }
export function renderOcean(ctx, view) {
  if (!SKY) { SKY = makeSky(); VIGNETTE = makeVignette(); }
  const { pos, camX, camY, pitch, yaw, t } = view;
  const above = camY > 0, depth = -camY;
  const [fogc, topc, botc] = water(depth, pos);
  const FOG = above ? SEA_FAR : fogc;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const vp = VP + view.jitter;
  const hz = vp - CAM_DEPTH * S * Math.tan(pitch);
  const cx0 = W / 2 + yaw;
  const base = Math.floor(pos), pct = pos - base;
  const position = pos * SEG_LEN;

  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(view.rot); ctx.translate(-W / 2, -H / 2);

  // background
  if (above) {
    ctx.fillStyle = "rgb(140,176,238)"; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.drawImage(SKY, -W * 0.5, hz - VP);
    ctx.fillStyle = rgb(SEA_FAR); ctx.fillRect(-W, hz, W * 3, H * 3);
  } else {
    const y0 = hz - H * 0.85, y1 = hz + H * 0.7;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgb(topc)); g.addColorStop(0.548, rgb(fogc)); g.addColorStop(1, rgb(botc));
    ctx.fillStyle = g; ctx.fillRect(-W, -H * 2, W * 3, H * 5);
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
  const scaleAt = (n, Y) => CAM_DEPTH / Math.max(25, EZ[n] * cp - (Y - camY) * sp);
  const poly = (pts, fill) => {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fill();
  };
  // quad between edge n (height Y1) and n+1 (height Y2), from xa to xb
  const quad = (n, xa, xb, Y1, Y2, fill) => {
    const p = [];
    proj(n, xa, Y1); p.push(PX, PY); proj(n, xb, Y1); p.push(PX, PY);
    proj(n + 1, xb, Y2); p.push(PX, PY); proj(n + 1, xa, Y2); p.push(PX, PY);
    poly(p, fill);
  };
  const fogOf = (n) => 1 - Math.exp(-((n / DD) ** 2) * (above ? 1.4 : 3.0));
  const sprite = (kind, n, wx, Y, fog, opts = {}) => {
    proj(n, wx, Y);
    const f = EMISSIVE.has(kind) ? fog * 0.35 : fog;
    drawSprite(ctx, kind, PX, PY, PS, opts.squash ?? 1, { alpha: 1 - Math.min(1, f), flip: opts.flip, maxW: opts.maxW });
  };

  // ---- pass 1: the big planes (sea surface from above; surface + sea bed from below) ----
  const cvis = 1 - smooth((depth - 250) / 1500);
  for (let n = DD - 1; n >= 0; n--) {
    if (EZ[n] <= 60) continue;
    const segi = base + n;
    if (segi >= N - 1) continue;
    const band = Math.floor(segi / 3) % 2;
    const fog = fogOf(n);
    if (above) {
      quad(n, -BIG, BIG, 0, 0, mix(SEA[band], FOG, fog));
      if (band === 0) {
        ctx.fillStyle = mix([240, 252, 255], FOG, fog);
        const r = scaleAt(n, 0) * 90 * S;
        for (let k = 0; k < 3; k++) {
          proj(n, (hash01(segi, k) * 2 - 1) * 7000, 0);
          ctx.beginPath(); ctx.ellipse(PX, PY, r, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else {
      if (cvis > 0.02) quad(n, -BIG, BIG, 0, 0, mix(band ? [162, 220, 234] : [176, 230, 240], FOG, 1 - (1 - fog) * cvis * 0.9));
      const deep = smooth((segi - WRECK_END) / 60) * (1 - smooth((segi - ABYSS_END - 60) / 140));
      const sand = band ? [234, 218, 188] : [242, 228, 198], dark = band ? [64, 64, 112] : [70, 70, 120];
      const fcol = [sand[0] + (dark[0] - sand[0]) * deep, sand[1] + (dark[1] - sand[1]) * deep, sand[2] + (dark[2] - sand[2]) * deep];
      quad(n, -BIG, BIG, FLOOR_Y[segi], FLOOR_Y[segi + 1], mix(fcol, FOG, fog));
    }
  }

  // ---- pass 2: everything standing in the water, far to near ----
  for (let n = DD - 1; n >= 0; n--) {
    if (EZ[n] <= 60) continue;
    const segi = base + n;
    if (segi >= N - 1) continue;
    const zn = zoneOf(segi);
    const band = Math.floor(segi / 3) % 2;
    const fog = fogOf(n);
    const py1 = EY[n], py2 = EY[n + 1];

    // dock posts + boards
    if (above && segi <= DOCK_END && segi % 6 === 0) {
      for (const sg of [-1, 1]) {
        const xw = sg * (DOCK_W + 40), p = [];
        proj(n, xw - 40, 0); p.push(PX, PY); proj(n, xw + 40, 0); p.push(PX, PY);
        proj(n, xw + 40, 300); p.push(PX, PY); proj(n, xw - 40, 300); p.push(PX, PY);
        poly(p, mix([150, 104, 78], FOG, fog));
      }
    }
    if (above && segi < DOCK_END) {
      quad(n, -DOCK_W, DOCK_W, py1, py2, mix(segi % 2 ? [206, 156, 112] : [222, 172, 124], FOG, fog));
      ctx.strokeStyle = mix([150, 104, 78], FOG, fog);
      ctx.lineWidth = Math.max(1, scaleAt(n, py1) * 14 * S);
      ctx.beginPath(); proj(n, -DOCK_W, py1); ctx.moveTo(PX, PY); proj(n, DOCK_W, py1); ctx.lineTo(PX, PY); ctx.stroke();
      if (segi === DOCK_END - 1) {
        const p = [];
        proj(n + 1, -DOCK_W, py2); p.push(PX, PY); proj(n + 1, DOCK_W, py2); p.push(PX, PY);
        proj(n + 1, DOCK_W, py2 - 80); p.push(PX, PY); proj(n + 1, -DOCK_W, py2 - 80); p.push(PX, PY);
        poly(p, mix([150, 104, 78], FOG, fog));
      }
    } else if (!above && py1 < -10 && segi >= DIVE_END - 30) {
      // the glowing current you ride
      const gl = fog * 0.55;
      quad(n, -760, 760, py1, py2, mix(band ? [140, 236, 240] : [176, 252, 244], FOG, gl));
      quad(n, -620, 620, py1, py2, mix(band ? [110, 204, 224] : [120, 214, 230], FOG, gl));
      if (segi % 6 === 0) {
        const p = [];
        proj(n, -230, py1); p.push(PX, PY); proj(n + 1, 0, py2); p.push(PX, PY); proj(n, 230, py1); p.push(PX, PY);
        proj(n, 120, py1); p.push(PX, PY);
        projRaw(EZ[n] + (EZ[n + 1] - EZ[n]) * 0.45, EX[n] + (EX[n + 1] - EX[n]) * 0.45, 0, py1 + (py2 - py1) * 0.45); p.push(PX, PY);
        proj(n, -120, py1); p.push(PX, PY);
        poly(p, mix([236, 255, 252], FOG, gl));
      }
      // boost pads on the current
      for (const pd of PADS) {
        if (segi >= pd.seg && segi < pd.seg + PAD_LEN) {
          const glow = 0.5 + 0.5 * Math.sin(t * 10 - (segi - pd.seg));
          quad(n, pd.x - 200, pd.x + 200, py1 + 4, py2 + 4, mix([255, 120, 190], [255, 236, 248], glow * 0.6 + fog * 0.3));
          const p = [];
          proj(n, pd.x - 150, py1 + 6); p.push(PX, PY); proj(n + 1, pd.x, py2 + 6); p.push(PX, PY); proj(n, pd.x + 150, py1 + 6); p.push(PX, PY);
          proj(n, pd.x + 90, py1 + 6); p.push(PX, PY);
          projRaw(EZ[n] + SEG_LEN * 0.55, EX[n] + (EX[n + 1] - EX[n]) * 0.55, pd.x, py1 + (py2 - py1) * 0.55 + 6); p.push(PX, PY);
          proj(n, pd.x - 90, py1 + 6); p.push(PX, PY);
          poly(p, mix([255, 255, 255], FOG, fog * 0.5));
        }
      }
    }

    // canyon walls at the drop and the climb
    if (!above && ((segi >= WRECK_END + 1 && segi < WRECK_END + 110) || (segi >= ABYSS_END - 60 && segi < RISE_END - 6))) {
      const TOPW = -3020, fyA = FLOOR_Y[segi], fyB = FLOOR_Y[segi + 1];
      for (const sg of [-1, 1]) {
        const wx1 = sg * (2500 + 350 * Math.sin(segi * 0.37)), wx2 = sg * (2500 + 350 * Math.sin((segi + 1) * 0.37));
        const p = [];
        proj(n, wx1, fyA); p.push(PX, PY); proj(n, wx1, TOPW); p.push(PX, PY);
        proj(n + 1, wx2, TOPW); p.push(PX, PY); proj(n + 1, wx2, fyB); p.push(PX, PY);
        poly(p, mix(Math.floor(segi / 2) % 2 ? [56, 50, 100] : [64, 58, 112], FOG, fog));
        if (camY > TOPW + 50) {
          const q = [];
          proj(n, wx1, TOPW); q.push(PX, PY); proj(n, sg * BIG, TOPW); q.push(PX, PY);
          proj(n + 1, sg * BIG, TOPW); q.push(PX, PY); proj(n + 1, wx2, TOPW); q.push(PX, PY);
          poly(q, mix(band ? [78, 86, 132] : [84, 92, 140], FOG, fog));
        }
        for (let k = 0; k < 3; k++) {   // glowing specks on the rock
          if (hash01(segi, k + 90 + (sg > 0) * 5) < 0.5) continue;
          const Yd = fyA + (TOPW - fyA) * hash01(segi, k + 95 + (sg > 0) * 5);
          proj(n, wx1, Yd);
          const r = Math.min(8, Math.max(0.6, PS * 40 * S));
          ctx.fillStyle = k % 2 ? "rgb(150,250,250)" : "rgb(255,190,236)";
          ctx.beginPath(); ctx.arc(PX, PY, r, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // wreck hull planks + ribs
    if (!above && segi >= KELP_END + 30 && segi < WRECK_END - 10) {
      const fyA = FLOOR_Y[segi], fyB = FLOOR_Y[segi + 1];
      for (const k of [0, 1, 2, 3, 5, 15, 16, 17, 18, 20]) {
        if (hash01(Math.floor(segi / 7), k) < 0.22) continue;
        const [ux0, uy0] = UNIT[k], [ux1, uy1] = UNIT[k + 1], p = [];
        proj(n, ux0 * RIB_R, fyA + uy0 * RIB_R); p.push(PX, PY); proj(n, ux1 * RIB_R, fyA + uy1 * RIB_R); p.push(PX, PY);
        proj(n + 1, ux1 * RIB_R, fyB + uy1 * RIB_R); p.push(PX, PY); proj(n + 1, ux0 * RIB_R, fyB + uy0 * RIB_R); p.push(PX, PY);
        poly(p, mix((k + Math.floor(segi / 2)) % 2 ? [160, 108, 80] : [176, 120, 88], FOG, fog));
      }
      if (RIB_SEGS.has(segi)) {
        const brk = Math.floor(hash01(segi, 3) * 14) + 4, gap = hash01(segi, 5) < 0.6;
        const col = mix([124, 84, 64], FOG, fog);
        for (let k = 0; k < UNIT.length - 1; k++) {
          if (gap && k >= brk && k < brk + 4) continue;
          const p = [];
          proj(n, UNIT[k][0] * RIB_R, fyA + UNIT[k][1] * RIB_R); p.push(PX, PY);
          proj(n, UNIT[k + 1][0] * RIB_R, fyA + UNIT[k + 1][1] * RIB_R); p.push(PX, PY);
          proj(n, UNIT[k + 1][0] * RIB_R * 0.92, fyA + UNIT[k + 1][1] * RIB_R * 0.92); p.push(PX, PY);
          proj(n, UNIT[k][0] * RIB_R * 0.92, fyA + UNIT[k][1] * RIB_R * 0.92); p.push(PX, PY);
          poly(p, col);
        }
      }
    }

    // kelp
    if (!above && segi >= REEF_END - 10 && segi < KELP_END + 10 && segi % 2 === 0) {
      const fyk = FLOOR_Y[segi];
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        if (hash01(segi, k + 40) < 0.25) continue;
        const sd = hash01(segi, k + 41) < 0.5 ? -1 : 1;
        const xw = sd * (1150 + hash01(segi, k + 42) * 2600);
        const top = Math.min(-200, fyk + 2600 + hash01(segi, k + 43) * 1400);
        const ph = hash01(segi, k + 44) * 6.28;
        const pts = [];
        for (let j = 0; j < 12; j++) {
          const tt = j / 11;
          proj(n, xw + Math.sin(tt * 4.5 + t * 1.6 + ph) * 380 * tt, fyk + (top - fyk) * tt);
          pts.push(PX, PY);
        }
        const sc = scaleAt(n, fyk), wdt = Math.max(1, sc * 70 * S);
        const stroke = (w, col) => {
          ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
          for (let j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
          ctx.stroke();
        };
        stroke(wdt + Math.max(1, sc * 14 * S), mix([70, 140, 110], FOG, fog));
        stroke(wdt, mix(k % 2 ? [126, 204, 150] : [150, 214, 140], FOG, fog));
        const r = sc * 105 * S;
        if (r > 1.5) {
          ctx.fillStyle = mix([150, 220, 160], FOG, fog);
          for (let j = 1; j < 12; j++) {
            const off = r * 0.8 * (j % 2 ? 1 : -1);
            ctx.beginPath(); ctx.ellipse(pts[j * 2] + off, pts[j * 2 + 1], r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    // particles: marine snow / glowing plankton / rising bubbles
    if (!above) {
      const glowy = zn === "abyss" || (zn === "wreck" && segi > WRECK_END - 40);
      for (let k = 0; k < 3; k++) {
        const Y = py1 - 500 + hash01(segi, k + 61) * 2200;
        if (Y > -40) continue;
        proj(n, (hash01(segi, k + 60) * 2 - 1) * 2600, Y);
        if (glowy) {
          const r = Math.min(7, Math.max(0.6, PS * 26 * S));
          ctx.fillStyle = k % 2 ? "rgb(150,250,250)" : "rgb(255,190,236)";
          ctx.beginPath(); ctx.arc(PX, PY, r, 0, Math.PI * 2); ctx.fill();
        } else {
          const r = Math.min(5, Math.max(0.5, PS * 14 * S));
          ctx.fillStyle = mix([255, 255, 255], FOG, fog * 0.6);
          ctx.beginPath(); ctx.arc(PX, PY, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (hash01(segi, 70) < 0.5) {
        const Y = py1 - 600 + ((t * 260 + hash01(segi, 72) * 2600) % 2600);
        if (Y < -40) {
          proj(n, (hash01(segi, 71) * 2 - 1) * 2200, Y);
          const r = Math.max(0.75, PS * 40 * S);
          if (r < 60) {
            ctx.strokeStyle = mix([255, 255, 255], FOG, fog * 0.6); ctx.lineWidth = Math.max(0.5, r * 0.22);
            ctx.beginPath(); ctx.arc(PX, PY, r, 0, Math.PI * 2); ctx.stroke();
          }
        }
      }
    }

    // scenery sprites
    const list = objs.get(segi);
    if (list) for (const o of list) {
      const Y = o.anchor === "floor" ? FLOOR_Y[segi] : o.anchor === "path" ? py1 + o.y + Math.sin(t * 1.6 + segi) * 110 : o.y + (o.kind === "buoy" ? Math.sin(t * 2 + segi) * 20 : 0);
      if (above !== Y > -100) continue;
      sprite(o.kind, n, o.x, Y, fog);
    }
    // fish schools
    if (!above) for (let j = 0; j < SCHOOLS.length; j++) {
      const sc = SCHOOLS[j];
      if (sc.seg !== segi) continue;
      const xc = sc.x0 + sc.vx * 6 * Math.max(0, pos - (sc.seg - 45)) * FRAMES_PER_SEG;
      for (let m = 0; m < sc.n; m++) {
        const Y = py1 + sc.yrel + (hash01(j * 10 + m, 2) * 2 - 1) * 260 + Math.sin(t * 4 + m) * 30;
        if (Y > -60) continue;
        sprite("fish" + sc.ci, n, xc + (hash01(j * 10 + m, 1) * 2 - 1) * 600, Y, fog, { flip: sc.vx < 0 });
      }
    }

    // gameplay: obstacles to dodge, starfish to collect
    const obs = view.obstacles.get(segi);
    if (obs) for (const o of obs) {
      if (o.hit) continue;
      const Y = py1 + o.y + Math.sin(t * 7.5 + segi * 1.3) * 45;
      if (above !== Y > -100) continue;
      const pulse = o.kind === "ob_jelly" ? 1 + 0.07 * Math.sin(t * 13 + segi) : 1;
      sprite(o.kind, n, o.x, Y, fog * 0.6, { squash: pulse });
    }
    const pk = view.pickups.get(segi);
    if (pk) pk.forEach((p, j) => {
      if (p.taken) return;
      const Y = py1 + 150 + Math.sin(t * 4 + segi * 0.7) * 30;
      if (above !== Y > -100) return;
      sprite("o_pickup", n, p.x, Y, fog * 0.5, { squash: 0.3 + 0.7 * Math.abs(Math.cos(t * 3 + segi * 0.4 + j)) });
    });

    // the thief (and anything else that lives at a fractional position)
    for (const ent of view.entities) {
      if (Math.floor(ent.pos) !== segi) continue;
      const f = ent.pos - segi;
      const ez = EZ[n] + (EZ[n + 1] - EZ[n]) * f;
      if (ez <= 60) continue;
      const Y = pathY(ent.pos) + ent.y;
      if (above !== Y > -100) continue;
      projRaw(ez, EX[n] + (EX[n + 1] - EX[n]) * f, ent.x, Y);
      drawSprite(ctx, ent.kind, PX, PY, PS, 1, { alpha: 1 - Math.min(1, fog * 0.5) });
    }

    // giants drifting through the background
    for (const g of GIANTS) {
      if (n !== g.D || pos < g.p0 || pos >= g.p1) continue;
      const u = (pos - g.p0) / (g.p1 - g.p0);
      const us = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
      const Y = pathY(pos) + g.y + Math.sin(t * 0.9) * 380;
      const fade = Math.min(smooth(u / 0.12), smooth((1 - u) / 0.12));
      const fg = 1 - (1 - Math.max(fog, g.fog)) * fade;
      if (g.kind === "oar") { drawOarfish(g, us, Y, fg); continue; }
      projRaw(g.D * SEG_LEN, 0, g.x0 + (g.x1 - g.x0) * us, Y);
      const o = { alpha: 1 - fg, flip: g.flip, maxW: 2400 };
      drawSprite(ctx, g.kind, PX, PY, PS, 1, o);
      if (g.glow) drawSprite(ctx, g.glow, PX, PY, PS, 1, { alpha: 1 - fg * 0.12, flip: g.flip, maxW: 2400 });
    }
    // the friendly whale that swims across in the reef
    if (!above && segi === WHALE_SEG) {
      const xw = Math.max(0, pos - (WHALE_SEG - 4)) * FRAMES_PER_SEG * 95 - 300;
      sprite("whale", n, xw, py1 + 950 + Math.sin(t * 1.2) * 60, fog * 0.8, { maxW: 2000 });
    }
  }
  ctx.restore();

  // ---- screen-space effects ----
  // light shafts near the surface
  let sh = above ? 0 : Math.max(0, Math.min(1, 1 - depth / 1900)) * (1 - 0.75 * Math.max(0, Math.min(1, -pitch)));
  if (sh > 0.02) {
    ctx.fillStyle = `rgba(255,255,236,${0.1 * sh})`;
    for (let k = 0; k < 6; k++) {
      const xt = W * (0.05 + 0.18 * k) + Math.sin(t * 0.4 + k * 1.7) * 35 + yaw * 0.6;
      const wt = 25 + 20 * hash01(k, 1);
      ctx.beginPath(); ctx.moveTo(xt - wt, -20); ctx.lineTo(xt + wt, -20); ctx.lineTo(xt + wt * 3.4 + 160, H + 20); ctx.lineTo(xt - wt * 3.4 + 160, H + 20); ctx.fill();
    }
  }
  // the sub's headlight in the dark
  const hl = above ? 0 : Math.max(0, Math.min(1, (depth - 2300) / 700));
  if (hl > 0) {
    const g = ctx.createRadialGradient(W / 2, 410, 0, W / 2, 410, 300);
    g.addColorStop(0, `rgba(120,190,235,${0.4 * hl})`); g.addColorStop(1, "rgba(120,190,235,0)");
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // daylight flooding in as you climb out
  if (!above && pos > ABYSS_END - 9) {
    const k = Math.max(0, Math.min(1, (pos - (ABYSS_END - 9)) / (RISE_END - (ABYSS_END - 9))));
    const li = (0.4 + 0.5 * k) * (1 - 0.85 * smooth((k - 0.55) / 0.4));
    const z2u = -Math.sin(pitch), y2u = Math.cos(pitch);
    const cyu = Math.max(-100, Math.min(450, vp - (CAM_DEPTH / Math.max(0.2, z2u)) * y2u * S));
    const g = ctx.createRadialGradient(cx0, cyu, 0, cx0, cyu, 300 + 280 * k);
    g.addColorStop(0, `rgba(150,230,240,${0.75 * li})`); g.addColorStop(1, "rgba(150,230,240,0)");
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(235,255,255,${0.1 * li})`;
    for (let j = 0; j < 14; j++) {
      const a0 = (j * 2 * Math.PI) / 14 + t * 0.3, wa = 0.05 + 0.03 * hash01(j, 5);
      ctx.beginPath(); ctx.moveTo(cx0, cyu); ctx.lineTo(cx0 + Math.cos(a0 - wa) * 1100, cyu + Math.sin(a0 - wa) * 1100);
      ctx.lineTo(cx0 + Math.cos(a0 + wa) * 1100, cyu + Math.sin(a0 + wa) * 1100); ctx.fill();
    }
    ctx.restore();
  }
  // speed lines
  const inten = Math.min(1.3, 0.5 * view.speedNorm + 0.9 * view.boostE);
  if (inten > 0.05) {
    const cy = Math.min(650, Math.max(150, hz));
    ctx.strokeStyle = "rgba(250,255,255,0.8)"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = 0; k < 40 * inten; k++) {
      const a = Math.random() * Math.PI * 2, r0 = (380 + Math.random() * 320) / 2, r1 = r0 + ((140 + Math.random() * 240) * (0.7 + 0.5 * inten)) / 2;
      ctx.moveTo(cx0 + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx0 + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
    ctx.stroke();
  }
  drawFx(ctx, view.fx || {});
  ctx.drawImage(VIGNETTE, 0, 0);
  drawFlyers(ctx, view.flyers || []);

  function drawOarfish(g, u, Y, fog) {
    const L = 24000, headX = g.x0 + (g.x1 - g.x0) * u, z = g.D * SEG_LEN;
    const pts = [], ws = [];
    for (let k = 0; k < 40; k++) {
      const q = k / 39, yw = Y + Math.sin(q * 7 - t * 2.6) * 1700 * (0.35 + q);
      projRaw(z, 0, headX - q * L, yw);
      pts.push([PX, PY]); ws.push(PS * S * (2100 * (1 - q * 0.8)));
    }
    ctx.lineCap = "round";
    const body = mix([176, 182, 226], FOG, fog), line = mix(DARK, FOG, fog * 0.6), fin = mix([250, 140, 180], FOG, fog);
    for (const [col, extra] of [[line, 0.25], [body, 0]]) {
      ctx.strokeStyle = col;
      for (let k = 0; k < 39; k++) {
        const w = Math.max(1, ws[k]);
        ctx.lineWidth = w + (extra ? Math.max(1, w * extra) : 0);
        ctx.beginPath(); ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k + 1][0], pts[k + 1][1]); ctx.stroke();
      }
    }
    ctx.strokeStyle = fin;
    for (let k = 1; k < 39; k++) {
      const [x_, y_] = pts[k], cr = ws[k] * 0.5;
      ctx.lineWidth = Math.max(0.5, ws[k] * 0.3);
      ctx.beginPath(); ctx.moveTo(x_, y_ - ws[k] * 0.45); ctx.lineTo(x_ + (pts[k - 1][0] - x_) * 0.2, y_ - ws[k] * 0.45 - cr * 0.9); ctx.stroke();
    }
    ctx.fillStyle = mix([150, 250, 250], FOG, fog * 0.4);
    for (let k = 2; k < 39; k += 3) { ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1], Math.max(1, ws[k] * 0.16), 0, Math.PI * 2); ctx.fill(); }
    const [hx, hy] = pts[0], hr = ws[0] * 0.65;
    ctx.fillStyle = body; ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.5, hr * 0.12);
    ctx.beginPath(); ctx.ellipse(hx + hr * 0.05, hy, hr * 1.05, hr * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgb(220,250,255)"; ctx.beginPath(); ctx.arc(hx + hr * 0.35, hy - hr * 0.25, hr * 0.22, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------------- splashes and bubble bursts (fx values are seconds since each event) ----------------
function bubbles(ctx, seed, count, place, alpha) {
  let s = seed * 9301 + 49297;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    const b = place(r);
    if (!b) continue;
    ctx.fillStyle = `rgba(255,255,255,${0.2 * alpha})`; ctx.strokeStyle = `rgba(255,255,255,${0.8 * alpha})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.33, b.y - b.r * 0.42, b.r * 0.18, b.r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function drawFx(ctx, fx) {
  for (const [key, dirn, seed] of [["plunge", -1, 7], ["up", 1, 8]]) {
    const k = fx[key] * 30;
    if (k >= 0 && k < 26) {
      const a = Math.sin((Math.PI * k) / 26);
      bubbles(ctx, seed, 70, (r) => ({ x: r() * W, y: r() * H * 1.6 - H * 0.3 + dirn * k * (20 + r() * 35), r: 3 + r() * 15 }), a);
    }
  }
  let k = fx.splashIn * 30;
  if (k >= 0 && k < 32) {
    const a = 1 - k / 32;
    if (k < 12) {
      ctx.fillStyle = `rgba(255,255,255,${0.67 * (1 - k / 12)})`;
      let s = 1 * 9301 + 49297; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let i = 0; i < 16; i++) {
        const x = r() * W, y = H * (0.35 + r() * 0.8) - k * 15, rr = (35 + r() * 80) * (1 + k * 0.08);
        ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
      }
    }
    bubbles(ctx, 2, 110, (r) => { const x = r() * W, y0 = H * (0.4 + r() * 0.9), rr = 3 + r() * 17, vy = 15 + r() * 25; return { x, y: y0 - k * vy * (1 + k * 0.03), r: rr }; }, a);
  }
  k = fx.splashOut * 30;
  if (k >= 0 && k < 75) {
    if (k < 14) {
      ctx.fillStyle = `rgba(255,255,255,${0.63 * (1 - k / 14)})`;
      let s = 3 * 9301 + 49297; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let i = 0; i < 14; i++) {
        const ang = r() * Math.PI * 2, dist = (0.3 + r() * 0.7) * 350 * (1 + k * 0.12), rr = 30 + r() * 80;
        ctx.beginPath(); ctx.arc(W / 2 + Math.cos(ang) * dist, H * 0.45 + Math.sin(ang) * dist * 0.9, rr, 0, Math.PI * 2); ctx.fill();
      }
    }
    const a = 1 - k / 75;   // drops running down the glass
    let s = 4 * 9301 + 49297; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 30; i++) {
      const x = r() * W, y0 = r() * H * 0.85, rr = 7 + r() * 17, y = y0 + k * (0.75 + rr * 0.08) * (1 + k * 0.02);
      ctx.strokeStyle = `rgba(255,255,255,${0.27 * a})`; ctx.lineWidth = Math.max(1, rr * 0.5);
      ctx.beginPath(); ctx.moveTo(x, y - rr * 3); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.3 * a})`; ctx.beginPath(); ctx.ellipse(x, y, rr * 0.7, rr * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ---------------- things you bonk fly off the glass (flyers: {t, kind, side}) ----------------
function drawFlyers(ctx, flyers) {
  for (const fl of flyers) {
    const d = fl.t * 30, tt = d / 13, side = fl.side;
    const img = IMG[fl.kind];
    if (!img) continue;
    const c0x = W / 2 + side * 40, c0y = 470, h0 = 170;
    if (d < 7) {   // impact star
      const a = 1 - Math.max(0, d - 2) / 5, R = 75 + 37 * Math.min(d, 3), px = c0x - side * 20, py = c0y + 8;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 7; ctx.lineCap = "butt";
      for (let j = 0; j < 12; j++) {
        const aa = (j * 2 * Math.PI) / 12 + 0.4, r0 = R * 1.15, r1 = R * (1.7 + 0.25 * (j % 2));
        ctx.beginPath(); ctx.moveTo(px + Math.cos(aa) * r0, py + Math.sin(aa) * r0); ctx.lineTo(px + Math.cos(aa) * r1, py + Math.sin(aa) * r1); ctx.stroke();
      }
      if (d < 5) for (const [R_, r_, col] of [[R + 5, R * 0.55 + 3, "rgb(75,58,110)"], [R, R * 0.55, "rgb(255,226,120)"], [R * 0.6, R * 0.33, "rgb(255,252,230)"]]) {
        ctx.fillStyle = col; ctx.beginPath();
        for (let i = 0; i < 24; i++) { const aa = 0.4 + (i * Math.PI) / 12, rr = i % 2 ? r_ : R_; ctx.lineTo(px + Math.cos(aa) * rr, py + Math.sin(aa) * rr); }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    const m = Math.min(tt, 1.2);
    const cx = c0x + side * W * 0.95 * (1 - (1 - m) ** 2);
    const cy = c0y - 190 * Math.sin(Math.min(tt, 1) * Math.PI * 0.85) + 130 * tt;
    const h = h0 * (1 + 0.9 * tt), w = (h * img.naturalWidth) / img.naturalHeight;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((side * 40 * d * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

// ---------------- cockpit: porthole frame, console, ship's helm, Miuu ----------------
export function drawOceanCockpit(ctx, deg, dy = 0, head = true) {
  if (dy > 2000) return;                       // hidden while the intro clip plays
  const k = Math.max(0, 1 - dy / 520);
  ctx.save(); ctx.globalAlpha = k; ctx.drawImage(IMG.porthole, 0, 0, W, H); ctx.restore();
  ctx.drawImage(IMG.console, 0, 780 + dy, W, 190);
  ctx.save();
  ctx.translate(W / 2, 952.5 + dy); ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(IMG.helm, -300, -300, 600, 600);
  ctx.restore();
  if (head) ctx.drawImage(IMG.o_miuu, 156.84, 824.89, 229.3, 135);
}
