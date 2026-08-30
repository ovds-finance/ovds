import { Permission } from './permissions';

// -- Resource Domains ---------------------------------------------------------

export const RESOURCE_DOMAINS: Record<
  string,
  {
    read: Permission[];
    write: Permission[];
    admin: Permission[];
  }
> = {
  iot: {
    read: ['iot:read'],
    write: ['iot:write'],
    admin: ['iot:delete'],
  },
  etax: {
    read: ['vat:read'],
    write: ['vat:write'],
    admin: ['etax:submit'],
  },
  employees: {
    read: ['employees:read'],
    write: ['employees:write'],
    admin: ['employees:delete'],
  },
  departments: {
    read: ['departments:read'],
    write: ['departments:write'],
    admin: [],
  },
  attendance: {
    read: ['attendance:read'],
    write: ['attendance:verify'],
    admin: [],
  },
  leaves: {
    read: ['leaves:read'],
    write: ['leaves:write'],
    admin: ['leaves:approve', 'leaves:delete'],
  },
  shifts: {
    read: ['shifts:read'],
    write: ['shifts:write'],
    admin: ['shifts:delete'],
  },
  holidays: {
    read: ['holidays:read'],
    write: ['holidays:write'],
    admin: ['holidays:delete'],
  },
  payroll: {
    read: ['payroll:read'],
    write: ['payroll:generate'],
    admin: ['payroll:approve', 'payroll:finalize', 'payroll:admin'],
  },
  ovds: {
    read: ['ovds:read'],
    write: ['ovds:write'],
    admin: ['ovds:approve', 'ovds:delete'],
  },
  invoices: {
    read: ['invoices:read'],
    write: ['invoices:write'],
    admin: ['invoices:delete'],
  },
  bills: {
    read: ['bills:read'],
    write: ['bills:write'],
    admin: ['bills:delete'],
  },
  items: {
    read: ['items:read'],
    write: ['items:write'],
    admin: ['items:delete'],
  },
  vat: {
    read: ['vat:read'],
    write: ['vat:write', 'vat:calculate'],
    admin: ['vat:file', 'vat:delete', 'vat:refund'],
  },
  bit: { read: ['bit:read'], write: ['bit:write'], admin: ['bit:file'] },
  disaster_fund: {
    read: ['disaster_fund:read'],
    write: ['disaster_fund:write'],
    admin: ['disaster_fund:delete'],
  },
  expenses: {
    read: ['expenses:read'],
    write: ['expenses:write'],
    admin: ['expenses:approve'],
  },
  purchase_orders: {
    read: ['purchase_orders:read'],
    write: ['purchase_orders:write'],
    admin: ['purchase_orders:approve'],
  },
  fixed_assets: {
    read: ['fixed_assets:read'],
    write: ['fixed_assets:write'],
    admin: [],
  },
  fund_transfers: {
    read: ['fund_transfers:read'],
    write: ['fund_transfers:write'],
    admin: ['fund_transfers:approve'],
  },
  bank_reconciliation: {
    read: ['bank_reconciliation:read'],
    write: ['bank_reconciliation:write'],
    admin: [],
  },
  period_close: {
    read: ['period_close:read'],
    write: ['period_close:write'],
    admin: [],
  },
  reports: {
    read: ['reports:read'],
    write: ['reports:custom:write'],
    admin: ['reports:financial:full'],
  },
  users: {
    read: ['users:read'],
    write: ['users:write'],
    admin: ['users:delete'],
  },
  audit_logs: {
    read: ['audit_logs:read'],
    write: ['audit_logs:write'],
    admin: [],
  },
  settings: { read: ['settings:read'], write: ['settings:write'], admin: [] },
  companies: {
    read: ['companies:read'],
    write: ['companies:write'],
    admin: ['companies:delete'],
  },
  partnerships: {
    read: ['partnerships:read'],
    write: ['partnerships:write'],
    admin: [],
  },
  investments: {
    read: ['investments:read'],
    write: ['investments:write'],
    admin: [],
  },
  business_loans: {
    read: ['business_loans:read'],
    write: ['business_loans:write'],
    admin: ['business_loans:approve'],
  },
  audit_outsourcing: {
    read: ['audit_outsourcing:read'],
    write: ['audit_outsourcing:write'],
    admin: [],
  },
  inventory: {
    read: ['inventory:read'],
    write: ['inventory:write'],
    admin: [],
  },
  crm: {
    read: ['crm:read'],
    write: ['crm:write'],
    admin: ['crm:settings:write'],
  },
  projects: {
    read: ['projects:read'],
    write: ['projects:write'],
    admin: ['projects:delete'],
  },
  apps: {
    read: ['apps:read'],
    write: ['apps:write'],
    admin: ['apps:admin'],
  },
  system: {
    read: ['system:monitor'],
    write: ['system:config'],
    admin: ['system:deploy'],
  },
  ifrs: {
    read: ['ifrs:read'],
    write: ['ifrs:write'],
    admin: ['ifrs:approve', 'ifrs:export'],
  },
  banking: {
    read: ['banking:read'],
    write: ['banking:write'],
    admin: ['banking:approve'],
  },
  device_control: {
    read: ['device_control:read'],
    write: ['device_control:propose'],
    admin: ['device_control:approve'],
  },
  external_audit: {
    read: ['external_audit:read'],
    write: ['external_audit:write'],
    admin: ['external_audit:certify'],
  },
  eims: {
    read: ['eims:compliance', 'eims:callback'],
    write: ['eims:submit', 'eims:bulk:submit', 'eims:verify', 'eims:retry'],
    admin: ['eims:cancel', 'eims:bulk:cancel', 'eims:certificates', 'eims:source_systems'],
  },
};
