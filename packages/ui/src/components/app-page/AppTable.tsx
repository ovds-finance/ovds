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
      'border rounded-lg overflow-hidden relative',
      'shadow-[var(--card-shadow)]',
      className ?? '',
    ].join(' ')}
    style={{
      background: 'var(--surface)',
      borderColor: 'var(--border)',
    }}
  >
    {loading && (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center rounded-lg animate-[aki-fade-in_160ms_ease_both]"
        style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(1px)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--card-shadow-raised)',
          }}
        >
          <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--pro-azure)' }} />
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>
            Loading…
          </span>
        </div>
      </div>
    )}
    <div
      className={`overflow-x-auto ${stickyFirst ? '[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-10' : ''}`}
      style={stickyFirst ? {
        ['--tw-bg-opacity' as string]: '1',
      } : undefined}
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
      'px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
      sortable ? 'cursor-pointer select-none' : '',
    ].join(' ')}
    style={{
      textAlign: align,
      width,
      color: 'var(--text-4)',
      background: 'var(--sys-bg-subtle)',
      borderBottom: '1px solid var(--border)',
    }}
    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
  >
    <span
      className="inline-flex items-center gap-1 transition-colors duration-100"
      style={sortable ? { color: sorted ? 'var(--text-2)' : 'var(--text-4)' } : undefined}
      onMouseEnter={sortable ? (e) => {
        if (!sorted) (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-2)';
      } : undefined}
      onMouseLeave={sortable ? (e) => {
        if (!sorted) (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-4)';
      } : undefined}
    >
      {children}
      {sortable && (
        <span style={{ color: sorted ? 'var(--pro-azure)' : 'var(--text-5)', fontSize: 10 }}>
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
      'px-4 py-3 text-[12px] transition-colors duration-100',
      onClick ? 'cursor-pointer' : '',
      className ?? '',
    ].join(' ')}
    style={{
      textAlign: align,
      color: muted ? 'var(--text-4)' : 'var(--text-2)',
      borderBottom: '1px solid var(--border-alt)',
    }}
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
      'group transition-colors duration-100',
      onClick ? 'cursor-pointer' : '',
      className ?? '',
    ].join(' ')}
    style={{
      background:
        selected    ? 'var(--pro-azure-50)'
        : highlighted ? '#FFFBEB'
        : danger      ? '#FEF2F2'
        : 'transparent',
    }}
    onMouseEnter={onClick ? (e) => {
      if (!selected && !highlighted && !danger) {
        (e.currentTarget as HTMLTableRowElement).style.background = 'var(--sys-bg-subtle)';
      }
    } : undefined}
    onMouseLeave={onClick ? (e) => {
      (e.currentTarget as HTMLTableRowElement).style.background =
        selected    ? 'var(--pro-azure-50)'
        : highlighted ? '#FFFBEB'
        : danger      ? '#FEF2F2'
        : 'transparent';
    } : undefined}
  >
    {children}
  </tr>
);
