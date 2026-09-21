# 21 — Error Handling and Resilience Patterns

## 1. Error Classification

| Error Type | HTTP Status | Example | Handling |
|-----------|------------|---------|----------|
| `VALIDATION_ERROR` | 400 | Invalid DTO | Return field-level errors |
| `UNAUTHORIZED` | 401 | Missing/invalid JWT | Return 401, clear auth state |
| `FORBIDDEN` | 403 | Insufficient permissions | Return 403 with required permissions |
| `NOT_FOUND` | 404 | Resource not found | Return 404 with resource type |
| `CONFLICT` | 409 | Version mismatch, duplicate | Return 409 with conflict details |
| `UNPROCESSABLE_ENTITY` | 422 | Business rule violation | Return 422 with rule description |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded | Return 429 with Retry-After |
| `INTERNAL_ERROR` | 500 | Unexpected error | Log and return generic message |

## 2. Custom Exceptions

```typescript
// libs/api-core/common/src/exceptions/business.exceptions.ts
export class VatReturnNotFoundException extends NotFoundException {
  constructor(returnId: string) {
    super({
      code: 'VAT_RETURN_NOT_FOUND',
      message: `VAT return ${returnId} not found`,
      details: { returnId },
    });
  }
}

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(from: string, to: string) {
    super({
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot transition from ${from} to ${to}`,
      details: { from, to },
    });
  }
}

export class SubmissionFailedException extends InternalServerErrorException {
  constructor(reason: string) {
    super({
      code: 'SUBMISSION_FAILED',
      message: `VAT return submission failed: ${reason}`,
      details: { reason },
    });
  }
}

export class IntegrationExpiredException extends BadRequestException {
  constructor() {
    super({
      code: 'INTEGRATION_EXPIRED',
      message: 'Integration token has expired. Please re-authenticate.',
    });
  }
}
```

## 3. Global Exception Filter

```typescript
// infrastructure/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let error: any = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = this.formatHttpException(exception);
    } else if (exception instanceof PrismaClientKnownRequestError) {
      status = this.mapPrismaCode(exception.code);
      error = this.formatPrismaException(exception);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      error = {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? exception.message : 'An unexpected error occurred',
      };
    }

    response.status(status).json({
      success: false,
      error,
      meta: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

## 4. Circuit Breaker Pattern

```typescript
// resilience/circuit-breaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000,
    private readonly resetTimeout: number = 30000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new ServiceUnavailableException('Service temporarily unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

## 5. Retry Pattern

```typescript
// resilience/retry.ts
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delay: number; backoff?: 'linear' | 'exponential' },
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < options.maxAttempts - 1) {
        const delay = options.backoff === 'exponential'
          ? options.delay * Math.pow(2, attempt)
          : options.delay * (attempt + 1);

        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
```

## 6. Timeout Pattern

```typescript
// resilience/timeout.ts
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new GatewayTimeoutException(message)), timeoutMs),
    ),
  ]);
}
```

## 7. Bulkhead Pattern

```typescript
// resilience/bulkhead.ts
export class Bulkhead {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private readonly maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            resolve(await fn());
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const task = this.queue.shift()!;
      this.execute(task);
    }
  }
}
```

## 8. Fallback Pattern

```typescript
// resilience/fallback.ts
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    return fallback();
  }
}

// Usage: Try HMRC API, fall back to cached data
const vatRates = await withFallback(
  () => provider.getVatRates(jurisdictionId),
  () => jurisdictionService.getCachedVatRates(jurisdictionId),
);
```

## 9. Idempotency

```typescript
// infrastructure/decorators/idempotent.decorator.ts
export const Idempotent = (keyExtractor: (request: Request) => string) =>
  SetMetadata('idempotent', keyExtractor);

// infrastructure/guards/idempotency.guard.ts
@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    if (!idempotencyKey) return true;

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_REQUEST',
        message: 'Request already processed',
        data: existing.response,
      });
    }

    return true;
  }
}
```

## 10. Graceful Degradation

```typescript
// services/feature-flag.service.ts
@Injectable()
export class FeatureFlagService {
  private readonly flags = new Map<string, boolean>();

  isEnabled(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }

  async checkFeature(flag: string, fallback: () => Promise<any>): Promise<any> {
    if (this.isEnabled(flag)) {
      return fallback();
    }
    return null;
  }
}

// Usage
const advancedReports = await this.featureFlagService.checkFeature(
  'advanced_reports',
  () => this.advancedReportService.generate(params),
);
```

## 11. Logging and Tracing

```typescript
// infrastructure/logging/request-logger.interceptor.ts
@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers['x-correlation-id'] || randomUUID();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => this.logSuccess(correlationId, request, response, start),
        error: (error) => this.logError(correlationId, request, start, error),
      }),
    );
  }

  private logSuccess(correlationId: string, request: Request, response: Response, start: number): void {
    this.logger.log({
      correlationId,
      method: request.method,
      url: request.url,
      status: response.statusCode,
      duration: Date.now() - start,
      userId: request.user?.id,
      organizationId: request.organization?.id,
    });
  }

  private logError(correlationId: string, request: Request, start: number, error: Error): void {
    this.logger.error({
      correlationId,
      method: request.method,
      url: request.url,
      duration: Date.now() - start,
      error: error.message,
      stack: error.stack,
    });
  }
}
```

## 12. Health Checks

```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: Redis,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    };
  }

  @Get('ready')
  async readiness(): Promise<ReadinessResponse> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      queue: await this.checkQueue(),
    };

    const isReady = Object.values(checks).every((c) => c.status === 'up');
    return {
      status: isReady ? 'ready' : 'degraded',
      checks,
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch {
      return { status: 'down', error: 'Database connection failed' };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'up' };
    } catch {
      return { status: 'down', error: 'Redis connection failed' };
    }
  }
}
```
