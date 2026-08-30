/**
 * useBankAccounts — list + mutations for bank accounts.
 * useBankTransactions — paginated transaction list with filters.
 * useReconciliation — reconciliation status + run.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  bankAccountsApi,
  bankTransactionsApi,
  reconciliationApi,
  type BankAccountListParams,
  type TransactionListParams,
} from '../services/bankingApi';

// ── useBankAccounts ───────────────────────────────────────────────────────────

export function useBankAccounts(params: BankAccountListParams & { enabled?: boolean } = {}) {
  const { enabled = true, ...queryParams } = params;
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bankAccountsApi.list(queryParams);
      if (Array.isArray(res)) {
        setData(res);
        setTotal(res.length);
      } else {
        setData(res.data ?? []);
        setTotal(res.total ?? res.pagination?.total ?? 0);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, [enabled, JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}

export function useBankAccountMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setSaving(true);
    setError(null);
    try {
      const result = await fn();
      onSuccess?.();
      return result;
    } catch (e: any) {
      setError(e?.message ?? 'Operation failed');
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    saving, error,
    create: (data: any) => run(() => bankAccountsApi.create(data)),
    update: (id: string, data: any) => run(() => bankAccountsApi.update(id, data)),
    remove: (id: string) => run(() => bankAccountsApi.remove(id)),
  };
}

// ── useBankTransactions ───────────────────────────────────────────────────────

export function useBankTransactions(params: TransactionListParams & { enabled?: boolean } = {}) {
  const { enabled = true, ...queryParams } = params;
  const [data, setData]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bankTransactionsApi.list(queryParams);
      const payload = res?.data ?? res;
      if (Array.isArray(payload)) {
        setData(payload);
        setTotal(payload.length);
      } else {
        setData(payload?.data ?? payload?.transactions ?? []);
        setTotal(payload?.total ?? payload?.pagination?.total ?? 0);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [enabled, JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}

// ── useReconciliation ─────────────────────────────────────────────────────────

export function useReconciliationStatus(bankAccountId?: string) {
  const [status, setStatus]   = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!bankAccountId) return;
    setLoading(true);
    setError(null);
    try {
      setStatus(await reconciliationApi.stats());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load reconciliation status');
    } finally {
      setLoading(false);
    }
  }, [bankAccountId]);

  useEffect(() => { fetch(); }, [fetch]);

  const run = useCallback(async (period: string) => {
    if (!bankAccountId) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await reconciliationApi.run({ bankAccountId });
      await fetch();
      return result;
    } catch (e: any) {
      setError(e?.message ?? 'Reconciliation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [bankAccountId, fetch]);

  return { status, loading, error, refetch: fetch, run };
}
