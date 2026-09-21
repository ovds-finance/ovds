import React, { useId } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Checkbox — Ovds SaaS.
 *
 * Design:
 *  - Checked: --pro-azure fill + border, white checkmark
 *  - Indeterminate: --pro-azure fill + border, white minus
 *  - Unchecked: white bg, 1.5px var(--border) border
 *  - Hover (unchecked): border → #94A3B8
 *  - Focus ring: 2px var(--pro-azure) ring + 2px offset
 *  - Disabled: 45% opacity, not-allowed cursor
 *  - Label: 12px font-medium var(--text-2), clickable
 *  - Description: 10px var(--text-4)
 */

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, indeterminate, disabled, ...props }, ref) => {
    const checkId = id ?? useId();
    const isOn    = !!checked;

    return (
      <div className={cn('flex items-start gap-2.5', className)}>
        {/* Hidden native input for form compatibility */}
        <div className="relative flex items-center shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkId}
            checked={isOn}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          {/* Visual indicator */}
          <div
            aria-hidden="true"
            className={cn(
              'w-4 h-4 rounded flex items-center justify-center transition-all duration-150 shrink-0',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--pro-azure)] peer-focus-visible:ring-offset-2',
              disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer',
            )}
            style={{
              background: isOn || indeterminate ? 'var(--pro-azure)' : 'var(--surface)',
              border:     `1.5px solid ${isOn || indeterminate ? 'var(--pro-azure)' : 'var(--border)'}`,
              boxShadow:  isOn || indeterminate ? '0 1px 3px rgba(79,186,111,0.25)' : 'none',
            }}
          >
            {indeterminate
              ? <Minus size={9} color="#fff" strokeWidth={3} />
              : isOn
                ? <Check size={9} color="#fff" strokeWidth={3} />
                : null
            }
          </div>
        </div>

        {/* Labels */}
        {(label || description) && (
          <div className="flex flex-col leading-tight min-w-0">
            {label && (
              <label
                htmlFor={checkId}
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
Checkbox.displayName = 'Checkbox';
