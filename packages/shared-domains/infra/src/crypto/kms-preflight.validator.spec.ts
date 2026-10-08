import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KmsPreflightValidator } from '@ovds/infra/crypto/kms-preflight.validator';

describe('KmsPreflightValidator', () => {
  let validator: KmsPreflightValidator;

  beforeEach(() => {
    validator = new KmsPreflightValidator();
  });

  it('should throw if key ARN is missing', async () => {
    await expect(validator.validateKeyAvailability('')).rejects.toThrow('KMS Key ARN is required');
  });

  it('should throw if tenant ID is missing for encryption context', async () => {
    await expect(validator.validateEncryptionContext('')).rejects.toThrow('Tenant ID is required');
  });

  it('should validate encryption context with valid tenant ID', async () => {
    const result = await validator.validateEncryptionContext('tenant-1');
    expect(result).toBe(true);
  });
});
