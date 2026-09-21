/**
 * DataRow — Ovds-style high-density financial table row.
 * Right-aligns amounts, left-aligns labels, pill status badge.
 * Uses OVDS design-system tokens — no legacy financial-* classes.
 */
import React from 'react';

export interface DataRowProps {
  id: string;
  client: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  onIdClick?: () => void;
}

const STATUS_CLS: Record<string, string> = {
  Paid:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)] dark:border-green-800',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',
};

const STATUS_DOT: Record<string, string> = {
  Paid:    'bg-[var(--pro-azure)]',
  Pending: 'bg-amber-500',
  Overdue: 'bg-rose-500',
};

export const DataRow: React.FC<DataRowProps> = ({
  id,
  client,
  date,
  amount,
  status,
  onIdClick,
}) => (
  <tr className="border-b border-[var(--border-alt)] hover:bg-[var(--surface-alt)] transition-colors duration-100 group">
    {/* Reference ID */}
    <td className="py-3 px-4 text-[12px] font-semibold font-mono text-[var(--pro-azure)] hover:underline cursor-pointer"
      onClick={onIdClick}>
      {id}
    </td>

    {/* Client name */}
    <td className="py-3 px-4 text-[12px] font-medium text-[var(--text-2)]">
      {client}
    </td>

    {/* Date — left-aligned */}
    <td className="py-3 px-4 text-[12px] text-[var(--text-4)] tabular-nums">
      {date}
    </td>

    {/* Amount — right-aligned, monospace */}
    <td className="py-3 px-4 text-[12px] font-bold text-right tabular-nums font-mono text-[var(--text)]">
      {amount}
    </td>

    {/* Status pill */}
    <td className="py-3 px-4 text-right">
      <span className={[
        'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap',
        STATUS_CLS[status] ?? STATUS_CLS.Pending,
      ].join(' ')}>
        <span className={[
          'w-1.5 h-1.5 rounded-full shrink-0',
          STATUS_DOT[status] ?? 'bg-slate-400',
        ].join(' ')} />
        {status}
      </span>
    </td>
  </tr>
);

export default DataRow;
