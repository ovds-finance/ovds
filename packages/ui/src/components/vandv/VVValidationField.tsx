/**
 * VVValidationField — Inline Error Highlighting field.
 *
 * Real-time, contextual feedback. A field with incorrect data shows a subtle
 * red border with an inline tooltip (e.g. "Invalid format" / "Value exceeds
 * limit"). Fields tagged with a double-entry `side` get a contrasting tint:
 * light green for inflows (debit), light red/gray for outflows (credit).
 */
import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { VVField, VVValue } from './validate';

export interface VVValidationFieldProps {
  field: VVField;
  value: VVValue;
  error?: string;
  /** When true, validation errors are shown even before the user blurs the field */
  showError?: boolean;
  onChange: (key: string, value: VVValue) => void;
  onBlur?: (key: string) => void;
}

const SIDE_TINT: Record<string, string> = {
  debit: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] focus-within:border-[var(--pro-azure)] focus-within:ring-[var(--pro-azure)]/20',
  credit: 'bg-rose-50/50 border-rose-200 focus-within:border-rose-400 focus-within:ring-rose-500/20',
};

export const VVValidationField: React.FC<VVValidationFieldProps> = ({
  field,
  value,
  error,
  showError,
  onChange,
  onBlur,
}) => {
  const [hovered, setHovered] = useState(false);
  const invalid = !!error && showError;
  const errorId = `vv-${field.key}-error`;
  const hintId = `vv-${field.key}-hint`;

  return (
    <div className="aki-field">
      <div className="flex items-center justify-between gap-2">
        <label className={cn('aki-label', field.required && 'required')} htmlFor={`vv-${field.key}`}>
          {field.label}
        </label>
        {field.side && (
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded',
              field.side === 'debit'
                ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]'
                : 'bg-rose-100 text-rose-700',
            )}
          >
            {field.side === 'debit' ? 'Inflow' : 'Outflow'}
          </span>
        )}
      </div>

      <div
        className={cn(
          'relative rounded-oki border bg-white dark:bg-slate-900 transition-all',
          'focus-within:ring-2',
          field.side ? SIDE_TINT[field.side] : 'border-slate-200 dark:border-slate-700 focus-within:border-[var(--pro-azure)] focus-within:ring-[var(--pro-azure)]/20',
          invalid && 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/40',
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {field.type === 'select' ? (
          <select
            id={`vv-${field.key}`}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            onBlur={() => onBlur?.(field.key)}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : field.hint ? hintId : undefined}
            className="w-full bg-transparent px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 outline-none"
          >
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            id={`vv-${field.key}`}
            type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            inputMode={field.type === 'currency' || field.type === 'number' ? 'decimal' : undefined}
            value={value === null || value === undefined ? '' : (value as string | number)}
            placeholder={field.placeholder}
            onChange={(e) =>
              onChange(
                field.key,
                field.type === 'number' || field.type === 'currency'
                  ? e.target.value === ''
                    ? null
                    : parseFloat(e.target.value)
                  : e.target.value,
              )
            }
            onBlur={() => onBlur?.(field.key)}
            className="w-full bg-transparent px-3 py-2 text-[13px] font-medium text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : field.hint ? hintId : undefined}
          />
        )}

        {/* Status icon — valid / invalid affordance */}
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {invalid ? (
            <AlertCircle size={15} className="text-rose-500" />
          ) : showError && !error && value !== null && value !== undefined && String(value).trim() !== '' ? (
            <CheckCircle2 size={15} className="text-[var(--pro-azure)]" />
          ) : null}
        </span>
      </div>

      {/* Inline tooltip / hint */}
      {(invalid || field.hint) && (
        <div className="mt-1.5 flex items-start gap-1.5 text-[11px] font-medium">
          {invalid ? (
            <>
              <AlertCircle size={12} className="text-rose-500 mt-0.5 shrink-0" />
              <span id={errorId} className="text-rose-600 dark:text-rose-400">{error}</span>
            </>
          ) : (
            <>
              <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
              <span id={hintId} className="text-slate-400">{field.hint}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
