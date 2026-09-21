/**
 * GridShell — Ovds SaaS Grid-over-Card Layout Shell
 * ─────────────────────────────────────────────────────
 * Implements the Grid-over-Card layout system from the Ovds SaaS architecture.
 *
 * Ovds SaaS shifted from distracting, multi-coloured card arrays to an
 * intentional Grid-over-Card layout that streamlines high-density accounting
 * workflows and reduces cognitive load across multi-device screens.
 *
 * Structural layout:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  Top Header (Context Switcher: Company, Currency)           │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  Actions Row  [Filter Status] [Search]     [+ New Invoice]  │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  Metrics Overview Grid  (Receivables | Payables | Cash Flow)│
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  children  (High-Density Data Grid, form, detail panel…)    │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Design principles:
 *   • No colourful card clutter — muted surface tokens only.
 *   • Grid-first: every slot is a CSS-grid / flex cell, never absolute.
 *   • Hover-to-reveal row actions: hidden until cursor focus on a grid entry.
 *   • Fully responsive: 1-column on mobile, full layout on md+.
 */

import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GridShellHeaderProps {
  /** Page / entity title displayed in the top-left */
  title: string;
  /** Optional icon rendered left of the title */
  icon?: React.ReactNode;
  /** Company selector or context pill rendered right side */
  contextSlot?: React.ReactNode;
  /** Currency or secondary context displayed right of contextSlot */
  currencySlot?: React.ReactNode;
}

export interface GridShellActionsProps {
  /** Filter status tabs (e.g. ALL | DRAFT | PENDING | PAID) */
  filterSlot?: React.ReactNode;
  /** Search input component */
  searchSlot?: React.ReactNode;
  /** Primary CTA button (e.g. "+ New Invoice") */
  primaryAction?: React.ReactNode;
  /** Secondary buttons (e.g. Export, Bulk) */
  secondaryActions?: React.ReactNode;
}

export interface GridShellProps {
  header?: GridShellHeaderProps;
  actions?: GridShellActionsProps;
  /** Metrics row — rendered between actions and content (optional) */
  metrics?: React.ReactNode;
  /** Main content area — data grid, form, etc. */
  children: React.ReactNode;
  /** Extra classes on the outermost wrapper */
  className?: string;
  /** Suppress the top padding (useful when embedded inside a DocStack) */
  flush?: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Top header bar: title + context slots */
export const GridShellHeader: React.FC<GridShellHeaderProps> = ({
  title,
  icon,
  contextSlot,
  currencySlot,
}) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
    {/* Left — icon + title */}
    <div className="flex items-center gap-2 min-w-0">
      {icon && (
        <span className="flex-shrink-0 text-slate-400 dark:text-slate-500">
          {icon}
        </span>
      )}
      <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
        {title}
      </h1>
    </div>

    {/* Right — company / currency context */}
    {(contextSlot || currencySlot) && (
      <div className="flex items-center gap-2 flex-shrink-0">
        {contextSlot}
        {currencySlot && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md tabular-nums">
            {currencySlot}
          </span>
        )}
      </div>
    )}
  </div>
);

/** Actions row: filter tabs + search + primary CTA */
export const GridShellActions: React.FC<GridShellActionsProps> = ({
  filterSlot,
  searchSlot,
  primaryAction,
  secondaryActions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
    {/* Left — filter tabs */}
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none min-w-0 flex-1">
      {filterSlot}
    </div>

    {/* Right — search + actions */}
    <div className="flex items-center gap-2 flex-shrink-0">
      {searchSlot}
      {secondaryActions}
      {primaryAction}
    </div>
  </div>
);

// ── GridShell (root) ─────────────────────────────────────────────────────────

/**
 * Root layout shell. Composes header, actions row, metrics grid, and content
 * into the Grid-over-Card structural layout.
 *
 * @example
 * ```tsx
 * <GridShell
 *   header={{ title: 'Invoices', icon: <FileText size={16} /> }}
 *   actions={{
 *     filterSlot: <StatusTabs />,
 *     searchSlot: <SearchInput />,
 *     primaryAction: <Button onClick={onNew}>+ New Invoice</Button>,
 *   }}
 *   metrics={<InvoiceMetricsGrid />}
 * >
 *   <InvoiceDataGrid invoices={invoices} />
 * </GridShell>
 * ```
 */
export const GridShell: React.FC<GridShellProps> = ({
  header,
  actions,
  metrics,
  children,
  className = '',
  flush = false,
}) => (
  <div
    className={[
      'flex flex-col min-h-0 w-full',
      'bg-slate-50 dark:bg-slate-950',
      flush ? '' : 'rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {/* ── Header ── */}
    {header && <GridShellHeader {...header} />}

    {/* ── Actions row ── */}
    {actions && <GridShellActions {...actions} />}

    {/* ── Metrics overview row ── */}
    {metrics && (
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {metrics}
      </div>
    )}

    {/* ── Content area ── */}
    <div className="flex-1 min-h-0 overflow-auto">
      {children}
    </div>
  </div>
);

// ── Filter tab primitives (used inside filterSlot) ────────────────────────────

export interface GridShellTabProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

/** Single filter tab pill — renders as part of the actions row filter slot. */
export const GridShellTab: React.FC<GridShellTabProps> = ({
  label,
  count,
  active = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={[
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
      'whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
      active
        ? 'bg-[var(--pro-azure)] text-white shadow-sm'
        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    ]
      .join(' ')}
  >
    {label}
    {count !== undefined && (
      <span
        className={[
          'inline-flex items-center justify-center rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1',
          active
            ? 'bg-white/20 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
        ].join(' ')}
      >
        {count > 999 ? '999+' : count}
      </span>
    )}
  </button>
);
