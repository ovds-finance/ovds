/**
 * ConsolidatedStatements — IFRS 10 Group Financial Statements
 *
 * Presents the full consolidated financial position for a parent company
 * and its subsidiaries per IFRS 10 / IAS 27:
 *   - Consolidated Balance Sheet (assets = liabilities + equity + NCI)
 *   - Consolidated Income Statement (group profit, NCI share)
 *   - Intercompany Elimination Summary (IFRS 10.B86)
 *   - Subsidiary breakdown with drill-down links
 *   - AABE disclosure readiness indicator
 *
 * Backend: GET /ovds/reports/consolidation/:parentCompanyId
 */
import {
  GitMerge, RefreshCw, Building2, TrendingUp,
  ChevronDown, ChevronRight, ExternalLink, AlertTriangle,
  CheckCircle2, BarChart3,
} from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Can } from '../components/can';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';


// ── Types ─────────────────────────────────────────────────────────────────────

interface SubsidiaryEntry {
  companyId: string;
  companyName: string;
  ownershipPct: number;
  nciPct: number;
  fxRate: number;
  currencyCode: string;
}

interface EliminationEntry {
  type: string;
  description: string;
  amount: number;
  fromCompanyId: string;
  toCompanyId: string;
}

interface ConsolidatedLineItem {
  accountCode: string;
  accountName: string;
  accountType: string;
  parentAmount: number;
  subsidiaryAmounts: Record<string, number>;
  totalBeforeElim: number;
  eliminations: number;
  consolidatedAmount: number;
}

interface ConsolidatedBS {
  assets:            ConsolidatedLineItem[];
  liabilities:       ConsolidatedLineItem[];
  equity:            ConsolidatedLineItem[];
  totalAssets:       number;
  totalLiabAndEquity:number;
  nci:               number;
  parentEquity:      number;
  isBalanced:        boolean;
}

interface ConsolidatedPL {
  revenue:             ConsolidatedLineItem[];
  expenses:            ConsolidatedLineItem[];
  totalRevenue:        number;
  totalExpenses:       number;
  groupNetProfit:      number;
  nciShareOfProfit:    number;
  parentShareOfProfit: number;
}

interface EliminationSummary {
  totalIntercoSales:          number;
  totalIntercoLoans:          number;
  totalUnrealisedProfit:      number;
  totalDividendsEliminated:   number;
  totalInvestmentEliminated:  number;
}

