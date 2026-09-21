/**
 * Settings domain API client — @ovds/features/settings
 *
 * Covers: Company settings, module enable/disable, settings catalog,
 * system administration, setup wizard.
 */
import type { RbacRoleDTO, RbacPermissionDTO, SodRuleDTO, AuditEventCatalogDTO } from '../types/settings.types';
export declare const companySettingsApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: any) => Promise<any>;
    updateMany: (companyId: string, values: Record<string, string>) => Promise<any>;
};
export declare const moduleSettingsApi: {
    list: (companyId?: string | null) => Promise<any[]>;
    enable: (companyId: string, moduleKey: string, defaults?: Record<string, string>) => Promise<any>;
    disable: (companyId: string, moduleKey: string) => Promise<any>;
    isEnabled: (companyId: string, moduleKey: string) => Promise<any>;
};
export declare const settingsCatalogApi: {
    list: (params?: {
        category?: string;
        group?: string;
        companyId?: string | null;
    }) => Promise<any[]>;
    get: (key: string, companyId?: string | null) => Promise<any>;
    update: (key: string, value: string, companyId?: string | null) => Promise<any>;
    create: (data: any) => Promise<any>;
    remove: (key: string) => Promise<void>;
};
export declare const settingsCatalogCategoriesApi: {
    list: () => Promise<any[]>;
    get: (key: string) => Promise<any>;
    create: (dto: {
        key: string;
        name: string;
        description?: string;
        icon?: string;
    }) => Promise<any>;
    update: (key: string, dto: Partial<{
        key: string;
        name: string;
        description: string;
        icon: string;
    }>) => Promise<any>;
    delete: (key: string) => Promise<void>;
};
export declare const settingsCatalogGroupsApi: {
    list: (categoryKey?: string) => Promise<any[]>;
    create: (dto: {
        categoryId: string;
        key: string;
        name: string;
        description?: string;
    }) => Promise<any>;
    update: (id: string, dto: Partial<{
        name: string;
        description: string;
    }>) => Promise<any>;
    delete: (id: string) => Promise<void>;
};
export declare const settingsCatalogDefinitionsApi: {
    list: (module?: string) => Promise<any[]>;
    getByCategory: (categoryKey: string) => Promise<any[]>;
    create: (dto: any) => Promise<any>;
    update: (id: string, dto: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
};
export declare const settingsCatalogValuesApi: {
    list: (companyId?: string) => Promise<Record<string, any>>;
    get: (key: string, companyId?: string) => Promise<any>;
    update: (key: string, value: string, companyId?: string) => Promise<{
        key: string;
        value: string;
    }>;
    bulkUpdate: (values: Record<string, string>, companyId?: string) => Promise<{
        updated: number;
    }>;
    reset: (companyId?: string) => Promise<Record<string, string>>;
};
export declare const settingsCatalogOptionsApi: {
    getForSetting: (key: string) => Promise<any[]>;
};
export declare const settingsCatalog: {
    categories: {
        list: () => Promise<any[]>;
        get: (key: string) => Promise<any>;
        create: (dto: {
            key: string;
            name: string;
            description?: string;
            icon?: string;
        }) => Promise<any>;
        update: (key: string, dto: Partial<{
            key: string;
            name: string;
            description: string;
            icon: string;
        }>) => Promise<any>;
        delete: (key: string) => Promise<void>;
    };
    groups: {
        list: (categoryKey?: string) => Promise<any[]>;
        create: (dto: {
            categoryId: string;
            key: string;
            name: string;
            description?: string;
        }) => Promise<any>;
        update: (id: string, dto: Partial<{
            name: string;
            description: string;
        }>) => Promise<any>;
        delete: (id: string) => Promise<void>;
    };
    definitions: {
        list: (module?: string) => Promise<any[]>;
        getByCategory: (categoryKey: string) => Promise<any[]>;
        create: (dto: any) => Promise<any>;
        update: (id: string, dto: any) => Promise<any>;
        delete: (id: string) => Promise<void>;
    };
    values: {
        list: (companyId?: string) => Promise<Record<string, any>>;
        get: (key: string, companyId?: string) => Promise<any>;
        update: (key: string, value: string, companyId?: string) => Promise<{
            key: string;
            value: string;
        }>;
        bulkUpdate: (values: Record<string, string>, companyId?: string) => Promise<{
            updated: number;
        }>;
        reset: (companyId?: string) => Promise<Record<string, string>>;
    };
    options: {
        getForSetting: (key: string) => Promise<any[]>;
    };
};
export declare const systemAdminApi: {
    setup: (data: any) => Promise<any>;
    setupStatus: () => Promise<any>;
    systemInfo: () => Promise<any>;
    maintenance: (enabled: boolean) => Promise<any>;
    auditLogs: (params?: {
        companyId?: string | null;
        search?: string;
        page?: number;
        limit?: number;
    }) => Promise<any>;
    users: (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => Promise<any>;
    inviteUser: (data: any) => Promise<any>;
    updateUser: (id: string, data: any) => Promise<any>;
    removeUser: (id: string) => Promise<void>;
};
export declare const invoiceSettingsApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const currencySettingsApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const emailSettingsApi: {
    get: () => Promise<any>;
    update: (data: Record<string, string>) => Promise<any>;
    test: (to: string) => Promise<any>;
};
export declare const centralControlPanelApi: {
    get: (companyId: string) => Promise<any>;
    updateSection: (companyId: string, section: string, data: Record<string, any>) => Promise<any>;
    migrate: (companyId: string) => Promise<any>;
};
export declare const taxSettingsApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const securitySettingsApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const defaultsSettingsApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const localizationSettingsApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const businessIdentityApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const systemSettingsApi: {
    info: () => Promise<any>;
    maintenance: (enabled: boolean) => Promise<any>;
    get: () => Promise<any>;
    update: (data: Record<string, string>) => Promise<any>;
};
export declare const integrationsSettingsApi: {
    get: () => Promise<any>;
    update: (data: Record<string, string>) => Promise<any>;
};
export declare const maintainingTechnologyApi: {
    get: (companyId: string) => Promise<any>;
    update: (companyId: string, data: Record<string, string>) => Promise<any>;
};
export declare const advancedAccessApi: {
    getOverrides: (companyId?: string) => Promise<any[]>;
    saveOverrides: (overrides: any[], companyId?: string) => Promise<void>;
};
export declare const rolesApi: {
    /** List all roles (system + tenant-custom). Pass companyId to include custom roles for a tenant. */
    list: (companyId?: string | null) => Promise<RbacRoleDTO[]>;
    /** Get a single role by id. */
    get: (id: string) => Promise<RbacRoleDTO>;
    /** Create a new custom role for a tenant. */
    create: (dto: {
        name: string;
        label: string;
        description?: string;
        permissions: string[];
        apiAccess?: boolean;
        companyId: string;
    }) => Promise<RbacRoleDTO>;
    /** Update role metadata / permissions. */
    update: (id: string, dto: Partial<{
        label: string;
        description: string;
        permissions: string[];
        apiAccess: boolean;
    }>) => Promise<RbacRoleDTO>;
    /** Delete a custom role (system roles are protected server-side). */
    remove: (id: string) => Promise<void>;
    /** Seed/sync system roles from the shared RBAC constants. */
    seed: () => Promise<{
        seeded: number;
    }>;
};
export declare const permissionsApi: {
    /** List all permissions, optionally filtered by category or module. */
    list: (params?: {
        category?: string;
        module?: string;
        companyId?: string | null;
    }) => Promise<RbacPermissionDTO[]>;
    /** Get a single permission by key. */
    get: (key: string) => Promise<RbacPermissionDTO>;
    /** Seed/sync permissions from the shared permission catalog. */
    seed: () => Promise<{
        seeded: number;
    }>;
};
export declare const sodRulesApi: {
    /** List all Segregation-of-Duties rules (global + tenant-specific). */
    list: (companyId?: string | null) => Promise<SodRuleDTO[]>;
    /** Create a tenant-specific SoD rule. */
    create: (dto: Omit<SodRuleDTO, "id"> & {
        companyId: string;
    }) => Promise<SodRuleDTO>;
    /** Update an existing SoD rule. */
    update: (id: string, dto: Partial<Omit<SodRuleDTO, "id">>) => Promise<SodRuleDTO>;
    /** Delete a tenant-specific SoD rule. */
    remove: (id: string) => Promise<void>;
};
export declare const auditEventCatalogApi: {
    /** List audit event catalog entries. */
    list: (companyId?: string | null) => Promise<AuditEventCatalogDTO[]>;
};
//# sourceMappingURL=settingsApi.d.ts.map