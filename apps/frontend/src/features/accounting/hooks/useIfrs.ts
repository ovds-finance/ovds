/**
 * useIfrs — IFRS 15/16/IAS 38/IFRS 10 + AABE disclosure hooks
 */
import { useQuery } from '@tanstack/react-query';
import { orpcUtils } from '../../../lib/orpc';
import { useBusiness } from '../../../context/businessContext';

export function useIfrsDashboard() {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.ifrs.dashboard.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined },
    }),
    enabled: !!selectedCompanyId,
  });
}

export function useIfrs15Schedules(contractId?: string) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.ifrs.schedules.list.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined, contractId },
    }),
    enabled: !!selectedCompanyId,
  });
}

export function useIfrs16Leases() {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.ifrs.leases.list.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined },
    }),
    enabled: !!selectedCompanyId,
  });
}

export function useIas38SoftwareAssets() {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.ifrs.softwareAssets.list.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined },
    }),
    enabled: !!selectedCompanyId,
  });
}

export function useIfrs10ConsolidationStatus(period: string) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.ifrs.consolidationStatus.queryOptions({
      input: { parentCompanyId: selectedCompanyId ?? '', period },
    }),
    enabled: !!selectedCompanyId && !!period,
  });
}

/** AABE IFRS disclosure package — required for regulatory submission */
export function useAabeDisclosure(period: string) {
  const { selectedCompanyId } = useBusiness();
  return useQuery({
    ...orpcUtils.accounting.ifrs.aabedisclosure.queryOptions({
      input: { companyId: selectedCompanyId ?? undefined, period },
    }),
    enabled: !!selectedCompanyId && !!period,
  });
}
