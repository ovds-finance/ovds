import React, { useState, useMemo } from 'react';
import { X, Trash2, Loader2, CheckCircle2, Wifi, QrCode, ShieldCheck, ShieldAlert, Plus, Split, FileDown, Tag, CalendarRange, Percent, TrendingUp, AlertCircle, Receipt } from 'lucide-react';
import api from '../../services/api';
import { invoicesApi } from '../../services/ovdsApi';
import toast from 'react-hot-toast';
import { useAuth } from '../../rbac/AuthContext';
import { PAYMENT_METHODS, NBE_INTERACTION_TYPES, ARCH_INTEGRATION_TYPES, PROCESS_INTEGRATION_TYPES } from './constants';
import TelecomReceiptViewer, { type ReceiptEvidence } from '../receiptViewer';
import { computeReceiptConfidence } from '../../utils/fmt';

interface RecordPaymentModalProps {
  invoice: any;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  currency,
  onClose,
  onSaved,
}) => {
  const { can } = useAuth();
  const canDeletePayment = can('invoices:delete');
  const totalPaid =
    invoice.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) ?? 0;
  const remaining = Math.max(0, Number(invoice.totalAmount) - totalPaid);

  const [form, setForm] = useState({
    amount: remaining.toFixed(2),
    method: 'CASH',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().split('T')[0],
    interactionType: '',
    archType: '',
    processType: '',
  });
  const [saving, setSaving] = useState(false);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [evidence, setEvidence] = useState<ReceiptEvidence | null>(null);
  // Split payment: queue multiple partial payments before submitting
  const [splits, setSplits] = useState<Array<{ amount: string; method: string; reference: string; notes: string }>>([]);
  const [splitMode, setSplitMode] = useState(false);
  // Payment plan
  const [planMode, setPlanMode] = useState(false);
  const [planInstallments, setPlanInstallments] = useState(3);
  const [planInterestRate, setPlanInterestRate] = useState(0);

  // Auto-generate installment schedule
  const installmentSchedule = useMemo(() => {
    if (!planMode || planInstallments < 2) return [];
    const base = remaining / planInstallments;
    const rate = planInterestRate / 100;
    return Array.from({ length: planInstallments }, (_, i) => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      const interest = base * rate * (i + 1);
      return {
        installment: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: (base + interest).toFixed(2),
      };
    });
  }, [planMode, planInstallments, planInterestRate, remaining]);

  // Overdue interest auto-calc
  const overdueInterest = useMemo(() => {
    if (!invoice.dueDate || invoice.status !== 'OVERDUE') return null;
    const daysOverdue = Math.max(0, Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / 86_400_000
    ));
    const rate = Number(invoice.lateInterestRate || 0);
    if (!rate || !daysOverdue) return null;
    const interest = (remaining * rate / 100) * (daysOverdue / 365);
    return { daysOverdue, rate, interest: Math.round(interest * 100) / 100 };
  }, [invoice, remaining]);

  // Evidence confidence score
  const evidenceConfidence = useMemo(() =>
    evidence ? computeReceiptConfidence(evidence) : 0,
  [evidence]);

  // Apply evidence from TelecomReceiptViewer — auto-fills form fields
  const handleApplyEvidence = (ev: ReceiptEvidence) => {
    setEvidence(ev);
    if (ev.telecomParsed?.amount) {
      setForm(f => ({ ...f, amount: String(ev.telecomParsed!.amount), method: 'MOBILE_MONEY' }));
    }
    if (ev.telecomRef) {
      setForm(f => ({ ...f, reference: ev.telecomRef! }));
    }
    if (ev.telecomParsed?.paidAt) {
      const d = ev.telecomParsed.paidAt.split('T')[0];
      if (d) setForm(f => ({ ...f, paidAt: d }));
    }
    if (ev.bankName && !ev.telecomRef) {
      setForm(f => ({
        ...f,
        method: 'BANK_TRANSFER',
        reference: ev.bankAccountNo || f.reference,
        notes: ev.bankAccountName ? `${ev.bankName} — ${ev.bankAccountName}` : (ev.bankName ?? f.notes),
      }));
    }
    // Update integration type tags if present in evidence
    if (ev.interactionType || ev.archType || ev.processType) {
      setForm(f => ({
        ...f,
        interactionType: ev.interactionType || f.interactionType,
        archType: ev.archType || f.archType,
        processType: ev.processType || f.processType,
      }));
    }
    toast.success('Receipt evidence applied');
  };

  // Export ERCA-compliant payment receipt as CSV (VAT sales register format)
  const handleExportERCA = () => {
    const payments = invoice.payments ?? [];
    const vatRate = Number(invoice.vatAmount) > 0 && Number(invoice.totalAmount) > 0
      ? ((Number(invoice.vatAmount) / (Number(invoice.totalAmount) - Number(invoice.vatAmount))) * 100).toFixed(0)
      : '15';
    const header = 'Invoice No,Date,Customer Name,Customer TIN,Payment Method,Taxable Amount (ETB),VAT Rate (%),VAT Amount (ETB),Total Amount (ETB),Reference,Telecom Ref,Bank,MCC,QR Type,TIN Validated,Duplicate Flag,ERCA Directive\n';
    const rows = payments.map((p: any) =>
      `"${invoice.invoiceNumber}","${new Date(p.paidAt).toLocaleDateString('en-ET')}","${invoice.customerName || invoice.customer}","${invoice.customerTin || ''}","${p.method}",${Number(invoice.subtotal || Number(invoice.totalAmount) - Number(invoice.vatAmount)).toFixed(2)},${vatRate},${Number(invoice.vatAmount).toFixed(2)},${Number(p.amount).toFixed(2)},"${p.reference || ''}","${p.telecomRef || ''}","${p.bankName || ''}","${p.mcc || ''}","${p.qrType || ''}",${p.tinValidated ? 'YES' : 'NO'},${p.isDuplicate ? 'YES' : 'NO'},"ERCA VAT Proclamation No. 1341/2024"`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ERCA_VAT_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success('ERCA-compliant VAT report exported');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(form.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    setSaving(true);
    try {
      const basePayload = {
        paymentSource: evidence?.telecomRef ? 'TELECOM' : evidence?.bankName ? 'BANK_QR' : 'MANUAL',
        telecomRef: evidence?.telecomRef,
        bankName: evidence?.bankName,
        bankAccountNo: evidence?.bankAccountNo,
        bankAccountName: evidence?.bankAccountName,
        mcc: evidence?.mcc,
        mccDescription: evidence?.mccDescription,
        qrType: evidence?.qrType,
        tinValidated: evidence?.tinValidated,
        isDuplicate: evidence?.isDuplicate,
        orderNo: evidence?.orderNo,
        orderType: evidence?.orderType,
        interactionType: form.interactionType || undefined,
        archType: form.archType || undefined,
        processType: form.processType || undefined,
      };

      if (splitMode && splits.length > 0) {
        // Post all queued splits sequentially
        for (const s of splits) {
          await invoicesApi.recordPayment(invoice.id, {
            ...s, amount: Number(s.amount), paidAt: form.paidAt, ...basePayload,
          });
        }
        // Also post the current form entry if it has a positive amount
        if (Number(form.amount) > 0) {
          await invoicesApi.recordPayment(invoice.id, {
            ...form, amount: Number(form.amount), ...basePayload,
          });
        }
        toast.success(`${splits.length + (Number(form.amount) > 0 ? 1 : 0)} split payment(s) recorded`);
      } else {
        await invoicesApi.recordPayment(invoice.id, {
          ...form, amount: Number(form.amount), ...basePayload,
        });
        toast.success('Payment recorded');
      }
      // Note: the backend's recordInvoicePayment automatically posts
      // Dr Cash/Bank, Cr Accounts Receivable — no client-side GL call needed.
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentPlan = async () => {
    if (installmentSchedule.length < 2) return;
    setSaving(true);
    try {
      const { collectionsApi: cApi } = await import('../../services/collectionsApi');
      await cApi.createPaymentPlan(invoice.id, installmentSchedule.map(s => ({
        dueDate: s.dueDate,
        amount: Number(s.amount),
      })));
      toast.success(`Payment plan created — ${installmentSchedule.length} installments`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create payment plan');
    } finally {
      setSaving(false);
    }
  };

  const addSplit = () => {
    if (Number(form.amount) <= 0) return;
    const newSplit = { amount: form.amount, method: form.method, reference: form.reference, notes: form.notes };
    setSplits(s => [...s, newSplit]);
    const splitTotal = splits.reduce((s, p) => s + Number(p.amount), 0) + Number(form.amount);
    const newRemaining = Math.max(0, remaining - splitTotal);
    setForm(f => ({ ...f, amount: newRemaining.toFixed(2), reference: '', notes: '' }));
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!canDeletePayment) { toast.error('Insufficient permissions'); return; }
    try {
      await invoicesApi.deletePayment(paymentId);
      toast.success('Payment removed');
      onSaved();
    } catch { toast.error('Failed to remove payment'); }
  };

  const paidPct = Number(invoice.totalAmount) > 0
    ? Math.min(100, Math.round((totalPaid / Number(invoice.totalAmount)) * 100))
    : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-[55] flex items-center justify-center p-4"
        style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Record Payment — ${invoice.invoiceNumber}`}
      >
        <div className="aki-card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
          <div className="p-6">
            {/* -- Header -- */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--aki-success-bg)', color: 'var(--aki-success-text)' }}>
                  <Receipt size={18} />
                </div>
                <div>
                  <p className="font-black text-sm tracking-tight" style={{ color: 'var(--text)' }}>Record Payment</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-4)' }}>
                    {invoice.invoiceNumber} · {invoice.customerName || invoice.customer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {invoice.payments?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportERCA}
                    className="aki-btn aki-btn-danger xs"
                    title="Export ERCA-compliant VAT payment report"
                  >
                    <FileDown size={11} /> ERCA
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="aki-btn aki-btn-ghost xs icon-only"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="aki-card mb-5" style={{ borderRadius: '12px', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border-alt)' }}>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold" style={{ color: 'var(--text-2)' }}>Payment Progress</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{paidPct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface-alt)' }}>
                <div
                  className="aki-progress-bar success h-full rounded-full"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Total', value: Number(invoice.totalAmount), color: 'var(--text)' },
                  { label: 'Paid', value: totalPaid, color: 'var(--aki-success-text)' },
                  { label: 'Remaining', value: remaining, color: remaining > 0 ? 'var(--aki-warning-text)' : 'var(--aki-success-text)' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>{s.label}</p>
                    <p className="text-sm font-semibold" style={{ color: s.color }}>{currency} {s.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue interest banner */}
            {overdueInterest && (
              <div className="aki-card mb-4 flex items-start gap-2.5" style={{ borderRadius: '12px', padding: '12px', background: 'var(--aki-danger-bg)', border: `1px solid var(--aki-danger-border)` }}>
                <AlertCircle size={14} style={{ color: 'var(--aki-danger-text)' }} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--aki-danger-text)' }}>
                    Overdue {overdueInterest.daysOverdue} days · {overdueInterest.rate}% p.a. late interest
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--aki-danger-text)', opacity: 0.8 }}>
                    Accrued interest: {currency} {overdueInterest.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {' '}— consider adding to payment amount
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, amount: (remaining + overdueInterest.interest).toFixed(2) }))}
                  className="aki-btn aki-btn-danger xs"
                >
                  Include
                </button>
              </div>
            )}

            {/* Existing payments */}
            {invoice.payments?.length > 0 && (
              <div className="aki-card mb-5" style={{ borderRadius: '12px', padding: 0, overflow: 'hidden' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--surface-alt)' }}>
                  <p className="aki-section-title" style={{ marginBottom: 0 }}>Payment History</p>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-3">
                  {invoice.payments.map((p: any) => (
                    <div key={p.id} className="aki-card flex items-center gap-3" style={{ borderRadius: '12px', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border-alt)' }}>
                      <span className="text-base">{PAYMENT_METHODS.find((m) => m.value === p.method)?.icon || '💳'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {currency} {Number(p.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold" style={{ color: 'var(--text-4)' }}>
                          {p.method} · {new Date(p.paidAt).toLocaleDateString()}
                          {p.reference ? ` · ${p.reference}` : ''}
                          {p.telecomRef ? ` · Ref: ${p.telecomRef}` : ''}
                          {p.mcc ? ` · MCC ${p.mcc}` : ''}
                          {p.interactionType ? ` · ${p.interactionType}` : ''}
                        </p>
                      </div>
                      {p.interactionType && (
                        <span className="aki-badge xs" style={{ background: 'var(--aki-warning-bg)', color: 'var(--aki-warning-text)' }}>
                          {p.interactionType}
                        </span>
                      )}
                      {p.archType && (
                        <span className="aki-badge xs" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
                          {p.archType}
                        </span>
                      )}
                      {p.processType && (
                        <span className="aki-badge xs" style={{ background: 'var(--aki-success-bg)', color: 'var(--aki-success-text)' }}>
                          {p.processType}
                        </span>
                      )}
                      {p.tinValidated && <ShieldCheck size={12} style={{ color: 'var(--aki-success-text)' }} shrink-0 aria-label="TIN Validated" />}
                      {p.isDuplicate && <ShieldAlert size={12} style={{ color: 'var(--aki-danger-text)' }} shrink-0 aria-label="Duplicate flagged" />}
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="aki-btn aki-btn-ghost xs icon-only opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: 'var(--text-4)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remaining > 0 ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                 {/* Split payment toggle */}
                 <div className="flex items-center justify-between">
                   <p className="aki-section-title" style={{ marginBottom: 0 }}>New Payment</p>
                   <div className="flex gap-2">
                     <button
                       type="button"
                       onClick={() => { setSplitMode(v => !v); setPlanMode(false); }}
                       className={`aki-btn xs ${splitMode ? 'aki-btn-soft-purple' : 'aki-btn-secondary'}`}
                     >
                       <Split size={11} /> Split
                     </button>
                     <button
                       type="button"
                       onClick={() => { setPlanMode(v => !v); setSplitMode(false); }}
                       className={`aki-btn xs ${planMode ? 'aki-btn-soft-emerald' : 'aki-btn-secondary'}`}
                     >
                       <CalendarRange size={11} /> Plan
                     </button>
                   </div>
                 </div>

                 {/* Payment plan builder */}
                 {planMode && (
                   <div className="aki-card space-y-3 animate-in slide-in-from-top-2 duration-200" style={{ borderRadius: '16px', padding: '16px', background: 'var(--aki-success-bg)', border: `1px solid var(--aki-success-border)` }}>
                     <p className="aki-section-title flex items-center gap-1.5" style={{ marginBottom: 0, color: 'var(--aki-success-text)' }}>
                       <CalendarRange size={10} /> Installment Payment Plan
                     </p>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="aki-label">Installments</label>
                         <input type="number" min={2} max={24} value={planInstallments}
                           onChange={e => setPlanInstallments(Math.max(2, Math.min(24, Number(e.target.value))))}
                           className="aki-input" />
                       </div>
                       <div>
                         <label className="aki-label flex items-center gap-1">
                           <Percent size={8} /> Monthly Interest %
                         </label>
                         <input type="number" min={0} max={100} step={0.1} value={planInterestRate}
                           onChange={e => setPlanInterestRate(Number(e.target.value))}
                           className="aki-input" />
                       </div>
                     </div>
                     {installmentSchedule.length > 0 && (
                       <div className="space-y-1.5 max-h-40 overflow-y-auto">
                         {installmentSchedule.map(s => (
                           <div key={s.installment} className="aki-card flex items-center justify-between" style={{ borderRadius: '12px', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--aki-success-border)' }}>
                             <span className="font-semibold" style={{ color: 'var(--aki-success-text)' }}>#{s.installment}</span>
                             <span className="text-sm" style={{ color: 'var(--text-4)' }}>{new Date(s.dueDate).toLocaleDateString()}</span>
                             <span className="font-semibold" style={{ color: 'var(--text)' }}>{currency} {Number(s.amount).toLocaleString()}</span>
                           </div>
                         ))}
                         <div className="flex justify-between px-3 py-1.5 text-[10px] font-semibold" style={{ borderTop: '1px solid var(--aki-success-border)', color: 'var(--aki-success-text)' }}>
                           <span>Total</span>
                           <span>{currency} {installmentSchedule.reduce((s, i) => s + Number(i.amount), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                         </div>
                       </div>
                     )}
                     <button type="button" onClick={handleSavePaymentPlan} disabled={saving || installmentSchedule.length < 2}
                       className="aki-btn aki-btn-success w-full justify-center"
                     >
                       {saving ? <Loader2 size={13} className="animate-spin" /> : <CalendarRange size={13} />}
                       Save Payment Plan
                     </button>
                   </div>
                 )}

                 {/* Split queue */}
                 {splitMode && splits.length > 0 && (
                   <div className="aki-card space-y-1.5" style={{ borderRadius: '16px', padding: '16px', background: '#EDE9FE', border: `1px solid #DDD6FE` }}>
                     <p className="aki-section-title flex items-center gap-1.5" style={{ marginBottom: 0, color: '#6D28D9' }}>Queued Splits</p>
                     {splits.map((s, i) => (
                       <div key={i} className="aki-card flex items-center gap-2 text-xs" style={{ borderRadius: '8px', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border-alt)' }}>
                         <span className="font-semibold" style={{ color: 'var(--text)' }}>{currency} {Number(s.amount).toLocaleString()}</span>
                          <span style={{ color: 'var(--text-4)' }}>·</span>
                         <span style={{ color: 'var(--text-4)' }}>{s.method}</span>
                         {s.reference && <span className="font-mono text-[10px]" style={{ color: 'var(--text-4)' }}>{s.reference}</span>}
                         <button type="button" onClick={() => setSplits(sp => sp.filter((_, j) => j !== i))}
                           className="ml-auto" style={{ color: 'var(--text-4)' }}>
                           <X size={11} />
                         </button>
                       </div>
                     ))}
                     <div className="pt-1 flex justify-between px-3 py-1.5 text-[10px] font-semibold" style={{ borderTop: '1px solid #DDD6FE', color: '#6D28D9' }}>
                       <span>Queued</span>
                       <span>{currency} {splits.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}</span>
                     </div>
                   </div>
                 )}

                 {/* Receipt Evidence collector button */}
                 <button
                   type="button"
                   onClick={() => setShowReceiptViewer(true)}
                   className="aki-card w-full flex items-center gap-3"
                   style={{ borderRadius: '16px', padding: '16px', background: evidence ? 'var(--aki-success-bg)' : 'var(--surface)', border: `1px solid ${evidence ? 'var(--aki-success-border)' : 'var(--border)'}`, color: evidence ? 'var(--aki-success-text)' : 'var(--text-2)' }}
                 >
                   {evidence ? <CheckCircle2 size={15} style={{ color: 'var(--aki-success-text)' }} /> : <Wifi size={15} style={{ color: 'var(--aki-warning-text)' }} />}
                   <span className="flex-1 text-left">
                     {evidence
                       ? `Evidence attached${evidence.telecomRef ? ` · Ref: ${evidence.telecomRef}` : ''}${evidence.bankName ? ` · ${evidence.bankName}` : ''}`
                       : 'Collect Receipt Evidence (Telebirr, Bank QR, Photo)'}
                   </span>
                   {evidence?.mcc && (
                     <span className="aki-badge xs" style={{ background: 'var(--aki-warning-bg)', color: 'var(--aki-warning-text)' }}>
                       MCC {evidence.mcc}
                     </span>
                   )}
                   {evidence?.qrType && (
                     <span className="aki-badge xs" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
                       {evidence.qrType}
                     </span>
                   )}
                   {evidence?.tinValidated && <ShieldCheck size={13} style={{ color: 'var(--aki-success-text)' }} aria-label="TIN Validated" />}
                   {evidence?.isDuplicate && <ShieldAlert size={13} style={{ color: 'var(--aki-danger-text)' }} aria-label="Duplicate detected" />}
                   {evidence && evidenceConfidence > 0 && (
                     <span className={`aki-badge xs ${
                       evidenceConfidence >= 70 ? 'solid-success' : evidenceConfidence >= 40 ? 'solid-warning' : 'solid-danger'
                     }`} title={`Evidence confidence: ${evidenceConfidence}%`}>
                       <TrendingUp size={9} className="inline mr-0.5" />{evidenceConfidence}%
                     </span>
                   )}
                   {evidence && (
                     <button
                       type="button"
                       onClick={(e) => { e.stopPropagation(); setEvidence(null); }}
                       className="aki-btn aki-btn-ghost xs icon-only"
                     >
                       <X size={12} />
                     </button>
                   )}
                 </button>

                 {/* Duplicate warning */}
                 {evidence?.isDuplicate && (
                   <div className="aki-card flex items-center gap-2" style={{ borderRadius: '12px', padding: '12px', background: 'var(--aki-danger-bg)', border: `1px solid var(--aki-danger-border)`, color: 'var(--aki-danger-text)' }}>
                     <ShieldAlert size={13} /> Duplicate payment reference detected. Verify before proceeding.
                   </div>
                 )}

                 {/* Order No display if validated */}
                 {evidence?.orderNo && (
                   <div className="aki-card flex items-center gap-2" style={{ borderRadius: '12px', padding: '8px 12px', background: 'var(--aki-success-bg)', border: `1px solid var(--aki-success-border)`, color: 'var(--aki-success-text)' }}>
                     <QrCode size={11} /> Order No: {evidence.orderNo}
                     {evidence.orderType && <span className="aki-badge xs" style={{ background: 'var(--aki-success-bg)', color: 'var(--aki-success-text)' }}>{evidence.orderType}</span>}
                   </div>
                 )}

                 {/* Method selector */}
                 <div className="grid grid-cols-5 gap-2">
                   {PAYMENT_METHODS.map((m) => (
                     <button
                       key={m.value}
                       type="button"
                       onClick={() => setForm({ ...form, method: m.value })}
                       className={`aki-card flex flex-col items-center gap-1 p-2.5 text-[10px] font-semibold transition-all ${form.method === m.value ? 'aki-btn-soft-blue' : ''}`}
                       style={{ borderRadius: '12px', border: `1px solid ${form.method === m.value ? 'var(--aki-blue)' : 'var(--border)'}`, color: form.method === m.value ? 'var(--aki-blue)' : 'var(--text-2)', background: form.method === m.value ? 'var(--aki-blue-50)' : 'var(--surface)' }}
                     >
                       <span className="text-lg">{m.icon}</span>
                       <span className="leading-tight text-center">{m.label.split(' ')[0]}</span>
                     </button>
                   ))}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="aki-field">
                     <label className="aki-label">Amount ({currency})</label>
                     <input
                       type="number"
                       required
                       min="0.01"
                       step="0.01"
                       value={form.amount}
                       onChange={(e) => setForm({ ...form, amount: e.target.value })}
                       className="aki-input"
                     />
                   </div>
                   <div className="aki-field">
                     <label className="aki-label">Payment Date</label>
                     <input
                       type="date"
                       value={form.paidAt}
                       onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                       className="aki-input"
                     />
                   </div>
                 </div>

                 <div className="aki-field">
                   <label className="aki-label">Reference / Receipt #</label>
                   <input
                     type="text"
                     value={form.reference}
                     onChange={(e) => setForm({ ...form, reference: e.target.value })}
                     placeholder="e.g. TXN-123456 or cheque number"
                     className="aki-input"
                   />
                 </div>

                 <div className="aki-field">
                   <label className="aki-label">Notes</label>
                   <input
                     type="text"
                     value={form.notes}
                     onChange={(e) => setForm({ ...form, notes: e.target.value })}
                     placeholder="Optional payment notes"
                     className="aki-input"
                   />
                 </div>

                 {/* Integration Type — full taxonomy: NBE flow · Architecture · Business Process */}
                 <div className="aki-card" style={{ borderRadius: '16px', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                   <p className="aki-section-title flex items-center gap-1.5" style={{ marginBottom: 0 }}>
                     <Tag size={10} /> Integration Type
                   </p>

                   {/* NBE Payment Flow */}
                   <div>
                     <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--aki-warning-text)' }}>NBE Payment Flow</p>
                     <div className="grid grid-cols-4 gap-1">
                       {NBE_INTERACTION_TYPES.map((t) => (
                         <button
                           key={t.value}
                           type="button"
                           onClick={() => setForm(f => ({ ...f, interactionType: f.interactionType === t.value ? '' : t.value }))}
                           title={t.description}
                           className="aki-card flex flex-col items-center gap-1 p-2 text-[10px] font-medium transition-all text-center leading-tight"
                           style={{ borderRadius: '12px', border: `1px solid ${form.interactionType === t.value ? 'var(--aki-warning-border)' : 'var(--border)'}`, color: form.interactionType === t.value ? 'var(--aki-warning-text)' : 'var(--text-2)', background: form.interactionType === t.value ? 'var(--aki-warning-bg)' : 'var(--surface)' }}
                         >
                           <span className="block text-base mb-0.5">{t.icon}</span>
                           {t.short}
                         </button>
                       ))}
                     </div>
                     {form.interactionType && (
                       <p className="text-[9px] mt-1 pl-0.5" style={{ color: 'var(--text-4)' }}>
                         {NBE_INTERACTION_TYPES.find(t => t.value === form.interactionType)?.description}
                       </p>
                     )}
                   </div>

                   {/* Architecture Pattern */}
                   <div>
                     <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6D28D9' }}>Architecture / Connectivity</p>
                     <div className="grid grid-cols-4 gap-1">
                       {ARCH_INTEGRATION_TYPES.map((t) => (
                         <button
                           key={t.value}
                           type="button"
                           onClick={() => setForm(f => ({ ...f, archType: f.archType === t.value ? '' : t.value }))}
                           title={t.description}
                           className="aki-card flex flex-col items-center gap-1 p-2 text-[10px] font-medium transition-all text-center leading-tight"
                           style={{ borderRadius: '12px', border: `1px solid ${form.archType === t.value ? '#DDD6FE' : 'var(--border)'}`, color: form.archType === t.value ? '#6D28D9' : 'var(--text-2)', background: form.archType === t.value ? '#EDE9FE' : 'var(--surface)' }}
                         >
                           <span className="block text-base mb-0.5">{t.icon}</span>
                           <span className="truncate block">{t.label.split(' ')[0]}</span>
                         </button>
                       ))}
                     </div>
                     {form.archType && (
                       <p className="text-[9px] mt-1 pl-0.5" style={{ color: 'var(--text-4)' }}>
                         {ARCH_INTEGRATION_TYPES.find(t => t.value === form.archType)?.description}
                       </p>
                     )}
                   </div>

                   {/* Business Process */}
                   <div>
                     <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--aki-success-text)' }}>Business Process</p>
                     <div className="grid grid-cols-4 gap-1">
                       {PROCESS_INTEGRATION_TYPES.map((t) => (
                         <button
                           key={t.value}
                           type="button"
                           onClick={() => setForm(f => ({ ...f, processType: f.processType === t.value ? '' : t.value }))}
                           title={t.description}
                           className="aki-card flex flex-col items-center gap-1 p-2 text-[10px] font-medium transition-all text-center leading-tight"
                           style={{ borderRadius: '12px', border: `1px solid ${form.processType === t.value ? 'var(--aki-success-border)' : 'var(--border)'}`, color: form.processType === t.value ? 'var(--aki-success-text)' : 'var(--text-2)', background: form.processType === t.value ? 'var(--aki-success-bg)' : 'var(--surface)' }}
                         >
                           <span className="block text-base mb-0.5">{t.icon}</span>
                           <span className="truncate block">{t.label.split(' ')[0]}</span>
                         </button>
                       ))}
                     </div>
                     {form.processType && (
                       <p className="text-[9px] mt-1 pl-0.5" style={{ color: 'var(--text-4)' }}>
                         {PROCESS_INTEGRATION_TYPES.find(t => t.value === form.processType)?.description}
                       </p>
                     )}
                   </div>

                   {/* Active tags summary */}
                   {(form.interactionType || form.archType || form.processType) && (
                     <div className="flex flex-wrap gap-1.5 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                       {form.interactionType && (
                         <span className="aki-badge" style={{ background: 'var(--aki-warning-bg)', color: 'var(--aki-warning-text)' }}>
                           {NBE_INTERACTION_TYPES.find(t => t.value === form.interactionType)?.icon} {form.interactionType}
                            <button type="button" onClick={() => setForm(f => ({ ...f, interactionType: '' }))} className="ml-0.5" style={{ color: 'var(--text-4)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--aki-danger-text)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}>×</button>
                         </span>
                       )}
                       {form.archType && (
                         <span className="aki-badge" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
                           {ARCH_INTEGRATION_TYPES.find(t => t.value === form.archType)?.icon} {form.archType}
                            <button type="button" onClick={() => setForm(f => ({ ...f, archType: '' }))} className="ml-0.5" style={{ color: 'var(--text-4)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--aki-danger-text)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}>×</button>
                         </span>
                       )}
                       {form.processType && (
                         <span className="aki-badge" style={{ background: 'var(--aki-success-bg)', color: 'var(--aki-success-text)' }}>
                           {PROCESS_INTEGRATION_TYPES.find(t => t.value === form.processType)?.icon} {form.processType}
                            <button type="button" onClick={() => setForm(f => ({ ...f, processType: '' }))} className="ml-0.5" style={{ color: 'var(--text-4)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--aki-danger-text)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}>×</button>
                         </span>
                       )}
                    </div>
                  )}
                </div>

                 {/* ERCA VAT & WHT summary */}
                 {Number(form.amount) > 0 && (
                   <div className="aki-card space-y-1.5" style={{ borderRadius: '16px', padding: '16px', background: 'var(--aki-danger-bg)', border: `1px solid var(--aki-danger-border)` }}>
                     <p className="aki-section-title flex items-center gap-1.5" style={{ marginBottom: 0, color: 'var(--aki-danger-text)' }}>
                       <Receipt size={9} /> ERCA Tax Summary
                     </p>
                     {(() => {
                       const amt = Number(form.amount);
                       const vatRate = Number(invoice.vatAmount) > 0 && Number(invoice.totalAmount) > 0
                         ? Number(invoice.vatAmount) / (Number(invoice.totalAmount) - Number(invoice.vatAmount))
                         : 0.15;
                       const taxable = amt / (1 + vatRate);
                       const vat = amt - taxable;
                       const wht = taxable * 0.03; // 3% WHT on taxable base
                       return (
                         <div className="grid grid-cols-3 gap-2 text-center">
                           {[
                             { label: 'Taxable', value: taxable, color: 'var(--text)' },
                             { label: `VAT (${Math.round(vatRate * 100)}%)`, value: vat, color: 'var(--aki-danger-text)' },
                             { label: 'WHT (3%)', value: wht, color: 'var(--aki-warning-text)' },
                           ].map((s) => (
                             <div key={s.label}>
                               <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>{s.label}</p>
                               <p className="text-xs font-semibold" style={{ color: s.color }}>{currency} {s.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                             </div>
                           ))}
                         </div>
                       );
                     })()}
                   </div>
                 )}

                 <div className="flex gap-3 pt-2">
                   <button
                     type="button"
                     onClick={onClose}
                     className="aki-btn aki-btn-secondary flex-1 justify-center"
                   >
                     Cancel
                   </button>
                   {splitMode && (
                     <button
                       type="button"
                       onClick={addSplit}
                       disabled={Number(form.amount) <= 0}
                       className="aki-btn aki-btn-success flex-1 justify-center"
                     >
                       <Plus size={14} /> Add Split
                     </button>
                   )}
                   <button
                     type="submit"
                     disabled={saving}
                     className="aki-btn aki-btn-success flex-1 justify-center"
                   >
                     {saving && <Loader2 size={14} className="animate-spin" />}
                     <CheckCircle2 size={14} />
                     {splitMode && splits.length > 0 ? `Record ${splits.length + 1} Payments` : 'Record Payment'}
                   </button>
                 </div>
              </form>
             ) : (
               <div className="text-center py-6">
                 <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--aki-success-bg)', color: 'var(--aki-success-text)' }}>
                   <CheckCircle2 size={24} />
                 </div>
                 <p className="font-semibold" style={{ color: 'var(--aki-success-text)' }}>Fully Paid</p>
                 <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                   All {currency} {Number(invoice.totalAmount).toLocaleString()} has been collected.
                 </p>
                 <button
                   onClick={onClose}
                   className="aki-btn aki-btn-secondary mt-4"
                 >
                   Close
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* TelecomReceiptViewer — opens on top of this modal */}
      {showReceiptViewer && (
        <TelecomReceiptViewer
          onClose={() => setShowReceiptViewer(false)}
          onApply={handleApplyEvidence}
          initialRef={evidence?.telecomRef || ''}
          invoiceId={invoice.id}
        />
      )}
    </>
  );
};

export default RecordPaymentModal;










