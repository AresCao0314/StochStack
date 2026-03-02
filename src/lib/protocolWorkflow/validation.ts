import { db } from '@/lib/protocolWorkflow/db';
import type { ValidationIssue } from '@/lib/protocolWorkflow/types';
import { REVIEW_STATE } from '@/lib/protocolWorkflow/extraction';

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const synonymMap: Record<string, string[]> = {
  progression: ['disease progression', 'tumor progression', 'progression-free survival'],
  survival: ['overall survival', 'os'],
  response: ['overall response rate', 'orr', 'response assessment']
};

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasSynonymMatch(text: string, target: string) {
  const nText = normalized(text);
  const nTarget = normalized(target);
  if (nText.includes(nTarget) || nTarget.includes(nText)) return true;

  for (const [key, words] of Object.entries(synonymMap)) {
    if ((nText.includes(key) || words.some((word) => nText.includes(normalized(word)))) &&
      (nTarget.includes(key) || words.some((word) => nTarget.includes(normalized(word))))) {
      return true;
    }
  }
  return false;
}

function parseVisitWindow(windowText: string): number {
  const dayMatch = windowText.match(/day\s*([+-]?\d+)/i);
  if (dayMatch) return Number(dayMatch[1]);
  const cycleMatch = windowText.match(/cycle\s*(\d+)/i);
  if (cycleMatch) return Number(cycleMatch[1]) * 21;
  return Number.NaN;
}

export function evaluateFieldSet(fields: Array<{ path: string; value: unknown }>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lookup = new Map(fields.map((field) => [field.path, field.value]));

  const title = String(lookup.get('metadata.title') ?? '').trim();
  if (!title) {
    issues.push({
      ruleId: 'USDM-REQ-001',
      severity: 'error',
      message: 'Study title is required.',
      path: 'metadata.title',
      suggestion: 'Add a protocol title or map from cover page title.'
    });
  }

  const armCount = fields.filter((field) => field.path.startsWith('studyDesign.arms[')).length;
  if (armCount === 0) {
    issues.push({
      ruleId: 'USDM-REQ-002',
      severity: 'warning',
      message: 'No treatment arms found.',
      path: 'studyDesign.arms',
      suggestion: 'Capture at least one treatment arm from design section.'
    });
  }

  const endpointFields = fields.filter((field) => field.path.startsWith('endpoint.'));
  if (endpointFields.length === 0) {
    issues.push({
      ruleId: 'USDM-REQ-003',
      severity: 'error',
      message: 'At least one endpoint is required.',
      path: 'endpoint',
      suggestion: 'Extract primary endpoint(s) from objectives/endpoints section.'
    });
  }

  const soaActivities = fields.filter((field) => field.path.endsWith('.activities')).flatMap((field) =>
    Array.isArray(field.value) ? (field.value as string[]) : [String(field.value)]
  );

  endpointFields.forEach((endpointField) => {
    const endpointValue = String(endpointField.value ?? '');
    const matched = soaActivities.some((activity) => hasSynonymMatch(activity, endpointValue));
    if (!matched) {
      issues.push({
        ruleId: 'CONSISTENCY-001',
        severity: 'warning',
        message: `Endpoint "${endpointValue}" has no obvious SoA assessment mapping.`,
        path: endpointField.path,
        suggestion: 'Add matching assessment/timepoint into SoA or align naming.'
      });
    }
  });

  const visitWindows = fields
    .filter((field) => field.path.endsWith('.window'))
    .map((field) => ({ path: field.path, text: String(field.value ?? '') }))
    .map((item) => ({ ...item, day: parseVisitWindow(item.text) }));

  const negatives = visitWindows.filter((item) => Number.isFinite(item.day) && item.day < -60);
  negatives.forEach((item) => {
    issues.push({
      ruleId: 'CONSISTENCY-002',
      severity: 'warning',
      message: `Visit window appears too early (${item.text}).`,
      path: item.path,
      suggestion: 'Review visit window and ensure day range is intended.'
    });
  });

  const numericWindows = visitWindows.filter((item) => Number.isFinite(item.day));
  for (let idx = 1; idx < numericWindows.length; idx += 1) {
    if (numericWindows[idx].day < numericWindows[idx - 1].day) {
      issues.push({
        ruleId: 'CONSISTENCY-003',
        severity: 'error',
        message: 'Visit windows are not in ascending order.',
        path: numericWindows[idx].path,
        suggestion: 'Sort visit order and verify timepoint definitions.'
      });
      break;
    }
  }

  const objectiveExists = fields.some((field) => field.path.startsWith('study.objective'));
  if (!objectiveExists) {
    issues.push({
      ruleId: 'TEMPLATE-001',
      severity: 'warning',
      message: 'Objectives section appears missing.',
      path: 'study.objective',
      suggestion: 'Extract objective section to improve protocol completeness.'
    });
  }

  const safetyExists = fields.some((field) => field.path.startsWith('study.safetyMonitoring'));
  if (!safetyExists) {
    issues.push({
      ruleId: 'TEMPLATE-002',
      severity: 'warning',
      message: 'Safety monitoring section is missing.',
      path: 'study.safetyMonitoring',
      suggestion: 'Map safety monitoring statements from protocol.'
    });
  }

  return issues;
}

export async function runValidationForRun(runId: string): Promise<{
  status: 'pass' | 'fail';
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  issues: ValidationIssue[];
}> {
  const fields = await db.extractedField.findMany({
    where: {
      runId,
      reviewerState: { not: REVIEW_STATE.rejected }
    },
    orderBy: { path: 'asc' }
  });

  const normalizedFields = fields.map((field) => ({
    path: field.path,
    value:
      field.reviewerState === REVIEW_STATE.edited && field.reviewerEdits
        ? parseJson(field.reviewerEdits, field.reviewerEdits)
        : parseJson(field.value, field.value)
  }));

  const issues = evaluateFieldSet(normalizedFields);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    errors,
    warnings,
    issues
  };
}
