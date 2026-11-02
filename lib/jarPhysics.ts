// Ported as-is from the Miuu Note app (secret-note: src/components/Notes/StickerJar/jarPhysicsCore.ts)
// so the site's jar tumbles, hops and stirs exactly like the one in the app. Keep the two in step:
// tune the app's file first, then copy it here (minus the Reanimated 'worklet' directives).

/**
 * Sticker Jar Physics Core
 *
 * A hand-rolled 2D impulse solver for a handful of circular bodies tumbling
 * inside a rectangular container under a gravity vector driven by device
 * tilt (and stirred into a liquid by a shake, see JarLiquid). Deliberately simple (no spatial hashing, no rotational inertia
 * matrix) since this is a decorative toy with ~40 bodies max, not a
 * simulation — O(n^2) pair checks are cheap at this scale.
 *
 * This module has NO reanimated import so it stays a plain, synchronous,
 * Jest-testable function. 'worklet' directives are added at call sites in
 * useJarPhysics.ts (they're no-ops here, but required so Reanimated's
 * babel plugin can run this code on the UI thread when called from a
 * frame callback).
 */

export interface JarWorld {
  count: number;
  radius: number;
  width: number;
  height: number;
  xs: number[];
  ys: number[];
  vxs: number[];
  vys: number[];
  angles: number[];
  avs: number[];
  // Per-body gravity multiplier (~0.8-1.2). With identical acceleration every
  // body moves in lockstep during a fall or tilt — zero relative velocity, so
  // stickers almost never collide mid-motion. Slightly different "weights"
  // make them converge/diverge while moving, which is where all the visible
  // tumbling and bumping comes from.
  gravityFactors: number[];
}

