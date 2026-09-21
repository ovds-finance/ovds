/**
 * Projects — full project management with tasks, milestones, timesheets
 * Ovds style: AppPage · AppKpi · AppTable · tabs · modals
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Plus, Edit2, Trash2, RefreshCw,
  Calendar, CheckSquare, Flag, Clock, ChevronRight,
  BarChart2, Users, Target, MessageSquare, Paperclip,
  Play, Square, Activity, Link2, TrendingUp,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination, Amount,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { fmtETB } from '../utils/ethiopianTax';

// -- Types ---------------------------------------------------------------------
interface Project {
  id: string; name: string; description?: string; status: string;
  budget?: number; spent?: number; progress?: number;
  startDate?: string; endDate?: string; manager?: string; teamSize?: number;
  companyId?: string; createdAt: string;
  _count?: { tasks: number; milestones: number; timesheets: number };
}
interface ProjectTask {
  id: string; projectId: string; milestoneId?: string; title: string; description?: string;
  status: string; priority: string; assignedTo?: string;
  dueDate?: string; estimatedHours?: number; actualHours?: number;
  completedAt?: string; createdAt: string;
  billingStyle?: string; fixedRate?: number; profitMargin?: number;
}
interface ProjectMilestone {
  id: string; projectId: string; name: string; description?: string;
  status: string; dueDate?: string; completedAt?: string; createdAt: string;
  progress?: number; budget?: number; spent?: number;
}
interface ProjectTimesheet {
  id: string; projectId: string; taskId?: string; employeeName?: string;
  date: string; hours: number; description?: string;
  billable: boolean; hourlyRate?: number; billableAmount?: number;
  task?: { id: string; title: string };
}
interface ProjectComment {
  id: string; taskId: string; parentId?: string;
  body: string; authorName?: string; authorId?: string;
  createdAt: string; updatedAt: string;
}
interface ProjectAttachment {
  id: string; taskId: string; filename: string; url: string;
  mimeType?: string; size?: number; uploadedBy?: string; createdAt: string;
}
interface ProjectTimer {
  id: string; projectId: string; taskId: string;
  employeeName?: string; userId?: string;
  startedAt: string; stoppedAt?: string; hours?: number; notes?: string;
  task?: { id: string; title: string };
}
interface ProjectActivity {
  id: string; projectId: string; taskId?: string; milestoneId?: string;
  activityType: string; title?: string; description?: string;
  delta?: string; createdBy?: string; createdAt: string;
}
interface ProjectFinancialLink {
  id: string; projectId: string; taskId?: string;
  linkType: string; linkId: string; linkNumber?: string;
  amount: number; currencyCode: string; direction: string;
  linkDate?: string; notes?: string; createdAt: string;
}
interface ProjectProfitability {
  projectId: string; projectName: string;
  budget: number; spent: number; totalIncome: number;
  totalExpenses: number; laborCost: number;
  netProfit: number; margin: number;
  incomeByType: Record<string, number>;
  expenseByType: Record<string, number>;
  totalHours: number; avgHourlyRate: number;
}
interface TaskProfitability {
  taskId: string; taskTitle: string;
  taskRevenue: number; taskCost: number; taskLaborCost: number;
  taskProfit: number; taskMargin: number;
  taskHours: number; taskAvgRate: number;
}

type MainTab = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
type DetailTab = 'tasks' | 'milestones' | 'timesheets' | 'comments' | 'attachments' | 'timers' | 'activities' | 'financials' | 'profitability';

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-slate-400', MEDIUM: 'text-sky-500', HIGH: 'text-amber-500', URGENT: 'text-rose-500',
};
const TASK_STATUS_COLOR: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600', IN_PROGRESS: 'bg-sky-100 text-sky-700',
  REVIEW: 'bg-amber-100 text-amber-700', DONE: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  CANCELLED: 'bg-rose-100 text-rose-600',
};

// -- Project Form --------------------------------------------------------------
const ProjectForm: React.FC<{ data: Partial<Project>; onChange: (d: Partial<Project>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof Project, v: any) => onChange({ ...data, [k]: v });
  const pct = data.budget && data.spent ? Math.min(100, (data.spent / data.budget) * 100) : 0;
  return (
    <div className="space-y-3">
      <FormField label="Project Name" required>
        <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. ERP Implementation" />
      </FormField>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Project scope and objectives…" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Manager">
          <Input value={data.manager ?? ''} onChange={e => set('manager', e.target.value)} placeholder="Project manager name" />
        </FormField>
        <FormField label="Team Size">
          <Input type="number" min={1} value={data.teamSize ?? ''} onChange={e => set('teamSize', parseInt(e.target.value) || undefined)} placeholder="e.g. 5" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Date">
          <Input type="date" value={data.startDate?.slice(0, 10) ?? ''} onChange={e => set('startDate', e.target.value)} />
        </FormField>
        <FormField label="End Date">
          <Input type="date" value={data.endDate?.slice(0, 10) ?? ''} onChange={e => set('endDate', e.target.value)} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Budget (ETB)">
          <Input type="number" step="0.01" value={data.budget ?? ''} onChange={e => set('budget', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Status">
          <Select value={data.status ?? 'ACTIVE'} onChange={e => set('status', e)}>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </FormField>
      </div>
      {pct > 0 && (
        <div className="p-3 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-500">Budget Used</span>
            <span className={`text-[10px] font-bold ${pct > 90 ? 'text-rose-600' : pct > 70 ? 'text-amber-600' : 'text-[var(--pro-azure)]'}`}>{pct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-[var(--pro-azure-50)]0'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

// -- Task Form -----------------------------------------------------------------
const TaskForm: React.FC<{ data: Partial<ProjectTask>; onChange: (d: Partial<ProjectTask>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ProjectTask, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Task Title" required>
        <Input value={data.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Design database schema" />
      </FormField>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status">
          <Select value={data.status ?? 'TODO'} onChange={e => set('status', e)}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select value={data.priority ?? 'MEDIUM'} onChange={e => set('priority', e)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Assigned To">
          <Input value={data.assignedTo ?? ''} onChange={e => set('assignedTo', e.target.value)} placeholder="Team member name" />
        </FormField>
        <FormField label="Due Date">
          <Input type="date" value={data.dueDate?.slice(0, 10) ?? ''} onChange={e => set('dueDate', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Estimated Hours">
        <Input type="number" step="0.5" min={0} value={data.estimatedHours ?? ''} onChange={e => set('estimatedHours', parseFloat(e.target.value) || undefined)} placeholder="e.g. 8" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Billing Style">
          <Select value={data.billingStyle ?? 'HOURLY'} onChange={e => set('billingStyle', e)}>
            <option value="HOURLY">Hourly</option>
            <option value="FIXED_PRICE">Fixed Price</option>
            <option value="FIXED_PER_TASK">Fixed Per Task</option>
          </Select>
        </FormField>
        <FormField label="Fixed Rate (ETB)">
          <Input type="number" step="0.01" min={0} value={data.fixedRate ?? ''} onChange={e => set('fixedRate', parseFloat(e.target.value) || undefined)} placeholder="0.00" />
        </FormField>
      </div>
      <FormField label="Profit Margin (%)">
        <Input type="number" step="1" min={0} max={100} value={data.profitMargin ?? ''} onChange={e => set('profitMargin', parseInt(e.target.value) || undefined)} placeholder="e.g. 20" />
      </FormField>
    </div>
  );
};

// -- Milestone Form ------------------------------------------------------------
const MilestoneForm: React.FC<{ data: Partial<ProjectMilestone>; onChange: (d: Partial<ProjectMilestone>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ProjectMilestone, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Milestone Name" required>
        <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Phase 1 Complete" />
      </FormField>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Due Date">
          <Input type="date" value={data.dueDate?.slice(0, 10) ?? ''} onChange={e => set('dueDate', e.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select value={data.status ?? 'PENDING'} onChange={e => set('status', e)}>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </Select>
        </FormField>
      </div>
    </div>
  );
};

// -- Timesheet Form ------------------------------------------------------------
const TimesheetForm: React.FC<{
  data: Partial<ProjectTimesheet>;
  tasks: ProjectTask[];
  onChange: (d: Partial<ProjectTimesheet>) => void;
}> = ({ data, tasks, onChange }) => {
  const set = (k: keyof ProjectTimesheet, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date" required>
          <Input type="date" value={data.date?.slice(0, 10) ?? ''} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Hours" required>
          <Input type="number" step="0.25" min={0.25} value={data.hours ?? ''} onChange={e => set('hours', parseFloat(e.target.value) || 0)} placeholder="e.g. 4" />
        </FormField>
      </div>
      <FormField label="Task (optional)">
        <Select value={data.taskId ?? ''} onChange={e => set('taskId', e || undefined)}>
          <option value="">— No specific task —</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </Select>
      </FormField>
      <FormField label="Employee Name">
        <Input value={data.employeeName ?? ''} onChange={e => set('employeeName', e.target.value)} placeholder="Who logged this time?" />
      </FormField>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="What was worked on?" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Hourly Rate (ETB)">
          <Input type="number" step="0.01" min={0} value={data.hourlyRate ?? ''} onChange={e => set('hourlyRate', parseFloat(e.target.value) || undefined)} placeholder="0.00" />
        </FormField>
        <FormField label="Billable">
          <Select value={data.billable === false ? 'false' : 'true'} onChange={e => set('billable', e === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </FormField>
      </div>
    </div>
  );
};

// -- Comment Form ---------------------------------------------------------------
const CommentForm: React.FC<{ data: Partial<ProjectComment>; onChange: (d: Partial<ProjectComment>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ProjectComment, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Comment" required>
        <Textarea value={data.body ?? ''} onChange={e => set('body', e.target.value)} rows={3} placeholder="Write a comment…" />
      </FormField>
      <FormField label="Author Name">
        <Input value={data.authorName ?? ''} onChange={e => set('authorName', e.target.value)} placeholder="Your name" />
      </FormField>
    </div>
  );
};

// -- Attachment Form ------------------------------------------------------------
const AttachmentForm: React.FC<{ data: Partial<ProjectAttachment>; onChange: (d: Partial<ProjectAttachment>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ProjectAttachment, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Filename" required>
        <Input value={data.filename ?? ''} onChange={e => set('filename', e.target.value)} placeholder="e.g. design-spec.pdf" />
      </FormField>
      <FormField label="File URL" required>
        <Input value={data.url ?? ''} onChange={e => set('url', e.target.value)} placeholder="https://..." />
      </FormField>
      <FormField label="MIME Type">
        <Input value={data.mimeType ?? ''} onChange={e => set('mimeType', e.target.value)} placeholder="application/pdf" />
      </FormField>
    </div>
  );
};

// -- Timer Form -----------------------------------------------------------------
const TimerForm: React.FC<{ data: Partial<ProjectTimer>; onChange: (d: Partial<ProjectTimer>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ProjectTimer, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Hours">
        <Input type="number" step="0.25" min={0.25} value={data.hours ?? ''} onChange={e => set('hours', parseFloat(e.target.value) || undefined)} placeholder="e.g. 2.5" />
      </FormField>
      <FormField label="Employee Name">
        <Input value={data.employeeName ?? ''} onChange={e => set('employeeName', e.target.value)} placeholder="Who worked on this?" />
      </FormField>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Optional notes…" />
      </FormField>
    </div>
  );
};

// -- Activity Form --------------------------------------------------------------
const ActivityForm: React.FC<{ data: Partial<ProjectActivity>; onChange: (d: Partial<ProjectActivity>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ProjectActivity, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Activity Type" required>
        <Select value={data.activityType ?? ''} onChange={e => set('activityType', e)}>
          <option value="">Select type…</option>
          <option value="TASK_CREATED">Task Created</option>
          <option value="TASK_UPDATED">Task Updated</option>
          <option value="TIMER_STARTED">Timer Started</option>
          <option value="TIMER_STOPPED">Timer Stopped</option>
          <option value="COMMENT_ADDED">Comment Added</option>
          <option value="FILE_ATTACHED">File Attached</option>
          <option value="FINANCIAL_LINKED">Financial Linked</option>
          <option value="MILESTONE_UPDATED">Milestone Updated</option>
          <option value="STATUS_CHANGED">Status Changed</option>
          <option value="BILLING_UPDATED">Billing Updated</option>
        </Select>
      </FormField>
      <FormField label="Title">
        <Input value={data.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Short title" />
      </FormField>
      <FormField label="Description">
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Details…" />
      </FormField>
    </div>
  );
};

// -- Financial Link Form --------------------------------------------------------
const FinancialLinkForm: React.FC<{ data: Partial<ProjectFinancialLink>; onChange: (d: Partial<ProjectFinancialLink>) => void }> = ({ data, onChange }) => {
  const set = (k: keyof ProjectFinancialLink, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Link Type" required>
          <Select value={data.linkType ?? ''} onChange={e => set('linkType', e)}>
            <option value="">Select…</option>
            <option value="INVOICE">Invoice</option>
            <option value="INCOME">Income</option>
            <option value="VENDOR_BILL">Vendor Bill</option>
            <option value="PAYMENT">Payment</option>
            <option value="CREDIT_NOTE">Credit Note</option>
          </Select>
        </FormField>
        <FormField label="Direction">
          <Select value={data.direction ?? 'IN'} onChange={e => set('direction', e)}>
            <option value="IN">In</option>
            <option value="OUT">Out</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Link ID" required>
          <Input value={data.linkId ?? ''} onChange={e => set('linkId', e.target.value)} placeholder="e.g. INV-001" />
        </FormField>
        <FormField label="Link Number">
          <Input value={data.linkNumber ?? ''} onChange={e => set('linkNumber', e.target.value)} placeholder="Display number" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount" required>
          <Input type="number" step="0.01" min={0} value={data.amount ?? ''} onChange={e => set('amount', parseFloat(e.target.value) || 0)} placeholder="0.00" />
        </FormField>
        <FormField label="Currency">
          <Input value={data.currencyCode ?? 'ETB'} onChange={e => set('currencyCode', e.target.value)} placeholder="ETB" />
        </FormField>
      </div>
      <FormField label="Link Date">
        <Input type="date" value={data.linkDate?.slice(0, 10) ?? ''} onChange={e => set('linkDate', e.target.value)} />
      </FormField>
      <FormField label="Notes">
        <Textarea value={data.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} />
      </FormField>
    </div>
  );
};

// -- Project Detail Panel ------------------------------------------------------
const ProjectDetail: React.FC<{
  project: Project;
  onClose: () => void;
  onEdit: () => void;
  canWrite: boolean;
}> = ({ project, onClose, onEdit, canWrite }) => {
  const qc = useQueryClient();
  const [detailTab, setDetailTab] = useState<DetailTab>('tasks');
  const [taskModal, setTaskModal] = useState<{ open: boolean; data: Partial<ProjectTask> }>({ open: false, data: {} });
  const [msModal, setMsModal] = useState<{ open: boolean; data: Partial<ProjectMilestone> }>({ open: false, data: {} });
  const [tsModal, setTsModal] = useState<{ open: boolean; data: Partial<ProjectTimesheet> }>({ open: false, data: {} });
  const [commentModal, setCommentModal] = useState<{ open: boolean; data: Partial<ProjectComment> }>({ open: false, data: {} });
  const [attachModal, setAttachModal] = useState<{ open: boolean; data: Partial<ProjectAttachment> }>({ open: false, data: {} });
  const [timerModal, setTimerModal] = useState<{ open: boolean; data: Partial<ProjectTimer> }>({ open: false, data: {} });
  const [activityModal, setActivityModal] = useState<{ open: boolean; data: Partial<ProjectActivity> }>({ open: false, data: {} });
  const [linkModal, setLinkModal] = useState<{ open: boolean; data: Partial<ProjectFinancialLink> }>({ open: false, data: {} });
  const [activeTaskId, _setActiveTaskId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: tasks = [], refetch: refetchTasks } = useQuery<ProjectTask[]>({
    queryKey: ['project-tasks', project.id],
    queryFn: () => api.get(`/projects/${project.id}/tasks`).then((r: any) => r.data),
  });
  const { data: milestones = [], refetch: refetchMs } = useQuery<ProjectMilestone[]>({
    queryKey: ['project-milestones', project.id],
    queryFn: () => api.get(`/projects/${project.id}/milestones`).then((r: any) => r.data),
  });
  const { data: timesheets = [], refetch: refetchTs } = useQuery<ProjectTimesheet[]>({
    queryKey: ['project-timesheets', project.id],
    queryFn: () => api.get(`/projects/${project.id}/timesheets`).then((r: any) => r.data),
  });
  const { data: tsSummary } = useQuery({
    queryKey: ['project-ts-summary', project.id],
    queryFn: () => api.get(`/projects/${project.id}/timesheets/summary`).then((r: any) => r.data),
  });

  const currentTaskId = activeTaskId ?? tasks[0]?.id;
  const { data: comments = [], refetch: refetchComments } = useQuery<ProjectComment[]>({
    queryKey: ['project-comments', project.id, currentTaskId],
    enabled: detailTab === 'comments' && !!currentTaskId,
    queryFn: () => api.get(`/projects/tasks/${currentTaskId}/comments`).then((r: any) => r.data),
  });
  const { data: attachments = [], refetch: refetchAttachments } = useQuery<ProjectAttachment[]>({
    queryKey: ['project-attachments', project.id, currentTaskId],
    enabled: detailTab === 'attachments' && !!currentTaskId,
    queryFn: () => api.get(`/projects/tasks/${currentTaskId}/attachments`).then((r: any) => r.data),
  });
  const { data: timers = [], refetch: refetchTimers } = useQuery<ProjectTimer[]>({
    queryKey: ['project-timers', project.id],
    enabled: detailTab === 'timers',
    queryFn: () => api.get(`/projects/timers?projectId=${project.id}`).then((r: any) => r.data),
  });
  const { data: activities = [], refetch: refetchActivities } = useQuery<ProjectActivity[]>({
    queryKey: ['project-activities', project.id],
    enabled: detailTab === 'activities',
    queryFn: () => api.get(`/projects/${project.id}/activities`).then((r: any) => r.data),
  });
  const { data: financialLinks = [], refetch: refetchFinancials } = useQuery<ProjectFinancialLink[]>({
    queryKey: ['project-financial-links', project.id],
    enabled: detailTab === 'financials',
    queryFn: () => api.get(`/projects/${project.id}/financial-links`).then((r: any) => r.data),
  });
  const { data: taskFinancialLinks = [], refetch: _refetchTaskFinancials } = useQuery<ProjectFinancialLink[]>({
    queryKey: ['project-task-financial-links', project.id, currentTaskId],
    enabled: detailTab === 'financials' && !!currentTaskId,
    queryFn: () => api.get(`/projects/tasks/${currentTaskId}/financial-links`).then((r: any) => r.data),
  });
  const { data: profitability } = useQuery<ProjectProfitability>({
    queryKey: ['project-profitability', project.id],
    enabled: detailTab === 'profitability',
    queryFn: () => api.get(`/projects/${project.id}/profitability`).then((r: any) => r.data),
  });
  const { data: taskProfitability } = useQuery<TaskProfitability>({
    queryKey: ['project-task-profitability', project.id, currentTaskId],
    enabled: detailTab === 'profitability' && !!currentTaskId,
    queryFn: () => api.get(`/projects/tasks/${currentTaskId}/profitability`).then((r: any) => r.data),
  });

  const saveTask = async () => {
    if (!taskModal.data.title?.trim()) { toast.error('Task title is required'); return; }
    setSaving(true);
    try {
      if (taskModal.data.id) {
        await api.patch(`/projects/tasks/${taskModal.data.id}`, taskModal.data);
        toast.success('Task updated');
      } else {
        await api.post('/projects/tasks', { ...taskModal.data, projectId: project.id });
        toast.success('Task created');
      }
      setTaskModal({ open: false, data: {} });
      refetchTasks();
      qc.invalidateQueries({ queryKey: ['projects'] });
    } catch { toast.error('Failed to save task'); }
    finally { setSaving(false); }
  };

  const deleteTask = async (id: string, title: string) => {
    if (!await confirm({ title: `Delete task "${title}"?`, variant: 'danger' })) return;
    await api.delete(`/projects/tasks/${id}`);
    toast.success('Task deleted');
    refetchTasks();
  };

  const saveMilestone = async () => {
    if (!msModal.data.name?.trim()) { toast.error('Milestone name is required'); return; }
    setSaving(true);
    try {
      if (msModal.data.id) {
        await api.patch(`/projects/milestones/${msModal.data.id}`, msModal.data);
        toast.success('Milestone updated');
      } else {
        await api.post('/projects/milestones', { ...msModal.data, projectId: project.id });
        toast.success('Milestone created');
      }
      setMsModal({ open: false, data: {} });
      refetchMs();
    } catch { toast.error('Failed to save milestone'); }
    finally { setSaving(false); }
  };

  const deleteMilestone = async (id: string, name: string) => {
    if (!await confirm({ title: `Delete milestone "${name}"?`, variant: 'danger' })) return;
    await api.delete(`/projects/milestones/${id}`);
    toast.success('Milestone deleted');
    refetchMs();
  };

  const saveTimesheet = async () => {
    if (!tsModal.data.hours || tsModal.data.hours <= 0) { toast.error('Hours must be > 0'); return; }
    if (!tsModal.data.date) { toast.error('Date is required'); return; }
    setSaving(true);
    try {
      if (tsModal.data.id) {
        await api.patch(`/projects/timesheets/${tsModal.data.id}`, tsModal.data);
        toast.success('Timesheet updated');
      } else {
        await api.post('/projects/timesheets', { ...tsModal.data, projectId: project.id });
        toast.success('Time logged');
      }
      setTsModal({ open: false, data: {} });
      refetchTs();
    } catch { toast.error('Failed to save timesheet'); }
    finally { setSaving(false); }
  };

  const deleteTimesheet = async (id: string) => {
    if (!await confirm({ title: 'Delete this timesheet entry?', variant: 'danger' })) return;
    await api.delete(`/projects/timesheets/${id}`);
    toast.success('Entry deleted');
    refetchTs();
  };

  const saveComment = async () => {
    if (!commentModal.data.body?.trim()) { toast.error('Comment is required'); return; }
    setSaving(true);
    try {
      if (commentModal.data.id) {
        await api.patch(`/projects/comments/${commentModal.data.id}`, commentModal.data);
        toast.success('Comment updated');
      } else {
        await api.post(`/projects/tasks/${currentTaskId}/comments`, commentModal.data);
        toast.success('Comment added');
      }
      setCommentModal({ open: false, data: {} });
      refetchComments();
    } catch { toast.error('Failed to save comment'); }
    finally { setSaving(false); }
  };

  const deleteComment = async (id: string) => {
    if (!await confirm({ title: 'Delete this comment?', variant: 'danger' })) return;
    await api.delete(`/projects/comments/${id}`);
    toast.success('Comment deleted');
    refetchComments();
  };

  const saveAttachment = async () => {
    if (!attachModal.data.filename?.trim() || !attachModal.data.url?.trim()) { toast.error('Filename and URL required'); return; }
    setSaving(true);
    try {
      if (attachModal.data.id) {
        await api.patch(`/projects/attachments/${attachModal.data.id}`, attachModal.data);
        toast.success('Attachment updated');
      } else {
        await api.post(`/projects/tasks/${currentTaskId}/attachments`, attachModal.data);
        toast.success('File attached');
      }
      setAttachModal({ open: false, data: {} });
      refetchAttachments();
    } catch { toast.error('Failed to save attachment'); }
    finally { setSaving(false); }
  };

  const deleteAttachment = async (id: string) => {
    if (!await confirm({ title: 'Delete this attachment?', variant: 'danger' })) return;
    await api.delete(`/projects/attachments/${id}`);
    toast.success('Attachment deleted');
    refetchAttachments();
  };

  const saveTimer = async () => {
    setSaving(true);
    try {
      if (timerModal.data.id) {
        await api.patch(`/projects/timers/${timerModal.data.id}`, timerModal.data);
        toast.success('Timer updated');
      } else {
        await api.post('/projects/timers', { ...timerModal.data, projectId: project.id, taskId: currentTaskId || timerModal.data.taskId });
        toast.success('Timer created');
      }
      setTimerModal({ open: false, data: {} });
      refetchTimers();
    } catch { toast.error('Failed to save timer'); }
    finally { setSaving(false); }
  };

  const startTimer = async (taskId: string) => {
    setSaving(true);
    try {
      await api.post('/projects/timers/start', { projectId: project.id, taskId });
      toast.success('Timer started');
      refetchTimers();
    } catch { toast.error('Failed to start timer'); }
    finally { setSaving(false); }
  };

  const stopTimer = async (id: string) => {
    setSaving(true);
    try {
      await api.post(`/projects/timers/${id}/stop`, {});
      toast.success('Timer stopped — timesheet entry auto-created');
      refetchTimers();
      refetchTs();
      qc.invalidateQueries({ queryKey: ['projects'] });
    } catch { toast.error('Failed to stop timer'); }
    finally { setSaving(false); }
  };

  const deleteTimer = async (id: string) => {
    if (!await confirm({ title: 'Delete this timer?', variant: 'danger' })) return;
    await api.delete(`/projects/timers/${id}`);
    toast.success('Timer deleted');
    refetchTimers();
  };

  const saveActivity = async () => {
    if (!activityModal.data.activityType) { toast.error('Activity type is required'); return; }
    setSaving(true);
    try {
      if (activityModal.data.id) {
        await api.patch(`/projects/activities/${activityModal.data.id}`, activityModal.data);
        toast.success('Activity updated');
      } else {
        await api.post('/projects/activities', { ...activityModal.data, projectId: project.id, taskId: currentTaskId || activityModal.data.taskId });
        toast.success('Activity logged');
      }
      setActivityModal({ open: false, data: {} });
      refetchActivities();
    } catch { toast.error('Failed to save activity'); }
    finally { setSaving(false); }
  };

  const deleteActivity = async (id: string) => {
    if (!await confirm({ title: 'Delete this activity?', variant: 'danger' })) return;
    await api.delete(`/projects/activities/${id}`);
    toast.success('Activity deleted');
    refetchActivities();
  };

  const saveFinancialLink = async () => {
    if (!linkModal.data.linkId || !linkModal.data.linkType) { toast.error('Link ID and type required'); return; }
    setSaving(true);
    try {
      if (linkModal.data.id) {
        await api.patch(`/projects/financial-links/${linkModal.data.id}`, linkModal.data);
        toast.success('Link updated');
      } else {
        await api.post('/projects/financial-links', { ...linkModal.data, projectId: project.id, taskId: currentTaskId || linkModal.data.taskId });
        toast.success('Financial link created');
      }
      setLinkModal({ open: false, data: {} });
      refetchFinancials();
      qc.invalidateQueries({ queryKey: ['projects'] });
    } catch { toast.error('Failed to save link'); }
    finally { setSaving(false); }
  };

  const deleteFinancialLink = async (id: string) => {
    if (!await confirm({ title: 'Delete this financial link?', variant: 'danger' })) return;
    await api.delete(`/projects/financial-links/${id}`);
    toast.success('Link deleted');
    refetchFinancials();
    qc.invalidateQueries({ queryKey: ['projects'] });
  };

  const pct = project.budget && project.spent ? Math.min(100, (project.spent / project.budget) * 100) : 0;
  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const completedMs = milestones.filter(m => m.status === 'COMPLETED').length;
  const totalBillable = timesheets.reduce((s, t) => s + (t.billableAmount ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={project.status} />
            {project.manager && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Users size={9} />{project.manager}</span>}
          </div>
          <h2 className="text-base font-bold text-slate-800 truncate">{project.name}</h2>
          {project.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{project.description}</p>}
        </div>
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {canWrite && <Btn variant="ghost" size="sm" icon={<Edit2 size={11} />} onClick={onEdit}>Edit</Btn>}
          <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div className="ovds-grid-layout cols-4 gap-sm p-4 border-b border-slate-100">
        {[
          { label: 'Tasks', value: `${doneTasks}/${tasks.length}`, icon: <CheckSquare size={13} className="text-sky-500" /> },
          { label: 'Milestones', value: `${completedMs}/${milestones.length}`, icon: <Target size={13} className="text-violet-500" /> },
          { label: 'Hours', value: `${(tsSummary?.totalHours ?? 0).toFixed(1)}h`, icon: <Clock size={13} className="text-amber-500" /> },
          { label: 'Billable', value: fmtETB(totalBillable), icon: <BarChart2 size={13} className="text-[var(--pro-azure)]" /> },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">{k.icon}<span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{k.label}</span></div>
            <p className="text-sm font-bold text-slate-800">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      {project.budget && (
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="ovds-caption">Budget: <span className="font-semibold text-slate-600">{fmtETB(project.budget)}</span></span>
            <span className={`text-[10px] font-bold ${pct > 90 ? 'text-rose-600' : pct > 70 ? 'text-amber-600' : 'text-[var(--pro-azure)]'}`}>{pct.toFixed(1)}% used</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-[var(--pro-azure-50)]0'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Detail tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100">
        {([
          { key: 'tasks', label: 'Tasks', count: tasks.length },
          { key: 'milestones', label: 'Milestones', count: milestones.length },
          { key: 'timesheets', label: 'Timesheets', count: timesheets.length },
          { key: 'comments', label: 'Comments', count: comments.length },
          { key: 'attachments', label: 'Files', count: attachments.length },
          { key: 'timers', label: 'Timers', count: timers.length },
          { key: 'activities', label: 'Activity', count: activities.length },
          { key: 'financials', label: 'Financials', count: financialLinks.length },
          { key: 'profitability', label: 'Profit', count: 0 },
        ] as { key: DetailTab; label: string; count: number }[]).map(t => (
          <button key={t.key} onClick={() => setDetailTab(t.key)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg capitalize transition-all ${detailTab === t.key ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'text-slate-500 hover:bg-slate-50'}`}>
            {t.label} {t.count > 0 && `(${t.count})`}
          </button>
        ))}
        <div className="flex-1" />
        {canWrite && (
          <Btn variant="primary" size="sm" icon={<Plus size={11} />} onClick={() => {
            if (detailTab === 'tasks') setTaskModal({ open: true, data: { status: 'TODO', priority: 'MEDIUM' } });
            else if (detailTab === 'milestones') setMsModal({ open: true, data: { status: 'PENDING' } });
            else if (detailTab === 'timesheets') setTsModal({ open: true, data: { billable: true, date: new Date().toISOString().slice(0, 10) } });
            else if (detailTab === 'comments') setCommentModal({ open: true, data: { taskId: currentTaskId } });
            else if (detailTab === 'attachments') setAttachModal({ open: true, data: { taskId: currentTaskId } });
            else if (detailTab === 'timers') setTimerModal({ open: true, data: { projectId: project.id, taskId: currentTaskId } });
            else if (detailTab === 'activities') setActivityModal({ open: true, data: { projectId: project.id, taskId: currentTaskId } });
            else if (detailTab === 'financials') setLinkModal({ open: true, data: { projectId: project.id, taskId: currentTaskId } });
          }}>
            Add {detailTab === 'tasks' ? 'Task' : detailTab === 'milestones' ? 'Milestone' : detailTab === 'timesheets' ? 'Time' : detailTab === 'comments' ? 'Comment' : detailTab === 'attachments' ? 'File' : detailTab === 'timers' ? 'Timer' : detailTab === 'activities' ? 'Activity' : detailTab === 'financials' ? 'Link' : 'Item'}
          </Btn>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Tasks */}
        {detailTab === 'tasks' && (
          tasks.length === 0
            ? <EmptyState icon={<CheckSquare size={18} />} title="No tasks yet" desc="Break the project into actionable tasks" action={canWrite ? { label: 'Add Task', onClick: () => setTaskModal({ open: true, data: { status: 'TODO', priority: 'MEDIUM' } }) } : undefined} />
            : tasks.map(task => {
              const ms = milestones.find(m => m.id === task.milestoneId);
              return (
              <div key={task.id} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all group">
                <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${TASK_STATUS_COLOR[task.status] ?? 'bg-slate-100 text-slate-600'}`}>{task.status.replace('_', ' ')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] font-semibold ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                    {task.assignedTo && <span className="ovds-caption">{task.assignedTo}</span>}
                    {task.dueDate && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Calendar size={8} />{new Date(task.dueDate).toLocaleDateString()}</span>}
                    {task.estimatedHours && <span className="ovds-caption">{task.estimatedHours}h est.</span>}
                    {task.actualHours && <span className="ovds-caption">{Number(task.actualHours).toFixed(1)}h actual</span>}
                    <span className="text-[10px] font-semibold text-slate-500">Billing: {task.billingStyle ?? 'HOURLY'}</span>
                    {task.fixedRate && <span className="text-[10px] font-semibold text-[var(--pro-azure)]">{fmtETB(Number(task.fixedRate))}</span>}
                    {ms && <span className="text-[9px] font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{ms.name}</span>}
                  </div>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startTimer(task.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]" title="Start timer"><Play size={10} /></button>
                    <button onClick={() => setTaskModal({ open: true, data: { ...task } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]"><Edit2 size={10} /></button>
                    <button onClick={() => deleteTask(task.id, task.title)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                  </div>
                )}
              </div>
              );
            })
        )}

        {/* Milestones */}
        {detailTab === 'milestones' && (
          milestones.length === 0
            ? <EmptyState icon={<Flag size={18} />} title="No milestones" desc="Add milestones to track key project goals" action={canWrite ? { label: 'Add Milestone', onClick: () => setMsModal({ open: true, data: { status: 'PENDING' } }) } : undefined} />
            : milestones.map(ms => {
                const msTasks = tasks.filter(t => t.milestoneId === ms.id);
                const doneMsTasks = msTasks.filter(t => t.status === 'DONE').length;
                const msProgress = msTasks.length > 0 ? Math.round((doneMsTasks / msTasks.length) * 100) : (ms.progress ?? 0);
                return (
                <div key={ms.id} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all group">
                  <Flag size={14} className={ms.status === 'COMPLETED' ? 'text-[var(--pro-azure)]' : ms.status === 'MISSED' ? 'text-rose-500' : 'text-amber-500'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">{ms.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <StatusBadge status={ms.status} />
                      {ms.dueDate && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Calendar size={8} />{new Date(ms.dueDate).toLocaleDateString()}</span>}
                      <span className="text-[10px] text-slate-500">{msTasks.length} tasks · {doneMsTasks}/{msTasks.length} done</span>
                    </div>
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="ovds-caption">Progress</span>
                        <span className="text-[9px] font-bold text-slate-500">{msProgress}%</span>
                      </div>
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${msProgress >= 100 ? 'bg-[var(--pro-azure-50)]0' : msProgress > 50 ? 'bg-sky-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, msProgress)}%` }} />
                      </div>
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setMsModal({ open: true, data: { ...ms } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]"><Edit2 size={10} /></button>
                      <button onClick={() => deleteMilestone(ms.id, ms.name)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                    </div>
                  )}
                </div>
                );
              })
        )}

        {/* Timesheets */}
        {detailTab === 'timesheets' && (
          timesheets.length === 0
            ? <EmptyState icon={<Clock size={18} />} title="No time logged" desc="Track billable and non-billable hours" action={canWrite ? { label: 'Log Time', onClick: () => setTsModal({ open: true, data: { billable: true, date: new Date().toISOString().slice(0, 10) } }) } : undefined} />
            : timesheets.map(ts => (
              <div key={ts.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-sky-600">{ts.hours}h</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-700 truncate">{ts.description || ts.task?.title || 'General work'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="ovds-caption">{new Date(ts.date).toLocaleDateString()}</span>
                    {ts.employeeName && <span className="ovds-caption">{ts.employeeName}</span>}
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${ts.billable ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' : 'bg-slate-100 text-slate-500'}`}>{ts.billable ? 'Billable' : 'Non-billable'}</span>
                    {ts.billableAmount != null && ts.billableAmount > 0 && <span className="text-[10px] font-semibold text-[var(--pro-azure)]">{fmtETB(ts.billableAmount)}</span>}
                  </div>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setTsModal({ open: true, data: { ...ts } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]"><Edit2 size={10} /></button>
                    <button onClick={() => deleteTimesheet(ts.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Comments */}
          {detailTab === 'comments' && (
            !currentTaskId ? <EmptyState icon={<MessageSquare size={18} />} title="Select a task" desc="Choose a task to view comments" /> :
            comments.length === 0
              ? <EmptyState icon={<MessageSquare size={18} />} title="No comments" desc="Start the conversation on this task" action={canWrite ? { label: 'Add Comment', onClick: () => setCommentModal({ open: true, data: { taskId: currentTaskId } }) } : undefined} />
              : <div className="space-y-2">
                  {comments.map(c => (
                    <div key={c.id} className="p-3 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[12px] text-slate-700">{c.body}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-semibold text-slate-500">{c.authorName || 'Anonymous'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setCommentModal({ open: true, data: { ...c } })} className="text-[10px] text-slate-400 hover:text-[var(--pro-azure)]"><Edit2 size={10} /></button>
                          <button onClick={() => deleteComment(c.id)} className="text-[10px] text-slate-400 hover:text-rose-600"><Trash2 size={10} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
          )}

          {/* Attachments */}
          {detailTab === 'attachments' && (
            !currentTaskId ? <EmptyState icon={<Paperclip size={18} />} title="Select a task" desc="Choose a task to view files" /> :
            attachments.length === 0
              ? <EmptyState icon={<Paperclip size={18} />} title="No files" desc="Attach files to this task" action={canWrite ? { label: 'Attach File', onClick: () => setAttachModal({ open: true, data: { taskId: currentTaskId } }) } : undefined} />
              : <div className="space-y-2">
                  {attachments.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl group">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                        <Paperclip size={14} className="text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 truncate">{a.filename}</p>
                        <span className="text-[10px] text-slate-400">{a.mimeType || 'File'} · {new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-[10px] text-[var(--pro-azure)] hover:underline">Open</a>
                      {canWrite && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setAttachModal({ open: true, data: { ...a } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]"><Edit2 size={10} /></button>
                          <button onClick={() => deleteAttachment(a.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
          )}

          {/* Timers */}
          {detailTab === 'timers' && (
            timers.length === 0
              ? <EmptyState icon={<Play size={18} />} title="No timers" desc="Track time with native timers" action={canWrite ? { label: 'Start Timer', onClick: () => setTimerModal({ open: true, data: { projectId: project.id, taskId: currentTaskId } }) } : undefined} />
              : <div className="space-y-2">
                  {timers.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.stoppedAt ? 'bg-slate-100 border border-slate-200' : 'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]'}`}>
                        {t.stoppedAt ? <Square size={14} className="text-slate-400" /> : <Play size={14} className="text-[var(--pro-azure)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800">{t.task?.title || 'Timer'}</p>
                        <span className="text-[10px] text-slate-400">{new Date(t.startedAt).toLocaleString()}</span>
                        {t.hours && <span className="text-[10px] font-semibold text-slate-600 ml-2">{t.hours}h</span>}
                      </div>
                      {!t.stoppedAt && canWrite && (
                        <button onClick={() => stopTimer(t.id)} className="px-2 py-1 text-[10px] font-bold text-white bg-[var(--pro-azure-50)]0 rounded-lg hover:bg-[var(--pro-azure-dark)]">Stop</button>
                      )}
                      {canWrite && (
                        <button onClick={() => deleteTimer(t.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                      )}
                    </div>
                  ))}
                </div>
          )}

          {/* Activities */}
          {detailTab === 'activities' && (
            activities.length === 0
              ? <EmptyState icon={<Activity size={18} />} title="No activity" desc="Project activity will appear here" action={canWrite ? { label: 'Log Activity', onClick: () => setActivityModal({ open: true, data: { projectId: project.id, taskId: currentTaskId } }) } : undefined} />
              : <div className="space-y-4">
                  {(() => {
                    const grouped: Record<string, ProjectActivity[]> = {};
                    const _noMilestone: ProjectActivity[] = [];
                    activities.forEach(a => {
                      const msId = a.milestoneId || '__no_milestone__';
                      if (!grouped[msId]) grouped[msId] = [];
                      grouped[msId].push(a);
                    });
                    return Object.entries(grouped).map(([msId, acts]) => {
                      const ms = msId === '__no_milestone__' ? null : milestones.find(m => m.id === msId);
                      const sortedActs = [...acts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                      return (
                        <div key={msId}>
                          {ms && (
                            <div className="flex items-center gap-2 mb-2 px-1">
                              <Flag size={12} className="text-violet-500" />
                              <span className="text-[11px] font-semibold text-slate-700">{ms.name}</span>
                              <span className="text-[10px] text-slate-400">{ms.status}</span>
                            </div>
                          )}
                          <div className="space-y-2">
                            {sortedActs.map(a => {
                              const task = tasks.find(t => t.id === a.taskId);
                              return (
                                <div key={a.id} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                  <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                                    <Activity size={14} className="text-violet-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-slate-800">{a.title || a.activityType.replace(/_/g, ' ')}</p>
                                    {a.description && <p className="text-[11px] text-slate-500 mt-0.5">{a.description}</p>}
                                    <div className="flex items-center gap-2 mt-1">
                                      {task && <span className="text-[10px] text-slate-500">Task: {task.title}</span>}
                                      <span className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  {canWrite && (
                                    <button onClick={() => deleteActivity(a.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
          )}

          {/* Financial Links */}
          {detailTab === 'financials' && (
            <div className="space-y-4">
              {currentTaskId && taskFinancialLinks.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Task-Level Links</p>
                  <div className="space-y-2">
                    {taskFinancialLinks.map(l => (
                      <div key={l.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${l.direction === 'IN' ? 'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]' : 'bg-rose-50 border border-rose-100'}`}>
                          <TrendingUp size={14} className={l.direction === 'IN' ? 'text-[var(--pro-azure)]' : 'text-rose-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-slate-800">{l.linkType} {l.linkNumber ? `· ${l.linkNumber}` : ''}</p>
                          <span className="text-[10px] text-slate-400">{l.linkId} · {l.direction}</span>
                        </div>
                        <span className={`text-[12px] font-bold ${l.direction === 'IN' ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{fmtETB(Number(l.amount))}</span>
                        {canWrite && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setLinkModal({ open: true, data: { ...l } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]"><Edit2 size={10} /></button>
                            <button onClick={() => deleteFinancialLink(l.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Project-Level Links</p>
                {financialLinks.length === 0
                  ? <EmptyState icon={<Link2 size={18} />} title="No financial links" desc="Link invoices, bills, and payments" action={canWrite ? { label: 'Add Link', onClick: () => setLinkModal({ open: true, data: { projectId: project.id, taskId: currentTaskId } }) } : undefined} />
                  : <div className="space-y-2">
                      {financialLinks.map(l => (
                        <div key={l.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${l.direction === 'IN' ? 'bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]' : 'bg-rose-50 border border-rose-100'}`}>
                            <TrendingUp size={14} className={l.direction === 'IN' ? 'text-[var(--pro-azure)]' : 'text-rose-500'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-slate-800">{l.linkType} {l.linkNumber ? `· ${l.linkNumber}` : ''}</p>
                            <span className="text-[10px] text-slate-400">{l.linkId} · {l.direction}</span>
                          </div>
                          <span className={`text-[12px] font-bold ${l.direction === 'IN' ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{fmtETB(Number(l.amount))}</span>
                          {canWrite && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => setLinkModal({ open: true, data: { ...l } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)]"><Edit2 size={10} /></button>
                              <button onClick={() => deleteFinancialLink(l.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={10} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          )}

          {/* Profitability */}
          {detailTab === 'profitability' && (
            <div className="space-y-4">
              {currentTaskId && taskProfitability && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Task Profitability</p>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl">
                    <p className="text-[12px] font-semibold text-slate-800 mb-2">{taskProfitability.taskTitle || 'Selected Task'}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Task Revenue</p>
                        <p className="text-sm font-bold text-[var(--pro-azure)]">{fmtETB(Number(taskProfitability.taskRevenue || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Task Cost</p>
                        <p className="text-sm font-bold text-rose-600">{fmtETB(Number(taskProfitability.taskCost || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Task Profit</p>
                        <p className={`text-sm font-bold ${Number(taskProfitability.taskProfit || 0) >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{fmtETB(Number(taskProfitability.taskProfit || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Task Margin</p>
                        <p className={`text-sm font-bold ${Number(taskProfitability.taskMargin || 0) >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{Number(taskProfitability.taskMargin || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {profitability ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Income</p>
                      <p className="text-lg font-bold text-[var(--pro-azure)]">{fmtETB(profitability.totalIncome)}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Expenses</p>
                      <p className="text-lg font-bold text-rose-600">{fmtETB(profitability.totalExpenses + profitability.laborCost)}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Net Profit</p>
                      <p className={`text-lg font-bold ${profitability.netProfit >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{fmtETB(profitability.netProfit)}</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Margin</p>
                      <p className={`text-lg font-bold ${profitability.margin >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>{profitability.margin.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Breakdown</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[12px]"><span className="text-slate-600">Budget</span><span className="font-semibold">{fmtETB(profitability.budget)}</span></div>
                      <div className="flex justify-between text-[12px]"><span className="text-slate-600">Spent</span><span className="font-semibold">{fmtETB(profitability.spent)}</span></div>
                      <div className="flex justify-between text-[12px]"><span className="text-slate-600">Labor Cost</span><span className="font-semibold">{fmtETB(profitability.laborCost)}</span></div>
                      <div className="flex justify-between text-[12px]"><span className="text-slate-600">Total Hours</span><span className="font-semibold">{profitability.totalHours.toFixed(1)}h</span></div>
                      <div className="flex justify-between text-[12px]"><span className="text-slate-600">Avg Rate</span><span className="font-semibold">{fmtETB(profitability.avgHourlyRate)}/h</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon={<TrendingUp size={18} />} title="No data" desc="Profitability analysis will appear here" />
              )}
            </div>
          )}
      </div>

      {/* Task modal */}
      <Modal open={taskModal.open} onClose={() => setTaskModal({ open: false, data: {} })}
        title={taskModal.data.id ? 'Edit Task' : 'New Task'} subtitle="Project task management · IT & Software · Manufacturing & Logistics · Strategic Insights"
        footer={<><Btn variant="secondary" onClick={() => setTaskModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveTask}>{taskModal.data.id ? 'Save' : 'Create Task'}</Btn></>}>
        <TaskForm data={taskModal.data} onChange={d => setTaskModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Milestone modal */}
      <Modal open={msModal.open} onClose={() => setMsModal({ open: false, data: {} })}
        title={msModal.data.id ? 'Edit Milestone' : 'New Milestone'} subtitle="Track key project goals · Project Management Software · IT & Software · Strategic Insights"
        footer={<><Btn variant="secondary" onClick={() => setMsModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveMilestone}>{msModal.data.id ? 'Save' : 'Create Milestone'}</Btn></>}>
        <MilestoneForm data={msModal.data} onChange={d => setMsModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Timesheet modal */}
      <Modal open={tsModal.open} onClose={() => setTsModal({ open: false, data: {} })}
        title={tsModal.data.id ? 'Edit Time Entry' : 'Log Time'} subtitle="Track billable hours · IT & Software · Manufacturing & Logistics · ERP · Revenue"
        footer={<><Btn variant="secondary" onClick={() => setTsModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveTimesheet}>{tsModal.data.id ? 'Save' : 'Log Time'}</Btn></>}>
        <TimesheetForm data={tsModal.data} tasks={tasks} onChange={d => setTsModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Comment modal */}
      <Modal open={commentModal.open} onClose={() => setCommentModal({ open: false, data: {} })}
        title={commentModal.data.id ? 'Edit Comment' : 'New Comment'} subtitle="Team collaboration · Project Management Software"
        footer={<><Btn variant="secondary" onClick={() => setCommentModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveComment}>{commentModal.data.id ? 'Save' : 'Add Comment'}</Btn></>}>
        <CommentForm data={commentModal.data} onChange={d => setCommentModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Attachment modal */}
      <Modal open={attachModal.open} onClose={() => setAttachModal({ open: false, data: {} })}
        title={attachModal.data.id ? 'Edit Attachment' : 'Attach File'} subtitle="File management · Project Management Software"
        footer={<><Btn variant="secondary" onClick={() => setAttachModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveAttachment}>{attachModal.data.id ? 'Save' : 'Attach'}</Btn></>}>
        <AttachmentForm data={attachModal.data} onChange={d => setAttachModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Timer modal */}
      <Modal open={timerModal.open} onClose={() => setTimerModal({ open: false, data: {} })}
        title={timerModal.data.id ? 'Edit Timer' : 'New Timer'} subtitle="Time tracking · Project Management Software"
        footer={<><Btn variant="secondary" onClick={() => setTimerModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveTimer}>{timerModal.data.id ? 'Save' : 'Create Timer'}</Btn></>}>
        <TimerForm data={timerModal.data} onChange={d => setTimerModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Activity modal */}
      <Modal open={activityModal.open} onClose={() => setActivityModal({ open: false, data: {} })}
        title={activityModal.data.id ? 'Edit Activity' : 'Log Activity'} subtitle="Activity timeline · Project Management Software"
        footer={<><Btn variant="secondary" onClick={() => setActivityModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveActivity}>{activityModal.data.id ? 'Save' : 'Log Activity'}</Btn></>}>
        <ActivityForm data={activityModal.data} onChange={d => setActivityModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* Financial Link modal */}
      <Modal open={linkModal.open} onClose={() => setLinkModal({ open: false, data: {} })}
        title={linkModal.data.id ? 'Edit Financial Link' : 'Link Transaction'} subtitle="Financial integration · Project Management Software"
        footer={<><Btn variant="secondary" onClick={() => setLinkModal({ open: false, data: {} })}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={saveFinancialLink}>{linkModal.data.id ? 'Save' : 'Create Link'}</Btn></>}>
        <FinancialLinkForm data={linkModal.data} onChange={d => setLinkModal(m => ({ ...m, data: d }))} />
      </Modal>
    </div>
  );
};

// -- Main Projects Page --------------------------------------------------------
const Projects: React.FC = () => {
  usePageTitle('Projects');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]         = useState<MainTab>('ALL');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<Project | null>(null);
  const [modal, setModal]     = useState<{ open: boolean; data: Partial<Project> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<Project>({
    endpoint: '/projects',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab === 'ACTIVE')    list = list.filter(p => p.status === 'ACTIVE');
    if (tab === 'COMPLETED') list = list.filter(p => p.status === 'COMPLETED');
    if (tab === 'ON_HOLD')   list = list.filter(p => p.status === 'ON_HOLD');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => [p.name, p.description, p.manager].some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => {
    const totalBudget = rows.reduce((s, p) => s + (p.budget ?? 0), 0);
    const totalSpent  = rows.reduce((s, p) => s + (p.spent ?? 0), 0);
    return [
      { label: 'Total',     value: rows.length,                                       color: 'green' as const },
      { label: 'Active',    value: rows.filter(p => p.status === 'ACTIVE').length,    color: 'sky' as const },
      { label: 'Completed', value: rows.filter(p => p.status === 'COMPLETED').length, color: 'violet' as const },
      { label: 'Budget',    value: fmtETB(totalBudget),                               color: 'amber' as const },
      { label: 'Spent',     value: fmtETB(totalSpent),                                color: 'rose' as const },
    ];
  }, [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.name?.trim()) { toast.error('Project name is required'); return; }
    const result = await save({ ...modal.data } as any);
    if (result) {
      setModal(m => ({ ...m, open: false }));
      // If editing the currently selected project, refresh it
      if (modal.data.id && selected?.id === modal.data.id) {
        setSelected(result as Project);
      }
    }
  }, [modal.data, save, selected]);

  return (
    <AppPage
      title="Projects"
      subtitle={`${rows.length} projects · Tasks · Milestones · Timesheets · Project Management Software · IT & Software · Manufacturing & Logistics`}
      icon={<ClipboardList size={18} />}
      crumbs={[{ label: 'System Administration' }, { label: 'Project Management' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',       label: 'All',       count: rows.length },
            { key: 'ACTIVE',    label: 'Active',    count: rows.filter(p => p.status === 'ACTIVE').length },
            { key: 'COMPLETED', label: 'Completed', count: rows.filter(p => p.status === 'COMPLETED').length },
            { key: 'ON_HOLD',   label: 'On Hold',   count: rows.filter(p => p.status === 'ON_HOLD').length },
          ]}
          active={tab}
          onChange={k => setTab(k as MainTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          {can('projects:write') && (
            <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setModal({ open: true, data: { status: 'ACTIVE' } })}>
              New Project
            </Btn>
          )}
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search projects…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} projects</span>
      </div>

      <div className={`flex gap-4 ${selected ? 'items-start' : ''}`}>
        {/* Table */}
        <div className={selected ? 'flex-1 min-w-0' : 'w-full'}>
          <AppTable>
            <thead><tr>
              <AppTh>Project</AppTh>
              <AppTh>Manager</AppTh>
              <AppTh align="right">Budget</AppTh>
              <AppTh>Progress</AppTh>
              <AppTh>Tasks</AppTh>
              <AppTh>Status</AppTh>
              <AppTh align="right" width="80px">Actions</AppTh>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<ClipboardList size={18} />} title="No projects" desc="Create your first project to track progress and time" action={can('projects:write') ? { label: 'New Project', onClick: () => setModal({ open: true, data: { status: 'ACTIVE' } }) } : undefined} /></td></tr>
              ) : filtered.map(p => {
                const pct = p.budget && p.spent ? Math.min(100, (p.spent / p.budget) * 100) : 0;
                const isSelected = selected?.id === p.id;
                return (
                  <AppTr key={p.id} className={isSelected ? 'bg-[var(--pro-azure-50)]/50' : ''}>
                    <AppTd>
                      <button onClick={() => setSelected(isSelected ? null : p)} className="text-left group/name">
                        <p className="text-[12px] font-semibold text-slate-800 group-hover/name:text-[var(--pro-azure)] flex items-center gap-1">
                          {p.name}
                          <ChevronRight size={10} className={`transition-transform ${isSelected ? 'rotate-90 text-[var(--pro-azure)]' : 'text-slate-300'}`} />
                        </p>
                        {p.description && <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{p.description}</p>}
                      </button>
                    </AppTd>
                    <AppTd>
                      {p.manager ? <span className="text-[11px] text-slate-600">{p.manager}</span> : <span className="text-[10px] text-slate-300">—</span>}
                    </AppTd>
                    <AppTd align="right">
                      {p.budget ? <Amount value={p.budget} size="sm" /> : <span className="text-[10px] text-slate-300">—</span>}
                    </AppTd>
                    <AppTd>
                      {pct > 0 ? (
                        <div className="w-20">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="ovds-caption">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-[var(--pro-azure-50)]0'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </AppTd>
                    <AppTd>
                      {p._count ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><CheckSquare size={9} className="text-sky-400" />{p._count.tasks}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Flag size={9} className="text-violet-400" />{p._count.milestones}</span>
                        </div>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </AppTd>
                    <AppTd><StatusBadge status={p.status} /></AppTd>
                    <AppTd align="right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {can('projects:write') && (
                          <>
                            <button onClick={() => setModal({ open: true, data: { ...p } })} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all"><Edit2 size={11} /></button>
                            <button onClick={async () => { if (await confirm({ title: `Delete "${p.name}"?`, variant: 'danger' })) { remove(p.id); if (selected?.id === p.id) setSelected(null); } }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"><Trash2 size={11} /></button>
                          </>
                        )}
                      </div>
                    </AppTd>
                  </AppTr>
                );
              })}
            </tbody>
          </AppTable>
          <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[480px] shrink-0 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <ProjectDetail
              project={selected}
              onClose={() => setSelected(null)}
              onEdit={() => setModal({ open: true, data: { ...selected } })}
              canWrite={can('projects:write')}
            />
          </div>
        )}
      </div>

      {/* Project create/edit modal */}
      <Modal open={modal.open} onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? `Edit: ${modal.data.name}` : 'New Project'}
        subtitle="Project tracking · Budget management · Project Management Software · IT & Software · Strategic Insights"
        footer={<><Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={saving} onClick={handleSave}>{modal.data.id ? 'Save Changes' : 'Create Project'}</Btn></>}>
        <ProjectForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} />
      </Modal>
    </AppPage>
  );
};

export default Projects;

