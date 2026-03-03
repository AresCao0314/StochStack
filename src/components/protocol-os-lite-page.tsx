'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Impact = 'Low' | 'Med' | 'High';
type Severity = 'high' | 'medium' | 'low';

type TherapeuticAreaKey = 'oncology' | 'crm' | 'ophthalmology' | 'inflammation';

type SoAVisit = {
  visit: string;
  week: number;
  procedures: string[];
};

type PlanNode = {
  nodeKey: 'endpoint.primary' | 'eligibility.core' | 'assumptions.ledger' | 'soa.v0';
  optionId: string;
  optionLabel: string;
  rationale: string;
  citations: Array<{ snippet: string; quote: string }>;
  impacts: {
    recruitment: Impact;
    sampleSize: Impact;
    timeline: Impact;
    burden: Impact;
    regulatory: Impact;
  };
  content: Record<string, unknown>;
};

type Plan = {
  id: 'A' | 'B';
  label: string;
  score: number;
  hardPass: boolean;
  policyNotes: string[];
  conflicts: Array<{ severity: Severity; message: string }>;
  nodes: PlanNode[];
};

type TaDefaults = {
  label: string;
  objective: string;
  constraints: string;
  success: string;
  endpointConservative: { name: string; type: string; timepointWeek: number; clinicalMeaning: string };
  endpointAggressive: { name: string; type: string; timepointWeek: number; clinicalMeaning: string };
  inclusionCore: string[];
  exclusionCore: string[];
  assumptionsConservative: { effectSize: number; eventRate: number; dropout: number; power: number };
  assumptionsAggressive: { effectSize: number; eventRate: number; dropout: number; power: number };
  soaConservative: SoAVisit[];
  soaAggressive: SoAVisit[];
};

