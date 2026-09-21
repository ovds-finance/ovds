import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * AppSearch — Ovds SaaS style search input.
 *
 * Focus ring: 3px indigo glow (rgba(79,186,111,0.18)) + indigo border.
 * Magnifier icon turns green on focus.
 */

export interface AppSearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const AppSearch: React.FC<AppSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  autoFocus,
}) => (
  <div className={`relative ${className ?? ''}`}>
    {/* Magnifier */}
    <Search
      size={13}
      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-100"
      style={{ color: 'var(--text-4)' }}
    />

    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      type="search"
      className="w-full pl-8 pr-7 py-2 rounded-lg text-[12px] font-medium outline-none transition-all duration-150"
      style={{
        height: 36,
        background: 'var(--sys-bg-subtle)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        caretColor: 'var(--pro-azure)',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = 'var(--pro-azure)';
        e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(79,186,111,0.18)';
        e.currentTarget.style.background  = 'var(--surface)';
        const icon = e.currentTarget.previousElementSibling as SVGElement | null;
        if (icon) icon.style.color = 'var(--pro-azure)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow   = 'none';
        e.currentTarget.style.background  = 'var(--sys-bg-subtle)';
        const icon = e.currentTarget.previousElementSibling as SVGElement | null;
        if (icon) icon.style.color = 'var(--text-4)';
      }}
    />

    {/* Clear button */}
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded transition-colors"
        style={{ color: 'var(--text-4)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
        aria-label="Clear search"
      >
        <X size={12} />
      </button>
    )}
  </div>
);
