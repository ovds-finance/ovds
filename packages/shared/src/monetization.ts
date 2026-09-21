/**
 * @ovds/shared — Monetization types
 * Shared between backend (NestJS) and frontend (React).
 * The backend is the SOLE authority for entitlement decisions.
 */

// -- Plan / Product ------------------------------------------------------------

export type MonetizationProductType = 'SUBSCRIPTION' | 'LIFETIME' | 'ADDON';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface MonetizationProduct {
  id: string;
  name: string;
  slug: string;
  type: MonetizationProductType;
  billingCycle?: BillingCycle;
  /** JSON-encoded string[] of feature keys */
  featureKeys: string;
  priceMonthly: number;
  priceAnnual: number;
  priceLifetime: number;
  trialDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Subscription -------------------------------------------------------------

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAUSED';

export interface MonetizationSubscription {
  id: string;
  companyId: string;
  productId: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  providerRef?: string | null;
  providerSubId?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: MonetizationProduct;
}

// -- Lifetime Purchase ---------------------------------------------------------

export type PurchaseStatus = 'COMPLETED' | 'REFUNDED' | 'DISPUTED';

export interface MonetizationPurchase {
  id: string;
  companyId: string;
  productId: string;
  status: PurchaseStatus;
  amountPaid: number;
  providerRef?: string | null;
  receiptUrl?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: MonetizationProduct;
}

// -- Free Trial ----------------------------------------------------------------

export type TrialStatus = 'ACTIVE' | 'EXPIRED' | 'CONVERTED';

export interface MonetizationTrial {
  id: string;
  companyId: string;
  productId: string;
  startsAt: string;
  endsAt: string;
  status: TrialStatus;
  convertedAt?: string | null;
  /**
   * §4.2 Trial restriction config JSON.
   * Shape: { mode, maxDocuments, maxSkus, maxUsers, maxBranches, lockedFeatures[] }
   * Parsed at runtime — see TrialRestriction below.
   */
  restrictionConfig?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: MonetizationProduct;
}

/** Parsed form of MonetizationTrial.restrictionConfig */
export interface TrialRestriction {
  mode: 'TIME_BOUND' | 'VOLUME_CAP' | 'STRUCTURAL';
  maxDocuments?: number | null;
  maxSkus?: number | null;
  maxUsers?: number | null;
  maxBranches?: number | null;
  lockedFeatures: string[];
}

// -- Entitlement ---------------------------------------------------------------

export type EntitlementSource = 'SUBSCRIPTION' | 'LIFETIME' | 'TRIAL';

/** Returned by GET /monetization/check/:featureKey */
export interface MonetizationEntitlementDecision {
  entitled: boolean;
  featureKey: string;
  source?: EntitlementSource;
  expiresAt?: string | null;
  reason?: string;
}

export interface MonetizationEntitlement {
  id: string;
  companyId: string;
  featureKey: string;
  source: EntitlementSource;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// -- API response shapes -------------------------------------------------------

export interface EntitlementStatusResponse {
  companyId: string;
  entitledFeatures: string[];
  entitlements: MonetizationEntitlement[];
  activeSubscription: MonetizationSubscription | null;
  activeTrial: MonetizationTrial | null;
  lifetimePurchases: MonetizationPurchase[];
  trialDaysRemaining: number | null;
  planSlug: string | null;
  /**
   * Parsed trial restriction — populated by the frontend from activeTrial.restrictionConfig.
   * null when not on trial or no restriction configured.
   */
  trialRestriction?: TrialRestriction | null;
}

export interface StartTrialDto {
  productId: string;
  /** §4.2 — Restriction mode for this trial */
  restrictionMode?: 'TIME_BOUND' | 'VOLUME_CAP' | 'STRUCTURAL';
  /** TIME_BOUND: days from install timestamp */
  trialDays?: number;
  /** VOLUME_CAP: max invoice/receipt documents */
  maxDocuments?: number;
  /** STRUCTURAL: max inventory SKUs */
  maxSkus?: number;
  /** STRUCTURAL: max local user profiles */
  maxUsers?: number;
  /** STRUCTURAL: max branch connections */
  maxBranches?: number;
}

export interface CreateSubscriptionDto {
  productId: string;
  billingCycle: BillingCycle;
  providerRef?: string;
  providerSubId?: string;
}

export interface CreatePurchaseDto {
  productId: string;
  amountPaid: number;
  providerRef?: string;
  receiptUrl?: string;
}

export interface CancelSubscriptionDto {
  reason?: string;
}

export interface PauseSubscriptionDto {
  reason?: string;
}

export interface SwitchPlanDto {
  productId: string;
  billingCycle: BillingCycle;
  reason?: string;
}

export interface SwitchPlanResponse {
  status: string;
  fromProduct: MonetizationProduct;
  toProduct: MonetizationProduct;
  billingCycle: BillingCycle;
  effectiveAt: string;
}

// -- Feature key constants -----------------------------------------------------
// These are the canonical feature keys used in @RequireEntitlement() decorators
// and in the frontend EntitlementGate component.

export const FEATURE_KEYS = {
  // Plans
  PLAN_STARTER: 'plan:starter',
  PLAN_BUSINESS: 'plan:business',
  PLAN_ENTERPRISE: 'plan:enterprise',

  // Core ovds
  FEATURE_GL: 'feature:gl',
  FEATURE_BANK_RECON: 'feature:bank-recon',
  FEATURE_OCR: 'feature:ocr',
  FEATURE_IFRS_REPORTS: 'feature:ifrs-reports',
  FEATURE_PERIOD_CLOSE: 'feature:period-close',

  // HR & Payroll
  FEATURE_PAYROLL_UNLIMITED: 'feature:payroll-unlimited',
  FEATURE_BIOMETRICS: 'feature:biometrics',
  FEATURE_SHIFTS: 'feature:shifts',

  // Tax & Compliance
  FEATURE_DRRF: 'feature:drrf',
  FEATURE_BIT: 'feature:bit',
  /**
   * MoR (Ministry of Revenues) tax dashboard — formerly 'ERCA Dashboard'.
   * Key name kept as FEATURE_ERCA_DASHBOARD for backward-compat with existing
   * entitlement records in the DB.
   */
  FEATURE_ERCA_DASHBOARD: 'feature:erca-dashboard',
  FEATURE_AUDIT_OUTSOURCING: 'feature:audit-outsourcing',

  // Enterprise
  FEATURE_MULTI_COMPANY: 'feature:multi-company',
  FEATURE_WHITE_LABEL: 'feature:white-label',
  FEATURE_ON_PREMISE: 'feature:on-premise',

  // §4.2 Free-Tier Locked Features (mandatory gated under ALL trial matrices)
  // These keys are NEVER granted during a trial — only unlocked on paid activation.
  /**
   * Live automated banking webhooks: Telebirr API + CBE Birr API real-time
   * payment notifications and automated ledger reconciliation.
   * §2.3, §4.2 — always locked in free tier.
   */
  FEATURE_LIVE_BANKING_WEBHOOKS: 'feature:live-banking-webhooks',
  /**
   * Live Ministry of Revenues EIS API push: real-time IRN fetch + QR code
   * generation via etax.mor.gov.et.
   * §3.4, §4.2 — always locked in free tier.
   */
  FEATURE_MOR_LIVE_API: 'feature:mor-live-api',
  /**
   * SRM / Fiscal Printer drivers: cryptographic handshake, receipt printing,
   * Z-Report generation, and IoT GPRS/4G transmission.
   * §3.3, §4.2 — always locked in free tier.
   */
  FEATURE_SRM_PRINTING: 'feature:srm-printing',
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];
