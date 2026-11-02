import { useCallback, useEffect, useRef, useState } from "react";
import GIFT_FRIENDS from "@/lib/giftFriends.json";
import { APP_CARD, RULED, Row, SectionCopy, sticker } from "@/components/journal/ui";

// The app's gifts (secret-note src/data/gifts/giftArt.json and the gifts strings in enUS.ts): save an
// entry and one of Miuu's pixel friends crawls in with a little treasure, leaves it on the entry, waves
// and crawls off. The sprites are the app's own sheets, drawn at 3× with no smoothing.

type Rect = [number, number, number, number];
type Frame = { r: Rect; a: [number, number] };
type Friend = {
  name: string;
  species: string;
  bio: string;
  sheet: [number, number];
  treasureSheet: [number, number];
  frames: Record<string, Frame>;
  treasures: { id: string; r: Rect; name: string; phrase: string }[];
};

const FRIENDS = GIFT_FRIENDS as unknown as Record<string, Friend>;
// The order friends visit in: the free ones first
const VISITORS = ["rocco", "tori", "poppy", "dubu", "suki", "olive", "lulu", "bomi", "benny", "digby"];

const S = 3; // pixel scale
const STEP_MS = 160; // a crawl step
const WAVE_MS = 220;

// One visit, in ms: in, drop, wave, a happy beat, out
const IN_MS = 1700;
const DROP_MS = 380;
const WAVE_FOR = 1000;
const HAPPY_MS = 420;
const OUT_MS = 1500;
const VISIT_MS = IN_MS + DROP_MS + WAVE_FOR + HAPPY_MS + OUT_MS;

const ease = (t: number) => 1 - Math.pow(1 - t, 2);

type Found = { friend: string; name: string; phrase: string; r: Rect; key: number; x?: number };

const TreasureArt = ({ friend, r, scale = S }: { friend: string; r: Rect; scale?: number }) => {
  const sheet = FRIENDS[friend].treasureSheet;
  return (
    <span
      aria-hidden
      className="block [image-rendering:pixelated]"
      style={{
        width: r[2] * scale,
        height: r[3] * scale,
        backgroundImage: `url(/images/gifts/${friend}-treasures.webp)`,
        backgroundSize: `${sheet[0] * scale}px ${sheet[1] * scale}px`,
        backgroundPosition: `-${r[0] * scale}px -${r[1] * scale}px`,
      }}
    />
  );
};

// A friend standing still, small, for the list
const FriendIdle = ({ friendKey }: { friendKey: string }) => {
  const friend = FRIENDS[friendKey];
  const [fx, fy, fw, fh] = (friend.frames["idle"] ?? friend.frames["crawl-a"]).r;
  const k = 1.5;
  return (
    <span className="grid h-[76px] place-items-end">
      <span
        aria-hidden
        className="block transition-transform duration-300 [image-rendering:pixelated] group-hover:-translate-y-1"
        style={{
          width: fw * k,
          height: fh * k,
          backgroundImage: `url(/images/gifts/${friendKey}-frames.webp)`,
          backgroundSize: `${friend.sheet[0] * k}px ${friend.sheet[1] * k}px`,
          backgroundPosition: `-${fx * k}px -${fy * k}px`,
        }}
      />
    </span>
  );
};

