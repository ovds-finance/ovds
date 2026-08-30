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
import { useState, useEffect, useCallback } from 'react';
import api from './api';

// -- Types re-exported from @ovds/features/reporting ----------------------------
// New code should import types from '@ovds/features/reporting' directly.

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
  const [data, setData] = useState<DeferredTaxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      if (date) q.set('date', date);
      const res = await api.get(
        `/ovds/reports/deferred-tax${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export async function postDeferredTaxEntry(companyId?: string, date?: string) {
  const res = await api.post('/ovds/reports/deferred-tax/post', { companyId, date });
  return res.data?.data ?? res.data;
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

export function useEquityMovements(
  companyId?: string,
  startDate?: string,
  endDate?: string,
) {
  const [data, setData] = useState<EquityMovementStatement | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      if (startDate) q.set('startDate', startDate);
      if (endDate)   q.set('endDate',   endDate);
      const res = await api.get(
        `/ovds/reports/changes-in-equity${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, startDate, endDate]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
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

export function useIfrs9Ecl(companyId?: string, date?: string) {
  const [data, setData] = useState<EclSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      if (date) q.set('date', date);
      const res = await api.get(
        `/ovds/reports/ecl${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
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

export function useIfrs15Schedule(companyId?: string, date?: string) {
  const [data, setData] = useState<RevenueSchedule[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      if (date) q.set('date', date);
      const res = await api.get(
        `/ovds/reports/ifrs15-schedule${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useIfrs15ComplianceCheck(companyId?: string) {
  const [data, setData] = useState<Ifrs15ComplianceCheck[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      const res = await api.get(
        `/ovds/reports/ifrs15-compliance${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export async function getIfrs15Contract(invoiceId: string, companyId?: string): Promise<ContractAnalysis> {
  const q = new URLSearchParams();
  if (companyId) q.set('companyId', companyId);
  const { data } = await api.get(`/ovds/reports/ifrs15/contract/${invoiceId}${q.toString() ? `?${q}` : ''}`);
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

export function useArAgingFull(companyId?: string, date?: string) {
  const [data, setData] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      if (date) q.set('date', date);
      const res = await api.get(
        `/ovds/reports/ar-aging${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

export function useApAgingFull(companyId?: string, date?: string) {
  const [data, setData] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      if (date) q.set('date', date);
      const res = await api.get(
        `/ovds/reports/ap-aging${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, date]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
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

export function useApprovalRules(companyId?: string) {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/ovds/reports/approval-rules?companyId=${companyId}`);
      setRules(data?.data ?? data ?? []);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { rules, loading, refetch: fetch };
}

export function usePendingApprovals(companyId?: string) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/ovds/reports/approvals/pending?companyId=${companyId}`);
      setRequests(data?.data ?? data ?? []);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { requests, loading, refetch: fetch };
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
}

export function useConsolidation(
  companyId?: string,
  asOf?: string,
) {
  const [data, setData] = useState<ConsolidatedStatements | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (companyId) q.set('companyId', companyId);
      if (asOf) q.set('asOf', asOf);
      const res = await api.get(
        `/ovds/reports/consolidation${q.toString() ? `?${q}` : ''}`,
        { headers: { 'x-background': '1' } } as any,
      ).catch(() => ({ data: null }));
      setData(res.data?.data ?? res.data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId, asOf]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
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
  const [items, setItems] = useState<Grn[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (params.companyId) q.set('companyId', params.companyId);
      if (params.status) q.set('status', params.status);
      const { data } = await api.get(`/ovds/reports/grns${q.toString() ? `?${q}` : ''}`);
      setItems(data?.data ?? data ?? []);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);
  return { items, loading, refetch: fetch };
}

export function useGrnStats(companyId?: string) {
  const [stats, setStats] = useState<GrnStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/ovds/reports/grns/stats?companyId=${companyId}`);
      setStats(data?.data ?? data ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, loading, refetch: fetch };
}

export async function confirmGrn(id: string): Promise<Grn> {
  const { data } = await api.post(`/ovds/reports/grns/${id}/confirm`);
  return data?.data ?? data;
}

export async function createGrn(dto: Partial<Grn> & { items: Omit<GrnItem, 'id'>[] }, companyId?: string): Promise<Grn> {
  const { data } = await api.post('/ovds/reports/grns', { ...dto, companyId });
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
