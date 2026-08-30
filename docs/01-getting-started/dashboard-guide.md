<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Dashboard & Widgets Guide

> **Part of:** [Getting Started](./README.md)
>
> **Requires:** Login · role-dependent (see widget table below)
>
> **Navigate to:** **Dashboard** (`/dashboard`) · **Accounting Dashboard** (`/accounting-dashboard`)

OVDS presents a role-aware dashboard — each user sees only the widgets relevant to their job function. The main dashboard updates in real time via WebSocket as transactions are posted.

---

## Main Dashboard (`/dashboard`)

The main dashboard is the landing page after login. Widget visibility depends on the user's role.

### Role → Widget Mapping

| Role | Widgets Shown |
|------|--------------|
| ADMIN / SPURADMIN | Business Credibility, Strategic Insights, Growth Insights Banner, Smart Alerts, Quick Actions Bar, Live Compliance |
| ovds / ACCOUNTING | Financial Health, Cash Flow, Weekly Activity Chart, Live P&L Banner, Tax Calendar, Payroll Action Items |
| HR | Who Is In (attendance), Recent Attendance Logs, Payroll Summary, Payroll Insights, Employee Dashboard |
| EMPLOYEE | Employee Dashboard (self-service: leaves, payslips, attendance) |
| AUDITOR | Read-only access — no actionable widgets |
| CRM | Pipeline summary, customer revenue |

---

## Widget Reference

### Financial Health Widget
**Who sees it:** ovds, ACCOUNTING

Shows the live **Business Health Score** (0–100) with component breakdown:
- Liquidity (current ratio trend)
- Profitability (gross and net margin)
- Cash Flow (is operating cash flow positive?)
- Compliance (all filings on time, period closed)
- AR Collection (Days Sales Outstanding vs target)

Click any component for the underlying report.

---

### Cash Flow Widget
**Who sees it:** ovds, ACCOUNTING

Displays the 30-day projected cash position — inflows from open invoices vs outflows from unpaid bills. Updates in real time as new invoices and bills are posted.

Click **View Treasury Forecast** to open the full 30/60/90-day forecast in **ovds → Treasury Forecast**.

---

### Tax Calendar Widget
**Who sees it:** ovds, ACCOUNTING, ADMIN

Shows upcoming tax deadlines in the next 30 days with a countdown:

| Colour | Days Remaining |
|--------|---------------|
| 🔴 Red | ≤ 3 days |
| 🟡 Amber | 4–7 days |
| ⚪ Normal | > 7 days |

Deadlines shown: VAT, TOT, WHT, DRRF, BIT quarterly installments, pension.

Click any deadline to jump directly to the relevant filing page.

---

### Live P&L Banner
**Who sees it:** ovds, ACCOUNTING

A banner at the top of the dashboard showing the current month's running totals:
- Total Revenue (invoiced)
- Total Expenses (bills + approved expenses)
- Net Position (Revenue − Expenses, before tax)

Updates within seconds of any invoice or bill being saved.

---

### Smart Alerts Widget
**Who sees it:** ADMIN, SPURADMIN, ovds

Surfaces anomalies and important events detected automatically:

| Alert Type | Example |
|------------|---------|
| Overdue invoice | "3 invoices totalling ETB 45,000 are more than 30 days overdue" |
| Tax deadline approaching | "VAT return due in 5 days — ETB 12,400 estimated payable" |
| Budget variance | "Salaries expense is 18% over budget this month" |
| IoT device offline | "Fiscal printer DEV-003 has been offline for 2 hours" |
| Low stock | "Item: Printer Toner — below reorder level (2 units remaining)" |
| Payroll not run | "Payroll for July has not been generated — 3 days remaining" |

---

### Quick Actions Bar
**Who sees it:** ADMIN, ovds, ACCOUNTING

One-click shortcuts to the most common actions:
- New Invoice
- New Bill
- Record Payment
- New Expense
- Run Payroll
- Compute VAT

---

### Weekly Activity Chart
**Who sees it:** ovds, ACCOUNTING

Bar chart showing transaction volume (invoices + bills + payments) for each day of the current week. Useful for spotting processing gaps or end-of-month spikes.

