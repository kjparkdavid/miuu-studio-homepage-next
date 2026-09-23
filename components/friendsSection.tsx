import Image from "next/image";
import { getAllCharacters, getCharacteThumbnail } from "@/lib/characters";
import { SHOP_URL } from "@/lib/links";
import Reveal from "@/components/reveal";

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"];

const FriendsSection = () => {
  const characters = getAllCharacters();
  // Two copies back to back so the marquee loops without a gap
  const loop = [...characters, ...characters];

  return (
    <section id="friends" className="scroll-mt-16 overflow-hidden bg-canvas py-24">
      <Reveal className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <p className="text-sm font-bold uppercase tracking-widest text-violet">Miuu &amp; friends</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          A whole gang to keep you company
        </h2>
        <p className="mt-4 text-base font-medium text-ink/70 sm:text-lg">
          Miuu, Miyomi, Kao and the rest of the crew are drawn by Miuu Studio. You&apos;ll meet them in
          your stickers, your mailbox and all over the app.
        </p>
      </Reveal>

      <Reveal delay={150} className="relative mt-14 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="flex w-max animate-marquee gap-6 py-4 hover:[animation-play-state:paused]">
          {loop.map((character, i) => (
            <li
              key={`${character.id}-${i}`}
              className={`w-40 shrink-0 rounded-3xl bg-white p-2 shadow-card transition-transform duration-200 hover:scale-105 sm:w-48 ${TILTS[i % TILTS.length]}`}
              aria-hidden={i >= characters.length}
            >
              <Image src={getCharacteThumbnail(character.id)} alt={character.name} className="w-full rounded-2xl" />
              <p className="py-2 text-center font-display text-lg font-extrabold">{character.name}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="mt-10 text-center">
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-6 py-3 text-sm font-bold transition-colors hover:bg-ink hover:text-canvas"
        >
          Visit the Miuu Studio store →
        </a>
      </div>
    </section>
  );
};

export default FriendsSection;
