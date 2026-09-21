/**
 * ovdsRecentActivity — ovds-style recent transactions feed
 * Shows invoices and bills in a unified timeline with plain-language status labels
 */
import { FileText, Receipt, ArrowRight, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { fmtRelative, fmtCompact } from '../../utils/fmt';

function fmtAmt(n: number, currency = 'ETB'): string {
  return fmtCompact(Math.abs(n), currency);
}

const fmtDate = fmtRelative;

interface ActivityItem {
  id: string;
  type: 'invoice' | 'bill' | 'expense' | 'payment';
  number: string;
  party: string;       // customer or vendor name
  amount: number;
  currency?: string;
  status: string;
  date: string;
}

interface ovdsRecentActivityProps {
  invoices?: any[];
  bills?: any[];
  loading?: boolean;
  currency?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  PAID:      { label: 'Paid',      icon: <CheckCircle2 size={11} />, cls: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]' },
  PENDING:   { label: 'Pending',   icon: <Clock size={11} />,        cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  OVERDUE:   { label: 'Overdue',   icon: <AlertTriangle size={11} />,cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  DRAFT:     { label: 'Draft',     icon: <FileText size={11} />,     cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle size={11} />,      cls: 'bg-slate-100 text-slate-400 border-slate-200' },
  SENT:      { label: 'Sent',      icon: <CheckCircle2 size={11} />, cls: 'bg-sky-50 text-sky-700 border-sky-100' },
};

export const ovdsRecentActivity: React.FC<ovdsRecentActivityProps> = ({
  invoices = [], bills = [], loading, currency = 'ETB',
}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = useNavigate();

  // Merge and sort by date
  const items: ActivityItem[] = [
    ...invoices.slice(0, 5).map((inv: any) => ({
      id: inv.id,
      type: 'invoice' as const,
      number: inv.invoiceNumber ?? inv.number ?? '—',
      party: inv.customer ?? inv.customerName ?? '—',
      amount: parseFloat(inv.totalAmount ?? inv.total ?? 0),
      currency: inv.invoiceCurrency ?? currency,
      status: (inv.status ?? 'DRAFT').toUpperCase(),
      date: inv.date ?? inv.createdAt ?? '',
    })),
    ...bills.slice(0, 5).map((bill: any) => ({
      id: bill.id,
      type: 'bill' as const,
      number: bill.billNumber ?? '—',
      party: bill.vendor ?? bill.vendorName ?? '—',
      amount: parseFloat(bill.total ?? bill.amount ?? 0),
      currency: bill.currencyCode ?? currency,
      status: (bill.status ?? 'PENDING').toUpperCase(),
      date: bill.date ?? bill.createdAt ?? '',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* Header */}
      <div className="ovds-widget-header">
        <h3 className="ovds-card-title">Recent Activity</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/sales/invoices')}
            className="text-[10px] text-[var(--pro-azure)] hover:underline font-semibold flex items-center gap-0.5"
          >
            Invoices <ArrowRight size={9} />
          </button>
          <span className="text-slate-200 dark:text-slate-700">·</span>
          <button
            onClick={() => navigate('/purchases/bills')}
            className="text-[10px] text-[var(--pro-azure)] hover:underline font-semibold flex items-center gap-0.5"
          >
            Bills <ArrowRight size={9} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-slate-100 rounded w-1/3 mb-1.5" />
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="h-4 bg-slate-100 rounded w-16" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center mb-2">
              <FileText size={18} className="text-slate-300" />
            </div>
            <p className="text-[12px] font-semibold text-slate-500">No recent activity</p>
            <p className="ovds-caption mt-0.5">Create your first invoice to get started</p>
          </div>
        ) : (
          items.map(item => {
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.DRAFT;
            const isInvoice = item.type === 'invoice';
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(isInvoice ? '/sales/invoices' : '/purchases/bills')}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                {/* Type icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isInvoice ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure)]' : 'bg-amber-50 text-amber-600'
                }`}>
                  {isInvoice ? <FileText size={14} /> : <Receipt size={14} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">{item.number}</p>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${statusCfg.cls}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.party}</p>
                </div>

                {/* Amount + date */}
                <div className="text-right shrink-0">
                  <p className={`text-[12px] font-bold tabular-nums ${
                    isInvoice ? 'text-[var(--pro-azure)]' : 'text-rose-500'
                  }`}>
                    {isInvoice ? '+' : '-'}{fmtAmt(item.amount, item.currency)}
                  </p>
                  <p className="ovds-caption mt-0.5">{fmtDate(item.date)}</p>
                </div>

                <ArrowRight size={12} className="text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ovdsRecentActivity;

