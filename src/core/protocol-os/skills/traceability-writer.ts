import { z } from 'zod';
import { ProposalContract, proposalContractSchema } from '@/core/protocol-os/types';
import { Skill, SkillRunInput } from '@/core/protocol-os/skills/types';
import { rationale } from '@/core/protocol-os/skills/helpers';

const inputSchema = z.object({
  nodeKey: z.literal('assumptions.ledger'),
  optionId: z.string(),
  optionLabel: z.string()
});

export class TraceabilityWriter implements Skill {
  name = 'TraceabilityWriter';
  inputSchema = inputSchema;
  outputSchema = proposalContractSchema;

  async run(input: SkillRunInput, context: any): Promise<ProposalContract> {
    const parsed = inputSchema.parse(input);

    const nodeSummaries = Object.entries(context.upstream ?? {}).map(([key, value]) => {
      const item = (value ?? {}) as { optionId?: string; rationale?: string };
      return {
      nodeKey: key,
      optionId: item.optionId,
      rationale: item.rationale
      };
    });

    const output: ProposalContract = {
      proposalId: `${context.planId}-${this.name}`,
      nodeKey: parsed.nodeKey,
      optionId: parsed.optionId,
      optionLabel: parsed.optionLabel,
      content: { nodeSummaries },
      rationale: await rationale(this.name, context.planId, 'Traceability summary prepared for export package.'),
      citations: [],
      impacts: {
        recruitment: 'Low',
        sampleSize: 'Low',
        timeline: 'Low',
        burden: 'Low',
        regulatory: 'Low'
      },
      openQuestions: [],
      confidence: 'High'
    };

    return this.outputSchema.parse(output);
  }
}
