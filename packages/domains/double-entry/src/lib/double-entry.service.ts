import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseService, IAuditLogger, IPrismaClient } from '@ovds/domains-infrastructure';
import { Prisma } from '@ovds/database';

export interface CreateJournalEntryInput {
  date?: string;
  reference?: string;
  description: string;
  companyId?: string;
  lines: Array<{
    accountId: string;
    description?: string;
    debit?: number;
    credit?: number;
    costCenterId?: string;
  }>;
}

export interface UpdateJournalEntryInput {
  date?: string;
  reference?: string;
  description?: string;
  status?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  companyId: string;
  status: string;
  createdAt: string;
}

/**
 * Precision used by Prisma's Decimal field (@db.Decimal(20, 4)).
 * Two amounts must match within this tolerance to be considered balanced.
 */
const BALANCE_TOLERANCE = 0.0001;

@Injectable()
export class DoubleEntryService extends BaseService {
  constructor(prisma: IPrismaClient, audit: IAuditLogger) {
    super(prisma, audit, 'DoubleEntryService');
  }

  /**
   * Post a balanced double-entry journal entry inside an atomic transaction.
   *
   * Guarantees (GAAP / IFRS):
   *   1. Total debits must equal total credits (within decimal tolerance).
   *   2. No negative amounts are accepted.
   *   3. Every line's account must belong to the requesting company.
   *   4. The journal entry and all journal lines are written in a single
   *      Prisma $transaction — partial writes are impossible.
   */
  async createJournalEntry(data: CreateJournalEntryInput, userId: string): Promise<JournalEntry> {
    const { lines, companyId, description, date, reference } = data;

    if (!companyId) {
      throw new BadRequestException('companyId is required to create a journal entry.');
    }
    if (!lines || lines.length === 0) {
      throw new BadRequestException('At least one journal line is required.');
    }

    // 1. Enforce Double-Entry Mathematical Balancing
    let totalDebits = new Prisma.Decimal(0);
    let totalCredits = new Prisma.Decimal(0);

    for (const line of lines) {
      const debit = new Prisma.Decimal(line.debit ?? 0);
      const credit = new Prisma.Decimal(line.credit ?? 0);

      if (debit.isNegative() || credit.isNegative()) {
        throw new BadRequestException('Transaction values cannot be negative numbers.');
      }

      totalDebits = totalDebits.plus(debit);
      totalCredits = totalCredits.plus(credit);
    }

    // GAAP Requirement: Absolute validation ensuring zero unbalanced adjustments
    if (totalDebits.minus(totalCredits).abs().greaterThan(BALANCE_TOLERANCE)) {
      throw new BadRequestException(
        `Accounting Equation Mismatch: Total Debits (${totalDebits.toString()}) ` +
          `must exactly equal Total Credits (${totalCredits.toString()}).`,
      );
    }

    // 2. Atomic Database Multi-Tenant Execution Context
    const txClient = this.prisma.$transaction as unknown as <T>(
      fn: (tx: any) => Promise<T>,
    ) => Promise<T>;

    return txClient(async (tx: any) => {
      // Confirm all impacted accounts belong solely to the requesting company context
      const uniqueAccountIds = [...new Set(lines.map((l) => l.accountId))];
      const accountsCount = await tx.account.count({
        where: {
          id: { in: uniqueAccountIds },
          companyId,
        },
      });

      if (accountsCount !== uniqueAccountIds.length) {
        throw new BadRequestException('Unauthorized Account Scope: Invalid account cross-tenancy detected.');
      }

      // Record Root Journal Entry
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          date: date ? new Date(date) : new Date(),
          reference,
          description,
          status: 'POSTED',
          postedBy: userId,
        },
      });

      // Populate Distributed Ledger Lines
      const lineCreates = lines.map((line) =>
        tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.debit ?? 0),
            credit: new Prisma.Decimal(line.credit ?? 0),
            description: line.description,
            costCenterId: line.costCenterId,
            companyId,
          },
        }),
      );

      await Promise.all(lineCreates);

      this.audit(userId, 'journal_entry_created', `Created journal entry ${entry.id}`, companyId);

      return {
        id: entry.id,
        date: entry.date.toISOString(),
        description: entry.description ?? '',
        companyId: entry.companyId ?? '',
        status: entry.status,
        createdAt: entry.createdAt.toISOString(),
      };
    });
  }

  async updateJournalEntry(id: string, data: UpdateJournalEntryInput, userId: string, companyId?: string): Promise<JournalEntry> {
    return data as unknown as JournalEntry;
  }

  async deleteJournalEntry(id: string, userId: string, companyId?: string): Promise<{ success: boolean; id: string }> {
    return { success: true, id };
  }

  async getJournalEntries(params: { companyId?: string; from?: string; to?: string }): Promise<JournalEntry[]> {
    return [];
  }

  async postJournalEntry(id: string): Promise<JournalEntry> {
    return {} as JournalEntry;
  }

  async reverseJournalEntry(id: string, date?: string): Promise<JournalEntry> {
    return {} as JournalEntry;
  }
}
