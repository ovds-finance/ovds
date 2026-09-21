import { AppPage, Skeleton } from '@ovds/ui';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Banknote,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  ClipboardList,
  ExternalLink,
  FileCheck,
  Globe,
  History,
  Percent,
  Receipt,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';

import EthiopianComplianceGuide from '../components/ethiopianComplianceGuide';
import IASBUpdateBanner from '../components/iasbUpdateBanner';
import PITCalculator from '../components/pitCalculator';
import RBACMatrix from '../components/rbacMatrix';
import RoleBadge from '../components/roleBadge';
import { useInterval } from '../hooks';
import { usePageTitle } from '../hooks/usePageTitle';
import { useRbac } from '../rbac';
import api from '../services/api';

// -- Types ---------------------------------------------------------------------
interface ComplianceItem {
  id: string;
  label: string;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'PENDING';
  detail: string;
  module: string;
  link?: string;
  ifrsRef?: string;
  remediation?: string;
}
interface AuditSummary {
  totalEngagements: number;
  active: number;
  completed: number;
  openFindings: number;
  criticalFindings: number;
  overdue: number;
}
// -- Helpers -------------------------------------------------------------------
const STATUS_COLOR: Record<string, string> = {
  OK: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)] dark:border-green-800',
  WARNING:
    'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  CRITICAL:
    'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',
  PENDING:
    'text-slate-500 bg-white border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  OK: <CheckCircle2 size={14} />,
  WARNING: <AlertTriangle size={14} />,
  CRITICAL: <AlertTriangle size={14} />,
  PENDING: <Clock size={14} />,
};
// -- Static compliance checklist -----------------------------------------------
const ERCA_CHECKLIST: ComplianceItem[] = [
  {
    id: 'einvoice',
    label: 'e-Invoice QR Code on every invoice',
    status: 'PENDING',
    detail: 'Verify ERCA QR code integration is active',
    module: 'VAT',
    link: '/tax/vat',
    ifrsRef: 'IFRS 15.119',
    remediation:
      'Go to Invoices → ensure each invoice has a MoR tracking ID and NBE-IQR QR code. Check Settings → Tax Config to enable e-invoice generation.',
  },
  {
    id: 'etax',
    label: 'eTax portal account active',
    status: 'PENDING',
    detail: 'etax.erca.gov.et account must be linked',
    module: 'VAT',
    link: 'https://etax.erca.gov.et',
    ifrsRef: 'IAS 12.46',
    remediation:
      'Register at etax.erca.gov.et with your company TIN. Link your OVDS account via Settings → Tax Config → eTax Integration.',
  },
  {
    id: 'monthly',
    label: 'Monthly VAT return filing enabled',
    status: 'PENDING',
    detail: 'File by 30th of following month',
    module: 'VAT',
    link: '/tax/vat',
    ifrsRef: 'IAS 12.46',
    remediation:
      'Navigate to VAT Administration → File VAT Return. Ensure Output VAT and Input VAT ledgers are reconciled before filing. Late penalty: ETB 500/day.',
  },
  {
    id: 'reverse',
    label: 'Reverse-charge for digital services configured',
    status: 'PENDING',
    detail:
      'Required for foreign providers with ≥ ETB 500,000 Ethiopian revenue',
    module: 'VAT',
    link: '/tax/vat',
    ifrsRef: 'IFRS 9.5.5',
    remediation:
      'Go to VAT Administration → Reverse Charge Register. Add all foreign digital service providers. Compute 15% VAT on each transaction.',
  },
  {
    id: 'annual',
    label: 'Annual VAT reconciliation scheduled',
    status: 'PENDING',
    detail: 'Due 31 March each year',
    module: 'VAT',
    link: '/tax/vat',
    ifrsRef: 'IAS 12.81',
    remediation:
      'Run VAT Administration → Annual Reconciliation. Compare total output VAT vs. input VAT for the full year. Export to eTax portal.',
  },
  {
    id: 'pit',
    label: 'PIT brackets applied in payroll',
    status: 'PENDING',
    detail: 'Ethiopian Personal Income Tax brackets',
    module: 'Payroll',
    link: '/hr/payroll',
    ifrsRef: 'IAS 19.11',
    remediation:
      'Go to Payroll Administration → Settings. Verify PIT brackets are set to 2026 rates (0%–35%). Run a test payroll calculation to confirm.',
  },
  {
    id: 'pension',
    label: 'Pension contributions configured (7%/11%)',
    status: 'PENDING',
    detail: 'Employee 7%, Employer 11%',
    module: 'Payroll',
    link: '/hr/payroll',
    ifrsRef: 'IAS 19.44',
    remediation:
      'Go to Payroll Administration → Employee Config. Set employee pension rate to 7% and employer pension rate to 11% for all active employees.',
  },
  {
    id: 'disaster',
    label: 'Disaster Fund levies tracked',
    status: 'PENDING',
    detail: 'Regulation No. 570/2025 compliance',
    module: 'Disaster Fund',
    link: '/disaster-fund',
    ifrsRef: 'IAS 37.14',
    remediation:
      'Go to Disaster Fund → Auto-Generate. Select applicable levy categories (salary 1%, sales revenue 5%, etc.) and generate contributions for the current period.',
  },
  {
    id: 'bit',
    label: 'Business Income Tax declaration ready',
    status: 'PENDING',
    detail: '30% flat rate, file within 4 months of FY end',
    module: 'Tax',
    link: '/tax/business-income',
    ifrsRef: 'IAS 12.46',
    remediation:
      'Go to Business Income Tax → Annual Declaration. Verify net profit from P&L report. Calculate 30% BIT. File via eTax portal by November 7.',
  },
  {
    id: 'audit',
    label: 'Audit trail immutable and complete',
    status: 'PENDING',
    detail: 'All write operations logged',
    module: 'Audit',
    link: '/settings/audit-logs',
    ifrsRef: 'IAS 1.112',
    remediation:
      'Go to Audit Logs → verify all recent transactions are logged. Check for any gaps. Ensure no manual database edits have been made outside the system.',
  },
  {
    id: 'tot',
    label: 'Turnover Tax (TOT) filing — Category B taxpayers',
    status: 'PENDING',
    detail: 'TOT 2% on goods, 10% on services — monthly by 30th',
    module: 'Tax',
    link: '/tax/filing',
    ifrsRef: 'IAS 12.46',
    remediation:
      'If annual revenue < ETB 2M, TOT applies instead of VAT. Go to Tax Filing → Record Filing → select TOT Goods or TOT Services. File monthly on etax.erca.gov.et → Tax Declaration → Turnover Tax. Proclamation No. 1395/2025.',
  },
  {
    id: 'zero_declaration',
    label: 'Zero declaration filed for months with no transactions',
    status: 'PENDING',
    detail: 'Zero return required even with no sales — ETB 500/day penalty',
    module: 'VAT',
    link: '/tax/filing',
    ifrsRef: 'IAS 12.46',
    remediation:
      'Even with no transactions, file a zero return for VAT and/or TOT by the 30th of the following month. Go to Tax Filing → the system auto-creates a ZERO_DECLARATION record. Submit on etax.erca.gov.et → Tax Declaration → enter 0 → Submit. Proclamation No. 1341/2024.',
  },
  {
    id: 'wht',
    label: 'Withholding Tax (WHT) remitted monthly',
    status: 'PENDING',
    detail: '3% on services ≥ ETB 10K and goods ≥ ETB 20K',
    module: 'VAT',
    link: '/tax/vat',
    ifrsRef: 'IAS 12.46',
    remediation:
      'Go to VAT Administration → Withholding tab. Verify all qualifying vendor payments have WHT calculated. Mark as remitted after paying via commercial bank. File WHT return on etax.erca.gov.et by the 30th. Proclamation No. 1395/2025.',
  },
  {
    id: 'bit_provisional',
    label: 'BIT quarterly provisional tax installments on schedule',
    status: 'PENDING',
    detail: 'Q1: Sep 7 · Q2: Dec 7 · Q3: Mar 7 · Q4: Jun 7',
    module: 'Tax',
    link: '/tax/business-income',
    ifrsRef: 'IAS 12.46',
    remediation:
      'Pay 25% of estimated annual BIT each quarter to avoid 2%/month compounded late-payment interest. Go to Business Income Tax → Provisional Tax Schedule. File each installment via eTax portal. Proclamation No. 1395/2025.',
  },
  {
    id: 'vat_threshold',
    label: 'VAT registration threshold monitored (ETB 2M)',
    status: 'PENDING',
    detail: 'Register for VAT when annual revenue reaches ETB 2M',
    module: 'VAT',
    link: '/tax/dashboard',
    ifrsRef: 'IAS 12.46',
    remediation:
      'Go to Tax Dashboard → TOT Quick Reference to see your current threshold %. When annual revenue reaches ETB 2M, mandatory VAT registration is required. Register at etax.erca.gov.et and update Settings → Tax Config. Regulation No. 570/2025.',
  },
];
const QUICK_LINKS = [
  {
    label: 'eTax Portal (ERCA)',
    href: 'https://etax.erca.gov.et',
    icon: <Globe size={14} />,
  },
  {
    label: 'Non-Resident Registration',
    href: 'https://erca.gov.et',
    icon: <Globe size={14} />,
  },
  {
    label: 'Proclamation No. 1341/2024',
    href: 'https://erca.gov.et',
    icon: <BookOpen size={14} />,
  },
  {
    label: 'VAT Refund Application',
    href: 'https://etax.erca.gov.et',
    icon: <Receipt size={14} />,
  },
];
// -- Main Component ------------------------------------------------------------
const ComplianceAuditor: React.FC = () => {
  usePageTitle('Compliance Auditor');
  const { can, accessLevel, role } = useRbac();
  const [loading, setLoading] = useState(true);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<ComplianceItem[]>(ERCA_CHECKLIST);
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [auditRes, logsRes, complianceRes, taxRes] =
        await Promise.allSettled([
          api.get('/audit-outsourcing/stats').catch(() => null),
          api.get('/dashboard/audit-logs?page=1&take=5').catch(() => null),
          api.get('/tax/compliance-status').catch(() => null),
          api.get('/tax/dashboard').catch(() => null),
        ]);
      if (auditRes.status === 'fulfilled' && auditRes.value) {
        setAuditSummary(
          auditRes.value.data?.data ?? auditRes.value.data ?? null,
        );
      }
      if (logsRes.status === 'fulfilled' && logsRes.value) {
        setRecentLogs(logsRes.value.data?.data?.data ?? []);
      }
      if (complianceRes.status === 'fulfilled' && complianceRes.value) {
        const d = complianceRes.value.data?.data ?? complianceRes.value.data;
        if (Array.isArray(d) && d.length > 0) {
          setChecklist((prev) =>
            prev.map((item) => {
              const live = d.find((li: any) => li.id === item.id);
              return live
                ? {
                    ...item,
                    status: live.status,
                    detail: live.detail ?? item.detail,
                  }
                : item;
            }),
          );
        } else if (d?.items?.length) {
          setChecklist((prev) =>
            prev.map((item) => {
              const live = d.items.find((li: any) => li.id === item.id);
              return live
                ? {
                    ...item,
                    status: live.status,
                    detail: live.detail ?? item.detail,
                  }
                : item;
            }),
          );
        }
      } // Use tax dashboard for VAT/DRRF data
      if (taxRes.status === 'fulfilled' && taxRes.value) {
        const td = taxRes.value.data?.data ?? taxRes.value.data;
        if (td?.complianceScore) {
          // Update checklist items based on real compliance score
          setChecklist((prev) =>
            prev.map((item) => {
              if (item.id === 'monthly' && td.vatCurrent > 0) {
                return {
                  ...item,
                  status: 'WARNING' as const,
                  detail: `VAT due: ETB ${Number(td.vatCurrent).toLocaleString()}`,
                };
              }
              if (item.id === 'disaster' && td.drrfCurrent > 0) {
                return {
                  ...item,
                  status: 'WARNING' as const,
                  detail: `DRRF pending: ETB ${Number(td.drrfCurrent).toLocaleString()}`,
                };
              }
              if (item.id === 'tot') {
                return {
                  ...item,
                  status: td.totApplicable ? 'WARNING' as const : 'OK' as const,
                  detail: td.totApplicable
                    ? `TOT applies — revenue ETB ${Number(td.annualRevenue ?? 0).toLocaleString()} is below ETB 2M threshold. File monthly by 30th.`
                    : 'Revenue ≥ ETB 2M — VAT registered, TOT not applicable',
                };
              }
              if (item.id === 'vat_threshold') {
                const pct = Math.round(((td.annualRevenue ?? 0) / 2_000_000) * 100);
                return {
                  ...item,
                  status: pct >= 100 ? 'CRITICAL' as const : pct >= 80 ? 'WARNING' as const : 'OK' as const,
                  detail: `Annual revenue ${pct}% of ETB 2M threshold${pct >= 100 ? ' — VAT registration REQUIRED' : pct >= 80 ? ' — prepare for VAT registration' : ' — monitoring'}`,
                };
              }
              if (item.id === 'wht') {
                return {
                  ...item,
                  status: (td.overdueVat ?? 0) > 0 ? 'WARNING' as const : 'PENDING' as const,
                  detail: '3% WHT on services ≥ ETB 10K and goods ≥ ETB 20K — remit monthly',
                };
              }
              return item;
            }),
          );
        }
      }
    } catch (_e) {
      // silent — partial data is fine
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useInterval(fetchData, autoRefresh ? 30_000 : null);
  const filteredChecklist = search
    ? checklist.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.module.toLowerCase().includes(search.toLowerCase()),
      )
    : checklist;
  const okCount = checklist.filter((c) => c.status === 'OK').length;
  const criticalCount = checklist.filter((c) => c.status === 'CRITICAL').length;
  const warningCount = checklist.filter((c) => c.status === 'WARNING').length;
  const complianceScore = Math.round((okCount / checklist.length) * 100);
  const toggleStatus = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'OK' ? 'PENDING' : 'OK' }
          : c,
      ),
    );
  };
  return (
    <AppPage
      title="Compliance Auditor"
      subtitle="Ethiopian tax & IFRS compliance — VAT, DRRF, WHT, PAYE verification"
      icon={<ShieldCheck size={16} />}
      iconBg="bg-[var(--pro-azure-50)]0"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search compliance items..."
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-400/20 w-52"
            />
          </div>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${autoRefresh ? 'bg-[var(--pro-azure)] text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <RefreshCw size={13} className={autoRefresh ? 'animate-spin' : ''} />
            {autoRefresh ? 'Live' : 'Auto-refresh'}
          </button>
        </div>
      }
    >
      {/* IASB Standards Update — compact strip for compliance context, gated on vat:read */}{' '}
      {can('vat:read') && <IASBUpdateBanner compact />}{' '}
      {/* Score banner — ovds-style */}
      <div className="ovds-widget-card overflow-hidden shadow-sm">
        {/* Compliance split bar */}
        <div className="flex h-1.5">
          <div
            className={`transition-all duration-700 ${complianceScore >= 80 ? 'bg-[var(--pro-azure-50)]0' : complianceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${complianceScore}%` }}
          />
          <div className="bg-slate-200 dark:bg-slate-700 flex-1" />
        </div>
        <div className="ovds-grid-layout cols-4 gap-sm">
          {[
            {
              label: 'Compliance Score',
              value: `${complianceScore}%`,
              color:
                complianceScore >= 80
                  ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]'
                  : complianceScore >= 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400',
              sub: `${okCount}/${checklist.length} verified`,
            },
            {
              label: 'Critical Issues',
              value: criticalCount,
              color:
                criticalCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
              sub: 'Immediate action',
            },
            {
              label: 'Open Findings',
              value: loading ? '—' : (auditSummary?.openFindings ?? 0),
              color:
                (auditSummary?.openFindings ?? 0) > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400',
              sub: `${auditSummary?.criticalFindings ?? 0} critical`,
            },
            {
              label: 'Active Engagements',
              value: loading ? '—' : (auditSummary?.active ?? 0),
              color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
              sub: `${auditSummary?.totalEngagements ?? 0} total`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-800 rounded-xl p-4"
            >
              <div className={`flex items-center gap-1.5 ${s.color} mb-1.5`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {s.label}
                </span>
              </div>
              <p className={`text-xl font-bold tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>{' '}
      <div className="ovds-grid-layout cols-3">
        {' '}
        {/* ERCA Compliance Checklist */}{' '}
        <div className="lg:col-span-2 ovds-widget-card shadow-sm overflow-hidden">
          {' '}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {' '}
            <div>
              {' '}
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[var(--pro-azure)]" /> ERCA
                Compliance Checklist{' '}
              </h3>{' '}
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                {' '}
                Proclamation No. 1341/2024 — VAT Reform 2025{' '}
              </p>{' '}
            </div>{' '}
            {/* Score ring */}{' '}
            <div className="flex items-center gap-2">
              {' '}
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${complianceScore >= 80 ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-[var(--pro-azure-light)] dark:border-green-800' : complianceScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800'}`}
              >
                {' '}
                {complianceScore}% compliant{' '}
              </div>{' '}
            </div>{' '}
          </div>{' '}
          {/* Progress bar */}{' '}
          <div className="px-6 py-3 border-b border-slate-50 dark:border-slate-800/50">
            {' '}
            <div className="flex items-center gap-3">
              {' '}
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                {' '}
                <div
                  className={`h-full rounded-full transition-all duration-700 ${complianceScore >= 80 ? 'bg-[var(--pro-azure-50)]0' : complianceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${complianceScore}%` }}
                />{' '}
              </div>{' '}
              <div className="flex gap-3 text-[10px] font-bold shrink-0">
                {' '}
                <span className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                  {okCount} OK
                </span>{' '}
                {warningCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {warningCount} Warn
                  </span>
                )}{' '}
                {criticalCount > 0 && (
                  <span className="text-rose-600 dark:text-rose-400">
                    {criticalCount} Critical
                  </span>
                )}{' '}
              </div>{' '}
            </div>{' '}
          </div>{' '}
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {' '}
            {filteredChecklist.map((item) => (
              <div key={item.id} className="transition-colors">
                {' '}
                <div
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  onClick={() =>
                    setExpandedItem(expandedItem === item.id ? null : item.id)
                  }
                >
                  {' '}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(item.id);
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wider transition-all ${STATUS_COLOR[item.status]}`}
                    title="Click to toggle status"
                  >
                    {' '}
                    {STATUS_ICON[item.status]} {item.status}{' '}
                  </button>{' '}
                  <div className="flex-1 min-w-0">
                    {' '}
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.label}
                    </p>{' '}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {item.detail}
                    </p>{' '}
                  </div>{' '}
                  <div className="flex items-center gap-2 shrink-0">
                    {' '}
                    {item.ifrsRef && (
                      <span className="text-[8px] font-semibold text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/30 px-1.5 py-0.5 rounded-full hidden sm:inline">
                        {' '}
                        {item.ifrsRef}{' '}
                      </span>
                    )}{' '}
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      {' '}
                      {item.module}{' '}
                    </span>{' '}
                    {item.link &&
                      (item.link.startsWith('http') ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ExternalLink size={13} />{' '}
                        </a>
                      ) : (
                        <NavLink
                          to={item.link}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={13} />{' '}
                        </NavLink>
                      ))}{' '}
                  </div>{' '}
                </div>{' '}
                {/* Remediation guidance — expands on click */}{' '}
                {expandedItem === item.id && item.remediation && (
                  <div className="px-6 pb-4 animate-in slide-in-from-top-1 duration-150">
                    {' '}
                    <div className="flex items-start gap-2.5 px-4 py-3 bg-[var(--pro-azure-50)] dark:bg-green-950/20 border border-[var(--pro-azure-100)] dark:border-green-900/40 rounded-xl">
                      <Zap
                        size={13}
                        className="text-[var(--pro-azure)] shrink-0 mt-0.5"
                      />{' '}
                      <div className="flex-1 min-w-0">
                        {' '}
                        <p className="text-[10px] font-semibold text-[var(--pro-azure-dark)] dark:text-green-300 uppercase tracking-wider mb-1">
                          {' '}
                          Remediation Steps{' '}
                          {item.ifrsRef && (
                            <span className="normal-case font-bold">
                              · {item.ifrsRef}
                            </span>
                          )}{' '}
                        </p>{' '}
                        <p className="text-xs text-[var(--pro-azure-dark)] dark:text-green-300 leading-relaxed">
                          {item.remediation}
                        </p>{' '}
                      </div>{' '}
                      {item.link && !item.link.startsWith('http') && (
                        <NavLink
                          to={item.link}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[var(--pro-azure)] text-white rounded-lg text-[10px] font-semibold hover:bg-[var(--pro-azure-dark)] transition-colors"
                        >
                          {' '}
                          Fix Now <ChevronRight size={10} />{' '}
                        </NavLink>
                      )}{' '}
                    </div>{' '}
                  </div>
                )}{' '}
              </div>
            ))}{' '}
          </div>{' '}
        </div>{' '}
        {/* Right column */}{' '}
        <div className="space-y-4">
          {' '}
          {/* Role info */}{' '}
          <div className="ovds-widget-card shadow-sm p-5">
            {' '}
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Users size={16} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />{' '}
              Your Access Level{' '}
            </h4>{' '}
            <div className="mb-3">
              <RoleBadge role={role} size="md" showTooltip />{' '}
            </div>{' '}
            <div className="space-y-2">
              {' '}
              {[
                {
                  label: 'Audit Logs',
                  value: accessLevel('audit_logs'),
                  icon: <History size={12} />,
                },
                {
                  label: 'VAT Filing',
                  value: accessLevel('vat'),
                  icon: <FileCheck size={12} />,
                },
                {
                  label: 'Payroll',
                  value: accessLevel('payroll'),
                  icon: <Banknote size={12} />,
                },
                {
                  label: 'ovds',
                  value: accessLevel('ovds'),
                  icon: <Receipt size={12} />,
                },
                {
                  label: 'Disaster Fund',
                  value: accessLevel('disaster_fund'),
                  icon: <Shield size={12} />,
                },
                {
                  label: 'Reports',
                  value: accessLevel('reports'),
                  icon: <BarChart3 size={12} />,
                },
              ].map(({ label, value, icon }) => {
                const levelColor = {
                  admin: 'text-rose-600 dark:text-rose-400',
                  write: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                  read: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                  none: 'text-slate-300 dark:text-slate-600',
                }[value];
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    {' '}
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {' '}
                      {icon} {label}{' '}
                    </span>{' '}
                    <span
                      className={`text-xs font-semibold capitalize ${levelColor}`}
                    >
                      {value}
                    </span>{' '}
                  </div>
                );
              })}{' '}
            </div>{' '}
          </div>{' '}
          {/* IFRS 18 Readiness Card */}{' '}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm p-5">
            {' '}
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Bell size={16} className="text-purple-500" /> IFRS 18 Readiness{' '}
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ml-auto">
                2027
              </span>{' '}
            </h4>{' '}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">
              {' '}
              IFRS 18 replaces IAS 1 on 1 Jan 2027. Prepare your income
              statement structure now.{' '}
            </p>{' '}
            <div className="space-y-2">
              {' '}
              {[
                {
                  label: 'Map P&L to Operating/Investing/Financing',
                  done: false,
                },
                {
                  label: 'Identify Management Performance Measures',
                  done: false,
                },
                { label: 'Prepare MPM reconciliation note', done: false },
                { label: 'Plan comparative period restatement', done: false },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {' '}
                  {done ? (
                    <CheckCircle2
                      size={12}
                      className="text-[var(--pro-azure)] shrink-0"
                    />
                  ) : (
                    <Clock
                      size={12}
                      className="text-slate-300 dark:text-slate-600 shrink-0"
                    />
                  )}{' '}
                  <span
                    className={
                      done
                        ? 'text-slate-400 line-through'
                        : 'text-slate-600 dark:text-slate-300'
                    }
                  >
                    {label}
                  </span>{' '}
                </div>
              ))}{' '}
            </div>
            <NavLink
              to="/accounting?tab=reports&report=iasb-updates"
              className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              {' '}
              View full IASB updates <ChevronRight size={10} />{' '}
            </NavLink>{' '}
          </div>{' '}
          {/* ERCA Quick Links */}{' '}
          <div className="ovds-widget-card shadow-sm p-5">
            {' '}
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Globe size={16} className="text-orange-500" /> ERCA Quick
              Links{' '}
            </h4>{' '}
            <div className="space-y-1.5">
              {' '}
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors group"
                >
                  {' '}
                  <span className="text-slate-400 group-hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors">
                    {link.icon}
                  </span>{' '}
                  <span className="flex-1 text-xs font-bold">{link.label}</span>
                  <ExternalLink
                    size={11}
                    className="text-slate-300 group-hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] transition-colors"
                  />{' '}
                </a>
              ))}{' '}
            </div>{' '}
          </div>{' '}
          {/* VAT Rates Reference */}{' '}
          <div className="ovds-widget-card shadow-sm p-5">
            {' '}
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Percent size={16} className="text-violet-500" /> VAT Rates
              Reference{' '}
            </h4>{' '}
            <div className="space-y-2 text-xs">
              {' '}
              {[
                {
                  label: 'Standard Rate',
                  value: '15%',
                  color: 'text-slate-700 dark:text-slate-200',
                },
                {
                  label: 'Zero-Rated (Exports)',
                  value: '0%',
                  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                },
                {
                  label: 'Exempt (Healthcare, Education)',
                  value: 'Exempt',
                  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                },
                {
                  label: 'Registration Threshold',
                  value: 'ETB 2M/yr — Reg. 570/2025',
                  color: 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]',
                },
                {
                  label: 'Monthly Filing Deadline',
                  value: '30th of next month',
                  color: 'text-slate-600 dark:text-slate-300',
                },
                {
                  label: 'Late Filing Penalty',
                  value: 'ETB 500/day',
                  color: 'text-rose-600 dark:text-rose-400',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  {' '}
                  <span className="text-slate-500 dark:text-slate-400">
                    {label}
                  </span>{' '}
                  <span className={`font-semibold ${color}`}>{value}</span>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </div>{' '}
          {/* DRRF Reference */}{' '}
          <div className="ovds-widget-card shadow-sm p-5">
            {' '}
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Shield size={16} className="text-rose-500" /> DRRF Levy
              Reference{' '}
            </h4>{' '}
            <div className="space-y-1.5 text-xs">
              {' '}
              {[
                { label: 'Annual Sales Revenue', value: '5%' },
                { label: 'Service Fees (Telecom/Bank)', value: '5%' },
                { label: 'Airtime Sales', value: '5%' },
                { label: 'Loan Value', value: '1%' },
                { label: 'Salary Contribution', value: '1%' },
                { label: 'Ticket Sales (Domestic)', value: 'ETB 100' },
                { label: 'Fuel Sales', value: 'ETB 200' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  {' '}
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                    {label}
                  </span>{' '}
                  <span className="font-semibold text-orange-600 dark:text-orange-400 text-[10px]">
                    {value}
                  </span>{' '}
                </div>
              ))}{' '}
            </div>
            <NavLink
              to="/disaster-fund"
              className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
            >
              {' '}
              Disaster Fund Module <ChevronRight size={10} />{' '}
            </NavLink>{' '}
          </div>{' '}
          {/* PIT Calculator */} <PITCalculator compact />{' '}
          {/* Compliance Guide */}{' '}
          <EthiopianComplianceGuide defaultOpen="deadlines" />{' '}
        </div>{' '}
      </div>{' '}
      {/* Recent Audit Activity */}{' '}
      <div className="ovds-widget-card shadow-sm overflow-hidden">
        {' '}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {' '}
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History size={18} className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />{' '}
            Recent Audit Activity{' '}
          </h3>
          <NavLink
            to="/settings/audit-logs"
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
          >
            {' '}
            View All <ChevronRight size={13} />{' '}
          </NavLink>{' '}
        </div>{' '}
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {' '}
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton.Line key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="px-6 py-8 text-center text-slate-400 text-sm italic">
              No recent activity
            </p>
          ) : (
            recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                {' '}
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Activity size={14} className="text-slate-400" />{' '}
                </div>{' '}
                <div className="flex-1 min-w-0">
                  {' '}
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {log.action}
                  </p>{' '}
                  <p className="text-[11px] text-slate-400 truncate">
                    {typeof log.details === 'string'
                      ? log.details
                      : log.details
                        ? JSON.stringify(log.details)
                        : 'No details'}
                  </p>{' '}
                </div>{' '}
                <div className="text-right shrink-0">
                  {' '}
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {' '}
                    {log.user?.username ?? 'SYSTEM'}{' '}
                  </p>{' '}
                  <p className="ovds-caption">
                    {' '}
                    {new Date(log.createdAt).toLocaleDateString()}{' '}
                  </p>{' '}
                </div>{' '}
              </div>
            ))
          )}{' '}
        </div>{' '}
      </div>{' '}
      {/* Module Quick Access */}{' '}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {' '}
        {[
          {
            label: 'VAT Admin',
            to: '/tax/vat',
            icon: <ShieldCheck size={20} />,
            color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20',
          },
          {
            label: 'Audit Logs',
            to: '/settings/audit-logs',
            icon: <History size={20} />,
            color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20',
          },
          {
            label: 'Audit Outsourcing',
            to: '/compliance/audit-outsourcing',
            icon: <ClipboardList size={20} />,
            color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/20',
          },
          {
            label: 'Disaster Fund',
            to: '/disaster-fund',
            icon: <Shield size={20} />,
            color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
          },
          {
            label: 'Income Tax',
            to: '/tax/business-income',
            icon: <Banknote size={20} />,
            color: 'text-[var(--pro-azure)] bg-[var(--pro-azure-50)] dark:bg-green-950/20',
          },
          {
            label: 'Reports',
            to: '/reports',
            icon: <BarChart3 size={20} />,
            color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20',
          },
        ].map(({ label, to, icon, color }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-4 ovds-widget-card shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
          >
            {' '}
            <div
              className={`p-2.5 rounded-xl ${color} transition-transform group-hover:scale-110`}
            >
              {' '}
              {icon}{' '}
            </div>{' '}
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">
              {label}
            </span>{' '}
          </NavLink>
        ))}{' '}
      </div>{' '}
      {/* RBAC Permission Matrix */} <RBACMatrix compact />{' '}
    </AppPage>
  );
};
// -- Sustainability & Climate Sections -----------------------------------------
export const SustainabilitySection: React.FC<{ pillar?: string }> = ({
  pillar,
}) => {
  const [activePillar, setActivePillar] = useState<string>(
    pillar ?? 'governance',
  );
  const pillars = [
    { key: 'governance', label: 'Governance', icon: '🏛️', color: 'violet' },
    { key: 'strategy', label: 'Strategy', icon: '🎯', color: 'blue' },
    { key: 'risk', label: 'Risk Mgmt', icon: '🛡️', color: 'amber' },
    { key: 'metrics', label: 'Metrics', icon: '📊', color: 'green' },
  ];
  const pillarContent: Record<
    string,
    { title: string; ref: string; items: { label: string; desc: string }[] }
  > = {
    governance: {
      title: 'Governance — Board Oversight of Sustainability',
      ref: 'IFRS S1.6–S1.9',
      items: [
        {
          label: 'Board-level sustainability committee',
          desc: 'Establish a dedicated committee or assign sustainability oversight to the audit committee.',
        },
        {
          label: 'Management roles & responsibilities',
          desc: 'Define who is accountable for sustainability reporting — link to OVDS RBAC (ovds, ADMIN, AUDITOR roles).',
        },
        {
          label: 'Incentive structures',
          desc: 'Disclose whether executive compensation is linked to sustainability targets.',
        },
        {
          label: 'Reporting to board',
          desc: 'Document how and how often sustainability information is reported to the board.',
        },
      ],
    },
    strategy: {
      title: 'Strategy — Sustainability Risks & Opportunities',
      ref: 'IFRS S1.10–S1.24',
      items: [
        {
          label: 'Short, medium, long-term horizons',
          desc: 'Identify sustainability risks over 1-year, 5-year, and 10+ year timeframes relevant to Ethiopian operations.',
        },
        {
          label: 'Business model impacts',
          desc: 'How climate change, social trends, and governance requirements affect your value chain.',
        },
        {
          label: 'Financial effects',
          desc: 'Quantify the financial impact of sustainability risks on revenue, costs, assets, and liabilities.',
        },
        {
          label: 'Resilience assessment',
          desc: 'Scenario analysis showing how the business performs under different sustainability scenarios.',
        },
      ],
    },
    risk: {
      title: 'Risk Management — Identifying & Managing Sustainability Risks',
      ref: 'IFRS S1.25–S1.32',
      items: [
        {
          label: 'Risk identification process',
          desc: 'How sustainability risks are identified — integrate with OVDS Audit Outsourcing module for systematic review.',
        },
        {
          label: 'Risk assessment criteria',
          desc: 'Likelihood and magnitude of impact. Use OVDS Audit Findings severity levels (LOW/MEDIUM/HIGH/CRITICAL).',
        },
        {
          label: 'Risk prioritization',
          desc: 'Which sustainability risks are material and require disclosure vs. monitoring only.',
        },
        {
          label: 'Integration with enterprise risk',
          desc: 'How sustainability risk management integrates with overall ERM framework.',
        },
      ],
    },
    metrics: {
      title: 'Metrics & Targets — Quantitative Sustainability Data',
      ref: 'IFRS S1.33–S1.37',
      items: [
        {
          label: 'Cross-industry metrics',
          desc: 'GHG emissions (Scope 1, 2, 3), energy consumption, water usage, waste generation.',
        },
        {
          label: 'Industry-specific metrics',
          desc: 'Sector-specific KPIs relevant to Ethiopian manufacturing, agriculture, or services.',
        },
        {
          label: 'Targets & progress',
          desc: 'Set measurable targets with baselines and track progress annually.',
        },
        {
          label: 'Methodology disclosure',
          desc: 'Explain measurement methods, assumptions, and any estimation uncertainty.',
        },
      ],
    },
  };
  const colorMap: Record<
    string,
    { bg: string; text: string; border: string; badge: string }
  > = {
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-200 dark:border-violet-800',
      badge:
        'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    },
    blue: {
      bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/20',
      text: 'text-[var(--pro-azure-dark)] dark:text-green-300',
      border: 'border-[var(--pro-azure-100)] dark:border-green-800',
      badge: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      badge:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
    indigo: {
      bg: 'bg-[var(--pro-azure-50)] dark:bg-green-950/20',
      text: 'text-[var(--pro-azure-dark)] dark:text-green-300',
      border: 'border-[var(--pro-azure-100)] dark:border-green-800',
      badge:
        'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/40 dark:text-green-300',
    },
  };
  const active = pillars.find((p) => p.key === activePillar)!;
  const c = colorMap[active.color];
  const section = pillarContent[activePillar];
  return (
    <div
      id="sustainability-section"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
    >
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--pro-azure-50)] dark:bg-green-950/30 flex items-center justify-center">
            <span className="text-lg">🌱</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              IFRS S1 — Sustainability Architecture
            </h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Four Pillars Framework · AABE Endorsed
            </p>
          </div>
        </div>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-green-300 border border-[var(--pro-azure-100)] dark:border-green-800">
          IFRS S1 · 2024
        </span>
      </div>

      <div className="px-6 pt-5 pb-3">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          IFRS S1 requires entities to disclose material sustainability-related
          financial information using the
          <strong> four-pillar framework</strong>: Governance, Strategy, Risk
          Management, and Metrics &amp; Targets. Ethiopian Tier 1 entities must
          comply from July 2024 per AABE guidance.
        </p>
      </div>

      {/* Pillar tabs */}
      <div className="px-6 pb-3 flex gap-2 flex-wrap">
        {pillars.map((p) => {
          const pc = colorMap[p.color];
          const isActive = activePillar === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setActivePillar(p.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
                isActive
                  ? `${pc.bg} ${pc.text} ${pc.border}`
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{p.icon}</span>
              {p.label}
            </button>
          );
        })}
      </div>

      <div
        className={`mx-6 mb-6 rounded-xl border ${c.border} ${c.bg} overflow-hidden`}
      >
        <div
          className={`px-5 py-3 border-b ${c.border} flex items-center justify-between`}
        >
          <h3 className={`font-semibold text-sm ${c.text}`}>{section.title}</h3>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.badge}`}
          >
            {section.ref}
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {section.items.map((item, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${c.badge}`}
              >
                <span className="text-[10px] font-semibold">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export const ClimateSection: React.FC<{ tab?: string }> = ({ tab }) => {
  const [activeTab, setActiveTab] = useState<string>(tab ?? 'risks');
  const tabs = [
    { key: 'risks', label: 'Climate Risks', icon: '⚠️' },
    { key: 'emissions', label: 'GHG Emissions', icon: '💨' },
    { key: 'transition', label: 'Transition Plan', icon: '🔄' },
  ];
  const content: Record<
    string,
    {
      title: string;
      ref: string;
      items: { label: string; desc: string; example?: string }[];
    }
  > = {
    risks: {
      title: 'Climate-Related Risks (IFRS S2)',
      ref: 'IFRS S2.10–S2.20',
      items: [
        {
          label: 'Physical Risks — Acute',
          desc: 'Extreme weather events: floods (Awash River basin), droughts (Tigray, Afar), and storms affecting operations.',
          example:
            'Manufacturing plants near flood-prone areas must disclose exposure and mitigation plans.',
        },
        {
          label: 'Physical Risks — Chronic',
          desc: 'Long-term climate shifts: rising temperatures, changing rainfall patterns affecting agriculture and water supply.',
          example:
            'Agro-processing SMEs must assess crop yield risks from climate variability.',
        },
        {
          label: 'Transition Risks — Policy',
          desc: 'Ethiopian government carbon pricing, renewable energy mandates, and ERCA environmental compliance requirements.',
          example:
            'New environmental levies under Regulation 570/2025 framework.',
        },
        {
          label: 'Transition Risks — Technology',
          desc: 'Shift to renewable energy, electric vehicles, and green building standards affecting capital expenditure.',
          example:
            "Ethio Telecom's green network transition creates both risk and opportunity.",
        },
        {
          label: 'Transition Risks — Market',
          desc: 'Changing customer preferences for sustainable products and services in Ethiopian and export markets.',
          example:
            'Coffee exporters face EU deforestation regulation (EUDR) compliance requirements.',
        },
      ],
    },
    emissions: {
      title: 'GHG Emissions Reporting (IFRS S2.29)',
      ref: 'IFRS S2.29',
      items: [
        {
          label: 'Scope 1 — Direct Emissions',
          desc: 'Emissions from owned or controlled sources: generators, company vehicles, manufacturing processes.',
          example:
            'Diesel generators (common in Ethiopia due to power outages) are Scope 1 sources.',
        },
        {
          label: 'Scope 2 — Indirect Energy',
          desc: 'Emissions from purchased electricity, heat, or steam. Ethiopian Electric Power (EEP) grid is predominantly hydro (low carbon).',
          example:
            'EEP grid electricity has a low emission factor — disclose this advantage.',
        },
        {
          label: 'Scope 3 — Value Chain',
          desc: 'All other indirect emissions: business travel, employee commuting, purchased goods, waste disposal.',
          example:
            'Coffee supply chain emissions from farm to export are Scope 3 for exporters.',
        },
        {
          label: 'Measurement Methods',
          desc: 'Use IPCC emission factors or Ethiopian EPA guidelines. Disclose methodology, assumptions, and estimation uncertainty.',
          example:
            'Ethiopian EPA provides sector-specific emission factors for manufacturing.',
        },
        {
          label: 'Emission Reduction Targets',
          desc: "Set science-based targets aligned with Ethiopia's NDC (Nationally Determined Contribution) under the Paris Agreement.",
          example:
            'Ethiopia targets 68.8% emission reduction by 2030 vs. BAU scenario.',
        },
      ],
    },
    transition: {
      title: 'Climate Transition Plan (IFRS S2.22–S2.28)',
      ref: 'IFRS S2.22–S2.28',
      items: [
        {
          label: 'Net-Zero Commitment',
          desc: "Disclose whether the entity has a net-zero target and the timeline. Align with Ethiopia's Climate Resilient Green Economy (CRGE) strategy.",
          example:
            "Ethiopia's CRGE targets carbon neutrality by 2025 — align business targets accordingly.",
        },
        {
          label: 'Decarbonization Levers',
          desc: 'Specific actions to reduce emissions: renewable energy adoption, energy efficiency, process changes, and supply chain engagement.',
          example:
            'Solar panel installation, LED lighting, and fuel-efficient vehicles.',
        },
        {
          label: 'Capital Allocation',
          desc: 'Investment in green assets and technologies. Disclose CapEx and OpEx related to climate transition.',
          example:
            'Green bonds from Development Bank of Ethiopia for renewable energy projects.',
        },
        {
          label: 'Just Transition',
          desc: 'How the transition plan considers impacts on employees, communities, and suppliers — especially in fossil fuel-dependent sectors.',
          example:
            'Retraining programs for workers in transitioning industries.',
        },
        {
          label: 'Progress Tracking',
          desc: 'Annual reporting on transition plan milestones, KPIs, and deviations from plan.',
          example:
            'Use OVDS Reports module to track and export climate KPIs annually.',
        },
      ],
    },
  };
  return (
    <div
      id="climate-section"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
    >
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
            <span className="text-lg">🌡️</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              IFRS S2 — Climate Disclosures
            </h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Climate-Related Financial Information · Ethiopian Context
            </p>
          </div>
        </div>
        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          IFRS S2 · Paris Agreement · CRGE
        </span>
      </div>

      <div className="px-6 pt-5 pb-3">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          IFRS S2 requires disclosure of climate-related risks and
          opportunities, GHG emissions, and transition plans. Ethiopian entities
          must align with the{' '}
          <strong>Climate Resilient Green Economy (CRGE)</strong> strategy and
          Ethiopia's NDC commitments under the Paris Agreement.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-3 flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
              activeTab === t.key
                ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {(() => {
        const section = content[activeTab];
        return (
          <div className="mx-6 mb-6 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 overflow-hidden">
            <div className="px-5 py-3 border-b border-sky-200 dark:border-sky-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-sky-700 dark:text-sky-300">
                {section.title}
              </h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                {section.ref}
              </span>
            </div>
            <div className="divide-y divide-sky-100 dark:divide-sky-900/30">
              {section.items.map((item, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-semibold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                      {item.example && (
                        <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-sky-100 dark:border-sky-900/40">
                          <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider shrink-0 mt-0.5">
                            Example
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.example}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
export default ComplianceAuditor;


