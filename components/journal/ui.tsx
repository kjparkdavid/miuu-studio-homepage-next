import { Children, ReactElement, ReactNode, cloneElement, isValidElement } from "react";
import Reveal from "@/components/reveal";

// The pieces every section below the hero is built from, drawn after the app's own UI: its chips
// ("My journals"), its soft segmented control (the Calendar's Stickers / Photos / Moods), its
// ruled journal paper and its violet pill buttons.

export const sticker = (name: string) => `/images/stickers/jar/${name}.webp`;
export const face = (name: string) => `/images/moods/${name}.webp`;
export const scrap = (name: string) => `/images/scrapbook/${name}.webp`;

// The app's journal paper: cream with faint rules, 32 px apart
export const RULED =
  "bg-[#FFFDF8] bg-[repeating-linear-gradient(transparent,transparent_31px,rgba(43,34,64,0.055)_31px,rgba(43,34,64,0.055)_32px)]";

// The editor and calendar cards: white, a hairline and a long soft shadow
export const APP_CARD = "rounded-[28px] bg-white shadow-[0_30px_60px_-34px_rgba(43,34,64,0.4)] ring-1 ring-ink/[0.06]";

/** The app's chip: a small white pill with a sticker in front, like "My journals". */
export const Chip = ({
  icon,
  children,
  className = "",
}: {
  icon?: string;
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink/80 shadow-[0_1px_0_rgba(43,34,64,0.04)] ring-1 ring-ink/10 ${className}`}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {icon && <img src={icon} alt="" className="h-4 w-4 object-contain" />}
    {children}
  </span>
);

/** A section's words: a chip, a big tight headline and a short paragraph. */
export const SectionCopy = ({
  icon,
  kicker,
  title,
  children,
  extra,
}: {
  icon: string;
  kicker: string;
  title: ReactNode;
  children: ReactNode;
  extra?: ReactNode;
}) => (
  <Reveal className="max-w-md">
    <Chip icon={icon}>{kicker}</Chip>
    <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.06] tracking-[-0.035em] sm:text-5xl">
      {title}
    </h2>
    <p className="mt-4 text-base font-medium leading-relaxed text-ink/60 sm:text-lg">{children}</p>
    {extra}
  </Reveal>
);

/**
 * The app's soft segmented control. The white thumb slides to the chosen option; every option is
 * the same width, so where it goes is just its index.
 */
export const Segmented = <K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) => {
  const index = Math.max(
    0,
    options.findIndex((o) => o.key === value),
  );
  return (
    <div
      role="tablist"
      aria-label={label}
      className="relative inline-grid rounded-full bg-ink/[0.06] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-full bg-white shadow-[0_2px_8px_-2px_rgba(43,34,64,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.3,1.3,0.5,1)]"
        style={{ left: 4, width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={o.key === value}
          onClick={() => onChange(o.key)}
          className={`relative whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
            o.key === value ? "text-ink" : "text-ink/45 hover:text-ink/70"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

/** Two columns on wide screens, the words beside the thing; `flip` puts the thing first. */
/**
 * Two columns on wide screens, the words beside the thing; `flip` puts the thing first. The first child
 * is the section's `SectionCopy`, the second the thing it shows. Anything in the copy's `extra` (the
 * skins, the friends) is lifted out: on a phone it comes after the thing, so the main picture is
 * always seen right after the headline, and on a wide screen it sits under the words.
 */
export const Row = ({ flip = false, id, children }: { flip?: boolean; id?: string; children: ReactNode }) => {
  const [copy, visual] = Children.toArray(children);
  const extra = isValidElement(copy) ? (copy as ReactElement<{ extra?: ReactNode }>).props.extra : undefined;
  const words =
    extra && isValidElement(copy)
      ? cloneElement(copy as ReactElement<{ extra?: ReactNode }>, { extra: undefined })
      : copy;
  const side = flip ? "lg:col-start-2" : "lg:col-start-1";
  const other = flip ? "lg:col-start-1" : "lg:col-start-2";
  return (
    <section id={id} className="scroll-mt-16">
      <div className="mx-auto grid max-w-6xl gap-y-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-x-20 lg:gap-y-0 lg:py-28">
        <div className={`lg:row-start-1 ${extra ? "lg:self-end" : "lg:row-span-2 lg:self-center"} ${side}`}>
          {words}
        </div>
        <div className={`lg:row-span-2 lg:row-start-1 lg:self-center ${other}`}>{visual}</div>
        {extra && <Reveal className={`max-w-md lg:row-start-2 lg:self-start ${side}`}>{extra}</Reveal>}
      </div>
    </section>
  );
};
