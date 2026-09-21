/**
 * ProgressiveFormComponents — OVDS advanced form & input system
 *
 * Implements the progressive disclosure philosophy:
 * - Multi-step wizards with auto-save drafts
 * - Context-aware input methods (slider/stepper based on data type)
 * - Real-time inline validation
 * - Smart form field groups
 *
 * Exports:
 *   ProgressWizard      — enhanced wizard with timeline + auto-save draft indicator
 *   ContextSliderInput  — slider for casual/range inputs
 *   ContextStepperInput — numeric stepper for precise integer inputs
 *   ValidatedField      — field with real-time validation feedback
 *   FormDivider         — visual section divider inside forms
 *   InlineValidation    — inline validation status row
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// ProgressWizard
// ---------------------------------------------------------------------------
export interface ProgressWizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** Validation: if provided, step shows error state */
  error?: string;
  /** Is this step auto-saved? */
  saved?: boolean;
}

export interface ProgressWizardProps {
  steps: ProgressWizardStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  /** Show draft saved indicator */
  draftSaved?: boolean;
  /** ISO timestamp of last auto-save */
  lastSavedAt?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

function stepStatus(i: number, current: number) {
  if (i < current) return 'done';
  if (i === current) return 'active';
  return 'future';
}

export const ProgressWizard: React.FC<ProgressWizardProps> = ({
  steps,
  currentStep,
  onStepClick,
  draftSaved,
  lastSavedAt,
  orientation = 'horizontal',
  className,
}) => {
  if (orientation === 'vertical') {
    return (
      <nav aria-label="Form progress" className={cn('flex flex-col', className)}>
        {/* Draft saved indicator */}
        {(draftSaved !== undefined) && (
          <div className={cn(
            'flex items-center gap-1.5 text-[10px] font-semibold mb-4 px-1',
            draftSaved ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-slate-400',
          )}>
            {draftSaved ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Draft saved{lastSavedAt && ` · ${new Date(lastSavedAt).toLocaleTimeString()}`}
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Saving draft…
              </>
            )}
          </div>
        )}

        {steps.map((step, i) => {
          const status = stepStatus(i, currentStep);
          const clickable = (status === 'done' || status === 'active') && !!onStepClick;
          return (
            <div key={step.id} className="flex items-stretch gap-3">
              {/* Timeline column */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick?.(i)}
                  aria-current={status === 'active' ? 'step' : undefined}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold border-2 transition-all',
                    status === 'done'
                      ? 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white'
                      : status === 'active'
                        ? 'bg-white dark:bg-slate-900 border-[var(--pro-azure)] text-[var(--pro-azure)] shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400',
                    clickable && 'cursor-pointer',
                    step.error && status === 'active' && 'border-rose-500 text-rose-600',
                  )}
                >
                  {status === 'done' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : step.icon ?? <span>{i + 1}</span>}
                </button>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'w-0.5 flex-1 my-1 rounded-full transition-colors',
                    status === 'done' ? 'bg-[var(--pro-azure)]' : 'bg-slate-200 dark:bg-slate-700',
                  )} />
                )}
              </div>

