/**
 * @ovds/ui — BulkActionToolbar
 *
 * Floating action bar that appears when rows are selected in an enterprise table.
 * Displays selection count, quick actions, and a clear button.
 *
 * Enterprise UX rule: Never make users click "Approve" fifty times.
 */

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { BulkActionDefinition } from './types';

export interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkActionDefinition[];
  onClear: () => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  label?: string;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  actions,
  onClear,
  onSelectAll,
  allSelected,
  label = 'selected',
}: BulkActionToolbarProps) {
  const [confirmAction, setConfirmAction] = React.useState<BulkActionDefinition | null>(null);
  const [status, setStatus] = React.useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  if (selectedCount === 0) return null;

  const handleAction = async (action: BulkActionDefinition) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action);
      return;
    }
    setStatus('executing');
    try {
      await action.execute([]);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClear();
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const confirmExecute = async () => {
    if (!confirmAction) return;
    setConfirmAction(null);
    setStatus('executing');
    try {
      await confirmAction.execute([]);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClear();
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-slate-900/30 min-w-[400px]">
          <span className="text-[12px] font-semibold text-slate-300">
            <span className="text-white font-bold">{selectedCount.toLocaleString()}</span> {label}
          </span>

          <div className="w-px h-4 bg-slate-700" />

          {onSelectAll && (
            <button
              onClick={onSelectAll}
              className="text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}

          <div className="w-px h-4 bg-slate-700" />

          <div className="flex items-center gap-1.5 flex-1">
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={() => handleAction(action)}
                disabled={status === 'executing'}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all',
                  'bg-white/10 text-white hover:bg-white/20',
                  action.type === 'DELETE' && 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30',
                  action.type === 'ARCHIVE' && 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30',
                  status === 'executing' && 'opacity-50 cursor-not-allowed',
                )}
              >
                {status === 'executing' && action.key === confirmAction?.key ? (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                {action.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClear}
            disabled={status === 'executing'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/70 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{confirmAction.label}</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {confirmAction.confirmationMessage
                    ? confirmAction.confirmationMessage(selectedCount)
                    : `You are about to ${confirmAction.label.toLowerCase()} ${selectedCount} ${label}. This action cannot be undone.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[12px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmExecute}
                disabled={status === 'executing'}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all',
                  confirmAction.type === 'DELETE'
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
                  status === 'executing' && 'opacity-50 cursor-not-allowed',
                )}
              >
                {status === 'executing' ? 'Processing...' : confirmAction.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-2xl">
            <span className="text-[12px] font-semibold">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-200 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
