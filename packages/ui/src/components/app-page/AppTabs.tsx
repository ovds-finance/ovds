import React, { useRef, useEffect } from 'react';
import { BORDER_COLOR, COLOR_VALUE, ACCENT_BG, ACCENT_COUNT_BG } from './tokens';

export interface AppTabItem {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  badge?: string;
  badgeCls?: string;
  disabled?: boolean;
}

export interface AppTabsProps {
  tabs: AppTabItem[];
  active: string;
  onChange: (key: string) => void;
  accent?: keyof typeof BORDER_COLOR;
}

export const AppTabs: React.FC<AppTabsProps> = ({ tabs, active, onChange, accent = 'indigo' }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active]);

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const enabled = tabs.filter((t) => !t.disabled);
    const cur = enabled.findIndex((t) => t.key === tabs[idx].key);
    if (e.key === 'ArrowRight') {
      const next = enabled[(cur + 1) % enabled.length];
      onChange(next.key);
    } else if (e.key === 'ArrowLeft') {
      const prev = enabled[(cur - 1 + enabled.length) % enabled.length];
      onChange(prev.key);
    }
  };

  const accentBorder    = BORDER_COLOR[accent] ?? 'border-[var(--pro-azure)]';
  const accentText      = COLOR_VALUE[accent]  ?? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]';
  const accentBg        = ACCENT_BG[accent]    ?? 'bg-[var(--pro-azure-50)]/40 dark:bg-[var(--pro-azure-50)]/10';
  const accentCountBg   = ACCENT_COUNT_BG[accent] ?? 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]/20';

  return (
    <div ref={listRef} className="flex items-center gap-0 overflow-x-auto scrollbar-none" role="tablist">
      {tabs.map((tab, idx) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !tab.disabled && onChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-semibold',
              'border-b-2 whitespace-nowrap transition-all duration-150 shrink-0',
              /* Ovds SaaS green focus ring */
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]/30 focus-visible:ring-inset',
              tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              isActive
                ? `${accentBorder} ${accentText} ${accentBg}`
                : 'border-transparent hover:border-[var(--border)]',
            ].join(' ')}
            style={!isActive ? { color: 'var(--text-4)' } : undefined}
            onMouseEnter={!isActive ? (e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; } : undefined}
            onMouseLeave={!isActive ? (e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)'; } : undefined}
          >
            {tab.icon && (
              <span className={`transition-colors ${isActive ? (COLOR_VALUE[accent] ?? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]') : 'text-slate-400 dark:text-slate-500'}`}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none transition-colors ${
                isActive ? `${accentCountBg} ${accentText}` : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count > 9999 ? '9999+' : tab.count}
              </span>
            )}
            {tab.badge && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide ${tab.badgeCls ?? ''}`}
                style={!tab.badgeCls ? { background: 'var(--pro-azure-100)', color: 'var(--pro-azure-dark)' } : undefined}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
