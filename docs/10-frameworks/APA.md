<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Accounting Process Automation (APA) — OVDS Guide

Manual accounting processes are time-consuming and error-prone. This guide explains what OVDS automates, how each automation works, and what you need to configure to get the most out of it.

---

## What Is Accounting Process Automation?

Accounting Process Automation (APA) uses software to replace manual, repetitive ovds tasks — data entry, approval routing, bank reconciliation, tax calculation, and report generation — with automated workflows that run without human intervention.

**Key benefits in OVDS:**

| Benefit | How OVDS Delivers It |
|---------|---------------------|
| Time savings | Cron jobs auto-compute VAT, depreciation, and recurring invoices |
| Accuracy | Prisma ORM + validated DTOs eliminate manual entry errors |
| Compliance | Ethiopian tax rates pre-loaded; ERCA QR on every invoice |
| Audit trail | Every automated action is logged with timestamp and user context |
| Real-time dashboards | Live KPIs update as transactions post — no month-end manual compilation |

---

## 1. Accounts Receivable (AR) Automation

### Automated Invoice Generation
OVDS generates recurring invoices automatically on a schedule:

1. Create an invoice → click **Make Recurring**
2. Set frequency: Weekly / Monthly / Quarterly / Annually
3. Set start date and end condition (after N cycles, or never)
4. The cron job runs daily at 06:00 EAT — invoices are generated and emailed automatically

**Cron:** `ovds.scheduler.ts` — `cronRecurringInvoices` (daily 06:00 EAT)

### Automated Overdue Flagging
No manual chasing required — OVDS moves invoices to `OVERDUE` automatically:

- Cron runs daily at 01:00 EAT
- Any `PENDING` invoice past its `dueDate` → status: `OVERDUE`
- ovds team sees overdue invoices highlighted in the AR Aging report
- Automated payment reminder emails fire based on the **Settings → invoice** reminder schedule

**Cron:** `ovds.scheduler.ts` — `cronFlagOverdueInvoices` (daily 01:00 EAT)

### Automated Payment Matching (Telebirr / Chapa)
When a customer pays via Telebirr or Chapa:

1. Gateway sends a webhook to OVDS (`POST /api/webhooks/telebirr` or `/api/webhooks/chapa`)
2. OVDS matches the payment reference to the open invoice automatically
3. Invoice status → `PAID`; GL entry posted (Dr Cash/Bank, Cr Accounts Receivable)
4. Payment confirmation email sent to customer
5. Unmatched payments are flagged in the transaction queue for manual review

> Zero manual steps for matched payments. Configure in **Settings → Payment Gateways**.

---

## 2. Accounts Payable (AP) Automation

### Scanned Bill Ingestion (OCR)
Upload a paper invoice photo or PDF — OVDS extracts the data automatically:

1. Go to **Purchases → Scanned Receipts** → click **Upload Receipt**
2. OVDS uses OpenAI GPT-4o or Gemini Vision to extract: vendor name, date, amount, VAT
3. Review the extracted values (typically < 10 seconds)
4. Confirm → a draft Bill is created and posted to the GL

**Setup:** Add `OPENAI_API_KEY` or `GEMINI_API_KEY` to `.env`.

### WHT Auto-Calculation
No manual WHT calculations needed:

- When a bill is saved, OVDS checks: Does the vendor have a TIN? Is the amount ≥ threshold?
- If yes → WHT (2%) is calculated automatically and shown as a separate line
- On payment: Dr AP (gross), Cr Cash (net), Cr WHT Payable
- Monthly WHT certificates generated automatically under **Purchases → WHT Certificates**

### PO-to-Bill Three-Way Match
The full purchase cycle — PO → GRN → Bill — is automated:

