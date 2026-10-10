// Game analytics + store links. Mirrors the site's lib/analytics.ts and lib/attribution.ts
// (same GA4 property, same rules) because this page is plain static HTML outside Next.js.
// Keep the two in step if either changes.
//
// The gtag bootstrap (consent defaults + config) lives inline in index.html. If it is absent,
// every call here is a no-op, so the game runs the same with or without analytics.

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"];
const gtag = (...args) => { if (typeof window.gtag === "function") window.gtag(...args); };

/** A UTM value reduced to lowercase a-z 0-9 . _ - (max 50); null when nothing is left. */
const clean = (value) => {
  if (!value) return null;
  const cleaned = String(value).toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 50);
  return cleaned || null;
};

/** The page URL as GA sees it: path plus the visit's utm_*, never the stage, challenge time or anything else. */
export function pageLocation(loc = window.location) {
  const params = new URLSearchParams(loc.search), utm = new URLSearchParams();
  for (const key of UTM_KEYS) { const v = clean(params.get(key)); if (v) utm.set(key, v); }
  const query = utm.toString();
  return `${loc.origin}${loc.pathname}${query ? `?${query}` : ""}`;
}

export function trackPageView() {
  gtag("set", { page_location: pageLocation() });
  gtag("event", "page_view", { page_title: document.title });
}

/** One game event. Parameters are small labels and numbers only: never a nickname or free text. */
export function track(name, params = {}) {
  gtag("event", name, params);
}

// ---------------- where the visitor came from (same rules as the site) ----------------
const STORAGE_KEY = "miuu_attribution";
const SITE = { source: "miuunote.site", medium: "website" };

function fromLanding() {
  const params = new URLSearchParams(location.search);
  const source = clean(params.get("utm_source"));
  if (source) return { source, medium: clean(params.get("utm_medium")) ?? "referral" };
  try {
    const host = clean(new URL(document.referrer).hostname.replace(/^www\./, ""));
    const own = clean(location.hostname.replace(/^www\./, ""));
    if (host && host !== own) return { source: host, medium: "referral" };
  } catch { /* no referrer */ }
  return null;
}

export function attribution() {
  const landing = fromLanding();
  if (landing) { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(landing)); } catch {} return landing; }
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (stored && typeof stored.source === "string" && typeof stored.medium === "string") return stored;
  } catch {}
  return SITE;
}

// ---------------- store links credited to the game ----------------
const APP_STORE_URL = "https://apps.apple.com/us/app/miuu-note-cute-diary-with-lock/id6446296872";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.miuustudio.miuudiary";
const APP_STORE_PROVIDER_ID = "126163554";

/**
 * The link behind "Get the Miuu Note app": straight to the visitor's store, tagged so installs show
 * up as coming from the game. App Store campaign token "game-<source>" (40 chars max); Google Play
 * install referrer with utm_campaign=game. Desktop gets the home page, which shows both badges.
 */
export function storeLink(ua = navigator.userAgent) {
  const { source, medium } = attribution();
  if (/iphone|ipad|ipod/i.test(ua)) {
    const q = new URLSearchParams({ pt: APP_STORE_PROVIDER_ID, ct: `game-${source}`.slice(0, 40), mt: "8" });
    return { store: "app_store", href: `${APP_STORE_URL}?${q}` };
  }
  if (/android/i.test(ua)) {
    const referrer = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: "game" });
    return { store: "google_play", href: `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(referrer.toString())}` };
  }
  return { store: null, href: "/" };
}

// ---------------- sharing ----------------
/** The link a player shares: opens the same stage, shows their time to beat, and is counted as a share visit. */
export function shareUrl(stageId, time) {
  const q = new URLSearchParams({ stage: stageId });
  if (time) q.set("b", time.toFixed(1));
  q.set("utm_source", "share"); q.set("utm_medium", "game"); q.set("utm_campaign", stageId);
  return `${location.origin}${location.pathname}?${q}`;
}

/** Opens the phone's share sheet, or copies the link where there isn't one. Resolves to "native" | "copy" | null. */
export async function share({ text, url }) {
  if (navigator.share) {
    try { await navigator.share({ title: "Miuu's Diary Chase", text, url }); return "native"; }
    catch (e) { if (e && e.name === "AbortError") return null; }   // closed the sheet: not a share
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return "copy"; } catch { return null; }
}

/** A friend's time to beat, from a shared link (?b=24.3). */
export function challengeTime() {
  const b = Number(new URLSearchParams(location.search).get("b"));
  return Number.isFinite(b) && b >= 10 && b <= 300 ? Math.round(b * 10) / 10 : null;
}
