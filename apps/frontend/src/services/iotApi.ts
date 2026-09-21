/**
 * IoT API service — typed wrappers around all /api/iot/* endpoints
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED' | 'OFFLINE';
export type DeviceType = 'SMART_METER' | 'ROUTER' | 'SENSOR' | 'CONTROLLER' | 'CAMERA' | 'POS_TERMINAL' | 'OTHER';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type OtaStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK' | 'CANCELLED';
export type TelemetryQuality = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'FAULT';

export interface IotDevice {
  id: string;
  name: string;
  serialNumber: string;
  externalRef?: string | null;
  deviceType: DeviceType;
  location?: string | null;
  firmwareVersion?: string | null;
  hardwareVersion?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  status: DeviceStatus;
  lastSeenAt?: string | null;
  batteryLevel?: number | null;
  uptimeHours?: number | null;
  connectionString?: string | null;
  protocol?: string | null;
  customerId?: string | null;
  fixedAssetId?: string | null;
  notes?: string | null;
  companyId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { alerts: number; billingTriggers: number };
}

export interface IotTelemetry {
  id: string;
  deviceId: string;
  metricKey: string;
  value: number;
  unit?: string | null;
  recordedAt: string;
  quality: TelemetryQuality;
  rawPayload?: string | null;
}

export interface IotAlert {
  id: string;
  deviceId: string;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metricKey?: string | null;
  thresholdValue?: number | null;
  actualValue?: number | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SUPPRESSED';
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  linkedInvoiceId?: string | null;
  createdAt: string;
  device?: { id: string; name: string; deviceType: string; location?: string | null };
}

export interface OtaUpdateJob {
  id: string;
  deviceId: string;
  targetVersion: string;
  fromVersion?: string | null;
  packageUrl?: string | null;
  status: OtaStatus;
  progress: number;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  releaseNotes?: string | null;
  initiatedBy?: string | null;
  createdAt: string;
  device?: { id: string; name: string; firmwareVersion?: string | null };
}

export interface IotBillingTrigger {
  id: string;
  deviceId: string;
  customerId?: string | null;
  triggerType: string;
  metricKey?: string | null;
  thresholdValue?: number | null;
  actualValue?: number | null;
  lineItemDescription: string;
  billableAmount: number;
  currencyCode: string;
  invoiced: boolean;
  linkedInvoiceId?: string | null;
  linkedInvoiceNo?: string | null;
  invoicedAt?: string | null;
  createdAt: string;
  device?: { id: string; name: string; deviceType: string; location?: string | null };
}

export interface IotDashboardSummary {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  openAlerts: number;
  criticalAlerts: number;
  pendingOta: number;
  unbilledTriggers: number;
  uptimePct: number;
}

export interface ETaxSubmission {
  id: string;
  vatFilingId?: string | null;
  submissionType: string;
  period: string;
  totalPayable: number;
  status: 'DRAFT' | 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'FAILED';
  mode: string;
  ercaReferenceNo?: string | null;
  submittedAt?: string | null;
  acceptedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function unwrap<T>(res: { data: T | { data: T } }): T {
  const d = res.data;
  if (d && typeof d === 'object' && 'data' in (d as any)) return (d as any).data as T;
  return d as T;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useIotDashboard(_params?: Record<string, unknown>) {
  return useQuery<IotDashboardSummary>({
    queryKey: ['iot', 'dashboard'],
    queryFn: () => api.get('/iot/dashboard').then(unwrap),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ── Devices ───────────────────────────────────────────────────────────────────

export function useIotDevices(params?: { status?: string; deviceType?: string; search?: string; page?: number }) {
  return useQuery<{ devices: IotDevice[]; total: number; page: number; totalPages: number }>({
    queryKey: ['iot', 'devices', params],
    queryFn: () => api.get('/iot/devices', { params }).then(unwrap),
    staleTime: 20_000,
  });
}

export function useIotDevice(id: string) {
  return useQuery<IotDevice & { alerts: IotAlert[]; otaJobs: OtaUpdateJob[] }>({
    queryKey: ['iot', 'device', id],
    queryFn: () => api.get(`/iot/devices/${id}`).then(unwrap),
    enabled: !!id,
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<IotDevice>) => api.post('/iot/devices', dto).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot', 'devices'] }),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<IotDevice> & { id: string }) =>
      api.put(`/iot/devices/${id}`, dto).then(unwrap),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['iot', 'devices'] });
      qc.invalidateQueries({ queryKey: ['iot', 'device', vars.id] });
    },
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/iot/devices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot', 'devices'] }),
  });
}

// ── Telemetry ─────────────────────────────────────────────────────────────────

export function useDeviceTelemetry(deviceId: string, params?: { metricKey?: string; from?: string; to?: string; limit?: number }) {
  return useQuery<IotTelemetry[]>({
    queryKey: ['iot', 'telemetry', deviceId, params],
    queryFn: () => api.get(`/iot/devices/${deviceId}/telemetry`, { params }).then(unwrap),
    enabled: !!deviceId,
    refetchInterval: 10_000,
  });
}

export function useLatestTelemetry(deviceId: string) {
  return useQuery<IotTelemetry[]>({
    queryKey: ['iot', 'telemetry', deviceId, 'latest'],
    queryFn: () => api.get(`/iot/devices/${deviceId}/telemetry/latest`).then(unwrap),
    enabled: !!deviceId,
    refetchInterval: 5_000,
  });
}

export function useIngestTelemetry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IotTelemetry> | Partial<IotTelemetry>[]) =>
      api.post('/iot/telemetry', data).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot', 'telemetry'] }),
  });
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export function useIotAlerts(params?: { status?: string; severity?: string; deviceId?: string }) {
  return useQuery<IotAlert[]>({
    queryKey: ['iot', 'alerts', params],
    queryFn: () => api.get('/iot/alerts', { params }).then(unwrap),
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/iot/alerts/${id}/acknowledge`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot', 'alerts'] }),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/iot/alerts/${id}/resolve`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot', 'alerts'] }),
  });
}

// ── OTA ───────────────────────────────────────────────────────────────────────

export function useOtaJobs(deviceId?: string) {
  return useQuery<OtaUpdateJob[]>({
    queryKey: ['iot', 'ota', deviceId],
    queryFn: () => api.get('/iot/ota', { params: { deviceId } }).then(unwrap),
    staleTime: 15_000,
  });
}

export function useCreateOtaJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<OtaUpdateJob>) => api.post('/iot/ota', dto).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot', 'ota'] }),
  });
}

// ── Billing Triggers ──────────────────────────────────────────────────────────

export function useIotBillingTriggers(invoiced?: boolean) {
  return useQuery<IotBillingTrigger[]>({
    queryKey: ['iot', 'billing-triggers', invoiced],
    queryFn: () =>
      api.get('/iot/billing-triggers', { params: invoiced !== undefined ? { invoiced: String(invoiced) } : {} }).then(unwrap),
    staleTime: 15_000,
  });
}

export function useAttachTriggersToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, customerId }: { invoiceId: string; customerId: string }) =>
      api.post(`/iot/billing-triggers/attach/${invoiceId}`, { customerId }).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['iot', 'billing-triggers'] }),
  });
}

// ── e-Tax ─────────────────────────────────────────────────────────────────────

export function useETaxSubmissions(period?: string) {
  return useQuery<ETaxSubmission[]>({
    queryKey: ['etax', 'submissions', period],
    queryFn: () =>
      api.get('/vat/etax-submissions', { params: period ? { period } : {} })
         .then((r: any) => {
           const d = r.data?.data ?? r.data;
           return Array.isArray(d) ? d : [];
         }),
    staleTime: 30_000,
  });
}

export function useSubmitVatReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { vatFilingId: string; payload: Record<string, unknown> }) => {
      const period = (data.payload as any).period as string;
      const res = await api.post('/tax/etax-submit', {
        period,
        vatFilingId: data.vatFilingId,
        vat: {
          StandardTaxableSalesETB:    (data.payload as any).totalSales    ?? 0,
          OutputVatCollectedETB:      (data.payload as any).outputVat     ?? 0,
          ZeroRatedSalesETB:          0,
          ExemptSalesETB:             0,
          TotalEligibleInputVatETB:   (data.payload as any).inputVat      ?? 0,
          NetVatPayableRefundableETB: (data.payload as any).netPayable    ?? 0,
        },
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ['etax', 'submissions'] });
      qc.invalidateQueries({ queryKey: ['vat'] });
      const ref = result?.ercaReferenceNo;
      if (ref) console.info(`[eTax] Accepted. MoR reference: ${ref}`);
    },
  });
}

export function useCheckETaxStatus() {
  return useMutation({
    mutationFn: (id: string) =>
      api.get(`/vat/etax-submissions/${id}`)
         .then((r: any) => r.data?.data ?? r.data),
  });
}

// ── IoT Tax Pipeline ──────────────────────────────────────────────────────────

export type IotTaxType = 'VAT_15' | 'TOT_GOODS_2' | 'TOT_SERVICES_10' | 'EXEMPT';

export type IotIndustryContext =
  | 'SMART_VENDING_RETAIL'
  | 'LOGISTICS_FLEET'
  | 'MANUFACTURING_AGRI'
  | 'ENERGY_UTILITY'
  | 'TELECOM_DIGITAL'
  | 'GENERAL';

export interface IotFiscalEvent {
  id: string;
  deviceId: string;
  companyId: string;
  billingTriggerId: string;
  grossAmount: number;
  taxAmount: number;
  taxType: IotTaxType;
  taxRate: number;
  netPayable: number;
  industryContext: IotIndustryContext;
  fiscalSignature: string;
  recordedAt: string;
  period: string;
  createdAt: string;
}

export interface IotTaxSummaryRow {
  taxType: IotTaxType;
  eventCount: number;
  totalGross: number;
  totalTax: number;
  totalNet: number;
}

export interface IotPipelineIngestResult {
  ingested: number;
  industryProcessing: Array<{
    metricKey: string;
    fuel: Record<string, unknown> | null;
    weight: Record<string, unknown> | null;
    retail: Record<string, unknown> | null;
  }>;
  note: string;
}

export interface SrmRegistrationResult {
  success: boolean;
  tassDeviceId: string | null;
  registrationCode: string | null;
  mode: 'live' | 'sandbox' | 'stub';
  warning?: string;
  registeredAt: string;
}

export interface SrmStatusResult {
  deviceSerialNo: string;
  tassDeviceId: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DECOMMISSIONED' | 'UNKNOWN';
  lastFiscalReportDate: string | null;
  fiscalMemoryUsedPct: number | null;
  source: 'live' | 'cache' | 'stub';
  fetchedAt: string;
  warning?: string;
}

export interface FiscalReceiptValidation {
  receiptNumber: string;
  valid: boolean;
  tin: string | null;
  businessName: string | null;
  issuedAt: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  fiscalSignature: string | null;
  source: 'live' | 'cache' | 'stub';
  warning?: string;
}

// Fiscal event log query
export function useIotFiscalEvents(period?: string) {
  return useQuery<IotFiscalEvent[]>({
    queryKey: ['iot', 'pipeline', 'fiscal', period],
    queryFn: () =>
      api.get('/iot/pipeline/fiscal', { params: period ? { period } : {} }).then(unwrap),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

// IoT tax summary for a period (feeds into MoR VAT return)
export function useIotTaxSummary(period: string) {
  return useQuery<IotTaxSummaryRow[]>({
    queryKey: ['iot', 'pipeline', 'tax-summary', period],
    queryFn: () => api.get(`/iot/pipeline/tax-summary/${period}`).then(unwrap),
    enabled: !!period,
    staleTime: 30_000,
  });
}

// Enriched ingest (auto-applies Ethiopian tax)
export function useIngestWithTax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IotTelemetry> | Partial<IotTelemetry>[]) =>
      api.post('/iot/pipeline/ingest', data).then(unwrap<IotPipelineIngestResult>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iot', 'pipeline', 'fiscal'] });
      qc.invalidateQueries({ queryKey: ['iot', 'billing-triggers'] });
    },
  });
}

// Manually re-apply tax to a billing trigger
export function useApplyTaxToTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (triggerId: string) =>
      api.post(`/iot/pipeline/apply-tax/${triggerId}`).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iot', 'pipeline', 'fiscal'] });
      qc.invalidateQueries({ queryKey: ['iot', 'billing-triggers'] });
    },
  });
}

// Register a device as a TASS SRM
export function useRegisterSrm() {
  return useMutation({
    mutationFn: (dto: {
      deviceId: string;
      deviceSerialNo: string;
      deviceModel: string;
      businessAddress: string;
      businessName: string;
      tin: string;
    }) => api.post('/iot/pipeline/register-srm', dto).then(unwrap<SrmRegistrationResult>),
  });
}

// Check SRM status
export function useSrmStatus(serialNo: string, enabled = false) {
  return useQuery<SrmStatusResult>({
    queryKey: ['iot', 'pipeline', 'srm-status', serialNo],
    queryFn: () => api.get(`/iot/pipeline/srm-status/${serialNo}`).then(unwrap),
    enabled: enabled && !!serialNo,
  });
}

// Validate ERCA fiscal receipt
export function useValidateFiscalReceipt() {
  return useMutation({
    mutationFn: (receiptNo: string) =>
      api.get(`/iot/pipeline/validate-receipt/${receiptNo}`).then(unwrap<FiscalReceiptValidation>),
  });
}

