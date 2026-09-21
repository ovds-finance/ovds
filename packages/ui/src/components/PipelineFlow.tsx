/**
 * PipelineFlow — ovds-style pipeline/workflow visualization
 * Pure white · green active · White-green icons
 * Used across: Invoices, Bills, Payroll, Tax, Banking, MasterData
 */
import React from 'react';
import { Icon } from './ui/icon';
import type { IconType } from '@ovds/shared';

const statusStyles: Record<
  StageStatus,
  { bg: string; text: string; border: string }
> = {
  completed: {
    bg: 'bg-[var(--pro-azure-50)]',
    text: 'text-[var(--pro-azure-dark)]',
    border: 'border-[var(--pro-azure-100)]',
  },
  active: {
    bg: 'bg-[var(--pro-azure)]',
    text: 'text-white',
    border: 'border-[var(--pro-azure)]',
  },
  pending: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  error: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export type StageStatus =
  | 'completed'
  | 'active'
  | 'pending'
  | 'warning'
  | 'error';

export interface FlowStage {
  key: string;
  label: string;
  sublabel?: string;
  status: StageStatus;
  icon?: IconType;
  count?: number;
  amount?: string;
  onClick?: () => void;
}

// -- Horizontal pipeline flow --------------------------------------------------
export const PipelineFlow: React.FC<{
  stages: FlowStage[];
  compact?: boolean;
}> = ({ stages, compact }) => {
  const statusIcon = (s: StageStatus, custom?: IconType) => {
    if (custom) return <Icon name={custom} size={compact ? 12 : 14} />;

    const map: Record<StageStatus, IconType> = {
      completed: 'SUCCESS',
      active: 'INFO',
      pending: 'CLOCK',
      warning: 'WARNING',
      error: 'DANGER',
    };
    return (
      <Icon
        name={map[s]}
        size={compact ? 12 : 14}
        className={s === 'active' ? 'fill-current' : ''}
      />
    );
  };

  const statusCls: Record<StageStatus, string> = {
    completed: `${statusStyles.completed.bg} ${statusStyles.completed.text} ${statusStyles.completed.border}`,
    active: `bg-[var(--pro-azure)] text-white border-[var(--pro-azure-dark)] ring-4 ring-[var(--pro-azure)]/20`,
    pending: `${statusStyles.pending.bg} ${statusStyles.pending.text} ${statusStyles.pending.border}`,
    warning: `${statusStyles.warning.bg} ${statusStyles.warning.text} ${statusStyles.warning.border}`,
    error: `${statusStyles.error.bg} ${statusStyles.error.text} ${statusStyles.error.border}`,
  };

  const connectorCls = (from: FlowStage) =>
    from.status === 'completed' ? 'bg-[var(--pro-azure-200)]' : 'bg-[var(--pro-azure-200)]/10';

  return (
    <div className="flex items-center w-full overflow-x-auto scrollbar-none py-2">
      {stages.map((stage, i) => (
        <React.Fragment key={stage.key}>
          <button
            onClick={stage.onClick}
            disabled={!stage.onClick}
            className={`flex flex-col items-center gap-1 min-w-[64px] ${stage.onClick ? 'cursor-pointer group' : 'cursor-default'}`}
          >
            <div
              className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-full border-2 flex items-center justify-center transition-all ${statusCls[stage.status]} ${stage.onClick ? 'group-hover:scale-110' : ''}`}
            >
              {statusIcon(stage.status, stage.icon)}
            </div>
            <div className="text-center">
              <p
                className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold leading-tight ${
                  stage.status === 'active'
                    ? 'text-slate-800'
                    : stage.status === 'completed'
                      ? 'text-[var(--pro-azure-dark)]'
                      : 'text-[var(--pro-azure-light)]'
                }`}
              >
                {stage.label}
              </p>
              {stage.sublabel && !compact && (
                <p className="text-[9px] text-[var(--pro-azure-light)] leading-tight">
                  {stage.sublabel}
                </p>
              )}
              {stage.count !== undefined && (
                <p
                  className={`text-[9px] font-bold ${stage.status === 'active' ? 'text-[var(--pro-azure-dark)]' : 'text-[var(--pro-azure-light)]'}`}
                >
                  {stage.count}
                </p>
              )}
              {stage.amount && !compact && (
                <p
                  className={`text-[9px] font-bold text-slate-800 tabular-nums`}
                >
                  {stage.amount}
                </p>
              )}
            </div>
          </button>
          {i < stages.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${connectorCls(stage)}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// -- Kanban board --------------------------------------------------------------
export interface KanbanColumn<T> {
  key: string;
  label: string;
  color: string;
  items: T[];
  count?: number;
  total?: number;
}

export function KanbanBoard<
  T extends {
    id: string;
    title?: string;
    name?: string;
    amount?: number;
    status?: string;
  },
>({
  columns,
  renderCard,
  onCardClick,
}: {
  columns: KanbanColumn<T>[];
  renderCard?: (item: T, col: KanbanColumn<T>) => React.ReactNode;
  onCardClick?: (item: T) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {columns.map((col) => (
        <div
          key={col.key}
          className="flex-shrink-0 w-64 bg-[var(--pro-azure)]/5 border border-ovds-border rounded-xl overflow-hidden"
        >
          <div className="px-3 py-2.5 bg-white border-b border-ovds-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-[11px] font-bold text-gray-900">
                {col.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {col.total !== undefined && (
                <span className="text-[9px] font-bold text-[var(--pro-azure-dark)] tabular-nums">
                  ETB{' '}
                  {new Intl.NumberFormat('en-ET', {
                    notation: 'compact',
                  }).format(col.total)}
                </span>
              )}
              <span className="w-5 h-5 rounded-full bg-[var(--pro-azure-200)]/10 flex items-center justify-center text-[9px] font-bold text-[var(--pro-azure-dark)]">
                {col.items.length}
              </span>
            </div>
          </div>
          <div className="p-2 flex flex-col gap-2 min-h-[120px] max-h-[480px] overflow-y-auto">
            {col.items.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <p className="text-[10px]">Empty</p>
              </div>
            ) : (
              col.items.map((item) =>
                renderCard ? (
                  renderCard(item, col)
                ) : (
                  <button
                    key={item.id}
                    onClick={() => onCardClick?.(item)}
                    className="w-full text-left bg-white border border-ovds-border rounded-lg p-3 hover:border-[var(--pro-azure)]/40 hover:shadow-sm transition-all group"
                  >
                    <p className="text-[11px] font-semibold text-gray-900 truncate group-hover:text-[var(--pro-azure-dark)]">
                      {item.title ?? item.name ?? item.id}
                    </p>
                    {item.amount !== undefined && (
                      <p className="text-[10px] font-bold text-[var(--pro-azure-dark)] tabular-nums mt-0.5">
                        ETB{' '}
                        {new Intl.NumberFormat('en-ET', {
                          minimumFractionDigits: 2,
                        }).format(item.amount)}
                      </p>
                    )}
                  </button>
                ),
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// -- Progress pipeline (linear steps) -----------------------------------------
export const ProgressPipeline: React.FC<{
  steps: { label: string; done: boolean; active?: boolean }[];
}> = ({ steps }) => (
  <div className="flex items-center gap-0 w-full">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <div className="flex flex-col items-center gap-1 flex-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
              step.done
                ? 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white'
                : step.active
                  ? 'bg-white border-[var(--pro-azure)] text-slate-800 ring-2 ring-[var(--pro-azure)]-light/20'
                  : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            {step.done ? <Icon name="SUCCESS" size={12} /> : i + 1}
          </div>
          <span
            className={`text-[9px] font-semibold text-center leading-tight ${
              step.done
                ? 'text-[var(--pro-azure-dark)]'
                : step.active
                  ? 'text-slate-800'
                  : 'text-slate-400'
            }`}
          >
            {step.label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className={`h-0.5 flex-1 -mt-4 transition-all ${step.done ? 'bg-[var(--pro-azure-200)]' : 'bg-[var(--pro-azure-200)]/10'}`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

// -- Route/redirect indicator --------------------------------------------------
export const RouteIndicator: React.FC<{
  from: string;
  to: string;
  via?: string;
  status?: 'active' | 'pending' | 'completed';
}> = ({ from, to, via, status = 'active' }) => {
  const cls = {
    active: 'text-slate-800 border-[var(--pro-azure-100)]/20 bg-[var(--pro-azure-200)]/10',
    pending: 'text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]/10 bg-white',
    completed: 'text-sky-600 border-sky-200 bg-sky-50',
  }[status];
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${cls}`}
    >
      <span>{from}</span>
      <Icon name="CHEVRON_RIGHT" size={10} />
      {via && (
        <>
          <span className="opacity-60">{via}</span>
          <Icon name="CHEVRON_RIGHT" size={10} />
        </>
      )}
      <span>{to}</span>
    </div>
  );
};
