# 58 — Advanced Analytics and Business Intelligence

## 1. Analytics Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Advanced Analytics System                     │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Metrics   │  │   Aggregates│  │   Analytics Engine       │ │
│  │   Engine    │  │   (Cube)     │  │                         │ │
│  │             │  │             │  │ - Rollups               │ │
│  │ - Counter   │  │ - Time       │  │ - Forecasting           │ │
│  │ - Gauge     │  │ - Dimension │  │ - Anomaly Detection     │ │
│  │ - Histogram │  │ - Measure    │  │ - Trend Analysis        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Analytics API     │                        │
│                   │   (REST + GraphQL)  │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Analytics Models

```prisma
model AnalyticsMetric {
  id            String   @id @default(cuid())
  organizationId String
  name          String
  type          String   // "counter", "gauge", "histogram"
  value         Float
  dimensions    Json?    // { "region": "EU", "currency": "EUR" }
  timestamp     DateTime @default(now()) @db.Timestamptz

  @@index([organizationId, name, timestamp])
  @@index([organizationId, timestamp])
}

model AnalyticsReport {
  id            String   @id @default(cuid())
  organizationId String
  name          String
  type          String   // "financial", "operational", "compliance"
  query         Json     // Saved query definition
  schedule      Json?    // { "frequency": "daily", "recipients": [...] }
  lastRunAt     DateTime?
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([organizationId, type])
}
```

## 3. Metrics Engine

```typescript
// analytics/metrics.service.ts
@Injectable()
export class MetricsService {
  async recordCounter(orgId: string, name: string, value: number, dimensions?: any): Promise<void> {
    await this.prisma.analyticsMetric.create({
      data: { organizationId: orgId, name, type: 'counter', value: Math.max(0, value), dimensions },
    });
  }

  async recordGauge(orgId: string, name: string, value: number, dimensions?: any): Promise<void> {
    await this.prisma.analyticsMetric.create({
      data: { organizationId: orgId, name, type: 'gauge', value, dimensions },
    });
  }

  async recordHistogram(orgId: string, name: string, value: number, dimensions?: any): Promise<void> {
    await this.prisma.analyticsMetric.create({
      data: { organizationId: orgId, name, type: 'histogram', value, dimensions },
    });
  }
}
```

## 4. Aggregation Engine

```typescript
// analytics/aggregation.service.ts
@Injectable()
export class AggregationService {
  async query(orgId: string, params: AnalyticsQueryParams): Promise<AnalyticsResult> {
    const timeWindow = this.buildTimeWindow(params.period);
    const dimensions = this.resolveDimensions(params.dimensions);

    const metrics = await this.prisma.analyticsMetric.findMany({
      where: {
        organizationId: orgId,
        name: { in: params.metrics },
        timestamp: { gte: timeWindow.start, lte: timeWindow.end },
        ...(dimensions.length > 0 ? { dimensions: { hasSome: dimensions } } : {}),
      },
      orderBy: { timestamp: 'asc' },
    });

    return {
      data: this.processMetrics(metrics, params.groupBy, params.interval),
      summary: this.computeSummary(metrics),
      metadata: { period: params.period, granularity: params.interval },
    };
  }

  private processMetrics(metrics: AnalyticsMetric[], groupBy: string[], interval: TimeInterval): AnalyticsDataPoint[] {
    const grouped = groupBy(metrics, (m) => this.getGroupKey(m, groupBy, interval));

    return Object.entries(grouped).map(([key, values]) => ({
      key,
      values: values.map((v) => ({ timestamp: v.timestamp, value: v.value })),
      total: sum(values.map((v) => v.value)),
    }));
  }
}
```

## 5. Forecasting

```typescript
// analytics/forecasting.service.ts
@Injectable()
export class ForecastingService {
  async forecast(orgId: string, params: ForecastParams): Promise<ForecastResult> {
    const historical = await this.getHistoricalData(orgId, params.metric, params.lookback);

    const model = this.selectModel(params.method);
    const prediction = await model.fit(historical).predict(params.horizon);

    return {
      metric: params.metric,
      predictions: prediction.values.map((v, i) => ({
        timestamp: addMonths(new Date(), i + 1),
        value: v,
        confidence: prediction.confidence[i],
      })),
      trend: prediction.trend,
      seasonality: prediction.seasonality,
    };
  }

  private selectModel(method: string): ForecastingModel {
    switch (method) {
      case 'arima':
        return new ArimaModel();
      case 'exponential':
        return new ExponentialSmoothingModel();
      case 'linear':
        return new LinearRegressionModel();
      default:
        return new ProphetModel();
    }
  }
}
```

## 6. Anomaly Detection

```typescript
// analytics/anomaly.service.ts
@Injectable()
export class AnomalyDetectionService {
  async detect(orgId: string, params: AnomalyParams): Promise<Anomaly[]> {
    const historical = await this.getHistoricalData(orgId, params.metric, params.lookback);
    const recent = await this.getRecentData(orgId, params.metric, params.recentWindow);

    const anomalies: Anomaly[] = [];
    const baseline = this.computeBaseline(historical);

    for (const point of recent) {
      const zScore = (point.value - baseline.mean) / baseline.stdDev;
      if (Math.abs(zScore) > params.threshold) {
        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expected: baseline.mean,
          deviation: zScore,
          severity: Math.abs(zScore) > 3 ? 'high' : Math.abs(zScore) > 2 ? 'medium' : 'low',
        });
      }
    }

    return anomalies;
  }
}
```

## 7. Analytics Dashboard

```typescript
// apps/web/src/features/analytics/components/analytics-dashboard.tsx
export function AnalyticsDashboard() {
  const [metric, setMetric] = useState('revenue');
  const [period, setPeriod] = useState('last_12_months');
  const { data, isLoading } = useAnalyticsQuery({ metric, period });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-4">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="vat_due">VAT Due</SelectItem>
              <SelectItem value="transaction_count">Transactions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="last_12_months">Last 12 Months</SelectItem>
              <SelectItem value="year_to_date">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Revenue" value={data?.summary.totalRevenue} trend={data?.summary.revenueTrend} />
        <MetricCard title="Total Expenses" value={data?.summary.totalExpenses} trend={data?.summary.expenseTrend} />
        <MetricCard title="VAT Collected" value={data?.summary.totalVatCollected} trend={data?.summary.vatTrend} />
        <MetricCard title="Transactions" value={data?.summary.transactionCount} trend={data?.summary.txTrend} />
      </div>

      <ChartCard data={data?.data} metric={metric} />
    </div>
  );
}
```

## 8. Scheduled Reports

```typescript
// analytics/scheduled-reports.service.ts
@Injectable()
export class ScheduledAnalyticsService {
  @Cron('0 7 * * *') // Daily at 7 AM
  async generateDailyReports() {
    const scheduled = await this.prisma.analyticsReport.findMany({
      where: {
        schedule: { path: ['frequency'], equals: 'daily' },
        isActive: true,
      },
    });

    for (const report of scheduled) {
      await this.processReport(report);
    }
  }
}
```
