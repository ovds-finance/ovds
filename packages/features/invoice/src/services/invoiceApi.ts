/**
 * invoice domain API client — @ovds/features/invoice
 *
 * Covers: Universal invoice engine, offline-first invoice creation,
 * OCR extraction, ERCA fiscal integration, QR generation.
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

// Universal invoice (offline-first)
export const universalInvoiceApi = {
  create:             (data: any) => post<any>('/ovds/universal-invoice', data),
  bulkCreate:         (invoices: any[], companyId?: string) =>
    post<any>('/ovds/universal-invoice/bulk', { invoices, companyId }),
  getPrintable:       (id: string) => get<any>(`/ovds/universal-invoice/${id}/print`),
  getEmbeddable:      (id: string) => get<any>(`/ovds/universal-invoice/${id}/embed`),
  getReceipt:         (id: string) => get<any>(`/ovds/universal-invoice/${id}/receipt`),
  getPaymentInstructions: (id: string) =>
    get<any>(`/ovds/universal-invoice/${id}/payment-instructions`),
  byShareToken:       (token: string) => get<any>(`/ovds/invoices/share/${token}`),
};

// OCR extraction
export const ocrApi = {
  extractInvoice:    (base64Image: string, mimeType: string) =>
    post<any>('/invoice/ocr-extract', { base64Image, mimeType }),
  extractBankStatement:(base64Image: string, mimeType: string, bankName?: string) =>
    post<any>('/invoice/ocr-bank-statement', { base64Image, mimeType, bankName }),
};

// ERCA fiscal device
export const fiscalApi = {
  submitInvoice: (invoiceId: string) => post<any>('/invoice/fiscal/submit', { invoiceId }),
  status:        (invoiceId: string) => get<any>(`/invoice/fiscal/status/${invoiceId}`),
  generateQr:    (invoiceId: string) => get<any>(`/invoice/fiscal/qr/${invoiceId}`),
  devices:       (companyId?: string | null) =>
    get<any[]>(`/invoice/fiscal/devices${qs({ companyId })}`),
};

// Recurring invoices
export const recurringInvoicesApi = {
  list:   (params: { companyId?: string | null; page?: number; limit?: number } = {}) =>
    get<any>(`/ovds/invoices/recurring${qs(params)}`),
  create: (data: any) => post<any>('/ovds/invoices/recurring', data),
  run:    () => post<any>('/ovds/invoices/recurring/run'),
};

