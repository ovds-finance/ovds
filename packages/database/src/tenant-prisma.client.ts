import { PrismaClient } from '@prisma/client';
import { TENANT_CONTEXT, type RequestContext } from './tenant-context.middleware';
import { buildTenantScopedExtension } from './tenant-extension-builder';

export type DeploymentMode = 'CLOUD_SAAS' | 'ON_PREMISE_SINGLE' | 'ON_PREMISE_MULTI';

export interface TenantPrismaClientOptions {
  deploymentMode?: DeploymentMode;
}

/**
 * TenantPrismaClient — shared multi-tenant Prisma client extension.
 *
 * Wraps PrismaClient with automatic tenant scoping via `$extends`:
 *   - Read queries filtered by `companyId`
 *   - Create mutations stamped with `companyId`
 *   - Update/delete mutations scoped to `companyId`
 *
 * This is the shared package version intended for use across multiple
 * NestJS apps (cloud-api, onpremise-api) without coupling to Nest DI.
 *
 * For NestJS-specific lifecycle wiring, use apps/backend/src/common/prisma.service.ts.
 */
export class TenantPrismaClient extends PrismaClient {
  private readonly deploymentMode: DeploymentMode;

  constructor(options: TenantPrismaClientOptions = {}) {
    if (!process.env.DATABASE_URL && !process.env.PRISMA_DATABASE_URL) {
      throw new Error('DATABASE_URL or PRISMA_DATABASE_URL environment variable is required');
    }

    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    });

    this.deploymentMode = options.deploymentMode || (process.env.DEPLOYMENT_MODE as DeploymentMode) || 'CLOUD_SAAS';

    this.$extends(
      buildTenantScopedExtension(
        () => TENANT_CONTEXT.getStore?.(),
        this.deploymentMode,
      ),
    );
  }

  /**
   * Convenience accessor that reads the current request's tenant context
   * and returns a tenant-scoped client. Falls back to the raw client when
   * no context is available (e.g., background jobs, system operations).
   */
  get scoped(): TenantPrismaClient {
    const context: RequestContext | undefined = TENANT_CONTEXT.getStore?.();
    const companyId = context?.companyId || null;
    const role = context?.role?.toUpperCase() ?? '';
    const isSuper = role === 'SPURADMIN' || role === 'SUPERADMIN';
    const isSingleTenant = this.deploymentMode === 'ON_PREMISE_SINGLE';

    if (isSingleTenant || !companyId || isSuper) {
      return this;
    }

    return this.$extends(
      buildTenantScopedExtension(
        () => TENANT_CONTEXT.getStore?.(),
        this.deploymentMode,
      ),
    ) as TenantPrismaClient;
  }
}
