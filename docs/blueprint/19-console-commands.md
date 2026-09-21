# 19 — Console Commands and Maintenance

## 1. Artisan Commands

The system includes the following console commands for maintenance and operations:

| Command | Purpose | Schedule |
|---------|---------|----------|
| `app:install` | Initial application setup | Manual |
| `app:update` | Run database migrations and seeders | Manual / CI |
| `app:refresh` | Reinstall and reseed database | Manual |
| `recurring:check` | Process recurring VAT returns | Daily |
| `reminder:vat-return` | Send VAT return deadline reminders | Daily |
| `reminder:bill` | Send bill payment reminders | Daily |
| `storage:clear` | Clear temporary storage | Weekly |
| `queue:work` | Process background jobs | Always |
| `queue:monitor` | Monitor queue health | Always |
| `module:download` | Download module from marketplace | Manual |
| `module:install` | Install downloaded module | Manual |
| `company:seed` | Seed demo data for a company | Manual |
| `user:seed` | Seed demo users | Manual |
| `integration:sync` | Sync with tax authority | Manual / Scheduler |
| `report:generate` | Generate report on demand | Manual |

## 2. Command Structure

```
apps/api/src/commands/
├── app/
│   ├── install.command.ts
│   ├── update.command.ts
│   └── refresh.command.ts
├── recurring/
│   └── check.command.ts
├── reminders/
│   ├── vat-return.command.ts
│   └── bill.command.ts
├── storage/
│   └── clear.command.ts
├── queue/
│   ├── work.command.ts
│   └── monitor.command.ts
├── module/
│   ├── download.command.ts
│   └── install.command.ts
├── seed/
│   ├── company.command.ts
│   └── user.command.ts
├── integration/
│   └── sync.command.ts
└── report/
    └── generate.command.ts
```

## 3. App Install Command

```typescript
// commands/app/install.command.ts
@Command({ name: 'app:install', description: 'Install the application' })
export class AppInstallCommand {
  constructor(
    private readonly prisma: PrismaService,
    private readonly installerService: InstallerService,
  ) {}

  async run(): Promise<void> {
    console.log('Starting VAT Declaration System installation...');

    // 1. Check requirements
    await this.installerService.checkRequirements();

    // 2. Run migrations
    console.log('Running migrations...');
    await this.prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS shared`;
    await this.prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS tenant`;
    await this.prisma.$executeRaw`SET search_path TO shared`;
    await this.runMigrations();

    // 3. Seed shared data
    console.log('Seeding shared data...');
    await this.seedSharedData();

    // 4. Create admin user
    console.log('Creating admin user...');
    await this.createAdminUser();

    // 5. Create default organization
    console.log('Creating default organization...');
    await this.createDefaultOrganization();

    console.log('Installation completed successfully!');
  }

  private async runMigrations(): Promise<void> {
    // Run Prisma migrations
    await exec('npx prisma migrate deploy --schema=prisma/schema/shared.prisma');
    await exec('npx prisma migrate deploy --schema=prisma/schema/tenant.prisma');
  }

  private async seedSharedData(): Promise<void> {
    await this.prisma.subscriptionPlan.createMany({
      data: [
        { name: 'Free', priceMonthly: 0, maxUsers: 1, maxReturns: 10 },
        { name: 'Pro', priceMonthly: 29, maxUsers: 5, maxReturns: 100 },
        { name: 'Business', priceMonthly: 99, maxUsers: 20, maxReturns: 500 },
      ],
    });

    await this.prisma.role.createMany({
      data: [
        { name: 'owner', permissions: { '*': true }, isSystem: true },
        { name: 'admin', permissions: { /* ... */ }, isSystem: true },
        { name: 'accountant', permissions: { /* ... */ }, isSystem: true },
        { name: 'viewer', permissions: { /* ... */ }, isSystem: true },
      ],
    });
  }
}
```

## 4. Recurring Check Command

