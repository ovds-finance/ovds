import { Role } from '../types';
import { Permission, RolePreset } from './permissions';
import { hasPermission, ROLE_PERMISSIONS } from './role-permissions';

export const ROLE_PRESETS: Record<string, RolePreset> = {
  MANAGER: {
    label: 'Manager',
    description: 'Operational oversight and team coordination.',
    baseRole: Role.ADMIN,
    extraPermissions: [
      'projects:read', 'projects:write', 'projects:delete',
      'milestones:read', 'milestones:write',
      'employees:read', 'departments:read', 'attendance:read',
      'reports:read', 'insights:read',
      'items:read', 'inventory:read',
      'invoices:read',
      'notifications:read',
    ],
    appAccess: {
      'hr': 'admin', 'payroll': 'read', 'inventory': 'admin',
      'ovds': 'read', 'tax': 'read', 'reports': 'admin',
      'crm': 'read', 'projects': 'admin', 'iot': 'read',
    },
  },
  ACCOUNTANT: {
    label: 'Accountant',
    description: 'Daily bookkeeping, invoice, and tax compliance.',
    baseRole: Role.ACCOUNTING,
    extraPermissions: [
      'ovds:read', 'ovds:write',
      'invoices:read', 'invoices:write', 'invoices:delete',
      'bills:read', 'bills:write', 'bills:delete',
      'items:read', 'items:write', 'items:delete',
      'inventory:read', 'inventory:write',
      'vat:read', 'vat:write', 'vat:calculate', 'vat:invoice', 'vat:export',
      'vat:delete', 'vat:refund',
      'bit:read', 'bit:write', 'bit:file',
      'disaster_fund:read', 'disaster_fund:write', 'disaster_fund:delete',
      'expenses:read', 'expenses:write', 'expenses:approve',
      'purchase_orders:read', 'purchase_orders:write', 'purchase_orders:approve',
      'fixed_assets:read', 'fixed_assets:write',
      'fund_transfers:read', 'fund_transfers:write',
      'bank_reconciliation:read', 'bank_reconciliation:write',
      'bank_statement_import:write',
      'period_close:read', 'period_close:write',
      'payroll:read', 'payroll:approve',
      'reports:read', 'reports:financial:read',
      'insights:read',
      'reports:bs:read', 'reports:pl:read', 'reports:gl:read', 'reports:cf:read',
      'notifications:read', 'settings:read',
      'ifrs:read',
      'ifrs9:ecl:read', 'ifrs9:ecl:write',
      'ifrs9:classification:read', 'ifrs9:classification:write',
      'ifrs16:leases:read', 'ifrs16:leases:write',
      'ifrs16:rou_asset:read', 'ifrs16:rou_asset:write',
      'ifrs:disclosure:read', 'ifrs:checklist:read', 'ifrs:tier:read',
      'banking:read',
      'banking:loan_application:read',
      'banking:collateral:read', 'banking:kyc:read',
      'banking:credit_score:read', 'banking:intercompany:read',
      'banking:fx:read', 'banking:fx:write',
    ],
    appAccess: {
      'hr': 'read', 'payroll': 'read', 'inventory': 'write',
      'ovds': 'admin', 'tax': 'admin', 'reports': 'read',
      'crm': 'read', 'projects': 'read', 'banking': 'read',
      'ifrs': 'read', 'audit': 'read',
    },
  },
  EMPLOYEE: {
    label: 'Employee',
    description: 'Self-service workspace and personal records.',
    baseRole: Role.EMPLOYEE,
    extraPermissions: [
      'leaves:read_own', 'leaves:write_own',
      'attendance:read', 'holidays:read', 'shifts:read',
      'departments:read', 'payroll:read', 'payroll:export',
      'expenses:read', 'expenses:write',
      'notifications:read', 'settings:read',
      'reports:read',
    ],
    appAccess: {
      'hr': 'read', 'payroll': 'read',
      'ovds': 'none', 'tax': 'none', 'reports': 'read',
      'crm': 'none', 'projects': 'none',
    },
  },
  CUSTOMER: {
    label: 'Customer',
    description: 'External customer portal access.',
    baseRole: Role.CLIENT,
    extraPermissions: [
      'invoices:read',
      'notifications:read',
    ],
    appAccess: {
      'hr': 'none', 'payroll': 'none',
      'ovds': 'read', 'tax': 'none', 'reports': 'none',
      'crm': 'read', 'projects': 'none',
    },
  },
  VENDOR: {
    label: 'Vendor',
    description: 'Vendor portal access for bills and purchase orders.',
    baseRole: Role.CLIENT,
    extraPermissions: [
      'bills:read', 'purchase_orders:read',
      'notifications:read',
    ],
    appAccess: {
      'hr': 'none', 'payroll': 'none',
      'ovds': 'read', 'tax': 'none', 'reports': 'none',
      'crm': 'none', 'projects': 'none',
    },
  },
  DATA_CLERK: {
    label: 'Data Clerk',
    description: 'Data entry: raw items, inventory logging, and draft sales entries only.',
    baseRole: Role.DATA_CLERK,
    extraPermissions: [
      'items:read', 'items:write',
      'inventory:read', 'inventory:write',
      'invoices:read', 'invoices:write',
      'crm:contacts:read', 'crm:read',
      'notifications:read',
    ],
    appAccess: {
      'hr': 'none', 'payroll': 'none',
      'ovds': 'read', 'tax': 'none', 'reports': 'none',
      'crm': 'read', 'projects': 'none', 'inventory': 'write',
    },
  },
};

