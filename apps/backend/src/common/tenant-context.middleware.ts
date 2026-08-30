import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  companyId: string | null;
  userId: string | null;
  role: string | null;
}

export const TENANT_CONTEXT = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const ctx: TenantContext = {
      companyId: request.user?.companyId || null,
      userId: request.user?.userId || null,
      role: request.user?.role || null,
    };

    return TENANT_CONTEXT.run(ctx, () => next.handle());
  }
}

export function getTenantContext(): TenantContext | undefined {
  return TENANT_CONTEXT.getStore();
}
