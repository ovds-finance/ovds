/**
 * @ovds/contracts/schemas/settings
 *
 * Zod schemas for the modular settings system — categories, groups, definitions,
 * KV values, modules, inputs, templates, and the setup wizard.
 *
 * These schemas mirror the SettingsService DTOs so both backend and frontend
 * share a single source of truth via the oRPC contract.
 */
import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const SettingTypeSchema = z.enum([
  'text', 'textarea', 'number', 'select', 'toggle',
  'date', 'email', 'url', 'image', 'json', 'password',
]);
export type SettingType = z.infer<typeof SettingTypeSchema>;

export const SetupScopeSchema = z.enum([
  'company', 'financial', 'modules', 'users', 'system', 'compliance', 'deployment',
]);

export const SetupStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'skipped']);

// ── Setting Category ──────────────────────────────────────────────────────────

export const SettingCategorySchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  icon: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateSettingCategorySchema = SettingCategorySchema.omit({
  id: true, createdAt: true, updatedAt: true,
}).partial({ sortOrder: true, isActive: true });

export const UpdateSettingCategorySchema = CreateSettingCategorySchema.partial();

// ── Setting Group ─────────────────────────────────────────────────────────────

export const SettingGroupSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateSettingGroupSchema = SettingGroupSchema.omit({
  id: true, createdAt: true, updatedAt: true,
}).partial({ sortOrder: true, isActive: true });

export const UpdateSettingGroupSchema = CreateSettingGroupSchema.partial();

// ── Setting Definition ────────────────────────────────────────────────────────

export const SettingDefinitionSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  type: SettingTypeSchema,
  categoryId: z.string(),
  groupId: z.string().nullish(),
  companyId: z.string().nullish(),
  defaultValue: z.string().nullish(),
  options: z.string().nullish(),
  isRequired: z.boolean().default(false),
  isGlobal: z.boolean().default(false),
  isEncrypted: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  placeholder: z.string().nullish(),
  hint: z.string().nullish(),
  module: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateSettingDefinitionSchema = SettingDefinitionSchema.omit({
  id: true, createdAt: true, updatedAt: true,
}).partial({ sortOrder: true, isRequired: true, isGlobal: true, isEncrypted: true });

export const UpdateSettingDefinitionSchema = CreateSettingDefinitionSchema.partial();

// ── Setting Value (KV) ────────────────────────────────────────────────────────

export const SettingValueResponseSchema = z.object({
  key: z.string(),
  value: z.string(),
  source: z.enum(['kv', 'modular', 'legacy', 'missing']),
  type: z.string().nullish(),
  category: z.string().nullish(),
  group: z.string().nullish(),
});

export const UpdateSettingValueSchema = z.object({
  key: z.string(),
  value: z.string(),
  companyId: z.string().optional(),
});

export const BulkUpdateSettingsSchema = z.object({
  values: z.record(z.string(), z.string()),
  companyId: z.string().optional(),
});

// ── Module ────────────────────────────────────────────────────────────────────

export const AppModuleSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  icon: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isCore: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CompanyModuleSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  moduleKey: z.string(),
  isEnabled: z.boolean(),
  settings: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  module: AppModuleSchema.optional(),
});

// ── Setting Input (UI component metadata) ─────────────────────────────────────

export const SettingInputSchema = z.object({
  id: z.string(),
  settingKey: z.string(),
  component: z.string().nullish(),
  options: z.string().nullish(),
  validation: z.string().nullish(),
  placeholder: z.string().nullish(),
  hint: z.string().nullish(),
  helpUrl: z.string().nullish(),
  dependsOn: z.string().nullish(),
  dependsValue: z.string().nullish(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  isReadonly: z.boolean().default(false),
  isRequired: z.boolean().default(false),
  layout: z.string().nullish(),
  cssClass: z.string().nullish(),
});

// ── Template ──────────────────────────────────────────────────────────────────

export const BusinessTypeTemplateSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  modules: z.array(z.string()),
  settings: z.record(z.string(), z.string()),
});

export const ApplyTemplateResultSchema = z.object({
  template: BusinessTypeTemplateSchema,
  companyId: z.string(),
  enabledModules: z.array(z.string()),
  appliedSettings: z.record(z.string(), z.string()),
});

