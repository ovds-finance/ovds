import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  sortState: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

/**
 * Table header cell with sort indicator.
 * Works with the `useTableSort` hook.
 *
 * Usage:
 *   const { toggleSort, getSortState } = useTableSort(data);
 *
 *   <SortableHeader
 *     label="Name"
 *     field="lastName"
 *     sortState={getSortState('lastName')}
 *     onSort={toggleSort}
 *   />
 */
export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  sortState,
  onSort,
  className = '',
  align = 'left',
}) => {
  const alignCls =
    align === 'right'
      ? 'justify-end text-right'
      : align === 'center'
        ? 'justify-center text-center'
        : 'justify-start text-left';

  return (
    <th
      className={`px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-300 transition-colors ${className}`}
      onClick={() => onSort(field)}
      aria-sort={
        sortState === 'asc'
          ? 'ascending'
          : sortState === 'desc'
            ? 'descending'
            : 'none'
      }
    >
      <div className={`flex items-center gap-1 ${alignCls}`}>
        <span>{label}</span>
        <span className="shrink-0">
          {sortState === 'asc' ? (
            <ChevronUp size={11} className="text-emerald-600 dark:text-emerald-400" />
          ) : sortState === 'desc' ? (
            <ChevronDown size={11} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ChevronsUpDown size={11} className="text-slate-300 dark:text-slate-600" />
          )}
        </span>
      </div>
    </th>
  );
};
