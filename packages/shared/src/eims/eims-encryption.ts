/**
 * EIMS payload encryption — AES-256-GCM per EIMS_compliance_Draft.pdf §5.1.5
 *
 * After authentication, non-auth requests may be wrapped as { data: "ciphertext" }
 * using the session encryptionKey from the auth response.
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Derive a 32-byte AES key from the UUID encryptionKey returned at login */
export function deriveEncryptionKey(encryptionKey: string): Buffer {
  return crypto.createHash('sha256').update(encryptionKey, 'utf8').digest();
}

/** Encrypt a JSON payload for EIMS transmission */
export function encryptEimsPayload(
  payload: unknown,
  encryptionKey: string,
): string {
  const key = deriveEncryptionKey(encryptionKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: iv (12) + tag (16) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/** Decrypt an EIMS response payload */
export function decryptEimsPayload<T = unknown>(
  ciphertext: string,
  encryptionKey: string,
): T {
  const key = deriveEncryptionKey(encryptionKey);
  const buf = Buffer.from(ciphertext, 'base64');

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8')) as T;
}

/** Wrap payload in { data: ciphertext } envelope if encryption is enabled */
export function wrapEncryptedBody(
  payload: unknown,
  encryptionKey: string | null,
  useEncryption: boolean,
): { data: string } | unknown {
  if (!useEncryption || !encryptionKey) return payload;
  return { data: encryptEimsPayload(payload, encryptionKey) };
}

/** Unwrap { data: ciphertext } response */
export function unwrapEncryptedBody<T = unknown>(
  body: unknown,
  encryptionKey: string | null,
): T {
  if (
    body &&
    typeof body === 'object' &&
    'data' in body &&
    typeof (body as { data: unknown }).data === 'string' &&
    encryptionKey
  ) {
    return decryptEimsPayload<T>((body as { data: string }).data, encryptionKey);
  }
  return body as T;
}
