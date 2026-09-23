import Image from "next/image";
import seashell from "@/public/images/homes/seashell.jpg";
import witchy from "@/public/images/homes/witchy.jpg";
import pink from "@/public/images/homes/pink.jpg";
import shop from "@/public/images/app/shop.jpg";
import Reveal from "@/components/reveal";

const HOMES = [
  { src: seashell, alt: "Miuu's home with a blue scalloped roof and seashell furniture", tilt: "-rotate-3" },
  { src: witchy, alt: "Miuu's home in a witchy purple theme with a cauldron", tilt: "rotate-2 lg:translate-y-10" },
  { src: pink, alt: "Miuu's home in pink with a rocking horse and teddy bear", tilt: "-rotate-2" },
  { src: shop, alt: "Furniture shop: lamps, mirrors and a teddy bear priced in coins", tilt: "rotate-3 lg:translate-y-10" },
];

const HomesSection = () => {
  return (
    <section id="homes" className="scroll-mt-16 overflow-hidden bg-lilac px-4 py-24 sm:px-6">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-violet">Miuu&apos;s home</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Build your little world
        </h2>
        <p className="mt-4 text-base font-medium text-ink/70 sm:text-lg">
          Earn coins with little daily rituals and quests: check in, write your journal, draw a sticker.
          Spend them in the shop on a roof, wallpaper and furniture, dress Miuu up, and make a home that
          looks just like you.
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
    </section>
  );
};

export default HomesSection;
