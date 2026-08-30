/**
 * @ovds/contracts — Banking Schemas
 *
 * Zod schemas for the full banking user flow:
 *   Accounts → Transactions → Transfers → Bank Feeds → Reconciliations
 *
 * These are the single source of truth for request/response shapes in the
 * banking domain. Both the NestJS controller and the React client import here.
 */
import { z } from 'zod';
import { DateRangeSchema, PaginationQuerySchema } from './common';
import { CustomFieldWithValueSchema, CustomFieldValuesMapSchema } from './custom-fields';

// ── Account type / category ───────────────────────────────────────────────────

export const BankAccountTypeSchema = z.enum(['BANK', 'CREDIT_CARD', 'CASH', 'SAVINGS', 'LOAN']);
export type BankAccountType = z.infer<typeof BankAccountTypeSchema>;

export const BankAccountStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export type BankAccountStatus = z.infer<typeof BankAccountStatusSchema>;

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
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});
export type BankingAccount = z.infer<typeof BankingAccountSchema>;

export const CreateBankingAccountSchema = BankingAccountSchema.omit({
  id: true, createdAt: true, updatedAt: true,
  computedBalance: true, unreconciledCount: true,
  customFields: true,
}).extend({
  companyId: z.string().optional(),
  accountType: BankAccountTypeSchema.optional().default('BANK'),
  accountStatus: BankAccountStatusSchema.optional().default('ACTIVE'),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateBankingAccount = z.infer<typeof CreateBankingAccountSchema>;

export const UpdateBankingAccountSchema = CreateBankingAccountSchema.partial();
export type UpdateBankingAccount = z.infer<typeof UpdateBankingAccountSchema>;

export const ListBankingAccountsQuerySchema = z.object({
  companyId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  accountType: BankAccountTypeSchema.optional(),
});
export type ListBankingAccountsQuery = z.infer<typeof ListBankingAccountsQuerySchema>;

// ── Bank Transaction ──────────────────────────────────────────────────────────

export const TransactionTypeSchema = z.enum(['CREDIT', 'DEBIT']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionStatusSchema = z.enum(['PENDING', 'RECONCILED', 'EXCLUDED']);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

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
  // joined data
  bankAccountName: z.string().optional(),
  createdAt: z.coerce.date().optional(),
});
export type BankTransaction = z.infer<typeof BankTransactionSchema>;

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
export type CreateBankTransaction = z.infer<typeof CreateBankTransactionSchema>;

export const UpdateBankTransactionSchema = z.object({
  status: TransactionStatusSchema.optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  category: z.string().optional(),
});
export type UpdateBankTransaction = z.infer<typeof UpdateBankTransactionSchema>;

export const ListBankTransactionsQuerySchema = PaginationQuerySchema
  .merge(DateRangeSchema)
  .extend({
    companyId: z.string().optional(),
    bankAccountId: z.string().optional(),
    type: TransactionTypeSchema.optional(),
    status: TransactionStatusSchema.optional(),
  });
export type ListBankTransactionsQuery = z.infer<typeof ListBankTransactionsQuerySchema>;

export const BulkReconcileSchema = z.object({
  ids: z.array(z.string()).min(1),
  companyId: z.string().optional(),
});
export type BulkReconcile = z.infer<typeof BulkReconcileSchema>;

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
export type ImportTransactions = z.infer<typeof ImportTransactionsSchema>;

// ── Fund Transfer ─────────────────────────────────────────────────────────────

export const TransferTypeSchema = z.enum(['INTERNAL', 'ACH', 'WIRE']);
export type TransferType = z.infer<typeof TransferTypeSchema>;

export const TransferStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export type TransferStatus = z.infer<typeof TransferStatusSchema>;

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
  // joined
  fromAccountName: z.string().optional(),
  toAccountName: z.string().optional(),
   createdAt: z.coerce.date(),
   updatedAt: z.coerce.date(),
   customFields: z.array(CustomFieldWithValueSchema).optional(),
});
export type FundTransfer = z.infer<typeof FundTransferSchema>;

export const CreateFundTransferSchema = FundTransferSchema.omit({
  id: true, createdAt: true, updatedAt: true,
  fromAccountName: true, toAccountName: true,
  customFields: true,
}).extend({
  companyId: z.string().optional(),
  customFields: CustomFieldValuesMapSchema.optional(),
});
export type CreateFundTransfer = z.infer<typeof CreateFundTransferSchema>;

export const ListFundTransfersQuerySchema = PaginationQuerySchema
  .merge(DateRangeSchema)
  .extend({
    companyId: z.string().optional(),
    status: TransferStatusSchema.optional(),
    type: TransferTypeSchema.optional(),
  });
