# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `yarn dev` or `npm run dev` (runs on http://localhost:3000)
- **Build for production**: `yarn build` or `npm run build`
- **Start production server**: `yarn start` or `npm start`
- **Lint code**: `yarn lint` or `npm run lint`

## Architecture Overview

This is a **Next.js 13 landing page for the Miuu Note app** (made by Miuu Studio), exported as a static site (`output: 'export'`). The site uses:

- **Framework**: Next.js 13 with TypeScript
- **Styling**: Tailwind CSS. Brand tokens live in `tailwind.config.js` (`ink`, `violet`, `lilac`, `canvas`, `blush`, `mint`, `sky`, `night`); `purple` and `smoothRed` are kept for the privacy / paceon pages
- **Font**: Montserrat (same as the app), headings in ExtraBold via `font-display`
- **Path aliases**: `@/*` maps to project root

### Key Components Structure

The homepage (`pages/index.tsx`) stacks these sections:

1. **SiteNav** (`components/siteNav.tsx`): fixed nav that slides in after scrolling past the hero, with a #features anchor and a "Get the app" button
2. **Hero** (`components/hero.tsx`): a plain canvas page with one soft wash, the headline, and the app's sticker jar (`components/stickerJar.tsx`) on the onboarding's pink-lilac-sky backdrop. The jar is the app's jar card (343 × 120 pt, white, grey5 border, the month over "N entries") and fills the way Onboarding V4's full jar does: `lib/jarPile.ts` (ported from the app's `jarPile.ts`) works the pile out with the app's solver (`lib/jarPhysics.ts`, copied from secret-note's `jarPhysicsCore.ts`), then thirty stickers fall from the rim to their places 35 ms apart, and the solver takes the pile over for pokes, tosses, tilts and shakes. Under it, "How was today?" offers the app's journal mood faces (`public/images/moods/`); picking one adds an entry, and that entry's sticker (more from the same packs) drops in. The faces themselves never go in the jar. The jar holds stickers, never mood faces: the art in `public/images/stickers/jar/` is from the app's three newest packs (Miuu's Cozy Autumn, Everyday Food, Little Miuu & Friends) mixed with its basic stickers
3. **Below the hero, the page is the app** (`components/journal/`): cream journal paper (`ui.tsx` holds the ruled paper, the app's chips, its soft segmented control and the two-column `Row`), each feature drawn as the app's own screen in HTML with gentle motion:
   - `writeSection.tsx`: the editor, with a Diary / Scrapbook toggle. Scrapbook (`scrapbookPage.tsx`) is the app's Scrapbook drawer (ScrapbookTab.tsx) playing itself: a tile is pressed and its sticker flies onto the page. Scrapbook art is in `public/images/scrapbook/` (from the app's allJournalStickers.zip)
   - `roomSection.tsx`: Miuu's room with a theme switcher (Cozy, Seashell, Witchy, Pink) and the skins
   - `giftSection.tsx`: save an entry and one of the app's pixel friends (Rocco, Tori, Poppy…) crawls in, leaves a treasure and waves, from the app's gift sprite sheets (`public/images/gifts/`, data in `lib/giftFriends.json`, names and treasures from the app's enUS strings)
   - `calendarSection.tsx`: the Calendar with its Stickers / Photos / Moods views
   - `thanksSection.tsx`: the Thank you jar (the app's Classic jar vector); a thank-you is tucked in through the lid
   - `drawSection.tsx`: the daily sticker draw, magician Miuu over the cauldron, two hearts a day
   - `moreSection.tsx`: lock, folders, backup and the 14 languages
   The photos in `public/images/photos/` (scrapbook and the photo calendar) were made for the site with Codex image generation; they are stand-ins for a user's own photos
4. **Testimonials** (`components/testimonials.tsx`): two real Google Play reviews, the onboarding one by MIkky taped on a ruled page with its key line large, beside the five-star count and the Plus page one
5. **Faq** (`components/faq.tsx`): questions from `lib/faq.ts` as a divided list beside a sticky heading, also emitted as FAQPage JSON-LD
6. **DownloadCta** (`components/downloadCta.tsx`) and **Footer** (`components/footer.tsx`)

Store, shop and social URLs are in `lib/links.ts`; `components/storeBadges.tsx` renders the App Store / Google Play badges.

### Asset Organization

Images live in `public/images/`:
- `/app/` - app screenshots as JPEGs (design exports / simulator shots; use Plus + release builds so no ads or dev buttons show)
- `/outfits/` - transparent Miuu outfit PNGs (study.png is the hero Miuu)
- `app-icon.png` - current app icon (also `public/icon.png`, `public/apple-touch-icon.png`)
- `/characterThumbnails/` - Individual character images
- `/diaryApp/` - store badges
- `/footer/` - Social media icons
- `/miuuShop/`, `/mobileHeader/` - Miyomi ribbon GIF, planet cat GIF, Miuu Studio logo

Only feature shipped features: check with the owner before adding screenshots of anything unreleased (e.g. the Universe view).

### Audience and copy

Since Oct 2026 the copy targets 25–35 and matches the store listing (Figma page "Store · 25–35", file vF1C6SPnaC90VEhwuMBMrV): calm, private, small wins. App screenshots in `/app/` (`*-list.png`, `write-entry.png`, `mood-calendar.png`, `room-cozy.png`, `folders-grid.png`, `sticker-jar.png`) are exported from that page's EN Play screens.

### Responsive Design

Mobile-first Tailwind: single column on phones, `sm:` two-column bento, `lg:` side-by-side hero and three-column bento. Check 375px, ~700px and desktop widths for horizontal overflow.

### SEO

`pages/index.tsx` sets the title, description, canonical, Open Graph/Twitter tags and JSON-LD (MobileApplication, Organization, FAQPage). `public/robots.txt`, `public/sitemap.xml` and `public/llms.txt` (a plain summary for AI search) live alongside. Keep FAQ answers, `llms.txt` and the Play stats in `lib/links.ts` true to the shipped app.

## Development Notes

- Uses Next.js 13 Pages Router (not App Router)
- TypeScript strict mode enabled
- All images imported as static assets for optimization
- Components follow functional component pattern with TypeScript
- ESLint configured with Next.js defaults
## Tiny Us pages

`pages/tiny-us/` holds Tiny Us's (the couples app's) Support, Privacy Policy and Terms of Use, framed by `components/tinyUsPage.tsx` (Figtree and the app's colours). The Tiny Us app links to `/tiny-us/terms/` and `/tiny-us/privacy-policy/` from its Welcome screen, so keep those paths. Keep both documents true to the app as built: what it stores, who sees it, which services receive it (the app has no analytics, ads or tracking SDKs; adding one means updating the policy first).

## Miuu Card Club pages

`pages/miuu-cards/` holds Miuu Card Club's (the card-collecting game's) Support, Privacy Policy and Terms of Service, framed by `components/miuuCardsPage.tsx`. The game's Settings and store listings link to `/miuu-cards/support/`, `/miuu-cards/privacy-policy/` and `/miuu-cards/terms/`, so keep those paths. Keep the documents true to the game as built (source: the `miuu-trading-card-game` repo): it uses Firebase (Auth, Firestore, Functions, Remote Config, Analytics, Storage), AdMob rewarded videos, and buys through StoreKit and Play Billing directly (its own server verifies and records each purchase; no RevenueCat), with Firestore in us-central1. It has no crash reporting or push notifications. The drop rates on the support page must match the game's current drop table.
