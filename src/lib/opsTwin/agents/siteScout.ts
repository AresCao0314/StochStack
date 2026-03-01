import { generateCandidateSites } from '@/lib/opsTwin/sim/sites';
import type { AgentRunResult, ContextRoot, Rng } from '@/lib/opsTwin/types';

export function runSiteScout(context: ContextRoot, rng: Rng): AgentRunResult {
  const avg = Number(context.assumptions.avg_startup_days?.value || 75);
  const competition = Number(context.assumptions.competition_index?.value || 0.5);
  const pool = Number(context.assumptions.patient_pool_index?.value || 0.6);

  const sites = generateCandidateSites({
    countries: context.studyProfile.countries,
    avgStartupDays: avg,
    competitionIndex: competition,
    patientPoolIndex: pool,
    therapeuticArea: context.studyProfile.therapeuticArea,
    rng
  });

  return {
    messages: [
      {
        agent: 'Site_Scout_Agent',
        role: 'Site Intelligence Scout',
        text: `Generated ${sites.length} candidate sites. Top decile sites improve startup speed but increase country concentration risk.`,
        attachments: [
          {
            type: 'Site Candidate List',
            data: {
              total: sites.length,
              topSites: sites.slice(0, 3).map((s) => s.site_name)
            }
          }
        ]
      }
    ],
    patches: [
      {
        type: 'SITE_LIST_REFRESH',
        path: 'candidateSites',
        op: 'replace',
        value: sites,
        sourceAgent: 'Site_Scout_Agent',
        rationale: 'Site generation using startup/recruitment/risk weighted scoring.'
      }
    ]
  };
}
