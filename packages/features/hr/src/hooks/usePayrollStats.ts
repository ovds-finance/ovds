/**
 * usePayrollStats — shared payroll aggregation hook.
 * Moved from apps/frontend/src/hooks/usePayrollStats.ts to @ovds/features/hr.
 *
 * Usage:
 *   import { usePayrollStats } from '@ovds/features/hr';
 *   const { stats, records, loading, refetch } = usePayrollStats({ year, month });
 */
import { useState, useEffect, useCallback } from 'react';
import { payrollApi } from '../services/hrApi';

export interface PayrollStats {
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalPension: number;
  totalEmployerPension: number;
  totalLoans: number;
  count: number;
  configured: number;
  approved: number;
  pending: number;
  coverage: number;
}

export interface UsePayrollStatsOptions {
  year: number;
  month: number;
  enabled?: boolean;
}

export interface UsePayrollStatsResult {
  stats: PayrollStats;
  records: any[];
  loading: boolean;
  error: string | null;
  refetch(): void;
}

function aggregate(records: any[]): PayrollStats {
  const count      = records.length;
  const configured = records.filter((r) => Number(r.grossTotal ?? r.grossPay ?? 0) > 0).length;
  const approved   = records.filter((r) => r.status === 'APPROVED').length;
  const pending    = records.filter((r) => r.status !== 'APPROVED').length;

  return {
    totalGross:           records.reduce((s, r) => s + Number(r.grossTotal ?? r.grossPay ?? 0), 0),
    totalNet:             records.reduce((s, r) => s + Number(r.netPay ?? r.calculatedSalary ?? 0), 0),
    totalTax:             records.reduce((s, r) => s + Number(r.incomeTax ?? 0), 0),
    totalPension:         records.reduce((s, r) => s + Number(r.employeePension ?? 0), 0),
    totalEmployerPension: records.reduce((s, r) => s + Number(r.employerPension ?? 0), 0),
    totalLoans:           records.reduce((s, r) => s + Number(r.loanDeduction ?? 0), 0),
    count, configured, approved, pending,
    coverage: count > 0 ? Math.round((configured / count) * 100) : 0,
  };
}

export function usePayrollStats({
  year,
  month,
  enabled = true,
}: UsePayrollStatsOptions): UsePayrollStatsResult {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.getSummary(year, month, { limit: 500 });
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load payroll data');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, enabled]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return { stats: aggregate(records), records, loading, error, refetch: fetchRecords };
}
