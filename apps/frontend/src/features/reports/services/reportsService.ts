import api from '../../../services/api';
import { downloadCSV } from '../../../utils/download';
import type { ExportFormat, ReportConfig, ReportPeriod } from '../types';

export interface FetchReportParams {
  companyId: string;
  config: ReportConfig;
}

export async function fetchReportJson(reportId: string, params: Record<string, string>): Promise<unknown> {
  const q = new URLSearchParams(params).toString();
  const url = `/ovds/reports/${reportId}${q ? `?${q}` : ''}`;
  const res = await api.get(url, { headers: { 'x-background': '1' } });
  return res?.data?.data ?? res?.data ?? null;
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
  const res = await api.get(`/ovds/reports/${reportId}/export?${q}`, {
    headers: { 'x-background': '1' },
    responseType: 'blob',
  });
  return (res?.data as Blob) ?? new Blob();
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

export function defaultPeriod(): ReportPeriod {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  };
}
