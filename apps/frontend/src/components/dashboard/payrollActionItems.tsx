import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, X, ArrowRight } from 'lucide-react';

interface PayrollActionItemsProps {
  payrollCurrent: any;
  stats: any;
  dashStats: any;
}

interface ActionItem {
  type: 'warn' | 'info' | 'critical';
  key: number;
  title: string;
  detail: React.ReactNode;
  to: string;
  linkLabel: string;
}

const PayrollActionItems: React.FC<PayrollActionItemsProps> = ({
  payrollCurrent, stats, dashStats,
}) => {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const allAlerts: ActionItem[] = [];

  // /payroll/dashboard-stats returns flat fields: { totalNet, totalGross, count, totalEmployees, ... }
  const empCount = payrollCurrent?.totalEmployees ?? dashStats?.payroll?.totalEmployees ?? 0;
  const empConfigured = payrollCurrent?.count ?? payrollCurrent?.currentMonth?.approvedCount ?? 0;

  if (payrollCurrent && empCount > empConfigured && empConfigured > 0)
    allAlerts.push({
      type: 'warn',
      key: 0,
      title: `${empCount - empConfigured} employee(s) have no salary configured`,
      detail: 'Payroll cannot be processed for unconfigured employees.',
      to: '/hr/employees',
      linkLabel: 'Configure in Employees',
    });

  if (stats?.pending > 0)
    allAlerts.push({
      type: 'info',
      key: 1,
      title: `${stats.pending} attendance record(s) pending verification`,
      detail: 'Unverified records may affect payroll accuracy.',
      to: '/hr/attendance',
      linkLabel: 'Verify Attendance',
    });

  if (dashStats?.reimbursement?.pending > 0)
    allAlerts.push({
      type: 'info',
      key: 2,
      title: `${dashStats.reimbursement.pending} reimbursement claim(s) awaiting approval`,
      detail: 'Pending claims are not included in the current payroll run.',
      to: '/hr/payroll-administration?tab=reimbursement',
      linkLabel: 'Review Claims',
    });

  // VAT deadline alert (≤5 days)
  const now = new Date();
  const vatDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 30);
  const vatDays = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86_400_000);
  if (vatDays <= 5) {
    allAlerts.push({
      type: vatDays <= 2 ? 'critical' : 'warn',
      key: 3,
      title: `VAT return due in ${vatDays} day${vatDays !== 1 ? 's' : ''} — ETB 500/day penalty`,
      detail: `Monthly VAT filing deadline: ${vatDeadline.toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })}`,
      to: '/tax/vat',
      linkLabel: 'File VAT Now',
    });
  }

  // BIT reminder (October–November: 4 months after Ethiopian FY end July 7)
  if ((now.getMonth() + 1 === 10 && now.getDate() >= 1) || now.getMonth() + 1 === 11) {
    allAlerts.push({
      type: 'warn',
      key: 4,
      title: 'Business Income Tax (BIT) filing due by November 7 — 30% flat rate',
      detail: 'Annual BIT declaration must be filed within 4 months of Ethiopian fiscal year end (July 7).',
      to: '/tax/business-income',
      linkLabel: 'File BIT',
    });
  }

  const visible = allAlerts.filter(a => !dismissed.has(a.key));
  if (visible.length === 0) return null;

  const typeStyles = {
    critical: {
      wrap: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60',
      bar: 'bg-rose-500',
      icon: 'bg-rose-100 dark:bg-rose-900/50',
      iconEl: <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />,
      title: 'text-rose-800 dark:text-rose-300',
      btn: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900',
    },
    warn: {
      wrap: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60',
      bar: 'bg-amber-400',
      icon: 'bg-amber-100 dark:bg-amber-900/50',
      iconEl: <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />,
      title: 'text-amber-800 dark:text-amber-300',
      btn: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900',
    },
    info: {
      wrap: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60',
      bar: 'bg-emerald-400',
      icon: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconEl: <Info size={13} className="text-emerald-600 dark:text-emerald-400 dark:text-emerald-400" />,
      title: 'text-emerald-800 dark:text-emerald-300',
      btn: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900',
    },
  };

  return (
    <div className="space-y-2">
      {visible.map((a, idx) => {
        const s = typeStyles[a.type];
        return (
          <div
            key={a.key}
            className={`relative flex items-start gap-3 pl-4 pr-3.5 py-3 rounded-xl border overflow-hidden animate-in slide-in-from-top-1 duration-200 ${s.wrap}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${s.bar}`} />
            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${s.icon}`}>
              {s.iconEl}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold leading-snug ${s.title}`}>{a.title}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{a.detail}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <Link
                to={a.to}
                className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${s.btn}`}
              >
                {a.linkLabel} <ArrowRight size={9} />
              </Link>
              <button
                onClick={() => setDismissed(prev => new Set([...prev, a.key]))}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Dismiss"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PayrollActionItems;



