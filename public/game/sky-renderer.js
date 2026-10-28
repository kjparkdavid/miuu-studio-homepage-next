// Sky stage renderer — ported from render_scene() / frame() in source/sky.py.
// Logical canvas 540x960, same projection constants as the burrow. Painted the way the ocean is: level
// planes as screen-wide rectangles, far bands in one piece, small same-coloured things in one path.
import { W, H, S, VP, IMG, mix, hash01, drawSprite, registerSprites, glow, makeVignette } from "./renderer.js";
import { CAM_DEPTH } from "./track.js";
import {
  N, SEG_LEN, CAM_H, ISLAND_END, CASTLE_END, STORM_END, RISE_END, ROAD, ARCH_SEG, STORM_FLOOR, LIGHTNING,
  smooth, pathY, PATH_Y, belowFloor, curves, palette, objs, FLOCKS, ANGEL, BRIDGE_FROM, ARCHES, PADS, PAD_LEN,
} from "./sky-track.js";

const DD = 150;
const FAR_N = 30;    // from this many segments ahead, a band's three segments are painted as one piece
const SPECK_N = 25;  // segments per stretch whose specks are painted together
const FRAMES_PER_SEG = 1 / 1.36;   // the reel moved ~1.36 segments per frame; used to time fly-bys by position
const RAINBOW = [[255, 160, 176], [255, 200, 150], [255, 236, 150], [172, 230, 172], [150, 204, 255], [200, 172, 250]];
const STRIPE = (ROAD * 2) / 6;
const WHITE = [255, 255, 255];

const F = (n) => "sky/" + n;
export const SKY_FILES = {
  flag_p: F("flag_pink"), flag_b: F("flag_blue"), flag_y: F("flag_yellow"), sock: F("windsock"),
  bal1: F("balloon_pink"), bal2: F("balloon_blue"), bal3: F("balloon_yellow"), bal4: F("balloon_lavender"),
  birdU: F("bird_wings_up"), birdD: F("bird_wings_down"), isl_c: F("floating_island_castle"), isl_t: F("floating_island_trees"),
  puff0: F("cloud_puff_0"), puff1: F("cloud_puff_1"), puff2: F("cloud_puff_2"), puff3: F("cloud_puff_3"),
  tower0: F("cloud_tower_0"), tower1: F("cloud_tower_1"), tower2: F("cloud_tower_2"),
  angel0: F("giant_angel_0.webp"), angel1: F("giant_angel_1.webp"), angel2: F("giant_angel_2.webp"), angel5: F("giant_angel_5.webp"), angel6: F("giant_angel_6.webp"),
  // gameplay + cockpit
  it_star: F("item_star"), it_heart: F("item_heart"), it_gem: F("item_gem"), it_gift: F("item_gift_box"),
  // Ki's hand-drawn birds: the ones you send flying, as in the reel
  hb_yellow: F("ki_bird_yellow"), hb_blue: F("ki_bird_blue"), hb_grey: F("ki_crow_grey"),
  crow_diary_u: F("crow_back_diary_up"), crow_diary_d: F("crow_back_diary_down"), crow_empty_u: F("crow_back_empty_up"), crow_empty_d: F("crow_back_empty_down"),
  yoke: F("yoke"), s_frame: F("window_frame"), s_console: F("console"), s_miuu: F("miuu_back"), bank: F("cloud_bank"),
  app_icon: "app_icon",   // beside the app's name when the crow is caught
};
const SKY_WW = {
  flag_p: 300, flag_b: 300, flag_y: 300, sock: 480, bal1: 900, bal2: 900, bal3: 900, bal4: 900, birdU: 300, birdD: 300,
  isl_c: 4200, isl_t: 3600, puff0: 2600, puff1: 2600, puff2: 2600, puff3: 2600, tower0: 2000, tower1: 2000, tower2: 2000,
  angel0: 34000, angel1: 34000, angel2: 34000, angel5: 34000, angel6: 34000,
  it_star: 300, it_heart: 300, it_gem: 300, it_gift: 560, hb_yellow: 620, hb_blue: 620, hb_grey: 620,
  crow_diary_u: 560, crow_diary_d: 560, crow_empty_u: 560, crow_empty_d: 560,
};
registerSprites(SKY_FILES, SKY_WW);
export const SKY_KEYS = Object.keys(SKY_FILES);
const ANGEL_FLAP = ["angel0", "angel1", "angel2", "angel1", "angel0", "angel5", "angel6", "angel5"];   // one wing beat

const UNIT = [[-1, 0], [-1, 0.35]];
for (let k = 1; k < 20; k++) { const a = Math.PI - (Math.PI * k) / 20; UNIT.push([Math.cos(a), 0.35 + Math.sin(a)]); }
UNIT.push([1, 0.35], [1, 0]);

const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mixA = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Camera height for a position: rides CAM_H above the road, swaying gently once it is back above the clouds.
export function camYOf(pos, t) {
  let cy = pathY(pos) + CAM_H;
  if (pos > RISE_END) cy += Math.sin(t * 4.5) * 24 * smooth((pos - RISE_END) / 6);
  return cy;
}

