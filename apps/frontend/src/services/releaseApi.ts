import { apiGet, apiPost, apiPatch } from './api';

export interface Release {
  id: string;
  version: string;
  changelog?: string;
  isMandatory: boolean;
  releasedAt: string;
  status: 'DRAFT' | 'RELEASED' | 'REVOKED';
  type: 'STAGING' | 'PRODUCTION';
}
 
export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isEnabled: boolean; // For company-specific view
}

export interface CompanyRelease {
  id: string;
  companyId: string;
  releaseId: string;
  status: 'AVAILABLE' | 'APPLIED' | 'SKIPPED' | 'FAILED';
  appliedAt?: string;
  release: Release;
}

export interface UpdateSettings {
  currentVersion: string | null;
  autoUpdate: boolean;
  environment: 'STAGING' | 'PRODUCTION' | 'DEVELOPMENT' | 'ON_PREMISE';
}

export const releaseApi = {
  /**
   * Create a new system-wide release (SuperAdmin only)
   */
  createRelease: (data: { 
    version: string; 
    changelog?: string; 
    isMandatory?: boolean;
    type?: 'STAGING' | 'PRODUCTION';
  }) => apiPost<Release>('/releases', data),

  /**
   * Get available releases for the current company
   */
  getAvailableReleases: () =>
    apiGet<CompanyRelease[]>('/releases/available'),

  /**
   * Check for pending mandatory releases
   */
  getPendingMandatory: () =>
    apiGet<CompanyRelease | null>('/releases/pending-mandatory'),

  /**
   * Get update settings for the current company
   */
  getUpdateSettings: () =>
    apiGet<UpdateSettings>('/releases/settings'),

  /**
   * Update update settings for the current company
   */
  updateUpdateSettings: (autoUpdate: boolean) =>
    apiPatch<UpdateSettings>('/releases/settings', { autoUpdate }),

  /**
   * Apply a release to the current company
   */
  applyRelease: (releaseId: string) =>
    apiPost<CompanyRelease>('/releases/apply', { releaseId }),

  /**
   * Get release history for the current company
   */
  getHistory: () =>
    apiGet<CompanyRelease[]>('/releases/history'),

  /**
   * Create a new feature flag (SuperAdmin only)
   */
  createFeatureFlag: (data: { name: string; description?: string }) =>
    apiPost<FeatureFlag>('/releases/flags', data),

  /**
   * Toggle a feature flag for a company (SuperAdmin only)
   */
  toggleFlag: (data: { companyId: string; flagId: string; isEnabled: boolean }) =>
    apiPatch<void>('/releases/flags/toggle', data),

  /**
   * Get feature flags for the current company
   */
  getFlags: () =>
    apiGet<FeatureFlag[]>('/releases/flags'),
};
