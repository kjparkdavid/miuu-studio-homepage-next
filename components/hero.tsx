import Image from "next/image";
import appIcon from "@/public/images/app-icon.png";
import writeEntry from "@/public/images/app/write-entry.png";
import journals from "@/public/images/app/journals-list.png";
import calendar from "@/public/images/app/mood-calendar.png";
import studyMiuu from "@/public/images/outfits/study.png";
import StoreBadges from "@/components/storeBadges";
import { PLAY_STATS, SOCIAL_LINKS } from "@/lib/links";
import instagram from "@/public/images/footer/instagram.png";
import tiktok from "@/public/images/footer/tiktok.png";
import youtube from "@/public/images/footer/youtube.png";

const SOCIAL_ICONS = { Instagram: instagram, TikTok: tiktok, YouTube: youtube };

const Sparkle = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" className={`absolute animate-twinkle fill-current ${className}`} aria-hidden>
    <path d="M12 0c.8 6.2 5 10.6 12 12-7 1.4-11.2 5.8-12 12-.8-6.2-5-10.6-12-12C7 10.6 11.2 6.2 12 0Z" />
  </svg>
);

// Little floating props around Miuu, drawn to match the app's flat sticker style
const JournalProp = ({ className }: { className: string }) => (
  <svg viewBox="0 0 80 64" className={`absolute ${className}`} aria-hidden>
    <g transform="rotate(-8 40 32)">
      <rect x="6" y="8" width="32" height="46" rx="6" fill="#fff" />
      <rect x="42" y="8" width="32" height="46" rx="6" fill="#EFE9FF" />
      <rect x="12" y="18" width="18" height="4" rx="2" fill="#A77EFF" />
      <rect x="12" y="27" width="14" height="4" rx="2" fill="#A77EFF" />
      <path d="M58 24l2 4 4 1-4 1-2 4-2-4-4-1 4-1z" fill="#FFD66B" />
    </g>
  </svg>
);

const JarProp = ({ className }: { className: string }) => (
  <svg viewBox="0 0 72 80" className={`absolute ${className}`} aria-hidden>
    <g transform="rotate(10 36 40)">
      <rect x="18" y="4" width="36" height="12" rx="5" fill="#F9C4D2" />
      <rect x="8" y="14" width="56" height="60" rx="16" fill="#fff" />
      <rect x="14" y="20" width="44" height="48" rx="12" fill="#EFE9FF" />
      <path d="M26 30l3 6 6 1-6 2-3 6-2-6-6-2 6-1z" fill="#FFD66B" />
      <polygon points="46,32 54,36 54,46 46,50 38,46 38,36" fill="#F9A8C2" />
      <path d="M30 52l6 6M36 52l-6 6" stroke="#A77EFF" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="40" y="54" width="12" height="5" rx="2.5" fill="#F9A8C2" />
    </g>
  </svg>
);

const PencilProp = ({ className }: { className: string }) => (
  <svg viewBox="0 0 100 40" className={`absolute ${className}`} aria-hidden>
    <g transform="rotate(12 50 20)">
      <rect x="18" y="12" width="70" height="16" rx="3" fill="#FFD66B" stroke="#fff" strokeWidth="3" />
      <path d="M18 12L4 20l14 8z" fill="#FDE9C8" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <rect x="82" y="12" width="10" height="16" rx="3" fill="#F9A8C2" stroke="#fff" strokeWidth="3" />
    </g>
  </svg>
);

const MiuuAtDesk = () => (
  <div className="relative mx-auto aspect-square w-full">
    {/* soft lilac desk Miuu sits behind */}
    <div className="absolute inset-x-[12%] bottom-[14%] h-[30%] rounded-[2rem] bg-lilac ring-1 ring-violet/10" aria-hidden>
      <div className="absolute inset-x-6 top-3 h-px bg-white" />
      <div className="absolute inset-x-[18%] -bottom-1 h-1/2 rounded-b-2xl rounded-t-md bg-violet-soft/30 ring-1 ring-violet/10" />
    </div>
    <Image
      src={studyMiuu}
      alt="Miuu with glasses, a pencil and a journal"
      priority
      className="absolute inset-x-[16%] bottom-[20%] w-[68%] animate-float-slow"
    />

    <JournalProp className="left-0 top-[30%] w-14 animate-float drop-shadow-md sm:w-16" />
    <JarProp className="right-0 top-[18%] w-14 animate-float drop-shadow-md [animation-delay:1.2s] sm:w-16" />
    <PencilProp className="-right-2 bottom-[4%] w-16 animate-float drop-shadow-md [animation-delay:2s] sm:w-20" />

    <Sparkle className="left-[22%] top-[12%] h-5 w-5 text-violet-soft" />
    <Sparkle className="right-[30%] top-[4%] h-6 w-6 text-violet-soft [animation-delay:1s]" />
    <Sparkle className="bottom-[16%] left-[20%] h-4 w-4 text-violet-soft [animation-delay:1.5s]" />
  </div>
);

