/**
 * MoR Portal API Service
 *
 * Client-side API calls for all Ethiopian Ministry of Revenues (MoR) integrations:
 *   - TASS portal: SRM device management, vehicle tax verification, receipt validation
 *   - ECC Customs Trade Portal: HS tariff lookup, import tax simulator, e-SAD, e-Manifest
 *   - Schedule D: other income final tax filings
 *   - Graduate Tax: higher education cost-sharing deductions
 *   - Net Tax Report: consolidated MoR net payable report
 *   - International Tax: foreign credit, thin cap, transfer pricing, loss carry-forward
 *
 * Base URL: /ovds/mor
 */
import api from './api';

const extractData = (res: any) => res.data?.data ?? res.data;

// ── Utilities ─────────────────────────────────────────────────────────────────

/** GET /ovds/mor/portals — all government portal deep-links */
export const getPortalLinks = () =>
  api.get('/ovds/mor/portals').then(extractData);

// ══════════════════════════════════════════════════════════════════════════════
// TASS — Tax Administration Support System (tass.mor.gov.et)
// ══════════════════════════════════════════════════════════════════════════════

export const tassApi = {
  /** Register an SRM device with TASS (MoR mandatory — ETB 50,000 penalty if unregistered) */
  registerSrm: (dto: {
    deviceSerialNo: string;
    deviceModel: string;
    businessAddress: string;
    businessName: string;
    tin: string;
  }) => api.post('/ovds/mor/tass/srm/register', dto).then(extractData),

  /** List all SRM devices registered for the current company */
  listSrms: () =>
    api.get('/ovds/mor/tass/srm').then(extractData),

  /** Live SRM status from TASS (fiscal memory, last Z-report, suspension status) */
  getSrmStatus: (serial: string, force = false) =>
    api.get(`/ovds/mor/tass/srm/${encodeURIComponent(serial)}/status`, {
      params: { force },
    }).then(extractData),

  /** Vehicle annual tax payment verification (required for registration renewal) */
  verifyVehicleTax: (plateNumber: string, force = false) =>
    api.get(`/ovds/mor/tass/vehicle/${encodeURIComponent(plateNumber)}`, {
      params: { force },
    }).then(extractData),

  /** Submit a tax declaration via TASS (alternative to MoR e-Tax portal) */
  submitDeclaration: (dto: {
    tin: string;
    declarationType: 'VAT' | 'PAYE' | 'WHT' | 'TOT' | 'DRRF' | 'BIT';
    period: string;
    taxAmount: number;
    taxableAmount: number;
    paymentReference?: string;
  }) => api.post('/ovds/mor/tass/declaration', dto).then(extractData),

  /** Validate an ERCA fiscal receipt number (for AP input VAT credit verification) */
  validateReceipt: (receiptNumber: string, force = false) =>
    api.post('/ovds/mor/tass/receipt/validate', { receiptNumber, force }).then(extractData),
};

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMS — Ethiopia Customs Trade Portal (trade.gov.et)
// ══════════════════════════════════════════════════════════════════════════════

