import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditTrailInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const tenantId = request['tenantId'] || 'GLOBAL';
    const userId = request['user']?.id || 'ANONYMOUS';
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    return next.handle().pipe(
      tap(() => {
        if (isMutation) console.log(`[AUDIT] [${new Date().toISOString()}] Tenant:${tenantId} User:${userId} ${method} ${url}`);
      })
    );
  }
}
