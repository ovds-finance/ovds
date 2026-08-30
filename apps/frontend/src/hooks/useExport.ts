/**
 * useExport — triggers CSV/Excel/PDF export from any API endpoint.
 *
 * Handles the download lifecycle: request → blob → file download.
 * Shows a loading state during the request and surfaces errors via toast.
 *
 * Usage:
 *   const { exportData, isExporting } = useExport();
 *
 *   // CSV export
 *   await exportData('/invoices/export', { format: 'csv', params: { companyId, status } });
 *
 *   // PDF export with custom filename
 *   await exportData('/payroll/export-pdf', { format: 'pdf', filename: 'payroll-june-2026' });
 */
import { useState, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '@ovds/ui';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json';

export interface UseExportOptions {
  format?:   ExportFormat;
  filename?: string;
  params?:   Record<string, string | number | boolean | undefined | null>;
  method?:   'get' | 'post';
  body?:     Record<string, unknown>;
}

export interface UseExportResult {
  exportData: (url: string, options?: UseExportOptions) => Promise<void>;
  isExporting: boolean;
}

const MIME_TYPES: Record<ExportFormat, string> = {
  csv:  'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf:  'application/pdf',
  json: 'application/json',
};

const EXTENSIONS: Record<ExportFormat, string> = {
  csv: '.csv', xlsx: '.xlsx', pdf: '.pdf', json: '.json',
};

export function useExport(): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = useCallback(async (
    url: string,
    options: UseExportOptions = {},
  ) => {
    const {
      format    = 'csv',
      filename,
      params    = {},
      method    = 'get',
      body,
    } = options;

    setIsExporting(true);
    try {
      const config = {
        responseType: 'blob' as const,
        params: { ...params, format },
      };

      const res = method === 'post'
        ? await api.post(url, body ?? {}, config)
        : await api.get(url, config);

      // Build a download filename
      const contentDisposition = res.headers['content-disposition'] as string | undefined;
      let resolvedName = filename;
      if (!resolvedName && contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        resolvedName = match?.[1]?.replace(/['"]/g, '');
      }
      if (!resolvedName) {
        const slug = url.split('/').filter(Boolean).slice(-2).join('-');
        resolvedName = `${slug}-${new Date().toISOString().slice(0, 10)}${EXTENSIONS[format]}`;
      }

      // Trigger browser download
      const blob = new Blob([res.data], { type: MIME_TYPES[format] });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = resolvedName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(href);

      toast({
        title: 'Export ready',
        description: `Downloaded as ${resolvedName}`,
        variant: 'success',
      });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Export failed';
      toast({
        title: 'Export failed',
        description: typeof message === 'string' ? message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  return { exportData, isExporting };
}

