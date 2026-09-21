import { Skeleton, AppPage, VVProcessScreen, type VVField, type VVValues } from '@ovds/ui';
import {
  Activity,
  AlertTriangle,
  Banknote,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileCheck,
  Play,
  RefreshCw,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useRbac } from '../rbac';
import api from '../services/api';

// -- Types ---------------------------------------------------------------------
interface _VandvReport {
  companyId: string;
  period: string;
  generatedAt: string;
  taxpayerCategory: {
    category: string;
    annualTurnover: number;
    vatRegistered: boolean;
    bookkeepingType: string;
    requirements: string[];
  };
  vat: { compliant: boolean; checks: Record<string, unknown>; issues: string[] };
  paye: { compliant: boolean; checks: Record<string, unknown>; issues: string[] };
  wht: { compliant: boolean; checks: Record<string, unknown>; issues: string[] };
  reconciliation: {
    balanced: boolean;
    totalDebits: number;
    totalCredits: number;
    difference: number;
    journalEntriesCount: number;
  };
  periodLocked: boolean;
  overallScore: number;
  overallStatus: string;
}

interface _QuickCheck {
  pass: boolean;
  message: string;
}

interface VandvDraft {
  period: string;
  values: VVValues;
  savedAt: string;
}

// -- Helpers -------------------------------------------------------------------
const STATUS_COLOR: Record<string, string> = {
  COMPLIANT:
    'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)] dark:border-green-800',
  WARNING:
    'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  NON_COMPLIANT:
    'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',
  PENDING:
    'text-slate-500 bg-white border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLIANT: <CheckCircle2 size={16} />,
  WARNING: <AlertTriangle size={16} />,
  NON_COMPLIANT: <AlertTriangle size={16} />,
  PENDING: <Clock size={16} />,
};

