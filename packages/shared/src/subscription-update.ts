/**
 * @ovds/shared — Subscription update & version management types
 * Shared between backend (NestJS) and frontend (React).
 */

// -- Deployment types ----------------------------------------------------------

export type DeploymentType = 'CLOUD' | 'ON_PREMISE';

// -- Update check result -------------------------------------------------------

export interface UpdateCheckResult {
  companyId: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  deploymentType: DeploymentType;
  changelog?: string;
  downloadUrl?: string;
  releaseNotesUrl?: string;
}

// -- Module-specific update info -----------------------------------------------

export interface ModuleUpdateInfo {
  moduleName: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  changelog?: string;
  downloadUrl?: string;
}

// -- Subscription update record ------------------------------------------------

export type UpdateStatus = 'PENDING' | 'APPLIED' | 'FAILED' | 'SKIPPED';

export interface SubscriptionUpdateRecord {
  id: string;
  companyId: string;
  currentVersion: string;
  latestVersion: string;
  deploymentType: DeploymentType;
  status: UpdateStatus;
  changelog?: string | null;
  downloadUrl?: string | null;
  releaseNotesUrl?: string | null;
  notifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// -- Subscription status for frontend ------------------------------------------

export interface SubscriptionStatusDto {
  isActive: boolean;
  updatesAllowed: boolean;
  currentVersion: string;
  daysRemaining: number;
}

// -- Module version ------------------------------------------------------------

export interface ModuleVersion {
  id: string;
  moduleName: string;
  version: string;
  changelog?: string | null;
  downloadUrl?: string | null;
  isCore: boolean;
  releasedAt: string;
}

// -- Apply update payload ------------------------------------------------------

export interface ApplyUpdateDto {
  updateId: string;
}

export interface ApplyUpdateResponse {
  success: boolean;
  version: string;
}

// -- License activation --------------------------------------------------------

export interface ActivateLicenseDto {
  licenseKey: string;
}

export interface ActivateLicenseResponse {
  success: boolean;
  message: string;
}
