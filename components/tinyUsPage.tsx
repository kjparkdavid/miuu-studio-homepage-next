import Head from "next/head";
import Link from "next/link";
import { Figtree } from "next/font/google";
import type { ReactNode } from "react";

// Tiny Us is set in Figtree in the app, so its pages are too
const figtree = Figtree({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const TINY_US_SUPPORT_EMAIL = "support@miuustudio.com";

const PAGES = [
  { href: "/tiny-us/support/", label: "Support" },
  { href: "/tiny-us/privacy-policy/", label: "Privacy Policy" },
  { href: "/tiny-us/terms/", label: "Terms of Use" },
];

type Props = {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
};

/** The frame every Tiny Us page shares: the wordmark, the page and links to the others. */
const TinyUsPage = ({ title, description, path, children }: Props) => {
  return (
    <>
      <Head>
        <title>{`${title} · Tiny Us`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://miuunote.site${path}`} />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className={`${figtree.className} min-h-screen bg-[#F6F5FA] text-[#1C1A24]`}>
        <header className="max-w-2xl mx-auto px-6 pt-10">
          <Link href="/tiny-us/support/" className="text-xl font-extrabold text-[#651DFF]">
            tiny us
          </Link>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8 font-medium leading-relaxed">{children}</main>

        <footer className="max-w-2xl mx-auto px-6 pb-12 text-sm text-[#9A97A6]">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {PAGES.map((page) => (
              <Link key={page.href} href={page.href} className="underline hover:text-[#651DFF]">
                {page.label}
              </Link>
            ))}
          </nav>
          <p className="mt-4">Tiny Us is made by Miuu Studio.</p>
        </footer>
      </div>
    </>
  );
};

/** A section heading inside a Tiny Us page. */
export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-8 space-y-3">
    <h2 className="text-lg font-bold">{title}</h2>
    {children}
  </section>
);

/** A bulleted list inside a Tiny Us page. */
export const Bullets = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc pl-5 space-y-1.5">{children}</ul>
);

/** The support address as a link. */
export const SupportEmail = () => (
  <a href={`mailto:${TINY_US_SUPPORT_EMAIL}`} className="underline text-[#651DFF]">
    {TINY_US_SUPPORT_EMAIL}
  </a>
);

/** An external link that opens in a new tab. */
export const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-[#651DFF]">
    {children}
  </a>
);

export default TinyUsPage;
