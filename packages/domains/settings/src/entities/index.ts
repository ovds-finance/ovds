export type SettingType = 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'date' | 'email' | 'url' | 'image' | 'json' | 'password';

export interface SettingCategoryDto {
  id?: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface SettingGroupDto {
  id?: string;
  categoryId: string;
  key: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface SettingDefinitionDto {
  id?: string;
  key: string;
  value?: string;
  type: SettingType;
  categoryId: string;
  groupId?: string;
  companyId?: string;
  defaultValue?: string;
  options?: string;
  isRequired?: boolean;
  isGlobal?: boolean;
  isEncrypted?: boolean;
  sortOrder?: number;
  placeholder?: string;
  hint?: string;
  module?: string;
}

export interface SettingValueDto {
  key: string;
  value: string;
}

export interface ModuleDto {
  id?: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  isCore?: boolean;
}

export interface CompanyModuleDto {
  companyId: string;
  moduleKey: string;
  isEnabled: boolean;
  settings?: Record<string, string>;
}

export interface SettingInputDto {
  id?: string;
  settingKey: string;
  component?: string;
  options?: string;
  validation?: string;
  placeholder?: string;
  hint?: string;
  helpUrl?: string;
  dependsOn?: string;
  dependsValue?: string;
  sortOrder?: number;
  isVisible?: boolean;
  isReadonly?: boolean;
  isRequired?: boolean;
  layout?: string;
  cssClass?: string;
}

export interface EmailSettingsDto {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  mail_from_name: string;
  mail_from_address: string;
  mail_engine: string;
}

export interface InvoiceSettingsDto {
  invoice_prefix: string;
  invoice_next_number: string;
  invoice_template: string;
  invoice_footer: string;
  invoice_show_qr: string;
  invoice_show_logo: string;
  invoice_show_bank_details: string;
  invoice_due_days: string;
  invoice_reminder_days: string;
}

export interface CurrencySettingsDto {
  default_currency: string;
  currency_position: string;
  currency_rate_provider: string;
  currency_auto_update: string;
  report_currency: string;
}

export interface TaxSettingsDto {
  vat_enabled: string;
  vat_rate: string;
  tot_enabled: string;
  wht_enabled: string;
  bit_enabled: string;
  pit_enabled: string;
  drrf_enabled: string;
}

export interface SecuritySettingsDto {
  default_user_role: string;
  allow_customer_portal: string;
  allow_vendor_portal: string;
  session_timeout_minutes: string;
  password_min_length: string;
  require_two_factor: string;
  max_login_attempts: string;
  jwt_expires_in: string;
  enforce_https: string;
  strict_file_upload: string;
}

export interface LocalizationSettingsDto {
  language: string;
  timezone: string;
  date_format: string;
  time_format: string;
  decimal_separator: string;
  thousands_separator: string;
  theme: string;
}

export interface BusinessIdentitySettingsDto {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_tin: string;
  company_vat_number: string;
  company_business_type: string;
  company_logo_url: string;
  company_industry: string;
  company_team_size: string;
}

export interface DefaultsSettingsDto {
  default_bank_account: string;
  default_payment_method: string;
  default_tax_rate: string;
  default_invoice_due_days: string;
  default_invoice_reminder_days: string;
  default_currency: string;
}

export interface SystemSettingsDto {
  version: string;
  current_version: string;
  environment: string;
  auto_update: string;
  jwt_expires_in: string;
  enforce_https: string;
  strict_file_upload: string;
  max_request_size: string;
  rate_limit_threshold: string;
  rate_limit_window_seconds: string;
  db_connection_limit: string;
}

export interface IntegrationsSettingsDto {
  openai_api_key: string;
  gemini_api_key: string;
  siem_webhook_url: string;
  siem_token: string;
  request_signing_secret: string;
}

export const CORE_SETTINGS_OPTIONS: Record<string, { label: string; value: string }[]> = {
  default_currency: [
    { label: 'ETB — Ethiopian Birr', value: 'ETB' },
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'EUR — Euro', value: 'EUR' },
    { label: 'GBP — British Pound', value: 'GBP' },
    { label: 'SAR — Saudi Riyal', value: 'SAR' },
    { label: 'AED — UAE Dirham', value: 'AED' },
    { label: 'KES — Kenyan Shilling', value: 'KES' },
  ],
  currency_position: [
    { label: 'Before amount (ETB 1,000)', value: 'before' },
    { label: 'After amount (1,000 ETB)', value: 'after' },
  ],
  decimal_separator: [
    { label: 'Dot (1,000.00)', value: '.' },
    { label: 'Comma (1.000,00)', value: ',' },
  ],
  thousands_separator: [
    { label: 'Comma (1,000)', value: ',' },
    { label: 'Dot (1.000)', value: '.' },
    { label: 'Space (1 000)', value: ' ' },
  ],
  date_format: [
    { label: 'YYYY-MM-DD', value: 'Y-m-d' },
    { label: 'DD/MM/YYYY', value: 'd/m/Y' },
    { label: 'MM/DD/YYYY', value: 'm/d/Y' },
    { label: 'DD-MMM-YYYY', value: 'd-M-Y' },
  ],
  time_format: [
    { label: '24-hour', value: '24' },
    { label: '12-hour', value: '12' },
  ],
  language: [
    { label: 'English', value: 'en' },
    { label: 'አማርኛ (Amharic)', value: 'am' },
    { label: 'ትግርኛ (Tigrinya)', value: 'ti' },
  ],
  timezone: [
    { label: 'Addis Ababa (EAT)', value: 'Africa/Addis_Ababa' },
    { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
    { label: 'Dubai (GST)', value: 'Asia/Dubai' },
    { label: 'UTC', value: 'UTC' },
  ],
  currency_rate_provider: [
    { label: 'Manual entry', value: 'manual' },
    { label: 'ECX (Ethiopia)', value: 'ecx' },
    { label: 'Open Exchange Rates', value: 'openexchangerates' },
    { label: 'Fixer.io', value: 'fixer' },
  ],
  theme: [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System default', value: 'system' },
  ],
  sidebar_density: [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Comfortable', value: 'comfortable' },
  ],
  company_business_type: [
    { label: 'Private Limited Company (PLC)', value: 'PLC' },
    { label: 'One Member PLC', value: 'ONE_MEMBER_PLC' },
    { label: 'Share Company', value: 'SHARE_COMPANY' },
    { label: 'Sole Proprietorship', value: 'SOLE_PROPRIETORSHIP' },
    { label: 'Non-Profit / NGO', value: 'NGO' },
    { label: 'Government Entity', value: 'GOVERNMENT' },
  ],
  smtp_encryption: [
    { label: 'None', value: 'none' },
    { label: 'TLS', value: 'tls' },
    { label: 'SSL', value: 'ssl' },
  ],
  mail_engine: [
    { label: 'SMTP', value: 'smtp' },
    { label: 'PHP Mail', value: 'php_mail' },
    { label: 'Mailgun', value: 'mailgun' },
    { label: 'SendGrid', value: 'sendgrid' },
  ],
  invoice_template: [
    { label: 'Simple', value: 'simple' },
    { label: 'Modern', value: 'modern' },
    { label: 'Detailed', value: 'detailed' },
  ],
  jwt_expires_in: [
    { label: '15 minutes', value: '15m' },
    { label: '1 hour', value: '1h' },
    { label: '8 hours', value: '8h' },
    { label: '1 day', value: '1d' },
  ],
};

export const MODULE_DEFAULT_SETTINGS: Record<string, Record<string, string>> = {
  invoice: {
    module_invoice: 'true',
    invoice_vat_enabled: 'true',
    invoice_show_qr: 'true',
    invoice_show_logo: 'true',
    invoice_show_bank_details: 'true',
    invoice_template: 'modern',
    invoice_due_days: '30',
    invoice_reminder_days: '7',
  },
  accounting: {
    module_accounting: 'true',
    default_currency: 'ETB',
    fiscal_year_start: '7',
    locked_periods: '[]',
    approval_rules: '[]',
  },
  banking: {
    module_banking: 'true',
    currency_auto_update: 'false',
    currency_rate_provider: 'manual',
    bank_reconciliation_auto_match: 'true',
  },
  expenses: {
    module_expenses: 'true',
    expense_approval_required: 'true',
    expense_receipt_required: 'false',
  },
  payroll: {
    module_payroll: 'true',
    pension_employee_rate: '7',
    pension_employer_rate: '11',
    payroll_cycle: 'monthly',
    overtime_rate: '1.5',
  },
  vat: {
    module_vat: 'true',
    vat_enabled: 'true',
    vat_rate: '15',
    vat_filing_deadline: '30',
    vat_auto_calculate: 'true',
  },
  bit: {
    module_bit: 'true',
    bit_enabled: 'true',
    bit_rate: '30',
    bit_advance_payment: '25',
  },
  pit: {
    module_pit: 'true',
    pit_enabled: 'true',
    pit_employer_rounding: 'false',
  },
  drrf: {
    module_drrf: 'true',
    drrf_enabled: 'true',
    drrf_rate: '1',
    drrf_remittance_schedule: 'monthly',
  },
  reports: {
    module_reports: 'true',
    date_format: 'Y-m-d',
    language: 'en',
    report_currency: 'ETB',
  },
  treasury: {
    module_treasury: 'false',
    transaction_categories: '[]',
    dunning_enabled: 'true',
    dunning_levels: '3',
    cash_forecast_months: '12',
  },
  notifications: {
    module_notifications: 'true',
    email_enabled: 'true',
    sms_enabled: 'false',
    push_enabled: 'false',
    notification_template: 'default',
  },
  projects: {
    module_projects: 'true',
    project_billing: 'hourly',
    project_timesheet_required: 'false',
    project_milestone_tracking: 'true',
  },
  inventory: {
    module_inventory: 'true',
    inventory_tracking: 'fifo',
    inventory_low_stock_alert: 'true',
    inventory_warehouse_required: 'false',
  },
  crm: {
    module_crm: 'false',
    crm_lead_scoring: 'false',
    crm_auto_assignment: 'true',
    crm_follow_up_reminder: '7',
  },
  ifrs: {
    module_ifrs: 'false',
    ifrs_reporting_currency: 'ETB',
    ifrs_subsidiary_currency: 'ETB',
    ifrs_consolidation_frequency: 'quarterly',
  },
  manufacturing: {
    module_manufacturing: 'false',
    bom_auto_cost_update: 'true',
    production_rounding: 'standard',
    waste_tracking: 'false',
  },
  api: {
    module_api: 'true',
    api_rate_limit: '1000',
    api_key_expiry_days: '90',
    api_webhook_retry: '3',
  },
  integrations: {
    module_integrations: 'true',
    openai_api_key: '',
    gemini_api_key: '',
    siem_webhook_url: '',
    siem_token: '',
    request_signing_secret: '',
  },
};
