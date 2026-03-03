import { completeWithFakeLLM } from '@/core/protocol-os/adapters/fake-llm';
import { ProposalContract, SkillContext } from '@/core/protocol-os/types';

export function pickCitation(context: SkillContext) {
  const first = context.evidence[0];
  if (!first) return [];
  return [{ snippetId: first.id, quote: first.text.slice(0, 180), note: first.title }];
}

export function defaultImpacts(style: 'conservative' | 'aggressive'): ProposalContract['impacts'] {
  if (style === 'conservative') {
    return {
      recruitment: 'Med',
      sampleSize: 'Low',
      timeline: 'Med',
      burden: 'Med',
      regulatory: 'Low'
    };
  }
  return {
    recruitment: 'High',
    sampleSize: 'Med',
    timeline: 'Low',
    burden: 'High',
    regulatory: 'Med'
  };
}

export async function rationale(skillName: string, planId: 'A' | 'B', promptHint: string) {
  return completeWithFakeLLM({ skillName, planId, promptHint });
}
