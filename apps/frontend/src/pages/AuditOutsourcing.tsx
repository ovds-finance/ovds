import { AppPage, Skeleton } from '@ovds/ui';
import {
  AlertTriangle, ArrowRight, Award, BarChart3, BookOpen, Building2,
  Calendar, CalendarClock, CheckCircle2, CheckSquare, ChevronDown,
  ChevronRight, ChevronUp, ClipboardList, Clock, Copy, DollarSign,
  Download, Edit2, ExternalLink, FileCheck, FileText, Mail,
  MessageSquare, Paperclip, Phone, Plus, Printer, RefreshCw,
  Send, ShieldAlert, Square, Star, Trash2, TrendingUp, Upload,
  UserCheck, Users, X, Zap,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useRef, } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import EntitlementGate from '../components/entitlementGate';
import { useBusiness } from '../context/businessContext';
import { useDebounce, useKeyboardShortcut, useLocalStorage, useLastRefreshed, useEscapeKey } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { downloadCSV } from '../utils/download';


// -- Types ---------------------------------------------------------------------
type FirmStatus = 'ACTIVE' | 'INACTIVE';
type EngagementStatus = | 'CONSULTATION' | 'PLANNING' | 'FIELDWORK' | 'REPORTING' | 'FOLLOWUP' | 'COMPLETED';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type ViewMode = 'list' | 'board';
type TabType = 'engagements' | 'firms' | 'analytics' | 'readiness';
type AuditType = 'FINANCIAL_STATEMENT' | 'COMPLIANCE' | 'RISK_ASSESSMENT' | 'INTERNAL_CONTROL' | 'TAX_COMPLIANCE' | 'INTERNAL' | 'OTHER';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
interface AuditFirm { id: string; name: string; contactPerson?: string; email?: string; phone?: string; industry?: string; notes?: string; status: FirmStatus; rating?: number; createdAt: string; _count?: { engagements: number };}
interface Attachment { id: string; filename: string; mimeType: string; fileSize: number; description?: string; createdAt: string; uploadedBy?: string;}
interface AuditEngagement { id: string; firmId?: string | null; title: string; scope?: string; status: EngagementStatus; auditType?: AuditType; riskLevel?: RiskLevel; startDate?: string; endDate?: string; notes?: string; reportSummary?: string; budget?: number; actualCost?: number; referenceDocUrl?: string; createdAt: string; firm?: { id: string; name: string } | null; _count?: { findings: number; comments: number }; attachments?: Attachment[];}
interface AuditComment { id: string; engagementId: string; content: string; authorName?: string; createdAt: string;}
interface AuditFinding { id: string; engagementId: string; title: string; description?: string; severity: Severity; recommendation?: string; resolution?: string; status: string; dueDate?: string; assignedTo?: string; referenceDocUrl?: string; createdAt: string; attachments?: Attachment[];}
interface Analytics { byStatus: Record<string, number>; byType: Record<string, number>; findingsBySeverity: Record<string, number>; findingsByStatus: Record<string, number>; totalBudget: number; totalActual: number; monthlyTrend: { label: string; count: number }[];}
interface Stats { firms: number; totalEngagements: number; active: number; completed: number; openFindings: number; overdue: number; criticalFindings: number;}

