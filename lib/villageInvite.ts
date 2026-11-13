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
 */

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

/** Opens the village in an installed Miuu with the add-friend sheet filled in (the app's `AppLinks`). */
export const villageAppLink = (code: string): string =>
  `com.miuustudio.miuudiary://village?c=${formatVillageCode(code)}`;
