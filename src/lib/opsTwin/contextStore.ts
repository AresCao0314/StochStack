import type { ContextEvent, ContextPatch, ContextRoot, ScenarioInput } from '@/lib/opsTwin/types';

function nowIso() {
  return new Date().toISOString();
}

function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function removeByPath(obj: Record<string, unknown>, path: string) {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') return;
    current = current[key] as Record<string, unknown>;
  }
  delete current[keys[keys.length - 1]];
}

function clone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function applyValueMutation(next: ContextRoot, patch: ContextPatch) {
  if (patch.op === 'remove') {
    removeByPath(next as unknown as Record<string, unknown>, patch.path);
    return;
  }

  if (patch.op === 'add') {
    const target = getByPath(next as unknown as Record<string, unknown>, patch.path);
    if (Array.isArray(target)) {
      target.push(patch.value);
      return;
    }
  }

  setByPath(next as unknown as Record<string, unknown>, patch.path, patch.value);
}

export function summarizePatch(patch: ContextPatch, before: unknown, after: unknown) {
  return `${patch.sourceAgent} ${patch.op} ${patch.path} (${JSON.stringify(before)} -> ${JSON.stringify(after)})`;
}

export function createInitialContext(input: ScenarioInput, runId: string, seed: number): ContextRoot {
  const createdAt = nowIso();
  return {
    meta: {
      runId,
      seed,
      createdAt,
      version: 1
    },
    studyProfile: {
      therapeuticArea: input.therapeuticArea,
      phase: input.phase,
      countries: input.countries,
      targetSampleSize: input.targetSampleSize,
      durationMonths: input.durationMonths
    },
    assumptions: {
      avg_startup_days: { value: input.assumptions.avg_startup_days, sourceAgent: 'CTM_Orchestrator', updatedAt: createdAt, version: 1 },
      screen_fail_rate: { value: input.assumptions.screen_fail_rate, sourceAgent: 'CTM_Orchestrator', updatedAt: createdAt, version: 1 },
      dropout_rate: { value: input.assumptions.dropout_rate, sourceAgent: 'CTM_Orchestrator', updatedAt: createdAt, version: 1 },
      competition_index: { value: input.assumptions.competition_index, sourceAgent: 'CTM_Orchestrator', updatedAt: createdAt, version: 1 },
      patient_pool_index: { value: input.assumptions.patient_pool_index, sourceAgent: 'CTM_Orchestrator', updatedAt: createdAt, version: 1 }
    },
    candidateSites: [],
    risks: [],
    decisions: [],
    simResults: {
      recruitmentCurve: [],
      startupDistribution: [],
      kpis: {
        predictedFPI: '-',
        predictedLPI: '-',
        sitesNeeded: 0,
        totalStartupCost: 0,
        overallRiskScore: 0
      }
    },
    eventLog: []
  };
}

export function applyPatch(context: ContextRoot, patch: ContextPatch): ContextRoot {
  const next = clone(context);
  const before = clone(getByPath(next as unknown as Record<string, unknown>, patch.path));
  applyValueMutation(next, patch);

  const after = clone(getByPath(next as unknown as Record<string, unknown>, patch.path));
  next.meta.version += 1;

  const event: ContextEvent = {
    id: `${next.meta.runId}-evt-${next.eventLog.length + 1}`,
    timestamp: nowIso(),
    sourceAgent: patch.sourceAgent,
    patch,
    before,
    after,
    summary: summarizePatch(patch, before, after)
  };

  next.eventLog.push(event);
  return next;
}

export function replayFromEventLog(context: ContextRoot): ContextRoot {
  const baselineAssumptions = Object.fromEntries(
    Object.entries(context.assumptions).filter(([, value]) => value.sourceAgent === 'CTM_Orchestrator')
  );

  const base: ContextRoot = {
    ...clone(context),
    meta: { ...context.meta, version: 1 },
    assumptions: Object.keys(baselineAssumptions).length > 0 ? baselineAssumptions : clone(context.assumptions),
    candidateSites: [],
    risks: [],
    decisions: [],
    simResults: {
      recruitmentCurve: [],
      startupDistribution: [],
      kpis: {
        predictedFPI: '-',
        predictedLPI: '-',
        sitesNeeded: 0,
        totalStartupCost: 0,
        overallRiskScore: 0
      }
    },
    eventLog: []
  };

  const rebuilt = context.eventLog.reduce((acc, event) => {
    const next = clone(acc);
    applyValueMutation(next, event.patch);
    return next;
  }, base);

  return {
    ...rebuilt,
    meta: { ...rebuilt.meta, version: context.meta.version },
    eventLog: clone(context.eventLog)
  };
}

export function exportContext(context: ContextRoot) {
  const blob = new Blob([JSON.stringify(context, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ops-twin-context-${context.meta.runId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
