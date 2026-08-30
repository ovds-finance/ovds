import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eimsApi } from '../services/eimsApi';

export function useEimsReadiness() {
  return useQuery({ queryKey: ['eims', 'readiness'], queryFn: () => eimsApi.readiness() });
}

export function useEimsBspChecklist() {
  return useQuery({ queryKey: ['eims', 'bsp-checklist'], queryFn: () => eimsApi.bspChecklist() });
}

export function useEimsOnboardingChecklist() {
  return useQuery({ queryKey: ['eims', 'onboarding'], queryFn: () => eimsApi.onboardingChecklist() });
}

export function useEimsDashboard() {
  return useQuery({ queryKey: ['eims', 'dashboard'], queryFn: () => eimsApi.dashboard() });
}

export function useEimsChecklist() {
  return useQuery({ queryKey: ['eims', 'checklist'], queryFn: () => eimsApi.checklist() });
}

export function useEimsBspReport() {
  return useQuery({ queryKey: ['eims', 'bsp-report'], queryFn: () => eimsApi.bspReport() });
}

export function useEimsReceipts(invoiceId?: string) {
  return useQuery({
    queryKey: ['eims', 'receipts', invoiceId],
    queryFn: () => eimsApi.receipts.list(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useEimsSourceSystems() {
  return useQuery({ queryKey: ['eims', 'source-systems'], queryFn: () => eimsApi.sourceSystems.list() });
}

export function useEimsEnterprises() {
  return useQuery({ queryKey: ['eims', 'enterprises'], queryFn: () => eimsApi.sourceSystems.listEnterprises() });
}

export function useEimsEstablishments(enterpriseId: string) {
  return useQuery({
    queryKey: ['eims', 'establishments', enterpriseId],
    queryFn: () => eimsApi.sourceSystems.listEstablishments(enterpriseId),
    enabled: !!enterpriseId,
  });
}

export function useUpdateSourceSystemStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, step }: { id: string; step: string }) =>
      eimsApi.sourceSystems.updateStep(id, step),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims'] }),
  });
}

export function useEimsCertificates() {
  return useQuery({ queryKey: ['eims', 'certificates'], queryFn: () => eimsApi.certificates.list() });
}

export function useEimsRegistrations(status?: string) {
  return useQuery({
    queryKey: ['eims', 'registrations', status],
    queryFn: () => eimsApi.registrations(status),
  });
}

export function useRegisterSourceSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eimsApi.sourceSystems.register,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eims'] });
    },
  });
}

export function useGenerateCsr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eimsApi.certificates.generateCsr,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'certificates'] }),
  });
}

export function useInstallCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, certificatePem }: { id: string; certificatePem: string }) =>
      eimsApi.certificates.install(id, certificatePem),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims'] }),
  });
}

export function useEimsBulkJobs() {
  return useQuery({ queryKey: ['eims', 'bulk-jobs'], queryFn: () => eimsApi.bulk.jobs() });
}

export function useEimsCertificateExpiry() {
  return useQuery({
    queryKey: ['eims', 'cert-expiry'],
    queryFn: () => eimsApi.certificates.expiryCheck(),
  });
}

export function useRegisterInvoiceEims() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => eimsApi.invoices.register(invoiceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'registrations'] }),
  });
}

export function useEimsInvoiceRetry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => eimsApi.invoices.retry(invoiceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims'] }),
  });
}

export function useEimsInvoiceCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reasonCode, remark }: { id: string; reasonCode?: string; remark?: string }) =>
      eimsApi.invoices.cancel(id, reasonCode, remark),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims'] }),
  });
}

export function useEimsSalesReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eimsApi.receipts.registerSales,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'receipts'] }),
  });
}

export function useEimsBulkRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceIds: string[]) => eimsApi.bulk.register(invoiceIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'bulk-jobs'] }),
  });
}

export function useRecordBspResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eimsApi.recordBspResult,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eims', 'bsp-report'] });
      qc.invalidateQueries({ queryKey: ['eims', 'bsp-checklist'] });
    },
  });
}

export function useCyberAuditList() {
  return useQuery({ queryKey: ['eims', 'cyber-audit-list'], queryFn: () => eimsApi.cyberAuditList?.() ?? Promise.resolve([]) });
}

export function useCyberAudit() {
  return useQuery({ queryKey: ['eims', 'cyber-audit'], queryFn: () => eimsApi.cyberAudit?.() ?? Promise.resolve({}) });
}

