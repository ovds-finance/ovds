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
            hiddenCount={hiddenCount}
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
                className="px-4 py-10 text-center text-[11px] font-medium"
                style={{ color: 'var(--text-4)' }}
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
  hiddenCount,
  onToggle,
  onReset,
}: {
  columns: { key: string; label: string; required?: boolean }[];
  visibleKeys: string[];
  hiddenCount: number;
  onToggle: (key: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const visibleSet = useMemo(() => new Set(visibleKeys), [visibleKeys]);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)] active:scale-[0.97]"
        style={
          hiddenCount > 0
            ? { background: 'var(--pro-azure-50)', borderColor: 'var(--pro-azure-100)', color: 'var(--pro-azure-dark)' }
            : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-3)' }
        }
        onMouseEnter={e => {
          if (hiddenCount === 0) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)';
          }
        }}
        onMouseLeave={e => {
          if (hiddenCount === 0) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)';
          }
        }}
        title="Toggle visible columns"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <ChevronsUpDown size={12} />
        <span>Columns</span>
        {hiddenCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: 'var(--pro-azure)', color: '#fff' }}
          >
            {hiddenCount} hidden
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-52 z-50 overflow-hidden rounded-xl"
          role="listbox"
          aria-label="Toggle columns"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
            animation: 'aki-enter 150ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {/* Header */}
          <div
            className="px-3.5 py-2.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-alt)' }}
          >
            <p className="text-[11px] font-bold" style={{ color: 'var(--text-2)' }}>
              Visible Columns
            </p>
            <button
              onClick={onReset}
              className="text-[10px] font-bold transition-colors hover:underline"
              style={{ color: 'var(--pro-azure)' }}
            >
              Reset
            </button>
          </div>

          {/* Column list */}
          <div className="p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
            {columns.map((col) => {
              const isVisible = visibleSet.has(col.key);
              return (
                <button
                  key={col.key}
                  role="option"
                  aria-selected={isVisible}
                  onClick={() => onToggle(col.key)}
                  disabled={col.required}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pro-azure)]"
                  style={{ color: 'var(--text-2)' }}
                  onMouseEnter={e => !col.required && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
                >
                  {/* Checkbox indicator */}
                  <span
                    className="shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center"
                    style={
                      isVisible
                        ? { background: 'var(--pro-azure)', border: '1px solid var(--pro-azure)' }
                        : { background: 'transparent', border: '1.5px solid var(--border)' }
                    }
                  >
                    {isVisible && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 truncate">{col.label}</span>
                  {col.required && (
                    <span
                      className="text-[8px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-5)' }}
                    >
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
