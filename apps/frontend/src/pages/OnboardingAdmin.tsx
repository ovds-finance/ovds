import { GridHero, ContextStrip, ContextPill, MetricCard } from '@ovds/ui';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  Flag,
  Globe,
  History,
  Kanban,
  Link,
  List,
  LayoutGrid,
  Mail,
  RefreshCw,
  Save,
  Search,
  Send,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  XCircle,
  Zap,
  CheckSquare,
  Square,
  FileJson,
  User,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';
import { confirm } from '../utils/confirm';

// -- Types ---------------------------------------------------------------------
interface Submission {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  businessName?: string;
  website?: string;
  socialMedia?: string;
  valueProposition: string;
  mainGoals: string;
  successDefinition?: string;
  topChallenges: string;
  currentBlockers?: string;
  budget?: string;
  desiredTimeline?: string;
  preferredContact?: string;
  updateFrequency?: string;
  timezone?: string;
  idealCustomerProfile?: string;
  mainCompetitors?: string;
  usp?: string;
  kpis?: string;
  hasLogo?: string;
  brandLove?: string;
  internalNotes?: string;
  assignedTo?: string;
  status: string;
  createdAt: string;
  priority?: boolean;
}

interface TimelineEvent {
  type: 'status' | 'note' | 'email' | 'created';
  label: string;
  at: string;
  by?: string;
}

interface Stats {
  total: number;
  pending: number;
  inReview: number;
  completed: number;
  rejected: number;
}

type SortKey = 'contactName' | 'businessName' | 'status' | 'createdAt' | 'budget';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;
const LAST_VISIT_KEY = 'onboarding_admin_last_visit';
const AUTO_REFRESH_SECS = 60;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; ring: string }> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',     dot: 'bg-amber-400',   ring: 'ring-amber-400/30' },
  IN_REVIEW: { label: 'In Review', color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',       bg: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20',       dot: 'bg-teal-400',    ring: 'ring-[var(--pro-azure)]/20' },
  COMPLETED: { label: 'Completed', color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20', dot: 'bg-[var(--pro-azure-light)]', ring: 'ring-[var(--pro-azure)]/30' },
  REJECTED:  { label: 'Rejected',  color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/20',       dot: 'bg-rose-400',    ring: 'ring-rose-400/30' },
};

const STATUSES = ['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED'];

// -- Utilities -----------------------------------------------------------------
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function copyToClipboard(text: string, label = 'Copied') {
  navigator.clipboard.writeText(text).then(() => toast.success(label));
}

function completionScore(s: Submission): number {
  const fields: (keyof Submission)[] = [
    'contactName', 'contactEmail', 'contactPhone', 'businessName', 'website',
    'valueProposition', 'mainGoals', 'successDefinition',
    'idealCustomerProfile', 'mainCompetitors',
    'topChallenges', 'currentBlockers',
    'budget', 'desiredTimeline', 'usp', 'kpis',
    'preferredContact', 'updateFrequency', 'timezone',
  ];
  const filled = fields.filter(f => s[f]?.toString().trim()).length;
  return Math.round((filled / fields.length) * 100);
}

// -- Sub-components ------------------------------------------------------------
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800/60 text-inherit rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

const CompletionBar: React.FC<{ score: number; compact?: boolean }> = ({ score, compact }) => {
  const color = score >= 80 ? 'bg-[var(--pro-azure-50)]0' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  if (compact) return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[9px] font-bold text-slate-400 tabular-nums">{score}%</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 tabular-nums w-8 text-right">{score}%</span>
    </div>
  );
};

const AgeBar: React.FC<{ days: number }> = ({ days }) => {
  const pct = Math.min(100, (days / 14) * 100);
  const color = days >= 7 ? 'bg-rose-400' : days >= 3 ? 'bg-amber-400' : 'bg-[var(--pro-azure-light)]';
  return (
    <div className="flex items-center gap-1" title={`${days}d old`}>
      <div className="w-10 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="ovds-caption">{days}d</span>
    </div>
  );
};



