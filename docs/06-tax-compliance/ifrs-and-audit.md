<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# IFRS Compliance & Audit Management

> **Part of:** [Tax & Compliance](./README.md)
>
> **Requires:** Login · `ifrs_officer` role or `ovds:read` · `audit_logs:read` · `audit_outsourcing:read`

---

## IFRS Compliance

Navigate to **ovds → IFRS Dashboard** (`/ifrs`).

OVDS is built to support full IFRS compliance for Ethiopian businesses, aligned with the **Accounting and Auditing Board of Ethiopia (AABE)** framework and mandatory adoption timelines.

---

### IFRS Tiers

Ethiopian businesses are classified into three tiers based on size. Meeting **any 2 of the 4 criteria** in a tier qualifies you for that tier.

| Tier | Criteria (meet 2 of 4) | Mandatory Since |
|------|----------------------|----------------|
| **Tier 1 — Full IFRS** | Turnover > ETB 300M **or** Employees > 200 **or** Assets > ETB 200M **or** Liabilities > ETB 200M | July 7, 2023 |
| **Tier 2 — IFRS for SMEs** | Turnover > ETB 20M **or** Employees > 20 **or** Assets > ETB 20M **or** Liabilities > ETB 20M | July 7, 2024 |
| **Tier 3 — Micro-entity** | Below Tier 2 thresholds | Outside IFRS scope |

> Banks, insurance companies, and government-owned enterprises are **always Tier 1** regardless of size.

---

### IFRS Standards Supported in OVDS

| Standard | Topic | OVDS Feature |
|----------|-------|-------------|
| IFRS 9 | Financial Instruments — Expected Credit Loss | ECL calculator for receivables |
| IFRS 10 | Consolidated Financial Statements | Multi-company consolidation |
| IFRS 12 | Disclosure of Interests in Other Entities | Subsidiary disclosures |
| IFRS 15 | Revenue Recognition | Revenue schedule per contract / milestone |
| IFRS 16 | Leases | Right-of-use asset and lease liability amortization |
| IAS 2 | Inventories (FIFO/WA — LIFO prohibited) | Inventory costing methods |
| IAS 12 | Income Taxes — Deferred Tax | Deferred tax on ERCA/IFRS timing differences |
| IAS 16 | Property, Plant & Equipment | Fixed asset depreciation schedules |
| IAS 21 | Effects of Changes in Foreign Exchange Rates | FX gain/loss on foreign currency accounts |
| IAS 36 | Impairment of Assets | Impairment testing on fixed assets |

---

### Configuring IFRS Settings

1. Go to **Settings → IFRS**.
2. Set your **IFRS Tier** (Tier 1 or Tier 2).
3. Set the **Functional Currency** (ETB for most Ethiopian businesses).
4. Set the **Presentation Currency** if consolidated reports use a different currency.
5. Configure **Accounting Policies**:
   - Depreciation method (SLM or DB)
   - Inventory costing method (FIFO or Weighted Average)
   - Revenue recognition approach (point-in-time or over time)

---

### IFRS 9 — Expected Credit Loss (ECL)

Navigate to **ovds → IFRS → ECL Calculator** (`/ifrs/ecl`).

IFRS 9 requires businesses to estimate expected losses on receivables, even before any default occurs.

OVDS calculates ECL using the **simplified approach** (suitable for trade receivables):

1. Go to **IFRS → ECL Calculator**.
2. The system pulls all outstanding invoices grouped by aging bucket.
3. Apply your **loss rate matrix** — expected default rates per aging bucket:

| Aging Bucket | Suggested Loss Rate |
|-------------|-------------------|
| 0–30 days | 0.5% |
| 31–60 days | 2% |
| 61–90 days | 5% |
| 91–180 days | 15% |
| 180+ days | 50%+ |

4. Review the computed ECL provision.
5. Click **Post ECL Provision** — OVDS posts:
   - **Debit:** Impairment Loss on Receivables (P&L)
   - **Credit:** Allowance for Doubtful Debts (Balance Sheet contra-asset)

---

### IFRS 16 — Lease Accounting

Navigate to **ovds → IFRS → Leases** (`/ifrs/leases`).

