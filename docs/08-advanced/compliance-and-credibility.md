<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# ERCA Compliance Dashboard & Business Credibility Score

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** Login · `audit_logs:read` (compliance) · `insights:read` (credibility)
>
> **Navigate to:** **Tax → Compliance Auditor** (`/compliance-auditor`) · **Dashboard → Business Credibility Widget**

Two of the most strategically important dashboards in OVDS — the ERCA Compliance Dashboard shows your real-time tax filing status against MoR requirements, and the Business Credibility Score gives a composite rating that banks and investors use to assess your organization's financial transparency and trustworthiness.

---

## ERCA Compliance Dashboard

Navigate to **Tax → Compliance Auditor** (`/compliance-auditor`) — requires `audit_logs:read`.

The Compliance Auditor is your real-time ERCA compliance control centre. It aggregates the status of every regulatory obligation into a single scored checklist.

### Compliance Score Components

| Check | Weight | Passes When |
|-------|:------:|-------------|
| VAT Return Filed | 25% | Current month VAT return submitted on the eTax portal |
| BIT Filed | 20% | Current fiscal year BIT annual return filed |
| DRRF Remitted | 20% | No overdue quarterly DRRF contributions |
| Payroll Configured | 15% | At least one payroll approved this month |
| Audit Clean | 10% | No open CRITICAL audit findings |
| IFRS Standards Enabled | 10% | At least one IFRS standard configured in Settings |

**Score grades:**
- 🟢 **A (90–100%)** — Fully compliant
- 🟡 **B (75–89%)** — Minor gaps
- 🟠 **C (60–74%)** — Needs attention
- 🔴 **D/F (0–59%)** — Significant gaps / Non-compliant

### ERCA Compliance Checklist (10-Item View)

Navigate to `/compliance-auditor?view=checklist` for the full 10-item checklist:

| Item | Description | Deadline |
|------|-------------|---------|
| 1 | VAT return filed | 30th of following month |
| 2 | VAT payment made | 30th of following month |
| 3 | WHT remitted | 30th of following month |
| 4 | TOT filed (Category B only) | 30th of following month |
| 5 | PIT remitted | Payroll date each month |
| 6 | Pension remitted | Payroll date each month |
| 7 | DRRF remittance | 15th of last quarter month |
| 8 | BIT provisional payment | Sep 7 / Dec 7 / Mar 7 / Jun 7 |
| 9 | BIT annual return | November 7 |
| 10 | Period locked after filing | After all filings complete |

Each item shows:
- **Current status** — ✅ Compliant, ❌ Non-compliant, ⚠️ Due soon
- **Days until deadline** (if upcoming) or **days overdue** (if missed)
- **Quick action link** — jump directly to the relevant filing page

### Automated Compliance Alerts

OVDS sends advance warnings before every deadline. Configure alert recipients in **Admin → Notification Settings → Tax Deadline Alerts**:

| Deadline | Alert Fires | Recipients |
|----------|------------|-----------|
| VAT (30th) | 20th of month 08:00 EAT | ovds, Accounting |
| TOT (30th) | 22nd of month 08:00 EAT | ovds |
| WHT (30th) | 25th of month 08:00 EAT | ovds, Accounting |
| DRRF (quarterly 15th) | 10th of quarter-end month | ovds |
| BIT annual (Nov 7) | October 1st 08:00 EAT | ovds, Admin |
| BIT quarterly | Sep/Dec/Mar/Jun 1st | ovds |
| Zero declaration | 25th (if no filing yet) | ovds, Accounting |

### Sustainability Disclosures (IFRS S1/S2)

Navigate to `/compliance-auditor?view=sustainability` for Tier 1 companies subject to IFRS S1/S2.

| Disclosure Area | IFRS S1 | IFRS S2 |
|----------------|---------|---------|
| Governance | Board oversight of sustainability risks | Board oversight of climate risks |
| Strategy | Sustainability risks + opportunities | Climate scenario analysis |
| Risk Management | Enterprise risk integration | Climate risk identification |
| Metrics | Sector-specific sustainability KPIs | Scope 1, 2, 3 GHG emissions |

