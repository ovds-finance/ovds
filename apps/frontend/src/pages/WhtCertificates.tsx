/**
 * WHT Certificates — Ethiopian Withholding Tax Certificate Management
 * Proclamation No. 1395/2025 — ERCA
 * Covers: GOODS 2%, SERVICES 2%, NON-RESIDENT 15%, RENT 30%, DIVIDEND 15%, INTEREST 10%
 */
import React, { useState, useEffect, useCallback } from 'react';
import { FileCheck, Plus, RefreshCw, Download, Send, XCircle, Eye, Zap } from 'lucide-react';
import { AppPage, AppKpi, AppGrid, AppCard } from '@ovds/ui';
import { Icon } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { fmtCurrency, fmtDate } from '@ovds/ui';
import toast from 'react-hot-toast';

// -- Types ---------------------------------------------------------------------
interface WhtCert {
  id: string;
  certNo: string;
  whtType: string;
  period: string;
  issueDate: string;
  supplierName: string;
  supplierTin?: string;
  agentName: string;
  grossAmount: number;
  whtRate: number;
  whtAmount: number;
  netPayable: number;
  remitted: boolean;
  status: 'DRAFT' | 'ISSUED' | 'REMITTED' | 'CANCELLED';
  billReference?: string;
  notes?: string;
  createdAt: string;
}

interface Summary {
  totalCertificates: number;
  totalGrossAmount: number;
  totalWhtDeducted: number;
  totalRemitted: number;
  totalUnremitted: number;
}

const WHT_TYPE_LABELS: Record<string, string> = {
  GOODS:       'Goods (2%)',
  SERVICES:    'Services (2%)',
  SERVICES_NR: 'Non-Resident (15%)',
  RENT:        'Rent (30%)',
  DIVIDEND:    'Dividend (15%)',   // Proc. 1395/2025 Art. 52
  INTEREST:    'Interest (10%)',   // Proc. 1395/2025 Art. 53
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     'bg-slate-100 text-slate-600',
  ISSUED:    'bg-blue-100 text-blue-700',
  REMITTED:  'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-600',
};

