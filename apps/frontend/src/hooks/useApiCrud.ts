/**
 * useApiCrud — generic CRUD hook
 * Eliminates the repetitive fetch/save/delete pattern across all pages.
 *
 * Usage:
 *   const { rows, total, loading, save, remove, refetch } = useApiCrud<Vendor>({
 *     endpoint: '/ovds/vendors',
 *     companyId: selectedCompanyId,
 *   });
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

export interface CrudOptions {
  endpoint: string;
  companyId?: string | null;
  /** Extra query params appended to list requests */
  params?: Record<string, string | number | boolean | undefined>;
  pageSize?: number;
  /** Auto-fetch on mount and when companyId changes */
  autoFetch?: boolean;
  /** Poll interval in ms (0 = disabled) */
  pollMs?: number;
}

export interface CrudState<T> {
  rows: T[];
  total: number;
  page: number;
  loading: boolean;
  saving: boolean;
  /** Fetch page (1-based) */
  fetchPage: (p: number) => Promise<void>;
  /** Refetch current page */
  refetch: () => Promise<void>;
  /** Create or update — pass id to update. Throws on failure. */
  save: (payload: Partial<T> & { id?: string }) => Promise<T | null>;
  /** Delete by id. Returns false on failure (toast already shown by interceptor). */
  remove: (id: string) => Promise<boolean>;
  setPage: (p: number) => void;
  /** Last error from save/remove, cleared on next successful operation */
  error: Error | null;
}

export function useApiCrud<T extends { id: string }>(opts: CrudOptions): CrudState<T> {
  const sanitizePayload = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;

    // Strip fields that are either:
    // 1. Provided in the URL (id) or via JWT/guard context (companyId) — sending
    //    them in the body causes "property X should not exist" on DTOs that use
    //    forbidNonWhitelisted: true.
    // 2. System-managed and should never be overwritten from the client (status,
    //    createdAt, updatedAt, etc.).
    // 3. Prisma relation/computed fields (_count, nested objects that are relations).
    const {
      id, status, companyId,
      // Prisma computed fields
      _count,
      // Common Prisma relation fields that should never be sent back
      leasePayment, leaseJournalEntry,
      employee, department, company,
      user, vendor, customer,
      items, payments, invoices,
      ...rest
    } = obj;
    // Also strip any remaining keys that start with _ (Prisma internals)
    return Object.fromEntries(
      Object.entries(rest).filter(([k]) => !k.startsWith('_'))
    );
  };

  const {
    endpoint,
    companyId,
    params = {},
    pageSize = 25,
    autoFetch = true,
    pollMs = 0,
  } = opts;

  const [rows, setRows]       = useState<T[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<Error | null>(null);
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildUrl = useCallback((p: number) => {
    const qs = new URLSearchParams({ page: String(p), limit: String(pageSize) });
    if (companyId) qs.set('companyId', companyId);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return `${endpoint}?${qs}`;
  }, [endpoint, companyId, pageSize, params]);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(buildUrl(p));
      const d   = res.data?.data ?? res.data;
      const arr: T[] = Array.isArray(d) ? d
        : Array.isArray(d?.data)    ? d.data
        : Array.isArray(d?.items)   ? d.items
        : Array.isArray(d?.vendors) ? d.vendors
        : Array.isArray(d?.invoices)? d.invoices
        : Array.isArray(d?.bills)   ? d.bills
        : Array.isArray(d?.apps)    ? d.apps
        : [];
      setRows(arr);
      setTotal(d?.pagination?.total ?? d?.total ?? d?.count ?? arr.length);
      setPage(p);
    } catch {
      // silent — api.ts interceptor shows toast
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  const refetch = useCallback(() => fetchPage(page), [fetchPage, page]);

  // Auto-fetch — re-run when endpoint, companyId, or any param value changes.
  // Stringify params for comparison; store in ref so the effect dep is stable
  // across renders where the caller passes an inline object literal.
  const paramsKey = JSON.stringify(params);
  const paramsKeyRef = useRef(paramsKey);
  paramsKeyRef.current = paramsKey;
  useEffect(() => {
    if (autoFetch) fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, companyId, autoFetch, paramsKey]);

  // Polling
  useEffect(() => {
    if (pollMs > 0) {
      pollRef.current = setInterval(refetch, pollMs);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollMs, refetch]);

  const save = useCallback(async (payload: Partial<T> & { id?: string }): Promise<T | null> => {
    setSaving(true);
    setError(null);
    try {
      // Fields to ALWAYS strip from the payload to avoid backend validation errors
      // or unintentional overwrites of system-managed fields.
      const readonlyFields = [
        'id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
        'submittedAt', 'approvedAt', 'approvedBy', 'deletedAt'
      ];
      
      const filteredPayload = Object.keys(payload).reduce((acc: any, key) => {
        if (!readonlyFields.includes(key)) {
          acc[key] = (payload as any)[key];
        }
        return acc;
      }, {});

      const id = payload.id;
      const body = sanitizePayload(filteredPayload);

      // Re-inject companyId so the backend can scope the record correctly.
      // sanitizePayload strips it to avoid DTO rejections on endpoints that
      // don't accept it, but most create endpoints need it for multi-tenancy.
      if (companyId && !id) {
        (body as any).companyId = companyId;
      }
      
      const res = id
        ? await api.patch(`${endpoint}/${id}`, body)
        : await api.post(endpoint, body);
      const saved: T = res.data?.data ?? res.data;
      toast.success(id ? 'Updated successfully' : 'Created successfully');
      await refetch();
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Save failed'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [endpoint, companyId, refetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    // Optimistic remove — store previous state so we can revert on failure
    const prevRows = rows;
    const prevTotal = total;
    setRows(prev => prev.filter(r => r.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success('Deleted');
      return true;
    } catch (err) {
      // Revert optimistic update on failure
      setRows(prevRows);
      setTotal(prevTotal);
      setError(err instanceof Error ? err : new Error('Delete failed'));
      return false;
    }
  }, [endpoint, rows, total]);

  return { rows, total, page, loading, saving, error, fetchPage, refetch, save, remove, setPage };
}