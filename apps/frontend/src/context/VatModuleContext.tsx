/**
 * @file VatModuleContext.tsx
 *
 * React context that surfaces the tenant's active VAT country modules to
 * every component in the tree.
 *
 * What it owns
 * ────────────
 *  • catalogue       — all globally installed country modules (GET /vat/modules)
 *  • tenantModules   — modules active for THIS tenant (GET /vat/modules/tenant)
 *  • activate()      — POST /vat/modules/activate
 *  • deactivate()    — POST /vat/modules/deactivate
 *  • calculate()     — POST /vat/calculate  (real-time VAT calculation)
 *  • getPeriods()    — GET  /vat/periods/:country/:year
 *  • buildReturn()   — POST /vat/returns/build
 *  • renderReport()  — POST /vat/reports/render
 *  • saveFiling()    — POST /vat/filings/save
 *  • listFilings()   — GET  /vat/filings
 *  • getFiling()     — GET  /vat/filings/:id
 *  • submitFiling()  — POST /vat/filings/:id/submit
 *  • getFilingEvents()— GET /vat/filings/:id/events
 *
 * Canonical types are imported from @ovds/core/vat — no local duplication.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import api from '../services/api';

// ─── Canonical types from the core package ────────────────────────────────────
// Import shapes directly; no re-declaration needed here.
export type {
  VatModuleSummary,
  VatReportTemplate,
  VatFilingPeriod,
  VatLineResult,
  VatResult,
  VatReturnLine,
  VatReturnDraft,
} from '@ovds/core/vat';

import type {
  VatModuleSummary,
  VatResult,
  VatFilingPeriod,
  VatReturnDraft,
} from '@ovds/core/vat';

// ─── Filing-specific types (mirror VatFilingService.FilingRecord) ─────────────
// These live here (not in @ovds/core) because core is NestJS/Prisma-free.

export type VatFilingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'AMENDED';

export interface FilingRecord {
  id:              string;
  tenantId:        string;
  countryCode:     string;
  periodKey:       string;
  status:          VatFilingStatus;
  currency:        string;
  outputVat:       number;
  inputVat:        number;
  netVatPayable:   number;
  returnDraft:     Record<string, unknown>;
  complianceResult?: Record<string, unknown> | null;
  submittedAt?:    string | null;
  submittedBy?:    string | null;
  ackNumber?:      string | null;
  ackReceivedAt?:  string | null;
  dueDate?:        string | null;
  amendmentOf?:    string | null;
  notes?:          string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface FilingEventRecord {
  id:         string;
  filingId:   string;
  tenantId:   string;
  eventType:  string;
  fromStatus: string | null;
  toStatus:   string;
  actorId?:   string | null;
  payload?:   Record<string, unknown> | null;
  occurredAt: string;
}

export interface FilingListResult {
  data:  FilingRecord[];
  total: number;
  page:  number;
  limit: number;
}

// ─── Input types for operations ───────────────────────────────────────────────

export interface CalculateVatInput {
  countryCode:     string;
  transactionDate: string;
  subtotal:        number;
  currency:        string;
  hsCode?:         string;
  isExport?:       boolean;
  isImport?:       boolean;
  reverseCharge?:  boolean;
  meta?:           Record<string, unknown>;
}

export interface BuildReturnInput {
  countryCode: string;
  periodKey:   string;
  currency:    string;
  /** Pass true to auto-persist the draft via POST /returns/build?save=true */
  save?:       boolean;
}

export interface RenderReportInput {
  templateId: string;
  format:     'PDF' | 'XLSX' | 'XML' | 'JSON' | 'CSV';
  periodKey:  string;
  meta: {
    companyName:   string;
    tin:           string;
    periodLabel:   string;
    preparedBy:    string;
    authorityName: string;
    currency:      string;
    countryCode?:  string;
    [key: string]: unknown;
  };
}