| Step | Action | Automated |
|------|--------|-----------|
| 1 | Create PO | Manual |
| 2 | Approve PO | Manual (RBAC gate) |
| 3 | Receive goods → GRN created | Manual click on PO |
| 4 | Bill pre-filled from PO/GRN | ✅ Auto |
| 5 | Three-way match check | ✅ Auto (flags discrepancies) |
| 6 | WHT calculation | ✅ Auto |
| 7 | GL posting on payment | ✅ Auto |

---

## 3. Bank Reconciliation Automation

### Smart Auto-Reconciliation
OVDS auto-matches bank statement lines to internal transactions using a 5-signal scoring engine:

| Signal | Score | Description |
|--------|-------|-------------|
| `EXACT_REF` | 95+ | Bank reference exactly matches invoice/bill reference |
| `QR_MATCH` | 97+ | ERCA QR code reference match |
| `FUZZY_REF` | 80+ | Reference fuzzy-matches within 20% edit distance |
| `AMOUNT_DATE` | 65+ | Same amount + same date |
| `AMOUNT_ONLY` | 40+ | Same amount, different date |

- Score ≥ 85 → auto-reconciled (no human review needed)
- Score 50–84 → proposed match (one-click confirm)
- Score < 50 → unmatched (manual review)

**How to use:**
1. Import bank statement via **Banking → Import Statement**
2. Go to the bank account → click **Reconcile**
3. Click **Run Auto-Reconciliation** → OVDS processes all unmatched transactions
4. Review the proposed and unmatched items
5. Click **Finish Reconciliation** when the difference = ETB 0.00

---

## 4. Payroll & Tax Automation

### Payroll Calculation
Payroll is fully automated once employee records are set up:

1. Click **Generate** in **HR → Payroll** for the month
2. OVDS calculates per employee:
   - Gross pay (base salary + allowances + overtime)
   - PIT (Ethiopian brackets per Proclamation 1395/2025)
   - Employee pension (7%, capped at ETB 15,000)
   - Employer pension (11%, capped at ETB 15,000)
   - Net pay = Gross − PIT − Employee Pension − Deductions
3. GL auto-posted on approval (IAS 19):
   - Dr Salary Expense, Cr Salary Payable, Cr PIT Payable, Cr Pension Payable

**Cron (monthly reminder):** `notifications.service.ts` — `cronPayrollReminder` (1st of month 07:00 EAT)

### VAT Auto-Computation
OVDS computes the monthly VAT return automatically:

1. Cron runs on the 1st of every month at 07:00 EAT
2. Aggregates all paid invoices (Output VAT) and paid bills (Input VAT) for the prior month
3. Creates a `VatFiling` record with status `DRAFT` and Net VAT = Output − Input
4. ovds reviews → clicks **Submit to eTax** to file

**Cron:** `ovds.scheduler.ts` — `cronVatAutoCompute` (1st of month 07:00 EAT)

> If the company had no transactions, a `ZERO_DECLARATION` is automatically flagged — you still need to file a zero return by the 30th.

### TOT Auto-Computation (Category B)
For businesses below the VAT threshold:

- Cron runs on the 1st of every month at 07:30 EAT
- Only fires if annual revenue < ETB 2M (Category B check)
- Creates a `TotFiling` record with status `DRAFT`

**Cron:** `ovds.scheduler.ts` — `cronTotAutoCompute` (1st of month 07:30 EAT)

### VAT Threshold Monitor
Warns when you're approaching the ETB 2M registration threshold:

- Cron runs on the 1st of every month at 09:00 EAT
- 80% of ETB 2M (ETB 1.6M) → yellow warning notification
- 100% of ETB 2M → red critical notification — VAT registration required

**Cron:** `ovds.scheduler.ts` — `cronVatThresholdMonitor` (1st of month 09:00 EAT)

### Automated Tax Deadline Notifications
OVDS sends reminder notifications before every tax deadline:

