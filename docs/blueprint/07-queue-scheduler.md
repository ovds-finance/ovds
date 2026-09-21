# 07 — Queue, Scheduler, and Background Jobs

## 1. Queue Architecture

BullMQ is used for durable, Redis-backed job queues. The system uses three queues:

| Queue               | Purpose                                          | Concurrency | Retry Policy                 |
|---------------------|--------------------------------------------------|-------------|------------------------------|
| `default`           | General-purpose background jobs                  | 10          | 3 attempts, exponential backoff |
| `integrations`      | Tax authority API calls (rate-limited)           | 5           | 5 attempts, exponential backoff, rate limiter |
| `reports`           | Report generation and export                     | 2           | 2 attempts, delayed retry    |
| `emails`            | Notification emails (optional separate queue)    | 20          | 3 attempts, no backoff       |

## 2. Queue Configuration

```typescript
// queue/queue.module.ts
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'default' },
      { name: 'integrations' },
      { name: 'reports' },
      { name: 'emails' },
    ),
  ],
  providers: [
    QueueService,
    IntegrationCallProcessor,
    ReportGenerationProcessor,
    EmailNotificationProcessor,
    VatReturnSubmissionProcessor,
  ],
})
export class QueueModule {}
```

```typescript
// queue/queue.service.ts
@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('default') private defaultQueue: Queue,
    @InjectQueue('integrations') private integrationsQueue: Queue,
    @InjectQueue('reports') private reportsQueue: Queue,
    @InjectQueue('emails') private emailsQueue: Queue,
  ) {}

  async addToDefault<T>(name: string, data: T, options?: JobOptions): Promise<Job<T>> {
    return this.defaultQueue.add(name, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }

  async addToIntegrations<T>(name: string, data: T): Promise<Job<T>> {
    return this.integrationsQueue.add(name, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 10000 },
      limiter: { max: 10, duration: 60000 }, // 10 calls per minute
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async addToReports<T>(name: string, data: T): Promise<Job<T>> {
    return this.reportsQueue.add(name, data, {
      attempts: 2,
      backoff: { type: 'delayed', delay: 60000 },
      removeOnComplete: { age: 24 * 3600 }, // Keep for 24h for re-download
      removeOnFail: false,
    });
  }
}
```

## 3. Job Types

### 3.1 VAT Return Submission

```typescript
// queue/jobs/vat-return-submission.job.ts
export interface VatReturnSubmissionJobData {
  returnId: string;
  organizationId: string;
}

// queue/processors/vat-return-submission.processor.ts
@Processor('default')
export class VatReturnSubmissionProcessor {
  constructor(
    private readonly providerRegistry: ProviderRegistryService,
    private readonly vatReturnService: VatReturnService,
    private readonly eventBus: EventBusService,
    private readonly logger: Logger,
  ) {}

  @Process('vat_return_submit')
  async handleSubmit(job: Job<VatReturnSubmissionJobData>) {
    const { returnId, organizationId } = job.data;
    const vatReturn = await this.vatReturnService.findById(returnId);

    if (!vatReturn) {
      this.logger.warn(`VAT return ${returnId} not found, skipping submission`);
      return;
    }

    const integration = await this.integrationService.findActiveForOrganization(organizationId);
    if (!integration) throw new NoActiveIntegrationException();

    const provider = this.providerRegistry.resolve(integration.provider);
    const payload = await this.buildSubmissionPayload(vatReturn);

    this.logger.log(`Submitting VAT return ${returnId} to ${provider.name}`);

    const result = await provider.submitReturn(returnId, payload);

    if (result.success) {
      await this.vatReturnService.markSubmitted(returnId, result.submissionId!);
      await this.eventBus.emit(new VatReturnSubmittedEvent(returnId, result.submissionId!));
      this.logger.log(`VAT return ${returnId} submitted successfully`);
    } else {
      await this.vatReturnService.markSubmissionFailed(returnId, result.error!);
      throw new SubmissionFailedException(result.error);
    }
  }

  private async buildSubmissionPayload(vatReturn: VatReturn): Promise<SubmitReturnPayload> {
    const items = await this.vatReturnItemService.findByReturnId(vatReturn.id);
    const boxes: Record<string, Amount> = {};

    for (const item of items) {
      boxes[item.boxCode] = {
        value: item.netAmount.toString(),
        currency: item.currencyCode,
      };
    }

    return {
      vatNumber: vatReturn.vatRegistration.registrationNumber,
      periodStart: vatReturn.periodStart.toISOString().split('T')[0],
      periodEnd: vatReturn.periodEnd.toISOString().split('T')[0],
      boxes,
    };
  }
}
```

