export type TherapeuticArea = 'Oncology' | 'Cardio' | 'Ophthalmology' | 'Rare';
export type Phase = 'I' | 'II' | 'III';
export type Country = 'Germany' | 'France' | 'China' | 'US' | 'UK';

export type AssumptionInput = {
  avg_startup_days: number;
  screen_fail_rate: number;
  dropout_rate: number;
  competition_index: number;
  patient_pool_index: number;
};

export type ScenarioInput = {
  therapeuticArea: TherapeuticArea;
  phase: Phase;
  countries: Country[];
  targetSampleSize: number;
  durationMonths: number;
  assumptions: AssumptionInput;
  deterministicSeed: boolean;
  realtimeMessages: boolean;
};

export type AgentName =
  | 'CTM_Orchestrator'
  | 'Country_Feasibility_Agent'
  | 'Site_Scout_Agent'
  | 'StartUp_Workflow_Agent'
  | 'Recruitment_Dynamics_Agent'
  | 'Risk_Officer_Agent';

export type PatchOp = 'add' | 'replace' | 'remove';

export type ContextPatch = {
  type: string;
  path: string;
  op: PatchOp;
  value: unknown;
  sourceAgent: AgentName;
  rationale: string;
};

export type ContextEvent = {
  id: string;
  timestamp: string;
  sourceAgent: AgentName;
  patch: ContextPatch;
  before: unknown;
  after: unknown;
  summary: string;
};

export type AssumptionValue = {
  value: number | string | boolean;
  sourceAgent: AgentName;
  updatedAt: string;
  version: number;
};

export type Site = {
  id: string;
  site_name: string;
  country: Country;
  startup_days_p50: number;
  startup_risk: number;
  expected_recruitment_rate: number;
  score: number;
  startup_completion_day: number;
};

export type RiskItem = {
  risk_id: string;
  title: string;
  likelihood: number;
  impact: number;
  mitigation: string;
  owner_agent: AgentName;
};

export type DecisionItem = {
  timestamp: string;
  decision: string;
  rationale: string;
  tradeoff: string;
};

export type RecruitmentPoint = {
  month: number;
  cumulativeEnrollment: number;
  plannedEnrollment: number;
};

export type StartupDistributionPoint = {
  country: Country;
  avgStartupDays: number;
  p75StartupDays: number;
};

export type Kpis = {
  predictedFPI: string;
  predictedLPI: string;
  sitesNeeded: number;
  totalStartupCost: number;
  overallRiskScore: number;
};

export type ActualObservation = {
  month: number;
  actualCumulativeEnrollment: number;
  startupAvgDaysObserved?: number;
  recordedAt: string;
};

export type ForecastErrorPoint = {
  month: number;
  predictedCumulativeEnrollment: number;
  actualCumulativeEnrollment: number;
  absPctError: number;
  signedPctError: number;
  startupErrorDays?: number;
  recordedAt: string;
};

export type ForecastDiagnostics = {
  confidenceScore: number;
  mape: number;
  signedBias: number;
  points: number;
  lastCalibratedAt: string | null;
  parameterShift: Record<string, number>;
  notes: string[];
  history: ForecastErrorPoint[];
};

export type SimResults = {
  recruitmentCurve: RecruitmentPoint[];
  startupDistribution: StartupDistributionPoint[];
  kpis: Kpis;
  actuals: ActualObservation[];
  forecastDiagnostics: ForecastDiagnostics;
};

export type ContextRoot = {
  meta: {
    runId: string;
    seed: number;
    createdAt: string;
    version: number;
  };
  studyProfile: {
    therapeuticArea: TherapeuticArea;
    phase: Phase;
    countries: Country[];
    targetSampleSize: number;
    durationMonths: number;
  };
  assumptions: Record<string, AssumptionValue>;
  candidateSites: Site[];
  risks: RiskItem[];
  decisions: DecisionItem[];
  simResults: SimResults;
  eventLog: ContextEvent[];
};

export type MessageAttachment =
  | { type: 'RiskItem'; data: Partial<RiskItem> }
  | { type: 'Assumption'; data: Record<string, unknown> }
  | { type: 'Timeline Update'; data: Record<string, unknown> }
  | { type: 'Site Candidate List'; data: Record<string, unknown> };

export type AgentMessage = {
  id: string;
  timestamp: string;
  agent: AgentName;
  role: string;
  text: string;
  handoffTo?: AgentName;
  attachments?: MessageAttachment[];
  eventIds: string[];
};

export type AgentRunResult = {
  messages: Omit<AgentMessage, 'id' | 'timestamp' | 'eventIds'>[];
  patches: ContextPatch[];
};

export type RunHistoryItem = {
  id: string;
  createdAt: string;
  input: ScenarioInput;
  context: ContextRoot;
  messages: AgentMessage[];
};

export type Rng = {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: T[]) => T;
};
