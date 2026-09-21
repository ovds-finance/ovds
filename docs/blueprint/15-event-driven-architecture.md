# 15 — Event-Driven Architecture and Event Sourcing

## 1. Event-Driven Design Principles

The system uses events to decouple bounded contexts. State changes emit events, and other modules react asynchronously.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VAT Return Module                            │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Service   │───▶│ Event Emitter │───▶│   Event Bus      │   │
│  └────────────┘    └──────────────┘    └────────┬─────────┘   │
│                                                  │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
              ┌────────────────────────────────────┼──────────────┐
              ▼                                    ▼              ▼
    ┌─────────────────┐                 ┌─────────────────┐ ┌─────────────────┐
    │  Integration    │                 │  Notification   │ │    Audit        │
    │  Listener       │                 │  Listener       │ │    Listener     │
    └─────────────────┘                 └─────────────────┘ └─────────────────┘
```

## 2. Event Bus Implementation

```typescript
// events/event-bus.service.ts
@Injectable()
export class EventBusService {
  private readonly listeners = new Map<string, EventHandler[]>();

  subscribe<T extends Event>(eventClass: Type<T>, handler: EventHandler<T>): void {
    const eventName = this.getEventName(eventClass);
    const handlers = this.listeners.get(eventName) || [];
    handlers.push(handler);
    this.listeners.set(eventName, handlers);
  }

  async emit(event: Event): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.listeners.get(eventName) || [];

    await Promise.allSettled(
      handlers.map((handler) => this.invokeHandler(handler, event)),
    );
  }

  private async invokeHandler(handler: EventHandler<any>, event: Event): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      this.logger.error(`Event handler failed for ${event.constructor.name}:`, error);
      // Move to DLQ or alert
      await this.dlqService.add({
        event: event.constructor.name,
        payload: event,
        error: error.message,
      });
    }
  }

  private getEventName(eventClass: Type<Event>): string {
    return eventClass.name;
  }
}

export interface Event {
  readonly timestamp: Date;
  readonly correlationId: string;
}

export interface EventHandler<T extends Event> {
  handle(event: T): Promise<void> | void;
}
```

## 3. Event Decorators

```typescript
// events/decorators/events-listener.decorator.ts
export const EventsListener = (eventClass: Type<Event>) =>
  SetMetadata('events:subscribe', eventClass);

// events/event-bus.module.ts
@Module({
  providers: [EventBusService, ...listeners],
})
export class EventBusModule {
  constructor(private readonly eventBus: EventBusService) {
    const metadata = Reflect.getMetadata('design:paramtypes', EventBusModule);
    // Auto-discover and register listeners
  }
}
```

## 4. Core Events

### 4.1 VAT Return Events

```typescript
// events/vat-return/vat-return-created.event.ts
export class VatReturnCreatedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly returnId: string,
    public readonly organizationId: string,
    public readonly vatRegistrationId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly createdBy: string,
  ) {}
}

export class VatReturnSubmittedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly returnId: string,
    public readonly organizationId: string,
    public readonly submissionId: string,
    public readonly submittedBy: string,
  ) {}
}

export class VatReturnAcceptedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly returnId: string,
    public readonly organizationId: string,
    public readonly acceptedAt: Date,
  ) {}
}

export class VatReturnRejectedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly returnId: string,
    public readonly organizationId: string,
    public readonly reason: string,
  ) {}
}
```

### 4.2 Transaction Events

```typescript
// events/transaction/transaction-created.event.ts
export class TransactionCreatedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly transactionId: string,
    public readonly organizationId: string,
    public readonly amount: Decimal,
    public readonly type: string,
  ) {}
}

export class TransactionReconciledEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly transactionId: string,
    public readonly organizationId: string,
    public readonly reconciledWith: string,
  ) {}
}
```

### 4.3 Integration Events

```typescript
// events/integration/integration-connected.event.ts
export class IntegrationConnectedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly integrationId: string,
    public readonly organizationId: string,
    public readonly provider: string,
  ) {}
}

export class IntegrationSyncCompletedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly integrationId: string,
    public readonly organizationId: string,
    public readonly syncedAt: Date,
    public readonly recordsSynced: number,
  ) {}
}
```

## 5. Event Listeners

```typescript
// listeners/vat-return/vat-return-submitted.listener.ts
@EventsListener(VatReturnSubmittedEvent)
export class VatReturnSubmittedListener {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async handle(event: VatReturnSubmittedEvent): Promise<void> {
    // 1. Submit to tax authority
    await this.integrationService.submitReturn(event.returnId);

    // 2. Send notification to user
    await this.notificationService.send({
      organizationId: event.organizationId,
      type: 'submission_success',
      title: 'VAT Return Submitted',
      message: 'Your VAT return has been submitted successfully.',
      data: { returnId: event.returnId },
    });

    // 3. Audit log
    await this.auditService.log({
      action: 'vat_return.submitted',
      subjectType: 'VatReturn',
      subjectId: event.returnId,
    });
  }
}

// listeners/integration/integration-sync.listener.ts
@EventsListener(IntegrationSyncCompletedEvent)
export class IntegrationSyncCompletedListener {
  constructor(private readonly notificationService: NotificationService) {}

