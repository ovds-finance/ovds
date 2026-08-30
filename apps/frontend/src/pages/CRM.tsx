import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Phone, Mail, MapPin, Edit2, Trash2,
  CheckCircle, Download, FileText, ChevronDown, X,
  RefreshCw, LayoutGrid, List, Search,
  ShieldCheck, Globe, StickyNote, MessageSquare,
  ChevronRight, Building2, Percent, BadgeCheck, AlertTriangle, Plus,
  Wallet, Info, Check, Calendar, Briefcase, Settings,
  Activity, Target, TrendingUp, DollarSign, Clock, ArrowRight,
  Phone as PhoneIcon, Mail as MailIcon,
  Layers, Users2, Zap, Bell,
  CheckSquare, Flag,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks';
import { confirm } from '../utils/confirm';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { EmptyState, AppPage, Btn, Icon, MetricCard } from '../components/ui';
import { downloadCSV } from '../utils/download';
import { fmtCurrency } from '../utils/fmt';
import type { Permission } from '../rbac/rbac';

// -- Design tokens -------------------------------------------------------------
const inp = 'w-full px-4 py-3.5 bg-ovds-surface dark:bg-ovds-surface-dark border border-ovds-border dark:border-ovds-muted-dark rounded-2xl text-sm text-ovds-text-main dark:text-ovds-surface outline-none focus:ring-4 focus:ring-teal-400/10 focus:border-teal-400 transition-all placeholder:text-ovds-text-subtle font-bold';
const lbl = 'block text-[11px] font-black text-ovds-text-muted dark:text-ovds-text-subtle uppercase tracking-widest mb-2 ml-1';
const fmt = (n: number) => fmtCurrency(n, 'ETB');

// -- Types ---------------------------------------------------------------------
type CRMTab = 'contacts' | 'companies' | 'deals' | 'activities' | 'settings';
type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE' | 'FOLLOW_UP';
type ActivityStatus = 'PENDING' | 'DONE' | 'CANCELLED';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tin: string | null;
  vatNumber?: string | null;
  website?: string | null;
  paymentTerms: string | null;
  notes: string | null;
  createdAt: string;
  creditScore?: number;
  loyaltyTier?: string;
  riskLevel?: string;
  creditLimit?: number;
  preferredInteractionType?: string;
  outstandingBalance?: number;
  totalInvoiced?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  companyName?: string;
  jobTitle?: string;
  type?: 'PERSON' | 'COMPANY';
  tags?: string[];
  pipelineStage?: string;
  assignedTo?: string;
  lastContactedAt?: string;
}

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website?: string | null;
  industry?: string;
  size?: string;
  tin?: string | null;
  vatNumber?: string | null;
  notes?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  contactCount?: number;
  dealCount?: number;
  totalRevenue?: number;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
  customerName: string;
  contactId?: string;
  companyId?: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  notes?: string;
  pipelineId?: string;
  pipelineName?: string;
  createdAt: string;
  tags?: string[];
}

interface CRMActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  dueDate?: string;
  completedAt?: string;
  contactId?: string;
  contactName?: string;
  dealId?: string;
  dealTitle?: string;
  assignedTo?: string;
  createdAt: string;
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault?: boolean;
  dealCount?: number;
  totalValue?: number;
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
  isWon?: boolean;
  isLost?: boolean;
}

// -- Helpers -------------------------------------------------------------------
const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const safeName = name || '?';
  const initials = safeName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const colors = [
    'from-violet-500 to-purple-600', 'from-emerald-500 to-indigo-600',
    'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600',
  ];
  const color = colors[safeName.charCodeAt(0) % colors.length];
  const cls = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-sm' : 'w-10 h-10 text-xs';
  return (
    <div className={`${cls} bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
};



const StageBadge: React.FC<{ stage: DealStage }> = ({ stage }) => {
  const map: Record<DealStage, { label: string; cls: string }> = {
    LEAD:        { label: 'Lead',        cls: 'bg-ovds-muted text-ovds-text-muted dark:bg-ovds-muted-dark dark:text-ovds-text-subtle' },
    QUALIFIED:   { label: 'Qualified',   cls: 'bg-emerald-50 text-emerald-600' },
    PROPOSAL:    { label: 'Proposal',    cls: 'bg-violet-50 text-violet-600' },
    NEGOTIATION: { label: 'Negotiation', cls: 'bg-amber-50 text-amber-600' },
    CLOSED_WON:  { label: 'Won',         cls: 'bg-emerald-50 text-emerald-600' },
    CLOSED_LOST: { label: 'Lost',        cls: 'bg-rose-50 text-rose-600' },
  };
  const { label, cls } = map[stage] ?? map.LEAD;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${cls}`}>{label}</span>;
};

