# 54 — Widget and Dashboard System

## 1. Dashboard Architecture

The dashboard system provides customizable, role-based dashboards with widgets.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard System                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Dashboard  │  │   Widget    │  │   Widget Registry       │ │
│  │  Layout     │  │   Types     │  │   (Factory Pattern)     │ │
│  │             │  │             │  │                         │ │
│  │ - Grid      │  │ - Stat      │  │ - AccountBalance        │ │
│  │ - Sidebar   │  │ - Chart     │  │ - CashFlow              │ │
│  │ - Filters   │  │ - Table     │  │ - VatSummary            │ │
│  │             │  │ - List      │  │ - Receivables           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Dashboard Service │                        │
│                   │   (CRUD + Layout)   │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Dashboard Model

```prisma
model Dashboard {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String
  name            String
  slug            String
  layout          Json     // { "columns": 12, "widgets": [...] }
  settings        Json?    // { "filterDefaults": {...} }
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  widgets         Widget[]
  users           User[]   @relation("UserDashboards")

  @@unique([organizationId, userId, slug])
  @@index([organizationId, userId])
}

model Widget {
  id              String   @id @default(cuid())
  organizationId  String
  dashboardId     String
  type            String   // "stat", "chart", "table", "list"
  class           String   // Widget class name
  name            String
  settings        Json     // Widget-specific settings
  sort            Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  dashboard       Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)

  @@index([dashboardId])
}
```

## 3. Widget Types

| Type | Purpose | Example |
|------|---------|---------|
| `stat` | Single value display | Account balance, VAT due |
| `chart` | Visual representation | Cash flow, expenses by category |
| `table` | Tabular data | Recent transactions, upcoming deadlines |
| `list` | Simple list | Recent invoices, top customers |

## 4. Widget Registry

```typescript
// widgets/widget-registry.service.ts
@Injectable()
export class WidgetRegistryService {
  private readonly widgets = new Map<string, WidgetFactory>();

  register(type: string, factory: WidgetFactory): void {
    this.widgets.set(type, factory);
  }

  resolve(type: string): WidgetFactory {
    const factory = this.widgets.get(type);
    if (!factory) throw new WidgetNotFoundException(type);
    return factory;
  }

  list(): WidgetType[] {
    return Array.from(this.widgets.values()).map((factory) => ({
      type: factory.type,
      name: factory.name,
      description: factory.description,
      category: factory.category,
      defaultSettings: factory.defaultSettings,
    }));
  }
}

export interface WidgetFactory {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'finance' | 'vat' | 'transactions' | 'reports';
  readonly defaultSettings: Record<string, any>;

  create(data: WidgetData): WidgetInstance;
  update(widget: WidgetInstance, settings: Record<string, any>): WidgetInstance;
  render(widget: WidgetInstance): Promise<WidgetRenderResult>;
}
```

## 5. Built-in Widgets

### 5.1 Account Balance Widget

```typescript
// widgets/account-balance.widget.ts
@Injectable()
export class AccountBalanceWidget implements WidgetFactory {
  readonly type = 'account_balance';
  readonly name = 'Account Balance';
  readonly description = 'Shows current account balance';
  readonly category = 'finance';
  readonly defaultSettings = {
    accountId: null,
    currency: 'EUR',
    showChange: true,
  };

  async render(widget: WidgetInstance): Promise<WidgetRenderResult> {
    const accountId = widget.settings.accountId;
    const account = await this.accountService.findById(accountId);

    return {
      type: 'stat',
      data: {
        label: account.name,
        value: account.currentBalance,
        currency: account.currencyCode,
        change: await this.getBalanceChange(accountId),
        changePercent: await this.getBalanceChangePercent(accountId),
      },
    };
  }
}
```

### 5.2 VAT Summary Widget

```typescript
// widgets/vat-summary.widget.ts
@Injectable()
export class VatSummaryWidget implements WidgetFactory {
  readonly type = 'vat_summary';
  readonly name = 'VAT Summary';
  readonly description = 'Shows VAT summary for the period';
  readonly category = 'vat';
  readonly defaultSettings = {
    period: 'current_quarter',
    jurisdictionId: null,
  };

  async render(widget: WidgetInstance): Promise<WidgetRenderResult> {
    const { period, jurisdictionId } = widget.settings;
    const dates = this.getPeriodDates(period);

    const summary = await this.vatReturnService.getSummary(widget.organizationId, dates, jurisdictionId);

    return {
      type: 'stat',
      data: {
        label: 'VAT Due',
        value: summary.netVatDue,
        currency: summary.currencyCode,
        breakdown: {
          totalSales: summary.totalSales,
          totalPurchases: summary.totalPurchases,
          totalVatDue: summary.totalVatDue,
          totalVatReclaim: summary.totalVatReclaim,
        },
      },
    };
  }
}
```

### 5.3 Cash Flow Chart Widget

