import Image from "next/image";
import googlePlay from "@/public/images/diaryApp/googlePlay.png";
import appleStore from "@/public/images/diaryApp/appleStore.png";
import { APP_STORE_URL } from "@/lib/links";
import { usePlayUrl } from "@/lib/attribution";

const StoreBadges = ({ className = "" }: { className?: string }) => {
  const playUrl = usePlayUrl();

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
        href={playUrl}
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
