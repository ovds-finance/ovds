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
export function serializeEimsRequest(request: unknown): string {
  return JSON.stringify(request);
}

async function getCrypto() {
  try {
    const mod = await import('crypto');
    return mod;
  } catch {
    throw new Error('crypto module is only available in Node.js runtime');
  }
}

/**
 * Sign a request object with RSA-SHA512 (SHA512withRSA).
 * @param request - The request payload to sign
 * @param privateKeyPem - PEM-encoded RSA private key
 * @returns Base64-encoded signature
 */
export async function signEimsRequest(
  request: unknown,
  privateKeyPem: string,
): Promise<string> {
  const crypto = await getCrypto();
  const serialized = serializeEimsRequest(request);
  const sign = crypto.createSign('RSA-SHA512');
  sign.update(serialized, 'utf8');
  sign.end();
  return sign.sign(privateKeyPem).toString('base64');
}

/**
 * Verify an EIMS signature (for inbound callbacks / audit).
 */
export async function verifyEimsSignature(
  request: unknown,
  signatureBase64: string,
  certificatePem: string,
): Promise<boolean> {
  const crypto = await getCrypto();
  const serialized = serializeEimsRequest(request);
  const verify = crypto.createVerify('RSA-SHA512');
  verify.update(serialized, 'utf8');
  verify.end();
  return verify.verify(certificatePem, Buffer.from(signatureBase64, 'base64'));
}

/**
 * Build the full signed envelope for EIMS API submission.
 */
export async function buildSignedEimsRequest<T>(
  request: T,
  privateKeyPem: string,
  certificateBase64: string,
): Promise<EimsSignedRequest<T>> {
  const signature = await signEimsRequest(request, privateKeyPem);
  return {
    request,
    signature,
    certificate: certificateBase64,
  };
}

/**
 * Encode a PEM certificate to Base64 for the EIMS certificate field.
 * EIMS expects the full certificate chain as Base64 (including Subject/Issuer headers).
 */
export function encodeCertificateForEims(certificatePem: string): string {
  return Buffer.from(certificatePem, 'utf8').toString('base64');
}

/**
 * Decode Base64 certificate back to PEM/text for verification.
 */
export function decodeCertificateFromEims(certificateBase64: string): string {
  return Buffer.from(certificateBase64, 'base64').toString('utf8');
}

/** Detect MoR signed response envelope */
export function isEimsSignedEnvelope(
  value: unknown,
): value is EimsSignedRequest {
  return (
    !!value &&
    typeof value === 'object' &&
    'request' in value &&
    'signature' in value &&
    'certificate' in value &&
    typeof (value as EimsSignedRequest).signature === 'string' &&
    typeof (value as EimsSignedRequest).certificate === 'string'
  );
}

/** Verify a MoR signed response envelope and return the inner request */
export async function verifyEimsSignedEnvelope<T = unknown>(
  envelope: EimsSignedRequest,
): Promise<{ valid: boolean; request: T }> {
  const certPem = decodeCertificateFromEims(envelope.certificate);
  const valid = await verifyEimsSignature(
    envelope.request,
    envelope.signature,
    certPem,
  );
  return { valid, request: envelope.request as T };
}

/**
 * Verify MoR invoice signature on registration response body.
 * signedInvoice is base64-encoded canonical invoice; invoiceSignature is RSA-SHA512.
 */
export async function verifyMoRInvoiceSignature(
  signedInvoiceBase64: string,
  invoiceSignatureBase64: string,
  morCertificatePemOrBase64: string,
): Promise<boolean> {
  const crypto = await getCrypto();
  const certPem = morCertificatePemOrBase64.includes('BEGIN')
    ? morCertificatePemOrBase64
    : decodeCertificateFromEims(morCertificatePemOrBase64);
  const payload = Buffer.from(signedInvoiceBase64, 'base64');
  const verify = crypto.createVerify('RSA-SHA512');
  verify.update(payload);
  verify.end();
  return verify.verify(certPem, Buffer.from(invoiceSignatureBase64, 'base64'));
}

/**
 * Validate CSR input fields per INSA guideline.
 * @throws Error if any field fails validation
 */
export function validateCsrInput(config: {
  countryName: string;
  stateOrProvinceName: string;
  localityName: string;
  organizationName: string;
  organizationalUnitName: string;
  commonName: string;
  serialNumber: string;
  emailAddress: string;
}): void {
  if (!config.countryName || !/^[A-Z]{2}$/.test(config.countryName)) {
    throw new Error('countryName must be a 2-letter uppercase ISO code (e.g. ET)');
  }
  if (!config.stateOrProvinceName || config.stateOrProvinceName.trim().length < 2) {
    throw new Error('stateOrProvinceName is required (min 2 chars)');
  }
  if (!config.localityName || config.localityName.trim().length < 2) {
    throw new Error('localityName is required (min 2 chars)');
  }
  if (!config.organizationName || config.organizationName.trim().length < 2) {
    throw new Error('organizationName is required (min 2 chars)');
  }
  if (!config.organizationalUnitName || config.organizationalUnitName.trim().length < 2) {
    throw new Error('organizationalUnitName is required (min 2 chars)');
  }
  if (!config.commonName || !/^\d{10}$/.test(config.commonName)) {
    throw new Error('commonName must be a 10-digit TIN');
  }
  if (!config.serialNumber || config.serialNumber.trim().length < 4) {
    throw new Error('serialNumber is required (min 4 chars)');
  }
  if (!config.emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.emailAddress)) {
    throw new Error('emailAddress must be a valid email');
  }
}

/**
 * Generate OpenSSL CSR config content (einvoice.cnf) per INSA guideline.
 * Validates all inputs before generating the config string.
 */
export function generateCsrConfig(config: {
  countryName: string;
  stateOrProvinceName: string;
  localityName: string;
  organizationName: string;
  organizationalUnitName: string;
  commonName: string;
  serialNumber: string;
  emailAddress: string;
}): string {
  validateCsrInput(config);

  const lines: string[] = [
    '[ req ]',
    'default_bits        = 2048',
    'prompt              = no',
    'string_mask         = utf8only',
    'default_md          = sha512',
    'distinguished_name  = req_distinguished_name',
    'req_extensions      = req_ext',
    '',
    '[ req_distinguished_name ]',
    `countryName                     = ${config.countryName}`,
    `stateOrProvinceName             = ${config.stateOrProvinceName}`,
    `localityName                    = ${config.localityName}`,
    `organizationName                = ${config.organizationName}`,
    `organizationalUnitName          = ${config.organizationalUnitName}`,
    `serialNumber                    = ${config.serialNumber}`,
    `commonName                      = ${config.commonName}`,
    '',
    '[ req_ext ]',
    'subjectAltName         = @sans',
    '',
    '[ sans ]',
    `email.1                = ${config.emailAddress}`,
  ];

  return lines.join('\n') + '\n';
}

/**
 * Generate an RSA private key using Node crypto.
 * @param bits - Key size in bits (default 2048 per INSA guideline)
 * @returns PEM-encoded private key
 */
export async function generatePrivateKeyPem(bits = 2048): Promise<string> {
  const crypto = await getCrypto();
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: bits,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return privateKey;
}
