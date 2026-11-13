import Head from "next/head";
import { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";

import { appStoreUrlWithCampaign, playUrlWithAttribution } from "@/lib/attribution";
import { trackStoreClick } from "@/lib/analytics";
import { formatVillageCode, normalizeVillageCode, villageAppLink } from "@/lib/villageInvite";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const SITE = "https://miuunote.site";
const TITLE = "Be neighbors in Miuu";
const LINE = "Your friend wants you in their village. Add their code and visit each other's rooms.";
// Installs from village invites, as their own campaign in App Store Connect and on Play
const VILLAGE_APP_STORE_URL = appStoreUrlWithCampaign("village");
const VILLAGE_PLAY_URL = playUrlWithAttribution({ source: "village", medium: "invite" });

type View = { kind: "loading" } | { kind: "invite"; code: string } | { kind: "no-code" };

/**
 * `/village/?c=XXXX-XXXX` (secret-note#2508): the link a village invite shares.
 *
 * - **With Miuu installed**, "Open in Miuu" opens the village with the friend's
 *   code filled in (the app's own link, `villageAppLink`).
 * - **Without it**, the code is on screen with a copy button, the stores, and
 *   where in Miuu to enter it. No install referrer: unlike a referral, a
 *   neighbour code is added by hand after install.
 * - **A link that lost its code** says so and offers the stores.
 *
 * Static export: the code is read in the browser, never at build time.
 */
const VillageInvitePage = () => {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const code = normalizeVillageCode(new URLSearchParams(window.location.search).get("c"));
    setView(code ? { kind: "invite", code } : { kind: "no-code" });
  }, []);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(formatVillageCode(code));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be refused; the code is on screen to type.
    }
  };

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={LINE} />
        <meta name="robots" content="noindex" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Miuu Note" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={LINE} />
        <meta property="og:url" content={`${SITE}/village/`} />
        <meta property="og:image" content={`${SITE}/images/invite/og.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={LINE} />
        <meta name="twitter:image" content={`${SITE}/images/invite/og.png`} />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <main
        className={`${montserrat.className} flex min-h-screen items-center justify-center px-6 py-16`}
        style={{ background: "linear-gradient(180deg, #D6E8FA 0%, #EEF0FA 55%, #F4F2F6 100%)" }}
      >
        <div className="flex w-full max-w-[354px] flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/invite/miuu-and-miyomi.webp" alt="Miuu and Miyomi" width={140} height={115} className="mb-6" />

          <h1 className="text-[26px] font-bold leading-tight text-[#4A2F6B]">{TITLE}</h1>
          <p className="mt-3 text-[14px] text-[#755E82]">
            {view.kind === "no-code"
              ? "This invite link is missing its code. Ask your friend to send it again, or get Miuu now."
              : LINE}
          </p>

          {view.kind === "loading" && <div className="mt-12 h-[86px]" aria-hidden />}

          {view.kind === "invite" && (
            <>
              <p className="mt-12 text-[36px] font-bold tracking-[0.06em] text-[#2D2D2D]" data-testid="village-code">
                {formatVillageCode(view.code)}
              </p>
              <button type="button" onClick={() => copy(view.code)} className="mt-2 text-[14px] font-semibold text-[#651DFF]">
                {copied ? "Copied!" : "Copy code"}
              </button>
              <a
                href={villageAppLink(view.code)}
                className="mt-10 w-full rounded-full bg-[#651DFF] py-4 text-[16px] font-semibold text-white"
              >
                Open in Miuu
              </a>
            </>
          )}

          <a
            href={VILLAGE_APP_STORE_URL}
            onClick={() => trackStoreClick("app_store")}
            className={`${view.kind === "invite" ? "mt-3" : "mt-10"} w-full rounded-full bg-[#111111] py-4 text-[16px] font-semibold text-white`}
          >
            Get Miuu on the App Store
          </a>
          <a
            href={VILLAGE_PLAY_URL}
            onClick={() => trackStoreClick("google_play")}
            className="mt-3 w-full rounded-full bg-[#111111] py-4 text-[16px] font-semibold text-white"
          >
            Get Miuu on Google Play
          </a>
          {view.kind === "invite" && (
            <p className="mt-4 text-[13px] text-[#755E82]">
              Then in Miuu: swipe Home to the village → + → enter the code
            </p>
          )}
        </div>
      </main>
    </>
  );
};

export default VillageInvitePage;
