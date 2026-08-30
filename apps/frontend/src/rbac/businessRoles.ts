/**
 * Business-Type Prefixed RBAC Roles — re-exported from @ovds/shared (single source of truth).
 *
 * The full implementation lives in packages/shared/src/business-roles.ts
 * so both frontend and backend use identical role logic.
 *
 * DO NOT add implementations here. Edit packages/shared/src/business-roles.ts instead.
 */
export {
  prefixedRole,
  baseRole,
  matchesBusinessRole,
  allPrefixed,
  BUSINESS_ROLE_INHERITANCE,
  SENSITIVE_ROUTES,
  requiresMfa,
} from '@ovds/shared';

export type {

  BusinessRole,

  BaseRole,

  RoleBusinessType,

} from '@ovds/shared';
