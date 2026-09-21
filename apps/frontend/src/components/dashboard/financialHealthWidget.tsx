import { Banknote, AlertCircle, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useAnimatedValue } from '../../hooks';
import api from '../../services/api';
import { fmtCurrency } from '../../utils/fmt';
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
      color: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
      bg: 'rgba(5,150,105,0.08)',
      alert: false,
    },
    {
      label: 'Receivables (AR)',
      value: loading ? null : fmt(summary?.ar ?? 0),
      color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
      bg: 'rgba(5,150,105,0.06)',
      alert: (summary?.overdueInvoices ?? 0) > 0,
    },
    {
      label: 'Payables (AP)',
      value: loading ? null : fmt(summary?.ap ?? 0),
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'rgba(225,29,72,0.07)',
      alert: (summary?.pendingBills ?? 0) > 0,
    },
    {
      label: 'Net Position',
      value: loading ? null : fmt(summary?.netPosition ?? 0),
      color: (summary?.netPosition ?? 0) >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-700 dark:text-rose-400',
      bg: 'var(--surface-alt)',
      alert: false,
    },
  ];

  return (
    <div
      className="ovds-widget-card overflow-hidden transition-shadow"
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      {/* Revenue/expense split bar */}
      {summary && !loading && (
        <div className="flex" style={{ height: 3 }}>
          <div
            style={{
              background: 'var(--pro-indigo)',
              transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
              width: `${(summary.revenue ?? 0) + (summary.expenses ?? 0) > 0
                ? Math.round(((summary.revenue ?? 0) / ((summary.revenue ?? 0) + (summary.expenses ?? 0))) * 100)
                : 50}%`,
            }}
          />
          <div style={{ flex: 1, background: 'var(--pro-rose)', opacity: 0.7 }} />
        </div>
      )}
      <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--pro-indigo-dim, rgba(5,150,105,0.12))', color: 'var(--pro-indigo)' }}
          >
            <Banknote size={14} />
          </div>
          <div>
            <h3
              className="text-[13px] font-bold leading-none"
              style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}
            >
              Financial Health
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>
              Live balance sheet snapshot
            </p>
          </div>
        </div>
        <Link
          to="/accounting"
          className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--pro-indigo)' }}
        >
          Accounting <ArrowRight size={11} />
        </Link>
      </div>

      {/* KPI grid */}
      <div className="ovds-grid-layout cols-4 mb-4">
        {kpis.map(k => (
          <div
            key={k.label}
            className="rounded-xl p-3.5 relative"
            style={{
              background: k.bg,
              border: '1px solid var(--border)',
            }}
          >
            {k.alert && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full animate-aki-pulse"
                style={{ background: 'var(--pro-amber)' }}
              />
            )}
            <p
              className="text-[10px] font-semibold uppercase tracking-wider leading-none"
              style={{ color: 'var(--text-4)' }}
            >
              {k.label}
            </p>
            {loading
              ? <div className="h-4 w-16 aki-skeleton rounded mt-2" />
              : <p className={`text-sm font-semibold mt-1.5 tabular-nums ${k.color}`}>{k.value}</p>
            }
          </div>
        ))}
      </div>

      {/* This month P&L */}
      <div
        className="flex items-center gap-4 p-4 rounded-xl mb-4"
        style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}
      >
        <div className="flex-1 ovds-grid-layout cols-3">
          {[
            { label: 'Revenue',    value: fmt(summary?.revenue   ?? 0), color: 'var(--pro-indigo)' },
            { label: 'Expenses',   value: fmt(summary?.expenses  ?? 0), color: 'var(--pro-rose)' },
            { label: 'Net Profit', value: fmt(summary?.netProfit ?? 0), color: (summary?.netProfit ?? 0) >= 0 ? 'var(--text)' : 'var(--pro-rose)' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
                {item.label}
              </p>
              {loading
                ? <div className="h-4 w-14 aki-skeleton rounded mt-1" />
                : <p className="text-sm font-semibold mt-0.5 tabular-nums" style={{ color: item.color }}>{item.value}</p>
              }
            </div>
          ))}
        </div>
        {(summary?.overdueInvoices ?? 0) > 0 && (
          <Link
            to="/sales/invoices"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0"
            style={{ background: 'var(--sys-state-alert)', color: 'var(--sys-state-alert-text)' }}
          >
            <AlertCircle size={11} /> {summary.overdueInvoices} overdue
          </Link>
        )}
      </div>

      {/* IFRS Financial Ratios */}
      {summary && !loading && (
        <div
          className="mb-4 p-4 rounded-xl"
          style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>
              IFRS Key Ratios
            </p>
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--pro-indigo-dim, rgba(5,150,105,0.12))', color: 'var(--pro-indigo)' }}
            >
              IAS 1
            </span>
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
                { label: 'Current Ratio', value: currentRatio.toFixed(2), sub: 'IAS 1.60 · ≥1.5', status: currentRatio >= 1.5 ? 'good' : currentRatio >= 1.0 ? 'warn' : 'bad', tooltip: 'Current Assets ÷ Current Liabilities' },
                { label: 'Quick Ratio',   value: quickRatio.toFixed(2),   sub: 'IAS 7 · ≥1.0',    status: quickRatio   >= 1.0 ? 'good' : quickRatio   >= 0.5 ? 'warn' : 'bad', tooltip: 'Cash ÷ Current Liabilities' },
                { label: 'Debt / Equity', value: debtToEquity.toFixed(2), sub: 'IAS 1 · ≤2.0',    status: debtToEquity <= 1.0 ? 'good' : debtToEquity <= 2.0 ? 'warn' : 'bad', tooltip: 'Total Debt ÷ Equity' },
                { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, sub: 'IFRS 15 · ≥10%', status: profitMargin >= 10 ? 'good' : profitMargin >= 0 ? 'warn' : 'bad', tooltip: 'Net Profit ÷ Revenue × 100' },
              ].map(r => {
                const ratioStyle = r.status === 'good'
                  ? { bg: 'var(--sys-state-success)', color: 'var(--sys-state-success-text)', border: 'var(--sys-state-success-border, #A7F3D0)' }
                  : r.status === 'warn'
                  ? { bg: 'var(--sys-state-alert)',   color: 'var(--sys-state-alert-text)',   border: 'var(--sys-state-alert-border, #FDE68A)' }
                  : { bg: 'var(--sys-state-critical)', color: 'var(--sys-state-critical-text)', border: 'var(--sys-state-critical-border, #FECDD3)' };
                return (
                  <div
                    key={r.label}
                    title={r.tooltip}
                    className="rounded-xl p-2.5 cursor-help"
                    style={{ background: ratioStyle.bg, border: `1px solid ${ratioStyle.border}` }}
                  >
                    <p className="text-[8px] font-bold uppercase tracking-wider leading-none" style={{ color: 'var(--text-4)' }}>{r.label}</p>
                    <p className="text-base font-bold tabular-nums mt-1" style={{ color: ratioStyle.color }}>{r.value}</p>
                    <p className="text-[8px] mt-0.5 leading-tight" style={{ color: 'var(--text-4)' }}>{r.sub}</p>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Health score ring */}
      {healthScore && healthScore.components && Array.isArray(healthScore.components) && (
        <div
          className="flex items-center gap-4 p-4 rounded-xl mb-4"
          style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}
        >
          <ScoreRing score={healthScore.overall ?? 0} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Health Score</p>
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'var(--text-4)' }}>
                {overallScore}/100
              </span>
            </div>
            <div className="space-y-2">
              {healthScore.components.map((c: any, i: number) => (
                <div key={c.label || i} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{c.label || 'Component'}</span>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-2)' }}>{c.score ?? 0}%</span>
                  </div>
                  <AnimBar
                    pct={c.score ?? 0}
                    color={(c.score ?? 0) >= 70 ? 'bg-pro-indigo' : (c.score ?? 0) >= 40 ? 'bg-pro-amber' : 'bg-pro-rose'}
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
          { label: 'Chart of Accounts', to: '/accounting',      icon: <BarChart3 size={11} />,  bg: 'rgba(5,150,105,0.10)',  color: 'var(--pro-indigo)' },
          { label: 'Journal Entries',   to: '/accounting',      icon: <TrendingUp size={11} />, bg: 'rgba(124,58,237,0.10)', color: 'var(--pro-violet)' },
          { label: 'AR Aging',          to: '/accounting',      icon: <AlertCircle size={11} />,bg: 'rgba(217,119,6,0.10)',  color: 'var(--pro-amber)' },
          { label: 'Balance Sheet',     to: '/accounting',      icon: <Banknote size={11} />,   bg: 'rgba(0,102,255,0.10)',  color: 'var(--pro-azure)' },
        ].map(item => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-opacity hover:opacity-70"
            style={{ background: item.bg, color: item.color }}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      {/* Accounting dashboard link */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <Link
          to="/accounting"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors group"
          style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(5,150,105,0.10)')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(5,150,105,0.06)')}
        >
          <span className="text-xs font-bold" style={{ color: 'var(--pro-indigo)' }}>
            Open Accounting Dashboard
          </span>
          <ArrowRight size={12} style={{ color: 'var(--pro-indigo)' }} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

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








