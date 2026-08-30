/**
 * tradeApi — Typed API client for the Trade module
 * Covers: Shipments, Steps, Forex, Proformas, Licenses, Dashboard
 * Portal integrations: ESLSE, EAL Cargo, Cheche, EBP, verify.leul.et
 */
import api, { apiGet } from './api';

const d = (res: any) => res?.data?.data ?? res?.data ?? res;

// -- Types ---------------------------------------------------------------------

export interface TradeShipmentStep {
  id: string;
  stepKey: string;
  stepLabel: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  notes?: string | null;
  metadata?: any;
  completedAt?: string | null;
  completedBy?: string | null;
  createdAt: string;
}

export interface TradeShipment {
  id: string;
  direction: 'IMPORT' | 'EXPORT';
  referenceNo: string;
  hsCode?: string | null;
  hsDescription?: string | null;
  goodsDescription?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  incoterms?: string | null;
  invoiceValue: number;
  currencyCode: string;
  status: string;
  notes?: string | null;
  companyId: string;
  createdBy: string;
  createdAt: string;
  steps: TradeShipmentStep[];
  documents?: any[];
  forexApprovals?: any[];
}

export interface CreateShipmentDto {
  direction: 'IMPORT' | 'EXPORT';
  referenceNo?: string;
  hsCode?: string;
  hsDescription?: string;
  goodsDescription?: string;
  originCountry?: string;
  destinationCountry?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  incoterms?: string;
  invoiceValue?: number;
  currencyCode?: string;
  notes?: string;
}

export interface TradeDashboard {
  imports: number;
  exports: number;
  proformas: number;
  licenses: number;
  inTransit: number;
  recentShipments: TradeShipment[];
}

// -- Portal result types -------------------------------------------------------

export interface EslseResult {
  blNumber: string;
  status: string | null;
  vessel: string | null;
  eta: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  containerCount: number | null;
  lastEvent: string | null;
  source: 'live' | 'cache' | 'stub';
  fetchedAt: string;
  warning?: string;
}

export interface EalCargoResult {
  awbNumber: string;
  status: string | null;
  origin: string | null;
  destination: string | null;
  weight: number | null;
  pieces: number | null;
  lastEvent: string | null;
  lastEventDate: string | null;
  source: 'live' | 'cache' | 'stub';
  fetchedAt: string;
  warning?: string;
}

export interface ChequePermitResult {
  referenceNo: string;
  permitType: string | null;
  status: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  applicant: string | null;
  amount: number | null;
  source: 'live' | 'cache' | 'stub';
  fetchedAt: string;
  warning?: string;
}

export interface EbpResult {
  tin: string;
  businessName: string | null;
  registrationStatus: string | null;
  vatRegistered: boolean | null;
  vatStatus: string | null;
  businessType: string | null;
  registrationDate: string | null;
  source: 'live' | 'cache' | 'stub';
  fetchedAt: string;
  warning?: string;
}

export interface LeulVerifyResult {
  reference: string;
  verified: boolean;
  amount: number | null;
  paidAt: string | null;
  payer: string | null;
  receiver: string | null;
  bank: string | null;
  source: 'live' | 'cache' | 'stub';
  fetchedAt: string;
  warning?: string;
}

// -- Shipments -----------------------------------------------------------------

export const shipmentsApi = {
  list: (direction?: string) =>
    apiGet<TradeShipment[]>(`/trade/shipments${direction ? `?direction=${direction}` : ''}`),
  get: (id: string) => apiGet<TradeShipment>(`/trade/shipments/${id}`),
  create: (dto: CreateShipmentDto) => api.post('/trade/shipments', dto).then(d),
  updateStatus: (id: string, status: string) =>
    api.patch(`/trade/shipments/${id}/status`, { status }).then(d),
  track: (id: string, mode?: string, force?: boolean) =>
    apiGet<EslseResult | EalCargoResult>(
      `/trade/shipments/${id}/track${mode ? `?mode=${mode}` : ''}${force ? '&force=true' : ''}`,
    ),
};

// -- Steps ---------------------------------------------------------------------

export const stepsApi = {
  update: (stepId: string, dto: { status?: string; notes?: string; metadata?: any }) =>
    api.patch(`/trade/steps/${stepId}`, dto).then(d),
};

// -- Forex ---------------------------------------------------------------------

export const forexApi = {
  create: (shipmentId: string, dto: any) =>
    api.post(`/trade/shipments/${shipmentId}/forex`, dto).then(d),
  approve: (forexId: string, approvalRef: string) =>
    api.patch(`/trade/forex/${forexId}/approve`, { approvalRef }).then(d),
};

// -- Proformas -----------------------------------------------------------------

export const proformasApi = {
  list:      (companyId?: string) => apiGet<any[]>(`/trade/proformas${companyId ? `?companyId=${companyId}` : ''}`),
  get:       (id: string) => apiGet<any>(`/trade/proformas/${id}`),
  create:    (dto: any) => api.post('/trade/proformas', dto).then(d),
  update:    (id: string, dto: any) => api.patch(`/trade/proformas/${id}`, dto).then(d),
  remove:    (id: string) => api.delete(`/trade/proformas/${id}`).then(d),
  duplicate: (id: string) => api.post(`/trade/proformas/${id}/duplicate`, {}).then(d),
  submit:    (id: string) => api.patch(`/trade/proformas/${id}`, { status: 'SUBMITTED' }).then(d),
};

// -- Licenses -----------------------------------------------------------------

export const licensesApi = {
  list: () => apiGet<any[]>('/trade/licenses'),
};

// -- Dashboard -----------------------------------------------------------------

export const tradeDashboardApi = {
  get: () => apiGet<TradeDashboard>('/trade/dashboard'),
};

// -- Portal integrations -------------------------------------------------------

export const portalsApi = {
  eslse: (blNumber: string, force?: boolean) =>
    apiGet<EslseResult>(
      `/trade/portals/eslse/${encodeURIComponent(blNumber)}${force ? '?force=true' : ''}`,
    ),
  ealCargo: (awbNumber: string, force?: boolean) =>
    apiGet<EalCargoResult>(
      `/trade/portals/eal-cargo/${encodeURIComponent(awbNumber)}${force ? '?force=true' : ''}`,
    ),
  cheche: (referenceNo: string, force?: boolean) =>
    apiGet<ChequePermitResult>(
      `/trade/portals/cheche/${encodeURIComponent(referenceNo)}${force ? '?force=true' : ''}`,
    ),
  ebp: (tin: string, force?: boolean) =>
    apiGet<EbpResult>(
      `/trade/portals/ebp/${encodeURIComponent(tin)}${force ? '?force=true' : ''}`,
    ),
  leulVerify: (reference: string, force?: boolean) =>
    apiGet<LeulVerifyResult>(
      `/trade/portals/leul-verify/${encodeURIComponent(reference)}${force ? '?force=true' : ''}`,
    ),
};

