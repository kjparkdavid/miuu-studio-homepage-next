import Image from "next/image";
import topImage from "@/public/images/mobileHeader/top-image.png";
import bottomImage from "@/public/images/mobileHeader/bottom-image.png";
import mainCharacters from "@/public/images/mobileHeader/main-characters.png";
import logo from "@/public/images/mobileHeader/logo.png";
import cattyWorld from "@/public/images/mobileHeader/cattyworld.gif";

const MobileHeader = () => {
  return (
    <div className="w-full">
      <div className="bg-[#FFFFDB] h-screen w-full">
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
          className="w-full absolute top-0 left-0"
        />
        <Image
          src={bottomImage}
          alt={"bottomImage"}
          className="w-full absolute bottom-0 left-0"
        />
        <Image
          src={mainCharacters}
          alt={"mainCharacters"}
          className="absolute bottom-0 absolute m-auto left-0 right-0"
          width={362}
        />
      </div>
      <div className="px-6">
        <div className="mt-12">
          <h1 className="text-xl font-bold">Welcome to Miuu Studio! </h1>
          <p className="mt-6 font-medium text-sm">
            At Miuu Studio, we create digital products and content featuring
            adorable animals that bring joy and happiness to people&apos;s daily
            lives.
          </p>
          <p className="mt-3 font-medium text-sm">
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

export default MobileHeader;