const TA_DEFAULTS: Record<TherapeuticAreaKey, TaDefaults> = {
  oncology: {
    label: 'Oncology',
    objective: 'Build an interpretable oncology protocol draft with regulator-friendly endpoint and feasible site burden.',
    constraints: 'Need fast recruitment while keeping screening failure controlled; prefer low to medium burden.',
    success: 'Policy score >= 75, no hard fail, and explainable endpoint rationale.',
    endpointConservative: {
      name: 'Progression-Free Survival',
      type: 'time-to-event',
      timepointWeek: 48,
      clinicalMeaning: 'Delay disease progression in advanced setting.'
    },
    endpointAggressive: {
      name: 'Molecular Response Rate',
      type: 'surrogate',
      timepointWeek: 24,
      clinicalMeaning: 'Early biomarker signal for rapid development decision.'
    },
    inclusionCore: ['Histology-confirmed disease', 'ECOG 0-1', 'Adequate organ function'],
    exclusionCore: ['Active CNS progression', 'Uncontrolled infection'],
    assumptionsConservative: { effectSize: 0.22, eventRate: 0.45, dropout: 0.12, power: 0.82 },
    assumptionsAggressive: { effectSize: 0.34, eventRate: 0.52, dropout: 0.18, power: 0.8 },
    soaConservative: [
      { visit: 'Screening', week: -2, procedures: ['Consent', 'Labs', 'Baseline imaging'] },
      { visit: 'Week 12', week: 12, procedures: ['Tumor assessment', 'Safety panel'] },
      { visit: 'Week 24', week: 24, procedures: ['Tumor assessment', 'QoL'] },
      { visit: 'Week 48', week: 48, procedures: ['Primary endpoint assessment'] }
    ],
    soaAggressive: [
      { visit: 'Screening', week: -1, procedures: ['Consent', 'Fast baseline panel'] },
      { visit: 'Week 4', week: 4, procedures: ['Biomarker', 'Safety'] },
      { visit: 'Week 8', week: 8, procedures: ['Imaging', 'QoL'] },
      { visit: 'Week 16', week: 16, procedures: ['Primary endpoint assessment'] },
      { visit: 'Week 24', week: 24, procedures: ['Extended safety'] }
    ]
  },
  crm: {
    label: 'Cardiovascular / Retinal / Metabolism',
    objective: 'Generate a practical CRM protocol draft balancing event capture and operational simplicity.',
    constraints: 'Need broad enough eligibility for enrollment, avoid over-burdened assessments.',
    success: 'Hard policy pass with clear assumptions source and manageable SoA burden.',
    endpointConservative: {
      name: 'Composite MACE + Retinal Progression',
      type: 'composite',
      timepointWeek: 52,
      clinicalMeaning: 'Captures cardiometabolic risk and retinal deterioration in one endpoint strategy.'
    },
    endpointAggressive: {
      name: 'HbA1c + Imaging Surrogate Response',
      type: 'surrogate',
      timepointWeek: 24,
      clinicalMeaning: 'Early metabolic and retinal trend for rapid signal.'
    },
    inclusionCore: ['Established cardiometabolic disease', 'Baseline retinal grading available', 'Stable background therapy'],
    exclusionCore: ['Recent acute CV event', 'Severe renal impairment requiring dialysis'],
    assumptionsConservative: { effectSize: 0.18, eventRate: 0.38, dropout: 0.1, power: 0.84 },
    assumptionsAggressive: { effectSize: 0.28, eventRate: 0.46, dropout: 0.16, power: 0.8 },
    soaConservative: [
      { visit: 'Screening', week: -2, procedures: ['Consent', 'ECG', 'Labs', 'Retinal image'] },
      { visit: 'Week 12', week: 12, procedures: ['Safety labs', 'HbA1c', 'ECG'] },
      { visit: 'Week 24', week: 24, procedures: ['Retinal image', 'QoL'] },
      { visit: 'Week 52', week: 52, procedures: ['Primary endpoint assessment'] }
    ],
    soaAggressive: [
      { visit: 'Screening', week: -1, procedures: ['Consent', 'Core labs'] },
      { visit: 'Week 4', week: 4, procedures: ['Metabolic panel'] },
      { visit: 'Week 8', week: 8, procedures: ['Retinal image'] },
      { visit: 'Week 16', week: 16, procedures: ['Safety + QoL'] },
      { visit: 'Week 24', week: 24, procedures: ['Primary endpoint assessment'] }
    ]
  },
  ophthalmology: {
    label: 'Ophthalmology',
    objective: 'Draft an ophthalmology protocol emphasizing vision outcomes and realistic site execution.',
    constraints: 'Keep imaging schedule feasible for retina centers; maintain endpoint explainability.',
    success: 'Endpoint accepted by policy with transparent rationale and low operational risk.',
    endpointConservative: {
      name: 'BCVA Change from Baseline',
      type: 'clinical',
      timepointWeek: 52,
      clinicalMeaning: 'Direct visual function improvement meaningful to patients.'
    },
    endpointAggressive: {
      name: 'OCT Thickness Surrogate Change',
      type: 'surrogate',
      timepointWeek: 24,
      clinicalMeaning: 'Early anatomical response signal from imaging biomarker.'
    },
    inclusionCore: ['Diagnosed retinal disease subtype', 'Baseline BCVA within predefined range', 'OCT available at screening'],
    exclusionCore: ['Recent ocular surgery', 'Active ocular infection'],
    assumptionsConservative: { effectSize: 0.2, eventRate: 0.42, dropout: 0.11, power: 0.83 },
    assumptionsAggressive: { effectSize: 0.31, eventRate: 0.5, dropout: 0.17, power: 0.8 },
    soaConservative: [
      { visit: 'Screening', week: -2, procedures: ['Consent', 'BCVA', 'OCT', 'Safety exam'] },
      { visit: 'Week 8', week: 8, procedures: ['BCVA', 'OCT'] },
      { visit: 'Week 24', week: 24, procedures: ['BCVA', 'OCT', 'QoL'] },
      { visit: 'Week 52', week: 52, procedures: ['Primary endpoint assessment'] }
    ],
    soaAggressive: [
      { visit: 'Screening', week: -1, procedures: ['Consent', 'BCVA', 'OCT'] },
      { visit: 'Week 4', week: 4, procedures: ['OCT'] },
      { visit: 'Week 12', week: 12, procedures: ['BCVA', 'OCT'] },
      { visit: 'Week 24', week: 24, procedures: ['Primary endpoint assessment'] }
    ]
  },
  inflammation: {
    label: 'Inflammation / IPF / Fibrosis',
    objective: 'Create a fibrosis-focused protocol draft balancing efficacy interpretation and patient burden.',
    constraints: 'Need clear endpoint justification and avoid excessive invasive procedures.',
    success: 'No hard fail, policy score >= 75, and complete chapter-level draft output.',
    endpointConservative: {
      name: 'FVC Decline Slope',
      type: 'clinical',
      timepointWeek: 52,
      clinicalMeaning: 'Slower lung function decline in fibrotic progression.'
    },
    endpointAggressive: {
      name: 'Biomarker Fibrosis Panel Response',
      type: 'surrogate',
      timepointWeek: 24,
      clinicalMeaning: 'Early biochemical indication of fibrosis activity reduction.'
    },
    inclusionCore: ['Confirmed IPF or fibrotic ILD', 'Baseline pulmonary function in target range', 'Stable background therapy'],
    exclusionCore: ['Acute respiratory infection', 'Recent exacerbation requiring hospitalization'],
    assumptionsConservative: { effectSize: 0.19, eventRate: 0.4, dropout: 0.13, power: 0.81 },
    assumptionsAggressive: { effectSize: 0.29, eventRate: 0.49, dropout: 0.19, power: 0.8 },
    soaConservative: [
      { visit: 'Screening', week: -2, procedures: ['Consent', 'PFT', 'HRCT baseline', 'Labs'] },
      { visit: 'Week 12', week: 12, procedures: ['PFT', 'Safety labs'] },
      { visit: 'Week 24', week: 24, procedures: ['PFT', 'QoL', 'Biomarker panel'] },
      { visit: 'Week 52', week: 52, procedures: ['Primary endpoint assessment'] }
    ],
    soaAggressive: [
      { visit: 'Screening', week: -1, procedures: ['Consent', 'PFT', 'Labs'] },
      { visit: 'Week 4', week: 4, procedures: ['Biomarker panel'] },
      { visit: 'Week 8', week: 8, procedures: ['PFT', 'Safety check'] },
      { visit: 'Week 16', week: 16, procedures: ['PFT', 'Imaging'] },
      { visit: 'Week 24', week: 24, procedures: ['Primary endpoint assessment'] }
    ]
  }
};

