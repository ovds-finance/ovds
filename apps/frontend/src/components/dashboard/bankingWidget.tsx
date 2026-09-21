import { fmtCompact } from '@ovds/ui';
import { Landmark, ArrowUpRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import { useApiQuery } from '../../hooks/useApiQuery';


interface Props {
  currency?: string;
}

const BankingWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();

  const { data, loading } = useApiQuery<any>(
    `/accounting/bank-accounts${selectedCompanyId ? `?companyId=${selectedCompanyId}&take=4` : '?take=4'}`,
    { enabled: !!selectedCompanyId, staleTime: 60_000, suppressToast: true }
  );

  const accounts: any[] = data?.data ?? data ?? [];
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  const bankColors = [
    'bg-[var(--pro-azure-50)]0', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500',
  ];

  return (
    <div className="ovds-widget-card">
      <div className="ovds-widget-header">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[var(--pro-azure-50)] flex items-center justify-center">
            <Landmark size={14} className="text-[var(--pro-azure)]" />
          </div>
          <div>
            <h3 className="ovds-card-title">Bank Accounts</h3>
            <p className="ovds-caption">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link to="/banking/accounts" className="flex items-center gap-1 text-[11px] font-semibold text-[var(--pro-azure)] hover:underline">
          Manage accounts <ArrowUpRight size={11} />
        </Link>
      </div>
      <div className="ovds-widget-body">

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 ovds-shimmer shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-slate-100 rounded ovds-shimmer" />
                <div className="h-2.5 w-16 bg-slate-100 rounded ovds-shimmer" />
              </div>
              <div className="h-4 w-20 bg-slate-100 rounded ovds-shimmer" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="ovds-empty">
          <Landmark size={28} className="mb-2 text-slate-200" />
          <p className="text-[12px] font-semibold">No bank accounts</p>
          <Link to="/banking/accounts" className="mt-2 text-[11px] text-[var(--pro-azure)] font-semibold hover:underline">
            Add account →
          </Link>
        </div>
      ) : (
        <>
          {/* Total balance */}
          <div className="mb-4 p-3.5 rounded-xl bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)]">
            <p className="text-[10px] text-[var(--pro-azure)] uppercase tracking-wider mb-0.5">Total Balance</p>
            <p className="text-[22px] font-extrabold text-[var(--pro-azure-dark)] tabular-nums leading-none">
              {fmtCompact(totalBalance, currency)}
            </p>
          </div>

          {/* Account list */}
          <div className="space-y-2.5">
            {accounts.slice(0, 4).map((acc: any, i) => (
              <div key={acc.id ?? i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${bankColors[i % bankColors.length]} flex items-center justify-center shrink-0`}>
                  <Landmark size={13} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{acc.name ?? acc.bankName ?? 'Account'}</p>
                  <p className="ovds-caption">{acc.accountNumber ? `****${String(acc.accountNumber).slice(-4)}` : acc.type ?? 'Checking'}</p>
                </div>
                <p className="text-[13px] font-bold text-slate-700 tabular-nums shrink-0">
                  {fmtCompact(acc.balance ?? 0, currency)}
                </p>
              </div>
            ))}
          </div>

          {accounts.length > 4 && (
            <p className="mt-3 text-center ovds-caption">
              +{accounts.length - 4} more accounts
            </p>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default BankingWidget;

