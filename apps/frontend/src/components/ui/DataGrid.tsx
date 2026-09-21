/**
 * DataGrid — Ovds SaaS Grid-over-Card Layout System
 * ──────────────────────────────────────────────────
 * High-density accounting data grid inspired by Akaunting's list view.
 *
 * Design principles:
 *  • Hover-to-Reveal row actions — action slot stays hidden until the row
 *    receives a pointer-enter event, preserving clean workspace real estate.
 *  • Dynamic Column Matrix — columns are driven by a schema array so the DOM
 *    grid reflows automatically when columns are toggled at runtime.
 *  • Pure state-reflection — this component holds NO server state. It only
 *    reflects the rows / columns arrays it receives and dispatches user
 *    actions upward via callbacks.
 *  • Status-badge semantics are unified through the `StatusBadge` component.
 *  • Accessible: keyboard-navigable rows, ARIA roles, focus indicators.
 */

import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import React, { useState, useCallback, useId } from 'react';

// ── Column definition ─────────────────────────────────────────────────────────

export type ColAlign = 'left' | 'center' | 'right';

export interface GridColumn<TRow = Record<string, unknown>> {
  /** Stable key — must be unique within the column set. */
  key: string;
  /** Column header label. */
  label: string;
  /**
   * Render function for a cell. Receives the full row object plus the
   * specific cell value (pre-extracted for convenience).
   */
  render?: (value: unknown, row: TRow, rowIndex: number) => React.ReactNode;
  /** Text alignment within the cell. Defaults to 'left'. */
  align?: ColAlign;
  /** Tailwind width class, e.g. 'w-32' or 'w-auto'. Omit for auto. */
  width?: string;
  /** Whether this column can be sorted. Defaults to false. */
  sortable?: boolean;
  /** Whether this column can be hidden by the user. Defaults to true. */
  hideable?: boolean;
  /** Hidden columns are omitted from the render pass entirely. */
  hidden?: boolean;
  /** Required columns cannot be hidden. */
  required?: boolean;
}

// ── Row action ────────────────────────────────────────────────────────────────

export interface GridRowAction<TRow = Record<string, unknown>> {
  /** Stable key for React reconciliation. */
  key: string;
  /** Tooltip label. */
  label: string;
  /** Icon element to render inside the action button. */
  icon: React.ReactNode;
  /**
   * Optional: control whether the action renders for a given row.
   * If omitted the action is always shown.
   */
  visible?: (row: TRow) => boolean;
  /** Destructive actions render in rose on hover. */
  destructive?: boolean;
  onClick: (row: TRow) => void;
}

// ── Sort state ────────────────────────────────────────────────────────────────

export interface GridSortState {
  key: string;
  dir: 'asc' | 'desc';
}

// ── DataGrid props ────────────────────────────────────────────────────────────

export interface DataGridProps<TRow extends { id: string } = { id: string } & Record<string, unknown>> {
  /** Column schema — drives both header and cell rendering. */
  columns: GridColumn<TRow>[];
  /** Row data. Each row must have a unique `id` string field. */
  rows: TRow[];
  /** Row actions revealed on hover. */
  rowActions?: GridRowAction<TRow>[];
  /** Called when a non-action area of a row is clicked. */
  onRowClick?: (row: TRow) => void;
  /** Controlled sort state. If provided, header clicks call onSortChange. */
  sortState?: GridSortState;
  onSortChange?: (sort: GridSortState) => void;
  /** Whether to show the loading overlay. */
  loading?: boolean;
  /** Message shown when `rows` is empty and `loading` is false. */
  emptyMessage?: string;
  /** Empty state sub-message. */
  emptySubMessage?: string;
  /** Empty state CTA slot. */
  emptyAction?: React.ReactNode;
  /** Additional class names on the root wrapper. */
  className?: string;
  /** Row-level highlight predicate — adds a left accent stripe. */
  highlightRow?: (row: TRow) => 'warning' | 'danger' | 'success' | false;
}

// ── Status badge semantics ────────────────────────────────────────────────────
// Keep the badge palette co-located so the grid is fully self-contained.

