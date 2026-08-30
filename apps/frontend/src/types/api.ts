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

// Local type stubs for types not yet in @ovds/shared
export type TaxRate = { id: string; name: string; rate: number; type: string; isActive: boolean; companyId?: string | null; createdAt: string; updatedAt: string; [k: string]: unknown };
export type PayrollFilters = { companyId?: string; period?: string; status?: string; employeeId?: string };
export type LoanStats = { total: number; pending: number; approved: number; rejected: number; totalAmount: number };
export type ReimbursementStats = { total: number; pending: number; approved: number; rejected: number; totalAmount: number };
export type RootovdsSummary = Record<string, unknown>;
export type SharedTaxpayerStatus = { category: string; isVatRegistered: boolean; tin?: string };
export type ApiResponse<T = unknown> = { statusCode: number; message: string; data: T; success: boolean };
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PartnershipType = string;
export type PartnershipStatus = string;
