// Role, AccountType, AccountCategory are defined in ./roles and ./accounting
// and barrel-exported from packages/shared/src/types/index.ts directly.
// They are re-exported here only to preserve backward-compat imports of the form:
//   import { Role } from '@ovds/shared/types/entities'
// Do NOT add more re-exports here — use the canonical source files instead.
import { Role } from './roles';
import { AccountType, AccountCategory } from './accounting';
export { Role, AccountType, AccountCategory };

export enum CompanyType {
  MANUFACTURING = 'MANUFACTURING',
  LARGE_ENTERPRISE = 'LARGE_ENTERPRISE',
  MEDIUM_ENTERPRISE = 'MEDIUM_ENTERPRISE',
  SMALL_BUSINESS = 'SMALL_BUSINESS',
  FREELANCER = 'FREELANCER',
  GOVERNMENT = 'GOVERNMENT',
  RETAIL = 'RETAIL',
  WHOLESALE = 'WHOLESALE',
  SERVICE = 'SERVICE',
  NGO = 'NGO',
}

export type BusinessType = keyof typeof CompanyType;

export enum AppEnvironment {
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
  DEVELOPMENT = 'DEVELOPMENT',
}

/** @deprecated Use AppEnvironment — this duplicate will be removed in a future release. */
export const AppEnv = AppEnvironment;
/** @deprecated Use AppEnvironment */
export type AppEnv = AppEnvironment;

export enum CompanyReleaseStatus {
  AVAILABLE = 'AVAILABLE',
  APPLIED = 'APPLIED',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED',
}

export enum ReleaseStatus {
  DRAFT = 'DRAFT',
  RELEASED = 'RELEASED',
  REVOKED = 'REVOKED',
}

export enum ReleaseType {
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

export interface User {
  id: string;
  email: string | null;
  username?: string;
  employeeId?: string | null;
  lastLoginAt?: Date | string | null;
  name?: string | null;
  role: Role;
  companyId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Company {
  id: string;
  name: string;
  subdomain?: string | null;
  type: CompanyType;
  currencyCode: string;
  tin?: string | null;
  vatNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  settings?: unknown;
  ifrsConfig?: unknown;
  environment?: AppEnvironment;
  autoUpdate?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: { employee: number; department: number };
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tin?: string | null;
  vatNumber?: string | null;
  businessType?: string | null;
  creditLimit?: number | null;
  paymentTerms?: string | null;
  companyId?: string | null;
  notes?: string | null;
  paymentCurrency?: string | null;
  creditScore?: number | null;
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  nationalId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tin?: string | null;
  vatNumber?: string | null;
  category?: string | null;
  paymentTerms?: string | null;
  companyId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  currencyCode: string;
  balance: number;
  companyId?: string | null;
  openingBalance?: number;
  accountId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory | string;
  isActive: boolean;
  companyId: string | null;
  description?: string | null;
  balance?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Lead {
  id: string;
  title: string;
  contactId?: string;
  value: number;
  status: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
}

export interface Pipeline {
  id: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
  expectedCloseDate?: Date;
  customerId?: string;
  companyId?: string;
}

export interface Partnership {
  id: string;
  name: string;
  type: string;
  status: string;
  tin?: string;
  contactName?: string;
  contactEmail?: string;
  companyId?: string;
}

export type PartnershipType = 'JOINT_VENTURE' | 'CONSORTIUM' | 'STRATEGIC_ALLIANCE' | 'DISTRIBUTOR' | 'RESELLER' | 'TECHNOLOGY_PARTNER';
export type PartnershipStatus = 'ACTIVE' | 'INACTIVE' | 'DISSOLVED' | 'PENDING';

/**
 * PaginatedResult — the backend/shared pagination envelope.
 *
 * This is the canonical shape used by NestJS services and domain libraries.
 * The optional `pagination` field is a legacy sub-object still emitted by
 * `packages/domains/infrastructure/src/pagination.helper.ts#paginate()`.
 *
 * Frontend-only consumers should prefer the leaner shape from:
 *   import type { PaginatedResult } from '@ovds/contracts/schemas/common';
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** @deprecated Legacy sub-object. Use the top-level fields instead. */
  pagination?: {
    page: number;
    take: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
  fields?: Record<string, string>;
  requestId?: string;
  timestamp?: string;
  ms?: string;
  errors?: string[];
}

export type UIStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
export type UIVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost';
export type UISize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
