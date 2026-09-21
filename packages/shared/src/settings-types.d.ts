export type SettingType = 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'date' | 'email' | 'url' | 'image' | 'json' | 'password';
export interface SettingCategory {
    id: string;
    key: string;
    name: string;
    description?: string;
    icon?: string;
    sortOrder: number;
    isActive: boolean;
    groups?: SettingGroup[];
    createdAt: string;
    updatedAt: string;
}
export interface SettingGroup {
    id: string;
    categoryId: string;
    key: string;
    name: string;
    description?: string;
    sortOrder: number;
    isActive: boolean;
    _count?: {
        settings: number;
    };
    createdAt: string;
    updatedAt: string;
}
export interface SettingDefinition {
    id: string;
    key: string;
    value: string;
    type: SettingType;
    categoryId: string;
    groupId?: string;
    companyId?: string;
    defaultValue?: string;
    options?: string;
    isRequired: boolean;
    isGlobal: boolean;
    isEncrypted: boolean;
    sortOrder: number;
    placeholder?: string;
    hint?: string;
    module?: string;
    createdAt: string;
    updatedAt: string;
    category?: SettingCategory;
    group?: SettingGroup;
}
export interface SettingValueResponse {
    value: string;
    source: 'modular' | 'legacy';
    type?: string;
    key?: string;
    category?: string;
    group?: string;
}
export interface SettingOption {
    label: string;
    value: string;
}
export type SetupCategory = 'company' | 'financial' | 'modules' | 'tax' | 'compliance' | 'users' | 'localization' | 'deployment' | 'system' | 'security';
export type SetupScope = 'company' | 'financial' | 'modules' | 'users' | 'system' | 'compliance' | 'deployment';
export type SetupStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export interface SetupStepDefinition {
    key: string;
    label: string;
    description: string;
    category: SetupCategory;
    sortOrder: number;
    isRequired: boolean;
    dependsOn?: string;
    dependsValue?: string;
    scope?: SetupScope;
    moduleId?: string;
    tracking?: boolean;
}
export interface SetupStepStatus {
    stepKey: string;
    status: SetupStatus;
    completedAt?: string;
    completedBy?: string;
    data?: Record<string, string>;
    scope?: SetupScope;
    moduleId?: string;
}
export interface CompanySetupProgress {
    companyId: string;
    currentStep?: string;
    overallProgress: number;
    steps: SetupStepStatus[];
    startedAt: string;
    updatedAt: string;
    completedAt?: string;
    scopeSummary?: Record<string, string[]>;
    moduleActivities?: Array<{
        moduleId: string;
        action: string;
        timestamp: string;
        stepKey: string;
    }>;
}
export interface SetupWizardStartResponse {
    companyId: string;
    steps: SetupStepDefinition[];
    progress: CompanySetupProgress;
}
export interface SetupWizardCompleteResponse {
    companyId: string;
    completedSteps: string[];
    overallProgress: number;
    isFullyConfigured: boolean;
    remainingSteps: string[];
    scopeSummary: Record<string, string[]>;
    moduleActivities: Array<{
        moduleId: string;
        action: string;
        timestamp: string;
        stepKey: string;
    }>;
}
//# sourceMappingURL=settings-types.d.ts.map