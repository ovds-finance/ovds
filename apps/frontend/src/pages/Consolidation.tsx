/**
 * Consolidation Page — IFRS 10 Group Consolidation Console
 *
 * AABE-compliant one-click consolidation for multi-entity groups.
 *
 * Functionality:
 *   1. Consolidated financial summary (net revenue/expenses/assets/liabilities after IC eliminations)
 *   2. Unmatched intercompany balance detection (pre-close audit check)
 *   3. One-click bulk elimination posting for a period
 *   4. SHA-256 ledger hash-chain integrity verification
 *   5. Manual auto-compute VAT pro-rata apportionment
 *
 * IFRS 10.B86 — all intercompany balances and transactions are eliminated
 * before the consolidated statements are submitted to AABE.
 */
import { EmptyState } from '@ovds/ui';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { Can } from '../components/can';
import { useBusiness } from '../context/businessContext';
import {
  useConsolidatedSummary,
  useUnmatchedBalances,
  useRunEliminations,
  useLedgerIntegrity,
  useAutoApportionment,
  type LedgerIntegrityResult,
} from '../hooks/useConsolidation';
import { usePageTitle } from '../hooks/usePageTitle';

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtETB(n: number): string {
  return new Intl.NumberFormat('en-ET', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, gross, eliminated, net, currency = 'ETB' }: {
  label: string;
  gross: number;
  eliminated: number;
  net: number;
  currency?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
          {fmtETB(net)}
        </span>
        <span className="text-xs text-slate-400 pb-0.5">{currency}</span>
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500 flex gap-3 mt-1">
        <span>Gross: {fmtETB(gross)}</span>
        <span className="text-amber-500">Eliminated: {fmtETB(eliminated)}</span>
      </div>
    </div>
  );
}

// ── Integrity Badge ───────────────────────────────────────────────────────────

