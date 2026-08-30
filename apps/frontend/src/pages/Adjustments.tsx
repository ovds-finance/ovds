/**
 * Adjustments — Dedicated inventory stock adjustment page
 *
 * Route: /inventory/adjustments
 *
 * Records positive (receipt) and negative (write-off/shrinkage) stock
 * adjustments with full audit trail. Cost variance auto-journals via the
 * double-entry engine on the backend.
 */
import React, { useState } from 'react';
import {
  PackagePlus, PackageMinus, RefreshCw,
  Plus, ClipboardList, Search, Filter, ChevronDown,
  TrendingUp, TrendingDown, CheckCircle2,
} from 'lucide-react';
import { AppPage, EmptyState, Skeleton, StatusBadge } from '@ovds/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { fmtCurrency, fmtDate, fmtNum } from '../utils/fmt';
import toast from 'react-hot-toast';
import api from '../services/api';
import Can from '../components/can';

type AdjustmentType = 'POSITIVE' | 'NEGATIVE';
type AdjustmentReason =
  | 'STOCKTAKE'
  | 'DAMAGE'
  | 'THEFT'
  | 'EXPIRY'
  | 'OPENING_STOCK'
  | 'RETURN'
  | 'CORRECTION'
  | 'OTHER';

interface StockAdjustment {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  warehouseId: string;
  warehouseName: string;
  type: AdjustmentType;
  reason: AdjustmentReason;
  quantity: number;
  unitCost: number;
  totalValue: number;
  notes: string | null;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  journalEntryId: string | null;
  createdAt: string;
  createdBy: string;
  postedAt: string | null;
}

const REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'STOCKTAKE', label: 'Stocktake' },
  { value: 'DAMAGE', label: 'Damage / Spoilage' },
  { value: 'THEFT', label: 'Theft / Loss' },
  { value: 'EXPIRY', label: 'Expiry' },
  { value: 'OPENING_STOCK', label: 'Opening Stock' },
  { value: 'RETURN', label: 'Return to Vendor' },
  { value: 'CORRECTION', label: 'Data Correction' },
  { value: 'OTHER', label: 'Other' },
];

// Map adjustment status → @ovds/shared StatusVariant
const STATUS_MAP: Record<string, string> = {
  DRAFT: 'pending',
  POSTED: 'settled',
  REVERSED: 'overdue',
};

const Adjustments: React.FC = () => {
  usePageTitle('Stock Adjustments');
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AdjustmentType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    itemId: '',
    warehouseId: '',
    type: 'POSITIVE' as AdjustmentType,
    reason: 'STOCKTAKE' as AdjustmentReason,
    quantity: '',
    unitCost: '',
    notes: '',
  });

  const { data, loading, error, refetch } = useApiQuery<StockAdjustment[]>(
    `/inventory/adjustments?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId },
  );

  const { data: items } = useApiQuery<{ id: string; name: string; code: string; unitCost: number }[]>(
    `/inventory/items?companyId=${selectedCompanyId}&limit=500`,
    { enabled: !!selectedCompanyId },
  );

  const { data: warehouses } = useApiQuery<{ id: string; name: string }[]>(
    `/inventory/warehouses?companyId=${selectedCompanyId}`,
    { enabled: !!selectedCompanyId },
  );

  const filtered = (data ?? []).filter((adj) => {
    const matchesType = !typeFilter || adj.type === typeFilter;
    const matchesSearch =
      !search ||
      adj.itemName.toLowerCase().includes(search.toLowerCase()) ||
      adj.itemCode.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totals = {
    positive: filtered.filter((a) => a.type === 'POSITIVE').reduce((s, a) => s + a.totalValue, 0),
    negative: filtered.filter((a) => a.type === 'NEGATIVE').reduce((s, a) => s + a.totalValue, 0),
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemId || !form.warehouseId || !form.quantity) {
      toast.error('Item, warehouse, and quantity are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/inventory/adjustments', {
        ...form,
        companyId: selectedCompanyId,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
      });
      toast.success('Adjustment recorded');
      setShowModal(false);
      setForm({ itemId: '', warehouseId: '', type: 'POSITIVE', reason: 'STOCKTAKE', quantity: '', unitCost: '', notes: '' });
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save adjustment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppPage title="Stock Adjustments">
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4].map((i) => <Skeleton.Line key={i} className="h-16 rounded-2xl" />)}
        </div>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage title="Stock Adjustments">
        <EmptyState variant="error" message="Failed to load adjustments" action={{ label: 'Retry', onClick: refetch }} />
      </AppPage>
    );
  }

  return (
    <AppPage title="Stock Adjustments">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Stock Adjustments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Record positive and negative adjustments — auto-journals on posting</p>
        </div>
        <Can permission="items:write">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus size={14} /> New Adjustment
          </button>
        </Can>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <TrendingUp size={16} />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Positive</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{fmtCurrency(totals.positive, 'ETB')}</p>
          </div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
            <TrendingDown size={16} />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-600">Negative</p>
            <p className="text-lg font-black text-rose-700 dark:text-rose-300">{fmtCurrency(totals.negative, 'ETB')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by item name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
          />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AdjustmentType | '')}
            className="pl-8 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30 appearance-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="POSITIVE">Positive (+)</option>
            <option value="NEGATIVE">Negative (−)</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} className="text-slate-300" />}
          message={search || typeFilter ? 'No adjustments match your filters' : 'No stock adjustments recorded yet'}
          action={
            search || typeFilter
              ? { label: 'Clear filters', onClick: () => { setSearch(''); setTypeFilter(''); } }
              : { label: 'New Adjustment', onClick: () => setShowModal(true) }
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {['Date', 'Item', 'Warehouse', 'Type', 'Reason', 'Qty', 'Value', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((adj) => (
                  <tr
                    key={adj.id}
                    className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(adj.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{adj.itemName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{adj.itemCode}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{adj.warehouseName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-black rounded-lg px-2 py-0.5 ${adj.type === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                        {adj.type === 'POSITIVE' ? <PackagePlus size={11} /> : <PackageMinus size={11} />}
                        {adj.type === 'POSITIVE' ? '+' : '−'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{REASONS.find((r) => r.value === adj.reason)?.label ?? adj.reason}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200">
                      {adj.type === 'NEGATIVE' ? '−' : '+'}{fmtNum(adj.quantity)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200">
                      {fmtCurrency(adj.totalValue, 'ETB')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_MAP[adj.status] ?? 'pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-black text-slate-800 dark:text-slate-100">New Stock Adjustment</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Item *</label>
                  <select
                    value={form.itemId}
                    onChange={(e) => {
                      const item = (items ?? []).find((i) => i.id === e.target.value);
                      setForm((f) => ({ ...f, itemId: e.target.value, unitCost: item?.unitCost?.toString() ?? '' }));
                    }}
                    required
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30"
                  >
                    <option value="">Select item…</option>
                    {(items ?? []).map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Warehouse *</label>
                  <select
                    value={form.warehouseId}
                    onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30"
                  >
                    <option value="">Select warehouse…</option>
                    {(warehouses ?? []).map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AdjustmentType }))}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30"
                  >
                    <option value="POSITIVE">Positive (+) — Increase stock</option>
                    <option value="NEGATIVE">Negative (−) — Decrease stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Reason *</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value as AdjustmentReason }))}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30"
                  >
                    {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    required
                    placeholder="0"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Unit Cost (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.unitCost}
                    onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Optional notes…"
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-black bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-all disabled:opacity-60"
                >
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  {saving ? 'Saving…' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default Adjustments;
