import { proposalContractSchema, ProposalContract, SkillContext } from '@/core/protocol-os/types';
import { Skill } from '@/core/protocol-os/skills/types';
import { EndpointCandidateGenerator } from '@/core/protocol-os/skills/endpoint-candidate-generator';
import { EligibilityDraftGenerator } from '@/core/protocol-os/skills/eligibility-draft-generator';
import { AssumptionLedgerBuilder } from '@/core/protocol-os/skills/assumption-ledger-builder';
import { SoABuilder } from '@/core/protocol-os/skills/soa-builder';
import { ConflictDetector } from '@/core/protocol-os/skills/conflict-detector';
import { TraceabilityWriter } from '@/core/protocol-os/skills/traceability-writer';

export const skillSwarm: Skill[] = [
  new EndpointCandidateGenerator(),
  new EligibilityDraftGenerator(),
  new AssumptionLedgerBuilder(),
  new SoABuilder(),
  new ConflictDetector(),
  new TraceabilityWriter()
];

const skillMap = new Map(skillSwarm.map((skill) => [skill.name, skill]));

export async function runSkill(
  skillName: string,
  input: { nodeKey: ProposalContract['nodeKey']; optionId: string; optionLabel: string },
  context: SkillContext
): Promise<ProposalContract> {
  const skill = skillMap.get(skillName);
  if (!skill) {
    throw new Error(`Skill not found: ${skillName}`);
  }

  const parsedInput = skill.inputSchema.parse(input) as {
    nodeKey: ProposalContract['nodeKey'];
    optionId: string;
    optionLabel: string;
  };
  const rawOutput = await skill.run(parsedInput, context);

  const contractChecked = proposalContractSchema.safeParse(rawOutput);
  if (!contractChecked.success) {
    throw new Error(`Skill contract rejected: ${skillName} ${contractChecked.error.message}`);
  }

  return contractChecked.data;
}
