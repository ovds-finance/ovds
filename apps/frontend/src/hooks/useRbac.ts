/**
 * useRbac — convenience hook that combines useAuth + 
 * into a single ergonomic call for the most common RBAC patterns.
 *
 * Usage:
 *   const { can, is, isAtLeast, accessLevel, guard } = useRbac();
 *
 *   // Simple permission check
 *   if (can('invoices:write')) { ... }
 *
 *   // Role check
 *   if (is('ADMIN', 'ovds')) { ... }
 *
 *   // Hierarchy check — is current user at least ovds level?
 *   if (isAtLeast('ovds')) { ... }
 *
 *   // Resource access level
 *   const level = accessLevel('fund_transfers'); // 'none'|'read'|'write'|'admin'
 *
 *   // Inline guard with reason
 *   const { allowed, reason } = guard({ permission: 'payroll:approve', requireMfa: true });
 */
import { useCallback } from 'react';
import { useAuth } from '../rbac/AuthContext';
import { useBusiness } from '../context/businessContext';
import { type PermissionGuardOptions, type PermissionGuardResult } from './usePermissionGuard';
import { rbac, type AppRole, type Permission, type PermissionContext, type DomainSummary } from '../rbac/rbac';
import { Role } from '@ovds/ui';

export interface UseRbacReturn {
  /** True if the current user has the given permission */
  can(permission: Permission, context?: PermissionContext): boolean;
  /** True if the current user has ANY of the given permissions */
  canAny(permissions: Permission[], context?: PermissionContext): boolean;
  /** True if the current user has ALL of the given permissions */
  canAll(permissions: Permission[], context?: PermissionContext): boolean;
  /** True if the current user is one of the given roles */
  is(...roles: AppRole[]): boolean;
  /** True if the current role's hierarchy weight >= the given role */
  isAtLeast(target: AppRole): boolean;
  /** True if the current role's hierarchy weight > the given role */
  isAbove(target: AppRole): boolean;
  /** Generic access level for a resource prefix */
  accessLevel(resource: string): 'none' | 'read' | 'write' | 'admin';
  /** CRUD action check — e.g. canCrud('employees', 'delete') */
  canCrud(resource: string, action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'): boolean;
  /** Returns all permissions for the current user, optionally filtered by business type */
  permissions(): Permission[];
  /** Returns a summary of access levels across all domains */
  summary(): DomainSummary[];
  /** Inline guard — returns { allowed, reason, missingAttribute } */
  guard(options: PermissionGuardOptions): PermissionGuardResult;
  /** The current user's role */
  role: AppRole;
  /** Default landing route for the current role */
  defaultRoute: string;
  /** Shorthand booleans */
  isAdmin: boolean;
  isHR: boolean;
  isOvds: boolean;
  isEmployee: boolean;
  isAuditor: boolean;
  isStaff: boolean;
  isCRM: boolean;
  isPartner: boolean;
  isClient: boolean;
  isDeveloper: boolean;
  isProjectManager: boolean;
}

/**
 * Thin wrapper — delegates to useAuth for RBAC and exposes a guard() helper
 * that internally calls  with the given options.
 *
 * Note: guard() is a stable function reference — safe to call conditionally
 * inside event handlers. Do NOT call it at the top level of a component
 * expecting reactive updates; use  directly for that.
 */
export function useRbac(): UseRbacReturn {
  const auth = useAuth();
  const { selectedBusinessType } = useBusiness();
  const businessType = selectedBusinessType || undefined;

  const guard = useCallback(
    (options: PermissionGuardOptions): PermissionGuardResult => {
      // Imperative evaluation — not reactive, suitable for event handlers.
      // For reactive guards use usePermissionGuard() directly.
      const role = auth.user?.role ?? Role.EMPLOYEE;

      if (options.skip) return { allowed: true, reason: null, missingAttribute: false };

      if (options.role !== undefined) {
        const roles = Array.isArray(options.role) ? options.role : [options.role];
        if (!roles.includes(role)) {
          return { allowed: false, reason: `Requires role: ${roles.join(' or ')}.`, missingAttribute: false };
        }
      }
      if (options.permission && !rbac.can(role, options.permission, options.context, businessType)) {
        return { allowed: false, reason: `Missing permission: ${options.permission}.`, missingAttribute: false };
      }
      if (options.anyPermission?.length && !rbac.canAny(role, options.anyPermission, options.context, businessType)) {
        return { allowed: false, reason: 'Insufficient permissions.', missingAttribute: false };
      }
      if (options.allPermissions?.length && !rbac.canAll(role, options.allPermissions, options.context, businessType)) {
        return { allowed: false, reason: 'Additional permissions required.', missingAttribute: false };
      }
      if (options.requireMfa && !auth.hasMfa) {
        return { allowed: false, reason: 'MFA required.', missingAttribute: true };
      }

      return { allowed: true, reason: null, missingAttribute: false };
    },
    [auth, businessType],
  );

  return {
    can:         (p: Permission, ctx?: PermissionContext) => rbac.can(auth.user?.role ?? Role.EMPLOYEE, p, ctx, businessType),
    canAny:      (ps: Permission[], ctx?: PermissionContext) => rbac.canAny(auth.user?.role ?? Role.EMPLOYEE, ps, ctx, businessType),
    canAll:      (ps: Permission[], ctx?: PermissionContext) => rbac.canAll(auth.user?.role ?? Role.EMPLOYEE, ps, ctx, businessType),
    is:          auth.is,
    isAtLeast:   (target: AppRole) => rbac.isAtLeast(auth.user?.role ?? Role.EMPLOYEE, target),
    isAbove:     (target: AppRole) => rbac.isAbove(auth.user?.role ?? Role.EMPLOYEE, target),
    accessLevel: (res: string) => rbac.accessLevel(auth.user?.role ?? Role.EMPLOYEE, res, businessType),
    canCrud:     (resource: string, action: Parameters<typeof rbac.canCrud>[2]) =>
                   rbac.canCrud(auth.user?.role ?? Role.EMPLOYEE, resource, action, businessType),
    permissions: () => rbac.permissionsFor(auth.user?.role ?? Role.EMPLOYEE, businessType),
    summary:     () => rbac.summary(auth.user?.role ?? Role.EMPLOYEE, businessType),
    guard,
    role:              (auth.user?.role ?? Role.EMPLOYEE) as AppRole,
    defaultRoute:      rbac.defaultRoute(auth.user?.role ?? Role.EMPLOYEE),
    isAdmin:           auth.isAdmin,
    isHR:              auth.isHR,
    isOvds:         auth.isOvds,
    isEmployee:        auth.isEmployee,
    isAuditor:         auth.isAuditor,
    isStaff:           auth.isStaff,
    isCRM:             auth.user?.role === Role.CRM,
    isPartner:         auth.user?.role === Role.PARTNER,
    isClient:          auth.user?.role === Role.CLIENT,
    isDeveloper:       auth.user?.role === Role.DEVELOPER,
    isProjectManager:  auth.user?.role === Role.PROJECT_MANAGER,
  };
}

// Uppercase alias for backward compatibility
export const useRBAC = useRbac;

