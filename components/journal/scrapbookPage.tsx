import { useCallback, useEffect, useRef, useState } from "react";
import { APP_CARD, RULED, scrap, sticker } from "@/components/journal/ui";

// The app's sticker drawer (secret-note src/components/Shared/StickerTabsRevamped.tsx), with its
// [Stickers | Scrapbook] segment: Stickers holds Miuu's moods, the basics and the newest packs;
// Scrapbook the photoreal packs (ScrapbookTab.tsx). Pack icons run along the top, the open pack fills
// a grid of soft tiles, and a pick lands on the page. Here it plays itself: a tile is pressed, its
// sticker flies up onto the page, and the next pick may come from the other segment. A tap on any
// tile places it too.

type Segment = "stickers" | "scrapbook";
type Pack = { key: string; name: string; icon: string; segment: Segment; stickers: string[] };

const STICKER_PACKS: Pack[] = [
  {
    key: "moods",
    name: "Miuu's moods",
    icon: "cat-happy",
    segment: "stickers",
    stickers: [
      "cat-happy",
      "cat-proud",
      "cat-inlove",
      "cat-eating",
      "cat-cheerup",
      "cat-soso",
      "cat-tired",
      "cat-sad",
      "cat-worry",
      "cat-rage",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    icon: "emoji-heart",
    segment: "stickers",
    stickers: [
      "emoji-heart",
      "emoji-star",
      "emoji-cherry",
      "emoji-rainbow",
      "emoji-flower",
      "emoji-music",
      "emoji-bread",
      "emoji-cake",
      "emoji-coffee",
      "emoji-gift",
    ],
  },
  {
    key: "autumn",
    name: "Miuu's Cozy Autumn",
    icon: "miuu-pumpkin",
    segment: "stickers",
    stickers: [
      "miuu-pumpkin",
      "joy-acorns",
      "frog-rain-tea",
      "miyomi-autumn-leaves",
      "kiki-candy",
      "miuu-witch-hat",
      "miuu-ghost-balloon",
      "nunu-jack-o-lantern",
      "kao-star",
      "whispurr-maple-leaf",
    ],
  },
  {
    key: "little",
    name: "Little Miuu & Friends",
    icon: "happy-flower-miyomi",
    segment: "stickers",
    stickers: [
      "happy-flower-miyomi",
      "computer-work-miuu",
      "cookie-kiki",
      "birthday-cake-miuu",
      "little-wizard-miuu",
      "toasty-cats",
      "shy-shy-miyomi",
      "megaphone-frog",
      "earmuff-cutie-miyomi",
      "full-belly-miuu",
    ],
  },
  {
    key: "food",
    name: "Everyday Food",
    icon: "food-cozy-ramen",
    segment: "stickers",
    stickers: [
      "food-cozy-ramen",
      "food-kimbap",
      "food-strawberry-shortcake",
      "food-iced-coffee",
      "food-lavender-bubble-tea",
      "food-rice-balls",
      "food-double-scoop-ice-cream",
    ],
  },
];

const SCRAPBOOK_PACKS: Omit<Pack, "segment">[] = [
  {
    key: "ribbons",
    name: "Ribbons",
    icon: "ribbons-1",
    stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `ribbons-${i}`),
  },
  {
    key: "washi",
    name: "Washi tape",
    icon: "washi-tape-2",
    stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `washi-tape-${i}`),
  },
  {
    key: "y2k",
    name: "Y2K clip art",
    icon: "y2k-clip-art-4",
    stickers: [1, 2, 3, 4, 5, 9, 13, 14, 15, 17].map((i) => `y2k-clip-art-${i}`),
  },
  {
    key: "hair",
    name: "Hair clips",
    icon: "hair-clips-4",
    stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `hair-clips-${i}`),
  },
  {
    key: "buttons",
    name: "Buttons",
    icon: "buttons-2",
    stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `buttons-${i}`),
  },
  { key: "clips", name: "Clips", icon: "clips-1", stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `clips-${i}`) },
];

const PACKS: Pack[] = [...STICKER_PACKS, ...SCRAPBOOK_PACKS.map((p) => ({ ...p, segment: "scrapbook" as const }))];
const FIRST_SCRAPBOOK = STICKER_PACKS.length;
const art = (pack: Pack, name: string) => (pack.segment === "stickers" ? sticker(name) : scrap(name));

// Where picks land on the page, in % of the page and turns, in order; then the page starts over
const SPOTS = [
  { x: 50, y: 30, w: 26, r: -4 }, // tape across the top photo
  { x: 82, y: 22, w: 16, r: 12 },
  { x: 16, y: 74, w: 18, r: -10 },
  { x: 60, y: 86, w: 14, r: 8 },
  { x: 86, y: 70, w: 15, r: -6 },
  { x: 36, y: 90, w: 13, r: 14 },
  { x: 12, y: 32, w: 14, r: -14 },
  { x: 72, y: 50, w: 12, r: 6 },
];

