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
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

## Historical Protocol Digitizer MVP+ (Workflow)

This repo now includes an upgraded, database-backed workflow for the Historical Protocol Digitizer:

- Workflow status machine: `/{locale}/workflow/{studyId}`
- Documents list: `/{locale}/documents`
- Runs list: `/{locale}/runs`
- Review workbench: `/{locale}/review/{runId}`
- Validation report: `/{locale}/validate/{runId}`
- USDM artifact: `/{locale}/artifact/usdm/{runId}`
- DDF artifact: `/{locale}/artifact/ddf/{runId}`
- Diff console: `/{locale}/diff`
- Impact list: `/{locale}/impact/{changeSetId}`
- Feedback intake: `/{locale}/feedback/{studyId}`
- Ops evidence view: `/{locale}/ops/{studyId}`

### Setup

1. Configure database:

```bash
cp .env.example .env.local
```

2. Run Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

3. Start app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000/en/workflow
```

### Supported Inputs / Rules / Loop

- Inputs:
  - protocol text ingestion (or file text payload)
  - amendment CSV import (`date,category,description`)
- Validation rules (MVP):
  - required structure checks
  - endpoint vs SoA consistency checks
  - visit window/order sanity checks
  - lightweight template checks (objectives/safety)
- Closed loop:
  - feedback amendments linked to USDM paths
  - ops cards aggregate which design areas repeatedly trigger operational changes

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
- Runtime output (recommended): `runtime-data/vendor-intelligence/signals.json`
- App runtime read path: `VENDOR_INTEL_SIGNALS_FILE` (default in Docker: `/runtime-data/vendor-intelligence/signals.json`)

Manual run:

```bash
python3 scripts/sync_vendor_ai_radar.py --output runtime-data/vendor-intelligence/signals.json --timeout 12 --limit-per-feed 8
```

Notes:
- Scenario and technology mapping is keyword-based (editable in manifest).
- Supports both vendor updates and literature signals via RSS/Atom feeds.
- The existing daily refresh script now includes this sync before container rebuild.
- Runtime signal data is intentionally stored outside Git-tracked content to avoid `git pull` conflicts on server.

## Runtime Data (Recommended Ops Mode)

- Use `runtime-data/` for mutable operational data generated on server.
- `runtime-data/` is gitignored locally and should persist on server disk.
- Current runtime data paths:
  - Market intelligence: `runtime-data/market-intelligence/{projects.json,signals.json,digest.json}`
  - Vendor radar signals: `runtime-data/vendor-intelligence/signals.json`

One-time server migration:

```bash
cd /root/stochstack-site
mkdir -p runtime-data/vendor-intelligence
if [ -f src/content/vendor-intelligence/signals.json ] && [ ! -f runtime-data/vendor-intelligence/signals.json ]; then
  cp src/content/vendor-intelligence/signals.json runtime-data/vendor-intelligence/signals.json
fi

mkdir -p runtime-data/market-intelligence
if [ -f src/content/market-intelligence/projects.json ] && [ ! -f runtime-data/market-intelligence/projects.json ]; then
  cp src/content/market-intelligence/projects.json runtime-data/market-intelligence/projects.json
fi
if [ -f src/content/market-intelligence/signals.json ] && [ ! -f runtime-data/market-intelligence/signals.json ]; then
  cp src/content/market-intelligence/signals.json runtime-data/market-intelligence/signals.json
fi
if [ -f src/content/market-intelligence/digest.json ] && [ ! -f runtime-data/market-intelligence/digest.json ]; then
  cp src/content/market-intelligence/digest.json runtime-data/market-intelligence/digest.json
fi
docker compose up -d --build
```

## Update Logs

- Prototype-level logs: each prototype page has its own timeline-style changelog section.
- Repository-level release log: `CHANGELOG.md` (append one entry per update for reviewers).
- Internal review panel: `/{locale}/ops/logs` (example: `/en/ops/logs`) shows `CHANGELOG.md` plus recent cron refresh runs.

## Ops Log File

- Refresh script log path default: `runtime-data/logs/market-refresh.log`
- Override with env var when needed: `MARKET_REFRESH_LOG_FILE`

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
