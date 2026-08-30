/**
 * RBAC module barrel export.
 *
 * Import everything auth/RBAC-related from here:
 *   import { useAuth, Can, rbac, type AppRole } from '../rbac';
 *   import { usePermissionGuard, useRbac } from '../rbac';
 */
export {
  AuthProvider,
  useAuth,
  clearAllCache,
  type AuthUser,
  type AuthContextValue,
} from './AuthContext';
export {
  rbac,
  ROUTE_PERMISSIONS,
  DEFAULT_ROUTE,
  PERMISSION_GROUPS,
  RESOURCE_DOMAINS,
  RESOURCE_DOMAINS_FLAT,
  ROLE_METADATA,
  ROLE_GROUPS,
  ROLE_HIERARCHY,
  SENSITIVE_ROUTES,
  requiresMfa,
  type AppRole,
  type Permission,
  type DomainSummary,
  type RoleMetadata,
} from './rbac';
// Enhanced Can with ABAC (company context, MFA step-up, subsidiary, businessType, negate, render prop)
export { Can } from '../components/can';
export { RoleBadge } from '../components/roleBadge';
export { PermissionTooltip } from '../components/permissionTooltip';
export { StepUpProvider, useStepUp } from '../components/stepUpAuthModal';
// Proactive session refresh hook
export { useSessionRefresh } from '../hooks/useSessionRefresh';
// Role-based redirect hook
export { useRoleRedirect } from '../hooks/useRoleRedirect';
// RBAC convenience hook
export { useRbac } from '../hooks/useRbac';
// Data fetching hook with caching, deduplication, and retry
export { useApiQuery, invalidateQuery, invalidateQueryPrefix } from '../hooks/useApiQuery';
// Financial alert engine — payroll, invoices, VAT, Disaster Fund, BIT
export { useFinancialAlerts } from '../hooks/useFinancialAlerts';
export type { Alert as FinancialAlert, AlertSeverity } from '@ovds/ui';
// Payroll aggregation hook — shared by Dashboard, PayrollAdministration, Reports
export { usePayrollStats, type PayrollStats } from '../hooks/usePayrollStats';

// -- Auth0 integration ---------------------------------------------------------
export { Auth0ProviderWrapper } from './Auth0ProviderWrapper';
export { Auth0LoginButton } from './auth0LoginButton';
export { Auth0LogoutHandler } from './auth0LogoutHandler';
export { triggerAuth0Logout, registerAuth0LogoutListener } from './auth0Logout';
export { getAuth0Client, getAuth0Token, registerAuth0RefreshListener } from './auth0Client';

// -- Business roles (ABAC extensions) -----------------------------------------
export {
  BUSINESS_ROLE_INHERITANCE,
  prefixedRole,
  baseRole,
  allPrefixed,
  matchesBusinessRole,
  type BaseRole,
  type BusinessRole,
} from './businessRoles';
