/**
 * @ovds/features/reporting types
 *
 * Shared TypeScript interfaces for the reporting domain.
 */

// -- Reconciliation Projections (Peachtree / SigTax / IFRS) --------------------

export type ProjectionEngine = 'PEACHTREE' | 'SIGTAX' | 'IFRS';

export type ReconciliationAdjustmentCode =
  | 'NON_DEDUCTIBLE_EXPENSE'
  | 'LEASE_ROU'
  | 'IFRS15_ADJ'
  | 'IFRS16_ADJ'
  | 'IAS38_ADJ'
  | 'INTERCO_ELIMINATION'
  | 'TAX_TIMING_DIFF'
  | 'DEFERRED_TAX'
  | 'NCI_ALLOCATION'
  | 'DEFAULT';

export interface ProjectionJournalRow {
  id: string;
  canonicalJournalEntryId: string;
  companyId: string;
  projectionEngine: ProjectionEngine;
  adjustedDebit: number;
  adjustedCredit: number;
  reconciliationAdjustmentCode: ReconciliationAdjustmentCode;
  reconciledAt: string;
  journalEntry?: {
    date: string;
    description: string;
  };
}

export interface IfrsReportingBalanceRow {
  id: string;
  companyId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  period: string;
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  projectionEngine: ProjectionEngine;
  reconciledAt: string;
}

// -- IAS 12 — Deferred Tax -----------------------------------------------------

export interface TemporaryDifference {
  source:          string;
  assetId?:        string;
  carryingAmount:  number;
  taxBase:         number;
  difference:      number;
  type:            'TAXABLE' | 'DEDUCTIBLE';
  deferredTax:     number;
  deferredTaxType: 'DTA' | 'DTL';
  reversalPeriod?: string;
  notes?:          string;
}

export interface DeferredTaxSummary {
  companyId:          string;
  asOf:               string;
  taxRate:            number;
  differences:        TemporaryDifference[];
  totalDta:           number;
  totalDtl:           number;
  netDeferredTax:     number;
  netPosition:        'NET_DTA' | 'NET_DTL' | 'ZERO';
  recognitionAssessment: {
    dtaRecognisable:     boolean;
    rationale:           string;
    profitabilityScore:  number;
  };
  journalEntry?: {
    debitAccount:   string;
    creditAccount:  string;
    amount:         number;
    description:    string;
  };
  ifrsReference:  string;
  generatedAt:    string;
}

// -- IAS 1 — Statement of Changes in Equity -----------------------------------

export interface EquityMovementRow {
  accountId:           string;
  accountCode:         string;
  accountName:         string;
  openingBalance:      number;
  netProfitForPeriod:  number;
  otherMovements:      number;
  dividendsPaid:       number;
  otherComprehensiveIncome: number;
  closingBalance:      number;
}

export interface EquityMovementStatement {
  startDate:    string;
  endDate:      string;
  companyId:    string;
  iasReference: string;
  accounts:     EquityMovementRow[];
  totals: {
    openingBalance:      number;
    netProfitForPeriod:  number;
    otherMovements:      number;
    dividendsPaid:       number;
    otherComprehensiveIncome: number;
    closingBalance:      number;
  };
  generatedAt:  string;
}

// -- IFRS 9 — Expected Credit Loss --------------------------------------------

export interface EclBucket {
  label:        string;
  stage:        1 | 2 | 3;
  rate:         string;
  grossAmount:  number;
  eclProvision: number;
  invoiceCount: number;
}

export interface EclSummary {
  asOf:          string;
  companyId:     string;
  ifrsReference: string;
  approach:      string;
  buckets:       EclBucket[];
  stageSummary:  Array<{
    stage:        number;
    description:  string;
    grossAmount:  number;
    eclProvision: number;
    invoiceCount: number;
  }>;
  totals: {
    grossReceivables: number;
    totalEclProvision:number;
    netCarryingAmount:number;
    effectiveLossRate:string;
  };
  journalEntry: {
    description: string;
    debit:  { account: string; amount: number };
    credit: { account: string; amount: number };
  };
  generatedAt:   string;
}

// -- IFRS 15 — Revenue Recognition --------------------------------------------

export interface PerformanceObligation {
  id: string;
  description: string;
  type: 'GOOD' | 'SERVICE' | 'DIGITAL' | 'WARRANTY' | 'OTHER';
  standalonePrice: number;
  allocatedPrice: number;
  timing: 'POINT' | 'OVER';
  satisfactionMethod: string;
}

export interface ContractAnalysis {
  contractId: string;
  totalContractValue: number;
  performanceObligations: PerformanceObligation[];
  transactionPrice: number;
  remainingSatisfaction: number;
  recommendations: string[];
}

export interface RevenueSchedule {
  period: string;
  revenue: number;
  costs: number;
  margin: number;
  cumulativeRevenue: number;
}

export interface Ifrs15ComplianceCheck {
  contractId: string;
  passed: boolean;
  checks: Array<{
    criterion: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    detail: string;
  }>;
}

