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

type GateResult = {
  gate: string;
  passed: boolean;
  severity: Severity;
  note: string;
};

type PlanAnalysis = {
  medicalNeedFrame: string;
  estimand: {
    treatment: string;
    population: string;
    variable: string;
    intercurrentStrategy: string;
    summary: string;
  };
  eligibilityImpact: {
    eligibleRate: number;
    recruitmentDeltaPct: number;
    sampleSizeInflation: number;
    timelineDelayWeeks: number;
    note: string;
  };
  soaBurden: {
    visitCount: number;
    totalProcedures: number;
    burdenScore: number;
    burdenBand: 'Light' | 'Balanced' | 'Heavy';
    note: string;
  };
  gates: GateResult[];
};

type Plan = {
  id: 'A' | 'B';
  label: string;
  score: number;
  hardPass: boolean;
  policyNotes: string[];
  conflicts: Array<{ severity: Severity; message: string }>;
  nodes: PlanNode[];
  analysis: PlanAnalysis;
};

type AgentLog = {
  id: string;
  timestamp: string;
  layer: 'functional' | 'role';
  agent: string;
  output: string;
  provider: 'qwen' | 'local';
  weightApplied: number;
  strategyApplied: 'normal' | 'conservative' | 'backup';
  feedbackStatus?: 'accepted' | 'rejected';
  feedbackReason?: string;
};

type AgentProfile = {
  weight: number;
  acceptCount: number;
  rejectCount: number;
};

type RunSnapshot = {
  runId: string;
  scenarioKey: string;
  timestamp: string;
  planScores: { A: number; B: number };
  bestPlan: 'A' | 'B';
  weightSnapshot: Record<string, number>;
};

type FeedbackEvent = {
  id: string;
  scenarioKey: string;
  agent: string;
  decision: 'accepted' | 'rejected';
  reason?: string;
  timestamp: string;
};

type SynopsisSection = {
  id: string;
  title: string;
  text: string;
  contributors: string[];
};

type SynopsisSnapshot = {
  id: string;
  scenarioKey: string;
  timestamp: string;
  sections: SynopsisSection[];
};

type SynopsisDiffItem = {
  sectionId: string;
  sectionTitle: string;
  before: string;
  after: string;
  sourceAgent: string;
};

type TaDefaults = {
  label: string;
  objective: string;
  medicalNeed: string;
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
    medicalNeed: 'Patients with advanced malignancy still face progression risk despite standard care; meaningful delay of progression is clinically relevant.',
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
    medicalNeed: 'Cardiometabolic and retinal outcomes progress together in high-risk populations; integrated endpoints may improve decision quality.',
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
    medicalNeed: 'Visual function deterioration remains a high-burden outcome; clinically meaningful vision preservation is central to patient value.',
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
    medicalNeed: 'Fibrotic inflammatory diseases have progressive functional decline; preserving pulmonary function and quality of life remains a key goal.',
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
  'Step 2: Medical Need Framing (what unmet need and clinical intent)',
  'Step 3: Endpoint + Estimand Alignment (objective, variable, intercurrent strategy)',
  'Step 4: Eligibility Impact Simulation (recruitment / sample-size / timeline effects)',
  'Step 5: SoA Burden Quantification + Operational Risk Gates',
  'Step 6: Agent Review, Accept plan, compile full chapter draft and export'
];

const CHAPTER_TEMPLATES = [
  {
    chapter: '1. Synopsis',
    template:
      'This Phase {{PHASE}} protocol ({{STUDY_ID}}) evaluates {{INTERVENTION}} in {{POPULATION}} with {{PRIMARY_ENDPOINT}} assessed at Week {{PRIMARY_TIMEPOINT}}. The study is designed to support {{CLINICAL_INTENT}} while maintaining operational feasibility.'
  },
  {
    chapter: '2. Background and Rationale',
    template:
      '{{DISEASE_CONTEXT}} remains associated with unmet need in {{TARGET_REGION}}. The proposed mechanism of {{INTERVENTION}} is expected to improve {{CLINICAL_INTENT}} based on available scientific rationale and prior signals.'
  },
  {
    chapter: '3. Objectives and Endpoints',
    template:
      'Primary objective: To evaluate the effect of {{INTERVENTION}} on {{PRIMARY_ENDPOINT}} at Week {{PRIMARY_TIMEPOINT}}. Key secondary objectives include {{KEY_SECONDARY_OBJECTIVES}}. Endpoint strategy is selected to balance interpretability and development speed.'
  },
  {
    chapter: '4. Study Design',
    template:
      'This is a {{DESIGN_TYPE}} study in {{POPULATION}}. Subjects will be assigned per protocol design with visit cadence defined in SoA. Design assumptions target power {{POWER}} with effect size {{EFFECT_SIZE}} and dropout {{DROPOUT_RATE}}.'
  },
  {
    chapter: '5. Eligibility Criteria',
    template:
      'Inclusion criteria emphasize {{INCLUSION_SUMMARY}}. Exclusion criteria include {{EXCLUSION_SUMMARY}}. Criteria are calibrated to preserve internal validity while supporting recruitment feasibility.'
  },
  {
    chapter: '6. Treatment and Procedures',
    template:
      '{{INTERVENTION}} will be administered according to protocol schedule. Safety, efficacy, and biomarker procedures are aligned with visit windows and site execution constraints ({{BURDEN_LEVEL}} burden profile).'
  },
  {
    chapter: '7. Schedule of Activities',
    template:
      'The SoA includes {{VISIT_COUNT}} planned visits with key evaluations at {{KEY_VISIT_WEEKS}}. Procedures are distributed to reduce unnecessary burden while preserving endpoint integrity.'
  },
  {
    chapter: '8. Statistical Assumptions and Analysis',
    template:
      'The primary analysis is based on {{ANALYSIS_METHOD}} assumptions. Planning parameters include event rate {{EVENT_RATE}}, effect size {{EFFECT_SIZE}}, dropout {{DROPOUT_RATE}}, and target power {{POWER}}.'
  },
  {
    chapter: '9. Safety and Monitoring',
    template:
      'Safety monitoring will include scheduled clinical and laboratory review, with escalation pathways for serious adverse events. Monitoring intensity is set to {{MONITORING_INTENSITY}} based on risk profile.'
  },
  {
    chapter: '10. Data Handling and Quality',
    template:
      'Data will be captured in structured systems with protocol-specified edit checks, query handling, and traceability. Quality controls align with risk-based principles and critical data/process identification.'
  },
  {
    chapter: '11. Regulatory and Ethics Statements',
    template:
      'The study will be conducted according to applicable GCP requirements and local regulations. Informed consent and ethics approvals are required before subject enrollment. Key protocol language follows {{REGULATORY_STYLE}} expectations.'
  }
] as const;

