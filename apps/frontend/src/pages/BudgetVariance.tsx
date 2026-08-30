/**
 * Budget vs Actual Variance Analysis
 * Extends the existing Budgets page with full variance reporting,
 * trend analysis, and drill-through to underlying transactions.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Amount,
} from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { downloadBlob } from '../utils/download';
import {
  useBudgetVarianceSummary,
  useBudgetVarianceDetail,
  useBudgetVarianceTrend,
} from '../services/newTaxApi';
import { useRefreshBudgetActuals } from '../services/missingFeaturesApi';

const currentYear    = new Date().getFullYear();
const currentPeriod  = new Date().toISOString().slice(0, 7);
const fmt  = (n: number) => new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));
const fmtK = (n: number) => Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : fmt(n);

type VarianceView = 'summary' | 'detail' | 'trend' | 'forecast';

interface BudgetLine {
  id: string;
  accountCode: string;
  accountName: string;
  category: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePct: number;
  ytdBudget: number;
  ytdActual: number;
  ytdVariance: number;
  remainingBudget: number;
  forecastEOY: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'OVER_BUDGET' | 'UNDER_UTILIZED';
}

interface BudgetSummary {
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  variancePct: number;
  overBudgetCount: number;
  atRiskCount: number;
  onTrackCount: number;
  budgetUtilizationPct: number;
  forecastEOY: number;
  period: string;
}

const STATUS_CONFIG = {
  ON_TRACK:       { label: 'On Track',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  AT_RISK:        { label: 'At Risk',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  OVER_BUDGET:    { label: 'Over Budget',    cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  UNDER_UTILIZED: { label: 'Under-utilized', cls: 'bg-white text-slate-500 border-slate-200' },
};

// -- Variance Bar --------------------------------------------------------------
const VarianceBar: React.FC<{ budget: number; actual: number }> = ({ budget, actual }) => {
  if (budget <= 0) return <span className="text-slate-300 text-[11px]">—</span>;
  const pct = Math.min(Math.round((actual / budget) * 100), 150);
  const over = pct > 100;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-visible relative">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
        {over && (
          <div className="absolute right-0 top-0 w-0.5 h-full bg-rose-700" title="Budget limit" />
        )}
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${over ? 'text-rose-600' : pct > 80 ? 'text-amber-600' : 'text-emerald-700'}`}>
        {pct}%
      </span>
    </div>
  );
};

// -- Summary Tab ---------------------------------------------------------------
const SummaryTab: React.FC<{ summary: BudgetSummary | null; lines: BudgetLine[]; loading: boolean }> = ({ summary, lines, loading }) => {
  const categories = Array.from(new Set(lines.map(l => l.category)));

  return (
    <div className="space-y-5">
      {/* Executive summary bar */}
      {summary && (
        <div className="ovds-stat-row">
          {[
            { label: 'Total Budget',        value: fmtK(summary.totalBudget),        accent: 'bg-slate-500' },
            { label: 'Total Actual',         value: fmtK(summary.totalActual),        accent: summary.totalActual <= summary.totalBudget ? 'bg-emerald-500' : 'bg-rose-500' },
            { label: 'Variance',             value: fmtK(Math.abs(summary.totalVariance)), accent: summary.totalVariance >= 0 ? 'bg-emerald-500' : 'bg-rose-500' },
            { label: 'Budget Utilization',   value: `${summary.budgetUtilizationPct}%`, accent: summary.budgetUtilizationPct <= 100 ? 'bg-sky-500' : 'bg-rose-500' },
            { label: 'Forecast EOY',         value: fmtK(summary.forecastEOY),         accent: summary.forecastEOY <= summary.totalBudget ? 'bg-emerald-500' : 'bg-rose-500' },
          ].map(k => (
            <div key={k.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${k.accent}`} />
              <div>
                <p className="ovds-value-sm tabular-nums">{k.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status breakdown */}
      {summary && (
        <div className="ovds-grid-layout cols-4 gap-sm">
          {[
            { key: 'ON_TRACK',       count: summary.onTrackCount,    label: 'On Track',      accent: 'bg-emerald-500' },
            { key: 'AT_RISK',        count: summary.atRiskCount,     label: 'At Risk',       accent: 'bg-amber-500' },
            { key: 'OVER_BUDGET',    count: summary.overBudgetCount, label: 'Over Budget',   accent: 'bg-rose-500' },
            { key: 'UNDER_UTILIZED', count: lines.filter(l => l.status === 'UNDER_UTILIZED').length, label: 'Under-utilized', accent: 'bg-slate-400' },
          ].map(s => (
            <div key={s.key} className="ovds-widget-card p-4">
              <div className={`w-1.5 h-8 rounded-full ${s.accent} mb-2`} />
              <p className="ovds-value-sm">{s.count}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Variance by Category</p>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <div className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
            </div>
          )) : categories.map(cat => {
            const catLines  = lines.filter(l => l.category === cat);
            const budget    = catLines.reduce((s, l) => s + l.budgetAmount, 0);
            const actual    = catLines.reduce((s, l) => s + l.actualAmount, 0);
            const variance  = budget - actual;
            const pct       = budget > 0 ? Math.round(actual / budget * 100) : 0;
            const over      = actual > budget;
            return (
              <div key={cat} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{cat}</p>
                  <p className="ovds-caption">{catLines.length} accounts</p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-[11px] text-slate-500">Budget: ETB {fmtK(budget)}</p>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Actual: ETB {fmtK(actual)}</p>
                </div>
                <div className="min-w-[120px]">
                  <VarianceBar budget={budget} actual={actual} />
                </div>
                <div className={`text-right min-w-[80px] font-bold tabular-nums text-[12px] ${over ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {over ? '-' : '+'}ETB {fmtK(Math.abs(variance))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -- Detail Tab ----------------------------------------------------------------
const DetailTab: React.FC<{ lines: BudgetLine[]; loading: boolean; period: string }> = ({ lines, loading, period }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'OVER_BUDGET' | 'AT_RISK' | 'ON_TRACK'>('ALL');

  const filtered = lines.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.accountName.toLowerCase().includes(q) || l.accountCode.toLowerCase().includes(q);
    const matchFilter = filter === 'ALL' || l.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Icon name="SEARCH" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white dark:bg-slate-800" />
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {(['ALL', 'OVER_BUDGET', 'AT_RISK', 'ON_TRACK'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${filter === f ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
        <span className="ovds-caption">{filtered.length} accounts</span>
      </div>

      <AppTable>
        <thead><tr>
          <AppTh>Account</AppTh>
          <AppTh>Category</AppTh>
          <AppTh align="right">Budget ({period.slice(0, 7)})</AppTh>
          <AppTh align="right">Actual</AppTh>
          <AppTh align="right">Variance</AppTh>
          <AppTh>Utilization</AppTh>
          <AppTh align="right">YTD Budget</AppTh>
          <AppTh align="right">YTD Actual</AppTh>
          <AppTh align="right">Forecast EOY</AppTh>
          <AppTh>Status</AppTh>
        </tr></thead>
        <tbody>
          {loading ? Array.from({ length: 8 }).map((_, i) => (
            <AppTr key={i}>{Array.from({ length: 10 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
          )) : filtered.length === 0 ? (
            <AppTr><td colSpan={10} className="py-12 text-center text-sm text-slate-400">No budget lines found. Set up budgets in the Budgets module.</td></AppTr>
          ) : filtered.map(l => {
            const cfg = STATUS_CONFIG[l.status];
            return (
              <AppTr key={l.id}>
                <AppTd>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{l.accountName}</p>
                  <p className="text-[10px] font-mono text-slate-400">{l.accountCode}</p>
                </AppTd>
                <AppTd><span className="text-[10px] text-slate-500">{l.category}</span></AppTd>
                <AppTd align="right"><Amount value={l.budgetAmount} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={l.actualAmount} size="sm" /></AppTd>
                <AppTd align="right">
                  <span className={`font-bold tabular-nums text-[12px] ${l.variance < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {l.variance < 0 ? `(${fmt(Math.abs(l.variance))})` : fmt(l.variance)}
                  </span>
                  {l.variancePct !== 0 && (
                    <p className={`text-[9px] ${l.variance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {l.variance < 0 ? '-' : '+'}{Math.abs(l.variancePct).toFixed(0)}%
                    </p>
                  )}
                </AppTd>
                <AppTd>
                  <VarianceBar budget={l.budgetAmount} actual={l.actualAmount} />
                </AppTd>
                <AppTd align="right"><Amount value={l.ytdBudget} size="sm" /></AppTd>
                <AppTd align="right"><Amount value={l.ytdActual} size="sm" /></AppTd>
                <AppTd align="right">
                  <span className={`tabular-nums text-[12px] font-semibold ${l.forecastEOY > l.ytdBudget * (12 / new Date().getMonth() || 12) ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {fmtK(l.forecastEOY)}
                  </span>
                </AppTd>
                <AppTd>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </AppTd>
              </AppTr>
            );
          })}
        </tbody>
        {filtered.length > 0 && (
          <tfoot>
            <tr className="bg-slate-800">
              <td className="px-4 py-3 text-sm font-black text-white" colSpan={2}>TOTALS</td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-emerald-400">{fmt(filtered.reduce((s, l) => s + l.budgetAmount, 0))}</td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-emerald-400">{fmt(filtered.reduce((s, l) => s + l.actualAmount, 0))}</td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-white">
                {(() => { const v = filtered.reduce((s, l) => s + l.variance, 0); return `${v < 0 ? '(' : ''}${fmt(Math.abs(v))}${v < 0 ? ')' : ''}`; })()}
              </td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        )}
      </AppTable>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const BudgetVariance: React.FC = () => {
  usePageTitle('Budget vs Actual');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [activeTab, setActiveTab] = useState<VarianceView>('summary');
  const [period, setPeriod]       = useState(currentPeriod);
  const [exporting, setExporting] = useState(false);

  const { data: summary, loading: sumLoading, refetch: refetchSum }   = useBudgetVarianceSummary(period, selectedCompanyId ?? undefined);
  const { lines, loading: lineLoading, refetch: refetchLines }        = useBudgetVarianceDetail(period, selectedCompanyId ?? undefined);
  const { data: trendData, loading: trendLoading, refetch: refetchTrend } = useBudgetVarianceTrend(period, 6, selectedCompanyId ?? undefined);
  const loading  = sumLoading || lineLoading;
  const fetchAll = useCallback(() => { refetchSum(); refetchLines(); refetchTrend(); }, [refetchSum, refetchLines, refetchTrend]);

  // Refresh actuals from posted journal lines, then re-fetch variance data
  const { trigger: syncActuals, loading: syncing } = useRefreshBudgetActuals();
  const handleSyncActuals = useCallback(async () => {
    await syncActuals(period, selectedCompanyId ?? undefined);
    fetchAll();
  }, [syncActuals, fetchAll, period, selectedCompanyId]);

  const handleExport = async (fmt: 'pdf' | 'xlsx') => {
    setExporting(true);
    try {
      const q = new URLSearchParams({ period, format: fmt });
      if (selectedCompanyId) q.set('companyId', selectedCompanyId);
      const res = await api.get(`/ovds/budgets/variance/export?${q}`, { responseType: 'blob' });
      downloadBlob(new Blob([res.data]), `budget-variance-${period}.${fmt}`);
      toast.success(`Exported as ${fmt.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const TABS = [
    { key: 'summary',  label: 'Summary' },
    { key: 'detail',   label: `Detail (${(lines ?? []).length})` },
    { key: 'trend',    label: 'Monthly Trend' },
    { key: 'forecast', label: 'EOY Forecast' },
  ] as const;

  const overBudgetLines = lines.filter(l => l.status === 'OVER_BUDGET');

  return (
    <AppPage
      title="Budget vs Actual"
      subtitle="Variance analysis · EOY forecast · Account-level drill-through"
      icon={<Icon name="CHART" size={18} />}
      crumbs={[{ label: 'Budgets', to: '/accounting/budgets' }, { label: 'Variance Analysis' }]}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
            <Icon name="CALENDAR" size={13} className="text-slate-400" />
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none w-24" />
          </div>
          <Btn variant="ghost" size="sm" icon={<Icon name="REFRESH" size={12} className={loading ? 'animate-spin' : ''} />} onClick={fetchAll}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Icon name="SYNC" size={12} className={syncing ? 'animate-spin' : ''} />} onClick={handleSyncActuals} disabled={syncing}>Sync Actuals</Btn>
          {can('reports:financial:read') && (
            <>
              <Btn variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={12} />} onClick={() => handleExport('xlsx')} disabled={exporting}>Excel</Btn>
              <Btn variant="secondary" size="sm" icon={<Icon name="DOWNLOAD" size={12} />} onClick={() => handleExport('pdf')} disabled={exporting}>PDF</Btn>
            </>
          )}
        </div>
      }
      tabs={<AppTabs tabs={TABS.map(t => ({ key: t.key, label: t.label }))} active={activeTab} onChange={k => setActiveTab(k as any)} />}
    >
      {/* Alert for over-budget items */}
      {overBudgetLines.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-800 rounded-xl text-sm mb-4">
          <Icon name="WARNING" size={15} className="text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-rose-800 dark:text-rose-200">{overBudgetLines.length} account{overBudgetLines.length > 1 ? 's' : ''} over budget</p>
            <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
              {overBudgetLines.slice(0, 3).map(l => l.accountName).join(', ')}{overBudgetLines.length > 3 ? ` +${overBudgetLines.length - 3} more` : ''}
            </p>
          </div>
          <button onClick={() => setActiveTab('detail')} className="text-xs font-bold text-rose-600 hover:underline shrink-0">View all →</button>
        </div>
      )}

      {activeTab === 'summary'  && <SummaryTab summary={summary} lines={lines} loading={loading} />}
      {activeTab === 'detail'   && <DetailTab lines={lines} loading={loading} period={period} />}

      {activeTab === 'trend' && (
        <div className="space-y-5">
          {/* Trend KPI strip */}
          {trendData?.trend && trendData.trend.length > 0 && (() => {
            const last  = trendData.trend[trendData.trend.length - 1];
            const first = trendData.trend[0];
            const avgUtil = Math.round(trendData.trend.reduce((s: number, p: any) => s + (p.utilizationPct ?? 0), 0) / trendData.trend.length);
            const improving = last.totalActual <= last.totalBudget;
            return (
              <div className="ovds-stat-row">
                {[
                  { label: 'Trend Period',   value: `${first.period} – ${last.period}`, accent: 'bg-slate-400' },
                  { label: 'Latest Budget',  value: fmtK(last.totalBudget),             accent: 'bg-violet-500' },
                  { label: 'Latest Actual',  value: fmtK(last.totalActual),             accent: last.totalActual <= last.totalBudget ? 'bg-emerald-500' : 'bg-rose-500' },
                  { label: 'Avg Utilization',value: `${avgUtil}%`,                      accent: avgUtil <= 100 ? 'bg-sky-500' : 'bg-amber-500' },
                  { label: 'Trend',          value: improving ? '▲ On Track' : '▼ Over', accent: improving ? 'bg-emerald-500' : 'bg-rose-500' },
                ].map(k => (
                  <div key={k.label} className="ovds-kpi-cell">
                    <div className={`w-1 h-8 rounded-full shrink-0 ${k.accent}`} />
                    <div>
                      <p className="ovds-value-sm tabular-nums">{k.value}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Bar chart */}
          <div className="ovds-widget-card">
            <div className="ovds-widget-header">
              <p className="ovds-card-title">Monthly Budget vs Actual</p>
              <p className="ovds-caption">Last {trendData?.months ?? 6} months ending {period}</p>
            </div>
            <div className="ovds-widget-body" style={{ height: 320 }}>
              {trendLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Icon name="REFRESH" size={20} className="animate-spin text-slate-300" />
                </div>
              ) : !trendData?.trend?.length ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Icon name="CHART" size={28} className="text-slate-200 dark:text-slate-700" />
                  <p className="text-sm text-slate-400">No budget data for this range.</p>
                  <Link to="/accounting/budgets" className="text-xs text-emerald-600 underline">Set up budgets →</Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData.trend} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => fmtK(v)} />
                    <Tooltip
                      formatter={(value: any, name: any) => [fmtK(Number(value)), name === 'totalBudget' ? 'Budget' : 'Actual']}
                      labelStyle={{ fontSize: 11, fontWeight: 700 }}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Legend formatter={(v: string) => v === 'totalBudget' ? 'Budget' : 'Actual'} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="totalBudget" name="totalBudget" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="totalActual" name="totalActual" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Month-by-month table */}
          {trendData?.trend && trendData.trend.length > 0 && (
            <AppTable>
              <thead><tr>
                <AppTh>Month</AppTh>
                <AppTh align="right">Budget</AppTh>
                <AppTh align="right">Actual</AppTh>
                <AppTh align="right">Variance</AppTh>
                <AppTh>Utilization</AppTh>
              </tr></thead>
              <tbody>
                {trendData.trend.map((p: any) => {
                  const isFav = p.variance >= 0;
                  return (
                    <AppTr key={p.period}>
                      <AppTd><span className="font-semibold text-[12px] text-slate-700 dark:text-slate-200">{p.period}</span></AppTd>
                      <AppTd align="right"><Amount value={p.totalBudget} size="sm" /></AppTd>
                      <AppTd align="right"><Amount value={p.totalActual} size="sm" /></AppTd>
                      <AppTd align="right">
                        <span className={`font-bold tabular-nums text-[12px] ${isFav ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
                          {isFav ? '+' : ''}{fmtK(p.variance)}
                        </span>
                      </AppTd>
                      <AppTd>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.utilizationPct > 100 ? 'bg-rose-500' : p.utilizationPct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(p.utilizationPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{p.utilizationPct}%</span>
                        </div>
                      </AppTd>
                    </AppTr>
                  );
                })}
              </tbody>
            </AppTable>
          )}
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="p-4 bg-violet-50 border border-violet-200 dark:bg-violet-950/20 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-300">
            <p className="font-bold mb-1 flex items-center gap-2"><Icon name="INFO" size={12} /> EOY Forecast Methodology</p>
            <p>Each account's EOY forecast = YTD actual ÷ (current month / 12) × 12. For seasonal accounts, use the rolling 3-month average. Override individual forecasts in the Budget module to refine projections.</p>
          </div>
          <AppTable>
            <thead><tr>
              <AppTh>Account</AppTh>
              <AppTh>Category</AppTh>
              <AppTh align="right">Full Year Budget</AppTh>
              <AppTh align="right">YTD Actual</AppTh>
              <AppTh align="right">EOY Forecast</AppTh>
              <AppTh align="right">Forecast vs Budget</AppTh>
              <AppTh>Risk</AppTh>
            </tr></thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <AppTr key={i}>{Array.from({ length: 7 }).map((_, j) => <AppTd key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></AppTd>)}</AppTr>
              )) : lines.filter(l => l.ytdBudget > 0).map(l => {
                const fvb = l.forecastEOY - l.ytdBudget;
                const risk = fvb > l.ytdBudget * 0.15 ? 'HIGH' : fvb > 0 ? 'MEDIUM' : 'LOW';
                return (
                  <AppTr key={l.id}>
                    <AppTd className="font-semibold">{l.accountName}</AppTd>
                    <AppTd><span className="text-[10px] text-slate-500">{l.category}</span></AppTd>
                    <AppTd align="right"><Amount value={l.ytdBudget} size="sm" /></AppTd>
                    <AppTd align="right"><Amount value={l.ytdActual} size="sm" /></AppTd>
                    <AppTd align="right">
                      <span className={`font-bold tabular-nums text-[12px] ${l.forecastEOY > l.ytdBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {fmtK(l.forecastEOY)}
                      </span>
                    </AppTd>
                    <AppTd align="right">
                      <span className={`font-bold tabular-nums text-[12px] ${fvb > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {fvb > 0 ? `+${fmtK(fvb)}` : fmtK(fvb)}
                      </span>
                    </AppTd>
                    <AppTd>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {risk}
                      </span>
                    </AppTd>
                  </AppTr>
                );
              })}
            </tbody>
          </AppTable>
        </div>
      )}
    </AppPage>
  );
};

export default BudgetVariance;

