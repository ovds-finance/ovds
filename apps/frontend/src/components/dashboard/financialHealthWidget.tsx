import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, AlertCircle, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { fmtCurrency } from '../../utils/fmt';
import { useAnimatedValue } from '../../hooks';
import IASBUpdateBanner from '../iasbUpdateBanner';

interface FinancialHealthWidgetProps {
  currency: string;
}

/** Animated SVG ring that fills on mount */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 64 }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  const color = score >= 70 ? '#00E784' : score >= 40 ? '#f59e0b' : '#ef4444';
  const gradeLabel = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const dash = (animated / 100) * circ;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="4"
          className="text-slate-100 dark:text-slate-800" stroke="currentColor" />
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="4"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold leading-none" style={{ color }}>{gradeLabel}</span>
        <span className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">{score}</span>
      </div>
    </div>
  );
};

/** Animated progress bar — respects prefers-reduced-motion */
const AnimBar: React.FC<{ pct: number; color: string; delay?: number }> = ({ pct, color, delay = 0 }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    if (prefersReduced) {
      el.style.width = `${Math.min(pct, 100)}%`;
      return;
    }
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 0.9s cubic-bezier(0.16,1,0.3,1)';
      el.style.width = `${Math.min(pct, 100)}%`;
    }, 120 + delay);
    return () => clearTimeout(t);
  }, [pct, delay, prefersReduced]);
  return (
    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div ref={barRef} className={`h-full rounded-full ${color}`} style={{ width: 0 }} />
    </div>
  );
};

