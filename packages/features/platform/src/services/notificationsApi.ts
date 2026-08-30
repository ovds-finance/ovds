/**
 * @ovds/features/notifications
 *
 * Covers:
 *  - User notifications: list, unread, markRead, markAllRead, preferences, send
 *  - Admin notifications: config, templates, campaigns
 */

// ── HTTP primitives ────────────────────────────────────────────────────────────

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
const del   = <T>(url: string) => req<T>(url, 'DELETE');

// ── Types ──────────────────────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'slack' | 'intercom';

export interface IntegrationConfig {
  slack?: {
    webhookUrl: string;
    channel?: string;
    active: boolean;
  };
  intercom?: {
    appId?: string;
    secret?: string;
    active: boolean;
  };
  email?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail?: string;
    active: boolean;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  type: NotificationChannel;
  targets: string[];
  scheduledAt?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED';
}

// ── User notifications ─────────────────────────────────────────────────────────

export const notificationsApi = {
  list:      (params: { page?: number; limit?: number; read?: boolean; companyId?: string | null } = {}) =>
    get<any>(`/notifications${qs(params)}`),
  unread:    () => get<any>('/notifications/unread-count'),
  markRead:  (id: string) => patch<any>(`/notifications/${id}/read`, {}),
  markAllRead: (companyId?: string | null) =>
    post<any>('/notifications/mark-all-read', { companyId }),
  preferences: () => get<any>('/notifications/preferences'),
  updatePreferences: (data: any) => patch<any>('/notifications/preferences', data),
  send: (data: { userId: string; title: string; body: string; type?: string; metadata?: any }) =>
    post<any>('/notifications/send', data),
};

// ── Admin: config & channels ───────────────────────────────────────────────────

export const notificationsConfigApi = {
  getConfig: async (): Promise<IntegrationConfig> => req<IntegrationConfig>('/notifications/config'),
  setConfig: async (config: Partial<IntegrationConfig>): Promise<IntegrationConfig> =>
    req<IntegrationConfig>('/notifications/config', 'PATCH', config),
  testChannel: async (channel: 'email' | 'slack' | 'intercom'): Promise<void> => {
    await req<void>('/notifications/test', 'POST', { channel });
  },
};

// ── Admin: templates ───────────────────────────────────────────────────────────

export const notificationTemplatesApi = {
  list: async (): Promise<NotificationTemplate[]> => {
    const res = await get<any>('/notifications/templates');
    const result = res?.data ?? res;
    return Array.isArray(result) ? result : [];
  },
  create: async (template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> =>
    req<NotificationTemplate>('/notifications/template', 'POST', template),
  update: async (id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> =>
    req<NotificationTemplate>(`/notifications/template/${id}`, 'PUT', data),
  delete: async (id: string): Promise<void> => req<void>(`/notifications/template/${id}`, 'DELETE'),
};

// ── Admin: campaigns ───────────────────────────────────────────────────────────

export const notificationCampaignsApi = {
  list: async (): Promise<NotificationCampaign[]> => {
    const res = await get<any>('/notifications/campaigns');
    const result = res?.data ?? res;
    return Array.isArray(result) ? result : [];
  },
  create: async (campaign: Omit<NotificationCampaign, 'id'> & { scheduledAt?: string; templateId?: string }): Promise<NotificationCampaign> =>
    req<NotificationCampaign>('/notifications/campaign', 'POST', campaign),
  send: async (id: string): Promise<{ success: boolean; sentTo: number }> =>
    req<{ success: boolean; sentTo: number }>(`/notifications/campaign/${id}/send`, 'POST'),
};

