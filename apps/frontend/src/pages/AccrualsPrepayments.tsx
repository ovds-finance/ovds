/**
 * Accruals & Prepayments — IAS 1 / IAS 37
 * Deferred expenses (prepayments) and accrued liabilities (accruals)
 * with monthly straight-line amortisation scheduling.
 */
import { AppPage, AppKpi } from '@ovds/ui';
import { CalendarClock, Plus, RefreshCw, XCircle, Play, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import api from '../services/api';

// -- Types ---------------------------------------------------------------------
interface AccrualItem {
  id: string;
  type: 'ACCRUAL' | 'PREPAYMENT';
  description: string;
  amount: number;
  startDate: string;
  endDate: string;
  totalMonths: number;
  amortisedMonths: number;
  monthlyAmount: number;
  remainingAmount: number;
  status: 'ACTIVE' | 'FULLY_AMORTISED' | 'CANCELLED';
  postings?: Array<{ id: string; period: string; amount: number; status: string }>;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:           'bg-sky-100 text-sky-700',
  FULLY_AMORTISED:  'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  CANCELLED:        'bg-rose-100 text-rose-600',
};
const TYPE_COLOR: Record<string, string> = {
  ACCRUAL:    'bg-amber-100 text-amber-700',
  PREPAYMENT: 'bg-violet-100 text-violet-700',
};

const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2 });

