import Image from "next/image";
import miyomiRibbon from "@/public/images/miuuShop/miyomiRibbon.gif";

const MiuuShopSection = () => {
  return (
    <div className="bg-smoothRed px-6 pt-9 pb-16 text-center items-center flex flex-col">
      <h3 className="font-bold text-xl">Visit our Miuu Studio Store!</h3>
      <Image
        src={miyomiRibbon}
        alt={"miyomiRibbon"}
        width={129}
        className="mt-6 mb-8"
      />
      <a className="text-md" href="https://miuustudio.com/" target="_blank">
        Visit Miuu Studio Store
      </a>
    </div>
  );
};

export default MiuuShopSection;
