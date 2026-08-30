export declare function useCompanySettings(companyId?: string | null): {
    settings: any;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};
export declare function useModuleSettings(companyId?: string | null): {
    modules: any[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};
export declare function useInvoiceSettings(companyId?: string | null): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useCurrencySettings(companyId?: string | null): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useEmailSettings(): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
    test: (to: string) => Promise<any>;
};
export declare function useSettingsCatalog(): {
    categories: any[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};
export declare function useCentralControlPanel(companyId?: string | null): {
    panel: any;
    loading: boolean;
    error: string | null;
    migrating: boolean;
    refetch: () => Promise<void>;
    updateSection: (section: string, data: Record<string, any>) => Promise<any>;
    migrate: () => Promise<any>;
};
export declare function useTaxSettings(companyId?: string | null): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useSecuritySettings(companyId?: string | null): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useDefaultsSettings(companyId?: string | null): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useLocalizationSettings(companyId?: string | null): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useBusinessIdentity(companyId?: string | null): {
    settings: any;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useSystemSettings(): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useIntegrationsSettings(): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
export declare function useMaintainingTechnologySettings(companyId?: string | null): {
    settings: Record<string, string> | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    update: (data: Record<string, string>) => Promise<void>;
};
//# sourceMappingURL=useSettings.d.ts.map