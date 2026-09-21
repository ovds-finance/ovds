import { Skeleton } from '@ovds/ui';
import {
  Landmark, Plus, ChevronDown, Trash2, Search, Download,
  TrendingUp, TrendingDown, CheckCircle2, Clock, X, Link2,
  RefreshCw, Repeat, FileText,
  AlertTriangle, Info, Zap, Eye, SplitSquareHorizontal, Activity,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../rbac/AuthContext';
import api from '../../services/api';
import { downloadCSV, normalizeOcrError } from '../../utils';
import { confirm } from '../../utils/confirm';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-ET', { day: '2-digit', month: 'short', year: 'numeric' });

// -- IFRS IAS 7 account type labels --------------------------------------------
const BACKEND_TO_FRONTEND_TYPE: Record<string, string> = {
  BANK: 'CURRENT',
  SAVINGS: 'SAVINGS',
  LOAN: 'FIXED_DEPOSIT',
  CREDIT_CARD: 'CREDIT_CARD',
  CASH: 'PETTY_CASH',
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CURRENT: 'Current Account',
  SAVINGS: 'Savings Account',
  FIXED_DEPOSIT: 'Fixed Deposit',
  FOREIGN: 'Foreign Currency',
  CREDIT_CARD: 'Credit Card',
  PETTY_CASH: 'Petty Cash',
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  CURRENT: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-[var(--pro-azure-light)]',
  SAVINGS: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-[var(--pro-azure-light)]',
  FIXED_DEPOSIT: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  FOREIGN: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  CREDIT_CARD: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  PETTY_CASH: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const normalizeAccountType = (type: string | undefined): string => {
  if (!type) return 'CURRENT';
  return BACKEND_TO_FRONTEND_TYPE[type] ?? type;
};

const INTERVAL_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly', MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly',
};

const BANK_COLORS: Record<string, string> = {
  'Commercial Bank of Ethiopia': 'bg-[var(--pro-azure)]',
  'Dashen Bank': 'bg-red-600',
  'Awash Bank': 'bg-green-600',
  'Abyssinia Bank': 'bg-purple-600',
  'Nib Bank': 'bg-orange-600',
  'Cooperative Bank of Oromia': 'bg-teal-600',
  'Lion Bank': 'bg-yellow-600',
  'United Bank': 'bg-[var(--pro-azure)]',
  'Bunna Bank': 'bg-pink-600',
  'Zemen Bank': 'bg-cyan-600',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-[var(--pro-azure-light)]',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  PROCESSING: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  COMPLETED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/40 dark:text-[var(--pro-azure-light)]',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  RECONCILED: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
};

function getBankColor(bankName: string): string {
  const key = Object.keys(BANK_COLORS).find(k => bankName.toLowerCase().includes(k.toLowerCase()));
  return key ? BANK_COLORS[key] : 'bg-slate-600';
}

function getBankShort(bankName: string): string {
  const key = Object.keys(BANK_COLORS).find(k => bankName.toLowerCase().includes(k.toLowerCase()));
  if (key) return key.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return bankName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// -- Link Transaction Modal ----------------------------------------------------
const LinkTransactionModal: React.FC<{
  txn: any;
  companyId?: string;
  onClose: () => void;
  onLinked: () => void;
}> = ({ txn, companyId, onClose, onLinked }) => {
  const [tab, setTab] = useState<'invoice' | 'bill'>('invoice');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    setLoading(true);
    const endpoint = tab === 'invoice'
      ? `/ovds/invoices?companyId=${companyId}&status=PENDING&status=OVERDUE`
      : `/ovds/bills?companyId=${companyId}&status=PENDING&status=OVERDUE`;
    api.get(endpoint)
      .then((r: any) => { const _items = r.data?.data ?? r.data; setItems(Array.isArray(_items) ? _items : []); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [tab, companyId]);

  const filtered = items.filter(i =>
    (i.invoiceNumber || i.billNumber || i.vendor || i.customerName || '')
      .toLowerCase().includes(search.toLowerCase())
  );

  const handleLink = async (item: any) => {
    setLinking(item.id);
    try {
      const endpoint = tab === 'invoice'
        ? `/banking/transactions/${txn.id}/link-invoice`
        : `/banking/transactions/${txn.id}/link-bill`;
      await api.patch(endpoint, { [tab === 'invoice' ? 'invoiceId' : 'billId']: item.id });
      toast.success(`Transaction linked to ${tab === 'invoice' ? 'invoice' : 'bill'} ${item.invoiceNumber || item.billNumber}`);
      onLinked();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to link');
    } finally {
      setLinking(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Link2 size={15} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" /> Connect to Invoice / Bill
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {Number(txn.amount) >= 0 ? '+' : ''}{fmt(Number(txn.amount))} · {txn.description}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* IFRS note */}
        <div className="px-5 py-2.5 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border-b border-[var(--pro-azure-100)] dark:border-green-900/40 flex items-start gap-2">
          <Info size={12} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
            <strong>IAS 7 / IFRS 9:</strong> Linking reconciles the bank transaction against the corresponding AR/AP entry, completing the double-entry cycle and clearing the outstanding balance.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 shrink-0">
          {(['invoice', 'bill'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${tab === t ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {t === 'invoice' ? 'Invoices (AR)' : 'Bills (AP)'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 py-2 shrink-0">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${tab}s…`}
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
          {loading ? (
            <div className="space-y-2 pt-2">{[1,2,3].map(i => <Skeleton.Card key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No outstanding {tab}s found</p>
          ) : filtered.map(item => {
            const num = item.invoiceNumber || item.billNumber || item.id.slice(0,8);
            const party = item.customerName || item.vendor || item.vendorName || '—';
            const amount = Number(item.totalAmount || item.total || item.amount || 0);
            const due = item.dueDate ? fmtDate(item.dueDate) : '—';
            const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-[var(--pro-azure)]/40 dark:border-green-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-white">{num}</span>
                    {isOverdue && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full">Overdue</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{party} · Due {due}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-white tabular-nums shrink-0">
                  ETB {fmt(amount)}
                </span>
                <button onClick={() => handleLink(item)} disabled={linking === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-500-dark disabled:opacity-50 transition-colors shrink-0">
                  {linking === item.id ? <RefreshCw size={11} className="animate-spin" /> : <Link2 size={11} />}
                  Link
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -- Split Transaction Modal ---------------------------------------------------
const SplitTransactionModal: React.FC<{
  txn: any;
   companyId?: string;
   onClose: () => void;
   onSplit: () => void;
  }> = ({ txn, companyId, onClose, onSplit }) => {
  const totalAmount = Math.abs(Number(txn.amount));
  const [splits, setSplits] = useState([
    { description: txn.description, amount: totalAmount, invoiceId: '', billId: '' },
    { description: '', amount: 0, invoiceId: '', billId: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const remaining = totalAmount - splits.reduce((s, sp) => s + (Number(sp.amount) || 0), 0);
  const isBalanced = Math.abs(remaining) < 0.01;

  const updateSplit = (i: number, field: string, value: string | number) => {
    setSplits(prev => prev.map((sp, idx) => idx === i ? { ...sp, [field]: value } : sp));
  };

  const addSplit = () => setSplits(prev => [...prev, { description: '', amount: 0, invoiceId: '', billId: '' }]);
  const removeSplit = (i: number) => setSplits(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!isBalanced) { toast.error('Split amounts must equal total transaction amount'); return; }
    setSaving(true);
    try {
      for (const sp of splits) {
        if (!sp.description || !sp.amount) continue;
        const endpoint = sp.invoiceId
          ? `/banking/transactions/${txn.id}/link-invoice`
          : `/banking/transactions/${txn.id}/link-bill`;
        const payload: any = sp.invoiceId
          ? { invoiceId: sp.invoiceId }
          : { billId: sp.billId };
        if (sp.description) payload.notes = sp.description;
        await api.patch(endpoint, payload);
      }
      toast.success('Transaction split and linked');
      onSplit();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to split');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <SplitSquareHorizontal size={15} className="text-violet-500" /> Split Transaction
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total: ETB {fmt(totalAmount)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
        </div>

        <div className="px-5 py-2.5 bg-violet-50 dark:bg-violet-950/20 border-b border-violet-100 dark:border-violet-900/40 flex items-start gap-2 shrink-0">
          <Info size={12} className="text-violet-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-violet-700 dark:text-violet-400">
            <strong>IFRS 9:</strong> Split a single bank transaction across multiple invoices or bills. Each split creates a separate reconciliation entry. Total must equal ETB {fmt(totalAmount)}.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {splits.map((sp, i) => (
            <div key={i} className="p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Split {i + 1}</span>
                {splits.length > 2 && (
                  <button onClick={() => removeSplit(i)} className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"><X size={12} /></button>
                )}
              </div>
              <input value={sp.description} onChange={e => updateSplit(i, 'description', e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-white" />
              <div className="flex gap-2">
                <input type="number" value={sp.amount || ''} onChange={e => updateSplit(i, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="Amount (ETB)"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-white" />
                <input value={sp.invoiceId} onChange={e => updateSplit(i, 'invoiceId', e.target.value)}
                  placeholder="Invoice ID (optional)"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-white" />
              </div>
            </div>
          ))}

          <button onClick={addSplit} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:border-[var(--pro-azure)] hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
            + Add Split
          </button>

          {/* Balance indicator */}
          <div className={`flex items-center justify-between p-3 rounded-xl ${isBalanced ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800' : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800'}`}>
            <span className={`text-xs font-bold ${isBalanced ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-rose-700 dark:text-rose-400'}`}>
              {isBalanced ? '✓ Balanced' : `Remaining: ETB ${fmt(Math.abs(remaining))}`}
            </span>
            <span className={`text-sm font-semibold tabular-nums ${isBalanced ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-rose-700 dark:text-rose-400'}`}>
              {fmt(splits.reduce((s, sp) => s + (Number(sp.amount) || 0), 0))} / {fmt(totalAmount)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !isBalanced}
            className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Apply Split'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -- Recurring Transaction Modal -----------------------------------------------
const RecurringModal: React.FC<{
  bankAccountId: string;
  bankName: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ bankAccountId, bankName, onClose, onSaved }) => {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'DEBIT' as 'CREDIT' | 'DEBIT',
    interval: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    nextDate: new Date().toISOString().split('T')[0],
    reference: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description || !form.amount) { toast.error('Description and amount are required'); return; }
    setSaving(true);
    try {
      const amount = form.type === 'DEBIT' ? -Math.abs(parseFloat(form.amount)) : Math.abs(parseFloat(form.amount));
      await api.post(`/banking/accounts/${bankAccountId}/recurring`, {
        description: form.description,
        amount,
        type: form.type,
        interval: form.interval,
        nextDate: form.nextDate,
        reference: form.reference || undefined,
      });
      toast.success('Recurring transaction created');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Repeat size={15} className="text-[var(--pro-azure)]" /> New Recurring Transaction
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{bankName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl flex items-start gap-2">
            <Info size={12} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]">
              <strong>IAS 7:</strong> Recurring transactions (rent, subscriptions, loan repayments) are automatically scheduled. Each posting creates a bank transaction and updates the cash flow statement.
            </p>
          </div>

          {/* Credit / Debit */}
          <div className="grid grid-cols-2 gap-2">
            {(['CREDIT', 'DEBIT'] as const).map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all ${form.type === t ? (t === 'CREDIT' ? 'bg-[var(--pro-azure)] text-white' : 'bg-rose-600 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {t === 'CREDIT' ? '+ Credit (In)' : '− Debit (Out)'}
              </button>
            ))}
          </div>

          {[
            { label: 'Description *', field: 'description', type: 'text', placeholder: 'e.g. Office Rent, Loan Repayment' },
            { label: 'Amount (ETB) *', field: 'amount', type: 'number', placeholder: '0.00' },
            { label: 'Reference', field: 'reference', type: 'text', placeholder: 'Contract no., account ref…' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder} min={type === 'number' ? '0.01' : undefined} step={type === 'number' ? '0.01' : undefined}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-400/20 dark:text-white" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Interval</label>
              <select value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value as any }))}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none dark:text-white">
                {Object.entries(INTERVAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">First Date</label>
              <input type="date" value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none dark:text-white" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Create Recurring'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -- Bank Feeds Panel ---------------------------------------------------------
const BankFeedsPanel: React.FC<{
  bankAccountId: string;
  bankName: string;
  companyId?: string;
  onClose: () => void;
  onImported: () => void;
  }> = ({ bankAccountId, bankName, companyId, onClose, onImported }) => {
  const [tab, setTab] = useState<'csv' | 'ocr'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    return lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const get = (keys: string[]) => { for (const k of keys) { const i = headers.findIndex(h => h.includes(k)); if (i >= 0 && cols[i]) return cols[i]; } return ''; };
      const dateStr = get(['date','txn date','value date','transaction date']);
      const desc = get(['description','narration','particulars','details','memo']);
      const amtStr = get(['amount','debit','credit','value']);
      const typeStr = get(['type','dr/cr','transaction type']);
      const ref = get(['reference','ref','cheque','check']);
      const amount = Math.abs(parseFloat(amtStr.replace(/[^0-9.-]/g, '')) || 0);
      const type: 'CREDIT' | 'DEBIT' = typeStr.toUpperCase().includes('CR') || typeStr.toUpperCase().includes('CREDIT') ? 'CREDIT' : 'DEBIT';
      const hasError = !dateStr || !desc || amount === 0;
      return { date: dateStr, description: desc, amount, type, reference: ref || undefined, status: hasError ? 'error' : 'pending', error: hasError ? [!dateStr && 'missing date', !desc && 'missing description', amount === 0 && 'zero amount'].filter(Boolean).join(', ') : undefined, selected: !hasError };
    }).filter(r => r.description || r.amount);
  };

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => { const parsed = parseCSV(e.target?.result as string); setRows(parsed); };
    reader.readAsText(f);
  };

  const handleOCR = async () => {
    if (!file) return;
    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = (e.target?.result as string).split(',')[1];
        const res = await api.post('/banking/feeds/ocr', { imageBase64: base64, mimeType: file.type });
        const txns = res.data?.transactions ?? res.data?.data?.transactions ?? [];
        setRows(txns.map((t: any) => ({ ...t, selected: true, status: 'pending' })));
        setOcrLoading(false);
        toast.success(`Extracted ${txns.length} transactions`);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(normalizeOcrError(err.response?.data?.message ?? 'OCR failed'));
      setOcrLoading(false);
    }
  };

  const handleImport = async () => {
    const selected = rows.filter(r => r.selected && r.status !== 'error');
    if (!selected.length) { toast.error('No rows selected'); return; }
    setImporting(true);
    let ok = 0, fail = 0;
    for (const row of selected) {
      try {
        const amount = row.type === 'DEBIT' ? -Math.abs(row.amount) : Math.abs(row.amount);
        await api.post(`/banking/transactions`, { bankAccountId, date: row.date, description: row.description, amount, reference: row.reference });
        ok++;
      } catch { fail++; }
    }
    setImporting(false);
    if (ok > 0) { toast.success(`Imported ${ok} transaction${ok !== 1 ? 's' : ''}`); onImported(); }
    if (fail > 0) toast.error(`${fail} failed`);
    if (ok > 0) onClose();
  };

  const selectedCount = rows.filter(r => r.selected && r.status !== 'error').length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Zap size={15} className="text-amber-500" /> Bank Feeds
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{bankName} · Import transactions from CSV or bank statement image</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 shrink-0">
          {(['csv', 'ocr'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setRows([]); setFile(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {t === 'csv' ? '📄 CSV Import' : '🔍 AI OCR (Image/PDF)'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Upload area */}
          {rows.length === 0 && (
            <div
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center cursor-pointer hover:border-[var(--pro-azure)] hover:bg-[var(--pro-azure-50)]/20 dark:hover:bg-green-950/10 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                {tab === 'csv' ? <FileText size={22} className="text-slate-400" /> : <Eye size={22} className="text-slate-400" />}
              </div>
              <p className="font-bold text-slate-600 dark:text-slate-300">
                {tab === 'csv' ? 'Drop CSV file or click to browse' : 'Drop bank statement image/PDF or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {tab === 'csv' ? 'Supports CBE, Awash, Dashen, Abyssinia and standard CSV formats' : 'Supports JPG, PNG, PDF · Powered by GPT-4o / Gemini'}
              </p>
              <input ref={fileRef} type="file" accept={tab === 'csv' ? '.csv' : 'image/*,.pdf'} className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {/* OCR trigger */}
          {file && tab === 'ocr' && rows.length === 0 && (
            <button onClick={handleOCR} disabled={ocrLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {ocrLoading ? <RefreshCw size={15} className="animate-spin" /> : <Eye size={15} />}
              {ocrLoading ? 'Extracting transactions…' : `Extract from ${file.name}`}
            </button>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{rows.length} rows · {selectedCount} selected</p>
                <button onClick={() => { setRows([]); setFile(null); }} className="text-xs text-slate-400 hover:text-rose-500 transition-colors">Clear</button>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="ovds-table w-full text-xs">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input type="checkbox"
                            checked={rows.filter(r => r.status !== 'error').every(r => r.selected)}
                            onChange={() => { const all = rows.filter(r => r.status !== 'error').every(r => r.selected); setRows(prev => prev.map(r => r.status === 'error' ? r : { ...r, selected: !all })); }}
                            className="rounded border-slate-300 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
                        </th>
                        {['Date','Description','Type','Amount','Ref','Status'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className={`border-b border-slate-50 dark:border-slate-700/50 ${r.status === 'error' ? 'bg-rose-50/40 dark:bg-rose-950/10' : r.selected ? 'bg-[var(--pro-azure-50)]/20 dark:bg-green-950/10' : ''}`}>
                          <td className="px-3 py-2">{r.status !== 'error' && <input type="checkbox" checked={r.selected} onChange={() => setRows(prev => prev.map((row, idx) => idx === i ? { ...row, selected: !row.selected } : row))} className="rounded border-slate-300 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />}</td>
                          <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap">{r.date || '—'}</td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">{r.description || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.type === 'CREDIT' ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]' : 'bg-rose-100 text-rose-700'}`}>{r.type}</span>
                          </td>
                          <td className={`px-3 py-2 font-semibold tabular-nums ${r.type === 'CREDIT' ? 'text-[var(--pro-azure-dark)]' : 'text-rose-700'}`}>
                            {r.type === 'CREDIT' ? '+' : '-'}{fmt(r.amount)}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-400 text-[10px]">{r.reference ?? '—'}</td>
                          <td className="px-3 py-2">
                            {r.status === 'error' ? <span className="text-[9px] text-rose-600 font-bold">{r.error}</span> : <span className="text-[9px] text-[var(--pro-azure)] font-bold">Ready</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
          <button onClick={handleImport} disabled={importing || selectedCount === 0}
            className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-500-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {importing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            {importing ? 'Importing…' : `Import ${selectedCount} Transaction${selectedCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};


// -- Types ----------------------------------------------------------------------

interface BankAccount {
  id: string;
  name: string;
  accountNumber?: string;
  bankName?: string;
  institution?: string;
  accountType?: string;
  accountStatus?: string;
  status?: string;
  currencyCode?: string;
  openingBalance?: number;
  balance?: number;
  computedBalance?: number;
  unreconciledCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type?: 'CREDIT' | 'DEBIT';
  reference?: string;
  status?: string;
  notes?: string;
  counterparty?: string;
  bankName?: string;
  runningBalance?: number;
}

interface RecurringTemplate {
  id: string;
  bankAccountId: string;
  description: string;
  amount: number;
  type?: string;
  interval: string;
  nextDate: string;
  status: string;
  reference?: string;
}

// -- Main BankAccountCard Component -------------------------------------------
interface BankAccountCardProps {
  bank: BankAccount;
  companyId?: string;
  onRecordTxn: () => void;
  onEdit?: () => void;
  onDeleted?: () => void;
}

const BankAccountCard: React.FC<BankAccountCardProps> = ({
  bank, companyId, onRecordTxn, onEdit, onDeleted,
}) => {
  const { can } = useAuth();
  const canWrite = can('ovds:write');
  const [expanded, setExpanded] = useState(false);
  const [txns, setTxns] = useState<BankTransaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [txnSearch, setTxnSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL'|'PENDING'|'RECONCILED'>('ALL');
  const [showLink, setShowLink] = useState<BankTransaction | null>(null);
  const [showSplit, setShowSplit] = useState<BankTransaction | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showFeeds, setShowFeeds] = useState(false);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [postingId, setPostingId] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<'transactions'|'recurring'>('transactions');

  const displayBalance = bank.computedBalance ?? Number(bank.balance ?? 0);
  const openingBal = Number(bank.openingBalance ?? 0);
  const netChange = displayBalance - openingBal;

  const loadTxns = useCallback(async (p = 1) => {
    setLoadingTxns(true);
    setExpanded(true);
    try {
      const res = await api.get(`/banking/accounts/${bank.id}/transactions?page=${p}&limit=50`);
      const data = res.data.data ?? res.data;
      if (Array.isArray(data)) { setTxns(data); setTotalPages(1); }
      else { setTxns(data.transactions ?? data.data ?? []); setTotalPages(data.pages ?? 1); }
      setPage(p);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoadingTxns(false); }
  }, [bank.id]);

  const loadRecurring = useCallback(async () => {
    try {
      const res = await api.get(`/banking/accounts/${bank.id}/recurring`);
      setRecurringTemplates(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch {
      setRecurringTemplates([]);
    }
  }, [bank.id]);

  const reconcileAll = async () => {
    const pending = txns.filter(t => t.status !== 'RECONCILED');
    if (!pending.length) { toast('All transactions already reconciled'); return; }
    try {
      await api.post('/banking/transactions/bulk-reconcile', { ids: pending.map(t => t.id) });
      setTxns(prev => prev.map(t => ({ ...t, status: 'RECONCILED' })));
      toast.success(`${pending.length} transaction(s) reconciled`);
    } catch { toast.error('Failed to reconcile all'); }
  };

  const reconcile = async (txnId: string) => {
    try {
      await api.patch(`/banking/transactions/${txnId}/reconcile`, {});
      setTxns(prev => prev.map(t => t.id === txnId ? { ...t, status: 'RECONCILED' } : t));
      toast.success('Reconciled');
    } catch { toast.error('Failed to reconcile'); }
  };

  const deleteTxn = async (txnId: string) => {
    if (!(await confirm({ title: 'Delete transaction?', message: 'This will reverse the balance impact.', variant: 'danger', confirmLabel: 'Delete' }))) return;
    try {
      await api.delete(`/banking/transactions/${txnId}`);
      setTxns(prev => prev.filter(t => t.id !== txnId));
      toast.success('Transaction deleted');
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed to delete'); }
  };

  const deleteAccount = async () => {
    if (!(await confirm({ title: `Delete "${bank.name}"?`, message: 'Only accounts with no transactions can be deleted.', variant: 'danger', confirmLabel: 'Delete' }))) return;
    try {
      await api.delete(`/banking/accounts/${bank.id}`);
      toast.success('Bank account deleted');
      onDeleted?.();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed to delete account'); }
  };

  const postRecurring = async (templateId: string) => {
    setPostingId(templateId);
    try {
      await api.post(`/banking/recurring/${templateId}/post`, { date: new Date().toISOString().split('T')[0] });
      toast.success('Recurring transaction posted');
      loadTxns(1);
      loadRecurring();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed to post'); }
    finally { setPostingId(null); }
  };

  const deleteRecurring = async (templateId: string) => {
    if (!(await confirm({ title: 'Delete recurring template?', variant: 'danger', confirmLabel: 'Delete' }))) return;
    try {
      await api.delete(`/banking/accounts/${bank.id}/recurring/${templateId}`);
      setRecurringTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Recurring template deleted');
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed to delete'); }
  };

  const txnsWithRunning = useMemo(() => {
    const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = openingBal;
    return sorted.map(t => { running += Number(t.amount); return { ...t, runningBalance: running }; }).reverse();
  }, [txns, openingBal]);

  const filtered = useMemo(() => txnsWithRunning.filter(t => {
    const q = txnSearch.toLowerCase();
    const matchSearch = !q || t.description?.toLowerCase().includes(q) || t.reference?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  }), [txnsWithRunning, txnSearch, statusFilter]);

  const exportTxns = () => {
    const header = 'Date,Description,Reference,Type,Amount,Running Balance,Status,Linked\n';
    const rows = filtered.map(t => {
      const linked = t.reference?.startsWith('INV:') ? 'Invoice' : t.reference?.startsWith('BILL:') ? 'Bill' : '';
      return `"${fmtDate(t.date)}","${t.description}","${t.reference ?? ''}","${Number(t.amount) >= 0 ? 'CREDIT' : 'DEBIT'}",${Number(t.amount).toFixed(2)},${t.runningBalance.toFixed(2)},${t.status ?? 'PENDING'},"${linked}"`;
    }).join('\n');
    downloadCSV(header + rows, `${bank.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const sparkData = useMemo(() => {
    const pts = [...txnsWithRunning].reverse().slice(-8).map(t => t.runningBalance);
    if (pts.length < 2) return null;
    const min = Math.min(...pts); const max = Math.max(...pts); const range = max - min || 1;
    const w = 60; const h = 20;
    const points = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return { points, trend: pts[pts.length - 1] >= pts[0] };
  }, [txnsWithRunning]);

  const pendingCount = txns.filter(t => t.status !== 'RECONCILED').length;
  const linkedCount = txns.filter(t => t.reference?.startsWith('INV:') || t.reference?.startsWith('BILL:')).length;

  const lastActivity = useMemo(() => {
    if (txns.length === 0) return null;
    const sorted = [...txns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    const date = new Date(latest.date);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return fmtDate(latest.date);
  }, [txns]);

  const groupedTxns = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filtered.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('en-ET', { weekday: 'long', month: 'long', day: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups);
  }, [filtered]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
      {/* -- Card Header -- */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getBankColor(bank.bankName ?? '')}`}>
              <span className="text-white text-xs font-bold">{getBankShort(bank.bankName ?? '')}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-800 dark:text-white truncate">{bank.name}</h3>
                {bank.accountType && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_COLORS[normalizeAccountType(bank.accountType)] ?? 'bg-slate-100 text-slate-500'}`}>
                    {ACCOUNT_TYPE_LABELS[normalizeAccountType(bank.accountType)] ?? bank.accountType}
                  </span>
                )}
                {bank.status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[bank.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {bank.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {bank.bankName ?? bank.institution ?? '—'}
                {bank.accountNumber ? ` · ****${String(bank.accountNumber).slice(-4)}` : ''}
                {bank.currencyCode && bank.currencyCode !== 'ETB' ? ` · ${bank.currencyCode}` : ''}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="text-right shrink-0">
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {(bank.currencyCode ?? 'ETB')} {fmt(displayBalance)}
            </p>
            <div className={`flex items-center justify-end gap-1 mt-0.5 text-xs font-bold ${netChange >= 0 ? 'text-[var(--pro-azure)]' : 'text-rose-600'}`}>
              {netChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {netChange >= 0 ? '+' : ''}{fmt(netChange)}
            </div>
          </div>
        </div>

        {/* Sparkline */}
        {sparkData && (
          <div className="mt-3 flex items-center gap-2">
            <svg width="60" height="20" className="shrink-0">
              <polyline
                points={sparkData.points}
                fill="none"
                stroke={sparkData.trend ? '#00C96E' : '#dc2626'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ovds-caption">Last {Math.min(txns.length, 8)} transactions</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full">
              <Clock size={10} /> {pendingCount} pending
            </span>
          )}
          {linkedCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/20 px-2 py-1 rounded-full">
              <Link2 size={10} /> {linkedCount} linked
            </span>
          )}
          {recurringTemplates.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/20 px-2 py-1 rounded-full">
              <Repeat size={10} /> {recurringTemplates.length} recurring
            </span>
          )}
          {lastActivity && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              <Activity size={10} /> Last activity: {lastActivity}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {canWrite && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button onClick={onRecordTxn}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-500-dark transition-colors">
              <Plus size={12} /> Record
            </button>
            <button onClick={() => { loadTxns(1); loadRecurring(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              {expanded ? 'Hide' : 'Transactions'}
            </button>
            <button onClick={() => setShowFeeds(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
              <Zap size={12} /> Feeds
            </button>
            {txns.length > 0 && (
              <button onClick={exportTxns}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Download size={12} /> Export
              </button>
            )}
            {pendingCount > 0 && (
              <button onClick={reconcileAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] rounded-xl text-xs font-bold hover:bg-[var(--pro-azure-100)] dark:hover:bg-green-950/40 transition-colors">
                <CheckCircle2 size={12} /> Reconcile All
              </button>
            )}
            {onEdit && (
              <button onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <FileText size={12} /> Edit
              </button>
            )}
            <button onClick={deleteAccount}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors ml-auto">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* -- Expanded Transactions Panel -- */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3">
            {(['transactions', 'recurring'] as const).map(t => (
              <button key={t} onClick={() => { setActiveTab(t); if (t === 'recurring') loadRecurring(); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${activeTab === t ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {t === 'transactions' ? `Transactions (${txns.length})` : `Recurring (${recurringTemplates.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'transactions' && (
            <>
              {/* Filters */}
              <div className="flex items-center gap-2 px-5 py-3 flex-wrap">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[160px]">
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input value={txnSearch} onChange={e => setTxnSearch(e.target.value)}
                    placeholder="Search transactions…"
                    className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400" />
                  {txnSearch && <button onClick={() => setTxnSearch('')}><X size={12} className="text-slate-400 hover:text-slate-600" /></button>}
                </div>
                <div className="flex gap-1">
                  {(['ALL', 'PENDING', 'RECONCILED'] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${statusFilter === s ? 'bg-[var(--pro-azure)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction list */}
              {loadingTxns ? (
                <div className="px-5 pb-4 space-y-2">{[1,2,3].map(i => <Skeleton.Card key={i} />)}</div>
              ) : filtered.length === 0 ? (
                <div className="px-5 pb-6 text-center">
                  <AlertTriangle size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No transactions found</p>
                </div>
              ) : (
                <div className="px-5 pb-4 space-y-4">
                  {groupedTxns.map(([dateGroup, txnsInGroup]) => (
                    <div key={dateGroup}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 sticky top-0 bg-white dark:bg-slate-900 py-1 z-10">
                        {dateGroup}
                      </p>
                      <div className="space-y-1">
                        {txnsInGroup.map(t => {
                          const amount = Number(t.amount);
                          const isCredit = amount >= 0;
                          const isReconciled = t.status === 'RECONCILED';
                          const isLinked = t.reference?.startsWith('INV:') || t.reference?.startsWith('BILL:');
                          return (
                            <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group rounded-xl">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-[var(--pro-azure-100)] dark:bg-green-950/40' : 'bg-rose-100 dark:bg-rose-950/40'}`}>
                                {isCredit ? <TrendingUp size={14} className="text-[var(--pro-azure)]" /> : <TrendingDown size={14} className="text-rose-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{t.description}</p>
                                  {isLinked && <Link2 size={10} className="text-[var(--pro-azure-light)] shrink-0" />}
                                  {isReconciled && <CheckCircle2 size={10} className="text-[var(--pro-azure)] shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="ovds-caption">{fmtDate(t.date)}</span>
                                  {t.reference && <span className="text-[10px] text-slate-300 font-mono truncate max-w-[120px]">{t.reference}</span>}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-semibold tabular-nums ${isCredit ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-rose-700 dark:text-rose-400'}`}>
                                  {isCredit ? '+' : ''}{fmt(amount)}
                                </p>
                                <p className="text-[10px] text-slate-400 tabular-nums">{fmt(t.runningBalance)}</p>
                              </div>
                              {/* Row actions */}
                              {canWrite && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {!isReconciled && (
                                    <button onClick={() => reconcile(t.id)} title="Reconcile"
                                      className="p-1.5 rounded-lg hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-950/30 text-slate-300 hover:text-[var(--pro-azure)] transition-colors">
                                      <CheckCircle2 size={13} />
                                    </button>
                                  )}
                                  {!isLinked && (
                                    <button onClick={() => setShowLink(t)} title="Link to invoice/bill"
                                      className="p-1.5 rounded-lg hover:bg-[var(--pro-azure-50)] dark:hover:bg-green-950/30 text-slate-300 hover:text-[var(--pro-azure)] transition-colors">
                                      <Link2 size={13} />
                                    </button>
                                  )}
                                  <button onClick={() => setShowSplit(t)} title="Split transaction"
                                    className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 text-slate-300 hover:text-violet-500 transition-colors">
                                    <SplitSquareHorizontal size={13} />
                                  </button>
                                  <button onClick={() => deleteTxn(t.id)} title="Delete"
                                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => loadTxns(page - 1)} disabled={page <= 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Prev
                  </button>
                  <span className="text-xs text-slate-400">{page} / {totalPages}</span>
                  <button onClick={() => loadTxns(page + 1)} disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'recurring' && (
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled recurring transactions</p>
                <button onClick={() => setShowRecurring(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-500-dark transition-colors">
                  <Plus size={12} /> New
                </button>
              </div>
              {recurringTemplates.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Repeat size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No recurring transactions</p>
                </div>
              ) : recurringTemplates.map(r => {
                const amount = Number(r.amount);
                const isDue = r.nextDate && new Date(r.nextDate) <= new Date();
                return (
                  <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isDue ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                    <Repeat size={14} className={amount >= 0 ? 'text-[var(--pro-azure)] shrink-0' : 'text-rose-600 shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{r.description}</p>
                      <p className="ovds-caption">{INTERVAL_LABELS[r.interval] ?? r.interval} · Next: {r.nextDate ? fmtDate(r.nextDate) : '—'}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums shrink-0 ${amount >= 0 ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' : 'text-rose-700 dark:text-rose-400'}`}>
                      {amount >= 0 ? '+' : ''}{fmt(amount)}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      {isDue && (
                        <button onClick={() => postRecurring(r.id)} disabled={postingId === r.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors">
                          {postingId === r.id ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />} Post
                        </button>
                      )}
                      <button onClick={() => deleteRecurring(r.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -- Modals -- */}
      {showLink && (
        <LinkTransactionModal
          txn={showLink}
          companyId={companyId}
          onClose={() => setShowLink(null)}
          onLinked={() => loadTxns(page)}
        />
      )}
      {showSplit && (
        <SplitTransactionModal
          txn={showSplit}
          companyId={companyId}
          onClose={() => setShowSplit(null)}
          onSplit={() => loadTxns(page)}
        />
      )}
      {showRecurring && (
        <RecurringModal
          bankAccountId={bank.id}
          bankName={bank.name}
          onClose={() => setShowRecurring(false)}
          onSaved={() => loadRecurring()}
        />
      )}
      {showFeeds && (
        <BankFeedsPanel
          bankAccountId={bank.id}
          bankName={bank.name}
          companyId={companyId}
          onClose={() => setShowFeeds(false)}
          onImported={() => loadTxns(1)}
        />
      )}
    </div>
  );
};

export default BankAccountCard;








