import { z } from 'zod';
import { ProposalContract, proposalContractSchema } from '@/core/protocol-os/types';
import { Skill, SkillRunInput } from '@/core/protocol-os/skills/types';
import { defaultImpacts, pickCitation, rationale } from '@/core/protocol-os/skills/helpers';

const inputSchema = z.object({
  nodeKey: z.literal('soa.v0'),
  optionId: z.string(),
  optionLabel: z.string()
});

export class SoABuilder implements Skill {
  name = 'SoABuilder';
  inputSchema = inputSchema;
  outputSchema = proposalContractSchema;

  async run(input: SkillRunInput, context: any): Promise<ProposalContract> {
    const parsed = inputSchema.parse(input);
    const conservative = context.planId === 'A';
    const endpointName = (context.upstream?.['endpoint.primary']?.content as any)?.name ?? 'Endpoint TBD';

    const visits = conservative
      ? [
          { visit: 'Screening', week: -2, procedures: ['Consent', 'Labs', 'Imaging baseline'] },
          { visit: 'Cycle 1 Day 1', week: 0, procedures: ['Randomization', 'Dosing'] },
          { visit: 'Week 12', week: 12, procedures: ['Tumor assessment', 'Safety labs'] },
          { visit: 'Week 24', week: 24, procedures: ['Primary endpoint assessment'] }
        ]
      : [
          { visit: 'Screening', week: -1, procedures: ['Consent', 'Fast baseline panel'] },
          { visit: 'Week 4', week: 4, procedures: ['Biomarker panel', 'Safety check'] },
          { visit: 'Week 8', week: 8, procedures: ['Imaging', 'QoL'] },
          { visit: 'Week 24', week: 24, procedures: ['Primary endpoint assessment', 'Extended labs'] }
        ];

    const output: ProposalContract = {
      proposalId: `${context.planId}-${parsed.nodeKey}-${parsed.optionId}`,
      nodeKey: parsed.nodeKey,
      optionId: parsed.optionId,
      optionLabel: parsed.optionLabel,
      content: {
        endpointLinked: endpointName,
        visits,
        burdenLevel: conservative ? 'Medium' : 'High'
      },
      rationale: await rationale(this.name, context.planId, 'SoA matrix assembled using endpoint and eligibility assumptions.'),
      citations: pickCitation(context),
      impacts: {
        ...defaultImpacts(conservative ? 'conservative' : 'aggressive'),
        burden: conservative ? 'Med' : 'High'
      },
      openQuestions: ['Check site burden threshold against country operations profile.'],
      confidence: conservative ? 'High' : 'Med'
    };

    return this.outputSchema.parse(output);
  }
}
