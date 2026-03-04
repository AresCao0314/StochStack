# Changelog

All notable repository-level changes are tracked here for review.

## 2026-03-05

### Prototype: Ophthalmology Diffusion Control Twin (Mock)
- Added new prototype route `/{locale}/prototypes/ophthalmology-diffusion-control-twin`.
- Added one-page interactive mock for diffusion-style synthetic control arm generation:
  - scenario switcher (nAMD / DME / GA)
  - configurable synthetic cohort size, denoising steps, noise scale, calibration strength
  - denoising convergence curve
  - observed-vs-synthetic metric comparison
  - patient-level synthetic sample table
- Added content packs:
  - `src/content/digital-twin/ophthalmology-diffusion-scenarios.json`
  - `src/content/changelogs/ophthalmology-diffusion-digital-twin.json`
- Added prototype card metadata in `src/content/ports.json`.

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

### Protocol OS (Decision-Centric) MVP
- Added new decision-centric product surface at `/{locale}/projects` with end-to-end flow:
  - project creation
  - brief authoring
  - evidence snippet CRUD
  - studio A/B plan generation and acceptance
  - export compiler output download
- Added core architecture under `src/core/protocol-os`:
  - versioned Design Graph helpers
  - policy engine (hard/soft rules + score breakdown)
  - skill swarm with unified schema contract validation
  - orchestrator for Plan A/B generation + conflict scoring + changelog persistence
  - compiler for Protocol HTML + SoA CSV + Traceability JSON
- Added Prisma Postgres models for Project/Brief/Evidence/DesignGraph/DecisionNode/Proposal/PolicyProfile/ChangeLog/ExportArtifact plus RBAC structures (`User`, `ProjectMembership`).
- Added fake LLM adapter path for deterministic mock generation while preserving future replaceability.
- Added unit tests for all six skills (`tests/protocol-os-skills.test.ts`).
- **Operational**: switched Prisma datasource target to PostgreSQL and updated compose stack with Postgres service + migration/seed startup flow.

### Ventures: Protocol OS Lite
- Added `/{locale}/ventures/protocol-os-lite` as a one-page, zero-backend mock workflow for reliable demos.
- Lite flow includes:
  - brief capture
  - evidence snippets
  - fake orchestrator A/B generation
  - fake policy scoring + conflict indicators
  - plan accept with graph version bump
  - export of fake Protocol HTML / SoA CSV / Traceability JSON
- Added Ventures card links for EN/ZH/DE dictionaries so Lite version is the first clickable entry under Ventures.


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

## 2026-03-04

### Atlas Section Launch
- Added new global section `Atlas` in top navigation and home quick-entry cards.
- Added localized route `/{locale}/atlas` with mock architecture visuals:
  - Layered Clinical Data Stack
  - Decision-Centric Protocol Loop
  - A2A + Human Review Governance Mesh
- Added per-diagram interactive detail page `/{locale}/atlas/{slug}` with:
  - layer toggle controls
  - zoom controls
  - direct export to PNG/SVG for article and PPT usage
- Added `Open Interactive` CTA on each Atlas card to jump from gallery to dedicated diagram workspace.
- Added Atlas path to sitemap for all locales.
- **User-visible**: a dedicated visual architecture gallery aligned with the “one diagram beats a thousand words” principle.

### Protocol OS Lite v1.0.0
- Added `Synopsis Attribution Console` with three visibility layers:
  - Section mapping (`Synopsis section -> contributing agents`)
  - Before/after synopsis diff with source-agent attribution
  - Per-agent impact contribution scoring within current scenario
- Added attribution payload export fields (`synopsisDiff`, `agentImpacts`) in traceability JSON.
- **User-visible**: can explicitly audit which agent changed or influenced each synopsis block.
- **Operational**: remains Lite-mode local state implementation with no backend dependency.

### Protocol OS Lite v0.9.0
- Implemented full dynamic three-layer calibration loop:
  - Sliding-window recomputation from latest N feedback samples
  - Scenario-specific weights by `TA|Phase|Region`
  - Auto strategy switch (`normal` / `conservative` / `backup`) based on reject-rate threshold
- Added scenario controls (Phase, Region) and visible scenario key in UI.
- Added dynamic calibration controls:
  - window size N
  - reject threshold
  - minimum feedback samples for strategy switch
- Agent logs now show both applied weight and applied strategy for each run.
- Next-run comparison now scopes to the same scenario for valid before/after interpretation.
- **User-visible**: explicit and testable “feedback -> dynamic weight/strategy adjustment -> scenario-scoped result shift”.
- **Operational**: frontend-resident runtime-data behavior preserved; no DB dependency added.

## 2026-03-03

### Protocol OS Lite v0.8.0
- Added visible feedback loop controls per agent in Lite page:
  - `Accept`
  - `Reject` with reason tags
- Added per-agent adaptive weighting with bounded updates and acceptance/rejection counters.
- Added run-to-run comparison panel showing score drift (`Plan A/B`) after feedback and re-run.
- Feedback-calibrated weights now influence subsequent plan scoring for observable behavior change.
- **User-visible**: explicit “反馈 -> 权重变化 -> 下次结果对比” path is now operable in one page.
- **Operational**: still mock-safe and frontend-resident for Lite mode; no backend database dependency.

### Protocol OS Lite v0.7.0
- Added explicit two-stage drafting flow in Lite mode:
  - `Generate Synopsis`
  - `Expand to Full Protocol`
- Added stage gating so export only proceeds after both synopsis and full draft are generated.
- Added synopsis object into traceability export payload for auditable handoff between stages.
- **User-visible**: workflow now mirrors real protocol authoring practice (synopsis first, then full protocol).
- **Operational**: still frontend-only for Lite mode; no additional data store required.

### Protocol OS Lite v0.6.0
- Added five decision-critical design checks in one-page Lite flow:
  - Medical Need Framing
  - Endpoint + Estimand Alignment
  - Eligibility Impact Simulation
  - SoA Burden Quantification
  - Operational Risk Gates
- Added in-page agent runtime with two layers:
  - Functional agents (need framing, estimand, eligibility impact, burden, gates)
  - Role-review agents (medical, stats, clinops, regulatory)
- Added optional Tongyi Qwen reasoning path for agent outputs via `/api/protocol-os-lite/reason`:
  - uses `DASHSCOPE_API_KEY` + `QWEN_MODEL` when configured
  - automatically falls back to local deterministic reasoning when unavailable
- Enhanced chapter drafting with placeholder-driven templates and auto-filled narrative aligned to protocol drafting tone.
- Added persistent product update log section at the bottom of the Lite page for demo traceability.
- **User-visible**: richer decision workflow, clearer agent transparency, and stronger end-to-end draft credibility in a single page.
- **Operational**: no new database dependency for Lite mode; optional external LLM call only when key is configured.
