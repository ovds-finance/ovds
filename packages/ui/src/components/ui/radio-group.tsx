import React from 'react';
import { cn } from '../../lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onValueChange,
  label,
  name,
  disabled,
  className,
  orientation = 'vertical',
}) => (
  <div className={cn('flex flex-col gap-2', orientation === 'horizontal' && 'flex-row flex-wrap gap-4', className)}>
    {label && <span className="text-[11px] font-bold text-gray-900 dark:text-slate-300 uppercase tracking-wide">{label}</span>}
    {options.map((option) => (
      <label
        key={option.value}
        className={cn(
          'flex items-center gap-3 cursor-pointer transition-colors',
          disabled || option.disabled ? 'opacity-50 pointer-events-none' : '',
        )}
      >
        <div className="relative flex items-center">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onValueChange(option.value)}
            disabled={disabled || option.disabled}
            className="peer sr-only"
          />
          <div
            className={cn(
              'h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
              value === option.value
                ? 'border-[var(--pro-azure)]'
                : 'border-slate-300 dark:border-slate-600 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--pro-azure)]/30 peer-focus-visible:ring-offset-2',
            )}
          >
            {value === option.value && <div className="h-2 w-2 rounded-full bg-[var(--pro-azure)]" />}
          </div>
        </div>
        <span className={cn('text-[12px] font-medium', value === option.value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400')}>
          {option.label}
        </span>
      </label>
    ))}
  </div>
);