// The pack and tile each automatic pick takes: a few from one segment, then the other, the way
// someone decorating a page stays in a drawer for a while instead of flipping it every pick
const SCRIPT = [
  { pack: 6, tile: 1 }, // washi tape over the photo
  { pack: 6, tile: 6 }, // and a strip at the corner
  { pack: 5, tile: 0 }, // a pink bow
  { pack: 9, tile: 1 }, // a heart button
  { pack: 0, tile: 0 }, // happy Miuu
  { pack: 0, tile: 2 }, // Miuu in love
  { pack: 3, tile: 4 }, // little wizard Miuu
  { pack: 1, tile: 3 }, // a rainbow
];

const PICK_EVERY_MS = 1700;
// how long a newly opened pack takes to slide in before one of its tiles is pressed
const PACK_OPEN_MS = 420;
const PRESS_MS = 140;
const FLIGHT_MS = 760;

type Placed = { src: string; spot: (typeof SPOTS)[number]; key: number };

const quad = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * t * (1 - t) * c + t * t * b;

const ScrapbookPage = ({ date, weekday }: { date: string; weekday: string }) => {
  const [pack, setPack] = useState(6);
  const segment = PACKS[pack].segment;
  const shownPacks = PACKS.map((p, i) => ({ p, i })).filter(({ p }) => p.segment === segment);
  const [pressed, setPressed] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [clearing, setClearing] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flyRef = useRef<HTMLImageElement>(null);
  const count = useRef(0);
  const auto = useRef(true);
  const packRef = useRef(6);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  // A sticker flies from its tile to its spot on the page in an arc, lands a touch big and presses
  // down, then stays there. A full page fades out as the next one's first sticker is on its way.
  const place = useCallback((packIndex: number, tile: number) => {
    const src = art(PACKS[packIndex], PACKS[packIndex].stickers[tile]);
    const n = count.current % SPOTS.length;
    const spot = SPOTS[n];
    count.current += 1;
    const key = count.current;
    const fresh = n === 0 && key > 1;
    if (fresh) setClearing(true);
    const commit = () => {
      setClearing(false);
      setPlaced((prev) => (n === 0 ? [{ src, spot, key }] : [...prev, { src, spot, key }]));
    };

    const from = tileRefs.current[tile]?.getBoundingClientRect();
    const page = pageRef.current?.getBoundingClientRect();
    const fly = flyRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!from || !page || !fly || reduce) return commit();

    // centres in the card's frame, so the flight and the placed sticker turn and grow about one point
    const w = (page.width * spot.w) / 100;
    const card = fly.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const x0 = from.left + from.width / 2 - card.left;
    const y0 = from.top + from.height / 2 - card.top;
    const x1 = page.left + (page.width * spot.x) / 100 - card.left;
    const y1 = page.top + (page.height * spot.y) / 100 - card.top;
    // the arc's pull: above both ends, leaning toward the landing so it comes down onto the page
    const cx = x0 + (x1 - x0) * 0.6;
    const cy = Math.min(y0, y1) - 70;
    const s0 = (from.width * 0.86) / w;
    const STEPS = 20;
    const frames = Array.from({ length: STEPS + 1 }, (_, k) => {
      const t = k / STEPS;
      // eases out of the tile and onto the page, so it lifts off instead of leaping
      const p = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = quad(x0, cx, x1, p) - w / 2;
      const y = quad(y0, cy, y1, p) - w / 2;
      const scale = s0 + (1.08 - s0) * p;
      return { opacity: 1, transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${spot.r * p}deg)` };
    });
    fly.src = src;
    fly.style.width = `${w}px`;
    fly.style.height = `${w}px`;
    const anim = fly.animate(frames, { duration: FLIGHT_MS, easing: "linear", fill: "forwards" });
    anim.onfinish = () => {
      commit();
      // hold the flier until the placed sticker has painted, so nothing blinks at the landing
      requestAnimationFrame(() => requestAnimationFrame(() => anim.cancel()));
    };
  }, []);

  // Opens the pack first if it isn't open (its icon lights, its tiles slide in), then presses the
  // tile and sends its sticker off
  const pick = useCallback(
    (packIndex: number, tile: number) => {
      const wait = packRef.current === packIndex ? 0 : PACK_OPEN_MS;
      packRef.current = packIndex;
      setPack(packIndex);
      later(() => {
        setPressed(tile);
        later(() => setPressed(null), PRESS_MS + 80);
        later(() => place(packIndex, tile), PRESS_MS);
      }, wait);
    },
    [place, later],
  );

  // Plays the script while the page is in view, until someone taps a tile themselves
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    let step = 0;
    let timer = 0;
    const run = () => {
      if (!auto.current) return;
      const s = SCRIPT[step % SCRIPT.length];
      step += 1;
      pick(s.pack, s.tile);
      timer = window.setTimeout(run, PICK_EVERY_MS);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (entry.isIntersecting) timer = window.setTimeout(run, 600);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [pick]);

  const openPack = (i: number) => {
    auto.current = false;
    packRef.current = i;
    setPack(i);
  };

  const tapTile = (tile: number) => {
    auto.current = false;
    pick(pack, tile);
  };

  return (
    <div className={`${APP_CARD} relative overflow-hidden`}>
      {/* the page */}
      <div ref={pageRef} className={`${RULED} relative h-[300px] px-6 pt-5`}>
        <p className="text-[13px] font-bold">
          {date} <span className="ms-1 text-[11px] font-semibold tracking-wide text-ink/45">{weekday}</span>
        </p>
        <p className="mt-2 text-lg font-extrabold tracking-tight">A slow Sunday</p>
        {/* two photos from the day */}
        <figure className="absolute left-[30%] top-[28%] w-[34%] -rotate-[4deg] bg-white p-1.5 pb-5 shadow-[0_10px_24px_-12px_rgba(43,34,64,0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/photos/iced-coffee.webp"
            alt="An iced coffee on a desk"
            className="aspect-square w-full object-cover"
          />
        </figure>
        <figure className="absolute right-[7%] top-[44%] w-[28%] rotate-[6deg] bg-white p-1.5 pb-5 shadow-[0_10px_24px_-12px_rgba(43,34,64,0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/photos/black-cat.webp"
            alt="A black cat on a radiator"
            className="aspect-square w-full object-cover"
          />
        </figure>
        {placed.map((p) => (
          <div
            key={p.key}
            className={`pointer-events-none absolute transition-opacity duration-500 ${clearing ? "opacity-0" : ""}`}
            style={{
              left: `${p.spot.x}%`,
              top: `${p.spot.y}%`,
              width: `${p.spot.w}%`,
              transform: `translate(-50%, -50%) rotate(${p.spot.r}deg)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" className="aspect-square w-full animate-stick object-contain" />
          </div>
        ))}
      </div>

      {/* the drawer */}
      <div className="relative rounded-t-[22px] bg-white px-4 pb-4 pt-2 shadow-[0_-10px_30px_-20px_rgba(43,34,64,0.35)]">
        <div className="mx-auto h-1 w-9 rounded-full bg-ink/15" />
        <div className="mt-3 flex justify-center">
          <div
            className="inline-flex rounded-full bg-ink/[0.06] p-1 text-[12px] font-semibold"
            role="tablist"
            aria-label="Sticker drawer"
          >
            {(["stickers", "scrapbook"] as const).map((seg) => (
              <button
                key={seg}
                type="button"
                role="tab"
                aria-selected={segment === seg}
                onClick={() => {
                  if (segment !== seg) openPack(seg === "stickers" ? 0 : FIRST_SCRAPBOOK);
                }}
                className={`rounded-full px-3 py-1 capitalize transition-colors duration-300 ${
                  segment === seg
                    ? "bg-white text-ink shadow-[0_2px_8px_-2px_rgba(43,34,64,0.25)]"
                    : "text-ink/40 hover:text-ink/70"
                }`}
              >
                {seg}
              </button>
            ))}
          </div>
        </div>
        {/* pack icons */}
        <div key={segment} className="mt-3 flex animate-fade-in justify-start gap-2">
          {shownPacks.map(({ p, i }) => (
            <button
              key={p.key}
              type="button"
              onClick={() => openPack(i)}
              aria-label={p.name}
              aria-pressed={pack === i}
              className={`grid h-11 w-11 place-items-center rounded-[10px] transition-colors duration-300 ${
                pack === i ? "bg-[#EDE9FF]" : "hover:bg-ink/[0.04]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art(p, p.icon)} alt="" className="h-9 w-9 object-contain" />
            </button>
          ))}
        </div>
        <div className="-mx-4 mt-2 h-px bg-[#DBD2FF]" />
        {/* the open pack: the app's grid, 14 pt apart, art at 86% of each #F4F4F7 tile */}
        <div key={pack} className="mt-4 grid animate-fade-in grid-cols-5 gap-[10px] sm:gap-[14px]">
          {PACKS[pack].stickers.map((name, i) => (
            <button
              key={name}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              type="button"
              onClick={() => tapTile(i)}
              aria-label={`Put ${PACKS[pack].name.toLowerCase()} ${i + 1} on the page`}
              className={`grid aspect-square place-items-center rounded-[12px] bg-[#F4F4F7] transition-transform duration-200 ${
                pressed === i ? "scale-90" : "active:scale-95"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art(PACKS[pack], name)} alt="" className="h-[86%] w-[86%] object-contain" />
            </button>
          ))}
        </div>
      </div>

      {/* the sticker in flight, over everything */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={flyRef} alt="" className="pointer-events-none absolute left-0 top-0 z-20 object-contain opacity-0" />
    </div>
  );
};

export default ScrapbookPage;
