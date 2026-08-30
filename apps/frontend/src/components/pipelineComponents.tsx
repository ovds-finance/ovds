/**
 * PipelineComponents — Shared Pipeline-inspired UI primitives
 *
 * Provides reusable building blocks for the "money in motion" design language:
 *  - PipelineJourney: horizontal stage progress bar
 *  - PipelineFunnel: vertical funnel/conversion chart
 *  - PipelineBadge: high-contrast status pill
 *  - KanbanBoard: generic kanban column layout
 *  - PipelineViewToggle: list / kanban / funnel switcher
 */
import React from 'react';
import { STATUS_BADGE_VARIANTS, getStatusMetadata } from '@ovds/ui';
import { Icon } from './ui';

// -- Types ---------------------------------------------------------------------

export type PipelineStageStatus = 'completed' | 'active' | 'pending' | 'warning' | 'danger' | 'blocked';

export interface PipelineStage {
  key: string;
  label: string;
  status: PipelineStageStatus;
  count?: number;
  amount?: string;
  color?: string;
}

export interface FunnelStage {
  label: string;
  count: number;
  amount?: string;
  color: string;
  pct: number; // 0–100
}

export type PipelineView = 'list' | 'kanban' | 'funnel' | 'stack';

// -- PipelineBadge -------------------------------------------------------------

export const PipelineBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const meta = getStatusMetadata(status);
  const cls = STATUS_BADGE_VARIANTS[status] ?? `pipeline-badge pipeline-badge-${meta.variant}`;
  const dot = meta.dotColor ?? 'bg-ovds-text-subtle';
  const text = label ?? meta.label;
  return (
    <span className={cls}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {text}
    </span>
  );
};

// -- PipelineJourney -----------------------------------------------------------

const NODE_ICONS: Record<PipelineStageStatus, React.ReactNode> = {
  completed: <Icon name="CHECK_CIRCLE" size={14} strokeWidth={3} />,
  active:    <Icon name="CIRCLE" size={14} strokeWidth={3} className="fill-current" />,
  'active-node': <Icon name="CIRCLE" size={14} strokeWidth={3} className="fill-current" />,
  pending:   <Icon name="CIRCLE" size={14} strokeWidth={2} />,
  warning:   <Icon name="ALERT_CIRCLE" size={14} strokeWidth={2.5} />,
  danger:    <Icon name="ALERT_CIRCLE" size={14} strokeWidth={2.5} />,
  blocked:   <Icon name="CLOCK" size={14} strokeWidth={2} />,
} as any;