const MAX_DT = 1 / 30; // clamp so a stalled frame doesn't launch bodies through walls
const LINEAR_DAMPING = 0.3; // per second
// Tangential-slip spin (below) has no counterpart to linear damping, so
// without this, resting contacts that repeatedly nudge velAlongNormal
// negative (gravity re-feeding a touching pair every frame) keep injecting
// rotation with nothing to bleed it off — spin accumulates forever instead
// of settling, making piled stickers visibly over-spin.
const ANGULAR_DAMPING = 4; // per second
// Hard ceiling on |angular velocity| (rad/s). Spin is injected per contact
// per frame, so a body grinding through a dense pile can accumulate spin
// from many contacts at once — damping alone bounds the steady state far
// too high (tens of rev/s). The cap keeps even worst-case pile-grinding at
// "playful wobble" speed rather than "fan blade".
const MAX_ANGULAR_SPEED = 4;
const WALL_RESTITUTION = 0.35;
// Wall friction and spin injection are applied on the FIRST solver
// iteration only: they model per-frame energy exchange, not per-contact
// positional convergence, and the extra iterations exist purely so
// positional corrections propagate through a stack. Applying friction in
// every iteration multiplied it up to 16x per frame for bodies under pile
// pressure (0.9^16 ≈ 0.19 of slide velocity left PER FRAME), which froze
// tilted piles nearly solid; same mechanism injected spin up to 16x per
// frame, which is where the frantic over-spin came from.
const WALL_FRICTION = 0.9;
// Sticker-vs-sticker bounciness is count-aware: a sparse jar wants lively,
// distinct collisions (bodies knocking each other around is most of the
// action with only a few stickers), but the same restitution in a dense
// pile keeps re-injecting energy into a mass of permanent contacts and the
// jar never stops simmering. Lerp from SPARSE at <=BOUNCY bodies down to
// DENSE at >=CROWDED.
const PAIR_RESTITUTION_SPARSE = 0.4;
const PAIR_RESTITUTION_DENSE = 0.12;
const PAIR_BOUNCY_COUNT = 12;
const PAIR_CROWDED_COUNT = 28;
const PAIR_FRICTION = 0.85;
const POSITION_SLOP = 0.8; // fraction of overlap resolved per iteration (avoids jitter)
// A single Jacobi-style collision pass doesn't converge for a densely
// stacked pile (many simultaneous contacts fighting over the same bit of
// space). Re-running the wall+pair resolution several times per frame,
// without re-integrating gravity, lets contact forces propagate through
// the stack so it actually comes to rest instead of jittering forever.
// A Jacobi solver needs roughly one iteration per layer of a stack for a
// correction to propagate from the bottom to the top — with ~40 bodies at
// this radius a jar can be several layers deep, so 4 iterations was too
// few and left a permanent residual "buzz"; 16 comfortably covers it.
const SOLVER_ITERATIONS = 16;
// Below this relative impact speed (px/s), treat a collision as resting
// contact rather than a bounce (restitution 0) — otherwise gravity keeps
// re-feeding the same small impact speed back in every frame and
// restitution keeps giving an equal-and-opposite kick out, so the pile
// never stops "buzzing" (a classic resting-contact/restitution limit cycle).
// Must comfortably exceed the per-frame gravity feed (|g| * dt ≈ 21 px/s at
// GRAVITY_SCALE 130, 60fps): a dense pile's contacts see roughly that much
// re-fed approach speed every frame, and if it crosses this threshold they
// count as fresh impacts — restitution and spin injection then never stop.
// It also has to clear dense-pile CHAIN chatter (a wedged body snapping
// free and knocking a neighbor), which reaches ~50-60 px/s: with the walls
// as bouncy as they now are, anything below that sustains a visible buzz
// limit cycle. Real events stay well clear: a new sticker lands at ~500
// px/s and a full-tilt pour hits walls at 200+ px/s, so those still bounce.
// If GRAVITY_SCALE (useJarPhysics.ts) goes up, this must scale with it.
const RESTING_SPEED_THRESHOLD = 70;
// Per-body gravity multiplier range: GRAVITY_FACTOR_BASE +- half the span
// (see JarWorld.gravityFactors). +-20% is enough relative motion to keep a
// pour lively without light bodies visibly "hanging" during a plain fall.
const GRAVITY_FACTOR_BASE = 0.8;
const GRAVITY_FACTOR_SPAN = 0.4;
// Tap-poke kick (px/s). The upward component must comfortably exceed
// RESTING_SPEED_THRESHOLD (70) or the resulting wall/pair hits count as
// resting contact (restitution 0) and the "jump" reads as a limp hop.
// Mid-range (~500) is the launch speed that reaches the top of the shipped
// 120px jar from its floor under app gravity (sqrt(2 * 1274 * ~100)), so a
// poked sticker pops to around the lid, shoving neighbors aside on the way.
// Sideways stays small relative to the kick: this is "that sticker jumped",
// not "that sticker flew off" — the randomness is just enough that mashing
// the same sticker doesn't replay an identical arc every time.
const POKE_KICK_MIN = 380;
const POKE_KICK_MAX = 640;
const POKE_SIDE_MAX = 120;
// The shaken jar as a liquid (#1170). A shake doesn't throw the stickers,
// it stirs the jar: `stir` (0-1, set and faded by useJarPhysics) turns the
// dry pile into a snow globe for a couple of seconds. Every term below is
// scaled by stir, so at 0 the step is exactly the dry solver above — tilt
// and tap never see any of this.
// Fraction of gravity the liquid cancels at full stir: stickers hang in it.
const LIQUID_BUOYANCY = 0.95;
// Extra drag (per second) at full stir, on top of LINEAR_DAMPING. What makes
// it read as liquid rather than space: motion is slow and fades out.
const LIQUID_DRAG = 2.2;
// The whirl (px/s^2 at the jar's edge, full stir): a slow eddy shaped to the
// jar that churns the pile, top drifting one way, bottom the other, so the
// stickers trade places and tumble. This is what reads as liquid: the jar is
// sized so its stickers cover ~62% of it (jarRadiusFor), which leaves no
// room to "float" — measured headless, per-body wander alone left a stirred
// pile jammed at ~13 px/s. Circulation moves a packed pile anyway.
const LIQUID_WHIRL = 500;
// How fast the whirl's direction swings (rad/s), timed from when the stir
// began: one strong eddy per shake that turns over as the stir fades, rather
// than a conveyor belt. Timed from the stir, not a free-running clock, or a
// shake could land on the swing's zero and churn nothing.
const LIQUID_WHIRL_SWING = 0.4;
// Per-body wander (px/s^2) on top, so the churn isn't perfectly smooth.
const LIQUID_SWIRL = 650;
// Slow tumbling (rad/s) each sticker eases toward while suspended.
const LIQUID_SPIN = 1.6;
// How much of the bounce the liquid absorbs at full stir.
const LIQUID_SOFTEN = 0.8;
// How far stickers may pass over each other at full stir, as a fraction of
// their diameter. A liquid jar is 3D: suspended pieces drift in front of and
// behind one another. Without this a packed jar has no room to move at all
// (measured headless: a stirred pile stayed jammed at ~35 px/s). As the
// stir fades the full collision distance returns gradually, so the
// stickers ease apart into a pile instead of popping.
const LIQUID_PASS_THROUGH = 0.25;
// Golden angle: spreads the bodies' wander phases evenly.
const PHASE_STEP = 2.39996;

/** The stirred-liquid state for one step. Absent, or stir 0, is the dry jar. */
export interface JarLiquid {
  /** 0 = dry pile, 1 = fully stirred. */
  stir: number;
  /** The phone's motion as a force on the stickers, px/s^2, screen coords
   * (+y down). Applied scaled by stir. */
  sloshX: number;
  sloshY: number;
  /** Seconds since this stir began — drives the whirl and the wander. */
  timeSec: number;
}

export interface JarRadiusLimits {
  min: number;
  max: number;
  /** Quantization step — the radius only changes at step boundaries. */
  step: number;
}

// Target total body area ≈ 62% of the container's area, in both directions:
// - Shrink when full: above ~85% packing the pile is permanently jammed —
//   it can neither settle (the sleep gate never engages, so the frame
//   callback steps physics forever) nor respond to tilt. At a fixed radius
//   18, a full 120px jar (40 bodies) was at 94% packing and read as
//   "stickers frozen solid". No solver tuning fixes an overfull container.
// - Grow when sparse: a handful of small stickers in a mostly empty
//   container barely interact — big bodies keep a light pile visually busy
//   (they collide constantly and a full tilt reads as a dramatic tumble).
const JAR_PACKING_FRACTION = 0.62;

