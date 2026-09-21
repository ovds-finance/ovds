import { Role } from '../types';
import { Permission, RolePreset } from './permissions';
export declare const ROLE_PRESETS: Record<string, RolePreset>;
export declare const APP_ACCESS_LEVELS: readonly ["none", "read", "write", "admin"];
export type AppAccessLevel = typeof APP_ACCESS_LEVELS[number];
export declare const APP_ACCESS_PERMISSIONS: Record<string, Permission[]>;
export declare function canAccessApp(role: Role, appKey: string, accessLevel: AppAccessLevel, businessType?: string): boolean;
export declare function appAccessForPreset(presetKey: string, appKey: string): AppAccessLevel;
export declare function getRolePresetPermissions(presetKey: string): Permission[];
export declare function getRolePreset(presetKey: string): RolePreset | undefined;
export declare function getAllRolePresets(): Record<string, RolePreset>;
/**
 * Presets exposed to the UI for one-click role authoring.
 * Maps the business labels (Manager, Accountant, Employee, Customer) to
 * ROLE_PRESETS entries already defined above.
 */
export interface PresetMeta {
    key: string;
    label: string;
    description: string;
    baseRole: Role;
    appAccess: Record<string, AppAccessLevel>;
}
export declare const PRESET_META: PresetMeta[];
//# sourceMappingURL=role-presets.d.ts.map