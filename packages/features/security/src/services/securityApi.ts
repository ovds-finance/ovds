/**
 * Security compliance API client — @ovds/features/security
 */

function getBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token =
    (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  return h;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(`${getBase()}${url}`, { headers: headers() });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  const json = await res.json();
  return (json?.data ?? json) as T;
}

export const securityApi = {
  checklist: () => get<any>('/security/checklist'),
  readiness: () => get<any>('/security/readiness'),
  health: () => get<any>('/security/health'),
  alerts: (limit = 50) => get<any>(`/security/alerts?limit=${limit}`),
  metrics: () => get<any>('/security/metrics'),
};
