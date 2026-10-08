// apps/shared-domains/infra/src/middleware/tenant-whitelist-limiter.middleware.ts
import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

@Injectable()
export class TenantWhitelistLimiterMiddleware implements NestMiddleware {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private readonly BUCKET_CAPACITY = 200;
  private readonly REFILL_RATE = 5;

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req['tenantId'];
    if (!tenantId) return next();
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
    const whitelisted = await this.redis.get(`tenant:${tenantId}:ip_whitelist`);
    const ips: string[] = whitelisted ? JSON.parse(whitelisted) : [];
    if (ips.includes(clientIp)) { res.setHeader('X-RateLimit-Bypass-Tenant', 'TRUE'); return next(); }
    const bucketKey = `ratelimit:tenant:${tenantId}:tokens`;
    const tokens = await this.redis.get(bucketKey);
    const current = tokens === null ? this.BUCKET_CAPACITY : Number(tokens);
    if (current < 1) return res.status(HttpStatus.TOO_MANY_REQUESTS).json({ error: 'Rate limited' });
    await this.redis.set(bucketKey, current - 1);
    next();
  }
}
