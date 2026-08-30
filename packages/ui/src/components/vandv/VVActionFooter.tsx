/**
 * VVActionFooter — Sticky Action Footer for the V&V submission.
 *
 * A floating, persistent bottom bar containing the primary actions. The
 * "Validate & Submit" button is highly contrasted while Cancel / Reset / Back
 * are ghosted to prevent accidental clicks.
 */
import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface VVActionFooterProps {
  onCancel?: () => void;
  onReset?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  /** Label of the primary submit button (final step) */
  submitLabel?: string;
  /** Label of the Next button (intermediate steps) */
  nextLabel?: string;
  /** Replace the Next affordance with the submit button */
  showSubmit?: boolean;
  /** Disable the primary action (e.g. while validating / submitting) */
  busy?: boolean;
  /** Hint text shown on the left of the footer */
  hint?: React.ReactNode;
  className?: string;
}

export const VVActionFooter: React.FC<VVActionFooterProps> = ({
  onCancel,
  onReset,
  onBack,
  onNext,
  onSubmit,
  submitLabel = 'Validate & Submit',
  nextLabel = 'Next',
  showSubmit = false,
  busy = false,
  hint,
  className,
}) => (
  <div
    className={cn(
      'sticky bottom-0 z-30 mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3',
      'bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-700',
      'flex items-center justify-between gap-3',
      className,
    )}
  >
    {/* Ghosted / secondary actions */}
    <div className="flex items-center gap-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-oki text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <ArrowLeft size={13} /> Back
        </button>
      )}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-oki border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <X size={13} /> Cancel
        </button>
      )}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-oki border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <RotateCcw size={13} /> Reset
        </button>
      )}
    </div>

    {/* Hint + primary action */}
    <div className="flex items-center gap-3">
      {hint && <span className="hidden md:block text-[11px] text-slate-400">{hint}</span>}
      {showSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold rounded-oki text-white shadow-lg',
            'bg-aki-blue hover:bg-aki-blue-dark active:scale-[0.99] transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-aki-blue/40',
            busy && 'opacity-70 cursor-wait',
          )}
        >
          {busy ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 size={15} />
          )}
          {submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-bold rounded-oki bg-aki-blue text-white hover:bg-aki-blue-dark active:scale-[0.99] transition-all shadow disabled:opacity-70"
        >
          {nextLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  </div>
);
