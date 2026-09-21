/**
 * @file useVatFilings.ts
 *
 * useVatFilings — focused hook for VAT filing CRUD operations.
 *
 * Responsibilities
 * ────────────────
 *  • Loads the filing list for a given country + optional year
 *  • Exposes saveDraft(), submit(), and refresh() mutations
 *  • Tracks per-operation loading and error state independently
 *    from the catalogue loading in VatModuleContext
 *  • Invalidates the list after every mutation
 *
 * Usage
 * ─────
 *   const {
 *     filings, total, loading, error,
 *     saveDraft, submit, refresh,
 *     saving, submitting, saveError, submitError,
 *   } = useVatFilings({ countryCode: 'ET', year: 2025 });
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { useVatModules } from '../context/VatModuleContext';
import type {
  FilingRecord,
  FilingListResult,
  SaveFilingInput,
  SubmitFilingInput,
} from '../context/VatModuleContext';

export interface UseVatFilingsOptions {
  countryCode?: string;
  year?:        number;
  /** Automatically load filings on mount (default: true) */
  autoLoad?:    boolean;
}

export interface UseVatFilingsResult {
  filings:   FilingRecord[];
  total:     number;
  loading:   boolean;
  error:     string | null;

  /** Save (create/update) a DRAFT filing */
  saveDraft(input: SaveFilingInput): Promise<FilingRecord | null>;
  saving:    boolean;
  saveError: string | null;

  /** Submit a filing by id */
  submit(id: string, input?: SubmitFilingInput): Promise<FilingRecord | null>;
  submitting:  boolean;
  submitError: string | null;

  /** Get a single filing's full record */
  getFiling(id: string): Promise<FilingRecord | null>;

  /** Reload the filing list */
  refresh(): Promise<void>;

  /** Clear any persisted error state */
  clearErrors(): void;
}

export function useVatFilings(options: UseVatFilingsOptions = {}): UseVatFilingsResult {
  const { countryCode, year, autoLoad = true } = options;
  const { listFilings, saveFiling, submitFiling, getFiling } = useVatModules();

  // ── List state ────────────────────────────────────────────────────────
  const [filings,  setFilings]  = useState<FilingRecord[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── Save state ────────────────────────────────────────────────────────
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Submit state ──────────────────────────────────────────────────────
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prevent double-fetch in StrictMode
  const loadedRef = useRef(false);

  // ── Load ──────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: FilingListResult = await listFilings({
        countryCode,
        year,
        limit: 50,
      });
      setFilings(result.data);
      setTotal(result.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load filings');
    } finally {
      setLoading(false);
    }
  }, [listFilings, countryCode, year]);

  useEffect(() => {
    if (!autoLoad) return;
    if (loadedRef.current) return;
    loadedRef.current = true;
    refresh();
  }, [autoLoad, refresh]);

  // ── Save draft ────────────────────────────────────────────────────────

  const saveDraft = useCallback(async (input: SaveFilingInput): Promise<FilingRecord | null> => {
    setSaving(true);
    setSaveError(null);
    try {
      const record = await saveFiling(input);
      // Optimistically update the list — replace existing or prepend
      setFilings((prev) => {
        const idx = prev.findIndex(
          (f) => f.countryCode === record.countryCode && f.periodKey === record.periodKey,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = record;
          return next;
        }
        return [record, ...prev];
      });
      return record;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save filing';
      setSaveError(msg);
      return null;
    } finally {
      setSaving(false);
    }
  }, [saveFiling]);

  // ── Submit ────────────────────────────────────────────────────────────

  const submit = useCallback(
    async (id: string, input: SubmitFilingInput = {}): Promise<FilingRecord | null> => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const record = await submitFiling(id, input);
        // Update the matching entry in the list
        setFilings((prev) => prev.map((f) => (f.id === id ? record : f)));
        return record;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to submit filing';
        setSubmitError(msg);
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [submitFiling],
  );

  // ── Get single ────────────────────────────────────────────────────────

  const getOne = useCallback(async (id: string): Promise<FilingRecord | null> => {
    try {
      return await getFiling(id);
    } catch {
      return null;
    }
  }, [getFiling]);

  // ── Clear errors ──────────────────────────────────────────────────────

  const clearErrors = useCallback(() => {
    setError(null);
    setSaveError(null);
    setSubmitError(null);
  }, []);

  return {
    filings,
    total,
    loading,
    error,
    saveDraft,
    saving,
    saveError,
    submit,
    submitting,
    submitError,
    getFiling: getOne,
    refresh,
    clearErrors,
  };
}
