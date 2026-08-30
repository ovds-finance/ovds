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
// AppPage — Main page shell
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
  iconBg = 'bg-emerald-500',
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
  <div className="min-h-full bg-white dark:bg-slate-900 flex flex-col">
    {loading && (
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden">
        <div className="h-full bg-emerald-500 dark:bg-emerald-400 animate-[loading-bar_1.4s_ease-in-out_infinite]" />
      </div>
    )}
    <header className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-5 pt-4 pb-0 shrink-0 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(0_0_0/0.04)] dark:shadow-[0_1px_0_0_rgb(0_0_0/0.12)]">
      {crumbs && crumbs.length > 0 && (
        <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, ...crumbs]} />
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div
              className={`w-9 h-9 rounded-2xl ${iconBg} shadow-sm flex items-center justify-center text-white shrink-0 transition-transform duration-200 hover:scale-105`}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[16px] font-bold text-slate-900 dark:text-slate-50 leading-tight tracking-tight truncate">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {actions}
          </div>
        )}
      </div>
      {banners && <div className="mb-3 space-y-2">{banners}</div>}
      {tabs && (
        <div className="overflow-x-auto scrollbar-none -mb-px" role="tablist">
          {tabs}
        </div>
      )}
    </header>
    <main className={`flex-1 ${noPad ? '' : 'p-4 sm:p-5'} ${className ?? ''}`}>
      <div className="max-w-[1400px] mx-auto">{children}</div>
    </main>
  </div>
);
