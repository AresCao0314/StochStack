import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { getRuntimeStepByTarget } from '@/lib/opsTwin/agentRuntime';
import { createRng } from '@/lib/opsTwin/sim/seeded';
import type { A2AResponse } from '@/lib/a2a/types';
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
  timestamp: z.string(),
  signature: z.string().optional()
});

export async function POST(request: NextRequest) {
  const started = Date.now();

  try {
    const raw = await request.json();
    const envelope = envelopeSchema.parse(raw);

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

    const result = step.run(envelope.payload.context, createRng(envelope.payload.seed));

    const response: A2AResponse = {
      ok: true,
      traceId: envelope.traceId,
      responder: target,
      runtimeMs: Date.now() - started,
      contextVersion: envelope.contextRef.version,
      result
    };

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
