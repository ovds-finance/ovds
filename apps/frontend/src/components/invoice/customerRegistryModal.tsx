import React, { useState, useCallback } from 'react';
import {
  Plus, Users, X, Mail, Phone, MapPin, Edit2, Trash2,
  Search, BadgeCheck, FileDown, StickyNote, Building2,
  Percent, Wallet, Calendar, ChevronRight, Info, RefreshCw,
  Hash, ArrowLeft,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { downloadCSV } from '../../utils/download';
import { confirm } from '../../utils/confirm';
import CustomFieldRenderer, { type CustomFieldValuesMap } from '../CustomFieldRenderer';

interface CustomerRegistryModalProps {
  customers: any[];
  loading?: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onSelect: (c: any) => void;
  companyId?: string;
}

// -- Design tokens (Ovds-inspired) ---------------------------------------
const inp = 'aki-input';
const lbl = 'aki-label';

const RISK_META: Record<string, { label: string; color: string; bg: string; dot: string; activeBg: string }> = {
  LOW:     { label: 'Low Risk',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30', dot: 'bg-emerald-500', activeBg: 'bg-emerald-100 text-emerald-700 border-emerald-400' },
  MEDIUM:  { label: 'Medium Risk', color: 'text-amber-700 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30',       dot: 'bg-amber-500',   activeBg: 'bg-amber-100 text-amber-700 border-amber-400' },
  HIGH:    { label: 'High Risk',   color: 'text-orange-700 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30',   dot: 'bg-orange-500', activeBg: 'bg-orange-100 text-orange-700 border-orange-400' },
  BLOCKED: { label: 'Blocked',     color: 'text-rose-700 dark:text-rose-400',      bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/30',           dot: 'bg-rose-500',   activeBg: 'bg-rose-100 text-rose-700 border-rose-400' },
};

// -- Customer Detail Panel (Ovds style) ----------------------------------
const CustomerDetail: React.FC<{
  customer: any;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}> = ({ customer: c, onBack, onEdit, onDelete, onSelect }) => {
  const risk = RISK_META[c.riskLevel] ?? RISK_META.MEDIUM;
  const initials = c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
        style={{ color: 'var(--text-4)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--aki-blue)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
      >
        <ArrowLeft size={12} /> Back to Registry
      </button>

      {/* Profile card */}
      <div className="aki-card" style={{ borderRadius: '16px', padding: '24px' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg" style={{ background: 'var(--aki-blue)', boxShadow: 'var(--shadow)' }}>
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{c.name}</h2>
              <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${risk.bg} ${risk.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                {risk.label}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="aki-btn aki-btn-secondary"
              style={{ borderRadius: '12px' }}
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={onSelect}
              className="aki-btn aki-btn-primary"
            >
              Select <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="aki-grid cols-2 gap-4">
        {/* Contact */}
        <div className="aki-card" style={{ borderRadius: '16px', padding: '20px' }}>
          <p className="aki-kpi-label">Contact</p>
          {c.email && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--aki-blue-50)', color: 'var(--aki-blue)' }}>
                <Mail size={14} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Email</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.email}</p>
              </div>
            </div>
          )}
          {c.phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--aki-blue-50)', color: 'var(--aki-blue)' }}>
                <Phone size={14} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Phone</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.phone}</p>
              </div>
            </div>
          )}
          {c.address && (
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--aki-blue-50)', color: 'var(--aki-blue)' }}>
                 <MapPin size={14} />
               </div>
               <div>
                 <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Address</p>
                 <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>{c.address}</p>
               </div>
             </div>
           )}
           {(c.region || c.zone || c.kebele || c.city || c.houseNumber) && (
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--aki-blue-50)', color: 'var(--aki-blue)' }}>
                 <MapPin size={14} />
               </div>
               <div>
                 <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>B2B Address</p>
                 <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>
                   {[c.region, c.zone, c.wereda ? `Woreda ${c.wereda}` : null, c.kebele ? `Kebele ${c.kebele}` : null, c.city, c.houseNumber].filter(Boolean).join(', ') || '—'}
                 </p>
               </div>
             </div>
           )}
           {!c.email && !c.phone && !c.address && !(c.region || c.zone || c.kebele) && (
             <p className="text-xs italic" style={{ color: 'var(--text-4)' }}>No contact details on file</p>
           )}
        </div>

        {/* Fiscal */}
        <div className="aki-card" style={{ borderRadius: '16px', padding: '20px' }}>
          <p className="aki-kpi-label">Fiscal Details</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--aki-warning-bg)', color: 'var(--aki-warning-text)' }}>
              <Hash size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>TIN</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.tin || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface-alt)', color: 'var(--text-4)' }}>
              <Percent size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>VAT Number</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.vatNumber || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--aki-purple-bg, #EDE9FE)', color: 'var(--aki-purple-text, #6D28D9)' }}>
              <Calendar size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Payment Terms</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.paymentTerms || 'NET30'}</p>
            </div>
          </div>
          {c.creditLimit && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--aki-blue-50)', color: 'var(--aki-blue)' }}>
                <Wallet size={14} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Credit Limit</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  ETB {Number(c.creditLimit).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {c.notes && (
        <div className="aki-card" style={{ borderRadius: '16px', padding: '20px', background: 'var(--aki-warning-bg)', border: `1px solid var(--aki-warning-border)` }}>
          <div className="flex items-center gap-2 mb-2">
            <StickyNote size={14} style={{ color: 'var(--aki-warning-text)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--aki-warning-text)' }}>Notes</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{c.notes}</p>
        </div>
      )}

      {/* Danger zone */}
      <div className="aki-card" style={{ borderRadius: '16px', padding: '20px' }}>
        <p className="aki-kpi-label" style={{ marginBottom: '12px' }}>Danger Zone</p>
        <button
          onClick={onDelete}
          className="aki-btn flex items-center gap-2"
          style={{ borderRadius: '12px', background: 'var(--aki-danger-bg)', color: 'var(--aki-danger-text)', border: `1px solid var(--aki-danger-border)` }}
        >
          <Trash2 size={14} /> Remove from Registry
        </button>
      </div>
    </div>
  );
};

