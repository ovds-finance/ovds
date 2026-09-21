import { TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Banknote, Landmark } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import { fmtCurrency } from '../../utils/fmt';

interface CashFlowWidgetProps {
  currency: string;
  loading?: boolean;
}

/** Bar that animates height on mount */
const AnimBar: React.FC<{ pct: number; isHighlight: boolean; label: string; tooltip: string }> = ({
  pct, isHighlight, label, tooltip,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.height = '4px';
    const t = setTimeout(() => {
      el.style.transition = 'height 0.7s cubic-bezier(0.16,1,0.3,1)';
      el.style.height = `${Math.max(4, pct)}px`;
    }, 80);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex-1 flex flex-col items-center gap-1 group" title={tooltip}>
      <div className="w-full flex flex-col justify-end" style={{ height: 48 }}>
        <div
          ref={barRef}
          className={`w-full rounded-t-md ${isHighlight ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-200 dark:bg-slate-700'} group-hover:opacity-80 transition-opacity`}
          style={{ height: 4 }}
        />
      </div>
      <span className="text-[8px] text-slate-400 truncate w-full text-center">{label}</span>
    </div>
  );
};

const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({ currency }) => {
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/ovds/reports/cash-flow', { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
      api.get('/ovds/reports/revenue-trend', { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
      api.get('/ovds/payments/summary', { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
    ])
      .then(([cfRes, rtRes, psRes]) => {
        setCashFlow(cfRes.data?.data || cfRes.data);
        const raw = rtRes.data?.data || rtRes.data;
        if (Array.isArray(raw)) setRevenueTrend(raw.slice(-6));
        setPaymentSummary(psRes.data?.data || psRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => fmtCurrency(n, currency);
  // Backend returns { operating: { net }, investing: { net }, financing: { net } }
  // Normalise to numbers with fallback for flat number format
  const operating = typeof cashFlow?.operating === 'object'
    ? (cashFlow.operating?.net ?? 0)
    : (cashFlow?.operating ?? 0);
  const investing = typeof cashFlow?.investing === 'object'
    ? (cashFlow.investing?.net ?? 0)
    : (cashFlow?.investing ?? 0);
  const financing = typeof cashFlow?.financing === 'object'
    ? (cashFlow.financing?.net ?? 0)
    : (cashFlow?.financing ?? 0);
  const net = cashFlow?.netCashFlow ?? (operating + investing + financing);
  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue || 0), 1);

  const breakdown = [
    { label: 'Operating', value: operating, icon: <Activity size={12} />, color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30' },
    { label: 'Investing', value: investing, icon: <TrendingUp size={12} />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Financing', value: financing, icon: <Landmark size={12} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  ];

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden transition-colors">
      {/* ovds-style cash flow bar */}
      {cashFlow && !loading && (
        <div className="flex h-1.5">
          <div
            className={`transition-all duration-700 ${operating >= 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-rose-400'}`}
            style={{ width: `${Math.abs(operating) / (Math.abs(operating) + Math.abs(investing) + Math.abs(financing) + 1) * 100}%` }}
          />
          <div
            className={`transition-all duration-700 ${investing >= 0 ? 'bg-violet-400' : 'bg-amber-400'}`}
            style={{ width: `${Math.abs(investing) / (Math.abs(operating) + Math.abs(investing) + Math.abs(financing) + 1) * 100}%` }}
          />
          <div className={`flex-1 ${financing >= 0 ? 'bg-[var(--pro-azure-50)]0' : 'bg-slate-300 dark:bg-slate-600'}`} />
        </div>
      )}
      <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--pro-azure-100)] dark:bg-green-950/50 rounded-xl flex items-center justify-center">
            <Activity size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">Cash Flow</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Operating · Investing · Financing</p>
          </div>
        </div>
        <Link to="/ovds" className="flex items-center gap-1 text-xs font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
          ovds Hub <ArrowUpRight size={11} />
        </Link>
      </div>

      {/* Net cash flow banner */}
      <div className={`rounded-xl p-4 mb-4 flex items-center justify-between ${
        net >= 0 ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/25' : 'bg-rose-50 dark:bg-rose-950/25'
      }`}>
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Net Cash Flow</p>
          {loading ? (
            <div className="h-7 w-28 ovds-shimmer rounded mt-1" />
          ) : (
            <p className={`text-2xl font-semibold mt-0.5 tabular-nums ${
              net >= 0 ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-rose-700 dark:text-rose-400'
            }`}>
              {net >= 0 ? '+' : ''}{fmt(net)}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          net >= 0 ? 'bg-[var(--pro-azure-100)] dark:bg-green-900/50' : 'bg-rose-100 dark:bg-rose-900/50'
        }`}>
          {net >= 0
            ? <TrendingUp size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            : <TrendingDown size={18} className="text-rose-600 dark:text-rose-400" />
          }
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2 mb-5">
        {breakdown.map(row => (
          <div key={row.label} className={`${row.bg} rounded-xl px-3 py-2.5 flex items-center justify-between`}>
            <div className={`flex items-center gap-2 ${row.color}`}>
              {row.icon}
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{row.label}</span>
            </div>
            {loading ? (
              <div className="h-3.5 w-16 ovds-shimmer rounded" />
            ) : (
              <span className={`text-xs font-semibold tabular-nums ${
                row.value >= 0 ? row.color : 'text-rose-600 dark:text-rose-400'
              }`}>
                {row.value >= 0 ? '+' : ''}{fmt(row.value)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Revenue trend sparkline */}
      {revenueTrend.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Revenue Trend · 6 months
          </p>
          <div className="flex items-end gap-1">
            {revenueTrend.map((d, i) => {
              const pxH = Math.max(4, Math.round((d.revenue / maxRevenue) * 48));
              return (
                <AnimBar
                  key={i}
                  pct={pxH}
                  isHighlight={i === revenueTrend.length - 1}
                  label={d.month?.slice(0, 3) ?? ''}
                  tooltip={`${d.month}: ${fmt(d.revenue)}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Payment summary */}
      {!loading && paymentSummary && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mb-4">
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Payments · 6 months
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/30 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mb-0.5">
                <ArrowDownRight size={10} />
                <span className="text-[10px] font-medium uppercase tracking-wider">Received</span>
              </div>
              <p className="text-xs font-semibold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] tabular-nums">{fmt(paymentSummary.totalInflow ?? 0)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-0.5">
                <ArrowUpRight size={10} />
                <span className="text-[10px] font-medium uppercase tracking-wider">Paid Out</span>
              </div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 tabular-nums">{fmt(paymentSummary.totalOutflow ?? 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Invoices', to: '/sales/invoices', icon: <ArrowDownRight size={10} />, color: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' },
          { label: 'Bills', to: '/purchases/bills', icon: <ArrowUpRight size={10} />, color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
          { label: 'Payments', to: '/customers/payment-tracker', icon: <Banknote size={10} />, color: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' },
          { label: 'Categories', to: '/accounting/categories', icon: <Activity size={10} />, color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' },
        ].map(item => (
          <Link key={item.label} to={item.to}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold hover:opacity-80 transition-all ${item.color}`}>
            {item.icon} {item.label}
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
};

export default CashFlowWidget;







