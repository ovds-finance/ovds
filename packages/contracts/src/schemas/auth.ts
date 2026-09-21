/**
 * @ovds/contracts — Auth Schemas
 */
import { z } from 'zod';

/**
 * RoleSchema — kept in sync with packages/shared/src/types/roles.ts (canonical source).
 * When adding a role, update BOTH files plus the Prisma schema enum.
 */
export const RoleSchema = z.enum([
  'SPURADMIN',
  'SUPERADMIN',
  'ADMIN',
  'HR',
  'OVDS',
  'ACCOUNTING',
  'AUDITOR',
  'EMPLOYEE',
  'CRM',
  'IFRS_OFFICER',
  'BANK_LIAISON',
  'EXTERNAL_AUDITOR',
  'DEVELOPER',
  'CLIENT',
  'PROJECT_MANAGER',
  'PARTNER',
  'FINANCE',
  'SALES',
  'PURCHASES',
  'SECURITY',
  'COMPLIANCE',
  'DATA_CLERK',
]);
export type Role = z.infer<typeof RoleSchema>;

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type Login = z.infer<typeof LoginSchema>;

export const AuthTokenSchema = z.object({
  access_token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().nullable().optional(),
    role: RoleSchema,
    companyId: z.string().nullable().optional(),
    isAuth0User: z.boolean().optional(),
  }),
});
export type AuthToken = z.infer<typeof AuthTokenSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email().nullable().optional(),
  role: RoleSchema,
  companyId: z.string().nullable().optional(),
  employeeId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  mfaEnrolled: z.boolean().default(false),
  lastLoginAt: z.coerce.date().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  appAccess: z.array(z.object({
    appId: z.string(),
    appSlug: z.string().optional(),
    appName: z.string().optional(),
    accessLevel: z.enum(['none', 'read', 'write', 'admin']).default('none'),
  })).optional().default([]),
});
export type User = z.infer<typeof UserSchema>;

export const AppAccessLevelSchema = z.enum(['none', 'read', 'write', 'admin']);
export type AppAccessLevel = z.infer<typeof AppAccessLevelSchema>;

export const UserAppAccessSchema = z.object({
  appId: z.string(),
  accessLevel: AppAccessLevelSchema,
});
export type UserAppAccess = z.infer<typeof UserAppAccessSchema>;

export const RoleAppAccessSchema = z.object({
  role: z.string(),
  appId: z.string(),
  accessLevel: AppAccessLevelSchema,
});
export type RoleAppAccess = z.infer<typeof RoleAppAccessSchema>;

export const RolePresetSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  baseRole: RoleSchema,
  extraPermissions: z.array(z.string()),
  appAccess: z.record(z.string(), AppAccessLevelSchema),
});
export type RolePreset = z.infer<typeof RolePresetSchema>;
