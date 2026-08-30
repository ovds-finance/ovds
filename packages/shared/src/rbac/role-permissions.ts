import { Role } from '../types';
import { BUSINESS_MODULE_MAP } from '../constants';
import {
  Permission,
  PermissionContext,
  PermissionCategory,
  PermissionTier,
  PermissionDomainCatalog,
  RolePermissionOverride,
  VIEW,
  CREATE,
  EDIT,
  DELETE,
  APPROVE,
} from './permissions';
import { CONTEXTUAL_RULES } from './contextual-rules';
import { RESOURCE_DOMAINS } from './resource-domains';
import { ROUTE_POLICY, DEFAULT_ROUTE } from './route-policy';
import { ROLE_PRESETS, getRolePresetPermissions } from './role-presets';

// -- Role Hierarchy (higher = more privileged) ---------------------------------

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SPURADMIN]: 200,
  [Role.SUPERADMIN]: 190,
  [Role.DEVELOPER]: 150,
  [Role.ADMIN]: 100,
  [Role.PROJECT_MANAGER]: 80,
  [Role.OVDS]: 60,
  [Role.ACCOUNTING]: 55,
  [Role.IFRS_OFFICER]: 52,
  [Role.HR]: 50,
  [Role.FINANCE]: 48,
  [Role.SALES]: 45,
  [Role.PURCHASES]: 45,
  [Role.SECURITY]: 42,
  [Role.COMPLIANCE]: 40,
  [Role.AUDITOR]: 30,
  [Role.EXTERNAL_AUDITOR]: 28,
  [Role.BANK_LIAISON]: 25,
  [Role.CRM]: 25,
  [Role.PARTNER]: 20,
  [Role.EMPLOYEE]: 10,
  [Role.DATA_CLERK]: 8,
  [Role.CLIENT]: 5,
};

