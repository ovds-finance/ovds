/**
 * RBAC Policy Layer — Frontend Wrapper
 *
 * This file delegates core RBAC logic to @ovds/shared to ensure 
 * single-source-of-truth across frontend and backend.
 */
import {
  Role,
  Permission,
  ROLE_HIERARCHY,
  RESOURCE_DOMAINS,
  ROUTE_PERMISSIONS,
  DEFAULT_ROUTE,
  CONTEXTUAL_RULES,
  hasPermission,
  canAny as sharedCanAny,
  canAll as sharedCanAll,
  isAtLeast as sharedIsAtLeast,
  isAbove as sharedIsAbove,
  canAccessRoute as sharedCanAccessRoute,
  vatLevel as sharedVatLevel,
  accessLevel as sharedAccessLevel,
  canCrud as sharedCanCrud,
  defaultRoute as sharedDefaultRoute,
  getPermissions as sharedGetPermissions,
  PermissionContext,
  requiresMfa,
  SENSITIVE_ROUTES,
} from '@ovds/shared';

export { 
  ROLE_HIERARCHY,
  RESOURCE_DOMAINS,
  ROUTE_PERMISSIONS,
  DEFAULT_ROUTE,
  CONTEXTUAL_RULES,
  // Re-export from shared so existing imports from '../rbac' keep working
  SENSITIVE_ROUTES,
  requiresMfa,
};

// AppRole = string union of all Role values — alias for backward compat
export type AppRole = typeof Role[keyof typeof Role];
export type { Permission, PermissionContext };

export interface RoleMetadata {
  label: string;
  description: string;
  color: {
    badge: string;
    dot: string;
  };
}

