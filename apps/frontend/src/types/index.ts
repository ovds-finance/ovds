/**
 * Types barrel export.
 * Import shared TypeScript types from here:
 *   import type { Invoice, Employee, PayrollRecord, VatFiling } from '../types';
 */

// -- Core API types ------------------------------------------------------------
export type {
  AuthUser,
  AppSettings,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  InvoiceSource,
  RecurringInterval,
  Bill,
  BillStatus,
  BillCategory,
  Employee,
  Vendor,
  Account,
  AccountType,
  BankAccount,
  JournalEntry,
  JournalLine,
  Paginated,
  // New shared types
  Customer,
  KycStatus,
  RiskLevel,
  Item,
  ItemType,
  ItemUnit,
  TaxRate,
  TaxRateType,
  Company,
  CompanyType,
  AppEnvironment,
  Partnership,
  PartnershipType,
  PartnershipStatus,
  Integration,
  IntegrationStatus,
  AppDto,
  ReviewDto,
  AuditFirmStatus,
  EngagementStatus,
  AuditType,
  FindingSeverity,
  CreateAuditFirmDto,
  UpdateAuditFirmDto,
  CreateEngagementDto,
  UpdateEngagementDto,
  CreateCommentDto,
  CreateFindingDto,
  UpdateFindingDto,
  CreateReleaseDto,
  ApplyReleaseDto,
  CreateFeatureFlagDto,
  ToggleFeatureFlagDto,
  ContactMethod,
  UpdateFrequency,
  CreateOnboardingDto,
  IntegrationConfig,
  NotificationTemplate,
  NotificationCampaign,
  NotificationChannel,
  Alert,
  StrategicInsights,
  AlertSeverity,
  EmployeePayrollSummary,
  PayrollFilters,
  LoanStats,
  ReimbursementStats,
  HealthStatus,
  HealthScore,
  HealthScoreComponent,
  NetworkEvent,
  RootovdsSummary,
  SharedTaxpayerStatus,
} from './api';

// -- Accounting types ----------------------------------------------------------
export type {
  AccountBalancesResponse,
  BankTransaction,
  CreateBankAccountDto,
} from './banks';
// Re-export shared accounting types (avoid duplicate with api.ts)
export type { Account as AccountDetail, BankAccount as BankAccountDetail, JournalEntry as JournalEntryDetail, JournalLine as JournalLineDetail, Vendor as VendorDetail } from './banks';

// -- Payroll types -------------------------------------------------------------
export type {
  PayrollRecord,
  PayrollSummary,
  LoanRequest,
  OtherPayment,
  Arrear,
  ReimbursementClaim,
} from './payroll';

// -- Tax & VAT types -----------------------------------------------------------
export type {
  TaxDashboard,
  TaxReport,
  IncomeTaxReport,
  VatReconciliation,
  CreateTaxFiling,
  ETaxPayload,
  WithholdingReport,
} from './tax';

export type {
  VatFiling,
  VatDashboard,
  VatSummary,
  InputVatEntry,
  OutputVatEntry,
  ReverseChargeEntry,
  WithholdingEntry,
  RefundClaim,
  ExportEvidence,
  EtaxSubmission,
  VatNote,
  VatReturnPdf,
  WhtCertificate,
  BitDeclaration,
  DrrfLevy,
  TaxLiabilitySummary,
} from './vat';
export { VAT_RATE, VAT_THRESHOLD_ETB } from './vat';

// -- IFRS / FX types -----------------------------------------------------------
export type {
  FinancialStatement,
  FxDifferenceResponse,
  IfrsComplianceDashboard,
  NonIncomeTaxResponse,
  FxDifferenceDto,
  NonIncomeTaxDto,
} from './fx.types';
export { IAS21_EXAMPLES } from './fx.types';

// -- Notification types --------------------------------------------------------
// Re-exported via ./api

// -- Session types -------------------------------------------------------------
export type { SessionDto, UserSessions } from './session.types';
