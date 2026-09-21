/**
 * EIMS payload encryption — AES-256-GCM per EIMS_compliance_Draft.pdf §5.1.5
 *
 * After authentication, non-auth requests may be wrapped as { data: "ciphertext" }
 * using the session encryptionKey from the auth response.
 *
 * NOTE: This module requires Node.js crypto and is intended for backend use only.
 * It is included in @ovds/shared for type-sharing but should not be called in
 * browser contexts (the functions will throw if Node.js crypto is unavailable).
 */

async function getCrypto(): Promise<typeof import('crypto')> {
  try {
    return await import('crypto');
  } catch {
    throw new Error('eims-encryption: Node.js crypto module is required (backend only)');
  }
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Derive a 32-byte AES key from the UUID encryptionKey returned at login */
export async function deriveEncryptionKey(encryptionKey: string): Promise<Buffer> {
  const crypto = await getCrypto();
  return crypto.createHash('sha256').update(encryptionKey, 'utf8').digest();
}

/** Encrypt a JSON payload for EIMS transmission */
export async function encryptEimsPayload(
  payload: unknown,
  encryptionKey: string,
): Promise<string> {
  const crypto = await getCrypto();
  const key = await deriveEncryptionKey(encryptionKey);
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
export async function decryptEimsPayload<T = unknown>(
  ciphertext: string,
  encryptionKey: string,
): Promise<T> {
  const crypto = await getCrypto();
  const key = await deriveEncryptionKey(encryptionKey);
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
export async function wrapEncryptedBody(
  payload: unknown,
  encryptionKey: string | null,
  useEncryption: boolean,
): Promise<{ data: string } | unknown> {
  if (!useEncryption || !encryptionKey) return payload;
  return { data: await encryptEimsPayload(payload, encryptionKey) };
}

/** Unwrap { data: ciphertext } response */
export async function unwrapEncryptedBody<T = unknown>(
  body: unknown,
  encryptionKey: string | null,
): Promise<T> {
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
