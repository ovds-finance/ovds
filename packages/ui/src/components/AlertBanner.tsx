/**
 * AlertBox — compact inline alert/notice bar.
 *
 * Used for page-level warnings, info notices, and success confirmations
 * that don't require a full toast or modal.
 *
 * NOTE: NotificationBanner.tsx exports a simpler `InlineAlert`. This component
 * (AlertBox) provides a richer API with dismiss, action slot, and compact mode.
 *
 * Usage:
 *   <AlertBox variant="warning" title="VAT Threshold Approaching">
 *     Annual revenue is at 78% of the ETB 2M VAT registration threshold.
 *   </AlertBox>
 *
 *   <AlertBox variant="error" dismissible onDismiss={() => setErr(null)}>
 *     Failed to save changes. Please try again.
 *   </AlertBox>
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

const VARIANT_CONFIG: Record<AlertBoxVariant, {
  icon:     React.FC<{ size: number; className: string }>;
  outer:    string;
  iconCls:  string;
  titleCls: string;
}> = {
  info: {
    icon:     (p) => <Info {...p} />,
    outer:    'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
    iconCls:  'text-sky-500',
    titleCls: 'text-sky-800 dark:text-sky-300',
  },
  success: {
    icon:     (p) => <CheckCircle2 {...p} />,
    outer:    'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    iconCls:  'text-emerald-500',
    titleCls: 'text-emerald-800 dark:text-emerald-300',
  },
  warning: {
    icon:     (p) => <AlertTriangle {...p} />,
    outer:    'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    iconCls:  'text-amber-500',
    titleCls: 'text-amber-800 dark:text-amber-300',
  },
  error: {
    icon:     (p) => <XCircle {...p} />,
    outer:    'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
    iconCls:  'text-rose-500',
    titleCls: 'text-rose-800 dark:text-rose-300',
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
  const cfg      = VARIANT_CONFIG[variant];
  const Icon     = cfg.icon;
  const pad      = compact ? 'p-2.5 gap-2' : 'p-3.5 gap-3';
  const iconSize = compact ? 13 : 16;

  return (
    <div
      role="alert"
      className={`flex items-start rounded-xl border ${cfg.outer} ${pad} ${className}`}
    >
      <Icon size={iconSize} className={`${cfg.iconCls} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`${compact ? 'text-[11px]' : 'text-[12px]'} font-bold ${cfg.titleCls} leading-snug`}>
            {title}
          </p>
        )}
        {children && (
          <div className={`${compact ? 'text-[11px]' : 'text-[12px]'} text-slate-600 dark:text-slate-400 font-medium leading-relaxed ${title ? 'mt-0.5' : ''}`}>
            {children}
          </div>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
          aria-label="Dismiss alert"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};
