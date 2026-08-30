/**
 * @ovds/shared — License signing / verification (Node.js / backend only)
 *
 * Uses Node.js crypto module for HMAC-SHA256.
 * Do NOT import this file in frontend code.
 */

import * as crypto from 'crypto';
import {
  SignedLicensePayload,
  LicenseVerificationResult,
} from './license-crypto.types';

export class LicenseCryptoNative {
  /**
   * Sign a license payload with HMAC-SHA256.
   *
   * Format: `${companyId}:${issuedAt}:${expiresAt}:${version}:${signature}`
   */
  static sign(
    secret: string,
    companyId: string,
    issuedAt: number,
    expiresAt: number,
    version: string,
  ): string {
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
  static verify(
    secret: string,
    licenseKey: string,
    expectedCompanyId: string,
  ): LicenseVerificationResult {
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
