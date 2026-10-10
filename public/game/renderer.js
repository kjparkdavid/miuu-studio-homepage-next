// Pseudo-3D (OutRun-style) renderer, ported from render_scene() in burrow6.py.
// Logical canvas is 540x960 (half the reel's 1080x1920).
import {
  N, SEG_LEN, ROAD_W, CAM_H, CAM_DEPTH, BAND, LIP, ENTRANCE, Z, SEGC, edgeR, curves, floorY,
  inside, mod, sprites, FIREFLIES, PADS, PAD_LEN,
} from "./track.js";

export const W = 540, H = 960;
export const S = 380;          // horizontal projection scale
export const VP = 373;         // vanishing point y
export const DRAW_DIST = 150;
const OUTLINE = "rgb(75,58,110)";

export const WW = {
  sq_diary: 620, sq_empty: 620, big_acorn: 330, diary: 300, tree_p: 1100, tree_g: 1100, tree_o: 1100, flowers: 460,
  door: 540, mush: 380, acorn: 300, pile: 1150, squirrel: 420, glow_c: 700, glow_p: 700, crystal: 520,
  lantern_p: 200, lantern_o: 200, chev_l: 520, chev_r: 520,
  sign_burrow: 987, sign_store: 911, sign_grotto: 868, sign_village: 944, sign_warp: 893, sign_miuu: 992,
  pickup: 170, mush_ob: 360, crystal_ob: 400,
};
export const FILES = {
  sq_diary: "squirrel_back_with_diary", diary: "diary", sq_empty: "squirrel_back_empty", big_acorn: "acorn_big",
  tree_p: "tree_pink", tree_g: "tree_green", tree_o: "tree_orange", flowers: "flowers", door: "burrow_door",
  mush: "mushrooms", acorn: "acorns_small", pile: "acorn_pile", squirrel: "squirrel_waving",
  glow_c: "glow_mushroom_cyan", glow_p: "glow_mushroom_pink", crystal: "crystals",
  lantern_p: "lantern_pink", lantern_o: "lantern_orange", chev_l: "turn_sign_left", chev_r: "turn_sign_right",
  sign_burrow: "sign_squirrel_burrow", sign_store: "sign_acorn_storage", sign_grotto: "sign_glow_grotto",
  sign_village: "sign_squirrel_village", sign_warp: "sign_warp_tunnel", sign_miuu: "sign_miuu_note",
  pickup: "acorn_big", mush_ob: "mushrooms", crystal_ob: "crystals", wheel: "steering_wheel", miuu: "miuu_back",
};

export const mix = (a, b, t) =>
  `rgb(${(a[0] + (b[0] - a[0]) * t) | 0},${(a[1] + (b[1] - a[1]) * t) | 0},${(a[2] + (b[2] - a[2]) * t) | 0})`;
export const hash01 = (i, k = 0) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

const ARC_STEPS = 18;
const UNIT = [[-1, 0], [-1, 0.35]];
for (let k = 1; k < ARC_STEPS; k++) {
  const a = Math.PI - (Math.PI * k) / ARC_STEPS;
  UNIT.push([Math.cos(a), 0.35 + Math.sin(a)]);
}
UNIT.push([1, 0.35], [1, 0]);
const ceilY = (R, x) => (Math.abs(x) >= R ? 0.35 * R : 0.35 * R + Math.sqrt(R * R - x * x));

// ---------------- images + mipmaps ----------------
export const IMG = {};
const MIPS = {};
const loaded = {};   // file name -> HTMLImageElement
export const BURROW_KEYS = Object.keys(FILES);

// Other stages add their own sprite kinds (key -> file under img/, key -> world width).
export function registerSprites(files, ww) {
  Object.assign(FILES, files);
  Object.assign(WW, ww);
}

