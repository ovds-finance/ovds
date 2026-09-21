import { Role } from '../types';
import { Permission, PermissionContext, PermissionCategory, PermissionDomainCatalog, RolePermissionOverride } from './permissions';
export declare const ROLE_HIERARCHY: Record<Role, number>;
export declare const ROLE_PERMISSIONS: Record<Role, Permission[]>;
export declare const PERMISSION_MODULE_MAP: Record<string, string>;
/** Check if a role has a specific permission, optionally gated by business type, context, and overrides */
export declare function hasPermission(role: Role, permission: Permission, businessType?: string, context?: PermissionContext, overrides?: RolePermissionOverride[]): boolean;
/** Returns true if the user has ANY of the given permissions */
export declare function canAny(role: Role, permissions: Permission[], businessType?: string, context?: PermissionContext): boolean;
/** Returns true if the user has ALL of the given permissions */
export declare function canAll(role: Role, permissions: Permission[], businessType?: string, context?: PermissionContext): boolean;
/** Check if a role's hierarchy weight >= target role */
export declare function isAtLeast(role: Role, target: Role): boolean;
/** Check if a role's hierarchy weight > target role */
export declare function isAbove(role: Role, target: Role): boolean;
/** Check if a role can access a route, optionally gated by business type */
export declare function canAccessRoute(role: Role, path: string, businessType?: string): boolean;
/** Get access level for a resource domain */
export declare function accessLevel(role: Role, resource: string, businessType?: string): 'none' | 'read' | 'write' | 'admin';
/** Effective VAT access level */
export declare function vatLevel(role: Role, businessType?: string): 'none' | 'read' | 'write' | 'admin';
/** Returns a flat domain → access-level map */
export declare function domainAccessMap(role: Role, businessType?: string): Record<string, 'none' | 'read' | 'write' | 'admin'>;
/** Get default route for a role */
export declare function defaultRoute(role: Role): string;
/** Check if a role can perform a CRUD action on a resource */
export declare function canCrud(role: Role, resource: string, action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export', businessType?: string): boolean;
/** Check if a business type has access to a module */
export declare function businessHasModule(businessType: string, module: string): boolean;
/** Get all permissions for a role, optionally filtered by business type */
export declare function getPermissions(role: Role, businessType?: string): Permission[];
/**
 * Compute the effective permission set for a role given persisted overrides.
 * Base = getPermissions(role) (business-type filtered) → apply DENY → apply GRANT.
 * Grants are applied last so an explicit GRANT also bypasses business-type
 * gating (an admin override is authoritative). Super-admins always keep all
 * permissions regardless of DENY (SPURADMIN/SUPERADMIN security boundary is
 * never relaxed — DENY on a super-admin is a no-op to prevent lockout mistakes,
 * but GRANT still adds nothing they lack).
 */
export declare function effectivePermissions(role: Role, overrides?: RolePermissionOverride[], businessType?: string): Permission[];
export declare function categorizePermission(perm: Permission): PermissionCategory;
/** Build the full permission catalog grouped by RESOURCE_DOMAINS with CRUD buckets. */
export declare function permissionCatalog(): PermissionDomainCatalog[];
/** Flat list of every unique permission in the system. */
export declare function allPermissions(): Permission[];
/**
 * Compute the overrides that would transform `role`'s base permissions into
 * the permission set implied by `presetKey`. Returns a Grant/Deny diff so the
 * stored overrides exactly reproduce the preset when merged with the base role.
 */
export declare function presetOverridesForRole(role: Role, presetKey: string): RolePermissionOverride[];
//# sourceMappingURL=role-permissions.d.ts.map