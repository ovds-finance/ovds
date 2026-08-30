/**
 * Sub-Ledger — Accounts Receivable & Accounts Payable
 * IAS 1 — drill-through from financial statements to individual transaction level
 *
 * AR Sub-Ledger: customer balances, aged analysis, outstanding invoices
 * AP Sub-Ledger: vendor balances, aged analysis, outstanding bills
 * GL Inquiry:    full general ledger drill-through per account
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Amount, StatusBadge,
} from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import { useInterval } from '../hooks';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadBlob } from '../utils/download';
import {
  useArSummary,
  useArCustomers,
  useApVendors,
  useApSummary,
  fetchGlEntries,
  fetchArTransactions,
} from '../services/newTaxApi';

const today  = new Date().toISOString().slice(0, 10);
const fmt    = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK   = (n: number) => Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : fmt(n);

const AGING_BUCKETS = [
  { label: 'Current',   max: 0,   color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  { label: '1–30 days', max: 30,  color: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50' },
  { label: '31–60',     max: 60,  color: 'bg-orange-500',  text: 'text-orange-700',  bg: 'bg-orange-50' },
  { label: '61–90',     max: 90,  color: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50' },
  { label: '> 90 days', max: 9999,color: 'bg-rose-700',     text: 'text-rose-700',     bg: 'bg-rose-50' },
];

// -- AR Sub-Ledger Tab ---------------------------------------------------------
const ARTab: React.FC<{ companyId?: string; asOf: string }> = ({ companyId, asOf }) => {
  const { data: summary }                           = useArSummary(asOf, companyId);
  const { customers: data, loading, refetch: fetch } = useArCustomers(asOf, companyId);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [txns, setTxns]       = useState<any[]>([]);

  const openDrillDown = async (customerId: string) => {
    setSelected(customerId);
    try {
      setTxns(await fetchArTransactions(customerId, asOf, companyId));
    } catch { toast.error('Failed to load transactions'); }
  };

  const filtered = search
    ? (data ?? []).filter((d: any) => d.customerName?.toLowerCase().includes(search.toLowerCase()) || d.customerId?.toLowerCase().includes(search.toLowerCase()))
    : (data ?? []);

  const totalAR      = summary?.totalOutstanding ?? filtered.reduce((s: number, r: any) => s + Number(r.outstanding ?? 0), 0);
  const totalOverdue = summary?.totalOverdue ?? filtered.reduce((s: number, r: any) => s + Number(r.overdue ?? 0), 0);
  const totalCurrent = summary?.totalCurrent ?? filtered.reduce((s: number, r: any) => s + Number(r.current ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="ovds-grid-layout cols-4 gap-sm">
        {[
          { label: 'Total AR',      value: totalAR,      accent: 'bg-slate-500' },
          { label: 'Current',       value: totalCurrent, accent: 'bg-emerald-500' },
          { label: 'Overdue',       value: totalOverdue, accent: 'bg-rose-500' },
          { label: 'Customers',     value: data.length,  isCount: true, accent: 'bg-sky-500' },
        ].map(k => (
          <div key={k.label} className="ovds-widget-card p-4">
            <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p className={`ovds-value-sm tabular-nums mt-1 ${!k.isCount && k.value < 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
              {k.isCount ? k.value : fmtK(k.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Aging summary bar */}
      {summary?.aging && (
        <div className="ovds-widget-card p-5">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Aging Summary — As at {new Date(asOf).toLocaleDateString()}</p>
          <div className="ovds-grid-layout cols-5 gap-sm">
            {AGING_BUCKETS.map((b, i) => {
              const val = summary.aging?.[i] ?? 0;
              const pct = totalAR > 0 ? (val / totalAR * 100).toFixed(0) : 0;
              return (
                <div key={b.label} className={`${b.bg} border border-slate-200 rounded-xl p-3 text-center`}>
                  <div className={`w-full h-1.5 rounded-full ${b.color} mb-2`} style={{ width: `${pct}%`, minWidth: '4px' }} />
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{b.label}</p>
                  <p className={`text-sm font-bold tabular-nums mt-1 ${b.text}`}>ETB {fmtK(val)}</p>
                  <p className="ovds-caption">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer table */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="SEARCH" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white dark:bg-slate-800 dark:border-slate-700" />
        </div>
        <Btn variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={12} />}
          onClick={async () => {
            try {
              const q = new URLSearchParams({ asOf, format: 'csv' });
              if (companyId) q.set('companyId', companyId);
              const res = await api.get(`/ovds/sub-ledger/ar/customers?${q}`, { responseType: 'blob' });
              downloadBlob(new Blob([res.data]), `ar-subledger-${asOf}.csv`);
            } catch { toast.error('Export failed'); }
          }}>
          Export CSV
        </Btn>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Customer</AppTh>
          <AppTh align="right">Outstanding</AppTh>
          <AppTh align="right">Current</AppTh>
          <AppTh align="right">1–30 days</AppTh>
          <AppTh align="right">31–90 days</AppTh>
          <AppTh align="right">&gt; 90 days</AppTh>
          <AppTh>Last Invoice</AppTh>
          <AppTh>{'​'}</AppTh>
        </tr></thead>
        <tbody>
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <AppTr key={i}>{Array.from({ length: 8 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
          )) : filtered.length === 0 ? (
            <AppTr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">No AR balances found. Post invoices to generate sub-ledger entries.</td></AppTr>
          ) : filtered.map((r: any) => (
            <AppTr key={r.customerId}>
              <AppTd>
                <Link to={`/customer-summary/${r.customerId}`} className="font-semibold text-emerald-600 hover:underline">{r.customerName}</Link>
                <p className="text-[10px] text-slate-400 font-mono">{r.customerId}</p>
              </AppTd>
              <AppTd align="right"><Amount value={r.outstanding ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-emerald-700"><Amount value={r.current ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-amber-700"><Amount value={r.days1_30 ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-orange-700"><Amount value={r.days31_90 ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-rose-700"><Amount value={r.days90Plus ?? 0} size="sm" /></AppTd>
              <AppTd>{r.lastInvoiceDate ? new Date(r.lastInvoiceDate).toLocaleDateString() : '—'}</AppTd>
              <AppTd>
                <button onClick={() => openDrillDown(r.customerId)} className="text-[10px] font-bold text-emerald-600 hover:underline">View →</button>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
        {filtered.length > 0 && (
          <tfoot>
            <tr className="bg-slate-800">
              <td className="px-4 py-3 text-sm font-black text-white">TOTAL AR</td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-black text-emerald-400">{fmt(totalAR)}</td>
              <td colSpan={6} />
            </tr>
          </tfoot>
        )}
      </AppTable>

      {/* Transaction drill-down panel */}
      {selected && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Transaction Detail — {(data ?? []).find((d: any) => d.customerId === selected)?.customerName ?? selected}
            </p>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
              <Icon name="CLOSE" size={14} />
            </button>
          </div>
          <AppTable>
            <thead><tr>
              <AppTh>Date</AppTh>
              <AppTh>Reference</AppTh>
              <AppTh>Description</AppTh>
              <AppTh align="right">Debit</AppTh>
              <AppTh align="right">Credit</AppTh>
              <AppTh align="right">Balance</AppTh>
              <AppTh>Status</AppTh>
            </tr></thead>
            <tbody>
              {txns.length === 0 ? (
                <AppTr><td colSpan={7} className="py-8 text-center text-sm text-slate-400">No transactions found.</td></AppTr>
              ) : txns.map((t: any, i: number) => (
                <AppTr key={i}>
                  <AppTd>{t.date ? new Date(t.date).toLocaleDateString() : '—'}</AppTd>
                  <AppTd className="font-mono text-[11px]">{t.reference ?? '—'}</AppTd>
                  <AppTd className="max-w-[200px] truncate">{t.description}</AppTd>
                  <AppTd align="right"><Amount value={t.debit ?? 0} size="sm" /></AppTd>
                  <AppTd align="right"><Amount value={t.credit ?? 0} size="sm" /></AppTd>
                  <AppTd align="right" className="font-bold tabular-nums">{fmt(t.balance ?? 0)}</AppTd>
                  <AppTd><StatusBadge status={t.status ?? 'OPEN'} /></AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}
    </div>
  );
};

// -- AP Sub-Ledger Tab ---------------------------------------------------------
const APTab: React.FC<{ companyId?: string; asOf: string }> = ({ companyId, asOf }) => {
  const { data: summary }                       = useApSummary(asOf, companyId);
  const { vendors: data, loading }              = useApVendors(asOf, companyId);
  const [search, setSearch]                     = useState('');

  const filtered = search
    ? (data ?? []).filter((d: any) => d.vendorName?.toLowerCase().includes(search.toLowerCase()))
    : (data ?? []);

  const totalAP  = summary?.totalOutstanding ?? filtered.reduce((s: number, r: any) => s + Number(r.outstanding ?? 0), 0);
  const totalDue = summary?.totalDue30Days   ?? filtered.filter((r: any) => r.daysUntilDue <= 30).reduce((s: number, r: any) => s + Number(r.outstanding ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="ovds-grid-layout cols-4 gap-sm">
        {[
          { label: 'Total AP',         value: totalAP,  accent: 'bg-slate-500' },
          { label: 'Due in 30 Days',   value: totalDue, accent: 'bg-amber-500' },
          { label: 'Overdue',          value: summary?.totalOverdue ?? 0, accent: 'bg-rose-500' },
          { label: 'Vendors',          value: (data ?? []).length, isCount: true, accent: 'bg-violet-500' },
        ].map(k => (
          <div key={k.label} className="ovds-widget-card p-4">
            <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p className="ovds-value-sm tabular-nums mt-1 text-slate-800 dark:text-slate-100">
              {k.isCount ? k.value : fmtK(k.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon name="SEARCH" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white dark:bg-slate-800 dark:border-slate-700" />
        </div>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Vendor</AppTh>
          <AppTh align="right">Outstanding</AppTh>
          <AppTh align="right">Current</AppTh>
          <AppTh align="right">1–30 days</AppTh>
          <AppTh align="right">31–60</AppTh>
          <AppTh align="right">&gt; 60</AppTh>
          <AppTh>Next Due Date</AppTh>
        </tr></thead>
        <tbody>
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <AppTr key={i}>{Array.from({ length: 7 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
          )) : filtered.length === 0 ? (
            <AppTr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No AP balances found. Post vendor bills to generate sub-ledger entries.</td></AppTr>
          ) : filtered.map((r: any) => (
            <AppTr key={r.vendorId}>
              <AppTd>
                <Link to="/purchases/vendors" className="font-semibold text-emerald-600 hover:underline">{r.vendorName}</Link>
                {r.tin && <p className="text-[10px] text-slate-400 font-mono">TIN: {r.tin}</p>}
              </AppTd>
              <AppTd align="right"><Amount value={r.outstanding ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-emerald-700"><Amount value={r.current ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-amber-700"><Amount value={r.days1_30 ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-orange-700"><Amount value={r.days31_60 ?? 0} size="sm" /></AppTd>
              <AppTd align="right" className="text-rose-700"><Amount value={r.days60Plus ?? 0} size="sm" /></AppTd>
              <AppTd>{r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString() : '—'}</AppTd>
            </AppTr>
          ))}
        </tbody>
        {filtered.length > 0 && (
          <tfoot>
            <tr className="bg-slate-800">
              <td className="px-4 py-3 text-sm font-black text-white">TOTAL AP</td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-black text-emerald-400">{fmt(totalAP)}</td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        )}
      </AppTable>
    </div>
  );
};

// -- GL Inquiry Tab ------------------------------------------------------------
const GLInquiryTab: React.FC<{ companyId?: string; startDate: string; endDate: string }> = ({ companyId, startDate, endDate }) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const q = new URLSearchParams();
        if (companyId) q.set('companyId', companyId);
        const res = await api.get(`/accounting/accounts?${q}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: [] }));
        setAccounts(res.data?.data ?? res.data ?? []);
      } catch { /* silent */ }
    };
    fetchAccounts();
  }, [companyId]);

  const fetchLedger = useCallback(async (accountId: string) => {
    if (!accountId) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ accountId, startDate, endDate });
      if (companyId) q.set('companyId', companyId);
      setEntries(await fetchGlEntries(accountId, startDate, endDate, companyId));
    } finally { setLoading(false); }
  }, [companyId, startDate, endDate]);

  useEffect(() => { if (selectedAccount) fetchLedger(selectedAccount); }, [selectedAccount, fetchLedger]);

  const filteredAccts = search
    ? accounts.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.code?.toLowerCase().includes(search.toLowerCase()))
    : accounts;

  const runningBalance = entries.reduce((acc: any[], entry: any, i: number) => {
    const prev = i === 0 ? 0 : acc[i - 1].running;
    return [...acc, { ...entry, running: prev + Number(entry.debit ?? 0) - Number(entry.credit ?? 0) }];
  }, []);

  const totalDebits  = entries.reduce((s: number, e: any) => s + Number(e.debit ?? 0), 0);
  const totalCredits = entries.reduce((s: number, e: any) => s + Number(e.credit ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="ovds-grid-layout cols-2">
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Select Account</p>
          <div className="relative mb-2">
            <Icon name="SEARCH" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts by code or name…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white dark:bg-slate-800" />
          </div>
          <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
            {filteredAccts.slice(0, 50).map((a: any) => (
              <button key={a.id} onClick={() => setSelectedAccount(a.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs transition-colors ${selectedAccount === a.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                <span className="font-mono text-[10px] text-slate-400 w-16 shrink-0">{a.code}</span>
                <span className="truncate">{a.name}</span>
                <span className="ml-auto shrink-0 text-[9px] text-slate-300">{a.type}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          {entries.length > 0 && (
            <div className="space-y-3">
              <div className="ovds-grid-layout cols-2 gap-sm">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Debits</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-700">ETB {fmtK(totalDebits)}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Credits</p>
                  <p className="text-lg font-bold tabular-nums text-rose-700">ETB {fmtK(totalCredits)}</p>
                </div>
              </div>
              <div className={`p-3 rounded-xl border text-xs font-semibold ${Math.abs(totalDebits - totalCredits) < 0.01 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                Net: ETB {fmt(totalDebits - totalCredits)} · {entries.length} transactions
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedAccount && (
        <AppTable>
          <thead><tr>
            <AppTh>Date</AppTh>
            <AppTh>Journal Ref</AppTh>
            <AppTh>Description</AppTh>
            <AppTh>Posted by</AppTh>
            <AppTh align="right">Debit</AppTh>
            <AppTh align="right">Credit</AppTh>
            <AppTh align="right">Running Balance</AppTh>
          </tr></thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <AppTr key={i}>{Array.from({ length: 7 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
            )) : runningBalance.length === 0 ? (
              <AppTr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No ledger entries for this account in the selected period.</td></AppTr>
            ) : runningBalance.map((e: any, i: number) => (
              <AppTr key={i}>
                <AppTd>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</AppTd>
                <AppTd className="font-mono text-[11px]">{e.journalRef ?? '—'}</AppTd>
                <AppTd className="max-w-[200px] truncate">{e.description ?? '—'}</AppTd>
                <AppTd className="text-[11px]">{e.postedBy ?? '—'}</AppTd>
                <AppTd align="right" className={`tabular-nums ${e.debit > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-300'}`}>
                  {e.debit > 0 ? fmt(e.debit) : '—'}
                </AppTd>
                <AppTd align="right" className={`tabular-nums ${e.credit > 0 ? 'text-rose-600 font-semibold' : 'text-slate-300'}`}>
                  {e.credit > 0 ? fmt(e.credit) : '—'}
                </AppTd>
                <AppTd align="right" className={`tabular-nums font-bold ${e.running < 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
                  {e.running < 0 ? `(${fmt(Math.abs(e.running))})` : fmt(e.running)}
                </AppTd>
              </AppTr>
            ))}
          </tbody>
        </AppTable>
      )}
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const SubLedger: React.FC = () => {
  usePageTitle('Sub-Ledger & GL Inquiry');
  const { selectedCompanyId } = useBusiness();
  const [activeTab, setActiveTab] = useState<'ar' | 'ap' | 'gl'>('ar');
  const [asOf, setAsOf] = useState(today);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEndDate]     = useState(today);

  const TABS = [
    { key: 'ar', label: 'AR Sub-Ledger' },
    { key: 'ap', label: 'AP Sub-Ledger' },
    { key: 'gl', label: 'GL Inquiry' },
  ] as const;

  return (
    <AppPage
      title="Sub-Ledger & GL Inquiry"
      subtitle="Accounts Receivable · Accounts Payable aging · General Ledger drill-through · Accounting & ovds Software · Banking & ovds · Strategic Insights"
      icon={<Icon name="CHART" size={18} />}
      crumbs={[{ label: 'Accounting', to: '/accounting' }, { label: 'Sub-Ledger' }]}
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'gl' ? (
            <>
              <label className="text-xs text-slate-500">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
              <label className="text-xs text-slate-500">To</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
            </>
          ) : (
            <>
              <label className="text-xs text-slate-500">As at</label>
              <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400" />
            </>
          )}
        </div>
      }
      tabs={<AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as any)} />}
    >
      {activeTab === 'ar' && <ARTab companyId={selectedCompanyId ?? undefined} asOf={asOf} />}
      {activeTab === 'ap' && <APTab companyId={selectedCompanyId ?? undefined} asOf={asOf} />}
      {activeTab === 'gl' && <GLInquiryTab companyId={selectedCompanyId ?? undefined} startDate={startDate} endDate={endDate} />}
    </AppPage>
  );
};

export default SubLedger;

