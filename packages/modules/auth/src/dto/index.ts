/**
 * @ovds/modules/auth — DTO / contract definitions.
 *
 * This module's Zod contracts live in @ovds/contracts/schemas/auth.
 * Re-export them here so NestJS consumers can import from the canonical
 * module path without depending directly on @ovds/contracts.
 *
 * Usage (backend):
 *   import { LoginSchema, AuthTokenSchema, RoleSchema } from '@ovds/modules/auth/dto';
 */

export {
  LoginSchema,
  type Login,
  AuthTokenSchema,
  type AuthToken,
  RoleSchema,
  type Role,
  UserSchema,
  type User,
} from '@ovds/contracts/schemas/auth';
