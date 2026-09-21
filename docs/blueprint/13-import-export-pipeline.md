# 13 — Import/Export Pipeline

## 1. Import Architecture

The import pipeline processes CSV and Excel files for transactions and VAT returns. It supports:

- Multi-sheet Excel imports
- Row-level validation and error reporting
- Background processing via BullMQ
- Preview before commit
- Rollback on validation failure

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Upload    │────▶│   Parse     │────▶│  Validate   │────▶│   Commit    │
│   File      │     │   File      │     │   Rows      │     │   to DB     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                   │                   │
                          ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │  maatwebsite │     │  Zod Schemas│     │ Prisma $tx  │
                    │  / Excel     │     │  per column │     │  batch      │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

## 2. Import Job Model

```prisma
model ImportJob {
  id            String   @id @default(cuid())
  organizationId String
  type          String   // "transactions", "invoices", "vat_returns"
  status        String   @default("pending") // pending, processing, preview, committing, completed, failed, partial
  source        String   // "csv", "xlsx", "bank_api", "accounting_api"
  fileName      String?
  totalRows     Int?
  processedRows Int       @default(0)
  successRows   Int       @default(0)
  errorRows     Int       @default(0)
  errors        Json?     // [{ row: 1, field: "amount", message: "Invalid number", value: "abc" }]
  metadata      Json?     // Column mapping, headers, sheet names
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([organizationId, status])
  @@index([createdAt])
}
```

## 3. Import Service

```typescript
// common/services/import.service.ts
@Injectable()
export class ImportService {
  constructor(
    private readonly queueService: QueueService,
    private readonly storageService: StorageService,
  ) {}

  async createJob(orgId: string, file: Express.Multer.File, type: string): Promise<ImportJob> {
    const filePath = await this.storageService.upload(`imports/${orgId}/${Date.now()}_${file.originalname}`, file.buffer);

    const job = await this.prisma.importJob.create({
      data: {
        organizationId: orgId,
        type,
        source: this.detectSource(file.originalname),
        fileName: file.originalname,
        status: 'pending',
      },
    });

    await this.queueService.addToDefault('import_process', {
      jobId: job.id,
      filePath,
      type,
      organizationId: orgId,
    });

    return job;
  }

  async getJobStatus(jobId: string, orgId: string): Promise<ImportJob> {
    return this.prisma.importJob.findFirst({
      where: { id: jobId, organizationId: orgId },
    });
  }

  async preview(jobId: string, orgId: string): Promise<ImportPreview> {
    const job = await this.getJobStatus(jobId, orgId);
    if (job.status !== 'completed' && job.status !== 'partial') {
      throw new BadRequestException('Import not ready for preview');
    }

    const errors = job.errors as ImportError[];
    const successRows = job.totalRows! - errors.length;

    return {
      totalRows: job.totalRows!,
      successRows,
      errorRows: errors.length,
      errors: errors.slice(0, 100), // Limit preview errors
    };
  }
}
```

## 4. Import Processor

```typescript
// queue/processors/import.processor.ts
@Processor('default')
export class ImportProcessor {
  constructor(
    private readonly importService: ImportService,
    private readonly transactionService: TransactionService,
  ) {}

  @Process('import_process')
  async handleImport(job: Job<ImportJobData>) {
    const { jobId, filePath, type, organizationId } = job.data;

    await this.importService.updateStatus(jobId, 'processing');
    const file = await this.storageService.download(filePath);
    const workbook = read(file.buffer, { type: 'buffer' });

    const results = await this.processSheets(workbook, type, organizationId);

    await this.importService.updateStatus(jobId, results.hasErrors ? 'partial' : 'completed', {
      totalRows: results.totalRows,
      successRows: results.successRows,
      errorRows: results.errorRows,
      errors: results.errors,
    });
  }

  private async processSheets(workbook: XLSX.WorkBook, type: string, orgId: string): Promise<ImportResult> {
    const results: ImportResult = { totalRows: 0, successRows: 0, errorRows: 0, errors: [] };

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        results.totalRows++;

        try {
          await this.validateAndImportRow(type, row, orgId, i + 1);
          results.successRows++;
        } catch (error) {
          results.errorRows++;
          results.errors.push({
            row: i + 1,
            field: error.field,
            message: error.message,
            value: row[error.field],
          });
        }
      }
    }

    return results;
  }

  private async validateAndImportRow(type: string, row: any, orgId: string, rowNumber: number): Promise<void> {
    const schema = importSchemas[type];
    const validated = schema.parse(row);

    if (type === 'transactions') {
      await this.transactionService.importRow(orgId, validated);
    }
  }
}
```

