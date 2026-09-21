/**
 * ApiErrorState — maps HTTP status codes to the right inline error UI.
 *
 * Usage in any page/widget:
 *   const { data, loading, error, refetch } = useApiQuery<Invoice[]>(url, { suppressToast: true });
 *   if (error) return <ApiErrorState error={error} onRetry={refetch} />;
 */
import {
  ShieldOff,
  ServerCrash,
  WifiOff,
  Clock,
  RefreshCw,
  LogIn,
  Zap,
  Search,
  CreditCard,
  AlertTriangle,
  Copy,
  Check,
  GitMerge,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { ApiQueryError } from '../hooks/useApiQuery';

interface Props {
  error: ApiQueryError | string | null;
  onRetry?: () => void;
  /** Compact single-line variant for widgets */
  compact?: boolean;
  /** Show field-level validation errors (for form contexts) */
  showFields?: boolean;
  className?: string;
}

interface Config {
  icon: React.ReactNode;
  title: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  action?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant: 'primary' | 'secondary';
  };
}

const ApiErrorState: React.FC<Props> = ({
  error,
  onRetry,
  compact = false,
  showFields = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [copied, setCopied] = useState(false);

  const statusCode =
    typeof error === 'object' && error !== null ? error.statusCode : undefined;
  const messageKey =
    typeof error === 'object' && error !== null
      ? (error as any).messageKey
      : undefined;

  const vars =
    typeof error === 'object' && error !== null
      ? (error as any).vars
      : undefined;

  const message =
    typeof error === 'string'
      ? error
      : (messageKey
          ? String(t(messageKey, vars ?? {}))
          : error?.message ?? 'An error occurred.');

  const isNetwork =
    typeof error === 'object' && error !== null && error.isNetworkError;
  const fields =
    typeof error === 'object' && error !== null ? error.fields : undefined;
  const requestId =
    typeof error === 'object' && error !== null
      ? error.requestId
      : undefined;

  // 429 — auto-countdown from 30s
  useEffect(() => {
    if (statusCode !== 429) return;
    setRetryCountdown(30);
    const id = setInterval(() => {
      setRetryCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          onRetry?.();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusCode]);

  const copyRequestId = () => {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getConfig = (): Config => {
    if (isNetwork || !statusCode)
      return {
        icon: <WifiOff size={compact ? 16 : 28} />,
        title: 'No connection',
        desc: 'Check your network and try again.',
        iconBg: 'bg-slate-100 dark:bg-slate-800',
        iconColor: 'text-slate-400',
        action: onRetry
          ? {
              label: 'Retry',
              icon: <RefreshCw size={13} />,
              onClick: onRetry,
              variant: 'primary',
            }
          : undefined,
      };

    switch (statusCode) {
      case 401:
        return {
          icon: <LogIn size={compact ? 16 : 28} />,
          title: 'Session expired',
          desc: 'Please log in again to continue.',
          iconBg: 'bg-amber-50 dark:bg-amber-950/30',
          iconColor: 'text-amber-500',
          action: {
            label: 'Log in',
            icon: <LogIn size={13} />,
            onClick: () => navigate('/login'),
            variant: 'primary',
          },
        };
      case 402:
        return {
          icon: <CreditCard size={compact ? 16 : 28} />,
          title: 'Subscription required',
          desc: 'This feature requires an active plan.',
          iconBg: 'bg-violet-50 dark:bg-violet-950/30',
          iconColor: 'text-violet-500',
          action: {
            label: 'View Plans',
            icon: <Zap size={13} />,
            onClick: () => navigate('/payment-required'),
            variant: 'primary',
          },
        };
      case 403:
        return {
          icon: <ShieldOff size={compact ? 16 : 28} />,
          title: 'Access denied',
          desc:
            message !== 'An error occurred.'
              ? message
              : "You don't have permission to view this.",
          iconBg: 'bg-rose-50 dark:bg-rose-950/30',
          iconColor: 'text-rose-500',
          action: {
            label: 'Go back',
            icon: <RefreshCw size={13} />,
            onClick: () => navigate(-1),
            variant: 'secondary',
          },
        };
      case 404:
        return {
          icon: <Search size={compact ? 16 : 28} />,
          title: 'Not found',
          desc:
            message !== 'An error occurred.'
              ? message
              : "This resource doesn't exist or was removed.",
          iconBg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30',
          iconColor: 'text-[var(--pro-azure-light)]',
          action: onRetry
            ? {
                label: 'Retry',
                icon: <RefreshCw size={13} />,
                onClick: onRetry,
                variant: 'secondary',
              }
            : undefined,
        };
      case 405:
        return {
          icon: <AlertTriangle size={compact ? 16 : 28} />,
          title: 'Method not allowed',
          desc: 'This action is not supported on this resource.',
          iconBg: 'bg-orange-50 dark:bg-orange-950/30',
          iconColor: 'text-orange-500',
        };
      case 408:
        return {
          icon: <Clock size={compact ? 16 : 28} />,
          title: 'Request timed out',
          desc: 'The server took too long. Try again.',
          iconBg: 'bg-amber-50 dark:bg-amber-950/30',
          iconColor: 'text-amber-500',
          action: onRetry
            ? {
                label: 'Retry',
                icon: <RefreshCw size={13} />,
                onClick: onRetry,
                variant: 'primary',
              }
            : undefined,
        };
      case 409:
        return {
          icon: <GitMerge size={compact ? 16 : 28} />,
          title: 'Conflict',
          desc:
            message !== 'An error occurred.'
              ? message
              : 'A record with this value already exists.',
          iconBg: 'bg-orange-50 dark:bg-orange-950/30',
          iconColor: 'text-orange-500',
          action: onRetry
            ? {
                label: 'Retry',
                icon: <RefreshCw size={13} />,
                onClick: onRetry,
                variant: 'secondary',
              }
            : undefined,
        };
      case 413:
        return {
          icon: <AlertTriangle size={compact ? 16 : 28} />,
          title: 'Payload too large',
          desc: 'The file or data you submitted is too large.',
          iconBg: 'bg-orange-50 dark:bg-orange-950/30',
          iconColor: 'text-orange-500',
        };
      case 422:
        return {
          icon: <AlertTriangle size={compact ? 16 : 28} />,
          title: 'Validation failed',
          desc:
            message !== 'An error occurred.'
              ? message
              : 'Please check the highlighted fields.',
          iconBg: 'bg-amber-50 dark:bg-amber-950/30',
          iconColor: 'text-amber-500',
          action: onRetry
            ? {
                label: 'Try again',
                icon: <RefreshCw size={13} />,
                onClick: onRetry,
                variant: 'secondary',
              }
            : undefined,
        };
      case 429:
        return {
          icon: <Zap size={compact ? 16 : 28} />,
          title: 'Too many requests',
          desc:
            retryCountdown > 0
              ? `Auto-retrying in ${retryCountdown}s…`
              : 'Rate limit reached.',
          iconBg: 'bg-orange-50 dark:bg-orange-950/30',
          iconColor: 'text-orange-500',
          action:
            retryCountdown === 0 && onRetry
              ? {
                  label: 'Retry now',
                  icon: <RefreshCw size={13} />,
                  onClick: onRetry,
                  variant: 'primary',
                }
              : undefined,
        };
      default:
        return {
          icon: <ServerCrash size={compact ? 16 : 28} />,
          title: statusCode >= 500 ? 'Server error' : 'Something went wrong',
          desc:
            message !== 'An error occurred.'
              ? message
              : `Error ${statusCode} — please try again.`,
          iconBg: 'bg-rose-50 dark:bg-rose-950/30',
          iconColor: 'text-rose-500',
          action: onRetry
            ? {
                label: 'Retry',
                icon: <RefreshCw size={13} />,
                onClick: onRetry,
                variant: 'primary',
              }
            : undefined,
        };
    }
  };

  const cfg = getConfig();
  const fieldEntries = showFields && fields ? Object.entries(fields) : [];

  // -- Compact variant ------------------------------------------------------
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 ${className}`}
      >
        <span className={`shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {cfg.title}
          </span>
          {cfg.desc && (
            <span className="text-xs text-slate-400 ml-1.5 hidden sm:inline">
              {cfg.desc}
            </span>
          )}
        </div>
        {cfg.action && (
          <button
            onClick={cfg.action.onClick}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {cfg.action.icon}
            {cfg.action.label}
          </button>
        )}
      </div>
    );
  }

  // -- Full variant ---------------------------------------------------------
  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-6 text-center animate-in fade-in duration-300 ${className}`}
    >
      <div
        className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${cfg.iconBg} ${cfg.iconColor}`}
      >
        {cfg.icon}
      </div>

      <p className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
        {cfg.title}
      </p>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
        {cfg.desc}
      </p>

      {statusCode && (
        <span className="mt-2 text-[10px] font-semibold text-slate-300 dark:text-slate-600 uppercase tracking-wider">
          HTTP {statusCode}
        </span>
      )}

      {/* Field-level validation errors */}
      {fieldEntries.length > 0 && (
        <div className="mt-4 w-full max-w-xs text-left space-y-1.5">
          {fieldEntries.map(([field, msg]) => (
            <div
              key={field}
              className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl"
            >
              <AlertTriangle
                size={11}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <div>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  {field}
                </span>
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  {msg}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request ID — for support correlation */}
      {requestId && statusCode && statusCode >= 500 && (
        <button
          onClick={copyRequestId}
          className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
          title="Copy request ID for support"
        >
          {copied ? (
            <Check size={10} className="text-[var(--pro-azure)]" />
          ) : (
            <Copy size={10} />
          )}
          {copied ? 'Copied!' : `ID: ${requestId.slice(0, 8)}…`}
        </button>
      )}

      {cfg.action && (
        <button
          onClick={cfg.action.onClick}
          className={`mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            cfg.action.variant === 'primary'
              ? 'bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] shadow-lg shadow-green-500/20 dark:shadow-green-500/10/30'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          {cfg.action.icon}
          {cfg.action.label}
        </button>
      )}
    </div>
  );
};

export default ApiErrorState;