/**
 * Density-aware body radius for a container of the given size, quantized to
 * `limits.step` so it only changes when the count crosses a step boundary —
 * the physics world resets (and the pile re-tumbles) whenever bounds change,
 * which is fine as an occasional "it got fuller" moment but would be
 * obnoxious on every new body. Shared by the Journals sticker jar and the
 * Collection's featured pack shelf, which differ only in size and limits.
 */
export const jarRadiusFor = (
  count: number,
  width: number,
  height: number,
  limits: JarRadiusLimits
): number => {
  if (count === 0 || width <= 0 || height <= 0) return limits.max;
  const ideal = Math.sqrt((JAR_PACKING_FRACTION * width * height) / (Math.PI * count));
  const stepped = Math.floor(ideal / limits.step) * limits.step;
  return Math.max(limits.min, Math.min(limits.max, stepped));
};

/**
 * A world with each per-body array passed through `each` (a copy, a
 * reversal): the one list of them, so a field added to `JarWorld` is never
 * left out of a copy. Only `JarWorld`'s own fields come out.
 */
export const mapJarWorldBodies = (world: JarWorld, each: (values: number[]) => number[]): JarWorld => ({
  count: world.count,
  radius: world.radius,
  width: world.width,
  height: world.height,
  xs: each(world.xs),
  ys: each(world.ys),
  vxs: each(world.vxs),
  vys: each(world.vys),
  angles: each(world.angles),
  avs: each(world.avs),
  // `?? []` tolerates a world from before gravityFactors existed (the solver
  // reads a missing factor as 1).
  gravityFactors: each(world.gravityFactors ?? []),
});

export const createJarWorld = (
  count: number,
  width: number,
  height: number,
  radius: number
): JarWorld => {
  const xs: number[] = [];
  const ys: number[] = [];
  const vxs: number[] = [];
  const vys: number[] = [];
  const angles: number[] = [];
  const avs: number[] = [];
  const gravityFactors: number[] = [];

  // Seed roughly in a grid above the jar bottom so initial overlaps are minimal.
  // Row y is clamped to the jar's own height: if there are more rows than fit
  // (a short jar, or a body count near STICKER_JAR_MAX_BODIES), the excess
  // rows stack on the last valid row instead of seeding below maxY — an
  // unclamped seed briefly renders outside the container's overflow:hidden
  // bounds (invisible) until the next physics step's wall clamp pulls it
  // back in, which reads as stickers "falling off screen" on mount.
  const cols = Math.max(1, Math.floor(width / (radius * 2.2)));
  const maxRowY = Math.max(radius, height - radius);
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Small deterministic per-index jitter: rows clamped onto maxRowY would
    // otherwise coincide exactly (same x AND y), and exactly-coincident or
    // exactly-level bodies are degenerate for the solver — a zero distance
    // is skipped entirely, and an exactly-horizontal normal can never
    // resolve bodies into separate layers.
    const jitter = (i % 5) * 0.31 * radius;
    xs.push(radius + col * radius * 2.1 + (radius * 0.1));
    ys.push(Math.max(radius, Math.min(radius + row * radius * 2.1, maxRowY) - jitter));
    vxs.push(0);
    vys.push(0);
    angles.push(0);
    avs.push(0);
    // Deterministic (index-derived) so this function stays reproducible in
    // tests; reconcileJarWorld randomizes for organically spawned bodies.
    gravityFactors.push(GRAVITY_FACTOR_BASE + ((i % 5) / 4) * GRAVITY_FACTOR_SPAN);
  }

  return { count, radius, width, height, xs, ys, vxs, vys, angles, avs, gravityFactors };
};

/**
 * Syncs a world's container dimensions to the current layout bounds in place,
 * clamping every body into the new bounds. Called from the UI-thread frame
 * callback before each step: the JS-side world rebuild in useJarPhysics can
 * lose the race against a concurrently-stepping frame callback (and a JS-thread
 * read of a shared value right after a JS-thread write can return the stale
 * world), leaving a world whose height no longer matches the rendered jar —
 * bodies then settle below the view's overflow:hidden clip and "fall out of
 * the jar". Syncing dims at step time makes any such stale world self-heal on
 * the next frame.
 */
export const syncJarWorldBounds = (
  world: JarWorld,
  width: number,
  height: number,
  radius: number
): void => {
  if (world.width === width && world.height === height && world.radius === radius) return;
  world.width = width;
  world.height = height;
  world.radius = radius;

  const minC = radius;
  const maxX = width - radius;
  const maxY = height - radius;
  const { count, xs, ys } = world;
  for (let i = 0; i < count; i++) {
    if (xs[i]! < minC) xs[i] = minC;
    else if (xs[i]! > maxX) xs[i] = maxX;
    if (ys[i]! < minC) ys[i] = minC;
    else if (ys[i]! > maxY) ys[i] = maxY;
  }
};