## 5. Import Schemas

```typescript
// imports/schemas/transaction.schema.ts
import { z } from 'zod';

export const TransactionImportSchema = z.object({
  transactionDate: z.string().transform((s) => new Date(s)),
  type: z.enum(['sale', 'purchase', 'refund', 'adjustment']),
  direction: z.enum(['incoming', 'outgoing']),
  description: z.string().min(1).max(500),
  counterpartyName: z.string().optional(),
  counterpartyVatId: z.string().optional(),
  currencyCode: z.string().length(3),
  netAmount: z.coerce.number(),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  vatAmount: z.coerce.number().min(0).optional(),
  grossAmount: z.coerce.number(),
  invoiceNumber: z.string().optional(),
  reference: z.string().optional(),
});

export type TransactionImportRow = z.infer<typeof TransactionImportSchema>;
```

## 6. Export Pipeline

### 6.1 Export Service

```typescript
// common/services/export.service.ts
@Injectable()
export class ExportService {
  constructor(
    private readonly queueService: QueueService,
    private readonly storageService: StorageService,
  ) {}

  async createExport(orgId: string, params: ExportParams): Promise<Report> {
    const report = await this.prisma.report.create({
      data: {
        organizationId: orgId,
        type: params.type,
        name: params.name,
        format: params.format,
        parameters: params.parameters,
        generatedBy: params.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await this.queueService.addToReports('generate_report', {
      reportId: report.id,
      organizationId: orgId,
      type: params.type,
      format: params.format,
      parameters: params.parameters,
    });

    return report;
  }

  async getDownloadUrl(reportId: string, orgId: string): Promise<string> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, organizationId: orgId },
    });

    if (!report.filePath) throw new NotFoundException('Report not ready');
    if (report.expiresAt < new Date()) throw new GoneException('Report expired');

    return this.storageService.getSignedUrl(report.filePath, 3600);
  }
}
```

### 6.2 Export Processor

```typescript
// queue/processors/report-generation.processor.ts
@Processor('reports')
export class ReportGenerationProcessor {
  constructor(
    private readonly reportService: ReportService,
    private readonly storageService: StorageService,
  ) {}

  @Process('generate_report')
  async handleGenerate(job: Job<GenerateReportJobData>) {
    const { reportId, organizationId, type, format, parameters } = job.data;

    try {
      let buffer: Buffer;
      let contentType: string;

      switch (format) {
        case 'xlsx':
          buffer = await this.generateXlsx(type, organizationId, parameters);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          buffer = await this.generateCsv(type, organizationId, parameters);
          contentType = 'text/csv';
          break;
        case 'pdf':
          buffer = await this.generatePdf(type, organizationId, parameters);
          contentType = 'application/pdf';
          break;
        case 'json':
          buffer = await this.generateJson(type, organizationId, parameters);
          contentType = 'application/json';
          break;
        default:
          throw new UnsupportedFormatException(format);
      }

      const filePath = `reports/${organizationId}/${reportId}.${format}`;
      await this.storageService.upload(filePath, buffer, { contentType });

      await this.reportService.markCompleted(reportId, filePath);
    } catch (error) {
      await this.reportService.markFailed(reportId, error.message);
      throw error;
    }
  }

  private async generateXlsx(type: string, orgId: string, params: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    const data = await this.fetchReportData(type, orgId, params);

    // Add headers
    worksheet.columns = Object.keys(data[0] || {}).map((key) => ({ header: key, key }));

    // Add rows
    worksheet.addRows(data);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async generateCsv(type: string, orgId: string, params: any): Promise<Buffer> {
    const data = await this.fetchReportData(type, orgId, params);
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
      ),
    ].join('\n');
    return Buffer.from(csv);
  }
}
```

## 7. Multi-Sheet Excel Imports

```typescript
// imports/processors/multi-sheet.processor.ts
export class MultiSheetImportProcessor {
  async process(workbook: XLSX.WorkBook, orgId: string): Promise<ImportResult> {
    const sheetConfigs = {
      'Transactions': { schema: TransactionImportSchema, handler: this.importTransactions },
      'VAT Returns': { schema: VatReturnImportSchema, handler: this.importVatReturns },
    };

    const results: ImportResult = { totalRows: 0, successRows: 0, errorRows: 0, errors: [] };

    for (const [sheetName, config] of Object.entries(sheetConfigs)) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rows = XLSX.utils.sheet_to_json(sheet);
      for (let i = 0; i < rows.length; i++) {
        results.totalRows++;
        try {
          const validated = config.schema.parse(rows[i]);
          await config.handler.call(this, validated, orgId);
          results.successRows++;
        } catch (error) {
          results.errorRows++;
          results.errors.push({
            row: i + 1,
            sheet: sheetName,
            field: error.field,
            message: error.message,
            value: rows[i][error.field],
          });
        }
      }
    }

    return results;
  }
}
```

