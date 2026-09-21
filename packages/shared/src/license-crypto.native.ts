/**
 * @ovds/shared — License signing / verification (Node.js / backend only)
 *
 * Uses Node.js crypto module for HMAC-SHA256.
 * Do NOT import this file in frontend code.
 */

import {
  SignedLicensePayload,
  LicenseVerificationResult,
} from './license-crypto.types';

// Node.js only — do not call from browser contexts
async function getCrypto(): Promise<typeof import('crypto')> {
  try {
    return await import('crypto');
  } catch {
    throw new Error('LicenseCryptoNative: Node.js runtime required. Do not call from browser.');
  }
}

export class LicenseCryptoNative {
  /**
   * Sign a license payload with HMAC-SHA256.
   *
   * Format: `${companyId}:${issuedAt}:${expiresAt}:${version}:${signature}`
   */
  static async sign(
    secret: string,
    companyId: string,
    issuedAt: number,
    expiresAt: number,
    version: string,
  ): Promise<string> {
    const crypto = await getCrypto();
    const payload = `${companyId}:${issuedAt}:${expiresAt}:${version}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return `${payload}:${signature}`;
  }

  /**
   * Verify a signed license key.
   *
   * Returns { payload, valid } where payload is the decoded data
   * or null if verification fails.
   */
  static async verify(
    secret: string,
    licenseKey: string,
    expectedCompanyId: string,
  ): Promise<LicenseVerificationResult> {
    const segments = licenseKey.split(':');

    if (segments.length !== 5) {
      return { payload: null, valid: false };
    }

    const [companyId, issuedAtStr, expiresAtStr, version, signature] =
      segments;

    if (companyId !== expectedCompanyId) {
      return { payload: null, valid: false };
    }

    const issuedAt = parseInt(issuedAtStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt)) {
      return { payload: null, valid: false };
    }

    if (Date.now() > expiresAt) {
      return { payload: null, valid: false };
    }

    const crypto = await getCrypto();
    const payload = `${companyId}:${issuedAtStr}:${expiresAtStr}:${version}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    try {
      const valid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );

      return {
        payload: { companyId, issuedAt, expiresAt, version, signature },
        valid,
      };
    } catch {
      return { payload: null, valid: false };
    }
  }
}
