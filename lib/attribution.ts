import { useEffect, useState } from "react";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links";

/**
 * Where a visitor came from, carried into the Google Play link as the install
 * referrer. Firebase Analytics reads the referrer's `utm_*` fields on the app's
 * first open, so an install from the site shows up in GA4 under "First user
 * source" (e.g. `instagram / social`) instead of `google-play / organic`.
 *
 * The App Store link carries it as a campaign token instead (`ct`), which App
 * Store Connect counts in App Analytics → Acquisition → Campaigns: page views,
 * downloads and proceeds per campaign, for opted-in users.
 *
 * A social profile links to its short link (`miuunote.site/ig`), which is the
 * home page credited to that network. Otherwise a landing's `utm_*` query
 * counts, then the referring site's host, and a visit with none of these is
 * credited to the site itself.
 */
export type Attribution = { source: string; medium: string; campaign?: string };

export const SITE_ATTRIBUTION: Attribution = { source: "miuunote.site", medium: "website" };

/**
 * The short links for social bios: `miuunote.site/<key>` is the home page
 * (`pages/[short].tsx`) credited to that network. They win over the query
 * string, because Instagram appends its own `utm_source=ig` to bio links.
 */
export const SHORT_LINKS: Record<string, Attribution> = {
  ig: { source: "instagram", medium: "social" },
  tt: { source: "tiktok", medium: "social" },
  yt: { source: "youtube", medium: "social" },
};

const STORAGE_KEY = "miuu_attribution";
const MAX_LENGTH = 50;

/** A UTM value reduced to lowercase `a-z 0-9 . _ -`; null when nothing is left. */
const clean = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, MAX_LENGTH);
  return cleaned || null;
};

/**
 * The attribution a landing carried, from its short link, query string or
 * referring page; null if it carried none. A referrer on the page's own host
 * is a hop within the site.
 */
export const attributionFromLanding = (
  { pathname, search, hostname }: Pick<Location, "pathname" | "search" | "hostname">,
  referrer: string,
): Attribution | null => {
  const short = pathname.replace(/^\/|\/$/g, "");
  if (Object.prototype.hasOwnProperty.call(SHORT_LINKS, short)) return SHORT_LINKS[short];

  const params = new URLSearchParams(search);
  const source = clean(params.get("utm_source"));
  if (source) {
    const campaign = clean(params.get("utm_campaign"));
    return {
      source,
      medium: clean(params.get("utm_medium")) ?? "referral",
      ...(campaign ? { campaign } : {}),
    };
  }
  try {
    const host = clean(new URL(referrer).hostname.replace(/^www\./, ""));
    const own = clean(hostname.replace(/^www\./, ""));
    if (host && host !== own) return { source: host, medium: "referral" };
  } catch {
    // No referrer, or not a URL
  }
  return null;
};

/** The App Store Connect provider ID (Jin Park), required beside `ct` for a campaign link. */
const APP_STORE_PROVIDER_ID = "126163554";
const CAMPAIGN_TOKEN_MAX = 40;

/**
 * The App Store link credited to a campaign token: the source alone
 * (`instagram`, `miuunote.site`), because App Store Connect lists campaigns by
 * name only and caps them at 40 characters.
 */
export const appStoreUrlWithCampaign = (campaign: string): string => {
  const params = new URLSearchParams({
    pt: APP_STORE_PROVIDER_ID,
    ct: campaign.slice(0, CAMPAIGN_TOKEN_MAX),
    mt: "8",
  });
  return `${APP_STORE_URL}?${params.toString()}`;
};

/** The Play link with this attribution as its install referrer. */
export const playUrlWithAttribution = ({ source, medium, campaign }: Attribution): string => {
  const referrer = new URLSearchParams({ utm_source: source, utm_medium: medium });
  if (campaign) referrer.set("utm_campaign", campaign);
  return `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(referrer.toString())}`;
};

const readStored = (): Attribution | null => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    return typeof stored?.source === "string" && typeof stored?.medium === "string" ? stored : null;
  } catch {
    return null;
  }
};

const store = (attribution: Attribution) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage blocked; this page view still uses it
  }
};

/**
 * This visitor's attribution: the landing's, saved for the browser session so
 * it survives a hop to another page on the site, or the one saved earlier.
 * Idempotent, so every page can call it on load — `_app` does, so a landing on
 * a page without store badges still counts.
 */
export const captureAttribution = (): Attribution | null => {
  const landing = attributionFromLanding(window.location, document.referrer);
  if (landing) store(landing);
  return landing ?? readStored();
};

const storeUrls = (attribution: Attribution) => ({
  appStoreUrl: appStoreUrlWithCampaign(attribution.source),
  playUrl: playUrlWithAttribution(attribution),
});

/**
 * Both store links for this visitor. The static render (and a visitor without
 * JS) gets the site's own attribution.
 */
export const useStoreUrls = (): { appStoreUrl: string; playUrl: string } => {
  const [urls, setUrls] = useState(() => storeUrls(SITE_ATTRIBUTION));

  useEffect(() => {
    const attribution = captureAttribution();
    if (attribution) setUrls(storeUrls(attribution));
  }, []);

  return urls;
};
