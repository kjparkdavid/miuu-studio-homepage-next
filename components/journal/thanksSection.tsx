import { FormEvent, useEffect, useRef, useState } from "react";
import { Row, SectionCopy, sticker } from "@/components/journal/ui";

// The app's Thanks jar, Classic (secret-note src/components/Thanks/jarArt/classic.tsx, Figma
// `2843:50`, 260 × 330): glass, the slips inside, then the lid and the glints over them. Its six slip
// shapes are filled bottom up with the notes' own papers (ThanksPalette), newest on top.

const JAR_BODY =
  "M85 72H175V97C207 105 226 121 229 153L234 262C235.333 289.333 222.667 304.333 196 307H64C37.3333 304.333 24.6667 289.333 26 262L31 153C33 127 51 108.333 85 97V72Z";

const SLIP_SHAPES = [
  "M125.686 225.536L37.0944 241.157C36.4792 241.265 36.0685 241.852 36.1769 242.467L40.0444 264.401C40.1529 265.016 40.7395 265.427 41.3546 265.318L129.946 249.697C130.561 249.589 130.972 249.002 130.863 248.387L126.996 226.453C126.887 225.838 126.301 225.427 125.686 225.536Z",
  "M188.058 242.149L98.9759 229.63C98.3573 229.543 97.7854 229.974 97.6985 230.592L94.5988 252.647C94.5119 253.266 94.9428 253.838 95.5614 253.925L184.644 266.444C185.262 266.531 185.834 266.1 185.921 265.482L189.021 243.427C189.108 242.808 188.677 242.236 188.058 242.149Z",
  "M140.208 210.829L51.1259 198.31C50.5073 198.223 49.9354 198.654 49.8485 199.272L46.7488 221.327C46.6619 221.946 47.0928 222.518 47.7114 222.605L136.794 235.124C137.412 235.211 137.984 234.78 138.071 234.162L141.171 212.107C141.258 211.488 140.827 210.916 140.208 210.829Z",
  "M183.256 197.106L95.2634 215.81C94.6524 215.94 94.2624 216.54 94.3923 217.151L99.0229 238.936C99.1527 239.547 99.7533 239.937 100.364 239.808L188.357 221.104C188.967 220.974 189.358 220.374 189.228 219.763L184.597 197.978C184.467 197.367 183.867 196.977 183.256 197.106Z",
  "M126.354 169.6L37.2713 182.119C36.6527 182.206 36.2218 182.778 36.3087 183.397L39.4084 205.452C39.4953 206.07 40.0672 206.501 40.6858 206.414L129.768 193.895C130.387 193.808 130.818 193.236 130.731 192.617L127.631 170.562C127.544 169.944 126.972 169.513 126.354 169.6Z",
  "M190.043 183.678L101.738 166.513C101.125 166.394 100.531 166.794 100.412 167.407L96.1622 189.27C96.043 189.883 96.4435 190.477 97.0566 190.596L185.362 207.761C185.975 207.88 186.569 207.48 186.688 206.867L190.938 185.004C191.057 184.391 190.656 183.797 190.043 183.678Z",
];

// ThanksPalette's papers
const PAPERS = ["#DEEFE5", "#F3DBE5", "#E6DFF3", "#FFF0B8", "#F8DECD", "#F6EBD9"];

type Note = { text: string; paper: string; date: string };

const START: Note[] = [
  { text: "Sunny walk home. Found a new bakery on the way.", paper: PAPERS[2], date: "" },
  { text: "Mom called just to check in. Didn't know I needed that.", paper: PAPERS[1], date: "" },
  { text: "My coworker covered for me when I was running late. Owe her a coffee.", paper: PAPERS[0], date: "" },
];

const IDEAS = ["The first cozy sweater day", "A friend who texted back fast", "Warm soup after a long day"];

