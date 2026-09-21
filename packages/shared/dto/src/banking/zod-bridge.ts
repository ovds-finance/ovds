/**
 * @ovds/dto/banking/zod-bridge — Zod schemas for the banking domain
 *
 * Provides Zod versions of the class-validator DTOs in the banking domain.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 */

import { z } from 'zod';

// ── Account type / category ───────────────────────────────────────────────────

export const BankAccountTypeSchema = z.enum(['BANK', 'CREDIT_CARD', 'CASH', 'SAVINGS', 'LOAN']);
export const BankAccountStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

// ── Bank Account ─────────────────────────────────────────────────────────────

export const BankingAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountNumber: z.string(),
  bankName: z.string(),
  accountType: BankAccountTypeSchema.default('BANK'),
  accountStatus: BankAccountStatusSchema.default('ACTIVE'),
  currencyCode: z.string().default('ETB'),
  openingBalance: z.number().default(0),
  balance: z.number().default(0),
  computedBalance: z.number().optional(),
  unreconciledCount: z.number().int().default(0),
  accountId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateBankingAccountSchema = BankingAccountSchema.omit({
  id: true, createdAt: true, updatedAt: true,
  computedBalance: true, unreconciledCount: true,
}).extend({
  companyId: z.string().optional(),
  accountType: BankAccountTypeSchema.optional().default('BANK'),
  accountStatus: BankAccountStatusSchema.optional().default('ACTIVE'),
});

export const UpdateBankingAccountSchema = CreateBankingAccountSchema.partial();

export const ListBankingAccountsQuerySchema = z.object({
  companyId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  accountType: BankAccountTypeSchema.optional(),
});

// ── Bank Transaction ──────────────────────────────────────────────────────────

export const TransactionTypeSchema = z.enum(['CREDIT', 'DEBIT']);
export const TransactionStatusSchema = z.enum(['PENDING', 'RECONCILED', 'EXCLUDED']);

export const BankTransactionSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  companyId: z.string().nullable().optional(),
  date: z.coerce.date(),
  description: z.string(),
  amount: z.number(),
  type: TransactionTypeSchema.default('CREDIT'),
  reference: z.string().nullable().optional(),
  status: TransactionStatusSchema.default('PENDING'),
  journalEntryId: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  counterparty: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  qrCode: z.string().nullable().optional(),
  telecomRef: z.string().nullable().optional(),
  voucherCode: z.string().nullable().optional(),
  matchScore: z.number().int().default(0),
  matchMethod: z.string().nullable().optional(),
  matchedInvoiceId: z.string().nullable().optional(),
  matchedBillId: z.string().nullable().optional(),
  bankAccountName: z.string().optional(),
  createdAt: z.coerce.date().optional(),
});

export const CreateBankTransactionSchema = z.object({
  bankAccountId: z.string().optional(),
  companyId: z.string().optional(),
  date: z.coerce.date(),
  description: z.string().min(1),
  amount: z.number(),
  type: TransactionTypeSchema.optional().default('CREDIT'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  telecomRef: z.string().optional(),
  qrCode: z.string().optional(),
  voucherCode: z.string().optional(),
  counterparty: z.string().optional(),
  bankName: z.string().optional(),
});

export const UpdateBankTransactionSchema = z.object({
  status: TransactionStatusSchema.optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  category: z.string().optional(),
});

export const ListBankTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  companyId: z.string().optional(),
  bankAccountId: z.string().optional(),
  type: TransactionTypeSchema.optional(),
  status: TransactionStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const BulkReconcileSchema = z.object({
  ids: z.array(z.string()).min(1),
  companyId: z.string().optional(),
});

export const ImportTransactionsSchema = z.object({
  bankAccountId: z.string(),
  rows: z.array(z.object({
    date: z.string(),
    description: z.string(),
    amount: z.number(),
    type: TransactionTypeSchema.optional(),
    reference: z.string().optional(),
    counterparty: z.string().optional(),
    bankName: z.string().optional(),
    telecomRef: z.string().optional(),
  })),
});

// ── Fund Transfer ─────────────────────────────────────────────────────────────

export const TransferTypeSchema = z.enum(['INTERNAL', 'ACH', 'WIRE']);
export const TransferStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);

