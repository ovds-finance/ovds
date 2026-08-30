/**
 * Bank Payroll Export
 * Generate bulk salary transfer files for Ethiopian banks (CBE, Awash, Dashen, etc.)
 * Downloads ready-to-upload files in each bank's required format.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Download, RefreshCw, CheckCircle, Plus, Send } from 'lucide-react';
import { AppPage, AppKpi } from '@ovds/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import toast from 'react-hot-toast';

type BankFormat = 'CBE' | 'AWASH' | 'DASHEN' | 'ABYSSINIA' | 'BERHAN' | 'GENERIC';

interface ExportRecord {
  id: string;
  period: string;
  bankFormat: BankFormat;
  employeeCount: number;
  totalAmount: number;
  fileName?: string;
  status: 'GENERATED' | 'SENT' | 'CONFIRMED' | 'FAILED';
  generatedBy?: string;
  sentAt?: string;
  confirmedAt?: string;
  createdAt: string;
}

const BANK_LABELS: Record<BankFormat, string> = {
  CBE:       'Commercial Bank of Ethiopia',
  AWASH:     'Awash Bank',
  DASHEN:    'Dashen Bank',
  ABYSSINIA: 'Bank of Abyssinia',
  BERHAN:    'Berhan Bank',
  GENERIC:   'Generic CSV',
};

const BANK_COLORS: Record<BankFormat, string> = {
  CBE:       'bg-blue-100 text-blue-700',
  AWASH:     'bg-amber-100 text-amber-700',
  DASHEN:    'bg-emerald-100 text-emerald-700',
  ABYSSINIA: 'bg-violet-100 text-violet-700',
  BERHAN:    'bg-rose-100 text-rose-700',
  GENERIC:   'bg-slate-100 text-slate-600',
};

const STATUS_COLOR: Record<string, string> = {
  GENERATED:  'bg-sky-100 text-sky-700',
  SENT:       'bg-amber-100 text-amber-700',
  CONFIRMED:  'bg-emerald-100 text-emerald-700',
  FAILED:     'bg-rose-100 text-rose-600',
};

const fmt = (n: number) => n.toLocaleString('en-ET', { minimumFractionDigits: 2 });

const BankPayrollExport: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const cid = selectedCompanyId ?? undefined;

  const [records, setRecords]   = useState<ExportRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [genPeriod, setGenPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [genBank, setGenBank]   = useState<BankFormat>('GENERIC');
  const [genLoading, setGenLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/payroll-bank-export', { params: { companyId: cid, year } });
      setRecords(Array.isArray(res.data?.data) ? res.data.data : (res.data ?? []));
    } catch { toast.error('Failed to load export records'); }
    finally { setLoading(false); }
  }, [cid, year]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenLoading(true);
    try {
      await api.post('/hr/payroll-bank-export/generate', { period: genPeriod, bankFormat: genBank });
      toast.success(`${BANK_LABELS[genBank]} file generated for ${genPeriod}`);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Generation failed'); }
    finally { setGenLoading(false); }
  };

  const download = async (rec: ExportRecord) => {
    try {
      const res = await api.get(`/hr/payroll-bank-export/${rec.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url; a.download = rec.fileName ?? `payroll-${rec.period}.txt`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const markSent = async (id: string) => {
    try { await api.patch(`/hr/payroll-bank-export/${id}/sent`); toast.success('Marked as sent'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  };

  const markConfirmed = async (id: string) => {
    try { await api.patch(`/hr/payroll-bank-export/${id}/confirmed`); toast.success('Confirmed'); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  };

  const totalGenerated = records.filter(r => r.status !== 'FAILED').reduce((s, r) => s + Number(r.totalAmount), 0);

  const kpiCells = [
    { label: 'Total Exports',    value: records.length.toString(),                                          accentCls: 'bg-sky-500' },
    { label: 'Total Disbursed',  value: `ETB ${(totalGenerated / 1000).toFixed(0)}K`,                      accentCls: 'bg-emerald-500' },
    { label: 'Confirmed',        value: records.filter(r => r.status === 'CONFIRMED').length.toString(),   accentCls: 'bg-emerald-500' },
    { label: 'Pending Send',     value: records.filter(r => r.status === 'GENERATED').length.toString(),   accentCls: records.filter(r => r.status === 'GENERATED').length > 0 ? 'bg-amber-500' : 'bg-slate-300' },
  ];

  return (
    <AppPage
      title="Bank Payroll Export"
      subtitle="Generate bulk salary transfer files for Ethiopian banks · Banking & ovds · ERP · Accounting & ovds Software · Revenue · Market Segments"
      icon={<Building2 size={16} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'Payroll', to: '/hr/payroll' }, { label: 'Bank Export' }]}
      actions={
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={load} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : 'text-slate-500'} />
          </button>
        </div>
      }
    >
      <AppKpi cells={kpiCells} />

      {/* Generate strip */}
      <div className="ovds-widget-card p-5 mb-4">
        <p className="ovds-card-title mb-3">Generate New Export</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Payroll Period</label>
            <input type="month" value={genPeriod} onChange={e => setGenPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Bank Format</label>
            <select value={genBank} onChange={e => setGenBank(e.target.value as BankFormat)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800">
              {(Object.keys(BANK_LABELS) as BankFormat[]).map(k => (
                <option key={k} value={k}>{BANK_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <button onClick={generate} disabled={genLoading}
            className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50 h-[38px]">
            {genLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            {genLoading ? 'Generating…' : 'Generate File'}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.entries(BANK_LABELS) as [BankFormat, string][]).map(([k, v]) => (
            <div key={k} onClick={() => setGenBank(k)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${genBank === k ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${BANK_COLORS[k]}`}>{k}</span>
              <span className="ovds-caption truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Records table */}
      <div className="ovds-widget-card">
        <div className="ovds-widget-header">
          <h3 className="ovds-card-title">Export History — {year}</h3>
          <span className="ovds-caption">{records.length} exports</span>
        </div>
        <div className="ovds-widget-body overflow-x-auto">
          {records.length === 0 ? (
            <div className="ovds-empty py-12">
              <Building2 size={32} className="text-slate-300 mb-2" />
              <span>No exports yet for {year}</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Period','Bank','Employees','Total Net Pay','File Name','Status','Generated By','Actions'].map(h => (
                    <th key={h} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left py-2 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold">{r.period}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${BANK_COLORS[r.bankFormat]}`}>
                        {r.bankFormat}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center ovds-number">{r.employeeCount}</td>
                    <td className="py-2.5 px-3 ovds-number text-right font-bold text-emerald-700 dark:text-emerald-400">
                      ETB {fmt(Number(r.totalAmount))}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500 truncate max-w-[180px]">{r.fileName ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLOR[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 ovds-caption">{r.generatedBy ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => download(r)} title="Download file"
                          className="p-1.5 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg text-sky-600 transition-colors">
                          <Download size={13} />
                        </button>
                        {r.status === 'GENERATED' && (
                          <button onClick={() => markSent(r.id)} title="Mark as sent to bank"
                            className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-amber-600 transition-colors">
                            <Send size={13} />
                          </button>
                        )}
                        {r.status === 'SENT' && (
                          <button onClick={() => markConfirmed(r.id)} title="Mark as confirmed by bank"
                            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-emerald-600 transition-colors">
                            <CheckCircle size={13} />
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
    </AppPage>
  );
};

export default BankPayrollExport;

