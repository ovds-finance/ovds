import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Payment {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  reference?: string;
  invoiceNumber?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currencyCode?: string;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        api.get('/ovds/invoices?limit=50&page=1'),
        api.get('/ovds/invoices/payments?limit=50&page=1'),
      ]);
      const invItems = Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : (Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setInvoices(invItems);
      const payItems = Array.isArray(paymentsRes.data?.data) ? paymentsRes.data.data : (Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setPayments(payItems);
    } catch {
      setInvoices([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number, currency = 'ETB') =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

  const filteredPayments = selectedInvoiceId
    ? payments.filter(p => {
        const inv = invoices.find(i => i.id === selectedInvoiceId);
        return p.invoiceNumber === inv?.invoiceNumber;
      })
    : payments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payments</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your payment history</p>
      </div>

      {/* Invoice filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Filter by Invoice
        </label>
        <select
          value={selectedInvoiceId ?? ''}
          onChange={(e) => setSelectedInvoiceId(e.target.value || null)}
          className="w-full max-w-md px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="">All invoices</option>
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.invoiceNumber} — {fmt(inv.totalAmount, inv.currencyCode)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No payments found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(p.paidAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {p.invoiceNumber || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.method}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.reference || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {fmt(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;
