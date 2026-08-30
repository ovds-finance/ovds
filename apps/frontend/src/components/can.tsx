/**
 * Can — declarative RBAC + ABAC gate component.
 *
 * Renders children only when the current user satisfies all given checks.
 * Supports a render-prop pattern for disabling rather than hiding elements.
 *
 * Usage:
 *   <Can permission="invoices:write">
 *     <button>New Invoice</button>
 *   </Can>
 *
 *   <Can anyOf={['payroll:approve', 'payroll:generate']} fallback={<ReadOnlyBadge />}>
 *     <ApproveButton />
 *   </Can>
 *
 *   <Can role="ADMIN" requireMfa>
 *     <DangerZone />
 *   </Can>
 *
 *   <Can requireCompany fallback={<p>Select a company first</p>}>
 *     <CompanySpecificWidget />
 *   </Can>
 *
 *   // Negate — render when user does NOT have permission
 *   <Can permission="employees:write" negate>
 *     <ReadOnlyBadge />
 *   </Can>
 *
 *   // Render prop — access the allowed boolean in children
 *   <Can permission="payroll:approve">
 *     {(allowed) => <Button disabled={!allowed}>Approve</Button>}
 *   </Can>
 *
 *   // Business-type ABAC gate
 *   <Can requireBusinessType={['MANUFACTURING']}>
 *     <ManufacturingWidget />
 *   </Can>
 */
import React from 'react';
import { usePermissionGuard } from '../hooks/usePermissionGuard';
import type { Permission, AppRole } from '../rbac/rbac';

interface CanProps {
  /** Single RBAC permission required */
  permission?: Permission;
  /** Any of these permissions is sufficient (OR logic) */
  anyOf?: Permission[];
  /** All of these permissions are required (AND logic) */
  allOf?: Permission[];
  /** Role check — user must be one of these roles */
  role?: AppRole | AppRole[];
  /**
   * Hierarchy check — user's role weight must be >= this role.
   * e.g. atLeast="ovds" passes for ovds, ADMIN, SPURADMIN, DEVELOPER
   */
  atLeast?: AppRole;
  /** ABAC: user must have an active company context */
  requireCompany?: boolean;
  /** ABAC: user must belong to one of these subsidiaries */
  requireSubsidiary?: string[];
  /** ABAC: company must be one of these business types */
  requireBusinessType?: string[];
  /** ABAC: user must have completed MFA step-up this session */
  requireMfa?: boolean;
  /** Custom permission context for smart rules (e.g. amount limits) */
  context?: any;
  /** Invert the check — render when the condition is NOT met */
  negate?: boolean;
  /** Rendered when the check fails. Defaults to null (renders nothing). */
  fallback?: React.ReactNode;
  /**
   * Children can be a ReactNode or a render prop receiving the allowed boolean.
   * Render prop is useful for disabling buttons rather than hiding them.
   */
  children: React.ReactNode | ((allowed: boolean) => React.ReactNode);
}

export const Can: React.FC<CanProps> = ({
  permission,
  anyOf,
  allOf,
  role,
  atLeast,
  requireCompany,
  requireSubsidiary,
  requireBusinessType,
  requireMfa,
  context,
  negate = false,
  fallback = null,
  children,
}) => {
  const { allowed } = usePermissionGuard({
    permission,
    anyPermission: anyOf,
    allPermissions: allOf,
    role,
    atLeast,
    requireCompany,
    requireSubsidiary,
    requireBusinessType,
    requireMfa,
    context,
  });

  const result = negate ? !allowed : allowed;

  if (typeof children === 'function') {
    return <>{(children as (a: boolean) => React.ReactNode)(result)}</>;
  }

  return <>{result ? children : fallback}</>;
};

export default Can;
