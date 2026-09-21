/**
 * Opening Balances Setup
 *
 * Purpose: Allow a new or migrating company to enter opening balances
 * for all their accounts in one place. Posts a single balanced journal
 * entry (OPENING-BALANCES reference) that seeds the GL correctly.
 *
 * Flow:
 *  1. Load all chart of accounts (ASSET, LIABILITY, EQUITY types only)
 *  2. For each account, show an opening balance input
 *  3. Live preview: total debits vs credits (must balance, or OBE auto-balances)
 *  4. POST /ovds/accounting/opening-balances
 *
 * IAS 1.104 — Comparative information requires accurate opening balances.
 * Without correct opening balances, the balance sheet and retained earnings are wrong.
 */
import {
  Scale, RefreshCw, Save, CheckCircle, AlertTriangle,
  Info, ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppKpi, AppTable, AppTh, AppTd, AppTr,
  Btn, FormField, Input, EmptyState,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';

// -- Types ---------------------------------------------------------------------

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  category: string;
  balance?: number;
}

interface OpeningStatus {
  hasOpeningBalances: boolean;
  openingDate?: string;
  accountsWithBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

const ACCOUNT_TYPE_SECTIONS: Array<{
  type: Account['type'];
  label: string;
  hint: string;
  side: 'debit' | 'credit';
  accentCls: string;
}> = [
  { type: 'ASSET',     label: 'Assets',      hint: 'Debit-normal: Cash, Bank, AR, Inventory, Fixed Assets, etc.', side: 'debit',  accentCls: 'bg-[var(--pro-azure-50)]0' },
  { type: 'LIABILITY', label: 'Liabilities', hint: 'Credit-normal: AP, VAT Payable, Loans, Accruals, etc.',       side: 'credit', accentCls: 'bg-rose-500'    },
  { type: 'EQUITY',    label: 'Equity',      hint: 'Credit-normal: Share Capital, Retained Earnings, etc.',       side: 'credit', accentCls: 'bg-violet-500'  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));

// -- Section --------------------------------------------------------------------

const AccountSection: React.FC<{
  section: typeof ACCOUNT_TYPE_SECTIONS[number];
  accounts: Account[];
  balances: Record<string, string>;
  onChange: (id: string, val: string) => void;
}> = ({ section, accounts, balances, onChange }) => {
  const [open, setOpen] = useState(true);
  const sectionTotal = accounts.reduce((s, a) => s + (parseFloat(balances[a.id] ?? '0') || 0), 0);

  return (
    <div className="ovds-widget-card overflow-hidden">
      {/* Section header */}
      <div
        className="ovds-widget-header cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setOpen(p => !p)}
      >
        <div className={`w-2 h-6 rounded-full ${section.accentCls}`} />
        <div className="flex-1">
          <p className="ovds-card-title">{section.label}</p>
          <p className="ovds-caption">{section.hint}</p>
        </div>
        <span className="tabular-nums text-[12px] font-bold text-slate-700 dark:text-slate-200 mr-3">
          ETB {fmt(sectionTotal)}
        </span>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </div>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase text-[9px] tracking-wider w-16">Code</th>
                <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase text-[9px] tracking-wider">Account Name</th>
                <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase text-[9px] tracking-wider w-32">Category</th>
                <th className="px-4 py-2 text-right font-bold text-slate-500 uppercase text-[9px] tracking-wider w-40">
                  Opening Balance (ETB)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {accounts.map(a => {
                const val = balances[a.id] ?? '';
                const hasValue = val !== '' && parseFloat(val) !== 0;
                return (
                  <tr key={a.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${hasValue ? 'bg-[var(--pro-azure-50)]/30 dark:bg-green-950/10' : ''}`}>
                    <td className="px-4 py-2 font-mono text-[10px] text-slate-400">{a.code}</td>
                    <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-200">{a.name}</td>
                    <td className="px-4 py-2 text-[10px] text-slate-400">{a.category?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={val}
                        onChange={e => onChange(a.id, e.target.value)}
                        placeholder="0.00"
                        className={`w-full text-right px-2 py-1 border rounded-lg text-[11px] font-semibold tabular-nums outline-none transition-colors bg-white dark:bg-slate-900 ${
                          hasValue
                            ? 'border-[var(--pro-azure-light)] focus:border-teal-400'
                            : 'border-slate-200 dark:border-slate-700 focus:border-teal-400'
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
              {accounts.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[11px] text-slate-400">
                  No {section.label.toLowerCase()} accounts found. Seed your chart of accounts first.
                </td></tr>
              )}
            </tbody>
            {accounts.length > 0 && (
              <tfoot>
                <tr className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={3} className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Total {section.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[12px] font-black text-slate-800 dark:text-slate-100">
                    ETB {fmt(sectionTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

// -- Main Page -----------------------------------------------------------------

const OpeningBalances: React.FC = () => {
  usePageTitle('Opening Balances');
  const { can }               = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [accounts,  setAccounts]  = useState<Account[]>([]);
  const [status,    setStatus]    = useState<OpeningStatus | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [balances,  setBalances]  = useState<Record<string, string>>({});
  const [asOfDate,  setAsOfDate]  = useState(
    () => `${new Date().getFullYear()}-01-01`
  );

  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acctRes, statusRes] = await Promise.all([
        api.get(`/accounting/accounts${cq}`),
        api.get(`/ovds/accounting/opening-balance-status${cq}`).catch(() => ({ data: null })),
      ]);

      const raw: Account[] = acctRes.data?.data ?? acctRes.data ?? [];
      // Only show balance sheet accounts for opening balances
      const bsAccounts = raw.filter(a =>
        ['ASSET', 'LIABILITY', 'EQUITY'].includes(a.type)
      );
      setAccounts(bsAccounts);

      const st: OpeningStatus | null = statusRes.data?.data ?? statusRes.data ?? null;
      setStatus(st);

      // If opening balances already exist, show current journal as pre-fill
      if (st?.hasOpeningBalances) {
        toast(`Opening balances already posted as of ${st.openingDate}. You can post again to update.`, { icon: 'ℹ️', duration: 5000 });
      }
    } catch (_err: any) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [cq]);

  useEffect(() => { load(); }, [load]);

  const handleChange = useCallback((id: string, val: string) => {
    setBalances(prev => ({ ...prev, [id]: val }));
  }, []);

  // Compute live totals
  const accountsByType = useMemo(() => {
    const map: Record<string, Account[]> = {};
    for (const a of accounts) {
      if (!map[a.type]) map[a.type] = [];
      map[a.type].push(a);
    }
    return map;
  }, [accounts]);

  const totalAssets      = useMemo(() => (accountsByType['ASSET'] ?? []).reduce((s, a) => s + (parseFloat(balances[a.id] ?? '0') || 0), 0), [accountsByType, balances]);
  const totalLiabilities = useMemo(() => (accountsByType['LIABILITY'] ?? []).reduce((s, a) => s + (parseFloat(balances[a.id] ?? '0') || 0), 0), [accountsByType, balances]);
  const totalEquity      = useMemo(() => (accountsByType['EQUITY'] ?? []).reduce((s, a) => s + (parseFloat(balances[a.id] ?? '0') || 0), 0), [accountsByType, balances]);
  const diff             = totalAssets - totalLiabilities - totalEquity;
  const isBalanced       = Math.abs(diff) < 0.01;
  const filledCount      = Object.values(balances).filter(v => v !== '' && parseFloat(v) !== 0).length;

  const kpiCells = [
    { label: 'Total Assets',           value: `ETB ${fmt(totalAssets)}`,      color: 'green' as const },
    { label: 'Total Liabilities',      value: `ETB ${fmt(totalLiabilities)}`, color: 'rose'    as const },
    { label: 'Total Equity',           value: `ETB ${fmt(totalEquity)}`,      color: 'violet'  as const },
    { label: 'Difference (must = 0)', value: `ETB ${fmt(diff)}`,             color: isBalanced ? 'indigo' as const : 'amber' as const },
    { label: 'Accounts Filled',        value: `${filledCount} / ${accounts.length}`, color: 'sky' as const },
    { label: 'Status',                 value: status?.hasOpeningBalances ? 'Posted' : 'Pending', color: status?.hasOpeningBalances ? 'indigo' as const : 'amber' as const },
  ];

  const handleSave = async () => {
    if (!can('ovds:write')) { toast.error('No permission'); return; }
    if (filledCount === 0) { toast.error('Enter at least one opening balance'); return; }

    const balanceItems = Object.entries(balances)
      .filter(([, v]) => v !== '' && parseFloat(v) !== 0)
      .map(([accountId, v]) => ({ accountId, balance: parseFloat(v) }));

    setSaving(true);
    try {
      const res = await api.post('/ovds/accounting/opening-balances', {
        balances: balanceItems,
        asOfDate,
        ...(selectedCompanyId ? { companyId: selectedCompanyId } : {}),
      });
      const d = res.data?.data ?? res.data;
      toast.success(
        `Opening balances posted — ${d.linesPosted} accounts · ETB ${fmt(d.totalDebit)} Dr / ETB ${fmt(d.totalCredit)} Cr`
      );
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to post opening balances');
    } finally {
      setSaving(false);
    }
  };

  const handleExportTemplate = () => {
    const header = 'AccountID,AccountCode,AccountName,Type,OpeningBalance\n';
    const rows = accounts.map(a =>
      `${a.id},${a.code},"${a.name}",${a.type},${balances[a.id] ?? 0}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `opening-balances-template-${asOfDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Template exported');
  };

  const handleSeedAccounts = async () => {
    try {
      await api.post('/ovds/accounts/seed', {
        ...(selectedCompanyId ? { companyId: selectedCompanyId } : {}),
      });
      toast.success('Chart of accounts seeded with Ethiopian AABE defaults');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Seed failed');
    }
  };

  return (
    <AppPage
      title="Opening Balances"
      subtitle="Set opening balances for all accounts to seed the General Ledger correctly · Accounting & ovds Software · Banking & ovds · ERP · Revenue · Market Value"
      icon={<Scale size={18} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      crumbs={[{ label: 'Accounting' }, { label: 'Opening Balances' }]}
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} className={loading ? 'animate-spin' : ''} />} onClick={load}>Refresh</Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={11} />} onClick={handleExportTemplate}>Export Template</Btn>
          {can('ovds:write') && accounts.length === 0 && (
            <Btn variant="secondary" size="sm" icon={<RefreshCw size={11} />} onClick={handleSeedAccounts}>Seed Chart of Accounts</Btn>
          )}
          {can('ovds:write') && (
            <Btn
              variant="primary"
              size="sm"
              loading={saving}
              icon={saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
              onClick={handleSave}
              disabled={filledCount === 0}
            >
              Post Opening Balances
            </Btn>
          )}
        </>
      }
    >
      {/* Status banner */}
      {status?.hasOpeningBalances && (
        <div className="flex items-center gap-3 p-4 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-800 rounded-xl">
          <CheckCircle size={15} className="text-[var(--pro-azure)] shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-[var(--pro-azure-dark)] dark:text-green-200">
              Opening balances already posted as of <strong>{status.openingDate}</strong>
            </p>
            <p className="text-[11px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-0.5">
              {status.accountsWithBalance} accounts · Assets ETB {fmt(status.totalAssets)} · Liabilities ETB {fmt(status.totalLiabilities)} · Equity ETB {fmt(status.totalEquity)}
            </p>
          </div>
          <span className="text-[10px] text-[var(--pro-azure)]">You can post again to update</span>
        </div>
      )}

      {/* IAS 1 note */}
      <div className="flex items-start gap-3 p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-xl text-[11px] text-sky-700 dark:text-sky-300">
        <Info size={13} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Why Opening Balances Matter (IAS 1.104)</p>
          <p className="leading-relaxed">
            IAS 1 requires comparative financial statements. Without accurate opening balances, the prior-year balance sheet
            is wrong — making retained earnings, working capital ratios, and the equity reconciliation all unreliable.
            Enter the closing balances from your previous accounting system or audit report as of the transition date.
          </p>
          <p className="mt-1.5">
            <strong>Auto-balance:</strong> If Assets ≠ Liabilities + Equity, the system posts the difference to
            <em> Opening Balance Equity</em> automatically. Investigate and correct this before filing.
          </p>
        </div>
      </div>

      {/* Date picker + balance check */}
      <div className="flex items-center gap-6 flex-wrap p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Opening Balance Date</label>
          <input
            type="date"
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-teal-400 bg-white dark:bg-slate-800"
          />
        </div>
        <div className="flex-1" />
        {filledCount > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            isBalanced
              ? 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-950/20 dark:border-green-800 dark:text-[var(--pro-azure-light)]'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400'
          }`}>
            {isBalanced
              ? <CheckCircle size={13} />
              : <AlertTriangle size={13} />}
            <span className="text-[11px] font-bold">
              {isBalanced
                ? 'Balanced — Assets = Liabilities + Equity'
                : `Difference: ETB ${fmt(Math.abs(diff))} (auto-balanced via Opening Balance Equity)`}
            </span>
          </div>
        )}
      </div>

      {/* KPI strip */}
      {filledCount > 0 && <AppKpi cells={kpiCells} cols={3} />}

      {/* Account sections */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl animate-pulse" />)}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Scale size={20} />}
          title="No chart of accounts found"
          desc="Seed the default Ethiopian chart of accounts first, then return here to enter opening balances."
          action={can('ovds:write') ? { label: 'Seed Chart of Accounts', onClick: handleSeedAccounts } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {ACCOUNT_TYPE_SECTIONS.map(section => (
            <AccountSection
              key={section.type}
              section={section}
              accounts={accountsByType[section.type] ?? []}
              balances={balances}
              onChange={handleChange}
            />
          ))}
        </div>
      )}

      {/* How it posts */}
      {accounts.length > 0 && (
        <div className="p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl text-[11px] space-y-2">
          <p className="font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider text-[10px]">How Opening Balances Are Posted</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: '①', title: 'Asset accounts', desc: 'Debit balance → Dr [Asset Account] / Cr Opening Balance Equity' },
              { icon: '②', title: 'Liability accounts', desc: 'Credit balance → Dr Opening Balance Equity / Cr [Liability Account]' },
              { icon: '③', title: 'Equity accounts', desc: 'Credit balance → Dr Opening Balance Equity / Cr [Equity Account]' },
            ].map(c => (
              <div key={c.title} className="flex items-start gap-2">
                <span className="text-violet-500 font-black text-[13px] shrink-0">{c.icon}</span>
                <div>
                  <p className="font-bold text-violet-700 dark:text-violet-400">{c.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-400">
            The result is a single balanced journal entry (reference: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">OPENING-BALANCES-{asOfDate}</code>)
            that can be reversed or updated at any time before period close.
          </p>
        </div>
      )}
    </AppPage>
  );
};

export default OpeningBalances;

