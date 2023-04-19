import Image from "next/image";
import { Montserrat } from "next/font/google";
import Header, { Routes } from "@/components/header";
import MobileHeader from "@/components/mobileHeader";
import { getAllCharacters } from "@/lib/characters";
import CharacterThumbnail from "@/components/characterThumbnail";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function Home() {
  const allCharacters = getAllCharacters();

  return (
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
      </div>
    </main>
  );
}
