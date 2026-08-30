import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

import api from '../services/api';
import { fetchReport, exportReportBlob, defaultPeriod } from '../features/reports/services/reportsService';
import type { ReportConfig } from '../features/reports/types';

const mockedGet = () => vi.mocked(api.get);

beforeEach(() => {
  mockedGet().mockReset();
});

describe('reportsService.fetchReport', () => {
  it('requests the correct endpoint and query string', async () => {
    const config: ReportConfig = {
      reportId: 'profit-and-loss',
      basis: 'accrual',
      period: { start: '2024-01-01', end: '2024-12-31' },
      groupBy: 'category',
    };
    mockedGet().mockResolvedValue({ data: { data: { ok: true } } });

    const raw = await fetchReport({ companyId: 'co_1', config });

    expect(mockedGet()).toHaveBeenCalledTimes(1);
    const [url, requestConfig] = mockedGet().mock.calls[0] as [string, unknown];
    expect(url).toEqual(
      '/ovds/reports/profit-and-loss?companyId=co_1&periodStart=2024-01-01&periodEnd=2024-12-31&basis=accrual&groupBy=category',
    );
    expect(requestConfig).toEqual({ headers: { 'x-background': '1' } });
    expect(raw).toEqual({ ok: true });
  });

  it('omits optional params when not provided', async () => {
    const config: ReportConfig = {
      reportId: 'tax-summary',
      basis: 'accrual',
      period: { start: '2024-01-01', end: '2024-12-31' },
    };
    mockedGet().mockResolvedValue({ data: null });

    const raw = await fetchReport({ companyId: 'co_2', config });

    const [url] = mockedGet().mock.calls[0] as [string, unknown];
    expect(url).not.toContain('groupBy');
    expect(url).not.toContain('currency');
    expect(raw).toBeNull();
  });

  it('falls back to res.data when data.data is absent', async () => {
    mockedGet().mockResolvedValue({ data: { summary: { total: 1 } } });
    const raw = await fetchReport({
      companyId: 'co_3',
      config: { reportId: 'tax-summary', basis: 'accrual', period: { start: '2024-01-01', end: '2024-12-31' } },
    });
    expect(raw).toEqual({ summary: { total: 1 } });
  });
});

describe('reportsService.exportReportBlob', () => {
  it('hits the /export endpoint with format and blob responseType', async () => {
    const blob = new Blob(['pdf-bytes']);
    mockedGet().mockResolvedValue({ data: blob });

    const config: ReportConfig = {
      reportId: 'profit-and-loss',
      basis: 'cash',
      period: { start: '2024-01-01', end: '2024-03-31' },
    };
    const result = await exportReportBlob('profit-and-loss', config, 'co_9', 'pdf');

    expect(mockedGet()).toHaveBeenCalledTimes(1);
    const [url, requestConfig] = mockedGet().mock.calls[0] as [string, unknown];
    expect(url).toContain('/ovds/reports/profit-and-loss/export?');
    expect(url).toContain('format=pdf');
    expect(url).toContain('basis=cash');
    expect(url).toContain('companyId=co_9');
    expect((requestConfig as { responseType: string }).responseType).toBe('blob');
    expect(result).toBe(blob);
  });

  it('passes groupBy through to the export URL', async () => {
    mockedGet().mockResolvedValue({ data: new Blob() });
    const config: ReportConfig = {
      reportId: 'inventory-valuation',
      basis: 'accrual',
      period: { start: '2024-01-01', end: '2024-12-31' },
      groupBy: 'warehouse',
    };
    await exportReportBlob('inventory-valuation', config, 'co_5', 'csv');
    const [url] = mockedGet().mock.calls[0] as [string, unknown];
    expect(url).toContain('groupBy=warehouse');
  });
});

describe('reportsService.defaultPeriod', () => {
  it('returns a Jan 1 start and a current-year end date', () => {
    const period = defaultPeriod();
    const year = new Date().getFullYear();
    expect(period.start).toBe(`${year}-01-01`);
    expect(period.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
