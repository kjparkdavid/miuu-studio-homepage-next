import { SHORT_LINKS } from "@/lib/attribution";

/**
 * Visits to the site, in Google Analytics — its own GA4 property
 * (`miuunote.site`, properties/556916995), not the app's, so site visitors
 * never land in the app's user counts.
 *
 * The stream's automatic page-change, outbound-click, form and search tracking
 * is switched off in GA4: those send full URLs, and an invite link's URL holds
 * the friend's code (`/invite/?c=…`, and the Play link it opens). Page views and
 * store clicks are sent from here instead, with nothing but the path and the
 * visit's source.
 */
export const GA_MEASUREMENT_ID = "G-EY9SN90KM6";

type Gtag = (...args: unknown[]) => void;

const gtag: Gtag = (...args) => {
  const w = window as unknown as { gtag?: Gtag };
  w.gtag?.(...args);
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/**
 * The page's URL as GA4 sees it: path plus the visit's `utm_*`, nothing else.
 * A short link (`/ig`) is credited to its network, overriding the
 * `utm_source=ig` Instagram appends to bio links — the same rule the Play
 * link's install referrer follows, so a visit and its install share a source.
 */
export const analyticsPageLocation = ({
  origin,
  pathname,
  search,
}: Pick<Location, "origin" | "pathname" | "search">): string => {
  const short = pathname.replace(/^\/|\/$/g, "");
  const utm = new URLSearchParams();
  if (Object.prototype.hasOwnProperty.call(SHORT_LINKS, short)) {
    const { source, medium } = SHORT_LINKS[short];
    utm.set("utm_source", source);
    utm.set("utm_medium", medium);
  } else {
    const params = new URLSearchParams(search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) utm.set(key, value);
    }
  }
  const query = utm.toString();
  return `${origin}${pathname}${query ? `?${query}` : ""}`;
};

/**
 * One page view: on load, and after each in-site navigation, with the page
 * before it as the referrer. `set` rather than event parameters, so the events
 * gtag sends on its own (scrolls, engagement) carry the stripped URL too, never
 * the browser's.
 */
export const trackPageView = (previousLocation?: string) => {
  gtag("set", {
    page_location: analyticsPageLocation(window.location),
    ...(previousLocation ? { page_referrer: previousLocation } : {}),
  });
  gtag("event", "page_view", { page_title: document.title });
};

export type Store = "app_store" | "google_play";

/** A tap on an App Store or Google Play link; `store` is a custom dimension in GA4. */
export const trackStoreClick = (store: Store) => {
  gtag("event", "store_click", { store });
};

// The EEA, the UK and Switzerland. Visitors there get no analytics cookie:
// consent is denied by default and the site has no banner to ask for it, so GA4
// receives cookieless pings it only counts in modelled totals.
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO", "GB", "CH",
];

/**
 * The inline script `_document` puts in the head, ahead of gtag.js: consent
 * defaults first, then the config. Advertising storage and signals are off
 * everywhere; the site shows no ads. `send_page_view: false` because `_app`
 * sends each page view itself, with a URL stripped of anything but UTMs.
 */
export const gtagBootstrap = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: ${JSON.stringify(CONSENT_REGIONS)} });
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
`;
