import type { ContextPatch, ContextRoot, DecisionItem, ForecastDiagnostics } from '@/lib/opsTwin/types';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 3) {
  const base = 10 ** digits;
  return Math.round(value * base) / base;
}

function interpolation(
  points: Array<{ month: number; cumulativeEnrollment: number }>,
  month: number
): number {
  if (points.length === 0) return 0;

  const sorted = [...points].sort((a, b) => a.month - b.month);
  const exact = sorted.find((p) => p.month === month);
  if (exact) return exact.cumulativeEnrollment;

  const left = [...sorted].reverse().find((p) => p.month < month);
  const right = sorted.find((p) => p.month > month);

  if (!left && right) return right.cumulativeEnrollment;
  if (left && !right) return left.cumulativeEnrollment;
  if (!left || !right) return sorted[sorted.length - 1].cumulativeEnrollment;

  const ratio = (month - left.month) / Math.max(1, right.month - left.month);
  return left.cumulativeEnrollment + ratio * (right.cumulativeEnrollment - left.cumulativeEnrollment);
}

function nextAssumptionValue(
  context: ContextRoot,
  key: string,
  nextValue: number
): { value: number; sourceAgent: 'CTM_Orchestrator'; updatedAt: string; version: number } {
  const existing = context.assumptions[key];
  return {
    value: nextValue,
    sourceAgent: 'CTM_Orchestrator',
    updatedAt: new Date().toISOString(),
    version: (existing?.version || 0) + 1
  };
}

