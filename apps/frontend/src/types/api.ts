import {
  AppDto,
  ReviewDto,
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
  CreateOnboardingDto,
} from '@ovds/dto';
import {
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
  Customer,
  RiskLevel,
  Item,
  ItemType,
  ItemUnit,
  TaxRateType,
  Company,
  CompanyType,
  AppEnvironment,
  Partnership,
  PaginatedResult,
  AuditFirmStatus,
  EngagementStatus,
  AuditType,
  FindingSeverity,
  ContactMethod,
  UpdateFrequency,
  IntegrationConfig,
  NotificationTemplate,
  NotificationCampaign,
  NotificationChannel,
  Alert,
  StrategicInsights,
  AlertSeverity,
  EmployeePayrollSummary,
  HealthStatus,
  HealthScore,
  HealthScoreComponent,
  NetworkEvent,
} from '@ovds/shared';
import {
  Integration,
  IntegrationStatus,
  AppSettings,
} from '@ovds/shared';

/**
 * Shared API response types for the frontend.
 * Keep in sync with backend DTOs / Prisma models.
 */

// -- Pagination ----------------------------------------------------------------

export type Paginated<T> = PaginatedResult<T>;

// -- Auth ----------------------------------------------------------------------
// AuthUser is now in @ovds/shared — re-exported here for backward compat
export type {
  AuthUser,
} from '@ovds/shared';

// -- Re-export from shared with local aliases if needed ------------------------

export type {
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
  Customer,
  RiskLevel,
  Item,
  ItemType,
  ItemUnit,
  TaxRateType,
  Company,
  CompanyType,
  AppEnvironment,
  Partnership,
  AppSettings,
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
  HealthStatus,
  HealthScore,
  HealthScoreComponent,
  NetworkEvent,
  PaginatedResult,
};

// ── Types now sourced from canonical packages ────────────────────────────────

// ApiResponse — full 9-field envelope (statusCode, message, data, success,
// error, fields, requestId, timestamp, ms, errors).
export type { ApiResponse } from '@ovds/shared';

// TaxRate — Zod-inferred from @ovds/contracts/schemas/ovds TaxRateSchema.
export type { TaxRate } from '@ovds/contracts/schemas';

// KycStatus — @ovds/shared includes EXPIRED which the old local stub missed.
export type { KycStatus } from '@ovds/shared';

// PartnershipType / PartnershipStatus — proper union literals, not plain string.
export type { PartnershipType, PartnershipStatus } from '@ovds/shared';

// PayrollFilters, LoanStats, ReimbursementStats — canonical shapes from @ovds/dto.
// NOTE: field names differ slightly from old stubs (see migration note below).
//   PayrollFilters: uses year/month (number) instead of period (string)
//   LoanStats:      totalOutstanding instead of totalAmount
//   ReimbursementStats: totalApprovedAmount instead of totalAmount
export type { PayrollFilters, LoanStats, ReimbursementStats } from '@ovds/dto';

// ── Remaining local stubs (no shared equivalent yet) ─────────────────────────
export type RootovdsSummary = Record<string, unknown>;
export type SharedTaxpayerStatus = { category: string; isVatRegistered: boolean; tin?: string };
