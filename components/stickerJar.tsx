import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  JarLandingWatch,
  JarWorld,
  createJarWorld,
  findJarBodyAt,
  jarLandingWatchFor,
  jarRadiusFor,
  pokeJarBody,
  reconcileJarWorld,
  stepJarLandings,
  stepJarPhysics,
} from "@/lib/jarPhysics";
import {
  DROP_SHARE,
  jarFullStickerTimes,
  jarPileFall,
  jarPileFallEasing,
  jarPileWorld,
  settledJarPile,
} from "@/lib/jarPile";

// The app's jar card, in its own points (jarFrame.ts: 120 pt tall, 16 pt corners, on a ~343 pt wide
// phone card), scaled up to the page on render so the copied solver's tuning holds as is
const JAR_W = 343;
const JAR_H = 120;
const JAR_CORNER = 16;
// The app's JAR_REST_GRAVITY (9.8 m/s² × its GRAVITY_SCALE 130)
const GRAVITY = 1274;

// The app's three newest packs (Miuu's Cozy Autumn, Everyday Food, Little Miuu & Friends) mixed
// with its basic stickers, thirty like the onboarding full jar
const JAR_STICKERS = [
  "miuu-pumpkin",
  "food-strawberry-shortcake",
  "happy-flower-miyomi",
  "emoji-heart",
  "joy-acorns",
  "food-cozy-ramen",
  "computer-work-miuu",
  "emoji-star",
  "kiki-candy",
  "food-iced-coffee",
  "cookie-kiki",
  "emoji-cherry",
  "miyomi-autumn-leaves",
  "food-kimbap",
  "birthday-cake-miuu",
  "emoji-rainbow",
  "miuu-witch-hat",
  "food-lavender-bubble-tea",
  "little-wizard-miuu",
  "emoji-flower",
  "frog-rain-tea",
  "food-rice-balls",
  "toasty-cats",
  "emoji-music",
  "miuu-ghost-balloon",
  "food-double-scoop-ice-cream",
  "shy-shy-miyomi",
  "emoji-saturn",
  "nunu-jack-o-lantern",
  "megaphone-frog",
];
const COUNT = JAR_STICKERS.length;

// How today went, as the app's journal mood sheet asks it (its mood faces, assets/mood/faces). The
// face stays with the entry; what drops into the jar is the entry's sticker, as in the app
const MOOD_PICKS = [
  { face: "happy", label: "Happy" },
  { face: "calm", label: "Calm" },
  { face: "loved", label: "Loved" },
  { face: "sleepy", label: "Sleepy" },
  { face: "proud", label: "Proud" },
  { face: "butterflies", label: "Butterflies" },
];
// The new entries' stickers, more from the same newest packs, in the order they are written
const ENTRY_STICKERS = [
  "joy-on-acorn",
  "earmuff-cutie-miyomi",
  "miuu-rain-cloud",
  "kao-star",
  "full-belly-miuu",
  "whispurr-maple-leaf",
  "bunsy-sleeping-bag-zzz",
  "miuu-under-leaf",
];
// Room for about a week of entries on top of the pile before the jar asks for a new one
const MAX_STICKERS = COUNT + ENTRY_STICKERS.length;

// Sized for the full jar from the first sticker, with the app's JAR_RADIUS_LIMITS
const RADIUS = jarRadiusFor(COUNT, JAR_W, JAR_H, { min: 12, max: 26, step: 2 });
const BOUNDS = { width: JAR_W, height: JAR_H, radius: RADIUS };

// The app's onboarding full jar: the card rises in over 450 ms from 50 ms, the stickers follow
const CARD_IN_AT_MS = 50;
const CARD_IN_MS = 450;
const CARD_RISE_PT = 20;
const DROP_AT_MS = jarFullStickerTimes(COUNT);

// Same as the app's useJarPhysics
const SLEEP_SPEED = 8;
const SLEEP_FRAMES = 60;
const POKE_HIT_RADIUS = 22;
const DRAG_START_PX = 6;

