import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { TENANT_CONTEXT, type RequestContext } from '@ovds/database';
import { isSuperUser } from '@ovds/shared';
import { Observable } from 'rxjs';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const headerCompanyId =
      (request.headers?.['x-company-id'] as string | undefined)?.trim() || null;

    let resolvedCompanyId: string | null = null;

    if (headerCompanyId) {
      const role: string = (user?.role ?? '').toUpperCase();
      const isSuper = isSuperUser(role as any);

      if (isSuper) {
        resolvedCompanyId = headerCompanyId;
      } else if (user?.companyId && headerCompanyId === user.companyId) {
        resolvedCompanyId = headerCompanyId;
      } else if (user?.companyId && headerCompanyId !== user.companyId) {
        throw new ForbiddenException(
          'Cross-tenant access denied: x-company-id does not match your JWT tenant.',
        );
      } else {
        resolvedCompanyId = null;
      }
    } else {
      resolvedCompanyId = user?.companyId || null;
    }

    const ctx: RequestContext = {
      companyId: resolvedCompanyId,
      userId: user?.userId || null,
      role: user?.role || null,
    };

    return TENANT_CONTEXT.run(ctx, () => next.handle());
  }
}

export function getTenantContext(): RequestContext | undefined {
  return TENANT_CONTEXT.getStore();
}
