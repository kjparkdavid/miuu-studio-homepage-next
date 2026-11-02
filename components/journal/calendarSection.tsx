import { useEffect, useState } from "react";
import { APP_CARD, Row, SectionCopy, Segmented, face, sticker } from "@/components/journal/ui";

// The app's Calendar (Figma page 31): a month of days, each drawing its entry's sticker, a photo from
// that day, or the day's mood, as the chips above it choose (CALENDAR_VIEWS: stickers, photos, moods).
type View = "stickers" | "photos" | "moods";

const VIEWS: { key: View; label: string }[] = [
  { key: "stickers", label: "Stickers" },
  { key: "photos", label: "Photos" },
  { key: "moods", label: "Moods" },
];

const DAY_STICKERS = [
  "food-cozy-ramen",
  "happy-flower-miyomi",
  "joy-acorns",
  "food-iced-coffee",
  "cookie-kiki",
  "miuu-pumpkin",
  "food-kimbap",
  "computer-work-miuu",
  "emoji-heart",
  "kiki-candy",
  "food-rice-balls",
  "shy-shy-miyomi",
  "miuu-witch-hat",
  "food-lavender-bubble-tea",
  "toasty-cats",
  "birthday-cake-miuu",
  "frog-rain-tea",
  "food-strawberry-shortcake",
  "little-wizard-miuu",
  "miyomi-autumn-leaves",
];
const DAY_MOODS = ["happy", "calm", "loved", "sleepy", "proud", "butterflies"];
// A camera roll of small cozy things (made for the site with Codex image generation)
const DAY_PHOTOS = ["latte", "books", "candle", "leaves", "cat", "cake", "rain", "journal", "bread", "sunset", "ramen", "tulips"];

// Which days have an entry, and which of those have a photo: the same quiet pattern every visit
const hasEntry = (day: number) => (day * 7) % 10 < 7;
const hasPhoto = (day: number) => day % 3 !== 1;

// This month once it has a couple of weeks in it; before that, last month, whole, so the page is
// never a nearly empty grid. `today` past the month's end means every day is behind us.
const useMonth = () => {
  const [month, setMonth] = useState({ name: "October 2026", firstWeekday: 4, days: 31, today: 32 });
  useEffect(() => {
    const now = new Date();
    const early = now.getDate() < 15;
    const first = new Date(now.getFullYear(), now.getMonth() - (early ? 1 : 0), 1);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    setMonth({
      name: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      firstWeekday: first.getDay(),
      days,
      today: early ? days + 1 : now.getDate(),
    });
  }, []);
  return month;
};

// One day: its art in a white circle, the date under it, today in a violet pill
const Day = ({ day, today, view, order }: { day: number; today: number; view: View; order: number }) => {
  const written = day <= today && hasEntry(day);
  const n = day - 1;
  let art: React.ReactNode = null;
  if (written && view === "stickers") {
    art = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={sticker(DAY_STICKERS[n % DAY_STICKERS.length])} alt="" className="h-[78%] w-[78%] object-contain" />
    );
  } else if (written && view === "moods") {
    // eslint-disable-next-line @next/next/no-img-element
    art = <img src={face(DAY_MOODS[(n * 5) % DAY_MOODS.length])} alt="" className="h-full w-full" />;
  } else if (written && view === "photos" && hasPhoto(day)) {
    art = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`/images/photos/${DAY_PHOTOS[(n * 7) % DAY_PHOTOS.length]}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative grid aspect-square w-full max-w-[44px] place-items-center overflow-hidden rounded-full ${
          art ? "animate-pop bg-white shadow-[0_2px_6px_-2px_rgba(43,34,64,0.2)]" : "bg-white/70 ring-1 ring-ink/[0.05]"
        }`}
        style={art ? { animationDelay: `${order * 14}ms` } : undefined}
      >
        {art}
      </div>
      <span
        className={`text-[11px] font-semibold ${
          day === today ? "rounded-full bg-violet px-1.5 text-white" : day > today ? "text-ink/25" : "text-ink/45"
        }`}
      >
        {day}
      </span>
    </div>
  );
};

const CalendarSection = () => {
  const [view, setView] = useState<View>("stickers");
  const month = useMonth();
  const blanks = Array.from({ length: month.firstWeekday });
  const days = Array.from({ length: month.days }, (_, i) => i + 1);

  return (
    <Row id="calendar">
      <SectionCopy
        icon={face("happy")}
        kicker="Calendar"
        title={
          <>
            Your month,
            <br />
            at a glance.
          </>
        }
      >
        See the month by its stickers, by the photos you kept, or by how each day felt. One look tells you how it has
        really been.
      </SectionCopy>

      <div className="mx-auto w-full max-w-[440px]">
        <div className="mb-4 flex justify-center">
          <Segmented label="Calendar view" options={VIEWS} value={view} onChange={setView} />
        </div>
        <div className={`${APP_CARD} bg-[#FAF9FC] p-5 sm:p-6`}>
          <div className="flex border-b border-ink/10 text-center text-sm font-semibold">
            <span className="flex-1 pb-2 text-ink/35">Journals</span>
            <span className="-mb-px flex-1 border-b-2 border-ink pb-2">Calendar</span>
          </div>
          <p className="mt-5 text-lg font-extrabold tracking-tight">{month.name}</p>
          <div className="mt-3 grid grid-cols-7 gap-x-1.5 gap-y-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d} className="text-[11px] font-medium text-ink/40">
                {d}
              </span>
            ))}
            {blanks.map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {days.map((day, i) => (
              <Day key={`${view}-${day}`} day={day} today={month.today} view={view} order={i} />
            ))}
          </div>
        </div>
      </div>
    </Row>
  );
};

export default CalendarSection;
