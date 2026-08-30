import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus, ArrowRight,
  Banknote, Users, Receipt, Activity, Zap,
  AlertTriangle, CheckCircle2, BarChart3, Clock,
} from 'lucide-react';
import api from '../../services/api';
import { fmtCompact } from '../../utils/fmt';
import { useAuth } from '../../rbac/AuthContext';

interface KPI {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  link: string;
  alert?: boolean;
}

interface ExecutiveSummaryWidgetProps {
  dashStats: any;
  payrollCurrent: any;
  payrollPrev: any;
  invoiceStats: any;
  currency: string;
  loading?: boolean;
}

const TrendIcon: React.FC<{ trend?: number }> = ({ trend }) => {
  if (trend === undefined || trend === null) return null;
  if (trend > 0) return <TrendingUp size={10} className="text-emerald-500" />;
  if (trend < 0) return <TrendingDown size={10} className="text-rose-500" />;
  return <Minus size={10} className="text-slate-400" />;
};

const ExecutiveSummaryWidget: React.FC<ExecutiveSummaryWidgetProps> = ({
  dashStats, payrollCurrent, payrollPrev, invoiceStats, currency, loading,
}) => {
  const { user } = useAuth();
  const [ovdsSummary, setovdsSummary] = useState<any>(null);
  const [finLoading, setFinLoading] = useState(true);

  const loadovds = useCallback(async () => {
    // Only fetch financial summary for roles that have ovds:read
    const ovdsRoles = ['SPURADMIN', 'ADMIN', 'ovds', 'ACCOUNTING', 'AUDITOR', 'PROJECT_MANAGER'];
    if (!user?.role || !ovdsRoles.includes(user.role)) {
      setFinLoading(false);
      return;
    }
    try {
      const res = await api.get('/ovds/reports/financial-summary', { headers: { 'x-background': '1' } } as any);
      setovdsSummary(res.data?.data ?? res.data ?? null);
    } catch {
      // silent — widget degrades gracefully
    } finally {
      setFinLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { loadovds(); }, [loadovds]);

  const fmt = (n: number) => fmtCompact(n, currency);
  const mom = (curr: number, prev: number) =>
    !prev ? undefined : Math.round(((curr - prev) / prev) * 100);

  const isLoading = loading || finLoading;

  const kpis: KPI[] = [
    {
      label: 'Net Pay This Month',
      value: fmt(payrollCurrent?.totalNet ?? 0),
      trend: mom(payrollCurrent?.totalNet ?? 0, payrollPrev?.totalNet ?? 0),
      trendLabel: 'vs last month',
      icon: <Banknote size={16} />,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      link: '/hr/payroll',
    },
    {
      label: 'Total Employees',
      value: String(dashStats?.totalEmployees ?? 0),
      trend: undefined,
      icon: <Users size={16} />,
      color: 'text-emerald-600 dark:text-emerald-400 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      link: '/hr/employees',
    },
    {
      label: 'Revenue (MTD)',
      value: fmt(ovdsSummary?.revenue ?? 0),
      trend: undefined,
      icon: <TrendingUp size={16} />,
      color: 'text-violet-700 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      link: '/sales/invoices',
    },
    {
      label: 'Overdue Invoices',
      value: String(invoiceStats?.overdueCount ?? 0),
      trend: undefined,
      icon: <Receipt size={16} />,
      color: (invoiceStats?.overdueCount ?? 0) > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400',
      bg: (invoiceStats?.overdueCount ?? 0) > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-white dark:bg-slate-800/50',
      link: '/sales/invoices',
      alert: (invoiceStats?.overdueCount ?? 0) > 0,
    },
    {
      label: 'Cash & Bank',
      value: fmt(ovdsSummary?.cash ?? 0),
      trend: undefined,
      icon: <Activity size={16} />,
      color: 'text-teal-700 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      link: '/banking/accounts',
    },
    {
      label: 'Net Profit',
      value: fmt(ovdsSummary?.netProfit ?? 0),
      trend: undefined,
      icon: <BarChart3 size={16} />,
      color: (ovdsSummary?.netProfit ?? 0) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400',
      bg: (ovdsSummary?.netProfit ?? 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30',
      link: '/accounting',
    },
  ];

  const actionItems = [
    dashStats?.payroll?.pending > 0 && {
      label: `${dashStats.payroll.pending} payroll records pending approval`,
      to: '/hr/payroll',
      severity: 'warning' as const,
    },
    (invoiceStats?.overdueCount ?? 0) > 0 && {
      label: `${invoiceStats.overdueCount} overdue invoice${invoiceStats.overdueCount > 1 ? 's' : ''} need attention`,
      to: '/sales/invoices',
      severity: 'critical' as const,
    },
    (dashStats?.reimbursement?.pending ?? 0) > 0 && {
      label: `${dashStats.reimbursement.pending} expense reimbursements pending`,
      to: '/purchases/expenses',
      severity: 'info' as const,
    },
  ].filter(Boolean) as { label: string; to: string; severity: 'critical' | 'warning' | 'info' }[];

  const SEVERITY_STYLES = {
    critical: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
    warning:  'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    info:     'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400',
  };

  return (
    <div className="ovds-widget-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/30 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center">
            <Zap size={15} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Company Dashboard</p>
            <p className="ovds-caption">Live KPIs · {new Date().toLocaleDateString('en-ET', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <Link to="/reports" className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          Full Reports <ArrowRight size={11} />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="p-4 ovds-grid-layout cols-3">
        {kpis.map(kpi => (
          <Link key={kpi.label} to={kpi.link}
            className={`relative p-3.5 rounded-xl border border-current/10 ${kpi.bg} hover:shadow-sm hover:-translate-y-px transition-all group`}>
            {kpi.alert && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
            <div className={`flex items-center gap-1.5 mb-2 ${kpi.color}`}>
              {kpi.icon}
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{kpi.label}</span>
            </div>
            {isLoading ? (
              <div className="h-5 w-20 bg-current/10 rounded animate-pulse" />
            ) : (
              <div className="flex items-end gap-1.5">
                <p className={`text-lg font-semibold tabular-nums leading-none ${kpi.color}`}>{kpi.value}</p>
                {kpi.trend !== undefined && (
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <TrendIcon trend={kpi.trend} />
                    <span className={`text-[9px] font-bold ${kpi.trend > 0 ? 'text-emerald-500' : kpi.trend < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-1">Action Required</p>
          {actionItems.map(item => (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm ${SEVERITY_STYLES[item.severity]}`}>
              {item.severity === 'critical' ? <AlertTriangle size={12} /> : item.severity === 'warning' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
              <span className="flex-1">{item.label}</span>
              <ArrowRight size={10} className="shrink-0 opacity-60" />
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/accounting" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">Accounting</Link>
          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <Link to="/reports" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">Reports</Link>
          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          <Link to="/reports/insights" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">Insights</Link>
        </div>
        <span className="text-[9px] text-slate-300 dark:text-slate-600">
          {user?.role ?? 'ADMIN'} view
        </span>
      </div>
    </div>
  );
};

export default ExecutiveSummaryWidget;








