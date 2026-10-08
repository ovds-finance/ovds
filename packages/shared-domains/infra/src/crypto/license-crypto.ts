import { createCipheriv, createDecipheriv, scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface LicensePayload {
  tenantId: string;
  issuedAt: number;
  expiresAt: number;
  modules: string[];
  signature: string;
}

export interface EncryptedLicense {
  ivHex: string;
  encryptedHex: string;
}

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;

export async function deriveKey(passphrase: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(passphrase, salt, KEY_LENGTH) as Promise<Buffer>;
}

export async function encryptLicense(
  payload: LicensePayload,
  passphrase: string
): Promise<EncryptedLicense> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(passphrase, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const json = JSON.stringify(payload);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const combined = Buffer.concat([salt, iv, Buffer.from(encrypted, 'hex')]);
  return {
    ivHex: iv.toString('hex'),
    encryptedHex: combined.toString('hex'),
  };
}

export async function decryptLicense(
  encrypted: EncryptedLicense,
  passphrase: string
): Promise<LicensePayload> {
  const combined = Buffer.from(encrypted.encryptedHex, 'hex');
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const encryptedData = combined.subarray(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedData, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

export function verifyLicenseSignature(payload: LicensePayload, publicKey: string): boolean {
  const crypto = require('crypto');
  const verify = crypto.createVerify('sha256');
  verify.update(JSON.stringify({
    tenantId: payload.tenantId,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    modules: payload.modules,
  }));
  verify.end();
  return verify.verify(publicKey, payload.signature, 'hex');
}

export function generateLicenseKey(payload: LicensePayload, privateKey: string): string {
  const crypto = require('crypto');
  const sign = crypto.createSign('sha256');
  sign.update(JSON.stringify({
    tenantId: payload.tenantId,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
    modules: payload.modules,
  }));
  sign.end();
  return sign.sign(privateKey, 'hex');
}