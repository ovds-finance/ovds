import {
  Search, FileText, CheckCircle2, AlertTriangle, Send, Trash2,
  Printer, ChevronLeft, ChevronRight, ArrowDownToLine, RefreshCw, Repeat2,
  Plus, Calendar, ChevronDown, ChevronUp, MoreHorizontal, Eye, Copy,
  Bell, Filter, X, Banknote, Tag, Zap, Archive, Flame, CircleDollarSign,
  TrendingDown, Sparkles, ShieldCheck, Keyboard,
} from 'lucide-react';
import React, { useMemo, useCallback, memo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import type { Invoice } from '../pages/Invoices';
import { confirm } from '../utils/confirm';
import type { EimsFilter } from '../utils/eimsBadge';
import { eimsBadgeLabel } from '../utils/eimsBadge';
import { fmtDate, fmtDateShort, fmtDecimal } from '../utils/fmt';

import ColumnToggle from './columnToggle';

// -- Types ---------------------------------------------------------------------
type StatusTab = 'ALL' | 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
type SourceFilter = 'ALL' | 'MANUAL' | 'TELECOM' | 'BANK_QR' | 'CHAPA' | 'BANK_TRANSFER' | 'CASH';
type SortField = 'date' | 'dueDate' | 'totalAmount' | 'subtotal' | 'customer' | 'invoiceNumber';
type SortDir = 'asc' | 'desc';

const INVOICE_COLUMNS = [
  { key: 'invoiceNumber', label: 'Invoice #', required: true },
  { key: 'customer',      label: 'Customer',  required: true },
  { key: 'date',          label: 'Date' },
  { key: 'dueDate',       label: 'Due Date' },
  { key: 'status',        label: 'Status' },
  { key: 'source',        label: 'Source' },
  { key: 'subtotal',      label: 'Subtotal' },
  { key: 'vat',           label: 'VAT' },
  { key: 'total',         label: 'Total',    required: true },
  { key: 'eims',          label: 'EIMS / MoR' },
  { key: 'ifrs',          label: 'IFRS' },
  { key: 'actions',       label: 'Actions',  required: true },
];

export const DEFAULT_INVOICE_COLUMN_KEYS = INVOICE_COLUMNS.map((c) => c.key);

const STATUS_META: Record<string, { badge: string; dot: string; label: string }> = {
  PAID:      { badge: 'solid-success', dot: 'bg-[var(--pro-azure-50)]0', label: 'Paid' },
  PENDING:   { badge: 'solid-warning', dot: 'bg-amber-500',   label: 'Pending' },
  OVERDUE:   { badge: 'solid-danger',  dot: 'bg-rose-500',     label: 'Overdue' },
  DRAFT:     { badge: 'solid-default', dot: 'bg-slate-400',   label: 'Draft' },
  CANCELLED: { badge: 'solid-default', dot: 'bg-slate-300', label: 'Cancelled' },
};

const SOURCE_META: Record<string, { icon: string; label: string }> = {
  TELECOM:      { icon: '📱', label: 'Telebirr' },
  BANK_QR:      { icon: '🏦', label: 'Bank QR' },
  BANK_TRANSFER:{ icon: '🏦', label: 'Bank' },
  CHAPA:        { icon: '💳', label: 'Chapa' },
  CASH:         { icon: '💵', label: 'Cash' },
  MANUAL:       { icon: '✍️', label: 'Manual' },
};

// fmtDate imported from ../utils/fmt — handles null/undefined and returns '—'

// -- Props ---------------------------------------------------------------------
interface Props {
  invoices: Invoice[];
  stats: Record<string, unknown> | null;
  statusCounts: Record<string, number>;
  loading: boolean;
  totalInvoices: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  statusTab: StatusTab;
  sourceFilter: SourceFilter;
  eimsFilter?: EimsFilter;
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  sortField: SortField;
  sortDir: SortDir;
  visibleCols: Set<string>;
  selected: Set<string>;
  settings: Record<string, unknown>;
  currency: string;
  onStatusTabChange: (tab: StatusTab) => void;
  onSourceFilterChange: (filter: SourceFilter) => void;
  onEimsFilterChange?: (filter: EimsFilter) => void;
  onSearchChange: (term: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onSortChange: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onToggleCol: (col: string) => void;
  onToggleAll: () => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
  onPrint: (inv: Invoice) => void;
  onBulkSend: () => void;
  onBulkEimsRegister?: () => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkDelete: () => void;
  onBulkDuplicate?: () => void;
  onExportCSV: () => void;
  onRefresh: () => void;
  onNewInvoice: () => void;
  onIngestionHub?: () => void;
  onFlagOverdue?: () => void;
  onDuplicate?: (id: string) => void;
  onCreditNote?: (id: string) => void;
  onVoid?: (id: string) => void;
  onBulkArchive?: () => void;
  onRecordPayment?: (inv: Invoice) => void;
  onSendReminder?: (id: string) => void;
  onRowClick?: (inv: Invoice) => void;
}

// -- Hover-to-reveal summary card ---------------------------------------------
const InvoiceHoverCard: React.FC<{ inv: Invoice; currency: string; fmt: (n: number) => string }> = ({ inv, currency, fmt }) => {
  const statusMeta = STATUS_META[inv.status] ?? STATUS_META.DRAFT;
  const totalPaid = (inv.payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0);
  const remaining = Math.max(0, Number(inv.totalAmount) - totalPaid);
  return (
    <div className="aki-flyout-menu absolute left-full top-0 ml-3 z-[200] w-64 p-4 pointer-events-none">
      {/* Arrow */}
      <span className="absolute right-full top-5 border-4 border-transparent" style={{ borderRightColor: 'var(--surface)' }} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold" style={{ color: 'var(--aki-blue)' }}>{inv.invoiceNumber}</p>
        <span className={`aki-badge ${statusMeta.badge} sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </span>
      </div>
      <div className="space-y-2 text-[11px]">
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-4)' }}>Customer</span>
          <span className="font-bold truncate max-w-[140px] text-right" style={{ color: 'var(--text)' }}>
            {inv.customer}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-4)' }}>Date</span>
          <span className="font-bold" style={{ color: 'var(--text)' }}>{fmtDate(inv.date)}</span>
        </div>
        {inv.dueDate && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-4)' }}>Due</span>
            <span className="font-bold" style={{ color: isOverdueDate(inv) ? 'var(--aki-danger-text)' : 'var(--text)' }}>{fmtDate(inv.dueDate)}</span>
          </div>
        )}
        <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border-alt)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-4)' }}>Total</span>
            <span className="font-bold" style={{ color: 'var(--text)' }}>{fmt(Number(inv.totalAmount))}</span>
          </div>
          {inv.status !== 'PAID' && remaining < Number(inv.totalAmount) && remaining > 0 && (
            <div className="flex justify-between mt-1">
              <span style={{ color: 'var(--text-4)' }}>Remaining</span>
              <span className="font-bold" style={{ color: 'var(--aki-warning-text)' }}>{fmt(remaining)}</span>
            </div>
          )}
          {inv.status === 'PAID' && (
            <div className="flex justify-between mt-1">
              <span style={{ color: 'var(--text-4)' }}>Paid</span>
              <span className="font-bold" style={{ color: 'var(--aki-blue)' }}>{fmt(Number(inv.totalAmount))}</span>
            </div>
          )}
        </div>
        {Number(inv.vatAmount) > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-4)' }}>VAT</span>
            <span className="font-bold" style={{ color: 'var(--aki-blue)' }}>{fmt(Number(inv.vatAmount))}</span>
          </div>
        )}
        {inv.paymentSource && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-4)' }}>Source</span>
            <span className="font-bold capitalize" style={{ color: 'var(--text-2)' }}>{inv.paymentSource.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

function isOverdueDate(inv: Invoice): boolean {
  const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
  return dueDate ? dueDate.getTime() < Date.now() && !['PAID', 'CANCELLED'].includes(inv.status) : false;
}

// -- Row action menu -----------------------------------------------------------
const RowMenu: React.FC<{
  inv: Invoice;
  onSend: () => void;
  onPrint: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onCreditNote?: () => void;
  onVoid?: () => void;
  onRecordPayment?: () => void;
  onSendReminder?: () => void;
  onRowClick?: () => void;
}> = ({ inv, onSend, onPrint, onDelete, onDuplicate, onCreditNote, onVoid, onRecordPayment, onSendReminder, onRowClick }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="aki-btn aki-btn-secondary sm icon-only"
        title="Actions"
        aria-label="Row actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="aki-flyout-menu absolute right-0 top-8 z-20 w-48 py-1 overflow-hidden">
            {onRowClick && (
              <button
                type="button"
                onClick={() => { setOpen(false); onRowClick(); }}
              >
                <Eye size={13} /> View Details
              </button>
            )}
            {inv.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => { setOpen(false); onSend(); }}
              >
                <Send size={13} /> Send Invoice
              </button>
            )}
            {onRecordPayment && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => { setOpen(false); onRecordPayment(); }}
              >
                <Banknote size={13} /> Record Payment
              </button>
            )}
            {onSendReminder && (inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
              <button
                type="button"
                onClick={() => { setOpen(false); onSendReminder(); }}
              >
                <Bell size={13} /> Send Reminder
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                onClick={() => { setOpen(false); onDuplicate(); }}
              >
                <Copy size={13} /> Duplicate
              </button>
            )}
            {onCreditNote && inv.status === 'PAID' && (
              <button
                type="button"
                onClick={() => { setOpen(false); onCreditNote(); }}
              >
                <Tag size={13} /> Credit Note
              </button>
            )}
            <button
              type="button"
              onClick={() => { setOpen(false); onPrint(); }}
            >
              <Printer size={13} /> Print / PDF
            </button>
            {onVoid && inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
              <>
                <div className="divider" />
                <button
                  type="button"
                  onClick={() => { setOpen(false); onVoid(); }}
                  className="aki-btn-ghost"
                >
                  <X size={13} /> Void Invoice
                </button>
              </>
            )}
            <div className="divider" />
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(); }}
              className="aki-btn-ghost"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// -- Memoized Table Row --------------------------------------------------------
interface RowProps {
  inv: Invoice;
  selected: boolean;
  visibleCols: Set<string>;
  currency: string;
  onToggleSelect: (id: string) => void;
  onSend: (id: string) => void;
  onPrint: (inv: Invoice) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onCreditNote?: (id: string) => void;
  onVoid?: (id: string) => void;
  onRecordPayment?: (inv: Invoice) => void;
  onSendReminder?: (id: string) => void;
  onRowClick?: (inv: Invoice) => void;
  index?: number;
  lastSelectedIndex?: number | null;
  onShiftSelect?: (fromIndex: number, toIndex: number) => void;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
}

const InvoiceRow = memo(({ inv, selected, visibleCols, currency, onToggleSelect, onSend, onPrint, onDelete, onDuplicate, onCreditNote, onVoid, onRecordPayment, onSendReminder, onRowClick, index, lastSelectedIndex, onShiftSelect, expanded, onToggleExpand }: RowProps) => {
  const { t } = useTranslation();
  const [showHover, setShowHover] = useState(false);
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
  const isOverdue = dueDate ? dueDate.getTime() < Date.now() && !['PAID', 'CANCELLED'].includes(inv.status) : false;
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000) : null;
  const subtotalAmt = Number(inv.subtotal || Number(inv.totalAmount) - Number(inv.vatAmount || 0));
  const totalPaid = (inv.payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0);
  const paidPct = Number(inv.totalAmount) > 0 ? Math.min(100, Math.round((totalPaid / Number(inv.totalAmount)) * 100)) : 0;
  const remaining = Math.max(0, Number(inv.totalAmount) - totalPaid);
  const statusMeta = STATUS_META[inv.status] ?? STATUS_META.DRAFT;
  const sourceMeta = SOURCE_META[(inv.paymentSource ?? '').toUpperCase()] ?? null;

  const fmt = (n: number) => `${currency} ${fmtDecimal(n)}`;

  const handleCheckboxChange = () => {
    if (lastSelectedIndex !== undefined && lastSelectedIndex !== null && onShiftSelect && index !== undefined) {
      const from = Math.min(lastSelectedIndex, index);
      const to = Math.max(lastSelectedIndex, index);
      onShiftSelect(from, to);
    } else {
      onToggleSelect(inv.id);
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.metaKey || e.ctrlKey) && onToggleSelect) {
      e.preventDefault();
      onToggleSelect(inv.id);
    } else if (e.shiftKey && onShiftSelect && index !== undefined && lastSelectedIndex !== undefined && lastSelectedIndex !== null) {
      e.preventDefault();
      const from = Math.min(lastSelectedIndex, index);
      const to = Math.max(lastSelectedIndex, index);
      onShiftSelect(from, to);
    } else if (!(e.target as HTMLElement).closest('input, button, a, .aki-table-check')) {
      onToggleExpand?.(inv.id);
      onRowClick?.(inv);
    }
  };

  return (
    <>
      <tr
        onClick={handleRowClick}
        className={`${onRowClick ? 'clickable' : ''} ${selected ? 'selected' : ''} ${expanded ? 'expanded' : ''}`}
      >
        {/* Checkbox */}
        <td className="aki-table-check" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="aki-checkbox"
            style={{ accentColor: 'var(--aki-success-bg)' }}
          />
        </td>

        {/* Invoice # + recurring badge */}
        <td className="whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            <div className={`w-1 h-7 rounded-full shrink-0 ${statusMeta.dot}`} />
            <div
              className="relative"
              onMouseEnter={() => { hoverTimer.current = setTimeout(() => setShowHover(true), 300); }}
              onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setShowHover(false); }}
            >
                <p className="text-sm font-bold leading-none hover:underline cursor-default" style={{ color: 'var(--aki-blue)' }}>{inv.invoiceNumber}</p>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--text-4)' }}>
                {fmtDate(inv.date)}
              </p>
              {showHover && (
                <InvoiceHoverCard inv={inv} currency={currency} fmt={fmt} />
              )}
            </div>
            {inv.isRecurring && (
              <span className="aki-badge solid-purple sm">
                <Repeat2 size={8} /> {inv.recurringInterval?.slice(0, 1)}
              </span>
            )}
          </div>
        </td>

        {/* Customer */}
        <td className="min-w-[180px]">
          <p className="text-sm font-bold truncate max-w-[220px]" style={{ color: 'var(--text)' }}>
            {inv.customer}
          </p>
          {!!inv.customerTin && (
            <p className="text-[10px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-4)' }}>{`TIN ${String((inv.customerTin as any) ?? '')}`}</p>
          )}
          {!!inv.customerEmail && !inv.customerTin && (
            <p className="text-[10px] truncate max-w-[220px]" style={{ color: 'var(--text-4)' }}>{String((inv.customerEmail as any) ?? '')}</p>
          )}
        </td>

        {/* Due date */}
        {visibleCols.has('dueDate') && (
          <td className="whitespace-nowrap">
            {dueDate ? (
              <div>
                <p className={`text-xs font-bold ${isOverdue ? '' : ''}`} style={{ color: isOverdue ? 'var(--aki-danger-text)' : 'var(--text-2)' }}>
                  {fmtDateShort(dueDate)}
                </p>
                {inv.status !== 'PAID' && daysUntilDue !== null && (
                  <p className={`text-[10px] font-bold mt-0.5`} style={{ color: daysUntilDue < 0 ? 'var(--aki-danger-text)' : daysUntilDue <= 7 ? 'var(--aki-warning-text)' : 'var(--text-4)' }}>
                    {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` :
                     daysUntilDue === 0 ? 'Due today' :
                     `${daysUntilDue}d left`}
                  </p>
                )}
              </div>
            ) : <span className="text-xs" style={{ color: 'var(--text-4)' }}>—</span>}
          </td>
        )}

        {/* Status */}
        {visibleCols.has('status') && (
          <td>
            <span className={`aki-badge ${statusMeta.badge} sm`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
            {/* Partial payment progress */}
            {inv.status !== 'PAID' && inv.status !== 'DRAFT' && paidPct > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="aki-progress flex-1">
                  <div className="aki-progress-bar success" style={{ width: `${paidPct}%` }} />
                </div>
                <span className="text-[9px] font-bold shrink-0" style={{ color: 'var(--text-4)' }}>{paidPct}%</span>
              </div>
            )}
          </td>
        )}

        {/* Source */}
        {visibleCols.has('source') && (
          <td>
            {sourceMeta ? (
              <span className={`text-xs font-bold flex items-center gap-1.5`} style={{ color: 'var(--aki-blue)' }}>
                <span className="text-sm">{sourceMeta.icon}</span> {sourceMeta.label}
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>—</span>
            )}
          </td>
        )}

        {/* Subtotal */}
        {visibleCols.has('subtotal') && (
          <td className="right mono">
            <span className="text-xs font-medium" style={{ color: 'var(--aki-blue)' }}>{fmt(subtotalAmt)}</span>
          </td>
        )}

        {/* VAT */}
        {visibleCols.has('vat') && (
          <td className="right mono">
            <span className="text-xs font-medium" style={{ color: 'var(--aki-danger-text)' }}>{fmt(Number(inv.vatAmount || 0))}</span>
          </td>
        )}

        {/* Total */}
        <td className="right mono">
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text)' }}>{fmt(Number(inv.totalAmount))}</p>
          {inv.status !== 'PAID' && remaining < Number(inv.totalAmount) && remaining > 0 && (
            <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--aki-warning-text)' }}>{fmt(remaining)} due</p>
          )}
        </td>

        {/* EIMS / MoR */}
        {visibleCols.has('eims') && (
          <td>
            {eimsBadgeLabel(inv as any) ? (
              <div>
                <span className={`aki-badge sm ${
                  (inv as any).eimsStatus === 'REGISTERED' ? 'solid-success'
                  : (inv as any).eimsStatus === 'FAILED' ? 'solid-danger'
                  : 'solid-warning'
                }`} title={(inv as any).eimsIrn ? `IRN: ${(inv as any).eimsIrn}` : 'EIMS'}>
                  {(inv as any).eimsStatus ?? 'REGISTERED'}
                </span>
                {(inv as any).eimsIrn && (
                  <p className="text-[9px] font-mono mt-1 truncate max-w-[100px]" style={{ color: 'var(--text-4)' }}>
                    {String((inv as any).eimsIrn).slice(0, 14)}…
                  </p>
                )}
              </div>
            ) : (
              <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>—</span>
            )}
          </td>
        )}

        {/* IFRS */}
        {visibleCols.has('ifrs') && (
          <td>
            {inv.ifrsPerformanceObligation ? (
              <span className="aki-badge solid-purple sm">IFRS 15</span>
            ) : Number(inv.vatAmount) > 0 ? (
              <span className="text-[10px] font-bold" style={{ color: 'var(--aki-blue)' }}>VAT ✓</span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>—</span>
            )}
          </td>
        )}

        {/* Actions */}
        <td className="action" onClick={e => e.stopPropagation()}>
          <div className="ovds-doc-actions">
            {inv.status === 'DRAFT' && (
              <button
                onClick={() => onSend(inv.id)}
                title="Send Invoice"
                aria-label={t('invoices.sendInvoice', 'Send invoice')}
                className="aki-btn aki-btn-secondary sm icon-only"
              >
                <Send size={14} />
              </button>
            )}
            {/* Quick-pay shortcut — only visible on overdue rows on hover */}
            {onRecordPayment && inv.status === 'OVERDUE' && (
              <button
                onClick={() => onRecordPayment(inv)}
                title="Record Payment (quick-pay)"
                aria-label="Record payment"
                className="aki-btn aki-btn-success sm"
              >
                <CircleDollarSign size={12} />
                Pay
              </button>
            )}
            <RowMenu
              inv={inv}
              onSend={() => onSend(inv.id)}
              onPrint={() => onPrint(inv)}
              onDelete={() => onDelete(inv.id)}
              onDuplicate={onDuplicate ? () => onDuplicate(inv.id) : undefined}
              onCreditNote={onCreditNote ? () => onCreditNote(inv.id) : undefined}
              onVoid={onVoid ? () => onVoid(inv.id) : undefined}
              onRecordPayment={onRecordPayment ? () => onRecordPayment(inv) : undefined}
              onSendReminder={onSendReminder ? () => onSendReminder(inv.id) : undefined}
              onRowClick={onRowClick ? () => onRowClick(inv) : undefined}
            />
          </div>
        </td>
      </tr>
      {expanded && onToggleExpand && (
        <tr className="expanded-row">
          <td colSpan={visibleCols.has('eims') && visibleCols.has('ifrs') ? 12 : visibleCols.has('eims') || visibleCols.has('ifrs') ? 11 : 10} style={{ padding: 0 }}>
            <div className="px-5 py-4 animate-in slide-in-from-top-1 duration-200" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-alt)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-4)' }}>Customer</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{inv.customer}</p>
                  {inv.customerEmail && <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{inv.customerEmail}</p>}
                  {(inv.customerPhone as string) && <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{String(inv.customerPhone)}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-4)' }}>Billing</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{fmt(subtotalAmt)} base</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{fmt(Number(inv.vatAmount || 0))} VAT · {fmt(Number(inv.totalAmount))} total</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-4)' }}>Payment</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{fmt(totalPaid)} paid</p>
                  <p className="text-[10px]" style={{ color: remaining > 0 ? 'var(--aki-warning-text)' : 'var(--text-3)' }}>{fmt(remaining)} remaining</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-4)' }}>Actions</p>
                  <div className="flex flex-wrap gap-1">
                    {onSend && inv.status === 'DRAFT' && <button onClick={() => onSend(inv.id)} className="aki-btn aki-btn-secondary xs"><Send size={10} /> Send</button>}
                    {onPrint && <button onClick={() => onPrint(inv)} className="aki-btn aki-btn-secondary xs"><Printer size={10} /> Print</button>}
                    {onRecordPayment && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && <button onClick={() => onRecordPayment(inv)} className="aki-btn aki-btn-success xs"><CircleDollarSign size={10} /> Pay</button>}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});
