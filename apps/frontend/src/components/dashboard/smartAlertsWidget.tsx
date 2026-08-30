import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2, ArrowRight, Zap, Receipt,
  Banknote, ShieldAlert, X, RotateCcw, ShieldCheck, Globe, FileText,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks';
import { useFinancialAlerts, type AlertSeverity } from '../../hooks/useFinancialAlerts';

// Dismissed entry: { id, dismissedAt (ISO string) }
interface DismissedEntry { id: string; at: number; }
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SmartAlertsWidgetProps {
  payrollCurrent: any;
  payrollPrev: any;
  invoiceStats: any;
  dashStats: any;
  currency: string;
  loading?: boolean;
  companyId?: string | null;
}

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  payroll:       <Banknote size={15} />,
  invoices:      <Receipt size={15} />,
  vat:           <Globe size={15} />,
  disaster_fund: <ShieldCheck size={15} />,
  bit:           <FileText size={15} />,
  mat:           <FileText size={15} />,
  tot:           <Globe size={15} />,
  hr:            <ShieldAlert size={15} />,
  system:        <CheckCircle2 size={15} />,
  withholding:   <Globe size={15} />,
};

const SEVERITY_STYLES: Record<AlertSeverity, {
  bg: string; border: string; iconBg: string; iconText: string; badge: string; leftBar: string;
}> = {
  critical: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800/60',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    iconText: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900',
    leftBar: 'bg-rose-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/60',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconText: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900',
    leftBar: 'bg-amber-400',
  },
  info: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconText: 'text-emerald-600 dark:text-emerald-400 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900',
    leftBar: 'bg-emerald-400',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    leftBar: 'bg-emerald-400',
  },
};

const SmartAlertsWidget: React.FC<SmartAlertsWidgetProps> = ({
  payrollCurrent, payrollPrev, invoiceStats, dashStats, currency, loading, companyId,
}) => {
  // Store dismissed entries with timestamps for TTL expiry
  const [dismissedEntries, setDismissedEntries] = useLocalStorage<DismissedEntry[]>('smart_alerts_dismissed_v2', []);
  const [visible, setVisible] = useState(false);
  const [checkedAt] = useState(() => new Date());

  // Auto-purge expired dismissals on mount and when entries change
  const dismissedIds = useMemo(() => {
    const now = Date.now();
    return new Set(
      dismissedEntries
        .filter(e => now - e.at < DISMISS_TTL_MS)
        .map(e => e.id),
    );
  }, [dismissedEntries]);

  // Purge stale entries from storage
  useEffect(() => {
    const now = Date.now();
    const fresh = dismissedEntries.filter(e => now - e.at < DISMISS_TTL_MS);
    if (fresh.length !== dismissedEntries.length) {
      setDismissedEntries(fresh);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { alerts, criticalCount, warningCount } = useFinancialAlerts({
    payrollCurrent,
    payrollPrev,
    invoiceStats,
    dashStats,
    currency,
    loading,
    companyId,
  });

  // Stagger entry animation
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedEntries(prev => {
      // Remove any existing entry for this id, then add fresh one
      const filtered = prev.filter(e => e.id !== id);
      return [...filtered, { id, at: Date.now() }];
    });
  }, [setDismissedEntries]);

  const handleRestoreAll = useCallback(() => {
    setDismissedEntries([]);
  }, [setDismissedEntries]);

  if (loading) {
    return (
      <div className="ovds-widget-card p-6 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-violet-100 dark:bg-violet-950/50 rounded-xl flex items-center justify-center">
            <Sparkles size={14} className="text-violet-500" />
          </div>
          <div className="space-y-1">
            <div className="h-3.5 w-24 ovds-shimmer rounded" />
            <div className="h-2.5 w-36 ovds-shimmer rounded" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 ovds-shimmer rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => !dismissedIds.has(a.id));

  return (
    <div className="ovds-widget-card p-3.5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-100 dark:bg-violet-950/50 rounded-lg flex items-center justify-center">
            <Sparkles size={12} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-none">Smart Alerts</h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">AI-powered financial intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-[10px] font-medium rounded-full uppercase tracking-wider">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-medium rounded-full uppercase tracking-wider">
              {warningCount} warning
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              All clear
            </span>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-1.5">
        {activeAlerts.map((alert, idx) => {
          const s = SEVERITY_STYLES[alert.severity];
          return (
            <div
              key={alert.id}
              className={`relative flex items-start gap-2.5 pl-3 pr-2.5 py-2 rounded-lg border overflow-hidden transition-all duration-200 ${s.bg} ${s.border} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${s.leftBar}`} />
              <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 ${s.iconBg}`}>
                <span className={s.iconText}>{DOMAIN_ICONS[alert.domain]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-snug">{alert.title}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{alert.detail}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                {alert.actionTo && alert.actionLabel && (
                  <Link to={alert.actionTo} className={`flex items-center gap-0.5 text-[9px] font-semibold px-2 py-1 rounded transition-colors ${s.badge}`}>
                    {alert.actionLabel} <ArrowRight size={8} />
                  </Link>
                )}
                {alert.severity !== 'success' && (
                  <button onClick={() => handleDismiss(alert.id)} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors" title="Dismiss" aria-label={`Dismiss: ${alert.title}`}>
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {activeAlerts.length === 0 && alerts.length > 0 && (
          <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">All alerts dismissed.</p>
            <button
              onClick={handleRestoreAll}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <RotateCcw size={10} /> Restore
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Zap size={9} className="text-slate-300 dark:text-slate-600" />
          <p className="ovds-caption">
            Checked {checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {dismissedIds.size > 0 && (
          <button onClick={handleRestoreAll} className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 hover:text-emerald-600 transition-colors">
            <RotateCcw size={8} /> {dismissedIds.size} hidden · restore
          </button>
        )}
      </div>
    </div>
  );
};

export default SmartAlertsWidget;







