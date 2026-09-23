import Image from "next/image";
import Link from "next/link";
import instagram from "@/public/images/footer/instagram.png";
import tiktok from "@/public/images/footer/tiktok.png";
import youtube from "@/public/images/footer/youtube.png";
import logo from "@/public/images/mobileHeader/logo.png";
import { SOCIAL_LINKS } from "@/lib/links";

const SOCIAL_ICONS = { Instagram: instagram, TikTok: tiktok, YouTube: youtube };

const Footer = () => {
  return (
    <footer className="border-t border-ink/10 bg-canvas px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Image src={logo} alt="Miuu Studio" width={160} />
          <p className="mt-4 max-w-xs text-sm font-medium text-ink/60">
            We make cute, gentle things starring Miuu and friends, to bring a little joy to every day.
          </p>
          <div className="mt-5 flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:-translate-y-0.5"
              >
                <Image
                  src={SOCIAL_ICONS[social.name as keyof typeof SOCIAL_ICONS]}
                  alt={`Miuu Studio on ${social.name}`}
                  width={36}
                  height={36}
                />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm font-semibold">
          <div className="flex gap-8">
            <a href="#features" className="hover:text-violet">Features</a>
            <a href="#faq" className="hover:text-violet">FAQ</a>
            <Link href="/privacy-policy" className="hover:text-violet">Privacy Policy</Link>
          </div>
          <p className="font-medium text-ink/60">
            Contact:{" "}
            <a href="mailto:support@miuustudio.com" className="font-semibold text-ink hover:text-violet">
              support@miuustudio.com
            </a>
          </p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs font-medium text-ink/50">
        © {new Date().getFullYear()} Miuu Studio
      </p>
    </footer>
  );
};

export default Footer;
