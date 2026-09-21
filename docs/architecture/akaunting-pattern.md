# Ovds SaaS — Application Architecture

> **Status:** Implemented  
> **Stack:** NestJS 11 · React 19 · Prisma 7 · Tailwind CSS · REST API · @ovds/core

---

## 1. Overview

Ovds SaaS operates as a **Modular Monolith** — a single deployable process that internally enforces strong domain boundaries. The core engine handles baseline financial tracking (Currencies, Accounts, Companies) while every business feature — Invoices, Bills, Reconciliation, Banking Feeds — is a **fully containerised module** that registers itself dynamically into the system pipelines.

Ovds SaaS avoids structural mess by treating core logic as an isolated **"Black Box" engine** while delegating frontend rendering to pure, reusable modules.

```
┌────────────────────────────────────────────────────────┐
│                   App Store / Modules                  │
│   ┌─────────────────────┐       ┌───────────────────┐  │
│   │   Invoices Module   │       │ Banking & Feeds   │  │
│   └──────────┬──────────┘       └─────────┬─────────┘  │
└──────────────┼────────────────────────────┼────────────┘
               │ (Dispatches Events)        │
┌──────────────▼────────────────────────────▼────────────┐
│                 Ovds SaaS Core Engine                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────┐  │
│  │  Tax / Currency  │ │ Transactions Log │ │ Event  │  │
│  │  Calculators     │ │ & Ledger Engines │ │ Bus    │  │
│  └──────────────────┘ └──────────────────┘ └────────┘  │
└──────────────────────────────┬─────────────────────────┘
                               ▼
                   Central Database (Multi-Tenant)
```

---

## 2. Structural Software Architecture (The Modular Monolith)

### 2.1 Core Logic Design Patterns

#### Domain Event-Driven Architecture

Highly critical for accounting integrity. Action steps do not mutate cross-domain metrics directly. For example, finalising an invoice dispatches an `InvoiceSent` event. A separate `LedgerObserver` listens to this event to record pending revenues in transactions **without tightly coupling invoice management code to bank accounts**.

```
SalesService.send(id)
  │
  ├─► emitSent(invoice)
  │     │
  │     ├─► @ovds/core EventBus.dispatch(INVOICE_EVENTS.SENT)
  │     │         │
  │     │         └─► LedgerObserver.onInvoiceSent()
  │     │                   DR Accounts Receivable (1200) = totalAmount
  │     │                   CR Revenue            (4000) = subtotal
  │     │                   CR VAT Payable        (2210) = vatAmount
  │     │                   CR DRRF Payable       (2220) = drrfAmount
  │     │
  │     └─► NestJS EventEmitter2.emit(INVOICE_EVENTS.SENT)
  │               └─► NotificationListener → BullMQ → email/SMS/WhatsApp
  │
  └─► return updated invoice
```

#### Pipeline Interceptors

Custom invoice layout designs are injected using **global runtime lifecycle events**. Third-party modules tap into the formatting engine right before execution to overwrite template paths or append fields safely — without modifying core engine code.

```typescript
// Third-party module hook — registered in module.boot()
PipelineInterceptor.register<InvoiceRenderContext>('invoice.render', {
  id: 'my-module.custom-template',
  priority: 20,                  // after core (0–9), before default (100)
  transform: async (ctx) => ({
    ...ctx,
    templatePath: '/templates/my-custom-invoice.hbs',
    extraFields: [
      ...ctx.extraFields,
      { key: 'po_number', label: 'PO Number', value: ctx.invoice.poNumber },
    ],
  }),
});
```

Built-in core hooks (priority 0–9):

| Hook id | Stage | Effect |
|---|---|---|
| `core.invoice.eims-status-field` | `invoice.render` | Appends EIMS IRN + status badge to extraFields |
| `core.invoice.drrf-disclosure` | `invoice.render` | Appends DRRF levy disclosure (1% — Reg. 570/2025) |
| `core.invoice.eims-buyer-tin-guard` | `invoice.eims` | Blocks B2B EIMS submission when buyer TIN is missing |

