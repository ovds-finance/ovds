/**
 * Settings domain API client — @ovds/features/settings
 *
 * Covers: Company settings, module enable/disable, settings catalog,
 * system administration, setup wizard.
 */
function getBase() {
    return (typeof window !== 'undefined' && window._VITE_API_URL) || '/api';
}
function headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) || (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
    if (token)
        h['Authorization'] = `Bearer ${token}`;
    const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
    if (cid)
        h['x-company-id'] = cid;
    const loc = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
    if (loc) {
        h['x-locale'] = loc;
        h['Accept-Language'] = loc;
    }
    return h;
}
async function req(url, method = 'GET', body) {
    const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
    const res = await fetch(fullUrl, { method, headers: headers(), ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status}: ${text}`);
    }
    const json = res.status === 204 ? null : await res.json();
    return (json?.data ?? json);
}
function qs(p) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) {
        if (v !== undefined && v !== null && v !== '')
            q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `?${s}` : '';
}
const get = (url) => req(url);
const post = (url, body) => req(url, 'POST', body ?? {});
const patch = (url, body) => req(url, 'PATCH', body);
const del = (url) => req(url, 'DELETE');
const put = (url, body) => req(url, 'PUT', body);
export const companySettingsApi = {
    get: (companyId) => get(`/settings/company${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/company', { ...data, companyId }),
    updateMany: (companyId, values) => post('/settings/company/bulk', { companyId, values }),
};
export const moduleSettingsApi = {
    list: (companyId) => get(`/settings/modules${qs({ companyId })}`),
    enable: (companyId, moduleKey, defaults) => post('/settings/modules/enable', { companyId, moduleKey, defaults }),
    disable: (companyId, moduleKey) => post('/settings/modules/disable', { companyId, moduleKey }),
    isEnabled: (companyId, moduleKey) => get(`/settings/modules/check${qs({ companyId, moduleKey })}`),
};
export const settingsCatalogApi = {
    list: (params = {}) => get(`/settings/catalog${qs(params)}`),
    get: (key, companyId) => get(`/settings/catalog/${key}${qs({ companyId })}`),
    update: (key, value, companyId) => patch(`/settings/catalog/${key}`, { value, companyId }),
    create: (data) => post('/settings/catalog', data),
    remove: (key) => del(`/settings/catalog/${key}`),
};
// ── Admin: settings catalog CRUD ───────────────────────────────────────────────
export const settingsCatalogCategoriesApi = {
    list: async () => get('/settings/catalog/categories'),
    get: async (key) => get(`/settings/catalog/categories/${encodeURIComponent(key)}`),
    create: async (dto) => post('/settings/catalog/categories', dto),
    update: async (key, dto) => patch(`/settings/catalog/categories/${encodeURIComponent(key)}`, dto),
    delete: async (key) => del(`/settings/catalog/categories/${encodeURIComponent(key)}`),
};
export const settingsCatalogGroupsApi = {
    list: async (categoryKey) => get(`/settings/catalog/groups${categoryKey ? `?categoryKey=${encodeURIComponent(categoryKey)}` : ''}`),
    create: async (dto) => post('/settings/catalog/groups', dto),
    update: async (id, dto) => patch(`/settings/catalog/groups/${id}`, dto),
    delete: async (id) => del(`/settings/catalog/groups/${id}`),
};
export const settingsCatalogDefinitionsApi = {
    list: async (module) => get(`/settings/catalog/definitions${module ? `?module=${encodeURIComponent(module)}` : ''}`),
    getByCategory: async (categoryKey) => get(`/settings/catalog/definitions/category/${encodeURIComponent(categoryKey)}`),
    create: async (dto) => post('/settings/catalog/definitions', dto),
    update: async (id, dto) => patch(`/settings/catalog/definitions/${id}`, dto),
    delete: async (id) => del(`/settings/catalog/definitions/${id}`),
};
export const settingsCatalogValuesApi = {
    list: async (companyId) => {
        const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        const res = await get(`/settings/catalog/values${qs}`);
        return res ?? {};
    },
    get: async (key, companyId) => {
        const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        const res = await get(`/settings/catalog/values/${encodeURIComponent(key)}${qs}`);
        return res ?? {};
    },
    update: async (key, value, companyId) => {
        const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        const res = await patch(`/settings/catalog/values${qs}`, { key, value, companyId });
        return res ?? { key, value };
    },
    bulkUpdate: async (values, companyId) => {
        const res = await put('/settings/catalog/values/bulk', { values, companyId });
        return res ?? { updated: 0 };
    },
    reset: async (companyId) => {
        const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        const res = await post(`/settings/catalog/reset${qs}`);
        return res ?? {};
    },
};
export const settingsCatalogOptionsApi = {
    getForSetting: async (key) => get(`/settings/catalog/options?key=${encodeURIComponent(key)}`),
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
    setup: (data) => post('/settings/setup', data),
    setupStatus: () => get('/settings/setup/status'),
    systemInfo: () => get('/settings/system-info'),
    maintenance: (enabled) => post('/settings/maintenance', { enabled }),
    auditLogs: (params = {}) => get(`/settings/audit-logs${qs(params)}`),
    users: (params = {}) => get(`/settings/users${qs(params)}`),
    inviteUser: (data) => post('/settings/users/invite', data),
    updateUser: (id, data) => patch(`/settings/users/${id}`, data),
    removeUser: (id) => del(`/settings/users/${id}`),
};
export const invoiceSettingsApi = {
    get: (companyId) => get(`/settings/invoice${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/invoice', data),
};
export const currencySettingsApi = {
    get: (companyId) => get(`/settings/currency${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/currency', data),
};
export const emailSettingsApi = {
    get: () => get('/settings/email'),
    update: (data) => patch('/settings/email', data),
    test: (to) => post('/settings/email/test', { to }),
};
export const centralControlPanelApi = {
    get: (companyId) => get(`/settings/central-control-panel/${companyId}`),
    updateSection: (companyId, section, data) => patch(`/settings/central-control-panel/${companyId}/${section}`, data),
    migrate: (companyId) => post(`/settings/central-control-panel/${companyId}/migrate`, {}),
};
export const taxSettingsApi = {
    get: (companyId) => get(`/settings/taxes${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/taxes', { ...data, companyId }),
};
export const securitySettingsApi = {
    get: (companyId) => get(`/settings/security${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/security', { ...data, companyId }),
};
export const defaultsSettingsApi = {
    get: (companyId) => get(`/settings/defaults${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/defaults', { ...data, companyId }),
};
export const localizationSettingsApi = {
    get: (companyId) => get(`/settings/localization${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/localization', { ...data, companyId }),
};
export const businessIdentityApi = {
    get: (companyId) => get(`/settings/company${qs({ companyId })}`),
    update: (companyId, data) => patch('/settings/company', { ...data, companyId }),
};
export const systemSettingsApi = {
    info: () => get('/settings/system-info'),
    maintenance: (enabled) => post('/settings/maintenance', { enabled }),
    get: () => get('/settings/system'),
    update: (data) => patch('/settings/system', data),
};
export const integrationsSettingsApi = {
    get: () => get('/settings/integrations'),
    update: (data) => patch('/settings/integrations', data),
};
export const maintainingTechnologyApi = {
    get: (companyId) => get(`/settings/maintaining-technology${qs({ companyId })}`),
    update: (companyId, data) => patch(`/settings/maintaining-technology`, { ...data, companyId }),
};
// ── Advanced Access Controls ───────────────────────────────────────────────────
export const advancedAccessApi = {
    getOverrides: async (companyId) => {
        const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        return get(`/settings/advanced-access${q}`);
    },
    saveOverrides: async (overrides, companyId) => {
        const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
        await post('/settings/advanced-access', { overrides, companyId });
    },
};