const UPDATE_LOG = [
  {
    version: 'v1.0.0',
    date: '2026-03-04',
    title: 'Synopsis Attribution Console',
    bullets: [
      'Added section-level mapping from synopsis blocks to responsible agents.',
      'Added before/after synopsis diff with source-agent attribution.',
      'Added per-agent impact contribution panel linked to current scenario.'
    ]
  },
  {
    version: 'v0.9.0',
    date: '2026-03-04',
    title: 'Fully dynamic feedback policy (3 layers)',
    bullets: [
      'Sliding-window profile recomputation on latest N feedback events.',
      'Scenario-specific calibration by TA/Phase/Region.',
      'Auto strategy switch (normal/conservative/backup) when reject rate crosses threshold.'
    ]
  },
  {
    version: 'v0.8.0',
    date: '2026-03-04',
    title: 'Visible feedback loop for agent calibration',
    bullets: [
      'Added per-agent Accept/Reject actions with reject reason tags.',
      'Added dynamic agent weight updates and persisted profile counters.',
      'Added next-run comparison panel to show score shifts after feedback.'
    ]
  },
  {
    version: 'v0.7.0',
    date: '2026-03-03',
    title: 'Two-stage drafting flow (Synopsis -> Full Protocol)',
    bullets: [
      'Added explicit two-stage generation: first Synopsis, then Expand to Full Protocol.',
      'Export now requires both stages to be completed to reduce premature draft handoff.',
      'Traceability export now includes synopsis snapshot plus full chapter content.'
    ]
  },
  {
    version: 'v0.6.0',
    date: '2026-03-03',
    title: 'Decision-Centric upgrade with 5 key design checks',
    bullets: [
      'Added Medical Need Framing, Estimand Alignment, Eligibility Impact Simulator, SoA Burden Quantification, and Operational Risk Gates.',
      'Added functional agents and role-review agents with runtime logs in-page.',
      'Added optional Tongyi Qwen reasoning adapter with automatic local fallback.'
    ]
  },
  {
    version: 'v0.5.0',
    date: '2026-03-03',
    title: 'Chapter template engine',
    bullets: ['Upgraded chapter drafting to template placeholders and SH/TransCelerate-style language.']
  }
] as const;

const AGENT_NAMES = [
  'MedicalNeedFramingAgent',
  'EndpointEstimandAgent',
  'EligibilityImpactAgent',
  'SoABurdenAgent',
  'OperationalGateAgent',
  'MedicalReviewerAgent',
  'StatsReviewerAgent',
  'ClinOpsReviewerAgent',
  'RegReviewerAgent'
] as const;

const REJECT_REASONS = [
  'medical-inconsistent',
  'stats-unreliable',
  'ops-not-feasible',
  'reg-risk-high',
  'too-generic'
] as const;

const PHASE_OPTIONS = ['I', 'II', 'III'] as const;
const REGION_OPTIONS = ['Global', 'US/EU', 'APAC/CN'] as const;

function makeScenarioKey(ta: TherapeuticAreaKey, phase: string, region: string) {
  return `${ta}|${phase}|${region}`;
}

const SYNOPSIS_SECTION_AGENT_MAP: Record<string, string[]> = {
  clinical_intent: ['MedicalNeedFramingAgent', 'MedicalReviewerAgent'],
  objective_endpoint: ['EndpointEstimandAgent', 'StatsReviewerAgent', 'RegReviewerAgent'],
  eligibility_core: ['EligibilityImpactAgent', 'ClinOpsReviewerAgent'],
  assumptions: ['StatsReviewerAgent', 'EndpointEstimandAgent'],
  soa_ops_risk: ['SoABurdenAgent', 'OperationalGateAgent', 'ClinOpsReviewerAgent']
};

function createDefaultAgentProfiles(): Record<string, AgentProfile> {
  const entries = AGENT_NAMES.map((name) => [
    name,
    {
      weight: 1,
      acceptCount: 0,
      rejectCount: 0
    }
  ]);
  return Object.fromEntries(entries);
}

function recomputeProfilesForScenario(events: FeedbackEvent[], scenarioKey: string, windowSize: number) {
  const base = createDefaultAgentProfiles();
  const scoped = events.filter((event) => event.scenarioKey === scenarioKey).slice(-windowSize);

  for (const event of scoped) {
    const profile = base[event.agent] ?? { weight: 1, acceptCount: 0, rejectCount: 0 };
    if (event.decision === 'accepted') {
      profile.weight = Math.min(1.4, Number((profile.weight + 0.05).toFixed(2)));
      profile.acceptCount += 1;
    } else {
      profile.weight = Math.max(0.6, Number((profile.weight - 0.08).toFixed(2)));
      profile.rejectCount += 1;
    }
    base[event.agent] = profile;
  }

  return base;
}

function deriveAgentStrategies(
  profiles: Record<string, AgentProfile>,
  rejectThreshold: number,
  minFeedbackForSwitch: number
) {
  const result: Record<string, { strategy: 'normal' | 'conservative' | 'backup'; rejectRate: number; samples: number }> = {};
  for (const agentName of AGENT_NAMES) {
    const profile = profiles[agentName] ?? { weight: 1, acceptCount: 0, rejectCount: 0 };
    const samples = profile.acceptCount + profile.rejectCount;
    const rejectRate = samples > 0 ? profile.rejectCount / samples : 0;
    let strategy: 'normal' | 'conservative' | 'backup' = 'normal';
    if (samples >= minFeedbackForSwitch && rejectRate >= rejectThreshold) {
      strategy = rejectRate >= rejectThreshold + 0.2 ? 'backup' : 'conservative';
    }
    result[agentName] = { strategy, rejectRate, samples };
  }
  return result;
}

function computeSynopsisDiff(previous: SynopsisSection[] | null, current: SynopsisSection[]) {
  if (!previous) return [] as SynopsisDiffItem[];
  const prevMap = new Map(previous.map((section) => [section.id, section]));
  const diffs: SynopsisDiffItem[] = [];
  for (const section of current) {
    const prev = prevMap.get(section.id);
    if (!prev) {
      diffs.push({
        sectionId: section.id,
        sectionTitle: section.title,
        before: '',
        after: section.text,
        sourceAgent: section.contributors[0] ?? 'UnknownAgent'
      });
      continue;
    }
    if (prev.text !== section.text) {
      diffs.push({
        sectionId: section.id,
        sectionTitle: section.title,
        before: prev.text,
        after: section.text,
        sourceAgent: section.contributors[0] ?? 'UnknownAgent'
      });
    }
  }
  return diffs;
}

