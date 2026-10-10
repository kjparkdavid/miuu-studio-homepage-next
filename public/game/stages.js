// The game's stages. Each one bundles a track, a renderer, a cockpit, a thief and its wording,
// so main.js can run the same chase on any of them.
import * as BT from "./track.js";
import { render as renderBurrow, drawWheel, BURROW_KEYS } from "./renderer.js";
import * as OT from "./ocean-track.js";
import { renderOcean, drawOceanCockpit, camYOf, OCEAN_KEYS } from "./ocean-renderer.js";

const burrow = {
  id: "burrow",
  name: "Burrow",
  emoji: "🐿️",
  imageKeys: BURROW_KEYS,
  intro: "img/intro_burrow",
  titleBg: "img/bg_title.png",
  tag: "🐿️ A squirrel ran off with Miuu's diary!",
  tune: {},
  wrap: BT.mod,
  curveAt: BT.curveAt,
  speedAt: BT.speedAt,
  zoneOf: BT.zoneOf,
  zoneTitles: BT.ZONE_TITLES,
  pads: BT.PADS,
  padLen: BT.PAD_LEN,
  buildGameplay: BT.buildGameplay,
  escapeAt: BT.EXIT + 6,       // the thief is gone once it gets this far
  brakeFrom: BT.EXIT,
  stop: BT.P_STOP,
  roadHalf: BT.ROAD_W * 1.14,
  lateral(pos) {
    const tunnel = BT.inside(pos);
    return { limit: Math.min((tunnel ? BT.edgeR(Math.floor(pos)) : 2200) * 0.82, 2000), wall: tunnel };
  },
  pitchTarget(pos) {
    const i = Math.floor(pos);
    return Math.atan(-(BT.floorY(i + 3) - BT.floorY(i)) / (3 * BT.SEG_LEN)) * 0.9;
  },
  cam: { look: 11, yawK: 1.9, leanK: 0.17, leanMax: 12 },
  tired: (thiefPos) => BT.zoneOf(thiefPos) === "warp",   // runs out of steam in the last tunnel
  thief: {
    carry: "sq_diary", empty: "sq_empty",
    motion: (t) => ({ x: 220 * Math.sin(t / 0.77), y: Math.abs(Math.sin(t * Math.PI * 4.2)) * 90 }),
  },
  pickupKind: "pickup",
  text: {
    thief: "squirrel", thiefEmoji: "🐿️", item: "🌰", items: "acorns", where: "at the exit",
    win: "You caught the squirrel. Miuu got his diary back 💜",
    lose: "The squirrel got away with Miuu's diary. Try again?",
  },
  loseImg: "img/squirrel_waving.png",
  render: renderBurrow,
  drawCockpit: drawWheel,
  onReset() {},
  onUpdate() {},
  onBonk() {},
};

const ocean = {
  id: "ocean",
  name: "Ocean",
  emoji: "🐟",
  imageKeys: [...OCEAN_KEYS, "diary"],   // "diary" is the shared pop shown on a catch
  intro: "img/ocean/intro_ocean",
  titleBg: "img/ocean/bg_title.png",
  tag: "🐟 A fish swam off with Miuu's diary!",
  // the sea's sweeps are much tighter than the burrow's, so each unit of curve pushes less
  tune: { centrifugal: 185, squirrelPace: 1.22, squirrelTired: 0.8 },
  wrap: (i) => i,
  curveAt: OT.curveAt,
  speedAt: OT.speedAt,
  zoneOf: OT.zoneOf,
  zoneTitles: OT.ZONE_TITLES,
  pads: OT.PADS,
  padLen: OT.PAD_LEN,
  buildGameplay: OT.buildGameplay,
  escapeAt: OT.ESCAPE,
  brakeFrom: OT.BRAKE_FROM,
  stop: OT.P_STOP,
  roadHalf: OT.RIBBON + 40,
  lateral(pos) {
    if (pos < OT.DOCK_END + 2) return { limit: OT.DOCK_W - 120, wall: false };   // stay on the dock
    const canyon = (pos >= OT.WRECK_END + 1 && pos < OT.WRECK_END + 110) || (pos >= OT.ABYSS_END - 60 && pos < OT.RISE_END - 6);
    return { limit: canyon ? 1900 : 2300, wall: canyon };
  },
  pitchTarget(pos) {
    let tgt = Math.atan(-(OT.pathY(pos + 3) - OT.pathY(pos)) / (3 * OT.SEG_LEN));
    if (pos >= OT.ABYSS_END - 10 && pos <= OT.RISE_END - 4) tgt = Math.min(tgt, -1.32);   // nose straight up for the climb
    return tgt;
  },
  cam: { look: 12.5, yawK: 1.5, leanK: 0.19, leanMax: 17 },
  tired: (thiefPos) => thiefPos >= 800,   // the last big sweep through the abyss
  thief: {
    carry: "fish_diary", empty: "fish_empty",
    // flops along the dock, then swims
    motion(t, thiefPos) {
      const swim = OT.smooth((thiefPos - OT.DOCK_END) / 8);
      const flop = Math.abs(Math.sin(t * Math.PI * 4.2)) * 110;
      return { x: 260 * Math.sin(t / 0.9), y: flop * (1 - swim) + (150 + Math.sin(t * 5) * 50) * swim };
    },
  },
  pickupKind: "o_pickup",
  text: {
    thief: "fish", thiefEmoji: "🐟", item: "⭐", items: "starfish", where: "when it shot up to the surface",
    win: "You caught the fish. Miuu got his diary back 💜",
    lose: "The fish got away with Miuu's diary. Try again?",
  },
  loseImg: "img/ocean/fish_color0.png",
  render(ctx, view) {
    view.camY = camYOf(view.pos, view.t);
    renderOcean(ctx, view);
  },
  drawCockpit: drawOceanCockpit,
  onReset(s) { s.fxT = {}; },
  // remember when the splashes and bubble bursts were triggered
  onUpdate(s, prevPos) {
    const was = camYOf(prevPos, s.t), now = camYOf(s.pos, s.t);
    if (was > 0 && now <= 0) s.fxT.splashIn = s.t;
    if (was <= 0 && now > 0 && s.pos > OT.ABYSS_END) s.fxT.splashOut = s.t;
    if (prevPos < OT.WRECK_END + 1 && s.pos >= OT.WRECK_END + 1) s.fxT.plunge = s.t;
    if (prevPos < OT.ABYSS_END - 9 && s.pos >= OT.ABYSS_END - 9) s.fxT.up = s.t;
  },
  onBonk(s, o) { s.flyers.push({ t: 0, kind: o.kind, side: o.x >= s.camX ? 1 : -1 }); },
};

export const STAGES = { burrow, ocean };
export const STAGE_ORDER = ["burrow", "ocean"];