const STATUS_BADGE_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT:     { bg: 'bg-slate-100 dark:bg-slate-800',           text: 'text-slate-600 dark:text-slate-300',            dot: 'bg-slate-400' },
  PENDING:   { bg: 'bg-amber-50 dark:bg-amber-900/20',         text: 'text-amber-700 dark:text-amber-400',            dot: 'bg-amber-500' },
  SENT:      { bg: 'bg-sky-50 dark:bg-sky-900/20',             text: 'text-sky-700 dark:text-sky-400',                dot: 'bg-sky-500' },
  PAID:      { bg: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20',     text: 'text-[var(--pro-azure-dark)] dark:text-green-400',        dot: 'bg-[var(--pro-azure)]' },
  PARTIAL:   { bg: 'bg-violet-50 dark:bg-violet-900/20',       text: 'text-violet-700 dark:text-violet-400',          dot: 'bg-violet-500' },
  OVERDUE:   { bg: 'bg-rose-50 dark:bg-rose-900/20',           text: 'text-rose-700 dark:text-rose-400',              dot: 'bg-rose-500' },
  CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-800',           text: 'text-slate-500 dark:text-slate-400',            dot: 'bg-slate-300' },
  ACTIVE:    { bg: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20',     text: 'text-[var(--pro-azure-dark)] dark:text-green-400',        dot: 'bg-[var(--pro-azure)]' },
  INACTIVE:  { bg: 'bg-slate-100 dark:bg-slate-800',           text: 'text-slate-500 dark:text-slate-400',            dot: 'bg-slate-400' },
  OPEN:      { bg: 'bg-blue-50 dark:bg-blue-900/20',           text: 'text-blue-700 dark:text-blue-400',              dot: 'bg-blue-500' },
  CLOSED:    { bg: 'bg-slate-100 dark:bg-slate-800',           text: 'text-slate-500 dark:text-slate-400',            dot: 'bg-slate-300' },
  WON:       { bg: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20',     text: 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',        dot: 'bg-[var(--pro-azure-50)]0' },
  LOST:      { bg: 'bg-rose-50 dark:bg-rose-900/20',           text: 'text-rose-700 dark:text-rose-400',              dot: 'bg-rose-500' },
  LEAD:      { bg: 'bg-amber-50 dark:bg-amber-900/20',         text: 'text-amber-700 dark:text-amber-400',            dot: 'bg-amber-500' },
};

/**
 * Reusable status badge — exported so page-level code can also consume it
 * without coupling to the full DataGrid.
 */
export const GridStatusBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const meta = STATUS_BADGE_MAP[status.toUpperCase()] ?? {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${meta.bg} ${meta.text}`}
      aria-label={`Status: ${label ?? status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} aria-hidden="true" />
      {label ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

// ── Row highlight stripe ──────────────────────────────────────────────────────

const HIGHLIGHT_STRIPE: Record<string, string> = {
  warning: 'border-l-2 border-l-amber-400',
  danger:  'border-l-2 border-l-rose-500',
  success: 'border-l-2 border-l-indigo-500',
};

// ── Sort indicator ────────────────────────────────────────────────────────────

const SortIndicator: React.FC<{ col: GridColumn; sort?: GridSortState }> = ({ col, sort }) => {
  if (!col.sortable) return null;
  const active = sort?.key === col.key;
  const dir = sort?.dir ?? 'asc';
  return (
    <span className={`inline-flex flex-col gap-0 ml-1 ${active ? 'opacity-100' : 'opacity-30'}`} aria-hidden="true">
      <ChevronUp size={9} className={active && dir === 'asc' ? 'text-[var(--pro-azure)]' : ''} />
      <ChevronDown size={9} className={active && dir === 'desc' ? 'text-[var(--pro-azure)]' : ''} />
    </span>
  );
};

// ── Alignment mapping ─────────────────────────────────────────────────────────

const ALIGN_TH: Record<ColAlign, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };
const ALIGN_TD: Record<ColAlign, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };

// ── DataGrid component ────────────────────────────────────────────────────────

function DataGridInner<TRow extends { id: string } = { id: string } & Record<string, unknown>>(
  props: DataGridProps<TRow>,
  _ref: React.ForwardedRef<HTMLTableElement>,
) {
  const {
    columns,
    rows,
    rowActions = [],
    onRowClick,
    sortState,
    onSortChange,
    loading = false,
    emptyMessage = 'No records found',
    emptySubMessage = 'Try adjusting your filters or create a new record.',
    emptyAction,
    className = '',
    highlightRow,
  } = props;

  const tableId = useId();

  // Hover state keyed by row id — avoids re-rendering the entire grid on every
  // mouse event by only toggling the single hovered row.
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const handleHeaderClick = useCallback(
    (col: GridColumn<TRow>) => {
      if (!col.sortable || !onSortChange) return;
      if (sortState?.key === col.key) {
        onSortChange({ key: col.key, dir: sortState.dir === 'asc' ? 'desc' : 'asc' });
      } else {
        onSortChange({ key: col.key, dir: 'asc' });
      }
    },
    [sortState, onSortChange],
  );

  // Visible columns only
  const visibleCols = columns.filter((c) => !c.hidden);

  // Whether the row actions column should render
  const hasActions = rowActions.length > 0;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${className}`}>
      {/* Loading overlay */}
      {loading && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm"
          aria-live="polite"
          aria-label="Loading data"
        >
          <Loader2 size={22} className="animate-spin text-[var(--pro-azure)]" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table
          id={tableId}
          className="w-full text-sm border-collapse"
          role="grid"
          aria-busy={loading}
          aria-rowcount={rows.length}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={[
                    'px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap select-none',
                    ALIGN_TH[col.align ?? 'left'],
                    col.width ?? '',
                    col.sortable ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors' : '',
                  ].join(' ')}
                  onClick={() => handleHeaderClick(col as GridColumn<TRow>)}
                  aria-sort={
                    sortState?.key === col.key
                      ? sortState.dir === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    <SortIndicator col={col as GridColumn} sort={sortState} />
                  </span>
                </th>
              ))}
              {/* Fixed-width actions column — always last */}
              {hasActions && (
                <th
                  scope="col"
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-10 whitespace-nowrap"
                >
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={visibleCols.length + (hasActions ? 1 : 0)}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-slate-300 dark:text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{emptyMessage}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{emptySubMessage}</p>
                    </div>
                    {emptyAction && <div>{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const isHovered = hoveredRowId === row.id;
                const highlight = highlightRow ? highlightRow(row) : false;

                return (
                  <tr
                    key={row.id}
                    role="row"
                    aria-rowindex={rowIndex + 1}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={[
                      'group border-b border-slate-100 dark:border-slate-800 last:border-0',
                      'transition-colors duration-100',
                      isHovered ? 'bg-slate-50/80 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-900',
                      onRowClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pro-azure)]/40' : '',
                      highlight ? HIGHLIGHT_STRIPE[highlight] : '',
                    ].join(' ')}
                    onMouseEnter={() => setHoveredRowId(row.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                  >
                    {/* Data cells */}
                    {visibleCols.map((col) => {
                      const value = (row as Record<string, unknown>)[col.key];
                      return (
                        <td
                          key={col.key}
                          className={[
                            'px-4 py-3 text-sm text-slate-700 dark:text-slate-200',
                            ALIGN_TD[col.align ?? 'left'],
                            col.width ?? '',
                          ].join(' ')}
                        >
                          {col.render ? col.render(value, row, rowIndex) : (
                            <span className="tabular-nums">{value == null ? '—' : String(value)}</span>
                          )}
                        </td>
                      );
                    })}

                    {/* ── Hover-to-Reveal action cell ──────────────────── */}
                    {hasActions && (
                      <td
                        className="px-3 py-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={[
                            'inline-flex items-center gap-0.5 transition-all duration-150',
                            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none',
                          ].join(' ')}
                          role="group"
                          aria-label="Row actions"
                        >
                          {rowActions
                            .filter((a) => !a.visible || a.visible(row))
                            .map((action) => (
                              <button
                                key={action.key}
                                type="button"
                                title={action.label}
                                aria-label={action.label}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                                className={[
                                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                                  action.destructive
                                    ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
                                ].join(' ')}
                              >
                                {action.icon}
                              </button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Forward-ref wrapper preserves generic type parameter through forwardRef
export const DataGrid = React.forwardRef(DataGridInner) as <
  TRow extends { id: string } = { id: string } & Record<string, unknown>,
>(
  props: DataGridProps<TRow> & { ref?: React.ForwardedRef<HTMLTableElement> },
) => React.ReactElement;
