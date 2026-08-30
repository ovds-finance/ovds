/**
 * Onboarding domain API client — @ovds/features/onboarding
 */

function getBase(): string { return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api'; }
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
function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v !== undefined && v !== null && v !== '') q.set(k, String(v)); }
  const s = q.toString(); return s ? `?${s}` : '';
}
const get  = <T>(url: string) => req<T>(url);
const post = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);

export const onboardingApi = {
  progress:     (companyId?: string | null) =>
    get<any>(`/onboarding/progress${qs({ companyId })}`),
  steps:        (companyId?: string | null) =>
    get<any[]>(`/onboarding/steps${qs({ companyId })}`),
  completeStep: (stepKey: string, companyId?: string | null) =>
    post<any>('/onboarding/steps/complete', { stepKey, companyId }),
  skipStep:     (stepKey: string, companyId?: string | null) =>
    post<any>('/onboarding/steps/skip', { stepKey, companyId }),
  reset:        (companyId: string) =>
    post<any>('/onboarding/reset', { companyId }),
  setupWizard: {
    get:    (companyId?: string | null) =>
      get<any>(`/onboarding/setup-wizard${qs({ companyId })}`),
    update: (companyId: string, step: string, data: any) =>
      patch<any>('/onboarding/setup-wizard', { companyId, step, ...data }),
    complete: (companyId: string) =>
      post<any>('/onboarding/setup-wizard/complete', { companyId }),
  },
};

