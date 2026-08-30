import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DoubleEntryService } from '@ovds/domains/double-entry';

function buildPrismaMock() {
  return {
    account: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'acc-1', code: '1000', name: 'Assets', type: 'ASSET', category: 'CURRENT_ASSET' }),
    },
    journalEntry: {
      create: vi.fn().mockResolvedValue({ id: 'je-1', journalLine: [] }),
    },
    journalLine: {
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

describe('DoubleEntryService — Cash Flow & CoA enhancements', () => {
  let service: DoubleEntryService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let audit: ReturnType<typeof buildAuditMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    audit = buildAuditMock();
    service = new DoubleEntryService(prisma as any, audit as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCashFlow', () => {
    it('returns cash flow structure with operating/investing/financing', async () => {
      prisma.journalLine.findMany.mockResolvedValue([]);
      const result = await service.getCashFlow({ companyId: 'company-1', from: '2026-01-01', to: '2026-12-31' });
      expect(result).toHaveProperty('operating');
      expect(result).toHaveProperty('investing');
      expect(result).toHaveProperty('financing');
      expect(result).toHaveProperty('netCashFlow');
      expect(result).toHaveProperty('ifrsCompliant', true);
      expect(result).toHaveProperty('iasReference', 'IAS 7 — Statement of Cash Flows');
    });

    it('classifies journal lines into cash flow sections', async () => {
      prisma.journalLine.findMany.mockResolvedValue([
        {
          id: 'jl-1',
          debit: 1000,
          credit: 0,
          account: { id: 'a1', code: '1101', name: 'Bank', type: 'ASSET', category: 'BANK' },
          journalEntry: { id: 'je-1', date: new Date('2026-06-01'), reference: 'REF-1', description: 'Test' },
        },
        {
          id: 'jl-2',
          debit: 0,
          credit: 500,
          account: { id: 'a2', code: '1000', name: 'Equipment', type: 'ASSET', category: 'FIXED_ASSET' },
          journalEntry: { id: 'je-2', date: new Date('2026-06-01'), reference: 'REF-2', description: 'Test' },
        },
        {
          id: 'jl-3',
          debit: 200,
          credit: 0,
          account: { id: 'a3', code: '3000', name: 'Equity', type: 'EQUITY', category: 'EQUITY' },
          journalEntry: { id: 'je-3', date: new Date('2026-06-01'), reference: 'REF-3', description: 'Test' },
        },
      ]);

      const result = await service.getCashFlow({ companyId: 'company-1', from: '2026-01-01', to: '2026-12-31' });

      const operatingCodes = result.operating.rows.map((r: any) => r.journalLineId);
      const investingCodes = result.investing.rows.map((r: any) => r.journalLineId);
      const financingCodes = result.financing.rows.map((r: any) => r.journalLineId);

      expect(operatingCodes).toContain('jl-1');
      expect(investingCodes).toContain('jl-2');
      expect(financingCodes).toContain('jl-3');
    });
  });

  describe('getCoaTemplates', () => {
    it('returns available CoA templates', async () => {
      const templates = await service.getCoaTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t: any) => t.key === 'ETHIOPIAN_AABE')).toBe(true);
      expect(templates.some((t: any) => t.key === 'MICRO_ENTERPRISE')).toBe(true);
      expect(templates.some((t: any) => t.key === 'SME_STANDARD')).toBe(true);
    });
  });

  describe('applyCoaTemplate', () => {
    it('applies template and creates root accounts', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockResolvedValue({ id: 'acc-1', code: '1000', name: 'Assets' });

      const result = await service.applyCoaTemplate('ETHIOPIAN_AABE', 'company-1', 'user-1');
      expect(result.applied).toBe(6);
      expect(result.accounts).toHaveLength(6);
    });

    it('rejects when accounts already exist', async () => {
      prisma.account.findFirst.mockResolvedValue({ id: 'acc-existing' });
      await expect(service.applyCoaTemplate('ETHIOPIAN_AABE', 'company-1', 'user-1')).rejects.toThrow(
        'Chart of Accounts already exists',
      );
    });

    it('rejects invalid template key', async () => {
      await expect(service.applyCoaTemplate('INVALID', 'company-1', 'user-1')).rejects.toThrow('Template "INVALID" not found');
    });
  });

  describe('exportChartOfAccounts', () => {
    it('exports as JSON by default', async () => {
      prisma.account.findMany.mockResolvedValue([
        { id: 'a1', code: '1000', name: 'Assets', type: 'ASSET', category: 'CURRENT_ASSET', parentId: null, isActive: true, description: null },
      ]);

      const result = await service.exportChartOfAccounts('company-1');
      expect(result.format).toBe('json');
      expect(result.count).toBe(1);
      expect(result.data[0].code).toBe('1000');
    });

    it('exports as CSV when requested', async () => {
      prisma.account.findMany.mockResolvedValue([
        { id: 'a1', code: '1000', name: 'Assets', type: 'ASSET', category: 'CURRENT_ASSET', parentId: null, isActive: true, description: null },
      ]);

      const result = await service.exportChartOfAccounts('company-1', 'csv');
      expect(result.format).toBe('csv');
      expect(result.data).toContain('code,name,type');
    });
  });

  describe('importChartOfAccounts', () => {
    it('imports valid accounts', async () => {
      prisma.account.findFirst.mockResolvedValue(null);
      prisma.account.create.mockResolvedValue({ id: 'a1', code: '1000', name: 'Assets' });

      const result = await service.importChartOfAccounts(
        [{ code: '1000', name: 'Assets', type: 'ASSET', category: 'CURRENT_ASSET' }],
        'company-1',
        'user-1',
      );
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty import data', async () => {
      await expect(service.importChartOfAccounts([], 'company-1', 'user-1')).rejects.toThrow('Import data is empty');
    });

    it('skips duplicate codes and reports errors', async () => {
      prisma.account.findFirst.mockResolvedValue({ id: 'existing' });

      const result = await service.importChartOfAccounts(
        [{ code: '1000', name: 'Assets', type: 'ASSET', category: 'CURRENT_ASSET' }],
        'company-1',
        'user-1',
      );
      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
