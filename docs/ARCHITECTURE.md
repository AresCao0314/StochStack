# Historical Protocol Digitizer - Architecture (MVP+)

## 1) Current Entry Points

### Existing prototype entry (kept)
- UI entry: `src/components/protocol-digitization-prototype.tsx`
- Detail route: `src/app/[locale]/prototypes/[slug]/page.tsx` (`historical-protocol-digitizer` slug)
- Extraction API (legacy chain): `src/app/api/protocol-digitization/extract/route.ts`

### New workflow entry
- Workflow index: `src/app/[locale]/workflow/page.tsx`
- Study workflow: `src/app/[locale]/workflow/[studyId]/page.tsx`
- Review: `src/app/[locale]/review/[runId]/page.tsx`
- Validate: `src/app/[locale]/validate/[runId]/page.tsx`
- Diff: `src/app/[locale]/diff/page.tsx`
- Impact list: `src/app/[locale]/impact/[changeSetId]/page.tsx`
- Feedback import: `src/app/[locale]/feedback/[studyId]/page.tsx`
- Ops evidence view: `src/app/[locale]/ops/[studyId]/page.tsx`
- Artifacts: `src/app/[locale]/artifact/usdm/[runId]/page.tsx`, `src/app/[locale]/artifact/ddf/[runId]/page.tsx`

## 2) Data & Storage

### Database
- Engine: SQLite (`DATABASE_URL`, Prisma)
- ORM: Prisma (`prisma/schema.prisma`)
- Migration: `prisma/migrations/20260302120000_init/migration.sql`
- Seed: `scripts/seed.ts`

### Core models
- `Study`
- `Document`
- `ExtractionRun`
- `ExtractedField` (path + value + confidence + evidence + reviewer state)
- `USDMArtifact`
- `DDFArtifact`
- `ChangeSet`
- `AuditLog`
- `FeedbackAmendment`

## 3) Service Layer

Located at `src/lib/protocolWorkflow/*`

- `extraction.ts`
  - ingest document
  - parse unstructured text into stable field paths
  - create run and extracted fields
  - build USDM + DDF artifacts
- `review.ts`
  - accept/edit/reject field operations
  - review summary counters
  - submit review -> validate transition
- `validation.ts`
  - structure rules
  - consistency rules (endpoint vs SoA, visit windows/order)
  - lightweight template checks (objectives/safety)
- `diff.ts`
  - object-level diff between reviewed field sets
  - impact list mapping
- `feedback.ts`
  - CSV import for amendments
  - keyword-based USDM path suggestion
  - manual link updates
- `workflow.ts`
  - workflow step definitions + run-status projection

## 4) API Layer

### Workflow APIs
- `GET/POST /api/workflow/studies`
- `GET /api/workflow/studies/[studyId]`
- `GET/POST /api/workflow/studies/[studyId]/documents`
- `POST /api/workflow/studies/[studyId]/feedback/import`
- `PATCH /api/workflow/feedback/[feedbackId]/link`
- `GET /api/workflow/runs/[runId]`
- `GET/PATCH /api/workflow/runs/[runId]/review`
- `GET/POST /api/workflow/runs/[runId]/validate`
- `POST /api/workflow/runs/[runId]/publish`
- `POST /api/workflow/diff`

### Export APIs
- `GET /api/workflow/artifact/usdm/[runId]`
- `GET /api/workflow/artifact/ddf/[runId]`
- `GET /api/workflow/changesets/[changeSetId]`

## 5) LLM/Extraction Strategy

- Legacy route (`/api/protocol-digitization/extract`) still supports qwen/fallback parser path.
- Workflow MVP+ extraction currently uses deterministic parser + evidence envelope and writes to `ExtractedField`.
- Design keeps `modelName` + `promptVersion` on `ExtractionRun` so real LLM extractor can replace parser without schema changes.

## 6) End-to-End Chain (MVP+)

1. Ingest document (`Document`)
2. Run extraction (`ExtractionRun` + `ExtractedField` with evidence/confidence)
3. Human review (`reviewerState`, `reviewerEdits`, `AuditLog`)
4. Validate (`validation.ts` report)
5. Publish (`USDMArtifact`, `DDFArtifact`)
6. Feedback import (`FeedbackAmendment`) and link to USDM paths
7. Diff across versions (`ChangeSet`) + Impact list (`diff.ts` mapping)

## 7) Compatibility Note

The old chain `upload -> extract -> usdm -> dataFlow` remains available via:
- UI: `historical-protocol-digitizer` prototype page
- API: `/api/protocol-digitization/extract`

The new workflow is additive and uses database-backed traceability.
