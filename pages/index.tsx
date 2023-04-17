import Image from "next/image";
import { Montserrat } from "next/font/google";
import Header, { Routes } from "@/components/header";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between ${montserrat.className}`}
    >
      <Header activePage={Routes.HOME} />
    </main>
  );
}
