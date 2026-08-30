import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, AlertTriangle, CheckCircle2, ArrowRight,
  Globe, Shield, Banknote, FileText, ChevronRight,
} from 'lucide-react';

interface Deadline {
  id: string;
  label: string;
  sub: string;
  days: number | null;
  to: string;
  icon: React.ReactNode;
  urgent: boolean;
  overdue: boolean;
  color: string;
  bg: string;
  border: string;
}

interface TaxCalendarWidgetProps {
  compact?: boolean;
}

const TaxCalendarWidget: React.FC<TaxCalendarWidgetProps> = ({ compact = false }) => {
  const deadlines = useMemo<Deadline[]>(() => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    // VAT: due 30th of following month
    const vatDeadline = new Date(y, now.getMonth() + 1, 30);
    const vatDays = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86_400_000);

    // DRRF: quarterly — 15th of last month of quarter
    const isQEnd = [3, 6, 9, 12].includes(m);
    const drrfDeadline = isQEnd ? new Date(y, m - 1, 15) : null;
    const drrfDays = drrfDeadline ? Math.ceil((drrfDeadline.getTime() - now.getTime()) / 86_400_000) : null;

    // BIT: April (4th month) — within 4 months of FY end (Ethiopian FY ends July 7)
    const bitDeadline = new Date(y, 10, 7); // Nov 7
    const bitDays = Math.ceil((bitDeadline.getTime() - now.getTime()) / 86_400_000);

    // Payroll: end of current month
    const payrollDeadline = new Date(y, now.getMonth() + 1, 0);
    const payrollDays = Math.ceil((payrollDeadline.getTime() - now.getTime()) / 86_400_000);

    // PIT: monthly with payroll

    const colorFor = (days: number | null) => {
      if (days === null) return { color: 'text-slate-500 dark:text-slate-400', bg: 'bg-white dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' };
      if (days < 0) return { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' };
      if (days <= 3) return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' };
      if (days <= 7) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' };
      return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' };
    };

    const items: Deadline[] = [
      {
        id: 'vat',
        label: 'VAT Return',
        sub: `Due ${vatDeadline.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })} · Proc. 1341/2024`,
        days: vatDays,
        to: '/tax/vat',
        icon: <Globe size={14} />,
        urgent: vatDays <= 5,
        overdue: vatDays < 0,
        ...colorFor(vatDays),
      },
      {
        id: 'payroll',
        label: 'Payroll Run',
        sub: `${now.toLocaleString('en-ET', { month: 'long' })} · PIT + Pension`,
        days: payrollDays,
        to: '/hr/payroll',
        icon: <Banknote size={14} />,
        urgent: payrollDays <= 5,
        overdue: payrollDays < 0,
        ...colorFor(payrollDays),
      },
      ...(drrfDays !== null ? [{
        id: 'drrf',
        label: 'DRRF Levy',
        sub: `Quarterly · Reg. 570/2025`,
        days: drrfDays,
        to: '/disaster-fund',
        icon: <Shield size={14} />,
        urgent: drrfDays <= 5,
        overdue: drrfDays < 0,
        ...colorFor(drrfDays),
      }] : []),
      {
        id: 'bit',
        label: 'BIT Filing',
        sub: `Annual · 30% net profit`,
        days: bitDays,
        to: '/tax/business-income',
        icon: <FileText size={14} />,
        urgent: bitDays <= 14,
        overdue: bitDays < 0,
        ...colorFor(bitDays),
      },
      {
        id: 'mat',
        label: 'MAT Assessment',
        sub: `Annual · 2.5% of turnover · with BIT`,
        days: bitDays,
        to: '/tax/business-income',
        icon: <FileText size={14} />,
        urgent: bitDays <= 14,
        overdue: bitDays < 0,
        ...colorFor(bitDays),
      },
      {
        id: 'tot',
        label: 'TOT Return (Cat. B)',
        sub: `Monthly · 2% goods / 10% services`,
        days: vatDays,
        to: '/tax/vat',
        icon: <Banknote size={14} />,
        urgent: vatDays <= 5,
        overdue: vatDays < 0,
        ...colorFor(vatDays),
      },
    ];

    return items;
  }, []);

  const urgentCount = deadlines.filter(d => d.urgent || d.overdue).length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {deadlines.slice(0, 3).map(dl => (
          <Link key={dl.id} to={dl.to}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all hover:shadow-sm ${dl.bg} ${dl.border} ${dl.color}`}>
            {dl.icon}
            <span>{dl.label}</span>
            {dl.days !== null && (
              <span className="font-semibold">{dl.days < 0 ? 'OVERDUE' : `${dl.days}d`}</span>
            )}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-xl flex items-center justify-center">
            <Calendar size={15} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tax Calendar</p>
            <p className="ovds-caption">Ethiopian 2026 filing deadlines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-[10px] font-medium rounded-full">
              <AlertTriangle size={9} /> {urgentCount} urgent
            </span>
          )}
          <Link to="/tax/dashboard" className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Tax Dashboard <ChevronRight size={10} />
          </Link>
        </div>
      </div>

      {/* Deadline cards */}
      <div className="p-4 ovds-grid-layout cols-4">
        {deadlines.map(dl => (
          <Link key={dl.id} to={dl.to}
            className={`relative p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${dl.bg} ${dl.border}`}>
            {(dl.urgent || dl.overdue) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
            <div className={`flex items-center gap-1.5 mb-2 ${dl.color}`}>
              {dl.icon}
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{dl.label}</span>
            </div>
            {dl.days !== null ? (
              <div>
                {dl.overdue ? (
                  <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">OVERDUE</p>
                ) : (
                  <p className={`text-xl font-bold tabular-nums ${dl.color}`}>
                    {dl.days}<span className="text-xs font-bold ml-0.5 opacity-60">d</span>
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-sm font-semibold ${dl.color}`}>This month</p>
            )}
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">{dl.sub}</p>
            {dl.overdue && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                <AlertTriangle size={9} /> ETB 500/day penalty
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* PIT reminder */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">PIT Brackets Active</p>
            <p className="ovds-caption">Progressive 0–35% · Pension 7%/11% · Auto-calculated in payroll</p>
          </div>
          <Link to="/hr/payroll" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
            Payroll <ArrowRight size={9} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TaxCalendarWidget;








