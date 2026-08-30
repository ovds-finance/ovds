/**
 * @ovds/ui — Enterprise Hooks
 *
 * Business-level hooks built on top of primitive hooks for enterprise features:
 *   - useSavedViews       — per-table saved view management
 *   - useBulkActions      — bulk selection + execution with confirmation
 *   - useCommandPalette   — global command palette state
 *   - useEnterpriseTable  — combined table state (sort, filter, group, view)
 *   - useFXRate           — FX rate lookups and conversions
 *   - useChartOfAccounts  — COA browsing and account resolution
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import type {
  SavedView,
  SavedViewColumnConfig,
  SavedViewFilter,
  BulkActionDefinition,
  BulkActionResult,
  BulkOperationState,
  CommandPaletteAction,
  GLAccount,
  JournalEntry,
  JournalLine,
  Entity,
  CurrencyRate,
  ExportFormat,
  ExportOptions,
  AccountMapping,
} from './types';

// ============================================================================
// useSavedViews
// ============================================================================

const STORAGE_PREFIX = 'ovds_views_';

export interface UseSavedViewsOptions {
  tableKey: string;
  defaultColumns: SavedViewColumnConfig[];
  userId: string;
  serverViews?: SavedView[];
}

export interface UseSavedViewsResult {
  views: SavedView[];
  activeView: SavedView | null;
  createView: (name: string, description?: string) => SavedView;
  updateView: (id: string, updates: Partial<SavedView>) => void;
  deleteView: (id: string) => void;
  setActiveView: (id: string | null) => void;
  resetToDefault: () => void;
  duplicateView: (id: string) => SavedView | null;
}

export function useSavedViews({
  tableKey,
  defaultColumns,
  userId,
  serverViews = [],
}: UseSavedViewsOptions): UseSavedViewsResult {
  const storageKey = `${STORAGE_PREFIX}${tableKey}_${userId}`;
  const [localViews, setLocalViews] = useLocalStorage<SavedView[]>(storageKey, []);
  const [activeViewId, setActiveViewId] = useLocalStorage<string | null>(`${storageKey}_active`, null);

  const views = useMemo(() => {
    const allViews = [...serverViews, ...localViews];
    const unique = new Map<string, SavedView>();
    for (const view of allViews) {
      if (!unique.has(view.id)) unique.set(view.id, view);
      else if (localViews.some((lv) => lv.id === view.id)) unique.set(view.id, view);
    }
    return Array.from(unique.values()).sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [serverViews, localViews]);

  const activeView = useMemo(
    () => views.find((v) => v.id === activeViewId) ?? null,
    [views, activeViewId],
  );

  const createView = useCallback(
    (name: string, description?: string): SavedView => {
      const view: SavedView = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        description,
        tableKey,
        isDefault: false,
        isSystem: false,
        columns: defaultColumns.map((col) => ({ ...col })),
        filters: [],
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLocalViews((prev) => [...prev, view]);
      setActiveViewId(view.id);
      return view;
    },
    [tableKey, defaultColumns, userId, setLocalViews, setActiveViewId],
  );

  const updateView = useCallback(
    (id: string, updates: Partial<SavedView>) => {
      setLocalViews((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v,
        ),
      );
      setServerView?.(id, updates);
    },
    [setLocalViews],
  );

  const deleteView = useCallback(
    (id: string) => {
      setLocalViews((prev) => prev.filter((v) => v.id !== id));
      if (activeViewId === id) setActiveViewId(null);
    },
    [setLocalViews, activeViewId, setActiveViewId],
  );

  const setActiveView = useCallback(
    (id: string | null) => {
      setActiveViewId(id);
    },
    [setActiveViewId],
  );

  const resetToDefault = useCallback(() => {
    const defaultView = views.find((v) => v.isDefault);
    if (defaultView) setActiveViewId(defaultView.id);
  }, [views, setActiveViewId]);

  const duplicateView = useCallback(
    (id: string): SavedView | null => {
      const source = views.find((v) => v.id === id);
      if (!source) return null;
      const dup: SavedView = {
        ...source,
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: `${source.name} (Copy)`,
        isDefault: false,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLocalViews((prev) => [...prev, dup]);
      return dup;
    },
    [views, setLocalViews],
  );

  // serverViews is a prop, not state — we need a setter for updates
  // In a real app, this would be a server mutation
  const setServerView = (_id: string, _updates: Partial<SavedView>) => {
    // Server mutation placeholder
  };

  return {
    views,
    activeView,
    createView,
    updateView,
    deleteView,
    setActiveView,
    resetToDefault,
    duplicateView,
  };
}

// ============================================================================
// useBulkActions
// ============================================================================

export interface UseBulkActionsOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  actions: BulkActionDefinition[];
  onSuccess?: (result: BulkActionResult) => void;
  onError?: (error: Error) => void;
}

export interface UseBulkActionsResult<T> {
  selectedIds: Set<string>;
  hasSelection: boolean;
  selectedCount: number;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  bulkState: BulkOperationState;
  executeAction: (action: BulkActionDefinition, payload?: Record<string, unknown>) => Promise<void>;
  cancelAction: () => void;
}

export function useBulkActions<T>({
  items,
  getItemId,
  actions,
  onSuccess,
  onError,
}: UseBulkActionsOptions<T>): UseBulkActionsResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkState, setBulkState] = useState<BulkOperationState>({
    selectedIds: new Set(),
    totalAvailable: items.length,
    action: null,
    status: 'IDLE',
    result: null,
  });

  const allIds = useMemo(() => items.map(getItemId), [items, getItemId]);
  const hasSelection = selectedIds.size > 0;
  const isAllSelected = allIds.length > 0 && selectedIds.size === allIds.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < allIds.length;

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size >= allIds.length) return new Set();
      return new Set(allIds);
    });
  }, [allIds]);

  const selectAll = useCallback(() => setSelectedIds(new Set(allIds)), [allIds]);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const executeAction = useCallback(
    async (action: BulkActionDefinition, payload?: Record<string, unknown>) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      setBulkState((prev) => ({
        ...prev,
        action,
        status: 'CONFIRMING',
        selectedIds: new Set(ids),
      }));

      try {
        setBulkState((prev) => ({ ...prev, status: 'EXECUTING' }));
        const result = await action.execute(ids, payload);
        setBulkState((prev) => ({
          ...prev,
          status: 'COMPLETE',
          result,
        }));
        onSuccess?.(result);
        clearSelection();
        setTimeout(() => {
          setBulkState((prev) => ({
            ...prev,
            status: 'IDLE',
            action: null,
            result: null,
          }));
        }, 3000);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Bulk action failed');
        setBulkState((prev) => ({
          ...prev,
          status: 'ERROR',
          error: err.message,
        }));
        onError?.(err);
      }
    },
    [selectedIds, onSuccess, onError, clearSelection],
  );

  const cancelAction = useCallback(() => {
    setBulkState((prev) => ({
      ...prev,
      status: 'IDLE',
      action: null,
      result: null,
      error: undefined,
    }));
  }, []);

  return {
    selectedIds,
    hasSelection,
    selectedCount: selectedIds.size,
    isAllSelected,
    isIndeterminate,
    toggle,
    toggleAll,
    selectAll,
    clearSelection,
    bulkState,
    executeAction,
    cancelAction,
  };
}

// ============================================================================
// useCommandPalette
// ============================================================================

export interface UseCommandPaletteOptions {
  actions: CommandPaletteAction[];
  maxRecent?: number;
  shortcut?: string;
}

export interface UseCommandPaletteResult {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  filteredActions: CommandPaletteAction[];
  recentActions: string[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (q: string) => void;
  select: (index: number) => void;
  execute: (action: CommandPaletteAction) => void;
  clearQuery: () => void;
}

export function useCommandPalette({
  actions,
  maxRecent = 10,
  shortcut = 'cmd+k',
}: UseCommandPaletteOptions): UseCommandPaletteResult {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentActions, setRecentActions] = useLocalStorage<string[]>('ovds_cmd_recent', []);

  useKeyboardShortcut({ key: 'k', modifiers: ['meta'], handler: () => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }});

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const lower = query.toLowerCase();
    return actions.filter((a) => {
      const labelMatch = a.label.toLowerCase().includes(lower);
      const keywordMatch = a.keywords?.some((k) => k.toLowerCase().includes(lower));
      const categoryMatch = a.category.toLowerCase().includes(lower);
      const shortcutMatch = a.shortcut?.toLowerCase().includes(lower);
      return labelMatch || keywordMatch || categoryMatch || shortcutMatch;
    });
  }, [actions, query]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  const select = useCallback(
    (index: number) => {
      if (index >= 0 && index < filteredActions.length) {
        setSelectedIndex(index);
      }
    },
    [filteredActions.length],
  );

  const execute = useCallback(
    (action: CommandPaletteAction) => {
      action.action();
      setRecentActions((prev) => {
        const filtered = prev.filter((id) => id !== action.id);
        return [action.id, ...filtered].slice(0, maxRecent);
      });
      close();
    },
    [setRecentActions, maxRecent, close],
  );

  const clearQuery = useCallback(() => setQuery(''), []);

  return {
    isOpen,
    query,
    selectedIndex,
    filteredActions,
    recentActions,
    open,
    close,
    toggle,
    setQuery,
    select,
    execute,
    clearQuery,
  };
}

// ============================================================================
// useEnterpriseTable
// ============================================================================

export interface EnterpriseTableState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
  groupBy?: string;
  activeViewId: string | null;
  columns: SavedViewColumnConfig[];
  filters: SavedViewFilter[];
}

export interface UseEnterpriseTableOptions {
  tableKey: string;
  userId: string;
  defaultColumns: SavedViewColumnConfig[];
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  defaultPageSize?: number;
}

export interface UseEnterpriseTableResult {
  state: EnterpriseTableState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (key: string, order: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  setGroupBy: (field: string | undefined) => void;
  setColumns: (columns: SavedViewColumnConfig[]) => void;
  setFilters: (filters: SavedViewFilter[]) => void;
  setActiveView: (viewId: string | null) => void;
  reset: () => void;
  query: Record<string, unknown>;
}

export function useEnterpriseTable({
  tableKey,
  userId,
  defaultColumns,
  defaultSortBy = 'createdAt',
  defaultSortOrder = 'desc',
  defaultPageSize = 25,
}: UseEnterpriseTableOptions): UseEnterpriseTableResult {
  const storageKey = `ovds_table_${tableKey}_${userId}`;

  const [state, setState] = useLocalStorage<EnterpriseTableState>(storageKey, {
    page: 1,
    pageSize: defaultPageSize,
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
    search: '',
    groupBy: undefined,
    activeViewId: null,
    columns: defaultColumns,
    filters: [],
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, [setState]);

  const setPageSize = useCallback((pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  }, [setState]);

  const setSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      setState((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
    },
    [setState],
  );

  const setSearch = useCallback(
    (search: string) => {
      setState((prev) => ({ ...prev, search, page: 1 }));
    },
    [setState],
  );

  const setGroupBy = useCallback(
    (groupBy: string | undefined) => {
      setState((prev) => ({ ...prev, groupBy, page: 1 }));
    },
    [setState],
  );

  const setColumns = useCallback(
    (columns: SavedViewColumnConfig[]) => {
      setState((prev) => ({ ...prev, columns }));
    },
    [setState],
  );

  const setFilters = useCallback(
    (filters: SavedViewFilter[]) => {
      setState((prev) => ({ ...prev, filters, page: 1 }));
    },
    [setState],
  );

  const setActiveView = useCallback(
    (activeViewId: string | null) => {
      setState((prev) => ({ ...prev, activeViewId }));
    },
    [setState],
  );

  const reset = useCallback(() => {
    setState({
      page: 1,
      pageSize: defaultPageSize,
      sortBy: defaultSortBy,
      sortOrder: defaultSortOrder,
      search: '',
      groupBy: undefined,
      activeViewId: null,
      columns: defaultColumns,
      filters: [],
    });
  }, [setState, defaultColumns, defaultSortBy, defaultSortOrder, defaultPageSize]);

  const query = useMemo(
    () => ({
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      search: state.search,
      groupBy: state.groupBy,
      filters: state.filters,
      columns: state.columns.filter((c) => c.visible).map((c) => c.key),
    }),
    [state],
  );

  return {
    state,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setGroupBy,
    setColumns,
    setFilters,
    setActiveView,
    reset,
    query,
  };
}

// ============================================================================
// useFXRate
// ============================================================================

export interface UseFXRateOptions {
  rates: CurrencyRate[];
  baseCurrency: string;
}

export interface UseFXRateResult {
  getRate: (from: string, to: string, date?: string) => number | null;
  convert: (amount: number, from: string, to: string, date?: string) => number;
  availableCurrencies: string[];
  baseCurrency: string;
}

export function useFXRate({ rates, baseCurrency }: UseFXRateOptions): UseFXRateResult {
  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    for (const r of rates) {
      currencies.add(r.fromCurrency);
      currencies.add(r.toCurrency);
    }
    return Array.from(currencies).sort();
  }, [rates]);

  const getRate = useCallback(
    (from: string, to: string, _date?: string): number | null => {
      if (from === to) return 1;
      const direct = rates.find((r) => r.fromCurrency === from && r.toCurrency === to);
      if (direct) return direct.rate;
      const inverse = rates.find((r) => r.fromCurrency === to && r.toCurrency === from);
      if (inverse) return inverse.rate !== 0 ? 1 / inverse.rate : null;
      return null;
    },
    [rates],
  );

  const convert = useCallback(
    (amount: number, from: string, to: string, date?: string): number => {
      const rate = getRate(from, to, date);
      if (rate === null) return amount;
      return amount * rate;
    },
    [getRate],
  );

  return { getRate, convert, availableCurrencies, baseCurrency };
}

// ============================================================================
// useChartOfAccounts
// ============================================================================

export interface UseChartOfAccountsOptions {
  accounts: GLAccount[];
  mappings?: AccountMapping[];
  entityId?: string;
}

export interface UseChartOfAccountsResult {
  accounts: GLAccount[];
  rootAccounts: GLAccount[];
  getChildren: (parentCode: string) => GLAccount[];
  getAccount: (code: string) => GLAccount | undefined;
  resolveAccount: (entityId: string, defaultCode: string) => GLAccount | undefined;
  search: (query: string) => GLAccount[];
  byType: (type: string) => GLAccount[];
  byCategory: (category: string) => GLAccount[];
}

export function useChartOfAccounts({
  accounts,
  mappings = [],
  entityId,
}: UseChartOfAccountsOptions): UseChartOfAccountsResult {
  const lookup = useMemo(() => {
    const map = new Map<string, GLAccount>();
    for (const acc of accounts) map.set(acc.code, acc);
    return map;
  }, [accounts]);

  const rootAccounts = useMemo(
    () => accounts.filter((a) => !a.parentCode || a.level === 1),
    [accounts],
  );

  const getChildren = useCallback(
    (parentCode: string): GLAccount[] => {
      const parent = lookup.get(parentCode);
      if (!parent) return [];
      return accounts
        .filter((a) => a.parentCode === parentCode)
        .sort((a, b) => a.code.localeCompare(b.code));
    },
    [accounts, lookup],
  );

  const getAccount = useCallback(
    (code: string) => lookup.get(code),
    [lookup],
  );

  const resolveAccount = useCallback(
    (entId: string, defaultCode: string): GLAccount | undefined => {
      const mapping = mappings.find(
        (m) => m.entityId === entId && m.accountId === defaultCode && m.isActive,
      );
      if (mapping) {
        return lookup.get(mapping.accountId);
      }
      return lookup.get(defaultCode);
    },
    [mappings, lookup],
  );

  const search = useCallback(
    (query: string): GLAccount[] => {
      if (!query.trim()) return [];
      const lower = query.toLowerCase();
      return accounts.filter(
        (a) =>
          a.code.toLowerCase().includes(lower) ||
          a.name.toLowerCase().includes(lower) ||
          a.tags?.some((t) => t.toLowerCase().includes(lower)),
      );
    },
    [accounts],
  );

  const byType = useCallback(
    (type: string) => accounts.filter((a) => a.type === type),
    [accounts],
  );

  const byCategory = useCallback(
    (category: string) => accounts.filter((a) => a.category === category),
    [accounts],
  );

  return {
    accounts,
    rootAccounts,
    getChildren,
    getAccount,
    resolveAccount,
    search,
    byType,
    byCategory,
  };
}

// ============================================================================
// useJournalEntryBuilder
// ============================================================================

export interface JournalEntryBuilderOptions {
  entityId: string;
  currencyCode: string;
  date: string;
  reference: string;
  description: string;
}

export interface JournalEntryBuilderResult {
  entry: Partial<JournalEntry>;
  addLine: (line: Omit<JournalLine, 'id'>) => void;
  removeLine: (index: number) => void;
  updateLine: (index: number, updates: Partial<JournalLine>) => void;
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  reset: () => void;
}

export function useJournalEntryBuilder({
  entityId,
  currencyCode,
  date,
  reference,
  description,
}: JournalEntryBuilderOptions): JournalEntryBuilderResult {
  const [lines, setLines] = useState<JournalLine[]>([]);

  const addLine = useCallback((line: Omit<JournalLine, 'id'>) => {
    setLines((prev) => [...prev, { ...line, id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }]);
  }, []);

  const removeLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateLine = useCallback((index: number, updates: Partial<JournalLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...updates } : line)));
  }, []);

  const totalDebit = useMemo(() => lines.reduce((sum, l) => sum + l.debit, 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((sum, l) => sum + l.credit, 0), [lines]);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const reset = useCallback(() => setLines([]), []);

  const entry = useMemo<Partial<JournalEntry>>(
    () => ({
      id: `je_${Date.now()}`,
      entityId,
      date,
      reference,
      description,
      status: 'DRAFT',
      currencyCode,
      lines: lines.map((l, i) => ({ ...l, id: l.id ?? `line_${i}` })),
    }),
    [entityId, currencyCode, date, reference, description, lines],
  );

  return { entry, addLine, removeLine, updateLine, isBalanced, totalDebit, totalCredit, reset };
}
