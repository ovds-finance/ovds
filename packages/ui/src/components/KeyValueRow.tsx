/**
 * KeyValueRow — lightweight label/value display row.
 *
 * Used in detail drawers, invoice summaries, employee cards, etc.
 * Supports copy-on-click, loading skeleton, and monospace value mode.
 *
 * Usage:
 *   <KeyValueRow label="Invoice No."   value={invoice.invoiceNumber} mono />
 *   <KeyValueRow label="Customer"      value={invoice.customerName} />
 *   <KeyValueRow label="Amount Due"    value={fmtCurrency(invoice.totalAmount)} />
 *   <KeyValueRow label="Status"        value={<StatusBadge status={invoice.status} />} />
 *   <KeyValueRow label="Loading field" loading />
 *
 * Group them inside a <KeyValueList> for consistent spacing:
 *   <KeyValueList>
 *     <KeyValueRow label="TIN"   value="0012345678" mono copyable />
 *     <KeyValueRow label="Email" value="accounts@example.com" />
 *   </KeyValueList>
 */
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export interface KeyValueRowProps {
  label: string;
  value?: React.ReactNode;
  /** Show monospace font for codes, TINs, account numbers */
  mono?: boolean;
  /** Show a copy button — only works when value is a string */
  copyable?: boolean;
  /** Show loading skeleton */
  loading?: boolean;
  /** Muted / secondary label style */
  subtle?: boolean;
  className?: string;
}

export const KeyValueRow: React.FC<KeyValueRowProps> = ({
  label,
  value,
  mono = false,
  copyable = false,
  loading = false,
  subtle = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof value !== 'string') return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div className={`flex items-start justify-between gap-4 py-1.5 min-h-[28px] ${className}`}>
      <span
        className={[
          'shrink-0 text-[11px] font-medium leading-5',
          subtle ? 'text-slate-400' : 'text-slate-500',
        ].join(' ')}
        style={{ minWidth: '100px' }}
      >
        {label}
      </span>

      {loading ? (
        <span className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer max-w-[180px]" />
      ) : (
        <span className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
          <span
            className={[
              'text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate text-right',
              mono ? 'font-mono tracking-tight text-[11px]' : '',
            ].filter(Boolean).join(' ')}
          >
            {value ?? '—'}
          </span>
          {copyable && typeof value === 'string' && (
            <button
              onClick={handleCopy}
              className="shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy"
              aria-label={`Copy ${label}`}
            >
              {copied
                ? <Check size={11} className="text-emerald-500" />
                : <Copy size={11} className="text-slate-400" />
              }
            </button>
          )}
        </span>
      )}
    </div>
  );
};

// -- KeyValueList wrapper ------------------------------------------------------

export interface KeyValueListProps {
  children: React.ReactNode;
  /** Render a divider between rows */
  divided?: boolean;
  className?: string;
}

export const KeyValueList: React.FC<KeyValueListProps> = ({
  children,
  divided = true,
  className = '',
}) => (
  <div
    className={[
      'flex flex-col',
      divided ? 'divide-y divide-slate-100 dark:divide-slate-800' : '',
      className,
    ].filter(Boolean).join(' ')}
  >
    {children}
  </div>
);
