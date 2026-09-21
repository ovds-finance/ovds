/**
 * Monetization API service
 *
 * The backend is the SOLE authority for entitlement decisions.
 * This service only reads/writes via the NestJS API — it never
 * computes access locally.
 *
 * All requests go through the central `api` Axios instance so they
 * automatically benefit from:
 *   - JWT attach (bearer + HttpOnly cookie modes)
 *   - 401 token-refresh queue (no duplicate refresh storms)
 *   - 429 rate-limit retry with Retry-After backoff
 *   - 502/503/504 exponential-backoff retry (up to 2 times)
 *   - HMAC request signing
 *   - x-company-id tenant header
 *   - Global error toasts
 */
import type {
  EntitlementStatusResponse,
  MonetizationEntitlementDecision,
  MonetizationProduct,
  MonetizationSubscription,
  MonetizationPurchase,
  MonetizationTrial,
  CreateSubscriptionDto,
  CreatePurchaseDto,
  StartTrialDto,
  CancelSubscriptionDto,
  PauseSubscriptionDto,
  SwitchPlanDto,
  SwitchPlanResponse,
} from '@ovds/shared';

import api from './api';

// Re-export types for consumers
export type {
  EntitlementStatusResponse,
  MonetizationEntitlementDecision,
  MonetizationProduct,
  MonetizationSubscription,
  MonetizationPurchase,
  MonetizationTrial,
  CreateSubscriptionDto,
  CreatePurchaseDto,
  StartTrialDto,
  CancelSubscriptionDto,
  PauseSubscriptionDto,
  SwitchPlanDto,
  SwitchPlanResponse,
};

export interface ActivateLicenseResponse {
  success: boolean;
  message: string;
}

// Prefix for all monetization routes — matches the backend controller path.
const BASE = '/monetization';

// -- Entitlement status --------------------------------------------------------

/**
 * Fetch the full entitlement status for the current company.
 * Call this once on app load and cache in React context / Redux.
 */
export async function getEntitlementStatus(): Promise<EntitlementStatusResponse> {
  const { data } = await api.get<EntitlementStatusResponse>(`${BASE}/status`);
  return data;
}

/**
 * Check a single feature key.
 * Prefer using the cached status from context for UI gating.
 * Use this for one-off checks in service layer code.
 */
export async function checkFeature(featureKey: string): Promise<MonetizationEntitlementDecision> {
  const { data } = await api.get<MonetizationEntitlementDecision>(
    `${BASE}/check/${encodeURIComponent(featureKey)}`,
  );
  return data;
}

// -- Products ------------------------------------------------------------------

export async function listProducts(): Promise<MonetizationProduct[]> {
  const { data } = await api.get<MonetizationProduct[]>(`${BASE}/products`);
  return data;
}

export async function getProduct(id: string): Promise<MonetizationProduct> {
  const { data } = await api.get<MonetizationProduct>(`${BASE}/products/${id}`);
  return data;
}

// -- Trial ---------------------------------------------------------------------

export async function startTrial(dto: StartTrialDto): Promise<MonetizationTrial> {
  const { data } = await api.post<MonetizationTrial>(`${BASE}/trial`, dto);
  return data;
}

// -- Subscription --------------------------------------------------------------

export async function createSubscription(
  dto: CreateSubscriptionDto,
): Promise<MonetizationSubscription> {
  const { data } = await api.post<MonetizationSubscription>(`${BASE}/subscription`, dto);
  return data;
}

export async function cancelSubscription(
  subscriptionId: string,
  dto: CancelSubscriptionDto = {},
): Promise<MonetizationSubscription> {
  const { data } = await api.delete<MonetizationSubscription>(
    `${BASE}/subscription/${subscriptionId}`,
    { data: dto },
  );
  return data;
}

// -- Lifetime purchase ---------------------------------------------------------

export async function createPurchase(dto: CreatePurchaseDto): Promise<MonetizationPurchase> {
  const { data } = await api.post<MonetizationPurchase>(`${BASE}/purchase`, dto);
  return data;
}

// -- Admin ---------------------------------------------------------------------

export async function getCompanyBilling(companyId: string) {
  const { data } = await api.get(`${BASE}/admin/billing/${companyId}`);
  return data;
}

export async function rebuildEntitlementCache(companyId: string) {
  const { data } = await api.post(`${BASE}/admin/rebuild-cache/${companyId}`);
  return data;
}

export async function renewSubscription(companyId: string, subscriptionId: string) {
  const { data } = await api.post(
    `${BASE}/admin/subscription/${companyId}/renew/${subscriptionId}`,
  );
  return data;
}

export async function activateLicense(licenseKey: string): Promise<ActivateLicenseResponse> {
  const { data } = await api.post<ActivateLicenseResponse>(`${BASE}/activate`, { licenseKey });
  return data;
}

// -- Subscription management ---------------------------------------------------

export async function pauseSubscription(
  subscriptionId: string,
  dto: PauseSubscriptionDto = {},
): Promise<MonetizationSubscription> {
  const { data } = await api.post<MonetizationSubscription>(
    `${BASE}/subscription/${subscriptionId}/pause`,
    dto,
  );
  return data;
}

export async function resumeSubscription(
  subscriptionId: string,
): Promise<MonetizationSubscription> {
  const { data } = await api.post<MonetizationSubscription>(
    `${BASE}/subscription/${subscriptionId}/resume`,
  );
  return data;
}

export async function switchPlan(
  subscriptionId: string,
  dto: SwitchPlanDto,
): Promise<SwitchPlanResponse> {
  const { data } = await api.post<SwitchPlanResponse>(
    `${BASE}/subscription/${subscriptionId}/switch`,
    dto,
  );
  return data;
}