export const PipelineJourney: React.FC<{
  stages: PipelineStage[];
  className?: string;
}> = ({ stages, className = '' }) => {
  return (
    <div className={`pipeline-journey ${className}`}>
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const nodeClass = stage.status === 'active'
          ? 'pipeline-node-dot active-node'
          : `pipeline-node-dot ${stage.status}`;
        const connectorClass = stage.status === 'completed'
          ? 'pipeline-connector completed'
          : stage.status === 'blocked'
          ? 'pipeline-connector blocked'
          : 'pipeline-connector';

        return (
          <React.Fragment key={stage.key}>
            <div className="pipeline-node">
              <div className={nodeClass}>
                {NODE_ICONS[stage.status] ?? <Icon name="CIRCLE" size={14} />}
              </div>
              <span className={`pipeline-step-label ${stage.status === 'active' ? 'text-slate-800' : stage.status === 'completed' ? 'text-emerald-600' : ''}`}>
                {stage.label}
              </span>
              {(stage.count !== undefined || stage.amount) && (
                <span className="text-[9px] font-bold text-ovds-text-subtle dark:text-ovds-text-muted tabular-nums">
                  {stage.count !== undefined ? stage.count : stage.amount}
                </span>
              )}
            </div>
            {!isLast && <div className={connectorClass} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// -- PipelineFunnel ------------------------------------------------------------

export const PipelineFunnel: React.FC<{
  stages: FunnelStage[];
  title?: string;
  className?: string;
}> = ({ stages, title, className = '' }) => {
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className={`bg-white dark:bg-ovds-muted-dark rounded-2xl border border-ovds-border dark:border-ovds-border-subtle shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-emerald-500/5 dark:border-ovds-border-subtle/20">
          <h3 className="text-[11px] font-black text-ovds-text-muted dark:text-ovds-text-subtle uppercase tracking-[0.15em]">{title}</h3>
        </div>
      )}
      <div className="p-5 space-y-1">
        {stages.map((stage, i) => {
          const widthPct = maxCount > 0 ? Math.round((stage.count / maxCount) * 100) : 0;
          const isLast = i === stages.length - 1;
          return (
            <React.Fragment key={stage.label}>
              <div className="funnel-bar">
                <div className="w-24 shrink-0">
                  <p className="text-[10px] font-black text-ovds-text-muted dark:text-ovds-text-subtle uppercase tracking-wider truncate">{stage.label}</p>
                  {stage.amount && (
                    <p className="text-[10px] font-bold text-ovds-text-subtle dark:text-ovds-text-muted tabular-nums mt-0.5">{stage.amount}</p>
                  )}
                </div>
                <div className="funnel-track">
                  <div
                    className="funnel-fill"
                    style={{ width: `${widthPct}%`, background: stage.color }}
                  />
                </div>
                <div className="w-10 text-right shrink-0">
                  <span className="text-xs font-black text-ovds-text-main dark:text-ovds-text-subtle tabular-nums">{stage.count}</span>
                </div>
              </div>
              {!isLast && (
                <div className="flex justify-center py-0.5">
                  <div className="funnel-arrow" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// -- PipelineProgressBar -------------------------------------------------------

export const PipelineProgressBar: React.FC<{
  pct: number;
  color?: string;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ pct, color = '#00E784', label, showLabel = true, size = 'md' }) => {
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };
  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-[10px] font-bold text-ovds-text-muted dark:text-ovds-text-subtle uppercase tracking-wider">{label}</span>}
          {showLabel && <span className="text-[10px] font-black text-ovds-text-main dark:text-ovds-text-subtle tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`pipeline-progress-track ${heights[size]}`}>
        <div
          className="pipeline-progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
        />
      </div>
    </div>
  );
};

// -- PipelineViewToggle --------------------------------------------------------

const VIEW_OPTIONS: { key: PipelineView; icon: React.ReactNode; label: string }[] = [
  { key: 'list',   icon: <Icon name="LIST" size={14} />,         label: 'List' },
  { key: 'stack',  icon: <Icon name="CLIPBOARD_LIST" size={14} />, label: 'Stack' },
  { key: 'kanban', icon: <Icon name="LAYOUT_GRID" size={14} />,  label: 'Board' },
  { key: 'funnel', icon: <Icon name="CHART" size={14} />,        label: 'Funnel' },
];

export const PipelineViewToggle: React.FC<{
  value: PipelineView;
  onChange: (v: PipelineView) => void;
  options?: PipelineView[];
}> = ({ value, onChange, options = ['list', 'kanban'] }) => {
  const shown = VIEW_OPTIONS.filter(o => options.includes(o.key));
  return (
    <div className="pipeline-view-toggle">
      {shown.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`pipeline-view-btn ${value === opt.key ? 'active' : ''}`}
          title={opt.label}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

// -- KanbanColumn --------------------------------------------------------------

export interface KanbanColumnDef<T> {
  key: string;
  label: string;
  color: string;          // Tailwind text color class
  headerBg: string;       // Tailwind bg class for header
  accentColor: string;    // CSS color for left accent bar
  dotColor: string;       // Tailwind bg class for status dot
  items: T[];
  totalAmount?: string;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onColumnAction,
  emptyLabel = 'No items',
}: {
  columns: KanbanColumnDef<T>[];
  renderCard: (item: T, colKey: string) => React.ReactNode;
  onColumnAction?: (colKey: string) => void;
  emptyLabel?: string;
}) {
  return (
    <div className="kanban-scroll-container">
      {columns.map(col => (
        <div key={col.key} className="kanban-column" style={{ minWidth: 280, maxWidth: 320, flex: '1 0 280px' }}>
          {/* Column header */}
          <div className="kanban-column-header">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} />
              <span className={`text-[11px] font-black uppercase tracking-wider truncate ${col.color}`}>
                {col.label}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {col.totalAmount && (
                <span className="pipeline-stage-total">{col.totalAmount}</span>
              )}
              <span className="pipeline-count-badge">{col.items.length}</span>
            </div>
          </div>

          {/* Column value bar */}
          <div
            className="pipeline-col-value-bar"
            style={{ background: col.accentColor, opacity: 0.7 }}
          />

          {/* Cards */}
          <div className="kanban-column-body">
            {col.items.length === 0 ? (
              <div className="kanban-drop-zone">
                <span className="text-[10px] font-black uppercase tracking-widest">{emptyLabel}</span>
              </div>
            ) : (
              col.items.map(item => (
                <div key={item.id} className="kanban-card-enter">
                  {renderCard(item, col.key)}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// -- PipelineStageHeader -------------------------------------------------------
// Used at the top of pages to show the money journey

export const PipelineStageHeader: React.FC<{
  stages: Array<{
    key: string;
    label: string;
    count: number;
    amount?: string;
    color: string;       // hex or CSS color
    active?: boolean;
    completed?: boolean;
  }>;
  className?: string;
}> = ({ stages, className = '' }) => {
  const total = stages.reduce((s, st) => s + st.count, 0);

  return (
    <div className={`bg-white dark:bg-ovds-muted-dark rounded-2xl border border-ovds-border dark:border-ovds-border-subtle shadow-sm overflow-hidden ${className}`}>
      {/* Multi-color top bar */}
      <div className="flex h-1.5">
        {stages.map(st => (
          <div
            key={st.key}
            className="transition-all duration-700"
            style={{
              background: st.color,
              width: total > 0 ? `${(st.count / total) * 100}%` : `${100 / stages.length}%`,
              opacity: st.count === 0 ? 0.2 : 1,
            }}
          />
        ))}
      </div>

      {/* Stage cells */}
      <div className="grid divide-x divide-ovds-border/10 dark:divide-ovds-border-subtle/10" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
        {stages.map(st => (
          <div
            key={st.key}
            data-stage={st.key}
            className={`px-4 py-3 transition-colors cursor-pointer select-none ${
              st.active
                ? 'bg-emerald-50 dark:bg-emerald-600/20'
                : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: st.color }}
              />
              <span className="text-[9px] font-black text-ovds-text-subtle dark:text-ovds-text-muted uppercase tracking-[0.12em] truncate">
                {st.label}
              </span>
            </div>
            <p
              className="text-lg font-black tabular-nums leading-none"
              style={{ color: st.active ? st.color : undefined }}
            >
              {st.count}
            </p>
            {st.amount && (
              <p className="text-[10px] font-bold text-ovds-text-subtle dark:text-ovds-text-muted mt-1 tabular-nums truncate">
                {st.amount}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// -- PipelineCard --------------------------------------------------------------
// Generic card for use inside kanban columns

export const PipelineCard: React.FC<{
  title: string;
  subtitle?: string;
  amount?: string;
  status: string;
  meta?: Array<{ icon: React.ReactNode; label: string }>;
  accentColor?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
  progress?: number; // 0–100
}> = ({ title, subtitle, amount, status, meta = [], accentColor = '#00E784', onClick, actions, progress }) => {
  return (
    <div className="kanban-card group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600" onClick={onClick}>
      {/* Left accent */}
      <div className="kanban-card-accent transition-all duration-200" style={{ background: accentColor }} />

      <div className="pl-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ovds-text-main dark:text-ovds-text-subtle leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {title}
            </p>
            {subtitle && (
              <p className="text-[10px] font-semibold text-ovds-text-subtle dark:text-ovds-text-muted mt-1 truncate">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {actions}
            </div>
          )}
        </div>

        {/* Amount + Status */}
        <div className="flex items-center justify-between mb-2.5">
          {amount && (
            <span className="pipeline-value text-sm font-black tabular-nums">{amount}</span>
          )}
          <PipelineBadge status={status} />
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mb-2.5">
            <PipelineProgressBar pct={progress} color={accentColor} showLabel={false} size="sm" />
          </div>
        )}

        {/* Meta */}
        {meta.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800">
            {meta.map((m, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {m.icon}
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// -- DocumentStack -------------------------------------------------------------
// A flexible, developer-friendly document stack layout for the invoice page.
// Displays invoices as a clean vertical list of document rows with left-accent
// status bars, quick-action buttons per row, and custom slot for item actions.

export interface DocStackItem {
  id: string;
  title: string;
  subtitle?: string;
  amount: string;
  status: string;
  meta?: Array<{ label: string; value: string }>;
  date?: string;
  dueDate?: string | null;
  isRecurring?: boolean;
}

export interface DocStackProps<T extends DocStackItem> {
  items: T[];
  loading?: boolean;
  emptyLabel?: string;
  emptyDescription?: string;
  selected?: Set<string>;
  onSelect?: (id: string) => void;
  onOpen?: (item: T) => void;
  /** Custom action buttons rendered per row */
  renderRowActions?: (item: T) => React.ReactNode;
  /** Custom content rendered below the title row (e.g. tags, badges) */
  renderMeta?: (item: T) => React.ReactNode;
}

const STATUS_DOC_CLASS: Record<string, string> = {
  DRAFT:     'doc-draft',
  PENDING:   'doc-sent',
  SENT:      'doc-sent',
  OVERDUE:   'doc-overdue',
  PAID:      'doc-paid',
  CANCELLED: 'doc-draft',
};

const STATUS_ICON_BG: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-500',
  PENDING:   'bg-amber-50 text-amber-600',
  SENT:      'bg-amber-50 text-amber-600',
  OVERDUE:   'bg-rose-50 text-rose-600',
  PAID:      'bg-emerald-50 text-emerald-600',
  CANCELLED: 'bg-slate-100 text-slate-400',
};

export function DocumentStack<T extends DocStackItem>({
  items,
  loading,
  emptyLabel = 'No documents',
  emptyDescription = 'No items match the current filter.',
  selected,
  onSelect,
  onOpen,
  renderRowActions,
  renderMeta,
}: DocStackProps<T>) {
  if (loading) {
    return (
      <div className="doc-stack-wrapper">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="doc-stack-item animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="doc-stack-icon bg-slate-100 dark:bg-slate-800" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="doc-stack-wrapper">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Icon name="FILE_TEXT" size={24} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">{emptyLabel}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[240px] leading-relaxed">{emptyDescription}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-stack-wrapper">
      <div className="doc-stack">
        {items.map((item) => {
          const statusClass = STATUS_DOC_CLASS[item.status] ?? 'doc-draft';
          const iconBg      = STATUS_ICON_BG[item.status]  ?? 'bg-slate-100 text-slate-500';
          const isSelected  = selected?.has(item.id) ?? false;

          return (
            <div
              key={item.id}
              className={`doc-stack-item ${statusClass} ${isSelected ? 'selected' : ''}`}
              onClick={() => onOpen?.(item)}
            >
              {/* Left: optional checkbox + icon */}
              <div className="flex items-center gap-2 shrink-0">
                {onSelect && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); onSelect(item.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 cursor-pointer"
                    aria-label={`Select ${item.title}`}
                  />
                )}
                <div className={`doc-stack-icon ${iconBg}`}>
                  <Icon name="FILE_TEXT" size={15} />
                </div>
              </div>

              {/* Centre: title + meta */}
              <div className="doc-stack-meta min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="doc-stack-title">{item.title}</span>
                  {item.isRecurring && (
                    <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 uppercase tracking-wider">
                      Recurring
                    </span>
                  )}
                  <PipelineBadge status={item.status} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {item.subtitle && (
                    <span className="doc-stack-sub">{item.subtitle}</span>
                  )}
                  {item.date && (
                    <span className="doc-stack-sub opacity-70">
                      {new Date(item.date).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {item.dueDate && (
                    <span className={`doc-stack-sub ${
                      item.status === 'OVERDUE' ? 'text-rose-500' : 'opacity-70'
                    }`}>
                      Due {new Date(item.dueDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  {item.meta?.map((m, i) => (
                    <span key={i} className="doc-stack-sub opacity-70">{m.label}: {m.value}</span>
                  ))}
                  {renderMeta?.(item)}
                </div>
              </div>

              {/* Right: amount + actions */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="doc-stack-amount">{item.amount}</span>
                <div className="doc-stack-actions">
                  {renderRowActions?.(item)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
