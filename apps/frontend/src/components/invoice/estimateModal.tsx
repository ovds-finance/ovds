/**
 * EstimateModal — Ovds-style Estimate / Quote builder
 * Mirrors AddInvoiceModal layout: full-screen form-document + right summary sidebar
 * IFRS 15 compliant · ERCA-ready · Ethiopian ETB
 */
import { evalMath } from '@ovds/ui';
import {
  X, Plus, Trash2, FileText, Send, Eye, Percent,
  ChevronDown, ChevronRight, StickyNote, Mail, Phone, MapPin,
  CheckCircle2, Info, Loader2, Hash, User, Tag, Save,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useBusiness } from '../../context/businessContext';
import { estimatesApi } from '../../services/ovdsApi';


interface EstimateModalProps {
  show: boolean;
  estimate: any;
  setEstimate: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent, status?: string) => void;
  onPreview?: () => void;
  itemsList: any[];
  currency: string;
  customers: string[];
  settings: any;
}

const PAYMENT_TERMS_DAYS: Record<string, number> = {
  IMMEDIATE: 0, NET7: 7, NET15: 15, NET30: 30, NET60: 60, NET90: 90,
};

// ── Style tokens (match AddInvoiceModal) ──────────────────────────────────
const inp = 'aki-input';
const lbl = 'aki-label';

