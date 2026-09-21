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
import { LicenseVerificationResult } from './license-crypto.types';
export declare class LicenseCryptoWeb {
    /**
     * Verify a signed license key in the browser using Web Crypto API.
     */
    static verify(secret: string, licenseKey: string, expectedCompanyId: string): Promise<LicenseVerificationResult>;
}
//# sourceMappingURL=license-crypto.web.d.ts.map