// -- Create Modal --------------------------------------------------------------
const CreateModal: React.FC<{ onClose: () => void; onCreated: () => void; companyId?: string }> = ({ onClose, onCreated, companyId }) => {
  const [form, setForm] = useState({
    type: 'PREPAYMENT' as 'ACCRUAL' | 'PREPAYMENT',
    description: '',
    amount: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Calculate preview
  const months = form.startDate && form.endDate
    ? Math.max(1, (new Date(form.endDate).getFullYear() - new Date(form.startDate).getFullYear()) * 12 + new Date(form.endDate).getMonth() - new Date(form.startDate).getMonth() + 1)
    : 0;
  const monthly = form.amount && months > 0 ? parseFloat(form.amount) / months : 0;

  const submit = async () => {
    if (!form.description || !form.amount || !form.endDate) { toast.error('Description, amount, and end date are required'); return; }
    setSaving(true);
    try {
      await api.post('/ovds/accruals', { ...form, amount: parseFloat(form.amount), companyId });
      toast.success(`${form.type === 'ACCRUAL' ? 'Accrual' : 'Prepayment'} created`);
      onCreated(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="ovds-module-title">New Accrual / Prepayment</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><XCircle size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Type</label>
            <div className="flex gap-2">
              {(['ACCRUAL','PREPAYMENT'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${form.type === t ? 'bg-[var(--pro-azure)] border-[var(--pro-azure)] text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  {t}
                </button>
              ))}
            </div>
            <p className="ovds-caption mt-1">
              {form.type === 'ACCRUAL' ? 'Expense incurred but not yet invoiced — IAS 37' : 'Payment made for future periods — deferred expense — IAS 1'}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Description</label>
            <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="e.g. Annual insurance premium prepayment" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Total Amount (ETB)</label>
            <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Start Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">End Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          {months > 0 && (
            <div className="bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl p-3 text-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Monthly amortisation: </span>
              <span className="font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">ETB {fmt(monthly)}</span>
              <span className="ovds-caption ml-2">× {months} months</span>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Notes</label>
            <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const AccrualsPrepayments: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const cid = selectedCompanyId ?? undefined;

  const [items, setItems]       = useState<AccrualItem[]>([]);
  const [summary, setSummary]   = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [showCreate, setShowCreate]     = useState(false);
  const [expanded, setExpanded]         = useState<Set<string>>(new Set());
  const [postPeriod, setPostPeriod]     = useState(new Date().toISOString().slice(0, 7));
  const [posting, setPosting]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get('/ovds/accruals', { params: { companyId: cid, ...(typeFilter && { type: typeFilter }), ...(statusFilter && { status: statusFilter }) } }),
        api.get('/ovds/accruals/summary', { params: { companyId: cid } }),
      ]);
      setItems(Array.isArray(listRes.data?.data) ? listRes.data.data : (listRes.data ?? []));
      setSummary(sumRes.data?.data ?? sumRes.data);
    } catch { toast.error('Failed to load accruals'); }
    finally { setLoading(false); }
  }, [cid, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handlePostPeriod = async () => {
    setPosting(true);
    try {
      const res = await api.post('/ovds/accruals/post-period', { period: postPeriod });
      const r = res.data?.data ?? res.data;
      toast.success(`Posted ${r.posted ?? 0}, skipped ${r.skipped ?? 0} for ${postPeriod}`);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Posting failed'); }
    finally { setPosting(false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this accrual/prepayment?')) return;
    try { await api.patch(`/ovds/accruals/${id}/cancel`); toast.success('Cancelled'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  };

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const kpiCells = summary ? [
    { label: 'Active',        value: summary.activeCount?.toString() ?? '0',      accentCls: 'bg-sky-500' },
    { label: 'Total Accruals', value: summary.totalAccruals?.toString() ?? '0',   accentCls: 'bg-amber-500' },
    { label: 'Prepayments',   value: summary.totalPrepayments?.toString() ?? '0', accentCls: 'bg-violet-500' },
    { label: 'Remaining',     value: `ETB ${((summary.totalRemaining ?? 0) / 1000).toFixed(0)}K`, accentCls: 'bg-rose-500' },
    { label: 'Amortised',     value: `ETB ${((summary.totalAmortised ?? 0) / 1000).toFixed(0)}K`, accentCls: 'bg-[var(--pro-azure)]' },
  ] : [];

  return (
    <AppPage
      title="Accruals & Prepayments"
      subtitle="IAS 1 / IAS 37 — deferred costs and accrued liabilities"
      icon={<CalendarClock size={16} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'Accounting', to: '/accounting' }, { label: 'Accruals & Prepayments' }]}
      actions={
        <div className="flex items-center gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800">
            <option value="">All Types</option>
            <option value="ACCRUAL">Accruals</option>
            <option value="PREPAYMENT">Prepayments</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="FULLY_AMORTISED">Fully Amortised</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button onClick={load} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><RefreshCw size={16} className={loading ? 'animate-spin text-[var(--pro-azure)]' : 'text-slate-500'} /></button>
          <button onClick={() => setShowCreate(true)} className="ovds-btn-primary flex items-center gap-1.5"><Plus size={14} /> New</button>
        </div>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* Post period strip */}
      <div className="ovds-widget-card p-4 mb-4 flex items-center gap-4 flex-wrap">
        <div>
          <p className="ovds-card-title">Post Monthly Amortisation</p>
          <p className="ovds-caption mt-0.5">Posts journal entries for all active accruals/prepayments for a period</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="month" value={postPeriod} onChange={e => setPostPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" />
          <button onClick={handlePostPeriod} disabled={posting}
            className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50">
            {posting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {posting ? 'Posting…' : 'Post Period'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="ovds-widget-card">
        <div className="ovds-widget-header">
          <h3 className="ovds-card-title">Accruals & Prepayments</h3>
          <span className="ovds-caption">{items.length} records</span>
        </div>
        <div className="ovds-widget-body">
          {loading ? (
            <div className="ovds-empty py-12"><RefreshCw size={20} className="animate-spin text-[var(--pro-azure)] mb-2" /><span>Loading…</span></div>
          ) : items.length === 0 ? (
            <div className="ovds-empty py-12">
              <CalendarClock size={32} className="text-slate-300 mb-2" />
              <span>No accruals or prepayments found</span>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-[var(--pro-azure)] hover:underline">Create one</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map(item => {
                const pct = item.totalMonths > 0 ? (item.amortisedMonths / item.totalMonths) * 100 : 0;
                const isExpanded = expanded.has(item.id);
                return (
                  <div key={item.id}>
                    <div className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => toggleExpand(item.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_COLOR[item.type]}`}>{item.type}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[item.status]}`}>{item.status}</span>
                        </div>
                        <p className="ovds-body font-bold truncate">{item.description}</p>
                        <p className="ovds-caption mt-0.5">
                          {new Date(item.startDate).toLocaleDateString('en-ET')} → {new Date(item.endDate).toLocaleDateString('en-ET')} · {item.totalMonths} months
                        </p>
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden w-48">
                          <div className="h-full bg-[var(--pro-azure)] rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <p className="ovds-caption mt-0.5">{item.amortisedMonths}/{item.totalMonths} months — {pct.toFixed(0)}% amortised</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="ovds-number text-slate-800 dark:text-slate-100">ETB {fmt(Number(item.amount))}</p>
                        <p className="ovds-caption text-[var(--pro-azure)] mt-0.5">ETB {fmt(Number(item.monthlyAmount))}/mo</p>
                        <p className="ovds-caption text-rose-500 mt-0.5">ETB {fmt(Number(item.remainingAmount))} remaining</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.status === 'ACTIVE' && (
                          <button onClick={e => { e.stopPropagation(); handleCancel(item.id); }}
                            title="Cancel" className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-rose-500 transition-colors">
                            <XCircle size={14} />
                          </button>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>
                    {/* Expanded postings */}
                    {isExpanded && item.postings && item.postings.length > 0 && (
                      <div className="px-4 pb-4">
                        <p className="ovds-section-title mb-2">Posting History</p>
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          {item.postings.map(p => (
                            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                              <div className="font-bold text-slate-700 dark:text-slate-200">{p.period}</div>
                              <div className="text-[var(--pro-azure)] font-mono">ETB {fmt(Number(p.amount))}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} companyId={cid} />}
    </AppPage>
  );
};

export default AccrualsPrepayments;

