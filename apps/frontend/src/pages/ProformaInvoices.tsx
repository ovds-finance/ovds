/**
 * Proforma Invoice Page — Enhanced
 *
 * Ethiopian trade compliance:
 *   - NBE Forex Approval required for imports > USD 1,000
 *   - ERCA customs clearance supporting document
 *   - Valid 180 days from issue date
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Plus, RefreshCw, FileText, X, Download, Search,
  Clock, CheckCircle2, AlertTriangle, Info, Edit2,
  Trash2, Send, ArrowRight, ChevronDown, ChevronUp,
  Eye, Copy, Filter, BarChart2, TrendingUp, TrendingDown,
  Package, Globe, DollarSign, Calendar, Ship, Minus,
  MoreHorizontal, CheckSquare, Square, ArrowUpRight,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import { useDebounce } from '../hooks';
import { fmtCurrency } from '../utils/fmt';
import { proformasApi } from '../services/tradeApi';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { Can } from '../components/can';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const MS_PER_DAY = 86_400_000;
const VALIDITY_DAYS = 180;
const FOREX_THRESHOLD_USD = 1000;

const INCOTERMS = ['EXW','FOB','CIF','CFR','DAP','DDP','FCA','CPT','CIP','DAT','FAS','CFI'];
const CURRENCIES = ['USD','EUR','GBP','CNY','AED','SAR','JPY','CHF','CAD','AUD'];
const PAYMENT_TERMS_OPTIONS = [
  'Advance Payment','LC at Sight','30 Days LC','60 Days LC',
  'Net 30','Net 60','NET30','NET60','CAD','Open Account',
];

const fmt = (n: number, ccy = 'USD') => fmtCurrency(n, ccy);

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProformaItem {
  id?: string;
  description: string;
  hsCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
}

export interface Proforma {
  id: string;
  proformaNumber?: string;
  supplierName: string;
  supplierCountry?: string | null;
  supplierAddress?: string | null;
  supplierTin?: string | null;
  buyerName: string;
  buyerAddress?: string | null;
  buyerTin?: string | null;
  issueDate: string;
  validUntil?: string | null;
  totalValue: number;
  currencyCode: string;
  incoterms?: string | null;
  paymentTerms?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  goodsDescription?: string | null;
  notes?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  companyId?: string | null;
  items?: ProformaItem[];
  createdAt?: string;
  [key: string]: unknown;
}

type StatusFilter = 'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
type SortField = 'issueDate' | 'validUntil' | 'totalValue' | 'supplierName' | 'status';
type SortDir = 'asc' | 'desc';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string; dot: string; icon: React.ReactNode }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',         dot: 'bg-slate-400',    icon: <FileText size={9} /> },
  SUBMITTED: { label: 'Submitted', cls: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800',                  dot: 'bg-sky-500',      icon: <Send size={9} /> },
  APPROVED:  { label: 'Approved',  cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', icon: <CheckCircle2 size={9} /> },
  REJECTED:  { label: 'Rejected',  cls: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',             dot: 'bg-rose-400',     icon: <X size={9} /> },
  EXPIRED:   { label: 'Expired',   cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',       dot: 'bg-amber-500',    icon: <Clock size={9} /> },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysUntilExpiry(p: Proforma): number | null {
  if (!p.validUntil) return null;
  return Math.ceil((new Date(p.validUntil).getTime() - Date.now()) / MS_PER_DAY);
}

function requiresForex(p: Proforma): boolean {
  return p.currencyCode === 'USD' && Number(p.totalValue) >= FOREX_THRESHOLD_USD;
}

function autoExpiry(issueDate: string): string {
  const d = new Date(issueDate);
  d.setDate(d.getDate() + VALIDITY_DAYS);
  return d.toISOString().slice(0, 10);
}

const inp = 'w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600';
const lbl = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5';

// ── StatusPill ────────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ status: string; sm?: boolean }> = ({ status, sm }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${sm ? 'text-[9px]' : 'text-[10px]'} ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ── ValidityBadge ─────────────────────────────────────────────────────────────
const ValidityBadge: React.FC<{ proforma: Proforma }> = ({ proforma: p }) => {
  const days = daysUntilExpiry(p);
  if (days === null || p.status === 'APPROVED' || p.status === 'REJECTED') return null;
  if (days < 0) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold">
      <AlertTriangle size={8} /> Expired
    </span>
  );
  if (days === 0) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold">
      <Clock size={8} /> Today
    </span>
  );
  if (days <= 14) return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold">
      <Clock size={8} /> {days}d
    </span>
  );
  return null;
};

// ── Blank form factory ────────────────────────────────────────────────────────
function blankForm(companyId?: string) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    supplierName: '', supplierCountry: '', supplierAddress: '', supplierTin: '',
    buyerName: '', buyerAddress: '', buyerTin: '',
    issueDate: today,
    validUntil: autoExpiry(today),
    totalValue: '',
    currencyCode: 'USD',
    incoterms: 'CIF',
    paymentTerms: '',
    portOfLoading: '', portOfDischarge: '',
    goodsDescription: '', notes: '',
    companyId,
    items: [{ description: '', hsCode: '', quantity: 1, unitPrice: 0, totalPrice: 0, unit: 'PCS' }] as ProformaItem[],
  };
}

// ── Line Item Row ─────────────────────────────────────────────────────────────
const LineItemRow: React.FC<{
  item: ProformaItem; index: number;
  onChange: (i: number, field: string, val: any) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}> = ({ item, index: i, onChange, onRemove, canRemove }) => {
  const recalc = (field: string, val: number) => {
    const qty   = field === 'quantity'  ? val : item.quantity;
    const price = field === 'unitPrice' ? val : item.unitPrice;
    onChange(i, field, val);
    onChange(i, 'totalPrice', parseFloat((qty * price).toFixed(2)));
  };
  return (
    <div className="grid grid-cols-12 gap-2 items-start group">
      <div className="col-span-4">
        <input value={item.description} onChange={e => onChange(i, 'description', e.target.value)}
          className={inp + ' text-xs'} placeholder="Description of goods" />
      </div>
      <div className="col-span-2">
        <input value={item.hsCode ?? ''} onChange={e => onChange(i, 'hsCode', e.target.value)}
          className={inp + ' text-xs font-mono'} placeholder="HS Code" />
      </div>
      <div className="col-span-1">
        <input value={item.unit ?? 'PCS'} onChange={e => onChange(i, 'unit', e.target.value)}
          className={inp + ' text-xs'} placeholder="Unit" />
      </div>
      <div className="col-span-1">
        <input type="number" min="0" value={item.quantity} onChange={e => recalc('quantity', parseFloat(e.target.value) || 0)}
          className={inp + ' text-xs text-right'} placeholder="Qty" />
      </div>
      <div className="col-span-2">
        <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => recalc('unitPrice', parseFloat(e.target.value) || 0)}
          className={inp + ' text-xs text-right'} placeholder="Unit Price" />
      </div>
      <div className="col-span-1">
        <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-right tabular-nums font-semibold bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
          {item.totalPrice.toFixed(2)}
        </div>
      </div>
      <div className="col-span-1 flex justify-center pt-1">
        {canRemove && (
          <button type="button" onClick={() => onRemove(i)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all">
            <Minus size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Proforma Modal (Create / Edit) ────────────────────────────────────────────
const ProformaModal: React.FC<{
  initial: ReturnType<typeof blankForm>;
  editId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, editId, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'details' | 'items' | 'shipping'>('details');
  const [form, setForm] = useState<ReturnType<typeof blankForm>>(initial);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleIssueDateChange = (val: string) => {
    set('issueDate', val);
    if (val) set('validUntil', autoExpiry(val));
  };

  const handleItemChange = (i: number, field: string, val: any) => {
    setForm(p => {
      const items = [...(p.items ?? [])];
      items[i] = { ...items[i], [field]: val };
      return { ...p, items };
    });
  };

  const addItem = () => setForm(p => ({
    ...p,
    items: [...(p.items ?? []), { description: '', hsCode: '', quantity: 1, unitPrice: 0, totalPrice: 0, unit: 'PCS' }],
  }));

  const removeItem = (i: number) => setForm(p => ({
    ...p,
    items: (p.items ?? []).filter((_, idx) => idx !== i),
  }));

  const computedTotal = useMemo(() =>
    (form.items ?? []).reduce((s, it) => s + Number(it.totalPrice), 0),
    [form.items]
  );

  const syncTotal = () => {
    if (computedTotal > 0) set('totalValue', String(computedTotal.toFixed(2)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName.trim()) { toast.error('Supplier name is required'); return; }
    if (!form.buyerName.trim())    { toast.error('Buyer name is required'); return; }
    const total = parseFloat(String(form.totalValue));
    if (isNaN(total) || total <= 0) { toast.error('Total value must be greater than 0'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalValue: total,
        issueDate:  new Date(form.issueDate).toISOString(),
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        items: (form.items ?? []).filter(it => it.description.trim()),
      };
      if (editId) {
        await api.patch(`/trade/proformas/${editId}`, payload);
        toast.success('Proforma updated');
      } else {
        await proformasApi.create(payload);
        toast.success('Proforma invoice created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save proforma');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'details',  label: 'Parties & Value' },
    { key: 'items',    label: 'Line Items' },
    { key: 'shipping', label: 'Shipping & Notes' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <FileText size={15} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{editId ? 'Edit Proforma Invoice' : 'New Proforma Invoice'}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">NBE Forex Approval · ERCA Customs Clearance · Valid 180 days</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X size={15} /></button>
        </div>
        {/* Tabs */}
        <div className="flex gap-0.5 px-6 pt-4 shrink-0">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-t-lg text-xs font-semibold transition-colors ${tab === t.key ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-b-0 border-sky-200 dark:border-sky-800' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 border border-sky-200 dark:border-sky-800 mx-6 rounded-b-xl rounded-tr-xl bg-white dark:bg-slate-900 space-y-5">

            {/* ── Tab: Details ── */}
            {tab === 'details' && (
              <>
                {/* Supplier */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Supplier (Exporter)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={lbl}>Supplier Name <span className="text-rose-500">*</span></label>
                      <input value={form.supplierName} onChange={e => set('supplierName', e.target.value)} className={inp} placeholder="Foreign supplier / exporter name" required />
                    </div>
                    <div>
                      <label className={lbl}>Country of Origin</label>
                      <input value={form.supplierCountry} onChange={e => set('supplierCountry', e.target.value)} className={inp} placeholder="e.g. China, UAE, Germany" />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Supplier Address</label>
                      <input value={form.supplierAddress} onChange={e => set('supplierAddress', e.target.value)} className={inp} placeholder="Full address" />
                    </div>
                    <div>
                      <label className={lbl}>Supplier TIN / VAT No.</label>
                      <input value={form.supplierTin} onChange={e => set('supplierTin', e.target.value)} className={inp} placeholder="Tax identification number" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                {/* Buyer */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Buyer (Importer)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={lbl}>Buyer Name <span className="text-rose-500">*</span></label>
                      <input value={form.buyerName} onChange={e => set('buyerName', e.target.value)} className={inp} placeholder="Ethiopian buyer / importer name" required />
                    </div>
                    <div>
                      <label className={lbl}>Buyer TIN</label>
                      <input value={form.buyerTin} onChange={e => set('buyerTin', e.target.value)} className={inp} placeholder="15-digit Ethiopian TIN" maxLength={15} />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Buyer Address</label>
                      <input value={form.buyerAddress} onChange={e => set('buyerAddress', e.target.value)} className={inp} placeholder="Full address in Ethiopia" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                {/* Value & Dates */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Value & Validity</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={lbl}>Issue Date <span className="text-rose-500">*</span></label>
                      <input type="date" value={form.issueDate} onChange={e => handleIssueDateChange(e.target.value)} className={inp} required />
                    </div>
                    <div>
                      <label className={lbl}>Valid Until <span className="text-slate-300 font-normal">(180d)</span></label>
                      <input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Currency</label>
                      <select value={form.currencyCode} onChange={e => set('currencyCode', e.target.value)} className={inp}>
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Total Value <span className="text-rose-500">*</span></label>
                      <input type="number" min="0" step="0.01" value={form.totalValue} onChange={e => set('totalValue', e.target.value)} className={inp + ' text-right tabular-nums'} placeholder="0.00" required />
                    </div>
                    <div>
                      <label className={lbl}>Incoterms</label>
                      <select value={form.incoterms} onChange={e => set('incoterms', e.target.value)} className={inp}>
                        {INCOTERMS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Payment Terms</label>
                      <select value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} className={inp}>
                        <option value="">Select…</option>
                        {PAYMENT_TERMS_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  {parseFloat(String(form.totalValue)) >= FOREX_THRESHOLD_USD && form.currencyCode === 'USD' && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg text-xs text-sky-700 dark:text-sky-400">
                      <Info size={12} className="shrink-0" />
                      Value ≥ USD 1,000 — <strong className="ml-1">NBE Forex Approval required</strong> before payment can be processed.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Tab: Items ── */}
            {tab === 'items' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Line Items</p>
                  {computedTotal > 0 && (
                    <button type="button" onClick={syncTotal}
                      className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                      <ArrowRight size={10} /> Sync total ({fmt(computedTotal, form.currencyCode)})
                    </button>
                  )}
                </div>
                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 px-0">
                  {['Description', 'HS Code', 'Unit', 'Qty', 'Unit Price', 'Total', ''].map((h, i) => (
                    <div key={i} className={`text-[9px] font-bold uppercase tracking-widest text-slate-400 ${
                      i === 0 ? 'col-span-4' : i === 1 ? 'col-span-2' : i === 2 || i === 3 ? 'col-span-1' : i === 4 ? 'col-span-2' : i === 5 ? 'col-span-1' : 'col-span-1'
                    } ${i >= 3 ? 'text-right' : ''}`}>{h}</div>
                  ))}
                </div>
                {(form.items ?? []).map((item, i) => (
                  <LineItemRow key={i} item={item} index={i}
                    onChange={handleItemChange} onRemove={removeItem}
                    canRemove={(form.items ?? []).length > 1} />
                ))}
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 transition-colors mt-1">
                  <Plus size={12} /> Add line item
                </button>
                {computedTotal > 0 && (
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-right space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Computed Total</p>
                      <p className="text-lg font-black tabular-nums text-slate-800 dark:text-slate-100">
                        {form.currencyCode} {computedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Shipping ── */}
            {tab === 'shipping' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Shipping Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Port of Loading</label>
                      <input value={form.portOfLoading} onChange={e => set('portOfLoading', e.target.value)} className={inp} placeholder="e.g. Shanghai, Dubai Jebel Ali" />
                    </div>
                    <div>
                      <label className={lbl}>Port of Discharge</label>
                      <input value={form.portOfDischarge} onChange={e => set('portOfDischarge', e.target.value)} className={inp} placeholder="e.g. Djibouti Port" />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Goods Description</label>
                      <textarea value={form.goodsDescription} onChange={e => set('goodsDescription', e.target.value)}
                        rows={2} className={inp + ' resize-none'} placeholder="Brief description of goods for customs" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <div>
                  <label className={lbl}>Notes / Special Instructions</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    rows={3} className={inp + ' resize-none'} placeholder="Any remarks, packing instructions, certification requirements…" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex gap-2">
              {TABS.map((t, idx) => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  className={`w-2 h-2 rounded-full transition-colors ${tab === t.key ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2">
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <FileText size={13} />}
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Proforma'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Detail Drawer ─────────────────────────────────────────────────────────────
const DetailDrawer: React.FC<{
  proforma: Proforma;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: () => void;
  canWrite: boolean;
}> = ({ proforma: p, onClose, onEdit, onStatusChange, onDelete, canWrite }) => {
  const days = daysUntilExpiry(p);
  const st = STATUS_CFG[p.status] ?? STATUS_CFG.DRAFT;

  const detailRow = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-400 shrink-0 w-36">{label}</span>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-700">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <Ship size={14} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{p.proformaNumber ?? 'PF-' + p.id.slice(-6).toUpperCase()}</p>
              <StatusPill status={p.status} sm />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X size={14} /></button>
        </div>

        {/* Validity bar */}
        {p.validUntil && (
          <div className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 ${days !== null && days < 0 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' : days !== null && days <= 14 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'}`}>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              {days !== null && days < 0 ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago` :
               days !== null && days === 0 ? 'Expires today' :
               days !== null ? `Valid for ${days} more day${days !== 1 ? 's' : ''}` : 'No expiry set'}
            </div>
            {p.validUntil && <span className="font-mono text-[10px]">{new Date(p.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Value hero */}
          <div className="rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border border-sky-200 dark:border-sky-800 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500 dark:text-sky-400 mb-1">Total Invoice Value</p>
            <p className="text-3xl font-black tabular-nums text-sky-700 dark:text-sky-300">
              {p.currencyCode} {Number(p.totalValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            {requiresForex(p) && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                <AlertTriangle size={10} /> NBE Forex Approval required
              </div>
            )}
          </div>

          {/* Parties */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Parties</p>
            </div>
            <div className="px-4 py-1">
              {detailRow('Supplier', p.supplierName)}
              {detailRow('Country', p.supplierCountry)}
              {detailRow('Supplier TIN', p.supplierTin)}
              {detailRow('Buyer', p.buyerName)}
              {detailRow('Buyer TIN', p.buyerTin)}
            </div>
          </div>

          {/* Trade terms */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trade Terms</p>
            </div>
            <div className="px-4 py-1">
              {detailRow('Issue Date', new Date(p.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))}
              {detailRow('Incoterms', p.incoterms ? <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{p.incoterms}</span> : null)}
              {detailRow('Payment Terms', p.paymentTerms)}
              {detailRow('Port of Loading', p.portOfLoading)}
              {detailRow('Port of Discharge', p.portOfDischarge)}
            </div>
          </div>

          {/* Line items */}
          {p.items && p.items.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Line Items ({p.items.length})</p>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {p.items.map((item, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{item.description}</p>
                      {item.hsCode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">HS: {item.hsCode}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.quantity} {item.unit ?? ''} × {item.unitPrice}</p>
                    </div>
                    <p className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                      {Number(item.totalPrice).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {p.notes && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Notes</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line">{p.notes}</p>
            </div>
          )}
        </div>

        {/* Drawer actions */}
        {canWrite && (
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-4 space-y-2">
            {p.status === 'DRAFT' && (
              <button onClick={() => onStatusChange(p.id, 'SUBMITTED')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors">
                <Send size={13} /> Submit to Bank / Forwarder
              </button>
            )}
            {p.status === 'SUBMITTED' && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onStatusChange(p.id, 'APPROVED')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors">
                  <CheckCircle2 size={12} /> Approve
                </button>
                <button onClick={() => onStatusChange(p.id, 'REJECTED')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors">
                  <X size={12} /> Reject
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Edit2 size={11} /> Edit
              </button>
              <button onClick={onDelete}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProformaInvoices: React.FC = () => {
  usePageTitle('Proforma Invoices');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('invoices:write');

  // ── State ─────────────────────────────────────────────────────────────────
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Filter/sort state ─────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch]       = useState('');
  const [sortField, setSortField] = useState<SortField>('issueDate');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  // ── Modal/drawer state ────────────────────────────────────────────────────
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [modalForm, setModalForm]   = useState<ReturnType<typeof blankForm>>(blankForm(selectedCompanyId ?? undefined));
  const [drawerProforma, setDrawerProforma] = useState<Proforma | null>(null);
  const [selected, setSelected]     = useState<Set<string>>(new Set());

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await proformasApi.list();
      setProformas(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load proforma invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let arr = [...proformas];
    if (statusFilter !== 'ALL') arr = arr.filter(p => p.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      arr = arr.filter(p =>
        p.supplierName.toLowerCase().includes(q) ||
        p.buyerName.toLowerCase().includes(q) ||
        (p.proformaNumber ?? '').toLowerCase().includes(q) ||
        (p.supplierCountry ?? '').toLowerCase().includes(q)
      );
    }
    return arr.sort((a, b) => {
      let av: any, bv: any;
      switch (sortField) {
        case 'issueDate':    av = a.issueDate;    bv = b.issueDate;    break;
        case 'validUntil':   av = a.validUntil ?? ''; bv = b.validUntil ?? ''; break;
        case 'totalValue':   av = Number(a.totalValue); bv = Number(b.totalValue); break;
        case 'supplierName': av = a.supplierName; bv = b.supplierName; break;
        case 'status':       av = a.status;       bv = b.status;       break;
        default: av = a.issueDate; bv = b.issueDate;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [proformas, statusFilter, debouncedSearch, sortField, sortDir]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total:     proformas.length,
      approved:  proformas.filter(p => p.status === 'APPROVED').length,
      pending:   proformas.filter(p => p.status === 'DRAFT' || p.status === 'SUBMITTED').length,
      expired:   proformas.filter(p => p.status === 'EXPIRED' || (p.validUntil && new Date(p.validUntil).getTime() < now)).length,
      expiring:  proformas.filter(p => { const d = daysUntilExpiry(p); return d !== null && d >= 0 && d <= 14 && p.status !== 'APPROVED'; }).length,
      totalUsd:  proformas.filter(p => p.currencyCode === 'USD').reduce((s, p) => s + Number(p.totalValue), 0),
      forexRequired: proformas.filter(requiresForex).length,
    };
  }, [proformas]);

  const tabCounts = useMemo((): Record<StatusFilter, number> => ({
    ALL:       proformas.length,
    DRAFT:     proformas.filter(p => p.status === 'DRAFT').length,
    SUBMITTED: proformas.filter(p => p.status === 'SUBMITTED').length,
    APPROVED:  proformas.filter(p => p.status === 'APPROVED').length,
    REJECTED:  proformas.filter(p => p.status === 'REJECTED').length,
    EXPIRED:   proformas.filter(p => p.status === 'EXPIRED').length,
  }), [proformas]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleNew = () => {
    setEditingId(null);
    setModalForm(blankForm(selectedCompanyId ?? undefined));
    setShowModal(true);
  };

  const handleEdit = (p: Proforma) => {
    setEditingId(p.id);
    setDrawerProforma(null);
    setModalForm({
      ...blankForm(selectedCompanyId ?? undefined),
      supplierName:    p.supplierName,
      supplierCountry: p.supplierCountry ?? '',
      supplierAddress: p.supplierAddress ?? '',
      supplierTin:     p.supplierTin ?? '',
      buyerName:       p.buyerName,
      buyerAddress:    p.buyerAddress ?? '',
      buyerTin:        p.buyerTin ?? '',
      issueDate:       p.issueDate.slice(0, 10),
      validUntil:      p.validUntil ? p.validUntil.slice(0, 10) : '',
      totalValue:      String(p.totalValue),
      currencyCode:    p.currencyCode,
      incoterms:       p.incoterms ?? 'CIF',
      paymentTerms:    p.paymentTerms ?? '',
      portOfLoading:   p.portOfLoading ?? '',
      portOfDischarge: p.portOfDischarge ?? '',
      goodsDescription: p.goodsDescription ?? '',
      notes:           p.notes ?? '',
      companyId:       p.companyId ?? selectedCompanyId ?? undefined,
      items:           p.items ?? [],
    });
    setShowModal(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/trade/proformas/${id}`, { status });
      toast.success(`Proforma marked as ${STATUS_CFG[status]?.label ?? status}`);
      setDrawerProforma(prev => prev?.id === id ? { ...prev, status: status as Proforma['status'] } : prev);
      load();
    } catch { toast.error('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (p: Proforma) => {
    const ok = await confirm({ title: `Delete ${p.proformaNumber ?? 'this proforma'}?`, message: 'This action cannot be undone.', variant: 'danger' });
    if (!ok) return;
    setActionLoading(p.id);
    try {
      await api.delete(`/trade/proformas/${p.id}`);
      toast.success('Proforma deleted');
      setDrawerProforma(null);
      load();
    } catch { toast.error('Failed to delete proforma'); }
    finally { setActionLoading(null); }
  };

  const handleDuplicate = async (p: Proforma) => {
    setActionLoading(p.id);
    try {
      await api.post(`/trade/proformas/${p.id}/duplicate`, {});
      toast.success('Proforma duplicated');
      load();
    } catch { toast.error('Failed to duplicate'); }
    finally { setActionLoading(null); }
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Proforma #','Supplier','Country','Buyer','Issue Date','Valid Until','Currency','Total Value','Incoterms','Payment Terms','Status'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(p => [
      p.proformaNumber ?? '', p.supplierName, p.supplierCountry ?? '',
      p.buyerName, p.issueDate.slice(0, 10), p.validUntil ? p.validUntil.slice(0, 10) : '',
      p.currencyCode, p.totalValue, p.incoterms ?? '', p.paymentTerms ?? '', p.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `proforma-invoices-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  const toggleSelectAll = () => {
    if (filtered.length > 0 && filtered.every(p => selected.has(p.id)))
      setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };
  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const SortTh: React.FC<{ field: SortField; children: React.ReactNode; align?: 'right' }> = ({ field, children, align }) => (
    <th onClick={() => toggleSort(field)}
      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 select-none whitespace-nowrap transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field ? <span className="text-sky-500">{sortDir === 'asc' ? '↑' : '↓'}</span> : <span className="text-slate-200 dark:text-slate-700">↕</span>}
      </span>
    </th>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
            <Ship size={18} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">Proforma Invoices</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>NBE Forex Approval · ERCA Customs Clearance</span>
              {stats.expiring > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold border border-amber-200 dark:border-amber-800">
                  <Clock size={9} /> {stats.expiring} expiring soon
                </span>
              )}
              {stats.forexRequired > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-[9px] font-bold border border-sky-200 dark:border-sky-800">
                  <DollarSign size={9} /> {stats.forexRequired} require Forex
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${showFilters ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Filter size={12} /> Filter {showFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button onClick={handleExportCSV} disabled={!filtered.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40">
            <Download size={12} /> Export
          </button>
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <Can permission="invoices:write">
            <button onClick={handleNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-sky-200 dark:shadow-none">
              <Plus size={13} /> New Proforma
            </button>
          </Can>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total',     value: stats.total,    color: 'from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-200', accent: 'bg-slate-400', icon: <FileText size={14} /> },
          { label: 'Draft',     value: tabCounts.DRAFT,     color: 'from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-200', accent: 'bg-slate-400', icon: <FileText size={14} /> },
          { label: 'Submitted', value: tabCounts.SUBMITTED, color: 'from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-900/10 border-sky-200 dark:border-sky-800',           text: 'text-sky-700 dark:text-sky-300',   accent: 'bg-sky-500',   icon: <Send size={14} /> },
          { label: 'Approved',  value: tabCounts.APPROVED,  color: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', accent: 'bg-emerald-500', icon: <CheckCircle2 size={14} /> },
          { label: 'Forex Req', value: stats.forexRequired, color: 'from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-900/10 border-violet-200 dark:border-violet-800', text: 'text-violet-700 dark:text-violet-300', accent: 'bg-violet-500', icon: <DollarSign size={14} /> },
          { label: 'Expiring',  value: stats.expiring,      color: stats.expiring > 0 ? 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800' : 'from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border-slate-200 dark:border-slate-700', text: stats.expiring > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400', accent: stats.expiring > 0 ? 'bg-amber-500' : 'bg-slate-300', icon: <Clock size={14} /> },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border bg-gradient-to-br ${k.color} p-3.5 flex items-center gap-3`}>
            <div className={`w-1 h-8 rounded-full shrink-0 ${k.accent}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-2xl font-black tabular-nums leading-none ${k.text}`}>{k.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Regulatory notice ─────────────────────────────────────────────── */}
      <div className="flex gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl text-xs text-sky-700 dark:text-sky-400">
        <Info size={13} className="shrink-0 mt-0.5 text-sky-500" />
        <div className="space-y-0.5 leading-relaxed">
          <p><strong>NBE Forex:</strong> Mandatory for imports &gt; USD 1,000 — attach this proforma when applying for Forex Approval at the National Bank of Ethiopia.</p>
          <p><strong>ERCA Customs:</strong> Required as supporting document for customs declaration and duty assessment. Valid for <strong>180 days</strong> from issue date.</p>
        </div>
      </div>

      {/* ── Filter bar (collapsible) ───────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
              placeholder="Search supplier, buyer, proforma #…" />
          </div>
          {search && (
            <button onClick={() => setSearch('')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-colors">
              <X size={11} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ── Status tabs ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {(['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED'] as StatusFilter[]).map(s => {
          const count = tabCounts[s];
          const active = statusFilter === s;
          const cfg = s === 'ALL' ? null : STATUS_CFG[s];
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
              {s === 'ALL' ? 'All' : cfg?.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Bulk toolbar ──────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl">
          <span className="text-xs font-bold text-sky-700 dark:text-sky-400">{selected.size} selected</span>
          <div className="flex-1" />
          <button onClick={() => setSelected(new Set())}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold transition-colors">
            Clear
          </button>
          <button onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors">
            <Download size={11} /> Export Selected
          </button>
        </div>
      )}

      {/* ── Main table ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Proforma Register</h3>
            {!loading && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw size={13} className="animate-spin text-slate-300" />}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="w-10 px-4 py-3">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {filtered.length > 0 && filtered.every(p => selected.has(p.id))
                      ? <CheckSquare size={14} className="text-sky-500" />
                      : <Square size={14} />}
                  </button>
                </th>
                <SortTh field="issueDate">Proforma #</SortTh>
                <SortTh field="supplierName">Supplier</SortTh>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Country</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Buyer</th>
                <SortTh field="issueDate">Issue Date</SortTh>
                <SortTh field="validUntil">Valid Until</SortTh>
                <SortTh field="totalValue" align="right">Total Value</SortTh>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Incoterms</th>
                <SortTh field="status">Status</SortTh>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(11).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse`} style={{ width: j === 0 ? '16px' : j === 1 ? '100px' : j === 7 ? '80px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Ship size={24} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                          {search || statusFilter !== 'ALL' ? 'No matching proformas' : 'No proforma invoices yet'}
                        </p>
                        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                          {search ? 'Try a different search term' : 'Create one for your next import transaction'}
                        </p>
                      </div>
                      {!search && statusFilter === 'ALL' && canWrite && (
                        <button onClick={handleNew}
                          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold transition-colors">
                          <Plus size={12} /> New Proforma
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const st = STATUS_CFG[p.status] ?? STATUS_CFG.DRAFT;
                const daysValid = daysUntilExpiry(p);
                const isExpiring = daysValid !== null && daysValid >= 0 && daysValid <= 14;
                const isExpired  = daysValid !== null && daysValid < 0;
                const isSelected = selected.has(p.id);
                const isLoading  = actionLoading === p.id;
                return (
                  <tr key={p.id}
                    onClick={() => setDrawerProforma(p)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${isSelected ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(p.id); }}>
                      {isSelected ? <CheckSquare size={14} className="text-sky-500" /> : <Square size={14} className="text-slate-300 dark:text-slate-600" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                        {p.proformaNumber ?? 'PF-' + p.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
                          <Globe size={10} className="text-sky-500" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[140px] truncate">{p.supplierName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {p.supplierCountry ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[130px] truncate">
                      {p.buyerName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {new Date(p.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {p.validUntil ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono ${isExpired ? 'text-rose-500' : isExpiring ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {new Date(p.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <ValidityBadge proforma={p} />
                        </div>
                      ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold tabular-nums text-right text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      <div>
                        <span>{p.currencyCode} {Number(p.totalValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        {requiresForex(p) && (
                          <div className="text-[9px] font-bold text-sky-500 text-right mt-0.5">Forex req.</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.incoterms ? (
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {p.incoterms}
                        </span>
                      ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {isLoading ? (
                        <RefreshCw size={13} className="animate-spin text-slate-300 mx-auto" />
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          {canWrite && (
                            <>
                              <button onClick={() => handleEdit(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDuplicate(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all">
                                <Copy size={12} />
                              </button>
                              <button onClick={() => handleDelete(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <p className="text-[11px] text-slate-400 font-medium">
              Showing {filtered.length} of {proformas.length} proforma invoice{proformas.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-slate-400">
                Total value (USD):{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  USD {filtered.filter(p => p.currencyCode === 'USD').reduce((s, p) => s + Number(p.totalValue), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Compliance summary card ────────────────────────────────────────── */}
      {proformas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* NBE Forex required */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-sky-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">NBE Forex Required</p>
            </div>
            <p className="text-2xl font-black text-sky-700 dark:text-sky-300 tabular-nums">{stats.forexRequired}</p>
            <p className="text-[10px] text-sky-500 dark:text-sky-500 mt-1">Proformas ≥ USD 1,000</p>
          </div>
          {/* Approved & ready */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Approved & Ready</p>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{tabCounts.APPROVED}</p>
            <p className="text-[10px] text-emerald-500 mt-1">Available for customs clearance</p>
          </div>
          {/* Validity status */}
          <div className={`rounded-xl border p-4 ${stats.expiring > 0 ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30'}`}>
            <div className={`flex items-center gap-2 mb-3`}>
              <Clock size={14} className={stats.expiring > 0 ? 'text-amber-500' : 'text-slate-400'} />
              <p className={`text-[10px] font-bold uppercase tracking-widest ${stats.expiring > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>Expiring ≤ 14 Days</p>
            </div>
            <p className={`text-2xl font-black tabular-nums ${stats.expiring > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>{stats.expiring}</p>
            <p className={`text-[10px] mt-1 ${stats.expiring > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              {stats.expiring > 0 ? 'Action required — renew soon' : 'All proformas valid'}
            </p>
          </div>
        </div>
      )}

      {/* ── Modals / Drawers ──────────────────────────────────────────────── */}
      {showModal && (
        <ProformaModal
          initial={modalForm}
          editId={editingId}
          onClose={() => { setShowModal(false); setEditingId(null); }}
          onSaved={load}
        />
      )}

      {drawerProforma && (
        <DetailDrawer
          proforma={drawerProforma}
          onClose={() => setDrawerProforma(null)}
          onEdit={() => handleEdit(drawerProforma)}
          onStatusChange={handleStatusChange}
          onDelete={() => handleDelete(drawerProforma)}
          canWrite={canWrite}
        />
      )}
    </div>
  );
};

export default ProformaInvoices;
