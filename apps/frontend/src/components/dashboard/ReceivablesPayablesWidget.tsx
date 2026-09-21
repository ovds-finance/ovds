/**
 * ReceivablesPayablesWidget
 * Ovds-style dual card: Receivables (AR) left / Payables (AP) right
 * Shows Open + Overdue split with "View Report" link for each side.
 */
import { fmtCompact } from '@ovds/ui';
import { ArrowDownLeft, ArrowUpRight, AlertCircle, ExternalLink } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import { useApiQuery } from '../../hooks/useApiQuery';


interface Props {
  currency?: string;
}

interface AmountRowProps {
  label: string;
  value: number;
  currency: string;
  variant: 'open' | 'overdue';
}

const AmountRow: React.FC<AmountRowProps> = ({ label, value, currency, variant }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          variant === 'overdue' ? 'bg-rose-400' : 'bg-[var(--pro-azure-light)]'
        }`}
      />
      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</span>
    </div>
    <span
      className={`text-[13px] font-bold tabular-nums ${
        variant === 'overdue'
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      {fmtCompact(value, currency)}
    </span>
  </div>
);

const ReceivablesPayablesWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();

  const { data, loading } = useApiQuery<any>(
    `/ovds/invoices/stats${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 30_000, suppressToast: true }
  );

  // Receivables
  const totalAR       = data?.totalUnpaidInvoices ?? data?.totalAR ?? 0;
  const openAR        = data?.openInvoicesAmount ?? data?.openAR ?? totalAR;
  const overdueAR     = data?.overdueInvoicesAmount ?? data?.overdueAmount ?? 0;
  const overdueCount  = data?.overdueCount ?? 0;

  // Payables
  const totalAP       = data?.totalUnpaidBills ?? data?.totalAP ?? data?.totalBills ?? 0;
  const openAP        = data?.openBillsAmount ?? data?.openAP ?? totalAP;
  const overdueAP     = data?.overdueBillsAmount ?? data?.overdueBillsAmount ?? 0;
  const overdueAPCount = data?.overdueBillsCount ?? 0;

  const shimmerRow = (
    <div className="space-y-2.5 py-1">
      {[1, 2].map(i => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
          <div className="h-3.5 w-16 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4">

      {/* ── Receivables ── */}
      <div className="ovds-widget-card overflow-hidden">
        {/* top accent */}
        <div className="h-[3px] bg-[var(--pro-azure-50)]0 rounded-t-[inherit]" />
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/30 flex items-center justify-center shrink-0">
                <ArrowDownLeft size={14} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">Receivables</h3>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Amount yet to receive from customers</p>
              </div>
            </div>
            <Link
              to="/reports?type=ar-aging"
              className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline shrink-0"
            >
              View Report <ExternalLink size={9} />
            </Link>
          </div>

          {/* Total */}
          <div className="mt-3 mb-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total unpaid invoices</p>
            {loading ? (
              <div className="h-6 w-28 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer mt-1" />
            ) : (
              <p className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 tabular-nums leading-none mt-0.5">
                {fmtCompact(totalAR, currency)}
              </p>
            )}
          </div>

          {loading ? shimmerRow : (
            <div>
              <AmountRow label="Open" value={openAR} currency={currency} variant="open" />
              <AmountRow label="Overdue" value={overdueAR} currency={currency} variant="overdue" />
            </div>
          )}

          {overdueCount > 0 && !loading && (
            <Link
              to="/sales/invoices"
              className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <AlertCircle size={10} /> {overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* ── Payables ── */}
      <div className="ovds-widget-card overflow-hidden">
        {/* top accent */}
        <div className="h-[3px] bg-rose-400 rounded-t-[inherit]" />
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                <ArrowUpRight size={14} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">Payables</h3>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Amount yet to pay to your vendors</p>
              </div>
            </div>
            <Link
              to="/reports?type=ap-aging"
              className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline shrink-0"
            >
              View Report <ExternalLink size={9} />
            </Link>
          </div>

          {/* Total */}
          <div className="mt-3 mb-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total unpaid bills</p>
            {loading ? (
              <div className="h-6 w-28 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer mt-1" />
            ) : (
              <p className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 tabular-nums leading-none mt-0.5">
                {fmtCompact(totalAP, currency)}
              </p>
            )}
          </div>

          {loading ? shimmerRow : (
            <div>
              <AmountRow label="Open" value={openAP} currency={currency} variant="open" />
              <AmountRow label="Overdue" value={overdueAP} currency={currency} variant="overdue" />
            </div>
          )}

          {overdueAPCount > 0 && !loading && (
            <Link
              to="/purchases/bills"
              className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <AlertCircle size={10} /> {overdueAPCount} overdue bill{overdueAPCount !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceivablesPayablesWidget;
