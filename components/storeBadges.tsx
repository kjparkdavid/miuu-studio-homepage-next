import Image from "next/image";
import googlePlay from "@/public/images/diaryApp/googlePlay.png";
import appleStore from "@/public/images/diaryApp/appleStore.png";
import { useStoreUrls } from "@/lib/attribution";
import { trackStoreClick } from "@/lib/analytics";

const StoreBadges = ({ className = "" }: { className?: string }) => {
  const { appStoreUrl, playUrl } = useStoreUrls();

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={appStoreUrl}
        target="_blank"
        // No noreferrer: App Store Connect credits miuunote.site as a web referrer
        rel="noopener"
        onClick={() => trackStoreClick("app_store")}
        className="transition-transform duration-200 hover:-translate-y-0.5"
      >
        <Image src={appleStore} alt="Download on the App Store" className="h-12 w-auto" />
      </a>
      <a
        href={playUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackStoreClick("google_play")}
        className="transition-transform duration-200 hover:-translate-y-0.5"
      >
        <Image src={googlePlay} alt="Get it on Google Play" className="h-12 w-auto" />
      </a>
    </div>
  );
};

export default StoreBadges;