// -- Role → Permissions map ----------------------------------------------------
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SPURADMIN]: [] as Permission[], // bypass — engine returns true
  [Role.SUPERADMIN]: [] as Permission[], // bypass — engine returns true

  [Role.DEVELOPER]: [
    'system:config',
    'system:deploy',
    'system:monitor',
    'api:full',
    'api_docs:read',
    'api_docs:write',
    'sandbox:access',
    'audit_logs:read',
    'settings:read',
    'apps:read',
    'apps:write',
    'apps:admin',
    'reports:read',
    'insights:read',
  ],

  [Role.ADMIN]: [
    'users:read',
    'users:write',
    'users:delete',
    'settings:read',
    'settings:write',
    'role_permissions:read',
    'role_permissions:write',
    'notifications:read',
    'notifications:write',
    'notifications:config',
    'audit_logs:read',
    'apps:read',
    'apps:write',
    'apps:admin',
    'companies:read',
    'companies:write',
    'onboarding:read',
    'onboarding:write',
    'employees:read',
    'departments:read',
    'attendance:read',
    'leaves:read',
    'shifts:read',
    'holidays:read',
    'payroll:read',
    'ovds:read',
    'ovds:write',
    'invoices:read',
    'invoices:write',
    'bills:read',
    'items:read',
    'inventory:read',
    'reports:read',
    'reports:financial:read',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'vat:read',
    'bit:read',
    'disaster_fund:read',
    'audit_outsourcing:read',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'projects:read',
    'projects:write',
    'projects:delete',
    'milestones:read',
    'milestones:write',
    'crm:read',
    'loyalty:read',
    'crm:contacts:read',
    'crm:companies:read',
    'crm:deals:read',
    'crm:activities:read',
    'crm:reports:read',
    'import_center:write',
    'iot:read',
    'iot:write',
    'device_control:read',
    'device_control:propose',
    'device_control:approve',
  ],

  [Role.PROJECT_MANAGER]: [
    'projects:read',
    'projects:write',
    'projects:delete',
    'milestones:read',
    'milestones:write',
    'employees:read',
    'departments:read',
    'attendance:read',
    'leaves:read',
    'ovds:read',
    'reports:read',
    'insights:read',
    'items:read',
    'inventory:read',
    'invoices:read',
    'notifications:read',
    'apps:read',
    'apps:write',
  ],

  [Role.HR]: [
    'employees:read',
    'employees:write',
    'employees:delete',
    'departments:read',
    'departments:write',
    'attendance:read',
    'attendance:write',
    'attendance:verify',
    'leaves:read',
    'leaves:write',
    'leaves:approve',
    'leaves:delete',
    'shifts:read',
    'shifts:write',
    'shifts:delete',
    'holidays:read',
    'holidays:write',
    'holidays:delete',
    'enrollment:write',
    'payroll:read',
    'payroll:generate',
    'payroll:verify',
    'payroll:finalize',
    'payroll:export',
    'payroll:admin',
    'ovds:read',
    'reports:read',
    'insights:read',
    'notifications:read',
    'settings:read',
    'apps:read',
    'apps:write',
  ],

  [Role.EMPLOYEE]: [
    'leaves:read_own',
    'leaves:write_own',
    'attendance:read',
    'holidays:read',
    'shifts:read',
    'departments:read',
    'payroll:read',
    'payroll:export',
    'expenses:read',
    'expenses:write',
    'notifications:read',
    'settings:read',
    'reports:read',
    'apps:read',
  ],

  [Role.OVDS]: [
    'ovds:read',
    'ovds:write',
    'ovds:approve',
    'ovds:delete',
    'invoices:read',
    'invoices:write',
    'invoices:delete',
    'bills:read',
    'bills:write',
    'bills:delete',
    'items:read',
    'items:write',
    'items:delete',
    'inventory:read',
    'inventory:write',
    'vat:read',
    'vat:write',
    'vat:file',
    'vat:calculate',
    'vat:delete',
    'vat:refund',
    'vat:withholding',
    'vat:invoice',
    'vat:export',
    'bit:read',
    'bit:write',
    'bit:file',
    'disaster_fund:read',
    'disaster_fund:write',
    'disaster_fund:delete',
    'expenses:read',
    'expenses:write',
    'expenses:approve',
    'purchase_orders:read',
    'purchase_orders:write',
    'purchase_orders:approve',
    'fixed_assets:read',
    'fixed_assets:write',
    'fund_transfers:read',
    'fund_transfers:write',
    'fund_transfers:approve',
    'bank_reconciliation:read',
    'bank_reconciliation:write',
    'bank_statement_import:write',
    'period_close:read',
    'period_close:write',
    'payroll:read',
    'payroll:approve',
    'payroll:finalize',
    'payroll:export',
    'reports:read',
    'reports:financial:read',
    'reports:financial:full',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'reports:custom:read',
    'reports:custom:write',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'business_loans:write',
    'business_loans:approve',
    'notifications:read',
    'settings:read',
    'audit_outsourcing:read',
    'ifrs:read',
    'ifrs:approve',
    'ifrs:export',
    'ifrs9:ecl:read',
    'ifrs9:ecl:approve',
    'ifrs9:classification:read',
    'ifrs10:consolidation:read',
    'ifrs10:consolidation:approve',
    'ifrs10:subsidiary:read',
    'ifrs12:disclosure:read',
    'ifrs12:disclosure:approve',
    'ifrs12:interests:read',
    'ifrs16:leases:read',
    'ifrs16:leases:approve',
    'ifrs16:rou_asset:read',
    'ifrs:disclosure:read',
    'ifrs:checklist:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:approve',
    'banking:loan_application:read',
    'banking:loan_application:submit',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:aml:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:intercompany:approve',
    'banking:fx:read',
    'import_center:write',
    'iot:read',
    'iot:write',
    'iot:delete',
    'etax:submit',
    'eims:submit',
    'eims:bulk:submit',
    'eims:cancel',
    'eims:bulk:cancel',
    'eims:verify',
    'eims:retry',
    'eims:certificates',
    'eims:source_systems',
    'eims:compliance',
    'eims:callback',
    'apps:read',
    'apps:write',
  ],

  [Role.FINANCE]: [
    'ovds:read',
    'ovds:write',
    'invoices:read',
    'invoices:write',
    'bills:read',
    'bills:write',
    'items:read',
    'items:write',
    'inventory:read',
    'inventory:write',
    'vat:read',
    'vat:write',
    'vat:calculate',
    'vat:invoice',
    'vat:export',
    'vat:refund',
    'vat:delete',
    'bit:read',
    'bit:write',
    'disaster_fund:read',
    'disaster_fund:write',
    'expenses:read',
    'expenses:write',
    'expenses:approve',
    'purchase_orders:read',
    'purchase_orders:write',
    'fixed_assets:read',
    'fixed_assets:write',
    'fund_transfers:read',
    'fund_transfers:write',
    'bank_reconciliation:read',
    'bank_reconciliation:write',
    'bank_statement_import:write',
    'period_close:read',
    'period_close:write',
    'payroll:read',
    'payroll:approve',
    'reports:read',
    'reports:financial:read',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'notifications:read',
    'settings:read',
    'ifrs:read',
    'ifrs9:ecl:read',
    'ifrs9:ecl:write',
    'ifrs9:classification:read',
    'ifrs9:classification:write',
    'ifrs16:leases:read',
    'ifrs16:leases:write',
    'ifrs16:rou_asset:read',
    'ifrs16:rou_asset:write',
    'ifrs:disclosure:read',
    'ifrs:checklist:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:kyc:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'banking:fx:write',
    'apps:read',
    'apps:write',
    'eims:submit',
    'eims:bulk:submit',
    'eims:verify',
    'eims:retry',
    'eims:compliance',
    'eims:callback',
  ],

  [Role.SALES]: [
    'ovds:read',
    'invoices:read',
    'invoices:write',
    'invoices:delete',
    'bills:read',
    'items:read',
    'inventory:read',
    'vat:read',
    'bit:read',
    'disaster_fund:read',
    'expenses:read',
    'purchase_orders:read',
    'fixed_assets:read',
    'fund_transfers:read',
    'bank_reconciliation:read',
    'period_close:read',
    'payroll:read',
    'reports:read',
    'reports:financial:read',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'notifications:read',
    'settings:read',
    'crm:read',
    'crm:write',
    'loyalty:read',
    'crm:contacts:read',
    'crm:contacts:write',
    'crm:companies:read',
    'crm:companies:write',
    'crm:deals:read',
    'crm:deals:write',
    'crm:activities:read',
    'crm:activities:write',
    'crm:reports:read',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'audit_outsourcing:read',
    'ifrs:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:aml:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'apps:read',
    'apps:write',
  ],

  [Role.PURCHASES]: [
    'ovds:read',
    'invoices:read',
    'bills:read',
    'bills:write',
    'bills:delete',
    'items:read',
    'items:write',
    'inventory:read',
    'inventory:write',
    'vat:read',
    'bit:read',
    'disaster_fund:read',
    'expenses:read',
    'expenses:write',
    'purchase_orders:read',
    'purchase_orders:write',
    'purchase_orders:approve',
    'fixed_assets:read',
    'fund_transfers:read',
    'bank_reconciliation:read',
    'period_close:read',
    'payroll:read',
    'reports:read',
    'reports:financial:read',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'notifications:read',
    'settings:read',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'audit_outsourcing:read',
    'ifrs:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:aml:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'apps:read',
    'apps:write',
  ],

  [Role.SECURITY]: [
    'ovds:read',
    'invoices:read',
    'bills:read',
    'items:read',
    'vat:read',
    'bit:read',
    'disaster_fund:read',
    'expenses:read',
    'purchase_orders:read',
    'fixed_assets:read',
    'fund_transfers:read',
    'bank_reconciliation:read',
    'period_close:read',
    'payroll:read',
    'reports:read',
    'reports:financial:read',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'notifications:read',
    'settings:read',
    'audit_logs:read',
    'audit_logs:write',
    'audit_outsourcing:read',
    'audit_outsourcing:write',
    'users:read',
    'companies:read',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'inventory:read',
    'crm:read',
    'loyalty:read',
    'crm:contacts:read',
    'crm:companies:read',
    'crm:deals:read',
    'crm:activities:read',
    'crm:reports:read',
    'ifrs:read',
    'ifrs:export',
    'ifrs9:ecl:read',
    'ifrs9:classification:read',
    'ifrs10:consolidation:read',
    'ifrs10:subsidiary:read',
    'ifrs12:disclosure:read',
    'ifrs12:interests:read',
    'ifrs16:leases:read',
    'ifrs16:rou_asset:read',
    'ifrs:disclosure:read',
    'ifrs:checklist:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:aml:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'external_audit:read',
    'external_audit:write',
    'external_audit:certify',
    'external_audit:findings:read',
    'external_audit:findings:write',
    'external_audit:management_letter:read',
    'external_audit:management_letter:write',
    'apps:read',
  ],

  [Role.COMPLIANCE]: [
    'ovds:read',
    'invoices:read',
    'bills:read',
    'items:read',
    'vat:read',
    'bit:read',
    'disaster_fund:read',
    'expenses:read',
    'purchase_orders:read',
    'fixed_assets:read',
    'fund_transfers:read',
    'bank_reconciliation:read',
    'period_close:read',
    'payroll:read',
    'reports:read',
    'reports:financial:read',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'notifications:read',
    'settings:read',
    'audit_outsourcing:read',
    'audit_outsourcing:write',
    'audit_logs:read',
    'audit_logs:write',
    'ifrs:read',
    'ifrs:export',
    'ifrs9:ecl:read',
    'ifrs9:classification:read',
    'ifrs10:consolidation:read',
    'ifrs10:subsidiary:read',
    'ifrs12:disclosure:read',
    'ifrs12:interests:read',
    'ifrs16:leases:read',
    'ifrs16:rou_asset:read',
    'ifrs:disclosure:read',
    'ifrs:checklist:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:aml:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'eims:compliance',
    'eims:submit',
    'eims:bulk:submit',
    'eims:cancel',
    'eims:bulk:cancel',
    'eims:verify',
    'eims:retry',
    'eims:certificates',
    'eims:source_systems',
    'eims:callback',
    'external_audit:read',
    'external_audit:write',
    'external_audit:certify',
    'external_audit:findings:read',
    'external_audit:findings:write',
    'external_audit:management_letter:read',
    'external_audit:management_letter:write',
    'companies:read',
    'users:read',
    'apps:read',
  ],

  [Role.ACCOUNTING]: [
    'ovds:read',
    'ovds:write',
    'invoices:read',
    'invoices:write',
    'bills:read',
    'bills:write',
    'items:read',
    'items:write',
    'inventory:read',
    'vat:read',
    'vat:write',
    'vat:calculate',
    'vat:invoice',
    'vat:export',
    'vat:refund',
    'vat:delete',
    'bit:read',
    'disaster_fund:read',
    'disaster_fund:write',
    'expenses:read',
    'expenses:write',
    'purchase_orders:read',
    'fixed_assets:read',
    'fixed_assets:write',
    'fund_transfers:read',
    'fund_transfers:write',
    'bank_reconciliation:read',
    'bank_reconciliation:write',
    'bank_statement_import:write',
    'period_close:read',
    'period_close:write',
    'payroll:read',
    'payroll:approve',
    'reports:read',
    'reports:financial:read',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'notifications:read',
    'settings:read',
    'ifrs:read',
    'ifrs9:ecl:read',
    'ifrs9:ecl:write',
    'ifrs9:classification:read',
    'ifrs9:classification:write',
    'ifrs16:leases:read',
    'ifrs16:leases:write',
    'ifrs16:rou_asset:read',
    'ifrs16:rou_asset:write',
    'ifrs:disclosure:read',
    'ifrs:checklist:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:kyc:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'banking:fx:write',
    'apps:read',
    'apps:write',
  ],

  [Role.AUDITOR]: [
    'employees:read',
    'departments:read',
    'attendance:read',
    'leaves:read',
    'shifts:read',
    'holidays:read',
    'payroll:read',
    'payroll:export',
    'ovds:read',
    'invoices:read',
    'bills:read',
    'items:read',
    'vat:read',
    'vat:export',
    'bit:read',
    'disaster_fund:read',
    'expenses:read',
    'purchase_orders:read',
    'fixed_assets:read',
    'fund_transfers:read',
    'bank_reconciliation:read',
    'period_close:read',
    'reports:read',
    'reports:financial:read',
    'reports:financial:full',
    'insights:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'reports:custom:read',
    'audit_logs:read',
    'audit_logs:write',
    'audit_outsourcing:read',
    'audit_outsourcing:write',
    'users:read',
    'settings:read',
    'companies:read',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'inventory:read',
    'crm:read',
    'loyalty:read',
    'crm:contacts:read',
    'crm:companies:read',
    'crm:deals:read',
    'crm:activities:read',
    'crm:reports:read',
    'notifications:read',
    'ifrs:read',
    'ifrs:export',
    'ifrs9:ecl:read',
    'ifrs9:classification:read',
    'ifrs10:consolidation:read',
    'ifrs10:subsidiary:read',
    'ifrs12:disclosure:read',
    'ifrs12:interests:read',
    'ifrs16:leases:read',
    'ifrs16:rou_asset:read',
    'ifrs:disclosure:read',
    'ifrs:checklist:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:aml:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'apps:read',
  ],

  [Role.IFRS_OFFICER]: [
    'ovds:read',
    'invoices:read',
    'bills:read',
    'items:read',
    'fixed_assets:read',
    'fixed_assets:write',
    'bank_reconciliation:read',
    'period_close:read',
    'reports:read',
    'reports:financial:read',
    'reports:financial:full',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'reports:custom:read',
    'inventory:read',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'audit_outsourcing:read',
    'audit_logs:read',
    'settings:read',
    'notifications:read',
    'ifrs:read',
    'ifrs:write',
    'ifrs:export',
    'ifrs9:ecl:read',
    'ifrs9:ecl:write',
    'ifrs9:classification:read',
    'ifrs9:classification:write',
    'ifrs10:consolidation:read',
    'ifrs10:consolidation:write',
    'ifrs10:subsidiary:read',
    'ifrs10:subsidiary:write',
    'ifrs12:disclosure:read',
    'ifrs12:disclosure:write',
    'ifrs12:interests:read',
    'ifrs12:interests:write',
    'ifrs16:leases:read',
    'ifrs16:leases:write',
    'ifrs16:rou_asset:read',
    'ifrs16:rou_asset:write',
    'ifrs:disclosure:read',
    'ifrs:disclosure:write',
    'ifrs:checklist:read',
    'ifrs:checklist:write',
    'ifrs:tier:read',
    'ifrs:tier:write',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'banking:fx:write',
    'apps:read',
    'apps:write',
  ],

  [Role.BANK_LIAISON]: [
    'ovds:read',
    'invoices:read',
    'bills:read',
    'reports:read',
    'reports:financial:read',
    'reports:bs:read',
    'reports:pl:read',
    'reports:cf:read',
    'partnerships:read',
    'partnerships:write',
    'investments:read',
    'investments:write',
    'fund_transfers:approve',
    'business_loans:read',
    'business_loans:write',
    'audit_logs:read',
    'notifications:read',
    'settings:read',
    'ifrs:read',
    'ifrs9:ecl:read',
    'ifrs9:classification:read',
    'ifrs10:consolidation:read',
    'ifrs10:subsidiary:read',
    'ifrs12:interests:read',
    'ifrs16:leases:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:write',
    'banking:loan_application:read',
    'banking:loan_application:write',
    'banking:loan_application:submit',
    'banking:collateral:read',
    'banking:collateral:write',
    'banking:covenant:read',
    'banking:covenant:write',
    'banking:kyc:read',
    'banking:kyc:write',
    'banking:aml:read',
    'banking:aml:write',
    'banking:aml:flag',
    'banking:credit_score:read',
    'banking:credit_score:write',
    'banking:intercompany:read',
    'banking:intercompany:write',
    'banking:fx:read',
    'apps:read',
    'apps:write',
  ],

  [Role.EXTERNAL_AUDITOR]: [
    'ovds:read',
    'invoices:read',
    'bills:read',
    'items:read',
    'vat:read',
    'vat:export',
    'bit:read',
    'disaster_fund:read',
    'expenses:read',
    'purchase_orders:read',
    'fixed_assets:read',
    'fund_transfers:read',
    'bank_reconciliation:read',
    'period_close:read',
    'payroll:read',
    'payroll:export',
    'reports:read',
    'reports:financial:read',
    'reports:financial:full',
    'reports:bs:read',
    'reports:pl:read',
    'reports:gl:read',
    'reports:cf:read',
    'reports:custom:read',
    'inventory:read',
    'partnerships:read',
    'investments:read',
    'business_loans:read',
    'audit_logs:read',
    'companies:read',
    'settings:read',
    'notifications:read',
    'ifrs:read',
    'ifrs:export',
    'ifrs9:ecl:read',
    'ifrs9:classification:read',
    'ifrs10:consolidation:read',
    'ifrs10:subsidiary:read',
    'ifrs12:disclosure:read',
    'ifrs12:disclosure:write',
    'ifrs12:interests:read',
    'ifrs16:leases:read',
    'ifrs16:rou_asset:read',
    'ifrs:disclosure:read',
    'ifrs:disclosure:write',
    'ifrs:checklist:read',
    'ifrs:tier:read',
    'banking:read',
    'banking:loan_application:read',
    'banking:collateral:read',
    'banking:covenant:read',
    'banking:kyc:read',
    'banking:aml:read',
    'banking:credit_score:read',
    'banking:intercompany:read',
    'banking:fx:read',
    'external_audit:read',
    'external_audit:write',
    'external_audit:certify',
    'external_audit:findings:read',
    'external_audit:findings:write',
    'external_audit:management_letter:read',
    'external_audit:management_letter:write',
    'apps:read',
  ],

  [Role.CRM]: [
    'crm:read',
    'crm:write',
    'loyalty:read',
    'crm:contacts:read',
    'crm:contacts:write',
    'crm:companies:read',
    'crm:companies:write',
    'crm:deals:read',
    'crm:deals:write',
    'crm:activities:read',
    'crm:activities:write',
    'crm:reports:read',
    'crm:settings:read',
    'crm:settings:write',
    'invoices:read',
    'items:read',
    'reports:read',
    'notifications:read',
    'apps:read',
    'apps:write',
  ],

  [Role.CLIENT]: ['invoices:read', 'notifications:read'],

  [Role.PARTNER]: ['partnerships:read', 'invoices:read', 'notifications:read'],

  /**
   * DATA_CLERK (Secretary) — Intra-tenant operational role.
   * Requirement §1.2: Permitted only to input raw item data, log inventory,
   * and draft sales entries. Cannot approve, access ledgers, or file taxes.
   */
  [Role.DATA_CLERK]: [
    // Inventory & item data entry
    'items:read',
    'items:write',
    'inventory:read',
    'inventory:write',
    // Draft invoice / sales entry only (contextual rule prevents posting)
    'invoices:read',
    'invoices:write',
    // Read-only access to customers (needed for draft invoices)
    'crm:contacts:read',
    'crm:read',
    // Notifications
    'notifications:read',
    'apps:read',
  ],
};