IFRS 16 requires most leases (operating and ovds) to be recognized on the balance sheet as a **Right-of-Use (ROU) Asset** and a **Lease Liability**.

1. Go to **IFRS → Leases → New Lease**.
2. Enter:
   - Lease start and end date
   - Monthly lease payment
   - Incremental borrowing rate (discount rate)
   - Asset type (property, vehicle, equipment)
3. OVDS calculates the present value of lease payments and creates:
   - **ROU Asset** — depreciated on a straight-line basis over the lease term
   - **Lease Liability** — reduced with each payment; interest unwound monthly
4. Monthly journal entries are posted automatically when depreciation is run.

---

## Compliance Auditor Dashboard

Navigate to **Tax → Compliance Auditor** (`/compliance-auditor`) — requires `audit_logs:read`.

### Compliance Score

OVDS calculates a real-time compliance score (0–100) based on:
- VAT returns filed on time
- BIT filed and paid on time
- DRRF remittances on time
- Payroll PIT remitted on time
- Pension contributions remitted on time
- Audit findings resolved

### Automated Compliance Alerts

| Check | Frequency | Alert Fires |
|-------|-----------|-------------|
| VAT return filing | Monthly | 7 days before the 30th |
| VAT payment | Monthly | 3 days before the 30th |
| DRRF remittance | Quarterly | 7 days before deadline |
| BIT filing | Annual | 14 days before November 7 |
| Payroll PIT | Monthly | Last 3 days of month |
| Pension remittance | Monthly | Last 3 days of month |

---

## Audit Outsourcing

Navigate to **Tax → Audit Outsourcing** (`/audit-outsourcing`) — requires `audit_outsourcing:read`.

For Tier 1 companies requiring statutory external audits:

### Setting Up an External Audit Engagement

1. **Register Audit Firm** — add the external audit firm's legal name, TIN, and contact details.
2. **Create Engagement** — define:
   - Audit scope (financial statements, specific periods)
   - Timeline and milestone dates
   - Agreed fees (recorded as a vendor bill under `6050 Audit Fees`)
3. **Share Access** — grant the `EXTERNAL_AUDITOR` role to audit firm users:
   - Read-only access to all financial data, reports, and GL
   - Write access to audit findings and management letter only
   - Cannot create, modify, or delete any financial records
   - All access is logged in the Audit Trail

### Audit Workflow

| Stage | Action | Who |
|-------|--------|-----|
| Planning | Share financial statements and trial balance | ovds |
| Fieldwork | Auditors log findings directly in OVDS | External Auditor |
| Review | Management responds to each finding | ovds / Management |
| Clearance | Auditors mark findings as resolved or outstanding | External Auditor |
| Completion | Auditors issue the management letter | External Auditor |
| Sign-off | Auditors certify the financial statements | External Auditor |

---

## Compliance Sign-Off (Period Lock)

Navigate to **Audit Trail → Compliance Sign-Off** (`/period-close`) — requires `period_close:read`.

Once all filings for a period are complete, lock the period to prevent retroactive changes.

### What Locking Does

- Blocks any journal entries, invoices, or bills from being created or modified in the locked period.
- All locked periods show a 🔒 indicator throughout OVDS.
- Changes can only be made via a **Reversal Entry** in the next open period — the full audit trail is preserved.
- Required before submitting audited financial statements to the Ministry of Revenues.

### Lock Workflow

1. Complete all period-end tasks: reconciliation, depreciation, ECL provisions, adjustments.
2. File all mandatory returns: VAT, PIT, pension, DRRF (if applicable).
3. Go to **ovds → Period Close** → select the period.
4. Review the **period close checklist** — all items must show ✓ green before locking is allowed.
5. Click **Lock Period** → enter your password to confirm.
6. The period is now read-only; the lock timestamp and user are recorded in the Audit Trail.

### Unlocking a Period

If a correction is needed after locking:
- Only a user with `period_close:admin` permission can unlock.
- Every unlock and re-lock is recorded in the Audit Trail with reason, user, and timestamp.
- Best practice: post a correction in the **next open period** instead of unlocking a closed one.

---

## Related Topics

