/**
 * @ovds/shared — Subscription update & version management types
 * Shared between backend (NestJS) and frontend (React).
 */
export type DeploymentType = 'CLOUD' | 'ON_PREMISE';
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
export interface ModuleUpdateInfo {
    moduleName: string;
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
    changelog?: string;
    downloadUrl?: string;
}
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
export interface SubscriptionStatusDto {
    isActive: boolean;
    updatesAllowed: boolean;
    currentVersion: string;
    daysRemaining: number;
}
export interface ModuleVersion {
    id: string;
    moduleName: string;
    version: string;
    changelog?: string | null;
    downloadUrl?: string | null;
    isCore: boolean;
    releasedAt: string;
}
export interface ApplyUpdateDto {
    updateId: string;
}
export interface ApplyUpdateResponse {
    success: boolean;
    version: string;
}
export interface ActivateLicenseDto {
    licenseKey: string;
}
export interface ActivateLicenseResponse {
    success: boolean;
    message: string;
}
//# sourceMappingURL=subscription-update.d.ts.map