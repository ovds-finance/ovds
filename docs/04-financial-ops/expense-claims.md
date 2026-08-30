<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Expense Claims & HR Recruitment Workflows

> **Part of:** [Financial Operations](./README.md) › Bills, Expenses & Purchases
>
> **Requires:** Login · `expenses:read` · `expenses:write` permissions

This section covers employee expense claims and the two main HR-related financial workflows: agency invoice for outsourced recruitment, and cost recovery for candidate expenses.

---

## Expense Claims & Reimbursements

Navigate to **My Workspace → Expenses** (`/expenses`) — requires `expenses:read`.

Employees submit expense claims for out-of-pocket spending incurred on behalf of the company. ovds or HR reviews and approves them before reimbursement is processed.

### Submitting an Expense Claim

1. Go to **My Workspace → Expenses** → click **New Expense**.
2. Fill in the required fields:

| Field | Required | Notes |
|-------|----------|-------|
| Amount | ✅ | Actual amount spent (ETB or foreign currency) |
| Category | ✅ | Maps to a GL expense account — see category list below |
| Date | ✅ | Date the expense was incurred |
| Description | ✅ | Brief note on what the expense was for |
| Receipt | Recommended | Photo or scanned copy — required for amounts above policy threshold |
| Project | Optional | Link the expense to a billable project |
| Notes | Optional | Additional context for the approver |

3. Click **Submit** — the claim moves to **Pending Approval** status.

### Expense Categories

| Category | GL Account | Notes |
|----------|-----------|-------|
| Transport / Travel | 6300 Travel & Transport | Fuel, taxi, airfare |
| Accommodation | 6310 Accommodation | Hotel stays for business travel |
| Meals & Entertainment | 6320 Meals | Business meals — receipts required |
| Office Supplies | 6400 Office Expenses | Stationery, printer ink, etc. |
| Communication | 6410 Telephone & Internet | Mobile top-up, internet data |
| Per-Diem Allowance | 6300 Travel & Transport | Daily rate per location tier |
| Medical (work-related) | 6500 Medical | Occupational health expenses |

> Per-diem rates are configured per location tier in **HR → Payroll Administration → Per-Diem Tiers**. Claims at or below the configured rate are auto-approved; claims above it require manual review.

### Approval Workflow

1. HR or ovds receives a notification of the pending claim.
2. The reviewer opens **Expenses → Pending** and clicks the claim to review.
3. Available actions:
   - **Approve** — moves the claim to Approved status
   - **Reject** — with a mandatory comment explaining the reason
   - **Request More Info** — sends a message back to the submitter
4. Approved claims queue for payment.

**Multi-level approval:** For larger amounts, configure a two-step flow:
- HR approves first (`expenses:approve`)
- ovds confirms payment (`ovds:approve`)

### Bulk Approval

1. Go to **Expenses → Pending**.
2. Use checkboxes to select multiple claims.
3. Click **Approve Selected** — all selected claims move to Approved in one step.

### Paying an Approved Claim

| Method | When to Use |
|--------|------------|
| Add to next payroll run | Standard monthly reimbursement — most common |
| Fund Transfer (immediate) | Urgent or large amounts paid directly to the employee's bank account |

