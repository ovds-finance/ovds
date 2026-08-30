import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAabeAuditReadiness, useDualLedgerStatus } from '../features/accounting/hooks/useGlCompliance';

// ── AABE Score Widget (injected at top of existing dashboard) ─────────────────

function AabeScoreWidget({ companyId }: { companyId: string }) {
  const period = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const { data: readiness, isLoading } = useAabeAuditReadiness(period);
  const { data: dual } = useDualLedgerStatus(period);

  if (isLoading) {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }
  if (!readiness) return null;

  const r = readiness as any;
  const d = dual as any;
  const scoreColor = r.score >= 90 ? '#10b981' : r.score >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          AABE Audit Readiness — {period}
        </h3>
        <Link
          to="/accounting/aabe-audit"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Full report →
        </Link>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        {/* Score pill */}
        <div className="flex items-center gap-2">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color: scoreColor }}
          >
            {r.score}
          </span>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">/ 100</p>
            <p
              className="text-xs font-semibold"
              style={{ color: scoreColor }}
            >
              {r.riskLevel} RISK
            </p>
          </div>
        </div>

        {/* Criteria summary */}
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{r.passed}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">passed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-500 dark:text-red-400">{r.failed}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">failed</p>
          </div>
        </div>

        {/* Top failed criteria */}
        <div className="flex-1 min-w-0 space-y-1">
          {(r.criteria ?? [])
            .filter((c: any) => !c.passed)
            .slice(0, 3)
            .map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <span className="flex-none w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-[10px]">✗</span>
                <span className="truncate">{c.name}</span>
              </div>
            ))}
        </div>

        {/* Dual ledger status */}
        {d && (
          <div className="text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-4">
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Dual Ledger</p>
            <p>Tax Book: <span className="font-semibold">{d.managementTaxBook?.journalEntries ?? 0}</span> entries</p>
            <p>IFRS Book: <span className="font-semibold">{d.ifrsStatutoryBook?.ifrsTaggedEntries ?? 0}</span> entries</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CoABalance {
  code: string;
  name: string;
  balance: number;
  type: string;
}

interface ComplianceStatus {
  status: string;
  issues: Array<{ description: string; severity: string }>;
}

interface GLCDashboard {
  companyId: string;
  period: string;
  generatedAt: string;
  chartOfAccounts: {
    accounts: CoABalance[];
    totals: {
      assets: number;
      liabilities: number;
      equity: number;
      income: number;
      expenses: number;
    };
  };
  taxEngine: {
    vat: Record<string, unknown>;
    dashboard: Record<string, unknown>;
    compliance: ComplianceStatus;
  };
  statutoryReports: {
    balanceSheet: Record<string, unknown>;
    incomeStatement: Record<string, unknown>;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const GeneralLedgerCompliance: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GLCDashboard | null>(null);

  const companyId = selectedCompanyId || undefined;

  const fetchData = useCallback(async (cId?: string) => {
    if (!cId) return;
    setLoading(true);
    try {
      const q = cId ? `?companyId=${cId}` : '';
      const res = await api.get(`/general-ledger-compliance/dashboard${q}`, {
        headers: { 'x-background': '1' },
      });
      setData(res.data?.data ?? res.data ?? null);
    } catch {
      toast.error('Failed to load general ledger compliance dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (companyId) fetchData(companyId);
  }, [companyId, fetchData]);

  const coa = data?.chartOfAccounts;
  const totals = coa?.totals;
  const compliance = data?.taxEngine?.compliance;

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'MEDIUM':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW':
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <AppPage
      title="General Ledger & Compliance"
      subtitle="Control Tower"
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
          Please select a company to view the general ledger compliance dashboard.
        </div>
      ) : !data ? (
        <div className="text-center py-10 text-sm text-slate-400">
          {loading ? 'Loading...' : 'No data available.'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* AABE Audit Readiness Widget */}
          {companyId && <AabeScoreWidget companyId={companyId} />}

          {/* KPI Strip */}
          <div className="ovds-grid-layout cols-5 gap-sm">
            {[
              { label: 'Assets', value: totals?.assets ?? 0, color: 'text-emerald-600' },
              { label: 'Liabilities', value: totals?.liabilities ?? 0, color: 'text-rose-600' },
              { label: 'Equity', value: totals?.equity ?? 0, color: 'text-violet-600' },
              { label: 'Income', value: totals?.income ?? 0, color: 'text-blue-600' },
              { label: 'Expenses', value: totals?.expenses ?? 0, color: 'text-amber-600' },
            ].map((k, i) => (
              <div key={i} className="ovds-widget-card p-4">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                {loading ? (
                  <div className="h-7 w-24 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className={`text-xl font-bold tabular-nums ${k.color}`}>
                    ETB {fmt(k.value)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart of Accounts */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Chart of Accounts Balances</p>
              </div>
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Code</AppTh>
                    <AppTh>Account</AppTh>
                    <AppTh>Type</AppTh>
                    <AppTh align="right">Balance (ETB)</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {(coa?.accounts ?? []).slice(0, 20).map((a, i) => (
                    <AppTr key={a.code + i}>
                      <AppTd>
                        <span className="font-mono text-[11px] text-slate-500">{a.code}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{a.name}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600">
                          {a.type}
                        </span>
                      </AppTd>
                      <AppTd align="right">
                        <span className="tabular-nums text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                          {fmt(a.balance)}
                        </span>
                      </AppTd>
                    </AppTr>
                  ))}
                  {(coa?.accounts ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-slate-400">
                        No account balances found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </AppTable>
            </div>

            {/* Compliance Status */}
            <div className="space-y-6">
              <div className="ovds-widget-card overflow-hidden">
                <div className="ovds-widget-header">
                  <p className="ovds-card-title">Tax & Compliance Status</p>
                </div>
                <div className="p-4 space-y-3">
                  {compliance?.issues?.length > 0 ? (
                    compliance.issues.map((issue, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs ${getSeverityColor(issue.severity)}`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon
                            name={issue.severity === 'HIGH' || issue.severity === 'CRITICAL' ? 'ALERT_TRIANGLE' : 'INFO'}
                            size={13}
                            className="shrink-0 mt-0.5"
                          />
                          <span className="font-medium">{issue.description}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-slate-400">
                      No compliance issues detected.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="ovds-widget-card p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Statutory Reports</p>
                <div className="space-y-2">
                  {[
                    { label: 'Balance Sheet', to: '/reports/balance-sheet', perm: 'reports:financial:read' },
                    { label: 'Profit & Loss', to: '/reports/profit-loss', perm: 'reports:financial:read' },
                    { label: 'Cash Flow', to: '/reports/cash-flow', perm: 'reports:financial:read' },
                    { label: 'Trial Balance', to: '/reports/trial-balance', perm: 'reports:gl:read' },
                    { label: 'IFRS Dashboard', to: '/ifrs', perm: 'ifrs:read' },
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{link.label}</span>
                      <Icon name="ARROW_RIGHT" size={12} className="text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default GeneralLedgerCompliance;
