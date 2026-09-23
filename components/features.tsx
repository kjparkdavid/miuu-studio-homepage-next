import { ReactNode } from "react";
import Image, { StaticImageData } from "next/image";
import journalNote from "@/public/images/app/journal-note.jpg";
import stickerPlacing from "@/public/images/app/sticker-placing.jpg";
import calendar from "@/public/images/app/calendar.jpg";
import stickerDraw from "@/public/images/app/sticker-draw.jpg";
import collection from "@/public/images/app/collection.jpg";
import folders from "@/public/images/app/folders.png";
import thanksJar from "@/public/images/app/thanks-jar.jpg";
import noteMom from "@/public/images/app/thanks-note-mom.png";
import backupSettings from "@/public/images/app/backup-settings.jpg";
import appIcon from "@/public/images/app-icon.png";
import Reveal from "@/components/reveal";

// Everything you can add to a page, shown as chips on the Write freely card
const WRITE_TOOLS = ["Custom photo stickers", "Deco stickers", "Backgrounds", "Voice recording", "Drawing"];

const SectionHeading = () => (
  <Reveal className="mx-auto max-w-3xl text-center">
    <p className="text-sm font-bold uppercase tracking-widest text-violet">Features</p>
    <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
      A cozy journal app that feels like a hug
    </h2>
    <p className="mt-4 text-base font-medium text-ink/70 sm:text-lg">
      No pressure, no blank-page panic. Daily journal prompts, a mood tracker and a private diary lock,
      all in one soft little app.
    </p>
  </Reveal>
);

// White card with a soft colour glow rising from behind its screenshot
const Card = ({
  glow,
  className = "",
  delay = 0,
  children,
}: {
  glow: string;
  className?: string;
  delay?: number;
  children: ReactNode;
}) => (
  <Reveal
    as="article"
    delay={delay}
    className={`group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-card ring-1 ring-ink/5 ${className}`}
  >
    <div className={`pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[120%] -translate-x-1/2 rounded-full blur-3xl ${glow}`} aria-hidden />
    <div className="relative contents">{children}</div>
  </Reveal>
);

// A phone screenshot that peeks up from the bottom edge of its card
const PeekingPhone = ({ src, alt, className = "" }: { src: StaticImageData; alt: string; className?: string }) => (
  <div className={`relative -mb-8 h-[300px] overflow-hidden ${className}`}>
    <div className="phone mx-auto w-[220px] translate-y-2 transition-transform duration-300 group-hover:-translate-y-1">
      <Image src={src} alt={alt} />
    </div>
  </div>
);

const LockIllustration = () => (
  <div className="relative mx-auto mt-8 w-[220px] rounded-3xl bg-night p-6 text-center shadow-phone">
    <Image src={appIcon} alt="" width={56} height={56} className="mx-auto rounded-2xl" />
    <p className="mt-4 text-xs font-semibold text-white/70">Please enter your password</p>
    <div className="mt-4 flex justify-center gap-3">
      {[true, true, false, false].map((filled, i) => (
        <span
          key={i}
          className={`h-10 w-10 rounded-xl border-2 ${filled ? "border-violet-soft bg-violet-soft" : "border-white/30"}`}
        />
      ))}
    </div>
  </div>
);

