/**
 * @ovds/contracts — Banking oRPC Router Contract
 *
 * Full banking user flow:
 *   Accounts → Transactions → Transfers → Bank Feeds → Reconciliations
 *
 * Both NestJS (implements) and React (calls) import from here.
 * No business logic — shapes only.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "bankingContract", {
    enumerable: true,
    get: function() {
        return bankingContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _banking = require("../schemas/banking");
const _common = require("../schemas/common");
// ── Account procedures ────────────────────────────────────────────────────────
const accountProcedures = {
    dashboard: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_banking.BankingDashboardSchema),
    list: _contract.oc.input(_banking.ListBankingAccountsQuerySchema).output(_zod.z.array(_banking.BankingAccountSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_banking.BankingAccountSchema),
    create: _contract.oc.input(_banking.CreateBankingAccountSchema).output(_banking.BankingAccountSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _banking.UpdateBankingAccountSchema
    }))).output(_banking.BankingAccountSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Transaction procedures ────────────────────────────────────────────────────
const transactionProcedures = {
    list: _contract.oc.input(_banking.ListBankTransactionsQuerySchema).output((0, _common.PaginatedResultSchema)(_banking.BankTransactionSchema)),
    listByAccount: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        page: _zod.z.coerce.number().int().min(1).default(1),
        limit: _zod.z.coerce.number().int().min(1).max(200).default(25),
        status: _zod.z.string().optional()
    }))).output((0, _common.PaginatedResultSchema)(_banking.BankTransactionSchema)),
    create: _contract.oc.input(_banking.CreateBankTransactionSchema).output(_banking.BankTransactionSchema),
    update: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        data: _banking.UpdateBankTransactionSchema
    }))).output(_banking.BankTransactionSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    reconcile: _contract.oc.input(_common.IdParamSchema).output(_banking.BankTransactionSchema),
    bulkReconcile: _contract.oc.input(_banking.BulkReconcileSchema).output(_zod.z.object({
        reconciled: _zod.z.number().int()
    })),
    import: _contract.oc.input(_banking.ImportTransactionsSchema).output(_zod.z.object({
        succeeded: _zod.z.number().int(),
        failed: _zod.z.number().int(),
        total: _zod.z.number().int()
    })),
    match: _contract.oc.input(_common.IdParamSchema.merge(_banking.MatchConfirmSchema)).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    unmatch: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Transfer procedures ───────────────────────────────────────────────────────
const transferProcedures = {
    list: _contract.oc.input(_banking.ListFundTransfersQuerySchema).output((0, _common.PaginatedResultSchema)(_banking.FundTransferSchema)),
    get: _contract.oc.input(_common.IdParamSchema).output(_banking.FundTransferSchema),
    create: _contract.oc.input(_banking.CreateFundTransferSchema).output(_banking.FundTransferSchema),
    approve: _contract.oc.input(_common.IdParamSchema).output(_banking.FundTransferSchema),
    reject: _contract.oc.input(_common.IdParamSchema).output(_banking.FundTransferSchema),
    remove: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
// ── Bank Feed procedures ──────────────────────────────────────────────────────
const feedProcedures = {
    list: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_banking.BankFeedSchema)),
    connect: _contract.oc.input(_banking.ConnectBankFeedSchema).output(_banking.BankFeedSchema),
    sync: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        synced: _zod.z.number().int(),
        lastSyncAt: _zod.z.string()
    })),
    disconnect: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    reauthenticate: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        authUrl: _zod.z.string().optional(),
        success: _zod.z.boolean()
    }))
};
// ── Reconciliation procedures ─────────────────────────────────────────────────
const reconciliationProcedures = {
    stats: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional()
    })).output(_banking.ReconciliationStatsSchema),
    pending: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        bankAccountId: _zod.z.string().optional(),
        page: _zod.z.coerce.number().int().min(1).default(1),
        limit: _zod.z.coerce.number().int().min(1).max(100).default(30),
        status: _zod.z.string().optional(),
        search: _zod.z.string().optional()
    })).output(_zod.z.object({
        transactions: _zod.z.array(_zod.z.any()),
        total: _zod.z.number().int(),
        page: _zod.z.number().int(),
        pages: _zod.z.number().int()
    })),
    run: _contract.oc.input(_banking.SmartReconciliationInputSchema).output(_zod.z.object({
        processed: _zod.z.number().int(),
        autoReconciled: _zod.z.number().int(),
        needsReview: _zod.z.number().int(),
        unmatched: _zod.z.number().int(),
        durationMs: _zod.z.number(),
        proposals: _zod.z.array(_zod.z.any())
    })),
    proposals: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        companyId: _zod.z.string().optional()
    }))).output(_zod.z.any()),
    confirm: _contract.oc.input(_common.IdParamSchema.merge(_banking.MatchConfirmSchema)).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    dismiss: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    list: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        bankAccountId: _zod.z.string().optional(),
        page: _zod.z.coerce.number().int().min(1).default(1),
        limit: _zod.z.coerce.number().int().min(1).max(100).default(20)
    })).output((0, _common.PaginatedResultSchema)(_banking.ReconciliationSchema)),
    create: _contract.oc.input(_banking.CreateReconciliationSchema).output(_banking.ReconciliationSchema),
    complete: _contract.oc.input(_common.IdParamSchema.merge(_zod.z.object({
        notes: _zod.z.string().optional()
    }))).output(_banking.ReconciliationSchema)
};
// ── FX procedures ─────────────────────────────────────────────────────────────
const fxProcedures = {
    listRates: _contract.oc.input(_zod.z.object({
        from: _zod.z.string().optional(),
        to: _zod.z.string().optional(),
        companyId: _zod.z.string().optional(),
        limit: _zod.z.coerce.number().int().min(1).max(200).default(50)
    })).output(_zod.z.array(_banking.BankFxRateSchema)),
    getRate: _contract.oc.input(_zod.z.object({
        from: _zod.z.string(),
        to: _zod.z.string(),
        date: _zod.z.string().optional(),
        companyId: _zod.z.string().optional()
    })).output(_banking.BankFxRateSchema.nullable()),
    upsert: _contract.oc.input(_zod.z.object({
        fromCurrency: _zod.z.string(),
        toCurrency: _zod.z.string(),
        rate: _zod.z.number(),
        rateDate: _zod.z.string().optional(),
        source: _zod.z.string().optional(),
        companyId: _zod.z.string().optional()
    })).output(_banking.BankFxRateSchema),
    convert: _contract.oc.input(_zod.z.object({
        amount: _zod.z.number(),
        from: _zod.z.string(),
        to: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.object({
        amount: _zod.z.number(),
        rate: _zod.z.number(),
        rateDate: _zod.z.string()
    })),
    listAdjustments: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        bankTransactionId: _zod.z.string().optional()
    })).output(_zod.z.array(_banking.BankTransactionFxSchema))
};
// ── Recurring transaction procedures ──────────────────────────────────────────
const recurringProcedures = {
    list: _contract.oc.input(_common.IdParamSchema).output(_zod.z.array(_banking.RecurringTransactionSchema)),
    create: _contract.oc.input(_common.IdParamSchema.merge(_banking.CreateRecurringTransactionSchema)).output(_banking.RecurringTransactionSchema),
    delete: _contract.oc.input(_common.IdParamSchema).output(_zod.z.object({
        success: _zod.z.boolean()
    })),
    post: _contract.oc.input(_common.IdParamSchema.merge(_banking.PostRecurringSchema)).output(_banking.BankTransactionSchema)
};
const bankingContract = _contract.oc.router({
    accounts: _contract.oc.router(accountProcedures),
    transactions: _contract.oc.router(transactionProcedures),
    transfers: _contract.oc.router(transferProcedures),
    feeds: _contract.oc.router(feedProcedures),
    reconciliations: _contract.oc.router(reconciliationProcedures),
    fx: _contract.oc.router(fxProcedures),
    recurring: _contract.oc.router(recurringProcedures)
});