InvoiceRow.displayName = 'InvoiceRow';

// -- Main Table Component ------------------------------------------------------
export const InvoicesTable: React.FC<Props> = ({
  invoices,
  statusCounts,
  loading,
  totalInvoices,
  currentPage,
  totalPages,
  pageSize,
  statusTab,
  sourceFilter,
  eimsFilter = 'ALL',
  searchTerm,
  dateFrom,
  dateTo,
  sortField,
  sortDir,
  visibleCols,
  selected,
  currency,
  onStatusTabChange,
  onSourceFilterChange,
  onEimsFilterChange,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onToggleCol,
  onToggleAll,
  onToggleSelect,
  onDelete,
  onSend,
  onPrint,
  onBulkSend,
  onBulkEimsRegister,
  onBulkStatusUpdate,
  onBulkDelete,
  onBulkDuplicate,
  onExportCSV,
  onRefresh,
  onNewInvoice,
  onIngestionHub,
  onFlagOverdue,
  onDuplicate,
  onCreditNote,
  onVoid,
  onBulkArchive,
  onRecordPayment,
  onSendReminder,
  onRowClick,
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [overdueBannerDismissed, setOverdueBannerDismissed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // -- Date shortcut helpers ------------------------------------------------
  const applyDateShortcut = useCallback((range: 'week' | 'month' | 'quarter') => {
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let from: Date, to: Date;
    if (range === 'week') {
      const day = today.getDay(); // 0=Sun
      from = new Date(today); from.setDate(today.getDate() - day);
      to   = new Date(today); to.setDate(today.getDate() + (6 - day));
    } else if (range === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      const q = Math.floor(today.getMonth() / 3);
      from = new Date(today.getFullYear(), q * 3, 1);
      to   = new Date(today.getFullYear(), q * 3 + 3, 0);
    }
    onDateFromChange(iso(from));
    onDateToChange(iso(to));
  }, [onDateFromChange, onDateToChange]);

  // -- Overdue metrics ------------------------------------------------------
  const overdueInvoices = useMemo(() => invoices.filter(i => i.status === 'OVERDUE'), [invoices]);
  const overdueTotal    = useMemo(() => overdueInvoices.reduce((s, i) => s + Number(i.totalAmount), 0), [overdueInvoices]);
  const showOverdueBanner = !overdueBannerDismissed && overdueInvoices.length > 0 && statusTab === 'ALL';

  const sorted = useMemo(() => {
    return [...invoices].sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortField === 'totalAmount')    { av = Number(a.totalAmount); bv = Number(b.totalAmount); }
      else if (sortField === 'subtotal')  { 
        av = Number(a.subtotal || Number(a.totalAmount) - Number(a.vatAmount || 0)); 
        bv = Number(b.subtotal || Number(b.totalAmount) - Number(b.vatAmount || 0)); 
      }
      else if (sortField === 'customer')  { av = a.customer; bv = b.customer; }
      else if (sortField === 'invoiceNumber') { av = a.invoiceNumber; bv = b.invoiceNumber; }
      else if (sortField === 'dueDate')   { av = a.dueDate ? new Date(a.dueDate).getTime() : 0; bv = b.dueDate ? new Date(b.dueDate).getTime() : 0; }
      else { av = new Date(a.date).getTime(); bv = new Date(b.date).getTime(); }
      return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
  }, [invoices, sortField, sortDir]);

  const handleShiftSelect = useCallback((from: number, to: number) => {
    const ids = sorted.slice(from, to + 1).map(i => i.id);
    onToggleSelect?.(ids[0]);
    ids.slice(1).forEach(id => onToggleSelect?.(id));
  }, [sorted, onToggleSelect]);

  const handleToggleSelect = useCallback((id: string, idx?: number) => {
    onToggleSelect?.(id);
    if (idx !== undefined) setLastSelectedIndex(idx);
  }, [onToggleSelect]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedRow(v => v === id ? null : id);
  }, []);

  const allSelected = sorted.length > 0 && sorted.every(i => selected.has(i.id));
  const hasActiveFilters = statusTab !== 'ALL' || sourceFilter !== 'ALL' || eimsFilter !== 'ALL' || dateFrom || dateTo || searchTerm;

  // Debounced bulk timers
  const bulkSendTimer   = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkDeleteTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkStatusTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBulkSend = useCallback(() => {
    const draftIds = [...selected].filter(id => invoices.find(i => i.id === id)?.status === 'DRAFT');
    if (!draftIds.length) { toast.error('Select DRAFT invoices to send'); return; }
    if (bulkSendTimer.current) return;
    bulkSendTimer.current = setTimeout(() => { bulkSendTimer.current = null; }, 500);
    onBulkSend();
  }, [selected, invoices, onBulkSend]);

  const handleBulkStatus = useCallback((status: string) => {
    if (!selected.size) return;
    if (bulkStatusTimer.current) return;
    bulkStatusTimer.current = setTimeout(() => { bulkStatusTimer.current = null; }, 500);
    onBulkStatusUpdate(status);
  }, [selected, onBulkStatusUpdate]);

  const handleBulkDelete = useCallback(() => {
    if (!selected.size) return;
    if (bulkDeleteTimer.current) return;
    bulkDeleteTimer.current = setTimeout(() => { bulkDeleteTimer.current = null; }, 500);
    confirm({
      title: `Delete ${selected.size} invoice${selected.size !== 1 ? 's' : ''}?`,
      message: 'Stock will be restored. This cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Delete',
    }).then(ok => { if (ok) onBulkDelete(); });
  }, [selected, onBulkDelete]);

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => onSortChange(field)}
      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{ color: 'var(--text-3)' }}
    >
      {label}
      {sortField === field
        ? sortDir === 'asc'
          ? <ChevronUp size={10} style={{ color: 'var(--aki-blue)' }} />
          : <ChevronDown size={10} style={{ color: 'var(--aki-blue)' }} />
        : <ChevronDown size={10} className="opacity-30" />}
    </button>
  );

  // Footer totals
  const footerTotals = useMemo(() => ({
    total:    sorted.reduce((s, i) => s + Number(i.totalAmount), 0),
    subtotal: sorted.reduce((s, i) => s + Number(i.subtotal || Number(i.totalAmount) - Number(i.vatAmount || 0)), 0),
    vat:      sorted.reduce((s, i) => s + Number(i.vatAmount || 0), 0),
  }), [sorted]);

  const fmt = (n: number) => `${currency} ${fmtDecimal(n)}`;

  // -- Loading --------------------------------------------------------------
  if (loading) {
    return (
      <div className="aki-table-wrap p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 mb-2 last:mb-0">
            {Array.from({ length: 7 }).map((__, j) => (
              <div key={j} className="aki-skeleton h-4 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* -- Overdue alert banner -------------------------------------------- */}
      {showOverdueBanner && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl animate-in slide-in-from-top-1 duration-200" style={{ background: 'var(--aki-danger-bg)', border: '1px solid var(--aki-danger-border)' }}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--aki-danger-bg)', color: 'var(--aki-danger-text)' }}>
              <Flame size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-none" style={{ color: 'var(--aki-danger-text)' }}>
                {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? 's' : ''} require attention
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--aki-danger-text)' }}>
                {fmt(overdueTotal)} at risk · Send reminders or record payments to clear
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { onStatusTabChange('OVERDUE'); setOverdueBannerDismissed(true); }}
              className="aki-btn aki-btn-danger sm"
            >
              <TrendingDown size={11} /> View Overdue
            </button>
            <button
              type="button"
              onClick={() => setOverdueBannerDismissed(true)}
              aria-label="Dismiss banner"
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--aki-danger-text)' }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* -- Toolbar ----------------------------------------------------------- */}
      <div className="aki-card" style={{ padding: '12px 16px' }}>
        <div className="flex flex-wrap items-center gap-2">

          {/* Search */}
          <div className="aki-input-group flex-1 min-w-[200px]">
            <Search size={13} className="aki-input-icon" />
            <input
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search invoices…"
              className="aki-input"
            />
            {searchTerm && (
              <button onClick={() => onSearchChange('')} className="aki-input-icon-right" style={{ color: 'var(--text-4)', cursor: 'pointer' }} aria-label={t('common.clearSearch', 'Clear search')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`aki-btn sm ${showFilters || hasActiveFilters ? 'aki-btn-soft-blue' : 'aki-btn-secondary'}`}
          >
            <Filter size={13} />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--aki-blue)' }} />}
          </button>

          {/* Keyboard shortcuts */}
          <div className="relative">
            <button
              onClick={() => setShowShortcuts(v => !v)}
              className="aki-btn aki-btn-secondary xs icon-only"
              title="Keyboard shortcuts"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard size={13} />
            </button>
            {showShortcuts && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowShortcuts(false)} />
                <div className="aki-flyout-menu absolute right-0 top-8 z-20 w-64 p-4">
                  <p className="text-xs font-bold mb-3" style={{ color: 'var(--text)' }}>Keyboard Shortcuts</p>
                  <div className="space-y-2">
                    {[
                      { key: '/', desc: 'Focus search' },
                      { key: 'Ctrl + N', desc: 'New invoice' },
                      { key: 'Ctrl + /', desc: 'Show shortcuts' },
                      { key: 'Esc', desc: 'Close modal' },
                      { key: 'Ctrl + S', desc: 'Save draft' },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{s.desc}</span>
                        <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-alt)', color: 'var(--text-2)', border: '1px solid var(--border-alt)' }}>{s.key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export */}
          <button onClick={onExportCSV} className="aki-btn aki-btn-secondary sm">
            <ArrowDownToLine size={13} /> Export
          </button>

          {/* Flag Overdue */}
          {onFlagOverdue && (
            <button onClick={onFlagOverdue} className="aki-btn aki-btn-danger sm" title="Auto-flag PENDING invoices past due date as OVERDUE">
              <AlertTriangle size={13} /> Flag Overdue
            </button>
          )}

          {/* Column toggle */}
          <ColumnToggle
            columns={INVOICE_COLUMNS}
            storageKey="invoice_columns"
            onChange={visible => {
              INVOICE_COLUMNS.forEach(c => {
                const isVis = visible.has(c.key);
                const wasVis = visibleCols.has(c.key);
                if (isVis !== wasVis) onToggleCol(c.key);
              });
            }}
          />

          {/* Refresh */}
          <button onClick={onRefresh} className="aki-btn aki-btn-secondary sm icon-only" title="Refresh" aria-label={t('common.refresh', 'Refresh')}>
            <RefreshCw size={13} />
          </button>

          {/* Ingestion hub */}
          {onIngestionHub && (
            <button onClick={onIngestionHub} className="aki-btn aki-btn-warning sm" title="Import invoices from Telebirr, Bank QR, Chapa, or OCR">
              <Zap size={13} /> Import
            </button>
          )}

          {/* New Invoice CTA */}
          <button onClick={onNewInvoice} className="aki-btn aki-btn-primary sm ml-auto">
            <Plus size={13} strokeWidth={3} /> New Invoice
          </button>
        </div>

        {/* -- Status tabs — ovds underline style --------------------- */}
        <div className="ovds-tab-nav mt-3 -mx-4 px-1" style={{ borderTop: '1px solid var(--border-alt)', borderBottom: 'none' }}>
          {(['ALL', 'DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as StatusTab[]).map(tab => {
            const count = tab === 'ALL' ? totalInvoices : (statusCounts[tab] ?? 0);
            const meta = tab === 'ALL' ? null : STATUS_META[tab];
            const isActive = statusTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusTabChange(tab)}
                className={`ovds-tab${isActive ? ' active' : ''}`}
              >
                {meta && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />}
                {tab === 'ALL' ? 'All' : meta?.label ?? tab}
                <span className={`aki-badge sm pill ${isActive ? 'solid-info' : 'solid-default'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* -- Expanded filters ----------------------------------------------- */}
        {showFilters && (
          <div className="mt-3 pt-3 flex flex-wrap items-center gap-3" style={{ borderTop: '1px solid var(--border-alt)' }}>
            {/* Date range */}
            <div className="aki-input-group">
              <Calendar size={12} className="aki-input-icon" />
              <input
                type="date"
                value={dateFrom ?? ''}
                onChange={e => onDateFromChange(e.target.value)}
                className="aki-input"
                style={{ width: 'auto' }}
                title="From"
              />
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>–</span>
              <input
                type="date"
                value={dateTo ?? ''}
                onChange={e => onDateToChange(e.target.value)}
                className="aki-input"
                style={{ width: 'auto' }}
                title="To"
              />
            </div>

            {/* Date shortcut chips */}
            <div className="flex items-center gap-1">
              {(['week', 'month', 'quarter'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => applyDateShortcut(r)}
                  className="aki-btn aki-btn-secondary xs"
                >
                  {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'This Quarter'}
                </button>
              ))}
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => { onDateFromChange(''); onDateToChange(''); }}
                  className="aki-btn aki-btn-danger xs icon-only"
                  aria-label="Clear date range"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Source */}
            <select
              value={sourceFilter}
              onChange={e => onSourceFilterChange(e.target.value as SourceFilter)}
              className="aki-input aki-select"
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Sources</option>
              <option value="MANUAL">Manual</option>
              <option value="TELECOM">Telebirr</option>
              <option value="BANK_QR">Bank QR</option>
              <option value="CHAPA">Chapa</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>

            {/* EIMS status */}
            {onEimsFilterChange && (
              <select
                value={eimsFilter}
                onChange={e => onEimsFilterChange(e.target.value as EimsFilter)}
                className="aki-input aki-select"
                style={{ width: 'auto' }}
              >
                <option value="ALL">All EIMS</option>
                <option value="REGISTERED">EIMS Registered</option>
                <option value="PENDING">EIMS Pending</option>
                <option value="FAILED">EIMS Failed</option>
                <option value="NEEDS_REGISTRATION">Needs EIMS</option>
                <option value="NOT_REGISTERED">Not Registered</option>
              </select>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  onStatusTabChange('ALL');
                  onSourceFilterChange('ALL');
                  onEimsFilterChange?.('ALL');
                  onDateFromChange('');
                  onDateToChange('');
                  onSearchChange('');
                }}
                className="aki-btn aki-btn-danger sm"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* -- Bulk action bar ---------------------------------------------------- */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg animate-in slide-in-from-bottom-2 duration-200"
          style={{ background: 'var(--aki-blue)', border: '1px solid var(--aki-blue-100)' }}
        >
          <span className="text-[12px] font-bold text-white">
            {selected.size} selected
          </span>
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <button onClick={handleBulkSend} className="aki-btn aki-btn-primary xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            <Send size={11} /> Send
          </button>
          {onBulkEimsRegister && (
            <button onClick={onBulkEimsRegister} className="aki-btn aki-btn-secondary xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} title="Register selected with MoR EIMS">
              <ShieldCheck size={11} /> EIMS Register
            </button>
          )}
          <button onClick={() => handleBulkStatus('PAID')} className="aki-btn aki-btn-success xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            <CheckCircle2 size={11} /> Mark Paid
          </button>
          <button onClick={() => handleBulkStatus('OVERDUE')} className="aki-btn aki-btn-warning xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            <AlertTriangle size={11} /> Overdue
          </button>
          <button onClick={() => handleBulkStatus('CANCELLED')} className="aki-btn aki-btn-secondary xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            <X size={11} /> Void
          </button>
          {onBulkDuplicate && (
            <button onClick={onBulkDuplicate} className="aki-btn aki-btn-secondary xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
              <Copy size={11} /> Duplicate
            </button>
          )}
          {onBulkArchive && (
            <button onClick={onBulkArchive} className="aki-btn aki-btn-secondary xs" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} title="Archive selected invoices">
              <Archive size={11} /> Archive
            </button>
          )}
          <button onClick={handleBulkDelete} className="aki-btn aki-btn-danger xs" style={{ background: 'rgba(239,68,68,0.9)', color: '#fff', borderColor: 'rgba(239,68,68,1)' }}>
            <Trash2 size={11} /> Delete
          </button>
          {/* Selection total */}
          {(() => {
            const selTotal = sorted.filter(i => selected.has(i.id)).reduce((s, i) => s + Number(i.totalAmount), 0);
            return selTotal > 0 ? (
              <span className="text-[11px] font-semibold flex items-center gap-1 text-white">
                <Banknote size={11} /> {fmt(selTotal)}
              </span>
            ) : null;
          })()}
          <button onClick={onToggleAll} className="aki-btn aki-btn-ghost xs ml-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Deselect all
          </button>
        </div>
      )}

      {/* -- Main Table ------------------------------------------------------ */}
      <div className="aki-table-wrap">

        {sorted.length === 0 ? (
          <div className="ovds-empty">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-pulse" style={{ background: 'linear-gradient(135deg, var(--aki-blue-50), var(--aki-blue-100))', border: '1px solid var(--aki-blue-100)' }}>
              <FileText size={28} style={{ color: 'var(--aki-blue)' }} />
            </div>
                <h3 className="text-sm font-black mb-2 uppercase tracking-wide" style={{ color: 'var(--text)' }}>
                  {searchTerm
                    ? t('invoices.noResults', 'No results found')
                    : statusTab !== 'ALL'
                      ? t('invoices.noStatusInvoices', `No {{status}} invoices`, { status: STATUS_META[statusTab]?.label ?? statusTab })
                      : t('invoices.noInvoicesYet', 'No invoices yet')}
                </h3>
                <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  {searchTerm
                    ? t('invoices.noMatchSearch', `No invoices match "{{search}}". Try adjusting your search or filters.`, { search: searchTerm })
                    : statusTab !== 'ALL'
                      ? t('invoices.noStatusDesc', `There are no invoices with {{status}} status.`, { status: STATUS_META[statusTab]?.label ?? statusTab })
                      : t('invoices.createFirstInvoice', 'Create your first invoice to start tracking revenue and getting paid faster.')}
                </p>
            {!searchTerm && statusTab === 'ALL' && (
              <div className="mt-6 flex items-center gap-2.5">
                 <button
                   onClick={onNewInvoice}
                   className="aki-btn aki-btn-primary sm"
                 >
                   <Plus size={15} /> {t('invoices.newInvoice', 'New Invoice')}
                 </button>
                 {onIngestionHub && (
                   <button
                     onClick={onIngestionHub}
                     className="aki-btn aki-btn-secondary sm"
                   >
                     <Zap size={15} /> {t('invoices.import', 'Import')}
                   </button>
                 )}
                 <button
                   onClick={() => { onSearchChange(''); onStatusTabChange('ALL'); }}
                   className="text-[10px] font-mono px-2 py-1 rounded"
                   style={{ color: 'var(--text-4)', background: 'var(--surface-alt)' }}
                   title="Keyboard shortcut: /"
                 >
                   Press / to search
                 </button>
               </div>
            )}
               {(searchTerm || statusTab !== 'ALL') && (
                 <button
                   onClick={() => { onSearchChange(''); onStatusTabChange('ALL'); }}
                   className="mt-5 text-xs font-bold transition-colors"
                   style={{ color: 'var(--aki-blue)' }}
                 >
                   {t('common.clearFilters', 'Clear filters')}
                 </button>
               )}
            </div>
          ) : (
           <div className="overflow-x-auto">
             <table className="aki-table w-full text-left">
               <thead>
                 <tr>
                   <th className="aki-table-check w-10">
                     <input
                       type="checkbox"
                       checked={allSelected}
                       onChange={onToggleAll}
                        className="aki-checkbox"
                        style={{ accentColor: 'var(--aki-success-bg)' }}
                     />
                   </th>
                   <th><SortBtn field="invoiceNumber" label={t('invoices.colDocument', 'Document #')} /></th>
                   <th><SortBtn field="customer" label={t('invoices.colBeneficiary', 'Beneficiary')} /></th>
                   {visibleCols.has('dueDate') && <th><SortBtn field="dueDate" label={t('invoices.colMaturity', 'Maturity')} /></th>}
                   {visibleCols.has('status') && <th className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{t('common.status', 'Status')}</th>}
                   {visibleCols.has('source') && <th className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{t('invoices.colGateway', 'Gateway')}</th>}
                   {visibleCols.has('subtotal') && <th className="right"><SortBtn field="subtotal" label={t('invoices.colBase', 'Base')} /></th>}
                   {visibleCols.has('vat') && <th className="right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{t('invoices.colTax', 'Tax')}</th>}
                   <th className="right"><SortBtn field="totalAmount" label={t('common.amount', 'Amount')} /></th>
                   {visibleCols.has('eims') && <th className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>EIMS</th>}
                   {visibleCols.has('ifrs') && <th className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{t('invoices.colStandard', 'Standard')}</th>}
                   <th className="right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{t('common.actions', 'Actions')}</th>
                 </tr>
               </thead>
                <tbody>
                  {sorted.map((inv, idx) => (
                    <InvoiceRow
                      key={inv.id}
                      inv={inv}
                      index={idx}
                      lastSelectedIndex={lastSelectedIndex}
                      onShiftSelect={handleShiftSelect}
                      selected={selected.has(inv.id)}
                      visibleCols={visibleCols}
                      currency={currency}
                      expanded={expandedRow === inv.id}
                      onToggleExpand={handleToggleExpand}
                      onToggleSelect={(id) => handleToggleSelect(id, idx)}
                      onSend={onSend}
                      onPrint={onPrint}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onCreditNote={onCreditNote}
                      onVoid={onVoid}
                      onRecordPayment={onRecordPayment}
                      onSendReminder={onSendReminder}
                      onRowClick={onRowClick}
                    />
                  ))}
                </tbody>

{/* Footer totals */}
                <tfoot>
                   <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-alt)' }}>
                     <td colSpan={3} className="text-xs" style={{ color: 'var(--text-3)' }}>
                       {t('invoices.footerPageTotal', '{{count}} invoice{{plural}} · page total', {
                         count: sorted.length,
                         plural: sorted.length !== 1 ? 's' : '',
                       })}
                     </td>
                    {visibleCols.has('dueDate') && <td />}
                    {visibleCols.has('status') && <td />}
                    {visibleCols.has('source') && <td />}
                    {visibleCols.has('subtotal') && (
                      <td className="right text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--aki-blue)' }}>
                        {fmt(footerTotals.subtotal)}
                      </td>
                    )}
                    {visibleCols.has('vat') && (
                      <td className="right text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--aki-danger-text)' }}>
                        {fmt(footerTotals.vat)}
                      </td>
                    )}
                    <td className="right text-sm font-black" style={{ fontFamily: 'var(--font-mono)', color: 'var(--aki-blue)' }}>
                      {fmt(footerTotals.total)}
                    </td>
                    {visibleCols.has('eims') && <td />}
                    {visibleCols.has('ifrs') && <td />}
                    <td />
                  </tr>
                </tfoot>
             </table>
           </div>
         )}

        {/* -- Pagination ---------------------------------------------------- */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-alt)' }}>
            <div className="flex items-center gap-3">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {totalInvoices > 0
                  ? `${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, totalInvoices)} of ${totalInvoices}`
                  : `${sorted.length} invoice${sorted.length !== 1 ? 's' : ''}`}
              </p>
              <select
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
                className="aki-input aki-select"
                style={{ width: 'auto' }}
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1}
                title="First page"
                aria-label="First page"
                className="aki-btn aki-btn-secondary sm icon-only"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                title="Previous page"
                aria-label="Previous page"
                className="aki-btn aki-btn-secondary sm icon-only"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold" style={{ color: 'var(--text-2)' }}>
                {currentPage} / {totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                title="Next page"
                aria-label="Next page"
                className="aki-btn aki-btn-secondary sm icon-only"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages}
                title="Last page"
                aria-label="Last page"
                className="aki-btn aki-btn-secondary sm icon-only"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesTable;







