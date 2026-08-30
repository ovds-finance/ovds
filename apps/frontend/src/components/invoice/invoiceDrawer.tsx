import React, { useState, useEffect, useCallback } from 'react';
import {
  Repeat2, Edit2, Wifi, Printer, X,
  Calendar, QrCode, ExternalLink, Search, AlertTriangle, Banknote,
  StickyNote, Mail, Image, Eye, Clock, ChevronUp, ChevronDown,
  Send, Receipt, CheckCircle2, Tag, ShieldCheck, ShieldAlert,
  CalendarRange, TrendingUp, RefreshCw, Link2, Clock3,
  BookOpen, Scale, AlertCircle, Info, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PAYMENT_METHODS } from './constants';
import { computeReceiptConfidence, fmtRelativeTime } from '../../utils/fmt';
import { downloadCSV } from '../../utils/download';
import { QR_CODE_SERVICE_URL } from '../../utils/constants';
import api from '../../services/api';
import { invoicesApi } from '../../services/ovdsApi';
import InvoiceCaptureModal, { type CapturedInvoiceData } from './invoiceCaptureModal';
import EimsInvoicePanel from './eimsInvoicePanel';

interface InvoiceDrawerProps {
  invoice: any;
  currency: string;
  onClose: () => void;
  onPrint: (inv: any) => void;
  onStatusChange: (id: string, s: string) => void;
  onEdit: (inv: any) => void;
  onDuplicate: (id: string) => void;
  onRecordPayment: (inv: any) => void;
  onCollectEvidence: (inv: any) => void;
  onCreditNote: (id: string) => void;
  onDebitNote?: (id: string, amount: number) => void;
  onSend: (id: string) => void;
  merchantId: string;
  /** Called after evidence is saved so parent can refresh invoice data */
  onRefresh?: () => void;
}

