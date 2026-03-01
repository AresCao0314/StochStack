import { deriveKpis } from '@/lib/opsTwin/sim/recruitment';
import type { AgentRunResult, ContextRoot } from '@/lib/opsTwin/types';

export function runOrchestratorFinalize(context: ContextRoot): AgentRunResult {
  const startupDays = context.candidateSites.map((s) => s.startup_completion_day || s.startup_days_p50);
  const kpis = deriveKpis({
    recruitmentCurve: context.simResults.recruitmentCurve,
    startupDays: startupDays.length ? startupDays : [75],
    targetSampleSize: context.studyProfile.targetSampleSize,
    sites: context.candidateSites,
    risks: context.risks
  });

  const decision = {
    timestamp: new Date().toISOString(),
    decision: 'Proceed with mixed-speed country strategy and risk-gated site activation.',
    rationale:
      'Balanced FPI acceleration and enrollment stability while controlling critical-path startup risk.',
    tradeoff: 'Slightly higher startup cost for lower timeline slippage probability.'
  };

  return {
    messages: [
      {
        agent: 'CTM_Orchestrator',
        role: 'Ops Twin Orchestrator',
        text: 'Merged agent outputs, resolved assumption conflicts, and finalized operational recommendation package.',
        attachments: [
          {
            type: 'Timeline Update',
            data: {
              predictedFPI: kpis.predictedFPI,
              predictedLPI: kpis.predictedLPI,
              overallRiskScore: kpis.overallRiskScore
            }
          }
        ]
      }
    ],
    patches: [
      {
        type: 'DECISION_APPEND',
        path: 'decisions',
        op: 'add',
        value: decision,
        sourceAgent: 'CTM_Orchestrator',
        rationale: 'Finalize tradeoff-aware execution decision for this run.'
      },
      {
        type: 'KPI_REFRESH',
        path: 'simResults.kpis',
        op: 'replace',
        value: kpis,
        sourceAgent: 'CTM_Orchestrator',
        rationale: 'Compute summary KPIs from startup, recruitment, site and risk outputs.'
      }
    ]
  };
}
