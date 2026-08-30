/**
 * @ovds/contracts — Monetization oRPC Router Contract
 *
 * Covers subscription plans, trials, lifetime purchases, and feature entitlements.
 *
 *   products.*      — list available plans/add-ons
 *   subscriptions.* — create, cancel, get active subscription
 *   trials.*        — start/convert/check trial status
 *   purchases.*     — record lifetime purchase
 *   entitlements.*  — check feature entitlement, get full status
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "monetizationContract", {
    enumerable: true,
    get: function() {
        return monetizationContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _monetization = require("../schemas/monetization");
const Q = _zod.z.object({
    companyId: _zod.z.string().optional()
});
// ── Products ──────────────────────────────────────────────────────────────────
const productsContract = {
    list: _contract.oc.input(_zod.z.object({
        activeOnly: _zod.z.boolean().optional()
    })).output(_zod.z.array(_monetization.MonetizationProductSchema)),
    get: _contract.oc.input(_zod.z.object({
        id: _zod.z.string()
    })).output(_monetization.MonetizationProductSchema)
};
// ── Subscriptions ─────────────────────────────────────────────────────────────
const subscriptionsContract = {
    get: _contract.oc.input(Q).output(_monetization.MonetizationSubscriptionSchema.nullable()),
    create: _contract.oc.input(_monetization.CreateSubscriptionSchema.merge(Q)).output(_monetization.MonetizationSubscriptionSchema),
    cancel: _contract.oc.input(_monetization.CancelSubscriptionSchema.merge(Q)).output(_monetization.MonetizationSubscriptionSchema)
};
// ── Trials ────────────────────────────────────────────────────────────────────
const trialsContract = {
    get: _contract.oc.input(Q).output(_monetization.MonetizationTrialSchema.nullable()),
    start: _contract.oc.input(_monetization.StartTrialSchema.merge(Q)).output(_monetization.MonetizationTrialSchema),
    convert: _contract.oc.input(Q).output(_monetization.MonetizationTrialSchema)
};
// ── Lifetime Purchases ────────────────────────────────────────────────────────
const purchasesContract = {
    list: _contract.oc.input(Q).output(_zod.z.array(_monetization.MonetizationPurchaseSchema)),
    create: _contract.oc.input(_monetization.CreatePurchaseSchema.merge(Q)).output(_monetization.MonetizationPurchaseSchema)
};
// ── Entitlements ──────────────────────────────────────────────────────────────
const entitlementsContract = {
    status: _contract.oc.input(Q).output(_monetization.EntitlementStatusResponseSchema),
    check: _contract.oc.input(_zod.z.object({
        featureKey: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_monetization.EntitlementDecisionSchema),
    list: _contract.oc.input(Q).output(_zod.z.array(_monetization.MonetizationEntitlementSchema)),
    grant: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        featureKey: _zod.z.string(),
        source: _zod.z.string(),
        expiresAt: _zod.z.string().optional()
    })).output(_monetization.MonetizationEntitlementSchema),
    revoke: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        featureKey: _zod.z.string()
    })).output(_zod.z.object({
        success: _zod.z.boolean()
    }))
};
const monetizationContract = _contract.oc.router({
    products: _contract.oc.router(productsContract),
    subscriptions: _contract.oc.router(subscriptionsContract),
    trials: _contract.oc.router(trialsContract),
    purchases: _contract.oc.router(purchasesContract),
    entitlements: _contract.oc.router(entitlementsContract)
});
