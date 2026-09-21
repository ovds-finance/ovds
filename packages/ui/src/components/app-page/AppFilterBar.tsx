import React from 'react';

/**
 * AppFilterBar — Ovds SaaS style chip filter row.
 *
 * Active chip: --pro-azure fill (green), white text.
 * Idle chip: white card with border, hover → green tint.
 */

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  color?: string;
}

export interface AppFilterBarProps {
  chips: FilterChip[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const AppFilterBar: React.FC<AppFilterBarProps> = ({ chips, active, onChange, className }) => (
  <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ''}`}>
    {chips.map((chip) => {
      const isActive = active === chip.id;
      return (
        <button
          key={chip.id}
          onClick={() => onChange(chip.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1"
          style={
            isActive
              ? {
                  background: 'var(--pro-azure)',
                  color: '#fff',
                  border: '1px solid var(--pro-azure)',
                  boxShadow: '0 1px 4px rgba(79,186,111,0.30)',
                }
              : {
                  background: 'var(--surface)',
                  color: 'var(--text-3)',
                  border: '1px solid var(--border)',
                }
          }
          onMouseEnter={e => {
            if (!isActive) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure-50)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--pro-azure-100)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-azure-dark)';
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
            }
          }}
        >
          {chip.color && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: isActive ? 'rgba(255,255,255,0.7)' : chip.color }}
            />
          )}
          {chip.label}
          {chip.count !== undefined && (
            <span
              className="px-1.5 rounded-full text-[9px] font-bold leading-none"
              style={
                isActive
                  ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                  : { background: 'var(--surface-alt)', color: 'var(--text-4)' }
              }
            >
              {chip.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
