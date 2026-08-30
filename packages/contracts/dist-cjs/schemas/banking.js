/**
 * @ovds/contracts — Banking Schemas
 *
 * Zod schemas for the full banking user flow:
 *   Accounts → Transactions → Transfers → Bank Feeds → Reconciliations
 *
 * These are the single source of truth for request/response shapes in the
 * banking domain. Both the NestJS controller and the React client import here.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get BankAccountStatusSchema () {
        return BankAccountStatusSchema;
    },
    get BankAccountTypeSchema () {
        return BankAccountTypeSchema;
    },
    get BankFeedProviderSchema () {
        return BankFeedProviderSchema;
    },
    get BankFeedSchema () {
        return BankFeedSchema;
    },
    get BankFeedStatusSchema () {
        return BankFeedStatusSchema;
    },
    get BankFxRateSchema () {
        return BankFxRateSchema;
    },
    get BankTransactionFxSchema () {
        return BankTransactionFxSchema;
    },
    get BankTransactionSchema () {
        return BankTransactionSchema;
    },
    get BankingAccountSchema () {
        return BankingAccountSchema;
    },
    get BankingDashboardSchema () {
        return BankingDashboardSchema;
    },
    get BulkReconcileSchema () {
        return BulkReconcileSchema;
    },
    get ConnectBankFeedSchema () {
        return ConnectBankFeedSchema;
    },
    get CreateBankTransactionSchema () {
        return CreateBankTransactionSchema;
    },
    get CreateBankingAccountSchema () {
        return CreateBankingAccountSchema;
    },
    get CreateFundTransferSchema () {
        return CreateFundTransferSchema;
    },
    get CreateReconciliationSchema () {
        return CreateReconciliationSchema;
    },
    get CreateRecurringTransactionSchema () {
        return CreateRecurringTransactionSchema;
    },
    get FundTransferSchema () {
        return FundTransferSchema;
    },
    get ImportTransactionsSchema () {
        return ImportTransactionsSchema;
    },
    get ListBankTransactionsQuerySchema () {
        return ListBankTransactionsQuerySchema;
    },
    get ListBankingAccountsQuerySchema () {
        return ListBankingAccountsQuerySchema;
    },
    get ListFundTransfersQuerySchema () {
        return ListFundTransfersQuerySchema;
    },
    get MatchConfirmSchema () {
        return MatchConfirmSchema;
    },
    get PostRecurringSchema () {
        return PostRecurringSchema;
    },
    get ReconciliationSchema () {
        return ReconciliationSchema;
    },
    get ReconciliationStatsSchema () {
        return ReconciliationStatsSchema;
    },
    get ReconciliationStatusSchema () {
        return ReconciliationStatusSchema;
    },
    get RecurringIntervalSchema () {
        return RecurringIntervalSchema;
    },
    get RecurringStatusSchema () {
        return RecurringStatusSchema;
    },
    get RecurringTransactionSchema () {
        return RecurringTransactionSchema;
    },
    get SmartReconciliationInputSchema () {
        return SmartReconciliationInputSchema;
    },
    get TransactionStatusSchema () {
        return TransactionStatusSchema;
    },
    get TransactionTypeSchema () {
        return TransactionTypeSchema;
    },
    get TransferStatusSchema () {
        return TransferStatusSchema;
    },
    get TransferTypeSchema () {
        return TransferTypeSchema;
    },
    get UpdateBankTransactionSchema () {
        return UpdateBankTransactionSchema;
    },
    get UpdateBankingAccountSchema () {
        return UpdateBankingAccountSchema;
    }
});
const _zod = require("zod");
const _common = require("./common");
const _customfields = require("./custom-fields");
const BankAccountTypeSchema = _zod.z.enum([
    'BANK',
    'CREDIT_CARD',
    'CASH',
    'SAVINGS',
    'LOAN'
]);
const BankAccountStatusSchema = _zod.z.enum([
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
]);
const BankingAccountSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    accountNumber: _zod.z.string(),
    bankName: _zod.z.string(),
    accountType: BankAccountTypeSchema.default('BANK'),
    accountStatus: BankAccountStatusSchema.default('ACTIVE'),
    currencyCode: _zod.z.string().default('ETB'),
    openingBalance: _zod.z.number().default(0),
    balance: _zod.z.number().default(0),
    computedBalance: _zod.z.number().optional(),
    unreconciledCount: _zod.z.number().int().default(0),
    accountId: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    isActive: _zod.z.boolean().default(true),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateBankingAccountSchema = BankingAccountSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    computedBalance: true,
    unreconciledCount: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    accountType: BankAccountTypeSchema.optional().default('BANK'),
    accountStatus: BankAccountStatusSchema.optional().default('ACTIVE'),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const UpdateBankingAccountSchema = CreateBankingAccountSchema.partial();
const ListBankingAccountsQuerySchema = _zod.z.object({
    companyId: _zod.z.string().optional(),
    isActive: _zod.z.coerce.boolean().optional(),
    accountType: BankAccountTypeSchema.optional()
});
const TransactionTypeSchema = _zod.z.enum([
    'CREDIT',
    'DEBIT'
]);
const TransactionStatusSchema = _zod.z.enum([
    'PENDING',
    'RECONCILED',
    'EXCLUDED'
]);
const BankTransactionSchema = _zod.z.object({
    id: _zod.z.string(),
    bankAccountId: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    date: _zod.z.coerce.date(),
    description: _zod.z.string(),
    amount: _zod.z.number(),
    type: TransactionTypeSchema.default('CREDIT'),
    reference: _zod.z.string().nullable().optional(),
    status: TransactionStatusSchema.default('PENDING'),
    journalEntryId: _zod.z.string().nullable().optional(),
    bankName: _zod.z.string().nullable().optional(),
    counterparty: _zod.z.string().nullable().optional(),
    notes: _zod.z.string().nullable().optional(),
    qrCode: _zod.z.string().nullable().optional(),
    telecomRef: _zod.z.string().nullable().optional(),
    voucherCode: _zod.z.string().nullable().optional(),
    matchScore: _zod.z.number().int().default(0),
    matchMethod: _zod.z.string().nullable().optional(),
    matchedInvoiceId: _zod.z.string().nullable().optional(),
    matchedBillId: _zod.z.string().nullable().optional(),
    // joined data
    bankAccountName: _zod.z.string().optional(),
    createdAt: _zod.z.coerce.date().optional()
});
const CreateBankTransactionSchema = _zod.z.object({
    bankAccountId: _zod.z.string().optional(),
    companyId: _zod.z.string().optional(),
    date: _zod.z.coerce.date(),
    description: _zod.z.string().min(1),
    amount: _zod.z.number(),
    type: TransactionTypeSchema.optional().default('CREDIT'),
    reference: _zod.z.string().optional(),
    notes: _zod.z.string().optional(),
    telecomRef: _zod.z.string().optional(),
    qrCode: _zod.z.string().optional(),
    voucherCode: _zod.z.string().optional(),
    counterparty: _zod.z.string().optional(),
    bankName: _zod.z.string().optional()
});
const UpdateBankTransactionSchema = _zod.z.object({
    status: TransactionStatusSchema.optional(),
    notes: _zod.z.string().optional(),
    description: _zod.z.string().optional(),
    reference: _zod.z.string().optional(),
    category: _zod.z.string().optional()
});
const ListBankTransactionsQuerySchema = _common.PaginationQuerySchema.merge(_common.DateRangeSchema).extend({
    companyId: _zod.z.string().optional(),
    bankAccountId: _zod.z.string().optional(),
    type: TransactionTypeSchema.optional(),
    status: TransactionStatusSchema.optional()
});
const BulkReconcileSchema = _zod.z.object({
    ids: _zod.z.array(_zod.z.string()).min(1),
    companyId: _zod.z.string().optional()
});
const ImportTransactionsSchema = _zod.z.object({
    bankAccountId: _zod.z.string(),
    rows: _zod.z.array(_zod.z.object({
        date: _zod.z.string(),
        description: _zod.z.string(),
        amount: _zod.z.number(),
        type: TransactionTypeSchema.optional(),
        reference: _zod.z.string().optional(),
        counterparty: _zod.z.string().optional(),
        bankName: _zod.z.string().optional(),
        telecomRef: _zod.z.string().optional()
    }))
});
const TransferTypeSchema = _zod.z.enum([
    'INTERNAL',
    'ACH',
    'WIRE'
]);
const TransferStatusSchema = _zod.z.enum([
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
]);
const FundTransferSchema = _zod.z.object({
    id: _zod.z.string(),
    fromAccountId: _zod.z.string(),
    toAccountId: _zod.z.string(),
    amount: _zod.z.number().positive(),
    currencyCode: _zod.z.string().default('ETB'),
    type: TransferTypeSchema.default('INTERNAL'),
    status: TransferStatusSchema.default('PENDING'),
    reference: _zod.z.string().nullable().optional(),
    note: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    journalEntryId: _zod.z.string().nullable().optional(),
    // joined
    fromAccountName: _zod.z.string().optional(),
    toAccountName: _zod.z.string().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    customFields: _zod.z.array(_customfields.CustomFieldWithValueSchema).optional()
});
const CreateFundTransferSchema = FundTransferSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    fromAccountName: true,
    toAccountName: true,
    customFields: true
}).extend({
    companyId: _zod.z.string().optional(),
    customFields: _customfields.CustomFieldValuesMapSchema.optional()
});
const ListFundTransfersQuerySchema = _common.PaginationQuerySchema.merge(_common.DateRangeSchema).extend({
    companyId: _zod.z.string().optional(),
    status: TransferStatusSchema.optional(),
    type: TransferTypeSchema.optional()
});
const BankFeedStatusSchema = _zod.z.enum([
    'CONNECTED',
    'DISCONNECTED',
    'ERROR',
    'PENDING_AUTH'
]);
const BankFeedProviderSchema = _zod.z.enum([
    'PLAID',
    'GOCARDLESS',
    'MANUAL'
]);
const BankFeedSchema = _zod.z.object({
    id: _zod.z.string(),
    bankAccountId: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    provider: BankFeedProviderSchema.default('MANUAL'),
    status: BankFeedStatusSchema.default('DISCONNECTED'),
    lastSyncAt: _zod.z.coerce.date().nullable().optional(),
    institutionId: _zod.z.string().nullable().optional(),
    institutionName: _zod.z.string().nullable().optional(),
    accessToken: _zod.z.string().nullable().optional(),
    errorMessage: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const ConnectBankFeedSchema = _zod.z.object({
    bankAccountId: _zod.z.string(),
    provider: BankFeedProviderSchema,
    institutionId: _zod.z.string().optional(),
    companyId: _zod.z.string().optional()
});
const ReconciliationStatusSchema = _zod.z.enum([
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'LOCKED'
]);
const ReconciliationSchema = _zod.z.object({
    id: _zod.z.string(),
    bankAccountId: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    statementDate: _zod.z.coerce.date(),
    openingBalance: _zod.z.number(),
    closingBalance: _zod.z.number(),
    reconciledBalance: _zod.z.number().default(0),
    discrepancy: _zod.z.number().default(0),
    status: ReconciliationStatusSchema.default('OPEN'),
    notes: _zod.z.string().nullable().optional(),
    reconciledBy: _zod.z.string().nullable().optional(),
    reconciledAt: _zod.z.coerce.date().nullable().optional(),
    bankAccountName: _zod.z.string().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const CreateReconciliationSchema = _zod.z.object({
    bankAccountId: _zod.z.string(),
    companyId: _zod.z.string().optional(),
    statementDate: _zod.z.coerce.date(),
    openingBalance: _zod.z.number(),
    closingBalance: _zod.z.number(),
    notes: _zod.z.string().optional()
});
const ReconciliationStatsSchema = _zod.z.object({
    total: _zod.z.number().int(),
    reconciled: _zod.z.number().int(),
    pending: _zod.z.number().int(),
    withProposedMatch: _zod.z.number().int().optional(),
    reconciliationRate: _zod.z.number().int(),
    byAccount: _zod.z.array(_zod.z.object({
        accountId: _zod.z.string(),
        accountName: _zod.z.string(),
        bankName: _zod.z.string().nullable(),
        pendingCount: _zod.z.number().int(),
        pendingAmount: _zod.z.number()
    }))
});
const SmartReconciliationInputSchema = _zod.z.object({
    companyId: _zod.z.string().optional(),
    bankAccountId: _zod.z.string().optional(),
    applyAutoReconcile: _zod.z.boolean().default(false),
    dateWindowDays: _zod.z.number().int().min(1).max(30).default(3)
});
const MatchConfirmSchema = _zod.z.object({
    matchType: _zod.z.enum([
        'INVOICE',
        'BILL'
    ]),
    matchId: _zod.z.string()
});
const BankingDashboardSchema = _zod.z.object({
    totalAccounts: _zod.z.number().int(),
    totalBalance: _zod.z.number(),
    liquidBalance: _zod.z.number(),
    creditCardBalance: _zod.z.number(),
    netWorth: _zod.z.number(),
    pendingTransactions: _zod.z.number().int(),
    unreconciledCount: _zod.z.number().int(),
    recentTransactions: _zod.z.array(BankTransactionSchema.partial()),
    cashFlow: _zod.z.object({
        totalIn: _zod.z.number(),
        totalOut: _zod.z.number(),
        net: _zod.z.number()
    }),
    currencyBreakdown: _zod.z.record(_zod.z.string(), _zod.z.number()),
    fxGainLoss: _zod.z.number()
});
const BankFxRateSchema = _zod.z.object({
    id: _zod.z.string(),
    fromCurrency: _zod.z.string(),
    toCurrency: _zod.z.string(),
    rate: _zod.z.number(),
    rateDate: _zod.z.coerce.date(),
    source: _zod.z.string().nullable().optional(),
    companyId: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const BankTransactionFxSchema = _zod.z.object({
    id: _zod.z.string(),
    bankTransactionId: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    fromCurrency: _zod.z.string(),
    toCurrency: _zod.z.string(),
    originalAmount: _zod.z.number(),
    convertedAmount: _zod.z.number(),
    rateAtBooking: _zod.z.number(),
    rateAtSettlement: _zod.z.number(),
    gainLoss: _zod.z.number(),
    reason: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const RecurringIntervalSchema = _zod.z.enum([
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'YEARLY'
]);
const RecurringStatusSchema = _zod.z.enum([
    'ACTIVE',
    'PAUSED',
    'COMPLETED'
]);
const RecurringTransactionSchema = _zod.z.object({
    id: _zod.z.string(),
    bankAccountId: _zod.z.string(),
    companyId: _zod.z.string().nullable().optional(),
    description: _zod.z.string(),
    amount: _zod.z.number(),
    type: TransactionTypeSchema.default('CREDIT'),
    interval: RecurringIntervalSchema.default('MONTHLY'),
    nextDate: _zod.z.coerce.date(),
    status: RecurringStatusSchema.default('ACTIVE'),
    reference: _zod.z.string().nullable().optional(),
    lastPostedAt: _zod.z.coerce.date().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const CreateRecurringTransactionSchema = _zod.z.object({
    bankAccountId: _zod.z.string(),
    companyId: _zod.z.string().optional(),
    description: _zod.z.string().min(1),
    amount: _zod.z.number(),
    type: TransactionTypeSchema.optional().default('CREDIT'),
    interval: RecurringIntervalSchema.optional().default('MONTHLY'),
    nextDate: _zod.z.coerce.date(),
    reference: _zod.z.string().optional()
});
const PostRecurringSchema = _zod.z.object({
    date: _zod.z.coerce.date().optional()
});
