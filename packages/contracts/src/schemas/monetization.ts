/**
 * @ovds/contracts/schemas/monetization
 *
 * Zod schemas for the monetization domain — plans, subscriptions, trials,
 * lifetime purchases, and feature entitlements.
 *
 * Aligned with packages/shared/src/monetization.ts types.
 */
import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const MonetizationProductTypeSchema = z.enum(['SUBSCRIPTION', 'LIFETIME', 'ADDON']);
export const BillingCycleSchema = z.enum(['MONTHLY', 'ANNUAL']);
export const SubscriptionStatusSchema = z.enum([
  'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PAUSED',
]);
export const PurchaseStatusSchema = z.enum(['COMPLETED', 'REFUNDED', 'DISPUTED']);
export const TrialStatusSchema = z.enum(['ACTIVE', 'EXPIRED', 'CONVERTED']);
export const EntitlementSourceSchema = z.enum(['SUBSCRIPTION', 'LIFETIME', 'TRIAL']);

// ── Product ───────────────────────────────────────────────────────────────────

export const MonetizationProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: MonetizationProductTypeSchema,
  featureKeys: z.string(),
  priceMonthly: z.number().nonnegative(),
  priceAnnual: z.number().nonnegative(),
  priceLifetime: z.number().nonnegative(),
  trialDays: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── Subscription ──────────────────────────────────────────────────────────────

export const MonetizationSubscriptionSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  productId: z.string(),
  billingCycle: BillingCycleSchema,
  status: SubscriptionStatusSchema,
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  providerRef: z.string().nullish(),
  providerSubId: z.string().nullish(),
  cancelledAt: z.string().nullish(),
  cancelReason: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  product: MonetizationProductSchema.optional(),
});

export const CreateSubscriptionSchema = z.object({
  productId: z.string(),
  billingCycle: BillingCycleSchema,
  providerRef: z.string().optional(),
  providerSubId: z.string().optional(),
});

export const CancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
});

// ── Purchase ──────────────────────────────────────────────────────────────────

export const MonetizationPurchaseSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  productId: z.string(),
  status: PurchaseStatusSchema,
  amountPaid: z.number().nonnegative(),
  providerRef: z.string().nullish(),
  receiptUrl: z.string().nullish(),
  refundedAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  product: MonetizationProductSchema.optional(),
});

export const CreatePurchaseSchema = z.object({
  productId: z.string(),
  amountPaid: z.number().nonnegative(),
  providerRef: z.string().optional(),
  receiptUrl: z.string().optional(),
});

// ── Trial ─────────────────────────────────────────────────────────────────────

export const TrialRestrictionSchema = z.object({
  mode: z.enum(['TIME_BOUND', 'VOLUME_CAP', 'STRUCTURAL']),
  maxDocuments: z.number().int().nullish(),
  maxSkus: z.number().int().nullish(),
  maxUsers: z.number().int().nullish(),
  maxBranches: z.number().int().nullish(),
  lockedFeatures: z.array(z.string()),
});

export const MonetizationTrialSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  productId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: TrialStatusSchema,
  convertedAt: z.string().nullish(),
  restrictionConfig: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  product: MonetizationProductSchema.optional(),
});

export const StartTrialSchema = z.object({
  productId: z.string(),
  restrictionMode: z.enum(['TIME_BOUND', 'VOLUME_CAP', 'STRUCTURAL']).optional(),
  trialDays: z.number().int().positive().optional(),
  maxDocuments: z.number().int().positive().optional(),
  maxSkus: z.number().int().positive().optional(),
  maxUsers: z.number().int().positive().optional(),
  maxBranches: z.number().int().positive().optional(),
});

// ── Entitlement ───────────────────────────────────────────────────────────────

export const MonetizationEntitlementSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  featureKey: z.string(),
  source: EntitlementSourceSchema,
  expiresAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EntitlementDecisionSchema = z.object({
  entitled: z.boolean(),
  featureKey: z.string(),
  source: EntitlementSourceSchema.optional(),
  expiresAt: z.string().nullish(),
  reason: z.string().optional(),
});

export const EntitlementStatusResponseSchema = z.object({
  companyId: z.string(),
  entitledFeatures: z.array(z.string()),
  entitlements: z.array(MonetizationEntitlementSchema),
  activeSubscription: MonetizationSubscriptionSchema.nullable(),
  activeTrial: MonetizationTrialSchema.nullable(),
  lifetimePurchases: z.array(MonetizationPurchaseSchema),
  trialDaysRemaining: z.number().int().nullable(),
  planSlug: z.string().nullable(),
  trialRestriction: TrialRestrictionSchema.nullish(),
});