// -- Permission → Module mapping -----------------------------------------------
export const PERMISSION_MODULE_MAP: Record<string, string> = {
  employees: 'hr',
  departments: 'hr',
  attendance: 'hr',
  leaves: 'hr',
  shifts: 'hr',
  holidays: 'hr',
  enrollment: 'hr',
  payroll: 'payroll',
  ovds: 'ovds',
  invoices: 'ovds',
  bills: 'ovds',
  items: 'ovds',
  inventory: 'inventory',
  expenses: 'ovds',
  purchase_orders: 'ovds',
  fixed_assets: 'ovds',
  fund_transfers: 'ovds',
  bank_reconciliation: 'ovds',
  bank_statement_import: 'ovds',
  period_close: 'ovds',
  vat: 'tax',
  bit: 'tax',
  disaster_fund: 'tax',
  audit_outsourcing: 'audit',
  external_audit: 'audit',
  audit_logs: 'audit',
  ifrs: 'ifrs',
  ifrs9: 'ifrs',
  ifrs10: 'ifrs',
  ifrs12: 'ifrs',
  ifrs16: 'ifrs',
  banking: 'ovds', // Banking ops often grouped with ovds in smaller types
  crm: 'crm',
  loyalty: 'crm',
  reports: 'reports',
  insights: 'reports',
  onboarding: 'hr',
  partnerships: 'ovds',
  investments: 'ovds',
  business_loans: 'ovds',
  projects: 'ovds', // Projects often tracked as financial cost centers
  milestones: 'ovds',
  import_center: 'ovds',
  iot: 'iot',
  etax: 'tax',
  eims: 'tax',
};

