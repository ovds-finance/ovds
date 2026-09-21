import React, { useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRightLeft,
  Lock,
  Unlock,
  GitBranch,
  ShieldCheck,
  FileClock,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Loader2,
  Save,
  RotateCcw,
  UserCheck,
  Search,
} from 'lucide-react';
import type { AuditLogEntry } from '@ovds/shared';
import { cn } from '../../lib/utils';

export type AiConfidenceLevel = 'low' | 'medium' | 'high' | 'verified';
export type ValidationSeverity = 'info' | 'warning' | 'error';
export type InheritanceStatus = 'inherited' | 'overridden' | 'local' | 'risk';
export type SaveReadiness = 'fix-errors' | 'verify' | 'request-approval' | 'publish';

export interface AiConfidenceBadgeProps {
  confidence?: number | AiConfidenceLevel;
  label?: string;
  compact?: boolean;
  className?: string;
}

export interface AiPromptTriggerProps {
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface AiDiffViewerProps {
  before: string;
  after: string;
  mode?: 'inline' | 'split';
  className?: string;
}

export interface AiAcceptRejectActionsProps {
  onAccept: () => void;
  onReject: () => void;
  acceptLabel?: string;
  rejectLabel?: string;
  disabled?: boolean;
  className?: string;
}

export interface InheritanceBadgeProps {
  source: string;
  status?: InheritanceStatus;
  className?: string;
}

export interface InheritanceOverrideToggleProps {
  inherited?: boolean;
  locked?: boolean;
  status?: InheritanceStatus;
  onOverride?: () => void;
  onInherit?: () => void;
  label?: string;
  className?: string;
}

export interface ImpactAnalysisModalProps {
  open: boolean;
  affectedCount?: number;
  title?: string;
  summary?: React.ReactNode;
  children?: React.ReactNode;
  severity?: ValidationSeverity;
  proceedLabel?: string;
  cancelLabel?: string;
  onProceed: () => void;
  onCancel: () => void;
  className?: string;
}

export interface DependencyTreeNode {
  id: string;
  label: string;
  type?: 'page' | 'field' | 'rule' | 'api' | 'document';
  status?: 'inherited' | 'overridden' | 'local' | 'risk';
  children?: DependencyTreeNode[];
}

export interface DependencyTreeMapProps {
  nodes: DependencyTreeNode[];
  onSelect?: (node: DependencyTreeNode) => void;
  className?: string;
}

export interface ValidationIssue {
  id: string;
  severity?: ValidationSeverity;
  field?: string;
  message: string;
}

export interface ValidationSidebarProps {
  issues: ValidationIssue[];
  title?: string;
  onJump?: (issue: ValidationIssue) => void;
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

export interface DualAuthorizationApprover {
  id: string;
  name: string;
  email?: string;
  role?: string;
  approved?: boolean;
}

export interface DualAuthorizationGateProps {
  approvers: DualAuthorizationApprover[];
  requiredApprovals?: number;
  onApprove?: (approverId: string) => void;
  onCancel?: () => void;
  locked?: boolean;
  className?: string;
}

export interface AuditTrailEntry extends Omit<AuditLogEntry, 'createdAt'> {
  createdAt: string | Date;
}

export interface AuditTrailDrawerProps {
  open: boolean;
  entries: AuditTrailEntry[];
  onClose: () => void;
  className?: string;
}

export interface SmartSaveButtonProps {
  readiness: SaveReadiness;
  errorCount?: number;
  verificationState?: 'idle' | 'running' | 'done';
  disabled?: boolean;
  onFixErrors?: () => void;
  onVerify?: () => void;
  onRequestApproval?: () => void;
  onPublish?: () => void;
  className?: string;
}

export interface SmartSearchSuggestion {
  id: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
}

export interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: SmartSearchSuggestion[];
  recentSearches?: string[];
  placeholder?: string;
  loading?: boolean;
  onSelect?: (suggestion: SmartSearchSuggestion) => void;
  onClearRecent?: () => void;
  className?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  severity?: ValidationSeverity | 'success';
}

export interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss?: (id: string) => void;
  className?: string;
}

