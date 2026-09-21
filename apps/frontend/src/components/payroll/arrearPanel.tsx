import { Skeleton } from '@ovds/ui';
import { ArrowLeftRight, Plus, X } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';
import { fmtDecimal } from '../../utils/fmt';

const fmt = fmtDecimal;

type ArrearStatus = 'GENERATED' | 'VERIFIED' | 'FINALIZED' | 'APPROVED';

interface ArrearType { id: string; name: string; description?: string }
interface ArrearConfig {
  id: string; name: string; arrearTypeId: string; fromDate: string; toDate: string;
  arrearType?: ArrearType;
}
interface ArrearRecord {
  id: string; employeeId: string; configId: string; amount: number; status: ArrearStatus;
  employee?: { firstName: string; lastName: string; employeeId: string };
  config?: { name: string };
}

const STATUS_COLOR: Record<ArrearStatus, string> = {
  GENERATED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300',
  VERIFIED:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  FINALIZED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  APPROVED:  'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300',
};

const INPUT = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400';

const ArrearPanel: React.FC<{ year: number; month: number }> = ({ year, month }) => {
  const [subTab, setSubTab] = useState<'types' | 'config' | 'process' | 'approved'>('types');
  const [types, setTypes] = useState<ArrearType[]>([]);
  const [configs, setConfigs] = useState<ArrearConfig[]>([]);
  const [records, setRecords] = useState<ArrearRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: '', description: '' });
  const [configForm, setConfigForm] = useState({ name: '', arrearTypeId: '', fromDate: '', toDate: '' });

  const fetchTypes = useCallback(async () => {
    try { const r = await api.get('/payroll/arrears/types'); setTypes(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []); } catch { setTypes([]); }
  }, []);

  const fetchConfigs = useCallback(async () => {
    try { const r = await api.get('/payroll/arrears/configs'); setConfigs(Array.isArray(r.data?.data?.data) ? r.data.data.data : Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []); } catch { setConfigs([]); }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/payroll/arrears', { params: { year, month } }); setRecords(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []); }
    catch { setRecords([]); } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => {
    if (subTab === 'types') fetchTypes();
    else if (subTab === 'config') { fetchTypes(); fetchConfigs(); }
    else fetchRecords();
  }, [subTab, fetchTypes, fetchConfigs, fetchRecords]);

  const saveType = async () => {
    if (!typeForm.name.trim()) { toast.error('Name required'); return; }
    try {
      await api.post('/payroll/arrears/types', typeForm);
      toast.success('Arrear type added');
      setShowTypeForm(false);
      setTypeForm({ name: '', description: '' });
      fetchTypes();
    } catch { toast.error('Failed to save'); }
  };

  const saveConfig = async () => {
    if (!configForm.name || !configForm.arrearTypeId || !configForm.fromDate || !configForm.toDate) {
      toast.error('All fields required'); return;
    }
    try {
      await api.post('/payroll/arrears/configs', configForm);
      toast.success('Configuration saved');
      setShowConfigForm(false);
      setConfigForm({ name: '', arrearTypeId: '', fromDate: '', toDate: '' });
      fetchConfigs();
    } catch { toast.error('Failed to save'); }
  };

  const advance = async (toStatus: string) => {
    if (!selected.size) { toast.error('Select records first'); return; }
    try {
      await api.post('/payroll/arrears/bulk-status', { ids: [...selected], status: toStatus });
      toast.success(`Moved to ${toStatus}`);
      setSelected(new Set());
      fetchRecords();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  const filtered = records.filter(r => subTab === 'approved' ? r.status === 'APPROVED' : r.status !== 'APPROVED');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> Arrear Management
        </h3>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {([['types','Arrear Types'],['config','Configuration'],['process','Process'],['approved','Approved']] as const).map(([t, l]) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === t ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Arrear Types */}
      {subTab === 'types' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowTypeForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)]">
              <Plus size={14} /> Add Arrear Type
            </button>
          </div>
          {showTypeForm && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">New Arrear Type</p>
                <button onClick={() => setShowTypeForm(false)}><X size={14} className="text-slate-400" /></button>
              </div>
              <input value={typeForm.name} onChange={e => setTypeForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Type name *" className={INPUT} />
              <input value={typeForm.description} onChange={e => setTypeForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)" className={INPUT} />
              <button onClick={saveType} className="px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          )}
          <div className="ovds-widget-card overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Name','Description'].map(h => <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {types.length === 0 ? (
                  <tr><td colSpan={2} className="py-10 text-center text-slate-400 text-sm italic">No arrear types defined</td></tr>
                ) : types.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200">{t.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Configuration */}
      {subTab === 'config' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowConfigForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-dark)]">
              <Plus size={14} /> Add Configuration
            </button>
          </div>
          {showConfigForm && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">New Arrear Configuration</p>
                <button onClick={() => setShowConfigForm(false)}><X size={14} className="text-slate-400" /></button>
              </div>
              <input value={configForm.name} onChange={e => setConfigForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Configuration name *" className={INPUT} />
              <select value={configForm.arrearTypeId} onChange={e => setConfigForm(p => ({ ...p, arrearTypeId: e.target.value }))} className={INPUT}>
                <option value="">Select Arrear Type *</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ovds-label mb-1 block">From Date *</label>
                  <input type="date" value={configForm.fromDate} onChange={e => setConfigForm(p => ({ ...p, fromDate: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className="ovds-label mb-1 block">To Date *</label>
                  <input type="date" value={configForm.toDate} onChange={e => setConfigForm(p => ({ ...p, toDate: e.target.value }))} className={INPUT} />
                </div>
              </div>
              <button onClick={saveConfig} className="px-4 py-2 bg-[var(--pro-azure)] text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          )}
          <div className="ovds-widget-card overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {['Name','Type','From','To'].map(h => <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {configs.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm italic">No configurations defined</td></tr>
                ) : configs.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.arrearType?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.fromDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.toDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Process / Approved */}
      {(subTab === 'process' || subTab === 'approved') && (
        <div className="space-y-3">
          {subTab === 'process' && selected.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
              <span className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{selected.size} selected</span>
              <div className="flex gap-2 ml-auto">
                {[['Verify','VERIFIED','bg-amber-500'],['Un-Verify','GENERATED','bg-slate-500'],['Finalize','FINALIZED','bg-teal-600'],['Approve','APPROVED','bg-[var(--pro-azure-50)]0']].map(([l,s,c]) => (
                  <button key={s} onClick={() => advance(s)} className={`px-3 py-1.5 ${c} text-white rounded-lg text-xs font-bold hover:opacity-90`}>{l}</button>
                ))}
              </div>
            </div>
          )}
          <div className="ovds-widget-card overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {subTab === 'process' && <th className="px-4 py-3"><input type="checkbox" onChange={() => setSelected(p => p.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))} className="rounded" /></th>}
                {['Employee','Configuration','Amount','Status'].map(h => <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {loading ? <Skeleton.TableRows cols={5} /> : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm italic">No arrear records</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    {subTab === 'process' && <td className="px-4 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded" /></td>}
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200">{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.config?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">ETB {fmt(r.amount)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLOR[r.status]}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrearPanel;