              {/* Label column */}
              <div className={cn('pb-6 min-w-0', i === steps.length - 1 && 'pb-0')}>
                <p className={cn(
                  'text-[11px] font-bold uppercase tracking-wider leading-tight',
                  status === 'active'
                    ? step.error ? 'text-rose-600' : 'text-[var(--pro-azure)] dark:text-blue-400'
                    : status === 'done' ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-slate-400',
                )}>
                  {step.title}
                  {step.saved && status === 'done' && (
                    <span className="ml-1 text-[var(--pro-azure)] text-[9px]">✓</span>
                  )}
                </p>
                {status === 'active' && step.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                )}
                {status === 'active' && step.error && (
                  <p className="text-[11px] text-rose-500 mt-0.5 font-medium">{step.error}</p>
                )}
              </div>
            </div>
          );
        })}
      </nav>
    );
  }

  // Horizontal
  return (
    <nav aria-label="Form progress" className={cn('w-full', className)}>
      {draftSaved !== undefined && (
        <div className={cn(
          'flex items-center justify-end gap-1.5 text-[10px] font-semibold mb-3',
          draftSaved ? 'text-[var(--pro-azure-dark)]' : 'text-slate-400',
        )}>
          {draftSaved ? '✓ Draft saved' : 'Saving…'}
          {lastSavedAt && draftSaved && <span className="opacity-60">· {new Date(lastSavedAt).toLocaleTimeString()}</span>}
        </div>
      )}
      <div className="flex items-center w-full">
        {steps.map((step, i) => {
          const status = stepStatus(i, currentStep);
          const isLast = i === steps.length - 1;
          const clickable = (status === 'done') && !!onStepClick;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick?.(i)}
                  aria-current={status === 'active' ? 'step' : undefined}
                  title={step.title}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all',
                    status === 'done' ? 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white' + (clickable ? ' cursor-pointer hover:scale-110' : '') : '',
                    status === 'active' ? 'bg-white dark:bg-slate-900 border-[var(--pro-azure)] text-[var(--pro-azure)] scale-110 shadow-sm' : '',
                    status === 'future' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400' : '',
                    step.error && status === 'active' ? 'border-rose-500 text-rose-600' : '',
                  )}
                >
                  {status === 'done' ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : i + 1}
                </button>
                <span className={cn(
                  'text-[9px] font-bold uppercase tracking-wide whitespace-nowrap hidden sm:block',
                  status === 'active' ? 'text-[var(--pro-azure)] dark:text-blue-400' : 'text-slate-400',
                )}>
                  {step.title}
                </span>
              </div>
              {!isLast && (
                <div className={cn(
                  'h-0.5 flex-1 mx-1 rounded-full transition-colors duration-500 mb-4',
                  status === 'done' ? 'bg-[var(--pro-azure)]' : 'bg-slate-200 dark:bg-slate-700',
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

// ---------------------------------------------------------------------------
// ContextSliderInput — range slider with live value display
// ---------------------------------------------------------------------------
export interface ContextSliderInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange?: (v: number) => void;
  formatValue?: (v: number) => string;
  accent?: string;
  disabled?: boolean;
  className?: string;
}

export const ContextSliderInput: React.FC<ContextSliderInputProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange,
  formatValue,
  accent = '#0056D2',
  disabled = false,
  className,
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="aki-label">{label}</label>
        <span className="text-[13px] font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100">{display}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={e => onChange?.(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer bg-slate-200 dark:bg-slate-700"
          style={{
            background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)`,
          }}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={display}
        />
      </div>
      <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
        <span>{formatValue ? formatValue(min) : `${min}${unit}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit}`}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ContextStepperInput — precise integer stepper (+ / -)
// ---------------------------------------------------------------------------
export interface ContextStepperInputProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
  className?: string;
}

export const ContextStepperInput: React.FC<ContextStepperInputProps> = ({
  label,
  value,
  min = 0,
  max = Infinity,
  step = 1,
  onChange,
  disabled = false,
  className,
}) => {
  const handleDown = () => onChange?.(Math.max(min, value - step));
  const handleUp = () => onChange?.(Math.min(max, value + step));

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      {label && <span className="aki-label">{label}</span>}
      <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
        <button
          type="button"
          onClick={handleDown}
          disabled={disabled || value <= min}
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-r border-slate-200 dark:border-slate-700"
          aria-label="Decrease"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange?.(Math.min(max, Math.max(min, v)));
          }}
          className="w-14 h-9 text-center text-[13px] font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={label}
        />
        <button
          type="button"
          onClick={handleUp}
          disabled={disabled || value >= max}
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-l border-slate-200 dark:border-slate-700"
          aria-label="Increase"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ValidatedField — field wrapper with live validation + hint
// ---------------------------------------------------------------------------
export type ValidationState = 'idle' | 'valid' | 'invalid' | 'warning';

export interface ValidatedFieldProps {
  label: string;
  required?: boolean;
  state?: ValidationState;
  message?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

const STATE_CLS: Record<ValidationState, string> = {
  idle:    '',
  valid:   'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
  invalid: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
};

const STATE_ICON: Record<ValidationState, React.ReactNode> = {
  idle: null,
  valid: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  invalid: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  warning: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" />
    </svg>
  ),
};

export const ValidatedField: React.FC<ValidatedFieldProps> = ({
  label,
  required,
  state = 'idle',
  message,
  hint,
  children,
  className,
}) => (
  <div className={cn('aki-field', className)}>
    <label className={cn('aki-label', required && 'required')}>{label}</label>
    {children}
    {(message || hint) && (
      <div className={cn(
        'flex items-center gap-1.5 mt-1.5 text-[11px] font-medium',
        message ? STATE_CLS[state] : 'text-slate-400',
      )}>
        {message && STATE_ICON[state]}
        <span>{message ?? hint}</span>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// FormDivider — visual section break inside forms
// ---------------------------------------------------------------------------
export interface FormDividerProps {
  label?: string;
  className?: string;
}

export const FormDivider: React.FC<FormDividerProps> = ({ label, className }) => (
  <div className={cn('relative flex items-center my-6', className)}>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    {label && (
      <span className="mx-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
        {label}
      </span>
    )}
    {label && <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />}
  </div>
);

// ---------------------------------------------------------------------------
// InlineValidation — compact row-level validation summary
// ---------------------------------------------------------------------------
export interface ValidationItem {
  key: string;
  label: string;
  state: ValidationState;
  message?: string;
}

export interface InlineValidationProps {
  items: ValidationItem[];
  className?: string;
}

export const InlineValidation: React.FC<InlineValidationProps> = ({
  items,
  className,
}) => {
  const errors = items.filter(i => i.state === 'invalid').length;
  const warnings = items.filter(i => i.state === 'warning').length;

  return (
    <div className={cn(
      'rounded-xl border p-3 text-[11px]',
      errors > 0
        ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
        : warnings > 0
          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
          : 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:border-green-800',
      className,
    )}>
      <div className="flex items-center gap-2 mb-2 font-bold">
        {errors > 0 ? (
          <span className="text-rose-600">{errors} error{errors > 1 ? 's' : ''} to fix</span>
        ) : warnings > 0 ? (
          <span className="text-amber-600">{warnings} warning{warnings > 1 ? 's' : ''}</span>
        ) : (
          <span className="text-[var(--pro-azure-dark)]">All checks passed</span>
        )}
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.key} className={cn('flex items-center gap-1.5', STATE_CLS[item.state])}>
            {STATE_ICON[item.state] ?? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
            <span className={item.state === 'idle' ? 'text-slate-500' : ''}>{item.label}</span>
            {item.message && <span className="opacity-70">— {item.message}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};
