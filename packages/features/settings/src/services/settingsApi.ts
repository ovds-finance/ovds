/**
 * Settings domain API client — @ovds/features/settings
 *
 * Covers: Company settings, module enable/disable, settings catalog,
 * system administration, setup wizard.
 */

import type { RbacRoleDTO, RbacPermissionDTO, SodRuleDTO, AuditEventCatalogDTO } from '../types/settings.types';

function getBase(): string {
  return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api';
}
function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) || (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
  if (token) h['Authorization'] = `Bearer ${token}`;
  const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (cid) h['x-company-id'] = cid;
  const loc = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
  if (loc) { h['x-locale'] = loc; h['Accept-Language'] = loc; }
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
const put   = <T>(url: string, body: unknown) => req<T>(url, 'PUT', body);

export const companySettingsApi = {
  get:       (companyId: string) => get<any>(`/settings/company${qs({ companyId })}`),
  update:    (companyId: string, data: any) => patch<any>('/settings/company', { ...data, companyId }),
  updateMany:(companyId: string, values: Record<string, string>) =>
    post<any>('/settings/company/bulk', { companyId, values }),
};

export const moduleSettingsApi = {
  list:    (companyId?: string | null) => get<any[]>(`/settings/modules${qs({ companyId })}`),
  enable:  (companyId: string, moduleKey: string, defaults?: Record<string, string>) =>
    post<any>('/settings/modules/enable', { companyId, moduleKey, defaults }),
  disable: (companyId: string, moduleKey: string) =>
    post<any>('/settings/modules/disable', { companyId, moduleKey }),
  isEnabled: (companyId: string, moduleKey: string) =>
    get<any>(`/settings/modules/check${qs({ companyId, moduleKey })}`),
};

export const settingsCatalogApi = {
  list:   (params: { category?: string; group?: string; companyId?: string | null } = {}) =>
    get<any[]>(`/settings/catalog${qs(params)}`),
  get:    (key: string, companyId?: string | null) =>
    get<any>(`/settings/catalog/${key}${qs({ companyId })}`),
  update: (key: string, value: string, companyId?: string | null) =>
    patch<any>(`/settings/catalog/${key}`, { value, companyId }),
  create: (data: any) => post<any>('/settings/catalog', data),
  remove: (key: string) => del<void>(`/settings/catalog/${key}`),
};

// ── Admin: settings catalog CRUD ───────────────────────────────────────────────

export const settingsCatalogCategoriesApi = {
  list:   async (): Promise<any[]> =>
    get<any[]>('/settings/catalog/categories'),
  get:    async (key: string): Promise<any> =>
    get<any>(`/settings/catalog/categories/${encodeURIComponent(key)}`),
  create: async (dto: { key: string; name: string; description?: string; icon?: string }): Promise<any> =>
    post<any>('/settings/catalog/categories', dto),
  update: async (key: string, dto: Partial<{ key: string; name: string; description: string; icon: string }>): Promise<any> =>
    patch<any>(`/settings/catalog/categories/${encodeURIComponent(key)}`, dto),
  delete: async (key: string): Promise<void> =>
    del<void>(`/settings/catalog/categories/${encodeURIComponent(key)}`),
};

export const settingsCatalogGroupsApi = {
  list:   async (categoryKey?: string): Promise<any[]> =>
    get<any[]>(`/settings/catalog/groups${categoryKey ? `?categoryKey=${encodeURIComponent(categoryKey)}` : ''}`),
  create: async (dto: { categoryId: string; key: string; name: string; description?: string }): Promise<any> =>
    post<any>('/settings/catalog/groups', dto),
  update: async (id: string, dto: Partial<{ name: string; description: string }>): Promise<any> =>
    patch<any>(`/settings/catalog/groups/${id}`, dto),
  delete: async (id: string): Promise<void> =>
    del<void>(`/settings/catalog/groups/${id}`),
};

export const settingsCatalogDefinitionsApi = {
  list:   async (module?: string): Promise<any[]> =>
    get<any[]>(`/settings/catalog/definitions${module ? `?module=${encodeURIComponent(module)}` : ''}`),
  getByCategory: async (categoryKey: string): Promise<any[]> =>
    get<any[]>(`/settings/catalog/definitions/category/${encodeURIComponent(categoryKey)}`),
  create: async (dto: any): Promise<any> =>
    post<any>('/settings/catalog/definitions', dto),
  update: async (id: string, dto: any): Promise<any> =>
    patch<any>(`/settings/catalog/definitions/${id}`, dto),
  delete: async (id: string): Promise<void> =>
    del<void>(`/settings/catalog/definitions/${id}`),
};

export const settingsCatalogValuesApi = {
  list:   async (companyId?: string): Promise<Record<string, any>> => {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await get<any>(`/settings/catalog/values${qs}`);
    return res ?? {};
  },
  get:    async (key: string, companyId?: string): Promise<any> => {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await get<any>(`/settings/catalog/values/${encodeURIComponent(key)}${qs}`);
    return res ?? {};
  },
  update: async (key: string, value: string, companyId?: string): Promise<{ key: string; value: string }> => {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await patch<any>(`/settings/catalog/values${qs}`, { key, value, companyId });
    return res ?? { key, value };
  },
  bulkUpdate: async (values: Record<string, string>, companyId?: string): Promise<{ updated: number }> => {
    const res = await put<any>('/settings/catalog/values/bulk', { values, companyId });
    return res ?? { updated: 0 };
  },
  reset: async (companyId?: string): Promise<Record<string, string>> => {
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await post<any>(`/settings/catalog/reset${qs}`);
    return res ?? {};
  },
};

export const settingsCatalogOptionsApi = {
  getForSetting: async (key: string): Promise<any[]> =>
    get<any[]>(`/settings/catalog/options?key=${encodeURIComponent(key)}`),
};

// ── Backward-compatible nested catalog API ─────────────────────────────────────

export const settingsCatalog = {
  categories: settingsCatalogCategoriesApi,
  groups: settingsCatalogGroupsApi,
  definitions: settingsCatalogDefinitionsApi,
  values: settingsCatalogValuesApi,
  options: settingsCatalogOptionsApi,
};

export const systemAdminApi = {
  setup:       (data: any) => post<any>('/settings/setup', data),
  setupStatus: () => get<any>('/settings/setup/status'),
  systemInfo:  () => get<any>('/settings/system-info'),
  maintenance: (enabled: boolean) => post<any>('/settings/maintenance', { enabled }),
  auditLogs:   (params: { companyId?: string | null; search?: string; page?: number; limit?: number } = {}) =>
    get<any>(`/settings/audit-logs${qs(params)}`),
  users:       (params: { page?: number; limit?: number; search?: string } = {}) =>
    get<any>(`/settings/users${qs(params)}`),
  inviteUser:  (data: any) => post<any>('/settings/users/invite', data),
  updateUser:  (id: string, data: any) => patch<any>(`/settings/users/${id}`, data),
  removeUser:  (id: string) => del<void>(`/settings/users/${id}`),
};

export const invoiceSettingsApi = {
  get:    (companyId: string) => get<any>(`/settings/invoice${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>('/settings/invoice', data),
};

export const currencySettingsApi = {
  get:    (companyId: string) => get<any>(`/settings/currency${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>('/settings/currency', data),
};

export const emailSettingsApi = {
  get:    () => get<any>('/settings/email'),
  update: (data: Record<string, string>) => patch<any>('/settings/email', data),
  test:   (to: string) => post<any>('/settings/email/test', { to }),
};

export const centralControlPanelApi = {
  get:    (companyId: string) => get<any>(`/settings/central-control-panel/${companyId}`),
  updateSection: (companyId: string, section: string, data: Record<string, any>) =>
    patch<any>(`/settings/central-control-panel/${companyId}/${section}`, data),
  migrate: (companyId: string) => post<any>(`/settings/central-control-panel/${companyId}/migrate`, {}),
};

export const taxSettingsApi = {
  get:    (companyId: string) => get<any>(`/settings/taxes${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>('/settings/taxes', { ...data, companyId }),
};

export const securitySettingsApi = {
  get:    (companyId: string) => get<any>(`/settings/security${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>('/settings/security', { ...data, companyId }),
};

export const defaultsSettingsApi = {
  get:    (companyId: string) => get<any>(`/settings/defaults${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>('/settings/defaults', { ...data, companyId }),
};

export const localizationSettingsApi = {
  get:    (companyId: string) => get<any>(`/settings/localization${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>('/settings/localization', { ...data, companyId }),
};

export const businessIdentityApi = {
  get:    (companyId: string) => get<any>(`/settings/company${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>('/settings/company', { ...data, companyId }),
};

export const systemSettingsApi = {
  info: () => get<any>('/settings/system-info'),
  maintenance: (enabled: boolean) => post<any>('/settings/maintenance', { enabled }),
  get: () => get<any>('/settings/system'),
  update: (data: Record<string, string>) => patch<any>('/settings/system', data),
};

export const integrationsSettingsApi = {
  get: () => get<any>('/settings/integrations'),
  update: (data: Record<string, string>) => patch<any>('/settings/integrations', data),
};

export const maintainingTechnologyApi = {
  get: (companyId: string) => get<any>(`/settings/maintaining-technology${qs({ companyId })}`),
  update: (companyId: string, data: Record<string, string>) =>
    patch<any>(`/settings/maintaining-technology`, { ...data, companyId }),
};

// ── Advanced Access Controls ───────────────────────────────────────────────────

export const advancedAccessApi = {
  getOverrides: async (companyId?: string): Promise<any[]> => {
    const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    return get<any[]>(`/settings/advanced-access${q}`);
  },
  saveOverrides: async (overrides: any[], companyId?: string): Promise<void> => {
    const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    await post<any>('/settings/advanced-access', { overrides, companyId });
  },
};

// ── RBAC — Roles ──────────────────────────────────────────────────────────────

export const rolesApi = {
  /** List all roles (system + tenant-custom). Pass companyId to include custom roles for a tenant. */
  list: (companyId?: string | null) =>
    get<RbacRoleDTO[]>(`/settings/rbac/roles${qs({ companyId })}`),

  /** Get a single role by id. */
  get: (id: string) =>
    get<RbacRoleDTO>(`/settings/rbac/roles/${encodeURIComponent(id)}`),

  /** Create a new custom role for a tenant. */
  create: (dto: { name: string; label: string; description?: string; permissions: string[]; apiAccess?: boolean; companyId: string }) =>
    post<RbacRoleDTO>('/settings/rbac/roles', dto),

  /** Update role metadata / permissions. */
  update: (id: string, dto: Partial<{ label: string; description: string; permissions: string[]; apiAccess: boolean }>) =>
    patch<RbacRoleDTO>(`/settings/rbac/roles/${encodeURIComponent(id)}`, dto),

  /** Delete a custom role (system roles are protected server-side). */
  remove: (id: string) =>
    del<void>(`/settings/rbac/roles/${encodeURIComponent(id)}`),

  /** Seed/sync system roles from the shared RBAC constants. */
  seed: () =>
    post<{ seeded: number }>('/settings/rbac/roles/seed', {}),
};

// ── RBAC — Permissions ────────────────────────────────────────────────────────

export const permissionsApi = {
  /** List all permissions, optionally filtered by category or module. */
  list: (params: { category?: string; module?: string; companyId?: string | null } = {}) =>
    get<RbacPermissionDTO[]>(`/settings/rbac/permissions${qs(params)}`),

  /** Get a single permission by key. */
  get: (key: string) =>
    get<RbacPermissionDTO>(`/settings/rbac/permissions/${encodeURIComponent(key)}`),

  /** Seed/sync permissions from the shared permission catalog. */
  seed: () =>
    post<{ seeded: number }>('/settings/rbac/permissions/seed', {}),
};

// ── RBAC — SoD Rules ──────────────────────────────────────────────────────────

export const sodRulesApi = {
  /** List all Segregation-of-Duties rules (global + tenant-specific). */
  list: (companyId?: string | null) =>
    get<SodRuleDTO[]>(`/settings/rbac/sod-rules${qs({ companyId })}`),

  /** Create a tenant-specific SoD rule. */
  create: (dto: Omit<SodRuleDTO, 'id'> & { companyId: string }) =>
    post<SodRuleDTO>('/settings/rbac/sod-rules', dto),

  /** Update an existing SoD rule. */
  update: (id: string, dto: Partial<Omit<SodRuleDTO, 'id'>>) =>
    patch<SodRuleDTO>(`/settings/rbac/sod-rules/${encodeURIComponent(id)}`, dto),

  /** Delete a tenant-specific SoD rule. */
  remove: (id: string) =>
    del<void>(`/settings/rbac/sod-rules/${encodeURIComponent(id)}`),
};

// ── RBAC — Audit Event Catalog ────────────────────────────────────────────────

export const auditEventCatalogApi = {
  /** List audit event catalog entries. */
  list: (companyId?: string | null) =>
    get<AuditEventCatalogDTO[]>(`/settings/rbac/audit-events${qs({ companyId })}`),
};



