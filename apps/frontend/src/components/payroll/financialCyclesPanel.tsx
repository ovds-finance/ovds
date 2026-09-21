import { Calendar, Plus, Edit2, Trash2, XCircle, RefreshCw } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';

interface FinancialCycle {
  id: string;
  name: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  incrementCount: number;
  incrementInterval: number;
  incrementPercentage: number;
  isActive: boolean;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CycleModal: React.FC<{ cycle?: FinancialCycle | null; onClose: () => void; onSave: () => void }> = ({ cycle, onClose, onSave }) => {
  const now = new Date();
  const [form, setForm] = useState({
    name: cycle?.name ?? `FY ${now.getFullYear()}/${now.getFullYear() + 1}`,
    startMonth: cycle?.startMonth ?? 7,
    startYear: cycle?.startYear ?? now.getFullYear(),
    endMonth: cycle?.endMonth ?? 6,
    endYear: cycle?.endYear ?? now.getFullYear() + 1,
    incrementCount: cycle?.incrementCount ?? 1,
    incrementInterval: cycle?.incrementInterval ?? 12,
    incrementPercentage: cycle?.incrementPercentage ?? 5,
    isActive: cycle?.isActive ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (cycle?.id) {
        await api.patch(`/payroll/financial-cycles/${cycle.id}`, form);
        toast.success('Cycle updated');
      } else {
        await api.post('/payroll/financial-cycles', form);
        toast.success('Financial cycle created');
      }
      onSave(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save cycle');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{cycle ? 'Edit Cycle' : 'New Financial Cycle'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><XCircle size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Cycle Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Start Month</label>
              <select value={form.startMonth} onChange={e => setForm(f => ({ ...f, startMonth: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Start Year</label>
              <input type="number" value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">End Month</label>
              <select value={form.endMonth} onChange={e => setForm(f => ({ ...f, endMonth: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">End Year</label>
              <input type="number" value={form.endYear} onChange={e => setForm(f => ({ ...f, endYear: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
            </div>
          </div>
          <div className="ovds-grid-layout cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">No. of Increments</label>
              <input type="number" min="1" max="4" value={form.incrementCount} onChange={e => setForm(f => ({ ...f, incrementCount: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Interval (months)</label>
              <input type="number" min="1" value={form.incrementInterval} onChange={e => setForm(f => ({ ...f, incrementInterval: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Increment %</label>
              <input type="number" min="0" step="0.1" value={form.incrementPercentage} onChange={e => setForm(f => ({ ...f, incrementPercentage: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 text-slate-800 dark:text-white" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Set as active cycle</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : cycle ? 'Update' : 'Create Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FinancialCyclesPanel: React.FC = () => {
  const { can } = useAuth();
  const canWrite = can('payroll:admin');

  const [cycles, setCycles] = useState<FinancialCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCycle, setEditCycle] = useState<FinancialCycle | null>(null);

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/financial-cycles');
      setCycles(res.data.data ?? []);
    } catch { setCycles([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this financial cycle?')) return;
    try {
      await api.delete(`/payroll/financial-cycles/${id}`);
      toast.success('Deleted');
      fetchCycles();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Financial Cycles</p>
          <p className="text-xs text-slate-400 mt-0.5">Define fiscal year cycles, increment intervals, and percentage rules</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCycles} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={14} className="text-slate-500" />
          </button>
          {canWrite && (
            <button onClick={() => { setEditCycle(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">
              <Plus size={14} /> Add Cycle
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="ovds-grid-layout cols-2">
          {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Calendar size={22} className="text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-500">No financial cycles configured</p>
          {canWrite && (
            <button onClick={() => { setEditCycle(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] transition-colors">
              <Plus size={13} /> Create First Cycle
            </button>
          )}
        </div>
      ) : (
        <div className="ovds-grid-layout cols-2">
          {cycles.map(c => (
            <div key={c.id} className={`bg-white dark:bg-slate-800 border rounded-xl p-5 ${c.isActive ? 'border-[var(--pro-azure)] ring-1 ring-[var(--pro-azure)]/20' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-white">{c.name}</p>
                    {c.isActive && (
                      <span className="px-2 py-0.5 bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] text-[10px] font-semibold rounded-full border border-[var(--pro-azure-100)] dark:border-green-800">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {MONTHS[c.startMonth - 1]} {c.startYear} — {MONTHS[c.endMonth - 1]} {c.endYear}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditCycle(c); setShowModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
              <div className="ovds-grid-layout cols-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                {[
                  { label: 'Increments/Year', value: c.incrementCount },
                  { label: 'Interval (mo)', value: c.incrementInterval },
                  { label: 'Increment %', value: `${c.incrementPercentage}%` },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <CycleModal cycle={editCycle} onClose={() => setShowModal(false)} onSave={fetchCycles} />}
    </div>
  );
};

export default FinancialCyclesPanel;










