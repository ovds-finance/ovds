/**
 * AccountBalanceWidget
 * Ovds-style "Account Balance" card:
 * Shows current bank account balances.
 * CTA to connect bank accounts if none exist.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, Plus, Link2, ArrowUpRight } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useBusiness } from '../../context/businessContext';
import { fmtCompact } from '@ovds/ui';

interface Props {
  currency?: string;
}

const ACCOUNT_COLORS = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];

const AccountBalanceWidget: React.FC<Props> = ({ currency = 'ETB' }) => {
  const { selectedCompanyId } = useBusiness();

  const { data, loading } = useApiQuery<any>(
    `/banking/accounts${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`,
    { enabled: !!selectedCompanyId, staleTime: 60_000, suppressToast: true }
  );

  const raw = data?.data ?? data;
  const accounts: any[] = Array.isArray(raw) ? raw : [];
  const totalBalance = accounts.reduce((s, a) => s + Number(a?.balance ?? a?.computedBalance ?? 0), 0);

  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="h-[3px] bg-emerald-600 rounded-t-[inherit]" />
      <div className="p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
              <Landmark size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">Account Balance</h3>
              <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Current balance of your bank accounts</p>
            </div>
          </div>
          <Link
            to="/banking/accounts"
            className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
          >
            Manage <ArrowUpRight size={9} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 ovds-shimmer shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
                  <div className="h-2 w-14 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
                </div>
                <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded ovds-shimmer" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          /* ─── Empty state: connect bank CTA ─── */
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center mb-2.5">
              <Link2 size={18} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Connect Bank Accounts</p>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed max-w-[200px]">
              Import your transactions automatically by connecting your bank accounts
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/banking/accounts"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-colors"
              >
                <Plus size={11} /> New Account
              </Link>
              <Link
                to="/banking/statement-import"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold transition-colors"
              >
                <Link2 size={11} /> Connect
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Total balance summary */}
            <div className="flex items-center justify-between mb-3 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Total Balance</span>
              <span className="text-[15px] font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {fmtCompact(totalBalance, currency)}
              </span>
            </div>

            {/* Account rows */}
            <div className="space-y-2">
              {accounts.slice(0, 4).map((acc: any, i: number) => (
                <div key={acc.id ?? i} className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <div className={`w-7 h-7 rounded-lg ${ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]} flex items-center justify-center shrink-0`}>
                    <Landmark size={12} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">
                      {String(acc.name ?? acc.bankName ?? 'Account')}
                    </p>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      {acc.accountNumber ? `****${String(acc.accountNumber ?? '').slice(-4)}` : (acc.type ? String(acc.type) : 'Cash')}
                    </p>
                  </div>
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
                    {fmtCompact(Number(acc.balance ?? acc.computedBalance ?? 0), currency)}
                  </p>
                </div>
              ))}
              {accounts.length > 4 && (
                <Link
                  to="/banking/accounts"
                  className="block text-center text-[10px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors pt-1"
                >
                  +{accounts.length - 4} more accounts
                </Link>
              )}
            </div>

            {/* Connect more CTA */}
            <Link
              to="/banking/statement-import"
              className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Link2 size={10} /> Connect more bank accounts
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountBalanceWidget;