/** Check if a role has a specific permission, optionally gated by business type, context, and overrides */
export function hasPermission(
  role: Role,
  permission: Permission,
  businessType?: string,
  context?: PermissionContext,
  overrides?: RolePermissionOverride[],
): boolean {
  if (role === Role.SPURADMIN || role === Role.SUPERADMIN) return true;

  // 1. Role-based check (with overrides)
  let perms = ROLE_PERMISSIONS[role] ?? [];

  // Apply overrides if provided
  if (overrides && overrides.length > 0) {
    const baseSet = new Set(perms);
    for (const ov of overrides) {
      if (ov.access === 'GRANT') baseSet.add(ov.permission as Permission);
      else baseSet.delete(ov.permission as Permission);
    }
    perms = Array.from(baseSet);
  }

  const hasRolePerm = perms.includes(permission);
  if (!hasRolePerm) return false;

  // 2. Business-type gating (if provided)
  if (businessType) {
    const prefix = permission.split(':')[0];
    const module = PERMISSION_MODULE_MAP[prefix];
    if (module && !businessHasModule(businessType, module)) {
      return false;
    }
  }

  // 3. Contextual check
  if (context) {
    const rule = CONTEXTUAL_RULES[permission];
    if (rule) return rule(role, context);
  }

  return true;
}

