/**
 * @ovds/dto/auth/zod-bridge — Zod schemas for the auth domain
 *
 * Provides Zod versions of the class-validator DTOs in @ovds/dto/auth.
 * These schemas are the single source of truth for frontend form validation
 * and backend pipe validation.
 *
 * Usage in React:
 *   import { LoginSchema, RegisterSchema } from '@ovds/dto';
 *   const { register, handleSubmit } = useForm({
 *     resolver: createZodResolver(LoginSchema)
 *   });
 *
 * Usage in NestJS:
 *   import { LoginSchema } from '@ovds/dto';
 *   @Post('login')
 *   login(@Body(new ZodValidationPipe(LoginSchema)) dto: z.infer<typeof LoginSchema>) { ... }
 */

import { z } from 'zod';

// ── Auth Schemas ─────────────────────────────────────────────────────────────

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

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  email: z.string().email().max(100).optional(),
  role: RoleSchema.optional(),
  subsidiary: z.string().max(100).optional(),
  employeeId: z.string().uuid().optional(),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128),
});

export const PublicSignupSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().max(100),
  password: z.string().min(8).max(128),
  companyName: z.string().max(100).optional(),
  faydaId: z.string().regex(/^\d{12}$/).optional(),
  tin: z.string().regex(/^\d{10}$/).optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional().or(z.literal('')),
  businessType: z.string().optional(),
  language: z.string().max(10).optional(),
  businessCurrency: z.string().max(3).optional(),
  location: z.string().max(100).optional(),
  role: RoleSchema.optional(),
  registrationMethod: z.string().max(20).optional(),
  inviteToken: z.string().max(200).optional(),
});

export const EnterpriseRegistrationSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().max(100),
  password: z.string().min(8).max(128),
  companyName: z.string().max(100).optional(),
  faydaId: z.string().regex(/^\d{12}$/).optional(),
  tin: z.string().regex(/^\d{10}$/).optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional().or(z.literal('')),
  website: z.string().max(100).optional(),
  businessType: z.string().optional(),
  language: z.string().max(10).optional(),
  businessCurrency: z.string().max(3).optional(),
  location: z.string().max(100).optional(),
  role: RoleSchema.optional(),
  registrationMethod: z.string().max(20).optional(),
  ekybVerified: z.boolean().optional(),
});

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

export const AppAccessLevelSchema = z.enum(['none', 'read', 'write', 'admin']);

export const UserAppAccessSchema = z.object({
  appId: z.string(),
  accessLevel: AppAccessLevelSchema,
});

export const RoleAppAccessSchema = z.object({
  role: z.string(),
  appId: z.string(),
  accessLevel: AppAccessLevelSchema,
});

export const RolePresetSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  baseRole: RoleSchema,
  extraPermissions: z.array(z.string()),
  appAccess: z.record(z.string(), AppAccessLevelSchema),
});

// ── Type exports ─────────────────────────────────────────────────────────────

export type Role = z.infer<typeof RoleSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type PublicSignup = z.infer<typeof PublicSignupSchema>;
export type EnterpriseRegistration = z.infer<typeof EnterpriseRegistrationSchema>;
export type User = z.infer<typeof UserSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type AppAccessLevel = z.infer<typeof AppAccessLevelSchema>;
export type UserAppAccess = z.infer<typeof UserAppAccessSchema>;
export type RoleAppAccess = z.infer<typeof RoleAppAccessSchema>;
export type RolePreset = z.infer<typeof RolePresetSchema>;
