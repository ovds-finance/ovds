import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Banknote, ArrowRight } from 'lucide-react';

interface PayrollSummaryWidgetProps {
  payrollCurrent: any;
  currency: string;
  monthName: string;
  loading: boolean;
}

const AnimBar: React.FC<{ pct: number; color: string; delay?: number }> = ({ pct, color, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 0.9s cubic-bezier(0.16,1,0.3,1)';
      el.style.width = `${Math.min(pct, 100)}%`;
    }, 150 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div ref={ref} className={`h-full ${color} rounded-full`} style={{ width: 0 }} />
    </div>
  );
};

const PayrollSummaryWidget: React.FC<PayrollSummaryWidgetProps> = ({
  payrollCurrent, currency, monthName, loading,
}) => {
  const gross = payrollCurrent?.totalGross ?? 0;
  const pension = payrollCurrent?.totalPension ?? 0;
  const tax = payrollCurrent?.totalTax ?? 0;
  const loans = payrollCurrent?.totalLoans ?? 0;
  const net = payrollCurrent?.totalNet ?? 0;
  const pct = (v: number) => (gross > 0 ? Math.min(100, Math.round((v / gross) * 100)) : 0);

  const cols = [
    {
      label: 'Employees',
      value: String(payrollCurrent?.count ?? payrollCurrent?.totalEmployees ?? 0),
      sub: `${payrollCurrent?.count ?? 0} approved`,
      color: 'text-slate-800 dark:text-slate-200',
      bar: null,
      highlight: false,
    },
    {
      label: 'Gross Total',
      value: `${currency} ${gross.toLocaleString()}`,
      sub: 'Before deductions',
      color: 'text-slate-700 dark:text-slate-200',
      bar: { pct: 100, color: 'bg-slate-300 dark:bg-slate-600' },
      highlight: false,
    },
    {
      label: 'Pension (7%)',
      value: `${currency} ${pension.toLocaleString()}`,
      sub: 'Cap: ETB 15,000 insurable earnings',
      color: 'text-violet-600 dark:text-violet-400',
      bar: { pct: pct(pension), color: 'bg-violet-400' },
      highlight: false,
    },
    {
      label: 'Income Tax',
      value: `${currency} ${tax.toLocaleString()}`,
      sub: 'PAYE auto-calculated',
      color: 'text-rose-600 dark:text-rose-400',
      bar: { pct: pct(tax), color: 'bg-rose-400' },
      highlight: false,
    },
    {
      label: 'Loan Repayments',
      value: `${currency} ${loans.toLocaleString()}`,
      sub: 'Monthly deductions',
      color: 'text-amber-600 dark:text-amber-400',
      bar: { pct: pct(loans), color: 'bg-amber-400' },
      highlight: false,
    },
    {
      label: 'Net Pay',
      value: `${currency} ${net.toLocaleString()}`,
      sub: 'Total disbursement',
      color: 'text-emerald-700 dark:text-emerald-400',
      bar: { pct: pct(net), color: 'bg-emerald-500' },
      highlight: true,
    },
  ];

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden transition-colors">
      {/* ovds-style gross/net split bar */}
      {gross > 0 && !loading && (
        <div className="flex h-1.5">
          <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${pct(net)}%` }} />
          <div className="bg-rose-400 transition-all duration-700" style={{ width: `${pct(tax)}%` }} />
          <div className="bg-violet-400 transition-all duration-700" style={{ width: `${pct(pension)}%` }} />
          <div className="bg-amber-400 flex-1" />
        </div>
      )}
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center">
            <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-none">
              Payroll Summary
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {monthName} · Attendance-linked calculation
            </p>
          </div>
        </div>
        <Link
          to="/hr/payroll"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
        >
          <Banknote size={12} /> Full Payroll <ArrowRight size={11} />
        </Link>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100 dark:divide-slate-800">
        {cols.map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-4 relative ${s.highlight ? 'bg-emerald-50/60 dark:bg-emerald-950/15' : ''}`}
          >
            {s.highlight && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
            )}
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 leading-none">
              {s.label}
            </p>
            {loading ? (
              <div className="space-y-1.5 mt-1">
                <div className="h-4 w-20 ovds-shimmer rounded" />
                <div className="h-2 w-14 ovds-shimmer rounded" />
              </div>
            ) : (
              <>
                <p className={`text-sm font-semibold tabular-nums ${s.color} ${s.highlight ? 'text-base' : ''}`}>
                  {s.value}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{s.sub}</p>
                {s.bar && gross > 0 && (
                  <AnimBar pct={s.bar.pct} color={s.bar.color} delay={i * 60} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayrollSummaryWidget;





