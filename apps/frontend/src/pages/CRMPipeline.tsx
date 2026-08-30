import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Briefcase, Plus, RefreshCw, Search, X, Edit2,
  ArrowRight, TrendingUp, CheckCircle2, Clock,
  List, Users, DollarSign, Calendar, MoreHorizontal,
  Trash2, LayoutGrid, Download, ChevronRight, ChevronDown,
  Layers, Phone, Mail, StickyNote, Bell, CheckSquare,
  Target, Zap, AlertTriangle, BarChart2, ArrowUpRight,
  Circle, Filter, Eye, Flag, Activity,
} from "lucide-react";
import { PipelineStageHeader, PipelineFunnel, PipelineProgressBar } from '../components/pipelineComponents';
import { AppPage, Btn, MetricCard } from '../components/ui';
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../rbac/AuthContext";
import { useBusiness } from "../context/businessContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { useDebounce } from "../hooks";
import { downloadCSV } from "../utils/download";
import { confirm } from "../utils/confirm";
import { fmtCurrency } from "../utils/fmt";
import { DealStage, CRM_STAGES } from '@ovds/ui';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Deal {
  id: string;
  title: string;
  customerName: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  companyId: string;
  tags?: string[];
  contactId?: string;
  pipelineId?: string;
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  stages: Array<{ id: string; name: string; order: number; probability: number; color: string; isWon?: boolean; isLost?: boolean }>;
}

interface PipelineStats {
  byStage: Record<string, { count: number; value: number }>;
  totalPipeline: number;
  wonValue: number;
  winRate: number;
}

interface CRMActivity {
  id: string;
  type: string;
  title: string;
  status: string;
  dueDate?: string;
  dealId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STAGES = Object.values(CRM_STAGES);
const fmt = (n: number) => fmtCurrency(n, 'ETB');

const inp = 'w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all placeholder:text-slate-400 font-medium';
const lbl = 'block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5 ml-1';

const STAGE_HEX: Record<DealStage, string> = {
  LEAD:        '#94a3b8',
  QUALIFIED:   '#00C96E',
  PROPOSAL:    '#8b5cf6',
  NEGOTIATION: '#f59e0b',
  CLOSED_WON:  '#00E784',
  CLOSED_LOST: '#ef4444',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 8 }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const palette = ['from-violet-500 to-purple-600','from-emerald-500 to-teal-600','from-orange-500 to-amber-600','from-rose-500 to-pink-600','from-cyan-500 to-sky-600','from-indigo-500 to-blue-600'];
  const color = palette[(name || '?').charCodeAt(0) % palette.length];
  return (
    <div className={`w-${size} h-${size} bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white font-black text-[10px] shrink-0`}>
      {initials}
    </div>
  );
};