  async handle(event: IntegrationSyncCompletedEvent): Promise<void> {
    await this.notificationService.send({
      organizationId: event.organizationId,
      type: 'integration_sync_completed',
      title: 'Sync Completed',
      message: `Synced ${event.recordsSynced} records from ${event.provider}.`,
    });
  }
}
```

## 6. Event Sourcing for Audit

Critical aggregates maintain an event stream for full audit history:

```typescript
// eventsourcing/event-store.service.ts
@Injectable()
export class EventStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async append(streamId: string, event: Event, version: number): Promise<void> {
    await this.prisma.event.create({
      data: {
        streamId,
        streamType: this.getStreamType(event),
        version,
        eventType: event.constructor.name,
        payload: JSON.parse(JSON.stringify(event)),
        metadata: {
          correlationId: event.correlationId,
          timestamp: event.timestamp,
        },
      },
    });
  }

  async read(streamId: string): Promise<StoredEvent[]> {
    return this.prisma.event.findMany({
      where: { streamId },
      orderBy: { version: 'asc' },
    });
  }

  async readAll(streamType: string): Promise<StoredEvent[]> {
    return this.prisma.event.findMany({
      where: { streamType },
      orderBy: { timestamp: 'asc' },
    });
  }
}

model Event {
  id          String   @id @default(cuid())
  streamId    String   // e.g., "vat-return:ret_123"
  streamType  String   // e.g., "VatReturn"
  version     Int
  eventType   String   // e.g., "VatReturnSubmittedEvent"
  payload     Json
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([streamId, version])
  @@index([streamType, createdAt])
}
```

## 7. Event Sourcing Example: VAT Return Aggregate

```typescript
// eventsourcing/aggregates/vat-return.aggregate.ts
export class VatReturnAggregate {
  private events: VatReturnEvent[] = [];
  private state: VatReturnState;

  constructor(private readonly eventStore: EventStoreService) {}

  async load(returnId: string): Promise<void> {
    const events = await this.eventStore.read(`vat-return:${returnId}`);
    this.state = this.applyEvents(events);
  }

  async submit(userId: string): Promise<void> {
    if (this.state.status !== 'draft') {
      throw new InvalidStateTransitionException(this.state.status, 'submitted');
    }

    const event = new VatReturnSubmittedEvent(
      this.state.id,
      this.state.organizationId,
      this.generateSubmissionId(),
      userId,
    );

    this.events.push(event);
    this.state.status = 'submitted';

    await this.eventStore.append(`vat-return:${this.state.id}`, event, this.events.length);
  }

  private applyEvents(events: VatReturnEvent[]): VatReturnState {
    return events.reduce((state, event) => {
      switch (event.constructor.name) {
        case 'VatReturnCreatedEvent':
          return { ...state, status: 'draft' };
        case 'VatReturnSubmittedEvent':
          return { ...state, status: 'submitted' };
        // ... other events
        default:
          return state;
      }
    }, initialState);
  }
}
```

## 8. Idempotency

Events include a `correlationId` to prevent duplicate processing:

```typescript
// events/idempotency.service.ts
@Injectable()
export class EventIdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async isProcessed(correlationId: string): Promise<boolean> {
    const event = await this.prisma.processedEvent.findUnique({
      where: { correlationId },
    });
    return !!event;
  }

  async markProcessed(correlationId: string): Promise<void> {
    await this.prisma.processedEvent.create({
      data: { correlationId, processedAt: new Date() },
    });
  }
}
```

## 9. Eventual Consistency

Some operations are eventually consistent. The system handles this with:

- **Read-your-own-writes**: After mutation, refetch affected queries.
- **Compensating transactions**: If a downstream action fails, emit a compensating event.
- **Outbox pattern**: Events are written to an outbox table in the same transaction, then published by a background job.

```typescript
// events/outbox-pattern.ts
@Injectable()
export class OutboxProcessor {
  @Process('publish_events')
  async publishEvents(job: Job) {
    const events = await this.prisma.outboxEvent.findMany({
      where: { published: false },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    for (const event of events) {
      await this.eventBus.emit(JSON.parse(event.payload));
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { published: true, publishedAt: new Date() },
      });
    }
  }
}
```

## 10. Dead-Letter Queue for Events

Failed event handlers move events to a DLQ for manual review:

```typescript
// events/dlq.service.ts
@Injectable()
export class EventDlqService {
  async add(event: { event: string; payload: any; error: string; failedAt: Date }): Promise<void> {
    await this.prisma.eventDlq.create({
      data: {
        eventType: event.event,
        payload: event.payload,
        error: event.error,
        failedAt: event.failedAt,
        retryCount: 0,
      },
    });
  }

  async retry(id: string): Promise<void> {
    const dlqEntry = await this.prisma.eventDlq.findUnique({ where: { id } });
    if (!dlqEntry) return;

    const event = this.deserializeEvent(dlqEntry.payload);
    await this.eventBus.emit(event);

    await this.prisma.eventDlq.delete({ where: { id } });
  }
}
```
