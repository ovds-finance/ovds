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
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  MonetizationProductSchema,
  MonetizationSubscriptionSchema,
  MonetizationTrialSchema,
  MonetizationPurchaseSchema,
  MonetizationEntitlementSchema,
  EntitlementDecisionSchema,
  EntitlementStatusResponseSchema,
  CreateSubscriptionSchema,
  CancelSubscriptionSchema,
  CreatePurchaseSchema,
  StartTrialSchema,
} from '../schemas/monetization';

const Q = z.object({ companyId: z.string().optional() });

// ── Products ──────────────────────────────────────────────────────────────────

const productsContract = {
  list: oc
    .input(z.object({ activeOnly: z.boolean().optional() }))
    .output(z.array(MonetizationProductSchema)),
  get: oc
    .input(z.object({ id: z.string() }))
    .output(MonetizationProductSchema),
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

const subscriptionsContract = {
  get: oc
    .input(Q)
    .output(MonetizationSubscriptionSchema.nullable()),
  create: oc
    .input(CreateSubscriptionSchema.merge(Q))
    .output(MonetizationSubscriptionSchema),
  cancel: oc
    .input(CancelSubscriptionSchema.merge(Q))
    .output(MonetizationSubscriptionSchema),
};

// ── Trials ────────────────────────────────────────────────────────────────────

const trialsContract = {
  get: oc
    .input(Q)
    .output(MonetizationTrialSchema.nullable()),
  start: oc
    .input(StartTrialSchema.merge(Q))
    .output(MonetizationTrialSchema),
  convert: oc
    .input(Q)
    .output(MonetizationTrialSchema),
};

// ── Lifetime Purchases ────────────────────────────────────────────────────────

const purchasesContract = {
  list: oc
    .input(Q)
    .output(z.array(MonetizationPurchaseSchema)),
  create: oc
    .input(CreatePurchaseSchema.merge(Q))
    .output(MonetizationPurchaseSchema),
};

// ── Entitlements ──────────────────────────────────────────────────────────────

const entitlementsContract = {
  status: oc
    .input(Q)
    .output(EntitlementStatusResponseSchema),
  check: oc
    .input(z.object({ featureKey: z.string(), companyId: z.string().optional() }))
    .output(EntitlementDecisionSchema),
  list: oc
    .input(Q)
    .output(z.array(MonetizationEntitlementSchema)),
  grant: oc
    .input(z.object({ companyId: z.string(), featureKey: z.string(), source: z.string(), expiresAt: z.string().optional() }))
    .output(MonetizationEntitlementSchema),
  revoke: oc
    .input(z.object({ companyId: z.string(), featureKey: z.string() }))
    .output(z.object({ success: z.boolean() })),
};

// ── Root monetization contract ────────────────────────────────────────────────

export const monetizationContract = oc.router({
  products:      oc.router(productsContract),
  subscriptions: oc.router(subscriptionsContract),
  trials:        oc.router(trialsContract),
  purchases:     oc.router(purchasesContract),
  entitlements:  oc.router(entitlementsContract),
});

export type MonetizationContract = typeof monetizationContract;
