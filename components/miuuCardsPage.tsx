import Head from "next/head";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import type { ReactNode } from "react";

const montserrat = Montserrat({ subsets: ["latin"] });

export const MIUU_CARDS_SUPPORT_EMAIL = "support@miuustudio.com";

const PAGES = [
  { href: "/miuu-cards/support/", label: "Support" },
  { href: "/miuu-cards/privacy-policy/", label: "Privacy Policy" },
  { href: "/miuu-cards/terms/", label: "Terms of Service" },
];

type Props = {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
};

/** The frame every Miuu Card Club page shares: the app's name, the page and links to the others. */
const MiuuCardsPage = ({ title, description, path, children }: Props) => {
  return (
    <>
      <Head>
        <title>{`${title} · Miuu Card Club`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://miuunote.site${path}`} />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className={`${montserrat.className} min-h-screen bg-white text-gray-900`}>
        <header className="max-w-2xl mx-auto px-6 pt-10">
          <Link href="/miuu-cards/support/" className="text-lg font-bold text-[#7350E8]">
            Miuu Card Club
          </Link>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8 leading-relaxed">{children}</main>

        <footer className="max-w-2xl mx-auto px-6 pb-12 text-sm text-gray-400">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {PAGES.map((page) => (
              <Link key={page.href} href={page.href} className="underline hover:text-gray-600">
                {page.label}
              </Link>
            ))}
          </nav>
          <p className="mt-4">Miuu Card Club is made by Miuu Studio.</p>
        </footer>
      </div>
    </>
  );
};

/** A section heading inside a Miuu Card Club page. */
export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-8 space-y-3">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

/** A bulleted list inside a Miuu Card Club page. */
export const Bullets = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-5 space-y-1.5">{children}</ul>
);

/** The support address as a link. */
export const SupportEmail = () => (
  <a href={`mailto:${MIUU_CARDS_SUPPORT_EMAIL}`} className="underline text-[#7350E8]">
    {MIUU_CARDS_SUPPORT_EMAIL}
  </a>
);

/** An external link that opens in a new tab. */
export const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-[#7350E8]">
    {children}
  </a>
);

export default MiuuCardsPage;
