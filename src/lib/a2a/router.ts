import { findAgentRecord } from '@/lib/a2a/registry';
import { backoffDelayMs, getClientA2aSecret, signA2aEnvelope } from '@/lib/a2a/security';
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
  llmReasoning: boolean;
}): Promise<RoutedAgentResult> {
  const { target, context, baseSeed, stepId, runRemote, llmReasoning } = params;
  const record = findAgentRecord(target);
  const step = getRuntimeStepByTarget(target);

  if (!step) {
    return {
      result: { messages: [], patches: [] },
      transport: 'local',
      latencyMs: 0,
      deliveryStatus: 'failed',
      attempts: 0,
      retryCount: 0,
      lastError: `Missing runtime step for ${target}`
    };
  }

  const stepSeed = hashToSeed(`${baseSeed}:${stepId}:${target}:${context.meta.version}`);

  const useRemote = Boolean(
    runRemote && record && record.active && record.mode === 'remote' && record.baseUrl.startsWith('/')
  );

  if (!useRemote) {
    const started = performance.now();
    const result = step.run(context, createRng(stepSeed));
    return {
      result,
      transport: 'local',
      latencyMs: Math.round(performance.now() - started),
      deliveryStatus: 'ok',
      endpoint: record?.baseUrl,
      attempts: 1,
      retryCount: 0
    };
  }

  const baseEnvelope: A2AEnvelope = {
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
    options: {
      llmReasoning
    },
    timestamp: new Date().toISOString()
  };

  const endpoint = record?.baseUrl || '/api/a2a/inbox';
  const retryCfg = record?.retryPolicy ?? {
    maxRetries: 0,
    baseDelayMs: 200,
    backoffFactor: 2,
    jitterMs: 80
  };

  let attempt = 0;
  let totalRuntime = 0;
  let lastError = '';

  while (attempt <= retryCfg.maxRetries) {
    attempt += 1;

    const envelope = {
      ...baseEnvelope,
      messageId: `${baseEnvelope.messageId}-a${attempt}`,
      timestamp: new Date().toISOString()
    };

    const signature = await signA2aEnvelope(envelope, getClientA2aSecret());
    const response = await sendEnvelopeHttp(endpoint, { ...envelope, signature });
    totalRuntime += response.runtimeMs;

    if (response.ok && response.result) {
      return {
        result: response.result,
        transport: 'remote',
        latencyMs: totalRuntime,
        endpoint,
        deliveryStatus: attempt > 1 ? 'retry' : 'ok',
        attempts: attempt,
        retryCount: Math.max(0, attempt - 1)
      };
    }

    lastError = response.error || 'Unknown remote execution error';

    if (attempt <= retryCfg.maxRetries) {
      const delay = backoffDelayMs(attempt, retryCfg);
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }

  const fallback = step.run(context, createRng(stepSeed));
  return {
    result: fallback,
    transport: 'local',
    latencyMs: totalRuntime,
    endpoint,
    deliveryStatus: 'retry',
    attempts: attempt,
    retryCount: Math.max(0, attempt - 1),
    lastError
  };
}
