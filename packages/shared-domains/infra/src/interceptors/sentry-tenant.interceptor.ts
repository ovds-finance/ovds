// apps/shared-domains/infra/src/interceptors/sentry-tenant.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryTenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request['tenantId'] || 'UNKNOWN_TENANT';
    const userId = request['user']?.id || 'ANONYMOUS_USER';
    return next.handle().pipe(
      catchError((error) => {
        Sentry.withScope((scope) => {
          scope.setTag('tenant_id', tenantId);
          scope.setTag('user_id', userId);
          scope.setExtra('http_method', request.method);
          scope.setExtra('request_url', request.url);
          Sentry.captureException(error);
        });
        return throwError(() => error);
      })
    );
  }
}