export const ROLE_METADATA: Record<AppRole, RoleMetadata> = {
  SPURADMIN: {
    label: 'Root Admin',
    description: 'System-wide configuration and security bypass.',
    color: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', dot: 'bg-rose-500' }
  },
  SUPERADMIN: {
    label: 'Super Admin',
    description: 'Full administrative control over this company.',
    color: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', dot: 'bg-rose-500' }
  },
  DEVELOPER: {
    label: 'Developer',
    description: 'System monitoring and API integration access.',
    color: { badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', dot: 'bg-blue-500' }
  },
  ADMIN: {
    label: 'Administrator',
    description: 'Operations and workspace management.',
    color: { badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20', dot: 'bg-slate-500' }
  },
  PROJECT_MANAGER: {
    label: 'Project Manager',
    description: 'Delivery and resource allocation control.',
    color: { badge: 'bg-violet-500/10 text-violet-500 border-violet-500/20', dot: 'bg-violet-500' }
  },
  HR: {
    label: 'HR Manager',
    description: 'Personnel, payroll, and recruitment management.',
    color: { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dot: 'bg-emerald-500' }
  },
  EMPLOYEE: {
    label: 'Employee',
    description: 'Self-service workspace and personal records.',
    color: { badge: 'bg-slate-400/10 text-slate-400 border-slate-400/20', dot: 'bg-slate-400' }
  },
  OVDS: {
    label: 'OVDS Controller',
    description: 'Financial oversight and treasury management.',
    color: { badge: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20', dot: 'bg-emerald-600' }
  },
  ACCOUNTING: {
    label: 'Accountant',
    description: 'Daily bookkeeping and invoice processing.',
    color: { badge: 'bg-cyan-600/10 text-cyan-600 border-cyan-600/20', dot: 'bg-cyan-600' }
  },
  AUDITOR: {
    label: 'Internal Auditor',
    description: 'Compliance verification and audit logging.',
    color: { badge: 'bg-amber-600/10 text-amber-600 border-amber-600/20', dot: 'bg-amber-600' }
  },
  IFRS_OFFICER: {
    label: 'IFRS Officer',
    description: 'AFIS standards and reporting enforcement.',
    color: { badge: 'bg-teal-500/10 text-blue-600 border-blue-600/20', dot: 'bg-teal-500' }
  },
  BANK_LIAISON: {
    label: 'Bank Liaison',
    description: 'Banking operations and loan management.',
    color: { badge: 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20', dot: 'bg-indigo-600' }
  },
  EXTERNAL_AUDITOR: {
    label: 'External Auditor',
    description: 'Statutory audit and certification scope.',
    color: { badge: 'bg-slate-600/10 text-slate-600 border-slate-600/20', dot: 'bg-slate-600' }
  },
  CRM: {
    label: 'CRM Agent',
    description: 'Sales pipeline and customer support.',
    color: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', dot: 'bg-rose-500' }
  },
  CLIENT: {
    label: 'Client',
    description: 'External customer portal access.',
    color: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dot: 'bg-amber-500' }
  },
  PARTNER: {
    label: 'Partner',
    description: 'Vendor and channel partner collaboration.',
    color: { badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20', dot: 'bg-orange-500' }
  },
  /**
   * §1.2 Data Clerk / Secretary — intra-tenant operational role.
   * Can only input raw item data, log inventory, and draft sales entries.
   */
  DATA_CLERK: {
    label: 'Data Clerk',
    description: 'Data entry: raw items, inventory logging, and draft sales entries only.',
    color: { badge: 'bg-lime-500/10 text-lime-600 border-lime-500/20', dot: 'bg-lime-500' }
  },
  FINANCE: {
    label: 'Finance',
    description: 'Financial planning, budgeting, and treasury oversight.',
    color: { badge: 'bg-teal-500/10 text-teal-500 border-teal-500/20', dot: 'bg-teal-500' }
  },
  SALES: {
    label: 'Sales',
    description: 'Sales operations, customer management, and revenue tracking.',
    color: { badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20', dot: 'bg-sky-500' }
  },
  PURCHASES: {
    label: 'Purchases',
    description: 'Procurement, vendor management, and purchase order processing.',
    color: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dot: 'bg-amber-500' }
  },
  SECURITY: {
    label: 'Security',
    description: 'Physical and digital security operations.',
    color: { badge: 'bg-red-500/10 text-red-500 border-red-500/20', dot: 'bg-red-500' }
  },
  COMPLIANCE: {
    label: 'Compliance',
    description: 'Regulatory compliance, audit coordination, and ethics enforcement.',
    color: { badge: 'bg-teal-500/10 text-teal-500 border-teal-500/20', dot: 'bg-teal-500' }
  },
};

export const RESOURCE_DOMAINS_FLAT: Record<string, Permission[]> = Object.fromEntries(
  Object.entries(RESOURCE_DOMAINS).map(([domain, tiers]) => [
    domain,
    [...tiers.read, ...tiers.write, ...tiers.admin],
  ])
);

export const SENSITIVE_ROUTES_EXTRA: Set<string> = new Set([
  // Additional frontend-only sensitive routes beyond the shared set
  // Add here if needed; prefer editing packages/shared/src/business-roles.ts
]);

export const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  hr: {
    label: 'HR',
    permissions: ['employees:read', 'employees:write', 'employees:delete', 'departments:read', 'departments:write', 'attendance:read', 'attendance:verify', 'leaves:read', 'leaves:write', 'leaves:approve', 'leaves:delete', 'shifts:read', 'shifts:write', 'shifts:delete', 'holidays:read', 'holidays:write', 'holidays:delete', 'enrollment:write'],
  },
  payroll: {
    label: 'Payroll',
    permissions: ['payroll:read', 'payroll:generate', 'payroll:verify', 'payroll:finalize', 'payroll:approve', 'payroll:export', 'payroll:delete', 'payroll:admin'],
  },
  OVDS: {
    label: 'OVDS',
    permissions: ['ovds:read', 'ovds:write', 'ovds:approve', 'ovds:delete', 'invoices:read', 'invoices:write', 'invoices:delete', 'bills:read', 'bills:write', 'bills:delete', 'items:read', 'items:write', 'items:delete', 'expenses:read', 'expenses:write', 'expenses:approve', 'purchase_orders:read', 'purchase_orders:write', 'purchase_orders:approve', 'fixed_assets:read', 'fixed_assets:write', 'fund_transfers:read', 'fund_transfers:write', 'fund_transfers:approve', 'bank_reconciliation:read', 'bank_reconciliation:write', 'period_close:read', 'period_close:write'],
  },
  tax: {
    label: 'Tax',
    permissions: ['vat:read', 'vat:write', 'vat:file', 'vat:calculate', 'vat:delete', 'vat:refund', 'vat:withholding', 'vat:invoice', 'vat:export', 'bit:read', 'bit:write', 'bit:file', 'disaster_fund:read', 'disaster_fund:write', 'disaster_fund:delete'],
  },
  banking: {
    label: 'Banking',
    permissions: ['banking:read', 'banking:write', 'banking:approve', 'banking:loan_application:read', 'banking:loan_application:write', 'banking:loan_application:submit', 'banking:collateral:read', 'banking:collateral:write', 'banking:covenant:read', 'banking:covenant:write', 'banking:kyc:read', 'banking:kyc:write', 'banking:kyc:approve', 'banking:aml:read', 'banking:aml:write', 'banking:aml:flag', 'banking:credit_score:read', 'banking:credit_score:write', 'banking:intercompany:read', 'banking:intercompany:write', 'banking:intercompany:approve', 'banking:fx:read', 'banking:fx:write'],
  },
  audit: {
    label: 'Audit',
    permissions: ['audit_logs:read', 'audit_logs:write', 'audit_outsourcing:read', 'audit_outsourcing:write'],
  },
  external_audit: {
    label: 'External Audit',
    permissions: ['external_audit:read', 'external_audit:write', 'external_audit:certify', 'external_audit:findings:read', 'external_audit:findings:write', 'external_audit:management_letter:read', 'external_audit:management_letter:write'] as Permission[],
  },
  ifrs: {
    label: 'IFRS',
    permissions: ['ifrs:read', 'ifrs:write', 'ifrs:approve', 'ifrs:export', 'ifrs9:ecl:read', 'ifrs9:ecl:write', 'ifrs9:ecl:approve', 'ifrs9:classification:read', 'ifrs9:classification:write', 'ifrs10:consolidation:read', 'ifrs10:consolidation:write', 'ifrs10:consolidation:approve', 'ifrs10:subsidiary:read', 'ifrs10:subsidiary:write', 'ifrs12:disclosure:read', 'ifrs12:disclosure:write', 'ifrs12:disclosure:approve', 'ifrs12:interests:read', 'ifrs12:interests:write', 'ifrs16:leases:read', 'ifrs16:leases:write', 'ifrs16:leases:approve', 'ifrs16:rou_asset:read', 'ifrs16:rou_asset:write', 'ifrs:disclosure:read', 'ifrs:disclosure:write', 'ifrs:checklist:read', 'ifrs:checklist:write', 'ifrs:tier:read', 'ifrs:tier:write'],
  },
  system: {
    label: 'System',
    permissions: ['users:read', 'users:write', 'users:delete', 'audit_logs:read', 'audit_logs:write', 'settings:read', 'settings:write', 'role_permissions:read', 'role_permissions:write', 'notifications:read', 'notifications:write', 'notifications:config', 'api_docs:read', 'api_docs:write', 'apps:read', 'apps:write', 'system:config', 'system:deploy', 'system:monitor', 'api:full', 'sandbox:access'],
  },
};

export interface DomainSummary {
  domain: string;
  granted: Permission[];
  denied: Permission[];
  level: 'none' | 'read' | 'write' | 'admin';
  pct: number;
}

// -- Smart Role Groups (UI specific) -------------------------------------------

export const ROLE_GROUPS: Record<string, { label: string; roles: AppRole[]; color: string; redirect: string }> = {
  system: {
    label: 'System & Security',
    roles: ['SPURADMIN', 'SUPERADMIN', 'DEVELOPER'] as AppRole[],
    color: 'text-rose-500',
    redirect: '/dashboard'
  },
  operations: {
    label: 'Operations & HR',
    roles: ['ADMIN', 'PROJECT_MANAGER', 'HR', 'EMPLOYEE'] as AppRole[],
    color: 'text-slate-500',
    redirect: '/dashboard'
  },
  OVDS: {
    label: 'OVDS & Treasury',
    roles: ['OVDS', 'ACCOUNTING', 'IFRS_OFFICER', 'BANK_LIAISON'] as AppRole[],
    color: 'text-emerald-500',
    redirect: '/dashboard'
  },
  external: {
    label: 'External & Audit',
    roles: ['AUDITOR', 'EXTERNAL_AUDITOR', 'CRM', 'CLIENT', 'PARTNER'] as AppRole[],
    color: 'text-amber-500',
    redirect: '/settings/audit-logs'
  },
  /** §1.2 — Operational data-entry roles */
  operational: {
    label: 'Operational',
    roles: ['DATA_CLERK'] as AppRole[],
    color: 'text-lime-600',
    redirect: '/items'
  }
};
// -- RBAC Engine (Frontend specific wrappers) -----------------------------------

function can(role: AppRole, permission: Permission, context?: PermissionContext, businessType?: string): boolean {
  return hasPermission(role, permission, businessType, context);
}

function canAny(role: AppRole, permissions: Permission[], context?: PermissionContext, businessType?: string): boolean {
  return sharedCanAny(role, permissions, businessType, context);
}

function canAll(role: AppRole, permissions: Permission[], context?: PermissionContext, businessType?: string): boolean {
  return sharedCanAll(role, permissions, businessType, context);
}

function is(role: AppRole, ...targets: AppRole[]): boolean {
  return targets.includes(role);
}

function isAtLeast(role: AppRole, target: AppRole): boolean {
  return sharedIsAtLeast(role, target);
}

function isAbove(role: AppRole, target: AppRole): boolean {
  return sharedIsAbove(role, target);
}

function canAccessRoute(role: AppRole, path: string, businessType?: string): boolean {
  return sharedCanAccessRoute(role, path, businessType);
}

function vatLevel(role: AppRole, businessType?: string): 'none' | 'read' | 'write' | 'admin' {
  return sharedVatLevel(role, businessType);
}

function accessLevel(role: AppRole, resource: string, businessType?: string): 'none' | 'read' | 'write' | 'admin' {
  return sharedAccessLevel(role, resource, businessType);
}

function domainAccessMap(role: AppRole, businessType?: string): Record<string, 'none' | 'read' | 'write' | 'admin'> {
  return Object.fromEntries(
    Object.keys(RESOURCE_DOMAINS).map((domain) => [domain, accessLevel(role, domain, businessType)])
  );
}

function defaultRoute(role: AppRole): string {
  return sharedDefaultRoute(role);
}

function getPermissions(role: AppRole, businessType?: string): Permission[] {
  return sharedGetPermissions(role, businessType);
}

function summary(role: AppRole, businessType?: string): DomainSummary[] {
  return Object.keys(RESOURCE_DOMAINS).map((domain) => {
    const level = accessLevel(role, domain, businessType);
    const tiers = RESOURCE_DOMAINS[domain];
    const granted = getPermissions(role, businessType).filter((p) =>
      [...tiers.read, ...tiers.write, ...tiers.admin].includes(p)
    );
    const denied = [...tiers.read, ...tiers.write, ...tiers.admin].filter(
      (p) => !granted.includes(p)
    );

    const total = tiers.read.length + tiers.write.length + tiers.admin.length;
    const pct = total > 0 ? (granted.length / total) * 100 : 0;

    return { domain, granted, denied, level, pct };
  });
}

function groupOf(role: AppRole): string {
  for (const [groupKey, group] of Object.entries(ROLE_GROUPS)) {
    if ((group.roles as AppRole[]).includes(role)) return groupKey;
  }
  return 'external';
}

function rolesInGroup(groupKey: string): AppRole[] {
  return (ROLE_GROUPS[groupKey]?.roles ?? []) as AppRole[];
}

function hasAnyRole(role: AppRole, ...targets: AppRole[]): boolean {
  return targets.includes(role);
}

function canCrud(role: AppRole, resource: string, action: Parameters<typeof sharedCanCrud>[2], businessType?: string): boolean {
  return sharedCanCrud(role, resource, action, businessType);
}

function rolesWithPermission(permission: Permission, businessType?: string): AppRole[] {
  return (Object.values(Role) as AppRole[]).filter(role =>
    hasPermission(role, permission, businessType)
  );
}

// -- Public RBAC object --------------------------------------------------------

export const rbac = {
  // Core permission checks
  can,
  canAny: (role: AppRole, ps: Permission[], ctx?: PermissionContext, bt?: string) => canAny(role, ps, ctx, bt),
  canAll: (role: AppRole, ps: Permission[], ctx?: PermissionContext, bt?: string) => canAll(role, ps, ctx, bt),
  is,
  isAtLeast,
  isAbove,
  hasAnyRole,
  // Contextual rules metadata
  rules: CONTEXTUAL_RULES,
  // Route access
  canAccessRoute,
  // Access levels
  vatLevel,
  accessLevel,
  domainAccessMap,
  canCrud,
  // Introspection
  permissionsFor: (role: AppRole, businessType?: string) => getPermissions(role, businessType),
  rolesWithPermission,
  summary,
  defaultRoute,
  // Group helpers
  groupOf,
  rolesInGroup,
} as const;