> Fund Transfer payments require `fund_transfers:write` — see [Banking → Bank Accounts → Fund Transfers](../05-banking/bank-accounts.md#fund-transfers-between-accounts).

### RBAC Requirements

| Action | Permission |
|--------|-----------|
| Submit own expense | `expenses:write` — available to all employees via My Workspace |
| View all expenses | `expenses:read` — HR / ovds roles |
| Approve expenses | `expenses:approve` — HR / ovds roles |
| Pay via fund transfer | `fund_transfers:write` — ovds role |

---

## HR Recruitment Workflows

HR departments deal with two main financial scenarios in recruitment: paying placement agencies and recovering costs advanced on behalf of candidates.

---

### 1. Corporate Agency invoice

When recruitment is outsourced to a staffing or placement agency, the agency issues an invoice to the company upon successful placement. HR processes this as a standard vendor bill.

#### Workflow

1. HR signs a **Recruitment Agency Agreement** — document the fee structure (fixed fee, percentage of annual salary, or retainer) and refund/replacement guarantee terms upfront.
2. The agency sources and presents candidates — no invoice is raised until placement is confirmed.
3. Once a candidate accepts the offer and starts, the agency issues a **placement invoice**.
4. HR raises the bill under **Purchases → Bills** — select the agency as the vendor.
5. Use expense category `6012 Recruitment & HR Expenses` — sub-type: *Agency Placement Fee*.
6. If WHT applies (agency TIN on file + bill amount ≥ ETB 500), the system auto-calculates 2% WHT — deducted from the payment.
7. ovds approves and schedules payment via the standard Bill Payment workflow.
8. If the placed candidate leaves within the **guarantee period** (typically 30–90 days), raise a **Debit Note** against the agency for a refund or replacement credit.

#### Agency Fee Fields to Record

| Field | Notes |
|-------|-------|
| Vendor | Recruitment agency — must have TIN on file for WHT |
| Invoice Ref | Agency's own invoice number |
| Placement Date | Date candidate started work |
| Guarantee Period | Days within which a refund or replacement applies |
| Fee Type | Fixed / percentage of salary / retainer |
| WHT Applied | Auto-calculated if applicable |
| Linked Employee | Reference to the Employee record created for the hire |

#### Refund / Replacement via Debit Note

If a candidate leaves within the guarantee period:

1. Navigate to **Purchases → Debit Notes** → link to the original agency bill.
2. Enter the refund amount and reason (e.g. *candidate resigned within 60-day guarantee*).
3. Click **Save** — the debit note reduces the net payable to the agency or triggers a cash refund.
4. Post the refund credit back to `6012 Recruitment & HR Expenses`.

---

### 2. Worker / Candidate Cost Recovery

HR may advance or incur costs on behalf of candidates during recruitment — such as travel, accommodation, assessment fees, or pre-employment medicals. Where an agreement exists to recover these costs, they must be tracked systematically.

#### Common Recovery Scenarios

| Cost Type | Recovery Method | Notes |
|-----------|----------------|-------|
| Interview travel (airfare, hotel) | Reimbursed to candidate or deducted from first salary | Require receipts; set a policy cap per tier |
| Relocation assistance | Advance deducted over agreed months | Create a Staff Advance record; recover via payroll |
| Pre-employment medical exam | Company-paid; recovered if candidate declines offer | Include recovery clause in offer letter |
| Skills assessment / certification fee | Company-paid; recovered if no-show or immediate resignation | Service bond clause recommended |
| Work permit / visa fees (expatriates) | Company-paid; may be partially recovered on early exit | IAS 21 applies if USD-denominated |

#### Workflow — Advancing and Recovering Costs

1. HR documents the cost agreement in the **offer letter** or a signed **cost recovery letter**.
2. ovds advances the cost via **Fund Transfer** or direct payment to the service provider.
3. Record the advance under `1030 Staff Advance — Recruitment` in the GL.
4. Once the candidate joins, link the advance to their **Employee** record.
5. Set up a **payroll deduction** to recover the balance monthly:
   - Go to **HR → Payroll → Other Deductions** → add a deduction of type *Advance Recovery*.
   - The system deducts from net salary each month until the advance is cleared.
6. If the candidate does **not** join or resigns before the recovery period ends:
   - Raise a **Receivable** (`1020 Other Receivables`) against the candidate.
   - Issue a formal demand letter and track in the AR Aging report.
   - If unrecoverable, write off against `6012 Recruitment & HR Expenses` with manager approval.

#### Reimbursing Candidates for Interview Costs

Where the company agrees to cover a candidate's travel or accommodation:

1. Candidate submits receipts to HR (email or upload).
2. HR creates an **Expense Claim** on behalf of the candidate at `/expenses` (requires HR role).
3. ovds approves and pays via **Fund Transfer** to the candidate's bank account.
4. Post to `6012 Recruitment & HR Expenses — Interview Reimbursement`.
5. If the candidate later joins as an employee, the reimbursement is already expensed — no further action needed.
6. If the candidate declines and a recovery clause applies, follow the receivable workflow above.

#### RBAC Requirements

| Action | Required Permission |
|--------|-------------------|
| Create agency bill | `bills:write` — Accounting / ovds |
| Approve agency payment | `bills:write` + `ovds:approve` — ovds |
| Issue debit note to agency | `bills:write` — Accounting / ovds |
| Create staff advance | `expenses:write` — HR / ovds |
| Approve advance recovery deduction | `payroll:admin` — HR |
| Write off unrecovered advance | `ovds:write` + `ovds:approve` — ovds |

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Creating and managing vendor bills | [Creating a Bill](./creating-a-bill.md) |
| Debit notes for vendor adjustments | [Creating a Bill → Debit Notes](./creating-a-bill.md#debit-notes) |
| WHT certificates for vendors | [Creating a Bill → WHT Certificates](./creating-a-bill.md#wht-certificates) |
| Fund transfers for reimbursements | [Banking → Bank Accounts → Fund Transfers](../05-banking/bank-accounts.md#fund-transfers-between-accounts) |
| Payroll deductions setup | [Advanced → Employee Self-Service](../08-advanced/employee-self-service.md#payroll-administration-reference) |
| Per-diem tier configuration | [Advanced → Employee Self-Service](../08-advanced/employee-self-service.md#payroll-administration-reference) |