/** Returns true if the user has ANY of the given permissions */
export function canAny(
  role: Role,
  permissions: Permission[],
  businessType?: string,
  context?: PermissionContext,
): boolean {
  return permissions.some((p) => hasPermission(role, p, businessType, context));
}

/** Returns true if the user has ALL of the given permissions */
export function canAll(
  role: Role,
  permissions: Permission[],
  businessType?: string,
  context?: PermissionContext,
): boolean {
  return permissions.every((p) =>
    hasPermission(role, p, businessType, context),
  );
}

/** Check if a role's hierarchy weight >= target role */
export function isAtLeast(role: Role, target: Role): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[target] ?? 0);
}

/** Check if a role's hierarchy weight > target role */
export function isAbove(role: Role, target: Role): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) > (ROLE_HIERARCHY[target] ?? 0);
}

/** Check if a role can access a route, optionally gated by business type */
export function canAccessRoute(
  role: Role,
  path: string,
  businessType?: string,
): boolean {
  if (role === Role.SPURADMIN || role === Role.SUPERADMIN) return true;

  // Match longest prefix first
  const sorted = Object.keys(ROUTE_POLICY).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (
      path === prefix ||
      path.startsWith(prefix + '/') ||
      path.startsWith(prefix + '?')
    ) {
      return hasPermission(role, ROUTE_POLICY[prefix], businessType);
    }
  }

  return true; // no restriction
}