const FinancialHealthWidget: React.FC<FinancialHealthWidgetProps> = ({ currency }) => {
  const [summary, setSummary] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ovds/reports/financial-summary', { headers: { 'x-background': '1' } } as any),
      api.get('/ovds/reports/health-score', { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
    ])
      .then(([sRes, hRes]) => {
        setSummary(sRes.data.data || sRes.data);
        if (hRes.data) setHealthScore(hRes.data.data || hRes.data);
      })
      .catch(() => {
        // silently handled — widget shows stale/empty state
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => fmtCurrency(n, currency);
  const overallScore = useAnimatedValue(healthScore?.overall ?? 0, { duration: 900 });

  const kpis = [
    {
      label: 'Cash & Bank',
      value: loading ? null : fmt(summary?.cash ?? 0),
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      alert: false,
    },
    {
      label: 'Receivables (AR)',
      value: loading ? null : fmt(summary?.ar ?? 0),
      color: 'text-emerald-600 dark:text-emerald-400 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      alert: (summary?.overdueInvoices ?? 0) > 0,
    },
    {
      label: 'Payables (AP)',
      value: loading ? null : fmt(summary?.ap ?? 0),
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      alert: (summary?.pendingBills ?? 0) > 0,
    },
    {
      label: 'Net Position',
      value: loading ? null : fmt(summary?.netPosition ?? 0),
      color: (summary?.netPosition ?? 0) >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-700 dark:text-rose-400',
      bg: 'bg-white dark:bg-slate-800/60',
      alert: false,
    },
  ];

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden transition-colors">
      {/* ovds-style income/expense split bar */}
      {summary && !loading && (
        <div className="flex h-1.5">
          <div
            className="bg-emerald-500 transition-all duration-700"
            style={{ width: `${(summary.revenue ?? 0) + (summary.expenses ?? 0) > 0 ? Math.round(((summary.revenue ?? 0) / ((summary.revenue ?? 0) + (summary.expenses ?? 0))) * 100) : 50}%` }}
          />
          <div className="bg-rose-400 flex-1" />
        </div>
      )}
      <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center">
            <Banknote size={14} className="text-emerald-600 dark:text-emerald-400 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">Financial Health</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Live balance sheet snapshot</p>
          </div>
        </div>
        <Link to="/accounting" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
          Accounting <ArrowRight size={11} />
        </Link>
      </div>

      {/* KPI grid */}
      <div className="ovds-grid-layout cols-4 mb-5">
        {kpis.map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-3.5 border border-current/8 relative`}>
            {k.alert && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">{k.label}</p>
            {loading ? (
              <div className="h-4 w-16 ovds-shimmer rounded mt-2" />
            ) : (
              <p className={`text-sm font-semibold mt-1.5 tabular-nums ${k.color}`}>{k.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* This month P&L */}
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
        <div className="flex-1 ovds-grid-layout cols-3">
          {[
            { label: 'Revenue', value: fmt(summary?.revenue ?? 0), color: 'text-emerald-700 dark:text-emerald-400' },
            { label: 'Expenses', value: fmt(summary?.expenses ?? 0), color: 'text-rose-700 dark:text-rose-400' },
            { label: 'Net Profit', value: fmt(summary?.netProfit ?? 0), color: (summary?.netProfit ?? 0) >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-700 dark:text-rose-400' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.label}</p>
              {loading ? (
                <div className="h-4 w-14 ovds-shimmer rounded mt-1" />
              ) : (
                <p className={`text-sm font-semibold mt-0.5 tabular-nums ${item.color}`}>{item.value}</p>
              )}
            </div>
          ))}
        </div>
        {(summary?.overdueInvoices ?? 0) > 0 && (
          <Link to="/sales/invoices"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-950 transition-all shrink-0">
            <AlertCircle size={11} /> {summary.overdueInvoices} overdue
          </Link>
        )}
      </div>

      {/* IFRS Financial Ratios — IAS 1 liquidity & solvency */}
      {summary && !loading && (
        <div className="mb-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">IFRS Key Ratios</p>
            <span className="text-[8px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">IAS 1</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const currentAssets = (summary.cash ?? 0) + (summary.ar ?? 0);
              const currentLiabilities = summary.ap ?? 1;
              const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
              const quickRatio = currentLiabilities > 0 ? (summary.cash ?? 0) / currentLiabilities : 0;
              const totalAssets = currentAssets + (summary.netPosition ?? 0);
              const totalDebt = currentLiabilities;
              const equity = totalAssets - totalDebt;
              const debtToEquity = equity > 0 ? totalDebt / equity : 0;
              const profitMargin = (summary.revenue ?? 0) > 0 ? ((summary.netProfit ?? 0) / summary.revenue) * 100 : 0;

              return [
                {
                  label: 'Current Ratio',
                  value: currentRatio.toFixed(2),
                  sub: 'IAS 1.60 · ≥1.5 healthy',
                  status: currentRatio >= 1.5 ? 'good' : currentRatio >= 1.0 ? 'warn' : 'bad',
                  tooltip: 'Current Assets ÷ Current Liabilities',
                },
                {
                  label: 'Quick Ratio',
                  value: quickRatio.toFixed(2),
                  sub: 'IAS 7 · ≥1.0 healthy',
                  status: quickRatio >= 1.0 ? 'good' : quickRatio >= 0.5 ? 'warn' : 'bad',
                  tooltip: 'Cash ÷ Current Liabilities',
                },
                {
                  label: 'Debt / Equity',
                  value: debtToEquity.toFixed(2),
                  sub: 'IAS 1 · ≤2.0 healthy',
                  status: debtToEquity <= 1.0 ? 'good' : debtToEquity <= 2.0 ? 'warn' : 'bad',
                  tooltip: 'Total Debt ÷ Equity',
                },
                {
                  label: 'Profit Margin',
                  value: `${profitMargin.toFixed(1)}%`,
                  sub: 'IFRS 15 · ≥10% healthy',
                  status: profitMargin >= 10 ? 'good' : profitMargin >= 0 ? 'warn' : 'bad',
                  tooltip: 'Net Profit ÷ Revenue × 100',
                },
              ].map(r => (
                <div key={r.label} title={r.tooltip}
                  className={`rounded-xl p-2.5 border cursor-help ${
                    r.status === 'good' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                    : r.status === 'warn' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                  }`}>
                  <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider leading-none">{r.label}</p>
                  <p className={`text-base font-semibold tabular-nums mt-1 ${
                    r.status === 'good' ? 'text-emerald-700 dark:text-emerald-400'
                    : r.status === 'warn' ? 'text-amber-700 dark:text-amber-400'
                    : 'text-rose-700 dark:text-rose-400'
                  }`}>{r.value}</p>
                  <p className="text-[8px] text-slate-400 mt-0.5 leading-tight">{r.sub}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Health score */}
      {healthScore && healthScore.components && Array.isArray(healthScore.components) && (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
          <ScoreRing score={healthScore.overall ?? 0} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Health Score
              </p>
              <span className="text-[10px] font-semibold text-slate-400 tabular-nums">{overallScore}/100</span>
            </div>
            <div className="space-y-2">
              {healthScore.components.map((c: any, i: number) => (
                <div key={c.label || i} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{c.label || 'Component'}</span>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">{c.score ?? 0}%</span>
                  </div>
                  <AnimBar
                    pct={c.score ?? 0}
                    color={(c.score ?? 0) >= 70 ? 'bg-emerald-500' : (c.score ?? 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500'}
                    delay={i * 80}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Chart of Accounts', to: '/accounting', icon: <BarChart3 size={11} />, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400' },
          { label: 'Journal Entries', to: '/accounting', icon: <TrendingUp size={11} />, color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400' },
          { label: 'AR Aging', to: '/accounting', icon: <AlertCircle size={11} />, color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
          { label: 'Balance Sheet', to: '/accounting', icon: <Banknote size={11} />, color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
        ].map(item => (
          <Link key={item.label} to={item.to}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold hover:opacity-80 transition-all ${item.color}`}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      {/* Accounting Dashboard link */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link to="/accounting"
          className="flex items-center justify-between px-3 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 dark:bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-100 dark:bg-emerald-900/30 transition-all group">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 dark:text-emerald-400">Open Accounting Dashboard</span>
          <ArrowRight size={12} className="text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* IASB strip — high-impact updates relevant to financial health, gated on ovds:read */}
      {summary && (
        <div className="mt-3">
          <IASBUpdateBanner variant="strip" filterByImpact="high" />
        </div>
      )}
      </div>
    </div>
  );
};

export default FinancialHealthWidget;








