import { describe, it, expect } from 'vitest';
import {
  deriveEncryptionKey,
  encryptEimsPayload,
  decryptEimsPayload,
  wrapEncryptedBody,
  unwrapEncryptedBody,
} from './eims-encryption';

describe('EIMS payload encryption (AES-256-GCM)', () => {
  const encryptionKey = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const samplePayload = {
    clientId: 'test-client',
    tin: '0000038405',
    invoiceNumber: 'INV-001',
  };

  it('derives a 32-byte key from UUID encryptionKey', () => {
    const key = deriveEncryptionKey(encryptionKey);
    expect(key).toHaveLength(32);
    expect(deriveEncryptionKey(encryptionKey).equals(key)).toBe(true);
  });

  it('encrypts and decrypts a JSON payload round-trip', () => {
    const ciphertext = encryptEimsPayload(samplePayload, encryptionKey);
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(0);

    const decrypted = decryptEimsPayload<typeof samplePayload>(ciphertext, encryptionKey);
    expect(decrypted).toEqual(samplePayload);
  });

  it('wraps and unwraps encrypted body envelope', () => {
    const wrapped = wrapEncryptedBody(samplePayload, encryptionKey, true);
    expect(wrapped).toHaveProperty('data');
    expect(typeof (wrapped as { data: string }).data).toBe('string');

    const unwrapped = unwrapEncryptedBody<typeof samplePayload>(wrapped, encryptionKey);
    expect(unwrapped).toEqual(samplePayload);
  });

  it('passes through plaintext when encryption is disabled', () => {
    const body = wrapEncryptedBody(samplePayload, encryptionKey, false);
    expect(body).toEqual(samplePayload);

    const unwrapped = unwrapEncryptedBody(body, encryptionKey);
    expect(unwrapped).toEqual(samplePayload);
  });

  it('produces different ciphertext for same payload (random IV)', () => {
    const a = encryptEimsPayload(samplePayload, encryptionKey);
    const b = encryptEimsPayload(samplePayload, encryptionKey);
    expect(a).not.toBe(b);
    expect(decryptEimsPayload(a, encryptionKey)).toEqual(samplePayload);
    expect(decryptEimsPayload(b, encryptionKey)).toEqual(samplePayload);
  });
});
