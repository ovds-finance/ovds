import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DoubleEntryService } from '@ovds/domains-double-entry';

function buildPrismaMock() {
  const accountStore = new Map<string, any>();
  return {
    account: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockImplementation((args: any) => {
        const ids = args?.where?.id?.in ?? [];
        return Promise.resolve(ids.map((id: string) => accountStore.get(id)).filter(Boolean));
      }),
      create: vi.fn().mockImplementation((args: any) => {
        const acc = { id: `acc-${Date.now()}`, ...args.data };
        accountStore.set(acc.id, acc);
        return Promise.resolve(acc);
      }),
    },
    journalEntry: {
      create: vi.fn().mockResolvedValue({ id: 'je-1', journalLine: [] }),
    },
    journalLine: {
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
  };
}

function buildAuditMock() {
  return {
    log: vi.fn().mockResolvedValue({}),
  };
}

describe('DoubleEntryService — Comparative BS & Financial Notes', () => {
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

  describe('getComparativeBalanceSheet', () => {
    it('returns comparative structure with current and prior periods', async () => {
      prisma.journalLine.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      const result = await service.getComparativeBalanceSheet({
        companyId: 'company-1',
        asOfCurrent: '2026-12-31',
        asOfPrior: '2025-12-31',
      });
      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('liabilities');
      expect(result).toHaveProperty('equity');
      expect(result).toHaveProperty('asOfCurrent');
      expect(result).toHaveProperty('asOfPrior');
      expect(result).toHaveProperty('isBalancedCurrent');
      expect(result).toHaveProperty('isBalancedPrior');
    });
  });

  describe('getFinancialNotes', () => {
    it('returns IFRS disclosure notes', async () => {
      prisma.journalLine.findMany.mockResolvedValue([]);
      prisma.journalLine.groupBy.mockResolvedValue([]);

      const result = await service.getFinancialNotes({
        companyId: 'company-1',
        from: '2026-01-01',
        to: '2026-12-31',
        asOf: '2026-12-31',
      });

      expect(result.totalNotes).toBeGreaterThan(0);
      expect(result.notes.length).toBeGreaterThan(0);
      expect(result.notes[0]).toHaveProperty('noteNumber');
      expect(result.notes[0]).toHaveProperty('title');
      expect(result.notes[0]).toHaveProperty('content');
      expect(result.notes[0]).toHaveProperty('ifrsReference');
    });

    it('includes fixed asset note when fixed assets exist', async () => {
      const faAcc = { id: 'fa-1', code: '1500', name: 'Machinery', type: 'ASSET', category: 'FIXED_ASSET' };
      (prisma.account.create as any).mockResolvedValue(faAcc);
      await (prisma.account.create as any)({ data: faAcc });
      prisma.journalLine.groupBy.mockResolvedValue([{ accountId: 'fa-1', _sum: { debit: 50000, credit: 0 } }]);
      prisma.account.findMany.mockResolvedValue([faAcc]);

      const result = await service.getFinancialNotes({
        companyId: 'company-1',
        from: '2026-01-01',
        to: '2026-12-31',
      });

      const faNote = result.notes.find((n: any) => n.title === 'Property, Plant and Equipment');
      expect(faNote).toBeDefined();
      expect(faNote.ifrsReference).toBe('IAS 16');
    });

    it('includes inventory note when inventory exists', async () => {
      const invAcc = { id: 'inv-1', code: '1200', name: 'Stock', type: 'ASSET', category: 'INVENTORY' };
      (prisma.account.create as any).mockResolvedValue(invAcc);
      await (prisma.account.create as any)({ data: invAcc });
      prisma.journalLine.groupBy.mockResolvedValue([{ accountId: 'inv-1', _sum: { debit: 20000, credit: 0 } }]);
      prisma.account.findMany.mockResolvedValue([invAcc]);

      const result = await service.getFinancialNotes({
        companyId: 'company-1',
        from: '2026-01-01',
        to: '2026-12-31',
      });

      const invNote = result.notes.find((n: any) => n.title === 'Inventories');
      expect(invNote).toBeDefined();
      expect(invNote.ifrsReference).toBe('IAS 2');
    });

    it('includes trade receivables note when AR exists', async () => {
      const arAcc = { id: 'ar-1', code: '1100', name: 'Debtors', type: 'ASSET', category: 'ACCOUNTS_RECEIVABLE' };
      (prisma.account.create as any).mockResolvedValue(arAcc);
      await (prisma.account.create as any)({ data: arAcc });
      prisma.journalLine.groupBy.mockResolvedValue([{ accountId: 'ar-1', _sum: { debit: 15000, credit: 0 } }]);
      prisma.account.findMany.mockResolvedValue([arAcc]);

      const result = await service.getFinancialNotes({
        companyId: 'company-1',
        from: '2026-01-01',
        to: '2026-12-31',
      });

      const arNote = result.notes.find((n: any) => n.title === 'Trade Receivables');
      expect(arNote).toBeDefined();
      expect(arNote.ifrsReference).toBe('IFRS 7, IFRS 9');
    });
  });
});
