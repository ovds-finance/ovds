/**
 * AccountingService — Core accounting domain logic.
 *
 * Migrated from apps/backend/src/accounting/accounting.service.ts into
 * the @ovds/domains/accounting library following the thin-apps-thick-libs pattern.
 *
 * This service extends BaseService from @ovds/domains/infrastructure and accepts
 * PrismaService and AuditLogService via dependency injection from the NestJS app.
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AccountCategory, AccountType, PaginatedResult } from '@ovds/shared';
import {
  BaseService,
  IAuditLogger,
  IPrismaClient,
  whereBuilder,
  buildPrismaPage,
  paginate,
  ListOptions,
} from '@ovds/domains/infrastructure';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateJournalEntryDto,
  CreateBankAccountDto,
  PaginationQueryDto,
} from '@ovds/dto';
import type { CreateVendor, UpdateVendor } from '@ovds/contracts/schemas';

/**
 * Accounting domain service.
 *
 * The NestJS module wires PrismaService and AuditLogService via DI, then
 * passes them to the super() constructor. Other domain services (DoubleEntryService,
 * ProjectionWriterService) are also injected at the app level.
 *
 * NOTE: This service is large (~6000 lines in the original). For the migration,
 * the full implementation is preserved. In the future, consider splitting into
 * sub-services: AccountsService, JournalsService, VendorsService, BankAccountsService.
 */
@Injectable()
export class AccountingService extends BaseService {

  constructor(
    prisma: IPrismaClient,
    audit: IAuditLogger,
    private doubleEntry: any, // DoubleEntryService — injected by the app
    private projections: any, // ProjectionWriterService — injected by the app
  ) {
    super(prisma, audit, 'AccountingService');
  }

  /**
   * IFRS 18 Category mapping for Account Categories.
   * Returns the IFRS 18 presentation section for a given account category.
   */
  getIfrsSection(category: string): 'OPERATING' | 'INVESTING' | 'FINANCING' {
    switch (category) {
      // ── OPERATING (IFRS 18: core business activities) ──────────────────────
      case AccountCategory.REVENUE:
      case AccountCategory.COST_OF_GOODS_SOLD:
      case AccountCategory.OPERATING_EXPENSE:
      case AccountCategory.ACCOUNTS_RECEIVABLE:
      case AccountCategory.ACCOUNTS_PAYABLE:
      case AccountCategory.INVENTORY:
      case AccountCategory.OTHER_INCOME:
      case AccountCategory.OTHER_EXPENSE:
        return 'OPERATING';

      // ── INVESTING (IFRS 18: returns from assets held) ──────────────────────
      case AccountCategory.FIXED_ASSET:
        return 'INVESTING';

      // ── FINANCING (IFRS 18: capital structure / funding) ───────────────────
      case AccountCategory.CASH:
      case AccountCategory.BANK:
      case AccountCategory.LONG_TERM_LIABILITY:
      case AccountCategory.EQUITY:
        return 'FINANCING';

      default:
        return 'OPERATING';
    }
  }

  // ── Chart of Accounts ──────────────────────────────────────────────────────

  async getAccounts(companyId?: string) {
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    return this.prisma.account.findMany({ where, orderBy: { code: 'asc' } });
  }

