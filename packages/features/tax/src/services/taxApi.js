"use strict";
/**
 * Tax domain API client — @ovds/features/tax
 *
 * Covers: VAT, TOT, BIT/Schedule-D, WHT, DRRF, PAYE, Pension,
 * TaxFilings, ETax integration, ERCA compliance, Universal Tax Config.
 *
 * No imports from apps/. Types from @ovds/contracts/schemas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxPaymentRefApi = exports.taxFilingsApi = exports.taxVaultApi = exports.etaxApi = exports.taxDashboardApi = exports.universalTaxConfigApi = exports.propertyTaxApi = exports.stampDutyApi = exports.exciseTaxApi = exports.pensionApi = exports.payeApi = exports.drrfApi = exports.whtApi = exports.scheduleD = exports.bitApi = exports.totApi = exports.vatApi = void 0;
exports.recordTaxFiling = recordTaxFiling;
exports.generateETaxPayload = generateETaxPayload;
exports.exportETaxJson = exportETaxJson;
exports.submitToETax = submitToETax;
exports.syncBankTransactions = syncBankTransactions;
exports.calculateTot = calculateTot;
exports.triggerAutoComputeTot = triggerAutoComputeTot;
exports.recordBITFiling = recordBITFiling;
exports.recordDRRFRemittance = recordDRRFRemittance;
exports.recordWHTRemittance = recordWHTRemittance;
exports.calculateERCAPenalty = calculateERCAPenalty;
exports.updateCompanyTaxProfile = updateCompanyTaxProfile;
exports.resolveTaxesForTransaction = resolveTaxesForTransaction;
// ── HTTP primitives ──────────────────────────────────────────────────────────
function getBase() {
    return (typeof window !== 'undefined' && window._VITE_API_URL) || '/api';
}
function headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token')) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('auth0_token'));
    if (token)
        h['Authorization'] = `Bearer ${token}`;
    const cid = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
    if (cid)
        h['x-company-id'] = cid;
    return h;
}
async function req(url, method = 'GET', body) {
    const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
    const res = await fetch(fullUrl, {
        method,
        headers: headers(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
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
exports.vatApi = {
    summary: (companyId) => get(`/tax/vat/summary${qs({ companyId })}`),
    filings: (params = {}) => get(`/tax/vat/filings${qs(params)}`),
    getFiling: (id) => get(`/tax/vat/filings/${id}`),
    compute: (companyId, period) => post('/tax/vat/compute', { companyId, period }),
    submit: (id) => post(`/tax/vat/filings/${id}/submit`),
    acknowledge: (id, data) => post(`/tax/vat/filings/${id}/acknowledge`, data),
    createAmendment: (id, data) => post(`/tax/vat/filings/${id}/amend`, data),
    input: (companyId, period) => get(`/tax/vat/input${qs({ companyId, period })}`),
    output: (companyId, period) => get(`/tax/vat/output${qs({ companyId, period })}`),
    administration: (companyId) => get(`/tax/vat/administration${qs({ companyId })}`),
};
// ── TOT (Turnover Tax) ────────────────────────────────────────────────────────
exports.totApi = {
    filings: (params = {}) => get(`/tax/tot/filings${qs(params)}`),
    compute: (companyId, period) => post('/tax/tot/compute', { companyId, period }),
    submit: (id) => post(`/tax/tot/filings/${id}/submit`),
    dashboard: (companyId) => get(`/tax/tot/dashboard${qs({ companyId })}`),
};
// ── BIT / Business Income Tax ─────────────────────────────────────────────────
exports.bitApi = {
    filings: (params = {}) => get(`/tax/bit/filings${qs(params)}`),
    compute: (companyId, year) => post('/tax/bit/compute', { companyId, year }),
    submit: (id) => post(`/tax/bit/filings/${id}/submit`),
    advance: (companyId) => get(`/tax/bit/advance${qs({ companyId })}`),
    dashboard: (companyId) => get(`/tax/bit/dashboard${qs({ companyId })}`),
    estimator: (companyId, year) => get(`/tax/bit/estimator${qs({ companyId, year })}`),
};
// ── Schedule-D Tax ────────────────────────────────────────────────────────────
exports.scheduleD = {
    list: (companyId, year) => get(`/tax/schedule-d${qs({ companyId, year })}`),
    compute: (companyId, year) => post('/tax/schedule-d/compute', { companyId, year }),
    submit: (id) => post(`/tax/schedule-d/${id}/submit`),
};
// ── WHT (Withholding Tax) ─────────────────────────────────────────────────────
exports.whtApi = {
    certificates: (params = {}) => get(`/tax/wht/certificates${qs(params)}`),
    getCertificate: (id) => get(`/tax/wht/certificates/${id}`),
    create: (data) => post('/tax/wht/certificates', data),
    update: (id, data) => patch(`/tax/wht/certificates/${id}`, data),
    remove: (id) => del(`/tax/wht/certificates/${id}`),
    summary: (companyId, period) => get(`/tax/wht/summary${qs({ companyId, period })}`),
    submit: (id) => post(`/tax/wht/certificates/${id}/submit`),
};
// ── DRRF (Disaster Risk Reduction Fund) ──────────────────────────────────────
exports.drrfApi = {
    summary: (companyId, period) => get(`/tax/drrf/summary${qs({ companyId, period })}`),
    filings: (params = {}) => get(`/tax/drrf/filings${qs(params)}`),
    compute: (companyId, period) => post('/tax/drrf/compute', { companyId, period }),
    submit: (id) => post(`/tax/drrf/filings/${id}/submit`),
};
// ── PAYE / Payroll Tax ────────────────────────────────────────────────────────
exports.payeApi = {
    declarations: (params = {}) => get(`/tax/paye/declarations${qs(params)}`),
    getDeclaration: (id) => get(`/tax/paye/declarations/${id}`),
    generate: (companyId, year, month) => post('/tax/paye/generate', { companyId, year, month }),
    submit: (id) => post(`/tax/paye/declarations/${id}/submit`),
};
// ── Pension ───────────────────────────────────────────────────────────────────
exports.pensionApi = {
    remittances: (params = {}) => get(`/tax/pension/remittances${qs(params)}`),
    generate: (companyId, year, month) => post('/tax/pension/generate', { companyId, year, month }),
    submit: (id) => post(`/tax/pension/remittances/${id}/submit`),
};
// ── Excise / Stamp / Property / Custom Duties ─────────────────────────────────
exports.exciseTaxApi = {
    items: (companyId) => get(`/tax/excise/items${qs({ companyId })}`),
    compute: (companyId, period) => post('/tax/excise/compute', { companyId, period }),
    filings: (params = {}) => get(`/tax/excise/filings${qs(params)}`),
};
exports.stampDutyApi = {
    list: (companyId) => get(`/tax/stamp-duty${qs({ companyId })}`),
    calculate: (data) => post('/tax/stamp-duty/calculate', data),
};
exports.propertyTaxApi = {
    assessments: (companyId) => get(`/tax/property-tax${qs({ companyId })}`),
    calculate: (data) => post('/tax/property-tax/calculate', data),
};
// ── Universal Tax Config ──────────────────────────────────────────────────────
exports.universalTaxConfigApi = {
    get: (companyId) => get(`/tax/universal-config${qs({ companyId })}`),
    update: (companyId, data) => patch(`/tax/universal-config`, { ...data, companyId }),
    seed: (companyId) => post('/tax/universal-config/seed', { companyId }),
};
// ── Tax Dashboard ─────────────────────────────────────────────────────────────
exports.taxDashboardApi = {
    overview: (companyId) => get(`/tax/dashboard${qs({ companyId })}`),
    liabilities: (companyId, period) => get(`/tax/dashboard/liabilities${qs({ companyId, period })}`),
    calendar: (companyId, year) => get(`/tax/dashboard/calendar${qs({ companyId, year })}`),
    taxpayerStatus: (companyId) => get(`/tax/taxpayer/status${qs({ companyId })}`),
    ercaDashboard: (companyId) => get(`/tax/erca/dashboard${qs({ companyId })}`),
};
// ── ETax / ERCA Integration ───────────────────────────────────────────────────
exports.etaxApi = {
    submit: (filingId, type) => post('/tax/etax/submit', { filingId, type }),
    status: (submissionId) => get(`/tax/etax/status/${submissionId}`),
    acknowledge: (data) => post('/tax/etax/acknowledge', data),
    penaltyCalc: (companyId, filingType, dueDate) => post('/tax/erca/penalty-calculate', { companyId, filingType, dueDate }),
};
// ── Tax Acknowledgement Vault ─────────────────────────────────────────────────
exports.taxVaultApi = {
    list: (companyId) => get(`/tax/vault${qs({ companyId })}`),
    get: (id) => get(`/tax/vault/${id}`),
    upload: (data) => post('/tax/vault', data),
    remove: (id) => del(`/tax/vault/${id}`),
};
// ── Tax Filing (general) ──────────────────────────────────────────────────────
exports.taxFilingsApi = {
    list: (params = {}) => get(`/tax/filings${qs(params)}`),
    get: (id) => get(`/tax/filings/${id}`),
    submit: (id) => post(`/tax/filings/${id}/submit`),
    history: (companyId) => get(`/tax/filings/history${qs({ companyId })}`),
};
// ── Tax Payment References ────────────────────────────────────────────────────
exports.taxPaymentRefApi = {
    list: (companyId) => get(`/tax/payment-references${qs({ companyId })}`),
    generate: (filingId) => post('/tax/payment-references', { filingId }),
    verify: (ref) => get(`/tax/payment-references/verify/${ref}`),
};
// ── Tax Filing Actions ─────────────────────────────────────────────────────────
async function recordTaxFiling(dto) {
    const backendDto = {
        ...dto,
        type: dto.type === 'BIT' ? 'INCOME_TAX' : dto.type,
        period: dto.type === 'BIT' || dto.type === 'INCOME_TAX'
            ? String(dto.year ?? new Date().getFullYear())
            : dto.period,
        amount: dto.amount ?? dto.taxDue ?? 0,
    };
    const res = await post('/tax/filing', backendDto);
    return res?.data ?? res;
}
async function generateETaxPayload(payload) {
    const res = await post('/tax/etax-payload', payload);
    return { eTaxPayload: res?.data ?? payload };
}
async function exportETaxJson(period) {
    const fullUrl = `${getBase()}/tax/export-etax/${period}`;
    const res = await fetch(fullUrl, {
        headers: headers(),
    });
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}`);
    return res.blob();
}
async function submitToETax(filingId) {
    const res = await post(`/tax/submit-to-etax/${filingId}`);
    return res?.data ?? res;
}
async function syncBankTransactions(bankAccountId) {
    const res = await post(`/tax/sync-bank-transactions/${bankAccountId}`);
    return res?.data ?? res;
}
// ── TOT Actions ────────────────────────────────────────────────────────────────
async function calculateTot(period) {
    const res = await get(`/tax/tot/${period}`);
    return res?.data ?? res;
}
async function triggerAutoComputeTot(period) {
    const res = await post('/tax/auto-compute-tot', period ? { period } : {});
    return res?.data ?? res;
}
// ── Tax Filing Recording ───────────────────────────────────────────────────────
async function recordBITFiling(year, amount, opts = {}) {
    const res = await post('/tax/filing', {
        type: 'INCOME_TAX',
        period: String(year),
        amount,
        taxableIncome: opts.taxableIncome,
        matAmount: opts.matAmount,
        notes: opts.notes,
        ias12Treatment: 'EXPENSE',
    });
    return res?.data ?? res;
}
async function recordDRRFRemittance(period, amount, opts = {}) {
    const res = await post('/tax/filing', {
        type: 'DRRF',
        period,
        amount,
        drrfCategory: opts.drrfCategory ?? 'OTHER',
        notes: opts.notes,
        ias12Treatment: 'NOT_INCOME_TAX',
    });
    return res?.data ?? res;
}
async function recordWHTRemittance(period, amount, opts = {}) {
    const res = await post('/tax/filing', {
        type: 'WITHHOLDING',
        period,
        amount,
        whtType: opts.whtType ?? 'SERVICES',
        notes: opts.notes,
        ias12Treatment: 'NOT_INCOME_TAX',
    });
    return res?.data ?? res;
}
// ── ERCA Penalty Calculator ────────────────────────────────────────────────────
async function calculateERCAPenalty(params) {
    const res = await post('/tax/calculate-penalty', params);
    return res?.data ?? res;
}
// ── Universal Tax Config ───────────────────────────────────────────────────────
async function updateCompanyTaxProfile(updates, companyId) {
    const q = companyId ? `?companyId=${companyId}` : '';
    const res = await patch(`/tax/universal/profile${q}`, updates);
    return res?.data ?? res;
}
async function resolveTaxesForTransaction(params) {
    const { companyId, ...body } = params;
    const q = companyId ? `?companyId=${companyId}` : '';
    const res = await post(`/tax/universal/resolve${q}`, body);
    return res?.data ?? res;
}
//# sourceMappingURL=taxApi.js.map