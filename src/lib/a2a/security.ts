import type { A2AEnvelope } from '@/lib/a2a/types';

function getCryptoApi() {
  const c = globalThis.crypto;
  if (!c?.subtle) {
    throw new Error('Web Crypto API is unavailable for A2A signing.');
  }
  return c;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function canonicalPayload(envelope: A2AEnvelope) {
  return JSON.stringify({
    messageId: envelope.messageId,
    traceId: envelope.traceId,
    fromAgent: envelope.fromAgent,
    toAgent: envelope.toAgent,
    intent: envelope.intent,
    payload: envelope.payload,
    contextRef: envelope.contextRef,
    options: envelope.options || {},
    timestamp: envelope.timestamp
  });
}

export function getClientA2aSecret() {
  return process.env.NEXT_PUBLIC_A2A_HMAC_SECRET || 'stochstack-a2a-demo-secret';
}

export function getServerA2aSecret() {
  return process.env.A2A_HMAC_SECRET || process.env.NEXT_PUBLIC_A2A_HMAC_SECRET || 'stochstack-a2a-demo-secret';
}

export async function signA2aEnvelope(envelope: A2AEnvelope, secret: string) {
  const cryptoApi = getCryptoApi();
  const keyData = new TextEncoder().encode(secret);
  const data = new TextEncoder().encode(canonicalPayload(envelope));

  const key = await cryptoApi.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await cryptoApi.subtle.sign('HMAC', key, data);
  return toHex(sig);
}

export async function verifyA2aEnvelopeSignature(envelope: A2AEnvelope, secret: string) {
  if (!envelope.signature) return false;
  const expected = await signA2aEnvelope({ ...envelope, signature: undefined }, secret);
  return expected === envelope.signature;
}

export function isTimestampFresh(timestampIso: string, toleranceMs = 5 * 60 * 1000) {
  const ts = Date.parse(timestampIso);
  if (Number.isNaN(ts)) return false;
  return Math.abs(Date.now() - ts) <= toleranceMs;
}

export function backoffDelayMs(attempt: number, cfg: { baseDelayMs: number; backoffFactor: number; jitterMs: number }) {
  const exp = cfg.baseDelayMs * cfg.backoffFactor ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * Math.max(cfg.jitterMs, 0));
  return exp + jitter;
}
