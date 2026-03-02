import { describe, expect, it } from 'vitest';
import { evaluateFieldSet } from '@/lib/protocolWorkflow/validation';
import { computeChangesFromFields, computeImpactList } from '@/lib/protocolWorkflow/diff';

describe('protocol workflow validation', () => {
  it('flags missing required fields', () => {
    const issues = evaluateFieldSet([
      { path: 'metadata.title', value: '' },
      { path: 'soa.visits[0].window', value: 'Day 1' }
    ]);

    const errorIds = issues.filter((issue) => issue.severity === 'error').map((issue) => issue.ruleId);
    expect(errorIds).toContain('USDM-REQ-001');
    expect(errorIds).toContain('USDM-REQ-003');
  });

  it('detects visit order inconsistency', () => {
    const issues = evaluateFieldSet([
      { path: 'metadata.title', value: 'Study A' },
      { path: 'endpoint.primary', value: 'overall survival' },
      { path: 'soa.visits[0].window', value: 'Day 22' },
      { path: 'soa.visits[1].window', value: 'Day 1' }
    ]);

    expect(issues.some((issue) => issue.ruleId === 'CONSISTENCY-003')).toBe(true);
  });
});

describe('protocol workflow diff', () => {
  it('computes add/remove/modify changes', () => {
    const changes = computeChangesFromFields(
      [
        { path: 'metadata.title', value: 'A', confidence: 0.8 },
        { path: 'eligibility.inclusion[0]', value: 'Age >= 18', confidence: 0.75 },
        { path: 'soa.visits[0].window', value: 'Day 1', confidence: 0.7 }
      ],
      [
        { path: 'metadata.title', value: 'B', confidence: 0.9 },
        { path: 'soa.visits[0].window', value: 'Day 1', confidence: 0.7 },
        { path: 'endpoint.primary', value: 'OS', confidence: 0.65 }
      ]
    );

    expect(changes.some((change) => change.type === 'modify' && change.path === 'metadata.title')).toBe(true);
    expect(changes.some((change) => change.type === 'remove' && change.path === 'eligibility.inclusion[0]')).toBe(true);
    expect(changes.some((change) => change.type === 'add' && change.path === 'endpoint.primary')).toBe(true);

    const impacts = computeImpactList(changes);
    expect(impacts.length).toBe(changes.length);
    expect(impacts.some((item) => item.domain === 'Eligibility')).toBe(true);
    expect(impacts.some((item) => item.domain === 'Endpoint')).toBe(true);
  });
});
