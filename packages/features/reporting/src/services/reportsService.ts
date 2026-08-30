/**
 * @ovds/features/reporting services
 *
 * Self-contained report service — uses fetch directly.
 * No imports from apps/.
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
async function req<T>(url: string, method = 'GET', body?: unknown, opts?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${getBase()}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: { ...headers(), ...(opts?.headers ?? {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(opts?.body ? { body: opts.body } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return null as T;
  const json = await res.json();
  return (json?.data ?? json) as T;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'csv' | 'xlsx';
export type ReportPeriod = { start: string; end: string };
export type ReportConfig = {
  reportId: string;
  basis: 'accrual' | 'cash';
  period: ReportPeriod;
  groupBy?: string;
  currency?: string;
};

export interface FetchReportParams {
  companyId: string;
  config: ReportConfig;
}

// ── Report fetching ────────────────────────────────────────────────────────────

export async function fetchReportJson(reportId: string, params: Record<string, string>): Promise<unknown> {
  const q = new URLSearchParams(params).toString();
  const url = `/ovds/reports/${reportId}${q ? `?${q}` : ''}`;
  return req<unknown>(url, 'GET', undefined, { headers: { 'x-background': '1' } });
}

export async function fetchReport({ companyId, config }: FetchReportParams): Promise<unknown> {
  const params: Record<string, string> = {
    companyId,
    periodStart: config.period.start,
    periodEnd: config.period.end,
    basis: config.basis,
  };
  if (config.groupBy) params.groupBy = config.groupBy;
  if (config.currency) params.currency = config.currency;
  return fetchReportJson(config.reportId, params);
}

export async function exportReportBlob(
  reportId: string,
  config: ReportConfig,
  companyId: string,
  format: ExportFormat,
): Promise<Blob> {
  const params: Record<string, string> = {
    companyId,
    periodStart: config.period.start,
    periodEnd: config.period.end,
    basis: config.basis,
    format,
  };
  if (config.groupBy) params.groupBy = config.groupBy;
  const q = new URLSearchParams(params).toString();
  const fullUrl = `/ovds/reports/${reportId}/export?${q}`;
  const res = await fetch(fullUrl, {
    headers: { ...headers(), 'x-background': '1' },
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.blob();
}

// ── Download helpers ───────────────────────────────────────────────────────────

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadReportData(
  reportId: string,
  period: ReportPeriod,
  format: ExportFormat,
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; label: string }>,
  basename: string,
): void {
  const stamp = `${period.start}_to_${period.end}`;
  if (format === 'csv') {
    const header = columns.map((c) => c.label).join(',');
    const body = rows
      .map((r) => columns.map((c) => csvCell(r[c.key])).join(','))
      .join('\n');
    downloadCSV(header + '\n' + body, `${basename}-${stamp}.csv`);
  } else if (format === 'xlsx') {
    downloadCSV(columns.map((c) => c.label).join(','), `${basename}-${stamp}.xlsx`);
  } else {
    downloadCSV(columns.map((c) => c.label).join(','), `${basename}-${stamp}.pdf`);
  }
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'string' ? value : String(value);
  return text.includes(',') || text.includes('"') || text.includes('\n')
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function defaultPeriod(): ReportPeriod {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  };
}