function IntegrityBadge({ result }: { result: LedgerIntegrityResult | null }) {
  if (!result) return null;
  if (result.intact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-green-300 text-xs font-semibold px-3 py-1">
        ✓ Chain intact — {result.verified} entries verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold px-3 py-1">
      ⚠ {result.violations} violation{result.violations !== 1 ? 's' : ''} detected — escalate to AABE
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ConsolidationPage() {
  usePageTitle('Group Consolidation');
  const { selectedCompanyId } = useBusiness();

  const [period, setPeriod] = useState(currentPeriod());
  // In a multi-entity setup, entityGroupId would come from a selector.
  // For now we use a query param or default to empty (shows empty state with instructions).
  const [entityGroupId, setEntityGroupId] = useState('');
  const [showViolations, setShowViolations] = useState(false);

  // ── Data hooks ─────────────────────────────────────────────────────────────
  const { summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } =
    useConsolidatedSummary(entityGroupId || undefined, period);

  const { unmatched, count: unmatchedCount, loading: unmatchedLoading, refetch: refetchUnmatched } =
    useUnmatchedBalances(period);

  const { run, running, result: runResult } = useRunEliminations();

  const { result: integrityResult, verifying, verify } = useLedgerIntegrity(selectedCompanyId ?? undefined);

  const { result: apportionmentResult, computing, compute } = useAutoApportionment(selectedCompanyId ?? undefined);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRunEliminations = useCallback(async () => {
    const res = await run(period);
    if (res) {
      toast.success(`Period close: ${res.posted} elimination(s) posted`);
      if (res.failed > 0) toast.error(`${res.failed} elimination(s) failed — check errors below`);
      refetchSummary();
      refetchUnmatched();
    }
  }, [run, period, refetchSummary, refetchUnmatched]);

  const handleVerifyChain = useCallback(async () => {
    const res = await verify();
    if (res) {
      if (res.intact) toast.success(`Ledger chain intact — ${res.verified} entries verified`);
      else toast.error(`⚠ ${res.violations} violation(s) detected — escalate immediately`);
    }
  }, [verify]);

  const handleAutoApportionment = useCallback(async () => {
    const res = await compute(period);
    if (res) {
      toast.success(
        `Apportionment: ${pct(res.apportionmentPct)} claimable — non-recoverable VAT ETB ${fmtETB(res.nonRecoverableVat)}`,
      );
    }
  }, [compute, period]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!selectedCompanyId) {
    return <EmptyState message="Select a company to use the consolidation console." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Group Consolidation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            IFRS 10.B86 intercompany elimination and AABE immutable audit trail
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[var(--pro-azure)] outline-none"
          />
          <input
            placeholder="Entity Group ID"
            value={entityGroupId}
            onChange={e => setEntityGroupId(e.target.value)}
            className="w-52 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[var(--pro-azure)] outline-none"
          />
        </div>
      </div>

      {/* ── Consolidated Summary ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            Consolidated Financial Summary
          </h2>
          {summary && (
            <span className="text-xs text-slate-400">
              {summary.companies.length} entit{summary.companies.length !== 1 ? 'ies' : 'y'} · {summary.reportCurrency} · {summary.eliminationsApplied} eliminations applied
            </span>
          )}
        </div>

        {summaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : summaryError ? (
          <EmptyState message={summaryError} action={{ label: 'Retry', onClick: refetchSummary }} />
        ) : !summary ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-slate-400 text-sm">
            Enter an Entity Group ID above to view consolidated figures.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Revenue" gross={summary.grossRevenue} eliminated={summary.eliminatedRevenue} net={summary.netRevenue} />
            <KpiCard label="Expenses" gross={summary.grossExpenses} eliminated={summary.eliminatedExpenses} net={summary.netExpenses} />
            <KpiCard label="Assets" gross={summary.grossAssets} eliminated={summary.eliminatedReceivables} net={summary.netAssets} />
            <KpiCard label="Liabilities" gross={summary.grossLiabilities} eliminated={summary.eliminatedPayables} net={summary.netLiabilities} />
          </div>
        )}

        {(summary?.pendingEliminations ?? 0) > 0 && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <span>⚠</span>
            <span>{summary?.pendingEliminations} pending elimination(s) not yet posted — run period close to complete.</span>
          </div>
        )}
      </section>

      {/* ── Two-column: Unmatched Balances + Actions ──────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Unmatched Balances */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Unmatched IC Balances
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Pre-close audit check — IFRS 10.B86</p>
            </div>
            {unmatchedCount > 0 && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5">
                {unmatchedCount}
              </span>
            )}
          </div>

          {unmatchedLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}
            </div>
          ) : unmatchedCount === 0 ? (
            <p className="text-sm text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-medium">
              ✓ All intercompany balances are matched for {period}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left py-1.5 font-medium">From</th>
                    <th className="text-left py-1.5 font-medium">To</th>
                    <th className="text-right py-1.5 font-medium">Amount (ETB)</th>
                    <th className="text-left py-1.5 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {unmatched.slice(0, 8).map((u) => (
                    <tr key={u.transactionId} className="border-b border-slate-50 dark:border-slate-700/50">
                      <td className="py-1.5 font-mono text-slate-600 dark:text-slate-300">{u.fromCompanyId.slice(0, 8)}…</td>
                      <td className="py-1.5 font-mono text-slate-600 dark:text-slate-300">{u.toCompanyId.slice(0, 8)}…</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-800 dark:text-slate-100">{fmtETB(u.amount)}</td>
                      <td className="py-1.5">
                        <span className="rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs">
                          {u.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {unmatchedCount > 8 && (
                <p className="text-xs text-slate-400 mt-2">+{unmatchedCount - 8} more unmatched</p>
              )}
            </div>
          )}
        </section>

        {/* Actions panel */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Consolidation Actions
          </h2>

          {/* Period close */}
          <Can permission="ovds:write">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Period Close — Run All Eliminations</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">
                Detects all unmatched IC transactions and posts elimination journal entries. Safe to re-run.
              </p>
              <button
                onClick={handleRunEliminations}
                disabled={running}
                className="rounded-lg bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 transition-colors"
              >
                {running ? 'Running…' : `Run eliminations for ${period}`}
              </button>
              {runResult && (
                <div className="mt-3 text-xs space-y-0.5">
                  <p className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">✓ {runResult.posted} posted</p>
                  {runResult.failed > 0 && <p className="text-red-500">✗ {runResult.failed} failed</p>}
                </div>
              )}
            </div>
          </Can>

          {/* Ledger integrity */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Ledger Hash-Chain Verification</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Re-derives SHA-256 hashes over all posted journal entries. Any violation means tampering — AABE escalation required.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleVerifyChain}
                disabled={verifying}
                className="rounded-lg border border-slate-300 dark:border-slate-600 hover:border-slate-400 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-1.5 transition-colors disabled:opacity-50"
              >
                {verifying ? 'Verifying…' : 'Verify chain'}
              </button>
              <IntegrityBadge result={integrityResult} />
            </div>
            {integrityResult && !integrityResult.intact && (
              <div className="mt-3">
                <button
                  onClick={() => setShowViolations(v => !v)}
                  className="text-xs text-red-500 underline"
                >
                  {showViolations ? 'Hide' : 'Show'} violations
                </button>
                {showViolations && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {integrityResult.details.map((v) => (
                      <div key={v.sourceId} className="rounded bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-700 dark:text-red-300">
                        <span className="font-mono">{v.sourceId}</span> — stored hash mismatch
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Auto-compute VAT apportionment */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Auto-Compute VAT Apportionment</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Computes pro-rata input VAT ratio from live sales data (Proc. 1341/2024 Art. 26).
            </p>
            <button
              onClick={handleAutoApportionment}
              disabled={computing}
              className="rounded-lg border border-slate-300 dark:border-slate-600 hover:border-slate-400 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-1.5 transition-colors disabled:opacity-50"
            >
              {computing ? 'Computing…' : `Compute for ${period}`}
            </button>
            {apportionmentResult && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400">Taxable sales</p>
                  <p className="font-medium tabular-nums">{fmtETB(apportionmentResult.taxableSales)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Exempt sales</p>
                  <p className="font-medium tabular-nums">{fmtETB(apportionmentResult.exemptSales)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Claimable ratio</p>
                  <p className="font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">{pct(apportionmentResult.apportionmentPct)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Non-recoverable VAT</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{fmtETB(apportionmentResult.nonRecoverableVat)}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
