import { ReactNode } from "react";
import Image, { StaticImageData } from "next/image";
import writeEntry from "@/public/images/app/write-entry.png";
import calendar from "@/public/images/app/mood-calendar.png";
import stickerJar from "@/public/images/app/sticker-jar.png";
import folders from "@/public/images/app/folders-grid.png";
import gratitudeList from "@/public/images/app/gratitude-list.png";
import backupSettings from "@/public/images/app/backup-settings.jpg";
import appIcon from "@/public/images/app-icon.png";
import Reveal from "@/components/reveal";

// Everything you can add to a page, shown as chips on the writing card
const WRITE_TOOLS = ["Custom photo stickers", "Deco stickers", "Backgrounds", "Voice recording", "Drawing"];

const SectionHeading = () => (
  <Reveal className="mx-auto max-w-3xl text-center">
    <p className="text-sm font-bold uppercase tracking-widest text-violet">Features</p>
    <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
      A quiet corner for your day
    </h2>
    <p className="mt-4 text-base font-medium text-ink/70 sm:text-lg">
      Big day or small win, write a line or a whole page. Mood tracking, a gratitude list and a diary
      lock, all in one calm little app.
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
    <p className="mt-4 text-xs font-semibold text-white/70">Enter your passcode</p>
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
            <h3 className="font-display text-3xl font-extrabold">Write it down. Make it yours.</h3>
            <p className="mt-3 font-medium leading-relaxed text-ink/70">
              The proposal you finally sent, the dinner you&apos;re proud of, the day you just want to
              forget. Write it down, then drag, spin and resize stickers anywhere on the page.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {WRITE_TOOLS.map((tool) => (
                <li key={tool} className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold text-violet shadow-[0_4px_14px_-4px_rgba(106,28,246,0.18)] backdrop-blur-md">
                  {tool}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative -mb-8 mt-8 h-[300px] shrink-0 overflow-hidden sm:mt-0 sm:h-[360px] sm:w-[260px] sm:self-end">
            <div className="phone mx-auto w-[220px] translate-y-2 transition-transform duration-300 group-hover:-translate-y-1 sm:w-[240px]">
              <Image src={writeEntry} alt="A journal entry titled Finally hit send, with a sticker being placed" />
            </div>
          </div>
        </Card>

        <Card delay={100} glow="bg-violet/20">
          <h3 className="relative font-display text-3xl font-extrabold">Only yours</h3>
          <p className="relative mt-3 font-medium leading-relaxed text-ink/70">
            A little space for your private thoughts. Set a passcode and open it with Face ID. No
            feeds, no followers, no one peeking.
          </p>
          <LockIllustration />
        </Card>

        <Card glow="bg-[#FFC2D6]/45">
          <h3 className="relative font-display text-3xl font-extrabold">Mood tracker</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            Tag each entry with a mood sticker and see your moods this month, at a glance.
          </p>
          <PeekingPhone src={calendar} alt="Calendar with a mood sticker on each day" />
        </Card>

        <Card delay={100} glow="bg-[#BDF0D4]/55">
          <h3 className="relative font-display text-3xl font-extrabold">Watch your jar fill up</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            Every entry drops its mood sticker into this month&apos;s jar. Pull a new sticker every day
            and build a collection that&apos;s all yours.
          </p>
          <div className="relative -mx-8 flex h-[300px] items-center">
            <Image
              src={stickerJar}
              alt="October's sticker jar: 23 entries, each with its mood sticker"
              className="mx-auto w-full max-w-[440px] -rotate-3 transition-transform duration-300 group-hover:rotate-0"
            />
          </div>
        </Card>

        <Card delay={200} glow="bg-[#BFE6FF]/55">
          <h3 className="relative font-display text-3xl font-extrabold">Organize your way</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            Your diary, plans, food notes or goals: make a folder for each, with its own color and
            sticker cover.
          </p>
          <PeekingPhone src={folders} alt="Folders: My Journal, Plans and Food journal" />
        </Card>

        <Card glow="bg-[#FFD9A8]/45">
          <h3 className="relative font-display text-3xl font-extrabold">Hold on to the good moments</h3>
          <p className="relative mb-8 mt-3 font-medium leading-relaxed text-ink/70">
            A coworker who covered for you, a new bakery on the way home. Keep the small things
            you&apos;re thankful for, and come back to them on a harder day.
          </p>
          <PeekingPhone src={gratitudeList} alt="Gratitude list with four small thank-yous" />
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
