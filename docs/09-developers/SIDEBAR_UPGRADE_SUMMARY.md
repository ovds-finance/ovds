<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Sidebar Architecture — OVDS Layout Paradigm

> **Note:** This document describes the planned/aspirational sidebar architecture. The current implementation uses a hardcoded `OVDS_NAV_PARENTS` constant in `apps/frontend/src/components/sidebar/index.tsx` (lines 16–34) defining 12 navigation domains. The `navGroups.ts` file contains only TypeScript interfaces (`NavItem`, `NavGroup`), not a `NAV_GROUPS` data array.

The OVDS sidebar has been updated to follow the classic OVDS structure, providing a clean UX pattern optimized for clarity. It is driven entirely by the `OVDS_NAV_PARENTS` constant in `apps/frontend/src/components/sidebar/index.tsx`.

---

## 1. Structure Overview

```
┌──────────────────────────────────────────────────────────────┐
│  RAIL (44 px)  │  NAV PANEL (188 px, collapsible)            │
│  ─────────     │  ─────────────────────────────────────────  │
│  👤 Profile    │  Logo · Company · Env badge · Collapse       │
│  🔔 Alerts     │  [ Filter modules…                    🔍 ]  │
│  🔍 Search     │  ★ Favorites strip                          │
│  ⊕ Create      │                                              │
│                │  Dashboard                                   │
│  ⚙ Settings    │  Items & Inventory                           │
│  ? Help        │  Sales                                       │
│                │  Purchases                                   │
│                │  Banking                                     │
│                │  Double Entry                                │
│                │  Accounting                                  │
│                │  Tax & MoR                                   │
│                │  HR & Payroll                                │
│                │  Reports                                     │
│                │  IoT & POS                                   │
│                │  Settings                                    │
│                │  Apps                                        │
│                │                                              │
│                │  [ Avatar · Username · Role ▾ ]              │
└──────────────  └─────────────────────────────────────────────┘
```

The left **rail** is always visible and hosts utility actions. The right **nav panel** slides in/out and contains all navigation groups.

---

## 2. Paradigm Shift

The layout has moved away from the four-phase workflow to a classic module-based grouping. This matches standard ERP patterns like OVDS, reducing clutter and grouping features by their domain.

---

## 3. Group & Item Definitions

All groups live in `OVDS_NAV_PARENTS` in `apps/frontend/src/components/sidebar/index.tsx`. The `NavGroup` interface (from `navGroups.ts`):

```typescript
interface NavGroup {
  key: string;           // unique identifier
  label: string;         // display label
  icon: IconType;        // from @ovds/ui
  permission?: Permission; // RBAC gate — group hidden if user lacks this
  items: NavItem[];      // accordion children
  flat?: boolean;        // true = direct NavLink (no accordion), Dashboard only
  to?: string;           // route for flat links
}
```

`NavItem` interface:

```typescript
interface NavItem {
  to: string;            // React Router path
  label: string;
  icon: IconType;
  permission?: Permission;
  isNew?: boolean;       // renders "New" badge
  pinnable?: boolean;    // renders ★ pin button on hover
  badge?: number;        // numeric badge (unread count etc.)
  end?: boolean;         // exact match for NavLink
}
```

---

## 4. Current Group Map

| Key | Label | Child Keys | Notable Routes |
|---|---|---|---|
| `dashboard` | Dashboard | `dashboard` | `/dashboard`, `/accounting-dashboard` |
| `sales` | Sales | `sales` | `/sales/invoices`, `/sales/estimates` |
| `crm` | CRM | `crm` | `/crm/contacts`, `/crm/pipeline` |
| `trade` | Trade & Customs | `trade` | `/trade`, `/e-sad` |
| `purchases` | Purchases & Inventory | `purchases`, `inventory` | `/purchases/bills`, `/items`, `/inventory` |
| `banking` | Banking | `banking` | `/banking/accounts`, `/transactions` |
| `tax` | Tax & Compliance | `tax_compliance`, `regulatory_reporting`, `disaster_fund` | `/vat`, `/tax/etax-declaration`, `/disaster-fund` |
| `accounting` | Accounting | `accounting` | `/accounting`, `/accounting/fixed-assets` |
| `finance` | Finance & Standards | `ifrs_compliance`, `aabe_compliance`, `commercial_code`, `ovds_module` | `/ifrs`, `/leases` |
| `reports` | Reports & Analytics | `reports` | `/reports`, `/reports/financial-statements` |
| `hr_payroll` | HR & Payroll | `hr_payroll` | `/employees`, `/payroll`, `/attendance` |
| `system_admin` | System & Administration | `system`, `setting`, `config`, `admin`, `governance`, `iot`, `device_control`, `developer` | `/settings`, `/users`, `/app-store`, `/iot/devices` |

