/**
 * @ovds/contracts — Navigation Schemas
 *
 * Zod shapes for the dynamic, server-driven sidebar menu system.
 * Inspired by Ovds's modular, event-driven menu architecture.
 *
 * Flow:
 *   Backend modules emit NavItemRegisteredEvent  →  NavService aggregates
 *   → GET /nav/groups?role=&companyId=&businessType=  →  frontend NavContext
 *   → Sidebar renders merged (server + static-fallback) nav tree
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
    get AdminMenuItemSchema () {
        return AdminMenuItemSchema;
    },
    get CreateAdminMenuItemSchema () {
        return CreateAdminMenuItemSchema;
    },
    get NavGroupSchema () {
        return NavGroupSchema;
    },
    get NavItemSchema () {
        return NavItemSchema;
    },
    get NavQuerySchema () {
        return NavQuerySchema;
    },
    get NavSectionSchema () {
        return NavSectionSchema;
    },
    get NavTreeSchema () {
        return NavTreeSchema;
    },
    get UpdateAdminMenuItemSchema () {
        return UpdateAdminMenuItemSchema;
    }
});
const _zod = require("zod");
const NavItemSchema = _zod.z.object({
    /** Route path (e.g. '/sales/invoices') or '#action' for sidebar actions */ to: _zod.z.string(),
    /** Display label */ label: _zod.z.string(),
    /** IconType key from @ovds/ui */ icon: _zod.z.string(),
    /** i18n key override */ i18nKey: _zod.z.string().optional(),
    /** oRPC / REST permission gate */ permission: _zod.z.string().optional(),
    /** Sort priority (lower = higher up) */ priority: _zod.z.number().int().default(50),
    /** Show a "New" badge */ isNew: _zod.z.boolean().optional(),
    /** Numeric badge count (e.g. unread notifications) */ badge: _zod.z.number().int().nonnegative().optional(),
    /** Whether this item can be pinned to Favorites */ pinnable: _zod.z.boolean().optional(),
    /** React Router `end` prop for exact matching */ end: _zod.z.boolean().optional(),
    /** Search keywords for the global search modal */ keywords: _zod.z.array(_zod.z.string()).optional(),
    /**
   * Source tag — 'static' = defined in navGroups.ts, 'dynamic' = injected by
   * a backend module at runtime, 'admin' = created by an ADMIN via the CRUD UI.
   */ source: _zod.z.enum([
        'static',
        'dynamic',
        'admin'
    ]).default('static')
});
const NavSectionSchema = _zod.z.object({
    key: _zod.z.string(),
    label: _zod.z.string(),
    i18nKey: _zod.z.string().optional(),
    icon: _zod.z.string().optional(),
    sectionLabel: _zod.z.literal(true),
    /** Phase colour token: 'accounting' | 'sales' | 'tax' | ... */ colorToken: _zod.z.string().optional()
});
const NavGroupSchema = _zod.z.object({
    key: _zod.z.string(),
    label: _zod.z.string(),
    i18nKey: _zod.z.string().optional(),
    icon: _zod.z.string(),
    /** Group-level permission gate — if absent the group is visible to all */ permission: _zod.z.string().optional(),
    /** true = render as a flat NavLink (e.g. Dashboard) */ flat: _zod.z.boolean().optional(),
    /** Direct route for flat groups */ to: _zod.z.string().optional(),
    /** Section this group belongs to (matches a NavSectionDto key) */ sectionKey: _zod.z.string().optional(),
    items: _zod.z.array(NavItemSchema),
    /** Sort priority among groups in the same section */ priority: _zod.z.number().int().default(50),
    /** Source tag */ source: _zod.z.enum([
        'static',
        'dynamic',
        'admin'
    ]).default('static')
});
const NavTreeSchema = _zod.z.object({
    /** Ordered list of section banners + groups interleaved (frontend renders in order) */ sections: _zod.z.array(NavSectionSchema),
    groups: _zod.z.array(NavGroupSchema),
    /** ISO timestamp of when this tree was computed */ computedAt: _zod.z.string(),
    /** Cache TTL in seconds — frontend should re-fetch after this */ ttl: _zod.z.number().int().positive().default(300)
});
const NavQuerySchema = _zod.z.object({
    role: _zod.z.string().optional(),
    companyId: _zod.z.string().optional(),
    businessType: _zod.z.string().optional()
});
const CreateAdminMenuItemSchema = _zod.z.object({
    label: _zod.z.string().min(1).max(200),
    path: _zod.z.string().min(1).max(500),
    to: _zod.z.string().max(500).optional(),
    icon: _zod.z.string().max(100).optional(),
    parentKey: _zod.z.string().max(100).optional(),
    roles: _zod.z.string().max(500).optional(),
    isActive: _zod.z.boolean().optional(),
    priority: _zod.z.number().int().min(0).max(9999).optional()
});
const UpdateAdminMenuItemSchema = CreateAdminMenuItemSchema.partial();
const AdminMenuItemSchema = _zod.z.object({
    id: _zod.z.string(),
    label: _zod.z.string(),
    path: _zod.z.string(),
    to: _zod.z.string().nullable(),
    icon: _zod.z.string().nullable(),
    parentId: _zod.z.string().nullable(),
    parentKey: _zod.z.string().nullable(),
    sortOrder: _zod.z.number().int(),
    order: _zod.z.number().int(),
    adminId: _zod.z.string().nullable(),
    isActive: _zod.z.boolean(),
    roles: _zod.z.string().nullable(),
    companyId: _zod.z.string().nullable(),
    createdAt: _zod.z.string(),
    updatedAt: _zod.z.string()
});
