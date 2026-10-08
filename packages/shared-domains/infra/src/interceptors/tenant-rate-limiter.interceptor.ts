import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TenantRateLimiterInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request['tenantId'] || 'UNKNOWN';
    console.log(`[RATE LIMIT] Tenant: ${tenantId} | ${request.method} ${request.url}`);
    return next.handle().pipe(tap(() => {}));
  }
}
