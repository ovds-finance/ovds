/**
 * EIMS domain API client — @ovds/features/eims
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

async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
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
  return (json?.data ?? json) as T;
}

const get = <T>(url: string) => req<T>(url);
const post = <T>(url: string, body?: unknown) => req<T>(url, 'POST', body ?? {});
const put = <T>(url: string, body?: unknown) => req<T>(url, 'PUT', body ?? {});

export const eimsApi = {
  readiness: () => get<any>('/eims/compliance/readiness'),
  checklist: () => get<any>('/eims/compliance/checklist'),
  bspChecklist: () => get<any>('/eims/compliance/bsp-checklist'),
  onboardingChecklist: () => get<any>('/eims/compliance/onboarding'),
  dashboard: () => get<any>('/eims/dashboard'),
  bspReport: () => get<any>('/eims/compliance/bsp-report'),
  recordBspResult: (data: {
    testCaseId: string;
    documentNumber?: string;
    irn?: string;
    result: 'PASS' | 'FAIL';
    notes?: string;
  }) => post<any>('/eims/compliance/bsp-results', data),

  sourceSystems: {
    list: () => get<any[]>('/eims/source-systems'),
    register: (data: {
      systemNumber: string;
      systemType: 'ERP' | 'POS' | 'MANUAL';
      enterpriseId?: string;
      establishmentId?: string;
      clientId?: string;
      clientSecret?: string;
      apiKey?: string;
      callbackUrl?: string;
    }) => post<any>('/eims/source-systems', data),
    approve: (id: string) => put<any>(`/eims/source-systems/${id}/approve`),
    updateCredentials: (id: string, data: Record<string, string>) =>
      put<any>(`/eims/source-systems/${id}/credentials`, data),
    updateStep: (id: string, step: string) =>
      put<any>(`/eims/source-systems/${id}/step`, { step }),
    listEnterprises: () => get<any[]>('/eims/source-systems/enterprises'),
    listEstablishments: (enterpriseId: string) =>
      get<any[]>(`/eims/source-systems/enterprises/${enterpriseId}/establishments`),
  },

  certificates: {
    list: () => get<any[]>('/eims/certificates'),
    generateCsr: (data: {
      tin: string;
      systemNumber: string;
      organizationName: string;
      email: string;
      organizationalUnitName?: string;
      /** Override the server default — must be 'ET' for ERCA/INSA submissions */
      countryName?: string;
      /** Ethiopian state or region — defaults to 'Addis Ababa' if omitted */
      stateOrProvinceName?: string;
      /** City / locality — defaults to 'Addis Ababa' if omitted */
      localityName?: string;
      sourceSystemId?: string;
    }) => post<any>('/eims/certificates/generate-csr', data),
    install: (id: string, certificatePem: string) =>
      post<any>(`/eims/certificates/${id}/install`, { certificatePem }),
    submitCsr: (id: string, csrPem: string) =>
      post<any>(`/eims/certificates/${id}/submit-csr`, { csrPem }),
    expiryCheck: () => get<any[]>('/eims/certificates/expiry-check'),
  },

  invoices: {
    register: (invoiceId?: string) => post<any>(`/eims/invoices/${invoiceId ?? ''}/register`),
    retry: (invoiceId?: string) => post<any>(`/eims/invoices/${invoiceId ?? ''}/retry`),
    cancel: (invoiceId?: string, reasonCode?: string, remark?: string) =>
      post<any>(`/eims/invoices/${invoiceId ?? ''}/cancel`, { reasonCode, remark }),
    verify: (invoiceId?: string) => get<any>(`/eims/invoices/${invoiceId ?? ''}/verify`),
    history: (invoiceId?: string) => get<any[]>(`/eims/invoices/${invoiceId ?? ''}/registrations`),
  },

  receipts: {
    list: (invoiceId?: string) =>
      get<any[]>(`/eims/receipts${invoiceId ? `?invoiceId=${invoiceId}` : ''}`),
    registerSales: (data: {
      invoiceId: string;
      receiptNumber: string;
      collectedAmount: number;
      paymentMode?: string;
      collectorName?: string;
      reason?: string;
      paymentCoverage?: 'FULL' | 'PARTIAL';
    }) => post<any>('/eims/receipts/sales', data),
    registerWithholding: (data: {
      invoiceId: string;
      receiptNumber: string;
      withholdType: 'TWHT' | 'IWHT';
      preTaxAmount: number;
      withholdingAmount: number;
      reason?: string;
    }) => post<any>('/eims/receipts/withholding', data),
  },

  bulk: {
    register: (invoiceIds: string[]) => post<any>('/eims/bulk/register', { invoiceIds }),
    cancel: (items: Array<{ invoiceId: string; reasonCode: string; remark?: string }>) =>
      post<any>('/eims/bulk/cancel', { items }),
    jobs: () => get<any[]>('/eims/bulk-jobs'),
  },

  registrations: (status?: string) =>
    get<any[]>(`/eims/registrations${status ? `?status=${status}` : ''}`),

  cyberAuditList: () => get<any[]>('/eims/cyber-audit'),
  cyberAudit: (id?: string) => get<any>(`/eims/cyber-audit/${id ?? ''}`),
  createCyberAudit: (data?: any) => post<any>('/eims/cyber-audit', data),
  updateCyberAudit: (id?: string, data?: any) => put<any>(`/eims/cyber-audit/${id ?? ''}`, data),
  deleteCyberAudit: (id?: string) => post<any>(`/eims/cyber-audit/${id ?? ''}/delete`),
  startCyberAudit: (id?: string) => post<any>(`/eims/cyber-audit/${id ?? ''}/start`),
  completeCyberAudit: (id?: string) => post<any>(`/eims/cyber-audit/${id ?? ''}/complete`),
  cyberAuditFindings: (id?: string) => get<any[]>(`/eims/cyber-audit/${id ?? ''}/findings`),
  createCyberAuditFinding: (id?: string, data?: any) => post<any>(`/eims/cyber-audit/${id ?? ''}/findings`, data),
  updateCyberAuditFinding: (auditId?: string, findingId?: string, data?: any) => put<any>(`/eims/cyber-audit/${auditId ?? ''}/findings/${findingId ?? ''}`, data),
  deleteCyberAuditFinding: (auditId?: string, findingId?: string) => post<any>(`/eims/cyber-audit/${auditId ?? ''}/findings/${findingId ?? ''}/delete`),
  cyberAuditChecklist: () => get<any>('/eims/cyber-audit/checklist'),
  cyberAuditSummary: (id?: string) => get<any>(`/eims/cyber-audit/${id ?? ''}/summary`),
  cyberAuditMetrics: (id?: string) => get<any>(`/eims/cyber-audit/${id ?? ''}/metrics`),
  updateCyberAuditMetric: (id?: string, metricId?: string, data?: any) => put<any>(`/eims/cyber-audit/${id ?? ''}/metrics/${metricId ?? ''}`, data),

  masterComplianceList: () => get<any[]>('/eims/master-compliance'),
  masterCompliance: (id?: string) => get<any>(`/eims/master-compliance/${id ?? ''}`),
  createMasterCompliance: (data?: any) => post<any>('/eims/master-compliance', data),
  updateMasterCompliance: (id?: string, data?: any) => put<any>(`/eims/master-compliance/${id ?? ''}`, data),
  deleteMasterCompliance: (id?: string) => post<any>(`/eims/master-compliance/${id ?? ''}/delete`),
  masterComplianceItems: (id?: string) => get<any[]>(`/eims/master-compliance/${id ?? ''}/items`),
  updateMasterComplianceItem: (id?: string, itemId?: string, data?: any) => put<any>(`/eims/master-compliance/${id ?? ''}/items/${itemId ?? ''}`, data),
  masterComplianceTemplate: () => get<any>('/eims/master-compliance/template'),
  masterComplianceSummary: () => get<any>('/eims/master-compliance/summary'),

  accreditationList: () => get<any[]>('/eims/accreditation'),
  accreditation: (id?: string) => get<any>(`/eims/accreditation/${id ?? ''}`),
  createAccreditation: (data?: any) => post<any>('/eims/accreditation', data),
  updateAccreditation: (id?: string, data?: any) => put<any>(`/eims/accreditation/${id ?? ''}`, data),
  deleteAccreditation: (id?: string) => post<any>(`/eims/accreditation/${id ?? ''}/delete`),
  accreditationItems: (id?: string) => get<any[]>(`/eims/accreditation/${id ?? ''}/items`),
  updateAccreditationItem: (id?: string, itemId?: string, data?: any) => put<any>(`/eims/accreditation/${id ?? ''}/items/${itemId ?? ''}`, data),
  accreditationSummary: () => get<any>('/eims/accreditation/summary'),
};
