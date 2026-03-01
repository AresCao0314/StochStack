import { findAgentRecord } from '@/lib/a2a/registry';
import { sendEnvelopeHttp } from '@/lib/a2a/transport/http';
import type { A2AEnvelope, RoutedAgentResult } from '@/lib/a2a/types';
import { getIntentByAgent, getRuntimeStepByTarget } from '@/lib/opsTwin/agentRuntime';
import { createRng, hashToSeed } from '@/lib/opsTwin/sim/seeded';
import type { AgentName, ContextRoot } from '@/lib/opsTwin/types';

export async function routeAgentExecution(params: {
  target: AgentName;
  context: ContextRoot;
  baseSeed: number;
  stepId: number;
  runRemote: boolean;
}): Promise<RoutedAgentResult> {
  const { target, context, baseSeed, stepId, runRemote } = params;
  const record = findAgentRecord(target);
  const step = getRuntimeStepByTarget(target);

  if (!step) {
    return {
      result: { messages: [], patches: [] },
      transport: 'local',
      latencyMs: 0,
      deliveryStatus: 'failed'
    };
  }

  const stepSeed = hashToSeed(`${baseSeed}:${stepId}:${target}:${context.meta.version}`);

  const useRemote = Boolean(runRemote && record && record.active && record.mode === 'remote' && record.baseUrl.startsWith('/'));

  if (!useRemote) {
    const started = performance.now();
    const result = step.run(context, createRng(stepSeed));
    return {
      result,
      transport: 'local',
      latencyMs: Math.round(performance.now() - started),
      deliveryStatus: 'ok',
      endpoint: record?.baseUrl
    };
  }

  const envelope: A2AEnvelope = {
    messageId: `a2a-${context.meta.runId}-${stepId}-${Date.now()}`,
    traceId: `${context.meta.runId}-trace-${stepId}`,
    fromAgent: 'CTM_Orchestrator',
    toAgent: target,
    intent: getIntentByAgent(target),
    payload: {
      context,
      seed: stepSeed,
      stepId
    },
    contextRef: {
      runId: context.meta.runId,
      version: context.meta.version
    },
    timestamp: new Date().toISOString()
  };

  const endpoint = record?.baseUrl || '/api/a2a/inbox';
  const response = await sendEnvelopeHttp(endpoint, envelope);

  if (response.ok && response.result) {
    return {
      result: response.result,
      transport: 'remote',
      latencyMs: response.runtimeMs,
      endpoint,
      deliveryStatus: 'ok'
    };
  }

  const fallback = step.run(context, createRng(stepSeed));
  return {
    result: fallback,
    transport: 'local',
    latencyMs: response.runtimeMs,
    endpoint,
    deliveryStatus: 'retry'
  };
}
