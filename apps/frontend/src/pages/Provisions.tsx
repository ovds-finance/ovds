/**
 * IAS 37 — Provisions, Contingent Liabilities & Contingent Assets
 *
 * Recognised when (IAS 37.14):
 *   (a) Present obligation from a past event
 *   (b) Probable outflow of economic benefits
 *   (c) Reliable estimate
 *
 * Types: Legal, Warranty, Restructuring, Onerous Contract, Environmental, Other
 * Not recognised (disclosed only): Contingent liabilities (possible/remote)
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, RefreshCw, X, AlertTriangle, CheckCircle2,
  Clock, TrendingDown, Info, Send, Minus,
} from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtCurrency } from '../utils/fmt';
import { Icon } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

const TYPES: Array<{ value: string; label: string; color: string }> = [
  { value: 'LEGAL',            label: 'Legal & Litigation',    color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'WARRANTY',         label: 'Product Warranty',      color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'RESTRUCTURING',    label: 'Restructuring',         color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'ONEROUS_CONTRACT', label: 'Onerous Contract',      color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'ENVIRONMENTAL',    label: 'Environmental',         color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'GRATUITY',         label: 'Employee Gratuity',     color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'OTHER',            label: 'Other',                 color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

const PROBS: Array<{ value: string; label: string; cls: string; ias37: string }> = [
  { value: 'PROBABLE',  label: 'Probable (>50%)',  cls: 'text-rose-600',   ias37: 'Recognise — IAS 37.14' },
  { value: 'POSSIBLE',  label: 'Possible (5–50%)', cls: 'text-amber-600',  ias37: 'Disclose only — IAS 37.86' },
  { value: 'REMOTE',    label: 'Remote (<5%)',      cls: 'text-slate-400',  ias37: 'No disclosure required — IAS 37.86' },
];

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  OPEN:      { label: 'Open',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  UTILISED:  { label: 'Utilised',  cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  REVERSED:  { label: 'Reversed',  cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  SETTLED:   { label: 'Settled',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const typeLabel = (v: string) => TYPES.find(t => t.value === v)?.label ?? v;
const typeColor = (v: string) => TYPES.find(t => t.value === v)?.color ?? 'bg-slate-100 text-slate-600 border-slate-200';

const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-colors placeholder:text-slate-300';

// -- New Provision Modal -------------------------------------------------------
const NewProvisionModal: React.FC<{
  companyId?: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ companyId, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'LEGAL', description: '', probability: 'PROBABLE',
    amount: '', amountLow: '', amountHigh: '',
    expectedSettle: '', discountRate: '0', notes: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const prob = PROBS.find(p => p.value === form.probability);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (isNaN(amount) || amount <= 0) { toast.error('Amount must be greater than 0'); return; }
    if (form.probability === 'REMOTE') {
      toast('Remote contingency — will be disclosed but not recognised on balance sheet', { icon: 'ℹ️' });
    }
    setSaving(true);
    try {
      await api.post('/ovds/reports/provisions', {
        type:           form.type,
        description:    form.description,
        probability:    form.probability,
        amount,
        amountLow:      parseFloat(form.amountLow) || 0,
        amountHigh:     parseFloat(form.amountHigh) || 0,
        expectedSettle: form.expectedSettle || undefined,
        discountRate:   parseFloat(form.discountRate) || 0,
        notes:          form.notes || undefined,
        companyId,
      });
      toast.success('Provision created');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create provision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">New Provision</h3>
            <p className="text-xs text-slate-400 mt-0.5">IAS 37 — Recognise when probable + reliable estimate</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type + Probability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={inp}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Probability</label>
              <select value={form.probability} onChange={e => set('probability', e.target.value)} className={inp}>
                {PROBS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Probability guidance */}
          {prob && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
              form.probability === 'PROBABLE' ? 'bg-rose-50 border-rose-100 text-rose-700'
              : form.probability === 'POSSIBLE' ? 'bg-amber-50 border-amber-100 text-amber-700'
              : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <Info size={12} className="shrink-0" />
              <span><strong>{prob.label}</strong> — {prob.ias37}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description <span className="text-rose-500">*</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} className={inp + ' resize-none'} placeholder="Nature of the obligation…" required />
          </div>

          {/* Amount range */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Best Estimate (ETB) <span className="text-rose-500">*</span></label>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={e => set('amount', e.target.value)} className={inp} placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Range Low (ETB)</label>
              <input type="number" min="0" step="0.01" value={form.amountLow}
                onChange={e => set('amountLow', e.target.value)} className={inp} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Range High (ETB)</label>
              <input type="number" min="0" step="0.01" value={form.amountHigh}
                onChange={e => set('amountHigh', e.target.value)} className={inp} placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Expected Settlement</label>
              <input type="date" value={form.expectedSettle}
                onChange={e => set('expectedSettle', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Discount Rate (%)
                <span className="text-slate-300 font-normal ml-1">IAS 37.45</span>
              </label>
              <input type="number" min="0" max="100" step="0.1" value={form.discountRate}
                onChange={e => set('discountRate', e.target.value)} className={inp} placeholder="0" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} className={inp + ' resize-none'} placeholder="Any supporting notes or assumptions…" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Creating…' : 'Create Provision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Provision row actions -----------------------------------------------------
const ProvisionActions: React.FC<{ provision: any; onUpdated: () => void }> = ({ provision, onUpdated }) => {
  const [amount, setAmount]   = useState('');
  const [reason, setReason]   = useState('');
  const [mode, setMode]       = useState<'idle' | 'utilise' | 'reverse'>('idle');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { toast.error('Enter a valid amount'); return; }
    if (mode === 'reverse' && !reason.trim()) { toast.error('Enter a reason for reversal'); return; }
    setLoading(true);
    try {
      const endpoint = mode === 'utilise'
        ? `/ovds/reports/provisions/${provision.id}/utilise`
        : `/ovds/reports/provisions/${provision.id}/reverse`;
      await api.post(endpoint, mode === 'utilise' ? { amount: a } : { amount: a, reason });
      toast.success(mode === 'utilise' ? 'Provision utilised' : 'Provision reversed');
      setMode('idle');
      onUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const postJournal = async () => {
    setLoading(true);
    try {
      await api.post(`/ovds/reports/provisions/${provision.id}/post-journal`);
      toast.success('Provision journal entry posted to GL');
      onUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post journal');
    } finally {
      setLoading(false);
    }
  };

  if (provision.status !== 'OPEN') return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {mode === 'idle' ? (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMode('utilise')}
            className="px-2.5 py-1 text-[10px] font-medium bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors">
            Utilise
          </button>
          <button onClick={() => setMode('reverse')}
            className="px-2.5 py-1 text-[10px] font-medium bg-white text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            Reverse
          </button>
          {!provision.journalEntryId && (
            <button onClick={postJournal} disabled={loading}
              className="px-2.5 py-1 text-[10px] font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors flex items-center gap-1">
              {loading ? <RefreshCw size={9} className="animate-spin" /> : <Send size={9} />} Post to GL
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <input type="number" min="0" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Amount to ${mode}`}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
            {mode === 'reverse' && (
              <input value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Reason for reversal (required)"
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400" />
            )}
          </div>
          <button onClick={submit} disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50">
            {loading ? '…' : 'Confirm'}
          </button>
          <button onClick={() => { setMode('idle'); setAmount(''); setReason(''); }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

// -- Main page -----------------------------------------------------------------
const Provisions: React.FC = () => {
  usePageTitle('Provisions');
  const { selectedCompanyId } = useBusiness();
  const [provisions, setProvisions] = useState<any[]>([]);
  const [summary, setSummary]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [showNew, setShowNew]       = useState(false);
  const [filter, setFilter]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const [pRes, sRes] = await Promise.all([
        api.get(`/ovds/reports/provisions${q}`).catch(() => ({ data: [] })),
        api.get(`/ovds/reports/provisions/summary${q}`).catch(() => ({ data: null })),
      ]);
      setProvisions(pRes.data?.data ?? pRes.data ?? []);
      setSummary(sRes.data?.data ?? sRes.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter
    ? provisions.filter(p =>
        p.type === filter || p.status === filter ||
        (p.description ?? '').toLowerCase().includes(filter.toLowerCase()))
    : provisions;

  return (
    <AppPage
      title="Provisions"
      subtitle="IAS 37 — Provisions, Contingent Liabilities & Contingent Assets · Banking & ovds · Healthcare & Pharmaceuticals · Challenges Analysis · Strategic Insights"
      icon={<AlertTriangle size={18} />}
      iconBg="bg-violet-500"
      crumbs={[{ label: 'IFRS & Standards' }, { label: 'Provisions' }]}
      actions={
        <Btn variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowNew(true)}>
          New Provision
        </Btn>
      }
    >
      <div className="space-y-5">

        {/* -- KPI strip -- */}
        {summary && (
          <div className="ovds-stat-row">
            {[
              { label: 'Total Open',    value: fmt(summary.totalOpen),    accent: 'bg-amber-500' },
              { label: 'Utilised',      value: fmt(summary.totalUtilised),accent: 'bg-sky-500' },
              { label: 'Reversed',      value: fmt(summary.totalReversed),accent: 'bg-slate-400' },
              { label: 'Open Provisions',value: String(summary.openCount), accent: summary.openCount > 0 ? 'bg-violet-500' : 'bg-slate-200' },
              { label: 'Overdue',        value: String(summary.overdueCount), accent: summary.overdueCount > 0 ? 'bg-rose-500' : 'bg-slate-200' },
            ].map(kpi => (
              <div key={kpi.label} className="ovds-kpi-cell">
                <div className={`w-1 h-8 rounded-full shrink-0 ${kpi.accent}`} />
                <div>
                  <p className="ovds-value-sm tabular-nums">{kpi.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* -- By type breakdown -- */}
        {summary?.byType?.length > 0 && (
          <div className="ovds-grid-layout cols-4">
            {summary.byType.map((bt: any) => (
              <div key={bt.type}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${typeColor(bt.type)}`}
                onClick={() => setFilter(filter === bt.type ? '' : bt.type)}>
                <div>
                  <p className="text-sm font-bold tabular-nums">{fmt(bt.total)}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">{bt.label}</p>
                  <p className="text-[10px] opacity-60">{bt.count} provision{bt.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* -- Provisions table -- */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header flex items-center gap-3">
            <h3 className="ovds-card-title">Provision Register</h3>
            <div className="flex items-center gap-2 ml-auto">
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-400">
                <option value="">All</option>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-4">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <AlertTriangle size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No provisions found</p>
                <p className="text-xs text-slate-300 mt-1">Provisions are recognised for probable obligations with reliable estimates</p>
              </div>
            ) : (
              filtered.map((p: any) => {
                const st = STATUS_CFG[p.status] ?? STATUS_CFG.OPEN;
                const isOverdue = p.expectedSettle && new Date(p.expectedSettle) < new Date() && p.status === 'OPEN';
                const remaining = Number(p.amount) - Number(p.utilisedAmount ?? 0) - Number(p.reversedAmount ?? 0);
                return (
                  <div key={p.id} className={`px-5 py-4 ${isOverdue ? 'bg-rose-50/40' : ''}`}>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeColor(p.type)}`}>
                            {typeLabel(p.type)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.cls}`}>
                            {st.label}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200 flex items-center gap-1">
                              <Clock size={9} /> Overdue
                            </span>
                          )}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            p.probability === 'PROBABLE' ? 'bg-rose-50 text-rose-500'
                            : p.probability === 'POSSIBLE' ? 'bg-amber-50 text-amber-500'
                            : 'bg-slate-100 text-slate-400'
                          }`}>
                            {p.probability}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 mt-1.5 leading-snug">{p.description}</p>
                        {p.notes && <p className="text-xs text-slate-400 mt-0.5">{p.notes}</p>}
                        {p.expectedSettle && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Expected settlement: {new Date(p.expectedSettle).toLocaleDateString('en-ET')}
                          </p>
                        )}
                        <ProvisionActions provision={p} onUpdated={load} />
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-base font-bold text-violet-700 tabular-nums">{fmt(Number(p.amount))}</p>
                        {Number(p.utilisedAmount) > 0 && (
                          <p className="text-xs text-sky-600 tabular-nums">Used: {fmt(Number(p.utilisedAmount))}</p>
                        )}
                        {Number(p.reversedAmount) > 0 && (
                          <p className="text-xs text-slate-400 tabular-nums">Reversed: {fmt(Number(p.reversedAmount))}</p>
                        )}
                        {remaining < Number(p.amount) && remaining > 0 && (
                          <p className="text-xs font-bold text-amber-600 tabular-nums">Remaining: {fmt(remaining)}</p>
                        )}
                        {p.journalEntryId && (
                          <p className="text-[10px] text-emerald-500 flex items-center gap-1 justify-end">
                            <CheckCircle2 size={9} /> Posted to GL
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* -- IAS 37 recognition criteria guide -- */}
        <div className="ovds-grid-layout cols-3 gap-3">
          {[
            { step: '1', title: 'Present Obligation', desc: 'Legal or constructive obligation from a past event (IAS 37.14a)', cls: 'bg-rose-50 border-rose-100 text-rose-700' },
            { step: '2', title: 'Probable Outflow',   desc: 'More likely than not (>50%) that economic benefits will flow out (IAS 37.14b)', cls: 'bg-amber-50 border-amber-100 text-amber-700' },
            { step: '3', title: 'Reliable Estimate',  desc: 'A reliable estimate of the amount can be made (IAS 37.14c)', cls: 'bg-violet-50 border-violet-100 text-violet-700' },
          ].map(c => (
            <div key={c.step} className={`px-4 py-3 rounded-xl border ${c.cls}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-bold">{c.step}</span>
                <p className="text-xs font-bold">{c.title}</p>
              </div>
              <p className="text-[11px] opacity-75">{c.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {showNew && (
        <NewProvisionModal
          companyId={selectedCompanyId ?? undefined}
          onClose={() => setShowNew(false)}
          onSaved={load}
        />
      )}
    </AppPage>
  );
};

export default Provisions;

