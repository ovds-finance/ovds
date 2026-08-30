import React, { useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, checked, onChange, ...props }, ref) => {
    const switchId = id ?? React.useId();
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
    }, [onChange]);

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          id={switchId}
          onClick={() => onChange?.({ target: { checked: !checked } } as any)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aki-blue/30 focus-visible:ring-offset-2',
            checked ? 'bg-aki-blue' : 'bg-slate-200 dark:bg-slate-700',
          )}
        >
          <span
            className={cn(
              'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200',
              checked ? 'translate-x-[18px]' : 'translate-x-0.5',
            )}
          />
        </button>
        <input
          ref={ref}
          type="checkbox"
          id={`${switchId}-native`}
          checked={checked}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col leading-tight">
            {label && (
              <label htmlFor={switchId} className="text-[12px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);
Switch.displayName = 'Switch';
