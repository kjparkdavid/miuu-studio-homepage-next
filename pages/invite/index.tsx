import Head from "next/head";
import { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";

import { APP_STORE_URL } from "@/lib/links";
import { formatCode, isAndroid, normalizeCode, playInviteUrl } from "@/lib/invite";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const SITE = "https://miuunote.site";
const TITLE = "Your friend invited you to Miuu";
// The friend's gift comes with their first entry, never with the download
// (App Store 3.2.2, secret-note#1184) — the page says so, and never frames
// the coins as a reward for installing.
const GIFT_LINE = "Write your first entry to get 150 coins.";

type View =
  | { kind: "loading" }
  | { kind: "android"; code: string }
  | { kind: "invite"; code: string }
  | { kind: "no-code" };

/**
 * `/invite/?c=CODE` (secret-note#1210, Figma W01 `3811:160`, preview W02
 * `3811:178`): the one link every share carries.
 *
 * - **Android** is sent straight to Google Play with the code as the install
 *   referrer, so the app redeems it on first open without anyone typing it.
 *   A button stays on screen in case the redirect is blocked.
 * - **iPhone and desktop** see the code, a copy button, the App Store, and
 *   where in Miuu to enter it. Desktop gets the Play link too.
 *
 * Static export: the code is read in the browser, never at build time.
 */
const InvitePage = () => {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [copied, setCopied] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const code = normalizeCode(new URLSearchParams(window.location.search).get("c"));
    const ua = navigator.userAgent;
    setDesktop(!/iphone|ipad|ipod|android/i.test(ua));
    if (!code) {
      setView({ kind: "no-code" });
      return;
    }
    if (isAndroid(ua)) {
      setView({ kind: "android", code });
      window.location.replace(playInviteUrl(code));
      return;
    }
    setView({ kind: "invite", code });
  }, []);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(formatCode(code));
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
        <meta name="description" content={GIFT_LINE} />
        <meta name="robots" content="noindex" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Miuu Note" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={GIFT_LINE} />
        <meta property="og:url" content={`${SITE}/invite/`} />
        <meta property="og:image" content={`${SITE}/images/invite/og.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Miuu — give 150, get 300" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={GIFT_LINE} />
        <meta name="twitter:image" content={`${SITE}/images/invite/og.png`} />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <main
        className={`${montserrat.className} flex min-h-screen items-center justify-center px-6 py-16`}
        style={{ background: "linear-gradient(180deg, #E8DCFF 0%, #F6E6F0 55%, #FFE9D6 100%)" }}
      >
        <div className="flex w-full max-w-[354px] flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/invite/miuu-and-miyomi.webp"
            alt="Miuu and Miyomi"
            width={140}
            height={115}
            className="mb-6"
          />

          {view.kind === "no-code" ? (
            <>
              <h1 className="text-[26px] font-bold leading-tight text-[#4A2F6B]">
                A cozy little diary with Miuu
              </h1>
              <p className="mt-3 text-[14px] text-[#755E82]">
                This invite link is missing its code. Ask your friend to send it again, or get Miuu now.
              </p>
              <a
                href={APP_STORE_URL}
                className="mt-10 w-full rounded-full bg-[#111111] py-4 text-[16px] font-semibold text-white"
              >
                Get Miuu on the App Store
              </a>
            </>
          ) : (
            <>
              <h1 className="text-[26px] font-bold leading-tight text-[#4A2F6B]">{TITLE}</h1>
              <p className="mt-3 text-[14px] text-[#755E82]">{GIFT_LINE}</p>

              {view.kind === "loading" ? (
                <div className="mt-12 h-[86px]" aria-hidden />
              ) : (
                <>
                  <p
                    className="mt-12 text-[36px] font-bold tracking-[0.06em] text-[#2D2D2D]"
                    data-testid="invite-code"
                  >
                    {formatCode(view.code)}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(view.code)}
                    className="mt-2 text-[14px] font-semibold text-[#651DFF]"
                  >
                    {copied ? "Copied!" : "Copy code"}
                  </button>
                </>
              )}

              {view.kind === "android" ? (
                <>
                  <a
                    href={playInviteUrl(view.code)}
                    className="mt-10 w-full rounded-full bg-[#111111] py-4 text-[16px] font-semibold text-white"
                  >
                    Get Miuu on Google Play
                  </a>
                  <p className="mt-4 text-[13px] text-[#755E82]">Opening Google Play…</p>
                </>
              ) : (
                <>
                  <a
                    href={APP_STORE_URL}
                    className="mt-10 w-full rounded-full bg-[#111111] py-4 text-[16px] font-semibold text-white"
                  >
                    Get Miuu on the App Store
                  </a>
                  <p className="mt-4 text-[13px] text-[#755E82]">
                    Then in Miuu: Settings → Got a friend&rsquo;s code?
                  </p>
                  {desktop && view.kind === "invite" && (
                    <a
                      href={playInviteUrl(view.code)}
                      className="mt-6 text-[13px] font-semibold text-[#651DFF]"
                    >
                      On Android? Get it on Google Play — the code comes with it
                    </a>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default InvitePage;