// Loads the images behind the given sprite kinds (each file once).
export async function loadImages(base = "img/", keys = BURROW_KEYS) {
  const names = [...new Set(keys.map((k) => FILES[k]))].filter((n) => !loaded[n]);
  await Promise.all(names.map((n) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { loaded[n] = im; res(); };
    im.onerror = () => rej(new Error("missing image " + n));
    im.src = base + n + ".png";
  })));
  for (const k of keys) {
    const n = FILES[k];
    IMG[k] = loaded[n];
    if (!MIPS[n]) MIPS[n] = buildMips(loaded[n]);
    MIPS[k] = MIPS[n];
  }
}
function buildMips(img) {
  const out = [img];
  let w = img.naturalWidth, h = img.naturalHeight, src = img;
  while (h > 24) {
    w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.imageSmoothingQuality = "high";
    x.drawImage(src, 0, 0, w, h);
    out.push(c); src = c;
  }
  return out;
}
function pickMip(kind, th) {
  const levels = MIPS[kind];
  let src = levels[0];
  for (const lvl of levels) if (lvl.height >= th) src = lvl;
  return src;
}

// ---------------- static layers ----------------
let SKY = null, VIGNETTE = null;
function makeSky() {
  const c = document.createElement("canvas");
  c.width = W * 2; c.height = H * 1.5;
  const x = c.getContext("2d");
  const oy = H * 0.25, ox = W * 0.5;
  const g = x.createLinearGradient(0, oy, 0, oy + H * 0.55);
  g.addColorStop(0, "rgb(140,170,236)");
  g.addColorStop(0.6, "rgb(250,196,214)");
  g.addColorStop(1, "rgb(255,226,206)");
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "rgb(140,170,236)"; x.fillRect(0, 0, c.width, oy);
  const r = mulberry(3);
  x.fillStyle = "rgb(244,228,238)";
  for (let k = -2; k < 9; k++) {
    const cx = ox + (0.1 + k * 0.17 + r() * 0.05) * W;
    const cy = oy + (0.06 + r() * 0.25) * H;
    const sc = (1.2 + r()) * 0.5;
    for (const [dx, dy, rr] of [[-110, 10, 60], [-45, -25, 80], [35, -10, 70], [100, 15, 55], [0, 25, 70]]) {
      x.beginPath(); x.arc(cx + dx * sc, cy + dy * sc, rr * sc, 0, Math.PI * 2); x.fill();
    }
  }
  return c;
}
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function makeVignette() {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.translate(W / 2, H * 0.42);
  x.scale(1, (H * 0.62) / (W * 0.75));
  const g = x.createRadialGradient(0, 0, 0, 0, 0, W * 0.75);
  for (const [s, a] of [[0, 0], [0.5, 0.0875], [0.7, 0.17], [0.85, 0.25], [1, 0.35]]) g.addColorStop(s, `rgba(40,20,60,${a})`);
  x.fillStyle = g;
  x.fillRect(-W * 2, -H * 2, W * 4, H * 4);
  return c;
}

