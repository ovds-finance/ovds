/**
 * PAYE Declarations & Pension Remittances
 * Ethiopian payroll tax compliance dashboard.
 * - PAYE (PIT + DRRF) → ERCA, due last day of following month
 * - Pension (7% employee + 11% employer) → PFSA, due 30th of following month
 * Proclamation No. 1395/2025 + PFSA Regulations
 */
import { AppPage, AppKpi } from '@ovds/ui';
import { Users, RefreshCw, CheckCircle, AlertTriangle, Send, CreditCard } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import api from '../services/api';

// -- Types ---------------------------------------------------------------------
interface PayeDecl {
  id: string;
  period: string;
  employeeCount: number;
  totalGrossSalary: number;
  totalPit: number;
  totalEmpPension: number;
  totalEmpRPension: number;
  totalDrrf: number;
  netPayableErca: number;
  netPayablePfsa: number;
  status: string;
  dueDate?: string;
  ercaReference?: string;
  paidAt?: string;
  createdAt: string;
}

interface PensionRem {
  id: string;
  period: string;
  employeeCount: number;
  totalInsurableEarnings: number;
  employeeContrib: number;
  employerContrib: number;
  totalContrib: number;
  status: string;
  dueDate?: string;
  pfsaReference?: string;
  paidAt?: string;
}

type Tab = 'paye' | 'pension';

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  PAID:      'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  OVERDUE:   'bg-rose-100 text-rose-600',
};