#### Multi-Currency Multi-Tenant Logic

All core math calculations run through an isolated **Exchange Transformer**. When an invoice is created in a vendor's foreign currency, the state manager retains **both the base transaction value and the calculated converted local currency simultaneously**.

```typescript
interface DualAmount {
  foreign: number;          // original transaction amount (e.g. 1,250 USD)
  foreignCurrency: string;  // "USD"
  rate: number;             // 1 USD = 57.40 ETB at rateAt
  base: number;             // 71,750 ETB (foreign × rate, rounded to 2dp)
  baseCurrency: string;     // tenant's functional currency — "ETB"
  rateAt: Date;             // timestamp of rate capture (essential for audit)
}
```

---

### 2.2 Module Lifecycle

Every feature module extends the `ModuleApp` abstract class from `@ovds/core` and follows a three-phase lifecycle orchestrated by `ModuleBootstrap`:

```
ModuleBootstrap.registerModule(name, factory)
       │
       ▼  Phase 1: register(eventBus)
       │   → Subscribe to cross-domain events
       │   → Declare emitsTo / receivesFrom data flow graph
       │
       ▼  Phase 2: boot(container)
       │   → Resolve runtime services (Prisma, settings, config)
       │   → Register PipelineInterceptor hooks
       │
       ▼  Phase 3: health()
           → { status: 'healthy' | 'degraded' | 'unhealthy', checkedAt }
           → Unhealthy modules are logged but never crash the process
```

**Bootstrap wiring** — `apps/backend/src/core/module-bootstrap.service.ts`:

```typescript
const bootstrap = ModuleBootstrap.getInstance();
bootstrap.registerAll([
  { name: 'invoices', factory: createInvoicesModule, enabled: true },
  { name: 'banking',  factory: createBankingModule,  enabled: true },
]);
await bootstrap.bootstrap({ eventBus: EventBus.getInstance() });
```

---

### 2.3 Registered Domain Events

**File:** `packages/shared/src/invoice-events.ts` (isomorphic — used by FE + BE)

| Constant | Event name | Trigger |
|---|---|---|
| `INVOICE_EVENTS.CREATED` | `invoice.invoice.created` | Invoice row persisted (any status) |
| `INVOICE_EVENTS.SENT` | `invoice.invoice.sent` | DRAFT/OVERDUE → PENDING |
| `INVOICE_EVENTS.PAYMENT_RECEIVED` | `invoice.payment.received` | InvoicePayment record saved |
| `INVOICE_EVENTS.VOIDED` | `invoice.invoice.voided` | Invoice cancelled/voided |
| `INVOICE_EVENTS.UPDATED` | `invoice.invoice.updated` | Non-DRAFT fields changed |
| `INVOICE_EVENTS.OVERDUE` | `invoice.invoice.overdue` | Scheduler: dueDate < now() |

Every event carries an `InvoiceSnapshot` that includes both the foreign-currency values **and** the base-currency equivalent — no observer ever needs to re-query the database.

---

### 2.4 LedgerObserver — The Black Box GL Engine

**File:** `packages/domains/accounting/src/lib/ledger-observer.ts`

Framework-agnostic. Injected with a `LedgerPersistence` interface; the NestJS layer provides a Prisma implementation. GL posting is silently skipped for fresh tenants whose Chart of Accounts hasn't been configured yet.

| Event | Journal entry posted |
|---|---|
| `INVOICE_EVENTS.SENT` | DR AR 1200 / CR Revenue 4000 / CR VAT Payable 2210 / CR DRRF Payable 2220 |
| `INVOICE_EVENTS.PAYMENT_RECEIVED` | DR Cash 1100 / CR AR 1200 (base-currency amount) |
| `INVOICE_EVENTS.VOIDED` | Full reversal: DR Revenue / DR VAT / DR DRRF / CR AR |

---

