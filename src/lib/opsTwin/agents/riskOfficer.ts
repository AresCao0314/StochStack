import type { AgentRunResult, ContextRoot } from '@/lib/opsTwin/types';

export function runRiskOfficer(context: ContextRoot): AgentRunResult {
  const criticalPathRisk = Number(context.assumptions.critical_path_risk?.value || 0.4);
  const competition = Number(context.assumptions.competition_index?.value || 0.5);

  const risks = [
    {
      risk_id: 'R-01',
      title: 'Country startup sequence bottleneck',
      likelihood: Number(Math.min(0.95, criticalPathRisk + 0.1).toFixed(2)),
      impact: 0.78,
      mitigation: 'Parallelize startup packets and pre-clear vendor handoffs.',
      owner_agent: 'StartUp_Workflow_Agent' as const
    },
    {
      risk_id: 'R-02',
      title: 'Enrollment drag from competition pressure',
      likelihood: Number(Math.min(0.95, competition + 0.12).toFixed(2)),
      impact: 0.72,
      mitigation: 'Reallocate support to top conversion sites and tighten pre-screen scripts.',
      owner_agent: 'Recruitment_Dynamics_Agent' as const
    },
    {
      risk_id: 'R-03',
      title: 'Site quality variance in mid-score tier',
      likelihood: 0.46,
      impact: 0.58,
      mitigation: 'Escalate monitoring cadence for sites below score threshold 0.62.',
      owner_agent: 'Site_Scout_Agent' as const
    }
  ];

  return {
    messages: [
      {
        agent: 'Risk_Officer_Agent',
        role: 'Risk & Governance Officer',
        text: `Compiled risk register with ${risks.length} active items. Highest concern is startup sequence dependency across country clusters.`,
        attachments: [
          {
            type: 'RiskItem',
            data: risks[0]
          }
        ]
      }
    ],
    patches: [
      {
        type: 'RISK_REGISTER_REFRESH',
        path: 'risks',
        op: 'replace',
        value: risks,
        sourceAgent: 'Risk_Officer_Agent',
        rationale: 'Risk register generated from startup, recruitment, and site variability signals.'
      }
    ]
  };
}
