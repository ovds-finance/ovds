import React, { useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * Textarea — Ovds SaaS multi-line input.
 *
 * Matches Input.tsx exactly:
 *  - Label: 11px bold uppercase, tracking-wide, var(--text-2)
 *  - Border: 1px var(--border), hover: #94A3B8, focus: green glow
 *  - Error: rose border + ARIA role=alert
 *  - Hint: 10px var(--text-4)
 *  - Disabled: 55% opacity, not-allowed cursor
 */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, disabled, required, ...props }, ref) => {
    const textareaId = id ?? useId();
    const errorId    = `${textareaId}-error`;
    const hintId     = `${textareaId}-hint`;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>

        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-bold uppercase tracking-wide select-none"
            style={{ color: 'var(--text-2)', letterSpacing: '0.06em' }}
          >
            {label}
            {required && (
              <span style={{ color: 'var(--pro-rose)', marginLeft: 2 }} aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          className="w-full rounded-lg px-3 py-2.5 text-[13px] font-medium outline-none resize-y transition-all duration-150"
          style={{
            background:  disabled ? 'var(--surface-alt)' : 'var(--surface)',
            border:      `1px solid ${error ? 'var(--pro-rose)' : 'var(--border)'}`,
            color:       'var(--text)',
            lineHeight:  1.55,
            minHeight:   88,
            opacity:     disabled ? 0.55 : 1,
            cursor:      disabled ? 'not-allowed' : 'text',
            boxShadow:   error ? '0 0 0 3px rgba(244,63,94,0.12)' : 'none',
            caretColor:  'var(--pro-azure)',
          }}
          onFocus={e => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--pro-azure)';
              e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(79,186,111,0.18)';
            }
          }}
          onBlur={e => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow   = 'none';
            }
          }}
          onMouseEnter={e => {
            const el = e.currentTarget;
            if (document.activeElement !== el && !error)
              el.style.borderColor = '#94A3B8';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget;
            if (document.activeElement !== el && !error)
              el.style.borderColor = 'var(--border)';
          }}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />

        {/* Error / hint */}
        {error && (
          <p id={errorId} role="alert" className="text-[10px] font-semibold" style={{ color: '#BE123C' }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-[10px] font-medium" style={{ color: 'var(--text-4)' }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
