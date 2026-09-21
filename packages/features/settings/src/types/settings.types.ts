/**
 * @ovds/features/settings types
 *
 * Shared TypeScript interfaces for the settings domain.
 */

export interface RolePermissionOverrideDTO {
  role: string;
  permission: string;
  access: 'GRANT' | 'DENY';
}

export interface SettingCategory {
  key: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface SettingGroup {
  id: string;
  categoryId: string;
  key: string;
  name: string;
  description?: string;
}

export interface SettingDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  group?: string;
  module?: string;
  defaultValue?: string;
  options?: any[];
}

export interface SettingValueResponse {
  key: string;
  value: string;
  source?: string;
}

export interface SettingOption {
  key: string;
  label: string;
  value: string;
  description?: string;
}

// ── RBAC DTOs ─────────────────────────────────────────────────────────────────

export interface RbacRoleDTO {
  id: string;
  name: string;
  label: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  apiAccess: boolean;
  companyId?: string | null;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RbacPermissionDTO {
  id: string;
  key: string;
  label: string;
  description?: string;
  category?: string;
  module?: string;
  isCritical?: boolean;
  retentionYears?: number;
  regulation?: string;
  createdAt?: string;
}

export interface SodRuleDTO {
  id: string;
  name: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  perm1: string;
  perm2: string;
  description: string;
  remediation?: string[];
}

export interface AuditEventCatalogDTO {
  id: string;
  permission: string;
  event: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  regulation: string;
  retentionYears: number;
}