/** Get access level for a resource domain */
export function accessLevel(
  role: Role,
  resource: string,
  businessType?: string,
): 'none' | 'read' | 'write' | 'admin' {
  if (role === Role.SPURADMIN || role === Role.SUPERADMIN) return 'admin';

  const domain = RESOURCE_DOMAINS[resource];
  if (!domain) return 'none';

  if (domain.admin.some((p) => hasPermission(role, p, businessType)))
    return 'admin';
  if (domain.write.some((p) => hasPermission(role, p, businessType)))
    return 'write';
  if (domain.read.some((p) => hasPermission(role, p, businessType)))
    return 'read';

  return 'none';
}

/** Effective VAT access level */
export function vatLevel(
  role: Role,
  businessType?: string,
): 'none' | 'read' | 'write' | 'admin' {
  return accessLevel(role, 'vat', businessType);
}

/** Returns a flat domain → access-level map */
export function domainAccessMap(
  role: Role,
  businessType?: string,
): Record<string, 'none' | 'read' | 'write' | 'admin'> {
  return Object.fromEntries(
    Object.keys(RESOURCE_DOMAINS).map((domain) => [
      domain,
      accessLevel(role, domain, businessType),
    ]),
  );
}

/** Get default route for a role */
export function defaultRoute(role: Role): string {
  return DEFAULT_ROUTE[role] ?? '/dashboard';
}

