/**
 * VVWizardHeader — Smart Wizard Header for the V&V process.
 *
 * A clear, numbered horizontal tracker (Details → Validate → Confirm) showing
 * exactly where the user is in the Verification & Validation flow. Completed
 * steps are emerald; the current step is emphasised; upcoming steps are muted.
 */
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { VVStepId } from './validate';

export interface VVWizardStep {
  id: VVStepId;
  label: string;
  description?: string;
}

export interface VVWizardHeaderProps {
  steps: VVWizardStep[];
  currentIndex: number;
  /** Error count per step index — shows a rose badge so users know where to fix */
  errorCounts?: Record<number, number>;
  onStepClick?: (index: number) => void;
  className?: string;
}

const statusOf = (i: number, current: number): 'complete' | 'current' | 'upcoming' =>
  i < current ? 'complete' : i === current ? 'current' : 'upcoming';

export const VVWizardHeader: React.FC<VVWizardHeaderProps> = ({
  steps,
  currentIndex,
  errorCounts,
  onStepClick,
  className,
}) => (
  <nav
    aria-label="Verification and validation steps"
    className={cn('w-full', className)}
  >
    <ol className="flex items-center w-full">
      {steps.map((step, i) => {
        const status = statusOf(i, currentIndex);
        const clickable = status === 'complete' && !!onStepClick;
        const hasError = (errorCounts?.[i] ?? 0) > 0;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.id} className={cn('flex items-center', !isLast && 'flex-1')}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              aria-current={status === 'current' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2.5 shrink-0 text-left transition-colors',
                clickable && 'cursor-pointer',
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all duration-200',
                  status === 'complete'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : status === 'current'
                      ? 'bg-white dark:bg-slate-900 border-aki-blue text-aki-blue shadow-sm scale-110'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400',
                )}
              >
                {status === 'complete' ? (
                  <Check size={13} strokeWidth={3} />
                ) : hasError && status === 'current' ? (
                  <span className="text-rose-500">!</span>
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:flex flex-col leading-tight">
                <span
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-wider',
                    status === 'current'
                      ? 'text-aki-blue dark:text-blue-400'
                      : status === 'complete'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400',
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-[10px] text-slate-400 font-medium">{step.description}</span>
                )}
              </span>
            </button>
            {!isLast && (
              <span
                className={cn(
                  'h-0.5 flex-1 mx-2 rounded-full transition-colors duration-500',
                  status === 'complete' ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
