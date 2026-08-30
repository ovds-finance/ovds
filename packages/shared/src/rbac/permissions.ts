import { Role } from '../types';

// -- Permission type ----------------------------------------------------------
export type Permission =
  | 'employees:read'
  | 'employees:write'
  | 'employees:delete'
  | 'departments:read'
  | 'departments:write'
  | 'attendance:read'
  | 'attendance:write'
  | 'attendance:verify'
  | 'leaves:read_own'
  | 'leaves:write_own'
  | 'leaves:read'
  | 'leaves:write'
  | 'leaves:approve'
  | 'leaves:delete'
  | 'shifts:read'
  | 'shifts:write'
  | 'shifts:delete'
  | 'holidays:read'
  | 'holidays:write'
  | 'holidays:delete'
  | 'enrollment:write'
  | 'payroll:read'
  | 'payroll:write'
  | 'payroll:admin'
  | 'payroll:generate'
  | 'payroll:verify'
  | 'payroll:finalize'
  | 'payroll:approve'
  | 'payroll:export'
  | 'payroll:delete'
  | 'ovds:read'
  | 'ovds:write'
  | 'ovds:approve'
  | 'ovds:delete'
  | 'invoices:read'
  | 'invoices:write'
  | 'invoices:delete'
  | 'bills:read'
  | 'bills:write'
  | 'bills:delete'
  | 'items:read'
  | 'items:write'
  | 'items:delete'
  | 'inventory:read'
  | 'inventory:write'
  | 'expenses:read'
  | 'expenses:write'
  | 'expenses:approve'
  | 'purchase_orders:read'
  | 'purchase_orders:write'
  | 'purchase_orders:approve'
  | 'fixed_assets:read'
  | 'fixed_assets:write'
  | 'fund_transfers:read'
  | 'fund_transfers:write'
  | 'fund_transfers:approve'
  | 'bank_reconciliation:read'
  | 'bank_reconciliation:write'
  | 'bank_statement_import:write'
  | 'period_close:read'
  | 'period_close:write'
  | 'vat:read'
  | 'vat:write'
  | 'vat:file'
  | 'vat:calculate'
  | 'vat:delete'
  | 'vat:refund'
  | 'vat:withholding'
  | 'vat:invoice'
  | 'vat:export'
  | 'bit:read'
  | 'bit:write'
  | 'bit:file'
  | 'disaster_fund:read'
  | 'disaster_fund:write'
  | 'disaster_fund:delete'
  | 'audit_outsourcing:read'
  | 'audit_outsourcing:write'
  | 'ifrs:read'
  | 'ifrs:write'
  | 'ifrs:approve'
  | 'ifrs:export'
  | 'ifrs9:ecl:read'
  | 'ifrs9:ecl:write'
  | 'ifrs9:ecl:approve'
  | 'ifrs9:classification:read'
  | 'ifrs9:classification:write'
  | 'ifrs10:consolidation:read'
  | 'ifrs10:consolidation:write'
  | 'ifrs10:consolidation:approve'
  | 'ifrs10:subsidiary:read'
  | 'ifrs10:subsidiary:write'
  | 'ifrs12:disclosure:read'
  | 'ifrs12:disclosure:write'
  | 'ifrs12:disclosure:approve'
  | 'ifrs12:interests:read'
  | 'ifrs12:interests:write'
  | 'ifrs16:leases:read'
  | 'ifrs16:leases:write'
  | 'ifrs16:leases:approve'
  | 'ifrs16:rou_asset:read'
  | 'ifrs16:rou_asset:write'
  | 'ifrs:disclosure:read'
  | 'ifrs:disclosure:write'
  | 'ifrs:checklist:read'
  | 'ifrs:checklist:write'
  | 'ifrs:tier:read'
  | 'ifrs:tier:write'
  | 'banking:read'
  | 'banking:write'
  | 'banking:approve'
  | 'banking:loan_application:read'
  | 'banking:loan_application:write'
  | 'banking:loan_application:submit'
  | 'banking:collateral:read'
  | 'banking:collateral:write'
  | 'banking:covenant:read'
  | 'banking:covenant:write'
  | 'banking:kyc:read'
  | 'banking:kyc:write'
  | 'banking:kyc:approve'
  | 'banking:aml:read'
  | 'banking:aml:write'
  | 'banking:aml:flag'
  | 'banking:credit_score:read'
  | 'banking:credit_score:write'
  | 'banking:intercompany:read'
  | 'banking:intercompany:write'
  | 'banking:intercompany:approve'
  | 'banking:fx:read'
  | 'banking:fx:write'
  | 'external_audit:read'
  | 'external_audit:write'
  | 'external_audit:certify'
  | 'external_audit:findings:read'
  | 'external_audit:findings:write'
  | 'external_audit:management_letter:read'
  | 'external_audit:management_letter:write'
  | 'crm:read'
  | 'crm:write'
  | 'loyalty:read'
  | 'crm:contacts:read'
  | 'crm:contacts:write'
  | 'crm:companies:read'
  | 'crm:companies:write'
  | 'crm:deals:read'
  | 'crm:deals:write'
  | 'crm:activities:read'
  | 'crm:activities:write'
  | 'crm:reports:read'
  | 'crm:settings:read'
  | 'crm:settings:write'
  | 'reports:read'
  | 'reports:write'
  | 'reports:financial:read'
  | 'reports:financial:full'
  | 'reports:bs:read'
  | 'reports:pl:read'
  | 'reports:gl:read'
  | 'reports:cf:read'
  | 'reports:custom:read'
  | 'reports:custom:write'
  | 'insights:read'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'audit_logs:read'
  | 'audit_logs:write'
  | 'settings:read'
  | 'settings:write'
  | 'companies:read'
  | 'companies:write'
  | 'companies:delete'
  | 'role_permissions:read'
  | 'role_permissions:write'
  | 'notifications:read'
  | 'notifications:write'
  | 'notifications:config'
  | 'api_docs:read'
  | 'api_docs:write'
  | 'apps:read'
  | 'apps:write'
  | 'apps:admin'
  | 'system:config'
  | 'system:deploy'
  | 'system:monitor'
  | 'api:full'
  | 'sandbox:access'
  | 'onboarding:read'
  | 'onboarding:write'
  | 'partnerships:read'
  | 'partnerships:write'
  | 'investments:read'
  | 'investments:write'
  | 'business_loans:read'
  | 'business_loans:write'
  | 'business_loans:approve'
  | 'projects:read'
  | 'projects:write'
  | 'projects:delete'
  | 'milestones:read'
  | 'milestones:write'
  | 'import_center:write'
  | 'iot:read'
  | 'iot:write'
  | 'iot:delete'
   | 'etax:submit'
   | 'eims:submit'
   | 'eims:bulk:submit'
   | 'eims:cancel'
   | 'eims:bulk:cancel'
   | 'eims:verify'
   | 'eims:retry'
   | 'eims:certificates'
   | 'eims:source_systems'
   | 'eims:compliance'
   | 'eims:callback'
   | 'device_control:read'
  | 'device_control:propose'
  | 'device_control:approve'
  | 'node:manage'
  | 'manufacturing:read';

