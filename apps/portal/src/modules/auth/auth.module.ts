import { createTenantAuthModule } from '@ovds/auth/auth/tenant-auth.module';
import { PrismaClientToken } from '../../prisma/prisma.module';

const tenantAuth = createTenantAuthModule({ prismaToken: PrismaClientToken });

/**
 * Tenant auth module.
 *
 * The wiring moved to the workspace auth core so this app can never drift from
 * `apps/cloud-api` — the two copies were byte-identical and both silently fell
 * back to the literal JWT secret `"secret"` when `JWT_SECRET` was unset.
 */
export const AuthModule = tenantAuth.module;
export const AuthService = tenantAuth.AuthService;
export const AuthController = tenantAuth.AuthController;
