/**
 * usePermissionGuard — RBAC + ABAC combined access guard.
 *
 * Combines role-based permission checks with attribute-based checks
 * (companyId, subsidiary, businessType, stepUp) so components can enforce
 * fine-grained access in a single hook call.
 *
 * Usage:
 *   const { allowed, reason } = usePermissionGuard({
 *     permission: 'invoices:write',
 *     requireCompany: true,
 *     requireMfa: true,
 *   });
 *   if (!allowed) return <AccessDenied reason={reason} />;
 */
import { useMemo } from 'react';

import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import { ROLE_HIERARCHY, type Permission, type AppRole } from '../rbac/rbac';

export interface PermissionGuardOptions {
  /** RBAC permission required */
  permission?: Permission;
  /** Any of these permissions is sufficient (OR logic) */
  anyPermission?: Permission[];
  /** All of these permissions are required (AND logic) */
  allPermissions?: Permission[];
  /** Role check — user must be one of these roles */
  role?: AppRole | AppRole[];
  /**
   * Hierarchy check — user's role weight must be >= this role.
   * e.g. atLeast: 'ovds' passes for ovds, ADMIN, SPURADMIN, DEVELOPER
   */
  atLeast?: AppRole;
  /** ABAC: user must have an active company context */
  requireCompany?: boolean;
  /** ABAC: user must belong to one of these subsidiaries */
  requireSubsidiary?: string[];
  /**
   * ABAC: user's company must be one of these business types.
   * e.g. ['MANUFACTURING', 'LARGE_ENTERPRISE']
   */
  requireBusinessType?: string[];
  /** ABAC: user must have completed MFA step-up this session */
  requireMfa?: boolean;
  /** Custom permission context for smart rules (e.g. amount limits) */
  context?: any;
  /** Skip the guard entirely — always returns allowed: true */
  skip?: boolean;
}

export interface PermissionGuardResult {
  /** True when all checks pass */
  allowed: boolean;
  /** Human-readable reason when denied */
  reason: string | null;
  /** True when the user has the permission but lacks an attribute (e.g. no company) */
  missingAttribute: boolean;
}

export function usePermissionGuard(
  options: PermissionGuardOptions = {},
): PermissionGuardResult {
  const {
    permission,
    anyPermission,
    allPermissions,
    role,
    atLeast,
    requireCompany = false,
    requireSubsidiary,
    requireBusinessType,
    requireMfa = false,
    context: permContext,
    skip = false,
  } = options;

  const { can, canAny, canAll, is, hasMfa, user } = useAuth();
  const { selectedCompanyId, selectedBusinessType } = useBusiness();

  return useMemo(() => {
    if (skip) return { allowed: true, reason: null, missingAttribute: false };

    // -- RBAC: role check ----------------------------------------------------
    if (role !== undefined) {
      const roles = Array.isArray(role) ? role : [role];
      if (!is(...roles)) {
        return {
          allowed: false,
          reason: `This action requires one of the following roles: ${roles.join(', ')}.`,
          missingAttribute: false,
        };
      }
    }

    // -- RBAC: hierarchy check -----------------------------------------------
    if (atLeast !== undefined) {
      const currentRole = user?.role ?? 'EMPLOYEE';
      if ((ROLE_HIERARCHY[currentRole] ?? 0) < (ROLE_HIERARCHY[atLeast] ?? 0)) {
        return {
          allowed: false,
          reason: `This action requires at least ${atLeast} level access.`,
          missingAttribute: false,
        };
      }
    }

    // -- RBAC: permission checks ---------------------------------------------
    if (permission && !can(permission, permContext)) {
      return {
        allowed: false,
        reason: `You don't have the "${permission}" permission.`,
        missingAttribute: false,
      };
    }
    if (anyPermission && anyPermission.length > 0 && !canAny(anyPermission, permContext)) {
      return {
        allowed: false,
        reason: 'Insufficient permissions for this action.',
        missingAttribute: false,
      };
    }
    if (allPermissions && allPermissions.length > 0 && !canAll(allPermissions, permContext)) {
      return {
        allowed: false,
        reason: 'You need additional permissions for this action.',
        missingAttribute: false,
      };
    }

    // -- ABAC: company context -----------------------------------------------
    if (requireCompany && !selectedCompanyId && !user?.companyId) {
      return {
        allowed: false,
        reason: 'Select an active company to perform this action.',
        missingAttribute: true,
      };
    }

    // -- ABAC: business type restriction ------------------------------------
    if (requireBusinessType && requireBusinessType.length > 0) {
      const bt = selectedBusinessType ?? null;
      if (!bt || !requireBusinessType.includes(bt)) {
        return {
          allowed: false,
          reason: `This feature is only available for: ${requireBusinessType.join(', ')}.`,
          missingAttribute: true,
        };
      }
    }

    // -- ABAC: subsidiary restriction ----------------------------------------
    if (requireSubsidiary && requireSubsidiary.length > 0) {
      const userSub = user?.subsidiary;
      if (!userSub || !requireSubsidiary.includes(userSub)) {
        return {
          allowed: false,
          reason: `This action is restricted to: ${requireSubsidiary.join(', ')}.`,
          missingAttribute: true,
        };
      }
    }

    // -- ABAC: MFA step-up ---------------------------------------------------
    if (requireMfa && !hasMfa) {
      return {
        allowed: false,
        reason: 'Multi-factor authentication is required for this action.',
        missingAttribute: true,
      };
    }

    return { allowed: true, reason: null, missingAttribute: false };
  }, [
    skip, permission, anyPermission, allPermissions, role, atLeast,
    requireCompany, requireSubsidiary, requireBusinessType, requireMfa, permContext,
    can, canAny, canAll, is, hasMfa, user, selectedCompanyId, selectedBusinessType,
  ]);
}
