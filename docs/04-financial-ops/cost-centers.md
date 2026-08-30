<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Cost Centers

> **Part of:** [Financial Operations](./README.md)
>
> **Requires:** Login · `ovds:read` · `ovds:write`
>
> **Navigate to:** **Accounting → Cost Centers** (`/accounting/cost-centers`)

Cost centers let you track revenue and expenses by business unit, department, project, branch, or any other dimension that matters to your organization. Every transaction can be tagged to a cost center, enabling management reports that show profitability and cost at a granular level beyond the standard P&L.

---

## When to Use Cost Centers

| Use Case | Example |
|----------|---------|
| Track profit per department | Sales, Operations, ovds, IT |
| Compare branch performance | Addis Ababa HQ, Hawassa Branch, Dire Dawa Branch |
| Allocate shared costs | Rent and utilities split between departments |
| Project-level reporting | Cost centre per construction project or client engagement |
| Donor/grant tracking | NGOs tracking costs per funding stream |

---

## Creating a Cost Center

1. Go to **Accounting → Cost Centers** → click **New Cost Center**.
2. Fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Name | ✅ | e.g. *Sales Department*, *Hawassa Branch* |
| Code | ✅ | Short unique code — e.g. `SALES`, `HWS-BR` |
| Type | Optional | Department / Branch / Project / Donor Fund |
| Parent Cost Center | Optional | For hierarchical structures (e.g. branch → region) |
| Manager | Optional | Assign a responsible person |
| Description | Optional | Notes on what this cost center covers |
| Active | ✅ | Toggle to deactivate without deleting |

3. Click **Save**.

---

## Assigning Transactions to Cost Centers

Once cost centers exist, tag any transaction to one when creating it:

### On an Invoice Line Item
When creating an invoice, expand the line item row → select the **Cost Center** dropdown → choose the relevant center.

Multiple line items on a single invoice can be tagged to different cost centers (e.g. if you're billing multiple departments' services on one invoice).

### On a Bill Line Item
Same as invoices — the **Cost Center** field is available on each line of a bill.

### On an Expense Claim
When submitting an expense, the **Cost Center** field is available — the expense is attributed to that center for reporting.

### On a Journal Entry
When posting a manual journal entry, each debit and credit line has a **Cost Center** field — use this to allocate accruals, prepayments, and adjustments to the correct center.

### On Payroll
Configure payroll cost centers in **Payroll Administration → Cost Center Allocation**:
- Assign each employee to a primary cost center
- Salary expenses post to that center automatically on every payroll run
- Employees whose time is split across departments can have split allocations (e.g. 60% Operations, 40% Admin)

---

## Cost Center Reports

Navigate to **Reports → Financial → Cost Center Analysis**.

### P&L by Cost Center

Compares revenue and expenses per cost center for any period:

| Cost Center | Revenue | Expenses | Net Profit | Margin % |
|-------------|:-------:|:--------:|:----------:|:--------:|
| Sales Department | ETB 820,000 | ETB 410,000 | ETB 410,000 | 50% |
| Operations | ETB 0 | ETB 280,000 | (ETB 280,000) | — |
| Admin | ETB 0 | ETB 95,000 | (ETB 95,000) | — |
| **Total** | **ETB 820,000** | **ETB 785,000** | **ETB 35,000** | **4.3%** |

**How to run:**
1. Go to **Reports → Financial** tab.
2. Select **Cost Center Analysis** or **P&L by Cost Center**.
3. Choose the date range.
4. Optionally filter to a specific cost center.
5. Export as CSV or PDF.

### Variance by Cost Center

If budgets are set per cost center, the **Budget vs Actual** report breaks down variance per center.

See [Budgets & Planning → Budget vs Actual](./budgets-and-planning.md#budget-vs-actual-report).

---

## Hierarchical Cost Centers

Cost centers support parent–child relationships for group reporting:

```
Ethiopia Operations (parent)
├── Addis Ababa HQ
│   ├── Sales
│   ├── ovds
│   └── IT
└── Regional Branches
    ├── Hawassa Branch
    ├── Dire Dawa Branch
    └── Mekelle Branch
```

Reports can be run at any level:
- View only **Hawassa Branch** costs
- Roll up all **Regional Branches** into one line
- See the full **Ethiopia Operations** picture

---

## Shared Cost Allocation

For shared expenses like office rent or utilities that benefit multiple departments, use journal entries to split the cost across cost centers:

```
Example: Office rent ETB 60,000 — split 60% Sales, 40% Admin

Dr  Rent Expense — Sales (6100)    ETB 36,000  [Cost Center: SALES]
Dr  Rent Expense — Admin (6100)    ETB 24,000  [Cost Center: ADMIN]
    Cr  Accounts Payable / Cash              ETB 60,000
```

Use a **Recurring Journal Template** to automate this monthly split — see [General Ledger & Journal Entries → Recurring Templates](./general-ledger-and-journals.md#recurring-journal-templates).

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Budgets per cost center | [Budgets & Planning](./budgets-and-planning.md) |
| Manual journal entries with cost center tags | [General Ledger & Journal Entries](./general-ledger-and-journals.md) |
| Payroll cost allocation | [Advanced → HR & Payroll](../08-advanced/hr-and-payroll.md#payroll-generation) |
| Expense claims by cost center | [Expense Claims](./expense-claims.md) |
| Financial reports | [Reports → Financial Reports](../07-reports/financial-reports.md) |




