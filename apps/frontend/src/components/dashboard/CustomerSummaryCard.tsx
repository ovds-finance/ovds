import React from 'react';
import { Link } from 'react-router-dom';

interface CustomerSummaryCardProps {
  paidCount?: number;
  paidAmount?: number;
  openCount?: number;
  openAmount?: number;
  overdueCount?: number;
  overdueAmount?: number;
  currency?: string;
  trend?: number;
}

const CustomerSummaryCard: React.FC<CustomerSummaryCardProps> = ({
  paidCount = 0,
  paidAmount = 0,
  openCount = 0,
  openAmount = 0,
  overdueCount = 0,
  overdueAmount = 0,
  currency = 'ETB',
  trend,
}) => {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

  const total = paidAmount + openAmount + overdueAmount;
  const paidPct = total > 0 ? Math.round((paidAmount / total) * 100) : 0;
  const openPct = total > 0 ? Math.round((openAmount / total) * 100) : 0;
  const overduePct = total > 0 ? Math.round((overdueAmount / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Customer Summary</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Paid, open, and overdue totals at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              <span className="text-slate-400 font-normal">vs last month</span>
            </span>
          )}
          <Link
            to="/sales/invoices"
            className="text-[11px] font-bold text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Paid */}
        <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-xl p-3 border border-[var(--pro-azure-100)] dark:border-green-900/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-[var(--pro-azure)] uppercase tracking-wider">Paid</p>
            <span className="text-[10px] font-bold text-[var(--pro-azure)] bg-[var(--pro-azure-100)] dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
              {paidCount}
            </span>
          </div>
          <p className="text-lg font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] mt-1 tabular-nums">
            {fmt(paidAmount)}
          </p>
          <div className="mt-2 h-1.5 bg-[var(--pro-azure-100)] dark:bg-green-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-500"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>

        {/* Open */}
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Open</p>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
              {openCount}
            </span>
          </div>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
            {fmt(openAmount)}
          </p>
          <div className="mt-2 h-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${openPct}%` }}
            />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-3 border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Overdue</p>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded-full">
              {overdueCount}
            </span>
          </div>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-1 tabular-nums">
            {fmt(overdueAmount)}
          </p>
          <div className="mt-2 h-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${overduePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSummaryCard;
