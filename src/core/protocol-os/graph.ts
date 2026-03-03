import { designNodeKeys } from '@/core/protocol-os/types';

export const DESIGN_GRAPH_EDGES = [
  { from: 'endpoint.primary', to: 'soa.v0' },
  { from: 'eligibility.core', to: 'assumptions.ledger' },
  { from: 'eligibility.core', to: 'soa.v0' },
  { from: 'assumptions.ledger', to: 'endpoint.primary' }
];

export function buildInitialGraphNodes() {
  return designNodeKeys.map((key) => ({ key, type: key, status: 'draft' }));
}
