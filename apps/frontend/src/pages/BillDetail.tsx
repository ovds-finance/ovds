import {
  ArrowLeft, Edit2, Trash2, CheckCircle2, Clock,
  AlertTriangle, Download, Copy, Archive,
  Plus, X, Building2, Calendar, FileText,
  CreditCard, TrendingDown, Wallet, Info,
  ChevronRight, Receipt, Split, History,
  ArrowUpRight, AlertCircle,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useBusiness } from '../context/businessContext';
import { useAuditLog } from '../hooks';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';
import { fmtCurrency, fmtDate } from '../utils/fmt';

const fmt = (n: number, ccy = 'ETB') => fmtCurrency(n, ccy);

const _CATEGORIES = [
  'UTILITIES', 'RENT', 'SUPPLIES', 'MAINTENANCE',
  'TRANSPORT', 'PROFESSIONAL_FEES', 'INSURANCE',
  'ADVERTISING', 'REPAIRS', 'SALARIES',
  'RECRUITMENT_AGENCY_FEE',
  'OTHER',
];

const CATEGORY_COLORS: Record<string, string> = {
  UTILITIES:              'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  RENT:                   'bg-violet-100 text-violet-700',
  SUPPLIES:               'bg-amber-100 text-amber-700',
  MAINTENANCE:            'bg-orange-100 text-orange-700',
  TRANSPORT:              'bg-teal-100 text-teal-700',
  PROFESSIONAL_FEES:      'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  INSURANCE:              'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
  ADVERTISING:            'bg-pink-100 text-pink-700',
  REPAIRS:                'bg-rose-100 text-rose-700',
  SALARIES:               'bg-cyan-100 text-cyan-700',
  RECRUITMENT_AGENCY_FEE: 'bg-purple-100 text-purple-700',
  OTHER:                  'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]',
};

const STATUS_BADGE: Record<string, string> = {
  PAID:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)]',
  OVERDUE: 'bg-rose-50 text-rose-700 border border-rose-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  DRAFT:   'bg-[var(--pro-azure-50)]/50 text-[var(--pro-azure)] border border-[var(--pro-azure-100)]',
  PARTIAL: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)]',
  CANCELLED: 'bg-slate-50 text-slate-500 border border-slate-200',
};

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'MOBILE_MONEY', 'OTHER'];

const BillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const { log } = useAuditLog();
  const canWrite = can('bills:write');
  const canDelete = can('bills:delete');

  const [bill, setBill] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPayment, setSavingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().slice(0, 10),
  });

  const _billsUrl = selectedCompanyId
    ? `/ovds/bills?companyId=${selectedCompanyId}`
    : '/ovds/bills';

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [billRes, payRes] = await Promise.all([
        api.get(`/ovds/bills/${id}`),
        api.get(`/ovds/bills/${id}/payments`),
      ]);
      setBill(billRes.data?.data ?? billRes.data ?? null);
      setPayments(payRes.data?.data ?? payRes.data?.payments ?? []);
    } catch {
      toast.error('Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [id]);

  const totalPaid = useMemo(
    () => payments.reduce((s, p) => s + Number(p.amount), 0),
    [payments],
  );
  const remaining = useMemo(
    () => Math.max(0, Number(bill?.total ?? 0) - totalPaid),
    [bill, totalPaid],
  );
  const isOverdue = useMemo(
    () => bill?.status === 'OVERDUE' || (bill?.status !== 'PAID' && bill?.dueDate && new Date(bill.dueDate) < new Date()),
    [bill],
  );

  const handleMarkPaid = async () => {
    if (!bill) return;
    try {
      await api.patch(`/ovds/bills/${bill.id}`, { status: 'PAID' });
      toast.success('Marked as paid');
      log('BILL_MARKED_PAID', { id: bill.id }, 'Bills');
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill || !paymentForm.amount) return;
    setSavingPayment(true);
    try {
      await api.post(`/ovds/bills/${bill.id}/payments`, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
        paidAt: paymentForm.paidAt ? new Date(paymentForm.paidAt).toISOString() : undefined,
      });
      toast.success('Payment recorded');
      log('BILL_PAYMENT_RECORDED', { id: bill.id, amount: paymentForm.amount }, 'Bills');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        method: 'CASH',
        reference: '',
        notes: '',
        paidAt: new Date().toISOString().slice(0, 10),
      });
      fetchData();
    } catch {
      toast.error('Failed to record payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!(await confirm({ title: 'Delete this payment?', variant: 'danger' }))) return;
    try {
      await api.delete(`/ovds/bills/${bill.id}/payments/${paymentId}`);
      toast.success('Payment deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const handleDeleteBill = async () => {
    if (!(await confirm({ title: 'Delete this bill?', variant: 'danger' }))) return;
    try {
      await api.delete(`/ovds/bills/${bill.id}`);
      toast.success('Bill deleted');
      navigate('/purchases/bills');
    } catch {
      toast.error('Failed to delete bill');
    }
  };

  const handleDuplicate = async () => {
    try {
      await api.post(`/ovds/bills/${bill.id}/duplicate`);
      toast.success('Bill duplicated');
      navigate('/purchases/bills');
    } catch {
      toast.error('Failed to duplicate bill');
    }
  };

  const handleArchive = async () => {
    try {
      await api.post(`/ovds/bills/${bill.id}/archive`);
      toast.success('Bill archived');
      fetchData();
    } catch {
      toast.error('Failed to archive bill');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <AlertCircle size={32} className="text-slate-300" />
        <p className="text-sm text-slate-500">Bill not found</p>
        <Link to="/purchases/bills" className="text-[var(--pro-azure)] text-sm font-semibold hover:underline">Back to Bills</Link>
      </div>
    );
  }

  const isAgencyBill = bill.category === 'RECRUITMENT_AGENCY_FEE';
  const guaranteeActive = isAgencyBill && bill.placementDate && bill.guaranteePeriodDays > 0 && (() => {
    const expires = new Date(new Date(bill.placementDate).getTime() + bill.guaranteePeriodDays * 86400000);
    return new Date() <= expires;
  })();
  const guaranteeDaysLeft = isAgencyBill && bill.placementDate && bill.guaranteePeriodDays > 0
    ? Math.max(0, Math.ceil((new Date(bill.placementDate).getTime() + bill.guaranteePeriodDays * 86400000 - Date.now()) / 86400000))
    : null;

  const lineItems = bill.billItem ?? [];

  return (
    <div className="min-h-full bg-white animate-in fade-in duration-300">
      {/* -- Header -- */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/purchases/bills')} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 font-mono">#{bill.billNumber}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[bill.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {bill.status}
                </span>
                {isAgencyBill && guaranteeDaysLeft !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    guaranteeActive ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-white text-slate-400 border border-slate-100'
                  }`}>
                    {guaranteeActive ? `⏱ Guarantee: ${guaranteeDaysLeft}d left` : '✓ Guarantee expired'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {bill.vendorName || 'Unknown Vendor'} · {fmtDate(bill.date)} · Due {fmtDate(bill.dueDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canWrite && bill.status !== 'PAID' && (
              <button onClick={handleMarkPaid} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-xs font-bold transition-colors">
                <CheckCircle2 size={13} /> Mark Paid
              </button>
            )}
            {canWrite && remaining > 0 && (
              <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-xs font-bold transition-colors">
                <CreditCard size={13} /> Record Payment
              </button>
            )}
            {canWrite && (
              <Link to={`/purchases/bills`} state={{ editBill: bill.id }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors" title="Edit">
                <Edit2 size={16} />
              </Link>
            )}
            <button onClick={handleDuplicate} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors" title="Duplicate">
              <Copy size={16} />
            </button>
            <button onClick={handleArchive} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors" title="Archive">
              <Archive size={16} />
            </button>
            {canDelete && (
              <button onClick={handleDeleteBill} className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* -- Summary Cards -- */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
            <p className="text-xl font-bold text-slate-800 font-mono mt-1">{fmt(Number(bill.total))}</p>
            {bill.currencyCode !== 'ETB' && (
              <p className="text-[10px] text-slate-400 mt-0.5">Rate: {bill.currencyRate} {bill.currencyCode}/ETB</p>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid</p>
            <p className="text-xl font-bold text-[var(--pro-azure-dark)] font-mono mt-1">{fmt(totalPaid)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{payments.length} payment(s)</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance Due</p>
            <p className={`text-xl font-bold font-mono mt-1 ${remaining > 0 ? 'text-amber-700' : 'text-[var(--pro-azure-dark)]'}`}>
              {fmt(remaining)}
            </p>
            {remaining <= 0 && <p className="text-[10px] text-[var(--pro-azure)] mt-0.5">Fully paid</p>}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
            <p className={`text-xl font-bold font-mono mt-1 ${isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>
              {fmtDate(bill.dueDate)}
            </p>
            {isOverdue && <p className="text-[10px] text-rose-500 mt-0.5">Overdue</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* -- Left Column: Details + Line Items -- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor Info */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={12} /> Vendor Information
                </h2>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800">{bill.vendorName || '—'}</h3>
                    {bill.vendorTin && <p className="text-xs text-slate-500 mt-0.5">TIN: {bill.vendorTin}</p>}
                    {bill.vendorFsNo && <p className="text-xs text-slate-500">FS No: {bill.vendorFsNo}</p>}
                    {bill.vendorVatRegNo && <p className="text-xs text-slate-500">VAT Reg: {bill.vendorVatRegNo}</p>}
                    {bill.hsCode && <p className="text-xs text-slate-500">HS Code: {bill.hsCode}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${CATEGORY_COLORS[bill.category] ?? 'bg-slate-100 text-slate-500'}`}>
                        {bill.category?.replace(/_/g, ' ')}
                      </span>
                      {bill.whtApplicable && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          WHT Applicable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Line Items ({lineItems.length})
                </h2>
              </div>
              {lineItems.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400">No line items recorded for this bill.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Qty</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">VAT</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lineItems.map((item: any, idx: number) => (
                        <tr key={item.id ?? idx} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3">
                            <p className="text-xs font-semibold text-slate-700">{item.description || `Item ${idx + 1}`}</p>
                            {item.itemId && <p className="text-[10px] text-slate-400">ID: {item.itemId.slice(0, 8)}</p>}
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-slate-600">{item.quantity}</td>
                          <td className="px-5 py-3 text-right text-xs text-slate-600 font-mono">{fmt(Number(item.purchasePrice ?? item.unitPrice ?? 0))}</td>
                          <td className="px-5 py-3 text-right text-xs text-slate-600 font-mono">{fmt(Number(item.vatAmount ?? 0))}</td>
                          <td className="px-5 py-3 text-right text-xs font-bold text-slate-800 font-mono">{fmt(Number(item.totalAmount ?? 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={12} /> Payments ({payments.length})
                </h2>
                {canWrite && remaining > 0 && (
                  <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[10px] font-bold transition-colors">
                    <Plus size={11} /> Record Payment
                  </button>
                )}
              </div>
              {payments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400">No payments recorded yet.</p>
                  {canWrite && remaining > 0 && (
                    <button onClick={() => setShowPaymentModal(true)} className="mt-3 text-xs text-violet-600 font-semibold hover:underline">
                      Record first payment
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference</th>
                        <th className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3 text-xs text-slate-600">{fmtDate(p.paidAt)}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                              {p.method}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-xs font-bold text-slate-800 font-mono">
                            {fmt(Number(p.amount), p.currencyCode)}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">{p.reference || '—'}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* -- Right Column: Summary -- */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Wallet size={12} /> Financial Summary
                </h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-700 font-mono">{fmt(Number(bill.amount))}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-violet-600">VAT ({bill.vatRate ?? 15}%)</span>
                  <span className="font-semibold text-violet-600 font-mono">{fmt(Number(bill.vatAmount))}</span>
                </div>
                {bill.whtApplicable && Number(bill.whtAmount) > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-600">WHT</span>
                    <span className="font-semibold text-amber-600 font-mono">- {fmt(Number(bill.whtAmount))}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800">Total</span>
                  <span className="font-bold text-slate-900 font-mono">{fmt(Number(bill.total))}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--pro-azure)]">Paid</span>
                  <span className="font-semibold text-[var(--pro-azure)] font-mono">{fmt(totalPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600">Balance Due</span>
                  <span className={`font-bold font-mono ${remaining > 0 ? 'text-amber-700' : 'text-[var(--pro-azure-dark)]'}`}>{fmt(remaining)}</span>
                </div>
                {bill.currencyCode !== 'ETB' && (
                  <div className="bg-[var(--pro-azure-50)] border border-[var(--pro-azure-50)] rounded-xl p-3 mt-2">
                    <p className="text-[10px] font-bold text-[var(--pro-azure-dark)] uppercase tracking-wide">Multi-Currency</p>
                    <p className="text-xs text-[var(--pro-azure)] mt-1">Original: {bill.currencyCode} {fmt(Number(bill.total), bill.currencyCode)}</p>
                    <p className="text-xs text-[var(--pro-azure)]">Rate: {bill.currencyRate} {bill.currencyCode} = 1 ETB</p>
                    <p className="text-xs text-[var(--pro-azure)]">Converted: ETB {fmt(Number(bill.total))}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Dates
                </h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Bill Date</span>
                  <span className="font-semibold text-slate-700">{fmtDate(bill.date)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Due Date</span>
                  <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>{fmtDate(bill.dueDate)}</span>
                </div>
                {bill.createdAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Created</span>
                    <span className="font-semibold text-slate-700">{fmtDate(bill.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {bill.notes && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Notes</h2>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-600 leading-relaxed">{bill.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -- Record Payment Modal -- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-violet-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
                  <CreditCard size={14} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Record Payment</p>
                  <p className="text-[10px] text-slate-400">Balance due: {fmt(remaining)}</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Amount <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={remaining}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Method</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                  value={paymentForm.method}
                  onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))}
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Reference</label>
                <input
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                  placeholder="e.g. TXN-12345, CHEQUE-001"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                  value={paymentForm.paidAt}
                  onChange={e => setPaymentForm(p => ({ ...p, paidAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all resize-none"
                  rows={2}
                  placeholder="Optional notes..."
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-700">
                <Info size={12} className="shrink-0" />
                <span>A GL journal entry will be auto-posted for this payment.</span>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingPayment}
                  className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {savingPayment ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><CreditCard size={13} /> Record Payment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillDetail;