export const customsApi = {
  /** HS code tariff lookup — duty rates, excise, surtax eligibility */
  lookupHs: (hsCode: string) =>
    api.get(`/ovds/mor/customs/hs/${encodeURIComponent(hsCode)}`).then(extractData),

  /** Import tax simulator — full burden: customs + excise + surtax + VAT + advance BIT */
  simulate: (dto: {
    hsCode: string;
    cifValueUsd: number;
    exchangeRate: number;
    isCapitalGoods?: boolean;
    comesaOrigin?: boolean;
    quantity?: number;
    scheduleCtaxpayer?: boolean;
  }) => api.post('/ovds/mor/customs/simulate', dto).then(extractData),

  // ── e-SAD Declarations ────────────────────────────────────────────────────

  /** Create customs declaration (auto-calculates full tax burden via HS simulator) */
  createDeclaration: (dto: {
    importerExporterName: string;
    importerTin?: string;
    declarationType?: 'IMPORT' | 'EXPORT' | 'TRANSIT';
    originCountry?: string;
    portOfEntry?: string;
    hsCode?: string;
    goodsDescription?: string;
    quantity?: number;
    unit?: string;
    cifValueUsd: number;
    exchangeRate: number;
    isCapitalGoods?: boolean;
    comesaPreferential?: boolean;
    scheduleCtaxpayer?: boolean;
    shipmentId?: string;
    notes?: string;
  }) => api.post('/ovds/mor/customs/declarations', dto).then(extractData),

  /** List customs declarations */
  listDeclarations: (status?: string) =>
    api.get('/ovds/mor/customs/declarations', { params: { status } }).then(extractData),

  /** Get a single customs declaration */
  getDeclaration: (id: string) =>
    api.get(`/ovds/mor/customs/declarations/${id}`).then(extractData),

  /** Submit declaration as e-SAD to ECC Customs Trade Portal */
  submitESad: (id: string) =>
    api.post(`/ovds/mor/customs/declarations/${id}/submit`).then(extractData),

  /** Mark customs duties as paid */
  markPaid: (id: string, paymentReference: string) =>
    api.patch(`/ovds/mor/customs/declarations/${id}/pay`, { paymentReference }).then(extractData),

  /** Mark goods as customs cleared */
  markCleared: (id: string) =>
    api.patch(`/ovds/mor/customs/declarations/${id}/clear`).then(extractData),

  // ── e-Manifests ───────────────────────────────────────────────────────────

  /** Create e-Manifest for cargo arrival */
  createManifest: (dto: {
    vehicleRef: string;
    transportMode?: 'SEA' | 'AIR' | 'LAND';
    portOfArrival?: string;
    arrivalDate?: string;
    totalBillsOfLading?: number;
    totalWeight?: number;
    notes?: string;
  }) => api.post('/ovds/mor/customs/manifests', dto).then(extractData),

  /** List e-Manifests */
  listManifests: () =>
    api.get('/ovds/mor/customs/manifests').then(extractData),

  /** Submit e-Manifest to ECC Customs Trade Portal */
  submitManifest: (id: string) =>
    api.post(`/ovds/mor/customs/manifests/${id}/submit`).then(extractData),
};

// ══════════════════════════════════════════════════════════════════════════════
// SCHEDULE D — Other Income Final Tax (Proclamation 1395/2025)
// ══════════════════════════════════════════════════════════════════════════════

export type ScheduleDTaxTypeStr =
  | 'DIVIDEND' | 'INTEREST_SAVINGS' | 'INTEREST_STANDARD'
  | 'CAPITAL_GAINS_CLASS_A' | 'CAPITAL_GAINS_CLASS_B'
  | 'ROYALTY_ARTISTIC' | 'ROYALTY_TECHNICAL' | 'DIGITAL_CONTENT'
  | 'GAMES_OF_CHANCE' | 'CASUAL_RENTAL' | 'REPATRIATED_PROFIT'
  | 'UNDISTRIBUTED_PROFIT' | 'MANAGEMENT_FEES' | 'TECHNICAL_FEES' | 'WINDFALL_PROFIT';

