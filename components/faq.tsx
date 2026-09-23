import Reveal from "@/components/reveal";
import { FAQ } from "@/lib/faq";

const Faq = () => {
  return (
    <section id="faq" className="scroll-mt-16 bg-canvas px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-violet">FAQ</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Questions about Miuu Note
        </h2>
      </Reveal>

      <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
        {FAQ.map((item, i) => (
          <Reveal key={item.question} delay={Math.min(i, 3) * 60}>
            <details className="group rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink/5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-extrabold tracking-tight">
                <h3>{item.question}</h3>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac text-violet transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-4 font-medium leading-relaxed text-ink/70">{item.answer}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Faq;