// The next visitor, half in from the stage's right edge with a "save it" bubble; a tap saves too
const Peek = ({ friendKey, onClick }: { friendKey: string; onClick: () => void }) => {
  const friend = FRIENDS[friendKey];
  const frame = friend.frames["idle"] ?? friend.frames["crawl-a"];
  const [fx, fy, fw, fh] = frame.r;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Save the entry so ${friend.name} can visit`}
      className="group absolute bottom-[18px] right-0 translate-x-[38%] animate-swap-in"
    >
      <span className="absolute -top-9 right-[52%] whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-bold text-violet shadow-card ring-1 ring-violet/15 animate-bob">
        psst… save it!
      </span>
      <span
        aria-hidden
        className="block origin-bottom animate-bob [image-rendering:pixelated] transition-transform group-hover:-translate-x-2"
        style={{
          width: fw * S,
          height: fh * S,
          backgroundImage: `url(/images/gifts/${friendKey}-frames.webp)`,
          backgroundSize: `${friend.sheet[0] * S}px ${friend.sheet[1] * S}px`,
          backgroundPosition: `-${fx * S}px -${fy * S}px`,
        }}
      />
    </button>
  );
};

const GiftSection = () => {
  const [found, setFound] = useState<Found[]>([]);
  const [visiting, setVisiting] = useState<string | null>(null);
  const [dropped, setDropped] = useState<Found | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const visits = useRef(0);
  const raf = useRef(0);

  // Draws one frame of the friend with its anchor (its feet) at x on the stage's ground line
  const draw = (key: string, frameName: string, x: number) => {
    const friend = FRIENDS[key];
    const el = spriteRef.current;
    const stage = stageRef.current;
    const frame = friend.frames[frameName] ?? friend.frames["idle"];
    if (!el || !stage || !frame) return;
    const [fx, fy, fw, fh] = frame.r;
    const ground = stage.clientHeight - 18;
    el.style.width = `${fw * S}px`;
    el.style.height = `${fh * S}px`;
    el.style.backgroundImage = `url(/images/gifts/${key}-frames.webp)`;
    el.style.backgroundSize = `${friend.sheet[0] * S}px ${friend.sheet[1] * S}px`;
    el.style.backgroundPosition = `-${fx * S}px -${fy * S}px`;
    el.style.transform = `translate3d(${x - frame.a[0] * S}px, ${ground - frame.a[1] * S}px, 0)`;
  };

  const visit = useCallback((chosen?: string) => {
    if (visiting) return;
    const key = chosen ?? VISITORS[visits.current % VISITORS.length];
    const friend = FRIENDS[key];
    const treasure = friend.treasures[Math.floor(visits.current / VISITORS.length) % friend.treasures.length];
    visits.current += 1;
    setVisiting(key);
    setDropped(null);
    setToast(null);

    const width = stageRef.current?.clientWidth ?? 400;
    const startX = width + 70;
    const stopX = width * 0.62;
    const endX = -90;
    // the treasure is left just in front of where the friend stops
    const gift: Found = { friend: key, name: treasure.name, phrase: treasure.phrase, r: treasure.r, key: visits.current, x: stopX - 70 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDropped(gift);
      setFound((prev) => [gift, ...prev].slice(0, 6));
      setToast(`${friend.name} stopped by and left ${treasure.phrase}`);
      setVisiting(null);
      return;
    }

    const t0 = performance.now();
    let droppedYet = false;
    const tick = (now: number) => {
      const t = now - t0;
      if (t < IN_MS) {
        const x = startX + (stopX - startX) * ease(t / IN_MS);
        draw(key, Math.floor(t / STEP_MS) % 2 ? "crawl-b" : "crawl-a", x);
      } else if (t < IN_MS + DROP_MS) {
        draw(key, "drop", stopX);
      } else if (t < IN_MS + DROP_MS + WAVE_FOR) {
        if (!droppedYet) {
          droppedYet = true;
          setDropped(gift);
          setToast(`${friend.name} stopped by and left ${treasure.phrase}`);
        }
        draw(key, Math.floor((t - IN_MS - DROP_MS) / WAVE_MS) % 2 ? "wave-b" : "wave-a", stopX);
      } else if (t < IN_MS + DROP_MS + WAVE_FOR + HAPPY_MS) {
        draw(key, "happy", stopX);
      } else if (t < VISIT_MS) {
        const p = (t - IN_MS - DROP_MS - WAVE_FOR - HAPPY_MS) / OUT_MS;
        draw(key, Math.floor(t / STEP_MS) % 2 ? "crawl-b-empty" : "crawl-a-empty", stopX + (endX - stopX) * p * p);
      } else {
        setFound((prev) => [gift, ...prev].slice(0, 6));
        setVisiting(null);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [visiting]);

  // The first friend comes by on their own when the section is in view
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        window.setTimeout(() => visit(), 400);
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const slots = Array.from({ length: 6 }, (_, i) => found[i] ?? null);
  const nextKey = VISITORS[visits.current % VISITORS.length];

  return (
    <Row flip id="friends">
      <SectionCopy
        icon={sticker("happy-flower-miyomi")}
        kicker="Friends"
        title={
          <>
            Write, and a
            <br />
            friend stops by.
          </>
        }
        extra={
          <ul className="mt-8 grid grid-cols-5 gap-x-2 gap-y-4">
            {VISITORS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => visit(key)}
                  disabled={!!visiting}
                  title={FRIENDS[key].bio}
                  className={`group flex w-full flex-col items-center rounded-2xl py-2 transition-colors hover:bg-white disabled:cursor-default ${
                    visiting === key ? "bg-white ring-1 ring-violet/30" : ""
                  }`}
                >
                  <FriendIdle friendKey={key} />
                  <span className="mt-1 text-[11px] font-bold">{FRIENDS[key].name}</span>
                  <span className="text-[10px] font-medium text-ink/40">{FRIENDS[key].species}</span>
                </button>
              </li>
            ))}
          </ul>
        }
      >
        Save an entry and one of Miuu&apos;s little friends crawls in with a tiny treasure for it. Keep every find in
        your treasure book. Tap a friend to have them visit.
      </SectionCopy>

      <div className="mx-auto w-full max-w-[460px]">
        {/* today's entry, where the friend leaves the treasure */}
        <div className={`${APP_CARD} overflow-hidden`}>
          <div ref={stageRef} className={`${RULED} relative h-[300px] overflow-hidden px-6 pt-6`}>
            <p className="text-[13px] font-bold">
              Today <span className="ms-1 text-[11px] font-semibold tracking-wide text-ink/45">SAVED</span>
            </p>
            <p className="mt-3 text-lg font-extrabold tracking-tight">Cozy night in.</p>
            <p className="mt-1 text-[15px] font-medium leading-[32px] text-ink/70">
              Tea, a blanket and the book I keep starting over. Good day.
            </p>

            {dropped && (
              <div key={dropped.key} className="absolute bottom-[18px] animate-pop" style={{ left: dropped.x ?? 120 }}>
                <TreasureArt friend={dropped.friend} r={dropped.r} />
              </div>
            )}
            <div ref={spriteRef} aria-hidden className="absolute left-0 top-0 [image-rendering:pixelated]" />

            {/* the next friend, peeking in from the edge until you save */}
            {!visiting && <Peek friendKey={nextKey} onClick={() => visit()} />}

            {toast && (
              <p
                key={toast}
                className="absolute inset-x-4 top-[150px] animate-swap-in rounded-full bg-white/95 px-4 py-2 text-center text-xs font-semibold shadow-card ring-1 ring-ink/[0.06]"
                role="status"
              >
                {toast}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-ink/[0.06] px-5 py-3.5">
            <span className="text-xs font-semibold text-ink/55">
              {visiting
                ? `${FRIENDS[visiting].name} the ${FRIENDS[visiting].species.toLowerCase()} is here!`
                : "Someone's waiting to visit…"}
            </span>
            <button
              type="button"
              onClick={() => visit()}
              disabled={!!visiting}
              className="relative rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(107,31,255,0.8)] transition-[opacity,transform] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              {/* a soft ring that keeps asking for a tap while nobody is visiting */}
              {!visiting && (
                <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-violet/40 [animation-duration:1.8s]" />
              )}
              <span className="relative">Save entry ✨</span>
            </button>
          </div>
        </div>

        {/* the treasure book */}
        <div className="mt-4 rounded-[24px] bg-white/70 p-4 ring-1 ring-ink/[0.06]">
          <p className="px-1 text-xs font-bold text-ink/50">Treasure book</p>
          <ul className="mt-3 grid grid-cols-6 gap-2">
            {slots.map((item, i) => (
              <li
                key={item ? item.key : `empty-${i}`}
                title={item ? `${item.name} from ${FRIENDS[item.friend].name}` : undefined}
                className={`grid aspect-square place-items-center rounded-2xl ${
                  item ? "animate-pop bg-[#FFF6E6] ring-1 ring-[#F1DEC0]" : "border-[1.5px] border-dashed border-ink/10"
                }`}
              >
                {item && <TreasureArt friend={item.friend} r={item.r} scale={2.5} />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Row>
  );
};

export default GiftSection;
