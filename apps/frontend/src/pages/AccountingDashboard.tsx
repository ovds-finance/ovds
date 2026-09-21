import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, StatusBadge,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';

interface TrialBalanceData {
  date: string;
  accounts: Array<{ code: string; name: string; type: string; totalDebit: number; totalCredit: number; netBalance: number }>;
  totals: { debit: number; credit: number };
  isBalanced: boolean;
}

interface BalanceSheetData {
  date: string;
  assets: { total: number };
  liabilities: { total: number };
  equity: { total: number };
}

interface PnLData {
  startDate: string;
  endDate: string;
  income: { total: number };
  expenses: { total: number };
  netProfit: number;
  subtotals: { operatingProfit: number; profitBeforeFinancingAndTax: number; netProfit: number };
}

interface AgingBucket {
  label: string;
  grossAmount: number;
  eclProvision: number;
  count: number;
}

interface AgingData {
  type: 'AR' | 'AP';
  asOf: string;
  buckets: AgingBucket[];
  totalGross: number;
  totalEcl: number;
  netCarrying: number;
}

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  balance?: number;
}

interface Bill {
  id: string;
  billNumber: string;
  vendorName: string;
  total: number;
  dueDate: string;
  status: string;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  status: string;
  journalLine?: Array<{ debit: number; credit: number }>;
}