const FLOW_STEPS = [
  'Step 1: Select therapeutic area and preload defaults',
  'Step 2: Review/edit Brief and Evidence snippets',
  'Step 3: Generate Plan A/B (fake orchestrator + policy scoring)',
  'Step 4: Compare conflicts, accept one plan to lock graph version',
  'Step 5: Auto-assemble chaptered protocol draft in-page',
  'Step 6: Export Protocol HTML + SoA CSV + Traceability JSON'
];

const CHAPTERS = [
  '1. Synopsis',
  '2. Background and Rationale',
  '3. Objectives and Endpoints',
  '4. Study Design',
  '5. Eligibility Criteria',
  '6. Treatment and Procedures',
  '7. Schedule of Activities',
  '8. Statistical Assumptions and Analysis',
  '9. Safety and Monitoring',
  '10. Data Handling and Quality',
  '11. Regulatory and Ethics Statements'
];

function severityClass(severity: Severity) {
  if (severity === 'high') return 'border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-300';
  if (severity === 'medium') return 'border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-200';
  return 'border-ink/25 bg-ink/5 text-ink';
}

function buildPlans(ta: TherapeuticAreaKey, brief: { objective: string; constraints: string }, evidence: string[]): Plan[] {
  const cfg = TA_DEFAULTS[ta];
  const hasEvidence = evidence.length > 0;

  const baseA: Plan = {
    id: 'A',
    label: 'Plan A · Conservative',
    score: hasEvidence ? 86 : 73,
    hardPass: true,
    policyNotes: [
      'Medical: clinical meaning explicitly stated',
      'Stats: conservative assumptions, power >= 0.8',
      hasEvidence ? 'Reg: evidence citation present' : 'Reg: citation missing penalty'
    ],
    conflicts: [{ severity: 'low', message: 'Operational burden is acceptable with close site monitoring.' }],
    nodes: [
      {
        nodeKey: 'endpoint.primary',
        optionId: 'A-endpoint',
        optionLabel: cfg.endpointConservative.name,
        rationale: 'Prioritizes interpretability and regulator acceptance for draft protocol quality.',
        citations: hasEvidence ? [{ snippet: evidence[0], quote: evidence[0].slice(0, 120) }] : [],
        impacts: { recruitment: 'Med', sampleSize: 'Low', timeline: 'Med', burden: 'Med', regulatory: 'Low' },
        content: cfg.endpointConservative
      },
      {
        nodeKey: 'eligibility.core',
        optionId: 'A-eligibility',
        optionLabel: 'Balanced Eligibility',
        rationale: 'Balances internal validity and enrollment feasibility.',
        citations: [],
        impacts: { recruitment: 'Med', sampleSize: 'Low', timeline: 'Med', burden: 'Low', regulatory: 'Low' },
        content: { inclusion: cfg.inclusionCore, exclusion: cfg.exclusionCore }
      },
      {
        nodeKey: 'assumptions.ledger',
        optionId: 'A-assumptions',
        optionLabel: 'Conservative Assumption Ledger',
        rationale: 'Uses cautious assumptions to reduce downstream protocol risk.',
        citations: hasEvidence ? [{ snippet: evidence[0], quote: evidence[0].slice(0, 90) }] : [],
        impacts: { recruitment: 'Low', sampleSize: 'Med', timeline: 'Med', burden: 'Low', regulatory: 'Low' },
        content: cfg.assumptionsConservative
      },
      {
        nodeKey: 'soa.v0',
        optionId: 'A-soa',
        optionLabel: 'Standard SoA',
        rationale: 'Controls procedure load while preserving endpoint windows.',
        citations: [],
        impacts: { recruitment: 'Low', sampleSize: 'Low', timeline: 'Med', burden: 'Med', regulatory: 'Low' },
        content: { visits: cfg.soaConservative }
      }
    ]
  };

  const baseB: Plan = {
    id: 'B',
    label: 'Plan B · Aggressive',
    score: hasEvidence ? 69 : 56,
    hardPass: false,
    policyNotes: [
      'Medical: higher uncertainty in interpretability',
      'Stats: optimistic assumptions increase variance risk',
      'ClinOps: burden and implementation complexity are higher'
    ],
    conflicts: [
      { severity: 'high', message: 'Hard fail risk: endpoint strategy may need stronger precedent support.' },
      { severity: 'medium', message: 'SoA density may challenge enrollment and site compliance.' }
    ],
    nodes: [
      {
        nodeKey: 'endpoint.primary',
        optionId: 'B-endpoint',
        optionLabel: cfg.endpointAggressive.name,
        rationale: 'Targets faster signal but with higher regulatory uncertainty.',
        citations: hasEvidence ? [{ snippet: evidence[0], quote: evidence[0].slice(0, 100) }] : [],
        impacts: { recruitment: 'Low', sampleSize: 'Low', timeline: 'Low', burden: 'Med', regulatory: 'High' },
        content: cfg.endpointAggressive
      },
      {
        nodeKey: 'eligibility.core',
        optionId: 'B-eligibility',
        optionLabel: 'Broader Eligibility',
        rationale: 'Improves speed, potentially increases heterogeneity.',
        citations: [],
        impacts: { recruitment: 'Low', sampleSize: 'High', timeline: 'Low', burden: 'Low', regulatory: 'Med' },
        content: {
          inclusion: cfg.inclusionCore.map((item, idx) => (idx === 1 ? item.replace('0-1', '0-2') : item)),
          exclusion: cfg.exclusionCore.slice(0, Math.max(1, cfg.exclusionCore.length - 1))
        }
      },
      {
        nodeKey: 'assumptions.ledger',
        optionId: 'B-assumptions',
        optionLabel: 'Aggressive Assumption Ledger',
        rationale: 'Uses optimistic efficacy assumptions to tighten sample sizing.',
        citations: [],
        impacts: { recruitment: 'Low', sampleSize: 'Low', timeline: 'Low', burden: 'Low', regulatory: 'Med' },
        content: cfg.assumptionsAggressive
      },
      {
        nodeKey: 'soa.v0',
        optionId: 'B-soa',
        optionLabel: 'Dense SoA',
        rationale: 'Frequent assessments increase early signal detection but raise burden.',
        citations: [],
        impacts: { recruitment: 'High', sampleSize: 'Low', timeline: 'Low', burden: 'High', regulatory: 'Med' },
        content: { visits: cfg.soaAggressive }
      }
    ]
  };

  if (brief.constraints.toLowerCase().includes('low burden')) {
    baseA.score += 2;
    baseB.score -= 4;
    baseB.conflicts.push({ severity: 'medium', message: 'Constraint mismatch: low burden requested, plan burden is high.' });
  }

  return [baseA, baseB];
}

