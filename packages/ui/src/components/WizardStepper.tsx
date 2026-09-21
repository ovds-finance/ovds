/**
 * WizardStepper — reusable multi-step wizard progress indicator.
 *
 * Pure UI component (no app-specific hooks). Follows OVDS design system:
 * - Compact typography scale
 * - green accent for active/complete steps
 * - Accessible aria-* attributes
 */
import React from 'react';
import { Check } from 'lucide-react';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export type WizardStepStatus = 'complete' | 'current' | 'upcoming';

export interface WizardStepperProps {
  steps: WizardStep[];
  currentIndex: number;
  /** Compact horizontal variant for narrow spaces */
  variant?: 'vertical' | 'horizontal';
  /** Called when a completed step is clicked (for back-navigation) */
  onStepClick?: (index: number) => void;
  className?: string;
}

function stepStatus(index: number, currentIndex: number): WizardStepStatus {
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

// -- Vertical Stepper ----------------------------------------------------------

const VerticalStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentIndex,
  onStepClick,
  className = '',
}) => (
  <nav
    aria-label="Registration steps"
    className={`flex flex-col gap-0 ${className}`}
  >
    {steps.map((step, i) => {
      const status = stepStatus(i, currentIndex);
      const isClickable = status === 'complete' && !!onStepClick;

      return (
        <div key={step.id} className="flex items-stretch gap-3">
          {/* Connector column */}
          <div className="flex flex-col items-center">
            {/* Circle */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(i)}
              aria-current={status === 'current' ? 'step' : undefined}
              className={[
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 text-xs font-bold border-2',
                status === 'complete'
                  ? isClickable
                    ? 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white cursor-pointer hover:bg-[var(--pro-azure-dark)] hover:border-[var(--pro-azure-dark)]'
                    : 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white cursor-default'
                  : status === 'current'
                  ? 'bg-white dark:bg-slate-900 border-[var(--pro-azure)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shadow-md shadow-green-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 cursor-default',
              ].join(' ')}
            >
              {status === 'complete' ? (
                <Check size={14} strokeWidth={3} />
              ) : status === 'current' ? (
                step.icon ?? <span>{i + 1}</span>
              ) : (
                <span>{i + 1}</span>
              )}
            </button>
            {/* Vertical line (except last) */}
            {i < steps.length - 1 && (
              <div
                className={[
                  'w-0.5 flex-1 my-1 rounded-full transition-colors duration-500',
                  status === 'complete'
                    ? 'bg-[var(--pro-azure)]'
                    : 'bg-slate-200 dark:bg-slate-700',
                ].join(' ')}
              />
            )}
          </div>

          {/* Label column */}
          <div className={`pb-6 min-w-0 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
            <p
              className={[
                'ovds-label leading-tight',
                status === 'current'
                  ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                  : status === 'complete'
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-400 dark:text-slate-600',
              ].join(' ')}
            >
              {step.label}
            </p>
            {step.description && status === 'current' && (
              <p className="ovds-caption text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {step.description}
              </p>
            )}
          </div>
        </div>
      );
    })}
  </nav>
);

// -- Horizontal Stepper --------------------------------------------------------

const HorizontalStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentIndex,
  onStepClick,
  className = '',
}) => (
  <nav
    aria-label="Registration steps"
    className={`flex items-center gap-0 w-full ${className}`}
  >
    {steps.map((step, i) => {
      const status = stepStatus(i, currentIndex);
      const isClickable = status === 'complete' && !!onStepClick;
      const isLast = i === steps.length - 1;

      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(i)}
              aria-current={status === 'current' ? 'step' : undefined}
              title={step.label}
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all duration-200',
                status === 'complete'
                  ? isClickable
                    ? 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white cursor-pointer hover:scale-110'
                    : 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white cursor-default'
                  : status === 'current'
                   ? 'bg-white dark:bg-slate-900 border-[var(--pro-azure)] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shadow-sm shadow-green-500/20 scale-110'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 cursor-default',
              ].join(' ')}
            >
              {status === 'complete' ? <Check size={12} strokeWidth={3} /> : i + 1}
            </button>
            <span
              className={[
                'ovds-caption whitespace-nowrap hidden sm:block',
                status === 'current'
                  ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold'
                  : 'text-slate-400',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
          {!isLast && (
            <div
              className={[
                'h-0.5 flex-1 mx-1 rounded-full transition-colors duration-500',
                status === 'complete' ? 'bg-[var(--pro-azure)]' : 'bg-slate-200 dark:bg-slate-700',
              ].join(' ')}
            />
          )}
        </React.Fragment>
      );
    })}
  </nav>
);

// -- Export --------------------------------------------------------------------

export const WizardStepper: React.FC<WizardStepperProps> = (props) =>
  props.variant === 'horizontal' ? (
    <HorizontalStepper {...props} />
  ) : (
    <VerticalStepper {...props} />
  );
