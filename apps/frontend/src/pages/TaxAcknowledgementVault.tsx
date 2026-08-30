/**
 * Tax Acknowledgement Vault
 * ─────────────────────────────────────────────────────────────────────────────
 * Secure digital vault for all MoR eTax submission receipts and ERCA reference
 * numbers. Serves as conclusive legal proof of timely filing.
 *
 * Proclamation references:
 *   - Proclamation No. 983/2016 Art. 21: Filing records must be kept ≥ 5 years
 *   - Proclamation No. 1395/2025 Art. 95: Monthly WHT remittance deadline
 *   - Proclamation No. 1341/2024 Art. 24: VAT return acknowledgement
 *
 * Ovds-inspired UI: white cards · teal accents · status pills
 */
import React, { useState, useCallback } from 'react';
import {
  ShieldCheck, Download, RefreshCw, Search, CheckCircle2,
  XCircle, Clock, AlertTriangle, FileText, ExternalLink,
  Copy, Filter, ChevronDown, Archive, Send, MessageSquare,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtDate, fmtCurrency } from '../utils/fmt';
import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  EmptyState, Pagination, SearchBar,
} from '../components/ui';

// ── Types ──────────────────────────────────────────────────────────────────

interface SubmissionRecord {
  id: string;
  period: string;
  submissionType: string;
  status: string;
  ercaReferenceNo: string | null;
  totalPayable: number;
  submittedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  mode: string;
  submittedBy: string | null;
  createdAt: string;
}

// ── Status meta ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string; icon: React.ReactNode }> = {
  ACCEPTED:  { label: 'Accepted',  dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 size={12} /> },
  SUBMITTED: { label: 'Submitted', dot: 'bg-sky-400',     bg: 'bg-sky-50',     text: 'text-sky-700',     icon: <Send size={12} /> },
  PENDING:   { label: 'Pending',   dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   icon: <Clock size={12} /> },
  REJECTED:  { label: 'Rejected',  dot: 'bg-rose-400',    bg: 'bg-rose-50',    text: 'text-rose-700',    icon: <XCircle size={12} /> },
  DRAFT:     { label: 'Draft',     dot: 'bg-slate-300',   bg: 'bg-slate-50',   text: 'text-slate-600',   icon: <FileText size={12} /> },
  FAILED:    { label: 'Failed',    dot: 'bg-rose-400',    bg: 'bg-rose-50',    text: 'text-rose-700',    icon: <AlertTriangle size={12} /> },
};

const TYPE_LABELS: Record<string, string> = {
  VAT_RETURN:       'VAT Return',
  TOT_RETURN:       'TOT Return',
  PAYE:             'PAYE Declaration',
  WHT:              'WHT Remittance',
  BIT_PROVISIONAL:  'BIT Provisional',
  BIT_ANNUAL:       'BIT Annual',
};

