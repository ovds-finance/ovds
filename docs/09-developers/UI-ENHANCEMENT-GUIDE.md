<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# OVDS UI Enhancement Guide — 60-30-10 Color System

## Overview

OVDS implements a clean, responsive UI system optimized for data-dense financial workflows. The 60-30-10 color rule ensures clarity and scannability while maintaining a professional aesthetic.

## 60-30-10 Color System

| Percentage | Purpose | Light Mode | Dark Mode |
|------------|---------|------------|-----------|
| **60% Dominant (Background)** | Primary surfaces, page backgrounds | `#F8FAFC` (Slate 50) / `#FFFFFF` | `#0F172A` (Slate 900) / `#1E293B` (Slate 800) |
| **30% Secondary (Structure)** | Cards, containers, borders, dividers | `#FFFFFF` / `#E2E8F0` (Slate 200) | `#1E293B` / `#334155` (Slate 700) |
| **10% Accent (Actions)** | Primary CTAs, critical alerts, status indicators | `#2563EB` (OVDS Blue) / `#16A34A` (Emerald) | `#60A5FA` (light blue) / `#34D399` (light emerald) |

### Tailwind Utilities

```html
<!-- Background utilities -->
<div class="bg-neutral-60">...</div>    <!-- 60% dominant background -->
<div class="bg-secondary-30">...</div>   <!-- 30% secondary structure -->

<!-- Accent utilities -->
<button class="bg-accent-10 hover:bg-accent-10/90">...</button>

<!-- Semantic background utilities -->
<div class="ovds-bg-60-primary dark:ovds-bg-60-primary">Page background</div>
<div class="ovds-bg-30-card dark:ovds-bg-30-card">Card background</div>
<div class="ovds-text-10-accent">Primary action text</div>
```

## Typography for Financial Data

### Font Family Scale

| Usage | Fonts |
|-------|-------|
| UI Text | `Inter`, `Roboto`, `Segoe UI`, `Arial`, `sans-serif` |
| Numeric Data | `JetBrains Mono`, `SF Mono`, `Roboto Mono`, `tabular-nums` |

### Monospaced Number Alignment

```html
<!-- Tabular numbers for perfect decimal alignment -->
<td class="ovds-align-currency font-mono-num">$12,500.00</td>
<td class="ovds-align-value font-mono-num">1,234.56</td>

<!-- CSS utility classes -->
<span class="ovds-financial-number">1,234.56</span>
```

### Text Alignment Rules

| Type | Alignment | Class |
|------|-----------|-------|
| Customer names, dates, descriptions | Left | `.ovds-align-date` |
| Currencies, quantities, totals | Right | `.ovds-align-currency` |
| Column headers | Match data alignment | `.align-right` on th/td |

## Grid Layout System

### Responsive Grid Classes

```html
<!-- Auto-responsive grid -->
<div class="ovds-grid ovds-grid-auto">
  <div>KPI 1</div>
  <div>KPI 2</div>
  <div>KPI 3</div>
</div>

<!-- Fixed columns (responsive to mobile) -->
<div class="ovds-grid ovds-grid-4">...</div>  <!-- 4 cols → 2 cols → 1 col -->
<div class="ovds-grid ovds-grid-3">...</div>  <!-- 3 cols → 2 cols → 1 col -->
<div class="ovds-grid ovds-grid-2">...</div>  <!-- 2 cols → 1 col on mobile -->
```

### Grid Stats Row (Borderless with dividers)

```html
<div class="ovds-grid-stats">
  <div>Receivables</div>
  <div>Payables</div>
  <div>Cash Flow</div>
  <div>Net Position</div>
</div>
```

## Table Interactions — Hover-to-Reveal

```html
<tr class="ovds-row-hover">
  <td>Customer Name</td>
  <td class="ovds-align-currency">$1,250.00</td>
  <td>
    <button class="ovds-hover-reveal">...</button>
  </td>
</tr>

<!-- Expandable line items -->
<tr class="ovds-row-hover">
  <td colspan="3">
    <div class="ovds-line-expand">
      <!-- Additional line item details revealed on hover -->
    </div>
  </td>
</tr>
```

## Favorites Navigation

```html
<button class="ovds-nav-fav active">
  <Star class="ovds-fav-pin" />
  Dashboard
</button>
```

## Row Padding for High-Density Tables

The design system uses 12px vertical padding for compact, data-dense tables:

```css
/* CSS variables */
--ovds-row-padding-y: 12px;
--ovds-row-padding-x: 16px;

/* Tailwind application */
.tr-dense td { padding-top: 12px; padding-bottom: 12px; }
```

## Visual Anchors — Status Badges

