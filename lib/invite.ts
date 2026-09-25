import { GOOGLE_PLAY_URL } from "@/lib/links";

/**
 * Invite links (the app's referral program, secret-note#1210). Pure.
 *
 * A code is six characters of Crockford base32 — `0-9A-Z` without I, L, O
 * and U — shown as `MIUU-XXXXXX`. This is the **third copy** of the alphabet:
 * the app (`src/helpers/ReferralLink.ts`) and the server
 * (`miuu-note-cloud-tasks` `lib/referrals.js`) hold the others. Change all
 * three or none.
 *
 * The page never talks to a server and holds nothing secret: the code only
 * exists in links people choose to share.
 */

const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 6;
const CODE_PREFIX = "MIUU";

/** A code from whatever the link carried, forgiving case, dashes and look-alikes; null otherwise. */
export const normalizeCode = (input: unknown): string | null => {
  if (typeof input !== "string") return null;
  let value = input.toUpperCase().replace(/[\s\-_]/g, "");
  if (value.startsWith(CODE_PREFIX)) value = value.slice(CODE_PREFIX.length);
  value = value.replace(/O/g, "0").replace(/[IL]/g, "1");
  if (value.length !== CODE_LENGTH) return null;
  for (const char of value) {
    if (!CODE_ALPHABET.includes(char)) return null;
  }
  return value;
};

export const formatCode = (code: string): string => `${CODE_PREFIX}-${code}`;

/**
 * The Play link that installs Miuu with this code as the install referrer —
 * byte for byte what the app's `buildPlayInviteUrl` builds, because the app
 * reads the code back out of exactly this shape on first open.
 */
export const playInviteUrl = (code: string): string =>
  `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(`miuu_ref=${code}&utm_source=referral`)}`;

/** Android browsers go straight to Play: the referrer only survives that path. */
export const isAndroid = (userAgent: string): boolean => /android/i.test(userAgent);