## 3. Modern Technical Stack Matrix

| Architectural Layer | Core Technology | Implementation Purpose |
|---|---|---|
| Backend Framework | **NestJS** (Modular Monolith) | Multi-tenant databases, ledger queries, RESTful APIs, backend business rules |
| Frontend Runtime | **React 19** (SPA) | View components, inline calculations (live totals), interactive sub-modals |
| Styling Engine | **Tailwind CSS** | High-density grid layouts, responsive constraints, dark mode, RTL rules |
| State Synchronizer | **REST API Connectors** | Connects backend domain models with frontend state controllers, minimal boilerplate |
| ORM / Database | **Prisma 7 + MariaDB** | Multi-tenant schema, type-safe queries, double-entry ledger models |
| Event Bus | **@ovds/core EventBus + NestJS EventEmitter2** | Domain event dispatch — decoupled cross-module communication |

---

## 4. UI System & Layout Architecture (Grid-over-Card)

Ovds SaaS shifted from distracting, multi-coloured card arrays to an intentional **Grid-over-Card** layout system. This structural philosophy streamlines high-density accounting workflows and reduces cognitive load for users viewing financial records across multi-device screens.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Sidebar (Nav)  │  Top Header (Context Switcher: Company, Currency)   │
├─────────────────┴──────────────────────────────────────────────────────┤
│  Grid Content Container                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Actions Row: [Filter Status] [Search]            [+ New Invoice] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Metrics Overview Grid (Receivables | Payables | Cash Flow)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ High-Density Data Grid (Invoices List)                           │  │
│  │ ── Hover Action State Activated ──────────────────────────────── │  │
│  │ [Inv-001] [Client] [Amount] [Status] -> (Reveals: View|Pay|Edit) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Key Interface Patterns

#### Hover-to-Reveal Triggers
To preserve clean workspace real estate, line item adjustments, transaction context dots, and sub-actions remain hidden until a cursor focus event registers over that specific data grid entry. Keyboard focus also reveals actions for accessibility.

```
Row at rest:   [INV-001] [Acme Corp] [ETB 5,250] [PENDING]    ··················
Row on hover:  [INV-001] [Acme Corp] [ETB 5,250] [PENDING]    [View] [Pay] [Edit]
```

Implementation in `AkDataGrid`: `opacity-0 group-hover:opacity-100` with local `isHovered` state driven by `onMouseEnter`/`onFocus`.

#### Context-Aware Modals (Inline Creation)
Relies on isolated child component modules. If a customer or tax rate does not exist while drafting an invoice, a **nested sub-modal handles entry creation without force-refreshing or interrupting the active parent transaction state machine**.

```tsx
// NewCustomerModal opens inline — parent invoice state is never reset
{showNewCustomerModal && (
  <NewCustomerModal
    onClose={() => setShowNewCustomerModal(false)}
    onCreated={(customer) => {
      setCustomers(prev => [...prev, customer]);   // in-place append
      setForm(prev => ({ ...prev, customerId: customer.id }));  // auto-select
      setShowNewCustomerModal(false);               // no page refresh
    }}
  />
)}
```

#### Dynamic Column Matrix
Rather than hardcoding table parameters, layouts pull an array schema configuration. Item Name, Description, Quantity, and Price **visibility toggles dynamically rewrite the DOM grid dimensions on the fly**:

```typescript
const DEFAULT_COLUMNS: InvoiceColumnConfig[] = [
  { key: 'description', visible: true,  widthCls: 'flex-1 min-w-0' },
  { key: 'quantity',    visible: true,  widthCls: 'w-20' },
  { key: 'price',       visible: true,  widthCls: 'w-32' },
  { key: 'discount',    visible: false, widthCls: 'w-28' }, // hidden by default
  { key: 'tax',         visible: true,  widthCls: 'w-24' },
  { key: 'total',       visible: true,  widthCls: 'w-32' },
];
```

Toggling `visible` causes the header row and all data rows to rerender with updated flex widths — the DOM grid dimensions rewrite automatically.