const DealAgeBadge: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days < 7) return null;
  const cls = days > 30 ? 'bg-rose-50 text-rose-600' : days > 14 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500';
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${cls}`}><Clock size={9} strokeWidth={3} />{days}d</span>;
};

const OverdueBadge: React.FC<{ date?: string }> = ({ date }) => {
  if (!date) return null;
  const isOverdue = new Date(date) < new Date();
  if (!isOverdue) return null;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600"><AlertTriangle size={9} strokeWidth={3} />Overdue</span>;
};

function getDaysUntilClose(date?: string): { label: string; urgent: boolean } | null {
  if (!date) return null;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgent: true };
  if (diff === 0) return { label: 'Due today', urgent: true };
  if (diff <= 7) return { label: `${diff}d left`, urgent: true };
  return { label: `${diff}d`, urgent: false };
}

// ─── Deal Form Modal ─────────────────────────────────────────────────────────
const DealModal: React.FC<{
  deal?: Deal | null;
  onClose: () => void;
  onSaved: () => void;
  companyId: string;
}> = ({ deal, onClose, onSaved, companyId }) => {
  const [form, setForm] = useState({
    title: deal?.title ?? '',
    customerName: deal?.customerName ?? '',
    value: deal?.value?.toString() ?? '',
    stage: (deal?.stage ?? 'LEAD') as DealStage,
    probability: deal?.probability?.toString() ?? '10',
    expectedCloseDate: deal?.expectedCloseDate?.slice(0, 10) ?? '',
    assignedTo: deal?.assignedTo ?? '',
    notes: deal?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value) || 0, probability: Number(form.probability) || 10, companyId };
      if (deal?.id) { await api.patch('/crm/deals/' + deal.id, payload); toast.success('Deal updated'); }
      else           { await api.post('/crm/deals', payload);            toast.success('Deal created'); }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save deal');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-100 dark:border-slate-800 animate-in slide-in-from-right duration-500">
        <div className="px-8 py-7 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div className="w-13 h-13 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Briefcase size={24} strokeWidth={2.5} />
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 transition-all shadow-sm">
              <X size={18} />
            </button>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{deal ? 'Edit Deal' : 'New Opportunity'}</h2>
          <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-widest">{deal ? `Updating: ${deal.title}` : 'Capture a new business opportunity'}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="space-y-2"><label className={lbl}>Deal Title <span className="text-rose-500">*</span></label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} className={inp} placeholder="e.g. Annual software license renewal" /></div>
            <div className="space-y-2"><label className={lbl}>Customer / Organization <span className="text-rose-500">*</span></label>
              <div className="relative"><Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required value={form.customerName} onChange={e => set('customerName', e.target.value)} className={`${inp} pl-11`} placeholder="Client name" /></div></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className={lbl}>Value (ETB)</label>
                <div className="relative"><DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={form.value} onChange={e => set('value', e.target.value)} className={`${inp} pl-11 font-black tabular-nums`} placeholder="0.00" /></div></div>
              <div className="space-y-2"><label className={lbl}>Pipeline Stage</label>
                <div className="relative">
                  <select value={form.stage} onChange={e => { set('stage', e.target.value); set('probability', String(STAGES.find(s => s.key === e.target.value)?.prob ?? 10)); }} className={`${inp} appearance-none pr-10`}>
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className={lbl}>Expected Close Date</label>
                <div className="relative"><Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="date" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)} className={`${inp} pl-11`} /></div></div>
              <div className="space-y-2"><label className={lbl}>Win Probability (%)</label>
                <div className="relative"><TrendingUp size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min="0" max="100" value={form.probability} onChange={e => set('probability', e.target.value)} className={`${inp} pl-11 font-black`} /></div></div>
            </div>
            <div className="space-y-2"><label className={lbl}>Assigned Sales Rep</label>
              <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={inp} placeholder="Team member name" /></div>
            <div className="space-y-2"><label className={lbl}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={4} className={`${inp} resize-none`} placeholder="Key requirements, blockers, next steps..." /></div>
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all">Discard</button>
            <button type="submit" disabled={saving} className="flex-[2] px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black disabled:opacity-50 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} strokeWidth={3} />}
              {saving ? 'Processing…' : deal ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Deal Detail Panel ────────────────────────────────────────────────────────
const DealDetailPanel: React.FC<{
  deal: Deal;
  activities: CRMActivity[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (stage: DealStage) => void;
}> = ({ deal, activities, onClose, onEdit, onDelete, onMove }) => {
  const stage = STAGES.find(s => s.key === deal.stage);
  const dealActivities = activities.filter(a => a.dealId === deal.id);
  const daysInfo = getDaysUntilClose(deal.expectedCloseDate);
  const weightedValue = (deal.value * deal.probability) / 100;
  const nextStage = STAGES[STAGES.findIndex(s => s.key === deal.stage) + 1];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-100 dark:border-slate-800 animate-in slide-in-from-right duration-400">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800" style={{ borderTop: `4px solid ${STAGE_HEX[deal.stage]}` }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest" style={{ background: STAGE_HEX[deal.stage] + '18', color: STAGE_HEX[deal.stage] }}>
                  <Circle size={6} className="fill-current" />{stage?.label}
                </span>
                <DealAgeBadge createdAt={deal.createdAt} />
                <OverdueBadge date={deal.expectedCloseDate} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{deal.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Avatar name={deal.customerName} size={6} />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{deal.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={onEdit} className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-all"><Edit2 size={14} strokeWidth={2.5} /></button>
              <button onClick={onDelete} className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 transition-all"><Trash2 size={14} strokeWidth={2.5} /></button>
              <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all"><X size={14} /></button>
            </div>
          </div>
          {/* Value block */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deal Value</p>
              <p className="text-base font-black text-slate-900 dark:text-white tabular-nums">{fmt(deal.value)}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Weighted</p>
              <p className="text-base font-black text-emerald-600 tabular-nums">{fmt(weightedValue)}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Win Rate</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{deal.probability}%</p></div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7 space-y-6">
          {/* Probability bar */}
          <div>
            <PipelineProgressBar pct={deal.probability} color={STAGE_HEX[deal.stage]} label="Win probability" showLabel />
          </div>

          {/* Key facts */}
          <div className="space-y-3">
            {deal.assignedTo && (
              <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600"><Users size={12} /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sales Rep</p><p className="text-sm font-bold text-slate-700 dark:text-slate-200">{deal.assignedTo}</p></div></div>
            )}
            {deal.expectedCloseDate && (
              <div className="flex items-center gap-3"><div className={`w-7 h-7 rounded-lg flex items-center justify-center ${daysInfo?.urgent ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}><Calendar size={12} /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Close Date</p>
                  <p className={`text-sm font-bold ${daysInfo?.urgent ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                    {new Date(deal.expectedCloseDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {daysInfo && <span className="ml-2 text-[10px]">({daysInfo.label})</span>}
                  </p></div></div>
            )}
            <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500"><Calendar size={12} /></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Created</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{new Date(deal.createdAt).toLocaleDateString('en-ET', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div></div>
          </div>

          {/* Notes */}
          {deal.notes && (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/30">
              <div className="flex items-center gap-2 mb-2"><StickyNote size={12} className="text-amber-600" /><span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Notes</span></div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{deal.notes}</p>
            </div>
          )}

          {/* Pipeline journey */}
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Pipeline Journey</p>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s, i) => {
                const isCompleted = STAGES.findIndex(x => x.key === deal.stage) > i;
                const isCurrent = s.key === deal.stage;
                return (
                  <button key={s.key} onClick={() => onMove(s.key as DealStage)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      isCurrent ? 'text-white shadow-md' : isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`} style={isCurrent ? { background: STAGE_HEX[s.key as DealStage] } : {}}>
                    {isCompleted && <CheckCircle2 size={9} strokeWidth={3} />}{s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activities */}
          {dealActivities.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Activities ({dealActivities.length})</p>
              <div className="space-y-2">
                {dealActivities.slice(0, 4).map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${a.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {a.type === 'CALL' ? <Phone size={10} /> : a.type === 'EMAIL' ? <Mail size={10} /> : a.type === 'TASK' ? <CheckSquare size={10} /> : a.type === 'FOLLOW_UP' ? <Bell size={10} /> : <StickyNote size={10} />}
                    </div>
                    <div className="flex-1 min-w-0"><p className={`text-xs font-bold truncate ${a.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{a.title}</p></div>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg ${a.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {nextStage && !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage) && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => { onMove(nextStage.key as DealStage); onClose(); }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-black text-white transition-all shadow-lg uppercase tracking-widest"
              style={{ background: STAGE_HEX[nextStage.key as DealStage] }}>
              Advance to {nextStage.label} <ArrowRight size={16} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Quick Add Row ────────────────────────────────────────────────────────────
const QuickAddRow: React.FC<{
  stageKey: DealStage;
  companyId: string;
  onSaved: () => void;
}> = ({ stageKey, companyId, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [customer, setCustomer] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stage = STAGES.find(s => s.key === stageKey);
  const prob = stage?.prob ?? 10;

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const handleSave = async () => {
    if (!title.trim() || !customer.trim()) { toast.error('Title and customer required'); return; }
    setSaving(true);
    try {
      await api.post('/crm/deals', { title: title.trim(), customerName: customer.trim(), value: Number(value) || 0, stage: stageKey, probability: prob, companyId });
      toast.success('Deal added');
      setTitle(''); setCustomer(''); setValue(''); setOpen(false);
      onSaved();
    } catch { toast.error('Failed to create deal'); }
    finally { setSaving(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group text-[10px] font-black uppercase tracking-widest">
        <Plus size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> Quick Add
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-700 p-3 shadow-md space-y-2 animate-in slide-in-from-top-2 duration-200">
      <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="Deal title..." className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-100 dark:border-slate-700 pb-1.5 outline-none placeholder:text-slate-400" />
      <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name..." className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-100 dark:border-slate-700 pb-1.5 outline-none placeholder:text-slate-400" />
      <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="Value (ETB)..." className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent pb-1.5 outline-none placeholder:text-slate-400" />
      <div className="flex gap-2 pt-1">
        <button onClick={() => setOpen(false)} className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-[2] py-1.5 rounded-lg bg-emerald-500 text-[10px] font-black text-white hover:bg-emerald-600 transition-all uppercase tracking-widest disabled:opacity-50">
          {saving ? <RefreshCw size={10} className="animate-spin mx-auto" /> : 'Add Deal'}
        </button>
      </div>
    </div>
  );
};

// ─── Enhanced Deal Card ───────────────────────────────────────────────────────
const DealCard: React.FC<{
  deal: Deal;
  activityCount: number;
  onView: (d: Deal) => void;
  onEdit: (d: Deal) => void;
  onMove: (id: string, stage: DealStage) => void;
  onDelete: (id: string) => void;
}> = ({ deal, activityCount, onView, onEdit, onMove, onDelete }) => {
  const nextStage = STAGES[STAGES.findIndex(s => s.key === deal.stage) + 1];
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const daysInfo = getDaysUntilClose(deal.expectedCloseDate);
  const weightedValue = (deal.value * deal.probability) / 100;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group cursor-pointer relative"
      onClick={() => onView(deal)}
      style={{ borderLeft: `3px solid ${STAGE_HEX[deal.stage]}20` }}>

      {/* Top row: title + menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors tracking-tight flex-1">{deal.title}</p>
        <div ref={ref} className="relative shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-30 w-40 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <button onClick={() => { onView(deal); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 uppercase tracking-widest"><Eye size={12} />View Details</button>
              <button onClick={() => { onEdit(deal); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 uppercase tracking-widest"><Edit2 size={12} />Edit Deal</button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
              <button onClick={() => { onDelete(deal.id); setMenuOpen(false); }} className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 uppercase tracking-widest"><Trash2 size={12} />Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-2 mb-3">
        <Avatar name={deal.customerName} size={6} />
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{deal.customerName}</span>
      </div>

      {/* Value / Probability */}
      <div className="flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-2.5 mb-3">
        <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Value</p>
          <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{fmt(deal.value)}</p></div>
        <div className="text-center px-3">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90 absolute" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={STAGE_HEX[deal.stage]} strokeWidth="3"
                strokeDasharray={`${deal.probability * 0.879} 87.9`} strokeLinecap="round" />
            </svg>
            <span className="text-[9px] font-black text-slate-900 dark:text-white relative z-10">{deal.probability}%</span>
          </div>
        </div>
        <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Weighted</p>
          <p className="text-xs font-black text-emerald-600 tabular-nums">{fmt(weightedValue)}</p></div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <DealAgeBadge createdAt={deal.createdAt} />
        <OverdueBadge date={deal.expectedCloseDate} />
        {daysInfo && !daysInfo.urgent && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Calendar size={9} />{daysInfo.label}
          </span>
        )}
        {activityCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 text-violet-600">
            <Activity size={9} />{activityCount}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
        {deal.assignedTo ? (
          <div className="flex items-center gap-1.5 ovds-label text-slate-400"><Users size={10} strokeWidth={3} className="text-slate-300" />{deal.assignedTo}</div>
        ) : <span />}
        {nextStage && !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage) && (
          <button onClick={e => { e.stopPropagation(); onMove(deal.id, nextStage.key as DealStage); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black text-white hover:opacity-90 transition-all shadow-md uppercase tracking-widest"
            style={{ background: STAGE_HEX[nextStage.key as DealStage] }}>
            {nextStage.label} <ArrowRight size={10} strokeWidth={3} />
          </button>
        )}
        {deal.stage === 'CLOSED_WON' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black text-white bg-emerald-500 uppercase tracking-widest">
            <CheckCircle2 size={10} strokeWidth={3} />Won
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Forecast Bar ─────────────────────────────────────────────────────────────
const ForecastBar: React.FC<{ deals: Deal[] }> = ({ deals }) => {
  const active = deals.filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage));
  const totalWeighted = active.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
  const totalRaw = active.reduce((s, d) => s + d.value, 0);
  const byStage = STAGES.filter(s => !['CLOSED_WON', 'CLOSED_LOST'].includes(s.key)).map(s => {
    const sd = active.filter(d => d.stage === s.key);
    return { ...s, weighted: sd.reduce((x, d) => x + (d.value * d.probability) / 100, 0), count: sd.length };
  });

  return (
    <div className="ovds-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600"><Target size={14} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Revenue Forecast</p>
            <p className="text-[9px] font-bold text-slate-400">Probability-weighted pipeline value</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-emerald-600 tabular-nums">{fmt(totalWeighted)}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">of {fmt(totalRaw)} raw</p>
        </div>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        {byStage.filter(s => s.weighted > 0).map(s => (
          <div key={s.key} className="h-full rounded-full transition-all" title={`${s.label}: ${fmt(s.weighted)}`}
            style={{ width: `${totalWeighted > 0 ? (s.weighted / totalWeighted) * 100 : 0}%`, background: STAGE_HEX[s.key as DealStage], minWidth: s.weighted > 0 ? 4 : 0 }} />
        ))}
        {totalWeighted === 0 && <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded-full" />}
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {byStage.filter(s => s.count > 0).map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: STAGE_HEX[s.key as DealStage] }} />
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{s.label} ({s.count}) · {fmt(s.weighted)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Pipeline Switcher ────────────────────────────────────────────────────────
const PipelineSwitcher: React.FC<{
  pipelines: Pipeline[];
  activePipeline: Pipeline | null;
  onChange: (p: Pipeline | null) => void;
}> = ({ pipelines, activePipeline, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (pipelines.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest hover:border-emerald-300 transition-all shadow-sm">
        <Layers size={14} className="text-emerald-600" />
        {activePipeline?.name ?? 'Default Pipeline'}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150">
          <button onClick={() => { onChange(null); setOpen(false); }}
            className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${activePipeline === null ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
            <Flag size={12} />Default Stages</button>
          {pipelines.map(p => (
            <button key={p.id} onClick={() => { onChange(p); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${activePipeline?.id === p.id ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <Layers size={12} />{p.name}{p.isDefault && <span className="ml-auto text-[8px] bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">Default</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Funnel View ─────────────────────────────────────────────────────────────
const FunnelView: React.FC<{ deals: Deal[] }> = ({ deals }) => {
  const stages = STAGES.map(s => ({
    label: s.label,
    count: deals.filter(d => d.stage === s.key).length,
    amount: fmt(deals.filter(d => d.stage === s.key).reduce((sum, d) => sum + d.value, 0)),
    color: STAGE_HEX[s.key as DealStage],
    pct: 100,
  }));
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="max-w-xl mx-auto">
      <PipelineFunnel stages={stages.map(s => ({ ...s, pct: Math.round((s.count / maxCount) * 100) }))} title="Conversion Funnel" />
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CRMPipeline() {
  usePageTitle('Pipeline');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<DealStage | ''>('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [view, setView] = useState<'kanban' | 'list' | 'funnel'>('kanban');
  const [showForecast, setShowForecast] = useState(true);
  const [editDeal, setEditDeal] = useState<Deal | null | undefined>(undefined);
  const [viewDeal, setViewDeal] = useState<Deal | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const fetchAll = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const [dealsRes, statsRes, pipelinesRes, activitiesRes] = await Promise.allSettled([
        api.get('/crm/deals?companyId=' + selectedCompanyId + '&take=500', { headers: { 'x-background': '1' } }),
        api.get('/crm/deals/stats?companyId=' + selectedCompanyId, { headers: { 'x-background': '1' } }),
        api.get('/crm/pipelines?companyId=' + selectedCompanyId, { headers: { 'x-background': '1' } }),
        api.get('/crm/activities?companyId=' + selectedCompanyId + '&take=200', { headers: { 'x-background': '1' } }),
      ]);
      if (dealsRes.status === 'fulfilled') {
        const raw = dealsRes.value.data?.data?.data ?? dealsRes.value.data?.data ?? dealsRes.value.data ?? [];
        setDeals(Array.isArray(raw) ? raw : []);
      }
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data?.data ?? statsRes.value.data;
        if (s) setPipelineStats(s);
      }
      if (pipelinesRes.status === 'fulfilled') {
        const raw = pipelinesRes.value.data?.data ?? pipelinesRes.value.data ?? [];
        const list: Pipeline[] = Array.isArray(raw) ? raw : [];
        setPipelines(list);
        const def = list.find(p => p.isDefault);
        if (def && !activePipeline) setActivePipeline(def);
      }
      if (activitiesRes.status === 'fulfilled') {
        const raw = activitiesRes.value.data?.data ?? activitiesRes.value.data ?? [];
        setActivities(Array.isArray(raw) ? raw : []);
      }
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  }, [selectedCompanyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleMove = async (id: string, stage: DealStage) => {
    try {
      const prob = STAGES.find(s => s.key === stage)?.prob ?? 10;
      await api.patch('/crm/deals/' + id, { stage, probability: prob });
      setDeals(prev => prev.map(d => d.id === id ? { ...d, stage, probability: prob } : d));
      if (viewDeal?.id === id) setViewDeal(prev => prev ? { ...prev, stage, probability: prob } : prev);
      toast.success('Moved to ' + STAGES.find(s => s.key === stage)?.label);
    } catch { toast.error('Failed to move deal'); }
  };

  const handleDelete = async (id: string) => {
    if (!can('crm:deals:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: 'Delete this deal?', message: 'This will permanently remove the opportunity.', variant: 'danger' }))) return;
    try {
      await api.delete('/crm/deals/' + id);
      setDeals(prev => prev.filter(d => d.id !== id));
      if (viewDeal?.id === id) setViewDeal(null);
      toast.success('Deal deleted');
    } catch { toast.error('Failed to delete deal'); }
  };

  const exportCSV = () => {
    const header = 'Title,Customer,Value,Weighted,Stage,Probability,Close Date,Assigned To\n';
    const rows = filtered.map(d => `"${d.title}","${d.customerName}",${d.value},${Math.round((d.value * d.probability) / 100)},"${d.stage}",${d.probability},"${d.expectedCloseDate ?? ''}","${d.assignedTo ?? ''}"`).join('\n');
    downloadCSV(header + rows, `pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Pipeline exported');
  };

  // Derive available stages from active pipeline or defaults
  const activeStages = activePipeline?.stages
    ? activePipeline.stages.map(s => ({ key: s.name.toUpperCase().replace(/\s+/g, '_'), label: s.name, prob: s.probability, color: s.color, dot: s.color, headerBg: s.color + '15', cardBg: s.color + '08', border: s.color + '30' }))
    : STAGES;

  const filtered = deals.filter(d => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || d.title.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q);
    const matchStage = !stageFilter || d.stage === stageFilter;
    const matchAssignee = !assigneeFilter || (d.assignedTo ?? '').toLowerCase().includes(assigneeFilter.toLowerCase());
    return matchSearch && matchStage && matchAssignee;
  });

  const assignees = [...new Set(deals.map(d => d.assignedTo).filter(Boolean))] as string[];

  const stats = {
    total: deals.length,
    pipeline: deals.filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).reduce((s, d) => s + d.value, 0),
    won: deals.filter(d => d.stage === 'CLOSED_WON').reduce((s, d) => s + d.value, 0),
    weighted: deals.filter(d => !['CLOSED_LOST'].includes(d.stage)).reduce((s, d) => s + (d.value * d.probability) / 100, 0),
    winRate: pipelineStats?.winRate ?? (() => {
      const closed = deals.filter(d => ['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage));
      return closed.length > 0 ? Math.round((deals.filter(d => d.stage === 'CLOSED_WON').length / closed.length) * 100) : 0;
    })(),
    overdueCount: deals.filter(d => d.expectedCloseDate && new Date(d.expectedCloseDate) < new Date() && !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length,
  };

  return (
    <AppPage
      title="Sales Pipeline"
      subtitle="Track opportunities, forecast revenue, and close deals faster"
      icon={<Briefcase size={18} />}
      iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
      crumbs={[{ label: 'CRM', to: '/crm' }, { label: 'Pipeline' }]}
      actions={
        <>
          <Btn variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportCSV}>Export</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setEditDeal(null); setShowCreate(true); }}>New Deal</Btn>
        </>
      }
    >
      {/* Pipeline Stage Header */}
      <PipelineStageHeader
        stages={STAGES.map(s => ({
          key: s.key,
          label: s.label,
          count: deals.filter(d => d.stage === s.key).length,
          color: STAGE_HEX[s.key as DealStage],
          completed: s.key === 'CLOSED_WON',
          active: deals.filter(d => d.stage === s.key).length === Math.max(...STAGES.map(st => deals.filter(d => d.stage === st.key).length)),
          amount: fmt(deals.filter(d => d.stage === s.key).reduce((sum, d) => sum + d.value, 0)),
        }))}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pipeline Value" amount={fmt(stats.pipeline)} percentage={0} isPositive />
        <MetricCard title="Revenue Won" amount={fmt(stats.won)} percentage={0} isPositive />
        <MetricCard title="Forecast (Weighted)" amount={fmt(stats.weighted)} percentage={0} isPositive />
        <MetricCard title="Win Rate" amount={`${stats.winRate}%`} percentage={0} isPositive />
      </div>

      {/* Forecast bar + overdue alert */}
      {stats.overdueCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-800/30">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
            <span className="font-black">{stats.overdueCount} deal{stats.overdueCount > 1 ? 's' : ''}</span> past expected close date — review and update your pipeline.
          </p>
        </div>
      )}

      {showForecast && deals.length > 0 && <ForecastBar deals={deals} />}

      {/* Main panel */}
      <div className="ovds-panel flex flex-col min-h-[600px] overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-1 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals or customers..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400" />
            </div>
            <PipelineSwitcher pipelines={pipelines} activePipeline={activePipeline} onChange={setActivePipeline} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Assignee filter */}
            {assignees.length > 0 && (
              <div className="relative">
                <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
                  className="pl-3 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none appearance-none transition-all">
                  <option value="">All Reps</option>
                  {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            {/* Stage filter */}
            <div className="relative">
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value as DealStage | '')}
                className="pl-3 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none appearance-none transition-all">
                <option value="">All Stages</option>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {/* View toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5">
              {([['kanban', <LayoutGrid size={15} />], ['list', <List size={15} />], ['funnel', <BarChart2 size={15} />]] as const).map(([v, icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`p-2 rounded-lg transition-all ${view === v ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  {icon}
                </button>
              ))}
            </div>
            {/* Forecast toggle */}
            <button onClick={() => setShowForecast(f => !f)} title="Toggle forecast"
              className={`p-2 rounded-xl transition-all border ${showForecast ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'}`}>
              <Target size={15} />
            </button>
            <button onClick={fetchAll} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 transition-all">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {(stageFilter || assigneeFilter || search) && (
          <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 flex-wrap">
            <Filter size={12} className="text-slate-400 shrink-0" />
            {search && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">"{search}"<button onClick={() => setSearch('')}><X size={9} /></button></span>}
            {stageFilter && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest" style={{ background: STAGE_HEX[stageFilter] + '15', color: STAGE_HEX[stageFilter] }}>{STAGES.find(s => s.key === stageFilter)?.label}<button onClick={() => setStageFilter('')}><X size={9} /></button></span>}
            {assigneeFilter && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-[10px] font-black text-violet-600 uppercase tracking-widest">{assigneeFilter}<button onClick={() => setAssigneeFilter('')}><X size={9} /></button></span>}
            <button onClick={() => { setSearch(''); setStageFilter(''); setAssigneeFilter(''); }} className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest ml-1">Clear all</button>
            <span className="ml-auto text-[9px] font-bold text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-x-auto p-6 scrollbar-hide">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-32">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900/30" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Pipeline...</p>
            </div>
          ) : view === 'funnel' ? (
            <FunnelView deals={filtered} />
          ) : view === 'list' ? (
            // ── List view ──────────────────────────────────────────────────
            <div className="ovds-panel overflow-hidden">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4"><Briefcase size={24} className="text-slate-400" /></div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">No deals found</p>
                  <p className="text-xs text-slate-400 font-bold">Try adjusting your filters or add your first opportunity.</p>
                </div>
              ) : (
                <table className="ovds-table w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      {['Opportunity', 'Customer', 'Value', 'Weighted', 'Stage', 'Close Date', 'Actions'].map(h => (
                        <th key={h} className={`px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] ${['Value', 'Weighted'].includes(h) ? 'text-right' : h === 'Stage' ? 'text-center' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filtered.map(d => {
                      const stage = STAGES.find(s => s.key === d.stage);
                      const daysInfo = getDaysUntilClose(d.expectedCloseDate);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => setViewDeal(d)}>
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 transition-colors">{d.title}</p>
                            {d.assignedTo && <p className="text-[10px] font-bold text-slate-400 mt-0.5">Rep: {d.assignedTo}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2"><Avatar name={d.customerName} size={7} />
                              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{d.customerName}</span></div>
                          </td>
                          <td className="px-6 py-4 text-right"><p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{fmt(d.value)}</p><p className="text-[10px] font-bold text-slate-400">{d.probability}% win</p></td>
                          <td className="px-6 py-4 text-right"><p className="text-sm font-black text-emerald-600 tabular-nums">{fmt((d.value * d.probability) / 100)}</p></td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest" style={{ background: STAGE_HEX[d.stage] + '15', color: STAGE_HEX[d.stage] }}>
                              <Circle size={5} className="fill-current" />{stage?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {d.expectedCloseDate ? (
                              <p className={`text-sm font-bold ${daysInfo?.urgent ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                {new Date(d.expectedCloseDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {daysInfo && <span className="block text-[9px] font-black mt-0.5">{daysInfo.label}</span>}
                              </p>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setViewDeal(d)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"><Eye size={14} strokeWidth={2.5} /></button>
                              <button onClick={() => setEditDeal(d)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"><Edit2 size={14} strokeWidth={2.5} /></button>
                              <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"><Trash2 size={14} strokeWidth={2.5} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            // ── Kanban view ────────────────────────────────────────────────
            <div className="flex gap-6 h-full min-w-max">
              {STAGES.map(stage => {
                const stageDeals = filtered.filter(d => d.stage === stage.key);
                const stageTotal = stageDeals.reduce((s, d) => s + d.value, 0);
                const stageWeighted = stageDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0);
                const hasOverdue = stageDeals.some(d => d.expectedCloseDate && new Date(d.expectedCloseDate) < new Date());
                return (
                  <div key={stage.key} className="w-[295px] flex flex-col gap-4 shrink-0">
                    {/* Column header */}
                    <div className="p-4 rounded-2xl border flex flex-col gap-2" style={{ background: STAGE_HEX[stage.key as DealStage] + '0e', borderColor: STAGE_HEX[stage.key as DealStage] + '30' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: STAGE_HEX[stage.key as DealStage] }} />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: STAGE_HEX[stage.key as DealStage] }}>{stage.label}</h3>
                          {hasOverdue && <AlertTriangle size={10} className="text-rose-500" />}
                        </div>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-lg text-[9px] font-black text-white" style={{ background: STAGE_HEX[stage.key as DealStage] }}>{stageDeals.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">{fmt(stageTotal)}</span>
                        <span className="text-[9px] font-bold text-emerald-600 tabular-nums">~{fmt(stageWeighted)} weighted</span>
                      </div>
                    </div>
                    {/* Cards */}
                    <div className="flex-1 space-y-4 min-h-[300px]">
                      {stageDeals.map(deal => (
                        <DealCard key={deal.id} deal={deal}
                          activityCount={activities.filter(a => a.dealId === deal.id).length}
                          onView={setViewDeal} onEdit={setEditDeal}
                          onMove={handleMove} onDelete={handleDelete} />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-70 transition-opacity"
                          style={{ borderColor: STAGE_HEX[stage.key as DealStage] + '40' }}>
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2" style={{ background: STAGE_HEX[stage.key as DealStage] + '15' }}>
                            <Plus size={18} style={{ color: STAGE_HEX[stage.key as DealStage] }} />
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">No deals</p>
                        </div>
                      )}
                    </div>
                    {/* Quick add */}
                    {!['CLOSED_WON', 'CLOSED_LOST'].includes(stage.key) && (
                      <QuickAddRow stageKey={stage.key as DealStage} companyId={selectedCompanyId!} onSaved={fetchAll} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400">{filtered.length} of {deals.length} deals</p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500">Total filtered: <span className="font-black text-slate-700 dark:text-slate-200">{fmt(filtered.reduce((s, d) => s + d.value, 0))}</span></span>
            <span className="text-[10px] font-bold text-slate-500">Weighted: <span className="font-black text-emerald-600">{fmt(filtered.reduce((s, d) => s + (d.value * d.probability) / 100, 0))}</span></span>
          </div>
        </div>
      </div>

      {/* Deal create/edit modal */}
      {(showCreate || editDeal !== undefined) && (
        <DealModal
          deal={editDeal ?? null}
          companyId={selectedCompanyId || ''}
          onClose={() => { setShowCreate(false); setEditDeal(undefined); }}
          onSaved={fetchAll}
        />
      )}
      {viewDeal && (
        <DealDetailPanel deal={viewDeal} activities={activities}
          onClose={() => setViewDeal(null)}
          onEdit={() => { setEditDeal(viewDeal); setViewDeal(null); }}
          onDelete={() => { handleDelete(viewDeal.id); setViewDeal(null); }}
          onMove={(stage) => handleMove(viewDeal.id, stage)} />
      )}
    </AppPage>
  );
}
