import { z } from 'zod';

export const impactLevelSchema = z.enum(['Low', 'Med', 'High']);
export type ImpactLevel = z.infer<typeof impactLevelSchema>;

export const citationSchema = z.object({
  snippetId: z.string(),
  quote: z.string(),
  note: z.string().default('')
});

export const proposalContractSchema = z.object({
  proposalId: z.string(),
  nodeKey: z.enum(['endpoint.primary', 'eligibility.core', 'assumptions.ledger', 'soa.v0']),
  optionId: z.string(),
  optionLabel: z.string(),
  content: z.any(),
  rationale: z.string(),
  citations: z.array(citationSchema).default([]),
  impacts: z.object({
    recruitment: impactLevelSchema,
    sampleSize: impactLevelSchema,
    timeline: impactLevelSchema,
    burden: impactLevelSchema,
    regulatory: impactLevelSchema
  }),
  openQuestions: z.array(z.string()).default([]),
  confidence: z.enum(['Low', 'Med', 'High'])
});

export type ProposalContract = z.infer<typeof proposalContractSchema>;

export const policyRuleSchema = z.object({
  id: z.string(),
  type: z.enum(['hard', 'soft']),
  targetNodeType: z.string(),
  condition: z.object({
    field: z.string(),
    op: z.enum(['eq', 'neq', 'gte', 'lte', 'contains', 'truthy', 'falsy']),
    value: z.any().optional()
  }),
  message: z.string(),
  weight: z.number().default(1)
});

export const policyProfileSchema = z.object({
  rules: z.array(policyRuleSchema)
});

export type PolicyProfileJson = z.infer<typeof policyProfileSchema>;

export const designNodeKeys = [
  'endpoint.primary',
  'eligibility.core',
  'assumptions.ledger',
  'soa.v0'
] as const;

export type DesignNodeKey = (typeof designNodeKeys)[number];

export type PlanId = 'A' | 'B';

export type PlanSet = {
  plans: Array<{
    planId: PlanId;
    nodes: Record<DesignNodeKey, ProposalContract>;
    scoreBreakdown: {
      total: number;
      hardPass: boolean;
      byRole: Array<{ role: string; score: number; notes: string[] }>;
    };
    conflicts: Array<{ severity: 'high' | 'medium' | 'low'; message: string; nodeKey?: string }>;
    highlights: string[];
    invalid: boolean;
  }>;
};

export type SkillContext = {
  projectId: string;
  planId: PlanId;
  brief: Record<string, unknown>;
  evidence: Array<{
    id: string;
    title: string;
    text: string;
    sourceType: string;
    confidence: number;
  }>;
  upstream?: Partial<Record<DesignNodeKey, ProposalContract>>;
};

export const orchestrateInputSchema = z.object({
  projectId: z.string(),
  graphVersion: z.number().optional(),
  runMode: z.enum(['plan_generation', 'update_after_edit']).default('plan_generation')
});

export type OrchestrateInput = z.infer<typeof orchestrateInputSchema>;