// ---------------- frame ----------------
// view = { pos, camX, pitch, yaw, jitter, rot, t, speedNorm, boostE, squirrel, pickups, obstacles }
export function render(ctx, view) {
  if (!SKY) { SKY = makeSky(); VIGNETTE = makeVignette(); }
  const { pos, camX, pitch, yaw, t } = view;
  const vp = VP + view.jitter;
  const base = Math.floor(pos), pct = pos - base;
  const camY = floorY(base) * (1 - pct) + floorY(base + 1) * pct + CAM_H;
  const position = pos * SEG_LEN;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cx0 = W / 2 + yaw;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(view.rot);
  ctx.translate(-W / 2, -H / 2);

  // background
  if (!inside(base)) ctx.drawImage(SKY, -W * 0.5, -H * 0.25);
  else { ctx.fillStyle = mix(SEGC[mod(base)].wall[0], SEGC[mod(base)].wall[0], 0); ctx.fillRect(-W, -H, W * 3, H * 3); }
  if (pitch > 0.08) {
    const hz = vp - CAM_DEPTH * S * Math.tan(pitch);
    ctx.fillStyle = mix(SEGC[mod(base)].road[0], SEGC[mod(base)].road[0], 0);
    const y0 = Math.max(0, hz + (H - hz) * 0.45);
    ctx.fillRect(-W, y0, W * 3, H * 2);
  }

  // segment edges
  const DD = DRAW_DIST;
  const EZ = new Float32Array(DD + 1), EX = new Float32Array(DD + 1), EF = new Float32Array(DD + 1);
  let x = 0, dx = -(curves[mod(base)] * pct);
  for (let n = 0; n <= DD; n++) {
    const segi = base + n;
    EZ[n] = segi * SEG_LEN - position; EX[n] = x; EF[n] = floorY(segi);
    x += dx; dx += curves[mod(segi)];
  }
  // projection of world point (wx, wy) on edge n (or interpolated edge object)
  let PX = 0, PY = 0;
  const projRaw = (z, ex, fy, wx, wy) => {
    const dy = fy + wy - camY;
    const z2 = Math.max(25, z * cp - dy * sp);
    const y2 = dy * cp + z * sp;
    const sc = CAM_DEPTH / z2;
    PX = cx0 + sc * (ex + wx - camX) * S;
    PY = vp - sc * y2 * S;
  };
  const proj = (n, wx, wy) => projRaw(EZ[n], EX[n], EF[n], wx, wy);

  const poly = (pts, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fill("evenodd");
  };
  const quad = (n1, n2, xa, xb, wy1, wy2, fill) => {
    const p = [];
    proj(n1, xa, wy1); p.push(PX, PY);
    proj(n1, xb, wy1); p.push(PX, PY);
    proj(n2, xb, wy2); p.push(PX, PY);
    proj(n2, xa, wy2); p.push(PX, PY);
    poly(p, fill);
  };
  const archPts = (n, R, scale = 1, out = []) => {
    for (const [ux, uy] of UNIT) { proj(n, ux * R * scale, uy * R * scale); out.push(PX, PY); }
    return out;
  };
  const ring = (n, R, sOut, sIn, fill) => {
    const o = archPts(n, R, sOut);
    const inner = archPts(n, R, sIn);
    for (let i = inner.length - 2; i >= 0; i -= 2) o.push(inner[i], inner[i + 1]);
    poly(o, fill);
  };

  // far fill
  const farI = base + DD;
  if (inside(farI)) poly(archPts(DD, edgeR(farI)), mix(SEGC[mod(farI)].glow, SEGC[mod(farI)].glow, 0));
  else { proj(DD, 0, 0); ctx.fillStyle = mix(Z.out.glow, Z.out.glow, 0); ctx.fillRect(-W, PY, W * 3, H * 3); }

  let prevBulbs = null;
  for (let n = DD - 1; n >= 0; n--) {
    if (EZ[n] <= 60) continue;
    const segi = base + n, idx = mod(segi);
    const c = SEGC[idx], zone = c.zone, ins = inside(idx);
    const band = Math.floor(segi / BAND) % 2;
    const dens = ins ? 3.2 : 1.6;
    const fog = 1 - Math.exp(-((n / DD) ** 2) * dens);
    const G = c.glow;
    const sc1 = CAM_DEPTH / EZ[n];

    if (ins) {
      const R1 = edgeR(segi), R2 = edgeR(segi + 1);
      const near = archPts(n, R1), far = archPts(n + 1, R2);
      const wall = near.slice();
      for (let i = far.length - 2; i >= 0; i -= 2) wall.push(far[i], far[i + 1]);
      poly(wall, mix(c.wall[band], G, fog));
      const L = near.length;
      poly([near[0], near[1], near[L - 2], near[L - 1], far[L - 2], far[L - 1], far[0], far[1]], mix(c.floor[band], G, fog));
    } else if (idx >= LIP && idx < ENTRANCE) {
      const RC = Z.roots, TW = 1400;
      if (camY > 0) for (const sg of [-1, 1]) quadY(n, sg * 60000, sg * TW, -EF[n], -EF[n + 1], mix(c.floor[band], G, fog));
      for (const sg of [-1, 1]) {
        const p = [];
        proj(n, sg * TW, 0); p.push(PX, PY); proj(n, sg * TW, -EF[n]); p.push(PX, PY);
        proj(n + 1, sg * TW, -EF[n + 1]); p.push(PX, PY); proj(n + 1, sg * TW, 0); p.push(PX, PY);
        poly(p, mix(RC.wall[band], G, fog));
        const q = [];
        proj(n, sg * TW, -EF[n] - 1); q.push(PX, PY); proj(n, sg * TW, -EF[n] + 90); q.push(PX, PY);
        proj(n + 1, sg * TW, -EF[n + 1] + 90); q.push(PX, PY); proj(n + 1, sg * TW, -EF[n + 1] - 1); q.push(PX, PY);
        poly(q, mix([128, 188, 124], G, fog));
      }
      quad(n, n + 1, -TW, TW, 0, 0, mix(RC.floor[band], G, fog));
    } else {
      proj(n, 0, 0); const y1 = PY; proj(n + 1, 0, 0); const y2 = PY;
      if (y2 < y1) { ctx.fillStyle = mix(c.floor[band], G, fog); ctx.fillRect(-W, y2, W * 3, y1 - y2 + 0.5); }
    }
    const rw = ROAD_W * 1.14;
    quad(n, n + 1, -rw, rw, 0, 0, mix(c.rumble[band], G, fog));
    quad(n, n + 1, -ROAD_W, ROAD_W, 0, 0, mix(c.road[band], G, fog));
    if (band === 0) quad(n, n + 1, -26, 26, 0, 0, mix(c.lane, G, fog));

    // boost pads (on the road surface)
    for (const pd of PADS) {
      if (idx >= pd.seg && idx < pd.seg + PAD_LEN) {
        const k = idx - pd.seg;
        const glow = 0.5 + 0.5 * Math.sin(t * 10 - k);
        quad(n, n + 1, pd.x - 200, pd.x + 200, 2, 2, mix([255, 120, 190], [255, 236, 248], glow * 0.6 + fog * 0.3));
        const p = [];
        proj(n, pd.x - 150, 3); p.push(PX, PY);
        proj(n + 1, pd.x, 3); p.push(PX, PY);
        proj(n, pd.x + 150, 3); p.push(PX, PY);
        proj(n, pd.x + 90, 3); p.push(PX, PY);
        projRaw(EZ[n] + SEG_LEN * 0.55, EX[n] + (EX[n + 1] - EX[n]) * 0.55, EF[n], pd.x, 3); p.push(PX, PY);
        proj(n, pd.x - 90, 3); p.push(PX, PY);
        poly(p, mix([255, 255, 255], G, fog * 0.5));
      }
    }

    const R = edgeR(segi);
    // ---- zone decorations ----
    if (ins && zone === "roots" && idx % 2 === 0) {
      ctx.strokeStyle = mix([78, 50, 38], G, fog);
      ctx.lineWidth = Math.max(1, sc1 * 26 * S);
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        if (hash01(idx, k) < 0.45) continue;
        const xw = (hash01(idx, k + 7) * 2 - 1) * R * 0.8;
        const top = ceilY(R, xw);
        const Ln = 250 + hash01(idx, k + 3) * 650;
        ctx.beginPath();
        for (let j = 0; j < 9; j++) {
          const tt = j / 8;
          proj(n, xw + Math.sin(tt * 5 + idx) * 40, top - Ln * tt);
          j ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY);
        }
        ctx.stroke();
      }
    }
    if ((ins && (zone === "roots" || zone === "village") && idx % 15 === 0) || (ins && zone === "store" && idx % 20 === 0)) {
      const thick = zone !== "store" ? 0.9 : 0.92;
      ring(n, R, 1, thick, mix([92, 58, 40], G, fog * 0.8));
      ring(n, R, 0.99, thick * 1.012, mix(zone !== "village" ? [186, 124, 78] : [206, 140, 110], G, fog * 0.8));
    }
    if (ins && zone === "warp" && idx % 8 === 0) {
      const colO = Math.floor(idx / 8) % 2 ? [255, 140, 210] : [130, 220, 255];
      ring(n, R, 0.985, 0.9, mix(colO, G, fog * 0.6));
      ring(n, R, 0.955, 0.93, mix([255, 248, 255], G, fog * 0.4));
    }
    if (ins && (zone === "store" || zone === "village") && idx % 8 === 4) {
      const xa = R * 0.75, yb = ceilY(R, xa) - 60, sag = 260, nfl = 11;
      const cols = [[255, 160, 190], [255, 226, 140], [170, 220, 255], [200, 180, 255], [170, 230, 190]];
      const pts = [];
      for (let j = 0; j <= nfl; j++) { const tt = j / nfl; pts.push([-xa + 2 * xa * tt, yb - sag * (1 - (2 * tt - 1) ** 2)]); }
      ctx.strokeStyle = mix([90, 60, 50], G, fog);
      ctx.lineWidth = Math.max(1, sc1 * 10 * S);
      ctx.beginPath();
      pts.forEach(([a, b], j) => { proj(n, a, b); j ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY); });
      ctx.stroke();
      for (let j = 0; j < nfl; j++) {
        const [xa0, ya0] = pts[j], [xb0, yb0] = pts[j + 1];
        const p = [];
        proj(n, xa0 + 20, ya0); p.push(PX, PY);
        proj(n, xb0 - 20, yb0); p.push(PX, PY);
        proj(n, (xa0 + xb0) / 2, (ya0 + yb0) / 2 - 200); p.push(PX, PY);
        poly(p, mix(cols[(j + idx) % 5], G, fog));
      }
    }
    if (ins && (zone === "roots" || zone === "store") && idx % 3 === 0) {
      const bulbs = [];
      for (const phi of [(58 * Math.PI) / 180, (122 * Math.PI) / 180]) {
        proj(n, (R - 40) * Math.cos(phi), 0.35 * R + (R - 40) * Math.sin(phi));
        bulbs.push([PX, PY]);
      }
      if (prevBulbs) {
        ctx.strokeStyle = mix([70, 46, 36], G, fog);
        ctx.lineWidth = Math.max(1, sc1 * 8 * S);
        for (let k = 0; k < 2; k++) {
          if (Math.abs(prevBulbs[k][0] - bulbs[k][0]) < W * 1.4) {
            ctx.beginPath(); ctx.moveTo(prevBulbs[k][0], prevBulbs[k][1]); ctx.lineTo(bulbs[k][0], bulbs[k][1]); ctx.stroke();
          }
        }
      }
      const r = Math.max(0.5, sc1 * 30 * S);
      ctx.fillStyle = mix(Math.floor(idx / 3) % 2 ? [255, 244, 248] : [255, 250, 215], G, fog * 0.5);
      for (const [bx, by] of bulbs) { ctx.beginPath(); ctx.ellipse(bx, by + r * 0.7, r, r, 0, 0, Math.PI * 2); ctx.fill(); }
      prevBulbs = bulbs;
    } else if (!(ins && (zone === "roots" || zone === "store"))) prevBulbs = null;

    if (ins && zone === "village" && idx % 15 === 0) {
      for (const [xw, kind] of [[-R * 0.45, "lantern_p"], [R * 0.45, "lantern_o"]]) {
        const top = ceilY(R * 0.9, xw);
        const hh = (WW[kind] * IMG[kind].naturalHeight) / IMG[kind].naturalWidth;
        proj(n, xw, top - hh);
        drawSprite(ctx, kind, PX, PY, sc1);
      }
    }
    const ff = FIREFLIES.get(idx);
    if (ff) {
      const r = Math.min(8, Math.max(0.6, sc1 * 22 * S));
      for (const f of ff) {
        proj(n, f.x + Math.sin(t * 1.3 + f.ph) * 120, f.y + Math.sin(t * 1.9 + f.ph * 2) * 90);
        ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(PX, PY, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    const sp_ = sprites.get(idx);
    if (sp_) for (const s of sp_) { proj(n, s.x, s.y); drawSprite(ctx, s.kind, PX, PY, sc1); }

    // gameplay objects
    const obs = view.obstacles.get(idx);
    if (obs) for (const o of obs) {
      if (o.hit) continue;
      proj(n, o.x, 0);
      shadow(ctx, PX, PY, WW[o.kind] * sc1 * S * 0.4, c.road[band], G, fog);
      drawSprite(ctx, o.kind, PX, PY, sc1);
    }
    const pk = view.pickups.get(idx);
    if (pk) pk.forEach((p, j) => {
      if (p.taken) return;
      const bob = 90 + Math.sin(t * 4 + idx * 0.7) * 30;
      proj(n, p.x, 0);
      shadow(ctx, PX, PY, WW.pickup * sc1 * S * 0.35, c.road[band], G, fog);
      proj(n, p.x, bob);
      drawSprite(ctx, "pickup", PX, PY, sc1, 0.3 + 0.7 * Math.abs(Math.cos(t * 3 + idx * 0.4 + j)));
    });

    // squirrel + dropped acorn
    for (const ent of view.entities) {
      if (Math.floor(ent.pos) !== segi) continue;
      const f = ent.pos - segi;
      const ez = EZ[n] + (EZ[n + 1] - EZ[n]) * f;
      if (ez <= 60) continue;
      const ex = EX[n] + (EX[n + 1] - EX[n]) * f, ef = EF[n] + (EF[n + 1] - EF[n]) * f;
      const scl = CAM_DEPTH / ez;
      projRaw(ez, ex, ef, ent.x, 0);
      shadow(ctx, PX, PY, WW[ent.kind] * scl * S * 0.42, c.road[band], G, fog);
      projRaw(ez, ex, ef, ent.x, ent.y);
      drawSprite(ctx, ent.kind, PX, PY, scl);
    }

    // burrow mouth at the bottom of the ramp
    if (idx === ENTRANCE) {
      const Rr = edgeR(segi), OG = Z.out.glow, gh = -EF[n], TW = 1400;
      if (camY > 0) {
        const p = [];
        proj(n, -60000, gh); p.push(PX, PY); proj(n, 60000, gh); p.push(PX, PY);
        proj(DD, 60000, -EF[DD]); p.push(PX, PY); proj(DD, -60000, -EF[DD]); p.push(PX, PY);
        poly(p, mix(Z.out.floor[0], OG, 0.35));
      }
      const outer = [];
      proj(n, -TW * 1.4, 0); outer.push(PX, PY); proj(n, -TW * 1.4, gh); outer.push(PX, PY);
      proj(n, TW * 1.4, gh); outer.push(PX, PY); proj(n, TW * 1.4, 0); outer.push(PX, PY);
      const hole = archPts(n, Rr);
      for (let i = hole.length - 2; i >= 0; i -= 2) outer.push(hole[i], hole[i + 1]);
      poly(outer, mix([96, 62, 46], OG, fog * 0.6));
      ring(n, Rr, 1.1, 1.0, mix([70, 44, 32], OG, fog * 0.6));
      ring(n, Rr, 1.075, 1.025, mix([196, 134, 86], OG, fog * 0.6));
      quadY(n, -TW * 1.4, TW * 1.4, gh - 1, gh + 110, mix([128, 188, 124], OG, fog * 0.6), true);
      ctx.strokeStyle = mix([78, 50, 38], OG, fog * 0.6);
      ctx.lineWidth = Math.max(1, sc1 * 26 * S);
      for (let k = 0; k < 7; k++) {
        const xw = -1100 + k * 370, Ln = 300 + hash01(k, 21) * 500;
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const tt = j / 7;
          proj(n, xw + Math.sin(tt * 4 + k) * 40, gh - Ln * tt);
          j ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY);
        }
        ctx.stroke();
      }
    }
  }

  // speed lines
  const inten = Math.min(1.3, 0.5 * view.speedNorm + 0.9 * view.boostE);
  if (inten > 0.05) {
    ctx.strokeStyle = "rgba(255,245,255,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 0; k < 40 * inten; k++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = (380 + Math.random() * 320) / 2;
      const r1 = r0 + ((140 + Math.random() * 240) * (0.7 + 0.5 * inten)) / 2;
      ctx.moveTo(cx0 + Math.cos(a) * r0, vp + Math.sin(a) * r0);
      ctx.lineTo(cx0 + Math.cos(a) * r1, vp + Math.sin(a) * r1);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.drawImage(VIGNETTE, 0, 0);

  // quad between two world heights, spanning x from xa to xb (used for ramp floors / grass lip)
  function quadY(n1, xa, xb, wy1, wy2, fill, sameEdge) {
    const p = [];
    const n2 = sameEdge ? n1 : n1 + 1;
    if (sameEdge) {
      proj(n1, xa, wy1); p.push(PX, PY); proj(n1, xb, wy1); p.push(PX, PY);
      proj(n1, xb, wy2); p.push(PX, PY); proj(n1, xa, wy2); p.push(PX, PY);
    } else {
      proj(n1, xa, wy1); p.push(PX, PY); proj(n1, xb, wy1); p.push(PX, PY);
      proj(n2, xb, wy2); p.push(PX, PY); proj(n2, xa, wy2); p.push(PX, PY);
    }
    poly(p, fill);
  }
}

