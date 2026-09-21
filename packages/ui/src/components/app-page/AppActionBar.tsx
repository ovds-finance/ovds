import React from 'react';
import { X } from 'lucide-react';

export interface AppActionBarProps {
  count: number;
  label?: string;
  actions: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
  onClear: () => void;
}

/**
 * AppActionBar — Ovds SaaS style bulk-action floating bar.
 * Uses white/light surface instead of dark slate-900 for a cleaner look.
 */
export const AppActionBar: React.FC<AppActionBarProps> = ({
  count, label = 'selected', actions, onClear,
}) => {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Count chip */}
        <span
          className="text-[12px] font-semibold"
          style={{ color: 'var(--text-3)' }}
        >
          <span className="font-bold" style={{ color: 'var(--pro-azure)' }}>{count}</span>
          {' '}{label}
        </span>

        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        {/* Action buttons */}
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: a.danger ? 'var(--sys-state-critical)' : 'var(--sys-bg-subtle)',
              color: a.danger ? 'var(--pro-rose)' : 'var(--text-2)',
              border: a.danger ? '1px solid var(--sys-state-critical-border)' : '1px solid var(--border)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.80';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}

        {/* Clear */}
        <button
          onClick={onClear}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all ml-1"
          style={{ color: 'var(--text-4)', background: 'transparent' }}
          aria-label="Clear selection"
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-subtle)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
