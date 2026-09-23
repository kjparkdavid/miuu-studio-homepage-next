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
2. **Hero** (`components/hero.tsx`): violet hero with study Miuu at a desk, then three phones (journals list, home, dressing room) straddling its bottom edge
3. **Features** (`components/features.tsx`): bento grid of cards (write freely, lock, mood calendar, sticker shelf, folders, thanks jar, backup + languages), each with its app screenshot
4. **HomesSection** (`components/homesSection.tsx`): three decorated home themes from `public/images/homes/` plus the furniture shop
5. **Testimonials** (`components/testimonials.tsx`): real Google Play reviews (the same ones the app's Pro page shows)
6. **FriendsSection** (`components/friendsSection.tsx`): character marquee + store link
7. **Faq** (`components/faq.tsx`): questions from `lib/faq.ts`, also emitted as FAQPage JSON-LD
8. **DownloadCta** (`components/downloadCta.tsx`) and **Footer** (`components/footer.tsx`)

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

### Data Management

Character data is centralized in `lib/characters.ts`:
- Strongly typed with TypeScript enums and interfaces
- `getAllCharacters()` function provides complete character list
- `getCharacteThumbnail()` function maps character IDs to image assets

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