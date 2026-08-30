import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './icon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, onRightIconClick, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-bold text-gray-900 dark:text-slate-300 uppercase tracking-wide">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div
          className={cn(
            'flex items-center rounded-ovds border bg-white dark:bg-slate-900 transition-all',
            error
              ? 'border-rose-400 dark:border-rose-600'
              : 'border-slate-200 dark:border-slate-700 focus-within:border-aki-blue focus-within:ring-1 focus-within:ring-aki-blue/20 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/20',
            props.disabled && 'opacity-50 pointer-events-none',
          )}
        >
          {leftIcon && (
            <span className="pl-3 pr-2 text-slate-400 dark:text-slate-500">
              <Icon name={leftIcon as any} size={16} />
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full px-3 py-2 bg-transparent text-sm text-gray-900 dark:text-slate-200 font-medium',
              'focus:outline-none',
              leftIcon && 'pl-2',
              rightIcon && 'pr-2',
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="pr-3 pl-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Icon name={rightIcon as any} size={16} />
            </button>
          )}
        </div>
        {(error || hint) && (
          <div className="flex items-center justify-between">
            {error && (
              <p id={`${inputId}-error`} className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
            {hint && !error && (
              <p id={`${inputId}-hint`} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