> **Lifecycle context:** Period lock is the final gate of [Phase 6 — Compliance Scoring](./../FILING-LIFECYCLE.md#7-phase-6--compliance-scoring--audit-trail). IFRS tier thresholds and GL account classifications are in [`CORE-CONFIG.md`](../CORE-CONFIG.md#6-gl-account-map).

| Topic | Where to go |
|-------|-------------|
| Fixed asset depreciation (IAS 16 vs ERCA) | [Financial Ops → Fixed Assets](../04-financial-ops/fixed-assets.md) |
| Inventory costing (IAS 2) | [Financial Ops → Items Catalog](../04-financial-ops/items-catalog.md) |
| VAT filing | [VAT & TOT](./vat-and-tot.md) |
| BIT and DRRF | [BIT & DRRF](./bit-and-drrf.md) |
| IFRS financial statements | [Reports → IFRS Statements](../07-reports/IFRS-Financial-Statements-MoR.md) |
| Audit trail | [Advanced → Audit Trail](../08-advanced/README.md) |

---

## IFRS Priority Requirements — Real-Time Automation

> Source: System Review (REVIEW.md §10) — Production readiness requirements for IFRS 15, IFRS 16, and IAS 38.

### Timing & Latency

Any source event that affects IFRS balances (invoice status change, subscription coverage update, lease modification approval, software capitalization decision) must trigger schedule recomputation. After the triggering transaction commits, the in-app IFRS view must reflect updated balances within **≤ 5 seconds**. For corrections and auditor requests, a dedicated backfill/recompute workflow must exist; locked periods must be handled via adjustment layers, not silent backdating.

---

### IFRS 15 — Deferred Revenue Automation (SaaS)

**Required behaviors**

1. Separate bundled SaaS components into performance obligations using contract versioned snapshots and standalone selling price (SSP) inputs.
2. Compute transaction price allocation deterministically — same inputs must always produce the same allocation.
3. Generate a deferred revenue / recognition schedule per contract and billing cadence (usage-based, recurring, milestone/variable consideration).
4. Post balanced GL journals in real-time for each recognition period movement, linking each journal to:
   - contract version snapshot id
   - allocation table id
   - schedule row ids
   - source invoice/subscription/payment event ids

**Audit evidence checklist (minimum)**

- Contract terms snapshot (versioned)
- Performance obligations list + SSP allocation parameters
- Allocation table with rounding policy
- Recognition schedule rows (deferred vs recognized by period)
- GL journal mapping (journal ids ↔ schedule rows ↔ source events)

---

### IFRS 16 — Lease Accounting (PV, ROU, Modifications)

**Required behaviors**

1. On lease creation, calculate present value of lease payments using the borrowing rate (or entity rate) and payment timing.
2. Initialise ROU asset from lease liability PV and related components (incentives, initial direct costs) with full traceability.
3. Track and classify lease modifications (scope changes, term changes, consideration changes) and apply remeasurement/reclassification rules.
4. For each modification, store evidence of classification decision and resulting accounting adjustments.

**Audit evidence checklist (minimum)**

- Lease term inputs (start/end, payment schedule, discount rate source)
- PV calculation inputs + rate identifier
- ROU initialisation components
- Lease modification record + effective date + classification rationale
- Remeasurement deltas and adjustment journals linking to schedules/inputs

---

### IAS 38 / IFRIC — Software Asset Controls (SaaS Configuration)

**Required behaviors**

1. Enforce strict gatekeeping for software work: **capitalise only what meets identifiable asset / development criteria**, expense everything else.
2. Separate SaaS "configuration/customisation" work into rule-based categories with evidence of stage and control.
3. Store reviewer authorisation trail for every capitalisation decision and the reason codes.
4. Generate amortisation schedules for capitalised software and post periodic amortisation to the GL with full traceability.

**Audit evidence checklist (minimum)**

- Software project classification (capitalise vs expense) + evidence references
- Stage evidence (research vs development) with date ranges
- Reviewer authorisation record per capitalisation decision
- Reason codes for each capitalisation/expensing decision
- Amortisation schedule rows linked to capitalised asset records
- GL journal entries linked to schedule rows