---

### Live Compliance Widget
**Who sees it:** ADMIN, SPURADMIN, ovds

Shows the company's live **Compliance Score** (0–100) with the six components:

| Check | Weight | Status |
|-------|:------:|--------|
| VAT Return Filed | 25% | ✅ / ❌ |
| BIT Filed | 20% | ✅ / ❌ |
| DRRF Remitted | 20% | ✅ / ❌ |
| Payroll Configured | 15% | ✅ / ❌ |
| Audit Clean | 10% | ✅ / ❌ |
| IFRS Enabled | 10% | ✅ / ❌ |

Click **View Compliance Auditor** to see the full checklist at `/compliance-auditor`.

---

### Who Is In Widget
**Who sees it:** HR

Real-time attendance presence — shows employees currently checked in vs those who haven't checked in yet today. Updates every 30 seconds via WebSocket.

Click an employee's name to view their attendance detail.

---

### Payroll Action Items
**Who sees it:** ovds, HR

Shows the current payroll status for the month:
- ☐ Payroll not started
- ✅ Payroll generated — awaiting verification
- ✅ Payroll verified — awaiting ovds approval
- ✅ Payroll approved — ready for disbursement

Click the status to jump directly to the payroll run.

---

### Strategic Insights Widget
**Who sees it:** ADMIN, SPURADMIN

AI-generated business insights (cached for 30 seconds per refresh):
- Revenue trend analysis
- Top customers by revenue growth
- Expense category anomalies
- Cash runway estimate at current burn rate

Powered by the Business Insights module — see [Advanced → Helpdesk, Projects & BI](../08-advanced/helpdesk-and-projects.md#business-intelligence).

---

## Accounting Dashboard (`/accounting-dashboard`)

Navigate to **Accounting → Dashboard** — requires `ovds:read`.

A focused view for ovds and Accounting roles showing:

| Section | Content |
|---------|---------|
| Trial Balance Summary | Total assets, liabilities, equity — debit/credit balance check |
| Recent Journal Entries | Last 10 posted entries with account, amount, and reference |
| AR Summary | Total outstanding receivables with aging buckets |
| AP Summary | Total outstanding payables with aging buckets |
| Bank Balances | Current balance per configured bank account |
| Upcoming Payments | Bills due in the next 7 days |

---

## Customising Your Dashboard

### Star / Pin Frequently Used Pages

Click the **⭐ Star icon** at the top of any feature page (e.g. Invoice Templates, WHT Certificates) to pin it to your sidebar for one-click access. Starred pages appear under **Favourites** in the navigation.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `W` | Open the Setup Wizard |
| `Cmd/Ctrl + K` | Open Global Search (jump to any page or record) |
| `N` | New Invoice (from Invoices page) |
| `?` | Show all keyboard shortcuts |

### Role-Based Default Route

After login, each role is redirected to their default route automatically:

| Role | Default Route |
|------|--------------|
| SPURADMIN, ADMIN | `/dashboard` |
| ovds, ACCOUNTING | `/accounting-dashboard` |
| HR | `/dashboard` (HR widgets) |
| EMPLOYEE | `/dashboard` (self-service) |
| AUDITOR | `/audit-logs` |
| IFRS_OFFICER | `/ifrs` |
| CRM | `/crm` |
| CLIENT | `/client-portal` |
| PARTNER | `/purchases/orders` |
| DATA_CLERK | `/items` |

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Business Health Score | [Reports → Financial Reports](../07-reports/financial-reports.md#business-health-score) |
| Tax Calendar deadlines | [Reports → Tax Reports](../07-reports/tax-reports.md#tax-liability-dashboard) |
| Treasury & Cash Forecast | [Banking → Treasury & Collections](../05-banking/treasury-collections.md) |
| Compliance Auditor | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#compliance-auditor-dashboard) |
| AR / AP Aging | [Reports → Financial Reports](../07-reports/financial-reports.md#ar--ap-aging-reports) |
| User roles and default routes | [Users & Roles → RBAC Matrix](../02-users-roles/rbac-matrix.md) |




