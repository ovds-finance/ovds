import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class DistributedLockManager {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  async acquireLock(tenantId: string, resourceKey: string, ttlMs = 15000): Promise<string | null> {
    const lockKey = `lock:tenant:${tenantId}:${resourceKey}`;
    const lockValue = crypto.randomUUID();
    const result = await this.redis.set(lockKey, lockValue, 'NX' as any, 'PX' as any, ttlMs as any);
    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(tenantId: string, resourceKey: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:tenant:${tenantId}:${resourceKey}`;
    const luaScript = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
    try { const outcome = await this.redis.eval(luaScript, 1, lockKey, lockValue); return outcome === 1; }
    catch (lockError: unknown) { throw new InternalServerErrorException(`Distributed Lock Manager Failure: ${(lockError as Error).message}`); }
  }
}