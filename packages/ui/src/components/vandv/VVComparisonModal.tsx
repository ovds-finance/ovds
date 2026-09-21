/**
 * VVComparisonModal — Final Review split-view comparison.
 *
 * A side-by-side modal showing Original Data vs. Validated Data with
 * color-coded diffs (green = additions, yellow = edits, gray = removed) so the
 * user can confirm absolute accuracy before submission.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Pencil, Minus, EyeOff, Scale } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useScrollLock } from '../../hooks/useScrollLock';
import {
  diffVV,
  fmtVV,
  doubleEntryTotals,
  type FieldDiff,
  type VVField,
  type VVValues,
} from './validate';

export interface VVComparisonModalProps {
  open: boolean;
  fields: VVField[];
  original?: VVValues;
  validated: VVValues;
  entityLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

const STATUS_STYLE: Record<
  FieldDiff['status'],
  { row: string; chip: string; icon: React.ReactNode; label: string }
> = {
  added: { row: 'bg-[var(--pro-azure-50)]/60 dark:bg-green-950/30', chip: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]', icon: <Plus size={11} />, label: 'Added' },
  edited: { row: 'bg-amber-50/60 dark:bg-amber-950/30', chip: 'bg-amber-100 text-amber-700', icon: <Pencil size={11} />, label: 'Edited' },
  removed: { row: 'bg-slate-100/60 dark:bg-slate-800/40', chip: 'bg-slate-200 text-slate-500', icon: <Minus size={11} />, label: 'Removed' },
  unchanged: { row: '', chip: 'bg-slate-100 text-slate-400', icon: null, label: 'Unchanged' },
};

const Cell: React.FC<{ diff: FieldDiff; side: 'original' | 'validated' }> = ({ diff, side }) => {
  const v = side === 'original' ? diff.original : diff.validated;
  const show = diff.status === 'added' ? side === 'validated'
    : diff.status === 'removed' ? side === 'original'
    : true;
  if (!show) {
    return <span className="text-slate-300 dark:text-slate-600 italic text-[12px]">—</span>;
  }
  const tone =
    side === 'validated' && diff.status === 'edited' ? 'text-amber-700 dark:text-amber-300 font-semibold'
      : side === 'validated' && diff.status === 'added' ? 'text-[var(--pro-azure-dark)] dark:text-green-300 font-semibold'
      : 'text-slate-700 dark:text-slate-200';
  return <span className={cn('text-[13px] tabular-nums', tone)}>{fmtVV(v)}</span>;
};

export const VVComparisonModal: React.FC<VVComparisonModalProps> = ({
  open,
  fields,
  original,
  validated,
  entityLabel,
  onClose,
  onConfirm,
}) => {
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const diffs = diffVV(fields, original, validated);
  const changed = diffs.filter((d) => d.status !== 'unchanged').length;
  const [onlyChanges, setOnlyChanges] = useState(false);
  const visible = useMemo(
    () => (onlyChanges ? diffs.filter((d) => d.status !== 'unchanged') : diffs),
    [diffs, onlyChanges],
  );
  const totals = doubleEntryTotals(fields, validated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-aki-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Final review comparison"
        className="relative w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-oki-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-oki-modal animate-aki-scale-in flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">Final Review</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {entityLabel ?? 'Record'} · {changed} change{changed === 1 ? '' : 's'} vs. original
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar: net balance + "only changes" toggle */}
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[11px] font-semibold',
              totals.balanced
                ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                : 'text-rose-600 dark:text-rose-400',
            )}
          >
            <Scale size={13} />
            {totals.balanced
              ? 'Balanced — net ETB 0.00'
              : `Out of balance by ${fmtVV(totals.balance)}`}
          </span>
          <button
            type="button"
            onClick={() => setOnlyChanges((v) => !v)}
            aria-pressed={onlyChanges}
            className={cn(
              'inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-oki px-2.5 py-1.5 border transition-colors',
              onlyChanges
                ? 'border-[var(--pro-azure)]/40 text-[var(--pro-azure)] bg-[var(--pro-azure)]/10'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
          >
            <EyeOff size={12} />
            {onlyChanges ? 'Showing changes only' : 'Show changes only'}
          </button>
        </div>

        {/* Split header */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-widest">
          <div className="bg-white dark:bg-slate-900 px-5 py-2 text-slate-400">Original</div>
          <div className="bg-white dark:bg-slate-900 px-5 py-2 text-[var(--pro-azure)] dark:text-blue-400">Validated</div>
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1">
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-[12px] text-slate-400">
              No changes — validated data matches the original.
            </p>
          ) : (
            visible.map((d) => {
              const s = STATUS_STYLE[d.status];
              return (
                <div
                  key={d.key}
                  className={cn(
                    'grid grid-cols-2 gap-px border-b border-slate-50 dark:border-slate-800/60',
                    s.row,
                  )}
                >
                  <div className="bg-white/0 dark:bg-slate-900/0 px-5 py-2.5 flex items-center justify-between gap-2">
                    <Cell diff={d} side="original" />
                  </div>
                  <div className="px-5 py-2.5 flex items-center justify-between gap-2">
                    <Cell diff={d} side="validated" />
                    {d.status !== 'unchanged' && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded',
                          s.chip,
                        )}
                      >
                        {s.icon}
                        {s.label}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 px-5 -mt-1 pb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {d.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1">
              <span className="text-[var(--pro-azure-dark)]">green = added</span> ·{' '}
              <span className="text-amber-600">yellow = edited</span> ·{' '}
              <span className="text-slate-500">gray = removed</span>
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-[12px] font-semibold rounded-oki border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Keep Editing
            </button>
            {onConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 text-[12px] font-bold rounded-oki bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] transition-colors"
              >
                Looks Correct
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
