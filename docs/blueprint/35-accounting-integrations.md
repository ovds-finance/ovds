# 35 — Third-Party Accounting System Integrations

## 1. Integration Overview

The system integrates with popular accounting platforms to sync transactions, invoices, and chart of accounts.

| System | Direction | Data Types |
|--------|-----------|-----------|
| Xero | Bidirectional | Invoices, contacts, chart of accounts |
| QuickBooks | Bidirectional | Invoices, bills, accounts |
| Sage | Bidirectional | Invoices, contacts |
| FreeAgent | Bidirectional | Invoices, expenses |
| Wave | Read | Invoices, transactions |
| CSV/Excel | Import | Transactions, invoices |

## 2. Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Integration Adapter Layer                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Xero      │  │ QuickBooks  │  │   CSV/Excel         │  │
│  │  Adapter    │  │   Adapter   │  │   Adapter           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          ▼                                   │
│                   ┌─────────────────────┐                    │
│                   │   Normalization     │                    │
│                   │      Layer          │                    │
│                   └─────────────────────┘                    │
│                          │                                   │
│                          ▼                                   │
│                   ┌─────────────────────┐                    │
│                   │   Internal Domain   │                    │
│                   │      Models         │                    │
│                   └─────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## 3. Integration Interface

```typescript
// integrations/accounting/interfaces/accounting-provider.interface.ts
export interface AccountingProvider {
  readonly code: string;
  readonly name: string;
  readonly supportedOperations: AccountingOperation[];

  connect(credentials: AccountingCredentials): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  syncInvoices(params: SyncInvoicesParams): Promise<SyncResult<Invoice>>;
  syncContacts(params: SyncContactsParams): Promise<SyncResult<Contact>>;
  syncChartOfAccounts(): Promise<SyncResult<Account>>;
  pushInvoice(invoice: Invoice): Promise<PushResult>;
  pushTransaction(transaction: Transaction): Promise<PushResult>;
  getBalanceSheet(params: ReportParams): Promise<BalanceSheet>;
  getProfitLoss(params: ReportParams): Promise<ProfitLoss>;
}

export enum AccountingOperation {
  SyncInvoices = 'sync_invoices',
  SyncContacts = 'sync_contacts',
  SyncChartOfAccounts = 'sync_chart_of_accounts',
  PushInvoice = 'push_invoice',
  PushTransaction = 'push_transaction',
  GetReports = 'get_reports',
}

export interface SyncResult<T> {
  success: boolean;
  created: T[];
  updated: T[];
  deleted: T[];
  errors: SyncError[];
  nextSyncToken?: string;
}

export interface PushResult {
  success: boolean;
  externalId?: string;
  error?: string;
}
```

## 4. Provider Registry

```typescript
// integrations/accounting/providers/accounting-provider.registry.ts
@Injectable()
export class AccountingProviderRegistry {
  private providers = new Map<string, AccountingProvider>();

  register(provider: AccountingProvider): void {
    this.providers.set(provider.code, provider);
  }

  resolve(code: string): AccountingProvider {
    const provider = this.providers.get(code);
    if (!provider) throw new ProviderNotFoundException(code);
    return provider;
  }

  list(): AccountingProvider[] {
    return Array.from(this.providers.values());
  }
}
```

## 5. Xero Adapter