```typescript
// commands/recurring/check.command.ts
@Command({ name: 'recurring:check', description: 'Process recurring VAT returns' })
export class RecurringCheckCommand {
  constructor(
    private readonly vatReturnService: VatReturnService,
    private readonly queueService: QueueService,
    private readonly logger: Logger,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Checking for recurring VAT returns...');

    const recurringReturns = await this.vatReturnService.findRecurringDue();

    for (const recurring of recurringReturns) {
      await this.queueService.addToDefault('create_recurring_return', {
        vatRegistrationId: recurring.vatRegistrationId,
        periodStart: recurring.nextPeriodStart,
        periodEnd: recurring.nextPeriodEnd,
        dueDate: recurring.nextDueDate,
      });

      this.logger.log(`Queued recurring return for ${recurring.vatRegistrationId}`);
    }

    this.logger.log(`Processed ${recurringReturns.length} recurring returns`);
  }
}
```

## 5. VAT Return Reminder Command

```typescript
// commands/reminders/vat-return.command.ts
@Command({ name: 'reminder:vat-return', description: 'Send VAT return deadline reminders' })
export class VatReturnReminderCommand {
  constructor(
    private readonly vatReturnService: VatReturnService,
    private readonly notificationService: NotificationService,
    private readonly logger: Logger,
  ) {}

  async run(daysBefore: number = 7): Promise<void> {
    this.logger.log(`Sending VAT return reminders for returns due in ${daysBefore} days...`);

    const upcomingReturns = await this.vatReturnService.findUpcomingDeadlines(daysBefore);

    for (const vatReturn of upcomingReturns) {
      await this.notificationService.send({
        organizationId: vatReturn.organizationId,
        userId: vatReturn.createdBy,
        type: 'vat_return_due',
        title: 'VAT Return Due Soon',
        message: `Your VAT return for ${formatPeriod(vatReturn.periodStart, vatReturn.periodEnd)} is due on ${formatDate(vatReturn.dueDate)}.`,
        data: { returnId: vatReturn.id, dueDate: vatReturn.dueDate },
        priority: 'high',
      });
    }

    this.logger.log(`Sent ${upcomingReturns.length} reminders`);
  }
}
```

## 6. Integration Sync Command

```typescript
// commands/integration/sync.command.ts
@Command({ name: 'integration:sync', description: 'Sync with tax authority' })
export class IntegrationSyncCommand {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly queueService: QueueService,
  ) {}

  async run(integrationId?: string, organizationId?: string): Promise<void> {
    const integrations = integrationId
      ? [await this.integrationService.findById(integrationId)]
      : await this.integrationService.findActive(organizationId);

    for (const integration of integrations) {
      await this.queueService.addToIntegrations('integration_sync', {
        integrationId: integration.id,
        organizationId: integration.organizationId,
      });
      console.log(`Queued sync for integration ${integration.id}`);
    }
  }
}
```

## 7. Queue Worker Command

```typescript
// commands/queue/work.command.ts
@Command({ name: 'queue:work', description: 'Process background jobs' })
export class QueueWorkCommand {
  constructor(private readonly queueService: QueueService) {}

  async run(queueName?: string): Promise<void> {
    const queues = queueName ? [queueName] : ['default', 'integrations', 'reports', 'emails'];

    for (const queueName of queues) {
      await this.queueService.process(queueName, {
        concurrency: this.getConcurrency(queueName),
        limiter: this.getLimiter(queueName),
      });
    }
  }

  private getConcurrency(queueName: string): number {
    switch (queueName) {
      case 'emails':
        return 20;
      case 'integrations':
        return 5;
      case 'reports':
        return 2;
      default:
        return 10;
    }
  }
}
```

## 8. Database Seeder Commands