const InvoiceDrawer: React.FC<InvoiceDrawerProps> = ({
  invoice: inv,
  currency,
  onClose,
  onPrint,
  onStatusChange,
  onEdit,
  onDuplicate,
  onRecordPayment,
  onCollectEvidence,
  onCreditNote,
  onDebitNote,
  onSend,
  merchantId,
  onRefresh,
}) => {
  const [showQR, setShowQR] = useState(false);
  const [showIfrs, setShowIfrs] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceResult, setComplianceResult] = useState<{
    compliant: boolean; violations: string[]; warnings: string[]; checks: Record<string, any>;
  } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [showPaymentPlan, setShowPaymentPlan] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [activityLog, setActivityLog] = useState<any[]>(inv.InvoiceActivity ?? inv.activityLog ?? []);
  const [paymentPlan, setPaymentPlan] = useState<any[]>(inv.paymentPlan ?? []);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPaySaving, setQuickPaySaving] = useState(false);
  const qrData = inv.eimsSignedQr ?? `NBE-IQR|${merchantId}|${inv.totalAmount}|${inv.invoiceNumber}|${currency}|${inv.vatAmount}`;
  const isEimsQr = !!inv.eimsSignedQr;

  // Aging bucket
  const agingDays = inv.dueDate
    ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86_400_000)
    : null;
  const agingBucket =
    agingDays === null ? null
    : agingDays <= 0 ? { label: 'Current', color: 'aki-badge sm solid-success' }
    : agingDays <= 30 ? { label: '1–30 days', color: 'aki-badge sm solid-warning' }
    : agingDays <= 60 ? { label: '31–60 days', color: 'aki-badge sm solid-warning' }
    : agingDays <= 90 ? { label: '61–90 days', color: 'aki-badge sm solid-danger' }
    : { label: '90+ days', color: 'aki-badge sm solid-danger' };

  const totalPaid = (inv.payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const remaining = Math.max(0, Number(inv.totalAmount) - totalPaid);

  // Fetch activity log and payment plan on mount
  useEffect(() => {
    if (!inv.id) return;
    setLoadingActivity(true);
    Promise.all([
      invoicesApi.getActivity(inv.id).catch(() => []),
      api.get(`/ovds/invoices/${inv.id}/payment-plan`).catch(() => ({ data: { data: { installments: [] } } })),
    ]).then(([acts, planRes]) => {
      if (Array.isArray(acts) && acts.length > 0) setActivityLog(acts);
      const plan = (planRes as any)?.data?.data?.installments ?? (planRes as any)?.installments ?? [];
      if (Array.isArray(plan) && plan.length > 0) setPaymentPlan(plan);
    }).finally(() => setLoadingActivity(false));
  }, [inv.id]);

  const handleSendReminder = useCallback(async () => {
    setSendingReminder(true);
    try {
      const res = await invoicesApi.sendReminder(inv.id);
      toast.success((res as any)?.message ?? 'Reminder sent');
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(false);
    }
  }, [inv.id]);

  const handleCaptureApply = useCallback(async (data: CapturedInvoiceData) => {
    const patch: Record<string, any> = {};
    if (data.telecomRef && !inv.telecomReceiptRef) patch.telecomReceiptRef = data.telecomRef;
    if (data.bankName && !inv.bankName) patch.bankName = data.bankName;
    if (data.bankAccountNo && !inv.bankAccountNo) patch.bankAccountNo = data.bankAccountNo;
    if (data.bankQrRawData && !inv.bankQrRawData) patch.bankQrRawData = data.bankQrRawData;
    if (data.receiptImageData && !inv.receiptImageData) patch.receiptImageData = data.receiptImageData;
    if (data.bankSlipImageData && !inv.bankSlipImageData) patch.bankSlipImageData = data.bankSlipImageData;
    if (data.paymentSource && !inv.paymentSource) patch.paymentSource = data.paymentSource;
    if (Object.keys(patch).length > 0) {
      try {
        await invoicesApi.update(inv.id, patch);
        toast.success('Evidence attached to invoice');
        onRefresh?.();
      } catch { toast.error('Failed to save evidence'); }
    } else {
      toast('No new evidence fields to update', { icon: 'ℹ️' });
    }
    setShowCapture(false);
  }, [inv, onRefresh]);

  const evidenceConfidence = computeReceiptConfidence({
    telecomRef: inv.telecomReceiptRef,
    telecomParsed: inv.telecomAmount ? { amount: Number(inv.telecomAmount), paidAt: inv.telecomPaidAt } : undefined,
    bankName: inv.bankName,
    bankAccountNo: inv.bankAccountNo,
    mcc: inv.mcc,
    qrType: inv.qrType,
    tinValidated: inv.tinValidated,
    isDuplicate: inv.isDuplicate,
    orderNo: inv.orderNo,
    receiptImageData: inv.receiptImageData,
    bankSlipImageData: inv.bankSlipImageData,
  });

  const handleValidateCompliance = useCallback(async () => {
    setComplianceLoading(true);
    setShowCompliance(true);
    try {
      const result = await invoicesApi.validateCompliance(inv.id);
      setComplianceResult(result as any);
    } catch {
      toast.error('Compliance check failed');
      setShowCompliance(false);
    } finally {
      setComplianceLoading(false);
    }
  }, [inv.id]);

  const handleCopyShareLink = useCallback(async () => {
    try {
      let token = inv.shareToken;
      if (!token) {
        const r = await invoicesApi.share(inv.id);
        token = (r as any)?.shareToken;
      }
      if (!token) { toast.error('Could not generate share link'); return; }
      await navigator.clipboard.writeText(`${window.location.origin}/client-portal/${token}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
      toast.success('Share link copied');
    } catch { toast.error('Failed to copy share link'); }
  }, [inv]);

  const handleQuickPay = useCallback(async () => {
    const amt = Number(quickPayAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setQuickPaySaving(true);
    try {
      await invoicesApi.recordPayment(inv.id, {
        amount: amt,
        method: 'CASH',
        paidAt: new Date().toISOString().split('T')[0],
      });
      toast.success(`${currency} ${amt.toLocaleString()} recorded`);
      setQuickPayAmount('');
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setQuickPaySaving(false);
    }
  }, [quickPayAmount, inv.id, currency, onRefresh]);

  const handleExportERCA = () => {
    const payments = inv.payments ?? [];
    const subtotal = Number(inv.subtotal || Number(inv.totalAmount) - Number(inv.vatAmount));
    const vatAmt = Number(inv.vatAmount || 0);
    const vatRate = subtotal > 0 ? Math.round((vatAmt / subtotal) * 100) : 15;
    const wht = subtotal * 0.03;
    const header = 'Invoice No,Date,Due Date,Customer Name,Customer TIN,Status,Payment Source,Taxable Amount (ETB),VAT Rate (%),VAT Amount (ETB),WHT 3% (ETB),Total (ETB),Telecom Ref,Bank,Account,TIN Validated,Duplicate,Payment Date,Payment Method,Payment Amount,Payment Ref,ERCA Directive\n';
    const baseRow = `"${inv.invoiceNumber}","${new Date(inv.date).toLocaleDateString('en-ET')}","${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-ET') : ''}","${inv.customer}","${inv.customerTin || ''}","${inv.status}","${inv.paymentSource || 'MANUAL'}",${subtotal.toFixed(2)},${vatRate},${vatAmt.toFixed(2)},${wht.toFixed(2)},${Number(inv.totalAmount).toFixed(2)},"${inv.telecomReceiptRef || ''}","${inv.bankName || ''}","${inv.bankAccountNo || ''}",${inv.tinValidated ? 'YES' : 'NO'},${inv.isDuplicate ? 'YES' : 'NO'}`;
    const rows = payments.length > 0
      ? payments.map((p: any) => `${baseRow},"${new Date(p.paidAt).toLocaleDateString('en-ET')}","${p.method}",${Number(p.amount).toFixed(2)},"${p.reference || p.telecomRef || ''}","ERCA VAT Proclamation No. 1341/2024"`)
      : [`${baseRow},"","","","","ERCA VAT Proclamation No. 1341/2024"`];
    downloadCSV(header + rows.join('\n'), `ERCA_invoice_${inv.invoiceNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('ERCA-compliant invoice report exported');
  };

  const copyReminder = () => {
    const text = `Dear ${inv.customer},\n\nThis is a payment reminder for Invoice ${inv.invoiceNumber}.\nAmount Due: ${currency} ${Number(inv.totalAmount).toLocaleString()}\nDue Date: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}\n\nPlease process payment at your earliest convenience.\n\nThank you,\novds ovds`;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Reminder copied to clipboard'));
  };

  // ── Derived values for the render ────────────────────────────────────
  const fmt = (n: number) => `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const subtotal = Number(inv.subtotal ?? (Number(inv.totalAmount) - Number(inv.vatAmount ?? 0)));
  const vatAmt   = Number(inv.vatAmount ?? 0);
  const drrfAmt  = subtotal * 0.01;

  const statusColor: Record<string, string> = {
    DRAFT:     '#6B7280',
    PENDING:   '#D97706',
    PAID:      '#059669',
    OVERDUE:   '#DC2626',
    CANCELLED: '#6B7280',
  };
  const statusBg: Record<string, string> = {
    DRAFT:     '#F9FAFB',
    PENDING:   '#FFFBEB',
    PAID:      '#F0FDF4',
    OVERDUE:   '#FFF1F2',
    CANCELLED: '#F9FAFB',
  };

  // Akaunting workflow steps
  const workflowSteps = [
    {
      id: 'create',
      label: 'Create',
      icon: <Receipt size={15} />,
      summary: `${inv.customer || '—'} created this invoice on ${inv.date ? new Date(inv.date).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}`,
      done: true,
    },
    {
      id: 'send',
      label: 'Send',
      icon: <Send size={15} />,
      summary: inv.status === 'DRAFT' ? 'Not yet sent' : `Last sent ${inv.sentAt ? new Date(inv.sentAt).toLocaleDateString('en-ET') : 'N/A'}`,
      done: inv.status !== 'DRAFT',
      actions: inv.status === 'DRAFT' ? (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button type="button" onClick={() => { onSend(inv.id); onClose(); }} className="aki-btn aki-btn-primary sm"><Send size={12} /> Send Email</button>
          <button type="button" onClick={() => onStatusChange(inv.id, 'PENDING')} className="aki-btn aki-btn-secondary sm">Mark as Sent</button>
          <button type="button" onClick={handleCopyShareLink} className={`aki-btn sm ${copiedShare ? 'aki-btn-soft-blue' : 'aki-btn-secondary'}`}><Link2 size={12} /> {copiedShare ? 'Copied!' : 'Share Link'}</button>
        </div>
      ) : null,
    },
    {
      id: 'paid',
      label: 'Get Paid',
      icon: <Banknote size={15} />,
      summary: inv.status === 'PAID'
        ? `Amount paid: ${fmt(Number(inv.totalAmount))}`
        : `Amount due: ${fmt(remaining)}`,
      done: inv.status === 'PAID',
      actions: inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'DRAFT' ? (
        <div className="space-y-3 mt-3">
          {/* Quick pay inline */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: 'var(--text-4)' }}>{currency}</span>
              <input
                type="number"
                step="any"
                placeholder={remaining.toFixed(2)}
                className="aki-input pl-10"
                value={quickPayAmount}
                onChange={e => setQuickPayAmount(e.target.value)}
              />
            </div>
            <button type="button" onClick={handleQuickPay} disabled={quickPaySaving || !quickPayAmount} className="aki-btn aki-btn-success sm shrink-0">
              {quickPaySaving ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Record
            </button>
          </div>
          <button type="button" onClick={() => onRecordPayment(inv)} className="aki-btn aki-btn-secondary sm w-full justify-center"><Banknote size={12} /> Full Payment Options</button>
        </div>
      ) : null,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)' }} onClick={onClose} />

      {/* Full-width invoice detail panel */}
      <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>

        {/* ── TOP BAR ────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-5 gap-3" style={{ height: 52, borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          {/* Left: invoice title + status */}
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={onClose} className="aki-btn aki-btn-ghost xs icon-only shrink-0" aria-label="Close">
              <X size={15} />
            </button>
            <div className="w-px h-5 shrink-0" style={{ background: 'var(--border)' }} />
            <h1 className="text-[15px] font-bold tracking-tight truncate" style={{ color: 'var(--text)' }}>
              Invoice: {inv.invoiceNumber}
            </h1>
            <span className="aki-badge sm shrink-0" style={{
              background: statusBg[inv.status] ?? 'var(--surface-alt)',
              color: statusColor[inv.status] ?? 'var(--text-3)',
              border: `1px solid ${statusColor[inv.status] ?? 'var(--border)'}22`,
            }}>{inv.status}</span>
            {inv.isRecurring && <span className="aki-badge sm solid-violet shrink-0"><Repeat2 size={9} /> {inv.recurringInterval}</span>}
          </div>
          {/* Right: actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => onEdit(inv)} className="aki-btn aki-btn-secondary sm"><Edit2 size={13} /> Edit</button>
            <button type="button" onClick={() => onPrint(inv)} className="aki-btn aki-btn-secondary sm"><Printer size={13} /><span className="hidden sm:inline">Print</span></button>
            <button type="button" onClick={handleExportERCA} className="aki-btn aki-btn-secondary sm hidden md:inline-flex"><ShieldCheck size={13} /><span className="hidden lg:inline">ERCA Export</span></button>
            <button type="button" onClick={() => onDuplicate(inv.id)} className="aki-btn aki-btn-secondary sm hidden lg:inline-flex"><Repeat2 size={13} />Duplicate</button>
            <div className="w-px h-5 mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />
            {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
              <button type="button" onClick={() => onRecordPayment(inv)} className="aki-btn aki-btn-primary sm"><Banknote size={13} /> Record Payment</button>
            )}
          </div>
        </div>

        {/* ── BODY: workflow left + document right ─────────────────── */}
        <div className="flex-1 overflow-hidden flex" style={{ background: '#F8FAFC' }}>

          {/* ── LEFT: Workflow Steps (Akaunting-style) ──────────────── */}
          <div className="w-full max-w-sm shrink-0 flex flex-col overflow-y-auto" style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>

            {/* Draft notice banner */}
            {inv.status === 'DRAFT' && (
              <div className="mx-4 mt-4 px-4 py-3 rounded-lg text-[12px] font-semibold" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                This is a <strong>DRAFT</strong> invoice and will be reflected to charts after it gets sent.
              </div>
            )}
            {inv.status === 'OVERDUE' && (
              <div className="mx-4 mt-4 px-4 py-3 rounded-lg flex items-center gap-2.5 text-[12px] font-semibold" style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#9F1239' }}>
                <AlertTriangle size={14} className="shrink-0" />
                <span>{agingDays && agingDays > 0 ? `${agingDays} days overdue` : 'Overdue'} — follow up with {inv.customer}.</span>
              </div>
            )}

            {/* Workflow steps */}
            <div className="px-4 py-4 space-y-1">
              {workflowSteps.map((step, idx) => (
                <WorkflowStep key={step.id} step={step} isLast={idx === workflowSteps.length - 1} />
              ))}
            </div>

            {/* Payment history */}
            {(inv.payments ?? []).length > 0 && (
              <div className="px-4 pb-4">
                <p className="ovds-label mb-2">Payment History</p>
                <div className="space-y-1.5">
                  {(inv.payments as any[]).map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-alt)' }}>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{fmt(Number(p.amount))}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-ET') : '—'} · {p.method ?? 'Manual'}</p>
                      </div>
                      <span className="aki-badge sm solid-success">Paid</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity log */}
            {activityLog.length > 0 && (
              <div className="px-4 pb-4">
                <p className="ovds-label mb-2">Activity</p>
                <div className="space-y-1.5">
                  {activityLog.slice(0, 5).map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--aki-blue)' }} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium" style={{ color: 'var(--text-2)' }}>{a.action ?? a.description ?? 'Activity'}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>{a.createdAt ? fmtRelativeTime(new Date(a.createdAt)) : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EIMS / MoR registration */}
            <EimsInvoicePanel invoice={inv} onRefresh={onRefresh} />

            {/* Secondary actions */}
            <div className="px-4 pb-6 space-y-2">
              <div className="w-full h-px" style={{ background: 'var(--border-alt)' }} />
              <p className="ovds-label pt-1">More Actions</p>
              <div className="flex flex-wrap gap-1.5">
                {inv.status === 'PAID' && (
                  <>
                    <button type="button" onClick={() => onCreditNote(inv.id)} className="aki-btn aki-btn-secondary xs"><Tag size={11} /> Credit Note</button>
                    {onDebitNote && inv.eimsIrn && (
                      <button
                        type="button"
                        onClick={() => {
                          const amt = prompt('Debit note amount (ETB):', String(inv.totalAmount));
                          if (amt && Number(amt) > 0) onDebitNote(inv.id, Number(amt));
                        }}
                        className="aki-btn aki-btn-secondary xs"
                      >
                        <Tag size={11} /> Debit Note (DBN)
                      </button>
                    )}
                  </>
                )}
                <button type="button" onClick={handleSendReminder} disabled={sendingReminder} className="aki-btn aki-btn-secondary xs">
                  <Bell size={11} /> {sendingReminder ? 'Sending…' : 'Send Reminder'}
                </button>
                <button type="button" onClick={handleCopyShareLink} className={`aki-btn xs ${copiedShare ? 'aki-btn-soft-blue' : 'aki-btn-secondary'}`}><Link2 size={11} /> {copiedShare ? 'Copied!' : 'Share'}</button>
                {['PENDING','OVERDUE'].includes(inv.status) && (
                  <button type="button" onClick={() => onStatusChange(inv.id, 'CANCELLED')} className="aki-btn aki-btn-secondary xs"><X size={11} /> Void</button>
                )}
                <button type="button" onClick={copyReminder} className="aki-btn aki-btn-secondary xs"><StickyNote size={11} /> Copy Reminder</button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Invoice Document Preview (Akaunting paper style) ─ */}
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Paper card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                {/* Document header: company + label */}
                <div className="px-8 py-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <div className="flex items-start justify-between">
                    {/* Company logo/name */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-black" style={{ background: 'var(--aki-blue)', color: '#fff' }}>
                        {inv.companyName?.[0]?.toUpperCase() ?? 'O'}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold" style={{ color: '#111827' }}>{inv.companyName ?? 'OVDS'}</p>
                        {inv.companyAddress && <p className="text-[11px] mt-0.5" style={{ color: '#6B7280' }}>{inv.companyAddress}</p>}
                        {inv.companyTin && <p className="text-[11px]" style={{ color: '#6B7280' }}>TIN: {inv.companyTin}</p>}
                      </div>
                    </div>
                    {/* Invoice label + status */}
                    <div className="text-right">
                      <p className="text-[20px] font-black tracking-tight" style={{ color: '#111827' }}>Invoice</p>
                      <p className="text-[12px] font-mono mt-1" style={{ color: statusColor[inv.status] ?? '#6B7280' }}>{inv.invoiceNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Bill To + Invoice meta */}
                <div className="grid grid-cols-2 px-8 py-5 gap-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {/* Bill To */}
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Bill To</p>
                    <p className="text-[14px] font-bold" style={{ color: '#111827' }}>{inv.customer}</p>
                    {inv.customerAddress && <p className="text-[12px] mt-1" style={{ color: '#4B5563' }}>{inv.customerAddress}</p>}
                    {inv.customerPhone && <p className="text-[12px] mt-0.5" style={{ color: '#4B5563' }}>{inv.customerPhone}</p>}
                    {inv.customerEmail && <p className="text-[12px] mt-0.5" style={{ color: '#6B7280' }}>{inv.customerEmail}</p>}
                    {inv.customerTin && <p className="text-[11px] font-mono mt-1" style={{ color: '#9CA3AF' }}>TIN: {inv.customerTin}</p>}
                  </div>
                  {/* Invoice meta */}
                  <div className="space-y-2">
                    {[
                      { label: 'Invoice Number', value: inv.invoiceNumber },
                      { label: 'Order Number',   value: inv.orderNumber || '—' },
                      { label: 'Invoice Date',   value: inv.date ? new Date(inv.date).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                      { label: 'Due Date',       value: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                    ].map(row => (
                      <div key={row.label} className="flex items-baseline justify-between gap-4">
                        <span className="text-[12px] font-semibold" style={{ color: '#374151' }}>{row.label}:</span>
                        <span className="text-[12px] font-bold text-right" style={{ color: '#111827' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items table */}
                <div>
                  {/* Table header */}
                  <div className="grid px-8 py-3" style={{ gridTemplateColumns: '1fr 80px 100px 100px', background: '#3730A3', borderBottom: '1px solid #3730A3' }}>
                    {['Items', 'Quantity', 'Price', 'Amount'].map(h => (
                      <span key={h} className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#fff', textAlign: h !== 'Items' ? 'right' : 'left' }}>{h}</span>
                    ))}
                  </div>
                  {/* Rows */}
                  {(inv.items ?? []).length > 0 ? (
                    (inv.items as any[]).map((item: any, i: number) => {
                      const lineTotal = Number(item.price ?? 0) * Number(item.quantity ?? 1);
                      return (
                        <div key={i} className="grid px-8 py-3" style={{ gridTemplateColumns: '1fr 80px 100px 100px', borderBottom: '1px solid #F3F4F6' }}>
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: '#111827' }}>{item.customName || item.name || item.itemId || `Item ${i + 1}`}</p>
                            {item.description && <p className="text-[11px] mt-0.5" style={{ color: '#6B7280' }}>{item.description}</p>}
                          </div>
                          <p className="text-[13px] text-right tabular-nums" style={{ color: '#374151' }}>{Number(item.quantity ?? 1)}</p>
                          <p className="text-[13px] text-right tabular-nums" style={{ color: '#374151' }}>${Number(item.price ?? 0).toFixed(2)}</p>
                          <p className="text-[13px] font-semibold text-right tabular-nums" style={{ color: '#111827' }}>${lineTotal.toFixed(2)}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-8 py-6 text-center">
                      <p className="text-[12px]" style={{ color: '#9CA3AF' }}>No line items</p>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="px-8 py-4 flex justify-end" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <div className="w-56 space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span style={{ color: '#6B7280' }}>Subtotal</span>
                      <span className="font-semibold tabular-nums" style={{ color: '#111827' }}>{fmt(subtotal)}</span>
                    </div>
                    {vatAmt > 0 && (
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: '#6B7280' }}>VAT (15%)</span>
                        <span className="font-semibold tabular-nums" style={{ color: '#111827' }}>{fmt(vatAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px]">
                      <span style={{ color: '#6B7280' }}>DRRF (1%)</span>
                      <span className="font-semibold tabular-nums" style={{ color: '#111827' }}>{fmt(drrfAmt)}</span>
                    </div>
                    <div className="flex justify-between pt-2" style={{ borderTop: '2px solid #E5E7EB' }}>
                      <span className="text-[14px] font-bold" style={{ color: '#111827' }}>Total</span>
                      <span className="text-[18px] font-black tabular-nums" style={{ color: '#1D4ED8', letterSpacing: '-0.02em' }}>{fmt(Number(inv.totalAmount))}</span>
                    </div>
                    {remaining > 0 && remaining < Number(inv.totalAmount) && (
                      <div className="flex justify-between text-[12px]">
                        <span style={{ color: '#D97706' }}>Amount Due</span>
                        <span className="font-bold tabular-nums" style={{ color: '#D97706' }}>{fmt(remaining)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes + footer */}
                {(inv.customerNotes || inv.footer) && (
                  <div className="px-8 py-4 space-y-3" style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                    {inv.customerNotes && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Notes</p>
                        <p className="text-[12px]" style={{ color: '#4B5563' }}>{inv.customerNotes}</p>
                      </div>
                    )}
                    {inv.footer && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Footer</p>
                        <p className="text-[12px]" style={{ color: '#4B5563' }}>{inv.footer}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* EIMS / NBE QR strip */}
                {inv.invoiceNumber && Number(inv.totalAmount) > 0 && (
                  <div className="px-8 py-3 flex items-center gap-4" style={{ borderTop: '1px solid #E5E7EB', background: isEimsQr ? '#F0FDFA' : '#F5F3FF' }}>
                    <img
                       src={`${QR_CODE_SERVICE_URL}?size=56x56&data=${encodeURIComponent(qrData)}`}
                      alt={isEimsQr ? 'EIMS signed QR' : 'NBE-IQR QR'}
                      className="rounded shrink-0"
                      style={{ width: 44, height: 44, border: `1.5px solid ${isEimsQr ? '#99F6E4' : '#DDD6FE'}` }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div>
                      {isEimsQr ? (
                        <>
                          <p className="text-[11px] font-bold" style={{ color: '#0F766E' }}>EIMS Signed QR · MoR Registered</p>
                          {inv.eimsIrn && (
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#115E59' }}>IRN: {inv.eimsIrn.slice(0, 24)}…</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-[11px] font-bold" style={{ color: '#6D28D9' }}>NBE-IQR Payment QR · ERCA Compliant</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#7C3AED' }}>Regulation 570/2025 · Proclamation No. 1341/2024</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>{/* end paper card */}
            </div>
          </div>

        </div>{/* end body */}
      </div>{/* end panel */}

      {/* Capture modal */}
      {showCapture && (
        <InvoiceCaptureModal
          invoice={inv}
          onClose={() => setShowCapture(false)}
          onApply={handleCaptureApply}
        />
      )}
    </>
  );
};

// ── Workflow Step sub-component ─────────────────────────────────────────────
const WorkflowStep: React.FC<{ step: any; isLast: boolean }> = ({ step, isLast }) => {
  const [open, setOpen] = useState(!step.done || step.actions);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
        style={{ background: open ? 'var(--surface-alt)' : 'transparent' }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--surface-alt)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {/* Circle indicator */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: step.done ? '#D1FAE5' : 'var(--surface-alt)',
              border: `2px solid ${step.done ? '#10B981' : 'var(--border)'}`,
              color: step.done ? '#059669' : 'var(--text-4)',
            }}
          >
            {step.done ? <CheckCircle2 size={14} style={{ color: '#059669' }} /> : step.icon}
          </div>
          {!isLast && <div className="w-0.5 h-4 mt-1" style={{ background: step.done ? '#A7F3D0' : 'var(--border-alt)' }} />}
        </div>
        {/* Label + summary */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{step.label}</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>{step.summary}</p>
        </div>
        {/* Chevron */}
        <ChevronDown
          size={14}
          style={{ color: 'var(--text-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', flexShrink: 0 }}
        />
      </button>
      {/* Expanded content */}
      {open && step.actions && (
        <div className="px-4 pb-3">
          {step.actions}
        </div>
      )}
    </div>
  );
};

export default InvoiceDrawer;
