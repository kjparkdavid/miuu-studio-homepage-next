import Image from "next/image";
import instagram from "@/public/images/footer/instagram.png";
import tiktok from "@/public/images/footer/tiktok.png";
import youtube from "@/public/images/footer/youtube.png";
import Link from "next/link";

const Footer = () => {
  return (
    <div className="flex flex-col text-center items-center pt-6 px-6 pb-10">
      <p className="text-sm">
        Follow us @miuustudio for fun animations about Miuu friends!
      </p>
      <div className="flex mt-2">
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

      <span className="w-full h-[1px] bg-black lg:w-1/3 my-6"></span>

      <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-3 justify-between text-left">
        <a href="#" className="font-bold">
          Home
        </a>
        <a href="#" className="font-bold">
          Characters
        </a>
        <a href="#" className="font-bold">
          Miuu Diary App
        </a>
        <a href="#" className="font-bold">
          About
        </a>
      </div>

      <div className="mt-6">
        <p className="me-3">2023 &copy; MiuuStudio</p>
        <Link href={"/privacy-policy"}>
          <p>Privacy Policy</p>
        </Link>
      </div>
    </div>
  );
};

export default Footer;