/** Check if a role can perform a CRUD action on a resource */
export function canCrud(
  role: Role,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export',
  businessType?: string,
): boolean {
  if (role === Role.SPURADMIN || role === Role.SUPERADMIN) return true;

  const domain = RESOURCE_DOMAINS[resource];
  if (!domain) return false;

  switch (action) {
    case 'read':
      return domain.read.some((p) => hasPermission(role, p, businessType));
    case 'create':
    case 'update':
      return domain.write.some((p) => hasPermission(role, p, businessType));
    case 'delete':
    case 'approve':
    case 'export':
      return domain.admin.some((p) => hasPermission(role, p, businessType));
    default:
      return false;
  }
}

/** Check if a business type has access to a module */
export function businessHasModule(
  businessType: string,
  module: string,
): boolean {
  const modules = BUSINESS_MODULE_MAP[businessType] ?? [];
  return modules.includes(module);
}

/** Get all permissions for a role, optionally filtered by business type */
export function getPermissions(
  role: Role,
  businessType?: string,
): Permission[] {
  let perms: Permission[];
  if (role === Role.SPURADMIN || role === Role.SUPERADMIN) {
    const allPerms = new Set<Permission>();
    Object.values(ROLE_PERMISSIONS).forEach((pList) =>
      pList.forEach((p) => allPerms.add(p)),
    );
    perms = Array.from(allPerms);
  } else {
    perms = ROLE_PERMISSIONS[role] ?? [];
  }

  if (businessType) {
    return perms.filter((p) => {
      const prefix = p.split(':')[0];
      const module = PERMISSION_MODULE_MAP[prefix];
      return !module || businessHasModule(businessType, module);
    });
  }

  return perms;
}

// ── Database-persisted role permission overrides (Advanced Access Controls) ─────
//
// Overrides are stored per-company as a flat array of { role, permission, access }
// tuples in a SettingValue row (key: "role_permission_overrides"). They are
// RELATIVE to a role's hardcoded base permissions (ROLE_PERMISSIONS):
//   • GRANT  → ensure the role has this permission (adds to base set)
//   • DENY   → ensure the role never has this permission (removes from base set)
//
// SPURADMIN / SUPERADMIN always bypass — overrides never restrict super-admins.