---

## 5. Frontend Component Architecture (React + Tailwind)

### InvoiceFormAk — State-Driven Component

**File:** `apps/frontend/src/components/invoice/InvoiceFormAk.tsx`

The component is **pure**: it only reflects state and dispatches actions. No direct API calls. Parent owns `onSave` and `onSaveAndSend`.

```tsx
// Pure state reflection — parent owns submission
<InvoiceFormAk
  initialData={invoice}
  customers={customers}
  items={catalogItems}
  onSave={(data) => saveDraft(data)}
  onSaveAndSend={(data) => issueInvoice(data)}
  onCancel={() => navigate('/sales/invoices')}
  currencies={['ETB', 'USD', 'EUR']}
  baseCurrency="ETB"
/>
```

**Live totals formula chain** (pure `useMemo` — equivalent to Vue computed properties):
```
subtotalRaw  = Σ (price × qty − lineDiscount)
invoiceDisc  = subtotalRaw × discountValue  [if PERCENT] | discountValue [if FIXED]
subtotal     = subtotalRaw − invoiceDisc
vatAmount    = Σ (lineNet × taxRate)         [taxable lines only]
drrfAmount   = subtotal × 0.01              [Regulation No. 570/2025 — 1%]
grandTotal   = subtotal + vatAmount + drrfAmount
baseTotal    = grandTotal × currencyRate     [foreign-currency invoices only]
```

### GridShell — Layout Shell

**File:** `packages/ui/src/components/GridShell.tsx`

```tsx
<GridShell
  header={{
    title: 'Invoices',
    icon: <FileText size={16} />,
    contextSlot: <CompanyPicker />,
    currencySlot: 'ETB',
  }}
  actions={{
    filterSlot: <>
      <GridShellTab label="All"     count={total}        active={tab === 'ALL'}     onClick={() => setTab('ALL')} />
      <GridShellTab label="Pending" count={pendingCount} active={tab === 'PENDING'} onClick={() => setTab('PENDING')} />
      <GridShellTab label="Overdue" count={overdueCount} active={tab === 'OVERDUE'} onClick={() => setTab('OVERDUE')} />
    </>,
    searchSlot: <SearchInput value={q} onChange={setQ} />,
    primaryAction: <Button onClick={onNew}><Plus size={14} /> New Invoice</Button>,
  }}
  metrics={
    <MetricsGrid cols={3}>
      <ReceivablesMetric totalOutstanding={ar} collected={collected} totalInvoiced={invoiced} />
      <PayablesMetric    totalOutstanding={ap} paid={paid} totalBilled={billed} />
      <CashFlowMetric    netCashFlow={net} inflows={inflows} outflows={outflows} />
    </MetricsGrid>
  }
>
  <AkDataGrid
    columns={columns}
    rows={invoices}
    rowActions={(inv) => [
      { label: 'View', icon: <Eye size={13} />,         onClick: () => onView(inv) },
      { label: 'Pay',  icon: <CheckCircle size={13} />, onClick: () => onPay(inv),  hidden: inv.status !== 'PENDING' },
      { label: 'Edit', icon: <Edit size={13} />,        onClick: () => onEdit(inv) },
    ]}
    onRowClick={onView}
    selectable
    selectedKeys={selected}
    onSelectionChange={setSelected}
  />
</GridShell>
```

---

## 6. Complete File Map

### Backend (`apps/backend/src/`)
```
core/
├── core.module.ts                    ← provides ExchangeTransformerService,
│                                       ModuleBootstrapService, PipelineInterceptorService
├── exchange-transformer.service.ts   ← rate resolution from FxRate table + DI wrapper
├── invoices-module.local.ts          ← NestJS-compilable InvoicesModule factory
├── module-bootstrap.service.ts       ← wires ModuleBootstrap singleton at onModuleInit
└── pipeline-interceptor.service.ts   ← registers 3 built-in core hooks at onModuleInit

ledger/
├── ledger.module.ts                  ← provides LedgerObserverService
└── ledger-observer.service.ts        ← Prisma persistence adapter + EventBus mount

sales/
├── sales.module.ts                   ← provides InvoiceDomainEventService
├── sales.service.ts                  ← emit calls at each lifecycle step
└── invoice-domain-event.service.ts   ← dual-bus dispatch (EventBus + EventEmitter2)
```

