import Image from "next/image";
import miuuStudioLogo from "@/public/images/miuu-logo.png";
import miuuFriendsBanner from "@/public/images/miuu-banner.png";
import Link from "next/link";

export enum Routes {
  HOME,
  SHOP,
  APP,
  CHARACTERS,
  ABOUT,
}

const Header = ({ activePage }: { activePage: Routes }) => {
  return (
    <nav className="mt-4 flex flex-col">
      <div className="w-full flex justify-center mb-4">
        <Image
          src={miuuStudioLogo}
          alt={"miuuStudioLogo"}
          width={300}
          height={40}
        />
      </div>

      <Image
        src={miuuFriendsBanner}
        alt={"miuuFriendsBanner"}
        className="w-full"
      />

      {/* List of Routes */}
      <div className="w-full flex justify-center mt-5 font-bold">
        <Link
          className={`${activePage === Routes.HOME ? "text-purple" : ""} px-9`}
          aria-current="page"
          href="/"
        >
          HOME
        </Link>
        <Link
          className={`${activePage === Routes.SHOP ? "text-purple" : ""} px-9`}
          aria-current="page"
          href="/"
        >
          SHOP
        </Link>
        <Link
          className={`${activePage === Routes.APP ? "text-purple" : ""} px-9`}
          aria-current="page"
          href="/"
        >
          DIARY APP
        </Link>
        <Link
          className={`${
            activePage === Routes.CHARACTERS ? "text-purple" : ""
          } px-9`}
          aria-current="page"
          href="/"
        >
          CHARACTERS
        </Link>
        <Link
          className={`${activePage === Routes.ABOUT ? "text-purple" : ""} px-9`}
          aria-current="page"
          href="/"
        >
          ABOUT
        </Link>
      </div>
    </nav>
  );
};

export default Header;
