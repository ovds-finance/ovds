import { Injectable, Scope } from '@nestjs/common';
import { getTenantContext, type RequestContext } from '@ovds/database';

export type DeploymentMode = 'CLOUD_SAAS' | 'ON_PREMISE_SINGLE' | 'ON_PREMISE_MULTI';

/**
 * TenantContextService
 *
 * Request-scoped NestJS injectable that wraps the AsyncLocalStorage-based
 * tenant context set by TenantContextInterceptor.
 *
 * Provides a clean DI-friendly API for services to access:
 *   - The active companyId (tenant identifier)
 *   - The current user's role
 *   - The deployment mode (On-Cloud SaaS vs On-Premise)
 *
 * In ON_PREMISE_SINGLE mode, getCompanyId() returns a deterministic
 * fallback UUID so all queries hit the single-tenant database without
 * manual company filtering.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private readonly deploymentMode: DeploymentMode;

  constructor() {
    this.deploymentMode =
      (process.env.DEPLOYMENT_MODE as DeploymentMode) || 'CLOUD_SAAS';
  }

  private getContext(): RequestContext | undefined {
    return getTenantContext();
  }

  getCompanyId(): string {
    if (this.deploymentMode === 'ON_PREMISE_SINGLE') {
      return '00000000-0000-0000-0000-000000000000';
    }

    const ctx = this.getContext();
    if (!ctx?.companyId) {
      throw new Error('Tenant context isolation breach: Company ID not resolved.');
    }
    return ctx.companyId;
  }

  getUserId(): string | null {
    return this.getContext()?.userId ?? null;
  }

  getRole(): string | null {
    return this.getContext()?.role ?? null;
  }

  getMode(): DeploymentMode {
    return this.deploymentMode;
  }

  isInSingleTenantMode(): boolean {
    return this.deploymentMode === 'ON_PREMISE_SINGLE';
  }
}