interface AccountingDashboardData {
  trialBalance: TrialBalanceData | null;
  balanceSheet: BalanceSheetData | null;
  profitLoss: PnLData | null;
  arAging: AgingData | null;
  apAging: AgingData | null;
  bankAccounts: BankAccount[];
  upcomingBills: Bill[];
  recentJournals: JournalEntry[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const AccountingDashboard: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AccountingDashboardData | null>(null);

  const companyId = selectedCompanyId || undefined;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const yearStart = useMemo(() => `${new Date().getFullYear()}-01-01`, []);

  const fetchData = useCallback(async (cId?: string) => {
    if (!cId) return;
    setLoading(true);
    try {
      const q = cId ? `?companyId=${cId}` : '';
      const [tbRes, bsRes, plRes, arRes, apRes, bankRes, billsRes, journalRes] = await Promise.all([
        api.get(`/ovds/reports/trial-balance?date=${today}${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: null })),
        api.get(`/ovds/reports/balance-sheet?date=${today}${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: null })),
        api.get(`/ovds/reports/profit-loss?startDate=${yearStart}&endDate=${today}${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: null })),
        api.get(`/ovds/reports/ar-aging-full${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: null })),
        api.get(`/ovds/reports/ap-aging-full${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: null })),
        api.get(`/banking/accounts${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: [] })),
        api.get(`/ovds/bills?limit=10&status=PENDING${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: { data: [] } })),
        api.get(`/double-entry/journals?limit=10${q}`, { headers: { 'x-background': '1' } }).catch(() => ({ data: { data: [] } })),
      ]);

      const billsData = (billsRes.data?.data ?? billsRes.data ?? []);
      const journalsData = (journalRes.data?.data ?? journalRes.data ?? []);

      setData({
        trialBalance: tbRes.data?.data ?? tbRes.data ?? null,
        balanceSheet: bsRes.data?.data ?? bsRes.data ?? null,
        profitLoss: plRes.data?.data ?? plRes.data ?? null,
        arAging: arRes.data?.data ?? arRes.data ?? null,
        apAging: apRes.data?.data ?? apRes.data ?? null,
        bankAccounts: bankRes.data?.data ?? bankRes.data ?? [],
        upcomingBills: Array.isArray(billsData) ? billsData : [],
        recentJournals: Array.isArray(journalsData) ? journalsData : [],
      });
    } catch {
      toast.error('Failed to load accounting dashboard');
    } finally {
      setLoading(false);
    }
  }, [today, yearStart]);

  useEffect(() => {
    if (companyId) fetchData(companyId);
  }, [companyId, fetchData]);

  const tb = data?.trialBalance;
  const bs = data?.balanceSheet;
  const pl = data?.profitLoss;
  const ar = data?.arAging;
  const ap = data?.apAging;
  const banks = data?.bankAccounts ?? [];
  const bills = data?.upcomingBills ?? [];
  const journals = data?.recentJournals ?? [];

  const totalAssets = bs?.assets?.total ?? 0;
  const totalLiabilities = bs?.liabilities?.total ?? 0;
  const totalEquity = bs?.equity?.total ?? 0;
  const tbBalanced = tb?.isBalanced ?? false;
  const arTotal = ar?.totalGross ?? 0;
  const apTotal = ap?.totalGross ?? 0;

  return (
    <AppPage
      title="Accounting Dashboard"
      subtitle="Trial balance · P&L · AR/AP · Bank balances"
      actions={
        <Btn
          variant="secondary"
          size="sm"
          onClick={() => fetchData(companyId)}
          icon={<Icon name="REFRESH_CW" size={11} />}
        >
          Refresh
        </Btn>
      }
    >
      {!companyId ? (
        <div className="text-center py-10 text-sm text-slate-400">
          Please select a company to view the accounting dashboard.
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-sm text-slate-400">
          {loading ? 'Loading...' : 'No data available.'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="ovds-grid-layout cols-4 gap-sm">
            {[
              { label: 'Total Assets', value: totalAssets, color: 'text-[var(--pro-azure)]' },
              { label: 'Total Liabilities', value: totalLiabilities, color: 'text-rose-600' },
              { label: 'Total Equity', value: totalEquity, color: 'text-violet-600' },
              { label: 'TB Balanced', value: tbBalanced ? 100 : 0, suffix: '%', color: tbBalanced ? 'text-[var(--pro-azure)]' : 'text-rose-600' },
            ].map((k, i) => (
              <div key={i} className="ovds-widget-card p-4">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                {loading ? (
                  <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className={`text-xl font-bold tabular-nums ${k.color}`}>
                    {k.suffix ? `${k.value}${k.suffix}` : `ETB ${fmt(k.value)}`}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trial Balance Summary */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Trial Balance Summary</p>
              </div>
              <div className="p-4">
                {tb ? (
                  <div className="space-y-2">
                    <div className={`p-2 rounded-lg text-xs ${tbBalanced ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'bg-rose-50 text-rose-700'}`}>
                      {tbBalanced ? 'Balanced — Debits = Credits' : 'Imbalanced — Debits ≠ Credits'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-500">Total Debits</p>
                        <p className="font-bold tabular-nums">{fmt(tb.totals.debit)}</p>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-500">Total Credits</p>
                        <p className="font-bold tabular-nums">{fmt(tb.totals.credit)}</p>
                      </div>
                    </div>
                    <Link to="/reports/trial-balance" className="text-xs text-[var(--pro-azure)] hover:underline">View full trial balance →</Link>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No trial balance data.</div>
                )}
              </div>
            </div>

            {/* P&L Summary */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Profit & Loss Summary</p>
              </div>
              <div className="p-4">
                {pl ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-lg">
                        <p className="text-[var(--pro-azure)]">Revenue</p>
                        <p className="font-bold tabular-nums">{fmt(pl.income.total)}</p>
                      </div>
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
                        <p className="text-rose-600">Expenses</p>
                        <p className="font-bold tabular-nums">{fmt(pl.expenses.total)}</p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg text-xs ${pl.subtotals.netProfit >= 0 ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]' : 'bg-rose-50 text-rose-700'}`}>
                      Net Profit: <span className="font-bold">{fmt(pl.subtotals.netProfit)}</span>
                    </div>
                    <Link to="/reports/profit-loss" className="text-xs text-[var(--pro-azure)] hover:underline">View full P&L →</Link>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No P&L data.</div>
                )}
              </div>
            </div>

            {/* AR / AP Aging */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">AR / AP Aging</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">Accounts Receivable</span>
                    <span className="tabular-nums font-bold">{fmt(arTotal)}</span>
                  </div>
                  {ar?.buckets && ar.buckets.length > 0 ? (
                    <div className="space-y-1">
                      {ar.buckets.map((b, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-500">
                          <span>{b.label}</span>
                          <span className="tabular-nums">{fmt(b.grossAmount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">No AR aging data.</div>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">Accounts Payable</span>
                    <span className="tabular-nums font-bold">{fmt(apTotal)}</span>
                  </div>
                  {ap?.buckets && ap.buckets.length > 0 ? (
                    <div className="space-y-1">
                      {ap.buckets.map((b, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-500">
                          <span>{b.label}</span>
                          <span className="tabular-nums">{fmt(b.grossAmount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">No AP aging data.</div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link to="/reports" className="text-xs text-[var(--pro-azure)] hover:underline">Full AR Aging →</Link>
                  <Link to="/reports" className="text-xs text-[var(--pro-azure)] hover:underline">Full AP Aging →</Link>
                </div>
              </div>
            </div>

            {/* Bank Balances */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Bank Balances</p>
              </div>
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Bank</AppTh>
                    <AppTh>Account</AppTh>
                    <AppTh align="right">Balance</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {banks.slice(0, 5).map((b, i) => (
                    <AppTr key={b.id || i}>
                      <AppTd>
                        <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{b.bankName || '—'}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[11px] text-slate-500">{b.accountNumber || '—'}</span>
                      </AppTd>
                      <AppTd align="right">
                        <span className="tabular-nums text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                          {b.balance !== undefined ? fmt(b.balance) : '—'}
                        </span>
                      </AppTd>
                    </AppTr>
                  ))}
                  {banks.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-sm text-slate-400">
                        No bank accounts configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </AppTable>
            </div>

            {/* Upcoming Payments */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Upcoming Payments (Next 7 Days)</p>
              </div>
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Bill</AppTh>
                    <AppTh>Vendor</AppTh>
                    <AppTh align="right">Amount</AppTh>
                    <AppTh>Due</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {bills.slice(0, 5).map((b, i) => (
                    <AppTr key={b.id || i}>
                      <AppTd>
                        <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{b.billNumber || '—'}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[11px] text-slate-500">{b.vendorName || '—'}</span>
                      </AppTd>
                      <AppTd align="right">
                        <span className="tabular-nums text-[12px] font-semibold text-slate-700 dark:text-slate-200">{fmt(Number(b.total))}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[11px] text-slate-500">{b.dueDate ? new Date(b.dueDate).toLocaleDateString('en-ET') : '—'}</span>
                      </AppTd>
                    </AppTr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-slate-400">
                        No upcoming payments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </AppTable>
            </div>

            {/* Recent Journal Entries */}
            <div className="ovds-widget-card overflow-hidden lg:col-span-2">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Recent Journal Entries</p>
              </div>
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Date</AppTh>
                    <AppTh>Reference</AppTh>
                    <AppTh>Description</AppTh>
                    <AppTh>Lines</AppTh>
                    <AppTh>Status</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {journals.slice(0, 10).map((j, i) => {
                    const totalDebit = (j.journalLine ?? []).reduce((s, l) => s + (Number(l.debit) || 0), 0);
                    const totalCredit = (j.journalLine ?? []).reduce((s, l) => s + (Number(l.credit) || 0), 0);
                    return (
                      <AppTr key={j.id || i}>
                        <AppTd>
                          <span className="text-[11px] text-slate-500">{j.date ? new Date(j.date).toLocaleDateString('en-ET') : '—'}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[11px] font-mono text-slate-500">{j.reference || '—'}</span>
                        </AppTd>
                        <AppTd>
                          <span className="text-[12px] text-slate-700 dark:text-slate-200">{j.description || '—'}</span>
                        </AppTd>
                        <AppTd align="right">
                          <span className="tabular-nums text-[11px] text-slate-500">
                            {fmt(totalDebit)} / {fmt(totalCredit)}
                          </span>
                        </AppTd>
                        <AppTd>
                          <StatusBadge status={j.status} />
                        </AppTd>
                      </AppTr>
                    );
                  })}
                  {journals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                        No recent journal entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </AppTable>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default AccountingDashboard;