```typescript
// commands/seed/company.command.ts
@Command({ name: 'company:seed', description: 'Seed demo company data' })
export class CompanySeedCommand {
  constructor(private readonly seederService: SeederService) {}

  async run(companyId?: string): Promise<void> {
    if (companyId) {
      await this.seederService.seedCompany(companyId);
    } else {
      await this.seederService.seedAllCompanies();
    }
  }
}

// commands/seed/user.command.ts
@Command({ name: 'user:seed', description: 'Seed demo users' })
export class UserSeedCommand {
  constructor(private readonly seederService: SeederService) {}

  async run(email?: string): Promise<void> {
    if (email) {
      await this.seederService.seedUser(email);
    } else {
      await this.seederService.seedAllUsers();
    }
  }
}
```

## 9. Module Install Command

```typescript
// commands/module/install.command.ts
@Command({ name: 'module:install', description: 'Install a module' })
export class ModuleInstallCommand {
  constructor(
    private readonly moduleService: ModuleService,
    private readonly eventBus: EventBusService,
  ) {}

  async run(moduleName: string, version?: string): Promise<void> {
    console.log(`Installing module ${moduleName}...`);

    // 1. Download module
    const modulePath = await this.moduleService.download(moduleName, version);

    // 2. Validate module
    await this.moduleService.validate(modulePath);

    // 3. Install module
    await this.moduleService.install(moduleName, modulePath);

    // 4. Run module migrations
    await this.moduleService.runMigrations(moduleName);

    // 5. Emit event
    await this.eventBus.emit(new ModuleInstalledEvent(moduleName, version));

    console.log(`Module ${moduleName} installed successfully`);
  }
}
```

## 10. Maintenance Commands

```typescript
// commands/storage/clear.command.ts
@Command({ name: 'storage:clear', description: 'Clear temporary storage' })
export class StorageClearCommand {
  constructor(private readonly storageService: StorageService) {}

  async run(olderThanDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deleted = await this.storageService.deleteOlderThan(cutoffDate);
    console.log(`Cleared ${deleted} temporary files`);
  }
}

// commands/report/generate.command.ts
@Command({ name: 'report:generate', description: 'Generate report' })
export class ReportGenerateCommand {
  constructor(private readonly reportService: ReportService) {}

  async run(organizationId: string, type: string, format: string): Promise<void> {
    const report = await this.reportService.createExport(organizationId, {
      type,
      format,
      name: `${type}_${new Date().toISOString().split('T')[0]}`,
    });

    console.log(`Report ${report.id} queued for generation`);
  }
}
```

## 11. Scheduler Registration

```typescript
// scheduler/cron.service.ts
@Injectable()
export class CronService {
  constructor(
    private readonly vatReturnReminderCommand: VatReturnReminderCommand,
    private readonly recurringCheckCommand: RecurringCheckCommand,
    private readonly integrationSyncCommand: IntegrationSyncCommand,
  ) {}

  @Cron('0 9 * * 1') // Every Monday at 9 AM
  async handleVatReturnReminders() {
    await this.vatReturnReminderCommand.run(7);
  }

  @Cron('0 9 * * 1') // Every Monday at 9 AM
  async handleRecurringCheck() {
    await this.recurringCheckCommand.run();
  }

  @Cron('0 3 * * *') // Daily at 3 AM
  async handleIntegrationSync() {
    await this.integrationSyncCommand.run();
  }
}
```

## 12. Command Testing

```typescript
// test/commands/vat-return-reminder.command.spec.ts
describe('VatReturnReminderCommand', () => {
  let command: VatReturnReminderCommand;
  let vatReturnService: MockType<VatReturnService>;
  let notificationService: MockType<NotificationService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VatReturnReminderCommand,
        { provide: VatReturnService, useFactory: vatReturnServiceFactory },
        { provide: NotificationService, useFactory: notificationServiceFactory },
      ],
    }).compile();

    command = module.get(VatReturnReminderCommand);
  });

  it('should send reminders for upcoming returns', async () => {
    vatReturnService.findUpcomingDeadlines.mockResolvedValue([
      { id: 'ret_1', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), /* ... */ },
    ]);

    await command.run(7);

    expect(notificationService.send).toHaveBeenCalledWith({
      type: 'vat_return_due',
      priority: 'high',
    });
  });
});
```