// ── Setup Wizard ──────────────────────────────────────────────────────────────

export const SetupStepStatusSchema = z.object({
  stepKey: z.string(),
  status: SetupStatusSchema,
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
  scope: SetupScopeSchema.optional(),
  moduleId: z.string().optional(),
});

export const CompanySetupProgressSchema = z.object({
  companyId: z.string(),
  currentStep: z.string().optional(),
  overallProgress: z.number(),
  steps: z.array(SetupStepStatusSchema),
  startedAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  scopeSummary: z.record(z.string(), z.array(z.string())).optional(),
  moduleActivities: z.array(z.object({
    moduleId: z.string(),
    action: z.string(),
    timestamp: z.string(),
    stepKey: z.string(),
  })).optional(),
});

// ── Structured profile ────────────────────────────────────────────────────────

export const SecuritySettingsDtoSchema = z.object({
  default_user_role: z.string(),
  allow_customer_portal: z.string(),
  allow_vendor_portal: z.string(),
  session_timeout_minutes: z.string(),
  password_min_length: z.string(),
  require_two_factor: z.string(),
  max_login_attempts: z.string(),
  jwt_expires_in: z.string(),
  enforce_https: z.string(),
  strict_file_upload: z.string(),
});

export const LocalizationSettingsDtoSchema = z.object({
  language: z.string(),
  timezone: z.string(),
  date_format: z.string(),
  time_format: z.string().optional(),
  decimal_separator: z.string(),
  thousands_separator: z.string(),
  theme: z.string().optional(),
});

export const BusinessIdentitySettingsDtoSchema = z.object({
  company_name: z.string(),
  company_email: z.string(),
  company_phone: z.string(),
  company_address: z.string(),
  company_tin: z.string(),
  company_vat_number: z.string(),
  company_business_type: z.string(),
  company_logo_url: z.string(),
  company_industry: z.string().optional(),
  company_team_size: z.string().optional(),
});

export const DefaultsSettingsDtoSchema = z.object({
  default_bank_account: z.string(),
  default_payment_method: z.string(),
  default_tax_rate: z.string(),
  default_invoice_due_days: z.string(),
  default_invoice_reminder_days: z.string(),
  default_currency: z.string(),
});

export const SystemSettingsDtoSchema = z.object({
  version: z.string(),
  current_version: z.string(),
  environment: z.string(),
  auto_update: z.string(),
  jwt_expires_in: z.string(),
  enforce_https: z.string(),
  strict_file_upload: z.string(),
  max_request_size: z.string(),
  rate_limit_threshold: z.string(),
  rate_limit_window_seconds: z.string(),
  db_connection_limit: z.string(),
});

export const IntegrationsSettingsDtoSchema = z.object({
  openai_api_key: z.string(),
  gemini_api_key: z.string(),
  siem_webhook_url: z.string(),
  siem_token: z.string(),
  request_signing_secret: z.string(),
});

