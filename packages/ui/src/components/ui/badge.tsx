import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Badge — Ovds SaaS status pill.
 *
 * Design:
 *  - default: --pro-azure fill (Ovds SaaS green), white text
 *  - secondary: neutral slate tint
 *  - destructive: rose tint
 *  - outline: border only, no fill
 *  - success (alias indigo): --pro-azure-50 bg, --pro-azure-dark text
 *  - warning: amber tint
 *  - error: rose solid
 *  - info: sky tint
 *  - purple: violet tint
 *  - Focus ring: 2px --pro-azure
 */

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap',
    'transition-colors duration-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] focus-visible:ring-offset-1',
  ].join(' '),
  {
    variants: {
      variant: {
        /** Ovds SaaS signature green */
        default:
          'border-[var(--pro-azure)] bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] hover:border-[var(--pro-azure-dark)]',

        /** Neutral secondary */
        secondary:
          'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-3)] hover:bg-[var(--border)]',

        /** Soft destructive */
        destructive:
          'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400',

        /** Border-only */
        outline:
          'border-[var(--border)] bg-transparent text-[var(--text-3)] hover:bg-[var(--surface-alt)]',

        /** Success = Ovds SaaS green tint */
        success:
          'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',

        /** Alias for success */
        indigo:
          'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',

        /** Warning */
        warning:
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',

        /** Solid error */
        error:
          'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400',

        /** Info */
        info:
          'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400',

        /** Purple / AI */
        purple:
          'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-400',

        /** Neutral grey */
        gray:
          'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-3)]',

        /** Amber alias */
        amber:
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',

        /** Sky alias */
        sky:
          'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400',

        /** Rose alias */
        rose:
          'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400',
      },
      size: {
        xs:      'px-1.5 py-0.5 text-[9px]',
        sm:      'px-2   py-0.5 text-[10px]',
        default: 'px-2.5 py-0.5 text-[11px]',
        lg:      'px-3   py-1   text-[12px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { badgeVariants };
