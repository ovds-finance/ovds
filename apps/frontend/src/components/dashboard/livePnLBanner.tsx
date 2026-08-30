/**
 * LivePnLBanner — compact real-time P&L strip.
 * Shows Revenue, Expenses, Net Profit, and VAT payable in a single row.
 * Designed to sit at the top of the Accounting Dashboard.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, RefreshCw, Activity, Globe,
} from 'lucide-react';
import api from '../../services/api';
import { fmtCompact } from '../../utils/fmt';

interface PnLData {
  revenue: number;
  expenses: number;
  netProfit: number;
  cash: number;
  ar: number;
  ap: number;
  overdueInvoices: number;
}

interface LivePnLBannerProps {
  currency?: string;
}

const LivePnLBanner: React.FC<LivePnLBannerProps> = ({ currency = 'ETB' }) => {
  const [data, setData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fmt = useCallback((n: number) => fmtCompact(n, currency), [currency]);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await api.get('/ovds/reports/financial-summary', { headers: { 'x-background': '1' } } as any);
      const d = res.data?.data ?? res.data;
      setData(d);
      setLastUpdated(new Date());
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const netProfit = data?.netProfit ?? 0;
  const isProfit = netProfit >= 0;

  const kpis = [
    {
      label: 'Revenue',
      value: fmt(data?.revenue ?? 0),
      icon: <ArrowDownRight size={13} />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      to: '/sales/invoices',
    },
    {
      label: 'Expenses',
      value: fmt(data?.expenses ?? 0),
      icon: <ArrowUpRight size={13} />,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      to: '/purchases/bills',
    },
    {
      label: 'Net Profit',
      value: fmt(netProfit),
      icon: isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />,
      color: isProfit ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400',
      bg: isProfit ? 'bg-white dark:bg-slate-800/50' : 'bg-rose-50 dark:bg-rose-950/20',
      to: '/accounting',
    },
    {
      label: 'Cash & Bank',
      value: fmt(data?.cash ?? 0),
      icon: <Wallet size={13} />,
      color: 'text-emerald-600 dark:text-emerald-400 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      to: '/banking/accounts',
    },
    {
      label: 'Receivables',
      value: fmt(data?.ar ?? 0),
      icon: <Activity size={13} />,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      to: '/sales/invoices',
      alert: (data?.overdueInvoices ?? 0) > 0,
    },
    {
      label: 'Payables',
      value: fmt(data?.ap ?? 0),
      icon: <Globe size={13} />,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      to: '/purchases/bills',
    },
  ];

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* Income / expense split progress bar */}
      {data && !loading && (
        <div className="flex h-1">
          <div
            className="bg-emerald-500 transition-all duration-700"
            style={{ width: `${(data.revenue + data.expenses) > 0 ? Math.round((data.revenue / (data.revenue + data.expenses)) * 100) : 50}%` }}
          />
          <div className="bg-rose-400 flex-1" />
        </div>
      )}
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Live P&amp;L · {new Date().toLocaleString('en-ET', { month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="ovds-caption">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => load(true)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={11} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI strip — horizontal scroll on small screens */}
      <div className="overflow-x-auto">
        <div className="flex items-stretch min-w-max divide-x divide-slate-100 dark:divide-slate-800">
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              to={kpi.to}
              className="relative flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group min-w-[120px]"
            >
              {kpi.alert && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              )}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <div>
                <p className="ovds-label leading-none">{kpi.label}</p>
                {loading ? (
                  <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
                ) : (
                  <p className={`text-[13px] font-semibold tabular-nums leading-tight mt-0.5 ${kpi.color}`}>
                    {kpi.value}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LivePnLBanner;







