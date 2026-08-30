import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sparkline } from './ChartWidgets';
import { useCountUp } from '../hooks/useCountUp';
import { Icon } from './ui/icon';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?:
    | 'blue'
    | 'green'
    | 'yellow'
    | 'red'
    | 'purple'
    | 'slate'
    | 'orange'
    | 'teal'
    | 'emerald'
    | 'amber'
    | 'indigo';
  trend?: number;
  trendLabel?: string;
  sub?: string;
  onClick?: () => void;
  link?: string;
  loading?: boolean;
  sparkline?: number[];
  sparklineType?: 'area' | 'bar' | 'line';
  compact?: boolean;
  /** Tooltip shown on hover */
  tooltip?: string;
  /** Small badge label (e.g. "RBAC: read-only") */
  badge?: string;
  /** Contextual AI-style insight shown at the bottom of the card */
  insight?: string;
}

const colorConfig: Record<
  string,
  {
    bg: string;
    text: string;
    gradient: string;
    shadow: string;
    ring: string;
    spark: string;
    insightBg: string;
  }
> = {
  blue: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    gradient: 'from-sky-500 to-sky-600',
    shadow: 'shadow-sky-500/20',
    ring: 'hover:ring-sky-200',
    spark: '#0ea5e9',
    insightBg: 'bg-sky-50 border-sky-200 text-sky-700',
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/20',
    ring: 'hover:ring-emerald-200',
    spark: '#10b981',
    insightBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/20',
    ring: 'hover:ring-emerald-200',
    spark: '#10b981',
    insightBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  yellow: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/20',
    ring: 'hover:ring-amber-200',
    spark: '#f59e0b',
    insightBg: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600',
    shadow: 'shadow-amber-500/20',
    ring: 'hover:ring-amber-200',
    spark: '#f59e0b',
    insightBg: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  red: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    gradient: 'from-rose-500 to-rose-600',
    shadow: 'shadow-rose-500/20',
    ring: 'hover:ring-rose-200',
    spark: '#f43f5e',
    insightBg: 'bg-rose-50 border-rose-200 text-rose-700',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    gradient: 'from-slate-500 to-slate-600',
    shadow: 'shadow-slate-500/20',
    ring: 'hover:ring-slate-200',
    spark: '#64748b',
    insightBg: 'bg-slate-100 border-slate-200 text-slate-600',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600',
    shadow: 'shadow-orange-500/20',
    ring: 'hover:ring-orange-200',
    spark: '#f97316',
    insightBg: 'bg-orange-50 border-orange-200 text-orange-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600',
    shadow: 'shadow-indigo-500/20',
    ring: 'hover:ring-indigo-200',
    spark: '#6366f1',
    insightBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  purple: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    gradient: 'from-violet-500 to-violet-600',
    shadow: 'shadow-violet-500/20',
    ring: 'hover:ring-violet-200',
    spark: '#a855f7',
    insightBg: 'bg-violet-50 border-violet-200 text-violet-700',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-600',
    shadow: 'shadow-teal-500/20',
    ring: 'hover:ring-teal-200',
    spark: '#14b8a6',
    insightBg: 'bg-teal-50 border-teal-200 text-teal-700',
  },
};

