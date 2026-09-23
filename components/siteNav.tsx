import { useEffect, useState } from "react";
import Image from "next/image";
import appIcon from "@/public/images/app-icon.png";

// How far down the page the nav slides in; the hero already shows the app name above this
const SHOW_AFTER_PX = 480;

const SiteNav = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tabIndex = visible ? 0 : -1;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-ink/5 bg-canvas/80 backdrop-blur-md transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2" tabIndex={tabIndex}>
          <Image src={appIcon} alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-sm font-bold uppercase tracking-[0.25em]">Miuu Note</span>
        </a>
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href="#features"
            tabIndex={tabIndex}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-lilac hover:text-ink md:block"
          >
            Features
          </a>
          <a
            href="#faq"
            tabIndex={tabIndex}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-lilac hover:text-ink md:block"
          >
            FAQ
          </a>
          <a
            href="#download"
            tabIndex={tabIndex}
            className="ms-2 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-deep"
          >
            Get the app
          </a>
        </div>
      </nav>
    </header>
  );
};

export default SiteNav;
