# 77 — Advanced API Gateway and Traffic Management

## 1. API Gateway Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Advanced API Gateway and Traffic Management          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Request   │  │   Traffic   │  │   API Management         │ │
│  │   Routing   │  │   Control   │  │                         │ │
│  │             │  │             │  │ - Versioning            │ │
│  │ - Path      │  │ - Rate      │  │ - Documentation         │ │
│  │ - Header    │  │   Limit     │  │ - Analytics             │ │
│  │ - Weighted  │  │ - Circuit   │  │ - Monetization          │ │
│  │   Round     │  │   Breaker   │  │ - Portal                │ │
│  │   Robin     │  │ - Retry     │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Developer Portal  │                        │
│                   │   & SDK Generation  │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Gateway Configuration

```typescript
// gateway/config/gateway-config.service.ts
@Injectable()
export class GatewayConfigService {
  async loadConfig(): Promise<GatewayConfig> {
    return {
      routes: [
        {
          path: 'api/v1/transactions',
          upstream: 'http://transaction-service:3000',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          timeout: 30000,
          retries: 3,
        },
        {
          path: 'api/v1/vat-returns',
          upstream: 'http://vat-return-service:3000',
          methods: ['GET', 'POST'],
          timeout: 60000,
          retries: 2,
        },
      ],
      rateLimit: {
        windowMs: 60 * 1000,
        max: 100,
        skipSuccessfulRequests: false,
      },
      circuitBreaker: {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      },
      cors: {
        origin: ['https://app.example.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
    };
  }
}
```

## 3. Request Routing

```typescript
// gateway/routing/request-router.service.ts
@Injectable()
export class RequestRouterService {
  async route(request: Request): Promise<Upstream> {
    const path = request.path;
    const method = request.method;
    const headers = request.headers;

    // Path-based routing
    const route = this.findRoute(path, method);
    if (!route) {
      throw new RouteNotFoundException(path);
    }

    // Header-based routing (canary, blue-green)
    if (route.canary) {
      const variant = this.selectVariant(request);
      return route.variants[variant];
    }

    // Weighted routing
    if (route.weighted) {
      const upstream = this.selectWeightedUpstream(route.weighted);
      return upstream;
    }

    return route.upstream;
  }

  private selectVariant(request: Request): string {
    const header = request.headers['x-canary-version'];
    if (header && this.isValidVariant(header)) {
      return header;
    }

    // Random 10% canary
    return Math.random() < 0.1 ? 'canary' : 'stable';
  }

  private selectWeightedUpstream(weighted: WeightedUpstream[]): Upstream {
    const total = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * total;

    for (const upstream of weighted) {
      random -= upstream.weight;
      if (random <= 0) return upstream;
    }

    return weighted[0];
  }
}
```

## 4. Rate Limiting

```typescript
// gateway/ratelimit/rate-limiter.service.ts
@Injectable()
export class RateLimiterService {
  private readonly limits = new Map<string, RateLimitWindow>();

  async checkLimit(key: string, limit: RateLimit): Promise<RateLimitResult> {
    const window = this.getOrCreateWindow(key, limit);

    const now = Date.now();
    window.requests = window.requests.filter((t) => now - t < limit.windowMs);

    if (window.requests.length >= limit.max) {
      const oldestRequest = window.requests[0];
      const resetTime = oldestRequest + limit.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    window.requests.push(now);

    return {
      allowed: true,
      remaining: limit.max - window.requests.length,
      resetTime: now + limit.windowMs,
    };
  }

  private getOrCreateWindow(key: string, limit: RateLimit): RateLimitWindow {
    const existing = this.limits.get(key);

    if (existing && Date.now() - existing.createdAt < limit.windowMs) {
      return existing;
    }

    const window: RateLimitWindow = {
      key,
      requests: [],
      createdAt: Date.now(),
    };

    this.limits.set(key, window);
    return window;
  }
}
```

## 5. Circuit Breaker

