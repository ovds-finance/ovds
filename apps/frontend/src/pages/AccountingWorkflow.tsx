/**
 * AccountingWorkflow — OVDS Ethiopian IFRS Accounting System
 * Full 7-module lifecycle view: Operations → People → ovds →
 * Compliance → Reporting → Admin → Developer
 *
 * Covers all Ethiopian tax types for all business sizes/types.
 * IFRS: IAS 1, 2, 7, 12, 15, 16, 19, 21; IFRS 9, 15, 16, 18
 */
import type { BusinessModuleConfig, PeriodEndChecklistItem } from '@ovds/shared';
import {
  buildBusinessProfile, getWorkflowSteps,
  type WorkflowModule, type WorkflowStep, type TaxObligation,
} from '@ovds/shared';
import {
  PERIOD_END_TASKS,
  getBusinessModuleConfig,
  WORKFLOW_TASK_CATALOG,
} from '@ovds/shared';
import {
  GridStatBar,
  GridSection,
} from '@ovds/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Users, Wallet, ShieldCheck, BarChart3,
  Settings, Code2, ChevronRight, CheckCircle2, AlertCircle,
  Clock, BookOpen, Calculator, ArrowRight, Scale,
  Play, RotateCcw, RefreshCw, XCircle, AlertTriangle,
  Layers, ChevronDown,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import {
  AppPage,
  Btn,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { ovdsSummaryApi, periodCloseWorkflowApi } from '../services/ovdsApi';

// ---------------------------------------------------------------------------
// WorkflowTaskPanel — live 7-module task execution UI
// ---------------------------------------------------------------------------

type TaskStatus = 'PENDING' | 'SKIPPED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
type TaskPriority = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';

interface TaskRun {
  taskId: string;
  label: string;
  module: string;
  status: TaskStatus;
  priority: TaskPriority;
  startedAt?: string;
  completedAt?: string;
  details?: string;
  warnings?: string[];
  frameworks?: string[];
  executionMode?: string;
  actionRoute?: string;
  dependsOn?: string[];
  taxTypes?: string[];
  conditionSummary?: string;
}

interface WorkflowRun {
  runId: string;
  companyId: string;
  period: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  tasks: TaskRun[];
  startedAt?: string;
  completedAt?: string;
  summary?: { total: number; required: number; completed: number; failed: number; skipped: number; blocked: number };
}

const MODULE_ORDER = ['CORE_OPERATIONS','PEOPLE','ovds','COMPLIANCE','REPORTING','ADMIN','DEVELOPER'] as const;

const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CORE_OPERATIONS: { bg: 'bg-[var(--pro-azure-50)]', text: 'text-[var(--pro-azure-dark)]', border: 'border-[var(--pro-azure-100)]' },
  PEOPLE:          { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  ovds:         { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },
  COMPLIANCE:      { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  REPORTING:       { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  ADMIN:           { bg: 'bg-white',   text: 'text-slate-700',   border: 'border-slate-200' },
  DEVELOPER:       { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
};

const TASK_STATUS_CFG: Record<TaskStatus, { icon: React.ReactNode; rowCls: string }> = {
  PENDING:   { icon: <Clock size={12} className="text-slate-400" />,                             rowCls: 'bg-white border-slate-200' },
  RUNNING:   { icon: <RefreshCw size={12} className="text-amber-500 animate-spin" />,            rowCls: 'bg-amber-50/40 border-amber-200' },
  COMPLETED: { icon: <CheckCircle2 size={12} className="text-[var(--pro-azure)]" />,                    rowCls: 'bg-[var(--pro-azure-50)]/40 border-[var(--pro-azure-100)]' },
  FAILED:    { icon: <XCircle size={12} className="text-rose-500" />,                            rowCls: 'bg-rose-50/40 border-rose-200' },
  SKIPPED:   { icon: <ChevronRight size={12} className="text-slate-400" />,                      rowCls: 'bg-slate-50/40 border-slate-100 opacity-70' },
  BLOCKED:   { icon: <AlertTriangle size={12} className="text-amber-400" />,                     rowCls: 'bg-amber-50/20 border-amber-100 opacity-80' },
};

const RUN_STATUS_BADGE: Record<string, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED:   'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
  FAILED:      'bg-rose-50 text-rose-700 border-rose-200',
  PARTIAL:     'bg-amber-50 text-amber-700 border-amber-200',
};

const TaskRow: React.FC<{
  task: TaskRun;
  onRetry: (id: string) => void;
  retrying: boolean;
}> = ({ task, onRetry, retrying }) => {
  const [expanded, setExpanded] = useState(task.status === 'FAILED');
  const cfg = TASK_STATUS_CFG[task.status];
  const modCol = MODULE_COLORS[task.module] ?? MODULE_COLORS.CORE_OPERATIONS;

  return (
    <div className={`rounded-xl border transition-all ${cfg.rowCls}`}>
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${modCol.bg} ${modCol.text} ${modCol.border}`}>
              {task.module.replace(/_/g, ' ')}
            </span>
            <span className="ovds-body font-semibold text-slate-800 dark:text-slate-100 truncate">{task.label}</span>
            {task.priority === 'REQUIRED' && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">REQ</span>
            )}
            {task.warnings && task.warnings.length > 0 && task.status === 'COMPLETED' && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                {task.warnings.length}W
              </span>
            )}
          </div>
          {!expanded && task.details && (
            <p className="ovds-caption text-slate-400 truncate mt-0.5">{task.details}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.status === 'FAILED' && (
            <Btn variant="secondary" size="sm"
              icon={<RotateCcw size={10} />}
              onClick={e => { e.stopPropagation(); onRetry(task.taskId); }}
              loading={retrying}
            >Retry</Btn>
          )}
          {expanded
            ? <ChevronDown size={12} className="text-slate-400" />
            : <ChevronRight size={12} className="text-slate-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-100/60 dark:border-slate-800/40 space-y-1.5">
          {task.executionMode && (
            <p className="text-[10px] text-slate-500">
              Mode: <span className="font-mono">{task.executionMode}</span>
              {task.frameworks && task.frameworks.length > 0 && (
                <> · {task.frameworks.slice(0, 3).join(' · ')}</>
              )}
            </p>
          )}
          {task.conditionSummary && task.status === 'SKIPPED' && (
            <p className="text-[10px] text-slate-400 italic">{task.conditionSummary}</p>
          )}
          {task.taxTypes && task.taxTypes.length > 0 && (
            <p className="text-[10px] text-slate-400">Tax: {task.taxTypes.join(', ')}</p>
          )}
          {task.details && (
            <p className={`text-[11px] font-semibold ${task.status === 'FAILED' ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
              {task.details}
            </p>
          )}
          {task.warnings?.map((w, i) => (
            <div key={i} className="flex gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400">{w}</p>
            </div>
          ))}
          {task.completedAt && (
            <p className="ovds-caption text-slate-300 dark:text-slate-600 font-mono">
              {new Date(task.completedAt).toLocaleString('en-ET')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const WorkflowTaskPanel: React.FC<{ companyId: string }> = ({ companyId }) => {
  const qc = useQueryClient();
  const now = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [retrying, setRetrying] = useState<string | null>(null);

  const period = `${selYear}-${String(selMonth).padStart(2, '0')}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const qKey   = ['workflow-run', companyId, period];

  const { data: run, isLoading } = useQuery<WorkflowRun>({
    queryKey: qKey,
    queryFn:  () => ovdsSummaryApi.getWorkflowRun(companyId, period)
                      .catch(() => null) as Promise<WorkflowRun>,
    staleTime: 15_000,
    refetchInterval: (q: any) => {
      const d: WorkflowRun | undefined = q?.state?.data;
      return d?.status === 'IN_PROGRESS' ? 3000 : false;
    },
  });

  const runMut = useMutation({
    mutationFn: () => ovdsSummaryApi.runWorkflow(companyId, period),
    onSuccess:  () => qc.invalidateQueries({ queryKey: qKey }),
    onError:    () => toast.error('Failed to execute workflow'),
  });

  const unifiedMut = useMutation({
    mutationFn: () => periodCloseWorkflowApi.runUnified(companyId, selYear, selMonth),
    onSuccess:  () => {
      toast.success('Unified close completed');
      qc.invalidateQueries({ queryKey: qKey });
    },
    onError:    () => toast.error('Unified close failed'),
  });

  const resetMut = useMutation({
    mutationFn: () => ovdsSummaryApi.resetWorkflowRun(companyId, period),
    onSuccess:  () => { toast.success('Workflow reset'); qc.invalidateQueries({ queryKey: qKey }); },
    onError:    () => toast.error('Reset failed'),
  });

  const retryTask = useCallback(async (taskId: string) => {
    setRetrying(taskId);
    try {
      await ovdsSummaryApi.runWorkflowTask(companyId, period, taskId);
      qc.invalidateQueries({ queryKey: qKey });
    } catch {
      toast.error(`Retry failed: ${taskId}`);
    } finally {
      setRetrying(null);
    }
  }, [companyId, period, qKey, qc]);

  // Group tasks by module
  const tasksByModule = useMemo(() => {
    const tasks = run?.tasks ?? [];
    const map: Record<string, TaskRun[]> = {};
    for (const t of tasks) {
      if (!map[t.module]) map[t.module] = [];
      map[t.module].push(t);
    }
    return map;
  }, [run]);

  const summary = run?.summary;
  const progressPct = summary && summary.total > 0
    ? Math.round((summary.completed / summary.total) * 100) : 0;

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  return (
    <div className="mt-4 space-y-4">
      {/* Period selector + run controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
            className="text-xs font-bold border-0 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none">
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-slate-300">—</span>
          <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
            className="text-xs font-bold border-0 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none">
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <span className="ovds-mono text-slate-400">{period}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress bar */}
          {run && summary && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--pro-azure)] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }} />
              </div>
              <span className="ovds-caption text-slate-400">
                {summary.completed}/{summary.total}
                {summary.failed > 0 && <span className="text-rose-500 ml-1">· {summary.failed} failed</span>}
              </span>
            </div>
          )}
          {run && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RUN_STATUS_BADGE[run.status] ?? RUN_STATUS_BADGE.NOT_STARTED}`}>
              {run.status.replace(/_/g, ' ')}
            </span>
          )}
          {run && run.status !== 'NOT_STARTED' && (
            <Btn variant="ghost" size="sm" icon={<RotateCcw size={10} />}
              onClick={() => resetMut.mutate()} loading={resetMut.isPending}>
              Reset
            </Btn>
          )}
          <Btn variant={run?.status === 'IN_PROGRESS' ? 'secondary' : 'primary'} size="sm"
            icon={run?.status === 'IN_PROGRESS'
              ? <RefreshCw size={11} className="animate-spin" />
              : <Play size={11} />}
            onClick={() => runMut.mutate()} loading={runMut.isPending}>
            {!run || run.status === 'NOT_STARTED' ? 'Run Workflow'
              : run.status === 'IN_PROGRESS' ? 'Running…'
              : run.status === 'FAILED' ? 'Resume'
              : 'Re-run'}
          </Btn>
          <Btn variant="secondary" size="sm" icon={<Layers size={11} />}
            onClick={() => unifiedMut.mutate()} loading={unifiedMut.isPending}
            title="Period-close auto steps + full 38-task engine">
            Unified Close
          </Btn>
        </div>
      </div>

      {/* Task list grouped by module */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !run ? (
        <div className="ovds-empty py-12">
          <Layers size={22} className="text-slate-400 mb-2 mx-auto" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No workflow run yet</p>
          <p className="ovds-caption mt-1">Click "Run Workflow" to execute all checks for {period}</p>
        </div>
      ) : (
        MODULE_ORDER.map(mod => {
          const tasks = tasksByModule[mod];
          if (!tasks || tasks.length === 0) return null;
          const modCol = MODULE_COLORS[mod] ?? MODULE_COLORS.CORE_OPERATIONS;
          const doneCount = tasks.filter(t => t.status === 'COMPLETED').length;
          const failCount = tasks.filter(t => t.status === 'FAILED').length;
          return (
            <div key={mod} className="space-y-1.5">
              <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${modCol.bg} ${modCol.border}`}>
                <span className={`text-[11px] font-bold ${modCol.text}`}>{mod.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  {failCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-600">{failCount} failed</span>
                  )}
                  <span className="text-[10px] text-slate-500">{doneCount}/{tasks.length}</span>
                </div>
              </div>
              {tasks.map(task => (
                <TaskRow
                  key={task.taskId}
                  task={task}
                  onRetry={retryTask}
                  retrying={retrying === task.taskId}
                />
              ))}
            </div>
          );
        })
      )}

      {/* IFRS footnote */}
      <p className="ovds-caption text-slate-400 text-right">
        IAS 1.27 · Proc. 1395/2025 · IFRS 15 · IAS 16 · IAS 19 · IAS 21 — fully automated period-close chain
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WorkflowCatalogPanel — full task catalogue with settings & conditions
// ---------------------------------------------------------------------------

interface CatalogTask {
  id: string;
  module: string;
  label: string;
  description: string;
  priority: string;
  dependsOn: string[];
  applicable: boolean;
  skipReason?: string;
  settings?: {
    books?: string[];
    frameworks?: string[];
    taxTypes?: string[];
    executionMode?: string;
    actionRoute?: string;
  };
  conditions?: {
    sizes?: string[];
    requiresModules?: string[];
    requiresTaxTypes?: string[];
    whenDescription?: string;
    months?: number[];
  };
}

const WorkflowCatalogPanel: React.FC<{ companyId: string }> = ({ companyId }) => {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { data, isLoading } = useQuery({
    queryKey: ['workflow-catalog', companyId, period],
    queryFn: () => ovdsSummaryApi.workflowCatalog(companyId, period),
    staleTime: 60_000,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tasks = (data?.tasks ?? []) as CatalogTask[];
  const byModule = useMemo(() => {
    const map: Record<string, CatalogTask[]> = {};
    for (const t of tasks) {
      if (!map[t.module]) map[t.module] = [];
      map[t.module].push(t);
    }
    return map;
  }, [tasks]);

  if (isLoading) {
    return <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse mt-4" />;
  }

  return (
    <GridSection
      title="Workflow Task Catalogue"
      subtitle={`${data?.applicableTasks ?? 0} of ${data?.totalTasks ?? WORKFLOW_TASK_CATALOG.length} tasks applicable · ${data?.requiredTasks ?? 0} required`}
      icon={<Layers size={14} />}
    >
      <div className="space-y-3">
        {MODULE_ORDER.map(mod => {
          const modTasks = byModule[mod];
          if (!modTasks?.length) return null;
          const modCol = MODULE_COLORS[mod] ?? MODULE_COLORS.CORE_OPERATIONS;
          return (
            <div key={mod} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className={`px-3 py-2 border-b ${modCol.bg} ${modCol.border}`}>
                <span className={`text-[11px] font-bold ${modCol.text}`}>{mod.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-slate-500 ml-2">
                  {modTasks.filter(t => t.applicable).length}/{modTasks.length} active
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {modTasks.map(task => (
                  <div
                    key={task.id}
                    className={`px-3 py-2.5 ${task.applicable ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 opacity-60'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="ovds-mono text-[10px] text-slate-400">{task.id}</span>
                          <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{task.label}</span>
                          {task.priority === 'REQUIRED' && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">REQ</span>
                          )}
                        </div>
                        <p className="ovds-caption mt-0.5 text-slate-500">{task.description}</p>
                        {!task.applicable && task.skipReason && (
                          <p className="text-[10px] text-slate-400 italic mt-1">Skipped: {task.skipReason}</p>
                        )}
                      </div>
                      {task.settings?.executionMode && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                          {task.settings.executionMode}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {task.settings?.frameworks?.slice(0, 4).map(f => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">{f}</span>
                      ))}
                      {task.settings?.taxTypes?.map(tx => (
                        <span key={tx} className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">{tx}</span>
                      ))}
                      {task.dependsOn.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
                          after {task.dependsOn.length} step(s)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GridSection>
  );
};

// ---------------------------------------------------------------------------
// Module metadata — icons, colors, routes
// ---------------------------------------------------------------------------

const MODULE_META: Record<WorkflowModule, {
  icon: React.ElementType;
  color: string;
  bg: string;
  routes: { label: string; to: string }[];
}> = {
  CORE_OPERATIONS: {
    icon: ShoppingCart,
    color: 'text-[var(--pro-azure-dark)]',
    bg: 'bg-[var(--pro-azure-50)]',
    routes: [
      { label: 'Invoices', to: '/sales/invoices' },
      { label: 'Bills', to: '/purchases/bills' },
      { label: 'Inventory', to: '/inventory' },
      { label: 'Purchase Orders', to: '/purchases/orders' },
      { label: 'GRNs', to: '/goods-received-notes' },
      { label: 'Items', to: '/items' },
    ],
  },
  PEOPLE: {
    icon: Users,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    routes: [
      { label: 'Payroll', to: '/hr/payroll' },
      { label: 'Employees', to: '/hr/employees' },
      { label: 'PAYE Declarations', to: '/paye-declarations' },
      { label: 'Leave', to: '/hr/leaves' },
      { label: 'Attendance', to: '/hr/attendance' },
      { label: 'Employee Benefits', to: '/employee-benefits' },
    ],
  },
  ovds: {
    icon: Wallet,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    routes: [
      { label: 'Accounting', to: '/accounting' },
      { label: 'Fixed Assets', to: '/accounting/fixed-assets' },
      { label: 'Bank Reconciliation', to: '/banking/reconciliation' },
      { label: 'Deferred Tax', to: '/deferred-tax' },
      { label: 'ECL Provision', to: '/ecl-provision' },
      { label: 'FX Rates', to: '/banking/fx-rates' },
    ],
  },
  COMPLIANCE: {
    icon: ShieldCheck,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    routes: [
      { label: 'Tax Dashboard', to: '/tax-dashboard' },
      { label: 'VAT Filing', to: '/tax-filing' },
      { label: 'TOT Filing', to: '/tot-filing' },
      { label: 'WHT Certificates', to: '/wht-certificates' },
      { label: 'Business Income Tax', to: '/tax/business-income' },
      { label: 'Period Close', to: '/accounting/period-close' },
    ],
  },
  REPORTING: {
    icon: BarChart3,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    routes: [
      { label: 'MoR IFRS Report', to: '/reports/mor-report' },
      { label: 'Reports', to: '/reports' },
      { label: 'Schedule D Tax', to: '/schedule-d-tax' },
      { label: 'Budget Variance', to: '/budget-variance' },
      { label: 'Equity Statement', to: '/equity-statement' },
      { label: 'Audit Logs', to: '/settings/audit-logs' },
    ],
  },
  ADMIN: {
    icon: Settings,
    color: 'text-slate-600',
    bg: 'bg-white',
    routes: [
      { label: 'Settings', to: '/settings' },
      { label: 'Users', to: '/settings/users' },
      { label: 'Roles & Permissions', to: '/settings/roles' },
      { label: 'Multi-Company', to: '/companies' },
      { label: 'IFRS Standards', to: '/settings' },
      { label: 'Calendar', to: '/hr/calendar' },
    ],
  },
  DEVELOPER: {
    icon: Code2,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    routes: [
      { label: 'API Docs', to: '/settings/api-docs' },
      { label: 'Webhooks', to: '/settings' },
      { label: 'eTax Portal', to: '/tax-dashboard' },
      { label: 'Import Center', to: '/settings/import' },
      { label: 'App Store', to: '/settings/app-store' },
      { label: 'V&V Compliance', to: '/vandv-compliance' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tax Type chip
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TaxChip: React.FC<{ label: string; rate: string; active: boolean }> = ({
  label, rate, active,
}) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
    active
      ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]'
      : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
  }`}>
    {label} <span className="font-bold">{rate}</span>
  </span>
);

// ---------------------------------------------------------------------------
// Workflow Module Card
// ---------------------------------------------------------------------------

const WorkflowCard: React.FC<{
  step: WorkflowStep;
  isActive: boolean;
  onClick: () => void;
}> = ({ step, isActive, onClick }) => {
  const meta = MODULE_META[step.module];
  const Icon = meta.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isActive
          ? 'border-[var(--pro-azure)] bg-[var(--pro-azure-50)] shadow-md'
          : step.applies
            ? 'border-slate-200 bg-white hover:border-[var(--pro-azure-light)] hover:shadow-sm'
            : 'border-slate-100 bg-white opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="ovds-card-title">{step.name}</span>
            {step.applies
              ? <CheckCircle2 size={13} className="text-[var(--pro-azure)] shrink-0" />
              : <AlertCircle size={13} className="text-slate-400 shrink-0" />}
          </div>
          <p className="ovds-caption mt-0.5 line-clamp-2">{step.description}</p>
        </div>
        <ChevronRight size={14} className={`shrink-0 mt-1 ${isActive ? 'text-[var(--pro-azure)]' : 'text-slate-300'}`} />
      </div>
    </button>
  );
};

// ---------------------------------------------------------------------------
// Detail Panel — shown when a module card is selected
// ---------------------------------------------------------------------------

const ModuleDetailPanel: React.FC<{
  step: WorkflowStep;
}> = ({ step }) => {
  const meta = MODULE_META[step.module];
  const navigate = useNavigate();
  const ModIcon = meta.icon;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}>
          <ModIcon size={20} className={meta.color} />
        </div>
        <div>
          <h2 className="ovds-module-title">{step.name}</h2>
          <p className="ovds-caption">{step.description}</p>
        </div>
      </div>

      {/* IFRS Principles */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">IFRS / IAS Standards</p>
        <div className="flex flex-wrap gap-1.5">
          {step.ifrsPrinciples.map((p) => (
            <span key={p} className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-[10px] font-semibold">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Tax Obligation */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Tax Obligation</p>
        <p className="ovds-body text-slate-600">{step.taxObligation}</p>
      </div>

      {/* Auto Actions */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">System Auto-Actions</p>
        <ul className="space-y-1.5">
          {step.autoActions.map((a) => (
            <li key={a} className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[var(--pro-azure)] mt-0.5 shrink-0" />
              <span className="ovds-body text-slate-600">{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick navigation */}
      <div className="mt-auto">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Quick Links</p>
        <div className="grid grid-cols-2 gap-2">
          {meta.routes.map((r) => (
            <button
              key={r.to}
              onClick={() => navigate(r.to)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[var(--pro-azure-50)] border border-slate-200 hover:border-[var(--pro-azure-100)] text-left transition-colors"
            >
              <ArrowRight size={11} className="text-[var(--pro-azure)] shrink-0" />
              <span className="ovds-body text-slate-700 truncate">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tax Type Matrix — shows all Ethiopian tax types by applicability
// ---------------------------------------------------------------------------

const ALL_TAX_TYPES = [
  { key: 'VAT',           label: 'VAT',          rate: '15%',  detail: 'Turnover ≥ ETB 2M, monthly', color: 'green' },
  { key: 'TOT_GOODS',     label: 'TOT Goods',    rate: '2%',   detail: 'Non-VAT, ETB 500K–2M', color: 'teal' },
  { key: 'TOT_SERVICES',  label: 'TOT Services', rate: '10%',  detail: 'Non-VAT service income', color: 'teal' },
  { key: 'CIT',           label: 'CIT',          rate: '30%',  detail: 'Corporate income tax', color: 'violet' },
  { key: 'PIT_BUSINESS',  label: 'BIT',          rate: '0–35%',detail: 'Schedule A progressive', color: 'violet' },
  { key: 'MAT',           label: 'MAT',          rate: '2.5%', detail: 'Min alternative tax on turnover', color: 'orange' },
  { key: 'PAYROLL_PIT',   label: 'PAYE',         rate: '0–35%',detail: 'Employee income tax', color: 'sky' },
  { key: 'PENSION',       label: 'Pension',      rate: '18%',  detail: '7% emp + 11% employer', color: 'sky' },
  { key: 'DRRF',          label: 'DRRF',         rate: '1%',   detail: 'Quarterly levy', color: 'amber' },
  { key: 'WHT_GOODS',     label: 'WHT Goods',    rate: '2%',   detail: 'Purchases ≥ ETB 10,000', color: 'rose' },
  { key: 'WHT_SERVICES',  label: 'WHT Services', rate: '3%',   detail: 'Services ≥ ETB 3,000', color: 'rose' },
  { key: 'WHT_DIVIDEND',  label: 'Dividend WHT', rate: '15%',  detail: 'On dividend distribution', color: 'rose' },
  { key: 'CAPITAL_GAINS', label: 'CGT',          rate: '15%',  detail: 'Schedule D disposal', color: 'rose' },
  { key: 'EXCISE',        label: 'Excise',       rate: '5–500%',detail: 'Manufacturing/import', color: 'orange' },
  { key: 'STAMP_DUTY',    label: 'Stamp Duty',   rate: '1%',   detail: 'Legal contracts, min ETB 500', color: 'slate' },
];

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function AccountingWorkflow() {
  usePageTitle('Accounting Workflow');
  const navigate = useNavigate();
  const { selectedCompanyId, companies } = useBusiness();
  const company = companies.find(c => c.id === selectedCompanyId) ?? companies[0];

  const [activeModule, setActiveModule] = useState<WorkflowModule>('CORE_OPERATIONS');
  const [activeTab, setActiveTab] = useState<'workflow' | 'taxes' | 'ifrs' | 'period' | 'modules'>('workflow');

  // Fetch workflow profile from backend (authoritative source)
  const { data: apiProfile } = useQuery({
    queryKey: ['workflow-profile', selectedCompanyId],
    queryFn: () => ovdsSummaryApi.workflowProfile(selectedCompanyId),
    staleTime: 5 * 60 * 1000,
  });

  // Build profile locally as fallback / for immediate render
  const localProfile = useMemo(() => {
    if (!company) return null;
    try {
      return buildBusinessProfile({
        businessId: company.id ?? 'default',
        name: company.name ?? 'My Business',
        tin: (company as any).tin ?? '0000000000',
        type: (company as any).type ?? 'PLC',
        sector: (company as any).sector ?? 'SERVICES',
        annualTurnover: Number((company as any).annualTurnover ?? 5_000_000),
        employeeCount: Number((company as any).employeeCount ?? 10),
        isVatRegistered: Boolean((company as any).isVatRegistered ?? true),
      });
    } catch { return null; }
  }, [company]);

  // Prefer API profile (real DB data), fall back to local computation
  const profile = (apiProfile?.profile) ?? localProfile;

  const workflowSteps = useMemo<WorkflowStep[]>(
    () => (apiProfile?.workflowSteps as WorkflowStep[] | undefined)
      ?? (profile ? getWorkflowSteps(profile) : []),
    [apiProfile, profile],
  );

  const activeStep = workflowSteps.find((s: WorkflowStep) => s.module === activeModule);
  const applicableObligations = (profile?.taxObligations ?? [] as TaxObligation[]).filter((o: TaxObligation) => o.applies);
  const moduleConfig = useMemo<BusinessModuleConfig | null>(
    () => (apiProfile?.moduleConfig as BusinessModuleConfig | undefined)
      ?? (profile ? getBusinessModuleConfig(profile.size as BusinessModuleConfig['size']) : null),
    [apiProfile, profile],
  );
  const periodEndChecklist = useMemo<PeriodEndChecklistItem[]>(
    () => (apiProfile?.periodEndChecklist as PeriodEndChecklistItem[] | undefined)
      ?? (PERIOD_END_TASKS as Array<Omit<PeriodEndChecklistItem, 'status' | 'completedAt' | 'completedBy'>>)
          .map((t): PeriodEndChecklistItem => ({ ...t, status: 'PENDING' })),
    [apiProfile],
  );
  const completedRequired = periodEndChecklist.filter((t: PeriodEndChecklistItem) => t.required && t.status === 'COMPLETED').length;
  const totalRequired = periodEndChecklist.filter((t: PeriodEndChecklistItem) => t.required).length;

  // Live workflow summary for the current period (drives the KPI bar "Period Close" cell)
  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { data: wfSummary } = useQuery({
    queryKey: ['workflow-summary', selectedCompanyId, currentPeriod],
    queryFn: () => selectedCompanyId
      ? ovdsSummaryApi.workflowSummary(selectedCompanyId, currentPeriod).catch(() => null)
      : Promise.resolve(null),
    staleTime: 30_000,
    enabled: !!selectedCompanyId,
  });

  // KPI cells for stat bar
  const periodCloseValue = wfSummary
    ? `${wfSummary.requiredDone ?? 0}/${wfSummary.requiredTotal ?? 0}`
    : `${completedRequired}/${totalRequired}`;
  const periodCloseOk = wfSummary
    ? (wfSummary.requiredDone ?? 0) >= (wfSummary.requiredTotal ?? 1) && (wfSummary.failedCount ?? 0) === 0
    : completedRequired === totalRequired;

  const kpiCells = [
    {
      label: 'Tax Obligations',
      value: String(applicableObligations.length),
      accentCls: 'bg-rose-500',
    },
    {
      label: 'IFRS Standard',
      value: profile?.ifrsStandard?.replace('_', ' ') ?? '—',
      accentCls: 'bg-violet-500',
    },
    {
      label: 'Taxpayer Category',
      value: profile ? `Category ${profile.ercaCategory}` : '—',
      accentCls: 'bg-[var(--pro-azure)]',
    },
    {
      label: 'Business Size',
      value: profile?.size ?? '—',
      accentCls: 'bg-sky-500',
    },
    {
      label: 'Workflow Tasks',
      value: String(WORKFLOW_TASK_CATALOG.length),
      accentCls: 'bg-teal-500',
    },
    {
      label: 'Period Close',
      value: periodCloseValue,
      accentCls: periodCloseOk ? 'bg-[var(--pro-azure)]' : (wfSummary?.failedCount ? 'bg-rose-500' : 'bg-amber-500'),
    },
  ];

  const tabs = [
    { id: 'workflow',  label: 'Workflow Modules' },
    { id: 'taxes',     label: 'Tax Types' },
    { id: 'ifrs',      label: 'IFRS Checklist' },
    { id: 'period',    label: 'Period Close' },
    { id: 'modules',   label: 'Module Config' },
  ];

  return (
    <AppPage
      title="Accounting Workflow"
      subtitle="Ethiopian IFRS + Tax — end-to-end operations lifecycle"
      icon={<BookOpen size={16} />}
      iconBg="bg-violet-500"
      actions={
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={() => navigate('/tax-dashboard')}>
            Tax Dashboard
          </Btn>
          <Btn size="sm" onClick={() => navigate('/reports/mor-report')}>
            MoR IFRS Report
          </Btn>
        </div>
      }
      tabs={
        <div className="flex gap-1 ovds-tab-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as 'workflow' | 'taxes' | 'ifrs' | 'period' | 'modules')}
              className={`ovds-tab ${activeTab === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {/* KPI Bar */}
      <GridStatBar cells={kpiCells} />

      {/* ── TAB: WORKFLOW ─────────────────────────────────────────────── */}
      {activeTab === 'workflow' && (
        <div className="ovds-grid-layout cols-3 gap-sm mt-4" style={{ gridTemplateColumns: '1fr 1fr 1.6fr' }}>
          {/* Left: workflow steps list */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">7-Module Lifecycle</p>
            {workflowSteps.map((step: WorkflowStep) => (
              <WorkflowCard
                key={step.module}
                step={step}
                isActive={activeModule === step.module}
                onClick={() => setActiveModule(step.module)}
              />
            ))}
          </div>

          {/* Right: detail panel */}
          <div className="ovds-col-span-2">
            {activeStep ? (
              <div className="ovds-widget-card h-full p-5">
                <ModuleDetailPanel step={activeStep} />
              </div>
            ) : (
              <div className="ovds-empty">
                <BookOpen size={28} className="mx-auto mb-2 text-slate-300" />
                <p>Select a workflow module</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TAXES ────────────────────────────────────────────────── */}
      {activeTab === 'taxes' && (
        <div className="mt-4 space-y-4">
          <GridSection
            title="Ethiopian Tax Type Matrix"
            subtitle="All applicable taxes based on your business profile"
            icon={<ShieldCheck size={14} />}
          >
            <div className="ovds-grid-layout cols-3 gap-sm">
              {ALL_TAX_TYPES.map((tax) => {
                const isActive = (profile?.taxObligations ?? []).some(
                  (o: TaxObligation) => o.taxType === tax.key && o.applies,
                );
                return (
                  <div
                    key={tax.key}
                    className={`p-3 rounded-xl border ${
                      isActive
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-white border-slate-100 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="ovds-card-title">{tax.label}</span>
                      <span className={`text-[11px] font-bold ${isActive ? 'text-[var(--pro-azure)]' : 'text-slate-400'}`}>
                        {tax.rate}
                      </span>
                    </div>
                    <p className="ovds-caption">{tax.detail}</p>
                    {isActive
                      ? <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[var(--pro-azure)] font-medium">
                          <CheckCircle2 size={10} /> Applies
                        </span>
                      : <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <AlertCircle size={10} /> Not applicable
                        </span>
                    }
                  </div>
                );
              })}
            </div>
          </GridSection>

          {/* Tax obligation table */}
          <GridSection title="Active Tax Obligations" icon={<Calculator size={14} />}>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    {['Tax Type', 'Rate', 'Period', 'Threshold', 'Legal Reference'].map(h => (
                      <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3 py-2 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(applicableObligations as TaxObligation[]).map((o: TaxObligation, i: number) => (
                    <tr key={o.taxType} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 font-semibold text-slate-800">{o.taxType}</td>
                      <td className="px-3 py-2 text-[var(--pro-azure)] font-bold">{(o.rate * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2 ovds-caption">{o.period}</td>
                      <td className="px-3 py-2 ovds-caption">
                        {o.threshold ? `ETB ${o.threshold.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-3 py-2 ovds-mono">{o.proclamationRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GridSection>
        </div>
      )}

      {/* ── TAB: IFRS ─────────────────────────────────────────────────── */}
      {activeTab === 'ifrs' && (
        <div className="mt-4">
          <GridSection
            title="IFRS Compliance Checklist"
            subtitle={`Applicable standard: ${profile?.ifrsStandard?.replace('_', ' ') ?? 'IFRS Full'}`}
            icon={<Scale size={14} />}
          >
            <div className="ovds-grid-layout cols-2 gap-sm">
              {[
                { std: 'IAS 2',  title: 'Inventory Valuation',   desc: 'FIFO or AVCO; write-down to NRV. Tax book: acquisition cost.',                   status: 'done' },
                { std: 'IAS 7',  title: 'Cash Flow Statement',   desc: 'Indirect method; classify operating/investing/financing.',                        status: 'done' },
                { std: 'IAS 12', title: 'Deferred Tax',          desc: '30% rate on temporary differences: depr, ECL, accruals, leases.',                 status: 'done' },
                { std: 'IAS 16', title: 'Fixed Assets',          desc: 'Component depreciation or revaluation model. Tax: pool Cat 1–4.',                 status: 'done' },
                { std: 'IAS 19', title: 'Employee Benefits',     desc: 'Gratuity PV, leave accrual, pension. Labour Proc. 1156/2019.',                    status: 'done' },
                { std: 'IAS 21', title: 'Foreign Exchange',      desc: 'Revalue monetary items at NBE closing rate; FX gain/loss to P&L.',               status: 'done' },
                { std: 'IFRS 9', title: 'Expected Credit Loss',  desc: 'Stage 1/2/3 ECL matrix on receivables. Tax: specific provision only.',            status: 'done' },
                { std: 'IFRS 15',title: 'Revenue Recognition',   desc: '5-step model: contract → PO → price → allocation → recognition.',                 status: 'done' },
                { std: 'IFRS 16',title: 'Leases',                desc: 'ROU asset + lease liability. Tax: operating lease payments deductible.',          status: 'done' },
                { std: 'IFRS 18',title: 'P&L Classification',    desc: 'Operating / Investing / Financing categories. Effective 2027.',                   status: 'pending' },
                { std: 'IAS 1',  title: 'Presentation',          desc: 'Comparative statements, going concern, accounting policies.',                     status: 'done' },
                { std: 'IAS 36', title: 'Impairment',            desc: 'Annual impairment test for goodwill and indefinite-life intangibles.',            status: 'pending' },
              ].map((item) => (
                <div key={item.std} className="flex gap-3 p-3 rounded-xl bg-white border border-slate-200">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.status === 'done' ? 'bg-[var(--pro-azure-50)]' : 'bg-amber-50'}`}>
                    {item.status === 'done' ? <CheckCircle2 size={16} className="text-[var(--pro-azure)]" /> : <Clock size={16} className="text-amber-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="ovds-card-title">{item.std}</span>
                      <span className="ovds-mono">{item.title}</span>
                    </div>
                    <p className="ovds-caption mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GridSection>
        </div>
      )}

      {/* ── TAB: PERIOD CLOSE ─────────────────────────────────────────── */}
      {activeTab === 'period' && selectedCompanyId && (
        <WorkflowTaskPanel companyId={selectedCompanyId} />
      )}
      {activeTab === 'period' && !selectedCompanyId && (
        <div className="ovds-empty py-16 mt-4">
          <Layers size={24} className="text-slate-400 mb-2 mx-auto" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Select a company to run the workflow</p>
        </div>
      )}

      {/* ── TAB: MODULE CONFIG ────────────────────────────────────────── */}
      {activeTab === 'modules' && (
        <div className="mt-4 space-y-4">
          {selectedCompanyId && <WorkflowCatalogPanel companyId={selectedCompanyId} />}
          <GridSection
            title="Module Configuration"
            subtitle={`${profile?.size ?? 'Business'} — ${moduleConfig?.taxObligationSummary ?? ''}`}
            icon={<Settings size={14} />}
          >
            <div className="ovds-grid-layout cols-2 gap-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Required Modules</p>
                <div className="space-y-1">
                  {(moduleConfig?.requiredModules ?? []).map((m: string) => (
                    <div key={m} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]">
                      <CheckCircle2 size={12} className="text-[var(--pro-azure)] shrink-0" />
                      <span className="ovds-body text-slate-700">{m.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Optional Modules</p>
                <div className="space-y-1">
                  {(moduleConfig?.optionalModules ?? []).map((m: string) => (
                    <div key={m} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                      <AlertCircle size={12} className="text-slate-400 shrink-0" />
                      <span className="ovds-body text-slate-500">{m.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {!(moduleConfig?.optionalModules?.length) && (
                    <p className="ovds-caption text-slate-400 px-2">All modules are required for this size.</p>
                  )}
                </div>
              </div>
            </div>
          </GridSection>
        </div>
      )}
    </AppPage>
  );
}
