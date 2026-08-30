/**
 * CRM domain API client — @ovds/features/crm
 *
 * Covers: Contacts, Deals, Pipelines, Activities, Tasks, Notes, Tags.
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
function qs(p: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v !== undefined && v !== null && v !== '') q.set(k, String(v)); }
  const s = q.toString(); return s ? `?${s}` : '';
}
const get   = <T>(url: string) => req<T>(url);
const post  = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const patch = <T>(url: string, body: unknown) => req<T>(url, 'PATCH', body);
const del   = <T>(url: string) => req<T>(url, 'DELETE');

export interface CrmListParams {
  companyId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export const crmContactsApi = {
  list:   (params: CrmListParams = {}) => get<any>(`/crm/contacts${qs(params)}`),
  get:    (id: string) => get<any>(`/crm/contacts/${id}`),
  create: (data: any) => post<any>('/crm/contacts', data),
  update: (id: string, data: any) => patch<any>(`/crm/contacts/${id}`, data),
  remove: (id: string) => del<void>(`/crm/contacts/${id}`),
  activity: (id: string) => get<any[]>(`/crm/contacts/${id}/activity`),
  convert:  (id: string, type: 'customer' | 'vendor') => post<any>(`/crm/contacts/${id}/convert`, { type }),
};

export const crmDealsApi = {
  list:   (params: CrmListParams = {}) => get<any>(`/crm/deals${qs(params)}`),
  get:    (id: string) => get<any>(`/crm/deals/${id}`),
  create: (data: any) => post<any>('/crm/deals', data),
  update: (id: string, data: any) => patch<any>(`/crm/deals/${id}`, data),
  remove: (id: string) => del<void>(`/crm/deals/${id}`),
  move:   (id: string, stageId: string) => patch<any>(`/crm/deals/${id}/stage`, { stageId }),
  won:    (id: string) => post<any>(`/crm/deals/${id}/won`),
  lost:   (id: string, reason?: string) => post<any>(`/crm/deals/${id}/lost`, { reason }),
  stats:  (companyId?: string | null) => get<any>(`/crm/deals/stats${qs({ companyId })}`),
};

export const crmPipelinesApi = {
  list:   (companyId?: string | null) => get<any[]>(`/crm/pipelines${qs({ companyId })}`),
  get:    (id: string) => get<any>(`/crm/pipelines/${id}`),
  create: (data: any) => post<any>('/crm/pipelines', data),
  update: (id: string, data: any) => patch<any>(`/crm/pipelines/${id}`, data),
  remove: (id: string) => del<void>(`/crm/pipelines/${id}`),
  stages: (id: string) => get<any[]>(`/crm/pipelines/${id}/stages`),
};

export const crmActivitiesApi = {
  list:   (params: CrmListParams = {}) => get<any>(`/crm/activities${qs(params)}`),
  get:    (id: string) => get<any>(`/crm/activities/${id}`),
  create: (data: any) => post<any>('/crm/activities', data),
  update: (id: string, data: any) => patch<any>(`/crm/activities/${id}`, data),
  remove: (id: string) => del<void>(`/crm/activities/${id}`),
  complete: (id: string) => post<any>(`/crm/activities/${id}/complete`),
};

export const crmTasksApi = {
  list:   (params: CrmListParams = {}) => get<any>(`/crm/tasks${qs(params)}`),
  get:    (id: string) => get<any>(`/crm/tasks/${id}`),
  create: (data: any) => post<any>('/crm/tasks', data),
  update: (id: string, data: any) => patch<any>(`/crm/tasks/${id}`, data),
  remove: (id: string) => del<void>(`/crm/tasks/${id}`),
  complete: (id: string) => post<any>(`/crm/tasks/${id}/complete`),
};

