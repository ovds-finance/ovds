/**
 * ContinuousCloseWidget
 *
 * Implements the "continuous closing" concept described in the OVDS features doc:
 * "AI-driven ERP systems that help SMEs achieve continuous closing —
 *  finalizing books daily rather than monthly."
 *
 * Shows a real-time view of today's book health:
 *   - Trial balance balanced?
 *   - Unreconciled bank transactions
 *   - Pending journal entries
 *   - Open period lock status
 *   - Last auto-reconcile run
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, Clock, Lock, Unlock,
  RefreshCw, ArrowRight, XCircle, Zap, BookOpen,
  Scale, Banknote, FileText,
} from 'lucide-react';
import api from '../../services/api';
import { useBusiness } from '../../context/businessContext';
import { useInterval } from '../../hooks';

// -- Types ---------------------------------------------------------------------

interface CloseHealth {
  trialBalanceBalanced: boolean;
  trialBalanceDiff: number;
  unreconciledCount: number;
  pendingJournals: number;
  openPeriod: string | null; // e.g. "2017-10" (EFY)
  periodLocked: boolean;
  lastAutoReconcileAt: string | null;
  lastCloseAt: string | null;
  unpostedExpenses: number;
  overdueInvoices: number;
  currency: string;
  generatedAt: string;
}

interface CheckRow {
  id: string;
  label: string;
  ok: boolean;
  value?: string;
  link: string;
  icon: React.ReactNode;
  urgency: 'ok' | 'warn' | 'error';
}

// -- Helpers -------------------------------------------------------------------

const fmt = (n: number, currency = 'ETB') =>
  `${currency} ${Math.abs(n).toLocaleString('en-ET', { maximumFractionDigits: 0 })}`;

const timeAgo = (iso: string | null): string => {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// -- Score computation --------------------------------------------------------

function scoreHealth(h: CloseHealth): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; color: string; label: string } {
  let score = 100;
  if (!h.trialBalanceBalanced) score -= 30;
  if (h.unreconciledCount > 10) score -= 20;
  else if (h.unreconciledCount > 0) score -= 10;
  if (h.pendingJournals > 0) score -= 10;
  if (h.unpostedExpenses > 0) score -= 10;
  if (h.overdueInvoices > 5) score -= 10;
  else if (h.overdueInvoices > 0) score -= 5;
  score = Math.max(0, score);

  if (score >= 90) return { score, grade: 'A', color: '#10b981', label: 'Healthy' };
  if (score >= 75) return { score, grade: 'B', color: '#3b82f6', label: 'Good' };
  if (score >= 55) return { score, grade: 'C', color: '#f59e0b', label: 'Fair' };
  if (score >= 35) return { score, grade: 'D', color: '#f97316', label: 'Needs Attention' };
  return { score, grade: 'F', color: '#ef4444', label: 'Critical' };
}

// -- Gauge (half-circle) -------------------------------------------------------

const ScoreGauge: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  const r = 28;
  const cx = 36;
  const cy = 36;
  const circumference = Math.PI * r;
  const offset = circumference - (Math.min(100, animated) / 100) * circumference;
  const trackColor = '#f1f5f9';

  return (
    <svg width={72} height={40} viewBox="0 0 72 40">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={trackColor} strokeWidth={6} strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={11} fontWeight={800} fill={color}>
        {Math.round(animated)}
      </text>
    </svg>
  );
};

// -- Main widget ---------------------------------------------------------------

const ContinuousCloseWidget: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [health, setHealth] = useState<CloseHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const res = await api
        .get(`/ovds/accounting/close-health${cq}`, { headers: { 'x-background': '1' } } as any)
        .catch(() => null);

      if (res?.data) {
        const d = res.data?.data ?? res.data;
        setHealth({
          trialBalanceBalanced: d.trialBalanceBalanced ?? true,
          trialBalanceDiff:     d.trialBalanceDiff     ?? 0,
          unreconciledCount:    d.unreconciledCount    ?? 0,
          pendingJournals:      d.pendingJournals      ?? 0,
          openPeriod:           d.openPeriod           ?? null,
          periodLocked:         d.periodLocked         ?? false,
          lastAutoReconcileAt:  d.lastAutoReconcileAt  ?? null,
          lastCloseAt:          d.lastCloseAt          ?? null,
          unpostedExpenses:     d.unpostedExpenses     ?? 0,
          overdueInvoices:      d.overdueInvoices      ?? 0,
          currency:             d.currency             ?? 'ETB',
          generatedAt:          d.generatedAt          ?? new Date().toISOString(),
        });
      } else {
        // Graceful degraded state — show empty but don't error
        setHealth(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { load(); }, [load]);
  useInterval(() => load(true), 120_000); // auto-refresh every 2 minutes

  // Build check rows from health data
  const checks: CheckRow[] = health
    ? [
        {
          id: 'tb',
          label: 'Trial balance',
          ok: health.trialBalanceBalanced,
          value: health.trialBalanceBalanced ? 'Balanced' : `Diff: ${fmt(health.trialBalanceDiff, health.currency)}`,
          link: '/accounting',
          icon: <Scale size={12} />,
          urgency: health.trialBalanceBalanced ? 'ok' : 'error',
        },
        {
          id: 'recon',
          label: 'Unreconciled',
          ok: health.unreconciledCount === 0,
          value: health.unreconciledCount === 0 ? 'All clear' : `${health.unreconciledCount} txns`,
          link: '/banking/reconciliation',
          icon: <Banknote size={12} />,
          urgency: health.unreconciledCount === 0 ? 'ok' : health.unreconciledCount > 10 ? 'error' : 'warn',
        },
        {
          id: 'journals',
          label: 'Pending journals',
          ok: health.pendingJournals === 0,
          value: health.pendingJournals === 0 ? 'None' : `${health.pendingJournals} draft${health.pendingJournals !== 1 ? 's' : ''}`,
          link: '/accounting',
          icon: <FileText size={12} />,
          urgency: health.pendingJournals === 0 ? 'ok' : 'warn',
        },
        {
          id: 'period',
          label: 'Period status',
          ok: !health.periodLocked,
          value: health.periodLocked
            ? `Locked — ${health.openPeriod ?? ''}`
            : health.openPeriod
              ? `Open — ${health.openPeriod}`
              : 'No open period',
          link: '/accounting/period-close',
          icon: health.periodLocked ? <Lock size={12} /> : <Unlock size={12} />,
          urgency: 'ok',
        },
        {
          id: 'expenses',
          label: 'Unposted expenses',
          ok: health.unpostedExpenses === 0,
          value: health.unpostedExpenses === 0 ? 'None' : `${health.unpostedExpenses} pending`,
          link: '/purchases/expenses',
          icon: <BookOpen size={12} />,
          urgency: health.unpostedExpenses === 0 ? 'ok' : 'warn',
        },
      ]
    : [];

  const { score, grade, color, label } = health
    ? scoreHealth(health)
    : { score: 0, grade: 'F' as const, color: '#94a3b8', label: 'Loading' };

  const issueCount = checks.filter(c => !c.ok).length;

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <Zap size={13} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="ovds-card-title">Continuous Close</p>
            <p className="ovds-caption">Today's book health</p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
          title="Refresh"
          aria-label="Refresh close health"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
              <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Score gauge row */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center shrink-0">
              <ScoreGauge score={score} color={color} />
              <span
                className="text-[10px] font-black uppercase tracking-wider mt-0.5"
                style={{ color }}
              >
                {grade}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
              {issueCount > 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {issueCount} item{issueCount !== 1 ? 's' : ''} need attention
                </p>
              ) : (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
                  Books are fully reconciled ✓
                </p>
              )}
              {health?.generatedAt && (
                <p className="ovds-caption mt-1">
                  Updated {timeAgo(health.generatedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Check rows */}
          {health && (
            <div className="space-y-0 divide-y divide-slate-50 dark:divide-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {checks.map((c) => {
                const urgencyCls = {
                  ok:    'text-emerald-500',
                  warn:  'text-amber-500',
                  error: 'text-rose-500',
                }[c.urgency];
                return (
                  <Link
                    key={c.id}
                    to={c.link}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <span className={`shrink-0 ${urgencyCls}`}>
                      {c.ok
                        ? <CheckCircle2 size={13} />
                        : c.urgency === 'error'
                          ? <XCircle size={13} />
                          : <AlertTriangle size={13} />}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                      {c.icon}
                      {c.label}
                    </span>
                    <span
                      className={`ml-auto text-[11px] font-bold tabular-nums truncate ${
                        c.ok
                          ? 'text-slate-400 dark:text-slate-500'
                          : urgencyCls
                      }`}
                    >
                      {c.value}
                    </span>
                    <ArrowRight
                      size={10}
                      className="shrink-0 text-slate-200 dark:text-slate-700 group-hover:text-emerald-500 transition-colors ml-1"
                    />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Auto-reconcile timestamp */}
          {health?.lastAutoReconcileAt && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
              <Clock size={10} className="shrink-0" />
              Last auto-reconcile: {timeAgo(health.lastAutoReconcileAt)}
            </div>
          )}
        </div>
      )}

      {/* Footer — CTA to period close */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="ovds-caption">
          Continuous daily close — powered by OVDS
        </span>
        <Link
          to="/accounting/period-close"
          className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Period Close <ArrowRight size={10} />
        </Link>
      </div>
    </div>
  );
};

export default ContinuousCloseWidget;

