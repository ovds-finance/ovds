import { Pagination, SearchBar, Btn, EmptyState } from '@ovds/ui';
import {
  Plus, Download, RefreshCw, Building2, X,
  CreditCard, FileText,
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import { OvdsPageHeader, OvdsStatsStrip } from '../components/ovds';
import { useBusiness } from '../context/businessContext';
import { useApiQuery, usePagination } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { downloadCSV } from '../utils/download';
import { fmtDate, fmtCurrency } from '../utils/fmt';


const fmt = (n: number) => fmtCurrency(n, 'ETB');

const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  BANK_TRANSFER: 'bg-sky-50 text-sky-700',
  CHEQUE: 'bg-violet-50 text-violet-700',
  CARD: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
  MOBILE_MONEY: 'bg-amber-50 text-amber-700',
  OTHER: 'bg-slate-50 text-slate-600',
};

const Payments: React.FC = () => {
  usePageTitle('Payments');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const pagination = usePagination({ initialTake: 15 });

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, _setDateFrom] = useState('');
  const [dateTo, _setDateTo] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ billId: '', amount: '', method: 'CASH', paidAt: '', reference: '', notes: '' });
  const [bills, setBills] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedCompanyId) return;
    api.get(`/ovds/bills?companyId=${selectedCompanyId}&status=PENDING&take=100`, { headers: { 'x-background': '1' } })
      .then((res: any) => {
        const raw = res.data?.data ?? res.data;
        setBills(Array.isArray(raw) ? raw : (raw?.data ?? []));
      })
      .catch(() => setBills([]));
  }, [selectedCompanyId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.billId || !paymentForm.amount) return toast.error('Bill and amount are required');
    setSaving(true);
    try {
      await api.post(`/ovds/bills/${paymentForm.billId}/payments`, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        paidAt: paymentForm.paidAt ? new Date(paymentForm.paidAt).toISOString() : undefined,
        reference: paymentForm.reference || null,
        notes: paymentForm.notes || null,
      });
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      setPaymentForm({ billId: '', amount: '', method: 'CASH', paidAt: '', reference: '', notes: '' });
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const paymentsUrl = selectedCompanyId
    ? `/ovds/purchases/payments?companyId=${selectedCompanyId}&take=${pagination.take}&page=${pagination.page}${methodFilter ? `&method=${methodFilter}` : ''}${dateFrom ? `&dateFrom=${dateFrom}` : ''}${dateTo ? `&dateTo=${dateTo}` : ''}`
    : '/ovds/purchases/payments';

  const {
    data: paymentsData,
    loading,
    refetch: fetchPayments,
  } = useApiQuery<any>(paymentsUrl, {
    enabled: !!selectedCompanyId,
    pollInterval: 120_000,
  });

  const totalCount = paymentsData?.pagination?.total ?? 0;

  const payments = useMemo(() => paymentsData?.data ?? [], [paymentsData]);

  const filtered = useMemo(() => {
    let list = payments;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) =>
        (p.bill?.billNumber ?? '').toLowerCase().includes(q) ||
        (p.bill?.vendorName ?? '').toLowerCase().includes(q) ||
        (p.reference ?? '').toLowerCase().includes(q)
      );
    }
    if (methodFilter) {
      list = list.filter((p: any) => (p.method ?? 'OTHER') === methodFilter);
    }
    if (dateFrom) {
      list = list.filter((p: any) => new Date(p.paidAt) >= new Date(dateFrom));
    }
    if (dateTo) {
      list = list.filter((p: any) => new Date(p.paidAt) <= new Date(dateTo + 'T23:59:59'));
    }
    return list;
  }, [payments, search, methodFilter, dateFrom, dateTo]);

  const totalPaid = useMemo(() => filtered.reduce((s: number, p: any) => s + Number(p.amount), 0), [filtered]);

  const handleExport = () => {
    if (!filtered.length) return;
    const headers = 'Bill #,Vendor,Method,Amount,Reference,Date,Notes\n';
    const rows = filtered.map((p: any) =>
      `"${p.bill?.billNumber ?? ''}","${p.bill?.vendorName ?? ''}","${p.method ?? ''}",${fmt(p.amount)},"${p.reference ?? ''}","${fmtDate(p.paidAt)}","${(p.notes ?? '').replace(/"/g, '""')}"`
    ).join('\n');
    downloadCSV(headers + rows, `payments_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Payments exported');
  };

  const methods = useMemo(() => {
    const raw = paymentsData?.data ?? [];
    const set = new Set(raw.map((p: any) => p.method ?? 'OTHER'));
    return Array.from(set) as string[];
  }, [paymentsData]);

  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((p: any) => {
      const m = p.method ?? 'OTHER';
      map[m] = (map[m] || 0) + Number(p.amount);
    });
    return Object.entries(map)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  return (
    <div className="min-h-full bg-white animate-in fade-in duration-300">
      <OvdsPageHeader
        title="Payments"
        subtitle="Recorded vendor payments · Accounts Payable · Supply Chain"
        icon={<CreditCard size={16} />}
        iconBg="bg-sky-500"
        onRefresh={fetchPayments}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Download size={13} /> Export
            </button>
            {can('bills:write') && (
              <button onClick={() => setShowPaymentModal(true)} className="ovds-btn-primary">
                <Plus size={14} /> Record Payment
              </button>
            )}
          </div>
        }
      />

      <div className="p-4 sm:p-5 space-y-4">
        <OvdsStatsStrip
          loading={loading && !payments.length}
          stats={[
            {
              label: 'Total Payments',
              tooltip: 'Total value of recorded payments',
              value: fmt(totalPaid),
              sub: `${filtered.length} records`,
              icon: <CreditCard size={15} />,
              iconBg: 'bg-sky-50',
              iconColor: 'text-sky-600',
            },
            {
              label: 'This View',
              tooltip: 'Filtered payment count',
              value: filtered.length,
              sub: `${totalCount} total`,
              icon: <FileText size={15} />,
              iconBg: 'bg-slate-100',
              iconColor: 'text-slate-600',
            },
          ]}
        />

        {methodBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Method Breakdown</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={methodBreakdown} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="method" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a8b8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtCurrency(v)} width={80} />
                <Tooltip
                  formatter={(v: any) => [fmtCurrency(Number(v), 'ETB'), '']}
                  contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                  {methodBreakdown.map((entry) => (
                    <Bar key={entry.method} dataKey="amount" fill={METHOD_COLORS[entry.method]?.includes('indigo') ? '#10b981' : METHOD_COLORS[entry.method]?.includes('sky') ? '#0ea5e9' : METHOD_COLORS[entry.method]?.includes('violet') ? '#8b5cf6' : METHOD_COLORS[entry.method]?.includes('indigo') ? '#4FBA6F' : METHOD_COLORS[entry.method]?.includes('amber') ? '#f59e0b' : '#64748b'} radius={[3, 3, 0, 0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by bill #, vendor, reference..." className="flex-1" />
              <div className="flex items-center gap-2">
                <Btn variant="secondary" size="sm" onClick={handleExport} icon={<Download size={12} />}>Export CSV</Btn>
                <Btn variant="secondary" size="sm" onClick={() => fetchPayments()} icon={<RefreshCw size={12} />}>Refresh</Btn>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Method:</span>
              <button
                onClick={() => setMethodFilter('')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${!methodFilter ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                All
              </button>
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(methodFilter === m ? '' : m)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${methodFilter === m ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {m.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading && payments.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <RefreshCw size={20} className="animate-spin text-slate-300" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState title="No payments found" desc={search || methodFilter || dateFrom || dateTo ? "Try adjusting your filters" : "Payments will appear here"} />
            ) : (
              <table className="w-full text-left ovds-table">
                <thead>
                  <tr>
                    <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100">Bill</th>
                    <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100">Vendor</th>
                    <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100">Method</th>
                    <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100 text-right">Amount</th>
                    <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100">Reference</th>
                    <th className="px-5 py-3 ovds-label bg-white border-b border-slate-100">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <Link to={`/purchases/bills/${p.billId}`} className="text-xs font-bold text-slate-800 hover:text-[var(--pro-azure)] transition-colors font-mono">
                          {p.bill?.billNumber ?? p.billId?.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                            <Building2 size={12} />
                          </div>
                          <span className="text-xs text-slate-600">{p.bill?.vendorName ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${METHOD_COLORS[p.method ?? 'OTHER'] ?? METHOD_COLORS.OTHER}`}>
                          {(p.method ?? 'OTHER').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{fmt(p.amount)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-500 font-mono">{p.reference ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-500">{fmtDate(p.paidAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalCount > pagination.take && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Showing {Math.min((pagination.page - 1) * pagination.take + 1, totalCount)}–{Math.min(pagination.page * pagination.take, totalCount)} of {totalCount}
              </p>
              <Pagination
                page={pagination.page}
                total={totalCount}
                pageSize={pagination.take}
                onChange={(p) => pagination.goTo(p)}
              />
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-sky-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center">
                  <CreditCard size={15} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Record Payment</p>
                  <p className="text-[10px] text-slate-400">Log a vendor payment against a bill</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Bill *</label>
                <select
                  value={paymentForm.billId}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, billId: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-sky-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 transition-all"
                >
                  <option value="">Select bill…</option>
                  {bills.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} — {b.vendorName ?? 'Unknown'} (ETB {fmt(b.total)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Amount (ETB) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-sky-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-sky-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 transition-all"
                  >
                    {['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'MOBILE_MONEY', 'OTHER'].map((m) => (
                      <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Date</label>
                  <input
                    type="date"
                    value={paymentForm.paidAt}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, paidAt: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-sky-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Reference</label>
                  <input
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-sky-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 transition-all"
                    placeholder="Cheque / Txn ID"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white border border-sky-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 transition-all resize-none"
                  placeholder="Optional notes…"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2.5 border border-sky-200 text-sky-700 rounded-xl text-sm font-bold hover:bg-sky-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Recording…</> : <><CreditCard size={14} /> Record Payment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
