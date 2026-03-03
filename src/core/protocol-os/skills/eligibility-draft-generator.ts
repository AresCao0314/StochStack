import { z } from 'zod';
import { ProposalContract, proposalContractSchema } from '@/core/protocol-os/types';
import { Skill, SkillRunInput } from '@/core/protocol-os/skills/types';
import { defaultImpacts, pickCitation, rationale } from '@/core/protocol-os/skills/helpers';

const inputSchema = z.object({
  nodeKey: z.literal('eligibility.core'),
  optionId: z.string(),
  optionLabel: z.string()
});

export class EligibilityDraftGenerator implements Skill {
  name = 'EligibilityDraftGenerator';
  inputSchema = inputSchema;
  outputSchema = proposalContractSchema;

  async run(input: SkillRunInput, context: any): Promise<ProposalContract> {
    const parsed = inputSchema.parse(input);
    const conservative = context.planId === 'A';

    const content = conservative
      ? {
          inclusion: ['Age 18-75', 'ECOG 0-1', 'Confirmed diagnosis by pathology'],
          exclusion: ['Active CNS metastases', 'Uncontrolled infection'],
          strictness: 'balanced'
        }
      : {
          inclusion: ['Age 18-80', 'ECOG 0-2', 'Diagnosis by imaging or pathology'],
          exclusion: ['Acute organ failure'],
          strictness: 'broad'
        };

    const output: ProposalContract = {
      proposalId: `${context.planId}-${parsed.nodeKey}-${parsed.optionId}`,
      nodeKey: parsed.nodeKey,
      optionId: parsed.optionId,
      optionLabel: parsed.optionLabel,
      content,
      rationale: await rationale(this.name, context.planId, `Eligibility drafted with ${content.strictness} strictness.`),
      citations: pickCitation(context),
      impacts: {
        ...defaultImpacts(conservative ? 'conservative' : 'aggressive'),
        recruitment: conservative ? 'Med' : 'Low'
      },
      openQuestions: ['Need country-level feasibility validation for selected criteria.'],
      confidence: conservative ? 'High' : 'Med'
    };

    return this.outputSchema.parse(output);
  }
}
