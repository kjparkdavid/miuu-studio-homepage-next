import { useEffect, useState } from "react";
import { GOOGLE_PLAY_URL } from "@/lib/links";

/**
 * Where a visitor came from, carried into the Google Play link as the install
 * referrer. Firebase Analytics reads the referrer's `utm_*` fields on the app's
 * first open, so an install from the site shows up in GA4 under "First user
 * source" (e.g. `instagram / social`) instead of `google-play / organic`.
 *
 * Only the Play link can carry it: the App Store drops query strings.
 *
 * Tag a social profile's link with `?utm_source=instagram&utm_medium=social`.
 * An untagged visit from another site falls back to that site's host, and a
 * visit with neither is credited to the site itself.
 */
export type Attribution = { source: string; medium: string; campaign?: string };

export const SITE_ATTRIBUTION: Attribution = { source: "miuunote.site", medium: "website" };

const STORAGE_KEY = "miuu_attribution";
const MAX_LENGTH = 50;

/** A UTM value reduced to lowercase `a-z 0-9 . _ -`; null when nothing is left. */
const clean = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, MAX_LENGTH);
  return cleaned || null;
};

/**
 * The attribution a landing carried, from its query string or referring page;
 * null if it carried none. A referrer on `ownHost` is a hop within the site.
 */
export const attributionFromLanding = (
  search: string,
  referrer: string,
  ownHost: string,
): Attribution | null => {
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
    const own = clean(ownHost.replace(/^www\./, ""));
    if (host && host !== own) return { source: host, medium: "referral" };
  } catch {
    // No referrer, or not a URL
  }
  return null;
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
  const landing = attributionFromLanding(
    window.location.search,
    document.referrer,
    window.location.hostname,
  );
  if (landing) store(landing);
  return landing ?? readStored();
};

/**
 * The Play link for this visitor. The static render (and a visitor without
 * JS) gets the site's own attribution.
 */
export const usePlayUrl = (): string => {
  const [url, setUrl] = useState(() => playUrlWithAttribution(SITE_ATTRIBUTION));

  useEffect(() => {
    const attribution = captureAttribution();
    if (attribution) setUrl(playUrlWithAttribution(attribution));
  }, []);

  return url;
};
