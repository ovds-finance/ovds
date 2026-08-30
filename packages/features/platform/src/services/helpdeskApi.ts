/**
 * Helpdesk domain API client — @ovds/features/helpdesk
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
const get   = <T>(url: string) => req<T>(url);
const post  = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);
const del   = <T>(url: string) => req<T>(url, 'DELETE');

export const ticketsApi = {
  list:     (params: { companyId?: string | null; status?: string; priority?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/helpdesk/tickets${qs(params)}`),
  get:      (id: string) => get<any>(`/helpdesk/tickets/${id}`),
  create:   (data: any) => post<any>('/helpdesk/tickets', data),
  update:   (id: string, data: any) => patch<any>(`/helpdesk/tickets/${id}`, data),
  remove:   (id: string) => del<void>(`/helpdesk/tickets/${id}`),
  resolve:  (id: string, resolution?: string) =>
    post<any>(`/helpdesk/tickets/${id}/resolve`, { resolution }),
  reopen:   (id: string) => post<any>(`/helpdesk/tickets/${id}/reopen`),
  assign:   (id: string, agentId: string) =>
    patch<any>(`/helpdesk/tickets/${id}`, { assignedTo: agentId }),
  comment:  (id: string, body: string) =>
    post<any>(`/helpdesk/tickets/${id}/comments`, { body }),
  comments: (id: string) => get<any[]>(`/helpdesk/tickets/${id}/comments`),
};

export const knowledgeBaseApi = {
  articles: (params: { search?: string; category?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/helpdesk/kb/articles${qs(params)}`),
  get:      (id: string) => get<any>(`/helpdesk/kb/articles/${id}`),
  create:   (data: any) => post<any>('/helpdesk/kb/articles', data),
  update:   (id: string, data: any) => patch<any>(`/helpdesk/kb/articles/${id}`, data),
  remove:   (id: string) => del<void>(`/helpdesk/kb/articles/${id}`),
};