export const APP_ACCESS_LEVELS = ['none', 'read', 'write', 'admin'] as const;
export type AppAccessLevel = typeof APP_ACCESS_LEVELS[number];

export const APP_ACCESS_PERMISSIONS: Record<string, Permission[]> = {
  none: [],
  read: ['apps:read'],
  write: ['apps:read', 'apps:write'],
  admin: ['apps:read', 'apps:write', 'apps:admin'],
};

export function canAccessApp(
  role: Role,
  appKey: string,
  accessLevel: AppAccessLevel,
  businessType?: string,
): boolean {
  if (role === Role.SPURADMIN || role === Role.SUPERADMIN) return true;

  const requiredPerms = APP_ACCESS_PERMISSIONS[accessLevel] ?? [];
  if (requiredPerms.length === 0) return false;

  return requiredPerms.some(p => hasPermission(role, p, businessType));
}

export function appAccessForPreset(
  presetKey: string,
  appKey: string,
): AppAccessLevel {
  const preset = ROLE_PRESETS[presetKey];
  if (!preset) return 'none';
  return preset.appAccess[appKey] ?? 'none';
}

export function getRolePresetPermissions(presetKey: string): Permission[] {
  const preset = ROLE_PRESETS[presetKey];
  if (!preset) return [];
  const basePerms = ROLE_PERMISSIONS[preset.baseRole] ?? [];
  const allPerms = new Set<Permission>([...basePerms, ...preset.extraPermissions]);
  return Array.from(allPerms);
}

export function getRolePreset(presetKey: string): RolePreset | undefined {
  return ROLE_PRESETS[presetKey];
}

export function getAllRolePresets(): Record<string, RolePreset> {
  return { ...ROLE_PRESETS };
}

/**
 * Presets exposed to the UI for one-click role authoring.
 * Maps the business labels (Manager, Accountant, Employee, Customer) to
 * ROLE_PRESETS entries already defined above.
 */
export interface PresetMeta {
  key: string;
  label: string;
  description: string;
  baseRole: Role;
  appAccess: Record<string, AppAccessLevel>;
}

export const PRESET_META: PresetMeta[] = (Object.keys(ROLE_PRESETS) as string[])
  .map((key) => {
    const p = ROLE_PRESETS[key as keyof typeof ROLE_PRESETS];
    return {
      key,
      label: p.label,
      description: p.description,
      baseRole: p.baseRole,
      appAccess: p.appAccess,
    };
  });