function computeAgentImpactScores(
  profiles: Record<string, AgentProfile>,
  strategies: Record<string, { strategy: 'normal' | 'conservative' | 'backup'; rejectRate: number; samples: number }>
) {
  return AGENT_NAMES.map((name) => {
    const profile = profiles[name] ?? { weight: 1, acceptCount: 0, rejectCount: 0 };
    const strategy = strategies[name]?.strategy ?? 'normal';
    const strategyShift = strategy === 'backup' ? -3 : strategy === 'conservative' ? -1 : 0;
    const feedbackSignal = profile.acceptCount - profile.rejectCount;
    const impact = Number((((profile.weight - 1) * 10) + strategyShift + feedbackSignal * 0.2).toFixed(1));
    return {
      agent: name,
      impact,
      strategy,
      samples: profile.acceptCount + profile.rejectCount
    };
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

function applyTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
}

function severityClass(severity: Severity) {
  if (severity === 'high') return 'border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-300';
  if (severity === 'medium') return 'border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-200';
  return 'border-ink/25 bg-ink/5 text-ink';
}

function buildEstimand(endpoint: Record<string, unknown>, taLabel: string) {
  const variable = String(endpoint.name ?? 'Primary endpoint');
  return {
    treatment: 'Treatment policy estimand',
    population: `Randomized ${taLabel} target population`,
    variable,
    intercurrentStrategy: 'Composite with predefined rescue-medication handling',
    summary: `${variable} interpreted under treatment-policy framework with predefined handling of intercurrent events.`
  };
}

function simulateEligibilityImpact(inclusion: string[], exclusion: string[], baseEligibleRate = 0.52) {
  const strictness = inclusion.length * 0.03 + exclusion.length * 0.035;
  const eligibleRate = Math.max(0.18, Math.min(0.78, baseEligibleRate - strictness));
  const recruitmentDeltaPct = Number(((eligibleRate - baseEligibleRate) / baseEligibleRate * 100).toFixed(1));
  const sampleSizeInflation = Number((1 + Math.max(0, -recruitmentDeltaPct) / 140).toFixed(2));
  const timelineDelayWeeks = Math.max(0, Math.round((-recruitmentDeltaPct / 10) * 2));

  return {
    eligibleRate: Number(eligibleRate.toFixed(2)),
    recruitmentDeltaPct,
    sampleSizeInflation,
    timelineDelayWeeks,
    note: recruitmentDeltaPct < 0 ? 'Eligibility is restrictive and may slow enrollment.' : 'Eligibility is balanced for recruitment.'
  };
}

function quantifySoABurden(visits: SoAVisit[]) {
  const totalProcedures = visits.reduce((sum, visit) => sum + visit.procedures.length, 0);
  const visitCount = visits.length;
  const burdenScore = Math.min(100, Math.round((visitCount * 9 + totalProcedures * 4) * 1.2));
  const burdenBand: 'Light' | 'Balanced' | 'Heavy' = burdenScore > 70 ? 'Heavy' : burdenScore > 45 ? 'Balanced' : 'Light';

  return {
    visitCount,
    totalProcedures,
    burdenScore,
    burdenBand,
    note: burdenBand === 'Heavy' ? 'High patient/site burden risk. Consider reducing dense procedures.' : 'Burden is within a manageable range.'
  };
}

function buildGates(params: {
  endpointType: string;
  evidenceCount: number;
  power: number;
  burdenScore: number;
  timelineDelayWeeks: number;
}) {
  const gates: GateResult[] = [
    {
      gate: 'Gate 1 · Endpoint precedent',
      passed: params.endpointType !== 'surrogate' || params.evidenceCount > 0,
      severity: params.endpointType === 'surrogate' && params.evidenceCount === 0 ? 'high' : 'low',
      note: params.endpointType === 'surrogate' && params.evidenceCount === 0 ? 'Surrogate endpoint requires stronger precedent evidence.' : 'Endpoint precedent check passed.'
    },
    {
      gate: 'Gate 2 · Statistical credibility',
      passed: params.power >= 0.8,
      severity: params.power >= 0.8 ? 'low' : 'high',
      note: params.power >= 0.8 ? 'Power threshold met.' : 'Power below 0.80 policy threshold.'
    },
    {
      gate: 'Gate 3 · Operational burden',
      passed: params.burdenScore <= 72,
      severity: params.burdenScore <= 72 ? 'low' : 'medium',
      note: params.burdenScore <= 72 ? 'SoA burden acceptable.' : 'SoA burden high; site activation and retention risk elevated.'
    },
    {
      gate: 'Gate 4 · Timeline viability',
      passed: params.timelineDelayWeeks <= 4,
      severity: params.timelineDelayWeeks <= 4 ? 'low' : 'medium',
      note: params.timelineDelayWeeks <= 4 ? 'Timeline impact acceptable.' : 'Eligibility-driven timeline delay exceeds tolerance.'
    }
  ];

  return gates;
}

function scorePolicies(gates: GateResult[], hasEvidence: boolean, conservativeBias: boolean) {
  const hardFail = gates.some((gate) => !gate.passed && gate.severity === 'high');
  let score = 78;
  score -= gates.filter((gate) => !gate.passed).length * 8;
  if (!hasEvidence) score -= 6;
  if (conservativeBias) score += 6;
  return {
    score: Math.max(35, Math.min(96, score)),
    hardFail,
    notes: [
      hardFail ? 'Hard rule failed in at least one gate.' : 'All hard rules passed.',
      hasEvidence ? 'Evidence snippets present for traceability.' : 'Evidence sparse; confidence reduced.',
      conservativeBias ? 'Conservative assumptions favored by policy profiles.' : 'Aggressive assumptions increase uncertainty.'
    ]
  };
}

function buildPlans(
  ta: TherapeuticAreaKey,
  brief: { objective: string; medicalNeed: string; constraints: string; success: string },
  evidence: string[],
  agentProfiles: Record<string, AgentProfile>,
  agentStrategies: Record<string, { strategy: 'normal' | 'conservative' | 'backup'; rejectRate: number; samples: number }>
): Plan[] {
  const cfg = TA_DEFAULTS[ta];
  const hasEvidence = evidence.length > 0;

  const buildOne = (id: 'A' | 'B'): Plan => {
    const conservative = id === 'A';
    const endpoint = conservative ? cfg.endpointConservative : cfg.endpointAggressive;
    const assumptions = conservative ? cfg.assumptionsConservative : cfg.assumptionsAggressive;
    const visits = conservative ? cfg.soaConservative : cfg.soaAggressive;
    const inclusion = conservative ? cfg.inclusionCore : cfg.inclusionCore.map((item, idx) => (idx === 1 ? item.replace('0-1', '0-2') : item));
    const exclusion = conservative ? cfg.exclusionCore : cfg.exclusionCore.slice(0, Math.max(1, cfg.exclusionCore.length - 1));

    const estimand = buildEstimand(endpoint as unknown as Record<string, unknown>, cfg.label);
    const eligibilityImpact = simulateEligibilityImpact(inclusion, exclusion, ta === 'oncology' ? 0.5 : 0.54);
    const soaBurden = quantifySoABurden(visits);
    const gates = buildGates({
      endpointType: endpoint.type,
      evidenceCount: evidence.length,
      power: assumptions.power,
      burdenScore: soaBurden.burdenScore,
      timelineDelayWeeks: eligibilityImpact.timelineDelayWeeks
    });

    const policy = scorePolicies(gates, hasEvidence, conservative);
    const medW = agentProfiles.MedicalReviewerAgent?.weight ?? 1;
    const statsW = agentProfiles.StatsReviewerAgent?.weight ?? 1;
    const opsW = agentProfiles.ClinOpsReviewerAgent?.weight ?? 1;
    const regW = agentProfiles.RegReviewerAgent?.weight ?? 1;
    const reviewerAvg = (medW + statsW + opsW + regW) / 4;
    const weightShift = conservative
      ? Math.round((reviewerAvg - 1) * 10)
      : Math.round((1 - reviewerAvg) * 10);
    const criticalAgents = [
      'MedicalReviewerAgent',
      'StatsReviewerAgent',
      'ClinOpsReviewerAgent',
      'RegReviewerAgent'
    ] as const;
    const strategyPenalty = criticalAgents.reduce((sum, name) => {
      const strategy = agentStrategies[name]?.strategy ?? 'normal';
      if (strategy === 'backup') return sum + 2;
      if (strategy === 'conservative') return sum + 1;
      return sum;
    }, 0);
    const strategyShift = conservative ? strategyPenalty * 2 : strategyPenalty * -3;
    const weightedScore = Math.max(35, Math.min(99, policy.score + weightShift + strategyShift));

    const conflicts: Array<{ severity: Severity; message: string }> = [];
    for (const gate of gates) {
      if (!gate.passed) {
        conflicts.push({ severity: gate.severity, message: gate.note });
      }
    }
    if (brief.constraints.toLowerCase().includes('low burden') && soaBurden.burdenBand === 'Heavy') {
      conflicts.push({ severity: 'medium', message: 'Constraint mismatch: low burden requested but SoA is heavy.' });
    }

    return {
      id,
      label: conservative ? 'Plan A · Conservative' : 'Plan B · Aggressive',
      score: weightedScore,
      hardPass: !policy.hardFail,
      policyNotes: [
        ...policy.notes,
        `Feedback weight shift: ${weightShift >= 0 ? '+' : ''}${weightShift} (reviewer weight avg ${reviewerAvg.toFixed(2)})`,
        `Strategy shift: ${strategyShift >= 0 ? '+' : ''}${strategyShift} (auto strategy penalty index ${strategyPenalty})`
      ],
      conflicts: conflicts.length > 0 ? conflicts : [{ severity: 'low', message: 'No material policy conflicts detected.' }],
      nodes: [
        {
          nodeKey: 'endpoint.primary',
          optionId: `${id}-endpoint`,
          optionLabel: endpoint.name,
          rationale: conservative ? 'Prioritizes regulatory interpretability and clinical explainability.' : 'Prioritizes early signal with higher execution and regulatory uncertainty.',
          citations: hasEvidence ? [{ snippet: evidence[0], quote: evidence[0].slice(0, 120) }] : [],
          impacts: conservative
            ? { recruitment: 'Med', sampleSize: 'Low', timeline: 'Med', burden: 'Med', regulatory: 'Low' }
            : { recruitment: 'Low', sampleSize: 'Low', timeline: 'Low', burden: 'Med', regulatory: 'High' },
          content: endpoint
        },
        {
          nodeKey: 'eligibility.core',
          optionId: `${id}-eligibility`,
          optionLabel: conservative ? 'Balanced Eligibility' : 'Broader Eligibility',
          rationale: conservative ? 'Balances internal validity and operational feasibility.' : 'Expands enrollment funnel with heterogeneity trade-off.',
          citations: [],
          impacts: conservative
            ? { recruitment: 'Med', sampleSize: 'Low', timeline: 'Med', burden: 'Low', regulatory: 'Low' }
            : { recruitment: 'Low', sampleSize: 'High', timeline: 'Low', burden: 'Low', regulatory: 'Med' },
          content: { inclusion, exclusion }
        },
        {
          nodeKey: 'assumptions.ledger',
          optionId: `${id}-assumptions`,
          optionLabel: conservative ? 'Conservative Assumption Ledger' : 'Aggressive Assumption Ledger',
          rationale: conservative ? 'Uses cautious planning assumptions to reduce downstream risk.' : 'Uses optimistic assumptions to increase design efficiency.',
          citations: hasEvidence ? [{ snippet: evidence[0], quote: evidence[0].slice(0, 90) }] : [],
          impacts: conservative
            ? { recruitment: 'Low', sampleSize: 'Med', timeline: 'Med', burden: 'Low', regulatory: 'Low' }
            : { recruitment: 'Low', sampleSize: 'Low', timeline: 'Low', burden: 'Low', regulatory: 'Med' },
          content: assumptions
        },
        {
          nodeKey: 'soa.v0',
          optionId: `${id}-soa`,
          optionLabel: conservative ? 'Standard SoA' : 'Dense SoA',
          rationale: conservative ? 'Controls procedure density while preserving endpoint windows.' : 'Increases early signal capture with higher burden.',
          citations: [],
          impacts: conservative
            ? { recruitment: 'Low', sampleSize: 'Low', timeline: 'Med', burden: 'Med', regulatory: 'Low' }
            : { recruitment: 'High', sampleSize: 'Low', timeline: 'Low', burden: 'High', regulatory: 'Med' },
          content: { visits }
        }
      ],
      analysis: {
        medicalNeedFrame: brief.medicalNeed,
        estimand,
        eligibilityImpact,
        soaBurden,
        gates
      }
    };
  };

  return [buildOne('A'), buildOne('B')];
}

async function getAgentReasoning(params: {
  enabled: boolean;
  locale: string;
  agent: string;
  prompt: string;
  fallback: string;
}): Promise<{ text: string; provider: 'qwen' | 'local' }> {
  if (!params.enabled) {
    return { text: params.fallback, provider: 'local' };
  }

  try {
    const response = await fetch('/api/protocol-os-lite/reason', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: params.locale,
        agent: params.agent,
        prompt: params.prompt,
        fallback: params.fallback
      })
    });
    if (!response.ok) return { text: params.fallback, provider: 'local' };
    const data = (await response.json()) as { ok?: boolean; provider?: 'qwen' | 'local'; text?: string };
    if (!data?.text) return { text: params.fallback, provider: 'local' };
    return { text: data.text, provider: data.provider === 'qwen' ? 'qwen' : 'local' };
  } catch {
    return { text: params.fallback, provider: 'local' };
  }
}

