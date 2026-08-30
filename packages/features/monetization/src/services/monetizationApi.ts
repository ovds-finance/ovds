/**
 * Monetization domain API client — @ovds/features/monetization
 *
 * Covers: Entitlement status, Products, Subscriptions, Trials,
 * Lifetime purchases, License activation, Admin billing.
 *
 * No imports from apps/. Self-contained fetch client.
 */

function getBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}
function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) || (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  return h;
}
async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, { method, headers: headers(), ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (!res.ok) { const text = await res.text().catch(() => res.statusText); throw new Error(`${res.status}: ${text}`); }
  const json = res.status === 204 ? null : await res.json();
  return (json?.data ?? json) as T;
}
const get  = <T>(url: string) => req<T>(url);
const post = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const del  = <T>(url: string) => req<T>(url, 'DELETE');

export const entitlementApi = {
  status:   () => get<any>('/monetization/status'),
  check:    (featureKey: string) => get<any>(`/monetization/check/${encodeURIComponent(featureKey)}`),
};

export const productsApi = {
  list: () => get<any[]>('/monetization/products'),
  get:  (id: string) => get<any>(`/monetization/products/${id}`),
};

export const subscriptionApi = {
  create:  (dto: any) => post<any>('/monetization/subscription', dto),
  cancel:  (id: string, dto?: any) => req<any>(`/monetization/subscription/${id}`, 'DELETE', dto ?? {}),
  pause:   (id: string, dto?: any) => post<any>(`/monetization/subscription/${id}/pause`, dto),
  resume:  (id: string) => post<any>(`/monetization/subscription/${id}/resume`),
  switch:  (id: string, dto: any) => post<any>(`/monetization/subscription/${id}/switch`, dto),
};

export const trialApi = {
  start: (dto: any) => post<any>('/monetization/trial', dto),
};

export const purchaseApi = {
  create: (dto: any) => post<any>('/monetization/purchase', dto),
};

export const licenseApi = {
  activate: (licenseKey: string) => post<any>('/monetization/activate', { licenseKey }),
};

export const billingAdminApi = {
  getCompany:    (companyId: string) => get<any>(`/monetization/admin/billing/${companyId}`),
  rebuildCache:  (companyId: string) => post<any>(`/monetization/admin/rebuild-cache/${companyId}`),
  renewSubscription: (companyId: string, subscriptionId: string) =>
    post<any>(`/monetization/admin/subscription/${companyId}/renew/${subscriptionId}`),
};