// -- Modal: Create Certificate -------------------------------------------------
const CreateModal: React.FC<{ onClose: () => void; onCreated: () => void; companyId?: string }> = ({ onClose, onCreated, companyId }) => {
  const [form, setForm] = useState({
    whtType: 'GOODS',
    period: new Date().toISOString().slice(0, 7),
    supplierName: '',
    supplierTin: '',
    agentName: '',
    grossAmount: '',
    billReference: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const rate: Record<string, number> = {
    GOODS: 0.02, SERVICES: 0.02, SERVICES_NR: 0.15,
    RENT: 0.30, DIVIDEND: 0.15, INTEREST: 0.10,
  };
  const whtAmount = form.grossAmount ? parseFloat(form.grossAmount) * rate[form.whtType] : 0;

  const submit = async () => {
    if (!form.supplierName || !form.grossAmount) { toast.error('Supplier name and amount are required'); return; }
    setSaving(true);
    try {
      await api.post('/ovds/wht-certificates', { ...form, grossAmount: parseFloat(form.grossAmount), companyId });
      toast.success('WHT Certificate created');
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to create certificate');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="ovds-module-title">New WHT Certificate</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><XCircle size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">WHT Type</label>
              <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" value={form.whtType} onChange={e => setForm(f => ({ ...f, whtType: e.target.value }))}>
                {Object.entries(WHT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Period</label>
              <input type="month" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Withholding Agent (Your Company)</label>
            <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="Company name" value={form.agentName} onChange={e => setForm(f => ({ ...f, agentName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Supplier / Payee Name</label>
              <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="Supplier name" value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Supplier TIN</label>
              <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="Optional" value={form.supplierTin} onChange={e => setForm(f => ({ ...f, supplierTin: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Gross Amount (ETB)</label>
              <input type="number" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="0.00" value={form.grossAmount} onChange={e => setForm(f => ({ ...f, grossAmount: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">WHT Amount (auto)</label>
              <div className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm bg-emerald-50 dark:bg-emerald-950/30 font-bold text-emerald-700 dark:text-emerald-400">
                ETB {whtAmount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Bill Reference (optional)</label>
            <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="Bill number" value={form.billReference} onChange={e => setForm(f => ({ ...f, billReference: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Notes</label>
            <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
            {saving ? 'Creating…' : 'Create Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Remit Modal --------------------------------------------------------------
const RemitModal: React.FC<{ cert: WhtCert; onClose: () => void; onDone: () => void }> = ({ cert, onClose, onDone }) => {
  const [ercaRef, setErcaRef] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!ercaRef.trim()) { toast.error('ERCA reference required'); return; }
    setSaving(true);
    try {
      await api.patch(`/ovds/wht-certificates/${cert.id}/remit`, { ercaReference: ercaRef });
      toast.success('Certificate marked as remitted');
      onDone(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
        <h2 className="ovds-module-title">Remit to MoR — {cert.certNo}</h2>
        <p className="ovds-body">WHT Amount: <strong className="text-emerald-600">ETB {Number(cert.whtAmount).toLocaleString()}</strong></p>
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">ERCA Reference Number</label>
          <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" placeholder="e.g. ERCA-2025-123456" value={ercaRef} onChange={e => setErcaRef(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Confirm Remittance'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const WhtCertificates: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const cid = selectedCompanyId ?? undefined;

  const [certs, setCerts]       = useState<WhtCert[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(false);
  const [period, setPeriod]     = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate]     = useState(false);
  const [remitTarget, setRemitTarget]   = useState<WhtCert | null>(null);
  const [autoGenLoading, setAutoGenLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get('/ovds/wht-certificates', { params: { companyId: cid, period, ...(statusFilter && { status: statusFilter }) } }),
        api.get('/ovds/wht-certificates/summary', { params: { companyId: cid, period } }),
      ]);
      setCerts(Array.isArray(listRes.data?.data) ? listRes.data.data : (listRes.data ?? []));
      setSummary(sumRes.data?.data ?? sumRes.data ?? null);
    } catch { toast.error('Failed to load WHT certificates'); }
    finally { setLoading(false); }
  }, [cid, period, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleIssue = async (cert: WhtCert) => {
    try {
      await api.patch(`/ovds/wht-certificates/${cert.id}/issue`);
      toast.success('Certificate issued'); load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  };

  const handleCancel = async (cert: WhtCert) => {
    if (!confirm(`Cancel certificate ${cert.certNo}?`)) return;
    try {
      await api.patch(`/ovds/wht-certificates/${cert.id}/cancel`);
      toast.success('Certificate cancelled'); load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  };

  const handleAutoGenerate = async () => {
    setAutoGenLoading(true);
    try {
      const res = await api.post('/ovds/wht-certificates/auto-generate', { period });
      toast.success(`Auto-generated ${res.data?.data?.generated ?? res.data?.generated ?? 0} certificates`);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Auto-generate failed'); }
    finally { setAutoGenLoading(false); }
  };

  const kpiCells = summary ? [
    { label: 'Total Certificates', value: summary.totalCertificates.toString(), accentCls: 'bg-violet-500' },
    { label: 'Gross Transactions', value: `ETB ${(summary.totalGrossAmount / 1000).toFixed(0)}K`, accentCls: 'bg-sky-500' },
    { label: 'WHT Deducted', value: `ETB ${(summary.totalWhtDeducted / 1000).toFixed(0)}K`, accentCls: 'bg-amber-500' },
    { label: 'Remitted to MoR', value: `ETB ${(summary.totalRemitted / 1000).toFixed(0)}K`, accentCls: 'bg-emerald-500' },
    { label: 'Unremitted', value: `ETB ${(summary.totalUnremitted / 1000).toFixed(0)}K`, accentCls: 'bg-rose-500' },
  ] : [];

  return (
    <AppPage
      title="WHT Certificates"
      subtitle="Withholding Tax — Proclamation No. 1395/2025 · Banking & ovds · Retail & E-commerce · IT & Software · Challenges Analysis · Revenue"
      icon={<FileCheck size={16} />}
      iconBg="bg-amber-500"
      crumbs={[{ label: 'Tax', to: '/tax/dashboard' }, { label: 'WHT Certificates' }]}
      actions={
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800">
            <option value="">All Status</option>
            {['DRAFT','ISSUED','REMITTED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={load} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : 'text-slate-500'} /></button>
          <button onClick={handleAutoGenerate} disabled={autoGenLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-bold hover:bg-amber-200 transition-colors disabled:opacity-50">
            <Zap size={14} />{autoGenLoading ? 'Generating…' : 'Auto-Generate'}
          </button>
          <button onClick={() => setShowCreate(true)} className="ovds-btn-primary flex items-center gap-1.5">
            <Plus size={14} /> New Certificate
          </button>
        </div>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* Rate reference card */}
      <div className="ovds-widget-card p-4 mb-4">
        <p className="ovds-section-title mb-3">WHT Rates — Proclamation No. 1395/2025</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Object.entries(WHT_TYPE_LABELS).map(([k, v]) => (
            <div key={k} className="bg-white dark:bg-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k}</div>
              <div className="ovds-value-sm text-amber-600 mt-0.5">
                {{GOODS:'2%',SERVICES:'2%',SERVICES_NR:'15%',RENT:'30%',DIVIDEND:'15%',INTEREST:'10%'}[k]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ovds-widget-card">
        <div className="ovds-widget-header">
          <h3 className="ovds-card-title">Certificates — {period}</h3>
          <span className="ovds-caption">{certs.length} record{certs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="ovds-widget-body overflow-x-auto">
          {loading ? (
            <div className="ovds-empty py-12"><RefreshCw size={20} className="animate-spin text-emerald-500 mb-2" /><span>Loading…</span></div>
          ) : certs.length === 0 ? (
            <div className="ovds-empty py-12">
              <FileCheck size={32} className="text-slate-300 mb-2" />
              <span>No certificates for {period}</span>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-emerald-600 hover:underline">Create one</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Cert No.','Type','Supplier','TIN','Gross Amt','WHT Amt','Net Payable','Status','Bill Ref','Actions'].map(h => (
                    <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certs.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs font-bold text-violet-700 dark:text-violet-400">{c.certNo}</td>
                    <td className="py-2.5 px-3 ovds-caption whitespace-nowrap">{WHT_TYPE_LABELS[c.whtType] ?? c.whtType}</td>
                    <td className="py-2.5 px-3 ovds-body font-bold">{c.supplierName}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-400">{c.supplierTin ?? '—'}</td>
                    <td className="py-2.5 px-3 ovds-number text-right">{Number(c.grossAmount).toLocaleString('en-ET', {minimumFractionDigits:2})}</td>
                    <td className="py-2.5 px-3 ovds-number text-right text-amber-700 dark:text-amber-400 font-bold">{Number(c.whtAmount).toLocaleString('en-ET', {minimumFractionDigits:2})}</td>
                    <td className="py-2.5 px-3 ovds-number text-right">{Number(c.netPayable).toLocaleString('en-ET', {minimumFractionDigits:2})}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="py-2.5 px-3 ovds-caption">{c.billReference ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        {c.status === 'DRAFT' && (
                          <button onClick={() => handleIssue(c)} title="Issue" className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 transition-colors">
                            <Send size={13} />
                          </button>
                        )}
                        {c.status === 'ISSUED' && (
                          <button onClick={() => setRemitTarget(c)} title="Remit to MoR" className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-emerald-600 transition-colors">
                            <Download size={13} />
                          </button>
                        )}
                        {(c.status === 'DRAFT' || c.status === 'ISSUED') && (
                          <button onClick={() => handleCancel(c)} title="Cancel" className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-rose-500 transition-colors">
                            <XCircle size={13} />
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

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} companyId={cid} />}
      {remitTarget && <RemitModal cert={remitTarget} onClose={() => setRemitTarget(null)} onDone={load} />}
    </AppPage>
  );
};

export default WhtCertificates;


