import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

interface Payment {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  reference?: string;
}

const ClientPortal: React.FC = () => {
  const [view, setView] = useState<'invoices' | 'payments' | 'profile'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const fetchPayments = async (invoiceId: string) => {
    setPaymentsLoading(true);
    try {
      const { data } = await api.get(`/ovds/invoices/${invoiceId}/payments`);
      setPayments(Array.isArray(data) ? data : (data.data ?? data.payments ?? []));
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fmt = (n: number, currency = 'ETB') =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPending = invoices.filter(i => ['PENDING', 'DRAFT'].includes(i.status)).reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + (i.totalAmount || 0), 0);

  const openInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    fetchPayments(inv.id);
    setView('payments');
  };

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pro-azure)] to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm">O</div>
              <div>
                <span className="font-bold text-slate-800 tracking-tight text-sm">OVDS</span>
                <span className="hidden sm:inline text-slate-400 text-xs ml-2">| Client Portal</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-xs font-semibold text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)]">Admin</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
              {[
                { id: 'invoices', label: 'Invoices', icon: '📄' },
                { id: 'payments', label: 'Payments', icon: '💳' },
                { id: 'profile', label: 'Profile', icon: '👤' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id as any); if (item.id !== 'payments') setSelectedInvoice(null); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    view === item.id ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="shrink-0 text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile sidebar */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl p-4 z-50 animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-800 text-sm">Menu</span>
                  <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'invoices', label: 'Invoices', icon: '📄' },
                    { id: 'payments', label: 'Payments', icon: '💳' },
                    { id: 'profile', label: 'Profile', icon: '👤' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setView(item.id as any); setMobileOpen(false); if (item.id !== 'payments') setSelectedInvoice(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        view === item.id ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="shrink-0 text-base">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0">
            {view === 'invoices' && (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
                  <p className="text-sm text-slate-500 mt-1">View and manage your invoices</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid</p>
                    <p className="text-2xl font-bold text-[var(--pro-azure-dark)] mt-1 tabular-nums">{fmt(totalPaid)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{invoices.filter(i => i.status === 'PAID').length} invoices</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{fmt(totalPending)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{invoices.filter(i => ['PENDING', 'DRAFT'].includes(i.status)).length} invoices</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue</p>
                    <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">{fmt(totalOverdue)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{invoices.filter(i => i.status === 'OVERDUE').length} invoices</p>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <p className="text-sm text-slate-500">No invoices yet</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Due Date</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => openInvoice(inv)}>
                            <td className="px-4 py-3 font-medium text-slate-900">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmt(inv.totalAmount, inv.currencyCode)}</td>
                            <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                            <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {view === 'payments' && (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-slate-900">
                    {selectedInvoice ? `Payments — ${selectedInvoice.invoiceNumber}` : 'Payment History'}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedInvoice ? `Total: ${fmt(selectedInvoice.totalAmount, selectedInvoice.currencyCode)}` : 'Select an invoice to view its payment history'}
                  </p>
                </div>

                {selectedInvoice && (
                  <div className="mb-4">
                    <button
                      onClick={() => { setSelectedInvoice(null); setView('invoices'); }}
                      className="text-xs font-semibold text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)]"
                    >
                      ← Back to invoices
                    </button>
                  </div>
                )}

                {paymentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
                    ))}
                  </div>
                ) : !selectedInvoice ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <p className="text-sm text-slate-500">Click on an invoice to view payments</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <p className="text-sm text-slate-500">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-medium text-slate-700">{p.method}</td>
                            <td className="px-4 py-3 text-slate-500">{p.reference || '-'}</td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmt(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {view === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-sm text-slate-500">Profile management coming soon</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;

