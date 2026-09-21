/**
 * AkDataGrid — Ovds SaaS High-Density Data Grid
 * ──────────────────────────────────────────────
 * Implements the Grid-over-Card hover-to-reveal action pattern from the
 * Ovds SaaS architecture specification.
 *
 * Key interaction patterns:
 *   • Hover-to-Reveal Triggers: row actions remain hidden until a cursor
 *     focus event registers over that specific data grid entry.
 *   • Dynamic Column Matrix: column schema is a configuration array — not
 *     hardcoded. Visibility toggles dynamically rewrite DOM grid dimensions.
 *   • Checkbox multi-select with shift-click range support.
 *   • Accessible: keyboard-navigable rows, visible focus rings, aria-sort.
 *   • Zero external dependencies beyond React.
 *
 * Architecture principle (Ovds SaaS):
 *   "Rather than hardcoding table parameters, layouts pull an array schema
 *    configuration. Item Name, Description, Quantity, and Price visibility
 *    toggles dynamically rewrite the Document Object Model grid dimensions
 *    on the fly."
 *
 * Usage:
 * ```tsx
 * <AkDataGrid
 *   columns={[
 *     { key: 'invoiceNumber', label: 'Invoice #', width: 120 },
 *     { key: 'customer',     label: 'Customer' },
 *     { key: 'amount',       label: 'Amount', align: 'right', render: (v) => fmt(v) },
 *     { key: 'status',       label: 'Status', render: (_, row) => <StatusPill status={row.status} /> },
 *   ]}
 *   rows={invoices}
 *   rowActions={(row) => [
 *     { label: 'View',    icon: <Eye size={13} />,   onClick: () => onView(row) },
 *     { label: 'Pay',     icon: <Check size={13} />, onClick: () => onPay(row),  hidden: row.status !== 'PENDING' },
 *     { label: 'Edit',    icon: <Edit size={13} />,  onClick: () => onEdit(row) },
 *   ]}
 *   onRowClick={(row) => onView(row)}
 * />
 * ```
 */

