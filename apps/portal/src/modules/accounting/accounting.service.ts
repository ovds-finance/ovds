import { Injectable } from '@nestjs/common';
import { PrismaClient, AccountType, JournalEntryStatus } from '@ovds/database';
import { PrismaClientToken } from '../../prisma/prisma.module';
import { Inject } from '@nestjs/common';
import { BalancesValidator, CurrencyConverter, LedgerSyncService } from '@ovds/shared-domains/accounting';

@Injectable()
export class AccountingService {
  constructor(
    @Inject(PrismaClientToken) private prisma: PrismaClient,
    private balancesValidator: BalancesValidator,
    private currencyConverter: CurrencyConverter,
    private ledgerSync: LedgerSyncService,
  ) {}

  async getAccountBalances(tenantId: string, asOfDate: Date = new Date()) {
    return this.balancesValidator.getAccountBalances(tenantId, asOfDate);
  }

  async getTrialBalance(tenantId: string, asOfDate: Date = new Date()) {
    return this.balancesValidator.getTrialBalance(tenantId, asOfDate);
  }

  async validateJournalEntry(tenantId: string, journalEntryId: string) {
    return this.balancesValidator.validateDoubleEntry(tenantId, journalEntryId);
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date = new Date()
  ) {
    return this.currencyConverter.convert(amount, fromCurrency, toCurrency, date);
  }

  async postJournalEntry(tenantId: string, journalEntryId: string, postedBy: string) {
    return this.ledgerSync.postJournalEntry(tenantId, journalEntryId, { postedBy });
  }

  async reverseJournalEntry(tenantId: string, journalEntryId: string, reversedBy: string) {
    return this.ledgerSync.reverseJournalEntry(tenantId, journalEntryId, reversedBy);
  }

  async getJournalEntries(tenantId: string, params: {
    page?: number;
    limit?: number;
    status?: JournalEntryStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 20, status, startDate, endDate } = params;
    const where: any = { tenantId };

    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: { journalLine: { include: { account: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createJournalEntry(tenantId: string, data: {
    date: Date;
    description: string;
    reference?: string;
    lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>;
  }) {
    const { lines, ...entry } = data;
    return this.prisma.journalEntry.create({
      data: {
        ...entry,
        tenantId,
        entryNumber: await this.generateEntryNumber(tenantId),
        status: JournalEntryStatus.DRAFT,
        journalLine: {
          create: lines.map((line, index) => ({
            ...line,
            tenantId,
            sortOrder: index,
          })),
        },
      },
      include: { journalLine: { include: { account: true } } },
    });
  }

  private async generateEntryNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.journalEntry.count({
      where: {
        tenantId,
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    return `JE-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async getAccounts(tenantId: string, type?: AccountType) {
    return this.prisma.account.findMany({
      where: { tenantId, isActive: true, ...(type && { type }) },
      orderBy: { code: 'asc' },
    });
  }
}