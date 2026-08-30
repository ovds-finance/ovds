/**
 * @ovds/contracts/schemas/settings
 *
 * Zod schemas for the modular settings system — categories, groups, definitions,
 * KV values, modules, inputs, templates, and the setup wizard.
 *
 * These schemas mirror the SettingsService DTOs so both backend and frontend
 * share a single source of truth via the oRPC contract.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get AppModuleSchema () {
        return AppModuleSchema;
    },
    get ApplyTemplateResultSchema () {
        return ApplyTemplateResultSchema;
    },
    get BulkUpdateSettingsSchema () {
        return BulkUpdateSettingsSchema;
    },
    get BusinessIdentitySettingsDtoSchema () {
        return BusinessIdentitySettingsDtoSchema;
    },
    get BusinessTypeTemplateSchema () {
        return BusinessTypeTemplateSchema;
    },
    get CompanyModuleSchema () {
        return CompanyModuleSchema;
    },
    get CompanySetupProgressSchema () {
        return CompanySetupProgressSchema;
    },
    get CreatePermissionSchema () {
        return CreatePermissionSchema;
    },
    get CreateRoleDefinitionSchema () {
        return CreateRoleDefinitionSchema;
    },
    get CreateSettingCategorySchema () {
        return CreateSettingCategorySchema;
    },
    get CreateSettingDefinitionSchema () {
        return CreateSettingDefinitionSchema;
    },
    get CreateSettingGroupSchema () {
        return CreateSettingGroupSchema;
    },
    get DefaultsSettingsDtoSchema () {
        return DefaultsSettingsDtoSchema;
    },
    get IntegrationsSettingsDtoSchema () {
        return IntegrationsSettingsDtoSchema;
    },
    get LocalizationSettingsDtoSchema () {
        return LocalizationSettingsDtoSchema;
    },
    get PermissionSchema () {
        return PermissionSchema;
    },
    get RoleDefinitionSchema () {
        return RoleDefinitionSchema;
    },
    get RolePermissionAssignmentSchema () {
        return RolePermissionAssignmentSchema;
    },
    get SecuritySettingsDtoSchema () {
        return SecuritySettingsDtoSchema;
    },
    get SettingCategorySchema () {
        return SettingCategorySchema;
    },
    get SettingDefinitionSchema () {
        return SettingDefinitionSchema;
    },
    get SettingGroupSchema () {
        return SettingGroupSchema;
    },
    get SettingInputSchema () {
        return SettingInputSchema;
    },
    get SettingTypeSchema () {
        return SettingTypeSchema;
    },
    get SettingValueResponseSchema () {
        return SettingValueResponseSchema;
    },
    get SetupChecklistSchema () {
        return SetupChecklistSchema;
    },
    get SetupScopeSchema () {
        return SetupScopeSchema;
    },
    get SetupStatusSchema () {
        return SetupStatusSchema;
    },
    get SetupStepStatusSchema () {
        return SetupStepStatusSchema;
    },
    get StructuredCompanyProfileSchema () {
        return StructuredCompanyProfileSchema;
    },
    get SystemSettingsDtoSchema () {
        return SystemSettingsDtoSchema;
    },
    get TogglePermissionStatusSchema () {
        return TogglePermissionStatusSchema;
    },
    get ToggleRoleStatusSchema () {
        return ToggleRoleStatusSchema;
    },
    get UpdatePermissionSchema () {
        return UpdatePermissionSchema;
    },
    get UpdateRoleDefinitionSchema () {
        return UpdateRoleDefinitionSchema;
    },
    get UpdateSettingCategorySchema () {
        return UpdateSettingCategorySchema;
    },
    get UpdateSettingDefinitionSchema () {
        return UpdateSettingDefinitionSchema;
    },
    get UpdateSettingGroupSchema () {
        return UpdateSettingGroupSchema;
    },
    get UpdateSettingValueSchema () {
        return UpdateSettingValueSchema;
    }
});
const _zod = require("zod");
const SettingTypeSchema = _zod.z.enum([
    'text',
    'textarea',
    'number',
    'select',
    'toggle',
    'date',
    'email',
    'url',
    'image',
    'json',
    'password'
]);
const SetupScopeSchema = _zod.z.enum([
    'company',
    'financial',
    'modules',
    'users',
    'system',
    'compliance',
    'deployment'
]);
const SetupStatusSchema = _zod.z.enum([
    'pending',
    'in_progress',
    'completed',
    'skipped'
]);
const SettingCategorySchema = _zod.z.object({
    id: _zod.z.string(),
    key: _zod.z.string(),
    name: _zod.z.string(),
    description: _zod.z.string().nullish(),
    icon: _zod.z.string().nullish(),
    sortOrder: _zod.z.number().int().default(0),
    isActive: _zod.z.boolean().default(true),
    createdAt: _zod.z.string().optional(),
    updatedAt: _zod.z.string().optional()
});
const CreateSettingCategorySchema = SettingCategorySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).partial({
    sortOrder: true,
    isActive: true
});
const UpdateSettingCategorySchema = CreateSettingCategorySchema.partial();
const SettingGroupSchema = _zod.z.object({
    id: _zod.z.string(),
    categoryId: _zod.z.string(),
    key: _zod.z.string(),
    name: _zod.z.string(),
    description: _zod.z.string().nullish(),
    sortOrder: _zod.z.number().int().default(0),
    isActive: _zod.z.boolean().default(true),
    createdAt: _zod.z.string().optional(),
    updatedAt: _zod.z.string().optional()
});
const CreateSettingGroupSchema = SettingGroupSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).partial({
    sortOrder: true,
    isActive: true
});
const UpdateSettingGroupSchema = CreateSettingGroupSchema.partial();
const SettingDefinitionSchema = _zod.z.object({
    id: _zod.z.string(),
    key: _zod.z.string(),
    value: _zod.z.string(),
    type: SettingTypeSchema,
    categoryId: _zod.z.string(),
    groupId: _zod.z.string().nullish(),
    companyId: _zod.z.string().nullish(),
    defaultValue: _zod.z.string().nullish(),
    options: _zod.z.string().nullish(),
    isRequired: _zod.z.boolean().default(false),
    isGlobal: _zod.z.boolean().default(false),
    isEncrypted: _zod.z.boolean().default(false),
    sortOrder: _zod.z.number().int().default(0),
    placeholder: _zod.z.string().nullish(),
    hint: _zod.z.string().nullish(),
    module: _zod.z.string().nullish(),
    createdAt: _zod.z.string().optional(),
    updatedAt: _zod.z.string().optional()
});
const CreateSettingDefinitionSchema = SettingDefinitionSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).partial({
    sortOrder: true,
    isRequired: true,
    isGlobal: true,
    isEncrypted: true
});
const UpdateSettingDefinitionSchema = CreateSettingDefinitionSchema.partial();
const SettingValueResponseSchema = _zod.z.object({
    key: _zod.z.string(),
    value: _zod.z.string(),
    source: _zod.z.enum([
        'kv',
        'modular',
        'legacy',
        'missing'
    ]),
    type: _zod.z.string().nullish(),
    category: _zod.z.string().nullish(),
    group: _zod.z.string().nullish()
});
const UpdateSettingValueSchema = _zod.z.object({
    key: _zod.z.string(),
    value: _zod.z.string(),
    companyId: _zod.z.string().optional()
});
const BulkUpdateSettingsSchema = _zod.z.object({
    values: _zod.z.record(_zod.z.string(), _zod.z.string()),
    companyId: _zod.z.string().optional()
});
const AppModuleSchema = _zod.z.object({
    id: _zod.z.string(),
    key: _zod.z.string(),
    name: _zod.z.string(),
    description: _zod.z.string().nullish(),
    icon: _zod.z.string().nullish(),
    sortOrder: _zod.z.number().int().default(0),
    isActive: _zod.z.boolean().default(true),
    isCore: _zod.z.boolean().default(false),
    createdAt: _zod.z.string().optional(),
    updatedAt: _zod.z.string().optional()
});
const CompanyModuleSchema = _zod.z.object({
    id: _zod.z.string(),
    companyId: _zod.z.string(),
    moduleKey: _zod.z.string(),
    isEnabled: _zod.z.boolean(),
    settings: _zod.z.string().nullish(),
    createdAt: _zod.z.string().optional(),
    updatedAt: _zod.z.string().optional(),
    module: AppModuleSchema.optional()
});
const SettingInputSchema = _zod.z.object({
    id: _zod.z.string(),
    settingKey: _zod.z.string(),
    component: _zod.z.string().nullish(),
    options: _zod.z.string().nullish(),
    validation: _zod.z.string().nullish(),
    placeholder: _zod.z.string().nullish(),
    hint: _zod.z.string().nullish(),
    helpUrl: _zod.z.string().nullish(),
    dependsOn: _zod.z.string().nullish(),
    dependsValue: _zod.z.string().nullish(),
    sortOrder: _zod.z.number().int().default(0),
    isVisible: _zod.z.boolean().default(true),
    isReadonly: _zod.z.boolean().default(false),
    isRequired: _zod.z.boolean().default(false),
    layout: _zod.z.string().nullish(),
    cssClass: _zod.z.string().nullish()
});
const BusinessTypeTemplateSchema = _zod.z.object({
    key: _zod.z.string(),
    label: _zod.z.string(),
    description: _zod.z.string(),
    modules: _zod.z.array(_zod.z.string()),
    settings: _zod.z.record(_zod.z.string(), _zod.z.string())
});
const ApplyTemplateResultSchema = _zod.z.object({
    template: BusinessTypeTemplateSchema,
    companyId: _zod.z.string(),
    enabledModules: _zod.z.array(_zod.z.string()),
    appliedSettings: _zod.z.record(_zod.z.string(), _zod.z.string())
});
const SetupStepStatusSchema = _zod.z.object({
    stepKey: _zod.z.string(),
    status: SetupStatusSchema,
    completedAt: _zod.z.string().optional(),
    completedBy: _zod.z.string().optional(),
    data: _zod.z.record(_zod.z.string(), _zod.z.string()).optional(),
    scope: SetupScopeSchema.optional(),
    moduleId: _zod.z.string().optional()
});
const CompanySetupProgressSchema = _zod.z.object({
    companyId: _zod.z.string(),
    currentStep: _zod.z.string().optional(),
    overallProgress: _zod.z.number(),
    steps: _zod.z.array(SetupStepStatusSchema),
    startedAt: _zod.z.string(),
    updatedAt: _zod.z.string(),
    completedAt: _zod.z.string().optional(),
    scopeSummary: _zod.z.record(_zod.z.string(), _zod.z.array(_zod.z.string())).optional(),
    moduleActivities: _zod.z.array(_zod.z.object({
        moduleId: _zod.z.string(),
        action: _zod.z.string(),
        timestamp: _zod.z.string(),
        stepKey: _zod.z.string()
    })).optional()
});
const SecuritySettingsDtoSchema = _zod.z.object({
    default_user_role: _zod.z.string(),
    allow_customer_portal: _zod.z.string(),
    allow_vendor_portal: _zod.z.string(),
    session_timeout_minutes: _zod.z.string(),
    password_min_length: _zod.z.string(),
    require_two_factor: _zod.z.string(),
    max_login_attempts: _zod.z.string(),
    jwt_expires_in: _zod.z.string(),
    enforce_https: _zod.z.string(),
    strict_file_upload: _zod.z.string()
});
const LocalizationSettingsDtoSchema = _zod.z.object({
    language: _zod.z.string(),
    timezone: _zod.z.string(),
    date_format: _zod.z.string(),
    time_format: _zod.z.string().optional(),
    decimal_separator: _zod.z.string(),
    thousands_separator: _zod.z.string(),
    theme: _zod.z.string().optional()
});
const BusinessIdentitySettingsDtoSchema = _zod.z.object({
    company_name: _zod.z.string(),
    company_email: _zod.z.string(),
    company_phone: _zod.z.string(),
    company_address: _zod.z.string(),
    company_tin: _zod.z.string(),
    company_vat_number: _zod.z.string(),
    company_business_type: _zod.z.string(),
    company_logo_url: _zod.z.string(),
    company_industry: _zod.z.string().optional(),
    company_team_size: _zod.z.string().optional()
});
const DefaultsSettingsDtoSchema = _zod.z.object({
    default_bank_account: _zod.z.string(),
    default_payment_method: _zod.z.string(),
    default_tax_rate: _zod.z.string(),
    default_invoice_due_days: _zod.z.string(),
    default_invoice_reminder_days: _zod.z.string(),
    default_currency: _zod.z.string()
});
const SystemSettingsDtoSchema = _zod.z.object({
    version: _zod.z.string(),
    current_version: _zod.z.string(),
    environment: _zod.z.string(),
    auto_update: _zod.z.string(),
    jwt_expires_in: _zod.z.string(),
    enforce_https: _zod.z.string(),
    strict_file_upload: _zod.z.string(),
    max_request_size: _zod.z.string(),
    rate_limit_threshold: _zod.z.string(),
    rate_limit_window_seconds: _zod.z.string(),
    db_connection_limit: _zod.z.string()
});
const IntegrationsSettingsDtoSchema = _zod.z.object({
    openai_api_key: _zod.z.string(),
    gemini_api_key: _zod.z.string(),
    siem_webhook_url: _zod.z.string(),
    siem_token: _zod.z.string(),
    request_signing_secret: _zod.z.string()
});
const StructuredCompanyProfileSchema = _zod.z.object({
    company: _zod.z.object({
        companyName: _zod.z.string(),
        companyEmail: _zod.z.string(),
        companyPhone: _zod.z.string(),
        companyAddress: _zod.z.string(),
        companyTin: _zod.z.string(),
        companyVatNumber: _zod.z.string(),
        companyBusinessType: _zod.z.string(),
        companyLogoUrl: _zod.z.string(),
        companyIndustry: _zod.z.string().optional(),
        companyTeamSize: _zod.z.string().optional()
    }),
    localization: _zod.z.object({
        language: _zod.z.string(),
        timezone: _zod.z.string(),
        dateFormat: _zod.z.string(),
        decimalSeparator: _zod.z.string(),
        thousandsSeparator: _zod.z.string(),
        timeFormat: _zod.z.string().optional(),
        theme: _zod.z.string().optional()
    }),
    financial: _zod.z.object({
        defaultCurrency: _zod.z.string(),
        currencyPosition: _zod.z.string(),
        currencyRateProvider: _zod.z.string(),
        currencyAutoUpdate: _zod.z.string(),
        fiscalYearStart: _zod.z.string(),
        reportCurrency: _zod.z.string()
    }),
    invoice: _zod.z.object({
        invoicePrefix: _zod.z.string(),
        invoiceNextNumber: _zod.z.string(),
        invoiceTemplate: _zod.z.string(),
        invoiceFooter: _zod.z.string(),
        invoiceShowQr: _zod.z.string(),
        invoiceShowLogo: _zod.z.string(),
        invoiceShowBankDetails: _zod.z.string(),
        invoiceDueDays: _zod.z.string(),
        invoiceReminderDays: _zod.z.string()
    }),
    currency: _zod.z.object({
        defaultCurrency: _zod.z.string(),
        currencyPosition: _zod.z.string(),
        currencyRateProvider: _zod.z.string(),
        currencyAutoUpdate: _zod.z.string(),
        reportCurrency: _zod.z.string(),
        multiCurrencyEnabled: _zod.z.string(),
        allowedCurrencies: _zod.z.string(),
        fxRateSource: _zod.z.string()
    }),
    email: _zod.z.object({
        smtpHost: _zod.z.string(),
        smtpPort: _zod.z.string(),
        smtpUsername: _zod.z.string(),
        smtpPassword: _zod.z.string(),
        smtpEncryption: _zod.z.string(),
        mailFromName: _zod.z.string(),
        mailFromAddress: _zod.z.string(),
        mailEngine: _zod.z.string()
    }),
    taxes: _zod.z.object({
        vatEnabled: _zod.z.string(),
        vatRate: _zod.z.string(),
        totEnabled: _zod.z.string(),
        whtEnabled: _zod.z.string(),
        bitEnabled: _zod.z.string(),
        pitEnabled: _zod.z.string(),
        drrfEnabled: _zod.z.string()
    }),
    defaults: _zod.z.object({
        defaultBankAccount: _zod.z.string(),
        defaultPaymentMethod: _zod.z.string(),
        defaultTaxRate: _zod.z.string(),
        defaultInvoiceDueDays: _zod.z.string(),
        defaultInvoiceReminderDays: _zod.z.string(),
        defaultCurrency: _zod.z.string()
    }),
    users: _zod.z.object({
        defaultUserRole: _zod.z.string(),
        allowCustomerPortal: _zod.z.string(),
        allowVendorPortal: _zod.z.string(),
        sessionTimeoutMinutes: _zod.z.string(),
        passwordMinLength: _zod.z.string(),
        requireTwoFactor: _zod.z.string(),
        maxLoginAttempts: _zod.z.string(),
        jwtExpiresIn: _zod.z.string(),
        enforceHttps: _zod.z.string(),
        strictFileUpload: _zod.z.string()
    }),
    modules: _zod.z.record(_zod.z.string(), _zod.z.string()),
    system: _zod.z.object({
        version: _zod.z.string(),
        currentVersion: _zod.z.string(),
        environment: _zod.z.string(),
        autoUpdate: _zod.z.string(),
        jwtExpiresIn: _zod.z.string(),
        enforceHttps: _zod.z.string(),
        strictFileUpload: _zod.z.string(),
        maxRequestSize: _zod.z.string(),
        rateLimitThreshold: _zod.z.string(),
        rateLimitWindowSeconds: _zod.z.string(),
        dbConnectionLimit: _zod.z.string()
    }),
    integrations: _zod.z.object({
        openaiApiKey: _zod.z.string(),
        geminiApiKey: _zod.z.string(),
        siemWebhookUrl: _zod.z.string(),
        siemToken: _zod.z.string(),
        requestSigningSecret: _zod.z.string()
    })
});
const SetupChecklistSchema = _zod.z.object({
    companyId: _zod.z.string(),
    checks: _zod.z.object({
        companyProfileComplete: _zod.z.boolean(),
        localizationConfigured: _zod.z.boolean(),
        financialConfigured: _zod.z.boolean(),
        fiscalYearSet: _zod.z.boolean(),
        taxesConfigured: _zod.z.boolean(),
        coreModulesEnabled: _zod.z.boolean(),
        totalChecks: _zod.z.number().int(),
        passedChecks: _zod.z.number().int()
    }),
    profile: StructuredCompanyProfileSchema,
    parameters: _zod.z.record(_zod.z.string(), _zod.z.unknown()),
    modules: _zod.z.array(AppModuleSchema.extend({
        isEnabled: _zod.z.boolean()
    })),
    suggestedInputs: _zod.z.array(SettingInputSchema)
});
const PermissionSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    description: _zod.z.string().nullish(),
    category: _zod.z.string().nullish(),
    isActive: _zod.z.boolean().default(true),
    companyId: _zod.z.string().nullish(),
    createdAt: _zod.z.string().optional(),
    updatedAt: _zod.z.string().optional()
});
const CreatePermissionSchema = PermissionSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    companyId: true
}).partial({
    isActive: true
});
const UpdatePermissionSchema = CreatePermissionSchema.partial();
const RoleDefinitionSchema = _zod.z.object({
    id: _zod.z.string(),
    name: _zod.z.string(),
    description: _zod.z.string().nullish(),
    isActive: _zod.z.boolean().default(true),
    isSystem: _zod.z.boolean().default(false),
    companyId: _zod.z.string().nullish(),
    createdAt: _zod.z.string().optional(),
    updatedAt: _zod.z.string().optional(),
    permissions: _zod.z.array(PermissionSchema).default([])
});
const CreateRoleDefinitionSchema = RoleDefinitionSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    companyId: true,
    permissions: true
}).partial({
    isActive: true,
    isSystem: true
});
const UpdateRoleDefinitionSchema = CreateRoleDefinitionSchema.partial();
const RolePermissionAssignmentSchema = _zod.z.object({
    roleId: _zod.z.string(),
    permissionId: _zod.z.string()
});
const ToggleRoleStatusSchema = _zod.z.object({
    roleId: _zod.z.string(),
    isActive: _zod.z.boolean()
});
const TogglePermissionStatusSchema = _zod.z.object({
    permissionId: _zod.z.string(),
    isActive: _zod.z.boolean()
});