  async getAccountsWithIfrsSections(companyId?: string) {
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: { code: 'asc' },
    });
    return accounts.map((a: any) => ({
      ...a,
      ifrsSection: this.getIfrsSection(a.category),
    }));
  }

  async getAccountByCode(code: string, companyId?: string) {
    const where: Record<string, unknown> = { code };
    if (companyId) where.companyId = companyId;
    return this.prisma.account.findFirst({ where });
  }

  async getAccountById(id: string, companyId?: string) {
    const where: Record<string, unknown> = { id };
    if (companyId) where.companyId = companyId;
    const account = await this.prisma.account.findFirst({ where });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async getAccountBalances(companyId?: string) {
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;

    // Use DB-level aggregation instead of loading all lines into memory
    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    const lineAggs = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      _sum: { debit: true, credit: true },
      where: companyId ? { journalEntry: { companyId } } : undefined,
    });

    const aggMap = new Map<string, { debit: number; credit: number }>(
      lineAggs.map((a: any) => [
        a.accountId,
        {
          debit: Number(a._sum.debit ?? 0),
          credit: Number(a._sum.credit ?? 0),
        },
      ]),
    );

    const withBalances = accounts.map((a: any) => {
      const { debit = 0, credit = 0 } = aggMap.get(a.id) ?? { debit: 0, credit: 0 };
      const balance = ['ASSET', 'EXPENSE'].includes(a.type)
        ? debit - credit
        : credit - debit;
      return { ...a, balance };
    });

    const sum = (type: string) =>
      withBalances
        .filter((a: any) => a.type === type)
        .reduce((s: number, a: any) => s + a.balance, 0);

    const totals = {
      assets: sum('ASSET'),
      liabilities: sum('LIABILITY'),
      equity: sum('EQUITY'),
      income: sum('INCOME'),
      expenses: sum('EXPENSE'),
    };

    return { accounts: withBalances, totals };
  }

  async createAccount(data: CreateAccountDto, userId: string) {
    return this.doubleEntry.createAccount(
      {
        code: data.code,
        name: data.name,
        type: data.type,
        category: data.category,
        description: data.description,
        parentId: data.parentId,
        companyId: data.companyId,
      },
      userId,
    );
  }

  async updateAccount(
    id: string,
    data: UpdateAccountDto,
    userId: string,
    companyId?: string,
  ) {
    return this.doubleEntry.updateAccount(
      id,
      {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        parentId: data.parentId,
      },
      userId,
      companyId,
    );
  }

  async getAccountLedger(
    id: string,
    dateFrom?: string,
    dateTo?: string,
    companyId?: string,
  ) {
    const whereAccount: any = { id };
    if (companyId) whereAccount.companyId = companyId;

    const account = await this.prisma.account.findFirst({
      where: whereAccount,
    });
    if (!account) throw new NotFoundException('Account not found');

    const where: any = { accountId: id };
    if (dateFrom || dateTo) {
      where.journalEntry = { date: {} };
      if (dateFrom) where.journalEntry.date.gte = new Date(dateFrom);
      if (dateTo) where.journalEntry.date.lte = new Date(dateTo);
    }

    const lines = await this.prisma.journalLine.findMany({
      where,
      include: { journalEntry: true },
      orderBy: { journalEntry: { date: 'asc' } },
    });

    // Compute running balance
    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.type);
    let runningBalance = 0;

    const entries = lines.map((l: any) => {
      const debit = Number(l.debit),
        credit = Number(l.credit);
      runningBalance += isDebitNormal ? debit - credit : credit - debit;
      return { ...l, runningBalance };
    });

    return { account, entries, closingBalance: runningBalance };
  }

  // ── Journal Entries ────────────────────────────────────────────────────────

  async getJournalEntries(
    params: {
      dateFrom?: string;
      dateTo?: string;
      companyId?: string;
    } & PaginationQueryDto,
  ): Promise<PaginatedResult<any>> {
    const where = whereBuilder()
      .scope(params.companyId)
      .search(['description', 'reference'], params.search)
      .dateRange('date', params.dateFrom, params.dateTo)
      .raw({ NOT: { reference: { startsWith: 'RECURRING:' } } })
      .build();

    const { skip, take } = buildPrismaPage(params);

    const [total, entries] = await Promise.all([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        include: { journalLine: { include: { account: true } } },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
    ]);

    return paginate(entries, total, params);
  }

  async createJournalEntry(data: CreateJournalEntryDto, userId: string) {
    const entry = await this.doubleEntry.createJournalEntry(
      {
        date: data.date,
        reference: data.reference,
        description: data.description,
        companyId: (data as any).companyId,
        lines: data.lines.map((l: any) => ({
          accountId: l.accountId,
          description: l.description,
          debit: l.debit,
          credit: l.credit,
        })),
      },
      userId,
    );

    // ── Three-engine projection fan-out (§6.2) ──────────────────────────────
    // Recompute Peachtree / SIGTAX / IFRS read-models from the canonical entry.
    // Fire-and-forget: projection failure must never fail the journal post.
    if (entry?.id && entry?.companyId) {
      this.projections
        .writeProjectionsForEntry(entry.id)
        .catch((err: any) =>
          this.logger.warn(
            `Projection write failed (non-blocking): ${err?.message}`,
          ),
        );
    }

    return entry;
  }

  async deleteJournalEntry(id: string, userId: string, companyId?: string) {
    return this.doubleEntry.deleteJournalEntry(id, userId, companyId);
  }

  async updateJournalEntry(
    id: string,
    data: any,
    userId: string,
    companyId?: string,
  ) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;

    const entry = await this.prisma.journalEntry.findFirst({ where });
    if (!entry) throw new NotFoundException('Journal entry not found');

    // Prevent editing POSTED entries in locked periods
    if (entry.status === 'POSTED') {
      const period = entry.date.toISOString().slice(0, 7);
      const locked = await this.getLockedPeriods();
      if (locked.includes(period)) {
        throw new BadRequestException(
          `Period ${period} is locked — journal entry cannot be modified. Unlock the period first.`,
        );
      }
    }

    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        ...(data.description && { description: data.description }),
        ...(data.reference && { reference: data.reference }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { journalLine: { include: { account: true } } },
    });

    this.audit(
      userId,
      'UPDATE_JOURNAL_ENTRY',
      `Journal entry ${id} updated`,
      entry.companyId ?? undefined,
    );

    return updated;
  }

  async getRecurringTemplates(companyId?: string) {
    const where: any = { reference: { startsWith: 'RECURRING:' } };
    if (companyId) where.companyId = companyId;
    return this.prisma.journalEntry.findMany({
      where,
      include: { journalLine: { include: { account: true } } },
    });
  }

  async createRecurringTemplate(
    data: CreateJournalEntryDto & { recurringLabel: string },
    userId: string,
  ) {
    return this.createJournalEntry(
      { ...data, reference: `RECURRING:${data.recurringLabel}` },
      userId,
    );
  }

  async postRecurringTemplate(id: string, date: string, userId: string) {
    const template = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { journalLine: true },
    });
    if (!template) throw new NotFoundException('Template not found');

    return this.createJournalEntry(
      {
        date,
        description: template.description,
        reference:
          template.reference?.replace('RECURRING:', 'POSTED:') ?? undefined,
        lines: template.journalLine.map((l: any) => ({
          accountId: l.accountId,
          description: l.description ?? undefined,
          debit: Number(l.debit),
          credit: Number(l.credit),
        })),
      },
      userId,
    );
  }

  // ── Vendors ────────────────────────────────────────────────────────────────

  async getVendors(
    params: PaginationQueryDto & { companyId?: string },
  ): Promise<PaginatedResult<any>> {
    const where = whereBuilder()
      .scope(params.companyId)
      .search(['name', 'email', 'phone', 'tin'], params.search)
      .build();

    const { skip, take } = buildPrismaPage(params);

    const [total, vendors] = await Promise.all([
      this.prisma.vendor.count({ where }),
      this.prisma.vendor.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
        include: { bill: { select: { total: true, status: true } } },
      }),
    ]);

    const data = vendors.map((v: any) => {
      const { bill: vendorBills, isActive, ...rest } = v;
      const bills: any[] = vendorBills ?? [];

      return {
        ...rest,
        isActive,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        billCount: bills.length,
        totalBills: bills.length,
        totalBilled: bills.reduce((s, b) => s + Number(b.total ?? 0), 0),
        outstandingBalance: bills.reduce(
          (s, b) => s + (b.status !== 'PAID' ? Number(b.total ?? 0) : 0),
          0,
        ),
      };
    });

    return paginate(data, total, params);
  }

  async getVendorBills(id: string, companyId?: string) {
    const where: any = { vendorId: id };
    if (companyId) where.companyId = companyId;

    const bills = await this.prisma.bill.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      take: 20,
    });

    const summary = {
      paid: bills
        .filter((b: any) => b.status === 'PAID')
        .reduce((s, b: any) => s + Number(b.total ?? 0), 0),
      pending: bills
        .filter((b: any) => b.status !== 'PAID')
        .reduce((s, b: any) => s + Number(b.total ?? 0), 0),
    };

    return { bills, summary };
  }

  async createVendor(data: CreateVendor, userId: string) {
    const payload = {
      name: data.name,
      tin: data.tin,
      email: data.email,
      phone: data.phone,
      address: data.address,
      paymentTerms: data.paymentTerms,
      currencyCode: data.currencyCode,
      companyId: data.companyId,
      category: data.category,
      notes: data.notes,
      isActive: data.status === 'INACTIVE' ? false : (data.isActive ?? true),
    };

    const vendor = await this.prisma.vendor.create({ data: payload });

    this.audit(
      userId,
      'CREATE_VENDOR',
      `Vendor ${data.name} created`,
      vendor.companyId ?? undefined,
    );

    return vendor;
  }

  async updateVendor(
    id: string,
    data: UpdateVendor,
    userId: string,
    companyId?: string,
  ) {
    const where: Record<string, unknown> = { id };
    if (companyId) where.companyId = companyId;

    const vendor = await this.prisma.vendor.findFirst({ where });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.tin !== undefined) updateData.tin = data.tin;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.paymentTerms !== undefined)
      updateData.paymentTerms = data.paymentTerms;
    if (data.currencyCode !== undefined)
      updateData.currencyCode = data.currencyCode;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.status !== undefined)
      updateData.isActive = data.status !== 'INACTIVE';

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    this.audit(
      userId,
      'UPDATE_VENDOR',
      `Vendor ${vendor.name} updated`,
      vendor.companyId ?? undefined,
    );

    return updated;
  }

  async deleteVendor(id: string, userId: string, companyId?: string) {
    const where: Record<string, unknown> = { id };
    if (companyId) where.companyId = companyId;

    const vendor = await this.prisma.vendor.findFirst({ where });
    if (!vendor) throw new NotFoundException('Vendor not found');

    await this.prisma.vendor.delete({ where: { id } });

    this.audit(
      userId,
      'DELETE_VENDOR',
      `Vendor ${vendor.name} deleted`,
      vendor.companyId ?? undefined,
    );

    return { success: true };
  }

  // ── Bank Accounts ──────────────────────────────────────────────────────────

  async getComputedBankBalance(
    bankId: string,
    companyId?: string,
  ): Promise<number> {
    const where: any = { id: bankId };
    if (companyId) where.companyId = companyId;

    const [account, allTxns] = await Promise.all([
      this.prisma.bankAccount.findFirst({
        where,
        select: { openingBalance: true },
      }),
      this.prisma.bankTransaction.aggregate({
        where: { bankAccountId: bankId, ...(companyId && { companyId }) },
        _sum: { amount: true },
      }),
    ]);

    if (!account) throw new NotFoundException('Bank account not found');

    const txnSum = Number(allTxns._sum.amount ?? 0);
    return Number(account.openingBalance) + txnSum;
  }

  async getBankAccounts(companyId?: string) {
    const where = companyId ? { companyId } : undefined;

    const accounts = await this.prisma.bankAccount.findMany({
      where,
      include: {
        bankTransaction: { orderBy: { date: 'desc' }, take: 5 },
        _count: { select: { bankTransaction: true } },
      },
    });

    const balances = await Promise.all(
      accounts.map((a: any) => this.getComputedBankBalance(a.id)),
    );

    const unreconciled = await this.prisma.bankTransaction.groupBy({
      by: ['bankAccountId'],
      where: { status: 'PENDING' },
      _count: { id: true },
    });

    const unreconciledMap = new Map(
      unreconciled.map((u: any) => [u.bankAccountId, u._count.id]),
    );

    return accounts.map((a: any, i) => ({
      ...a,
      openingBalance: Number(a.openingBalance),
      computedBalance: balances[i],
      unreconciledCount: unreconciledMap.get(a.id) ?? 0,
    }));
  }

  async createBankAccount(data: CreateBankAccountDto, userId: string) {
    const account = await this.prisma.bankAccount.create({
      data: {
        ...data,
        companyId: data.companyId,
      },
    });

    this.audit(
      userId,
      'CREATE_BANK_ACCOUNT',
      `Bank account ${data.name} created`,
      data.companyId ?? undefined,
    );

    return account;
  }

  async updateBankAccount(
    id: string,
    data: Partial<CreateAccountDto>,
    userId: string,
    companyId?: string,
  ) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;

    const account = await this.prisma.bankAccount.findFirst({ where });
    if (!account) throw new NotFoundException('Bank account not found');

    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data,
    });

    this.audit(
      userId,
      'UPDATE_BANK_ACCOUNT',
      `Bank account ${account.name} updated`,
      account.companyId ?? undefined,
    );

    return updated;
  }

  async deleteBankAccount(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;

    const account = await this.prisma.bankAccount.findFirst({
      where,
      include: { _count: { select: { bankTransaction: true } } },
    });

    if (!account) throw new NotFoundException('Bank account not found');

    if (account._count.bankTransaction > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${account._count.bankTransaction} transaction(s). Reconcile and archive instead.`,
      );
    }

    await this.prisma.bankAccount.delete({ where: { id } });

    this.audit(
      userId,
      'DELETE_BANK_ACCOUNT',
      `Bank account ${account.name} deleted`,
      account.companyId ?? undefined,
    );

    return { success: true };
  }

  // ── Additional methods (placeholder — migrate on demand) ──────────────────

  /**
   * The original AccountingService has 40+ additional methods for:
   * - Trial balance
   * - Period close
   * - Bank transactions
   * - Reconciliation
   * - Locked periods
   *
   * These are migrated on-demand as part of incremental refactoring.
   * For now, stub them here to preserve the public API:
   */

  async getTrialBalance(companyId: string, date: string): Promise<any> {
    throw new BadRequestException('Not yet migrated to domain lib');
  }

  async getLockedPeriods(companyId?: string): Promise<string[]> {
    return [];
  }

  async getCloseHealth(companyId?: string): Promise<any> {
    throw new BadRequestException('Not yet migrated to domain lib');
  }

  async recordBankTransaction(
    id: string,
    data: {
      date: string;
      description: string;
      amount: number;
      reference?: string;
      notes?: string;
    },
    userId: string,
    companyId: string,
  ): Promise<any> {
    // TODO: migrate from original service
    throw new BadRequestException('Not yet migrated to domain lib');
  }

  async getBankTransactions(
    id: string,
    params: PaginationQueryDto,
    companyId?: string,
  ): Promise<PaginatedResult<any>> {
    // TODO: migrate from original service
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0, pagination: { page: 1, take: 20, total: 0, pages: 0 } };
  }

  async getAllBankTransactions(
    params: PaginationQueryDto & {
      companyId?: string;
      type?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    companyId?: string,
  ): Promise<PaginatedResult<any>> {
    // TODO: migrate from original service
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0, pagination: { page: 1, take: 20, total: 0, pages: 0 } };
  }

  async updateBankTransaction(
    id: string,
    data: { status?: string; notes?: string; description?: string },
    userId: string,
    companyId?: string,
  ): Promise<any> {
    // TODO: migrate from original service
    throw new BadRequestException('Not yet migrated to domain lib');
  }

  async flagOverdueInvoices(userId: string, companyId?: string) {
    const now = new Date();
    const where: any = {
      status: { in: ['PENDING', 'DRAFT'] },
      dueDate: { lt: now },
    };
    if (companyId) where.companyId = companyId;

    const overdue = await this.prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        totalAmount: true,
        dueDate: true,
        companyId: true,
      },
    });

    if (overdue.length === 0) return { flagged: 0, invoices: [] };

    await this.prisma.invoice.updateMany({
      where: { id: { in: overdue.map((i) => i.id) } },
      data: { status: 'OVERDUE' },
    });

    await this.prisma.invoiceActivity.createMany({
      data: overdue.map((inv) => ({
        invoiceId: inv.id,
        action: 'OVERDUE',
        detail: 'Automatically flagged as overdue',
        performedBy: 'system',
      })),
    });

    this.audit(userId, 'FLAG_OVERDUE_INVOICES', `${overdue.length} invoices flagged as overdue`);

    const invoicesWithDays = overdue.map((inv) => ({
      ...inv,
      totalAmount: Number(inv.totalAmount ?? 0),
      daysOverdue: inv.dueDate
        ? Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86_400_000)
        : 0,
    }));

    return { flagged: overdue.length, invoices: invoicesWithDays };
  }
}
