/**
 * @ovds/contracts — Auth oRPC Router Contract
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { LoginSchema, AuthTokenSchema, UserSchema, AppAccessLevelSchema, UserAppAccessSchema, RoleAppAccessSchema } from '../schemas/auth';

export const authContract = oc.router({
  login: oc
    .input(LoginSchema)
    .output(AuthTokenSchema),

  refresh: oc
    .input(z.object({}))
    .output(z.object({ access_token: z.string() })),

  me: oc
    .input(z.object({}))
    .output(UserSchema),

  logout: oc
    .input(z.object({}))
    .output(z.object({ success: z.boolean() })),

  changePassword: oc
    .input(z.object({
      oldPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }))
    .output(z.object({ success: z.boolean() })),

  listUserAppAccess: oc
    .input(z.object({ userId: z.string() }))
    .output(z.array(UserAppAccessSchema)),

  setUserAppAccess: oc
    .input(z.object({
      userId: z.string(),
      appId: z.string(),
      accessLevel: AppAccessLevelSchema,
    }))
    .output(z.object({ success: z.boolean() })),

  removeUserAppAccess: oc
    .input(z.object({ userId: z.string(), appId: z.string() }))
    .output(z.object({ success: z.boolean() })),

  listRoleAppAccess: oc
    .input(z.object({}))
    .output(z.array(RoleAppAccessSchema)),

  setRoleAppAccess: oc
    .input(z.object({
      role: z.string(),
      appId: z.string(),
      accessLevel: AppAccessLevelSchema,
    }))
    .output(z.object({ success: z.boolean() })),

  removeRoleAppAccess: oc
    .input(z.object({ role: z.string(), appId: z.string() }))
    .output(z.object({ success: z.boolean() })),

  listApps: oc
    .input(z.object({}))
    .output(z.array(z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      description: z.string().nullable().optional(),
      category: z.string(),
      isActive: z.boolean(),
      isFree: z.boolean(),
    }))),
});

export type AuthContract = typeof authContract;
