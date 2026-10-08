// apps/shared-domains/infra/src/guards/tenant-subscription.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

@Injectable()
export class TenantSubscriptionGuard implements CanActivate {
  private prisma = new PrismaClient();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request['tenantId'];
    if (!tenantId) return true;
    const sub = await this.prisma.$queryRaw<any[]>`SELECT "status","currentTier","expiresAt" FROM "TenantSubscriptionProfile" WHERE "tenantId" = ${tenantId} LIMIT 1`;
    if (!sub || sub.length === 0) throw new ForbiddenException('No subscription profile.');
    const profile = sub[0];
    if (profile.status === 'CANCELED' || new Date() > new Date(profile.expiresAt)) {
      throw new ForbiddenException('Subscription expired.');
    }
    request['subscriptionTier'] = profile.currentTier;
    return true;
  }
}