function shadow(ctx, x, y, rx, road, G, fog) {
  if (rx < 1) return;
  ctx.fillStyle = mix(road.map((v) => v * 0.72), G, fog);
  ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.16, 0, 0, Math.PI * 2); ctx.fill();
}

// opts: alpha (fade into fog), flip (mirror horizontally), maxW (skip when wider than this on screen)
export function drawSprite(ctx, kind, x, yBottom, scale, squashX = 1, opts) {
  const img = IMG[kind];
  const tw = WW[kind] * scale * S;
  if (tw < 1.5 || tw > ((opts && opts.maxW) || W * 2.2)) return;
  const th = (tw * img.naturalHeight) / img.naturalWidth;
  const src = pickMip(kind, th);
  if (!opts) { ctx.drawImage(src, x - (tw * squashX) / 2, yBottom - th, tw * squashX, th); return; }
  const a = opts.alpha ?? 1;
  if (a <= 0.02) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * a;
  if (opts.flip) {
    ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1);
    ctx.drawImage(src, -(tw * squashX) / 2, yBottom - th, tw * squashX, th);
    ctx.restore();
  } else ctx.drawImage(src, x - (tw * squashX) / 2, yBottom - th, tw * squashX, th);
  ctx.globalAlpha = prev;
}

// ---------------- cockpit + text helpers ----------------
export function drawWheel(ctx, deg, dy = 0, head = true) {
  const img = IMG.wheel;
  ctx.save();
  ctx.translate(W / 2, 940 + dy);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -250, -250, 500, 500);
  ctx.restore();
  // Miuu in the driver's seat (back of head = the intro clip's last frame)
  if (head) ctx.drawImage(IMG.miuu, 156.84, 829.36, 229.3, 130.53);
}

export function outlinedText(ctx, text, x, y, size, opts = {}) {
  ctx.save();
  ctx.font = `800 ${size}px Poppins, system-ui, sans-serif`;
  ctx.textAlign = opts.align || "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = opts.stroke ?? size * 0.22;
  ctx.strokeStyle = opts.strokeColor || OUTLINE;
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = opts.fill || "#fff";
  ctx.fillText(text, x, y);
  ctx.restore();
}
