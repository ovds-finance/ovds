/**
 * @ovds/contracts — IFRS Schemas
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
    get ConsolidatedStatementSchema () {
        return ConsolidatedStatementSchema;
    },
    get EclProvisionSchema () {
        return EclProvisionSchema;
    },
    get IfrsDashboardQuerySchema () {
        return IfrsDashboardQuerySchema;
    },
    get IfrsStandardSchema () {
        return IfrsStandardSchema;
    },
    get IfrsTemplateSchema () {
        return IfrsTemplateSchema;
    },
    get LeaseSchema () {
        return LeaseSchema;
    }
});
const _zod = require("zod");
const IfrsStandardSchema = _zod.z.enum([
    'IFRS_15',
    'IFRS_16',
    'IFRS_9',
    'IFRS_10',
    'IFRS_12',
    'IFRS_13',
    'IFRS_18'
]);
const IfrsTemplateSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    companyId: _zod.z.string().uuid().optional(),
    type: IfrsStandardSchema,
    name: _zod.z.string(),
    period: _zod.z.string().optional(),
    isIfrs: _zod.z.boolean().default(true),
    templateJson: _zod.z.string(),
    previewHtml: _zod.z.string().optional(),
    isActive: _zod.z.boolean().default(true),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const ConsolidatedStatementSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    companyId: _zod.z.string().uuid(),
    statementType: _zod.z.string(),
    periodStart: _zod.z.string(),
    periodEnd: _zod.z.string(),
    currency: _zod.z.string().default('ETB'),
    data: _zod.z.record(_zod.z.string(), _zod.z.any()),
    status: _zod.z.enum([
        'DRAFT',
        'REVIEWED',
        'APPROVED',
        'PUBLISHED'
    ]),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const EclProvisionSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    companyId: _zod.z.string().uuid(),
    stage: _zod.z.number().int().min(1).max(3),
    category: _zod.z.string(),
    grossCarryingAmount: _zod.z.number().nonnegative(),
    expectedCreditLoss: _zod.z.number().nonnegative(),
    provisionBalance: _zod.z.number().nonnegative(),
    asOfDate: _zod.z.string(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const LeaseSchema = _zod.z.object({
    id: _zod.z.string().uuid(),
    companyId: _zod.z.string().uuid(),
    assetId: _zod.z.string().uuid().optional(),
    lessorName: _zod.z.string().optional(),
    leaseStartDate: _zod.z.string(),
    leaseEndDate: _zod.z.string(),
    monthlyPayment: _zod.z.number().nonnegative(),
    discountRate: _zod.z.number().nonnegative(),
    rouAsset: _zod.z.number().nonnegative(),
    leaseLiability: _zod.z.number().nonnegative(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const IfrsDashboardQuerySchema = _zod.z.object({
    standard: IfrsStandardSchema.optional(),
    periodStart: _zod.z.string().optional(),
    periodEnd: _zod.z.string().optional()
});