/**
 * Rebuilds a world to match `nextIds`, carrying over position/velocity for
 * any id present in both `prevIds` and `nextIds` (matched by id, not array
 * index — order may change), and spawning a fresh body near the jar's top
 * edge for any id that's new. This is what makes writing a new note look
 * like a sticker dropping into an already-settled pile, instead of the
 * whole jar resetting and re-falling every time the body count changes.
 *
 * Bodies whose id disappears from `nextIds` (note deleted, or aged out of
 * the current-month window) are simply dropped.
 *
 * `random` is where a new body's place and weight come from. A caller that
 * needs the same world every time (filledJarWorld) passes its own.
 */
export const reconcileJarWorld = (
  prevWorld: JarWorld,
  prevIds: number[],
  nextIds: number[],
  random: () => number = Math.random
): JarWorld => {
  const { width, height, radius } = prevWorld;
  const prevIndexById = new Map<number, number>();
  prevIds.forEach((id, index) => prevIndexById.set(id, index));

  const xs: number[] = [];
  const ys: number[] = [];
  const vxs: number[] = [];
  const vys: number[] = [];
  const angles: number[] = [];
  const avs: number[] = [];
  const gravityFactors: number[] = [];

  // New bodies spawn in a band near the top of the jar (not literally above
  // it — the wall clamp would immediately snap them back down to y=radius,
  // so there's nothing to gain from spawning out of bounds) and fall into
  // the existing pile under gravity on the very next few frames.
  //
  // The band must have real vertical extent (>= ~2 radii): in a short jar,
  // `height * 0.15` collapses below one radius and every body spawns at
  // exactly y = radius. Bodies with IDENTICAL y have exactly horizontal
  // pair normals, so no collision response can ever push one above another
  // — a simultaneous spawn (cold mount of a month's notes) then settles as
  // a single wall-to-wall row of overlapped stickers that is mechanically
  // jammed: it can't layer, so it can't slide under tilt at all.
  const topBandHeight = Math.max(radius * 3, height * 0.15);
  const spawnSpanX = Math.max(0, width - radius * 2);
  const spawnSpanY = Math.min(Math.max(radius * 2, topBandHeight - radius), Math.max(0, height - radius * 2));

  nextIds.forEach((id) => {
    const prevIndex = prevIndexById.get(id);
    if (prevIndex !== undefined) {
      xs.push(prevWorld.xs[prevIndex]!);
      ys.push(prevWorld.ys[prevIndex]!);
      vxs.push(prevWorld.vxs[prevIndex]!);
      vys.push(prevWorld.vys[prevIndex]!);
      angles.push(prevWorld.angles[prevIndex]!);
      avs.push(prevWorld.avs[prevIndex]!);
      // `?? 1` tolerates a world snapshot from before gravityFactors existed
      // (e.g. a seed preserved across a dev fast-refresh).
      gravityFactors.push(prevWorld.gravityFactors?.[prevIndex] ?? 1);
    } else {
      xs.push(radius + random() * spawnSpanX);
      ys.push(radius + random() * spawnSpanY);
      vxs.push(0);
      vys.push(0);
      angles.push(0);
      avs.push(0);
      gravityFactors.push(GRAVITY_FACTOR_BASE + random() * GRAVITY_FACTOR_SPAN);
    }
  });

  return {
    count: nextIds.length,
    radius,
    width,
    height,
    xs,
    ys,
    vxs,
    vys,
    angles,
    avs,
    gravityFactors,
  };
};

// ─── Landings (spec #2041 §6) ─────────────────────────────────────────────────
//
// A jar style plays a small effect when a sticker that has just joined the jar
// meets the floor or the pile. Measured on what the eye sees (each body's
// displacement per step, as the settle metric is), not on velocity, which a
// wedged body holds as a phantom.
// - After a fall: its speed along gravity reached LANDING_FALL_SPEED, then
//   dropped to a quarter of the fastest it went. In free fall that speed only
//   grows (the linear damping takes ~0.5% a frame), so only a contact can cut
//   it so much. A new sticker spawns in the top band and meets the pile at
//   ~200-500 px/s.
// - Without one: in a full month the top band is already pile, so a new
//   sticker can spawn into it and be squeezed into place rather than fall.
//   It lands when it first comes to rest, LANDING_REST_STEPS in at the
//   earliest (by then a sticker that is falling is past the fall speed).
// Bodies a host was handed (a cold mount, a seed, the pile after a bounds
// change) are never watched, so they never land.
const LANDING_FALL_SPEED = 60; // px/s, ~4 frames of free fall from rest
const LANDING_DROP = 0.25;
const LANDING_REST_STEPS = 8;
const LANDING_REST_SPEED = 20; // px/s
// A watched body that has neither landed nor come to rest after this many
// steps (3 s at 60 fps) is let go: no effect rather than a late one.
const LANDING_WATCH_STEPS = 180;

/**
 * Which bodies of a world are waiting to land, index-aligned with it.
 * Mutated in place by stepJarLandings.
 */
export interface JarLandingWatch {
  /** The fastest each body has moved along gravity so far (px/s); -1 = not watched. */
  peaks: number[];
  /** Steps each body has been watched for. */
  steps: number[];
  /** Where each body was after the last step (NaN until the first). */
  xs: number[];
  ys: number[];
  /** How many bodies are watched: 0 = nothing to do this step. */
  watching: number;
}

