/**
 * @ovds/shared — License signing / verification types
 *
 * Used by:
 *   - Backend (NestJS): LicenseCryptoNative
 *   - Frontend (React): LicenseCryptoWeb
 */

export interface SignedLicensePayload {
  companyId: string;
  issuedAt: number;
  expiresAt: number;
  version: string;
  signature: string;
}

export interface LicenseVerificationResult {
  payload: SignedLicensePayload | null;
  valid: boolean;
}
