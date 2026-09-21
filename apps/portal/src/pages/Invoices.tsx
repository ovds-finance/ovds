import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  dueDate: string;
  customerName?: string;
  currencyCode?: string;
  date?: string;
  subtotal?: number;
  vatAmount?: number;
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ovds/invoices?limit=50&page=1');
      const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      setInvoices(items);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number, currency = 'ETB') =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPending = invoices.filter(i => ['PENDING', 'DRAFT'].includes(i.status)).reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + (i.totalAmount || 0), 0);

  const statusBadge = (status: string) => {
    const cfg: Record<string, { cls: string; label: string }> = {
      PAID: { cls: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]', label: 'Paid' },
      PENDING: { cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
      OVERDUE: { cls: 'bg-rose-100 text-rose-700', label: 'Overdue' },
      DRAFT: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
      PARTIAL: { cls: 'bg-sky-100 text-sky-700', label: 'Partial' },
      CANCELLED: { cls: 'bg-slate-100 text-slate-500', label: 'Cancelled' },
    };
    const c = cfg[status] ?? { cls: 'bg-slate-100 text-slate-600', label: status };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${c.cls}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Invoices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and manage your invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Paid</p>
          <p className="text-2xl font-bold text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] mt-1 tabular-nums">{fmt(totalPaid)}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{invoices.filter(i => i.status === 'PAID').length} invoices</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Open</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">{fmt(totalPending)}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{invoices.filter(i => ['PENDING', 'DRAFT'].includes(i.status)).length} invoices</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1 tabular-nums">{fmt(totalOverdue)}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{invoices.filter(i => i.status === 'OVERDUE').length} invoices</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No invoices yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Due Date</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {inv.date ? new Date(inv.date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {fmt(inv.totalAmount, inv.currencyCode)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Invoices;

