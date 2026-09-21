import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FiscalYearService } from '@ovds/domains-double-entry';

function buildPrismaMock() {
  return {
    fiscalYear: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'fy-1', year: 2026, status: 'OPEN', isCurrent: true }),
      update: vi.fn().mockResolvedValue({ id: 'fy-1', status: 'CLOSED' }),
    },
    account: {
      findFirst: vi.fn().mockResolvedValue({ id: 're-1', name: 'Retained Earnings' }),
      findMany: vi.fn().mockResolvedValue([
        { id: 'acc-1', code: '4000', name: 'Revenue', type: 'INCOME', category: 'REVENUE' },
        { id: 'acc-2', code: '5000', name: 'Expenses', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
      ]),
    },
    journalEntry: {
      create: vi.fn().mockResolvedValue({ id: 'je-1', journalLine: [] }),
    },
    journalLine: {
      groupBy: vi.fn().mockResolvedValue([
        { accountId: 'acc-1', _sum: { debit: 1000, credit: 0 } },
        { accountId: 'acc-2', _sum: { debit: 0, credit: 1000 } },
      ]),
    },
    $transaction: vi.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
  };
}

function buildAuditMock() {
  return {
    log: vi.fn().mockResolvedValue({}),
  };
}

describe('FiscalYearService', () => {
  let service: FiscalYearService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let audit: ReturnType<typeof buildAuditMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    audit = buildAuditMock();
    service = new FiscalYearService(prisma as any, audit as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFiscalYears', () => {
    it('returns fiscal years for a company', async () => {
      prisma.fiscalYear.findMany.mockResolvedValue([
        { id: 'fy-1', year: 2026, status: 'OPEN' },
      ]);
      const result = await service.getFiscalYears('company-1');
      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2026);
    });
  });

  describe('getCurrentFiscalYear', () => {
    it('returns current fiscal year when exists', async () => {
      prisma.fiscalYear.findFirst.mockResolvedValue({ id: 'fy-1', year: 2026, isCurrent: true });
      const result = await service.getCurrentFiscalYear('company-1');
      expect(result?.year).toBe(2026);
    });

    it('returns null when no current fiscal year', async () => {
      prisma.fiscalYear.findFirst.mockResolvedValue(null);
      const result = await service.getCurrentFiscalYear('company-1');
      expect(result).toBeNull();
    });
  });

  describe('createFiscalYear', () => {
    it('creates a fiscal year with valid data', async () => {
      const result = await service.createFiscalYear({
        year: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        companyId: 'company-1',
      }, 'user-1');
      expect(result.year).toBe(2026);
      expect(prisma.fiscalYear.create).toHaveBeenCalled();
    });

    it('rejects duplicate fiscal year', async () => {
      prisma.fiscalYear.findFirst.mockResolvedValue({ id: 'fy-1', year: 2026 });
      await expect(service.createFiscalYear({
        year: 2026,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        companyId: 'company-1',
      }, 'user-1')).rejects.toThrow('Fiscal year 2026 already exists');
    });
  });

  describe('closeFiscalYear', () => {
    it('closes fiscal year and creates closing entries', async () => {
      prisma.journalLine.groupBy.mockResolvedValue([
        { accountId: 'acc-1', _sum: { debit: 1000, credit: 0 } },
        { accountId: 'acc-2', _sum: { debit: 0, credit: 1000 } },
      ]);
      prisma.account.findMany.mockResolvedValue([
        { id: 'acc-1', code: '4000', name: 'Revenue', type: 'INCOME', category: 'REVENUE' },
        { id: 'acc-2', code: '5000', name: 'Expenses', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
      ]);
      prisma.fiscalYear.findFirst.mockResolvedValue({ id: 'fy-1', year: 2026, status: 'OPEN', isCurrent: true });

      const result = await service.closeFiscalYear({ companyId: 'company-1', year: 2026 }, 'user-1');
      expect(result.fiscalYear.status).toBe('CLOSED');
      expect(result.netIncome).toBeDefined();
    });

    it('rejects closing already closed fiscal year', async () => {
      prisma.fiscalYear.findFirst.mockResolvedValue({ id: 'fy-1', year: 2026, status: 'CLOSED' });
      await expect(service.closeFiscalYear({ companyId: 'company-1', year: 2026 }, 'user-1')).rejects.toThrow('already closed');
    });
  });
});
