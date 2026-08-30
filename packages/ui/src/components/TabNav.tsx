/**
 * TabNav — reusable tab navigation component.
 *
 * Replaces the many ad-hoc tab implementations scattered across pages with
 * a single, accessible, keyboard-navigable component.
 *
 * Variants:
 *   - 'underline' (default) — bottom border indicator (ovds style)
 *   - 'pills'               — filled pill background
 *   - 'boxed'               — segmented control style
 *
 * Usage:
 *   <TabNav
 *     tabs={[
 *       { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
 *       { key: 'invoices', label: 'Invoices', count: 24 },
 *       { key: 'settings', label: 'Settings', disabled: true },
 *     ]}
 *     active="overview"
 *     onChange={setActiveTab}
 *   />
 */
import React, { useCallback } from 'react';

export interface TabItem {
  key:       string;
  label:     React.ReactNode;
  icon?:     React.ReactNode;
  count?:    number;
  badge?:    React.ReactNode;
  disabled?: boolean;
}

export type TabNavVariant = 'underline' | 'pills' | 'boxed';

export interface TabNavProps {
  tabs:       TabItem[];
  active:     string;
  onChange:   (key: string) => void;
  variant?:   TabNavVariant;
  size?:      'sm' | 'md';
  className?: string;
  /** Stretch tabs to fill available width */
  stretch?:   boolean;
}

export const TabNav: React.FC<TabNavProps> = ({
  tabs,
  active,
  onChange,
  variant = 'underline',
  size = 'md',
  className = '',
  stretch = false,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, key: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(key);
      }
    },
    [onChange],
  );

  // -- Underline variant ------------------------------------------------------
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-0 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none ${className}`}
      >
        {tabs.map(tab => {
          const isActive = tab.key === active;
          const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
          const pad      = size === 'sm' ? 'px-2.5 py-2'  : 'px-3 py-2.5';
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.key)}
              onKeyDown={e => handleKeyDown(e, tab.key)}
              className={[
                'flex items-center gap-1.5 whitespace-nowrap border-b-2 font-semibold transition-all -mb-px',
                textSize, pad,
                isActive
                  ? 'border-emerald-500 text-gray-900 dark:text-slate-100'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700',
                tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
                stretch ? 'flex-1 justify-center' : '',
              ].filter(Boolean).join(' ')}
            >
              {tab.icon && (
                <span className={isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}>
                  {tab.icon}
                </span>
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.badge}
            </button>
          );
        })}
      </div>
    );
  }

  // -- Pills variant ----------------------------------------------------------
  if (variant === 'pills') {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-1 flex-wrap ${className}`}
      >
        {tabs.map(tab => {
          const isActive = tab.key === active;
          const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
          const pad      = size === 'sm' ? 'px-2.5 py-1'  : 'px-3 py-1.5';
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.key)}
              onKeyDown={e => handleKeyDown(e, tab.key)}
              className={[
                'flex items-center gap-1.5 rounded-full font-semibold transition-all',
                textSize, pad,
                isActive
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200',
                tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
                stretch ? 'flex-1 justify-center' : '',
              ].filter(Boolean).join(' ')}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 rounded-full text-[9px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // -- Boxed / segmented variant ---------------------------------------------
  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5 ${className}`}
    >
      {tabs.map(tab => {
        const isActive = tab.key === active;
        const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
        const pad      = size === 'sm' ? 'px-2.5 py-1'  : 'px-3 py-1.5';
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.key)}
            onKeyDown={e => handleKeyDown(e, tab.key)}
            className={[
              'flex items-center gap-1.5 rounded-lg font-semibold transition-all',
              textSize, pad,
              isActive
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
              tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
              stretch ? 'flex-1 justify-center' : '',
            ].filter(Boolean).join(' ')}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-1.5 rounded-full text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
