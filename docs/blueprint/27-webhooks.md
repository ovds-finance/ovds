# 27 — Webhook Architecture

## 1. Webhook Overview

The system supports both incoming and outgoing webhooks for real-time integrations with third-party services.

## 2. Outgoing Webhooks

Organizations can register webhook URLs to receive real-time notifications.

```prisma
model Webhook {
  id              String   @id @default(cuid())
  organizationId  String
  url             String
  events          String[] // ["vat_return.submitted", "vat_return.accepted"]
  secret          String   // HMAC secret for signature verification
  isActive        Boolean  @default(true)
  lastSuccessAt   DateTime?
  lastFailureAt   DateTime?
  failureCount    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId])
}
```

## 3. Webhook Service

```typescript
// webhooks/webhook.service.ts
@Injectable()
export class WebhookService {
  constructor(private readonly queueService: QueueService, private readonly encryptionService: EncryptionService) {}

  async register(orgId: string, dto: CreateWebhookDto): Promise<Webhook> {
    return this.prisma.webhook.create({
      data: {
        organizationId: orgId,
        url: dto.url,
        events: dto.events,
        secret: this.encryptionService.encrypt(dto.secret),
      },
    });
  }

  async dispatch(event: WebhookEvent): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId: event.organizationId,
        isActive: true,
        events: { has: event.type },
      },
    });

    for (const webhook of webhooks) {
      await this.queueService.addToDefault('webhook_dispatch', {
        webhookId: webhook.id,
        event,
      });
    }
  }
}
```

## 4. Webhook Dispatch Processor

```typescript
// queue/processors/webhook-dispatch.processor.ts
@Processor('default')
export class WebhookDispatchProcessor {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}

  @Process('webhook_dispatch')
  async handleDispatch(job: Job<WebhookDispatchJobData>) {
    const { webhookId, event } = job.data;
    const webhook = await this.webhookService.findById(webhookId);

    const secret = this.encryptionService.decrypt(webhook.secret);
    const payload = this.buildPayload(event);
    const signature = this.signPayload(payload, secret);

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event.type,
            'X-Webhook-ID': webhook.id,
          },
          timeout: 10000,
        }),
      );

      if (response.status >= 200 && response.status < 300) {
        await this.webhookService.markSuccess(webhookId);
      } else {
        throw new Error(`Webhook returned status ${response.status}`);
      }
    } catch (error) {
      await this.webhookService.markFailure(webhookId);
      this.logger.error(`Webhook dispatch failed: ${webhook.url}`, error);

      // Retry with exponential backoff
      if (job.attemptsMade < 3) {
        throw error;
      }
    }
  }

  private buildPayload(event: WebhookEvent): any {
    return {
      id: randomUUID(),
      type: event.type,
      createdAt: new Date().toISOString(),
      data: event.payload,
    };
  }

  private signPayload(payload: any, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }
}
```

## 5. Incoming Webhooks (from Tax Authorities)

```typescript
// webhooks/controllers/incoming.controller.ts
@Controller('webhooks/incoming')
export class IncomingWebhooksController {
  constructor(private readonly eventBus: EventBusService) {}

  @Post(':provider')
  async handleIncoming(
    @Param('provider') provider: string,
    @Headers('x-signature') signature: string,
    @Body() payload: any,
  ) {
    const webhook = await this.webhookService.findByProvider(provider);

    if (!this.verifySignature(payload, signature, webhook.secret)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    switch (payload.eventType) {
      case 'return.accepted':
        await this.eventBus.emit(new VatReturnAcceptedEvent(payload.returnId, payload.acceptedAt));
        break;
      case 'return.rejected':
        await this.eventBus.emit(new VatReturnRejectedEvent(payload.returnId, payload.reason));
        break;
      case 'payment.received':
        await this.eventBus.emit(new PaymentReceivedEvent(payload.returnId, payload.amount));
        break;
    }

    return { received: true };
  }
}
```

## 6. Webhook Security

```typescript
// webhooks/security/signature.verifier.ts
export class SignatureVerifier {
  verify(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}
```

## 7. Webhook Retry Policy

```typescript
const webhookJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
```

## 8. Webhook Monitoring

```typescript
// webhooks/monitoring.service.ts
@Injectable()
export class WebhookMonitoringService {
  async getHealth(orgId: string): Promise<WebhookHealth> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId: orgId },
      orderBy: { lastFailureAt: 'desc' },
    });

    return {
      total: webhooks.length,
      active: webhooks.filter((w) => w.isActive).length,
      failing: webhooks.filter((w) => w.failureCount > 3).length,
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.isActive,
        lastSuccessAt: w.lastSuccessAt,
        lastFailureAt: w.lastFailureAt,
        failureCount: w.failureCount,
      })),
    };
  }
}
```