// Journals list, a journal entry and the mood calendar fanned out beside the headline. Each phone
// has three layers: the entrance, a gentle float (offset so they bob out of step) and its tilt.
const HeroPhones = () => (
  <div className="relative mx-auto flex w-full max-w-[520px] items-start justify-center pt-4">
    <div className="-me-6 mt-12 w-[32%] animate-fade-up [animation-delay:550ms]">
      <div className="animate-float [animation-delay:0.8s]">
        <div className="phone -rotate-6">
          <Image src={journals} alt="Journals: this month's sticker jar and recent entries" />
        </div>
      </div>
    </div>
    <div className="relative z-10 w-[38%] animate-fade-up [animation-delay:450ms]">
      <div className="animate-float-slow">
        <div className="phone">
          <Image src={writeEntry} alt="A journal entry titled Finally hit send, with stickers" priority />
        </div>
      </div>
    </div>
    <div className="-ms-6 mt-12 w-[32%] animate-fade-up [animation-delay:650ms]">
      <div className="animate-float [animation-delay:2.2s]">
        <div className="phone rotate-6">
          <Image src={calendar} alt="Mood calendar: a mood sticker on each day of October" />
        </div>
      </div>
    </div>
  </div>
);

const SocialIcons = ({ className = "" }: { className?: string }) => (
  <div className={`flex gap-2 ${className}`}>
    {SOCIAL_LINKS.map((social) => (
      <a
        key={social.name}
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform hover:-translate-y-0.5"
      >
        <Image
          src={SOCIAL_ICONS[social.name as keyof typeof SOCIAL_ICONS]}
          alt={`Miuu Studio on ${social.name}`}
          width={36}
          height={36}
        />
      </a>
    ))}
  </div>
);

const Hero = () => {
  return (
    <>
      <section id="top" className="relative overflow-hidden bg-violet text-white">
        <Sparkle className="right-[8%] top-10 h-4 w-4 text-white/80" />
        <Sparkle className="left-[46%] top-24 h-3 w-3 text-white/70 [animation-delay:1s]" />
        {/* desktop: socials rest in the bottom-right corner, clear of the phones */}
        <SocialIcons className="absolute bottom-10 right-10 z-10 hidden animate-fade-up [animation-delay:700ms] lg:flex" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <div className="flex animate-fade-up items-center gap-4">
              <Image src={appIcon} alt="" width={64} height={64} className="rounded-2xl" />
              <p className="text-sm font-bold uppercase tracking-[0.25em]">Miuu Note</p>
            </div>
            <h1 className="mt-10 animate-fade-up font-display [animation-delay:100ms] text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              {/* names the app for search engines; the wordmark above already shows it visually */}
              <span className="sr-only">Miuu Note, a cute journal app: </span>
              Your cute
              <br />
              mood journal.
            </h1>
            <p className="mt-6 max-w-md animate-fade-up text-base font-medium leading-relaxed text-white/80 [animation-delay:200ms] sm:text-lg">
              Write it down, track your mood, collect stickers and make a cozy little room your own. A
              private space for the end of the day, on iPhone and Android.
            </p>

            <StoreBadges className="mt-8 animate-fade-up [animation-delay:300ms]" />

            <dl className="mt-10 grid max-w-md animate-fade-up grid-cols-2 [animation-delay:380ms]">
              {PLAY_STATS.map((stat, i) => (
                <div key={stat.label} className={i > 0 ? "border-l border-white/20 pl-6 sm:pl-8" : "pr-6 sm:pr-8"}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{stat.value}</dd>
                  <dd className="mt-1 text-xs font-semibold text-white/70 [text-wrap:balance]">{stat.label}</dd>
                </div>
              ))}
            </dl>

            <SocialIcons className="mt-8 animate-fade-up [animation-delay:450ms] lg:hidden" />
          </div>

          <HeroPhones />
        </div>
      </section>

      {/* Miuu at a desk, just below the violet hero */}
      <section className="relative bg-canvas px-4 pt-10" aria-label="Miuu at a desk">
        <div className="relative mx-auto max-w-[220px] animate-pop-in [animation-delay:250ms] sm:max-w-[260px]">
          <MiuuAtDesk />
        </div>
      </section>
    </>
  );
};

export default Hero;
