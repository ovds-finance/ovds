/**
 * useFinancialAlerts — centralised financial alert engine.
 *
 * Merges client-side computed alerts (from props) with server-side alerts
 * from GET /dashboard/alerts. Deduplicates by id, sorts by severity.
 *
 * Covers:
 *  - Payroll: unconfigured employees, cost spikes/drops, missing bank details
 *  - Invoices: overdue, high pending count, VAT threshold
 *  - ERCA VAT: filing deadline (≤7 days), WHT reminder
 *  - Disaster Fund: quarterly levy reminder
 *  - BIT: Business Income Tax filing reminder
 *  - IFRS 18: readiness reminder for ovds roles
 *  - Server-side: DB-backed alerts from /dashboard/alerts
 */
import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../rbac/AuthContext';
import { Role, Alert as FinancialAlert, AlertSeverity } from '@ovds/ui';
import api from '../services/api';

export type { AlertSeverity };

interface AlertInputs {
  payrollCurrent?: {
    count?: number;
    configured?: number;
    totalGross?: number;
    totalNet?: number;
  } | null;
  payrollPrev?: {
    count?: number;
    configured?: number;
    totalGross?: number;
  } | null;
  invoiceStats?: {
    overdueCount?: number;
    overdueAmount?: number;
    pendingCount?: number;
    pendingAmount?: number;
    annualRevenue?: number;
  } | null;
  dashStats?: {
    payroll?: {
      totalEmployees?: number;
      missingBankDetails?: number;
    };
  } | null;
  currency?: string;
  loading?: boolean;
  companyId?: string | null;
}

const SEVERITY_ORDER: AlertSeverity[] = ['critical', 'warning', 'info', 'success'];

