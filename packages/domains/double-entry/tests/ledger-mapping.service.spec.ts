import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LedgerMappingService } from '@ovds/domains-double-entry';

function buildPrismaMock() {
  return {
    ledgerMappingRule: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'rule-1', name: 'Test Rule', matchType: 'KEYWORD', matchValue: 'test', debitAccountId: 'acc-1', creditAccountId: 'acc-2', priority: 100, isActive: true }),
      update: vi.fn().mockResolvedValue({ id: 'rule-1', name: 'Updated Rule' }),
      delete: vi.fn().mockResolvedValue({ id: 'rule-1' }),
    },
    account: {
      findFirst: vi.fn().mockResolvedValue({ id: 'ar-1' }),
    },
    invoice: {
      findFirst: vi.fn().mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-001', status: 'PENDING', totalAmount: 1000, customer: { name: 'Test Customer' } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    bill: {
      findFirst: vi.fn().mockResolvedValue({ id: 'bill-1', billNumber: 'BILL-001', status: 'PENDING', total: 500, vendor: { name: 'Test Vendor' } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
  };
}

function buildAuditMock() {
  return {
    log: vi.fn().mockResolvedValue({}),
  };
}

describe('LedgerMappingService', () => {
  let service: LedgerMappingService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let audit: ReturnType<typeof buildAuditMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    audit = buildAuditMock();
    service = new LedgerMappingService(prisma as any, audit as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMappingRules', () => {
    it('returns rules for a company', async () => {
      prisma.ledgerMappingRule.findMany.mockResolvedValue([
        { id: 'rule-1', name: 'Test', matchType: 'KEYWORD', isActive: true },
      ]);
      const result = await service.getMappingRules('company-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test');
    });
  });

  describe('createMappingRule', () => {
    it('creates a rule with valid data', async () => {
      const result = await service.createMappingRule({
        name: 'Test Rule',
        matchType: 'KEYWORD',
        matchValue: 'test',
        debitAccountId: 'acc-1',
        creditAccountId: 'acc-2',
        priority: 100,
        isActive: true,
      }, 'user-1');
      expect(result.name).toBe('Test Rule');
      expect(prisma.ledgerMappingRule.create).toHaveBeenCalled();
    });

    it('rejects rule without name', async () => {
      await expect(service.createMappingRule({} as any, 'user-1')).rejects.toThrow('Rule name is required');
    });

    it('rejects rule without match value', async () => {
      await expect(service.createMappingRule({
        name: 'Test',
        matchType: 'KEYWORD',
        matchValue: '',
        debitAccountId: 'acc-1',
        creditAccountId: 'acc-2',
      }, 'user-1')).rejects.toThrow('Match value is required');
    });
  });

  describe('getMappingTemplates', () => {
    it('returns available templates', async () => {
      const templates = await service.getMappingTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t: any) => t.key === 'INVOICE_PAYMENT')).toBe(true);
    });
  });

  describe('applyTemplate', () => {
    it('applies a template and creates rules', async () => {
      const result = await service.applyTemplate('INVOICE_PAYMENT', 'company-1', 'user-1');
      expect(result.applied).toBeGreaterThan(0);
      expect(result.rules).toHaveLength(result.applied);
    });

    it('rejects invalid template key', async () => {
      await expect(service.applyTemplate('INVALID', 'company-1', 'user-1')).rejects.toThrow('Template "INVALID" not found');
    });
  });

  describe('autoMapInvoicePayment', () => {
    it('returns fallback mapping when no rules match', async () => {
      prisma.ledgerMappingRule.findMany.mockResolvedValue([]);
      const result = await service.autoMapInvoicePayment({
        invoiceId: 'inv-1',
        paymentAmount: 1000,
        paymentAccountId: 'bank-1',
      }, 'user-1');
      expect(result.confidence).toBe('LOW');
      expect(result.ruleName).toBe('Default Invoice Payment');
    });
  });

  describe('batchAutoMap', () => {
    it('processes invoices and returns mapped count', async () => {
      prisma.ledgerMappingRule.findMany.mockResolvedValue([]);
      prisma.invoice.findMany.mockResolvedValue([
        { id: 'inv-1', invoiceNumber: 'INV-001', status: 'PENDING', totalAmount: 1000, customer: { name: 'Test' } },
      ]);
      const result = await service.batchAutoMap('company-1', 'INVOICE', 10);
      expect(result.mapped + result.skipped).toBeGreaterThan(0);
    });
  });
});
