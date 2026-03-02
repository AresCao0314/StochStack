# Historical Protocol Digitizer MVP+ - 5 Minute Demo Guide

## Demo Objective
Show the full closed loop:
Ingest -> Extract -> Review -> Validate -> Publish -> Feedback -> Ops -> Diff/Impact

## Pre-demo setup
1. Run migration + seed:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```
2. Start app:
```bash
npm run dev
```
3. Open `http://localhost:3000/en/workflow`

## 5-minute script

### 1) Open study workflow (30s)
- Page: `/en/workflow`
- Talk track: "This status machine shows exactly where the protocol is in the lifecycle."

### 2) Ingest protocol and auto extract (45s)
- On workflow page, paste protocol text in "Ingest Document + Extract"
- Click `Upload + Extract`
- Talk track: "The system creates a run and stores field-level evidence/confidence."

### 3) Human review workbench (60s)
- Open `Review`
- Select a field, demonstrate:
  - `Accept`
  - `Edit` (change one value)
  - `Reject` (with reason)
- Talk track: "Every action is audited and traceable to evidence quote/chunk/page."

### 4) Validate rules (45s)
- Open `Validate`
- Click `Run Validate`
- Show errors/warnings and jump back to review
- Talk track: "We check structure, cross-section consistency, and template completeness."

### 5) Publish artifacts (30s)
- Back to workflow, click `Publish Artifacts`
- Open `/artifact/usdm/:runId` and `/artifact/ddf/:runId`
- Click export links
- Talk track: "Now we have standardized artifacts ready for downstream teams."

### 6) Feedback intake (45s)
- Open `/feedback/:studyId`
- Import CSV with `date,category,description`
- Edit linked USDM paths for one row
- Talk track: "Operational feedback is linked back to design objects."

### 7) Ops evidence view (30s)
- Open `/ops/:studyId`
- Show top linked design areas + evidence cards
- Talk track: "This closes the loop from design decisions to operational consequences."

### 8) Diff + impact list (45s)
- Open `/diff`
- Select base vs compare run -> `Generate ChangeSet`
- Open `Impact List`
- Talk track: "Object-level changes are mapped to downstream impact domains."

## Optional leadership close (15s)
"The value is not just extraction accuracy. It is governance: explainability, reviewability, versioned change, and operational feedback learning in one workflow."
