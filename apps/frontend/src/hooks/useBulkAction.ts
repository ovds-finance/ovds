/**
 * useBulkAction — manages bulk operations on selected table rows.
 *
 * Wraps useMultiSelect + mutation state + confirmation into one hook.
 *
 * Usage:
 *   const bulk = useBulkAction(rows.map(r => r.id));
 *
 *   // In a toolbar:
 *   {bulk.hasSelection && (
 *     <button onClick={() => bulk.execute('delete', async (ids) => {
 *       await api.post('/invoices/bulk-delete', { ids });
 *     })}>
 *       Delete {bulk.selectedCount} invoices
 *     </button>
 *   )}
 *
 *   // In a table row:
 *   <input type="checkbox" checked={bulk.isSelected(row.id)} onChange={() => bulk.toggle(row.id)} />
 */
import { useMultiSelect } from '@ovds/ui';
import { useToast } from '@ovds/ui';
import { useCallback, useState } from 'react';

import { invalidateQueryPrefix } from './useApiQuery';

export interface BulkActionState {
  // Selection
  selected:        Set<string>;
  selectedIds:     string[];
  selectedCount:   number;
  hasSelection:    boolean;
  isAllSelected:   boolean;
  isIndeterminate: boolean;
  toggle:          (id: string) => void;
  toggleAll:       () => void;
  selectAll:       () => void;
  isSelected:      (id: string) => boolean;
  clearSelection:  () => void;
  // Execution
  isExecuting:     boolean;
  execute:         (
    label:     string,
    action:    (ids: string[]) => Promise<{ succeeded?: number; failed?: number } | void>,
    opts?:     { invalidate?: string; successMsg?: string }
  ) => Promise<void>;
}

export function useBulkAction(allIds: string[]): BulkActionState {
  const multi       = useMultiSelect(allIds);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast }   = useToast();

  const execute = useCallback(async (
    label:  string,
    action: (ids: string[]) => Promise<{ succeeded?: number; failed?: number } | void>,
    opts:   { invalidate?: string; successMsg?: string } = {},
  ) => {
    if (!multi.hasSelection) return;
    const ids = multi.selectedIds;
    setIsExecuting(true);
    try {
      const result = await action(ids);
      const succeeded = (result as any)?.succeeded ?? ids.length;
      const failed    = (result as any)?.failed    ?? 0;

      if (opts.invalidate) invalidateQueryPrefix(opts.invalidate);
      multi.clear();

      toast({
        title: opts.successMsg ?? `${label} complete`,
        description: failed > 0
          ? `${succeeded} succeeded, ${failed} failed`
          : `${succeeded} item${succeeded !== 1 ? 's' : ''} updated`,
        variant: failed > 0 ? 'warning' : 'success',
      });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? `${label} failed`;
      toast({
        title: `${label} failed`,
        description: typeof message === 'string' ? message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [multi, toast]);

  return {
    selected:        multi.selected,
    selectedIds:     multi.selectedIds,
    selectedCount:   multi.selectedIds.length,
    hasSelection:    multi.hasSelection,
    isAllSelected:   multi.isAllSelected,
    isIndeterminate: multi.isIndeterminate,
    toggle:          multi.toggle,
    toggleAll:       multi.toggleAll,
    selectAll:       multi.selectAll,
    isSelected:      multi.isSelected,
    clearSelection:  multi.clear,
    isExecuting,
    execute,
  };
}