const confidenceConfig: Record<AiConfidenceLevel, { label: string; cls: string; icon: React.ReactNode }> = {
  low: {
    label: 'Low confidence',
    cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
    icon: <AlertTriangle size={12} />,
  },
  medium: {
    label: 'Medium confidence',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
    icon: <Sparkles size={12} />,
  },
  high: {
    label: 'High confidence',
    cls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
    icon: <CheckCircle2 size={12} />,
  },
  verified: {
    label: 'Verified',
    cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800',
    icon: <ShieldCheck size={12} />,
  },
};

export const AiConfidenceBadge: React.FC<AiConfidenceBadgeProps> = ({
  confidence = 50,
  label,
  compact = false,
  className,
}) => {
  const numeric = typeof confidence === 'number' ? confidence : Number(confidence);
  const level: AiConfidenceLevel =
    confidence === 'low' || confidence === 'medium' || confidence === 'high' || confidence === 'verified'
      ? confidence
      : numeric >= 90
        ? 'verified'
        : numeric >= 70
          ? 'high'
          : numeric >= 45
            ? 'medium'
            : 'low';
  const cfg = confidenceConfig[level];
  const percent = typeof confidence === 'number' ? confidence : undefined;

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap', compact ? 'px-1.5 py-0.5 text-[9px]' : '', cfg.cls, className)}>
      {cfg.icon}
      <span>{label ?? cfg.label}</span>
      {percent !== undefined && <span className="opacity-70">{percent}%</span>}
    </span>
  );
};

