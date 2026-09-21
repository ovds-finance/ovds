import { Role } from '../types';

// ── Navigation Section Access (sidebar role-based section filtering) ───────────
// Single source of truth for which sidebar sections each role can see.
// Backend NavService and frontend Sidebar both import this to stay in sync.

export const STATIC_SECTIONS: Array<{
  key: string;
  label: string;
  icon: string;
  sectionLabel: true;
  colorToken: string;
}> = [
  { key: "__sec_dashboard", label: "Dashboard",              icon: "DASHBOARD",      sectionLabel: true, colorToken: "dashboard" },
  { key: "__sec_accounting", label: "Accounting & Finance",    icon: "CHART",          sectionLabel: true, colorToken: "accounting" },
  { key: "__sec_sales",      label: "Sales & Revenue",       icon: "INVOICE",        sectionLabel: true, colorToken: "sales" },
  { key: "__sec_crm",        label: "CRM",                    icon: "CUSTOMER",       sectionLabel: true, colorToken: "sales" },
  { key: "__sec_purchases",  label: "Purchases & Expenses",  icon: "VENDOR",         sectionLabel: true, colorToken: "purchases" },
  { key: "__sec_inventory",  label: "Inventory",             icon: "BOXES",          sectionLabel: true, colorToken: "inventory" },
  { key: "__sec_banking",    label: "Banking",               icon: "WALLET",         sectionLabel: true, colorToken: "banking" },
  { key: "__sec_tax",        label: "Tax & Compliance",      icon: "SHIELD_CHECK",   sectionLabel: true, colorToken: "tax" },
  { key: "__sec_hr",         label: "Payroll & HR",          icon: "EMPLOYEE",       sectionLabel: true, colorToken: "hr" },
  { key: "__sec_reports",    label: "Reports & Analysis",    icon: "BAR_CHART_2",    sectionLabel: true, colorToken: "reports" },
  { key: "__sec_system",     label: "System",                icon: "GAUGE",          sectionLabel: true, colorToken: "system" },
  { key: "__sec_iot",        label: "IoT & Smart Devices",   icon: "SERVER",         sectionLabel: true, colorToken: "iot" },
  { key: "__sec_admin",      label: "Administration",        icon: "SETTINGS",       sectionLabel: true, colorToken: "admin" },
  { key: "__sec_dev",        label: "Developer",             icon: "WEBHOOK",        sectionLabel: true, colorToken: "dev" },
  { key: "__sec_governance", label: "System Administration", icon: "CONTROL_PANEL",  sectionLabel: true, colorToken: "governance" },
  { key: "__sec_ovds",       label: "OVDS Module",           icon: "LAYERS",         sectionLabel: true, colorToken: "accounting" },
  { key: "__sec_disaster",   label: "Disaster Fund",         icon: "ALERT_TRIANGLE", sectionLabel: true, colorToken: "tax" },
  { key: "__sec_trade",      label: "Trade & Customs",       icon: "GLOBE",          sectionLabel: true, colorToken: "sales" },
  { key: "__sec_device",     label: "Device Control",        icon: "SERVER",         sectionLabel: true, colorToken: "admin" },
  { key: "__sec_ifrs",       label: "IFRS Standards",        icon: "CLIPBOARD_LIST", sectionLabel: true, colorToken: "accounting" },
  { key: "__sec_aabe",       label: "AABE Compliance",       icon: "CHECK_CIRCLE",   sectionLabel: true, colorToken: "accounting" },
  { key: "__sec_cc",         label: "Commercial Code",       icon: "BUILDING",       sectionLabel: true, colorToken: "accounting" },
  { key: "__sec_reg",        label: "Regulatory Reporting",  icon: "SEND",           sectionLabel: true, colorToken: "tax" },
];

