import React from 'react';
import { Inbox, RefreshCw, Zap, Lock, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * EmptyState — Ovds SaaS empty / loading / error state.
 *
 * Design:
 *  - Icon container: white card border, 8px radius
 *  - Primary action: Ovds SaaS green button (var(--pro-azure))
 *  - Secondary action: ghost text link
 *  - Loading variant: shimmer skeleton rows
 *  - Compact variant: inline horizontal layout
 *  - Error/locked/search variants: coloured icon containers
 */

type EmptyVariant = 'default' | 'search' | 'error' | 'locked' | 'loading';

interface EmptyStateProps {
  message?: string;
  description?: string;
  title?: string;
  desc?: string;
  hint?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
  onRetry?: () => void;
  variant?: EmptyVariant;
  compact?: boolean;
  skeletonRows?: number;
}

interface VariantConfig {
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
}

const VARIANTS: Record<EmptyVariant, VariantConfig> = {
  default: {
    icon:        <Inbox size={28} strokeWidth={1.5} />,
    iconBg:      'var(--surface)',
    iconBorder:  'var(--border)',
    iconColor:   'var(--text-5)',
  },
  search: {
    icon:        <Search size={28} strokeWidth={1.5} />,
    iconBg:      'var(--pro-azure-50)',
    iconBorder:  'var(--pro-azure-100)',
    iconColor:   'var(--pro-azure)',
  },
  error: {
    icon:        <AlertTriangle size={28} strokeWidth={1.5} />,
    iconBg:      '#FEF2F2',
    iconBorder:  '#FECACA',
    iconColor:   '#DC2626',
  },
  locked: {
    icon:        <Lock size={28} strokeWidth={1.5} />,
    iconBg:      '#FFFBEB',
    iconBorder:  '#FDE68A',
    iconColor:   '#D97706',
  },
  loading: {
    icon:        <Loader2 size={28} strokeWidth={1.5} className="animate-spin" />,
    iconBg:      'var(--surface)',
    iconBorder:  'var(--border)',
    iconColor:   'var(--text-4)',
  },
};

/* ── Shared CTA button styles ────────────────────────────────────── */
const PRIMARY_BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  background: 'var(--pro-azure)',
  color: '#fff',
  border: '1px solid var(--pro-azure)',
  cursor: 'pointer',
  transition: 'background 150ms, transform 80ms',
};

const SECONDARY_BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  background: 'var(--surface)',
  color: 'var(--text-3)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  transition: 'background 150ms',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  message, description, title, desc, hint,
  icon, action, secondaryAction, onRetry,
  variant = 'default', compact = false, skeletonRows = 3,
}) => {
  const { t } = useTranslation();
  const cfg          = VARIANTS[variant];
  const resolvedIcon = icon ?? cfg.icon;
  const resolvedMsg  = message ?? title ?? t('empty_state.no_records');
  const resolvedDesc = description ?? desc;

  /* ── Loading skeleton ─────────────────────────────────────────── */
  if (variant === 'loading') {
    return (
      <div
        className="flex flex-col gap-2 py-4 animate-in fade-in duration-200"
        aria-busy="true"
        aria-label="Loading…"
      >
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2">
            <div
              className="w-8 h-8 rounded-lg shrink-0"
              style={{ background: 'var(--border)', opacity: 0.6 }}
            />
            <div className="flex-1 space-y-1.5">
              <div
                className="h-3 rounded"
                style={{ width: `${65 + (i % 3) * 12}%`, background: 'var(--border)', opacity: 0.5 }}
              />
              <div
                className="h-2.5 rounded"
                style={{ width: `${40 + (i % 2) * 15}%`, background: 'var(--border)', opacity: 0.35 }}
              />
            </div>
            <div
              className="w-16 h-5 rounded shrink-0"
              style={{ background: 'var(--border)', opacity: 0.4 }}
            />
          </div>
        ))}
      </div>
    );
  }

  /* ── Compact ─────────────────────────────────────────────────── */
  if (compact) {
    return (
      <div className="flex items-center gap-3 py-5 px-4 animate-in fade-in duration-300">
        <div
          className="p-2.5 rounded-xl border shrink-0 flex items-center justify-center"
          style={{ background: cfg.iconBg, borderColor: cfg.iconBorder, color: cfg.iconColor }}
        >
          {resolvedIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-2)' }}>
            {resolvedMsg}
          </p>
          {resolvedDesc && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>
              {resolvedDesc}
            </p>
          )}
        </div>
        {(onRetry || action) && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {onRetry && (
              <button
                onClick={onRetry}
                style={SECONDARY_BTN}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)')}
              >
                <RefreshCw size={11} /> {t('empty_state.retry')}
              </button>
            )}
            {action && !action.disabled && (
              <button
                onClick={action.onClick}
                style={PRIMARY_BTN}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure-dark)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure)')}
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Full ─────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Icon container */}
      <div
        className="w-12 h-12 rounded-xl border flex items-center justify-center mb-3"
        style={{
          background:   cfg.iconBg,
          borderColor:  cfg.iconBorder,
          color:        cfg.iconColor,
        }}
      >
        {resolvedIcon}
      </div>

      {/* Message */}
      <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
        {resolvedMsg}
      </p>

      {/* Description */}
      {resolvedDesc && (
        <p
          className="text-[11px] max-w-xs leading-relaxed"
          style={{ color: 'var(--text-4)' }}
        >
          {resolvedDesc}
        </p>
      )}

      {/* Hint strip */}
      {hint && (
        <div
          className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[10px] max-w-xs"
          style={{
            background:  'var(--surface)',
            borderColor: 'var(--border)',
            color:       'var(--text-4)',
          }}
        >
          <Zap size={10} style={{ color: 'var(--pro-amber)', flexShrink: 0 }} />
          <span>{hint}</span>
        </div>
      )}

      {/* CTAs */}
      {(onRetry || action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              style={SECONDARY_BTN}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)')}
            >
              <RefreshCw size={11} /> {t('empty_state.try_again')}
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              disabled={action.disabled}
              style={{ ...PRIMARY_BTN, opacity: action.disabled ? 0.45 : 1, pointerEvents: action.disabled ? 'none' : 'auto' }}
              onMouseEnter={e => !action.disabled && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure-dark)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--pro-azure)')}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-[11px] font-medium underline underline-offset-2 transition-colors"
              style={{ color: 'var(--text-4)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)')}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
