/**
 * ovdsKpiCard — ovds-inspired KPI card for non-accountants
 * Shows a plain-language label, big number, trend, and a mini sparkline
 * Designed to be immediately understandable without accounting knowledge
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';

interface SparkPoint { value: number }

interface ovdsKpiCardProps {
  label: string;
  /** Plain-language explanation shown on hover */
  tooltip?: string;
  value: string;
  subValue?: string;
  trend?: number;          // percentage change, positive = up
  trendLabel?: string;     // e.g. "vs last month"
  icon: React.ReactNode;
  iconBg: string;          // Tailwind bg class e.g. "bg-emerald-50"
  iconColor: string;       // Tailwind text class e.g. "text-emerald-600"
  accentColor?: string;    // Tailwind border-l color e.g. "border-emerald-500"
  sparkData?: SparkPoint[];
  loading?: boolean;
  onClick?: () => void;
  badge?: string;
  badgeCls?: string;
}

/** Tiny inline sparkline — no external deps */
const MiniSparkline: React.FC<{ data: SparkPoint[]; color: string }> = ({ data, color }) => {
  if (!data.length) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 64;
  const h = 28;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  // Fill area
  const fillPts = `0,${h} ${polyline} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polygon points={fillPts} fill={color} fillOpacity="0.12" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const SPARK_COLORS: Record<string, string> = {
  'bg-emerald-50': '#00E784',
  'bg-rose-50':    '#f43f5e',
  'bg-amber-50':   '#f59e0b',
  'bg-sky-50':     '#0ea5e9',
  'bg-violet-50':  '#8b5cf6',
  'bg-white':   '#64748b',
};

export const ovdsKpiCard: React.FC<ovdsKpiCardProps> = ({
  label, tooltip, value, subValue, trend, trendLabel = 'vs last month',
  icon, iconBg, iconColor, accentColor = 'border-emerald-500',
  sparkData, loading, onClick, badge, badgeCls,
}) => {
  const sparkColor = SPARK_COLORS[iconBg] ?? '#00E784';
  const trendUp = (trend ?? 0) >= 0;
  const trendNeutral = trend === undefined || trend === 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100" />
          <div className="w-16 h-7 bg-slate-100 rounded" />
        </div>
        <div className="w-24 h-3 bg-slate-100 rounded mb-2" />
        <div className="w-32 h-6 bg-slate-100 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        'group relative bg-white rounded-2xl border border-slate-100 p-4',
        'border-l-4', accentColor,
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.05)]',
        onClick ? 'cursor-pointer hover:shadow-[0_4px_16px_0_rgb(0_0_0/0.08)] hover:-translate-y-0.5 transition-all duration-150' : '',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          {badge && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeCls ?? 'bg-emerald-100 text-emerald-700'}`}>
              {badge}
            </span>
          )}
        </div>
        {sparkData && sparkData.length > 1 && (
          <MiniSparkline data={sparkData} color={sparkColor} />
        )}
      </div>

      {/* Label + tooltip */}
      <div className="flex items-center gap-1 mb-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>
        {tooltip && (
          <div className="relative group/tip">
            <HelpCircle size={10} className="text-slate-300 cursor-help" />
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                            opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-100">
              <div className="bg-slate-800 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg
                              whitespace-nowrap shadow-xl max-w-[200px] text-center leading-snug">
                {tooltip}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main value */}
      <p className="text-[22px] font-bold text-slate-800 tabular-nums tracking-tight leading-none mb-1.5">
        {value}
      </p>

      {/* Sub value + trend */}
      <div className="flex items-center justify-between">
        {subValue && (
          <p className="text-[10px] text-slate-400 font-medium">{subValue}</p>
        )}
        {!trendNeutral && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ml-auto ${
            trendUp ? 'text-emerald-600' : 'text-rose-500'
          }`}>
            {trendUp
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />
            }
            <span>{trendUp ? '+' : ''}{trend?.toFixed(1)}%</span>
            <span className="text-slate-400 font-normal ml-0.5">{trendLabel}</span>
          </div>
        )}
        {trendNeutral && trend === 0 && (
          <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 ml-auto">
            <Minus size={11} />
            <span>No change</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ovdsKpiCard;
