import React, {  } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../ui';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
  date: string;
  status?: string;
  reference?: string;
}

interface LatestTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
  currency?: string;
  onViewAll?: () => void;
}

const LatestTransactions: React.FC<LatestTransactionsProps> = ({
  transactions,
  loading = false,
  currency = 'ETB',
  onViewAll,
}) => {
  const navigate = useNavigate();

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-ET', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

  const statusBadge = (status?: string) => {
    if (!status) return null;
    const cfg: Record<string, { cls: string; label: string }> = {
      PAID: { cls: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]', label: 'Paid' },
      PENDING: { cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
      OVERDUE: { cls: 'bg-rose-100 text-rose-700', label: 'Overdue' },
      PARTIAL: { cls: 'bg-sky-100 text-sky-700', label: 'Partial' },
    };
    const c = cfg[status];
    if (!c) return null;
    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.cls}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Latest Transactions</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Smart inline math for quantities & amounts</p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-bold text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] transition-colors"
          >
            View all
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-2">Description</th>
              <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-2 text-right">Amount</th>
              <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-2 hidden sm:table-cell">Date</th>
              <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 text-right hidden md:table-cell">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="py-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/sales/invoices')}
                >
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'in'
                          ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure)]'
                          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                      }`}>
                        <Icon name={tx.type === 'in' ? 'ARROW_DOWN' : 'ARROW_UP'} size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                          {tx.description}
                        </p>
                        {tx.reference && (
                          <p className="text-[10px] text-slate-400 truncate">{tx.reference}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-right">
                    <span className={`text-xs font-bold tabular-nums ${
                      tx.type === 'in' ? 'text-[var(--pro-azure)]' : 'text-rose-600'
                    }`}>
                      {tx.type === 'in' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right hidden sm:table-cell">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(tx.date).toLocaleDateString('en-ET', { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-2.5 text-right hidden md:table-cell">
                    {statusBadge(tx.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LatestTransactions;
