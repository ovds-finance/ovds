import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sparkline } from './ChartWidgets';
import { useCountUp } from '../hooks/useCountUp';
import { Icon } from './ui/icon';

/**
 * StatsCard — Ovds SaaS style KPI card.
 *
 * Design (matches .aki-kpi-card pattern):
 *  - White surface, 1px border, 8px radius, subtle shadow
 *  - Coloured 4px left-border accent stripe (Ovds SaaS signature)
 *  - Icon badge: 48×48, rounded-xl, gradient bg
 *  - Value: 24px bold mono tabular
 *  - Trend pill: indigo / rose / slate
 *  - Hover: translateY(-1px) + stronger shadow
 *  - Sparkline: optional mini chart at bottom
 *  - Insight: AI contextual strip at bottom
 */

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?:
    | 'blue' | 'green' | 'indigo' | 'yellow' | 'amber'
    | 'red' | 'purple' | 'slate' | 'orange' | 'teal' | 'indigo';
  trend?: number;
  trendLabel?: string;
  sub?: string;
  onClick?: () => void;
  link?: string;
  loading?: boolean;
  sparkline?: number[];
  sparklineType?: 'area' | 'bar' | 'line';
  compact?: boolean;
  tooltip?: string;
  badge?: string;
  insight?: string;
}

/* ── Colour config — border accent + icon gradient + sparkline ── */
const COLOR_CFG: Record<string, {
  border: string;
  gradFrom: string;
  gradTo: string;
  shadow: string;
  spark: string;
  insightBg: string;
  insightBorder: string;
  insightText: string;
}> = {
  blue:    { border:'var(--pro-azure)',    gradFrom:'var(--pro-azure)',    gradTo:'var(--pro-azure-dark)', shadow:'rgba(79,186,111,0.25)',  spark:'var(--pro-azure)',    insightBg:'var(--pro-azure-50)',  insightBorder:'var(--pro-azure-100)',  insightText:'var(--pro-azure-dark)' },
  green:   { border:'var(--pro-green)',    gradFrom:'var(--pro-green)',    gradTo:'var(--pro-green-dark)', shadow:'rgba(46,212,122,0.28)',  spark:'var(--pro-green)',    insightBg:'var(--pro-green-50)',  insightBorder:'var(--pro-green-100)',  insightText:'var(--pro-green-700)' },
  indigo:  { border:'var(--pro-azure)',    gradFrom:'var(--pro-azure)',    gradTo:'var(--pro-azure-dark)', shadow:'rgba(79,186,111,0.25)',  spark:'var(--pro-azure)',    insightBg:'var(--pro-azure-50)',  insightBorder:'var(--pro-azure-100)',  insightText:'var(--pro-azure-dark)' },
  yellow:  { border:'var(--pro-amber)',    gradFrom:'var(--pro-amber)',    gradTo:'#B7770D',               shadow:'rgba(230,126,34,0.22)',  spark:'var(--pro-amber)',    insightBg:'#FFFBEB',             insightBorder:'#FDE68A',              insightText:'#92400E' },
  amber:   { border:'var(--pro-amber)',    gradFrom:'var(--pro-amber)',    gradTo:'#B7770D',               shadow:'rgba(230,126,34,0.22)',  spark:'var(--pro-amber)',    insightBg:'#FFFBEB',             insightBorder:'#FDE68A',              insightText:'#92400E' },
  red:     { border:'var(--pro-rose)',     gradFrom:'var(--pro-rose)',     gradTo:'#B03A2E',               shadow:'rgba(231,76,60,0.22)',   spark:'var(--pro-rose)',     insightBg:'#FEF2F2',             insightBorder:'#FECACA',              insightText:'#991B1B' },
  purple:  { border:'var(--pro-violet)',   gradFrom:'var(--pro-violet)',   gradTo:'#5B21B6',               shadow:'rgba(124,58,237,0.22)',  spark:'var(--pro-violet)',   insightBg:'#F5F3FF',             insightBorder:'#DDD6FE',              insightText:'#5B21B6' },
  slate:   { border:'#94A3B8',             gradFrom:'#64748B',             gradTo:'#475569',               shadow:'rgba(100,116,139,0.22)', spark:'#64748B',             insightBg:'#F8FAFC',             insightBorder:'#E2E8F0',              insightText:'#475569' },
  orange:  { border:'#F97316',             gradFrom:'#F97316',             gradTo:'#C2410C',               shadow:'rgba(249,115,22,0.22)',  spark:'#F97316',             insightBg:'#FFF7ED',             insightBorder:'#FED7AA',              insightText:'#9A3412' },
  teal:    { border:'var(--pro-cyan)',      gradFrom:'var(--pro-cyan)',     gradTo:'#1F618D',               shadow:'rgba(41,128,185,0.22)',  spark:'var(--pro-cyan)',     insightBg:'#F0FDFA',             insightBorder:'#99F6E4',              insightText:'#134E4A' },
};

const AnimatedValue: React.FC<{ value: string | number; style?: React.CSSProperties }> = ({ value, style }) => {
  const safe = (value == null || typeof value === 'object') ? '0' : value;
  const animated = useCountUp(safe);
  return (
    <p className="text-[24px] font-bold tabular-nums tracking-tight leading-none" style={style}>
      {animated}
    </p>
  );
};

