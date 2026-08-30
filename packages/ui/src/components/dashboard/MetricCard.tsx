import React, { useState } from 'react';
import { Icon } from '../ui/icon';

export interface MetricCardProps {
  title: string;
  value?: string | number;
  change?: { value: number; label?: string; isPositive?: boolean };
  icon?: React.ReactNode;
  amount?: React.ReactNode;
  percentage?: number | string;
  isPositive?: boolean;
  color?: string;
  active?: boolean;
  sub?: React.ReactNode;
  variant?: 'default' | 'highlight-success' | 'highlight-warning' | 'highlight-danger' | 'highlight-purple' | 'highlight-amber' | 'highlight-rose' | 'highlight-emerald' | 'highlight-indigo' | 'highlight-teal' | 'highlight-sky';
  subtitle?: string;
  sparkline?: number[];
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const trendColor = (isPositive?: boolean) => {
  if (isPositive === false) return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: 'arrow-down-right' };
  if (isPositive === true) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'arrow-up-right' };
  return { text: 'text-slate-500', bg: 'bg-white', border: 'border-slate-200', icon: 'minus' };
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  amount,
  percentage,
  isPositive,
  change,
  icon,
  color,
  active = false,
  sub,
  variant = 'default',
  subtitle,
  sparkline,
  loading = false,
  onClick,
  className = '',
  actionLabel,
  onAction,
}) => {
  const [copied, setCopied] = useState(false);
  const metricChange = change ?? { value: 0 };
  const trend = change?.value !== undefined && change.value !== 0 ? trendColor(change.isPositive) : null;
  const displayValue = amount ?? (typeof value === 'number' ? value.toLocaleString() : value ?? '');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value ?? 0);
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const cardCls = `aki-kpi-card ${variant} ${active ? 'ring-1 ring-aki-blue' : ''} ${onClick ? 'cursor-pointer group' : ''} ${className}`.trim();

  return (
    <div className={cardCls} onClick={onClick} role={onClick ? 'button' : undefined} style={color ? { borderColor: color } : undefined}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="aki-kpi-label">{title}</span>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-oki flex items-center justify-center bg-aki-blue-50 text-aki-blue shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        {loading ? (
          <div className="h-8 w-28 bg-slate-100 rounded-oki ovds-shimmer" />
        ) : (
          <>
            <span className="aki-kpi-value text-2xl">{displayValue}</span>
            <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" aria-label="Copy value">
              {copied ? <Icon name="CHECK" size={12} className="text-emerald-500" /> : <Icon name="CLIPBOARD_COPY" size={12} className="text-slate-400" />}
            </button>
          </>
        )}
      </div>

      {/* Trend / Subtitle / Action */}
      <div className="flex items-center gap-2 flex-wrap">
        {trend && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-oki ${trend.bg} ${trend.text} border ${trend.border}`}>
            {trend.icon === 'arrow-up-right' && <Icon name="ARROW_UP_RIGHT" size={10} className="text-emerald-500" />}
            {trend.icon === 'arrow-down-right' && <Icon name="ARROW_DOWN_RIGHT" size={10} className="text-red-500" />}
            {trend.icon === 'minus' && <Icon name="MINUS" size={10} />}
            <span>{metricChange.value > 0 ? '+' : ''}{metricChange.value}%</span>
            {metricChange.label && <span className="font-normal opacity-70 ml-0.5">{metricChange.label}</span>}
          </span>
        )}
        {!trend && (percentage !== undefined || isPositive !== undefined) && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-oki ${isPositive === false ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            {isPositive === false ? '−' : '+'}{percentage}%
          </span>
        )}
        {!trend && subtitle && <span className="text-[11px] text-aka-text-tertiary">{subtitle}</span>}
        {!trend && sub && <span className="text-[11px] text-aka-text-tertiary">{sub}</span>}
        {actionLabel && onAction && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="text-[11px] font-semibold text-aki-blue hover:text-aki-blue-dark transition-colors ml-auto"
          >
            {actionLabel}
          </button>
        )}
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length > 2 && (
        <div className="mt-1 -mx-1 h-10">
          <svg viewBox={`0 0 ${sparkline.length * 4} 40`} className="w-full h-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#0056D2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkline.map((v, i) => `${i * 4 + 2},${40 - v}`).join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  format?: 'number' | 'currency' | 'percent';
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  compact?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  format = 'number',
  sub,
  icon,
  color = 'blue',
  compact = false,
  onClick,
}) => (
  <div
    className={`aki-card ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${compact ? 'p-3' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-aka-text-quaternary">{label}</p>
        <p className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-aka-text tracking-tight mt-1.5 tabular-nums`}>
          {format === 'currency' ? `ETB ${typeof value === 'number' ? value.toLocaleString() : value}` :
           format === 'percent' ? `${value}%` :
           typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {sub && <div className="text-[11px] text-aka-text-tertiary mt-1.5">{sub}</div>}
      </div>
      {icon && <span className="shrink-0 [&>svg]:w-5 [&>svg]:h-5 text-aka-text-tertiary">{icon}</span>}
    </div>
  </div>
);

export default MetricCard;
