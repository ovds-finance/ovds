/**
 * AlertBox — Ovds SaaS inline alert/notice strip.
 *
 * Design:
 *  - 4 variants: info | success | warning | error
 *  - Uses CSS status tokens (--status-*) for colours
 *  - Left: coloured icon, title, body text, optional action slot
 *  - Right: optional dismiss × button
 *  - Compact mode: tighter padding, smaller icons/text
 *  - Accessible: role="alert", dismiss button aria-label
 */
import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type AlertBoxVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertBoxProps {
  variant?:     AlertBoxVariant;
  title?:       string;
  children?:    React.ReactNode;
  dismissible?: boolean;
  onDismiss?:   () => void;
  action?:      React.ReactNode;
  className?:   string;
  compact?:     boolean;
}

/* ── Variant config using CSS status tokens ─────────────────────── */
const VARIANT_CFG: Record<AlertBoxVariant, {
  Icon:     React.FC<{ size: number }>;
  bg:       string;
  border:   string;
  iconColor:string;
  titleColor:string;
  bodyColor: string;
}> = {
  info: {
    Icon:       ({ size }) => <Info size={size} />,
    bg:         'var(--status-info-bg)',
    border:     'var(--status-info-border)',
    iconColor:  'var(--status-info-dot)',
    titleColor: 'var(--status-info-text)',
    bodyColor:  'var(--text-3)',
  },
  success: {
    Icon:       ({ size }) => <CheckCircle2 size={size} />,
    bg:         'var(--status-success-bg)',
    border:     'var(--status-success-border)',
    iconColor:  'var(--status-success-dot)',
    titleColor: 'var(--status-success-text)',
    bodyColor:  'var(--text-3)',
  },
  warning: {
    Icon:       ({ size }) => <AlertTriangle size={size} />,
    bg:         'var(--status-warning-bg)',
    border:     'var(--status-warning-border)',
    iconColor:  'var(--status-warning-dot)',
    titleColor: 'var(--status-warning-text)',
    bodyColor:  'var(--text-3)',
  },
  error: {
    Icon:       ({ size }) => <XCircle size={size} />,
    bg:         'var(--status-danger-bg)',
    border:     'var(--status-danger-border)',
    iconColor:  'var(--status-danger-dot)',
    titleColor: 'var(--status-danger-text)',
    bodyColor:  'var(--text-3)',
  },
};

export const AlertBox: React.FC<AlertBoxProps> = ({
  variant = 'info',
  title,
  children,
  dismissible,
  onDismiss,
  action,
  className = '',
  compact = false,
}) => {
  const cfg      = VARIANT_CFG[variant];
  const { Icon } = cfg;
  const iconSize = compact ? 13 : 15;
  const pad      = compact ? '10px 12px' : '12px 14px';
  const gap      = compact ? 8 : 10;
  const titleSz  = compact ? 11 : 12;
  const bodySz   = compact ? 11 : 12;

  return (
    <div
      role="alert"
      className={className}
      style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap,
        padding:      pad,
        borderRadius: 8,
        background:   cfg.bg,
        border:       `1px solid ${cfg.border}`,
      }}
    >
      {/* Icon */}
      <span style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1 }}>
        <Icon size={iconSize} />
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <p
            style={{
              fontSize: titleSz, fontWeight: 700,
              color:    cfg.titleColor,
              lineHeight: 1.4,
            }}
          >
            {title}
          </p>
        )}
        {children && (
          <div
            style={{
              fontSize:   bodySz,
              fontWeight: 500,
              color:      cfg.bodyColor,
              lineHeight: 1.55,
              marginTop:  title ? 3 : 0,
            }}
          >
            {children}
          </div>
        )}
        {action && (
          <div style={{ marginTop: 8 }}>
            {action}
          </div>
        )}
      </div>

      {/* Dismiss */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          style={{
            flexShrink: 0,
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, background: 'transparent',
            border: 'none', cursor: 'pointer',
            color: 'var(--text-4)',
            transition: 'background 120ms, color 120ms',
            outline: 'none',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
          }}
          onFocus={e => (e.currentTarget as HTMLButtonElement).style.outline = '2px solid var(--pro-azure)'}
          onBlur={e => (e.currentTarget as HTMLButtonElement).style.outline = 'none'}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
};

/* ── NotificationBanner — simple horizontal strip ──────────────── */
export type AlertBannerVariant = AlertBoxVariant;

export interface AlertBannerProps {
  variant?: AlertBannerVariant;
  children: React.ReactNode;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const AlertNotificationBanner: React.FC<AlertBannerProps> = ({
  variant = 'info', children, onDismiss, action, className = '',
}) => (
  <AlertBox
    variant={variant}
    dismissible={!!onDismiss}
    onDismiss={onDismiss}
    action={action}
    compact
    className={className}
  >
    {children}
  </AlertBox>
);

/* ── InlineAlert — ultra-minimal text+icon ──────────────────────── */
export interface AlertInlineProps {
  variant?: AlertBoxVariant;
  children: React.ReactNode;
  className?: string;
}

export const AlertInline: React.FC<AlertInlineProps> = ({
  variant = 'info', children, className = '',
}) => {
  const cfg = VARIANT_CFG[variant];
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${className}`}
      style={{ color: cfg.titleColor }}
    >
      <Icon size={11} />
      {children}
    </span>
  );
};
