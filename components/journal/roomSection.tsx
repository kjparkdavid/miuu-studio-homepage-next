import { useState } from "react";
import Image from "next/image";
import seashell from "@/public/images/homes/seashell.jpg";
import witchy from "@/public/images/homes/witchy.jpg";
import pink from "@/public/images/homes/pink.jpg";
import cozyRoom from "@/public/images/app/room-cozy.png";
import skinTiles from "@/public/images/app/skin-tiles.png";
import { Row, SectionCopy, Segmented, sticker } from "@/components/journal/ui";

type Theme = "cozy" | "seashell" | "witchy" | "pink";

const THEMES: { key: Theme; label: string; src: typeof cozyRoom; alt: string }[] = [
  {
    key: "cozy",
    label: "Cozy",
    src: cozyRoom,
    alt: "Miuu's home in a cozy autumn theme with an acorn bed and a fireplace",
  },
  {
    key: "seashell",
    label: "Seashell",
    src: seashell,
    alt: "Miuu's home with a blue scalloped roof and seashell furniture",
  },
  { key: "witchy", label: "Witchy", src: witchy, alt: "Miuu's home in a witchy purple theme with a cauldron" },
  { key: "pink", label: "Pink", src: pink, alt: "Miuu's home in pink with a rocking horse and teddy bear" },
];

const RoomSection = () => {
  const [theme, setTheme] = useState<Theme>("cozy");
  return (
    <Row flip id="homes">
      <SectionCopy
        icon={sticker("toasty-cats")}
        kicker="Miuu's room"
        title={
          <>
            Every entry makes
            <br />
            the room cozier.
          </>
        }
        extra={
          <div className="mt-8">
            <p className="text-sm font-bold">A Miuu that looks like your cat</p>
            <p className="mt-1 text-sm font-medium text-ink/55">
              Grey tabby, tuxedo, Siamese and more, in the dressing room.
            </p>
            <Image
              src={skinTiles}
              alt="Miuu skins: grey and white, Siamese, tuxedo and more"
              className="mt-4 w-full max-w-[400px]"
            />
          </div>
        }
      >
        Writing earns coins. Spend them on a roof, wallpaper and furniture, and slowly turn Miuu&apos;s place into a
        home that feels like yours.
      </SectionCopy>

      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center">
        <Segmented label="Room theme" options={THEMES} value={theme} onChange={setTheme} />
        <div className="relative mt-6">
          <div className="phone relative w-[260px] sm:w-[280px]">
            <div className="relative aspect-[600/1300]">
              {THEMES.map((t) => (
                <Image
                  key={t.key}
                  src={t.src}
                  alt={t.alt}
                  fill
                  sizes="280px"
                  className={`object-cover object-top transition-[opacity,transform] duration-500 ${
                    theme === t.key ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
                  }`}
                />
              ))}
            </div>
          </div>
          {/* what writing earns, floating beside the phone */}
          <div className="absolute -left-14 top-24 hidden animate-bob items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-card ring-1 ring-ink/[0.06] sm:flex">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#FFD66B] text-[11px]">✦</span>
            Coins for every entry
          </div>

        </div>
      </div>
    </Row>
  );
};

export default RoomSection;
