import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id ?? React.useId();
    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex items-center pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-4 w-4 rounded border-2 flex items-center justify-center transition-all shrink-0',
              props.checked
                ? 'bg-aki-blue border-aki-blue text-white'
                : 'border-slate-300 dark:border-slate-600 peer-focus-visible:ring-2 peer-focus-visible:ring-aki-blue/30 peer-focus-visible:ring-offset-2',
            )}
          >
            {props.checked && <Check size={10} />}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label htmlFor={checkboxId} className="text-[12px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
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
Checkbox.displayName = 'Checkbox';
