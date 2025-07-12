# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `yarn dev` or `npm run dev` (runs on http://localhost:3000)
- **Build for production**: `yarn build` or `npm run build`
- **Start production server**: `yarn start` or `npm start`
- **Lint code**: `yarn lint` or `npm run lint`

## Architecture Overview

This is a **Next.js 13 homepage** for Miuu Studio, a digital content creator featuring adorable animal characters. The site uses:

- **Framework**: Next.js 13 with TypeScript
- **Styling**: Tailwind CSS with custom colors (purple: #7e52ff, smoothRed: #FDD2D2)
- **Font**: Montserrat from Google Fonts
- **Path aliases**: `@/*` maps to project root

### Key Components Structure

The homepage (`pages/index.tsx`) is composed of modular sections:

1. **MiuuHeader** (`components/miuuHeader.tsx`): Hero section with navigation, logo, and social links
   - Responsive design with different layouts for mobile/desktop
   - Navigation menu (desktop only): Home, Characters, Miuu Diary App
   - Social media links: Instagram, TikTok, YouTube

2. **Characters Section**: Grid display of all studio characters
   - Uses `CharacterThumbnail` component with data from `lib/characters.ts`
   - Character data managed via enum (`CharacterId`) and interface (`Character`)
   - 8 characters: Miuu, Miyomi, Kao, Kiki, Joy & Sky, Whispurr, Nunu, Bunsy

3. **DiaryAppSection** (`components/diaryAppSection.tsx`): Promotes the studio's diary app

4. **MiuuShopSection** (`components/miuuShopSection.tsx`): Merchandise/shop promotion

5. **Footer** (`components/footer.tsx`): Site footer with additional links

### Asset Organization

Images are well-organized in `public/images/` by component:
- `/characterThumbnails/` - Individual character images
- `/diaryApp/` - App store badges and app screenshots
- `/footer/` - Social media icons
- `/miuuShop/` - Shop-related graphics
- `/mobileHeader/` - Header background images and logos

### Data Management

Character data is centralized in `lib/characters.ts`:
- Strongly typed with TypeScript enums and interfaces
- `getAllCharacters()` function provides complete character list
- `getCharacteThumbnail()` function maps character IDs to image assets

### Responsive Design

The site uses Tailwind's responsive utilities extensively:
- Mobile-first approach with `sm:` breakpoints
- Different layouts for mobile vs desktop (especially in header)
- Grid systems adapt to screen size (2 columns mobile, 5 columns desktop for characters)

## Development Notes

- Uses Next.js 13 Pages Router (not App Router)
- TypeScript strict mode enabled
- All images imported as static assets for optimization
- Components follow functional component pattern with TypeScript
- ESLint configured with Next.js defaults