```typescript
// integrations/accounting/providers/xero/xero.provider.ts
@Injectable()
export class XeroProvider implements AccountingProvider {
  readonly code = 'xero';
  readonly name = 'Xero';
  readonly supportedOperations = [
    AccountingOperation.SyncInvoices,
    AccountingOperation.SyncContacts,
    AccountingOperation.SyncChartOfAccounts,
    AccountingOperation.PushInvoice,
    AccountingOperation.GetReports,
  ];

  private readonly baseUrl = 'https://api.xero.com/api.xro/2.0';
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly httpService: HttpService, private readonly encryptionService: EncryptionService) {
    this.clientId = process.env.XERO_CLIENT_ID!;
    this.clientSecret = process.env.XERO_CLIENT_SECRET!;
  }

  async connect(credentials: AccountingCredentials): Promise<ConnectionResult> {
    // OAuth2 flow
    const authUrl = `https://login.xero.com/identity/connect/authorize?client_id=${this.clientId}&redirect_uri=${credentials.redirectUri}&response_type=code&scope=accounting.transactions accounting.contacts`;

    return {
      success: true,
      authUrl,
    };
  }

  async syncInvoices(params: SyncInvoicesParams): Promise<SyncResult<Invoice>> {
    const accessToken = await this.getValidAccessToken(params.integrationId);
    const since = params.since || new Date(0);

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/Invoices`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { where: `UpdatedDate>=DateTime(${since.toISOString()})` },
      }),
    );

    const invoices = response.data.Invoices.map((xeroInvoice: any) => this.normalizeInvoice(xeroInvoice));

    return {
      success: true,
      created: [],
      updated: invoices,
      deleted: [],
      errors: [],
      nextSyncToken: response.data.Invoices?.[0]?.UpdatedDateUTC,
    };
  }

  async pushInvoice(invoice: Invoice): Promise<PushResult> {
    const accessToken = await this.getValidAccessToken(invoice.integrationId);
    const xeroInvoice = this.toXeroInvoice(invoice);

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/Invoices`, { Invoices: [xeroInvoice] }, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      return {
        success: true,
        externalId: response.data.Invoices[0].InvoiceID,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private normalizeInvoice(xeroInvoice: any): Invoice {
    return {
      externalId: xeroInvoice.InvoiceID,
      externalProvider: 'xero',
      number: xeroInvoice.InvoiceNumber,
      type: xeroInvoice.Type,
      status: xeroInvoice.Status,
      date: new Date(xeroInvoice.Date),
      dueDate: new Date(xeroInvoice.DueDate),
      amount: xeroInvoice.Total,
      currencyCode: xeroInvoice.CurrencyCode,
      contact: {
        name: xeroInvoice.Contact?.Name,
        email: xeroInvoice.Contact?.EmailAddress,
      },
      lineItems: xeroInvoice.LineItems?.map((line: any) => ({
        description: line.Description,
        quantity: line.Quantity,
        unitAmount: line.UnitAmount,
        accountCode: line.AccountCode,
      })),
    };
  }

  private toXeroInvoice(invoice: Invoice): any {
    return {
      Type: invoice.type.toUpperCase(),
      Contact: { Name: invoice.contact.name, EmailAddress: invoice.contact.email },
      Date: invoice.date.toISOString().split('T')[0],
      DueDate: invoice.dueDate.toISOString().split('T')[0],
      LineItems: invoice.lineItems.map((item) => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unitAmount,
        AccountCode: item.accountCode,
      })),
    };
  }
}
```

## 6. QuickBooks Adapter

```typescript
// integrations/accounting/providers/quickbooks/quickbooks.provider.ts
@Injectable()
export class QuickBooksProvider implements AccountingProvider {
  readonly code = 'quickbooks';
  readonly name = 'QuickBooks';
  readonly supportedOperations = [
    AccountingOperation.SyncInvoices,
    AccountingOperation.SyncContacts,
    AccountingOperation.SyncChartOfAccounts,
    AccountingOperation.PushInvoice,
    AccountingOperation.GetReports,
  ];

  private readonly baseUrl = 'https://quickbooks.api.intuit.com/v3';
  private readonly realmId: string;

  constructor(private readonly httpService: HttpService) {}

