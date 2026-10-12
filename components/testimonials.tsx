import Reveal from "@/components/reveal";
import { PLAY_STATS } from "@/lib/links";

// Real Google Play reviews, quoted as written. The first is the review on the app's onboarding
// (onboardingV4.review in the app's i18n, MIkky, Oct 9 2026), its key sentence highlighted as it is
// there; the second is the one the app's Plus page shows.
const REVIEWS = [
  {
    title: "ABSOLUTELY PHENOMENAL",
    body: [
      "it's a virtual pet / room and the pet says sweet motivating things, a journal that you can back up and organize, a thank you keeper jar, has bgm you can customize, a sticker gacha that has two free daily, and probably more I haven't even said yet. ",
      "This app feels like a reward for liking to journal.",
      " the only downside is that my paper journals are about to collect some serious dust I fear lol. I love it thank you!!!",
    ],
    byline: "MIkky · Google Play review",
  },
  {
    title: "Great App for Journaling with Adorable Cat Stickers!",
    body: [
      "Amazing app, great for writing down my thoughts, like whatever's troubling me, what nice things I did that day, etc. as a huge cat lover the stickers are extremely adorable!",
    ],
    byline: "Google Play review",
  },
];

const fiveStar = PLAY_STATS.find((stat) => stat.label.startsWith("five"));

const Testimonials = () => {
  return (
    <section className="bg-canvas px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-violet">Loved on Google Play</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {/* non-breaking hyphen keeps "five-star" on one line */}
          {fiveStar ? `${fiveStar.value} five‑star ratings` : "Loved by journalers"}
        </h2>
        <p className="mt-4 text-base font-medium text-ink/70 sm:text-lg">
          A few words from people who keep their days with Miuu.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2">
        {REVIEWS.map((review, i) => (
          <Reveal
            key={review.title}
            as="article"
            delay={(i % 2) * 100}
            className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-card ring-1 ring-ink/5"
          >
            <p className="text-lg tracking-widest text-[#FFB938]" aria-label="5 out of 5 stars">
              ★★★★★
            </p>
            <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight">{review.title}</h3>
            <p className="mt-3 font-medium leading-relaxed text-ink/70">
              {/* odd parts are the review's key sentence */}
              {review.body.map((part, j) =>
                j % 2 === 1 ? (
                  <mark key={j} className="rounded bg-lilac px-1 font-bold text-ink">
                    {part}
                  </mark>
                ) : (
                  part
                )
              )}
            </p>
            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-ink/40">{review.byline}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
