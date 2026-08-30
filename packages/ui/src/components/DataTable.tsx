import React, { useState, useMemo, useCallback } from 'react';
import { ChevronsUpDown } from 'lucide-react';

export type SortOrder = 'asc' | 'desc';
import { AppTable, AppTh, AppTd, AppTr } from './AppPage';
import { Pagination } from './Pagination';
import { useTableSort } from '../hooks/useTableSort';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface DataTableColumn<T> {
  /** Unique key — also used as the sort field (supports dot paths like 'department.name') */
  key: string;
  /** Header label */
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Enable client-side sorting on this column */
  sortable?: boolean;
  /** Mark as required so the user cannot hide it via the column toggle */
  required?: boolean;
  /** Custom cell renderer. Receives the whole row. */
  render?: (row: T) => React.ReactNode;
  /** Accessor used for sorting when no `render`/sort based on row[key]. Defaults to row[key]. */
  sortValue?: (row: T) => string | number | null;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Unique id for this table — used to persist column visibility + sort state */
  storageKey: string;
  loading?: boolean;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  /** Extra trailing column (e.g. row actions) rendered after data columns */
  actionHeader?: string;
  renderActions?: (row: T) => React.ReactNode;
  /** Pagination */
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /** Show the column-visibility toggle button (top-right) */
  columnToggle?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * DataTable — composable data table for the OVDS design system.
 *
 * Combines client-side sorting (via `useTableSort`), per-column visibility
 * (persisted to localStorage), and optional server-style pagination into a
 * single reusable component. Sort state and hidden columns are persisted per
 * `storageKey` so they survive reloads.
 *
 * Usage:
 *   <DataTable
 *     storageKey="transactions"
 *     data={rows}
 *     columns={cols}
 *     page={page} total={total} pageSize={25} onPageChange={setPage}
 *     renderActions={(r) => <button>…</button>}
 *   />
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  storageKey,
  loading = false,
  rowKey,
  onRowClick,
  actionHeader = 'Actions',
  renderActions,
  page = 1,
  pageSize = 25,
  total,
  onPageChange,
  columnToggle = true,
  emptyMessage = 'No records found',
  className,
}: DataTableProps<T>) {
  const [visibleKeys, setVisibleKeys] = useLocalStorage<string[]>(
    `dt_cols_${storageKey}`,
    columns.map((c) => c.key),
  );

  const visibleSet = useMemo(() => new Set(visibleKeys), [visibleKeys]);
  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleSet.has(c.key)),
    [columns, visibleSet],
  );

  const sortableColumns = useMemo(
    () => visibleColumns.filter((c) => c.sortable),
    [visibleColumns],
  );

  const { toggleSort, getSortState, sorted } = useTableSort<T>(data, {
    defaultField: sortableColumns[0]?.key ?? '',
    comparator: useCallback(
      (a: T, b: T, field: string, dir: 'asc' | 'desc') => {
        const col = columns.find((c) => c.key === field);
        const getVal = (row: T): string | number | null => {
          if (col?.sortValue) return col.sortValue(row);
          const path = field.split('.');
          return path.reduce<any>((acc, k) => acc?.[k], row) ?? null;
        };
        const av = getVal(a);
        const bv = getVal(b);
        if (av == null && bv == null) return 0;
        if (av == null) return dir === 'asc' ? 1 : -1;
        if (bv == null) return dir === 'asc' ? -1 : 1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return dir === 'asc' ? av - bv : bv - av;
        }
        const sa = String(av).toLowerCase();
        const sb = String(bv).toLowerCase();
        if (sa < sb) return dir === 'asc' ? -1 : 1;
        if (sa > sb) return dir === 'asc' ? 1 : -1;
        return 0;
      },
      [columns],
    ),
  });

  const toggleColumn = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (col?.required) return;
    const has = visibleSet.has(key);
    setVisibleKeys((prev) =>
      has ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const resetColumns = () => setVisibleKeys(columns.map((c) => c.key));

  const hiddenCount = columns.filter((c) => !visibleSet.has(c.key)).length;
  const totalCount = total ?? sorted.length;

  return (
    <div className={className}>
      {columnToggle && (
        <div className="flex items-center justify-end mb-2">
          <ColumnToggleButton
            columns={columns}
            visibleKeys={visibleKeys}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        </div>
      )}

      <AppTable loading={loading}>
        <thead>
          <tr>
            {visibleColumns.map((col) => (
              <AppTh
                key={col.key}
                align={col.align}
                width={col.width}
                sortable={col.sortable}
                sorted={col.sortable ? (getSortState(col.key) ?? false) : false}
                onSort={col.sortable ? () => toggleSort(col.key) : undefined}
              >
                {col.label}
              </AppTh>
            ))}
            {renderActions && <AppTh align="right">{actionHeader}</AppTh>}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && !loading ? (
            <tr>
              <td
                colSpan={visibleColumns.length + (renderActions ? 1 : 0)}
                className="px-4 py-10 text-center text-[12px] text-slate-400 dark:text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => {
              const key = rowKey ? rowKey(row, i) : (row as any).id ?? i;
              return (
                <AppTr key={key} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                  {visibleColumns.map((col) => (
                    <AppTd key={col.key} align={col.align}>
                      {col.render ? col.render(row) : (row as any)[col.key] ?? '—'}
                    </AppTd>
                  ))}
                  {renderActions && (
                    <AppTd align="right">
                      <div className="flex items-center justify-end gap-1">{renderActions(row)}</div>
                    </AppTd>
                  )}
                </AppTr>
              );
            })
          )}
        </tbody>
      </AppTable>

      {onPageChange && totalCount > 0 && (
        <div className="mt-3">
          <Pagination page={page} total={totalCount} pageSize={pageSize} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
}

function ColumnToggleButton({
  columns,
  visibleKeys,
  onToggle,
  onReset,
}: {
  columns: { key: string; label: string; required?: boolean }[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const visibleSet = useMemo(() => new Set(visibleKeys), [visibleKeys]);
  const hiddenCount = columns.length - visibleSet.size;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
          hiddenCount > 0
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
        title="Toggle columns"
      >
        <ChevronsUpDown size={13} />
        <span>Columns</span>
        {hiddenCount > 0 && (
          <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-medium rounded-full">
            {hiddenCount} hidden
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Visible Columns</p>
            <button
              onClick={onReset}
              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
            {columns.map((col) => {
              const isVisible = visibleSet.has(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => onToggle(col.key)}
                  disabled={col.required}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span
                    className={`shrink-0 w-3.5 h-3.5 rounded border ${
                      isVisible
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  <span className="flex-1">{col.label}</span>
                  {col.required && (
                    <span className="text-[8px] font-semibold text-slate-300 uppercase tracking-wider">
                      Required
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
