import { generateRecruitmentCurve } from '@/lib/opsTwin/sim/recruitment';
import type { AgentRunResult, ContextRoot } from '@/lib/opsTwin/types';

export function runRecruitmentDynamics(context: ContextRoot): AgentRunResult {
  const screenFailRate = Number(context.assumptions.screen_fail_rate?.value || 0.35);
  const dropoutRate = Number(context.assumptions.dropout_rate?.value || 0.18);
  const competitionIndex = Number(context.assumptions.competition_index?.value || 0.5);

  const curve = generateRecruitmentCurve({
    durationMonths: context.studyProfile.durationMonths,
    targetSampleSize: context.studyProfile.targetSampleSize,
    sites: context.candidateSites,
    screenFailRate,
    dropoutRate,
    competitionIndex
  });

  return {
    messages: [
      {
        agent: 'Recruitment_Dynamics_Agent',
        role: 'Enrollment Simulation Modeler',
        text: `Projected cumulative enrollment across ${curve.length} months. Early slope is sensitive to screen-fail and startup clustering in first quartile.`,
        attachments: [
          {
            type: 'Timeline Update',
            data: {
              month6: curve[Math.min(5, curve.length - 1)]?.cumulativeEnrollment || 0,
              month12: curve[Math.min(11, curve.length - 1)]?.cumulativeEnrollment || 0
            }
          }
        ]
      }
    ],
    patches: [
      {
        type: 'RECRUITMENT_CURVE',
        path: 'simResults.recruitmentCurve',
        op: 'replace',
        value: curve,
        sourceAgent: 'Recruitment_Dynamics_Agent',
        rationale: 'Logistic-like enrollment curve adjusted by screen-fail, dropout, competition.'
      }
    ]
  };
}
