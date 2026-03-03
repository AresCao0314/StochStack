import { ZodTypeAny } from 'zod';
import { ProposalContract, SkillContext } from '@/core/protocol-os/types';

export type SkillRunInput = {
  nodeKey: ProposalContract['nodeKey'];
  optionId: string;
  optionLabel: string;
};

export interface Skill {
  name: string;
  inputSchema: ZodTypeAny;
  outputSchema: ZodTypeAny;
  run(input: SkillRunInput, context: SkillContext): Promise<ProposalContract>;
}
