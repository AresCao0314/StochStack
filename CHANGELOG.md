# Changelog

All notable repository-level changes are tracked here for review.

## 2026-03-02

### Historical Protocol Digitizer MVP+ Workflow Upgrade
- Added SQLite + Prisma-backed workflow data model for Study / Document / ExtractionRun / ExtractedField / USDMArtifact / DDFArtifact / ChangeSet / AuditLog / FeedbackAmendment.
- Added migration and seed flow (`prisma/schema.prisma`, `prisma/migrations/*`, `scripts/seed.ts`).
- Added workflow APIs for ingest, extraction run lifecycle, review actions, validation, publish, diff, impact export, and feedback import/linking.
- Added new product pages:
  - `/{locale}/workflow/{studyId}` status-machine workflow page
  - `/{locale}/review/{runId}` human-in-the-loop review workbench
  - `/{locale}/validate/{runId}` validation report page
  - `/{locale}/diff` + `/{locale}/impact/{changeSetId}` object diff and impact list
  - `/{locale}/feedback/{studyId}` amendment CSV intake and USDM path linking
  - `/{locale}/ops/{studyId}` design-to-ops evidence cards
  - `/{locale}/artifact/usdm/{runId}` and `/{locale}/artifact/ddf/{runId}` previews + export
- Added documentation:
  - `docs/ARCHITECTURE.md`
  - `docs/DEMO_GUIDE.md`
- Added minimal automated tests for validation and diff logic (`tests/protocol-workflow.test.ts`).
- **User-visible**: protocol digitizer now supports explainable extraction review, versioned comparison, and feedback loop demo.
- **Operational**: requires `DATABASE_URL` and Prisma migrate/seed before first run.

## 2026-03-03

### Workflow Business MVP Mode
- Reworked `/{locale}/workflow` into a business-first MVP console focused on operational meaning and daily CTM usage.
- Added a stable client-side mock/live dual-mode page (`src/components/protocolWorkflow/workflow-business-mvp.tsx`):
  - mock-first delivery path for reliable demos
  - optional live study discovery via `/api/workflow/studies`
  - 6-step delivery spine with status progression simulation
  - action queue and business outcome framing for leadership walkthroughs
- Added locale-aware copy for English, Chinese, and German in the new workflow MVP page.
- **User-visible**: workflow entry page is now always available and presentation-ready, even when backend data initialization is incomplete.


### Ops Twin Eval Console v0.5.0
- Added `/[locale]/ops-twin/eval` evaluation workspace with agent scorecards (accuracy, bias, stability, adoption).
- Added trial-level filter and version comparison view (`vA` vs `vB`) across all core agents.
- Added human feedback loop panel for accept/reject decisions with rationale capture and local persistence.
- Added eval entry link from Ops Twin main page and sitemap entry for `/ops-twin/eval`.
- **User-visible**: business reviewers can now inspect agent quality, compare versions, and submit structured feedback.
- **Operational**: currently mock-data based (`src/content/ops-eval/agent-scorecards.json`) and ready to swap with runtime data source.
## 2026-03-01

### Data Foundation Architecture Visualization
- Added comprehensive Data Foundation article mapping three projects (Clinical Authoring 2.0, Site Feasibility, Trial Simulation) to six-layer architecture.
- Created interactive visualization component (`src/components/data-foundation-visualization.tsx`) with:
  - Project selector toggle (Authoring/Feasibility/Simulation)
  - Expandable layer cards showing data objects, owners, compliance, KPIs
  - Architecture diagram showing data flow across layers
  - Unified governance fields reference
- Added article page at `/signal/data-foundation` with full visualization.
- Added preview card on Signal Logs main page.
- **User-visible**: New Signal Logs article with interactive data architecture visualization.

### MCP Server Integration v0.3.0
- Added full MCP (Model Context Protocol) Server implementation (`src/mcp/server.ts`).
- Exposed 8 MCP Tools for programmatic Ops Twin interaction.
- Exposed 7 MCP Resources for read-only data access.
- Added 4 MCP Prompts for specialized AI personas.
- Created SSE endpoint at `/api/mcp` for real-time MCP client connections.
- Created MCP Demo Playground at `/ops-twin/mcp-demo` for browser-based testing.
- Added MCP Status Panel to Ops Twin Studio UI.
- Added test script (`scripts/test-mcp.sh`) and documentation (`MCP-README.md`).
- **User-visible**: New "MCP Server Playground" link in Ops Twin page.
- **Operational**: No deployment changes required; MCP endpoints are part of Next.js app.

### MCP Build Fix v0.3.1
- Fixed `run_simulation` schema defaults in `src/mcp/server.ts` by replacing invalid `.default({})` with a fully typed assumptions default object.
- Fixed MCP run-history message typing to use `AgentMessage`-compatible payloads instead of generic string agent fields.
- **User-visible**: No UI change; prevents Ops Twin/MCP deployment from failing at build time.
- **Operational**: `npm run build` now passes with MCP features enabled.

### Ops Twin A2A Remote Runtime v0.4.0
- Added A2A runtime modules: protocol envelope types, agent registry, HTTP transport adapter, and client router.
- Added `/api/a2a/inbox` endpoint for agent-to-agent remote execution handoff.
- Ops Twin now supports optional remote execution mode for agent steps with retry fallback to local runtime.
- A2A timeline now surfaces transport telemetry (`local/remote`, endpoint, latency, delivery status).
- Added operator guide panel with explicit usage steps, expected outcomes, and result interpretation.
- **User-visible**: clearer operational walkthrough + observable cross-agent communication behavior.
- **Operational**: build remains static-friendly; no extra infrastructure required for local/demo mode.

### Ops Twin A2A Hardening v0.4.1
- Added HMAC signature validation and timestamp freshness checks for `/api/a2a/inbox`.
- Added idempotent `messageId` de-duplication cache for inbox processing.
- Added per-agent retry backoff policy (max retries, delay, factor, jitter) with fallback-to-local execution.
- Added topology visualization and remote retry counter for runtime observability.
- Added optional LLM-native agent reasoning path (Qwen if configured, deterministic fallback otherwise).
- **User-visible**: clearer A2A reliability behavior and agent reasoning traces during demo runs.
- **Operational**: no infrastructure change required for demo mode; configure `A2A_HMAC_SECRET` and `DASHSCOPE_API_KEY` for hardened + LLM-enabled runtime.

## 2026-03-01

### Runtime Data Unification
- Migrated `vendor-intelligence` runtime signals to `runtime-data/vendor-intelligence/signals.json`.
- Migrated `market-intelligence` runtime datasets to `runtime-data/market-intelligence/{projects,signals,digest}.json`.
- App pages now read runtime data first and fallback to `src/content/*` when runtime files are missing.
- Refresh scripts now write mutable intelligence outputs to `runtime-data` to avoid `git pull` conflicts.
- Added fail-safe in vendor sync: preserve previous runtime signals if feed fetch fails.

### Vendor Intelligence Radar v0.2.0
- Added scenario coverage score.
- Added vendor feature parity matrix.
- Added classification confidence for auto-collected signals.

### CTM SOP Registry v0.3.0
- Added approval workflow fields (`reviewer`, `approvedBy`, `approvalDate`).
- Enforced active-only + approved-only skill activation policy.

### About Timeline
- Rewrote `Stochastic Timeline` in short mindset-only editorial style.

## Logging Rule
- For every merged update, append one dated section with:
  - scope
  - user-visible behavior changes
  - operational/deployment impact
