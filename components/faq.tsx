import Reveal from "@/components/reveal";
import { FAQ } from "@/lib/faq";

const Faq = () => {
  return (
    <section id="faq" className="scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Questions,
            <br />
            answered.
          </h2>
          <p className="mt-5 max-w-xs font-medium leading-relaxed text-ink/60">
            Anything else? Write to{" "}
            <a href="mailto:support@miuustudio.com" className="font-semibold text-ink underline-offset-4 hover:underline">
              support@miuustudio.com
            </a>
          </p>
        </Reveal>

        <Reveal className="border-t border-ink/10">
          {FAQ.map((item) => (
            <details key={item.question} className="group border-b border-ink/10 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-bold tracking-[-0.01em] transition-colors hover:text-violet">
                <h3>{item.question}</h3>
                <span
                  className="relative h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                >
                  <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 rounded-full bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 rounded-full bg-current" />
                </span>
              </summary>
              <p className="-mt-1 max-w-2xl pb-6 font-medium leading-relaxed text-ink/60">{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default Faq;