export const ROLE_SECTION_ACCESS: Record<string, string[]> = {
  SPURADMIN: ["*"],
  SUPERADMIN: ["*"],
  DEVELOPER: ["*"],
  ADMIN: [
    "__sec_dashboard", "__sec_accounting", "__sec_sales", "__sec_purchases", "__sec_inventory",
    "__sec_banking", "__sec_tax", "__sec_hr", "__sec_reports", "__sec_system",
    "__sec_iot", "__sec_admin", "__sec_governance", "__sec_ovds",
    "__sec_crm", "__sec_disaster", "__sec_trade", "__sec_device",
    "__sec_ifrs", "__sec_aabe", "__sec_cc", "__sec_reg",
  ],
  PROJECT_MANAGER: [
    "__sec_dashboard", "__sec_accounting", "__sec_inventory", "__sec_banking", "__sec_hr",
    "__sec_reports", "__sec_system", "__sec_admin", "__sec_governance", "__sec_ovds",
    "__sec_ifrs", "__sec_cc", "__sec_reg",
  ],
  OVDS: [
    "__sec_dashboard", "__sec_accounting", "__sec_sales", "__sec_purchases", "__sec_inventory",
    "__sec_banking", "__sec_tax", "__sec_reports", "__sec_system",
    "__sec_ovds", "__sec_disaster", "__sec_ifrs", "__sec_cc", "__sec_reg",
  ],
  FINANCE: [
    "__sec_dashboard", "__sec_accounting", "__sec_sales", "__sec_purchases", "__sec_inventory",
    "__sec_banking", "__sec_tax", "__sec_reports", "__sec_system",
    "__sec_crm", "__sec_ovds", "__sec_disaster",
    "__sec_ifrs", "__sec_aabe", "__sec_cc", "__sec_reg",
  ],
  SALES: [
    "__sec_dashboard", "__sec_sales", "__sec_crm", "__sec_reports", "__sec_trade",
    "__sec_system", "__sec_admin",
  ],
  PURCHASES: [
    "__sec_dashboard", "__sec_purchases", "__sec_inventory", "__sec_reports",
    "__sec_system", "__sec_admin",
  ],
  SECURITY: [
    "__sec_dashboard", "__sec_system", "__sec_governance", "__sec_tax",
    "__sec_reports",
  ],
  COMPLIANCE: [
    "__sec_dashboard", "__sec_system", "__sec_governance", "__sec_tax",
    "__sec_reports", "__sec_ovds", "__sec_banking",
    "__sec_aabe", "__sec_reg",
  ],
  ACCOUNTING: [
    "__sec_dashboard", "__sec_accounting", "__sec_sales", "__sec_purchases", "__sec_inventory",
    "__sec_banking", "__sec_tax", "__sec_reports", "__sec_system", "__sec_ovds",
    "__sec_ifrs", "__sec_aabe", "__sec_cc", "__sec_reg",
  ],
  AUDITOR: [
    "__sec_dashboard", "__sec_accounting", "__sec_inventory", "__sec_banking", "__sec_tax",
    "__sec_reports", "__sec_system", "__sec_disaster",
    "__sec_ifrs", "__sec_aabe", "__sec_cc",
  ],
  EXTERNAL_AUDITOR: [
    "__sec_dashboard", "__sec_accounting", "__sec_inventory", "__sec_banking", "__sec_tax",
    "__sec_reports", "__sec_system", "__sec_disaster",
    "__sec_ifrs", "__sec_aabe", "__sec_cc",
  ],
  IFRS_OFFICER: [
    "__sec_dashboard", "__sec_accounting", "__sec_inventory", "__sec_banking", "__sec_tax",
    "__sec_reports", "__sec_system",
    "__sec_ifrs", "__sec_aabe",
  ],
  BANK_LIAISON: [
    "__sec_dashboard", "__sec_accounting", "__sec_banking", "__sec_reports", "__sec_system", "__sec_ovds",
  ],
  HR: [
    "__sec_dashboard", "__sec_hr", "__sec_reports", "__sec_system", "__sec_admin", "__sec_governance",
  ],
  EMPLOYEE: ["__sec_dashboard", "__sec_hr", "__sec_system"],
  CRM: ["__sec_dashboard", "__sec_sales", "__sec_reports", "__sec_trade"],
  CLIENT: ["__sec_dashboard", "__sec_sales", "__sec_trade"],
  PARTNER: ["__sec_dashboard", "__sec_purchases"],
  DATA_CLERK: ["__sec_dashboard", "__sec_accounting", "__sec_sales", "__sec_inventory"],
};

export function allowedSectionsForRole(role: string): string[] {
  return ROLE_SECTION_ACCESS[role] ?? ROLE_SECTION_ACCESS[Role.EMPLOYEE];
}

export function isSuperUser(role: string): boolean {
  const allowed = ROLE_SECTION_ACCESS[role] ?? [];
  return allowed[0] === "*";
}
