/**
 * FiscalYearService — domain lib
 *
 * Handles fiscal year definition, year-end closing entries, and opening balance
 * creation. Implements the standard accounting closing process:
 *
 *   1. Close Revenue accounts → Income Summary
 *   2. Close Expense accounts → Income Summary
 *   3. Close Income Summary → Retained Earnings
 *   4. Create opening balances for new fiscal year
 *
 * The closing entries zero out all temporary accounts (revenue, expense) and
 * transfer net income to retained earnings, readying the books for the new year.
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  BaseService,
  IAuditLogger,
  IPrismaClient,
} from '@ovds/domains/infrastructure';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FiscalYear {
  id?: string;
  companyId?: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'CLOSING';
  isCurrent: boolean;
  closedAt?: string;
  closedBy?: string;
  closingEntryId?: string;
  openingEntryId?: string;
  notes?: string;
}

export interface CloseYearInput {
  companyId?: string;
  year: number;
  notes?: string;
}

export interface OpeningBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

// ── Account type classifications ───────────────────────────────────────────────

const REVENUE_CATEGORIES = ['REVENUE', 'OTHER_INCOME'];
const EXPENSE_CATEGORIES = ['OPERATING_EXPENSE', 'OTHER_EXPENSE', 'COST_OF_GOODS_SOLD'];
const EQUITY_CATEGORIES = ['EQUITY'];
const ASSET_CATEGORIES = ['ASSET', 'CURRENT_ASSET', 'FIXED_ASSET', 'BANK', 'CASH', 'ACCOUNTS_RECEIVABLE', 'INVENTORY'];
const LIABILITY_CATEGORIES = ['LIABILITY', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'ACCOUNTS_PAYABLE'];

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class FiscalYearService extends BaseService {
  constructor(prisma: IPrismaClient, audit: IAuditLogger) {
    super(prisma, audit, 'FiscalYearService');
  }

  // ── Fiscal Year CRUD ─────────────────────────────────────────────────────────

  async getFiscalYears(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.prisma.fiscalYear.findMany({
      where,
      orderBy: { year: 'desc' },
    });
  }

  async getCurrentFiscalYear(companyId?: string) {
    const where: any = { isCurrent: true };
    if (companyId) where.companyId = companyId;
    const fy = await this.prisma.fiscalYear.findFirst({ where });
    return fy;
  }

  async getOrCreateCurrentFiscalYear(companyId: string): Promise<FiscalYear> {
    let fy = await this.getCurrentFiscalYear(companyId);
    if (fy) return fy;

    const now = new Date();
    const year = now.getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    fy = await this.prisma.fiscalYear.create({
      data: {
        year,
        startDate,
        endDate,
        status: 'OPEN',
        isCurrent: true,
        companyId,
      },
    });

    this.audit('system', 'CREATE_FISCAL_YEAR', fy.id, companyId);
    return fy as FiscalYear;
  }

  async createFiscalYear(data: FiscalYear, userId: string) {
    if (!data.year) throw new BadRequestException('Fiscal year is required');
    if (!data.startDate) throw new BadRequestException('Start date is required');
    if (!data.endDate) throw new BadRequestException('End date is required');

    const existing = await this.prisma.fiscalYear.findFirst({
      where: { companyId: data.companyId ?? null, year: data.year },
    });
    if (existing) throw new BadRequestException(`Fiscal year ${data.year} already exists`);

    const fy = await this.prisma.fiscalYear.create({
      data: {
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || 'OPEN',
        isCurrent: data.isCurrent ?? false,
        notes: data.notes?.trim() ?? null,
        companyId: data.companyId ?? null,
      },
    });

    this.audit(userId, 'CREATE_FISCAL_YEAR', fy.id, data.companyId);
    return fy;
  }

  async updateFiscalYear(id: string, data: Partial<FiscalYear>, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.fiscalYear.findFirst({ where });
    if (!existing) throw new NotFoundException('Fiscal year not found');
    if (existing.status === 'CLOSED') {
      throw new BadRequestException('Cannot modify a closed fiscal year');
    }

    const updated = await this.prisma.fiscalYear.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isCurrent !== undefined && { isCurrent: data.isCurrent }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() ?? null }),
      },
    });

    this.audit(userId, 'UPDATE_FISCAL_YEAR', id, companyId ?? existing.companyId ?? undefined);
    return updated;
  }

  // ── Year-End Closing ─────────────────────────────────────────────────────────

  /**
   * Performs year-end closing for the specified fiscal year.
   *
   * Process:
   *   1. Validate trial balance is balanced
   *   2. Close Revenue accounts (debit revenue, credit Income Summary)
   *   3. Close Expense accounts (credit expense, debit Income Summary)
   *   4. Close Income Summary to Retained Earnings
   *   5. Mark fiscal year as CLOSED
   *   6. Create next fiscal year if needed
   */
  async closeFiscalYear(input: CloseYearInput, userId: string) {
    const { companyId, year, notes } = input;
    if (!companyId) throw new BadRequestException('Company ID is required');
    if (!year) throw new BadRequestException('Fiscal year is required');

    const fy = await this.prisma.fiscalYear.findFirst({
      where: { companyId, year },
    });
    if (!fy) throw new NotFoundException(`Fiscal year ${year} not found`);
    if (fy.status === 'CLOSED') throw new BadRequestException(`Fiscal year ${year} is already closed`);

    const periodEnd = fy.endDate;
    const trialBalance = await this.getTrialBalanceForClosing(companyId, periodEnd);

    if (!trialBalance.isBalanced) {
      throw new BadRequestException(
        `Cannot close fiscal year — trial balance is unbalanced. ` +
        `Difference: ETB ${trialBalance.difference.toFixed(2)}. Resolve before closing.`,
      );
    }

    const revenueTotal = trialBalance.revenueRows.reduce((s, r) => s + r.normalizedBalance, 0);
    const expenseTotal = trialBalance.expenseRows.reduce((s, r) => s + r.normalizedBalance, 0);
    const netIncome = revenueTotal - expenseTotal;

    const retainedEarningsAccount = await this.findRetainedEarningsAccount(companyId);
    if (!retainedEarningsAccount) {
      throw new BadRequestException(
        'Retained Earnings account not found. Create a "Retained Earnings" account under Equity (3000) before closing.',
      );
    }

    const closingEntries: any[] = [];
    const entryDate = periodEnd;
    const reference = `FY-CLOSE-${year}`;

    // Step 1: Close Revenue accounts
    for (const row of trialBalance.revenueRows) {
      if (Math.abs(row.normalizedBalance) < 0.01) continue;
      closingEntries.push({
        date: entryDate,
        reference: `${reference}-REV-${row.accountCode}`,
        description: `FY${year} close: Revenue ${row.accountCode} — ${row.accountName}`,
        status: 'POSTED',
        companyId,
        postedBy: userId,
        journalLine: {
          create: [
            {
              accountId: row.accountId,
              description: `Close revenue ${row.accountCode}`,
              debit: Math.abs(row.normalizedBalance),
              credit: 0,
              companyId,
            },
            {
              accountId: retainedEarningsAccount.id,
              description: `Close revenue ${row.accountCode} to Retained Earnings`,
              debit: 0,
              credit: Math.abs(row.normalizedBalance),
              companyId,
            },
          ],
        },
      });
    }

    // Step 2: Close Expense accounts
    for (const row of trialBalance.expenseRows) {
      if (Math.abs(row.normalizedBalance) < 0.01) continue;
      closingEntries.push({
        date: entryDate,
        reference: `${reference}-EXP-${row.accountCode}`,
        description: `FY${year} close: Expense ${row.accountCode} — ${row.accountName}`,
        status: 'POSTED',
        companyId,
        postedBy: userId,
        journalLine: {
          create: [
            {
              accountId: retainedEarningsAccount.id,
              description: `Close expense ${row.accountCode} to Retained Earnings`,
              debit: Math.abs(row.normalizedBalance),
              credit: 0,
              companyId,
            },
            {
              accountId: row.accountId,
              description: `Close expense ${row.accountCode}`,
              debit: 0,
              credit: Math.abs(row.normalizedBalance),
              companyId,
            },
          ],
        },
      });
    }

    const createdEntries: any[] = [];
    for (const entryData of closingEntries) {
      try {
        const entry = await this.prisma.journalEntry.create({
          data: entryData,
          include: { journalLine: true },
        });
        createdEntries.push(entry);
      } catch (err: any) {
        this.logger.warn(`Closing entry failed for ${entryData.reference}: ${err?.message}`);
      }
    }

    const closingEntryId = createdEntries.length > 0 ? createdEntries[0].id : null;

    const updatedFy = await this.prisma.fiscalYear.update({
      where: { id: fy.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: userId,
        closingEntryId: closingEntryId ?? undefined,
        notes: notes ? `Year-end close: ${notes}` : `Year-end close: Net income ETB ${netIncome.toFixed(2)}`,
      },
    });

    if (fy.isCurrent) {
      const nextYear = year + 1;
      const nextStartDate = `${nextYear}-01-01`;
      const nextEndDate = `${nextYear}-12-31`;
      await this.prisma.fiscalYear.create({
        data: {
          year: nextYear,
          startDate: nextStartDate,
          endDate: nextEndDate,
          status: 'OPEN',
          isCurrent: true,
          companyId,
        },
      });
      await this.prisma.fiscalYear.update({
        where: { id: fy.id },
        data: { isCurrent: false },
      });
    }

    this.audit(userId, 'FISCAL_YEAR_CLOSE', `FY${year} closed (${createdEntries.length} entries, net income: ETB ${netIncome.toFixed(2)})`, companyId);

    return {
      fiscalYear: updatedFy,
      closingEntries: createdEntries,
      netIncome,
      revenueClosed: revenueTotal,
      expensesClosed: expenseTotal,
      accountsClosed: trialBalance.revenueRows.length + trialBalance.expenseRows.length,
    };
  }

  // ── Opening Balance Creation ─────────────────────────────────────────────────

  /**
   * Creates opening balance journal entries for a fiscal year.
   * Carries forward balance sheet account balances from the prior year.
   */
  async createOpeningBalances(companyId: string, targetYear: number, userId: string): Promise<{ entryId: string; lines: number }> {
    const targetFy = await this.prisma.fiscalYear.findFirst({
      where: { companyId, year: targetYear },
    });
    if (!targetFy) throw new NotFoundException(`Fiscal year ${targetYear} not found`);

    const priorYear = targetYear - 1;
    const priorFy = await this.prisma.fiscalYear.findFirst({
      where: { companyId, year: priorYear },
    });

    const asOfDate = priorFy ? priorFy.endDate : `${priorYear}-12-31`;

    const tb = await this.getTrialBalanceForClosing(companyId, asOfDate);

    const openingLines: any[] = [];
    for (const row of tb.balanceSheetRows) {
      if (Math.abs(row.balance) < 0.01) continue;
      if (REVENUE_CATEGORIES.includes(row.accountCategory) || EXPENSE_CATEGORIES.includes(row.accountCategory)) {
        continue;
      }

      const isDebitNormal = ['ASSET', 'EXPENSE'].includes(row.accountType);
      if (isDebitNormal && row.balance > 0) {
        openingLines.push({
          accountId: row.accountId,
          description: `Opening balance FY${targetYear}`,
          debit: row.balance,
          credit: 0,
          companyId,
        });
      } else if (!isDebitNormal && row.balance > 0) {
        openingLines.push({
          accountId: row.accountId,
          description: `Opening balance FY${targetYear}`,
          debit: 0,
          credit: row.balance,
          companyId,
        });
      } else if (isDebitNormal && row.balance < 0) {
        openingLines.push({
          accountId: row.accountId,
          description: `Opening balance FY${targetYear}`,
          debit: 0,
          credit: Math.abs(row.balance),
          companyId,
        });
      } else if (!isDebitNormal && row.balance < 0) {
        openingLines.push({
          accountId: row.accountId,
          description: `Opening balance FY${targetYear}`,
          debit: Math.abs(row.balance),
          credit: 0,
          companyId,
        });
      }
    }

    if (openingLines.length === 0) {
      return { entryId: '', lines: 0 };
    }

    const entry = await this.prisma.journalEntry.create({
      data: {
        date: targetFy.startDate,
        reference: `FY-OPEN-${targetYear}`,
        description: `Opening balances for fiscal year ${targetYear}`,
        status: 'POSTED',
        companyId,
        postedBy: userId,
        journalLine: {
          create: openingLines,
        },
      },
      include: { journalLine: true },
    });

    await this.prisma.fiscalYear.update({
      where: { id: targetFy.id },
      data: { openingEntryId: entry.id },
    });

    this.audit(userId, 'CREATE_OPENING_BALANCES', entry.id, companyId);
    return { entryId: entry.id, lines: openingLines.length };
  }

  // ── Trial Balance Helper ─────────────────────────────────────────────────────

  private async getTrialBalanceForClosing(companyId: string, asOf: string): Promise<{
    isBalanced: boolean;
    difference: number;
    revenueRows: any[];
    expenseRows: any[];
    balanceSheetRows: any[];
  }> {
    const where: any = { companyId };
    where.journalEntry = { date: { lte: new Date(asOf) } };

    const lines = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      where,
      _sum: { debit: true, credit: true },
    });

    const accountIds = lines.map((l) => l.accountId);
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, code: true, name: true, type: true, category: true },
    });
    const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

    const isDebitNormal = (type?: string) => type === 'ASSET' || type === 'EXPENSE';

    const rows = lines.map((l) => {
      const totalDebit = Number(l._sum.debit ?? 0);
      const totalCredit = Number(l._sum.credit ?? 0);
      const acc = accountMap[l.accountId];
      const balance = totalDebit - totalCredit;
      const normalizedBalance = isDebitNormal(acc?.type) ? totalDebit - totalCredit : totalCredit - totalDebit;
      return {
        accountId: l.accountId,
        accountCode: acc?.code ?? '',
        accountName: acc?.name ?? 'Unknown',
        accountType: acc?.type ?? '',
        accountCategory: acc?.category ?? '',
        totalDebit,
        totalCredit,
        balance,
        normalizedBalance,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.totalDebit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);

    return {
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      difference: totalDebit - totalCredit,
      revenueRows: rows.filter((r) => REVENUE_CATEGORIES.includes(r.accountCategory)),
      expenseRows: rows.filter((r) => EXPENSE_CATEGORIES.includes(r.accountCategory)),
      balanceSheetRows: rows.filter((r) =>
        [...ASSET_CATEGORIES, ...LIABILITY_CATEGORIES, ...EQUITY_CATEGORIES].includes(r.accountCategory),
      ),
    };
  }

  private async findRetainedEarningsAccount(companyId: string): Promise<{ id: string } | null> {
    const account = await this.prisma.account.findFirst({
      where: {
        companyId,
        name: { contains: 'Retained Earnings' },
        type: 'EQUITY',
        isActive: true,
      },
      select: { id: true },
    });
    if (account) return account;

    const parentEquity = await this.prisma.account.findFirst({
      where: { companyId, code: '3000', type: 'EQUITY' },
      select: { id: true },
    });
    if (parentEquity) {
      const subAccount = await this.prisma.account.findFirst({
        where: { companyId, parentId: parentEquity.id, isActive: true },
        select: { id: true },
      });
      if (subAccount) return subAccount;
    }

    return null;
  }
}
