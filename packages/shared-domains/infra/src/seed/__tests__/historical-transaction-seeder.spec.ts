import { HistoricalTransactionSeederService } from '../historical-transaction-seeder.service';

describe('Historical Transaction Seeder Structural Parity Verification', () => {
  let seederService: HistoricalTransactionSeederService;
  let mockExtendedPrisma: any;

  beforeEach(() => {
    seederService = new HistoricalTransactionSeederService();

    mockExtendedPrisma = {
      accountType: {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', code: '10100', classification: 'ASSET' },
          { id: '2', code: '40100', classification: 'REVENUE' },
          { id: '3', code: '50100', classification: 'EXPENSE' },
          { id: '4', code: '20100', classification: 'LIABILITY' },
        ])
      },
      journalEntry: {
        create: jest.fn().mockResolvedValue({ id: 'entry-canary-uuid' })
      },
      journalLine: {
        createMany: jest.fn().mockResolvedValue({ count: 2 })
      },
      $transaction: jest.fn((callback) => callback(mockExtendedPrisma))
    };

    jest.spyOn(require('@ovds/infra/createTenantClient'), 'createTenantClient')
      .mockReturnValue(mockExtendedPrisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should verify that all seeded historical entries generate matching paired double-entry credit and debit lines', async () => {
    const outcome = await seederService.generateBalancedHistory('tenant-benchmark-id', 10);

    expect(outcome.linesGenerated).toBe(20);
    expect(mockExtendedPrisma.journalEntry.create).toHaveBeenCalledTimes(10);
    expect(mockExtendedPrisma.journalLine.createMany).toHaveBeenCalledTimes(10);
  });
});
