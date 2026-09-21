import { Pagination, usePagination } from '@ovds/ui';
import { calcWHT, evalMath } from '@ovds/ui';
import {
  Plus, Trash2, Edit2, CheckCircle2, Clock,
  AlertTriangle, Calendar, Download,
  X, Eye, Building2,
  Receipt,
  CreditCard, Repeat, Split, UserPlus, History,
  Search, ChevronRight, FileText, LayoutGrid, List,
  TrendingDown, Landmark, Info, Wallet, ArrowUpRight, AlertCircle,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { OvdsPageHeader, OvdsStatsStrip, OvdsToolbar, OvdsEmptyState } from '../components/ovds';
import {
  PipelineStageHeader,
  PipelineBadge,
} from '../components/pipelineComponents';
import { Icon } from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useSearch, useAuditLog, useApiQuery, usePageTitle } from '../hooks';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { useWarehouses } from '../services/inventoryApi';
import { useCreateDebitNote } from '../services/missingFeaturesApi';
import { confirm } from '../utils/confirm';
import { downloadCSV } from '../utils/download';
import { calcLineTax } from '../utils/ethiopianTax';
import { fmtCurrency, fmtDate } from '../utils/fmt';


const BILL_STATUS_TABS = ['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const;
type BillStatusTab = typeof BILL_STATUS_TABS[number];

const CATEGORIES = [
  'UTILITIES', 'RENT', 'SUPPLIES', 'MAINTENANCE',
  'TRANSPORT', 'PROFESSIONAL_FEES', 'INSURANCE',
  'ADVERTISING', 'REPAIRS', 'SALARIES',
  'RECRUITMENT_AGENCY_FEE', // Workflow A — agency placement invoice
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

const _STATUS_BADGE: Record<string, string> = {
  PAID:    'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border border-[var(--pro-azure-100)]',
  OVERDUE: 'bg-rose-50 text-rose-700 border border-rose-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  DRAFT:   'bg-[var(--pro-azure-50)]/50 text-[var(--pro-azure)] border border-[var(--pro-azure-100)]',
};

const fmt = (n: number) => fmtCurrency(n, 'ETB');

// -- Design tokens -------------------------------------------------------------
const inp = 'w-full px-3 py-2.5 bg-white border border-[var(--pro-azure-100)] rounded-lg text-sm text-[var(--pro-azure-dark)] outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all placeholder:text-green-300';
const lbl = 'block text-[11px] font-semibold text-[var(--pro-azure-dark)] uppercase tracking-wide mb-1';

// -- BillFormModal — defined OUTSIDE Bills to avoid React remount on every render --
interface BillFormModalProps {
  onClose: () => void;
  editingBill: any;
  billForm: any;
  setBillForm: React.Dispatch<React.SetStateAction<any>>;
  saving: boolean;
  vendors: any[];
  warehouses: any[];
  handleSaveBill: (e: React.FormEvent) => void;
  calcTotal: (form: any) => string;
}

const BillFormModal: React.FC<BillFormModalProps> = ({
  onClose, editingBill, billForm, setBillForm, saving, vendors, warehouses, handleSaveBill, calcTotal,
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-[var(--pro-azure-100)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--pro-azure-100)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-50 rounded-xl flex items-center justify-center">
            <Icon name="RECEIPT" size={15} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--pro-azure-dark)]">
              {editingBill ? 'Edit Bill' : 'New Bill'}
            </p>
            <p className="text-[10px] text-[var(--pro-azure)]">Accounts Payable · WHT 3% auto-calculated</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--pro-azure-50)] text-[var(--pro-azure)] transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSaveBill} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Bill number + date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Bill Number</label>
            <input className={inp} value={billForm.billNumber} onChange={e => setBillForm((p: any) => ({ ...p, billNumber: e.target.value }))} placeholder="BILL-001" />
          </div>
          <div>
            <label className={lbl}>Date *</label>
            <input type="date" className={inp} value={billForm.date} onChange={e => setBillForm((p: any) => ({ ...p, date: e.target.value }))} required />
          </div>
        </div>

        {/* Vendor */}
        <div>
          <label className={lbl}>Vendor / Supplier *</label>
          {vendors.length > 0 ? (
            <select className={inp} value={billForm.vendor} onChange={e => {
              const v = vendors.find((vv: any) => vv.name === e.target.value);
              setBillForm((p: any) => ({ ...p, vendor: e.target.value, vendorTin: v?.tin ?? p.vendorTin }));
            }} required>
              <option value="">Select vendor…</option>
              {vendors.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          ) : (
            <input className={inp} value={billForm.vendor} onChange={e => setBillForm((p: any) => ({ ...p, vendor: e.target.value }))} placeholder="Vendor name" required />
          )}
        </div>

        {/* Vendor TIN + Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Vendor TIN</label>
            <input className={inp} value={billForm.vendorTin} onChange={e => setBillForm((p: any) => ({ ...p, vendorTin: e.target.value }))} placeholder="15-digit TIN" maxLength={15} />
          </div>
          <div>
            <label className={lbl}>Category</label>
            <select className={inp} value={billForm.category} onChange={e => setBillForm((p: any) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>

        {/* Warehouse */}
        <div>
          <label className={lbl}>Warehouse (Restock Into)</label>
          <select className={inp} value={billForm.warehouseId || ''} onChange={e => setBillForm((p: any) => ({ ...p, warehouseId: e.target.value }))}>
            <option value="">Select warehouse…</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className={lbl}>Description</label>
          <textarea className={inp + ' resize-none'} rows={2} value={billForm.description} onChange={e => setBillForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Bill description or reference…" />
        </div>

        {/* Agency Placement fields — shown only when category is RECRUITMENT_AGENCY_FEE */}
        {billForm.category === 'RECRUITMENT_AGENCY_FEE' && (
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl space-y-3">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">
              Workflow A — Agency Placement (Guarantee Tracking)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Placement Date</label>
                <input type="date" className={inp} value={billForm.placementDate ?? ''} onChange={e => setBillForm((p: any) => ({ ...p, placementDate: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Guarantee Period (days)</label>
                <input type="number" min="0" max="365" className={inp} value={billForm.guaranteePeriodDays ?? ''} onChange={e => setBillForm((p: any) => ({ ...p, guaranteePeriodDays: parseInt(e.target.value) || null }))} placeholder="e.g. 60" />
              </div>
            </div>
            <div>
              <label className={lbl}>Linked Employee ID (hired candidate)</label>
              <input className={inp} value={billForm.linkedEmployeeId ?? ''} onChange={e => setBillForm((p: any) => ({ ...p, linkedEmployeeId: e.target.value }))} placeholder="EMP-001 — link after onboarding" />
            </div>
            {billForm.placementDate && billForm.guaranteePeriodDays > 0 && (() => {
              const placed = new Date(billForm.placementDate);
              const expires = new Date(placed.getTime() + billForm.guaranteePeriodDays * 86400000);
              const today = new Date();
              const inGuarantee = today <= expires;
              const daysLeft = Math.ceil((expires.getTime() - today.getTime()) / 86400000);
              return (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${inGuarantee ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-white text-slate-500 border border-slate-100'}`}>
                  {inGuarantee ? `⏱ Guarantee active — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining (expires ${expires.toLocaleDateString()})` : `✓ Guarantee period expired ${expires.toLocaleDateString()}`}
                </div>
              );
            })()}
          </div>
        )}

        {/* Amount + VAT */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Amount (ETB) *</label>
            <input type="number" min="0" step="0.01" className={inp} value={billForm.amount}
              onChange={e => setBillForm((p: any) => ({ ...p, amount: e.target.value, vatAmount: calcLineTax(parseFloat(e.target.value) || 0, 15).toFixed(2) }))}
              onBlur={e => { const v = evalMath(e.target.value); if (v !== null) setBillForm((p: any) => ({ ...p, amount: String(v), vatAmount: calcLineTax(v, 15).toFixed(2) })); }}
              placeholder="0.00" required />
          </div>
          <div>
            <label className={lbl}>VAT Amount (15%)</label>
            <input type="number" min="0" step="0.01" className={inp} value={billForm.vatAmount}
              onChange={e => setBillForm((p: any) => ({ ...p, vatAmount: e.target.value }))}
              placeholder="Auto-calculated" />
          </div>
        </div>

        {/* Due date + WHT */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Due Date</label>
            <input type="date" className={inp} value={billForm.dueDate} onChange={e => setBillForm((p: any) => ({ ...p, dueDate: e.target.value }))} />
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={billForm.whtApplicable} onChange={e => setBillForm((p: any) => ({ ...p, whtApplicable: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-[var(--pro-azure)] focus:ring-teal-400" />
              <span className="text-xs font-semibold text-[var(--pro-azure-dark)]">WHT Applicable (3%)</span>
            </label>
            <p className="text-[10px] text-[var(--pro-azure)] mt-1">Proclamation No. 1395/2025</p>
          </div>
        </div>

        {/* Total preview */}
        {billForm.amount && (
          <div className="bg-[var(--pro-azure-50)] rounded-xl p-4 border border-[var(--pro-azure-100)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--pro-azure)]">Subtotal</span>
              <span className="font-semibold text-[var(--pro-azure-dark)]">ETB {fmt(parseFloat(billForm.amount) || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-violet-600">VAT (15%)</span>
              <span className="font-semibold text-violet-600">ETB {fmt(calcLineTax(parseFloat(billForm.amount) || 0, 15))}</span>
            </div>
            {billForm.whtApplicable && parseFloat(billForm.amount) >= 10000 && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-amber-600 dark:text-amber-400">WHT (3%)</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">− ETB {fmt(calcWHT(parseFloat(billForm.amount) || 0, 'GOODS').whtAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold mt-2 pt-2 border-t border-[var(--pro-azure-100)]">
              <span className="text-[var(--pro-azure-dark)]">Total</span>
              <span className="text-[var(--pro-azure-dark)]">ETB {calcTotal(billForm)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] rounded-xl text-sm font-bold hover:bg-[var(--pro-azure-50)] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Receipt size={14} /> {editingBill ? 'Update Bill' : 'Create Bill'}</>}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// -- Stat Card -----------------------------------------------------------------
// -- Debit Note Modal ---------------------------------------------------------
interface DebitNoteModalProps {
  billId:           string;
  onClose:          () => void;
  onCreated:        () => void;
  createDebitNote:  (billId: string, dto: { reason: string; amount?: number }) => Promise<any>;
  saving:           boolean;
  /** Pre-filled reason — used for agency guarantee failures (Workflow A) */
  prefillReason?:   string;
}

const DebitNoteModal: React.FC<DebitNoteModalProps> = ({
  billId, onClose, onCreated, createDebitNote, saving, prefillReason,
}) => {
  const [reason, setReason]   = React.useState(prefillReason ?? '');
  const [amount, setAmount]   = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Reason is required'); return; }
    await createDebitNote(billId, {
      reason:  reason.trim(),
      ...(amount ? { amount: parseFloat(amount) } : {}),
    });
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-violet-100 dark:border-violet-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950/40 rounded-xl flex items-center justify-center">
              <TrendingDown size={14} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Create Debit Note</p>
              <p className="text-[10px] text-slate-400">AP credit — reduces amount owed to vendor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              Reason <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
              placeholder="e.g. Overcharge correction, return of defective goods…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5">
              Amount (ETB) <span className="text-slate-400 font-normal normal-case">— leave blank for full bill amount</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900 rounded-xl text-xs text-violet-700 dark:text-violet-300">
            <Info size={12} className="shrink-0" />
            <span>A GL journal will be auto-posted: Dr Accounts Payable / Cr Expense Account</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !reason.trim()}
              className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {saving
                ? <><Icon name="REFRESH" size={13} className="animate-spin" /> Creating…</>
                : <><TrendingDown size={13} /> Create Debit Note</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Root Component -----------------------------------------------------------
const Bills: React.FC = () => {
  usePageTitle('Bills');
  const navigate = useNavigate();
  const { warehouses } = useWarehouses();
  const { t } = useTranslation();
  const { can } = useAuth();
  const { log } = useAuditLog();
  const canWrite = can('bills:write');
  const canDelete = can('bills:delete');
  const { selectedCompanyId } = useBusiness();
  const { value: searchTerm, debouncedValue: debouncedSearch, setValue: setSearchTerm } = useSearch({ delay: 300, paramKey: 'q' });
  
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [_settings, setSettings] = useState<any>({});
  const [_selected, _setSelected] = useState<Set<string>>(new Set());
  const [debitNoteBillId, setDebitNoteBillId] = useState<string | null>(null);
  const [debitNoteBill, setDebitNoteBill] = useState<any>(null);
  const { trigger: createDebitNote, loading: creatingDN } = useCreateDebitNote();
  const [vendors, setVendors] = useState<any[]>([]);
  const [_items, _setItems] = useState<any[]>([]);
  
  const pagination = usePagination({ initialTake: 15 });
  const { page, take } = pagination;

  const billsUrl = selectedCompanyId
    ? `/ovds/bills?companyId=${selectedCompanyId}&take=${take}&page=${page}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}${debouncedSearch ? `&search=${debouncedSearch}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}`
    : '/ovds/bills';

  const {
    data: billsData,
    loading,
    refetch: fetchBills,
  } = useApiQuery<any>(billsUrl, {
    enabled: !!selectedCompanyId,
    pollInterval: 60_000,
    suppressToast: true,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bills: any[] = billsData?.data ?? [];
  const totalCount = billsData?.pagination?.total ?? bills.length;

  useEffect(() => {
    api.get('/settings', { headers: { 'x-background': '1' } } as any)
      .then((res: any) => setSettings(res.data.data || {}))
      .catch(() => {});
  }, []);

  const fetchVendors = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      const res = await api.get(`/ovds/vendors?companyId=${selectedCompanyId}`, { headers: { 'x-background': '1' } });
      const raw = res.data?.data ?? res.data;
      setVendors(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setVendors([]);
    }
  }, [selectedCompanyId]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const stats = useMemo(() => {
    if (!bills.length) return { total: 0, pending: 0, paid: 0, overdue: 0 };
    return {
      total: bills.reduce((s, b) => s + Number(b.total), 0),
      pending: bills.filter(b => b.status === 'PENDING').reduce((s, b) => s + Number(b.total), 0),
      paid: bills.filter(b => b.status === 'PAID').reduce((s, b) => s + Number(b.total), 0),
      overdue: bills.filter(b => b.status === 'OVERDUE').reduce((s, b) => s + Number(b.total), 0),
    };
  }, [bills]);

  const handleExport = () => {
    if (!bills.length) return;
    const headers = 'Bill #,Vendor,Date,Due Date,Status,Total\n';
    const rows = bills.map(b => `"${b.billNumber}","${b.vendor}","${b.date}","${b.dueDate}","${b.status}",${b.total}`).join('\n');
    downloadCSV(headers + rows, `bills_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Bills exported');
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return toast.error(t('msg.no_permission'));
    if (!(await confirm({ title: 'Delete Bill?', variant: 'danger' }))) return;
    try {
      await api.delete(`/ovds/bills/${id}`);
      fetchBills();
      toast.success('Bill deleted');
    } catch {
      toast.error('Failed to delete bill');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.patch(`/ovds/bills/${id}`, { status: 'PAID' });
      fetchBills();
      toast.success('Marked as paid');
    } catch {
      toast.error('Failed to update status');
    }
  };

  // -- Bill form state --------------------------------------------------------
  const blankBill = useCallback(() => ({
    billNumber: `BILL-${Date.now().toString().slice(-6)}`,
    vendor: '',
    vendorTin: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    category: 'OTHER',
    description: '',
    amount: '',
    vatAmount: '',
    total: '',
    whtApplicable: false,
    status: 'PENDING',
    companyId: selectedCompanyId,
  }), [selectedCompanyId]);

  const [billForm, setBillForm] = useState<any>(blankBill());
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setBillForm(blankBill()); setShowAddModal(true); };
  const openEdit = (bill: any) => {
    setBillForm({
      ...bill,
      date: bill.date?.slice(0, 10) ?? '',
      dueDate: bill.dueDate?.slice(0, 10) ?? '',
      amount: String(bill.amount ?? bill.subtotal ?? ''),
      vatAmount: String(bill.vatAmount ?? ''),
      total: String(bill.total ?? ''),
    });
    setEditingBill(bill);
    setShowEditModal(true);
  };

  const calcTotal = (form: any) => {
    const amt = parseFloat(form.amount) || 0;
    const vat = parseFloat(form.vatAmount) || calcLineTax(amt, 15);
    return (amt + vat).toFixed(2);
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return toast.error(t('msg.no_permission'));
    if (!billForm.vendor || !billForm.amount) return toast.error('Vendor and amount are required');
    setSaving(true);
    try {
      const payload = {
        ...billForm,
        amount: parseFloat(billForm.amount) || 0,
        vatAmount: parseFloat(billForm.vatAmount) || calcLineTax(parseFloat(billForm.amount) || 0, 15),
        total: parseFloat(calcTotal(billForm)),
        companyId: selectedCompanyId,
      };
      if (editingBill?.id) {
        await api.patch(`/ovds/bills/${editingBill.id}`, payload);
        toast.success('Bill updated');
        log('BILL_UPDATED', { id: editingBill.id }, 'Bills');
      } else {
        await api.post('/ovds/bills', payload);
        toast.success('Bill created');
        log('BILL_CREATED', { vendor: payload.vendor }, 'Bills');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingBill(null);
      fetchBills();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-white animate-in fade-in duration-300">
      {/* -- Page header -- */}
      <OvdsPageHeader
        title="Bills"
        subtitle="Manage supplier invoices and accounts payable · Supply Chain · Manufacturing & Logistics · Retail & E-commerce · Revenue · Market Forecast · Accounting & ovds Software"
        icon={<Receipt size={16} />}
        iconBg="bg-amber-500"
        onRefresh={fetchBills}
        loading={loading}
        tabs={[
          { id: 'ALL',     label: 'All',     count: totalCount },
          { id: 'PENDING', label: 'Pending', count: bills.filter((b:any) => b.status === 'PENDING').length, icon: <Clock size={11} /> },
          { id: 'OVERDUE', label: 'Overdue', count: bills.filter((b:any) => b.status === 'OVERDUE').length, icon: <AlertTriangle size={11} /> },
          { id: 'PAID',    label: 'Paid',    count: bills.filter((b:any) => b.status === 'PAID').length,    icon: <CheckCircle2 size={11} /> },
        ]}
        activeTab={statusFilter}
        onTabChange={(id) => setStatusFilter(id as BillStatusTab)}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Download size={13} /> Export
            </button>
            {canWrite && (
              <button
                onClick={openAdd}
                className="ovds-btn-primary"
              >
                <Plus size={14} /> New Bill
              </button>
            )}
          </div>
        }
      />

      {/* -- Content -- */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Stats strip */}
        <OvdsStatsStrip
          loading={loading && !bills.length}
          stats={[
            {
              label: 'Total Bills',
              tooltip: 'Total value of all bills in the current view',
              value: fmt(stats.total),
              sub: `${totalCount} bills`,
              icon: <Receipt size={15} />,
              iconBg: 'bg-slate-100',
              iconColor: 'text-slate-600',
            },
            {
              label: 'Pending',
              tooltip: 'Bills awaiting payment',
              value: fmt(stats.pending),
              sub: `${bills.filter((b:any) => b.status === 'PENDING').length} bills`,
              icon: <Clock size={15} />,
              iconBg: 'bg-amber-50',
              iconColor: 'text-amber-600',
              valueColor: 'text-amber-700',
              onClick: () => setStatusFilter('PENDING'),
            },
            {
              label: 'Paid',
              tooltip: 'Bills already settled',
              value: fmt(stats.paid),
              sub: `${bills.filter((b:any) => b.status === 'PAID').length} bills`,
              icon: <CheckCircle2 size={15} />,
              iconBg: 'bg-[var(--pro-azure-50)]',
              iconColor: 'text-[var(--pro-azure)]',
              valueColor: 'text-[var(--pro-azure-dark)]',
              onClick: () => setStatusFilter('PAID'),
            },
            {
              label: 'Overdue',
              tooltip: 'Bills past their due date — pay these first',
              value: fmt(stats.overdue),
              sub: `${bills.filter((b:any) => b.status === 'OVERDUE').length} bills`,
              icon: <AlertTriangle size={15} />,
              iconBg: 'bg-rose-50',
              iconColor: 'text-rose-600',
              valueColor: stats.overdue > 0 ? 'text-rose-600' : 'text-slate-800',
              onClick: () => setStatusFilter('OVERDUE'),
            },
          ]}
        />

        {/* Table card */}
        <div className="ovds-doc-shell overflow-hidden">
          {/* Toolbar */}
          <OvdsToolbar
            search={searchTerm}
            onSearch={setSearchTerm}
            searchPlaceholder="Search bills, vendors, references…"
            onExport={handleExport}
            hasActiveFilters={!!(categoryFilter || dateFrom || dateTo)}
            onClearFilters={() => { setCategoryFilter(''); setDateFrom(''); setDateTo(''); }}
          >
            {/* Category chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">Category:</span>
              {['', ...CATEGORIES.slice(0, 6)].map(cat => (
                <button
                  key={cat || 'ALL'}
                  onClick={() => setCategoryFilter(cat)}
                  className={[
                    'px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all',
                    categoryFilter === cat
                      ? 'bg-[var(--pro-azure)] text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {cat ? cat.replace(/_/g, ' ') : 'All'}
                </button>
              ))}
            </div>
          </OvdsToolbar>

          {/* Table */}
          <div className="overflow-x-auto min-h-[360px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[360px] gap-3">
              <div className="w-8 h-8 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" />
              <p className="text-[11px] font-semibold text-slate-400">Loading bills…</p>
            </div>
          ) : bills.length === 0 ? (
            <OvdsEmptyState
              type="bill"
              isFiltered={!!(searchTerm || categoryFilter || statusFilter !== 'ALL')}
              onClearFilters={() => { setSearchTerm(''); setCategoryFilter(''); setStatusFilter('ALL'); }}
              onAction={canWrite ? openAdd : undefined}
            />
          ) : (
            <table className="w-full text-left ovds-table">
              <thead>
                <tr>
                  <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100">Bill Details</th>
                  <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100">Supplier</th>
                  <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100 text-right">Amount Due</th>
                  <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100 text-center">Status</th>
                  <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bills.map(b => {
                  const isOverdue = b.status === 'OVERDUE' || (b.status !== 'PAID' && b.dueDate && new Date(b.dueDate) < new Date());

                  // Workflow A — guarantee period tracking
                  const isAgencyBill = b.category === 'RECRUITMENT_AGENCY_FEE';
                  const guaranteeActive = isAgencyBill && b.placementDate && b.guaranteePeriodDays > 0 && (() => {
                    const expires = new Date(new Date(b.placementDate).getTime() + b.guaranteePeriodDays * 86400000);
                    return new Date() <= expires;
                  })();
                  const guaranteeDaysLeft = isAgencyBill && b.placementDate && b.guaranteePeriodDays > 0
                    ? Math.max(0, Math.ceil((new Date(b.placementDate).getTime() + b.guaranteePeriodDays * 86400000 - Date.now()) / 86400000))
                    : null;

                  return (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <button onClick={() => navigate(`/purchases/bills/${b.id}`)} className="font-mono font-bold text-[12px] text-slate-800 dark:text-slate-100 hover:text-[var(--pro-azure)] transition-colors text-left">
                          #{b.billNumber}
                        </button>
                        <span className="ovds-caption mt-0.5 flex items-center gap-1">
                          <Calendar size={9} /> {fmtDate(b.date)}
                        </span>
                        {/* Guarantee period badge */}
                        {isAgencyBill && guaranteeDaysLeft !== null && (
                          <span className={`mt-1 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${
                            guaranteeActive
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-white text-slate-400 border border-slate-100'
                          }`}>
                            {guaranteeActive
                              ? `⏱ Guarantee: ${guaranteeDaysLeft}d left`
                              : '✓ Guarantee expired'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors shrink-0">
                          <Building2 size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-slate-800 truncate">
                            {typeof b.vendor === 'object' ? b.vendor?.name : b.vendor}
                          </p>
                          {b.category && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[b.category] ?? 'bg-slate-100 text-slate-500'}`}>
                              {b.category.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-[13px] font-bold font-mono-num text-slate-800 dark:text-slate-100 tabular-nums">{fmt(b.total)}</p>
                      <p className={`text-[10px] mt-0.5 flex items-center justify-end gap-1 ${isOverdue ? 'text-ovds-danger font-semibold' : 'text-slate-400'}`}>
                        <Clock size={9} /> Due {fmtDate(b.dueDate)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-center">
                        <PipelineBadge status={b.status} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        {b.status !== 'PAID' && (
                          <button
                            onClick={() => handleMarkPaid(b.id)}
                            className="p-1.5 text-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)] rounded-lg transition-all border border-transparent hover:border-[var(--pro-azure-100)]"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}
                        {/* Debit Note — AP credit against this bill */}
                        <button
                          onClick={() => { setDebitNoteBillId(b.id); setDebitNoteBill(b); }}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                          title={isAgencyBill && guaranteeActive ? 'Raise Guarantee Refund (Debit Note)' : 'Create Debit Note'}
                        >
                          <TrendingDown size={14} />
                        </button>
                        <button
                          onClick={() => openEdit(b)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>

          {/* Pagination */}
          {totalCount > take && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Showing {Math.min((page - 1) * take + 1, totalCount)}–{Math.min(page * take, totalCount)} of {totalCount}
              </p>
              <Pagination
                page={page}
                total={totalCount}
                pageSize={take}
                onChange={(p) => pagination.goTo(p)}
              />
            </div>
          )}
        </div>
      </div>

      {/* -- Bill Form Modals -- */}
      {showAddModal && (
        <BillFormModal
          onClose={() => { setShowAddModal(false); setEditingBill(null); }}
          editingBill={null}
          billForm={billForm}
          setBillForm={setBillForm}
          saving={saving}
          vendors={vendors}
          warehouses={warehouses}
          handleSaveBill={handleSaveBill}
          calcTotal={calcTotal}
        />
      )}
      {showEditModal && editingBill && (
        <BillFormModal
          onClose={() => { setShowEditModal(false); setEditingBill(null); }}
          editingBill={editingBill}
          billForm={billForm}
          setBillForm={setBillForm}
          saving={saving}
          vendors={vendors}
          warehouses={warehouses}
          handleSaveBill={handleSaveBill}
          calcTotal={calcTotal}
        />
      )}

      {/* -- Debit Note Modal -- */}
      {debitNoteBillId && (
        <DebitNoteModal
          billId={debitNoteBillId}
          onClose={() => { setDebitNoteBillId(null); setDebitNoteBill(null); }}
          onCreated={() => { setDebitNoteBillId(null); setDebitNoteBill(null); fetchBills(); }}
          createDebitNote={createDebitNote}
          saving={creatingDN}
          prefillReason={
            debitNoteBill?.category === 'RECRUITMENT_AGENCY_FEE'
              ? `Guarantee failure — candidate left within ${debitNoteBill.guaranteePeriodDays ?? '?'}-day guarantee period (placed ${debitNoteBill.placementDate ? new Date(debitNoteBill.placementDate).toLocaleDateString() : 'unknown'})`
              : undefined
          }
        />
      )}
    </div>
  );
};

export default Bills;



