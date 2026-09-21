# 24 — Monitoring and Observability

## 1. Observability Stack

| Concern | Tool | Purpose |
|---------|------|---------|
| Metrics | Prometheus | Request latency, queue depth, error rates |
| Tracing | OpenTelemetry | Distributed tracing across services |
| Logging | Winston + Loki | Structured logging with correlation IDs |
| Dashboards | Grafana | Operational dashboards |
| Alerting | Alertmanager | PagerDuty, Slack, email alerts |

## 2. Metrics Collection

```typescript
// monitoring/metrics.service.ts
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export class MetricsService {
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestTotal: Counter;
  private readonly queueJobDuration: Histogram;
  private readonly queueJobTotal: Counter;
  private readonly activeConnections: Gauge;

  constructor() {
    const registry = new Registry();

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_request_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [registry],
    });

    this.queueJobDuration = new Histogram({
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue jobs in seconds',
      labelNames: ['queue', 'job_type', 'status'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
      registers: [registry],
    });

    this.queueJobTotal = new Counter({
      name: 'queue_job_total',
      help: 'Total number of queue jobs',
      labelNames: ['queue', 'job_type', 'status'],
      registers: [registry],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active database connections',
      registers: [registry],
    });

    // Expose metrics endpoint
    app.get('/metrics', (req, res) => {
      res.set('Content-Type', registry.contentType);
      res.send(registry.metrics());
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
  }

  recordQueueJob(queue: string, jobType: string, status: string, duration: number): void {
    this.queueJobDuration.observe({ queue, job_type: jobType, status }, duration);
    this.queueJobTotal.inc({ queue, job_type: jobType, status });
  }
}
```

## 3. HTTP Request Metrics Middleware

```typescript
// monitoring/http-metrics.interceptor.ts
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const route = request.route?.path || request.url;
          this.metricsService.recordHttpRequest(request.method, route, response.statusCode, duration);
        },
        error: () => {
          const duration = (Date.now() - start) / 1000;
          const route = request.route?.path || request.url;
          this.metricsService.recordHttpRequest(request.method, route, 500, duration);
        },
      }),
    );
  }
}
```

## 4. OpenTelemetry Tracing

```typescript
// monitoring/tracing.module.ts
@Module({
  imports: [
    NodeSDKModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        serviceName: 'vat-declaration-api',
        serviceVersion: process.env.APP_VERSION,
        resource: resourceDefault(),
        instrumentations: [getNodeAutoInstrumentations()],
        tracerConfig: {
          spanLimits: {
            attributeCountLimit: 50,
          },
        },
        exporters: [
          new OTLPTraceExporter({
            url: config.get('OTEL_EXPORTER_OTLP_ENDPOINT'),
            headers: {},
          }),
        ],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class TracingModule {}
```

## 5. Distributed Tracing

```typescript
// monitoring/tracing.interceptor.ts
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  constructor(private readonly tracer: Tracer) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const spanName = `${request.method} ${request.route?.path || request.url}`;

    return Observable.create((subscriber) => {
      const span = this.tracer.startSpan(spanName, {
        attributes: {
          'http.method': request.method,
          'http.url': request.url,
          'http.route': request.route?.path,
          'http.user_agent': request.headers['user-agent'],
          'user.id': request.user?.id,
          'organization.id': request.organization?.id,
        },
      });

      const finish = () => {
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      };

      next.handle().subscribe({
        next: (data) => {
          subscriber.next(data);
          finish();
        },
        error: (error) => {
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          span.recordException(error);
          subscriber.error(error);
          finish();
        },
      });
    });
  }
}
```

## 6. Structured Logging

```typescript
// monitoring/logger.service.ts
@Injectable()
export class LoggerService {
  private readonly logger: Logger;

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger({
      level: this.configService.get('LOG_LEVEL', 'info'),
      format: this.configService.get('NODE_ENV') === 'production'
        ? this.jsonFormat()
        : this.prettyFormat(),
    });
  }

  log(message: string, context?: string, meta?: any): void {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, error?: Error, context?: string): void {
    this.logger.error(message, error, { context });
  }

  warn(message: string, context?: string, meta?: any): void {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any): void {
    this.logger.debug(message, { context, ...meta });
  }

  private jsonFormat(): winston.LoggerOptions {
    return {
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json(),
      ),
      transports: [new transports.Console()],
    };
  }

  private prettyFormat(): winston.LoggerOptions {
    return {
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        printf(({ timestamp, level, message, context, ...meta }) => {
          return `${timestamp} [${context}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        }),
      ),
      transports: [new transports.Console()],
    };
  }
}
```

## 7. Log Correlation

```typescript
// monitoring/correlation-id.middleware.ts
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    res.setHeader('X-Correlation-ID', correlationId);
    req.correlationId = correlationId;

    // Add to AsyncLocalStorage for access throughout the request
    AsyncLocalStorage.run(new Map([['correlationId', correlationId]]), () => {
      next();
    });
  }
}
```

## 8. Health Check Metrics

```typescript
// monitoring/health-metrics.service.ts
@Injectable()
export class HealthMetricsService {
  constructor(private readonly prisma: PrismaService, private readonly redis: Redis) {}

  async checkDatabase(): Promise<HealthMetric> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }

  async checkRedis(): Promise<HealthMetric> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }
}
```

## 9. Alerting Rules

```yaml
# prometheus/alerts.yaml
groups:
  - name: vat_saas_alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_request_total{status_code=~"5.."}[5m])) / sum(rate(http_request_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P95 latency is {{ $value }}s"

      - alert: QueueBacklog
        expr: sum(queue_job_total{status="waiting"}) > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog high"
          description: "{{ $value }} jobs waiting in queue"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
```

## 10. Grafana Dashboards

```
Dashboards:
├── API Overview
│   ├── Request rate
│   ├── Error rate
│   ├── P50/P95/P99 latency
│   ├── Active connections
│   └── Request distribution by route
├── Queue Health
│   ├── Jobs per queue
│   ├── Job duration
│   ├── Failure rate
│   ├── DLQ size
│   └── Worker utilization
├── Database
│   ├── Connection pool
│   ├── Query duration
│   ├── Slow queries
│   ├── Table sizes
│   └── Replication lag
└── Business Metrics
    ├── VAT returns created per day
    ├── Submission success rate
    ├── Integration sync status
    └── Active organizations
```