```typescript
// gateway/circuit-breaker/circuit-breaker.service.ts
@Injectable()
export class CircuitBreakerService {
  private readonly breakers = new Map<string, CircuitBreakerState>();

  async execute<T>(key: string, fn: () => Promise<T>, options: CircuitBreakerOptions): Promise<T> {
    const state = this.getOrCreateBreaker(key, options);

    if (state.status === 'open') {
      if (Date.now() > state.nextRetry) {
        state.status = 'half-open';
      } else {
        throw new CircuitBreakerOpenException(key, state.nextRetry);
      }
    }

    try {
      const result = await fn();
      this.onSuccess(key);
      return result;
    } catch (error) {
      this.onFailure(key, error);
      throw error;
    }
  }

  private onSuccess(key: string): void {
    const state = this.breakers.get(key);
    if (state) {
      state.failures = 0;
      state.status = 'closed';
    }
  }

  private onFailure(key: string, error: any): void {
    const state = this.breakers.get(key);
    if (!state) return;

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= state.threshold) {
      state.status = 'open';
      state.nextRetry = Date.now() + state.resetTimeout;
    }
  }
}
```

## 6. API Versioning

```typescript
// gateway/versioning/versioning.service.ts
@Injectable()
export class VersioningService {
  async resolveVersion(request: Request): Promise<string> {
    // Check header
    const headerVersion = request.headers['x-api-version'];
    if (headerVersion && this.isValidVersion(headerVersion)) {
      return headerVersion;
    }

    // Check path
    const pathVersion = request.path.match(/\/api\/v(\d+)\//)?.[1];
    if (pathVersion) {
      return `v${pathVersion}`;
    }

    // Check content-type
    const contentType = request.headers['content-type'];
    const versionMatch = contentType?.match(/version=(\d+)/);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }

    return this.defaultVersion;
  }

  async transformRequest(request: Request, fromVersion: string, toVersion: string): Promise<Request> {
    const transformations = await this.getTransformations(fromVersion, toVersion);

    let transformed = request;

    for (const transformation of transformations) {
      transformed = await this.applyTransformation(transformed, transformation);
    }

    return transformed;
  }
}
```

## 7. Developer Portal

```typescript
// gateway/portal/developer-portal.service.ts
@Injectable()
export class DeveloperPortalService {
  async generateDocs(api: Api): Promise<ApiDocumentation> {
    const specs: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: api.name,
        version: api.version,
        description: api.description,
      },
      paths: {},
    };

    for (const endpoint of api.endpoints) {
      specs.paths[endpoint.path] = {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.summary,
          description: endpoint.description,
          parameters: endpoint.parameters,
          requestBody: endpoint.requestBody,
          responses: endpoint.responses,
        },
      };
    }

    return {
      spec: specs,
      interactive: true,
      sdk: await this.generateSDK(api),
    };
  }

  async generateSDK(api: Api): Promise<SDK> {
    const generators = {
      typescript: new TypeScriptSDKGenerator(),
      python: new PythonSDKGenerator(),
      java: new JavaSDKGenerator(),
      go: new GoSDKGenerator(),
    };

    const sdk: SDK = {};

    for (const [language, generator] of Object.entries(generators)) {
      sdk[language] = await generator.generate(api);
    }

    return sdk;
  }
}
```

## 8. Analytics

```typescript
// gateway/analytics/gateway-analytics.service.ts
@Injectable()
export class GatewayAnalyticsService {
  async recordRequest(request: Request, response: Response, duration: number): Promise<void> {
    await this.prisma.apiRequest.create({
      data: {
        organizationId: request.organizationId,
        apiKey: request.apiKey,
        endpoint: request.path,
        method: request.method,
        statusCode: response.statusCode,
        duration,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        timestamp: new Date(),
      },
    });
  }

  async getAnalytics(orgId: string, params: AnalyticsParams): Promise<GatewayAnalytics> {
    const [requests, errors, latency] = await Promise.all([
      this.getRequestCount(orgId, params),
      this.getErrorCount(orgId, params),
      this.getLatencyStats(orgId, params),
    ]);

    return {
      totalRequests: requests,
      errorRate: errors / requests,
      avgLatency: latency.avg,
      p95Latency: latency.p95,
      p99Latency: latency.p99,
      topEndpoints: await this.getTopEndpoints(orgId, params),
    };
  }
}
```
