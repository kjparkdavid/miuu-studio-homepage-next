import Image from "next/image";
import { Montserrat } from "next/font/google";
import Head from "next/head";
import MobileHeader from "@/components/mobileHeader";
import { getAllCharacters } from "@/lib/characters";
import CharacterThumbnail from "@/components/characterThumbnail";
import DiaryAppSection from "@/components/diaryAppSection";
import MiuuShopSection from "@/components/miuuShopSection";
import Footer from "@/components/footer";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function Home() {
  const allCharacters = getAllCharacters();

  return (
    <>
      <Head>
        <title>Miuu Studio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
      </Head>
      <main
        className={`flex min-h-screen flex-col justify-between ${montserrat.className}`}
      >
        <div className="w-full sm:hidden">
          <MobileHeader />
        </div>

        {/* TODO: Build Desktop Header Separately */}

        {/* CHARACTERS */}
        <div className="px-6 mt-20">
          <h2 className="text-base font-bold mb-4">Characters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 justify-between">
            {allCharacters.map((character, i) => {
              return <CharacterThumbnail {...character} key={i} />;
            })}
          </div>
        </div>

        {/* DIARY APP SECTION */}
        <div className="px-6 mt-20">
          <h2 className="text-base font-bold mb-4">Diary App</h2>
          <DiaryAppSection />
        </div>

        {/* MIUU SHOP SECTION */}
        <MiuuShopSection />

        {/* FOOTER SECTION */}
        <Footer />
      </main>
    </>
  );
}
