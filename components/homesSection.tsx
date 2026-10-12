import Image from "next/image";
import seashell from "@/public/images/homes/seashell.jpg";
import witchy from "@/public/images/homes/witchy.jpg";
import pink from "@/public/images/homes/pink.jpg";
import cozyRoom from "@/public/images/app/room-cozy.png";
import closetSkins from "@/public/images/app/closet-skins.png";
import skinTiles from "@/public/images/app/skin-tiles.png";
import Reveal from "@/components/reveal";

const HOMES = [
  { src: seashell, alt: "Miuu's home with a blue scalloped roof and seashell furniture", tilt: "-rotate-3" },
  { src: witchy, alt: "Miuu's home in a witchy purple theme with a cauldron", tilt: "rotate-2 lg:translate-y-10" },
  { src: pink, alt: "Miuu's home in pink with a rocking horse and teddy bear", tilt: "-rotate-2" },
  { src: cozyRoom, alt: "Miuu's home in a cozy autumn theme with an acorn bed and a fireplace", tilt: "rotate-3 lg:translate-y-10" },
];

const HomesSection = () => {
  return (
    <section id="homes" className="scroll-mt-16 overflow-hidden bg-lilac px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-violet">Miuu&apos;s home</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          A cozier room with every entry
        </h2>
        <p className="mt-4 text-base font-medium text-ink/70 sm:text-lg">
          Writing earns coins. Spend them on a roof, wallpaper and furniture, and slowly turn Miuu&apos;s
          place into a home that feels like yours.
        </p>
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
        {HOMES.map((home, i) => (
          <Reveal key={home.alt} delay={i * 100}>
            <div
              className={`phone mx-auto w-full max-w-[250px] transition-transform duration-300 hover:-translate-y-2 ${home.tilt}`}
            >
              <Image src={home.src} alt={home.alt} />
            </div>
          </Reveal>
        ))}
      </div>

      {/* Miuu skins: a cat that looks like yours */}
      <div className="mx-auto mt-24 grid max-w-5xl items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
        <Reveal className="text-center lg:text-start">
          <h3 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Pick a Miuu that looks like your cat
          </h3>
          <p className="mx-auto mt-4 max-w-md text-base font-medium text-ink/70 sm:text-lg lg:mx-0">
            Grey tabby, tuxedo, Siamese, orange tabby and more: twelve looks to choose from in the
            dressing room, so your room feels even more like home.
          </p>
          <Image
            src={skinTiles}
            alt="Miuu skins: grey and white, Siamese, tuxedo and more"
            className="mx-auto mt-8 w-full max-w-[480px] lg:mx-0"
          />
        </Reveal>
        <Reveal delay={150}>
          <div className="phone mx-auto w-full max-w-[250px] rotate-2 transition-transform duration-300 hover:-translate-y-2">
            <Image src={closetSkins} alt="Dressing room: trying on the grey tabby skin with a red scarf" />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default HomesSection;
