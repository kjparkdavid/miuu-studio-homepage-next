import { Montserrat } from "next/font/google";
import Head from "next/head";
import SiteNav from "@/components/siteNav";
import Hero from "@/components/hero";
import Features from "@/components/features";
import HomesSection from "@/components/homesSection";
import Testimonials from "@/components/testimonials";
import FriendsSection from "@/components/friendsSection";
import Faq from "@/components/faq";
import DownloadCta from "@/components/downloadCta";
import Footer from "@/components/footer";
import { APP_STORE_URL, GOOGLE_PLAY_URL, SOCIAL_LINKS } from "@/lib/links";
import { FAQ } from "@/lib/faq";

const body = Montserrat({ subsets: ["latin"], variable: "--font-body" });

const SITE_URL = "https://miuunote.site/";
const TITLE = "Miuu Note: Cute Journal & Diary App with Lock";
const DESCRIPTION =
  "Miuu Note is a cute, private journal app for iPhone & Android. Write with gentle prompts, track moods with stickers, keep a gratitude jar and decorate a cozy room.";
const OG_IMAGE = `${SITE_URL}images/app/home.jpg`;

// Structured data so search engines and AI assistants can read what the app is and answer questions about it
const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Miuu Note",
    alternateName: ["Miuu Note: Cute Diary Journal", "Miuu Diary"],
    description: DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}images/app-icon.png`,
    operatingSystem: "iOS, Android",
    applicationCategory: "LifestyleApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    installUrl: [APP_STORE_URL, GOOGLE_PLAY_URL],
    inLanguage: ["en", "ko", "ja", "zh", "es", "fr", "de", "pt", "it", "th", "tr", "id", "ru", "ar"],
    featureList: [
      "Private diary with passcode and Face ID lock",
      "Daily journal prompts",
      "Custom photo stickers and deco stickers",
      "Journal backgrounds",
      "Voice recording and drawing in entries",
      "Mood tracker with stickers and calendar",
      "Gratitude journal",
      "Sticker collection",
      "Journals and folders",
      "Cozy room decorating",
      "Backup and restore with Apple or Google sign-in",
      "Home screen widget",
    ],
    publisher: { "@type": "Organization", name: "Miuu Studio" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Miuu Studio",
    url: SITE_URL,
    logo: `${SITE_URL}images/app-icon.png`,
    email: "support@miuustudio.com",
    sameAs: SOCIAL_LINKS.map((social) => social.href),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Miuu Note" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="apple-itunes-app" content="app-id=6446296872" />
        <meta name="theme-color" content="#6A1CF6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </Head>
      <main className={`${body.variable} bg-canvas font-body text-ink antialiased`}>
        <SiteNav />
        <Hero />
        <Features />
        <HomesSection />
        <Testimonials />
        <FriendsSection />
        <Faq />
        <DownloadCta />
        <Footer />
      </main>
    </>
  );
}
