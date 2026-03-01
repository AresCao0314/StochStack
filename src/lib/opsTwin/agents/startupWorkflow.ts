import { startupDistributionByCountry } from '@/lib/opsTwin/sim/sites';
import type { AgentRunResult, ContextRoot } from '@/lib/opsTwin/types';

export function runStartupWorkflow(context: ContextRoot): AgentRunResult {
  const startupDistribution = startupDistributionByCountry(context.candidateSites);
  const criticalPathRisk = Number(
    (context.candidateSites.reduce((sum, s) => sum + s.startup_risk, 0) / Math.max(1, context.candidateSites.length)).toFixed(3)
  );

  return {
    messages: [
      {
        agent: 'StartUp_Workflow_Agent',
        role: 'Start-up Process Planner',
        text: `Built startup task network. Critical-path risk estimated at ${(criticalPathRisk * 100).toFixed(0)}%. Recommend parallel ethics package prep for top countries.`,
        attachments: [
          {
            type: 'Timeline Update',
            data: {
              critical_path_risk: criticalPathRisk,
              countries: startupDistribution.length
            }
          }
        ]
      }
    ],
    patches: [
      {
        type: 'STARTUP_DISTRIBUTION',
        path: 'simResults.startupDistribution',
        op: 'replace',
        value: startupDistribution,
        sourceAgent: 'StartUp_Workflow_Agent',
        rationale: 'Country startup completion distribution from candidate site set.'
      },
      {
        type: 'ASSUMPTION_UPDATE',
        path: 'assumptions.critical_path_risk',
        op: 'replace',
        value: {
          value: criticalPathRisk,
          sourceAgent: 'StartUp_Workflow_Agent',
          updatedAt: new Date().toISOString(),
          version: 1
        },
        sourceAgent: 'StartUp_Workflow_Agent',
        rationale: 'Critical path risk propagated for risk and KPI scoring.'
      }
    ]
  };
}
