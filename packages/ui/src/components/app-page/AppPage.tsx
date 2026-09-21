import React, { useRef, useEffect } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { AppTabs } from './AppTabs';
import { AppKpi } from './AppKpi';
import { AppTable } from './AppTable';
import { AppGrid } from './AppGrid';
import { AppCard } from './AppCard';
import { AppSection } from './AppSection';
import { AppSearch } from './AppSearch';
import { AppFilterBar } from './AppFilterBar';
import { AppBadge } from './AppBadge';
import { AppStat } from './AppStat';
import { AppEmpty } from './AppEmpty';
import { AppSkeleton } from './AppSkeleton';
import { AppActionBar } from './AppActionBar';

// -----------------------------------------------------------------------------
// AppPage — Ovds SaaS page shell
// Clean white header area, light grey page body, green accent.
// -----------------------------------------------------------------------------
export interface AppPageProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  actions?: React.ReactNode;
  crumbs?: { label: string; to?: string }[];
  banners?: React.ReactNode;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
  badge?: React.ReactNode;
  loading?: boolean;
}

export const AppPage: React.FC<AppPageProps> = ({
  title,
  subtitle,
  icon,
  iconBg = 'bg-[var(--pro-azure)]',
  actions,
  crumbs,
  banners,
  tabs,
  children,
  className,
  noPad,
  badge,
  loading,
}) => (
  <div
    className="min-h-full flex flex-col"
    style={{ background: 'var(--bg-main)' }}
  >
    {/* Ovds SaaS style thin green progress bar */}
    {loading && (
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden">
        <div
          className="h-full animate-[loading-bar_1.4s_ease-in-out_infinite]"
          style={{ background: 'var(--pro-azure)' }}
        />
      </div>
    )}

    {/* ── Page header — white, clean, Ovds SaaS style ─────────────────── */}
    <header
      className="shrink-0 sticky top-0 z-10"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
        padding: '12px 20px 0',
      }}
    >
      {/* Breadcrumb */}
      {crumbs && crumbs.length > 0 && (
        <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, ...crumbs]} />
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Page icon — Ovds SaaS uses a small coloured square */}
          {icon && (
            <div
              className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center text-white shrink-0`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-[15px] font-bold leading-tight tracking-tight truncate"
                style={{ color: 'var(--text)' }}
              >
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p
                className="text-[11px] mt-0.5 truncate leading-tight"
                style={{ color: 'var(--text-4)' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* Banners */}
      {banners && <div className="pb-3 space-y-2">{banners}</div>}

      {/* Tabs — flush to bottom of header, no bottom padding so border aligns */}
      {tabs && (
        <div className="overflow-x-auto scrollbar-none -mb-px" role="tablist">
          {tabs}
        </div>
      )}
    </header>

    {/* ── Page body ──────────────────────────────────────────────────────── */}
    <main
      className={`flex-1 ${noPad ? '' : 'p-4 sm:p-5'} ${className ?? ''}`}
    >
      <div className="max-w-[1400px] mx-auto">{children}</div>
    </main>
  </div>
);