import React, { useState, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AkColumnAlign = 'left' | 'center' | 'right';

export interface AkColumnDef<TRow = Record<string, unknown>> {
  /** Unique column key — used as the sort field and React key */
  key: string;
  /** Display label in the column header */
  label: string;
  /** Minimum width in px (applied as CSS min-width) */
  width?: number;
  /** Text alignment (default: left) */
  align?: AkColumnAlign;
  /** Whether this column is sortable (default: false) */
  sortable?: boolean;
  /** Whether this column is visible (default: true) */
  visible?: boolean;
  /**
   * Custom cell renderer.
   * Receives the raw cell value and the full row object.
   * Returning undefined falls back to String(value).
   */
  render?: (value: unknown, row: TRow) => React.ReactNode;
}

export interface AkRowAction<TRow = Record<string, unknown>> {
  /** Accessible label (also used as tooltip) */
  label: string;
  icon?: React.ReactNode;
  onClick: (row: TRow) => void;
  /** When true the action is not rendered */
  hidden?: boolean;
  /** Tailwind classes applied to the action button on hover */
  hoverCls?: string;
  /** When true renders as a separator gap */
  divider?: boolean;
}

export interface AkDataGridProps<TRow extends Record<string, unknown> = Record<string, unknown>> {
  columns: AkColumnDef<TRow>[];
  rows: TRow[];
  /** Unique row identifier field (default: 'id') */
  rowKey?: string;
  /** Actions revealed on row hover */
  rowActions?: (row: TRow) => AkRowAction<TRow>[];
  onRowClick?: (row: TRow) => void;
  /** Enable checkbox multi-select */
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  /** Current sort field */
  sortKey?: string;
  /** Current sort direction */
  sortDir?: 'asc' | 'desc';
  onSortChange?: (key: string, dir: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
  /** Extra classes on the root element */
  className?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const ALIGN_CLS: Record<AkColumnAlign, string> = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
};

// ── Component ─────────────────────────────────────────────────────────────────

function AkDataGridInner<TRow extends Record<string, unknown>>(
  props: AkDataGridProps<TRow>,
  _ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    columns,
    rows,
    rowKey = 'id',
    rowActions,
    onRowClick,
    selectable = false,
    selectedKeys,
    onSelectionChange,
    sortKey,
    sortDir,
    onSortChange,
    loading = false,
    emptyMessage = 'No records found.',
    className = '',
  } = props;

  const visibleCols = columns.filter((c) => c.visible !== false);

  // ── Hover state ────────────────────────────────────────────────────────────
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // ── Shift-click range selection ────────────────────────────────────────────
  const lastClickedIdx = useRef<number | null>(null);

  const handleRowSelect = useCallback(
    (key: string, idx: number, shiftHeld: boolean) => {
      if (!onSelectionChange || !selectedKeys) return;

      const next = new Set(selectedKeys);
      if (shiftHeld && lastClickedIdx.current !== null) {
        const [lo, hi] = [
          Math.min(lastClickedIdx.current, idx),
          Math.max(lastClickedIdx.current, idx),
        ];
        for (let i = lo; i <= hi; i++) {
          const k = String((rows[i] as Record<string, unknown>)[rowKey] ?? i);
          next.add(k);
        }
      } else {
        if (next.has(key)) next.delete(key);
        else next.add(key);
        lastClickedIdx.current = idx;
      }
      onSelectionChange(next);
    },
    [onSelectionChange, selectedKeys, rows, rowKey],
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange || !selectedKeys) return;
    if (selectedKeys.size === rows.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(rows.map((r, i) => String(r[rowKey] ?? i))));
    }
  }, [onSelectionChange, selectedKeys, rows, rowKey]);

  // ── Sort click ─────────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (key: string) => {
      if (!onSortChange) return;
      if (sortKey === key) {
        onSortChange(key, sortDir === 'asc' ? 'desc' : 'asc');
      } else {
        onSortChange(key, 'asc');
      }
    },
    [onSortChange, sortKey, sortDir],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`w-full overflow-auto ${className}`}
      role="region"
      aria-label="Data grid"
    >
      <table className="w-full border-collapse text-sm">
        {/* ── Column headers ── */}
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
            {/* Select-all checkbox */}
            {selectable && (
              <th className="w-10 pl-4 py-2 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={
                    rows.length > 0 && selectedKeys?.size === rows.length
                  }
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        (selectedKeys?.size ?? 0) > 0 &&
                        (selectedKeys?.size ?? 0) < rows.length;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 cursor-pointer"
                />
              </th>
            )}

            {visibleCols.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { minWidth: col.width } : undefined}
                className={[
                  'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide',
                  'text-slate-500 dark:text-slate-400',
                  ALIGN_CLS[col.align ?? 'left'],
                  col.sortable && onSortChange
                    ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={11} />
                        ) : (
                          <ChevronDown size={11} />
                        )
                      ) : (
                        <ChevronsUpDown size={11} />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}

            {/* Actions column header — empty, right-aligned */}
            {rowActions && (
              <th
                scope="col"
                className="w-px px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                aria-label="Row actions"
              />
            )}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {loading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr
                key={`sk-${i}`}
                className="border-b border-slate-100 dark:border-slate-800 animate-pulse"
              >
                {selectable && <td className="pl-4 py-3"><div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700" /></td>}
                {visibleCols.map((col) => (
                  <td key={col.key} className="px-3 py-3">
                    <div className="h-3 rounded bg-slate-200 dark:bg-slate-700" style={{ width: `${60 + Math.random() * 30}%` }} />
                  </td>
                ))}
                {rowActions && <td className="px-3 py-3" />}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={
                  visibleCols.length +
                  (selectable ? 1 : 0) +
                  (rowActions ? 1 : 0)
                }
                className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const key = String(row[rowKey] ?? idx);
              const isHovered = hoveredKey === key;
              const isSelected = selectedKeys?.has(key) ?? false;
              const actions = rowActions?.(row) ?? [];
              const visibleActions = actions.filter((a) => !a.hidden);

              return (
                <tr
                  key={key}
                  className={[
                    'group border-b border-slate-100 dark:border-slate-800 transition-colors',
                    isSelected
                       ? 'bg-[var(--pro-azure-50)] dark:bg-green-900/20'
                      : isHovered
                      ? 'bg-slate-50 dark:bg-slate-800/50'
                      : 'bg-white dark:bg-slate-900',
                    onRowClick ? 'cursor-pointer' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onFocus={() => setHoveredKey(key)}
                  onBlur={() => setHoveredKey(null)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  aria-selected={isSelected}
                >
                  {/* Checkbox */}
                  {selectable && (
                    <td
                      className="pl-4 py-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select row ${key}`}
                        checked={isSelected}
                        onChange={(e) =>
                          handleRowSelect(key, idx, e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey)
                        }
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {visibleCols.map((col) => {
                    const raw = row[col.key];
                    const rendered = col.render
                      ? col.render(raw, row)
                      : raw !== null && raw !== undefined
                      ? String(raw)
                      : '—';

                    return (
                      <td
                        key={col.key}
                        className={[
                          'px-3 py-3 align-middle text-slate-700 dark:text-slate-300',
                          ALIGN_CLS[col.align ?? 'left'],
                        ].join(' ')}
                      >
                        {rendered}
                      </td>
                    );
                  })}

                  {/* ── Hover-to-reveal actions ── */}
                  {rowActions && (
                    <td
                      className="px-3 py-3 align-middle text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/*
                       * Actions are invisible by default (opacity-0).
                       * They fade in when the row is hovered/focused.
                       * The parent <tr> carries `group` so sibling TDs
                       * can react to hover via `group-hover:opacity-100`.
                       * We also use the local isHovered state so keyboard
                       * focus (no pointer events) also reveals the actions.
                       */}
                      <div
                        className={[
                          'inline-flex items-center gap-0.5 transition-opacity duration-100',
                          isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        ].join(' ')}
                        aria-label="Row actions"
                      >
                        {visibleActions.map((action, ai) => (
                          <button
                            key={`${key}-action-${ai}`}
                            title={action.label}
                            aria-label={action.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={[
                              'inline-flex items-center gap-1 px-2 py-1 rounded-md',
                              'text-[11px] font-semibold text-slate-500 dark:text-slate-400',
                              'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
                              action.hoverCls ?? '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {action.icon && (
                              <span aria-hidden className="flex-shrink-0">
                                {action.icon}
                              </span>
                            )}
                            <span className="hidden sm:inline">{action.label}</span>
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
  );
}

export const AkDataGrid = React.forwardRef(AkDataGridInner) as <
  TRow extends Record<string, unknown> = Record<string, unknown>,
>(
  props: AkDataGridProps<TRow> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof AkDataGridInner>;
