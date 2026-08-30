/**
 * DoubleEntryService — domain lib
 *
 * Migrated from apps/backend/src/double-entry/double-entry.service.ts into
 * the @ovds/domains/double-entry library following the thin-apps-thick-libs pattern.
 *
 * Handles:
 *   - Chart of Accounts CRUD with IFRS/GAAP parent-child guardrails
 *   - Journal entry CRUD with debit=credit validation
 *   - General Ledger query (paginated, date-filtered, account-filtered)
 *   - Trial Balance with debit-normal normalisation
 *   - Income Statement derived from Trial Balance
 *   - Balance Sheet derived from Trial Balance
 *   - Orphan sub-account audit & repair (charter §4 QA Issue #1)
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  BaseService,
  IAuditLogger,
  IPrismaClient,
} from '@ovds/domains/infrastructure';

// ── IFRS/GAAP parent-child CoA guardrails ─────────────────────────────────────
// Top-level account groups. A code NOT in this set is a sub-account and MUST
// have a parentId (orphan sub-accounts distort the Trial Balance).
const ROOT_ACCOUNT_CODES = new Set([
  '1000', // Fixed Assets
  '1100', // Current Assets
  '2000', // Current Liabilities
  '3000', // Equity & Capital
  '4000', // Operating Revenue
  '5000', // Administrative Expenses
]);

const isSubAccountCode = (code: string): boolean =>
  !ROOT_ACCOUNT_CODES.has((code ?? '').trim());

const isDebitNormal = (type?: string) =>
  type === 'ASSET' || type === 'EXPENSE';

// ── Input shapes ──────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DoubleEntryService extends BaseService {

  /** Optional event emitter injected by the app layer — fire-and-forget */
  private emitter?: { emit: (event: string, payload: unknown) => void };

  constructor(prisma: IPrismaClient, audit: IAuditLogger) {
    super(prisma, audit, 'DoubleEntryService');
  }

  /** App layer injects EventEmitter2 after construction to avoid circular deps */
  setEmitter(emitter: { emit: (event: string, payload: unknown) => void }) {
    this.emitter = emitter;
  }

  private emit(event: string, payload: unknown) {
    this.emitter?.emit(event, payload);
  }

  // ── Chart of Accounts ──────────────────────────────────────────────────────

  async getChartOfAccounts(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.prisma.account.findMany({ where, orderBy: { code: 'asc' } });
  }

  async createAccount(
    data: {
      code: string;
      name: string;
      type: string;
      category: string;
      description?: string;
      parentId?: string;
      companyId?: string;
    },
    userId: string,
  ) {
    if (!data.code?.trim()) throw new BadRequestException('Account code is required');
    if (!data.name?.trim()) throw new BadRequestException('Account name is required');

    const existing = await this.prisma.account.findFirst({
      where: { code: data.code.trim(), companyId: data.companyId ?? null },
    });
    if (existing) throw new BadRequestException(`Account code "${data.code}" already exists`);

    const code = data.code.trim();
    if (isSubAccountCode(code) && !data.parentId) {
      throw new BadRequestException(
        `Sub-account "${code}" must be mapped to a Parent Account. ` +
        'Orphan sub-accounts are not allowed under IFRS/GAAP parent-child mapping.',
      );
    }

    if (data.parentId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: data.parentId },
        select: { id: true, type: true, companyId: true },
      });
      if (!parent) throw new BadRequestException(`Parent account "${data.parentId}" does not exist`);
      if (parent.companyId !== (data.companyId ?? null)) {
        throw new BadRequestException('Parent account belongs to a different company');
      }
      if (parent.type !== data.type) {
        throw new BadRequestException(
          `Sub-account type "${data.type}" must match parent type "${parent.type}" for contra-account netting`,
        );
      }
    }

    const account = await this.prisma.account.create({
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        type: data.type as any,
        category: data.category as any,
        description: data.description?.trim() ?? null,
        parentId: data.parentId ?? null,
        companyId: data.companyId ?? null,
        isActive: true,
      },
    });

    this.audit(userId, 'CREATE_ACCOUNT', account.id, data.companyId);
    return account;
  }

  async updateAccount(
    id: string,
    data: { name?: string; description?: string; isActive?: boolean; parentId?: string },
    userId: string,
    companyId?: string,
  ) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const account = await this.prisma.account.findFirst({ where });
    if (!account) throw new NotFoundException('Account not found');

    const updated = await this.prisma.account.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() ?? null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.parentId !== undefined && { parentId: data.parentId ?? null }),
      },
    });

    this.audit(userId, 'UPDATE_ACCOUNT', id, companyId ?? account.companyId ?? undefined);
    return updated;
  }

  async deleteAccount(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const account = await this.prisma.account.findFirst({
      where,
      include: { _count: { select: { journalLine: true } } },
    });
    if (!account) throw new NotFoundException('Account not found');
    if ((account._count as any).journalLine > 0) {
      throw new BadRequestException(
        `Account "${account.code}" has ${(account._count as any).journalLine} journal line(s). Deactivate it instead.`,
      );
    }

    await this.prisma.account.delete({ where: { id } });
    this.audit(userId, 'DELETE_ACCOUNT', id, companyId ?? account.companyId ?? undefined);
    return { success: true, id };
  }

  // ── CoA Templates ────────────────────────────────────────────────────────────

  async getCoaTemplates() {
    return [
      {
        key: 'ETHIOPIAN_AABE',
        name: 'Ethiopian AABE Standard Chart of Accounts',
        description: 'Standard Ethiopian Accounting and Auditing Board chart of accounts',
        accountCount: 6,
        rootAccounts: [
          { code: '1000', name: 'Fixed Assets', type: 'ASSET', category: 'FIXED_ASSET' },
          { code: '1100', name: 'Current Assets', type: 'ASSET', category: 'CURRENT_ASSET' },
          { code: '2000', name: 'Current Liabilities', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
          { code: '3000', name: 'Equity & Capital', type: 'EQUITY', category: 'EQUITY' },
          { code: '4000', name: 'Operating Revenue', type: 'INCOME', category: 'REVENUE' },
          { code: '5000', name: 'Administrative Expenses', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
        ],
      },
      {
        key: 'MICRO_ENTERPRISE',
        name: 'Micro Enterprise Simplified CoA',
        description: 'Simplified chart for micro-enterprises with minimal account structure',
        accountCount: 4,
        rootAccounts: [
          { code: '1000', name: 'Assets', type: 'ASSET', category: 'CURRENT_ASSET' },
          { code: '2000', name: 'Liabilities', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
          { code: '3000', name: 'Equity', type: 'EQUITY', category: 'EQUITY' },
          { code: '4000', name: 'Income', type: 'INCOME', category: 'REVENUE' },
          { code: '5000', name: 'Expenses', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
        ],
      },
      {
        key: 'SME_STANDARD',
        name: 'SME Standard CoA (IFRS for SMEs)',
        description: 'IFRS for Small and Medium-sized Entities chart of accounts',
        accountCount: 6,
        rootAccounts: [
          { code: '1000', name: 'Property, Plant and Equipment', type: 'ASSET', category: 'FIXED_ASSET' },
          { code: '1100', name: 'Current Assets', type: 'ASSET', category: 'CURRENT_ASSET' },
          { code: '2000', name: 'Liabilities', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
          { code: '3000', name: 'Equity', type: 'EQUITY', category: 'EQUITY' },
          { code: '4000', name: 'Revenue', type: 'INCOME', category: 'REVENUE' },
          { code: '5000', name: 'Expenses', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
        ],
      },
    ];
  }

  async applyCoaTemplate(templateKey: string, companyId: string, userId: string) {
    const templates = await this.getCoaTemplates();
    const template = templates.find((t) => t.key === templateKey);
    if (!template) throw new BadRequestException(`Template "${templateKey}" not found`);

    const existing = await this.prisma.account.findFirst({
      where: { companyId },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Chart of Accounts already exists for this company. Clear existing accounts first.');
    }

    const created: any[] = [];
    for (const acc of template.rootAccounts) {
      const account = await this.prisma.account.create({
        data: {
          code: acc.code,
          name: acc.name,
          type: acc.type as any,
          category: acc.category as any,
          isLeaf: false,
          allowPosting: false,
          companyId,
          isActive: true,
        },
      });
      created.push(account);
    }

    this.audit(userId, 'APPLY_COA_TEMPLATE', `Template "${templateKey}" applied (${created.length} accounts)`, companyId);
    return { template: templateKey, applied: created.length, accounts: created };
  }

  // ── CoA Import/Export ────────────────────────────────────────────────────────

  async exportChartOfAccounts(companyId: string, format: 'json' | 'csv' = 'json') {
    const accounts = await this.prisma.account.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });

    if (format === 'csv') {
      const headers = ['code', 'name', 'type', 'category', 'parentCode', 'isActive', 'description'];
      const rows = accounts.map((a) => {
        const parent = accounts.find((p) => p.id === a.parentId);
        return [
          a.code,
          `"${a.name.replace(/"/g, '""')}"`,
          a.type,
          a.category,
          parent?.code ?? '',
          a.isActive ? 'true' : 'false',
          `"${(a.description ?? '').replace(/"/g, '""')}"`,
        ].join(',');
      });
      return { format: 'csv', data: [headers.join(','), ...rows].join('\n'), count: accounts.length };
    }

    return {
      format: 'json',
      data: accounts.map((a) => ({
        code: a.code,
        name: a.name,
        type: a.type,
        category: a.category,
        parentId: a.parentId,
        isActive: a.isActive,
        description: a.description,
      })),
      count: accounts.length,
    };
  }

  async importChartOfAccounts(data: Array<{ code: string; name: string; type: string; category: string; parentCode?: string; isActive?: boolean; description?: string }>, companyId: string, userId: string) {
    if (!data?.length) throw new BadRequestException('Import data is empty');

    const codeMap = new Map<string, string>();
    const created: any[] = [];
    const errors: string[] = [];

    for (const row of data) {
      try {
        if (!row.code?.trim() || !row.name?.trim()) {
          errors.push(`Skipped: code="${row.code}" — code and name are required`);
          continue;
        }

        const existing = await this.prisma.account.findFirst({
          where: { code: row.code.trim(), companyId },
        });
        if (existing) {
          errors.push(`Skipped: code="${row.code}" — already exists`);
          continue;
        }

        let parentId: string | undefined;
        if (row.parentCode) {
          const parent = codeMap.get(row.parentCode.trim()) ??
            (await this.prisma.account.findFirst({
              where: { code: row.parentCode.trim(), companyId },
              select: { id: true },
            }))?.id;
          if (!parent) {
            errors.push(`Skipped: code="${row.code}" — parent "${row.parentCode}" not found`);
            continue;
          }
          parentId = parent;
        }

        const account = await this.prisma.account.create({
          data: {
            code: row.code.trim(),
            name: row.name.trim(),
            type: row.type as any,
            category: row.category as any,
            parentId: parentId ?? null,
            isActive: row.isActive ?? true,
            description: row.description?.trim() ?? null,
            companyId,
          },
        });

        codeMap.set(account.code, account.id);
        created.push(account);
      } catch (err: any) {
        errors.push(`Failed: code="${row.code}" — ${err?.message ?? 'unknown error'}`);
      }
    }

    this.audit(userId, 'IMPORT_COA', `Imported ${created.length} accounts (${errors.length} errors)`, companyId);
    return { imported: created.length, errors, accounts: created };
  }

  // ── Orphan detection & repair ──────────────────────────────────────────────

  async getOrphanAccounts(companyId?: string) {
    const where: any = { parentId: null };
    if (companyId) where.companyId = companyId;
    const candidates = await this.prisma.account.findMany({
      where,
      select: { id: true, code: true, name: true, type: true, companyId: true },
    });
    const orphans = candidates.filter((a) => isSubAccountCode(a.code));
    return { count: orphans.length, orphans };
  }

  async reassignOrphanAccount(orphanId: string, parentId: string, userId: string, companyId?: string) {
    return this.updateAccount(orphanId, { parentId }, userId, companyId);
  }

  // ── Journal Entries ────────────────────────────────────────────────────────

  async getJournalEntries(params: {
    companyId?: string;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(200, params.limit ?? 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.companyId) where.companyId = params.companyId;
    if (params.status) where.status = params.status;
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = new Date(params.from);
      if (params.to) where.date.lte = new Date(params.to);
    }
    if (params.search) {
      where.OR = [
        { description: { contains: params.search } },
        { reference: { contains: params.search } },
      ];
    }

    const [total, entries] = await Promise.all([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          journalLine: {
            include: { account: { select: { id: true, code: true, name: true } } },
          },
        },
      }),
    ]);

    return { data: entries, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getJournalEntry(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const entry = await this.prisma.journalEntry.findFirst({
      where,
      include: {
        journalLine: {
          include: { account: { select: { id: true, code: true, name: true } } },
        },
      },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async createJournalEntry(data: CreateJournalEntryInput, userId: string) {
    if (!data.description?.trim()) throw new BadRequestException('Description is required');
    if (!data.lines?.length || data.lines.length < 2) {
      throw new BadRequestException('A journal entry requires at least 2 lines');
    }

    const totalDebit = data.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
    const totalCredit = data.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Journal entry is not balanced: debits ${totalDebit} ≠ credits ${totalCredit}`,
      );
    }

    const entry = await this.prisma.journalEntry.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        reference: data.reference?.trim() ?? null,
        description: data.description.trim(),
        status: 'POSTED',
        companyId: data.companyId ?? null,
        postedBy: userId,
        journalLine: {
          create: data.lines.map((l) => ({
            accountId: l.accountId,
            description: l.description?.trim() ?? null,
            debit: l.debit ?? 0,
            credit: l.credit ?? 0,
            costCenterId: l.costCenterId ?? null,
            companyId: data.companyId ?? null,
          })),
        },
      },
      include: { journalLine: true },
    });

    this.audit(userId, 'CREATE_JOURNAL_ENTRY', entry.id, data.companyId);
    this.emit('journal.entry.posted', {
      journalEntryId: entry.id,
      companyId: data.companyId,
      totalDebit,
      totalCredit,
      userId,
    });

    return entry;
  }

  async updateJournalEntry(
    id: string,
    data: UpdateJournalEntryInput,
    userId: string,
    companyId?: string,
  ) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const entry = await this.prisma.journalEntry.findFirst({ where });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.status === 'POSTED' && data.status !== 'REVERSED') {
      throw new BadRequestException('Posted entries cannot be edited. Reverse and re-create instead.');
    }

    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.reference !== undefined && { reference: data.reference?.trim() ?? null }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    this.audit(userId, 'UPDATE_JOURNAL_ENTRY', id, companyId ?? entry.companyId ?? undefined);
    return updated;
  }

  async deleteJournalEntry(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const entry = await this.prisma.journalEntry.findFirst({ where });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.status === 'POSTED') {
      throw new BadRequestException('Posted entries cannot be deleted. Reverse and re-create instead.');
    }

    await this.prisma.journalEntry.delete({ where: { id } });
    this.audit(userId, 'DELETE_JOURNAL_ENTRY', id, companyId ?? entry.companyId ?? undefined);
    return { success: true, id };
  }

  // ── General Ledger ─────────────────────────────────────────────────────────

  async getGeneralLedger(params: {
    companyId?: string;
    accountId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(200, params.limit ?? 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.companyId) where.companyId = params.companyId;
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = new Date(params.from);
      if (params.to) where.date.lte = new Date(params.to);
    }
    if (params.accountId) {
      where.journalLine = { some: { accountId: params.accountId } };
    }

    const [total, entries] = await Promise.all([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          journalLine: {
            include: { account: { select: { id: true, code: true, name: true } } },
          },
        },
      }),
    ]);

    return { data: entries, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Trial Balance ──────────────────────────────────────────────────────────

  async getTrialBalance(params: { companyId?: string; from?: string; to?: string }) {
    const where: any = {};
    if (params.companyId) where.companyId = params.companyId;
    if (params.from || params.to) {
      where.journalEntry = { date: {} };
      if (params.from) (where.journalEntry as any).date.gte = new Date(params.from);
      if (params.to) (where.journalEntry as any).date.lte = new Date(params.to);
    }

    const lines = await this.prisma.journalLine.groupBy({
      by: ['accountId'],
      where,
      _sum: { debit: true, credit: true },
    });

    if (!lines.length) return [];

    const accountIds = lines.map((l) => l.accountId);
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, code: true, name: true, type: true, category: true, parentId: true },
    });
    const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

    return lines
      .map((l) => {
        const totalDebit = Number(l._sum.debit ?? 0);
        const totalCredit = Number(l._sum.credit ?? 0);
        const acc = accountMap[l.accountId];
        const balance = totalDebit - totalCredit;
        const normalizedBalance = isDebitNormal(acc?.type)
          ? totalDebit - totalCredit
          : totalCredit - totalDebit;
        return {
          accountId: l.accountId,
          accountCode: acc?.code ?? '',
          accountName: acc?.name ?? 'Unknown',
          accountType: acc?.type ?? '',
          accountCategory: acc?.category ?? '',
          parentId: acc?.parentId ?? null,
          totalDebit,
          totalCredit,
          balance,
          normalizedBalance,
        };
      })
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  // ── Income Statement ────────────────────────────────────────────────────────

  async getIncomeStatement(params: { companyId?: string; from?: string; to?: string }) {
    const tb = await this.getTrialBalance(params);

    const revenue = tb.filter((r) => ['REVENUE', 'OTHER_INCOME'].includes(r.accountCategory));
    const cogs = tb.filter((r) => r.accountCategory === 'COST_OF_GOODS_SOLD');
    const expenses = tb.filter((r) => ['OPERATING_EXPENSE', 'OTHER_EXPENSE'].includes(r.accountCategory));

    const incomeRows = revenue.map((r) => ({ ...r, netAmount: r.totalCredit - r.totalDebit }));
    const cogsRows = cogs.map((r) => ({ ...r, netAmount: r.totalDebit - r.totalCredit }));
    const expRows = expenses.map((r) => ({ ...r, netAmount: r.totalDebit - r.totalCredit }));

    const totalRevenue = incomeRows.reduce((s, r) => s + r.netAmount, 0);
    const totalCogs = cogsRows.reduce((s, r) => s + r.netAmount, 0);
    const totalExpenses = expRows.reduce((s, r) => s + r.netAmount, 0);
    const grossProfit = totalRevenue - totalCogs;
    const netIncome = grossProfit - totalExpenses;

    return {
      from: params.from ?? null,
      to: params.to ?? null,
      revenue: { rows: incomeRows, total: totalRevenue },
      cogs: { rows: cogsRows, total: totalCogs },
      expenses: { rows: expRows, total: totalExpenses },
      grossProfit,
      netIncome,
    };
  }

  // ── Balance Sheet ──────────────────────────────────────────────────────────

  async getBalanceSheet(params: { companyId?: string; asOf?: string }) {
    const tb = await this.getTrialBalance({ companyId: params.companyId, to: params.asOf });

    const assets = tb.filter((r) =>
      ['ASSET', 'CURRENT_ASSET', 'FIXED_ASSET', 'BANK', 'CASH', 'ACCOUNTS_RECEIVABLE', 'INVENTORY'].includes(r.accountCategory),
    );
    const liabilities = tb.filter((r) =>
      ['LIABILITY', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'ACCOUNTS_PAYABLE'].includes(r.accountCategory),
    );
    const equity = tb.filter((r) => r.accountCategory === 'EQUITY');

    const sum = (rows: typeof tb) => rows.reduce((s, r) => s + r.balance, 0);

    return {
      asOf: params.asOf ?? new Date().toISOString(),
      assets: { rows: assets, total: sum(assets) },
      liabilities: { rows: liabilities, total: sum(liabilities) },
      equity: { rows: equity, total: sum(equity) },
      totalLiabilitiesAndEquity: sum(liabilities) + sum(equity),
      isBalanced: Math.abs(sum(assets) - (sum(liabilities) + sum(equity))) < 1,
    };
  }

  // ── Cash Flow Statement (IAS 7) ──────────────────────────────────────────────

  async getCashFlow(params: { companyId?: string; from?: string; to?: string }) {
    const where: any = {};
    if (params.companyId) where.companyId = params.companyId;
    if (params.from || params.to) {
      where.journalEntry = { date: {} };
      if (params.from) where.journalEntry.date.gte = new Date(params.from);
      if (params.to) where.journalEntry.date.lte = new Date(params.to);
    }

    const lines = await this.prisma.journalLine.findMany({
      where,
      include: {
        account: { select: { id: true, code: true, name: true, type: true, category: true } },
        journalEntry: { select: { id: true, date: true, reference: true, description: true } },
      },
    });

    const INVESTING_CATEGORIES = new Set([
      'FIXED_ASSET', 'INTANGIBLE_ASSET', 'INVESTMENT', 'LONG_TERM_INVESTMENT',
    ]);
    const FINANCING_CATEGORIES = new Set([
      'LONG_TERM_LIABILITY', 'EQUITY', 'SHORT_TERM_LOAN', 'LONG_TERM_LOAN',
      'SHARE_CAPITAL', 'RETAINED_EARNINGS',
    ]);

    const classify = (category?: string): 'OPERATING' | 'INVESTING' | 'FINANCING' => {
      if (INVESTING_CATEGORIES.has(category ?? '')) return 'INVESTING';
      if (FINANCING_CATEGORIES.has(category ?? '')) return 'FINANCING';
      return 'OPERATING';
    };

    const flows = lines
      .filter((l) => l.debit > 0 || l.credit > 0)
      .map((l) => {
        const amount = Number(l.debit) - Number(l.credit);
        const section = classify(l.account?.category);
        return {
          journalLineId: l.id,
          journalEntryId: l.journalEntryId,
          accountId: l.accountId,
          accountCode: l.account?.code ?? '',
          accountName: l.account?.name ?? '',
          accountCategory: l.account?.category ?? '',
          date: l.journalEntry?.date ?? null,
          reference: l.journalEntry?.reference ?? null,
          description: l.description ?? l.journalEntry?.description ?? '',
          amount,
          section,
          basis: 'journal' as const,
        };
      });

    const operating = flows.filter((f) => f.section === 'OPERATING');
    const investing = flows.filter((f) => f.section === 'INVESTING');
    const financing = flows.filter((f) => f.section === 'FINANCING');

    const sum = (rows: typeof flows) => rows.reduce((s, r) => s + r.amount, 0);

    return {
      from: params.from ?? null,
      to: params.to ?? null,
      operating: {
        rows: operating,
        net: sum(operating),
        inflows: operating.filter((f) => f.amount > 0),
        outflows: operating.filter((f) => f.amount < 0).map((f) => ({ ...f, amount: Math.abs(f.amount) })),
      },
      investing: {
        rows: investing,
        net: sum(investing),
        inflows: investing.filter((f) => f.amount > 0),
        outflows: investing.filter((f) => f.amount < 0).map((f) => ({ ...f, amount: Math.abs(f.amount) })),
      },
      financing: {
        rows: financing,
        net: sum(financing),
        inflows: financing.filter((f) => f.amount > 0),
        outflows: financing.filter((f) => f.amount < 0).map((f) => ({ ...f, amount: Math.abs(f.amount) })),
      },
      netCashFlow: sum(operating) + sum(investing) + sum(financing),
      ifrsCompliant: true,
      iasReference: 'IAS 7 — Statement of Cash Flows',
    };
  }

  // ── Comparative Balance Sheet ───────────────────────────────────────────────

  async getComparativeBalanceSheet(params: {
    companyId?: string;
    asOfCurrent?: string;
    asOfPrior?: string;
  }) {
    const [current, prior] = await Promise.all([
      this.getBalanceSheet({ companyId: params.companyId, asOf: params.asOfCurrent }),
      this.getBalanceSheet({ companyId: params.companyId, asOf: params.asOfPrior }),
    ]);

    const mapRows = (rows: any[]) =>
      rows.map((r) => ({
        accountId: r.accountId,
        accountCode: r.accountCode,
        accountName: r.accountName,
        accountCategory: r.accountCategory,
        currentBalance: r.balance,
        priorBalance: 0,
        change: 0,
        changePct: null as number | null,
      }));

    const currentMap = new Map((current.assets.rows as any[]).map((r) => [r.accountId, r]));
    const priorMap = new Map((prior.assets.rows as any[]).map((r) => [r.accountId, r]));

    const allIds = new Set([
      ...currentMap.keys(),
      ...priorMap.keys(),
    ]);

    const rows = Array.from(allIds).map((id) => {
      const c = currentMap.get(id);
      const p = priorMap.get(id);
      const currentBalance = c?.balance ?? 0;
      const priorBalance = p?.balance ?? 0;
      const change = currentBalance - priorBalance;
      const changePct = priorBalance !== 0 ? Math.round((change / Math.abs(priorBalance)) * 1000) / 10 : null;

      return {
        accountId: id,
        accountCode: c?.accountCode ?? p?.accountCode ?? '',
        accountName: c?.accountName ?? p?.accountName ?? '',
        accountCategory: c?.accountCategory ?? p?.accountCategory ?? '',
        currentBalance,
        priorBalance,
        change,
        changePct,
      };
    });

    return {
      asOfCurrent: params.asOfCurrent ?? new Date().toISOString(),
      asOfPrior: params.asOfPrior ?? null,
      assets: {
        rows: rows.filter((r) => ['ASSET', 'CURRENT_ASSET', 'FIXED_ASSET', 'BANK', 'CASH', 'ACCOUNTS_RECEIVABLE', 'INVENTORY'].includes(r.accountCategory)),
        totalCurrent: current.assets.total,
        totalPrior: prior.assets.total,
      },
      liabilities: {
        rows: rows.filter((r) => ['LIABILITY', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'ACCOUNTS_PAYABLE'].includes(r.accountCategory)),
        totalCurrent: current.liabilities.total,
        totalPrior: prior.liabilities.total,
      },
      equity: {
        rows: rows.filter((r) => r.accountCategory === 'EQUITY'),
        totalCurrent: current.equity.total,
        totalPrior: prior.equity.total,
      },
      totalLiabilitiesAndEquityCurrent: current.totalLiabilitiesAndEquity,
      totalLiabilitiesAndEquityPrior: prior.totalLiabilitiesAndEquity,
      isBalancedCurrent: current.isBalanced,
      isBalancedPrior: prior.isBalanced,
    };
  }

  // ── Financial Notes Generator ────────────────────────────────────────────────

  async getFinancialNotes(params: {
    companyId?: string;
    from?: string;
    to?: string;
    asOf?: string;
  }) {
    const [tb, bs, pl, cf] = await Promise.all([
      this.getTrialBalance({ companyId: params.companyId, from: params.from, to: params.to }),
      this.getBalanceSheet({ companyId: params.companyId, asOf: params.asOf }),
      this.getIncomeStatement({ companyId: params.companyId, from: params.from, to: params.to }),
      this.getCashFlow({ companyId: params.companyId, from: params.from, to: params.to }),
    ]);

    const notes: any[] = [];

    // Note 1: Reporting entity and accounting policies
    notes.push({
      noteNumber: 1,
      title: 'Reporting Entity and Accounting Policies',
      content: 'These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS). The accounting policies adopted are consistent with those of the previous period.',
      ifrsReference: 'IAS 1.10',
    });

    // Note 2: Basis of preparation
    notes.push({
      noteNumber: 2,
      title: 'Basis of Preparation',
      content: 'The financial statements have been prepared under the historical cost convention, modified to include the revaluation of certain financial instruments at fair value through profit or loss.',
      ifrsReference: 'IAS 1.15',
    });

    // Note 3: Significant accounting policies
    const significantPolicies: string[] = [];
    const hasInventory = tb.some((r) => r.accountCategory === 'INVENTORY');
    if (hasInventory) {
      significantPolicies.push('Inventories are measured at the lower of cost and net realisable value. Cost is determined using the weighted average method.');
    }
    const hasFixedAssets = tb.some((r) => r.accountCategory === 'FIXED_ASSET');
    if (hasFixedAssets) {
      significantPolicies.push('Property, plant and equipment are stated at historical cost less accumulated depreciation and impairment losses.');
    }
    const hasRevenue = tb.some((r) => r.accountCategory === 'REVENUE');
    if (hasRevenue) {
      significantPolicies.push('Revenue is recognised when control of the goods or services is transferred to the customer at an amount that reflects the consideration expected to be received.');
    }

    notes.push({
      noteNumber: 3,
      title: 'Significant Accounting Policies',
      content: significantPolicies.join(' ') || 'Standard IFRS accounting policies apply.',
      ifrsReference: 'IAS 1.117',
    });

    // Note 4: Critical accounting estimates
    notes.push({
      noteNumber: 4,
      title: 'Critical Accounting Estimates and Judgements',
      content: 'The preparation of financial statements requires management to make judgements, estimates and assumptions that affect the application of accounting policies and the reported amounts of assets, liabilities, income and expenses.',
      ifrsReference: 'IAS 1.125',
    });

    // Note 5: Property, plant and equipment
    if (hasFixedAssets) {
      const fixedAssetRows = tb.filter((r) => r.accountCategory === 'FIXED_ASSET');
      const totalFixedAssets = fixedAssetRows.reduce((s, r) => s + r.balance, 0);
      notes.push({
        noteNumber: 5,
        title: 'Property, Plant and Equipment',
        content: `The carrying amount of property, plant and equipment at period end is ETB ${totalFixedAssets.toFixed(2)}. Depreciation is charged on the straight-line basis over the estimated useful lives of the assets.`,
        ifrsReference: 'IAS 16',
        details: fixedAssetRows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          balance: r.balance,
        })),
      });
    }

    // Note 6: Inventories
    if (hasInventory) {
      const inventoryRows = tb.filter((r) => r.accountCategory === 'INVENTORY');
      const totalInventory = inventoryRows.reduce((s, r) => s + r.balance, 0);
      notes.push({
        noteNumber: hasFixedAssets ? 6 : 5,
        title: 'Inventories',
        content: `Inventories at period end amount to ETB ${totalInventory.toFixed(2)}, measured at the lower of cost and net realisable value.`,
        ifrsReference: 'IAS 2',
        details: inventoryRows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          balance: r.balance,
        })),
      });
    }

    // Note 7: Trade receivables
    const arRows = tb.filter((r) => r.accountCategory === 'ACCOUNTS_RECEIVABLE');
    if (arRows.length > 0) {
      const totalAr = arRows.reduce((s, r) => s + r.balance, 0);
      notes.push({
        noteNumber: hasFixedAssets && hasInventory ? 7 : (hasFixedAssets || hasInventory ? 6 : 5),
        title: 'Trade Receivables',
        content: `Trade receivables at period end amount to ETB ${totalAr.toFixed(2)}. The directors consider that the carrying amount approximates to fair value.`,
        ifrsReference: 'IFRS 7, IFRS 9',
        details: arRows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          balance: r.balance,
        })),
      });
    }

    // Note 8: Trade payables
    const apRows = tb.filter((r) => r.accountCategory === 'ACCOUNTS_PAYABLE');
    if (apRows.length > 0) {
      const totalAp = apRows.reduce((s, r) => s + r.balance, 0);
      notes.push({
        noteNumber: notes.length + 1,
        title: 'Trade Payables',
        content: `Trade payables at period end amount to ETB ${totalAp.toFixed(2)}. The carrying amount approximates to fair value.`,
        ifrsReference: 'IAS 1.69',
        details: apRows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          balance: r.balance,
        })),
      });
    }

    // Note 9: Related party transactions
    notes.push({
      noteNumber: notes.length + 1,
      title: 'Related Party Transactions',
      content: 'During the period, the company entered into transactions with related parties on an arm\'s length basis. No material related party transactions requiring disclosure were identified.',
      ifrsReference: 'IAS 24',
    });

    // Note 10: Contingencies
    notes.push({
      noteNumber: notes.length + 1,
      title: 'Contingencies',
      content: 'There are no significant contingent liabilities or contingent assets requiring disclosure at period end.',
      ifrsReference: 'IAS 37',
    });

    // Note 11: Events after the reporting period
    notes.push({
      noteNumber: notes.length + 1,
      title: 'Events After the Reporting Period',
      content: 'There are no significant events occurring after the reporting period that require adjustment or disclosure.',
      ifrsReference: 'IAS 10',
    });

    return {
      period: {
        from: params.from ?? null,
        to: params.to ?? null,
        asOf: params.asOf ?? null,
      },
      totalNotes: notes.length,
      notes,
      generatedAt: new Date().toISOString(),
    };
  }
}
