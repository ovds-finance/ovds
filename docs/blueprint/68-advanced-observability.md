# 68 — Advanced Observability and Distributed Tracing

## 1. Observability Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Advanced Observability Stack                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Metrics   │  │   Traces    │  │   Logs                  │ │
│  │             │  │             │  │                         │ │
│  │ - Prometheus│  │ - OTel      │  │ - Structured            │ │
│  │ - Grafana   │  │ - Jaeger    │  │ - ELK Stack             │ │
│  │ - SLO/SLI   │  │ - Sampling  │  │ - Loki                  │ │
│  │ - Alerts    │  │ - Context   │  │ - Correlation           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Correlation ID    │                        │
│                   │   Propagation       │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. OpenTelemetry Integration

```typescript
// observability/opentelemetry.module.ts
@Module({
  providers: [
    {
      provide: 'OTEL_TRACER',
      useFactory: () => {
        const sdk = new NodeSDK({
          traceExporter: new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          }),
          metricExporter: new OTLPMetricExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          }),
          logExporter: new OTLPLogExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          }),
          serviceName: 'vat-declaration-api',
          serviceVersion: '1.0.0',
        });

        sdk.start();
        return sdk;
      },
    },
  ],
  exports: ['OTEL_TRACER'],
})
export class OpenTelemetryModule {}
```

## 3. Distributed Tracing

```typescript
// observability/tracing.service.ts
@Injectable()
export class TracingService {
  constructor(private readonly tracer: Tracer) {}

  startSpan(name: string, options?: SpanOptions): Span {
    return this.tracer.startSpan(name, options);
  }

  async trace<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.startSpan(name);

    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  addEvent(span: Span, name: string, attributes?: Attributes): void {
    span.addEvent(name, attributes);
  }

  setAttribute(span: Span, key: string, value: any): void {
    span.setAttribute(key, value);
  }
}
```

## 4. Correlation ID Propagation

```typescript
// observability/correlation-id.middleware.ts
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] || v4();

    // Set in response headers
    res.set('x-correlation-id', correlationId);

    // Create async local storage context
    AsyncLocalStorageContext.run({ correlationId }, () => {
      next();
    });
  }
}

// observability/correlation-id.interceptor.ts
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const correlationId = AsyncLocalStorageContext.getStore()?.correlationId;

    if (correlationId) {
      return next.handle().pipe(
        tap(() => {
          // Add correlation ID to logs and traces
          Logger.setContext({ correlationId });
        }),
      );
    }

    return next.handle();
  }
}
```

## 5. Structured Logging

```typescript
// observability/logging.service.ts
@Injectable()
export class LoggingService {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({
      format: LogFormat.JSON,
      transports: [
        new ConsoleTransport(),
        new LokiTransport({ endpoint: process.env.LOKI_URL }),
      ],
    });
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, {
      ...context,
      timestamp: new Date().toISOString(),
      service: 'vat-declaration',
      environment: process.env.NODE_ENV,
    });
  }

  error(message: string, error: Error, context?: LogContext): void {
    this.logger.error(message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }

  audit(event: string, data: any): void {
    this.logger.info(`AUDIT: ${event}`, {
      type: 'audit',
      event,
      data,
    });
  }
}
```

## 6. Metrics Collection

```typescript
// observability/metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly requestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly requestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'route'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  });

  private readonly activeUsers = new Gauge({
    name: 'active_users',
    help: 'Number of active users',
    labelNames: ['organization_id'],
  });

  recordRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.requestCounter.inc({ method, route, status_code: statusCode });
    this.requestDuration.observe({ method, route }, duration);
  }

  setActiveUsers(organizationId: string, count: number): void {
    this.activeUsers.set({ organization_id: organizationId }, count);
  }
}
```

## 7. SLO/SLI Monitoring

```typescript
// observability/slo.service.ts
@Injectable()
export class SLOService {
  async checkSLOs(orgId: string): Promise<SLOReport> {
    const slos = await this.prisma.slo.findMany({
      where: { organizationId: orgId },
    });

    const results: SLOStatus[] = [];

    for (const slo of slos) {
      const current = await this.computeSLI(slo);
      const status = this.evaluateSLO(slo, current);

      results.push({
        sloId: slo.id,
        name: slo.name,
        target: slo.target,
        current: current.value,
        status: status,
        errorBudget: this.computeErrorBudget(slo, current),
        window: slo.window,
      });
    }

    return {
      organizationId: orgId,
      timestamp: new Date(),
      slos: results,
      overallHealth: this.computeOverallHealth(results),
    };
  }
}
```

## 8. Alerting

```typescript
// observability/alerting.service.ts
@Injectable()
export class AlertingService {
  async evaluateAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Check SLO burn rate
    const sloAlerts = await this.checkSLOBurnRate();
    alerts.push(...sloAlerts);

    // Check error rate
    const errorAlerts = await this.checkErrorRate();
    alerts.push(...errorAlerts);

    // Check latency
    const latencyAlerts = await this.checkLatency();
    alerts.push(...latencyAlerts);

    // Send alerts
    for (const alert of alerts) {
      await this.notificationService.send(alert);
    }

    return alerts;
  }

  private async checkSLOBurnRate(): Promise<Alert[]> {
    const burnRate = await this.computeSLOBurnRate();

    if (burnRate > 1) {
      return [{
        severity: 'critical',
        title: 'SLO Burn Rate Exceeded',
        message: `Burn rate is ${burnRate.toFixed(2)}x`,
        page: true,
      }];
    }

    return [];
  }
}
```
