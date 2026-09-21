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
  return useQuery({ queryKey: ['eims', 'cyber-audit-list'], queryFn: () => eimsApi.cyberAuditList() });
}

export function useCyberAudit(auditId?: string) {
  return useQuery({
    queryKey: ['eims', 'cyber-audit', auditId],
    queryFn: () => eimsApi.cyberAudit(auditId),
    enabled: !!auditId,
  });
}

export function useCreateCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => eimsApi.createCyberAudit(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-list'] }),
  });
}

export function useUpdateCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateCyberAudit(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useDeleteCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.deleteCyberAudit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-list'] }),
  });
}

export function useStartCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.startCyberAudit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useCompleteCyberAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.completeCyberAudit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit'] }),
  });
}

export function useCyberAuditMetrics(auditId?: string) {
  return useQuery({
    queryKey: ['eims', 'cyber-audit-metrics', auditId],
    queryFn: () => eimsApi.cyberAuditMetrics(auditId),
    enabled: !!auditId,
  });
}

export function useUpdateCyberAuditMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, metricId, data }: { auditId: string; metricId: string; data: any }) =>
      eimsApi.updateCyberAuditMetric(auditId, metricId, data),
    onSuccess: (_r, { auditId }) => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-metrics', auditId] }),
  });
}

export function useCyberAuditFindings(params?: { auditId?: string; severity?: string; status?: string }) {
  const { auditId, severity, status } = params ?? {};
  return useQuery({
    queryKey: ['eims', 'cyber-audit-findings', auditId, severity, status],
    queryFn: () => eimsApi.cyberAuditFindings(auditId),
    enabled: !!auditId,
  });
}

export function useCreateCyberAuditFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, ...rest }: { auditId: string; [k: string]: any }) =>
      eimsApi.createCyberAuditFinding(auditId, rest),
    onSuccess: (_r, { auditId }) => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-findings', auditId] }),
  });
}

export function useUpdateCyberAuditFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, findingId, data }: { auditId: string; findingId: string; data: any }) =>
      eimsApi.updateCyberAuditFinding(auditId, findingId, data),
    onSuccess: (_r, { auditId }) => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-findings', auditId] }),
  });
}

export function useDeleteCyberAuditFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ auditId, findingId }: { auditId: string; findingId: string }) =>
      eimsApi.deleteCyberAuditFinding(auditId, findingId),
    onSuccess: (_r, { auditId }) => qc.invalidateQueries({ queryKey: ['eims', 'cyber-audit-findings', auditId] }),
  });
}

export function useCyberAuditChecklist() {
  return useQuery({ queryKey: ['eims', 'cyber-audit-checklist'], queryFn: () => eimsApi.cyberAuditChecklist() });
}

export function useCyberAuditSummary(auditId?: string) {
  return useQuery({
    queryKey: ['eims', 'cyber-audit-summary', auditId],
    queryFn: () => eimsApi.cyberAuditSummary(auditId),
    enabled: !!auditId,
  });
}

export function useMasterComplianceList() {
  return useQuery({ queryKey: ['eims', 'master-compliance-list'], queryFn: () => eimsApi.masterComplianceList() });
}

export function useMasterCompliance(id?: string) {
  return useQuery({
    queryKey: ['eims', 'master-compliance', id],
    queryFn: () => eimsApi.masterCompliance(id),
    enabled: !!id,
  });
}

export function useCreateMasterCompliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => eimsApi.createMasterCompliance(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'master-compliance-list'] }),
  });
}

export function useUpdateMasterCompliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateMasterCompliance(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'master-compliance'] }),
  });
}

export function useDeleteMasterCompliance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.deleteMasterCompliance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'master-compliance-list'] }),
  });
}

export function useMasterComplianceItems(id?: string) {
  return useQuery({
    queryKey: ['eims', 'master-compliance-items', id],
    queryFn: () => eimsApi.masterComplianceItems(id),
    enabled: !!id,
  });
}

export function useUpdateMasterComplianceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, itemId, data }: { checklistId: string; itemId: string; data: any }) =>
      eimsApi.updateMasterComplianceItem(checklistId, itemId, data),
    onSuccess: (_r, { checklistId }) =>
      qc.invalidateQueries({ queryKey: ['eims', 'master-compliance-items', checklistId] }),
  });
}

export function useMasterComplianceTemplate() {
  return useQuery({ queryKey: ['eims', 'master-compliance-template'], queryFn: () => eimsApi.masterComplianceTemplate() });
}

export function useMasterComplianceSummary() {
  return useQuery({ queryKey: ['eims', 'master-compliance-summary'], queryFn: () => eimsApi.masterComplianceSummary() });
}

export function useAccreditationList() {
  return useQuery({ queryKey: ['eims', 'accreditation-list'], queryFn: () => eimsApi.accreditationList() });
}

export function useAccreditation(id?: string) {
  return useQuery({
    queryKey: ['eims', 'accreditation', id],
    queryFn: () => eimsApi.accreditation(id),
    enabled: !!id,
  });
}

export function useCreateAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => eimsApi.createAccreditation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'accreditation-list'] }),
  });
}

export function useUpdateAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => eimsApi.updateAccreditation(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'accreditation'] }),
  });
}

export function useDeleteAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eimsApi.deleteAccreditation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eims', 'accreditation-list'] }),
  });
}

export function useAccreditationItems(id?: string) {
  return useQuery({
    queryKey: ['eims', 'accreditation-items', id],
    queryFn: () => eimsApi.accreditationItems(id),
    enabled: !!id,
  });
}

export function useUpdateAccreditationItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, itemId, data }: { checklistId: string; itemId: string; data: any }) =>
      eimsApi.updateAccreditationItem(checklistId, itemId, data),
    onSuccess: (_r, { checklistId }) =>
      qc.invalidateQueries({ queryKey: ['eims', 'accreditation-items', checklistId] }),
  });
}

export function useAccreditationSummary() {
  return useQuery({ queryKey: ['eims', 'accreditation-summary'], queryFn: () => eimsApi.accreditationSummary() });
}