const StatusChart: React.FC<{ stats: Stats }> = ({ stats }) => {
  const bars = [
    { key: 'PENDING',   value: stats.pending,   label: 'Pending' },
    { key: 'IN_REVIEW', value: stats.inReview,  label: 'In Review' },
    { key: 'COMPLETED', value: stats.completed, label: 'Completed' },
    { key: 'REJECTED',  value: stats.rejected,  label: 'Rejected' },
  ];
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="ovds-widget-card p-4 space-y-3">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status breakdown</p>
      <div className="space-y-2.5">
        {bars.map(b => {
          const cfg = STATUS_CONFIG[b.key];
          return (
            <div key={b.key} className="flex items-center gap-3">
              <span className="ovds-caption w-16 shrink-0">{b.label}</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${cfg.dot}`} style={{ width: `${(b.value / max) * 100}%` }} />
              </div>
              <span className="ovds-caption font-bold text-slate-700 dark:text-slate-300 w-4 text-right">{b.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FunnelChart: React.FC<{ stats: Stats }> = ({ stats }) => {
  const steps = [
    { label: 'Submitted',  value: stats.total,     color: 'bg-slate-400' },
    { label: 'In Review',  value: stats.inReview,  color: 'bg-sky-500' },
    { label: 'Completed',  value: stats.completed, color: 'bg-[var(--pro-azure-50)]0' },
  ];
  const max = Math.max(stats.total, 1);
  return (
    <div className="ovds-widget-card p-4 space-y-3">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Conversion funnel</p>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const pct = (s.value / max) * 100;
          const prev = i > 0 ? steps[i - 1].value : s.value;
          const drop = prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : 0;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="ovds-caption">{s.label}</span>
                <div className="flex items-center gap-2">
                  {i > 0 && drop > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-semibold">
                      <TrendingDown size={9} /> {drop}% drop
                    </span>
                  )}
                  <span className="ovds-caption font-bold text-slate-700 dark:text-slate-300">{s.value}</span>
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${s.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {stats.total > 0 && (
        <p className="ovds-caption text-right">
          {Math.round((stats.completed / stats.total) * 100)}% overall conversion
        </p>
      )}
    </div>
  );
};

const AutoRefreshRing: React.FC<{ seconds: number; total: number; onRefresh: () => void }> = ({ seconds, total, onRefresh }) => {
  const pct = seconds / total;
  const r = 10;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <button onClick={onRefresh} title={`Auto-refresh in ${seconds}s — click to refresh now`} className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90 absolute">
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-100 dark:text-slate-800" />
        <circle cx="12" cy="12" r={r} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${dash} ${circ}`} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-all duration-1000" />
      </svg>
      <RefreshCw size={12} className="text-slate-500 dark:text-slate-400 relative z-10" />
    </button>
  );
};

// -- Kanban board --------------------------------------------------------------
const KanbanBoard: React.FC<{
  submissions: Submission[];
  onSelect: (s: Submission) => void;
  onStatusChange: (id: string, status: string) => void;
}> = ({ submissions, onSelect, onStatusChange }) => {
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDrop = async (status: string) => {
    if (!dragging || dragging === status) return;
    const s = submissions.find(x => x.id === dragging);
    if (!s || s.status === status) { setDragging(null); return; }
    try {
      await api.patch(`/onboarding/${dragging}/status`, { status });
      onStatusChange(dragging, status);
      toast.success(`Moved to ${STATUS_CONFIG[status]?.label}`);
    } catch { toast.error('Failed to move card'); }
    setDragging(null);
  };

  return (
    <div className="ovds-grid-layout cols-4">
      {STATUSES.map(status => {
        const cfg = STATUS_CONFIG[status];
        const cards = submissions.filter(s => s.status === status);
        return (
          <div key={status} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(status)}
            className={`rounded-2xl border-2 border-dashed transition-colors min-h-[200px] ${
              dragging ? 'border-[var(--pro-azure-light)] dark:border-[var(--pro-azure-light)] bg-[var(--pro-azure-50)]/30 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-700'
            }`}>
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${cfg.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-[var(--pro-azure-50)] dark:bg-white/50 dark:bg-black/20 ${cfg.color}`}>{cards.length}</span>
            </div>
            <div className="p-2 space-y-2">
              {cards.length === 0 && (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400 dark:text-slate-600">Drop here</div>
              )}
              {cards.map(s => {
                const days = daysSince(s.createdAt);
                const stale = s.status === 'PENDING' && days >= 3;
                const score = completionScore(s);
                return (
                  <div key={s.id} draggable
                    onDragStart={() => setDragging(s.id)} onDragEnd={() => setDragging(null)}
                    onClick={() => onSelect(s)}
                    className={`bg-white dark:bg-slate-900 rounded-xl border p-3 cursor-pointer hover:shadow-md transition-all select-none ${
                      s.priority ? 'border-rose-300 dark:border-rose-700/50' :
                      stale ? 'border-amber-200 dark:border-amber-800/40' : 'border-slate-200 dark:border-slate-700'
                    } ${dragging === s.id ? 'opacity-50 scale-95' : ''}`}>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <p className="font-semibold text-slate-900 dark:text-white text-xs leading-tight flex-1">{s.contactName}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {s.priority && <Flag size={10} className="text-rose-500 fill-rose-500" />}
                        {stale && <AlertCircle size={10} className="text-amber-500" />}
                      </div>
                    </div>
                    {s.businessName && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                        <Globe size={9} /> {s.businessName}
                      </p>
                    )}
                    {s.budget && (
                      <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md mb-1.5">
                        {s.budget}
                      </span>
                    )}
                    <CompletionBar score={score} compact />
                    <div className="flex items-center justify-between mt-1.5">
                      <AgeBar days={days} />
                      {s.assignedTo && (
                        <span className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] truncate max-w-[60px]">→ {s.assignedTo}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// -- Detail Drawer -------------------------------------------------------------
const DetailDrawer: React.FC<{
  submission: Submission | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onNotesChange: (id: string, notes: string, assignedTo: string) => void;
  onDelete: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  position?: { current: number; total: number };
}> = ({ submission: s, onClose, onStatusChange, onNotesChange, onDelete, onPrev, onNext, position }) => {
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'email' | 'timeline'>('details');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (s) {
      setNotes(s.internalNotes ?? '');
      setAssignedTo(s.assignedTo ?? '');
      setNotesDirty(false);
      setConfirmDelete(false);
      const events: TimelineEvent[] = [{ type: 'created', label: 'Submission received', at: s.createdAt }];
      if (s.status !== 'PENDING') {
        events.push({ type: 'status', label: `Moved to ${STATUS_CONFIG[s.status]?.label ?? s.status}`, at: s.createdAt });
      }
      if (s.internalNotes) {
        events.push({ type: 'note', label: 'Internal note added', at: s.createdAt, by: s.assignedTo });
      }
      setTimeline(events.reverse());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.id]);

  const saveNotes = useCallback(async (currentNotes: string, currentAssignedTo: string) => {
    if (!s) return;
    setSavingNotes(true);
    try {
      await api.patch(`/onboarding/${s.id}/notes`, { notes: currentNotes, assignedTo: currentAssignedTo });
      onNotesChange(s.id, currentNotes, currentAssignedTo);
      setNotesDirty(false);
      toast.success('Notes saved');
    } catch { toast.error('Failed to save notes'); } finally { setSavingNotes(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.id, onNotesChange]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (notesDirty) saveNotes(notes, assignedTo);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, notesDirty, notes, assignedTo, saveNotes]);

  if (!s) return null;

  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING;
  const days = daysSince(s.createdAt);
  const isStale = s.status === 'PENDING' && days >= 3;

  const changeStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/onboarding/${s.id}/status`, { status });
      onStatusChange(s.id, status);
      toast.success(`Moved to ${STATUS_CONFIG[status]?.label ?? status}`);
    } catch { toast.error('Failed to update status'); } finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/onboarding/${s.id}`);
      onDelete(s.id);
      onClose();
      toast.success('Submission deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
        {icon} {title}
      </div>
      {children}
    </div>
  );

  const Row: React.FC<{ label: string; value?: string; mono?: boolean; copyable?: boolean }> = ({ label, value, mono, copyable }) =>
    value ? (
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{label}</p>
        <div className="flex items-start gap-1.5 mt-0.5 group/row">
          <p className={`flex-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
          {copyable && (
            <button onClick={() => copyToClipboard(value, `${label} copied`)} className="opacity-0 group-hover/row:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-all shrink-0 mt-0.5">
              <Copy size={11} />
            </button>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200">
        {isStale && (
          <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40">
            <AlertCircle size={13} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Pending for {days} day{days !== 1 ? 's' : ''} — needs attention
            </p>
          </div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-slate-900 dark:text-white text-lg truncate">{s.contactName}</h2>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ring-1 ${cfg.ring} ${cfg.bg} ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {(() => {
                const score = completionScore(s);
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    score >= 80 ? 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                    : score >= 50 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`} title="Form completion score">
                    <Award size={10} /> {score}%
                  </span>
                );
              })()}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {s.businessName && <span className="font-medium">{s.businessName} · </span>}
              <span title={new Date(s.createdAt).toLocaleString()}>{relativeTime(s.createdAt)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={async () => {
                const newPriority = !s.priority;
                try {
                  await api.patch(`/onboarding/${s.id}/priority`, { priority: newPriority });
                  onNotesChange(s.id, s.internalNotes ?? '', s.assignedTo ?? '');
                  toast.success(newPriority ? 'Marked as priority' : 'Priority removed');
                } catch { toast.error('Failed to update priority'); }
              }}
              className={`p-1.5 rounded-lg transition-colors ${s.priority ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'}`}
              title={s.priority ? 'Remove priority flag' : 'Mark as high priority'}
            >
              <Flag size={14} className={s.priority ? 'fill-rose-500' : ''} />
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                <Trash2 size={15} />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-rose-500 font-semibold">Delete?</span>
                <button onClick={handleDelete} className="px-2 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-colors">No</button>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors" title="Close (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Prev / Next navigation */}
        {position && (
          <div className="flex items-center justify-between px-5 py-1.5 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <button onClick={onPrev} disabled={position.current <= 1} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-colors">
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-[10px] font-bold text-slate-400">{position.current} / {position.total}</span>
            <button onClick={onNext} disabled={position.current >= position.total} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-colors">
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
        {/* Status actions */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">Move to:</span>
          {STATUSES.filter(st => st !== s.status).map(st => {
            const c = STATUS_CONFIG[st];
            return (
              <button key={st} onClick={() => changeStatus(st)} disabled={updating} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${c.bg} ${c.color} hover:opacity-80`}>
                {c.label}
              </button>
            );
          })}
        </div>
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          {(['details', 'notes', 'email', 'timeline'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={[
              'flex-1 py-2.5 text-xs font-bold capitalize transition-colors',
              activeTab === tab
                ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border-b-2 border-[var(--pro-azure)] dark:border-[var(--pro-azure)]'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            ].join(' ')}>
              {tab === 'notes' && notesDirty ? `${tab} ●` : tab}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'details' && (
            <div className="space-y-5">
              <Section icon={<User size={11} />} title="Contact">
                <div className="grid grid-cols-2 gap-3">
                  <Row label="Name" value={s.contactName} copyable />
                  <Row label="Email" value={s.contactEmail} mono copyable />
                  <Row label="Phone" value={s.contactPhone} copyable />
                  <Row label="Website" value={s.website} copyable />
                  <Row label="Preferred Contact" value={s.preferredContact} />
                  <Row label="Timezone" value={s.timezone} />
                </div>
              </Section>
              <Section icon={<Target size={11} />} title="Business & Goals">
                <Row label="Value Proposition" value={s.valueProposition} />
                <Row label="Main Goals" value={s.mainGoals} />
                <Row label="Success Definition" value={s.successDefinition} />
                <Row label="USP" value={s.usp} />
                <Row label="KPIs" value={s.kpis} />
              </Section>
              <Section icon={<TrendingUp size={11} />} title="Target Audience">
                <Row label="Ideal Customer Profile" value={s.idealCustomerProfile} />
                <Row label="Main Competitors" value={s.mainCompetitors} />
              </Section>
              <Section icon={<AlertTriangle size={11} />} title="Challenges">
                <Row label="Top Challenges" value={s.topChallenges} />
                <Row label="Current Blockers" value={s.currentBlockers} />
              </Section>
              <Section icon={<Briefcase size={11} />} title="Project Specifics">
                <div className="grid grid-cols-2 gap-3">
                  <Row label="Budget" value={s.budget} />
                  <Row label="Timeline" value={s.desiredTimeline} />
                  <Row label="Has Logo" value={s.hasLogo} />
                  <Row label="Update Frequency" value={s.updateFrequency} />
                </div>
                <Row label="Brand Love" value={s.brandLove} />
              </Section>
            </div>
          )}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Assigned To</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                  placeholder="Team member name or email..."
                  value={assignedTo}
                  onChange={e => { setAssignedTo(e.target.value); setNotesDirty(true); }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <StickyNote size={11} /> Internal Notes
                </label>
                <textarea rows={10}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all resize-none"
                  placeholder="Add internal notes, action items, follow-up reminders..."
                  value={notes}
                  onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                />
                <div className="flex items-center justify-between">
                  <p className="ovds-caption">Not visible to the client · Ctrl+S to save</p>
                  <span className={`text-[10px] font-mono ${notes.length > 1800 ? 'text-rose-400' : 'text-slate-400'}`}>{notes.length}/2000</span>
                </div>
              </div>
              <button onClick={() => saveNotes(notes, assignedTo)} disabled={savingNotes || !notesDirty} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-sm font-bold disabled:opacity-50 transition-all">
                {savingNotes
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  : <><Save size={14} /> Save Notes</>}
              </button>
            </div>
          )}
          {activeTab === 'email' && <EmailComposer submission={s} />}
          {activeTab === 'timeline' && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Activity Timeline</p>
              {timeline.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
                  <History size={24} className="opacity-30" />
                  <p className="text-xs">No activity recorded yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-4">
                    {timeline.map((ev, i) => {
                      const iconMap = {
                        created: <Sparkles size={12} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />,
                        status: <Zap size={12} className="text-amber-500" />,
                        note: <StickyNote size={12} className="text-violet-500" />,
                        email: <Mail size={12} className="text-[var(--pro-azure)]" />,
                      };
                      return (
                        <div key={i} className="flex items-start gap-3 pl-1">
                          <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 z-10">
                            {iconMap[ev.type]}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{ev.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="ovds-caption">{relativeTime(ev.at)}</span>
                              {ev.by && <span className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">by {ev.by}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <a href={`mailto:${s.contactEmail}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-sm font-bold transition-all">
            <Mail size={14} /> Email Client
          </a>
          <button onClick={() => copyToClipboard(s.contactEmail, 'Email copied')} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Copy email">
            <Copy size={14} />
          </button>
          {s.website && (
            <a href={s.website.startsWith('http') ? s.website : `https://${s.website}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-sm font-semibold">
              <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// -- Email Composer ------------------------------------------------------------
const EMAIL_TEMPLATES = [
  { label: 'Follow-up', subject: 'Following up on your onboarding', body: `Hi {{name}},\n\nI wanted to follow up on your onboarding submission for {{business}}.\n\nWe've reviewed your goals and challenges and would love to schedule a quick call to discuss next steps.\n\nWhen would be a good time for you?\n\nBest regards,\nThe Team` },
  { label: 'Kickoff invite', subject: "Let's schedule your kickoff call", body: `Hi {{name}},\n\nGreat news — we're ready to kick things off for {{business}}!\n\nPlease reply with your availability for a 30-minute call this week.\n\nLooking forward to it,\nThe Team` },
  { label: 'More info needed', subject: 'A few more details needed', body: `Hi {{name}},\n\nThank you for submitting your onboarding questionnaire.\n\nTo move forward, we need a bit more information about your goals and timeline. Could you clarify:\n\n1. \n2. \n\nThanks,\nThe Team` },
  { label: 'Completed', subject: 'Your onboarding is complete!', body: `Hi {{name}},\n\nWe're thrilled to let you know that your onboarding for {{business}} is now complete.\n\nHere's what we've set up for you:\n• \n• \n\nWelcome aboard!\nThe Team` },
];

const EmailComposer: React.FC<{ submission: Submission }> = ({ submission: s }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const applyTemplate = (tpl: typeof EMAIL_TEMPLATES[0]) => {
    const replace = (str: string) => str
      .replace(/\{\{name\}\}/g, s.contactName)
      .replace(/\{\{business\}\}/g, s.businessName ?? s.contactName);
    setSubject(replace(tpl.subject));
    setBody(replace(tpl.body));
    setSent(false);
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Subject and body are required'); return; }
    setSending(true);
    try {
      await api.post(`/onboarding/${s.id}/email`, { to: s.contactEmail, subject, body });
      setSent(true);
      toast.success('Email sent');
    } catch { toast.error('Failed to send email'); } finally { setSending(false); }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <CheckCircle2 size={36} className="text-[var(--pro-azure)]" />
        <p className="font-bold text-slate-700 dark:text-slate-300">Email sent to {s.contactEmail}</p>
        <button onClick={() => setSent(false)} className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">Send another</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Quick templates</p>
        <div className="flex flex-wrap gap-1.5">
          {EMAIL_TEMPLATES.map(tpl => (
            <button key={tpl.label} onClick={() => applyTemplate(tpl)} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] dark:hover:text-[var(--pro-azure-light)] transition-all">
              {tpl.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">To</label>
        <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 font-mono">
          {s.contactEmail}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subject</label>
        <input
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
          placeholder="Email subject..."
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Message</label>
        <textarea rows={9}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all resize-none"
          placeholder="Write your message..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      </div>
      <button onClick={send} disabled={sending || !subject.trim() || !body.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white text-sm font-bold disabled:opacity-50 transition-all">
        {sending
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
          : <><Send size={14} /> Send Email</>}
      </button>
    </div>
  );
};

// -- Bulk Action Bar -----------------------------------------------------------
const BulkBar: React.FC<{
  count: number;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onClear: () => void;
  loading: boolean;
}> = ({ count, onStatusChange, onDelete, onClear, loading }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-[var(--pro-azure-50)]0 rounded-xl text-white shadow-lg shadow-green-500/20 dark:shadow-green-500/10 flex-wrap">
    <span className="text-sm font-bold">{count} selected</span>
    <div className="flex items-center gap-2 flex-wrap flex-1">
      {STATUSES.map(st => {
        const c = STATUS_CONFIG[st];
        return (
          <button key={st} onClick={() => onStatusChange(st)} disabled={loading} className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-50 bg-[var(--pro-azure-100)] dark:bg-white/10 hover:bg-white/20 text-white">
            → {c.label}
          </button>
        );
      })}
    </div>
    <button onClick={onDelete} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50">
      <Trash2 size={12} /> Delete
    </button>
    <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-[var(--pro-azure-100)] dark:bg-white/10 transition-colors" title="Clear selection">
      <X size={15} />
    </button>
  </div>
);

// -- Main Page -----------------------------------------------------------------
export default function OnboardingAdmin() {
  usePageTitle('Onboarding Admin');
  const { t } = useTranslation();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inReview: 0, completed: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & sort
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // View
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [selected, setSelected] = useState<Submission | null>(null);

  // Bulk
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Auto-refresh
  const [refreshCountdown, setRefreshCountdown] = useState(AUTO_REFRESH_SECS);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [subRes, statRes] = await Promise.all([
        api.get('/onboarding'),
        api.get('/onboarding/stats'),
      ]);
      const raw: Submission[] = subRes.data?.data ?? subRes.data ?? [];
      // Derive priority from the [PRIORITY] prefix stored in internalNotes
      const subs: Submission[] = raw.map((s) => ({
        ...s,
        priority: s.internalNotes?.startsWith('[PRIORITY]') ?? false,
      }));
      setSubmissions(subs);
      const s = statRes.data?.data ?? statRes.data ?? {};
      setStats({
        total: s.total ?? subs.length,
        pending: s.pending ?? subs.filter((x: Submission) => x.status === 'PENDING').length,
        inReview: s.inReview ?? subs.filter((x: Submission) => x.status === 'IN_REVIEW').length,
        completed: s.completed ?? subs.filter((x: Submission) => x.status === 'COMPLETED').length,
        rejected: s.rejected ?? subs.filter((x: Submission) => x.status === 'REJECTED').length,
      });
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh countdown
  useEffect(() => {
    setRefreshCountdown(AUTO_REFRESH_SECS);
    refreshRef.current = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchAll();
          return AUTO_REFRESH_SECS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [fetchAll]);

  // Filtered + sorted list
  const filtered = submissions
    .filter(s => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.contactName.toLowerCase().includes(q) ||
        (s.contactEmail?.toLowerCase().includes(q)) ||
        (s.businessName?.toLowerCase().includes(q)) ||
        (s.valueProposition?.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const av = (a as any)[sortKey] ?? '';
      const bv = (b as any)[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleStatusChange = (id: string, status: string) => {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
    setStats(prev => {
      const old = submissions.find(s => s.id === id);
      if (!old) return prev;
      const _dec = (k: keyof Stats) => ({ ...prev, [k]: Math.max(0, (prev[k] as number) - 1) });
      const oldKey = old.status === 'IN_REVIEW' ? 'inReview' : old.status.toLowerCase() as keyof Stats;
      const newKey = status === 'IN_REVIEW' ? 'inReview' : status.toLowerCase() as keyof Stats;
      return { ...prev, [oldKey]: Math.max(0, (prev[oldKey] as number) - 1), [newKey]: (prev[newKey] as number) + 1 };
    });
  };

  const handleNotesChange = (id: string, notes: string, assignedTo: string) => {
    const priority = notes.startsWith('[PRIORITY]');
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, internalNotes: notes, assignedTo, priority } : s));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, internalNotes: notes, assignedTo, priority } : prev);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete submission?', message: 'This cannot be undone.', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.delete(`/onboarding/${id}`);
      setSubmissions(prev => prev.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Submission deleted');
    } catch {
      toast.error('Failed to delete submission');
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (!bulkIds.size) return;
    setBulkLoading(true);
    try {
      await api.post('/onboarding/bulk/status', { ids: Array.from(bulkIds), status });
      bulkIds.forEach(id => handleStatusChange(id, status));
      setBulkIds(new Set());
      toast.success(`Updated ${bulkIds.size} submissions`);
    } catch {
      toast.error('Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkIds.size) return;
    const ok = await confirm({ title: `Delete ${bulkIds.size} submissions?`, message: 'This cannot be undone.', variant: 'danger', confirmLabel: 'Delete All' });
    if (!ok) return;
    setBulkLoading(true);
    try {
      await api.post('/onboarding/bulk/delete', { ids: Array.from(bulkIds) });
      setSubmissions(prev => prev.filter(s => !bulkIds.has(s.id)));
      setBulkIds(new Set());
      toast.success('Submissions deleted');
    } catch {
      toast.error('Bulk delete failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/onboarding/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onboarding_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const toggleBulk = (id: string) => {
    setBulkIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllBulk = () => {
    if (bulkIds.size === paginated.length) {
      setBulkIds(new Set());
    } else {
      setBulkIds(new Set(paginated.map(s => s.id)));
    }
  };

  // Navigation between submissions in drawer
  const selectedIdx = selected ? filtered.findIndex(s => s.id === selected.id) : -1;
  const handlePrev = selectedIdx > 0 ? () => setSelected(filtered[selectedIdx - 1]) : undefined;
  const handleNext = selectedIdx < filtered.length - 1 ? () => setSelected(filtered[selectedIdx + 1]) : undefined;

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
      : <span className="w-3 h-3 inline-block" />
  );

  if (error) {
    return (
      <div className="p-5 flex flex-col items-center gap-4">
        <AlertCircle size={40} className="text-rose-400" />
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <button onClick={fetchAll} className="px-4 py-2 rounded-xl bg-[var(--pro-azure)] text-white text-sm font-bold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* ── OVDS Grid Hero ─────────────────────────────────────────────── */}
      <GridHero
        title="Onboarding Admin"
        subtitle="Manage and action client onboarding submissions · ERP · CRM · Cloud-Based · SaaS-Based · Banking & ovds · IT & Software · Market Segmentation"
        crumbs={[{ label: 'System Administration' }, { label: 'Onboarding' }]}
        actions={
          <div className="flex items-center gap-2">
            <AutoRefreshRing seconds={refreshCountdown} total={AUTO_REFRESH_SECS} onRefresh={fetchAll} />
            <button onClick={handleExportCsv}
              className="ovds-btn-secondary flex items-center gap-1.5">
              <Download size={13} /> Export CSV
            </button>
            <button onClick={() => setViewMode(v => v === 'list' ? 'kanban' : 'list')}
              className="ovds-btn-secondary flex items-center gap-1.5">
              {viewMode === 'list' ? <><Kanban size={13} /> Kanban</> : <><List size={13} /> List</>}
            </button>
          </div>
        }
      />

      {/* ── Context strip ──────────────────────────────────────────────── */}
      <ContextStrip>
        <ContextPill leading={<Briefcase size={11} />} label={`${stats.total} submissions`} />
        {stats.pending > 0 && <ContextPill variant="alert" label={`${stats.pending} pending`} />}
        {stats.inReview > 0 && <ContextPill variant="info" label={`${stats.inReview} in review`} />}
        {stats.completed > 0 && <ContextPill variant="success" label={`${stats.completed} completed`} />}
        {statusFilter && <ContextPill variant="info" label={`Filtered: ${STATUS_CONFIG[statusFilter]?.label}`} />}
        {search && <ContextPill variant="info" label={`Search: "${search}"`} />}
      </ContextStrip>

{/* ── KPI stat bar ───────────────────────────────────────────────── */}
      <div className="ovds-grid-layout cols-4 gap-sm">
        <MetricCard
          title="Total"
          amount={stats.total}
          percentage={0}
          isPositive={true}
          color="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          onClick={() => setStatusFilter('')}
          active={!statusFilter}
        />
        <MetricCard
          title="Pending"
          amount={stats.pending}
          percentage={0}
          isPositive={true}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING')}
          active={statusFilter === 'PENDING'}
        />
        <MetricCard
          title="In Review"
          amount={stats.inReview}
          percentage={0}
          isPositive={true}
          color="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
          onClick={() => setStatusFilter(statusFilter === 'IN_REVIEW' ? '' : 'IN_REVIEW')}
          active={statusFilter === 'IN_REVIEW'}
        />
        <MetricCard
          title="Completed"
          amount={stats.completed}
          percentage={0}
          isPositive={true}
          color="bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]"
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? '' : 'COMPLETED')}
          active={statusFilter === 'COMPLETED'}
        />
      </div>

      {/* ── Analytics row ─────────────────────────────────────────────── */}
      <div className="ovds-grid-layout cols-2">
        <StatusChart stats={stats} />
        <FunnelChart stats={stats} />
      </div>

      {/* ── Search & filters ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
            placeholder="Search by name, email, business…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {/* ── Bulk action bar ────────────────────────────────────────────── */}
      {bulkIds.size > 0 && (
        <BulkBar
          count={bulkIds.size}
          loading={bulkLoading}
          onStatusChange={handleBulkStatus}
          onDelete={handleBulkDelete}
          onClear={() => setBulkIds(new Set())}
        />
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ovds-empty py-20">
          <FileText size={36} strokeWidth={1.5} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No submissions found</p>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="mt-2 text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-bold hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          submissions={filtered}
          onSelect={setSelected}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <>
          {/* ── List table ─────────────────────────────────────────────── */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm ovds-table">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="px-4 py-3 text-left w-10">
                      <button onClick={toggleAllBulk} className="text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                        {bulkIds.size === paginated.length && paginated.length > 0
                          ? <CheckSquare size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                          : <Square size={15} />}
                      </button>
                    </th>
                    {([
                      ['contactName', 'Contact'],
                      ['businessName', 'Business'],
                      ['status', 'Status'],
                      ['budget', 'Budget'],
                      ['createdAt', 'Submitted'],
                    ] as [SortKey, string][]).map(([k, label]) => (
                      <th key={k}
                        className="px-4 py-3 text-left ovds-label cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        onClick={() => toggleSort(k)}>
                        <span className="flex items-center gap-1">{label} <SortIcon k={k} /></span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left ovds-label">Score</th>
                    <th className="px-4 py-3 text-left ovds-label">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {paginated.map(s => {
                    const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG['PENDING'];
                    const days = daysSince(s.createdAt);
                    const stale = s.status === 'PENDING' && days >= 3;
                    const score = completionScore(s);
                    return (
                      <tr key={s.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${bulkIds.has(s.id) ? 'bg-[var(--pro-azure-50)]/40 dark:bg-green-900/10' : ''}`}>
                        <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleBulk(s.id); }}>
                          {bulkIds.has(s.id)
                            ? <CheckSquare size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                            : <Square size={14} className="text-slate-300 hover:text-slate-500" />}
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(s)}>
                          <div className="flex items-center gap-2">
                            {s.priority && <Flag size={11} className="text-rose-500 fill-rose-500 shrink-0" />}
                            {stale && <AlertCircle size={11} className="text-amber-500 shrink-0" />}
                            <div>
                              <p className="ovds-body font-semibold text-slate-900 dark:text-white">
                                <HighlightText text={s.contactName} query={search} />
                              </p>
                              <p className="ovds-caption">
                                <HighlightText text={s.contactEmail} query={search} />
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(s)}>
                          <p className="ovds-body text-slate-700 dark:text-slate-300">
                            <HighlightText text={s.businessName ?? '—'} query={search} />
                          </p>
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(s)}>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 ovds-caption text-slate-500" onClick={() => setSelected(s)}>
                          {s.budget ?? '—'}
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(s)}>
                          <p className="ovds-body text-slate-500">{relativeTime(s.createdAt)}</p>
                          <p className="ovds-caption">{days}d ago</p>
                        </td>
                        <td className="px-4 py-3.5" onClick={() => setSelected(s)}>
                          <CompletionBar score={score} compact />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelected(s)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors"
                              title="View details">
                              <Eye size={13} />
                            </button>
                            <button onClick={() => handleDelete(s.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="ovds-caption text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...'
                      ? <span key={`e-${i}`} className="px-2 ovds-caption text-slate-400">…</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-[var(--pro-azure)] text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          {p}
                        </button>
                  )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Detail Drawer ─────────────────────────────────────────────── */}
      <DetailDrawer
        submission={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
        onDelete={handleDelete}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}










