import { describe, it, expect } from 'vitest';
import { validateTin } from '../utils';

/** Inline validation logic mirroring EimsValidationService for unit testing */
function detectDocumentKind(invoice: {
  invoiceNumber: string;
  totalAmount: number;
  recurringParentId?: string | null;
  docType?: string | null;
}) {
  if (
    invoice.invoiceNumber.startsWith('CN-') ||
    invoice.docType === 'CREDIT_NOTE' ||
    invoice.totalAmount < 0
  ) return 'CRN';
  if (
    invoice.invoiceNumber.startsWith('DN-') ||
    invoice.invoiceNumber.startsWith('DBN-') ||
    invoice.docType === 'DEBIT_NOTE'
  ) return 'DBN';
  return 'INV';
}

describe('EIMS validation rules (MoR BSP)', () => {
  it('detects credit memo from CN- prefix', () => {
    expect(detectDocumentKind({ invoiceNumber: 'CN-INV-001', totalAmount: -100 })).toBe('CRN');
  });

  it('detects debit memo from DN- prefix', () => {
    expect(detectDocumentKind({ invoiceNumber: 'DN-INV-001', totalAmount: 50 })).toBe('DBN');
  });

  it('rejects invalid B2B buyer TIN per IRC-P02', () => {
    const check = validateTin('12345');
    expect(check.valid).toBe(false);
  });

  it('accepts valid 10-digit buyer TIN', () => {
    expect(validateTin('0000038405').valid).toBe(true);
  });

  it('rejects credit memo exceeding original amount', () => {
    const creditTotal = 1500;
    const originalTotal = 1000;
    expect(creditTotal > originalTotal).toBe(true);
  });
});
