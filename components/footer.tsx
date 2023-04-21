import Image from "next/image";
import instagram from "@/public/images/footer/instagram.png";
import tiktok from "@/public/images/footer/tiktok.png";
import youtube from "@/public/images/footer/youtube.png";
import Link from "next/link";

const Footer = () => {
  return (
    <div className="flex flex-col text-center items-center pt-6 sm:pt-11 px-6 sm:px-0 pb-10 sm:pb-14">
      <p className="text-sm sm:text-base">
        Follow us @miuustudio for fun animations about Miuu friends!
      </p>
      <div className="flex mt-2 sm:mt-8">
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

      <span className="w-full h-[1px] bg-black my-6 sm:mt-16"></span>

      <div className="sm:container ">
        <div className="w-full sm:w-1/2 grid grid-cols-2 sm:grid-cols-3 gap-3 justify-between text-left sm:text-center m-auto left-0 right-0">
          <a href="#" className="font-bold">
            Home
          </a>
          <a href="#characters" className="font-bold">
            Characters
          </a>
          <a href="#diaryApp" className="font-bold">
            Miuu Diary App
          </a>
        </div>
      </div>

      <div className="mt-6 sm:mt-10 text-xs sm:flex">
        <p className="me-3">2023 &copy; MiuuStudio</p>
        <Link href={"/privacy-policy"}>
          <p>Privacy Policy</p>
        </Link>
      </div>
    </div>
  );
};

export default Footer;