export function useCreateCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => eimsApi.createCyberAudit?.(data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useUpdateCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateCyberAudit?.(id, data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useDeleteCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.deleteCyberAudit?.(id) ?? Promise.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useStartCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.startCyberAudit?.(id) ?? Promise.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useCompleteCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.completeCyberAudit?.(id) ?? Promise.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useCyberAuditMetrics() {
  return useQuery({ queryKey: ['eims', 'cyber-audit-metrics'], queryFn: () => eimsApi.cyberAuditMetrics?.() ?? Promise.resolve([]) });
}

export function useUpdateCyberAuditMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateCyberAuditMetric?.(id, data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-metrics'] }),
  });
}

export function useCyberAuditFindings() {
  return useQuery({ queryKey: ['eims', 'cyber-audit-findings'], queryFn: () => eimsApi.cyberAuditFindings?.() ?? Promise.resolve([]) });
}

export function useCreateCyberAuditFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => eimsApi.createCyberAuditFinding?.(data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-findings'] }),
  });
}

export function useUpdateCyberAuditFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateCyberAuditFinding?.(id, data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-findings'] }),
  });
}

export function useDeleteCyberAuditFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.deleteCyberAuditFinding?.(id) ?? Promise.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-findings'] }),
  });
}

export function useCyberAuditChecklist() {
  return useQuery({ queryKey: ['eims', 'cyber-audit-checklist'], queryFn: () => eimsApi.cyberAuditChecklist?.() ?? Promise.resolve([]) });
}

export function useCyberAuditSummary() {
  return useQuery({ queryKey: ['eims', 'cyber-audit-summary'], queryFn: () => eimsApi.cyberAuditSummary?.() ?? Promise.resolve({}) });
}

export function useMasterComplianceList() {
  return useQuery({ queryKey: ['eims', 'master-compliance-list'], queryFn: () => eimsApi.masterComplianceList?.() ?? Promise.resolve([]) });
}

export function useMasterCompliance() {
  return useQuery({ queryKey: ['eims', 'master-compliance'], queryFn: () => eimsApi.masterCompliance?.() ?? Promise.resolve({}) });
}

export function useCreateMasterCompliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => eimsApi.createMasterCompliance?.(data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'master-compliance'] }),
  });
}

export function useUpdateMasterCompliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateMasterCompliance?.(id, data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'master-compliance'] }),
  });
}

export function useDeleteMasterCompliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.deleteMasterCompliance?.(id) ?? Promise.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'master-compliance'] }),
  });
}

export function useMasterComplianceItems() {
  return useQuery({ queryKey: ['eims', 'master-compliance-items'], queryFn: () => eimsApi.masterComplianceItems?.() ?? Promise.resolve([]) });
}

export function useUpdateMasterComplianceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateMasterComplianceItem?.(id, data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'master-compliance-items'] }),
  });
}

export function useMasterComplianceTemplate() {
  return useQuery({ queryKey: ['eims', 'master-compliance-template'], queryFn: () => eimsApi.masterComplianceTemplate?.() ?? Promise.resolve({}) });
}

export function useMasterComplianceSummary() {
  return useQuery({ queryKey: ['eims', 'master-compliance-summary'], queryFn: () => eimsApi.masterComplianceSummary?.() ?? Promise.resolve({}) });
}

export function useAccreditationList() {
  return useQuery({ queryKey: ['eims', 'accreditation-list'], queryFn: () => eimsApi.accreditationList?.() ?? Promise.resolve([]) });
}

export function useAccreditation() {
  return useQuery({ queryKey: ['eims', 'accreditation'], queryFn: () => eimsApi.accreditation?.() ?? Promise.resolve({}) });
}

export function useCreateAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => eimsApi.createAccreditation?.(data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'accreditation'] }),
  });
}

export function useUpdateAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateAccreditation?.(id, data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'accreditation'] }),
  });
}

export function useDeleteAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.deleteAccreditation?.(id) ?? Promise.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'accreditation'] }),
  });
}

export function useAccreditationItems() {
  return useQuery({ queryKey: ['eims', 'accreditation-items'], queryFn: () => eimsApi.accreditationItems?.() ?? Promise.resolve([]) });
}

export function useUpdateAccreditationItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateAccreditationItem?.(id, data) ?? Promise.resolve(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'accreditation-items'] }),
  });
}

export function useAccreditationSummary() {
  return useQuery({ queryKey: ['eims', 'accreditation-summary'], queryFn: () => eimsApi.accreditationSummary?.() ?? Promise.resolve({}) });
}
