/**
 * EIMS digital signing — SHA512withRSA per INSA certificate_guideline.pdf
 *
 * Every EIMS request (including login) must be wrapped as:
 * { request, signature, certificate }
 *
 * Signature is computed over JSON.stringify(request) using SHA512withRSA.
 */
import type { EimsSignedRequest } from './eims.types';
/** Canonical JSON serialization — compact, deterministic key order not required per spec */
export declare function serializeEimsRequest(request: unknown): string;
/**
 * Sign a request object with RSA-SHA512 (SHA512withRSA).
 * @param request - The request payload to sign
 * @param privateKeyPem - PEM-encoded RSA private key
 * @returns Base64-encoded signature
 */
export declare function signEimsRequest(request: unknown, privateKeyPem: string): Promise<string>;
/**
 * Verify an EIMS signature (for inbound callbacks / audit).
 */
export declare function verifyEimsSignature(request: unknown, signatureBase64: string, certificatePem: string): Promise<boolean>;
/**
 * Build the full signed envelope for EIMS API submission.
 */
export declare function buildSignedEimsRequest<T>(request: T, privateKeyPem: string, certificateBase64: string): Promise<EimsSignedRequest<T>>;
/**
 * Encode a PEM certificate to Base64 for the EIMS certificate field.
 * EIMS expects the full certificate chain as Base64 (including Subject/Issuer headers).
 */
export declare function encodeCertificateForEims(certificatePem: string): string;
/**
 * Decode Base64 certificate back to PEM/text for verification.
 */
export declare function decodeCertificateFromEims(certificateBase64: string): string;
/** Detect MoR signed response envelope */
export declare function isEimsSignedEnvelope(value: unknown): value is EimsSignedRequest;
/** Verify a MoR signed response envelope and return the inner request */
export declare function verifyEimsSignedEnvelope<T = unknown>(envelope: EimsSignedRequest): Promise<{
    valid: boolean;
    request: T;
}>;
/**
 * Verify MoR invoice signature on registration response body.
 * signedInvoice is base64-encoded canonical invoice; invoiceSignature is RSA-SHA512.
 */
export declare function verifyMoRInvoiceSignature(signedInvoiceBase64: string, invoiceSignatureBase64: string, morCertificatePemOrBase64: string): Promise<boolean>;
/**
 * Validate CSR input fields per INSA guideline.
 * @throws Error if any field fails validation
 */
export declare function validateCsrInput(config: {
    countryName: string;
    stateOrProvinceName: string;
    localityName: string;
    organizationName: string;
    organizationalUnitName: string;
    commonName: string;
    serialNumber: string;
    emailAddress: string;
}): void;
/**
 * Generate OpenSSL CSR config content (einvoice.cnf) per INSA guideline.
 * Validates all inputs before generating the config string.
 */
export declare function generateCsrConfig(config: {
    countryName: string;
    stateOrProvinceName: string;
    localityName: string;
    organizationName: string;
    organizationalUnitName: string;
    commonName: string;
    serialNumber: string;
    emailAddress: string;
}): string;
/**
 * Generate an RSA private key using Node crypto.
 * @param bits - Key size in bits (default 2048 per INSA guideline)
 * @returns PEM-encoded private key
 */
export declare function generatePrivateKeyPem(bits?: number): Promise<string>;
//# sourceMappingURL=eims-signing.d.ts.map