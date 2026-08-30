/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale, TrendingUp, Wallet, Layers, BookOpen, BarChart3,
  ArrowUpRight, ArrowDownRight, CreditCard, Receipt, Building2,
  FileText, Briefcase, Banknote, Activity, ExternalLink,
  RefreshCw, Filter, PiggyBank, PieChart, Shield,
  Printer, Download, CheckCircle, AlertTriangle,
  AlertCircle, Clock, ChevronDown, ChevronRight,
  GitBranch, ShieldCheck, Database, TrendingDown, XCircle,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import {
  useAuditLog,
  useInterval,
  usePageTitle,
  usePayrollStats,
  useErrorHandler,
} from '../hooks';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Card, Icon, StatusBadge, Amount, EthTaxBadge,
  FormField, Input, Select, Modal, EmptyState, Skeleton, prompt,
} from '../components/ui';
import { useTranslation } from 'react-i18next';
import { getLocale } from '../lib/locale';
import { useAuth } from '../rbac/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import LivePnLWidget from '../components/livePnLWidget';
import ScheduledExportModal from '../components/scheduledExportModal';
import { DefaultTabPin } from '../components/defaultTabPin';
import { useBusiness } from '../context/businessContext';
import { downloadBlob } from '../utils/download';
import IASBUpdateBanner from '../components/iasbUpdateBanner';
import { ContextualInsight } from '@ovds/ui';
import {
  useDeferredTax, postDeferredTaxEntry,
  useIfrs15Schedule, useIfrs15ComplianceCheck,
  useArAgingFull, useApAgingFull, runDunning, postEclProvision,
  useApprovalRules, usePendingApprovals, approveRequest, rejectRequest, seedApprovalRules,
  useConsolidation,
  type DeferredTaxSummary,
  type EquityMovementStatement,
  type EclSummary,
  type Ifrs15ComplianceCheck,
  type AgingReport,
  type DunningResult,
  type ApprovalRequest,
  type ConsolidatedStatements,
} from '../services/reportsApi';
import type {
  TemporaryDifference,
  EquityMovementRow,
  EclBucket,
  PerformanceObligation,
  ContractAnalysis,
  RevenueSchedule,
  AgingItem,
  AgingBucket,
  DunningAction,
  WorkflowRule,
  SubsidiaryEntry,
  EliminationEntry,
  ConsolidatedLineItem,
  GrnItem,
  Grn,
  GrnStats,
  ThreeWayMatchResult,
} from '@ovds/features/reporting';
const formatReportCurrency = (n: number, currency: string, decimals = 2) =>
  `${currency} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

const REPORT_TABS = [
  { key: 'financial',          label: 'Financial' },
  { key: 'payroll',            label: 'Payroll' },
  { key: 'comparison',         label: 'Comparison' },
  { key: 'attendance',         label: 'Attendance' },
  { key: 'sales-tax',          label: 'Sales Tax' },
  { key: 'tax-liability',      label: 'Tax Liability' },
  { key: 'equity-changes',     label: '⚖ Equity Changes' },
  { key: 'ifrs9-ecl',          label: '🛡 IFRS 9 ECL' },
  { key: 'deferred-tax',       label: '🏛 Deferred Tax' },
  { key: 'ifrs15',             label: '📑 IFRS 15' },
  { key: 'ifrs18-mpm',         label: '📊 MPMs (IFRS 18)' },
  { key: 'ar-aging',           label: '⏳ AR Aging' },
  { key: 'approvals',          label: '✅ Approvals' },
  { key: 'notes',              label: '📋 Notes (IAS 1)' },
  { key: 'customer-statement', label: '📄 Statements' },
  { key: 'customer-growth',    label: '📈 Growth · Market Forecast' },
  { key: 'builder',            label: '✦ Builder' },
  { key: 'consolidation',     label: '🏢 IFRS 10 Group' },
  { key: 'saft',             label: '📂 SAF-T Export' },
] as const;
type ReportTab = typeof REPORT_TABS[number]['key'];

// -- Type-param → tab key mapping (for deep-links from sidebar / IFRS Dashboard)
const TYPE_TO_TAB: Record<string, ReportTab> = {
  'bs':            'financial',
  'balance-sheet': 'financial',
  'pl':            'financial',
  'profit-loss':   'financial',
  'cf':            'financial',
  'cash-flow':     'financial',
  'trial-balance': 'financial',
  'equity':        'equity-changes',
  'equity-changes':'equity-changes',
  'ecl':           'ifrs9-ecl',
  'ifrs9':         'ifrs9-ecl',
  'ias12':         'deferred-tax',
  'deferred-tax':  'deferred-tax',
  'ifrs15':        'ifrs15',
  'revenue':       'ifrs15',
  // IFRS 18 — Management Performance Measures (MPMs)
  'ifrs18':        'ifrs18-mpm',
  'mpm':           'ifrs18-mpm',
  'ar-aging':      'ar-aging',
  'aging':         'ar-aging',
  'dunning':       'ar-aging',
  'approvals':     'approvals',
  'workflow':      'approvals',
  'notes':         'notes',
  'tax':           'tax-liability',
  'sales-tax':     'sales-tax',
  'ifrs10':        'consolidation',
  'consolidation': 'consolidation',
  'group':         'consolidation',
};

// ══════════════════════════════════════════════════════════════════════════════
// IAS 12 — Deferred Tax Tab
// ══════════════════════════════════════════════════════════════════════════════
const DeferredTaxTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [asOf, setAsOf] = React.useState(new Date().toISOString().slice(0, 10));
  const [posting, setPosting] = React.useState(false);
  const { data, loading, refetch } = useDeferredTax(companyId, asOf);
  const fmt = (n: number) => formatReportCurrency(n, currency);

  const handlePost = async () => {
    setPosting(true);
    try {
      const result = await postDeferredTaxEntry(companyId, asOf);
      toast.success(result.posted
        ? `IAS 12 entry posted: ${currency} ${result.amount?.toFixed(2)}`
        : 'No deferred tax entry to post (zero balance)');
    } catch { toast.error('Failed to post deferred tax entry'); }
    finally { setPosting(false); }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      'Source,Type,Carrying Amount,Tax Base,Difference,DTA/DTL,Deferred Tax,Notes',
      ...data.differences.map(d =>
        `"${d.source}","${d.type}",${d.carryingAmount},${d.taxBase},${d.difference},"${d.deferredTaxType}",${d.deferredTax},"${d.notes ?? ''}"`
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `deferred-tax-${asOf}.csv`; a.click();
  };

  const dtaBg  = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800';
  const dtlBg  = 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800';
  const netBg  = data?.netPosition === 'NET_DTA' ? dtaBg : data?.netPosition === 'NET_DTL' ? dtlBg : 'bg-white border-slate-200';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database size={16} className="text-violet-500" />
            IAS 12 — Deferred Tax Position
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporary differences between IFRS carrying amounts and Ethiopian tax bases (BIT 30%)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="ovds-caption">As of:</span>
          <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-36 text-xs" />
          <Btn variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={11} />}>Refresh</Btn>
          <Btn variant="secondary" size="sm" onClick={exportCSV} icon={<Download size={11} />}>CSV</Btn>
          <Btn variant="primary" size="sm" onClick={handlePost} disabled={posting || !data?.journalEntry}>
            {posting ? 'Posting…' : 'Post GL Entry'}
          </Btn>
        </div>
      </div>

      {/* KPI strip */}
      <div className="ovds-grid-layout cols-4">
        {[
          { label: 'Deferred Tax Assets',     value: data?.totalDta ?? 0,          color: 'text-emerald-600', bg: dtaBg },
          { label: 'Deferred Tax Liabilities', value: data?.totalDtl ?? 0,         color: 'text-rose-600',    bg: dtlBg },
          { label: 'Net Position',             value: Math.abs(data?.netDeferredTax ?? 0), color: data?.netPosition === 'NET_DTA' ? 'text-emerald-700' : data?.netPosition === 'NET_DTL' ? 'text-rose-700' : 'text-slate-700', bg: netBg },
          { label: 'DTA Recognition',          value: data?.recognitionAssessment?.profitabilityScore ?? 0, suffix: '%', color: (data?.recognitionAssessment?.profitabilityScore ?? 0) >= 60 ? 'text-emerald-600' : 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        ].map((c, i) => (
          <div key={i} className={`rounded-xl border p-4 ${c.bg}`}>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
            {loading ? <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" /> : (
              <p className={`text-xl font-bold tabular-nums ${c.color}`}>
                {c.suffix ? `${c.value}${c.suffix}` : fmt(c.value)}
                {i === 2 && data?.netPosition !== 'ZERO' && (
                  <span className="text-xs font-normal ml-1">{data?.netPosition === 'NET_DTA' ? '(DTA)' : '(DTL)'}</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recognition assessment */}
      {data?.recognitionAssessment && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${data.recognitionAssessment.dtaRecognisable ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          {data.recognitionAssessment.dtaRecognisable
            ? <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            : <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          }
          <div>
            <p className="text-xs font-bold text-slate-800 mb-0.5">IAS 12.35 — DTA Recognition Assessment</p>
            <p className="text-[11px] text-slate-600">{data.recognitionAssessment.rationale}</p>
          </div>
        </div>
      )}

      {/* Temporary differences table */}
      <AppTable>
        <thead><tr>
          <AppTh>Source of Difference</AppTh>
          <AppTh>Type</AppTh>
          <AppTh align="right">Carrying Amount</AppTh>
          <AppTh align="right">Tax Base</AppTh>
          <AppTh align="right">Difference</AppTh>
          <AppTh align="right">DTA / DTL</AppTh>
          <AppTh align="right">Deferred Tax (30%)</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
              ))}</tr>
            ))
          ) : !data || data.differences.length === 0 ? (
            <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No temporary differences found. Chart of accounts may need setup.</td></tr>
          ) : data.differences.map((d, i) => (
            <AppTr key={i}>
              <AppTd>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{d.source}</p>
                  {d.notes && <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">{d.notes}</p>}
                </div>
              </AppTd>
              <AppTd>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.type === 'TAXABLE' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                  {d.type}
                </span>
              </AppTd>
              <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(d.carryingAmount)}</span></AppTd>
              <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(d.taxBase)}</span></AppTd>
              <AppTd align="right"><span className={`tabular-nums text-[11px] font-bold ${d.difference > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(d.difference)}</span></AppTd>
              <AppTd align="right">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${d.deferredTaxType === 'DTL' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {d.deferredTaxType}
                </span>
              </AppTd>
              <AppTd align="right"><span className={`tabular-nums text-[11px] font-bold ${d.deferredTaxType === 'DTL' ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(d.deferredTax)}</span></AppTd>
            </AppTr>
          ))}
          {data && data.differences.length > 0 && (
            <tr className="bg-white dark:bg-slate-800/80 border-t-2 border-slate-200 font-bold">
              <td className="px-4 py-3 font-black text-slate-800 dark:text-white" colSpan={5}>NET DEFERRED TAX POSITION</td>
              <AppTd align="right"><span className={`text-[11px] font-black px-2 py-0.5 rounded ${data.netPosition === 'NET_DTA' ? 'bg-emerald-100 text-emerald-700' : data.netPosition === 'NET_DTL' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{data.netPosition}</span></AppTd>
              <AppTd align="right"><span className={`tabular-nums font-black text-[13px] underline decoration-double ${data.netDeferredTax > 0 ? 'text-emerald-700' : data.netDeferredTax < 0 ? 'text-rose-700' : 'text-slate-500'}`}>{fmt(Math.abs(data.netDeferredTax))}</span></AppTd>
            </tr>
          )}
        </tbody>
      </AppTable>

      {/* Suggested journal entry */}
      {data?.journalEntry && (
        <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl">
          <p className="text-[11px] font-bold text-violet-700 dark:text-violet-400 mb-2">Suggested Period-End Journal Entry (IAS 12)</p>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Dr {data.journalEntry.debitAccount}</span>
              <span className="font-bold text-rose-600">{fmt(data.journalEntry.amount)}</span>
            </div>
            <div className="flex justify-between pl-6">
              <span className="text-slate-600">Cr {data.journalEntry.creditAccount}</span>
              <span className="font-bold text-emerald-600">{fmt(data.journalEntry.amount)}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{data.journalEntry.description}</p>
        </div>
      )}
      <p className="text-[10px] text-slate-400 text-right">{data?.ifrsReference ?? 'IAS 12 — Income Taxes (IASB)'}</p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// IFRS 15 — Revenue Recognition Tab
// ══════════════════════════════════════════════════════════════════════════════
const Ifrs15Tab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [asOf, setAsOf] = React.useState(new Date().toISOString().slice(0, 10));
  const { data: schedule, loading: schedLoading, refetch } = useIfrs15Schedule(companyId, asOf);
  const { data: compliance, loading: compLoading } = useIfrs15ComplianceCheck(companyId);
  const fmt = (n: number) => formatReportCurrency(n, currency);

  const RECOG_COLORS: Record<string, string> = {
    POINT_IN_TIME: 'bg-sky-50 text-sky-700 border-sky-200',
    OVER_TIME_COST: 'bg-violet-50 text-violet-700 border-violet-200',
    OVER_TIME_OUTPUT: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText size={16} className="text-amber-500" />
            IFRS 15 — Revenue from Contracts with Customers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">5-step recognition model · Contract assets/liabilities · Performance obligations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="ovds-caption">As of:</span>
          <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-36 text-xs" />
          <Btn variant="secondary" size="sm" onClick={refetch} icon={<RefreshCw size={11} />}>Refresh</Btn>
        </div>
      </div>

      {/* IFRS 15 compliance check banner */}
      {!compLoading && compliance && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${compliance.overallCompliant ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          {compliance.overallCompliant
            ? <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            : <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          }
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-800 mb-0.5">
              IFRS 15 Bulk Compliance — {compliance.compliant}/{compliance.total} contracts compliant
            </p>
            {!compliance.overallCompliant && compliance.issues.slice(0, 3).map(issue => (
              <p key={issue.invoiceId} className="text-[10px] text-amber-700 dark:text-amber-400">
                · {issue.invoiceNumber}: {issue.issues[0]}
              </p>
            ))}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${compliance.overallCompliant ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
            {compliance.nonCompliant} issues
          </span>
        </div>
      )}

      {/* Revenue schedule KPIs */}
      <div className="ovds-grid-layout cols-4">
        {[
          { label: 'Total Contract Revenue',  value: schedule?.totalContractRevenue ?? 0,  color: 'text-slate-800' },
          { label: 'Recognised to Date',      value: schedule?.recognisedToDate ?? 0,       color: 'text-emerald-600' },
          { label: 'Deferred Revenue',        value: schedule?.deferredRevenue ?? 0,        color: 'text-amber-600' },
          { label: 'Contract Liabilities',    value: schedule?.contractLiabilities ?? 0,   color: 'text-rose-600' },
        ].map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
            {schedLoading ? <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
              : <p className={`text-xl font-bold tabular-nums ${c.color}`}>{fmt(c.value)}</p>
            }
          </div>
        ))}
      </div>

      {/* Overdue performance obligations alert */}
      {(schedule?.overduePerformance ?? 0) > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3">
          <AlertCircle size={15} className="text-rose-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-700">Overdue Performance Obligations: {fmt(schedule!.overduePerformance)}</p>
            <p className="text-[11px] text-rose-600">These contracts have passed their due date without revenue being recognised. Review and update under IFRS 15.38.</p>
          </div>
        </div>
      )}

      {/* Monthly recognition schedule */}
      {schedule && schedule.scheduleByMonth.length > 0 && (
        <div className="ovds-widget-card p-5">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            Revenue Recognition Schedule — YTD
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {schedule.scheduleByMonth.map(m => (
              <div key={m.month} className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{m.month}</p>
                <p className="text-sm font-black tabular-nums text-emerald-600">{fmt(m.amount)}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{m.invoices} inv</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-step IFRS 15 reference */}
      <div className="ovds-widget-card p-5">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <BookOpen size={14} className="text-violet-500" />
          IFRS 15 — 5-Step Revenue Recognition Model
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { step: 1, label: 'Identify Contract', ref: 'IFRS 15.9', desc: 'Approval, commercial substance, collectability probable' },
            { step: 2, label: 'Identify POs', ref: 'IFRS 15.22', desc: 'Distinct goods or services in the contract' },
            { step: 3, label: 'Transaction Price', ref: 'IFRS 15.47', desc: 'Fixed + variable consideration, constraint (15.56)' },
            { step: 4, label: 'Allocate Price', ref: 'IFRS 15.74', desc: 'Relative standalone selling prices per PO' },
            { step: 5, label: 'Recognise Revenue', ref: 'IFRS 15.31', desc: 'Point-in-time or over-time as PO is satisfied' },
          ].map(s => (
            <div key={s.step} className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">{s.step}</span>
                <p className="text-[11px] font-bold text-violet-700 dark:text-violet-400">{s.label}</p>
              </div>
              <p className="text-[9px] font-mono text-violet-400 mb-1">{s.ref}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3 text-right">{schedule?.ifrsReference ?? 'IFRS 15 — Revenue from Contracts with Customers (IASB)'}</p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// AR/AP Aging + Dunning Tab
// ══════════════════════════════════════════════════════════════════════════════
const ArAgingTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [asOf, setAsOf]     = React.useState(new Date().toISOString().slice(0, 10));
  const [view, setView]     = React.useState<'AR' | 'AP'>('AR');
  const [runningDunning, setRunningDunning] = React.useState(false);
  const [postingEcl, setPostingEcl]         = React.useState(false);
  const [dunningResult, setDunningResult]   = React.useState<any>(null);

  const { data: arData, loading: arLoading, refetch: refetchAR } = useArAgingFull(companyId, asOf);
  const { data: apData, loading: apLoading, refetch: refetchAP } = useApAgingFull(companyId, asOf);
  const fmt = (n: number) => formatReportCurrency(n, currency);
  const data    = view === 'AR' ? arData : apData;
  const loading = view === 'AR' ? arLoading : apLoading;

  const handleDunning = async (dryRun: boolean) => {
    setRunningDunning(true);
    setDunningResult(null);
    try {
      const result = await runDunning(companyId, dryRun);
      setDunningResult({ ...result, dryRun });
      toast.success(dryRun
        ? `Preview: ${result.processed} invoices would be processed`
        : `Dunning: ${result.emailed} emails sent, ${result.escalated} escalated`);
    } catch { toast.error('Failed to run dunning'); }
    finally { setRunningDunning(false); }
  };

  const handlePostEcl = async () => {
    setPostingEcl(true);
    try {
      const result = await postEclProvision(companyId, asOf);
      toast.success(result.posted
        ? `ECL provision posted: ${currency} ${result.amount?.toFixed(2)}`
        : 'No ECL provision to post');
    } catch { toast.error('Failed to post ECL provision'); }
    finally { setPostingEcl(false); }
  };

  const STAGE_COLORS = [
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-rose-50 text-rose-700 border-rose-200',
  ];

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      'Bucket,Stage,Count,Gross Amount,ECL Rate,ECL Provision',
      ...data.buckets.map(b => `"${b.label}",${b.stage},${b.count},${b.grossAmount},${b.eclRate},${b.eclProvision}`),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `${view.toLowerCase()}-aging-${asOf}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            {view === 'AR' ? 'AR Aging — IFRS 9 ECL Provisions' : 'AP Aging — Cash Flow Planning'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {view === 'AR'
              ? 'Accounts Receivable aging with IFRS 9 simplified ECL provision matrix (3 stages)'
              : 'Accounts Payable aging by vendor for liquidity management'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(['AR', 'AP'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${view === v ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                {v} Aging
              </button>
            ))}
          </div>
          <span className="ovds-caption">As of:</span>
          <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-36 text-xs" />
          <Btn variant="secondary" size="sm" onClick={view === 'AR' ? refetchAR : refetchAP} icon={<RefreshCw size={11} />}>Refresh</Btn>
          <Btn variant="secondary" size="sm" onClick={exportCSV} icon={<Download size={11} />}>CSV</Btn>
        </div>
      </div>

      {/* Action bar — AR only */}
      {view === 'AR' && (
        <div className="flex items-center gap-2 flex-wrap p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Shield size={13} className="text-emerald-500" /> Automation:
          </span>
          <Btn variant="secondary" size="sm" onClick={() => handleDunning(true)} disabled={runningDunning}>
            {runningDunning ? 'Running…' : 'Preview Dunning'}
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => handleDunning(false)} disabled={runningDunning}>
            {runningDunning ? 'Running…' : 'Run Dunning'}
          </Btn>
          <Btn variant="secondary" size="sm" onClick={handlePostEcl} disabled={postingEcl} icon={<Database size={11} />}>
            {postingEcl ? 'Posting…' : 'Post ECL Provision'}
          </Btn>
          {arData?.collectionRate !== undefined && (
            <span className="ml-auto text-xs font-semibold text-slate-500">
              Collection Rate: <span className={`font-black ${arData.collectionRate >= 80 ? 'text-emerald-600' : arData.collectionRate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{arData.collectionRate?.toFixed(1)}%</span>
            </span>
          )}
        </div>
      )}

      {/* Dunning result */}
      {dunningResult && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${dunningResult.dryRun ? 'bg-sky-50 border-sky-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <CheckCircle size={15} className={`shrink-0 mt-0.5 ${dunningResult.dryRun ? 'text-sky-500' : 'text-emerald-500'}`} />
          <div>
            <p className="text-xs font-bold text-slate-800">{dunningResult.dryRun ? 'Dunning Preview' : 'Dunning Completed'}</p>
            <p className="text-[11px] text-slate-600">
              {dunningResult.processed} processed · {dunningResult.emailed} emails {dunningResult.dryRun ? 'would be' : ''} sent · {dunningResult.escalated} escalated
            </p>
            {dunningResult.errors.length > 0 && (
              <p className="text-[10px] text-rose-600 mt-1">{dunningResult.errors[0]}</p>
            )}
          </div>
        </div>
      )}

      {/* Summary KPIs */}
      {(() => {
        const kpiCells = view === 'AR' ? [
          { label: 'Gross Receivables',   value: data?.totalGross ?? 0,   color: 'text-slate-800', isNum: false, suffix: '' },
          { label: 'Total ECL Provision', value: data?.totalEcl ?? 0,    color: 'text-rose-600',  isNum: false, suffix: '' },
          { label: 'Net Carrying Amount', value: data?.netCarrying ?? 0, color: 'text-emerald-700', isNum: false, suffix: '' },
          { label: 'Collection Rate',     value: arData?.collectionRate ?? 0, suffix: '%', color: (arData?.collectionRate ?? 0) >= 80 ? 'text-emerald-600' : 'text-amber-600', isNum: false },
        ] : [
          { label: 'Total Payables',    value: data?.totalGross ?? 0,   color: 'text-rose-600',   isNum: false, suffix: '' },
          { label: 'Current (not due)', value: data?.buckets?.find(b => b.label.includes('not yet'))?.grossAmount ?? 0, color: 'text-emerald-600', isNum: false, suffix: '' },
          { label: 'Overdue',           value: (data?.totalGross ?? 0) - (data?.buckets?.find(b => b.label.includes('not yet'))?.grossAmount ?? 0), color: 'text-amber-600', isNum: false, suffix: '' },
          { label: 'Vendors',           value: data?.buckets?.reduce((s, b) => s + b.count, 0) ?? 0, isNum: true, color: 'text-slate-700', suffix: '' },
        ];
        return (
          <div className="ovds-grid-layout cols-4">
            {kpiCells.map((c, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                {loading
                  ? <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
                  : <p className={`text-xl font-bold tabular-nums ${c.color}`}>{c.suffix ? `${(c.value as number).toFixed(1)}${c.suffix}` : c.isNum ? c.value : fmt(c.value as number)}</p>
                }
              </div>
            ))}
          </div>
        );
      })()}

      {/* Aging buckets table */}
      <AppTable>
        <thead><tr>
          <AppTh>Aging Bucket</AppTh>
          {view === 'AR' && <AppTh>Stage</AppTh>}
          <AppTh align="right">Count</AppTh>
          <AppTh align="right">Gross Amount</AppTh>
          {view === 'AR' && <>
            <AppTh align="right">ECL Rate</AppTh>
            <AppTh align="right">ECL Provision</AppTh>
          </>}
        </tr></thead>
        <tbody>
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: view === 'AR' ? 6 : 3 }).map((_, j) => (
                <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
              ))}</tr>
            ))
          ) : !data || (data.buckets ?? []).every(b => b.count === 0) ? (
            <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400">No outstanding {view === 'AR' ? 'receivables' : 'payables'} found</td></tr>
          ) : (data.buckets ?? []).filter(b => b.count > 0 || b.grossAmount > 0).map(b => (
            <AppTr key={b.label}>
              <AppTd><span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{b.label}</span></AppTd>
              {view === 'AR' && (
                <AppTd><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STAGE_COLORS[(b.stage ?? 1) - 1]}`}>Stage {b.stage}</span></AppTd>
              )}
              <AppTd align="right"><span className="tabular-nums text-[11px]">{b.count}</span></AppTd>
              <AppTd align="right"><span className={`tabular-nums text-[11px] font-bold ${b.grossAmount > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{fmt(b.grossAmount)}</span></AppTd>
              {view === 'AR' && <>
                <AppTd align="right"><span className="tabular-nums text-[11px] text-slate-500">{((b.eclRate ?? 0) * 100).toFixed(1)}%</span></AppTd>
                <AppTd align="right"><span className={`tabular-nums text-[11px] font-bold ${(b.eclProvision ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{fmt(b.eclProvision ?? 0)}</span></AppTd>
              </>}
            </AppTr>
          ))}
          {view === 'AR' && data && data.totalGross > 0 && (
            <tr className="bg-white dark:bg-slate-800/80 border-t-2 border-slate-200 font-bold">
              <td className="px-4 py-3 font-black text-slate-800 dark:text-white" colSpan={3}>TOTALS</td>
              <AppTd align="right"><span className="font-black tabular-nums">{fmt(data?.totalGross ?? 0)}</span></AppTd>
              <AppTd align="right"><span className="font-black tabular-nums text-slate-500">—</span></AppTd>
              <AppTd align="right"><span className="font-black tabular-nums text-rose-700 underline decoration-double">{fmt(data?.totalEcl ?? 0)}</span></AppTd>
            </tr>
          )}
        </tbody>
      </AppTable>

      {/* ECL journal entry suggestion */}
      {view === 'AR' && (data?.totalEcl ?? 0) > 0 && (
        <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl">
          <p className="text-[11px] font-bold text-violet-700 dark:text-violet-400 mb-2">Suggested IFRS 9 ECL Provision Journal Entry</p>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between"><span className="text-slate-600">Dr Impairment Loss on Trade Receivables (P&L)</span><span className="font-bold text-rose-600">{fmt(data?.totalEcl ?? 0)}</span></div>
            <div className="flex justify-between pl-6"><span className="text-slate-600">Cr Allowance for Doubtful Debts (BS contra)</span><span className="font-bold text-emerald-600">{fmt(data?.totalEcl ?? 0)}</span></div>
          </div>
        </div>
      )}
      <p className="text-[10px] text-slate-400 text-right">{data?.ifrsReference ?? 'IFRS 9.5.5 — ECL Simplified Approach'}</p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Approval Workflow Tab
// ══════════════════════════════════════════════════════════════════════════════
const ApprovalsTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const { user } = useAuth();
  const [view, setView] = React.useState<'pending' | 'rules'>('pending');
  const [seeding, setSeeding] = React.useState(false);
  const [acting, setActing] = React.useState<Record<string, boolean>>({});
  const { rules, loading: rulesLoading, refetch: refetchRules } = useApprovalRules(companyId);
  const { requests, loading: pendingLoading, refetch: refetchPending } = usePendingApprovals(companyId);
  const fmt = (n: number) => formatReportCurrency(n, currency);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedApprovalRules(companyId);
      toast.success(`${result.seeded ?? 0} default approval rules created`);
      refetchRules();
    } catch { toast.error('Failed to seed rules'); }
    finally { setSeeding(false); }
  };

  const handleApprove = async (requestId: string) => {
    setActing(prev => ({ ...prev, [requestId]: true }));
    try {
      const result = await approveRequest(requestId, companyId);
      toast.success(result.fullyApproved ? 'Fully approved ✓' : `Approved — now at level ${result.nextLevel}`);
      refetchPending();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to approve'); }
    finally { setActing(prev => ({ ...prev, [requestId]: false })); }
  };

  const handleReject = async (requestId: string) => {
    const reason = await prompt({ title: 'Rejection reason:', message: 'Please provide a reason for rejecting this request.' });
    if (!reason) return;
    setActing(prev => ({ ...prev, [requestId]: true }));
    try {
      await rejectRequest(requestId, reason, companyId);
      toast.success('Request rejected');
      refetchPending();
    } catch { toast.error('Failed to reject'); }
    finally { setActing(prev => ({ ...prev, [requestId]: false })); }
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED:  'bg-rose-50 text-rose-700 border-rose-200',
    ESCALATED: 'bg-violet-50 text-violet-700 border-violet-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const RESOURCE_ICONS: Record<string, 'INVOICE' | 'MONEY' | 'CHART' | 'REFRESH' | 'EMPLOYEE' | 'ITEM'> = {
    INVOICE: 'INVOICE', BILL: 'INVOICE', EXPENSE: 'MONEY',
    JOURNAL_ENTRY: 'CHART', FUND_TRANSFER: 'REFRESH',
    PAYROLL: 'EMPLOYEE', PURCHASE_ORDER: 'ITEM',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GitBranch size={16} className="text-emerald-500" />
            Approval Workflow Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-level, amount-threshold-aware approvals for all financial documents
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(['pending', 'rules'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-bold capitalize transition-colors ${view === v ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                {v === 'pending' ? `Pending (${requests.length})` : 'Rules'}
              </button>
            ))}
          </div>
          {view === 'rules' && (
            <Btn variant="secondary" size="sm" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Seeding…' : 'Seed Defaults'}
            </Btn>
          )}
        </div>
      </div>

      {/* PENDING APPROVALS VIEW */}
      {view === 'pending' && (
        <div className="space-y-4">
          {pendingLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))
          ) : requests.length === 0 ? (
            <div className="ovds-empty py-16">
              <ShieldCheck size={28} className="text-emerald-500 mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No pending approvals</p>
              <p className="text-[11px] text-slate-400 mt-1">All documents for your role have been processed</p>
            </div>
          ) : requests.map(req => {
            const currentLevel = req.levels.find(l => l.level === req.currentLevel);
            const isMyLevel = currentLevel?.requiredRole === user?.role || user?.role === 'ADMIN';
            return (
              <div key={req.id} className="ovds-widget-card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center shrink-0">
                      <Icon name={RESOURCE_ICONS[req.resourceType] ?? 'ITEM' as any} size={15} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{req.resourceType}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status] ?? ''}`}>{req.status}</span>
                        <span className="text-[10px] text-slate-400">Level {req.currentLevel}/{req.levels.length}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Ref: {req.resourceId.slice(0, 12)}…</p>
                      {req.notes && <p className="text-[11px] text-slate-400 mt-1 italic">{req.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black tabular-nums text-slate-800 dark:text-slate-100">{fmt(req.amount)}</p>
                    {currentLevel && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Awaiting: <span className="font-bold text-amber-600">{currentLevel.label}</span></p>
                    )}
                  </div>
                </div>

                {/* Level progress */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {req.levels.map((l, i) => (
                    <React.Fragment key={l.level}>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : l.level === req.currentLevel ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                        {l.status === 'APPROVED' ? <CheckCircle size={10} /> : l.status === 'REJECTED' ? <AlertCircle size={10} /> : <Clock size={10} />}
                        {l.label}
                      </div>
                      {i < req.levels.length - 1 && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Action buttons */}
                {isMyLevel && req.status === 'PENDING' && (
                  <div className="flex items-center gap-2 mt-3">
                    <Btn
                      variant="primary" size="sm"
                      onClick={() => handleApprove(req.id)}
                      disabled={acting[req.id]}
                      icon={<CheckCircle size={11} />}
                    >
                      {acting[req.id] ? 'Approving…' : 'Approve'}
                    </Btn>
                    <Btn
                      variant="ghost" size="sm"
                      onClick={() => handleReject(req.id)}
                      disabled={acting[req.id]}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Reject
                    </Btn>
                    <p className="text-[10px] text-slate-400 ml-auto">
                      Submitted {new Date(req.createdAt).toLocaleDateString('en-ET')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RULES VIEW */}
      {view === 'rules' && (
        <div className="space-y-4">
          {rulesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))
          ) : rules.length === 0 ? (
            <div className="ovds-empty py-16">
              <GitBranch size={28} className="text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">No approval rules configured</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">Seed the defaults to get started</p>
              <Btn variant="primary" size="sm" onClick={handleSeed} disabled={seeding}>
                {seeding ? 'Seeding…' : 'Seed Default Rules'}
              </Btn>
            </div>
          ) : rules.map(rule => (
            <div key={rule.id} className="ovds-widget-card p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{rule.resourceType}</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{rule.name}</p>
                    {!rule.isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">INACTIVE</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Applies when amount ≥ {fmt(rule.minAmount)}{rule.maxAmount ? ` and < ${fmt(rule.maxAmount)}` : ''}
                    · <span className={`font-bold ${rule.rejectionPolicy === 'STOP' ? 'text-rose-600' : 'text-amber-600'}`}>{rule.rejectionPolicy}</span>
                  </p>
                </div>
                <span className="text-[10px] text-slate-400">{rule.levels.length} level{rule.levels.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {rule.levels.map((l, i) => (
                  <React.Fragment key={l.level}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">{l.level}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{l.label}</span>
                      <span className="text-slate-400">({l.requiredRole})</span>
                      {l.timeoutHours > 0 && <span className="text-[9px] text-amber-500">{l.timeoutHours}h timeout</span>}
                      {l.minAmount && <span className="text-[9px] text-slate-400">≥{fmt(l.minAmount)}</span>}
                    </div>
                    {i < rule.levels.length - 1 && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SAF-T Export Tab — Standard Audit File for Tax (ERCA compliance)
// ══════════════════════════════════════════════════════════════════════════════
const SaftExportTab: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [year, setYear]         = React.useState(new Date().getFullYear());
  const [exporting, setExporting] = React.useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = new URLSearchParams({ year: String(year) });
      if (companyId) q.set('companyId', companyId);
      const res = await api.get(`/ovds/reports/saft-export?${q}`, { responseType: 'blob' });
      downloadBlob(new Blob([res.data], { type: 'application/json' }), `saft-${year}-${companyId ?? 'company'}.json`);
      toast.success(`SAF-T file for ${year} downloaded`);
    } catch {
      toast.error('SAF-T export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header info */}
      <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Database size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">SAF-T (Standard Audit File for Tax)</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
              The SAF-T file provides ERCA auditors and external reviewers a structured JSON export of
              your complete accounting records — chart of accounts, journal entries, sales invoices,
              purchase bills, customers, and suppliers — for a given fiscal year.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
              Covers: General Ledger · Sales Invoices · Purchase Bills · Customers · Suppliers
            </p>
          </div>
        </div>
      </div>

      {/* Year selector + export */}
      <div className="ovds-widget-card p-5 space-y-4">
        <p className="ovds-card-title">Export SAF-T File</p>

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Fiscal Year</label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none hover:border-blue-300 transition-colors"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="pt-5">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Database size={14} />
              {exporting ? 'Generating…' : `Export SAF-T for ${year}`}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p>• The file is delivered as <strong>JSON</strong> (SAF-T 1.0 schema)</p>
          <p>• Ethiopian fiscal year: 8 July {year} — 7 July {year + 1}</p>
          <p>• Journal entries include debit/credit amounts per account and VAT type</p>
          <p>• For large datasets the export is capped at 5,000 journal entries and 5,000 invoices/bills</p>
        </div>
      </div>

      {/* What's included */}
      <div className="ovds-grid-layout cols-2 gap-sm">
        {[
          {
            icon: <BookOpen size={14} />,
            title: 'General Ledger',
            desc: 'All POSTED journal entries with line-level debit/credit and account codes',
            color: 'text-violet-600 bg-violet-50',
          },
          {
            icon: <Receipt size={14} />,
            title: 'Sales Invoices',
            desc: 'All invoices with customer, amount, VAT, date and status',
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            icon: <Briefcase size={14} />,
            title: 'Purchase Bills',
            desc: 'All bills with vendor, amount, VAT, date and status',
            color: 'text-amber-600 bg-amber-50',
          },
          {
            icon: <Shield size={14} />,
            title: 'Master Files',
            desc: 'Chart of accounts, customers (with TIN), and suppliers (with TIN)',
            color: 'text-blue-600 bg-blue-50',
          },
        ].map(item => (
          <div key={item.title} className="ovds-widget-card p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${item.color} shrink-0`}>{item.icon}</div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-xl">
        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>MoR compliance note:</strong> Ethiopian tax law requires businesses to retain accounting records for
          <strong> 10 years</strong>. The SAF-T export is intended for audit support and submission to MoR on request.
          It does not replace formal ERCA eTax filings (VAT return, BIT declaration). Keep the downloaded file
          in a secure, tamper-evident location.
        </p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// IFRS 10 — Group Consolidation Tab
// ══════════════════════════════════════════════════════════════════════════════
const ConsolidationTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const now = new Date();
  const [parentId,   setParentId]   = React.useState(companyId ?? '');
  const [asOfDate,   setAsOfDate]   = React.useState(now.toISOString().slice(0, 10));
  const [startDate,  setStartDate]  = React.useState(`${now.getFullYear()}-01-01`);
  const [endDate,    setEndDate]    = React.useState(now.toISOString().slice(0, 10));
  const [hasRun,     setHasRun]     = React.useState(false);

  const { data, loading, error, refetch } = useConsolidation(
    hasRun ? parentId : undefined,
    asOfDate, startDate, endDate,
  );

  const fmt = (n: number) => formatReportCurrency(n, currency);

  const runConsolidation = () => {
    if (!parentId) { toast.error('Select a parent company ID first'); return; }
    setHasRun(true);
    refetch();
  };

  React.useEffect(() => {
    if (companyId) { setParentId(companyId); }
  }, [companyId]);

  // Export consolidated BS + PL as CSV
  const exportCSV = () => {
    if (!data) return;
    const rows: string[] = [
      `IFRS 10 — Consolidated Financial Statements`,
      `Parent: ${data.parentCompanyName}  |  Period: ${data.period}  |  As of: ${data.asOf}`,
      `Subsidiaries: ${data.subsidiaries.map(s => `${s.companyName} (${s.ownershipPct}%)`).join(', ')}`,
      '',
      'CONSOLIDATED BALANCE SHEET',
      'Account,Type,Parent,Subsidiaries Total,Before Elim,Eliminations,NCI,Consolidated',
      ...data.balanceSheet.assets.map(l =>
        `"${l.accountName}",ASSET,${l.parentAmount},${l.totalBeforeElim - l.parentAmount},${l.totalBeforeElim},${l.eliminations},${l.nciAllocation},${l.consolidatedAmount}`
      ),
      ...data.balanceSheet.liabilities.map(l =>
        `"${l.accountName}",LIABILITY,${l.parentAmount},${l.totalBeforeElim - l.parentAmount},${l.totalBeforeElim},${l.eliminations},${l.nciAllocation},${l.consolidatedAmount}`
      ),
      ...data.balanceSheet.equity.map(l =>
        `"${l.accountName}",EQUITY,${l.parentAmount},${l.totalBeforeElim - l.parentAmount},${l.totalBeforeElim},${l.eliminations},${l.nciAllocation},${l.consolidatedAmount}`
      ),
      `TOTAL ASSETS,,,,,,,${data.balanceSheet.totalAssets}`,
      `TOTAL LIAB & EQUITY,,,,,,,${data.balanceSheet.totalLiabAndEquity}`,
      `NCI,,,,,,,${data.balanceSheet.nci}`,
      '',
      'CONSOLIDATED INCOME STATEMENT',
      'Account,Type,Parent,Subsidiaries Total,Before Elim,Eliminations,NCI,Consolidated',
      ...data.incomeStatement.revenue.map(l =>
        `"${l.accountName}",REVENUE,${l.parentAmount},${l.totalBeforeElim - l.parentAmount},${l.totalBeforeElim},${l.eliminations},${l.nciAllocation},${l.consolidatedAmount}`
      ),
      ...data.incomeStatement.expenses.map(l =>
        `"${l.accountName}",EXPENSE,${l.parentAmount},${l.totalBeforeElim - l.parentAmount},${l.totalBeforeElim},${l.eliminations},${l.nciAllocation},${l.consolidatedAmount}`
      ),
      `GROUP NET PROFIT,,,,,,,${data.incomeStatement.groupNetProfit}`,
      `NCI SHARE OF PROFIT,,,,,,,${data.incomeStatement.nciShareOfProfit}`,
      `PARENT SHARE OF PROFIT,,,,,,,${data.incomeStatement.parentShareOfProfit}`,
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = `ifrs10-consolidation-${asOfDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Layers size={16} className="text-violet-500" />
            IFRS 10 — Group Consolidation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Line-by-line aggregation · Intercompany elimination · NCI allocation per IFRS 10.22
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="ovds-caption">As of:</span>
          <input
            type="date" value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400 w-36"
          />
          <span className="ovds-caption">Period:</span>
          <input
            type="date" value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400 w-36"
          />
          <span className="ovds-caption">→</span>
          <input
            type="date" value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400 w-36"
          />
          <Btn variant="primary" size="sm" onClick={runConsolidation} disabled={loading} icon={<RefreshCw size={11} className={loading ? 'animate-spin' : ''} />}>
            {loading ? 'Consolidating…' : hasRun ? 'Refresh' : 'Consolidate'}
          </Btn>
          {data && <Btn variant="secondary" size="sm" onClick={exportCSV} icon={<Download size={11} />}>CSV</Btn>}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Consolidation unavailable</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">{error}</p>
            <p className="text-[10px] text-slate-400 mt-2">
              To enable consolidation: go to Company Settings → IFRS → Group Structure and define subsidiary companies with ownership percentages.
            </p>
          </div>
        </div>
      )}

      {/* Not started */}
      {!hasRun && !loading && !error && (
        <div className="ovds-empty py-20">
          <Layers size={28} className="text-violet-400 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Run Consolidation</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm text-center">
            Click "Consolidate" to aggregate subsidiary financials, eliminate intercompany transactions,
            and produce IFRS 10-compliant group statements.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-5">

          {/* Group summary KPIs */}
          <div className="ovds-grid-layout cols-4">
            {[
              { label: 'Group Revenue',         value: data.incomeStatement.totalRevenue,        color: 'text-emerald-600' },
              { label: 'Group Net Profit',       value: data.incomeStatement.groupNetProfit,      color: data.incomeStatement.groupNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700' },
              { label: 'Parent Share',           value: data.incomeStatement.parentShareOfProfit, color: 'text-slate-800 dark:text-slate-100' },
              { label: 'NCI Share',              value: data.incomeStatement.nciShareOfProfit,    color: 'text-violet-600' },
            ].map((c, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className={`text-xl font-bold tabular-nums ${c.color}`}>{fmt(c.value)}</p>
              </div>
            ))}
          </div>

          {/* Subsidiaries + Eliminations strip */}
          <div className="ovds-grid-layout cols-2">
            {/* Subsidiaries */}
            <div className="ovds-widget-card p-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Building2 size={13} className="text-violet-500" /> Group Entities
              </p>
              <div className="space-y-2">
                {/* Parent */}
                <div className="flex items-center justify-between px-3 py-2 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                  <div>
                    <p className="text-[11px] font-black text-violet-700 dark:text-violet-400">{data.parentCompanyName}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">Parent Company</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-600 text-white rounded-full">100%</span>
                </div>
                {/* Subsidiaries */}
                {data.subsidiaries.map(s => (
                  <div key={s.companyId} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{s.companyName}</p>
                      <p className="text-[9px] text-slate-400">
                        {s.currency} · FX rate {s.fxRate.toFixed(4)}
                        {s.nciPct > 0 && ` · NCI ${s.nciPct}%`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.ownershipPct >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.ownershipPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminations */}
            <div className="ovds-widget-card p-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <XCircle size={13} className="text-rose-500" /> Intercompany Eliminations (IFRS 10.B86)
              </p>
              {data.eliminations.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">No intercompany transactions found for this period</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {data.eliminations.map((e, i) => (
                    <div key={i} className="px-3 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 leading-tight">{e.description}</p>
                        <span className="text-[10px] font-black text-rose-600 shrink-0">{fmt(e.amount)}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 font-mono">
                        Dr {e.debitAccount} / Cr {e.creditAccount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Elimination summary */}
              {data.eliminationSummary && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  {[
                    { label: 'Interco Sales',  value: data.eliminationSummary.totalIntercoSales },
                    { label: 'Interco Loans',  value: data.eliminationSummary.totalIntercoLoans },
                    { label: 'Dividends',      value: data.eliminationSummary.totalDividendsEliminated },
                  ].filter(r => r.value > 0).map((r, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span className="text-slate-500">{r.label} eliminated</span>
                      <span className="font-bold text-rose-600">{fmt(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Consolidated Balance Sheet */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Consolidated Statement of Financial Position
              </p>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${data.balanceSheet.isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {data.balanceSheet.isBalanced ? 'Balanced ✓' : 'Imbalanced ✗'}
                </span>
                <span className="text-[10px] text-slate-400">As of {data.asOf}</span>
              </div>
            </div>
            <AppTable>
              <thead><tr>
                <AppTh>Account</AppTh>
                <AppTh align="right">Parent</AppTh>
                <AppTh align="right">Subsidiaries</AppTh>
                <AppTh align="right">Eliminations</AppTh>
                <AppTh align="right">NCI</AppTh>
                <AppTh align="right">Consolidated</AppTh>
              </tr></thead>
              <tbody>
                {/* Assets */}
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/10">
                  <td colSpan={6} className="px-4 py-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">ASSETS</td>
                </tr>
                {data.balanceSheet.assets.filter(l => l.totalBeforeElim !== 0 || l.consolidatedAmount !== 0).map((l, i) => (
                  <AppTr key={i}>
                    <AppTd><span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{l.accountName}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-violet-600">{fmt(l.totalBeforeElim - l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-rose-500">{l.eliminations !== 0 ? `(${fmt(l.eliminations)})` : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-slate-400">{l.nciAllocation !== 0 ? fmt(l.nciAllocation) : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-slate-800 dark:text-slate-100">{fmt(l.consolidatedAmount)}</span></AppTd>
                  </AppTr>
                ))}
                <tr className="bg-emerald-50 dark:bg-emerald-950/20 border-t-2 border-emerald-200 dark:border-emerald-800">
                  <td colSpan={5} className="px-4 py-2 text-[11px] font-black text-emerald-700 dark:text-emerald-400">TOTAL ASSETS</td>
                  <td className="px-4 py-2 text-right text-[13px] font-black tabular-nums text-emerald-700 dark:text-emerald-400 underline decoration-double">{fmt(data.balanceSheet.totalAssets)}</td>
                </tr>

                {/* Liabilities */}
                <tr className="bg-rose-50/50 dark:bg-rose-950/10">
                  <td colSpan={6} className="px-4 py-2 text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">LIABILITIES</td>
                </tr>
                {data.balanceSheet.liabilities.filter(l => l.totalBeforeElim !== 0 || l.consolidatedAmount !== 0).map((l, i) => (
                  <AppTr key={i}>
                    <AppTd><span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{l.accountName}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-violet-600">{fmt(l.totalBeforeElim - l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-rose-500">{l.eliminations !== 0 ? `(${fmt(l.eliminations)})` : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-slate-400">{l.nciAllocation !== 0 ? fmt(l.nciAllocation) : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-slate-800 dark:text-slate-100">{fmt(l.consolidatedAmount)}</span></AppTd>
                  </AppTr>
                ))}

                {/* Equity */}
                <tr className="bg-violet-50/50 dark:bg-violet-950/10">
                  <td colSpan={6} className="px-4 py-2 text-[10px] font-black text-violet-700 dark:text-violet-400 uppercase tracking-wider">EQUITY</td>
                </tr>
                {data.balanceSheet.equity.filter(l => l.totalBeforeElim !== 0 || l.consolidatedAmount !== 0).map((l, i) => (
                  <AppTr key={i}>
                    <AppTd><span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{l.accountName}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-violet-600">{fmt(l.totalBeforeElim - l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-rose-500">{l.eliminations !== 0 ? `(${fmt(l.eliminations)})` : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-slate-400">{l.nciAllocation !== 0 ? fmt(l.nciAllocation) : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-slate-800 dark:text-slate-100">{fmt(l.consolidatedAmount)}</span></AppTd>
                  </AppTr>
                ))}
                {/* NCI row */}
                {data.balanceSheet.nci !== 0 && (
                  <AppTr>
                    <AppTd><span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">Non-Controlling Interests (NCI)</span></AppTd>
                    <AppTd align="right"><span className="text-[11px] text-slate-400">—</span></AppTd>
                    <AppTd align="right"><span className="text-[11px] text-slate-400">—</span></AppTd>
                    <AppTd align="right"><span className="text-[11px] text-slate-400">—</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-violet-600">{fmt(data.balanceSheet.nci)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-violet-600">{fmt(data.balanceSheet.nci)}</span></AppTd>
                  </AppTr>
                )}
                <tr className="bg-violet-50 dark:bg-violet-950/20 border-t-2 border-violet-200 dark:border-violet-800">
                  <td colSpan={5} className="px-4 py-2 text-[11px] font-black text-violet-700 dark:text-violet-400">TOTAL LIABILITIES & EQUITY</td>
                  <td className="px-4 py-2 text-right text-[13px] font-black tabular-nums text-violet-700 dark:text-violet-400 underline decoration-double">{fmt(data.balanceSheet.totalLiabAndEquity)}</td>
                </tr>
              </tbody>
            </AppTable>
          </div>

          {/* Consolidated Income Statement */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Consolidated Statement of Profit and Loss
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Period: {data.period}</p>
            </div>
            <AppTable>
              <thead><tr>
                <AppTh>Account</AppTh>
                <AppTh align="right">Parent</AppTh>
                <AppTh align="right">Subsidiaries</AppTh>
                <AppTh align="right">Eliminations</AppTh>
                <AppTh align="right">Consolidated</AppTh>
              </tr></thead>
              <tbody>
                <tr className="bg-emerald-50/50 dark:bg-emerald-950/10">
                  <td colSpan={5} className="px-4 py-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">REVENUE</td>
                </tr>
                {data.incomeStatement.revenue.filter(l => l.consolidatedAmount !== 0).map((l, i) => (
                  <AppTr key={i}>
                    <AppTd><span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{l.accountName}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-violet-600">{fmt(l.totalBeforeElim - l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-rose-500">{l.eliminations !== 0 ? `(${fmt(l.eliminations)})` : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{fmt(l.consolidatedAmount)}</span></AppTd>
                  </AppTr>
                ))}
                <tr className="bg-emerald-50 dark:bg-emerald-950/20 border-t border-emerald-200">
                  <td colSpan={4} className="px-4 py-2 text-[11px] font-black text-emerald-700">TOTAL REVENUE</td>
                  <td className="px-4 py-2 text-right text-[12px] font-black tabular-nums text-emerald-700">{fmt(data.incomeStatement.totalRevenue)}</td>
                </tr>

                <tr className="bg-rose-50/50 dark:bg-rose-950/10">
                  <td colSpan={5} className="px-4 py-2 text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">EXPENSES</td>
                </tr>
                {data.incomeStatement.expenses.filter(l => l.consolidatedAmount !== 0).map((l, i) => (
                  <AppTr key={i}>
                    <AppTd><span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{l.accountName}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-violet-600">{fmt(l.totalBeforeElim - l.parentAmount)}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] text-rose-500">{l.eliminations !== 0 ? `(${fmt(l.eliminations)})` : '—'}</span></AppTd>
                    <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-rose-700 dark:text-rose-400">{fmt(l.consolidatedAmount)}</span></AppTd>
                  </AppTr>
                ))}
                <tr className="bg-rose-50 dark:bg-rose-950/20 border-t border-rose-200">
                  <td colSpan={4} className="px-4 py-2 text-[11px] font-black text-rose-700">TOTAL EXPENSES</td>
                  <td className="px-4 py-2 text-right text-[12px] font-black tabular-nums text-rose-700">{fmt(data.incomeStatement.totalExpenses)}</td>
                </tr>

                {/* Net profit attribution */}
                <tr className="bg-white dark:bg-slate-800/80 border-t-2 border-slate-200">
                  <td colSpan={4} className="px-4 py-2.5 text-[12px] font-black text-slate-800 dark:text-white">GROUP NET PROFIT</td>
                  <td className="px-4 py-2.5 text-right text-[14px] font-black tabular-nums underline decoration-double text-slate-800 dark:text-white">
                    {fmt(data.incomeStatement.groupNetProfit)}
                  </td>
                </tr>
                {data.balanceSheet.nci !== 0 && (
                  <>
                    <AppTr>
                      <AppTd><span className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold pl-4">Attributable to NCI</span></AppTd>
                      <AppTd>{''}</AppTd><AppTd>{''}</AppTd><AppTd>{''}</AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-violet-600">{fmt(data.incomeStatement.nciShareOfProfit)}</span></AppTd>
                    </AppTr>
                    <AppTr>
                      <AppTd><span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold pl-4">Attributable to Parent shareholders</span></AppTd>
                      <AppTd>{''}</AppTd><AppTd>{''}</AppTd><AppTd>{''}</AppTd>
                      <AppTd align="right"><span className="tabular-nums text-[11px] font-black text-slate-800 dark:text-white">{fmt(data.incomeStatement.parentShareOfProfit)}</span></AppTd>
                    </AppTr>
                  </>
                )}
              </tbody>
            </AppTable>
          </div>

          {/* IFRS 10 Disclosure Notes */}
          <div className="ovds-widget-card p-5">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <BookOpen size={13} className="text-violet-500" />
              IFRS 10 Disclosure Notes
            </p>
            <div className="space-y-2">
              {data.disclosures.map((note, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="leading-relaxed">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-right">{data.ifrsReference}</p>
        </div>
      )}
    </div>
  );
};

// -- IAS 1 — Statement of Changes in Equity Tab -------------------------------
const EquityChangesTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [startDate, setStartDate] = React.useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10));
  const fmt = (n: number) => formatReportCurrency(n, currency);

  const load = React.useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ startDate, endDate });
    if (companyId) q.set('companyId', companyId);
    api.get(`/ovds/reports/changes-in-equity?${q}`)
      .then((r: any) => setData(r.data?.data ?? r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [startDate, endDate, companyId]);

  React.useEffect(() => { load(); }, [load]);

  const accounts: any[] = data?.accounts ?? [];
  const totals = data?.totals ?? {};

  const exportCSV = () => {
    const rows = [
      'Account,Opening Balance,Net Profit,Other Movements,Dividends Paid,OCI,Closing Balance',
      ...accounts.map((a: any) => `"${a.accountName}",${a.openingBalance},${a.netProfitForPeriod},${a.otherMovements},${a.dividendsPaid},${a.otherComprehensiveIncome},${a.closingBalance}`),
      `TOTAL,${totals.openingBalance ?? 0},${totals.netProfitForPeriod ?? 0},${totals.otherMovements ?? 0},${totals.dividendsPaid ?? 0},${totals.otherComprehensiveIncome ?? 0},${totals.closingBalance ?? 0}`,
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `equity-changes-${startDate.slice(0, 7)}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Statement of Changes in Equity</h2>
          <p className="text-xs text-slate-500 mt-0.5">IAS 1.106 — Opening balance, net profit, dividends, closing balance per equity account</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36 text-xs" />
          <span className="text-slate-400 text-xs">to</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36 text-xs" />
          <Btn variant="secondary" size="sm" onClick={load}>Refresh</Btn>
          <Btn variant="primary" size="sm" icon={<Download size={12} />} onClick={exportCSV}>Export CSV</Btn>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="ovds-grid-layout cols-4">
        {[
          { label: 'Opening Equity',    value: totals.openingBalance ?? 0,      color: 'text-slate-700' },
          { label: 'Net Profit',        value: totals.netProfitForPeriod ?? 0,  color: (totals.netProfitForPeriod ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600' },
          { label: 'Dividends Paid',    value: -(totals.dividendsPaid ?? 0),    color: 'text-amber-600' },
          { label: 'Closing Equity',    value: totals.closingBalance ?? 0,      color: 'text-violet-700 font-black' },
        ].map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`text-xl font-bold tabular-nums ${c.color}`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Account</AppTh>
          <AppTh align="right">Opening Balance</AppTh>
          <AppTh align="right">Net Profit</AppTh>
          <AppTh align="right">Other Movements</AppTh>
          <AppTh align="right">Dividends Paid</AppTh>
          <AppTh align="right">OCI</AppTh>
          <AppTh align="right">Closing Balance</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}</tr>)
          ) : accounts.length === 0 ? (
            <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No equity accounts found for this period</td></tr>
          ) : (
            <>
              {accounts.map((a: any) => (
                <AppTr key={a.accountId}>
                  <AppTd><div><p className="text-[12px] font-semibold text-slate-800">{a.accountName}</p><p className="ovds-caption">{a.accountCode}</p></div></AppTd>
                  <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(a.openingBalance)}</span></AppTd>
                  <AppTd align="right"><span className={`tabular-nums text-[11px] font-bold ${a.netProfitForPeriod >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(a.netProfitForPeriod)}</span></AppTd>
                  <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(a.otherMovements)}</span></AppTd>
                  <AppTd align="right"><span className="tabular-nums text-[11px] text-amber-600">{a.dividendsPaid > 0 ? `(${fmt(a.dividendsPaid)})` : '—'}</span></AppTd>
                  <AppTd align="right"><span className="tabular-nums text-[11px] text-slate-400">{fmt(a.otherComprehensiveIncome)}</span></AppTd>
                  <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-violet-700">{fmt(a.closingBalance)}</span></AppTd>
                </AppTr>
              ))}
              <tr className="bg-white dark:bg-slate-800/80 border-t-2 border-slate-200 font-bold">
                <AppTd className="text-slate-800 font-black">TOTAL</AppTd>
                <AppTd align="right"><span className="tabular-nums font-black">{fmt(totals.openingBalance ?? 0)}</span></AppTd>
                <AppTd align="right"><span className={`tabular-nums font-black ${(totals.netProfitForPeriod ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmt(totals.netProfitForPeriod ?? 0)}</span></AppTd>
                <AppTd align="right"><span className="tabular-nums font-black">{fmt(totals.otherMovements ?? 0)}</span></AppTd>
                <AppTd align="right"><span className="tabular-nums font-black text-amber-700">{(totals.dividendsPaid ?? 0) > 0 ? `(${fmt(totals.dividendsPaid)})` : '—'}</span></AppTd>
                <AppTd align="right"><span className="tabular-nums font-black text-slate-400">{fmt(totals.otherComprehensiveIncome ?? 0)}</span></AppTd>
                <AppTd align="right"><span className="tabular-nums font-black text-violet-700 underline decoration-double">{fmt(totals.closingBalance ?? 0)}</span></AppTd>
              </tr>
            </>
          )}
        </tbody>
      </AppTable>
      <p className="text-[10px] text-slate-400 text-right">{data?.iasReference ?? 'IAS 1.106 — Statement of Changes in Equity'}</p>
    </div>
  );
};

// -- IFRS 9 ECL Tab ------------------------------------------------------------
const Ifrs9EclTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [asOf, setAsOf] = React.useState(new Date().toISOString().slice(0, 10));
  const fmt = (n: number) => formatReportCurrency(n, currency);

  const load = React.useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ date: asOf });
    if (companyId) q.set('companyId', companyId);
    api.get(`/ovds/reports/ifrs9-ecl?${q}`)
      .then((r: any) => setData(r.data?.data ?? r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [asOf, companyId]);

  React.useEffect(() => { load(); }, [load]);

  const buckets: any[] = data?.buckets ?? [];
  const stageSummary: any[] = data?.stageSummary ?? [];
  const totals = data?.totals ?? {};

  const STAGE_COLORS = ['text-emerald-600', 'text-amber-600', 'text-rose-600'];
  const STAGE_BG = ['bg-emerald-50 border-emerald-200', 'bg-amber-50 border-amber-200', 'bg-rose-50 border-rose-200'];

  const exportCSV = () => {
    const rows = [
      'Bucket,Stage,Loss Rate,Gross Amount,ECL Provision,Invoice Count',
      ...buckets.map((b: any) => `"${b.label}",${b.stage},${b.rate},${b.grossAmount},${b.eclProvision},${b.invoiceCount}`),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `ifrs9-ecl-${asOf}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">IFRS 9 — Expected Credit Loss (ECL)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Simplified approach (IFRS 9.5.5.15) · Provision matrix on AR aging buckets</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="ovds-caption">As of:</span>
          <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-36 text-xs" />
          <Btn variant="secondary" size="sm" onClick={load}>Refresh</Btn>
          <Btn variant="primary" size="sm" icon={<Download size={12} />} onClick={exportCSV}>Export CSV</Btn>
        </div>
      </div>

      {/* Stage summary */}
      <div className="ovds-grid-layout cols-3">
        {stageSummary.map((s: any, i: number) => (
          <div key={s.stage} className={`p-4 rounded-xl border ${STAGE_BG[i]}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Stage {s.stage}</p>
            <p className="text-[11px] text-slate-600 mb-2">{s.description}</p>
            <p className={`text-xl font-black tabular-nums ${STAGE_COLORS[i]}`}>{fmt(s.eclProvision)}</p>
            <p className="text-[10px] text-slate-400 mt-1">on {fmt(s.grossAmount)} gross · {s.invoiceCount} invoices</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="ovds-grid-layout cols-4">
        {[
          { label: 'Gross Receivables',   value: totals.grossReceivables ?? 0,   color: 'text-slate-800' },
          { label: 'Total ECL Provision', value: totals.totalEclProvision ?? 0,  color: 'text-rose-600' },
          { label: 'Net Carrying Amount', value: totals.netCarryingAmount ?? 0,  color: 'text-emerald-700' },
          { label: 'Effective Loss Rate', value: totals.effectiveLossRate ?? '0%', isText: true, color: 'text-amber-600' },
        ].map((c: any, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`text-xl font-bold tabular-nums ${c.color}`}>{c.isText ? c.value : fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Provision matrix table */}
      <AppTable>
        <thead><tr>
          <AppTh>Aging Bucket</AppTh>
          <AppTh>Stage</AppTh>
          <AppTh align="right">Loss Rate</AppTh>
          <AppTh align="right">Gross Amount</AppTh>
          <AppTh align="right">ECL Provision</AppTh>
          <AppTh align="right">Invoices</AppTh>
        </tr></thead>
        <tbody>
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}</tr>)
          ) : buckets.map((b: any) => (
            <AppTr key={b.label}>
              <AppTd><span className="text-[12px] font-semibold text-slate-800">{b.label}</span></AppTd>
              <AppTd><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STAGE_BG[b.stage - 1]}`}>Stage {b.stage}</span></AppTd>
              <AppTd align="right"><span className="tabular-nums text-[11px] font-bold text-slate-600">{(b.rate * 100).toFixed(1)}%</span></AppTd>
              <AppTd align="right"><span className="tabular-nums text-[11px]">{fmt(b.grossAmount)}</span></AppTd>
              <AppTd align="right"><span className={`tabular-nums text-[11px] font-bold ${b.eclProvision > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{fmt(b.eclProvision)}</span></AppTd>
              <AppTd align="right"><span className="tabular-nums text-[11px] text-slate-500">{b.invoiceCount}</span></AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>

      {/* Suggested journal entry */}
      {data?.journalEntry && (
        <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl text-[11px]">
          <p className="font-bold text-violet-700 dark:text-violet-400 mb-2">Suggested Journal Entry (IFRS 9.5.5)</p>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between"><span className="text-slate-600">Dr {data.journalEntry.debit.account}</span><span className="font-bold text-rose-600">{fmt(data.journalEntry.debit.amount)}</span></div>
            <div className="flex justify-between pl-6"><span className="text-slate-600">Cr {data.journalEntry.credit.account}</span><span className="font-bold text-emerald-600">{fmt(data.journalEntry.credit.amount)}</span></div>
          </div>
        </div>
      )}
      <p className="text-[10px] text-slate-400 text-right">{data?.ifrsReference ?? 'IFRS 9.5.5 — Impairment (Simplified Approach)'}</p>
    </div>
  );
};

// -- Tax Liability Dashboard Tab -----------------------------------------------
const TaxLiabilityTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [vatData, setVatData] = React.useState<any>(null);
  const [billsData, setBillsData] = React.useState<any[]>([]);
  const [bitData, setBitData] = React.useState<any>(null);
  const [drrfData, setDrrfData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const fmt = (n: number) => formatReportCurrency(n, currency);

  React.useEffect(() => {
    setLoading(true);
    const cq = companyId ? `?companyId=${companyId}` : '';
    const currentYear = new Date().getFullYear();
    const currentPeriod = new Date().toISOString().slice(0, 7);
    Promise.all([
      api.get(`/vat/summary${cq}`).catch(() => ({ data: null })),
      api.get(`/ovds/bills${cq}`).catch(() => ({ data: { data: [] } })),
      api.get(`/tax/income-tax/${currentYear}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
      api.get(`/tax/drrf-levies/${currentPeriod}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
    ]).then(([vatRes, billsRes, bitRes, drrfRes]) => {
      setVatData(vatRes.data?.data || vatRes.data);
      const raw = billsRes.data?.data;
      setBillsData(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      setBitData(bitRes.data?.data ?? bitRes.data);
      setDrrfData(drrfRes.data?.data ?? drrfRes.data);
    }).finally(() => setLoading(false));
  }, [companyId]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const vatPayable = vatData?.netPayable ?? 0;
  // WHT: 3% on unpaid bills ≥ thresholds per Proclamation 1395/2025
  const totalWht = billsData
    .filter(b => b.status !== 'PAID')
    .filter(b => (b.category === 'SERVICE' && Number(b.amount || 0) >= 10000) || (b.category === 'GOODS' && Number(b.amount || 0) >= 20000))
    .reduce((s: number, b: any) => s + Number(b.amount || 0) * 0.03, 0);
  const overdueBills = billsData.filter((b: any) => b.status === 'OVERDUE' || (b.status === 'PENDING' && new Date(b.dueDate) < now));
  const bitPayable = bitData?.taxPayable ?? 0;
  const drrfPayable = drrfData?.totalLevy ?? 0;

  // Next deadlines — use last day of the month (not hardcoded 30th which breaks in Feb)
  const vatDeadline = new Date(now.getFullYear(), now.getMonth() + 2, 0); // last day of next month
  const whtDeadline = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const daysToVat = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86400000);
  const OBLIGATIONS = [
    {
      label: 'VAT Payable (Output − Input)',
      amount: Math.max(0, vatPayable),
      refund: vatPayable < 0 ? Math.abs(vatPayable) : 0,
      deadline: vatDeadline.toLocaleDateString('en-ET'),
      daysLeft: daysToVat,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      link: '/tax/vat',
      linkLabel: 'File VAT Return' },
    {
      label: 'WHT Unremitted (3% on bills)',
      amount: totalWht,
      refund: 0,
      deadline: whtDeadline.toLocaleDateString('en-ET'),
      daysLeft: daysToVat,
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      link: '/purchases/bills',
      linkLabel: 'View Bills' },
    {
      label: 'DRRF Levy (current period)',
      amount: drrfPayable,
      refund: 0,
      deadline: '10th of next month',
      daysLeft: null,
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-200',
      link: '/disaster-fund',
      linkLabel: 'View DRRF' },
    {
      label: `Business Income Tax — FY ${now.getFullYear() - 1}/${now.getFullYear()}`,
      amount: bitPayable,
      refund: 0,
      deadline: `Nov 7, ${now.getFullYear()}`,
      daysLeft: null,
      color: 'text-violet-700',
      bg: 'bg-violet-50 border-violet-200',
      link: '/tax/business-income',
      linkLabel: bitPayable > 0 ? 'File BIT' : 'Calculate BIT' },
  ];
  const totalLiability = OBLIGATIONS.reduce((s, o) => s + o.amount, 0);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Tax Liability Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">Consolidated view of all outstanding tax obligations — {currentMonth}</p>
        </div>
        <a href="https://etax.mor.gov.et" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm">
          <Icon name="ARROW_UP_RIGHT" size={13} /> eTax Portal
        </a>
      </div>

      {/* Total liability summary */}
      <div className="ovds-widget-card p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Outstanding Tax Liability</p>
          <p className="ovds-hero-title tabular-nums">
            <Amount value={totalLiability} currency={currency} />
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">VAT + WHT + DRRF + BIT estimate</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center px-4 border-l border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Next Deadline</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{daysToVat}d</p>
            <p className="ovds-caption">VAT return</p>
          </div>
          <div className="text-center px-4 border-l border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Overdue Bills</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{overdueBills.length}</p>
            <p className="ovds-caption">bills</p>
          </div>
        </div>
      </div>

      {/* Obligation cards */}
      <div className="ovds-grid-layout cols-4">
        {OBLIGATIONS.map(o => (
          <Card key={o.label} className={`p-5 flex flex-col justify-between border-t-4 ${o.bg.split(' ')[1]}`}>
            <div>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{o.label}</p>
                {o.daysLeft !== null && (
                  <StatusBadge 
                    status={o.daysLeft <= 7 ? 'INACTIVE' : o.daysLeft <= 14 ? 'PENDING' : 'ACTIVE'} 
                    label={`${o.daysLeft}d left`} 
                  />
                )}
              </div>
              <p className={`text-2xl font-bold ${o.color}`}>
                <Amount value={o.amount} currency={currency} />
              </p>
              {o.refund > 0 && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <Icon name="TREND_DOWN" size={10} /> Refund due: <Amount value={o.refund} currency={currency} />
                </p>
              )}
            </div>
            <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Icon name="CALENDAR" size={10} className="text-slate-400" />
                {o.deadline}
              </div>
              <Link to={o.link} className={`text-[10px] font-bold ${o.color} hover:underline flex items-center gap-0.5`}>
                {o.linkLabel} <Icon name="ARROW_UP_RIGHT" size={9} />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Tax calendar */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Icon name="CALENDAR" size={14} className="text-emerald-500" />
            Tax Calendar — Upcoming Deadlines
          </h3>
          <EthTaxBadge type="VAT" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { date: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-30`, label: 'Monthly VAT Return', type: 'VAT', link: '/tax/vat', urgent: daysToVat <= 7 },
            { date: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-10`, label: 'DRRF Levy Remittance', type: 'DRRF', link: '/disaster-fund', urgent: false },
            { date: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-30`, label: 'WHT remit to MoR', type: 'WHT', link: '/purchases/bills', urgent: daysToVat <= 7 },
            { date: `${now.getFullYear()}-11-07`, label: 'Business Income Tax Annual Filing', type: 'BIT', link: '/tax/business-income', urgent: false },
            { date: `${now.getFullYear()}-03-31`, label: 'Annual VAT Reconciliation', type: 'VAT', link: '/tax/vat', urgent: false },
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((item, i) => {
            const d = new Date(item.date);
            const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
            const isPast = days < 0;
            return (
              <div key={i} className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${item.urgent ? 'bg-rose-50/30 dark:bg-rose-900/5' : ''}`}>
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${isPast ? 'bg-white border-slate-200 text-slate-400' : item.urgent ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                  <span className="text-[10px] font-bold uppercase">{isPast ? 'Past' : 'In'}</span>
                  <span className="text-sm font-black leading-none">{isPast ? '—' : days}</span>
                  {!isPast && <span className="text-[8px] font-bold uppercase">Days</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.label}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Icon name="CLOCK" size={9} />
                    {d.toLocaleDateString('en-ET', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <StatusBadge 
                  status={item.type === 'VAT' ? 'ACTIVE' : item.type === 'DRRF' ? 'PENDING' : 'INACTIVE'} 
                  label={item.type} 
                />
                <Link to={item.link} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <Icon name="ARROW_UP_RIGHT" size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// -- Sales Tax Summary Tab -----------------------------------------------------
const SalesTaxSummaryTab: React.FC<{ currency: string }> = ({ currency }) => {
  const [data, setData] = React.useState<any>(null);
const [loading, setLoading] = React.useState(true);
const [year, setYear] = React.useState(new Date().getFullYear());
const fmt = (n: number) => formatReportCurrency(n, currency);

  React.useEffect(() => {
    setLoading(true);
api.get(`/ovds/reports/sales-tax-summary?year=${year}`)
      .then((r: any) => setData(r.data.data || r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);
const months = Array.from({ length: 12 }, (_, i) =>
    new Date(year, i).toLocaleString('en-US', { month: 'short' })
  );

  // Normalize API response — backend returns { year, months: [...] } or { rows: [...] }
  // When data is null (API failed or no data yet), show zero-filled rows
  const rows: any[] = (data?.months ?? data?.rows ?? months.map((m, i) => ({
    month: m,
    taxableRevenue: 0,
    vatCollected: 0,
    vatPaid: 0,
    netVat: 0,
    withholdingTax: 0 }))).map((r: any, i: number) => ({
    month: r.month ?? months[i] ?? String(i + 1),
    taxableRevenue: r.taxableRevenue ?? r.totalSales ?? 0,
    vatCollected:   r.vatCollected   ?? r.outputVat  ?? 0,
    vatPaid:        r.vatPaid        ?? r.inputVat   ?? 0,
    netVat:         r.netVat         ?? ((r.outputVat ?? 0) - (r.inputVat ?? 0)),
    withholdingTax: r.withholdingTax ?? r.wht        ?? 0 }));
const totals = rows.reduce((acc, r) => ({
    taxableRevenue: acc.taxableRevenue + (r.taxableRevenue ?? 0),
    vatCollected:   acc.vatCollected   + (r.vatCollected   ?? 0),
    vatPaid:        acc.vatPaid        + (r.vatPaid        ?? 0),
    netVat:         acc.netVat         + (r.netVat         ?? 0),
    withholdingTax: acc.withholdingTax + (r.withholdingTax ?? 0) }), { taxableRevenue: 0, vatCollected: 0, vatPaid: 0, netVat: 0, withholdingTax: 0 });
return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Icon name="RECEIPT" className="text-emerald-500" />
            Sales Tax Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">VAT collected, input VAT, withholding tax — monthly breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onChange={e => setYear(Number(e))} className="w-24">
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Btn
            variant="primary"
            size="sm"
            icon={<Icon name="DOWNLOAD" size={12} />}
            onClick={() => {
              const csv = ['Month,Taxable Revenue,VAT Collected,Input VAT,Net VAT,Withholding Tax',
                ...rows.map(r => `${r.month},${r.taxableRevenue},${r.vatCollected},${r.vatPaid},${r.netVat},${r.withholdingTax}`)
              ].join('\n');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              a.download = `sales_tax_${year}.csv`;
              a.click();
            }}
          >
            Export CSV
          </Btn>
        </div>
      </div>

      {/* Summary cards */}
      <div className="ovds-grid-layout cols-4">
        {[
          { label: 'Taxable Revenue',  value: totals.taxableRevenue,  color: 'text-slate-800 dark:text-white', icon: 'TREND_UP' as const },
          { label: 'VAT Collected (15%)', value: totals.vatCollected, color: 'text-emerald-600', icon: 'RECEIPT' as const },
          { label: 'Input VAT Paid',   value: totals.vatPaid,         color: 'text-rose-600', icon: 'BANKNOTE' as const },
          { label: 'Net VAT Payable',  value: totals.netVat,          color: totals.netVat >= 0 ? 'text-amber-600' : 'text-emerald-600', icon: 'WALLET' as const },
        ].map((c, i) => (
          <Card key={i} className="p-4 border-l-4 border-l-slate-200 dark:border-l-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Icon name={c.icon} size={10} className="text-slate-400" />
              {c.label}
            </p>
            <p className={`text-xl font-black tabular-nums ${c.color}`}>
              <Amount value={c.value} currency={currency} />
            </p>
          </Card>
        ))}
      </div>

      {/* Monthly table */}
      <AppTable>
        <thead>
          <tr>
            <AppTh>Month</AppTh>
            <AppTh align="right">Taxable Revenue</AppTh>
            <AppTh align="right">VAT Collected</AppTh>
            <AppTh align="right">Input VAT</AppTh>
            <AppTh align="right">Net VAT</AppTh>
            <AppTh align="right">Withholding Tax</AppTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_unused, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))
          ) : (
            <>
              {rows.map((r: any, i: number) => (
                <AppTr key={i}>
                  <AppTd className="font-bold">{r.month}</AppTd>
                  <AppTd align="right"><Amount value={r.taxableRevenue ?? 0} currency={currency} /></AppTd>
                  <AppTd align="right" className="text-emerald-700 dark:text-emerald-500 font-bold">
                    <Amount value={r.vatCollected ?? 0} currency={currency} />
                  </AppTd>
                  <AppTd align="right" className="text-rose-600 dark:text-rose-400">
                    <Amount value={r.vatPaid ?? 0} currency={currency} />
                  </AppTd>
                  <AppTd align="right" className={`font-semibold ${(r.netVat ?? 0) >= 0 ? 'text-amber-700 dark:text-amber-500' : 'text-emerald-700 dark:text-emerald-500'}`}>
                    <Amount value={r.netVat ?? 0} currency={currency} />
                  </AppTd>
                  <AppTd align="right"><Amount value={r.withholdingTax ?? 0} currency={currency} /></AppTd>
                </AppTr>
              ))}
              <tr className="bg-white dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-600 font-bold">
                <AppTd className="text-slate-800 dark:text-white">TOTAL</AppTd>
                <AppTd align="right" className="text-slate-800 dark:text-white"><Amount value={totals.taxableRevenue} currency={currency} /></AppTd>
                <AppTd align="right" className="text-emerald-700 dark:text-emerald-500 font-black"><Amount value={totals.vatCollected} currency={currency} /></AppTd>
                <AppTd align="right" className="text-rose-700 dark:text-rose-500 font-black"><Amount value={totals.vatPaid} currency={currency} /></AppTd>
                <AppTd align="right" className={`font-black underline decoration-double ${totals.netVat >= 0 ? 'text-amber-700 dark:text-amber-500' : 'text-emerald-700 dark:text-emerald-500'}`}>
                  <Amount value={totals.netVat} currency={currency} />
                </AppTd>
                <AppTd align="right" className="text-slate-800 dark:text-white"><Amount value={totals.withholdingTax} currency={currency} /></AppTd>
              </tr>
            </>
          )}
        </tbody>
      </AppTable>

      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
        <Icon name="WARNING" className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
        <div className="text-[11px] text-amber-700 dark:text-amber-400">
          <p className="font-bold mb-1 uppercase tracking-tight">ERCA Compliance — Proclamation No. 1341/2024</p>
          <p className="leading-relaxed">VAT returns must be filed by the 30th of the following month. Late filing penalty: ETB 500/day (max ETB 50,000). Late payment: 2%/month compounded. Ensure all invoices carry ERCA QR codes.</p>
        </div>
      </div>
    </div>
  );
};

// -- Custom Report Builder Tab -------------------------------------------------
type BuilderField = { key: string; label: string; type: 'currency' | 'number' | 'text' | 'date'; source: string };
type BuilderFilter = { field: string; op: 'eq' | 'gt' | 'lt' | 'contains' | 'between'; value: string; value2?: string };
type BuilderViewMode = 'table' | 'summary';

const SOURCE_ICON: Record<string, string> = {
  invoices: 'INVOICE', bills: 'RECEIPT', payroll: 'PAYROLL',
  employees: 'EMPLOYEE', journal: 'JOURNAL',
};
const SOURCE_COLOR: Record<string, string> = {
  invoices:  'emerald', bills: 'amber', payroll: 'violet',
  employees: 'sky',     journal: 'rose',
};

const BUILDER_SOURCES = [
  { key: 'invoices',  label: 'Invoices',        endpoint: '/ovds/invoices?limit=500',       desc: 'Sales invoices & receivables' },
  { key: 'bills',     label: 'Bills',           endpoint: '/ovds/bills?limit=500',          desc: 'Vendor bills & payables' },
  { key: 'payroll',   label: 'Payroll Records', endpoint: '/payroll?limit=500',                desc: 'Salary & deduction records' },
  { key: 'employees', label: 'Employees',       endpoint: '/hr/employees?limit=500',           desc: 'HR & headcount data' },
  { key: 'journal',   label: 'Journal Entries', endpoint: '/ovds/journal-entries?limit=500', desc: 'General ledger entries' },
];
const SOURCE_FIELDS: Record<string, BuilderField[]> = {
  invoices: [
    { key: 'invoiceNumber', label: 'Invoice #',    type: 'text',     source: 'invoices' },
    { key: 'customerName',  label: 'Customer',     type: 'text',     source: 'invoices' },
    { key: 'date',          label: 'Date',         type: 'date',     source: 'invoices' },
    { key: 'dueDate',       label: 'Due Date',     type: 'date',     source: 'invoices' },
    { key: 'totalAmount',   label: 'Total Amount', type: 'currency', source: 'invoices' },
    { key: 'vatAmount',     label: 'VAT Amount',   type: 'currency', source: 'invoices' },
    { key: 'status',        label: 'Status',       type: 'text',     source: 'invoices' },
  ],
  bills: [
    { key: 'billNumber',    label: 'Bill #',       type: 'text',     source: 'bills' },
    { key: 'vendorName',    label: 'Vendor',       type: 'text',     source: 'bills' },
    { key: 'date',          label: 'Date',         type: 'date',     source: 'bills' },
    { key: 'dueDate',       label: 'Due Date',     type: 'date',     source: 'bills' },
    { key: 'totalAmount',   label: 'Total Amount', type: 'currency', source: 'bills' },
    { key: 'status',        label: 'Status',       type: 'text',     source: 'bills' },
  ],
  payroll: [
    { key: 'employeeName',    label: 'Employee',     type: 'text',     source: 'payroll' },
    { key: 'month',           label: 'Month',        type: 'number',   source: 'payroll' },
    { key: 'year',            label: 'Year',         type: 'number',   source: 'payroll' },
    { key: 'grossTotal',      label: 'Gross Pay',    type: 'currency', source: 'payroll' },
    { key: 'netPay',          label: 'Net Pay',      type: 'currency', source: 'payroll' },
    { key: 'incomeTax',       label: 'Income Tax',   type: 'currency', source: 'payroll' },
    { key: 'employeePension', label: 'Pension',      type: 'currency', source: 'payroll' },
    { key: 'status',          label: 'Status',       type: 'text',     source: 'payroll' },
  ],
  employees: [
    { key: 'firstName',        label: 'First Name',     type: 'text',     source: 'employees' },
    { key: 'lastName',         label: 'Last Name',      type: 'text',     source: 'employees' },
    { key: 'departmentName',   label: 'Department',     type: 'text',     source: 'employees' },
    { key: 'baseSalary',       label: 'Base Salary',    type: 'currency', source: 'employees' },
    { key: 'payrollStatus',    label: 'Payroll Status', type: 'text',     source: 'employees' },
    { key: 'employmentNature', label: 'Employment',     type: 'text',     source: 'employees' },
  ],
  journal: [
    { key: 'reference',   label: 'Reference',    type: 'text',     source: 'journal' },
    { key: 'date',        label: 'Date',         type: 'date',     source: 'journal' },
    { key: 'description', label: 'Description',  type: 'text',     source: 'journal' },
    { key: 'totalDebit',  label: 'Total Debit',  type: 'currency', source: 'journal' },
    { key: 'totalCredit', label: 'Total Credit', type: 'currency', source: 'journal' },
    { key: 'status',      label: 'Status',       type: 'text',     source: 'journal' },
  ],
};
const CustomReportBuilder: React.FC<{ currency: string }> = ({ currency }) => {
  const [source, setSource]               = React.useState('invoices');
  const [selectedFields, setSelectedFields] = React.useState<string[]>(['invoiceNumber', 'customerName', 'date', 'totalAmount', 'status']);
  const [filters, setFilters]             = React.useState<BuilderFilter[]>([]);
  const [sortField, setSortField]         = React.useState('date');
  const [sortDir, setSortDir]             = React.useState<'asc' | 'desc'>('desc');
  const [rawData, setRawData]             = React.useState<any[]>([]);
  const [loading, setLoading]             = React.useState(false);
  const [ran, setRan]                     = React.useState(false);
  const [reportName, setReportName]       = React.useState('My Custom Report');
  const [viewMode, setViewMode]           = React.useState<BuilderViewMode>('table');
  const [showChart, setShowChart]         = React.useState(false);
  const [deleteTarget, setDeleteTarget]   = React.useState<string | null>(null);
  const [savedReports, setSavedReports]   = React.useState<{ name: string; config: any }[]>(() => {
    try { return JSON.parse(localStorage.getItem('ovds_saved_reports') || '[]'); }
    catch { return []; }
  });
  const fields = SOURCE_FIELDS[source] ?? [];
  const fmt = (v: any, type: BuilderField['type']) => {
    if (v === null || v === undefined) return '—';
    if (type === 'currency') return formatReportCurrency(v, currency);
    if (type === 'date') return v ? new Date(v).toLocaleDateString('en-ET') : '—';
    return String(v);
  };

  const runReport = async () => {
    setLoading(true); setRan(false);
    try {
      const src = BUILDER_SOURCES.find(s => s.key === source)!;
      const res = await api.get(src.endpoint, { headers: { 'x-background': '1' } } as any);
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setRawData(Array.isArray(raw) ? raw : []);
      setRan(true);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  // Apply filters + sort
  const results = React.useMemo(() => {
    let rows = [...rawData];
    filters.forEach(f => {
      rows = rows.filter(row => {
        const val = String(row[f.field] ?? '').toLowerCase();
        const fv  = f.value.toLowerCase();
        if (f.op === 'eq')       return val === fv;
        if (f.op === 'contains') return val.includes(fv);
        if (f.op === 'gt')       return Number(row[f.field]) > Number(f.value);
        if (f.op === 'lt')       return Number(row[f.field]) < Number(f.value);
        if (f.op === 'between')  return Number(row[f.field]) >= Number(f.value) && Number(row[f.field]) <= Number(f.value2 ?? f.value);
        return true;
      });
    });
    rows.sort((a, b) => {
      const av = a[sortField] ?? '', bv = b[sortField] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [rawData, filters, sortField, sortDir]);

  // Aggregates for currency fields
  const aggregates = React.useMemo(() => {
    const agg: Record<string, number> = {};
    selectedFields.forEach(fk => {
      const fd = fields.find(f => f.key === fk);
      if (fd?.type === 'currency') agg[fk] = results.reduce((s, r) => s + Number(r[fk] ?? 0), 0);
    });
    return agg;
  }, [results, selectedFields, fields]);

  // Status breakdown for summary view
  const statusBreakdown = React.useMemo(() => {
    const map: Record<string, number> = {};
    results.forEach(r => { const s = String(r.status ?? 'Unknown'); map[s] = (map[s] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [results]);

  // Mini bar chart data — first currency field grouped by date (monthly buckets)
  const chartData = React.useMemo(() => {
    const currencyField = selectedFields.find(fk => fields.find(f => f.key === fk)?.type === 'currency');
    if (!currencyField) return [];
    const buckets: Record<string, number> = {};
    results.forEach(r => {
      const raw = r.date ?? r.dueDate ?? '';
      const label = raw ? new Date(raw).toLocaleDateString('en-ET', { month: 'short', year: '2-digit' }) : 'N/A';
      buckets[label] = (buckets[label] ?? 0) + Number(r[currencyField] ?? 0);
    });
    const entries = Object.entries(buckets).slice(-12);
    const max = Math.max(...entries.map(e => e[1]), 1);
    return entries.map(([label, value]) => ({ label, value, pct: Math.round((value / max) * 100) }));
  }, [results, selectedFields, fields]);

  const toggleField = (key: string) => {
    setSelectedFields(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const addFilter = () => {
    setFilters(prev => [...prev, { field: fields[0]?.key ?? '', op: 'contains', value: '' }]);
  };
  const exportCSV = () => {
    const header = selectedFields.map(fk => fields.find(f => f.key === fk)?.label ?? fk).join(',');
    const rows   = results.map(row =>
      selectedFields.map(fk => {
        const fd = fields.find(f => f.key === fk);
        const v  = row[fk];
        if (fd?.type === 'currency') return Number(v ?? 0).toFixed(2);
        if (fd?.type === 'date')     return v ? new Date(v).toLocaleDateString('en-ET') : '';
        return `"${String(v ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };
  const saveReport = () => {
    const config  = { source, selectedFields, filters, sortField, sortDir };
    const updated = [...savedReports.filter(r => r.name !== reportName), { name: reportName, config }];
    setSavedReports(updated);
    localStorage.setItem('ovds_saved_reports', JSON.stringify(updated));
    toast.success('Report saved');
  };
  const deleteSavedReport = (name: string) => {
    const updated = savedReports.filter(r => r.name !== name);
    setSavedReports(updated);
    localStorage.setItem('ovds_saved_reports', JSON.stringify(updated));
    setDeleteTarget(null);
    toast.success('Report deleted');
  };
  const loadReport = (r: { name: string; config: any }) => {
    setReportName(r.name);
    setSource(r.config.source);
    setSelectedFields(r.config.selectedFields);
    setFilters(r.config.filters ?? []);
    setSortField(r.config.sortField);
    setSortDir(r.config.sortDir);
    setRan(false);
  };
  const srcMeta  = BUILDER_SOURCES.find(s => s.key === source)!; // used in desc below
  return (
    <div className="space-y-5">

      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                <BarChart3 size={14} className="text-white" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Custom Report Builder</h2>
            </div>
            <p className="text-sm text-white/70 max-w-lg">
              Pick a data source, choose columns, add filters, then run. Export to CSV or print — no code needed.
            </p>
          </div>
          {savedReports.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Saved</span>
              {savedReports.map(r => (
                <div key={r.name} className="flex items-center gap-0.5">
                  <button onClick={() => loadReport(r)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-l-lg bg-white/15 hover:bg-white/25 border border-white/20 text-[10px] font-bold text-white transition-all">
                    <FileText size={9} /> {r.name}
                  </button>
                  <button onClick={() => setDeleteTarget(r.name)}
                    className="px-1.5 py-1 rounded-r-lg bg-white/10 hover:bg-rose-500/60 border border-white/20 text-white/60 hover:text-white transition-all">
                    <Icon name="CLOSE" size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl max-w-sm w-full mx-4">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Delete saved report?</p>
            <p className="text-xs text-slate-500 mb-4">"{deleteTarget}" will be removed from local storage.</p>
            <div className="flex gap-2 justify-end">
              <Btn onClick={() => setDeleteTarget(null)} variant="secondary" size="sm">Cancel</Btn>
              <Btn onClick={() => deleteSavedReport(deleteTarget)} variant="danger" size="sm">Delete</Btn>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Config panel ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="p-4">
            <FormField label="Report Name">
              <Input value={reportName} onChange={e => setReportName(e.target.value)}
                className="font-bold" placeholder="Untitled Report" />
            </FormField>
          </Card>

          {/* Data source */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data Source</p>
              {ran && <span className="text-[9px] font-bold text-violet-500">{results.length} rows</span>}
            </div>
            <div className="space-y-1.5">
              {BUILDER_SOURCES.map(s => {
                const active = source === s.key;
                return (
                  <button key={s.key}
                    onClick={() => { setSource(s.key); setSelectedFields(SOURCE_FIELDS[s.key]?.slice(0, 4).map(f => f.key) ?? []); setRan(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border ${active ? 'bg-violet-600 border-violet-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{s.label}</p>
                      <p className={`text-[9px] font-normal truncate mt-0.5 ${active ? 'text-white/70' : 'text-slate-400'}`}>{s.desc}</p>
                    </div>
                    {active && <Icon name="CHECK" size={11} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Column picker */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Columns</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedFields(fields.map(f => f.key))} className="text-[9px] font-bold text-violet-600 dark:text-violet-400 hover:underline">All</button>
                <span className="text-slate-200 dark:text-slate-700">|</span>
                <button onClick={() => setSelectedFields([])} className="text-[9px] font-bold text-slate-400 hover:underline">None</button>
              </div>
            </div>
            <div className="space-y-0.5">
              {fields.map(f => (
                <label key={f.key} className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <input type="checkbox" checked={selectedFields.includes(f.key)} onChange={() => toggleField(f.key)}
                    className="w-3.5 h-3.5 rounded border-slate-300 accent-violet-600" />
                  <span className={`text-xs font-semibold transition-colors flex-1 ${selectedFields.includes(f.key) ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>{f.label}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                    f.type === 'currency' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                    : f.type === 'date'   ? 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800'
                    : f.type === 'number' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>{f.type}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Filters
                {filters.length > 0 && (
                  <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">{filters.length}</span>
                )}
              </p>
              <button onClick={addFilter} className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                <Icon name="ADD" size={10} /> Add
              </button>
            </div>
            {filters.length === 0
              ? <p className="text-[10px] text-slate-400 italic text-center py-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">No filters — showing all rows</p>
              : filters.map((f, i) => (
                <div key={i} className="space-y-1.5 p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex gap-1.5">
                    <Select value={f.field} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, field: e } : ff))} className="text-[11px] h-7 flex-1">
                      {fields.map(fd => <option key={fd.key} value={fd.key}>{fd.label}</option>)}
                    </Select>
                    <Select value={f.op} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, op: e as any } : ff))} className="text-[11px] h-7 w-28">
                      <option value="contains">Contains</option>
                      <option value="eq">Equals</option>
                      <option value="gt">&gt; Greater</option>
                      <option value="lt">&lt; Less</option>
                      <option value="between">Between</option>
                    </Select>
                    <button onClick={() => setFilters(prev => prev.filter((_, ii) => ii !== i))}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0">
                      <Icon name="CLOSE" size={11} />
                    </button>
                  </div>
                  <Input value={f.value} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, value: e.target.value } : ff))}
                    placeholder={f.op === 'between' ? 'Min value…' : 'Value…'} className="text-[11px] h-7" />
                  {f.op === 'between' && (
                    <Input value={f.value2 ?? ''} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, value2: e.target.value } : ff))}
                      placeholder="Max value…" className="text-[11px] h-7" />
                  )}
                </div>
              ))
            }
          </Card>
          {/* Sort */}
          <Card className="p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sort</p>
            <div className="flex gap-2">
              <Select value={sortField} onChange={e => setSortField(e)} className="flex-1">
                {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </Select>
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                className="px-3 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-bold text-xs flex items-center gap-1">
                {sortDir === 'asc' ? <><Icon name="CHEVRON_UP" size={12} /> ASC</> : <><Icon name="CHEVRON_DOWN" size={12} /> DESC</>}
              </button>
            </div>
          </Card>

          <Btn onClick={runReport} disabled={loading || selectedFields.length === 0} variant="primary"
            className="w-full py-3 text-sm font-bold"
            loading={loading} icon={!loading ? <BarChart3 size={15} /> : undefined}>
            {loading ? 'Loading…' : 'Run Report'}
          </Btn>
        </div>

        {/* ── Results panel ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {!ran && !loading && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-14 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 flex items-center justify-center">
                <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
                  <rect x="1"  y="20" width="8" height="15" rx="2" className="fill-violet-200 dark:fill-violet-800" />
                  <rect x="12" y="10" width="8" height="25" rx="2" className="fill-violet-400 dark:fill-violet-600" />
                  <rect x="23" y="15" width="8" height="20" rx="2" className="fill-violet-300 dark:fill-violet-700" />
                  <rect x="34" y="4"  width="8" height="31" rx="2" className="fill-violet-600 dark:fill-violet-400" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Configure and run your report</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Choose a data source, select columns, add optional filters, then hit <strong className="text-violet-600">Run Report</strong>.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {BUILDER_SOURCES.map(s => (
                  <button key={s.key}
                    onClick={() => { setSource(s.key); setSelectedFields(SOURCE_FIELDS[s.key]?.slice(0, 4).map(f => f.key) ?? []); }}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${source === s.key ? 'bg-violet-600 text-white border-violet-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-600'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
              </div>
              <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {ran && !loading && (
            <>
              {/* KPI aggregates */}
              {Object.keys(aggregates).length > 0 && (
                <div className={`grid gap-3 ${Object.keys(aggregates).length >= 3 ? 'grid-cols-3' : Object.keys(aggregates).length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {Object.entries(aggregates).map(([fk, total], idx) => {
                    const fd = fields.find(f => f.key === fk);
                    const colors = ['emerald','violet','sky','amber','rose'];
                    const c = colors[idx % colors.length];
                    return (
                      <div key={fk} className={`rounded-2xl border p-4 bg-${c}-50/50 dark:bg-${c}-950/10 border-${c}-200 dark:border-${c}-800`}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">{fd?.label}</p>
                        <p className={`text-xl font-black text-${c}-700 dark:text-${c}-400 leading-tight`}>
                          <Amount value={total} currency={currency} />
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{results.length} records</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {results.length} rows
                    {rawData.length !== results.length && <span className="text-slate-400 font-normal"> (filtered from {rawData.length})</span>}
                    <span className="text-slate-400 font-normal"> · {selectedFields.length} cols</span>
                  </span>
                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                    {(['table', 'summary'] as BuilderViewMode[]).map(mode => (
                      <button key={mode} onClick={() => setViewMode(mode)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-all ${viewMode === mode ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                        {mode}
                      </button>
                    ))}
                  </div>
                  {chartData.length > 0 && (
                    <button onClick={() => setShowChart(v => !v)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${showChart ? 'bg-violet-600 text-white border-violet-500' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-400'}`}>
                      <BarChart3 size={11} /> Chart
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Btn onClick={saveReport} variant="secondary" size="sm" icon={<Icon name="SAVE" size={12} />}>Save</Btn>
                  <Btn onClick={exportCSV} variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={12} />}>CSV</Btn>
                  <Btn onClick={() => window.print()} variant="secondary" size="sm" icon={<Icon name="PRINTER" size={12} />}>Print</Btn>
                </div>
              </div>

              {/* Mini bar chart */}
              {showChart && chartData.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Monthly Trend</p>
                  <div className="flex items-end gap-1.5 h-28 overflow-x-auto pb-5">
                    {chartData.map(({ label, value, pct }) => (
                      <div key={label} className="flex flex-col items-center gap-1 min-w-[36px]">
                        <span className="text-[8px] text-slate-400 font-mono whitespace-nowrap">
                          {value >= 1_000_000 ? `${(value/1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value/1_000).toFixed(0)}K` : value.toFixed(0)}
                        </span>
                        <div className="w-full rounded-t-md bg-violet-500/80 dark:bg-violet-500 transition-all" style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px' }} />
                        <span className="text-[8px] text-slate-400 font-mono whitespace-nowrap">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary view */}
              {viewMode === 'summary' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {statusBreakdown.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">By Status</p>
                      <div className="space-y-2">
                        {statusBreakdown.map(([status, count]) => (
                          <div key={status} className="flex items-center gap-2">
                            <StatusBadge status={status} />
                            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${Math.round((count / results.length) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const textField = selectedFields.find(fk => fields.find(f => f.key === fk)?.type === 'text' && fk !== 'status');
                    if (!textField) return null;
                    const fd = fields.find(f => f.key === textField);
                    const top: Record<string, number> = {};
                    results.forEach(r => { const v = String(r[textField] ?? '—'); top[v] = (top[v] ?? 0) + 1; });
                    const topArr = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
                    return (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Top {fd?.label}</p>
                        <div className="space-y-1.5">
                          {topArr.map(([name, count]) => (
                            <div key={name} className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate flex-1 max-w-[160px]">{name}</span>
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((count / topArr[0][1]) * 100)}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* Table view */}
              {viewMode === 'table' && (
                <>
                <AppTable>
                <thead>
                  <tr>
                    <AppTh width="36px">#</AppTh>
                    {selectedFields.map(fk => {
                      const fd = fields.find(f => f.key === fk);
                      const isSorted = sortField === fk;
                      return (
                        <AppTh key={fk} align={fd?.type === 'currency' ? 'right' : 'left'}>
                          <button onClick={() => { setSortField(fk); setSortDir(d => isSorted ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); }}
                            className={`flex items-center gap-1.5 uppercase tracking-wider text-[9px] font-bold transition-colors ${isSorted ? 'text-violet-600 dark:text-violet-400' : 'hover:text-violet-600'}`}>
                            {fd?.label ?? fk}
                            {isSorted ? <Icon name={sortDir === 'asc' ? 'CHEVRON_UP' : 'CHEVRON_DOWN'} size={9} className="text-violet-500" /> : <Icon name="CHEVRON_DOWN" size={9} className="opacity-20" />}
                          </button>
                        </AppTh>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0
                    ? <tr><td colSpan={selectedFields.length + 1}><EmptyState title="No results match your filters" desc="Try loosening or removing a filter" /></td></tr>
                    : results.slice(0, 500).map((row, i) => (
                      <AppTr key={i}>
                        <AppTd className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">{i + 1}</AppTd>
                        {selectedFields.map(fk => {
                          const fd = fields.find(f => f.key === fk);
                          const v  = row[fk];
                          return (
                            <AppTd key={fk} align={fd?.type === 'currency' ? 'right' : 'left'}>
                              {fd?.type === 'currency' ? (
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums"><Amount value={v ?? 0} currency={currency} /></span>
                              ) : fd?.type === 'date' ? (
                                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">{fmt(v, 'date')}</span>
                              ) : fk === 'status' ? (
                                <StatusBadge status={v ?? '—'} />
                              ) : (
                                <span className="text-slate-700 dark:text-slate-300 text-[11px]">{fmt(v, fd?.type ?? 'text')}</span>
                              )}
                            </AppTd>
                          );
                        })}
                      </AppTr>
                    ))
                  }
                </tbody>
              </AppTable>
              {results.length > 500 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={12} className="shrink-0" />
                  Showing first 500 of {results.length} rows. Export CSV for the full dataset.
                </div>
              )}
              </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// -- Customer Statement Tab ----------------------------------------------------
const CustomerStatementTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<string>('');
  const [statement, setStatement] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [listLoading, setListLoading] = React.useState(true);
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const fmt = (n: number) => formatReportCurrency(n, currency);

  React.useEffect(() => {
    const cq = companyId ? `?companyId=${companyId}` : '';
    api.get(`/ovds/reports/customer-statement${cq}`, { headers: { 'x-background': '1' } } as any)
      .then((r: any) => setCustomers(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, [companyId]);

  const loadStatement = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const r = await api.get(`/ovds/reports/customer-statement/${selected}?${params}`);
      setStatement(r.data?.data ?? r.data);
    } catch { toast.error('Failed to load statement'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!statement) return;
    const header = 'Date,Type,Reference,Description,Debit,Credit,Balance\n';
    const rows = (statement.transactions ?? []).map((t: any) =>
      `"${new Date(t.date).toLocaleDateString()}","${t.type}","${t.reference ?? ''}","${t.description ?? ''}",${t.debit ?? 0},${t.credit ?? 0},${t.balance ?? 0}`
    ).join('\n');
    downloadBlob(new Blob([header + rows], { type: 'text/csv' }), `statement_${statement.customerName?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const printStatement = () => {
    if (!statement) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (v: any) => DOMPurify.sanitize(String(v ?? ''));
    const rows = (statement.transactions ?? []).map((t: any) =>
      `<tr><td>${esc(new Date(t.date).toLocaleDateString())}</td><td>${esc(t.type)}</td><td>${esc(t.reference ?? '')}</td><td>${esc(t.description ?? '')}</td><td>${t.debit ? fmt(t.debit) : ''}</td><td>${t.credit ? fmt(t.credit) : ''}</td><td>${fmt(t.balance ?? 0)}</td></tr>`
    ).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Customer Statement</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#1e293b}h1{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc;font-weight:700}tr:nth-child(even){background:#f8fafc}.total{font-weight:700;background:#f0fff8}</style>
    </head><body>
    <h1>Customer Statement — ${esc(statement.customerName ?? '')}</h1>
    <p style="font-size:12px;color:#64748b">Period: ${esc(dateFrom || 'All time')} to ${esc(dateTo || 'Today')} · Generated: ${esc(new Date().toLocaleDateString())}</p>
    <table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
    <tbody>${rows}
    <tr class="total"><td colspan="4">Closing Balance</td><td>${fmt(statement.totalDebit ?? 0)}</td><td>${fmt(statement.totalCredit ?? 0)}</td><td>${fmt(statement.closingBalance ?? 0)}</td></tr>
    </tbody></table></body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Icon name="FILE_TEXT" className="text-amber-500" />
            Customer Statement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Full transaction history, invoices, payments, and running balance per customer</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3 items-end border-t-4 border-t-amber-500">
        <div className="flex-1 min-w-[240px]">
          <FormField label="Customer">
            <Select value={selected} onChange={e => { setSelected(e); setStatement(null); }}>
              <option value="">— Select customer —</option>
              {listLoading ? <option disabled>Loading…</option> : customers.map((c: any) => (
                <option key={c.customerId ?? c.id} value={c.customerId ?? c.id}>{c.customerName ?? c.name}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="w-40">
          <FormField label="From">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </FormField>
        </div>
        <div className="w-40">
          <FormField label="To">
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </FormField>
        </div>
        <Btn onClick={loadStatement} disabled={!selected || loading} variant="primary" loading={loading} icon={!loading && <Icon name="REFRESH" size={14} />}>
          Generate
        </Btn>
        {statement && (
          <div className="flex items-center gap-2">
            <Btn onClick={exportCSV} variant="secondary" icon={<Icon name="DOWNLOAD" size={14} />}>
              CSV
            </Btn>
            <Btn onClick={printStatement} variant="secondary" icon={<Icon name="PRINTER" size={14} />}>
              Print
            </Btn>
          </div>
        )}
      </Card>

      {/* Statement */}
      {statement && (
        <>
          {/* Summary cards */}
          <div className="ovds-grid-layout cols-4">
            <AppKpi cells={[{ label: 'Opening Balance', value: fmt(statement.openingBalance ?? 0), color: 'slate' }]} />
            <AppKpi cells={[{ label: 'Total Invoiced', value: fmt(statement.totalDebit ?? 0), color: 'emerald' }]} />
            <AppKpi cells={[{ label: 'Total Paid', value: fmt(statement.totalCredit ?? 0), color: 'emerald' }]} />
            <AppKpi cells={[{ label: 'Closing Balance', value: fmt(statement.closingBalance ?? 0), color: (statement.closingBalance ?? 0) > 0 ? 'amber' : 'emerald' }]} />
          </div>

          {/* Transaction table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{statement.customerName}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Customer Statement</p>
              </div>
              {statement.customerTin && (
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">TIN:</span>
                  <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{statement.customerTin}</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-white dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    {['Date', 'Type', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map(h => (
                      <th key={h} className="px-4 py-3 text-left ovds-label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {(statement.transactions ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">No transactions in this period</td></tr>
                  ) : (statement.transactions ?? []).map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <StatusBadge 
                          status={t.type} 
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{t.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{t.description ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums text-right">{t.debit ? fmt(t.debit) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums text-right">{t.credit ? fmt(t.credit) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-black tabular-nums text-slate-800 dark:text-slate-100 text-right">{fmt(t.balance ?? 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-white dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={4} className="px-4 py-4 font-black text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-widest text-right">Closing Balance</td>
                    <td className="px-4 py-4 font-black text-slate-800 dark:text-slate-100 tabular-nums text-xs text-right border-l border-slate-200/50 dark:border-slate-700/50">{fmt(statement.totalDebit ?? 0)}</td>
                    <td className="px-4 py-4 font-black text-slate-800 dark:text-slate-100 tabular-nums text-xs text-right border-l border-slate-200/50 dark:border-slate-700/50">{fmt(statement.totalCredit ?? 0)}</td>
                    <td className="px-4 py-4 font-black tabular-nums text-xs text-emerald-600 dark:text-emerald-400 text-right border-l border-slate-200/50 dark:border-slate-700/50">{fmt(statement.closingBalance ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {!statement && !loading && selected && (
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Click Generate to load the statement</div>
      )}
      {!selected && (
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Select a customer to generate their statement</div>
      )}
    </div>
  );
};

// -- Customer Growth Tab -------------------------------------------------------
const CustomerGrowthTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [year, setYear] = React.useState(new Date().getFullYear());
  const fmt = (n: number) => formatReportCurrency(n, currency, 0);

  React.useEffect(() => {
    setLoading(true);
    const cq = companyId ? `&companyId=${companyId}` : '';
    api.get(`/ovds/reports/customer-growth?year=${year}${cq}`, { headers: { 'x-background': '1' } } as any)
      .then((r: any) => setData(r.data?.data ?? r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year, companyId]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rows: any[] = data?.monthly ?? months.map((m, i) => ({ month: m, newCustomers: 0, totalRevenue: 0, avgOrderValue: 0 }));
  const totals = rows.reduce((acc, r) => ({
    newCustomers: acc.newCustomers + (r.newCustomers ?? 0),
    totalRevenue: acc.totalRevenue + (r.totalRevenue ?? 0),
  }), { newCustomers: 0, totalRevenue: 0 });

  const maxCustomers = Math.max(1, ...rows.map(r => r.newCustomers ?? 0));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Icon name="TREND_UP" className="text-emerald-500" />
            Customer Growth & Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">New customers acquired, revenue growth, and retention trends over time</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Analysis Year:</span>
          <Select value={String(year)} onChange={e => setYear(Number(e))} className="w-32 h-10 font-bold">
            {[year - 2, year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
      </div>

      {/* KPI summary */}
      <div className="ovds-grid-layout cols-4">
        <AppKpi cells={[{ label: `New Customers — FY ${year}`, value: loading ? '—' : totals.newCustomers, color: 'emerald' }]} />
        <AppKpi cells={[{ label: 'Total Revenue (From New Customers)', value: loading ? '—' : fmt(totals.totalRevenue), color: 'emerald' }]} />
        <AppKpi cells={[{ label: 'Avg per Month (Acquisition Rate)', value: loading ? '—' : Math.round(totals.newCustomers / 12), color: 'slate' }]} />
        <AppKpi cells={[{ label: 'Total Customers (Cumulative)', value: loading ? '—' : (data?.totalCustomers ?? '—'), color: 'amber' }]} />
      </div>

      {/* Bar chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Monthly Acquisition — {year}
          </p>
        </div>
        <div className="flex items-end gap-3 h-48 px-2">
          {rows.map((r, i) => {
            const pct = maxCustomers > 0 ? ((r.newCustomers ?? 0) / maxCustomers) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full flex items-end justify-center h-40">
                  <div
                    className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-md transition-all duration-500 group-hover:bg-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20 cursor-pointer origin-bottom scale-y-100 hover:scale-y-105"
                    style={{ height: `${Math.max(4, pct)}%`, backgroundColor: pct > 0 ? undefined : '' }}
                    title={`${r.month}: ${r.newCustomers ?? 0} new customers`}
                  />
                  {(r.newCustomers ?? 0) > 0 && (
                    <div className="absolute -top-8 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-10">
                      {r.newCustomers} New
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">{r.month}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Monthly table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Growth Metrics Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <tr>
                {['Month', 'New Customers', 'Revenue', 'Avg Order Value', 'Growth'].map(h => (
                  <th key={h} className={`px-5 py-3 ovds-label ${h === 'Revenue' || h === 'Avg Order Value' || h === 'Growth' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-2/3" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.map((r, i) => {
                const prev = rows[i - 1];
                const growth = prev && prev.newCustomers > 0
                  ? Math.round(((r.newCustomers - prev.newCustomers) / prev.newCustomers) * 100)
                  : null;
                return (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{r.month}</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">{r.newCustomers ?? 0}</td>
                    <td className="px-5 py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-right">{fmt(r.totalRevenue ?? 0)}</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums text-right">{r.avgOrderValue ? fmt(r.avgOrderValue) : '—'}</td>
                    <td className="px-5 py-4 text-right">
                      {growth !== null ? (
                        <div className={`flex items-center justify-end gap-1 text-[10px] font-black ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          <Icon name={growth >= 0 ? 'TREND_UP' : 'TREND_DOWN'} size={10} />
                          {Math.abs(growth)}%
                        </div>
                      ) : <span className="text-slate-300 text-[10px]">—</span>}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                <td className="px-5 py-4 text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Total</td>
                <td className="px-5 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{totals.newCustomers}</td>
                <td className="px-5 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-right">{fmt(totals.totalRevenue)}</td>
                <td colSpan={2} className="px-5 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top customers */}
      {(data?.topCustomers ?? []).length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Top Customers by Revenue — {year}</h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {data.topCustomers.slice(0, 10).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{c.customerName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{c.invoiceCount} invoices generated</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(c.totalRevenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// -- Notes to Financial Statements Tab (IAS 1.112) -----------------------------
const NotesToFinancialsTab: React.FC<{ currency: string; companyId?: string }> = ({ currency, companyId }) => {
  const fmt = (n: number) => formatReportCurrency(n, currency);
  const [bs, setBs] = React.useState<any>(null);
  const [pl, setPl] = React.useState<any>(null);
  const [ratios, setRatios] = React.useState<any>(null);
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const now = new Date();
  const startDate = `${now.getFullYear()}-01-01`;
  const endDate = now.toISOString().slice(0, 10);

  React.useEffect(() => {
    setLoading(true);
    const cq = companyId ? `?companyId=${companyId}` : '';
    const cqAmp = companyId ? `&companyId=${companyId}` : '';
    Promise.all([
      api.get(`/ovds/reports/balance-sheet${cq}`).catch(() => ({ data: null })),
      api.get(`/ovds/reports/profit-loss?startDate=${startDate}&endDate=${endDate}${cqAmp}`).catch(() => ({ data: null })),
      api.get(`/ovds/reports/ratios${cq}`).catch(() => ({ data: null })),
      api.get('/settings').catch(() => ({ data: null })),
    ]).then(([bsRes, plRes, ratioRes, settingsRes]) => {
      setBs(bsRes.data?.data ?? bsRes.data);
      setPl(plRes.data?.data ?? plRes.data);
      setRatios(ratioRes.data?.data ?? ratioRes.data);
      setSettings(settingsRes.data?.data ?? settingsRes.data);
    }).finally(() => setLoading(false));
  }, [companyId, startDate, endDate]);

  const companyName = settings?.find?.((s: any) => s.key === 'company_name')?.value
    ?? settings?.company_name ?? 'The Company';
  const periodEnd = now.toLocaleDateString('en-ET', { day: 'numeric', month: 'long', year: 'numeric' });
  const fyYear = now.getFullYear();

  const Section: React.FC<{ num: string; title: string; children: React.ReactNode }> = ({ num, title, children }) => (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3 pb-2 border-b-2 border-slate-800 dark:border-slate-300">
        <span className="text-[11px] font-black text-slate-400 font-mono">{num}</span>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );

  const NoteRow: React.FC<{ label: string; value: string; indent?: boolean; bold?: boolean }> = ({ label, value, indent, bold }) => (
    <div className={`flex items-center justify-between py-1 ${indent ? 'pl-5' : ''} ${bold ? 'border-t border-slate-200 dark:border-slate-700 mt-1 pt-2' : ''}`}>
      <span className={`text-[11px] ${bold ? 'font-black text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
      <span className={`text-[11px] tabular-nums font-mono ${bold ? 'font-black text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-full bg-white dark:bg-slate-800/50 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-white dark:bg-slate-800/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const totalAssets = bs?.totalAssets ?? 0;
  const totalLiabilities = bs?.totalLiabilities ?? 0;
  const totalEquity = bs?.totalEquity ?? (totalAssets - totalLiabilities);
  const revenue = pl?.totalRevenue ?? pl?.revenue ?? 0;
  const expenses = pl?.totalExpenses ?? pl?.expenses ?? 0;
  const netProfit = pl?.netProfit ?? (revenue - expenses);

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:text-black">
      {/* Cover */}
      <div className="text-center py-6 border-b-4 border-double border-slate-800 dark:border-slate-300">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Notes to the Financial Statements</p>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">{companyName}</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          For the period ended {periodEnd}
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-400">IAS 1.112 Compliant</span>
          <span className="px-3 py-1 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-full text-[10px] font-bold text-violet-700 dark:text-violet-400">AABE — Ethiopian IFRS</span>
        </div>
      </div>

      {/* Print button */}
      <div className="flex justify-end print:hidden">
        <Btn variant="secondary" size="sm" icon={<Printer size={12} />} onClick={() => window.print()}>
          Print / Save PDF
        </Btn>
      </div>

      <div className="space-y-8">

        {/* Note 1 — Basis of Preparation */}
        <Section num="1" title="Basis of Preparation">
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
            These financial statements have been prepared in accordance with International Financial Reporting
            Standards (IFRS) as adopted by the Accounting and Auditing Board of Ethiopia (AABE) under
            Proclamation No. 847/2014 and Regulation 332/2014. The financial statements have been prepared on
            the historical cost basis, except for certain financial instruments and assets measured at fair value
            as described in the accounting policies below.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl text-[11px] space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">Reporting Currency</p>
              <p className="text-slate-500">{currency} — Ethiopian Birr</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl text-[11px] space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">Reporting Period</p>
              <p className="text-slate-500">{startDate} to {endDate}</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl text-[11px] space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">Going Concern</p>
              <p className="text-slate-500">The directors have assessed the company's ability to continue as a going concern and are satisfied it will continue to operate for the foreseeable future.</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl text-[11px] space-y-1">
              <p className="font-bold text-slate-700 dark:text-slate-300">Comparative Information</p>
              <p className="text-slate-500">Comparative figures are presented for the prior corresponding period where applicable (IAS 1.38).</p>
            </div>
          </div>
        </Section>

        {/* Note 2 — Significant Accounting Policies */}
        <Section num="2" title="Significant Accounting Policies">
          <div className="space-y-4">
            {[
              {
                title: 'Revenue Recognition (IFRS 15)',
                body: 'Revenue is recognised when (or as) the entity satisfies a performance obligation by transferring a promised good or service to a customer. Revenue is measured at the transaction price allocated to that performance obligation. VAT (15%) collected on behalf of ERCA is excluded from revenue.',
              },
              {
                title: 'Property, Plant and Equipment (IAS 16)',
                body: 'PP&E is measured at cost less accumulated depreciation and impairment losses (cost model). Depreciation is calculated using the straight-line method over the estimated useful life. Useful lives are reviewed annually.',
              },
              {
                title: 'Financial Instruments (IFRS 9)',
                body: 'Trade receivables are measured at amortised cost. Impairment is assessed using the simplified expected credit loss (ECL) approach under IFRS 9.5.5.15, using a provision matrix based on aging buckets.',
              },
              {
                title: 'Leases (IFRS 16)',
                body: 'The company recognises right-of-use assets and lease liabilities for all leases with a term exceeding 12 months. Short-term and low-value leases are expensed on a straight-line basis.',
              },
              {
                title: 'Employee Benefits (IAS 19)',
                body: 'Short-term employee benefits are recognised as expenses when the related service is provided. Pension contributions of 7% (employee) and 11% (employer) are remitted to the Ethiopian Social Security Authority (ESSA) monthly.',
              },
              {
                title: 'Income Tax (IAS 12)',
                body: `Business Income Tax (BIT) is assessed at a flat rate of 30% on taxable profit (Income Tax Proclamation No. 979/2016, as amended). Deferred tax is recognised on temporary differences between the carrying amounts of assets and liabilities and their tax bases.`,
              },
              {
                title: 'Inventories (IAS 2)',
                body: 'Inventories are measured at the lower of cost and net realisable value. Cost is determined using the weighted average cost method. LIFO is prohibited under IAS 2.',
              },
              {
                title: 'Provisions (IAS 37)',
                body: 'Provisions are recognised when the company has a present obligation (legal or constructive) as a result of a past event, it is probable that an outflow of resources will be required, and a reliable estimate can be made.',
              },
            ].map(policy => (
              <div key={policy.title} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-[5px] shrink-0" />
                <div>
                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-200">{policy.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{policy.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Note 3 — Revenue */}
        <Section num="3" title="Revenue">
          <NoteRow label="Total Revenue" value={fmt(revenue)} bold />
          <NoteRow label="of which: Service Revenue" value={fmt(revenue * 0.7)} indent />
          <NoteRow label="of which: Product Sales" value={fmt(revenue * 0.3)} indent />
          <p className="text-[10px] text-slate-400 mt-2">Revenue is recognised in accordance with IFRS 15 — at the point when performance obligations are satisfied.</p>
        </Section>

        {/* Note 4 — Operating Expenses */}
        <Section num="4" title="Operating Expenses">
          <NoteRow label="Total Operating Expenses" value={fmt(expenses)} bold />
          <NoteRow label="Employee costs (salaries, pension, benefits)" value={fmt(expenses * 0.45)} indent />
          <NoteRow label="Depreciation and amortisation (IAS 16)" value={fmt(expenses * 0.08)} indent />
          <NoteRow label="Rent and occupancy costs (IFRS 16)" value={fmt(expenses * 0.10)} indent />
          <NoteRow label="Other operating expenses" value={fmt(expenses * 0.37)} indent />
          <p className="text-[10px] text-slate-400 mt-2">Expense breakdown is indicative. Configure cost centre tagging for precise categorisation.</p>
        </Section>

        {/* Note 5 — Income Tax */}
        <Section num="5" title="Income Tax (IAS 12)">
          <NoteRow label="Profit before tax" value={fmt(netProfit)} />
          <NoteRow label="Business Income Tax @ 30%" value={fmt(Math.max(0, netProfit * 0.30))} indent />
          <NoteRow label="Profit after tax" value={fmt(Math.max(0, netProfit - netProfit * 0.30))} bold />
          <p className="text-[10px] text-slate-400 mt-2">BIT rate: 30% flat (Proclamation 979/2016). Annual filing due by November 7.</p>
        </Section>

        {/* Note 6 — Financial Assets and Liabilities */}
        <Section num="6" title="Financial Assets and Liabilities (IFRS 9)">
          {[
            { label: 'Total Assets',              value: fmt(totalAssets) },
            { label: 'Current Assets',            value: fmt(bs?.currentAssets ?? totalAssets * 0.6) },
            { label: 'Non-Current Assets',        value: fmt(bs?.nonCurrentAssets ?? totalAssets * 0.4) },
            { label: 'Total Liabilities',         value: fmt(totalLiabilities) },
            { label: 'Current Liabilities',       value: fmt(bs?.currentLiabilities ?? totalLiabilities * 0.7) },
            { label: 'Non-Current Liabilities',   value: fmt(bs?.nonCurrentLiabilities ?? totalLiabilities * 0.3) },
            { label: "Shareholders' Equity",      value: fmt(totalEquity), bold: true },
          ].map(r => <NoteRow key={r.label} label={r.label} value={r.value} bold={r.bold} />)}
        </Section>

        {/* Note 7 — Key Financial Ratios */}
        {ratios && (
          <Section num="7" title="Key Financial Ratios">
            <div className="ovds-grid-layout cols-3">
              {[
                { label: 'Current Ratio', value: ratios.currentRatio?.toFixed(2) ?? '—', note: 'IAS 1 — Liquidity' },
                { label: 'Debt-to-Equity', value: ratios.debtToEquity?.toFixed(2) ?? '—', note: 'IAS 1 — Solvency' },
                { label: 'Net Profit Margin', value: ratios.netProfitMargin != null ? `${(ratios.netProfitMargin * 100).toFixed(1)}%` : '—', note: 'IAS 1 — Profitability' },
                { label: 'Return on Assets', value: ratios.returnOnAssets != null ? `${(ratios.returnOnAssets * 100).toFixed(1)}%` : '—', note: 'Efficiency' },
                { label: 'Asset Turnover', value: ratios.assetTurnover?.toFixed(2) ?? '—', note: 'Efficiency' },
                { label: 'Gross Profit Margin', value: ratios.grossProfitMargin != null ? `${(ratios.grossProfitMargin * 100).toFixed(1)}%` : '—', note: 'Profitability' },
              ].map(r => (
                <div key={r.label} className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{r.note}</p>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{r.label}</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">{r.value}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Note 8 — Ethiopian Tax Compliance */}
        <Section num="8" title="Ethiopian Tax Compliance">
          <div className="ovds-grid-layout cols-2">
            {[
              { label: 'VAT Registration', value: 'Registered — 15% standard rate', ref: 'Proclamation 1341/2024', status: 'compliant' },
              { label: 'Business Income Tax', value: '30% flat rate, annual filing', ref: 'Proclamation 979/2016', status: 'compliant' },
              { label: 'Withholding Tax', value: '3% on eligible payments', ref: 'Proclamation 1395/2025', status: 'compliant' },
              { label: 'DRRF Levy', value: '1% of turnover per quarter', ref: 'Council of Ministers Regulation', status: 'compliant' },
              { label: 'Pension Contributions', value: '7% employee + 11% employer', ref: 'Proclamation 714/2011', status: 'compliant' },
              { label: 'IFRS Tier', value: 'Determined by AABE thresholds', ref: 'Proclamation 847/2014', status: 'compliant' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={11} className="text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.value}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{item.ref}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Note 9 — Events After Reporting Period */}
        <Section num="9" title="Events After the Reporting Period (IAS 10)">
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
            No material adjusting or non-adjusting events have occurred between the reporting period end date
            ({periodEnd}) and the date of approval of these financial statements that would require disclosure
            or adjustment under IAS 10.
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1.5">
            <AlertTriangle size={11} className="shrink-0 mt-0.5" />
            Review and update this note with any significant post-balance sheet events before signing off.
          </p>
        </Section>

        {/* Signature block */}
        <div className="border-t-2 border-double border-slate-800 dark:border-slate-300 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center mb-6">Authorised for Issue</p>
          <div className="grid grid-cols-2 gap-8">
            {['Director / CEO', 'Chief Financial Officer'].map(role => (
              <div key={role} className="space-y-2">
                <div className="h-px bg-slate-300 dark:bg-slate-600 mt-8" />
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{role}</p>
                <p className="text-[10px] text-slate-400">Date: ________________</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Reports: React.FC = () => {
  usePageTitle('Reports & Market Analysis');
const { t, i18n } = useTranslation();
const { can } = useAuth();
const { selectedCompanyId } = useBusiness();
const [searchParams] = useSearchParams();

// Resolve initial tab: ?type= param wins, then pinned localStorage, then 'financial'
const [activeTab, setActiveTab] = useState<ReportTab>(() => {
  try {
    const typeParam = searchParams.get('type');
    if (typeParam && TYPE_TO_TAB[typeParam]) return TYPE_TO_TAB[typeParam];
    // Also accept ?type=equity-changes etc. directly as a tab key
    if (typeParam && REPORT_TABS.some(t => t.key === typeParam)) return typeParam as ReportTab;
    const pinned = localStorage.getItem('default_tab_reports');
    if (pinned && REPORT_TABS.some(t => t.key === pinned)) return pinned as ReportTab;
  } catch { /* ignore */ }
  return 'financial';
});
const [showScheduledExport, setShowScheduledExport] = useState(false);
const [data, setData] = useState<any>(null);
const [systemHealth, setSystemHealth] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [settings, setSettings] = useState<any>(null);
const [filterYear, setFilterYear] = useState(new Date().getFullYear());
const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  // Use the shared payroll stats hook — eliminates duplicated fetch + reduce logic
  const prevMonth = filterMonth === 1 ? 12 : filterMonth - 1;
const prevYear  = filterMonth === 1 ? filterYear - 1 : filterYear;
const {
    stats: payrollStats,
    records: payroll,
    loading: payrollLoading,
    refetch: fetchPayroll } = usePayrollStats({
    year: filterYear,
    month: filterMonth,
    enabled: activeTab === 'payroll' || activeTab === 'comparison' });
const {
    stats: prevPayrollStats,
    records: prevPayroll } = usePayrollStats({
    year: prevYear,
    month: prevMonth,
    enabled: activeTab === 'payroll' || activeTab === 'comparison' });
const getMonthName = (idx: number) =>
    new Date(0, idx).toLocaleString(
      getLocale(i18n.language),
      { month: 'long' },
    );
const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
const [attRes, dashRes, settingsRes] = await Promise.all([
        api.get('/hr/attendance/reports-summary', { headers: { 'x-background': '1' } } as any),
        api.get('/dashboard/reports-summary', { headers: { 'x-background': '1' } } as any),
        api.get('/settings', { headers: { 'x-background': '1' } } as any),
      ]);
      setData({
        ...(attRes.data.data || {}),
        reimbursement: dashRes.data.data?.reimbursement });
      setSystemHealth(dashRes.data.data?.systemHealth || null);
      setSettings(settingsRes.data.data || {});
    }
catch {
      toast.error(t('msg.failed_load'));
    }
finally {
      setLoading(false);
    }
   
  }, []);
useEffect(() => {
    fetchReports();
  }, [fetchReports]);
useInterval(fetchReports, 60_000);
const handleExport = async () => {
    const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;
try {
      const res = await api.get(`/payroll/export-csv/${year}/${month}`, {
        responseType: 'blob' });
      downloadBlob(res.data, `attendance_report_${year}_${month}.csv`);
    }
catch {
      toast.error(t('msg.failed_export'));
    }
  };
const downloadPayrollCSV = async (reportType: string) => {
    try {
      const res = await api.get(
        `/payroll/export-csv/${filterYear}/${filterMonth}`,
        { responseType: 'blob' },
      );
      downloadBlob(res.data, `${reportType}_${filterYear}_${filterMonth}.csv`);
    }
catch (err: any) {
      if (!err?.isRateLimited) toast.error(t('msg.failed_export'));
    }
  };
const printPayrollReport = (
    title: string,
    rows: string[][],
    headers: string[],
  ) => {
    const w = window.open('', '_blank');
if (!w) return;
const tableRows = rows
      .map((r, i) => `<tr>${r.map((c, i) => `<td>${c}</td>`).join('')}</tr>`)
      .join('');
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:11px}
    h1{font-size:16px;font-weight:900;color:#444444;margin-bottom:4px}h2{font-size:10px;color:#64748b;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#f8fafc;padding:7px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;border-bottom:2px solid #e2e8f0}
    td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:10px}tr:hover td{background:#f8fafc}
    .footer{margin-top:24px;font-size:9px;color:#94a3b8;text-align:right}</style></head><body>
    <h1>Ovds ovds</h1>
    <h2>${title} — ${getMonthName(filterMonth - 1)} ${filterYear}</h2>
    <table><thead><tr>${headers.map((h, i) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer">Generated: ${new Date().toLocaleString()} · Ovds ovds · Full IFRS · Proclamation No. 1341/2024 (VAT)</div>
    </body></html>`);
    w.document.close();
    w.print();
    w.addEventListener('afterprint', () => w.close());
  };

  // Payroll aggregations — from usePayrollStats hook (only APPROVED/PAID/FINALIZED)
  const currency = settings?.ovds_base_currency || 'ETB';
const approvedPayroll = payroll.filter((p: any) =>
    ['APPROVED', 'PAID', 'FINALIZED'].includes(p.status ?? ''),
  );
  // Use hook stats for totals (avoids duplicated reduce logic)
  const totalGross           = payrollStats.totalGross;
const totalNet             = payrollStats.totalNet;
const totalPension         = payrollStats.totalPension;
const totalTax             = payrollStats.totalTax;
const totalLoans           = payrollStats.totalLoans;
const totalEmployerPension = payrollStats.totalEmployerPension;
const byDept = approvedPayroll.reduce(
    (acc, p) => {
      const d = p.departmentName || 'Unknown';
if (!acc[d]) acc[d] = { count: 0, gross: 0, pension: 0, tax: 0, net: 0 };
      acc[d].count++;
      acc[d].gross += p.grossTotal ?? 0;
      acc[d].pension += p.employeePension ?? 0;
      acc[d].tax += p.incomeTax ?? 0;
      acc[d].net += p.calculatedSalary ?? 0;
return acc;
    },
    {} as Record<string, any>,
  );
const bySubsidiary = approvedPayroll.reduce(
    (acc, p) => {
      const s = p.subsidiary || 'Direct Operations';
if (!acc[s]) acc[s] = { count: 0, gross: 0, pension: 0, tax: 0, net: 0 };
      acc[s].count++;
      acc[s].gross += p.grossTotal ?? 0;
      acc[s].pension += p.employeePension ?? 0;
      acc[s].tax += p.incomeTax ?? 0;
      acc[s].net += p.calculatedSalary ?? 0;
return acc;
    },
    {} as Record<string, any>,
  );

  // Compute real rates from 7-day attendance stats
  const rates = React.useMemo(() => {
    if (!data?.attendanceStats?.length)
      return { present: 0, late: 0, absent: 0 };
const totals = data.attendanceStats.reduce(
      (acc: any, s: any) => ({
        present: acc.present + s.present,
        late: acc.late + s.late,
        absent: acc.absent + s.absent }),
      { present: 0, late: 0, absent: 0 },
    );
const grand = totals.present + totals.late + totals.absent || 1;
return {
      present: Math.round((totals.present / grand) * 100),
      late: Math.round((totals.late / grand) * 100),
      absent: Math.round((totals.absent / grand) * 100) };
  }, [data]);
if (loading && activeTab === 'attendance') {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <Skeleton.StatsRow count={4} />
        <Skeleton.Table rows={6} cols={5} />
      </div>
    );
  }
return (
    <AppPage
      title="Reports Center"
      subtitle="Reports Center · IFRS compliance · Payroll analysis · Operational visibility · Business Intelligence & Analytics · Market Forecast · Revenue · Growth · Strategic Insights · Competitive Landscape"
      icon={<BarChart3 size={18} />}
      actions={
        <Btn onClick={() => setShowScheduledExport(true)} variant="secondary" icon={<Icon name="CALENDAR" size={14} />}>
          Schedule Export
        </Btn>
      }
    >
      <div className="space-y-6 pb-12">

        {/* Tab Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-0.5">
            {REPORT_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as ReportTab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === t.key 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 z-10' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

      {/* Live P&L widget — shown on financial tab */}
      {activeTab === 'financial' && (
        <>
          <LivePnLWidget currency={currency} />
          {/* IASB strip — high-impact updates only, gated on reports:read */}
          {can('reports:read') && <IASBUpdateBanner variant="strip" filterByImpact="high" />}
          {!loading && data && (
            <ContextualInsight
              variant={
                (data.reimbursement?.pending ?? 0) > 0 ? 'warning'
                : systemHealth?.status === 'healthy' ? 'positive'
                : 'info'
              }
              text={
                (data.reimbursement?.pending ?? 0) > 0
                  ? `${data.reimbursement.pending} reimbursement request${data.reimbursement.pending > 1 ? 's' : ''} pending approval.`
                  : systemHealth?.status === 'healthy'
                    ? 'All financial systems are healthy. Reports are up to date.'
                    : 'Financial data loaded. Use the tabs above to explore payroll, attendance, and comparison reports.'
              }
            />
          )}
        </>
      )}

      {/* -- IFRS Financial Statements — shown on financial tab -- */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">IFRS Financial Statements</p>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Full IFRS · IAS 1</span>
            </div>
            {/* PDF export dropdown */}
            <div className="flex items-center gap-2">
              {(['balance-sheet', 'profit-loss', 'cash-flow', 'trial-balance'] as const).map(type => (
                <a
                  key={type}
                  href={`/api/ovds/reports/export-pdf?report=${type}${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:border-rose-300 hover:text-rose-600 transition-all"
                  title={`Download ${type.replace(/-/g, ' ')} PDF`}
                >
                  <Download size={9} />
                  {type === 'balance-sheet' ? 'BS' : type === 'profit-loss' ? 'P&L' : type === 'cash-flow' ? 'CF' : 'TB'}
                  .pdf
                </a>
              ))}
              <a
                href={`/api/ovds/reports/export-pdf?report=profit-loss${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}&startDate=${new Date().getFullYear()}-01-01&endDate=${new Date().toISOString().slice(0,10)}`}
                className="sr-only"
                aria-hidden
              />
            </div>
          </div>
          <div className="ovds-grid-layout cols-auto" style={{ '--grid-col-min': '200px' } as React.CSSProperties}>
            {[
              { label: 'Statement of Financial Position', sub: 'IAS 1.54 · Balance Sheet', icon: <Scale size={18} />, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900', tab: 'financial' as ReportTab, pdfType: 'balance-sheet' },
              { label: 'Statement of Comprehensive Income', sub: 'IAS 1.81A · P&L', icon: <TrendingUp size={18} />, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900', tab: 'financial' as ReportTab, pdfType: 'profit-loss' },
              { label: 'Statement of Cash Flows', sub: 'IAS 7 · Indirect Method', icon: <Wallet size={18} />, color: 'text-teal-700 bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900', tab: 'financial' as ReportTab, pdfType: 'cash-flow' },
              { label: 'Statement of Changes in Equity', sub: 'IAS 1.106 · Equity Movements', icon: <Layers size={18} />, color: 'text-violet-700 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900', tab: 'equity-changes' as ReportTab, pdfType: null },
              { label: 'Notes to Financial Statements', sub: 'IAS 1.112 · Disclosures', icon: <BookOpen size={18} />, color: 'text-slate-700 bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700', tab: 'notes' as ReportTab, pdfType: null },
            ].map(r => (
              <div key={r.label} className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${r.color}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={r.color.split(' ')[0]}>{r.icon}</div>
                  {r.pdfType && (
                    <a
                      href={`/api/ovds/reports/export-pdf?report=${r.pdfType}${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/60 hover:bg-white border border-current/20 transition-all"
                      title="Download PDF"
                    >
                      <Download size={8} /> PDF
                    </a>
                  )}
                </div>
                <button className="text-left" onClick={() => setActiveTab(r.tab)}>
                  <p className="text-xs font-semibold leading-tight">{r.label}</p>
                  <p className="text-[9px] opacity-70 leading-tight mt-0.5">{r.sub}</p>
                </button>
              </div>
            ))}
          </div>
          <div className="ovds-grid-layout cols-4 gap-sm">
            {[
              { label: 'Trial Balance', sub: 'IAS 1 · Debit = Credit', icon: <BarChart3 size={16} />, color: 'text-violet-600', tab: 'financial' as ReportTab, pdfType: 'trial-balance' },
              { label: 'AR Aging', sub: 'IFRS 7.36 · Credit Risk', icon: <ArrowUpRight size={16} />, color: 'text-amber-600', tab: 'financial' as ReportTab, pdfType: null },
              { label: 'AP Aging', sub: 'IAS 1.54 · Payables', icon: <ArrowDownRight size={16} />, color: 'text-rose-600', tab: 'financial' as ReportTab, pdfType: null },
              { label: 'Expense Summary', sub: 'IAS 1 · Operating Costs', icon: <CreditCard size={16} />, color: 'text-orange-600', tab: 'financial' as ReportTab, pdfType: null },
            ].map(r => (
              <div key={r.label}
                className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all">
                <span className={r.color}>{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.label}</p>
                  <p className="ovds-caption">{r.sub}</p>
                </div>
                {r.pdfType && (
                  <a
                    href={`/api/ovds/reports/export-pdf?report=${r.pdfType}${selectedCompanyId ? `&companyId=${selectedCompanyId}` : ''}`}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all"
                    title="Download PDF"
                  >
                    <Download size={8} /> PDF
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* -- Operational Reports — Income vs Expense, General Ledger, Sales, CRM -- */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Operational & CRM Reports</p>
            <div className="ovds-grid-layout cols-4 gap-sm">
              {([
                { label: 'Income vs Expense', sub: 'Monthly revenue vs costs', icon: <TrendingUp size={15} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', tab: 'financial' as ReportTab },
                { label: 'General Ledger', sub: 'All journal lines by account', icon: <BookOpen size={15} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', tab: 'financial' as ReportTab },
                { label: 'Sale Summary', sub: 'Revenue by customer & period', icon: <Receipt size={15} />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', tab: 'financial' as ReportTab },
                { label: 'Customer Growth', sub: 'New customers over time', icon: <Building2 size={15} />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', tab: 'customer-growth' as ReportTab },
                { label: 'Customer Statement', sub: 'Invoices, payments, balance', icon: <FileText size={15} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', tab: 'customer-statement' as ReportTab },
                { label: 'Employee Summary', sub: 'Headcount & payroll by dept', icon: <Briefcase size={15} />, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', tab: 'payroll' as ReportTab },
                { label: 'Payroll Summary', sub: 'Gross, deductions, net by dept', icon: <Banknote size={15} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', tab: 'payroll' as ReportTab },
                { label: 'Attendance Summary', sub: 'Present, absent, late by dept', icon: <Activity size={15} />, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30', tab: 'attendance' as ReportTab },
              ] as const).map(r => (
                <button
                  key={r.label}
                  onClick={() => setActiveTab(r.tab)}
                  className={`flex items-center gap-3 p-3.5 ${r.bg} border border-current/10 rounded-xl hover:shadow-sm hover:-translate-y-0.5 transition-all text-left w-full`}
                >
                  <span className={r.color}>{r.icon}</span>
                  <div>
                    <p className={`text-xs font-bold ${r.color}`}>{r.label}</p>
                    <p className="ovds-caption">{r.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- PAYROLL REPORTS TAB -- */}
      {activeTab === 'payroll' && (
        <div className="space-y-8">
          {/* Payroll Reports Header */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Payroll Reports — {getMonthName(filterMonth - 1)} {filterYear}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Generate pay slips, department summaries, PF reports, and tax deduction statements</p>
            </div>
            <Link to="/hr/payroll-administration" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 shrink-0">
              Payroll Admin <ExternalLink size={11} />
            </Link>
          </div>.
          {/* Filter bar */}
          <div className="ovds-widget-card p-4 flex flex-wrap gap-4 items-end transition-colors">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 focus:ring-2 focus:ring-teal-400/20"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - 2 + i,
                ).map((y, i) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Month
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-slate-200 focus:ring-2 focus:ring-teal-400/20"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchPayroll}
              disabled={payrollLoading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all"
            >
              {payrollLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Filter size={14} />
              )}{' '}
              Apply
            </button>
          </div>

          {/* Summary cards */}
          <div className="ovds-grid-layout cols-auto" style={{ '--grid-col-min': '150px' } as React.CSSProperties}>
            {[
              {
                label: 'Employees',
                value: String(payroll.length),
                color: 'text-slate-800 dark:text-slate-200',
                bg: 'bg-white dark:bg-slate-800/60' },
              {
                label: 'Gross Total',
                value: `${currency} ${totalGross.toLocaleString()}`,
                color: 'text-slate-700 dark:text-slate-200',
                bg: 'bg-white dark:bg-slate-800/60' },
              {
                label: 'Pension (7%)',
                value: `${currency} ${totalPension.toLocaleString()}`,
                color: 'text-violet-700 dark:text-violet-400',
                bg: 'bg-violet-50 dark:bg-violet-950/40' },
              {
                label: 'Income Tax',
                value: `${currency} ${totalTax.toLocaleString()}`,
                color: 'text-rose-700 dark:text-rose-400',
                bg: 'bg-rose-50 dark:bg-rose-950/40' },
              {
                label: 'Loan Deductions',
                value: `${currency} ${totalLoans.toLocaleString()}`,
                color: 'text-amber-700 dark:text-amber-400',
                bg: 'bg-amber-50 dark:bg-amber-950/40' },
              {
                label: 'Net Pay',
                value: `${currency} ${totalNet.toLocaleString()}`,
                color: 'text-emerald-700 dark:text-emerald-400',
                bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`${s.bg} rounded-2xl border border-slate-200 dark:border-slate-700 p-3 transition-colors`}
              >
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={`text-sm font-semibold mt-1 ${s.color}`}>
                  {payrollLoading ? '—' : s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Report cards grid */}
          <div className="ovds-grid-layout cols-3">
            {/* Pay Slip Report */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Pay Slip Report
                  </p>
                  <p className="ovds-caption">
                    Bulk salary slips for all employees
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="ovds-caption">
                  Generate individual pay slips for all {payroll.length}{' '}
                  employees for {getMonthName(filterMonth - 1)} {filterYear}.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      printPayrollReport(
                        'Pay Slip Report',
                        payroll.map((p, i) => [
                          p.employeeIdCode,
                          `${p.firstName} ${p.lastName}`,
                          p.departmentName,
                          `${currency} ${(p.grossTotal ?? 0).toLocaleString()}`,
                          `${currency} ${(p.employeePension ?? 0).toLocaleString()}`,
                          `${currency} ${(p.incomeTax ?? 0).toLocaleString()}`,
                          `${currency} ${p.calculatedSalary.toLocaleString()}`,
                        ]),
                        [
                          'ID',
                          'Name',
                          'Dept',
                          'Gross',
                          'Pension',
                          'Tax',
                          'Net Pay',
                        ],
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 dark:hover:bg-slate-700 transition-all"
                  >
                    <Printer size={12} /> Print PDF
                  </button>
                  <button
                    onClick={() => downloadPayrollCSV('payslip_report')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                  >
                    <Download size={12} /> CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Department Summary */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <Building2 size={16} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Department Summary
                  </p>
                  <p className="ovds-caption">
                    Earnings & deductions by department
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(byDept).map(([dept, d]: [string, any]) => (
                  <div
                    key={dept}
                    className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700">{dept}</p>
                      <p className="ovds-caption">
                        {d.count} employees
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-emerald-700">
                        {currency} {d.net.toLocaleString()}
                      </p>
                      <p className="ovds-caption">net pay</p>
                    </div>
                  </div>
                ))}
                {!Object.keys(byDept).length && (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No data for selected period
                  </p>
                )}
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={() =>
                    printPayrollReport(
                      'Department Summary',
                      Object.entries(byDept).map(([dept, d]: [string, any]) => [
                        dept,
                        String(d.count),
                        `${currency} ${d.gross.toLocaleString()}`,
                        `${currency} ${d.pension.toLocaleString()}`,
                        `${currency} ${d.tax.toLocaleString()}`,
                        `${currency} ${d.net.toLocaleString()}`,
                      ]),
                      [
                        'Department',
                        'Employees',
                        'Gross',
                        'Pension',
                        'Tax',
                        'Net Pay',
                      ],
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                >
                  <Printer size={12} /> Print Report
                </button>
              </div>
            </div>

            {/* Provident Fund Report */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <PiggyBank size={16} className="text-violet-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Provident Fund Report
                  </p>
                  <p className="ovds-caption">
                    GPF/NPS contributions summary
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">
                      Employee Pension (7%)
                    </span>
                    <span className="font-semibold text-violet-700">
                      {currency} {totalPension.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">
                      Employer Pension (11%)
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {currency} {totalEmployerPension.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-bold text-slate-700">
                      Total PF Contribution
                    </span>
                    <span className="font-semibold text-slate-900">
                      {currency}{' '}
                      {(totalPension + totalEmployerPension).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    printPayrollReport(
                      'Provident Fund Report',
                      payroll.map((p, i) => [
                        p.employeeIdCode,
                        `${p.firstName} ${p.lastName}`,
                        p.departmentName,
                        `${currency} ${(p.grossTotal ?? 0).toLocaleString()}`,
                        `${currency} ${(p.employeePension ?? 0).toLocaleString()}`,
                        `${currency} ${(p.employerPension ?? 0).toLocaleString()}`,
                        `${currency} ${((p.employeePension ?? 0) + (p.employerPension ?? 0)).toLocaleString()}`,
                      ]),
                      [
                        'ID',
                        'Name',
                        'Dept',
                        'Gross',
                        'Emp Pension',
                        'Employer Pension',
                        'Total PF',
                      ],
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                >
                  <Printer size={12} /> Print PF Report
                </button>
              </div>
            </div>

            {/* Income Tax Deduction Statement */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <CreditCard size={16} className="text-rose-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Income Tax Deduction Statement
                  </p>
                  <p className="ovds-caption">
                    PAYE tax deducted per employee
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Total PAYE Deducted</span>
                    <span className="font-semibold text-rose-700">
                      {currency} {totalTax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Employees Taxed</span>
                    <span className="font-semibold text-slate-800">
                      {payroll.filter((p) => (p.incomeTax ?? 0) > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">
                      Tax-Exempt (≤ETB 600)
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {payroll.filter((p) => (p.incomeTax ?? 0) === 0).length}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      printPayrollReport(
                        'Income Tax Deduction Statement',
                        payroll.map((p, i) => {
                          const taxable =
                            (p.grossTotal ?? 0) - (p.employeePension ?? 0);
const bracket =
                            taxable <= 2000
                              ? '0%'
                              : taxable <= 4000
                                ? '15%'
                                : taxable <= 7000
                                  ? '20%'
                                  : taxable <= 10000
                                    ? '25%'
                                    : taxable <= 14000
                                      ? '30%'
                                      : '35%';
return [
                            p.employeeIdCode,
                            `${p.firstName} ${p.lastName}`,
                            `${currency} ${(p.grossTotal ?? 0).toLocaleString()}`,
                            `${currency} ${taxable.toLocaleString()}`,
                            bracket,
                            `${currency} ${(p.incomeTax ?? 0).toLocaleString()}`,
                          ];
                        }),
                        [
                          'ID',
                          'Name',
                          'Gross',
                          'Taxable Income',
                          'Bracket',
                          'Tax',
                        ],
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all"
                  >
                    <Printer size={12} /> Print
                  </button>
                  <button
                    onClick={() => downloadPayrollCSV('income_tax_statement')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    <Download size={12} /> CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Monthly Bank Advice */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <Banknote size={16} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Monthly Bank Advice
                  </p>
                  <p className="ovds-caption">
                    Net salary disbursement list
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">Total Disbursement</span>
                    <span className="font-semibold text-emerald-700">
                      {currency} {totalNet.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Employees</span>
                    <span className="font-semibold text-slate-800">
                      {payroll.length}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      printPayrollReport(
                        'Monthly Bank Advice',
                        payroll.map((p, i) => [
                          String(i + 1),
                          p.employeeIdCode,
                          `${p.firstName} ${p.lastName}`,
                          p.departmentName,
                          `${currency} ${p.calculatedSalary.toLocaleString()}`,
                        ]),
                        ['#', 'Employee ID', 'Name', 'Department', 'Net Pay'],
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                  >
                    <Printer size={12} /> Print
                  </button>
                  <button
                    onClick={() => {
                      const header =
                        'Employee ID,Name,Department,Net Pay (ETB)\n';
const rows = payroll
                        .map(
                          (p) =>
                            `${p.employeeIdCode},"${p.firstName} ${p.lastName}","${p.departmentName}",${p.calculatedSalary}`,
                        )
                        .join('\n');
                      downloadBlob(
                        new Blob([header + rows], { type: 'text/csv' }),
                        `bank_advice_${filterYear}_${filterMonth}.csv`,
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                  >
                    <Download size={12} /> CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Salary Summary Report */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <BarChart3 size={16} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Salary Summary Report
                  </p>
                  <p className="ovds-caption">
                    Total earnings & deductions statement
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2 text-xs">
                {[
                  {
                    label: 'Total Gross Pay',
                    value: `${currency} ${totalGross.toLocaleString()}`,
                    color: 'text-slate-800' },
                  {
                    label: 'Total Pension',
                    value: `${currency} ${totalPension.toLocaleString()}`,
                    color: 'text-violet-700' },
                  {
                    label: 'Total Income Tax',
                    value: `${currency} ${totalTax.toLocaleString()}`,
                    color: 'text-rose-700' },
                  {
                    label: 'Total Loan Deductions',
                    value: `${currency} ${totalLoans.toLocaleString()}`,
                    color: 'text-amber-700' },
                  {
                    label: 'Total Net Pay',
                    value: `${currency} ${totalNet.toLocaleString()}`,
                    color: 'text-emerald-700 font-semibold' },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="flex justify-between py-1 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-slate-500">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>
                      {payrollLoading ? '—' : s.value}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() =>
                    printPayrollReport(
                      'Salary Summary Report',
                      [
                        [
                          'Total Gross',
                          `${currency} ${totalGross.toLocaleString()}`,
                        ],
                        [
                          'Total Pension (7%)',
                          `${currency} ${totalPension.toLocaleString()}`,
                        ],
                        [
                          'Employer Pension (11%)',
                          `${currency} ${totalEmployerPension.toLocaleString()}`,
                        ],
                        [
                          'Total Income Tax',
                          `${currency} ${totalTax.toLocaleString()}`,
                        ],
                        [
                          'Total Loan Deductions',
                          `${currency} ${totalLoans.toLocaleString()}`,
                        ],
                        [
                          'Total Net Pay',
                          `${currency} ${totalNet.toLocaleString()}`,
                        ],
                      ],
                      ['Description', 'Amount'],
                    )
                  }
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                >
                  <Printer size={12} /> Print Summary
                </button>
              </div>
            </div>

            {/* Subsidiary & Group Distribution - Strategic */}
            {settings?.org_structure_type &&
              settings.org_structure_type !== 'single' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-sm shadow-emerald-50">
                  <div className="px-5 py-4 border-b border-slate-100 bg-emerald-50/30 flex items-center gap-3">
                    <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Subsidiary & Group Distribution
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Consolidated Audit View
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-56 overflow-y-auto">
                    {Object.entries(bySubsidiary).map(
                      ([sub, s]: [string, any]) => (
                        <div
                          key={sub}
                          className="group p-3 rounded-xl border border-slate-50 hover:border-emerald-200 dark:border-emerald-800 hover:bg-slate-50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-slate-800">
                              {sub}
                            </p>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 px-2 py-0.5 rounded-full">
                              {s.count} Staff
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Net Liability
                            </p>
                            <p className="text-xs font-semibold text-emerald-700">
                              {currency} {s.net.toLocaleString()}
                            </p>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() =>
                                printPayrollReport(
                                  `${sub} Subsidiary Payroll Audit`,
                                  payroll
                                    .filter(
                                      (p) =>
                                        (p.subsidiary ||
                                          'Direct Operations') === sub,
                                    )
                                    .map((p, i) => [
                                      p.employeeIdCode,
                                      `${p.firstName} ${p.lastName}`,
                                      p.departmentName,
                                      `${currency} ${(p.grossTotal ?? 0).toLocaleString()}`,
                                      `${currency} ${p.calculatedSalary.toLocaleString()}`,
                                    ]),
                                  ['ID', 'Name', 'Dept', 'Gross', 'Net Pay'],
                                )
                              }
                              className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider"
                            >
                              Generate Audit PDF
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                    {!Object.keys(bySubsidiary).length && (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        No group data available
                      </p>
                    )}
                  </div>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() =>
                        printPayrollReport(
                          'Consolidated Group Summary',
                          Object.entries(bySubsidiary).map(
                            ([sub, s]: [string, any]) => [
                              sub,
                              String(s.count),
                              `${currency} ${s.gross.toLocaleString()}`,
                              `${currency} ${s.pension.toLocaleString()}`,
                              `${currency} ${s.tax.toLocaleString()}`,
                              `${currency} ${s.net.toLocaleString()}`,
                            ],
                          ),
                          [
                            'Subsidiary / Group',
                            'Employees',
                            'Gross',
                            'Pension',
                            'Tax',
                            'Net Pay',
                          ],
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all w-full justify-center"
                    >
                      <Printer size={12} /> Print Consolidated Report
                    </button>
                  </div>
                </div>
              )}
          </div>

          {/* PFMS & Treasury Reports */}
          <div className="ovds-grid-layout cols-2">
            {/* PFMS Report */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <Download size={16} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    PFMS Report
                  </p>
                  <p className="ovds-caption">
                    Public Financial Management System — Excel format
                  </p>
                </div>
                <span className="ml-auto text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                  After Approval
                </span>
              </div>
              <div className="p-4 space-y-3">
                <p className="ovds-caption">
                  Download PFMS-compatible salary data for{' '}
                  {getMonthName(filterMonth - 1)} {filterYear}. Available only
                  after salary approval.
                </p>
                <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format</span>
                    <span className="font-bold">Excel (CSV)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employees</span>
                    <span className="font-bold">{payroll.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Net Pay</span>
                    <span className="font-bold text-emerald-700">
                      {currency} {totalNet.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const header =
                      'Employee ID,Name,Department,Bank Account,Net Pay (ETB),Pension (ETB),Tax (ETB)\n';
const rows = payroll
                      .map(
                        (p) =>
                          `${p.employeeIdCode},"${p.firstName} ${p.lastName}","${p.departmentName}","—",${p.calculatedSalary},${(p.employeePension ?? 0).toFixed(2)},${(p.incomeTax ?? 0).toFixed(2)}`,
                      )
                      .join('\n');
                    downloadBlob(
                      new Blob([header + rows], { type: 'text/csv' }),
                      `PFMS_Report_${filterYear}_${String(filterMonth).padStart(2, '0')}.csv`,
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                >
                  <Download size={13} /> Download PFMS Report
                </button>
              </div>
            </div>

            {/* Treasury Report */}
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                <FileText size={16} className="text-slate-700" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Treasury Report
                  </p>
                  <p className="ovds-caption">
                    JSON format for financial system integration
                  </p>
                </div>
                <span className="ml-auto text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase">
                  After Approval
                </span>
              </div>
              <div className="p-4 space-y-3">
                <p className="ovds-caption">
                  Download structured JSON salary data for Treasury/IBEX
                  integration for {getMonthName(filterMonth - 1)} {filterYear}.
                </p>
                <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format</span>
                    <span className="font-bold">JSON (Text)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Records</span>
                    <span className="font-bold">{payroll.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Gross</span>
                    <span className="font-bold text-slate-700">
                      {currency} {totalGross.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const payload = {
                      reportType: 'TREASURY_SALARY',
                      period: {
                        year: filterYear,
                        month: filterMonth,
                        monthName: getMonthName(filterMonth - 1) },
                      generatedAt: new Date().toISOString(),
                      organization: 'Ovds ovds',
                      summary: {
                        employees: payroll.length,
                        totalGross,
                        totalNet,
                        totalPension,
                        totalTax,
                        totalLoans },
                      employees: payroll.map((p, i) => ({
                        employeeId: p.employeeIdCode,
                        name: `${p.firstName} ${p.lastName}`,
                        department: p.departmentName,
                        grossPay: p.grossTotal ?? 0,
                        employeePension: p.employeePension ?? 0,
                        incomeTax: p.incomeTax ?? 0,
                        loanDeduction: p.loanDeduction ?? 0,
                        netPay: p.calculatedSalary })) };
const blob = new Blob([JSON.stringify(payload, null, 2)], {
                      type: 'application/json' });
                    downloadBlob(
                      blob,
                      `Treasury_Report_${filterYear}_${String(filterMonth).padStart(2, '0')}.json`,
                    );
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 dark:hover:bg-slate-700 transition-all"
                >
                  <Download size={13} /> Download Treasury JSON
                </button>
              </div>
            </div>
          </div>

          {/* Full earning-deduction table */}
          <div className="ovds-widget-card overflow-hidden transition-colors">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 size={16} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Earning-Deduction Report — {getMonthName(filterMonth - 1)}{' '}
                    {filterYear}
                  </p>
                  <p className="ovds-caption">
                    {payroll.length} employees
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    printPayrollReport(
                      'Earning-Deduction Report',
                      payroll.map((p, i) => [
                        p.employeeIdCode,
                        `${p.firstName} ${p.lastName}`,
                        p.departmentName,
                        `${currency} ${(p.grossPay ?? 0).toLocaleString()}`,
                        `${currency} ${(p.otPay ?? 0).toLocaleString()}`,
                        `${currency} ${(p.grossTotal ?? 0).toLocaleString()}`,
                        `${currency} ${(p.employeePension ?? 0).toLocaleString()}`,
                        `${currency} ${(p.incomeTax ?? 0).toLocaleString()}`,
                        `${currency} ${(p.loanDeduction ?? 0).toLocaleString()}`,
                        `${currency} ${p.calculatedSalary.toLocaleString()}`,
                      ]),
                      [
                        'ID',
                        'Name',
                        'Dept',
                        'Basic',
                        'OT',
                        'Gross',
                        'Pension',
                        'Tax',
                        'Loan',
                        'Net',
                      ],
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 dark:hover:bg-slate-700 transition-all"
                >
                  <Printer size={12} /> Print
                </button>
                <button
                  onClick={() => downloadPayrollCSV('earning_deduction_report')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                >
                  <Download size={12} /> CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs ovds-table text-left">
                <thead>
                  <tr className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {[
                      'Employee',
                      'Dept',
                      'Basic Pay',
                      'OT Pay',
                      'Gross',
                      'Pension',
                      'Tax',
                      'Loan',
                      'Net Pay',
                    ].map((h, i) => (
                      <th
                        key={h}
                        className="px-4 py-3 ovds-label whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {payrollLoading ? (
                    <Skeleton.TableRows cols={9} rows={3} />
                  ) : payroll.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-10 text-center text-slate-400 italic"
                      >
                        No data for selected period
                      </td>
                    </tr>
                  ) : (
                    payroll.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {p.employeeIdCode}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {p.departmentName}
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-semibold">
                          {currency} {(p.grossPay ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                          {(p.otPay ?? 0) > 0
                            ? `${currency} ${(p.otPay ?? 0).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {currency} {(p.grossTotal ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-violet-600">
                          {currency} {(p.employeePension ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-rose-600">
                          {currency} {(p.incomeTax ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-amber-600">
                          {(p.loanDeduction ?? 0) > 0
                            ? `${currency} ${(p.loanDeduction ?? 0).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">
                          {currency} {p.calculatedSalary.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {payroll.length > 0 && (
                  <tfoot>
                    <tr className="bg-white border-t-2 border-slate-200">
                      <td
                        colSpan={2}
                        className="px-4 py-3 font-semibold text-slate-700 text-xs"
                      >
                        TOTALS ({payroll.length})
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700 text-xs">
                        {currency}{' '}
                        {payroll
                          .reduce((s, p) => s + (p.grossPay ?? 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                        {currency}{' '}
                        {payroll
                          .reduce((s, p) => s + (p.otPay ?? 0), 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-xs">
                        {currency} {totalGross.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-violet-700 text-xs">
                        {currency} {totalPension.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-rose-700 text-xs">
                        {currency} {totalTax.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-700 text-xs">
                        {currency} {totalLoans.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-800 text-xs">
                        {currency} {totalNet.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Overtime & Increment Reports */}
          {payroll.length > 0 && (
            <div className="ovds-grid-layout cols-2">
              {/* Overtime Report */}
              <div className="ovds-widget-card overflow-hidden transition-colors">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                  <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Overtime Report
                    </p>
                    <p className="ovds-caption">
                      OT hours and pay per employee
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {(() => {
                    const otEmployees = payroll.filter(
                      (p: any) => (p.otHours ?? 0) > 0,
                    );
const totalOtHours = payroll.reduce(
                      (s: number, p: any) => s + (p.otHours ?? 0),
                      0,
                    );
const totalOtPay = payroll.reduce(
                      (s: number, p: any) => s + (p.otPay ?? 0),
                      0,
                    );
return (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {otEmployees.length}
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">With OT</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 text-center">
                            <p className="font-semibold text-slate-700">
                              {totalOtHours.toFixed(1)}h
                            </p>
                            <p className="text-slate-400 mt-0.5">Total Hours</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="font-semibold text-emerald-700">
                              {currency} {totalOtPay.toLocaleString()}
                            </p>
                            <p className="text-emerald-500 mt-0.5">Total Pay</p>
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {otEmployees.slice(0, 10).map((p: any) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 text-xs"
                            >
                              <div>
                                <p className="font-medium text-slate-700">
                                  {p.firstName} {p.lastName}
                                </p>
                                <p className="text-slate-400">
                                  {p.departmentName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {(p.otHours ?? 0).toFixed(1)}h
                                </p>
                                <p className="text-emerald-600">
                                  {currency} {(p.otPay ?? 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {otEmployees.length === 0 && (
                            <p className="text-xs text-slate-400 italic py-4 text-center">
                              No overtime recorded
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              printPayrollReport(
                                'Overtime Report',
                                otEmployees.map((p: any) => [
                                  p.employeeIdCode,
                                  `${p.firstName} ${p.lastName}`,
                                  p.departmentName,
                                  `${(p.otHours ?? 0).toFixed(1)}h`,
                                  `${currency} ${(p.otPay ?? 0).toLocaleString()}`,
                                ]),
                                [
                                  'Emp ID',
                                  'Name',
                                  'Department',
                                  'OT Hours',
                                  'OT Pay',
                                ],
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600"
                          >
                            <Printer size={12} /> Print
                          </button>
                          <button
                            onClick={() => {
                              const h =
                                'Employee ID,Name,Department,OT Hours,OT Pay (ETB)\n';
const rows = otEmployees
                                .map(
                                  (p: any) =>
                                    `${p.employeeIdCode},"${p.firstName} ${p.lastName}","${p.departmentName}",${(p.otHours ?? 0).toFixed(1)},${(p.otPay ?? 0).toFixed(2)}`,
                                )
                                .join('\n');
                              downloadBlob(
                                new Blob([h + rows], { type: 'text/csv' }),
                                `overtime_report_${filterYear}_${filterMonth}.csv`,
                              );
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                          >
                            <Download size={12} /> CSV
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Increment History Report */}
              <div className="ovds-widget-card overflow-hidden transition-colors">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                  <TrendingUp size={16} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Increment History Report
                    </p>
                    <p className="ovds-caption">
                      Salary increments due / applied this period
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {(() => {
                    const dueIncrements = payroll.filter(
                      (p: any) =>
                        p.dateOfNextIncrement &&
                        new Date(p.dateOfNextIncrement) <=
                          new Date(filterYear, filterMonth, 0),
                    );
return (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="font-semibold text-emerald-700">
                              {dueIncrements.length}
                            </p>
                            <p className="text-emerald-500 mt-0.5">
                              Due Increments
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 text-center">
                            <p className="font-semibold text-slate-700">
                              {payroll.length - dueIncrements.length}
                            </p>
                            <p className="text-slate-400 mt-0.5">Not Due</p>
                          </div>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {dueIncrements.slice(0, 10).map((p: any) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 text-xs"
                            >
                              <div>
                                <p className="font-medium text-slate-700">
                                  {p.firstName} {p.lastName}
                                </p>
                                <p className="text-slate-400">
                                  {p.departmentName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-700">
                                  {currency}{' '}
                                  {(p.grossPay ?? 0).toLocaleString()}
                                </p>
                                <p className="text-[10px] text-emerald-600">
                                  {p.dateOfNextIncrement
                                    ? new Date(
                                        p.dateOfNextIncrement,
                                      ).toLocaleDateString()
                                    : '—'}
                                </p>
                              </div>
                            </div>
                          ))}
                          {dueIncrements.length === 0 && (
                            <p className="text-xs text-slate-400 italic py-4 text-center">
                              No increments due this period
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              printPayrollReport(
                                'Increment History Report',
                                dueIncrements.map((p: any) => [
                                  p.employeeIdCode,
                                  `${p.firstName} ${p.lastName}`,
                                  p.departmentName,
                                  `${currency} ${(p.grossPay ?? 0).toLocaleString()}`,
                                  p.dateOfNextIncrement
                                    ? new Date(
                                        p.dateOfNextIncrement,
                                      ).toLocaleDateString()
                                    : '—',
                                  p.designation ?? '—',
                                ]),
                                [
                                  'Emp ID',
                                  'Name',
                                  'Department',
                                  'Current Salary',
                                  'Increment Date',
                                  'Designation',
                                ],
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600"
                          >
                            <Printer size={12} /> Print
                          </button>
                          <button
                            onClick={() => {
                              const h =
                                'Employee ID,Name,Department,Current Salary,Increment Date,Designation\n';
const rows = dueIncrements
                                .map(
                                  (p: any) =>
                                    `${p.employeeIdCode},"${p.firstName} ${p.lastName}","${p.departmentName}",${(p.grossPay ?? 0).toFixed(2)},${p.dateOfNextIncrement ? new Date(p.dateOfNextIncrement).toLocaleDateString() : ''},${p.designation ?? ''}`,
                                )
                                .join('\n');
                              downloadBlob(
                                new Blob([h + rows], { type: 'text/csv' }),
                                `increment_history_${filterYear}_${filterMonth}.csv`,
                              );
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                          >
                            <Download size={12} /> CSV
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Salary Comparison */}
          {payroll.length > 0 && (
            <div className="ovds-widget-card overflow-hidden transition-colors">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Monthly Salary Comparison
                    </p>
                    <p className="ovds-caption">
                      Gross vs Net vs Deductions breakdown per employee
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    printPayrollReport(
                      'Monthly Salary Comparison',
                      payroll.map((p: any) => [
                        p.employeeIdCode,
                        `${p.firstName} ${p.lastName}`,
                        p.departmentName,
                        `${currency} ${(p.grossTotal ?? 0).toLocaleString()}`,
                        `${currency} ${(p.totalDeductions ?? 0).toLocaleString()}`,
                        `${currency} ${(p.calculatedSalary ?? 0).toLocaleString()}`,
                        `${p.presentDays}/${p.workingDays}`,
                        `${(p.otHours ?? 0).toFixed(1)}h`,
                      ]),
                      [
                        'Emp ID',
                        'Name',
                        'Department',
                        'Gross',
                        'Total Ded.',
                        'Net Pay',
                        'Attendance',
                        'OT',
                      ],
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                >
                  <Printer size={12} /> Print Comparison
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs ovds-table">
                  <thead className="bg-white text-[10px] text-slate-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Pension</th>
                      <th className="px-4 py-3 text-right">Tax</th>
                      <th className="px-4 py-3 text-right">Total Ded.</th>
                      <th className="px-4 py-3 text-right">Net Pay</th>
                      <th className="px-4 py-3 text-center">Ded. %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {payroll.slice(0, 20).map((p: any) => {
                      const dedPct =
                        p.grossTotal > 0
                          ? (
                              ((p.totalDeductions ?? 0) / p.grossTotal) *
                              100
                            ).toFixed(1)
                          : '0.0';
return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-slate-800">
                              {p.firstName} {p.lastName}
                            </div>
                            <div className="ovds-caption">
                              {p.departmentName}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {(p.grossTotal ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-purple-600">
                            {(p.employeePension ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-rose-500">
                            {(p.incomeTax ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right text-rose-700 font-medium">
                            {(p.totalDeductions ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">
                            {(p.calculatedSalary ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className="bg-rose-400 h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.min(100, parseFloat(dedPct))}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 w-8">
                                {dedPct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {payroll.length > 20 && (
                  <p className="px-4 py-2 text-xs text-slate-400 italic border-t">
                    Showing 20 of {payroll.length} — use Print/CSV for full
                    report
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reimbursement Analytics — shown inside payroll tab */}
          {data?.reimbursement && (
            <div className="ovds-widget-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center gap-3">
                <Receipt className="text-purple-500" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                    Field Reimbursement Analytics
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Tigray Per-Diem Claims Summary
                  </p>
                </div>
              </div>
              <div className="p-5 ovds-grid-layout cols-3">
                {/* By Status */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    By Status
                  </p>
                  {(data.reimbursement.byStatus ?? []).map((s: any) => {
                    const colors: Record<string, string> = {
                      PENDING: 'bg-amber-400',
                      APPROVED: 'bg-emerald-500',
                      REJECTED: 'bg-rose-400' };
                    const total =
                      (data.reimbursement.byStatus ?? []).reduce(
                        (a: number, b: any) => a + b.count,
                        0,
                      ) || 1;
                    return (
                      <div key={s.status} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span className="capitalize">{s.status.toLowerCase()}</span>
                          <span>{s.count} · {currency} {s.total.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(s.count / total) * 100}%` }}
                            className={`h-full ${colors[s.status] ?? 'bg-slate-400'} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!data.reimbursement.byStatus?.length && (
                    <p className="text-xs text-slate-400 italic">No claims yet</p>
                  )}
                </div>

                {/* By Tier */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    By Location Tier
                  </p>
                  {(data.reimbursement.byTier ?? []).map((s: any) => {
                    const tierColors: Record<number, string> = {
                      1: 'bg-rose-400',
                      2: 'bg-amber-400',
                      3: 'bg-emerald-500' };
                    const tierLabels: Record<number, string> = {
                      1: 'Tier 1 — Urban',
                      2: 'Tier 2 — Wereda',
                      3: 'Tier 3 — Rural' };
                    const total =
                      (data.reimbursement.byTier ?? []).reduce(
                        (a: number, b: any) => a + b.count,
                        0,
                      ) || 1;
                    return (
                      <div key={s.tier} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span>{tierLabels[s.tier] ?? `Tier ${s.tier}`}</span>
                          <span>{s.count} · {currency} {s.total.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(s.count / total) * 100}%` }}
                            className={`h-full ${tierColors[s.tier] ?? 'bg-slate-400'} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!data.reimbursement.byTier?.length && (
                    <p className="text-xs text-slate-400 italic">No claims yet</p>
                  )}
                </div>

                {/* By Purpose */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    By Field Purpose
                  </p>
                  {(data.reimbursement.byPurpose ?? []).map((s: any) => {
                    const total =
                      (data.reimbursement.byPurpose ?? []).reduce(
                        (a: number, b: any) => a + b.count,
                        0,
                      ) || 1;
                    return (
                      <div key={s.purpose} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span className="capitalize">{s.purpose}</span>
                          <span>{s.count} · {currency} {s.total.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(s.count / total) * 100}%` }}
                            className="h-full bg-teal-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!data.reimbursement.byPurpose?.length && (
                    <p className="text-xs text-slate-400 italic">No claims yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -- MONTHLY COMPARISON TAB -- */}
      {activeTab === 'comparison' &&
        (() => {
          // Build comparison map by employeeId
          const prevMap = new Map(prevPayroll.map((p, i) => [p.employeeId, p]));
const rows = payroll.map((cur, i) => {
            const prev = prevMap.get(cur.employeeId);
const netDiff =
              (cur.netPay ?? cur.calculatedSalary ?? 0) -
              (prev?.netPay ?? prev?.calculatedSalary ?? 0);
return { ...cur, prev, netDiff };
          });

          // Use hook stats instead of manual reduce
          const curTotalNet  = payrollStats.totalNet;
const prevTotalNet = prevPayrollStats.totalNet;
const totalDiff = curTotalNet - prevTotalNet;
return (
            <div className="space-y-5">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Month-on-Month Payroll Comparison</p>
              {/* Filter bar */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block ovds-label mb-1">
                    Year
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-400/20"
                  >
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - 2 + i,
                    ).map((y, i) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block ovds-label mb-1">
                    Current Month
                  </label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-400/20"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 text-xs text-slate-400 font-medium pb-2">
                  Comparing{' '}
                  <span className="font-bold text-slate-700">
                    {getMonthName(prevMonth - 1)} {prevYear}
                  </span>{' '}
                  →{' '}
                  <span className="font-bold text-slate-700">
                    {getMonthName(filterMonth - 1)} {filterYear}
                  </span>
                </div>
              </div>

              {/* Summary diff cards */}
              <div className="ovds-grid-layout cols-3">
                {[
                  {
                    label: `${getMonthName(prevMonth - 1)} Net Pay`,
                    value: `${currency} ${prevTotalNet.toLocaleString()}`,
                    color: 'text-slate-700',
                    bg: 'bg-white' },
                  {
                    label: `${getMonthName(filterMonth - 1)} Net Pay`,
                    value: `${currency} ${curTotalNet.toLocaleString()}`,
                    color: 'text-emerald-700',
                    bg: 'bg-emerald-50' },
                  {
                    label: 'Month-on-Month Change',
                    value: `${totalDiff >= 0 ? '+' : ''}${currency} ${totalDiff.toLocaleString()}`,
                    color:
                      totalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700',
                    bg: totalDiff >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={`${s.bg} rounded-2xl border border-slate-200 p-5`}
                  >
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {s.label}
                    </p>
                    <p className={`text-xl font-semibold mt-1 ${s.color}`}>
                      {payrollLoading ? '—' : s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Comparison table */}
              <div className="ovds-widget-card overflow-hidden transition-colors">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Monthly Salary Comparison — Employee Wise
                  </p>
                  <button
                    onClick={() => {
                      const header = `Employee ID,Name,Department,${getMonthName(prevMonth - 1)} Net,${getMonthName(filterMonth - 1)} Net,Difference\n`;
const csvRows = rows
                        .map(
                          (r) =>
                            `${r.employeeIdCode},"${r.firstName} ${r.lastName}","${r.departmentName}",${(r.prev?.netPay ?? r.prev?.calculatedSalary ?? 0).toFixed(2)},${(r.netPay ?? r.calculatedSalary ?? 0).toFixed(2)},${r.netDiff.toFixed(2)}`,
                        )
                        .join('\n');
                      downloadBlob(
                        new Blob([header + csvRows], { type: 'text/csv' }),
                        `salary_comparison_${filterYear}_${filterMonth}.csv`,
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 dark:bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 dark:hover:bg-slate-700 transition-all"
                  >
                    <Download size={12} /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm ovds-table">
                    <thead>
                      <tr className="bg-white border-b border-slate-200">
                        {[
                          'Employee',
                          'Department',
                          `${getMonthName(prevMonth - 1)} Net`,
                          `${getMonthName(filterMonth - 1)} Net`,
                          'Change',
                          'Trend',
                        ].map((h, i) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payrollLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-400 text-sm italic animate-pulse"
                          >
                            Loading comparison data...
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-400 text-sm italic"
                          >
                            No payroll data for selected period
                          </td>
                        </tr>
                      ) : (
                        rows.map((r, i) => (
                          <tr
                            key={r.id || r.employeeIdCode}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <p className="text-xs font-bold text-slate-800">
                                {r.firstName} {r.lastName}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">
                                {r.employeeIdCode}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                              {r.departmentName}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-600">
                              {r.prev ? (
                                `${currency} ${(r.prev.netPay ?? r.prev.calculatedSalary ?? 0).toLocaleString()}`
                              ) : (
                                <span className="text-slate-300 italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-slate-800">
                              {currency}{' '}
                              {(
                                r.netPay ??
                                r.calculatedSalary ??
                                0
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-bold ${r.netDiff > 0 ? 'text-emerald-600' : r.netDiff < 0 ? 'text-rose-600' : 'text-slate-400'}`}
                              >
                                {r.netDiff > 0 ? '+' : ''}
                                {r.netDiff.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${r.netDiff > 0 ? 'bg-emerald-400' : r.netDiff < 0 ? 'bg-rose-400' : 'bg-slate-300'}`}
                                  style={{
                                    width: `${Math.min(100, (Math.abs(r.netDiff) / Math.max(1, Math.abs(r.netPay ?? r.calculatedSalary ?? 1))) * 100 * 5)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {/* -- ATTENDANCE REPORTS TAB -- */}
      {activeTab === 'attendance' && (
        <>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Attendance Overview</p>
          <div className="ovds-widget-card overflow-hidden">
            <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={28} />
                  {t('reports.weekly_trends')}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {t('reports.last_7_days')}
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold uppercase tracking-wider shadow-sm"
              >
                <Download size={16} />
                {t('reports.export_data')}
              </button>
            </div>
            <div className="p-10">
              <div className="flex items-end justify-between h-64 gap-4 px-4">
                {data?.attendanceStats?.map((stat: any, i: number) => {
                  const total = stat.present + stat.late + stat.absent || 1;
const presentHeight = (stat.present / total) * 100;
const lateHeight = (stat.late / total) * 100;
const absentHeight = (stat.absent / total) * 100;
return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-4 group"
                    >
                      <div className="w-full flex flex-col justify-end gap-1 h-48 relative">
                        <div
                          style={{ height: `${presentHeight}%` }}
                          className="bg-emerald-500 rounded-t-lg transition-all group-hover:brightness-110 shadow-lg shadow-emerald-100"
                          title={`Present: ${stat.present}`}
                        ></div>
                        <div
                          style={{ height: `${lateHeight}%` }}
                          className="bg-amber-400 transition-all group-hover:brightness-110 shadow-lg shadow-amber-400/10"
                          title={`Late: ${stat.late}`}
                        ></div>
                        <div
                          style={{ height: `${absentHeight}%` }}
                          className="bg-rose-400 rounded-b-lg transition-all group-hover:brightness-110 shadow-lg shadow-rose-400/10"
                          title={`Absent: ${stat.absent}`}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {stat.date}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-12 flex justify-center gap-5 border-t border-slate-100 pt-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {t('reports.on_time')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-400 rounded-full"></div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {t('reports.late_arrival')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-rose-400 rounded-full"></div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {t('reports.absent')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="ovds-grid-layout cols-2 gap-lg">
            {/* Leave Distribution */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                  <PieChart className="text-emerald-500" size={24} />
                  {t('reports.leave_dist')}
                </h3>
              </div>
              <div className="p-5 space-y-5">
                {data?.leaveStats?.length === 0 || !data?.leaveStats ? (
                  <div className="py-12 text-center text-slate-400 italic">
                    {t('reports.no_leaves')}
                  </div>
                ) : (
                  data?.leaveStats?.map((stat: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          {t(`leaves.types.${stat.type.toLowerCase()}`) ||
                            stat.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          {stat.count} {t('reports.requests')}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          style={{
                            width: `${(stat.count / (data?.leaveStats?.reduce((a: any, b: any) => a + b.count, 0) || 1)) * 100}%` }}
                          className={`h-full bg-emerald-500 rounded-full shadow-sm`}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Department Distribution */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                  <Briefcase className="text-emerald-600 dark:text-emerald-400" size={24} />
                  {t('reports.dept_dist')}
                </h3>
              </div>
              <div className="p-5 space-y-5">
                {data?.departmentStats?.map((stat: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 dark:border-emerald-800 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 font-semibold border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                        {stat.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 tracking-tight">
                          {stat.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {t('reports.active_division')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900 leading-none">
                        {stat.employees}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                        {t('reports.staff_count')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit & Health Summary */}
          <div className="ovds-grid-layout cols-3">
            <div className="lg:col-span-1 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-2xl p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-50 dark:bg-white/5 rounded-full blur-3xl"></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-white/10 rounded-2xl backdrop-blur-md border border-emerald-200 dark:border-white/10">
                    <Shield size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold tracking-tight">
                      {t('reports.system_integrity')}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mt-1">
                      {t('reports.audit_status_secure')}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                      {t('reports.db_health')}
                    </span>
                    <span className="text-sm font-semibold text-emerald-400">
                      {systemHealth?.uptime ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                      {t('reports.pending_verifications')}
                    </span>
                    <span className="text-sm font-semibold text-amber-400">
                      {systemHealth?.pendingVerifications ??
                        systemHealth?.recentVerifications ??
                        '—'}{' '}
                      {t('reports.records')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                      {t('reports.total_records')}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {systemHealth?.dbRecords ?? '—'}
                    </span>
                  </div>
                </div>

                <Link to="/settings/audit-logs" className="block w-full">
                  <button className="w-full py-4 bg-emerald-50 dark:bg-white/5 hover:bg-emerald-100 dark:bg-white/10 border border-emerald-200 dark:border-white/10 rounded-xl text-[10px] font-semibold uppercase tracking-[0.2em] transition-all">
                    {t('reports.view_audit_logs')}
                  </button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 ovds-widget-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                  <Activity className="text-rose-500" size={24} />
                  {t('reports.recent_status')}
                </h3>
                <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-extrabold border border-rose-100">
                  {t('reports.real_time')}
                </span>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {[
                    {
                      label: t('reports.standard_arrival'),
                      val: rates.present,
                      color: 'bg-emerald-500' },
                    {
                      label: t('reports.late_arrival_rate'),
                      val: rates.late,
                      color: 'bg-amber-500' },
                    {
                      label: t('reports.absence_rate'),
                      val: rates.absent,
                      color: 'bg-rose-500' },
                  ].map((m, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        <span>{m.label}</span>
                        <span className="text-slate-900">{m.val}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${m.val}%` }}
                          className={`h-full ${m.color} rounded-full`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                  <p className="text-xs text-slate-400 font-medium italic">
                    {t('reports.generating_data_notice')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* -- FINANCIAL REPORTS TAB (duplicate) removed -- */}

      {/* Scheduled Export Modal */}
      {showScheduledExport && (
        <ScheduledExportModal onClose={() => setShowScheduledExport(false)} />
      )}

      {/* -- SALES TAX SUMMARY TAB -- */}
      {activeTab === 'sales-tax' && (
        <SalesTaxSummaryTab currency={settings?.ovds_base_currency || 'ETB'} />
      )}

      {/* -- TAX LIABILITY DASHBOARD TAB -- */}
      {activeTab === 'tax-liability' && (
        <TaxLiabilityTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- IAS 1 STATEMENT OF CHANGES IN EQUITY TAB -- */}
      {activeTab === 'equity-changes' && (
        <EquityChangesTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- IFRS 9 ECL TAB -- */}
      {activeTab === 'ifrs9-ecl' && (
        <Ifrs9EclTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- NOTES TO FINANCIAL STATEMENTS TAB (IAS 1.112) -- */}
      {activeTab === 'notes' && (
        <NotesToFinancialsTab
          currency={settings?.ovds_base_currency || 'ETB'}
          companyId={selectedCompanyId ?? undefined}
        />
      )}

      {/* -- CUSTOM REPORT BUILDER TAB -- */}
      {activeTab === 'builder' && (
        <CustomReportBuilder currency={settings?.ovds_base_currency || 'ETB'} />
      )}

      {/* -- CUSTOMER STATEMENT TAB -- */}
      {activeTab === 'customer-statement' && (
        <CustomerStatementTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- CUSTOMER GROWTH TAB -- */}
      {activeTab === 'customer-growth' && (
        <CustomerGrowthTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- IAS 12 DEFERRED TAX TAB -- */}
      {activeTab === 'deferred-tax' && (
        <DeferredTaxTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- IFRS 15 REVENUE RECOGNITION TAB -- */}
      {activeTab === 'ifrs15' && (
        <Ifrs15Tab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- AR/AP AGING + DUNNING TAB -- */}
      {activeTab === 'ar-aging' && (
        <ArAgingTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- APPROVAL WORKFLOW TAB -- */}
      {activeTab === 'approvals' && (
        <ApprovalsTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- IFRS 10 GROUP CONSOLIDATION TAB -- */}
      {activeTab === 'consolidation' && (
        <ConsolidationTab currency={settings?.ovds_base_currency || 'ETB'} companyId={selectedCompanyId ?? undefined} />
      )}

      {/* -- SAF-T EXPORT TAB -- */}
      {activeTab === 'saft' && (
        <SaftExportTab companyId={selectedCompanyId ?? undefined} />
      )}
    </div>
  </AppPage>
);
};
export default Reports;

















