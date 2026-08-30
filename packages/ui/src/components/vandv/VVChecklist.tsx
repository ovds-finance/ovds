/**
 * VVChecklist — guided logical validation checklist for the Verification step.
 *
 * Translates the raw field errors + double-entry totals into a short, human
 * list of pass/fail checks so users can see exactly what still blocks
 * submission (and why). Supports the V&V goal of preventing errors before
 * a regulated record reaches the ledger / MoR e-Tax.
 */
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface VVCheck {
  key: string;
  label: string;
  pass: boolean;
  detail?: string;
}

export interface VVChecklistProps {
  checks: VVCheck[];
  className?: string;
}

export const VVChecklist: React.FC<VVChecklistProps> = ({ checks, className }) => {
  if (checks.length === 0) return null;
  const passed = checks.filter((c) => c.pass).length;
  const allPass = passed === checks.length;

  return (
    <div
      className={cn(
        'rounded-oki border p-4',
        allPass
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Validation Checks
        </span>
        <span
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            allPass
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
          )}
        >
          {passed}/{checks.length} passed
        </span>
      </div>
      {!allPass && (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mb-2.5">
          {checks.length - passed} check{checks.length - passed === 1 ? '' : 's'} blocking
          submission — resolve {checks.length - passed === 1 ? 'it' : 'them'} above.
        </p>
      )}
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.key} className="flex items-start gap-2 text-[12px]">
            {c.pass ? (
              <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
            ) : (
              <XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
            )}
            <span className={cn('min-w-0', c.pass ? 'text-slate-600 dark:text-slate-300' : 'text-slate-700 dark:text-slate-200 font-medium')}>
              {c.label}
              {c.detail && (
                <span className="text-slate-400 font-normal"> — {c.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