```typescript
// widgets/cash-flow.widget.ts
@Injectable()
export class CashFlowWidget implements WidgetFactory {
  readonly type = 'cash_flow';
  readonly name = 'Cash Flow';
  readonly description = 'Shows cash flow over time';
  readonly category = 'finance';
  readonly defaultSettings = {
    period: 'last_6_months',
    chartType: 'line',
  };

  async render(widget: WidgetInstance): Promise<WidgetRenderResult> {
    const { period, chartType } = widget.settings;
    const dates = this.getPeriodDates(period);

    const data = await this.transactionService.getCashFlow(widget.organizationId, dates);

    return {
      type: 'chart',
      data: {
        chartType,
        labels: data.labels,
        datasets: [
          { label: 'Incoming', data: data.incoming, borderColor: '#22c55e' },
          { label: 'Outgoing', data: data.outgoing, borderColor: '#ef4444' },
        ],
      },
    };
  }
}
```

## 6. Dashboard Layout

```typescript
// dashboards/dashboard-layout.interface.ts
export interface DashboardLayout {
  columns: number; // 12-column grid
  widgets: WidgetPosition[];
}

export interface WidgetPosition {
  id: string;
  x: number;      // Column start (0-11)
  y: number;      // Row start
  width: number;  // Columns (1-12)
  height: number; // Rows
  minWidth?: number;
  minHeight?: number;
}
```

## 7. Dashboard Service

```typescript
// dashboards/dashboard.service.ts
@Injectable()
export class DashboardService {
  async create(orgId: string, userId: string, dto: CreateDashboardDto): Promise<Dashboard> {
    return this.prisma.dashboard.create({
      data: {
        organizationId: orgId,
        userId,
        name: dto.name,
        slug: await this.generateSlug(dto.name, orgId, userId),
        layout: dto.layout,
        settings: dto.settings,
      },
    });
  }

  async getDefault(orgId: string, userId: string): Promise<Dashboard | null> {
    return this.prisma.dashboard.findFirst({
      where: {
        organizationId: orgId,
        userId,
        isDefault: true,
      },
    });
  }

  async getBySlug(orgId: string, userId: string, slug: string): Promise<Dashboard | null> {
    return this.prisma.dashboard.findFirst({
      where: {
        organizationId: orgId,
        userId,
        slug,
      },
      include: {
        widgets: { orderBy: { sort: 'asc' } },
      },
    });
  }

  async renderDashboard(dashboardId: string): Promise<DashboardRenderResult> {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: { widgets: true },
    });

    const widgetResults = await Promise.all(
      dashboard.widgets.map((widget) => this.renderWidget(widget)),
    );

    return {
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        layout: dashboard.layout,
      },
      widgets: widgetResults,
    };
  }

  private async renderWidget(widget: Widget): Promise<WidgetRenderResult> {
    const factory = this.widgetRegistry.resolve(widget.type);
    const instance = factory.create({
      organizationId: widget.organizationId,
      dashboardId: widget.dashboardId,
      settings: widget.settings,
    });

    return factory.render(instance);
  }
}
```

## 8. Dashboard React Component

```typescript
// apps/web/src/features/dashboard/components/dashboard.tsx
import { useDashboard } from '../hooks/use-dashboard';
import { WidgetRenderer } from './widget-renderer';
import { Grid } from '@/components/ui/grid';

interface DashboardProps {
  dashboardId: string;
}

export function Dashboard({ dashboardId }: DashboardProps) {
  const { data: dashboard, isLoading } = useDashboard(dashboardId);

  if (isLoading) return <DashboardSkeleton />;
  if (!dashboard) return <EmptyState message="Dashboard not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dashboard.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit Layout</Button>
          <Button size="sm">Add Widget</Button>
        </div>
      </div>

      <Grid layout={dashboard.layout} className="min-h-[400px]">
        {dashboard.widgets.map((widget) => (
          <GridItem key={widget.id} x={widget.x} y={widget.y} width={widget.width} height={widget.height}>
            <WidgetRenderer widget={widget} />
          </GridItem>
        ))}
      </Grid>
    </div>
  );
}
```

## 9. Widget Renderer

```typescript
// apps/web/src/features/dashboard/components/widget-renderer.tsx
import { StatWidget } from './widgets/stat-widget';
import { ChartWidget } from './widgets/chart-widget';
import { TableWidget } from './widgets/table-widget';
import { ListWidget } from './widgets/list-widget';

const WIDGET_COMPONENTS = {
  stat: StatWidget,
  chart: ChartWidget,
  table: TableWidget,
  list: ListWidget,
};

interface WidgetRendererProps {
  widget: Widget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  const Component = WIDGET_COMPONENTS[widget.type];

  if (!Component) {
    return <div className="p-4 border rounded">Unknown widget type: {widget.type}</div>;
  }

  return <Component widget={widget} />;
}
```

## 10. Widget Permissions

```typescript
// widgets/permissions.ts
export const WIDGET_PERMISSIONS: Record<string, string[]> = {
  account_balance: ['accounts.read'],
  cash_flow: ['accounts.read', 'transactions.read'],
  vat_summary: ['vat_returns.read'],
  recent_transactions: ['transactions.read'],
  upcoming_deadlines: ['vat_returns.read'],
  receivables: ['accounts.read'],
  payables: ['accounts.read'],
};
```
