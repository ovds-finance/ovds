/**
 * @ovds/contracts — Settings oRPC Router Contract
 *
 * Exposes the full modular settings system:
 *   catalog.*    — categories, groups, definitions (schema editor)
 *   values.*     — KV get/set/bulk/reset (runtime settings)
 *   modules.*    — app module registry + per-company enable/disable
 *   inputs.*     — UI component metadata
 *   templates.*  — business-type setup templates
 *   setup.*      — setup wizard progress + step completion
 *   profile.*    — structured company profile (read/update by section)
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  SettingCategorySchema,
  SettingGroupSchema,
  SettingDefinitionSchema,
  SettingValueResponseSchema,
  AppModuleSchema,
  CompanyModuleSchema,
  SettingInputSchema,
  BusinessTypeTemplateSchema,
  ApplyTemplateResultSchema,
  CompanySetupProgressSchema,
  StructuredCompanyProfileSchema,
  SetupChecklistSchema,
  CreateSettingCategorySchema,
  UpdateSettingCategorySchema,
  CreateSettingGroupSchema,
  UpdateSettingGroupSchema,
  CreateSettingDefinitionSchema,
  UpdateSettingDefinitionSchema,
  UpdateSettingValueSchema,
  BulkUpdateSettingsSchema,
  PermissionSchema,
  CreatePermissionSchema,
  UpdatePermissionSchema,
  RoleDefinitionSchema,
  CreateRoleDefinitionSchema,
  UpdateRoleDefinitionSchema,
  RolePermissionAssignmentSchema,
  ToggleRoleStatusSchema,
  TogglePermissionStatusSchema,
} from '../schemas/settings';
import { IdParamSchema } from '../schemas/common';

const Q = z.object({ companyId: z.string().optional() });

// ── Catalog (schema editor) ───────────────────────────────────────────────────

const catalogContract = {
  categories: oc.router({
    list: oc.input(z.object({})).output(z.array(SettingCategorySchema)),
    get:  oc.input(z.object({ key: z.string() })).output(SettingCategorySchema),
    create: oc.input(CreateSettingCategorySchema).output(SettingCategorySchema),
    update: oc.input(z.object({ key: z.string(), data: UpdateSettingCategorySchema })).output(SettingCategorySchema),
    remove: oc.input(z.object({ key: z.string() })).output(z.object({ success: z.boolean() })),
  }),

  groups: oc.router({
    list: oc.input(z.object({ categoryKey: z.string().optional() })).output(z.array(SettingGroupSchema)),
    create: oc.input(CreateSettingGroupSchema).output(SettingGroupSchema),
    update: oc.input(z.object({ id: z.string(), data: UpdateSettingGroupSchema })).output(SettingGroupSchema),
    remove: oc.input(z.object({ id: z.string() })).output(z.object({ success: z.boolean() })),
  }),

  definitions: oc.router({
    list: oc.input(z.object({ module: z.string().optional() })).output(z.array(SettingDefinitionSchema)),
    listByCategory: oc.input(z.object({ key: z.string() })).output(z.array(SettingDefinitionSchema)),
    create: oc.input(CreateSettingDefinitionSchema).output(SettingDefinitionSchema),
    update: oc.input(z.object({ id: z.string(), data: UpdateSettingDefinitionSchema })).output(SettingDefinitionSchema),
    remove: oc.input(z.object({ id: z.string() })).output(z.object({ success: z.boolean() })),
  }),

  seed: oc.input(z.object({})).output(z.record(z.string(), z.unknown())),
  migrate: oc.input(z.object({})).output(z.object({ totalMigrated: z.number(), totalSkipped: z.number() })),
};

// ── Values (runtime KV) ───────────────────────────────────────────────────────

const valuesContract = {
  all: oc
    .input(Q)
    .output(z.record(z.string(), SettingValueResponseSchema)),
  get: oc
    .input(z.object({ key: z.string(), companyId: z.string().optional() }))
    .output(SettingValueResponseSchema),
  set: oc
    .input(UpdateSettingValueSchema)
    .output(z.record(z.string(), z.unknown())),
  bulk: oc
    .input(BulkUpdateSettingsSchema)
    .output(z.object({ updated: z.number() })),
  reset: oc
    .input(Q)
    .output(z.array(z.record(z.string(), z.unknown()))),
  options: oc
    .input(z.object({ key: z.string() }))
    .output(z.object({ key: z.string(), options: z.array(z.object({ label: z.string(), value: z.string() })) })),
  export: oc
    .input(z.object({ companyId: z.string().optional(), domains: z.array(z.string()).optional() }))
    .output(z.record(z.string(), z.unknown())),
  import: oc
    .input(z.object({
      companyId: z.string(),
      modules: z.array(z.object({ key: z.string(), settings: z.record(z.string(), z.string()).optional() })).optional(),
      settings: z.record(z.string(), z.string()).optional(),
    }))
    .output(z.object({ imported: z.array(z.string()) })),
};

// ── Modules ───────────────────────────────────────────────────────────────────

const modulesContract = {
  list: oc.input(z.object({})).output(z.array(AppModuleSchema)),
  get:  oc.input(z.object({ key: z.string() })).output(AppModuleSchema),

  company: oc.router({
    list: oc.input(z.object({ companyId: z.string() })).output(z.array(CompanyModuleSchema)),
    enable: oc.input(z.object({ companyId: z.string(), moduleKey: z.string() })).output(CompanyModuleSchema),
    disable: oc.input(z.object({ companyId: z.string(), moduleKey: z.string() })).output(z.object({ success: z.boolean() })),
    updateSettings: oc
      .input(z.object({ companyId: z.string(), moduleKey: z.string(), settings: z.record(z.string(), z.string()) }))
      .output(CompanyModuleSchema),
    getConfiguration: oc
      .input(z.object({ companyId: z.string() }))
      .output(z.array(AppModuleSchema.extend({ isEnabled: z.boolean() }))),
  }),
};

// ── Inputs ────────────────────────────────────────────────────────────────────

const inputsContract = {
  list: oc.input(z.object({})).output(z.array(SettingInputSchema)),
  get:  oc.input(z.object({ key: z.string() })).output(SettingInputSchema),
  forCategory: oc
    .input(z.object({ categoryKey: z.string(), companyId: z.string().optional() }))
    .output(z.array(SettingInputSchema)),
};

// ── Templates ─────────────────────────────────────────────────────────────────

const templatesContract = {
  list: oc.input(z.object({})).output(z.array(BusinessTypeTemplateSchema)),
  get:  oc.input(z.object({ key: z.string() })).output(BusinessTypeTemplateSchema),
  apply: oc
    .input(z.object({ key: z.string(), companyId: z.string() }))
    .output(ApplyTemplateResultSchema),
  dependencies: oc
    .input(z.object({ moduleKey: z.string(), companyId: z.string().optional() }))
    .output(z.object({
      moduleKey: z.string(),
      dependencies: z.array(z.string()),
      validation: z.object({ valid: z.boolean(), missing: z.array(z.string()) }),
    })),
};

// ── Setup Wizard ──────────────────────────────────────────────────────────────

const setupContract = {
  progress: oc
    .input(z.object({ companyId: z.string() }))
    .output(CompanySetupProgressSchema),
  start: oc
    .input(z.object({ companyId: z.string() }))
    .output(CompanySetupProgressSchema),
  completeStep: oc
    .input(z.object({ companyId: z.string(), stepKey: z.string(), data: z.record(z.string(), z.string()).optional() }))
    .output(CompanySetupProgressSchema),
  skipStep: oc
    .input(z.object({ companyId: z.string(), stepKey: z.string() }))
    .output(CompanySetupProgressSchema),
  reset: oc
    .input(z.object({ companyId: z.string() }))
    .output(CompanySetupProgressSchema),
  summary: oc
    .input(z.object({ companyId: z.string() }))
    .output(z.object({
      completedSteps: z.array(z.string()),
      remainingSteps: z.array(z.string()),
      isFullyConfigured: z.boolean(),
      overallProgress: z.number(),
      scopeSummary: z.record(z.string(), z.array(z.string())),
      moduleActivities: z.array(z.object({
        moduleId: z.string(),
        action: z.string(),
        timestamp: z.string(),
        stepKey: z.string(),
      })),
    })),
  validateStep: oc
    .input(z.object({ stepKey: z.string(), data: z.record(z.string(), z.string()) }))
    .output(z.object({ valid: z.boolean(), errors: z.array(z.string()) })),
};

// ── Profile ───────────────────────────────────────────────────────────────────

const profileContract = {
  get: oc
    .input(z.object({ companyId: z.string() }))
    .output(StructuredCompanyProfileSchema),
  update: oc
    .input(z.object({
      companyId: z.string(),
      section: z.enum(['profile', 'localization', 'financial', 'invoice', 'currency', 'email', 'taxes', 'modules', 'defaults', 'users']),
      data: z.record(z.string(), z.string()),
    }))
    .output(z.object({ success: z.boolean(), section: z.string(), updatedKeys: z.array(z.string()) })),
  checklist: oc
    .input(z.object({ companyId: z.string() }))
    .output(SetupChecklistSchema),
  financialParams: oc.router({
    get: oc.input(z.object({ companyId: z.string() })).output(z.record(z.string(), z.unknown())),
    update: oc
      .input(z.object({ companyId: z.string(), params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])) }))
      .output(z.object({ success: z.boolean(), updatedKeys: z.array(z.string()) })),
  }),
};

// ── Central Control Panel ──────────────────────────────────────────────────────

const centralControlPanelContract = {
  get: oc
    .input(z.object({ companyId: z.string() }))
    .output(z.object({
      companyId: z.string(),
      generatedAt: z.string(),
      sources: z.array(z.string()),
      businessIdentity: z.object({
        name: z.string(),
        tin: z.string().optional(),
        vatNumber: z.string().optional(),
        businessType: z.string().optional(),
        language: z.string(),
        location: z.string().optional(),
        logoUrl: z.string().optional(),
        fiscalYearStart: z.number(),
        currencyCode: z.string(),
        industry: z.string().optional(),
        teamSize: z.string().optional(),
      }),
      localization: z.object({
        language: z.string(),
        timezone: z.string(),
        dateFormat: z.string(),
        decimalSeparator: z.string(),
        thousandsSeparator: z.string(),
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
        allowedCurrencies: z.array(z.string()),
        fxRateSource: z.string(),
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
      modules: z.array(z.object({
        key: z.string(),
        name: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        isEnabled: z.boolean(),
        isCore: z.boolean(),
        settings: z.record(z.string(), z.unknown()),
      })),
      security: z.object({
        defaultUserRole: z.string(),
        allowCustomerPortal: z.string(),
        allowVendorPortal: z.string(),
        sessionTimeoutMinutes: z.string(),
        passwordMinLength: z.string(),
        requireTwoFactor: z.string(),
        maxLoginAttempts: z.string(),
      }),
      defaults: z.object({
        defaultBankAccount: z.string(),
        defaultPaymentMethod: z.string(),
        defaultTaxRate: z.string(),
        defaultInvoiceDueDays: z.string(),
        defaultInvoiceReminderDays: z.string(),
      }),
      system: z.object({
        version: z.string(),
        environment: z.string(),
        autoUpdate: z.boolean(),
        currentVersion: z.string(),
      }),
      ifrs: z.object({
        config: z.record(z.string(), z.unknown()),
        standards: z.array(z.record(z.string(), z.unknown())),
        templates: z.array(z.record(z.string(), z.unknown())),
      }),
      changeHistory: z.array(z.record(z.string(), z.unknown())),
    })),
  updateSection: oc
    .input(z.object({
      companyId: z.string(),
      section: z.enum(['businessIdentity', 'localization', 'financial', 'invoice', 'currency', 'taxes', 'email', 'security', 'defaults', 'system']),
      data: z.record(z.string(), z.unknown()),
    }))
    .output(z.object({ success: z.boolean(), section: z.string(), updatedKeys: z.array(z.string()) })),
  migrate: oc
    .input(z.object({ companyId: z.string() }))
    .output(z.object({
      companyId: z.string(),
      totalMigrated: z.number(),
      totalSkipped: z.number(),
      details: z.record(z.string(), z.object({
        migrated: z.number(),
        skipped: z.number(),
      })),
    })),
};

// ── RBAC: Roles & Permissions CRUD ─────────────────────────────────────────────

const rolesContract = {
  permissions: oc.router({
    list: oc.input(z.object({ companyId: z.string().optional(), category: z.string().optional(), isActive: z.boolean().optional() })).output(z.array(PermissionSchema)),
    get:  oc.input(z.object({ id: z.string() })).output(PermissionSchema),
    create: oc.input(CreatePermissionSchema).output(PermissionSchema),
    update: oc.input(z.object({ id: z.string(), data: UpdatePermissionSchema })).output(PermissionSchema),
    toggle: oc.input(TogglePermissionStatusSchema).output(PermissionSchema),
    remove: oc.input(z.object({ id: z.string() })).output(z.object({ success: z.boolean() })),
    seed: oc.input(z.object({ companyId: z.string().optional() })).output(z.object({ created: z.number(), skipped: z.number() })),
  }),

  roles: oc.router({
    list: oc.input(z.object({ companyId: z.string().optional(), isActive: z.boolean().optional(), isSystem: z.boolean().optional() })).output(z.array(RoleDefinitionSchema)),
    get:  oc.input(z.object({ id: z.string() })).output(RoleDefinitionSchema),
    create: oc.input(CreateRoleDefinitionSchema).output(RoleDefinitionSchema),
    update: oc.input(z.object({ id: z.string(), data: UpdateRoleDefinitionSchema })).output(RoleDefinitionSchema),
    toggle: oc.input(ToggleRoleStatusSchema).output(RoleDefinitionSchema),
    remove: oc.input(z.object({ id: z.string() })).output(z.object({ success: z.boolean() })),
    assignPermissions: oc.input(z.object({ id: z.string(), permissionIds: z.array(z.string()) })).output(RoleDefinitionSchema),
    removePermission: oc.input(RolePermissionAssignmentSchema).output(z.object({ success: z.boolean() })),
    seed: oc.input(z.object({ companyId: z.string().optional() })).output(z.object({ created: z.number(), skipped: z.number() })),
  }),
};

// ── Root settings contract ─────────────────────────────────────────────────────

export const settingsContract = oc.router({
  catalog: oc.router(catalogContract),
  values: oc.router(valuesContract),
  modules: oc.router(modulesContract),
  inputs: oc.router(inputsContract),
  templates: oc.router(templatesContract),
  setup: oc.router(setupContract),
  profile: oc.router(profileContract),
  centralControlPanel: oc.router(centralControlPanelContract),
  roles: oc.router(rolesContract),
});

export type SettingsContract = typeof settingsContract;
