/**
 * BentoGrid — OVDS Bento-style modular grid layout
 *
 * Implements the 2026 bento-grid pattern: a 12-column CSS grid where
 * each cell can span different widths and heights for an asymmetric,
 * premium layout feel popular in modern SaaS dashboards.
 *
 * Exports:
 *   BentoGrid      — 12-col CSS grid container
 *   BentoCell      — a single bento cell (configurable col/row span)
 *   BentoHero      — full-width top banner cell
 *   BentoStatCell  — compact KPI cell with icon accent
 */

import React from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// BentoGrid
// ---------------------------------------------------------------------------
export interface BentoGridProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GAP: Record<string, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  gap = 'md',
  className,
}) => (
  <div className={cn('bento-grid', GAP[gap], className)}>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// BentoCell
// ---------------------------------------------------------------------------
export type BentoCols = 3 | 4 | 6 | 8 | 12;
export type BentoRows = 1 | 2;

export interface BentoCellProps {
  children: React.ReactNode;
  cols?: BentoCols;
  rows?: BentoRows;
  glass?: boolean;
  hover?: boolean;
  accentColor?: string;
  onClick?: () => void;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const COL_CLS: Record<BentoCols, string> = {
  3:  'col-span-3',
  4:  'col-span-4',
  6:  'col-span-6',
  8:  'col-span-8',
  12: 'col-span-12',
};
const ROW_CLS: Record<BentoRows, string> = {
  1: '',
  2: 'row-span-2',
};
const PAD_CLS: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export const BentoCell: React.FC<BentoCellProps> = ({
  children,
  cols = 4,
  rows = 1,
  glass = false,
  hover = true,
  accentColor,
  onClick,
  className,
  padding = 'md',
}) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    className={cn(
      'bento-cell',
      COL_CLS[cols],
      ROW_CLS[rows],
      PAD_CLS[padding],
      glass && 'glass',
      !hover && '[&:hover]:transform-none [&:hover]:shadow-none',
      onClick && 'cursor-pointer',
      className,
    )}
    style={accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// BentoHero — spans full 12 cols, used for the top-level summary
// ---------------------------------------------------------------------------
export interface BentoHeroProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  visual?: React.ReactNode;
  gradient?: boolean;
  className?: string;
}

export const BentoHero: React.FC<BentoHeroProps> = ({
  title,
  subtitle,
  actions,
  visual,
  gradient = false,
  className,
}) => (
  <div
    className={cn(
      'bento-cell col-span-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-6',
      gradient && 'bg-gradient-to-br from-[#EEF4FF] via-white to-[#F0FDF4] dark:from-[#0a1e3d] dark:via-[#141414] dark:to-[#052e16]',
      className,
    )}
  >
    <div className="min-w-0">
      <div className="ovds-hero-title mb-1">{title}</div>
      {subtitle && <div className="ovds-body">{subtitle}</div>}
      {actions && <div className="mt-4 flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
    {visual && (
      <div className="shrink-0 hidden sm:block">{visual}</div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// BentoStatCell — compact KPI for small col spans
// ---------------------------------------------------------------------------
export interface BentoStatCellProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: number;
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

export const BentoStatCell: React.FC<BentoStatCellProps> = ({
  label,
  value,
  sub,
  icon,
  iconBg = 'bg-slate-100 dark:bg-slate-800',
  trend,
  accentColor,
  onClick,
  className,
}) => (
  <div
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    className={cn(
      'bento-cell flex flex-col gap-3 p-4',
      onClick && 'cursor-pointer',
      className,
    )}
    style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
  >
    <div className="flex items-start justify-between">
      <p className="ovds-label">{label}</p>
      {icon && (
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
      )}
    </div>
    <p className="ovds-value dark:text-slate-100">{value}</p>
    {(sub || trend !== undefined) && (
      <div className="flex items-center gap-2">
        {sub && <p className="ovds-caption">{sub}</p>}
        {trend !== undefined && trend !== 0 && (
          <span className={cn(
            'text-[10px] font-bold ml-auto',
            trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500',
          )}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    )}
  </div>
);
