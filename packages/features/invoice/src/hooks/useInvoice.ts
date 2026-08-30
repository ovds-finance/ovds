import { useState, useCallback } from 'react';
import { universalInvoiceApi, ocrApi } from '../services/invoiceApi';

export function useOcrExtract() {
  const [result, setResult]   = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const extract = useCallback(async (base64Image: string, mimeType: string) => {
    setLoading(true); setError(null);
    try { const r = await ocrApi.extractInvoice(base64Image, mimeType); setResult(r); return r; }
    catch (e: any) { setError(e?.message ?? 'OCR extraction failed'); return null; }
    finally { setLoading(false); }
  }, []);
  return { result, loading, error, extract };
}

export function useUniversalInvoiceMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setSaving(true); setError(null);
    try { const r = await fn(); onSuccess?.(); return r; }
    catch (e: any) { setError(e?.message ?? 'Operation failed'); return null; }
    finally { setSaving(false); }
  }
  return {
    saving, error,
    create: (data: any) => run(() => universalInvoiceApi.create(data)),
    bulkCreate: (invoices: any[], companyId?: string) =>
      run(() => universalInvoiceApi.bulkCreate(invoices, companyId)),
  };
}