### 3.2 Tax Authority API Call with Rate Limiting

```typescript
// queue/processors/integration-call.processor.ts
@Processor('integrations')
export class IntegrationCallProcessor {
  constructor(
    private readonly providerRegistry: ProviderRegistryService,
    private readonly integrationService: IntegrationService,
  ) {}

  @Process('integration_call')
  async handleCall(job: Job<IntegrationCallJobData>) {
    const { integrationId, operation, payload } = job.data;
    const integration = await this.integrationService.findById(integrationId);

    if (integration.status === 'expired') {
      await this.integrationService.markExpired(integrationId);
      throw new IntegrationExpiredException();
    }

    const provider = this.providerRegistry.resolve(integration.provider);
    const credentials = this.decryptCredentials(integration.credentials);

    let result;
    switch (operation) {
      case 'submit_return':
        result = await provider.submitReturn(payload.returnId, payload);
        break;
      case 'check_status':
        result = await provider.checkReturnStatus(payload.submissionId);
        break;
      case 'validate_vat':
        result = await provider.validateVatNumber(payload.vatNumber, payload.countryCode);
        break;
    }

    await this.integrationService.updateLastSync(integrationId, result);
    return result;
  }
}
```

### 3.3 Report Generation

```typescript
// queue/processors/report-generation.processor.ts
@Processor('reports')
export class ReportGenerationProcessor {
  constructor(
    private readonly reportService: ReportService,
    private readonly storageService: StorageService,
    private readonly logger: Logger,
  ) {}

  @Process('generate_report')
  async handleGenerate(job: Job<GenerateReportJobData>) {
    const { reportId, organizationId, type, format, parameters } = job.data;

    try {
      this.logger.log(`Generating ${type} report for org ${organizationId}`);
      const buffer = await this.reportService.generate({
        type,
        organizationId,
        parameters,
        format,
      });

      const filePath = `reports/${organizationId}/${reportId}.${format}`;
      await this.storageService.upload(filePath, buffer, {
        contentType: this.getContentType(format),
      });

      await this.reportService.markCompleted(reportId, filePath);
      this.logger.log(`Report ${reportId} generated successfully`);
    } catch (error) {
      await this.reportService.markFailed(reportId, error.message);
      throw error;
    }
  }
}
```

## 4. Scheduler (Cron Jobs)

### 4.1 VAT Return Deadline Reminders

```typescript
// scheduler/cron.service.ts
@Injectable()
export class CronService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly vatReturnService: VatReturnService,
    private readonly queueService: QueueService,
  ) {}

  @Cron('0 9 * * 1') // Every Monday at 9 AM
  async handleVatReturnDeadlines() {
    const upcomingReturns = await this.vatReturnService.findUpcomingDeadlines(7); // Next 7 days

    for (const vatReturn of upcomingReturns) {
      await this.queueService.addToDefault('notify_vat_return_due', {
        returnId: vatReturn.id,
        organizationId: vatReturn.organizationId,
        dueDate: vatReturn.dueDate,
      });
    }
  }

  @Cron('0 9 * * 1') // Every Monday at 9 AM
  async handleOverdueReturns() {
    const overdueReturns = await this.vatReturnService.findOverdueReturns();

    for (const vatReturn of overdueReturns) {
      await this.queueService.addToDefault('notify_vat_return_overdue', {
        returnId: vatReturn.id,
        organizationId: vatReturn.organizationId,
      });
    }
  }

  @Cron('0 2 * * *') // Daily at 2 AM
  async handleExpiredTokens() {
    const expiredIntegrations = await this.integrationService.findExpiredTokens();

    for (const integration of expiredIntegrations) {
      await this.notificationService.send({
        organizationId: integration.organizationId,
        type: 'integration_token_expired',
        title: 'Integration token expired',
        message: `Your ${integration.provider} integration needs re-authentication.`,
      });
    }
  }

  @Cron('0 3 * * 0') // Weekly on Sunday at 3 AM
  async handleCleanup() {
    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
```

