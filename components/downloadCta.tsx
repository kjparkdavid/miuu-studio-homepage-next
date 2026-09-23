import Image from "next/image";
import appIcon from "@/public/images/app-icon.png";
import gamerMiuu from "@/public/images/outfits/gamer.png";
import StoreBadges from "@/components/storeBadges";
import Reveal from "@/components/reveal";

const DownloadCta = () => {
  return (
    <section id="download" className="scroll-mt-16 bg-canvas px-4 pb-24 sm:px-6">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-soft via-violet to-violet-deep px-6 py-16 text-center text-white sm:px-16">
        <Image
          src={gamerMiuu}
          alt=""
          className="absolute -bottom-3 right-4 hidden w-32 animate-float drop-shadow-lg sm:block lg:right-10 lg:w-40"
        />
        <Image src={appIcon} alt="Miuu Note app icon" width={88} height={88} className="mx-auto rounded-3xl shadow-phone" />
        <h2 className="mt-8 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Start your journal today
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base font-medium text-white/80 sm:text-lg">
          Miuu Note is free to download on iPhone, iPad and Android. Even one line counts.
        </p>
        <StoreBadges className="mt-10 justify-center" />
      </Reveal>
    </section>
  );
};

export default DownloadCta;
