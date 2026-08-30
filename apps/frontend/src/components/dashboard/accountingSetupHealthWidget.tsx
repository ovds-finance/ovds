/**
 * AccountingSetupHealthWidget
 *
 * Shows accounting setup completeness on the Dashboard:
 *   ✅ Chart of Accounts — seeded
 *   ✅ Opening Balances  — posted (IAS 1.104)
 *   ✅ COGS Coverage     — Inventory + COGS accounts exist
 *   ✅ Tax Accounts      — VAT Payable, AP, AR configured
 *   ✅ Bank Accounts     — at least one bank connected
 *
 * Links directly to the relevant setup pages.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';
import api from '../../services/api';

interface HealthCheck {
  label:    string;
  ok:       boolean;
  warning?: boolean;
  to:       string;
  detail?:  string;
}

interface Props {
  companyId?: string;
}

const AccountingSetupHealthWidget: React.FC<Props> = ({ companyId }) => {
  const [checks, setChecks]   = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore]     = useState(0);

  useEffect(() => {
    const q = companyId ? `?companyId=${companyId}` : '';

    Promise.all([
      // 1. Chart of accounts
      api.get(`/accounting/accounts${q}`).catch(() => ({ data: { data: [] } })),
      // 2. Opening balances
      api.get(`/ovds/accounting/opening-balance-status${q}`).catch(() => ({ data: null })),
      // 3. Bank accounts
      api.get(`/accounting/bank-accounts${q}`).catch(() => ({ data: { data: [] } })),
    ]).then(([acctRes, obRes, bankRes]) => {
      const accounts: any[] = acctRes.data?.data ?? acctRes.data ?? [];
      const ob:       any   = obRes.data?.data   ?? obRes.data   ?? null;
      const banks:    any[] = bankRes.data?.data  ?? bankRes.data ?? [];

      const hasAccounts   = accounts.length > 0;
      const hasOB         = ob?.hasOpeningBalances === true;
      const hasCOGS       = accounts.some((a: any) => a.category === 'COST_OF_GOODS_SOLD');
      const hasInventory  = accounts.some((a: any) => a.category === 'INVENTORY');
      const hasVatPayable = accounts.some((a: any) => a.category === 'CURRENT_LIABILITY' && (a.name as string).toLowerCase().includes('vat'));
      const hasAR         = accounts.some((a: any) => a.category === 'ACCOUNTS_RECEIVABLE');
      const hasAP         = accounts.some((a: any) => a.category === 'ACCOUNTS_PAYABLE');
      const hasBank       = banks.length > 0 || accounts.some((a: any) => a.category === 'BANK');

      const result: HealthCheck[] = [
        {
          label:   'Chart of Accounts',
          ok:      hasAccounts,
          to:      '/accounting',
          detail:  hasAccounts ? `${accounts.length} accounts` : 'No accounts — seed defaults first',
        },
        {
          label:   'Opening Balances (IAS 1)',
          ok:      hasOB,
          warning: !hasOB,
          to:      '/accounting/opening-balances',
          detail:  hasOB
            ? `Posted ${ob.openingDate ?? ''} · ${ob.accountsWithBalance} accounts`
            : 'Not posted — comparative balance sheet will be inaccurate',
        },
        {
          label:   'COGS & Inventory Accounts',
          ok:      hasCOGS && hasInventory,
          warning: hasAccounts && (!hasCOGS || !hasInventory),
          to:      '/accounting',
          detail:  hasCOGS && hasInventory
            ? 'COGS + Inventory accounts found'
            : 'Missing — product invoices won\'t reduce inventory or post COGS',
        },
        {
          label:   'AR / AP / VAT Payable',
          ok:      hasAR && hasAP && hasVatPayable,
          to:      '/accounting',
          detail:  hasAR && hasAP && hasVatPayable ? 'All configured' : 'Missing — journal automation will be incomplete',
        },
        {
          label:   'Bank Account',
          ok:      hasBank,
          to:      '/banking/accounts',
          detail:  hasBank ? 'Connected' : 'No bank — fund transfers and reconciliation unavailable',
        },
      ];

      setChecks(result);
      setScore(Math.round((result.filter(c => c.ok).length / result.length) * 100));
    }).finally(() => setLoading(false));
  }, [companyId]);

  const allOk = score === 100;

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* Header */}
      <div className="ovds-widget-header">
        <Settings size={13} className="text-slate-400" />
        <p className="ovds-card-title">Accounting Setup</p>
        <div className="ml-auto flex items-center gap-2">
          <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            allOk
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
              : score >= 60
              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800'
          }`}>
            {score}% complete
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full transition-all duration-700 ${allOk ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Checks */}
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse flex-1" />
              </div>
            ))
          : checks.map(c => (
              <Link
                key={c.label}
                to={c.to}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {c.ok
                    ? <CheckCircle size={14} className="text-emerald-500" />
                    : c.warning
                    ? <AlertTriangle size={14} className="text-amber-500" />
                    : <XCircle size={14} className="text-rose-500" />}
                </div>

                {/* Label + detail */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-semibold ${
                    c.ok
                      ? 'text-slate-700 dark:text-slate-200'
                      : c.warning
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}>
                    {c.label}
                  </p>
                  {c.detail && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {c.detail}
                    </p>
                  )}
                </div>

                {/* Arrow on hover */}
                <span className="text-[10px] text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0 mt-1">
                  →
                </span>
              </Link>
            ))
        }
      </div>

      {/* Footer CTA */}
      {!allOk && !loading && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Complete all setup steps for accurate financial statements and automated GL postings.{' '}
            <Link to="/accounting/opening-balances" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Fix now →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountingSetupHealthWidget;

