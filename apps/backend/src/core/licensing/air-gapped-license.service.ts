import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import {
  SignedLicensePayload,
  LicenseVerificationResult,
} from '@ovds/shared';

/**
 * AirGappedLicenseService
 *
 * Enterprise-tier licensing engine for on-premise / air-gapped deployments.
 *
 * Uses Node's native `crypto` module to verify RSA-SHA256 signatures,
 * allowing on-premise installations to decrypt and cache feature flags
 * locally from a license string — no internet telemetry required.
 *
 * The public key is pre-provisioned via the OFFLINE_PUBLIC_KEY env var
 * (PEM-encoded).  The license key format is:
 *   base64(payloadJson).base64(signature)
 *
 * Where payloadJson contains: { companyId, registeredModules, version, expiresAt, issuedAt }
 */
export interface LicenseFeatures {
  companyId: string;
  registeredModules: string[];
  version: string;
  expiresAt?: number;
  issuedAt?: number;
}

@Injectable()
export class AirGappedLicenseService {
  private readonly logger = new Logger(AirGappedLicenseService.name);
  private readonly publicKey: string | null;
  private readonly cache: Map<string, SignedLicensePayload> = new Map();

  constructor() {
    this.publicKey = process.env.OFFLINE_PUBLIC_KEY || null;
    if (!this.publicKey) {
      this.logger.warn(
        'OFFLINE_PUBLIC_KEY is not set — air-gapped license verification will fail. ' +
          'Configure this in your environment for on-premise deployments.',
      );
    }
  }

  /**
   * Verify a license key offline using RSA-SHA256 asymmetric crypto.
   *
   * @param licenseKey  `base64(payload).base64(signature)` string
   * @param companyId   The company ID to bind the license to
   * @returns          `{ payload, valid }` — payload is null on failure
   */
  verifyLicense(licenseKey: string, companyId: string): LicenseVerificationResult {
    if (!licenseKey) {
      return { payload: null, valid: false };
    }

    if (!this.publicKey) {
      this.logger.error('OFFLINE_PUBLIC_KEY environment variable is required for license verification.');
      return { payload: null, valid: false };
    }

    // Check cache first — avoids redundant crypto verification on every request
    const cached = this.cache.get(companyId);
    if (cached) {
      return { payload: cached, valid: true };
    }

    try {
      const segments = licenseKey.split('.');
      if (segments.length !== 2) {
        return { payload: null, valid: false };
      }

      const [payloadB64, signatureB64] = segments;
      const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf8');
      const payload: LicenseFeatures = JSON.parse(payloadJson);

      // Validate company binding
      if (payload.companyId !== companyId) {
        return { payload: null, valid: false };
      }

      // Check expiry
      if (payload.expiresAt && Date.now() > payload.expiresAt) {
        return { payload: null, valid: false };
      }

      // RSA-SHA256 signature verification
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(payloadJson);

      const valid = verifier.verify(
        { key: this.publicKey, format: 'pem' },
        Buffer.from(signatureB64, 'base64'),
      );

      const signedPayload: SignedLicensePayload = {
        companyId: payload.companyId,
        issuedAt: payload.issuedAt ?? 0,
        expiresAt: payload.expiresAt ?? 0,
        version: payload.version,
        signature: signatureB64,
      };

      if (valid) {
        // Cache the verified payload for the remainder of this process lifetime
        // (on-premise servers have long uptimes; the signature is deterministic)
        this.cache.set(companyId, signedPayload);
      }

      return {
        payload: valid ? signedPayload : null,
        valid,
      };
    } catch (err: any) {
      this.logger.error(`License verification error: ${err?.message ?? String(err)}`);
      return { payload: null, valid: false };
    }
  }

  /**
   * Check if a license has expired.
   */
  isExpired(result: LicenseVerificationResult): boolean {
    if (!result.payload) return true;
    return result.payload.expiresAt > 0 && Date.now() > result.payload.expiresAt;
  }

  /**
   * Get cached features for a company, or null if no valid license exists.
   */
  getCachedFeatures(companyId: string): LicenseFeatures | null {
    const cached = this.cache.get(companyId);
    if (!cached) return null;
    return {
      companyId: cached.companyId,
      registeredModules: [],
      version: cached.version,
      expiresAt: cached.expiresAt,
      issuedAt: cached.issuedAt,
    };
  }
}