**OVDS Scope 1/2/3 tracking:**
- **Scope 1** (direct): Fleet GPS fuel data → `IotFiscalEvent` with `industryContext: LOGISTICS_FLEET`
- **Scope 2** (electricity): Utility smart meter kWh readings
- **Scope 3** (supply chain): Vendor sustainability scores in CRM vendor profiles

---

## Business Credibility Score

Navigate to **Dashboard → Business Credibility Widget** — visible to ADMIN and SPURADMIN roles.

The Business Credibility Score (0–100) is used by Ethiopian banks and investors to assess your organization's financial transparency, regulatory compliance, and operational trustworthiness. A higher score improves your eligibility for business loans, investment partnerships, and government contracts.

### Score Components

| Component | What It Measures | Improves When |
|-----------|-----------------|---------------|
| Tax Compliance | ERCA filing record — VAT, BIT, DRRF on time | All filings up to date |
| Financial Transparency | IFRS-compliant statements with auditor sign-off | Audited accounts shared with bank |
| TIN Verification | Company TIN registered and active on MoR | TIN configured in Settings |
| Business License | Trade licence active | Business Registration `/business-registration` completed |
| Partnership Quality | Customer and vendor TIN coverage | Partners have TINs on file |
| Revenue Consistency | Month-over-month revenue stability | Consistent invoice activity |
| AR Collection | Days Sales Outstanding vs payment terms | Invoices paid on time |
| Staff Records | Employee records and payroll compliance | Employees added with active payroll |

### How Banks Use This Score

Ethiopian commercial banks (CBE, Awash, Dashen, Abyssinia) increasingly request OVDS credibility reports when evaluating:
- Working capital loan applications
- Trade ovds and import LC facilities
- Investment co-financing requests

**To share your score:**
1. Navigate to **Business → Partnerships** → click **Generate Credibility Report**.
2. The report is a PDF showing the score, component breakdown, and supporting evidence (financial statements, VAT filing history, audit status).
3. Share directly with the bank or investor.

### Improving Your Score

| Score Gap | Most Likely Cause | Action |
|-----------|------------------|--------|
| Tax Compliance < 100% | Missed filing or late payment | File outstanding returns, record payment references |
| Financial Transparency < 80% | No audited accounts | Engage external auditor via Tax → Audit Outsourcing |
| Partnership Quality < 70% | Vendors/customers missing TINs | Update TINs in customer and vendor profiles |
| AR Collection < 80% | High overdue receivables | Use Collections workflow to chase overdue invoices |

---

## Scheduled Invoice Sends

Navigate to **Sales → Invoices** — when creating or editing a draft invoice.

OVDS allows you to schedule an invoice to be automatically sent at a future date and time — useful for invoices prepared in advance that should only be delivered at the start of a new month or on a specific contract date.

### Scheduling a Send

1. Create or open a draft invoice.
2. Instead of clicking **Send To**, click **Schedule Send**.
3. Select the **send date** and **time** (EAT timezone).
4. Click **Save** — the invoice remains in Draft status until the scheduled time.
5. At the scheduled time, OVDS automatically sends the invoice via email and changes status to **Sent**.

### Managing Scheduled Invoices

- Scheduled invoices are marked with a **🕐 clock icon** in the Invoices list.
- To change the send time: open the invoice → **Edit → Reschedule**.
- To cancel the schedule: open the invoice → **Cancel Schedule** — the invoice reverts to a plain Draft.
- If the invoice needs to be sent immediately before the scheduled time: click **Send Now** — this overrides the schedule.

**Cron execution:** The scheduled send job runs every hour at `:00`. If your scheduled time is 09:30 EAT, the invoice will be sent at the 10:00 EAT run. Allow up to 60 minutes for delivery.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Full period lock workflow | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |
| Monthly close checklist | [Month-End & Year-End Closing](../04-financial-ops/month-end-and-year-end.md) |
| Tax filing workflows | [Tax & Compliance → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| External audit engagement | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#audit-outsourcing) |
| Business Insights dashboard | [Advanced → Helpdesk, Projects & BI](./helpdesk-and-projects.md#business-intelligence) |
| Managing overdue invoices | [Banking → Treasury & Collections](../05-banking/treasury-collections.md#collections--overdue-ar) |