// Tilting the card by dragging it, the page's stand-in for tilting the phone
const TILT_PER_PX = 0.08; // degrees
const TILT_MAX = 12;
const TILT_SPRING = 90;
const TILT_DAMPING = 11;
// Wiggling it back and forth fast enough stirs the jar, as a shake does in the app
const SHAKE_FLIPS = 3;
const SHAKE_WINDOW_MS = 900;
const STIR_SECONDS = 2.4;

const stickerSrc = (name: string) => `/images/stickers/jar/${name}.webp`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const StickerJar = () => {
  const [landed, setLanded] = useState(0);
  // The picker and the buttons wait for the jar: the stickers pouring in are what is seen first
  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState<string | null>(null);
  // Points to px: the label is set in the app's sizes at the card's scale
  const [scale, setScale] = useState(1);
  const [picks, setPicks] = useState<string[]>([]);
  const [mood, setMood] = useState<string | null>(null);

  const enterRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const stickerEls = useRef<(HTMLImageElement | null)[]>([]);

  // The pile is the solver's, worked out once; the stickers play their falls to it
  const pile = useMemo(() => settledJarPile(COUNT, BOUNDS, GRAVITY), []);
  const falls = useMemo(() => pile.map((spot, place) => jarPileFall(spot, BOUNDS, place, GRAVITY)), [pile]);

  // Everything per frame lives in refs and is written straight to the stickers, never through React
  const sim = useRef({
    phase: "waiting" as "waiting" | "playing" | "live",
    since: 0,
    world: createJarWorld(0, JAR_W, JAR_H, RADIUS) as JarWorld,
    watch: jarLandingWatchFor([], [], null, false) as JarLandingWatch,
    running: false,
    last: 0,
    calmFrames: 0,
    landed: 0,
    tilt: 0,
    tiltVel: 0,
    tiltTarget: null as number | null,
    stirStart: -1,
    flips: [] as number[],
    lastTiltDir: 0,
    grab: null as null | { index: number; x: number; y: number },
  });

  const pxPerPt = () => (cardRef.current ? cardRef.current.clientWidth / JAR_W : 1);

  const place = (el: HTMLImageElement, x: number, y: number, angle: number, size: number, s: number) => {
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.transform = `translate3d(${x * s - size / 2}px, ${y * s - size / 2}px, 0) rotate(${angle}rad)`;
  };

  const renderWorld = useCallback(() => {
    const { world } = sim.current;
    const s = pxPerPt();
    const size = RADIUS * 2 * s;
    for (let i = 0; i < world.count; i++) {
      const el = stickerEls.current[i];
      if (el) place(el, world.xs[i], world.ys[i], world.angles[i], size, s);
    }
    if (wrapRef.current) wrapRef.current.style.transform = `rotate(${sim.current.tilt}deg)`;
  }, []);

  // The app's label pulse: up to 1.15 and back with a little overshoot
  const pulseLabel = () => {
    labelRef.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], {
      duration: 550,
      easing: "cubic-bezier(0.3, 1.6, 0.5, 1)",
    });
  };

  // ── The fill: each sticker falls from just above the rim to its place in the pile, 35 ms apart ──
  const playFrame = useCallback(
    (now: number) => {
      const st = sim.current;
      if (st.phase !== "playing") return;
      const t = now - st.since;
      const s = pxPerPt();
      const size = RADIUS * 2 * s;
      let landedNow = 0;
      let done = true;
      for (let i = 0; i < COUNT; i++) {
        const el = stickerEls.current[i];
        const spot = pile[i];
        const fall = falls[i];
        if (!el || !spot || !fall) continue;
        const progress = Math.max(0, (t - DROP_AT_MS[i]) / fall.durationMs);
        if (progress < 1) done = false;
        if (progress >= DROP_SHARE) landedNow++;
        const k = jarPileFallEasing(progress);
        place(el, fall.fromX + (spot.x - fall.fromX) * k, fall.fromY + (spot.y - fall.fromY) * k, spot.angle, size, s);
      }
      if (landedNow !== st.landed) {
        st.landed = landedNow;
        setLanded(landedNow);
        if (landedNow === COUNT) {
          pulseLabel();
          setReady(true);
        }
      }
      if (done) {
        // Hand the pile to the solver, asleep, where the playback left it
        st.world = jarPileWorld(pile, BOUNDS);
        st.watch = jarLandingWatchFor([], [], null, false);
        st.phase = "live";
        return;
      }
      requestAnimationFrame(playFrame);
    },
    [pile, falls],
  );

  const play = useCallback(() => {
    const st = sim.current;
    st.phase = "playing";
    st.since = performance.now();
    st.landed = 0;
    st.tilt = 0;
    st.tiltVel = 0;
    st.stirStart = -1;
    st.grab = null;
    setLanded(0);
    setPicks([]);
    setMood(null);
    if (wrapRef.current) wrapRef.current.style.transform = "";
    enterRef.current?.animate(
      [
        { opacity: 0, transform: `translateY(${CARD_RISE_PT * pxPerPt()}px)` },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: CARD_IN_MS, delay: CARD_IN_AT_MS, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" },
    );
    requestAnimationFrame(playFrame);
  }, [playFrame]);

  // ── Live: the app's solver, for pokes, tosses, tilts and shakes ──
  const frame = useCallback(
    (now: number) => {
      const st = sim.current;
      if (st.phase !== "live") {
        st.running = false;
        return;
      }
      const dt = Math.min((now - st.last) / 1000, 1 / 30);
      st.last = now;
      const { world } = st;

      // The tilt: follows the drag, or springs back to level once let go
      if (st.tiltTarget !== null) {
        const prev = st.tilt;
        st.tilt += (st.tiltTarget - st.tilt) * Math.min(1, dt * 18);
        st.tiltVel = (st.tilt - prev) / Math.max(dt, 1e-3);
      } else {
        st.tiltVel += (-TILT_SPRING * st.tilt - TILT_DAMPING * st.tiltVel) * dt;
        st.tilt += st.tiltVel * dt;
        if (Math.abs(st.tilt) < 0.05 && Math.abs(st.tiltVel) < 0.5) {
          st.tilt = 0;
          st.tiltVel = 0;
        }
      }
      const rad = (st.tilt * Math.PI) / 180;
      const gx = GRAVITY * Math.sin(rad);
      const gy = GRAVITY * Math.cos(rad);

      const stirAge = st.stirStart >= 0 ? (now - st.stirStart) / 1000 : -1;
      const stir = stirAge >= 0 && stirAge < STIR_SECONDS ? 1 - stirAge / STIR_SECONDS : 0;
      if (stirAge >= STIR_SECONDS) st.stirStart = -1;

      let speed = stepJarPhysics(
        world,
        gx,
        gy,
        dt,
        stir > 0 ? { stir, sloshX: 0, sloshY: 0, timeSec: stirAge } : undefined,
      );

      // A held sticker goes where the pointer is and leaves with its speed
      if (st.grab && st.grab.index < world.count) {
        const { index, x, y } = st.grab;
        const tx = Math.max(RADIUS, Math.min(JAR_W - RADIUS, x));
        const ty = Math.max(RADIUS, Math.min(JAR_H - RADIUS, y));
        world.vxs[index] = (tx - world.xs[index]) / Math.max(dt, 1e-3);
        world.vys[index] = (ty - world.ys[index]) / Math.max(dt, 1e-3);
        world.xs[index] = tx;
        world.ys[index] = ty;
        speed = Math.max(speed, SLEEP_SPEED + 1);
      }

      if (stepJarLandings(world, st.watch, gx, gy, dt) !== -1) {
        st.landed += 1;
        setLanded(st.landed);
        pulseLabel();
      }

      renderWorld();

      const settling = st.tilt !== 0 || stir > 0 || st.grab || st.watch.watching > 0;
      st.calmFrames = speed < SLEEP_SPEED && !settling ? st.calmFrames + 1 : 0;
      if (st.calmFrames >= SLEEP_FRAMES) {
        st.running = false;
        return;
      }
      requestAnimationFrame(frame);
    },
    [renderWorld],
  );

  const wake = useCallback(() => {
    const st = sim.current;
    st.calmFrames = 0;
    if (st.running || st.phase !== "live") return;
    st.running = true;
    st.last = performance.now();
    requestAnimationFrame(frame);
  }, [frame]);

  // First sight of the jar: fill it (or, under Reduce Motion, show it already full)
  useEffect(() => {
    setMonth(new Date().toLocaleString("en-US", { month: "long" }));
    const el = enterRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      const st = sim.current;
      st.world = jarPileWorld(pile, BOUNDS);
      st.phase = "live";
      st.landed = COUNT;
      renderWorld();
      setLanded(COUNT);
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        play();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pile, play, renderWorld]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new ResizeObserver(() => {
      setScale(pxPerPt());
      if (sim.current.phase === "live") renderWorld();
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, [renderWorld]);

  // ── Pointer: tap a sticker to make it hop, drag it to toss it, drag the card to tilt it ──
  const toWorld = (clientX: number, clientY: number) => {
    const rect = cardRef.current!.getBoundingClientRect();
    const s = rect.width / JAR_W;
    return { x: (clientX - rect.left) / s, y: (clientY - rect.top) / s };
  };

  const press = useRef<null | { kind: "sticker" | "card"; x0: number; y0: number; index: number; dragging: boolean }>(
    null,
  );

  const onStickerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const st = sim.current;
    if (st.phase !== "live") return;
    // Tilted, the page and the card disagree on where things are: a press is just a poke
    const p = toWorld(e.clientX, e.clientY);
    const index = Math.abs(st.tilt) < 0.5 ? findJarBodyAt(st.world, p.x, p.y, POKE_HIT_RADIUS) : -1;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    press.current = { kind: "sticker", x0: e.clientX, y0: e.clientY, index, dragging: false };
  };

  const onCardDown = (e: React.PointerEvent) => {
    if (sim.current.phase !== "live") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    press.current = { kind: "card", x0: e.clientX, y0: e.clientY, index: -1, dragging: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const pr = press.current;
    if (!pr) return;
    const st = sim.current;
    const dx = e.clientX - pr.x0;
    if (!pr.dragging && Math.hypot(dx, e.clientY - pr.y0) > DRAG_START_PX) pr.dragging = true;
    if (!pr.dragging) return;

    if (pr.kind === "sticker" && pr.index >= 0) {
      const p = toWorld(e.clientX, e.clientY);
      st.grab = { index: pr.index, x: p.x, y: p.y };
    } else if (pr.kind === "card") {
      const target = Math.max(-TILT_MAX, Math.min(TILT_MAX, dx * TILT_PER_PX));
      // Back-and-forth fast enough counts as a shake
      const dir = Math.sign(target - (st.tiltTarget ?? 0));
      if (dir !== 0 && dir !== st.lastTiltDir && Math.abs(st.tiltVel) > 30) {
        const now = performance.now();
        st.flips = [...st.flips.filter((t) => now - t < SHAKE_WINDOW_MS), now];
        if (st.flips.length >= SHAKE_FLIPS) {
          st.stirStart = now;
          st.flips = [];
        }
      }
      if (dir !== 0) st.lastTiltDir = dir;
      st.tiltTarget = target;
    }
    wake();
  };

  const onPointerUp = () => {
    const pr = press.current;
    press.current = null;
    const st = sim.current;
    if (!pr) return;
    if (pr.kind === "sticker" && !pr.dragging && pr.index >= 0) pokeJarBody(st.world, pr.index);
    st.grab = null;
    st.tiltTarget = null;
    wake();
  };

  const shake = () => {
    const st = sim.current;
    if (st.phase !== "live") return;
    st.stirStart = performance.now();
    st.tiltVel = 60;
    wake();
  };

  // A new entry's sticker, spawned near the top of the jar and let fall onto the pile, as the app's
  // reconcileJarWorld does; the label counts it when it lands
  const drop = () => {
    const st = sim.current;
    if (st.phase !== "live" || st.world.count >= MAX_STICKERS) return;
    const name = ENTRY_STICKERS[st.world.count - COUNT];
    const prevIds = Array.from({ length: st.world.count }, (_, i) => i);
    const nextIds = [...prevIds, prevIds.length];
    st.world = reconcileJarWorld(st.world, prevIds, nextIds);
    st.world.avs[prevIds.length] = (Math.random() * 2 - 1) * 3;
    st.watch = jarLandingWatchFor(prevIds, nextIds, st.watch, true);
    setPicks((prev) => [...prev, name]);
    wake();
  };

  const reset = () => {
    if (sim.current.phase === "playing") return;
    play();
  };

  const full = COUNT + picks.length >= MAX_STICKERS;

  return (
    <div className="relative mx-auto w-full max-w-[560px] select-none">
      <p className="sr-only">
        A Miuu Note sticker jar. Every journal entry drops a sticker into this month&apos;s jar.
      </p>

      <div ref={enterRef}>
        <div ref={wrapRef} className="origin-bottom" aria-hidden>
          {/* the app's jar card: white, a 1 pt grey5 border, 16 pt corners, the stickers clipped to it,
              lifted off the page with the onboarding jar's violet shadow */}
          <div
            ref={cardRef}
            className="relative cursor-grab touch-pan-y overflow-hidden border border-[#E0E0E0] bg-white shadow-[0_10px_28px_rgba(107,31,255,0.14)] active:cursor-grabbing"
            style={{ aspectRatio: `${JAR_W} / ${JAR_H}`, borderRadius: JAR_CORNER * scale }}
            onPointerDown={onCardDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* the month over "N entries", 8 pt in from the corner, as the app's JarLabel */}
            <div
              ref={labelRef}
              className="pointer-events-none absolute origin-top-left"
              style={{ left: 8 * scale, top: 8 * scale }}
            >
              <p className="font-bold leading-tight text-black" style={{ fontSize: 12 * scale }}>
                {month ?? "This month"}
              </p>
              <p className="font-medium leading-tight tabular-nums text-[#828282]" style={{ fontSize: 11 * scale }}>
                {landed} {landed === 1 ? "entry" : "entries"}
              </p>
            </div>

            {[...JAR_STICKERS, ...picks].map((name, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                ref={(el) => {
                  stickerEls.current[i] = el;
                }}
                src={stickerSrc(name)}
                alt=""
                draggable={false}
                className="absolute left-0 top-0 cursor-pointer touch-none will-change-transform"
                // waiting above the rim, where the card clips it, until it is let go
                style={{ transform: "translate3d(0, -200%, 0)" }}
                onPointerDown={onStickerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`transition-[opacity,transform] duration-700 ease-out ${
          ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        {/* today's entry: pick how it went and its sticker drops in */}
        <div className="mt-4 rounded-2xl bg-white/70 p-3 ring-1 ring-ink/5 backdrop-blur sm:p-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold tracking-tight">{full ? "This jar is full" : "How was today?"}</p>
            <p className="text-xs font-medium text-ink/45">
              {full ? "A new one every month" : "Pick a mood, an entry drops in"}
            </p>
          </div>
          <div className="mt-2 grid grid-cols-6 gap-1">
            {MOOD_PICKS.map((pick) => (
              <button
                key={pick.face}
                type="button"
                onClick={() => {
                  setMood(pick.face);
                  drop();
                }}
                disabled={full}
                aria-label={`Today felt ${pick.label}: add an entry to the jar`}
                aria-pressed={mood === pick.face}
                className={`group flex flex-col items-center gap-1 rounded-xl py-2 transition-colors disabled:opacity-40 ${
                  mood === pick.face ? "bg-violet/10" : "hover:bg-ink/[0.04] disabled:hover:bg-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/moods/${pick.face}.webp`}
                  alt=""
                  draggable={false}
                  className="h-9 w-9 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-90 sm:h-10 sm:w-10"
                />
                <span
                  className={`text-[10px] font-semibold sm:text-[11px] ${mood === pick.face ? "text-violet" : "text-ink/50"}`}
                >
                  {pick.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 px-1 text-xs font-medium text-ink/45">
          <span>Tap, toss or tilt the jar</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={shake}
              className="rounded-full border border-ink/10 bg-white px-3 py-1.5 font-semibold text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
            >
              Shake
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-ink/10 bg-white px-3 py-1.5 font-semibold text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickerJar;
