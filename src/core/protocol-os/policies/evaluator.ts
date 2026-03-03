import { ProposalContract } from '@/core/protocol-os/types';

type Rule = {
  id: string;
  type: 'hard' | 'soft';
  targetNodeType: string;
  condition: { field: string; op: 'eq' | 'neq' | 'gte' | 'lte' | 'contains' | 'truthy' | 'falsy'; value?: unknown };
  message: string;
  weight: number;
};

type Profile = {
  role: string;
  weight: number;
  policyJson: { rules: Rule[] };
};

type PolicyEvalResult = {
  hardPass: boolean;
  total: number;
  byRole: Array<{ role: string; score: number; notes: string[] }>;
  failures: string[];
};

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function passCondition(value: unknown, op: Rule['condition']['op'], expected?: unknown): boolean {
  if (op === 'truthy') return Boolean(value);
  if (op === 'falsy') return !value;
  if (op === 'eq') return value === expected;
  if (op === 'neq') return value !== expected;
  if (op === 'gte') return Number(value) >= Number(expected);
  if (op === 'lte') return Number(value) <= Number(expected);
  if (op === 'contains') return String(value ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
  return false;
}

export function evaluatePolicies(
  profiles: Profile[],
  planNodes: Record<string, ProposalContract>
): PolicyEvalResult {
  const byRole: PolicyEvalResult['byRole'] = [];
  const failures: string[] = [];
  let hardPass = true;

  for (const profile of profiles) {
    let score = 100;
    const notes: string[] = [];

    for (const rule of profile.policyJson.rules) {
      const node = planNodes[rule.targetNodeType as keyof typeof planNodes];
      if (!node) continue;
      const actual = getPath(node, rule.condition.field);
      const ok = passCondition(actual, rule.condition.op, rule.condition.value);

      if (rule.type === 'hard' && !ok) {
        hardPass = false;
        failures.push(`${profile.role}: ${rule.message}`);
        notes.push(`Hard fail: ${rule.message}`);
      }

      if (rule.type === 'soft' && !ok) {
        score -= rule.weight;
        notes.push(`Soft penalty: ${rule.message}`);
      }
    }

    const weighted = Math.max(0, score) * profile.weight;
    byRole.push({ role: profile.role, score: Number(weighted.toFixed(1)), notes });
  }

  const total = byRole.length > 0 ? byRole.reduce((sum, item) => sum + item.score, 0) / byRole.length : 0;

  return {
    hardPass,
    total: Number(total.toFixed(1)),
    byRole,
    failures
  };
}
