import Image from "next/image";
import appIcon from "@/public/images/app-icon.png";
import gamerMiuu from "@/public/images/outfits/gamer.png";
import StoreBadges from "@/components/storeBadges";
import Reveal from "@/components/reveal";

const DownloadCta = () => {
  return (
    <section id="download" className="scroll-mt-16 px-4 pb-24 pt-8 sm:px-6 lg:pb-32">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#FFE9F2] via-[#F1E8FF] to-[#E6F0FF] px-7 py-14 ring-1 ring-ink/[0.04] sm:px-14 sm:py-20">
        <Image src={appIcon} alt="Miuu Note app icon" width={64} height={64} className="rounded-[18px] shadow-card" />
        <h2 className="mt-8 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
          Start your journal
          <br />
          today.
        </h2>
        <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-ink/60 sm:text-lg">
          Miuu Note is free to download on iPhone, iPad and Android. Even one line counts.
        </p>
        <StoreBadges className="mt-10" />
        <Image
          src={gamerMiuu}
          alt=""
          className="pointer-events-none absolute -bottom-6 right-0 hidden w-48 sm:block lg:right-12 lg:w-72"
        />
      </Reveal>
    </section>
  );
};

export default DownloadCta;
