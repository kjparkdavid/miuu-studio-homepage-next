import Image from "next/image";
import appIcon from "@/public/images/app-icon.png";
import Reveal from "@/components/reveal";
import { APP_CARD, sticker } from "@/components/journal/ui";

// The quieter features, side by side: the lock, folders, backup and the languages

const LANGUAGES = [
  "English",
  "한국어",
  "日本語",
  "中文",
  "Español",
  "Français",
  "Deutsch",
  "Português",
  "Italiano",
  "ไทย",
  "Türkçe",
  "Bahasa Indonesia",
  "Русский",
  "العربية",
];

const FOLDERS = [
  { name: "My Journal", tint: "#F9DDE6", icon: "toasty-cats" },
  { name: "Plans", tint: "#DDF3E7", icon: "computer-work-miuu" },
  { name: "Food journal", tint: "#FFF0C7", icon: "food-rice-balls" },
];

const Card = ({
  title,
  children,
  delay = 0,
  art,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  art: React.ReactNode;
}) => (
  <Reveal delay={delay} className={`${APP_CARD} flex flex-col p-7`}>
    <div className="flex h-36 items-center justify-center">{art}</div>
    <h3 className="mt-6 text-lg font-extrabold tracking-[-0.02em]">{title}</h3>
    <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink/55">{children}</p>
  </Reveal>
);

const MoreSection = () => (
  <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
    <Reveal>
      <h2 className="font-display text-4xl font-extrabold leading-[1.06] tracking-[-0.035em] sm:text-5xl">
        And the little things.
      </h2>
    </Reveal>
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        title="Only yours"
        art={
          <div className="w-40 rounded-3xl bg-night p-4 text-center">
            <Image src={appIcon} alt="" width={36} height={36} className="mx-auto rounded-[10px]" />
            <div className="mt-3 flex justify-center gap-2">
              {[1, 1, 0, 0].map((on, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${on ? "bg-white" : "ring-1 ring-inset ring-white/40"}`}
                />
              ))}
            </div>
            <p className="mt-3 text-[10px] font-semibold text-white/50">Face ID</p>
          </div>
        }
      >
        A passcode and Face ID. No feeds, no followers, no one peeking.
      </Card>
      <Card
        title="Organize your way"
        delay={80}
        art={
          <div className="flex gap-2">
            {FOLDERS.map((f, i) => (
              <div
                key={f.name}
                className={`flex h-28 w-20 flex-col items-center justify-center rounded-2xl ${i === 1 ? "-translate-y-2" : ""}`}
                style={{ background: f.tint }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sticker(f.icon)} alt="" className="w-12" />
                <p className="mt-2 text-[10px] font-bold">{f.name}</p>
              </div>
            ))}
          </div>
        }
      >
        A folder for your diary, plans, food notes or goals, each with its own colour and sticker cover.
      </Card>
      <Card
        title="Never lose a page"
        delay={160}
        art={
          <div className="w-52 rounded-2xl bg-white p-3 ring-1 ring-ink/10">
            <div className="flex items-center gap-2 rounded-xl bg-[#EEFAF3] px-3 py-2">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#4CB782] text-[9px] text-white">✓</span>
              <span className="text-[11px] font-bold">Auto-backup is on</span>
            </div>
            <p className="mt-2 px-1 text-[10px] font-medium text-ink/50">Last backup: today</p>
            <div className="mt-2 rounded-full bg-violet py-1.5 text-center text-[10px] font-bold text-white">
              Manage backup
            </div>
          </div>
        }
      >
        Back up with Apple or Google and bring every entry to a new phone. With Plus, it backs up after you write.
      </Card>
    </div>
    <Reveal className="mt-4 overflow-hidden rounded-[28px] bg-white/60 py-5 ring-1 ring-ink/[0.06]">
      {/* the fourteen languages drift past */}
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-sm font-semibold text-ink/55">
        {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
          <span key={i}>{lang}</span>
        ))}
      </div>
    </Reveal>
  </section>
);

export default MoreSection;
