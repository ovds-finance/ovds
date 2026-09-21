# 23 — Caching Strategies

## 1. Cache Layers

The system uses multiple cache layers for different data characteristics:

| Layer | Technology | TTL | Data Type |
|-------|-----------|-----|-----------|
| L1: In-Memory | Node.js Map | 5-60s | Session, request-scoped |
| L2: Redis | Redis | 1min-24h | Lookup tables, computed data |
| L3: CDN | Cloudflare/AWS | 1h-7d | Static assets, public data |
| L4: Database | PostgreSQL | N/A | Source of truth |

## 2. Cache-Aside Pattern

```typescript
// common/services/cache.service.ts
@Injectable()
export class CacheService {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached) as T;

    const data = await fetcher();
    await this.redis.setEx(key, ttl, JSON.stringify(data));
    return data;
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  async invalidateTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.invalidate(`cache:tag:${tag}:*`);
    }
  }
}
```

## 3. Jurisdiction Cache

```typescript
// jurisdictions/services/jurisdiction-cache.service.ts
@Injectable()
export class JurisdictionCacheService {
  constructor(private readonly cacheService: CacheService) {}

  async getJurisdictions(orgId: string): Promise<Jurisdiction[]> {
    return this.cacheService.getOrSet(
      `jurisdictions:${orgId}`,
      () => this.jurisdictionRepository.findMany(orgId),
      3600, // 1 hour
    );
  }

  async getVatRates(jurisdictionId: string, date: Date): Promise<VatRate[]> {
    const cacheKey = `vat_rates:${jurisdictionId}:${date.toISOString().split('T')[0]}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.vatRateRepository.findActive(jurisdictionId, date),
      86400, // 24 hours
    );
  }
}
```

## 4. Report Cache

```typescript
// reporting/services/report-cache.service.ts
@Injectable()
export class ReportCacheService {
  constructor(private readonly cacheService: CacheService) {}

  async getReport(orgId: string, type: string, params: any): Promise<Buffer | null> {
    const cacheKey = this.buildCacheKey(orgId, type, params);
    const cached = await this.cacheService.get<{ buffer: string; contentType: string }>(cacheKey);

    if (cached) {
      return Buffer.from(cached.buffer, 'base64');
    }

    return null;
  }

  async setReport(
    orgId: string,
    type: string,
    params: any,
    buffer: Buffer,
    contentType: string,
    ttl: number = 3600,
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(orgId, type, params);
    await this.cacheService.set(
      cacheKey,
      { buffer: buffer.toString('base64'), contentType },
      ttl,
    );
  }

  private buildCacheKey(orgId: string, type: string, params: any): string {
    const paramHash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
    return `report:${orgId}:${type}:${paramHash}`;
  }
}
```

## 5. Query Result Cache

```typescript
// common/decorators/cache.decorator.ts
export const Cacheable = (ttl: number, tag?: string) =>
  SetMetadata('cache', { ttl, tag });

export const CacheInvalidate = (tags: string[]) =>
  SetMetadata('cache:invalidate', tags);

// common/interceptors/cache.interceptor.ts
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const cacheMeta = Reflect.getMetadata('cache', handler);

    if (!cacheMeta || request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(request);
    return from(this.cacheService.getOrSet(cacheKey, () => next.handle().toPromise(), cacheMeta.ttl));
  }
}

// Usage
@Get('jurisdictions')
@Cacheable(3600, 'jurisdictions')
async getJurisdictions() {
  return this.jurisdictionService.findAll();
}
```

## 6. Cache Invalidation

```typescript
// common/interceptors/cache-invalidate.interceptor.ts
@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const classRef = context.getClass();
    const tags = Reflect.getMetadata('cache:invalidate', handler) || [];

    return next.handle().pipe(
      tap(() => {
        this.cacheService.invalidateTags(tags);
      }),
    );
  }
}

// Usage
@Put(':id')
@CacheInvalidate(['jurisdictions', 'vat-returns'])
async update(@Param('id') id: string, @Body() dto: UpdateJurisdictionDto) {
  return this.jurisdictionService.update(id, dto);
}
```

## 7. Cache Tags

```typescript
// cache/tag.service.ts
@Injectable()
export class CacheTagService {
  private readonly tagMap = new Map<string, Set<string>>();

  async tag(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const keys = this.tagMap.get(tag) || new Set();
      keys.add(key);
      this.tagMap.set(tag, keys);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagMap.get(tag);
    if (keys) {
      for (const key of keys) {
        await this.redis.del(key);
      }
      keys.clear();
    }
  }
}
```

## 8. Rate-Limited Cache Warming

```typescript
// common/services/cache-warming.service.ts
@Injectable()
export class CacheWarmingService {
  constructor(private readonly cacheService: CacheService, private readonly queueService: QueueService) {}

  async warmJurisdictions(orgId: string): Promise<void> {
    await this.queueService.addToDefault('cache_warm', {
      type: 'jurisdictions',
      orgId,
    });
  }

  async warmVatRates(jurisdictionId: string): Promise<void> {
    await this.queueService.addToDefault('cache_warm', {
      type: 'vat_rates',
      jurisdictionId,
    });
  }
}

// queue/processors/cache-warm.processor.ts
@Processor('default')
export class CacheWarmProcessor {
  constructor(private readonly jurisdictionService: JurisdictionService) {}

  @Process('cache_warm')
  async handleCacheWarm(job: Job<CacheWarmJobData>) {
    const { type, orgId, jurisdictionId } = job.data;

    switch (type) {
      case 'jurisdictions':
        await this.jurisdictionService.findAll(orgId);
        break;
      case 'vat_rates':
        await this.jurisdictionService.getVatRates(jurisdictionId);
        break;
    }
  }
}
```

## 9. Cache Metrics

```typescript
// monitoring/cache-metrics.service.ts
@Injectable()
export class CacheMetricsService {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }
}
```

## 10. Cache Best Practices

- **Cache keys** include orgId and relevant parameters.
- **TTLs** are set based on data volatility.
- **Invalidation** happens on writes via interceptors.
- **Cache warming** happens on app startup and via scheduled jobs.
- **Tags** allow bulk invalidation of related data.
- **Metrics** track hit rate and identify cold caches.