### Packages
```
packages/
├── core/src/kernel/
│   └── pipeline-interceptor.ts       ← singleton hook registry (priority-ordered, __stop support)
├── domains/
│   ├── accounting/src/lib/
│   │   └── ledger-observer.ts        ← framework-agnostic GL observer
│   └── invoice/src/events/
│       └── invoice.events.ts         ← INVOICE_EVENTS + typed payloads + factory helpers
├── modules/sales/src/domain/
│   └── invoices-module.ts            ← canonical ModuleApp: register/boot/routes/menus/settings/permissions
├── shared/src/
│   ├── exchange-transformer.ts       ← pure static multi-currency math engine (DualAmount)
│   └── invoice-events.ts             ← isomorphic event constants + InvoiceSnapshot (shared FE+BE)
└── ui/src/components/
    ├── GridShell.tsx                 ← layout shell (header, actions, metrics, content)
    ├── MetricsGrid.tsx               ← ReceivablesMetric, PayablesMetric, CashFlowMetric
    └── AkDataGrid.tsx                ← high-density grid with hover-to-reveal row actions
```

### Frontend (`apps/frontend/src/`)
```
components/invoice/
└── InvoiceFormAk.tsx                 ← dynamic grid form + context sub-modal + live totals
```

---

## 7. Adding a New Module

To add a pluggable feature (e.g. `BankingModule`):

1. **Define domain events** in `packages/domains/banking/src/events/banking.events.ts`
2. **Extend ModuleApp** in `packages/modules/banking/src/domain/banking-module.ts`
3. **Register the factory** in `apps/backend/src/core/module-bootstrap.service.ts`:
   ```typescript
   bootstrap.registerAll([
     { name: 'invoices', factory: createInvoicesModule },
     { name: 'banking',  factory: createBankingModule },  // ← add here
   ]);
   ```
4. **Add an observer** (e.g. `ReconciliationObserver`) in `packages/domains/banking/src/lib/`
5. **Wire a NestJS adapter** in `apps/backend/src/banking/` and provide it in `BankingModule`
6. **Register pipeline hooks** if the module needs to modify document rendering

The core engine is never modified. That is the complete extension contract.

---

## 8. Design Decisions

| Decision | Rationale |
|---|---|
| **Dual-bus dispatch** (EventBus + EventEmitter2) | EventBus serves framework-agnostic observers; EventEmitter2 serves `@OnEvent()` handlers and the BullMQ bridge. Both run synchronously in-process. |
| **LedgerObserver reacts to SENT, not CREATED** | DRAFT invoices are work-in-progress; GL entries should only post when issued. Matches `Invoice::send()` semantics. |
| **ExchangeTransformer in @ovds/shared** | Pure math available to both React frontend (live base-equivalent in InvoiceFormAk) and NestJS backend without code duplication. |
| **PipelineInterceptor as a singleton** | Hooks registered once at startup — no per-request overhead. `__stop` flag enables B2B TIN validation without exceptions. |
| **InvoiceFormAk dispatches no API calls** | Keeps the component pure and testable in isolation. Parent page owns submission — mirrors the spec's Vue architecture pattern exactly. |
| **AkDataGrid is fully generic** | `AkDataGrid<TRow>` works for invoices, bills, transactions — any typed record set. Column schema as data (not JSX) enables server-driven column config. |
| **invoices-module.local.ts** | packages/modules/sales uses `noEmit: true` so no dist is produced. This local file reimplements the factory using only `@ovds/core` and `@ovds/shared` — both available to the backend's node16 resolver. |
