<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Multi-Company Management

> **Part of:** [Users & Roles](./README.md)
>
> **Requires:** ADMIN or SPURADMIN role · `companies:read` · `companies:write`
>
> **Navigate to:** **Administration → Companies** (`/companies`) · **Administration → Multi-Company** (`/multi-company-admin`)

OVDS supports running multiple separate legal entities within the same installation. Each company has its own isolated data — invoices, bills, employees, tax filings, bank accounts, and reports — with no cross-contamination between companies.

---

## When to Use Multi-Company

| Scenario | Use Multi-Company? |
|----------|:-----------------:|
| Single business, multiple branches | ❌ Use branch/department tracking within one company |
| Two separate legal entities (e.g. trading company + holding company) | ✅ |
| Franchise with separate tax registrations per outlet | ✅ |
| Accountant managing multiple client companies | ✅ |
| Group of companies requiring consolidated statements | ✅ |
| Parent company + subsidiary with separate TINs | ✅ |

---

## Creating a New Company

### Method 1 — Setup Wizard (Recommended for New Deployments)

1. Press **W** on any page to open the Setup Wizard.
2. At the company selection step, choose **Create New Company**.
3. Fill in the company name, TIN, and business type.
4. Complete the remaining wizard steps for the new entity.

### Method 2 — From the Company Selector

1. Click your **company name** in the top-right corner of the Dashboard.
2. Select **Manage Companies → Add New**.
3. Enter:

| Field | Required | Notes |
|-------|----------|-------|
| Company Name | ✅ | Legal name as on MoR registration |
| TIN | ✅ | 15-digit Ethiopian TIN for this entity |
| Business Type | ✅ | Determines IFRS tier and VAT/TOT classification |
| Business Category | ✅ | A (VAT), B (TOT), or C |
| MoR Region | ✅ | Regional tax office for this entity |
| Currency | ✅ | Default ETB |
| Fiscal Year Start | ✅ | Ethiopian: Hamle (July) |

4. Click **Create Company**.
5. OVDS creates a completely isolated data environment for the new entity.
6. Seed Chart of Accounts and tax rates for the new company — these are not copied from the first company.

---

## Switching Between Companies

Once multiple companies exist:

1. Click your **company name** in the top-right header.
2. A dropdown shows all companies you are assigned to.
3. Click the company you want to work in.

OVDS switches context immediately — all data (invoices, bills, reports, employees) shown is now for the selected company. The company name in the header updates to confirm the switch.

> No logout required. Each company switch is recorded in the Audit Trail with timestamp and user.

---

## Data Isolation

Each company's data is isolated at the database level via `companyId` on every record. The `CompanyGuard` in the backend enforces this on every API request:

- A user assigned to Company A **cannot** access Company B's data — even with the same role
- Switching to Company B in the UI automatically scopes all API calls to Company B's `companyId`
- Reports, dashboards, and all exports are always scoped to the currently active company

---

## Assigning Users to Multiple Companies

A single user account can be assigned to work across multiple companies — useful for accountants, auditors, or group ovds managers.

1. Go to **Administration → Users** → click the user's name.
2. Under **Company Assignments**, click **Add Company**.
3. Select the additional company and assign the appropriate role for that company (roles can differ per company).
4. Click **Save**.

The user can then switch between companies using the company selector in the header.

---

## Per-Company Configuration

Each company requires its own independent configuration. Settings, tax rates, and bank accounts are **not** shared between companies.

| Setting | Where to Configure per Company |
|---------|-------------------------------|
| TIN / MoR Credentials | Settings → Company Profile |
| Tax Rates | Setup → Tax Configuration → Seed Ethiopian Defaults |
| Chart of Accounts | Accounting → Chart of Accounts → Seed Ethiopian Defaults |
| Bank Accounts | Setup → Currencies & Banking → Bank Accounts Setup |
| Telebirr / Chapa | Settings → Digital Wallets / Payment Gateways |
| Invoice Template | Settings → invoice tab |
| Invoice Numbering | Settings → invoice tab (sequences restart per company) |
| Employees & Payroll | HR → Employees (each company has its own employee registry) |
| SMTP Email | Admin → Notification Settings |

---

## Consolidated Reporting (IFRS 10)

For parent companies with subsidiaries, OVDS supports consolidated financial statements per IFRS 10.

Navigate to **ovds → IFRS Dashboard → Consolidated** (`/ifrs?view=consolidated`) — requires `ifrs_officer` role.

### Consolidation Process

1. Ensure all subsidiary companies are set up and their books are current.
2. Go to **IFRS Dashboard → Consolidated**.
3. Select the parent company and all subsidiaries to include.
4. Click **Generate Consolidated Statements** — OVDS combines:
   - Balance Sheet (eliminating intercompany balances)
   - P&L (eliminating intercompany revenue and expenses)
   - Cash Flow Statement
5. Intercompany eliminations are applied automatically where the relevant accounts are tagged.
6. Export as PDF for the external auditor or MoR submission.

> Full IFRS 10 consolidation configuration is in **Settings → IFRS → Consolidation Settings**.

---

## Multi-Company Administration (SPURADMIN)

Navigate to **Administration → Multi-Company Admin** (`/multi-company-admin`) — SPURADMIN only.

For platform operators managing all tenants:

| Action | Description |
|--------|-------------|
| View all companies | Full list with plan, status, TIN, and last activity |
| Switch to any company | Act in any company context for support purposes |
| Manage subscriptions | Activate, extend, or cancel plans |
| Suspend a company | Block access while preserving all data |
| Delete a company | Permanent — requires confirmation and data export first |

> **Important:** Company deletion is irreversible. Always export the company's data before deleting. This action is logged in the platform-level Audit Trail.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| User management and roles | [Users & Roles → RBAC Matrix](./rbac-matrix.md) |
| Company setup wizard | [Getting Started → Quick Start](../01-getting-started/quick-start.md#cloud-saas--8-steps-to-first-invoice) |
| Company settings | [Settings → Company & Tax](../03-settings/company-and-tax.md) |
| IFRS tiers and consolidation | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) |
| Monetization and company plans | [Advanced → Monetization & Plans](../08-advanced/monetization-and-plans.md) |
| Audit trail across companies | [Users & Roles → RBAC Matrix → Audit Logs](./rbac-matrix.md#audit-logs) |




