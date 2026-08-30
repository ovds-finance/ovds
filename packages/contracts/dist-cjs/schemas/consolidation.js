/**
 * @ovds/contracts — Consolidation / Intercompany Elimination Schemas
 *
 * Zod schemas for IFRS 10 group consolidation and intercompany elimination procedures.
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
    get ConsolidatedSummarySchema () {
        return ConsolidatedSummarySchema;
    },
    get CreateEliminationSchema () {
        return CreateEliminationSchema;
    },
    get DetectUnmatchedResultSchema () {
        return DetectUnmatchedResultSchema;
    },
    get EliminationSchema () {
        return EliminationSchema;
    },
    get EliminationStatusSchema () {
        return EliminationStatusSchema;
    },
    get EliminationTypeSchema () {
        return EliminationTypeSchema;
    },
    get LedgerIntegrityResultSchema () {
        return LedgerIntegrityResultSchema;
    },
    get LedgerIntegrityViolationSchema () {
        return LedgerIntegrityViolationSchema;
    },
    get ListEliminationsQuerySchema () {
        return ListEliminationsQuerySchema;
    },
    get RunEliminationsResultSchema () {
        return RunEliminationsResultSchema;
    },
    get UnmatchedBalanceSchema () {
        return UnmatchedBalanceSchema;
    }
});
const _zod = require("zod");
/** YYYY-MM period string */ const PeriodSchema = _zod.z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
const EliminationTypeSchema = _zod.z.enum([
    'RECEIVABLE',
    'PAYABLE',
    'REVENUE',
    'EXPENSE',
    'DIVIDEND',
    'INVESTMENT'
]);
const EliminationStatusSchema = _zod.z.enum([
    'PENDING',
    'POSTED',
    'REVERSED'
]);
const EliminationSchema = _zod.z.object({
    id: _zod.z.string(),
    fromCompanyId: _zod.z.string(),
    toCompanyId: _zod.z.string(),
    intercompanyTxId: _zod.z.string().nullable().optional(),
    period: _zod.z.string(),
    eliminationType: _zod.z.string(),
    amount: _zod.z.number(),
    journalEntryId: _zod.z.string().nullable().optional(),
    status: _zod.z.string(),
    notes: _zod.z.string().nullable().optional(),
    createdBy: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date()
});
const CreateEliminationSchema = _zod.z.object({
    fromCompanyId: _zod.z.string(),
    toCompanyId: _zod.z.string(),
    period: PeriodSchema,
    eliminationType: EliminationTypeSchema,
    amount: _zod.z.number().positive(),
    intercompanyTxId: _zod.z.string().optional(),
    notes: _zod.z.string().optional()
});
const ListEliminationsQuerySchema = _zod.z.object({
    fromCompanyId: _zod.z.string().optional(),
    toCompanyId: _zod.z.string().optional(),
    period: PeriodSchema.optional(),
    status: EliminationStatusSchema.optional(),
    page: _zod.z.coerce.number().int().min(1).default(1),
    pageSize: _zod.z.coerce.number().int().min(1).max(500).default(50)
});
const UnmatchedBalanceSchema = _zod.z.object({
    transactionId: _zod.z.string(),
    fromCompanyId: _zod.z.string(),
    toCompanyId: _zod.z.string(),
    amount: _zod.z.number(),
    type: _zod.z.string(),
    description: _zod.z.string().nullable().optional()
});
const DetectUnmatchedResultSchema = _zod.z.object({
    unmatched: _zod.z.array(UnmatchedBalanceSchema),
    count: _zod.z.number().int()
});
const RunEliminationsResultSchema = _zod.z.object({
    period: _zod.z.string(),
    posted: _zod.z.number().int(),
    skipped: _zod.z.number().int(),
    failed: _zod.z.number().int(),
    results: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    errors: _zod.z.array(_zod.z.object({
        transactionId: _zod.z.string(),
        error: _zod.z.string()
    }))
});
const ConsolidatedSummarySchema = _zod.z.object({
    entityGroupId: _zod.z.string(),
    period: _zod.z.string(),
    reportCurrency: _zod.z.string(),
    companies: _zod.z.array(_zod.z.string()),
    grossRevenue: _zod.z.number(),
    grossExpenses: _zod.z.number(),
    eliminatedRevenue: _zod.z.number(),
    eliminatedExpenses: _zod.z.number(),
    netRevenue: _zod.z.number(),
    netExpenses: _zod.z.number(),
    grossAssets: _zod.z.number(),
    grossLiabilities: _zod.z.number(),
    eliminatedReceivables: _zod.z.number(),
    eliminatedPayables: _zod.z.number(),
    netAssets: _zod.z.number(),
    netLiabilities: _zod.z.number(),
    eliminationsApplied: _zod.z.number().int(),
    pendingEliminations: _zod.z.number().int()
});
const LedgerIntegrityViolationSchema = _zod.z.object({
    sourceId: _zod.z.string(),
    storedHash: _zod.z.string(),
    expectedHash: _zod.z.string(),
    verifiedAt: _zod.z.string()
});
const LedgerIntegrityResultSchema = _zod.z.object({
    companyId: _zod.z.string(),
    intact: _zod.z.boolean(),
    verified: _zod.z.number().int(),
    violations: _zod.z.number().int(),
    details: _zod.z.array(LedgerIntegrityViolationSchema)
});
