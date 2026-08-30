/**
 * HMAC request signing — shared between backend verification and frontend clients.
 * Algorithm: HMAC-SHA256 of `${timestamp}.${JSON.stringify(payload)}`
 */

export const REQUEST_SIGNING_MAX_AGE_MS = 5 * 60 * 1000;

export interface RequestSignatureHeaders {
  'X-Request-Timestamp': string;
  'X-Request-Signature': string;
}

/** Compute HMAC-SHA256 hex signature (Node crypto or Web Crypto). */
export async function computeRequestSignature(
  secret: string,
  payload: unknown,
  timestamp: number,
): Promise<string> {
  const payloadString = JSON.stringify(payload);
  const message = `${timestamp}.${payloadString}`;

  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Node.js fallback
  const { createHmac } = await import('crypto');
  return createHmac('sha256', secret).update(message).digest('hex');
}

/** Build signing headers for an outbound HTTP request. */
export async function signRequestPayload(
  secret: string,
  payload: unknown,
  timestamp = Date.now(),
): Promise<RequestSignatureHeaders> {
  const signature = await computeRequestSignature(secret, payload, timestamp);
  return {
    'X-Request-Timestamp': String(timestamp),
    'X-Request-Signature': signature,
  };
}

/** Paths requiring HMAC signing (matches backend @SignedRequest endpoints). */
export const SIGNED_REQUEST_PATH_PATTERNS: RegExp[] = [
  /^\/banking\/transfers$/,
  /^\/banking\/transfers\/[^/]+\/approve$/,
  /^\/banking\/transfers\/[^/]+\/reject$/,
  /^\/banking\/transfers\/[^/]+$/,
];

export function requiresSignedRequestPath(path: string, method: string): boolean {
  const normalized = path.replace(/^\/api/, '').split('?')[0];
  const m = method.toUpperCase();
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(m)) return false;
  return SIGNED_REQUEST_PATH_PATTERNS.some((re) => re.test(normalized));
}

/** Payload shape must match SignedRequestGuard.reconstructPayload */
export function buildSignedPayload(
  method: string,
  body: unknown,
  params: Record<string, string> = {},
  query: Record<string, unknown> = {},
): unknown {
  const m = method.toUpperCase();
  if (['POST', 'PATCH', 'PUT'].includes(m)) return body ?? {};
  return { params, query };
}