export const scheduleDApi = {
  /** Create Schedule D filing (tax auto-calculated) */
  create: (dto: {
    taxType: ScheduleDTaxTypeStr;
    period: string;
    transactionDate?: string;
    recipientName?: string;
    recipientTin?: string;
    grossAmount: number;
    acquisitionCost?: number;
    disposalProceeds?: number;
    withheldAtSource?: boolean;
    notes?: string;
  }) => api.post('/ovds/mor/schedule-d', dto).then(extractData),

  /** List Schedule D filings */
  list: (params?: { period?: string; taxType?: string; status?: string }) =>
    api.get('/ovds/mor/schedule-d', { params }).then(extractData),

  /** Record payment to ERCA */
  recordPayment: (id: string, dto: {
    paymentReference: string;
    paidAt?: string;
    ercaReference?: string;
  }) => api.patch(`/ovds/mor/schedule-d/${id}/pay`, dto).then(extractData),

  /** Period summary by tax type */
  periodSummary: (period: string) =>
    api.get(`/ovds/mor/schedule-d/period/${period}`).then(extractData),

  /** Download Schedule D CSV for MoR submission */
  exportCsv: (period: string) =>
    api.get(`/ovds/mor/schedule-d/export/${period}`, { responseType: 'blob' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// GRADUATE TAX — Higher Education Cost Sharing (Reg. 154/2008)
// ══════════════════════════════════════════════════════════════════════════════

export const graduateTaxApi = {
  /** Register a graduate employee for cost-sharing deductions (≥10% monthly) */
  register: (dto: {
    employeeId?: string;
    employeeName: string;
    employeeTin?: string;
    institution: string;
    institutionRef?: string;
    totalOwed: number;
    monthlyDeduction: number;
    deductionStartDate?: string;
  }) => api.post('/ovds/mor/graduate-tax/register', dto).then(extractData),

  /** List graduate tax employees */
  list: (status?: 'ACTIVE' | 'COMPLETED' | 'TERMINATED') =>
    api.get('/ovds/mor/graduate-tax', { params: { status } }).then(extractData),

  /** Apply monthly deduction for a graduate employee */
  applyDeduction: (id: string, dto: {
    period: string;
    monthlySalary: number;
    payrollRecordId?: string;
  }) => api.post(`/ovds/mor/graduate-tax/${id}/deduct`, dto).then(extractData),

  /** Mark graduate tax deductions as remitted to ERCA for a period */
  markRemitted: (period: string, ercaReference: string) =>
    api.post(`/ovds/mor/graduate-tax/remit/${period}`, { ercaReference }).then(extractData),

  /** Period summary — for inclusion in PAYE declaration */
  periodSummary: (period: string) =>
    api.get(`/ovds/mor/graduate-tax/summary/${period}`).then(extractData),

  /** Download CSV for ERCA remittance */
  exportCsv: (period: string) =>
    api.get(`/ovds/mor/graduate-tax/export/${period}`, { responseType: 'blob' }),

  /** Generate termination statement (required when employee leaves) */
  terminationSummary: (id: string) =>
    api.post(`/ovds/mor/graduate-tax/${id}/terminate`).then(extractData),
};

// ══════════════════════════════════════════════════════════════════════════════
// NET TAX PAYABLE REPORT — Consolidated MoR Submission
// ══════════════════════════════════════════════════════════════════════════════

export const netTaxReportApi = {
  /** Generate consolidated net tax payable report (all taxes in one view) */
  generate: (period: string) =>
    api.post(`/ovds/mor/net-report/generate/${period}`).then(extractData),

  /** Get report for a period */
  getReport: (period: string) =>
    api.get(`/ovds/mor/net-report/${period}`).then(extractData),

  /** List all reports */
  listReports: (year?: number) =>
    api.get('/ovds/mor/net-report', { params: { year } }).then(extractData),

  /** Year-to-date consolidated tax summary */
  ytdSummary: (year: number) =>
    api.get(`/ovds/mor/net-report/ytd/${year}`).then(extractData),

  /** Finalise and mark as submitted to MoR */
  submit: (period: string, ercaReferenceNo: string) =>
    api.post(`/ovds/mor/net-report/${period}/submit`, { ercaReferenceNo }).then(extractData),

  /** Download MoR JSON payload for audit / manual upload */
  exportPayload: (period: string) =>
    api.get(`/ovds/mor/net-report/export/${period}`, { responseType: 'blob' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// INTERNATIONAL TAX — Sections 20, 25 of Tax Compliance Guide
// ══════════════════════════════════════════════════════════════════════════════

export const intlTaxApi = {
  // ── Foreign Tax Credit (Section 20.1) ─────────────────────────────────────

  createForeignTaxCredit: (dto: {
    taxYear: number;
    foreignCountry: string;
    foreignIncome: number;
    foreignTaxPaid: number;
    foreignTaxReceiptRef?: string;
    receiptDate?: string;
    notes?: string;
  }) => api.post('/ovds/mor/international/foreign-tax-credit', dto).then(extractData),

  listForeignTaxCredits: (taxYear?: number) =>
    api.get('/ovds/mor/international/foreign-tax-credit', { params: { taxYear } }).then(extractData),

  applyForeignTaxCredit: (id: string, incomeTaxFilingId: string) =>
    api.patch(`/ovds/mor/international/foreign-tax-credit/${id}/apply`, { incomeTaxFilingId }).then(extractData),

  // ── Thin Capitalisation (Section 20.3) ────────────────────────────────────

  assessThinCap: (dto: {
    taxYear: number;
    averageDebt: number;
    averageEquity: number;
    totalInterestExpense: number;
    armsLengthDebt?: number;
    foreignControlled: boolean;
    notes?: string;
  }) => api.post('/ovds/mor/international/thin-cap', dto).then(extractData),

  thinCapHistory: () =>
    api.get('/ovds/mor/international/thin-cap').then(extractData),

  // ── Transfer Pricing (Section 20.5) ───────────────────────────────────────

  createTpRecord: (dto: {
    taxYear: number;
    relatedPartyName: string;
    relatedPartyCountry?: string;
    relatedPartyTin?: string;
    transactionType: string;
    transactionAmount: number;
    transferPrice: number;
    pricingMethod?: string;
    armsLengthPrice?: number;
    documentationStatus?: 'DOCUMENTED' | 'PARTIAL' | 'MISSING';
    documentationRef?: string;
    notes?: string;
  }) => api.post('/ovds/mor/international/transfer-pricing', dto).then(extractData),

  listTpRecords: (taxYear?: number) =>
    api.get('/ovds/mor/international/transfer-pricing', { params: { taxYear } }).then(extractData),

  tpComplianceSummary: (taxYear: number) =>
    api.get(`/ovds/mor/international/transfer-pricing/compliance/${taxYear}`).then(extractData),

  // ── Tax Loss Carry Forward (Section 25) ───────────────────────────────────

  recordTaxLoss: (dto: {
    lossYear: number;
    lossAmount: number;
    booksAudited: boolean;
    externalAuditor?: string;
    notes?: string;
  }) => api.post('/ovds/mor/international/tax-loss', dto).then(extractData),

  getLossSchedule: () =>
    api.get('/ovds/mor/international/tax-loss').then(extractData),

  applyLossCarryForward: (dto: {
    taxYear: number;
    taxableIncome: number;
    incomeTaxFilingId: string;
  }) => api.post('/ovds/mor/international/tax-loss/apply', dto).then(extractData),

  expireOldLosses: () =>
    api.post('/ovds/mor/international/tax-loss/expire').then(extractData),

  // ── Tax Clearance (Section 23) ────────────────────────────────────────────

  requestClearance: (dto: {
    purpose: 'LICENCE_RENEWAL' | 'PUBLIC_TENDER' | 'BANK_LOAN' | 'VEHICLE_REGISTRATION'
           | 'ASSET_TRANSFER' | 'BUSINESS_CLOSURE' | 'SHARE_TRANSFER' | 'OTHER';
    purposeDescription?: string;
  }) => api.post('/ovds/mor/international/clearance', dto).then(extractData),

  listClearanceRequests: () =>
    api.get('/ovds/mor/international/clearance').then(extractData),

  updateClearanceStatus: (id: string, dto: {
    status: string;
    clearanceRef?: string;
    issueDate?: string;
    validityMonths?: number;
    rejectionReason?: string;
    notes?: string;
  }) => api.patch(`/ovds/mor/international/clearance/${id}`, dto).then(extractData),
};

// ── Convenience: export everything as a single object ─────────────────────────

export const morApi = {
  getPortalLinks,
  tass:        tassApi,
  customs:     customsApi,
  scheduleD:   scheduleDApi,
  graduateTax: graduateTaxApi,
  netReport:   netTaxReportApi,
  intlTax:     intlTaxApi,
};

export default morApi;
