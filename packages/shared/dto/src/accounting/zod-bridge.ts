/**
 * @ovds/dto/accounting/zod-bridge — Zod schemas for the accounting domain
 *
 * Provides Zod versions of the accounting DTOs.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── Journal Entry ─────────────────────────────────────────────────────────────

export const JournalEntryStatusSchema = z.enum(['DRAFT', 'POSTED', 'REVERSED']);
export type JournalEntryStatus = z.infer<typeof JournalEntryStatusSchema>;

export const JournalEntrySchema = z.object({
  id: z.string(),
  entryNumber: z.string(),
  date: z.coerce.date(),
  description: z.string().nullable().optional(),
  status: JournalEntryStatusSchema.default('DRAFT'),
  companyId: z.string().nullable().optional(),
  currencyCode: z.string().default('ETB'),
  currencyRate: z.number().default(1),
  totalDebit: z.number(),
  totalCredit: z.number(),
  postedAt: z.coerce.date().nullable().optional(),
  postedBy: z.string().nullable().optional(),
  reversedAt: z.coerce.date().nullable().optional(),
  reversedBy: z.string().nullable().optional(),
  reversalReason: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateJournalEntrySchema = JournalEntrySchema.omit({
  id: true, createdAt: true, updatedAt: true,
  postedAt: true, postedBy: true, reversedAt: true, reversedBy: true,
}).extend({
  companyId: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.string(),
    description: z.string().optional(),
    debit: z.number().nonnegative().default(0),
    credit: z.number().nonnegative().default(0),
    currencyCode: z.string().optional(),
    currencyRate: z.number().optional(),
    location: z.string().optional(),
    costCenter: z.string().optional(),
    project: z.string().optional(),
    reference: z.string().optional(),
    dueDate: z.coerce.date().optional(),
    bankAccountId: z.string().optional(),
    reconcileStatus: z.string().optional(),
  })).min(2),
});

export const UpdateJournalEntrySchema = CreateJournalEntrySchema.partial();

export const PostJournalEntrySchema = z.object({
  id: z.string(),
  date: z.coerce.date().optional(),
});

export const ReverseJournalEntrySchema = z.object({
  id: z.string(),
  reason: z.string().min(1),
});

// ── Chart of Accounts ─────────────────────────────────────────────────────────

export const AccountTypeSchema = z.enum([
  'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE',
]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const AccountCategorySchema = z.enum([
  'CURRENT_ASSET', 'FIXED_ASSET', 'INTANGIBLE_ASSET',
  'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
  'EQUITY', 'REVENUE', 'COST_OF_SALES', 'EXPENSE',
]);
export type AccountCategory = z.infer<typeof AccountCategorySchema>;

export const AccountSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: AccountTypeSchema,
  category: AccountCategorySchema,
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  allowManualEntry: z.boolean().default(true),
  balance: z.number().default(0),
  debitBalance: z.number().default(0),
  creditBalance: z.number().default(0),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateAccountSchema = AccountSchema.omit({
  id: true, createdAt: true, updatedAt: true,
  balance: true, debitBalance: true, creditBalance: true,
  isSystem: true,
}).extend({
  companyId: z.string().optional(),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

// ── Fiscal Year ───────────────────────────────────────────────────────────────

export const FiscalYearSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isClosed: z.boolean().default(false),
  closedAt: z.coerce.date().nullable().optional(),
  closedBy: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateFiscalYearSchema = FiscalYearSchema.omit({
  id: true, createdAt: true, updatedAt: true,
  isClosed: true, closedAt: true, closedBy: true,
}).extend({
  companyId: z.string().optional(),
});

export const CloseFiscalYearSchema = z.object({
  fiscalYearId: z.string(),
  closingEntries: z.array(z.object({
    accountId: z.string(),
    debit: z.number().nonnegative().default(0),
    credit: z.number().nonnegative().default(0),
    description: z.string().optional(),
  })),
});

// ── Trial Balance ─────────────────────────────────────────────────────────────

export const TrialBalanceSchema = z.object({
  accounts: z.array(z.object({
    accountId: z.string(),
    accountCode: z.string(),
    accountName: z.string(),
    type: AccountTypeSchema,
    category: AccountCategorySchema,
    debitBalance: z.number(),
    creditBalance: z.number(),
    netBalance: z.number(),
  })),
  totals: z.object({
    totalDebits: z.number(),
    totalCredits: z.number(),
  }),
  asOfDate: z.coerce.date(),
});

// ── Balance Sheet ─────────────────────────────────────────────────────────────

export const BalanceSheetSchema = z.object({
  asOfDate: z.coerce.date(),
  assets: z.object({
    currentAssets: z.number(),
    nonCurrentAssets: z.number(),
    totalAssets: z.number(),
  }),
  liabilities: z.object({
    currentLiabilities: z.number(),
    nonCurrentLiabilities: z.number(),
    totalLiabilities: z.number(),
  }),
  equity: z.object({
    totalEquity: z.number(),
  }),
  totalLiabilitiesAndEquity: z.number(),
  details: z.array(z.object({
    accountId: z.string(),
    accountCode: z.string(),
    accountName: z.string(),
    category: AccountCategorySchema,
    amount: z.number(),
    isParent: z.boolean().default(false),
    children: z.array(z.object({
      accountId: z.string(),
      accountCode: z.string(),
      accountName: z.string(),
      amount: z.number(),
    })).optional(),
  })),
});

// ── Income Statement ──────────────────────────────────────────────────────────

export const IncomeStatementSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  revenue: z.object({
    totalRevenue: z.number(),
    accounts: z.array(z.object({
      accountId: z.string(),
      accountCode: z.string(),
      accountName: z.string(),
      amount: z.number(),
    })),
  }),
  costOfSales: z.object({
    totalCostOfSales: z.number(),
    accounts: z.array(z.object({
      accountId: z.string(),
      accountCode: z.string(),
      accountName: z.string(),
      amount: z.number(),
    })),
  }),
  expenses: z.object({
    totalExpenses: z.number(),
    accounts: z.array(z.object({
      accountId: z.string(),
      accountCode: z.string(),
      accountName: z.string(),
      amount: z.number(),
    })),
  }),
  grossProfit: z.number(),
  netProfit: z.number(),
  profitMargin: z.number(),
});
