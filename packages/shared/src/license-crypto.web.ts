/**
 * @ovds/shared — License verification (Web / frontend only)
 *
 * Uses Web Crypto API for HMAC-SHA256 verification in the browser.
 * Do NOT import this file in Node.js backend code.
 *
 * NOTE: The sign() method is intentionally omitted — license keys must
 * only be generated server-side. This module is for client-side
 * verification only (e.g. checking a key before submitting to the API).
 */

import {
  SignedLicensePayload,
  LicenseVerificationResult,
} from './license-crypto.types';

export class LicenseCryptoWeb {
  /**
   * Verify a signed license key in the browser using Web Crypto API.
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

    const payload = `${companyId}:${issuedAtStr}:${expiresAtStr}:${version}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    const signatureData = encoder.encode(signature);

    try {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
      );

      const expectedSignatureArray = new Uint8Array(
        await crypto.subtle.sign('HMAC', cryptoKey, messageData),
      );

      let valid = false;
      if (signatureData.length === expectedSignatureArray.length) {
        valid = true;
        for (let i = 0; i < signatureData.length; i++) {
          valid = valid && signatureData[i] === expectedSignatureArray[i];
        }
      }

      return {
        payload: { companyId, issuedAt, expiresAt, version, signature },
        valid,
      };
    } catch {
      return { payload: null, valid: false };
    }
  }
}
