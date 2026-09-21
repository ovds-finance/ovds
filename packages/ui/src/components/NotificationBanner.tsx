/**
 * NotificationBanner — ovds-style contextual banners
 * White background · green/Amber/Rose accents
 * Used for: tax deadlines, IFRS alerts, compliance warnings, system notices
 */
import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Info, XCircle, X,
  ShieldCheck, Clock, ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type BannerVariant = 'success' | 'warning' | 'error' | 'info' | 'tax' | 'ifrs';

interface BannerProps {
  variant?: BannerVariant;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
}

const VARIANT_CONFIG: Record<BannerVariant, {
  bg: string; border: string; icon: React.ReactNode; titleCls: string; msgCls: string;
}> = {
  success: {
    bg: 'bg-[var(--pro-azure-200)]/10', border: 'border-[var(--pro-azure-100)]/20',
    icon: <CheckCircle2 size={14} className="text-[var(--pro-azure-dark)] shrink-0" />,
    titleCls: 'text-slate-800', msgCls: 'text-slate-800/80',
  },
  warning: {
    bg: 'bg-amber-50', border: 'border-amber-200',
    icon: <AlertTriangle size={14} className="text-amber-600 shrink-0" />,
    titleCls: 'text-amber-600', msgCls: 'text-amber-500',
  },
  error: {
    bg: 'bg-rose-50', border: 'border-rose-200',
    icon: <XCircle size={14} className="text-rose-600 shrink-0" />,
    titleCls: 'text-rose-600', msgCls: 'text-rose-500',
  },
  info: {
    bg: 'bg-sky-50', border: 'border-sky-200',
    icon: <Info size={14} className="text-sky-600 shrink-0" />,
    titleCls: 'text-sky-600', msgCls: 'text-sky-500',
  },
  tax: {
    bg: 'bg-[var(--pro-azure-200)]/10', border: 'border-[var(--pro-azure-100)]/20',
    icon: <ShieldCheck size={14} className="text-[var(--pro-azure-dark)] shrink-0" />,
    titleCls: 'text-slate-800', msgCls: 'text-slate-800/80',
  },
  ifrs: {
    bg: 'bg-sky-50', border: 'border-sky-200',
    icon: <CheckCircle2 size={14} className="text-sky-600 shrink-0" />,
    titleCls: 'text-sky-600', msgCls: 'text-sky-500',
  },
};

export const Banner: React.FC<BannerProps> = ({
  variant = 'info', title, message, action, dismissible, onDismiss, compact,
}) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const cfg = VARIANT_CONFIG[variant];
  const handleDismiss = () => { setDismissed(true); onDismiss?.(); };

  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border} ${compact ? 'py-2' : ''}`}>
      <div className="mt-0.5">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold leading-tight ${cfg.titleCls}`}>{title}</p>
        {message && !compact && (
          <p className={`text-[10px] mt-0.5 leading-relaxed ${cfg.msgCls}`}>{message}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-1 text-[10px] font-bold flex items-center gap-0.5 hover:underline ${cfg.titleCls}`}
          >
            {action.label} <ArrowRight size={9} />
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:bg-white/60 hover:text-slate-600 transition-all"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

// -- Sticker / badge chip ------------------------------------------------------
export const Sticker: React.FC<{
  label: string;
  variant?: 'green' | 'indigo' | 'blue' | 'amber' | 'violet' | 'rose' | 'slate';
  icon?: React.ReactNode;
  pulse?: boolean;
}> = ({ label, variant = 'green', icon, pulse }) => {
  const cls: Record<string, string> = {
    green:   'bg-[var(--pro-azure-200)]/10 text-slate-800 border-[var(--pro-azure-100)]/20',
    indigo:  'bg-[var(--pro-azure-200)]/10 text-slate-800 border-[var(--pro-azure-100)]/20',
    blue:    'bg-sky-50 text-sky-600 border-sky-200',
    amber:   'bg-amber-50 text-amber-600 border-amber-200',
    violet:  'bg-violet-50 text-violet-700 border-violet-200',
    rose:    'bg-rose-50 text-rose-600 border-rose-200',
    slate:   'bg-white text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls[variant]} ${pulse ? 'animate-pulse' : ''}`}>
      {icon}
      {label}
    </span>
  );
};

