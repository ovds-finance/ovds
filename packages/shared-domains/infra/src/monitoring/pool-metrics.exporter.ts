import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';
import { createTenantClient } from '../createTenantClient';
import Redis from 'ioredis';

@Injectable()
export class PoolMetricsExporter {
  constructor(private readonly poolManager: any) {}
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  generateMetricsReport(): string {
    const activePoolsMap = (this.poolManager as any).activePools;
    const now = Date.now();
    let metricsBuffer = '';
    metricsBuffer += '# HELP ovds_active_database_pools Total active isolated tenant connection pools\n';
    metricsBuffer += '# TYPE ovds_active_database_pools gauge\n';
    metricsBuffer += `ovds_active_database_pools ${activePoolsMap.size}\n\n`;
    metricsBuffer += '# HELP ovds_pool_idle_time_seconds Duration an isolated connection pool has spent idle\n';
    metricsBuffer += '# TYPE ovds_pool_idle_time_seconds gauge\n';
    for (const [tenantId, managed] of activePoolsMap.entries()) {
      const idleSeconds = Math.max(0, (now - managed.lastAccessed) / 1000);
      metricsBuffer += `ovds_pool_idle_time_seconds{tenant_id="${tenantId}"} ${idleSeconds.toFixed(2)}\n`;
    }
    return metricsBuffer;
  }
}