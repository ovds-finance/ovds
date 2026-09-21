import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { COLOR_VALUE, ICON_BG, BORDER_COLOR, InlineTooltip } from './tokens';

/**
 * AppStat — Ovds SaaS style single stat card.
 *
 * White card · 4px coloured left-border · subtle shadow
 * Trend: green up / rose down pill
 * Focus ring: --pro-azure glow
 */
export interface AppStatProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: keyof typeof COLOR_VALUE;
  onClick?: () => void;
  tooltip?: string;
}

export const AppStat: React.FC<AppStatProps> = ({
  label,
  value,
  sub,
  trend,
  icon,
  color = 'indigo',
  onClick,
  tooltip,
}) => {
  const valCls    = COLOR_VALUE[color]   ?? 'text-[var(--pro-azure)]';
  const iconCls   = ICON_BG[color]       ?? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]';
  const borderCls = BORDER_COLOR[color]  ?? 'border-[var(--pro-azure)]';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={[
        `rounded-lg p-4 border-l-4 ${borderCls} transition-all duration-150`,
        onClick
          ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1'
          : '',
      ].join(' ')}
      style={{
        background:      'var(--surface)',
        border:          '1px solid var(--border)',
        borderLeftWidth: '4px',
        boxShadow:       'var(--card-shadow)',
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow  = 'var(--card-shadow-hover)';
        (e.currentTarget as HTMLDivElement).style.transform  = 'translateY(-1px)';
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow  = 'var(--card-shadow)';
        (e.currentTarget as HTMLDivElement).style.transform  = '';
      } : undefined}
    >
      {/* Icon + trend row */}
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
            {icon}
          </div>
        )}
        {trend !== undefined && trend !== 0 && (
          <div
            className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
            style={
              trend > 0
                ? { background: 'var(--pro-azure-50)', color: 'var(--pro-azure-dark)' }
                : { background: '#FEF2F2', color: '#9F1239' }
            }
          >
            {trend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex items-center gap-1 mb-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider leading-none"
          style={{ color: 'var(--text-4)' }}
        >
          {label}
        </p>
        {tooltip && <InlineTooltip text={tooltip} />}
      </div>

      {/* Value */}
      <p className={`text-[20px] font-bold tabular-nums tracking-tight leading-none ${valCls}`}>
        {value}
      </p>

      {/* Sub */}
      {sub && (
        <p className="text-[10px] mt-1.5 leading-tight" style={{ color: 'var(--text-4)' }}>
          {sub}
        </p>
      )}
    </div>
  );
};
