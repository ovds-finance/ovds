/**
 * OVDS RBAC Policy — single source of truth for both frontend and backend.
 *
 * Architecture:
 *  - Role enum is defined in types.ts
 *  - Permission strings follow "resource:action" convention
 *  - BUSINESS_MODULE_MAP gates which modules are available per company type
 *  - This file is imported by:
 *      Frontend: src/rbac/rbac.ts (canAccessRoute, can())
 *      Backend:  RBACGuard, BusinessTypeGuard
 */
export * from './rbac/permissions';
export * from './rbac/role-presets';
export * from './rbac/contextual-rules';
export * from './rbac/resource-domains';
export * from './rbac/route-policy';
export * from './rbac/role-permissions';
export * from './rbac/section-access';
//# sourceMappingURL=rbac.d.ts.map