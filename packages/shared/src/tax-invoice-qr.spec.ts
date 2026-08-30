import { describe, it, expect } from 'vitest';
import {
  buildTaxInvoiceQr,
  canonicalTaxInvoiceString,
  parseTaxInvoiceQr,
  verifyTaxInvoiceQr,
  sha256TaxInvoiceHash,
  type TaxInvoiceQrPayload,
} from './tax-invoice-qr';

const sample: TaxInvoiceQrPayload = {
  tin: '1000123456',
  fsNo: 'SRM-ET-000123',
  invoiceNo: 'INV-2026-0001',
  date: '2026-07-17',
  total: 1150.0,
  vat: 150.0,
  currency: 'ETB',
};

describe('tax-invoice QR (§7.2.1 / Directive 1142/2026)', () => {
  it('builds a pipe-delimited OVDS-TAX QR with a SHA-256 hash', () => {
    const qr = buildTaxInvoiceQr(sample);
    expect(qr.startsWith('OVDS-TAX|')).toBe(true);
    const parts = qr.split('|');
    expect(parts).toHaveLength(9);
    expect(parts[1]).toBe(sample.tin);
    expect(parts[2]).toBe(sample.fsNo);
    expect(parts[3]).toBe(sample.invoiceNo);
    expect(parts[4]).toBe('2026-07-17');
    expect(parts[5]).toBe('1150.00');
    expect(parts[6]).toBe('150.00');
    expect(parts[7]).toBe('ETB');
    // last segment is the 64-ar hex SHA-256 hash
    expect(parts[8]).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hash is deterministic and matches sha256TaxInvoiceHash', () => {
    const a = sha256TaxInvoiceHash(sample);
    const b = sha256TaxInvoiceHash(sample);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('canonical string is order-stable for idempotent replay', () => {
    const s1 = canonicalTaxInvoiceString(sample);
    const s2 = canonicalTaxInvoiceString({ ...sample, total: 1150, vat: 150 });
    expect(s1).toBe(s2);
  });

  it('round-trips through parseTaxInvoiceQr and verifies', () => {
    const qr = buildTaxInvoiceQr(sample);
    const parsed = parseTaxInvoiceQr(qr);
    expect(parsed.invoiceNo).toBe(sample.invoiceNo);
    expect(parsed.hash).toBe(sha256TaxInvoiceHash(sample));
    expect(verifyTaxInvoiceQr(qr)).toBe(true);
  });

  it('detects tampering in the QR payload', () => {
    const qr = buildTaxInvoiceQr(sample);
    const tampered = qr.replace('1150.00', '9999.00');
    expect(verifyTaxInvoiceQr(tampered)).toBe(false);
  });

  it('rejects non-OVDS-TAX QR strings on parse', () => {
    expect(() => parseTaxInvoiceQr('NBE-IQR|foo|bar')).toThrow();
  });
});
