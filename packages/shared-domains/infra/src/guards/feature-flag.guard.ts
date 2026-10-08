// apps/shared-domains/infra/src/guards/feature-flag.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import Redis from 'ioredis';

export const RequireFeatureFlag = (flagKey: string) => SetMetadata('required_feature_flag_key', flagKey);

interface TenantRequest extends Request {
  tenantId?: string;
  subscriptionTier?: string;
}

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagKey = this.reflector.get<string>('required_feature_flag_key', context.getHandler());
    if (!flagKey) return true;
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const tenantId = request.tenantId;
    const activeTier = request.subscriptionTier || 'STARTER';
    if (!tenantId) throw new ForbiddenException('Tenant context missing.');
    const cacheKey = `tenant:${tenantId}:flag:${flagKey}`;
    const cached = await this.redis.get(cacheKey);
    const isEnabled = cached === 'true';
    if (!isEnabled) throw new ForbiddenException(`Feature [${flagKey}] disabled.`);
    const tierMeta = await this.redis.get(`infra:flag:${flagKey}:min_tier`);
    const minTier = tierMeta || 'STARTER';
    if (minTier === 'ENTERPRISE' && activeTier !== 'ENTERPRISE') throw new ForbiddenException('Enterprise tier required.');
    if (minTier === 'PREMIUM' && activeTier === 'STARTER') throw new ForbiddenException('Premium tier required.');
    return true;
  }
}