// -- AR/AP Aging + Dunning -----------------------------------------------------

export interface AgingItem {
  invoiceId: string;
  invoiceNo: string;
  customerId?: string;
  vendorId?: string;
  dueDate: string;
  invoiceDate: string;
  total: number;
  currency: string;
  buckets: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    days120: number;
    over120: number;
  };
}

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  amount: number;
  count: number;
}

export interface AgingReport {
  asOf: string;
  companyId: string;
  currency: string;
  buckets: AgingBucket[];
  items: AgingItem[];
  totals: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    days120: number;
    over120: number;
    total: number;
  };
}

export interface DunningAction {
  id: string;
  type: 'EMAIL' | 'SMS' | 'LETTER' | 'LEGAL';
  template?: string;
  triggerDays: number;
}

export interface DunningResult {
  processed: number;
  skipped: number;
  errors: string[];
  actions: Array<{
    invoiceId: string;
    action: DunningAction;
  }>;
}

// -- Approval Workflow ---------------------------------------------------------

export interface WorkflowRule {
  id?: string;
  name: string;
  entity: string;
  condition: string;
  approverRole: string;
  escalationHours?: number;
  isActive: boolean;
}

export interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  requestedBy: string;
  approvedBy?: string;
  comments?: string;
  createdAt: string;
}

// -- IFRS 10 — Group Consolidation ---------------------------------------------

export interface SubsidiaryEntry {
  entityId: string;
  entityName: string;
  ownershipPct: number;
  currency: string;
  assets: number;
  liabilities: number;
  revenue: number;
  netIncome: number;
}

export interface EliminationEntry {
  type: 'INTERCOMPANY' | 'DIVIDEND' | 'GOODWILL';
  account: string;
  debit: number;
  credit: number;
  description: string;
}

export interface ConsolidatedLineItem {
  accountCode: string;
  accountName: string;
  parentAmount: number;
  subsidiaryAmount: number;
  eliminationAmount: number;
  consolidatedAmount: number;
}

export interface ConsolidatedStatements {
  asOf: string;
  companyId: string;
  subsidiaries: SubsidiaryEntry[];
  eliminations: EliminationEntry[];
  lines: ConsolidatedLineItem[];
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    revenue: number;
    expenses: number;
    netIncome: number;
  };
  incomeStatement?: any;
  balanceSheet?: any;
}

// -- GRN + 3-Way Match ---------------------------------------------------------

export interface GrnItem {
  id?: string;
  poItemId?: string;
  itemId: string;
  itemName?: string;
  orderedQty: number;
  receivedQty: number;
  unit?: string;
  unitPrice?: number;
  notes?: string;
}

export interface Grn {
  id?: string;
  poId: string;
  vendorId: string;
  receivedAt: string;
  receivedBy: string;
  items: GrnItem[];
  status: 'DRAFT' | 'SUBMITTED' | 'MATCHED' | 'DISCREPANCY';
  discrepancyNotes?: string;
}

export interface GrnStats {
  total: number;
  matched: number;
  discrepancy: number;
  pending: number;
}

export interface ThreeWayMatchResult {
  poId: string;
  grnId?: string;
  invoiceId?: string;
  matched: boolean;
  discrepancies: Array<{
    field: string;
    poValue: any;
    grnValue: any;
    invoiceValue: any;
  }>;
}

// -- Report Template / Scheduling ----------------------------------------------

export type AccountingBasis = 'accrual' | 'cash';
export type ExportFormat = 'pdf' | 'csv' | 'xlsx';
export type ScheduleFrequency = 'weekly' | 'monthly' | 'yearly';
export type ReportCategory = 'standard' | 'modular';
export type ReportStatus = 'draft' | 'running' | 'completed' | 'failed';

export interface ReportPeriod {
  start: string;
  end: string;
}

export interface ReportConfig {
  reportId: string;
  basis: AccountingBasis;
  period: ReportPeriod;
  groupBy?: string;
  currency?: string;
}

export interface KpiCell {
  label: string;
  value: string | number;
  color?: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface ReportRow {
  [key: string]: unknown;
}

export interface NormalizedReport {
  reportId: string;
  companyId: string;
  currency: string;
  generatedAt: string;
  basis: AccountingBasis;
  period: ReportPeriod;
  kpis: KpiCell[];
  columns: ReportColumn[];
  rows: ReportRow[];
  raw: unknown;
}

export interface ReportTemplate {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  icon: string;
  permission: string;
  basisSupported: AccountingBasis[];
  endpoint: string;
  groupByOptions: string[];
}

export interface ScheduleEntry {
  id: string;
  name: string;
  reportId: string;
  format: ExportFormat;
  frequency: ScheduleFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  email: string;
  active: boolean;
  lastRun?: string;
  nextRun?: string;
}

export const REPORT_CATEGORIES = ['standard', 'modular'] as const;
