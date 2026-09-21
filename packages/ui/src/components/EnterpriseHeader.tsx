import React from 'react';
import { Search, Plus, Command } from 'lucide-react';
import { Icon } from './ui/icon';
import { cn } from '../lib/utils';

export interface EnterpriseHeaderProps {
  /** Quick-add actions rendered in the right cluster */
  quickActions?: React.ReactNode;
  /** Show search input */
  searchable?: boolean;
  onSearch?: (query: string) => void;
  /** Show command palette shortcut hint */
  showCommandHint?: boolean;
  onCommandPalette?: () => void;
  /** Extra toolbar actions */
  toolbar?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  quickActions,
  searchable = true,
  onSearch,
  showCommandHint = true,
  onCommandPalette,
  toolbar,
  className,
  children,
}) => {
  return (
    <header
      className={cn(
        'h-12 shrink-0 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3',
        'bg-white dark:bg-slate-950',
        className,
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {searchable && (
          <div className="relative max-w-md flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Search commands, records..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all"
            />
          </div>
        )}
        {children}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {toolbar}
        {quickActions && <div className="flex items-center gap-1.5">{quickActions}</div>}
        {showCommandHint && onCommandPalette && (
          <button
            onClick={onCommandPalette}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] transition-all"
          >
            <Command size={12} />
            <span>K</span>
          </button>
        )}
      </div>
    </header>
  );
};