// -- Constants -----------------------------------------------------------------
const ENGAGEMENT_STEPS: EngagementStatus[] = [ 'CONSULTATION', 'PLANNING', 'FIELDWORK', 'REPORTING', 'FOLLOWUP', 'COMPLETED',];
const ENGAGEMENT_LABELS: Record<EngagementStatus, string> = { CONSULTATION: 'Consultation', PLANNING: 'Planning', FIELDWORK: 'Fieldwork', REPORTING: 'Reporting', FOLLOWUP: 'Follow-up', COMPLETED: 'Completed' };
const ENGAGEMENT_COLORS: Record<EngagementStatus, string> = { CONSULTATION: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', PLANNING: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300', FIELDWORK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', REPORTING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', FOLLOWUP: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', COMPLETED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300' };
const ENGAGEMENT_DOT: Record<EngagementStatus, string> = { CONSULTATION: 'bg-teal-500', PLANNING: 'bg-[var(--pro-azure-50)]0', FIELDWORK: 'bg-amber-500', REPORTING: 'bg-orange-500', FOLLOWUP: 'bg-cyan-500', COMPLETED: 'bg-[var(--pro-azure-50)]0' };
const ENGAGEMENT_BORDER: Record<EngagementStatus, string> = { CONSULTATION: 'border-t-teal-400', PLANNING: 'border-t-[var(--pro-azure)]', FIELDWORK: 'border-t-amber-400', REPORTING: 'border-t-orange-400', FOLLOWUP: 'border-t-cyan-400', COMPLETED: 'border-t-[var(--pro-azure)]' };
const SEVERITY_COLORS: Record<Severity, string> = { LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', CRITICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' };
const FINDING_STATUS_COLORS: Record<string, string> = { OPEN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300', IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', RESOLVED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300' };
const INPUT_CLS = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400';
const AUDIT_TYPE_LABELS: Record<AuditType, string> = { FINANCIAL_STATEMENT: 'Financial Statement', COMPLIANCE: 'Compliance', RISK_ASSESSMENT: 'Risk Assessment', INTERNAL_CONTROL: 'Internal Control', TAX_COMPLIANCE: 'Tax Compliance', INTERNAL: 'Internal Audit', OTHER: 'Other' };
const AUDIT_TYPE_COLORS: Record<AuditType, string> = { FINANCIAL_STATEMENT: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300', COMPLIANCE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', RISK_ASSESSMENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', INTERNAL_CONTROL: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', TAX_COMPLIANCE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', INTERNAL: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300', OTHER: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
const RISK_COLORS: Record<RiskLevel, string> = { LOW: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300', MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', HIGH: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' };
const fmt = (n: number) => new Intl.NumberFormat().format(n);// Best-practice checklist items (static, no backend needed)
const BEST_PRACTICES = [ 'Define clear audit objectives and scope before engagement', 'Select a firm with proven industry expertise', 'Ensure data security protocols are agreed upon in writing', 'Schedule regular check-ins throughout the audit process', 'Review the audit report thoroughly before filing', 'Track all findings and assign owners for remediation', 'Prepare documentation and records well in advance', 'Follow up on all open findings within 30 days',];

// -- Helpers -------------------------------------------------------------------
const isOverdue = (eng: AuditEngagement) => eng.status !== 'COMPLETED' && !!eng.endDate && new Date(eng.endDate) < new Date();
const daysLeft = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// -- Shared UI -----------------------------------------------------------------
interface BadgeProps {
  label: string;
  className?: string;
}
function Badge({ label, className = '' }: BadgeProps) { return (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${className}`}>
    {label}
  </span>
);
}
interface ProgressBarProps {
  status: EngagementStatus;
  compact?: boolean;
}
function ProgressBar({ status, compact }: ProgressBarProps) {
  const idx = ENGAGEMENT_STEPS.indexOf(status);
const pct = Math.round((idx / (ENGAGEMENT_STEPS.length - 1)) * 100);
if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${ENGAGEMENT_DOT[status]}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">{pct}%</span>
      </div>
    );
  }
return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{ENGAGEMENT_LABELS[status]}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${ENGAGEMENT_DOT[status]}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between px-0.5">
        {ENGAGEMENT_STEPS.map((s, i) => (
          <div key={s} title={ENGAGEMENT_LABELS[s]} className={`w-1.5 h-1.5 rounded-full ${i <= idx ? ENGAGEMENT_DOT[status] : 'bg-slate-200 dark:bg-slate-600'}`} />
        ))}
      </div>
    </div>
  );}
interface SeverityBarProps { findings: AuditFinding[] };
function SeverityBar({ findings }: SeverityBarProps) {
  if (!findings.length) return null;
const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<Severity, number>;
  findings.forEach((f) => { counts[f.severity] = (counts[f.severity] ?? 0) + 1; });
const total = findings.length;
const bars: { sev: Severity; color: string }[] = [
    { sev: 'CRITICAL', color: 'bg-rose-500' },
    { sev: 'HIGH', color: 'bg-orange-400' },
    { sev: 'MEDIUM', color: 'bg-amber-400' },
    { sev: 'LOW', color: 'bg-slate-300 dark:bg-slate-500' },
  ];
return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Severity breakdown</p>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {bars.map(({ sev, color }) => counts[sev] > 0 ? (
          <div key={sev} title={`${sev}: ${counts[sev]}`} className={`${color}`} style={{ width: `${(counts[sev] / total) * 100}%` }} />
        ) : null)}
      </div>
      <div className="flex gap-3 flex-wrap">
        {bars.map(({ sev, color }) => counts[sev] > 0 ? (
          <span key={sev} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {sev[0]}{sev.slice(1).toLowerCase()} ({counts[sev]})
          </span>
        ) : null)}
      </div>
    </div>
  );}
interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}
function StarRating({ value, onChange, readonly }: StarRatingProps) { return (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n}
type="button" disabled={readonly} onClick={() => onChange?.(n)} className={`transition-colors ${readonly ? 'cursor-default' : 'hover:scale-110'}`}>
        <Star size={13} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'} />
      </button>
    ))}
  </div>
);
}

// -- Comments Panel ------------------------------------------------------------
interface CommentsPanelProps {
  engagement: AuditEngagement;
  currentUser: string;
  onClose(): void;
}
function CommentsPanel({ engagement, currentUser, onClose }: CommentsPanelProps) { const [comments, setComments] = useState<AuditComment[]>([]);
const [loading, setLoading] = useState(true);
const [text, setText] = useState('');
const [sending, setSending] = useState(false);
const bottomRef = useRef<HTMLDivElement>(null); useEscapeKey(onClose);
const load = useCallback(async () => { setLoading(true);
try { const res = await api.get(`/audit-outsourcing/engagements/${engagement.id}/comments`); setComments(res.data); }
catch { toast.error('Failed to load comments'); }
finally { setLoading(false); } }, [engagement.id]);
useEffect(() => { load(); }, [load]);
useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);
const send = async () => { if (!text.trim()) return; setSending(true);
try { await api.post('/audit-outsourcing/comments', { engagementId: engagement.id, content: text.trim(), authorName: currentUser }); setText(''); load(); }
catch { toast.error('Failed to send'); }
finally { setSending(false); } };
const del = async (id: string) => { try { await api.delete(`/audit-outsourcing/comments/${id}`); setComments((p) => p.filter((c) => c.id !== id)); }
catch { toast.error('Failed to delete'); } };
return ( <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"> <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"> <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <div> <div className="flex items-center gap-2">
<MessageSquare size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> <h2 className="font-semibold text-slate-800 dark:text-white">Communication Log</h2> </div> <p className="text-xs text-slate-500 mt-0.5">{engagement.title}</p> </div> <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> <div className="flex-1 overflow-y-auto p-5 space-y-3"> {loading ? ( Array.from({ length: 3 }).map((_, i) =>
<Skeleton.Card key={i} />) ) : comments.length === 0 ? ( <div className="ovds-empty text-sm"> No messages yet. Start the conversation. </div> ) : ( comments.map((c, _i) => ( <div key={c.id} className="flex gap-3 group"> <div className="w-7 h-7 rounded-full bg-[var(--pro-azure-50)] dark:bg-green-950/20 flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] text-xs font-semibold shrink-0 mt-0.5"> {(c.authorName ?? 'U')[0].toUpperCase()} </div> <div className="flex-1 min-w-0"> <div className="flex items-center gap-2"> <span className="text-xs font-bold text-slate-700 dark:text-white">{c.authorName ?? 'Unknown'}</span> <span className="ovds-caption">{fmtDate(c.createdAt)}</span> </div> <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{c.content}</p> </div> <button onClick={() => del(c.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all shrink-0">
<Trash2 size={11} /> </button> </div> )) )} <div ref={bottomRef} /> </div> <div className="p-4 border-t border-slate-100 dark:border-slate-700"> <div className="flex gap-2"> <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a message... (Enter to send)" className={INPUT_CLS} /> <button onClick={send} disabled={sending || !text.trim()} className="px-3 py-2 rounded-xl bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 shrink-0">
<Send size={14} /> </button> </div> </div> </div> </div> );};

// -- Attachment Manager -------------------------------------------------------
interface AuditAttachmentManagerProps {
  attachableId: string;
  attachableType: 'AuditEngagement' | 'AuditFinding';
  title: string;
  onClose(): void;
}
function AuditAttachmentManager({ attachableId, attachableType, title, onClose }: AuditAttachmentManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
const [loading, setLoading] = useState(true);
const [uploading, setUploading] = useState(false);
const [file, setFile] = useState<File | null>(null);
const [description, setDescription] = useState(''); useEscapeKey(onClose);
const load = useCallback(async () => { setLoading(true);
try { const res = await api.get(`/ovds/attachments/${attachableType}/${attachableId}`); setAttachments(res.data); }
catch { toast.error('Failed to load attachments'); }
finally { setLoading(false); } }, [attachableId, attachableType]);
useEffect(() => { load(); }, [load]);
const handleUpload = async () => { if (!file) return; setUploading(true);
const formData = new FormData(); formData.append('file', file); formData.append('attachableId', attachableId); formData.append('attachableType', attachableType); formData.append('description', description);
try { await api.post('/ovds/attachments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
toast.success('File uploaded'); load(); setFile(null); setDescription(''); }
catch { toast.error('Upload failed'); }
finally { setUploading(false); } };
const handleDownload = async (a: Attachment) => { try { const res = await api.get(`/ovds/attachments/${a.id}`, { responseType: 'blob' });
const url = window.URL.createObjectURL(new Blob([res.data]));
const link = document.createElement('a'); link.href = url; link.setAttribute('download', a.filename); document.body.appendChild(link); link.click(); link.remove(); }
catch { toast.error('Download failed'); } };
const handleDelete = async (id: string) => { if (!await confirm({ title: 'Delete Attachment', message: 'Delete this file?', variant: 'danger' })) return;
try { await api.delete(`/ovds/attachments/${id}`);
toast.success('Deleted'); load(); }
catch { toast.error('Delete failed'); } };
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Plus size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> Attachments
            </h2>
            <p className="ovds-caption mt-0.5 uppercase tracking-wider">{title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-white dark:bg-slate-700/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[var(--pro-azure-50)]0 file:text-white hover:file:bg-[var(--pro-azure-dark)] cursor-pointer" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description (optional)" className={INPUT_CLS} />
            <button onClick={handleUpload} disabled={!file || uploading} className="w-full py-2 rounded-xl bg-[var(--pro-azure)] text-white text-xs font-semibold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Attached Files ({attachments.length})
            </p>
            {loading ? (
              <div className="space-y-2">
                <div className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
                <div className="h-12 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
              </div>
            ) : attachments.length === 0 ? (
              <div className="ovds-empty text-xs border-2 border-dashed border-slate-100 dark:border-slate-700/50 rounded-2xl">
                No files attached yet.
              </div>
            ) : (
              attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 ovds-widget-card group">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{a.filename}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleDownload(a)} title="Download"
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                      <Download size={14} />
                    </button>
                    <button onClick={() => handleDelete(a.id)} title="Delete"
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );}

// -- Print Report --------------------------------------------------------------
const downloadEngagementPdf = async (eng: AuditEngagement) => { try { const res = await api.get(`/audit-outsourcing/engagements/${eng.id}/pdf`, { responseType: 'blob' });
const url = window.URL.createObjectURL(new Blob([res.data]));
const link = document.createElement('a'); link.href = url; link.setAttribute('download', `audit-report-${eng.title.replace(/\s+/g, '-').toLowerCase()}.pdf`); document.body.appendChild(link); link.click(); link.remove(); }
catch { toast.error('Failed to download PDF report'); }};

// -- Compliance Certificate ----------------------------------------------------
const downloadComplianceCertificate = async (eng: AuditEngagement) => { try { const res = await api.get(`/audit-outsourcing/engagements/${eng.id}/certificate`, { responseType: 'blob' });
const url = window.URL.createObjectURL(new Blob([res.data]));
const link = document.createElement('a'); link.href = url; link.setAttribute('download', `compliance-certificate-${eng.title.replace(/\s+/g, '-').toLowerCase()}.pdf`); document.body.appendChild(link); link.click(); link.remove(); }
catch { toast.error('Failed to download compliance certificate'); }};

// -- Best Practices Checklist Panel -------------------------------------------
interface BestPracticesPanelProps { onClose: () => void };
function BestPracticesPanel({ onClose }: BestPracticesPanelProps) { const [checked, setChecked] = useLocalStorage<number[]>('audit_checklist', []); useEscapeKey(onClose);
const toggle = (i: number) => setChecked((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"> <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md"> <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <div className="flex items-center gap-2">
<BookOpen size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> <h2 className="font-semibold text-slate-800 dark:text-white">Best Practices Checklist</h2> </div> <div className="flex items-center gap-3"> <span className="text-xs text-slate-400">{checked.length}/{BEST_PRACTICES.length} done</span> <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> </div> {/* Progress */} <div className="px-5 pt-4"> <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"> <div className="h-full bg-[var(--pro-azure-50)]0 rounded-full transition-all duration-500" style={{ width: `${(checked.length / BEST_PRACTICES.length) * 100}%` }} /> </div> </div> <div className="p-5 space-y-2 max-h-80 overflow-y-auto"> {BEST_PRACTICES.map((item, i) => ( <button key={i} onClick={() => toggle(i)} className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors group"> {checked.includes(i) ? <CheckSquare size={16} className="text-[var(--pro-azure)] shrink-0 mt-0.5" /> : <Square size={16} className="text-slate-300 dark:text-slate-600 shrink-0 mt-0.5 group-hover:text-slate-400" />} <span className={`text-sm leading-relaxed ${checked.includes(i) ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}> {item} </span> </button> ))} </div> <div className="flex justify-between items-center p-5 border-t border-slate-100 dark:border-slate-700"> <button onClick={() => setChecked([])} className="text-xs text-slate-400 hover:text-rose-500 transition-colors"> Reset all </button> <button onClick={() => setChecked(BEST_PRACTICES.map((_, i) => i))} className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"> Mark all done </button> </div> </div> </div> );}

// -- Firm Modal ----------------------------------------------------------------
interface FirmModalProps {
  firm?: AuditFirm | null;
  onClose(): void;
  onSaved(): void;
}
function FirmModal({ firm, onClose, onSaved }: FirmModalProps) { const [form, setForm] = useState({ name: firm?.name ?? '', contactPerson: firm?.contactPerson ?? '', email: firm?.email ?? '', phone: firm?.phone ?? '', industry: firm?.industry ?? '', notes: firm?.notes ?? '', status: firm?.status ?? 'ACTIVE', rating: firm?.rating ?? 0 });
const [saving, setSaving] = useState(false);
const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v })); useEscapeKey(onClose);
const save = async () => { if (!form.name.trim()) return toast.error('Firm name is required'); setSaving(true);
try { if (firm) { await api.patch(`/audit-outsourcing/firms/${firm.id}`, form); }
else { await api.post('/audit-outsourcing/firms', form); }
toast.success(firm ? 'Firm updated' : 'Firm added'); onSaved(); onClose(); }
catch { toast.error('Failed to save firm'); }
finally { setSaving(false); } };
return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"> <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md"> <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <h2 className="font-semibold text-slate-800 dark:text-white">{firm ? 'Edit Audit Firm' : 'Add Audit Firm'}</h2> <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> <div className="p-5 space-y-3"> {([ { label: 'Firm Name *', key: 'name', placeholder: 'e.g. Deloitte Ethiopia', icon: <Building2 size={13} /> }, { label: 'Contact Person', key: 'contactPerson', placeholder: 'Full name', icon: <Users size={13} /> }, { label: 'Email', key: 'email', placeholder: 'contact@firm.com', icon: <Mail size={13} /> }, { label: 'Phone', key: 'phone', placeholder: '+251...', icon: <Phone size={13} /> }, { label: 'Industry Specialization', key: 'industry', placeholder: 'e.g. ovds, Healthcare', icon: <BarChart3 size={13} /> }, ] as { label: string; key: string; placeholder: string; icon: React.ReactNode }[]).map(({ label, key, placeholder, icon }) => ( <div key={key}> <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label> <div className="relative"> <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span> <input value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" /> </div> </div> ))} <div> <label className="block text-xs font-bold text-slate-500 mb-1">Firm Rating</label>
<StarRating value={form.rating} onChange={(v) => set('rating', v)} /> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label> <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={INPUT_CLS + ' resize-none'} /> </div> {firm && ( <div> <label className="block text-xs font-bold text-slate-500 mb-1">Status</label> <select value={form.status} onChange={(e) => set('status', e.target.value)} className={INPUT_CLS}> <option value="ACTIVE">Active</option> <option value="INACTIVE">Inactive</option> </select> </div> )} </div> <div className="flex justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-700"> <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button> <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] disabled:opacity-50"> {saving ? 'Saving...' : 'Save'} </button> </div> </div> </div> );};

// -- Firm Detail Drawer --------------------------------------------------------
interface FirmDrawerProps {
  firm: AuditFirm;
  engagements: AuditEngagement[];
  canWrite: boolean;
  onEdit(): void;
  onClose(): void;
  onViewEngagements(): void;
}
function FirmDrawer({ firm, engagements, canWrite, onEdit, onClose, onViewEngagements }: FirmDrawerProps) { const firmEngs = engagements.filter((e) => e.firmId === firm.id);
const completed = firmEngs.filter((e) => e.status === 'COMPLETED').length;
const active = firmEngs.filter((e) => e.status !== 'COMPLETED').length; useEscapeKey(onClose);
return ( <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}> <div className="bg-white dark:bg-slate-800 w-full max-w-sm h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200" onClick={(e) => e.stopPropagation()}> <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/20 flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold text-lg"> {firm.name[0]} </div> <div> <p className="font-semibold text-slate-800 dark:text-white">{firm.name}</p> <div className="flex items-center gap-2 mt-0.5">
<Badge label={firm.status} className={firm.status === 'ACTIVE' ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-slate-100 text-slate-500'} /> {(firm.rating ?? 0) > 0 && <StarRating value={firm.rating ?? 0} readonly />} </div> </div> </div> <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> <div className="p-5 space-y-5 flex-1"> <div className="space-y-2"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Contact</p> {firm.contactPerson && ( <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
<Users size={14} className="text-slate-400 shrink-0" /> {firm.contactPerson} </div> )} {firm.email && ( <a href={`mailto:${firm.email}`} className="flex items-center gap-2 text-sm text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
<Mail size={14} className="shrink-0" /> {firm.email} </a> )} {firm.phone && ( <a href={`tel:${firm.phone}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<Phone size={14} className="text-slate-400 shrink-0" /> {firm.phone} </a> )} {firm.industry && ( <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
<BarChart3 size={14} className="text-slate-400 shrink-0" /> {firm.industry} </div> )} </div> <div className="ovds-grid-layout cols-3 gap-sm"> {[ { label: 'Total', value: firmEngs.length, color: 'text-slate-700 dark:text-white' }, { label: 'Active', value: active, color: 'text-amber-600' }, { label: 'Done', value: completed, color: 'text-[var(--pro-azure)]' }, ].map(({ label, value, color }) => ( <div key={label} className="bg-white dark:bg-slate-700/50 rounded-xl p-3 text-center"> <p className={`text-xl font-semibold ${color}`}>{value}</p> <p className="ovds-caption mt-0.5">{label}</p> </div> ))} </div> {firmEngs.length > 0 && ( <div className="space-y-2"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Engagements</p> {firmEngs.slice(0, 4).map((e, _i) => ( <div key={e.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-700/50 rounded-xl"> <div className="min-w-0 flex-1"> <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{e.title}</p> <div className="flex items-center gap-2 mt-0.5">
<Badge label={ENGAGEMENT_LABELS[e.status]} className={`text-[10px] ${ENGAGEMENT_COLORS[e.status]}`} /> {isOverdue(e) && <Badge label="Overdue" className="text-[10px] bg-rose-100 text-rose-6" />} </div> </div>
<ChevronRight size={14} className="text-slate-400 shrink-0 ml-2" /> </div> ))} {firmEngs.length > 4 && ( <button onClick={onViewEngagements} className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline w-full text-center pt-1"> View all {firmEngs.length} engagements → </button> )} </div> )} {firm.notes && ( <div> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Notes</p> <p className="ovds-body">{firm.notes}</p> </div> )} <div> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Added</p> <p className="ovds-caption">{fmtDate(firm.createdAt)}</p> </div> </div> {canWrite && ( <div className="p-5 border-t border-slate-100 dark:border-slate-700"> <button onClick={onEdit} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)]">
<Edit2 size={14} /> Edit Firm </button> </div> )} </div> </div> );}

// -- Engagement Modal ----------------------------------------------------------
interface EngagementModalProps {
  engagement?: AuditEngagement | null;
  firms: AuditFirm[];
  onClose(): void;
  onSaved(): void;
}
function EngagementModal({ engagement, firms, onClose, onSaved }: EngagementModalProps) { const [form, setForm] = useState({ firmId: engagement?.firmId ?? '', title: engagement?.title ?? '', scope: engagement?.scope ?? '', status: engagement?.status ?? 'CONSULTATION', auditType: engagement?.auditType ?? 'OTHER', riskLevel: engagement?.riskLevel ?? 'MEDIUM', startDate: engagement?.startDate ? engagement.startDate.slice(0, 10) : '', endDate: engagement?.endDate ? engagement.endDate.slice(0, 10) : '', notes: engagement?.notes ?? '', reportSummary: engagement?.reportSummary ?? '', budget: engagement?.budget?.toString() ?? '', actualCost: engagement?.actualCost?.toString() ?? '', referenceDocUrl: engagement?.referenceDocUrl ?? '' });
const [saving, setSaving] = useState(false);
const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v })); useEscapeKey(onClose);
const save = async () => { if (!form.title.trim()) return toast.error('Title is required'); setSaving(true);
try { const payload = { ...form, firmId: form.firmId || null, budget: form.budget ? parseInt(form.budget) : undefined, actualCost: form.actualCost ? parseInt(form.actualCost) : undefined };
if (engagement) { await api.patch(`/audit-outsourcing/engagements/${engagement.id}`, payload); }
else { await api.post('/audit-outsourcing/engagements', payload); }
toast.success(engagement ? 'Engagement updated' : 'Engagement created'); onSaved(); onClose(); }
catch { toast.error('Failed to save engagement'); }
finally { setSaving(false); } };
return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"> <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"> <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <h2 className="font-semibold text-slate-800 dark:text-white">{engagement ? 'Edit Engagement' : 'New Engagement'}</h2> <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> <div className="p-5 space-y-3"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Audit Firm (External)</label> <select value={form.firmId} onChange={(e) => { set('firmId', e.target.value);
if (!e.target.value) set('auditType', 'INTERNAL'); }} className={INPUT_CLS}> <option value="">Internal Audit (No External Firm)</option> {firms.filter((f) => f.status === 'ACTIVE').map((f, _i) => ( <option key={f.id} value={f.id}>{f.name}</option> ))} </select> <p className="text-[10px] text-slate-400 mt-1">Leave empty if this is an internal audit engagement.</p> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Engagement Title *</label> <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. FY2025 Annual Financial Audit" className={INPUT_CLS} /> </div> <div className="grid grid-cols-2 gap-3"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Audit Type</label> <select value={form.auditType} onChange={(e) => set('auditType', e.target.value)} className={INPUT_CLS}> {(Object.keys(AUDIT_TYPE_LABELS) as AuditType[]).map((t, _i) => ( <option key={t} value={t}>{AUDIT_TYPE_LABELS[t]}</option> ))} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Risk Level</label> <select value={form.riskLevel} onChange={(e) => set('riskLevel', e.target.value)} className={INPUT_CLS}> <option value="LOW">Low</option> <option value="MEDIUM">Medium</option> <option value="HIGH">High</option> </select> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Scope of Work</label> <textarea value={form.scope} onChange={(e) => set('scope', e.target.value)} rows={2} placeholder="Describe what is included in this audit..." className={INPUT_CLS + ' resize-none'} /> </div> {engagement && ( <div> <label className="block text-xs font-bold text-slate-500 mb-1">Status</label> <select value={form.status} onChange={(e) => set('status', e.target.value)} className={INPUT_CLS}> {ENGAGEMENT_STEPS.map((s, _i) => ( <option key={s} value={s}>{ENGAGEMENT_LABELS[s]}</option> ))} </select> </div> )} <div className="grid grid-cols-2 gap-3"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label> <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={INPUT_CLS} /> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label> <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={INPUT_CLS} /> </div> </div> <div className="grid grid-cols-2 gap-3"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Budget</label> <div className="relative">
<DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> <input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="0" className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Actual Cost</label> <div className="relative">
<DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> <input type="number" value={form.actualCost} onChange={(e) => set('actualCost', e.target.value)} placeholder="0" className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" /> </div> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Reference Document URL (PDF/Link)</label> <div className="relative">
<FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> <input value={form.referenceDocUrl} onChange={(e) => set('referenceDocUrl', e.target.value)} placeholder="https://..." className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" /> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label> <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={INPUT_CLS + ' resize-none'} /> </div> {engagement && ( <div> <label className="block text-xs font-bold text-slate-500 mb-1">Report Summary</label> <textarea value={form.reportSummary} onChange={(e) => set('reportSummary', e.target.value)} rows={3} placeholder="Summarize the audit findings and opinion..." className={INPUT_CLS + ' resize-none'} /> </div> )} </div> <div className="flex justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-700"> <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button> <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] disabled:opacity-50"> {saving ? 'Saving...' : 'Save'} </button> </div> </div> </div> );};

// -- Finding Modal -------------------------------------------------------------
interface FindingModalProps {
  finding?: AuditFinding | null;
  engagementId: string;
  onClose(): void;
  onSaved(): void;
}
function FindingModal({ finding, engagementId, onClose, onSaved }: FindingModalProps) { const [form, setForm] = useState({ title: finding?.title ?? '', description: finding?.description ?? '', severity: finding?.severity ?? 'MEDIUM', recommendation: finding?.recommendation ?? '', resolution: finding?.resolution ?? '', status: finding?.status ?? 'OPEN', dueDate: finding?.dueDate ? finding.dueDate.slice(0, 10) : '', assignedTo: finding?.assignedTo ?? '', referenceDocUrl: finding?.referenceDocUrl ?? '' });
const [saving, setSaving] = useState(false);
const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v })); useEscapeKey(onClose);
const save = async () => { if (!form.title.trim()) return toast.error('Title is required'); setSaving(true);
try { if (finding) { await api.patch(`/audit-outsourcing/findings/${finding.id}`, form); }
else { await api.post('/audit-outsourcing/findings', { ...form, engagementId }); }
toast.success(finding ? 'Finding updated' : 'Finding added'); onSaved(); onClose(); }
catch { toast.error('Failed to save finding'); }
finally { setSaving(false); } };
return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"> <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"> <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <h2 className="font-semibold text-slate-800 dark:text-white">{finding ? 'Edit Finding' : 'Add Finding'}</h2> <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> <div className="p-5 space-y-3"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Title *</label> <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Missing reconciliation for Q3" className={INPUT_CLS} /> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Description</label> <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={INPUT_CLS + ' resize-none'} /> </div> <div className="grid grid-cols-2 gap-3"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Severity</label> <select value={form.severity} onChange={(e) => set('severity', e.target.value)} className={INPUT_CLS}> {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Severity[]).map((s, _i) => ( <option key={s} value={s}>{s}</option> ))} </select> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Status</label> <select value={form.status} onChange={(e) => set('status', e.target.value)} className={INPUT_CLS}> <option value="OPEN">Open</option> <option value="IN_PROGRESS">In Progress</option> <option value="RESOLVED">Resolved</option> </select> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Recommendation</label> <textarea value={form.recommendation} onChange={(e) => set('recommendation', e.target.value)} rows={2} className={INPUT_CLS + ' resize-none'} /> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Resolution Notes</label> <textarea value={form.resolution} onChange={(e) => set('resolution', e.target.value)} rows={2} className={INPUT_CLS + ' resize-none'} /> </div> <div className="grid grid-cols-2 gap-3"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Due Date</label> <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={INPUT_CLS} /> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Assigned To</label> <div className="relative">
<UserCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> <input value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} placeholder="Name or team" className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" /> </div> </div> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">Reference Document URL (PDF/Link)</label> <div className="relative">
<FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> <input value={form.referenceDocUrl} onChange={(e) => set('referenceDocUrl', e.target.value)} placeholder="https://..." className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400" /> </div> </div> </div> <div className="flex justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-700"> <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button> <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)] disabled:opacity-50"> {saving ? 'Saving...' : 'Save'} </button> </div> </div> </div> );}

// -- Findings Panel ------------------------------------------------------------
interface FindingsPanelProps {
  engagement: AuditEngagement;
  canWrite: boolean;
  onClose(): void;
  onAttachments(f: AuditFinding): void;
}
function FindingsPanel({ engagement, canWrite, onClose, onAttachments }: FindingsPanelProps) { const [findings, setFindings] = useState<AuditFinding[]>([]);
const [loading, setLoading] = useState(true);
const [showModal, setShowModal] = useState(false);
const [editing, setEditing] = useState<AuditFinding | null>(null);
const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
const [statusFilter, setStatusFilter] = useState<string>('ALL');
const [resolving, setResolving] = useState<string | null>(null); useEscapeKey(onClose, !showModal);
const load = useCallback(async () => { setLoading(true);
try { const res = await api.get(`/audit-outsourcing/engagements/${engagement.id}/findings`); setFindings(res.data); }
catch { toast.error('Failed to load findings'); }
finally { setLoading(false); } }, [engagement.id]);
useEffect(() => { load(); }, [load]);
const deleteFinding = async (id: string) => { if (!await confirm({ title: 'Delete Finding', message: 'Delete this finding?', variant: 'danger' })) return;
try { await api.delete(`/audit-outsourcing/findings/${id}`);
toast.success('Finding deleted'); load(); }
catch { toast.error('Failed to delete'); } };
const quickResolve = async (f: AuditFinding) => { const next = f.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED'; setResolving(f.id);
try { await api.patch(`/audit-outsourcing/findings/${f.id}`, { status: next }); setFindings((prev) => prev.map((x, _i) => x.id === f.id ? { ...x, status: next } : x));
toast.success(next === 'RESOLVED' ? 'Marked resolved' : 'Reopened'); }
catch { toast.error('Failed to update'); }
finally { setResolving(null); } };
const exportFindings = () => { const header = 'Title,Severity,Status,Description,Recommendation,Resolution,Date';
const rows = findings.map((f, _i) => [`"${f.title}"`, f.severity, f.status, `"${f.description ?? ''}"`, `"${f.recommendation ?? ''}"`, `"${f.resolution ?? ''}"`, fmtDate(f.createdAt)].join(',') ); downloadCSV([header, ...rows].join('\n'), `findings-${engagement.title.replace(/\s+/g, '-')}.csv`); };
const filtered = findings.filter((f) => (severityFilter === 'ALL' || f.severity === severityFilter) && (statusFilter === 'ALL' || f.status === statusFilter) );
const openCount = findings.filter((f) => f.status !== 'RESOLVED').length;
const resolvedCount = findings.filter((f) => f.status === 'RESOLVED').length;
const criticalCount = findings.filter((f) => f.severity === 'CRITICAL' && f.status !== 'RESOLVED').length;
return ( <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"> <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col"> {/* Header */} <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <div> <h2 className="font-semibold text-slate-800 dark:text-white">Audit Findings</h2> <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2"> {engagement.title} <Badge label={ENGAGEMENT_LABELS[engagement.status]} className={`${ENGAGEMENT_COLORS[engagement.status]}`} /> </p> </div> <div className="flex items-center gap-2"> {findings.length > 0 && ( <button onClick={exportFindings} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
<Download size={12} /> Export </button> )} {canWrite && ( <button onClick={() => { setEditing(null); setShowModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)]">
<Plus size={12} /> Add Finding </button> )} <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> </div> {/* Summary + filters */} {!loading && findings.length > 0 && ( <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 space-y-3"> <div className="flex items-center gap-4 flex-wrap"> <span className="ovds-caption">{findings.length} total</span> <span className="text-xs font-bold text-rose-600">{openCount} open</span> <span className="text-xs font-bold text-[var(--pro-azure)]">{resolvedCount} resolved</span> {criticalCount > 0 && ( <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-lg">
<AlertTriangle size={11} /> {criticalCount} critical unresolved </span> )} <div className="ml-auto flex items-center gap-2"> <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as any)} className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 dark:text-white focus:outline-none"> <option value="ALL">All severities</option> {(['CRITICAL','HIGH','MEDIUM','LOW'] as Severity[]).map((s, _i) => <option key={s} value={s}>{s}</option>)} </select> <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 dark:text-white focus:outline-none"> <option value="ALL">All statuses</option> <option value="OPEN">Open</option> <option value="IN_PROGRESS">In Progress</option> <option value="RESOLVED">Resolved</option> </select> </div> </div>
<SeverityBar findings={findings} /> </div> )} {/* List */} <div className="flex-1 overflow-y-auto p-5 space-y-2.5"> {loading ? ( Array.from({ length: 3 }).map((_, i) =>
<Skeleton.Card key={i} />) ) : filtered.length === 0 ? ( <div className="ovds-empty text-sm"> {findings.length === 0 ? 'No findings recorded yet.' : 'No findings match the current filters.'} </div> ) : ( filtered.map((f, _i) => ( <div key={f.id} className={`border rounded-xl p-4 transition-all ${ f.status === 'RESOLVED' ? 'border-[var(--pro-azure-100)] dark:border-green-900/30 bg-[var(--pro-azure-50)]/30 dark:bg-green-900/10 opacity-75' : f.severity === 'CRITICAL' ? 'border-rose-200 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600' }`}> <div className="flex items-start justify-between gap-2"> <div className="flex-1 min-w-0"> <div className="flex items-center gap-2 flex-wrap"> <span className={`font-bold text-sm ${f.status === 'RESOLVED' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}> {f.title} </span>
<Badge label={f.severity} className={SEVERITY_COLORS[f.severity]} />
<Badge label={f.status.replace('_', ' ')} className={FINDING_STATUS_COLORS[f.status] ?? 'bg-slate-100 text-slate-600'} /> </div> {f.description && <p className="text-xs text-slate-500 mt-1">{f.description}</p>} {f.recommendation && ( <div className="mt-2 p-2 bg-[var(--pro-azure-50)] dark:bg-green-900/20 rounded-lg"> <p className="text-xs text-[var(--pro-azure-dark)] dark:text-green-300"> <span className="font-bold">Rec: </span>{f.recommendation} </p> </div> )} {f.resolution && ( <div className="mt-2 p-2 bg-[var(--pro-azure-50)] dark:bg-green-900/20 rounded-lg"> <p className="text-xs text-[var(--pro-azure-dark)] dark:text-green-300"> <span className="font-bold">Resolution: </span>{f.resolution} </p> </div> )} {f.referenceDocUrl && ( <a href={f.referenceDocUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline flex items-center gap-1 mt-2 font-bold bg-white dark:bg-slate-700/50 p-1.5 rounded-lg w-fit">
<FileText size={10} /> Reference Document </a> )} <div className="flex items-center gap-3 mt-2 flex-wrap"> <p className="ovds-caption">{fmtDate(f.createdAt)}</p> {f.assignedTo && ( <span className="flex items-center gap-1 text-[10px] text-slate-500">
<UserCheck size={10} /> {f.assignedTo} </span> )} {f.dueDate && ( <span className={`flex items-center gap-1 text-[10px] font-bold ${ new Date(f.dueDate) < new Date() && f.status !== 'RESOLVED' ? 'text-rose-500' : 'text-slate-400' }`}>
<CalendarClock size={10} /> Due {fmtDate(f.dueDate)} </span> )} </div> </div> <div className="flex gap-1 shrink-0"> {/* Quick resolve toggle */} <button onClick={() => quickResolve(f)} disabled={resolving === f.id} title={f.status === 'RESOLVED' ? 'Reopen' : 'Mark resolved'} className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${ f.status === 'RESOLVED' ? 'text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20' : 'text-slate-400 hover:text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-900/20' }`}>
<CheckCircle2 size={14} /> </button> {canWrite && ( <> <button onClick={() => onAttachments(f)} className="p-1.5 rounded-lg hover:bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors" title="Attachments">
<Paperclip size={13} /> </button> <button onClick={() => { setEditing(f); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<Edit2 size={13} /> </button> <button onClick={() => deleteFinding(f.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
<Trash2 size={13} /> </button> </> )} </div> </div> </div> )) )} </div> </div> {showModal && ( <FindingModal finding={editing} engagementId={engagement.id} onClose={() => setShowModal(false)} onSaved={load} /> )} </div> );};

// -- Kanban Board View ---------------------------------------------------------
interface KanbanBoardProps {
  engagements: AuditEngagement[];
  canWrite: boolean;
  isAdmin: boolean;
  advancing: string | null;
  onAdvance(id: string): void;
  onEdit(eng: AuditEngagement): void;
  onDelete(id: string): void;
  onFindings(eng: AuditEngagement): void;
  onAttachments(eng: AuditEngagement): void;
  onCertificate(eng: AuditEngagement): void;
}
function KanbanBoard({ engagements, canWrite, isAdmin, advancing, onAdvance, onEdit, onDelete, onFindings, onAttachments, onCertificate }: KanbanBoardProps) { return ( <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1"> {ENGAGEMENT_STEPS.map((step, _i) => { const cols = engagements.filter((e) => e.status === step);
const isLastStep = step === 'COMPLETED';
return ( <div key={step} className="flex-shrink-0 w-64"> <div className={`flex items-center justify-between mb-2 px-1`}> <div className="flex items-center gap-2"> <div className={`w-2 h-2 rounded-full ${ENGAGEMENT_DOT[step]}`} /> <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{ENGAGEMENT_LABELS[step]}</span> </div> <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full"> {cols.length} </span> </div> <div className="space-y-2 min-h-16"> {cols.length === 0 ? ( <div className="border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl h-16 flex items-center justify-center"> <span className="text-[10px] text-slate-300 dark:text-slate-600">Empty</span> </div> ) : ( cols.map((eng, _i) => { const overdue = isOverdue(eng);
return ( <div key={eng.id} className={`bg-white dark:bg-slate-800 border-t-2 ${ENGAGEMENT_BORDER[step]} border border-slate-100 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow`}> <div className="flex items-start justify-between gap-1 mb-2"> <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">{eng.title}</p> <div className="flex gap-0.5 shrink-0"> <button onClick={() => onAttachments(eng)} title="Attachments" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<Paperclip size={11} /> </button> <button onClick={() => onFindings(eng)} title="Findings" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<AlertTriangle size={11} /> </button> {isLastStep && ( <button onClick={() => onCertificate(eng)} title="Compliance Certificate" className="p-1 rounded bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure)] hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/40">
<Award size={11} /> </button> )} {canWrite && ( <button onClick={() => onEdit(eng)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<Edit2 size={11} /> </button> )} </div> </div> <p className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
<Building2 size={9} /> {eng.firm?.name} </p>
<ProgressBar status={eng.status} compact /> <div className="flex items-center justify-between mt-2"> <div className="flex items-center gap-1.5"> {eng._count?.findings ? ( <span className="ovds-caption">{eng._count.findings} finding(s)</span> ) : null} {overdue && <Badge label="Overdue" className="text-[10px] bg-rose-100 text-rose-6" />} </div> {canWrite && !isLastStep && ( <button onClick={() => onAdvance(eng.id)} disabled={advancing === eng.id} title={`Advance to ${ENGAGEMENT_LABELS[ENGAGEMENT_STEPS[ENGAGEMENT_STEPS.indexOf(step) + 1]]}`} className="p-1 rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-950/20 hover:bg-[var(--pro-azure-100)] dark:bg-green-900/30 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] disabled:opacity-50 transition-colors">
<ArrowRight size={11} /> </button> )} </div> </div> ); }) )} </div> </div> ); })} </div>);}

// -- Timeline View -------------------------------------------------------------
interface TimelineViewProps { engagements: AuditEngagement[] };
function TimelineView({ engagements }: TimelineViewProps) { const dated = engagements.filter((e) => e.startDate && e.endDate);
if (!dated.length) return ( <div className="ovds-empty text-sm"> No engagements with date ranges to display. </div> );
const allDates = dated.flatMap((e) => [new Date(e.startDate!), new Date(e.endDate!)]);
const minDate = new Date(Math.min(...allDates.map((d, _i) => d.getTime())));
const maxDate = new Date(Math.max(...allDates.map((d, _i) => d.getTime())));
const totalMs = maxDate.getTime() - minDate.getTime() || 1;
const pct = (d: string) => ((new Date(d).getTime() - minDate.getTime()) / totalMs) * 100;
const width = (s: string, e: string) => Math.max(1, ((new Date(e).getTime() - new Date(s).getTime()) / totalMs) * 100);
return ( <div className="ovds-widget-card p-5 overflow-x-auto"> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Engagement Timeline</p> {/* Date axis */} <div className="flex justify-between text-[10px] text-slate-400 mb-3 px-0"> <span>{fmtDate(minDate.toISOString())}</span> <span>{fmtDate(maxDate.toISOString())}</span> </div> <div className="space-y-2.5"> {dated.map((eng, _i) => ( <div key={eng.id} className="flex items-center gap-3"> <p className="text-xs text-slate-600 dark:text-slate-300 w-36 shrink-0 truncate" title={eng.title}> {eng.title} </p> <div className="flex-1 relative h-6"> <div className="absolute inset-y-0 w-full bg-white dark:bg-slate-700/30 rounded-full" /> <div className={`absolute inset-y-1 rounded-full ${ENGAGEMENT_DOT[eng.status]} opacity-80`} style={{ left: `${pct(eng.startDate!)}%`, width: `${width(eng.startDate!, eng.endDate!)}%` }} title={`${fmtDate(eng.startDate!)} → ${fmtDate(eng.endDate!)}`} /> {isOverdue(eng) && ( <div className="absolute right-0 inset-y-0 flex items-center">
<AlertTriangle size={10} className="text-rose-500" /> </div> )} </div>
<Badge label={ENGAGEMENT_LABELS[eng.status]} className={`text-[10px] shrink-0 ${ENGAGEMENT_COLORS[eng.status]}`} /> </div> ))} </div> {/* Today marker */} {Date.now() >= minDate.getTime() && Date.now() <= maxDate.getTime() && ( <div className="relative mt-1 ml-[calc(9rem+0.75rem)]"> <div className="absolute h-full border-l-2 border-dashed border-rose-400 opacity-60" style={{ left: `${pct(new Date().toISOString())}%`, top: '-100%', height: '100%' }} /> </div> )} </div> );}

// -- Main Page -----------------------------------------------------------------

// -- Audit Readiness Score -----------------------------------------------------
interface AuditReadinessScoreProps {
  stats: Stats | null;
  engagements: AuditEngagement[];
  firms: AuditFirm[];
}
function AuditReadinessScore({ stats, engagements, firms }: AuditReadinessScoreProps) { const activeFirms = firms.filter(f => f.status === 'ACTIVE').length;
const hasCompletedAudit = engagements.some(e => e.status === 'COMPLETED');
const hasCritical = (stats?.criticalFindings ?? 0) > 0;
const hasDocumented = engagements.some(e => e.reportSummary || e.referenceDocUrl);
const hasScope = engagements.some(e => e.scope);
const hasBudget = engagements.some(e => e.budget && e.budget > 0);
const factors = [ { label: 'Active audit firm registered', score: activeFirms > 0 ? 100 : 0, weight: 0.20, desc: activeFirms > 0 ? `${activeFirms} active firm(s)` : 'No active firms' }, { label: 'At least one completed audit', score: hasCompletedAudit ? 100 : 20, weight: 0.20, desc: hasCompletedAudit ? 'Completed audit on record' : 'No completed audits yet' }, { label: 'No critical unresolved findings', score: hasCritical ? 10 : 100, weight: 0.25, desc: hasCritical ? `${stats?.criticalFindings} critical finding(s) open` : 'No critical findings' }, { label: 'Audit reports documented', score: hasDocumented ? 100 : 30, weight: 0.15, desc: hasDocumented ? 'Reports on file' : 'No report summaries recorded' }, { label: 'Engagement scope defined', score: hasScope ? 100 : 40, weight: 0.10, desc: hasScope ? 'Scope documented' : 'Scope missing on engagements' }, { label: 'Budget tracking active', score: hasBudget ? 100 : 50, weight: 0.10, desc: hasBudget ? 'Budget recorded' : 'No budget data' }, ];
const weighted = factors.reduce((s, f) => s + f.score * f.weight, 0);
const grade = weighted >= 85 ? 'A' : weighted >= 70 ? 'B' : weighted >= 55 ? 'C' : 'D';
const gradeColor = weighted >= 85 ? 'text-[var(--pro-azure)]' : weighted >= 70 ? 'text-[var(--pro-azure)]' : weighted >= 55 ? 'text-amber-600' : 'text-rose-600';
const arcColor = weighted >= 85 ? '#00E784' : weighted >= 70 ? '#00E784' : weighted >= 55 ? '#f59e0b' : '#ef4444';
const r = 36;
const circ = 2 * Math.PI * r;
return ( <div className="ovds-widget-card p-5 space-y-4"> <div className="flex items-center justify-between"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Audit Readiness Score</p> <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ weighted >= 85 ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : weighted >= 70 ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : weighted >= 55 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700' }`}>Grade {grade}</span> </div> <div className="flex items-center gap-5"> {/* Ring */} <div className="relative w-24 h-24 shrink-0"> <svg width="96" height="96" className="-rotate-90 absolute inset-0"> <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" /> <circle cx="48" cy="48" r={r} fill="none" stroke={arcColor} strokeWidth="8" strokeDasharray={`${(weighted / 100) * circ} ${circ}`} strokeLinecap="round" /> </svg> <div className="absolute inset-0 flex flex-col items-center justify-center"> <span className={`text-xl font-semibold ${gradeColor}`}>{weighted.toFixed(0)}</span> <span className="ovds-caption">/ 100</span> </div> </div> {/* Factors */} <div className="flex-1 space-y-2"> {factors.map(f => ( <div key={f.label}> <div className="flex justify-between text-[10px] mb-0.5"> <span className="text-slate-500 truncate flex-1 mr-2">{f.label}</span> <span className={`font-bold shrink-0 ${f.score >= 80 ? 'text-[var(--pro-azure)]' : f.score >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>{f.score}/100</span> </div> <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"> <div className={`h-full rounded-full transition-all duration-700 ${f.score >= 80 ? 'bg-[var(--pro-azure-50)]0' : f.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${f.score}%` }} /> </div> </div> ))} </div> </div> {/* Action items */} {factors.filter(f => f.score < 80).length > 0 && ( <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5"> <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Action Items</p> {factors.filter(f => f.score < 80).map(f => ( <div key={f.label} className="flex items-start gap-2 text-xs"> <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" /> <span className="text-slate-600 dark:text-slate-300">{f.desc}</span> </div> ))} </div> )} </div> );}

