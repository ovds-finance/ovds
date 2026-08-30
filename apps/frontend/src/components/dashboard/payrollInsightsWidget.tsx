import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote, TrendingUp, TrendingDown, PiggyBank,
  CreditCard, ArrowRight, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, Wallet,
} from 'lucide-react';
import api from '../../services/api';
import { fmtCompact } from '../../utils/fmt';
import { PIT_BRACKETS as SHARED_PIT } from '../../utils/ethiopianTax';

// Display PIT_BRACKETS with colour coding derived from shared constants
const PIT_BRACKETS = [
  { ...SHARED_PIT[0], range: '0 – 2,000',        rate: '0%',  color: 'text-emerald-600 dark:text-emerald-400' },
  { ...SHARED_PIT[1], range: '2,001 – 4,000',    rate: '15%', color: 'text-emerald-600 dark:text-emerald-400' },
  { ...SHARED_PIT[2], range: '4,001 – 7,000',    rate: '20%', color: 'text-teal-600 dark:text-teal-400' },
  { ...SHARED_PIT[3], range: '7,001 – 10,000',   rate: '25%', color: 'text-violet-600 dark:text-violet-400' },
  { ...SHARED_PIT[4], range: '10,001 – 14,000',  rate: '30%', color: 'text-amber-600 dark:text-amber-400' },
  { ...SHARED_PIT[5], range: '> 14,000',          rate: '35%', color: 'text-rose-600 dark:text-rose-400' },
];
// Pension cap: ETB 15,000 insurable earnings per Proclamation No. 1395/2025
const PENSION_CAP_ETB = 15_000;

interface PayrollInsightsWidgetProps {
  payrollCurrent: any;
  payrollPrev: any;
  currency: string;
  loading?: boolean;
  monthName?: string;
}

/** Animated bar */
const Bar: React.FC<{ pct: number; color: string; delay?: number }> = ({ pct, color, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 0.8s cubic-bezier(0.16,1,0.3,1)';
      el.style.width = `${Math.min(pct, 100)}%`;
    }, 100 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div ref={ref} className={`h-full rounded-full ${color}`} style={{ width: 0 }} />
    </div>
  );
};

// Ethiopian PIT brackets — Proclamation No. 1395/2025 (effective July 7, 2025)
// Tax-free threshold raised from ETB 600 → ETB 2,000; brackets reduced from 7 to 6

const PayrollInsightsWidget: React.FC<PayrollInsightsWidgetProps> = ({
  payrollCurrent, payrollPrev, currency, loading, monthName,
}) => {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [showPIT, setShowPIT] = useState(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    api.get(`/payroll/dashboard-stats`, { headers: { 'x-background': '1' } } as any).then((res: { data: { data?: { pending?: number }; pending?: number } }) => {
      const d = res.data?.data ?? res.data;
      setPendingApprovals(d?.pending ?? 0);
    }).catch(() => {});
  }, []);

  const fmt = (n: number) => fmtCompact(n, currency);
  const mom = (curr: number, prev: number) =>
    !prev ? 0 : Math.round(((curr - prev) / prev) * 100);

  const gross = payrollCurrent?.totalGross ?? 0;
  const net = payrollCurrent?.totalNet ?? 0;
  const tax = payrollCurrent?.totalTax ?? 0;
  const pension = payrollCurrent?.totalPension ?? 0;
  const loans = payrollCurrent?.totalLoans ?? 0;
  const count = payrollCurrent?.count ?? payrollCurrent?.totalEmployees ?? 0;

  const netPct = gross > 0 ? Math.round((net / gross) * 100) : 0;
  const taxPct = gross > 0 ? Math.round((tax / gross) * 100) : 0;
  const pensionPct = gross > 0 ? Math.round((pension / gross) * 100) : 0;
  const loanPct = gross > 0 ? Math.round((loans / gross) * 100) : 0;

  const netMom = mom(net, payrollPrev?.totalNet ?? 0);

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
            <Banknote size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Payroll Insights</p>
            <p className="ovds-caption">{monthName ?? 'Current period'} · PIT + Pension</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingApprovals > 0 && (
            <Link to="/hr/payroll" className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-medium rounded-full">
              <Clock size={9} /> {pendingApprovals} pending
            </Link>
          )}
          <Link to="/hr/payroll" className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Payroll <ChevronRight size={10} />
          </Link>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Net pay hero */}
        <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Net Pay</p>
            {loading ? (
              <div className="h-6 w-28 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{fmt(net)}</p>
            )}
          </div>
          {!loading && netMom !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${netMom > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netMom > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {netMom > 0 ? '+' : ''}{netMom}%
            </div>
          )}
        </div>

        {/* Breakdown bars */}
        <div className="space-y-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Gross Breakdown</p>
          {[
            { label: 'Net Pay', value: net, pct: netPct, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', icon: <Wallet size={11} /> },
            { label: 'Income Tax (PIT)', value: tax, pct: taxPct, color: 'bg-rose-400', textColor: 'text-rose-600 dark:text-rose-400', icon: <Banknote size={11} /> },
            { label: 'Pension (7%)', value: pension, pct: pensionPct, color: 'bg-amber-400', textColor: 'text-amber-600 dark:text-amber-400', icon: <PiggyBank size={11} /> },
            { label: 'Loan Deductions', value: loans, pct: loanPct, color: 'bg-violet-400', textColor: 'text-violet-600 dark:text-violet-400', icon: <CreditCard size={11} /> },
          ].map((item, i) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className={`flex items-center gap-1 text-[10px] font-bold ${item.textColor}`}>
                  {item.icon} {item.label}
                </span>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">{fmt(item.value)}</span>
                      <span className="ovds-caption">{item.pct}%</span>
                    </>
                  )}
                </div>
              </div>
              <Bar pct={item.pct} color={item.color} delay={i * 80} />
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl text-center">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Employees</p>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{loading ? '—' : count}</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl text-center">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Gross</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{loading ? '—' : fmt(gross)}</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800/50 rounded-xl text-center">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Employer Pension</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{loading ? '—' : fmt(gross * 0.11)}</p>
          </div>
        </div>

        {/* PIT brackets toggle */}
        <button
          onClick={() => setShowPIT(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300"
        >
          <span className="flex items-center gap-2">
            <Banknote size={13} className="text-slate-400" />
            Ethiopian PIT Brackets (2026)
          </span>
          <ChevronRight size={12} className={`text-slate-400 transition-transform ${showPIT ? 'rotate-90' : ''}`} />
        </button>

        {showPIT && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {PIT_BRACKETS.map(b => (
              <div key={b.range} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800/50 rounded-lg">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{b.range} ETB</span>
                <span className={`text-[10px] font-semibold ${b.color}`}>{b.rate}</span>
              </div>
            ))}
            <p className="text-[9px] text-slate-400 px-1">Pension: Employee 7% + Employer 11% · Cap: ETB {PENSION_CAP_ETB.toLocaleString()} insurable earnings (Proc. 1395/2025)</p>
          </div>
        )}

        {/* Approval status */}
        {pendingApprovals > 0 ? (
          <Link to="/hr/payroll" className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 hover:shadow-sm transition-all">
            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">
              {pendingApprovals} payroll record{pendingApprovals > 1 ? 's' : ''} awaiting approval
            </span>
            <ArrowRight size={12} className="text-amber-500 shrink-0" />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">All payroll records approved</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Link to="/hr/payroll" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">Payroll</Link>
        <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        <Link to="/hr/payroll-administration" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">Administration</Link>
        <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        <Link to="/reports" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">Reports</Link>
      </div>
    </div>
  );
};

export default PayrollInsightsWidget;