/**
 * The watch for a world just reconciled from `prevIds` to `nextIds` (same
 * order as reconcileJarWorld). A body carried over keeps its entry in
 * `prevWatch` (index-aligned with `prevIds`): one still falling is still
 * watched, one that landed is not watched again. A genuinely new id is
 * watched only when `watchNew`: the host says false for a world it was not
 * watching drop in (the first fill of a mount, a fresh bounds key).
 */
export const jarLandingWatchFor = (
  prevIds: number[],
  nextIds: number[],
  prevWatch: JarLandingWatch | null | undefined,
  watchNew: boolean
): JarLandingWatch => {
  const prevIndexById = new Map<number, number>();
  prevIds.forEach((id, index) => prevIndexById.set(id, index));
  const peaks: number[] = [];
  const steps: number[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  let watching = 0;
  nextIds.forEach((id) => {
    const prevIndex = prevIndexById.get(id);
    let peak = -1;
    let step = 0;
    let x = NaN;
    let y = NaN;
    if (prevIndex !== undefined) {
      peak = prevWatch?.peaks[prevIndex] ?? -1;
      step = prevWatch?.steps[prevIndex] ?? 0;
      x = prevWatch?.xs[prevIndex] ?? NaN;
      y = prevWatch?.ys[prevIndex] ?? NaN;
    } else if (watchNew) {
      peak = 0;
    }
    if (peak >= 0) watching += 1;
    peaks.push(peak);
    steps.push(step);
    xs.push(x);
    ys.push(y);
  });
  return { peaks, steps, xs, ys, watching };
};

/**
 * Called after each stepJarPhysics with the same gravity and dt: the index of
 * a watched body that met the floor or the pile in this step (or came to rest
 * without falling), or -1. That body is no longer watched, so it lands once.
 * When two land in the same step, the second is reported on the next (it is
 * still resting, its peak still high). Mutates `watch` in place.
 */
export const stepJarLandings = (
  world: JarWorld,
  watch: JarLandingWatch,
  gx: number,
  gy: number,
  dtInput: number
): number => {
  if (watch.watching <= 0) return -1;
  // The same clamp stepJarPhysics moved the bodies by.
  const dt = Math.min(dtInput, MAX_DT);
  const invDt = dt > 0 ? 1 / dt : 0;
  const { xs, ys } = world;
  const { peaks, steps } = watch;
  const g = Math.sqrt(gx * gx + gy * gy);
  // No pull at all: "down" is the screen's.
  const ux = g > 0 ? gx / g : 0;
  const uy = g > 0 ? gy / g : 1;
  const count = Math.min(world.count, peaks.length);
  let landed = -1;
  for (let i = 0; i < count; i++) {
    const peak = peaks[i]!;
    if (peak < 0) continue;
    const x = xs[i]!;
    const y = ys[i]!;
    const lastX = watch.xs[i]!;
    const lastY = watch.ys[i]!;
    if (landed !== -1) {
      // Reported next step; its motion is measured from here.
      watch.xs[i] = x;
      watch.ys[i] = y;
      continue;
    }
    watch.xs[i] = x;
    watch.ys[i] = y;
    steps[i] = steps[i]! + 1;
    // First sight: nothing to measure against yet.
    if (!Number.isFinite(lastX) || !Number.isFinite(lastY)) continue;
    const dx = x - lastX;
    const dy = y - lastY;
    const along = (dx * ux + dy * uy) * invDt;
    const fell = peak >= LANDING_FALL_SPEED;
    const metSomething = fell && along <= peak * LANDING_DROP;
    const cameToRest =
      !fell && steps[i]! >= LANDING_REST_STEPS && Math.sqrt(dx * dx + dy * dy) * invDt < LANDING_REST_SPEED;
    if (metSomething || cameToRest) {
      landed = i;
      peaks[i] = -1;
      watch.watching -= 1;
    } else if (steps[i]! > LANDING_WATCH_STEPS) {
      peaks[i] = -1;
      watch.watching -= 1;
    } else if (along > peak) {
      peaks[i] = along;
    }
  }
  return landed;
};

/**
 * Finds the body under a tap point, or -1 if the tap missed. Hit radius per
 * body is max(world.radius, minHitRadius): the density-aware body radius
 * bottoms out at 12px (a 24px target — too small for a finger), so callers
 * pass a floor that pads small stickers up to a comfortable touch target.
 * When several padded circles contain the point (dense pile), the nearest
 * center wins — the sticker the user most plausibly aimed at.
 */
export const findJarBodyAt = (
  world: JarWorld,
  x: number,
  y: number,
  minHitRadius: number
): number => {
  const { count, radius, xs, ys } = world;
  const hitRadius = Math.max(radius, minHitRadius);
  const hitRadiusSq = hitRadius * hitRadius;
  let best = -1;
  let bestDistSq = Infinity;
  for (let i = 0; i < count; i++) {
    const dx = xs[i]! - x;
    const dy = ys[i]! - y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= hitRadiusSq && distSq < bestDistSq) {
      best = i;
      bestDistSq = distSq;
    }
  }
  return best;
};

