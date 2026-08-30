<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Helpdesk, Projects & Business Intelligence

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** Login · permissions vary by module

---

## Helpdesk

Navigate to **Helpdesk** (`/helpdesk`) — requires `helpdesk:read` for support agents; all authenticated users can submit tickets.

The Helpdesk manages internal and external support tickets — employees raising IT or HR requests, customers submitting billing issues, and management tracking resolution SLAs.

### Ticket Lifecycle

```
NEW ──► OPEN ──► IN_PROGRESS ──► RESOLVED ──► CLOSED
  │                                               │
  └──────────────────────────────────────► CANCELLED
```

### Creating a Ticket

1. Go to **Helpdesk** → click **New Ticket**.
2. Fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Subject | ✅ | Brief description of the issue |
| Category | ✅ | HR / ovds / IT / Billing / Other |
| Priority | ✅ | Low / Medium / High / Urgent |
| Description | ✅ | Full details including any error messages |
| Attachments | Optional | Screenshots, documents, receipts |
| Assigned To | Optional | Defaults to category owner if left blank |

3. Click **Submit** — ticket is created with status **New** and a notification is sent to the assigned team.

### Managing Tickets (Support Agents)

Navigate to **Helpdesk → All Tickets**:
- Filter by status, category, priority, or assignee.
- Click a ticket to review, update status, add internal notes, or reply to the requester.
- Set **Resolution** notes when closing a ticket.

### For Requesters (All Employees)

Navigate to **Helpdesk → My Tickets**:
- Track the status of your own submitted tickets.
- Add follow-up comments or attachments.
- Reopen a resolved ticket within 7 days if the issue recurs.

### Priority SLAs

| Priority | First Response Target | Resolution Target |
|----------|:--------------------:|:-----------------:|
| Urgent | 1 hour | 4 hours |
| High | 4 hours | 1 business day |
| Medium | 1 business day | 3 business days |
| Low | 2 business days | 5 business days |

SLA breach alerts are sent automatically to the ticket assignee and their manager when a deadline is approaching.

### RBAC

| Action | Permission |
|--------|-----------|
| Submit a ticket | All authenticated users |
| View and respond to tickets | `helpdesk:read` — HR / ADMIN / ovds |
| Assign tickets to agents | `helpdesk:write` — ADMIN |
| Close or cancel tickets | `helpdesk:write` — ADMIN |
| View all company tickets | `helpdesk:read` — ADMIN / ovds |

---

## Projects

Navigate to **Projects** — requires `projects:read`.

### Task Tracking & Milestones

Create projects to track deliverables, assign tasks to team members, and monitor progress:

1. Go to **Projects** → click **New Project**.
2. Enter: name, description, start date, end date, and budget (ETB).
3. Add **Tasks** — assign to team members with due dates and status (To Do, In Progress, Done).
4. Add **Milestones** — key delivery points with target dates.
5. View progress on the **Gantt-style timeline** or the **Kanban board**.

### Project Profitability

Link financial transactions to projects for real-time P&L tracking:

- **Link invoices** to a project → revenue is attributed to the project
- **Link expenses and bills** to a project → costs are attributed to the project
- Navigate to the project → **Profitability tab** → see live:
  - Total revenue (invoiced)
  - Total costs (bills + expenses)
  - Gross profit and margin

### Resource Allocation

- Assign employees to projects and track hours spent.
- Compare planned vs actual hours per task.
- Identify over-allocated team members before they become blockers.

---

## Business Intelligence

### Business Insights

Navigate to **Business → Insights** (`/business-insights`) — requires `insights:read`.

A pre-built analytics dashboard showing key business performance indicators:

| Metric | Description |
|--------|-------------|
| Revenue trend | Monthly revenue for the trailing 12 months |
| Customer acquisition cost | Total sales/marketing spend ÷ new customers |
| Average invoice value | Total invoiced ÷ invoice count |
| Payment collection efficiency | Invoices paid on time ÷ total invoices × 100% |
| Top customers by revenue | Top 10 ranked by total invoiced amount |
| Top expense categories | Largest cost drivers for the period |

### Partnerships

Navigate to **Business → Partnerships** (`/partnerships`) — requires `partnerships:read`.

Track business partnerships and revenue-sharing arrangements:
- Partner details and signed contract terms
- Revenue sharing rules (percentage splits, flat fees)
- Performance metrics per partner
- Invoices and payments attributed to the partnership

### Investments

Navigate to **Business → Investments** (`/investments`) — requires `investments:read`.

Track business investments and monitor returns:
- Investment amount, date, and asset type
- Current estimated valuation
- Return on Investment (ROI) calculation
- GL integration — investment values feed into the Balance Sheet (Long-term Investments)

### Business Loans

Navigate to **ovds → Business Loans** (`/business-loans`) — requires `business_loans:read`.

See [Banking → Treasury & Cash Forecasting](../05-banking/treasury-collections.md#business-loans) for the full loan tracking and repayment workflow.

---

## Now update the Advanced README with the Standalone Guides table

Navigate to the [Advanced Modules README](./README.md) for the full navigation flow covering all advanced modules.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| HR & Payroll | [HR & Payroll](./hr-and-payroll.md) |
| CRM & Deal Pipeline | [CRM & Pipeline](./crm-and-pipeline.md) |
| IoT & POS Devices | [IoT & POS](./iot-and-pos.md) |
| Financial reports | [Reports → Financial Reports](../07-reports/financial-reports.md) |
| Customer growth report | [Reports → Financial Reports](../07-reports/financial-reports.md#customer-reports) |




