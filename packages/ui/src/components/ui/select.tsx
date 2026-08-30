import React, { useState, useRef, useEffect, ReactElement, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  children?: ReactNode;
}

function getOptionLabelFromChildren(child: ReactElement<any>): string {
  const textContent = child.props?.children;
  if (typeof textContent === 'string') return textContent;
  if (Array.isArray(textContent)) return textContent.filter(Boolean).join('');
  return String(textContent ?? '');
}

interface ChildOptionProps {
  value?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, value, onValueChange, onChange, label, placeholder = 'Select...', error, disabled, className, searchable = false, children }, ref) => {
    const handleChange = onChange ?? onValueChange;
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearch('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (open && searchable) inputRef.current?.focus();
    }, [open, searchable]);

    const useOptions = options && options.length > 0;
    const useChildren = !useOptions && children;

    const selected = useOptions
      ? options.find((o) => o.value === value)
      : useChildren && React.Children.count(children) > 0
        ? React.Children.toArray(children).find((child: any) => child.props?.value === value) as ReactElement<ChildOptionProps> | undefined
        : null;

    const filtered = useOptions
      ? (searchable && search.trim()
          ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
          : options)
      : null;

    const renderDropdownItems = () => {
      if (useOptions && filtered) {
        return filtered.map((option) => (
          <button
            key={option.value}
            role="option"
            aria-selected={value === option.value}
            disabled={option.disabled}
            onClick={() => {
              handleChange?.(option.value);
              setOpen(false);
              setSearch('');
            }}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-[12px] text-left transition-colors',
              value === option.value
                ? 'bg-aki-blue-50 dark:bg-blue-950/30 text-aki-blue dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
              option.disabled && 'opacity-50 pointer-events-none',
            )}
          >
            <span className="truncate pr-4">{option.label}</span>
            {value === option.value && <Check size={12} className="shrink-0" />}
          </button>
        ));
      }

      if (useChildren) {
        return React.Children.map(children, (child: any) => {
          if (!React.isValidElement(child)) return null;
          const optionValue = (child.props as ChildOptionProps)?.value;
          if (!optionValue) return null;
          const isSelected = value === optionValue;
          return (
            <button
              role="option"
              aria-selected={isSelected}
              disabled={(child.props as ChildOptionProps)?.disabled}
              onClick={() => {
                handleChange?.(optionValue);
                setOpen(false);
                setSearch('');
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-[12px] text-left transition-colors',
                isSelected
                  ? 'bg-aki-blue-50 dark:bg-blue-950/30 text-aki-blue dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                (child.props as ChildOptionProps)?.disabled && 'opacity-50 pointer-events-none',
              )}
            >
              <span className="truncate pr-4">{getOptionLabelFromChildren(child)}</span>
              {isSelected && <Check size={12} className="shrink-0" />}
            </button>
          );
        });
      }

      return (
        <div className="px-3 py-4 text-[11px] text-slate-400 text-center">No options found</div>
      );
    };

    const hasOptions = useOptions || (useChildren && React.Children.count(children) > 0);

    const selectedLabel = useOptions
      ? (selected as SelectOption | null)?.label
      : useChildren && selected
        ? getOptionLabelFromChildren(selected as ReactElement<ChildOptionProps>)
        : undefined;

    return (
      <div className={cn('flex flex-col gap-1', className)} ref={containerRef}>
        {label && <span className="text-[11px] font-bold text-gray-900 dark:text-slate-300 uppercase tracking-wide">{label}</span>}
        <button
          ref={ref}
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            'flex items-center justify-between rounded-ovds border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-left transition-all',
            error ? 'border-rose-400 dark:border-rose-600' : 'border-slate-200 dark:border-slate-700 focus-within:border-aki-blue',
            disabled && 'opacity-50 pointer-events-none',
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={cn(!selected && 'text-slate-400')}>
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown size={14} className="text-slate-400 shrink-0 transition-transform" />
        </button>

        {open && (
          <div className="relative z-50">
            <div className="absolute top-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-ovds shadow-xl shadow-slate-900/10 dark:shadow-slate-900/30 max-h-60 overflow-hidden flex flex-col">
              {searchable && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aki-blue/20"
                  />
                </div>
              )}
              <div className="overflow-y-auto max-h-52 py-1" role="listbox">
                {hasOptions ? renderDropdownItems() : (
                  <div className="px-3 py-4 text-[11px] text-slate-400 text-center">No options found</div>
                )}
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
