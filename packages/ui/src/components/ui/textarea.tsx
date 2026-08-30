import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id ?? React.useId();
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <label htmlFor={textareaId} className="text-[11px] font-bold text-gray-900 dark:text-slate-300 uppercase tracking-wide">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-ovds border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-200 font-medium transition-all',
            'focus:outline-none focus:border-aki-blue focus:ring-1 focus:ring-aki-blue/20 dark:focus:border-blue-500 dark:focus:ring-blue-500/20',
            error ? 'border-rose-400 dark:border-rose-600' : 'border-slate-200 dark:border-slate-700',
            props.disabled && 'opacity-50 pointer-events-none',
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {(error || hint) && (
          <div className="flex items-center justify-between">
            {error && (
              <p id={`${textareaId}-error`} className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
            {hint && !error && (
              <p id={`${textareaId}-hint`} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