const ActivityIcon: React.FC<{ type: ActivityType; size?: number }> = ({ type, size = 16 }) => {
  const map: Record<ActivityType, { icon: React.ReactNode; cls: string }> = {
    CALL:      { icon: <PhoneIcon size={size} />,    cls: 'text-emerald-600' },
    EMAIL:     { icon: <MailIcon size={size} />,     cls: 'text-violet-600' },
    MEETING:   { icon: <Users size={size} />,        cls: 'text-emerald-600' },
    TASK:      { icon: <CheckSquare size={size} />,  cls: 'text-amber-600' },
    NOTE:      { icon: <StickyNote size={size} />,   cls: 'text-ovds-text-subtle' },
    FOLLOW_UP: { icon: <Bell size={size} />,         cls: 'text-rose-600' },
  };
  const { icon, cls } = map[type] ?? map.NOTE;
  return <span className={cls}>{icon}</span>;
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTACT MODAL
// ══════════════════════════════════════════════════════════════════════════════
const ContactModal: React.FC<{
  contact?: Contact | null;
  onClose: () => void;
  onSave: () => void;
  companyId?: string;
}> = ({ contact, onClose, onSave, companyId }) => {
  const [form, setForm] = useState({
    name: contact?.name ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    address: contact?.address ?? '',
    tin: contact?.tin ?? '',
    vatNumber: contact?.vatNumber ?? '',
    website: contact?.website ?? '',
    paymentTerms: contact?.paymentTerms ?? 'NET30',
    notes: contact?.notes ?? '',
    creditLimit: contact?.creditLimit?.toString() ?? '',
    riskLevel: contact?.riskLevel ?? 'MEDIUM',
    status: contact?.status ?? 'ACTIVE',
    companyName: contact?.companyName ?? '',
    jobTitle: contact?.jobTitle ?? '',
    type: contact?.type ?? 'PERSON',
    assignedTo: contact?.assignedTo ?? '',
    preferredInteractionType: contact?.preferredInteractionType ?? 'EMAIL',
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'IDENTITY' | 'ADDRESS' | 'FISCAL' | 'CRM'>('IDENTITY');
  const [tinValidating, setTinValidating] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validateTin = async () => {
    if (!form.tin.trim()) { toast.error('Enter a TIN first'); return; }
    setTinValidating(true);
    try {
      const res = await api.get(`/ovds/validate/tin/${encodeURIComponent(form.tin.trim())}`).catch(() => null);
      if (res?.data?.valid === true) toast.success('TIN verified ✓');
      else if (res?.data?.valid === false) toast.error(res.data.message ?? 'TIN not found in ERCA registry');
      else {
        const cleaned = form.tin.replace(/\D/g, '');
        if (/^\d{10}$/.test(cleaned)) toast.success('TIN format valid ✓ (10 digits)');
        else toast.error('Invalid TIN — must be 10 digits');
      }
    } finally { setTinValidating(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Contact name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined, companyId };
      if (contact?.id) {
        // Try CRM endpoint first, fall back to ovds registry
        await api.patch(`/crm/contacts/${contact.id}`, payload)
          .catch(() => api.patch(`/ovds/customers/registry/${contact.id}`, payload));
        toast.success('Contact updated');
      } else {
        await api.post('/crm/contacts', payload);
        toast.success('Contact created');
      }
      onSave(); onClose();
    } catch { /* interceptor handles toast */ }
    finally { setSaving(false); }
  };

  const TABS = ['IDENTITY', 'ADDRESS', 'FISCAL', 'CRM'] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-ovds-sidebar/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl h-full bg-ovds-surface dark:bg-ovds-surface-dark shadow-2xl flex flex-col border-l border-ovds-border dark:border-ovds-muted-dark animate-in slide-in-from-right duration-500">
        <div className="px-8 py-8 bg-emerald-50 border-b border-ovds-border dark:border-ovds-muted-dark">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <UserPlus size={28} strokeWidth={2.5} />
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark border border-ovds-border dark:border-ovds-muted-dark text-emerald-600 hover:text-slate-800 transition-all shadow-sm hover:shadow-md">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-3xl font-black text-ovds-text-main dark:text-ovds-surface tracking-tight">
            {contact ? 'Edit Contact' : 'New Contact'}
          </h2>
          <p className="text-sm text-emerald-600 font-bold mt-1.5 uppercase tracking-widest">
            {contact ? `Updating: ${contact.name}` : 'Add a new contact to your CRM'}
          </p>
        </div>

        <div className="ovds-tab-nav px-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`ovds-tab ${tab === t ? 'active' : ''}`}>
              {t === 'CRM' ? 'CRM Info' : t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8 space-y-8">

            {tab === 'IDENTITY' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-5 bg-emerald-50 rounded-3xl border border-ovds-border dark:border-ovds-muted-dark">
                  <label className={lbl}>Contact Type</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {(['PERSON', 'COMPANY'] as const).map(t => (
                      <button key={t} type="button" onClick={() => set('type', t)}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                          form.type === t ? 'bg-ovds-surface dark:bg-ovds-surface-dark border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-ovds-border dark:border-ovds-muted-dark text-emerald-600 hover:text-slate-800'
                        }`}>
                        {t === 'PERSON' ? <Users size={14} /> : <Building2 size={14} />} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Full Name <span className="text-rose-600">*</span></label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                    <input required value={form.name} onChange={e => set('name', e.target.value)} className={`${inp} pl-12`} placeholder="e.g. Abebe Girma or Acme Corp" />
                  </div>
                </div>
                {form.type === 'PERSON' && (
                  <div className="ovds-grid-layout cols-2">
                    <div className="space-y-2">
                      <label className={lbl}>Job Title</label>
                      <input value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} className={inp} placeholder="e.g. ovds Manager" />
                    </div>
                    <div className="space-y-2">
                      <label className={lbl}>Company</label>
                      <input value={form.companyName} onChange={e => set('companyName', e.target.value)} className={inp} placeholder="Employer / Organization" />
                    </div>
                  </div>
                )}
                <div className="ovds-grid-layout cols-2">
                  <div className="space-y-2">
                    <label className={lbl}>Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={`${inp} pl-12`} placeholder="contact@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                      <input value={form.phone} onChange={e => set('phone', e.target.value)} className={`${inp} pl-12`} placeholder="+251 91 123 4567" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Website</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                    <input value={form.website} onChange={e => set('website', e.target.value)} className={`${inp} pl-12`} placeholder="https://www.example.com" />
                  </div>
                </div>
                <div className="p-5 bg-emerald-50 rounded-3xl border border-ovds-border dark:border-ovds-muted-dark">
                  <label className={lbl}>Status</label>
                  <div className="ovds-grid-layout cols-3 gap-sm mt-3">
                    {(['ACTIVE', 'INACTIVE', 'BLOCKED'] as const).map(s => (
                      <button key={s} type="button" onClick={() => set('status', s)}
                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          form.status === s ? 'bg-ovds-surface dark:bg-ovds-surface-dark border-emerald-500 text-emerald-600 shadow-sm' : 'bg-transparent border-ovds-border dark:border-ovds-muted-dark text-emerald-600 hover:text-slate-800'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ADDRESS' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className={lbl}>Primary Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-5 text-ovds-text-subtle" />
                    <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={6} className={`${inp} pl-12 pt-5 resize-none`} placeholder="Street, Building, City, Region..." />
                  </div>
                </div>
                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex gap-4">
                  <div className="w-10 h-10 bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0 mt-1">
                    <Info size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ovds-text-main dark:text-ovds-surface">Billing Address</h4>
                    <p className="text-xs text-ovds-text-muted dark:text-ovds-text-subtle leading-relaxed mt-1 font-bold">
                      This address will be auto-populated on invoices and legal correspondence for this contact.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'FISCAL' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="ovds-grid-layout cols-2">
                  <div className="space-y-2">
                    <label className={lbl}>TIN (Tax ID)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                        <input value={form.tin} onChange={e => set('tin', e.target.value)} className={`${inp} pl-12`} placeholder="10-digit TIN" maxLength={10} />
                      </div>
                      <button type="button" onClick={validateTin} disabled={tinValidating} className="px-4 bg-ovds-sidebar dark:bg-ovds-muted-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50">
                        {tinValidating ? <RefreshCw size={14} className="animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>VAT Registration</label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                      <input value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} className={`${inp} pl-12`} placeholder="VAT Number" />
                    </div>
                  </div>
                </div>
                <div className="ovds-grid-layout cols-2">
                  <div className="space-y-2">
                    <label className={lbl}>Credit Limit (ETB)</label>
                    <div className="relative">
                      <Wallet size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                      <input type="number" value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} className={`${inp} pl-12`} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={lbl}>Risk Classification</label>
                    <div className="relative">
                      <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                      <select value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)} className={`${inp} pl-12 appearance-none`}>
                        <option value="LOW">Low Risk</option>
                        <option value="MEDIUM">Medium Risk</option>
                        <option value="HIGH">High Risk</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Default Payment Terms</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                    <select value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} className={`${inp} pl-12 appearance-none`}>
                      <option value="IMMEDIATE">Immediate Payment</option>
                      <option value="NET7">Net 7 Days</option>
                      <option value="NET15">Net 15 Days</option>
                      <option value="NET30">Net 30 Days</option>
                      <option value="NET60">Net 60 Days</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Internal Notes</label>
                  <div className="relative">
                    <StickyNote size={16} className="absolute left-4 top-5 text-ovds-text-subtle" />
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={`${inp} pl-12 pt-5 resize-none`} placeholder="Confidential credit history or relationship context..." />
                  </div>
                </div>
              </div>
            )}

            {tab === 'CRM' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className={lbl}>Assigned Sales Rep</label>
                  <div className="relative">
                    <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                    <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={`${inp} pl-12`} placeholder="Assign to a team member" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={lbl}>Preferred Contact Method</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle" />
                    <select value={form.preferredInteractionType} onChange={e => set('preferredInteractionType', e.target.value)} className={`${inp} pl-12 appearance-none`}>
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Phone</option>
                      <option value="IN_PERSON">In Person</option>
                      <option value="VIDEO_CALL">Video Call</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-ovds-text-subtle pointer-events-none" />
                  </div>
                </div>
                <div className="p-5 bg-emerald-50 rounded-3xl border border-ovds-border dark:border-ovds-muted-dark flex gap-4">
                  <div className="w-10 h-10 bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0 mt-1">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-ovds-text-main dark:text-ovds-surface">Customer Journey</h4>
                    <p className="text-xs text-ovds-text-muted dark:text-ovds-text-subtle leading-relaxed mt-1 font-bold">
                      After saving, you can link this contact to deals, log activities, and track their journey through your sales pipeline.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-ovds-border dark:border-ovds-muted-dark bg-emerald-50 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-ovds-border dark:border-ovds-muted-dark rounded-[1.5rem] text-sm font-black text-emerald-600 hover:bg-emerald-50 transition-all">
              Discard
            </button>
            <button type="submit" disabled={saving} className="flex-[2] px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] text-sm font-black disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30">
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <BadgeCheck size={18} strokeWidth={3} />}
              {saving ? 'Processing...' : contact ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPANY MODAL
// ══════════════════════════════════════════════════════════════════════════════
const CompanyModal: React.FC<{
  company?: Company | null;
  onClose: () => void;
  onSave: () => void;
  companyId?: string;
}> = ({ company, onClose, onSave, companyId }) => {
  const [form, setForm] = useState({
    name: company?.name ?? '',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
    address: company?.address ?? '',
    website: company?.website ?? '',
    industry: company?.industry ?? '',
    size: company?.size ?? 'SMALL',
    tin: company?.tin ?? '',
    vatNumber: company?.vatNumber ?? '',
    notes: company?.notes ?? '',
    status: company?.status ?? 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, companyId };
      if (company?.id) {
        await api.patch(`/crm/companies/${company.id}`, payload);
        toast.success('Company updated');
      } else {
        await api.post('/crm/companies', payload);
        toast.success('Company added to CRM');
      }
      onSave(); onClose();
    } catch { /* interceptor handles toast */ }
    finally { setSaving(false); }
  };

  const INDUSTRIES = ['Technology', 'ovds', 'Healthcare', 'Manufacturing', 'Retail', 'Agriculture', 'Construction', 'Education', 'Government', 'NGO', 'Other'];
  const SIZES = [
    { value: 'MICRO', label: '1–9 employees' },
    { value: 'SMALL', label: '10–49 employees' },
    { value: 'MEDIUM', label: '50–249 employees' },
    { value: 'LARGE', label: '250+ employees' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl h-full bg-ovds-surface dark:bg-ovds-surface-dark shadow-2xl flex flex-col border-l border-ovds-border animate-in slide-in-from-right duration-500">
        <div className="px-8 py-8 bg-emerald-50 border-b border-ovds-border">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <Building2 size={28} strokeWidth={2.5} />
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark border border-emerald-200 text-emerald-600 hover:text-emerald-700 transition-all shadow-sm hover:shadow-md">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-3xl font-black text-ovds-text-main dark:text-ovds-surface tracking-tight">
            {company ? 'Edit Company' : 'Add Company'}
          </h2>
          <p className="text-sm text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
            {company ? `Updating: ${company.name}` : 'Register a new company in your CRM'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="space-y-2">
              <label className={lbl}>Company Name <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required value={form.name} onChange={e => set('name', e.target.value)} className={`${inp} pl-12`} placeholder="e.g. Acme Ethiopia PLC" />
              </div>
            </div>
            <div className="ovds-grid-layout cols-2">
              <div className="space-y-2">
                <label className={lbl}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={`${inp} pl-12`} placeholder="info@company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className={`${inp} pl-12`} placeholder="+251 11 123 4567" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className={lbl}>Website</label>
              <div className="relative">
                <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.website} onChange={e => set('website', e.target.value)} className={`${inp} pl-12`} placeholder="https://www.company.com" />
              </div>
            </div>
            <div className="ovds-grid-layout cols-2">
              <div className="space-y-2">
                <label className={lbl}>Industry</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.industry} onChange={e => set('industry', e.target.value)} className={`${inp} pl-12 appearance-none`}>
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Company Size</label>
                <div className="relative">
                  <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={form.size} onChange={e => set('size', e.target.value)} className={`${inp} pl-12 appearance-none`}>
                    {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="ovds-grid-layout cols-2">
              <div className="space-y-2">
                <label className={lbl}>TIN</label>
                <input value={form.tin} onChange={e => set('tin', e.target.value)} className={inp} placeholder="10-digit TIN" maxLength={10} />
              </div>
              <div className="space-y-2">
                <label className={lbl}>VAT Number</label>
                <input value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} className={inp} placeholder="VAT Registration" />
              </div>
            </div>
            <div className="space-y-2">
              <label className={lbl}>Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-5 text-slate-400" />
                <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={3} className={`${inp} pl-12 pt-5 resize-none`} placeholder="Street, City, Region..." />
              </div>
            </div>
            <div className="space-y-2">
              <label className={lbl}>Notes</label>
              <div className="relative">
                <StickyNote size={16} className="absolute left-4 top-5 text-slate-400" />
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={`${inp} pl-12 pt-5 resize-none`} placeholder="Internal notes about this company..." />
              </div>
            </div>
            <div className="p-5 bg-emerald-50 rounded-3xl border border-ovds-border">
              <label className={lbl}>Status</label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {(['ACTIVE', 'INACTIVE'] as const).map(s => (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      form.status === s ? 'bg-ovds-surface dark:bg-ovds-surface-dark border-emerald-600 text-emerald-600 shadow-sm' : 'bg-transparent border-emerald-200 text-emerald-600 hover:text-emerald-700'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-ovds-border bg-emerald-50 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-emerald-200 rounded-[1.5rem] text-sm font-black text-emerald-700 hover:bg-emerald-50 transition-all">
              Discard
            </button>
            <button type="submit" disabled={saving} className="flex-[2] px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] text-sm font-black disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30">
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <BadgeCheck size={18} strokeWidth={3} />}
              {saving ? 'Processing...' : company ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// DEAL MODAL
// ══════════════════════════════════════════════════════════════════════════════
const DEAL_STAGES: { key: DealStage; label: string; prob: number; color: string }[] = [
  { key: 'LEAD',        label: 'Lead',        prob: 10,  color: 'bg-slate-400' },
  { key: 'QUALIFIED',   label: 'Qualified',   prob: 25,  color: 'bg-emerald-500' },
  { key: 'PROPOSAL',    label: 'Proposal',    prob: 50,  color: 'bg-teal-500' },
  { key: 'NEGOTIATION', label: 'Negotiation', prob: 75,  color: 'bg-amber-400' },
  { key: 'CLOSED_WON',  label: 'Closed Won',  prob: 100, color: 'bg-emerald-500' },
  { key: 'CLOSED_LOST', label: 'Closed Lost', prob: 0,   color: 'bg-rose-400' },
];

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
    if (!form.title.trim()) { toast.error('Deal title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, value: Number(form.value) || 0, probability: Number(form.probability) || 10, companyId };
      if (deal?.id) {
        await api.patch('/crm/deals/' + deal.id, payload);
        toast.success('Deal updated');
      } else {
        await api.post('/crm/deals', payload);
        toast.success('Deal created');
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save deal');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl h-full bg-ovds-surface dark:bg-ovds-surface-dark shadow-2xl flex flex-col border-l border-ovds-border animate-in slide-in-from-right duration-500">
        <div className="px-8 py-8 bg-emerald-50 border-b border-ovds-border">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <Briefcase size={28} strokeWidth={2.5} />
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark border border-emerald-200 text-emerald-600 hover:text-emerald-700 transition-all shadow-sm hover:shadow-md">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-3xl font-black text-ovds-text-main dark:text-ovds-surface tracking-tight">
            {deal ? 'Edit Deal' : 'New Deal'}
          </h2>
          <p className="text-sm text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
            {deal ? `Updating: ${deal.title}` : 'Capture a new sales opportunity'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="space-y-2">
              <label className={lbl}>Deal Title <span className="text-rose-500">*</span></label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} className={inp} placeholder="e.g. Annual software license renewal" />
            </div>
            <div className="space-y-2">
              <label className={lbl}>Contact / Organization <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required value={form.customerName} onChange={e => set('customerName', e.target.value)} className={`${inp} pl-12`} placeholder="Search or enter client name" />
              </div>
            </div>
            <div className="ovds-grid-layout cols-2">
              <div className="space-y-2">
                <label className={lbl}>Deal Value (ETB)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" value={form.value} onChange={e => set('value', e.target.value)} className={`${inp} pl-12 font-black tabular-nums`} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Win Probability (%)</label>
                <div className="relative">
                  <TrendingUp size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" min="0" max="100" value={form.probability} onChange={e => set('probability', e.target.value)} className={`${inp} pl-12 font-black`} />
                </div>
              </div>
            </div>

            {/* Stage selector — visual pill buttons */}
            <div className="space-y-3">
              <label className={lbl}>Pipeline Stage</label>
              <div className="grid grid-cols-3 gap-2">
                {DEAL_STAGES.map(s => (
                  <button key={s.key} type="button"
                    onClick={() => { set('stage', s.key); set('probability', String(s.prob)); }}
                    className={`py-2.5 px-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                      form.stage === s.key
                        ? 'bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-700 border-emerald-600 text-emerald-600 shadow-sm'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ovds-grid-layout cols-2">
              <div className="space-y-2">
                <label className={lbl}>Expected Close Date</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="date" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)} className={`${inp} pl-12`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Assigned Sales Rep</label>
                <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={inp} placeholder="Team member name" />
              </div>
            </div>
            <div className="space-y-2">
              <label className={lbl}>Deal Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={4} className={`${inp} resize-none pt-4`} placeholder="Key requirements, blockers, and next steps..." />
            </div>
          </div>

          <div className="p-8 border-t border-ovds-border bg-emerald-50 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-emerald-200 rounded-2xl text-sm font-black text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm">
              Discard
            </button>
            <button type="submit" disabled={saving} className="flex-[2] px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30">
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} strokeWidth={3} />}
              {saving ? 'Processing…' : deal ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITY MODAL
// ══════════════════════════════════════════════════════════════════════════════
const ActivityModal: React.FC<{
  activity?: CRMActivity | null;
  onClose: () => void;
  onSaved: () => void;
  companyId: string;
}> = ({ activity, onClose, onSaved, companyId }) => {
  const [form, setForm] = useState({
    type: (activity?.type ?? 'CALL') as ActivityType,
    title: activity?.title ?? '',
    description: activity?.description ?? '',
    status: (activity?.status ?? 'PENDING') as ActivityStatus,
    dueDate: activity?.dueDate?.slice(0, 16) ?? '',
    contactName: activity?.contactName ?? '',
    dealTitle: activity?.dealTitle ?? '',
    assignedTo: activity?.assignedTo ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const ACTIVITY_TYPES: { key: ActivityType; label: string; icon: React.ReactNode }[] = [
    { key: 'CALL',      label: 'Call',      icon: <PhoneIcon size={14} /> },
    { key: 'EMAIL',     label: 'Email',     icon: <MailIcon size={14} /> },
    { key: 'MEETING',   label: 'Meeting',   icon: <Users size={14} /> },
    { key: 'TASK',      label: 'Task',      icon: <CheckSquare size={14} /> },
    { key: 'NOTE',      label: 'Note',      icon: <StickyNote size={14} /> },
    { key: 'FOLLOW_UP', label: 'Follow-up', icon: <Bell size={14} /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Activity title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, companyId };
      if (activity?.id) {
        await api.patch('/crm/activities/' + activity.id, payload);
        toast.success('Activity updated');
      } else {
        await api.post('/crm/activities', payload);
        toast.success('Activity logged');
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save activity');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl h-full bg-ovds-surface dark:bg-ovds-surface-dark shadow-2xl flex flex-col border-l border-ovds-border animate-in slide-in-from-right duration-500">
        <div className="px-8 py-8 bg-emerald-50 border-b border-ovds-border">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark border border-emerald-200 text-emerald-600 hover:text-emerald-700 transition-all shadow-sm hover:shadow-md">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-3xl font-black text-ovds-text-main dark:text-ovds-surface tracking-tight">
            {activity ? 'Edit Activity' : 'Log Activity'}
          </h2>
          <p className="text-sm text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
            {activity ? `Updating: ${activity.title}` : 'Record a customer interaction or schedule a task'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Activity type selector */}
            <div className="space-y-3">
              <label className={lbl}>Activity Type</label>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => set('type', t.key)}
                    className={`py-3 px-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                      form.type === t.key
                        ? 'bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-700 border-amber-500 text-amber-600 shadow-sm'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                    }`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className={lbl}>Title <span className="text-rose-500">*</span></label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} className={inp} placeholder="e.g. Follow-up call with Abebe" />
            </div>

            <div className="ovds-grid-layout cols-2">
              <div className="space-y-2">
                <label className={lbl}>Related Contact</label>
                <div className="relative">
                  <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.contactName} onChange={e => set('contactName', e.target.value)} className={`${inp} pl-12`} placeholder="Contact name" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Related Deal</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.dealTitle} onChange={e => set('dealTitle', e.target.value)} className={`${inp} pl-12`} placeholder="Deal title" />
                </div>
              </div>
            </div>

            <div className="ovds-grid-layout cols-2">
              <div className="space-y-2">
                <label className={lbl}>Due Date & Time</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="datetime-local" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={`${inp} pl-12`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={lbl}>Assigned To</label>
                <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={inp} placeholder="Team member" />
              </div>
            </div>

            <div className="space-y-2">
              <label className={lbl}>Description / Notes</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className={`${inp} resize-none pt-4`} placeholder="Details about this activity..." />
            </div>

            {/* Status */}
            <div className="p-5 bg-emerald-50 rounded-3xl border border-ovds-border">
              <label className={lbl}>Status</label>
              <div className="ovds-grid-layout cols-3 gap-sm mt-3">
                {(['PENDING', 'DONE', 'CANCELLED'] as ActivityStatus[]).map(s => (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      form.status === s ? 'bg-ovds-surface dark:bg-ovds-surface-dark border-amber-500 text-amber-600 shadow-sm' : 'bg-transparent border-emerald-200 text-emerald-600 hover:text-emerald-700'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-ovds-border bg-emerald-50 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-emerald-200 rounded-2xl text-sm font-black text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm">
              Discard
            </button>
            <button type="submit" disabled={saving} className="flex-[2] px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-sm font-black disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/30">
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} strokeWidth={3} />}
              {saving ? 'Processing…' : activity ? 'Update Activity' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PIPELINE SETTINGS MODAL (Add/Edit Pipeline, Stages, Activity Types)
// ══════════════════════════════════════════════════════════════════════════════
const PipelineSettingsModal: React.FC<{
  pipeline?: Pipeline | null;
  onClose: () => void;
  onSaved: () => void;
  companyId: string;
}> = ({ pipeline, onClose, onSaved, companyId }) => {
  const defaultStages: PipelineStage[] = [
    { id: '1', name: 'Lead',        order: 1, probability: 10,  color: '#94a3b8' },
    { id: '2', name: 'Qualified',   order: 2, probability: 25,  color: '#00E784' },
    { id: '3', name: 'Proposal',    order: 3, probability: 50,  color: '#8b5cf6' },
    { id: '4', name: 'Negotiation', order: 4, probability: 75,  color: '#f59e0b' },
    { id: '5', name: 'Closed Won',  order: 5, probability: 100, color: '#00E784', isWon: true },
    { id: '6', name: 'Closed Lost', order: 6, probability: 0,   color: '#ef4444', isLost: true },
  ];

  const [name, setName] = useState(pipeline?.name ?? '');
  const [description, setDescription] = useState(pipeline?.description ?? '');
  const [isDefault, setIsDefault] = useState(pipeline?.isDefault ?? false);
  const [stages, setStages] = useState<PipelineStage[]>(pipeline?.stages ?? defaultStages);
  const [saving, setSaving] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  const addStage = () => {
    if (!newStageName.trim()) return;
    const newStage: PipelineStage = {
      id: Date.now().toString(),
      name: newStageName.trim(),
      order: stages.length + 1,
      probability: 50,
      color: '#00E784',
    };
    setStages(prev => [...prev, newStage]);
    setNewStageName('');
  };

  const removeStage = (id: string) => setStages(prev => prev.filter(s => s.id !== id));
  const updateStage = (id: string, field: keyof PipelineStage, value: any) =>
    setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Pipeline name is required'); return; }
    if (stages.length < 2) { toast.error('Pipeline needs at least 2 stages'); return; }
    setSaving(true);
    try {
      const payload = { name, description, isDefault, stages, companyId };
      if (pipeline?.id) {
        await api.patch('/crm/pipelines/' + pipeline.id, payload);
        toast.success('Pipeline updated');
      } else {
        await api.post('/crm/pipelines', payload);
        toast.success('Pipeline created');
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save pipeline');
    } finally { setSaving(false); }
  };

  const STAGE_COLORS = ['#94a3b8', '#00E784', '#8b5cf6', '#f59e0b', '#00E784', '#ef4444', '#06b6d4', '#f97316'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl h-full bg-ovds-surface dark:bg-ovds-surface-dark shadow-2xl flex flex-col border-l border-ovds-border animate-in slide-in-from-right duration-500">
        <div className="px-8 py-8 bg-emerald-50 border-b border-ovds-border">
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <Layers size={28} strokeWidth={2.5} />
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark border border-emerald-200 text-emerald-600 hover:text-emerald-700 transition-all shadow-sm hover:shadow-md">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-3xl font-black text-ovds-text-main dark:text-ovds-surface tracking-tight">
            {pipeline ? 'Edit Pipeline' : 'New Pipeline'}
          </h2>
          <p className="text-sm text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
            Configure stages and customer journey steps
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Pipeline Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className={lbl}>Pipeline Name <span className="text-rose-500">*</span></label>
                <input required value={name} onChange={e => setName(e.target.value)} className={inp} placeholder="e.g. Sales Pipeline, Enterprise Deals" />
              </div>
              <div className="space-y-2">
                <label className={lbl}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={`${inp} resize-none pt-4`} placeholder="What kind of deals does this pipeline track?" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full transition-all relative ${isDefault ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  onClick={() => setIsDefault(v => !v)}>
                  <div className={`absolute top-1 w-4 h-4 bg-ovds-surface dark:bg-ovds-surface-dark rounded-full shadow transition-all ${isDefault ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">Set as default pipeline</span>
              </label>
            </div>

            {/* Stages */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Customer Stages</h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{stages.length} stages</span>
              </div>

              <div className="space-y-3">
                {stages.map((stage, idx) => (
                  <div key={stage.id} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-black text-slate-400 w-5 text-center">{idx + 1}</span>
                      <input type="color" value={stage.color} onChange={e => updateStage(stage.id, 'color', e.target.value)}
                        className="w-8 h-8 rounded-xl border-2 border-white shadow-sm cursor-pointer" />
                    </div>
                    <input value={stage.name} onChange={e => updateStage(stage.id, 'name', e.target.value)}
                      className="flex-1 bg-transparent text-sm font-black text-ovds-text-main dark:text-ovds-surface outline-none border-b-2 border-transparent focus:border-indigo-500 transition-all pb-1" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Prob.</span>
                      <input type="number" min="0" max="100" value={stage.probability}
                        onChange={e => updateStage(stage.id, 'probability', Number(e.target.value))}
                        className="w-16 text-center bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 py-1.5" />
                      <span className="text-[10px] font-black text-slate-400">%</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => updateStage(stage.id, 'isWon', !stage.isWon)}
                        title="Mark as Won stage"
                        className={`p-1.5 rounded-lg text-[10px] font-black transition-all ${stage.isWon ? 'bg-ovds-border text-emerald-600' : 'text-slate-300 hover:text-emerald-600'}`}>
                        <CheckCircle size={14} />
                      </button>
                      <button type="button" onClick={() => removeStage(stage.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new stage */}
              <div className="flex gap-3">
                <input value={newStageName} onChange={e => setNewStageName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStage())}
                  className={`${inp} flex-1`} placeholder="New stage name..." />
                <button type="button" onClick={addStage}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                  <Plus size={16} strokeWidth={3} /> Add
                </button>
              </div>
            </div>

            {/* Color palette hint */}
            <div className="p-5 bg-emerald-50 rounded-3xl border border-ovds-border flex gap-4">
              <div className="w-10 h-10 bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0 mt-1">
                <Flag size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100">Stage Tips</h4>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed mt-1 font-bold">
                  Mark a stage as "Won" (✓) to count deals as closed revenue. Probability % helps forecast expected revenue across your pipeline.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-ovds-border bg-emerald-50 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-emerald-200 rounded-2xl text-sm font-black text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm">
              Discard
            </button>
            <button type="submit" disabled={saving} className="flex-[2] px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30">
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} strokeWidth={3} />}
              {saving ? 'Processing…' : pipeline ? 'Update Pipeline' : 'Create Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTACTS TAB
// ══════════════════════════════════════════════════════════════════════════════
const ContactsTab: React.FC<{ companyId: string; can: (p: Permission) => boolean }> = ({ companyId, can }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchContacts = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Try the dedicated CRM contacts endpoint first; fall back to ovds registry
      const [crmRes, registryRes] = await Promise.allSettled([
        api.get(`/crm/contacts?companyId=${companyId}&take=500`),
        api.get(`/ovds/customers/registry?companyId=${companyId}`),
      ]);
      const rawCrm = crmRes.status === 'fulfilled'
        ? (crmRes.value.data?.data?.data ?? crmRes.value.data?.data ?? crmRes.value.data ?? [])
        : [];
      const rawRegistry = registryRes.status === 'fulfilled'
        ? (registryRes.value.data?.data?.data ?? registryRes.value.data?.data ?? registryRes.value.data ?? [])
        : [];
      const crmData: Contact[] = Array.isArray(rawCrm) ? rawCrm : [];
      const registryData: Contact[] = Array.isArray(rawRegistry) ? rawRegistry : [];
      // Merge: deduplicate by id, CRM contacts take precedence
      const seen = new Set<string>();
      const merged: Contact[] = [];
      for (const c of [...crmData, ...registryData]) {
        if (c?.id && !seen.has(c.id)) { seen.add(c.id); merged.push(c); }
      }
      setContacts(merged);
    } catch (err) {
      toast.error('Failed to load contacts');
    }
    finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleDelete = async (id: string) => {
    if (!can('crm:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: 'Delete Contact?', message: 'This will permanently remove the contact and their history.', variant: 'danger' }))) return;
    try {
      await api.delete(`/crm/contacts/${id}`)
        .catch(() => api.delete(`/ovds/customers/registry/${id}`));
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contact deleted');
    } catch { toast.error('Failed to delete contact'); }
  };

  const filtered = contacts.filter(c => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || (c.name ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.tin ?? '').includes(q);
    const effectiveStatus = c.status ?? (c.riskLevel === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE');
    const matchFilter = filter === 'ALL' || effectiveStatus === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: contacts.length,
    active: contacts.filter(c => c.status !== 'INACTIVE' && c.riskLevel !== 'BLOCKED').length,
    receivables: contacts.reduce((s, c) => s + (c.outstandingBalance ?? 0), 0),
    overdue: contacts.filter(c => (c.outstandingBalance ?? 0) > 0).length,
  };

  const handleExport = () => {
    const headers = 'Name,Email,Phone,TIN,Status,Outstanding Balance\n';
    const rows = filtered.map(c => `"${c.name}","${c.email ?? ''}","${c.phone ?? ''}","${c.tin ?? ''}","${c.status ?? 'ACTIVE'}",${c.outstandingBalance ?? 0}`).join('\n');
    downloadCSV(headers + rows, `contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Contacts exported');
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="ovds-grid-layout cols-4 gap-lg">
        <MetricCard
          title="Total Contacts"
          amount={stats.total.toString()}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Active"
          amount={stats.active.toString()}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Gross Receivables"
          amount={fmt(stats.receivables)}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Overdue Accounts"
          amount={stats.overdue.toString()}
          percentage={0}
          isPositive={true}
        />
      </div>

      {/* Table card */}
      <div className="ovds-panel overflow-hidden flex flex-col">
        <div className="p-6 border-b border-ovds-border flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-950/20">
          <div className="relative flex-1 w-full group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or TIN..."
              className="w-full pl-12 pr-6 py-4 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-400/10 transition-all dark:text-slate-200 shadow-sm" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {(['ALL', 'ACTIVE', 'BLOCKED'] as const).map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-700 text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={handleExport} className="p-3.5 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:shadow-md transition-all active:scale-95">
              <Download size={18} />
            </button>
            <button onClick={fetchContacts} className="p-3.5 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:shadow-md transition-all active:scale-95">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => { setEditContact(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 uppercase tracking-widest">
              <Plus size={18} strokeWidth={3} /> Add Contact
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px] scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4">
              <RefreshCw size={40} className="text-emerald-600 animate-spin" strokeWidth={2.5} />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Loading Contacts...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <EmptyState
                message={search ? 'No Matches Found' : 'No Contacts Yet'}
                description={search ? 'Try a different search term.' : 'Add your first contact to start tracking relationships.'}
                action={!search ? { label: 'Add Contact', onClick: () => { setEditContact(null); setShowModal(true); } } : undefined}
              />
            </div>
          ) : (
            <table className="ovds-table w-full text-left">
              <thead>
                <tr className="bg-emerald-50 border-b border-ovds-border dark:border-ovds-muted-dark">
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Contact</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Company / Role</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Contact Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-right">Balance</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ovds-border dark:divide-ovds-muted-dark">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-emerald-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <Avatar name={c.name} size="sm" />
                        <div>
                          <p className="text-sm font-black text-ovds-text-main dark:text-ovds-surface">{c.name}</p>
                          {c.tin && <p className="text-[10px] font-bold text-ovds-text-subtle uppercase tracking-wider mt-0.5">TIN: {c.tin}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-ovds-text-main dark:text-ovds-surface">{c.companyName || '—'}</p>
                      {c.jobTitle && <p className="text-[10px] font-bold text-ovds-text-subtle mt-0.5">{c.jobTitle}</p>}
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        {c.email && <div className="flex items-center gap-2 text-xs font-bold text-ovds-text-subtle"><Mail size={12} className="text-ovds-text-subtle/50" />{c.email}</div>}
                        {c.phone && <div className="flex items-center gap-2 text-xs font-bold text-ovds-text-subtle"><Phone size={12} className="text-ovds-text-subtle/50" />{c.phone}</div>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className={`text-sm font-black tabular-nums ${(c.outstandingBalance ?? 0) > 0 ? 'text-rose-600' : 'text-ovds-text-main dark:text-ovds-surface'}`}>
                        {fmt(c.outstandingBalance ?? 0)}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        c.status === 'BLOCKED' ? 'bg-rose-50 text-rose-600' :
                        c.status === 'INACTIVE' ? 'bg-ovds-muted text-ovds-text-subtle dark:bg-ovds-muted-dark' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {c.status ?? 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditContact(c); setShowModal(true); }}
                          className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                          <Edit2 size={14} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all">
                          <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ContactModal
          contact={editContact}
          onClose={() => { setShowModal(false); setEditContact(null); }}
          onSave={fetchContacts}
          companyId={companyId}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPANIES TAB
// ══════════════════════════════════════════════════════════════════════════════
const CompaniesTab: React.FC<{ companyId: string; can: (p: Permission) => boolean }> = ({ companyId, can }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchCompanies = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/crm/companies?companyId=${companyId}`);
      const data = res.data?.data ?? res.data;
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      // Fallback: show empty state if endpoint doesn't exist yet
      setCompanies([]);
    } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleDelete = async (id: string) => {
    if (!can('crm:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: 'Delete Company?', message: 'This will remove the company from your CRM.', variant: 'danger' }))) return;
    try {
      await api.delete(`/crm/companies/${id}`);
      setCompanies(prev => prev.filter(c => c.id !== id));
      toast.success('Company deleted');
    } catch { toast.error('Failed to delete company'); }
  };

  const filtered = companies.filter(c => {
    const q = debouncedSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.industry ?? '').toLowerCase().includes(q);
  });

  const INDUSTRY_COLORS: Record<string, string> = {
    Technology: 'bg-emerald-50 text-emerald-600', ovds: 'bg-emerald-50 text-emerald-600',
    Healthcare: 'bg-rose-50 text-rose-600', Manufacturing: 'bg-amber-50 text-amber-600',
    Retail: 'bg-violet-50 text-violet-600', Agriculture: 'bg-lime-50 text-lime-600',
  };

  return (
    <div className="space-y-8">
      <div className="ovds-grid-layout cols-3 gap-lg">
        <MetricCard
          title="Total Companies"
          amount={companies.length.toString()}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Active"
          amount={companies.filter(c => c.status !== 'INACTIVE').length.toString()}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Total Revenue"
          amount={fmt(companies.reduce((s, c) => s + (c.totalRevenue ?? 0), 0))}
          percentage={0}
          isPositive={true}
        />
      </div>

      <div className="ovds-panel overflow-hidden">
        <div className="p-6 border-b border-ovds-border flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-950/20">
          <div className="relative flex-1 w-full group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..."
              className="w-full pl-12 pr-6 py-4 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-400/10 transition-all dark:text-slate-200 shadow-sm" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchCompanies} className="p-3.5 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-violet-600 hover:shadow-md transition-all active:scale-95">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => { setEditCompany(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black transition-all shadow-xl shadow-emerald-500/30 active:scale-95 uppercase tracking-widest">
              <Plus size={18} strokeWidth={3} /> Add Company
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px] scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4">
              <RefreshCw size={40} className="text-violet-600 animate-spin" strokeWidth={2.5} />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Loading Companies...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <EmptyState
                message={search ? 'No Matches Found' : 'No Companies Yet'}
                description={search ? 'Try a different search term.' : 'Add your first company to organize your CRM.'}
                action={!search ? { label: 'Add Company', onClick: () => { setEditCompany(null); setShowModal(true); } } : undefined}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-8">
              {filtered.map(c => (
                <div key={c.id} className="ovds-panel p-6 hover:shadow-md hover:border-violet-200 transition-all group">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-ovds-text-main dark:text-ovds-surface leading-tight">{c.name}</p>
                        {c.industry && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest mt-1 ${INDUSTRY_COLORS[c.industry] ?? 'bg-slate-100 text-slate-500'}`}>
                            {c.industry}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditCompany(c); setShowModal(true); }}
                        className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 hover:bg-violet-100 transition-all">
                        <Edit2 size={13} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 transition-all">
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-5">
                    {c.email && <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Mail size={12} className="text-slate-300 shrink-0" /><span className="truncate">{c.email}</span></div>}
                    {c.phone && <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Phone size={12} className="text-slate-300 shrink-0" />{c.phone}</div>}
                    {c.website && <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Globe size={12} className="text-slate-300 shrink-0" /><span className="truncate">{c.website}</span></div>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacts</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{c.contactCount ?? 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deals</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{c.dealCount ?? 0}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      c.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                    }`}>
                      {c.status ?? 'ACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CompanyModal
          company={editCompany}
          onClose={() => { setShowModal(false); setEditCompany(null); }}
          onSave={fetchCompanies}
          companyId={companyId}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// DEALS TAB (Kanban + List)
// ══════════════════════════════════════════════════════════════════════════════
const DealsTab: React.FC<{ companyId: string; can: (p: Permission) => boolean }> = ({ companyId, can }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<DealStage | ''>('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const fetchDeals = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await api.get('/crm/deals?companyId=' + companyId + '&take=200');
      const raw = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setDeals(Array.isArray(raw) ? raw : []);
    } catch { setDeals([]); }
    finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const handleMove = async (id: string, stage: DealStage) => {
    try {
      const prob = DEAL_STAGES.find(s => s.key === stage)?.prob ?? 10;
      await api.patch('/crm/deals/' + id, { stage, probability: prob });
      setDeals(prev => prev.map(d => d.id === id ? { ...d, stage, probability: prob } : d));
      toast.success('Moved to ' + DEAL_STAGES.find(s => s.key === stage)?.label);
    } catch { toast.error('Failed to move deal'); }
  };

  const handleDelete = async (id: string) => {
    if (!can('crm:deals:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: 'Delete Deal?', message: 'This will permanently remove the deal from your pipeline.', variant: 'danger' }))) return;
    try {
      await api.delete('/crm/deals/' + id);
      setDeals(prev => prev.filter(d => d.id !== id));
      toast.success('Deal deleted');
    } catch { toast.error('Failed to delete deal'); }
  };

  const filtered = deals.filter(d => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || d.title.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q);
    const matchStage = !stageFilter || d.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const stats = {
    total: deals.length,
    pipeline: deals.filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).reduce((s, d) => s + d.value, 0),
    won: deals.filter(d => d.stage === 'CLOSED_WON').reduce((s, d) => s + d.value, 0),
    winRate: (() => {
      const closed = deals.filter(d => ['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage));
      return closed.length > 0 ? Math.round((deals.filter(d => d.stage === 'CLOSED_WON').length / closed.length) * 100) : 0;
    })(),
  };

  const STAGE_CONFIG: Record<DealStage, { headerBg: string; cardBg: string; border: string; dot: string; color: string }> = {
    LEAD:        { headerBg: 'bg-slate-100 dark:bg-slate-800',        cardBg: 'bg-slate-50/60 dark:bg-slate-800/40',   border: 'border-slate-200 dark:border-slate-700',   dot: 'bg-slate-400',   color: 'text-slate-600 dark:text-slate-300' },
    QUALIFIED:   { headerBg: 'bg-emerald-50 dark:bg-emerald-950/30',        cardBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',     border: 'border-emerald-200 dark:border-emerald-800',     dot: 'bg-emerald-500',    color: 'text-emerald-600 dark:text-emerald-400' },
    PROPOSAL:    { headerBg: 'bg-teal-50 dark:bg-teal-950/30',    cardBg: 'bg-teal-50/40 dark:bg-teal-950/20', border: 'border-teal-200 dark:border-teal-800', dot: 'bg-teal-500',  color: 'text-teal-600 dark:text-teal-400' },
    NEGOTIATION: { headerBg: 'bg-amber-50 dark:bg-amber-950/30',      cardBg: 'bg-amber-50/40 dark:bg-amber-950/20',   border: 'border-amber-200 dark:border-amber-800',   dot: 'bg-amber-400',   color: 'text-amber-600 dark:text-amber-400' },
    CLOSED_WON:  { headerBg: 'bg-emerald-50 dark:bg-emerald-950/30',  cardBg: 'bg-emerald-50/40 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', color: 'text-emerald-600 dark:text-emerald-400' },
    CLOSED_LOST: { headerBg: 'bg-rose-50 dark:bg-rose-950/30',        cardBg: 'bg-rose-50/40 dark:bg-rose-950/20',     border: 'border-rose-200 dark:border-rose-800',     dot: 'bg-rose-400',    color: 'text-rose-600 dark:text-rose-400' },
  };

  return (
    <div className="space-y-8">
      <div className="ovds-grid-layout cols-4 gap-lg">
        <MetricCard
          title="Pipeline Value"
          amount={fmt(stats.pipeline)}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Revenue Won"
          amount={fmt(stats.won)}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Win Rate"
          amount={`${stats.winRate}%`}
          percentage={parseFloat("+2.4%") || 0}
          isPositive={!String("+2.4%").includes('-')}
        />
        <MetricCard
          title="Total Deals"
          amount={stats.total.toString()}
          percentage={0}
          isPositive={true}
        />
      </div>

      <div className="ovds-panel flex flex-col min-h-[600px] overflow-hidden">
        <div className="p-6 border-b border-ovds-border flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals or contacts..."
              className="w-full pl-12 pr-4 py-3 bg-emerald-50 border-transparent rounded-2xl text-sm font-black focus:bg-ovds-surface dark:bg-ovds-surface-dark focus:ring-4 focus:ring-teal-400/10 transition-all text-emerald-800" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-emerald-50 p-1.5 rounded-2xl">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-xl transition-all ${view === 'kanban' ? 'bg-ovds-surface dark:bg-ovds-surface-dark text-emerald-600 shadow-lg' : 'text-emerald-400 hover:text-emerald-600'}`}
              >
                <LayoutGrid size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-xl transition-all ${view === 'list' ? 'bg-ovds-surface dark:bg-ovds-surface-dark text-emerald-600 shadow-lg' : 'text-emerald-400 hover:text-emerald-600'}`}
              >
                <List size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="relative">
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value as DealStage | '')}
                className="pl-4 pr-10 py-3 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-4 focus:ring-teal-400/10 appearance-none transition-all">
                <option value="">All Stages</option>
                {DEAL_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
            </div>
            <button onClick={() => { setEditDeal(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black transition-all shadow-xl shadow-emerald-500/30 active:scale-95 uppercase tracking-widest">
              <Plus size={18} strokeWidth={3} /> New Deal
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-8 scrollbar-hide">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-32">
              <RefreshCw size={40} className="text-emerald-600 animate-spin" strokeWidth={2.5} />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Loading Pipeline...</p>
            </div>
          ) : view === 'kanban' ? (
            <div className="flex gap-6 h-full min-w-max">
              {DEAL_STAGES.map(stage => {
                const cfg = STAGE_CONFIG[stage.key];
                const stageDeals = filtered.filter(d => d.stage === stage.key);
                const stageTotal = stageDeals.reduce((s, d) => s + d.value, 0);
                const nextStage = DEAL_STAGES[DEAL_STAGES.findIndex(s => s.key === stage.key) + 1];
                return (
                  <div key={stage.key} className="w-72 flex flex-col gap-4">
                    <div className={`p-4 rounded-[1.5rem] ${cfg.headerBg} border ${cfg.border} flex items-center justify-between shadow-sm`}>
                      <div>
                        <h3 className={`text-[10px] font-black uppercase tracking-[0.15em] ${cfg.color}`}>{stage.label}</h3>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase">{stageDeals.length} deals · {fmt(stageTotal)}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                    </div>
                    <div className="flex-1 space-y-4 min-h-[300px]">
                      {stageDeals.map(deal => (
                        <div key={deal.id}
                          className="bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-4 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/40 transition-all group cursor-pointer"
                          onClick={() => { setEditDeal(deal); setShowModal(true); }}>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <p className="text-sm font-black text-ovds-text-main dark:text-ovds-surface leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">{deal.title}</p>
                            <button onClick={e => { e.stopPropagation(); handleDelete(deal.id); }}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-3 ovds-label">
                            <Users size={11} className="text-emerald-600" />
                            <span className="truncate">{deal.customerName}</span>
                          </div>
                          <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-2.5 mb-3">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Value</p>
                              <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{fmt(deal.value)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win %</p>
                              <p className="text-sm font-black text-slate-900 dark:text-white">{deal.probability}%</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 ovds-label">
                              <Clock size={11} strokeWidth={3} className="text-slate-300" />
                              {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'short' }) : 'Pending'}
                            </div>
                            {nextStage && !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage) && (
                              <button onClick={e => { e.stopPropagation(); handleMove(deal.id, nextStage.key); }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500 text-[9px] font-black text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest">
                                {nextStage.label} <ArrowRight size={11} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[1.5rem] p-10 flex flex-col items-center justify-center text-center opacity-40">
                          <Plus size={20} strokeWidth={2.5} className="text-slate-300 mb-2" />
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ovds-panel overflow-hidden">
              <table className="ovds-table w-full text-left">
                <thead>
                  <tr className="bg-emerald-50/50 border-b border-ovds-border">
                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Deal</th>
                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Contact</th>
                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-right">Value</th>
                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-center">Stage</th>
                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Close Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filtered.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-ovds-text-main dark:text-ovds-surface">{d.title}</p>
                        {d.assignedTo && <p className="text-[10px] font-bold text-slate-400 mt-0.5">Rep: {d.assignedTo}</p>}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar name={d.customerName} size="sm" />
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{d.customerName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-sm font-black text-ovds-text-main dark:text-ovds-surface tabular-nums">{fmt(d.value)}</p>
                        <p className="text-[10px] font-bold text-slate-400">{d.probability}% win</p>
                      </td>
                      <td className="px-8 py-5 text-center"><StageBadge stage={d.stage} /></td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                          {d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditDeal(d); setShowModal(true); }}
                            className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-ovds-border transition-all">
                            <Edit2 size={14} strokeWidth={2.5} />
                          </button>
                          <button onClick={() => handleDelete(d.id)}
                            className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 transition-all">
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <DealModal
          deal={editDeal}
          onClose={() => { setShowModal(false); setEditDeal(null); }}
          onSaved={fetchDeals}
          companyId={companyId}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES TAB
// ══════════════════════════════════════════════════════════════════════════════
const ActivitiesTab: React.FC<{ companyId: string; can: (p: Permission) => boolean }> = ({ companyId, can }) => {
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editActivity, setEditActivity] = useState<CRMActivity | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const fetchActivities = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/crm/activities?companyId=${companyId}&take=100`);
      const data = res.data?.data ?? res.data;
      setActivities(Array.isArray(data) ? data : []);
    } catch { setActivities([]); }
    finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleMarkDone = async (id: string) => {
    try {
      await api.patch('/crm/activities/' + id, { status: 'DONE', completedAt: new Date().toISOString() });
      setActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'DONE' as ActivityStatus } : a));
      toast.success('Activity marked as done');
    } catch { toast.error('Failed to update activity'); }
  };

  const handleDelete = async (id: string) => {
    if (!can('crm:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: 'Delete Activity?', message: 'This will remove the activity log permanently.', variant: 'danger' }))) return;
    try {
      await api.delete('/crm/activities/' + id);
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success('Activity deleted');
    } catch { toast.error('Failed to delete activity'); }
  };

  const filtered = activities.filter(a => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || (a.contactName ?? '').toLowerCase().includes(q) || (a.dealTitle ?? '').toLowerCase().includes(q);
    const matchType = !typeFilter || a.type === typeFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: activities.length,
    pending: activities.filter(a => a.status === 'PENDING').length,
    done: activities.filter(a => a.status === 'DONE').length,
    overdue: activities.filter(a => a.status === 'PENDING' && a.dueDate && new Date(a.dueDate) < new Date()).length,
  };

  const ACTIVITY_TYPES: ActivityType[] = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'FOLLOW_UP'];
  const TYPE_LABELS: Record<ActivityType, string> = { CALL: 'Call', EMAIL: 'Email', MEETING: 'Meeting', TASK: 'Task', NOTE: 'Note', FOLLOW_UP: 'Follow-up' };

  const isOverdue = (a: CRMActivity) => a.status === 'PENDING' && !!a.dueDate && new Date(a.dueDate) < new Date();

  return (
    <div className="space-y-8">
      <div className="ovds-grid-layout cols-4 gap-lg">
        <MetricCard
          title="Total Activities"
          amount={stats.total.toString()}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Pending"
          amount={stats.pending.toString()}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Completed"
          amount={stats.done.toString()}
          percentage={0}
          isPositive={true}
        />
        <MetricCard
          title="Overdue"
          amount={stats.overdue.toString()}
          percentage={0}
          isPositive={true}
        />
      </div>

      <div className="ovds-panel overflow-hidden">
        <div className="p-6 border-b border-ovds-border flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-950/20">
          <div className="relative flex-1 w-full group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities..."
              className="w-full pl-12 pr-6 py-4 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 transition-all dark:text-slate-200 shadow-sm" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as ActivityType | '')}
                className="pl-4 pr-10 py-3 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none appearance-none transition-all">
                <option value="">All Types</option>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ActivityStatus | '')}
                className="pl-4 pr-10 py-3 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none appearance-none transition-all">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={fetchActivities} className="p-3.5 rounded-2xl bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-600 hover:shadow-md transition-all active:scale-95">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => { setEditActivity(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[11px] font-black transition-all shadow-xl shadow-amber-500/30 active:scale-95 uppercase tracking-widest">
              <Plus size={18} strokeWidth={3} /> Log Activity
            </button>
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4">
              <RefreshCw size={40} className="text-amber-500 animate-spin" strokeWidth={2.5} />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Loading Activities...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <EmptyState
                message={search ? 'No Matches Found' : 'No Activities Yet'}
                description={search ? 'Try a different search term.' : 'Log your first customer interaction to start tracking.'}
                action={!search ? { label: 'Log Activity', onClick: () => { setEditActivity(null); setShowModal(true); } } : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map(a => (
                <div key={a.id} className={`flex items-start gap-5 px-8 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group ${isOverdue(a) ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                  {/* Type icon */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    a.type === 'CALL' ? 'bg-emerald-50' :
                    a.type === 'EMAIL' ? 'bg-violet-50 dark:bg-violet-900/20' :
                    a.type === 'MEETING' ? 'bg-emerald-50' :
                    a.type === 'TASK' ? 'bg-amber-50 dark:bg-amber-900/20' :
                    a.type === 'FOLLOW_UP' ? 'bg-rose-50 dark:bg-rose-900/20' :
                    'bg-white dark:bg-slate-800'
                  }`}>
                    <ActivityIcon type={a.type} size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-black leading-tight ${a.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{a.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {a.contactName && (
                            <span className="flex items-center gap-1.5 ovds-label">
                              <Users size={11} className="text-emerald-400" />{a.contactName}
                            </span>
                          )}
                          {a.dealTitle && (
                            <span className="flex items-center gap-1.5 ovds-label">
                              <Briefcase size={11} className="text-emerald-400" />{a.dealTitle}
                            </span>
                          )}
                          {a.assignedTo && (
                            <span className="flex items-center gap-1.5 ovds-label">
                              <Users2 size={11} className="text-violet-400" />{a.assignedTo}
                            </span>
                          )}
                        </div>
                        {a.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium line-clamp-2">{a.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          a.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' :
                          a.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' :
                          isOverdue(a) ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' :
                          'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                        }`}>
                          {isOverdue(a) ? 'Overdue' : a.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 ovds-label">
                        <Clock size={11} strokeWidth={3} className="text-slate-300" />
                        {a.dueDate ? new Date(a.dueDate).toLocaleString('en-ET', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No due date'}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {a.status === 'PENDING' && (
                          <button onClick={() => handleMarkDone(a.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-ovds-border transition-all">
                            <Check size={12} strokeWidth={3} /> Done
                          </button>
                        )}
                        <button onClick={() => { setEditActivity(a); setShowModal(true); }}
                          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 transition-all">
                          <Edit2 size={13} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleDelete(a.id)}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 transition-all">
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ActivityModal
          activity={editActivity}
          onClose={() => { setShowModal(false); setEditActivity(null); }}
          onSaved={fetchActivities}
          companyId={companyId}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB (Pipelines, Activity Types, Customer Stages)
// ══════════════════════════════════════════════════════════════════════════════
const SettingsTab: React.FC<{ companyId: string; can: (p: Permission) => boolean }> = ({ companyId, can }) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [editPipeline, setEditPipeline] = useState<Pipeline | null>(null);
  const [activeSection, setActiveSection] = useState<'pipelines' | 'activity_types' | 'stages'>('pipelines');

  // Activity types config (local state — can be persisted via API)
  const [activityTypes, setActivityTypes] = useState([
    { key: 'CALL',      label: 'Phone Call',   icon: 'phone',    color: '#00E784', enabled: true },
    { key: 'EMAIL',     label: 'Email',        icon: 'mail',     color: '#8b5cf6', enabled: true },
    { key: 'MEETING',   label: 'Meeting',      icon: 'users',    color: '#00E784', enabled: true },
    { key: 'TASK',      label: 'Task',         icon: 'check',    color: '#f59e0b', enabled: true },
    { key: 'NOTE',      label: 'Note',         icon: 'note',     color: '#94a3b8', enabled: true },
    { key: 'FOLLOW_UP', label: 'Follow-up',    icon: 'bell',     color: '#ef4444', enabled: true },
  ]);

  const fetchPipelines = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/crm/pipelines?companyId=${companyId}`);
      const data = res.data?.data ?? res.data;
      setPipelines(Array.isArray(data) ? data : []);
    } catch { setPipelines([]); }
    finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);

  const handleDeletePipeline = async (id: string) => {
    if (!can('crm:write')) { toast.error('Insufficient permissions'); return; }
    if (!(await confirm({ title: 'Delete Pipeline?', message: 'All deals in this pipeline will be unlinked. This cannot be undone.', variant: 'danger' }))) return;
    try {
      await api.delete('/crm/pipelines/' + id);
      setPipelines(prev => prev.filter(p => p.id !== id));
      toast.success('Pipeline deleted');
    } catch { toast.error('Failed to delete pipeline'); }
  };

  const SECTIONS = [
    { key: 'pipelines',      label: 'Pipelines',       icon: <Layers size={16} /> },
    { key: 'activity_types', label: 'Activity Types',  icon: <Activity size={16} /> },
    { key: 'stages',         label: 'Customer Stages', icon: <Flag size={16} /> },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Section nav */}
      <div className="flex gap-2 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeSection === s.key
                ? 'bg-emerald-900 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* -- Pipelines -- */}
      {activeSection === 'pipelines' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Sales Pipelines</h3>
              <p className="text-sm text-slate-400 font-bold mt-1">Configure deal stages and customer journey steps</p>
            </div>
            <button onClick={() => { setEditPipeline(null); setShowPipelineModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[11px] font-black transition-all shadow-xl shadow-emerald-500/30 active:scale-95 uppercase tracking-widest">
              <Plus size={18} strokeWidth={3} /> New Pipeline
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw size={32} className="text-emerald-600 animate-spin" />
            </div>
          ) : pipelines.length === 0 ? (
            <div className="ovds-panel p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                <Layers size={28} className="text-emerald-600" />
              </div>
              <h4 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-2">No Pipelines Yet</h4>
              <p className="text-sm text-slate-400 font-bold mb-6 max-w-sm">Create your first pipeline to define the stages your deals move through.</p>
              <button onClick={() => { setEditPipeline(null); setShowPipelineModal(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-emerald-500/30">
                <Plus size={18} strokeWidth={3} /> Create Pipeline
              </button>
            </div>
          ) : (
            <div className="ovds-grid-layout cols-2 gap-lg">
              {pipelines.map(p => (
                <div key={p.id} className="ovds-panel p-6 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100">{p.name}</h4>
                        {p.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 rounded-lg text-[9px] font-black uppercase tracking-widest">Default</span>
                        )}
                      </div>
                      {p.description && <p className="text-xs text-slate-400 font-bold mt-1">{p.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditPipeline(p); setShowPipelineModal(true); }}
                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-ovds-border transition-all">
                        <Edit2 size={14} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleDeletePipeline(p.id)}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 transition-all">
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {/* Stage pills */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(p.stages ?? []).map((stage, idx) => (
                      <div key={stage.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{stage.name}</span>
                        <span className="text-[9px] font-bold text-slate-400">{stage.probability}%</span>
                        {idx < (p.stages?.length ?? 0) - 1 && <ArrowRight size={10} className="text-slate-300 ml-1" />}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deals</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">{p.dealCount ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">{fmt(p.totalValue ?? 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stages</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">{p.stages?.length ?? 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -- Activity Types -- */}
      {activeSection === 'activity_types' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Activity Types</h3>
            <p className="text-sm text-slate-400 font-bold mt-1">Configure the types of interactions you track in your CRM</p>
          </div>
          <div className="ovds-panel overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {activityTypes.map((at, idx) => (
                <div key={at.key} className="flex items-center gap-5 px-8 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: at.color + '20' }}>
                    <ActivityIcon type={at.key as ActivityType} size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-ovds-text-main dark:text-ovds-surface">{at.label}</p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{at.key}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="color" value={at.color}
                      onChange={e => setActivityTypes(prev => prev.map((a, i) => i === idx ? { ...a, color: e.target.value } : a))}
                      className="w-8 h-8 rounded-xl border-2 border-white shadow-sm cursor-pointer" />
                    <div className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${at.enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      onClick={() => setActivityTypes(prev => prev.map((a, i) => i === idx ? { ...a, enabled: !a.enabled } : a))}>
                      <div className={`absolute top-1 w-4 h-4 bg-ovds-surface dark:bg-ovds-surface-dark rounded-full shadow transition-all ${at.enabled ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-800/50 flex gap-4">
            <div className="w-10 h-10 bg-ovds-surface dark:bg-ovds-surface-dark dark:bg-slate-800 rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0 mt-1">
              <Info size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 dark:text-amber-100">Activity Type Configuration</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed mt-1 font-bold">
                Toggle activity types on/off to control which options appear when logging interactions. Color changes are applied immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* -- Customer Stages -- */}
      {activeSection === 'stages' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Customer Stages</h3>
            <p className="text-sm text-slate-400 font-bold mt-1">Define the lifecycle stages for your contacts and leads</p>
          </div>
          <div className="ovds-panel overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {[
                { key: 'LEAD',       label: 'Lead',       desc: 'Initial contact, not yet qualified',          color: '#94a3b8' },
                { key: 'PROSPECT',   label: 'Prospect',   desc: 'Showing interest, needs nurturing',           color: '#00E784' },
                { key: 'QUALIFIED',  label: 'Qualified',  desc: 'Meets criteria, ready for proposal',          color: '#8b5cf6' },
                { key: 'CUSTOMER',   label: 'Customer',   desc: 'Active paying customer',                      color: '#00E784' },
                { key: 'CHAMPION',   label: 'Champion',   desc: 'Loyal advocate, refers new business',         color: '#f59e0b' },
                { key: 'CHURNED',    label: 'Churned',    desc: 'Previously active, no longer engaged',        color: '#ef4444' },
              ].map(stage => (
                <div key={stage.key} className="flex items-center gap-5 px-8 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-black text-ovds-text-main dark:text-ovds-surface">{stage.label}</p>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">{stage.desc}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl uppercase tracking-widest">{stage.key}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-emerald-50 rounded-3xl border border-ovds-border flex gap-4">
            <div className="w-10 h-10 bg-ovds-surface dark:bg-ovds-surface-dark rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0 mt-1">
              <Zap size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100">Customer Journey Tracking</h4>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed mt-1 font-bold">
                Customer stages help you understand where each contact is in their journey. Move contacts between stages as relationships develop.
              </p>
            </div>
          </div>
        </div>
      )}

      {showPipelineModal && (
        <PipelineSettingsModal
          pipeline={editPipeline}
          onClose={() => { setShowPipelineModal(false); setEditPipeline(null); }}
          onSaved={fetchPipelines}
          companyId={companyId}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CRM PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function CRM() {
  usePageTitle('CRM');
  const { can } = useAuth();
  const { selectedCompanyId, loading: businessLoading } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from URL path segment, default to contacts
  const getTabFromLocation = (): CRMTab => {
    const segment = location.pathname.split('/').pop() as CRMTab;
    if (['contacts', 'companies', 'deals', 'activities', 'settings'].includes(segment)) return segment;
    return 'contacts';
  };
  const [activeTab, setActiveTab] = useState<CRMTab>(getTabFromLocation);

  // Sync tab when URL changes externally (sidebar nav, back/forward)
  useEffect(() => {
    setActiveTab(getTabFromLocation());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleTabChange = (tab: CRMTab) => {
    setActiveTab(tab);
    navigate(`/crm/${tab}`, { replace: true });
  };

  const TABS: { key: CRMTab; label: string; icon: React.ReactNode; color: string; permission?: Permission }[] = [
    { key: 'contacts',   label: 'Contacts',   icon: <Users size={16} />,      color: 'text-emerald-600',    permission: 'crm:read' },
    { key: 'companies',  label: 'Companies',  icon: <Building2 size={16} />,  color: 'text-violet-600',  permission: 'crm:read' },
    { key: 'deals',      label: 'Deals',      icon: <Briefcase size={16} />,  color: 'text-emerald-600', permission: 'crm:deals:read' },
    { key: 'activities', label: 'Activities', icon: <Activity size={16} />,   color: 'text-amber-600',   permission: 'crm:activities:read' },
    { key: 'settings',   label: 'Settings',   icon: <Settings size={16} />,   color: 'text-slate-600',   permission: 'crm:settings:read' },
  ];

  const visibleTabs = TABS.filter(t => !t.permission || can(t.permission));

  const TAB_ACCENT: Record<CRMTab, string> = {
    contacts:   'border-emerald-600 text-emerald-600',
    companies:  'border-violet-600 text-violet-600',
    deals:      'border-emerald-600 text-emerald-600',
    activities: 'border-amber-500 text-amber-600',
    settings:   'border-slate-600 text-slate-600',
  };

  if (businessLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <RefreshCw size={40} className="text-emerald-600 animate-spin" strokeWidth={2.5} />
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Loading CRM...</p>
      </div>
    );
  }

  if (!selectedCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center">
          <Users size={36} className="text-emerald-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Select a Company</h2>
          <p className="text-sm text-slate-400 font-bold mt-2">Choose a company from the header to access your CRM.</p>
        </div>
      </div>
    );
  }

  return (
    <AppPage
      title="CRM"
      subtitle="Manage contacts, companies, deals, and customer journeys — all in one place. CRM · Customer Relationship Management · Consumer Insights · Market Segmentation · Banking & ovds · Retail & E-commerce · IT & Software · Competitive Landscape"
      icon={<Users2 size={18} />}
      iconBg="bg-gradient-to-br from-emerald-500 to-indigo-600"
      crumbs={[{ label: 'CRM' }]}
      actions={
        <>
          <Btn variant="secondary" size="sm" icon={<UserPlus size={14} />} onClick={() => handleTabChange('contacts')}>Add Contact</Btn>
          <Btn variant="secondary" size="sm" icon={<Briefcase size={14} />} onClick={() => handleTabChange('deals')}>New Deal</Btn>
          <Btn variant="primary" size="sm" icon={<Activity size={14} />} onClick={() => handleTabChange('activities')}>Log Activity</Btn>
        </>
      }
    >
      {/* -- Tab Navigation — ovds style -- */}
      <div className="ovds-panel overflow-hidden">
        <div className="ovds-tab-nav border-b border-slate-100 dark:border-slate-800">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`ovds-tab ${activeTab === tab.key ? 'active' : ''}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* -- Tab Content -- */}
        <div className="p-8">
          {activeTab === 'contacts' && (
            <ContactsTab companyId={selectedCompanyId!} can={can} />
          )}
          {activeTab === 'companies' && (
            <CompaniesTab companyId={selectedCompanyId!} can={can} />
          )}
          {activeTab === 'deals' && (
            <DealsTab companyId={selectedCompanyId!} can={can} />
          )}
          {activeTab === 'activities' && (
            <ActivitiesTab companyId={selectedCompanyId!} can={can} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab companyId={selectedCompanyId!} can={can} />
          )}
        </div>
      </div>
    </AppPage>
  );
}




