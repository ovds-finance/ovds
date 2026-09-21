import React, { useCallback, useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * Switch — Ovds SaaS toggle.
 *
 * Design:
 *  - ON:  --pro-azure track, white thumb, green focus ring
 *  - OFF: var(--border) track, white thumb
 *  - Thumb: 14×14px, 2px travel margin, 200ms cubic-bezier spring
 *  - Focus ring: 2px --pro-azure + 2px offset on the button
 *  - Disabled: 45% opacity, not-allowed cursor
 *  - Label: 12px var(--text-2), clickable for the switch
 *  - Description: 10px var(--text-4)
 */

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, checked, onChange, disabled, ...props }, ref) => {
    const switchId = id ?? useId();

    const handleClick = useCallback(() => {
      if (disabled) return;
      onChange?.({ target: { checked: !checked } } as React.ChangeEvent<HTMLInputElement>);
    }, [disabled, checked, onChange]);

    return (
      <div className={cn('flex items-center gap-2.5', className)}>
        {/* Toggle button */}
        <button
          type="button"
          role="switch"
          aria-checked={!!checked}
          id={switchId}
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-2',
            'disabled:opacity-45 disabled:cursor-not-allowed',
          )}
          style={{
            background: checked ? 'var(--pro-azure)' : 'var(--border)',
            border:     checked ? '1px solid var(--pro-azure)' : '1px solid var(--border)',
            boxShadow:  checked ? '0 1px 4px rgba(79,186,111,0.30)' : 'none',
          }}
        >
          {/* Thumb */}
          <span
            aria-hidden="true"
            className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm"
            style={{
              transition: 'transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow:  '0 1px 3px rgba(0,0,0,0.18)',
              display:    'block',
              position:   'absolute',
              top:        '50%',
              transform:  `translateX(${checked ? 18 : 2}px) translateY(-50%)`,
            } as React.CSSProperties}
          />
        </button>

        {/* Hidden native input for form compatibility */}
        <input
          ref={ref}
          type="checkbox"
          id={`${switchId}-native`}
          checked={!!checked}
          onChange={onChange ?? (() => {})}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...props}
        />

        {/* Labels */}
        {(label || description) && (
          <div className="flex flex-col leading-tight min-w-0">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  'text-[12px] font-medium leading-tight',
                  disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer',
                )}
                style={{ color: 'var(--text-2)' }}
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);
Switch.displayName = 'Switch';