const ThanksJar = ({ notes, lidRef }: { notes: Note[]; lidRef: React.RefObject<SVGGElement> }) => {
  // oldest at the bottom: the jar shows the newest six, filled from the floor up
  const inJar = notes.slice(0, SLIP_SHAPES.length).reverse();
  return (
    <svg viewBox="0 0 260 330" className="w-full" aria-hidden>
      <defs>
        <clipPath id="thanks-jar-body">
          <path d={JAR_BODY} />
        </clipPath>
      </defs>
      <path
        opacity={0.65}
        d="M130 323C190.751 323 240 316.284 240 308C240 299.716 190.751 293 130 293C69.2487 293 20 299.716 20 308C20 316.284 69.2487 323 130 323Z"
        fill="#E5DCEF"
      />
      <path d={JAR_BODY} fill="#FAF7FF" fillOpacity={0.85} stroke="#BBAACF" strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#thanks-jar-body)">
        <g transform="translate(17 23)">
          {inJar.map((note, i) => (
            <path
              key={`${notes.length}-${i}`}
              d={SLIP_SHAPES[i]}
              fill={note.paper}
              stroke="rgba(43,34,64,0.08)"
              className={i === inJar.length - 1 ? "animate-pop" : ""}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}
        </g>
      </g>
      <path
        d="M85 84H175M82 99C114 107 146 107 178 99"
        fill="none"
        stroke="#D3C5E4"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M38 265C39.3333 283 49.3333 292.667 68 294H192C208.667 292.667 218.333 284.667 221 270"
        fill="none"
        stroke="#E3DAEE"
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* the lid lifts to let a slip in */}
      <g ref={lidRef} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path
          d="M64 57V28C63.3333 20.6667 66.3333 18.6667 73 22L102 41C120.667 36.3333 139 36.3333 157 41L187 22C193.667 18.6667 196.667 20.6667 196 28L195 57H64Z"
          fill="#FF999F"
          stroke="#D97780"
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <path d="M75 47L74 32L91 44L75 47ZM169 44L186 32L185 47L169 44Z" fill="#FFD8D7" />
        <path
          d="M189 51H72C64.8203 51 59 56.8203 59 64V67C59 74.1797 64.8203 80 72 80H189C196.18 80 202 74.1797 202 67V64C202 56.8203 196.18 51 189 51Z"
          fill="#F47B83"
          stroke="#D97780"
          strokeWidth={4}
        />
        <path d="M74 60H185" fill="none" stroke="#FFE1DC" strokeWidth={5} strokeLinecap="round" />
        <path
          d="M159 76C170.333 66 177.667 65.3333 181 74C181.667 80 177 83.6667 167 85C181.667 82.3333 187.333 85.3333 184 94C180.667 99.3333 173.333 96.6667 162 86L157 111M164 86L175 109"
          fill="#F7DAA6"
          stroke="#CEAB74"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M161 89C163.761 89 166 86.7614 166 84C166 81.2386 163.761 79 161 79C158.239 79 156 81.2386 156 84C156 86.7614 158.239 89 161 89Z"
          fill="#E7C488"
          stroke="#CEAB74"
          strokeWidth={2}
        />
      </g>
      <path
        d="M56 139C50 149.667 47 165.667 47 187"
        fill="none"
        stroke="white"
        strokeOpacity={0.75}
        strokeWidth={12}
        strokeLinecap="round"
      />
      <path d="M47 204V215" fill="none" stroke="white" strokeOpacity={0.75} strokeWidth={10} strokeLinecap="round" />
      <path
        d="M213 232L214 262C214 276 208.333 284 197 286"
        fill="none"
        stroke="white"
        strokeOpacity={0.6}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
  );
};

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();

const datedStart = (): Note[] =>
  START.map((note, i) => ({ ...note, date: shortDate(new Date(Date.now() - (i + 1) * 2 * 86400000)) }));

const ThanksSection = () => {
  const [notes, setNotes] = useState<Note[]>(START);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const lidRef = useRef<SVGGElement>(null);
  const slipRef = useRef<HTMLDivElement>(null);
  const [slipPaper, setSlipPaper] = useState(PAPERS[3]);

  // the sample notes are dated the last few days
  useEffect(() => setNotes(datedStart()), []);

  const full = notes.length >= SLIP_SHAPES.length;

  const tuck = (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const paper = PAPERS[notes.length % PAPERS.length];
    const note = { text: clean, paper, date: shortDate(new Date()) };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDraft("");
    if (reduce || !slipRef.current) {
      setNotes((prev) => [note, ...prev]);
      return;
    }
    setBusy(true);
    setSlipPaper(paper);
    // the lid lifts, the slip drops through the mouth, the lid settles back
    lidRef.current?.animate(
      [
        { transform: "translateY(0) rotate(0)" },
        { transform: "translateY(-14px) rotate(-6deg)" },
        { transform: "translateY(0) rotate(0)" },
      ],
      { duration: 900, easing: "cubic-bezier(0.3, 1.3, 0.5, 1)" },
    );
    const drop = slipRef.current.animate(
      [
        { opacity: 0, transform: "translate(-50%, -70px) rotate(-10deg) scale(1)" },
        { opacity: 1, transform: "translate(-50%, -30px) rotate(-6deg) scale(1)", offset: 0.3 },
        { opacity: 1, transform: "translate(-50%, 40px) rotate(4deg) scale(0.8)", offset: 0.75 },
        { opacity: 0, transform: "translate(-50%, 90px) rotate(8deg) scale(0.6)" },
      ],
      { duration: 800, easing: "cubic-bezier(0.5, 0, 0.7, 1)" },
    );
    drop.onfinish = () => {
      setNotes((prev) => [note, ...prev]);
      setBusy(false);
    };
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    tuck(draft);
  };

  return (
    <Row flip id="thanks">
      <SectionCopy
        icon={sticker("emoji-heart")}
        kicker="Thank you jar"
        title={
          <>
            Keep the small
            <br />
            good things.
          </>
        }
      >
        Write a thank-you, fold it up and tuck it in. On a harder day, open the jar and read them back.
      </SectionCopy>

      <div className="mx-auto grid w-full max-w-[580px] items-start gap-6 sm:grid-cols-[240px_1fr]">
        {/* the jar, and the slip on its way in */}
        <div className="relative mx-auto w-[220px] pt-6 sm:w-[240px]">
          <div
            ref={slipRef}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-6 z-10 h-6 w-20 rounded-[4px] opacity-0 shadow-[0_2px_4px_rgba(43,34,64,0.15)]"
            style={{ background: slipPaper }}
          />
          <ThanksJar notes={notes} lidRef={lidRef} />
        </div>

        <div>
          <form
            onSubmit={submit}
            className="rounded-2xl bg-white p-2 shadow-[0_10px_30px_-20px_rgba(43,34,64,0.4)] ring-1 ring-ink/[0.06]"
          >
            <label htmlFor="thanks-draft" className="sr-only">
              Something you&apos;re thankful for
            </label>
            <textarea
              id="thanks-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 90))}
              placeholder="Thank you for…"
              rows={2}
              disabled={full}
              className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-[15px] font-medium outline-none placeholder:text-ink/35"
            />
            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              {full ? (
                <button
                  type="button"
                  onClick={() => setNotes(datedStart())}
                  className="text-xs font-semibold text-ink/50 hover:text-ink"
                >
                  Jar&apos;s full. Start over
                </button>
              ) : (
                <span className="text-[11px] font-medium text-ink/35">{notes.length} of 6 in the jar</span>
              )}
              <button
                type="submit"
                disabled={!draft.trim() || busy || full}
                className="rounded-full bg-violet px-4 py-2 text-xs font-bold text-white transition-[opacity,transform] hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                Tuck it in
              </button>
            </div>
          </form>
          {!full && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => tuck(idea)}
                  disabled={busy}
                  className="rounded-full bg-ink/[0.05] px-3 py-1.5 text-[11px] font-semibold text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                  + {idea}
                </button>
              ))}
            </div>
          )}

          {/* the notes, newest first, as the Gratitude list shows them */}
          <ul className="mt-5 grid gap-2.5">
            {notes.slice(0, 3).map((note, i) => (
              <li
                key={`${notes.length}-${i}`}
                className={`rounded-2xl px-4 py-3.5 ${i === 0 ? "animate-swap-in" : ""}`}
                style={{ background: note.paper }}
              >
                <p className="text-[10px] font-bold tracking-wide text-ink/45">{note.date}</p>
                <p className="mt-1 text-sm font-medium leading-snug text-ink/80">{note.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Row>
  );
};

export default ThanksSection;
