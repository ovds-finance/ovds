import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  RefreshCw, BarChart3,
} from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useInterval } from '../hooks';
import api from '../services/api';
import { fmtCurrency } from '../utils/fmt';

interface PnLData {
  revenue: number;
  expenses: number;
  netProfit: number;
  grossMargin: number;
  prevRevenue?: number;
  prevExpenses?: number;
  prevNetProfit?: number;
  period?: string;
}

interface LivePnLWidgetProps {
  currency?: string;
  refreshInterval?: number; // ms, default 60s
  compact?: boolean;
}

function pct(curr: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((curr - prev) / Math.abs(prev)) * 100);
}

const Trend: React.FC<{ value: number | null; suffix?: string }> = ({ value, suffix = '%' }) => {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>
      {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(value)}{suffix}
    </span>
  );
};

const LivePnLWidget: React.FC<LivePnLWidgetProps> = ({
  currency = 'ETB',
  refreshInterval = 60_000,
  compact = false,
}) => {
  const [data, setData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);
  const prevDataRef = useRef<PnLData | null>(null);

  const fetch = useCallback(async () => {
    try {
      const [summaryRes, prevRes] = await Promise.all([
        api.get('/ovds/reports/financial-summary').catch(() => ({ data: { data: null } })),
        api.get('/ovds/reports/financial-summary?period=prev').catch(() => ({ data: { data: null } })),
      ]);
      const curr = summaryRes.data?.data || summaryRes.data;
      const prev = prevRes.data?.data || prevRes.data;
      if (curr) {
        const next: PnLData = {
          revenue: curr.revenue ?? 0,
          expenses: curr.expenses ?? 0,
          netProfit: curr.netProfit ?? (curr.revenue ?? 0) - (curr.expenses ?? 0),
          grossMargin: curr.revenue > 0 ? Math.round(((curr.revenue - curr.expenses) / curr.revenue) * 100) : 0,
          prevRevenue: prev?.revenue,
          prevExpenses: prev?.expenses,
          prevNetProfit: prev?.netProfit,
          period: curr.period,
        };
        if (prevDataRef.current && (
          prevDataRef.current.revenue !== next.revenue ||
          prevDataRef.current.netProfit !== next.netProfit
        )) {
          setPulse(true);
          setTimeout(() => setPulse(false), 800);
        }
        prevDataRef.current = next;
        setData(next);
        setLastUpdated(new Date());
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useInterval(fetch, refreshInterval);

  const fmt = (n: number) => fmtCurrency(n, currency);

  if (compact) {
    return (
      <div className={`flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all ${pulse ? 'ring-2 ring-[var(--pro-azure)]/40' : ''}`}>
        {loading ? (
          <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="h-4 w-20 ovds-shimmer rounded" />)}
          </div>
        ) : data ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Revenue</span>
              <span className="text-sm font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">{fmt(data.revenue)}</span>
              <Trend value={pct(data.revenue, data.prevRevenue ?? 0)} />
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Expenses</span>
              <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">{fmt(data.expenses)}</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Net</span>
              <span className={`text-sm font-semibold ${data.netProfit >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600'}`}>{fmt(data.netProfit)}</span>
              <Trend value={pct(data.netProfit, data.prevNetProfit ?? 0)} />
            </div>
            <div className="ml-auto flex items-center gap-1 text-[9px] text-slate-300 dark:text-slate-600">
              <span className="w-1.5 h-1.5 bg-[var(--pro-azure-light)] rounded-full animate-pulse" />
              Live
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`ovds-widget-card shadow-sm overflow-hidden transition-all ${pulse ? 'ring-2 ring-[var(--pro-azure)]/30' : ''}`}>
      {/* ovds-style income/expense split bar */}
      {data && !loading && (
        <div className="flex h-1.5">
          <div
            className="bg-[var(--pro-azure-50)]0 transition-all duration-700"
            style={{ width: `${data.revenue + data.expenses > 0 ? Math.round((data.revenue / (data.revenue + data.expenses)) * 100) : 50}%` }}
          />
          <div className="bg-rose-400 flex-1" />
        </div>
      )}
      <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--pro-azure-100)] dark:bg-green-950/50 rounded-xl flex items-center justify-center">
            <BarChart3 size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">P&L Summary</h3>
            <p className="ovds-caption mt-0.5">
              {data?.period ?? 'Current month'} · auto-refreshes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-[var(--pro-azure-100)] dark:border-green-800">
            <span className="w-1.5 h-1.5 bg-[var(--pro-azure-light)] rounded-full animate-pulse" />
            Live
          </span>
          <button onClick={fetch} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-10 ovds-shimmer rounded-xl" />)}
        </div>
      ) : data ? (
        <div className="space-y-2">
          {[
            {
              label: 'Revenue',
              value: data.revenue,
              prev: data.prevRevenue,
              color: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
              bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
              icon: <TrendingUp size={13} className="text-[var(--pro-azure)]" />,
            },
            {
              label: 'Expenses',
              value: data.expenses,
              prev: data.prevExpenses,
              color: 'text-rose-700 dark:text-rose-400',
              bg: 'bg-rose-50 dark:bg-rose-950/30',
              icon: <TrendingDown size={13} className="text-rose-600" />,
            },
            {
              label: 'Net Profit',
              value: data.netProfit,
              prev: data.prevNetProfit,
              color: data.netProfit >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-600',
              bg: data.netProfit >= 0 ? 'bg-white dark:bg-slate-800/60' : 'bg-rose-50 dark:bg-rose-950/30',
              icon: data.netProfit >= 0 ? <TrendingUp size={13} className="text-slate-500" /> : <TrendingDown size={13} className="text-rose-500" />,
            },
          ].map(row => (
            <div key={row.label} className={`${row.bg} rounded-xl px-3 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                {row.icon}
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{row.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold tabular-nums ${row.color}`}>{fmt(row.value)}</span>
                <Trend value={pct(row.value, row.prev ?? 0)} />
              </div>
            </div>
          ))}

          {/* Gross margin bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gross Margin</span>
              <span className={`text-[10px] font-semibold ${data.grossMargin >= 20 ? 'text-[var(--pro-azure)]' : data.grossMargin >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                {data.grossMargin}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${data.grossMargin >= 20 ? 'bg-[var(--pro-azure-50)]0' : data.grossMargin >= 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, data.grossMargin))}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">No financial data available</div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="ovds-caption">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
        <Link to="/reports" className="text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline flex items-center gap-0.5">
          Full Report <ArrowUpRight size={9} />
        </Link>
      </div>
      </div>
    </div>
  );
};

export default LivePnLWidget;







