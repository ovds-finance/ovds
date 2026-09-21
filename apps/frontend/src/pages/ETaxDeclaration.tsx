/**
 * e-Tax Declaration — Ministry of Revenues (MoR)
 *
 * Submit VAT returns to the MoR e-Tax portal (etax.mor.gov.et).
 *
 * Authority: ERCA was officially restructured as the Ministry of Revenues (MoR)
 * under Proclamation No. 1097/2018. MoR collects domestic taxes and customs
 * duties, enforces tax laws, and prevents smuggling.
 *
 * Key Portals:
 *   • Ministry of Revenue Online e-Tax  → etax.mor.gov.et
 *   • Tax Admin Support System (TASS)   → tass.mor.gov.et
 *   • Ethiopia Customs Trade Portal     → ects.mor.gov.et
 *   • Ethiopian Customs Commission      → customs.gov.et
 */
import { Loader2 } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Modal, FormField, Input,
  fmtCurrency, fmtDateTime,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import {
  useETaxSubmissions,
  useSubmitVatReturn,
  useCheckETaxStatus,
  type ETaxSubmission,
} from '../services/iotApi';
import {
  getETaxExportUrl,
  useDeclarationReadiness,
  downloadPurchaseAnnexure,
  type DeclarationReadinessResult,
} from '../services/newTaxApi';
import { useVatFilings } from '../services/vatApi';



// ── Constants ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 7); // YYYY-MM

/** Ministry of Revenues portal links (formerly ERCA portals) */
const MOR_PORTALS = [
  {
    code: 'ETAX',
    name: 'Ministry of Revenue Online e-Tax',
    url:  'https://etax.mor.gov.et',
    desc: 'VAT, PAYE, Business Income Tax declarations and payments.',
    color: 'green',
  },
  {
    code: 'TASS',
    name: 'Tax Administration Support System',
    url:  'https://tass.mor.gov.et',
    desc: 'SRM/EFD device registration, vehicle verification and declarations.',
    color: 'sky',
  },
  {
    code: 'ECTS',
    name: 'Ethiopia Customs Trade Portal',
    url:  'https://ects.mor.gov.et',
    desc: 'e-SADs, e-Manifests, Tax Simulator and Customs Tariff engine.',
    color: 'violet',
  },
  {
    code: 'MOR',
    name: 'Ministry of Revenue Official Site',
    url:  'https://mor.gov.et',
    desc: 'Regional tax centre lookup, directives, forms and contacts.',
    color: 'slate',
  },
] as const;

const STATUS_STYLE: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  PENDING:   'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ACCEPTED:  'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300',
  REJECTED:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  FAILED:    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

