import { BarChart3, TrendingUp, TrendingDown, Minus, Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface StrategicInsightsWidgetProps {
  strategicInsights: any;
  currency: string;
  noCard?: boolean;
}

/** Animated progress bar that fills on mount */
const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-[var(--pro-azure-50)]0' }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.width = '0%';
    const t = setTimeout(() => {
      el.style.transition = 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.width = `${Math.min(value, 100)}%`;
    }, 120);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div ref={barRef} className={`h-full rounded-full ${color}`} style={{ width: 0 }} />
    </div>
  );
};

const TrendBadge: React.FC<{ trend: string }> = ({ trend }) => {
  if (trend === 'UP') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
      <TrendingUp size={9} /> UP
    </span>
  );
  if (trend === 'DOWN') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--pro-azure-50)]0/20 text-[var(--pro-azure-light)]">
      <TrendingDown size={9} /> DOWN
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
      <Minus size={9} /> STABLE
    </span>
  );
};

const StrategicInsightsWidget: React.FC<StrategicInsightsWidgetProps> = ({
  strategicInsights, currency,
}) => {
  if (!strategicInsights) return null;

  const complianceItems = [
    { label: 'Missing Bank Info', value: strategicInsights.complianceHealth.missingBankDetails, color: 'text-rose-400', urgent: strategicInsights.complianceHealth.missingBankDetails > 0 },
    { label: 'Unconfigured Payroll', value: strategicInsights.complianceHealth.unconfiguredPayroll, color: 'text-amber-400', urgent: strategicInsights.complianceHealth.unconfiguredPayroll > 0 },
    { label: 'Pending Reimb.', value: strategicInsights.complianceHealth.pendingReimbursements, color: 'text-slate-300', urgent: false },
    { label: 'Unpaid Invoices', value: strategicInsights.complianceHealth.unpaidInvoices, color: 'text-slate-300', urgent: false },
  ];

  const urgentCount = complianceItems.filter(i => i.urgent).length;

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl border border-[var(--pro-azure-100)] dark:border-slate-700/60 shadow-sm dark:shadow-xl p-6 text-slate-800 dark:text-white overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--pro-azure-100)]/60 dark:bg-[var(--pro-azure-50)] rounded-full -mr-36 -mt-36 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--pro-azure-100)]/40 dark:bg-[var(--pro-azure-50)]0/5 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--pro-azure-100)] dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <BarChart3 size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
          <div>
            <h3 className="ovds-card-title leading-none">Strategic Insights</h3>
            <p className="ovds-caption mt-0.5">Predictive analytics · Live data</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--pro-azure-50)]0 animate-pulse" />
          <span className="text-[10px] font-medium text-[var(--pro-azure-light)] uppercase tracking-wider">Real-time</span>
        </div>
      </div>

      <div className="ovds-grid-layout cols-3 relative">
        {/* Projected Payroll */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl p-5 hover:bg-[var(--pro-azure-50)]/50 dark:hover:bg-white/8 transition-all duration-200 group">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-[var(--pro-azure-100)] dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-[var(--pro-azure-100)] dark:bg-green-900/40 transition-colors">
              <TrendingUp size={17} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Projected Payroll</p>
              <p className="ovds-caption mt-0.5">Next month estimate</p>
            </div>
          </div>
          <p className="ovds-value-sm text-slate-800 dark:text-white tabular-nums">
            {currency} {Number(strategicInsights.projectedPayrollNextMonth).toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <TrendBadge trend={strategicInsights.resourceUtilizationTrend} />
            <span className="ovds-caption">based on active headcount</span>
          </div>
          <Link to="/reports" className="mt-4 flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:text-[var(--pro-azure-dark)] dark:hover:text-green-300 transition-colors">
            View forecast <ArrowRight size={9} />
          </Link>
        </div>

        {/* Predictive Absenteeism */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl p-5 hover:bg-[var(--pro-azure-50)]/50 dark:hover:bg-white/8 transition-all duration-200 group">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-[var(--pro-azure-50)]0/20 rounded-xl flex items-center justify-center group-hover:bg-[var(--pro-azure-dark)]/30 transition-colors">
              <Activity size={17} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Predictive Absenteeism</p>
              <p className="ovds-caption mt-0.5">Expected rate · next 30 days</p>
            </div>
          </div>
          <p className="ovds-value-sm text-slate-800 dark:text-white tabular-nums">
            {strategicInsights.absenteeismPredictionRate}%
          </p>
          <div className="mt-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dept Efficiency</p>
            {strategicInsights.efficiencyScoreByDept.slice(0, 3).map((d: any) => (
              <div key={d.department} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{d.department}</span>
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-white tabular-nums">{d.score}%</span>
                </div>
                <ProgressBar value={d.score} color={d.score >= 80 ? 'bg-[var(--pro-azure-50)]0' : d.score >= 60 ? 'bg-[var(--pro-azure-50)]0' : 'bg-amber-400'} />
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Health */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl p-5 hover:bg-[var(--pro-azure-50)]/50 dark:hover:bg-white/8 transition-all duration-200 group">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${urgentCount > 0 ? 'bg-rose-100 dark:bg-rose-500/20 group-hover:bg-rose-200 dark:group-hover:bg-rose-500/30' : 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]0/20 group-hover:bg-[var(--pro-azure-200)] dark:group-hover:bg-[var(--pro-azure-dark)]/30'}`}>
              <ShieldAlert size={17} className={urgentCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compliance Health</p>
              <p className="ovds-caption mt-0.5">
                {urgentCount > 0 ? `${urgentCount} item${urgentCount > 1 ? 's' : ''} need attention` : 'All checks passed'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {complianceItems.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-3 border transition-colors ${
                  item.urgent
                    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                    : 'bg-slate-100/60 dark:bg-black/20 border-slate-200 dark:border-white/5'
                }`}
              >
                <p className={`text-xl font-bold tabular-nums ${item.urgent ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>{item.value}</p>
                <p className="ovds-label mt-0.5">{item.label}</p>
                {item.urgent && (
                  <div className="w-1 h-1 bg-rose-400 rounded-full mt-1.5 animate-pulse" />
                )}
              </div>
            ))}
          </div>
          <Link to="/hr/employees" className="mt-4 flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-white transition-colors">
            Review compliance <ArrowRight size={9} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StrategicInsightsWidget;








