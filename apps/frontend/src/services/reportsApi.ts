/**
 * Reports API Service
 * Covers:
 *   - IAS 12  Deferred Tax
 *   - IFRS 15 Revenue Recognition
 *   - AR/AP Aging + Dunning (IFRS 9 ECL)
 *   - IAS 1   Statement of Changes in Equity
 *   - IFRS 9  Expected Credit Loss (ECL)
 *   - IFRS 10 Group Consolidation
 *   - Configurable Approval Workflow
 *   - GRN (Goods Received Notes) + 3-Way Matching
 */
import { useFetchQuery } from '../hooks/useFetchQuery';

import api from './api';

// -- Types re-exported from @ovds/features/reporting ----------------------------
// New code should import types from '@ovds/features/reporting' directly.

// -- Helpers ------------------------------------------------------------------

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

const toArray = <T>(d: unknown): T[] => (Array.isArray(d) ? (d as T[]) : []);

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

export function useDeferredTax(companyId?: string, date?: string) {
  return useFetchQuery<DeferredTaxSummary>(
    `/ovds/reports/deferred-tax${qs({ companyId, date })}`,
    { deps: [companyId, date] },
  );
}

export async function postDeferredTaxEntry(companyId?: string, date?: string) {
  const res = await api.post('/ovds/reports/deferred-tax/post', { companyId, date });
  return res.data?.data ?? res.data;
}

// -- IAS 1 — Statement of Changes in Equity -----------------------------------

export interface EquityMovementRow {
  accountId:                string;
  accountCode:              string;
  accountName:              string;
  openingBalance:           number;
  netProfitForPeriod:       number;
  otherMovements:           number;
  dividendsPaid:            number;
  otherComprehensiveIncome: number;
  closingBalance:           number;
}

export interface EquityMovementStatement {
  startDate:    string;
  endDate:      string;
  companyId:    string;
  iasReference: string;
  accounts:     EquityMovementRow[];
  totals: {
    openingBalance:           number;
    netProfitForPeriod:       number;
    otherMovements:           number;
    dividendsPaid:            number;
    otherComprehensiveIncome: number;
    closingBalance:           number;
  };
  generatedAt:  string;
}

export function useEquityMovements(companyId?: string, startDate?: string, endDate?: string) {
  return useFetchQuery<EquityMovementStatement>(
    `/ovds/reports/changes-in-equity${qs({ companyId, startDate, endDate })}`,
    { deps: [companyId, startDate, endDate] },
  );
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
    grossReceivables:  number;
    totalEclProvision: number;
    netCarryingAmount: number;
    effectiveLossRate: string;
  };
  journalEntry: {
    description: string;
    debit:  { account: string; amount: number };
    credit: { account: string; amount: number };
  };
  generatedAt:   string;
}