function buildChapterContent(selectedPlan: Plan | null, ta: TherapeuticAreaKey, phase: string, region: string, brief: { objective: string; medicalNeed: string; constraints: string; success: string }) {
  if (!selectedPlan) return [] as Array<{ chapter: string; template: string; text: string }>;

  const map = Object.fromEntries(selectedPlan.nodes.map((node) => [node.nodeKey, node])) as Record<string, PlanNode>;
  const endpoint = (map['endpoint.primary']?.content ?? {}) as Record<string, unknown>;
  const eligibility = (map['eligibility.core']?.content ?? {}) as { inclusion?: string[]; exclusion?: string[] };
  const assumptions = (map['assumptions.ledger']?.content ?? {}) as Record<string, unknown>;
  const soa = (map['soa.v0']?.content ?? {}) as { visits?: SoAVisit[] };

  const taName = TA_DEFAULTS[ta].label;
  const visits = soa.visits ?? [];
  const keyVisitWeeks = visits.map((visit) => `Week ${visit.week}`).join(', ') || 'protocol-defined windows';
  const endpointName = String(endpoint.name ?? 'Primary endpoint');
  const endpointWeek = String(endpoint.timepointWeek ?? 'TBD');
  const intervention = ta === 'oncology' ? 'investigational anti-cancer regimen' : ta === 'crm' ? 'investigational cardiometabolic regimen' : ta === 'ophthalmology' ? 'investigational ophthalmic therapy' : 'investigational anti-fibrotic regimen';
  const burdenLevel = map['soa.v0']?.impacts?.burden ?? 'Med';
  const constraintsLower = brief.constraints.toLowerCase();
  const monitoringIntensity = constraintsLower.includes('low burden') ? 'targeted / risk-based' : 'standard / balanced';

  const placeholders: Record<string, string> = {
    STUDY_ID: `POL-${ta.toUpperCase()}-LITE-001`,
    PHASE: phase,
    INTERVENTION: intervention,
    POPULATION: ta === 'inflammation' ? 'adults with fibrotic inflammatory disease' : `adults with ${taName.toLowerCase()}-relevant disease`,
    PRIMARY_ENDPOINT: endpointName,
    PRIMARY_TIMEPOINT: endpointWeek,
    CLINICAL_INTENT: brief.objective || 'demonstration of clinically meaningful benefit',
    DISEASE_CONTEXT: brief.medicalNeed,
    TARGET_REGION: region,
    KEY_SECONDARY_OBJECTIVES: 'safety, patient-reported outcomes, and supportive efficacy endpoints',
    DESIGN_TYPE: selectedPlan.label.includes('Conservative') ? 'randomized, controlled, conservative-design' : 'randomized, controlled, accelerated-design',
    POWER: String(assumptions.power ?? '0.80'),
    EFFECT_SIZE: String(assumptions.effectSize ?? '0.20'),
    DROPOUT_RATE: String(assumptions.dropout ?? '0.15'),
    INCLUSION_SUMMARY: (eligibility.inclusion ?? []).slice(0, 3).join('; ') || 'protocol-defined disease and baseline criteria',
    EXCLUSION_SUMMARY: (eligibility.exclusion ?? []).slice(0, 3).join('; ') || 'major safety and confounding exclusions',
    BURDEN_LEVEL: String(burdenLevel),
    VISIT_COUNT: String(visits.length || 0),
    KEY_VISIT_WEEKS: keyVisitWeeks,
    ANALYSIS_METHOD: 'pre-specified estimand-aligned',
    EVENT_RATE: String(assumptions.eventRate ?? '0.40'),
    MONITORING_INTENSITY: monitoringIntensity,
    REGULATORY_STYLE: 'ICH-GCP and TransCelerate-aligned'
  };

  return CHAPTER_TEMPLATES.map((item) => ({
    chapter: item.chapter,
    template: item.template,
    text: applyTemplate(item.template, placeholders)
  }));
}

