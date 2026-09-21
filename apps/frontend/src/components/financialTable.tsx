/**
 * FinancialTable — High-density financial data table with 60-30-10 styling
 * Implements:
 *   - Tabular-nums font for numeric column alignment
 *   - Left-aligned text, right-aligned currency/numbers
 *   - 12px vertical row padding for density
 *   - Hover-to-reveal for line items
 */
import React, { useState } from 'react';

interface ColumnDef<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface FinancialTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  expandable?: boolean;
  renderExpansion?: (row: T) => React.ReactNode;
}

/**
 * Financial table with tabular-nums alignment for numeric columns
 * Uses 60-30-10 color system and 12px vertical padding
 */
export function FinancialTable<T>({
  data,
  columns,
  loading = false,
  className = '',
  onRowClick,
  expandable = false,
  renderExpansion,
}: FinancialTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return <FinancialTableSkeleton columns={columns} />;
  }

  return (
    <div className={`ovds-widget-card overflow-hidden ${className}`}>
      {/* Table header - 30% structure */}
      <div className="ovds-table-header grid gap-3 px-5 py-3.5" style={{
        gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' '),
      }}>
        {columns.map(col => (
          <div
            key={String(col.key)}
            className={`text-[11px] font-bold uppercase tracking-wider ${
              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
            } text-slate-400`}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Table body - 60% background */}
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {data.map((row, i) => {
          const rowId = (row as any).id ?? i;
          const isExpanded = expandedRows.has(String(rowId));
          return (
            <React.Fragment key={rowId}>
              <div
                className={`ovds-table-row grid gap-3 px-5 transition-all duration-150 ${
                  onRowClick || expandable ? 'cursor-pointer' : ''
                } hover:bg-ovds-accent/5`}
                style={{
                  gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' '),
                  minHeight: '48px',
                }}
                onClick={() => {
                  if (expandable) toggleRow(String(rowId));
                  onRowClick?.(row);
                }}
              >
                {columns.map(col => (
                  <div
                    key={String(col.key)}
                    className={`flex items-center ${
                      typeof row[col.key] === 'number' || col.align === 'right'
                        ? 'justify-end text-right font-mono-num tabular-nums font-semibold text-slate-800 dark:text-slate-100'
                        : col.align === 'center'
                          ? 'justify-center text-center text-slate-600 dark:text-slate-300'
                          : 'justify-start text-left text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                  </div>
                ))}
                {expandable && (
                  <div className="col-span-full absolute right-4 top-1/2 -translate-y-1/2">
                    <span className={`ovds-hover-reveal text-xs text-slate-400 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                )}
              </div>

              {/* Expansion panel - secondary details */}
              {expandable && isExpanded && renderExpansion && (
                <div className="ovds-table-expansion bg-[var(--sys-bg-accent)]/30 dark:bg-slate-800/30 px-8 py-4">
                  {renderExpansion(row)}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for financial table
 */
function FinancialTableSkeleton<T>({ columns }: { columns: ColumnDef<T>[] }) {
  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="ovds-table-header grid gap-3 px-5 py-3.5" style={{
        gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' '),
      }}>
        {columns.map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid gap-3 px-5 py-4"
            style={{
              gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' '),
            }}
          >
            {columns.map((_, j) => (
              <div key={j} className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FinancialTable;