---

## 5. RBAC Filtering

Every group and item is evaluated against the current user's role on render:

```typescript
// In Sidebar.tsx — visibleGroups memo
const visibleGroups = useMemo(() =>
  NAV_GROUPS.map(g => ({
    group: g,
    items: g.items.filter(item => !item.permission || can(item.permission)),
  })).filter(({ group, items }) =>
    !group.permission || can(group.permission) && items.length > 0
  ),
[can, NAV_GROUPS]);
```

Groups with zero visible items are hidden entirely. Section labels are always shown if the section they head has at least one visible group beneath it.

---

## 6. Favorites Strip

Users pin frequently used routes by hovering any `pinnable: true` item and clicking the ★ star. Pinned routes are stored in `localStorage` under `sidebar_favorites_v2` and rendered in a **Favorites** strip at the top of the nav panel, above the phase sections. Favorites survive across sessions.

---

## 7. Module Search

The **Filter modules…** input at the top of the nav panel filters all groups and items by label in real time. While searching:
- All accordion groups auto-expand to show matching children
- Section label dividers are hidden
- A "No modules found" empty state is shown if nothing matches

---

## 8. Keyboard Shortcuts

Every item with a `to` in `SHORTCUT_HINTS` (in `sidebar.tsx`) shows a keyboard shortcut badge on hover. Global G-chord shortcuts navigate directly:

| Shortcut | Route |
|---|---|
| `G D` | `/dashboard` |
| `G I` | `/invoices` |
| `G V` | `/vat` |
| `G E` | `/employees` |
| `G P` | `/payroll` |
| `G T` | `/tax/dashboard` |
| `G H` | `/reports` |
| `G B` | `/banking/accounts` |
| `G U` | `/audit-logs` |
| `G O` | `/tax/etax-declaration` |

Full list in `layout.tsx` → `chordMap`.

---

## 9. Quick Create Rail Button

The **⊕** button in the rail opens the `QuickCreateMenu` — a contextual list of the most common create actions filtered by the user's permissions:

| Action | Route | Permission |
|---|---|---|
| New Invoice | `/invoices` | `invoices:write` |
| New Bill | `/purchases/bills` | `bills:write` |
| New Expense | `/purchases/expenses` | `expenses:write` |
| Add Employee | `/employees` | `employees:write` |
| Journal Entry | `/accounting` | `ovds:write` |
| Fund Transfer | `/fund-transfers` | `fund_transfers:write` |

---

## 10. Files to Edit

| What you want to change | File |
|---|---|
| Add/remove a nav group or item | `apps/frontend/src/components/utils/navGroups.ts` |
| Add a route to global search / 404 suggestions | `apps/frontend/src/components/utils/navigation.tsx` |
| Add a page title for a route | `apps/frontend/src/components/layout.tsx` → `routeTitleMap` |
| Add/update i18n labels (EN/AM/TI) | `apps/frontend/src/i18n/nav.json` |
| Add a keyboard shortcut | `apps/frontend/src/components/sidebar.tsx` → `SHORTCUT_HINTS` / `chordMap` |
| Change rail icons or panels | `apps/frontend/src/components/sidebar.tsx` |
| Change mobile bottom nav | `apps/frontend/src/components/mobileBottomNav.tsx` |



