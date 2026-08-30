/**
 * @ovds/contracts — Accounting Domain Schemas
 *
 * Zod schemas for:
 *   - Journal Entries (double-entry GL)
 *   - Trial Balance
 *   - General Ledger
 *   - Sub-Ledger (AR/AP aging)
 *   - IFRS compliance (15 / 16 / IAS 38 / IFRS 10)
 *   - GL Compliance dashboard & AABE audit-readiness
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
    get AabeDisclosureQuerySchema () {
        return AabeDisclosureQuerySchema;
    },
    get ApVendorSchema () {
        return ApVendorSchema;
    },
    get ArCustomerSchema () {
        return ArCustomerSchema;
    },
    get AuditReadinessSchema () {
        return AuditReadinessSchema;
    },
    get CreateJournalEntrySchema () {
        return CreateJournalEntrySchema;
    },
    get DualLedgerStatusSchema () {
        return DualLedgerStatusSchema;
    },
    get GeneralLedgerQuerySchema () {
        return GeneralLedgerQuerySchema;
    },
    get GlDashboardQuerySchema () {
        return GlDashboardQuerySchema;
    },
    get GlInquiryQuerySchema () {
        return GlInquiryQuerySchema;
    },
    get Ifrs15ScheduleCreateSchema () {
        return Ifrs15ScheduleCreateSchema;
    },
    get Ifrs16LeaseSchema () {
        return Ifrs16LeaseSchema;
    },
    get IfrsContractSnapshotSchema () {
        return IfrsContractSnapshotSchema;
    },
    get IfrsLeaseModificationSchema () {
        return IfrsLeaseModificationSchema;
    },
    get JournalEntrySchema () {
        return JournalEntrySchema;
    },
    get JournalLineSchema () {
        return JournalLineSchema;
    },
    get ListJournalEntriesQuerySchema () {
        return ListJournalEntriesQuerySchema;
    },
    get SubLedgerQuerySchema () {
        return SubLedgerQuerySchema;
    },
    get TrialBalanceQuerySchema () {
        return TrialBalanceQuerySchema;
    },
    get TrialBalanceRowSchema () {
        return TrialBalanceRowSchema;
    }
});
const _zod = require("zod");
const _common = require("./common");
// ── Shared primitives ─────────────────────────────────────────────────────────
const CompanyQuery = _zod.z.object({
    companyId: _zod.z.string().optional()
});
const PeriodSchema = _zod.z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
const JournalLineSchema = _zod.z.object({
    id: _zod.z.string().optional(),
    accountId: _zod.z.string(),
    description: _zod.z.string().nullable().optional(),
    debit: _zod.z.number().nonnegative().default(0),
    credit: _zod.z.number().nonnegative().default(0),
    costCenterId: _zod.z.string().nullable().optional()
});
const JournalEntrySchema = _zod.z.object({
    id: _zod.z.string(),
    date: _zod.z.coerce.date(),
    reference: _zod.z.string().nullable().optional(),
    description: _zod.z.string(),
    status: _zod.z.string().default('POSTED'),
    companyId: _zod.z.string().nullable().optional(),
    postedBy: _zod.z.string().nullable().optional(),
    createdAt: _zod.z.coerce.date(),
    updatedAt: _zod.z.coerce.date(),
    journalLine: _zod.z.array(JournalLineSchema).optional()
});
const CreateJournalEntrySchema = _zod.z.object({
    date: _zod.z.string().optional(),
    reference: _zod.z.string().optional(),
    description: _zod.z.string().min(1),
    companyId: _zod.z.string().optional(),
    lines: _zod.z.array(_zod.z.object({
        accountId: _zod.z.string(),
        description: _zod.z.string().optional(),
        debit: _zod.z.number().nonnegative().optional(),
        credit: _zod.z.number().nonnegative().optional(),
        costCenterId: _zod.z.string().optional()
    })).min(2, 'At least 2 lines required')
});
const ListJournalEntriesQuerySchema = _common.PaginationQuerySchema.merge(CompanyQuery).extend({
    status: _zod.z.string().optional(),
    from: _zod.z.string().optional(),
    to: _zod.z.string().optional()
});
const TrialBalanceRowSchema = _zod.z.object({
    accountId: _zod.z.string(),
    accountCode: _zod.z.string(),
    accountName: _zod.z.string(),
    accountType: _zod.z.string(),
    accountCategory: _zod.z.string(),
    parentId: _zod.z.string().nullable().optional(),
    totalDebit: _zod.z.number(),
    totalCredit: _zod.z.number(),
    balance: _zod.z.number(),
    normalizedBalance: _zod.z.number()
});
const TrialBalanceQuerySchema = CompanyQuery.extend({
    from: _zod.z.string().optional(),
    to: _zod.z.string().optional()
});
const GeneralLedgerQuerySchema = _common.PaginationQuerySchema.merge(CompanyQuery).extend({
    accountId: _zod.z.string().optional(),
    from: _zod.z.string().optional(),
    to: _zod.z.string().optional()
});
const ArCustomerSchema = _zod.z.object({
    customerId: _zod.z.string(),
    customerName: _zod.z.string(),
    outstanding: _zod.z.number(),
    current: _zod.z.number(),
    days1_30: _zod.z.number(),
    days31_60: _zod.z.number(),
    days61_90: _zod.z.number(),
    days90Plus: _zod.z.number(),
    lastInvoiceDate: _zod.z.coerce.date().optional(),
    invoiceCount: _zod.z.number().int()
});
const ApVendorSchema = _zod.z.object({
    vendorId: _zod.z.string(),
    vendorName: _zod.z.string(),
    tin: _zod.z.string().nullable().optional(),
    outstanding: _zod.z.number(),
    current: _zod.z.number(),
    days1_30: _zod.z.number(),
    days31_60: _zod.z.number(),
    days60Plus: _zod.z.number(),
    nextDueDate: _zod.z.coerce.date().optional()
});
const SubLedgerQuerySchema = CompanyQuery.extend({
    asOf: _zod.z.string().optional()
});
const GlInquiryQuerySchema = _zod.z.object({
    accountId: _zod.z.string(),
    startDate: _zod.z.string(),
    endDate: _zod.z.string(),
    companyId: _zod.z.string().optional()
});
const IfrsContractSnapshotSchema = _zod.z.object({
    invoiceId: _zod.z.string(),
    companyId: _zod.z.string().optional(),
    months: _zod.z.number().int().min(1).max(120).optional()
});
const Ifrs15ScheduleCreateSchema = _zod.z.object({
    companyId: _zod.z.string(),
    contractId: _zod.z.string(),
    performanceObligationId: _zod.z.string(),
    totalTransactionPrice: _zod.z.number().positive(),
    currencyCode: _zod.z.string().default('ETB'),
    startDate: _zod.z.string(),
    endDate: _zod.z.string(),
    recognitionMethod: _zod.z.enum([
        'OVER_TIME',
        'POINT_IN_TIME'
    ])
});
const Ifrs16LeaseSchema = _zod.z.object({
    id: _zod.z.string(),
    leaseNumber: _zod.z.string(),
    leaseType: _zod.z.enum([
        'FINANCE',
        'OPERATING'
    ]),
    status: _zod.z.string(),
    assetDescription: _zod.z.string(),
    lessorName: _zod.z.string().nullable().optional(),
    commencementDate: _zod.z.coerce.date(),
    endDate: _zod.z.coerce.date(),
    termMonths: _zod.z.number().int(),
    monthlyPayment: _zod.z.number(),
    discountRate: _zod.z.number(),
    rouAssetInitial: _zod.z.number(),
    rouAssetCarrying: _zod.z.number(),
    companyId: _zod.z.string().nullable().optional()
});
const IfrsLeaseModificationSchema = _zod.z.object({
    effectiveDate: _zod.z.string(),
    modificationType: _zod.z.string(),
    revisedMonthlyPayment: _zod.z.number().optional(),
    revisedTermMonths: _zod.z.number().int().optional(),
    revisedDiscountRate: _zod.z.number().optional(),
    notes: _zod.z.string().optional()
});
const AabeDisclosureQuerySchema = CompanyQuery.extend({
    period: PeriodSchema
});
const AuditReadinessSchema = _zod.z.object({
    companyId: _zod.z.string(),
    period: _zod.z.string(),
    score: _zod.z.number().int().min(0).max(100),
    grade: _zod.z.enum([
        'A',
        'B',
        'C',
        'F'
    ]),
    riskLevel: _zod.z.enum([
        'LOW',
        'MEDIUM',
        'HIGH'
    ]),
    passed: _zod.z.number().int(),
    failed: _zod.z.number().int(),
    recommendation: _zod.z.string(),
    criteria: _zod.z.array(_zod.z.object({
        name: _zod.z.string(),
        weight: _zod.z.number(),
        passed: _zod.z.boolean(),
        detail: _zod.z.string()
    })),
    generatedAt: _zod.z.string()
});
const GlDashboardQuerySchema = CompanyQuery.extend({
    period: PeriodSchema.optional(),
    startDate: _zod.z.string().optional(),
    endDate: _zod.z.string().optional()
});
const DualLedgerStatusSchema = _zod.z.object({
    companyId: _zod.z.string(),
    period: _zod.z.string(),
    managementTaxBook: _zod.z.object({
        journalEntries: _zod.z.number().int(),
        description: _zod.z.string(),
        status: _zod.z.string()
    }),
    ifrsStatutoryBook: _zod.z.object({
        ifrsTaggedEntries: _zod.z.number().int(),
        description: _zod.z.string(),
        status: _zod.z.string()
    }),
    deferredTax: _zod.z.object({
        timingDifferenceRecords: _zod.z.number().int(),
        description: _zod.z.string()
    }),
    reconciled: _zod.z.boolean(),
    aabeProclamation: _zod.z.string(),
    generatedAt: _zod.z.string()
});