const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// -- Submit Modal -------------------------------------------------------------
const SubmitModal: React.FC<{
  id: string; type: 'paye' | 'pension'; onClose: () => void; onDone: () => void;
}> = ({ id, type, onClose, onDone }) => {
  const [ref, setRef]     = useState('');
  const [saving, setSaving] = useState(false);
  const label = type === 'paye' ? 'ERCA Reference' : 'PFSA Reference';
  const submit = async () => {
    if (!ref.trim()) { toast.error(`${label} required`); return; }
    setSaving(true);
    try {
      const payload = type === 'paye' ? { ercaReference: ref } : { pfsaReference: ref };
      await api.patch(`/hr/paye/${type === 'paye' ? 'declarations' : 'pension'}/${id}/submit`, payload);
      toast.success('Submitted'); onDone(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
        <h2 className="ovds-module-title">{type === 'paye' ? 'Submit to MoR' : 'Submit to PFSA'}</h2>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">{label}</label>
          <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder={`e.g. ${type === 'paye' ? 'ERCA-2025-' : 'PFSA-2025-'}XXXXX`} value={ref} onChange={e => setRef(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors">
            {saving ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Mark Paid Modal ----------------------------------------------------------
const PayModal: React.FC<{
  id: string; type: 'paye' | 'pension'; onClose: () => void; onDone: () => void;
}> = ({ id, type, onClose, onDone }) => {
  const [payRef, setPayRef]   = useState('');
  const [bankName, setBankName] = useState('CBE');
  const [saving, setSaving]   = useState(false);
  const submit = async () => {
    if (!payRef.trim()) { toast.error('Payment reference required'); return; }
    setSaving(true);
    try {
      const path = type === 'paye' ? `/hr/paye/declarations/${id}/pay` : `/hr/paye/pension/${id}/pay`;
      await api.patch(path, { paymentReference: payRef, bankName });
      toast.success('Marked as paid'); onDone(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
        <h2 className="ovds-module-title">Mark as Paid</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Payment Reference</label>
            <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="Bank transfer ref" value={payRef} onChange={e => setPayRef(e.target.value)} />
          </div>
          {type === 'pension' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Bank</label>
              <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" value={bankName} onChange={e => setBankName(e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 bg-[var(--pro-azure)] text-white rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Main Component -------------------------------------------------------------
const PayeDeclarations: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const cid = selectedCompanyId ?? undefined;

  const [tab, setTab]               = useState<Tab>('paye');
  const [year, setYear]             = useState(new Date().getFullYear());
  const [loading, setLoading]       = useState(false);
  const [payeList, setPayeList]     = useState<PayeDecl[]>([]);
  const [pensionList, setPensionList] = useState<PensionRem[]>([]);
  const [compliance, setCompliance] = useState<any>(null);
  const [genPeriod, setGenPeriod]   = useState(new Date().toISOString().slice(0, 7));
  const [genLoading, setGenLoading] = useState(false);
  const [modal, setModal]           = useState<{ type: 'submit' | 'pay'; id: string; itemType: 'paye' | 'pension' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pd, pr, comp] = await Promise.all([
        api.get('/hr/paye/declarations', { params: { companyId: cid, year } }),
        api.get('/hr/paye/pension',      { params: { companyId: cid, year } }),
        api.get('/hr/paye/compliance',   { params: { companyId: cid } }),
      ]);
      setPayeList(Array.isArray(pd.data?.data) ? pd.data.data : (pd.data ?? []));
      setPensionList(Array.isArray(pr.data?.data) ? pr.data.data : (pr.data ?? []));
      setCompliance(comp.data?.data ?? comp.data);
    } catch { toast.error('Failed to load declarations'); }
    finally { setLoading(false); }
  }, [cid, year]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenLoading(true);
    try {
      await Promise.all([
        api.post('/hr/paye/declarations/generate', { period: genPeriod }),
        api.post('/hr/paye/pension/generate',      { period: genPeriod }),
      ]);
      toast.success(`Generated PAYE & Pension for ${genPeriod}`);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Generation failed'); }
    finally { setGenLoading(false); }
  };

  const kpiCells = compliance ? [
    { label: 'PAYE Overdue', value: compliance.paye?.overdue?.toString() ?? '0', accentCls: compliance.paye?.overdue > 0 ? 'bg-rose-500' : 'bg-[var(--pro-azure-50)]0' },
    { label: 'PAYE Overdue Amt', value: `ETB ${((compliance.paye?.overdueAmount ?? 0) / 1000).toFixed(0)}K`, accentCls: 'bg-amber-500' },
    { label: 'Pension Overdue', value: compliance.pension?.overdue?.toString() ?? '0', accentCls: compliance.pension?.overdue > 0 ? 'bg-rose-500' : 'bg-[var(--pro-azure-50)]0' },
    { label: 'Pension Overdue Amt', value: `ETB ${((compliance.pension?.overdueAmount ?? 0) / 1000).toFixed(0)}K`, accentCls: 'bg-amber-500' },
  ] : [];

  const TABS: { key: Tab; label: string }[] = [
    { key: 'paye',    label: 'PAYE to MoR' },
    { key: 'pension', label: 'Pension to PFSA' },
  ];

  return (
    <AppPage
      title="PAYE & Pension Declarations"
      subtitle="Monthly payroll tax compliance — MoR (PAYE/DRRF) &amp; PFSA (Pension)"
      icon={<Users size={16} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'Payroll', to: '/hr/payroll' }, { label: 'PAYE & Pension' }]}
      actions={
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={load} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><RefreshCw size={16} className={loading ? 'animate-spin text-[var(--pro-azure)]' : 'text-slate-500'} /></button>
        </div>
      }
      tabs={
        <div className="flex gap-1 ovds-tab-nav px-5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`ovds-tab ${tab === t.key ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* Generate strip */}
      <div className="ovds-widget-card p-4 mb-4 flex items-center gap-4 flex-wrap">
        <div>
          <p className="ovds-card-title">Generate Declarations</p>
          <p className="ovds-caption mt-0.5">Aggregates payroll records to build PAYE + Pension declarations</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="month" value={genPeriod} onChange={e => setGenPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" />
          <button onClick={generate} disabled={genLoading}
            className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50">
            {genLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {genLoading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {tab === 'paye' && (
        <div className="ovds-widget-card">
          <div className="ovds-widget-header">
            <h3 className="ovds-card-title">PAYE Declarations — {year}</h3>
            <span className="ovds-caption">{payeList.length} periods</span>
          </div>
          <div className="ovds-widget-body overflow-x-auto">
            {payeList.length === 0 ? (
              <div className="ovds-empty py-12"><AlertTriangle size={24} className="text-amber-400 mb-2" /><span>No declarations for {year}</span></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['Period','Employees','Gross Salary','PIT','Emp Pension','Empr Pension','DRRF','→ ERCA','→ PFSA','Due Date','Status','Actions'].map(h => (
                      <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left py-2 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payeList.map(d => (
                    <tr key={d.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">{d.period}</td>
                      <td className="py-2.5 px-3 text-center">{d.employeeCount}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{fmt(Number(d.totalGrossSalary))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right text-amber-700 dark:text-amber-400">{fmt(Number(d.totalPit))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{fmt(Number(d.totalEmpPension))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{fmt(Number(d.totalEmpRPension))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{fmt(Number(d.totalDrrf))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right font-bold text-rose-600 dark:text-rose-400">{fmt(Number(d.netPayableErca))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right font-bold text-sky-600 dark:text-sky-400">{fmt(Number(d.netPayablePfsa))}</td>
                      <td className="py-2.5 px-3 ovds-caption">
                        {d.dueDate ? new Date(d.dueDate).toLocaleDateString('en-ET') : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[d.status] ?? 'bg-slate-100 text-slate-600'}`}>{d.status}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {(d.status === 'DRAFT' || d.status === 'OVERDUE') && (
                            <button onClick={() => setModal({ type: 'submit', id: d.id, itemType: 'paye' })}
                              title="submit to MoR" className="p-1 hover:bg-[var(--pro-azure-50)] rounded-lg text-[var(--pro-azure)] transition-colors">
                              <Send size={13} />
                            </button>
                          )}
                          {d.status === 'SUBMITTED' && (
                            <button onClick={() => setModal({ type: 'pay', id: d.id, itemType: 'paye' })}
                              title="Mark Paid" className="p-1 hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/30 rounded-lg text-[var(--pro-azure)] transition-colors">
                              <CreditCard size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'pension' && (
        <div className="ovds-widget-card">
          <div className="ovds-widget-header">
            <h3 className="ovds-card-title">PFSA Pension Remittances — {year}</h3>
            <span className="ovds-caption">{pensionList.length} periods</span>
          </div>
          <div className="ovds-widget-body overflow-x-auto">
            {pensionList.length === 0 ? (
              <div className="ovds-empty py-12"><AlertTriangle size={24} className="text-amber-400 mb-2" /><span>No pension records for {year}</span></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['Period','Employees','Insurable Earnings','Employee (7%)','Employer (11%)','Total (18%)','Due Date','Status','Actions'].map(h => (
                      <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left py-2 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pensionList.map(d => (
                    <tr key={d.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">{d.period}</td>
                      <td className="py-2.5 px-3 text-center">{d.employeeCount}</td>
                      <td className="py-2.5 px-3 ovds-number text-right">{fmt(Number(d.totalInsurableEarnings))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right text-sky-700 dark:text-sky-400">{fmt(Number(d.employeeContrib))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right text-violet-700 dark:text-violet-400">{fmt(Number(d.employerContrib))}</td>
                      <td className="py-2.5 px-3 ovds-number text-right font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">{fmt(Number(d.totalContrib))}</td>
                      <td className="py-2.5 px-3 ovds-caption">{d.dueDate ? new Date(d.dueDate).toLocaleDateString('en-ET') : '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[d.status] ?? 'bg-slate-100 text-slate-600'}`}>{d.status}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {(d.status === 'DRAFT' || d.status === 'OVERDUE') && (
                            <button onClick={() => setModal({ type: 'submit', id: d.id, itemType: 'pension' })}
                              title="Submit to PFSA" className="p-1 hover:bg-[var(--pro-azure-50)] rounded-lg text-[var(--pro-azure)] transition-colors">
                              <Send size={13} />
                            </button>
                          )}
                          {d.status === 'SUBMITTED' && (
                            <button onClick={() => setModal({ type: 'pay', id: d.id, itemType: 'pension' })}
                              title="Mark Paid" className="p-1 hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-900/30 rounded-lg text-[var(--pro-azure)] transition-colors">
                              <CreditCard size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {modal?.type === 'submit' && (
        <SubmitModal id={modal.id} type={modal.itemType} onClose={() => setModal(null)} onDone={load} />
      )}
      {modal?.type === 'pay' && (
        <PayModal id={modal.id} type={modal.itemType} onClose={() => setModal(null)} onDone={load} />
      )}
    </AppPage>
  );
};

export default PayeDeclarations;


