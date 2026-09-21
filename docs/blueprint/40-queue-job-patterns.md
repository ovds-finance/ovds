# 40 — Queue and Job Patterns Translation

## 1. Laravel to NestJS Job Translation

The Laravel Job/Event/Listener pipeline maps directly to NestJS patterns:

```
Laravel                              NestJS
─────────────────────────────────────────────────────────
Job (sync)                           Service method
Job (queued)                         BullMQ processor + job class
Event                                Event class (implements Event interface)
Listener                             @EventsListener decorator
dispatch()                           eventBus.emit()
ShouldQueue interface                @Processor decorator
Queue connection                     BullMQ queue name
```

## 2. Job Base Class Translation

### 2.1 Laravel Job Pattern

```php
// Laravel: App\Jobs\Document\CreateDocument
class CreateDocument implements ShouldCreate, HasOwner, HasSource {
  public function handle() {
    // 1. Authorize
    // 2. Fire DocumentCreating event
    // 3. DB transaction
    // 4. Create model
    // 5. Upload media
    // 6. Dispatch CreateDocumentItemsAndTotals
    // 7. Fire DocumentCreated event
  }
}
```

### 2.2 NestJS Translation

```typescript
// NestJS: vat-returns.service.ts
@Injectable()
export class VatReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly mediaService: MediaService,
  ) {}

  async create(dto: CreateVatReturnDto, userId: string): Promise<VatReturn> {
    // 1. Authorize (guard handles this)
    // 2. Fire VatReturnCreating event
    await this.eventBus.emit(new VatReturnCreatingEvent(dto));

    // 3. DB transaction
    const vatReturn = await this.prisma.$transaction(async (tx) => {
      // 4. Create model
      const vatReturn = await tx.vatReturn.create({
        data: {
          ...dto,
          organizationId: TenantContext.getOrganizationId()!,
          createdBy: userId,
        },
      });

      // 5. Upload media (if any)
      if (dto.attachments) {
        await this.mediaService.uploadAttachments(vatReturn.id, dto.attachments);
      }

      // 6. Create items and totals
      await this.createItemsAndTotals(tx, vatReturn.id, dto.items);

      return vatReturn;
    });

    // 7. Fire VatReturnCreated event
    await this.eventBus.emit(new VatReturnCreatedEvent(vatReturn.id));

    return vatReturn;
  }
}
```

## 3. Async Job Translation

### 3.1 Laravel Queued Job

```php
// Laravel: App\Jobs\Document\SendDocument
class SendDocument implements ShouldQueue {
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  public function handle() {
    Mail::to($this->document->contact->email)
      ->send(new DocumentMailable($this->document));
  }
}
```

### 3.2 NestJS Translation

```typescript
// NestJS: queue/jobs/send-document.job.ts
export interface SendDocumentJobData {
  documentId: string;
  organizationId: string;
}

// queue/processors/document.processor.ts
@Processor('default')
export class DocumentProcessor {
  constructor(
    private readonly mailerService: MailerService,
    private readonly documentService: DocumentService,
  ) {}

  @Process('send_document')
  async handleSendDocument(job: Job<SendDocumentJobData>) {
    const { documentId } = job.data;
    const document = await this.documentService.findById(documentId);

    await this.mailerService.sendMail({
      to: document.contact.email,
      subject: `Document ${document.number}`,
      template: 'document.sent',
      context: { document },
    });

    await this.documentService.markSent(documentId);
  }
}

// Triggering the job
await this.queueService.addToDefault('send_document', {
  documentId: vatReturn.id,
  organizationId: vatReturn.organizationId,
});
```

## 4. Event Translation

### 4.1 Laravel Event

```php
// Laravel: App\Events\Document\DocumentCreated
class DocumentCreated {
  public $document;
  public function __construct(Document $document) {
    $this->document = $document;
  }
}
```

### 4.2 NestJS Translation

```typescript
// NestJS: events/document/vat-return-created.event.ts
export class VatReturnCreatedEvent implements Event {
  readonly timestamp = new Date();
  readonly correlationId = randomUUID();

  constructor(
    public readonly returnId: string,
    public readonly organizationId: string,
    public readonly createdBy: string,
  ) {}
}
```

## 5. Listener Translation

### 4.1 Laravel Listener

```php
// Laravel: App\Listeners\Document\CreateDocumentCreatedHistory
class CreateDocumentCreatedHistory {
  public function handle(DocumentCreated $event) {
    DocumentHistory::create([
      'document_id' => $event->document->id,
      'status' => 'created',
      'description' => 'Document created',
    ]);
  }
}
```

### 4.2 NestJS Translation

```typescript
// NestJS: listeners/document/vat-return-created.listener.ts
@EventsListener(VatReturnCreatedEvent)
export class VatReturnCreatedListener {
  constructor(private readonly historyService: VatReturnHistoryService) {}

  async handle(event: VatReturnCreatedEvent): Promise<void> {
    await this.historyService.create({
      vatReturnId: event.returnId,
      action: 'created',
      userId: event.createdBy,
      notes: 'VAT return created',
    });
  }
}
```

## 6. Queue Configuration

```typescript
// queue/queue.config.ts
export const queueConfig = {
  connections: {
    default: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      db: 0,
    },
    jobs: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      db: 1,
    },
    emails: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      db: 2,
    },
  },
  queues: {
    default: {
      concurrency: 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
    jobs: {
      concurrency: 5,
      attempts: 5,
      backoff: { type: 'exponential', delay: 10000 },
    },
    emails: {
      concurrency: 20,
      attempts: 3,
      backoff: { type: 'fixed', delay: 60000 },
    },
  },
};
```

## 7. Scheduled Jobs (Cron)

### 7.1 Laravel Schedule

```php
// Laravel: routes/console.php
Schedule::job(new RecurringCheck)->everyFifteenMinutes();
Schedule::job(new InvoiceReminder)->daily();
```

### 7.2 NestJS Translation

```typescript
// scheduler/cron.service.ts
@Injectable()
export class CronService {
  @Cron('*/15 * * * *')
  async handleRecurringCheck() {
    await this.recurringService.processDueRecurrings();
  }

  @Cron('0 9 * * *')
  async handleVatReturnReminders() {
    await this.notificationService.sendDeadlineReminders();
  }
}
```

## 8. Job Priorities

```typescript
// Queue with priorities
await this.queueService.addToDefault('high_priority_job', data, {
  priority: 1,
});

await this.queueService.addToDefault('low_priority_job', data, {
  priority: 10,
});
```

## 9. Job Dependencies

```typescript
// Sequential job processing
await this.queueService.addToDefault('step1', data);
await this.queueService.addToDefault('step2', { dependency: 'step1' });
```

## 10. Retry and Failure Handling

```typescript
// Custom retry logic
@Processor('default')
export class DocumentProcessor {
  @Process('send_document', {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  })
  async handleSendDocument(job: Job<SendDocumentJobData>) {
    try {
      await this.sendDocument(job.data);
    } catch (error) {
      if (job.attemptsMade >= 3) {
        await this.failureHandler.handle(job.data, error);
      }
      throw error;
    }
  }
}
```