// ── KPI Card ───────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string; textColor: string;
}> = ({ label, value, sub, icon, accent, textColor }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      <span className={textColor}>{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums leading-tight ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Status Pill ────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const m = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const TaxAcknowledgementVault: React.FC = () => {
  usePageTitle('Tax Acknowledgement Vault');
  const { selectedCompanyId } = useBusiness();

  const [search,   setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['etax-submissions', selectedCompanyId, page, typeFilter, statusFilter],
    queryFn: () =>
      api.get('/vat/etax-submissions', {
        params: {
          companyId:  selectedCompanyId,
          page,
          limit: 20,
          ...(typeFilter   !== 'ALL' ? { submissionType: typeFilter }   : {}),
          ...(statusFilter !== 'ALL' ? { status: statusFilter }         : {}),
        },
      }).then((r: any) => r.data?.data ?? r.data),
  });

  const records: SubmissionRecord[] = Array.isArray(data?.data) ? data.data
    : Array.isArray(data) ? data : [];
  const total: number  = data?.total ?? records.length;
  const pages: number  = data?.pages ?? 1;

  // ── KPI aggregates ─────────────────────────────────────────────────────

  const kpis = {
    total:    records.length,
    accepted: records.filter(r => r.status === 'ACCEPTED').length,
    pending:  records.filter(r => ['PENDING','SUBMITTED','DRAFT'].includes(r.status)).length,
    rejected: records.filter(r => ['REJECTED','FAILED'].includes(r.status)).length,
    totalPayable: records.reduce((s, r) => s + Number(r.totalPayable ?? 0), 0),
  };

  // ── Copy reference to clipboard ────────────────────────────────────────

  const copyRef = useCallback((ref: string) => {
    navigator.clipboard.writeText(ref)
      .then(() => toast.success('Reference copied'))
      .catch(() => toast.error('Copy failed'));
  }, []);

  // ── Export CSV ─────────────────────────────────────────────────────────

  const exportCsv = useCallback(() => {
    if (!records.length) { toast.error('No records to export'); return; }
    const headers = ['Period','Type','Status','ERCA Reference','Amount (ETB)','Submitted At','Accepted At','Mode'];
    const rows = records.map(r => [
      r.period,
      TYPE_LABELS[r.submissionType] ?? r.submissionType,
      r.status,
      r.ercaReferenceNo ?? '',
      Number(r.totalPayable).toFixed(2),
      r.submittedAt ? fmtDate(r.submittedAt) : '',
      r.acceptedAt  ? fmtDate(r.acceptedAt)  : '',
      r.mode,
    ]);
    const csv = [headers, ...rows].map(row =>
      row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `mor-acknowledgements-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Vault exported');
  }, [records]);

  // ── Filtered records ───────────────────────────────────────────────────

  const filtered = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.period.includes(q) ||
      (r.ercaReferenceNo ?? '').toLowerCase().includes(q) ||
      (TYPE_LABELS[r.submissionType] ?? r.submissionType).toLowerCase().includes(q)
    );
  });

  return (
    <AppPage
      title="Tax Acknowledgement Vault"
      subtitle="Legal proof of timely MoR eTax filings — kept for 5 years per Proc. 983/2016 Art. 21"
      icon={<Archive size={22} />}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors ${
              showFilters ? 'bg-teal-50 border-teal-300 text-teal-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} /> Filters <ChevronDown size={12} className={showFilters ? 'rotate-180' : ''} />
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-teal-500 hover:border-teal-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      }
    >

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Filings"  value={kpis.total}
          icon={<Archive size={18} />}
          accent="bg-teal-50" textColor="text-teal-600" />
        <KpiCard label="Accepted"       value={kpis.accepted}
          sub="by MoR portal"
          icon={<CheckCircle2 size={18} />}
          accent="bg-emerald-50" textColor="text-emerald-600" />
        <KpiCard label="Pending / Draft" value={kpis.pending}
          icon={<Clock size={18} />}
          accent="bg-amber-50" textColor="text-amber-600" />
        <KpiCard label="Total Payable"  value={fmtCurrency(kpis.totalPayable, 'ETB')}
          sub="all periods"
          icon={<ShieldCheck size={18} />}
          accent="bg-violet-50" textColor="text-violet-600" />
      </div>

      {/* ── Legal notice ───────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5 py-4 bg-teal-50 border border-teal-200 rounded-2xl mb-4">
        <ShieldCheck size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-teal-800">Legal Filing Records</p>
          <p className="text-xs text-teal-600 mt-0.5">
            All eTax submission receipts and ERCA reference numbers are stored here as
            conclusive legal proof of timely filing. Records are retained for a minimum
            of 5 years per <strong>Proclamation No. 983/2016 Art. 21</strong> (Tax Administration).
            ERCA references can be verified at{' '}
            <a href="https://etax.mor.gov.et" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-teal-800">etax.mor.gov.et</a>.
          </p>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Tax Type</p>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'VAT_RETURN', 'TOT_RETURN', 'PAYE', 'WHT', 'BIT_PROVISIONAL'].map(t => (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    typeFilter === t
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
                  }`}>
                  {t === 'ALL' ? 'All Types' : TYPE_LABELS[t] ?? t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {['ALL','ACCEPTED','PENDING','REJECTED','DRAFT'].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    statusFilter === s
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
                  }`}>
                  {s === 'ALL' ? 'All Statuses' : (STATUS_META[s]?.label ?? s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Search + table card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Search bar */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all max-w-sm">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search period, type, reference…"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <AppTable loading={isLoading}>
          <thead>
            <tr className="bg-slate-50/50">
              <AppTh>Period</AppTh>
              <AppTh>Tax Type</AppTh>
              <AppTh>ERCA Reference</AppTh>
              <AppTh align="right">Amount (ETB)</AppTh>
              <AppTh>Status</AppTh>
              <AppTh>Submitted</AppTh>
              <AppTh>Accepted</AppTh>
              <AppTh>Mode</AppTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(record => (
              <AppTr key={record.id}>

                {/* Period */}
                <AppTd>
                  <span className="font-mono text-sm font-semibold text-slate-800">
                    {record.period}
                  </span>
                </AppTd>

                {/* Tax type */}
                <AppTd>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold">
                    <FileText size={11} />
                    {TYPE_LABELS[record.submissionType] ?? record.submissionType}
                  </span>
                </AppTd>

                {/* ERCA Reference */}
                <AppTd>
                  {record.ercaReferenceNo ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {record.ercaReferenceNo}
                      </span>
                      <button
                        onClick={() => copyRef(record.ercaReferenceNo!)}
                        className="p-1 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-teal-50 transition-colors"
                        title="Copy reference"
                      >
                        <Copy size={12} />
                      </button>
                      <a
                        href="https://etax.mor.gov.et"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-teal-50 transition-colors"
                        title="Verify on MoR portal"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 italic">—</span>
                  )}
                </AppTd>

                {/* Amount */}
                <AppTd align="right">
                  <span className="font-semibold text-sm text-slate-800 tabular-nums">
                    {fmtCurrency(Number(record.totalPayable), 'ETB')}
                  </span>
                </AppTd>

                {/* Status */}
                <AppTd><StatusPill status={record.status} /></AppTd>

                {/* Submitted at */}
                <AppTd>
                  <span className="text-xs text-slate-500">
                    {record.submittedAt ? fmtDate(record.submittedAt) : '—'}
                  </span>
                </AppTd>

                {/* Accepted at */}
                <AppTd>
                  {record.acceptedAt ? (
                    <span className="text-xs text-emerald-600 font-semibold">
                      {fmtDate(record.acceptedAt)}
                    </span>
                  ) : record.rejectedAt ? (
                    <span className="text-xs text-rose-500 font-semibold" title={record.rejectionReason ?? ''}>
                      Rejected {fmtDate(record.rejectedAt)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </AppTd>

                {/* Mode */}
                <AppTd>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    record.mode === 'live'    ? 'bg-emerald-50 text-emerald-600' :
                    record.mode === 'sandbox' ? 'bg-amber-50 text-amber-600'    :
                                                'bg-slate-100 text-slate-500'
                  }`}>
                    {record.mode}
                  </span>
                </AppTd>

              </AppTr>
            ))}
          </tbody>
        </AppTable>

        {filtered.length === 0 && !isLoading && (
          <div className="py-16">
            <EmptyState
              title="No submission records"
              description="eTax submissions will appear here once you file through the Tax Filing or VAT Administration pages."
            />
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="mt-4">
          <Pagination page={page} pages={pages} total={total} onChange={setPage} />
        </div>
      )}

      {/* ── Simulated MoR SMS inbox ─────────────────────────────────────── */}
      <div className="mt-6">
        <MorSmsInbox />
      </div>

    </AppPage>
  );
};