// -- Deadline countdown banner -------------------------------------------------
export const DeadlineBanner: React.FC<{
  title: string;
  deadline: Date;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
}> = ({ title, deadline, description, onAction, actionLabel }) => {
  const now    = new Date();
  const diff   = deadline.getTime() - now.getTime();
  const days   = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const urgent = days <= 7;
  const overdue = days < 0;

  const variant: BannerVariant = overdue ? 'error' : urgent ? 'warning' : 'tax';
  const timeLabel = overdue
    ? `${Math.abs(days)} days overdue`
    : days === 0 ? 'Due today'
    : `${days} days remaining`;

  return (
    <Banner
      variant={variant}
      title={title}
      message={`${description ?? ''} ${timeLabel}.`}
      action={onAction ? { label: actionLabel ?? 'File Now', onClick: onAction } : undefined}
      dismissible
    />
  );
};

// -- Notification dot ----------------------------------------------------------
export const NotifDot: React.FC<{ count?: number; color?: string }> = ({ count, color = 'bg-rose-500' }) => {
  if (!count) return null;
  return (
    <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white ${color}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

// -- Toast-style inline alert --------------------------------------------------
export const InlineAlert: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}> = ({ type, message, className }) => {
  const cfg = {
    success: { cls: 'bg-[var(--pro-azure-200)]/10 text-slate-800 border-[var(--pro-azure-100)]/20', icon: <CheckCircle2 size={12} /> },
    error:   { cls: 'bg-rose-50 text-rose-600 border-rose-200',          icon: <XCircle size={12} /> },
    warning: { cls: 'bg-amber-50 text-amber-600 border-amber-200',       icon: <AlertTriangle size={12} /> },
    info:    { cls: 'bg-sky-50 text-sky-600 border-sky-200',             icon: <Info size={12} /> },
  }[type];
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold ${cfg.cls} ${className ?? ''}`}>
      {cfg.icon}
      {message}
    </div>
  );
};

// -- IFRS compliance badge -----------------------------------------------------
export const IFRSBadge: React.FC<{ standard?: string; compliant?: boolean }> = ({
  standard, compliant = true,
}) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
    compliant
      ? 'bg-sky-50 text-sky-600 border-sky-200'
      : 'bg-rose-50 text-rose-600 border-rose-200'
  }`}>
    <ShieldCheck size={9} />
    {standard ? `IFRS ${standard}` : 'IFRS'} {compliant ? '✓' : '✗'}
  </span>
);

// -- Ethiopian tax deadline banners --------------------------------------------
export const EthTaxDeadlines: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  // VAT filing: 30th of next month for previous month's VAT
  const vatDeadline = new Date(year, month, 30);
  // BIT: November 7 (4 months after Ethiopian FY end, July 7)
  const bitDeadline = new Date(year, 10, 7); // month index 10 = November
  // Pension: 15th of each month (PSSA requirement)
  const pensionDeadline = new Date(year, month - 1, 15);

  const deadlines = [
    { title: 'VAT Filing Due',     deadline: vatDeadline,     path: '/tax/filing',          label: 'File VAT' },
    { title: 'Pension Remittance', deadline: pensionDeadline, path: '/hr/payroll',              label: 'Process Payroll' },
    { title: 'BIT Annual Return',  deadline: bitDeadline,     path: '/tax/business-income',  label: 'File BIT' },
  ].filter(d => {
    const diff = d.deadline.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 30; // Only show if within 30 days
  });

  if (!deadlines.length) return null;

  return (
    <div className="space-y-2">
      {deadlines.map(d => (
        <DeadlineBanner
          key={d.title}
          title={d.title}
          deadline={d.deadline}
          description="Ethiopian ERCA deadline."
          onAction={() => onNavigate?.(d.path)}
          actionLabel={d.label}
        />
      ))}
    </div>
  );
};
