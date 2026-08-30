import {
  buildSignedPayload,
  requiresSignedRequestPath,
  signRequestPayload,
} from '@ovds/shared';

/** HMAC signing secret — must match backend REQUEST_SIGNING_SECRET */
function getSigningSecret(): string | undefined {
  return import.meta.env.VITE_REQUEST_SIGNING_SECRET as string | undefined;
}

/**
 * Attach X-Request-Timestamp and X-Request-Signature headers for
 * @SignedRequest() backend endpoints (banking transfers, etc.).
 */
export async function attachRequestSignature(
  method: string,
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<void> {
  const secret = getSigningSecret();
  if (!secret) return;

  const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  if (!requiresSignedRequestPath(path, method)) return;

  const payload = buildSignedPayload(method, body);
  const signed = await signRequestPayload(secret, payload);
  headers['X-Request-Timestamp'] = signed['X-Request-Timestamp'];
  headers['X-Request-Signature'] = signed['X-Request-Signature'];
}
