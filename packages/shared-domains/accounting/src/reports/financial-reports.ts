import { PrismaClient, Prisma, AccountType, JournalEntryStatus } from '@ovds/database';
import { BalancesValidator } from '../balances/balances-validator';

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

export interface FinancialReportData {
  period: ReportPeriod;
  generatedAt: Date;
  accounts: ReportAccount[];
  totals: ReportTotals;
}

export interface ReportAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  debitTurnover: number;
  creditTurnover: number;
  closingBalance: number;
  level: number;
}

export interface ReportTotals {
  totalDebits: number;
  totalCredits: number;
  netIncome: number;
}

export class FinancialReportGenerator {
  private validator: BalancesValidator;

  constructor(private prisma: PrismaClient) {
    this.validator = new BalancesValidator(prisma);
  }

  async generateTrialBalance(
    tenantId: string,
    period: ReportPeriod
  ): Promise<FinancialReportData> {
    const balances = await this.validator.getAccountBalances(tenantId, period.endDate);
    const openingBalances = await this.getOpeningBalances(tenantId, period.startDate);

    const accounts: ReportAccount[] = balances.map(b => {
      const opening = openingBalances.get(b.accountId) || 0;
      const debitTurnover = b.debitTotal;
      const creditTurnover = b.creditTotal;
      const closingBalance = opening + debitTurnover - creditTurnover;

      return {
        id: b.accountId,
        code: b.accountCode,
        name: b.accountName,
        type: b.accountType,
        currency: b.currency,
        openingBalance: opening,
        debitTurnover,
        creditTurnover,
        closingBalance,
        level: 0,
      };
    });

    const totals = this.calculateTotals(accounts);

    return {
      period,
      generatedAt: new Date(),
      accounts,
      totals,
    };
  }

  async generateBalanceSheet(
    tenantId: string,
    asOfDate: Date
  ): Promise<FinancialReportData> {
    const period: ReportPeriod = {
      startDate: new Date(asOfDate.getFullYear(), 0, 1),
      endDate: asOfDate,
    };

    const trialBalance = await this.generateTrialBalance(tenantId, period);

    return {
      ...trialBalance,
      accounts: trialBalance.accounts.filter(a =>
        a.type === AccountType.ASSET || a.type === AccountType.LIABILITY || a.type === AccountType.EQUITY
      ),
    };
  }

  async generateIncomeStatement(
    tenantId: string,
    period: ReportPeriod
  ): Promise<FinancialReportData> {
    const trialBalance = await this.generateTrialBalance(tenantId, period);

    return {
      ...trialBalance,
      accounts: trialBalance.accounts.filter(a =>
        a.type === AccountType.REVENUE || a.type === AccountType.EXPENSE
      ),
    };
  }

  async generateGeneralLedger(
    tenantId: string,
    accountId: string,
    period: ReportPeriod
  ): Promise<{
    account: ReportAccount;
    entries: GeneralLedgerEntry[];
  }> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId, tenantId },
    });

    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        tenantId,
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          postedAt: { gte: period.startDate, lte: period.endDate },
        },
      },
      include: {
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            postedAt: true,
            description: true,
            reference: true,
          },
        },
      },
      orderBy: [
        { journalEntry: { postedAt: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });

    const openingBalance = await this.getAccountOpeningBalance(accountId, period.startDate);
    let runningBalance = openingBalance;

    const entries: GeneralLedgerEntry[] = lines.map(line => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      runningBalance += debit - credit;

      return {
        date: line.journalEntry.postedAt!,
        entryNumber: line.journalEntry.entryNumber,
        description: line.journalEntry.description,
        reference: line.journalEntry.reference,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        currency: account.currency,
        openingBalance,
        debitTurnover: lines.reduce((sum, l) => sum + Number(l.debit), 0),
        creditTurnover: lines.reduce((sum, l) => sum + Number(l.credit), 0),
        closingBalance: runningBalance,
        level: 0,
      },
      entries,
    };
  }

  private async getOpeningBalances(
    tenantId: string,
    startDate: Date
  ): Promise<Map<string, number>> {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        tenantId,
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          postedAt: { lt: startDate },
        },
      },
      select: { accountId: true, debit: true, credit: true },
    });

    const balances = new Map<string, number>();
    for (const line of lines) {
      const current = balances.get(line.accountId) || 0;
      balances.set(line.accountId, current + Number(line.debit) - Number(line.credit));
    }

    return balances;
  }

  private async getAccountOpeningBalance(
    accountId: string,
    startDate: Date
  ): Promise<number> {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        journalEntry: {
          status: JournalEntryStatus.POSTED,
          postedAt: { lt: startDate },
        },
      },
      select: { debit: true, credit: true },
    });

    return lines.reduce((sum, l) => sum + Number(l.debit) - Number(l.credit), 0);
  }

  private calculateTotals(accounts: ReportAccount[]): ReportTotals {
    return {
      totalDebits: accounts.reduce((sum, a) => sum + a.debitTurnover, 0),
      totalCredits: accounts.reduce((sum, a) => sum + a.creditTurnover, 0),
      netIncome: accounts
        .filter(a => a.type === AccountType.REVENUE || a.type === AccountType.EXPENSE)
        .reduce((sum, a) => {
          const balance = a.closingBalance - a.openingBalance;
          return a.type === AccountType.REVENUE ? sum + balance : sum - balance;
        }, 0),
    };
  }
}

export interface GeneralLedgerEntry {
  date: Date;
  entryNumber: string;
  description: string;
  reference: string | null;
  debit: number;
  credit: number;
  balance: number;
}