const Features = () => {
  return (
    <section id="features" className="scroll-mt-16 bg-canvas px-4 py-24 sm:px-6">
      <SectionHeading />

      <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card glow="bg-violet-soft/30" className="flex flex-col sm:col-span-2 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative sm:max-w-xs sm:py-4">
            <h3 className="font-display text-3xl font-extrabold">Write freely</h3>
            <p className="mt-3 font-medium leading-relaxed text-ink/70">
              Stuck? Miuu gives you a gentle journal prompt to get going. Write a line or a whole page,
              then make it yours: drag, spin and resize stickers anywhere on the page.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {WRITE_TOOLS.map((tool) => (
                <li key={tool} className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold text-violet shadow-[0_4px_14px_-4px_rgba(106,28,246,0.18)] backdrop-blur-md">
                  {tool}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto mt-8 h-[300px] w-full max-w-[380px] sm:mt-0 sm:h-[320px] sm:flex-1">
            <div className="phone absolute left-0 top-8 w-[58%] max-w-[210px] -rotate-3">
              <Image src={journalNote} alt="A journal page: Miuu asks what made you smile today" />
            </div>
            <div className="phone absolute right-0 top-2 w-[58%] max-w-[210px] rotate-3 transition-transform duration-300 group-hover:-translate-y-1">
              <Image src={stickerPlacing} alt="Placing a sticker on a journal page, with rotate and resize handles" />
            </div>
          </div>
        </Card>

        <Card delay={100} glow="bg-violet/20">
          <h3 className="relative font-display text-3xl font-extrabold">Only yours</h3>
          <p className="relative mt-3 font-medium leading-relaxed text-ink/70">
            A private diary with a lock: set a passcode and open it with Face ID. No feeds, no
            followers, no one peeking.
          </p>
          <LockIllustration />
        </Card>

        <Card glow="bg-[#FFC2D6]/45">
          <h3 className="relative font-display text-3xl font-extrabold">Mood tracker</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            Tag each entry with a mood sticker and see your whole month of moods on the calendar.
          </p>
          <PeekingPhone src={calendar} alt="Calendar with a mood sticker on each day" />
        </Card>

        <Card delay={100} glow="bg-[#BDF0D4]/55">
          <h3 className="relative font-display text-3xl font-extrabold">Fill your shelf</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            Pull a new sticker every day and collect hundreds of cute Miuu friends for your shelf.
          </p>
          <div className="relative mx-auto h-[300px] w-full max-w-[340px]">
            <div className="phone absolute left-0 top-10 w-[55%] max-w-[190px] -rotate-6">
              <Image src={stickerDraw} alt="The daily sticker draw" />
            </div>
            <div className="phone absolute right-0 top-2 w-[60%] max-w-[200px] rotate-3 transition-transform duration-300 group-hover:-translate-y-1">
              <Image src={collection} alt="Sticker collection shelf" />
            </div>
          </div>
        </Card>

        <Card delay={200} glow="bg-[#BFE6FF]/55">
          <h3 className="relative font-display text-3xl font-extrabold">Organize your way</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            Keep separate journals and folders for your diary, plans, food notes or goals, each with its
            own color and sticker cover.
          </p>
          <div className="relative -mb-8 h-[300px] overflow-hidden">
            <Image
              src={folders}
              alt="Folders: My Journal, Plan and Food Note"
              className="mx-auto w-[230px] translate-y-2 transition-transform duration-300 group-hover:-translate-y-1"
            />
          </div>
        </Card>

        <Card glow="bg-[#FFD9A8]/45">
          <h3 className="relative font-display text-3xl font-extrabold">Gratitude jar</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            Keep a daily gratitude journal: drop in the small things you&apos;re thankful for, then
            tap the jar to unfold one on a harder day.
          </p>
          <div className="relative">
            <PeekingPhone src={thanksJar} alt="The Thanks jar" />
            <Image
              src={noteMom}
              alt="Thank you, Mom, for calling just to see how I was doing."
              className="absolute -right-3 top-4 w-32 rotate-6 drop-shadow-md"
            />
          </div>
        </Card>

        <Card delay={100} glow="bg-violet-soft/30" className="flex flex-col gap-8 lg:col-span-2 lg:flex-row">
          <div className="relative flex flex-col gap-8 lg:flex-1">
            <div>
              <h3 className="font-display text-3xl font-extrabold">Never lose a page</h3>
              <p className="mt-3 font-medium leading-relaxed text-ink/70">
                Sign in with Apple or Google to back up your journal and bring every entry to a new
                phone. With Plus, it backs up automatically after you write.
              </p>
            </div>
            <div className="rounded-2xl bg-lilac/60 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/50">Speaks your language</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/80">
                English · 한국어 · 日本語 · 中文 · Español · Français · Deutsch · Português · Italiano ·
                ไทย · Türkçe · Bahasa Indonesia · Русский · العربية
              </p>
            </div>
          </div>
          <PeekingPhone
            src={backupSettings}
            alt="Settings: Auto-backup is on, last backup today"
            className="lg:-mt-2 lg:h-auto lg:w-[240px] lg:self-stretch"
          />
        </Card>
      </div>
    </section>
  );
};

export default Features;
