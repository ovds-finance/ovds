/**
 * Monetization API service
 *
 * The backend is the SOLE authority for entitlement decisions.
 * This service only reads/writes via the NestJS API — it never
 * computes access locally.
 */
import axios from 'axios';
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
import { BEARER_PREFIX } from '../utils/constants';
import { isHttpOnlyAuth } from '../utils/authMode';

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

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '10000', 10);
const USE_HTTPONLY = isHttpOnlyAuth();

const monetizationAxios: any = axios.create({
  baseURL: `${API_BASE}/monetization`,
  timeout: API_TIMEOUT,
  withCredentials: USE_HTTPONLY,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT and company context — mirrors the order used by apps/frontend/src/services/api.ts
// to ensure consistent auth behavior across both Axios instances.
monetizationAxios.interceptors.request.use((config: any) => {
  if (!USE_HTTPONLY) {
    const token =
      localStorage.getItem('ovds_token') ||
      localStorage.getItem('auth0_token') ||
      sessionStorage.getItem('auth0_token') ||
      localStorage.getItem('token');
    if (token) config.headers.Authorization = `${BEARER_PREFIX}${token}`;
  }

  // Forward selected company so the backend resolves the right tenant.
  // Without this, admins switching companies would always get entitlements
  // for the company embedded in their JWT rather than the active one.
  const selectedCompanyId = localStorage.getItem('selectedCompanyId');
  if (selectedCompanyId) config.headers['x-company-id'] = selectedCompanyId;

  return config;
});

// Unwrap the TransformInterceptor envelope { statusCode, message, data, success }
monetizationAxios.interceptors.response.use((response: any) => {
  const body = response.data;
  if (
    body &&
    typeof body === 'object' &&
    'success' in body &&
    'data' in body
  ) {
    response.data = body.data;
  }
  return response;
});


// -- Entitlement status --------------------------------------------------------

/**
 * Fetch the full entitlement status for the current company.
 * Call this once on app load and cache in React context / Redux.
 */
export async function getEntitlementStatus(): Promise<EntitlementStatusResponse> {
  const { data } = await monetizationAxios.get('/status');
  return data;
}

/**
 * Check a single feature key.
 * Prefer using the cached status from context for UI gating.
 * Use this for one-off checks in service layer code.
 */
export async function checkFeature(featureKey: string): Promise<MonetizationEntitlementDecision> {
  const { data } = await monetizationAxios.get(
    `/check/${encodeURIComponent(featureKey)}`,
  );
  return data;
}

// -- Products ------------------------------------------------------------------

export async function listProducts(): Promise<MonetizationProduct[]> {
  const { data } = await monetizationAxios.get('/products');
  return data;
}

export async function getProduct(id: string): Promise<MonetizationProduct> {
  const { data } = await monetizationAxios.get(`/products/${id}`);
  return data;
}

// -- Trial ---------------------------------------------------------------------

export async function startTrial(dto: StartTrialDto): Promise<MonetizationTrial> {
  const { data } = await monetizationAxios.post('/trial', dto);
  return data;
}

// -- Subscription --------------------------------------------------------------

export async function createSubscription(
  dto: CreateSubscriptionDto,
): Promise<MonetizationSubscription> {
  const { data } = await monetizationAxios.post('/subscription', dto);
  return data;
}

export async function cancelSubscription(
  subscriptionId: string,
  dto: CancelSubscriptionDto = {},
): Promise<MonetizationSubscription> {
  const { data } = await monetizationAxios.delete(
    `/subscription/${subscriptionId}`,
    { data: dto },
  );
  return data;
}

// -- Lifetime purchase ---------------------------------------------------------

export async function createPurchase(dto: CreatePurchaseDto): Promise<MonetizationPurchase> {
  const { data } = await monetizationAxios.post('/purchase', dto);
  return data;
}

// -- Admin ---------------------------------------------------------------------

export async function getCompanyBilling(companyId: string) {
  const { data } = await monetizationAxios.get(`/admin/billing/${companyId}`);
  return data;
}

export async function rebuildEntitlementCache(companyId: string) {
  const { data } = await monetizationAxios.post(`/admin/rebuild-cache/${companyId}`);
  return data;
}

export async function renewSubscription(companyId: string, subscriptionId: string) {
  const { data } = await monetizationAxios.post(
    `/admin/subscription/${companyId}/renew/${subscriptionId}`,
  );
  return data;
}

export async function activateLicense(licenseKey: string): Promise<ActivateLicenseResponse> {
  const { data } = await monetizationAxios.post('/activate', { licenseKey });
  return data;
}

// -- Subscription management ---------------------------------------------------

export async function pauseSubscription(
  subscriptionId: string,
  dto: PauseSubscriptionDto = {},
): Promise<MonetizationSubscription> {
  const { data } = await monetizationAxios.post(
    `/subscription/${subscriptionId}/pause`,
    dto,
  );
  return data;
}

export async function resumeSubscription(
  subscriptionId: string,
): Promise<MonetizationSubscription> {
  const { data } = await monetizationAxios.post(
    `/subscription/${subscriptionId}/resume`,
  );
  return data;
}

export async function switchPlan(
  subscriptionId: string,
  dto: SwitchPlanDto,
): Promise<SwitchPlanResponse> {
  const { data } = await monetizationAxios.post(
    `/subscription/${subscriptionId}/switch`,
    dto,
  );
  return data;
}