## 8. Column Mapping

Users can map spreadsheet columns to internal fields:

```typescript
// imports/mappers/column-mapper.service.ts
export interface ColumnMapping {
  spreadsheetColumn: string;
  internalField: string;
  transform?: (value: any) => any;
}

@Injectable()
export class ColumnMapperService {
  defaultMappings: ColumnMapping[] = [
    { spreadsheetColumn: 'Date', internalField: 'transactionDate', transform: (v) => new Date(v) },
    { spreadsheetColumn: 'Amount', internalField: 'netAmount', transform: (v) => parseFloat(v) },
    { spreadsheetColumn: 'VAT', internalField: 'vatAmount', transform: (v) => parseFloat(v) },
    { spreadsheetColumn: 'Description', internalField: 'description' },
  ];

  applyMapping(row: any, mappings: ColumnMapping[]): any {
    const mapped: any = {};
    for (const mapping of mappings) {
      const value = row[mapping.spreadsheetColumn];
      mapped[mapping.internalField] = mapping.transform ? mapping.transform(value) : value;
    }
    return mapped;
  }
}
```

## 9. Transaction Import with Deduplication

```typescript
// transactions/services/transaction-import.service.ts
@Injectable()
export class TransactionImportService {
  async importRow(orgId: string, data: TransactionImportRow): Promise<Transaction> {
    const existing = await this.findPotentialDuplicate(orgId, data);

    if (existing) {
      await this.update(existing.id, orgId, data);
      return existing;
    }

    return this.create(orgId, data);
  }

  private async findPotentialDuplicate(orgId: string, data: TransactionImportRow): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: {
        organizationId: orgId,
        transactionDate: data.transactionDate,
        grossAmount: data.grossAmount,
        description: data.description,
        isImportSource: true,
        deletedAt: null,
      },
    });
  }
}
```

## 10. Bulk Actions

```typescript
// common/services/bulk-action.service.ts
export interface BulkActionResult {
  total: number;
  success: number;
  failed: number;
  errors: BulkActionError[];
}

@Injectable()
export class BulkActionService {
  async bulkDelete(ids: string[], orgId: string, userId: string): Promise<BulkActionResult> {
    const result: BulkActionResult = { total: ids.length, success: 0, failed: 0, errors: [] };

    for (const id of ids) {
      try {
        await this.prisma.transaction.update({
          where: { id, organizationId: orgId },
          data: { deletedAt: new Date() },
        });
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({ id, message: error.message });
      }
    }

    await this.auditService.log({
      action: 'transactions.bulk_delete',
      subjectType: 'Transaction',
      subjectId: ids.join(','),
      changes: { before: { count: ids.length }, after: { deleted: result.success } },
    });

    return result;
  }

  async bulkCategorize(ids: string[], orgId: string, categoryId: string): Promise<BulkActionResult> {
    const result = await this.prisma.transaction.updateMany({
      where: { id: { in: ids }, organizationId: orgId },
      data: { categoryId },
    });

    return { total: ids.length, success: result.count, failed: 0, errors: [] };
  }
}
```

## 11. Export Formats

| Format | Use Case | Library |
|--------|----------|---------|
| XLSX | Detailed reports with formatting | ExcelJS |
| CSV | Simple data export | PapaParse |
| PDF | Compliance reports | Puppeteer / PDFKit |
| JSON | API data dumps | Native JSON |

## 12. Download with Signed URLs

```typescript
// storage/storage.service.ts
@Injectable()
export class StorageService {
  constructor(private readonly s3: S3Client) {}

  async upload(path: string, buffer: Buffer, metadata?: any): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: path,
      Body: buffer,
      ContentType: metadata?.contentType,
      ServerSideEncryption: 'AES256',
    }));
    return path;
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    return this.s3.getSignedUrl(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: path }),
      { expiresIn },
    );
  }

  async download(path: string): Promise<Buffer> {
    const response = await this.s3.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: path,
    }));
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
```