export type ListFundTransfersQuery = z.infer<typeof ListFundTransfersQuerySchema>;

// ── Bank Feed ─────────────────────────────────────────────────────────────────

export const BankFeedStatusSchema = z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'PENDING_AUTH']);
export type BankFeedStatus = z.infer<typeof BankFeedStatusSchema>;

export const BankFeedProviderSchema = z.enum(['PLAID', 'GOCARDLESS', 'MANUAL']);
export type BankFeedProvider = z.infer<typeof BankFeedProviderSchema>;

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
export type BankFeed = z.infer<typeof BankFeedSchema>;

export const ConnectBankFeedSchema = z.object({
  bankAccountId: z.string(),
  provider: BankFeedProviderSchema,
  institutionId: z.string().optional(),
  companyId: z.string().optional(),
});
export type ConnectBankFeed = z.infer<typeof ConnectBankFeedSchema>;

// ── Reconciliation ────────────────────────────────────────────────────────────

export const ReconciliationStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'LOCKED']);
export type ReconciliationStatus = z.infer<typeof ReconciliationStatusSchema>;

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
export type Reconciliation = z.infer<typeof ReconciliationSchema>;

export const CreateReconciliationSchema = z.object({
  bankAccountId: z.string(),
  companyId: z.string().optional(),
  statementDate: z.coerce.date(),
  openingBalance: z.number(),
  closingBalance: z.number(),
  notes: z.string().optional(),
});
export type CreateReconciliation = z.infer<typeof CreateReconciliationSchema>;

export const ReconciliationStatsSchema = z.object({
  total: z.number().int(),
  reconciled: z.number().int(),
  pending: z.number().int(),
  withProposedMatch: z.number().int().optional(),
  reconciliationRate: z.number().int(),
  byAccount: z.array(z.object({
    accountId: z.string(),
    accountName: z.string(),
    bankName: z.string().nullable(),
    pendingCount: z.number().int(),
    pendingAmount: z.number(),
  })),
});
export type ReconciliationStats = z.infer<typeof ReconciliationStatsSchema>;

export const SmartReconciliationInputSchema = z.object({
  companyId: z.string().optional(),
  bankAccountId: z.string().optional(),
  applyAutoReconcile: z.boolean().default(false),
  dateWindowDays: z.number().int().min(1).max(30).default(3),
});
export type SmartReconciliationInput = z.infer<typeof SmartReconciliationInputSchema>;

export const MatchConfirmSchema = z.object({
  matchType: z.enum(['INVOICE', 'BILL']),
  matchId: z.string(),
});
export type MatchConfirm = z.infer<typeof MatchConfirmSchema>;

// ── Banking Dashboard ─────────────────────────────────────────────────────────

export const BankingDashboardSchema = z.object({
  totalAccounts: z.number().int(),
  totalBalance: z.number(),
  liquidBalance: z.number(),
  creditCardBalance: z.number(),
  netWorth: z.number(),
  pendingTransactions: z.number().int(),
  unreconciledCount: z.number().int(),
  recentTransactions: z.array(BankTransactionSchema.partial()),
  cashFlow: z.object({
    totalIn: z.number(),
    totalOut: z.number(),
    net: z.number(),
  }),
  currencyBreakdown: z.record(z.string(), z.number()),
  fxGainLoss: z.number(),
});
export type BankingDashboard = z.infer<typeof BankingDashboardSchema>;

export const BankFxRateSchema = z.object({
  id: z.string(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.number(),
  rateDate: z.coerce.date(),
  source: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type BankFxRate = z.infer<typeof BankFxRateSchema>;

export const BankTransactionFxSchema = z.object({
  id: z.string(),
  bankTransactionId: z.string(),
  companyId: z.string().nullable().optional(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  originalAmount: z.number(),
  convertedAmount: z.number(),
  rateAtBooking: z.number(),
  rateAtSettlement: z.number(),
  gainLoss: z.number(),
  reason: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type BankTransactionFx = z.infer<typeof BankTransactionFxSchema>;

// ── Recurring Transaction ──────────────────────────────────────────────────────

export const RecurringIntervalSchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export type RecurringInterval = z.infer<typeof RecurringIntervalSchema>;

export const RecurringStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']);
export type RecurringStatus = z.infer<typeof RecurringStatusSchema>;

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
export type RecurringTransaction = z.infer<typeof RecurringTransactionSchema>;

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
export type CreateRecurringTransaction = z.infer<typeof CreateRecurringTransactionSchema>;

export const PostRecurringSchema = z.object({
  date: z.coerce.date().optional(),
});
export type PostRecurring = z.infer<typeof PostRecurringSchema>;
