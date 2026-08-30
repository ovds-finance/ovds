import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { confirm } from '../../utils/confirm';
import { Skeleton } from '@ovds/ui';
import { PiggyBank, Plus, Trash2, RefreshCw, X, Edit2 } from 'lucide-react';

interface PFSubscription {
  id: string;
  name: string;
  shortCode: string;
  employeeRate: number;
  employerRate: number;
  isActive: boolean;
  description?: string;
}

const INPUT = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400';

const PF_TYPES = [
  { name: 'General Provident Fund (GPF)', shortCode: 'GPF', employeeRate: 7, employerRate: 11 },
  { name: 'Central Provident Fund (CPF)', shortCode: 'CPF', employeeRate: 7, employerRate: 11 },
  { name: 'National Pension Scheme (NPS)', shortCode: 'NPS', employeeRate: 7, employerRate: 11 },
  { name: "Employees' Provident Fund (EPF)", shortCode: 'EPF', employeeRate: 7, employerRate: 11 },
];

const PFSubscriptionsPanel: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<PFSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PFSubscription | null>(null);
  const [form, setForm] = useState({
    name: '', shortCode: '', employeeRate: 7, employerRate: 11, description: '', isActive: true,
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/payroll/pf-subscriptions');
      setSubscriptions(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []);
    } catch { setSubscriptions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', shortCode: '', employeeRate: 7, employerRate: 11, description: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (sub: PFSubscription) => {
    setEditing(sub);
    setForm({ name: sub.name, shortCode: sub.shortCode, employeeRate: sub.employeeRate, employerRate: sub.employerRate, description: sub.description ?? '', isActive: sub.isActive });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.shortCode) { toast.error('Name and short code required'); return; }
    try {
      if (editing) {
        await api.patch(`/payroll/pf-subscriptions/${editing.id}`, form);
        toast.success('Subscription updated');
      } else {
        await api.post('/payroll/pf-subscriptions', form);
        toast.success('Subscription added');
      }
      setShowForm(false);
      fetch();
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id: string) => {
    if (!await confirm({ title: 'Delete Subscription', message: 'Delete this PF subscription?', variant: 'danger' })) return;
    try {
      await api.delete(`/payroll/pf-subscriptions/${id}`);
      toast.success('Deleted');
      fetch();
    } catch { toast.error('Delete failed'); }
  };

  const quickAdd = (preset: typeof PF_TYPES[0]) => {
    setForm({ name: preset.name, shortCode: preset.shortCode, employeeRate: preset.employeeRate, employerRate: preset.employerRate, description: '', isActive: true });
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PiggyBank size={18} className="text-emerald-600 dark:text-emerald-400" /> PF Subscriptions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Ethiopian pension: Employee 7% · Employer 11%</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400">
            <RefreshCw size={14} />
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600">
            <Plus size={14} /> Add Subscription
          </button>
        </div>
      </div>

      {/* Quick-add presets */}
      <div className="flex flex-wrap gap-2">
        <span className="ovds-label self-center">Quick add:</span>
        {PF_TYPES.map(p => (
          <button key={p.shortCode} onClick={() => quickAdd(p)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
            {p.shortCode}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{editing ? 'Edit Subscription' : 'New PF Subscription'}</p>
            <button onClick={() => setShowForm(false)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="ovds-label mb-1 block">Subscription Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. General Provident Fund (GPF)" className={INPUT} />
            </div>
            <div>
              <label className="ovds-label mb-1 block">Short Code *</label>
              <input value={form.shortCode} onChange={e => setForm(p => ({ ...p, shortCode: e.target.value }))} placeholder="e.g. GPF" className={INPUT} />
            </div>
            <div>
              <label className="ovds-label mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" className={INPUT} />
            </div>
            <div>
              <label className="ovds-label mb-1 block">Employee Rate (%)</label>
              <input type="number" min={0} max={100} step={0.5} value={form.employeeRate}
                onChange={e => setForm(p => ({ ...p, employeeRate: Number(e.target.value) }))} className={INPUT} />
            </div>
            <div>
              <label className="ovds-label mb-1 block">Employer Rate (%)</label>
              <input type="number" min={0} max={100} step={0.5} value={form.employerRate}
                onChange={e => setForm(p => ({ ...p, employerRate: Number(e.target.value) }))} className={INPUT} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pf_active" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            <label htmlFor="pf_active" className="text-sm text-slate-600 dark:text-slate-300">Active</label>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600">
              {editing ? 'Update' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="ovds-widget-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {['Name', 'Code', 'Employee Rate', 'Employer Rate', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {loading ? (
              <Skeleton.TableRows cols={6} />
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm italic">
                  No PF subscriptions configured. Add one above or use a quick-add preset.
                </td>
              </tr>
            ) : subscriptions.map(sub => (
              <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="px-5 py-3">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{sub.name}</p>
                  {sub.description && <p className="text-[11px] text-slate-400 mt-0.5">{sub.description}</p>}
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{sub.shortCode}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{sub.employeeRate}%</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{sub.employerRate}%</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${sub.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {sub.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(sub)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 dark:text-emerald-400 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => del(sub.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ethiopian context note */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">Ethiopian Pension Rates (2026)</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Employee contribution: <strong>7%</strong> of basic salary · Employer contribution: <strong>11%</strong> of basic salary.
          Both are deducted/added automatically during payroll generation and reflected in payslips.
        </p>
      </div>
    </div>
  );
};

export default PFSubscriptionsPanel;







