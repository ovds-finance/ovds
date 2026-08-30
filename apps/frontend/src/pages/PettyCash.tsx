/**
 * Petty Cash Fund Management
 *
 * Imprest system:
 *   1. Establish a float (e.g. ETB 5,000)
 *   2. Custodian records each expenditure with category and receipt
 *   3. When balance falls below threshold, submit replenishment request
 *   4. ovds approves and tops up to float level
 *   5. All transactions post to the Petty Cash GL account
 *
 * WHT note: cash payments ≥ ETB 10,000 for services or ≥ ETB 20,000 for goods
 * require WHT deduction per Proclamation No. 1395/2025 — flag these automatically.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, RefreshCw, Wallet, TrendingDown,
  TrendingUp, AlertTriangle, X, Info,
  CheckCircle2, ArrowUpCircle,
} from 'lucide-react';
import { AppPage, Btn } from '@ovds/ui';
import { evalMath } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { fmtCurrency } from '../utils/fmt';
import { Icon } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fmt = (n: number) => fmtCurrency(n, 'ETB');

// WHT thresholds per Proclamation No. 1395/2025
const WHT_SERVICES_THRESHOLD = 10_000;
const WHT_GOODS_THRESHOLD    = 20_000;

const CATEGORIES = [
  'Office Supplies', 'Stationery', 'Postage & Courier', 'Refreshments',
  'Taxi / Transport', 'Miscellaneous Repairs', 'Cleaning Supplies',
  'Utility Bills (small)', 'Staff Welfare', 'Other',
];

const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors placeholder:text-slate-300';

// -- Transaction type config ---------------------------------------------------
const TX_TYPE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  EXPENSE:       { label: 'Expense',       cls: 'bg-rose-50 text-rose-700 border-rose-200',     icon: <TrendingDown size={11} /> },
  REPLENISHMENT: { label: 'Replenishment', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <ArrowUpCircle size={11} /> },
  ADJUSTMENT:    { label: 'Adjustment',    cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Icon name="REFRESH" size={11} /> },
};

// -- New Transaction Modal -----------------------------------------------------
const AddTransactionModal: React.FC<{
  fund: any;
  onClose: () => void;
  onSaved: () => void;
}> = ({ fund, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'EXPENSE', amount: '', description: '',
    category: 'Office Supplies', receiptRef: '', performedBy: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const amount  = parseFloat(form.amount) || 0;
  const whtFlag = form.type === 'EXPENSE' && (
    (form.category.toLowerCase().includes('service') || form.category === 'Staff Welfare') && amount >= WHT_SERVICES_THRESHOLD
    || amount >= WHT_GOODS_THRESHOLD
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (amount <= 0)              { toast.error('Amount must be greater than 0'); return; }
    if (form.type === 'EXPENSE' && amount > Number(fund.currentBalance)) {
      toast.error(`Amount exceeds current balance (${fmt(Number(fund.currentBalance))})`);
      return;
    }
    setSaving(true);
    try {
      await api.post(`/ovds/petty-cash/${fund.id}/transactions`, {
        type:        form.type,
        amount,
        description: form.description,
        category:    form.category || undefined,
        receiptRef:  form.receiptRef || undefined,
        performedBy: form.performedBy || undefined,
      });
      toast.success(form.type === 'REPLENISHMENT' ? 'Replenishment recorded' : 'Transaction recorded');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Record Transaction</h3>
            <p className="text-xs text-slate-400 mt-0.5">{fund.name} · Balance: {fmt(Number(fund.currentBalance))}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {Object.entries(TX_TYPE).map(([k, v]) => (
              <button key={k} type="button"
                onClick={() => set('type', k)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  form.type === k ? v.cls + ' shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Amount (ETB) <span className="text-rose-500">*</span></label>
              <input type="text" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} onBlur={e => set('amount', String(evalMath(e.target.value) ?? e.target.value))} className={inp} placeholder="0.00" required />
            </div>
            {form.type === 'EXPENSE' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inp}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* WHT warning */}
          {whtFlag && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <AlertTriangle size={12} className="shrink-0" />
              <span><strong>WHT applies:</strong> Cash payment ≥ ETB {amount >= WHT_GOODS_THRESHOLD ? '20,000 (goods)' : '10,000 (services)'}. Deduct 3% WHT per Proclamation No. 1395/2025.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description <span className="text-rose-500">*</span></label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              className={inp} placeholder="What was purchased or why…" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Receipt Ref</label>
              <input value={form.receiptRef} onChange={e => set('receiptRef', e.target.value)}
                className={inp} placeholder="Receipt #" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Performed By</label>
              <input value={form.performedBy} onChange={e => set('performedBy', e.target.value)}
                className={inp} placeholder="Employee name" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Saving…' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- New Fund Modal ------------------------------------------------------------
const NewFundModal: React.FC<{
  companyId?: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ companyId, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', custodian: '', floatAmount: '', notes: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const float = parseFloat(form.floatAmount);
    if (!form.name.trim())       { toast.error('Fund name is required'); return; }
    if (isNaN(float) || float <= 0) { toast.error('Float amount must be greater than 0'); return; }
    setSaving(true);
    try {
      await api.post('/ovds/petty-cash', {
        name: form.name, custodian: form.custodian || undefined,
        floatAmount: float, notes: form.notes || undefined, companyId,
      });
      toast.success('Petty cash fund created');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create fund');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">New Petty Cash Fund</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Fund Name <span className="text-rose-500">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className={inp} placeholder="e.g. Main Office Petty Cash" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Float Amount (ETB) <span className="text-rose-500">*</span></label>
              <input type="text" min="0" step="0.01" value={form.floatAmount} onChange={e => set('floatAmount', e.target.value)} onBlur={e => set('floatAmount', String(evalMath(e.target.value) ?? e.target.value))} className={inp} placeholder="5000.00" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Custodian</label>
            <input value={form.custodian} onChange={e => set('custodian', e.target.value)}
              className={inp} placeholder="Responsible person" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Wallet size={14} />}
              Create Fund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------
const PettyCash: React.FC = () => {
  usePageTitle('Petty Cash');
  const { selectedCompanyId } = useBusiness();
  const [funds, setFunds]         = useState<any[]>([]);
  const [selected, setSelected]   = useState<any | null>(null);
  const [txModal, setTxModal]     = useState(false);
  const [newFund, setNewFund]     = useState(false);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';
      const res = await api.get(`/ovds/petty-cash${q}`).catch(() => ({ data: [] }));
      const data = res.data?.data ?? res.data ?? [];
      setFunds(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { load(); }, [load]);

  // Refresh selected fund data when transactions are added
  const refreshSelected = useCallback(async () => {
    if (!selected) return;
    try {
      const res = await api.get(`/ovds/petty-cash/${selected.id}`);
      const updated = res.data?.data ?? res.data;
      setSelected(updated);
      setFunds(prev => prev.map(f => f.id === updated.id ? updated : f));
    } catch { /* ignore */ }
  }, [selected]);

  const totalFloat   = funds.reduce((s, f) => s + Number(f.floatAmount),    0);
  const totalBalance = funds.reduce((s, f) => s + Number(f.currentBalance), 0);
  const totalSpent   = totalFloat - totalBalance;

  return (
    <AppPage
      title="Petty Cash"
      subtitle="Imprest fund management — small cash expenditures below WHT threshold · Banking & ovds · Retail & E-commerce · Market Segments · Accounting & ovds Software"
      icon={<Wallet size={18} />}
      iconBg="bg-amber-500"
      crumbs={[{ label: 'ovds' }, { label: 'Petty Cash' }]}
      actions={
        <Btn variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setNewFund(true)}>
          New Fund
        </Btn>
      }
    >
      <div className="space-y-5">

        {/* KPIs */}
        <div className="ovds-stat-row">
          {[
            { label: 'Total Float',       value: fmt(totalFloat),   accent: 'bg-slate-400' },
            { label: 'Current Balance',   value: fmt(totalBalance), accent: 'bg-emerald-500' },
            { label: 'Total Spent (YTD)', value: fmt(totalSpent),   accent: totalSpent > 0 ? 'bg-amber-500' : 'bg-slate-200' },
            { label: 'Active Funds',      value: String(funds.filter(f => f.status === 'ACTIVE').length), accent: 'bg-sky-500' },
          ].map(k => (
            <div key={k.label} className="ovds-kpi-cell">
              <div className={`w-1 h-8 rounded-full shrink-0 ${k.accent}`} />
              <div>
                <p className="ovds-value-sm tabular-nums">{k.value}</p>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ovds-grid-layout cols-1 gap-4 sm:cols-2 lg:cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="ovds-widget-card p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="h-8 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            ))
          ) : funds.length === 0 ? (
            <div className="col-span-full px-5 py-12 text-center ovds-widget-card">
              <Wallet size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No petty cash funds created</p>
              <button onClick={() => setNewFund(true)}
                className="mt-3 px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-medium hover:bg-sky-600 transition-colors">
                Create First Fund
              </button>
            </div>
          ) : (
            funds.map(fund => {
              const balance = Number(fund.currentBalance);
              const float   = Number(fund.floatAmount);
              const pctLeft = float > 0 ? (balance / float) * 100 : 0;
              const isLow   = pctLeft < 20;

              return (
                <div key={fund.id}
                  className={`ovds-widget-card overflow-hidden cursor-pointer hover:shadow-md transition-all ${selected?.id === fund.id ? 'ring-2 ring-sky-400' : ''}`}
                  onClick={() => setSelected(fund.id === selected?.id ? null : fund)}>
                  {/* Balance bar */}
                  <div className="h-1.5 bg-slate-100">
                    <div
                      className={`h-full rounded-r transition-all duration-500 ${isLow ? 'bg-rose-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, pctLeft)}%` }}
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{fund.name}</p>
                        {fund.custodian && <p className="text-xs text-slate-400 mt-0.5">{fund.custodian}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        fund.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>{fund.status}</span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xl font-black tabular-nums text-slate-800">{fmt(balance)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          of {fmt(float)} float · {pctLeft.toFixed(0)}% remaining
                        </p>
                      </div>
                      {isLow && (
                        <div className="flex items-center gap-1 text-rose-500 text-xs font-medium">
                          <AlertTriangle size={12} />
                          Low
                        </div>
                      )}
                    </div>

                    {/* Fund actions */}
                    {selected?.id === fund.id && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={e => { e.stopPropagation(); setTxModal(true); }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-medium transition-colors">
                          <Plus size={12} /> Add Transaction
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setSelected({ ...fund, showTx: true }); }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-white rounded-xl text-xs font-medium transition-colors">
                          <Icon name="HISTORY" size={12} /> History
                        </button>
                      </div>
                    )}

                    {/* Transaction history inline */}
                    {selected?.id === fund.id && selected.showTx && (selected.transactions ?? []).length > 0 && (
                      <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
                        {(fund.transactions ?? []).slice(-10).reverse().map((tx: any, i: number) => {
                          const txCfg = TX_TYPE[tx.type] ?? TX_TYPE.EXPENSE;
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${txCfg.cls}`}>
                                {txCfg.icon} {txCfg.label}
                              </span>
                              <span className="flex-1 truncate text-slate-600">{tx.description}</span>
                              <span className={`tabular-nums font-bold shrink-0 ${tx.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {tx.type === 'EXPENSE' ? '-' : '+'}{fmt(Number(tx.amount))}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* WHT note */}
        <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
          <Info size={13} className="shrink-0 mt-0.5" />
          <div>
            <strong>Withholding Tax (WHT) Alert:</strong> Cash payments for services ≥ ETB 10,000 or goods ≥ ETB 20,000
            require 3% WHT deduction before payment per Proclamation No. 1395/2025.
            Petty cash transactions near these thresholds are flagged automatically.
          </div>
        </div>
      </div>

      {newFund && (
        <NewFundModal
          companyId={selectedCompanyId ?? undefined}
          onClose={() => setNewFund(false)}
          onSaved={load}
        />
      )}
      {txModal && selected && (
        <AddTransactionModal
          fund={selected}
          onClose={() => setTxModal(false)}
          onSaved={refreshSelected}
        />
      )}
    </AppPage>
  );
};

export default PettyCash;

