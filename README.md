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

## Optional LLM Setup (Qwen)

The Notes page includes a `Quick Capture` summarizer.

1. Create `.env.local` in project root:

```bash
DASHSCOPE_API_KEY=your_dashscope_api_key
QWEN_MODEL=qwen-plus
```

2. Restart app:

```bash
npm run dev
```

If `DASHSCOPE_API_KEY` is missing, the app uses a local fallback summarizer.

## Notes Cloud Sync (Same Alibaba Cloud Instance)

- Notes captures are stored server-side via `GET/POST /api/notes/captures`.
- In Docker deployment, data persists in the named volume `notes_data` mounted to `/data`.
- Default file path: `/data/notes-captures.json` (configurable via `NOTES_DATA_FILE`).

## Nightly ClinicalTrials.gov Sync (Site Feasibility)

- Script: `scripts/fetch_ctgov_site_feasibility.py`
- Output:
  - `src/content/site-feasibility/sites.json`
  - `src/content/site-feasibility/ctgov-sync-meta.json`
- The existing daily refresh job (`scripts/refresh_market_intelligence.sh`) now also runs this sync before rebuild.

Manual run:

```bash
python3 scripts/fetch_ctgov_site_feasibility.py --page-size 100 --max-pages 4 --limit-per-profile 220 --timeout 20
```

## Daily Vendor Intelligence Radar Sync

- Script: `scripts/sync_vendor_ai_radar.py`
- Feed manifest: `src/content/vendor-intelligence/source-manifest.json`
- Output: `src/content/vendor-intelligence/signals.json`

Manual run:

```bash
python3 scripts/sync_vendor_ai_radar.py --timeout 12 --limit-per-feed 8
```

Notes:
- Scenario and technology mapping is keyword-based (editable in manifest).
- Supports both vendor updates and literature signals via RSS/Atom feeds.
- The existing daily refresh script now includes this sync before container rebuild.

## Protocol PDF Auto-Extraction (Qwen)

- Endpoint: `POST /api/protocol/extract`
- Input: `multipart/form-data` with `file` (PDF)
- Output: structured protocol JSON ready for `Protocol Q&A & Logic Engine`
- Notes:
  - Requires `DASHSCOPE_API_KEY` on server
  - Uses `QWEN_MODEL` (default: `qwen-plus`)


## CTM SOP Skill Registry (YAML/JSON)

- Registry path: `src/content/ctm-dashboard/skills.registry.yaml` (primary), fallback: `skills.registry.json`.
- Loader: `src/lib/ctm-sop-registry.ts` (YAML first, JSON fallback).
- Required fields per skill: `header`, `sopVersion`, `status`, `effectiveDate`, `reviewer`, `approvedBy`, `approvalDate`, `owners`, `intentKeywords`, `sopSteps`, `outputs`.
- Version governance: add a new `changeLog` item for every SOP update (version/date/author/summary).
- Activation policy: loader only activates skills where `status=active` and approval fields are populated.

Operational note:
- Update registry file in Git, then deploy.
- The CTM dashboard will display active registry version + source format + latest change metadata automatically.

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
