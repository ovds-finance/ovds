# 55 — Report Builder and Export Engine

## 1. Report Architecture

The reporting system supports multiple output formats with scheduled generation.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Report Builder System                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Report    │  │   Report    │  │   Export Formats         │ │
│  │   Types     │  │  Renderers  │  │                         │ │
│  │             │  │             │  │ - PDF (Puppeteer)       │ │
│  │ - VAT Summ  │  │ - Table     │  │ - Excel (ExcelJS)       │ │
│  │ - Audit     │  │ - Chart     │  │ - CSV (PapaParse)       │ │
│  │ - Trans     │  │ - PDF       │  │ - JSON (native)         │ │
│  │ - Custom    │  │ - Excel     │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Report Service    │                        │
│                   │   (Queue + Cache)   │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Report Model

```prisma
model Report {
  id            String   @id @default(cuid())
  organizationId String
  type          String   // "vat_summary", "audit_trail", "transaction_export", "compliance"
  name          String
  format        String   // "pdf", "xlsx", "csv", "json"
  parameters    Json?    // { "periodStart": "...", "periodEnd": "...", "jurisdictionId": "..." }
  filePath      String?
  mimeType      String?
  size          Int?
  generatedBy   String
  status        String   @default("pending") // pending, processing, completed, failed
  errorMessage  String?
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([organizationId, type])
  @@index([status])
  @@index([createdAt])
}
```

## 3. Report Types

| Type | Purpose | Parameters |
|------|---------|------------|
| `vat_summary` | VAT return summary | periodStart, periodEnd, jurisdictionId |
| `audit_trail` | Compliance audit log | from, to, userId |
| `transaction_export` | Transaction export | dateFrom, dateTo, type, format |
| `compliance` | Compliance report | from, to, regulation |
| `reconciliation` | Reconciliation report | reconciliationId |
| `custom` | User-defined report | custom parameters |

## 4. Report Renderers

```typescript
// reports/renderers/report-renderer.interface.ts
export interface ReportRenderer {
  readonly format: string;
  readonly mimeType: string;
  readonly extension: string;

  render(data: ReportData, options: RenderOptions): Promise<Buffer>;
}

// reports/renderers/pdf.renderer.ts
@Injectable()
export class PdfRenderer implements ReportRenderer {
  readonly format = 'pdf';
  readonly mimeType = 'application/pdf';
  readonly extension = 'pdf';

  async render(data: ReportData, options: RenderOptions): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const html = await this.renderHtml(data, options);
    await page.setContent(html);
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });

    await browser.close();
    return Buffer.from(pdf);
  }
}

// reports/renderers/excel.renderer.ts
@Injectable()
export class ExcelRenderer implements ReportRenderer {
  readonly format = 'xlsx';
  readonly mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  readonly extension = 'xlsx';

  async render(data: ReportData, options: RenderOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(data.title);

    // Add headers
    if (data.headers) {
      worksheet.columns = data.headers.map((h) => ({ header: h.label, key: h.key, width: h.width || 20 }));
    }

    // Add rows
    if (data.rows) {
      worksheet.addRows(data.rows);
    }

    // Apply styling
    this.applyStyling(worksheet, data);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
```

## 5. Report Service

```typescript
// reports/report.service.ts
@Injectable()
export class ReportService {
  constructor(private readonly queueService: QueueService) {}

  async generate(orgId: string, params: GenerateReportParams): Promise<Report> {
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

## 6. Report Data Builders

```typescript
// reports/builders/vat-summary.builder.ts
@Injectable()
export class VatSummaryReportBuilder implements ReportBuilder {
  async build(orgId: string, parameters: any): Promise<ReportData> {
    const { periodStart, periodEnd, jurisdictionId } = parameters;

    const returns = await this.vatReturnService.findMany(orgId, {
      periodFrom: periodStart,
      periodTo: periodEnd,
      jurisdictionId,
    });

    const rows = returns.map((ret) => ({
      id: ret.id,
      periodStart: ret.periodStart,
      periodEnd: ret.periodEnd,
      status: ret.status,
      totalSales: ret.totalSales,
      totalPurchases: ret.totalPurchases,
      totalVatDue: ret.totalVatDue,
      totalVatReclaim: ret.totalVatReclaim,
      netVatDue: ret.netVatDue,
      currencyCode: ret.currencyCode,
    }));

    return {
      title: 'VAT Summary Report',
      subtitle: `Period: ${periodStart} to ${periodEnd}`,
      headers: [
        { key: 'id', label: 'Return ID' },
        { key: 'periodStart', label: 'Period Start' },
        { key: 'periodEnd', label: 'Period End' },
        { key: 'status', label: 'Status' },
        { key: 'totalSales', label: 'Total Sales', width: 15 },
        { key: 'totalPurchases', label: 'Total Purchases', width: 15 },
        { key: 'totalVatDue', label: 'VAT Due', width: 15 },
        { key: 'totalVatReclaim', label: 'VAT Reclaim', width: 15 },
        { key: 'netVatDue', label: 'Net VAT Due', width: 15 },
      ],
      rows,
      summary: {
        totalSales: rows.reduce((sum, r) => sum + (r.totalSales || 0), 0),
        totalVatDue: rows.reduce((sum, r) => sum + (r.totalVatDue || 0), 0),
      },
    };
  }
}
```

## 7. Scheduled Reports

```typescript
// reports/scheduled-reports.service.ts
@Injectable()
export class ScheduledReportsService {
  @Cron('0 6 * * 1') // Every Monday at 6 AM
  async generateWeeklyVatReports() {
    const scheduled = await this.prisma.scheduledReport.findMany({
      where: { type: 'vat_summary', frequency: 'weekly', isActive: true },
    });

    for (const scheduledReport of scheduled) {
      await this.queueService.addToReports('scheduled_report', {
        scheduledReportId: scheduledReport.id,
        organizationId: scheduledReport.organizationId,
        type: scheduledReport.type,
        format: scheduledReport.format,
        parameters: this.buildParameters(scheduledReport),
      });
    }
  }

