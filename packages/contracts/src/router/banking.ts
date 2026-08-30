/**
 * @ovds/contracts — Banking oRPC Router Contract
 *
 * Full banking user flow:
 *   Accounts → Transactions → Transfers → Bank Feeds → Reconciliations
 *
 * Both NestJS (implements) and React (calls) import from here.
 * No business logic — shapes only.
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  BankingAccountSchema,
  CreateBankingAccountSchema,
  UpdateBankingAccountSchema,
  ListBankingAccountsQuerySchema,
  BankTransactionSchema,
  CreateBankTransactionSchema,
  UpdateBankTransactionSchema,
  ListBankTransactionsQuerySchema,
  BulkReconcileSchema,
  ImportTransactionsSchema,
  FundTransferSchema,
  CreateFundTransferSchema,
  ListFundTransfersQuerySchema,
  BankFeedSchema,
  ConnectBankFeedSchema,
  ReconciliationSchema,
  CreateReconciliationSchema,
  ReconciliationStatsSchema,
  SmartReconciliationInputSchema,
  MatchConfirmSchema,
  BankingDashboardSchema,
  BankFxRateSchema,
  BankTransactionFxSchema,
  RecurringTransactionSchema,
  CreateRecurringTransactionSchema,
  PostRecurringSchema,
} from '../schemas/banking';
import { IdParamSchema, PaginatedResultSchema } from '../schemas/common';

// ── Account procedures ────────────────────────────────────────────────────────

const accountProcedures = {
  dashboard: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(BankingDashboardSchema),

  list: oc
    .input(ListBankingAccountsQuerySchema)
    .output(z.array(BankingAccountSchema)),

  get: oc
    .input(IdParamSchema)
    .output(BankingAccountSchema),

  create: oc
    .input(CreateBankingAccountSchema)
    .output(BankingAccountSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateBankingAccountSchema })))
    .output(BankingAccountSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Transaction procedures ────────────────────────────────────────────────────

const transactionProcedures = {
  list: oc
    .input(ListBankTransactionsQuerySchema)
    .output(PaginatedResultSchema(BankTransactionSchema)),

  listByAccount: oc
    .input(IdParamSchema.merge(z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(200).default(25),
      status: z.string().optional(),
    })))
    .output(PaginatedResultSchema(BankTransactionSchema)),

  create: oc
    .input(CreateBankTransactionSchema)
    .output(BankTransactionSchema),

  update: oc
    .input(IdParamSchema.merge(z.object({ data: UpdateBankTransactionSchema })))
    .output(BankTransactionSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  reconcile: oc
    .input(IdParamSchema)
    .output(BankTransactionSchema),

  bulkReconcile: oc
    .input(BulkReconcileSchema)
    .output(z.object({ reconciled: z.number().int() })),

  import: oc
    .input(ImportTransactionsSchema)
    .output(z.object({ succeeded: z.number().int(), failed: z.number().int(), total: z.number().int() })),

  match: oc
    .input(IdParamSchema.merge(MatchConfirmSchema))
    .output(z.object({ success: z.boolean() })),

  unmatch: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Transfer procedures ───────────────────────────────────────────────────────

const transferProcedures = {
  list: oc
    .input(ListFundTransfersQuerySchema)
    .output(PaginatedResultSchema(FundTransferSchema)),

  get: oc
    .input(IdParamSchema)
    .output(FundTransferSchema),

  create: oc
    .input(CreateFundTransferSchema)
    .output(FundTransferSchema),

  approve: oc
    .input(IdParamSchema)
    .output(FundTransferSchema),

  reject: oc
    .input(IdParamSchema)
    .output(FundTransferSchema),

  remove: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),
};

// ── Bank Feed procedures ──────────────────────────────────────────────────────

const feedProcedures = {
  list: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(z.array(BankFeedSchema)),

  connect: oc
    .input(ConnectBankFeedSchema)
    .output(BankFeedSchema),

  sync: oc
    .input(IdParamSchema)
    .output(z.object({ synced: z.number().int(), lastSyncAt: z.string() })),

  disconnect: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  reauthenticate: oc
    .input(IdParamSchema)
    .output(z.object({ authUrl: z.string().optional(), success: z.boolean() })),
};

// ── Reconciliation procedures ─────────────────────────────────────────────────

const reconciliationProcedures = {
  stats: oc
    .input(z.object({ companyId: z.string().optional() }))
    .output(ReconciliationStatsSchema),

  pending: oc
    .input(z.object({
      companyId: z.string().optional(),
      bankAccountId: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(30),
      status: z.string().optional(),
      search: z.string().optional(),
    }))
    .output(z.object({
      transactions: z.array(z.any()),
      total: z.number().int(),
      page: z.number().int(),
      pages: z.number().int(),
    })),

  run: oc
    .input(SmartReconciliationInputSchema)
    .output(z.object({
      processed: z.number().int(),
      autoReconciled: z.number().int(),
      needsReview: z.number().int(),
      unmatched: z.number().int(),
      durationMs: z.number(),
      proposals: z.array(z.any()),
    })),

  proposals: oc
    .input(IdParamSchema.merge(z.object({ companyId: z.string().optional() })))
    .output(z.any()),

  confirm: oc
    .input(IdParamSchema.merge(MatchConfirmSchema))
    .output(z.object({ success: z.boolean() })),

  dismiss: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  list: oc
    .input(z.object({
      companyId: z.string().optional(),
      bankAccountId: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }))
    .output(PaginatedResultSchema(ReconciliationSchema)),

  create: oc
    .input(CreateReconciliationSchema)
    .output(ReconciliationSchema),

  complete: oc
    .input(IdParamSchema.merge(z.object({ notes: z.string().optional() })))
    .output(ReconciliationSchema),
};

// ── FX procedures ─────────────────────────────────────────────────────────────

const fxProcedures = {
  listRates: oc
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      companyId: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
    }))
    .output(z.array(BankFxRateSchema)),

  getRate: oc
    .input(z.object({
      from: z.string(),
      to: z.string(),
      date: z.string().optional(),
      companyId: z.string().optional(),
    }))
    .output(BankFxRateSchema.nullable()),

  upsert: oc
    .input(z.object({
      fromCurrency: z.string(),
      toCurrency: z.string(),
      rate: z.number(),
      rateDate: z.string().optional(),
      source: z.string().optional(),
      companyId: z.string().optional(),
    }))
    .output(BankFxRateSchema),

  convert: oc
    .input(z.object({
      amount: z.number(),
      from: z.string(),
      to: z.string(),
      companyId: z.string().optional(),
    }))
    .output(z.object({
      amount: z.number(),
      rate: z.number(),
      rateDate: z.string(),
    })),

  listAdjustments: oc
    .input(z.object({
      companyId: z.string().optional(),
      bankTransactionId: z.string().optional(),
    }))
    .output(z.array(BankTransactionFxSchema)),
};

// ── Recurring transaction procedures ──────────────────────────────────────────

const recurringProcedures = {
  list: oc
    .input(IdParamSchema)
    .output(z.array(RecurringTransactionSchema)),

  create: oc
    .input(IdParamSchema.merge(CreateRecurringTransactionSchema))
    .output(RecurringTransactionSchema),

  delete: oc
    .input(IdParamSchema)
    .output(z.object({ success: z.boolean() })),

  post: oc
    .input(IdParamSchema.merge(PostRecurringSchema))
    .output(BankTransactionSchema),
};

// ── Banking router contract ───────────────────────────────────────────────────

export const bankingContract = oc.router({
  accounts:        oc.router(accountProcedures),
  transactions:    oc.router(transactionProcedures),
  transfers:       oc.router(transferProcedures),
  feeds:           oc.router(feedProcedures),
  reconciliations: oc.router(reconciliationProcedures),
  fx:              oc.router(fxProcedures),
  recurring:       oc.router(recurringProcedures),
});

export type BankingContract = typeof bankingContract;