/**
 * Kicks a single body with a randomized upward hop and fresh spin (the
 * tap-a-sticker interaction). Mutates velocities only — the position is
 * untouched, so a poke can never teleport the body out of bounds; the next
 * stepJarPhysics calls resolve the jump (and any neighbors it shoves)
 * normally. The caller owns waking the solver (clearing the sleep gate /
 * reactivating the frame callback). Out-of-range index is a no-op.
 *
 * `random` is injectable for deterministic tests; call sites pass nothing
 * and get Math.random. Called three times: side, kick, spin.
 */
export const pokeJarBody = (
  world: JarWorld,
  index: number,
  random: () => number = Math.random
): void => {
  const { count, vxs, vys, avs } = world;
  if (index < 0 || index >= count) return;
  vxs[index] = vxs[index]! + (random() * 2 - 1) * POKE_SIDE_MAX;
  // Screen-space +y is down, so an upward hop is negative.
  vys[index] = vys[index]! - (POKE_KICK_MIN + random() * (POKE_KICK_MAX - POKE_KICK_MIN));
  avs[index] = (random() * 2 - 1) * MAX_ANGULAR_SPEED;
};

/**
 * Advances the world by dt seconds under gravity (gx, gy) in px/s^2.
 * Mutates the world's arrays in place. Returns the max VISIBLE body speed
 * in px/s — net positional displacement over the step, plus rim speed
 * (|av|*radius) for rotation — used by the caller to decide whether the
 * simulation has settled. Deliberately not internal velocity: a body wedged
 * between the pile and a wall holds a persistent phantom velocity (gravity
 * re-feeds it every frame while positional corrections, which don't touch
 * velocity, cancel the actual motion), so a velocity-based metric never
 * drops below any reasonable sleep threshold for a dense pile even though
 * nothing on screen is moving.
 *
 * `liquid` stirs the jar after a shake (see JarLiquid and the LIQUID_*
 * constants); omit it for the dry jar.
 */