// -- Permission Context --------------------------------------------------------
export interface PermissionContext {
  amount?: number; // e.g. "can approve if amount < 1,000,000"
  status?: string; // e.g. "can edit only if status is DRAFT"
  companyId?: string; // e.g. multi-tenant boundary
  departmentId?: string; // e.g. departmental boundary
  time?: Date; // e.g. business hours only
  isOwner?: boolean; // e.g. can delete only if owned by user
}

export type ContextualRule = (
  role: Role,
  context: PermissionContext,
) => boolean;

export type RolePreset = {
  label: string;
  description: string;
  baseRole: Role;
  extraPermissions: Permission[];
  appAccess: Record<string, 'none' | 'read' | 'write' | 'admin'>;
};

export type PermissionAccess = 'GRANT' | 'DENY';

export interface RolePermissionOverride {
  role: string;
  permission: string;
  access: PermissionAccess;
}

export interface PermissionOverrides {
  grant: Set<string>;
  deny: Set<string>;
}

/** Group a permission into a CRUD bucket for UI matrix presentation. */
export type PermissionCategory = 'view' | 'create' | 'edit' | 'delete' | 'approve';
export const VIEW: PermissionCategory = 'view';
export const CREATE: PermissionCategory = 'create';
export const EDIT: PermissionCategory = 'edit';
export const DELETE: PermissionCategory = 'delete';
export const APPROVE: PermissionCategory = 'approve';

export interface PermissionTier {
  view: Permission[];
  create: Permission[];
  edit: Permission[];
  delete: Permission[];
  approve: Permission[];
}

export interface PermissionDomainCatalog {
  key: string;
  label: string;
  permissions: PermissionTier;
}
