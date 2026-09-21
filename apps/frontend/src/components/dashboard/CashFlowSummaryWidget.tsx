/**
 * CashFlowSummaryWidget
 * Compact Ovds-style Cash Flow + Profit card.
 * Shows: Incoming / Outgoing / Profit in a single card with "View Report" links.
 * Also renders an Expenses By Category breakdown below.
 */
import { fmtCompact } from '@ovds/ui';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, ExternalLink, PieChart } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import api from '../../services/api';



interface Props {
  currency?: string;
}

const EXPENSE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#0891b2'];

const AnimBar: React.FC<{ pct: number; color: string; delay?: number }> = ({ pct, color, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 0.8s cubic-bezier(0.16,1,0.3,1)';
      el.style.width = `${Math.min(100, pct)}%`;
    }, 120 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div ref={ref} className="h-full rounded-full" style={{ background: color, width: 0 }} />
    </div>
  );
};

const CashFlowSummaryWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [categories, setCategories] = useState<{ label: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
    Promise.all([
      api.get(`/ovds/reports/cash-flow${params}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
      api.get(`/dashboard/reports${params}`, { headers: { 'x-background': '1' } } as any).catch(() => ({ data: null })),
    ]).then(([cfRes, rptRes]) => {
      setCashFlow(cfRes.data?.data ?? cfRes.data);
      const cats = rptRes.data?.expenseBreakdown ?? rptRes.data?.categoryBreakdown ?? [];
      setCategories(Array.isArray(cats) ? cats : []);
    }).finally(() => setLoading(false));
  }, [selectedCompanyId]);

  const incoming = cashFlow?.incoming ?? cashFlow?.totalIncome ?? cashFlow?.operating?.net ?? 0;
  const outgoing = cashFlow?.outgoing ?? cashFlow?.totalExpenses ?? Math.abs(cashFlow?.operating?.expenses ?? 0);
  const profit   = cashFlow?.profit ?? cashFlow?.netProfit ?? (incoming - outgoing);
  const catTotal = categories.reduce((s, c) => s + c.amount, 0);

  const shimmer = (w: string) => (
    <div className={`h-5 ${w} bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer`} />
  );

  return (
    <div className="space-y-4">

      {/* ── Cash Flow card ── */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="h-[3px] bg-sky-500 rounded-t-[inherit]" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center shrink-0">
                <ArrowDownLeft size={14} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">Cash Flow</h3>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Cash coming in and going out</p>
              </div>
            </div>
            <Link
              to="/reports?type=cf"
              className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline shrink-0"
            >
              View Report <ExternalLink size={9} />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Incoming */}
            <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-xl p-3 border border-[var(--pro-azure-100)] dark:border-green-900">
              <div className="flex items-center gap-1 mb-1">
                <ArrowDownLeft size={10} className="text-[var(--pro-azure)]" />
                <p className="text-[9px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold uppercase tracking-wider">Incoming</p>
              </div>
              {loading ? shimmer('w-20') : (
                <p className="text-[15px] font-extrabold text-[var(--pro-azure-dark)] dark:text-green-300 tabular-nums leading-none">
                  {fmtCompact(incoming, currency)}
                </p>
              )}
            </div>

            {/* Outgoing */}
            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3 border border-rose-100 dark:border-rose-900">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUpRight size={10} className="text-rose-500" />
                <p className="text-[9px] text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">Outgoing</p>
              </div>
              {loading ? shimmer('w-20') : (
                <p className="text-[15px] font-extrabold text-rose-700 dark:text-rose-300 tabular-nums leading-none">
                  {fmtCompact(outgoing, currency)}
                </p>
              )}
            </div>

            {/* Profit */}
            <div className={`rounded-xl p-3 border ${profit >= 0 ? 'bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900'}`}>
              <div className="flex items-center gap-1 mb-1">
                {profit >= 0
                  ? <TrendingUp size={10} className="text-sky-500" />
                  : <TrendingDown size={10} className="text-amber-500" />}
                <p className={`text-[9px] font-semibold uppercase tracking-wider ${profit >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}`}>Profit</p>
              </div>
              {loading ? shimmer('w-20') : (
                <p className={`text-[15px] font-extrabold tabular-nums leading-none ${profit >= 0 ? 'text-sky-700 dark:text-sky-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {fmtCompact(Math.abs(profit), currency)}
                </p>
              )}
            </div>
          </div>

          {/* P&L link */}
          <Link
            to="/reports?type=pl"
            className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors"
          >
            Profit &amp; Loss Report <ExternalLink size={9} />
          </Link>
        </div>
      </div>

      {/* ── Expenses By Category ── */}
      <div className="ovds-widget-card overflow-hidden">
        <div className="h-[3px] bg-violet-500 rounded-t-[inherit]" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
                <PieChart size={14} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">Expenses By Category</h3>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Top expenses across categories</p>
              </div>
            </div>
            <Link
              to="/reports?type=expense-summary"
              className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline shrink-0"
            >
              View Report <ExternalLink size={9} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
                    <div className="h-2.5 w-12 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-4 text-center">
              <PieChart size={24} className="mx-auto mb-1.5 text-slate-200 dark:text-slate-700" />
              <p className="text-[11px] text-slate-400">No expense data yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {categories.slice(0, 5).map((cat, i) => {
                const pct = catTotal > 0 ? Math.round((cat.amount / catTotal) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{cat.label}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[9px] text-slate-400">{pct}%</span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                          {fmtCompact(cat.amount, currency)}
                        </span>
                      </div>
                    </div>
                    <AnimBar pct={pct} color={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} delay={i * 60} />
                  </div>
                );
              })}
              {categories.length > 5 && (
                <Link to="/purchases/expenses" className="text-[10px] text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors">
                  +{categories.length - 5} more categories →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowSummaryWidget;
