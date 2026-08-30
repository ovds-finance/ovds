import {
  Permission, PermissionContext, ContextualRule, RolePreset,
  PermissionCategory, PermissionTier, PermissionDomainCatalog,
  PermissionOverrides, RolePermissionOverride, PermissionAccess,
  ROLE_PRESETS, hasPermission,
} from './rbac';
type T1 = Permission; type T2 = PermissionContext; type T3 = ContextualRule;
type T4 = RolePreset; type T5 = PermissionCategory; type T6 = PermissionTier;
type T7 = PermissionDomainCatalog; type T8 = PermissionOverrides;
type T9 = RolePermissionOverride; type T10 = PermissionAccess;
const a: T1 = 'ovds:read'; const b: T4 = ROLE_PRESETS.MANAGER;
const c = hasPermission(b.baseRole, a);
export { a, b, c };
