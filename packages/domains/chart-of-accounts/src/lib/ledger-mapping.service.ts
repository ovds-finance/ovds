/**
 * LedgerMappingService — domain lib
 *
 * Provides automated double-entry ledger mapping for business transactions.
 * Maps invoice payments, vendor bills, bank transfers, and other financial
 * events to their correct debit/credit GL accounts based on configurable rules.
 *
 * Rule types:
 *   - KEYWORD  : match on transaction description / vendor name / invoice type
 *   - ACCOUNT   : map by source account code (e.g. bank account → cash account)
 *   - AMOUNT    : threshold-based mapping (e.g. amounts > X → fixed assets)
 *   - TEMPLATE  : predefined industry-standard mapping sets
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

// ── Input / Output types ───────────────────────────────────────────────────────

export interface LedgerMappingRule {
  id?: string;
  companyId?: string;
  name: string;
  priority: number;
  isActive: boolean;
  matchType: 'KEYWORD' | 'ACCOUNT' | 'AMOUNT' | 'TEMPLATE';
  matchValue: string;
  debitAccountId: string;
  creditAccountId: string;
  taxType?: string;
  costCenterId?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface MappingResult {
  ruleId?: string;
  ruleName: string;
  matchType: string;
  debitAccountId: string;
  creditAccountId: string;
  taxType?: string;
  costCenterId?: string;
  description: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  amount?: number;
}

export interface AutoMapInvoiceInput {
  companyId?: string;
  invoiceId: string;
  paymentAmount: number;
  paymentAccountId: string;
  paymentDate?: string;
}

export interface AutoMapBillInput {
  companyId?: string;
  billId: string;
  paymentAmount: number;
  paymentAccountId: string;
  paymentDate?: string;
}

export interface AutoMapBankTransferInput {
  companyId?: string;
  bankTransactionId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

// ── Built-in mapping templates ─────────────────────────────────────────────────

const ETHIOPIAN_COA_TEMPLATES: Record<string, { name: string; rules: Omit<LedgerMappingRule, 'id' | 'companyId' | 'name' | 'priority'>[] }> = {
  INVOICE_PAYMENT: {
    name: 'Invoice Payment (Customer → Bank)',
    rules: [
      {
        matchType: 'TEMPLATE',
        matchValue: 'INVOICE_PAYMENT',
        debitAccountId: '__BANK__',
        creditAccountId: '__ACCOUNTS_RECEIVABLE__',
        description: 'Customer payment received',
        isActive: true,
      },
    ],
  },
  BILL_PAYMENT: {
    name: 'Bill Payment (Bank → Vendor)',
    rules: [
      {
        matchType: 'TEMPLATE',
        matchValue: 'BILL_PAYMENT',
        debitAccountId: '__ACCOUNTS_PAYABLE__',
        creditAccountId: '__BANK__',
        description: 'Vendor payment made',
        isActive: true,
      },
    ],
  },
  BANK_TRANSFER: {
    name: 'Bank Transfer (Inter-account)',
    rules: [
      {
        matchType: 'TEMPLATE',
        matchValue: 'BANK_TRANSFER',
        debitAccountId: '__DESTINATION__',
        creditAccountId: '__SOURCE__',
        description: 'Funds transfer between accounts',
        isActive: true,
      },
    ],
  },
  DEPRECIATION: {
    name: 'Monthly Depreciation',
    rules: [
      {
        matchType: 'TEMPLATE',
        matchValue: 'DEPRECIATION',
        debitAccountId: '__DEPRECIATION_EXPENSE__',
        creditAccountId: '__ACCUMULATED_DEPRECIATION__',
        description: 'Monthly depreciation posting',
        isActive: true,
      },
    ],
  },
  PAYROLL: {
    name: 'Payroll Processing',
    rules: [
      {
        matchType: 'TEMPLATE',
        matchValue: 'PAYROLL',
        debitAccountId: '__SALARY_EXPENSE__',
        creditAccountId: '__BANK__',
        description: 'Salary payment to employees',
        isActive: true,
      },
    ],
  },
  TAX_PAYMENT: {
    name: 'Tax Payment',
    rules: [
      {
        matchType: 'TEMPLATE',
        matchValue: 'TAX_PAYMENT',
        debitAccountId: '__TAX_PAYABLE__',
        creditAccountId: '__BANK__',
        description: 'Tax remittance payment',
        isActive: true,
      },
    ],
  },
};

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class LedgerMappingService extends BaseService {
  constructor(prisma: IPrismaClient, audit: IAuditLogger) {
    super(prisma, audit, 'LedgerMappingService');
  }

  // ── Mapping Rule CRUD ────────────────────────────────────────────────────────

  async getMappingRules(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.prisma.ledgerMappingRule.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getMappingRule(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const rule = await this.prisma.ledgerMappingRule.findFirst({ where });
    if (!rule) throw new NotFoundException('Mapping rule not found');
    return rule;
  }

  async createMappingRule(data: LedgerMappingRule, userId: string) {
    if (!data.name?.trim()) throw new BadRequestException('Rule name is required');
    if (!data.matchValue?.trim()) throw new BadRequestException('Match value is required');
    if (!data.debitAccountId) throw new BadRequestException('Debit account is required');
    if (!data.creditAccountId) throw new BadRequestException('Credit account is required');

    const rule = await this.prisma.ledgerMappingRule.create({
      data: {
        name: data.name.trim(),
        priority: data.priority ?? 100,
        isActive: data.isActive ?? true,
        matchType: data.matchType,
        matchValue: data.matchValue.trim(),
        debitAccountId: data.debitAccountId,
        creditAccountId: data.creditAccountId,
        taxType: data.taxType ?? null,
        costCenterId: data.costCenterId ?? null,
        description: data.description?.trim() ?? null,
        minAmount: data.minAmount ?? null,
        maxAmount: data.maxAmount ?? null,
        companyId: data.companyId ?? null,
      },
    });

    this.audit(userId, 'CREATE_LEDGER_MAPPING_RULE', rule.id, data.companyId);
    return rule;
  }

  async updateMappingRule(id: string, data: Partial<LedgerMappingRule>, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.ledgerMappingRule.findFirst({ where });
    if (!existing) throw new NotFoundException('Mapping rule not found');

    const updated = await this.prisma.ledgerMappingRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.matchType !== undefined && { matchType: data.matchType }),
        ...(data.matchValue !== undefined && { matchValue: data.matchValue.trim() }),
        ...(data.debitAccountId !== undefined && { debitAccountId: data.debitAccountId }),
        ...(data.creditAccountId !== undefined && { creditAccountId: data.creditAccountId }),
        ...(data.taxType !== undefined && { taxType: data.taxType ?? null }),
        ...(data.costCenterId !== undefined && { costCenterId: data.costCenterId ?? null }),
        ...(data.description !== undefined && { description: data.description?.trim() ?? null }),
        ...(data.minAmount !== undefined && { minAmount: data.minAmount ?? null }),
        ...(data.maxAmount !== undefined && { maxAmount: data.maxAmount ?? null }),
      },
    });

    this.audit(userId, 'UPDATE_LEDGER_MAPPING_RULE', id, companyId ?? existing.companyId ?? undefined);
    return updated;
  }

  async deleteMappingRule(id: string, userId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.ledgerMappingRule.findFirst({ where });
    if (!existing) throw new NotFoundException('Mapping rule not found');

    await this.prisma.ledgerMappingRule.delete({ where: { id } });
    this.audit(userId, 'DELETE_LEDGER_MAPPING_RULE', id, companyId ?? existing.companyId ?? undefined);
    return { success: true, id };
  }

  // ── Template Management ──────────────────────────────────────────────────────

  async getMappingTemplates() {
    return Object.entries(ETHIOPIAN_COA_TEMPLATES).map(([key, template]) => ({
      key,
      name: template.name,
      ruleCount: template.rules.length,
    }));
  }

  async applyTemplate(templateKey: string, companyId: string, userId: string) {
    const template = ETHIOPIAN_COA_TEMPLATES[templateKey];
    if (!template) throw new BadRequestException(`Template "${templateKey}" not found`);

    const created: any[] = [];
    for (const rule of template.rules) {
      const createdRule = await this.createMappingRule(
        {
          ...rule,
          companyId,
          name: `${template.name} — Rule ${created.length + 1}`,
          priority: 100 + created.length,
        },
        userId,
      );
      created.push(createdRule);
    }

    return { template: templateKey, applied: created.length, rules: created };
  }

  // ── Auto-Map: Invoice Payment ────────────────────────────────────────────────

  async autoMapInvoicePayment(input: AutoMapInvoiceInput, userId: string): Promise<MappingResult> {
    const { companyId, invoiceId, paymentAmount, paymentAccountId } = input;

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, ...(companyId ? { companyId } : {}) },
      include: { customer: { select: { id: true, name: true } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const rules = await this.getActiveRules(companyId);
    const context = {
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      sourceType: 'INVOICE_PAYMENT',
      amount: paymentAmount,
      vendorName: invoice.customer?.name,
      invoiceType: invoice.status,
    };

    const matchedRule = this.findBestMatch(rules, context);
    if (!matchedRule) {
      return this.fallbackInvoiceMapping(invoice, paymentAccountId, paymentAmount);
    }

    const debitAccountId = this.resolvePlaceholder(matchedRule.debitAccountId, {
      __BANK__: paymentAccountId,
      __ACCOUNTS_RECEIVABLE__: await this.findAccountByCategory(companyId, 'ACCOUNTS_RECEIVABLE'),
    });

    const creditAccountId = this.resolvePlaceholder(matchedRule.creditAccountId, {
      __BANK__: paymentAccountId,
      __ACCOUNTS_RECEIVABLE__: await this.findAccountByCategory(companyId, 'ACCOUNTS_RECEIVABLE'),
    });

    return {
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
      matchType: matchedRule.matchType,
      debitAccountId,
      creditAccountId,
      taxType: matchedRule.taxType ?? undefined,
      costCenterId: matchedRule.costCenterId ?? undefined,
      description: matchedRule.description || `Payment for invoice ${invoice.invoiceNumber}`,
      confidence: 'HIGH',
      amount: paymentAmount,
    };
  }

  // ── Auto-Map: Bill Payment ───────────────────────────────────────────────────

  async autoMapBillPayment(input: AutoMapBillInput, userId: string): Promise<MappingResult> {
    const { companyId, billId, paymentAmount, paymentAccountId } = input;

    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, ...(companyId ? { companyId } : {}) },
      include: { vendor: { select: { id: true, name: true } } },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    const rules = await this.getActiveRules(companyId);
    const context = {
      description: `Payment for bill ${bill.billNumber}`,
      sourceType: 'BILL_PAYMENT',
      amount: paymentAmount,
      vendorName: bill.vendor?.name,
      invoiceType: bill.status,
    };

    const matchedRule = this.findBestMatch(rules, context);
    if (!matchedRule) {
      return this.fallbackBillMapping(bill, paymentAccountId, paymentAmount);
    }

    const debitAccountId = this.resolvePlaceholder(matchedRule.debitAccountId, {
      __ACCOUNTS_PAYABLE__: await this.findAccountByCategory(companyId, 'ACCOUNTS_PAYABLE'),
      __BANK__: paymentAccountId,
    });

    const creditAccountId = this.resolvePlaceholder(matchedRule.creditAccountId, {
      __ACCOUNTS_PAYABLE__: await this.findAccountByCategory(companyId, 'ACCOUNTS_PAYABLE'),
      __BANK__: paymentAccountId,
    });

    return {
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
      matchType: matchedRule.matchType,
      debitAccountId,
      creditAccountId,
      taxType: matchedRule.taxType ?? undefined,
      costCenterId: matchedRule.costCenterId ?? undefined,
      description: matchedRule.description || `Payment for bill ${bill.billNumber}`,
      confidence: 'HIGH',
      amount: paymentAmount,
    };
  }

  // ── Auto-Map: Bank Transfer ──────────────────────────────────────────────────

  async autoMapBankTransfer(input: AutoMapBankTransferInput, userId: string): Promise<MappingResult> {
    const { companyId, amount, fromAccountId, toAccountId, description } = input;

    const rules = await this.getActiveRules(companyId);
    const context = {
      description: description || 'Bank transfer',
      sourceType: 'BANK_TRANSFER',
      amount,
    };

    const matchedRule = this.findBestMatch(rules, context);
    if (!matchedRule) {
      return {
        ruleName: 'Default Bank Transfer',
        matchType: 'FALLBACK',
        debitAccountId: toAccountId,
        creditAccountId: fromAccountId,
        description: description || 'Bank transfer',
        confidence: 'MEDIUM',
        amount,
      };
    }

    const debitAccountId = this.resolvePlaceholder(matchedRule.debitAccountId, {
      __SOURCE__: fromAccountId,
      __DESTINATION__: toAccountId,
    });

    const creditAccountId = this.resolvePlaceholder(matchedRule.creditAccountId, {
      __SOURCE__: fromAccountId,
      __DESTINATION__: toAccountId,
    });

    return {
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
      matchType: matchedRule.matchType,
      debitAccountId,
      creditAccountId,
      description: matchedRule.description || description || 'Bank transfer',
      confidence: 'HIGH',
      amount,
    };
  }

  // ── Batch Auto-Map ───────────────────────────────────────────────────────────

  async batchAutoMap(companyId: string, sourceType: 'INVOICE' | 'BILL' | 'BANK_TRANSFER', limit: number = 50): Promise<{ mapped: number; skipped: number; results: MappingResult[] }> {
    let mapped = 0;
    let skipped = 0;
    const results: MappingResult[] = [];

    if (sourceType === 'INVOICE') {
      const invoices = await this.prisma.invoice.findMany({
        where: { companyId, status: { in: ['PENDING', 'PARTIAL'] } },
        take: limit,
        include: { customer: { select: { name: true } } },
      });

      for (const invoice of invoices) {
        try {
          const result = await this.autoMapInvoicePayment(
            { companyId, invoiceId: invoice.id, paymentAmount: Number(invoice.totalAmount), paymentAccountId: '' },
            'system',
          );
          results.push(result);
          mapped++;
        } catch {
          skipped++;
        }
      }
    } else if (sourceType === 'BILL') {
      const bills = await this.prisma.bill.findMany({
        where: { companyId, status: { in: ['PENDING', 'OVERDUE'] } },
        take: limit,
        include: { vendor: { select: { name: true } } },
      });

      for (const bill of bills) {
        try {
          const result = await this.autoMapBillPayment(
            { companyId, billId: bill.id, paymentAmount: Number(bill.total), paymentAccountId: '' },
            'system',
          );
          results.push(result);
          mapped++;
        } catch {
          skipped++;
        }
      }
    }

    return { mapped, skipped, results };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async getActiveRules(companyId?: string) {
    const where = companyId ? { companyId, isActive: true } : { isActive: true };
    return this.prisma.ledgerMappingRule.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private findBestMatch(rules: any[], context: { description: string; sourceType: string; amount: number; vendorName?: string; invoiceType?: string }): any | null {
    const desc = (context.description || '').toLowerCase();
    const vendor = (context.vendorName || '').toLowerCase();

    for (const rule of rules) {
      const matchVal = (rule.matchValue || '').toLowerCase();

      if (rule.matchType === 'KEYWORD') {
        if (desc.includes(matchVal) || vendor.includes(matchVal)) {
          if (this.amountInRange(context.amount, rule)) return rule;
        }
      } else if (rule.matchType === 'ACCOUNT') {
        if (desc.includes(matchVal)) return rule;
      } else if (rule.matchType === 'TEMPLATE') {
        if (context.sourceType === matchVal) return rule;
      } else if (rule.matchType === 'AMOUNT') {
        if (this.amountInRange(context.amount, rule)) return rule;
      }
    }

    return null;
  }

  private amountInRange(amount: number, rule: any): boolean {
    if (rule.minAmount != null && amount < rule.minAmount) return false;
    if (rule.maxAmount != null && amount > rule.maxAmount) return false;
    return true;
  }

  private resolvePlaceholder(accountId: string, mappings: Record<string, string>): string {
    if (mappings[accountId]) return mappings[accountId];
    return accountId;
  }

  private async findAccountByCategory(companyId: string | undefined, category: string): Promise<string> {
    const account = await this.prisma.account.findFirst({
      where: { companyId: companyId ?? null, category: category as any, isActive: true },
      select: { id: true },
    });
    return account?.id || '';
  }

  private fallbackInvoiceMapping(invoice: any, paymentAccountId: string, amount: number): MappingResult {
    return {
      ruleName: 'Default Invoice Payment',
      matchType: 'FALLBACK',
      debitAccountId: paymentAccountId || '__BANK__',
      creditAccountId: '__ACCOUNTS_RECEIVABLE__',
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      confidence: 'LOW',
      amount,
    };
  }

  private fallbackBillMapping(bill: any, paymentAccountId: string, amount: number): MappingResult {
    return {
      ruleName: 'Default Bill Payment',
      matchType: 'FALLBACK',
      debitAccountId: '__ACCOUNTS_PAYABLE__',
      creditAccountId: paymentAccountId || '__BANK__',
      description: `Payment for bill ${bill.billNumber}`,
      confidence: 'LOW',
      amount,
    };
  }

  // ── Auto-Post Journal Entry from Mapping ─────────────────────────────────────

  async autoPostJournalEntry(
    mapping: MappingResult,
    userId: string,
    extra: { reference?: string; date?: string; companyId?: string } = {},
  ): Promise<any> {
    const { companyId, reference, date } = extra;

    const debitAccountId = mapping.debitAccountId.startsWith('__')
      ? mapping.debitAccountId
      : mapping.debitAccountId;
    const creditAccountId = mapping.creditAccountId.startsWith('__')
      ? mapping.creditAccountId
      : mapping.creditAccountId;

    if (debitAccountId.startsWith('__') || creditAccountId.startsWith('__')) {
      throw new BadRequestException(
        `Cannot auto-post: unresolved placeholders (debit: ${debitAccountId}, credit: ${creditAccountId}). ` +
        'Ensure placeholder accounts exist in the Chart of Accounts.',
      );
    }

    const entry = await this.prisma.journalEntry.create({
      data: {
        date: date ? new Date(date) : new Date(),
        reference: reference ?? `AUTO-${Date.now()}`,
        description: `[Auto-Post] ${mapping.description}`,
        status: 'POSTED',
        companyId: companyId ?? null,
        postedBy: userId,
        journalLine: {
          create: [
            {
              accountId: debitAccountId,
              description: mapping.description,
              debit: mapping.amount ?? 0,
              credit: 0,
              companyId: companyId ?? null,
            },
            {
              accountId: creditAccountId,
              description: mapping.description,
              debit: 0,
              credit: mapping.amount ?? 0,
              companyId: companyId ?? null,
            },
          ],
        },
      },
      include: { journalLine: true },
    });

    this.audit(userId, 'AUTO_POST_JOURNAL_ENTRY', entry.id, companyId);

    return entry;
  }
}
