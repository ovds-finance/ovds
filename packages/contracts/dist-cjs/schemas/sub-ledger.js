/**
 * @ovds/contracts — Sub-Ledger Schemas
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
    get SubLedgerEntriesQuerySchema () {
        return SubLedgerEntriesQuerySchema;
    },
    get SubLedgerEntrySchema () {
        return SubLedgerEntrySchema;
    },
    get SubLedgerSummarySchema () {
        return SubLedgerSummarySchema;
    },
    get SubLedgerTypeSchema () {
        return SubLedgerTypeSchema;
    }
});
const _zod = require("zod");
const SubLedgerTypeSchema = _zod.z.enum([
    'ACCOUNTS_RECEIVABLE',
    'ACCOUNTS_PAYABLE',
    'FIXED_ASSETS',
    'INVENTORY',
    'PAYROLL',
    'PROJECT'
]);
const SubLedgerEntrySchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    companyId: _zod.z.string().uuid(),
    type: SubLedgerTypeSchema,
    referenceId: _zod.z.string(),
    accountId: _zod.z.string().uuid(),
    debit: _zod.z.number().nonnegative().default(0),
    credit: _zod.z.number().nonnegative().default(0),
    currencyCode: _zod.z.string().default('ETB'),
    description: _zod.z.string().optional(),
    transactionDate: _zod.z.string(),
    postedAt: _zod.z.string().optional(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const SubLedgerSummarySchema = _zod.z.object({
    type: SubLedgerTypeSchema,
    totalDebit: _zod.z.number().nonnegative(),
    totalCredit: _zod.z.number().nonnegative(),
    balance: _zod.z.number(),
    entryCount: _zod.z.number().int().nonnegative()
});
const SubLedgerEntriesQuerySchema = _zod.z.object({
    type: SubLedgerTypeSchema.optional(),
    accountId: _zod.z.string().uuid().optional(),
    dateFrom: _zod.z.string().optional(),
    dateTo: _zod.z.string().optional(),
    page: _zod.z.number().int().positive().default(1),
    take: _zod.z.number().int().positive().max(100).default(20)
});
