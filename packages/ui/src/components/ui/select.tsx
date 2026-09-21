import React, { useState, useRef, useEffect, ReactElement, ReactNode, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Select — Ovds SaaS custom dropdown.
 *
 * Design:
 *  - Trigger: 40px height, white bg, 1px border, 8px radius
 *  - Focus: indigo glow ring (rgba(79,186,111,0.18)) + indigo border
 *  - Dropdown: white card, 8px radius, card-shadow-raised, animate-aki-enter
 *  - Active option: --pro-azure-50 bg, --pro-azure text, green checkmark
 *  - Hover option: --sys-bg-subtle bg
 *  - Search: green focus ring, magnifier icon
 *  - Label: 11px bold uppercase (matches Input)
 *  - Error: rose border + message
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options?: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  children?: ReactNode;
  required?: boolean;
}

interface ChildOptionProps {
  value?: string;
  disabled?: boolean;
  children?: ReactNode;
}

function childLabel(child: ReactElement<any>): string {
  const c = child.props?.children;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.filter(Boolean).join('');
  return String(c ?? '');
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options, value, onValueChange, onChange, label, placeholder = 'Select…',
      error, hint, disabled, className, searchable = false, children, required,
    },
    ref,
  ) => {
    const handleChange = onChange ?? onValueChange;
    const [open,   setOpen]   = useState(false);
    const [search, setSearch] = useState('');
    const containerRef  = useRef<HTMLDivElement>(null);
    const searchRef     = useRef<HTMLInputElement>(null);
    const labelId       = useId();
    const listId        = useId();
    const errorId       = useId();

    /* ── Close on outside click ─────────────────────────────────────── */
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearch('');
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    /* ── Close on Escape ─────────────────────────────────────────────── */
    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { setOpen(false); setSearch(''); }
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }, [open]);

    useEffect(() => {
      if (open && searchable) requestAnimationFrame(() => searchRef.current?.focus());
    }, [open, searchable]);

    const useOptions  = !!(options && options.length > 0);
    const useChildren = !useOptions && !!children;

    /* Selected label resolution */
    const selectedLabel = useOptions
      ? options!.find(o => o.value === value)?.label
      : useChildren
        ? (() => {
            const found = React.Children.toArray(children).find(
              (c: any) => c?.props?.value === value,
            ) as ReactElement<ChildOptionProps> | undefined;
            return found ? childLabel(found) : undefined;
          })()
        : undefined;

    /* Filtered options */
    const filtered = useOptions && searchable && search.trim()
      ? options!.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
      : options ?? [];

    /* ── Render dropdown rows ─────────────────────────────────────────── */
    const renderRows = () => {
      if (useOptions) {
        const rows = filtered.length > 0 ? filtered : options!;
        return rows.length === 0
          ? <div className="px-3 py-4 text-[11px] text-center" style={{ color: 'var(--text-4)' }}>No options</div>
          : rows.map(opt => (
              <button
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                disabled={opt.disabled}
                onClick={() => { handleChange?.(opt.value); setOpen(false); setSearch(''); }}
                className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors duration-100 disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none"
                style={
                  value === opt.value
                    ? { background: 'var(--pro-azure-50)', color: 'var(--pro-azure-dark)' }
                    : { background: 'transparent', color: 'var(--text-2)' }
                }
                onMouseEnter={e => {
                  if (value !== opt.value)
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-subtle)';
                }}
                onMouseLeave={e => {
                  if (value !== opt.value)
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span className="truncate pr-3">{opt.label}</span>
                {value === opt.value && (
                  <Check size={12} style={{ color: 'var(--pro-azure)', flexShrink: 0 }} />
                )}
              </button>
            ));
      }

      if (useChildren) {
        return React.Children.map(children, (child: any) => {
          if (!React.isValidElement(child)) return null;
          const optValue = (child.props as ChildOptionProps)?.value;
          if (!optValue) return null;
          const isSelected = value === optValue;
          return (
            <button
              role="option"
              aria-selected={isSelected}
              disabled={(child.props as ChildOptionProps)?.disabled}
              onClick={() => { handleChange?.(optValue); setOpen(false); setSearch(''); }}
              className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors duration-100 disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none"
              style={
                isSelected
                  ? { background: 'var(--pro-azure-50)', color: 'var(--pro-azure-dark)' }
                  : { background: 'transparent', color: 'var(--text-2)' }
              }
              onMouseEnter={e => {
                if (!isSelected)
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-subtle)';
              }}
              onMouseLeave={e => {
                if (!isSelected)
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <span className="truncate pr-3">{childLabel(child)}</span>
              {isSelected && <Check size={12} style={{ color: 'var(--pro-azure)', flexShrink: 0 }} />}
            </button>
          );
        });
      }

      return <div className="px-3 py-4 text-[11px] text-center" style={{ color: 'var(--text-4)' }}>No options</div>;
    };

    return (
      <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef}>

        {/* Label */}
        {label && (
          <label
            id={labelId}
            className="block text-[11px] font-bold uppercase tracking-wide select-none"
            style={{ color: 'var(--text-2)', letterSpacing: '0.06em' }}
          >
            {label}
            {required && <span style={{ color: 'var(--pro-rose)', marginLeft: 2 }} aria-hidden="true">*</span>}
          </label>
        )}

        {/* Trigger button */}
        <button
          ref={ref}
          type="button"
          onClick={() => !disabled && setOpen(v => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? labelId : undefined}
          aria-controls={open ? listId : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="flex items-center justify-between rounded-lg text-[13px] font-medium text-left transition-all duration-150 outline-none disabled:opacity-55 disabled:pointer-events-none"
          style={{
            height: 40,
            padding: '0 12px',
            background: 'var(--surface)',
            border: `1px solid ${error ? 'var(--pro-rose)' : open ? 'var(--pro-azure)' : 'var(--border)'}`,
            boxShadow: open
              ? '0 0 0 3px rgba(79,186,111,0.18)'
              : error
                ? '0 0 0 3px rgba(244,63,94,0.12)'
                : 'none',
            color: selectedLabel ? 'var(--text)' : 'var(--text-5)',
          }}
          onMouseEnter={e => {
            if (!open && !error && !disabled)
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#94A3B8';
          }}
          onMouseLeave={e => {
            if (!open && !error)
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }}
        >
          <span className="truncate flex-1">{selectedLabel ?? placeholder}</span>
          <ChevronDown
            size={14}
            style={{
              flexShrink: 0,
              marginLeft: 8,
              color: 'var(--text-4)',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 150ms',
            }}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="relative z-50">
            <div
              id={listId}
              role="listbox"
              aria-labelledby={label ? labelId : undefined}
              className="absolute top-1 left-0 right-0 flex flex-col overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: 'var(--card-shadow-raised)',
                animation: 'aki-enter 150ms cubic-bezier(0.16,1,0.3,1) both',
                maxHeight: 280,
              }}
            >
              {/* Search */}
              {searchable && (
                <div
                  className="p-2 shrink-0"
                  style={{ borderBottom: '1px solid var(--border-alt)' }}
                >
                  <div className="relative">
                    <Search
                      size={12}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-4)' }}
                    />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full pl-7 pr-7 py-1.5 rounded-md text-[12px] font-medium outline-none transition-all"
                      style={{
                        background: 'var(--sys-bg-subtle)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'var(--pro-azure)';
                        e.currentTarget.style.boxShadow  = '0 0 0 3px rgba(79,186,111,0.18)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow  = 'none';
                      }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-4)' }}
                        aria-label="Clear search"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Options list */}
              <div className="overflow-y-auto py-1">
                {renderRows()}
              </div>
            </div>
          </div>
        )}

        {/* Error / hint */}
        {error && (
          <p id={errorId} role="alert" className="text-[10px] font-semibold" style={{ color: '#BE123C' }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-4)' }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
