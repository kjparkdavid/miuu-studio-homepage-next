import Image from "next/image";
import Link from "next/link";
import instagram from "@/public/images/footer/instagram.png";
import tiktok from "@/public/images/footer/tiktok.png";
import youtube from "@/public/images/footer/youtube.png";
import logo from "@/public/images/mobileHeader/logo.png";
import { SOCIAL_LINKS, STUDIO_URL } from "@/lib/links";

const SOCIAL_ICONS = { Instagram: instagram, TikTok: tiktok, YouTube: youtube };

const Footer = () => {
  return (
    <footer className="border-t border-ink/[0.08] px-4 py-14 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <a href={STUDIO_URL} aria-label="Miuu Studio official website">
            <Image src={logo} alt="Miuu Studio" width={140} />
          </a>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-ink/50">
            We make cute, gentle things starring Miuu and friends, to bring a little joy to every day.
          </p>
          <div className="mt-6 flex gap-2.5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70"
              >
                <Image
                  src={SOCIAL_ICONS[social.name as keyof typeof SOCIAL_ICONS]}
                  alt={`Miuu Studio on ${social.name}`}
                  width={28}
                  height={28}
                />
              </a>
            ))}
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm font-medium text-ink/60" aria-label="Footer">
          <a href="#features" className="hover:text-ink">
            Features
          </a>
          <Link href="/privacy-policy" className="hover:text-ink">
            Privacy Policy
          </Link>
          <a href="#faq" className="hover:text-ink">
            FAQ
          </a>
          <a href={STUDIO_URL} className="hover:text-ink">
            Miuu Studio ↗
          </a>
          <a href="mailto:support@miuustudio.com" className="col-span-2 hover:text-ink">
            support@miuustudio.com
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-xs font-medium text-ink/40">© {new Date().getFullYear()} Miuu Studio</p>
    </footer>
  );
};

export default Footer;
