import { Skeleton } from '@ovds/ui';
import { TrendingUp, RefreshCw, Zap, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { confirm } from '../../utils/confirm';
import { fmtDecimal } from '../../utils/fmt';

const fmt = fmtDecimal;

type IncrStatus = 'GENERATED' | 'VERIFIED' | 'FINALIZED' | 'APPROVED';

interface IncrRecord {
  id: string;
  employeeId: string;
  employee?: { firstName: string; lastName: string; employeeId: string; department?: { name: string } };
  currentBasic: number;
  newBasic: number;
  incrementPct: number;
  status: IncrStatus;
  month: number;
  year: number;
}

const STATUS_COLOR: Record<IncrStatus, string> = {
  GENERATED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  VERIFIED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  FINALIZED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  APPROVED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-[var(--pro-azure-light)]',
};

const IncrementPanel: React.FC<{ year: number; month: number }> = ({ year, month }) => {
  const [records, setRecords] = useState<IncrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [subTab, setSubTab] = useState<'process' | 'approved'>('process');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/increments', { params: { year, month } });
      setRecords(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  const toggleAll = () => {
    const ids = filtered.map(r => r.id);
    setSelected(p => p.size === ids.length ? new Set() : new Set(ids));
  };

  const advance = async (toStatus: string) => {
    if (!selected.size) { toast.error('Select records first'); return; }
    try {
      await api.post('/payroll/increments/bulk-status', { ids: [...selected], status: toStatus });
      toast.success(`Moved to ${toStatus}`);
      setSelected(new Set());
      fetch();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/payroll/increments/generate', { year, month });
      toast.success(`Generated ${res.data?.data?.count ?? 0} increments`);
      fetch();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Generation failed'); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Delete Increment', message: 'Delete this increment record?', variant: 'danger' })) return;
    try {
      await api.delete(`/payroll/increments/${id}`);
      toast.success('Deleted');
      fetch();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = records.filter(r => subTab === 'approved' ? r.status === 'APPROVED' : r.status !== 'APPROVED');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> Increment Management
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Generate → Verify → Finalize → Approve</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400">
            <RefreshCw size={14} />
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50">
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
            Generate Increments
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {(['process', 'approved'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${subTab === t ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>
            {t === 'process' ? 'Process' : 'Approved List'}
          </button>
        ))}
      </div>

      {/* Workflow actions */}
      {subTab === 'process' && selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
          <span className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {[
              { label: 'Verify', status: 'VERIFIED', color: 'bg-amber-500' },
              { label: 'Un-Verify', status: 'GENERATED', color: 'bg-slate-500' },
              { label: 'Finalize', status: 'FINALIZED', color: 'bg-teal-600' },
              { label: 'Approve', status: 'APPROVED', color: 'bg-[var(--pro-azure-50)]0' },
            ].map(({ label, status, color }) => (
              <button key={status} onClick={() => advance(status)}
                className={`px-3 py-1.5 ${color} text-white rounded-lg text-xs font-bold hover:opacity-90`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="ovds-widget-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {subTab === 'process' && (
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="rounded" />
                </th>
              )}
              {['Employee', 'Department', 'Current Basic', 'New Basic', 'Increment %', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {loading ? <Skeleton.TableRows cols={7} /> : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400 text-sm italic">No increment records for this period</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {subTab === 'process' && (
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded" />
                  </td>
                )}
                <td className="px-4 py-3">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {r.employee?.firstName} {r.employee?.lastName}
                  </p>
                  <p className="ovds-caption">{r.employee?.employeeId}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.employee?.department?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">ETB {fmt(r.currentBasic)}</td>
                <td className="px-4 py-3 text-xs font-bold text-[var(--pro-azure)]">ETB {fmt(r.newBasic)}</td>
                <td className="px-4 py-3 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">+{r.incrementPct}%</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  {r.status === 'GENERATED' && (
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncrementPanel;