export function useFinancialAlerts(inputs: AlertInputs = {}) {
  const {
    payrollCurrent,
    payrollPrev,
    invoiceStats,
    dashStats,
    currency = 'ETB',
    loading = false,
    companyId,
  } = inputs;

  const { is, can, isAuthenticated } = useAuth();
  const isOVDSGroup = is(Role.OVDS, Role.ACCOUNTING, Role.AUDITOR, Role.SPURADMIN, Role.DEVELOPER) || can('ovds:read');

  // -- Server-side alerts (DB-backed, polled every 60s) ---------------------
  const [serverAlerts, setServerAlerts] = useState<FinancialAlert[]>([]);
  const [availableReleases, setAvailableReleases] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const fetchReleases = () => {
      api.get('/releases/available', { headers: { 'x-background': '1' } } as any)
        .then((res: any) => {
          if (cancelled) return;
          const data: any[] = res.data?.data ?? res.data ?? [];
          if (Array.isArray(data)) setAvailableReleases(data);
        })
        .catch(() => {});
    };

    const fetch = () => {
      const url = companyId
        ? `/dashboard/alerts?companyId=${companyId}`
        : '/dashboard/alerts';
      api.get(url, { headers: { 'x-background': '1' } })
        .then((r: any) => {
          if (cancelled) return;
          const data: FinancialAlert[] = r.data?.data ?? r.data ?? [];
          if (Array.isArray(data)) setServerAlerts(data);
        })
        .catch(() => {}); // silent — server alerts are best-effort
    };
    fetch();
    fetchReleases();
    const interval = setInterval(() => {
      fetch();
      fetchReleases();
    }, 60_000);
    const onExpired = () => clearInterval(interval);
    window.addEventListener('ovds:session-expired', onExpired);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('ovds:session-expired', onExpired);
    };
  }, [companyId, isAuthenticated]);

  // -- Client-side computed alerts -------------------------------------------
  const clientAlerts = useMemo<FinancialAlert[]>(() => {
    if (loading) return [];
    const list: FinancialAlert[] = [];

    // Declare now once at the top — fixes the dayOfMonth-before-now bug
    const now = new Date();
    const month = now.getMonth() + 1;       // 1–12
    const dayOfMonth = now.getDate();
    const currentYear = now.getFullYear();

    // -- Payroll: unconfigured employees --------------------------------------
    const total = dashStats?.payroll?.totalEmployees ?? payrollCurrent?.count ?? 0;
    const configured = payrollCurrent?.configured ?? 0;
    const unconfigured = total - configured;
    if (unconfigured > 0) {
      list.push({
        id: 'payroll-unconfigured',
        severity: unconfigured > 5 ? 'critical' : 'warning',
        title: `${unconfigured} employee${unconfigured > 1 ? 's' : ''} not configured for payroll`,
        detail: `${configured} of ${total} employees have payroll set up this month.`,
        actionTo: '/hr/payroll',
        actionLabel: 'Go to Payroll',
        domain: 'payroll',
      });
    }

    // -- Payroll: cost spike / drop --------------------------------------------
    if (payrollPrev?.totalGross && payrollCurrent?.totalGross) {
      const change = ((payrollCurrent.totalGross - payrollPrev.totalGross) / payrollPrev.totalGross) * 100;
      if (change > 15) {
        list.push({
          id: 'payroll-spike',
          severity: 'warning',
          title: `Payroll cost up ${change.toFixed(1)}% vs last month`,
          detail: `${currency} ${payrollCurrent.totalGross.toLocaleString()} this month vs ${currency} ${payrollPrev.totalGross.toLocaleString()} last month.`,
          actionTo: '/reports',
          actionLabel: 'View Reports',
          domain: 'payroll',
        });
      } else if (change < -10) {
        list.push({
          id: 'payroll-drop',
          severity: 'info',
          title: `Payroll cost down ${Math.abs(change).toFixed(1)}% vs last month`,
          detail: 'This could indicate headcount reduction or salary adjustments.',
          actionTo: '/reports',
          actionLabel: 'View Reports',
          domain: 'payroll',
        });
      }
    }

    // -- Payroll: missing bank details -----------------------------------------
    const missingBank = dashStats?.payroll?.missingBankDetails ?? 0;
    if (missingBank > 0) {
      list.push({
        id: 'compliance-bank',
        severity: 'warning',
        title: `${missingBank} employee${missingBank > 1 ? 's' : ''} missing bank details`,
        detail: 'Bank details are required for salary disbursement.',
        actionTo: '/hr/employees',
        actionLabel: 'Manage Employees',
        domain: 'hr',
      });
    }

    // -- Invoices: overdue -----------------------------------------------------
    const overdueCount = invoiceStats?.overdueCount ?? 0;
    const overdueAmount = invoiceStats?.overdueAmount ?? 0;
    if (overdueCount > 0) {
      list.push({
        id: 'invoices-overdue',
        severity: overdueCount > 3 ? 'critical' : 'warning',
        title: `${overdueCount} overdue invoice${overdueCount > 1 ? 's' : ''} — ${currency} ${Number(overdueAmount).toLocaleString()} at risk`,
        detail: 'Follow up with clients to protect your cash flow.',
        actionTo: '/sales/invoices',
        actionLabel: 'Manage Invoices',
        domain: 'invoices',
      });
    }

    // -- Invoices: high pending count ------------------------------------------
    const pendingCount = invoiceStats?.pendingCount ?? 0;
    if (pendingCount > 10) {
      list.push({
        id: 'invoices-pending',
        severity: 'info',
        title: `${pendingCount} invoices awaiting payment`,
        detail: `${currency} ${Number(invoiceStats?.pendingAmount ?? 0).toLocaleString()} in outstanding receivables.`,
        actionTo: '/sales/invoices',
        actionLabel: 'View Invoices',
        domain: 'invoices',
      });
    }

    // -- VAT threshold: warn if approaching ETB 2M (Regulation No. 570/2025) --
    const annualRevenue = invoiceStats?.annualRevenue ?? 0;
    const VAT_THRESHOLD = 2_000_000;
    if (annualRevenue > 0 && annualRevenue >= VAT_THRESHOLD * 0.8 && annualRevenue < VAT_THRESHOLD) {
      list.push({
        id: 'vat-threshold-approaching',
        severity: 'warning',
        title: `Approaching VAT registration threshold (${currency} ${(annualRevenue / 1_000_000).toFixed(1)}M of ${currency} 2M)`,
        detail: 'Regulation No. 570/2025 raised the threshold to ETB 2,000,000/year. Register with ERCA before exceeding the limit.',
        actionTo: '/tax/vat',
        actionLabel: 'VAT Administration',
        domain: 'vat',
      });
    }

    // -- WHT: monthly reminder (3% — Proclamation No. 1395/2025) -------------
    if (dayOfMonth >= 25 && pendingCount > 0) {
      list.push({
        id: 'wht-reminder',
        severity: 'info',
        title: 'Withholding Tax (WHT) due by month end',
        detail: '3% WHT on service payments ≥ ETB 10,000 and goods ≥ ETB 20,000. Proclamation No. 1395/2025.',
        actionTo: '/tax/vat',
        actionLabel: 'VAT Administration',
        domain: 'withholding',
      });
    }

    // -- ERCA VAT: filing deadline (30th of following month) ------------------
    const vatDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 30);
    const daysToVat = Math.ceil((vatDeadline.getTime() - now.getTime()) / 86_400_000);
    if (daysToVat <= 7) {
      list.push({
        id: 'vat-deadline',
        severity: daysToVat <= 3 ? 'critical' : 'warning',
        title: `VAT return due in ${daysToVat} day${daysToVat !== 1 ? 's' : ''} (ERCA)`,
        detail: `Monthly VAT filing deadline: ${vatDeadline.toLocaleDateString()}. Late penalty: ETB 500/day.`,
        actionTo: '/tax/vat',
        actionLabel: 'File VAT',
        domain: 'vat',
      });
    }

    // -- Disaster Fund: quarterly levy reminder --------------------------------
    const isQuarterEnd = [3, 6, 9, 12].includes(month);
    if (isQuarterEnd && dayOfMonth >= 20) {
      list.push({
        id: 'disaster-fund-quarterly',
        severity: dayOfMonth >= 28 ? 'critical' : 'warning',
        title: `Disaster Fund (DRRF) quarterly levy due${dayOfMonth >= 28 ? ' — URGENT' : ''}`,
        detail: 'Ensure quarterly contributions are remitted to ERCA before month end. Regulation 570/2025.',
        actionTo: '/disaster-fund',
        actionLabel: 'Disaster Fund',
        domain: 'disaster_fund',
      });
    }

    // -- DRRF: overdue check (past 15th, not already warned) ------------------
    if (isQuarterEnd && dayOfMonth > 15 && !list.some(a => a.id === 'disaster-fund-quarterly')) {
      list.push({
        id: 'drrf-overdue-check',
        severity: dayOfMonth > 25 ? 'critical' : 'warning',
        title: `DRRF quarterly levy${dayOfMonth > 25 ? ' OVERDUE' : ' due soon'}`,
        detail: 'Disaster Risk Reduction Fund levy must be remitted to EDRRFO. Regulation 570/2025.',
        actionTo: '/disaster-fund',
        actionLabel: 'Remit DRRF',
        domain: 'disaster_fund',
      });
    }

    // -- BIT: Business Income Tax filing reminder (November — 4 months after July FY end) --
    // Ethiopian FY ends July 7 → BIT due by November 7
    if (month === 11 && dayOfMonth >= 1) {
      list.push({
        id: 'bit-filing',
        severity: dayOfMonth >= 5 ? 'critical' : 'warning',
        title: `Business Income Tax (BIT) filing due by November 7`,
        detail: 'Annual BIT declaration must be filed within 4 months of Ethiopian FY end (30% flat rate). Minimum Alternative Tax: 2.5% of turnover.',
        actionTo: '/tax/business-income',
        actionLabel: 'File BIT',
        domain: 'bit',
      });
    }

    // -- Ethiopian FY end: July 7 (Hamle 30 EFY) ------------------------------
    const isEthFYEnd = month === 7 && dayOfMonth >= 1 && dayOfMonth <= 7;
    if (isEthFYEnd) {
      list.push({
        id: 'eth-fy-end',
        severity: 'warning',
        title: 'Ethiopian Fiscal Year ending — prepare annual reports',
        detail: 'EFY ends July 7. Ensure all journal entries, VAT reconciliation, and BIT are finalized.',
        actionTo: '/accounting',
        actionLabel: 'Accounting',
        domain: 'vat',
      });
    }

    // -- Pension: monthly contribution deadline (15th of each month) ----------
    if (dayOfMonth >= 12 && dayOfMonth <= 15 && total > 0) {
      list.push({
        id: 'pension-deadline',
        severity: dayOfMonth >= 14 ? 'warning' : 'info',
        title: 'Pension contributions due by the 15th',
        detail: 'Employee 7% + Employer 11% of basic salary (capped at ETB 15,000) must be remitted to the Pension Authority.',
        actionTo: '/hr/payroll',
        actionLabel: 'View Payroll',
        domain: 'payroll',
      });
    }

    // -- MAT: Minimum Alternative Tax alert (Proclamation No. 1395/2025) --------
    // Warn when annual revenue > 0 and MAT (2.5% of turnover) may exceed BIT (30% of profit)
    if (annualRevenue > 0 && annualRevenue < VAT_THRESHOLD) {
      // Category B taxpayer — TOT applies instead of VAT
      list.push({
        id: 'tot-applicable',
        severity: 'warning',
        title: `Turnover Tax (TOT) applies — annual revenue ETB ${(annualRevenue / 1_000).toFixed(0)}K`,
        detail: `Revenue below ETB 2M VAT threshold. TOT rates: 2% on goods, 10% on services. File monthly by 30th. Proclamation No. 1395/2025.`,
        actionTo: '/tax/vat',
        actionLabel: 'Tax Administration',
        domain: 'vat',
      });
    }
    if (annualRevenue > 0 && isOVDSGroup) {
      const matPayable = annualRevenue * 0.025;
      const estimatedBIT = annualRevenue * 0.30 * 0.15; // rough estimate: 15% margin
      if (matPayable > estimatedBIT) {
        list.push({
          id: 'mat-applies',
          severity: 'warning',
          title: `MAT may apply — ETB ${matPayable.toLocaleString(undefined, { maximumFractionDigits: 0 })} (2.5% of turnover)`,
          detail: `Minimum Alternative Tax (2.5% of annual turnover) may exceed regular BIT (30% of net profit). Pay whichever is higher. Proclamation No. 1395/2025.`,
          actionTo: '/tax/business-income',
          actionLabel: 'BIT Calculator',
          domain: 'bit',
        });
      }
    }

    // -- TOT: filing deadline alert (30th of following month) -----------------
    // Mirrors the VAT deadline alert but for Category B taxpayers
    if (annualRevenue > 0 && annualRevenue < VAT_THRESHOLD) {
      const totDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 30);
      const daysToTot = Math.ceil((totDeadline.getTime() - now.getTime()) / 86_400_000);
      if (daysToTot <= 7) {
        list.push({
          id: 'tot-deadline',
          severity: daysToTot <= 3 ? 'critical' : 'warning',
          title: `TOT return due in ${daysToTot} day${daysToTot !== 1 ? 's' : ''} — Category B`,
          detail: `Turnover Tax filing deadline: ${totDeadline.toLocaleDateString()}. Rates: 2% goods, 10% services. Zero return required even with no sales. Late penalty: ETB 500/day.`,
          actionTo: '/tax/filing',
          actionLabel: 'File TOT',
          domain: 'vat',
        });
      }
    }

    // -- BIT: quarterly provisional tax installment reminders -----------------
    // Q1: Sep 7 · Q2: Dec 7 · Q3: Mar 7 · Q4: Jun 7
    const provisionalDeadlines: Array<{ q: number; month: number; day: number; label: string }> = [
      { q: 1, month: 9,  day: 7, label: 'September 7'  },
      { q: 2, month: 12, day: 7, label: 'December 7'   },
      { q: 3, month: 3,  day: 7, label: 'March 7'      },
      { q: 4, month: 6,  day: 7, label: 'June 7'       },
    ];
    for (const pd of provisionalDeadlines) {
      const pdDate = new Date(currentYear, pd.month - 1, pd.day);
      const daysToPd = Math.ceil((pdDate.getTime() - now.getTime()) / 86_400_000);
      if (daysToPd >= 0 && daysToPd <= 14 && isOVDSGroup) {
        list.push({
          id: `bit-provisional-q${pd.q}`,
          severity: daysToPd <= 3 ? 'critical' : 'warning',
          title: `BIT Q${pd.q} Provisional Tax due ${pd.label} (${daysToPd}d)`,
          detail: `25% of estimated annual Business Income Tax is due by ${pd.label}. Paying quarterly avoids 2%/month compounded late-payment interest. Proclamation No. 1395/2025.`,
          actionTo: '/tax/business-income',
          actionLabel: 'BIT Calculator',
          domain: 'bit',
        });
        break; // Only show the nearest upcoming installment
      }
    }

    // -- Zero declaration: reminder when no VAT filing exists for prior period -
    // Show a warning in the last 5 days of the month if no filing has been recorded
    if (dayOfMonth >= 26 && isOVDSGroup) {
      list.push({
        id: 'zero-declaration-reminder',
        severity: 'info',
        title: 'Zero declaration required if no transactions this month',
        detail: 'Even with no sales or purchases, you must file a zero return for VAT and/or TOT by the 30th. Late filing penalty: ETB 500/day.',
        actionTo: '/tax/filing',
        actionLabel: 'Tax Filing',
        domain: 'vat',
      });
    }

    // -- IFRS 18: readiness reminder (OVDS roles only) ---------------------
    if (isOVDSGroup && currentYear >= 2025 && currentYear <= 2026) {
      const monthsUntil2027 = (2027 - currentYear) * 12 - now.getMonth();
      const ifrs18Severity: AlertSeverity =
        currentYear === 2026 && month >= 7 ? 'warning' : 'info';
      list.push({
        id: 'ifrs18-readiness',
        severity: ifrs18Severity,
        title: `IFRS 18 replaces IAS 1 on 1 Jan 2027 — ${monthsUntil2027} months to prepare`,
        detail: 'Map P&L to Operating/Investing/Financing categories. Identify MPMs. Plan comparative restatement.',
        actionTo: '/accounting?tab=reports&report=iasb-updates',
        actionLabel: 'IFRS 18 Guide',
        domain: 'system',
      });
    }

    // -- System: Available Releases ------------------------------------------
    if (availableReleases.length > 0) {
      const latest = availableReleases[0];
      const isMandatory = availableReleases.some(r => r.release.isMandatory);
      list.push({
        id: 'system-update-available',
        severity: isMandatory ? 'critical' : 'info',
        title: `System Update Available: v${latest.release.version}`,
        detail: isMandatory 
          ? 'A mandatory security and stability update is required for your environment.' 
          : 'New features and performance improvements are ready to be installed.',
        actionTo: '/settings/releases',
        actionLabel: 'View Update',
        domain: 'system',
      });
    }

    return list;
  }, [payrollCurrent, payrollPrev, invoiceStats, dashStats, currency, loading, isOVDSGroup, availableReleases]);

  // -- Merge client + server alerts, deduplicate by id ----------------------
  const alerts = useMemo<FinancialAlert[]>(() => {
    if (loading) return [];

    // Server alerts take precedence (they have DB-backed data)
    const merged = new Map<string, FinancialAlert>();
    clientAlerts.forEach(a => merged.set(a.id, a));
    serverAlerts.forEach(a => merged.set(a.id, a)); // server overwrites client for same id

    const list = Array.from(merged.values());

    if (list.length === 0) {
      list.push({
        id: 'all-good',
        severity: 'success',
        title: 'Everything looks healthy',
        detail: 'No critical issues detected. Payroll is configured and receivables are on track.',
        domain: 'system',
      });
    }

    return list.sort((a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    );
  }, [clientAlerts, serverAlerts, loading]);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount  = alerts.filter(a => a.severity === 'warning').length;
  const infoCount     = alerts.filter(a => a.severity === 'info').length;

  return { alerts, criticalCount, warningCount, infoCount, loading };
}