function buildChapterContent(
  selectedPlan: Plan | null,
  ta: TherapeuticAreaKey,
  brief: { objective: string; constraints: string; success: string }
) {
  if (!selectedPlan) return [] as Array<{ chapter: string; text: string }>;

  const map = Object.fromEntries(selectedPlan.nodes.map((node) => [node.nodeKey, node])) as Record<string, PlanNode>;
  const endpoint = map['endpoint.primary']?.content ?? {};
  const eligibility = map['eligibility.core']?.content ?? {};
  const assumptions = map['assumptions.ledger']?.content ?? {};
  const soa = map['soa.v0']?.content ?? {};

  const taName = TA_DEFAULTS[ta].label;

  return [
    {
      chapter: CHAPTERS[0],
      text: `This draft protocol is generated by Protocol OS Lite for ${taName}. Objective: ${brief.objective}`
    },
    {
      chapter: CHAPTERS[1],
      text: `Rationale is based on mock orchestration with deterministic defaults and policy-driven scoring.`
    },
    {
      chapter: CHAPTERS[2],
      text: `Primary endpoint definition: ${JSON.stringify(endpoint)}`
    },
    {
      chapter: CHAPTERS[3],
      text: `Selected design strategy: ${selectedPlan.label}. Success criteria: ${brief.success}`
    },
    {
      chapter: CHAPTERS[4],
      text: `Core eligibility: ${JSON.stringify(eligibility)}`
    },
    {
      chapter: CHAPTERS[5],
      text: `Treatment/procedure assumptions are coordinated with SoA and burden constraints.`
    },
    {
      chapter: CHAPTERS[6],
      text: `Schedule of Activities matrix: ${JSON.stringify(soa)}`
    },
    {
      chapter: CHAPTERS[7],
      text: `Statistical assumption ledger: ${JSON.stringify(assumptions)}`
    },
    {
      chapter: CHAPTERS[8],
      text: `Safety monitoring strategy follows selected burden level and visit cadence.`
    },
    {
      chapter: CHAPTERS[9],
      text: `Data handling follows structured Decision Graph snapshots and traceability export.`
    },
    {
      chapter: CHAPTERS[10],
      text: `Regulatory notes: hard/soft policy outcomes and conflicts are included in traceability package.`
    }
  ];
}

