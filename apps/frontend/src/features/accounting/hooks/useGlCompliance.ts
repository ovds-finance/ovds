/**
 * useGlCompliance — AABE audit-readiness, statutory reports, dual-ledger, MoR package hooks
 */
import { useQuery } from '@tanstack/react-query';
import { orpcUtils } from '../../../lib/orpc';
import { useBusiness } from '../../../context/businessContext';

/** Real-time GL + tax compliance dashboard */
export function useGlDashboard(period?: string) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.glCompliance.dashboard.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined, period },
    }),
    enabled: !!selectedCompanyId,
  });
}

/** IFRS statutory financial reports (BS, P&L, Cash Flow, Schedule A) */
export function useStatutoryReports(startDate?: string, endDate?: string) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.glCompliance.statutoryReports.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined, startDate, endDate },
    }),
    enabled: !!selectedCompanyId,
  });
}

/** AABE audit-readiness score (0–100) */
export function useAabeAuditReadiness(period: string) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.glCompliance.auditReadiness.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined, period },
    }),
    enabled: !!selectedCompanyId && !!period,
  });
}

/** Dual-ledger status: Management/Tax book vs IFRS Statutory book */
export function useDualLedgerStatus(period: string) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.glCompliance.dualLedgerStatus.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined, period },
    }),
    enabled: !!selectedCompanyId && !!period,
  });
}

/** Full MoR submission package */
export function useMoRPackage(
  startDate: string,
  endDate: string,
  type: 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' = 'ANNUAL',
) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.glCompliance.morPackage.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined, startDate, endDate, type },
    }),
    enabled: !!selectedCompanyId && !!startDate && !!endDate,
  });
}
