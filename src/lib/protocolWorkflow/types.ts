export type WorkflowStepKey =
  | 'ingest'
  | 'extract'
  | 'review'
  | 'validate'
  | 'publish'
  | 'feedback';

export type WorkflowStepState = 'not_started' | 'in_progress' | 'completed' | 'failed';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  path: string;
  suggestion: string;
};

export type DiffChange = {
  type: 'add' | 'remove' | 'modify';
  path: string;
  before: unknown;
  after: unknown;
  beforeConfidence?: number;
  afterConfidence?: number;
  evidence?: {
    quote?: string;
    page?: number | null;
    chunkId?: string;
  };
};

export type ImpactItem = {
  domain: 'Eligibility' | 'SoA' | 'Endpoint' | 'Arms' | 'Visits' | 'Safety' | 'Other';
  path: string;
  changeType: DiffChange['type'];
  downstream: string[];
  rationale: string;
};

export type CsvFeedbackRow = {
  date: string;
  category: string;
  description: string;
};
