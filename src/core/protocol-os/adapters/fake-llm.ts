export type FakeLLMInput = {
  skillName: string;
  planId: 'A' | 'B';
  promptHint: string;
};

export async function completeWithFakeLLM(input: FakeLLMInput): Promise<string> {
  const style = input.planId === 'A' ? 'conservative' : 'aggressive';
  return `[FakeLLM:${input.skillName}:${style}] ${input.promptHint}`;
}
