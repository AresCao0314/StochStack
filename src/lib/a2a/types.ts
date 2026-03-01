import type { AgentName, AgentRunResult, ContextRoot } from '@/lib/opsTwin/types';

export type A2AIntent =
  | 'country.prior'
  | 'site.scout'
  | 'startup.workflow'
  | 'recruitment.dynamics'
  | 'risk.register'
  | 'orchestrator.finalize';

export type A2AEnvelope = {
  messageId: string;
  traceId: string;
  fromAgent: AgentName;
  toAgent: AgentName;
  intent: A2AIntent;
  payload: {
    context: ContextRoot;
    seed: number;
    stepId: number;
  };
  contextRef: {
    runId: string;
    version: number;
  };
  timestamp: string;
  signature?: string;
};

export type A2AResponse = {
  ok: boolean;
  traceId: string;
  responder: AgentName;
  runtimeMs: number;
  contextVersion: number;
  result?: AgentRunResult;
  error?: string;
};

export type AgentRegistryRecord = {
  agentId: AgentName;
  name: string;
  baseUrl: string;
  authMode: 'none' | 'hmac';
  active: boolean;
  mode: 'local' | 'remote';
  capabilities: string[];
  version: string;
};

export type RoutedAgentResult = {
  result: AgentRunResult;
  transport: 'local' | 'remote';
  latencyMs: number;
  endpoint?: string;
  deliveryStatus: 'ok' | 'retry' | 'failed';
};