// -- Audit Process Guide -------------------------------------------------------
const AuditProcessGuide: React.FC = () => { const [expanded, setExpanded] = useState<number | null>(null);
const steps = [ { num: 1, title: 'Initial Consultation', icon: <Users size={16} />, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', desc: 'Select an experienced audit firm. Outline your business needs and the scope of the audit to ensure alignment on expectations.', tips: ['Define audit objectives clearly', 'Verify firm credentials and industry experience', 'Agree on confidentiality and data security protocols'] }, { num: 2, title: 'Data Collection & Planning', icon: <FileText size={16} />, color: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300', desc: 'Auditors gather your financial data and review your systems. A plan is developed to ensure a smooth and thorough audit.', tips: ['Prepare all financial statements in advance', 'Ensure cloud software access is granted', 'Document internal controls and processes'] }, { num: 3, title: 'Fieldwork', icon: <CheckSquare size={16} />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', desc: 'Auditors conduct in-depth tests and interviews, reviewing documents and assessing the accuracy of your financial statements.', tips: ['Assign an internal liaison for auditor queries', 'Respond to information requests within 48 hours', 'Track all findings as they are raised'] }, { num: 4, title: 'Reporting', icon: <FileCheck size={16} />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', desc: 'Auditors provide a detailed report with findings and an independent opinion on your financial statements.', tips: ['Review the draft report before finalisation', 'Discuss all findings with the audit team', 'Prepare management responses for each finding'] }, { num: 5, title: 'Follow-up & Remediation', icon: <CheckCircle2 size={16} />, color: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300', desc: 'Auditors offer recommendations to improve financial processes and controls. Track all open findings to closure.', tips: ['Assign owners to every open finding', 'Set 30-day remediation targets', 'Schedule a follow-up review within 90 days'] }, ];
return ( <div className="ovds-widget-card overflow-hidden"> <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Audit Outsourcing Process Guide</p> <p className="text-xs text-slate-500 mt-0.5">5-step framework for managing external audit engagements</p> </div> <div className="divide-y divide-slate-100 dark:divide-slate-700"> {steps.map(s => ( <div key={s.num}> <button onClick={() => setExpanded(expanded === s.num ? null : s.num)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"> <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</span> <div className="flex-1 min-w-0"> <div className="flex items-center gap-2"> <span className="text-[10px] font-semibold text-slate-400">STEP {s.num}</span> <span className="text-sm font-bold text-slate-700 dark:text-white">{s.title}</span> </div> <p className="text-xs text-slate-500 truncate">{s.desc}</p> </div> {expanded === s.num ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />} </button> {expanded === s.num && ( <div className="px-5 pb-4 pt-1 bg-slate-50/50 dark:bg-slate-700/20"> <div className="space-y-1.5 pl-10"> {s.tips.map((tip, i) => ( <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
<CheckCircle2 size={12} className="text-[var(--pro-azure)] mt-0.5 shrink-0" /> {tip} </div> ))} </div> </div> )} </div> ))} </div> </div> );}

