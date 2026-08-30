/**
 * @ovds/contracts/schemas/monetization
 *
 * Zod schemas for the monetization domain — plans, subscriptions, trials,
 * lifetime purchases, and feature entitlements.
 *
 * Aligned with packages/shared/src/monetization.ts types.
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
    get BillingCycleSchema () {
        return BillingCycleSchema;
    },
    get CancelSubscriptionSchema () {
        return CancelSubscriptionSchema;
    },
    get CreatePurchaseSchema () {
        return CreatePurchaseSchema;
    },
    get CreateSubscriptionSchema () {
        return CreateSubscriptionSchema;
    },
    get EntitlementDecisionSchema () {
        return EntitlementDecisionSchema;
    },
    get EntitlementSourceSchema () {
        return EntitlementSourceSchema;
    },
    get EntitlementStatusResponseSchema () {
        return EntitlementStatusResponseSchema;
    },
    get MonetizationEntitlementSchema () {
        return MonetizationEntitlementSchema;
    },
    get MonetizationProductSchema () {
        return MonetizationProductSchema;
    },
    get MonetizationProductTypeSchema () {
        return MonetizationProductTypeSchema;
    },
    get MonetizationPurchaseSchema () {
        return MonetizationPurchaseSchema;
    },
    get MonetizationSubscriptionSchema () {
        return MonetizationSubscriptionSchema;
    },
    get MonetizationTrialSchema () {
        return MonetizationTrialSchema;
    },
    get PurchaseStatusSchema () {
        return PurchaseStatusSchema;
    },
    get StartTrialSchema () {
        return StartTrialSchema;
    },
    get SubscriptionStatusSchema () {
        return SubscriptionStatusSchema;
    },
    get TrialRestrictionSchema () {
        return TrialRestrictionSchema;
    },
    get TrialStatusSchema () {
        return TrialStatusSchema;
    }
});
const _zod = require("zod");
const MonetizationProductTypeSchema = _zod.z.enum([
    'SUBSCRIPTION',
    'LIFETIME',
    'ADDON'
]);
const BillingCycleSchema = _zod.z.enum([
    'MONTHLY',
    'ANNUAL'
]);
const SubscriptionStatusSchema = _zod.z.enum([
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'PAUSED'
]);
const PurchaseStatusSchema = _zod.z.enum([
    'COMPLETED',
    'REFUNDED',
    'DISPUTED'
]);
const TrialStatusSchema = _zod.z.enum([
    'ACTIVE',
    'EXPIRED',
    'CONVERTED'
]);
const EntitlementSourceSchema = _zod.z.enum([
    'SUBSCRIPTION',
    'LIFETIME',
    'TRIAL'
]);
const MonetizationProductSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    slug: _zod.z.string(),
    type: MonetizationProductTypeSchema,
    featureKeys: _zod.z.string(),
    priceMonthly: _zod.z.number().nonnegative(),
    priceAnnual: _zod.z.number().nonnegative(),
    priceLifetime: _zod.z.number().nonnegative(),
    trialDays: _zod.z.number().int().nonnegative(),
    isActive: _zod.z.boolean(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const MonetizationSubscriptionSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string(),
    productId: _zod.z.string(),
    billingCycle: BillingCycleSchema,
    status: SubscriptionStatusSchema,
    currentPeriodStart: _zod.z.string(),
    currentPeriodEnd: _zod.z.string(),
    providerRef: _zod.z.string().nullish(),
    providerSubId: _zod.z.string().nullish(),
    cancelledAt: _zod.z.string().nullish(),
    cancelReason: _zod.z.string().nullish(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string(),
    product: MonetizationProductSchema.optional()
});
const CreateSubscriptionSchema = _zod.z.object({
    productId: _zod.z.string(),
    billingCycle: BillingCycleSchema,
    providerRef: _zod.z.string().optional(),
    providerSubId: _zod.z.string().optional()
});
const CancelSubscriptionSchema = _zod.z.object({
    reason: _zod.z.string().optional()
});
const MonetizationPurchaseSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string(),
    productId: _zod.z.string(),
    status: PurchaseStatusSchema,
    amountPaid: _zod.z.number().nonnegative(),
    providerRef: _zod.z.string().nullish(),
    receiptUrl: _zod.z.string().nullish(),
    refundedAt: _zod.z.string().nullish(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string(),
    product: MonetizationProductSchema.optional()
});
const CreatePurchaseSchema = _zod.z.object({
    productId: _zod.z.string(),
    amountPaid: _zod.z.number().nonnegative(),
    providerRef: _zod.z.string().optional(),
    receiptUrl: _zod.z.string().optional()
});
const TrialRestrictionSchema = _zod.z.object({
    mode: _zod.z.enum([
        'TIME_BOUND',
        'VOLUME_CAP',
        'STRUCTURAL'
    ]),
    maxDocuments: _zod.z.number().int().nullish(),
    maxSkus: _zod.z.number().int().nullish(),
    maxUsers: _zod.z.number().int().nullish(),
    maxBranches: _zod.z.number().int().nullish(),
    lockedFeatures: _zod.z.array(_zod.z.string())
});
const MonetizationTrialSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string(),
    productId: _zod.z.string(),
    startsAt: _zod.z.string(),
    endsAt: _zod.z.string(),
    status: TrialStatusSchema,
    convertedAt: _zod.z.string().nullish(),
    restrictionConfig: _zod.z.string().nullish(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string(),
    product: MonetizationProductSchema.optional()
});
const StartTrialSchema = _zod.z.object({
    productId: _zod.z.string(),
    restrictionMode: _zod.z.enum([
        'TIME_BOUND',
        'VOLUME_CAP',
        'STRUCTURAL'
    ]).optional(),
    trialDays: _zod.z.number().int().positive().optional(),
    maxDocuments: _zod.z.number().int().positive().optional(),
    maxSkus: _zod.z.number().int().positive().optional(),
    maxUsers: _zod.z.number().int().positive().optional(),
    maxBranches: _zod.z.number().int().positive().optional()
});
const MonetizationEntitlementSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string(),
    featureKey: _zod.z.string(),
    source: EntitlementSourceSchema,
    expiresAt: _zod.z.string().nullish(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
const EntitlementDecisionSchema = _zod.z.object({
    entitled: _zod.z.boolean(),
    featureKey: _zod.z.string(),
    source: EntitlementSourceSchema.optional(),
    expiresAt: _zod.z.string().nullish(),
    reason: _zod.z.string().optional()
});
const EntitlementStatusResponseSchema = _zod.z.object({
    companyId: _zod.z.string(),
    entitledFeatures: _zod.z.array(_zod.z.string()),
    entitlements: _zod.z.array(MonetizationEntitlementSchema),
    activeSubscription: MonetizationSubscriptionSchema.nullable(),
    activeTrial: MonetizationTrialSchema.nullable(),
    lifetimePurchases: _zod.z.array(MonetizationPurchaseSchema),
    trialDaysRemaining: _zod.z.number().int().nullable(),
    planSlug: _zod.z.string().nullable(),
    trialRestriction: TrialRestrictionSchema.nullish()
});
