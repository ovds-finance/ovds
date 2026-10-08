import { PrismaClient, Prisma, JournalEntryStatus } from '@ovds/database';
import { BalancesValidator } from '../balances/balances-validator';
import { CurrencyConverter } from '../currency/currency-converter';

export interface LedgerSyncResult {
  success: boolean;
  syncedEntries: number;
  failedEntries: number;
  errors: SyncError[];
}

export interface SyncError {
  journalEntryId: string;
  error: string;
}

export interface PostingOptions {
  validateBalances?: boolean;
  allowUnbalanced?: boolean;
  postedBy: string;
}

export class LedgerSyncService {
  private validator: BalancesValidator;
  private converter: CurrencyConverter;

  constructor(private prisma: PrismaClient) {
    this.validator = new BalancesValidator(prisma);
    this.converter = new CurrencyConverter(prisma);
  }

  async postJournalEntry(
    tenantId: string,
    journalEntryId: string,
    options: PostingOptions
  ): Promise<LedgerSyncResult> {
    const errors: SyncError[] = [];
    let syncedEntries = 0;
    let failedEntries = 0;

    try {
      const entry = await this.prisma.journalEntry.findUnique({
        where: { id: journalEntryId, tenantId },
        include: { journalLine: { include: { account: true } } },
      });

      if (!entry) {
        throw new Error(`Journal entry ${journalEntryId} not found`);
      }

      if (entry.status !== JournalEntryStatus.DRAFT) {
        throw new Error(`Journal entry ${journalEntryId} is not in DRAFT status`);
      }

      const validation = await this.validator.validateDoubleEntry(tenantId, journalEntryId);
      if (!validation.isValid && !options.allowUnbalanced) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      await this.prisma.$transaction(async (tx) => {
await tx.journalEntry.update({
            where: { id: journalEntryId },
            data: {
              status: JournalEntryStatus.POSTED,
              postedAt: new Date(),
              postedBy: options.postedBy,
            },
          });

        if (options.validateBalances) {
          const balanceValidation = await this.validator.validateAccountBalances(
            tenantId,
            entry.date
          );
          if (!balanceValidation.isValid) {
            console.warn('Balance validation warnings after posting:', balanceValidation.warnings);
          }
        }
      });

      syncedEntries = 1;
    } catch (error) {
      failedEntries = 1;
      errors.push({
        journalEntryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return {
      success: failedEntries === 0,
      syncedEntries,
      failedEntries,
      errors,
    };
  }

  async postMultipleEntries(
    tenantId: string,
    journalEntryIds: string[],
    options: PostingOptions
  ): Promise<LedgerSyncResult> {
    const results = await Promise.all(
      journalEntryIds.map(id => this.postJournalEntry(tenantId, id, options))
    );

    return {
      success: results.every(r => r.success),
      syncedEntries: results.reduce((sum, r) => sum + r.syncedEntries, 0),
      failedEntries: results.reduce((sum, r) => sum + r.failedEntries, 0),
      errors: results.flatMap(r => r.errors),
    };
  }

  async reverseJournalEntry(
    tenantId: string,
    journalEntryId: string,
    reversedBy: string,
    reversalDate: Date = new Date()
  ): Promise<LedgerSyncResult> {
    const errors: SyncError[] = [];
    let syncedEntries = 0;
    let failedEntries = 0;

    try {
      const originalEntry = await this.prisma.journalEntry.findUnique({
        where: { id: journalEntryId, tenantId },
        include: { journalLine: true },
      });

      if (!originalEntry) {
        throw new Error(`Journal entry ${journalEntryId} not found`);
      }

      if (originalEntry.status !== JournalEntryStatus.POSTED) {
        throw new Error(`Only POSTED entries can be reversed`);
      }

      if (originalEntry.reversedAt) {
        throw new Error(`Journal entry ${journalEntryId} has already been reversed`);
      }

      await this.prisma.$transaction(async (tx) => {
        const reversalEntry = await tx.journalEntry.create({
          data: {
            entryNumber: `REV-${originalEntry.entryNumber}`,
            date: reversalDate,
            description: `Reversal of ${originalEntry.entryNumber}: ${originalEntry.description}`,
            reference: originalEntry.id,
            status: JournalEntryStatus.POSTED,
            tenantId,
            postedAt: reversalDate,
            postedBy: reversedBy,
            journalLine: {
              create: originalEntry.journalLine.map(line => ({
                accountId: line.accountId,
                tenantId,
                debit: line.credit,
                credit: line.debit,
                description: `Reversal: ${line.description || ''}`,
                sortOrder: line.sortOrder,
              })),
            },
          },
        });

        await tx.journalEntry.update({
          where: { id: journalEntryId },
          data: {
            status: JournalEntryStatus.REVERSED,
            reversedAt: reversalDate,
            reversedBy,
          },
        });

        syncedEntries = 1;
      });
    } catch (error) {
      failedEntries = 1;
      errors.push({
        journalEntryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return {
      success: failedEntries === 0,
      syncedEntries,
      failedEntries,
      errors,
    };
  }

  async voidJournalEntry(
    tenantId: string,
    journalEntryId: string,
    voidedBy: string
  ): Promise<LedgerSyncResult> {
    const errors: SyncError[] = [];
    let syncedEntries = 0;
    let failedEntries = 0;

    try {
      const entry = await this.prisma.journalEntry.findUnique({
        where: { id: journalEntryId, tenantId },
      });

      if (!entry) {
        throw new Error(`Journal entry ${journalEntryId} not found`);
      }

      if (entry.status === JournalEntryStatus.POSTED) {
        throw new Error(`Cannot void a POSTED entry. Reverse it first.`);
      }

      await this.prisma.journalEntry.update({
        where: { id: journalEntryId },
        data: {
          status: JournalEntryStatus.VOIDED,
        },
      });

      syncedEntries = 1;
    } catch (error) {
      failedEntries = 1;
      errors.push({
        journalEntryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return {
      success: failedEntries === 0,
      syncedEntries,
      failedEntries,
      errors,
    };
  }

  async recalculateBalances(tenantId: string, asOfDate: Date): Promise<void> {
    const balances = await this.validator.getAccountBalances(tenantId, asOfDate);
    console.log(`Recalculated ${balances.length} account balances for tenant ${tenantId}`);
  }

  async generateFinancialStatements(tenantId: string, asOfDate: Date): Promise<{
    balanceSheet: any;
    incomeStatement: any;
  }> {
    const trialBalance = await this.validator.getTrialBalance(tenantId, asOfDate);

    const balanceSheet = {
      assets: trialBalance.filter(b => b.accountType === 'ASSET'),
      liabilities: trialBalance.filter(b => b.accountType === 'LIABILITY'),
      equity: trialBalance.filter(b => b.accountType === 'EQUITY'),
    };

    const incomeStatement = {
      revenue: trialBalance.filter(b => b.accountType === 'REVENUE'),
      expenses: trialBalance.filter(b => b.accountType === 'EXPENSE'),
    };

    return { balanceSheet, incomeStatement };
  }
}
