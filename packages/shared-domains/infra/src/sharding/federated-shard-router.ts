// apps/shared-domains/infra/src/sharding/federated-shard-router.ts
import { PrismaClient } from '@ovds/database';
import Redis from 'ioredis';

interface ShardRegistryNode { shardHostId: string; connectionString: string; }

export class FederatedShardRouter {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private clientPool = new Map<string, PrismaClient>();

  async getClusterClientForTenant(tenantId: string): Promise<PrismaClient> {
    const cacheKey = `infra:shard:routing:tenant:${tenantId}`;
    let shardNodeMetaRaw = await this.redis.get(cacheKey);
    let shardNodeMeta: ShardRegistryNode;
    if (!shardNodeMetaRaw) {
      const controlPlane = new PrismaClient();
      const record = await controlPlane.$queryRaw<any[]>`SELECT "shardHostId", "connectionString" FROM "TenantShardMapping" WHERE "tenantId" = ${tenantId} LIMIT 1`;
      if (!record || record.length === 0) throw new Error(`No shard mapped for tenant: ${tenantId}`);
      shardNodeMeta = { shardHostId: record[0].shardHostId, connectionString: record[0].connectionString };
      await this.redis.set(cacheKey, JSON.stringify(shardNodeMeta), 'EX', 86400);
      await controlPlane.$disconnect();
    } else { shardNodeMeta = JSON.parse(shardNodeMetaRaw); }

    if (this.clientPool.has(shardNodeMeta.shardHostId)) { return this.clientPool.get(shardNodeMeta.shardHostId)!; }
    const shardClient = new PrismaClient();
    await shardClient.$connect();
    this.clientPool.set(shardNodeMeta.shardHostId, shardClient);
    return shardClient;
  }
}