export const StatsCard: React.FC<StatsCardProps> = ({
  label, value, icon, color = 'blue',
  trend, trendLabel, sub, onClick, link,
  loading, sparkline, sparklineType = 'area',
  compact = false, tooltip, badge, insight,
}) => {
  const c = COLOR_CFG[color] ?? COLOR_CFG.blue;
  const [copied, setCopied] = useState(false);

  const hasTrend  = trend !== undefined;
  const trendUp   = hasTrend && trend! > 0;
  const trendDown = hasTrend && trend! < 0;
  const trendFlat = hasTrend && trend === 0;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const str = (value == null || typeof value === 'object') ? '0' : String(value);
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const inner = (
    <>
      {/* Watermark icon */}
      <div
        className="absolute -bottom-3 -right-3 pointer-events-none select-none"
        style={{ opacity: 0.035 }}
        aria-hidden="true"
      >
        <div className="w-24 h-24">{icon}</div>
      </div>

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">

          {/* Label */}
          <div className="flex items-center gap-1.5 mb-2">
            <p
              className="text-[10px] font-black uppercase tracking-widest truncate"
              style={{ color: 'var(--text-4)' }}
            >
              {label}
            </p>
            {badge && (
              <span
                className="shrink-0 text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-4)',
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Value */}
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-6 w-24 rounded-lg" style={{ background: 'var(--border)', animation: 'aki-shimmer 1.4s ease-in-out infinite' }} />
              {sub && <div className="h-3 w-20 rounded" style={{ background: 'var(--border)' }} />}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 group/val">
                <AnimatedValue value={value} style={{ color: c.border }} />
                <button
                  onClick={handleCopy}
                  className="opacity-0 group-hover/val:opacity-100 mt-0.5 p-1 rounded-lg transition-all"
                  style={{ color: 'var(--text-4)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  title="Copy value"
                  aria-label="Copy value"
                >
                  {copied ? <Check size={11} style={{ color: 'var(--pro-azure)' }} /> : <Copy size={11} />}
                </button>
              </div>
              {sub && (
                <p className="text-[10px] font-medium mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>
                  {sub}
                </p>
              )}
            </>
          )}

          {/* Trend */}
          {!loading && hasTrend && (
            <div
              className="inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded-lg text-[10px] font-semibold"
              style={
                trendUp
                  ? { background: 'var(--pro-azure-50)', color: 'var(--pro-azure-dark)' }
                  : trendDown
                    ? { background: '#FEF2F2', color: '#9F1239' }
                    : { background: 'var(--surface-alt)', color: 'var(--text-4)' }
              }
            >
              {trendUp   && <TrendingUp  size={10} />}
              {trendDown && <TrendingDown size={10} />}
              {trendFlat && <Minus size={10} />}
              <span>{trendUp ? '+' : ''}{trend}%</span>
              {trendLabel && <span style={{ opacity: 0.65, fontWeight: 400 }}>{trendLabel}</span>}
            </div>
          )}
        </div>

        {/* Icon badge */}
        {icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${c.gradFrom} 0%, ${c.gradTo} 100%)`,
              boxShadow: `0 4px 14px ${c.shadow}`,
              opacity: loading ? 0.4 : 1,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Sparkline */}
      {!loading && sparkline && sparkline.length > 1 && (
        <div className="mt-3 -mx-1">
          <Sparkline data={sparkline} color={c.spark} type={sparklineType} height={32} />
        </div>
      )}

      {/* Contextual insight */}
      {!loading && insight && (
        <div
          className="mt-3 flex items-start gap-1.5 px-2.5 py-2 rounded-xl border text-[10px] font-medium leading-snug"
          style={{
            background: c.insightBg,
            borderColor: c.insightBorder,
            color: c.insightText,
            animation: 'aki-fade-in 500ms ease both',
          }}
        >
          <Icon name="INFO" size={10} style={{ flexShrink: 0, marginTop: 1, opacity: 0.7 }} />
          <span>{insight}</span>
        </div>
      )}
    </>
  );

  const cls = [
    compact ? 'p-4' : 'p-5',
    'relative overflow-hidden group rounded-lg transition-all duration-200',
    onClick || link ? 'cursor-pointer active:scale-[0.99]' : '',
  ].join(' ');

  const style: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderLeft: `4px solid ${c.border}`,       // ← Ovds SaaS signature left accent
    boxShadow: 'var(--card-shadow)',
  };

  const hoverStyle = {
    boxShadow: 'var(--card-shadow-hover)',
    transform: 'translateY(-1px)',
    borderColor: 'var(--border)',              // keep right/top/bottom consistent
  };

  if (link) {
    return (
      <Link
        to={link}
        className={cls}
        style={style}
        aria-label={`${label}: ${value}`}
        title={tooltip}
        onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, hoverStyle)}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
          (e.currentTarget as HTMLElement).style.transform = '';
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cls}
      style={style}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `${label}: ${value}` : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={tooltip}
      onMouseEnter={e => { if (onClick || !onClick) Object.assign((e.currentTarget as HTMLElement).style, hoverStyle); }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-shadow)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {inner}
    </div>
  );
};
