/**
 * useTrialBalance — trial balance report data for a given period.
 *
 * Usage:
 *   import { useTrialBalance } from '@ovds/features/accounting';
 *   const { rows, totals, loading } = useTrialBalance({ companyId, period });
 */
import { useState, useEffect, useCallback } from 'react';

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit:       number;
  credit:      number;
  balance:     number;
}

interface TrialBalanceTotals {
  totalDebit:  number;
  totalCredit: number;
  balanced:    boolean;
}

export interface UseTrialBalanceResult {
  rows:     TrialBalanceRow[];
  totals:   TrialBalanceTotals;
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

function getBase(): string { return (typeof window !== 'undefined' && (window as any)._VITE_API_URL) || '/api'; }
function hdrs(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = (typeof localStorage !== 'undefined' && localStorage.getItem('ovds_token'))
         || (typeof localStorage !== 'undefined' && localStorage.getItem('auth0_token'));
  if (t) h['Authorization'] = `Bearer ${t}`;
  const c = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCompanyId') : null;
  if (c) h['x-company-id'] = c;
  return h;
}
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, { headers: hdrs() });
  if (!res.ok) throw new Error(`${res.status}`);
  const j = res.status === 204 ? null : await res.json();
  return (j?.data ?? j) as T;
}

function qs(p: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => { if (v) params.set(k, v); });
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function useTrialBalance(params: {
  companyId?: string;
  period?:    string; // 'YYYY-MM'
  dateFrom?:  string;
  dateTo?:    string;
  enabled?:   boolean;
}): UseTrialBalanceResult {
  const [rows, setRows]       = useState<TrialBalanceRow[]>([]);
  const [loading, setLoading] = useState(!!params.enabled);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (params.enabled === false) return;
    setLoading(true); setError(null);
    try {
      const res = await apiFetch<any>(
        `/ovds/reports/trial-balance${qs({ companyId: params.companyId, period: params.period, dateFrom: params.dateFrom, dateTo: params.dateTo })}`,
      );
      const data = (res as any)?.rows ?? (res as any)?.data ?? res ?? [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  }, [params.companyId, params.period, params.dateFrom, params.dateTo, params.enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  const totalDebit  = rows.reduce((s, r) => s + (r.debit  ?? 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (r.credit ?? 0), 0);

  return {
    rows,
    totals: {
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    },
    loading, error, refetch: fetch,
  };
}