export const StructuredCompanyProfileSchema = z.object({
  company: z.object({
    companyName: z.string(),
    companyEmail: z.string(),
    companyPhone: z.string(),
    companyAddress: z.string(),
    companyTin: z.string(),
    companyVatNumber: z.string(),
    companyBusinessType: z.string(),
    companyLogoUrl: z.string(),
    companyIndustry: z.string().optional(),
    companyTeamSize: z.string().optional(),
  }),
  localization: z.object({
    language: z.string(),
    timezone: z.string(),
    dateFormat: z.string(),
    decimalSeparator: z.string(),
    thousandsSeparator: z.string(),
    timeFormat: z.string().optional(),
    theme: z.string().optional(),
  }),
  financial: z.object({
    defaultCurrency: z.string(),
    currencyPosition: z.string(),
    currencyRateProvider: z.string(),
    currencyAutoUpdate: z.string(),
    fiscalYearStart: z.string(),
    reportCurrency: z.string(),
  }),
  invoice: z.object({
    invoicePrefix: z.string(),
    invoiceNextNumber: z.string(),
    invoiceTemplate: z.string(),
    invoiceFooter: z.string(),
    invoiceShowQr: z.string(),
    invoiceShowLogo: z.string(),
    invoiceShowBankDetails: z.string(),
    invoiceDueDays: z.string(),
    invoiceReminderDays: z.string(),
  }),
  currency: z.object({
    defaultCurrency: z.string(),
    currencyPosition: z.string(),
    currencyRateProvider: z.string(),
    currencyAutoUpdate: z.string(),
    reportCurrency: z.string(),
    multiCurrencyEnabled: z.string(),
    allowedCurrencies: z.string(),
    fxRateSource: z.string(),
  }),
  email: z.object({
    smtpHost: z.string(),
    smtpPort: z.string(),
    smtpUsername: z.string(),
    smtpPassword: z.string(),
    smtpEncryption: z.string(),
    mailFromName: z.string(),
    mailFromAddress: z.string(),
    mailEngine: z.string(),
  }),
  taxes: z.object({
    vatEnabled: z.string(),
    vatRate: z.string(),
    totEnabled: z.string(),
    whtEnabled: z.string(),
    bitEnabled: z.string(),
    pitEnabled: z.string(),
    drrfEnabled: z.string(),
  }),
  defaults: z.object({
    defaultBankAccount: z.string(),
    defaultPaymentMethod: z.string(),
    defaultTaxRate: z.string(),
    defaultInvoiceDueDays: z.string(),
    defaultInvoiceReminderDays: z.string(),
    defaultCurrency: z.string(),
  }),
  users: z.object({
    defaultUserRole: z.string(),
    allowCustomerPortal: z.string(),
    allowVendorPortal: z.string(),
    sessionTimeoutMinutes: z.string(),
    passwordMinLength: z.string(),
    requireTwoFactor: z.string(),
    maxLoginAttempts: z.string(),
    jwtExpiresIn: z.string(),
    enforceHttps: z.string(),
    strictFileUpload: z.string(),
  }),
  modules: z.record(z.string(), z.string()),
  system: z.object({
    version: z.string(),
    currentVersion: z.string(),
    environment: z.string(),
    autoUpdate: z.string(),
    jwtExpiresIn: z.string(),
    enforceHttps: z.string(),
    strictFileUpload: z.string(),
    maxRequestSize: z.string(),
    rateLimitThreshold: z.string(),
    rateLimitWindowSeconds: z.string(),
    dbConnectionLimit: z.string(),
  }),
  integrations: z.object({
    openaiApiKey: z.string(),
    geminiApiKey: z.string(),
    siemWebhookUrl: z.string(),
    siemToken: z.string(),
    requestSigningSecret: z.string(),
  }),
});

export const SetupChecklistSchema = z.object({
  companyId: z.string(),
  checks: z.object({
    companyProfileComplete: z.boolean(),
    localizationConfigured: z.boolean(),
    financialConfigured: z.boolean(),
    fiscalYearSet: z.boolean(),
    taxesConfigured: z.boolean(),
    coreModulesEnabled: z.boolean(),
    totalChecks: z.number().int(),
    passedChecks: z.number().int(),
  }),
  profile: StructuredCompanyProfileSchema,
  parameters: z.record(z.string(), z.unknown()),
  modules: z.array(AppModuleSchema.extend({ isEnabled: z.boolean() })),
  suggestedInputs: z.array(SettingInputSchema),
});

// ── RBAC: Role & Permission CRUD ──────────────────────────────────────────────

export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  category: z.string().nullish(),
  isActive: z.boolean().default(true),
  companyId: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreatePermissionSchema = PermissionSchema.omit({
  id: true, createdAt: true, updatedAt: true, companyId: true,
}).partial({ isActive: true });

export const UpdatePermissionSchema = CreatePermissionSchema.partial();

export const RoleDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  companyId: z.string().nullish(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  permissions: z.array(PermissionSchema).default([]),
});

export const CreateRoleDefinitionSchema = RoleDefinitionSchema.omit({
  id: true, createdAt: true, updatedAt: true, companyId: true, permissions: true,
}).partial({ isActive: true, isSystem: true });

export const UpdateRoleDefinitionSchema = CreateRoleDefinitionSchema.partial();

export const RolePermissionAssignmentSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});

export const ToggleRoleStatusSchema = z.object({
  roleId: z.string(),
  isActive: z.boolean(),
});

export const TogglePermissionStatusSchema = z.object({
  permissionId: z.string(),
  isActive: z.boolean(),
});