interface ConsolidatedStatements {
  parentCompanyId:    string;
  parentCompanyName:  string;
  period:             string;
  asOf:               string;
  subsidiaries:       SubsidiaryEntry[];
  eliminations:       EliminationEntry[];
  balanceSheet:       ConsolidatedBS;
  incomeStatement:    ConsolidatedPL;
  eliminationSummary: EliminationSummary;
  ifrsReference:      string;
  generatedAt:        string;
  disclosures:        string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtK = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `ETB ${(n / 1_000_000).toFixed(2)}M`
    : Math.abs(n) >= 1_000
    ? `ETB ${(n / 1_000).toFixed(1)}K`
    : `ETB ${fmt(n)}`;

const AmtCell: React.FC<{ value: number; bold?: boolean }> = ({ value, bold }) => (
  <span className={`tabular-nums text-right ${bold ? 'font-bold' : 'font-medium'} ${value < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
    {value < 0 ? `(${fmt(Math.abs(value))})` : fmt(value)}
  </span>
);

// ── Sub-component: section table ──────────────────────────────────────────────

const SectionTable: React.FC<{
  title: string;
  items: ConsolidatedLineItem[];
  total: number;
  subs: SubsidiaryEntry[];
  accent: string;
}> = ({ title, items, total, subs, accent }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const drillDown = (item: ConsolidatedLineItem) => {
    if (!item.accountCode) return;
    // Navigate to GL inquiry filtered by account code
    navigate(`/accounting/journals?accountCode=${encodeURIComponent(item.accountCode)}&tab=gl`);
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg ${accent} bg-opacity-10 hover:bg-opacity-20 transition-colors`}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{title}</span>
        </div>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">{fmtK(total)}</span>
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-8">Code</th>
                <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent</th>
                {subs.map(s => (
                  <th key={s.companyId} className="text-right py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    {s.companyName.slice(0, 10)}…
                  </th>
                ))}
                <th className="text-right py-2 px-3 text-[10px] font-bold text-rose-400 uppercase tracking-widest">Elim.</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold text-[var(--pro-azure)] uppercase tracking-widest">Consol.</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-300">{item.accountCode}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                    <button
                      onClick={() => drillDown(item)}
                      className="text-left hover:text-violet-600 dark:hover:text-violet-400 transition-colors group flex items-center gap-1"
                      title="Drill down to GL sub-ledger"
                    >
                      {item.accountName}
                      {item.accountCode && (
                        <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-right"><AmtCell value={item.parentAmount} /></td>
                  {subs.map(s => (
                    <td key={s.companyId} className="py-2 px-3 text-right">
                      <AmtCell value={item.subsidiaryAmounts[s.companyId] ?? 0} />
                    </td>
                  ))}
                  <td className="py-2 px-3 text-right text-rose-500 tabular-nums font-medium">
                    {item.eliminations !== 0 ? `(${fmt(Math.abs(item.eliminations))})` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right"><AmtCell value={item.consolidatedAmount} bold /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ConsolidatedStatements: React.FC = () => {
  usePageTitle('Consolidated Statements');
  const navigate = useNavigate();
  const { selectedCompanyId, companies } = useBusiness();

  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [startDate, setStartDate] = useState(yearStart);
  const [endDate, setEndDate]     = useState(today);
  const [data, setData]           = useState<ConsolidatedStatements | null>(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState<'bs' | 'pl' | 'elim' | 'subs'>('bs');

  const load = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/ovds/reports/consolidation/${selectedCompanyId}`,
        { params: { startDate, endDate, asOfDate: endDate } },
      );
      const d = res.data?.data ?? res.data;
      setData(d);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load consolidation';
      toast.error(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  if (!selectedCompanyId) {
    return (
      <div className="p-8 text-center">
        <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">Select a parent company to view consolidated statements.</p>
      </div>
    );
  }

  const bs  = data?.balanceSheet;
  const pl  = data?.incomeStatement;
  const es  = data?.eliminationSummary;
  const subs = data?.subsidiaries ?? [];

  const TABS = [
    { key: 'bs',   label: 'Balance Sheet' },
    { key: 'pl',   label: 'Income Statement' },
    { key: 'elim', label: `Eliminations (${data?.eliminations?.length ?? 0})` },
    { key: 'subs', label: `Subsidiaries (${subs.length})` },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <GitMerge size={18} className="text-violet-500" />
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Consolidated Financial Statements
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            IFRS 10 — Group Consolidated Statements · IAS 27 · NCI per IFRS 10.22
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800" />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800" />
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
            {loading ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {loading ? 'Loading…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Group Assets',        value: bs?.totalAssets ?? 0,           accent: 'bg-[var(--pro-azure-50)]0' },
            { label: 'Group Net Profit',    value: pl?.groupNetProfit ?? 0,        accent: (pl?.groupNetProfit ?? 0) >= 0 ? 'bg-sky-500' : 'bg-rose-500' },
            { label: 'NCI in Equity',       value: bs?.nci ?? 0,                  accent: 'bg-violet-500' },
            { label: 'Total Eliminations',  value: (es?.totalIntercoSales ?? 0) + (es?.totalIntercoLoans ?? 0) + (es?.totalUnrealisedProfit ?? 0), accent: 'bg-rose-400' },
          ].map(k => (
            <div key={k.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4">
              <div className={`w-1.5 h-6 rounded-full ${k.accent} mb-2`} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className={`text-base font-bold tabular-nums mt-1 ${k.value < 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
                {fmtK(k.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Balance check banner */}
      {bs && (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold ${
          bs.isBalanced
            ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/20 dark:border-green-800 dark:text-[var(--pro-azure-light)]'
            : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-400'
        }`}>
          {bs.isBalanced
            ? <CheckCircle2 size={13} />
            : <AlertTriangle size={13} />}
          {bs.isBalanced
            ? `Consolidated balance sheet is balanced — Total Assets ${fmtK(bs.totalAssets)} = Liabilities + Equity ${fmtK(bs.totalLiabAndEquity)}`
            : `IMBALANCE: Assets ${fmtK(bs.totalAssets)} ≠ Liabilities + Equity ${fmtK(bs.totalLiabAndEquity)} — check intercompany eliminations`}
          {data && (
            <span className="ml-auto text-[10px] font-bold opacity-60">
              Generated {new Date(data.generatedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 dark:border-slate-800">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !data && (
        <div className="py-16 text-center">
          <GitMerge size={36} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No consolidated data yet.</p>
          <p className="text-xs text-slate-300 mt-1">
            Configure subsidiary relationships in Company Settings → IFRS → Group Structure,
            then click Generate.
          </p>
        </div>
      )}

      {/* Balance Sheet tab */}
      {!loading && data && activeTab === 'bs' && bs && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
              Consolidated Statement of Financial Position — as at {data.asOf}
            </p>
            <p className="text-[10px] text-slate-400 text-center">IAS 1.54 — All amounts ETB</p>

            <SectionTable title="Assets"      items={bs.assets}      total={bs.totalAssets}    subs={subs} accent="bg-[var(--pro-azure-50)]0" />
            <SectionTable title="Liabilities" items={bs.liabilities} total={bs.liabilities.reduce((s,i)=>s+i.consolidatedAmount,0)} subs={subs} accent="bg-rose-500" />
            <SectionTable title="Equity"      items={bs.equity}      total={bs.equity.reduce((s,i)=>s+i.consolidatedAmount,0)}      subs={subs} accent="bg-violet-500" />

            {/* NCI + Parent equity */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-violet-50 dark:bg-violet-950/20 rounded-lg p-3 text-center">
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Non-Controlling Interest (NCI)</p>
                <p className="text-sm font-bold text-violet-700 dark:text-violet-300 tabular-nums mt-1">{fmtK(bs.nci)}</p>
              </div>
              <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-lg p-3 text-center">
                <p className="text-[10px] font-bold text-[var(--pro-azure)] uppercase tracking-wider">Parent Shareholders' Equity</p>
                <p className="text-sm font-bold text-[var(--pro-azure-dark)] dark:text-green-300 tabular-nums mt-1">{fmtK(bs.parentEquity)}</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 px-1">
            {data.ifrsReference} · Subsidiaries: {subs.map(s => s.companyName).join(', ')}
          </p>
        </div>
      )}

      {/* Income Statement tab */}
      {!loading && data && activeTab === 'pl' && pl && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
              Consolidated Statement of Profit or Loss — {data.period}
            </p>

            <SectionTable title="Revenue"  items={pl.revenue}   total={pl.totalRevenue}   subs={subs} accent="bg-[var(--pro-azure-50)]0" />
            <SectionTable title="Expenses" items={pl.expenses}  total={pl.totalExpenses}  subs={subs} accent="bg-rose-500" />

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {[
                { label: 'Group Net Profit',      value: pl.groupNetProfit,      color: pl.groupNetProfit >= 0 ? 'indigo' : 'rose' },
                { label: 'NCI Share of Profit',   value: pl.nciShareOfProfit,    color: 'violet' },
                { label: "Parent's Share",        value: pl.parentShareOfProfit, color: pl.parentShareOfProfit >= 0 ? 'sky' : 'rose' },
              ].map(k => (
                <div key={k.label} className={`bg-${k.color}-50 dark:bg-${k.color}-950/20 rounded-lg p-3 text-center`}>
                  <p className={`text-[10px] font-bold text-${k.color}-500 uppercase tracking-wider`}>{k.label}</p>
                  <p className={`text-sm font-bold text-${k.color}-700 dark:text-${k.color}-300 tabular-nums mt-1`}>
                    {k.value < 0 ? `(${fmtK(Math.abs(k.value))})` : fmtK(k.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Eliminations tab */}
      {!loading && data && activeTab === 'elim' && (
        <div className="space-y-4">
          {/* Summary cards */}
          {es && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Interco Sales',       value: es.totalIntercoSales },
                { label: 'Interco Loans',       value: es.totalIntercoLoans },
                { label: 'Unrealised Profit',   value: es.totalUnrealisedProfit },
                { label: 'Dividends',           value: es.totalDividendsEliminated },
                { label: 'Investment in Sub',   value: es.totalInvestmentEliminated },
              ].map(k => (
                <div key={k.label} className="bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/40 p-4">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{k.label}</p>
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">{fmtK(k.value)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Detail table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Intercompany Eliminations — IFRS 10.B86
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Intragroup balances, transactions, income and expenses fully eliminated on consolidation.
              </p>
            </div>
            {data.eliminations.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No intercompany transactions found for this period.
                <div className="mt-2">
                  <button onClick={() => navigate('/ifrs/intercompany-eliminations')}
                    className="text-xs text-violet-600 hover:underline flex items-center gap-1 mx-auto">
                    <ExternalLink size={11} /> Go to Intercompany Eliminations
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['Type', 'Description', 'From', 'To', 'Amount'].map(h => (
                      <th key={h} className="text-left py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.eliminations.map((e, i) => (
                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 uppercase">
                          {e.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{e.description}</td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">{e.fromCompanyId.slice(0, 8)}…</td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">{e.toCompanyId.slice(0, 8)}…</td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600 tabular-nums">{fmtK(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex items-center justify-end">
            <button onClick={() => navigate('/ifrs/intercompany-eliminations')}
              className="flex items-center gap-1.5 text-xs text-violet-600 hover:underline font-semibold">
              <ExternalLink size={11} /> Manage Eliminations
            </button>
          </div>
        </div>
      )}

      {/* Subsidiaries tab */}
      {!loading && data && activeTab === 'subs' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  {['Entity', 'Ownership %', 'NCI %', 'Currency', 'FX Rate', 'Drill-down'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No subsidiaries configured. Add subsidiaries in Company Settings → IFRS → Group Structure.
                    </td>
                  </tr>
                ) : subs.map(s => (
                  <tr key={s.companyId} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-bold text-violet-700 dark:text-violet-400 shrink-0">
                          {s.companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{s.companyName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[var(--pro-azure)]">{s.ownershipPct.toFixed(1)}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-violet-600">{s.nciPct.toFixed(1)}%</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{s.currencyCode}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">{s.fxRate.toFixed(4)}</td>
                    <td className="py-3 px-4">
                      <Can permission="reports:read">
                        <button
                          onClick={() => navigate(`/accounting/aabe-audit?companyId=${s.companyId}`)}
                          className="flex items-center gap-1 text-xs text-sky-600 hover:underline font-semibold"
                          title="View AABE audit readiness for this subsidiary"
                        >
                          <BarChart3 size={11} /> Audit Score
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* IFRS disclosure notes */}
          {data.disclosures?.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                IFRS 10 Disclosure Notes
              </p>
              <ul className="space-y-1">
                {data.disclosures.map((d, i) => (
                  <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex gap-2">
                    <span className="text-amber-400 shrink-0">•</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AABE note */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          <strong>AABE Note:</strong> Consolidated statements are required for Public Interest Entities under
          Proclamation No. 847/2014. Ensure all subsidiary TINs are registered, intercompany loans
          are documented, and NCI percentages are approved by your licensed auditor before AABE submission.
          Drill-down to subsidiary sub-ledger via the AABE Audit Readiness score links above.
        </p>
      </div>

    </div>
  );
};

export default ConsolidatedStatements;
