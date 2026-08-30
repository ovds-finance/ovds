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
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "settingsContract", {
    enumerable: true,
    get: function() {
        return settingsContract;
    }
});
const _contract = require("@orpc/contract");
const _zod = require("zod");
const _settings = require("../schemas/settings");
const Q = _zod.z.object({
    companyId: _zod.z.string().optional()
});
// ── Catalog (schema editor) ───────────────────────────────────────────────────
const catalogContract = {
    categories: _contract.oc.router({
        list: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_settings.SettingCategorySchema)),
        get: _contract.oc.input(_zod.z.object({
            key: _zod.z.string()
        })).output(_settings.SettingCategorySchema),
        create: _contract.oc.input(_settings.CreateSettingCategorySchema).output(_settings.SettingCategorySchema),
        update: _contract.oc.input(_zod.z.object({
            key: _zod.z.string(),
            data: _settings.UpdateSettingCategorySchema
        })).output(_settings.SettingCategorySchema),
        remove: _contract.oc.input(_zod.z.object({
            key: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        }))
    }),
    groups: _contract.oc.router({
        list: _contract.oc.input(_zod.z.object({
            categoryKey: _zod.z.string().optional()
        })).output(_zod.z.array(_settings.SettingGroupSchema)),
        create: _contract.oc.input(_settings.CreateSettingGroupSchema).output(_settings.SettingGroupSchema),
        update: _contract.oc.input(_zod.z.object({
            id: _zod.z.string(),
            data: _settings.UpdateSettingGroupSchema
        })).output(_settings.SettingGroupSchema),
        remove: _contract.oc.input(_zod.z.object({
            id: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        }))
    }),
    definitions: _contract.oc.router({
        list: _contract.oc.input(_zod.z.object({
            module: _zod.z.string().optional()
        })).output(_zod.z.array(_settings.SettingDefinitionSchema)),
        listByCategory: _contract.oc.input(_zod.z.object({
            key: _zod.z.string()
        })).output(_zod.z.array(_settings.SettingDefinitionSchema)),
        create: _contract.oc.input(_settings.CreateSettingDefinitionSchema).output(_settings.SettingDefinitionSchema),
        update: _contract.oc.input(_zod.z.object({
            id: _zod.z.string(),
            data: _settings.UpdateSettingDefinitionSchema
        })).output(_settings.SettingDefinitionSchema),
        remove: _contract.oc.input(_zod.z.object({
            id: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        }))
    }),
    seed: _contract.oc.input(_zod.z.object({})).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    migrate: _contract.oc.input(_zod.z.object({})).output(_zod.z.object({
        totalMigrated: _zod.z.number(),
        totalSkipped: _zod.z.number()
    }))
};
// ── Values (runtime KV) ───────────────────────────────────────────────────────
const valuesContract = {
    all: _contract.oc.input(Q).output(_zod.z.record(_zod.z.string(), _settings.SettingValueResponseSchema)),
    get: _contract.oc.input(_zod.z.object({
        key: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_settings.SettingValueResponseSchema),
    set: _contract.oc.input(_settings.UpdateSettingValueSchema).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    bulk: _contract.oc.input(_settings.BulkUpdateSettingsSchema).output(_zod.z.object({
        updated: _zod.z.number()
    })),
    reset: _contract.oc.input(Q).output(_zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))),
    options: _contract.oc.input(_zod.z.object({
        key: _zod.z.string()
    })).output(_zod.z.object({
        key: _zod.z.string(),
        options: _zod.z.array(_zod.z.object({
            label: _zod.z.string(),
            value: _zod.z.string()
        }))
    })),
    export: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string().optional(),
        domains: _zod.z.array(_zod.z.string()).optional()
    })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
    import: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        modules: _zod.z.array(_zod.z.object({
            key: _zod.z.string(),
            settings: _zod.z.record(_zod.z.string(), _zod.z.string()).optional()
        })).optional(),
        settings: _zod.z.record(_zod.z.string(), _zod.z.string()).optional()
    })).output(_zod.z.object({
        imported: _zod.z.array(_zod.z.string())
    }))
};
// ── Modules ───────────────────────────────────────────────────────────────────
const modulesContract = {
    list: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_settings.AppModuleSchema)),
    get: _contract.oc.input(_zod.z.object({
        key: _zod.z.string()
    })).output(_settings.AppModuleSchema),
    company: _contract.oc.router({
        list: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string()
        })).output(_zod.z.array(_settings.CompanyModuleSchema)),
        enable: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string(),
            moduleKey: _zod.z.string()
        })).output(_settings.CompanyModuleSchema),
        disable: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string(),
            moduleKey: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        })),
        updateSettings: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string(),
            moduleKey: _zod.z.string(),
            settings: _zod.z.record(_zod.z.string(), _zod.z.string())
        })).output(_settings.CompanyModuleSchema),
        getConfiguration: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string()
        })).output(_zod.z.array(_settings.AppModuleSchema.extend({
            isEnabled: _zod.z.boolean()
        })))
    })
};
// ── Inputs ────────────────────────────────────────────────────────────────────
const inputsContract = {
    list: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_settings.SettingInputSchema)),
    get: _contract.oc.input(_zod.z.object({
        key: _zod.z.string()
    })).output(_settings.SettingInputSchema),
    forCategory: _contract.oc.input(_zod.z.object({
        categoryKey: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.array(_settings.SettingInputSchema))
};
// ── Templates ─────────────────────────────────────────────────────────────────
const templatesContract = {
    list: _contract.oc.input(_zod.z.object({})).output(_zod.z.array(_settings.BusinessTypeTemplateSchema)),
    get: _contract.oc.input(_zod.z.object({
        key: _zod.z.string()
    })).output(_settings.BusinessTypeTemplateSchema),
    apply: _contract.oc.input(_zod.z.object({
        key: _zod.z.string(),
        companyId: _zod.z.string()
    })).output(_settings.ApplyTemplateResultSchema),
    dependencies: _contract.oc.input(_zod.z.object({
        moduleKey: _zod.z.string(),
        companyId: _zod.z.string().optional()
    })).output(_zod.z.object({
        moduleKey: _zod.z.string(),
        dependencies: _zod.z.array(_zod.z.string()),
        validation: _zod.z.object({
            valid: _zod.z.boolean(),
            missing: _zod.z.array(_zod.z.string())
        })
    }))
};
// ── Setup Wizard ──────────────────────────────────────────────────────────────
const setupContract = {
    progress: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_settings.CompanySetupProgressSchema),
    start: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_settings.CompanySetupProgressSchema),
    completeStep: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        stepKey: _zod.z.string(),
        data: _zod.z.record(_zod.z.string(), _zod.z.string()).optional()
    })).output(_settings.CompanySetupProgressSchema),
    skipStep: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        stepKey: _zod.z.string()
    })).output(_settings.CompanySetupProgressSchema),
    reset: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_settings.CompanySetupProgressSchema),
    summary: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_zod.z.object({
        completedSteps: _zod.z.array(_zod.z.string()),
        remainingSteps: _zod.z.array(_zod.z.string()),
        isFullyConfigured: _zod.z.boolean(),
        overallProgress: _zod.z.number(),
        scopeSummary: _zod.z.record(_zod.z.string(), _zod.z.array(_zod.z.string())),
        moduleActivities: _zod.z.array(_zod.z.object({
            moduleId: _zod.z.string(),
            action: _zod.z.string(),
            timestamp: _zod.z.string(),
            stepKey: _zod.z.string()
        }))
    })),
    validateStep: _contract.oc.input(_zod.z.object({
        stepKey: _zod.z.string(),
        data: _zod.z.record(_zod.z.string(), _zod.z.string())
    })).output(_zod.z.object({
        valid: _zod.z.boolean(),
        errors: _zod.z.array(_zod.z.string())
    }))
};
// ── Profile ───────────────────────────────────────────────────────────────────
const profileContract = {
    get: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_settings.StructuredCompanyProfileSchema),
    update: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        section: _zod.z.enum([
            'profile',
            'localization',
            'financial',
            'invoice',
            'currency',
            'email',
            'taxes',
            'modules',
            'defaults',
            'users'
        ]),
        data: _zod.z.record(_zod.z.string(), _zod.z.string())
    })).output(_zod.z.object({
        success: _zod.z.boolean(),
        section: _zod.z.string(),
        updatedKeys: _zod.z.array(_zod.z.string())
    })),
    checklist: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_settings.SetupChecklistSchema),
    financialParams: _contract.oc.router({
        get: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string()
        })).output(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
        update: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string(),
            params: _zod.z.record(_zod.z.string(), _zod.z.union([
                _zod.z.string(),
                _zod.z.number(),
                _zod.z.boolean()
            ]))
        })).output(_zod.z.object({
            success: _zod.z.boolean(),
            updatedKeys: _zod.z.array(_zod.z.string())
        }))
    })
};
// ── Central Control Panel ──────────────────────────────────────────────────────
const centralControlPanelContract = {
    get: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_zod.z.object({
        companyId: _zod.z.string(),
        generatedAt: _zod.z.string(),
        sources: _zod.z.array(_zod.z.string()),
        businessIdentity: _zod.z.object({
            name: _zod.z.string(),
            tin: _zod.z.string().optional(),
            vatNumber: _zod.z.string().optional(),
            businessType: _zod.z.string().optional(),
            language: _zod.z.string(),
            location: _zod.z.string().optional(),
            logoUrl: _zod.z.string().optional(),
            fiscalYearStart: _zod.z.number(),
            currencyCode: _zod.z.string(),
            industry: _zod.z.string().optional(),
            teamSize: _zod.z.string().optional()
        }),
        localization: _zod.z.object({
            language: _zod.z.string(),
            timezone: _zod.z.string(),
            dateFormat: _zod.z.string(),
            decimalSeparator: _zod.z.string(),
            thousandsSeparator: _zod.z.string()
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
            allowedCurrencies: _zod.z.array(_zod.z.string()),
            fxRateSource: _zod.z.string()
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
        modules: _zod.z.array(_zod.z.object({
            key: _zod.z.string(),
            name: _zod.z.string(),
            description: _zod.z.string().optional(),
            icon: _zod.z.string().optional(),
            isEnabled: _zod.z.boolean(),
            isCore: _zod.z.boolean(),
            settings: _zod.z.record(_zod.z.string(), _zod.z.unknown())
        })),
        security: _zod.z.object({
            defaultUserRole: _zod.z.string(),
            allowCustomerPortal: _zod.z.string(),
            allowVendorPortal: _zod.z.string(),
            sessionTimeoutMinutes: _zod.z.string(),
            passwordMinLength: _zod.z.string(),
            requireTwoFactor: _zod.z.string(),
            maxLoginAttempts: _zod.z.string()
        }),
        defaults: _zod.z.object({
            defaultBankAccount: _zod.z.string(),
            defaultPaymentMethod: _zod.z.string(),
            defaultTaxRate: _zod.z.string(),
            defaultInvoiceDueDays: _zod.z.string(),
            defaultInvoiceReminderDays: _zod.z.string()
        }),
        system: _zod.z.object({
            version: _zod.z.string(),
            environment: _zod.z.string(),
            autoUpdate: _zod.z.boolean(),
            currentVersion: _zod.z.string()
        }),
        ifrs: _zod.z.object({
            config: _zod.z.record(_zod.z.string(), _zod.z.unknown()),
            standards: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown())),
            templates: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
        }),
        changeHistory: _zod.z.array(_zod.z.record(_zod.z.string(), _zod.z.unknown()))
    })),
    updateSection: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string(),
        section: _zod.z.enum([
            'businessIdentity',
            'localization',
            'financial',
            'invoice',
            'currency',
            'taxes',
            'email',
            'security',
            'defaults',
            'system'
        ]),
        data: _zod.z.record(_zod.z.string(), _zod.z.unknown())
    })).output(_zod.z.object({
        success: _zod.z.boolean(),
        section: _zod.z.string(),
        updatedKeys: _zod.z.array(_zod.z.string())
    })),
    migrate: _contract.oc.input(_zod.z.object({
        companyId: _zod.z.string()
    })).output(_zod.z.object({
        companyId: _zod.z.string(),
        totalMigrated: _zod.z.number(),
        totalSkipped: _zod.z.number(),
        details: _zod.z.record(_zod.z.string(), _zod.z.object({
            migrated: _zod.z.number(),
            skipped: _zod.z.number()
        }))
    }))
};
// ── RBAC: Roles & Permissions CRUD ─────────────────────────────────────────────
const rolesContract = {
    permissions: _contract.oc.router({
        list: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            category: _zod.z.string().optional(),
            isActive: _zod.z.boolean().optional()
        })).output(_zod.z.array(_settings.PermissionSchema)),
        get: _contract.oc.input(_zod.z.object({
            id: _zod.z.string()
        })).output(_settings.PermissionSchema),
        create: _contract.oc.input(_settings.CreatePermissionSchema).output(_settings.PermissionSchema),
        update: _contract.oc.input(_zod.z.object({
            id: _zod.z.string(),
            data: _settings.UpdatePermissionSchema
        })).output(_settings.PermissionSchema),
        toggle: _contract.oc.input(_settings.TogglePermissionStatusSchema).output(_settings.PermissionSchema),
        remove: _contract.oc.input(_zod.z.object({
            id: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        })),
        seed: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.object({
            created: _zod.z.number(),
            skipped: _zod.z.number()
        }))
    }),
    roles: _contract.oc.router({
        list: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional(),
            isActive: _zod.z.boolean().optional(),
            isSystem: _zod.z.boolean().optional()
        })).output(_zod.z.array(_settings.RoleDefinitionSchema)),
        get: _contract.oc.input(_zod.z.object({
            id: _zod.z.string()
        })).output(_settings.RoleDefinitionSchema),
        create: _contract.oc.input(_settings.CreateRoleDefinitionSchema).output(_settings.RoleDefinitionSchema),
        update: _contract.oc.input(_zod.z.object({
            id: _zod.z.string(),
            data: _settings.UpdateRoleDefinitionSchema
        })).output(_settings.RoleDefinitionSchema),
        toggle: _contract.oc.input(_settings.ToggleRoleStatusSchema).output(_settings.RoleDefinitionSchema),
        remove: _contract.oc.input(_zod.z.object({
            id: _zod.z.string()
        })).output(_zod.z.object({
            success: _zod.z.boolean()
        })),
        assignPermissions: _contract.oc.input(_zod.z.object({
            id: _zod.z.string(),
            permissionIds: _zod.z.array(_zod.z.string())
        })).output(_settings.RoleDefinitionSchema),
        removePermission: _contract.oc.input(_settings.RolePermissionAssignmentSchema).output(_zod.z.object({
            success: _zod.z.boolean()
        })),
        seed: _contract.oc.input(_zod.z.object({
            companyId: _zod.z.string().optional()
        })).output(_zod.z.object({
            created: _zod.z.number(),
            skipped: _zod.z.number()
        }))
    })
};
const settingsContract = _contract.oc.router({
    catalog: _contract.oc.router(catalogContract),
    values: _contract.oc.router(valuesContract),
    modules: _contract.oc.router(modulesContract),
    inputs: _contract.oc.router(inputsContract),
    templates: _contract.oc.router(templatesContract),
    setup: _contract.oc.router(setupContract),
    profile: _contract.oc.router(profileContract),
    centralControlPanel: _contract.oc.router(centralControlPanelContract),
    roles: _contract.oc.router(rolesContract)
});