const CustomerRegistryModal: React.FC<CustomerRegistryModalProps> = ({
  customers,
  loading = false,
  onClose,
  onRefresh,
  onSelect,
  companyId,
}) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [view, setView] = useState<'list' | 'add' | 'detail'>('list');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', tin: '', vatNumber: '',
    notes: '', paymentTerms: 'NET30', creditLimit: '', riskLevel: 'MEDIUM',
    preferredInteractionType: 'EMAIL',
    region: '', zone: '', kebele: '', wereda: '', city: '', houseNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [tinValidating, setTinValidating] = useState(false);
  const [tab, setTab] = useState<'IDENTITY' | 'ADDRESS' | 'FISCAL'>('IDENTITY');
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValuesMap>({});
  const handleCustomFieldChange = useCallback((values: CustomFieldValuesMap) => {
    setCustomFieldValues(values);
  }, []);

  const blankForm = () => ({
    name: '', email: '', phone: '', address: '', tin: '', vatNumber: '',
    notes: '', paymentTerms: 'NET30', creditLimit: '', riskLevel: 'MEDIUM',
    preferredInteractionType: 'EMAIL',
    region: '', zone: '', kebele: '', wereda: '', city: '', houseNumber: '',
  });

  const filtered = customers.filter(
    (c) =>
      (riskFilter === 'ALL' || c.riskLevel === riskFilter) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.tin || '').toLowerCase().includes(search.toLowerCase())),
  );

  const validateTin = async () => {
    if (!form.tin.trim()) { toast.error('Enter a TIN first'); return; }
    setTinValidating(true);
    await new Promise((r) => setTimeout(r, 600));
    const cleaned = form.tin.replace(/\D/g, '');
    const valid = /^\d{10}$/.test(cleaned);
    if (valid) toast.success('TIN format verified ✓');
    else toast.error('Invalid TIN — must be 10 digits');
    setTinValidating(false);
  };

  const exportCustomersCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'TIN', 'VAT Number', 'Address', 'Payment Terms', 'Credit Limit', 'Risk Level', 'Notes'],
      ...customers.map((c) => [
        c.name, c.email || '', c.phone || '', c.tin || '', c.vatNumber || '',
        c.address || '', c.paymentTerms || '', c.creditLimit || '', c.riskLevel || '', c.notes || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadCSV(csv, `customers-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Registry exported');
  };

  const openAdd = () => {
    setEditingCustomer(null);
    setForm(blankForm());
    setTab('IDENTITY');
    setView('add');
  };

  const openEdit = (c: any) => {
    setEditingCustomer(c);
    setForm({ ...blankForm(), ...c, creditLimit: c.creditLimit?.toString() || '' });
    setTab('IDENTITY');
    setView('add');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Customer name is required'); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ...form,
        creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
        customFields: customFieldValues,
      };
      if (!editingCustomer && companyId) payload.companyId = companyId;
      if (editingCustomer) {
        await api.patch(`/ovds/customers/${editingCustomer.id}`, payload);
        toast.success('Customer updated');
      } else {
        await api.post('/ovds/customers', payload);
        toast.success('Customer added to registry');
      }
      onRefresh();
      setView('list');
      setEditingCustomer(null);
      setCustomFieldValues({});
    } catch {
      // api interceptor already shows the error toast
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: 'Remove this customer from the registry?', variant: 'danger' }))) return;
    try {
      await api.delete(`/ovds/customers/registry/${id}`);
      onRefresh();
      toast.success('Customer removed');
      if (view === 'detail') setView('list');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // -- Risk stats for filter bar ---------------------------------------------
  const riskCounts = customers.reduce((acc: Record<string, number>, c) => {
    acc[c.riskLevel] = (acc[c.riskLevel] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Customer Registry"
    >
      <div className="aki-card w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden" style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
        {/* Top accent stripe */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(to right, var(--aki-blue), var(--aki-success-bg))' }} />

        {/* -- Header -- */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'var(--aki-blue)', boxShadow: 'var(--shadow)' }}>
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                {view === 'add'
                  ? (editingCustomer ? 'Edit Customer' : 'Add Customer')
                  : view === 'detail'
                  ? 'Customer Profile'
                  : 'Customer Registry'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-4)' }}>
                {customers.length} {customers.length === 1 ? 'entity' : 'entities'} on file
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'list' && (
              <>
                <button
                  onClick={exportCustomersCSV}
                  className="aki-btn aki-btn-secondary"
                  style={{ borderRadius: '12px' }}
                >
                  <FileDown size={13} /> Export
                </button>
                <button
                  onClick={openAdd}
                  className="aki-btn aki-btn-primary"
                >
                  <Plus size={13} /> New Customer
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="aki-btn aki-btn-ghost"
              style={{ borderRadius: '12px' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* -- Detail view -- */}
        {view === 'detail' && detailCustomer && (
          <CustomerDetail
            customer={detailCustomer}
            onBack={() => setView('list')}
            onEdit={() => openEdit(detailCustomer)}
            onDelete={() => handleDelete(detailCustomer.id)}
            onSelect={() => onSelect(detailCustomer)}
          />
        )}

        {/* -- Add / Edit form -- */}
        {view === 'add' && (
          <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-alt)' }}>
            <form onSubmit={handleSave} className="p-6 space-y-5 max-w-2xl mx-auto">

              {/* Tab switcher */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-alt)' }}>
                {(['IDENTITY', 'ADDRESS', 'FISCAL'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`aki-btn flex-1 justify-center ${
                      tab === t ? 'aki-btn-soft-blue' : 'aki-btn-ghost'
                    }`}
                    style={{ borderRadius: '12px' }}
                  >
                    {t}
                  </button>
                ))}
              </div>

               {/* -- IDENTITY tab -- */}
               {tab === 'IDENTITY' && (
                 <div className="space-y-4 animate-in fade-in duration-200">
                   <div>
                     <label className={lbl}><Building2 size={10} style={{ color: 'var(--text-4)' }} /> Legal Name <span style={{ color: 'var(--aki-danger-text)' }}>*</span></label>
                     <div className="relative">
                       <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                       <input
                         required
                         value={form.name}
                         onChange={(e) => setForm({ ...form, name: e.target.value })}
                         placeholder="e.g. Acme Trading PLC"
                         className={`${inp} pl-10`}
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className={lbl}><Mail size={10} style={{ color: 'var(--text-4)' }} /> Business Email</label>
                       <div className="relative">
                         <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                         <input
                           type="email"
                           value={form.email}
                           onChange={(e) => setForm({ ...form, email: e.target.value })}
                           placeholder="billing@company.com"
                           className={`${inp} pl-10`}
                         />
                       </div>
                     </div>
                     <div>
                       <label className={lbl}><Phone size={10} style={{ color: 'var(--text-4)' }} /> Phone</label>
                       <input
                         type="tel"
                         value={form.phone}
                         onChange={(e) => setForm({ ...form, phone: e.target.value })}
                         placeholder="+251 9XX XXX XXX"
                         className={`${inp}`}
                       />
                     </div>
                   </div>
                   <div>
                     <label className={lbl}><StickyNote size={10} style={{ color: 'var(--text-4)' }} /> Notes</label>
                     <textarea
                       value={form.notes}
                       onChange={(e) => setForm({ ...form, notes: e.target.value })}
                       rows={3}
                       placeholder="Internal relationship notes, special instructions…"
                       className={`aki-textarea`}
                     />
                   </div>
                 </div>
               )}

               {/* -- ADDRESS tab -- */}
               {tab === 'ADDRESS' && (
                 <div className="aki-card space-y-4 animate-in fade-in duration-200" style={{ borderRadius: '16px', padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                   <div>
                     <label className={lbl}><MapPin size={10} /> Billing Address</label>
                     <textarea
                       value={form.address}
                       onChange={(e) => setForm({ ...form, address: e.target.value })}
                       rows={3}
                       placeholder="Street, Building No., Sub-city, City…"
                       className={`${inp} resize-none`}
                       style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className={lbl}>Region</label>
                       <input value={form.region || ''} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="e.g. Addis Ababa" className={inp} />
                     </div>
                     <div>
                       <label className={lbl}>Zone</label>
                       <input value={form.zone || ''} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="e.g. Bole" className={inp} />
                     </div>
                     <div>
                       <label className={lbl}>Wereda</label>
                       <input value={form.wereda || ''} onChange={e => setForm({ ...form, wereda: e.target.value })} placeholder="Wereda number" className={inp} />
                     </div>
                     <div>
                       <label className={lbl}>Kebele</label>
                       <input value={form.kebele || ''} onChange={e => setForm({ ...form, kebele: e.target.value })} placeholder="e.g. 101" className={inp} />
                     </div>
                     <div>
                       <label className={lbl}>City / Sub-city</label>
                       <input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Bole" className={inp} />
                     </div>
                     <div>
                       <label className={lbl}>House Number</label>
                       <input value={form.houseNumber || ''} onChange={e => setForm({ ...form, houseNumber: e.target.value })} placeholder="e.g. 123B" className={inp} />
                     </div>
                   </div>
                   <div className="aki-card flex items-start gap-3" style={{ borderRadius: '12px', padding: '16px', background: 'var(--aki-blue-50)', border: `1px solid var(--aki-blue-border)` }}>
                     <Info size={14} style={{ color: 'var(--aki-blue)' }} className="shrink-0 mt-0.5" />
                     <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--aki-blue-text)' }}>
                       Structured address fields are used for EIMS B2B invoice registration (Region, Zone, Kebele, House Number).
                     </p>
                   </div>
                 </div>
               )}

              {/* -- FISCAL tab -- */}
              {tab === 'FISCAL' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}><Hash size={10} style={{ color: 'var(--text-4)' }} /> TIN Number</label>
                      <div className="flex gap-2">
                        <input
                          value={form.tin}
                          onChange={(e) => setForm({ ...form, tin: e.target.value })}
                          placeholder="10 digits"
                          className={`${inp} flex-1`}
                          maxLength={10}
                        />
                        <button
                          type="button"
                          onClick={validateTin}
                          disabled={tinValidating}
                          className="aki-btn shrink-0"
                          style={{ borderRadius: '12px', background: 'var(--aki-blue)', color: 'white', opacity: tinValidating ? 0.5 : 1 }}
                        >
                          {tinValidating ? <RefreshCw size={13} className="animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}><Percent size={10} style={{ color: 'var(--text-4)' }} /> VAT Reg No.</label>
                      <div className="relative">
                        <Percent size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                        <input
                          value={form.vatNumber}
                          onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                          placeholder="VAT number"
                          className={`${inp} pl-10`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}><Calendar size={10} style={{ color: 'var(--text-4)' }} /> Payment Terms</label>
                      <div className="relative">
                        <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                        <select
                          value={form.paymentTerms}
                          onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                          className={`${inp} aki-select pl-10`}
                        >
                          <option value="IMMEDIATE">Immediate</option>
                          <option value="NET15">Net 15</option>
                          <option value="NET30">Net 30</option>
                          <option value="NET60">Net 60</option>
                          <option value="NET90">Net 90</option>
                        </select>
                        <ChevronRight size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" style={{ color: 'var(--text-4)' }} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}><Wallet size={10} style={{ color: 'var(--text-4)' }} /> Credit Limit (ETB)</label>
                      <div className="relative">
                        <Wallet size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                        <input
                          type="number"
                          value={form.creditLimit}
                          onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                          placeholder="0"
                          className={`${inp} pl-10`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk classification pill grid */}
                  <div>
                    <label className={lbl}><BadgeCheck size={10} style={{ color: 'var(--text-4)' }} /> Risk Classification</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['LOW', 'MEDIUM', 'HIGH', 'BLOCKED'] as const).map((r) => {
                        const meta = RISK_META[r];
                        const isActive = form.riskLevel === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setForm({ ...form, riskLevel: r })}
                            className={`aki-badge pill cursor-pointer transition-all ${
                              isActive
                                ? r === 'LOW'     ? 'solid-success'
                                : r === 'MEDIUM'  ? 'solid-warning'
                                : r === 'HIGH'    ? 'solid-orange'
                                : 'solid-danger'
                                : 'solid-default'
                            }`}
                            style={{ padding: '5px 12px' }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${meta.dot}`} />
                            {r === 'LOW' ? 'Low' : r === 'MEDIUM' ? 'Med' : r === 'HIGH' ? 'High' : 'Block'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom fields */}
              {companyId && (
                <div>
                  <p className="ovds-label mb-2">Custom Fields</p>
                  <CustomFieldRenderer feature="customer" entityId={editingCustomer?.id} companyId={companyId}
                    onChange={handleCustomFieldChange} initialValues={customFieldValues} showTitle={false} />
                </div>
              )}

              {/* -- Form footer -- */}
              <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border-alt)' }}>
                <button
                  type="button"
                  onClick={() => { setView('list'); setEditingCustomer(null); }}
                  className="aki-btn aki-btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="aki-btn aki-btn-primary flex-[2] justify-center"
                >
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                  {saving ? 'Saving…' : editingCustomer ? 'Update Customer' : 'Add to Registry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* -- List view -- */}
        {view === 'list' && (
          <div className="flex-1 flex flex-col min-h-0">

            {/* Risk filter chips */}
            {customers.length > 0 && Object.values(riskCounts).some(Boolean) && (
              <div className="px-6 py-3 flex items-center gap-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface)' }}>
                {(Object.keys(RISK_META) as Array<keyof typeof RISK_META>).map((key) => {
                  const count = riskCounts[key] || 0;
                  if (!count) return null;
                  const meta = RISK_META[key];
                  const isActive = riskFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setRiskFilter(riskFilter === key ? 'ALL' : key)}
                      className={`aki-badge flex items-center gap-1.5 shrink-0 ${
                        isActive ? meta.color : ''
                      }`}
                      style={{ borderRadius: '9999px', padding: '6px 12px', background: isActive ? undefined : 'var(--surface-alt)', border: `1px solid ${isActive ? 'var(--aki-blue)' : 'var(--border)'}`, color: isActive ? undefined : 'var(--text-2)' }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label} · {count}
                    </button>
                  );
                })}
                {riskFilter !== 'ALL' && (
                  <button
                    onClick={() => setRiskFilter('ALL')}
                    className="text-[10px] font-bold uppercase tracking-wider shrink-0 ml-1 transition-colors"
                    style={{ color: 'var(--text-4)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--aki-blue)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
                  >
                    Clear ×
                  </button>
                )}
              </div>
            )}

            {/* Search bar */}
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-alt)' }}>
              <div className="aki-card flex items-center gap-3" style={{ borderRadius: '12px', padding: '0 16px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Search size={15} style={{ color: 'var(--text-4)' }} className="shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or TIN…"
                  className="aki-input"
                  style={{ background: 'transparent', border: 'none', padding: '12px 0' }}
                />
              </div>
            </div>

            {/* Customer list */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <RefreshCw size={28} style={{ color: 'var(--aki-blue)' }} className="animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>Loading registry…</p>
                </div>
              ) : filtered.length === 0 ? (
                /* Empty state */
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--aki-blue-50)' }}>
                    <Users size={28} style={{ color: 'var(--aki-blue)' }} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text)' }}>No Customers Found</p>
                  {!search && (
                    <button
                      onClick={openAdd}
                      className="aki-btn mt-4"
                      style={{ borderRadius: '12px', background: 'var(--aki-blue)', color: 'white', boxShadow: 'var(--shadow)' }}
                    >
                      <Plus size={14} /> Add First Customer
                    </button>
                  )}
                </div>
              ) : (
                /* Customer rows */
                <div className="space-y-2">
                  {filtered.map((c) => {
                    const risk = RISK_META[c.riskLevel] ?? RISK_META.MEDIUM;
                    const initials = c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <div
                        key={c.id}
                        className="aki-card flex items-center gap-4 cursor-pointer transition-all group"
                        style={{ borderRadius: '16px', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border-alt)' }}
                        onClick={() => { setDetailCustomer(c); setView('detail'); }}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ background: 'var(--aki-blue)', boxShadow: 'var(--shadow)' }}>
                          {initials}
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate transition-colors" style={{ color: 'var(--text)' }}>
                            {c.name}
                          </p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>
                            {c.email || (c.tin ? `TIN: ${c.tin}` : 'No contact info')}
                          </p>
                        </div>

                        {/* Risk pill */}
                        <span className={`aki-badge xs shrink-0 ${risk.color}`} style={{ background: undefined, border: undefined }}>
                          <span className={`w-1 h-1 rounded-full ${risk.dot} inline-block mr-1.5`} />
                          {risk.label}
                        </span>

                        {/* Action buttons + chevron */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                            className="aki-btn aki-btn-ghost icon-only"
                            style={{ borderRadius: '12px', color: 'var(--text-4)' }}
                            aria-label="Edit customer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                            className="aki-btn aki-btn-ghost icon-only"
                            style={{ borderRadius: '12px', color: 'var(--text-4)' }}
                            aria-label="Delete customer"
                          >
                            <Trash2 size={13} />
                          </button>
                          <ChevronRight size={14} className="transition-colors ml-1" style={{ color: 'var(--text-4)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer count */}
            {filtered.length > 0 && (
              <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
                  Showing {filtered.length} of {customers.length} customers
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerRegistryModal;
