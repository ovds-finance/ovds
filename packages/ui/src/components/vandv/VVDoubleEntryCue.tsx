/**
 * VVDoubleEntryCue — double-entry visual cue.
 *
 * Separates debits (inflows, light green) and credits (outflows, light
 * red/gray) with contrasting background tints and shows the running balance,
 * so the user can eyeball that the entry balances before submission.
 */
import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { cn } from '../../lib/utils';
import { doubleEntryTotals, fmtVV, type VVField, type VVValues } from './validate';

export interface VVDoubleEntryCueProps {
  fields: VVField[];
  values: VVValues;
  currency?: string;
  className?: string;
}

export const VVDoubleEntryCue: React.FC<VVDoubleEntryCueProps> = ({
  fields,
  values,
  currency = 'ETB',
  className,
}) => {
  const { debit, credit, balance, balanced } = doubleEntryTotals(fields, values);

  return (
    <div className={cn('rounded-oki border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900', className)}>
      <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
        {/* Debit — inflow (green) */}
        <div className="bg-[var(--pro-azure-50)]/50 dark:bg-green-950/20 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
            <ArrowDownLeft size={12} /> Debit · Inflow
          </div>
          <p className="text-lg font-black tabular-nums text-[var(--pro-azure-dark)] dark:text-green-300 mt-1">
            {fmtVV(debit, currency)}
          </p>
        </div>
        {/* Credit — outflow (red/gray) */}
        <div className="bg-rose-50/40 dark:bg-rose-950/20 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            <ArrowUpRight size={12} /> Credit · Outflow
          </div>
          <p className="text-lg font-black tabular-nums text-rose-700 dark:text-rose-300 mt-1">
            {fmtVV(credit, currency)}
          </p>
        </div>
      </div>
      {/* Running balance */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 border-t text-[11px] font-semibold',
          balanced
            ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/30 dark:border-green-900'
            : 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900',
        )}
      >
        <span className="flex items-center gap-1.5 uppercase tracking-wider">
          <Scale size={12} /> Running Balance
        </span>
        <span className="tabular-nums">
          {fmtVV(balance, currency)}
          {balanced ? ' · Balanced' : ' · Unbalanced'}
        </span>
      </div>
    </div>
  );
};
