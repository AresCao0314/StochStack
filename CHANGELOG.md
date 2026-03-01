# Changelog

All notable repository-level changes are tracked here for review.

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