// ── Collapsible section ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Sec: React.FC<{
  title: string; icon: React.ReactNode; open?: boolean; children: React.ReactNode;
}> = ({ title, icon, open: initOpen = false, children }) => {
  const [open, setOpen] = useState(initOpen);
  return (
    <div style={{ borderTop: '1px solid var(--border-alt)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 transition-colors"
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}>
        <span className="flex items-center gap-2 ovds-label" style={{ color: 'var(--text-4)' }}>
          {icon}{title}
        </span>
        <ChevronDown size={13} style={{ color: 'var(--text-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 space-y-3" style={{ background: 'var(--surface-alt)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const EstimateModal: React.FC<EstimateModalProps> = ({
  show, estimate, setEstimate, onClose, onSubmit, onPreview,
  itemsList, currency, customers, settings,
}) => {
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const { selectedCompanyId } = useBusiness();
  const [submitting, setSubmitting] = useState(false);
  const submitStatusRef = useRef<string>('DRAFT');
  const formRef = useRef<HTMLFormElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);
  const isEditing = Boolean(estimate.id);
  const estimateItems = estimate.items ?? [];

  // ── Totals ────────────────────────────────────────────────────────────
  let subtotal = 0, totalVat = 0, totalDisc = 0;
  estimateItems.forEach((li: any) => {
    const gross = Number(li.price) * Number(li.quantity);
    const disc = gross * ((Number(li.discount) || 0) / 100);
    const net = gross - disc;
    subtotal += net;
    totalDisc += disc;
    const vatRate = Number(settings?.ovds_default_vat_rate || 15);
    totalVat += net * (vatRate / 100);
  });
  const invoiceDiscAmt = subtotal * ((Number(estimate.invoiceDiscount) || 0) / 100);
  const grandTotal = subtotal - invoiceDiscAmt + totalVat;
  const cur = currency;
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  // ── Completeness ──────────────────────────────────────────────────────
  const completenessFields = [
    { label: 'Customer name',   done: !!estimate.customer },
    { label: 'Estimate date',   done: !!estimate.date },
    { label: 'Valid until',     done: !!estimate.dueDate },
    { label: 'Item with price', done: estimateItems.some((i: any) => Number(i.price) > 0) },
    { label: 'Customer email',  done: !!estimate.customerEmail },
    { label: 'Estimate number', done: !!estimate.estimateNumber },
  ];
  const completenessScore = Math.round(
    (completenessFields.filter(f => f.done).length / completenessFields.length) * 100
  );

  const addItem = useCallback(() =>
    setEstimate((p: any) => ({
      ...p, items: [...p.items, { itemId: '', quantity: 1, price: 0, discount: 0, description: '' }],
    })), [setEstimate]);

  // ── Auto-fetch next estimate number on new-estimate open ──────────────
  useEffect(() => {
    if (!show || estimate.id || estimate.estimateNumber || !selectedCompanyId) return;
    estimatesApi.nextNumber(selectedCompanyId).then((n: any) => {
      if (n?.nextNumber) {
        setEstimate((p: any) => ({ ...p, estimateNumber: p.estimateNumber || n.nextNumber }));
      }
    }).catch(() => {/* non-fatal */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, selectedCompanyId]);

  const removeItem = useCallback((idx: number) =>
    setEstimate((p: any) => ({ ...p, items: p.items.filter((_: any, i: number) => i !== idx) })),
    [setEstimate]);

  const updateItem = useCallback((idx: number, field: string, value: any) =>
    setEstimate((p: any) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === 'itemId') {
        const it = itemsList?.find((i: any) => i.id === value);
        if (it) { items[idx].price = Number(it.price ?? it.sellingPrice ?? 0); items[idx].description = it.name; }
      }
      return { ...p, items };
    }), [setEstimate, itemsList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit(e, submitStatusRef.current); }
    finally { setSubmitting(false); }
  };

  const filteredCustomers = customers.filter(c =>
    c.toLowerCase().includes((estimate.customer || '').toLowerCase())
  );

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[310] flex items-stretch bg-slate-900/70 backdrop-blur-sm overflow-hidden"
      role="dialog" aria-modal="true" aria-label={isEditing ? 'Edit Estimate' : 'New Estimate'}>
      <div className="bg-white dark:bg-slate-950 w-full flex flex-col overflow-hidden">

        {/* ══ TOP BAR ════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 h-14">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-500 dark:text-slate-300 hover:text-teal-500 cursor-pointer transition-colors">Sales</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="font-semibold text-slate-500 dark:text-slate-300 hover:text-teal-500 cursor-pointer transition-colors">Estimates</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {isEditing ? 'Edit Estimate' : 'New Estimate'}
            </span>
          </div>
          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {estimate.status === 'ACCEPTED' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-50)] dark:bg-green-900/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] rounded-lg text-[10px] font-bold uppercase tracking-wider border border-[var(--pro-azure-100)] dark:border-green-800">
                <CheckCircle2 size={11} /> Accepted — Ready to Convert
              </span>
            )}
            {onPreview && (
              <button type="button" onClick={onPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all bg-white dark:bg-slate-800">
                <Eye size={13} /> Preview
              </button>
            )}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
            <button type="button" onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ══ MAIN: left form + right sidebar ════════════════════════════ */}
        <div className="flex-1 overflow-hidden flex">
          <form ref={formRef} id="estimate-form" onSubmit={handleSubmit}
            className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">

            {/* ── LEFT: scrollable document ─────────────────────────── */}
            <div className="overflow-y-auto bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
              <div className="max-w-3xl mx-auto my-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

                {/* IFRS 15 compliance strip */}
                <div className="flex items-center gap-2.5 px-6 py-2.5 bg-violet-600 text-white text-xs font-semibold">
                  <FileText size={13} className="shrink-0 opacity-90" />
                  <span>Estimate / Quote · IFRS 15 Revenue Recognition · ERCA Ready</span>
                  {estimate.estimateNumber && (
                    <span className="ml-auto font-mono font-bold opacity-80">#{estimate.estimateNumber}</span>
                  )}
                </div>

                {/* ── Header meta ────────────────────────────────────── */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Estimate # */}
                    <div>
                      <label className={lbl}><Hash size={10} className="inline mr-1" />Estimate #</label>
                      <div className="flex gap-1.5">
                        <input className={`${inp} flex-1 min-w-0`} placeholder="EST-0001"
                          value={estimate.estimateNumber || ''}
                          onChange={(e) => setEstimate((p: any) => ({ ...p, estimateNumber: e.target.value }))} />
                        {!estimate.estimateNumber && (
                          <button type="button" title="Auto-generate"
                            onClick={async () => {
                              try {
                                const n = await estimatesApi.nextNumber(selectedCompanyId ?? '');
                                if (n?.nextNumber) setEstimate((p: any) => ({ ...p, estimateNumber: n.nextNumber }));
                              } catch {
                                const ts = new Date();
                                setEstimate((p: any) => ({
                                  ...p,
                                  estimateNumber: `EST-${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*900)+100)}`,
                                }));
                              }
                            }}
                            className="shrink-0 px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-teal-500 hover:border-blue-300 transition-all">
                            <RefreshCw size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Currency */}
                    <div>
                      <label className={lbl}>Currency</label>
                      <select className={inp} value={estimate.invoiceCurrency || currency}
                        onChange={(e) => setEstimate((p: any) => ({ ...p, invoiceCurrency: e.target.value }))}>
                        {['ETB','USD','EUR','GBP','AED'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {/* Date */}
                    <div>
                      <label className={lbl}>Estimate Date <span className="text-rose-400">*</span></label>
                      <input type="date" className={inp} value={estimate.date || ''}
                        onChange={(e) => setEstimate((p: any) => ({ ...p, date: e.target.value }))} />
                    </div>
                    {/* Valid Until */}
                    <div>
                      <label className={lbl}>Valid Until <span className="text-rose-400">*</span></label>
                      <input type="date" className={inp} value={estimate.dueDate || ''}
                        onChange={(e) => setEstimate((p: any) => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                    {/* Payment Terms */}
                    <div>
                      <label className={lbl}>Payment Terms</label>
                      <select className={inp} value={estimate.paymentTerms || 'NET30'}
                        onChange={(e) => {
                          const days = PAYMENT_TERMS_DAYS[e.target.value] ?? 30;
                          const due = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
                          setEstimate((p: any) => ({ ...p, paymentTerms: e.target.value, dueDate: due }));
                        }}>
                        {Object.entries(PAYMENT_TERMS_DAYS).map(([k]) => (
                          <option key={k} value={k}>{k.replace('NET','Net ')} {PAYMENT_TERMS_DAYS[k] > 0 ? `(${PAYMENT_TERMS_DAYS[k]}d)` : '(Immediate)'}</option>
                        ))}
                      </select>
                    </div>
                    {/* Reference / PO */}
                    <div>
                      <label className={lbl}>Reference / PO #</label>
                      <input type="text" className={inp} placeholder="REF-001"
                        value={estimate.referenceNumber || ''}
                        onChange={(e) => setEstimate((p: any) => ({ ...p, referenceNumber: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* ── Bill To ────────────────────────────────────────── */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                    <User size={13} />Quote To
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer with autocomplete */}
                    <div className="md:col-span-2 relative" ref={customerRef}>
                      <label className={lbl}>Customer / Client <span className="text-rose-400">*</span></label>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input required className={`${inp} pl-9`}
                          placeholder="Search or enter customer name..."
                          value={estimate.customer || ''}
                          onChange={(e) => { setEstimate((p: any) => ({ ...p, customer: e.target.value })); setShowCustomerSuggestions(true); }}
                          onFocus={() => setShowCustomerSuggestions(true)} />
                      </div>
                      {showCustomerSuggestions && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                          <div className="max-h-[180px] overflow-y-auto p-1">
                            {filteredCustomers.slice(0, 8).map((c) => (
                              <button key={c} type="button"
                                onMouseDown={() => { setEstimate((p: any) => ({ ...p, customer: c })); setShowCustomerSuggestions(false); }}
                                className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-violet-500 hover:text-white rounded-lg transition-all flex items-center justify-between group">
                                <span>{c}</span>
                                <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Email */}
                    <div>
                      <label className={lbl}>Email</label>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="email" className={`${inp} pl-9`} placeholder="customer@email.com"
                          value={estimate.customerEmail || ''}
                          onChange={(e) => setEstimate((p: any) => ({ ...p, customerEmail: e.target.value }))} />
                      </div>
                    </div>
                    {/* Phone */}
                    <div>
                      <label className={lbl}>Phone</label>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="tel" className={`${inp} pl-9`} placeholder="+251 9XX XXX XXX"
                          value={estimate.customerPhone || ''}
                          onChange={(e) => setEstimate((p: any) => ({ ...p, customerPhone: e.target.value }))} />
                      </div>
                    </div>
                    {/* Address */}
                    <div>
                      <label className={lbl}>Address</label>
                      <div className="relative">
                        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="text" className={`${inp} pl-9`} placeholder="Addis Ababa, Ethiopia"
                          value={estimate.customerAddress || ''}
                          onChange={(e) => setEstimate((p: any) => ({ ...p, customerAddress: e.target.value }))} />
                      </div>
                    </div>
                    {/* TIN */}
                    <div>
                      <label className={lbl}>TIN <span className="text-slate-400 font-normal normal-case">(B2B VAT)</span></label>
                      <input type="text" className={`${inp} font-mono`} placeholder="000000000000000"
                        maxLength={15} value={estimate.customerTin || ''}
                        onChange={(e) => setEstimate((p: any) => ({ ...p, customerTin: e.target.value.replace(/\D/g,'').slice(0,15) }))} />
                    </div>
                  </div>
                </div>

                {/* ── Line Items ──────────────────────────────────────── */}
                <div className="border-b border-slate-100 dark:border-slate-800">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Items</h3>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {estimateItems.filter((i: any) => Number(i.price) > 0).length} line{estimateItems.filter((i: any) => Number(i.price) > 0).length !== 1 ? 's' : ''}
                      </span>
                      {grandTotal > 0 && (
                        <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-md text-[10px] font-bold tabular-nums">
                          {cur} {fmt(grandTotal)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="col-span-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Item / Description</div>
                    <div className="col-span-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">Qty</div>
                    <div className="col-span-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-right">Unit Price</div>
                    <div className="col-span-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">Disc %</div>
                    <div className="col-span-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-right">Amount</div>
                    <div className="col-span-1" />
                  </div>
                  {/* Rows */}
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {estimateItems.map((li: any, idx: number) => {
                      const gross = Number(li.price) * Number(li.quantity);
                      const disc = gross * ((Number(li.discount) || 0) / 100);
                      const lineTotal = gross - disc;
                      return (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-start px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors group">
                          <div className="col-span-5 space-y-1.5">
                            <select value={li.itemId || ''}
                              onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                              className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all cursor-pointer">
                              <option value="">— Select item —</option>
                              {itemsList.map((it: any) => <option key={it.id} value={it.id}>{it.name}</option>)}
                            </select>
                            <input type="text" placeholder="Description (optional)..."
                              value={li.description || ''}
                              onChange={(e) => updateItem(idx, 'description', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs text-slate-400 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700" />
                          </div>
                          <div className="col-span-1">
                            <input type="number" min="1" step="any" value={li.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                              onBlur={(e) => { const v = evalMath(e.target.value); if (v !== null) updateItem(idx, 'quantity', v); }}
                              className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 tabular-nums" />
                          </div>
                          <div className="col-span-2">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 dark:text-slate-600 pointer-events-none">{cur}</span>
                              <input type="number" min="0" step="any" value={li.price}
                                onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                onBlur={(e) => { const v = evalMath(e.target.value); if (v !== null) updateItem(idx, 'price', v); }}
                                className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-right font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 tabular-nums" />
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className="relative">
                              <input type="number" min="0" max="100" step="0.1"
                                value={li.discount || 0}
                                onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                                className="w-full pr-5 pl-2 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 tabular-nums" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 pointer-events-none">%</span>
                            </div>
                          </div>
                          <div className="col-span-2 pt-2 text-right">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                              {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            {disc > 0 && <p className="text-[9px] mt-0.5" style={{ color: '#E11D48' }}>−{cur} {disc.toFixed(2)}</p>}
                          </div>
                          <div className="col-span-1 flex justify-end pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => removeItem(idx)}
                              disabled={estimateItems.length === 1}
                              className="ovds-doc-action-btn danger disabled:opacity-30 disabled:cursor-not-allowed">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Add line */}
                  <button type="button" onClick={addItem}
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors"
                    style={{ borderTop: '1px dashed var(--border)', color: 'var(--text-4)', background: 'var(--surface)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--aki-blue-50)'; (e.currentTarget as HTMLElement).style.color = 'var(--aki-blue)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-alt)' }}><Plus size={12} /></span>
                    Add line item
                  </button>

                  {/* Totals block */}
                  {estimateItems.some((i: any) => Number(i.price) > 0) && (
                    <div className="px-6 py-5 bg-slate-50/60 dark:bg-slate-800/20">
                      <div className="flex flex-col items-end">
                        <div className="w-full max-w-xs space-y-2.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{cur} {fmt(subtotal)}</span>
                          </div>
                          {totalDisc > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-rose-500">Line Discounts</span>
                              <span className="font-semibold text-rose-500">− {cur} {fmt(totalDisc)}</span>
                            </div>
                          )}
                          {/* Invoice-level discount */}
                          <div className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Tag size={12} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Discount %</span>
                            <input type="number" min="0" max="100" step="0.1" placeholder="0"
                              className="ml-auto w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-right text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400"
                              value={estimate.invoiceDiscount || ''}
                              onChange={(e) => setEstimate((p: any) => ({ ...p, invoiceDiscount: e.target.value }))} />
                          </div>
                          {invoiceDiscAmt > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-rose-500">Invoice Discount ({estimate.invoiceDiscount}%)</span>
                              <span className="font-semibold text-rose-500">− {cur} {fmt(invoiceDiscAmt)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span style={{ color: '#8B5CF6' }}>VAT ({settings?.ovds_default_vat_rate || 15}%)</span>
                            <span className="font-semibold tabular-nums" style={{ color: '#8B5CF6' }}>{cur} {fmt(totalVat)}</span>
                          </div>
                          <div className="pt-3 flex justify-between items-baseline" style={{ borderTop: '2px solid var(--border)', marginTop: 4 }}>
                            <span className="font-bold text-[14px]" style={{ color: 'var(--text)' }}>Quote Total</span>
                            <span className="text-[20px] font-black tabular-nums" style={{ color: 'var(--aki-blue)', letterSpacing: '-0.02em' }}>{cur} {fmt(grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-6" />
              </div>
            </div>

            {/* ── RIGHT: sticky summary sidebar ─────────────────────────── */}
            <div className="overflow-y-auto flex flex-col" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                <span className={`aki-badge sm ${
                  estimate.status === 'ACCEPTED'  ? 'solid-success' :
                  estimate.status === 'DECLINED'  ? 'solid-danger'  :
                  estimate.status === 'CONVERTED' ? 'solid-info'    :
                  estimate.status === 'SENT'      ? 'solid-info'    : 'solid-default'
                }`}>{estimate.status || 'Draft'}</span>
                {isEditing && (
                  <span className="ovds-label">Editing</span>
                )}
              </div>

              <div className="px-5 py-4 space-y-2" style={{ borderBottom: '1px solid var(--border-alt)' }}>
                <p className="ovds-label mb-2">Estimate Summary</p>
                <div className="flex justify-between items-center text-[13px]">
                  <span style={{ color: 'var(--text-3)' }}>Subtotal</span>
                  <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{cur} {fmt(subtotal)}</span>
                </div>
                {totalDisc > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span style={{ color: '#F43F5E' }}>Line Discounts</span>
                    <span className="font-semibold tabular-nums" style={{ color: '#F43F5E' }}>− {cur} {fmt(totalDisc)}</span>
                  </div>
                )}
                {invoiceDiscAmt > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span style={{ color: '#F43F5E' }}>Invoice Discount</span>
                    <span className="font-semibold tabular-nums" style={{ color: '#F43F5E' }}>− {cur} {fmt(invoiceDiscAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[13px]">
                  <span style={{ color: '#8B5CF6' }}>VAT ({settings?.ovds_default_vat_rate || 15}%)</span>
                  <span className="font-semibold tabular-nums" style={{ color: '#8B5CF6' }}>{cur} {fmt(totalVat)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2" style={{ borderTop: '2px solid var(--border)', marginTop: 4 }}>
                  <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>Quote Total</span>
                  <span className="text-[18px] font-black tabular-nums" style={{ color: 'var(--aki-blue)', letterSpacing: '-0.02em' }}>{cur} {fmt(grandTotal)}</span>
                </div>
              </div>

              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-alt)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="ovds-label">Completeness</p>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: completenessScore === 100 ? '#10B981' : completenessScore >= 60 ? '#F59E0B' : '#F43F5E' }}>
                    {completenessScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${completenessScore}%`, background: completenessScore === 100 ? '#10B981' : completenessScore >= 60 ? '#F59E0B' : '#F43F5E' }} />
                </div>
                <div className="space-y-1.5">
                  {completenessFields.map(f => (
                    <div key={f.label} className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: f.done ? '#D1FAE5' : 'var(--surface-alt)', border: `1px solid ${f.done ? '#A7F3D0' : 'var(--border)'}` }}>
                        {f.done ? <CheckCircle2 size={9} style={{ color: '#059669' }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />}
                      </div>
                      <span className="text-[11px]" style={{ color: f.done ? 'var(--text-3)' : 'var(--text-4)', textDecoration: f.done ? 'line-through' : 'none' }}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1" />

              <div className="sticky bottom-0 p-4 space-y-2" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                <button type="submit" form="estimate-form"
                  disabled={submitting}
                  className="w-full aki-btn aki-btn-primary justify-center">
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {isEditing ? 'Update Estimate' : 'Save Estimate'}
                </button>
                <button type="button"
                  disabled={submitting}
                  onClick={() => { submitStatusRef.current = 'SENT'; formRef.current?.requestSubmit(); }}
                  className="w-full aki-btn aki-btn-success justify-center">
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Save &amp; Send
                </button>
                {onPreview && (
                  <button type="button" onClick={onPreview}
                    disabled={submitting}
                    className="w-full aki-btn aki-btn-secondary justify-center">
                    <Eye size={13} /> Preview PDF
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>

      </div>
    </div>,
    document.body,
  );
};

export default EstimateModal;