export interface SaveFilingInput {
  countryCode:      string;
  periodKey:        string;
  currency:         string;
  returnDraft:      Record<string, unknown>;
  outputVat:        number;
  inputVat:         number;
  netVatPayable:    number;
  dueDate?:         string;
  notes?:           string;
  complianceResult?: Record<string, unknown>;
}

export interface ListFilingsInput {
  countryCode?: string;
  status?:      VatFilingStatus;
  year?:        number;
  page?:        number;
  limit?:       number;
}

export interface SubmitFilingInput {
  channel?: 'API_DIRECT' | 'PORTAL_UPLOAD' | 'EMAIL' | 'MANUAL';
  notes?:   string;
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface VatModuleContextValue {
  catalogue:     VatModuleSummary[];
  tenantModules: VatModuleSummary[];
  loading:       boolean;
  error:         string | null;

  isActive(countryCode: string): boolean;
  getModule(countryCode: string): VatModuleSummary | undefined;

  activate(countryCodes: string[]): Promise<void>;
  deactivate(countryCodes: string[]): Promise<void>;

  calculate(input: CalculateVatInput): Promise<VatResult>;
  getPeriods(countryCode: string, year: number): Promise<VatFilingPeriod[]>;
  buildReturn(input: BuildReturnInput): Promise<VatReturnDraft>;
  renderReport(input: RenderReportInput): Promise<{ filename: string; content?: string; mimeType: string }>;

  // ── Filing persistence ──────────────────────────────────────────────────
  saveFiling(input: SaveFilingInput): Promise<FilingRecord>;
  listFilings(input: ListFilingsInput): Promise<FilingListResult>;
  getFiling(id: string): Promise<FilingRecord>;
  submitFiling(id: string, input: SubmitFilingInput): Promise<FilingRecord>;
  getFilingEvents(id: string): Promise<FilingEventRecord[]>;

  refresh(): Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const VatModuleContext = createContext<VatModuleContextValue | null>(null);

// ─── Hooks ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useVatModules(): VatModuleContextValue {
  const ctx = useContext(VatModuleContext);
  if (!ctx) throw new Error('useVatModules must be used within VatModuleProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveVatModules(): VatModuleSummary[] {
  return useVatModules().tenantModules;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const VatModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalogue,     setCatalogue]     = useState<VatModuleSummary[]>([]);
  const [tenantModules, setTenantModules] = useState<VatModuleSummary[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // ── Module list fetches ────────────────────────────────────────────────

  const fetchCatalogue = useCallback(async () => {
    const res = await api.get<{ success: boolean; data: VatModuleSummary[] }>('/vat/modules');
    setCatalogue(res.data.data ?? []);
  }, []);

  const fetchTenantModules = useCallback(async () => {
    const res = await api.get<{ success: boolean; data: VatModuleSummary[] }>('/vat/modules/tenant');
    setTenantModules(res.data.data ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCatalogue(), fetchTenantModules()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load VAT modules');
    } finally {
      setLoading(false);
    }
  }, [fetchCatalogue, fetchTenantModules]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refresh();
  }, [refresh]);

  // ── Derived ────────────────────────────────────────────────────────────

  const activeCodes = useMemo(
    () => new Set(tenantModules.map((m) => m.countryCode.toUpperCase())),
    [tenantModules],
  );

  const isActive = useCallback(
    (countryCode: string) => activeCodes.has(countryCode.toUpperCase()),
    [activeCodes],
  );

  const getModule = useCallback(
    (countryCode: string) =>
      tenantModules.find((m) => m.countryCode.toUpperCase() === countryCode.toUpperCase()),
    [tenantModules],
  );

  // ── Module activation mutations ────────────────────────────────────────

  const activate = useCallback(async (countryCodes: string[]) => {
    await api.post('/vat/modules/activate', { countryCodes });
    await fetchTenantModules();
  }, [fetchTenantModules]);

  const deactivate = useCallback(async (countryCodes: string[]) => {
    await api.post('/vat/modules/deactivate', { countryCodes });
    await fetchTenantModules();
  }, [fetchTenantModules]);

  // ── VAT calculation operations ─────────────────────────────────────────

  const calculate = useCallback(async (input: CalculateVatInput): Promise<VatResult> => {
    const res = await api.post<{ success: boolean; data: VatResult }>('/vat/calculate', input);
    return res.data.data;
  }, []);

  const getPeriods = useCallback(async (countryCode: string, year: number): Promise<VatFilingPeriod[]> => {
    const res = await api.get<{ success: boolean; data: VatFilingPeriod[] }>(
      `/vat/periods/${countryCode}/${year}`,
    );
    return res.data.data ?? [];
  }, []);

  const buildReturn = useCallback(async (input: BuildReturnInput): Promise<VatReturnDraft> => {
    const { save, ...body } = input;
    const url = save ? '/vat/returns/build?save=true' : '/vat/returns/build';
    const res = await api.post<{ success: boolean; data: VatReturnDraft }>(url, body);
    return res.data.data;
  }, []);

  const renderReport = useCallback(
    async (input: RenderReportInput): Promise<{ filename: string; content?: string; mimeType: string }> => {
      const res = await api.post<{ success: boolean; filename: string; mimeType: string; content?: string }>(
        '/vat/reports/render', input,
      );
      return { filename: res.data.filename, content: res.data.content, mimeType: res.data.mimeType };
    }, [],
  );

  // ── Filing persistence operations ──────────────────────────────────────

  const saveFiling = useCallback(async (input: SaveFilingInput): Promise<FilingRecord> => {
    const res = await api.post<{ success: boolean; data: FilingRecord }>('/vat/filings/save', input);
    return res.data.data;
  }, []);

  const listFilings = useCallback(async (input: ListFilingsInput): Promise<FilingListResult> => {
    const params = new URLSearchParams();
    if (input.countryCode) params.set('countryCode', input.countryCode);
    if (input.status)      params.set('status',      input.status);
    if (input.year)        params.set('year',         String(input.year));
    if (input.page)        params.set('page',         String(input.page));
    if (input.limit)       params.set('limit',        String(input.limit));

    const url = `/vat/filings?${params.toString()}`;
    const res = await api.get<{ success: boolean; data: FilingRecord[]; total: number; page: number; limit: number }>(url);
    return { data: res.data.data, total: res.data.total, page: res.data.page, limit: res.data.limit };
  }, []);

  const getFiling = useCallback(async (id: string): Promise<FilingRecord> => {
    const res = await api.get<{ success: boolean; data: FilingRecord }>(`/vat/filings/${id}`);
    return res.data.data;
  }, []);

  const submitFiling = useCallback(async (id: string, input: SubmitFilingInput): Promise<FilingRecord> => {
    const res = await api.post<{ success: boolean; data: FilingRecord }>(`/vat/filings/${id}/submit`, input);
    return res.data.data;
  }, []);

  const getFilingEvents = useCallback(async (id: string): Promise<FilingEventRecord[]> => {
    const res = await api.get<{ success: boolean; data: FilingEventRecord[] }>(`/vat/filings/${id}/events`);
    return res.data.data ?? [];
  }, []);

  // ── Context value ──────────────────────────────────────────────────────

  const value = useMemo<VatModuleContextValue>(
    () => ({
      catalogue,
      tenantModules,
      loading,
      error,
      isActive,
      getModule,
      activate,
      deactivate,
      calculate,
      getPeriods,
      buildReturn,
      renderReport,
      saveFiling,
      listFilings,
      getFiling,
      submitFiling,
      getFilingEvents,
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogue, tenantModules, loading, error],
  );

  return (
    <VatModuleContext.Provider value={value}>
      {children}
    </VatModuleContext.Provider>
  );
};
