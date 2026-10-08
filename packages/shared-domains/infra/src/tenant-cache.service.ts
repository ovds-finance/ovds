// apps/shared-domains/infra/src/tenant-cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class TenantCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  private buildKey(tenantId: string, customKey: string): string { return `tenant:${tenantId}:${customKey}`; }

  async get<T>(tenantId: string, key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(this.buildKey(tenantId, key));
  }

  async set<T>(tenantId: string, key: string, value: T, ttlInSeconds = 300): Promise<void> {
    await this.cacheManager.set(this.buildKey(tenantId, key), value, ttlInSeconds as any);
  }

  async invalidate(tenantId: string, key: string): Promise<void> {
    await this.cacheManager.del(this.buildKey(tenantId, key));
  }
}