/**
 * The full jar's pile, worked out before it is shown, ported from the app's Onboarding V4
 * (secret-note src/components/Onboarding/v4/jarPile.ts): where each sticker comes to rest, and how
 * it falls there. The app's solver decides the pile; each sticker then plays a plain fall to its
 * place, one every 35 ms, so the jar fills bottom up. Tune it in the app first and copy it here.
 */
import { filledJarWorld, type JarWorld } from "@/lib/jarPhysics";

export interface JarBounds {
  width: number;
  height: number;
  radius: number;
}

/** Where a sticker rests: its centre in the jar's own points, and its turn. */
export interface JarPileSpot {
  x: number;
  y: number;
  /** Radians. */
  angle: number;
}

/** The app's onboarding cadence (JarTimeline.ts): first one let go at 450 ms, then every 35 ms. */
export const JAR_FULL_FIRST_STICKER_MS = 450;
export const JAR_FULL_STICKER_EVERY_MS = 35;

export const jarFullStickerTimes = (count: number): number[] =>
  Array.from({ length: Math.max(0, count) }, (_, index) => JAR_FULL_FIRST_STICKER_MS + index * JAR_FULL_STICKER_EVERY_MS);

// A seeded generator (mulberry32), so the pile is the same on every visit: the app's seed
const PILE_SEED = 20261010;
const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

const PILE_HANDFUL = 5;
const PILE_BETWEEN_HANDFULS_MS = 200;

/** Where `count` stickers come to rest, lowest first, so each later one lands on what is there. */
export const settledJarPile = (count: number, bounds: JarBounds, gravity: number): JarPileSpot[] => {
  if (count <= 0 || bounds.width <= 0 || bounds.height <= 0) return [];
  const world = filledJarWorld(count, bounds.width, bounds.height, bounds.radius, gravity, {
    handful: PILE_HANDFUL,
    betweenHandfulsMs: PILE_BETWEEN_HANDFULS_MS,
    random: seededRandom(PILE_SEED),
  });
  const spots: JarPileSpot[] = [];
  for (let body = 0; body < world.count; body += 1) {
    spots.push({
      x: world.xs[body] ?? bounds.radius,
      y: world.ys[body] ?? bounds.radius,
      angle: world.angles[body] ?? 0,
    });
  }
  return spots.sort((a, b) => b.y - a.y);
};

// Each body's weight, spread by place with the golden ratio (the engine's 0.8 to 1.2)
const WEIGHT_BASE = 0.8;
const WEIGHT_SPAN = 0.4;
const GOLDEN = 0.6180339887;
const spread = (place: number): number => (place * GOLDEN) % 1;

/** The played pile as the solver takes it over: every body where it rests, nothing moving. */
export const jarPileWorld = (pile: readonly JarPileSpot[], bounds: JarBounds): JarWorld => {
  const still = () => pile.map(() => 0);
  return {
    count: pile.length,
    radius: bounds.radius,
    width: bounds.width,
    height: bounds.height,
    xs: pile.map((spot) => spot.x),
    ys: pile.map((spot) => spot.y),
    vxs: still(),
    vys: still(),
    angles: pile.map((spot) => spot.angle),
    avs: still(),
    gravityFactors: pile.map((_, place) => WEIGHT_BASE + WEIGHT_SPAN * spread(place)),
  };
};

/** How one sticker falls to its place. */
export interface JarPileFall {
  fromX: number;
  fromY: number;
  durationMs: number;
}

// A fifth of the landing speed back up reads as landing on something soft
const BOUNCE = 0.2;
/** The drop's share of a fall's time; the rest is the lift and the return. */
export const DROP_SHARE = 1 / (1 + 2 * BOUNCE);
const SIDE_DRIFT = 0.5;

/** From just above the rim (the card clips it there), straight down but for a little drift. */
export const jarPileFall = (spot: JarPileSpot, bounds: JarBounds, place: number, gravity: number): JarPileFall => {
  const { radius, width } = bounds;
  const fromY = -radius;
  const drop = Math.max(0, spot.y - fromY);
  const weight = WEIGHT_BASE + WEIGHT_SPAN * spread(place);
  const dropMs = Math.sqrt((2 * drop) / (gravity * weight)) * 1000;

  const side = place % 2 === 0 ? 1 : -1;
  const lean = side * (0.4 + 0.6 * spread(place + 1));
  const fromX = Math.min(width - radius, Math.max(radius, spot.x + lean * SIDE_DRIFT * radius));

  return { fromX, fromY, durationMs: Math.round(dropMs / DROP_SHARE) };
};

/** 0 at the rim, 1 at rest: speeds up all the way down, lifts once a little and comes back. */
export const jarPileFallEasing = (time: number): number => {
  if (time <= 0) return 0;
  if (time >= 1) return 1;
  if (time < DROP_SHARE) {
    const fallen = time / DROP_SHARE;
    return fallen * fallen;
  }
  const lifted = (time - DROP_SHARE) / (1 - DROP_SHARE);
  return 1 - BOUNCE * BOUNCE * 4 * lifted * (1 - lifted);
};