function buildSynopsisContent(selectedPlan: Plan | null, ta: TherapeuticAreaKey, phase: string, region: string, brief: { objective: string; medicalNeed: string; constraints: string; success: string }) {
  if (!selectedPlan) return [] as SynopsisSection[];
  const endpoint = selectedPlan.nodes.find((item) => item.nodeKey === 'endpoint.primary');
  const eligibility = selectedPlan.nodes.find((item) => item.nodeKey === 'eligibility.core');
  const assumptions = selectedPlan.nodes.find((item) => item.nodeKey === 'assumptions.ledger');
  const soa = selectedPlan.nodes.find((item) => item.nodeKey === 'soa.v0');
  const visitCount = ((soa?.content?.visits as SoAVisit[] | undefined) ?? []).length;

  return [
    {
      id: 'clinical_intent',
      title: 'Synopsis · Clinical Intent',
      text: `${TA_DEFAULTS[ta].label} | Phase ${phase} | ${region}: ${brief.medicalNeed}`,
      contributors: SYNOPSIS_SECTION_AGENT_MAP.clinical_intent
    },
    {
      id: 'objective_endpoint',
      title: 'Synopsis · Objective and Primary Endpoint',
      text: `Objective: ${brief.objective} | Primary endpoint: ${String(endpoint?.content?.name ?? 'TBD')}`,
      contributors: SYNOPSIS_SECTION_AGENT_MAP.objective_endpoint
    },
    {
      id: 'eligibility_core',
      title: 'Synopsis · Core Eligibility',
      text: `Inclusion/Exclusion baseline is pre-structured and policy-scored. Snapshot: ${JSON.stringify(eligibility?.content ?? {})}`,
      contributors: SYNOPSIS_SECTION_AGENT_MAP.eligibility_core
    },
    {
      id: 'assumptions',
      title: 'Synopsis · Statistical Assumptions',
      text: `Assumption ledger: ${JSON.stringify(assumptions?.content ?? {})}`,
      contributors: SYNOPSIS_SECTION_AGENT_MAP.assumptions
    },
    {
      id: 'soa_ops_risk',
      title: 'Synopsis · SoA and Operational Risk',
      text: `Visit count ${visitCount}; gate status ${selectedPlan.analysis.gates.filter((gate) => gate.passed).length}/${selectedPlan.analysis.gates.length} passed.`,
      contributors: SYNOPSIS_SECTION_AGENT_MAP.soa_ops_risk
    }
  ];
}

