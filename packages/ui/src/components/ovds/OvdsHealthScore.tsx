/**
 * ovdsHealthScore — Plain-language financial health indicator
 * Translates accounting metrics into a simple score non-accountants understand
 * Inspired by ovds's clean card style
 */
import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Clock, Wallet } from 'lucide-react';

interface HealthMetric {
  label: string;
  description: string;
  value: string;
  status: 'good' | 'warning' | 'bad';
  icon: React.ReactNode;
}

interface ovdsHealthScoreProps {
  collectionRate?: number;   // % of invoices collected
  overdueCount?: number;     // number of overdue invoices
  cashBalance?: number;      // current cash
  grossMargin?: number;      // gross margin %
  dso?: number;              // days sales outstanding
  currency?: string;
  loading?: boolean;
}

function getStatus(value: number, goodThreshold: number, badThreshold: number, higherIsBetter = true): 'good' | 'warning' | 'bad' {
  if (higherIsBetter) {
    if (value >= goodThreshold) return 'good';
    if (value >= badThreshold) return 'warning';
    return 'bad';
  } else {
    if (value <= goodThreshold) return 'good';
    if (value <= badThreshold) return 'warning';
    return 'bad';
  }
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  good:    <CheckCircle2 size={14} className="text-emerald-500" />,
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  bad:     <XCircle size={14} className="text-rose-500" />,
};

const STATUS_BAR: Record<string, string> = {
  good:    'bg-emerald-500',
  warning: 'bg-amber-500',
  bad:     'bg-rose-500',
};

const STATUS_LABEL: Record<string, string> = {
  good:    'Healthy',
  warning: 'Needs attention',
  bad:     'Action required',
};

export const ovdsHealthScore: React.FC<ovdsHealthScoreProps> = ({
  collectionRate = 0,
  overdueCount = 0,
  cashBalance = 0,
  grossMargin = 0,
  dso = 0,
  currency = 'ETB',
  loading,
}) => {
  // Calculate overall score (0-100)
  const scores = [
    Math.min(100, collectionRate),
    Math.max(0, 100 - overdueCount * 5),
    cashBalance > 0 ? 80 : 20,
    Math.min(100, grossMargin),
    Math.max(0, 100 - dso),
  ];
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const overallStatus: 'good' | 'warning' | 'bad' =
    overallScore >= 70 ? 'good' : overallScore >= 40 ? 'warning' : 'bad';

  const metrics: HealthMetric[] = [
    {
      label: 'Invoice Collection',
      description: 'How much of what you billed has been paid',
      value: `${collectionRate.toFixed(0)}%`,
      status: getStatus(collectionRate, 80, 50),
      icon: <TrendingUp size={14} />,
    },
    {
      label: 'Overdue Invoices',
      description: 'Unpaid invoices past their due date',
      value: overdueCount.toString(),
      status: getStatus(overdueCount, 0, 5, false),
      icon: <Clock size={14} />,
    },
    {
      label: 'Cash Position',
      description: 'Money available in your bank accounts',
      value: cashBalance > 0
        ? `${currency} ${(cashBalance / 1000).toFixed(0)}K`
        : 'Low',
      status: cashBalance > 10000 ? 'good' : cashBalance > 0 ? 'warning' : 'bad',
      icon: <Wallet size={14} />,
    },
    {
      label: 'Profit Margin',
      description: 'Percentage of revenue kept as profit',
      value: `${grossMargin.toFixed(1)}%`,
      status: getStatus(grossMargin, 20, 5),
      icon: <TrendingUp size={14} />,
    },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100" />
          <div>
            <div className="h-4 bg-slate-100 rounded w-24 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] p-4">
      {/* Score header */}
      <div className="flex items-center gap-3 mb-4">
        {/* Score ring */}
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="22" fill="none"
              stroke={overallStatus === 'good' ? '#00E784' : overallStatus === 'warning' ? '#f59e0b' : '#f43f5e'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - overallScore / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-bold text-slate-800">{overallScore}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-bold text-slate-800">Financial Health</h3>
            {STATUS_ICON[overallStatus]}
          </div>
          <p className={`text-[11px] font-semibold mt-0.5 ${
            overallStatus === 'good' ? 'text-emerald-600' :
            overallStatus === 'warning' ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {STATUS_LABEL[overallStatus]}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Score out of 100</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2.5">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              metric.status === 'good' ? 'bg-emerald-50 text-emerald-600' :
              metric.status === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-rose-50 text-rose-600'
            }`}>
              {metric.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-slate-700 truncate">{metric.label}</span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {STATUS_ICON[metric.status]}
                  <span className="text-[11px] font-bold text-slate-700 tabular-nums">{metric.value}</span>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${STATUS_BAR[metric.status]}`}
                  style={{
                    width: metric.label === 'Overdue Invoices'
                      ? `${Math.max(5, 100 - parseInt(metric.value) * 10)}%`
                      : metric.label === 'Cash Position'
                        ? metric.status === 'good' ? '80%' : metric.status === 'warning' ? '40%' : '10%'
                        : `${Math.min(100, parseFloat(metric.value))}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ovdsHealthScore;
