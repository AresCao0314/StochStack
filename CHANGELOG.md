# Changelog

All notable repository-level changes are tracked here for review.

## 2026-03-01

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