// ---------------- static layers ----------------
let VIGNETTE = null;
const STARS = Array.from({ length: 90 }, (_, k) => [hash01(k, 1), hash01(k, 2), 0.5 + hash01(k, 3) * 1.25]);
// The cloud bank along the horizon is one white strip, tinted to the sky's colour. The tint only
// changes between zones, so the tinted copy is kept until the colour moves on.
let bankTint = null, bankKey = "";
function tintedBank(col) {
  const key = `${col[0] >> 2},${col[1] >> 2},${col[2] >> 2}`;
  if (key === bankKey) return bankTint;
  const img = IMG.bank;
  if (!bankTint) { bankTint = document.createElement("canvas"); bankTint.width = img.naturalWidth; bankTint.height = img.naturalHeight; }
  const x = bankTint.getContext("2d");
  x.globalCompositeOperation = "copy"; x.drawImage(img, 0, 0);
  x.globalCompositeOperation = "source-in"; x.fillStyle = rgb(col); x.fillRect(0, 0, bankTint.width, bankTint.height);
  bankKey = key;
  return bankTint;
}

// what the cockpit's gauges show, kept from the last frame drawn
const gauge = { camY: 0, speed: 0, boost: 0, t: 0 };

// ---------------- frame ----------------
// view = { pos, camX, camY, pitch, yaw, jitter, rot, t, speedNorm, boostE, pickups, obstacles, entities, fx, flyers }
export function renderSky(ctx, view) {
  if (!VIGNETTE) VIGNETTE = makeVignette("40,20,60", 0.8);
  const { pos, camX, camY, pitch, yaw, t } = view;
  Object.assign(gauge, { camY, speed: view.speedNorm, boost: view.boostE, t });
  const above = camY > 0;
  const pal = palette(pos);
  const FOG = pal.fog;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const vp = VP + view.jitter;
  const hz = vp - CAM_DEPTH * S * Math.tan(pitch);
  const cx0 = W / 2 + yaw;
  const base = Math.floor(pos), pct = pos - base;
  const position = pos * SEG_LEN;

  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(view.rot); ctx.translate(-W / 2, -H / 2);

  // background: the open sky from above the clouds, their underside from below
  {
    const far = above ? pal.hor : FOG, high = above ? pal.top : pal.ua, span = above ? 800 : 640;
    const g = ctx.createLinearGradient(0, hz - span, 0, hz);
    g.addColorStop(0, rgb(high)); g.addColorStop(0.5, rgb(mixA(far, high, 0.6))); g.addColorStop(0.75, rgb(mixA(far, high, 0.36))); g.addColorStop(1, rgb(far));
    ctx.fillStyle = g; ctx.fillRect(-W, -H * 2, W * 3, hz + H * 2);
    ctx.fillStyle = rgb(FOG); ctx.fillRect(-W, hz, W * 3, H * 3);
  }
  if (above) {
    if (pal.stars > 0.05) {
      ctx.fillStyle = mix(pal.top, [255, 250, 230], pal.stars * 0.8);
      ctx.beginPath();
      for (const [fx, fy, r] of STARS) {
        const x = (fx * 2 - 0.5) * W, y = hz - fy * 750 - 40;
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    if (pal.sun > 0.05) {
      const sx = W / 2 + 137 + yaw * 0.3, sy = hz - 150, sr = 57;
      ctx.fillStyle = mix(pal.hor, pal.sunc, 0.35 * pal.sun); ctx.beginPath(); ctx.arc(sx, sy, sr * 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mix(pal.hor, pal.sunc, pal.sun); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    const bank = tintedBank(mixA(pal.ca, FOG, 0.35));
    const off = (((-yaw * 0.5 + t * 4) % bank.width) + bank.width) % bank.width;
    for (let x = -off - W * 0.5; x < W * 1.5; x += bank.width) ctx.drawImage(bank, x, hz - bank.height + 15);
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
  // quad between edge n (height Y1) and the next edge (height Y2), from xa to xb
  const quad = (n, xa, xb, Y1, Y2, fill) => {
    const p = [];
    proj(n, xa, Y1); p.push(PX, PY); proj(n, xb, Y1); p.push(PX, PY);
    proj(n + 1, xb, Y2); p.push(PX, PY); proj(n + 1, xa, Y2); p.push(PX, PY);
    poly(p, fill);
  };
  // A level plane that runs off both sides of the view (the cloud layer, the ground) between edges n
  // and m: its edges are level lines on screen, so it is a plain rectangle a little wider than the view.
  const plane = (n, m, Y, fill) => {
    proj(n, 0, Y); const ya = PY;
    proj(m, 0, Y);
    ctx.fillStyle = fill; ctx.fillRect(-W, Math.min(ya, PY), W * 3, Math.abs(ya - PY));
  };
  // an arch standing across the road at edge n: the band between two sizes of the same outline
  const ring = (n, R, Y, sOut, sIn, fill) => {
    const p = [];
    for (const [ux, uy] of UNIT) { proj(n, ux * R * sOut, Y + uy * R * sOut); p.push(PX, PY); }
    for (let i = UNIT.length - 1; i >= 0; i--) { proj(n, UNIT[i][0] * R * sIn, Y + UNIT[i][1] * R * sIn); p.push(PX, PY); }
    poly(p, fill);
  };
  const lastEdge = Math.min(DD, N - 1 - base);   // furthest edge that exists
  const bandEnd = (n) => Math.min(lastEdge, n + 3 - ((base + n) % 3));   // far edge of segment n's band
  const fogOf = (n) => 1 - Math.exp(-((n / DD) ** 2) * 2.2);
  const sprite = (kind, n, wx, Y, fog, opts = {}) => {
    proj(n, wx, Y);
    drawSprite(ctx, kind, PX, PY, PS, opts.squash ?? 1, { alpha: 1 - Math.min(1, fog), flip: opts.flip, maxW: opts.maxW });
  };
  // is this height on the camera's side of the cloud layer?
  const sameSide = (Y) => Y > 0 === above;

  // ---- pass 1: the big planes (the cloud sea from above; the clouds' underside and the ground from below) ----
  const floorY = belowFloor(base);
  for (let n = DD - 1; n >= 0; n--) {
    if (EZ[n] <= 60) continue;
    const segi = base + n;
    if (segi >= N - 1) continue;
    const band = Math.floor(segi / 3) % 2;
    const fog = fogOf(n);
    // the plane's piece here: this segment, or from FAR_N on its whole band, painted at the band's nearest segment
    const whole = n >= FAR_N;
    const m = whole ? bandEnd(n) : n + 1;
    const paint = !whole || segi % 3 === 0 || n === FAR_N;
    if (above) {
      if (paint) plane(n, m, 0, mix(band ? pal.cb : pal.ca, FOG, fog));
    } else if (paint) {
      plane(n, m, 0, mix(band ? pal.ub : pal.ua, FOG, fog * 0.8));
      plane(n, m, floorY, mix(band ? pal.gb : pal.ga, FOG, fog));
    }
    // soft lumps in the cloud layer, every other segment, three in one paint
    if (segi % 2 === 0) {
      const Y = above ? 0 : -10, r = scaleAt(n, Y) * (above ? 700 : 800) * S;
      if (r < W * 0.75) {
        ctx.fillStyle = above ? mix(mixA(pal.ca, WHITE, 0.6), FOG, fog) : mix(mixA(pal.ua, [190, 182, 226], 0.55), FOG, fog * 0.8);
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          proj(n, (hash01(segi, above ? k : k + 30) * 2 - 1) * 8000, Y);
          ctx.moveTo(PX + r, PY); ctx.ellipse(PX, PY, r, r * 0.2, 0, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
  }

  // ---- pass 2: the road and everything in the air, far to near ----
  // Specks (sparkles, the lights along the road, rain) are gathered per stretch of SPECK_N segments
  // and painted in one go when the stretch is done.
  let specks = null;
  const dot = (path, r) => { path.used = true; path.moveTo(PX + r, PY); path.arc(PX, PY, r, 0, Math.PI * 2); };
  const paintSpecks = () => {
    if (!specks) return;
    if (specks.blob.used) { ctx.fillStyle = specks.blobCol; ctx.fill(specks.blob); }
    if (specks.white.used) { ctx.fillStyle = specks.whiteCol; ctx.fill(specks.white); }
    if (specks.rain.used) { ctx.strokeStyle = specks.rainCol; ctx.lineWidth = 1.5; ctx.stroke(specks.rain); }
    specks = null;
  };
  // The rainbow road between edges a and b (b further): six stripes, each one piece.
  const road = (a, b, lite, fog) => {
    for (let k = 0; k < 6; k++) {
      const x0 = -ROAD + k * STRIPE, x1 = x0 + STRIPE;
      ctx.beginPath();
      for (let e = a; e <= b; e++) { proj(e, x0, EY[e]); e === a ? ctx.moveTo(PX, PY) : ctx.lineTo(PX, PY); }
      for (let e = b; e >= a; e--) { proj(e, x1, EY[e]); ctx.lineTo(PX, PY); }
      ctx.closePath();
      ctx.fillStyle = mix(lite ? mixA(RAINBOW[k], WHITE, 0.28) : RAINBOW[k], FOG, fog * 0.55); ctx.fill();
    }
  };
  // a road segment shows when it is on our side of the cloud layer, or passing through it
  const roadShows = (n) => sameSide(EY[n]) || Math.abs(EY[n]) < 300;
  // what the road lies on at segment n: the meadow's runway, the castle's bridge
  const underRoad = (n, fog) => {
    const segi = base + n, py1 = EY[n], py2 = EY[n + 1];
    if (!above && segi < ISLAND_END + 2) quad(n, -1000, 1000, py1, py2, mix([236, 230, 220], FOG, fog));
    if (segi >= BRIDGE_FROM && segi < CASTLE_END && sameSide(py1)) {
      quad(n, -1150, 1150, py1 - 40, py2 - 40, mix(Math.floor(segi / 2) % 2 ? [204, 196, 224] : [214, 206, 232], FOG, fog));
      ctx.fillStyle = mix([170, 160, 200], FOG, fog);
      ctx.beginPath();   // both side walls in one paint
      for (const sg of [-1, 1]) {
        proj(n, sg * 1150, py1 - 40); ctx.moveTo(PX, PY); proj(n + 1, sg * 1150, py2 - 40); ctx.lineTo(PX, PY);
        proj(n + 1, sg * 1150, py2 - 420); ctx.lineTo(PX, PY); proj(n, sg * 1150, py1 - 420); ctx.lineTo(PX, PY); ctx.closePath();
      }
      ctx.fill();
    }
  };
  const flap = Math.floor(t * 10);
  let top = true;   // the first (furthest) segment drawn
  for (let n = DD - 1; n >= 0; n--) {
    if (EZ[n] <= 60) continue;
    const segi = base + n;
    if (segi >= N - 1) continue;
    const band = Math.floor(segi / 3) % 2;
    const fog = fogOf(n);
    const py1 = EY[n], py2 = EY[n + 1];
    const stretch = Math.floor(n / SPECK_N);
    if (!specks || specks.stretch !== stretch) {
      paintSpecks();
      const f = fogOf(stretch * SPECK_N + SPECK_N / 2);
      specks = { stretch, blob: new Path2D(), white: new Path2D(), rain: new Path2D(), blobCol: mix([100, 90, 146], FOG, f * 0.8), whiteCol: mix(WHITE, FOG, f * 0.5), rainCol: mix([176, 186, 236], FOG, f * 0.5) };
    }

    // cloud walls at the drop and the climb (under the layer)
    if (!above && ((segi >= CASTLE_END + 1 && segi < CASTLE_END + 110) || (segi >= STORM_END - 60 && segi < RISE_END - 6))) {
      ctx.fillStyle = mix(Math.floor(segi / 2) % 2 ? [74, 64, 114] : [82, 72, 124], FOG, fog * 0.8);
      ctx.beginPath();
      for (const sg of [-1, 1]) {
        const wx1 = sg * (2500 + 380 * Math.sin(segi * 0.37)), wx2 = sg * (2500 + 380 * Math.sin((segi + 1) * 0.37));
        proj(n, wx1, STORM_FLOOR); ctx.moveTo(PX, PY); proj(n, wx1, 0); ctx.lineTo(PX, PY);
        proj(n + 1, wx2, 0); ctx.lineTo(PX, PY); proj(n + 1, wx2, STORM_FLOOR); ctx.lineTo(PX, PY); ctx.closePath();
      }
      ctx.fill();
      for (const sg of [-1, 1]) for (let k = 0; k < 2; k++) {   // billows on the wall
        const Yb = -400 - hash01(segi, k + 7 + (sg > 0)) * 4500;
        proj(n, sg * (2380 + 380 * Math.sin(segi * 0.37)), Yb);
        const r = PS * 420 * S;
        if (r < 200) { specks.blob.used = true; specks.blob.moveTo(PX + r, PY); specks.blob.ellipse(PX, PY, r, r * 0.7, 0, 0, Math.PI * 2); }
      }
    }

    // the rainbow road, a band at a time: painted when the band's furthest segment comes up, so that
    // everything standing in the band still lands on top of it
    if (segi % 3 === 2 || top) {
      let a = Math.max(0, n - (segi % 3));   // never behind the camera: edge -1 does not exist
      while (a < n && EZ[a] <= 60) a++;
      const f = fogOf((a + n + 1) / 2);
      for (let e = n; e >= a; e--) underRoad(e, fogOf(e));
      for (let e = a; e <= n; e++) {   // runs of segments that show
        if (!roadShows(e)) continue;
        let b = e;
        while (b < n && roadShows(b + 1)) b++;
        road(e, b + 1, band === 0, f);
        e = b;
      }
    }
    top = false;
    if (roadShows(n)) {
      if (segi % 6 === 0) for (const sg of [-1, 1]) {   // lights along the road's edges
        proj(n, sg * (ROAD + 20), py1 + 20);
        dot(specks.white, Math.max(0.75, PS * 60 * S));
      }
      // boost pads on the road (the arch's spans it)
      for (const pd of PADS) {
        if (segi < pd.seg || segi >= pd.seg + PAD_LEN) continue;
        const glowing = 0.5 + 0.5 * Math.sin(t * 10 - (segi - pd.seg)), half = pd.w ? pd.w - 80 : 200;
        quad(n, pd.x - half, pd.x + half, py1 + 4, py2 + 4, mix([255, 120, 190], [255, 236, 248], glowing * 0.6 + fog * 0.3));
        ctx.fillStyle = mix(WHITE, FOG, fog * 0.5);
        ctx.beginPath();
        for (const ax of pd.w ? [pd.x - 420, pd.x, pd.x + 420] : [pd.x]) {
          proj(n, ax - 150, py1 + 6); ctx.moveTo(PX, PY); proj(n + 1, ax, py2 + 6); ctx.lineTo(PX, PY); proj(n, ax + 150, py1 + 6); ctx.lineTo(PX, PY);
          proj(n, ax + 90, py1 + 6); ctx.lineTo(PX, PY);
          projRaw(EZ[n] + SEG_LEN * 0.55, EX[n] + (EX[n + 1] - EX[n]) * 0.55, ax, py1 + (py2 - py1) * 0.55 + 6); ctx.lineTo(PX, PY);
          proj(n, ax - 90, py1 + 6); ctx.lineTo(PX, PY); ctx.closePath();
        }
        ctx.fill();
      }
    }
    // the rainbow arch you fly through for a boost
    if (segi === ARCH_SEG && above) {
      for (let k = 0; k < 6; k++) ring(n, 2200, py1 - 300, 1 - k * 0.07, 1 - (k + 1) * 0.07, mix(RAINBOW[k], FOG, fog * 0.5));
    }
    // stone arches over the bridge, each with a pair of banners
    if (ARCHES.has(segi) && sameSide(py1)) {
      const R = 1250, Y = py1 - 40;
      ring(n, R, Y, 1, 0.86, mix([196, 186, 222], FOG, fog));
      ring(n, R, Y, 1, 0.97, mix([230, 224, 246], FOG, fog));
      ctx.fillStyle = mix(Math.floor(segi / 9) % 2 ? [150, 200, 255] : [250, 160, 190], FOG, fog);
      ctx.beginPath();
      for (const sg of [-1, 1]) {
        proj(n, sg * R * 0.93, Y + 0.35 * R + 300);
        const bl = PS * S;
        ctx.moveTo(PX - 70 * bl, PY); ctx.lineTo(PX + 70 * bl, PY); ctx.lineTo(PX + 70 * bl, PY + 360 * bl);
        ctx.lineTo(PX, PY + 280 * bl); ctx.lineTo(PX - 70 * bl, PY + 360 * bl); ctx.closePath();
      }
      ctx.fill();
    }

    // sparkles in the air; streaks of rain in the storm
    for (let k = 0; k < 2; k++) {
      const Y = py1 - 600 + hash01(segi, k + 61) * 2400;
      if (!sameSide(Y)) continue;
      proj(n, (hash01(segi, k + 60) * 2 - 1) * 2800, Y);
      if (above || segi < CASTLE_END) dot(specks.white, Math.min(5, Math.max(0.5, PS * 16 * S)));
      else {
        const L = PS * 260 * S;
        if (L < 150) { specks.rain.used = true; specks.rain.moveTo(PX, PY - L); specks.rain.lineTo(PX - L * 0.15, PY); }
      }
    }

    // scenery sprites
    const list = objs.get(segi);
    if (list) for (const o of list) {
      const Y = o.anchor === "road" ? py1 + o.y : o.anchor === "path" ? py1 + o.y + Math.sin(t * 1.4 + segi) * 90 : o.y;
      if (Y > -50 !== above) continue;
      sprite(o.kind, n, o.x, Y, fog, { flip: o.flip });
    }
    // bird flocks crossing the road
    if (above) for (let j = 0; j < FLOCKS.length; j++) {
      const fl = FLOCKS[j];
      if (fl.seg !== segi) continue;
      const xc = fl.x0 + fl.vx * 6 * Math.max(0, pos - (fl.seg - 45)) * FRAMES_PER_SEG;
      for (let m = 0; m < fl.n; m++) {
        const Y = py1 + fl.yrel + (hash01(j * 10 + m, 2) * 2 - 1) * 300;
        sprite((flap + m) % 2 ? "birdD" : "birdU", n, xc + (hash01(j * 10 + m, 1) * 2 - 1) * 700, Y, fog, { flip: fl.vx < 0 });
      }
    }

    // gameplay: Ki's birds sitting in the road, things to collect
    const obs = view.obstacles.get(segi);
    if (obs) for (const o of obs) {
      if (o.hit) continue;
      const Y = py1 + o.y + Math.sin(t * 9 + segi * 1.3 + o.x) * 50;
      if (!sameSide(Y)) continue;
      sprite(o.kind, n, o.x, Y, fog * 0.6, { squash: 1 + 0.05 * Math.sin(t * 13 + segi) });
    }
    const pk = view.pickups.get(segi);
    if (pk) pk.forEach((p, j) => {
      if (p.taken) return;
      const gift = p.kind === "it_gift";
      const Y = py1 + (gift ? 110 : 170) + Math.sin(t * 4 + segi * 0.7) * 30;
      if (!sameSide(Y)) return;
      sprite(p.kind, n, p.x, Y, fog * 0.4, { squash: gift ? 1 + 0.06 * Math.sin(t * 8) : 0.35 + 0.65 * Math.abs(Math.cos(t * 3 + segi * 0.4 + j)) });
    });

    // the thief (and anything else that lives at a fractional position)
    for (const ent of view.entities) {
      if (Math.floor(ent.pos) !== segi) continue;
      const f = ent.pos - segi;
      const ez = EZ[n] + (EZ[n + 1] - EZ[n]) * f;
      if (ez <= 60) continue;
      const Y = pathY(ent.pos) + ent.y;
      if (!sameSide(Y)) continue;
      projRaw(ez, EX[n] + (EX[n + 1] - EX[n]) * f, ent.x, Y);
      drawSprite(ctx, ent.kind, PX, PY, PS, 1, { alpha: 1 - Math.min(1, fog * 0.5) });
    }

    // the giant angel rising out of the cloud sea
    if (above && n === ANGEL.D && pos >= ANGEL.p0 && pos < ANGEL.p1) {
      const u = (pos - ANGEL.p0) / (ANGEL.p1 - ANGEL.p0);
      const us = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
      const Y = pathY(pos) + ANGEL.y + ANGEL.rise * u + Math.sin(t * 0.9) * 380;
      const fade = Math.min(smooth(u / 0.12), smooth((1 - u) / 0.12));
      projRaw(ANGEL.D * SEG_LEN, 0, ANGEL.x0 + (ANGEL.x1 - ANGEL.x0) * us, Y);
      drawSprite(ctx, ANGEL_FLAP[Math.floor(t * 7.5) % 8], PX, PY, PS, 1, { alpha: (1 - Math.max(fog, ANGEL.fog)) * fade, maxW: 2400 });
    }
  }
  paintSpecks();
  ctx.restore();

  // ---- screen-space effects ----
  const fx = view.fx || {};
  // daylight flooding in as you climb out of the storm
  if (!above && pos > STORM_END - 9) {
    const k = clamp01((pos - (STORM_END - 9)) / (RISE_END - (STORM_END - 9)));
    const li = (0.4 + 0.5 * k) * (1 - 0.85 * smooth((k - 0.55) / 0.4));
    const z2u = -Math.sin(pitch), y2u = Math.cos(pitch);
    const cyu = Math.max(-100, Math.min(450, vp - (CAM_DEPTH / Math.max(0.2, z2u)) * y2u * S));
    glow(ctx, "240,200,190", cx0, cyu, 300 + 280 * k, 0.75 * li);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255,236,226,${0.1 * li})`;
    ctx.beginPath();   // the fourteen rays in one paint
    for (let j = 0; j < 14; j++) {
      const a0 = (j * 2 * Math.PI) / 14 + t * 0.3, wa = 0.05 + 0.03 * hash01(j, 5);
      ctx.moveTo(cx0, cyu); ctx.lineTo(cx0 + Math.cos(a0 - wa) * 1100, cyu + Math.sin(a0 - wa) * 1100);
      ctx.lineTo(cx0 + Math.cos(a0 + wa) * 1100, cyu + Math.sin(a0 + wa) * 1100); ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }
  // rain on the glass
  const rain = above ? 0 : pal.rain;
  if (rain > 0.05) {
    ctx.strokeStyle = `rgba(210,214,255,${0.43 * rain})`; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 0; k < 130 * rain; k++) {
      const x = Math.random() * (W + 150) - 75, y = Math.random() * H, ln = 30 + Math.random() * 60;
      ctx.moveTo(x, y); ctx.lineTo(x - ln * 0.25, y + ln);
    }
    ctx.stroke();
  }
  // speed lines
  const inten = Math.min(1.3, 0.5 * view.speedNorm + 0.9 * view.boostE);
  if (inten > 0.05) {
    const cy = Math.min(650, Math.max(150, hz));
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let k = 0; k < 40 * inten; k++) {
      const a = Math.random() * Math.PI * 2, r0 = (380 + Math.random() * 320) / 2, r1 = r0 + ((140 + Math.random() * 240) * (0.7 + 0.5 * inten)) / 2;
      ctx.moveTo(cx0 + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx0 + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    }
    ctx.stroke();
  }
  drawFx(ctx, fx);
  // lightning: a bolt, and the whole sky lit for a blink
  for (let j = 0; j < LIGHTNING.length; j++) {
    const k = Math.floor(fx["bolt" + j] * 30);
    if (!(k >= 0 && k < 6)) continue;
    if (k < 3 && !above) {
      const r = seeded(j * 31 + 5), end = Math.min(650, Math.max(150, hz)) - 20;
      let bx = 75 + r() * (W - 150), by = -10;
      ctx.beginPath(); ctx.moveTo(bx, by);
      while (by < end) { by += 25 + r() * 35; bx += (r() - 0.5) * 70; ctx.lineTo(bx, by); }
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgb(200,180,255)"; ctx.lineWidth = 11; ctx.stroke();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.stroke();
    }
    ctx.fillStyle = `rgba(236,226,255,${[0.5, 0.15, 0.38, 0.1, 0.05, 0.02][k]})`; ctx.fillRect(0, 0, W, H);
  }
  ctx.drawImage(VIGNETTE, 0, 0);
  drawFlyers(ctx, view.flyers || []);
}

function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// ---------------- cloud bursts as you pass through the layer (fx values are seconds since each event) ----------------
// Each burst is one shape and one paint: many big see-through shapes are the slowest thing for a phone.
function wisps(ctx, k, seed, dirn, alpha) {
  const r = seeded(seed);
  ctx.fillStyle = `rgba(255,255,255,${0.43 * alpha})`;
  ctx.beginPath();
  for (let i = 0; i < 60; i++) {
    const x = r() * W, y0 = r() * H * 1.6 - H * 0.3, ln = 30 + r() * 80, vy = 25 + r() * 40, w = 4 + r() * 9;
    const y = y0 + dirn * k * vy;
    if (y < -ln || y > H + ln) continue;
    ctx.moveTo(x + w, y); ctx.ellipse(x, y, w, ln, 0, 0, Math.PI * 2);
  }
  ctx.fill();
}
function puffs(ctx, k, seed, colour, count, kmax, spread = 1) {
  const r = seeded(seed);
  ctx.fillStyle = `rgba(${colour},${0.78 * (1 - k / kmax)})`;
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const ang = r() * Math.PI * 2, dist = (0.15 + r() * 0.85) * 325 * spread * (1 + k * 0.12);
    const x = W / 2 + Math.cos(ang) * dist, y = H * 0.45 + Math.sin(ang) * dist * 1.1, rr = (45 + r() * 100) * (1 + k * 0.08);
    ctx.moveTo(x + rr, y); ctx.ellipse(x, y, rr, rr * 0.8, 0, 0, Math.PI * 2);
  }
  ctx.fill();
}
function drawFx(ctx, fx) {
  for (const [key, dirn, seed, len] of [["takeoff", 1, 4, 26], ["drop", -1, 7, 22], ["up", 1, 9, 24]]) {
    const k = fx[key] * 30;
    if (k >= 0 && k < len) wisps(ctx, k, seed, dirn, Math.sin((Math.PI * k) / len));
  }
  let k = fx.out * 30;
  if (k >= 0 && k < 12) puffs(ctx, k, 3, "255,255,255", 14, 12, 1.3);
  k = fx.punchIn * 30;
  if (k >= 0 && k < 14) puffs(ctx, k, 8, "110,100,150", 20, 14);
  k = fx.punchOut * 30;
  if (k >= 0 && k < 75) {
    if (k < 10) puffs(ctx, k, 10, "255,244,246", 12, 10, 1.3);
    const a = 1 - k / 75, r = seeded(2);   // drops running down the glass
    const streaks = new Path2D(), drops = new Path2D();
    for (let i = 0; i < 30; i++) {
      const x = r() * W, y0 = r() * H * 0.85, rr = 7 + r() * 17, y = y0 + k * (0.75 + rr * 0.08) * (1 + k * 0.02);
      if (y - rr * 3 > H) continue;
      streaks.moveTo(x, y - rr * 3); streaks.lineTo(x, y);
      drops.moveTo(x + rr * 0.7, y); drops.ellipse(x, y, rr * 0.7, rr * 0.85, 0, 0, Math.PI * 2);
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.27 * a})`; ctx.lineWidth = 6; ctx.stroke(streaks);
    ctx.fillStyle = `rgba(255,255,255,${0.3 * a})`; ctx.fill(drops);
  }
}

// The comic-book star where something is hit: `d` is thirtieths of a second since the hit (gone by 7).
function impactStar(ctx, px, py, d, rot = 0.4, size = 1) {
  if (d >= 7) return;
  const a = 1 - Math.max(0, d - 2) / 5, R = (75 + 37 * Math.min(d, 3)) * size;
  ctx.save(); ctx.globalAlpha = a;
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 7 * size; ctx.lineCap = "butt";
  for (let j = 0; j < 12; j++) {
    const aa = (j * 2 * Math.PI) / 12 + rot, r0 = R * 1.15, r1 = R * (1.7 + 0.25 * (j % 2));
    ctx.beginPath(); ctx.moveTo(px + Math.cos(aa) * r0, py + Math.sin(aa) * r0); ctx.lineTo(px + Math.cos(aa) * r1, py + Math.sin(aa) * r1); ctx.stroke();
  }
  if (d < 5) for (const [R_, r_, col] of [[R + 5, R * 0.55 + 3, "rgb(75,58,110)"], [R, R * 0.55, "rgb(255,226,120)"], [R * 0.6, R * 0.33, "rgb(255,252,230)"]]) {
    ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 24; i++) { const aa = rot + (i * Math.PI) / 12, rr = i % 2 ? r_ : R_; ctx.lineTo(px + Math.cos(aa) * rr, py + Math.sin(aa) * rr); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ---------------- a bird you hit is sent flying (flyers: {t, dur, kind, dx}) ----------------
// It squashes against the glass, then spins away up into the sky, shrinking to a twinkle.
export const FLY_TIME = 0.95;
function drawFlyers(ctx, flyers) {
  for (const fl of flyers) {
    const img = IMG[fl.kind];
    if (!img) continue;
    const d = fl.t * 30;
    const dir = Math.abs(fl.dx) < 45 ? (fl.spin > 0 ? 0.3 : -0.3) : Math.sign(fl.dx);   // dead centre: straight up
    const c0x = W / 2 + fl.dx, c0y = 500, h0 = 160, aspect = img.naturalWidth / img.naturalHeight;
    impactStar(ctx, c0x, c0y - 10, d, fl.spin, 0.75);
    if (d < 9) {   // feathers knocked loose
      const r = seeded(Math.round(Math.abs(fl.spin) * 1000) + 3);
      ctx.fillStyle = `rgba(255,255,255,${1 - d / 9})`;
      ctx.beginPath();
      for (let j = 0; j < 12; j++) {
        const ang = r() * Math.PI * 2, sp = 34 + r() * 46, rr = (4 + r() * 6) * (1 - d / 10);
        const x = c0x + Math.cos(ang) * sp * (d + 1) * 0.42, y = c0y + Math.sin(ang) * sp * (d + 1) * 0.42 + d * d * 1.6;
        ctx.moveTo(x + rr, y); ctx.ellipse(x, y, rr, rr * 0.55, ang, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    const pose = (time) => {
      const u = clamp01((time - 0.07) / (FLY_TIME - 0.07)), e = 1 - (1 - u) ** 2.4;
      return { u, x: c0x + dir * (50 + 230 * e), y: c0y - 400 * e - 50 * Math.sin(u * Math.PI), scale: 1.3 - 1.22 * e ** 1.2, rot: fl.spin * 24 * (time - 0.07) };
    };
    if (fl.t < 0.07) {   // flat against the glass
      const w = h0 * aspect * 1.35, h = h0 * 0.72;
      ctx.drawImage(img, c0x - w / 2, c0y + h0 * 0.14 - h / 2, w, h);
      continue;
    }
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

// ---------------- cockpit: window frame, console, gauges, the plane's yoke, Miuu ----------------
let FACE = null;
function gaugeFace() {
  const c = document.createElement("canvas"); c.width = c.height = 168;
  const x = c.getContext("2d"); x.scale(2, 2); x.translate(42, 42);
  x.fillStyle = "rgb(75,58,110)"; x.beginPath(); x.arc(0, 0, 38.5, 0, Math.PI * 2); x.fill();
  x.fillStyle = "rgb(255,248,240)"; x.beginPath(); x.arc(0, 0, 35, 0, Math.PI * 2); x.fill();
  x.strokeStyle = "rgb(75,58,110)"; x.lineWidth = 2; x.beginPath();
  for (let k = 0; k < 9; k++) { const a = ((-225 + k * 33.75) * Math.PI) / 180; x.moveTo(Math.cos(a) * 25, Math.sin(a) * 25); x.lineTo(Math.cos(a) * 31, Math.sin(a) * 31); }
  x.stroke();
  return c;
}
export function drawSkyCockpit(ctx, deg, dy = 0, head = true) {
  if (dy > 2000) return;                       // hidden while the intro clip plays
  if (!FACE) FACE = gaugeFace();
  const k = Math.max(0, 1 - dy / 520);
  ctx.save(); ctx.globalAlpha = k; ctx.drawImage(IMG.s_frame, 0, 0, W, H); ctx.restore();
  ctx.drawImage(IMG.s_console, 0, 780 + dy, W, 190);
  // the yoke's column
  ctx.fillStyle = "rgb(75,58,110)"; ctx.fillRect(242.5, 850 + dy, 55, 120);
  ctx.fillStyle = "rgb(150,130,200)"; ctx.fillRect(247.5, 850 + dy, 45, 120);
  // altitude (pink needle) and speed (blue)
  const needles = [[59, clamp01((gauge.camY + 3500) / 7000), "rgb(250,150,180)"], [481, clamp01(Math.min(1.2, gauge.speed) / 1.3 + gauge.boost * 0.25 + Math.sin(gauge.t * 50) * 0.01), "rgb(130,180,250)"]];
  for (const [gx, v, col] of needles) {
    const gy = 897.5 + dy, a = ((-225 + v * 270) * Math.PI) / 180;
    ctx.drawImage(FACE, gx - 42, gy - 42, 84, 84);
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * 27, gy + Math.sin(a) * 27); ctx.stroke();
    ctx.fillStyle = "rgb(75,58,110)"; ctx.beginPath(); ctx.arc(gx, gy, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save();
  ctx.translate(W / 2, 850 + dy); ctx.rotate((deg * 0.7 * Math.PI) / 180);   // a yoke turns less than a wheel
  ctx.drawImage(IMG.yoke, -225, -210, 450, 350);
  ctx.restore();
  // Miuu in the pilot's seat (back of head = the intro clip's last frame)
  if (head) ctx.drawImage(IMG.s_miuu, 156.84, 824.39, 229.3, 135.5);
}
