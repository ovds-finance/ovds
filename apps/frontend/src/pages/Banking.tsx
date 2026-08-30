/**
 * Banking — OVDS Banking Hub
 *
 * Full banking user flow in one page using internal tabs:
 *   Overview · Accounts · Transactions · Transfers · Bank Feeds · Reconciliation
 *
 * API calls go to:
 *   GET /banking/dashboard
 *   GET /banking/accounts
 *   GET /banking/transactions
 *   GET /banking/transfers
 *   GET /banking/feeds
 *   GET /banking/reconciliation/stats
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Landmark, Plus, RefreshCw, ArrowLeftRight, ShieldCheck,
  Rss, Upload, ArrowUpRight, ArrowDownRight, Wallet,
  AlertCircle, CheckCircle2, Clock, TrendingUp,
  Layers, CircleDollarSign, ChevronDown, SlidersHorizontal,
  DollarSign, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import { fmtETB, fmtCurrency } from '../utils/ethiopianTax';
import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select,
  Textarea, SearchBar, Amount, EmptyState, Pagination, Card,
} from '../components/ui';
import { evalMath } from '@ovds/ui';

// ── Types ────────────────────────────────────────────────────────────────────

interface BankAccount {
  id: string; name: string; accountNumber: string; bankName: string;
  currencyCode: string; openingBalance: number; computedBalance: number;
  unreconciledCount: number; isActive: boolean;
}
interface BankTx {
  id: string; date: string; description: string; amount: number;
  type: string; status: string; reference?: string; bankName?: string;
  counterparty?: string; bankAccountName?: string;
}
interface Transfer {
  id: string; fromAccountId: string; toAccountId: string; amount: number;
  type: string; status: string; reference?: string; note?: string;
  fromAccountName?: string; toAccountName?: string; createdAt: string;
}
interface BankFeed {
  id: string; bankAccountId: string; provider: string; status: string;
  lastSyncAt?: string; institutionName?: string; errorMessage?: string;
}
interface ReconStats {
  total: number; reconciled: number; pending: number;
  reconciliationRate: number;
  byAccount: Array<{ accountId: string; accountName: string; bankName: string | null; pendingCount: number; pendingAmount: number }>;
}
interface Dashboard {
  totalAccounts: number; totalBalance: number; liquidBalance: number;
  creditCardBalance: number; netWorth: number;
  pendingTransactions: number; unreconciledCount: number;
  cashFlow: { totalIn: number; totalOut: number; net: number };
  recentTransactions: BankTx[];
  currencyBreakdown: Record<string, number>;
  fxGainLoss: number;
}

const ACCOUNT_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  BANK:        { label: 'Checking',     color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
  SAVINGS:     { label: 'Savings',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  CREDIT_CARD: { label: 'Credit Card',  color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800' },
  CASH:        { label: 'Petty Cash',   color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  LOAN:        { label: 'Loan',         color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
};

// ── Account form ─────────────────────────────────────────────────────────────

const AccountForm: React.FC<{
  data: Partial<BankAccount>;
  onChange: (d: Partial<BankAccount>) => void;
}> = ({ data, onChange }) => {
  const set = (k: keyof BankAccount, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Account Name" required>
          <Input value={data.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="e.g. CBE Main Account" autoFocus />
        </FormField>
        <FormField label="Bank Name" required>
          <Input value={data.bankName ?? ''} onChange={e => set('bankName', e.target.value)} placeholder="e.g. Commercial Bank of Ethiopia" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Account Number" required>
          <Input value={data.accountNumber ?? ''} onChange={e => set('accountNumber', e.target.value)} placeholder="1000123456789" />
        </FormField>
        <FormField label="Account Type">
          <Select value={data.accountType ?? 'BANK'} onChange={e => set('accountType', e)}>
            <option value="BANK">Checking (Bank)</option>
            <option value="SAVINGS">Savings</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="CASH">Petty Cash</option>
            <option value="LOAN">Loan</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Opening Balance">
          <Input type="number" step="0.01" value={data.openingBalance ?? 0} onChange={e => set('openingBalance', parseFloat(e.target.value) || 0)} />
        </FormField>
        <FormField label="Currency">
          <Select value={data.currencyCode ?? 'ETB'} onChange={e => set('currencyCode', e)}>
            <option value="ETB">ETB — Ethiopian Birr</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </Select>
        </FormField>
      </div>
    </div>
  );
};

// ── Transfer form ─────────────────────────────────────────────────────────────

const TransferForm: React.FC<{
  data: Partial<Transfer>;
  onChange: (d: Partial<Transfer>) => void;
  accounts: BankAccount[];
}> = ({ data, onChange, accounts }) => {
  const set = (k: keyof Transfer, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="From Account" required>
          <Select value={data.fromAccountId ?? ''} onChange={e => set('fromAccountId', e)}>
          <option value="">Select source account</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} — {a.bankName} ({fmtETB(a.computedBalance ?? 0)})</option>
          ))}
        </Select>
      </FormField>
      <FormField label="To Account" required>
          <Select value={data.toAccountId ?? ''} onChange={e => set('toAccountId', e)}>
          <option value="">Select destination account</option>
          {accounts.filter(a => a.id !== data.fromAccountId).map(a => (
            <option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>
          ))}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount (ETB)" required>
          <Input type="text" step="0.01" min="0" value={data.amount ?? ''} onChange={e => set('amount', e)} onBlur={e => set('amount', Number((evalMath(e.target.value) ?? parseFloat(e.target.value)) || 0))} placeholder="0.00" />
        </FormField>
        <FormField label="Type">
          <Select value={data.type ?? 'INTERNAL'} onChange={e => set('type', e)}>
            <option value="INTERNAL">Internal</option>
            <option value="ACH">ACH</option>
            <option value="WIRE">Wire Transfer</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Reference">
          <Input value={data.reference ?? ''} onChange={e => set('reference', e)} placeholder="Transfer reference" />
      </FormField>
      <FormField label="Note">
          <Textarea value={data.note ?? ''} onChange={e => set('note', e)} rows={2} placeholder="Purpose of transfer…" />
      </FormField>
    </div>
  );
};

// ── Overview tab ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{
  dashboard: Dashboard | null;
  loading: boolean;
  accounts: BankAccount[];
  onNewAccount: () => void;
  onNavigate: (path: string) => void;
}> = ({ dashboard, loading, accounts, onNewAccount, onNavigate }) => {
  const d = dashboard;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const totalIn       = d?.cashFlow?.totalIn ?? 0;
  const totalOut      = d?.cashFlow?.totalOut ?? 0;
  const net           = d?.cashFlow?.net ?? 0;
  const fxGainLoss    = d?.fxGainLoss ?? 0;
  const unreconciled  = d?.unreconciledCount ?? 0;
  const hasDiscrepancy = unreconciled > 0;

  const metrics: {
    key: string; label: string; value: string; accent: 'emerald'|'sky'|'amber'|'rose'|'violet';
    iconBg: string; icon: React.ReactNode; sub?: string; valueCls?: string;
  }[] = [
    { key: 'netWorth', label: 'Net Worth', value: d ? fmtCurrency(d.netWorth, 'ETB') : '—',
      accent: 'emerald', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', icon: <Wallet size={14} />,
      sub: 'assets - liabilities' },
    { key: 'liquid', label: 'Liquid Cash', value: d ? fmtCurrency(d.liquidBalance, 'ETB') : '—',
      accent: 'sky', iconBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400', icon: <DollarSign size={14} />,
      sub: 'excl. credit cards' },
    { key: 'in', label: 'Cash In', value: d ? fmtCurrency(totalIn, 'ETB') : '—',
      accent: 'emerald', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', icon: <ArrowDownRight size={14} />,
      valueCls: 'text-emerald-700 dark:text-emerald-400' },
    { key: 'out', label: 'Cash Out', value: d ? fmtCurrency(totalOut, 'ETB') : '—',
      accent: 'rose', iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400', icon: <ArrowUpRight size={14} />,
      valueCls: 'text-rose-700 dark:text-rose-400' },
    { key: 'fx', label: 'FX Gain/Loss', value: d ? `${fxGainLoss >= 0 ? '+' : ''}${fmtCurrency(fxGainLoss, 'ETB')}` : '—',
      accent: fxGainLoss >= 0 ? 'emerald' : 'rose',
      iconBg: fxGainLoss >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
      icon: fxGainLoss >= 0 ? <TrendingUp size={14} /> : <ArrowUpRight size={14} />,
      valueCls: fxGainLoss >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400' },
    { key: 'pending', label: 'Unreconciled', value: String(unreconciled),
      accent: unreconciled > 0 ? 'amber' : 'emerald',
      iconBg: unreconciled > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      icon: unreconciled > 0 ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />,
      valueCls: unreconciled > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400',
      sub: 'error-prevention' },
  ];

  const quickLinks = [
    { label: 'New Income',       icon: <ArrowDownRight size={14} />, color: 'bg-emerald-500', path: '/banking/transactions?action=income' },
    { label: 'New Expense',      icon: <ArrowUpRight   size={14} />, color: 'bg-rose-500',    path: '/banking/transactions?action=expense' },
    { label: 'New Transfer',     icon: <ArrowLeftRight size={14} />, color: 'bg-sky-500',     path: '/banking/transfers?action=new' },
    { label: 'Import Statement', icon: <Upload         size={14} />, color: 'bg-violet-500',  path: '/banking/statement-import' },
    { label: 'Reconcile',        icon: <ShieldCheck    size={14} />, color: 'bg-teal-500',    path: '/banking/reconciliation' },
    { label: 'Bank Feeds',       icon: <Rss            size={14} />, color: 'bg-indigo-500',  path: '/banking/feeds' },
    { label: 'FX Rates',         icon: <Globe          size={14} />, color: 'bg-cyan-500',    path: '/banking/fx-rates' },
  ];

  const flaggedAccounts = accounts.filter(a => a.unreconciledCount > 0);

  return (
    <div className="space-y-4">
      {/* ── Grid-over-card metric strip ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-[92px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map(m => (
            <Card key={m.key} padding="md" className={`cursor-default border-l-4 ${['emerald','sky','amber','violet'].includes(m.accent as string) ? `border-${m.accent}-400` : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.iconBg}`}>{m.icon}</span>
              {m.sub && <span className="text-[8px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600">{m.sub}</span>}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">{m.label}</p>
              <p className={`text-[20px] font-extrabold tabular-nums leading-tight mt-1 ${m.valueCls ?? 'text-slate-900 dark:text-slate-50'}`}>{m.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* ── Double-entry validation (progressive disclosure) ── */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <ArrowLeftRight size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Double-Entry Validation</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Credits &amp; debits must balance before posting</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <SlidersHorizontal size={11} /> {showAdvanced ? 'Hide detail' : 'Advanced'}
            <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Credits / Debits / Net — double-entry contrast tints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mt-3">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5">
            <div className="flex items-center gap-1.5 mb-1"><ArrowDownRight size={12} className="text-emerald-600" /><span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Credits (Inflow)</span></div>
            <p className="text-[18px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{fmtETB(totalIn)}</p>
          </div>
          <div className="bg-rose-50/60 dark:bg-rose-950/20 p-3.5">
            <div className="flex items-center gap-1.5 mb-1"><ArrowUpRight size={12} className="text-rose-600" /><span className="text-[9px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest">Debits (Outflow)</span></div>
            <p className="text-[18px] font-bold text-rose-700 dark:text-rose-400 tabular-nums">{fmtETB(totalOut)}</p>
          </div>
          <div className="bg-white dark:bg-slate-950 p-3.5">
            <div className="flex items-center gap-1.5 mb-1"><Layers size={12} className="text-slate-500" /><span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Net Movement</span></div>
            <p className={`text-[18px] font-bold tabular-nums ${net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{net >= 0 ? '+' : '-'}{fmtETB(Math.abs(net))}</p>
          </div>
        </div>

        {/* Error-prevention banner */}
        {hasDiscrepancy ? (
          <div className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
            <AlertCircle size={15} className="text-amber-500 shrink-0" />
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              {unreconciled} unreconciled item{unreconciled > 1 ? 's' : ''} may cause discrepancy — reconcile to prevent posting errors.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">All accounts reconciled — entries are balanced and clear.</p>
          </div>
        )}

        {/* Progressive disclosure: per-account breakdown */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Account-Level Reconciliation</p>
            {flaggedAccounts.length === 0 ? (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">No accounts require attention.</p>
            ) : (
              <div className="space-y-1">
                {flaggedAccounts.map(a => (
                  <button key={a.id} onClick={() => onNavigate('/banking/reconciliation')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 transition-all text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <Landmark size={12} className="text-sky-500 shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{a.name}</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                      {a.unreconciledCount} pending
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickLinks.map(q => (
            <button
              key={q.path}
              onClick={() => onNavigate(q.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
            >
              <div className={`w-8 h-8 rounded-lg ${q.color} text-white flex items-center justify-center shadow-sm`}>
                {q.icon}
              </div>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight">{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accounts list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Accounts</p>
          <Btn variant="ghost" size="sm" icon={<Plus size={11} />} onClick={onNewAccount}>New Account</Btn>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState icon={<Landmark size={18} />} title="No bank accounts yet" desc="Add your first account to start tracking cash flow." action={{ label: 'New Account', onClick: onNewAccount }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map(a => {
              const badge = ACCOUNT_TYPE_BADGE[a.accountType] ?? ACCOUNT_TYPE_BADGE.BANK;
              return (
                <div key={a.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
                        <Landmark size={14} className="text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">{a.name}</p>
                        <p className="text-[10px] text-slate-400">{a.bankName}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>{badge.label}</span>
                  </div>
                  <p className="text-[18px] font-bold text-slate-900 dark:text-slate-50 tabular-nums">{fmtCurrency(a.computedBalance ?? a.balance, a.currencyCode)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.accountNumber} · {a.currencyCode}</p>
                  {a.unreconciledCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mt-2 inline-block">
                      {a.unreconciledCount} pending
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      {d && d.recentTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Transactions</p>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('/banking/transactions')}>View all</Btn>
          </div>
          <div className="space-y-1">
            {d.recentTransactions.slice(0, 6).map((t: BankTx) => {
              const isCredit = t.type === 'CREDIT' || Number(t.amount) > 0;
              return (
                <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'}`}>
                      {isCredit ? <ArrowDownRight size={12} className="text-emerald-600" /> : <ArrowUpRight size={12} className="text-rose-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{t.description}</p>
                      <p className="text-[10px] text-slate-400">{t.bankAccountName ?? ''} · {new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-[12px] font-bold tabular-nums ${isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isCredit ? '+' : '-'}{fmtETB(Math.abs(Number(t.amount)))}
                    </p>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Accounts tab ──────────────────────────────────────────────────────────────

const AccountsTab: React.FC<{
  accounts: BankAccount[];
  loading: boolean;
  can: (p: string) => boolean;
  onNew: () => void;
  onRefetch: () => void;
  onDelete: (id: string) => void;
}> = ({ accounts, loading, can, onNew, onRefetch, onDelete }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 justify-end">
      <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={onRefetch}>Refresh</Btn>
      {can('banking:write') && <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={onNew}>New Account</Btn>}
    </div>
    <AppTable loading={loading}>
      <thead><tr>
        <AppTh>Account</AppTh>
        <AppTh>Bank</AppTh>
        <AppTh>Account Number</AppTh>
        <AppTh>Currency</AppTh>
        <AppTh align="right">Balance</AppTh>
        <AppTh>Pending</AppTh>
        <AppTh align="right" width="70px">Actions</AppTh>
      </tr></thead>
      <tbody>
        {accounts.length === 0 && !loading ? (
          <tr><td colSpan={7}><EmptyState icon={<Landmark size={18} />} title="No accounts" desc="Add your first bank account." action={can('banking:write') ? { label: 'New Account', onClick: onNew } : undefined} /></td></tr>
        ) : accounts.map(a => (
          <AppTr key={a.id}>
            <AppTd>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center shrink-0">
                  <Landmark size={12} className="text-sky-600" />
                </div>
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{a.name}</span>
              </div>
            </AppTd>
            <AppTd><span className="text-[11px] text-slate-500">{a.bankName}</span></AppTd>
            <AppTd><span className="font-mono text-[11px] text-slate-400">{a.accountNumber}</span></AppTd>
            <AppTd><span className="text-[11px] text-slate-500">{a.currencyCode}</span></AppTd>
            <AppTd align="right"><Amount value={(a as any).computedBalance ?? (a as any).balance} size="sm" /></AppTd>
            <AppTd>
              {a.unreconciledCount > 0
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">{a.unreconciledCount} pending</span>
                : <span className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} />Clear</span>}
            </AppTd>
            <AppTd align="right">
              {can('banking:write') && (
                <button onClick={() => onDelete(a.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all" title="Delete account">
                  <AlertCircle size={11} />
                </button>
              )}
            </AppTd>
          </AppTr>
        ))}
      </tbody>
    </AppTable>
  </div>
);

// ── Transactions tab ──────────────────────────────────────────────────────────

const TransactionsTab: React.FC<{
  txns: BankTx[]; total: number; page: number; loading: boolean;
  search: string; statusFilter: string; typeFilter: string;
  onSearch: (v: string) => void;
  onStatus: (v: string) => void;
  onType: (v: string) => void;
  onPage: (p: number) => void;
  onReconcile: (id: string) => void;
  onNavigateNew: (type: 'income' | 'expense') => void;
}> = ({ txns, total, page, loading, search, statusFilter, typeFilter, onSearch, onStatus, onType, onPage, onReconcile, onNavigateNew }) => (
  <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <SearchBar value={search} onChange={onSearch} placeholder="Search transactions…" className="w-52" />
      <select value={typeFilter} onChange={e => onType(e.target.value)}
        className="px-2 py-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400/20">
        <option value="">All Types</option>
        <option value="CREDIT">Credits</option>
        <option value="DEBIT">Debits</option>
      </select>
      <select value={statusFilter} onChange={e => onStatus(e.target.value)}
        className="px-2 py-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400/20">
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="RECONCILED">Reconciled</option>
      </select>
      <div className="flex-1" />
      <Btn variant="ghost" size="sm" icon={<ArrowDownRight size={11} />} className="text-emerald-600 border-emerald-100 hover:bg-emerald-50" onClick={() => onNavigateNew('income')}>New Income</Btn>
      <Btn variant="ghost" size="sm" icon={<ArrowUpRight size={11} />} className="text-rose-600 border-rose-100 hover:bg-rose-50" onClick={() => onNavigateNew('expense')}>New Expense</Btn>
    </div>
    <AppTable loading={loading}>
      <thead><tr>
        <AppTh>Date</AppTh><AppTh>Description</AppTh><AppTh>Bank</AppTh>
        <AppTh align="right">Amount</AppTh><AppTh>Status</AppTh><AppTh align="right" width="90px">Actions</AppTh>
      </tr></thead>
      <tbody>
        {txns.length === 0 && !loading ? (
          <tr><td colSpan={6}><EmptyState icon={<Clock size={18} />} title="No transactions" desc="Import a bank statement or add a manual transaction." /></td></tr>
        ) : txns.map(t => {
          const isCredit = t.type === 'CREDIT' || Number(t.amount) > 0;
          return (
            <AppTr key={t.id}>
              <AppTd><span className="font-mono text-[11px] text-slate-500">{new Date(t.date).toLocaleDateString()}</span></AppTd>
              <AppTd>
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{t.description}</p>
                {t.reference && <p className="text-[10px] font-mono text-slate-400">{t.reference}</p>}
              </AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{t.bankAccountName ?? t.bankName ?? '—'}</span></AppTd>
              <AppTd align="right">
                <span className={`text-[12px] font-bold tabular-nums ${isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isCredit ? '+' : '-'}<Amount value={Math.abs(Number(t.amount))} size="sm" />
                </span>
              </AppTd>
              <AppTd><StatusBadge status={t.status} /></AppTd>
              <AppTd align="right">
                {t.status !== 'RECONCILED' && (
                  <button onClick={() => onReconcile(t.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 transition-all">
                    <CheckCircle2 size={10} /> Reconcile
                  </button>
                )}
              </AppTd>
            </AppTr>
          );
        })}
      </tbody>
    </AppTable>
    <Pagination page={page} total={total} pageSize={25} onChange={onPage} />
  </div>
);

// ── Transfers tab ─────────────────────────────────────────────────────────────

const TransfersTab: React.FC<{
  transfers: Transfer[]; total: number; page: number; loading: boolean;
  accounts: BankAccount[]; can: (p: string) => boolean;
  onPage: (p: number) => void;
  onNew: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ transfers, total, page, loading, accounts, can, onPage, onNew, onApprove, onReject }) => {
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id.slice(0, 8) + '…';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        {can('fund_transfers:write') && (
          <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={onNew}>New Transfer</Btn>
        )}
      </div>
      <AppTable loading={loading}>
        <thead><tr>
          <AppTh>From</AppTh><AppTh>To</AppTh><AppTh align="right">Amount</AppTh>
          <AppTh>Type</AppTh><AppTh>Reference</AppTh><AppTh>Date</AppTh>
          <AppTh>Status</AppTh><AppTh align="right" width="100px">Actions</AppTh>
        </tr></thead>
        <tbody>
          {transfers.length === 0 && !loading ? (
            <tr><td colSpan={8}><EmptyState icon={<ArrowLeftRight size={18} />} title="No transfers" desc="Create your first inter-account transfer." action={can('fund_transfers:write') ? { label: 'New Transfer', onClick: onNew } : undefined} /></td></tr>
          ) : transfers.map(t => (
            <AppTr key={t.id}>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-sky-50 flex items-center justify-center"><Landmark size={10} className="text-sky-600" /></div>
                  <span className="text-[11px] text-slate-700 truncate max-w-[120px]">{t.fromAccountName ?? getAccountName(t.fromAccountId)}</span>
                </div>
              </AppTd>
              <AppTd>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center"><Landmark size={10} className="text-emerald-600" /></div>
                  <span className="text-[11px] text-slate-700 truncate max-w-[120px]">{t.toAccountName ?? getAccountName(t.toAccountId)}</span>
                </div>
              </AppTd>
              <AppTd align="right"><Amount value={Number(t.amount)} size="sm" /></AppTd>
              <AppTd><span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">{t.type ?? 'INTERNAL'}</span></AppTd>
              <AppTd><span className="font-mono text-[10px] text-slate-400">{t.reference ?? '—'}</span></AppTd>
              <AppTd><span className="text-[11px] text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</span></AppTd>
              <AppTd><StatusBadge status={t.status} /></AppTd>
              <AppTd align="right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.status === 'PENDING' && can('fund_transfers:approve') && (
                    <>
                      <button onClick={() => onApprove(t.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all" title="Approve"><CheckCircle2 size={11} /></button>
                      <button onClick={() => onReject(t.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Reject"><AlertCircle size={11} /></button>
                    </>
                  )}
                </div>
              </AppTd>
            </AppTr>
          ))}
        </tbody>
      </AppTable>
      <Pagination page={page} total={total} pageSize={25} onChange={onPage} />
    </div>
  );
};

// ── Bank Feeds tab ────────────────────────────────────────────────────────────

const FEED_STATUS_STYLE: Record<string, string> = {
  CONNECTED:     'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800',
  DISCONNECTED:  'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  ERROR:         'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800',
  PENDING_AUTH:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800',
};

const FeedsTab: React.FC<{
  feeds: BankFeed[]; loading: boolean; accounts: BankAccount[];
  can: (p: string) => boolean;
  onConnect: (bankAccountId: string, provider: string) => void;
  onSync: (id: string) => void;
  onDisconnect: (id: string) => void;
  onReauth: (id: string) => void;
}> = ({ feeds, loading, accounts, can, onConnect, onSync, onDisconnect, onReauth }) => {
  const [connectAccountId, setConnectAccountId] = React.useState('');
  const [connectProvider, setConnectProvider] = React.useState('MANUAL');

  return (
    <div className="space-y-4">
      {/* Connect new feed */}
      {can('banking:write') && (
        <Card className="p-4">
          <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-3">Connect a Bank Feed</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Account</label>
              <Select value={connectAccountId} onChange={e => setConnectAccountId(e)}>
                <option value="">Select account…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </div>
            <div className="w-40">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Provider</label>
              <Select value={connectProvider} onChange={e => setConnectProvider(e)}>
                <option value="MANUAL">Manual / Upload</option>
                <option value="PLAID">Plaid (Open Banking)</option>
                <option value="GOCARDLESS">GoCardless</option>
              </Select>
            </div>
            <Btn variant="primary" size="sm" icon={<Rss size={11} />} disabled={!connectAccountId}
              onClick={() => { if (connectAccountId) { onConnect(connectAccountId, connectProvider); setConnectAccountId(''); } }}>
              Connect
            </Btn>
          </div>
        </Card>
      )}

      {/* Feed cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : feeds.length === 0 ? (
        <EmptyState icon={<Rss size={18} />} title="No bank feeds connected" desc="Connect Plaid, GoCardless, or use manual MT940/OFX import." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {feeds.map(f => {
            const acc = accounts.find(a => a.id === f.bankAccountId);
            const cls = FEED_STATUS_STYLE[f.status] ?? FEED_STATUS_STYLE.DISCONNECTED;
            return (
              <div key={f.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{acc?.name ?? f.bankAccountId.slice(0,12)}</p>
                    <p className="text-[10px] text-slate-400">{f.provider}{f.institutionName ? ` · ${f.institutionName}` : ''}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{f.status}</span>
                </div>
                {f.lastSyncAt && <p className="text-[10px] text-slate-400 mb-3">Last sync: {new Date(f.lastSyncAt).toLocaleString()}</p>}
                {f.errorMessage && <p className="text-[10px] text-rose-500 mb-2">{f.errorMessage}</p>}
                <div className="flex items-center gap-2">
                  <Btn variant="secondary" size="sm" icon={<RefreshCw size={10} />} onClick={() => onSync(f.id)}>Sync</Btn>
                  {f.status === 'ERROR' || f.status === 'PENDING_AUTH' ? (
                    <Btn variant="ghost" size="sm" onClick={() => onReauth(f.id)}>Re-authenticate</Btn>
                  ) : (
                    <Btn variant="ghost" size="sm" onClick={() => onDisconnect(f.id)}>Disconnect</Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual import shortcut */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <Upload size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">Manual MT940 / OFX Import</p>
          <p className="text-[10px] text-slate-400">Upload .OFX, .QBO, or .XML bank statements</p>
        </div>
        <Btn variant="secondary" size="sm" icon={<Upload size={11} />} onClick={() => window.location.href = '/banking/statement-import'}>Import</Btn>
      </div>
    </div>
  );
};

// ── Reconciliation tab ────────────────────────────────────────────────────────

const ReconciliationTab: React.FC<{
  stats: ReconStats | null; loading: boolean;
  onRunSmart: (auto: boolean) => void; running: boolean;
  onNavigateFull: () => void;
}> = ({ stats, loading, onRunSmart, running, onNavigateFull }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 justify-end">
      <Btn variant="secondary" size="sm" icon={<RefreshCw size={11} className={running ? 'animate-spin' : ''} />}
        loading={running} onClick={() => onRunSmart(false)}>Analyse</Btn>
      <Btn variant="primary" size="sm" icon={<TrendingUp size={11} />}
        loading={running} onClick={() => onRunSmart(true)}>Auto-Reconcile</Btn>
      <Btn variant="ghost" size="sm" onClick={onNavigateFull}>Full Workspace →</Btn>
    </div>

    {/* Stats strip */}
    {loading ? (
      <div className="grid grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden">
        {[1,2,3,4].map(i => <div key={i} className="bg-white dark:bg-slate-950 p-5"><div className="h-3 w-20 bg-slate-100 rounded animate-pulse mb-2" /><div className="h-7 w-14 bg-slate-100 rounded animate-pulse" /></div>)}
      </div>
    ) : stats ? (
      <AppKpi cells={[
        { label: 'Total',    value: stats.total,                                 color: 'slate'   as const },
        { label: 'Reconciled', value: stats.reconciled,                          color: 'emerald' as const },
        { label: 'Pending',  value: stats.pending,                               color: stats.pending > 0 ? 'amber' as const : 'emerald' as const },
        { label: 'Rate',     value: `${stats.reconciliationRate}%`,              color: stats.reconciliationRate >= 80 ? 'emerald' as const : 'amber' as const },
      ]} />
    ) : null}

    {/* Per-account breakdown */}
    {stats && stats.byAccount.length > 0 && (
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">By Account</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.byAccount.map(acc => (
            <div key={acc.accountId} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 mb-2">
                <Landmark size={12} className="text-sky-500 shrink-0" />
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{acc.accountName}</p>
              </div>
              {acc.bankName && <p className="text-[10px] text-slate-400 mb-2">{acc.bankName}</p>}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acc.pendingCount > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'}`}>
                  {acc.pendingCount > 0 ? `${acc.pendingCount} pending` : 'Clear'}
                </span>
                {acc.pendingAmount > 0 && <span className="text-[10px] font-mono text-slate-400">{fmtETB(acc.pendingAmount)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Period reconciliation info */}
    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex items-start gap-3">
        <ShieldCheck size={16} className="text-sky-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-1">Period Reconciliation</p>
          <p className="text-[11px] text-slate-500 mb-3">Enter your bank statement closing balance and match transactions until discrepancy = 0.</p>
          <Btn variant="secondary" size="sm" onClick={onNavigateFull}>Open Reconciliation Workspace</Btn>
        </div>
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

type BankTab = 'overview' | 'accounts' | 'transactions' | 'transfers' | 'feeds' | 'reconciliation';

const Banking: React.FC = () => {
  usePageTitle('Banking');
  const navigate    = useNavigate();
  const { can }     = useAuth();
  const { selectedCompanyId } = useBusiness();
  const qc          = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab — driven by URL ?tab=
  const activeTab   = (searchParams.get('tab') as BankTab) || 'overview';
  const setTab      = (t: BankTab) => setSearchParams({ tab: t }, { replace: true });

  // Shared pagination / filter state
  const [txPage,  setTxPage]    = useState(1);
  const [txSearch, setTxSearch] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txType,   setTxType]   = useState('');
  const [trPage,  setTrPage]    = useState(1);
  const [transferModal, setTransferModal] = useState<{ open: boolean; data: Partial<Transfer> }>({ open: false, data: {} });
  const [accountModal, setAccountModal]   = useState<{ open: boolean; data: Partial<BankAccount> }>({ open: false, data: {} });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [running, setRunning] = useState(false);

  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['banking-dashboard', selectedCompanyId],
    queryFn: () => api.get(`/banking/dashboard${cq}`).then((r: any) => r.data?.data ?? r.data).catch(() => null),
    staleTime: 30_000,
    enabled: activeTab === 'overview',
  });

  const { data: accountsRaw = [], isLoading: accsLoading, refetch: refetchAccs } = useQuery({
    queryKey: ['banking-accounts', selectedCompanyId],
    queryFn: () => api.get(`/banking/accounts${cq}`).then((r: any) => {
      const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : [];
    }).catch(() => []),
    staleTime: 60_000,
  });
  const accounts: BankAccount[] = accountsRaw;

  const { data: txRaw, isLoading: txLoading } = useQuery({
    queryKey: ['banking-txns', selectedCompanyId, txPage, txSearch, txStatus, txType],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(txPage), limit: '25' });
      if (selectedCompanyId) p.set('companyId', selectedCompanyId);
      if (txSearch)  p.set('search', txSearch);
      if (txStatus)  p.set('status', txStatus);
      if (txType)    p.set('type', txType);
      return api.get(`/banking/transactions?${p}`).then((r: any) => r.data?.data ?? r.data).catch(() => null);
    },
    staleTime: 20_000,
    enabled: activeTab === 'transactions',
  });
  const txns: BankTx[] = txRaw?.data ?? txRaw?.transactions ?? (Array.isArray(txRaw) ? txRaw : []);
  const txTotal        = txRaw?.total ?? txRaw?.pagination?.total ?? txns.length;

  const { data: transferRaw, isLoading: trLoading, refetch: refetchTr } = useQuery({
    queryKey: ['banking-transfers', selectedCompanyId, trPage],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(trPage), limit: '25' });
      if (selectedCompanyId) p.set('companyId', selectedCompanyId);
      return api.get(`/banking/transfers?${p}`).then((r: any) => r.data?.data ?? r.data).catch(() => null);
    },
    staleTime: 30_000,
    enabled: activeTab === 'transfers',
  });
  const transfers: Transfer[] = transferRaw?.data ?? (Array.isArray(transferRaw) ? transferRaw : []);
  const trTotal               = transferRaw?.total ?? transfers.length;

  const { data: feedsRaw = [], isLoading: feedsLoading, refetch: refetchFeeds } = useQuery({
    queryKey: ['banking-feeds', selectedCompanyId],
    queryFn: () => api.get(`/banking/feeds${cq}`).then((r: any) => {
      const d = r.data?.data ?? r.data; return Array.isArray(d) ? d : [];
    }).catch(() => []),
    staleTime: 60_000,
    enabled: activeTab === 'feeds',
  });
  const feeds: BankFeed[] = feedsRaw;

  const { data: reconStats, isLoading: reconLoading } = useQuery({
    queryKey: ['banking-recon-stats', selectedCompanyId],
    queryFn: () => api.get(`/banking/reconciliation/stats${cq}`).then((r: any) => r.data?.data ?? r.data).catch(() => null),
    staleTime: 30_000,
    enabled: activeTab === 'reconciliation',
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const reconcileMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/banking/transactions/${id}/reconcile`, {}),
    onSuccess: () => { toast.success('Marked as reconciled'); qc.invalidateQueries({ queryKey: ['banking-txns'] }); },
    onError: () => toast.error('Failed to reconcile'),
  });

  const saveAccount = useCallback(async () => {
    const d = accountModal.data;
    if (!d.name || !d.bankName || !d.accountNumber) { toast.error('Name, bank name and account number are required'); return; }
    setSavingAccount(true);
    try {
      await api.post('/banking/accounts', { ...d, companyId: selectedCompanyId });
      toast.success('Bank account created');
      setAccountModal({ open: false, data: {} });
      refetchAccs();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to create account');
    } finally {
      setSavingAccount(false);
    }
  }, [accountModal.data, selectedCompanyId, refetchAccs]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!confirm('Delete this bank account? This cannot be undone.')) return;
    try {
      await api.delete(`/banking/accounts/${id}`);
      toast.success('Account deleted');
      refetchAccs();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Cannot delete — account may have transactions');
    }
  }, [refetchAccs]);

  const saveTransfer = useCallback(async () => {
    const d = transferModal.data;
    if (!d.fromAccountId || !d.toAccountId) { toast.error('Select both accounts'); return; }
    if (!d.amount || d.amount <= 0) { toast.error('Enter a valid amount'); return; }
    setSavingTransfer(true);
    try {
      await api.post('/banking/transfers', { ...d, companyId: selectedCompanyId });
      toast.success('Transfer created');
      setTransferModal({ open: false, data: {} });
      refetchTr();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to create transfer');
    } finally {
      setSavingTransfer(false);
    }
  }, [transferModal.data, selectedCompanyId, refetchTr]);

  const approveTransfer = useCallback(async (id: string) => {
    try { await api.patch(`/banking/transfers/${id}/approve`); toast.success('Transfer approved'); refetchTr(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed to approve'); }
  }, [refetchTr]);

  const rejectTransfer = useCallback(async (id: string) => {
    try { await api.patch(`/banking/transfers/${id}/reject`); toast.success('Transfer rejected'); refetchTr(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed to reject'); }
  }, [refetchTr]);

  const connectFeed = useCallback(async (bankAccountId: string, provider: string) => {
    try {
      await api.post('/banking/feeds', { bankAccountId, provider, companyId: selectedCompanyId });
      toast.success('Feed connected'); refetchFeeds();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed to connect feed'); }
  }, [selectedCompanyId, refetchFeeds]);

  const syncFeed = useCallback(async (id: string) => {
    try { await api.post(`/banking/feeds/${id}/sync`); toast.success('Sync triggered'); refetchFeeds(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Sync failed'); }
  }, [refetchFeeds]);

  const disconnectFeed = useCallback(async (id: string) => {
    try { await api.delete(`/banking/feeds/${id}`); toast.success('Feed disconnected'); refetchFeeds(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed to disconnect'); }
  }, [refetchFeeds]);

  const reauthFeed = useCallback(async (id: string) => {
    try { await api.post(`/banking/feeds/${id}/reauthenticate`); toast.success('Re-authentication initiated'); refetchFeeds(); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed'); }
  }, [refetchFeeds]);

  const runSmartRecon = useCallback(async (autoApply: boolean) => {
    setRunning(true);
    try {
      const r = await api.post('/banking/reconciliation/run', { companyId: selectedCompanyId, applyAutoReconcile: autoApply });
      const result = r.data?.data ?? r.data;
      toast.success(autoApply
        ? `Auto-reconciled ${result?.autoReconciled ?? 0} · ${result?.needsReview ?? 0} need review`
        : `Analysed ${result?.processed ?? 0} transactions`);
      qc.invalidateQueries({ queryKey: ['banking-recon-stats'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Reconciliation failed');
    } finally {
      setRunning(false);
    }
  }, [selectedCompanyId, qc]);

  // ── Tab counts ─────────────────────────────────────────────────────────────

  const tabs = useMemo(() => [
    { key: 'overview',        label: 'Overview',        count: undefined },
    { key: 'accounts',        label: 'Accounts',        count: accounts.length || undefined },
    { key: 'transactions',    label: 'Transactions',    count: undefined },
    { key: 'transfers',       label: 'Transfers',       count: undefined },
    { key: 'feeds',           label: 'Bank Feeds',      count: feeds.length  || undefined },
    { key: 'reconciliation',  label: 'Reconciliation',  count: reconStats?.pending || undefined },
  ], [accounts.length, feeds.length, reconStats?.pending]);

  return (
    <AppPage
      title="Banking"
      subtitle="Accounts · Transactions · Transfers · Bank Feeds · Reconciliation"
      icon={<Landmark size={18} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'Banking' }]}
      tabs={<AppTabs tabs={tabs} active={activeTab} onChange={k => setTab(k as BankTab)} />}
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'overview'    && <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={() => refetchDash()}>Refresh</Btn>}
          {activeTab === 'accounts'   && can('banking:write')         && <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setAccountModal({ open: true, data: {} })}>New Account</Btn>}
          {activeTab === 'transfers'  && can('fund_transfers:write')  && <Btn variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => setTransferModal({ open: true, data: { type: 'INTERNAL' } })}>New Transfer</Btn>}
          {activeTab === 'reconciliation' && <Btn variant="primary" size="sm" icon={<ShieldCheck size={11} />} onClick={() => navigate('/banking/reconciliation')}>Full Workspace</Btn>}
          <Btn variant="secondary" size="sm" icon={<ShieldCheck size={11} />} onClick={() => navigate('/banking/verify')}>Verify &amp; Validate</Btn>
        </div>
      }
    >
      {activeTab === 'overview' && (
        <OverviewTab
          dashboard={dashboard} loading={dashLoading} accounts={accounts}
          onNewAccount={() => setAccountModal({ open: true, data: {} })}
          onNavigate={navigate}
        />
      )}
      {activeTab === 'accounts' && (
        <AccountsTab
          accounts={accounts} loading={accsLoading} can={(p: string) => can(p as any)}
          onNew={() => setAccountModal({ open: true, data: {} })}
          onRefetch={refetchAccs}
          onDelete={deleteAccount}
        />
      )}
      {activeTab === 'transactions' && (
        <TransactionsTab
          txns={txns} total={txTotal} page={txPage} loading={txLoading}
          search={txSearch} statusFilter={txStatus} typeFilter={txType}
          onSearch={v => { setTxSearch(v); setTxPage(1); }}
          onStatus={v => { setTxStatus(v); setTxPage(1); }}
          onType={v => { setTxType(v); setTxPage(1); }}
          onPage={setTxPage}
          onReconcile={id => reconcileMutation.mutate(id)}
          onNavigateNew={type => navigate(`/banking/transactions?action=${type}`)}
        />
      )}
      {activeTab === 'transfers' && (
        <TransfersTab
          transfers={transfers} total={trTotal} page={trPage} loading={trLoading}
          accounts={accounts} can={(p: string) => can(p as any)}
          onPage={setTrPage}
          onNew={() => setTransferModal({ open: true, data: { type: 'INTERNAL' } })}
          onApprove={approveTransfer}
          onReject={rejectTransfer}
        />
      )}
      {activeTab === 'feeds' && (
        <FeedsTab
          feeds={feeds} loading={feedsLoading} accounts={accounts} can={(p: string) => can(p as any)}
          onConnect={connectFeed} onSync={syncFeed}
          onDisconnect={disconnectFeed} onReauth={reauthFeed}
        />
      )}
      {activeTab === 'reconciliation' && (
        <ReconciliationTab
          stats={reconStats} loading={reconLoading}
          onRunSmart={runSmartRecon} running={running}
          onNavigateFull={() => navigate('/banking/reconciliation')}
        />
      )}

      {/* New Account modal */}
      <Modal open={accountModal.open} onClose={() => setAccountModal(m => ({ ...m, open: false }))}
        title="New Bank Account" subtitle="Add a payment account to track cash flow"
        footer={<><Btn variant="secondary" onClick={() => setAccountModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={savingAccount} onClick={saveAccount}>Create Account</Btn></>}>
        <AccountForm data={accountModal.data} onChange={d => setAccountModal(m => ({ ...m, data: d }))} />
      </Modal>

      {/* New Transfer modal */}
      <Modal open={transferModal.open} onClose={() => setTransferModal(m => ({ ...m, open: false }))}
        title="New Fund Transfer" subtitle="Inter-account transfer · Ethiopian bank accounts"
        footer={<><Btn variant="secondary" onClick={() => setTransferModal(m => ({ ...m, open: false }))}>Cancel</Btn><Btn variant="primary" loading={savingTransfer} onClick={saveTransfer}>Create Transfer</Btn></>}>
        <TransferForm data={transferModal.data} onChange={d => setTransferModal(m => ({ ...m, data: d }))} accounts={accounts} />
      </Modal>
    </AppPage>
  );
};

export default Banking;
