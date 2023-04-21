import Image from "next/image";
import topImage from "@/public/images/mobileHeader/top-image.png";
import bottomImage from "@/public/images/mobileHeader/bottom-image.png";
import mainCharacters from "@/public/images/mobileHeader/main-characters.png";
import logo from "@/public/images/mobileHeader/logo.png";
import cattyWorld from "@/public/images/mobileHeader/cattyworld.gif";
import instagram from "@/public/images/footer/instagram.png";
import tiktok from "@/public/images/footer/tiktok.png";
import youtube from "@/public/images/footer/youtube.png";

const MiuuHeader = () => {
  return (
    <div className="w-full">
      <div className="bg-[#FFFFDB] h-screen w-full items-center flex flex-col">
        <div className="pt-10 z-50 hidden sm:flex">
          <a href="#" className="font-bold me-16">
            Home
          </a>
          <a href="#characters" className="font-bold me-16">
            Characters
          </a>
          <a href="#diaryApp" className="font-bold">
            Miuu Diary App
          </a>
        </div>

        <div className="w-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Image
            src={cattyWorld}
            alt={"cattyWorld"}
            width={172}
            className="m-auto left-0 right-0"
          />
          <Image
            src={logo}
            alt={"logo"}
            width={320}
            className="m-auto left-0 right-0"
          />
        </div>

        <Image
          src={topImage}
          alt={"topImage"}
          className="w-full sm:hidden absolute top-0 left-0"
        />
        <Image
          src={bottomImage}
          alt={"bottomImage"}
          className="w-full absolute bottom-0 left-0"
        />
        <Image
          src={mainCharacters}
          alt={"mainCharacters"}
          className="absolute bottom-0 absolute m-auto left-0 right-0 sm:w-1/2 sm:max-w-4xl"
          width={362}
          unoptimized={true}
        />

        <div className="hidden sm:flex absolute bottom-8 right-10">
          <a
            href="https://www.instagram.com/miuustudio/"
            target={"_blank"}
            className="me-6"
          >
            <Image src={instagram} alt={"instagram"} width={48} height={48} />
          </a>
          <a
            href="https://www.tiktok.com/@miuustudio"
            target={"_blank"}
            className="me-6"
          >
            <Image src={tiktok} alt={"tiktok"} width={48} height={48} />
          </a>
          <a href="https://www.youtube.com/@miuustudio" target={"_blank"}>
            <Image src={youtube} alt={"youtube"} width={48} height={48} />
          </a>
        </div>
      </div>
      <div className="px-6 sm:container m-auto left-0 right-0">
        <div className="mt-12">
          <h1 className="text-xl sm:text-4xl font-bold">
            Welcome to Miuu Studio!{" "}
          </h1>
          <p className="mt-6 font-medium text-sm sm:text-xl">
            At Miuu Studio, we create digital products and content featuring
            adorable animals that bring joy and happiness to people&apos;s daily
            lives.
          </p>
          <p className="mt-3 font-medium text-sm sm:text-xl">
            Our mission is to spread happiness and positivity through fun and
            engaging products. We&apos;re passionate about delivering
            high-quality content and design and making our products accessible
            to everyone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiuuHeader;