export const FundTransferSchema = z.object({
  id: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  amount: z.number().positive(),
  currencyCode: z.string().default('ETB'),
  type: TransferTypeSchema.default('INTERNAL'),
  status: TransferStatusSchema.default('PENDING'),
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  journalEntryId: z.string().nullable().optional(),
  fromAccountName: z.string().optional(),
  toAccountName: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateFundTransferSchema = FundTransferSchema.omit({
  id: true, createdAt: true, updatedAt: true,
  fromAccountName: true, toAccountName: true,
}).extend({
  companyId: z.string().optional(),
});

export const ListFundTransfersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  companyId: z.string().optional(),
  status: TransferStatusSchema.optional(),
  type: TransferTypeSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ── Bank Feed ─────────────────────────────────────────────────────────────────

export const BankFeedStatusSchema = z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'PENDING_AUTH']);
export const BankFeedProviderSchema = z.enum(['PLAID', 'GOCARDLESS', 'MANUAL']);

export const BankFeedSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  companyId: z.string().nullable().optional(),
  provider: BankFeedProviderSchema.default('MANUAL'),
  status: BankFeedStatusSchema.default('DISCONNECTED'),
  lastSyncAt: z.coerce.date().nullable().optional(),
  institutionId: z.string().nullable().optional(),
  institutionName: z.string().nullable().optional(),
  accessToken: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ConnectBankFeedSchema = z.object({
  bankAccountId: z.string(),
  provider: BankFeedProviderSchema,
  institutionId: z.string().optional(),
  companyId: z.string().optional(),
});

// ── Reconciliation ────────────────────────────────────────────────────────────

export const ReconciliationStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'LOCKED']);

export const ReconciliationSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  companyId: z.string().nullable().optional(),
  statementDate: z.coerce.date(),
  openingBalance: z.number(),
  closingBalance: z.number(),
  reconciledBalance: z.number().default(0),
  discrepancy: z.number().default(0),
  status: ReconciliationStatusSchema.default('OPEN'),
  notes: z.string().nullable().optional(),
  reconciledBy: z.string().nullable().optional(),
  reconciledAt: z.coerce.date().nullable().optional(),
  bankAccountName: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateReconciliationSchema = z.object({
  bankAccountId: z.string(),
  companyId: z.string().optional(),
  statementDate: z.coerce.date(),
  openingBalance: z.number(),
  closingBalance: z.number(),
  notes: z.string().optional(),
});

export const SmartReconciliationInputSchema = z.object({
  companyId: z.string().optional(),
  bankAccountId: z.string().optional(),
  applyAutoReconcile: z.boolean().default(false),
  dateWindowDays: z.number().int().min(1).max(30).default(3),
});

export const MatchConfirmSchema = z.object({
  matchType: z.enum(['INVOICE', 'BILL']),
  matchId: z.string(),
});

// ── Recurring Transaction ──────────────────────────────────────────────────────

export const RecurringIntervalSchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export const RecurringStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']);

export const RecurringTransactionSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  companyId: z.string().nullable().optional(),
  description: z.string(),
  amount: z.number(),
  type: TransactionTypeSchema.default('CREDIT'),
  interval: RecurringIntervalSchema.default('MONTHLY'),
  nextDate: z.coerce.date(),
  status: RecurringStatusSchema.default('ACTIVE'),
  reference: z.string().nullable().optional(),
  lastPostedAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateRecurringTransactionSchema = z.object({
  bankAccountId: z.string(),
  companyId: z.string().optional(),
  description: z.string().min(1),
  amount: z.number(),
  type: TransactionTypeSchema.optional().default('CREDIT'),
  interval: RecurringIntervalSchema.optional().default('MONTHLY'),
  nextDate: z.coerce.date(),
  reference: z.string().optional(),
});