export function buildCalibrationPatches(params: {
  context: ContextRoot;
  month: number;
  actualCumulativeEnrollment: number;
  startupAvgDaysObserved?: number;
}): {
  patches: ContextPatch[];
  decision: DecisionItem;
  diagnostics: ForecastDiagnostics;
} {
  const { context, month, actualCumulativeEnrollment, startupAvgDaysObserved } = params;

  const predicted = interpolation(context.simResults.recruitmentCurve, month);
  const signedPctError = (actualCumulativeEnrollment - predicted) / Math.max(1, predicted);
  const absPctError = Math.abs(signedPctError);
  const startupErrorDays =
    typeof startupAvgDaysObserved === 'number'
      ? startupAvgDaysObserved - Number(context.assumptions.avg_startup_days?.value || 75)
      : undefined;

  const event = {
    month,
    predictedCumulativeEnrollment: round(predicted, 1),
    actualCumulativeEnrollment,
    absPctError: round(absPctError, 4),
    signedPctError: round(signedPctError, 4),
    startupErrorDays: typeof startupErrorDays === 'number' ? round(startupErrorDays, 1) : undefined,
    recordedAt: new Date().toISOString()
  };

  const priorHistory = context.simResults.forecastDiagnostics.history || [];
  const history = [...priorHistory, event].slice(-24);
  const points = history.length;
  const mape = history.reduce((sum, item) => sum + item.absPctError, 0) / Math.max(points, 1);
  const signedBias = history.reduce((sum, item) => sum + item.signedPctError, 0) / Math.max(points, 1);

  const confidenceScore = clamp(
    round(0.95 - mape * 1.25 - Math.abs(signedBias) * 0.55 + Math.min(points, 12) * 0.01, 3),
    0.2,
    0.97
  );

  const enrollGap = (predicted - actualCumulativeEnrollment) / Math.max(1, predicted);
  const oldAvgStartup = Number(context.assumptions.avg_startup_days?.value || 75);
  const oldScreenFail = Number(context.assumptions.screen_fail_rate?.value || 0.35);
  const oldDropout = Number(context.assumptions.dropout_rate?.value || 0.18);
  const oldCompetition = Number(context.assumptions.competition_index?.value || 0.5);
  const oldPool = Number(context.assumptions.patient_pool_index?.value || 0.6);

  const nextAvgStartup = clamp(
    round(oldAvgStartup + (typeof startupErrorDays === 'number' ? startupErrorDays * 0.35 : enrollGap * 8), 2),
    35,
    160
  );
  const nextScreenFail = clamp(round(oldScreenFail + enrollGap * 0.08, 4), 0.05, 0.65);
  const nextDropout = clamp(round(oldDropout + enrollGap * 0.05, 4), 0.05, 0.45);
  const nextCompetition = clamp(round(oldCompetition + enrollGap * 0.06, 4), 0, 1);
  const nextPool = clamp(round(oldPool - enrollGap * 0.07, 4), 0, 1);

  const parameterShift = {
    avg_startup_days: round(nextAvgStartup - oldAvgStartup, 3),
    screen_fail_rate: round(nextScreenFail - oldScreenFail, 4),
    dropout_rate: round(nextDropout - oldDropout, 4),
    competition_index: round(nextCompetition - oldCompetition, 4),
    patient_pool_index: round(nextPool - oldPool, 4)
  };

  const diagnostics: ForecastDiagnostics = {
    confidenceScore,
    mape: round(mape, 4),
    signedBias: round(signedBias, 4),
    points,
    lastCalibratedAt: new Date().toISOString(),
    parameterShift,
    notes: [
      'Calibration updated from observed actuals. Re-run simulation to apply tuned assumptions to the full trajectory.',
      confidenceScore < 0.6 ? 'Confidence below threshold: collect more actuals or inspect site-level outliers.' : 'Confidence stable.'
    ],
    history
  };

  const decision: DecisionItem = {
    timestamp: new Date().toISOString(),
    decision: `Calibration update at month ${month}: confidence ${(confidenceScore * 100).toFixed(0)}%`,
    rationale: `Observed ${actualCumulativeEnrollment} vs predicted ${Math.round(predicted)} (MAPE ${(mape * 100).toFixed(1)}%).`,
    tradeoff: 'Auto-adjusted assumptions improve fit but require a fresh simulation run for planning.'
  };

  const patches: ContextPatch[] = [
    {
      type: 'ACTUAL_OBSERVED_APPEND',
      path: 'simResults.actuals',
      op: 'add',
      value: {
        month,
        actualCumulativeEnrollment,
        startupAvgDaysObserved,
        recordedAt: new Date().toISOString()
      },
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Track observed actual performance for forecast error monitoring.'
    },
    {
      type: 'FORECAST_DIAGNOSTICS_REFRESH',
      path: 'simResults.forecastDiagnostics',
      op: 'replace',
      value: diagnostics,
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Update confidence, bias, and calibration history from observed deltas.'
    },
    {
      type: 'ASSUMPTION_CALIBRATION',
      path: 'assumptions.avg_startup_days',
      op: 'replace',
      value: nextAssumptionValue(context, 'avg_startup_days', nextAvgStartup),
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Auto-tune startup baseline from observed startup and enrollment gap.'
    },
    {
      type: 'ASSUMPTION_CALIBRATION',
      path: 'assumptions.screen_fail_rate',
      op: 'replace',
      value: nextAssumptionValue(context, 'screen_fail_rate', nextScreenFail),
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Auto-tune screening leakage based on signed forecast error.'
    },
    {
      type: 'ASSUMPTION_CALIBRATION',
      path: 'assumptions.dropout_rate',
      op: 'replace',
      value: nextAssumptionValue(context, 'dropout_rate', nextDropout),
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Auto-tune dropout drift from observed trajectory.'
    },
    {
      type: 'ASSUMPTION_CALIBRATION',
      path: 'assumptions.competition_index',
      op: 'replace',
      value: nextAssumptionValue(context, 'competition_index', nextCompetition),
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Auto-tune competition pressure from observed under/over performance.'
    },
    {
      type: 'ASSUMPTION_CALIBRATION',
      path: 'assumptions.patient_pool_index',
      op: 'replace',
      value: nextAssumptionValue(context, 'patient_pool_index', nextPool),
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Auto-tune patient pool strength from observed trajectory.'
    },
    {
      type: 'DECISION_APPEND',
      path: 'decisions',
      op: 'add',
      value: decision,
      sourceAgent: 'CTM_Orchestrator',
      rationale: 'Persist calibration rationale for auditability.'
    }
  ];

  return {
    patches,
    decision,
    diagnostics
  };
}
