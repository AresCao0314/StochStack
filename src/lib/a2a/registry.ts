import registryData from '@/content/a2a/registry.json';
import type { AgentName } from '@/lib/opsTwin/types';
import type { AgentRegistryRecord } from '@/lib/a2a/types';

export function getAgentRegistry() {
  return registryData as AgentRegistryRecord[];
}

export function findAgentRecord(agentId: AgentName) {
  return getAgentRegistry().find((item) => item.agentId === agentId);
}

export function getActiveRemoteAgents() {
  return getAgentRegistry().filter((item) => item.active && item.mode === 'remote');
}
