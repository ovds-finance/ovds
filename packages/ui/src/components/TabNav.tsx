/**
 * TabNav — Ovds SaaS tab navigation.
 *
 * Variants:
 *   'underline' — bottom border indicator, green active (Ovds SaaS default)
 *   'pills'     — filled round pill, green active
 *   'boxed'     — segmented control, white active card
 *
 * All variants use var(--pro-azure) as the single active-state colour.
 * Focus ring: 2px var(--pro-azure) on all tab buttons.
 */
import React, { useCallback } from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export type TabNavVariant = 'underline' | 'pills' | 'boxed';

export interface TabNavProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  variant?: TabNavVariant;
  size?: 'sm' | 'md';
  className?: string;
  stretch?: boolean;
}

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1';

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
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(key); }
    },
    [onChange],
  );

  /* ── Underline ─────────────────────────────────────────────────── */
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-0 overflow-x-auto scrollbar-none ${className}`}
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {tabs.map(tab => {
          const isActive = tab.key === active;
          const textSz   = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
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
                textSz, pad, FOCUS,
                isActive
                  ? 'border-[var(--pro-azure)] text-[var(--text)]'
                  : 'border-transparent text-[var(--text-4)] hover:text-[var(--text-2)] hover:border-[var(--border)]',
                tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
                stretch ? 'flex-1 justify-center' : '',
              ].filter(Boolean).join(' ')}
            >
              {tab.icon && (
                <span style={{ color: isActive ? 'var(--pro-azure)' : 'var(--text-4)' }}>
                  {tab.icon}
                </span>
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={
                    isActive
                      ? { background: 'var(--pro-azure-50)', color: 'var(--pro-azure-dark)' }
                      : { background: 'var(--surface-alt)', color: 'var(--text-4)' }
                  }
                >
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

  /* ── Pills ─────────────────────────────────────────────────────── */
  if (variant === 'pills') {
    return (
      <div role="tablist" className={`flex items-center gap-1 flex-wrap ${className}`}>
        {tabs.map(tab => {
          const isActive = tab.key === active;
          const textSz   = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
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
                'flex items-center gap-1.5 rounded-full font-semibold transition-all duration-150',
                textSz, pad, FOCUS,
                'active:scale-[0.97]',
                isActive
                  ? 'bg-[var(--pro-azure)] text-white shadow-sm shadow-[var(--pro-azure)]/25'
                  : 'text-[var(--text-4)] hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]',
                tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
                stretch ? 'flex-1 justify-center' : '',
              ].filter(Boolean).join(' ')}
              style={!isActive ? { background: 'var(--surface-alt)', border: '1px solid var(--border)' } : undefined}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="px-1.5 rounded-full text-[9px] font-bold"
                  style={
                    isActive
                      ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                      : { background: 'var(--surface)', color: 'var(--text-4)' }
                  }
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Boxed / segmented ─────────────────────────────────────────── */
  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${className}`}
      style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-alt)' }}
    >
      {tabs.map(tab => {
        const isActive = tab.key === active;
        const textSz   = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
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
              'flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-150',
              textSz, pad, FOCUS,
              'active:scale-[0.97]',
              isActive
                ? 'shadow-sm'
                : 'hover:bg-[var(--surface)]',
              tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
              stretch ? 'flex-1 justify-center' : '',
            ].filter(Boolean).join(' ')}
            style={
              isActive
                ? { background: 'var(--surface)', color: 'var(--pro-azure)', border: '1px solid var(--pro-azure-100)' }
                : { background: 'transparent', color: 'var(--text-4)' }
            }
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="px-1.5 rounded-full text-[9px] font-bold"
                style={{ background: 'var(--border)', color: 'var(--text-4)' }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
