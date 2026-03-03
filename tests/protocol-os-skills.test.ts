import { describe, expect, it } from 'vitest';
import { EndpointCandidateGenerator } from '@/core/protocol-os/skills/endpoint-candidate-generator';
import { EligibilityDraftGenerator } from '@/core/protocol-os/skills/eligibility-draft-generator';
import { AssumptionLedgerBuilder } from '@/core/protocol-os/skills/assumption-ledger-builder';
import { SoABuilder } from '@/core/protocol-os/skills/soa-builder';
import { ConflictDetector } from '@/core/protocol-os/skills/conflict-detector';
import { TraceabilityWriter } from '@/core/protocol-os/skills/traceability-writer';

const baseContext = {
  projectId: 'p1',
  planId: 'A' as const,
  brief: {},
  evidence: [{ id: 's1', title: 'snippet', text: 'evidence text', sourceType: 'guideline', confidence: 0.9 }]
};

describe('Protocol OS skills', () => {
  it('EndpointCandidateGenerator returns valid endpoint proposal', async () => {
    const skill = new EndpointCandidateGenerator();
    const output = await skill.run({ nodeKey: 'endpoint.primary', optionId: 'A-endpoint', optionLabel: 'A endpoint' }, baseContext);
    expect(output.nodeKey).toBe('endpoint.primary');
    expect((output.content as any).name).toBeTruthy();
  });

  it('EligibilityDraftGenerator returns eligibility arrays', async () => {
    const skill = new EligibilityDraftGenerator();
    const output = await skill.run({ nodeKey: 'eligibility.core', optionId: 'A-eligibility', optionLabel: 'A eligibility' }, baseContext);
    expect(Array.isArray((output.content as any).inclusion)).toBe(true);
  });

  it('AssumptionLedgerBuilder returns power >= 0.8 for plan A', async () => {
    const skill = new AssumptionLedgerBuilder();
    const output = await skill.run({ nodeKey: 'assumptions.ledger', optionId: 'A-assumptions', optionLabel: 'A assumptions' }, baseContext);
    expect((output.content as any).power).toBeGreaterThanOrEqual(0.8);
  });

  it('SoABuilder links endpoint to SoA content', async () => {
    const skill = new SoABuilder();
    const output = await skill.run(
      { nodeKey: 'soa.v0', optionId: 'A-soa', optionLabel: 'A soa' },
      { ...baseContext, upstream: { 'endpoint.primary': { content: { name: 'PFS' } } } as any }
    );
    expect((output.content as any).endpointLinked).toBe('PFS');
  });

  it('ConflictDetector flags missing endpoint citation', async () => {
    const skill = new ConflictDetector();
    const output = await skill.run(
      { nodeKey: 'assumptions.ledger', optionId: 'A-conflicts', optionLabel: 'A conflicts' },
      {
        ...baseContext,
        upstream: {
          'endpoint.primary': { content: { name: 'x' }, citations: [] },
          'assumptions.ledger': { content: { power: 0.79 } },
          'soa.v0': { content: { visits: [] } }
        } as any
      }
    );
    expect(((output.content as any).conflicts ?? []).length).toBeGreaterThan(0);
  });

  it('TraceabilityWriter summarizes upstream nodes', async () => {
    const skill = new TraceabilityWriter();
    const output = await skill.run(
      { nodeKey: 'assumptions.ledger', optionId: 'A-trace', optionLabel: 'A trace' },
      { ...baseContext, upstream: { 'endpoint.primary': { optionId: 'x', rationale: 'y' } } as any }
    );
    expect(Array.isArray((output.content as any).nodeSummaries)).toBe(true);
  });
});
