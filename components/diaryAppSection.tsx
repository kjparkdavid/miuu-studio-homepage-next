import Image from "next/image";
import appIcon from "@/public/images/diaryApp/appIcon.png";
import appMain from "@/public/images/diaryApp/appMain.png";
import googlePlay from "@/public/images/diaryApp/googlePlay.png";
import appleStore from "@/public/images/diaryApp/appleStore.png";

const DiaryAppSection = () => {
  return (
    <div className="flex flex-col items-center text-center">
      <Image src={appIcon} alt={"appIcon"} width={64} height={64} />
      <h2 className="text-3xl font-bold mt-4">Miuu Note</h2>
      <p className="font-semibold text-base">A Cute Diary with Lock</p>
      <p className="mt-3 text-sm">
        Miuu note-a cute & secure diary with cute mood stickers. Express
        thoughts daily!
      </p>
      <Image src={appMain} alt={"appMain"} className="flex-1 mt-10 mb-12" />

      <a
        href="https://play.google.com/store/apps/details?id=com.miuustudio.miuudiary"
        target={"_blank"}
      >
        <Image
          src={googlePlay}
          alt={"googlePlay"}
          width={220}
          className="mb-4"
        />
      </a>
      <a
        href="https://apps.apple.com/us/app/miuu-note-cute-diary-with-lock/id6446296872"
        target={"_blank"}
      >
        <Image
          src={appleStore}
          alt={"appleStore"}
          width={220}
          className="mb-12"
        />
      </a>
    </div>
  );
};

export default DiaryAppSection;