## 5. Dead-Letter Queue (DLQ)

Failed jobs after max retries move to DLQ for manual review:

```typescript
// queue/processors/base.processor.ts
@Processor('default')
export class BaseProcessor {
  constructor(
    private readonly dlqService: DeadLetterQueueService,
    private readonly logger: Logger,
  ) {}

  async process(job: Job<any>, done: DoneCallback) {
    try {
      const result = await this.handleJob(job);
      done(null, result);
    } catch (error) {
      if (job.attemptsMade >= job.opts.attempts!) {
        await this.dlqService.add({
          originalJob: job.data,
          error: error.message,
          failedAt: new Date(),
          queue: job.queue.name,
        });
        this.logger.error(`Job ${job.id} moved to DLQ: ${error.message}`);
      }
      done(error);
    }
  }
}
```

## 6. Rate Limiting for External APIs

```typescript
// integrations/services/rate-limiter.service.ts
@Injectable()
export class RateLimiterService {
  private readonly limiters = new Map<string, RateLimiter>();

  async execute<T>(providerCode: string, operation: () => Promise<T>): Promise<T> {
    const limiter = this.getLimiter(providerCode);
    await limiter.removeTokens(1);

    try {
      return await operation();
    } catch (error) {
      if (error.response?.status === 429) {
        await limiter.replenish(); // Back off
        throw error;
      }
      throw error;
    }
  }

  private getLimiter(providerCode: string): RateLimiter {
    if (!this.limiters.has(providerCode)) {
      const config = providerConfigs[providerCode];
      this.limiters.set(
        providerCode,
        new RateLimiter({
          tokensPerInterval: config.rateLimit.requests,
          interval: this.parseWindow(config.rateLimit.window),
        }),
      );
    }
    return this.limiters.get(providerCode)!;
  }
}
```

## 7. Scheduled Task Monitoring

```typescript
// scheduler/monitoring.service.ts
@Injectable()
export class SchedulerMonitoringService {
  async healthCheck(): Promise<SchedulerHealth> {
    const jobs = await Promise.all([
      this.queueService.getJobCounts('default'),
      this.queueService.getJobCounts('integrations'),
      this.queueService.getJobCounts('reports'),
    ]);

    const dlqSize = await this.dlqService.count();

    return {
      queues: {
        default: { waiting: jobs[0].waiting, active: jobs[0].active, failed: jobs[0].failed },
        integrations: { waiting: jobs[1].waiting, active: jobs[1].active, failed: jobs[1].failed },
        reports: { waiting: jobs[2].waiting, active: jobs[2].active, failed: jobs[2].failed },
      },
      dlqSize,
      healthy: jobs.every(q => q.failed < 100) && dlqSize < 50,
    };
  }
}
```

## 8. Redis Configuration

```typescript
// queue/redis.config.ts
export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
};

// Queue connection options
export const queueOptions: BullMQModuleOptions = {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};
```

## 9. Job State Machine

```
PENDING → WAITING → ACTIVE → COMPLETED
                  → FAILED → RETRY → WAITING
                           → DLQ (after max retries)
                  → DELAYED → WAITING
                  → PAUSED
```

## 10. Observability

- **Job Metrics**: Prometheus metrics for queue depth, job duration, failure rate.
- **Tracing**: OpenTelemetry spans for each job execution.
- **Alerting**: Alert when DLQ size > 50, queue failure rate > 10%, or job duration > 2x P99.
