import Reveal from "@/components/reveal";
import { PLAY_STATS } from "@/lib/links";
import { RULED, scrap } from "@/components/journal/ui";

// Real Google Play reviews, quoted as written. The first is the review on the app's onboarding
// (onboardingV4.review in the app's i18n, MIkky, Oct 9 2026), its key sentence pulled out large as
// it is there; the second is the one the app's Plus page shows.
const LEAD = {
  pull: "This app feels like a reward for liking to journal.",
  title: "ABSOLUTELY PHENOMENAL",
  body: "it's a virtual pet / room and the pet says sweet motivating things, a journal that you can back up and organize, a thank you keeper jar, has bgm you can customize, a sticker gacha that has two free daily, and probably more I haven't even said yet. This app feels like a reward for liking to journal. the only downside is that my paper journals are about to collect some serious dust I fear lol. I love it thank you!!!",
  byline: "MIkky",
};

const SECOND = {
  title: "Great App for Journaling with Adorable Cat Stickers!",
  body: "Amazing app, great for writing down my thoughts, like whatever's troubling me, what nice things I did that day, etc. as a huge cat lover the stickers are extremely adorable!",
};

const fiveStar = PLAY_STATS.find((stat) => stat.label.startsWith("five"));

const Stars = ({ className = "" }: { className?: string }) => (
  <p className={`tracking-[0.2em] text-[#FFB938] ${className}`} aria-label="5 out of 5 stars">
    ★★★★★
  </p>
);

const Testimonials = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* the onboarding review, its key line large */}
        <Reveal
          as="figure"
          className={`${RULED} relative flex flex-col justify-between rounded-[28px] p-8 shadow-[0_30px_60px_-34px_rgba(43,34,64,0.4)] ring-1 ring-ink/[0.06] sm:p-12`}
        >
          {/* taped onto the page, like a scrapbook clipping */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scrap("washi-tape-17")} alt="" className="absolute -top-4 left-10 w-28 -rotate-3" />
          <div>
            <Stars className="text-lg" />
            <blockquote className="mt-6 font-display text-3xl font-extrabold leading-[1.15] tracking-[-0.03em] sm:text-[44px]">
              &ldquo;{LEAD.pull}&rdquo;
            </blockquote>
            <p className="mt-6 max-w-xl text-sm font-medium leading-relaxed text-ink/50">
              <span className="font-bold text-ink/70">{LEAD.title}.</span> {LEAD.body}
            </p>
          </div>
          <figcaption className="mt-10 text-sm font-semibold text-ink/55">
            {LEAD.byline} · Google Play review
          </figcaption>
        </Reveal>

        <div className="grid gap-4">
          <Reveal
            delay={100}
            className="rounded-[28px] bg-white p-8 shadow-[0_30px_60px_-34px_rgba(43,34,64,0.4)] ring-1 ring-ink/[0.06] sm:p-10"
          >
            <p className="text-xs font-semibold text-ink/40">Google Play</p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-[-0.04em] sm:text-6xl">
              {fiveStar?.value ?? "5★"}
            </p>
            {/* non-breaking hyphen keeps "five-star" on one line */}
            <p className="mt-1 font-medium text-ink/60">five‑star ratings from people who journal with Miuu</p>
          </Reveal>

          <Reveal as="figure" delay={180} className="rounded-[28px] bg-[#F3DBE5] p-8 sm:p-10">
            <Stars />
            <h3 className="mt-4 font-display text-lg font-extrabold leading-snug tracking-[-0.02em]">{SECOND.title}</h3>
            <blockquote className="mt-2 font-medium leading-relaxed text-ink/60">{SECOND.body}</blockquote>
            <figcaption className="mt-6 text-sm font-semibold text-ink/50">Google Play review</figcaption>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
