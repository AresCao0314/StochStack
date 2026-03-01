import type { AgentRunResult, ContextRoot } from '@/lib/opsTwin/types';

const priors = {
  Germany: 0.58,
  France: 0.55,
  China: 0.66,
  US: 0.63,
  UK: 0.57
};

export function runCountryFeasibility(context: ContextRoot): AgentRunResult {
  const countryPrior = context.studyProfile.countries.reduce((acc, c) => acc + priors[c], 0) / Math.max(context.studyProfile.countries.length, 1);

  return {
    messages: [
      {
        agent: 'Country_Feasibility_Agent',
        role: 'Country Prior Analyst',
        text: `Computed cross-country feasibility prior at ${(countryPrior * 100).toFixed(0)}%. Main tension: startup bureaucracy versus patient pool momentum.`,
        attachments: [
          {
            type: 'Assumption',
            data: {
              country_feasibility_prior: Number(countryPrior.toFixed(3))
            }
          }
        ]
      }
    ],
    patches: [
      {
        type: 'ASSUMPTION_UPDATE',
        path: 'assumptions.country_feasibility_prior',
        op: 'replace',
        value: {
          value: Number(countryPrior.toFixed(3)),
          sourceAgent: 'Country_Feasibility_Agent',
          updatedAt: new Date().toISOString(),
          version: 1
        },
        sourceAgent: 'Country_Feasibility_Agent',
        rationale: 'Country mix prior for startup + recruitment balance.'
      }
    ]
  };
}
