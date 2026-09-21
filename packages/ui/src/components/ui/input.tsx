import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from './icon';

/**
 * Input — Ovds SaaS form field primitive.
 *
 * Design:
 *  - 40px height (--input-h), 13px font, white background
 *  - Border: 1px solid var(--border), hover: #94A3B8, focus: var(--pro-azure) + green glow ring
 *  - Error: rose border + glow, Success: green border
 *  - Label: 11px bold uppercase, tracking-wide, text-[var(--text-2)]
 *  - Hint: 11px, var(--text-4)
 *  - Disabled: 60% opacity, not-allowed cursor, subtle bg
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  /** Compact size — 32px height */
  compact?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconClick,
      id,
      compact = false,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? React.useId();
    const errorId = `${inputId}-error`;
    const hintId  = `${inputId}-hint`;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>

        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-bold uppercase tracking-wide select-none"
            style={{ color: 'var(--text-2)', letterSpacing: '0.06em' }}
          >
            {label}
            {required && (
              <span style={{ color: 'var(--pro-rose)', marginLeft: 2 }} aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div
          className={cn(
            'relative flex items-center rounded-lg border transition-all duration-150',
            'bg-white dark:bg-[var(--surface)]',
            error
              ? 'border-rose-400 dark:border-rose-600 shadow-[0_0_0_3px_rgba(244,63,94,0.12)]'
              : 'border-[var(--border)]',
            disabled
              ? 'opacity-55 cursor-not-allowed pointer-events-none bg-[var(--surface-alt)] dark:bg-[var(--surface-alt)]'
              : !error
                ? 'hover:border-[#94A3B8] focus-within:border-[var(--pro-azure)] focus-within:shadow-[0_0_0_3px_rgba(79,186,111,0.18)]'
                : '',
          )}
          style={{ minHeight: compact ? 32 : 40 }}
        >
          {/* Left icon */}
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-4)' }}
            >
              <Icon name={leftIcon as any} size={14} />
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full bg-transparent font-medium outline-none text-[13px]',
              'placeholder:font-normal',
              compact ? 'py-1 text-[12px]' : 'py-2',
              leftIcon  ? 'pl-9'  : 'pl-3',
              rightIcon ? 'pr-9'  : 'pr-3',
            )}
            style={{
              color: 'var(--text)',
              caretColor: 'var(--pro-azure)',
            }}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            {...props}
          />

          {/* Right icon button */}
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              tabIndex={-1}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center',
                'rounded-md p-0.5 transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]',
                onRightIconClick
                  ? 'cursor-pointer hover:bg-[var(--surface-alt)]'
                  : 'pointer-events-none',
              )}
              style={{ color: 'var(--text-4)' }}
              aria-label={rightIcon}
            >
              <Icon name={rightIcon as any} size={14} />
            </button>
          )}
        </div>

        {/* Error / hint */}
        <div className="flex items-start justify-between gap-2">
          {error && (
            <p
              id={errorId}
              role="alert"
              className="text-[10px] font-semibold flex items-center gap-1"
              style={{ color: '#BE123C' }}
            >
              {error}
            </p>
          )}
          {hint && !error && (
            <p
              id={hintId}
              className="text-[10px] font-medium"
              style={{ color: 'var(--text-4)' }}
            >
              {hint}
            </p>
          )}
        </div>

      </div>
    );
  },
);
Input.displayName = 'Input';
