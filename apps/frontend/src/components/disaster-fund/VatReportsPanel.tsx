import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { fmtDecimal } from '../../utils/fmt';
import {
  ShieldCheck,
  Globe,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Printer,
  RefreshCw,
  Info,
  BarChart3,
  Clock,
  Wallet,
  Send,
  History,
  Zap,
} from 'lucide-react';

const fmt = fmtDecimal;

type WithholdingType = 'VAT' | 'INCOME_TAX';

interface WithholdingEntry {
  id: string;
  type: WithholdingType;
  supplier: string;
  tin: string;
  invoiceDate: string;
  invoiceAmount: number;
  withheldAmount: number;
  remitted: boolean;
}

// -- WithholdingTable sub-component --------------------------------------------
interface WithholdingTableProps {
  data: WithholdingEntry[];
  onToggleRemitted: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

const WithholdingTable: React.FC<WithholdingTableProps> = ({ data, onToggleRemitted, onDelete }) => {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs italic">
        No entries yet — add one above.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            {['Supplier', 'TIN', 'Invoice Date', 'Invoice Amount', 'Withheld', 'Status', ''].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {data.map(e => (
            <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{e.supplier}</td>
              <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">{e.tin}</td>
              <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{e.invoiceDate}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">ETB {fmt(e.invoiceAmount)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">ETB {fmt(e.withheldAmount)}</td>
              <td className="px-4 py-2.5">
                <button
                  onClick={() => onToggleRemitted(e.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                    e.remitted
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                  }`}
                >
                  {e.remitted ? 'Remitted' : 'Pending'}
                </button>
              </td>
              <td className="px-4 py-2.5">
                <button
                  onClick={() => onDelete(e.id)}
                  className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Delete"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const VatReportsPanel: React.FC = () => {
  const [entries, setEntries] = useState<WithholdingEntry[]>([]);
  const [, setEntriesLoading] = useState(true);

  const fetchWithholding = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const res = await api.get('/vat/withholding', { headers: { 'x-background': '1' } });
      const raw = res.data?.data ?? res.data ?? [];
      setEntries(
        (Array.isArray(raw) ? raw : []).map((w: any) => ({
          id: String(w.id ?? ''),
          type: (w.type ?? (w.withheldVat !== undefined ? 'VAT' : 'INCOME_TAX')) as WithholdingType,
          supplier: w.supplier ?? w.supplierName ?? '—',
          tin: w.tin ?? '',
          invoiceDate: (w.invoiceDate ?? w.createdAt ?? '').split('T')[0] || '',
          invoiceAmount: Number(w.invoiceAmount ?? w.amount ?? 0),
          withheldAmount: Number(w.withheldVat ?? w.withheldAmount ?? 0),
          remitted: Boolean(w.remitted),
        })),
      );
    } catch {
      // degrade to empty
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithholding();
  }, [fetchWithholding]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'VAT' as WithholdingType,
    supplier: '',
    tin: '',
    invoiceDate: '',
    invoiceAmount: '',
  });

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [vatSummary, setVatSummary] = useState<any>(null);
  const [vatFilings, setVatFilings] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loadingVat, setLoadingVat] = useState(false);

  const fetchVatData = useCallback(async () => {
    setLoadingVat(true);
    try {
      const [sumRes, filRes, billRes] = await Promise.all([
        api.get('/vat/summary'),
        api.get('/vat/filings'),
        api.get('/ovds/bills'),
      ]);
      setVatSummary(sumRes.data?.data ?? sumRes.data);
      setVatFilings(filRes.data?.data ?? filRes.data);
      setBills(billRes.data?.data ?? billRes.data ?? []);
    } catch {
      toast.error('Failed to load system data');
    } finally {
      setLoadingVat(false);
    }
  }, []);

  useEffect(() => {
    fetchVatData();
  }, [fetchVatData]);

  const suggestedWithholding = useMemo(() => {
    // Ethiopian WHT rule: 3% on goods ≥ ETB 10,000 — Proclamation No. 1395/2025
    // (rate was raised from 2% → 3% by Proc. 1395/2025, aligned with services rate)
    const WHT_RATE = 0.03;
    const WHT_THRESHOLD = 10_000;
    return bills
      .filter((b) => Number(b.amount) >= WHT_THRESHOLD)
      .filter(
        (b) =>
          !entries.some(
            (e) => e.supplier === b.vendor && e.invoiceDate === String(b.createdAt ?? '').split('T')[0],
          ),
      )
      .map((b) => ({
        id: `sug-${b.id}`,
        type: 'VAT' as WithholdingType,
        supplier: b.vendor,
        tin: 'VERIFY-TIN',
        invoiceDate: String(b.createdAt ?? '').split('T')[0],
        invoiceAmount: Number(b.amount),
        withheldAmount: Number(b.amount) * WHT_RATE,
        remitted: false,
        billId: b.id,
      }));
  }, [bills, entries]);

  const syncSuggested = async () => {
    if (suggestedWithholding.length === 0) return;
    let synced = 0;
    for (const s of suggestedWithholding) {
      try {
        const res = await api.post('/vat/withholding', {
          supplier: s.supplier,
          tin: s.tin,
          invoiceDate: s.invoiceDate,
          invoiceAmount: s.invoiceAmount,
          period: s.invoiceDate.slice(0, 7),
        });
        const created = res.data?.data ?? res.data;
        setEntries((prev) => [
          { ...s, id: created.id ?? s.id, withheldAmount: created.withheldVat ?? s.withheldAmount },
          ...prev,
        ]);
        synced++;
      } catch {
        // skip
      }
    }
    if (synced > 0) toast.success(`Synced ${synced} withholding items from bills`);
  };

  const handleCalculateVat = async () => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    setLoadingVat(true);
    try {
      await api.post('/vat/filings/calculate', { startDate: start, endDate: end, period });
      toast.success(`VAT filing for ${period} calculated & posted to GL`);
      fetchVatData();
    } catch {
      toast.error('Failed to calculate VAT filing');
    } finally {
      setLoadingVat(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const totalWht = entries.filter((e) => !e.remitted).reduce((s, e) => s + e.withheldAmount, 0);
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await api.post('/vat/etax-submissions', {
        period,
        type: 'WHT_RETURN',
        totalAmount: totalWht,
        notes: 'WHT return submitted from VAT Reports Panel',
      });
      toast.success('Tax & VAT Withholding Report submitted to ERCA successfully');
      setShowSubmitModal(false);
      fetchWithholding();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const printAgedSummary = () => {
    const w = window.open('', '_blank');
    if (!w) return;

    // Keep existing inline print styling but make sure it’s syntactically correct.
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #1e293b;">
        <h1 style="font-size: 20px; font-weight: 900; margin-bottom: 8px;">Aged Withholding Summary</h1>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 24px;">System-wide Tax & VAT withholding status as of ${new Date().toLocaleDateString()}</p>
        <div style="display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Current (0-30)</p>
            <p style="font-size: 16px; font-weight: 900; color: #00E784;">ETB ${fmt(aging.current)}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">31-60 Days</p>
            <p style="font-size: 16px; font-weight: 900; color: #d97706;">ETB ${fmt(aging.days30)}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">61-90 Days</p>
            <p style="font-size: 16px; font-weight: 900; color: #ea580c;">ETB ${fmt(aging.days60)}</p>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">90+ Days</p>
            <p style="font-size: 16px; font-weight: 900; color: #e11d48;">ETB ${fmt(aging.over90)}</p>
          </div>
        </div>
        <h2 style="font-size: 14px; font-weight: 900; margin-bottom: 12px;">Summary Totals</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0; font-size: 12px; color: #475569;">Total VAT Withheld (Unremitted)</td>
            <td style="padding: 12px 0; font-size: 12px; font-weight: 900; text-align: right;">ETB ${fmt(
              entries.filter((e) => e.type === 'VAT' && !e.remitted).reduce((s, e) => s + e.withheldAmount, 0),
            )}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0; font-size: 12px; color: #475569;">Total Income Tax Withheld (Unremitted)</td>
            <td style="padding: 12px 0; font-size: 12px; font-weight: 900; text-align: right;">ETB ${fmt(
              entries
                .filter((e) => e.type === 'INCOME_TAX' && !e.remitted)
                .reduce((s, e) => s + e.withheldAmount, 0),
            )}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-size: 14px; font-weight: 900; color: #1e293b;">Total Liability</td>
            <td style="padding: 12px 0; font-size: 16px; font-weight: 900; text-align: right; color: #1e293b;">ETB ${fmt(totalUnremitted)}</td>
          </tr>
        </table>
      </div>
    `;

    w.document.write(`<html><head><title>Aged Withholding Summary</title></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
    w.addEventListener('afterprint', () => w.close());
  };

  const totalWithheld = entries.reduce((s, e) => s + e.withheldAmount, 0);
  const totalUnremitted = entries.filter((e) => !e.remitted).reduce((s, e) => s + e.withheldAmount, 0);

  const addEntry = async () => {
    const amt = parseFloat(form.invoiceAmount);
    if (!form.supplier || !form.tin || !form.invoiceDate || isNaN(amt)) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const res = await api.post('/vat/withholding', {
        supplier: form.supplier,
        tin: form.tin,
        invoiceDate: form.invoiceDate,
        invoiceAmount: amt,
        period: form.invoiceDate.slice(0, 7),
      });
      const created = res.data?.data ?? res.data;
      setEntries((prev) => [
        {
          id: created.id,
          type: form.type,
          supplier: form.supplier,
          tin: form.tin,
          invoiceDate: form.invoiceDate,
          invoiceAmount: amt,
          // Backend always calculates at 3% (Proc. 1395/2025); use that if available, else fall back to 3%
          withheldAmount: created.withheldVat ?? amt * 0.03,
          remitted: false,
        },
        ...prev,
      ]);

      setForm({ type: 'VAT', supplier: '', tin: '', invoiceDate: '', invoiceAmount: '' });
      setShowForm(false);
      toast.success('Withholding entry added');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add entry');
    }
  };

  const toggleRemitted = async (id: string) => {
    try {
      const res = await api.patch(`/vat/withholding/${id}/toggle-remitted`);
      const newVal = res.data?.data?.remitted ?? !entries.find((e) => e.id === id)?.remitted;
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, remitted: newVal } : e)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update remittance status');
    }
  };

  // aging
  const getAge = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const aging = entries
    .filter((e) => !e.remitted)
    .reduce(
      (acc, e) => {
        const age = getAge(e.invoiceDate);
        if (age <= 30) acc.current += e.withheldAmount;
        else if (age <= 60) acc.days30 += e.withheldAmount;
        else if (age <= 90) acc.days60 += e.withheldAmount;
        else acc.over90 += e.withheldAmount;
        return acc;
      },
      { current: 0, days30: 0, days60: 0, over90: 0 },
    );

  const vatEntries = entries.filter((e) => e.type === 'VAT');
  const taxEntries = entries.filter((e) => e.type === 'INCOME_TAX');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Withheld</p>
          <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">ETB {fmt(totalWithheld)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Unremitted (Aged)</p>
          <p className="text-xl font-semibold text-amber-600">ETB {fmt(totalUnremitted)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-slate-800">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">VAT Withheld</p>
          <p className="text-xl font-semibold">
            ETB{' '}
            {fmt(entries.filter((e) => e.type === 'VAT').reduce((s, e) => s + e.withheldAmount, 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-slate-800 dark:text-emerald-400">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tax Withheld</p>
          <p className="text-xl font-semibold">
            ETB{' '}
            {fmt(entries.filter((e) => e.type === 'INCOME_TAX').reduce((s, e) => s + e.withheldAmount, 0))}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-slate-800 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Aged Summary of Tax & VAT Withholding</h3>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Send size={12} /> Submit to ERCA
              </button>
              <button
                onClick={printAgedSummary}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 dark:bg-slate-800 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-500 dark:hover:bg-slate-700 transition-all"
              >
                <Printer size={12} /> Print Summary
              </button>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-lg">Combined System View</span>
        </div>

        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {[
            { label: 'Current (0-30)', val: aging.current, color: 'text-slate-800', bg: 'bg-emerald-200/10' },
            { label: '31-60 Days', val: aging.days30, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: '61-90 Days', val: aging.days60, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: '90+ Days', val: aging.over90, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((s) => (
            <div key={s.label} className={`p-6 ${s.bg}`}>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-lg font-semibold ${s.color}`}>ETB {fmt(s.val)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-emerald-200/10">
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className={`text-slate-800 dark:text-emerald-400 ${loadingVat ? 'animate-spin' : ''}`} />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Monthly VAT Return Summary</h3>
            </div>
            <button
              onClick={handleCalculateVat}
              disabled={loadingVat}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-500 disabled:opacity-50"
            >
              Calculate & Post
            </button>
          </div>

          <div className="p-6">
            {!vatSummary ? (
              <div className="ovds-empty dark:text-slate-500">
                <BarChart3 size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold">Calculating monthly metrics...</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current Period: {vatSummary.period}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                      vatSummary.netPayable > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-200/10 text-slate-800'
                    }`}
                  >
                    {vatSummary.netPayable > 0 ? 'Payable' : 'Refundable/Carry Forward'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Output VAT (Sales)</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">ETB {fmt(vatSummary.outputVat)}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Input VAT (Purchases)</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">ETB {fmt(vatSummary.inputVat)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Net VAT Position</p>
                    <p className={`text-xl font-semibold ${vatSummary.netPayable > 0 ? 'text-amber-600' : 'text-slate-800'}`}>ETB {fmt(vatSummary.netPayable)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 italic">
                    <Info size={12} />
                    <span>Calculated from all PAID invoices and bills in the system.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <History size={18} className="text-slate-400 dark:text-slate-500" />
              VAT Filing History
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px]">
            {vatFilings.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">No previous filings found</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Period</th>
                    <th className="text-right px-5 py-3 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Net Payable</th>
                    <th className="text-center px-5 py-3 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {vatFilings.map((f) => (
                    <tr key={f.id ?? f.period} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-200">{f.period}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">ETB {fmt(f.netPayable)}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                            f.status === 'POSTED'
                              ? 'bg-emerald-200/20 text-slate-800'
                              : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {suggestedWithholding.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-5 py-3 border-b border-amber-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Suggested Withholding (System Scan)</h3>
            </div>
            <button onClick={syncSuggested} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-semibold uppercase hover:bg-amber-500-dark transition-all">
              <Plus size={12} /> Sync {suggestedWithholding.length} items
            </button>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-[10px] text-amber-600-dark font-bold mb-3 italic">
              These bills were detected with amounts ≥ ETB 10,000. Mandatory 3% WHT applies (Proclamation No. 1395/2025).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedWithholding.slice(0, 4).map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white/60 dark:bg-slate-800/60 border border-amber-500/10 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">{s.supplier}</p>
                    <p className="ovds-caption">
                      {s.invoiceDate} · ETB {fmt(s.invoiceAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-amber-600">ETB {fmt(s.withheldAmount)}</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">3% WHT (Proc. 1395/2025)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Registers */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-emerald-200/10">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-slate-800" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">VAT Withholding Register</h3>
            </div>
            <button
              onClick={() => {
                setForm({ ...form, type: 'VAT' });
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all"
            >
              <Plus size={14} /> Add VAT Entry
            </button>
          </div>
          <WithholdingTable
            data={vatEntries}
            onToggleRemitted={toggleRemitted}
            onDelete={async (id: string) => {
              try {
                await api.delete(`/vat/withholding/${id}`);
                setEntries((prev) => prev.filter((x) => x.id !== id));
              } catch (err: any) {
                toast.error(err?.response?.data?.message ?? 'Failed to delete entry');
              }
            }}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-emerald-200/5">
            <div className="flex items-center gap-3">
              <Wallet size={18} className="text-slate-800 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Income Tax Withholding Register (2%)</h3>
            </div>
            <button
              onClick={() => {
                setForm({ ...form, type: 'INCOME_TAX' });
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all"
            >
              <Plus size={14} /> Add Tax Entry
            </button>
          </div>
          <WithholdingTable
            data={taxEntries}
            onToggleRemitted={toggleRemitted}
            onDelete={async (id: string) => {
              try {
                await api.delete(`/vat/withholding/${id}`);
                setEntries((prev) => prev.filter((x) => x.id !== id));
              } catch (err: any) {
                toast.error(err?.response?.data?.message ?? 'Failed to delete entry');
              }
            }}
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Add {form.type === 'VAT' ? 'VAT' : 'Income Tax'} Withholding
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Supplier TIN</label>
                  <input
                    type="text"
                    value={form.tin}
                    onChange={(e) => setForm({ ...form, tin: e.target.value })}
                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Withholding Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as WithholdingType })}
                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none text-slate-800 dark:text-slate-100"
                  >
                    <option value="VAT">VAT (15%)</option>
                    <option value="INCOME_TAX">Income Tax (2%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={form.invoiceDate}
                    onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Invoice Amount</label>
                  <input
                    type="number"
                    value={form.invoiceAmount}
                    onChange={(e) => setForm({ ...form, invoiceAmount: e.target.value })}
                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-teal-400/20 outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={addEntry}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-slate-800 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Submit Withholding Report</h3>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Submission Summary</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total VAT Withheld</p>
                    <p className="text-lg font-semibold text-slate-800">
                      ETB {fmt(entries.filter((e) => e.type === 'VAT').reduce((s, e) => s + e.withheldAmount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Income Tax (2%)</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-emerald-400">
                      ETB {fmt(entries.filter((e) => e.type === 'INCOME_TAX').reduce((s, e) => s + e.withheldAmount, 0))}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider">Total Combined Liability</p>
                    <p className="text-xl font-semibold text-slate-900">ETB {fmt(totalWithheld)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-600-dark space-y-1">
                  <p className="font-bold">Important Compliance Notice</p>
                  <p className="leading-relaxed opacity-80">
                    This action will submit your current withholding register to ERCA for the current period. Ensure all invoice details and TINs are verified. This action cannot be undone from the system.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-2 py-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirm & Submit to ERCA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VatReportsPanel;


