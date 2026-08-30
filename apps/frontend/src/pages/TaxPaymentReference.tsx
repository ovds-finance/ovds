/**
 * Tax Payment Reference / Voucher Page — Phase 4 · Submit to MoR
 *
 * Generates MoR payment vouchers and reference numbers for
 * digital tax settlement after filing on the eTax portal.
 *
 * Covers: VAT · TOT · BIT · WHT · DRRF · Pension
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Banknote, RefreshCw, Download, Plus, Info, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtCurrency } from '../utils/fmt';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

interface PaymentRef {
  id: string;
  taxType: string;
  period: string;
  grossLiability: number;
  creditsApplied: number;
  netAmountDue: number;
  paymentDeadline: string;
  eTaxReference?: string;
  bankReference?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  generatedAt: string;
}

const TAX_TYPE_LABELS: Record<string, string> = {
  VAT:      'VAT',
  TOT:      'TOT',
  BIT:      'Business Income Tax',
  WHT:      'Withholding Tax',
  DRRF:     'DRRF Levy',
  PENSION:  'Pension Remittance',
  PIT:      'Personal Income Tax',
};

const STATUS_CFG = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border border-amber-200',     icon: Clock },
  PAID:    { label: 'Paid',    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: CheckCircle2 },
  OVERDUE: { label: 'Overdue', cls: 'bg-rose-50 text-rose-700 border border-rose-200',          icon: AlertTriangle },
};

const TaxPaymentReferencePage: React.FC = () => {
  usePageTitle('Payment Reference / Voucher');
  const { selectedCompanyId } = useBusiness();
  const [vouchers, setVouchers]       = useState<PaymentRef[]>([]);
  const [loading, setLoading]         = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [bankRefs, setBankRefs]       = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    taxType: 'VAT',
    period: (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`; })(),
    grossLiability: '',
    creditsApplied: '',
    eTaxReference: '',
    paymentDeadline: '',
  });

  const fetchVouchers = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await api.get('/tax/payment-reference');
      setVouchers(Array.isArray(res.data?.data) ? res.data.data : res.data ?? []);
    } catch {
      toast.error('Failed to load payment references');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const generateVoucher = async () => {
    const gross = parseFloat(form.grossLiability);
    if (!form.taxType || !form.period || isNaN(gross)) {
      toast.error('Tax type, period, and gross liability are required');
      return;
    }
    setGenerating(true);
    try {
      await api.post('/tax/payment-reference', {
        taxType:         form.taxType,
        period:          form.period,
        grossLiability:  gross,
        creditsApplied:  parseFloat(form.creditsApplied) || 0,
        netAmountDue:    gross - (parseFloat(form.creditsApplied) || 0),
        eTaxReference:   form.eTaxReference || undefined,
        paymentDeadline: form.paymentDeadline || undefined,
      });
      toast.success('Payment voucher generated');
      setShowForm(false);
      setForm(f => ({ ...f, grossLiability: '', creditsApplied: '', eTaxReference: '' }));
      fetchVouchers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const markPaid = async (id: string, bankRef: string) => {
    try {
      await api.patch(`/tax/payment-reference/${id}`, { status: 'PAID', bankReference: bankRef });
      toast.success('Marked as paid');
      fetchVouchers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const totalPending = vouchers.filter(v => v.status === 'PENDING').reduce((s, v) => s + v.netAmountDue, 0);
  const totalPaid    = vouchers.filter(v => v.status === 'PAID').reduce((s, v) => s + v.netAmountDue, 0);

  const inp = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500';

  return (
    <AppPage
      title="Payment Reference / Voucher"
      subtitle="Generate MoR payment vouchers and reference numbers for digital tax settlement"
      icon={<Banknote size={18} />}
      iconBg="bg-amber-500"
      crumbs={[{ label: '4 · Submit to MoR' }, { label: 'Tax Filing Portal' }, { label: 'Payment Reference' }]}
      actions={
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm"
            icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={fetchVouchers} disabled={loading}>
            Refresh
          </Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(v => !v)}>
            New Voucher
          </Btn>
        </div>
      }
    >
      <div className="space-y-5">

        {/* KPI strip */}
        <div className="ovds-stat-row">
          {[
            { label: 'Total Pending',      value: fmt(totalPending), accent: 'bg-amber-500' },
            { label: 'Total Paid (YTD)',   value: fmt(totalPaid),    accent: 'bg-emerald-500' },
            { label: 'Vouchers',           value: String(vouchers.length), accent: 'bg-sky-500' },
            { label: 'Overdue',            value: String(vouchers.filter(v => v.status === 'OVERDUE').length), accent: 'bg-rose-500' },
          ].map(kpi => (
            <div key={kpi.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${kpi.accent}`} />
              <div>
                <p className="ovds-value-sm">{kpi.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* New voucher form */}
        {showForm && (
          <div className="ovds-widget-card">
            <div className="ovds-widget-header">
              <Plus size={15} className="text-amber-500" />
              <h3 className="ovds-card-title">Generate Payment Voucher</h3>
            </div>
            <div className="ovds-widget-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Tax Type</label>
                  <select value={form.taxType} onChange={e => setForm(f => ({ ...f, taxType: e.target.value }))} className={inp}>
                    {Object.entries(TAX_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Period</label>
                  <input type="month" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Gross Liability (ETB)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.grossLiability} onChange={e => setForm(f => ({ ...f, grossLiability: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Credits / Advance Paid (ETB)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.creditsApplied} onChange={e => setForm(f => ({ ...f, creditsApplied: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">eTax Reference No.</label>
                  <input type="text" placeholder="From eTax portal submission" value={form.eTaxReference} onChange={e => setForm(f => ({ ...f, eTaxReference: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Payment Deadline</label>
                  <input type="date" value={form.paymentDeadline} onChange={e => setForm(f => ({ ...f, paymentDeadline: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <div className="text-sm">
                  Net Amount Due: <strong className="text-amber-600 tabular-nums">
                    {fmt((parseFloat(form.grossLiability) || 0) - (parseFloat(form.creditsApplied) || 0))}
                  </strong>
                </div>
                <div className="flex gap-2">
                  <Btn variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Btn>
                  <Btn variant="primary" size="sm"
                    icon={generating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    onClick={generateVoucher} disabled={generating}>
                    {generating ? 'Generating…' : 'Generate Voucher'}
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voucher list */}
        <div className="ovds-widget-card overflow-hidden">
          <div className="ovds-widget-header">
            <Banknote size={15} className="text-amber-500" />
            <h3 className="ovds-card-title">Payment Vouchers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  {['Tax Type', 'Period', 'Gross', 'Credits', 'Net Due', 'Deadline', 'Status', 'eTax Ref', 'Bank Ref', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>{Array(10).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <Banknote size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">No payment vouchers yet</p>
                      <p className="text-xs text-slate-300 mt-1">Generate a voucher after filing on the eTax portal</p>
                    </td>
                  </tr>
                ) : vouchers.map(v => {
                  const cfg = STATUS_CFG[v.status] ?? STATUS_CFG.PENDING;
                  const StatusIcon = cfg.icon;
                  const bankRef = bankRefs[v.id] ?? '';
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">{TAX_TYPE_LABELS[v.taxType] ?? v.taxType}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{v.period}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-right">{fmt(v.grossLiability)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-right text-emerald-600">{fmt(v.creditsApplied)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-right font-bold text-amber-600">{fmt(v.netAmountDue)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{v.paymentDeadline ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
                          <StatusIcon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{v.eTaxReference ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{v.bankReference ?? '—'}</td>
                      <td className="px-4 py-3">
                        {v.status === 'PENDING' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Bank ref"
                              value={bankRef}
                              onChange={e => setBankRefs(prev => ({ ...prev, [v.id]: e.target.value }))}
                              className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                            <button
                              onClick={() => markPaid(v.id, bankRef)}
                              disabled={!bankRef.trim()}
                              className="px-2 py-1 text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors disabled:opacity-40"
                            >
                              Paid
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-2.5 px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs text-slate-500">
          <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
          <span>
            After filing on the eTax portal, generate a voucher here to track the payment reference.
            Pay at any <strong>commercial bank</strong> or via <strong>Telebirr</strong> using the eTax payment slip.
            Enter the bank reference number above once payment is confirmed to close the record.
          </span>
        </div>

      </div>
    </AppPage>
  );
};

export default TaxPaymentReferencePage;
