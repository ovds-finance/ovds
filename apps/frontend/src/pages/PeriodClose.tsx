/* eslint-disable */
/**
 * PeriodClose — Automated Period-End Close Workflow
 *
 * Drives the 12-step close sequence with real-time status, actionable errors,
 * and a ovds Manager sign-off gate before the period is locked.
 *
 * Backend: POST /period-close/workflow/:companyId/:year/:month/run
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Lock, Unlock, RefreshCw, CheckCircle, XCircle,
  Clock, ChevronDown, ChevronRight, AlertTriangle,
  Play, RotateCcw, ShieldCheck, FileText, Zap,
  CheckCircle2, Layers, BookOpen, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import { getEthFiscalYear } from '../utils/ethiopianTax';
import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, EmptyState, IFRSBadge, Banner, Icon,
} from '../components/ui';

// -- Types ---------------------------------------------------------------------

type CloseStepStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';

interface CloseStep {
  id:           string;
  label:        string;
  description:  string;
  status:       CloseStepStatus;
  details?:     string;
  warnings?:    string[];
  startedAt?:   string;
  completedAt?: string;
  autoRun:      boolean;
}

interface PeriodCloseWorkflow {
  companyId:    string;
  year:         number;
  month:        number;
  period:       string;
  status:       'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  currentStep:  number;
  steps:        CloseStep[];
  startedAt?:   string;
  completedAt?: string;
  lockedBy?:    string;
  periodLocked: boolean;
  summary?: {
    revenue:     number;
    expenses:    number;
    netProfit:   number;
    totalAssets: number;
    equity:      number;
  };
}

interface AccountingPeriod {
  id:           string;
  period:       string;
  year:         number;
  month:        number;
  status:       'OPEN' | 'CLOSED' | 'LOCKED';
  lockedAt?:    string;
  lockedBy?:    string;
  journalCount?: number;
}

// -- Helpers -------------------------------------------------------------------

const fmt = (n: number) =>
  `ETB ${n.toLocaleString('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const STEP_STATUS_CONFIG: Record<CloseStepStatus, { icon: React.ReactNode; cls: string; bar: string }> = {
  PENDING: {
    icon: <Clock size={13} className="text-slate-400" />,
    cls:  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
    bar:  'bg-slate-200 dark:bg-slate-700',
  },
  RUNNING: {
    icon: <RefreshCw size={13} className="text-amber-500 animate-spin" />,
    cls:  'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/10',
    bar:  'bg-amber-400',
  },
  PASSED: {
    icon: <CheckCircle size={13} className="text-emerald-500" />,
    cls:  'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10',
    bar:  'bg-emerald-500',
  },
  FAILED: {
    icon: <XCircle size={13} className="text-rose-500" />,
    cls:  'border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/10',
    bar:  'bg-rose-500',
  },
  SKIPPED: {
    icon: <ChevronRight size={13} className="text-slate-400" />,
    cls:  'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20',
    bar:  'bg-slate-300 dark:bg-slate-600',
  },
};

const WORKFLOW_STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED:      { label: 'Needs Action',cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

// -- Step card -----------------------------------------------------------------

const StepCard: React.FC<{
  step:     CloseStep;
  index:    number;
  current:  boolean;
  onRetry:  () => void;
  retrying: boolean;
}> = ({ step, index, current, onRetry, retrying }) => {
  const [expanded, setExpanded] = useState(step.status === 'FAILED');
  const cfg = STEP_STATUS_CONFIG[step.status];

  return (
    <div className={`rounded-xl border transition-all ${cfg.cls} ${current ? 'ring-2 ring-amber-400/40' : ''}`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {/* Step number */}
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border
          ${step.status === 'PASSED'  ? 'bg-emerald-500 border-emerald-500 text-white'
          : step.status === 'FAILED'  ? 'bg-rose-500 border-rose-500 text-white'
          : step.status === 'RUNNING' ? 'bg-amber-500 border-amber-500 text-white'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
          {step.status === 'PASSED' ? <CheckCircle2 size={11} />
           : step.status === 'FAILED' ? <XCircle size={11} />
           : step.status === 'RUNNING' ? <RefreshCw size={10} className="animate-spin" />
           : index + 1}
        </span>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-[12px] font-bold truncate
              ${step.status === 'PASSED'  ? 'text-emerald-700 dark:text-emerald-400'
              : step.status === 'FAILED'  ? 'text-rose-700 dark:text-rose-400'
              : step.status === 'RUNNING' ? 'text-amber-700 dark:text-amber-400'
              : 'text-slate-700 dark:text-slate-300'}`}>
              {step.label}
            </p>
            {!step.autoRun && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800">
                Manual
              </span>
            )}
            {step.warnings && step.warnings.length > 0 && step.status === 'PASSED' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {step.warnings.length} warning{step.warnings.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {!expanded && step.details && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{step.details}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {step.status === 'FAILED' && (
            <Btn
              variant="secondary" size="sm"
              icon={<RotateCcw size={10} />}
              onClick={e => { e.stopPropagation(); onRetry(); }}
              loading={retrying}
            >
              Retry
            </Btn>
          )}
          {cfg.icon}
          {expanded ? <ChevronDown size={12} className="text-slate-400" />
                    : <ChevronRight size={12} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100/60 dark:border-slate-800/60 space-y-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{step.description}</p>
          {step.details && (
            <p className={`text-[11px] font-semibold ${step.status === 'FAILED' ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
              {step.details}
            </p>
          )}
          {step.warnings?.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400">{w}</p>
            </div>
          ))}
          {step.completedAt && (
            <p className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">
              Completed: {new Date(step.completedAt).toLocaleString('en-ET')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// -- Workflow panel -------------------------------------------------------------

const WorkflowPanel: React.FC<{
  companyId: string;
  year:      number;
  month:     number;
}> = ({ companyId, year, month }) => {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [signOffNotes, setSignOffNotes] = useState('');
  const [retryingStep, setRetryingStep] = useState<string | null>(null);

  const wfKey = ['period-workflow', companyId, year, month];

  const { data: workflow, isLoading } = useQuery<PeriodCloseWorkflow>({
    queryKey: wfKey,
    queryFn: () =>
      api.get(`/period-close/workflow/${companyId}/${year}/${month}`)
        .then((r: any) => r.data?.data ?? r.data)
        .catch(() => null),
    staleTime: 10_000,
    refetchInterval: (data: any) => {
      const wf = data?.state?.data;
      return wf?.status === 'IN_PROGRESS' ? 3000 : false;
    },
  });

  const runMutation = useMutation({
    mutationFn: () =>
      api.post(`/period-close/workflow/${companyId}/${year}/${month}/run`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: wfKey }),
    onError:   () => toast.error('Failed to start workflow'),
  });

  const signOffMutation = useMutation({
    mutationFn: () =>
      api.post(`/period-close/workflow/${companyId}/${year}/${month}/sign-off`, {
        notes: signOffNotes,
      }),
    onSuccess: () => {
      toast.success('Period signed off and locked');
      qc.invalidateQueries({ queryKey: wfKey });
      qc.invalidateQueries({ queryKey: ['periods', companyId] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? 'Sign-off failed'),
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      api.post(`/period-close/workflow/${companyId}/${year}/${month}/reset`, {}),
    onSuccess: () => {
      toast.success('Workflow reset');
      qc.invalidateQueries({ queryKey: wfKey });
    },
    onError: () => toast.error('Reset failed'),
  });

  const retryStep = async (stepId: string) => {
    setRetryingStep(stepId);
    try {
      await api.post(
        `/period-close/workflow/${companyId}/${year}/${month}/retry/${stepId}`, {},
      );
      qc.invalidateQueries({ queryKey: wfKey });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? `Retry failed: ${stepId}`);
    } finally {
      setRetryingStep(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="ovds-empty py-12">
        <Layers size={24} className="text-slate-400 mb-2" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No workflow data</p>
        <p className="text-[11px] text-slate-400 mt-1">
          Click "Start Workflow" to initialise
        </p>
      </div>
    );
  }

  const passedCount   = workflow.steps.filter(s => s.status === 'PASSED').length;
  const failedCount   = workflow.steps.filter(s => s.status === 'FAILED').length;
  const progressPct   = Math.round((passedCount / workflow.steps.length) * 100);
  const wfCfg         = WORKFLOW_STATUS_CONFIG[workflow.status];
  const allAutoReady  = workflow.steps.filter(s => s.autoRun).every(s => s.status === 'PASSED');
  const signOffStep   = workflow.steps.find(s => s.id === 'sign-off');
  const needsSignOff  = allAutoReady && signOffStep?.status !== 'PASSED' && !workflow.periodLocked;
  const isRunning     = workflow.status === 'IN_PROGRESS' && runMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="ovds-widget-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${wfCfg.cls}`}>
            {wfCfg.label}
          </div>
          {workflow.periodLocked && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
              <Lock size={11} /> Period Locked
            </span>
          )}
          {workflow.completedAt && (
            <span className="text-[10px] text-slate-400">
              Completed {new Date(workflow.completedAt).toLocaleDateString('en-ET')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {passedCount}/{workflow.steps.length}
            </span>
          </div>

          {/* Actions */}
          {!workflow.periodLocked && (
            <>
              {workflow.status === 'NOT_STARTED' && can('period_close:write') && (
                <Btn
                  variant="primary" size="sm"
                  icon={<Play size={11} />}
                  onClick={() => runMutation.mutate()}
                  loading={runMutation.isPending}
                >
                  Start Workflow
                </Btn>
              )}
              {(workflow.status === 'FAILED' || workflow.status === 'IN_PROGRESS') && (
                <Btn
                  variant="secondary" size="sm"
                  icon={<Play size={11} />}
                  onClick={() => runMutation.mutate()}
                  loading={runMutation.isPending}
                >
                  {failedCount > 0 ? 'Resume' : 'Run Steps'}
                </Btn>
              )}
              {workflow.status !== 'NOT_STARTED' && (
                <Btn
                  variant="ghost" size="sm"
                  icon={<RotateCcw size={11} />}
                  onClick={() => resetMutation.mutate()}
                  loading={resetMutation.isPending}
                >
                  Reset
                </Btn>
              )}
            </>
          )}
        </div>
      </div>

      {/* Financial snapshot (after steps complete) */}
      {workflow.summary && (
        <div className="ovds-grid-layout cols-4">
          {[
            { label: 'Revenue',      value: workflow.summary.revenue,     color: 'text-emerald-600' },
            { label: 'Expenses',     value: workflow.summary.expenses,    color: 'text-rose-600' },
            { label: 'Net Profit',   value: workflow.summary.netProfit,   color: workflow.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700' },
            { label: 'Total Assets', value: workflow.summary.totalAssets, color: 'text-slate-800 dark:text-slate-100' },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
              <p className={`text-base font-bold tabular-nums ${c.color}`}>{fmt(c.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sign-off gate */}
      {needsSignOff && can('period_close:write') && (
        <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-violet-600 dark:text-violet-400" />
            <p className="text-sm font-bold text-violet-700 dark:text-violet-400">
              ovds Manager Sign-Off Required
            </p>
          </div>
          <p className="text-[11px] text-violet-600 dark:text-violet-400">
            All automated checks have passed. Confirm that the period is ready to lock.
            After sign-off the period will be locked and no further journal entries can be backdated.
          </p>
          <input
            type="text"
            placeholder="Optional sign-off notes…"
            value={signOffNotes}
            onChange={e => setSignOffNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-400"
          />
          <Btn
            variant="primary"
            icon={<Lock size={12} />}
            onClick={() => signOffMutation.mutate()}
            loading={signOffMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Sign Off & Lock Period
          </Btn>
        </div>
      )}

      {/* Steps list */}
      <div className="space-y-2">
        {workflow.steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            current={i + 1 === workflow.currentStep && workflow.status === 'IN_PROGRESS'}
            onRetry={() => retryStep(step.id)}
            retrying={retryingStep === step.id}
          />
        ))}
      </div>

      {/* IFRS reference */}
      <p className="text-[10px] text-slate-400 text-right">
        IAS 1.27 — Comparability · Systematic close sequence per IFRS requirements
      </p>
    </div>
  );
};

// -- Main page -----------------------------------------------------------------

const PeriodClose: React.FC = () => {
  usePageTitle('Period Close');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const qc = useQueryClient();

  const now          = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<'workflow' | 'history'>('workflow');

  // Periods table (history)
  const { data: rawPeriods, isLoading: perLoading, refetch: refetchPeriods } = useQuery({
    queryKey: ['periods', selectedCompanyId],
    queryFn:  () => {
      const params = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      return api.get(`/period-close${params}`)
        .then((r: any) => r.data?.data ?? r.data ?? [])
        .catch(() => []);
    },
    staleTime: 60_000,
  });

  const periods: AccountingPeriod[] = useMemo(() => {
    const d = rawPeriods;
    return Array.isArray(d) ? d : [];
  }, [rawPeriods]);

  const unlockMutation = useMutation({
    mutationFn: (p: AccountingPeriod) =>
      api.patch(`/period-close/${p.year}/${p.month}`, {}),
    onSuccess: () => {
      toast.success('Period unlocked');
      qc.invalidateQueries({ queryKey: ['periods', selectedCompanyId] });
    },
    onError: () => toast.error('Failed to unlock period'),
  });

  const kpiCells = useMemo(() => [
    { label: 'Total Periods', value: periods.length,                                     color: 'emerald' as const },
    { label: 'Open',          value: periods.filter(p => p.status === 'OPEN').length,    color: 'sky' as const },
    { label: 'Locked',        value: periods.filter(p => p.status === 'LOCKED').length,  color: 'violet' as const },
    { label: 'Current Year',  value: getEthFiscalYear(),                                 color: 'amber' as const, isText: true },
  ], [periods]);

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  return (
    <AppPage
      title="Period Close"
      subtitle={`Automated close workflow · ${getEthFiscalYear()} · IFRS IAS 1.27 · Accounting & ovds Software · Banking & ovds · Revenue · Growth · Strategic Insights`}
      icon={<Lock size={18} />}
      crumbs={[{ label: 'Accounting' }, { label: 'Period Close' }]}
      actions={
        <div className="flex items-center gap-2">
          <IFRSBadge compliant />
          <Btn
            variant="ghost" size="sm"
            icon={<RefreshCw size={11} />}
            onClick={() => refetchPeriods()}
          >
            Refresh
          </Btn>
        </div>
      }
    >
      {/* KPIs */}
      <AppKpi
        cells={kpiCells.map(c =>
          (c as any).isText
            ? { label: c.label, value: c.value as any, color: c.color }
            : c,
        )}
      />

      {/* Period selector + tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 mt-5 mb-4">
        {/* Month/year selector */}
        <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <select
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
            className="text-xs font-bold border-0 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-slate-300">—</span>
          <select
            value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}
            className="text-xs font-bold border-0 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <span className="text-[10px] font-mono text-slate-400 pl-1">
            {selYear}-{String(selMonth).padStart(2, '0')}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {([
            { id: 'workflow' as const, label: 'Close Workflow', icon: <Zap size={11} /> },
            { id: 'history'  as const, label: 'History',        icon: <BookOpen size={11} /> },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === t.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'workflow' && selectedCompanyId && (
        <WorkflowPanel
          key={`${selectedCompanyId}-${selYear}-${selMonth}`}
          companyId={selectedCompanyId}
          year={selYear}
          month={selMonth}
        />
      )}

      {activeTab === 'workflow' && !selectedCompanyId && (
        <div className="ovds-empty py-20">
          <ShieldCheck size={28} className="text-slate-400 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Select a company first</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Choose a company in the sidebar to access the close workflow
          </p>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <AppTable>
            <thead>
              <tr>
                <AppTh>Period</AppTh>
                <AppTh>Status</AppTh>
                <AppTh>Locked At</AppTh>
                <AppTh>Locked By</AppTh>
                <AppTh align="right" width="120px">Actions</AppTh>
              </tr>
            </thead>
            <tbody>
              {perLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" />
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<BookOpen size={18} />}
                      title="No accounting periods"
                      desc="Close a period using the Workflow tab to see it here"
                    />
                  </td>
                </tr>
              ) : (
                periods.map(p => (
                  <AppTr key={p.id}>
                    <AppTd>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                          ${p.status === 'LOCKED' ? 'bg-violet-50 dark:bg-violet-950/20'
                          : p.status === 'CLOSED' ? 'bg-amber-50 dark:bg-amber-950/20'
                          : 'bg-emerald-50 dark:bg-emerald-950/20'}`}>
                          {p.status === 'LOCKED'
                            ? <Lock size={11} className="text-violet-600 dark:text-violet-400" />
                            : p.status === 'CLOSED'
                              ? <Lock size={11} className="text-amber-600 dark:text-amber-400" />
                              : <Unlock size={11} className="text-emerald-600 dark:text-emerald-400" />
                          }
                        </div>
                        <span className="font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                          {p.period}
                        </span>
                      </div>
                    </AppTd>
                    <AppTd><StatusBadge status={p.status} /></AppTd>
                    <AppTd>
                      {p.lockedAt
                        ? <span className="text-[10px] text-slate-500">{new Date(p.lockedAt).toLocaleDateString('en-ET')}</span>
                        : <span className="text-[10px] text-slate-300">—</span>
                      }
                    </AppTd>
                    <AppTd>
                      <span className="text-[11px] text-slate-500">{p.lockedBy ?? '—'}</span>
                    </AppTd>
                    <AppTd align="right">
                      {p.status === 'LOCKED' && can('period_close:write') && (
                        <Btn
                          variant="ghost" size="sm"
                          icon={<Unlock size={10} />}
                          onClick={() => unlockMutation.mutate(p)}
                          loading={unlockMutation.isPending}
                        >
                          Unlock
                        </Btn>
                      )}
                      {p.status !== 'LOCKED' && (
                        <Btn
                          variant="secondary" size="sm"
                          icon={<Play size={10} />}
                          onClick={() => {
                            setSelYear(p.year ?? now.getFullYear());
                            setSelMonth(p.month ?? now.getMonth() + 1);
                            setActiveTab('workflow');
                          }}
                        >
                          Open
                        </Btn>
                      )}
                    </AppTd>
                  </AppTr>
                ))
              )}
            </tbody>
          </AppTable>

          <Banner
            variant="ifrs"
            title="IFRS Period Close Requirements (IAS 1.27)"
            message="Ensure all adjusting entries, accruals, depreciation, ECL provisions, and deferred tax are posted before locking. Locked periods cannot be modified without ADMIN override (full audit trail maintained)."
            dismissible
          />
        </div>
      )}
    </AppPage>
  );
};

export default PeriodClose;

