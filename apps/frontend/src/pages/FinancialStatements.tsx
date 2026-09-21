/**
 * Financial Statements — IFRS-compliant
 * IAS 1 — Presentation of Financial Statements
 *
 * Covers all five primary statements:
 *   1. Statement of Financial Position (Balance Sheet)
 *   2. Statement of Profit or Loss and OCI (Income Statement)
 *   3. Statement of Cash Flows (IAS 7)
 *   4. Statement of Changes in Equity  → /reports/equity
 *   5. Notes to Financial Statements   → Notes tab here
 *
 * Ethiopian AABE standard chart structure assumed.
 */
import React, { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';

import {
  AppPage,
  AppTabs,
  AppKpi,
  AppTable,
  AppTh,
  AppTd,
  AppTr,
  Btn,
  Icon,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { downloadBlob } from '../utils/download';

// -- Types ---------------------------------------------------------------------
interface BSLine {
  code: string;
  name: string;
  amount: number;
  level: number;
  isTotal?: boolean;
}
interface PLLine {
  code: string;
  name: string;
  amount: number;
  level: number;
  isTotal?: boolean;
  category?: string;
}
interface CFLine {
  name: string;
  amount: number;
  level: number;
  isTotal?: boolean;
  section?: 'OPERATING' | 'INVESTING' | 'FINANCING';
}
export interface NoteLine {
  ref: string;
  title: string;
  content: string;
}

interface BalanceSheet {
  assets: BSLine[];
  liabilities: BSLine[];
  equity: BSLine[];
  totalAssets: number;
  totalLiabEquity: number;
  period: string;
}
interface IncomeStatement {
  lines: PLLine[];
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  period: string;
}
interface CashFlowStatement {
  lines: CFLine[];
  operating: number;
  investing: number;
  financing: number;
  netChange: number;
  openingCash: number;
  closingCash: number;
  period: string;
}

const today = new Date();
const yearStart = `${today.getFullYear()}-01-01`;
const todayStr = today.toISOString().slice(0, 10);

const fmt = (n: number, abs = false) => {
  const val = abs ? Math.abs(n) : n;
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};
const fmtK = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `ETB ${(n / 1_000_000).toFixed(2)}M`
    : Math.abs(n) >= 1_000
      ? `ETB ${(n / 1_000).toFixed(1)}K`
      : `ETB ${fmt(n)}`;

// -- Balance Sheet -------------------------------------------------------------
const BalanceSheetTab: React.FC<{
  startDate: string;
  endDate: string;
  companyId?: string;
  comparePrior?: boolean;
}> = ({ startDate, endDate, companyId, comparePrior }) => {
  const [data, setData] = useState<BalanceSheet | null>(null);
  const [priorData, setPrior] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [_showNotes, _setShowNotes] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ startDate, endDate });
      if (companyId) q.set('companyId', companyId);
      if (comparePrior) q.set('comparePriorYear', 'true');
      const endpoint = comparePrior
        ? `/ovds/reports/balance-sheet-comparative`
        : `/ovds/reports/balance-sheet`;
      const res = await api
        .get(`${endpoint}?${q}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => ({ data: null }));
      const normalizeBS = (raw: any): BalanceSheet | null => {
        if (!raw) return null;
        return {
          ...raw,
          assets: Array.isArray(raw.assets) ? raw.assets : [],
          liabilities: Array.isArray(raw.liabilities) ? raw.liabilities : [],
          equity: Array.isArray(raw.equity) ? raw.equity : [],
        };
      };
      const raw = res.data?.data ?? res.data ?? null;
      if (comparePrior && raw?.current) {
        setData(normalizeBS(raw.current));
        setPrior(normalizeBS(raw.prior ?? null));
      } else {
        setData(normalizeBS(raw));
        setPrior(null);
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, companyId, comparePrior]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const balanced = data
    ? Math.abs(data.totalAssets - data.totalLiabEquity) < 0.01
    : false;

  const renderSection = (
    title: string,
    lines: BSLine[] | undefined,
    total: number,
    accentCls: string,
    priorLines?: BSLine[],
    priorTotal?: number,
  ) => (
    <div className="space-y-1">
      <div className={`px-4 py-2 rounded-lg ${accentCls} bg-opacity-10`}>
        <div className="flex justify-between items-center">
          <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
            {title}
          </p>
          {comparePrior && priorLines && (
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              Current · Prior Year
            </span>
          )}
        </div>
      </div>
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between px-4 py-1.5">
              <div className="h-3 bg-slate-100 rounded animate-pulse w-48" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-24" />
            </div>
          ))
        : (lines ?? []).map((l, i) => {
            const prior = priorLines?.find((p) => p.code === l.code);
            return (
              <div
                key={i}
                className={`flex justify-between px-4 py-1.5 ${l.isTotal ? 'border-t border-slate-200 font-bold bg-slate-50/80 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'} transition-colors`}
                style={{ paddingLeft: `${1 + l.level * 1.5}rem` }}
              >
                <span
                  className={`flex-1 text-${l.isTotal ? 'sm' : '[12px]'} ${l.isTotal ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {l.code && !l.isTotal && (
                    <span className="font-mono text-[10px] text-slate-300 mr-2">
                      {l.code}
                    </span>
                  )}
                  {l.name}
                </span>
                <span
                  className={`tabular-nums text-${l.isTotal ? 'sm' : '[12px]'} font-${l.isTotal ? 'bold' : 'medium'} ${l.amount < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'} min-w-[90px] text-right`}
                >
                  {l.amount < 0
                    ? `(${fmt(Math.abs(l.amount))})`
                    : fmt(l.amount)}
                </span>
                {comparePrior && (
                  <span className="tabular-nums text-[11px] text-slate-400 min-w-[90px] text-right ml-3">
                    {prior
                      ? prior.amount < 0
                        ? `(${fmt(Math.abs(prior.amount))})`
                        : fmt(prior.amount)
                      : '—'}
                  </span>
                )}
              </div>
            );
          })}
      <div className="flex justify-between px-4 py-2 bg-slate-800 dark:bg-slate-700 rounded-lg mt-1">
        <span className="text-sm font-black text-white flex-1">
          TOTAL {title}
        </span>
        <span className="tabular-nums text-sm font-black text-[var(--pro-azure-light)] min-w-[90px] text-right">
          {fmt(total)}
        </span>
        {comparePrior && priorTotal !== undefined && (
          <span className="tabular-nums text-sm font-bold text-slate-300 min-w-[90px] text-right ml-3">
            {fmt(priorTotal)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {data && (
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${balanced ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
        >
          <Icon name={balanced ? 'SUCCESS' : 'WARNING'} size={13} />
          <span className="font-semibold">
            {balanced
              ? 'Balance Sheet is balanced — Assets = Liabilities + Equity'
              : 'IMBALANCE DETECTED: Assets ≠ Liabilities + Equity. Check journal entries.'}
          </span>
          {!balanced && (
            <span className="ml-auto font-mono">
              Diff: ETB {fmt(Math.abs(data.totalAssets - data.totalLiabEquity))}
            </span>
          )}
        </div>
      )}

      <div className="ovds-grid-layout cols-4 gap-sm">
        {[
          {
            label: 'Total Assets',
            value: data?.totalAssets ?? 0,
            accent: 'bg-[var(--pro-azure-50)]0',
          },
          {
            label: 'Total Liabilities',
            value: data?.liabilities?.find((l) => l.isTotal)?.amount ?? 0,
            accent: 'bg-rose-500',
          },
          {
            label: 'Total Equity',
            value: data?.equity?.find((l) => l.isTotal)?.amount ?? 0,
            accent: 'bg-violet-500',
          },
          {
            label: 'Balanced',
            value: balanced ? 100 : 0,
            suffix: '%',
            accent: balanced ? 'bg-[var(--pro-azure-50)]0' : 'bg-rose-500',
          },
        ].map((k) => (
          <div key={k.label} className="ovds-widget-card p-4">
            <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p className="ovds-value-sm tabular-nums mt-1 text-slate-800 dark:text-slate-100">
              {k.suffix ? `${k.value}${k.suffix}` : fmtK(k.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="ovds-widget-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Statement of Financial Position
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            As at{' '}
            {new Date(endDate).toLocaleDateString('en-ET', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            IAS 1.54 — All amounts in Ethiopian Birr (ETB)
          </p>
        </div>
        <div className="p-5 space-y-6">
          {data ? (
            <>
              {renderSection(
                'Assets',
                data.assets,
                data.totalAssets,
                'bg-[var(--pro-azure-50)]0',
                priorData?.assets,
                priorData?.totalAssets,
              )}
              {renderSection(
                'Liabilities',
                data.liabilities,
                data.liabilities.find((l) => l.isTotal)?.amount ?? 0,
                'bg-rose-500',
                priorData?.liabilities,
                priorData?.liabilities?.find((l) => l.isTotal)?.amount,
              )}
              {renderSection(
                'Equity',
                data.equity,
                data.equity.find((l) => l.isTotal)?.amount ?? 0,
                'bg-violet-500',
                priorData?.equity,
                priorData?.equity?.find((l) => l.isTotal)?.amount,
              )}
            </>
          ) : (
            !loading && (
              <div className="py-12 text-center">
                <Icon
                  name="CHART"
                  size={32}
                  className="mx-auto text-slate-200 mb-2"
                />
                <p className="text-sm text-slate-400">
                  No balance sheet data found for this period.
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Ensure your Chart of Accounts has postings for the selected
                  period.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* IAS 1 structure note */}
      <div className="flex gap-3 px-4 py-3 bg-sky-50 border border-sky-100 dark:bg-sky-950/20 dark:border-sky-900 rounded-xl text-xs text-sky-700 dark:text-sky-300">
        <Icon name="INFO" size={13} className="shrink-0 mt-0.5" />
        <span>
          <strong>IAS 1.60</strong>: Assets and liabilities must be classified
          as current/non-current (unless liquidity presentation is more
          relevant). <strong>IAS 1.54</strong> specifies minimum line items.
          AABE IFRS standard chart: Assets 1xxx · Liabilities 2xxx · Equity
          3xxx.
        </span>
      </div>
    </div>
  );
};

// -- Income Statement ----------------------------------------------------------

/** Profit waterfall bar — animated SVG-free CSS waterfall */
const WaterfallBar: React.FC<{
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
}> = ({ revenue, grossProfit, operatingProfit, netProfit }) => {
  if (!revenue || revenue === 0) return null;
  const pct = (v: number) => Math.max(0, Math.min(100, (Math.abs(v) / Math.abs(revenue)) * 100));
  const steps = [
    { label: 'Revenue', value: revenue, color: 'bg-[var(--pro-azure-50)]0', pct: 100 },
    { label: 'Gross Profit', value: grossProfit, color: grossProfit >= 0 ? 'bg-sky-500' : 'bg-rose-400', pct: pct(grossProfit) },
    { label: 'EBIT', value: operatingProfit, color: operatingProfit >= 0 ? 'bg-violet-500' : 'bg-rose-400', pct: pct(operatingProfit) },
    { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? 'bg-[var(--pro-azure)]' : 'bg-rose-600', pct: pct(netProfit) },
  ];
  return (
    <div className="ovds-widget-card p-5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Profit Waterfall</p>
      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-24 shrink-0 text-right">{s.label}</span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-5 overflow-hidden">
              <div
                className={`h-full rounded-full ${s.color} transition-all duration-700`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold tabular-nums w-28 text-right shrink-0 ${s.value < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
              {s.value < 0 ? `(${fmtK(Math.abs(s.value))})` : fmtK(s.value)}
            </span>
            <span className="text-[10px] text-slate-400 w-12 text-right shrink-0 tabular-nums">
              {revenue !== 0 ? `${((Math.abs(s.value) / Math.abs(revenue)) * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Margin ratio pills */
const MarginRatios: React.FC<{
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  priorRevenue?: number;
  priorNetProfit?: number;
}> = ({ revenue, grossProfit, operatingProfit, netProfit, priorRevenue, priorNetProfit }) => {
  const margin = (v: number, base: number) => base !== 0 ? (v / base) * 100 : 0;
  const gm = margin(grossProfit, revenue);
  const om = margin(operatingProfit, revenue);
  const nm = margin(netProfit, revenue);
  const priorNm = priorRevenue && priorNetProfit ? margin(priorNetProfit, priorRevenue) : null;
  const nmDelta = priorNm !== null ? nm - priorNm : null;

  const Pill = ({ label, value, suffix = '%', delta }: { label: string; value: number; suffix?: string; delta?: number | null }) => {
    const isNeg = value < 0;
    const bgCls = isNeg ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800' : 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:bg-green-950/20 dark:border-green-800';
    const txtCls = isNeg ? 'text-rose-700 dark:text-rose-400' : 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]';
    return (
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${bgCls}`}>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          {delta !== null && delta !== undefined && (
            <span className={`text-[10px] font-bold ${delta >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}pp
            </span>
          )}
          <span className={`text-sm font-black tabular-nums ${txtCls}`}>
            {value.toFixed(1)}{suffix}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <Pill label="Gross Margin" value={gm} />
      <Pill label="Operating Margin" value={om} />
      <Pill label="Net Margin" value={nm} delta={nmDelta} />
    </div>
  );
};

const IncomeStatementTab: React.FC<{
  startDate: string;
  endDate: string;
  companyId?: string;
  comparePrior?: boolean;
}> = ({ startDate, endDate, companyId, comparePrior }) => {
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [priorData, setPrior] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) =>
    setCollapsedCats((prev) => {
      const n = new Set(prev);
      if (n.has(cat)) { n.delete(cat); } else { n.add(cat); }
      return n;
    });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ startDate, endDate });
      if (companyId) q.set('companyId', companyId);
      if (comparePrior) q.set('comparePriorYear', 'true');
      const res = await api
        .get(`/ovds/reports/income-statement?${q}`, {
          headers: { 'x-background': '1' },
        } as any)
        .catch(() => ({ data: null }));
      const normalizeIS = (raw: any): IncomeStatement | null => {
        if (!raw) return null;
        return { ...raw, lines: Array.isArray(raw.lines) ? raw.lines : [] };
      };
      const raw = res.data?.data ?? res.data ?? null;
      if (comparePrior && raw?.current) {
        setData(normalizeIS(raw.current));
        setPrior(normalizeIS(raw.prior ?? null));
      } else {
        setData(normalizeIS(raw));
        setPrior(null);
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, companyId, comparePrior]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const catMeta: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    OPERATING:    { label: 'Operating Activities',    color: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)]/60 dark:bg-green-950/10',  border: 'border-[var(--pro-azure-100)] dark:border-green-800', dot: 'bg-[var(--pro-azure-50)]0' },
    INVESTING:    { label: 'Investing Activities',    color: 'text-sky-700 dark:text-sky-400',         bg: 'bg-sky-50/60 dark:bg-sky-950/10',           border: 'border-sky-200 dark:border-sky-800',         dot: 'bg-sky-500' },
    FINANCING:    { label: 'Financing Activities',    color: 'text-violet-700 dark:text-violet-400',   bg: 'bg-violet-50/60 dark:bg-violet-950/10',     border: 'border-violet-200 dark:border-violet-800',   dot: 'bg-violet-500' },
    INCOME_TAX:   { label: 'Income Tax',              color: 'text-rose-700 dark:text-rose-400',       bg: 'bg-rose-50/60 dark:bg-rose-950/10',         border: 'border-rose-200 dark:border-rose-800',       dot: 'bg-rose-500' },
    DISCONTINUED: { label: 'Discontinued Operations', color: 'text-slate-500 dark:text-slate-400',     bg: 'bg-slate-50/60 dark:bg-slate-800/30',       border: 'border-slate-200 dark:border-slate-700',     dot: 'bg-slate-400' },
  };
  const varPct = (curr: number, prior: number): number | null => prior === 0 ? null : ((curr - prior) / Math.abs(prior)) * 100;
  const findPriorLine = (l: PLLine) => priorData?.lines?.find((p) => p.code ? p.code === l.code : p.name === l.name);
  const hasCategoryData = data?.lines?.some((l) => l.category && !l.isTotal) ?? false;
  const netProfit = data?.netProfit ?? 0;
  const taxableIncome = Math.max(0, netProfit);
  const citEst = Math.round(taxableIncome * 0.3 * 100) / 100;
  const effectiveTaxRate = netProfit > 0 ? (citEst / netProfit) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="ovds-grid-layout cols-4 gap-sm">
        {([
          { label: 'Revenue',           value: data?.revenue ?? 0,         priorVal: priorData?.revenue,         accent: 'bg-[var(--pro-azure-50)]0' },
          { label: 'Gross Profit',      value: data?.grossProfit ?? 0,     priorVal: priorData?.grossProfit,     accent: 'bg-sky-500' },
          { label: 'Operating Profit',  value: data?.operatingProfit ?? 0, priorVal: priorData?.operatingProfit, accent: (data?.operatingProfit ?? 0) >= 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-rose-500' },
          { label: 'Net Profit/(Loss)', value: data?.netProfit ?? 0,       priorVal: priorData?.netProfit,       accent: (data?.netProfit ?? 0) >= 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-rose-500' },
        ] as const).map((k) => {
          const vp = comparePrior && k.priorVal !== undefined && k.priorVal !== null ? varPct(k.value, k.priorVal) : null;
          return (
            <div key={k.label} className="ovds-widget-card p-4">
              <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
              {loading ? <div className="h-6 w-24 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mt-1" /> : (
                <p className={`ovds-value-sm tabular-nums mt-1 ${k.value < 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
                  {k.value < 0 ? `(${fmtK(Math.abs(k.value))})` : fmtK(k.value)}
                </p>
              )}
              {vp !== null && !loading && (
                <p className={`text-[10px] font-bold mt-1 tabular-nums ${vp >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>
                  {vp >= 0 ? '▲' : '▼'} {Math.abs(vp).toFixed(1)}% vs prior
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Margin ratios */}
      {data && !loading && (
        <MarginRatios
          revenue={data.revenue}
          grossProfit={data.grossProfit}
          operatingProfit={data.operatingProfit}
          netProfit={data.netProfit}
          priorRevenue={priorData?.revenue}
          priorNetProfit={priorData?.netProfit}
        />
      )}

      {/* Profit waterfall */}
      {data && !loading && (
        <WaterfallBar
          revenue={data.revenue}
          grossProfit={data.grossProfit}
          operatingProfit={data.operatingProfit}
          netProfit={data.netProfit}
        />
      )}

      {/* Statement table */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Statement of Profit or Loss
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            For the period{' '}
            {new Date(startDate).toLocaleDateString('en-ET', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            to{' '}
            {new Date(endDate).toLocaleDateString('en-ET', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            IAS 1.81A · IFRS 18 category classification — All amounts in ETB
          </p>
          {comparePrior && priorData && (
            <div className="flex items-center justify-end gap-6 mt-2 pr-6">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Current</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Prior Year</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Δ%</span>
            </div>
          )}
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex justify-between px-6 py-2 gap-4">
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-48" />
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-24" />
              </div>
            ))
          ) : !data || !data.lines?.length ? (
            <div className="py-16 text-center">
              <Icon name="CHART" size={36} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No income statement data for this period.</p>
            </div>
          ) : hasCategoryData ? (
            (['OPERATING', 'INVESTING', 'FINANCING', 'INCOME_TAX', 'DISCONTINUED'] as const).map((cat) => {
              const catLines = data.lines.filter((l) => l.category === cat);
              if (catLines.length === 0) return null;
              const meta = catMeta[cat];
              const isCollapsed = collapsedCats.has(cat);
              const catTotal = catLines.filter((l) => !l.isTotal).reduce((s, l) => s + l.amount, 0);
              return (
                <div key={cat}>
                  <button onClick={() => toggleCat(cat)} className={`w-full flex items-center justify-between px-5 py-2.5 ${meta.bg} border-b ${meta.border} hover:brightness-95 transition-all`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-bold tabular-nums ${catTotal < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                        {catTotal < 0 ? `(${fmt(Math.abs(catTotal))})` : fmt(catTotal)}
                      </span>
                      <Icon name={isCollapsed ? 'CHEVRON_DOWN' : 'CHEVRON_UP'} size={11} className="text-slate-400" />
                    </div>
                  </button>
                  {!isCollapsed && catLines.map((l, i) => {
                    const priorLine = findPriorLine(l);
                    const vp = comparePrior && priorLine ? varPct(l.amount, priorLine.amount) : null;
                    return (
                      <div key={i} className={`flex items-center px-5 py-2 gap-2 ${l.isTotal ? 'bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 font-bold' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'} transition-colors`} style={{ paddingLeft: `${1.25 + (l.level ?? 0) * 1.5}rem` }}>
                        <span className={`${l.isTotal ? 'text-sm font-bold text-slate-800 dark:text-slate-100' : 'text-[12px] text-slate-600 dark:text-slate-300'} flex-1 min-w-0 truncate`}>
                          {l.code && !l.isTotal && <span className="font-mono text-[10px] text-slate-300 mr-1.5">{l.code}</span>}
                          {l.name}
                        </span>
                        <span className={`tabular-nums shrink-0 min-w-[90px] text-right ${l.isTotal ? 'text-sm font-bold' : 'text-[12px] font-medium'} ${l.amount < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                          {l.amount < 0 ? `(${fmt(Math.abs(l.amount))})` : fmt(l.amount)}
                        </span>
                        {comparePrior && <span className="tabular-nums shrink-0 min-w-[90px] text-right text-[11px] text-slate-400">{priorLine ? (priorLine.amount < 0 ? `(${fmt(Math.abs(priorLine.amount))})` : fmt(priorLine.amount)) : '—'}</span>}
                        {comparePrior && <span className={`tabular-nums shrink-0 min-w-[64px] text-right text-[10px] font-bold ${vp === null ? 'text-slate-300' : vp >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{vp !== null ? `${vp >= 0 ? '▲' : '▼'} ${Math.abs(vp).toFixed(1)}%` : '—'}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            (data.lines ?? []).map((l, i) => {
              const priorLine = findPriorLine(l);
              const vp = comparePrior && priorLine ? varPct(l.amount, priorLine.amount) : null;
              return (
                <div key={i} className={`flex items-center px-6 py-2 gap-2 ${l.isTotal ? 'bg-white dark:bg-slate-800/60 font-bold border-t-2 border-slate-200 dark:border-slate-700' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'} transition-colors`} style={{ paddingLeft: `${1.5 + (l.level ?? 0) * 1.5}rem` }}>
                  <span className={`${l.isTotal ? 'text-sm font-bold text-slate-800 dark:text-slate-100' : 'text-[12px] text-slate-600 dark:text-slate-300'} flex-1 min-w-0 truncate`}>
                    {l.code && !l.isTotal && <span className="font-mono text-[10px] text-slate-300 mr-2">{l.code}</span>}
                    {l.name}
                  </span>
                  <span className={`tabular-nums shrink-0 min-w-[90px] text-right ${l.isTotal ? 'text-sm font-bold' : 'text-[12px] font-medium'} ${l.amount < 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {l.amount < 0 ? `(${fmt(Math.abs(l.amount))})` : fmt(l.amount)}
                  </span>
                  {comparePrior && <span className="tabular-nums shrink-0 min-w-[90px] text-right text-[11px] text-slate-400">{priorLine ? (priorLine.amount < 0 ? `(${fmt(Math.abs(priorLine.amount))})` : fmt(priorLine.amount)) : '—'}</span>}
                  {comparePrior && <span className={`tabular-nums shrink-0 min-w-[64px] text-right text-[10px] font-bold ${vp === null ? 'text-slate-300' : vp >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{vp !== null ? `${vp >= 0 ? '▲' : '▼'} ${Math.abs(vp).toFixed(1)}%` : '—'}</span>}
                </div>
              );
            })
          )}
        </div>
        {data && !loading && (
          <div className="px-6 py-4 bg-slate-900 dark:bg-slate-800 flex items-center justify-between gap-4">
            <span className="text-sm font-black text-white tracking-wide uppercase">Net Profit / (Loss) for the Period</span>
            <div className="flex items-center gap-6">
              {comparePrior && priorData && (
                <span className="text-sm font-bold tabular-nums text-slate-300">
                  {priorData.netProfit < 0 ? `(${fmtK(Math.abs(priorData.netProfit))})` : fmtK(priorData.netProfit)}
                </span>
              )}
              <span className={`text-xl font-black tabular-nums ${netProfit < 0 ? 'text-rose-400' : 'text-[var(--pro-azure-light)]'}`}>
                {netProfit < 0 ? `(${fmtK(Math.abs(netProfit))})` : fmtK(netProfit)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CIT indicative estimate */}
      {data && !loading && netProfit > 0 && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Icon name="CALCULATOR" size={13} className="text-amber-500" />
              Indicative CIT Estimate — Schedule A (30% BIT)
            </p>
            <Link to="/compliance/bit" className="text-[10px] text-[var(--pro-azure)] underline font-semibold">File at Compliance →</Link>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Accounting Profit', value: fmtK(netProfit), color: 'text-slate-800 dark:text-slate-100' },
              { label: 'Taxable Income (est.)', value: fmtK(taxableIncome), color: 'text-slate-800 dark:text-slate-100' },
              { label: 'CIT @ 30%', value: fmtK(citEst), color: 'text-rose-600' },
              { label: 'Effective Tax Rate', value: `${effectiveTaxRate.toFixed(1)}%`, color: effectiveTaxRate > 30 ? 'text-rose-600' : 'text-[var(--pro-azure)]' },
            ].map((k) => (
              <div key={k.label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{k.label}</p>
                <p className={`text-sm font-bold tabular-nums ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <p className="px-5 pb-3 text-[10px] text-slate-400">
            Indicative only — add-backs not applied. MAT applies at 2.5% gross turnover if it exceeds CIT (Proc. 1395/2025).
          </p>
        </div>
      )}

      {/* IFRS 18 info banner */}
      <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900 rounded-xl text-xs text-amber-700 dark:text-amber-300">
        <Icon name="INFO" size={13} className="shrink-0 mt-0.5" />
        <span>
          <strong>IFRS 18</strong> (effective Jan 2027, early adoption permitted): Classifies P&L items into
          Operating, Investing, Financing, Income Tax, and Discontinued operations. Swimlane headers are
          collapsible. Variance column shows % change vs prior year when "Prior year" is enabled.{' '}
          <Link to="/ifrs" className="underline">View IFRS Dashboard →</Link>
        </span>
      </div>
    </div>
  );
};

// -- Cash Flow Statement -------------------------------------------------------
const CashFlowTab: React.FC<{
  startDate: string;
  endDate: string;
  companyId?: string;
}> = ({ startDate, endDate, companyId }) => {
  const [data, setData] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'INDIRECT' | 'DIRECT'>('INDIRECT');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ startDate, endDate, method });
      if (companyId) q.set('companyId', companyId);
      const res = await api
        .get(`/ovds/reports/cash-flow?${q}`, {
          headers: { 'x-background': '1' },
        } as any)
        .catch(() => ({ data: null }));
      const rawCF = res.data?.data ?? res.data ?? null;
      setData(
        rawCF
          ? { ...rawCF, lines: Array.isArray(rawCF.lines) ? rawCF.lines : [] }
          : null,
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, companyId, method]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const SECTION_COLORS = {
    OPERATING: 'bg-[var(--pro-azure-50)]0',
    INVESTING: 'bg-sky-500',
    FINANCING: 'bg-violet-500',
  };

  const sectionLines = (section: 'OPERATING' | 'INVESTING' | 'FINANCING') =>
    (data?.lines ?? []).filter((l) => l.section === section);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500">
          Presentation method:
        </span>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          {(['INDIRECT', 'DIRECT'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${method === m ? 'bg-[var(--pro-azure)] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-slate-400">
          {method === 'INDIRECT'
            ? 'Starts with net profit, adjusts for non-cash items (IAS 7.18)'
            : 'Shows gross cash receipts and payments (IAS 7.19)'}
        </span>
      </div>

      <div className="ovds-grid-layout cols-4 gap-sm">
        {[
          {
            label: 'Operating Activities',
            value: data?.operating ?? 0,
            accent: 'bg-[var(--pro-azure-50)]0',
          },
          {
            label: 'Investing Activities',
            value: data?.investing ?? 0,
            accent: 'bg-sky-500',
          },
          {
            label: 'Financing Activities',
            value: data?.financing ?? 0,
            accent: 'bg-violet-500',
          },
          {
            label: 'Net Cash Change',
            value: data?.netChange ?? 0,
            accent:
              (data?.netChange ?? 0) >= 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-rose-500',
          },
        ].map((k) => (
          <div key={k.label} className="ovds-widget-card p-4">
            <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p
              className={`ovds-value-sm tabular-nums mt-1 ${k.value < 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}
            >
              {k.value < 0 ? `(${fmtK(Math.abs(k.value))})` : fmtK(k.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="ovds-widget-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Statement of Cash Flows
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            For the period{' '}
            {new Date(startDate).toLocaleDateString('en-ET', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            to{' '}
            {new Date(endDate).toLocaleDateString('en-ET', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            IAS 7 — {method} method — All amounts in ETB
          </p>
        </div>

        <div className="p-5 space-y-5">
          {(['OPERATING', 'INVESTING', 'FINANCING'] as const).map((section) => {
            const lines = sectionLines(section);
            const total =
              section === 'OPERATING'
                ? data?.operating
                : section === 'INVESTING'
                  ? data?.investing
                  : data?.financing;
            return (
              <div key={section}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${SECTION_COLORS[section]}/10 mb-2`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${SECTION_COLORS[section]}`}
                  />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    {section.replace('_', ' ')} ACTIVITIES
                  </p>
                </div>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between px-4 py-1.5">
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-48" />
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-20" />
                      </div>
                    ))
                  : lines.map((l, i) => (
                      <div
                        key={i}
                        className={`flex justify-between px-4 py-1.5 ${l.isTotal ? 'font-bold bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200' : 'hover:bg-slate-50/50'} transition-colors`}
                        style={{
                          paddingLeft: `${1 + (l.level ?? 0) * 1.5}rem`,
                        }}
                      >
                        <span
                          className={`${l.isTotal ? 'text-sm font-bold text-slate-800 dark:text-slate-100' : 'text-[12px] text-slate-600 dark:text-slate-300'}`}
                        >
                          {l.name}
                        </span>
                        <span
                          className={`tabular-nums ${l.isTotal ? 'text-sm font-bold' : 'text-[12px]'} ${l.amount < 0 ? 'text-rose-600' : 'text-slate-700'}`}
                        >
                          {l.amount < 0
                            ? `(${fmt(Math.abs(l.amount))})`
                            : fmt(l.amount)}
                        </span>
                      </div>
                    ))}
                {total !== undefined && (
                  <div className="flex justify-between px-4 py-2 bg-slate-800 dark:bg-slate-700 rounded-lg mt-1">
                    <span className="text-sm font-black text-white">
                      Net {section} Cash Flow
                    </span>
                    <span
                      className={`tabular-nums text-sm font-black ${(total ?? 0) >= 0 ? 'text-[var(--pro-azure-light)]' : 'text-rose-400'}`}
                    >
                      {(total ?? 0) < 0
                        ? `(${fmt(Math.abs(total ?? 0))})`
                        : fmt(total ?? 0)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {data && (
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-4 space-y-2">
              {[
                {
                  label: 'Opening Cash & Cash Equivalents',
                  value: data.openingCash,
                },
                { label: 'Net Change in Cash', value: data.netChange },
                {
                  label: 'Closing Cash & Cash Equivalents',
                  value: data.closingCash,
                  bold: true,
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className={`flex justify-between px-4 py-2 ${r.bold ? 'bg-[var(--pro-azure)] rounded-lg' : ''}`}
                >
                  <span
                    className={`${r.bold ? 'text-sm font-black text-white' : 'text-[12px] font-semibold text-slate-700 dark:text-slate-200'}`}
                  >
                    {r.label}
                  </span>
                  <span
                    className={`tabular-nums ${r.bold ? 'text-sm font-black text-white' : 'text-[12px] font-bold text-slate-700 dark:text-slate-200'}`}
                  >
                    {r.value < 0 ? `(${fmt(Math.abs(r.value))})` : fmt(r.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-4 py-3 bg-sky-50 border border-sky-100 dark:bg-sky-950/20 dark:border-sky-900 rounded-xl text-xs text-sky-700 dark:text-sky-300">
        <Icon name="INFO" size={13} className="shrink-0 mt-0.5" />
        <span>
          <strong>IAS 7.10</strong>: Cash flows are classified into Operating,
          Investing, and Financing. The indirect method (IAS 7.18) reconciles
          net profit to operating cash flows. Direct method (IAS 7.19) is
          encouraged by IASB. Both are IFRS-compliant.
        </span>
      </div>
    </div>
  );
};

// -- Notes to Financial Statements ---------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export const STANDARD_NOTES: NoteLine[] = [
  {
    ref: 'IAS 1.112',
    title: 'Basis of Preparation',
    content:
      'These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as adopted by the Accounting and Auditing Board of Ethiopia (AABE). The financial statements are prepared on the historical cost basis, except where otherwise stated. The functional and presentation currency is Ethiopian Birr (ETB).',
  },
  {
    ref: 'IAS 1.117',
    title: 'Significant Accounting Policies',
    content:
      'Revenue is recognised in accordance with IFRS 15. Property, plant and equipment are measured at cost less accumulated depreciation (IAS 16). Inventories are measured at the lower of cost and net realisable value using FIFO (IAS 2). Financial instruments are classified and measured per IFRS 9.',
  },
  {
    ref: 'IAS 12.79',
    title: 'Income Tax — BIT Reconciliation',
    content:
      'Current tax is calculated at 30% of taxable income (Proclamation No. 1395/2025). Minimum Alternative Tax (MAT) at 2.5% of annual turnover applies where it exceeds regular BIT. Deferred tax is recognised on all temporary differences between IFRS carrying amounts and their tax bases.',
  },
  {
    ref: 'IAS 19.135',
    title: 'Employee Benefits',
    content:
      'Short-term employee benefits (salaries, wages, annual leave) are accrued in the period in which service is rendered. Employer pension contributions (11% of insurable earnings up to ETB 15,000/month) are recognised as an expense in the period of service. Post-employment benefits are accounted for as defined contribution plans.',
  },
  {
    ref: 'IAS 21.52',
    title: 'Foreign Currency',
    content:
      'Transactions in foreign currencies are translated at the exchange rate at the date of the transaction. Monetary assets and liabilities are retranslated at the closing rate from the National Bank of Ethiopia (NBE). Foreign exchange differences are recognised in profit or loss (IAS 21 P&L treatment) unless designated as hedging instruments.',
  },
  {
    ref: 'IFRS 9.B5.5',
    title: 'Expected Credit Losses',
    content:
      'The Company applies the simplified approach under IFRS 9 for trade receivables — lifetime ECL is recognised from initial recognition using a provision matrix based on historical default rates and forward-looking adjustments.',
  },
  {
    ref: 'IFRS 16.47',
    title: 'Leases',
    content:
      'Right-of-use assets and lease liabilities are recognised for all leases with terms exceeding 12 months. Short-term and low-value asset leases are expensed on a straight-line basis. Lease liabilities are measured at the present value of remaining lease payments, discounted using the incremental borrowing rate.',
  },
  {
    ref: 'IAS 37.84',
    title: 'Provisions & Contingencies',
    content:
      'Provisions are recognised when the Company has a present obligation, it is probable that an outflow of resources will be required, and the amount can be reliably estimated. The DRRF levy (Disaster Risk Response Fund, Regulation 570/2025) is accrued monthly as an operating expense.',
  },
  {
    ref: 'IAS 40',
    title: 'Investment Property',
    content:
      'Investment properties held for rental income or capital appreciation are measured at cost less depreciation. Market value disclosures are provided where available from municipal assessments. Rental income tax of 15% is payable on net rental income (Proclamation No. 1395/2025).',
  },
];

const NotesTab: React.FC = () => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['IAS 1.112']));
  const toggle = (ref: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(ref)) {
        n.delete(ref);
      } else {
        n.add(ref);
      }
      return n;
    });

  return (
    <div className="space-y-3">
      <div className="p-4 bg-violet-50 border border-violet-200 dark:bg-violet-950/20 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-300">
        <p className="font-bold mb-1 flex items-center gap-2">
          <Icon name="INFO" size={12} /> Notes to Financial Statements — IAS
          1.112
        </p>
        <p>
          Notes form an integral part of the financial statements and must be
          cross-referenced to statement line items. Mandatory disclosures are
          pre-populated below based on your accounting policies. Edit notes in
          Settings → IFRS Standards.
        </p>
      </div>

      {STANDARD_NOTES.map((note) => (
        <div key={note.ref} className="ovds-widget-card overflow-hidden">
          <button
            onClick={() => toggle(note.ref)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 rounded-full font-mono">
                {note.ref}
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {note.title}
              </span>
            </div>
            <Icon
              name={expanded.has(note.ref) ? 'CHEVRON_UP' : 'CHEVRON_DOWN'}
              size={13}
              className="text-slate-400"
            />
          </button>
          {expanded.has(note.ref) && (
            <div className="px-5 pb-5">
              <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {note.content}
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">
          Additional notes (segment information, related party disclosures,
          events after reporting date) should be added per IAS 24, IFRS 8, and
          IAS 10.
        </p>
        <Link
          to="/settings"
          className="text-xs text-[var(--pro-azure)] underline mt-1 inline-block"
        >
          Configure accounting policies in Settings →
        </Link>
      </div>
    </div>
  );
};

// -- Trial Balance -------------------------------------------------------------
const TrialBalanceTab: React.FC<{ endDate: string; companyId?: string }> = ({
  endDate,
  companyId,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ asOf: endDate });
      if (companyId) q.set('companyId', companyId);
      const res = await api
        .get(`/ovds/reports/trial-balance?${q}`, {
          headers: { 'x-background': '1' },
        } as any)
        .catch(() => ({ data: [] }));
      const raw = res.data?.data ?? res.data ?? [];
      setData(
        Array.isArray(raw)
          ? raw
          : (raw?.items ?? raw?.rows ?? raw?.accounts ?? []),
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = search
    ? data.filter(
        (r: any) =>
          r.accountName?.toLowerCase().includes(search.toLowerCase()) ||
          r.accountCode?.toLowerCase().includes(search.toLowerCase()),
      )
    : data;

  const totals = filtered.reduce(
    (acc: any, r: any) => ({
      debit: acc.debit + Number(r.debit ?? 0),
      credit: acc.credit + Number(r.credit ?? 0),
    }),
    { debit: 0, credit: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon
            name="SEARCH"
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <span className="ovds-caption">{filtered.length} accounts</span>
        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${Math.abs(totals.debit - totals.credit) < 0.01 ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'bg-rose-50 text-rose-700'}`}
        >
          {Math.abs(totals.debit - totals.credit) < 0.01
            ? '✓ Balanced'
            : '✗ Imbalanced'}
        </div>
      </div>

      <AppTable>
        <thead>
          <tr>
            <AppTh>Code</AppTh>
            <AppTh>Account Name</AppTh>
            <AppTh>Type</AppTh>
            <AppTh align="right">Debit (ETB)</AppTh>
            <AppTh align="right">Credit (ETB)</AppTh>
            <AppTh align="right">Balance (ETB)</AppTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <AppTr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <AppTd key={j}>
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                  </AppTd>
                ))}
              </AppTr>
            ))
          ) : filtered.length === 0 ? (
            <AppTr>
              <td
                colSpan={6}
                className="py-12 text-center text-sm text-slate-400"
              >
                No accounts found for this period.
              </td>
            </AppTr>
          ) : (
            filtered.map((r: any, i: number) => (
              <AppTr key={i}>
                <AppTd className="font-mono text-[11px]">{r.accountCode}</AppTd>
                <AppTd className="font-semibold">{r.accountName}</AppTd>
                <AppTd>
                  <span className="text-[10px] font-bold text-slate-400">
                    {r.accountType}
                  </span>
                </AppTd>
                <AppTd align="right" className="tabular-nums">
                  {r.debit > 0 ? fmt(r.debit) : '—'}
                </AppTd>
                <AppTd align="right" className="tabular-nums">
                  {r.credit > 0 ? fmt(r.credit) : '—'}
                </AppTd>
                <AppTd
                  align="right"
                  className={`tabular-nums font-bold ${r.balance < 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}
                >
                  {fmt(r.balance)}
                </AppTd>
              </AppTr>
            ))
          )}
        </tbody>
        {filtered.length > 0 && (
          <tfoot>
            <tr className="bg-slate-800 dark:bg-slate-700">
              <td
                colSpan={3}
                className="px-4 py-3 text-sm font-black text-white"
              >
                TOTALS
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-black text-[var(--pro-azure-light)]">
                {fmt(totals.debit)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-black text-[var(--pro-azure-light)]">
                {fmt(totals.credit)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm font-black text-white">
                {fmt(Math.abs(totals.debit - totals.credit))}
              </td>
            </tr>
          </tfoot>
        )}
      </AppTable>
    </div>
  );
};

// -- IAS 24 — Related Party Disclosures ---------------------------------------
const RelatedPartiesTab: React.FC<{
  startDate: string;
  endDate: string;
  companyId?: string;
}> = ({ startDate, endDate, companyId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ startDate, endDate });
      if (companyId) q.set('companyId', companyId);
      const res = await api
        .get(`/ovds/reports/ias24-related-parties?${q}`, {
          headers: { 'x-background': '1' },
        } as any)
        .catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );

  if (!data)
    return (
      <div className="ovds-empty py-16">
        <Icon name="INFO" size={24} className="text-slate-300 mb-3" />
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          No related party data
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Ensure intercompany transactions and employee records exist for this
          period.
        </p>
      </div>
    );

  const fmtETB = (n: number) =>
    `ETB ${n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* IAS 24 banner */}
      <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl">
        <p className="text-sm font-bold text-violet-800 dark:text-violet-300 mb-1 flex items-center gap-2">
          <Icon name="INFO" size={13} /> IAS 24 — Related Party Disclosures
        </p>
        <p className="text-xs text-violet-700 dark:text-violet-400">
          Entities must disclose relationships and transactions with related
          parties regardless of whether a price was charged. Disclosure is
          required even if no transactions occurred (IAS 24.13).
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="ovds-grid-layout cols-4 gap-sm">
        {[
          {
            label: 'Related Parties',
            value: data.summary?.totalRelatedParties ?? 0,
            accent: 'bg-violet-500',
          },
          {
            label: 'KMP Personnel',
            value: data.summary?.totalKmpPersonnel ?? 0,
            accent: 'bg-sky-500',
          },
          {
            label: 'Interco Transactions',
            value: data.summary?.totalIntercoTransactions ?? 0,
            accent: 'bg-[var(--pro-azure-50)]0',
          },
          {
            label: 'Total Interco Volume',
            value: fmtETB(data.summary?.totalIntercoVolume ?? 0),
            accent: 'bg-amber-500',
            isText: true,
          },
        ].map((k) => (
          <div key={k.label} className="ovds-widget-card p-4">
            <div className={`w-1.5 h-8 rounded-full ${k.accent} mb-2`} />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p className="ovds-value-sm tabular-nums mt-1 text-slate-800 dark:text-slate-100">
              {k.isText ? k.value : k.value}
            </p>
          </div>
        ))}
      </div>

      {/* KMP Compensation — IAS 24.17 */}
      {data.kmpCompensation && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <p className="ovds-card-title flex items-center gap-2">
              <Icon name="USERS" size={13} className="text-sky-500" />
              Key Management Personnel (KMP) Compensation — IAS 24.17
            </p>
          </div>
          <div className="ovds-widget-body">
            <div className="ovds-grid-layout cols-3 gap-sm mb-4">
              {[
                {
                  label: 'Short-term Benefits',
                  value: fmtETB(data.kmpCompensation.shortTermBenefits ?? 0),
                },
                {
                  label: 'Post-employment (Pension)',
                  value: fmtETB(
                    data.kmpCompensation.postEmploymentBenefits ?? 0,
                  ),
                },
                {
                  label: 'Withholding Tax (PIT)',
                  value: fmtETB(data.kmpCompensation.withholdingTax ?? 0),
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className="p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 rounded-xl"
                >
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                    {k.value}
                  </p>
                </div>
              ))}
            </div>
            {data.keyManagementPersonnel?.length > 0 && (
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Name</AppTh>
                    <AppTh>Position</AppTh>
                    <AppTh>Email</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {data.keyManagementPersonnel.map((kmp: any) => (
                    <AppTr key={kmp.id}>
                      <AppTd className="font-semibold">{kmp.name}</AppTd>
                      <AppTd>{kmp.position}</AppTd>
                      <AppTd className="text-[11px] text-slate-500">
                        {kmp.email ?? '—'}
                      </AppTd>
                    </AppTr>
                  ))}
                </tbody>
              </AppTable>
            )}
            <p className="text-[10px] text-slate-400 mt-2">
              {data.kmpCompensation.note}
            </p>
          </div>
        </div>
      )}

      {/* Intercompany Transactions */}
      {data.intercompanyTransactions?.length > 0 && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <p className="ovds-card-title flex items-center gap-2">
              <Icon
                name="ARROW_LEFT_RIGHT"
                size={13}
                className="text-[var(--pro-azure)]"
              />
              Intercompany Transactions — IAS 24.17 & IFRS 10.B86
            </p>
          </div>
          <AppTable>
            <thead>
              <tr>
                <AppTh>Date</AppTh>
                <AppTh>Type</AppTh>
                <AppTh>From</AppTh>
                <AppTh>To</AppTh>
                <AppTh align="right">Amount (ETB)</AppTh>
                <AppTh>Direction</AppTh>
              </tr>
            </thead>
            <tbody>
              {data.intercompanyTransactions.map((tx: any) => (
                <AppTr key={tx.id}>
                  <AppTd className="text-[11px] text-slate-500">
                    {tx.date
                      ? new Date(tx.date).toLocaleDateString('en-ET')
                      : '—'}
                  </AppTd>
                  <AppTd>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {tx.type}
                    </span>
                  </AppTd>
                  <AppTd className="text-[11px]">{tx.fromCompany}</AppTd>
                  <AppTd className="text-[11px]">{tx.toCompany}</AppTd>
                  <AppTd align="right" className="tabular-nums font-semibold">
                    {fmtETB(Number(tx.amount ?? 0))}
                  </AppTd>
                  <AppTd>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tx.direction === 'OUTGOING'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          : 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)] dark:bg-green-950/20 dark:text-[var(--pro-azure-light)]'
                      }`}
                    >
                      {tx.direction}
                    </span>
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}

      {/* Related Party Balances */}
      {data.relatedPartyBalances?.length > 0 && (
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <p className="ovds-card-title">
              Outstanding Balances with Related Parties
            </p>
          </div>
          <AppTable>
            <thead>
              <tr>
                <AppTh>Related Party</AppTh>
                <AppTh align="right">Receivable</AppTh>
                <AppTh align="right">Payable</AppTh>
                <AppTh align="right">Net Balance</AppTh>
                <AppTh>Transactions</AppTh>
              </tr>
            </thead>
            <tbody>
              {data.relatedPartyBalances.map((b: any) => (
                <AppTr key={b.relatedPartyId}>
                  <AppTd className="font-semibold">{b.relatedPartyName}</AppTd>
                  <AppTd
                    align="right"
                    className="tabular-nums text-[var(--pro-azure)] font-semibold"
                  >
                    {fmtETB(b.receivable)}
                  </AppTd>
                  <AppTd
                    align="right"
                    className="tabular-nums text-rose-600 font-semibold"
                  >
                    {fmtETB(b.payable)}
                  </AppTd>
                  <AppTd
                    align="right"
                    className={`tabular-nums font-bold ${b.netBalance >= 0 ? 'text-[var(--pro-azure-dark)]' : 'text-rose-700'}`}
                  >
                    {fmtETB(b.netBalance)}
                  </AppTd>
                  <AppTd className="text-[11px] text-slate-500">
                    {b.transactionCount}
                  </AppTd>
                </AppTr>
              ))}
            </tbody>
          </AppTable>
        </div>
      )}

      {/* Mandatory disclosure notes */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
          Mandatory Disclosure Notes — IAS 24
        </p>
        {data.disclosureNotes?.map((note: string, i: number) => (
          <div
            key={i}
            className="flex items-start gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl"
          >
            <span className="text-[10px] font-black text-slate-400 shrink-0 mt-0.5">
              {i + 1}.
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {note}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 text-right">
        IAS 24 — Related Party Disclosures (IASB) · Period: {data.period}
      </p>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------

/** Maps sidebar ?tab= shortcodes → internal tab keys */
const TAB_PARAM_MAP: Record<string, 'balance-sheet' | 'income-statement' | 'cash-flow' | 'trial-balance' | 'notes' | 'related-parties'> = {
  'bs':               'balance-sheet',
  'balance-sheet':    'balance-sheet',
  'pl':               'income-statement',
  'income-statement': 'income-statement',
  'cf':               'cash-flow',
  'cash-flow':        'cash-flow',
  'trial-balance':    'trial-balance',
  'equity':           'balance-sheet', // Equity is shown in the Balance Sheet (SoFP)
  'notes':            'notes',
  'related-parties':  'related-parties',
};

const FinancialStatements: React.FC = () => {
  usePageTitle('Financial Statements');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [searchParams] = useSearchParams();

  // Resolve initial tab from ?tab= query param (sidebar deep-link support)
  const initialTab = (() => {
    const p = searchParams.get('tab');
    return (p && TAB_PARAM_MAP[p]) || 'balance-sheet';
  })();

  const [activeTab, setActiveTab] = useState<
    | 'balance-sheet'
    | 'income-statement'
    | 'cash-flow'
    | 'trial-balance'
    | 'notes'
    | 'related-parties'
  >(initialTab);
  const [startDate, setStartDate] = useState(yearStart);
  const [endDate, setEndDate] = useState(todayStr);
  const [exporting, setExporting] = useState(false);
  const [comparePrior, setComparePrior] = useState(false);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setExporting(true);
    try {
      const q = new URLSearchParams({
        report: activeTab,
        startDate,
        endDate,
        format,
      });
      if (selectedCompanyId) q.set('companyId', selectedCompanyId);
      const res = await api.get(`/ovds/reports/export?${q}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(
        blob,
        `financial-statements-${activeTab}-${endDate}.${format}`,
      );
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const TABS = [
    { key: 'balance-sheet', label: 'Balance Sheet' },
    { key: 'income-statement', label: 'Income Statement' },
    { key: 'cash-flow', label: 'Cash Flows' },
    { key: 'trial-balance', label: 'Trial Balance' },
    { key: 'notes', label: 'Notes' },
    { key: 'related-parties', label: 'IAS 24 · Related Parties' },
  ] as const;

  type TabKey = (typeof TABS)[number]['key'];

  return (
    <AppPage
      title="Financial Statements"
      subtitle="IAS 1 · IFRS 18 · All five primary statements · Ethiopian AABE standard · Accounting & ovds Software · Banking & ovds · Healthcare & Pharmaceuticals · Revenue · Market Value · Strategic Insights"
      icon={<Icon name="CHART" size={18} />}
      crumbs={[{ label: 'Reports' }, { label: 'Financial Statements' }]}
      banners={
        <Link to="/reports/mor-report"
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl
                     bg-[var(--pro-azure-50)] dark:bg-green-900/20 border border-[var(--pro-azure-100)] dark:border-green-700
                     hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/30 transition-colors">
          <div className="flex items-center gap-2 text-sm text-[var(--pro-azure-dark)] dark:text-green-300">
            <Icon name="FILE_TEXT" size={14} />
            <span className="font-semibold">MoR IFRS Report</span>
            <span className="text-xs font-normal opacity-75">
              — Bilingual (Amharic/English) · Schedule A CIT/MAT · HR Payroll · Compliance · etax.mor.gov.et
            </span>
          </div>
          <Icon name="ARROW_RIGHT" size={13} className="text-[var(--pro-azure)] flex-shrink-0" />
        </Link>
      }
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Compare toggle */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={comparePrior}
              onChange={(e) => setComparePrior(e.target.checked)}
              className="rounded accent-indigo-500"
            />
            Prior year
          </label>

          {/* Date range */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Icon name="CALENDAR" size={12} className="text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none"
            />
            <span className="text-slate-300 text-xs">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Export */}
          {can('reports:read') && (
            <>
              <Btn
                variant="secondary"
                size="sm"
                icon={<Icon name="DOWNLOAD" size={11} />}
                onClick={() => handleExport('pdf')}
                loading={exporting}
              >
                PDF
              </Btn>
              <Btn
                variant="secondary"
                size="sm"
                icon={<Icon name="DOWNLOAD" size={11} />}
                onClick={() => handleExport('xlsx')}
                loading={exporting}
              >
                XLSX
              </Btn>
            </>
          )}
        </div>
      }
      tabs={
        <AppTabs
          tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
          active={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
        />
      }
    >
      {activeTab === 'balance-sheet' && (
        <BalanceSheetTab
          startDate={startDate}
          endDate={endDate}
          companyId={selectedCompanyId ?? undefined}
          comparePrior={comparePrior}
        />
      )}
      {activeTab === 'income-statement' && (
        <IncomeStatementTab
          startDate={startDate}
          endDate={endDate}
          companyId={selectedCompanyId ?? undefined}
          comparePrior={comparePrior}
        />
      )}
      {activeTab === 'cash-flow' && (
        <CashFlowTab
          startDate={startDate}
          endDate={endDate}
          companyId={selectedCompanyId ?? undefined}
        />
      )}
      {activeTab === 'trial-balance' && (
        <TrialBalanceTab
          endDate={endDate}
          companyId={selectedCompanyId ?? undefined}
        />
      )}
      {activeTab === 'notes' && <NotesTab />}
      {activeTab === 'related-parties' && (
        <RelatedPartiesTab
          startDate={startDate}
          endDate={endDate}
          companyId={selectedCompanyId ?? undefined}
        />
      )}
    </AppPage>
  );
};

export default FinancialStatements;