export const AiPromptTrigger: React.FC<AiPromptTriggerProps> = ({
  label = 'Ask AI',
  disabled,
  onClick,
  className,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1 rounded-full border border-aki-ai-border bg-aki-ai-bg px-2 py-1 text-[10px] font-bold text-aki-ai-text transition-colors hover:bg-aki-ai-muted disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
  >
    <Sparkles size={10} />
    {label}
  </button>
);

const splitLines = (value: string) => value.split(/\r?\n/);

export const AiDiffViewer: React.FC<AiDiffViewerProps> = ({
  before,
  after,
  mode = 'inline',
  className,
}) => {
  const beforeLines = useMemo(() => splitLines(before), [before]);
  const afterLines = useMemo(() => splitLines(after), [after]);
  const lineCount = Math.max(beforeLines.length, afterLines.length);

  const renderInline = () => (
    <div className="space-y-0.5">
      {Array.from({ length: lineCount }).map((_, index) => {
        const beforeLine = beforeLines[index] ?? '';
        const afterLine = afterLines[index] ?? '';
        const changed = beforeLine !== afterLine;
        return (
          <div key={index} className={cn('grid grid-cols-[32px_1fr_1fr] text-[11px] font-mono', changed ? 'bg-aki-ai-muted/70' : 'bg-white dark:bg-slate-950')}>
            <span className="px-2 py-1.5 text-slate-400">{index + 1}</span>
            <span className="px-2 py-1.5 text-slate-500 line-through">{beforeLine || ' '}</span>
            <span className="px-2 py-1.5 text-slate-800 dark:text-slate-200">{afterLine || ' '}</span>
          </div>
        );
      })}
    </div>
  );

  const renderSplit = () => (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="border-r border-slate-200 dark:border-slate-700">
        <div className="bg-white dark:bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Before</div>
        {beforeLines.map((line, index) => (
          <div key={index} className="px-3 py-1.5 text-[11px] font-mono text-slate-500 line-through">{line || ' '}</div>
        ))}
      </div>
      <div>
        <div className="bg-aki-ai-muted px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-aki-ai-text">After</div>
        {afterLines.map((line, index) => (
          <div key={index} className="px-3 py-1.5 text-[11px] font-mono text-slate-800 dark:text-slate-200">{line || ' '}</div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn('overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950', className)}>
      {mode === 'split' ? renderSplit() : renderInline()}
    </div>
  );
};

export const AiAcceptRejectActions: React.FC<AiAcceptRejectActionsProps> = ({
  onAccept,
  onReject,
  acceptLabel = 'Keep',
  rejectLabel = 'Discard',
  disabled,
  className,
}) => (
  <div className={cn('inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1', className)}>
    <button
      type="button"
      disabled={disabled}
      onClick={onReject}
      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <XCircle size={12} />
      {rejectLabel}
    </button>
    <button
      type="button"
      disabled={disabled}
      onClick={onAccept}
      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-[var(--pro-azure-dark)] hover:bg-[var(--pro-azure-50)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <CheckCircle2 size={12} />
      {acceptLabel}
    </button>
  </div>
);

const inheritanceConfig: Record<InheritanceStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  inherited: {
    label: 'Inherited',
    icon: <GitBranch size={11} />,
    cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  overridden: {
    label: 'Overridden',
    icon: <Unlock size={11} />,
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  },
  local: {
    label: 'Local',
    icon: <Lock size={11} />,
    cls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  },
  risk: {
    label: 'Risk',
    icon: <AlertTriangle size={11} />,
    cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
  },
};

export const InheritanceBadge: React.FC<InheritanceBadgeProps> = ({
  source,
  status = 'inherited',
  className,
}) => {
  const cfg = inheritanceConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold', cfg.cls, className)}>
      {cfg.icon}
      <span>{cfg.label}</span>
      <span className="opacity-60">from {source}</span>
    </span>
  );
};

export const InheritanceOverrideToggle: React.FC<InheritanceOverrideToggleProps> = ({
  inherited = true,
  locked = false,
  status = 'inherited',
  onOverride,
  onInherit,
  label,
  className,
}) => {
  const cfg = inheritanceConfig[status];
  const isOverridden = status === 'overridden' || !inherited;
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => (isOverridden ? onInherit?.() : onOverride?.())}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50', cfg.cls, className)}
    >
      {isOverridden ? <Unlock size={11} /> : <Lock size={11} />}
      {label ?? (isOverridden ? 'Decoupled' : 'Locked to parent')}
    </button>
  );
};

export const ImpactAnalysisModal: React.FC<ImpactAnalysisModalProps> = ({
  open,
  affectedCount = 0,
  title = 'Impact analysis',
  summary,
  children,
  severity = 'warning',
  proceedLabel = 'Proceed',
  cancelLabel = 'Cancel',
  onProceed,
  onCancel,
  className,
}) => {
  if (!open) return null;

  const severityConfig = {
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
  }[severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onCancel} />
      <div className={cn('relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-2xl', className)}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 p-5">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            {summary && <p className="mt-1 text-[12px] text-slate-500">{summary}</p>}
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          <div className={cn('mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-bold', severityConfig)}>
            <AlertTriangle size={13} />
            This change will affect {affectedCount} child {affectedCount === 1 ? 'item' : 'items'}.
          </div>
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 p-4">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900">
            {cancelLabel}
          </button>
          <button type="button" onClick={onProceed} className="rounded-lg bg-[var(--pro-azure)] px-3 py-2 text-[12px] font-bold text-white hover:bg-[var(--pro-azure-dark)]">
            {proceedLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const DependencyNode: React.FC<{ node: DependencyTreeNode; depth: number; onSelect?: (node: DependencyTreeNode) => void }> = ({
  node,
  depth,
  onSelect,
}) => {
  const [open, setOpen] = React.useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const status = node.status ?? 'local';
  const statusConfig = inheritanceConfig[status] ?? inheritanceConfig.local;

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => {
          if (hasChildren) setOpen((value) => !value);
          onSelect?.(node);
        }}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-slate-50 dark:hover:bg-slate-900"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span className="w-3" />}
        <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-bold', statusConfig.cls)}>{status}</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{node.label}</span>
        {node.type && <span className="text-[9px] uppercase tracking-wide text-slate-400">{node.type}</span>}
      </button>
      {hasChildren && open && (
        <div>
          {node.children!.map((child) => (
            <DependencyNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DependencyTreeMap: React.FC<DependencyTreeMapProps> = ({ nodes, onSelect, className }) => (
  <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2', className)}>
    {nodes.map((node) => (
      <DependencyNode key={node.id} node={node} depth={0} onSelect={onSelect} />
    ))}
  </div>
);

const validationConfig: Record<ValidationSeverity, { icon: React.ReactNode; cls: string }> = {
  info: { icon: <AlertTriangle size={12} />, cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800' },
  warning: { icon: <AlertTriangle size={12} />, cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800' },
  error: { icon: <XCircle size={12} />, cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800' },
};

export const ValidationSidebar: React.FC<ValidationSidebarProps> = ({
  issues,
  title = 'Validation',
  onJump,
  open = true,
  onClose,
  className,
}) => {
  if (!open) return null;
  return (
    <aside className={cn('sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-[11px] text-slate-500">{issues.length} issue{issues.length === 1 ? '' : 's'} found</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {issues.map((issue) => {
          const cfg = validationConfig[issue.severity ?? 'warning'];
          return (
            <button
              key={issue.id}
              type="button"
              onClick={() => onJump?.(issue)}
              className={cn('w-full rounded-lg border px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900', cfg.cls)}
            >
              <div className="flex items-center gap-2">
                {cfg.icon}
                <span className="font-bold">{issue.severity ?? 'warning'}</span>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-snug">{issue.message}</p>
              {issue.field && <p className="mt-1 text-[10px] opacity-70">Field: {issue.field}</p>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export const DualAuthorizationGate: React.FC<DualAuthorizationGateProps> = ({
  approvers,
  requiredApprovals = 2,
  onApprove,
  onCancel,
  locked,
  className,
}) => {
  const approvedCount = approvers.filter((approver) => approver.approved).length;
  const ready = approvedCount >= requiredApprovals;

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Dual authorization required</h2>
          <p className="mt-1 text-[11px] text-slate-500">{approvedCount} of {requiredApprovals} approvals received</p>
        </div>
        <span className={cn('rounded-full border px-2 py-1 text-[10px] font-bold', ready ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' : 'bg-amber-50 text-amber-700 border-amber-200')}>
          {ready ? 'Ready' : 'Pending'}
        </span>
      </div>
      <div className="space-y-2">
        {approvers.map((approver) => (
          <div key={approver.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-3">
            <div>
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{approver.name}</p>
              <p className="text-[10px] text-slate-500">{approver.email ?? approver.role ?? 'Reviewer'}</p>
            </div>
            {approver.approved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--pro-azure-50)] px-2 py-1 text-[10px] font-bold text-[var(--pro-azure-dark)]">
                <Check size={11} /> Approved
              </span>
            ) : (
              <button
                type="button"
                disabled={locked}
                onClick={() => onApprove?.(approver.id)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserCheck size={11} /> Approve
              </button>
            )}
          </div>
        ))}
      </div>
      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-3 text-[11px] font-bold text-slate-500 hover:text-rose-600">
          Cancel approval request
        </button>
      )}
    </div>
  );
};

const formatAuditDate = (value: string | Date) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(value instanceof Date ? value : new Date(value));

export const AuditTrailDrawer: React.FC<AuditTrailDrawerProps> = ({
  open,
  entries,
  onClose,
  className,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-2xl" style={{ maxHeight: '45vh' }}>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileClock size={15} className="text-slate-500" />
          <h2 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Audit trail</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X size={14} />
        </button>
      </div>
      <div className={cn('overflow-auto p-4', className)}>
        <div className="relative border-l border-slate-200 dark:border-slate-700 pl-4">
          {entries.map((entry, index) => (
            <div key={entry.id ?? index} className="mb-4 relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--pro-azure)]" />
              <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{entry.userName ?? entry.userRole ?? entry.action}</p>
                  <span className="text-[10px] text-slate-400">{formatAuditDate(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{entry.description}</p>
                {entry.changedFields && entry.changedFields.length > 0 && (
                  <p className="mt-1 text-[10px] text-slate-400">Fields: {entry.changedFields.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SmartSaveButton: React.FC<SmartSaveButtonProps> = ({
  readiness,
  errorCount = 0,
  verificationState = 'idle',
  disabled,
  onFixErrors,
  onVerify,
  onRequestApproval,
  onPublish,
  className,
}) => {
  const running = verificationState === 'running';
  const config = {
    'fix-errors': {
      label: errorCount > 0 ? `Fix ${errorCount} Errors` : 'Fix Errors',
      icon: <AlertTriangle size={13} />,
      onClick: onFixErrors,
      cls: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    },
    verify: {
      label: running ? 'Verifying…' : 'Run AI Verification',
      icon: running ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />,
      onClick: onVerify,
      cls: 'bg-aki-ai-bg text-aki-ai-text border-aki-ai-border hover:bg-aki-ai-muted',
    },
    'request-approval': {
      label: 'Request Approval',
      icon: <UserCheck size={13} />,
      onClick: onRequestApproval,
      cls: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    },
    publish: {
      label: 'Publish',
      icon: <Save size={13} />,
      onClick: onPublish,
      cls: 'bg-[var(--pro-azure)] text-white border-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)]',
    },
  }[readiness];

  return (
    <button
      type="button"
      disabled={disabled || !config.onClick}
      onClick={() => config.onClick?.()}
      className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50', config.cls, className)}
    >
      {config.icon}
      {config.label}
    </button>
  );
};

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value,
  onChange,
  suggestions,
  recentSearches = [],
  placeholder = 'Search invoices, customers, reports…',
  loading,
  onSelect,
  onClearRecent,
  className,
}) => {
  const filtered = suggestions.filter((suggestion) => suggestion.label.toLowerCase().includes(value.trim().toLowerCase()));
  const showRecent = !value && recentSearches.length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure-100)] focus:border-[var(--pro-azure)]"
        />
        {loading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--pro-azure)]" />}
      </div>
      {(filtered.length > 0 || showRecent) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-dropdown">
          {showRecent && (
            <div className="border-b border-slate-100 dark:border-slate-800 p-2">
              <div className="mb-1 flex items-center justify-between px-2">
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Recent</span>
                {onClearRecent && (
                  <button type="button" onClick={onClearRecent} className="text-[9px] font-bold text-slate-400 hover:text-slate-700">Clear</button>
                )}
              </div>
              {recentSearches.map((recent) => (
                <button
                  key={recent}
                  type="button"
                  onClick={() => onChange(recent)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <span>{recent}</span>
                  <RotateCcw size={10} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}
          {filtered.length > 0 && (
            <div className="p-1">
              {filtered.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onSelect?.(suggestion)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-aki-ai-muted"
                >
                  <span className="text-[var(--pro-azure)]">{suggestion.icon ?? <Sparkles size={12} />}</span>
                  <span className="flex-1">
                    <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-100">{suggestion.label}</span>
                    {suggestion.hint && <span className="block text-[10px] text-slate-500">{suggestion.hint}</span>}
                  </span>
                  <ArrowRightLeft size={11} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss, className }) => (
  <div className={cn('fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2', className)}>
    {toasts.map((toast) => {
      const severity = toast.severity ?? 'info';
      const cfg = {
        info: 'bg-sky-50 text-sky-800 border-sky-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        error: 'bg-rose-50 text-rose-800 border-rose-200',
        success: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]',
      }[severity];
      return (
        <div key={toast.id} className={cn('rounded-xl border p-3 shadow-sm', cfg)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold">{toast.title}</p>
              {toast.message && <p className="mt-0.5 text-[11px] opacity-80">{toast.message}</p>}
            </div>
            {onDismiss && (
              <button type="button" onClick={() => onDismiss(toast.id)} className="rounded p-0.5 hover:bg-black/5">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
