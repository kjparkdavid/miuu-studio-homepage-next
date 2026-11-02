import Image from "next/image";
import appIcon from "@/public/images/app-icon.png";
import StoreBadges from "@/components/storeBadges";
import StickerJar from "@/components/stickerJar";
import { PLAY_STATS, SOCIAL_LINKS } from "@/lib/links";
import instagram from "@/public/images/footer/instagram.png";
import tiktok from "@/public/images/footer/tiktok.png";
import youtube from "@/public/images/footer/youtube.png";

const SOCIAL_ICONS = { Instagram: instagram, TikTok: tiktok, YouTube: youtube };

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
          width={28}
          height={28}
        />
      </a>
    ))}
  </div>
);

const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden bg-canvas">
      {/* one soft wash, the app onboarding's pink to lilac to sky */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_80%_20%,#EADCFF_0%,transparent_70%),radial-gradient(45%_50%_at_10%_0%,#FFE4EF_0%,transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-x-16 gap-y-10 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:pb-28 lg:pt-24">
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <div className="flex animate-fade-up items-center gap-2.5">
            <Image src={appIcon} alt="" width={36} height={36} className="rounded-[10px]" />
            <p className="text-sm font-bold tracking-tight">Miuu Note</p>
          </div>
          <h1 className="mt-8 animate-fade-up font-display [animation-delay:100ms] text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[76px]">
            {/* names the app for search engines; the wordmark above already shows it visually */}
            <span className="sr-only">Miuu Note, a cute journal app: </span>
            Your cute <span className="text-violet">mood</span>
            <br />
            journal.
          </h1>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {/* the jar on the app onboarding's own backdrop */}
          <div className="rounded-[2rem] bg-gradient-to-b from-[#FFE9F2] via-[#F1E8FF] to-[#E6F0FF] p-5 ring-1 ring-ink/5 sm:p-8">
            <StickerJar />
          </div>
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <p className="max-w-md animate-fade-up text-base font-medium leading-relaxed text-ink/60 [animation-delay:200ms] sm:text-lg">
            Write a little each day and watch this month&apos;s jar fill up with stickers. Track your mood, keep a
            gratitude list and make a cozy little room your own. A private space for the end of the day, on iPhone and
            Android.
          </p>

          <StoreBadges className="mt-8 animate-fade-up [animation-delay:300ms]" />

          <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-x-8 gap-y-4 [animation-delay:380ms]">
            <dl className="flex gap-8">
              {PLAY_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-2xl font-extrabold tracking-tight">{stat.value}</dd>
                  <dd className="mt-0.5 text-xs font-medium text-ink/50">{stat.label}</dd>
                </div>
              ))}
            </dl>
            <SocialIcons />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
