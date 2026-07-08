import { createHmac, timingSafeEqual } from 'node:crypto';
import { LlamaGenWebhookSignatureError } from './errors';
import type { WebhookEvent, WebhookVerificationOptions } from './types';

export type WebhookHeaders = Headers | Record<string, string | string[] | undefined>;

const DEFAULT_TOLERANCE_SECONDS = 300;

export function verifyWebhookSignature(
  payload: string | Buffer,
  headers: WebhookHeaders,
  secret: string,
  options: WebhookVerificationOptions = {}
): boolean {
  try {
    assertValidSignature(payload, headers, secret, options);
    return true;
  } catch {
    return false;
  }
}

export function constructWebhookEvent<TData = unknown>(
  payload: string | Buffer,
  headers: WebhookHeaders,
  secret: string,
  options: WebhookVerificationOptions = {}
): WebhookEvent<TData> {
  assertValidSignature(payload, headers, secret, options);
  const body = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
  const event = JSON.parse(body) as WebhookEvent<TData>;
  const requestId = getHeader(headers, 'x-llama-webhook-request-id');
  const id = event.id ?? getHeader(headers, 'x-llama-webhook-id');
  return {
    ...event,
    ...(id ? { id } : {}),
    ...(requestId ? { requestId } : {})
  };
}

function assertValidSignature(
  payload: string | Buffer,
  headers: WebhookHeaders,
  secret: string,
  options: WebhookVerificationOptions
): void {
  if (!secret) {
    throw new LlamaGenWebhookSignatureError('Webhook secret is required.');
  }

  const timestamp = getHeader(headers, 'x-llama-webhook-timestamp');
  const signature = getHeader(headers, 'x-llama-webhook-signature');
  if (!timestamp || !signature) {
    throw new LlamaGenWebhookSignatureError('Missing LlamaGen webhook signature headers.');
  }

  const parsedTimestamp = Number(timestamp);
  if (!Number.isFinite(parsedTimestamp)) {
    throw new LlamaGenWebhookSignatureError('Invalid LlamaGen webhook timestamp.');
  }

  const toleranceSeconds = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (toleranceSeconds > 0 && Math.abs(now - parsedTimestamp) > toleranceSeconds) {
    throw new LlamaGenWebhookSignatureError('LlamaGen webhook timestamp is outside tolerance.');
  }

  const expected = signPayload(payload, secret, timestamp);
  const signatures = signature
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^v1=/, ''));

  if (!signatures.some((candidate) => safeCompare(candidate, expected))) {
    throw new LlamaGenWebhookSignatureError('No matching LlamaGen webhook signature found.');
  }
}

function signPayload(payload: string | Buffer, secret: string, timestamp: string): string {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  return createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(body)
    .digest('hex');
}

function safeCompare(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

function getHeader(headers: WebhookHeaders, name: string): string | undefined {
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      return Array.isArray(value) ? value.join(',') : value;
    }
  }

  return undefined;
}
