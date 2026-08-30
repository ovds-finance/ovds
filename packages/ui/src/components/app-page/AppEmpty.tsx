import React from 'react';
import { AlertCircle, Plus, Search } from 'lucide-react';

export interface AppEmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  compact?: boolean;
  filtered?: boolean;
  onClearFilters?: () => void;
}

export const AppEmpty: React.FC<AppEmptyProps> = ({
  icon,
  title,
  description,
  action,
  compact,
  filtered,
  onClearFilters,
}) => {
  if (filtered) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-3">
          <Search size={18} />
        </div>
        <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300 mb-1">No results found</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 max-w-[240px] leading-relaxed">
          Try adjusting your search or filters.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[12px] font-semibold transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
      <div
        className={`rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-400 dark:text-emerald-500 mb-5 shadow-sm ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}
      >
        {icon ?? <AlertCircle size={compact ? 20 : 26} />}
      </div>
      <p className={`font-bold text-slate-700 dark:text-slate-200 mb-2 ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
        {title}
      </p>
      {description && (
        <p className={`text-slate-400 dark:text-slate-500 mb-5 max-w-[280px] leading-relaxed ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[12px] font-bold transition-all shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/25"
        >
          {action.icon ?? <Plus size={14} />}
          {action.label}
        </button>
      )}
    </div>
  );
};
