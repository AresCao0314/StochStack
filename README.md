# StochStack (随机栈)

A multilingual (EN/中文/DE) AI-native personal site built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Framer Motion.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- i18n via route segments: `/en`, `/zh`, `/de`
- SEO metadata per page + sitemap + robots

## Quick Start

```bash
npm install
npm run dev
```

Open: `http://localhost:3000` (auto-redirects to `/en`).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
npm run typecheck
```

## Project Structure

- `src/app`: App Router pages/layouts
- `src/components`: UI components (TopNav, HeroSignal, StochConsole, PortGrid, etc.)
- `src/i18n`: dictionaries (`en.ts`, `zh.ts`, `de.ts`)
- `src/content`: mock data (`ports`, `notes`, `life`, `console quotes`)
- `src/lib`: i18n/content/api helpers
- `middleware.ts`: locale prefix enforcement

## i18n

- Supported locales: `en`, `zh`, `de`
- URL structure: `/{locale}/...`
- Language switcher in top-right updates current route locale
- Text content from dictionary files in `src/i18n`

## SEO

- Global metadata in `src/app/layout.tsx`
- Per-page metadata via `generateMetadata`
- `src/app/sitemap.ts` generates sitemap entries
- `src/app/robots.ts` exposes robots rules and sitemap URL

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Framework preset: Next.js (auto-detected).
4. Deploy.

`vercel.json` is already included for compatibility.

## Self-Hosting (Docker)

Build image:

```bash
docker build -t stochstack-site .
```

Run container:

```bash
docker run -p 3000:3000 stochstack-site
```

## Notes

- No backend required (static/semi-static friendly).
- Future API/data integration placeholder: `src/lib/api.ts`.
- Hidden page: `/{locale}/signal` supports seeded poster generation and PNG download.
