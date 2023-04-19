import Image from "next/image";
import miyomiRibbon from "@/public/images/miuuShop/miyomiRibbon.gif";

const MiuuShopSection = () => {
  return (
    <div className="bg-smoothRed px-6 pt-9 pb-16 text-center items-center flex flex-col">
      <h3 className="font-bold text-xl">Miuu Shop is Coming Soon!</h3>
      <Image
        src={miyomiRibbon}
        alt={"miyomiRibbon"}
        width={129}
        className="mt-6 mb-8"
      />
      <p className="text-sm">
        We are preparing official Miuu Studio shop. <br></br>Be the first to
        know when we launch!
      </p>
    </div>
  );
};

export default MiuuShopSection;
