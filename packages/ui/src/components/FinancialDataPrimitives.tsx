/**
 * FinancialDataPrimitives — OVDS high-density financial data components
 *
 * Implements Ovds-style data density with:
 *   - Right-aligned currency/percentage columns
 *   - Left-aligned label columns
 *   - Hover-to-reveal line items
 *   - Keyboard Tab navigation through line items
 *   - Three-dot row action menus
 *
 * Exports:
 *   ovdsTable        — high-density sortable financial table
 *   ovdsRow          — individual table row with hover reveal
 *   ovdsRowActions   — three-dot menu for table row actions
 *   InvoiceLineItem     — line item row for invoice/bill form
 *   InvoiceLineItemList — sortable list of line items
 *   AccountingRow       — double-entry accounting ledger row
 *   LedgerTable         — debit/credit ledger with running balance
 *   ovdsBadge        — status badge (paid, overdue, pending, draft)
 *   AmountDiff          — shows a diff between two amounts
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// ovdsBadge
// ---------------------------------------------------------------------------
export type ovdsBadgeStatus =
  | 'paid' | 'settled' | 'approved' | 'filed' | 'active'
  | 'overdue' | 'rejected' | 'danger'
  | 'pending' | 'warning'
  | 'draft' | 'cancelled' | 'inactive' | 'closed'
  | 'sent' | 'open' | 'info';

const BADGE_CLS: Record<ovdsBadgeStatus, string> = {
  paid:      'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  settled:   'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  approved:  'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  filed:     'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  active:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  overdue:   'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
  rejected:  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
  danger:    'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
  pending:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  warning:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  draft:     'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  inactive:  'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  closed:    'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  sent:      'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]/10 dark:text-[var(--pro-azure-light)] dark:border-[var(--pro-azure)]/20',
  open:      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800',
  info:      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800',
};

const DOT_CLS: Record<ovdsBadgeStatus, string> = {
  paid: 'bg-[var(--pro-azure)]', settled: 'bg-[var(--pro-azure)]', approved: 'bg-[var(--pro-azure)]',
  filed: 'bg-[var(--pro-azure)]', active: 'bg-[var(--pro-azure)]',
  overdue: 'bg-rose-500', rejected: 'bg-rose-500', danger: 'bg-rose-500',
  pending: 'bg-amber-500', warning: 'bg-amber-500',
  draft: 'bg-slate-400', cancelled: 'bg-slate-300', inactive: 'bg-slate-300', closed: 'bg-slate-300',
  sent: 'bg-[var(--pro-azure)]',
  open: 'bg-violet-500',
  info: 'bg-sky-500',
};

export interface ovdsBadgeProps {
  status: ovdsBadgeStatus;
  label?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const ovdsBadge: React.FC<ovdsBadgeProps> = ({
  status,
  label,
  dot = true,
  size = 'md',
  className,
}) => {
  const display = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
      size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[11px]',
      BADGE_CLS[status],
      className,
    )}>
      {dot && (
        <span className={cn('rounded-full flex-shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', DOT_CLS[status])} />
      )}
      {display}
    </span>
  );
};

// ---------------------------------------------------------------------------
// ovdsRowActions — three-dot action menu
// ---------------------------------------------------------------------------
export interface ovdsRowAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'danger';
  separator?: boolean;
}

export interface ovdsRowActionsProps {
  actions: ovdsRowAction[];
  className?: string;
}

export const ovdsRowActions: React.FC<ovdsRowActionsProps> = ({
  actions,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Row actions"
        className="aki-row-menu w-7 h-7 rounded-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <div
          className="aki-flyout-menu absolute right-0 top-full mt-1 w-44 py-1 z-50"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action, i) => (
            <React.Fragment key={i}>
              {action.separator && <div className="divider" />}
              {action.href ? (
                <a
                  href={action.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                    action.variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300',
                  )}
                >
                  {action.icon && <span className="shrink-0 opacity-70">{action.icon}</span>}
                  {action.label}
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { action.onClick?.(); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left',
                    action.variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300',
                  )}
                >
                  {action.icon && <span className="shrink-0 opacity-70">{action.icon}</span>}
                  {action.label}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// InvoiceLineItem — keyboard-navigable line item row
// ---------------------------------------------------------------------------
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
  unit?: string;
  notes?: string;
}

export interface InvoiceLineItemProps {
  item: LineItem;
  index: number;
  onChange?: (id: string, field: keyof LineItem, value: string | number) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
  currencySymbol?: string;
}

export const InvoiceLineItem: React.FC<InvoiceLineItemProps> = ({
  item,
  index,
  onChange,
  onDelete,
  readOnly = false,
  currencySymbol = 'ETB',
}) => {
  const inputCls = cn(
    'w-full bg-transparent outline-none text-[12px] font-medium text-slate-700 dark:text-slate-300',
    'focus:bg-[var(--pro-azure-50)] dark:focus:bg-blue-950/30 rounded px-1.5 py-1',
    'transition-colors duration-100',
    readOnly && 'cursor-default pointer-events-none',
  );

  return (
    <div className="grid items-center border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors"
      style={{ gridTemplateColumns: '2.5rem 1fr 5rem 6.5rem 5rem 5.5rem 2.5rem' }}
    >
      {/* Row number */}
      <span className="text-center text-[10px] text-slate-400 py-2.5">{index + 1}</span>

      {/* Description */}
      <div className="px-2 py-2">
        <input
          className={inputCls}
          value={item.description}
          onChange={e => onChange?.(item.id, 'description', e.target.value)}
          placeholder="Description of goods/services"
          readOnly={readOnly}
          aria-label={`Line item ${index + 1} description`}
        />
        {item.notes && (
          <p className="text-[10px] text-slate-400 mt-0.5 px-1.5">{item.notes}</p>
        )}
      </div>

      {/* Quantity */}
      <div className="px-2 py-2">
        <input
          className={cn(inputCls, 'text-right')}
          type="number"
          min={0}
          value={item.quantity}
          onChange={e => onChange?.(item.id, 'quantity', parseFloat(e.target.value) || 0)}
          readOnly={readOnly}
          aria-label={`Line item ${index + 1} quantity`}
        />
      </div>

      {/* Unit price */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] text-slate-400 shrink-0">{currencySymbol}</span>
          <input
            className={cn(inputCls, 'text-right font-mono tabular-nums')}
            type="number"
            min={0}
            step={0.01}
            value={item.unitPrice}
            onChange={e => onChange?.(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
            readOnly={readOnly}
            aria-label={`Line item ${index + 1} unit price`}
          />
        </div>
      </div>

      {/* Tax rate */}
      <div className="px-2 py-2">
        <input
          className={cn(inputCls, 'text-right')}
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={item.taxRate ?? 0}
          onChange={e => onChange?.(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
          readOnly={readOnly}
          aria-label={`Line item ${index + 1} tax rate`}
        />
      </div>

      {/* Total */}
      <div className="px-2 py-2 text-right">
        <span className="text-[12px] font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100">
          {item.total.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Delete */}
      {!readOnly && (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onDelete?.(item.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            aria-label={`Delete line item ${index + 1}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// InvoiceLineItemList
// ---------------------------------------------------------------------------
export interface InvoiceLineItemListProps {
  items: LineItem[];
  onChange?: (id: string, field: keyof LineItem, value: string | number) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  readOnly?: boolean;
  currencySymbol?: string;
  className?: string;
}

export const InvoiceLineItemList: React.FC<InvoiceLineItemListProps> = ({
  items,
  onChange,
  onDelete,
  onAdd,
  readOnly = false,
  currencySymbol = 'ETB',
  className,
}) => (
  <div className={cn('aki-table-wrap', className)}>
    {/* Header */}
    <div
      className="grid bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700"
      style={{ gridTemplateColumns: '2.5rem 1fr 5rem 6.5rem 5rem 5.5rem 2.5rem' }}
    >
      <span className="text-center py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">#</span>
      <span className="px-2 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
      <span className="px-2 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Qty</span>
      <span className="px-2 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Unit Price</span>
      <span className="px-2 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Tax %</span>
      <span className="px-2 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total</span>
      <span />
    </div>

    {/* Rows */}
    {items.map((item, i) => (
      <InvoiceLineItem
        key={item.id}
        item={item}
        index={i}
        onChange={onChange}
        onDelete={onDelete}
        readOnly={readOnly}
        currencySymbol={currencySymbol}
      />
    ))}

    {/* Add row */}
    {!readOnly && onAdd && (
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 text-[12px] font-semibold text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add line item
        </button>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// LedgerTable — debit/credit with running balance
// ---------------------------------------------------------------------------
export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  debit?: number;
  credit?: number;
  balance: number;
  type?: string;
}

export interface LedgerTableProps {
  entries: LedgerEntry[];
  currency?: string;
  loading?: boolean;
  onRowClick?: (entry: LedgerEntry) => void;
  className?: string;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  entries,
  currency = 'ETB',
  loading = false,
  onRowClick,
  className,
}) => {
  const fmt = (n?: number) =>
    n !== undefined
      ? n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';

  return (
    <div className={cn('aki-table-wrap overflow-x-auto', className)}>
      <table className="aki-table w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Reference</th>
            <th className="right">Debit</th>
            <th className="right">Credit</th>
            <th className="right">Balance ({currency})</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j}><div className="aki-skeleton h-3 rounded" style={{ width: j === 1 ? 180 : 80 }} /></td>
                ))}
              </tr>
            ))
          ) : entries.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <div className="ovds-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-slate-300">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p className="ovds-body">No ledger entries</p>
                </div>
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr
                key={entry.id}
                onClick={onRowClick ? () => onRowClick(entry) : undefined}
                className={cn(onRowClick && 'clickable')}
              >
                <td className="mono text-slate-500">{entry.date}</td>
                <td>{entry.description}</td>
                <td className="muted mono">{entry.reference ?? '—'}</td>
                <td className={cn('right mono', entry.debit ? 'text-slate-800 dark:text-slate-200' : 'muted')}>
                  {entry.debit ? fmt(entry.debit) : '—'}
                </td>
                <td className={cn('right mono', entry.credit ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'muted')}>
                  {entry.credit ? fmt(entry.credit) : '—'}
                </td>
                <td className={cn(
                  'right mono font-bold',
                  entry.balance >= 0
                    ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                    : 'text-rose-500 dark:text-rose-400',
                )}>
                  {fmt(entry.balance)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AmountDiff — shows change between two amounts
// ---------------------------------------------------------------------------
export interface AmountDiffProps {
  before: number;
  after: number;
  currency?: string;
  className?: string;
}

export const AmountDiff: React.FC<AmountDiffProps> = ({
  before,
  after,
  currency = 'ETB',
  className,
}) => {
  const diff = after - before;
  const pct = before !== 0 ? (diff / Math.abs(before)) * 100 : 0;
  const positive = diff >= 0;
  const fmt = (n: number) =>
    n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={cn('flex items-center gap-2 font-mono tabular-nums', className)}>
      <span className="text-slate-400 text-[11px]">{currency} {fmt(before)}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
      <span className="text-slate-700 dark:text-slate-200 text-[13px] font-bold">{currency} {fmt(after)}</span>
      {diff !== 0 && (
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          positive
            ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)]'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
        )}>
          {positive ? '+' : ''}{pct.toFixed(1)}%
        </span>
      )}
    </div>
  );
};
