/**
 * DocStackLayout — Document Stack Layout for invoice / bill / estimate pages.
 *
 * A flexible, developer-friendly interface that replaces flat table rows with
 * stacked document cards. Each row has:
 *   - left status accent stripe
 *   - icon badge
 *   - title + subtitle meta
 *   - right-aligned amount
 *   - row-level action buttons (visible on hover)
 *
 * Custom buttons and item-level actions can be injected via `renderRowActions`.
 *
 * Usage:
 *   <DocStackLayout
 *     items={invoices}
 *     renderRowActions={(item) => <button onClick={() => edit(item)}>Edit</button>}
 *     onOpen={(item) => setDrawer(item)}
 *   />
 */

import React from 'react';

// -- Types ----------------------------------------------------------------------

export type DocStatus =
  | 'draft' | 'pending' | 'sent' | 'overdue' | 'paid' | 'settled' | 'cancelled'
  | string;

export interface DocStackItem {
  id: string;
  /** Title line: invoice number, bill ID, etc. */
  title: string;
  /** Subtitle: customer name, vendor, description */
  subtitle?: string;
  /** Formatted amount string e.g. 'ETB 12,500.00' */
  amount?: string;
  /** Document status — drives the left accent color */
  status?: DocStatus;
  /** Date string for the date column */
  date?: string;
  /** Due date string */
  dueDate?: string;
  /** Badge label (e.g. 'RECURRING', 'NEW') */
  badge?: string;
  /** Background + text classes for the badge */
  badgeCls?: string;
  /** Whether this row is currently selected (for bulk actions) */
  selected?: boolean;
  /** Any extra data your action renderer might need */
  [key: string]: unknown;
}

export interface DocStackLayoutProps {
  items: DocStackItem[];
  loading?: boolean;
  /** Icon for the document type shown on each row. Default: document SVG. */
  rowIcon?: (item: DocStackItem) => React.ReactNode;
  /** Render custom action buttons on hover for each row */
  renderRowActions?: (item: DocStackItem) => React.ReactNode;
  /** Called when a row is clicked (opens drawer / detail view) */
  onOpen?: (item: DocStackItem) => void;
  /** Called when checkbox is clicked (for bulk select) */
  onSelect?: (id: string) => void;
  /** Currently selected IDs */
  selected?: Set<string>;
  /** Empty state label */
  emptyLabel?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Extra CSS class on the shell */
  className?: string;
  /** Show a checkbox column for bulk select */
  showCheckbox?: boolean;
}

// -- Status → accent class ------------------------------------------------------

function statusClass(status?: DocStatus): string {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'settled') return 'status-paid';
  if (s === 'overdue') return 'status-overdue';
  if (s === 'pending') return 'status-pending';
  if (s === 'sent') return 'status-sent';
  if (s === 'draft') return 'status-draft';
  if (s === 'cancelled') return 'status-cancelled';
  return '';
}

// -- Default document icon ------------------------------------------------------

const DefaultDocIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// -- Loading skeleton -----------------------------------------------------------

const LoadingSkeleton: React.FC = () => (
  <>
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="ovds-doc-row" style={{ gridTemplateColumns: 'auto 1fr auto auto' }}>
        <div className="ovds-doc-icon bg-slate-100 ovds-shimmer" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 bg-slate-100 rounded ovds-shimmer" />
          <div className="h-2.5 w-20 bg-slate-100 rounded ovds-shimmer" />
        </div>
        <div className="h-4 w-16 bg-slate-100 rounded ovds-shimmer" />
        <div className="h-4 w-20 bg-slate-100 rounded ovds-shimmer" />
      </div>
    ))}
  </>
);

// -- Empty state ----------------------------------------------------------------

const EmptyState: React.FC<{ label?: string; description?: string }> = ({
  label = 'No documents',
  description = 'Nothing to show here yet.',
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-4 text-slate-300">
      <DefaultDocIcon />
    </div>
    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-xs">{description}</p>
  </div>
);

// -- DocStackLayout -------------------------------------------------------------

export const DocStackLayout: React.FC<DocStackLayoutProps> = ({
  items,
  loading = false,
  rowIcon,
  renderRowActions,
  onOpen,
  onSelect,
  selected,
  emptyLabel,
  emptyDescription,
  className = '',
  showCheckbox = false,
}) => {
  const gridCols = [
    showCheckbox ? 'auto' : null,
    'auto',        // icon
    '1fr',         // title + subtitle
    'auto',        // amount
    renderRowActions ? 'auto' : null, // actions
  ].filter(Boolean).join(' ');

  return (
    <div className={['ovds-doc-shell', className].filter(Boolean).join(' ')}>
      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <EmptyState label={emptyLabel} description={emptyDescription} />
      ) : (
        items.map(item => {
          const isSelected = selected?.has(item.id) ?? false;
          const icon = rowIcon?.(item) ?? <DefaultDocIcon />;

          return (
            <div
              key={item.id}
              onClick={() => onOpen?.(item)}
              className={[
                'ovds-doc-row',
                statusClass(item.status),
                isSelected ? 'selected' : '',
              ].filter(Boolean).join(' ')}
              style={{ gridTemplateColumns: gridCols }}
              role={onOpen ? 'button' : undefined}
              tabIndex={onOpen ? 0 : undefined}
              onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen(item) : undefined}
              aria-selected={isSelected}
            >
              {/* Checkbox */}
              {showCheckbox && (
                <label
                  onClick={e => e.stopPropagation()}
                  className="flex items-center justify-center w-5 h-5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect?.(item.id)}
                    className="w-3.5 h-3.5 rounded accent-emerald-500 cursor-pointer"
                    aria-label={`Select ${item.title}`}
                  />
                </label>
              )}

              {/* Icon */}
              <div className="ovds-doc-icon bg-white text-slate-400 dark:bg-slate-800">
                {icon}
              </div>

              {/* Title + subtitle */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="ovds-doc-title">{item.title}</span>
                  {item.badge && (
                    <span className={[
                      'text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0',
                      item.badgeCls ?? 'bg-emerald-100 text-emerald-700',
                    ].join(' ')}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="ovds-doc-subtitle">{item.subtitle}</p>
                )}
                {(item.date || item.dueDate) && (
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                    {item.date && new Date(item.date).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {item.dueDate && ` · Due ${new Date(item.dueDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'short' })}`}
                  </p>
                )}
              </div>

              {/* Amount */}
              {item.amount != null && (
                <span className="ovds-doc-amount">{item.amount}</span>
              )}

              {/* Row actions */}
              {renderRowActions && (
                <div
                  className="ovds-doc-actions"
                  onClick={e => e.stopPropagation()}
                >
                  {renderRowActions(item)}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default DocStackLayout;
