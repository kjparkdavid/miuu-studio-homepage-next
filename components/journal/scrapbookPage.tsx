import { useCallback, useEffect, useRef, useState } from "react";
import { APP_CARD, RULED, scrap } from "@/components/journal/ui";

// The app's Scrapbook drawer (secret-note src/components/Shared/ScrapbookTab.tsx): the photoreal packs'
// icons along the top, the open pack's stickers in a grid of soft tiles, and a pick lands on the page.
// Here it plays itself: a tile is pressed, its sticker flies up onto the page, and every couple of
// picks the next pack opens. A tap on any tile places it too.

const PACKS: { key: string; name: string; icon: string; stickers: string[] }[] = [
  { key: "ribbons", name: "Ribbons", icon: "ribbons-1", stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `ribbons-${i}`) },
  { key: "washi", name: "Washi tape", icon: "washi-tape-2", stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `washi-tape-${i}`) },
  { key: "y2k", name: "Y2K clip art", icon: "y2k-clip-art-4", stickers: [1, 2, 3, 4, 5, 9, 13, 14, 15, 17].map((i) => `y2k-clip-art-${i}`) },
  { key: "hair", name: "Hair clips", icon: "hair-clips-4", stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `hair-clips-${i}`) },
  { key: "buttons", name: "Buttons", icon: "buttons-2", stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `buttons-${i}`) },
  { key: "clips", name: "Clips", icon: "clips-1", stickers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `clips-${i}`) },
];

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

// The pack and tile each automatic pick takes
const SCRIPT = [
  { pack: 1, tile: 1 },
  { pack: 0, tile: 0 },
  { pack: 0, tile: 2 },
  { pack: 2, tile: 7 },
  { pack: 3, tile: 3 },
  { pack: 4, tile: 1 },
  { pack: 5, tile: 6 },
  { pack: 2, tile: 4 },
];

const PICK_EVERY_MS = 1500;

type Placed = { name: string; spot: (typeof SPOTS)[number]; key: number };

const ScrapbookPage = ({ date, weekday }: { date: string; weekday: string }) => {
  const [pack, setPack] = useState(1);
  const [pressed, setPressed] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flyRef = useRef<HTMLImageElement>(null);
  const count = useRef(0);
  const auto = useRef(true);

  // A sticker flies from its tile to its spot on the page, then stays there
  const place = useCallback((packIndex: number, tile: number) => {
    const name = PACKS[packIndex].stickers[tile];
    const n = count.current % SPOTS.length;
    const spot = SPOTS[n];
    count.current += 1;
    const key = count.current;
    const commit = () =>
      setPlaced((prev) => (n === 0 ? [{ name, spot, key }] : [...prev, { name, spot, key }]));

    const from = tileRefs.current[tile]?.getBoundingClientRect();
    const page = pageRef.current?.getBoundingClientRect();
    const fly = flyRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!from || !page || !fly || reduce) return commit();

    // centres, so the flight and the placed sticker turn and grow about the same point
    const w = (page.width * spot.w) / 100;
    const card = fly.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const x0 = from.left + from.width / 2 - w / 2 - card.left;
    const y0 = from.top + from.height / 2 - w / 2 - card.top;
    const x1 = page.left + (page.width * spot.x) / 100 - w / 2 - card.left;
    const y1 = page.top + (page.height * spot.y) / 100 - w / 2 - card.top;
    const s0 = (from.width * 0.72) / w;
    fly.src = scrap(name);
    fly.style.width = `${w}px`;
    fly.style.height = `${w}px`;
    const anim = fly.animate(
      [
        { opacity: 1, transform: `translate(${x0}px, ${y0}px) scale(${s0}) rotate(0deg)` },
        { opacity: 1, transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 40}px) scale(${(s0 + 1) / 2 + 0.15}) rotate(${spot.r / 2}deg)`, offset: 0.55 },
        { opacity: 1, transform: `translate(${x1}px, ${y1}px) scale(1) rotate(${spot.r}deg)` },
      ],
      { duration: 650, easing: "cubic-bezier(0.3, 0.7, 0.3, 1)" }
    );
    anim.onfinish = () => {
      fly.style.opacity = "0";
      commit();
    };
  }, []);

  const pick = useCallback(
    (packIndex: number, tile: number) => {
      setPack(packIndex);
      setPressed(tile);
      window.setTimeout(() => setPressed(null), 220);
      // let the pack's grid swap in before the sticker leaves its tile
      window.setTimeout(() => place(packIndex, tile), 260);
    },
    [place]
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
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [pick]);

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
          <img src="/images/photos/latte.webp" alt="A latte with heart latte art" className="aspect-square w-full object-cover" />
        </figure>
        <figure className="absolute right-[7%] top-[44%] w-[28%] rotate-[6deg] bg-white p-1.5 pb-5 shadow-[0_10px_24px_-12px_rgba(43,34,64,0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/photos/cat.webp" alt="A cat asleep on a blanket" className="aspect-square w-full object-cover" />
        </figure>
        {placed.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.key}
            src={scrap(p.name)}
            alt=""
            className="pointer-events-none absolute aspect-square object-contain"
            style={{
              left: `${p.spot.x}%`,
              top: `${p.spot.y}%`,
              width: `${p.spot.w}%`,
              transform: `translate(-50%, -50%) rotate(${p.spot.r}deg)`,
            }}
          />
        ))}
      </div>

      {/* the drawer */}
      <div className="relative rounded-t-[22px] bg-white px-4 pb-4 pt-2 shadow-[0_-10px_30px_-20px_rgba(43,34,64,0.35)]">
        <div className="mx-auto h-1 w-9 rounded-full bg-ink/15" />
        <div className="mt-3 flex justify-center">
          <div className="inline-flex rounded-full bg-ink/[0.06] p-1 text-[12px] font-semibold">
            <span className="px-3 py-1 text-ink/40">Stickers</span>
            <span className="rounded-full bg-white px-3 py-1 shadow-[0_2px_8px_-2px_rgba(43,34,64,0.25)]">Scrapbook</span>
          </div>
        </div>
        {/* pack icons */}
        <div className="mt-3 flex justify-between gap-1">
          {PACKS.map((p, i) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                auto.current = false;
                setPack(i);
              }}
              aria-label={p.name}
              aria-pressed={pack === i}
              className={`grid h-11 w-11 place-items-center rounded-[10px] transition-colors duration-300 ${
                pack === i ? "bg-[#EDE9FF]" : "hover:bg-ink/[0.04]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scrap(p.icon)} alt="" className="h-9 w-9 object-contain" />
            </button>
          ))}
        </div>
        <div className="-mx-4 mt-2 h-px bg-[#DBD2FF]" />
        {/* the open pack: the app's grid, 14 pt apart, art at 86% of each #F4F4F7 tile */}
        <div key={pack} className="mt-4 grid animate-swap-in grid-cols-5 gap-[10px] sm:gap-[14px]">
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
              <img src={scrap(name)} alt="" className="h-[86%] w-[86%] object-contain" />
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
