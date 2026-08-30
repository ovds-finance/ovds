/**
 * @ovds/features/settings types
 *
 * Shared TypeScript interfaces for the settings domain.
 */
export interface RolePermissionOverrideDTO {
    role: string;
    permission: string;
    access: 'GRANT' | 'DENY';
}
export interface SettingCategory {
    key: string;
    name: string;
    description?: string;
    icon?: string;
}
export interface SettingGroup {
    id: string;
    categoryId: string;
    key: string;
    name: string;
    description?: string;
}
export interface SettingDefinition {
    id: string;
    key: string;
    name: string;
    description?: string;
    type?: string;
    category?: string;
    group?: string;
    module?: string;
    defaultValue?: string;
    options?: any[];
}
export interface SettingValueResponse {
    key: string;
    value: string;
    source?: string;
}
export interface SettingOption {
    key: string;
    label: string;
    value: string;
    description?: string;
}
//# sourceMappingURL=settings.types.d.ts.map