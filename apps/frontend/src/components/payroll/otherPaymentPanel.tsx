import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { evalMath } from '@ovds/ui';
import { Skeleton } from '@ovds/ui';
import { Banknote, Plus, X } from 'lucide-react';
import { fmtDecimal } from '../../utils/fmt';

const fmt = fmtDecimal;

type OPStatus = 'GENERATED' | 'VERIFIED' | 'FINALIZED' | 'APPROVED';

interface OtherPaymentHead { id: string; name: string; shortCode: string; taxable: boolean }
interface OtherPayment {
  id: string; employeeId: string; headId: string; amount: number; status: OPStatus;
  diaryNo?: string; month: number; year: number;
  employee?: { firstName: string; lastName: string; employeeId: string };
  head?: { name: string; taxable: boolean };
}

const STATUS_COLOR: Record<OPStatus, string> = {
  GENERATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  VERIFIED:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  FINALIZED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  APPROVED:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const INPUT = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-400';

const OtherPaymentPanel: React.FC<{ year: number; month: number }> = ({ year, month }) => {
  const [subTab, setSubTab] = useState<'entries' | 'process' | 'approved'>('entries');
  const [heads, setHeads] = useState<OtherPaymentHead[]>([]);
  const [records, setRecords] = useState<OtherPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showHeadForm, setShowHeadForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', headId: '', amount: '', diaryNo: '' });
  const [headForm, setHeadForm] = useState({ name: '', shortCode: '', taxable: false });
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchHeads = useCallback(async () => {
    try { const r = await api.get('/payroll/other-payment-heads'); setHeads(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []); } catch { setHeads([]); }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/payroll/other-payments', { params: { year, month } }); setRecords(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : []); }
    catch { setRecords([]); } finally { setLoading(false); }
  }, [year, month]);

  const fetchEmployees = useCallback(async () => {
    try { const r = await api.get('/hr/employees?take=500'); setEmployees(Array.isArray(r.data?.data?.data) ? r.data.data.data : Array.isArray(r.data?.data) ? r.data.data : []); } catch { setEmployees([]); }
  }, []);

  useEffect(() => {
    fetchHeads();
    if (subTab !== 'entries') fetchRecords();
    else fetchEmployees();
  }, [subTab, fetchHeads, fetchRecords, fetchEmployees]);

  const saveHead = async () => {
    if (!headForm.name || !headForm.shortCode) { toast.error('Name and short code required'); return; }
    try {
      await api.post('/payroll/other-payment-heads', headForm);
      toast.success('Payment head added');
      setShowHeadForm(false);
      setHeadForm({ name: '', shortCode: '', taxable: false });
      fetchHeads();
    } catch { toast.error('Failed to save'); }
  };

  const saveEntry = async () => {
    if (!form.employeeId || !form.headId || !form.amount) { toast.error('Employee, head, and amount required'); return; }
    try {
      await api.post('/payroll/other-payments', { ...form, amount: Number(form.amount), month, year });
      toast.success('Entry saved');
      setShowForm(false);
      setForm({ employeeId: '', headId: '', amount: '', diaryNo: '' });
      fetchRecords();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save'); }
  };

  const advance = async (toStatus: string) => {
    if (!selected.size) { toast.error('Select records first'); return; }
    try {
      await api.post('/payroll/other-payments/bulk-status', { ids: [...selected], status: toStatus });
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
          <Banknote size={18} className="text-emerald-600 dark:text-emerald-400" /> Other Taxable Payments
        </h3>
        <button onClick={() => setShowHeadForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <Plus size={13} /> Manage Heads
        </button>
      </div>

      {/* Head management */}
      {showHeadForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Payment Heads</p>
            <button onClick={() => setShowHeadForm(false)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="ovds-grid-layout cols-3">
            <input value={headForm.name} onChange={e => setHeadForm(p => ({ ...p, name: e.target.value }))} placeholder="Head name *" className={INPUT} />
            <input value={headForm.shortCode} onChange={e => setHeadForm(p => ({ ...p, shortCode: e.target.value }))} placeholder="Short code *" className={INPUT} />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="taxable" checked={headForm.taxable} onChange={e => setHeadForm(p => ({ ...p, taxable: e.target.checked }))} className="rounded" />
              <label htmlFor="taxable" className="text-sm text-slate-600 dark:text-slate-300">Taxable</label>
            </div>
          </div>
          <button onClick={saveHead} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold">Add Head</button>
          {heads.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {heads.map(h => (
                <span key={h.id} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${h.taxable ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                  {h.name} ({h.shortCode}){h.taxable ? ' — Taxable' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {([['entries','Entries'],['process','Process'],['approved','Approved']] as const).map(([t, l]) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${subTab === t ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Entries tab */}
      {subTab === 'entries' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600">
              <Plus size={14} /> Add Single Entry
            </button>
          </div>
          {showForm && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">New Other Payment Entry</p>
                <button onClick={() => setShowForm(false)}><X size={14} className="text-slate-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))} className={INPUT}>
                  <option value="">Select Employee *</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
                </select>
                <select value={form.headId} onChange={e => setForm(p => ({ ...p, headId: e.target.value }))} className={INPUT}>
                  <option value="">Select Payment Head *</option>
                  {heads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <input type="text" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} onBlur={e => setForm(p => ({ ...p, amount: String(evalMath(e.target.value) ?? e.target.value) }))}
                  placeholder="Amount (ETB) *" className={INPUT} />
                <input value={form.diaryNo} onChange={e => setForm(p => ({ ...p, diaryNo: e.target.value }))}
                  placeholder="Diary No (optional)" className={INPUT} />
              </div>
              <button onClick={saveEntry} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold">Save Entry</button>
            </div>
          )}
          <p className="text-xs text-slate-400 italic">Entries for {month}/{year} — switch to Process tab to advance workflow.</p>
        </div>
      )}

      {/* Process / Approved */}
      {(subTab === 'process' || subTab === 'approved') && (
        <div className="space-y-3">
          {subTab === 'process' && selected.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{selected.size} selected</span>
              <div className="flex gap-2 ml-auto">
                {[['Verify','VERIFIED','bg-amber-500'],['Un-Verify','GENERATED','bg-slate-500'],['Finalize','FINALIZED','bg-teal-600'],['Approve','APPROVED','bg-emerald-500']].map(([l,s,c]) => (
                  <button key={s} onClick={() => advance(s)} className={`px-3 py-1.5 ${c} text-white rounded-lg text-xs font-bold hover:opacity-90`}>{l}</button>
                ))}
              </div>
            </div>
          )}
          <div className="ovds-widget-card overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                {subTab === 'process' && <th className="px-4 py-3"><input type="checkbox" onChange={() => setSelected(p => p.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)))} className="rounded" /></th>}
                {['Employee','Payment Head','Taxable','Amount','Diary No','Status'].map(h => <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {loading ? <Skeleton.TableRows cols={7} /> : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm italic">No other payment records</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    {subTab === 'process' && <td className="px-4 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded" /></td>}
                    <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200">{r.employee?.firstName} {r.employee?.lastName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.head?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${r.head?.taxable ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {r.head?.taxable ? 'Taxable' : 'Non-Taxable'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">ETB {fmt(r.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{r.diaryNo || '—'}</td>
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

export default OtherPaymentPanel;








