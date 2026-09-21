---
inclusion: auto
name: route-driven-ui
description: How to annotate routes and use useNavigation() in the OVDS route-driven UI states system
---

# Route-Driven UI States

OVDS uses structural metadata on route definitions to drive which shell wraps each page. The router itself — not the page component — decides whether to render a full-page view, a stepped wizard, a slide-out panel, or a modal dialog.

## The 4-Mode Matrix

| Mode | Shell | Anchor | State scope | Typical use |
|------|-------|--------|-------------|-------------|
| `inline` | `FullPageShell` | `#main-content` | Volatile / Reset | Tables, dashboards, reports |
| `slider` | `SliderShell` | `#slider-root` | Isolated / Retained | Detail panels, integrations, settings sub-pages |
| `wizard` | `WizardShell` | `#wizard-viewport` | Multi-step persistent | Enrollment, import flows, guided setup |
| `modal` | `ModalShell` | `#modal-root` | Isolated ephemeral | Quick-create forms, confirmations, portals |

`'table'` is a backward-compatible alias for `'inline'`. Use `'inline'` for new routes.

---

## Step 1 — Annotate a Route

Add a third element (the `RouteHandle`) to any entry in the `ROUTES` array in `apps/frontend/src/app.tsx`:

```ts
// apps/frontend/src/app.tsx
const ROUTES: RouteRecord[] = [

  // INLINE — default, no handle needed
  ['/sales/invoices', Invoices],

  // INLINE — with explicit title override
  ['/sales/invoices', Invoices, {
    layout: 'inline',
    inline: { title: 'Invoices' },
    meta: { module: 'sales', entity: 'invoice' },
  }],

  // WIZARD — multi-step sequential flow
  ['/banking/statement-import', BankStatementImport, {
    layout: 'wizard',
    wizard: {
      title: 'Import Bank Statement',
      stepParam: 'step',
      variant: 'horizontal',          // 'vertical' (default) | 'horizontal'
      completionRoute: '/banking/reconciliation',
      steps: [
        { id: 'upload',  label: 'Upload File'  },
        { id: 'map',     label: 'Map Columns'  },
        { id: 'preview', label: 'Preview'      },
        { id: 'import',  label: 'Import'       },
      ],
    },
  }],

  // SLIDER — slide-out panel over the current page
  ['/crm/pipeline', CRMPipeline, {
    layout: 'slider',
    slider: {
      title: 'CRM Pipeline',
      side: 'right',           // 'right' (default) | 'left'
      width: 'w-[680px]',      // Tailwind width class
      closeRoute: '/crm',
      icon: 'PIPELINE',        // OVDS Icon name
    },
  }],

  // MODAL — centered overlay, ephemeral
  ['/companies/new', CompanyNew, {
    layout: 'modal',
    modal: {
      title: 'Add New Company',
      description: 'Register a new subsidiary or branch',
      maxWidth: 'max-w-xl',    // Tailwind max-width class
      closeRoute: '/companies',
      icon: 'COMPANY',
    },
  }],
];
```

---

## Step 2 — Programmatic Navigation with `useNavigation()`

Replace `useNavigate()` with `useNavigation()` for any layout-aware navigation:

```ts
import { useNavigation } from '../router';

const nav = useNavigation();

// Full-page view
nav.toInline('/sales/invoices');

// Slide-out panel
nav.toSlider('/sales/invoices/:id', { id: invoice.id }, {
  title: `Invoice #${invoice.number}`,
  closeRoute: '/sales/invoices',
  width: 'w-[640px]',
  icon: 'INVOICE',
});

// Multi-step wizard
nav.toWizard('/banking/statement-import', {
  title: 'Import Bank Statement',
  steps: [
    { id: 'upload',  label: 'Upload File'  },
    { id: 'map',     label: 'Map Columns'  },
    { id: 'preview', label: 'Preview'      },
    { id: 'import',  label: 'Import'       },
  ],
  completionRoute: '/banking/reconciliation',
});

// Modal dialog
nav.toModal('/companies/new', {
  title: 'Add New Company',
  closeRoute: '/companies',
  maxWidth: 'max-w-xl',
});

// Generic typed action
nav.navigate({
  mode: 'modal',
  path: '/purchases/expenses/:id/approve',
  params: { id: expense.id },
  modal: { title: 'Approve Expense', closeRoute: '/purchases/expenses' },
});
```

---

## Step 3 — Back Navigation

Use `nav.navigateBack(handle)` instead of `history.back()` so the service picks the correct exit route:

```tsx
import { useRouteUI } from '../router';
import { useNavigation } from '../router';

const { handle } = useRouteUI();
const nav = useNavigation();

// Mode-aware back: uses closeRoute for modal/slider, previous step for wizard,
// plain history.back() for inline.
<button onClick={() => nav.navigateBack(handle, '/dashboard')}>
  Back
</button>

// Conditionally show the Back button
{nav.canGoBack(handle) && <BackButton />}
```

---

## Step 4 — Dynamic Page Titles

Set a data-driven title from within a page component without touching `routeTitleMap`:

```tsx
import { useRouteUITitle } from '../router';

const InvoicePage = () => {
  const { data: invoice } = useInvoice(id);

  // Fires when invoice loads; layout header and browser tab update automatically.
  // Passing null/undefined is a no-op (safe during loading state).
  useRouteUITitle(invoice ? `Invoice #${invoice.number}` : null);

  return <InvoiceDetail invoice={invoice} />;
};
```

---

## Choosing the Right Mode

| Scenario | Mode |
|----------|------|
| Full data table, dashboard, report | `inline` |
| Settings sub-page that belongs to a parent settings page | `slider` |
| Entity detail view opened from a list | `slider` |
| Multi-step setup / import / onboarding | `wizard` |
| Quick-create form (New Invoice, New Company) | `modal` |
| Confirmation dialog | `modal` |
| Contextual help or portal invite | `modal` |

**Rule of thumb:** If the user needs to see the page they came from while acting, use `slider`. If the action is ephemeral and self-contained, use `modal`. If there are sequential steps the user must complete in order, use `wizard`. Everything else is `inline`.

---

## Where Things Live

```
apps/frontend/src/router/
  routeHandle.ts              — RouteHandle, NavAction, all config types
  RouteUIContext.tsx           — useRouteUI(), useSliderConfig(), useModalConfig()
  RouteLayoutDispatcher.tsx   — useMatches() → shell selection
  NavigationLayoutService.ts  — navigate(), toSlider(), toModal(), navigateBack()
  useNavigation.ts            — React hook wrapping the service
  useRouteUITitle.ts          — imperative title override hook
  index.ts                    — single public barrel
  shells/
    FullPageShell.tsx
    SliderShell.tsx
    WizardShell.tsx
    ModalShell.tsx
```
