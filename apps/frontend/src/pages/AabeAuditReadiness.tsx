/**
 * AABE Audit Readiness Page
 *
 * Displays a real-time 0–100 audit-readiness score across AABE criteria:
 *   - Trial balance balanced
 *   - Period locked
 *   - No orphan accounts
 *   - VAT filed
 *   - WHT certificates issued
 *   - PAYE declarations filed
 *   - Audit trail coverage
 *   - IFRS statements available
 *
 * Also shows the Dual-Ledger status (Management/Tax book vs IFRS Statutory book)
 * and a link to the AABE Disclosure Package.
 */
import { PageHeader, EmptyState, StatusBadge } from '@ovds/ui';
import { useState } from 'react';

import { Can } from '../components/can';
import { useBusiness } from '../context/businessContext';
import { useAabeAuditReadiness, useDualLedgerStatus } from '../features/accounting/hooks/useGlCompliance';
import { useIfrsDashboard } from '../features/accounting/hooks/useIfrs';

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function scoreColor(score: number) {
  if (score >= 90) return 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]';
  if (score >= 75) return 'text-amber-500 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function gradeBg(grade: string) {
  const map: Record<string, string> = {
    A: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300',
    B: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    F: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  return map[grade] ?? map['F'];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
          className="text-slate-200 dark:text-slate-700" />
        <circle cx="70" cy="70" r={radius} fill="none"
          stroke={score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444'}
          strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: '-8px' }}>
        <span className={`text-4xl font-bold tabular-nums ${scoreColor(score)}`}>{score}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
      </div>
      <span className={`mt-1 px-3 py-0.5 rounded-full text-sm font-semibold ${gradeBg(grade)}`}>
        Grade {grade}
      </span>
    </div>
  );
}

function CriterionRow({ criterion }: {
  criterion: { name: string; weight: number; passed: boolean; detail: string };
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          criterion.passed
            ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        }`}>
          {criterion.passed ? '✓' : '✗'}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          {criterion.name}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {criterion.passed ? criterion.weight : 0} / {criterion.weight} pts
        </span>
        <span className="text-slate-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="px-4 pb-3 pt-0 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          {criterion.detail}
        </div>
      )}
    </div>
  );
}

function DualLedgerCard({ period }: { period: string }) {
  const { data, isLoading } = useDualLedgerStatus(period);
  if (isLoading) return <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />;
  if (!data) return null;

  const d = data as any;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Dual-Ledger Status — {period}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Management / Tax Book</span>
            <StatusBadge status={d.managementTaxBook?.status === 'ACTIVE' ? 'ACTIVE' : 'EMPTY'} />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {d.managementTaxBook?.journalEntries ?? 0}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">journal entries</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.managementTaxBook?.description}</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">IFRS Statutory Book</span>
            <StatusBadge status={d.ifrsStatutoryBook?.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'} />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {d.ifrsStatutoryBook?.ifrsTaggedEntries ?? 0}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">IFRS-tagged entries</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.ifrsStatutoryBook?.description}</p>
        </div>
      </div>
      {d.deferredTax?.timingDifferenceRecords > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          IAS 12 deferred tax: {d.deferredTax.timingDifferenceRecords} timing difference record(s)
        </p>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500 italic">{d.aabeProclamation}</p>
    </div>
  );
}

function IfrsDashboardCard() {
  const { data, isLoading } = useIfrsDashboard();
  if (isLoading) return <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />;
  if (!data) return null;

  const d = data as any;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">IFRS Live Balances</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--pro-azure-50)] p-3 text-center">
          <p className="text-xs text-[var(--pro-azure)] font-medium">IFRS 15</p>
          <p className="text-lg font-bold text-[var(--pro-azure-dark)] tabular-nums">
            {Number(d.ifrs15?.totalDeferredRevenue ?? 0).toLocaleString('en-ET', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-[var(--pro-azure)]">ETB deferred</p>
        </div>
        <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3 text-center">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">IFRS 16</p>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200 tabular-nums">
            {Number(d.ifrs16?.totalRouAsset ?? 0).toLocaleString('en-ET', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-purple-500 dark:text-purple-400">ETB ROU asset</p>
        </div>
        <div className="rounded-lg bg-[var(--pro-azure-50)] dark:bg-green-900/20 p-3 text-center">
          <p className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-medium">IAS 38</p>
          <p className="text-lg font-bold text-[var(--pro-azure-dark)] dark:text-green-200 tabular-nums">
            {Number(d.ias38?.totalCapitalizedSoftware ?? 0).toLocaleString('en-ET', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">ETB capitalized</p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AabeAuditReadinessPage() {
  const { selectedCompanyId } = useBusiness();
  const [period, setPeriod] = useState(currentPeriod);

  const { data, isLoading, error, refetch } = useAabeAuditReadiness(period);

  if (!selectedCompanyId) {
    return <EmptyState message="Select a company to view AABE audit readiness." />;
  }
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (error || !data) {
    return <EmptyState message="Could not load audit readiness data." action={{ label: 'Retry', onClick: () => refetch() }} />;
  }

  const d = data as any;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        title="AABE Audit Readiness"
      >
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Period</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5
                       bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none
                       focus:ring-2 focus:ring-[var(--pro-azure)]"
          />
          <Can permission="reports:read">
            <button
              onClick={() => refetch()}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800
                         text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Refresh
            </button>
          </Can>
        </div>
      </PageHeader>

      {/* Score + summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-xl border border-slate-200 dark:border-slate-700 p-6
                        flex flex-col items-center justify-center gap-4 relative">
          <ScoreRing score={d.score} grade={d.grade} />
          <div className="text-center space-y-1">
            <p className={`text-sm font-semibold ${
              d.riskLevel === 'LOW' ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
              : d.riskLevel === 'MEDIUM' ? 'text-amber-500 dark:text-amber-400'
              : 'text-red-500 dark:text-red-400'
            }`}>
              {d.riskLevel} RISK
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {d.passed} passed · {d.failed} failed
            </p>
          </div>
        </div>

        <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recommendation</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {d.recommendation}
          </p>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Generated {new Date(d.generatedAt).toLocaleString()} · Period {d.period}
            </p>
          </div>
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Compliance Criteria
        </h3>
        {(d.criteria ?? []).map((c: any, i: number) => (
          <CriterionRow key={i} criterion={c} />
        ))}
      </div>

      {/* Dual-ledger status */}
      <DualLedgerCard period={period} />

      {/* IFRS live balances */}
      <IfrsDashboardCard />

      {/* Disclosure note */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>AABE Note:</strong> This score is a system-generated indicative assessment.
          Full audit readiness requires review by a licensed auditor (CPA/ACCA/ICPAE) under
          Proclamation No. 847/2014 and AABE Professional Standards. Ensure all source documents
          are physically available and all disclosures reviewed before submission.
        </p>
      </div>
    </div>
  );
}
