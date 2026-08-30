import { describe, it, expect } from 'vitest';
import {
  serializeEimsRequest,
  signEimsRequest,
  buildSignedEimsRequest,
  encodeCertificateForEims,
  generateCsrConfig,
  validateCsrInput,
  isEimsSignedEnvelope,
  verifyEimsSignedEnvelope,
  verifyMoRInvoiceSignature,
} from './eims-signing';
import * as crypto from 'crypto';

describe('EIMS signing (SHA512withRSA)', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const sampleRequest = {
    clientId: 'test-client',
    clientSecret: 'test-secret',
    apikey: 'test-api-key',
    tin: '0000038405',
  };

  it('serializes request to compact JSON', () => {
    const serialized = serializeEimsRequest(sampleRequest);
    expect(serialized).not.toContain('\n');
    expect(JSON.parse(serialized)).toEqual(sampleRequest);
  });

  it('signs request with SHA512withRSA', async () => {
    const signature = await signEimsRequest(sampleRequest, privateKey);
    expect(signature).toBeTruthy();
    expect(typeof signature).toBe('string');

    const verify = crypto.createVerify('RSA-SHA512');
    verify.update(serializeEimsRequest(sampleRequest), 'utf8');
    expect(verify.verify(publicKey, Buffer.from(signature, 'base64'))).toBe(true);
  });

  it('builds full signed envelope', async () => {
    const certPem = '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----';
    const envelope = await buildSignedEimsRequest(
      sampleRequest,
      privateKey,
      encodeCertificateForEims(certPem),
    );

    expect(envelope.request).toEqual(sampleRequest);
    expect(envelope.signature).toBeTruthy();
    expect(envelope.certificate).toBeTruthy();
  });

  it('generates CSR config per INSA guideline', () => {
    const config = generateCsrConfig({
      countryName: 'ET',
      stateOrProvinceName: 'Addis Ababa',
      localityName: 'Addis Ababa',
      organizationName: 'Test Company',
      organizationalUnitName: 'Test Company Main Enterprise',
      commonName: '1234567890',
      serialNumber: 'B0360155CA',
      emailAddress: 'testtaxpayer@gmail.com',
    });

    expect(config).toContain('commonName                      = 1234567890');
    expect(config).toContain('serialNumber                    = B0360155CA');
    expect(config).toContain('default_bits        = 2048');
    expect(config).toContain('string_mask         = utf8only');
    expect(config).toContain('default_md          = sha512');
    expect(config).toContain('subjectAltName         = @sans');
    expect(config).toContain('email.1                = testtaxpayer@gmail.com');
  });

  it('detects and verifies signed response envelopes', async () => {
    const envelope = await buildSignedEimsRequest(
      sampleRequest,
      privateKey,
      encodeCertificateForEims(publicKey),
    );
    expect(isEimsSignedEnvelope(envelope)).toBe(true);
    expect(isEimsSignedEnvelope({ foo: 'bar' })).toBe(false);

    const { valid, request } = await verifyEimsSignedEnvelope(envelope);
    expect(valid).toBe(true);
    expect(request).toEqual(sampleRequest);
  });

  it('verifies MoR invoice signature over signedInvoice payload', async () => {
    const payload = Buffer.from(serializeEimsRequest(sampleRequest), 'utf8');
    const sign = crypto.createSign('RSA-SHA512');
    sign.update(payload);
    sign.end();
    const invoiceSignature = sign.sign(privateKey).toString('base64');
    const signedInvoice = payload.toString('base64');

    expect(
      await verifyMoRInvoiceSignature(signedInvoice, invoiceSignature, publicKey),
    ).toBe(true);
    expect(
      await verifyMoRInvoiceSignature(signedInvoice, 'invalid', publicKey),
    ).toBe(false);
  });

  it('validates correct CSR input without throwing', () => {
    expect(() =>
      validateCsrInput({
        countryName: 'ET',
        stateOrProvinceName: 'Addis Ababa',
        localityName: 'Addis Ababa',
        organizationName: 'Test Company',
        organizationalUnitName: 'Test Company Main Enterprise',
        commonName: '1234567890',
        serialNumber: 'B0360155CA',
        emailAddress: 'testtaxpayer@gmail.com',
      }),
    ).not.toThrow();
  });

  it('rejects invalid TIN (not 10 digits)', () => {
    expect(() =>
      validateCsrInput({
        countryName: 'ET',
        stateOrProvinceName: 'Addis Ababa',
        localityName: 'Addis Ababa',
        organizationName: 'Test Company',
        organizationalUnitName: 'Test Company Main Enterprise',
        commonName: '123',
        serialNumber: 'B0360155CA',
        emailAddress: 'testtaxpayer@gmail.com',
      }),
    ).toThrow('commonName must be a 10-digit TIN');
  });

  it('rejects invalid country code', () => {
    expect(() =>
      validateCsrInput({
        countryName: 'ETH',
        stateOrProvinceName: 'Addis Ababa',
        localityName: 'Addis Ababa',
        organizationName: 'Test Company',
        organizationalUnitName: 'Test Company Main Enterprise',
        commonName: '1234567890',
        serialNumber: 'B0360155CA',
        emailAddress: 'testtaxpayer@gmail.com',
      }),
    ).toThrow('countryName must be a 2-letter uppercase ISO code');
  });

  it('rejects invalid email', () => {
    expect(() =>
      validateCsrInput({
        countryName: 'ET',
        stateOrProvinceName: 'Addis Ababa',
        localityName: 'Addis Ababa',
        organizationName: 'Test Company',
        organizationalUnitName: 'Test Company Main Enterprise',
        commonName: '1234567890',
        serialNumber: 'B0360155CA',
        emailAddress: 'invalid-email',
      }),
    ).toThrow('emailAddress must be a valid email');
  });

  it('rejects empty organizationName', () => {
    expect(() =>
      validateCsrInput({
        countryName: 'ET',
        stateOrProvinceName: 'Addis Ababa',
        localityName: 'Addis Ababa',
        organizationName: '',
        organizationalUnitName: 'Test Company Main Enterprise',
        commonName: '1234567890',
        serialNumber: 'B0360155CA',
        emailAddress: 'testtaxpayer@gmail.com',
      }),
    ).toThrow('organizationName is required');
  });
});