export const stepJarPhysics = (
  world: JarWorld,
  gx: number,
  gy: number,
  dtInput: number,
  liquid?: JarLiquid
): number => {
  const dt = Math.min(dtInput, MAX_DT);
  const { count, radius, width, height, xs, ys, vxs, vys, angles, avs, gravityFactors } = world;
  const rawStir = liquid?.stir ?? 0;
  // A NaN stir would poison every body through the drag term below.
  const stir = !(rawStir > 0) ? 0 : rawStir > 1 ? 1 : rawStir;
  const sloshX = stir > 0 && Number.isFinite(liquid!.sloshX) ? liquid!.sloshX * stir : 0;
  const sloshY = stir > 0 && Number.isFinite(liquid!.sloshY) ? liquid!.sloshY * stir : 0;
  const t = liquid?.timeSec ?? 0;
  const gravityScale = 1 - LIQUID_BUOYANCY * stir;
  const swirl = LIQUID_SWIRL * stir;
  const whirl = stir > 0 ? LIQUID_WHIRL * stir * Math.cos(t * LIQUID_WHIRL_SWING) : 0;
  const cx = width / 2;
  const cy = height / 2;
  // Normalising by the half-extents makes the eddy an ellipse that fits the
  // jar instead of a circle that only fits its middle.
  const halfW = width > 0 ? width / 2 : 1;
  const halfH = height > 0 ? height / 2 : 1;
  const soften = 1 - LIQUID_SOFTEN * stir;
  const damping = Math.max(0, 1 - (LINEAR_DAMPING + LIQUID_DRAG * stir) * dt);
  const angularDamping = Math.max(0, 1 - ANGULAR_DAMPING * dt);
  const spinEase = Math.min(1, 2 * dt);

  // Start-of-step positions, for the visible-speed settle metric (see doc).
  const startXs: number[] = [];
  const startYs: number[] = [];
  for (let i = 0; i < count; i++) {
    startXs.push(xs[i]!);
    startYs.push(ys[i]!);
  }

  // Integrate gravity (+ the stirred liquid's forces) + damping + position.
  for (let i = 0; i < count; i++) {
    // `?? 1` tolerates a world snapshot from before gravityFactors existed
    // (e.g. a seed preserved across a dev fast-refresh).
    const gf = gravityFactors?.[i] ?? 1;
    let ax = gx * gf * gravityScale;
    let ay = gy * gf * gravityScale;
    if (stir > 0) {
      // Slosh reuses the per-body weight so the pile doesn't move in
      // lockstep; the wander gives each sticker its own slow path.
      const phase = i * PHASE_STEP;
      const rx = (xs[i]! - cx) / halfW;
      const ry = (ys[i]! - cy) / halfH;
      ax += sloshX * gf + whirl * ry + swirl * Math.sin(t * 2.9 + phase);
      ay += sloshY * gf - whirl * rx + swirl * Math.cos(t * 2.3 + phase * 1.3);
      const spinTarget = LIQUID_SPIN * stir * Math.sin(t * 0.8 + phase * 1.7);
      avs[i] = avs[i]! + (spinTarget - avs[i]!) * spinEase;
    }
    vxs[i] = (vxs[i]! + ax * dt) * damping;
    vys[i] = (vys[i]! + ay * dt) * damping;
    xs[i] = xs[i]! + vxs[i]! * dt;
    ys[i] = ys[i]! + vys[i]! * dt;
    avs[i] = avs[i]! * angularDamping;
    angles[i] = angles[i]! + avs[i]! * dt;
  }

  const minC = radius;
  const maxX = width - radius;
  const maxY = height - radius;
  const minDist = radius * 2 * (1 - LIQUID_PASS_THROUGH * stir);
  const crowd = Math.min(1, Math.max(0, (count - PAIR_BOUNCY_COUNT) / (PAIR_CROWDED_COUNT - PAIR_BOUNCY_COUNT)));
  const pairRestitution =
    (PAIR_RESTITUTION_SPARSE + (PAIR_RESTITUTION_DENSE - PAIR_RESTITUTION_SPARSE) * crowd) *
    soften;
  const wallRestitution = WALL_RESTITUTION * soften;

  for (let iter = 0; iter < SOLVER_ITERATIONS; iter++) {
    // Per-frame energy exchange (friction, spin) happens only in the first
    // iteration — see the WALL_FRICTION comment above.
    const firstIter = iter === 0;

    // Wall collisions.
    for (let i = 0; i < count; i++) {
      if (xs[i]! < minC) {
        xs[i] = minC;
        if (vxs[i]! < 0) {
          const restitution = -vxs[i]! < RESTING_SPEED_THRESHOLD ? 0 : wallRestitution;
          vxs[i] = -vxs[i]! * restitution;
        }
        if (firstIter) vys[i] = vys[i]! * WALL_FRICTION;
      } else if (xs[i]! > maxX) {
        xs[i] = maxX;
        if (vxs[i]! > 0) {
          const restitution = vxs[i]! < RESTING_SPEED_THRESHOLD ? 0 : wallRestitution;
          vxs[i] = -vxs[i]! * restitution;
        }
        if (firstIter) vys[i] = vys[i]! * WALL_FRICTION;
      }
      if (ys[i]! < minC) {
        ys[i] = minC;
        if (vys[i]! < 0) {
          const restitution = -vys[i]! < RESTING_SPEED_THRESHOLD ? 0 : wallRestitution;
          vys[i] = -vys[i]! * restitution;
        }
        if (firstIter) vxs[i] = vxs[i]! * WALL_FRICTION;
      } else if (ys[i]! > maxY) {
        ys[i] = maxY;
        if (vys[i]! > 0) {
          const restitution = vys[i]! < RESTING_SPEED_THRESHOLD ? 0 : wallRestitution;
          vys[i] = -vys[i]! * restitution;
        }
        if (firstIter) vxs[i] = vxs[i]! * WALL_FRICTION;
      }
    }

    // Pairwise collisions — O(n^2), fine at <=40 bodies.
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = xs[j]! - xs[i]!;
        const dy = ys[j]! - ys[i]!;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDist * minDist || distSq === 0) continue;

        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Positional correction: push apart along the normal.
        const correction = (overlap / 2) * POSITION_SLOP;
        xs[i] = xs[i]! - nx * correction;
        ys[i] = ys[i]! - ny * correction;
        xs[j] = xs[j]! + nx * correction;
        ys[j] = ys[j]! + ny * correction;

        // Normal impulse (equal masses).
        const rvx = vxs[j]! - vxs[i]!;
        const rvy = vys[j]! - vys[i]!;
        const velAlongNormal = rvx * nx + rvy * ny;
        if (velAlongNormal < 0) {
          const isImpact = -velAlongNormal >= RESTING_SPEED_THRESHOLD;
          const restitution = isImpact ? pairRestitution : 0;
          const impulse = -(1 + restitution) * velAlongNormal * 0.5;
          vxs[i] = vxs[i]! - impulse * nx;
          vys[i] = vys[i]! - impulse * ny;
          vxs[j] = vxs[j]! + impulse * nx;
          vys[j] = vys[j]! + impulse * ny;

          // Cosmetic spin from tangential slip — once per frame, capped,
          // and only on genuine impacts: a resting contact re-fed by
          // gravity every frame would otherwise inject a trickle of spin
          // forever, sustaining a visible rotation limit cycle (and, since
          // spin counts toward the settle metric, keeping the simulation
          // awake) long after the pile has stopped translating.
          if (firstIter && isImpact) {
            const tx = -ny;
            const ty = nx;
            const tangentVel = rvx * tx + rvy * ty;
            const spin = tangentVel * (1 - PAIR_FRICTION) * 0.05;
            const avi = avs[i]! - spin;
            const avj = avs[j]! + spin;
            avs[i] = avi > MAX_ANGULAR_SPEED ? MAX_ANGULAR_SPEED : avi < -MAX_ANGULAR_SPEED ? -MAX_ANGULAR_SPEED : avi;
            avs[j] = avj > MAX_ANGULAR_SPEED ? MAX_ANGULAR_SPEED : avj < -MAX_ANGULAR_SPEED ? -MAX_ANGULAR_SPEED : avj;
          }
        }
      }
    }
  }

  // Final safety clamp — guarantees every body is strictly in bounds at
  // the end of the step regardless of how the iterations above left them.
  for (let i = 0; i < count; i++) {
    if (xs[i]! < minC) xs[i] = minC;
    else if (xs[i]! > maxX) xs[i] = maxX;
    if (ys[i]! < minC) ys[i] = minC;
    else if (ys[i]! > maxY) ys[i] = maxY;
  }

  let maxSpeed = 0;
  const invDt = dt > 0 ? 1 / dt : 0;
  for (let i = 0; i < count; i++) {
    // Net displacement this step — what the user can actually see moving.
    const ddx = xs[i]! - startXs[i]!;
    const ddy = ys[i]! - startYs[i]!;
    const moved = Math.sqrt(ddx * ddx + ddy * ddy) * invDt;
    // Rotation counts toward "still moving": rim speed (|av| * radius) is in
    // the same px/s units, so a body spinning in place keeps the simulation
    // awake until the spin has visibly damped out — otherwise the sleep gate
    // freezes stickers mid-rotation.
    const rim = Math.abs(avs[i]!) * radius;
    const speed = moved > rim ? moved : rim;
    if (speed > maxSpeed) maxSpeed = speed;
  }
  return maxSpeed;
};

