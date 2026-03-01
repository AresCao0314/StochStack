import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { getRuntimeStepByTarget } from '@/lib/opsTwin/agentRuntime';
import { createRng } from '@/lib/opsTwin/sim/seeded';
import { enrichAgentResultWithReasoning } from '@/lib/llm/agent-reasoner';
import { getServerA2aSecret, isTimestampFresh, verifyA2aEnvelopeSignature } from '@/lib/a2a/security';
import type { A2AEnvelope, A2AResponse } from '@/lib/a2a/types';
import type { AgentName, ContextRoot } from '@/lib/opsTwin/types';

export const dynamic = 'force-dynamic';

const envelopeSchema = z.object({
  messageId: z.string(),
  traceId: z.string(),
  fromAgent: z.enum([
    'CTM_Orchestrator',
    'Country_Feasibility_Agent',
    'Site_Scout_Agent',
    'StartUp_Workflow_Agent',
    'Recruitment_Dynamics_Agent',
    'Risk_Officer_Agent'
  ]),
  toAgent: z.enum([
    'CTM_Orchestrator',
    'Country_Feasibility_Agent',
    'Site_Scout_Agent',
    'StartUp_Workflow_Agent',
    'Recruitment_Dynamics_Agent',
    'Risk_Officer_Agent'
  ]),
  intent: z.string(),
  payload: z.object({
    context: z.custom<ContextRoot>(),
    seed: z.number(),
    stepId: z.number()
  }),
  contextRef: z.object({
    runId: z.string(),
    version: z.number()
  }),
  options: z
    .object({
      llmReasoning: z.boolean().optional()
    })
    .optional(),
  timestamp: z.string(),
  signature: z.string().optional()
});

type CacheItem = {
  response: A2AResponse;
  expiresAt: number;
};

const idempotencyCache = new Map<string, CacheItem>();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

function clearExpiredCache() {
  const now = Date.now();
  for (const [key, item] of idempotencyCache.entries()) {
    if (item.expiresAt <= now) {
      idempotencyCache.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  const started = Date.now();

  try {
    clearExpiredCache();
    const raw = await request.json();
    const envelope = envelopeSchema.parse(raw) as A2AEnvelope;

    const cached = idempotencyCache.get(envelope.messageId);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json(cached.response, {
        headers: {
          'x-a2a-idempotent-hit': 'true'
        }
      });
    }

    if (!isTimestampFresh(envelope.timestamp)) {
      const staleResponse: A2AResponse = {
        ok: false,
        traceId: envelope.traceId,
        responder: envelope.toAgent,
        runtimeMs: Date.now() - started,
        contextVersion: envelope.contextRef.version,
        error: 'Stale envelope timestamp rejected.'
      };
      return Response.json(staleResponse, { status: 401 });
    }

    const validSignature = await verifyA2aEnvelopeSignature(envelope, getServerA2aSecret());
    if (!validSignature) {
      const badSig: A2AResponse = {
        ok: false,
        traceId: envelope.traceId,
        responder: envelope.toAgent,
        runtimeMs: Date.now() - started,
        contextVersion: envelope.contextRef.version,
        error: 'HMAC signature verification failed.'
      };
      return Response.json(badSig, { status: 401 });
    }

    const target = envelope.toAgent as AgentName;
    const step = getRuntimeStepByTarget(target);

    if (!step) {
      const noStep: A2AResponse = {
        ok: false,
        traceId: envelope.traceId,
        responder: target,
        runtimeMs: Date.now() - started,
        contextVersion: envelope.contextRef.version,
        error: `No runtime step found for ${target}`
      };
      return Response.json(noStep, { status: 400 });
    }

    const runResult = step.run(envelope.payload.context, createRng(envelope.payload.seed));
    const enriched = await enrichAgentResultWithReasoning({
      agent: target,
      context: envelope.payload.context,
      result: runResult,
      llmReasoning: Boolean(envelope.options?.llmReasoning)
    });

    const response: A2AResponse = {
      ok: true,
      traceId: envelope.traceId,
      responder: target,
      runtimeMs: Date.now() - started,
      contextVersion: envelope.contextRef.version,
      result: enriched
    };

    idempotencyCache.set(envelope.messageId, {
      response,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS
    });

    return Response.json(response);
  } catch (error) {
    const response: A2AResponse = {
      ok: false,
      traceId: 'unknown',
      responder: 'CTM_Orchestrator',
      runtimeMs: Date.now() - started,
      contextVersion: 0,
      error: error instanceof Error ? error.message : 'Unknown A2A inbox error'
    };

    return Response.json(response, { status: 500 });
  }
}
