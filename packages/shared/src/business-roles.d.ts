/**
 * Business-Type Prefixed RBAC Roles
 *
 * Extends core roles with businessType prefix for multi-tenant access control.
 * Single source of truth — shared between frontend and backend.
 *
 * Example: 'ovds_manufacturing', 'hr_large_enterprise'
 */
export type BusinessRole = 'admin_manufacturing' | 'admin_large' | 'admin_medium' | 'admin_small' | 'admin_freelancer' | 'admin_retail' | 'admin_wholesale' | 'admin_ngo' | 'admin_government' | 'hr_manufacturing' | 'hr_large' | 'hr_medium' | 'hr_small' | 'hr_freelancer' | 'hr_retail' | 'hr_wholesale' | 'hr_ngo' | 'hr_government' | 'ovds_manufacturing' | 'ovds_large' | 'ovds_medium' | 'ovds_small' | 'ovds_freelancer' | 'ovds_retail' | 'ovds_wholesale' | 'ovds_ngo' | 'ovds_government' | 'employee_manufacturing' | 'employee_large' | 'employee_medium' | 'employee_small' | 'employee_freelancer' | 'employee_retail' | 'employee_wholesale' | 'employee_ngo' | 'employee_government';
export type BaseRole = 'ADMIN' | 'HR' | 'ovds' | 'EMPLOYEE';
/** Business type keys used for role prefixing (subset of CompanyType) */
export type RoleBusinessType = 'MANUFACTURING' | 'LARGE_ENTERPRISE' | 'MEDIUM_ENTERPRISE' | 'SMALL_BUSINESS' | 'FREELANCER' | 'RETAIL' | 'WHOLESALE' | 'NGO' | 'CORPORATION' | 'GOVERNMENT';
export declare function prefixedRole(base: BaseRole, type: RoleBusinessType): BusinessRole;
export declare function baseRole(prefixed: BusinessRole): BaseRole;
export declare function matchesBusinessRole(role: string, base: BaseRole, type: RoleBusinessType): boolean;
export declare function allPrefixed(base: BaseRole): BusinessRole[];
export declare const BUSINESS_ROLE_INHERITANCE: Record<BusinessRole, BaseRole>;
/** Sensitive routes that require MFA — enforced on both frontend and backend */
export declare const SENSITIVE_ROUTES: ReadonlySet<string>;
export declare function requiresMfa(path: string): boolean;
//# sourceMappingURL=business-roles.d.ts.map