```html
<!-- Status pills with muted backgrounds -->
<span class="status-pill bg-emerald-50 text-emerald-700">Paid</span>
<span class="status-pill bg-rose-50 text-rose-700">Overdue</span>
<span class="status-pill bg-amber-50 text-amber-700">Pending</span>

<!-- Action menus as trailing three-dot dropdown -->
<td>
  <DropdownMenu>
    <DropdownMenuTrigger>...</DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</td>
```

## Progressive Disclosure Pattern

```html
<!-- Hide complex filters behind progressive disclosure -->
<div class="ovds-progressive-disclosure" id="advanced-filters">
  <!-- Advanced filter fields -->
</div>

<button onclick="document.getElementById('advanced-filters').classList.toggle('expanded')">
  Advanced Filters
</button>
```

## F-Shaped Reading Pattern Optimization

Place critical KPIs at top-left:

```html
<div class="ovds-read-top-left">
  <h1 class="page-title">Accounts Receivable</h1>
</div>

<div class="ovds-grid ovds-grid-auto ovds-read-priority-1">
  <!-- Highest priority KPIs -->
</div>

<div class="ovds-grid ovds-grid-auto ovds-read-priority-2">
  <!-- Secondary metrics -->
</div>
```

## Action-Oriented Screens

Each screen focuses on one core action:

```tsx
// Example: Invoice creation focused screen
export default function InvoiceCreate() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="New Invoice"
        actions={<Can permission="invoices:write"><button>Create Invoice</button></Can>}
      />
      {/* Primary action form */}
    </div>
  );
}
```

## Sticky Summary Bar (Split-Screen invoice)

```tsx
// Fixed footer for invoice totals
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
  <div className="flex justify-between items-center max-w-4xl mx-auto">
    <div>Subtotal: $1,250.00</div>
    <div>VAT: $187.50</div>
    <div className="text-lg font-bold">Total: $1,437.50</div>
  </div>
</div>
```

## Keyboard Shortcuts for Financial Workflows

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate line items in invoice |
| `Enter` | Auto-calculate row totals |
| `Ctrl+Enter` | Create new line item |

## Reference Implementation

- `packages/design-system/src/tokens.ts` — Source of truth for color tokens
- `packages/ui/tailwind.config.js` — Tailwind color mapping
- `packages/ui/src/styles/globals.css` — CSS utility classes for 60-30-10
- `frontend/src/components/Dashboard/` — Dashboard widgets using grid system

## New Component Reference

### DashboardGrid.tsx
Clean, responsive grid for financial KPIs with F-shaped priority ordering:
```tsx
import { DashboardGrid, GridStatsRow } from '../components/Dashboard/DashboardGrid';

<DashboardGrid 
  widgets={[
    { id: 'receivables', title: 'Receivables', value: 'ETB 1.2M', priority: 1 },
    { id: 'payables', title: 'Payables', value: 'ETB 850K', priority: 2 },
  ]}
/>

<GridStatsRow 
  stats={[
    { label: 'Receivables', value: 1200000 },
    { label: 'Payables', value: 850000 },
    { label: 'Cash Flow', value: 350000, trend: 12 },
  ]}
/>
```

### FinancialTable.tsx
High-density table with tabular-nums alignment:
```tsx
import FinancialTable from '../components/FinancialTable';

<FinancialTable
  data={invoices}
  columns={[
    { key: 'invoiceNumber', label: 'Invoice #', align: 'left' },
    { key: 'customer', label: 'Customer', align: 'left' },
    { key: 'totalAmount', label: 'Total', align: 'right', 
      render: (v) => `ETB ${Number(v).toLocaleString()}` },
  ]}
  expandable
  renderExpansion={(row) => <InvoiceLineItems invoice={row} />}
/>
```

### Key CSS Classes for 60-30-10
```css
/* Grid system */
.ovds-grid              /* Base grid container */
.ovds-grid-auto         /* Auto-fill responsive columns */
.ovds-grid-4            /* 4 columns → 2 on tablet → 1 on mobile */
.ovds-grid-stats        /* Borderless stats row with dividers */

/* Widgets */
.ovds-widget-card       /* Card with hover elevation */
.ovds-elevated          /* Hover-elevated widget variant */

/* Tables */
.ovds-table-header      /* Table header styling */
.ovds-table-row         /* Table row with 12px vertical padding */
.ovds-table-expansion   /* Expandable detail row */

/* Typography */
.font-mono-num          /* Tabular-nums for numeric alignment */
.tabular-nums           /* Native CSS tabular nums */
.ovds-align-currency    /* Right-align + tabular nums */
.ovds-align-date        /* Left-align for dates/text */
.ovds-financial-number  /* Bold tabular nums for financial values */
```


