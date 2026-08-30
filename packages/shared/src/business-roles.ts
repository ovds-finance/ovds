/**
 * Business-Type Prefixed RBAC Roles
 *
 * Extends core roles with businessType prefix for multi-tenant access control.
 * Single source of truth — shared between frontend and backend.
 *
 * Example: 'ovds_manufacturing', 'hr_large_enterprise'
 */

export type BusinessRole =
  | 'admin_manufacturing' | 'admin_large' | 'admin_medium' | 'admin_small'
  | 'admin_freelancer' | 'admin_retail' | 'admin_wholesale' | 'admin_ngo' | 'admin_government'
  | 'hr_manufacturing' | 'hr_large' | 'hr_medium' | 'hr_small'
  | 'hr_freelancer' | 'hr_retail' | 'hr_wholesale' | 'hr_ngo' | 'hr_government'
  | 'ovds_manufacturing' | 'ovds_large' | 'ovds_medium' | 'ovds_small'
  | 'ovds_freelancer' | 'ovds_retail' | 'ovds_wholesale' | 'ovds_ngo' | 'ovds_government'
  | 'employee_manufacturing' | 'employee_large' | 'employee_medium' | 'employee_small'
  | 'employee_freelancer' | 'employee_retail' | 'employee_wholesale' | 'employee_ngo' | 'employee_government';

export type BaseRole = 'ADMIN' | 'HR' | 'ovds' | 'EMPLOYEE';

/** Business type keys used for role prefixing (subset of CompanyType) */
export type RoleBusinessType =
  | 'MANUFACTURING' | 'LARGE_ENTERPRISE' | 'MEDIUM_ENTERPRISE' | 'SMALL_BUSINESS'
  | 'FREELANCER' | 'RETAIL' | 'WHOLESALE' | 'NGO' | 'CORPORATION' | 'GOVERNMENT';

const TYPE_SHORT: Record<RoleBusinessType, string> = {
  MANUFACTURING:     'manufacturing',
  LARGE_ENTERPRISE:  'large',
  CORPORATION:       'large',
  MEDIUM_ENTERPRISE: 'medium',
  SMALL_BUSINESS:    'small',
  FREELANCER:        'freelancer',
  RETAIL:            'retail',
  WHOLESALE:         'wholesale',
  NGO:               'ngo',
  GOVERNMENT:        'government',
};

export function prefixedRole(base: BaseRole, type: RoleBusinessType): BusinessRole {
  return `${base.toLowerCase()}_${TYPE_SHORT[type]}` as BusinessRole;
}

export function baseRole(prefixed: BusinessRole): BaseRole {
  const [role] = prefixed.split('_') as [BaseRole, string];
  return role.toUpperCase() as BaseRole;
}

export function matchesBusinessRole(role: string, base: BaseRole, type: RoleBusinessType): boolean {
  return role === prefixedRole(base, type);
}

export function allPrefixed(base: BaseRole): BusinessRole[] {
  const types: RoleBusinessType[] = [
    'MANUFACTURING', 'LARGE_ENTERPRISE', 'MEDIUM_ENTERPRISE', 'SMALL_BUSINESS',
    'FREELANCER', 'RETAIL', 'WHOLESALE', 'NGO', 'GOVERNMENT',
  ];
  return types.map(t => prefixedRole(base, t));
}

export const BUSINESS_ROLE_INHERITANCE: Record<BusinessRole, BaseRole> = {
  admin_manufacturing: 'ADMIN', admin_large: 'ADMIN', admin_medium: 'ADMIN',
  admin_small: 'ADMIN', admin_freelancer: 'ADMIN', admin_retail: 'ADMIN',
  admin_wholesale: 'ADMIN', admin_ngo: 'ADMIN', admin_government: 'ADMIN',
  hr_manufacturing: 'HR', hr_large: 'HR', hr_medium: 'HR', hr_small: 'HR',
  hr_freelancer: 'HR', hr_retail: 'HR', hr_wholesale: 'HR', hr_ngo: 'HR', hr_government: 'HR',
  ovds_manufacturing: 'ovds', ovds_large: 'ovds', ovds_medium: 'ovds',
  ovds_small: 'ovds', ovds_freelancer: 'ovds', ovds_retail: 'ovds',
  ovds_wholesale: 'ovds', ovds_ngo: 'ovds', ovds_government: 'ovds',
  employee_manufacturing: 'EMPLOYEE', employee_large: 'EMPLOYEE', employee_medium: 'EMPLOYEE',
  employee_small: 'EMPLOYEE', employee_freelancer: 'EMPLOYEE', employee_retail: 'EMPLOYEE',
  employee_wholesale: 'EMPLOYEE', employee_ngo: 'EMPLOYEE', employee_government: 'EMPLOYEE',
};

/** Sensitive routes that require MFA — enforced on both frontend and backend */
export const SENSITIVE_ROUTES: ReadonlySet<string> = new Set([
  '/settings/users', '/settings/roles', '/settings', '/settings/audit-logs',
  '/settings/multi-company', '/hr/payroll-administration', '/tax/vat',
  '/tax/filing', '/banking/transfers', '/ovds/loans',
]);

export function requiresMfa(path: string): boolean {
  for (const route of SENSITIVE_ROUTES) {
    if (path === route || path.startsWith(route + '/') || path.startsWith(route + '?')) {
      return true;
    }
  }
  return false;
}
