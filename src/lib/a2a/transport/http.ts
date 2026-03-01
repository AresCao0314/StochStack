import type { A2AEnvelope, A2AResponse } from '@/lib/a2a/types';

export async function sendEnvelopeHttp(endpoint: string, envelope: A2AEnvelope): Promise<A2AResponse> {
  const started = performance.now();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-a2a-trace-id': envelope.traceId,
      'x-a2a-from-agent': envelope.fromAgent,
      'x-a2a-to-agent': envelope.toAgent
    },
    body: JSON.stringify(envelope)
  });

  const runtimeMs = Math.round(performance.now() - started);

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      traceId: envelope.traceId,
      responder: envelope.toAgent,
      runtimeMs,
      contextVersion: envelope.contextRef.version,
      error: `HTTP ${response.status}: ${text}`
    };
  }

  const parsed = (await response.json()) as A2AResponse;
  return {
    ...parsed,
    runtimeMs: parsed.runtimeMs || runtimeMs
  };
}
