import { z } from 'zod';
import { ProposalContract, proposalContractSchema } from '@/core/protocol-os/types';
import { Skill, SkillRunInput } from '@/core/protocol-os/skills/types';
import { defaultImpacts, pickCitation, rationale } from '@/core/protocol-os/skills/helpers';

const inputSchema = z.object({
  nodeKey: z.literal('assumptions.ledger'),
  optionId: z.string(),
  optionLabel: z.string()
});

export class AssumptionLedgerBuilder implements Skill {
  name = 'AssumptionLedgerBuilder';
  inputSchema = inputSchema;
  outputSchema = proposalContractSchema;

  async run(input: SkillRunInput, context: any): Promise<ProposalContract> {
    const parsed = inputSchema.parse(input);
    const conservative = context.planId === 'A';

    const content = conservative
      ? {
          effectSize: 0.22,
          eventRate: 0.45,
          dropoutRate: 0.12,
          power: 0.82,
          rationaleTag: 'historical benchmark'
        }
      : {
          effectSize: 0.32,
          eventRate: 0.52,
          dropoutRate: 0.18,
          power: 0.8,
          rationaleTag: 'optimistic acceleration'
        };

    const output: ProposalContract = {
      proposalId: `${context.planId}-${parsed.nodeKey}-${parsed.optionId}`,
      nodeKey: parsed.nodeKey,
      optionId: parsed.optionId,
      optionLabel: parsed.optionLabel,
      content,
      rationale: await rationale(this.name, context.planId, 'Statistical assumption ledger constructed.'),
      citations: pickCitation(context),
      impacts: defaultImpacts(conservative ? 'conservative' : 'aggressive'),
      openQuestions: ['Confirm event-rate source and portability to target regions.'],
      confidence: conservative ? 'High' : 'Med'
    };

    return this.outputSchema.parse(output);
  }
}