  async syncInvoices(params: SyncInvoicesParams): Promise<SyncResult<Invoice>> {
    const accessToken = await this.getValidAccessToken(params.integrationId);
    const since = params.since || new Date(0);

    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/company/${this.realmId}/query`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          query: `SELECT * FROM Invoice WHERE MetaData.LastUpdatedTime >= '${since.toISOString()}'`,
        },
      }),
    );

    const invoices = response.data.QueryResponse.Invoice.map((qbInvoice: any) => this.normalizeInvoice(qbInvoice));

    return {
      success: true,
      created: [],
      updated: invoices,
      deleted: [],
      errors: [],
    };
  }

  private normalizeInvoice(qbInvoice: any): Invoice {
    return {
      externalId: qbInvoice.Id,
      externalProvider: 'quickbooks',
      number: qbInvoice.DocNumber,
      type: qbInvoice.type,
      status: qbInvoice.status,
      date: new Date(qbInvoice.TxnDate),
      dueDate: new Date(qbInvoice.DueDate),
      amount: qbInvoice.TotalAmt,
      currencyCode: qbInvoice.CurrencyRef?.value,
      contact: {
        name: qbInvoice.CustomerRef?.name,
      },
      lineItems: qbInvoice.Line?.map((line: any) => ({
        description: line.Description,
        quantity: line.Qty,
        unitAmount: line.UnitPrice,
      })),
    };
  }
}
```

## 7. CSV Import Adapter

```typescript
// integrations/accounting/providers/csv/csv.provider.ts
@Injectable()
export class CsvImportProvider implements AccountingProvider {
  readonly code = 'csv';
  readonly name = 'CSV Import';
  readonly supportedOperations = [AccountingOperation.SyncInvoices, AccountingOperation.SyncContacts];

  async import(file: Express.Multer.File, mapping: ColumnMapping): Promise<SyncResult<any>> {
    const records = this.parseCsv(file.buffer, mapping);

    const created: any[] = [];
    const errors: SyncError[] = [];

    for (const record of records) {
      try {
        const normalized = this.normalize(record);
        created.push(normalized);
      } catch (error) {
        errors.push({ record, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      created,
      updated: [],
      deleted: [],
      errors,
    };
  }

  private parseCsv(buffer: Buffer, mapping: ColumnMapping): any[] {
    const csv = buffer.toString('utf-8');
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map((h) => mapping.headerMap[h] || h);

    return lines.slice(1).map((line) => {
      const values = line.split(',');
      const record: any = {};
      headers.forEach((header, i) => {
        record[header] = values[i];
      });
      return record;
    });
  }

  private normalize(record: any): any {
    return {
      number: record.invoice_number,
      date: new Date(record.date),
      amount: parseFloat(record.amount),
      contact: { name: record.customer_name },
    };
  }
}
```

## 8. Synchronization Pipeline

```typescript
// integrations/accounting/sync-pipeline.service.ts
@Injectable()
export class AccountingSyncPipeline {
  constructor(private readonly providerRegistry: AccountingProviderRegistry, private readonly queueService: QueueService) {}

  async startSync(integrationId: string): Promise<void> {
    const integration = await this.integrationService.findById(integrationId);
    const provider = this.providerRegistry.resolve(integration.provider);

    await this.queueService.addToDefault('accounting_sync', {
      integrationId,
      provider: integration.provider,
    });
  }
}

// queue/processors/accounting-sync.processor.ts
@Processor('default')
export class AccountingSyncProcessor {
  constructor(private readonly accountingSyncService: AccountingSyncService) {}

  @Process('accounting_sync')
  async handleSync(job: Job<AccountingSyncJobData>) {
    const { integrationId, provider } = job.data;

    await this.accountingSyncService.syncInvoices(integrationId, provider);
    await this.accountingSyncService.syncContacts(integrationId, provider);
    await this.accountingSyncService.syncChartOfAccounts(integrationId, provider);
  }
}
```

## 9. Conflict Resolution

```typescript
// integrations/accounting/conflict-resolver.service.ts
export enum ConflictResolution {
  SourceWins = 'source_wins',
  TargetWins = 'target_wins',
  Merge = 'merge',
  Manual = 'manual',
}

@Injectable()
export class ConflictResolverService {
  async resolve(internal: any, external: any, strategy: ConflictResolution): Promise<any> {
    switch (strategy) {
      case ConflictResolution.SourceWins:
        return external;
      case ConflictResolution.TargetWins:
        return internal;
      case ConflictResolution.Merge:
        return { ...internal, ...external };
      case ConflictResolution.Manual:
        // Create conflict record for manual resolution
        await this.createConflictRecord(internal, external);
        return internal;
    }
  }
}
```

## 10. Webhook Integration

```typescript
// integrations/accounting/webhooks.controller.ts
@Controller('webhooks/accounting')
export class AccountingWebhooksController {
  constructor(private readonly eventBus: EventBusService) {}

  @Post('xero')
  async xeroWebhook(@Body() payload: any) {
    switch (payload.events?.[0]?.resourceUrl) {
      case 'Invoices':
        await this.eventBus.emit(new InvoiceUpdatedEvent(payload));
        break;
      case 'Contacts':
        await this.eventBus.emit(new ContactUpdatedEvent(payload));
        break;
    }
    return { received: true };
  }
}
```
