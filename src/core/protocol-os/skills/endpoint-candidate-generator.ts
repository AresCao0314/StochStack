import { z } from 'zod';
import { ProposalContract, proposalContractSchema } from '@/core/protocol-os/types';
import { Skill, SkillRunInput } from '@/core/protocol-os/skills/types';
import { defaultImpacts, pickCitation, rationale } from '@/core/protocol-os/skills/helpers';

const inputSchema = z.object({
  nodeKey: z.literal('endpoint.primary'),
  optionId: z.string(),
  optionLabel: z.string()
});

export class EndpointCandidateGenerator implements Skill {
  name = 'EndpointCandidateGenerator';
  inputSchema = inputSchema;
  outputSchema = proposalContractSchema;

  async run(input: SkillRunInput, context: any): Promise<ProposalContract> {
    const parsed = inputSchema.parse(input);
    const conservative = context.planId === 'A';
    const endpoint = conservative
      ? {
          name: 'Progression-Free Survival at 12 months',
          type: 'time-to-event',
          estimand: 'treatment policy',
          clinicalMeaning: 'Delay disease progression within one-year window.'
        }
      : {
          name: 'Molecular Response Rate at Week 24',
          type: 'surrogate',
          estimand: 'hypothetical',
          clinicalMeaning: 'Early biological signal for rapid decision-making.'
        };

    const output: ProposalContract = {
      proposalId: `${context.planId}-${parsed.nodeKey}-${parsed.optionId}`,
      nodeKey: parsed.nodeKey,
      optionId: parsed.optionId,
      optionLabel: parsed.optionLabel,
      content: endpoint,
      rationale: await rationale(this.name, context.planId, `Primary endpoint set as ${endpoint.name}`),
      citations: pickCitation(context),
      impacts: defaultImpacts(conservative ? 'conservative' : 'aggressive'),
      openQuestions: conservative
        ? ['Need confirmation of event-rate benchmark by region.']
        : ['Surrogate acceptance may vary by authority; confirm pathway.'],
      confidence: conservative ? 'High' : 'Med'
    };

    return this.outputSchema.parse(output);
  }
}