function makeProtocolHtml(chapters: Array<{ chapter: string; text: string }>) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Protocol OS Lite Draft</title></head><body>\n<h1>Protocol OS Lite Draft</h1>\n${chapters.map((item) => `<h2>${item.chapter}</h2><p>${item.text}</p>`).join('\n')}\n</body></html>`;
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
  const [phase, setPhase] = useState<(typeof PHASE_OPTIONS)[number]>('II');
  const [region, setRegion] = useState<(typeof REGION_OPTIONS)[number]>('Global');
  const [brief, setBrief] = useState({ objective: '', medicalNeed: '', constraints: '', success: '' });
  const [snippetInput, setSnippetInput] = useState('Guideline precedent: endpoint has accepted historical use.');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<'A' | 'B' | null>(null);
  const [graphVersion, setGraphVersion] = useState(1);
  const [status, setStatus] = useState('Ready. Protocol OS Lite runs entirely with mock data in one page.');
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [rejectReasonDraft, setRejectReasonDraft] = useState<Record<string, string>>({});
  const [runSnapshots, setRunSnapshots] = useState<RunSnapshot[]>([]);
  const [synopsisSnapshots, setSynopsisSnapshots] = useState<SynopsisSnapshot[]>([]);
  const [feedbackEvents, setFeedbackEvents] = useState<FeedbackEvent[]>([]);
  const [windowSize, setWindowSize] = useState(20);
  const [rejectThreshold, setRejectThreshold] = useState(0.5);
  const [minFeedbackForSwitch, setMinFeedbackForSwitch] = useState(4);
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [runningAgents, setRunningAgents] = useState(false);
  const [synopsisGenerated, setSynopsisGenerated] = useState(false);
  const [fullGenerated, setFullGenerated] = useState(false);

  const scenarioKey = useMemo(() => makeScenarioKey(ta, phase, region), [ta, phase, region]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('protocol-lite-feedback-events');
      if (!raw) return;
      const parsed = JSON.parse(raw) as FeedbackEvent[];
      setFeedbackEvents(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('protocol-lite-feedback-events', JSON.stringify(feedbackEvents));
    } catch {
      // ignore
    }
  }, [feedbackEvents]);

  useEffect(() => {
    const cfg = TA_DEFAULTS[ta];
    setBrief({ objective: cfg.objective, medicalNeed: cfg.medicalNeed, constraints: cfg.constraints, success: cfg.success });
    setEvidence([`Default evidence (${cfg.label}): endpoint and feasibility references loaded.`]);
    setPlans([]);
    setSelectedPlanId(null);
    setAgentLogs([]);
    setRejectReasonDraft({});
    setSynopsisGenerated(false);
    setFullGenerated(false);
    setStatus(`Defaults loaded for ${cfg.label}.`);
  }, [ta]);

  const agentProfiles = useMemo(
    () => recomputeProfilesForScenario(feedbackEvents, scenarioKey, windowSize),
    [feedbackEvents, scenarioKey, windowSize]
  );
  const agentStrategies = useMemo(
    () => deriveAgentStrategies(agentProfiles, rejectThreshold, minFeedbackForSwitch),
    [agentProfiles, rejectThreshold, minFeedbackForSwitch]
  );

  const selectedPlan = useMemo(() => plans.find((item) => item.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const synopsisDraft = useMemo(() => buildSynopsisContent(selectedPlan, ta, phase, region, brief), [selectedPlan, ta, phase, region, brief]);
  const chapterDraft = useMemo(() => buildChapterContent(selectedPlan, ta, phase, region, brief), [selectedPlan, ta, phase, region, brief]);
  const runComparison = useMemo(() => {
    const scoped = runSnapshots.filter((item) => item.scenarioKey === scenarioKey);
    if (scoped.length < 2) return null;
    const current = scoped[scoped.length - 1];
    const previous = scoped[scoped.length - 2];
    return {
      current,
      previous,
      deltaA: current.planScores.A - previous.planScores.A,
      deltaB: current.planScores.B - previous.planScores.B
    };
  }, [runSnapshots, scenarioKey]);
  const synopsisComparison = useMemo(() => {
    const scoped = synopsisSnapshots.filter((item) => item.scenarioKey === scenarioKey);
    const current = scoped[scoped.length - 1] ?? null;
    const previous = scoped.length > 1 ? scoped[scoped.length - 2] : null;
    const diffs = current ? computeSynopsisDiff(previous?.sections ?? null, current.sections) : [];
    return { current, previous, diffs };
  }, [synopsisSnapshots, scenarioKey]);
  const agentImpactScores = useMemo(
    () => computeAgentImpactScores(agentProfiles, agentStrategies),
    [agentProfiles, agentStrategies]
  );

  async function runAgents(generated: Plan[]) {
    const preferred = [...generated].sort((a, b) => b.score - a.score)[0];
    const functionalAgents = [
      {
        name: 'MedicalNeedFramingAgent',
        prompt: `Medical need: ${preferred.analysis.medicalNeedFrame}`,
        fallback: `Framed unmet need around ${TA_DEFAULTS[ta].label} and linked it to endpoint intent.`
      },
      {
        name: 'EndpointEstimandAgent',
        prompt: `Estimand summary: ${preferred.analysis.estimand.summary}`,
        fallback: `Aligned endpoint with treatment-policy estimand and intercurrent event handling.`
      },
      {
        name: 'EligibilityImpactAgent',
        prompt: `Eligibility impact: ${JSON.stringify(preferred.analysis.eligibilityImpact)}`,
        fallback: `Projected eligibility rate ${preferred.analysis.eligibilityImpact.eligibleRate} with timeline shift ${preferred.analysis.eligibilityImpact.timelineDelayWeeks} weeks.`
      },
      {
        name: 'SoABurdenAgent',
        prompt: `Burden metrics: ${JSON.stringify(preferred.analysis.soaBurden)}`,
        fallback: `Calculated burden score ${preferred.analysis.soaBurden.burdenScore} (${preferred.analysis.soaBurden.burdenBand}).`
      },
      {
        name: 'OperationalGateAgent',
        prompt: `Gate results: ${JSON.stringify(preferred.analysis.gates)}`,
        fallback: `${preferred.analysis.gates.filter((gate) => gate.passed).length}/${preferred.analysis.gates.length} operational gates passed.`
      }
    ] as const;

    const roleAgents = [
      {
        name: 'MedicalReviewerAgent',
        prompt: `Medical review on endpoint and clinical meaning for plan ${preferred.id}`,
        fallback: `Medical review favors ${preferred.id === 'A' ? 'conservative interpretability' : 'faster signal at higher uncertainty'}.`
      },
      {
        name: 'StatsReviewerAgent',
        prompt: `Stat assumptions and power ${preferred.nodes.find((node) => node.nodeKey === 'assumptions.ledger')?.content?.power ?? 'NA'}`,
        fallback: `Stats review highlights assumption discipline and power threshold adherence.`
      },
      {
        name: 'ClinOpsReviewerAgent',
        prompt: `Operational burden ${preferred.analysis.soaBurden.burdenScore} and eligibility delay ${preferred.analysis.eligibilityImpact.timelineDelayWeeks}`,
        fallback: `ClinOps review focuses on SoA burden and recruitment practicality.`
      },
      {
        name: 'RegReviewerAgent',
        prompt: `Regulatory risk and evidence count ${evidence.length}`,
        fallback: `Reg review checks endpoint precedent, wording discipline, and citation sufficiency.`
      }
    ] as const;

    const logs: AgentLog[] = [];
    for (const agent of functionalAgents) {
      const strategy = agentStrategies[agent.name]?.strategy ?? 'normal';
      const result = await getAgentReasoning({
        enabled: llmEnabled,
        locale,
        agent: agent.name,
        prompt: `${agent.prompt} | strategy=${strategy}`,
        fallback: agent.fallback
      });
      logs.push({
        id: `${agent.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        layer: 'functional',
        agent: agent.name,
        output: result.text,
        provider: result.provider,
        weightApplied: agentProfiles[agent.name]?.weight ?? 1,
        strategyApplied: strategy
      });
    }

    for (const agent of roleAgents) {
      const strategy = agentStrategies[agent.name]?.strategy ?? 'normal';
      const result = await getAgentReasoning({
        enabled: llmEnabled,
        locale,
        agent: agent.name,
        prompt: `${agent.prompt} | strategy=${strategy}`,
        fallback: agent.fallback
      });
      logs.push({
        id: `${agent.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        layer: 'role',
        agent: agent.name,
        output: result.text,
        provider: result.provider,
        weightApplied: agentProfiles[agent.name]?.weight ?? 1,
        strategyApplied: strategy
      });
    }

    setAgentLogs(logs);
  }

  async function generatePlans() {
    setStatus('Generating A/B with key design checks and agent runtime...');
    setRunningAgents(true);
    const generated = buildPlans(ta, brief, evidence, agentProfiles, agentStrategies);
    setPlans(generated);
    setSelectedPlanId(null);
    setSynopsisGenerated(false);
    setFullGenerated(false);
    await runAgents(generated);
    setRunSnapshots((prev) => [
      ...prev.slice(-4),
      {
        runId: `run-${Date.now()}`,
        scenarioKey,
        timestamp: new Date().toLocaleTimeString(),
        planScores: {
          A: generated.find((item) => item.id === 'A')?.score ?? 0,
          B: generated.find((item) => item.id === 'B')?.score ?? 0
        },
        bestPlan: ([...generated].sort((a, b) => b.score - a.score)[0]?.id ?? 'A') as 'A' | 'B',
        weightSnapshot: Object.fromEntries(Object.entries(agentProfiles).map(([name, profile]) => [name, profile.weight]))
      }
    ]);
    setRunningAgents(false);
    setStatus('A/B plans generated with medical/estimand/eligibility/burden/gate analysis and agent reviews.');
  }

  function acceptPlan(planId: 'A' | 'B') {
    setSelectedPlanId(planId);
    setSynopsisGenerated(false);
    setFullGenerated(false);
    setGraphVersion((prev) => prev + 1);
    setStatus(`Plan ${planId} accepted. Design graph version is now v${graphVersion + 1}.`);
  }

  function applyAgentFeedback(logId: string, decision: 'accepted' | 'rejected') {
    const log = agentLogs.find((item) => item.id === logId);
    if (!log) return;
    const reason = decision === 'rejected' ? rejectReasonDraft[logId] ?? REJECT_REASONS[0] : undefined;

    setAgentLogs((prev) =>
      prev.map((item) =>
        item.id === logId
          ? {
              ...item,
              feedbackStatus: decision,
              feedbackReason: reason
            }
          : item
      )
    );

    setFeedbackEvents((prev) => [
      ...prev,
      {
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        scenarioKey,
        agent: log.agent,
        decision,
        reason,
        timestamp: new Date().toISOString()
      }
    ]);

    setStatus(
      decision === 'accepted'
        ? `${log.agent} accepted. Sliding-window profile updated for current scenario.`
        : `${log.agent} rejected (${reason}). Sliding-window profile updated for current scenario.`
    );
  }

  function generateSynopsis() {
    if (!selectedPlan) {
      setStatus('Please accept Plan A or B first.');
      return;
    }
    setSynopsisSnapshots((prev) => [
      ...prev.slice(-9),
      {
        id: `syn-${Date.now()}`,
        scenarioKey,
        timestamp: new Date().toLocaleTimeString(),
        sections: synopsisDraft
      }
    ]);
    setSynopsisGenerated(true);
    setFullGenerated(false);
    setStatus('Synopsis generated. Review synopsis before expanding to full protocol.');
  }

  function expandToFullProtocol() {
    if (!selectedPlan) {
      setStatus('Please accept Plan A or B first.');
      return;
    }
    if (!synopsisGenerated) {
      setStatus('Generate synopsis first, then expand to full protocol.');
      return;
    }
    setFullGenerated(true);
    setStatus('Full protocol draft generated from accepted synopsis.');
  }

  function exportAll() {
    if (!selectedPlan) {
      setStatus('Please accept Plan A or B before export.');
      return;
    }
    if (!synopsisGenerated || !fullGenerated) {
      setStatus('Please complete both stages: Generate Synopsis -> Expand to Full Protocol.');
      return;
    }

    const traceability = {
      mode: 'protocol-os-lite-mock',
      locale,
      therapeuticArea: ta,
      phase,
      region,
      scenarioKey,
      graphVersion,
      selectedPlan: selectedPlan.id,
      score: selectedPlan.score,
      hardPass: selectedPlan.hardPass,
      policyNotes: selectedPlan.policyNotes,
      conflicts: selectedPlan.conflicts,
      gates: selectedPlan.analysis.gates,
      agentLogs,
      nodes: selectedPlan.nodes,
      synopsis: synopsisDraft,
      synopsisDiff: synopsisComparison.diffs,
      agentImpacts: agentImpactScores,
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
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs text-ink/80">
            Phase
            <select className="mt-1 w-full rounded border border-ink/25 bg-base px-2 py-2 text-sm text-ink" value={phase} onChange={(e) => setPhase(e.target.value as (typeof PHASE_OPTIONS)[number])}>
              {PHASE_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink/80">
            Region
            <select className="mt-1 w-full rounded border border-ink/25 bg-base px-2 py-2 text-sm text-ink" value={region} onChange={(e) => setRegion(e.target.value as (typeof REGION_OPTIONS)[number])}>
              {REGION_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-ink/70">Scenario key: <code>{scenarioKey}</code></p>
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">2) Brief Inputs (pre-filled defaults)</CardTitle>
        <label className="text-xs uppercase tracking-[0.12em] text-ink/80">Medical Need Framing</label>
        <Textarea className="bg-base text-ink" rows={3} value={brief.medicalNeed} onChange={(e) => setBrief((s) => ({ ...s, medicalNeed: e.target.value }))} />
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
          <CardTitle className="text-ink">4) Agent Runtime + Plan A/B</CardTitle>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-ink/80">
              <input type="checkbox" checked={llmEnabled} onChange={(e) => setLlmEnabled(e.target.checked)} />
              Enable Tongyi Qwen reasoning (auto-fallback)
            </label>
            <Button onClick={generatePlans} disabled={runningAgents}>{runningAgents ? 'Running...' : 'Generate A/B'}</Button>
          </div>
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
              <p className="mt-1 text-xs text-ink/85">Estimand: {plan.analysis.estimand.summary}</p>
              <p className="mt-1 text-xs text-ink/85">Eligibility impact: {Math.round(plan.analysis.eligibilityImpact.eligibleRate * 100)}% eligible, {plan.analysis.eligibilityImpact.timelineDelayWeeks} weeks delay.</p>
              <p className="mt-1 text-xs text-ink/85">SoA burden: score {plan.analysis.soaBurden.burdenScore} ({plan.analysis.soaBurden.burdenBand}).</p>
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
        <CardTitle className="text-ink">5) Agent Logs (Functional + Role)</CardTitle>
        {agentLogs.length === 0 ? (
          <p className="text-sm text-ink/80">No agent run yet. Click Generate A/B.</p>
        ) : (
          <div className="space-y-2">
            {agentLogs.map((log) => (
              <div key={log.id} className="rounded border border-ink/20 bg-base p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{log.agent}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={log.layer === 'functional' ? 'border-accent1/50 bg-accent1/10 text-ink' : 'border-accent2/50 bg-accent2/10 text-ink'}>
                      {log.layer}
                    </Badge>
                    <Badge className="border-ink/20 bg-ink/5 text-ink">{log.provider}</Badge>
                    <Badge className="border-ink/20 bg-ink/5 text-ink">w={log.weightApplied.toFixed(2)}</Badge>
                    <Badge className={log.strategyApplied === 'backup' ? 'border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-300' : log.strategyApplied === 'conservative' ? 'border-amber-500/45 bg-amber-500/10 text-amber-700 dark:text-amber-200' : 'border-ink/20 bg-ink/5 text-ink'}>
                      {log.strategyApplied}
                    </Badge>
                    <span className="text-xs text-ink/60">{log.timestamp}</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink/90">{log.output}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => applyAgentFeedback(log.id, 'accepted')}>
                    Accept
                  </Button>
                  <select
                    className="rounded border border-ink/25 bg-base px-2 py-1 text-xs text-ink"
                    value={rejectReasonDraft[log.id] ?? REJECT_REASONS[0]}
                    onChange={(e) => setRejectReasonDraft((prev) => ({ ...prev, [log.id]: e.target.value }))}
                  >
                    {REJECT_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        reject: {reason}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" onClick={() => applyAgentFeedback(log.id, 'rejected')}>
                    Reject
                  </Button>
                  {log.feedbackStatus ? (
                    <Badge className={log.feedbackStatus === 'accepted' ? 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-red-500/45 bg-red-500/10 text-red-700 dark:text-red-300'}>
                      {log.feedbackStatus}
                      {log.feedbackReason ? ` · ${log.feedbackReason}` : ''}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">Feedback Loop: Weight Change</CardTitle>
        <div className="grid gap-2 md:grid-cols-3">
          <label className="text-xs text-ink/80">
            Sliding window N
            <input
              className="mt-1 w-full rounded border border-ink/25 bg-base px-2 py-2 text-sm text-ink"
              type="number"
              min={5}
              max={200}
              value={windowSize}
              onChange={(e) => setWindowSize(Math.max(5, Math.min(200, Number(e.target.value) || 20)))}
            />
          </label>
          <label className="text-xs text-ink/80">
            Reject threshold
            <input
              className="mt-1 w-full rounded border border-ink/25 bg-base px-2 py-2 text-sm text-ink"
              type="number"
              step={0.05}
              min={0.3}
              max={0.9}
              value={rejectThreshold}
              onChange={(e) => setRejectThreshold(Math.max(0.3, Math.min(0.9, Number(e.target.value) || 0.5)))}
            />
          </label>
          <label className="text-xs text-ink/80">
            Min samples for switch
            <input
              className="mt-1 w-full rounded border border-ink/25 bg-base px-2 py-2 text-sm text-ink"
              type="number"
              min={2}
              max={20}
              value={minFeedbackForSwitch}
              onChange={(e) => setMinFeedbackForSwitch(Math.max(2, Math.min(20, Number(e.target.value) || 4)))}
            />
          </label>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {AGENT_NAMES.map((name) => {
            const profile = agentProfiles[name] ?? { weight: 1, acceptCount: 0, rejectCount: 0 };
            const strategy = agentStrategies[name] ?? { strategy: 'normal', rejectRate: 0, samples: 0 };
            return (
              <div key={name} className="rounded border border-ink/20 bg-base p-3 text-xs text-ink">
                <p className="font-semibold text-ink">{name}</p>
                <p className="mt-1">weight: {profile.weight.toFixed(2)}</p>
                <p>accept: {profile.acceptCount} | reject: {profile.rejectCount}</p>
                <p>reject rate: {(strategy.rejectRate * 100).toFixed(0)}% | samples: {strategy.samples}</p>
                <p>
                  strategy:{' '}
                  <span className={strategy.strategy === 'backup' ? 'text-red-700 dark:text-red-300' : strategy.strategy === 'conservative' ? 'text-amber-700 dark:text-amber-200' : 'text-ink'}>
                    {strategy.strategy}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">Feedback Loop: Next-Run Comparison</CardTitle>
        {runComparison ? (
          <div className="space-y-2 text-sm text-ink/90">
            <p className="text-xs text-ink/70">scenario: <code>{scenarioKey}</code></p>
            <p>
              previous ({runComparison.previous.timestamp}) best {runComparison.previous.bestPlan}
              {' '}→ current ({runComparison.current.timestamp}) best {runComparison.current.bestPlan}
            </p>
            <p>Plan A: {runComparison.previous.planScores.A} → {runComparison.current.planScores.A} ({runComparison.deltaA >= 0 ? '+' : ''}{runComparison.deltaA})</p>
            <p>Plan B: {runComparison.previous.planScores.B} → {runComparison.current.planScores.B} ({runComparison.deltaB >= 0 ? '+' : ''}{runComparison.deltaB})</p>
            <p className="text-xs text-ink/70">Generate A/B again after feedback to observe weight-driven score movement.</p>
          </div>
        ) : (
          <p className="text-sm text-ink/80">Need at least two runs to show comparison. Give feedback, then click Generate A/B again.</p>
        )}
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-ink">Two-Stage Drafting</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateSynopsis}>Generate Synopsis</Button>
            <Button onClick={expandToFullProtocol}>Expand to Full Protocol</Button>
          </div>
        </div>
        {synopsisGenerated ? (
          <div className="space-y-2">
            {synopsisDraft.map((item) => (
              <div key={item.title} className="rounded border border-ink/20 bg-base p-3">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm text-ink/90">{item.text}</p>
                <p className="mt-2 text-[11px] text-ink/60">
                  Contributed by: {item.contributors.join(', ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/85">After accepting a plan, generate synopsis first.</p>
        )}
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">Synopsis Attribution Console</CardTitle>
        {synopsisGenerated ? (
          <div className="space-y-4">
            <div className="rounded border border-ink/20 bg-base p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/70">Section Mapping</p>
              <div className="mt-2 space-y-2">
                {synopsisDraft.map((section) => (
                  <div key={section.id} className="rounded border border-ink/15 px-2 py-2 text-xs text-ink">
                    <p className="font-semibold text-ink">{section.title}</p>
                    <p className="mt-1 text-ink/80">{section.contributors.join(' · ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-ink/20 bg-base p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/70">Before/After Diff</p>
              {synopsisComparison.diffs.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {synopsisComparison.diffs.map((diff) => (
                    <div key={`${diff.sectionId}-${diff.sourceAgent}`} className="rounded border border-ink/15 px-2 py-2 text-xs text-ink">
                      <p className="font-semibold">{diff.sectionTitle}</p>
                      <p className="mt-1 text-ink/75">source agent: {diff.sourceAgent}</p>
                      <p className="mt-1 text-ink/70">before: {diff.before || '(empty)'}</p>
                      <p className="mt-1 text-ink">after: {diff.after}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink/75">No diff yet. Generate synopsis at least twice in the same scenario.</p>
              )}
            </div>

            <div className="rounded border border-ink/20 bg-base p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/70">Impact Attribution</p>
              <div className="mt-2 space-y-2">
                {agentImpactScores.slice(0, 9).map((item) => (
                  <div key={item.agent} className="flex items-center justify-between rounded border border-ink/15 px-2 py-2 text-xs text-ink">
                    <span>{item.agent}</span>
                    <span>
                      impact {item.impact >= 0 ? '+' : ''}{item.impact} | {item.strategy} | n={item.samples}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink/80">Generate synopsis first to view section mapping, diff, and impact attribution.</p>
        )}
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">Chaptered Full Protocol Draft (SH/TransCelerate-style structure)</CardTitle>
        {fullGenerated ? (
          <div className="space-y-2">
            {chapterDraft.map((chapter) => (
              <div key={chapter.chapter} className="rounded border border-ink/20 bg-base p-3">
                <p className="text-sm font-semibold text-ink">{chapter.chapter}</p>
                <p className="mt-1 text-sm text-ink/90">{chapter.text}</p>
                <p className="mt-2 text-[11px] text-ink/60">Template: <code>{chapter.template}</code></p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/85">Generate synopsis and click <code>Expand to Full Protocol</code>.</p>
        )}
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-ink">Export Package</CardTitle>
          <Button onClick={exportAll}>Export HTML + CSV + JSON</Button>
        </div>
        <p className="text-xs text-ink/80">Current mock graph version: v{graphVersion}</p>
      </Card>

      <Card className="bg-base border-ink/25 space-y-3">
        <CardTitle className="text-ink">Product Update Log</CardTitle>
        <div className="space-y-2">
          {UPDATE_LOG.map((item) => (
            <div key={item.version} className="rounded border border-ink/20 bg-base p-3">
              <p className="text-sm font-semibold text-ink">{item.version} · {item.date} · {item.title}</p>
              <ul className="mt-1 text-sm text-ink/90">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>- {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-base border-ink/25">
        <p className="text-sm text-ink/90">{status}</p>
      </Card>
    </div>
  );
}