| Tax | Reminder | Schedule (EAT) |
|-----|----------|---------------|
| VAT | 10 days before 30th | 20th of month 08:00 |
| TOT | 8 days before 30th | 22nd of month 08:00 |
| WHT (generic) | Reminder to ovds | 25th of month 08:00 |
| WHT (smart) | Only if unremitted WHT > 0 | 25th of month 09:00 |
| Zero Declaration | If no filing submitted | 25th of month 08:00 |
| DRRF | 5 days before quarter end | 10th of Mar/Jun/Sep/Dec |
| BIT Annual | 37 days before Nov 7 | Oct 1st 08:00 |
| BIT Provisional | 6 days before each installment | Sep/Dec/Mar/Jun 1st |

---

## 5. Fixed Asset Depreciation Automation

Monthly depreciation runs automatically — no manual journal entries needed:

- Cron fires on the last day of each month at 23:00 EAT
- Calculates straight-line depreciation for all active assets: `(Cost − Residual) ÷ Useful Life ÷ 12`
- Creates journal entries: Dr Depreciation Expense / Cr Accumulated Depreciation
- Safe to re-run — skips assets already depreciated for the period

**Cron:** `ovds.scheduler.ts` — `cronMonthlyDepreciation` (last day of month 23:00 EAT)

---

## 6. Expense Management Automation

### Digital Receipt Capture
Employees submit expenses with photo receipts from the mobile browser:

1. Employee goes to **My Workspace → Expenses → New Expense**
2. Attaches a receipt photo (camera or file upload)
3. Submits → `PENDING` status
4. HR/ovds receives an in-app and email notification
5. One-click approve → GL posted automatically

### Automated Reimbursement via Payroll
Approved expenses with `reimbursement via payroll` are pulled into the next payroll run automatically — no separate payment needed.

---

## 7. Period Close Automation

### Pre-Close Trial Balance Check
Before locking a period, OVDS automatically verifies the trial balance:

```
GET /period-close/:year/:month/trial-balance
→ Returns: { isBalanced: true/false, totalDebits, totalCredits, difference }
```

If `isBalanced: false` → the lock is blocked (unless `force=true` is set by ovds role).

### Financial Snapshot on Lock
When a period is locked, OVDS automatically captures a financial snapshot:
- Revenue, Expenses, Net Profit, Total Assets at the moment of lock
- Stored in the audit log — provides an immutable record for each period
- Locked periods show a 🔒 indicator throughout the UI

---

## 8. IoT Billing Automation

For businesses with connected fiscal devices (POS, smart meters, vending machines):

1. IoT device sends a sale event → `POST /api/iot/telemetry`
2. `IotBillingService` evaluates against billing thresholds
3. `IotTaxBridgeService` calculates VAT/TOT automatically
4. Immutable `iot_fiscal_event` created (SHA-256 signed)
5. VAT output ledger updated in real time
6. Dashboard reflects the new balance within seconds

**End result:** Every IoT transaction is tax-compliant and audit-ready with zero manual steps.

> See [Advanced → IoT & POS Devices](../08-advanced/iot-and-pos.md) for setup and device registration.

---

## Automation Coverage Summary

| Process | Manual Steps Before OVDS | After OVDS |
|---------|--------------------------|-----------|
| Recurring invoice generation | Create each invoice manually | Zero — cron generates and emails |
| Invoice overdue flagging | Check dates daily | Zero — cron flags at 01:00 EAT |
| Payment matching | Match bank statements manually | Near-zero — auto-match on webhook |
| WHT calculation | Calculate 2% manually per bill | Zero — auto on every qualifying bill |
| VAT computation | Sum invoices and bills in spreadsheet | Zero — cron on 1st of month |
| Payroll PIT calculation | Apply tax brackets per employee | Zero — auto on Generate click |
| Depreciation | Manual journal entry per asset | Zero — cron on last day of month |
| Tax deadline reminders | Manual calendar entries | Zero — 13 automated notifications |
| Bank reconciliation | Match each line manually | Near-zero — 85%+ auto-matched |
| OCR bill extraction | Re-type vendor invoice data | < 30 seconds — AI extracts and confirms |