// ── Small components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({
  label, value, color = 'slate',
}) => (
  <div className="ovds-card p-4">
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-[22px] font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const ETaxDeclaration: React.FC = () => {
  usePageTitle('e-Tax Declaration — Ministry of Revenues');
  const { user, can } = useAuth();
  const { companies, selectedCompanyId } = useBusiness();
  // Use shared Company type which includes vatNumber; local context type is minimal
  const company = companies.find(c => c.id === selectedCompanyId) as
    (typeof companies[0] & { vatNumber?: string | null }) | undefined;

  const [selectedPeriod, setSelectedPeriod] = useState(today);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [signedBy, setSignedBy]   = useState(user?.username ?? '');
  const [checking, setChecking]   = useState<string | null>(null);

  const {
    data: submissions = [],
    isLoading: loadingSubmissions,
    refetch,
  } = useETaxSubmissions();

  // useVatFilings returns { filings, summary, loading, error, refetch }
  const vatFilings$ = useVatFilings?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filings:  any[] = vatFilings$?.filings  ?? [];
  const summary:  any   = vatFilings$?.summary   ?? {};

  const submitMutation = useSubmitVatReturn();
  const checkMutation  = useCheckETaxStatus();

  // Declaration readiness check for the selected period
  const { data: readiness, loading: readinessLoading, refetch: refetchReadiness } =
    useDeclarationReadiness(selectedPeriod, selectedCompanyId ?? undefined);

  // Unique periods from filings, newest first
  const periods = useMemo(
    () => [...new Set(filings.map((f: any) => f.period as string))].sort().reverse(),
    [filings],
  );

  // Selected filing for the chosen period
  const selectedFiling = useMemo(
    () => filings.find((f: any) => f.period === selectedPeriod) ?? null,
    [filings, selectedPeriod],
  );

  // Block re-submission once accepted
  const alreadySubmitted = useMemo(
    () => (submissions as ETaxSubmission[]).some(
      s => s.period === selectedPeriod && ['SUBMITTED', 'ACCEPTED'].includes(s.status),
    ),
    [submissions, selectedPeriod],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiling) return toast.error('Select a VAT filing period first');
    if (!signedBy.trim()) return toast.error('Signatory name is required');

    // VatFiling uses `collected` / `paid` — map to payload names
    const outputVat   = Number(selectedFiling.collected   ?? 0);
    const inputVat    = Number(selectedFiling.paid         ?? 0);
    const netPayable  = Number(selectedFiling.netPayable   ?? 0);

    const payload = {
      tin:           company?.tin        ?? '',
      vatNumber:     company?.vatNumber  ?? '',
      period:        selectedFiling.period,
      outputVat,
      inputVat,
      netPayable,
      invoiceCount:  summary?.invoiceCount  ?? 0,
      totalSales:    summary?.totalSales    ?? 0,
      totalPurchases:summary?.totalPurchases ?? 0,
      companyName:   company?.name ?? '',
      signedBy:      signedBy.trim(),
      signedAt:      new Date().toISOString(),
    };

    try {
      const result = await submitMutation.mutateAsync({
        vatFilingId: selectedFiling.id,
        payload,
      });
      const ref = (result as any)?.ercaReferenceNo ?? (result as any)?.morReferenceNo;
      toast.success(
        ref ? `Submitted to MoR e-Tax. Reference: ${ref}` : 'VAT return submitted to Ministry of Revenues',
        { duration: 6000 },
      );
      setShowSubmitModal(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Submission failed');
    }
  };

  const handleCheckStatus = async (id: string) => {
    setChecking(id);
    try {
      const result = await checkMutation.mutateAsync(id);
      toast.success(`Status: ${(result as any)?.status ?? 'Unknown'}. ${(result as any)?.message ?? ''}`);
      refetch();
    } catch {
      toast.error('Failed to check status with MoR portal');
    } finally {
      setChecking(null);
    }
  };

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const subs = submissions as ETaxSubmission[];
  const submittedCount = subs.filter(s => s.status === 'SUBMITTED').length;
  const acceptedCount  = subs.filter(s => s.status === 'ACCEPTED').length;
  const rejectedCount  = subs.filter(s => s.status === 'REJECTED').length;
  const totalPaid      = subs
    .filter(s => s.status === 'ACCEPTED')
    .reduce((acc, s) => acc + Number(s.totalPayable ?? 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppPage
      title="e-Tax Declaration — Ministry of Revenues (MoR)"
      subtitle="Submit VAT returns and tax declarations to MoR digital portals (etax.mor.gov.et)"
      icon="SHIELD_CHECK"
      actions={
        can('vat:file') ? (
          <Btn variant="primary" icon="SEND" onClick={() => setShowSubmitModal(true)}>
            Submit VAT Return
          </Btn>
        ) : null
      }
    >
      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Submitted"         value={submittedCount}                      color="sky"     />
        <StatCard label="Accepted"          value={acceptedCount}                       color="indigo" />
        <StatCard label="Rejected"          value={rejectedCount > 0 ? rejectedCount : '—'} color={rejectedCount > 0 ? 'rose' : 'slate'} />
        <StatCard label="Total Tax Paid (ETB)" value={fmtCurrency(totalPaid, 'ETB')}   color="violet"  />
      </div>

      {/* ── Authority banner ───────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="p-4 rounded-xl border border-[var(--pro-azure-100)] dark:border-green-800 bg-[var(--pro-azure-50)] dark:bg-green-950/20">
          <div className="flex items-start gap-3">
            <Icon name="INFO" size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-[12px] text-[var(--pro-azure-dark)] dark:text-green-300">
              <p className="font-semibold">
                Ministry of Revenues (MoR) — formerly Ethiopian Revenues and Customs Authority (ERCA)
              </p>
              <p>
                The ERCA was officially restructured as the{' '}
                <strong>Ministry of Revenues (MoR)</strong> under Proclamation No. 1097/2018.
                MoR is the government body responsible for collecting domestic taxes and customs duties,
                enforcing tax laws, and preventing smuggling.
              </p>
              <p>
                This module submits VAT returns to the MoR e-Tax portal via the Ministry of Revenues API.
                Set <code className="font-mono bg-[var(--pro-azure-100)] dark:bg-green-900/40 px-1 rounded">ETAX_MODE=live</code> in
                your environment to enable live submissions. In <strong>stub</strong> mode (default),
                a reference number is generated locally for testing.
              </p>
              <p className="text-[11px] opacity-75">
                Legal basis: VAT Proclamation No. 285/2002 (as amended by Proc. 609/2009, 1157/2019) ·
                Tax Administration Proclamation No. 983/2016 ·
                MoR Establishment Proclamation No. 1097/2018
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key portals grid ───────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Key MoR Portals &amp; Tax Systems
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {MOR_PORTALS.map(p => (
            <a
              key={p.code}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 rounded-xl border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/60
                         transition-colors"
            >
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                {p.name}
                <Icon name="EXTERNAL_LINK" size={9} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {p.desc}
              </p>
              <p className="text-[9px] font-mono mt-2 text-slate-400 dark:text-slate-500">
                {p.url.replace('https://', '')}
              </p>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          For localized inquiries, visit your assigned regional tax centre or contact MoR via{' '}
          <a href="https://mor.gov.et" target="_blank" rel="noopener noreferrer"
             className="underline hover:text-slate-600 dark:hover:text-slate-300">mor.gov.et</a>
          {' '}or the{' '}
          <a href="https://customs.gov.et" target="_blank" rel="noopener noreferrer"
             className="underline hover:text-slate-600 dark:hover:text-slate-300">Ethiopian Customs Commission</a>.
        </p>
      </div>

      {/* ── Declaration Readiness Check ───────────────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Declaration Readiness — {selectedPeriod}
          </p>
          <div className="flex items-center gap-2">
            <select
              className="ovds-select text-[11px] py-1 h-7"
              value={selectedPeriod}
              onChange={e => { setSelectedPeriod(e.target.value); refetchReadiness(); }}
            >
              {periods.length > 0
                ? periods.map(p => <option key={p} value={p}>{p}</option>)
                : <option value={today}>{today}</option>}
            </select>
            <Btn variant="ghost" size="sm" icon="REFRESH" onClick={() => refetchReadiness()}>
              Check
            </Btn>
          </div>
        </div>

        {readinessLoading ? (
          <div className="h-16 flex items-center justify-center text-[12px] text-slate-400">
            <Loader2 size={14} className="animate-spin mr-2" /> Checking readiness…
          </div>
        ) : readiness ? (
          <div className={`p-4 rounded-xl border ${
            readiness.ready
              ? 'border-[var(--pro-azure-100)] dark:border-green-800 bg-[var(--pro-azure-50)] dark:bg-green-950/20'
              : 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20'
          }`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Icon
                name={readiness.ready ? 'CHECK_CIRCLE' : 'X_CIRCLE'}
                size={16}
                className={readiness.ready ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-rose-500'}
              />
              <span className={`text-[13px] font-bold ${readiness.ready ? 'text-[var(--pro-azure-dark)] dark:text-green-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {readiness.ready ? 'Ready to submit' : 'Not ready — resolve errors below'}
              </span>
              {readiness.periodLocked && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  PERIOD LOCKED
                </span>
              )}
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {([
                ['Sales Annexure VAT',    fmtCurrency(readiness.summary.salesAnnexureVat,    'ETB'), readiness.summary.outputVatDiff > 1 ? 'rose' : 'slate'],
                ['Purchase Annexure VAT', fmtCurrency(readiness.summary.purchaseAnnexureVat, 'ETB'), readiness.summary.inputVatDiff > 1  ? 'amber' : 'slate'],
                ['WHT Certificates',      `${readiness.summary.whtCertCount} issued`,                readiness.summary.whtMissingTin > 0 ? 'amber' : 'slate'],
                ['DRRF (Invoices)',        fmtCurrency(readiness.summary.drrfFromInvoices,    'ETB'), 'slate'],
              ] as [string, string, string][]).map(([label, value, color]) => (
                <div key={label} className={`p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700`}>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className={`text-[13px] font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Errors */}
            {readiness.errors.length > 0 && (
              <div className="space-y-1 mb-2">
                {readiness.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
                    <Icon name="X_CIRCLE" size={11} className="shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {readiness.warnings.length > 0 && (
              <div className="space-y-1">
                {readiness.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                    <Icon name="WARNING" size={11} className="shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── CSV Exports — MoR Annexures ────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Download MoR Annexures — {selectedPeriod}
        </p>
        <div className="flex flex-wrap gap-2">
          {([
            { label: 'Sales Annexure (A)',     type: 'vat-sales' as const,          icon: 'FILE_TEXT',   color: 'green', desc: 'Output VAT + WHT + DRRF' },
            { label: 'Purchase Annexure (12)', type: 'purchase-annexure' as const,  icon: 'FILE_TEXT',   color: 'sky',     desc: 'Input VAT from bills' },
            { label: 'WHT Certificates',       type: 'wht-certificates' as const,   icon: 'SHIELD_CHECK',color: 'violet',  desc: 'Issued WHT certs' },
            { label: 'PAYE Salary (Sched. A)', type: 'paye-salary' as const,        icon: 'USERS',       color: 'green',  desc: 'PIT + Pension' },
            { label: 'TOT Log',                type: 'tot-log' as const,             icon: 'RECEIPT',     color: 'amber',   desc: 'Turnover Tax (Cat B)' },
            { label: 'DRRF Register',          type: 'drrf-register' as const,      icon: 'SHIELD_CHECK',color: 'rose',    desc: '1% levy register' },
          ] as const).map(({ label, type, icon, color, desc }) => (
            <a
              key={type}
              href={getETaxExportUrl(type, selectedPeriod)}
              download
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                          border border-${color}-200 dark:border-${color}-800
                          bg-${color}-50 dark:bg-${color}-950/20
                          text-${color}-700 dark:text-${color}-300
                          hover:bg-${color}-100 dark:hover:bg-${color}-900/30 transition-colors`}
              title={desc}
            >
              <Icon name={icon} size={12} />
              {label}
            </a>
          ))}
          {/* Purchase annexure uses JS download helper */}
          <button
            onClick={() => downloadPurchaseAnnexure(selectedPeriod)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                       border border-teal-200 dark:border-teal-800
                       bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300
                       hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
            title="Download BIT Annual Declaration CSV"
          >
            <Icon name="FILE_TEXT" size={12} />
            BIT Declaration
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">
          All annexures use MoR eTax portal date format (DD/MM/YYYY). Upload each CSV to the corresponding tab in the MoR e-Tax portal.
        </p>
      </div>

      {/* ── Submission history table ───────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
            Submission History
          </h2>
          <Btn variant="ghost" size="sm" icon="REFRESH" onClick={() => refetch()}>
            Refresh
          </Btn>
        </div>

        {/* Empty state rendered outside AppTable (AppTable has no empty prop) */}
        {!loadingSubmissions && subs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
            <Icon name="SEND" size={32} className="mb-3 opacity-40" />
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">No submissions yet</p>
            <p className="text-[12px] mt-1">Submit your first VAT return to track MoR acceptance here.</p>
          </div>
        )}

        {(loadingSubmissions || subs.length > 0) && (
        <AppTable loading={loadingSubmissions}>
          <thead>
            <tr>
              <AppTh>Period</AppTh>
              <AppTh>Type</AppTh>
              <AppTh>Net Payable</AppTh>
              <AppTh>Status</AppTh>
              <AppTh>Mode</AppTh>
              <AppTh>MoR Reference</AppTh>
              <AppTh>Submitted</AppTh>
              <AppTh>Accepted</AppTh>
              <AppTh>{'  '}</AppTh>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <AppTr key={s.id}>
                <AppTd>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {s.period}
                  </span>
                </AppTd>

                <AppTd>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                   bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                    {s.submissionType?.replace('_', ' ')}
                  </span>
                </AppTd>

                <AppTd>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {fmtCurrency(s.totalPayable, 'ETB')}
                  </span>
                </AppTd>

                <AppTd>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                    ${STATUS_STYLE[s.status] ?? STATUS_STYLE.DRAFT}`}>
                    {s.status}
                  </span>
                </AppTd>

                <AppTd>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    s.mode === 'live'    ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300' :
                    s.mode === 'sandbox' ? 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300'  :
                                           'bg-slate-100  text-slate-400  dark:bg-slate-800      dark:text-slate-500'
                  }`}>
                    {s.mode?.toUpperCase()}
                  </span>
                </AppTd>

                <AppTd>
                  {s.ercaReferenceNo
                    ? <span className="font-mono text-[11px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{s.ercaReferenceNo}</span>
                    : <span className="text-slate-300 dark:text-slate-600">—</span>}
                </AppTd>

                <AppTd>
                  <span className="text-[11px] text-slate-500">
                    {s.submittedAt ? fmtDateTime(s.submittedAt) : '—'}
                  </span>
                </AppTd>

                <AppTd>
                  {s.acceptedAt
                    ? <span className="text-[11px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{fmtDateTime(s.acceptedAt)}</span>
                    : s.status === 'REJECTED'
                      ? <span className="text-[11px] text-rose-500" title={s.rejectionReason ?? ''}>Rejected</span>
                      : <span className="text-slate-300 dark:text-slate-600">—</span>}
                </AppTd>

                <AppTd>
                  {['SUBMITTED', 'PENDING'].includes(s.status) && (
                    <button
                      onClick={() => handleCheckStatus(s.id)}
                      disabled={checking === s.id}
                      className="text-[10px] font-bold text-sky-600 hover:underline
                                 disabled:opacity-40 dark:text-sky-400"
                    >
                      {checking === s.id ? 'Checking…' : 'Check Status'}
                    </button>
                  )}
                </AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
        )}
      </div>

      {/* ── Submit VAT Return modal ────────────────────────────────────────── */}
      {showSubmitModal && (
        <Modal
          open
          title="Submit VAT Return — Ministry of Revenues (MoR) e-Tax"
          onClose={() => setShowSubmitModal(false)}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                icon="SEND"
                loading={submitMutation.isPending}
                onClick={handleSubmit as any}
                disabled={alreadySubmitted || (readiness != null && !readiness.ready)}
              >
                {alreadySubmitted ? 'Already Submitted' : readiness && !readiness.ready ? 'Resolve Errors First' : 'Submit to MoR e-Tax'}
              </Btn>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Re-submission guard */}
            {alreadySubmitted && (
              <div className="flex items-center gap-2 p-3 rounded-xl border
                              border-amber-200 dark:border-amber-800
                              bg-amber-50 dark:bg-amber-950/20">
                <Icon name="WARNING" size={14} className="text-amber-600 shrink-0" />
                <p className="text-[12px] text-amber-700 dark:text-amber-300">
                  A submission for period <strong>{selectedPeriod}</strong> has already been
                  accepted by the Ministry of Revenues (MoR). Re-submission is blocked to
                  prevent duplicate filings.
                </p>
              </div>
            )}

            {/* Period + signatory */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Filing Period *" required>
                <select
                  className="ovds-select w-full"
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  required
                >
                  {periods.length > 0
                    ? periods.map(p => <option key={p} value={p}>{p}</option>)
                    : <option value={today}>{today} (manual)</option>}
                </select>
              </FormField>
              <FormField label="Signatory / Declarant *" required>
                <Input
                  value={signedBy}
                  onChange={e => setSignedBy(e.target.value)}
                  placeholder="Full name of authorised signatory"
                  required
                />
              </FormField>
            </div>

            {/* Readiness inline summary */}
            {readiness && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-[11px] ${
                readiness.ready
                  ? 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)] dark:border-green-800 dark:bg-green-950/20 text-[var(--pro-azure-dark)] dark:text-green-300'
                  : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300'
              }`}>
                <Icon name={readiness.ready ? 'CHECK_CIRCLE' : 'X_CIRCLE'} size={13} className="shrink-0" />
                <div>
                  {readiness.ready
                    ? 'Readiness check passed — all annexures reconciled.'
                    : readiness.errors[0] ?? 'Declaration not ready.'}
                  {readiness.warnings.length > 0 && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      {readiness.warnings.length} warning(s).
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* VAT return preview */}
            {selectedFiling ? (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700
                              bg-white dark:bg-slate-800/50 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  VAT Return Preview
                </p>
                {([
                  ['Output VAT (Collected)',  fmtCurrency(selectedFiling.collected  ?? 0, 'ETB')],
                  ['Input VAT (Paid / Claimable)', `(${fmtCurrency(selectedFiling.paid ?? 0, 'ETB')})`],
                  ['Net VAT Payable',         fmtCurrency(selectedFiling.netPayable ?? 0, 'ETB')],
                  ['Company TIN',             company?.tin      || 'Not set — configure in Settings'],
                  ['VAT Registration No.',    company?.vatNumber || 'Not set — configure in Settings'],
                  ['Period',                  selectedFiling.period],
                  ['Portal',                  'Ministry of Revenue Online e-Tax (etax.mor.gov.et)'],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2
                                border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                    Total Payable to MoR
                  </span>
                  <span className="text-[14px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                    {fmtCurrency(selectedFiling.netPayable ?? 0, 'ETB')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl border
                              border-sky-200 dark:border-sky-800
                              bg-sky-50 dark:bg-sky-950/20">
                <Icon name="INFO" size={13} className="text-sky-500 shrink-0" />
                <p className="text-[12px] text-sky-700 dark:text-sky-300">
                  No VAT filing found for <strong>{selectedPeriod}</strong>.
                  Complete the VAT filing for this period first.
                </p>
              </div>
            )}

            {/* Legal disclaimer */}
            <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Icon name="INFO" size={12} className="shrink-0 mt-0.5" />
              <p>
                By submitting, you declare the information is accurate and complete as required by
                Ethiopian <strong>VAT Proclamation No. 285/2002</strong> (as amended by
                Proc. Nos. 609/2009 and 1157/2019) and{' '}
                <strong>Tax Administration Proclamation No. 983/2016</strong>.
                This declaration is filed with the <strong>Ministry of Revenues (MoR)</strong> via the
                e-Tax portal (<a href="https://etax.mor.gov.et" target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-slate-600 dark:hover:text-slate-300">etax.mor.gov.et</a>).
                False declarations may result in penalties under Tax Administration Proclamation
                No. 983/2016, Section 26.
              </p>
            </div>

          </form>
        </Modal>
      )}

    </AppPage>
  );
};

export default ETaxDeclaration;
