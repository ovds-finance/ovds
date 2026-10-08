import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface VatDeclaration {
  id: string;
  taxPeriodYear: number;
  taxPeriodMonth: number;
  totalSales: string;
  totalVatOutput: string;
  totalPurchases: string;
  totalVatInput: string;
  netVatDue: string;
  status: string;
  paymentReference: string | null;
}

interface LedgerTransaction {
  id: string;
  referenceNumber: string;
  type: string;
  narration: string;
  createdAt: string;
  _count: { entries: number };
}

interface VatLedgerDashboardProps {
  tenantId?: string;
}

const VatLedgerDashboard: React.FC<VatLedgerDashboardProps> = ({ tenantId }) => {
  const [declarations, setDeclarations] = useState<VatDeclaration[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setError('No tenant ID provided');
      setLoading(false);
      return;
    }
    fetchData(tenantId);
  }, [tenantId]);

  const fetchData = async (tid: string) => {
    setLoading(true);
    try {
      const [declRes, txRes] = await Promise.all([
        api.get(`/api/vat/declarations?tenantId=${tid}`),
        api.get(`/api/ledger/transactions?tenantId=${tid}`),
      ]);
      const declItems = Array.isArray(declRes.data?.data) ? declRes.data.data : (Array.isArray(declRes.data) ? declRes.data : []);
      const txItems = Array.isArray(txRes.data?.data) ? txRes.data.data : (Array.isArray(txRes.data) ? txRes.data : []);
      setDeclarations(declItems);
      setTransactions(txItems);
    } catch {
      setError('Failed to load VAT ledger data');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: string | number, currency = 'ETB') =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(n));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">VAT Ledger Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          VAT declarations and transaction history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total VAT Output</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {fmt(declarations.reduce((sum, d) => sum + Number(d.totalVatOutput), 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total VAT Input</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {fmt(declarations.reduce((sum, d) => sum + Number(d.totalVatInput), 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net VAT Due</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {fmt(declarations.reduce((sum, d) => sum + Number(d.netVatDue), 0))}
          </p>
        </div>
      </div>

      {/* VAT Declarations table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">VAT Declarations</h3>
        </div>
        {declarations.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No declarations found</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Period</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Sales</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">VAT Output</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">VAT Input</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Net Due</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {declarations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {monthNames[d.taxPeriodMonth - 1]} {d.taxPeriodYear}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">{fmt(d.totalSales)}</td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">{fmt(d.totalVatOutput)}</td>
                  <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100 tabular-nums">{fmt(d.totalVatInput)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{fmt(d.netVatDue)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      d.status === 'CLEARED'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : d.status === 'SUBMITTED' || d.status === 'AUDITED'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        : d.status === 'DRAFT'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {d.paymentReference ? d.paymentReference.slice(0, 12) + '…' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recent Journal Transactions</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No transactions found</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ref #</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Narration</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lines</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{tx.referenceNumber}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{tx.type}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{tx.narration}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">{tx._count?.entries ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VatLedgerDashboard;
