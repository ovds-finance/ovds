import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException, Scope } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PrismaService } from './prisma.service';

export const TENANT_SCOPING = 'TENANT_SCOPING_INTERCEPTOR';

@Injectable({ scope: Scope.DEFAULT })
export class TenantScopingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.companyId) {
      return next.handle();
    }

    return next.handle().pipe(
      map((response: any) => {
        if (response?.data && Array.isArray(response.data)) {
          response.data = response.data.filter((item: any) => item.companyId === user.companyId || !item.companyId);
        } else if (response?.data && !Array.isArray(response.data)) {
          if (response.data.companyId && response.data.companyId !== user.companyId) {
            throw new ForbiddenException('Access denied to this resource');
          }
        }
        return response;
      }),
    );
  }
}