// settledJarWorld runs the solver ahead of time at the frame rate it is tuned
// for, until the pile has been calm for as long as useJarPhysics waits before
// it sleeps (its SLEEP_SPEED_THRESHOLD and SLEEP_FRAME_COUNT), or the cap: a
// pile that never calms is still handed back, and the live solver carries on.
const SETTLE_DT = 1 / 60;
const SETTLE_CALM_SPEED = 8; // px/s
const SETTLE_CALM_STEPS = 60;
const SETTLE_MAX_STEPS = 900;

/**
 * A jar whose stickers have already fallen and come to rest: the same solver,
 * run here instead of on screen. For a host that must show a jar without the
 * fall (Reduce Motion): handed to useJarPhysics as its seed, the pile is
 * simply there, and still answers a tap and a tilt.
 *
 * `gravityY` is the pull toward the jar's floor in px/s^2 (the hook's own is
 * `JAR_REST_GRAVITY` in useJarPhysics). Deterministic: it starts from
 * createJarWorld's grid, centred, so the same jar settles the same way every
 * time and a lone sticker rests in the middle rather than in a corner.
 */
export const settledJarWorld = (
  count: number,
  width: number,
  height: number,
  radius: number,
  gravityY: number
): JarWorld => {
  const world = createJarWorld(count, width, height, radius);
  if (count === 0) return world;

  const { xs } = world;
  const shift = (width - (Math.min(...xs) + Math.max(...xs))) / 2;
  for (let i = 0; i < count; i++) xs[i] = xs[i]! + shift;

  runJarToRest(world, gravityY);
  return world;
};

/** Steps `world` until it has been calm for long enough to sleep, or the cap. */
const runJarToRest = (world: JarWorld, gravityY: number): void => {
  let calmSteps = 0;
  for (let step = 0; step < SETTLE_MAX_STEPS && calmSteps < SETTLE_CALM_STEPS; step++) {
    const speed = stepJarPhysics(world, 0, gravityY, SETTLE_DT);
    calmSteps = speed < SETTLE_CALM_SPEED ? calmSteps + 1 : 0;
  }
};

/** How a jar is filled ahead of time (filledJarWorld). */
export interface JarFilling {
  /** How many stickers are let go together. */
  handful: number;
  /** How long the solver runs between two handfuls. */
  betweenHandfulsMs: number;
  /** Where each sticker is let go from, and its weight. 0 to 1, as Math.random. */
  random: () => number;
}

/**
 * A jar that was filled a handful at a time and has come to rest: what a
 * host that drops stickers in while it is watched ends up with, worked out
 * here instead of on screen. Each handful is spawned as a live jar spawns a
 * new sticker (reconcileJarWorld) and falls onto what is already there, so
 * the result is a pile, where settledJarWorld's grid of bodies let go
 * together lands as level rows.
 *
 * The same world every time for the same `random`. For a host that shows the
 * pile without running the solver under it (Onboarding V4's full jar).
 */
export const filledJarWorld = (
  count: number,
  width: number,
  height: number,
  radius: number,
  gravityY: number,
  filling: JarFilling
): JarWorld => {
  let world = createJarWorld(0, width, height, radius);
  if (count <= 0) return world;

  const handful = Math.max(1, Math.floor(filling.handful));
  const stepsBetween = Math.max(1, Math.round(filling.betweenHandfulsMs / 1000 / SETTLE_DT));
  let ids: number[] = [];
  for (let filled = 0; filled < count; ) {
    filled = Math.min(count, filled + handful);
    const next = Array.from({ length: filled }, (_, id) => id);
    world = reconcileJarWorld(world, ids, next, filling.random);
    ids = next;
    for (let step = 0; step < stepsBetween; step++) {
      stepJarPhysics(world, 0, gravityY, SETTLE_DT);
    }
  }
  runJarToRest(world, gravityY);
  return world;
};