/**
 * Compute the effective permission set for a role given persisted overrides.
 * Base = getPermissions(role) (business-type filtered) → apply DENY → apply GRANT.
 * Grants are applied last so an explicit GRANT also bypasses business-type
 * gating (an admin override is authoritative). Super-admins always keep all
 * permissions regardless of DENY (SPURADMIN/SUPERADMIN security boundary is
 * never relaxed — DENY on a super-admin is a no-op to prevent lockout mistakes,
 * but GRANT still adds nothing they lack).
 */
export function effectivePermissions(
  role: Role,
  overrides: RolePermissionOverride[] = [],
  businessType?: string,
): Permission[] {
  const isSuper = role === Role.SPURADMIN || role === Role.SUPERADMIN;

  let base: Permission[];
  if (isSuper) {
    const all = new Set<Permission>();
    Object.values(ROLE_PERMISSIONS).forEach((p) => p.forEach((x) => all.add(x)));
    base = Array.from(all);
  } else {
    base = getPermissions(role, businessType);
  }

  // Super-admins: DENY is ignored (never lock out root), GRANT is a no-op (already all).
  if (isSuper) {
    return businessType
      ? base.filter((p) => {
          const prefix = p.split(':')[0];
          const module = PERMISSION_MODULE_MAP[prefix];
          return !module || businessHasModule(businessType, module);
        })
      : base;
  }

  const baseSet = new Set(base);
  for (const ov of overrides) {
    if (ov.access === 'GRANT') baseSet.add(ov.permission as Permission);
    else baseSet.delete(ov.permission as Permission);
  }

  let result = Array.from(baseSet);
  if (businessType) {
    result = result.filter((p) => {
      const prefix = p.split(':')[0];
      const module = PERMISSION_MODULE_MAP[prefix];
      return !module || businessHasModule(businessType, module);
    });
  }
  return result;
}

const WRITE_SUFFIXES = [':write', ':generate', ':calculate', ':file', ':submit', ':invoice'];
const APPROVE_SUFFIXES = [':approve', ':admin', ':certify', ':finalize', ':flag', ':export'];

export function categorizePermission(perm: Permission): PermissionCategory {
  if (perm.endsWith(':read')) return VIEW;
  if (perm.endsWith(':delete')) return DELETE;
  if (APPROVE_SUFFIXES.some((s) => perm.endsWith(s))) return APPROVE;
  if (WRITE_SUFFIXES.some((s) => perm.endsWith(s))) return CREATE;
  // :write and anything else -> edit/upsert bucket
  if (perm.endsWith(':write')) return EDIT;
  return EDIT;
}

/** Build the full permission catalog grouped by RESOURCE_DOMAINS with CRUD buckets. */
export function permissionCatalog(): PermissionDomainCatalog[] {
  const cats: PermissionDomainCatalog[] = [];
  for (const [key, domain] of Object.entries(RESOURCE_DOMAINS)) {
    const tier: PermissionTier = { view: [], create: [], edit: [], delete: [], approve: [] };
    const all = [...domain.read, ...domain.write, ...domain.admin];
    const seen = new Set<string>();
    for (const p of all) {
      if (seen.has(p)) continue;
      seen.add(p);
      const cat = categorizePermission(p as Permission);
      tier[cat].push(p as Permission);
    }
    cats.push({ key, label: key, permissions: tier });
  }
  return cats;
}

/** Flat list of every unique permission in the system. */
export function allPermissions(): Permission[] {
  const set = new Set<Permission>();
  Object.values(ROLE_PERMISSIONS).forEach((p) => p.forEach((x) => set.add(x)));
  return Array.from(set).sort();
}

/**
 * Compute the overrides that would transform `role`'s base permissions into
 * the permission set implied by `presetKey`. Returns a Grant/Deny diff so the
 * stored overrides exactly reproduce the preset when merged with the base role.
 */
export function presetOverridesForRole(role: Role, presetKey: string): RolePermissionOverride[] {
  const preset = ROLE_PRESETS[presetKey as keyof typeof ROLE_PRESETS];
  if (!preset) return [];
  const target = new Set<Permission>(getRolePresetPermissions(presetKey));
  const base = new Set(getPermissions(role));
  const overrides: RolePermissionOverride[] = [];
  target.forEach((p) => {
    if (!base.has(p)) overrides.push({ role: role as string, permission: p, access: 'GRANT' });
  });
  base.forEach((p) => {
    if (!target.has(p)) overrides.push({ role: role as string, permission: p, access: 'DENY' });
  });
  return overrides;
}
