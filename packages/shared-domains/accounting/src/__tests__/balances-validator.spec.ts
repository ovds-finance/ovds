import { BalancesValidatorListener } from '../balances-validator.listener';
import { PrismaClient } from '@ovds/database';

describe('BalancesValidator', () => {
  let listener: BalancesValidatorListener;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = { journalLine: { findMany: jest.fn() } };
    listener = new BalancesValidatorListener();
    (listener as any).prisma = mockPrisma;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should pass if within epsilon', async () => {
    mockPrisma.journalLine.findMany.mockResolvedValueOnce([
      { debit: '100.0001', credit: '0.0000' }, { debit: '0.0000', credit: '100.0002' }
    ]);
    const breachSpy = jest.spyOn(listener as any, 'handleImbalancedLedgerBreach');
    await listener.handleJournalEntryVerification({ entryId: 'e1', tenantId: 't1' });
    expect(breachSpy).not.toHaveBeenCalled();
  });

  it('should flag imbalance over epsilon', async () => {
    mockPrisma.journalLine.findMany.mockResolvedValueOnce([
      { debit: '50.0005', credit: '0.0000' }, { debit: '50.0000', credit: '100.0007' }
    ]);
    const breachSpy = jest.spyOn(listener as any, 'handleImbalancedLedgerBreach');
    await listener.handleJournalEntryVerification({ entryId: 'e2', tenantId: 't2' });
    expect(breachSpy).toHaveBeenCalled();
  });
});
