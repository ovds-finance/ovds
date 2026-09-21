/**
 * NavigationPrimitives — OVDS navigation utilities
 *
 * Exports:
 *   BreadcrumbNav      — multi-level breadcrumb
 *   SmartNavSearch     — predictive search input
 *   MobileBottomNav    — mobile tab bar
 *   KeyboardShortcutHint — shortcut hint badge
 */
import React from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// BreadcrumbNav
// ---------------------------------------------------------------------------
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  maxVisible?: number;
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  maxVisible = 4,
  className,
}) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500', className)}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
          {item.href ? (
            <a href={item.href} className="hover:text-[var(--pro-azure)] dark:hover:text-blue-400 transition-colors font-medium truncate max-w-[120px]">
              {item.label}
            </a>
          ) : (
            <span className="truncate max-w-[160px]" style={{ fontWeight: i === items.length - 1 ? 600 : 500 }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// ---------------------------------------------------------------------------
// SmartNavSearch — predictive search input
// ---------------------------------------------------------------------------
export interface NavSearchSuggestion {
  id: string;
  label: string;
  category?: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface SmartNavSearchProps {
  value: string;
  onChange: (v: string) => void;
  suggestions?: NavSearchSuggestion[];
  placeholder?: string;
  loading?: boolean;
  onSelect?: (suggestion: NavSearchSuggestion) => void;
  className?: string;
}

export const SmartNavSearch: React.FC<SmartNavSearchProps> = ({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Search...',
  loading = false,
  onSelect,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/30"
      />
      {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MobileBottomNav — iOS/Android-style bottom tab bar
// ---------------------------------------------------------------------------
export interface MobileNavTab {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  href?: string;
  onClick?: () => void;
}

export interface MobileBottomNavProps {
  tabs: MobileNavTab[];
  active: string;
  onChange?: (key: string) => void;
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  tabs,
  active,
  onChange,
  className,
}) => (
  <nav
    className={cn(
      'fixed bottom-0 left-0 right-0 z-30 lg:hidden',
      'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md',
      'border-t border-slate-200 dark:border-slate-800',
      'flex items-center justify-around',
      'h-16 safe-bottom',
      className,
    )}
    role="tablist"
    aria-label="Mobile navigation"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    {tabs.map((tab) => {
      const isActive = active === tab.key;
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => { tab.onClick?.(); onChange?.(tab.key); }}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
            'text-[10px] font-semibold transition-colors duration-150 relative',
            isActive
              ? 'text-[#3B82F6]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
          )}
        >
          <span className={cn('relative transition-transform duration-150', isActive && 'scale-110')}>
            {tab.icon}
          </span>
          <span className="transition-opacity duration-150">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);

// ---------------------------------------------------------------------------
// KeyboardShortcutHint — hover shortcut hint badge for nav items
// ---------------------------------------------------------------------------
export interface KeyboardShortcutHintProps {
  shortcut: string;
  className?: string;
}

export const KeyboardShortcutHint: React.FC<KeyboardShortcutHintProps> = ({
  shortcut,
  className,
}) => (
  <kbd className={cn(
    'inline-flex items-center gap-0.5 text-[9px] font-mono font-bold',
    'px-1.5 py-0.5 rounded-md',
    'bg-white/10 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400',
    'border border-white/15 dark:border-slate-700',
    'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
    className,
  )}>
    {shortcut}
  </kbd>
);

// ---------------------------------------------------------------------------
// QuickActionsBar — contextual top-bar actions strip (exported for Dashboard use)
// ---------------------------------------------------------------------------
export interface QuickAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'primary' | 'danger';
  badge?: React.ReactNode;
}

export interface QuickActionsBarProps {
  actions: QuickAction[];
  className?: string;
}

const ACTION_CLS: Record<string, string> = {
  default: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100',
  primary: 'text-[var(--pro-azure)] dark:text-blue-400 hover:bg-[var(--pro-azure-50)] dark:hover:bg-blue-950/30',
  danger:  'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20',
};

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  actions,
  className,
}) => (
  <div className={cn('flex items-center gap-0.5', className)}>
    {actions.map((action) => {
      const cls = cn(
        'group relative flex items-center gap-1.5 px-3 py-2 rounded-lg',
        'text-[12px] font-semibold transition-colors duration-120',
        ACTION_CLS[action.variant ?? 'default'],
      );
      const inner = (
        <>
          {action.icon && <span className="shrink-0">{action.icon}</span>}
          <span>{action.label}</span>
          {action.badge && action.badge}
          {action.shortcut && <KeyboardShortcutHint shortcut={action.shortcut} />}
        </>
      );
      return action.href ? (
        <a key={action.key} href={action.href} className={cls}>{inner}</a>
      ) : (
        <button key={action.key} type="button" onClick={action.onClick} className={cls}>{inner}</button>
      );
    })}
  </div>
);