function makeProtocolHtml(chapters: Array<{ chapter: string; text: string }>) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Protocol OS Lite Draft</title></head><body>
<h1>Protocol OS Lite Draft</h1>
${chapters.map((item) => `<h2>${item.chapter}</h2><p>${item.text}</p>`).join('\n')}
</body></html>`;
}

function makeSoaCsv(plan: Plan | null) {
  const soaNode = plan?.nodes.find((item) => item.nodeKey === 'soa.v0');
  const visits = (soaNode?.content?.visits as SoAVisit[] | undefined) ?? [];
  const rows = ['visit,week,procedures'];
  for (const visit of visits) {
    rows.push(`${visit.visit},${visit.week},"${visit.procedures.join('; ')}"`);
  }
  return rows.join('\n');
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ProtocolOsLitePage({ locale }: { locale: string }) {
  const [ta, setTa] = useState<TherapeuticAreaKey>('oncology');
  const [brief, setBrief] = useState({ objective: '', constraints: '', success: '' });
  const [snippetInput, setSnippetInput] = useState('Guideline precedent: endpoint has accepted historical use.');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<'A' | 'B' | null>(null);
  const [graphVersion, setGraphVersion] = useState(1);
  const [status, setStatus] = useState('Ready. Protocol OS Lite runs entirely with mock data in one page.');

  useEffect(() => {
    const cfg = TA_DEFAULTS[ta];
    setBrief({ objective: cfg.objective, constraints: cfg.constraints, success: cfg.success });
    setEvidence([`Default evidence (${cfg.label}): endpoint and feasibility references loaded.`]);
    setPlans([]);
    setSelectedPlanId(null);
    setStatus(`Defaults loaded for ${cfg.label}.`);
  }, [ta]);

  const selectedPlan = useMemo(() => plans.find((item) => item.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const chapterDraft = useMemo(() => buildChapterContent(selectedPlan, ta, brief), [selectedPlan, ta, brief]);

  function generatePlans() {
    const generated = buildPlans(ta, brief, evidence);
    setPlans(generated);
    setSelectedPlanId(null);
    setStatus('A/B plans generated via fake orchestrator and policy evaluator.');
  }

  function acceptPlan(planId: 'A' | 'B') {
    setSelectedPlanId(planId);
    setGraphVersion((prev) => prev + 1);
    setStatus(`Plan ${planId} accepted. Design graph version is now v${graphVersion + 1}.`);
  }

  function exportAll() {
    if (!selectedPlan) {
      setStatus('Please accept Plan A or B before export.');
      return;
    }

    const traceability = {
      mode: 'protocol-os-lite-mock',
      locale,
      therapeuticArea: ta,
      graphVersion,
      selectedPlan: selectedPlan.id,
      score: selectedPlan.score,
      hardPass: selectedPlan.hardPass,
      policyNotes: selectedPlan.policyNotes,
      conflicts: selectedPlan.conflicts,
      nodes: selectedPlan.nodes,
      chapters: chapterDraft
    };

    download(makeProtocolHtml(chapterDraft), `protocol-os-lite-v${graphVersion}.html`, 'text/html;charset=utf-8');
    download(makeSoaCsv(selectedPlan), `protocol-os-lite-soa-v${graphVersion}.csv`, 'text/csv;charset=utf-8');
    download(JSON.stringify(traceability, null, 2), `protocol-os-lite-trace-v${graphVersion}.json`, 'application/json;charset=utf-8');
    setStatus('Export completed: Protocol HTML + SoA CSV + Traceability JSON downloaded.');
  }

  return (
    <div className="space-y-5 text-ink">
      <Card className="bg-base border-ink/25">
        <CardTitle className="text-ink">Protocol OS Lite (One-Page, Mock-First)</CardTitle>
        <CardDescription className="text-ink/85">
          Complete demo flow in a single page with fake but coherent outputs. No backend database required.
        </CardDescription>
      </Card>

      <Card className="bg-base border-ink/25">
        <CardTitle className="text-ink">Flow Overview</CardTitle>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {FLOW_STEPS.map((step) => (
            <div key={step} className="rounded border border-ink/20 bg-base px-3 py-2 text-sm text-ink">
              {step}
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">1) Therapeutic Area + Defaults</CardTitle>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TA_DEFAULTS) as TherapeuticAreaKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTa(key)}
              className={`rounded border px-3 py-1.5 text-sm ${ta === key ? 'border-accent1 bg-accent1/20 text-ink' : 'border-ink/25 bg-base text-ink hover:border-ink/60'}`}
            >
              {TA_DEFAULTS[key].label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">2) Brief Inputs (pre-filled defaults)</CardTitle>
        <label className="text-xs uppercase tracking-[0.12em] text-ink/80">Objective</label>
        <Textarea className="bg-base text-ink" rows={3} value={brief.objective} onChange={(e) => setBrief((s) => ({ ...s, objective: e.target.value }))} />
        <label className="text-xs uppercase tracking-[0.12em] text-ink/80">Constraints</label>
        <Textarea className="bg-base text-ink" rows={3} value={brief.constraints} onChange={(e) => setBrief((s) => ({ ...s, constraints: e.target.value }))} />
        <label className="text-xs uppercase tracking-[0.12em] text-ink/80">Success Criteria</label>
        <Input className="bg-base text-ink" value={brief.success} onChange={(e) => setBrief((s) => ({ ...s, success: e.target.value }))} />
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">3) Evidence Snippets (pre-filled defaults)</CardTitle>
        <div className="flex gap-2">
          <Input className="bg-base text-ink" value={snippetInput} onChange={(e) => setSnippetInput(e.target.value)} placeholder="Paste evidence snippet" />
          <Button
            onClick={() => {
              if (!snippetInput.trim()) return;
              setEvidence((prev) => [snippetInput.trim(), ...prev]);
              setSnippetInput('');
            }}
          >
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {evidence.map((item, idx) => (
            <div key={`${item}-${idx}`} className="rounded border border-ink/20 bg-base px-3 py-2 text-sm text-ink">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-ink">4) Fake Orchestrator: Plan A/B</CardTitle>
          <Button onClick={generatePlans}>Generate A/B</Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded border border-ink/20 bg-base p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{plan.label}</p>
                <Badge className={plan.hardPass ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-300'}>
                  {plan.hardPass ? 'policy pass' : 'hard fail'}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-ink">Policy score: <strong>{plan.score}</strong></p>
              <ul className="mt-2 space-y-1 text-xs text-ink/90">
                {plan.policyNotes.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
              <div className="mt-2 space-y-1">
                {plan.conflicts.map((conflict, idx) => (
                  <p key={`${conflict.message}-${idx}`} className={`rounded border px-2 py-1 text-xs ${severityClass(conflict.severity)}`}>
                    {conflict.message}
                  </p>
                ))}
              </div>
              <div className="mt-3">
                <Button variant={selectedPlanId === plan.id ? 'default' : 'outline'} onClick={() => acceptPlan(plan.id)}>
                  Accept {plan.id}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">5) Chaptered Protocol Draft (SH/TransCelerate-style structure)</CardTitle>
        {selectedPlan ? (
          <div className="space-y-2">
            {chapterDraft.map((chapter) => (
              <div key={chapter.chapter} className="rounded border border-ink/20 bg-base p-3">
                <p className="text-sm font-semibold text-ink">{chapter.chapter}</p>
                <p className="mt-1 text-sm text-ink/90">{chapter.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/85">Accept a plan first, then chapter-level draft content will be assembled here.</p>
        )}
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-ink">6) Export Package</CardTitle>
          <Button onClick={exportAll}>Export HTML + CSV + JSON</Button>
        </div>
        <p className="text-xs text-ink/80">Current mock graph version: v{graphVersion}</p>
      </Card>

      <Card className="bg-base border-ink/25">
        <p className="text-sm text-ink/90">{status}</p>
      </Card>
    </div>
  );
}
