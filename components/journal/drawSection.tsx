import { useRef, useState } from "react";
import { APP_CARD, Row, SectionCopy, sticker } from "@/components/journal/ui";

// The app's daily draw (Onboarding V4 screen 12, StickerDrawScreen): magician Miuu over the cauldron,
// the day's hearts (two by default, sticker_reward_count), and "Draw a sticker". Here the card rises
// out of the cauldron with one of the newest packs' stickers.

const POOL: { name: string; title: string; pack: string }[] = [
  { name: "miuu-pumpkin", title: "Pumpkin Hug Miuu", pack: "Miuu's Cozy Autumn" },
  { name: "kiki-candy", title: "Candy Treat Kiki", pack: "Miuu's Cozy Autumn" },
  { name: "miuu-witch-hat", title: "Witch Hat Miuu", pack: "Miuu's Cozy Autumn" },
  { name: "joy-acorns", title: "Acorn Collector Joy", pack: "Miuu's Cozy Autumn" },
  { name: "happy-flower-miyomi", title: "Happy Flower Miyomi", pack: "Little Miuu & Friends" },
  { name: "little-wizard-miuu", title: "Little Wizard Miuu", pack: "Little Miuu & Friends" },
  { name: "toasty-cats", title: "Cozy Miuu & Miyomi", pack: "Little Miuu & Friends" },
  { name: "cookie-kiki", title: "Cookie Kiki", pack: "Little Miuu & Friends" },
  { name: "food-lavender-bubble-tea", title: "Lavender Bubble Tea", pack: "Everyday Food" },
  { name: "food-cozy-ramen", title: "Cozy Ramen", pack: "Everyday Food" },
];

const HEARTS_A_DAY = 2;

const Heart = ({ full }: { full: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-6 w-6 transition-all duration-300 ${full ? "scale-100" : "scale-90 opacity-30"}`}
    aria-hidden
  >
    <path
      d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.2 0 3.6 1.2 5.2 3 1.6-1.8 3-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"
      fill={full ? "#FF7FA6" : "#2B2240"}
    />
  </svg>
);

const DrawSection = () => {
  const [hearts, setHearts] = useState(HEARTS_A_DAY);
  const [drawn, setDrawn] = useState<(typeof POOL)[number] | null>(null);
  const [drawing, setDrawing] = useState(false);
  const order = useRef(0);
  const cauldronRef = useRef<HTMLImageElement>(null);

  const draw = () => {
    if (drawing || hearts === 0) return;
    setDrawing(true);
    setDrawn(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      cauldronRef.current?.animate(
        [
          { transform: "rotate(0)" },
          { transform: "rotate(-4deg)" },
          { transform: "rotate(4deg)" },
          { transform: "rotate(-3deg)" },
          { transform: "rotate(0)" },
        ],
        { duration: 600, easing: "ease-in-out" },
      );
    }
    window.setTimeout(
      () => {
        // a different one each time, so two draws never repeat
        const pick = POOL[(order.current * 3 + Math.floor(Math.random() * 3)) % POOL.length];
        order.current += 1;
        setDrawn(pick);
        setHearts((h) => h - 1);
        setDrawing(false);
      },
      reduce ? 0 : 600,
    );
  };

  return (
    <Row id="draw">
      <SectionCopy
        icon={sticker("little-wizard-miuu")}
        kicker="Sticker draw"
        title={
          <>
            A new sticker,
            <br />
            every day.
          </>
        }
      >
        Two free draws a day from Miuu&apos;s cauldron. Collect the newest packs and stick them anywhere in your
        journal.
      </SectionCopy>

      <div className="mx-auto w-full max-w-[440px]">
        <div
          className={`${APP_CARD} relative overflow-hidden bg-gradient-to-b from-[#EFE7FF] via-[#F7F2FF] to-white px-6 pb-8 pt-6 text-center`}
        >
          {/* the day's hearts */}
          <div className="flex items-center justify-center gap-1" aria-label={`${hearts} free draws left today`}>
            {Array.from({ length: HEARTS_A_DAY }, (_, i) => (
              <Heart key={i} full={i < hearts} />
            ))}
          </div>

          <div className="relative mx-auto mt-2 h-[300px] w-full max-w-[340px]">
            {/* Miuu steps aside, smaller, once a card is out */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/draw/miuu-magician.webp"
              alt="Miuu in a wizard hat with a wand"
              className={`absolute top-0 w-40 transition-all duration-500 ease-[cubic-bezier(0.3,1.3,0.5,1)] ${
                drawn ? "left-0 translate-x-[-12%] translate-y-6 scale-[0.7]" : "left-1/2 -translate-x-1/2"
              }`}
            />
            <div className="absolute bottom-0 left-1/2 w-52 -translate-x-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={cauldronRef} src="/images/draw/cauldron.webp" alt="" className="w-full origin-bottom" />
            </div>
            {/* the card rising out of the cauldron */}
            {drawn && (
              <div
                key={`${drawn.name}-${hearts}`}
                className="absolute bottom-14 right-2 z-10 w-44 animate-pop rounded-3xl bg-white p-4 shadow-[0_20px_40px_-16px_rgba(107,31,255,0.45)] ring-1 ring-violet/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sticker(drawn.name)} alt="" className="mx-auto w-28 animate-bob" />
                <p className="mt-2 text-sm font-extrabold leading-tight">{drawn.title}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-ink/45">{drawn.pack}</p>
              </div>
            )}
          </div>

          {hearts > 0 ? (
            <button
              type="button"
              onClick={draw}
              disabled={drawing}
              className="mt-4 rounded-full bg-violet px-7 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(107,31,255,0.7)] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            >
              {drawing ? "Stirring…" : "Draw a sticker"}
            </button>
          ) : (
            <div className="mt-4">
              <p className="text-sm font-semibold text-ink/60">That&apos;s today&apos;s two. Two more tomorrow!</p>
              <button
                type="button"
                onClick={() => {
                  setHearts(HEARTS_A_DAY);
                  setDrawn(null);
                }}
                className="mt-2 text-xs font-semibold text-violet hover:underline"
              >
                Try it again
              </button>
            </div>
          )}
        </div>
      </div>
    </Row>
  );
};

export default DrawSection;
