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

/**
 * AppEmpty — Ovds SaaS style empty state.
 * Light grey icon container, dark text, green action button.
 */
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
      <div
        className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}
      >
        {/* Search icon in light card */}
        <div
          className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center mb-3`}
          style={{
            background: 'var(--sys-bg-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--text-4)',
          }}
        >
          <Search size={compact ? 16 : 20} />
        </div>
        <p
          className="font-bold mb-1"
          style={{ fontSize: 13, color: 'var(--text)' }}
        >
          No results found
        </p>
        <p
          className="mb-4 max-w-[240px] leading-relaxed"
          style={{ fontSize: 11, color: 'var(--text-4)' }}
        >
          Try adjusting your search or filters.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors"
            style={{
              background: 'var(--sys-bg-subtle)',
              color: 'var(--text-2)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--border-alt)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-azure)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-subtle)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)';
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}
    >
      {/* Icon container — Ovds SaaS: green-tinted square */}
      <div
        className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-xl flex items-center justify-center mb-5`}
        style={{
          background: 'var(--sys-bg-accent)',
          border: '1px solid var(--sys-border-accent)',
          color: 'var(--pro-azure)',
        }}
      >
        {icon ?? <AlertCircle size={compact ? 20 : 26} />}
      </div>

      <p
        className={`font-bold mb-2 ${compact ? 'text-[13px]' : 'text-[14px]'}`}
        style={{ color: 'var(--text)' }}
      >
        {title}
      </p>

      {description && (
        <p
          className={`mb-5 max-w-[280px] leading-relaxed ${compact ? 'text-[11px]' : 'text-[12px]'}`}
          style={{ color: 'var(--text-4)' }}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-bold text-white transition-all"
          style={{
            background: 'var(--pro-azure)',
            boxShadow: '0 1px 4px rgba(79,186,111,0.30)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure-dark)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(79,186,111,0.38)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(79,186,111,0.30)';
          }}
        >
          {action.icon ?? <Plus size={14} />}
          {action.label}
        </button>
      )}
    </div>
  );
};