// -- Audit Benefits Panel ------------------------------------------------------
const AuditBenefitsPanel: React.FC = () => { const benefits = [ { icon: <DollarSign size={15} />, title: 'Cost Savings', desc: 'Eliminate in-house audit team costs — salaries, training, and infrastructure.', color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-900/20' }, { icon: <Award size={15} />, title: 'Access to Expertise', desc: 'Specialized industry knowledge and up-to-date regulatory compliance.', color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-900/20' }, { icon: <ShieldAlert size={15} />,title: 'Improved Compliance', desc: 'Objective review minimizes risk of penalties and identifies non-compliance early.', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' }, { icon: <Zap size={15} />, title: 'Efficiency Gains', desc: 'Faster audits free your internal team to focus on core business functions.', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' }, { icon: <TrendingUp size={15} />, title: 'Scalability', desc: 'Audit services scale with your business without internal restructuring.', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20' }, ];
const challenges = [ { title: 'Communication Gaps', desc: 'Set clear expectations and maintain regular check-ins to avoid delays.' }, { title: 'Goal Misalignment', desc: 'Ensure your audit partner understands your business priorities.' }, { title: 'Resistance to Outsourcing', desc: 'Highlight cost savings and expertise to ease internal concerns.' }, { title: 'Firm Dependency', desc: 'Choose a firm with proven sector experience for consistent support.' }, ];
return ( <div className="space-y-4"> <div className="ovds-widget-card p-5 space-y-3"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Key Benefits of Outsourcing</p> <div className="ovds-grid-layout cols-3"> {benefits.map(b => ( <div key={b.title} className={`flex items-start gap-3 p-3 rounded-xl ${b.color}`}> <span className="shrink-0 mt-0.5">{b.icon}</span> <div> <div className="text-xs font-bold mb-0.5">{b.title}</div> <div className="text-[11px] opacity-80">{b.desc}</div> </div> </div> ))} </div> </div> <div className="ovds-widget-card p-5 space-y-3"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Common Challenges & How to Address Them</p> <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> {challenges.map(c => ( <div key={c.title} className="flex items-start gap-2.5 p-3 bg-white dark:bg-slate-700/40 rounded-xl">
<AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" /> <div> <div className="text-xs font-bold text-slate-700 dark:text-white mb-0.5">{c.title}</div> <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.desc}</div> </div> </div> ))} </div> </div> <div className="bg-gradient-to-r from-[var(--pro-azure)]/5 to-violet-50/50 dark:from-[var(--pro-azure)]/10 dark:to-violet-900/10 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl p-5"> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Ethiopian Market Context</p> <div className="ovds-grid-layout cols-3 text-center"> {[ { value: '8.8%', label: 'Projected market growth 2025–2030', sub: 'Ethiopia MoF — Grand View Research' }, { value: '$18.6B', label: 'Global audit outsourcing market by 2033', sub: 'Data Horizon Research' }, { value: '500K+', label: 'Ethiopian businesses needing compliance', sub: 'Registered businesses' }, ].map(s => ( <div key={s.value} className="space-y-1"> <div className="text-2xl font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{s.value}</div> <div className="text-xs font-semibold text-slate-700 dark:text-white">{s.label}</div> <div className="ovds-caption">{s.sub}</div> </div> ))} </div> </div> </div> );}

// -- Audit Risk Matrix ---------------------------------------------------------
interface AuditRiskMatrixProps { engagements: AuditEngagement[] };
function AuditRiskMatrix({ engagements }: AuditRiskMatrixProps) { const risks = [ { label: 'Financial Misstatement', likelihood: 'Medium', impact: 'High', mitigation: 'Substantive testing, analytical procedures, management representation letters' }, { label: 'Fraud & Irregularities', likelihood: 'Low', impact: 'Critical', mitigation: 'ISA 240 procedures, fraud risk assessment, whistleblower channels' }, { label: 'Going Concern', likelihood: 'Low', impact: 'High', mitigation: 'Cash flow analysis, covenant review, management plans assessment' }, { label: 'Related Party Transactions', likelihood: 'Medium', impact: 'Medium', mitigation: 'Disclosure review, arm\'s length verification, board approval checks' }, { label: 'IT & Cybersecurity', likelihood: 'High', impact: 'High', mitigation: 'IT general controls testing, penetration test review, data integrity checks' }, { label: 'Regulatory Non-Compliance', likelihood: 'Medium', impact: 'High', mitigation: 'VAT/BIT filing review, ERCA correspondence, legal counsel confirmation' }, { label: 'Auditor Independence', likelihood: 'Low', impact: 'Critical', mitigation: 'Independence declaration, rotation policy, non-audit services restriction' }, { label: 'Estimation Uncertainty', likelihood: 'High', impact: 'Medium', mitigation: 'Specialist engagement, sensitivity analysis, management bias assessment' }, ];
const LIKELIHOOD_CLR: Record<string, string> = { Low: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300', Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' };
const IMPACT_CLR: Record<string, string> = { Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', Critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' }; // Live risk from open critical findings 
const criticalCount = engagements.reduce((s, e) => s + (e._count?.findings ?? 0), 0);
return ( <div className="ovds-widget-card overflow-hidden"> <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between"> <div className="flex items-center gap-3">
<ShieldAlert size={16} className="text-rose-500" /> <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Audit Risk Matrix</p> </div> {criticalCount > 0 && ( <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"> {criticalCount} open finding(s) </span> )} </div> <div className="overflow-x-auto"> <table className="w-full text-xs ovds-table"> <thead> <tr className="bg-white dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700"> <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Risk Area</th> <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Likelihood</th> <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Impact</th> <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Mitigation</th> </tr> </thead> <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40"> {risks.map(r => ( <tr key={r.label} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"> <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{r.label}</td> <td className="px-4 py-2.5 text-center"> <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LIKELIHOOD_CLR[r.likelihood]}`}>{r.likelihood}</span> </td> <td className="px-4 py-2.5 text-center"> <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${IMPACT_CLR[r.impact]}`}>{r.impact}</span> </td> <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">{r.mitigation}</td> </tr> ))} </tbody> </table> </div> </div> );}

// -- Case Studies Panel --------------------------------------------------------
const CaseStudiesPanel: React.FC = () => { const [active, setActive] = useState<string | null>(null);
const cases = [ { id: 'enron', type: 'failure', title: 'Enron / Arthur Andersen (2001)', outcome: 'Collapse of both company and auditor', lesson: 'Auditor independence failure — Arthur Andersen provided both audit and consulting services, creating a conflict of interest. Led to the Sarbanes-Oxley Act (SOX) 2002.', impact: 'SOX mandated auditor independence, CEO/CFO certification of financials, and PCAOB creation.', color: 'border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' }, { id: 'worldcom', type: 'failure', title: 'WorldCom / KPMG (2002)', outcome: 'USD 11B accounting fraud undetected', lesson: 'Auditors failed to detect capitalization of operating expenses. Highlighted need for professional skepticism and substantive testing of management estimates.', impact: 'Reinforced SOX requirements for internal control assessment (Section 404).', color: 'border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' }, { id: 'wirecard', type: 'failure', title: 'Wirecard / EY (2020)', outcome: 'EUR 1.9B missing from balance sheet', lesson: 'EY failed to verify bank balances for 3 years. Demonstrated need for direct confirmation with third parties and skepticism of management-provided evidence.', impact: 'EU audit reform accelerated; mandatory firm rotation and joint audits discussed.', color: 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }, { id: 'apple', type: 'success', title: 'Apple Inc. — Effective Audit Committee', outcome: 'Consistent unqualified opinions, strong governance', lesson: 'Apple\'s audit committee meets quarterly, reviews all related-party transactions, and maintains strict auditor independence policies. Demonstrates best-practice corporate governance.', impact: 'Model for audit committee effectiveness — independent members, financial expertise, regular private sessions with auditors.', color: 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)] dark:bg-green-900/10 dark:border-green-800', badge: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300' }, { id: 'ethiopian', type: 'context', title: 'Ethiopian Context — ERCA Audit Requirements', outcome: 'Mandatory for companies > ETB 500K revenue', lesson: 'ERCA requires audited financial statements for BIT filing. Auditors must verify VAT returns match financial statements. Discrepancies trigger ERCA audit investigations.', impact: 'Companies with unaudited accounts face penalties and cannot access government contracts or bank financing.', color: 'border-[var(--pro-azure-100)] bg-[var(--pro-azure-50)] dark:bg-green-900/10 dark:border-green-800', badge: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300' }, ];
return ( <div className="ovds-widget-card overflow-hidden"> <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"> <div className="flex items-center gap-3">
<FileText size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Case Studies — Auditor Impact on Corporate Governance</p> </div> <p className="ovds-caption mt-0.5 ml-7">Lessons from audit failures and successes · Source: PDF Research</p> </div> <div className="divide-y divide-slate-100 dark:divide-slate-700"> {cases.map(c => ( <div key={c.id} className={`border-l-4 ${c.color}`}> <button onClick={() => setActive(active === c.id ? null : c.id)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors text-left"> <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${c.badge}`}> {c.type === 'failure' ? 'FAILURE' : c.type === 'success' ? 'SUCCESS' : 'CONTEXT'} </span> <div className="flex-1 min-w-0"> <div className="text-sm font-bold text-slate-700 dark:text-white">{c.title}</div> <div className="text-[10px] text-slate-400 truncate">{c.outcome}</div> </div> {active === c.id ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />} </button> {active === c.id && ( <div className="px-5 pb-4 pt-1 space-y-2"> <div className="flex items-start gap-2 text-xs"> <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0 w-16">Lesson:</span> <span className="text-slate-500 dark:text-slate-400">{c.lesson}</span> </div> <div className="flex items-start gap-2 text-xs"> <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0 w-16">Impact:</span> <span className="text-slate-500 dark:text-slate-400">{c.impact}</span> </div> </div> )} </div> ))} </div> </div> );}

// -- External Auditor Framework (from PDF research) ---------------------------
const ExternalAuditorFramework: React.FC = () => { const [activeSection, setActiveSection] = useState<string | null>(null);
const sections = [ { id: 'legal', title: 'Legal Standards Governing External Auditors', icon: <ShieldAlert size={15} />, color: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 border-[var(--pro-azure-100)] dark:border-green-800', headerColor: 'text-[var(--pro-azure-dark)] dark:text-green-300', items: [ { label: 'PCAOB (Public Company Accounting Oversight Board)', desc: 'Sets auditing standards for public companies. Requires auditor independence, quality control, and inspection programs.' }, { label: 'IFRS / IAASB Standards', desc: 'International Standards on Auditing (ISAs) govern audit procedures globally. ISA 240 covers fraud detection; ISA 700 covers audit opinions.' }, { label: 'AICPA Standards (US)', desc: 'Generally Accepted Auditing Standards (GAAS) — fieldwork, reporting, and general standards for audit quality.' }, { label: 'FRC (UK Financial Reporting Council)', desc: 'Regulates auditors, accountants, and actuaries. Issues UK Corporate Governance Code requiring audit committee oversight.' }, { label: 'Ethiopian Context', desc: 'ERCA requires audited financial statements for companies above ETB 500K revenue. Proclamation No. 979/2016 mandates annual BIT filing with audited accounts.' }, ] }, { id: 'compliance', title: 'Compliance Responsibilities', icon: <CheckCircle2 size={15} />, color: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20 border-[var(--pro-azure-100)] dark:border-green-800', headerColor: 'text-[var(--pro-azure-dark)] dark:text-green-300', items: [ { label: 'Financial Statement Audits', desc: 'Verify accuracy and transparency of financial statements. Auditors issue an opinion: unqualified, qualified, adverse, or disclaimer.' }, { label: 'Fraud Detection & Reporting', desc: 'Auditors must assess fraud risk (ISA 240). Material misstatements due to fraud must be reported to management and, where required, to regulators.' }, { label: 'Internal Control Evaluation', desc: 'Assess effectiveness of internal controls over financial reporting. Weaknesses must be communicated to the audit committee.' }, { label: 'Tax Compliance Verification', desc: 'Verify that tax obligations (VAT, BIT, WHT) are correctly calculated, recorded, and filed. Cross-reference VAT returns with financial statements.' }, { label: 'Regulatory Compliance Checks', desc: 'Ensure adherence to applicable laws — company law, sector regulations, anti-money laundering, and data protection requirements.' }, ] }, { id: 'transparency', title: 'Enhancing Transparency in Financial Reporting', icon: <FileText size={15} />, color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800', headerColor: 'text-violet-700 dark:text-violet-300', items: [ { label: 'Independent Audit Opinion', desc: 'An unqualified opinion signals that financial statements present a true and fair view, building stakeholder trust and investor confidence.' }, { label: 'Audit Committee Oversight', desc: 'The audit committee (board sub-committee) oversees the external auditor relationship, reviews audit findings, and ensures auditor independence.' }, { label: 'Management Letter', desc: 'Auditors issue a management letter identifying control weaknesses and operational risks — a key governance tool beyond the formal audit report.' }, { label: 'Going Concern Assessment', desc: 'Auditors must evaluate whether the entity can continue operating for 12 months. A going concern doubt must be disclosed in the audit report.' }, { label: 'Related Party Disclosures', desc: 'Auditors verify that all related-party transactions are properly disclosed and conducted at arm\'s length to prevent conflicts of interest.' }, ] }, { id: 'ethics', title: 'Legal & Ethical Considerations', icon: <Award size={15} />, color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', headerColor: 'text-amber-700 dark:text-amber-300', items: [ { label: 'Auditor Independence', desc: 'Fundamental principle. Auditors must be independent in fact and appearance. Prohibited: financial interests, family relationships, non-audit services that impair independence.' }, { label: 'Professional Skepticism', desc: 'Auditors must maintain a questioning mind and critically assess audit evidence. Cannot simply accept management representations without corroboration.' }, { label: 'Legal Liability', desc: 'Auditors face civil liability for negligence (failure to detect material misstatements). Criminal liability possible for fraud or willful misconduct.' }, { label: 'Confidentiality', desc: 'Client information is confidential. Exceptions: legal obligation to report (e.g., money laundering), court orders, or professional body requirements.' }, { label: 'Rotation Requirements', desc: 'Many jurisdictions require mandatory audit firm rotation (e.g., every 10 years in EU) to preserve independence and prevent over-familiarity.' }, ] }, { id: 'challenges', title: 'Challenges Faced by External Auditors', icon: <AlertTriangle size={15} />, color: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800', headerColor: 'text-rose-700 dark:text-rose-300', items: [ { label: 'Client Pressure & Intimidation', desc: 'Management may pressure auditors to issue favorable opinions. Auditors must resist and escalate to the audit committee if necessary.' }, { label: 'Complex Financial Instruments', desc: 'Derivatives, SPVs, and off-balance-sheet arrangements require specialized expertise. Auditors must engage valuation specialists when needed.' }, { label: 'Cross-Border & Group Audits', desc: 'Multinational audits require coordination across jurisdictions with different standards. Component auditors must be properly supervised.' }, { label: 'Technology & Cybersecurity', desc: 'Auditors must assess IT general controls and cybersecurity risks. Increasingly, AI and data analytics are used in audit procedures.' }, { label: 'Expectation Gap', desc: 'Public expects auditors to detect all fraud; auditors provide reasonable (not absolute) assurance. Closing this gap requires better communication.' }, ] }, { id: 'future', title: 'Future of External Auditing', icon: <TrendingUp size={15} />, color: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800', headerColor: 'text-cyan-700 dark:text-cyan-300', items: [ { label: 'AI & Data Analytics', desc: 'Continuous auditing using AI can analyze 100% of transactions rather than samples. Anomaly detection improves fraud identification significantly.' }, { label: 'ESG & Sustainability Reporting', desc: 'Auditors increasingly assure ESG disclosures. ISSB standards (IFRS S1/S2) are creating a global baseline for sustainability audit.' }, { label: 'Real-Time Reporting', desc: 'Blockchain and distributed ledgers enable real-time transaction verification, potentially shifting auditing from periodic to continuous.' }, { label: 'Emerging Regulatory Standards', desc: 'EU Corporate Sustainability Reporting Directive (CSRD), SEC climate disclosure rules, and IESBA ethics code updates are reshaping audit scope.' }, { label: 'Audit Quality Indicators (AQIs)', desc: 'Regulators are developing AQIs to measure audit quality beyond pass/fail — including partner time, staff experience, and restatement rates.' }, ] }, ];
return ( <div className="ovds-widget-card overflow-hidden"> <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/30"> <div className="flex items-center gap-3"> <div className="w-8 h-8 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/20 flex items-center justify-center">
<BookOpen size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> </div> <div> <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">External Auditors in Corporate Governance</p> <p className="ovds-caption">Legal Standards, Compliance & Transparency — Research Framework</p> </div> </div> </div> <div className="divide-y divide-slate-100 dark:divide-slate-700"> {sections.map(s => ( <div key={s.id}> <button onClick={() => setActiveSection(activeSection === s.id ? null : s.id)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left"> <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${s.color} ${s.headerColor}`}>{s.icon}</span> <span className={`flex-1 text-sm font-bold ${s.headerColor}`}>{s.title}</span> <span className="text-[10px] text-slate-400 shrink-0">{s.items.length} items</span> {activeSection === s.id ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />} </button> {activeSection === s.id && ( <div className={`px-5 pb-4 pt-1 ${s.color} border-t border-current/10`}> <div className="space-y-2.5 pl-10"> {s.items.map((item, i) => ( <div key={i} className="flex items-start gap-2.5"> <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${s.headerColor.replace('text-', 'bg-')}`} /> <div> <span className={`text-xs font-bold ${s.headerColor}`}>{item.label}: </span> <span className="text-xs text-slate-600 dark:text-slate-300">{item.desc}</span> </div> </div> ))} </div> </div> )} </div> ))} </div> <div className="px-5 py-3 bg-white dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400"> Source: "The Role of External Auditors in Corporate Governance: Legal Standards, Compliance, and Enhancing Transparency in Financial Reporting" · PCAOB · IFRS · AICPA · FRC </div> </div> );}

// -- Readiness Tab -------------------------------------------------------------
interface ReadinessTabProps {
  stats: Stats | null;
  engagements: AuditEngagement[];
  firms: AuditFirm[];
  loading: boolean;
}
function ReadinessTab({ stats, engagements, firms, loading }: ReadinessTabProps) { if (loading) return <Skeleton.StatsRow count={4} />;
const openFindings = stats?.openFindings ?? 0;
const criticalFindings = stats?.criticalFindings ?? 0;
const completionRate = stats?.totalEngagements ? Math.round((stats.completed / stats.totalEngagements) * 100) : 0;
return ( <div className="space-y-4"> {/* Quick metrics */} <div className="ovds-grid-layout cols-4 gap-sm"> {[ { label: 'Completion Rate', value: `${completionRate}%`, color: completionRate >= 70 ? 'text-[var(--pro-azure)]' : 'text-amber-600', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20' }, { label: 'Open Findings', value: openFindings, color: openFindings === 0 ? 'text-[var(--pro-azure)]' : 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' }, { label: 'Critical Findings', value: criticalFindings, color: criticalFindings === 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' }, { label: 'Active Firms', value: firms.filter(f => f.status === 'ACTIVE').length, color: 'text-[var(--pro-azure)]', bg: 'bg-[var(--pro-azure-50)] dark:bg-green-900/20' }, ].map(m => ( <div key={m.label} className={`${m.bg} rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700`}> <div className={`text-2xl font-semibold ${m.color}`}>{m.value}</div> <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">{m.label}</div> </div> ))} </div> <div className="ovds-grid-layout cols-2">
<AuditReadinessScore stats={stats} engagements={engagements} firms={firms} />
<AuditProcessGuide /> </div>
<AuditBenefitsPanel /> <div className="ovds-grid-layout cols-2">
<AuditRiskMatrix engagements={engagements} />
<CaseStudiesPanel /> </div>
<ExternalAuditorFramework /> </div> );}

// -- Main Component ------------------------------------------------------------
const AuditOutsourcing: React.FC = () => { const { selectedCompanyId } = useBusiness();
const { t } = useTranslation();
usePageTitle('Audit Outsourcing & Internal Audit');
const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'OVDS' || user?.role === 'AUDITOR' || user?.role === 'EXTERNAL_AUDITOR';
const isAdmin = user?.role === 'ADMIN';
const [tab, setTab] = useState<TabType>('engagements');
const [viewMode, _setViewMode] = useLocalStorage<ViewMode>( 'audit_view_mode', 'list', );
const [showTimeline, _setShowTimeline] = useLocalStorage<boolean>( 'audit_show_timeline', false, );
const { touch, label: _refreshLabel } = useLastRefreshed();
const [stats, setStats] = useState<Stats | null>(null);
const [analytics, setAnalytics] = useState<Analytics | null>(null);
const [firms, setFirms] = useState<AuditFirm[]>([]);
const [engagements, setEngagements] = useState<AuditEngagement[]>([]);
const [loading, setLoading] = useState(true);
const [rawSearch, setRawSearch] = useState('');
const search = useDebounce(rawSearch, 250);
const searchRef = useRef<HTMLInputElement>(null);
const [statusFilter, setStatusFilter] = useState<EngagementStatus | 'ALL'>( 'ALL', );
const [showOverdueOnly, setShowOverdueOnly] = useState(false);
const [firmModal, setFirmModal] = useState(false);
const [editFirm, setEditFirm] = useState<AuditFirm | null>(null);
const [firmDrawer, setFirmDrawer] = useState<AuditFirm | null>(null);
const [engModal, setEngModal] = useState(false);
const [editEng, setEditEng] = useState<AuditEngagement | null>(null);
const [findingsEng, setFindingsEng] = useState<AuditEngagement | null>(null);
const [commentsEng, setCommentsEng] = useState<AuditEngagement | null>(null);
const [advancing, setAdvancing] = useState<string | null>(null);
const [duplicating, setDuplicating] = useState<string | null>(null);
const [_exporting, setExporting] = useState(false);
const [showChecklist, setShowChecklist] = useState(false);
const [showShortcuts, setShowShortcuts] = useState(false);
const [attachmentData, setAttachmentData] = useState<{ id: string;
type: 'AuditEngagement' | 'AuditFinding'; title: string; } | null>(null);
const [detailEng, setDetailEng] = useState<AuditEngagement | null>(null);
const anyModalOpen = firmModal || !!firmDrawer || engModal || !!findingsEng || !!commentsEng || showChecklist || showShortcuts || !!detailEng;
const load = useCallback(async () => { setLoading(true);
try { const [statsRes, firmsRes, engsRes, analyticsRes] = await Promise.all([ api.get('/audit-outsourcing/stats'), api.get('/audit-outsourcing/firms'), api.get('/audit-outsourcing/engagements'), api.get('/audit-outsourcing/analytics'), ]); setStats(statsRes.data?.data ?? statsRes.data); const _firms = firmsRes.data?.data ?? firmsRes.data; setFirms(Array.isArray(_firms) ? _firms : []); const _engs = engsRes.data?.data ?? engsRes.data; setEngagements(Array.isArray(_engs) ? _engs : []); setAnalytics(analyticsRes.data?.data ?? analyticsRes.data); touch(); }
catch { toast.error('Failed to load audit data'); }
finally { setLoading(false); } }, [touch]);
useEffect(() => { load(); }, [load]);
// Keyboard shortcuts
useKeyboardShortcut({ key: 'n', handler: () => { if (anyModalOpen) return; if (tab === 'firms') { setEditFirm(null); setFirmModal(true); } else { setEditEng(null); setEngModal(true); } }});
useKeyboardShortcut({ key: 'r', handler: () => { if (!anyModalOpen) load(); } }); useKeyboardShortcut({ key: 'e', handler: () => { if (!anyModalOpen && tab === 'engagements') exportEngagements(); } }); useKeyboardShortcut({ key: '/', handler: () => { searchRef.current?.focus(); }, ignoreInputs: false }); useKeyboardShortcut({ key: '?', handler: () => { if (!anyModalOpen) setShowShortcuts(true); } });
const deleteFirm = async (id: string) => { if (!await confirm({ title: 'Delete Firm', message: 'Delete this audit firm? All engagements will be removed.', variant: 'danger' })) return;
try { await api.delete(`/audit-outsourcing/firms/${id}`);
toast.success('Firm deleted'); load(); }
catch { toast.error('Failed to delete firm'); } };
const deleteEngagement = async (id: string) => { if (!await confirm({ title: 'Delete Engagement', message: 'Delete this engagement?', variant: 'danger' })) return;
try { await api.delete(`/audit-outsourcing/engagements/${id}`);
toast.success('Engagement deleted'); load(); }
catch { toast.error('Failed to delete engagement'); } };
const advanceEngagement = async (id: string) => { setAdvancing(id);
try { const res = await api.patch(`/audit-outsourcing/engagements/${id}/advance`); setEngagements((prev) => prev.map((e, _i) => e.id === id ? { ...e, status: res.data.status } : e));
toast.success(`Advanced to ${ENGAGEMENT_LABELS[res.data.status as EngagementStatus]}`); }
catch { toast.error('Failed to advance status'); }
finally { setAdvancing(null); } };
const duplicateEngagement = async (id: string) => { setDuplicating(id);
try { const res = await api.post(`/audit-outsourcing/engagements/${id}/duplicate`); setEngagements((prev) => [res.data, ...prev]);
toast.success('Engagement duplicated'); }
catch { toast.error('Failed to duplicate'); }
finally { setDuplicating(null); } };
const exportEngagements = async () => { setExporting(true);
try { const res = await api.get('/audit-outsourcing/engagements/export', { responseType: 'text' }); downloadCSV(res.data, 'audit-engagements.csv');
toast.success('Exported'); }
catch { toast.error('Export failed'); }
finally { setExporting(false); } };
const _exportFirms = async () => { try { const res = await api.get('/audit-outsourcing/firms/export', { responseType: 'text' }); downloadCSV(res.data, 'audit-firms.csv');
toast.success('Firms exported'); }
catch { toast.error('Export failed'); } };
const filteredFirms = useMemo(() => firms.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.contactPerson?.toLowerCase().includes(search.toLowerCase()) || f.industry?.toLowerCase().includes(search.toLowerCase()) ), [firms, search]);
const filteredEngagements = useMemo(() => engagements.filter((e) => { if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.firm?.name.toLowerCase().includes(search.toLowerCase())) return false;
if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
if (showOverdueOnly && !isOverdue(e)) return false;
return true; }), [engagements, search, statusFilter, showOverdueOnly]);
const _overdueCount = useMemo(() => engagements.filter(isOverdue).length, [engagements]);
const _completionRate2 = stats?.totalEngagements ? Math.round((stats.completed / stats.totalEngagements) * 100) : 0;
return (
    <AppPage
      title="Audit Outsourcing & Internal Audit"
      subtitle="Manage audit firms, engagements, and findings"
      icon={<ClipboardList size={16} />}
      iconBg="bg-violet-500"
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChecklist(true)} className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <BookOpen size={13} /> Checklist
          </button>
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
            <RefreshCw size={14} />
          </button>
          {canWrite && (
            <button onClick={() => tab === 'firms' ? (setEditFirm(null), setFirmModal(true)) : (setEditEng(null), setEngModal(true))}
              className="flex items-center gap-2 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-xs font-bold transition-colors">
              <Plus size={13} /> {tab === 'firms' ? 'Add Firm' : 'New Engagement'}
            </button>
          )}
        </div>
      }
    >
      <div className="bg-gradient-to-r from-slate-50 to-violet-50 dark:from-slate-900 dark:to-violet-950/30 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider shrink-0">Audit Chain</span>
        {['Consultation', 'Planning', 'Fieldwork', 'Reporting', 'Follow-up', 'Completed'].map((step, i, arr) => (
          <React.Fragment key={step}>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">{step}</span>
            {i < arr.length - 1 && <span className="text-slate-300 dark:text-slate-600 text-xs">→</span>}
          </React.Fragment>
        ))}
        <span className="ml-auto text-[9px] font-bold text-violet-500 dark:text-violet-400 hidden sm:block">ERCA audit-ready · Findings tracked · PDF cert</span>
      </div>
      {/* Tab + filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['engagements', 'firms', 'analytics', 'readiness'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${tab === t ? 'bg-white dark:bg-slate-700 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
        {tab === 'engagements' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="ALL">All Statuses</option>
            {ENGAGEMENT_STEPS.map(s => <option key={s} value={s}>{ENGAGEMENT_LABELS[s]}</option>)}
          </select>
        )}
        <div className="flex-1 min-w-48">
          <input value={rawSearch} onChange={e => setRawSearch(e.target.value)} placeholder="Search engagements, firms…"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20" />
        </div>
      </div>
      <div className="ovds-widget-card overflow-hidden shadow-sm">
        {/* Engagement status split bar */}
        {!loading && (stats?.totalEngagements ?? 0) > 0 && (
          <div className="flex h-1.5">
            <div className="bg-[var(--pro-azure-50)]0 transition-all duration-700" style={{ width: `${Math.round(((stats?.completed ?? 0) / (stats?.totalEngagements ?? 1)) * 100)}%` }} />
            <div className="bg-amber-400 transition-all duration-700" style={{ width: `${Math.round(((stats?.active ?? 0) / (stats?.totalEngagements ?? 1)) * 100)}%` }} />
            <div className="bg-rose-400 transition-all duration-700" style={{ width: `${Math.round(((stats?.criticalFindings ?? 0) / Math.max(stats?.totalEngagements ?? 1, 1)) * 10)}%` }} />
            <div className="bg-slate-200 dark:bg-slate-700 flex-1" />
          </div>
        )}
        {loading ? (
          <div className="p-4"><Skeleton.StatsRow count={6} /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Audit Firms',       value: stats?.firms ?? 0,             color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' },
              { label: 'Engagements',       value: stats?.totalEngagements ?? 0,  color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Active',            value: stats?.active ?? 0,            color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Completed',         value: stats?.completed ?? 0,         color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' },
              { label: 'Open Findings',     value: stats?.openFindings ?? 0,      color: (stats?.openFindings ?? 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400' },
              { label: 'Critical',          value: stats?.criticalFindings ?? 0,  color: (stats?.criticalFindings ?? 0) > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400' },
            ].map(s => (
              <div key={s.label} className="p-3">
                <div className={`flex items-center gap-1 ${s.color} mb-1`}>
                  <span className="text-[10px] font-medium uppercase tracking-wider">{s.label}</span>
                </div>
                <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {!loading && ((stats?.overdue ?? 0) > 0 || (stats?.criticalFindings ?? 0) > 0) && (<div className="flex items-center gap-3 flex-wrap p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
<ShieldAlert size={15} className="text-rose-500 shrink-0" /><div className="flex items-center gap-4 flex-wrap text-xs">{(stats?.overdue ?? 0) > 0 && <span className="font-bold text-rose-700 dark:text-rose-300">{stats!.overdue} overdue</span>}{(stats?.criticalFindings ?? 0) > 0 && <span className="font-bold text-rose-700 dark:text-rose-300">{stats!.criticalFindings} critical findings</span>}</div><button onClick={() => { setShowOverdueOnly(true); setTab("engagements"); }} className="ml-auto text-xs font-bold text-rose-600 hover:underline">View overdue →</button></div>)}
      {tab === "engagements" && showTimeline && !loading && <TimelineView engagements={filteredEngagements} />}
      {tab === "firms" && (<div className="ovds-grid-layout cols-3">{loading ? Array.from({ length: 3 }).map((_, i) =>
<Skeleton.Card key={i} />) : filteredFirms.length === 0 ? (<div className="col-span-full flex flex-col items-center py-20 gap-3 text-slate-400">
<Building2 size={40} className="opacity-20" /><p className="text-sm">No audit firms yet.{canWrite && " Add one to get started."}</p></div>) : filteredFirms.map((firm) => (<div key={firm.id} className="ovds-widget-card p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setFirmDrawer(firm)}><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-3 flex-1 min-w-0"><div className="w-9 h-9 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/20 flex items-center justify-center text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold shrink-0">{firm.name[0]}</div><div className="min-w-0"><p className="font-semibold text-slate-800 dark:text-white truncate">{firm.name}</p>{firm.industry && <p className="text-xs text-slate-500 truncate">{firm.industry}</p>}{(firm.rating ?? 0) > 0 && <StarRating value={firm.rating ?? 0} readonly />}</div></div><div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
<Badge label={firm.status} className={firm.status === "ACTIVE" ? "bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]" : "bg-slate-100 text-slate-500"} />{canWrite && <button onClick={() => { setEditFirm(firm); setFirmModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<Edit2 size={13} /></button>}{isAdmin && <button onClick={() => deleteFirm(firm.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
<Trash2 size={13} /></button>}</div></div><div className="text-xs text-slate-500 space-y-1">{firm.contactPerson && <div className="flex items-center gap-1.5">
<Users size={11} /> {firm.contactPerson}</div>}{firm.email && <div className="flex items-center gap-1.5">
<Mail size={11} /> {firm.email}</div>}{firm.phone && <div className="flex items-center gap-1.5">
<Phone size={11} /> {firm.phone}</div>}</div><div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-700"><span className="text-xs text-slate-400">{firm._count?.engagements ?? 0} engagement(s)</span><span className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">View details <ChevronRight size={12} /></span></div></div>))}</div>)}
      {tab === "engagements" && viewMode === "board" && !loading && (<KanbanBoard engagements={filteredEngagements} canWrite={canWrite} isAdmin={isAdmin} advancing={advancing} onAdvance={advanceEngagement} onEdit={(eng) => { setEditEng(eng); setEngModal(true); }} onDelete={deleteEngagement} onFindings={setFindingsEng} onAttachments={(eng) => setAttachmentData({ id: eng.id, type: "AuditEngagement", title: `Engagement: ${eng.title}` })} onCertificate={downloadComplianceCertificate} />)}
      {tab === "engagements" && viewMode === "list" && (<div className="space-y-3">{loading ? Array.from({ length: 4 }).map((_, i) =>
<Skeleton.Card key={i} />) : filteredEngagements.length === 0 ? (<div className="flex flex-col items-center py-20 gap-3 text-slate-400">
<FileText size={40} className="opacity-20" /><p className="text-sm">{engagements.length === 0 ? `No engagements yet.${canWrite ? " Create one to start tracking an audit." : ""}` : "No engagements match the current filters."}</p>{engagements.length === 0 && canWrite && <p className="text-xs text-slate-300 dark:text-slate-600">Press N to create one</p>}</div>) : filteredEngagements.map((eng) => { const overdue = isOverdue(eng);
const days = eng.endDate ? daysLeft(eng.endDate) : null;
const isLast = eng.status === "COMPLETED";
const nextStep = !isLast ? ENGAGEMENT_STEPS[ENGAGEMENT_STEPS.indexOf(eng.status) + 1] : null;
return (<EngagementCard key={eng.id} eng={eng} overdue={overdue} days={days} isLast={isLast} nextStep={nextStep} canWrite={canWrite} isAdmin={isAdmin} advancing={advancing} duplicating={duplicating} onAdvance={advanceEngagement} onDuplicate={duplicateEngagement} onEdit={() => { setEditEng(eng); setEngModal(true); }} onDelete={() => deleteEngagement(eng.id)} onFindings={() => setFindingsEng(eng)} onComments={() => setCommentsEng(eng)} onPrint={() => downloadEngagementPdf(eng)} onAttachments={() => setAttachmentData({ id: eng.id, type: "AuditEngagement", title: `Engagement: ${eng.title}` })} onCertificate={() => downloadComplianceCertificate(eng)} onDetail={() => setDetailEng(eng)} />); })}</div>)}
      {tab === "analytics" && <AnalyticsPanel analytics={analytics} loading={loading} engagements={engagements} firms={firms} />}
      {tab === "readiness" && <ReadinessTab stats={stats} engagements={engagements} firms={firms} loading={loading} />}
      {firmModal && <FirmModal firm={editFirm} onClose={() => setFirmModal(false)} onSaved={load} />}
      {engModal && <EngagementModal engagement={editEng} firms={firms} onClose={() => setEngModal(false)} onSaved={load} />}
      {findingsEng && <FindingsPanel engagement={findingsEng} canWrite={canWrite} onClose={() => setFindingsEng(null)} onAttachments={(f) => { setAttachmentData({ id: f.id, type: "AuditFinding", title: `Finding: ${f.title}` }); }} />}
      {commentsEng && <CommentsPanel engagement={commentsEng} currentUser={user?.username ?? "You"} onClose={() => setCommentsEng(null)} />}
      {detailEng && (<EngagementDetailPanel engagement={detailEng} canWrite={canWrite} onClose={() => setDetailEng(null)} onEdit={() => { setEditEng(detailEng); setEngModal(true); setDetailEng(null); }} onFindings={() => { setFindingsEng(detailEng); setDetailEng(null); }} onComments={() => { setCommentsEng(detailEng); setDetailEng(null); }} onAttachments={() => setAttachmentData({ id: detailEng.id, type: "AuditEngagement", title: `Engagement: ${detailEng.title}` })} onCertificate={() => downloadComplianceCertificate(detailEng)} onPrint={() => downloadEngagementPdf(detailEng)} />)}
      {firmDrawer && (<FirmDrawer firm={firmDrawer} engagements={engagements} canWrite={canWrite} onEdit={() => { setEditFirm(firmDrawer); setFirmModal(true); setFirmDrawer(null); }} onClose={() => setFirmDrawer(null)} onViewEngagements={() => { setTab("engagements"); setRawSearch(firmDrawer.name); setFirmDrawer(null); }} />)}
      {attachmentData && <AuditAttachmentManager attachableId={attachmentData.id} attachableType={attachmentData.type} title={attachmentData.title} onClose={() => setAttachmentData(null)} />}
      {showChecklist && <BestPracticesPanel onClose={() => setShowChecklist(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </AppPage>
  );
};


// -- Analytics Panel -----------------------------------------------------------
interface MiniBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}
function MiniBar({ label, value, max, color }: MiniBarProps) { return ( <div className="flex items-center gap-3"> <span className="text-xs text-slate-500 dark:text-slate-400 w-28 shrink-0 truncate">{label}</span> <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"> <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }} /> </div> <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-6 text-right shrink-0">{value}</span> </div>);}
const SparkLine: React.FC<{ data: { label: string; count: number }[] }> = ({ data }) => { const max = Math.max(...data.map((d, _i) => d.count), 1);
return ( <div className="space-y-1"> <div className="flex items-end gap-1 h-16"> {data.map((d, i) => ( <div key={i} className="flex-1 flex flex-col items-center gap-1"> <div className="w-full bg-[var(--pro-azure-100)] dark:bg-green-900/30 dark:bg-[var(--pro-azure-100)] dark:bg-green-900/40 rounded-t-sm relative overflow-hidden" style={{ height: `${Math.max(4, (d.count / max) * 56)}px` }}> <div className="absolute inset-0 bg-[var(--pro-azure-50)]0 dark:bg-[var(--pro-azure-50)]0 rounded-t-sm" /> </div> </div> ))} </div> <div className="flex gap-1"> {data.map((d, i) => ( <div key={i} className="flex-1 text-center"> <span className="ovds-caption">{d.label}</span> </div> ))} </div> </div> );}
interface AnalyticsPanelProps {
  analytics: Analytics | null;
  loading: boolean;
  engagements: AuditEngagement[];
  firms: AuditFirm[];
}
function AnalyticsPanel({ analytics, loading, engagements, firms }: AnalyticsPanelProps) { if (loading) return <Skeleton.StatsRow count={4} />;
if (!analytics) return ( <div className="ovds-empty text-sm">No analytics data available.</div> );
const statusMax = Math.max(...(Object.values(analytics.byStatus) as number[]), 1);
const typeMax = Math.max(...(Object.values(analytics.byType) as number[]), 1);
const sevMax = Math.max(...(Object.values(analytics.findingsBySeverity) as number[]), 1);
const STATUS_COLORS_BAR: Record<string, string> = { CONSULTATION: 'bg-violet-400', PLANNING: 'bg-teal-400', FIELDWORK: 'bg-amber-400', REPORTING: 'bg-orange-400', FOLLOWUP: 'bg-cyan-400', COMPLETED: 'bg-[var(--pro-azure-light)]' };
const SEV_COLORS_BAR: Record<string, string> = { CRITICAL: 'bg-rose-500', HIGH: 'bg-orange-400', MEDIUM: 'bg-amber-400', LOW: 'bg-slate-300' };
const TYPE_COLORS_BAR: Record<string, string> = { FINANCIAL_STATEMENT: 'bg-teal-400', COMPLIANCE: 'bg-violet-400', RISK_ASSESSMENT: 'bg-orange-400', INTERNAL_CONTROL: 'bg-teal-400', TAX_COMPLIANCE: 'bg-amber-400', OTHER: 'bg-slate-300' };
const budgetPct = analytics.totalBudget > 0 ? Math.min(100, Math.round((analytics.totalActual / analytics.totalBudget) * 100)) : 0;
const overBudget = analytics.totalActual > analytics.totalBudget && analytics.totalBudget > 0; // Top firms by engagement count 
const firmStats = firms.map((f, _i) => ({ name: f.name, count: engagements.filter((e) => e.firmId === f.id).length, completed: engagements.filter((e) => e.firmId === f.id && e.status === 'COMPLETED').length, rating: f.rating ?? 0 })).sort((a, b) => b.count - a.count).slice(0, 5);
return ( <div className="space-y-4"> {/* Top row */} <div className="ovds-grid-layout cols-4"> {/* Engagements by status */} <div className="ovds-widget-card p-5 space-y-3"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">By Status</p> <div className="space-y-2"> {ENGAGEMENT_STEPS.map((s, _i) => ( <MiniBar key={s} label={ENGAGEMENT_LABELS[s]} value={analytics.byStatus[s] ?? 0} max={statusMax} color={STATUS_COLORS_BAR[s]} /> ))} </div> </div> {/* Findings by severity */} <div className="ovds-widget-card p-5 space-y-3"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Findings by Severity</p> <div className="space-y-2"> {(['CRITICAL','HIGH','MEDIUM','LOW'] as const).map((s, _i) => ( <MiniBar key={s} label={s} value={analytics.findingsBySeverity[s] ?? 0} max={sevMax} color={SEV_COLORS_BAR[s]} /> ))} </div> <div className="pt-2 border-t border-slate-50 dark:border-slate-700 space-y-1"> {Object.entries(analytics.findingsByStatus).map(([s, v]) => ( <div key={s} className="flex justify-between text-[10px]"> <span className="text-slate-500">{s.replace('_', ' ')}</span> <span className="font-bold text-slate-600 dark:text-slate-300">{v}</span> </div> ))} </div> </div> {/* Audit types */} <div className="ovds-widget-card p-5 space-y-3"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">By Audit Type</p> <div className="space-y-2"> {Object.entries(analytics.byType).sort((a, b) => b[1] - a[1]).map(([t, v]) => ( <MiniBar key={t} label={AUDIT_TYPE_LABELS[t as AuditType] ?? t} value={v} max={typeMax} color={TYPE_COLORS_BAR[t] ?? 'bg-slate-300'} /> ))} </div> </div> {/* Budget */} <div className="ovds-widget-card p-5 space-y-3"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Budget Overview</p> {analytics.totalBudget > 0 ? ( <> <div className="space-y-1"> <div className="flex justify-between text-xs"> <span className="text-slate-500">Budget</span> <span className="font-bold text-slate-700 dark:text-white">{fmt(analytics.totalBudget)}</span> </div> <div className="flex justify-between text-xs"> <span className="text-slate-500">Actual</span> <span className={`font-bold ${overBudget ? 'text-rose-600' : 'text-[var(--pro-azure)]'}`}> {fmt(analytics.totalActual)} </span> </div> </div> <div className="space-y-1"> <div className="flex justify-between text-[10px] text-slate-400"> <span>Spend rate</span> <span className={overBudget ? 'text-rose-500 font-bold' : ''}>{budgetPct}%</span> </div> <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"> <div className={`h-full rounded-full transition-all duration-500 ${overBudget ? 'bg-rose-500' : 'bg-[var(--pro-azure-50)]0'}`} style={{ width: `${Math.min(100, budgetPct)}%` }} /> </div> {overBudget && ( <p className="text-[10px] text-rose-500 font-bold"> Over budget by {fmt(analytics.totalActual - analytics.totalBudget)} </p> )} </div> </> ) : ( <p className="text-xs text-slate-400">No budget data recorded yet.</p> )} </div> </div> {/* Monthly trend + firm leaderboard */} <div className="ovds-grid-layout cols-2"> <div className="ovds-widget-card p-5"> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4"> Engagement Trend (6 months) </p> {analytics.monthlyTrend.every((d) => d.count === 0) ? ( <p className="text-xs text-slate-400 text-center py-6">No engagement data in this period.</p> ) : ( <SparkLine data={analytics.monthlyTrend} /> )} </div> <div className="ovds-widget-card p-5"> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4"> Top Firms by Engagement </p> {firmStats.length === 0 ? ( <p className="text-xs text-slate-400 text-center py-6">No firms yet.</p> ) : ( <div className="space-y-3"> {firmStats.map((f, i) => ( <div key={f.name} className="flex items-center gap-3"> <span className="text-[10px] font-semibold text-slate-400 w-4 shrink-0">{i + 1}</span> <div className="flex-1 min-w-0"> <div className="flex items-center justify-between"> <span className="text-xs font-bold text-slate-700 dark:text-white truncate">{f.name}</span> <span className="text-[10px] text-slate-400 shrink-0 ml-2">{f.count} eng.</span> </div> <div className="flex items-center gap-2 mt-0.5"> <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"> <div className="h-full bg-[var(--pro-azure-50)]0 rounded-full" style={{ width: `${f.count > 0 ? (f.completed / f.count) * 100 : 0}%` }} /> </div> <span className="text-[10px] text-[var(--pro-azure)] shrink-0">{f.completed} done</span> </div> </div> {f.rating > 0 && <StarRating value={f.rating} readonly />} </div> ))} </div> )} </div> </div> </div> );}

// -- Engagement Detail Panel ---------------------------------------------------
interface EngagementDetailPanelProps {
  engagement: AuditEngagement;
  canWrite: boolean;
  onClose(): void;
  onEdit(): void;
  onFindings(): void;
  onComments(): void;
  onAttachments(): void;
  onCertificate(): void;
  onPrint(): void;
}
function EngagementDetailPanel({ engagement, canWrite, onClose, onEdit, onFindings, onComments, onAttachments, onCertificate, onPrint }: EngagementDetailPanelProps) { useEscapeKey(onClose);
const overdue = isOverdue(engagement);
const days = engagement.endDate ? daysLeft(engagement.endDate) : null;
const isLast = engagement.status === 'COMPLETED';
return ( <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}> <div className="bg-white dark:bg-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}> <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700"> <div className="flex-1 min-w-0 pr-3"> <h2 className="font-semibold text-slate-800 dark:text-white truncate">{engagement.title}</h2> <div className="flex items-center gap-2 mt-1 flex-wrap">
<Badge label={ENGAGEMENT_LABELS[engagement.status]} className={ENGAGEMENT_COLORS[engagement.status]} /> {engagement.auditType && engagement.auditType !== 'OTHER' && ( <Badge label={AUDIT_TYPE_LABELS[engagement.auditType]} className={AUDIT_TYPE_COLORS[engagement.auditType]} /> )} {overdue && <Badge label="Overdue" className="bg-rose-100 text-rose-700" />} </div> </div> <div className="flex items-center gap-1 shrink-0"> {isLast && ( <button onClick={onCertificate} title="Download Compliance Certificate" className="p-1.5 rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure)] hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/40">
<Award size={16} /> </button> )} <button onClick={onPrint} title="Print report" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<Printer size={16} /> </button> <button onClick={onAttachments} title="Manage attachments" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
<Paperclip size={16} /> </button> <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
<X size={16} /></button> </div> </div> <div className="flex-1 p-5 space-y-5 overflow-y-auto"> {/* Progress */} <ProgressBar status={engagement.status} /> {/* Meta grid */} <div className="grid grid-cols-2 gap-3"> {[ { label: 'Firm', value: engagement.firm?.name, icon: <Building2 size={12} /> }, { label: 'Risk Level', value: engagement.riskLevel, icon: <ShieldAlert size={12} /> }, { label: 'Start', value: engagement.startDate ? fmtDate(engagement.startDate) : '—', icon: <Calendar size={12} /> }, { label: 'End', value: engagement.endDate ? fmtDate(engagement.endDate) : '—', icon: <Calendar size={12} />, highlight: overdue }, ].map(({ label, value, icon, highlight }) => ( <div key={label} className="bg-white dark:bg-slate-700/50 rounded-xl p-3"> <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">{icon} {label}</div> <p className={`text-xs font-bold ${highlight ? 'text-rose-600' : 'text-slate-700 dark:text-white'}`}>{value ?? '—'}</p> </div> ))} </div> {/* Days left */} {days !== null && engagement.status !== 'COMPLETED' && ( <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${ days < 0 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' : days <= 7 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-700/50 text-slate-600 dark:text-slate-300' }`}>
<Clock size={13} /> {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days remaining`} </div> )} {/* Budget */} {(engagement.budget || engagement.actualCost) && ( <div className="space-y-2"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Budget</p> <div className="flex justify-between text-xs"> <span className="text-slate-500">Budget</span> <span className="font-bold text-slate-700 dark:text-white">{engagement.budget ? fmt(engagement.budget) : '—'}</span> </div> <div className="flex justify-between text-xs"> <span className="text-slate-500">Actual Cost</span> <span className={`font-bold ${engagement.actualCost && engagement.budget && engagement.actualCost > engagement.budget ? 'text-rose-600' : 'text-[var(--pro-azure)]'}`}> {engagement.actualCost ? fmt(engagement.actualCost) : '—'} </span> </div> </div> )} {/* Scope */} {engagement.scope && ( <div> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Scope of Work</p> <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{engagement.scope}</p> </div> )} {/* Report summary */} {engagement.reportSummary && ( <div> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Report Summary</p> <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-900/20 rounded-xl text-xs text-[var(--pro-azure-dark)] dark:text-green-300 leading-relaxed"> {engagement.reportSummary} </div> </div> )} {/* Notes */} {engagement.notes && ( <div> <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Notes</p> <p className="ovds-body">{engagement.notes}</p> </div> )} {/* Quick actions */} <div className="space-y-2"> <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Quick Actions</p> <div className="grid grid-cols-2 gap-2"> <button onClick={onFindings} className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
<AlertTriangle size={13} className="text-amber-500" /> Findings ({engagement._count?.findings ?? 0}) </button> <button onClick={onComments} className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
<MessageSquare size={13} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> Comments ({engagement._count?.comments ?? 0}) </button> </div> </div> </div> {canWrite && ( <div className="p-5 border-t border-slate-100 dark:border-slate-700"> <button onClick={onEdit} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--pro-azure)] text-white hover:bg-[var(--pro-azure-dark)]">
<Edit2 size={14} /> Edit Engagement </button> </div> )} </div> </div> );}

// -- Shortcuts Modal ------------------------------------------------------------
interface ShortcutsModalProps { onClose: () => void };
function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  useEscapeKey(onClose);
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 dark:text-white">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X size={16} /></button>
        </div>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex justify-between"><span>New Engagement</span><kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">N</kbd></div>
          <div className="flex justify-between"><span>New Firm</span><kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">F</kbd></div>
          <div className="flex justify-between"><span>Toggle View</span><kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">V</kbd></div>
          <div className="flex justify-between"><span>Close</span><kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">Esc</kbd></div>
        </div>
      </div>
    </div>
  );
}

// -- Engagement Card (extracted for clarity) ------------------------------------
interface EngagementCardProps {
  eng: AuditEngagement;
  overdue: boolean;
  days: number | null;
  isLast: boolean;
  nextStep: EngagementStatus | null;
  canWrite: boolean;
  isAdmin: boolean;
  advancing: string | null;
  duplicating: string | null;
  onAdvance(id: string): void;
  onEdit(eng: AuditEngagement): void;
  onDelete(id: string): void;
  onFindings(eng: AuditEngagement): void;
  onComments(eng: AuditEngagement): void;
  onAttachments(eng: AuditEngagement): void;
  onCertificate(eng: AuditEngagement): void;
  onPrint(eng: AuditEngagement): void;
  onDetail(eng: AuditEngagement): void;
  onDuplicate(id: string): void;
}
function EngagementCard({
  eng, overdue, days, isLast, nextStep, canWrite, isAdmin,
  advancing, duplicating, onAdvance, onEdit, onDelete,
  onFindings, onComments, onAttachments, onCertificate, onPrint, onDetail, onDuplicate,
}: EngagementCardProps) {
  const [expanded, setExpanded] = useState(false);
const daysLabel = days === null ? null : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`;
const daysColor = days !== null && days < 0 ? 'text-rose-500 font-bold' : 'text-slate-400';
return (
    <div className={`bg-white dark:bg-slate-800 border rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${overdue ? 'border-rose-200 dark:border-rose-900/40' : 'border-slate-100 dark:border-slate-700'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge label={ENGAGEMENT_LABELS[eng.status]} className={ENGAGEMENT_COLORS[eng.status]} />
            {eng.auditType && (
              <Badge
                label={AUDIT_TYPE_LABELS[eng.auditType as AuditType] ?? eng.auditType} className={AUDIT_TYPE_COLORS[eng.auditType as AuditType] ?? 'bg-slate-100 text-slate-600'} />
            )}
            {eng.riskLevel && (
              <Badge
                label={eng.riskLevel} className={RISK_COLORS[eng.riskLevel as RiskLevel] ?? 'bg-slate-100 text-slate-600'} />
            )}
            {overdue && <Badge label="Overdue" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" />}
          </div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">{eng.title}</p>
          {eng.firm && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Building2 size={10} /> {eng.firm.name}
            </p>
          )}
          <ProgressBar status={eng.status} compact />
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 flex-wrap">
            {eng.startDate && <span>{fmtDate(eng.startDate)}</span>}
            {eng.endDate && <span>→ {fmtDate(eng.endDate)}</span>}
            {daysLabel && <span className={daysColor}>{daysLabel}</span>}
            {(eng._count?.findings ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle size={9} /> {eng._count!.findings} finding(s)
              </span>
            )}
            {(eng._count?.comments ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare size={9} /> {eng._count!.comments} comment(s)
              </span>
            )}
            {eng.budget && (
              <span className="flex items-center gap-1">
                <DollarSign size={9} /> Budget: {fmt(eng.budget)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0 items-end">
          <div className="flex gap-1 flex-wrap justify-end">
            <button onClick={() => onAttachments(eng)} title="Manage attachments" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
              <Paperclip size={13} />
            </button>
            <button onClick={() => onDetail(eng)} title="View details" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
              <ExternalLink size={13} />
            </button>
            <button onClick={() => onFindings(eng)} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
              Findings
            </button>
            <button onClick={() => onComments(eng)} title="Communication log" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] relative">
              <MessageSquare size={13} />
              {(eng._count?.comments ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[var(--pro-azure-50)]0 rounded-full text-[8px] text-white flex items-center justify-center font-semibold">
                  {eng._count!.comments > 9 ? '9+' : eng._count!.comments}
                </span>
              )}
            </button>
            {isLast && (
              <>
                <button onClick={() => onCertificate(eng)} title="Compliance Certificate"
                  className="p-1.5 rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure)] hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/40">
                  <Award size={13} />
                </button>
                <button onClick={() => onPrint(eng)} title="Print report"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                  <Printer size={13} />
                </button>
              </>
            )}
            {canWrite && (
              <>
                <button onClick={() => onEdit(eng)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => onDuplicate(eng.id)} disabled={duplicating === eng.id}
                  title="Duplicate engagement"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] disabled:opacity-50">
                  <Copy size={13} />
                </button>
              </>
            )}
            {isAdmin && (
              <button onClick={() => onDelete(eng.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                <Trash2 size={13} />
              </button>
            )}
          </div>
          {canWrite && !isLast && nextStep && (
            <button onClick={() => onAdvance(eng.id)} disabled={advancing === eng.id} className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline disabled:opacity-50">
              {advancing === eng.id ? 'Advancing...' : <><Zap size={10} /> Advance to {ENGAGEMENT_LABELS[nextStep]}</>}
            </button>
          )}
        </div>
      </div>
      {eng.budget && eng.actualCost && (
        <div className="mt-3 flex items-center gap-3 p-2.5 bg-white dark:bg-slate-700/50 rounded-xl">
          <DollarSign size={12} className="text-slate-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Budget vs Actual</span>
              <span className={eng.actualCost > eng.budget ? 'text-rose-500 font-bold' : 'text-[var(--pro-azure)] font-bold'}>
                {fmt(eng.actualCost)} / {fmt(eng.budget)}
              </span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${eng.actualCost > eng.budget ? 'bg-rose-500' : 'bg-[var(--pro-azure-50)]0'}`} style={{ width: `${Math.min(100, (eng.actualCost / eng.budget) * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
      {(eng.notes || eng.reportSummary) && (
        <div className="mt-3">
          <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {eng.notes && (
                <div className="p-3 bg-white dark:bg-slate-700/50 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-500 dark:text-slate-400">Notes: </span>{eng.notes}
                </div>
              )}
              {eng.reportSummary && (
                <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-900/20 rounded-xl text-xs text-[var(--pro-azure-dark)] dark:text-green-300 flex items-start gap-2">
                  <FileText size={12} className="shrink-0 mt-0.5" />
                  <span><span className="font-bold">Report: </span>{eng.reportSummary}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );}
// Entitlement gate wrapper
const AuditOutsourcingGated: React.FC = () => (
  <EntitlementGate featureKey="feature:audit-outsourcing">
    <AuditOutsourcing />
  </EntitlementGate>
);

export default AuditOutsourcingGated;
















