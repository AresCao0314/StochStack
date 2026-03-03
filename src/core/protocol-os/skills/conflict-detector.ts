import { z } from 'zod';
import { ProposalContract, proposalContractSchema } from '@/core/protocol-os/types';
import { Skill, SkillRunInput } from '@/core/protocol-os/skills/types';
import { rationale } from '@/core/protocol-os/skills/helpers';

const inputSchema = z.object({
  nodeKey: z.literal('assumptions.ledger'),
  optionId: z.string(),
  optionLabel: z.string()
});

export class ConflictDetector implements Skill {
  name = 'ConflictDetector';
  inputSchema = inputSchema;
  outputSchema = proposalContractSchema;

  async run(input: SkillRunInput, context: any): Promise<ProposalContract> {
    const parsed = inputSchema.parse(input);

    const endpoint = context.upstream?.['endpoint.primary']?.content as any;
    const assumptions = context.upstream?.['assumptions.ledger']?.content as any;
    const soa = context.upstream?.['soa.v0']?.content as any;

    const conflicts: Array<{ severity: 'high' | 'medium' | 'low'; message: string }> = [];

    if (!context.upstream?.['endpoint.primary']?.citations?.length) {
      conflicts.push({ severity: 'high', message: 'Primary endpoint has no citation evidence.' });
    }
    if ((assumptions?.power ?? 0) < 0.8) {
      conflicts.push({ severity: 'high', message: 'Power below 0.8 threshold.' });
    }
    if ((soa?.visits?.length ?? 0) > 6) {
      conflicts.push({ severity: 'medium', message: 'Visit burden may exceed ClinOps threshold.' });
    }
    if (typeof endpoint?.name === 'string' && endpoint.name.toLowerCase().includes('molecular')) {
      conflicts.push({ severity: 'medium', message: 'Surrogate endpoint may require stronger regulatory justification.' });
    }

    const output: ProposalContract = {
      proposalId: `${context.planId}-${this.name}`,
      nodeKey: parsed.nodeKey,
      optionId: parsed.optionId,
      optionLabel: parsed.optionLabel,
      content: { conflicts },
      rationale: await rationale(this.name, context.planId, 'Cross-node consistency checks completed.'),
      citations: [],
      impacts: {
        recruitment: 'Low',
        sampleSize: 'Low',
        timeline: 'Low',
        burden: 'Low',
        regulatory: 'Low'
      },
      openQuestions: conflicts.map((c) => c.message),
      confidence: conflicts.length > 1 ? 'High' : 'Med'
    };

    return this.outputSchema.parse(output);
  }
}
