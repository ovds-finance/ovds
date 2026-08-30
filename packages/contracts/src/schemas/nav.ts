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
 */
import { z } from 'zod';

// ── Core nav item ─────────────────────────────────────────────────────────────

export const NavItemSchema = z.object({
  /** Route path (e.g. '/sales/invoices') or '#action' for sidebar actions */
  to: z.string(),
  /** Display label */
  label: z.string(),
  /** IconType key from @ovds/ui */
  icon: z.string(),
  /** i18n key override */
  i18nKey: z.string().optional(),
  /** oRPC / REST permission gate */
  permission: z.string().optional(),
  /** Sort priority (lower = higher up) */
  priority: z.number().int().default(50),
  /** Show a "New" badge */
  isNew: z.boolean().optional(),
  /** Numeric badge count (e.g. unread notifications) */
  badge: z.number().int().nonnegative().optional(),
  /** Whether this item can be pinned to Favorites */
  pinnable: z.boolean().optional(),
  /** React Router `end` prop for exact matching */
  end: z.boolean().optional(),
  /** Search keywords for the global search modal */
  keywords: z.array(z.string()).optional(),
  /**
   * Source tag — 'static' = defined in navGroups.ts, 'dynamic' = injected by
   * a backend module at runtime, 'admin' = created by an ADMIN via the CRUD UI.
   */
  source: z.enum(['static', 'dynamic', 'admin']).default('static'),
});

export type NavItemDto = z.infer<typeof NavItemSchema>;

// ── Section label (non-clickable visual divider) ──────────────────────────────

export const NavSectionSchema = z.object({
  key: z.string(),
  label: z.string(),
  i18nKey: z.string().optional(),
  icon: z.string().optional(),
  sectionLabel: z.literal(true),
  /** Phase colour token: 'accounting' | 'sales' | 'tax' | ... */
  colorToken: z.string().optional(),
});

export type NavSectionDto = z.infer<typeof NavSectionSchema>;

// ── Nav group (accordion or flat link) ───────────────────────────────────────

export const NavGroupSchema = z.object({
  key: z.string(),
  label: z.string(),
  i18nKey: z.string().optional(),
  icon: z.string(),
  /** Group-level permission gate — if absent the group is visible to all */
  permission: z.string().optional(),
  /** true = render as a flat NavLink (e.g. Dashboard) */
  flat: z.boolean().optional(),
  /** Direct route for flat groups */
  to: z.string().optional(),
  /** Section this group belongs to (matches a NavSectionDto key) */
  sectionKey: z.string().optional(),
  items: z.array(NavItemSchema),
  /** Sort priority among groups in the same section */
  priority: z.number().int().default(50),
  /** Source tag */
  source: z.enum(['static', 'dynamic', 'admin']).default('static'),
});

export type NavGroupDto = z.infer<typeof NavGroupSchema>;

// ── Full nav tree response ────────────────────────────────────────────────────

export const NavTreeSchema = z.object({
  /** Ordered list of section banners + groups interleaved (frontend renders in order) */
  sections: z.array(NavSectionSchema),
  groups: z.array(NavGroupSchema),
  /** ISO timestamp of when this tree was computed */
  computedAt: z.string(),
  /** Cache TTL in seconds — frontend should re-fetch after this */
  ttl: z.number().int().positive().default(300),
});

export type NavTreeDto = z.infer<typeof NavTreeSchema>;

// ── Query inputs ──────────────────────────────────────────────────────────────

export const NavQuerySchema = z.object({
  role: z.string().optional(),
  companyId: z.string().optional(),
  businessType: z.string().optional(),
});

export type NavQuery = z.infer<typeof NavQuerySchema>;

// ── Admin menu item CRUD ──────────────────────────────────────────────────────

export const CreateAdminMenuItemSchema = z.object({
  label: z.string().min(1).max(200),
  path: z.string().min(1).max(500),
  to: z.string().max(500).optional(),
  icon: z.string().max(100).optional(),
  parentKey: z.string().max(100).optional(),
  roles: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(9999).optional(),
});

export type CreateAdminMenuItemDto = z.infer<typeof CreateAdminMenuItemSchema>;

export const UpdateAdminMenuItemSchema = CreateAdminMenuItemSchema.partial();
export type UpdateAdminMenuItemDto = z.infer<typeof UpdateAdminMenuItemSchema>;

export const AdminMenuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  path: z.string(),
  to: z.string().nullable(),
  icon: z.string().nullable(),
  parentId: z.string().nullable(),
  parentKey: z.string().nullable(),
  sortOrder: z.number().int(),
  order: z.number().int(),
  adminId: z.string().nullable(),
  isActive: z.boolean(),
  roles: z.string().nullable(),
  companyId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminMenuItemDto = z.infer<typeof AdminMenuItemSchema>;