export function useIfrs9Ecl(companyId?: string, date?: string) {
  return useFetchQuery<EclSummary>(
    `/ovds/reports/ecl${qs({ companyId, date })}`,
    { deps: [companyId, date] },
  );
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

export interface ScheduleMonthEntry {
  month: string;
  amount: number;
  invoices: number;
}

export interface RevenueSchedule {
  period: string;
  revenue: number;
  costs: number;
  margin: number;
  cumulativeRevenue: number;
  totalContractRevenue: number;
  recognisedToDate: number;
  deferredRevenue: number;
  contractLiabilities: number;
  overduePerformance: number;
  scheduleByMonth: ScheduleMonthEntry[];
  ifrsReference: string;
}

export interface Ifrs15ComplianceIssue {
  contractId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  criterion: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detail: string;
  issues?: string[];
}

export interface Ifrs15ComplianceCheck {
  contractId: string;
  passed: boolean;
  checks: Array<{
    criterion: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    detail: string;
  }>;
  overallCompliant: boolean;
  compliant: number;
  total: number;
  issues: Ifrs15ComplianceIssue[];
  nonCompliant: number;
}

export function useIfrs15Schedule(companyId?: string, date?: string) {
  return useFetchQuery<RevenueSchedule[] & {
    totalContractRevenue: number;
    recognisedToDate: number;
    deferredRevenue: number;
    contractLiabilities: number;
    overduePerformance: number;
    scheduleByMonth: ScheduleMonthEntry[];
    ifrsReference: string;
  }>(
    `/ovds/reports/ifrs15-schedule${qs({ companyId, date })}`,
    { deps: [companyId, date] },
  );
}

export function useIfrs15ComplianceCheck(companyId?: string) {
  return useFetchQuery<Ifrs15ComplianceCheck[] & {
    overallCompliant: boolean;
    compliant: number;
    total: number;
    issues: Ifrs15ComplianceIssue[];
    nonCompliant: number;
  }>(
    `/ovds/reports/ifrs15-compliance${qs({ companyId })}`,
    { deps: [companyId] },
  );
}

export async function getIfrs15Contract(invoiceId: string, companyId?: string): Promise<ContractAnalysis> {
  const { data } = await api.get(`/ovds/reports/ifrs15/contract/${invoiceId}${qs({ companyId })}`);
  return data?.data ?? data;
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
  stage: 'CURRENT' | 'OVERDUE';
  grossAmount: number;
  eclRate: number;
  eclProvision: number;
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
  collectionRate: number;
  totalGross: number;
  totalEcl: number;
  netCarrying: number;
  ifrsReference: string;
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
  actions: Array<{ invoiceId: string; action: DunningAction }>;
  emailed: number;
  escalated: number;
}

export function useArAgingFull(companyId?: string, date?: string) {
  return useFetchQuery<AgingReport>(
    `/ovds/reports/ar-aging${qs({ companyId, date })}`,
    { deps: [companyId, date] },
  );
}

export function useApAgingFull(companyId?: string, date?: string) {
  return useFetchQuery<AgingReport>(
    `/ovds/reports/ap-aging${qs({ companyId, date })}`,
    { deps: [companyId, date] },
  );
}

export async function runDunning(companyId?: string, dryRun = true): Promise<DunningResult> {
  const { data } = await api.post('/ovds/reports/dunning/run', { companyId, dryRun });
  return data?.data ?? data;
}

export async function postEclProvision(companyId?: string, date?: string) {
  const res = await api.post('/ovds/reports/ecl/post', { companyId, date });
  return res.data?.data ?? res.data;
}

// -- Approval Workflow ---------------------------------------------------------

export interface WorkflowLevel {
  level: number;
  approverRole: string;
  approvalType: 'REQUIRED' | 'OPTIONAL';
  requiredRole?: string;
  label?: string;
  timeoutHours?: number;
  minAmount?: number;
}

export interface WorkflowRule {
  id?: string;
  name: string;
  entity: string;
  resourceType?: string;
  condition: string;
  approverRole: string;
  escalationHours?: number;
  isActive: boolean;
  minAmount?: number;
  maxAmount?: number;
  rejectionPolicy?: 'REJECT' | 'RETURN' | 'NOTIFY' | 'STOP';
  levels: WorkflowLevel[];
}

export interface ApprovalLevel {
  level: number;
  approverId: string;
  approverRole?: string;
  requiredRole?: string;
  label?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ApprovalRequest {
  id: string;
  entityType: string;
  entityId: string;
  resourceId?: string;
  resourceType?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  requestedBy: string;
  approvedBy?: string;
  comments?: string;
  createdAt: string;
  amount?: number;
  notes?: string;
  levels: ApprovalLevel[];
  currentLevel: number;
}

export function useApprovalRules(companyId?: string) {
  const result = useFetchQuery<WorkflowRule[]>(
    companyId ? `/ovds/reports/approval-rules?companyId=${companyId}` : '',
    { enabled: !!companyId, deps: [companyId], select: toArray },
  );
  return { ...result, rules: result.data ?? [] };
}

export function usePendingApprovals(companyId?: string) {
  const result = useFetchQuery<ApprovalRequest[]>(
    companyId ? `/ovds/reports/approvals/pending?companyId=${companyId}` : '',
    { enabled: !!companyId, deps: [companyId], select: toArray },
  );
  return { ...result, requests: result.data ?? [] };
}

export async function approveRequest(requestId: string, companyId?: string, comments?: string) {
  const { data } = await api.post(`/ovds/reports/approvals/${requestId}/approve`, { companyId, comments });
  return data?.data ?? data;
}

export async function rejectRequest(requestId: string, reason: string, companyId?: string) {
  const { data } = await api.post(`/ovds/reports/approvals/${requestId}/reject`, { companyId, reason });
  return data?.data ?? data;
}

export async function seedApprovalRules(companyId?: string) {
  const { data } = await api.post('/ovds/reports/approval-rules/seed', { companyId });
  return data?.data ?? data;
}

export async function upsertApprovalRule(rule: Partial<WorkflowRule>, companyId?: string) {
  const { data } = await api.post('/ovds/reports/approval-rules', { ...rule, companyId });
  return data?.data ?? data;
}

// -- IFRS 10 — Group Consolidation ---------------------------------------------

export interface SubsidiaryEntry {
  entityId: string;
  entityName: string;
  companyId?: string;
  companyName?: string;
  ownershipPct: number;
  nciPct?: number;
  currency: string;
  fxRate?: number;
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
  amount?: number;
  debitAccount?: string;
  creditAccount?: string;
}

export interface ConsolidatedLineItem {
  accountCode: string;
  accountName: string;
  parentAmount: number;
  subsidiaryAmount: number;
  totalBeforeElim: number;
  eliminations: number;
  nciAllocation: number;
  consolidatedAmount: number;
}

interface ConsolidatedStatementSection {
  assets: ConsolidatedLineItem[];
  liabilities: ConsolidatedLineItem[];
  equity: ConsolidatedLineItem[];
  totalAssets: number;
  totalLiabAndEquity: number;
  nci: number;
  isBalanced: boolean;
}

interface ConsolidatedIncomeStatementSection {
  revenue: ConsolidatedLineItem[];
  expenses: ConsolidatedLineItem[];
  totalRevenue: number;
  totalExpenses: number;
  groupNetProfit: number;
  nciShareOfProfit: number;
  parentShareOfProfit: number;
}

export interface ConsolidatedStatements {
  asOf: string;
  companyId: string;
  companyName?: string;
  parentCompanyName?: string;
  period?: string;
  subsidiaries: SubsidiaryEntry[];
  eliminations: EliminationEntry[];
  eliminationSummary?: {
    gains: number;
    losses: number;
    totalIntercoSales: number;
    totalIntercoLoans: number;
    totalDividendsEliminated: number;
  };
  lines: ConsolidatedLineItem[];
  balanceSheet: ConsolidatedStatementSection;
  incomeStatement: ConsolidatedIncomeStatementSection;
  disclosures?: Array<Record<string, unknown>>;
  ifrsReference?: string;
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
    revenue: number;
    expenses: number;
    netIncome: number;
  };
}

export function useConsolidation(companyId?: string, asOf?: string, startDate?: string, endDate?: string) {
  return useFetchQuery<ConsolidatedStatements>(
    `/ovds/reports/consolidation${qs({ companyId, asOf, startDate, endDate })}`,
    { deps: [companyId, asOf, startDate, endDate] },
  );
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

export interface GrnStats {
  total: number;
  matched: number;
  discrepancy: number;
  pending: number;
}

export function useGrns(params: { companyId?: string; status?: string } = {}) {
  return useFetchQuery<Grn[]>(
    `/ovds/reports/grns${qs({ companyId: params.companyId, status: params.status })}`,
    {
      // Stringify params so the URL updates when object identity changes
      deps: [params.companyId, params.status],
      select: toArray,
    },
  );
}

export function useGrnStats(companyId?: string) {
  return useFetchQuery<GrnStats>(
    companyId ? `/ovds/reports/grns/stats?companyId=${companyId}` : '',
    { enabled: !!companyId, deps: [companyId] },
  );
}

export async function confirmGrn(id: string): Promise<Grn> {
  const { data } = await api.post(`/ovds/reports/grns/${id}/confirm`);
  return data?.data ?? data;
}

export async function deleteGrn(id: string): Promise<void> {
  await api.delete(`/ovds/reports/grns/${id}`);
}

export async function linkBillToGrn(id: string, billId: string): Promise<ThreeWayMatchResult> {
  const { data } = await api.post(`/ovds/reports/grns/${id}/link-bill`, { billId });
  return data?.data ?? data;
}

export async function runThreeWayMatch(id: string): Promise<ThreeWayMatchResult> {
  const { data } = await api.get(`/ovds/reports/grns/${id}/three-way-match`);
  return data?.data ?? data;
}
