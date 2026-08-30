<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# CRM, Deal Pipeline & Client Portal

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** Login · `crm:read` · `crm:write`
>
> **Navigate to:** **CRM → Customers** (`/crm`)

The CRM module manages the full customer lifecycle — from initial lead through deal pipeline, invoice creation, and ongoing loyalty tracking. It integrates directly with Sales so that won deals convert to invoices in a single click.

---

## Customers (360° View)

Navigate to **CRM → Customers** (`/crm`).

Every customer record provides a consolidated view of the entire relationship:

| Section | What It Shows |
|---------|--------------|
| Contact Details | Name, TIN, email, phone, billing address |
| Payment Terms | Default terms applied to every new invoice |
| Credit Limit | Maximum outstanding balance allowed |
| Credit Score | Calculated from payment history — on-time payments and overdue amounts |
| Loyalty Tier | Auto-assigned: Platinum / Gold / Silver / Bronze |
| Invoice History | All invoices with status, amount, and payment date |
| Outstanding Balance | Current AR total |
| Communication Log | Notes, emails, and portal messages |

### Customer Fields

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | Legal business name or individual |
| TIN | Recommended | 15-digit Ethiopian TIN — required for B2B VAT invoices |
| Email | Recommended | For invoice delivery |
| Phone | Optional | Primary contact |
| Payment Terms | Optional | Defaults to company setting |
| Credit Limit | Optional | OVDS warns when a new invoice would exceed this limit |
| Loyalty Tier | Auto | Calculated from total revenue generated |

### Adding a Customer

1. Go to **CRM → Customers** → click **New Customer**.
2. Fill in the required fields.
3. Click **Save**.

Customers can also be created inline while creating an invoice — see [Creating an Invoice → Add a Customer](../04-financial-ops/creating-an-invoice.md#step-3--add-a-customer).

---

## Deal Pipeline

Navigate to **CRM → Pipeline** (`/crm/pipeline`) — requires `crm:read`.

A visual Kanban board tracking every deal from first contact to close.

### Pipeline Stages

| Stage | Default Probability | Description |
|-------|:-----------------:|-------------|
| Lead | 10% | Initial contact — interest not yet confirmed |
| Qualified | 25% | Budget and need confirmed |
| Proposal | 50% | Proposal or estimate sent |
| Negotiation | 75% | Terms being discussed |
| Closed Won | 100% | Deal signed — ready to invoice |
| Closed Lost | 0% | Deal lost — archived |

### Views

- **Kanban** — cards organized in stage columns; drag to move between stages
- **List** — tabular view with sortable columns and bulk actions

### Creating a Deal

1. Click **New Deal**.
2. Enter:
   - **Title** — descriptive deal name
   - **Customer** — link to an existing customer or create new
   - **Deal Value** (ETB)
   - **Stage** — starting stage
   - **Probability** — override the default if needed
   - **Expected Close Date**
   - **Assigned Sales Rep**
3. Add initial **Notes** for context.
4. Click **Create Deal**.

### Moving a Deal

- Drag the card to the next stage column, or
- Open the deal → click **Move to Next Stage**.

### Converting a Deal to Invoice

When a deal reaches **Closed Won**:

1. Open the deal → click **Create Invoice**.
2. The invoice is pre-filled with the customer details and deal value.
3. Add line items and adjust as needed.
4. Click **Save** or **Send** — the invoice enters the standard AR workflow.

---

## Pipeline Metrics

| Metric | Description |
|--------|-------------|
| Pipeline Value | Total value of all active deals (excludes Closed Won / Lost) |
| Won Revenue | Total value of all Closed Won deals in the period |
| Win Rate | Won ÷ (Won + Lost) × 100% |
| Average Deal Size | Total pipeline value ÷ number of active deals |
| Lead Velocity | New deals created per month |

Revenue forecast from the pipeline is **probability-weighted**:
```
Forecast = Σ (Deal Value × Probability) for all active deals
```

Navigate to **Reports → Financial → Revenue Trend** for the trailing 12-month revenue chart alongside the pipeline forecast.

---

## Automation Rules

Configure automatic actions triggered by deal and invoice events:

| Rule | Trigger | Action |
|------|---------|--------|
| Payment Reminder | Invoice X days overdue | Auto-send reminder email to customer |
| Deal Stage Alert | No activity on deal for X days | Notify assigned sales rep |
| Scheduled Export | Recurring schedule | Auto-export customer list or pipeline report |

Set up automation rules in **CRM → Automation** — requires `crm:write`.

---

## CRM Analytics

Navigate to **Reports → Financial → Customer Growth** (`/reports/customer-growth`) or **CRM → Analytics**.

| Report | Description |
|--------|-------------|
| Deal Stage Funnel | Visual funnel showing conversion rates between stages |
| Average Deal Size by Stage | Identifies where high-value deals cluster |
| Sales Rep Performance | Won revenue and win rate per rep |
| Customer Acquisition Trends | New customers per month |
| Revenue Forecast | Probability-weighted pipeline forecast |

---

## Client Portal

Navigate to **CRM → Client Portal** (`/client-portal`) — requires `invoices:read`.

The Client Portal gives customers a private self-service space to manage their relationship with you — without needing to email back and forth.

### Enabling the Client Portal

1. Go to **Settings → invoice** → toggle **Client Portal** to On.
2. When creating a new customer, check **Create Portal User** and enter their email.
3. The customer receives an invitation email with a login link.

### What Customers Can Do in the Portal

- View all their invoices and payment history
- Download invoice PDFs (including the ERCA QR code)
- Pay online using configured payment gateways (Telebirr, Chapa, Stripe)
- Submit service requests or billing questions
- Leave comments on invoices — visible to your team in the invoice's History tab

### Public Share Link (No Login Required)

For customers who prefer not to create a portal account:

1. Open any invoice → click **Share**.
2. Copy the generated public URL.
3. Send via SMS, WhatsApp, or email.
4. The customer can view the invoice, download the PDF, and pay — no account needed.
5. Payment confirmation is sent to both parties automatically.

### Loyalty Dashboard

Navigate to **CRM → Loyalty** (`/loyalty-dashboard`).

Track customer loyalty tier assignments and point accumulation:

| Tier | Typical Revenue Threshold | Benefits |
|------|--------------------------|---------|
| Platinum | Highest revenue segment | Priority support, custom terms |
| Gold | High revenue | Extended payment terms |
| Silver | Mid revenue | Standard terms |
| Bronze | New / low revenue | Standard terms |

Tier upgrades and downgrades are calculated automatically based on total invoiced revenue. Configure tier thresholds and benefits in **CRM → Loyalty → Settings**.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Creating and sending an invoice | [Financial Ops → Creating an Invoice](../04-financial-ops/creating-an-invoice.md) |
| Customer payment portal | [Financial Ops → Payments & Gateways](../04-financial-ops/payments-and-gateways.md#end-to-end-customer-payment-flow) |
| Customer statement report | [Reports → Financial Reports](../07-reports/financial-reports.md#customer-statement) |
| Customer growth report | [Reports → Financial Reports](../07-reports/financial-reports.md#customer-reports) |
| AR aging and collections | [Banking → Treasury & Collections](../05-banking/treasury-collections.md#collections--overdue-ar) |




