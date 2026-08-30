import React from 'react';
import { Inbox, RefreshCw, Zap, Lock, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type EmptyVariant = 'default' | 'search' | 'error' | 'locked' | 'loading';

interface EmptyStateProps {
  message?: string;
  description?: string;
  /** Alias for message */
  title?: string;
  /** Alias for description */
  desc?: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
  onRetry?: () => void;
  /** Visual variant — affects icon and color scheme */
  variant?: EmptyVariant;
  /** When true, shows a compact inline version instead of full-page */
  compact?: boolean;
  /** Number of skeleton rows to show when variant='loading' (default: 3) */
  skeletonRows?: number;
}

const VARIANT_DEFAULTS: Record<
  EmptyVariant,
  { icon: React.ReactNode; iconCls: string; bgCls: string; ringCls: string }
> = {
  default: {
    icon: <Inbox size={32} strokeWidth={1.5} />,
    iconCls: 'text-slate-300 dark:text-slate-600',
    bgCls: 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
    ringCls: '',
  },
  search: {
    icon: <Search size={32} strokeWidth={1.5} />,
    iconCls: 'text-emerald-400 dark:text-emerald-600',
    bgCls: 'bg-emerald-200/10 dark:bg-emerald-200/5 border-emerald-200/20 dark:border-emerald-200/10',
    ringCls: 'ring-1 ring-emerald-500-light/10',
  },
  error: {
    icon: <AlertTriangle size={32} strokeWidth={1.5} />,
    iconCls: 'text-rose-500',
    bgCls: 'bg-rose-50 border-rose-200',
    ringCls: 'ring-1 ring-rose-100',
  },
  locked: {
    icon: <Lock size={32} strokeWidth={1.5} />,
    iconCls: 'text-amber-500',
    bgCls: 'bg-amber-50 border-amber-200',
    ringCls: 'ring-1 ring-amber-100',
  },
  loading: {
    icon: <Loader2 size={32} strokeWidth={1.5} className="animate-spin" />,
    iconCls: 'text-slate-400 dark:text-slate-500',
    bgCls: 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
    ringCls: '',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  description,
  title,
  desc,
  hint,
  icon,
  action,
  secondaryAction,
  onRetry,
  variant = 'default',
  compact = false,
  skeletonRows = 3,
}) => {
  const { t } = useTranslation();
  const defaults = VARIANT_DEFAULTS[variant];
  const resolvedIcon = icon ?? defaults.icon;
  // Support both message/title and description/desc aliases
  const resolvedMessage = message ?? title ?? t('empty_state.no_records');
  const resolvedDesc = description ?? desc;

  // -- Loading skeleton variant ------------------------------------------------
  if (variant === 'loading') {
    return (
      <div className="flex flex-col gap-2 py-4 animate-in fade-in duration-200" aria-busy="true" aria-label="Loading…">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 ovds-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div
                className="h-3 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer"
                style={{ width: `${65 + (i % 3) * 12}%` }}
              />
              <div
                className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer"
                style={{ width: `${40 + (i % 2) * 15}%` }}
              />
            </div>
            <div className="w-16 h-5 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-5 px-4 animate-in fade-in duration-300">
        <div className={`p-2.5 rounded-xl border ${defaults.bgCls} ${defaults.ringCls}`}>
          <span className={defaults.iconCls}>{resolvedIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">{resolvedMessage}</p>
          {resolvedDesc && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{resolvedDesc}</p>
          )}
        </div>
        {(onRetry || action) && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <RefreshCw size={11} /> {t('empty_state.retry')}
              </button>
            )}
            {action && !action.disabled && (
              <button
                onClick={action.onClick}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 ${defaults.bgCls} ${defaults.ringCls}`}>
        <span className={defaults.iconCls}>{resolvedIcon}</span>
      </div>
      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 mb-1">{resolvedMessage}</p>
      {resolvedDesc && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">{resolvedDesc}</p>
      )}
      {hint && (
        <div className="mt-2.5 flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-500 dark:text-slate-400 max-w-xs">
          <Zap size={10} className="text-amber-400 shrink-0" />
          <span>{hint}</span>
        </div>
      )}
      {(onRetry || action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          {onRetry && (
            <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <RefreshCw size={11} /> {t('empty_state.try_again')}
            </button>
          )}
          {action && (
            <button onClick={action.onClick} disabled={action.disabled} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none">
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button onClick={secondaryAction.onClick} className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline underline-offset-2">
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
