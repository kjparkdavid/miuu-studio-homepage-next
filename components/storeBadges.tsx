import Image from "next/image";
import googlePlay from "@/public/images/diaryApp/googlePlay.png";
import appleStore from "@/public/images/diaryApp/appleStore.png";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links";

const StoreBadges = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform duration-200 hover:-translate-y-0.5"
      >
        <Image src={appleStore} alt="Download on the App Store" className="h-12 w-auto" />
      </a>
      <a
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform duration-200 hover:-translate-y-0.5"
      >
        <Image src={googlePlay} alt="Get it on Google Play" className="h-12 w-auto" />
      </a>
    </div>
  );
};

export default StoreBadges;
