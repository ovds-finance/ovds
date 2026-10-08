import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

export interface AuditorTenantContext {
  tenantId: string | null;
  userId: string | null;
  role: string | null;
}

export const AUDITOR_TENANT_CONTEXT = new AsyncLocalStorage<AuditorTenantContext>();

export function getAuditorTenantContext(): AuditorTenantContext | undefined {
  return AUDITOR_TENANT_CONTEXT.getStore();
}

/**
 * Binds the auditor-tenant context (AuditTenant / AuditUser) to each request.
 *
 * Mirrors the existing TenantContextInterceptor but operates on the auditor
 * platform's `AuditTenant` / `AuditUser` models rather than `Company` / `User`.
 *
 * Multi-tenant partition engine: requests are scoped to the tenant identified
 * by the JWT `tenantId` or the `x-tenant-id` header. Supervisors
 * (GLOBAL_ADMIN / AABE_SUPERVISOR) may operate across tenants for oversight.
 */
@Injectable()
export class AuditorTenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: { tenantId?: string; userId?: string; role?: string } | undefined = request.user;

    const headerTenantId =
      (request.headers?.['x-tenant-id'] as string | undefined)?.trim() || null;

    let resolvedTenantId: string | null = null;

    if (headerTenantId) {
      const role: string = (user?.role ?? '').toUpperCase();
      const isSupervisor = role === 'GLOBAL_ADMIN' || role === 'AABE_SUPERVISOR';

      if (isSupervisor) {
        resolvedTenantId = headerTenantId;
      } else if (user?.tenantId && headerTenantId === user.tenantId) {
        resolvedTenantId = headerTenantId;
      } else if (user?.tenantId && headerTenantId !== user.tenantId) {
        throw new ForbiddenException(
          'Cross-tenant access denied: x-tenant-id does not match your JWT tenant.',
        );
      }
    } else {
      resolvedTenantId = user?.tenantId || null;
    }

    const ctx: AuditorTenantContext = {
      tenantId: resolvedTenantId,
      userId: user?.userId || null,
      role: user?.role || null,
    };

    return AUDITOR_TENANT_CONTEXT.run(ctx, () => next.handle());
  }
}
