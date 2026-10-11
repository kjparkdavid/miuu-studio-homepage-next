// The game's stages. Each one bundles a track, a renderer, a cockpit, a thief and its wording,
// so main.js can run the same chase on any of them.
import { sfx } from "./sfx.js";
import * as BT from "./track.js";
import { render as renderBurrow, drawWheel, BURROW_KEYS } from "./renderer.js";
import * as OT from "./ocean-track.js";
import { renderOcean, drawOceanCockpit, camYOf, OCEAN_KEYS } from "./ocean-renderer.js";
import * as KT from "./sky-track.js";
import { renderSky, drawSkyCockpit, camYOf as skyCamYOf, SKY_KEYS, FLY_TIME } from "./sky-renderer.js";

const burrow = {
  id: "burrow",
  name: "Burrow",
  emoji: "🐿️",
  stars: 2,
  imageKeys: BURROW_KEYS,
  intro: "img/intro_burrow",
  titleBg: "img/bg_title.png",
  music: { src: "audio/burrow.mp3", vol: 0.3 },      // vol evens out how loud the two tracks are mastered
  tag: "🐿️ A squirrel ran off with Miuu's diary!",
  // The easy stage. Balanced with the human-like test player (bot 4): a first-timer catches the squirrel
  // about half the time (55%), an average gamer almost always (99%). Re-run the simulation before
  // changing these, and keep the leaderboard's limits (game-backend rules.js) under the perfect bot's time.
  tune: { squirrelPace: 1.14, squirrelTired: 0.6, squirrelRubber: 0.36 },
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
    thief: "squirrel", thiefEmoji: "🐿️", item: "🌰", items: "acorns", bumps: "bonks", where: "at the exit",
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
  stars: 3,
  imageKeys: [...OCEAN_KEYS, "diary", "sign_miuu"],   // shared with the burrow: the catch pop and the app billboard
  intro: "img/ocean/intro_ocean",
  titleBg: "img/ocean/bg_title.png",
  music: { src: "audio/ocean.mp3", vol: 0.36 },
  tag: "🐟 A fish swam off with Miuu's diary!",
  // the sea's sweeps are much tighter than the burrow's, so each unit of curve pushes less
  // The medium stage (bot 4): a first-timer catches the fish ~10% of the time, an average gamer ~92%,
  // a practised one ~99%. The old, harder tune (pace 1.2, rubber 0.26: 2% / 70% / 95%) is roughly
  // where a hard third stage would sit.
  tune: { centrifugal: 185, squirrelPace: 1.17, squirrelTired: 0.74, squirrelRubber: 0.38 },
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
    thief: "fish", thiefEmoji: "🐟", item: "⭐", items: "starfish", bumps: "bonks", where: "when it shot up to the surface",
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

const sky = {
  id: "sky",
  name: "Sky",
  emoji: "🌈",
  stars: 1,
  imageKeys: [...SKY_KEYS, "tree_p", "tree_g", "tree_o", "diary", "sign_miuu"],   // shared with the burrow: the meadow's trees, the catch pop, the app billboard
  intro: "img/sky/intro_sky",
  titleBg: "img/sky/bg_title.png",
  music: { src: "audio/menu.mp3", vol: 0.8 },   // no track of its own yet: the menu's plays on (same level as MENU_MUSIC in main.js)
  tag: "🐦 A crow flew off with Miuu's diary!",
  // The bonus stage, made so that most people win it on their first try. The first-try rate measured on
  // the live game in its first days (Oct 2026) was about 1 in 7 on the burrow, far under what the
  // human-like test player (bot 4) had predicted, so this one is balanced against clumsier test players
  // whose burrow rates bracket that figure: "new" (27% there: delay .35, gain 900, noise .3, look 10,
  // ff .6, lapse .25, dodge .6, pad .5, collect .6, boostDelay 3, boostNever .3), "clumsy" (4%: .45, 1200,
  // .45, 8, .4, .4, .4, .3, .4, 4, .5) and "lost" (0%: .55, 1500, .6, 6, .2, .5, .3, .2, .3, 5, .7).
  // Here they catch the crow 100%, 99% and 90% of the time; someone who never steers does not.
  // Re-run the simulation before changing these, and keep the leaderboard's limits (game-backend
  // rules.js) under the racing-line bot's time (18.4 s).
  tune: { centrifugal: 120, offroadMult: 0.7, squirrelPace: 1.12, squirrelTired: 0.55, squirrelRubber: 0.3 },
  softHits: true,              // a bird you hit is sent flying; you lose nothing
  // How hard the crow flies (x squirrelPace). It darts ahead whenever you get close, so nobody catches
  // it before the storm and everyone sees the whole sky; deep in the storm it tires for good.
  pace(pos, gap, T) {
    const tired = KT.smooth((pos - KT.TIRED_FROM) / 25);
    const dart = 1 + 0.6 * KT.smooth((10 - gap) / 6);
    return (1 - tired) * dart + tired * T.squirrelTired;
  },
  wrap: (i) => i,
  curveAt: KT.curveAt,
  speedAt: KT.speedAt,
  zoneOf: KT.zoneOf,
  zoneTitles: KT.ZONE_TITLES,
  pads: KT.PADS,
  padLen: KT.PAD_LEN,
  buildGameplay: KT.buildGameplay,
  escapeAt: KT.ESCAPE,
  brakeFrom: KT.BRAKE_FROM,
  stop: KT.P_STOP,
  roadHalf: KT.ROAD + 40,
  lateral: () => ({ limit: 1300, wall: false }),   // open air either side: nothing to scrape along
  pitchTarget(pos) {
    let tgt = Math.atan(-(KT.pathY(pos + 3) - KT.pathY(pos)) / (3 * KT.SEG_LEN));
    if (pos >= KT.STORM_END - 10 && pos <= KT.RISE_END - 4) tgt = Math.min(tgt, -1.32);     // nose straight up for the climb out
    if (pos >= KT.ISLAND_END - 1 && pos <= KT.ISLAND_END + 23) tgt = Math.min(tgt, -0.95);  // and steeply up at take-off
    return tgt;
  },
  cam: { look: 12.5, yawK: 1.5, leanK: 0.19, leanMax: 17 },
  thief: {
    carry: ["crow_diary_u", "crow_diary_d"], empty: ["crow_empty_u", "crow_empty_d"],   // two pictures each: a wing beat
    motion: (t) => ({ x: 240 * Math.sin(t / 0.85), y: 160 + Math.sin(t * 5) * 55 }),
  },
  pickupKind: "it_star",
  text: {
    thief: "crow", thiefEmoji: "🐦", item: "🌟", items: "stars", bumps: "birds sent flying", where: "when it burst out above the clouds",
    win: "You caught the crow. Miuu got his diary back 💜",
    lose: "The crow got away with Miuu's diary. Try again?",
  },
  loseImg: "img/sky/crow.png",
  render(ctx, view) {
    view.camY = skyCamYOf(view.pos, view.t);
    renderSky(ctx, view);
  },
  drawCockpit: drawSkyCockpit,
  onReset(s) { s.fxT = {}; },
  // remember when the cloud bursts and the lightning were triggered
  onUpdate(s, prevPos) {
    const was = skyCamYOf(prevPos, s.t), now = skyCamYOf(s.pos, s.t);
    const crossed = (p) => prevPos < p && s.pos >= p;
    if (crossed(KT.ISLAND_END + 3)) s.fxT.takeoff = s.t;
    if (was <= 0 && now > 0) s.fxT[s.pos > KT.STORM_END ? "punchOut" : "out"] = s.t;
    if (crossed(KT.CASTLE_END + 1)) s.fxT.drop = s.t;
    if (was > 0 && now <= 0) s.fxT.punchIn = s.t;
    if (crossed(KT.STORM_END - 9)) s.fxT.up = s.t;
    KT.LIGHTNING.forEach((p, j) => { if (crossed(p)) { s.fxT["bolt" + j] = s.t; sfx.thunder(); } });
  },
  // which way it spins is a coin toss; how far off-centre it starts is where it sat across the road
  onBonk(s, o) { s.flyers.push({ t: 0, dur: FLY_TIME, kind: o.kind, dx: Math.max(-135, Math.min(135, (o.x - s.camX) * 0.42)), spin: (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.4) }); },
};

export const STAGES = { sky, burrow, ocean };
// The order they are offered in, easiest first; the first one is what a new visitor lands on.
export const STAGE_ORDER = ["sky", "burrow", "ocean"];