const AnimatedValue: React.FC<{ value: string | number; className: string }> = ({ value, className }) => {
  // Coerce objects/null to safe string before passing to useCountUp
  const safeValue = (value === null || value === undefined || typeof value === 'object')
    ? '0'
    : value;
  const animated = useCountUp(safeValue);
  return <p className={className}>{animated}</p>;
};

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  color = 'blue',
  trend,
  trendLabel,
  sub,
  onClick,
  link,
  loading,
  sparkline,
  sparklineType = 'area',
  compact = false,
  tooltip,
  badge,
  insight,
}) => {
  const c = colorConfig[color];
  const hasTrend = trend !== undefined;
  const trendUp = hasTrend && trend > 0;
  const trendDown = hasTrend && trend < 0;
  const trendFlat = hasTrend && trend === 0;
  const pad = compact ? 'p-3' : 'p-3.5';
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Safely convert value to string, handling objects/null
    const str = (value === null || value === undefined || typeof value === 'object')
      ? '0'
      : String(value);
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const inner = (
    <>
      {/* Watermark icon — subtler, scales on hover */}
      <div className="absolute -bottom-3 -right-3 opacity-[0.035] group-hover:opacity-[0.065] group-hover:scale-105 transition-all duration-700 ease-out pointer-events-none select-none">
        <div className="w-24 h-24">{icon}</div>
      </div>

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          {/* Label row */}
          <div className="flex items-center gap-1.5">
            <p className="block text-[11px] font-black text-ovds-text-muted dark:text-ovds-text-subtle uppercase tracking-widest mb-2 ml-1 truncate">
              {label}
            </p>
            {badge && (
              <span className="shrink-0 text-[8px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider border border-slate-200">
                {badge}
              </span>
            )}
          </div>

          {/* Value */}
          {loading ? (
            <div className="mt-2 space-y-1.5">
              <div className="h-7 w-24 bg-slate-100 rounded-lg ovds-shimmer" />
              {sub && <div className="h-3 w-20 bg-slate-100 rounded ovds-shimmer" />}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 group/val">
                <AnimatedValue
                  value={value}
                  className={`${compact ? 'text-lg' : 'text-2xl'} font-black tracking-tight mt-1 count-up ${c.text} tabular-nums`}
                />
                <button
                  onClick={handleCopy}
                  className="opacity-0 group-hover/val:opacity-100 mt-1.5 p-1 rounded-lg hover:bg-slate-100 transition-all"
                  title="Copy value"
                >
                  {copied
                    ? <Check size={11} className="text-emerald-500" />
                    : <Copy size={11} className="text-slate-400" />
                  }
                </button>
              </div>
              {sub && (
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate leading-relaxed">
                  {sub}
                </p>
              )}
            </>
          )}

          {/* Trend */}
          {!loading && hasTrend && (
            <div
              className={`inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                trendUp
                  ? 'bg-emerald-50 text-emerald-600'
                  : trendDown
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {trendUp && <TrendingUp size={10} />}
              {trendDown && <TrendingDown size={10} />}
              {trendFlat && <Minus size={10} />}
              <span>{trendUp ? '+' : ''}{trend}%</span>
              {trendLabel && (
                <span className="opacity-60 font-normal">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Icon badge — emerald bg, white icon */}
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white shadow-xl ${c.shadow} group-hover:scale-105 transition-all duration-200 shrink-0 ${loading ? 'opacity-40' : ''}`}
        >
          <span>{icon}</span>
        </div>
      </div>

      {/* Sparkline */}
      {!loading && sparkline && sparkline.length > 1 && (
        <div className="mt-3 -mx-1">
          <Sparkline data={sparkline} color={c.spark} type={sparklineType} height={34} />
        </div>
      )}

      {/* Contextual insight — shown only when provided and not loading */}
      {!loading && insight && (
        <div className={`mt-3 flex items-start gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-medium leading-snug ${c.insightBg} animate-in fade-in duration-500`}>
          <Icon name="INFO" size={10} className="shrink-0 mt-0.5 opacity-70" />
          <span>{insight}</span>
        </div>
      )}
    </>
  );

  const cls = `${compact ? 'p-4' : 'p-6'} bg-ovds-surface dark:bg-ovds-surface-dark border border-ovds-border dark:border-ovds-muted-dark rounded-3xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/50 group relative overflow-hidden ${onClick || link ? 'cursor-pointer active:scale-[0.99]' : ''}`;

  if (link) {
    return (
      <Link to={link} className={cls} aria-label={`${label}: ${value}`} title={tooltip}>
        {inner}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cls}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `${label}: ${value}` : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={tooltip}
    >
      {inner}
    </div>
  );
};
