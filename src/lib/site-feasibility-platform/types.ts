export type SfpSection =
  | 'dashboard'
  | 'study-workspace'
  | 'site-explorer'
  | 'scenario-lab'
  | 'recommendation-center'
  | 'data-catalog'
  | 'settings';

export type StudyRecord = {
  code: string;
  title: string;
  phase: string;
  indication: string;
  targetEnrollment: number;
  sponsor: string;
  protocolVersion: string;
  complexity: {
    overall: number;
    inclusionExclusion: number;
    procedures: number;
    operational: number;
    burdenLabel: 'Low' | 'Moderate' | 'High';
  };
  countries: string[];
};

export type CountryRecord = {
  name: string;
  startupDays: number;
  startupRisk: number;
  patientAccess: number;
  competitionRisk: number;
  diversityFit: number;
  forecastEnrollment: number;
  regulatoryReadiness: number;
};

export type SiteRecord = {
  id: string;
  name: string;
  country: string;
  city: string;
  principalInvestigator: string;
  startupDays: number;
  startupRisk: number;
  patientMatchScore: number;
  patientPool: number;
  diversityFit: number;
  competitionRisk: number;
  dataQualityScore: number;
  enrollmentRate: number;
  protocolFit: number;
  preferredPopulation: string;
  rationale: string[];
  tags: string[];
};

export type RecommendationRecord = {
  siteId: string;
  rank: number;
  score: number;
  tier: 'Tier 1' | 'Tier 2' | 'Watch';
  summary: string;
  explainability: Array<{
    label: string;
    value: number;
    note: string;
  }>;
  action: string;
};

export type ScenarioRecord = {
  id: string;
  label: string;
  assumptions: {
    startupWeight: number;
    enrollmentWeight: number;
    diversityWeight: number;
    competitionPenalty: number;
  };
  expectedLpiWeeks: number;
  expectedActivatedSites: number;
  expectedEnrollmentAtMonth6: number;
  narrative: string;
};

export type CatalogRecord = {
  id: string;
  name: string;
  type: 'External Registry' | 'Internal Benchmark' | 'Feasibility Survey' | 'Protocol Artifact';
  freshness: string;
  granularity: string;
  coverage: string;
  fields: string[];
  owner: string;
  usage: string;
};

export type SettingsRecord = {
  scoringWeights: {
    patientMatch: number;
    startupSpeed: number;
    diversityFit: number;
    competitionPenalty: number;
    dataQuality: number;
  };
  thresholds: {
    tier1Score: number;
    maxStartupDays: number;
    maxCompetitionRisk: number;
  };
};

export type SfpDataset = {
  study: StudyRecord;
  countries: CountryRecord[];
  sites: SiteRecord[];
  scenarios: ScenarioRecord[];
  catalog: CatalogRecord[];
  settings: SettingsRecord;
};

