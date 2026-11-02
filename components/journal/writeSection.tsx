import { useEffect, useState } from "react";
import ScrapbookPage from "@/components/journal/scrapbookPage";
import { APP_CARD, Chip, RULED, Row, SectionCopy, Segmented, scrap, sticker } from "@/components/journal/ui";

type Mode = "diary" | "scrapbook";

const MODES: { key: Mode; label: string }[] = [
  { key: "scrapbook", label: "Scrapbook" },
  { key: "diary", label: "Diary" },
];

// Today as the editor's header writes it: "Nov 2, 2026" and "SUNDAY"
const useToday = () => {
  const [today, setToday] = useState({ date: "Today", weekday: "" });
  useEffect(() => {
    const now = new Date();
    setToday({
      date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      weekday: now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
    });
  }, []);
  return today;
};

// The editor's bar: back, undo and redo, and the violet Save
const EditorBar = () => (
  <div className="flex items-center justify-between px-5 pt-5">
    <span className="text-xl leading-none text-ink/50">‹</span>
    <div className="flex items-center gap-3">
      <span className="text-sm text-violet/40">↶</span>
      <span className="text-sm text-violet/40">↷</span>
      <span className="rounded-full bg-violet px-4 py-1.5 text-xs font-bold text-white">Save</span>
    </div>
  </div>
);

const DateRow = ({ date, weekday }: { date: string; weekday: string }) => (
  <div className="flex items-center justify-between">
    <p className="text-[13px] font-bold">
      {date} <span className="ms-1 text-[11px] font-semibold tracking-wide text-ink/45">{weekday}</span>
    </p>
    <Chip icon={sticker("toasty-cats")}>My journals</Chip>
  </div>
);

// A sticker picked up in the editor: a dashed violet box, delete, rotate, done and resize
const Selected = ({ name, className }: { name: string; className: string }) => (
  <div className={`absolute ${className}`}>
    <div className="relative rotate-[10deg] rounded-md border-[1.5px] border-dashed border-violet/70 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sticker(name)} alt="" className="w-20 animate-bob sm:w-24" />
      <span className="absolute -left-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-[#F05A5A] text-[11px] font-bold text-white">
        ✕
      </span>
      <span className="absolute -right-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-violet text-[12px] text-white">
        ↻
      </span>
      <span className="absolute -bottom-3 -left-3 grid h-6 w-6 place-items-center rounded-full bg-[#4CB782] text-[11px] font-bold text-white">
        ✓
      </span>
      <span className="absolute -bottom-3 -right-3 grid h-6 w-6 place-items-center rounded-full bg-violet text-[10px] text-white">
        ⤡
      </span>
    </div>
  </div>
);

const Diary = () => {
  const today = useToday();
  return (
    <div className={`${APP_CARD} overflow-hidden bg-gradient-to-b from-[#FFF3F6] via-white to-white`}>
      <EditorBar />
      <div className="relative px-6 pb-48 pt-2">
        {/* the entry's sticker, in its circle at the top of the page */}
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white shadow-[0_6px_20px_-8px_rgba(43,34,64,0.3)] ring-1 ring-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sticker("computer-work-miuu")} alt="" className="h-14 w-14" />
        </div>
        <div className="mt-4">
          <DateRow {...today} />
        </div>
        <p className="mt-5 text-xl font-extrabold tracking-tight">Finally hit send.</p>
        <p className="mt-2 text-[15px] font-medium leading-[28px] text-ink/75">
          Sent the proposal I&apos;d been dreading all week. Treated myself to ramen and a strawberry shortcake. No
          regrets.
          <br />
          <br />
          Small wins count. Sleeping in tomorrow.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sticker("food-cozy-ramen")}
          alt=""
          className="absolute bottom-10 left-6 w-20 -rotate-6 animate-bob [animation-delay:0.6s]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sticker("food-strawberry-shortcake")}
          alt=""
          className="absolute bottom-14 left-[34%] w-16 rotate-6 animate-bob [animation-delay:1.2s]"
        />
        <Selected name="food-iced-coffee" className="bottom-8 right-8" />
      </div>
    </div>
  );
};

const Scrapbook = () => <ScrapbookPage {...useToday()} />;

const WriteSection = () => {
  const [mode, setMode] = useState<Mode>("scrapbook");
  return (
    <Row id="features">
      <SectionCopy
        icon={sticker("computer-work-miuu")}
        kicker="Write"
        title={
          <>
            Write a little.
            <br />
            Stick a lot.
          </>
        }
        extra={
          <div className="mt-7 flex flex-wrap gap-2">
            {["Photos", "Stickers", "Washi tape", "Backgrounds", "Voice notes", "Drawing"].map((tool) => (
              <span key={tool} className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-xs font-semibold text-ink/65">
                {tool}
              </span>
            ))}
          </div>
        }
      >
        One line on a quiet page, or a whole scrapbook spread with photos, tape and ribbons. Drag, spin and resize
        anything, anywhere.
      </SectionCopy>
      <div className="mx-auto w-full max-w-[440px]">
        <div className="mb-4 flex justify-center">
          <Segmented label="Page style" options={MODES} value={mode} onChange={setMode} />
        </div>
        <div key={mode} className="animate-swap-in">
          {mode === "diary" ? <Diary /> : <Scrapbook />}
        </div>
      </div>
    </Row>
  );
};

export default WriteSection;