// ── Simulated MoR SMS Inbox ───────────────────────────────────────────────────
// Renders the Ministry of Revenues SMS messages a company would receive across
// the declaration lifecycle. Backed by the tax module's MoR SMS simulation.

const MOR_SMS_EVENT_META: Record<string, { label: string; color: string }> = {
  FILING_SUBMITTED: { label: 'Filing Received',  color: 'bg-sky-500' },
  ACK_RECEIVED:     { label: 'Acknowledgement',  color: 'bg-emerald-500' },
  PAYMENT_DUE:      { label: 'Payment Reminder', color: 'bg-amber-500' },
  OVERDUE:          { label: 'Overdue Notice',   color: 'bg-rose-500' },
  PENALTY:          { label: 'Penalty Assessed', color: 'bg-rose-600' },
  REGISTRATION:     { label: 'Registration',    color: 'bg-teal-500' },
};

interface MorSmsDto {
  from: string;
  to: string;
  event: string;
  body: string;
  sentAt: string;
}

const MorSmsInbox: React.FC = () => {
  const { data, isLoading } = useQuery<MorSmsDto[]>({
    queryKey: ['mor-sms-sample'],
    queryFn: async () => {
      const res = await api.get('/tax/mor-sms/sample', {
        headers: { 'x-background': '1' },
      } as any);
      return (res.data?.data ?? res.data ?? []) as MorSmsDto[];
    },
  });

  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="ovds-widget-header flex items-center justify-between">
        <h3 className="ovds-card-title flex items-center gap-2">
          <MessageSquare size={15} /> Simulated MoR SMS Inbox
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Ministry of Revenues
        </span>
      </div>
      <div className="p-5">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading messages…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-xs text-slate-400">No simulated messages.</p>
        ) : (
          <div className="space-y-3">
            {data.map((m, i) => {
              const meta = MOR_SMS_EVENT_META[m.event] ?? { label: m.event, color: 'bg-slate-500' };
              return (
                <div key={i} className="flex gap-3">
                  <div className={`w-1.5 self-stretch rounded-full ${meta.color}`} />
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400">To: {m.to}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{m.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxAcknowledgementVault;
