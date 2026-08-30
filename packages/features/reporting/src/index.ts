/**
 * @ovds/features/reporting
 *
 * Reporting domain feature library — hooks, API clients, components, types.
 * Covers: Financial Statements Bundle, IFRS Reports (IAS 12, IFRS 9/15/10,
 * IAS 1), AR/AP Aging + Dunning, Approval Workflows, GRN / 3-Way Match,
 * Reconciliation Projections (Peachtree, SigTax, IFRS).
 *
 * Scope: frontend (scope:frontend, type:feature)
 */

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  ProjectionEngine,
  ReconciliationAdjustmentCode,
  ProjectionJournalRow,
  IfrsReportingBalanceRow,
  TemporaryDifference,
  DeferredTaxSummary,
  EquityMovementRow,
  EquityMovementStatement,
  EclBucket,
  EclSummary,
  PerformanceObligation,
  ContractAnalysis,
  RevenueSchedule,
  Ifrs15ComplianceCheck,
  AgingItem,
  AgingBucket,
  AgingReport,
  DunningAction,
  DunningResult,
  WorkflowRule,
  ApprovalRequest,
  SubsidiaryEntry,
  EliminationEntry,
  ConsolidatedLineItem,
  ConsolidatedStatements,
  GrnItem,
  Grn,
  GrnStats,
  ThreeWayMatchResult,
  AccountingBasis,
  ExportFormat,
  ScheduleFrequency,
  ReportCategory,
  ReportStatus,
  ReportPeriod,
  ReportConfig,
  KpiCell,
  ReportColumn,
  ReportRow,
  NormalizedReport,
  ReportTemplate,
  ScheduleEntry,
} from './types/reporting.types';

// ── API clients ────────────────────────────────────────────────────────────────
export {
  financialStatementsApi,
  ifrsReportsApi,
  agingApi,
  approvalApi,
  grnApi,
} from './services/reportingApi';

// ── Report services ────────────────────────────────────────────────────────────
export {
  fetchReportJson,
  fetchReport,
  exportReportBlob,
  downloadCSV,
  downloadReportData,
  defaultPeriod,
} from './services/reportsService';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useFinancialBundle,
  useAgingReport,
  usePendingApprovals,
} from './hooks/useReports';

// ── Components ────────────────────────────────────────────────────────────────
export {
  ReportGallery,
  ReportViewer,
  ReportBuilder,
  ScheduledDeliveryModal,
} from './components';

// ── Lib ───────────────────────────────────────────────────────────────────────
export {
  STANDARD_REPORTS,
  MODULAR_REPORTS,
  ALL_TEMPLATES,
  findTemplate,
  templatesByCategory,
  BASIS_OPTIONS,
  normalizeReport,
  fmtMoney,
  fmtNumber,
  fmtCell,
} from './lib';