function fmtETB(n: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

// -- V&V submission field set (Ovds-style double-entry capture) ----------
const VV_SUBMISSION_FIELDS: VVField[] = [
  { key: 'tin', label: 'Taxpayer TIN', type: 'tin', required: true, value: '', placeholder: 'e.g. 123456789012345', hint: '15-digit Taxpayer Identification Number' },
  { key: 'fsNo', label: 'Fiscal Sales Register No.', type: 'text', required: true, value: '', placeholder: 'FS-000123', hint: 'Machine-issued register number' },
  { key: 'docNo', label: 'Document / Invoice No.', type: 'text', required: true, value: '', placeholder: 'INV-2026-001' },
  { key: 'period', label: 'Tax Period', type: 'text', required: true, value: '', placeholder: '2026-07', hint: 'Reporting month / quarter' },
  { key: 'txnDate', label: 'Transaction Date', type: 'date', required: true, value: '' },
  { key: 'debitAmount', label: 'Debit Amount (Inflow)', type: 'currency', required: true, side: 'debit', value: 0, hint: 'Cash / Bank received' },
  { key: 'creditAmount', label: 'Credit Amount (Outflow)', type: 'currency', required: true, side: 'credit', value: 0, hint: 'Revenue / Payable booked' },
  { key: 'branch', label: 'Branch Code', type: 'text', advanced: true, value: '', placeholder: 'HQ' },
  { key: 'costCenter', label: 'Cost Center', type: 'text', advanced: true, value: '' },
  { key: 'notes', label: 'Notes', type: 'text', advanced: true, value: '' },
];

// -- Component ----------------------------------------------------------------
export default function VandvCompliance() {
  const { selectedCompanyId } = useBusiness();
  const { can } = useRbac();
  usePageTitle('V&V Compliance');

  const [view, setView] = useState<'report' | 'process'>('report');
  const [autoSave, setAutoSave] = useState<{ lastSavedAt: string | null; saving: boolean }>({
    lastSavedAt: null,
    saving: false,
  });

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [quickChecks, setQuickChecks] = useState<any>(null);
  const [draft, setDraft] = useState<VandvDraft | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadReport = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const period = new Date().toISOString().slice(0, 7);
      const [reportRes, quickRes, draftRes] = await Promise.all([
        api.get(`/vandv/report/${selectedCompanyId}`, {
          params: { period },
        }),
        api.get(`/vandv/quick/${selectedCompanyId}`),
        api.get(`/vandv/draft/${selectedCompanyId}`),
      ]);
      setReport(reportRes.data?.data ?? reportRes.data);
      const qd = quickRes.data.data ?? quickRes.data;
      // Backend returns { companyId, overallPass, checks: { vat, reconciliation, periodLock } }
      setQuickChecks(qd.checks ?? qd);
      const dd = draftRes.data?.data ?? draftRes.data;
      setDraft(dd ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  const handleRunChecks = () => {
    loadReport();
  };

  const handleVVSubmit = async (values: VVValues) => {
    if (!selectedCompanyId) return;
    const period = (values.period as string) || new Date().toISOString().slice(0, 7);
    const payload = {
      companyId: selectedCompanyId,
      tin: String(values.tin ?? ''),
      fsNo: String(values.fsNo ?? ''),
      docNo: String(values.docNo ?? ''),
      period,
      txnDate: String(values.txnDate ?? ''),
      debitAmount: Number(values.debitAmount ?? 0),
      creditAmount: Number(values.creditAmount ?? 0),
      branch: values.branch ? String(values.branch) : undefined,
      costCenter: values.costCenter ? String(values.costCenter) : undefined,
      notes: values.notes ? String(values.notes) : undefined,
    };
    const res = await api.post('/vandv/submit', payload);
    const data = (res.data?.data ?? res.data) as {
      confirmationNumber: string;
      acknowledgementReceipt?: { receiptId: string };
    };
    toast.success(
      `V&V submitted — MoR confirmation ${data.confirmationNumber}${
        data.acknowledgementReceipt ? ` (${data.acknowledgementReceipt.receiptId})` : ''
      }`,
    );
    // Clear the saved draft once the entry has been submitted.
    setDraft(null);
  };

  // System-proposed baseline derived from the loaded compliance report. The
  // V&V process screen diffs the user-validated values against this snapshot
  // so the Final Review modal shows meaningful Original vs Validated changes.
  const vvBaseline = useMemo<VVValues | undefined>(() => {
    if (!report) return undefined;
    return {
      period: report.period,
      debitAmount: report.reconciliation?.totalDebits ?? null,
      creditAmount: report.reconciliation?.totalCredits ?? null,
    };
  }, [report]);

  // Initial values = baseline, overridden by any previously auto-saved draft
  // so a half-finished V&V entry is restored when the user returns.
  const vvInitialValues = useMemo<VVValues | undefined>(() => {
    const base = { ...(vvBaseline ?? {}) };
    if (draft?.values) return { ...base, ...draft.values };
    return base;
  }, [vvBaseline, draft]);

  // Persist the in-progress V&V entry to the backend draft endpoint.
  const persistDraft = async (values: VVValues) => {
    if (!selectedCompanyId) return;
    const period = (values.period as string) || new Date().toISOString().slice(0, 7);
    try {
      await api.post(`/vandv/draft`, { companyId: selectedCompanyId, period, values });
      setAutoSave({ saving: false, lastSavedAt: new Date().toISOString() });
    } catch {
      setAutoSave({ saving: false, lastSavedAt: null });
    }
  };

  // Drive the Ovds-style auto-save indicator from real draft writes.
  const handleVVChange = (values: VVValues) => {
    setAutoSave((a) => ({ ...a, saving: true, lastSavedAt: null }));
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => void persistDraft(values), 800);
  };

  const taxpayerCategoryLabel: Record<string, string> = {
    A: 'Category A (> ETB 1M) — Full Double-Entry',
    B: 'Category B (ETB 500K–1M) — Single-Entry',
    C: 'Category C (< ETB 500K) — Presumptive Tax',
  };

  return (
    <AppPage title="V&V Compliance">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck size={22} className="text-ovds-blue" /> V&V Compliance
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ethiopian MoR Verification & Validation — Proclamation No. 1395/2025 · 1341/2024 · Reg. 570/2025
            </p>
          </div>
          {view === 'report' && (
            <button
              onClick={handleRunChecks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-ovds-blue text-white rounded-lg text-xs font-medium hover:bg-ovds-blue-dark transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              Run V&V Checks
            </button>
          )}
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-slate-200 dark:border-slate-800">
          {([
            { id: 'report', label: 'Compliance Report' },
            { id: 'process', label: 'Validate & Submit' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={
                'relative -mb-px px-3 py-2 text-[12px] font-semibold transition-colors ' +
                (view === tab.id
                  ? 'text-ovds-blue border-b-2 border-ovds-blue'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-b-2 border-transparent')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {view === 'report' ? (
          <>
            {loading && !report ? (
              <div className="space-y-4">
                <Skeleton.Line className="h-32 w-full rounded-xl" />
                <Skeleton.Line className="h-48 w-full rounded-xl" />
                <Skeleton.Line className="h-32 w-full rounded-xl" />
              </div>
            ) : !report ? (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a company to run V&V checks</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Score */}
                <div
                  className={`rounded-xl border p-5 shadow-sm ${
                    STATUS_COLOR[report.overallStatus] || STATUS_COLOR.PENDING
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      {STATUS_ICON[report.overallStatus] || <Activity size={20} />}
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider">Overall Status</h3>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Generated {new Date(report.generatedAt).toLocaleString()} · Period {report.period}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{report.overallScore}</div>
                      <div className="text-[10px] uppercase tracking-wider opacity-80">/ 100</div>
                    </div>
                  </div>
                  {(report as any).issues && (report as any).issues.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {(report as any).issues.map((issue: any, idx: any) => (
                        <p key={idx} className="text-xs flex items-start gap-1.5">
                          <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                          {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Checks */}
                {quickChecks && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      className={`rounded-lg border p-3 text-xs ${
                        quickChecks.vat.pass
                          ? 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                          : 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {quickChecks.vat.pass ? (
                          <CheckCircle2 size={12} className="text-[var(--pro-azure)]" />
                        ) : (
                          <AlertTriangle size={12} className="text-rose-600" />
                        )}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">VAT Rate</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{quickChecks.vat.message}</p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 text-xs ${
                        quickChecks.reconciliation.pass
                          ? 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                          : 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {quickChecks.reconciliation.pass ? (
                          <CheckCircle2 size={12} className="text-[var(--pro-azure)]" />
                        ) : (
                          <AlertTriangle size={12} className="text-rose-600" />
                        )}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Reconciliation</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{quickChecks.reconciliation.message}</p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 text-xs ${
                        quickChecks.periodLock.pass
                          ? 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                          : 'border-rose-200 bg-rose-50/50 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {quickChecks.periodLock.pass ? (
                          <CheckCircle2 size={12} className="text-[var(--pro-azure)]" />
                        ) : (
                          <AlertTriangle size={12} className="text-rose-600" />
                        )}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Period Lock</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{quickChecks.periodLock.message}</p>
                    </div>
                  </div>
                )}

                {/* Taxpayer Category */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                    <FileCheck size={16} className="text-ovds-blue" /> Taxpayer Category
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        report.taxpayerCategory.category === 'A'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                          : report.taxpayerCategory.category === 'B'
                            ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-[var(--pro-azure-50)]/10 dark:text-[var(--pro-azure-light)]'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {report.taxpayerCategory.category}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {taxpayerCategoryLabel[report.taxpayerCategory.category] || report.taxpayerCategory.bookkeepingType}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Annual Turnover</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{fmtETB(report.taxpayerCategory.annualTurnover)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">VAT Registered</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {report.taxpayerCategory.vatRegistered ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Bookkeeping</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                        {report.taxpayerCategory.bookkeepingType}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Category Thresholds</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        A: {fmtETB(1_000_000)} · B: {fmtETB(500_000)}
                      </p>
                    </div>
                  </div>
                  {report.taxpayerCategory.requirements.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {report.taxpayerCategory.requirements.map((req: any, idx: any) => (
                        <p key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                          <ChevronRight size={10} className="mt-0.5 shrink-0 text-ovds-blue" />
                          {req}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detailed Checks Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* VAT */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                      <Zap size={16} className="text-ovds-blue" /> VAT Verification
                    </h3>
                    <div className="space-y-2">
                      {(report as any).vat.checks.standardRate && (
                        <CheckRow
                          label="Standard Rate (15%)"
                          pass={(report as any).vat.checks.standardRate.pass as boolean}
                          detail={`Expected: ${fmtPct((report as any).vat.checks.standardRate.expected as number)} · Actual: ${fmtPct((report as any).vat.checks.standardRate.actual as number)}`}
                        />
                      )}
                      <CheckRow
                        label="TIN Length (15 chars)"
                        pass={(report as any).vat.checks.tinLength.pass as boolean}
                        detail={(report as any).vat.checks.tinLength.tin as string}
                      />
                      <CheckRow
                        label="Output VAT Ledger"
                        pass={true}
                        detail={`${(report as any).vat.checks.outputVatLedger.entries} entries`}
                      />
                      <CheckRow
                        label="Input VAT Ledger"
                        pass={true}
                        detail={`${(report as any).vat.checks.inputVatLedger.entries} entries`}
                      />
                    </div>
                  </div>

                  {/* PAYE/PIT */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                      <Banknote size={16} className="text-ovds-blue" /> PAYE / PIT Verification
                    </h3>
                    <div className="space-y-2">
                      <CheckRow
                        label="6 PIT Brackets"
                        pass={(report as any).paye.checks.pitBrackets.pass as boolean}
                        detail={
                          Object.keys((report as any).paye.checks.pitBrackets.details as Record<string, boolean>).length === 6
                            ? 'All 6 brackets validated'
                            : 'Bracket mismatch'
                        }
                      />
                      <CheckRow
                        label="Tax-Free Threshold (ETB 2,000)"
                        pass={(report as any).paye.checks.taxFreeThreshold.pass as boolean}
                        detail={`Expected: ETB 2,000`}
                      />
                      <CheckRow
                        label="Employee Pension (7%, cap ETB 15K)"
                        pass={(report as any).paye.checks.employeePension.pass as boolean}
                        detail={`${fmtPct((report as any).paye.checks.employeePension.rate)} · Cap: ${fmtETB((report as any).paye.checks.employeePension.cap as number)}`}
                      />
                      <CheckRow
                        label="Employer Pension (11%, cap ETB 15K)"
                        pass={(report as any).paye.checks.employerPension.pass as boolean}
                        detail={`${fmtPct((report as any).paye.checks.employerPension.rate)} · Cap: ${fmtETB((report as any).paye.checks.employerPension.cap as number)}`}
                      />
                    </div>
                  </div>

                  {/* WHT */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                      <Shield size={16} className="text-ovds-blue" /> Withholding Tax
                    </h3>
                    <div className="space-y-2">
                      <CheckRow
                        label="Services Threshold (ETB 10,000)"
                        pass={(report as any).wht.checks.servicesThreshold.pass as boolean}
                        detail={`${fmtPct((report as any).wht.checks.servicesThreshold.rate as number)} WHT`}
                      />
                      <CheckRow
                        label="Goods Threshold (ETB 20,000)"
                        pass={(report as any).wht.checks.goodsThreshold.pass as boolean}
                        detail={`${fmtPct((report as any).wht.checks.goodsThreshold.rate as number)} WHT`}
                      />
                      <CheckRow
                        label="Total Withheld"
                        pass={(report as any).wht.checks.totalWithheld.pass as boolean}
                        detail={report.wht.compliant ? 'Matches calculation' : 'Mismatch detected'}
                      />
                    </div>
                  </div>

                  {/* Reconciliation */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                      <ClipboardList size={16} className="text-ovds-blue" /> Trial Balance Reconciliation
                    </h3>
                    <div className="space-y-2">
                      <CheckRow
                        label="Debits = Credits"
                        pass={report.reconciliation.balanced}
                        detail={`Diff: ${fmtETB(report.reconciliation.difference)}`}
                      />
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400">Total Debits</span>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{fmtETB(report.reconciliation.totalDebits)}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Total Credits</span>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{fmtETB(report.reconciliation.totalCredits)}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {report.reconciliation.journalEntriesCount} journal entries · Last: {(report as any).reconciliation.lastEntryDate || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Period Lock */}
                <div
                  className={`rounded-xl border p-4 shadow-sm ${
                    report.periodLocked
                      ? 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20'
                      : 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {report.periodLocked ? (
                      <CheckCircle2 size={16} className="text-[var(--pro-azure)]" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-600" />
                    )}
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Period Lock Status
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        report.periodLocked
                          ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {report.periodLocked ? 'LOCKED' : 'UNLOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {report.periodLocked
                      ? 'This period is locked — backdated entries are prevented per MoR audit requirements.'
                      : 'This period is not locked — backdated entries may be possible. Lock via Period Close.'}
                  </p>
                </div>

                {/* Reference Links */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-ovds-blue" /> Ethiopian Tax Law References
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <RefLink
                      label="Proclamation No. 1395/2025"
                      desc="PIT, WHT, Pension, MAT"
                      href="https://justice.gov.et/en/directives/directive-on-procedures-for-conducting-tax-audit-conducting-procedure-and-issuing-tax-assessments-directive-no-1063-2025/"
                    />
                    <RefLink
                      label="Proclamation No. 1341/2024"
                      desc="VAT 15%, e-Invoice QR"
                      href="https://justice.gov.et/en/directives/directive-on-procedures-for-conducting-tax-audit-conducting-procedure-and-issuing-tax-assessments-directive-no-1063-2025/"
                    />
                    <RefLink
                      label="Regulation No. 570/2025"
                      desc="DRRF levies, VAT threshold ETB 2M"
                      href="https://justice.gov.et/en/directives/directive-on-procedures-for-conducting-tax-audit-conducting-procedure-and-issuing-tax-assessments-directive-no-1063-2025/"
                    />
                    <RefLink
                      label="Directive No. 1063/2025"
                      desc="MoR Tax Audit Procedures"
                      href="https://justice.gov.et/en/directives/directive-on-procedures-for-conducting-tax-audit-conducting-procedure-and-issuing-tax-assessments-directive-no-1063-2025/"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <VVProcessScreen
            fields={VV_SUBMISSION_FIELDS}
            entityLabel="Tax Return"
            initialValues={vvInitialValues}
            original={vvBaseline}
            autoSave={autoSave}
            onChange={handleVVChange}
            onSubmit={handleVVSubmit}
            onCancel={() => setView('report')}
            onReset={() => setAutoSave({ saving: false, lastSavedAt: null })}
          />
        )}
      </div>
    </AppPage>
  );
}

// -- Sub-components -----------------------------------------------------------
function CheckRow({ label, pass, detail }: { label: string; pass: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 max-w-[200px] text-right truncate">{detail}</span>
        {pass ? (
          <CheckCircle2 size={12} className="text-[var(--pro-azure)] shrink-0" />
        ) : (
          <AlertTriangle size={12} className="text-rose-600 shrink-0" />
        )}
      </div>
    </div>
  );
}

function RefLink({ label, desc, href }: { label: string; desc: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <FileCheck size={12} className="text-ovds-blue shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{label}</p>
        <p className="text-[10px] text-slate-400">{desc}</p>
      </div>
      <ChevronRight size={10} className="shrink-0 text-slate-400 ml-auto" />
    </a>
  );
}
