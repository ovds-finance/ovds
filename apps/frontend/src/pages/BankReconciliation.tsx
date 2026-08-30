/**
 * BankReconciliation — Smart reconciliation workspace
 *
 * Surfaces the full ReconciliationService backend:
 *  - Auto-run smart matching (multi-signal: exact ref, QR, fuzzy, amount+date)
 *  - Per-transaction match proposals with confidence scores (0–100)
 *  - One-click confirm / dismiss
 *  - Bulk reconcile selected transactions
 *  - Stats strip: total / reconciled / pending / reconciliation rate
 *  - Filter by bank account, status, search
 *
 * API endpoints consumed:
 *   GET  /ovds/reconciliation/stats
 *   GET  /ovds/reconciliation/pending
 *   POST /ovds/reconciliation/run           { companyId, applyAutoReconcile }
 *   POST /ovds/reconciliation/:id/confirm   { matchType, matchId }
 *   POST /ovds/reconciliation/:id/dismiss
 *   POST /ovds/bank-transactions/bulk-reconcile  { ids }
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  Search,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Landmark,
  Filter,
  ArrowRight,
  Clock,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../rbac/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBusiness } from '../context/businessContext';
import {
  AppPage,
  AppTabs,
  AppKpi,
  AppTable,
  AppTh,
  AppTd,
  AppTr,
  Btn,
  Card,
  StatusBadge,
  EmptyState,
  SearchBar,
  Amount,
} from '../components/ui';
import api from '../services/api';

// -- Types ---------------------------------------------------------------------

interface MatchCandidate {
  type: 'INVOICE' | 'BILL';
  id: string;
  number: string;
  amount: number;
  date: string;
  counterparty: string;
  score: number;
  method: string;
  signals: string[];
}

interface TxProposal {
  transactionId: string;
  transaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: string;
    reference: string | null;
    telecomRef: string | null;
    bankName: string | null;
    status: string;
  };
  candidates: MatchCandidate[];
  topMatch: MatchCandidate | null;
  autoReconcile: boolean;
}

interface ReconStats {
  total: number;
  reconciled: number;
  pending: number;
  withProposedMatch?: number;
  reconciliationRate: number;
  byAccount: Array<{
    accountId: string;
    accountName: string;
    bankName: string | null;
    pendingCount: number;
    pendingAmount: number;
  }>;
}

interface PendingPage {
  transactions: any[];
  total: number;
  page: number;
  pages: number;
}

type ViewTab = 'pending' | 'reconciled' | 'all';

// -- Score badge ----------------------------------------------------------------
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const cls =
    score >= 85
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
      : score >= 50
        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
        : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800';
  const label = score >= 85 ? 'Auto' : score >= 50 ? 'Review' : 'Low';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${cls}`}
    >
      {label} {score}%
    </span>
  );
};

// -- Method badge ---------------------------------------------------------------
const METHOD_LABELS: Record<string, { label: string; cls: string }> = {
  EXACT_REF: { label: 'Exact Ref', cls: 'text-emerald-700 bg-emerald-50' },
  QR: { label: 'QR Code', cls: 'text-violet-700 bg-violet-50' },
  FUZZY_REF: { label: 'Fuzzy Ref', cls: 'text-amber-700 bg-amber-50' },
  AMOUNT_DATE: { label: 'Amt + Date', cls: 'text-sky-700 bg-sky-50' },
  AMOUNT_ONLY: { label: 'Amount Only', cls: 'text-slate-600 bg-white' },
  MANUAL: { label: 'Manual', cls: 'text-slate-600 bg-slate-100' },
};
const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const m = METHOD_LABELS[method] ?? {
    label: method,
    cls: 'text-slate-500 bg-white',
  };
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${m.cls}`}
    >
      {m.label}
    </span>
  );
};

// -- Proposal row — expandable -------------------------------------------------
const ProposalRow: React.FC<{
  proposal: TxProposal;
  selected: boolean;
  onSelect: () => void;
  onConfirm: (matchType: string, matchId: string) => void;
  onDismiss: () => void;
  confirming: boolean;
}> = ({ proposal, selected, onSelect, onConfirm, onDismiss, confirming }) => {
  const [expanded, setExpanded] = useState(false);
  const { transaction: tx, topMatch, candidates } = proposal;
  const isCredit = tx.type === 'CREDIT' || Number(tx.amount) > 0;

  return (
    <>
      <AppTr
        className={
          selected ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : undefined
        }
      >
        {/* Checkbox */}
        <AppTd className="w-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="rounded border-slate-300 text-emerald-600 focus:ring-teal-400/20"
          />
        </AppTd>

        {/* Date */}
        <AppTd>
          <span className="text-[11px] font-mono text-slate-500">
            {new Date(tx.date).toLocaleDateString('en-ET', {
              day: '2-digit',
              month: 'short',
              year: '2-digit',
            })}
          </span>
        </AppTd>

        {/* Description */}
        <AppTd>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
              {tx.description}
            </p>
            {tx.reference && (
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {tx.reference}
              </p>
            )}
            {tx.bankName && (
              <p className="text-[9px] text-slate-400">{tx.bankName}</p>
            )}
          </div>
        </AppTd>

        {/* Amount */}
        <AppTd align="right">
          <span
            className={`tabular-nums font-bold text-[12px] ${isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
          >
            {isCredit ? '+' : '-'}
            <Amount value={Math.abs(Number(tx.amount))} size="sm" />
          </span>
          <span
            className={`block text-[9px] font-bold mt-0.5 ${isCredit ? 'text-emerald-500' : 'text-rose-400'}`}
          >
            {tx.type}
          </span>
        </AppTd>

        {/* Top match */}
        <AppTd>
          {topMatch ? (
            <div className="flex items-center gap-2">
              <ScoreBadge score={topMatch.score} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  {topMatch.number}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {topMatch.counterparty}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-slate-300 italic">
              No match found
            </span>
          )}
        </AppTd>

        {/* Method */}
        <AppTd>{topMatch && <MethodBadge method={topMatch.method} />}</AppTd>

        {/* Actions */}
        <AppTd align="right">
          <div className="flex items-center justify-end gap-1.5">
            {topMatch && (
              <Btn
                size="sm"
                variant="primary"
                loading={confirming}
                onClick={() => onConfirm(topMatch.type, topMatch.id)}
                className="h-7 px-2.5 text-[10px]"
              >
                <CheckCircle size={10} className="mr-1" />
                Confirm
              </Btn>
            )}
            <Btn
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-7 px-2 text-[10px] text-slate-500"
            >
              Dismiss
            </Btn>
            {candidates.length > 0 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </AppTd>
      </AppTr>

      {/* Expanded candidates */}
      {expanded && candidates.length > 0 && (
        <tr className="bg-slate-50/60 dark:bg-slate-800/20">
          <td colSpan={7} className="px-6 py-3">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              {candidates.length} Candidate{candidates.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {candidates.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ScoreBadge score={c.score} />
                    <MethodBadge method={c.method} />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                        {c.type}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {c.number}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {c.counterparty}
                      </span>
                    </div>
                    <Amount value={c.amount} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    {c.signals.length > 0 && (
                      <span className="text-[9px] text-slate-400 italic hidden lg:block max-w-[200px] truncate">
                        {c.signals[0]}
                      </span>
                    )}
                    <Btn
                      size="sm"
                      variant="secondary"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        onConfirm(c.type, c.id);
                        setExpanded(false);
                      }}
                    >
                      Use this
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// -- Main page -----------------------------------------------------------------
const BankReconciliation: React.FC = () => {
  usePageTitle('Bank Reconciliation');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();

  const [stats, setStats] = useState<ReconStats | null>(null);
  const [pending, setPending] = useState<PendingPage | null>(null);
  const [proposals, setProposals] = useState<Map<string, TxProposal>>(
    new Map(),
  );

  const [statsLoading, setStatsLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ViewTab>('pending');
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkReconciling, setBulkReconciling] = useState(false);

  const cq = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

  // -- Load stats -------------------------------------------------------------
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await api.get(`/ovds/reconciliation/stats${cq}`);
      setStats(r.data?.data ?? r.data);
    } catch {
      // fallback to accounting reconciliation summary
      try {
        const r2 = await api.get(
          `/ovds/bank-accounts/reconciliation-summary${cq}`,
        );
        const d = r2.data?.data ?? r2.data;
        setStats({
          total: d?.total ?? 0,
          reconciled: d?.totalReconciled ?? d?.reconciled ?? 0,
          pending: d?.totalPending ?? d?.pending ?? 0,
          reconciliationRate:
            d?.total > 0
              ? Math.round(((d?.reconciled ?? 0) / d.total) * 100)
              : 0,
          byAccount: (d?.accounts ?? []).map((a: any) => ({
            accountId: a.id,
            accountName: a.name,
            bankName: null,
            pendingCount: a.pendingCount ?? 0,
            pendingAmount: 0,
          })),
        });
      } catch {
        /* silent */
      }
    } finally {
      setStatsLoading(false);
    }
  }, [cq]);

  // -- Load pending transactions ----------------------------------------------
  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const statusParam =
        activeTab === 'pending'
          ? '&status=PENDING'
          : activeTab === 'reconciled'
            ? '&status=RECONCILED'
            : '';
      const bankParam = bankFilter ? `&bankAccountId=${bankFilter}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const cqFull = selectedCompanyId ? `companyId=${selectedCompanyId}` : '';

      const r = await api.get(
        `/ovds/reconciliation/pending?${cqFull}&page=${page}&limit=30${statusParam}${bankParam}${searchParam}`,
      );
      const d = r.data?.data ?? r.data;
      setPending(d);
    } catch {
      // fallback: load all bank transactions
      try {
        const statusParam =
          activeTab === 'reconciled'
            ? '&status=RECONCILED'
            : activeTab === 'pending'
              ? '&status=PENDING'
              : '';
        const r2 = await api.get(
          `/ovds/bank-transactions?${cq.slice(1)}&page=${page}&limit=30${statusParam}`,
        );
        const d = r2.data?.data ?? r2.data;
        setPending({
          transactions: d?.data ?? d?.transactions ?? [],
          total: d?.total ?? 0,
          page,
          pages: Math.ceil((d?.total ?? 0) / 30),
        });
      } catch {
        /* silent */
      }
    } finally {
      setPendingLoading(false);
    }
  }, [selectedCompanyId, activeTab, search, bankFilter, page, cq]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  useEffect(() => {
    loadPending();
    setSelected(new Set());
  }, [loadPending]);

  // -- Run smart reconciliation -----------------------------------------------
  const runSmartReconciliation = async (autoApply = false) => {
    setRunning(true);
    try {
      const r = await api.post('/ovds/reconciliation/run', {
        companyId: selectedCompanyId,
        applyAutoReconcile: autoApply,
      });
      const result = r.data?.data ?? r.data;
      const proposalsArr: TxProposal[] = result?.proposals ?? [];

      // Merge proposals into map
      const newMap = new Map(proposals);
      proposalsArr.forEach((p) => newMap.set(p.transactionId, p));
      setProposals(newMap);

      if (autoApply) {
        toast.success(
          `Auto-reconciled ${result?.autoReconciled ?? 0} transactions · ${result?.needsReview ?? 0} need review`,
        );
      } else {
        toast.success(
          `Analysed ${result?.processed ?? 0} transactions · ${result?.needsReview ?? 0} matches proposed`,
        );
      }
      await Promise.all([loadStats(), loadPending()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Reconciliation failed');
    } finally {
      setRunning(false);
    }
  };

  // -- Confirm a match --------------------------------------------------------
  const confirmMatch = async (
    txId: string,
    matchType: string,
    matchId: string,
  ) => {
    setConfirmingId(txId);
    try {
      await api.post(`/ovds/reconciliation/transaction/${txId}/confirm`, {
        matchType,
        matchId,
      });
      toast.success('Transaction reconciled');
      setProposals((m) => {
        const nm = new Map(m);
        nm.delete(txId);
        return nm;
      });
      await Promise.all([loadStats(), loadPending()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to confirm');
    } finally {
      setConfirmingId(null);
    }
  };

  // -- Dismiss a match --------------------------------------------------------
  const dismissMatch = async (txId: string) => {
    try {
      await api.post(`/ovds/reconciliation/transaction/${txId}/dismiss`);
      toast.success('Marked as reconciled (no match)');
      setProposals((m) => {
        const nm = new Map(m);
        nm.delete(txId);
        return nm;
      });
      await Promise.all([loadStats(), loadPending()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to dismiss');
    }
  };

  // -- Bulk reconcile ---------------------------------------------------------
  const bulkReconcile = async () => {
    if (selected.size === 0) return;
    setBulkReconciling(true);
    try {
      const r = await api.post('/ovds/bank-transactions/bulk-reconcile', {
        ids: Array.from(selected),
        companyId: selectedCompanyId,
      });
      const d = r.data?.data ?? r.data;
      toast.success(
        `Reconciled ${d?.reconciled ?? selected.size} transactions`,
      );
      setSelected(new Set());
      await Promise.all([loadStats(), loadPending()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Bulk reconcile failed');
    } finally {
      setBulkReconciling(false);
    }
  };

  const transactions = pending?.transactions ?? [];
  const allIds = transactions
    .filter((t) => t.status === 'PENDING')
    .map((t: any) => t.id as string);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const kpiCells = useMemo(
    () => [
      {
        label: 'Total Transactions',
        value: stats?.total ?? '—',
        color: 'slate' as const,
      },
      {
        label: 'Reconciled',
        value: stats?.reconciled ?? '—',
        color: 'emerald' as const,
      },
      {
        label: 'Pending',
        value: stats?.pending ?? '—',
        color:
          (stats?.pending ?? 0 > 0) ? ('amber' as const) : ('emerald' as const),
      },
      {
        label: 'Reconciliation Rate',
        value: stats ? `${stats.reconciliationRate}%` : '—',
        color:
          (stats?.reconciliationRate ?? 0) >= 80
            ? ('emerald' as const)
            : ('amber' as const),
      },
    ],
    [stats],
  );

  return (
    <AppPage
      title="Bank Reconciliation"
      subtitle="Smart multi-signal matching — exact reference, QR code, amount + date window · Banking & ovds · Retail & E-commerce · Accounting & ovds Software · Revenue · Market Share"
      icon={<Landmark size={18} />}
      iconBg="bg-sky-500"
      crumbs={[{ label: 'Banking' }, { label: 'Reconciliation' }]}
      actions={
        <>
          <Btn
            variant="secondary"
            size="sm"
            icon={
              <RefreshCw size={11} className={running ? 'animate-spin' : ''} />
            }
            onClick={() => runSmartReconciliation(false)}
            loading={running}
          >
            Analyse
          </Btn>
          {can('bank_reconciliation:write') && (
            <Btn
              variant="primary"
              size="sm"
              icon={<Zap size={11} />}
              onClick={() => runSmartReconciliation(true)}
              loading={running}
            >
              Auto-Reconcile
            </Btn>
          )}
        </>
      }
    >
      {/* KPI strip */}
      {statsLoading ? (
        <div className="grid grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 p-5">
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-3" />
              <div className="h-7 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <AppKpi cells={kpiCells} />
      )}

      {/* By-account quick view */}
      {stats && stats.byAccount.length > 0 && (
        <div
          className="ovds-grid-layout cols-auto"
          style={{ '--grid-col-min': '200px' } as React.CSSProperties}
        >
          {stats.byAccount.map((acc) => (
            <button
              key={acc.accountId}
              onClick={() => {
                setBankFilter(acc.accountId);
                setActiveTab('pending');
              }}
              className={`text-left p-4 rounded-xl border transition-all hover:shadow-sm hover:border-sky-200 dark:hover:border-sky-800 ${bankFilter === acc.accountId ? 'border-sky-400 bg-sky-50/50 dark:bg-sky-950/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Landmark size={13} className="text-sky-500" />
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  {acc.accountName}
                </p>
              </div>
              {acc.bankName && (
                <p className="text-[10px] text-slate-400 mb-2">
                  {acc.bankName}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acc.pendingCount > 0 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'}`}
                >
                  {acc.pendingCount > 0
                    ? `${acc.pendingCount} pending`
                    : 'Clear'}
                </span>
                {bankFilter === acc.accountId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBankFilter('');
                    }}
                    className="text-[9px] text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    ✕ clear
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search transactions…"
          className="w-56"
        />
        {bankFilter && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-lg text-[10px] font-bold text-sky-700 dark:text-sky-400">
            <Filter size={9} /> Filtered by account
            <button
              onClick={() => setBankFilter('')}
              className="hover:text-rose-500 ml-1"
            >
              ✕
            </button>
          </span>
        )}
        <div className="flex-1" />
        {selected.size > 0 && (
          <Btn
            variant="secondary"
            size="sm"
            icon={
              bulkReconciling ? (
                <RefreshCw size={11} className="animate-spin" />
              ) : (
                <CheckCircle size={11} />
              )
            }
            onClick={bulkReconcile}
            loading={bulkReconciling}
          >
            Reconcile {selected.size} selected
          </Btn>
        )}
      </div>

      {/* Tab nav */}
      <AppTabs
        tabs={[
          { key: 'pending', label: 'Pending', count: stats?.pending ?? 0 },
          {
            key: 'reconciled',
            label: 'Reconciled',
            count: stats?.reconciled ?? 0,
          },
          { key: 'all', label: 'All', count: stats?.total ?? 0 },
        ]}
        active={activeTab}
        onChange={(k) => {
          setActiveTab(k as ViewTab);
          setPage(1);
        }}
      />

      {/* Table */}
      <AppTable>
        <thead>
          <tr>
            <AppTh width="40px">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-slate-300 text-emerald-600 focus:ring-teal-400/20"
              />
            </AppTh>
            <AppTh>Date</AppTh>
            <AppTh>Description</AppTh>
            <AppTh align="right">Amount</AppTh>
            <AppTh>Best Match</AppTh>
            <AppTh>Signal</AppTh>
            <AppTh align="right" width="180px">
              Actions
            </AppTh>
          </tr>
        </thead>
        <tbody>
          {pendingLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr
                key={i}
                className="border-b border-slate-50 dark:border-slate-800/50"
              >
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={<ShieldCheck size={20} className="text-emerald-400" />}
                  title={
                    activeTab === 'pending'
                      ? 'All clear — no pending transactions'
                      : 'No transactions found'
                  }
                  desc={
                    activeTab === 'pending'
                      ? 'Import a bank statement or run reconciliation to get started.'
                      : 'Try adjusting your filters.'
                  }
                  action={
                    activeTab === 'pending'
                      ? {
                          label: 'Import Statement',
                          onClick: () =>
                            (window.location.href = '/banking/statement-import'),
                        }
                      : undefined
                  }
                />
              </td>
            </tr>
          ) : (
            transactions.map((tx: any) => {
              const proposal = proposals.get(tx.id);
              if (proposal) {
                return (
                  <ProposalRow
                    key={tx.id}
                    proposal={proposal}
                    selected={selected.has(tx.id)}
                    onSelect={() =>
                      setSelected((s) => {
                        const ns = new Set(s);
                        if (ns.has(tx.id)) {
                          ns.delete(tx.id);
                        } else {
                          ns.add(tx.id);
                        }
                        return ns;
                      })
                    }
                    onConfirm={(type, id) => confirmMatch(tx.id, type, id)}
                    onDismiss={() => dismissMatch(tx.id)}
                    confirming={confirmingId === tx.id}
                  />
                );
              }

              // Flat row for non-analysed / already-reconciled transactions
              const isCredit = tx.type === 'CREDIT' || Number(tx.amount) > 0;
              const isReconciled = tx.status === 'RECONCILED';
              return (
                <AppTr
                  key={tx.id}
                  className={isReconciled ? 'opacity-60' : undefined}
                >
                  <AppTd className="w-10">
                    {!isReconciled && (
                      <input
                        type="checkbox"
                        checked={selected.has(tx.id)}
                        onChange={() =>
                          setSelected((s) => {
                            const ns = new Set(s);
                            if (ns.has(tx.id)) {
                              ns.delete(tx.id);
                            } else {
                              ns.add(tx.id);
                            }
                            return ns;
                          })
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-teal-400/20"
                      />
                    )}
                  </AppTd>
                  <AppTd>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(tx.date).toLocaleDateString('en-ET', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </span>
                  </AppTd>
                  <AppTd>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                        {tx.description}
                      </p>
                      {tx.reference && (
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {tx.reference}
                        </p>
                      )}
                      {(tx.bankAccount?.name || tx.bankName) && (
                        <p className="text-[9px] text-slate-400">
                          {tx.bankAccount?.name ?? tx.bankName}
                        </p>
                      )}
                    </div>
                  </AppTd>
                  <AppTd align="right">
                    <span
                      className={`tabular-nums font-bold text-[12px] ${isCredit ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                    >
                      {isCredit ? '+' : '-'}
                      <Amount value={Math.abs(Number(tx.amount))} size="sm" />
                    </span>
                  </AppTd>
                  <AppTd>
                    {isReconciled ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <CheckCircle size={11} /> Reconciled
                      </span>
                    ) : tx.matchedInvoiceId || tx.matchedBillId ? (
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <Clock size={10} /> Proposed match
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">
                        Not analysed
                      </span>
                    )}
                  </AppTd>
                  <AppTd>
                    {tx.matchMethod && <MethodBadge method={tx.matchMethod} />}
                  </AppTd>
                  <AppTd align="right">
                    {!isReconciled && (
                      <div className="flex items-center justify-end gap-1.5">
                        {(tx.matchedInvoiceId || tx.matchedBillId) &&
                          tx.matchScore && <ScoreBadge score={tx.matchScore} />}
                        {can('bank_reconciliation:write') && (
                          <Btn
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-[10px]"
                            onClick={async () => {
                              if (tx.matchedInvoiceId) {
                                await confirmMatch(
                                  tx.id,
                                  'INVOICE',
                                  tx.matchedInvoiceId,
                                );
                              } else if (tx.matchedBillId) {
                                await confirmMatch(
                                  tx.id,
                                  'BILL',
                                  tx.matchedBillId,
                                );
                              } else {
                                await dismissMatch(tx.id);
                              }
                            }}
                            loading={confirmingId === tx.id}
                          >
                            {tx.matchedInvoiceId || tx.matchedBillId
                              ? 'Confirm'
                              : 'Dismiss'}
                          </Btn>
                        )}
                      </div>
                    )}
                  </AppTd>
                </AppTr>
              );
            })
          )}
        </tbody>
      </AppTable>

      {/* Pagination */}
      {pending && pending.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Page {page} of {pending.pages} · {pending.total} transactions
          </span>
          <div className="flex items-center gap-2">
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </Btn>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(pending.pages, p + 1))}
              disabled={page >= pending.pages}
            >
              Next →
            </Btn>
          </div>
        </div>
      )}

      {/* Explainer */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/10 border border-sky-200 dark:border-sky-800 rounded-xl">
        <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-1.5">
          How Smart Matching Works
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: 'Exact Ref',
              score: '95–98%',
              desc: 'Reference / telecom / voucher code exact match',
            },
            {
              label: 'QR Code',
              score: '96–99%',
              desc: 'EMV QR or NBE-IQR parsed invoice number + amount',
            },
            {
              label: 'Fuzzy Ref',
              score: '70–85%',
              desc: 'Partial reference or description substring',
            },
            {
              label: 'Amt + Date',
              score: '50–70%',
              desc: 'Matching amount within ±3 days',
            },
            {
              label: 'Amount Only',
              score: '40–50%',
              desc: 'Amount match, no date correlation',
            },
          ].map((m) => (
            <div
              key={m.label}
              className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-sky-100 dark:border-sky-900"
            >
              <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400">
                {m.label}
              </p>
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                {m.score}
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-sky-600 dark:text-sky-500 mt-2">
          Auto-Reconcile applies matches scoring ≥ 85. Scores 50–84 are proposed
          for manual review. Scores &lt; 50 remain unmatched.
        </p>
      </div>
    </AppPage>
  );
};

export default BankReconciliation;
