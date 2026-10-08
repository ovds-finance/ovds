// apps/shared-domains/infra/src/middleware/tenant-rate-limiter.middleware.ts
import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

@Injectable()
export class TenantRateLimiterMiddleware implements NestMiddleware {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private readonly BUCKET_CAPACITY = 200;
  private readonly REFILL_RATE_PER_SEC = 5;

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req['tenantId'];
    if (!tenantId) return next();
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
    const bucketKey = `ratelimit:tenant:${tenantId}:tokens`;
    const now = Math.floor(Date.now() / 1000);
    const [rawTokens] = await this.redis.get(bucketKey) || [null];
    let currentTokens = rawTokens === null ? this.BUCKET_CAPACITY : Number(rawTokens);
    currentTokens = Math.max(0, currentTokens - 1);
    if (currentTokens < 0) {
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({ error: 'Rate limit exceeded' });
    }
    await this.redis.set(bucketKey, currentTokens);
    next();
  }
}
