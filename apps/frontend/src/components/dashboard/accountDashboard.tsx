/**
 * AccountDashboard — ovds-style account overview widget.
 * Shows key financial KPIs, quick actions, and setup status.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, Receipt,
  Banknote, ArrowRight, ShieldCheck,
  BarChart3, Landmark, Send, Plus, ChevronRight,
  Sparkles, Activity, Users
} from 'lucide-react';
import { useAuth } from '../../rbac/AuthContext';
import { useBusiness } from '../../context/businessContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { fmtCompact } from '../../utils/fmt';

interface AccountDashboardProps {
  currency?: string;
  loading?: boolean;
  invoiceStats?: any;
  payrollCurrent?: any;
  dashStats?: any;
}

const AccountDashboard: React.FC<AccountDashboardProps> = ({
  currency = 'ETB',
  loading = false,
  invoiceStats,
  payrollCurrent,
  dashStats,
}) => {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { companies } = useBusiness();

  const { data: ovdsSummary } = useApiQuery<any>(
    '/ovds/reports/financial-summary',
    { staleTime: 60_000, enabled: can('ovds:read'), suppressToast: true },
  );

  const { data: healthScore } = useApiQuery<any>(
    '/ovds/reports/health-score',
    { staleTime: 60_000, enabled: can('ovds:read'), suppressToast: true },
  );

  const fmt = (n: number) => fmtCompact(n, currency);
  const summary = ovdsSummary ?? null;
  const grade = healthScore?.grade ?? null;
  const overall = healthScore?.overall ?? null;

  const gradeColor = grade === 'A' ? 'text-emerald-500' : grade === 'B' ? 'text-emerald-500' : grade === 'C' ? 'text-amber-500' : 'text-rose-500';
  const gradeBg = grade === 'A' ? 'bg-emerald-500/10' : grade === 'B' ? 'bg-emerald-500/10' : grade === 'C' ? 'bg-amber-500/10' : 'bg-rose-500/10';

  const hasCompany = companies.length > 0;

  // Quick actions based on role
  const quickActions = [
    { label: 'New Invoice', icon: <Send size={14} />, to: '/sales/invoices?action=new', color: 'text-teal-600 dark:text-teal-400', show: can('invoices:write') },
    { label: 'Add Employee', icon: <Users size={14} />, to: '/hr/employees?action=new', color: 'text-violet-600 dark:text-violet-400', show: can('employees:write') },
    { label: 'Run Payroll', icon: <Banknote size={14} />, to: '/hr/payroll?action=generate', color: 'text-emerald-600 dark:text-emerald-400', show: can('payroll:generate') },
    { label: 'VAT Filing', icon: <ShieldCheck size={14} />, to: '/tax/vat', color: 'text-orange-600 dark:text-orange-400', show: can('vat:read') },
    { label: 'Bank Accounts', icon: <Landmark size={14} />, to: '/banking/accounts', color: 'text-emerald-600 dark:text-emerald-400', show: can('bank_reconciliation:read') },
    { label: 'Reports', icon: <BarChart3 size={14} />, to: '/reports', color: 'text-slate-600 dark:text-slate-400', show: can('reports:read') },
  ].filter(a => a.show);

  return (
    <div className="space-y-6">
      {/* Account overview header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-slate-400">
             <Activity size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Account Overview</h2>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">
              {hasCompany ? `${companies.length} Compan${companies.length === 1 ? 'y' : 'ies'} · ${dashStats?.totalEmployees ?? 0} Employees` : 'Action Required'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {grade && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-current/10 ${gradeBg}`}>
              <span className={`text-sm font-bold ${gradeColor}`}>{grade}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health</span>
            </div>
          )}
          <button
            onClick={() => navigate('/getting-started')}
            className="group flex items-center gap-2 px-3 py-1.5 bg-emerald-500 dark:bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-600 dark:hover:bg-slate-800 transition-all border border-emerald-700 dark:border-slate-800"
          >
            Guide <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* KPI row */}
      {summary ? (
        <div className="ovds-grid-layout cols-4">
          {[
            {
              label: 'Cash & Bank',
              value: fmt(summary.cash ?? 0),
              icon: <Wallet size={16} />,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-500/5',
              border: 'border-emerald-500/10'
            },
            {
              label: 'Receivables',
              value: fmt(summary.ar ?? 0),
              icon: <TrendingUp size={16} />,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-500/5',
              border: 'border-emerald-500/10'
            },
            {
              label: 'Payables',
              value: fmt(summary.ap ?? 0),
              icon: <TrendingDown size={16} />,
              color: 'text-rose-600 dark:text-rose-400',
              bg: 'bg-rose-500/5',
              border: 'border-rose-500/10'
            },
            {
              label: 'Net Profit',
              value: fmt(summary.netProfit ?? 0),
              icon: <BarChart3 size={16} />,
              color: (summary.netProfit ?? 0) >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400',
              bg: (summary.netProfit ?? 0) >= 0 ? 'bg-teal-500/5' : 'bg-rose-500/5',
              border: (summary.netProfit ?? 0) >= 0 ? 'border-teal-500/10' : 'border-rose-500/10'
            },
          ].map(kpi => (
            <div key={kpi.label} className={`${kpi.bg} ${kpi.border} rounded-2xl p-4 border hover:scale-[1.02] transition-transform cursor-default group`}>
              <div className={`flex items-center justify-between mb-3`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bg} border ${kpi.border} ${kpi.color}`}>
                  {kpi.icon}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={12} className="text-slate-400" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      ) : loading ? (
        <div className="ovds-grid-layout cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        /* No financial data yet — show setup prompt */
        <div className="flex items-center gap-5 p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 group/setup">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover/setup:scale-110 transition-transform">
            <Sparkles size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {hasCompany ? 'Seed your accounts' : 'Setup your company'}
            </p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {hasCompany
                ? 'Get your Ethiopian account structure ready in seconds to start tracking income and expenses.'
                : 'Enter your business details, TIN and logo to start your cloud accounting journey.'}
            </p>
          </div>
          <button
            onClick={() => navigate(hasCompany ? '/accounting' : '/companies/new')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus size={16} /> {hasCompany ? 'Start Seeding' : 'Create Company'}
          </button>
        </div>
      )}

      {/* Invoice + Payroll summary row */}
      {(invoiceStats || payrollCurrent) && (
        <div className="ovds-grid-layout cols-2">
          {invoiceStats && (
            <Link to="/sales/invoices" className="group flex items-center gap-4 p-5 ovds-widget-card hover:border-teal-300 dark:hover:border-teal-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                <Receipt size={20} className="text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Sales & Invoices</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase">
                     {invoiceStats.overdueCount ?? 0} Overdue
                  </span>
                  <span className="text-slate-300 dark:text-slate-800">|</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                     {invoiceStats.draftCount ?? 0} Drafts
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{fmt(invoiceStats.thisTotal ?? 0)}</p>
                {invoiceStats.trend !== undefined && (
                  <p className={`text-[10px] font-bold mt-0.5 ${invoiceStats.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {invoiceStats.trend >= 0 ? '+' : '-'}{Math.abs(invoiceStats.trend)}% vs last month
                  </p>
                )}
              </div>
            </Link>
          )}
          {payrollCurrent && (
            <Link to="/hr/payroll" className="group flex items-center gap-4 p-5 ovds-widget-card hover:border-violet-300 dark:hover:border-violet-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                <Banknote size={20} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Monthly Payroll</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">{payrollCurrent.configured ?? 0} Staff Active</span>
                  <span className="text-slate-300 dark:text-slate-800">|</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">May 2024</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{fmt(payrollCurrent.totalNet ?? 0)}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Total Net Pay</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Instant Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map(action => (
              <button
                key={action.to}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center transition-all group-hover:scale-110 ${action.color}`}>
                  {action.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center uppercase tracking-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Health score bar */}
      {overall !== null && (
        <div className="flex items-center gap-5 p-5 bg-emerald-50 dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden relative group/health">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-transparent pointer-events-none" />
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-white/5 flex items-center justify-center shrink-0 text-emerald-600 dark:text-white group-hover/health:rotate-12 transition-transform">
             <Activity size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Business Health Score</span>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-black tabular-nums ${gradeColor}`}>{overall}%</span>
                {grade && <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border border-current/20 ${gradeBg} ${gradeColor}`}>GRADE {grade}</span>}
              </div>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  overall >= 80 ? 'bg-emerald-500' : overall >= 65 ? 'bg-emerald-500' : overall >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${overall}%` }}
              />
            </div>
          </div>
          <Link to="/reports?type=health" className="p-3 bg-emerald-100 dark:bg-white/5 rounded-xl text-emerald-600 dark:text-white hover:bg-emerald-200 dark:hover:bg-white/10 transition-all shrink-0 border border-emerald-200 dark:border-white/5">
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default AccountDashboard;


