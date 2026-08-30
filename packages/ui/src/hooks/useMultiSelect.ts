/**
 * useMultiSelect — manages a set of selected item IDs.
 *
 * Supports select-all, deselect-all, toggle, and bulk operations.
 * Designed for tables and lists with checkbox selection.
 *
 * Usage:
 *   const { selected, toggle, toggleAll, isSelected, isAllSelected, clear } =
 *     useMultiSelect(rows.map(r => r.id));
 */
import { useState, useCallback, useMemo } from 'react';

export interface MultiSelect {
  /** Set of currently selected IDs */
  selected:     Set<string>;
  /** Array of currently selected IDs */
  selectedIds:  string[];
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Whether all available items are selected */
  isAllSelected: boolean;
  /** Whether some (but not all) items are selected */
  isIndeterminate: boolean;
  /** Toggle a single item */
  toggle:       (id: string) => void;
  /** Toggle all items (select all or deselect all) */
  toggleAll:    () => void;
  /** Select all items */
  selectAll:    () => void;
  /** Check if a specific ID is selected */
  isSelected:   (id: string) => boolean;
  /** Clear all selections */
  clear:        () => void;
  /** Replace the entire selection */
  set:          (ids: string[]) => void;
}

export function useMultiSelect(allIds: string[]): MultiSelect {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(allIds));
  }, [allIds]);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev => {
      if (prev.size >= allIds.length) return new Set();
      return new Set(allIds);
    });
  }, [allIds]);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const set = useCallback((ids: string[]) => {
    setSelected(new Set(ids));
  }, []);

  const isAllSelected    = allIds.length > 0 && selected.size === allIds.length;
  const isIndeterminate  = selected.size > 0 && selected.size < allIds.length;
  const selectedIds      = useMemo(() => Array.from(selected), [selected]);
  const hasSelection     = selected.size > 0;

  return {
    selected, selectedIds, hasSelection,
    isAllSelected, isIndeterminate,
    toggle, toggleAll, selectAll, isSelected, clear, set,
  };
}