  @Cron('0 6 1 * *') // First day of month at 6 AM
  async generateMonthlyVatReports() {
    const scheduled = await this.prisma.scheduledReport.findMany({
      where: { type: 'vat_summary', frequency: 'monthly', isActive: true },
    });

    for (const scheduledReport of scheduled) {
      await this.queueService.addToReports('scheduled_report', {
        scheduledReportId: scheduledReport.id,
        organizationId: scheduledReport.organizationId,
        type: scheduledReport.type,
        format: scheduledReport.format,
        parameters: this.buildMonthlyParameters(),
      });
    }
  }
}
```

## 8. Report Export Service

```typescript
// reports/export.service.ts
@Injectable()
export class ReportExportService {
  async exportTransactions(orgId: string, params: ExportParams): Promise<Buffer> {
    const transactions = await this.transactionService.findMany(orgId, params);

    switch (params.format) {
      case 'csv':
        return this.exportCsv(transactions);
      case 'xlsx':
        return this.exportXlsx(transactions);
      case 'json':
        return this.exportJson(transactions);
      default:
        throw new UnsupportedFormatException(params.format);
    }
  }

  private exportCsv(transactions: Transaction[]): Buffer {
    const headers = ['Date', 'Type', 'Description', 'Net Amount', 'VAT Rate', 'VAT Amount', 'Gross Amount'];
    const rows = transactions.map((t) => [
      t.transactionDate,
      t.type,
      t.description,
      t.netAmount,
      t.vatRate,
      t.vatAmount,
      t.grossAmount,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    return Buffer.from(csv);
  }

  private exportXlsx(transactions: Transaction[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    worksheet.columns = [
      { header: 'Date', key: 'transactionDate', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Net Amount', key: 'netAmount', width: 15 },
      { header: 'VAT Rate', key: 'vatRate', width: 10 },
      { header: 'VAT Amount', key: 'vatAmount', width: 15 },
      { header: 'Gross Amount', key: 'grossAmount', width: 15 },
    ];

    worksheet.addRows(transactions);
    return workbook.xlsx.writeBuffer();
  }
}
```

## 9. Report Scheduler

```typescript
// reports/scheduled-report.model.ts
export interface ScheduledReport {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  format: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  parameters: any;
  recipients: string[]; // User IDs
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
}
```

## 10. Report Dashboard

```typescript
// apps/web/src/features/reports/components/report-dashboard.tsx
export function ReportDashboard() {
  const { data: reports, isLoading } = useReports();
  const [filter, setFilter] = useState({ type: 'all', format: 'all' });

  const filteredReports = reports?.filter((report) => {
    if (filter.type !== 'all' && report.type !== filter.type) return false;
    if (filter.format !== 'all' && report.format !== filter.format) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button>Generate Report</Button>
      </div>

      <div className="flex gap-4">
        <Select value={filter.type} onValueChange={(type) => setFilter({ ...filter, type })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="vat_summary">VAT Summary</SelectItem>
            <SelectItem value="audit_trail">Audit Trail</SelectItem>
            <SelectItem value="transaction_export">Transactions</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter.format} onValueChange={(format) => setFilter({ ...filter, format })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="xlsx">Excel</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable data={filteredReports || []} columns={reportColumns}>
        <TableBody>
          {filteredReports?.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{report.name}</TableCell>
              <TableCell>{report.type}</TableCell>
              <TableCell>{report.format.toUpperCase()}</TableCell>
              <TableCell>{report.status}</TableCell>
              <TableCell>{formatDate(report.createdAt)}</TableCell>
              <TableCell>
                {report.filePath && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={report.filePath} target="_blank">Download</Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}
```
