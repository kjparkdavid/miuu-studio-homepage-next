/**
 * Village invite links (the app's 우리 마을, secret-note#2508). Pure.
 *
 * A friend code is eight characters of Crockford base32 (`0-9A-Z` without
 * I, L, O and U), shown as `XXXX-XXXX`, with no `MIUU` prefix so it can never
 * be mistaken for a referral code (`lib/invite.ts`). The server
 * (`miuu-note-cloud-tasks` `lib/village.js`) and the app
 * (`src/helpers/Village/VillageFriendCode.ts`) hold the other copies of
 * these rules. Change all three or none.
 *
 * The page never talks to a server: the code only exists in links people
 * choose to share, and adding a friend happens in the app.
 *
 * **The Play link carries the code through the install** (the install
 * referrer, `miuu_village=XXXXXXXX`), with the inviter's referral code beside
 * it when the link had one (`&r=`, `miuu_ref`, `lib/invite.ts`): the app reads
 * both on first open (`VillageFriendCode.parseVillageInstallReferrer`,
 * `ReferralLink.parseInstallReferrer`), holds the friend's code until the
 * village can open, and counts the install as a referral.
 */
import { GOOGLE_PLAY_URL } from "@/lib/links";
import { normalizeCode } from "@/lib/invite";


const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

/** A code from whatever the link carried, forgiving case, dashes and look-alikes; null otherwise. */
export const normalizeVillageCode = (input: unknown): string | null => {
  if (typeof input !== "string") return null;
  const value = input
    .toUpperCase()
    .replace(/[\s\-_]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (value.length !== CODE_LENGTH) return null;
  for (const char of value) {
    if (!CODE_ALPHABET.includes(char)) return null;
  }
  return value;
};

export const formatVillageCode = (code: string): string => `${code.slice(0, 4)}-${code.slice(4)}`;

/** The install-referrer key the app reads a village code from (the app's `VILLAGE_REFERRER_KEY`). */
export const VILLAGE_REFERRER_KEY = "miuu_village";

/**
 * The Play link that installs Miuu with the friend's village code, and the
 * inviter's referral code when there is one, as the install referrer. The
 * `utm_*` pair keeps the install credited to village invites in GA4.
 */
export const villagePlayUrl = (code: string | null, referralCode: string | null): string => {
  const referrer = new URLSearchParams();
  if (code) referrer.set(VILLAGE_REFERRER_KEY, code);
  const referral = normalizeCode(referralCode);
  if (referral) referrer.set("miuu_ref", referral);
  referrer.set("utm_source", "village");
  referrer.set("utm_medium", "invite");
  return `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(referrer.toString())}`;
};

/** Opens the village in an installed Miuu with the add-friend sheet filled in (the app's `AppLinks`). */
export const villageAppLink = (code: string): string =>
  `com.miuustudio.miuudiary://village?c=${formatVillageCode(code)}`;
