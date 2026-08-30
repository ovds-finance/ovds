import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface AppTableProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  stickyFirst?: boolean;
}

export const AppTable: React.FC<AppTableProps> = ({ children, className, loading, stickyFirst }) => (
  <div
    className={[
      'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden',
      'shadow-[0_1px_3px_0_rgb(0_0_0/0.05)] dark:shadow-[0_1px_3px_0_rgb(0_0_0/0.12)] relative',
      className ?? '',
    ].join(' ')}
  >
    {loading && (
      <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl animate-aki-fade-in">
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
          <RefreshCw size={16} className="animate-spin text-emerald-500 dark:text-emerald-400" />
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Loading...</span>
        </div>
      </div>
    )}
    <div
      className={`overflow-x-auto ${stickyFirst ? '[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:bg-white dark:[&_td:first-child]:bg-slate-950 [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:bg-slate-50/80 dark:[&_th:first-child]:bg-slate-900/80 [&_th:first-child]:z-10' : ''}`}
    >
      <table className="w-full border-collapse">{children}</table>
    </div>
  </div>
);

export interface AppThProps {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

export const AppTh: React.FC<AppThProps> = ({ children, align = 'left', width, sortable, sorted, onSort }) => (
  <th
    onClick={sortable ? onSort : undefined}
    className={[
      'px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider',
      'text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap',
      sortable ? 'cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 select-none' : '',
    ].join(' ')}
    style={{ textAlign: align, width }}
    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {sortable && (
        <span className={`transition-colors ${sorted ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
          {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
        </span>
      )}
    </span>
  </th>
);

export interface AppTdProps {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  muted?: boolean;
}

export const AppTd: React.FC<AppTdProps> = ({ children, align = 'left', className, onClick, muted }) => (
  <td
    className={[
      'px-4 py-3 text-[12px] border-b border-slate-50 dark:border-slate-900/50 transition-colors duration-150',
      muted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300',
      onClick ? 'cursor-pointer' : '',
      className ?? '',
    ].join(' ')}
    style={{ textAlign: align }}
    onClick={onClick}
  >
    {children}
  </td>
);

export interface AppTrProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
  highlighted?: boolean;
  danger?: boolean;
}

export const AppTr: React.FC<AppTrProps> = ({ children, onClick, className, selected, highlighted, danger }) => (
  <tr
    onClick={onClick}
    className={[
      'group transition-all duration-150',
      onClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/60 active:bg-slate-100 dark:active:bg-slate-900' : '',
      selected ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : '',
      highlighted ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/60 dark:hover:bg-amber-950/30' : '',
      danger ? 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/50 dark:hover:bg-rose-950/30' : '',
      className ?? '',
    ].join(' ')}
  >
    {children}
  </tr>
);
