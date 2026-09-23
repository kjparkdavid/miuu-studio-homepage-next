import Image from "next/image";
import appIcon from "@/public/images/app-icon.png";
import home from "@/public/images/app/home.jpg";
import journals from "@/public/images/app/journals.jpg";
import dressingRoom from "@/public/images/app/dressing-room.jpg";
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

const HouseProp = ({ className }: { className: string }) => (
  <svg viewBox="0 0 160 110" className={`absolute ${className}`} aria-hidden>
    <ellipse cx="80" cy="66" rx="76" ry="26" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.5" transform="rotate(14 80 66)" />
    <g transform="rotate(-14 60 50)">
      <rect x="38" y="44" width="42" height="40" rx="6" fill="#fff" />
      <path d="M32 48L59 22l27 26z" fill="#F9C4D2" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
      <rect x="46" y="54" width="10" height="10" rx="2" fill="#C9B8FF" />
      <rect x="60" y="62" width="11" height="22" rx="3" fill="#FFD66B" />
    </g>
    <path d="M128 92l2 4 4 1-4 1-2 4-2-4-4-1 4-1z" fill="#fff" />
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
  <div className="relative mx-auto aspect-square w-full max-w-[460px] animate-pop-in [animation-delay:250ms]">
    {/* frosted desk Miuu sits behind */}
    <div className="absolute inset-x-[12%] bottom-[14%] h-[30%] rounded-[2rem] bg-white/15 ring-1 ring-white/25 backdrop-blur-sm" aria-hidden>
      <div className="absolute inset-x-6 top-3 h-px bg-white/50" />
      <div className="absolute inset-x-[18%] -bottom-1 h-1/2 rounded-b-2xl rounded-t-md bg-violet-soft/40 ring-1 ring-white/25" />
    </div>
    <Image
      src={studyMiuu}
      alt="Miuu with glasses, a pencil and a journal"
      priority
      className="absolute inset-x-[16%] bottom-[20%] w-[68%] animate-float-slow"
    />

    <JournalProp className="left-0 top-[30%] w-16 animate-float sm:w-20" />
    <JarProp className="right-0 top-[18%] w-16 animate-float [animation-delay:1.2s] sm:w-20" />
    <HouseProp className="-left-4 bottom-0 w-32 sm:w-40" />
    <PencilProp className="-right-2 bottom-[4%] w-20 animate-float [animation-delay:2s] sm:w-24" />

    <Sparkle className="left-[22%] top-[12%] h-6 w-6 text-white" />
    <Sparkle className="right-[30%] top-[4%] h-7 w-7 text-white [animation-delay:1s]" />
    <Sparkle className="right-[16%] top-[44%] h-4 w-4 text-white [animation-delay:2s]" />
    <Sparkle className="bottom-[16%] left-[26%] h-5 w-5 text-white [animation-delay:1.5s]" />
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

        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-44 pt-12 sm:px-6 sm:pb-56 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <div className="flex animate-fade-up items-center gap-4">
              <Image src={appIcon} alt="" width={64} height={64} className="rounded-2xl" />
              <p className="text-sm font-bold uppercase tracking-[0.25em]">Miuu Note</p>
            </div>
            <h1 className="mt-10 animate-fade-up font-display [animation-delay:100ms] text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              {/* names the app for search engines; the wordmark above already shows it visually */}
              <span className="sr-only">Miuu Note, a cute journal app: </span>
              Journal your days.
              <br />
              Build your little world.
            </h1>
            <p className="mt-6 max-w-md animate-fade-up text-base font-medium leading-relaxed text-white/80 [animation-delay:200ms] sm:text-lg">
              Miuu Note is a cute, private journal app for iPhone and Android. Write with gentle prompts,
              track your mood with stickers, keep a gratitude jar and decorate a cozy room with Miuu.
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

          <MiuuAtDesk />
        </div>
      </section>

      {/* Journals list, home and dressing room, straddling the edge of the violet hero */}
      <section className="relative flow-root bg-canvas px-2 pb-8 sm:px-6" aria-label="Miuu Note screens">
        <div className="relative mx-auto -mt-36 flex max-w-4xl items-start justify-center sm:-mt-48">
          {/* wrappers carry the entrance so it doesn't fight each phone's tilt */}
          <div className="-me-3 mt-14 w-[32%] max-w-[240px] animate-fade-up [animation-delay:550ms] sm:-me-6">
            <div className="phone -rotate-6">
              <Image src={journals} alt="Journals: this month's mood stickers and today's entries" />
            </div>
          </div>
          <div className="relative z-10 w-[36%] max-w-[270px] animate-fade-up [animation-delay:450ms]">
            <div className="phone">
              <Image src={home} alt="Miuu Note home screen: Miuu's decorated room" priority />
            </div>
          </div>
          <div className="-ms-3 mt-14 w-[32%] max-w-[240px] animate-fade-up [animation-delay:650ms] sm:-ms-6">
            <div className="phone rotate-6">
              <Image src={dressingRoom} alt="Miuu's dressing room: a donut outfit and bubble tea" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
