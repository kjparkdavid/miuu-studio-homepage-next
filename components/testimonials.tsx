import Reveal from "@/components/reveal";
import { PLAY_STATS } from "@/lib/links";

// Real Google Play reviews, the same ones the app shows on its Pro page (proPlanPage.reviewTitles /
// reviewDescriptions in the app's i18n), quoted as written
const REVIEWS = [
  {
    title: "The Cutest Journal App Ever! 🩷✨️",
    body: "The cutest journal app! ✨️🩷 the fonts are super cute, and the stickers are too! It's definitely worth purchasing permanently. I'll be using this app every day!",
  },
  {
    title: "Great App for Journaling with Adorable Cat Stickers!",
    body: "Amazing app, great for writing down my thoughts, like whatever's troubling me, what nice things I did that day, etc. as a huge cat lover the stickers are extremely adorable!",
  },
  {
    title: "Cute, Aesthetic, and Easy to Use!",
    body: "App theme is totally aesthetically pleasing. you can choose between backgrounds of your diary, put adorable cat stickers you collect for your diary pages and organise them into folders of your choice. cute and simple app to use:)",
  },
  {
    title: "Perfect for Cat Lovers: Cute, Secure, and Fun!",
    body: "This application is very nice. I recommend. The diary gives you stickers, you can write down everything you secret. Go to settings and set a password. Very cute, suitable for cat lovers.💗🐱",
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
          {fiveStar ? `${fiveStar.value} five\u2011star ratings` : "Loved by journalers"}
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
            <p className="mt-3 font-medium leading-relaxed text-ink/70">{review.body}</p>
            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-ink/40">Google Play review</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
