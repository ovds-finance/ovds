<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# IFRS Financial Statements & MoR Submission Guide
## ፋይናንሻል ስቴትመንቶች ዝግጅት እና ወደ ሚኒስቴር ገቢዎች ማቅረቢያ | Amharic–English Bilingual Reference

> **Applicable Standards:** IAS 1, IAS 2, IAS 7, IAS 16, IAS 36, IAS 37, IFRS 9, IFRS 15, IFRS 16  
> **Jurisdiction:** Federal Democratic Republic of Ethiopia — Ministry of Revenues (MoR / ERCA)  
> **Fiscal Year:** Ethiopian Calendar — ends Sene 30 (≈ July 7/8 Gregorian)  
> **Basis:** Accrual accounting per IAS 1 §27

---

## Overview: The IFRS Accounting Cycle in Ethiopia

The Ethiopian Accounting and Auditing Board of Ethiopia (AABE) mandates IFRS for qualifying entities. OVDS implements the full IFRS accounting cycle — from raw transaction capture through final MoR submission — in one connected workflow.

```
Data Collection → Journal Entries → Ledger Posting → Trial Balance
       ↓
Adjusting Entries → Financial Statements (4 + Notes) → MoR Submission
```

### Practical Report Preparation Scope — Ethiopia IFRS + MoR

Company registration in Ethiopia is more than obtaining a certificate. It is the legal foundation for the business relationship between founders, investors, government authorities, employees, lenders, customers, suppliers, and other third parties. The 2021 Commercial Code expanded the available structures, including the One-Person Company and Limited Liability Partnership, but successful operation still depends on careful entity planning, complete formation documents, accurate tax registration, current licences, and disciplined accounting records.

For MoR reporting, the financial statement package should be prepared from the existing accounting cycle and then reshaped into IFRS presentation and disclosure format. The working file must connect source documents, accounting entries, payroll deductions, VAT records, pension remittances, audit evidence, and the final tax computation so the report is traceable from original invoice to filed return.

The practical sequence is:

1. **Data collection:** Gather sales invoices, purchase invoices, receipts, payroll records, employee contracts, bank statements, fixed asset schedules, pension records, VAT returns, withholding tax records, and business licence documents.
2. **Journal entries:** Record transactions under double-entry bookkeeping using accrual accounting. Revenue is recognised when earned under IFRS 15, and expenses are recognised when incurred.
3. **Ledger posting:** Post entries to the general ledger with clear separation of assets, liabilities, equity, income, and expenses.
4. **Trial balance:** Prepare the unadjusted trial balance and resolve any debit-credit imbalance before reporting.
5. **Adjusting entries:** Post accruals, prepayments, depreciation under IAS 16, ECL allowances under IFRS 9, lease entries under IFRS 16, employee benefit accruals under IAS 19, and provisions under IAS 37.
6. **Financial statements:** Prepare the Statement of Profit or Loss, Statement of Financial Position, Statement of Cash Flows, Statement of Changes in Equity, and Notes to the Accounts.
7. **HR and payroll integration:** Include recruitment, onboarding, training, performance, employee relations, labour-law compliance costs, salaries, employer pension, employee pension, PIT, leave accruals, severance obligations, and other employee benefits in the correct IAS 19 classifications.
8. **Audit and compliance review:** Apply Ethiopian audit expectations and ISA-based audit evidence mapping before filing: source-document testing, bank confirmations, payroll reconciliation, VAT/BIT reconciliation, fixed asset verification, related-party review, going-concern assessment, and management responsibility approval.
9. **MoR submission:** Prepare the audited financial statements, tax computation, VAT/BIT reconciliation, payroll and pension support, registration documents, signed declarations, and eTax submission evidence for final filing with the Ministry of Revenues.

The objective is a MoR-ready report that is clear enough for management, traceable enough for external auditors, and structured enough for IFRS users while still matching Ethiopian tax filing practice.

---

## 1. IFRS Tier Classification (AABE Thresholds)

| Tier | Criteria (meet 2 of 4) | Applicable Standards | Mandatory Since |
|------|------------------------|----------------------|----------------|
| **Tier 1 — Full IFRS** | Turnover > ETB 300M **or** Employees > 200 **or** Assets > ETB 200M **or** Liabilities > ETB 200M | Full IFRS (all IAS/IFRS) | July 7, 2023 |
| **Tier 2 — IFRS for SMEs** | Turnover > ETB 20M **or** Employees > 20 **or** Assets > ETB 20M **or** Liabilities > ETB 20M | IFRS for SMEs | July 7, 2024 |
| **Tier 3 — Micro-entity** | Below Tier 2 thresholds | Ethiopian Reporting Standard | Outside IFRS scope |

> Banks, insurance companies, and government-owned enterprises are **always Tier 1** regardless of size.


---

## 2. Step-by-Step IFRS Accounting Cycle

### Step 1 — Data Collection (የሰነዶች መሰብሰብ)

Gather all source documents before starting. Ethiopian MoR requires proper documentation for all tax filings.

| Document Type | Purpose | MoR Requirement |
|--------------|---------|----------------|
| Sales Invoices (with ERCA QR) | Output VAT base | Mandatory — must have TIN + QR code |
| Purchase Invoices | Input VAT claims | Must be from VAT-registered vendor |
| Payroll Records | PIT + Pension deductions | Employee-level breakdown required |
| Bank Statements | Cash reconciliation | All accounts, full month |
| Receipts & Expense Claims | Deductible expenses | Required to support BIT deductions |
| Fixed Asset Register | Depreciation base (IAS 16) | Supports asset schedule on return |
| Loan / Lease Agreements | ovds costs, IFRS 16 | Carry-forward schedules |
| Pension Remittance Receipts | Employer obligation | ERCA cross-reference |

**In OVDS:** Navigate to **ovds → Import Center** to import any missing source data, or verify completeness via **Accounting Dashboard**.

---

### Step 2 — Journal Entries (የሒሳብ ምዝገባ)

Record every transaction using **double-entry bookkeeping**. IFRS mandates the **accrual basis** (IAS 1 §27) — recognize revenue when earned (IFRS 15), recognize expenses when incurred.

#### Standard Journal Entry Types

| Transaction | Debit | Credit | IFRS Reference |
|------------|-------|--------|---------------|
| Sales on credit | Accounts Receivable | Revenue | IFRS 15 |
| Cash received from customer | Cash | Accounts Receivable | IAS 7 |
| Purchase of goods | Inventory / COGS | Accounts Payable | IAS 2 |
| Salary expense | Salaries Expense | Salaries Payable | IAS 19 |
| VAT collected | Cash / AR | VAT Payable (Output) | Proc. 1341/2024 |
| VAT paid on purchase | VAT Receivable (Input) | Accounts Payable | Proc. 1341/2024 |
| Depreciation | Depreciation Expense | Accumulated Depreciation | IAS 16 |
| Pension — Employee (7%) | Salaries Expense | Pension Payable | IAS 19 |
| Pension — Employer (11%) | Pension Expense | Pension Payable | IAS 19 |
| PIT deducted | Salaries Expense | PIT Payable | Proc. 979/2016 |
| Lease payment (IFRS 16) | Lease Liability + Interest | Cash | IFRS 16 |

**In OVDS:** Navigate to **Accounting → Journal Entries** (`/journal-entries`). All invoice, bill, and payroll entries post automatically. Manual entries are available for adjustments.


---

### Step 3 — Ledger Posting (ወደ ዋናው ሒሳብ ደፍተር ማስተላለፍ)

Transfer journal entries to the **General Ledger (GL)**. IFRS requires clear separation of five element categories:

| Element | Examples | Normal Balance |
|---------|----------|---------------|
| **Assets** | Cash, AR, Inventory, PPE | Debit |
| **Liabilities** | AP, VAT Payable, Loans | Credit |
| **Equity** | Share Capital, Retained Earnings | Credit |
| **Income** | Sales Revenue, Service Revenue | Credit |
| **Expenses** | COGS, Salaries, Depreciation | Debit |

**In OVDS:** Navigate to **Reports → Financial → General Ledger**. Filter by account, date range, or department. Every transaction is auto-posted to the correct GL account based on the Chart of Accounts.

---

### Step 4 — Trial Balance (ሙከራ ሚዛን)

Verify that total debits equal total credits. The trial balance is the foundation for all IFRS financial statements.

```
Total Debits = Total Credits  ✓

If not equal → locate posting error before proceeding to financial statements
```

**In OVDS:** Navigate to **Reports → Financial → Trial Balance**. Use the **Unadjusted** version before adjusting entries, and **Adjusted** version after.

---

### Step 5 — Adjusting Entries (ማስተካከያ ምዝገባዎች)

IFRS requires specific period-end adjustments before closing the books. These ensure the accrual principle is correctly applied.

#### 5a. Accruals (ያልተከፈሉ ወጪዎች)

| Accrual | Debit | Credit |
|---------|-------|--------|
| Unpaid salaries (end of month) | Salaries Expense | Accrued Salaries Payable |
| Utilities incurred, not yet billed | Utilities Expense | Accrued Utilities Payable |
| Interest on loans (accrued) | Interest Expense | Accrued Interest Payable |
| Audit fees earned, not invoiced | Audit Fee Expense | Accrued Professional Fees |

#### 5b. Prepayments (አስቀድሞ የተከፈሉ ወጪዎች)

| Prepayment | Debit | Credit |
|-----------|-------|--------|
| Rent paid in advance (expired) | Rent Expense | Prepaid Rent |
| Insurance premium (expired) | Insurance Expense | Prepaid Insurance |
| Subscription (expired portion) | Subscription Expense | Prepaid Subscriptions |

#### 5c. Depreciation — IAS 16 (የሀብት ዋጋ መቀነስ)

```
Straight-Line Method (IAS 16):
  Annual Depreciation = (Cost − Residual Value) ÷ Useful Life (years)
  Monthly Depreciation = Annual Depreciation ÷ 12
```

| Asset Class | IFRS Useful Life | ERCA Tax Rate (Reference) |
|------------|-----------------|--------------------------|
| Buildings | 20–50 years | 5% per year |
| Machinery & Equipment | 5–10 years | 20% per year |
| Motor Vehicles | 4–5 years | 20% per year |
| Computers & IT | 3–5 years | 25% per year |
| Furniture & Fixtures | 5–10 years | 10% per year |

> **Note:** IFRS depreciation is based on economic useful life and management judgment. Tax depreciation uses ERCA's fixed rates. The difference creates a **temporary tax difference** (deferred tax under IAS 12).

#### 5d. Provisions — IAS 37 (ድጋፍ / ክምችት)

Record provisions when a present obligation exists, an outflow is probable, and the amount can be reliably estimated.

| Provision Type | Example | Debit | Credit |
|---------------|---------|-------|--------|
| Tax dispute | Pending ERCA audit | Tax Dispute Expense | Provision for Tax Dispute |
| Employee severance | Potential redundancy | Severance Expense | Provision for Severance |
| Warranty (if applicable) | Product returns | Warranty Expense | Warranty Provision |
| Bad debt (IFRS 9 ECL) | Overdue receivables | Impairment Expense | Allowance for Doubtful Debts |

**In OVDS:** Go to **Accounting → Journal Entries → New Entry** to post all adjusting entries. OVDS auto-calculates depreciation from the Fixed Asset register — navigate to **ovds → Fixed Assets** to review and post the depreciation run.


---

## 3. Financial Statements (IFRS Format)

IFRS requires four primary statements plus notes. In OVDS navigate to **Reports → Financial** to generate all four.

---

### Statement 1 — Statement of Profit or Loss (የገቢና ወጪ መግለጫ)
**Standard:** IAS 1 §81–105 | **Period:** 12 months ended Sene 30 (July 7)

```
══════════════════════════════════════════════════════════════════
          ABC TRADING PLC — ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
    STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME
            የገቢና ወጪ እና አጠቃላይ ሌሎች ሃብት/ኪሳራ መግለጫ
         For the Year Ended Sene 30, 2016 E.C. (July 7, 2024)
══════════════════════════════════════════════════════════════════
                                        2016 E.C.      2015 E.C.
                               Note     ETB             ETB
──────────────────────────────────────────────────────────────────
REVENUE (ገቢ)
  Sales Revenue                  4    4,850,000       4,200,000
  Service Revenue                4      350,000         280,000
  Other Income                   5       45,000          30,000
                                      ─────────       ─────────
  TOTAL REVENUE (ጠቅላላ ገቢ)           5,245,000       4,510,000

COST OF GOODS SOLD (የሸቀጣሸቀጥ ዋጋ)
  Opening Inventory              6      480,000         390,000
  Add: Purchases                       2,100,000       1,850,000
  Less: Closing Inventory        6     (520,000)       (480,000)
                                      ─────────       ─────────
  TOTAL COGS (ጠቅላላ የሸቀጣሸቀጥ ዋጋ)      2,060,000       1,760,000
                                      ─────────       ─────────
GROSS PROFIT (ጠቅላላ ትርፍ)              3,185,000       2,750,000

OPERATING EXPENSES (የሥራ ወጪዎች)
  Salaries & Benefits            7      820,000         710,000
  Pension — Employer (11%)       7       90,200          78,100
  Rent & Utilities               8      180,000         156,000
  Depreciation (IAS 16)          9       96,000          88,000
  Marketing & Advertising               64,000          52,000
  Professional Fees (Audit/Legal)       45,000          38,000
  Impairment — Bad Debt (IFRS 9) 10      18,000          12,000
  Other Administrative                  55,000          47,000
                                      ─────────       ─────────
  TOTAL OPERATING EXPENSES           1,368,200       1,181,100
                                      ─────────       ─────────
OPERATING PROFIT / EBIT              1,816,800       1,568,900
  (የሥራ ትርፍ)

  ovds Costs (Interest)       11     (72,000)        (60,000)
                                      ─────────       ─────────
PROFIT BEFORE TAX (ከግብር በፊት ትርፍ)    1,744,800       1,508,900

  Income Tax — BIT 30%           12    (523,440)       (452,670)
  MAT Check (2.5% of Revenue)        = 131,125        = 112,750
  Tax Payable = MAX(BIT, MAT)         (523,440)       (452,670)
                                      ─────────       ─────────
NET PROFIT AFTER TAX                  1,221,360       1,056,230
  (ከግብር በኋላ የተጣራ ትርፍ)
══════════════════════════════════════════════════════════════════
  Earnings Per Share (ETB)              12.21           10.56
══════════════════════════════════════════════════════════════════
```


---

### Statement 2 — Statement of Financial Position (የፋይናንሻል ሁኔታ መግለጫ / ባላንስ ሺት)
**Standard:** IAS 1 §54–76 | **As at:** Sene 30, 2016 E.C. (July 7, 2024)

```
══════════════════════════════════════════════════════════════════
          ABC TRADING PLC — ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
              STATEMENT OF FINANCIAL POSITION
                   የፋይናንሻል ሁኔታ መግለጫ
              As at Sene 30, 2016 E.C. (July 7, 2024)
══════════════════════════════════════════════════════════════════
                                        2016 E.C.      2015 E.C.
                               Note     ETB             ETB
──────────────────────────────────────────────────────────────────
ASSETS (ሃብቶች)

NON-CURRENT ASSETS (ቋሚ ሃብቶች)
  Property, Plant & Equipment    9      960,000       1,056,000
  Less: Accumulated Depreciation        (96,000)        (88,000)
  Net PPE (IAS 16)                       864,000         968,000
  Intangible Assets (Software)   13      48,000          60,000
  Right-of-Use Assets (IFRS 16)  14      210,000         252,000
                                       ─────────       ─────────
  Total Non-Current Assets             1,122,000       1,280,000

CURRENT ASSETS (ተንቀሳቃሽ ሃብቶች)
  Inventories (IAS 2 — FIFO)      6      520,000         480,000
  Trade Receivables (net of ECL) 10      680,000         590,000
  Input VAT Receivable                    42,000          38,000
  Prepaid Expenses                        36,000          28,000
  Cash and Cash Equivalents      15      875,360         654,000
                                       ─────────       ─────────
  Total Current Assets                 2,153,360       1,790,000
                                       ─────────       ─────────
TOTAL ASSETS (ጠቅላላ ሃብቶች)             3,275,360       3,070,000
══════════════════════════════════════════════════════════════════

EQUITY AND LIABILITIES (ፍትሃዊ ድርሻ እና ዕዳዎች)

EQUITY (ፍትሃዊ ድርሻ)
  Share Capital                  16      500,000         500,000
  Retained Earnings (b/f)                853,000         546,770
  Net Profit for the Year              1,221,360       1,056,230
                                       ─────────       ─────────
  TOTAL EQUITY                         2,574,360       2,103,000

NON-CURRENT LIABILITIES (ረጅም ጊዜ ዕዳዎች)
  Long-term Loan                 17      200,000         320,000
  Lease Liability — Long-term    14      140,000         168,000
  Deferred Tax Liability (IAS 12) 12      36,000          30,000
                                       ─────────       ─────────
  Total Non-Current Liabilities          376,000         518,000

CURRENT LIABILITIES (አጭር ጊዜ ዕዳዎች)
  Trade Payables                          98,000          82,000
  VAT Payable (Output − Input)     1      52,000          44,000
  PIT Payable (Employee Tax)       7      28,000          24,000
  Pension Payable (7% + 11%)       7      36,000          31,000
  Accrued Salaries                        48,000          42,000
  Current Portion — Loan          17      63,000          72,000
  Current Portion — Lease         14      20,000          20,000
  Provision for Tax (IAS 37)      12      (0,000)         (0,000)
                                       ─────────       ─────────
  Total Current Liabilities              325,000         315,000
                                       ─────────       ─────────
TOTAL EQUITY AND LIABILITIES           3,275,360       3,070,000
══════════════════════════════════════════════════════════════════
```


---

### Statement 3 — Statement of Cash Flows (የጥሬ ገንዘብ ፍሰት መግለጫ)
**Standard:** IAS 7 — Indirect Method | **Period:** Year ended Sene 30, 2016 E.C.

```
══════════════════════════════════════════════════════════════════
          ABC TRADING PLC — ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
              STATEMENT OF CASH FLOWS
                 የጥሬ ገንዘብ ፍሰት መግለጫ
         For the Year Ended Sene 30, 2016 E.C. (July 7, 2024)
══════════════════════════════════════════════════════════════════
                                        2016 E.C.      2015 E.C.
                               Note     ETB             ETB
──────────────────────────────────────────────────────────────────
A. OPERATING ACTIVITIES (የሥራ እንቅስቃሴ)
   Net Profit Before Tax               1,744,800       1,508,900

   Adjustments for non-cash items:
     Add: Depreciation (IAS 16)           96,000          88,000
     Add: Impairment — ECL (IFRS 9)       18,000          12,000
     Add: ovds Costs (Interest)        72,000          60,000
     Add: Amortisation — Intangibles      12,000          12,000

   Changes in Working Capital:
     (Increase)/Decrease in Receivables  (90,000)        (75,000)
     (Increase)/Decrease in Inventory    (40,000)        (55,000)
     (Increase)/Decrease in Prepayments   (8,000)         (5,000)
     Increase/(Decrease) in Payables      16,000          14,000
     Increase/(Decrease) in VAT Payable    8,000           7,000
     Increase/(Decrease) in Accruals       6,000           5,000
                                         ─────────       ─────────
   Cash Generated from Operations       1,834,800       1,571,900
     Income Tax Paid                     (515,440)       (444,670)
     Interest Paid                        (72,000)        (60,000)
                                         ─────────       ─────────
   NET CASH FROM OPERATING ACTIVITIES   1,247,360       1,067,230

──────────────────────────────────────────────────────────────────
B. INVESTING ACTIVITIES (የኢንቨስትመንት እንቅስቃሴ)
     Purchase of Fixed Assets             (0,000)       (120,000)
     Purchase of Intangible Assets         (0,000)        (72,000)
     Proceeds from Asset Disposal          0,000           0,000
                                         ─────────       ─────────
   NET CASH FROM INVESTING ACTIVITIES        0,000       (192,000)

──────────────────────────────────────────────────────────────────
C. FINANCING ACTIVITIES (የፋይናንስ እንቅስቃሴ)
     Loan Repayment                      (129,000)       (120,000)
     Lease Liability Payments (IFRS 16)   (28,000)        (28,000)
     Dividends Paid                        (869,000)     (741,000)
                                         ─────────       ─────────
   NET CASH FROM FINANCING ACTIVITIES  (1,026,000)       (889,000)

──────────────────────────────────────────────────────────────────
   NET INCREASE IN CASH                   221,360         (13,770)
   Opening Cash Balance                   654,000         667,770
                                         ─────────       ─────────
   CLOSING CASH BALANCE                   875,360         654,000
══════════════════════════════════════════════════════════════════
```


---

### Statement 4 — Statement of Changes in Equity (የፍትሃዊ ድርሻ ለውጥ መግለጫ)
**Standard:** IAS 1 §106–110 | **Period:** Year ended Sene 30, 2016 E.C.

```
══════════════════════════════════════════════════════════════════
          ABC TRADING PLC — ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
           STATEMENT OF CHANGES IN EQUITY
              የፍትሃዊ ድርሻ ለውጥ መግለጫ
      For the Year Ended Sene 30, 2016 E.C. (July 7, 2024)
══════════════════════════════════════════════════════════════════
                      Share     Retained   Revaluation  Total
                      Capital   Earnings   Reserve      Equity
                      ETB       ETB        ETB          ETB
──────────────────────────────────────────────────────────────────
Balance at Sene 30,
  2015 E.C.           500,000   546,770      0          1,046,770

Net Profit (2015 E.C.)      —  1,056,230    —          1,056,230
Dividends Paid              —   (741,000)   —           (741,000)
Revaluation Surplus         —         —     0                  0
Other Comprehensive
  Income (OCI)              —         —     0                  0
                      ──────   ─────────   ─────       ─────────
Balance at Sene 30,
  2016 E.C. (Opening) 500,000   862,000      0          1,362,000
                      ──────   ─────────   ─────       ─────────
Net Profit (2016 E.C.)      —  1,221,360    —          1,221,360
Dividends Paid              —   (869,000)   —           (869,000)
Revaluation Surplus         —         —     0                  0
Other Comprehensive
  Income (OCI)              —         —     0                  0
                      ──────   ─────────   ─────       ─────────
Balance at Sene 30,
  2016 E.C. (Closing) 500,000  1,214,360    0          1,714,360
══════════════════════════════════════════════════════════════════
```

> **Retained Earnings Reconciliation:**  
> Opening RE 546,770 + Prior Net Profit 1,056,230 − Dividends 741,000 = 862,000 (confirmed)  
> Opening RE 862,000 + Current Net Profit 1,221,360 − Dividends 869,000 = 1,214,360 (confirmed)


---

## 4. Ethiopian Payroll Schedule — IFRS Compliant (Sample)
### ደሞዝ ሰሌዳ — IAS 19 / Proclamation 979/2016

The payroll schedule is a required supporting schedule for Note 7. It shows gross pay, all statutory deductions, and net pay. Every amount feeds directly into the P&L and Balance Sheet.

```
══════════════════════════════════════════════════════════════════
         ABC TRADING PLC — MONTHLY PAYROLL SCHEDULE
              ወርሃዊ ደሞዝ ሰሌዳ — Hamle 2016 E.C.
══════════════════════════════════════════════════════════════════
Employee  Dept    Gross    PIT(ETB)  Emp.Pen  Net Pay  Emp.Pen
Name              Salary            (7%)     (ETB)    Employer
          (ክፍል)   (ጠቅላላ)  (ግብር)    (ሠራተኛ)  (የተጣራ)  (11%)
──────────────────────────────────────────────────────────────────
Abebe T.  Sales   12,000   2,290     840      8,870    1,320
Tigist M. ovds  9,500   1,490     665      7,345    1,045
Dawit A.  Ops      7,200     890     504      5,806      792
Selamawit HR       6,500     690     455      5,355      715
Yonas B.  IT      15,000   3,290   1,050     10,660    1,650
──────────────────────────────────────────────────────────────────
TOTALS           50,200   8,650    3,514     38,036    5,522
══════════════════════════════════════════════════════════════════
  Gross Salary Expense   = ETB 50,200
  Employee Pension (7%)  = ETB  3,514  → deducted from gross
  PIT Payable to MoR     = ETB  8,650  → remit by month-end
  Net Pay to Employees   = ETB 38,036
  Employer Pension (11%) = ETB  5,522  → additional expense

  Total P&L Charge       = Gross (50,200) + Emp.Pension (5,522)
                         = ETB 55,722
  Total Pension to ERCA  = ETB 3,514 + ETB 5,522 = ETB 9,036
══════════════════════════════════════════════════════════════════
```

### Ethiopian PIT Rate Table (Schedule A — Proclamation 979/2016)

| Monthly Taxable Income (ETB) | Tax Rate | Deductible Amount (ETB) |
|-----------------------------|----------|------------------------|
| 0 – 600 | 0% | 0 |
| 601 – 1,650 | 10% | 60 |
| 1,651 – 3,200 | 15% | 142.50 |
| 3,201 – 5,250 | 20% | 302.50 |
| 5,251 – 7,800 | 25% | 565.00 |
| 7,801 – 10,900 | 30% | 955.00 |
| Over 10,900 | 35% | 1,500.00 |

**PIT Formula:** `PIT = (Gross Salary × Rate) − Deductible Amount`

**Example — Abebe T. (ETB 12,000 gross):**
```
  PIT = (12,000 × 35%) − 1,500 = 4,200 − 1,500 = ETB 2,700
  Employee Pension = 12,000 × 7% = ETB 840
  Taxable base for PIT = Gross − Pension = 12,000 − 840 = 11,160
  PIT on ETB 11,160 = (11,160 × 35%) − 1,500 = 3,906 − 1,500 = ETB 2,406
  Net Pay = 12,000 − 840 − 2,406 = ETB 8,754
```

> **In OVDS:** Payroll module auto-calculates PIT and pension per employee. Navigate to **HR → Payroll → Run Payroll** to generate the schedule. Export to PDF for MoR submission under **Reports → Payroll → Payroll Summary**.


---

## 5. Notes to the Financial Statements (ማብራሪያዎች)

Notes are mandatory under IFRS and provide the transparency MoR auditors rely on. Each note number cross-references a line in the financial statements above.

---

**Note 1 — Accounting Policies (የሒሳብ ፖሊሲዎች)**

| Policy | Treatment Applied |
|--------|------------------|
| Basis of preparation | Accrual basis per IAS 1 §27 |
| Functional currency | Ethiopian Birr (ETB) |
| Revenue recognition | IFRS 15 — when performance obligation satisfied |
| Inventory valuation | IAS 2 — FIFO (LIFO is prohibited under IFRS) |
| Property, Plant & Equipment | IAS 16 — Cost model; straight-line depreciation |
| Leases | IFRS 16 — Right-of-Use asset and lease liability |
| Financial instruments | IFRS 9 — ECL model for impairment |
| Provisions | IAS 37 — recognised when obligation is probable |
| Tax | IAS 12 — current and deferred tax |

---

**Note 4 — Revenue Disaggregation — IFRS 15 (ገቢ ዝርዝር)**

| Revenue Stream | 2016 E.C. ETB | 2015 E.C. ETB | Recognition Point |
|---------------|--------------|--------------|------------------|
| Goods (domestic sales) | 3,650,000 | 3,200,000 | Point in time — delivery |
| Goods (export, 0% VAT) | 1,200,000 | 1,000,000 | Point in time — shipment |
| Service Revenue | 350,000 | 280,000 | Over time — contract period |
| Other Income (rent etc.) | 45,000 | 30,000 | Over time |
| **Total** | **5,245,000** | **4,510,000** | |

---

**Note 6 — Inventories — IAS 2 (ዕቃዎች)**

| | 2016 E.C. ETB | 2015 E.C. ETB |
|--|--------------|--------------|
| Raw Materials | 120,000 | 105,000 |
| Work in Progress | 80,000 | 65,000 |
| Finished Goods | 320,000 | 310,000 |
| **Total Inventory** | **520,000** | **480,000** |

Inventories are stated at the lower of cost and net realisable value (IAS 2 §9). Cost is determined using the FIFO method.

---

**Note 7 — Employee Benefits — IAS 19 (የሠራተኞች ጥቅም)**

| | 2016 E.C. ETB | 2015 E.C. ETB |
|--|--------------|--------------|
| Gross Salaries | 820,000 | 710,000 |
| Employer Pension (11%) | 90,200 | 78,100 |
| PIT Remitted to MoR | 95,000 | 82,000 |
| Employee Pension (7%) | 57,400 | 49,700 |
| Total P&L Charge | 910,200 | 788,100 |
| Pension Payable (Balance Sheet) | 36,000 | 31,000 |
| PIT Payable (Balance Sheet) | 28,000 | 24,000 |

---

**Note 9 — Property, Plant & Equipment — IAS 16 (ቋሚ ሀብቶች)**

| | Buildings ETB | Vehicles ETB | Equipment ETB | Total ETB |
|--|-------------|-------------|--------------|----------|
| Cost (opening) | 600,000 | 280,000 | 176,000 | 1,056,000 |
| Additions | 0 | 0 | 0 | 0 |
| Disposals | 0 | 0 | (96,000) | (96,000) |
| Cost (closing) | 600,000 | 280,000 | 80,000 | 960,000 |
| Accum. Dep (opening) | (30,000) | (42,000) | (16,000) | (88,000) |
| Charge for year | (12,000) | (56,000) | (28,000) | (96,000) |
| Accum. Dep (closing) | (42,000) | (98,000) | (44,000) | (184,000) |
| **Net Book Value** | **558,000** | **182,000** | **36,000** | **776,000** |

---

**Note 10 — Trade Receivables & ECL — IFRS 9 (መሰብሰብ ያለባቸው ዕዳዎች)**

| Aging Bucket | Gross ETB | ECL Rate | Allowance ETB | Net ETB |
|-------------|----------|---------|--------------|--------|
| Current (< 30 days) | 420,000 | 0.5% | 2,100 | 417,900 |
| 31–60 days | 160,000 | 2% | 3,200 | 156,800 |
| 61–90 days | 72,000 | 5% | 3,600 | 68,400 |
| 91–180 days | 32,000 | 20% | 6,400 | 25,600 |
| Over 180 days | 14,000 | 80% | 11,200 | 2,800 |
| **Total** | **698,000** | | **26,500** | **671,500** |

> ECL (Expected Credit Loss) is calculated under IFRS 9 §5.5. OVDS applies the simplified approach (lifetime ECL for trade receivables) using historical loss rates per aging bucket.

---

**Note 12 — Taxation — IAS 12 (ግብር)**

```
  Accounting Profit (PBT)                   1,744,800
  Add: Non-deductible expenses                  8,000
    (Fines, penalties, cash payments > ETB 30k)
  Less: Capital allowances (ERCA rates)       (24,000)
    (Timing difference — ERCA vs IFRS dep.)
  ────────────────────────────────────────────────────
  Taxable Income                             1,728,800
  BIT @ 30%                                    518,640
  MAT check (2.5% × 5,245,000)                131,125
  Tax Payable = MAX(518,640, 131,125)         518,640

  Deferred Tax Liability (timing differences)  36,000
  Total Tax Expense per P&L                   523,440
```


---

## 6. IFRS vs Ethiopian Practice — Reconciliation Table

| Area | IFRS Requirement | Ethiopian Practice (Small/Medium) | Risk if Not Aligned |
|------|-----------------|----------------------------------|---------------------|
| **Accounting Basis** | Accrual (IAS 1 §27) | Often cash basis for small firms | MoR may reject return; BIT understatement |
| **Revenue Recognition** | IFRS 15 — when earned | Sometimes on receipt of cash | Timing mismatch with VAT returns |
| **Inventory** | FIFO or Weighted Average (IAS 2) | Sometimes LIFO or unrecorded | LIFO prohibited; audit risk on COGS |
| **Depreciation** | Economic useful life (IAS 16) | ERCA fixed rates (20% vehicles, 5% buildings) | Creates deferred tax difference |
| **Provisions** | IAS 37 — when probable | Often omitted | Understates liabilities; BIT audit exposure |
| **Lease Accounting** | IFRS 16 — ROU asset + liability | Often expense-only | Understates assets and liabilities |
| **Bad Debt** | IFRS 9 ECL model | Often recognised only when written off | Overstates receivables |
| **Financial Statements** | 4 statements + notes | Often Income + Balance Sheet only | AABE compliance failure (Tier 1/2) |
| **Pension** | IAS 19 — accrue monthly | Sometimes remit-only, no accrual | Balance sheet liability understated |
| **VAT cross-reference** | IFRS 15 revenue ≈ Output VAT base | Not always reconciled | ERCA cross-check triggers audit |
| **Equity Disclosure** | Full movement schedule | Simplified or omitted | Tier 1 compliance failure |

---

## 7. BIT Tax Computation Schedule (MoR Format)
### የንግድ ልዩ ገቢ ግብር ሒሳብ | Business Income Tax Computation

This is the official schedule that accompanies the Annual BIT Return filed by November 7 each year.

```
══════════════════════════════════════════════════════════════════
     BUSINESS INCOME TAX COMPUTATION — 2016 E.C. (2023/24)
     ABC TRADING PLC  |  TIN: 0012345678  |  Category: A
══════════════════════════════════════════════════════════════════

A. ACCOUNTING PROFIT (from P&L)                    1,744,800

B. ADD BACK: NON-DEDUCTIBLE EXPENSES
   Fines & Penalties                                   2,000
   Cash Payments > ETB 30,000                          6,000
   Entertainment (>50% business)                           0
   Total Add-Backs                                     8,000

C. LESS: ALLOWABLE CAPITAL ALLOWANCES
   ERCA Depreciation — Vehicles (20%)                (56,000)
   ERCA Depreciation — Buildings (5%)                (30,000)
   ERCA Depreciation — Equipment (25%)               (20,000)
   Less: IFRS Depreciation already charged            96,000
   Net Capital Allowance Adjustment                  (10,000)

D. LOSS CARRY-FORWARD (max 3 years)                       0

──────────────────────────────────────────────────────────────────
E. TAXABLE INCOME (A + B − C − D)                  1,742,800

F. BIT @ 30%                                         522,840

G. MAT CHECK
   Annual Turnover                                 5,245,000
   MAT = 2.5% × 5,245,000                           131,125
   Tax Payable = MAX(522,840 ; 131,125)            = 522,840

H. LESS: ADVANCE TAX PAID (quarterly)
   Q1 paid Sep 7                                    (120,000)
   Q2 paid Dec 7                                    (120,000)
   Q3 paid Mar 7                                    (120,000)
   Q4 paid Jun 7                                    (120,000)
   Total Advance Paid                               (480,000)

──────────────────────────────────────────────────────────────────
I. BALANCE DUE ON FILING (Nov 7)                    42,840
══════════════════════════════════════════════════════════════════
```


---

## 8. VAT Reconciliation to P&L (Output VAT Cross-Check)

ERCA cross-references the BIT annual return against 12 monthly VAT returns. A significant discrepancy triggers an audit. Use this reconciliation to ensure alignment.

```
══════════════════════════════════════════════════════════════════
          VAT / BIT REVENUE RECONCILIATION — 2016 E.C.
══════════════════════════════════════════════════════════════════

A. Total Revenue per P&L (IFRS 15)               5,245,000

B. Less: Zero-rated exports (0% VAT)            (1,200,000)
C. Less: Exempt revenue (e.g., financial services)        0
D. Add: Revenue recognised in prior year
   now invoiced (timing difference)                        0

──────────────────────────────────────────────────────────────────
E. Expected VAT-Taxable Revenue                  4,045,000
F. Expected Output VAT (15%)                       606,750

G. Actual Output VAT per 12 VAT Returns            606,750
                                                 ─────────
H. VARIANCE                                              0  ✓
══════════════════════════════════════════════════════════════════
```

> A zero variance means your P&L revenue and VAT returns are consistent. Any variance must be explained in a reconciliation note before MoR submission.

---

## 9. Final Review Checklist Before MoR Submission

Complete every item before submitting the annual return to the Ministry of Revenues.

### A. IFRS Compliance Checks

| # | Check | Standard | ✓ / ✗ |
|---|-------|---------|-------|
| 1 | Revenue recognised when performance obligation met | IFRS 15 | |
| 2 | Inventory at lower of cost and NRV; FIFO or WA | IAS 2 | |
| 3 | PPE carried at cost less accumulated depreciation | IAS 16 | |
| 4 | Impairment test performed for assets with indicators | IAS 36 | |
| 5 | ECL allowance calculated on all trade receivables | IFRS 9 | |
| 6 | Provisions recognised for probable obligations | IAS 37 | |
| 7 | Lease ROU assets and liabilities recorded | IFRS 16 | |
| 8 | Deferred tax calculated on all temporary differences | IAS 12 | |
| 9 | Cash Flow Statement uses indirect method correctly | IAS 7 | |
| 10 | All four statements prepared with comparatives | IAS 1 | |
| 11 | Notes include all required IFRS disclosures | IAS 1 §112 | |
| 12 | Accounting policies consistently applied | IAS 1 §119 | |

### B. Ethiopian Tax Compliance Checks

| # | Check | Reference | ✓ / ✗ |
|---|-------|---------|-------|
| 1 | All 12 monthly VAT returns filed on time | Proc. 1341/2024 | |
| 2 | Output VAT reconciles to P&L revenue | ERCA requirement | |
| 3 | Input VAT claims supported by valid ERCA QR invoices | Proc. 1341/2024 | |
| 4 | WHT certificates issued to all qualifying vendors | Proc. 979/2016 | |
| 5 | Monthly PIT remitted by payroll date each month | Proc. 979/2016 | |
| 6 | Monthly pension remitted (7% + 11%) | Proc. 715/2011 | |
| 7 | DRRF quarterly levies paid on time | Reg. 570/2025 | |
| 8 | BIT advance tax paid quarterly (Q1–Q4) | Proc. 979/2016 | |
| 9 | Non-deductible expenses added back in tax computation | Proc. 979/2016 | |
| 10 | Cash transactions > ETB 30,000 paid via bank | Proc. 979/2016 | |
| 11 | MAT check performed (2.5% turnover vs 30% profit) | Proc. 979/2016 | |
| 12 | Loss carry-forward does not exceed 3 years | Proc. 979/2016 | |

### C. Document Package for MoR Submission

Assemble the following in a single submission package:

| Document | Format | Generated In OVDS |
|----------|--------|------------------|
| Annual BIT Return (ITR-1 / 2 form) | eTax portal upload | Reports → Tax |
| Audited Financial Statements (Tier 1/2) | PDF | Reports → Financial |
| Statement of Profit or Loss | PDF | Reports → P&L |
| Statement of Financial Position | PDF | Reports → Balance Sheet |
| Statement of Cash Flows | PDF | Reports → Cash Flow |
| Statement of Changes in Equity | PDF | Reports → Equity |
| Notes to the Accounts | PDF | Reports → Financial (full) |
| BIT Tax Computation Schedule | PDF | Reports → Tax → BIT |
| VAT/BIT Revenue Reconciliation | PDF | Reports → Tax |
| Payroll Schedule (all 12 months) | PDF/Excel | Reports → Payroll |
| PIT Remittance Receipts (12 months) | PDF | HR → Payroll → PIT |
| Pension Remittance Receipts (12 months) | PDF | HR → Payroll → Pension |
| Fixed Asset Register (IAS 16 schedule) | PDF | ovds → Fixed Assets |
| Advance Tax Payment Receipts (4 quarters) | PDF | Tax → BIT Advance |


---

## 10. MoR Submission Workflow (End-to-End)
### ወደ ሚኒስቴር ገቢዎች ማቅረቢያ ሂደት

Follow these steps in OVDS to prepare and submit the annual report package to the Ministry of Revenues.

### Phase 1 — Close the Books (Period Close)

1. Navigate to **ovds → Period Close** (`/period-close`)
2. Run **Depreciation** for the final month — **Fixed Assets → Post Depreciation Run**
3. Post all **Accruals and Prepayments** via Journal Entries
4. Post any **Provisions** (IAS 37) via Journal Entries
5. Run **ECL Calculation** (IFRS 9) — **ovds → IFRS Dashboard → ECL Calculator**
6. Review **Adjusted Trial Balance** — **Reports → Financial → Trial Balance (Adjusted)**
7. Verify Total Debits = Total Credits before proceeding

### Phase 2 — Generate Financial Statements

| Statement | OVDS Navigation | Standard |
|-----------|----------------|---------|
| Statement of P&L | Reports → Financial → Profit & Loss | IAS 1 |
| Statement of Financial Position | Reports → Financial → Balance Sheet | IAS 1 |
| Statement of Cash Flows | Reports → Financial → Cash Flow | IAS 7 |
| Statement of Changes in Equity | Reports → Financial → Equity | IAS 1 |
| Notes to Accounts | Reports → Financial → Full Report (PDF) | IAS 1 §112 |

Set the date range to **Hamle 1 – Sene 30** (Ethiopian fiscal year). Enable **Comparative Period** to include the prior year column.

### Phase 3 — Tax Computation & Reconciliation

1. Go to **Tax → Business Income Tax** — OVDS auto-calculates BIT from the P&L
2. Review and adjust for **non-deductible expenses** in the BIT computation
3. Run **VAT/BIT Revenue Reconciliation** — verify zero variance
4. Generate **BIT Computation Schedule** (PDF)
5. Confirm **advance tax credits** match quarterly payment receipts

### Phase 4 — Assemble the Submission Package

1. Go to **Reports → Export All** to bundle all financial statements into one PDF
2. Download **Payroll Annual Summary** — Reports → Payroll → Payroll Summary (Annual)
3. Download **PIT and Pension Certificates** — Reports → Payroll → PIT Certificates
4. Download **Fixed Asset Register** — ovds → Fixed Assets → Export
5. Compile all quarterly **Advance Tax Receipts** and monthly **VAT submission receipts**

### Phase 5 — Submit to eTax Portal

| Step | Action | Portal |
|------|--------|--------|
| 1 | Log in with TIN | [etax.erca.gov.et](https://etax.erca.gov.et) |
| 2 | Select **Tax Declaration → Business Income Tax** | eTax |
| 3 | Enter Taxable Income and BIT from OVDS computation | eTax |
| 4 | Upload signed audited financial statements (Tier 1/2) | eTax |
| 5 | Submit and download **BIT Submission Receipt** | eTax |
| 6 | Pay balance due via commercial bank or Telebirr | Bank/Telebirr |
| 7 | Return to OVDS → **Tax → BIT → Record Payment** | OVDS |
| 8 | Attach submission receipt to the filing record | OVDS |

**Filing Deadline: November 7 (Hidar 1 E.C.)** — within 4 months of fiscal year end (Sene 30 / July 7).

---

## 11. Key Deadlines Summary (Annual Tax Calendar)

| Obligation | Period | Deadline | Penalty for Late Filing |
|-----------|--------|----------|------------------------|
| VAT Return | Monthly | 30th of following month | ETB 500/day (max ETB 50,000) |
| TOT Return | Monthly | 30th of following month | ETB 500/day |
| WHT Remittance | Monthly | 30th of following month | 2%/month |
| PIT Remittance | Monthly | Payroll date | 2%/month |
| Pension Remittance | Monthly | Payroll date | 2%/month |
| DRRF Levy — Q1 | Jul–Sep | October 15 | 2%/month |
| DRRF Levy — Q2 | Oct–Dec | January 15 | 2%/month |
| DRRF Levy — Q3 | Jan–Mar | April 15 | 2%/month |
| DRRF Levy — Q4 | Apr–Jun | July 15 | 2%/month |
| BIT Advance — Q1 | — | September 7 | 2%/month interest |
| BIT Advance — Q2 | — | December 7 | 2%/month interest |
| BIT Advance — Q3 | — | March 7 | 2%/month interest |
| BIT Advance — Q4 | — | June 7 | 2%/month interest |
| **BIT Annual Return** | FY Jul–Jun | **November 7** | 2%/month + penalties |
| Audited FS (Tier 1) | FY end | 6 months after FY end | AABE enforcement |

---

## 12. Navigation Flow in OVDS

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 · SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chart of Accounts                   /accounting
Opening Balances                    /accounting/opening-balances
Cost Centers                        /accounting/cost-centers
Company Settings                    /settings
TIN & MoR Credentials               /settings/company-profile
Business Registration               /business-registration
FX Rates & Currencies (ETB)         /fx-rates
Bank Accounts Setup                 /banking/accounts
Digital Wallets — Telebirr          /settings/digital-wallets
Chapa Payment Gateway               /settings/payment-gateways/chapa
Tax Dashboard                       /tax/dashboard
e-Tax Configuration                 /tax/etax-declaration
Penalty Calculator                  /tax/penalty-calculator
IoT / Device Registry               /iot/devices
OTA Updates (fiscal devices)        /iot/ota

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 · DAILY OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sales
├── Invoices                         /sales/invoices
├── Estimates & Quotes               /estimates
├── Credit Notes                     /credit-notes
├── Sales Orders                     /sales-orders
├── Receipts                         /receipts
├── Proforma Invoices                /sales/proforma
└── Payment Tracker                  /payment-tracker

Purchases
├── Bills                            /purchases/bills
├── Purchase Orders                  /purchases/orders
├── Expenses                         /purchases/expenses
├── Goods Received Notes             /grn
├── Debit Notes                      /debit-notes
├── Scanned Receipts                 /scanned-bills
└── WHT Certificates                 /tax/wht-certificates

Cash & Banking
├── Bank Accounts                    /banking/accounts
├── Transactions                     /transactions
├── Fund Transfers                   /fund-transfers
├── Bank Reconciliation              /bank-reconciliation
├── Import Bank Statements           /bank-statement-import
├── Petty Cash                       /petty-cash
├── FX & Currencies                  /fx-rates
└── Telebirr & Chapa (daily)         /banking/digital-payments

IoT & POS Devices
├── Device Registry                  /iot/devices
├── Sensor / Telematics Sync         /iot/telemetry
├── Smart Billing (POS)              /iot/billing
├── Device Alerts                    /iot/alerts
└── OTA Updates                      /iot/ota

Inventory
├── Items & Products                 /items
├── Stock Movements                  /inventory
└── IAS 2 Valuation                  /inventory/valuation

Payroll & HR
├── Employees                        /employees
├── Attendance                       /attendance
├── Leave Management                 /leaves
├── Payroll Runs                     /payroll
└── PAYE & Pension                   /hr/paye-declarations

Compliance Tasks
├── VAT Return                       /vat
├── TOT Filing                       /tax/tot
├── Excise Tax                       /tax/excise-tax
├── Stamp Duty                       /tax/stamp-duty
└── Schedule D (Other Income)        /tax/schedule-d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 · ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Financial Statements
├── Balance Sheet                    /reports?type=bs
├── Profit & Loss                    /reports?type=pl
├── Cash Flow Statement              /reports?type=cf
├── Changes in Equity                /reports/equity
└── Notes to Financials              /reports?type=notes

Dashboards
├── Main Dashboard                   /dashboard
├── Accounting Dashboard             /accounting-dashboard
├── Tax Overview Dashboard           /tax/dashboard
└── Tax Liability Estimator          /tax/liability-estimator

Accounting & Ledger
├── Trial Balance (Adjusted)         /reports?type=trial-balance
├── Budgets                          /budgets
├── Budget Variance                  /budgets/variance
├── Depreciation Schedule            /fixed-assets
├── Leases (IFRS 16)                 /leases
├── Accruals & Prepayments           /accounting/accruals-prepayments
└── IFRS Dashboard → ECL Calculator  /ifrs

Inventory & Assets
├── IAS 2 Stock Valuation            /inventory/valuation
├── Stock on Hand                    /inventory
├── IoT Asset Tracking Logs          /iot/telemetry
└── Fixed Asset Register             /fixed-assets

Expense Tracking
├── Expense Register                 /expenses
├── Petty Cash Audit                 /petty-cash
├── Cost Categories                  /transaction-categories
└── Expense Summary                  /reports?type=expense-summary

Reports
├── All Reports                      /reports
├── Income vs Expense                /reports?type=income-expense
├── Tax Summary                      /reports?type=tax
├── Custom Reports                   /reports?type=builder
└── Forecasting & AI                 /business-insights

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 · SUBMIT TO MoR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tax Filing Portal
├── e-Tax Declaration                /tax/etax-declaration
├── Net Tax Report (All Types)       /tax/filing
├── Pension Submissions              /tax/pension-submission
├── BIT Submission                   /business-income-tax
├── DRRF Quarterly                   /disaster-fund
└── Payment Reference / Voucher      /tax/payment-reference

Government Portals
├── ECC Customs Portal               /trade
└── TASS — SRM Devices               /vandv

Audit Trail & Certificates
├── Audit Trail & IoT Logs           /audit-logs
├── Compliance Auditor               /compliance-auditor
├── External Audit                   /audit-outsourcing
└── Compliance Sign-Off (lock)       /period-close

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HR & PAYROLL (Supporting Schedules)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── Payroll → Annual Summary         /payroll
├── Payroll → PIT Certificates       /payroll
└── Payroll → Pension Schedule       /payroll  →  /tax/pension-submission
```

---

## Contact — Ministry of Revenues (MoR / ERCA)

| Channel | Details |
|---------|---------|
| eTax Portal | [etax.erca.gov.et](https://etax.erca.gov.et) |
| Official Website | [mor.gov.et](https://mor.gov.et) |
| Phone | +251 11 662 98 00 |
| Email | info.mor@mor.gov.et |
| AABE (IFRS oversight) | [aabe.gov.et](https://aabe.gov.et) |

---

> **Disclaimer:** This guide reflects Ethiopian tax law and IFRS standards as of July 2026. Tax rates, proclamations, and IFRS standards are subject to change. Always verify current requirements on the official [Ministry of Revenue website](https://mor.gov.et) and consult a licensed Ethiopian accountant or tax advisor for entity-specific advice.

---

## 13. IFRS Standards Applied — Detailed Reference

Each standard below maps directly to a line item in the financial statements. Use this as a quick lookup during preparation and audit.

### IAS 1 — Presentation of Financial Statements
**Applies to:** All four statements + notes

| Requirement | Detail |
|------------|--------|
| Comparative period | Prior year figures must be shown for all statements |
| Going concern | Management must assess ability to continue operations for 12 months |
| Materiality | Aggregate immaterial items — do not clutter notes |
| Offsetting | Assets and liabilities must **not** be offset unless permitted by a standard |
| Frequency | Minimum annual; Ethiopian fiscal year ends Sene 30 (≈ July 7) |
| Functional currency | ETB for domestic entities; disclose if different |
| Current vs non-current | Classify assets/liabilities as current if due within 12 months |

**Common error in Ethiopia:** Presenting only Income Statement and Balance Sheet without Cash Flow and Equity statements. AABE requires all four for Tier 1 and Tier 2.

---

### IAS 2 — Inventories
**Applies to:** COGS and Inventory on the Balance Sheet

| Item | IFRS Rule | Ethiopian Issue |
|------|-----------|----------------|
| Valuation | Lower of **Cost** and **Net Realisable Value (NRV)** | Some businesses carry obsolete stock at cost |
| Cost formula | **FIFO** or **Weighted Average** only | LIFO is strictly prohibited under IFRS |
| Write-down | If NRV < cost, write down to NRV and recognise expense | Often not done until physical stocktake |
| Reversal | Reverse prior write-down if NRV recovers | Rarely applied in practice |

```
NRV = Estimated Selling Price − Estimated Costs to Sell

If NRV < Cost  →  Inventory Write-Down to NRV
Journal:  Dr Inventory Write-Down Expense
          Cr Inventory
```

**In OVDS:** Navigate to **ovds → Inventory** to run stock valuation. OVDS applies FIFO or Weighted Average based on your IAS 2 setting in **Settings → IFRS**.

---

### IAS 7 — Statement of Cash Flows
**Applies to:** Cash Flow Statement (indirect method)

| Activity | Includes | Key Adjustment |
|----------|----------|---------------|
| Operating | Collections from customers, payments to suppliers and employees | Add back depreciation; adjust for working capital changes |
| Investing | Purchase/sale of PPE, intangibles, investments | Net of proceeds from disposals |
| Financing | Loan draw-downs and repayments, lease payments, dividends paid | Separate from operating |

**Indirect method reconciliation:**
```
Net Profit Before Tax
+ Non-cash charges (depreciation, amortisation, ECL, provisions)
+ ovds costs
± Working capital changes (AR, inventory, AP, accruals)
= Cash Generated from Operations
− Tax paid
− Interest paid
= Net Cash from Operating Activities
```

> Interest paid is classified under **Operating** (IAS 7 §33 — allowed alternative) or **Financing**. OVDS defaults to Operating per the more common Ethiopian practice.

---

### IAS 12 — Income Taxes (Deferred Tax)
**Applies to:** Tax expense on P&L, deferred tax liability/asset on Balance Sheet

Deferred tax arises when the **carrying amount** of an asset or liability in the IFRS statements differs from its **tax base** (ERCA value).

| Timing Difference | IFRS Carrying Amount | Tax Base | Deferred Tax |
|------------------|---------------------|---------|-------------|
| PPE — IFRS depreciation slower than ERCA | Higher | Lower | **DTL** (liability) |
| PPE — IFRS depreciation faster than ERCA | Lower | Higher | **DTA** (asset) |
| Provisions not yet tax-deductible | Higher liability | Zero | **DTA** |
| Unearned revenue not yet taxed | Higher liability | Zero | **DTA** |

```
Deferred Tax Liability (DTL) = Temporary Difference × 30%

Example:
  IFRS Net Book Value (PPE)    =  776,000
  ERCA Tax Written-Down Value  =  810,000
  Taxable temporary difference =   34,000  (ERCA higher → future deduction)
  DTL = 34,000 × 30%           =   10,200
```

> **Note for small businesses (Tier 3 / below threshold):** Deferred tax is not required under the Ethiopian Reporting Standard for micro-entities. However, Tier 1 and Tier 2 entities must compute and present deferred tax.

---

### IAS 16 — Property, Plant & Equipment
**Applies to:** Fixed Asset Register, depreciation expense, PPE on Balance Sheet

| Item | IFRS Rule | Ethiopian Practice |
|------|-----------|-------------------|
| Initial recognition | At **cost** (purchase price + directly attributable costs) | Usually purchase price only |
| Subsequent measurement | **Cost model** (cost − accum. dep.) or **Revaluation model** | Cost model most common |
| Depreciation method | Reflects pattern of economic benefit consumption | Straight-line most common |
| Useful life | Management estimate — reviewed annually | Often defaults to ERCA tax rates |
| Residual value | Estimated amount at end of useful life | Often assumed zero |
| Componentisation | Significant components depreciated separately | Rarely applied in Ethiopia |

**Straight-Line Depreciation Formula:**
```
Annual Dep = (Cost − Residual Value) ÷ Useful Life
Monthly Dep = Annual Dep ÷ 12

Example — Motor Vehicle:
  Cost           =  280,000
  Residual Value =   20,000
  Useful Life    =  4 years
  Annual Dep     = (280,000 − 20,000) ÷ 4 = ETB 65,000/year
  Monthly Dep    = ETB 5,417/month
```

**Disposal entry:**
```
Dr  Accumulated Depreciation       (total to date)
Dr  Loss on Disposal (if any)
    Cr  PPE — Cost                 (original cost)
    Cr  Gain on Disposal (if any)
    Cr  Cash/Receivable            (proceeds)
```

---

### IAS 19 — Employee Benefits
**Applies to:** Salaries expense, pension obligations, accrued leave

| Benefit Type | IFRS Treatment | Ethiopian Specifics |
|-------------|---------------|---------------------|
| Short-term (salaries, wages) | Recognise when service rendered — accrue if unpaid | Monthly; PIT + pension deducted at source |
| Employee pension (7%) | Deduct from gross — remit to ERCA | Mandatory; Proc. 715/2011 |
| Employer pension (11%) | Additional expense above gross | Mandatory; Proc. 715/2011 |
| Paid leave | Accrue unused leave entitlement | Annual leave: 16 working days minimum (Labour Proc. 1156/2019) |
| Severance | Accrue when obligation probable | IAS 37 applies |
| Long-term (defined benefit) | Actuarial valuation required (IAS 19 §67) | Applies to Tier 1 only |

**Accrued leave calculation example:**
```
Monthly accrual = Annual Leave Days ÷ 12 × Daily Rate
Daily Rate      = Monthly Salary ÷ 26 working days

Employee: Tigist M., Salary ETB 9,500
Daily rate      = 9,500 ÷ 26 = ETB 365.38
Monthly accrual = (16 ÷ 12) × 365.38 = ETB 487.17

Journal:
  Dr  Leave Expense         487.17
    Cr  Accrued Leave Payable  487.17
```

---

### IAS 36 — Impairment of Assets
**Applies to:** PPE, intangibles, goodwill, investments

Impairment testing is required when there is an **indicator of impairment** — not just annually for most assets.

**Indicators of impairment (Ethiopia-specific):**
- Significant Birr devaluation affecting import-dependent assets
- Market decline for a product line
- Physical damage or obsolescence
- Evidence an asset is idle or will be disposed of

```
Recoverable Amount = Higher of:
  (a) Fair Value Less Costs to Sell (FVLCTS)
  (b) Value in Use (VIU) — present value of future cash flows

If Carrying Amount > Recoverable Amount:
  Impairment Loss = Carrying Amount − Recoverable Amount

Journal:
  Dr  Impairment Loss Expense
    Cr  Accumulated Impairment — [Asset]
```

---

### IAS 37 — Provisions, Contingent Liabilities, Contingent Assets
**Applies to:** Tax disputes, warranty claims, restructuring, legal cases

| Condition | Treatment |
|-----------|-----------|
| Present obligation + probable outflow + reliable estimate | **Recognise provision** (debit expense, credit liability) |
| Possible obligation (not probable) | **Disclose** as contingent liability in notes — do not recognise |
| Remote possibility | **No disclosure required** |
| Possible inflow (contingent asset) | **Disclose only if virtually certain** — never recognise until certain |

**Common Ethiopian provisions:**
| Provision | Trigger | Estimate Basis |
|-----------|---------|---------------|
| Tax dispute with ERCA | ERCA audit letter received | Legal counsel opinion |
| Pending labour claims | Employee grievance filed | HR/legal estimate |
| Warranty obligations | Product sold with warranty | Historical return rate |
| Restructuring | Board decision made, plan announced | Detailed cost estimate |

---

### IFRS 9 — Financial Instruments (Expected Credit Loss)
**Applies to:** Trade receivables, loans, financial assets

IFRS 9 replaced the old "incurred loss" model with a **forward-looking ECL (Expected Credit Loss)** model. Under the **simplified approach** (allowed for trade receivables), lifetime ECL is recognised from day one.

**ECL Matrix — Simplified Approach:**
```
ECL = Gross Receivable × Default Rate (per aging bucket)

Default rates should be based on the company's own historical
collection experience, adjusted for forward-looking information
(e.g., economic outlook, customer sector risk).
```

| Aging | Suggested Default Rate | Rationale |
|-------|----------------------|-----------|
| Current | 0.5% | Low risk; normal trading |
| 1–30 days overdue | 1% | Minor delay; mostly administrative |
| 31–60 days | 3% | Increasing risk |
| 61–90 days | 8% | Significant delay |
| 91–180 days | 25% | Doubtful |
| > 180 days | 60–80% | Likely impaired |
| > 365 days | 100% | Write off |

> Rates should be reviewed annually against actual write-off experience. The above are starting-point estimates for Ethiopian trading businesses; adjust based on your customer base and industry.


---

### IFRS 15 — Revenue Recognition
**Applies to:** All sales revenue, service revenue, contract revenue

IFRS 15 replaced IAS 11 and IAS 18. Revenue is recognised using the **5-step model**:

```
Step 1 → Identify the CONTRACT with the customer
Step 2 → Identify the PERFORMANCE OBLIGATIONS (distinct goods/services)
Step 3 → Determine the TRANSACTION PRICE
Step 4 → ALLOCATE the price to each performance obligation
Step 5 → RECOGNISE revenue when each obligation is SATISFIED
```

**Ethiopian business examples:**

| Business Type | Performance Obligation | When Recognised |
|--------------|----------------------|-----------------|
| Goods trader | Delivery of goods to customer | Point in time — on delivery |
| Exporter | Transfer of control at port | Point in time — on shipment (FOB) |
| IT services firm | Monthly support contract | Over time — monthly |
| Construction | Building milestone | Over time — % of completion |
| School / Training | Course delivery | Over time — over course duration |
| Restaurant | Meal served | Point in time — on service |

**VAT alignment:** Revenue recognised under IFRS 15 must be the same base used for Output VAT calculation. Any timing difference (e.g., advance payments) must be reconciled in Note 4 and the VAT/BIT reconciliation.

---

### IFRS 16 — Leases
**Applies to:** All leases with terms > 12 months (except low-value assets)

IFRS 16 eliminated the operating lease "off-balance-sheet" treatment for lessees. All material leases must appear on the Balance Sheet.

**Lessee accounting:**
```
At commencement:
  Dr  Right-of-Use Asset (ROU)
    Cr  Lease Liability
  (= Present value of future lease payments, discounted at incremental borrowing rate)

Each period:
  Dr  Depreciation Expense     (ROU Asset ÷ lease term)
  Dr  Interest Expense         (Lease Liability × rate)
    Cr  Cash / Bank             (actual lease payment)
    Cr  Lease Liability         (principal reduction)
```

**Ethiopian context:**
- Office/shop rent for terms > 12 months → must be capitalised under IFRS 16
- Vehicle leases / hire purchase → IFRS 16 applies
- Short-term leases (≤ 12 months) and low-value assets → practical expedient allows expense treatment
- Many Ethiopian SMEs rent premises on informal verbal agreements — formalise in writing before IFRS 16 can be applied

**Disclosure required:**
- ROU asset balance and depreciation (in Note 9 or separate Note 14)
- Lease liability split: current and non-current
- Maturity analysis of lease payments
- Incremental borrowing rate used (CBE base rate + spread is common in Ethiopia)

---

## 14. Sector-Specific IFRS Considerations (Ethiopia)

Different industries face unique IFRS challenges in the Ethiopian context.

### 14a. Trading / Import-Export Companies

| Issue | IFRS Treatment | Ethiopian Specifics |
|-------|---------------|---------------------|
| Foreign currency purchases | IAS 21 — translate at transaction date rate | Use NBE official rate; disclose translation gains/losses |
| Import duty in inventory cost | IAS 2 — include duties in cost | Customs receipts must be retained |
| Letter of Credit (LC) | Financial instrument (IFRS 9) | LC fees are transaction costs |
| Zero-rated exports | IFRS 15 — recognise on shipment | Must separate from domestic revenue for VAT reporting |
| Birr devaluation | IAS 21 — restate monetary items at closing rate | Frequent devaluations create significant FX differences |

### 14b. Construction & Real Estate

| Issue | IFRS Treatment |
|-------|---------------|
| Long-term contracts | IFRS 15 — % of completion (input or output method) |
| Contract costs | Capitalise if recoverable; expense if not |
| Land held for development | IAS 40 (investment property) or IAS 2 (inventory) depending on intent |
| Retention receivables | Recognise when performance obligation satisfied |

### 14c. Manufacturing

| Issue | IFRS Treatment |
|-------|---------------|
| Raw materials + WIP + FG | IAS 2 — FIFO or WA; include direct labour and overhead |
| By-products | Separate from main product at split-off point |
| Impairment of equipment | IAS 36 — test when indicators present |
| Government grants (e.g., IPDC land) | IAS 20 — deduct from asset cost or recognise as income over useful life |

### 14d. Financial Services (Banks, MFIs)

| Issue | IFRS Treatment |
|-------|---------------|
| Loans and advances | IFRS 9 — ECL on entire loan portfolio (Stage 1/2/3) |
| Investment securities | IFRS 9 — FVTPL, FVOCI, or amortised cost |
| Interest income | IFRS 9 — effective interest rate (EIR) method |
| Insurance contracts | IFRS 17 (effective Jan 1, 2023 — Tier 1 mandatory) |

> Banks, insurance companies, and MFIs are always Tier 1 under AABE rules regardless of size. Full IFRS applies from July 7, 2023.

### 14e. NGOs and Non-Profit Organisations

| Issue | Treatment |
|-------|-----------|
| Grant income | Recognise when conditions attached to grant are met |
| Restricted funds | Disclose separately; not available for general use |
| Donor reporting | IFRS does not apply — use fund accounting; IPSAS for public entities |
| VAT exemption | NGOs registered with CRDA may be exempt — verify with MoR |

---

## 15. Common ERCA Audit Findings & How to Avoid Them

These are the most frequently cited findings in Ethiopian MoR/ERCA audit reports. Address each during your pre-submission review.

| # | Finding | Root Cause | Prevention |
|---|---------|-----------|-----------|
| 1 | Revenue per BIT return ≠ Output VAT base | IFRS 15 timing differences not reconciled | Run VAT/BIT reconciliation (Section 8) before filing |
| 2 | Cash transactions > ETB 30,000 deducted | Bank requirement ignored | Enforce bank payment policy for all amounts ≥ ETB 30,001 |
| 3 | Input VAT claimed without valid ERCA QR invoice | Vendor not VAT-registered; invoice not verified | Verify vendor TIN and QR on every purchase; OVDS vendor TIN field |
| 4 | Payroll PIT understated | Allowances not included in taxable income | Include transport, housing, and other allowances in PIT base unless specifically exempt |
| 5 | Pension not remitted monthly | Cash flow issues; remitted quarterly | Automate monthly pension remittance from payroll run in OVDS |
| 6 | Depreciation deducted above ERCA rates | IFRS useful lives used in tax computation | Use ERCA rates in tax computation; use IFRS rates in financial statements; record deferred tax |
| 7 | Missing withholding tax on service payments | WHT threshold (ETB 500) not monitored | OVDS auto-calculates WHT on all qualifying bills ≥ ETB 500 |
| 8 | Advance payments recognised as revenue prematurely | Cash accounting habit | Apply IFRS 15; use Deferred Revenue account until obligation satisfied |
| 9 | Fixed assets not in register / unrecorded additions | Informal purchases, no PO process | Use OVDS PO workflow → Fixed Asset creation for all capital purchases |
| 10 | Related-party transactions not disclosed | Lack of awareness | Add Note for all transactions with owners, directors, and related companies (IAS 24) |
| 11 | No provision for tax disputes | ERCA audit letters not actioned | Review all open ERCA correspondence; create IAS 37 provision when probable |
| 12 | Inventory over-valued | No NRV assessment; LIFO used | Annual stocktake + NRV comparison; switch to FIFO in OVDS inventory settings |


---

## 16. Quarterly Management Reporting (Interim Financials)

While the annual submission to MoR is mandatory, IFRS encourages interim reporting (IAS 34) for Tier 1 entities, and good practice for Tier 2. OVDS supports on-demand generation of all statements for any date range.

### Recommended Quarterly Close Schedule

| Quarter | Ethiopian Period | Gregorian Equivalent | Action |
|---------|----------------|---------------------|--------|
| Q1 | Hamle 1 – Tikmt 30 | July – October | Close books; generate Q1 management P&L |
| Q2 | Hidar 1 – Yekatit 28 | November – February | Close books; pay DRRF Q1; generate Q2 P&L |
| Q3 | Megabit 1 – Sene 30 | March – June | Close books; finalise year-end adjustments |
| Annual | Sene 30 (FY end) | July 7/8 | Full IFRS financial statements; file BIT by Hidar 1 |

### Quarterly Internal Report Contents

| Report | Purpose | OVDS Location |
|--------|---------|--------------|
| P&L — current quarter vs budget | Management decision-making | Reports → Comparison → Budget vs Actual |
| P&L — current quarter vs prior year quarter | Trend analysis | Reports → Comparison → Period-over-Period |
| Balance Sheet — quarter end | Financial position | Reports → Financial → Balance Sheet |
| AR Aging | Collections monitoring | Reports → Financial → AR Aging |
| AP Aging | Cash flow planning | Reports → Financial → AP Aging |
| Tax Liability Dashboard | Upcoming tax obligations | Tax → Compliance Auditor |
| Payroll Summary | Labour cost monitoring | Reports → Payroll → Payroll Summary |

---

## 17. Chart of Accounts — IFRS-Aligned Structure

A well-designed Chart of Accounts (CoA) is the backbone of IFRS compliance. The following structure matches the IFRS element classification and supports automatic generation of all four financial statements in OVDS.

### Recommended Account Code Structure

```
1xxx  →  ASSETS
  10xx  →  Current Assets
    1010  Cash and Cash Equivalents
    1011  Petty Cash
    1020  Trade Receivables (Accounts Receivable)
    1021  Allowance for Doubtful Debts (ECL — contra)
    1030  Other Receivables
    1040  Input VAT Receivable
    1050  Prepaid Expenses
    1051  Prepaid Rent
    1052  Prepaid Insurance
    1060  Inventory — Raw Materials
    1061  Inventory — Work in Progress
    1062  Inventory — Finished Goods
    1070  Advance Payments to Suppliers

  11xx  →  Non-Current Assets
    1110  Property — Cost (IAS 16)
    1111  Property — Accumulated Depreciation
    1120  Plant & Equipment — Cost
    1121  Plant & Equipment — Accumulated Depreciation
    1130  Motor Vehicles — Cost
    1131  Motor Vehicles — Accumulated Depreciation
    1140  Furniture & Fixtures — Cost
    1141  Furniture & Fixtures — Accumulated Depreciation
    1150  Computer & IT Equipment — Cost
    1151  Computer & IT Equipment — Accumulated Depreciation
    1160  Intangible Assets — Software (IAS 38)
    1161  Intangible Assets — Accumulated Amortisation
    1170  Right-of-Use Assets (IFRS 16)
    1171  ROU — Accumulated Depreciation
    1180  Long-term Investments
    1190  Deferred Tax Asset (IAS 12)

2xxx  →  LIABILITIES
  20xx  →  Current Liabilities
    2010  Trade Payables (Accounts Payable)
    2020  VAT Payable (Output VAT)
    2021  WHT Payable
    2030  PIT Payable (Employee Income Tax)
    2040  Pension Payable (Employee 7% + Employer 11%)
    2050  Accrued Salaries and Wages
    2051  Accrued Leave Payable
    2060  Accrued Expenses (Utilities, Audit etc.)
    2070  Deferred Revenue (IFRS 15 — advance payments)
    2080  Current Portion — Long-term Loan
    2081  Current Portion — Lease Liability (IFRS 16)
    2090  DRRF Levy Payable
    2095  Provision for Tax (IAS 37)

  21xx  →  Non-Current Liabilities
    2110  Long-term Bank Loan
    2120  Lease Liability — Long-term (IFRS 16)
    2130  Deferred Tax Liability (IAS 12)
    2140  Employee Benefit Obligation (IAS 19)
    2150  Provision — Severance / Legal Claims (IAS 37)

3xxx  →  EQUITY
    3010  Share Capital / Paid-up Capital
    3020  Share Premium
    3030  Retained Earnings
    3040  Revaluation Surplus (IAS 16 revaluation model)
    3050  Other Comprehensive Income (OCI)
    3060  Dividends Paid

4xxx  →  REVENUE (Income)
    4010  Sales Revenue — Domestic (15% VAT)
    4011  Sales Revenue — Export (0% VAT)
    4020  Service Revenue
    4030  Other Income — Rent
    4031  Other Income — Gain on Disposal
    4032  Foreign Exchange Gain (IAS 21)
    4040  Interest Income

5xxx  →  COST OF GOODS SOLD
    5010  Purchases — Goods
    5020  Freight and Import Duties
    5030  Inventory Write-Down (IAS 2)

6xxx  →  OPERATING EXPENSES
    6010  Salaries and Wages
    6011  Employer Pension (11%)
    6012  Staff Training and Development
    6020  Rent Expense (short-term leases < 12 months)
    6021  Depreciation Expense (IAS 16)
    6022  ROU Depreciation (IFRS 16)
    6030  Utilities (Electricity, Water, Internet)
    6040  Marketing and Advertising
    6050  Professional Fees (Audit, Legal, Accounting)
    6060  Insurance Expense
    6070  Travel and Transport
    6080  Office Supplies and Consumables
    6090  Repairs and Maintenance
    6095  Impairment — Bad Debt (IFRS 9 ECL)
    6096  Inventory Write-Down Expense

7xxx  →  ovds COSTS
    7010  Interest on Bank Loans
    7020  Interest on Lease Liabilities (IFRS 16)
    7030  Bank Charges and Fees
    7040  Foreign Exchange Loss (IAS 21)

8xxx  →  TAX
    8010  Business Income Tax — Current (IAS 12)
    8020  Deferred Tax Expense / (Income) (IAS 12)
```

**In OVDS:** Navigate to **Settings → Chart of Accounts** to configure or import the account structure. Use the CSV import template from **ovds → Import Center → Chart of Accounts**.


---

## 18. Amharic–English Financial Terminology Glossary
### የፋይናንሻል ቃላት መዝገበ ቃላት

This bilingual reference covers every term used in the financial statements above. Use it when communicating with Ethiopian tax officials, auditors, or preparing Amharic versions of statements.

| English Term | Amharic (አማርኛ) | Abbreviation / Notes |
|-------------|----------------|----------------------|
| **FINANCIAL STATEMENTS** | **ፋይናንሻል ስቴትመንቶች** | |
| Statement of Profit or Loss | የገቢና ወጪ መግለጫ | P&L / Income Statement |
| Statement of Financial Position | የፋይናንሻል ሁኔታ መግለጫ | Balance Sheet / ባላንስ ሺት |
| Statement of Cash Flows | የጥሬ ገንዘብ ፍሰት መግለጫ | Cash Flow |
| Statement of Changes in Equity | የፍትሃዊ ድርሻ ለውጥ መግለጫ | Equity Movement |
| Notes to the Financial Statements | ማብራሪያዎች / ማስታወሻዎች | Notes |
| **REVENUE & INCOME** | **ገቢ** | |
| Revenue / Income | ገቢ | |
| Sales Revenue | የሽያጭ ገቢ | |
| Service Revenue | የአገልግሎት ገቢ | |
| Other Income | ሌሎች ገቢዎች | |
| Total Revenue | ጠቅላላ ገቢ | |
| **COSTS & EXPENSES** | **ወጪዎች** | |
| Cost of Goods Sold | የሸቀጣሸቀጥ ዋጋ | COGS |
| Gross Profit | ጠቅላላ ትርፍ | |
| Operating Expenses | የሥራ ወጪዎች | |
| Salaries and Wages | ደሞዝ እና ዋጋ | |
| Pension Contribution | የጡረታ መዋጮ | |
| Rent Expense | የቤት ኪራይ ወጪ | |
| Utilities | የአገልግሎት ክፍያ (ውሃ፣ ኤሌክትሪክ) | |
| Depreciation | የሀብት ዋጋ መቀነስ | IAS 16 |
| Amortisation | የማይዳሰሱ ሀብቶች ዋጋ መቀነስ | IAS 38 |
| Impairment Loss | የዋጋ ማጣት ኪሳራ | IAS 36 / IFRS 9 |
| ovds Costs / Interest | የፋይናንስ ወጪ / ወለድ | |
| Operating Profit (EBIT) | የሥራ ትርፍ | Earnings Before Interest & Tax |
| Profit Before Tax | ከግብር በፊት ትርፍ | PBT |
| Income Tax / BIT | የንግድ ልዩ ገቢ ግብር | BIT — 30% |
| Net Profit After Tax | ከግብር በኋላ የተጣራ ትርፍ | PAT |
| **ASSETS** | **ሃብቶች** | |
| Assets | ሃብቶች | |
| Current Assets | ተንቀሳቃሽ ሃብቶች | Due within 12 months |
| Non-Current Assets | ቋሚ ሃብቶች | Beyond 12 months |
| Cash and Cash Equivalents | ጥሬ ገንዘብ እና አቻዎቹ | |
| Trade Receivables | ንግዳዊ ዕዳ ሰብሳቢ (ለመሰብሰብ ያለ) | Accounts Receivable |
| Allowance for Doubtful Debts | ለጠፋ ዕዳ የቀረበ ክምችት | ECL — IFRS 9 |
| Inventories | ዕቃዎች / ክምችት | IAS 2 |
| Prepaid Expenses | አስቀድሞ የተከፈለ ወጪ | |
| Property, Plant & Equipment | ቋሚ ሀብቶች (ህንፃ፣ ማሽን፣ ተሽከርካሪ) | PPE — IAS 16 |
| Accumulated Depreciation | ክምችት ዋጋ መቀነስ | Contra asset |
| Net Book Value | የተጣራ የሒሳብ ዋጋ | NBV |
| Intangible Assets | ማይዳሰሱ ሀብቶች (ሶፍትዌር) | IAS 38 |
| Right-of-Use Asset | የአጠቃቀም መብት ሀብት | ROU — IFRS 16 |
| **LIABILITIES** | **ዕዳዎች** | |
| Liabilities | ዕዳዎች | |
| Current Liabilities | አጭር ጊዜ ዕዳዎች | |
| Non-Current Liabilities | ረጅም ጊዜ ዕዳዎች | |
| Trade Payables | ንግዳዊ ዕዳ ከፋይ | Accounts Payable |
| VAT Payable | ተጨማሪ እሴት ታክስ ዕዳ | Output minus Input |
| PIT Payable | የሠራተኞች ገቢ ታክስ ዕዳ | Employees' income tax |
| Pension Payable | የጡረታ ዕዳ | 7% + 11% combined |
| Accrued Expenses | ያልተከፈሉ ወጪዎች ዕዳ | Accruals |
| Deferred Revenue | ያልተገኘ (ቀሪ) ገቢ | IFRS 15 advance payments |
| Long-term Loan | ረጅም ጊዜ ብድር | |
| Lease Liability | የሊዝ ዕዳ | IFRS 16 |
| Deferred Tax Liability | ወደፊት የሚከፈል ግብር ዕዳ | IAS 12 |
| Provision | ክምችት / ድጋፍ | IAS 37 |
| **EQUITY** | **ፍትሃዊ ድርሻ** | |
| Equity | ፍትሃዊ ድርሻ / ካፒታል | Shareholders' equity |
| Share Capital | ድርሻ ካፒታል | Paid-up capital |
| Retained Earnings | የተቀመጠ ትርፍ | Accumulated profit |
| Dividends | ትርፍ ድርሻ (ዲቪዲንድ) | Distribution to shareholders |
| Revaluation Surplus | የዳግም ግምት ትርፍ | IAS 16 revaluation model |
| Other Comprehensive Income | ሌሎች አጠቃላይ ሃብት / ኪሳራ | OCI |
| **TAX TERMS** | **የታክስ ቃላት** | |
| Value Added Tax | ተጨማሪ እሴት ታክስ | VAT — 15% |
| Business Income Tax | የንግድ ልዩ ገቢ ግብር | BIT — 30% |
| Minimum Alternative Tax | አነስተኛ አማራጭ ግብር | MAT — 2.5% of turnover |
| Withholding Tax | ከምንጩ ላይ የሚቀረው ግብር | WHT — 2% |
| Personal Income Tax | የግል ገቢ ታክስ | PIT / Schedule A |
| Turnover Tax | ዝውውር ታክስ | TOT — 2%/10% |
| Advance Tax | ቅድሚያ ግብር | Quarterly BIT installments |
| Tax Identification Number | የታክስ መለያ ቁጥር | TIN |
| ERCA / MoR | ኢትዮጵያ ገቢዎች እና ጉምሩክ ባለሥልጣን | Ethiopian Revenues & Customs Authority |
| **ACCOUNTING TERMS** | **የሒሳብ ቃላት** | |
| Double-Entry Bookkeeping | ድርብ ምዝገባ የሒሳብ አያያዝ | Debit and Credit |
| Debit | ዴቢት (ወጪ) | Left side of journal entry |
| Credit | ክሬዲት (ገቢ) | Right side of journal entry |
| Accrual Basis | አክሩዋል መሰረት | Revenue/expense when earned/incurred |
| Cash Basis | ጥሬ ገንዘብ መሰረት | Revenue/expense on cash movement |
| Journal Entry | የሒሳብ ምዝገባ | |
| General Ledger | ዋናው ሒሳብ ደፍተር | GL |
| Trial Balance | ሙከራ ሚዛን | Debit = Credit check |
| Chart of Accounts | የሒሳብ ዝርዝር (ቻርት ኦፍ አካውንቶች) | CoA |
| Fiscal Year | የሒሳብ ዓመት | Hamle 1 – Sene 30 (EC) |
| Accrued Expense | ያልተከፈለ ወጪ | |
| Prepayment | አስቀድሞ መክፈያ | |
| Depreciation Schedule | የዋጋ ቅናሽ ሰሌዳ | IAS 16 |
| Going Concern | የሥራ ቀጣይነት | IAS 1 assumption |
| Materiality | ቁምነገርነት | IFRS framework |
| Comparatives | ማነፃፀሪያ (ዓምና) | Prior year figures |


---

## 19. Full Amharic-Headed Financial Statement (Sample — Amharic Cover Version)

This version uses Amharic headings throughout — suitable for submission to Ethiopian government bodies and local auditors.

```
══════════════════════════════════════════════════════════════════
             ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
           ABC TRADING PLC
    ቦሌ ክ/ከ፣ አዲስ አበባ | TIN: 0012345678
══════════════════════════════════════════════════════════════════

         የገቢና ወጪ መግለጫ (STATEMENT OF PROFIT OR LOSS)
         ከሐምሌ 1 እስከ ሰኔ 30፣ 2016 ዓ.ም

                                     2016 ዓ.ም.    2015 ዓ.ም.
                                      (ብር)          (ብር)
──────────────────────────────────────────────────────────────────
ጠቅላላ ገቢ (Total Revenue)
  የሽያጭ ገቢ — ሀገር ውስጥ             3,650,000     3,200,000
  የሽያጭ ገቢ — ወጪ ንግድ               1,200,000     1,000,000
  የአገልግሎት ገቢ                         350,000       280,000
  ሌሎች ገቢዎች                            45,000        30,000
                                    ─────────     ─────────
  ጠቅላላ ገቢ                          5,245,000     4,510,000

የሸቀጣሸቀጥ ዋጋ (Cost of Goods Sold)
  የክምችት ቀሪ (መጀመሪያ)                  480,000       390,000
  ግዢዎች                             2,100,000     1,850,000
  የክምችት ቀሪ (መጨረሻ)                  (520,000)     (480,000)
                                    ─────────     ─────────
  ጠቅላላ የሸቀጣሸቀጥ ዋጋ               2,060,000     1,760,000
                                    ─────────     ─────────
ጠቅላላ ትርፍ (Gross Profit)           3,185,000     2,750,000

የሥራ ወጪዎች (Operating Expenses)
  ደሞዝ እና ጥቅም                        820,000       710,000
  የጡረታ መዋጮ — ቀጣሪ (11%)              90,200        78,100
  ኪራይ እና አገልግሎቶች                     180,000       156,000
  የሀብት ዋጋ መቀነስ (IAS 16)              96,000        88,000
  ግብይት እና ማስታወቂያ                      64,000        52,000
  ሙያዊ አገልግሎት (ኦዲት፣ ህጋዊ)             45,000        38,000
  የጠፋ ዕዳ ክምችት (IFRS 9)              18,000        12,000
  ሌሎች አስተዳደራዊ ወጪዎች                  55,000        47,000
                                    ─────────     ─────────
  ጠቅላላ የሥራ ወጪዎች               1,368,200     1,181,100
                                    ─────────     ─────────
የሥራ ትርፍ / EBIT                   1,816,800     1,568,900

  የፋይናንስ ወጪ (ወለድ)                   (72,000)      (60,000)
                                    ─────────     ─────────
ከግብር በፊት ትርፍ (PBT)               1,744,800     1,508,900

  ገቢ ታክስ — 30% BIT                  (523,440)     (452,670)
                                    ─────────     ─────────
ከግብር በኋላ የተጣራ ትርፍ (Net Profit)  1,221,360     1,056,230
══════════════════════════════════════════════════════════════════

         የፋይናንሻል ሁኔታ መግለጫ (STATEMENT OF FINANCIAL POSITION)
                    እስከ ሰኔ 30፣ 2016 ዓ.ም

                                     2016 ዓ.ም.    2015 ዓ.ም.
                                      (ብር)          (ብር)
──────────────────────────────────────────────────────────────────
ሃብቶች (ASSETS)

ቋሚ ሃብቶች (Non-Current Assets)
  ቋሚ ሀብቶች (PPE) — IAS 16             864,000       968,000
  ማይዳሰሱ ሀብቶች (Intangibles)            48,000        60,000
  የአጠቃቀም መብት ሀብት (ROU — IFRS 16)     210,000       252,000
                                    ─────────     ─────────
  ጠቅላላ ቋሚ ሃብቶች                   1,122,000     1,280,000

ተንቀሳቃሽ ሃብቶች (Current Assets)
  ዕቃዎች / ክምችት (IAS 2 — FIFO)         520,000       480,000
  ለመሰብሰብ ያለ (Receivables — net ECL)   680,000       590,000
  ቅድሚያ የተከፈለ ወጪ (Prepayments)         36,000        28,000
  ጥሬ ገንዘብ (Cash)                       875,360       654,000
                                    ─────────     ─────────
  ጠቅላላ ተንቀሳቃሽ ሃብቶች              2,153,360     1,790,000
                                    ─────────     ─────────
ጠቅላላ ሃብቶች (Total Assets)         3,275,360     3,070,000

ፍትሃዊ ድርሻ (EQUITY)
  ድርሻ ካፒታል (Share Capital)            500,000       500,000
  የተቀመጠ ትርፍ (Retained Earnings)    1,214,360       862,000
                                    ─────────     ─────────
  ጠቅላላ ፍትሃዊ ድርሻ (Total Equity)   1,714,360     1,362,000

ዕዳዎች (LIABILITIES)
  ረጅም ጊዜ ዕዳዎች (Non-Current)           376,000       518,000
  አጭር ጊዜ ዕዳዎች (Current)              325,000       315,000
                                    ─────────     ─────────
  ጠቅላላ ዕዳዎች (Total Liabilities)     701,000       833,000
                                    ─────────     ─────────
ጠቅላላ ፍ/ድርሻ እና ዕዳዎች             3,275,360     3,070,000 ✓
══════════════════════════════════════════════════════════════════

ፈርሟቸው / Authorised by:

ስም (Name): ___________________________
ቦታ (Title): ዋና ሥራ አስፈፃሚ / CEO
ቀን (Date): ________________  2016 ዓ.ም.

ስም (Name): ___________________________
ቦታ (Title): ዋና የሒሳብ ኃላፊ / CFO
ቀን (Date): ________________  2016 ዓ.ም.

ፈቃድ ቁጥር (Licence No.): _______________
TIN: __________________________________
══════════════════════════════════════════════════════════════════
```


---

## 20. OVDS Period-Close Workflow — Detailed Checklist

Use this month-by-month checklist inside OVDS to ensure every period is closed correctly before generating reports for MoR.

### Monthly Close (every month)

```
□  1. Reconcile bank accounts
       ovds → Bank Accounts → Reconcile
       Ensure all transactions match the bank statement

□  2. Review and post all pending journal entries
       Accounting → Journal Entries → Pending

□  3. Post monthly depreciation
       ovds → Fixed Assets → Post Depreciation Run → [Month]

□  4. Accrue unpaid salaries (if payroll date ≠ month end)
       Journal: Dr Salaries Expense / Cr Accrued Salaries

□  5. Accrue employer pension on unpaid salaries
       Journal: Dr Pension Expense / Cr Pension Payable

□  6. Review prepayment amortisation (rent, insurance)
       Journal: Dr [Expense] / Cr Prepaid [Expense]

□  7. Run VAT computation
       Tax → VAT Administration → Compute [Month]
       Verify Output VAT, Input VAT, Net VAT

□  8. Generate and submit VAT return (by 30th)
       Tax → Tax Filing → Submit VAT → eTax portal

□  9. Remit PIT and pension (by payroll date)
       HR → Payroll → Remit PIT
       HR → Payroll → Remit Pension

□  10. Generate Trial Balance (Adjusted)
        Reports → Financial → Trial Balance → Adjusted
        Confirm Total Debits = Total Credits

□  11. Lock the period
        ovds → Period Close → Lock [Month]
        Prevents backdated entries after close
```

### Quarterly Close (Q1, Q2, Q3)

```
□  All monthly steps above, plus:

□  12. Pay DRRF quarterly levy (by 15th of last quarter month)
        Tax → Disaster Fund → Compute Quarter → Pay

□  13. Pay BIT advance installment (by Sep 7 / Dec 7 / Mar 7 / Jun 7)
        Tax → Business Income Tax → Pay Advance

□  14. Review AR Aging — escalate 90+ day balances
        Reports → Financial → AR Aging

□  15. Review AP Aging — plan payments for overdue bills
        Reports → Financial → AP Aging

□  16. Generate quarterly management P&L
        Reports → Comparison → Period-over-Period [Quarter]
```

### Annual Close (Sene 30 / July 7)

```
□  All monthly and quarterly steps, plus:

□  17. Physical stocktake — compare to OVDS inventory
        ovds → Inventory → Reconcile

□  18. Write down inventory to NRV where applicable (IAS 2)
        Journal: Dr Inventory Write-Down / Cr Inventory

□  19. Perform impairment assessment on all PPE (IAS 36)
        Review each asset for impairment indicators

□  20. Calculate full-year ECL on all trade receivables (IFRS 9)
        ovds → IFRS Dashboard → ECL Calculator

□  21. Post all year-end provisions (IAS 37)
        Tax disputes, warranty, severance, legal claims

□  22. Calculate deferred tax (IAS 12)
        Compare IFRS carrying amounts vs ERCA tax values
        Post DTL/DTA adjustment journal

□  23. Calculate accrued leave liability (IAS 19)
        HR → Leave → Calculate Accrued Leave Provision

□  24. Prepare BIT tax computation
        Tax → Business Income Tax → Compute Annual

□  25. Run VAT/BIT Revenue Reconciliation
        Verify P&L revenue = VAT return revenue base

□  26. Generate all four IFRS financial statements
        Reports → Financial → [Select FY date range]
        Enable Comparative Period (prior year)

□  27. Prepare Notes to the Accounts
        Reports → Financial → Full Report → Include Notes

□  28. External audit (Tier 1 and Tier 2 mandatory)
        Tax → Audit Outsourcing → Create Engagement

□  29. File BIT Annual Return on eTax portal (by Nov 7)
        Tax → Tax Filing → Submit BIT → eTax portal

□  30. Lock the fiscal year
        ovds → Period Close → Lock Year [2016 E.C.]
```

---

## 21. Frequently Asked Questions (FAQ)

**Q: Does IFRS apply to all Ethiopian businesses?**  
A: No. AABE's three-tier system applies it selectively. Tier 1 (full IFRS) for large entities, Tier 2 (IFRS for SMEs) for medium entities. Micro-entities below Tier 2 thresholds use the Ethiopian Reporting Standard. Banks and insurance companies are always Tier 1 regardless of size.

**Q: Our company uses cash accounting — do we need to switch to accrual?**  
A: If you meet Tier 1 or Tier 2 thresholds, yes — IFRS mandates accrual basis (IAS 1 §27). Cash accounting is not permitted. OVDS handles the conversion automatically once the accrual basis is set in **Settings → Accounting Basis**.

**Q: Can we use LIFO for inventory valuation?**  
A: No. IAS 2 §25 explicitly prohibits LIFO. You must use FIFO or Weighted Average. OVDS enforces this — only FIFO and WA are available in inventory settings.

**Q: What is the difference between BIT and MAT?**  
A: BIT (Business Income Tax) is 30% of net taxable profit. MAT (Minimum Alternative Tax) is 2.5% of annual gross turnover. You pay whichever is **higher**. MAT prevents businesses from reporting zero profit to avoid tax.

**Q: How many years can we carry forward a tax loss?**  
A: Under Proclamation 979/2016, losses can be carried forward for a maximum of **3 years** to offset future taxable income.

**Q: Our fiscal year ends July 7 — when is the BIT filing deadline?**  
A: **November 7 (Hidar 1 E.C.)** — exactly 4 months after the fiscal year end. Quarterly advance payments (25% each) must be made by September 7, December 7, March 7, and June 7.

**Q: Do we need an external audit?**  
A: Tier 1 entities are legally required to have their financial statements audited by a licensed Ethiopian audit firm before submission. Tier 2 entities are strongly encouraged. OVDS supports the full external audit workflow under **Tax → Audit Outsourcing**.

**Q: What happens if our Output VAT and BIT revenue figures don't match?**  
A: ERCA will flag the discrepancy and may initiate an audit. Run the VAT/BIT Revenue Reconciliation (Section 8) and prepare a written explanation for any legitimate variance (e.g., zero-rated exports, exempt revenue, timing differences).

**Q: Is depreciation using ERCA rates acceptable for IFRS financial statements?**  
A: Not directly. IFRS (IAS 16) requires depreciation based on the asset's **economic useful life**, which may differ from ERCA's fixed rates. The solution is to use IFRS-based depreciation in the financial statements, ERCA rates in the tax computation, and account for the timing difference as deferred tax (IAS 12).

**Q: How do we handle foreign currency transactions?**  
A: Under IAS 21, translate foreign currency transactions at the spot rate on the transaction date. Restate monetary items (cash, receivables, payables) at the closing rate at period end. Recognise exchange differences in profit or loss. In Ethiopia, use the **NBE official exchange rate**. Significant Birr devaluation creates material FX differences that must be disclosed in the notes.

---

## 22. Related Documents & References

| Document | Location | Purpose |
|----------|----------|---------|
| Tax & Compliance Guide | `docs/06-tax-compliance/README.md` | VAT, BIT, DRRF, WHT filing workflows |
| Financial Operations Guide | `docs/04-financial-ops/README.md` | Invoices, bills, payroll, fixed assets |
| Reports Guide | `docs/07-reports/README.md` | Report generation and export |
| AABE IFRS Tiers | [aabe.gov.et](https://aabe.gov.et) | Official tier thresholds and IFRS adoption schedule |
| MoR / ERCA E-Tax Portal | [etax.erca.gov.et](https://etax.erca.gov.et) | Online tax filing and payment |
| VAT Proclamation 1341/2024 | `docs/` (PDF) | Ethiopian VAT law |
| Income Tax Proclamation 979/2016 | MoR official site | BIT, PIT, WHT rates and rules |
| DRRF Regulation 570/2025 | MoR official site | Disaster Risk Reduction Fund levy |
| IFRS Standards (IASB) | [ifrs.org](https://www.ifrs.org) | Full text of all IAS / IFRS standards |

---

> **Document version:** July 2026  
> **Prepared for:** OVDS Platform — Ethiopian IFRS Accounting & Tax Compliance  
> **Standards referenced:** IAS 1, 2, 7, 12, 16, 19, 20, 21, 24, 34, 36, 37, 38 | IFRS 9, 15, 16, 17  
> **Ethiopian law referenced:** Proc. 979/2016, Proc. 1341/2024, Proc. 715/2011, Proc. 1156/2019, Reg. 570/2025  
> **Always verify current rates and deadlines at [mor.gov.et](https://mor.gov.et) and [aabe.gov.et](https://aabe.gov.et)**

---

---

# PART II — EXTENDED GUIDE: FULL HR & PAYROLL, ETHIOPIAN AUDIT RULES & COMPLETE MoR SUBMISSION
## ክፍል ሁለት — ሙሉ ሰው ሃብት እና ደሞዝ፣ የኢትዮጵያ ኦዲት ደምቦች እና ሙሉ ወደ ሚ/ገቢ ማቅረቢያ

> This part extends the guide with: full 15-employee payroll across all contract types, every Ethiopian statutory deduction, all AABE/ERCA audit rules mapped to IFRS standards, and a complete ready-to-submit MoR package with cover letter, schedules, and tracking log.

---

## 23. Full Ethiopian HR Structure — All Employee Categories

Ethiopian Labour Proclamation 1156/2019 defines employment types. Each type has different payroll, tax, and benefit treatment under IAS 19 and Ethiopian law.

### 23a. Employment Categories & IFRS Treatment

| Category | Amharic | Contract | PIT | Pension | Severance | IAS 19 |
|----------|---------|----------|-----|---------|-----------|--------|
| Permanent (Full-time) | ቋሚ ሠራተኛ | Open-ended | Schedule A | ✅ 7%+11% | Accrued (IAS 37) | Full IAS 19 |
| Fixed-term | ጊዜ ተወሰነ ሠራተኛ | Specific period | Schedule A | ✅ 7%+11% | On expiry if not renewed | Accrue over contract |
| Part-time | ትርፍ ሰዓት ሠራተኛ | Proportional | Schedule A on actual pay | ✅ Proportional | Proportional | Proportional accrual |
| Casual / Daily | ዕለታዊ ሠራተኛ | Day-by-day | Schedule A | ❌ Exempt | None | Expense as incurred |
| Contract / Outsourced | ኮንትራት ሠራተኛ | Service agreement | WHT 2% on invoice | ❌ (not employee) | None | Not IAS 19 — payable |
| Apprentice / Intern | ልምምድ ሠራተኛ | Training contract | Below ETB 600 → 0% | ❌ (if stipend only) | None | Expense as incurred |
| Expatriate | የውጭ ሠራተኛ | Special permit | Schedule A (resident) | Negotiated | Per contract | Full IAS 19 |
| Director / Officer | ዳይሬክተር | Board appointment | Schedule A or Dividend | Separate | Per Articles | IAS 19 + IAS 24 |

### 23b. Taxable vs Non-Taxable Income Components

| Income Component | Taxable? | Notes |
|-----------------|---------|-------|
| Basic Salary | ✅ Yes | Core PIT base |
| Housing Allowance (>25% of basic) | ✅ Yes | Excess above 25% is taxable |
| Transport Allowance (>ETB 2,200/month) | ✅ Partial | First ETB 2,200 is exempt |
| Medical Allowance | ❌ Exempt | If paid directly to medical provider |
| Meal Allowance (actual cost, on-site) | ❌ Exempt | Must be non-cash; canteen service |
| Overtime Pay | ✅ Yes | Included in PIT base |
| Annual Performance Bonus | ✅ Yes | Lump-sum; add to month's pay for PIT |
| Severance Pay | ❌ Exempt | Up to statutory limit per Proc. 1156/2019 |
| Pension (Employee 7%) | ❌ Deducted first | Pension deducted before PIT base |
| Per-Diem (domestic, within limits) | ❌ Exempt | Within FDRE approved per-diem rates |
| Per-Diem (excess) | ✅ Yes | Excess is taxable income |
| Share / Dividend Income | ✅ 10% WHT | Separate from employment income |
| End-of-Service Gratuity | ❌ Exempt | Statutory; per Labour Proc. 1156/2019 |


---

## 24. Full Monthly Payroll Register — 15 Employees (All Categories)
### ሙሉ ወርሃዊ ደሞዝ ሰሌዳ — 15 ሠራተኞች | Hamle 2016 E.C. (July 2024)

```
══════════════════════════════════════════════════════════════════════════════════════════════════
          ABC TRADING PLC — TIN: 0012345678 | ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
              MONTHLY PAYROLL REGISTER | ወርሃዊ ደሞዝ ሰሌዳ
                    Month / ወር: Hamle 2016 E.C. (July 2024)
══════════════════════════════════════════════════════════════════════════════════════════════════
No  Employee Name    Dept    Type      Basic    Transport  Housing   Gross     Pension  PIT      Net Pay   Empl.
    (ሠራተኛ ስም)      (ክፍል)   (አይነት)  Salary   Allow.     Allow.    Salary    7%       (PIT)   (ETB)     Pension
                                       (ETB)    (ETB)      (ETB)     (ETB)     (ETB)    (ETB)             11%
──────────────────────────────────────────────────────────────────────────────────────────────────────────
1   Abebe Tadesse    Sales   Permanent  12,000   2,200      3,000     17,200   840      3,556   12,804    1,320
2   Tigist Mekonen   ovds Permanent   9,500   2,200      2,375     14,075   665      2,506   10,904    1,045
3   Dawit Alemu      Ops     Permanent   7,200   1,800      1,800     10,800   504      1,568    8,728      792
4   Selamawit Haile  HR      Permanent   6,500   1,500      1,625      9,625   455      1,296    7,874      715
5   Yonas Bekele     IT      Permanent  15,000   2,200      3,750     20,950  1,050    4,733   15,167    1,650
6   Hiwot Girma      Sales   Permanent   8,000   2,000      2,000     12,000   560      1,868    9,572      880
7   Solomon Tesfaye  Ops     Fixed-term  6,000   1,500      1,500      9,000   420      1,134    7,446      660
8   Meron Assefa     Admin   Permanent   5,500   1,200      1,375      8,075   385        935    6,755      605
9   Biruk Negash     IT      Permanent  11,000   2,200      2,750     15,950   770      3,135   12,045    1,210
10  Fikirte Wolde    ovds Permanent   8,500   2,000      2,125     12,625   595      2,014   10,016      935
11  Getachew Desta   Sales   Part-time   4,000     800        800      5,600   280        506    4,814      440
12  Almaz Kebede     Admin   Permanent   5,000   1,000      1,250      7,250   350        770    6,130      550
13  Robel Hailu      Ops     Fixed-term  5,800   1,400      1,450      8,650   406      1,070    7,174      638
14  Kidist Berhe     HR      Permanent   6,200   1,500      1,550      9,250   434      1,214    7,602      682
15  Liya Tsegaye     IT      Permanent   9,000   2,200      2,250     13,450   630      2,283   10,537      990
──────────────────────────────────────────────────────────────────────────────────────────────────────────
    TOTALS                             119,200  26,700     29,350    175,250  8,344   28,588  138,318   13,112
══════════════════════════════════════════════════════════════════════════════════════════════════════════
```

### 24a. Payroll Summary — Accounting Entries

```
══════════════════════════════════════════════════════════════════
           PAYROLL ACCOUNTING SUMMARY — Hamle 2016 E.C.
══════════════════════════════════════════════════════════════════

GROSS PAYROLL EXPENSE (P&L Charge)
  Basic Salaries                     119,200
  Transport Allowances                26,700
  Housing Allowances                  29,350
  ──────────────────────────────────────────
  Total Gross Salary                 175,250

EMPLOYEE DEDUCTIONS (reduce net pay)
  Employee Pension (7%)               (8,344)
  PIT / Income Tax (Schedule A)      (28,588)
  ──────────────────────────────────────────
  Total Deductions                   (36,932)

NET PAY TO EMPLOYEES                 138,318

EMPLOYER OBLIGATIONS (additional P&L charge)
  Employer Pension (11%)              13,112
  ──────────────────────────────────────────
  Total Additional Expense            13,112

TOTAL P&L PAYROLL CHARGE            188,362
  (Gross 175,250 + Employer Pension 13,112)

PAYABLES TO REMIT TO ERCA/NSSA
  PIT Payable → MoR by month-end      28,588
  Total Pension → NSSA/ERCA
    Employee Pension (7%)              8,344
    Employer Pension (11%)            13,112
    Total Pension Payable             21,456
══════════════════════════════════════════════════════════════════
```

### 24b. Payroll Journal Entry (Month-End)

```
JOURNAL ENTRY — Payroll | Hamle 30, 2016 E.C. (July 31, 2024)
Reference: JE-PAY-2016-01
──────────────────────────────────────────────────────────────────
DEBIT:
  6010  Salaries & Wages Expense         175,250
  6011  Employer Pension Expense (11%)    13,112
                                         ───────
        Total Debits                     188,362

CREDIT:
  1010  Cash / Bank (Net Pay)            138,318
  2030  PIT Payable                       28,588
  2040  Pension Payable (7%+11% = 21,456) 21,456
                                         ───────
        Total Credits                    188,362  ✓
──────────────────────────────────────────────────────────────────
Prepared by: _________________ (CFO/Accountant)
Date: Hamle 30, 2016 E.C.
```


---

## 25. Full PIT Calculation — Step-by-Step for Each Employee

Ethiopian PIT is calculated on the **net taxable salary** after deducting employee pension (7%). Every allowance that is taxable must be included in the base.

### PIT Calculation Formula
```
Step 1: Gross Salary = Basic + Taxable Allowances
Step 2: Net Taxable Income = Gross Salary − Employee Pension (7%)
Step 3: Apply Schedule A rate table
Step 4: PIT = (Net Taxable Income × Rate) − Deductible Amount
```

### Detailed PIT Calculations — Selected Employees

```
══════════════════════════════════════════════════════════════════
  Employee 1: Abebe Tadesse | Permanent | Sales
══════════════════════════════════════════════════════════════════
  Basic Salary              12,000
  Transport Allow.           2,200  (ETB 2,200 → full exempt limit)
  Housing Allow.             3,000  (exceeds 25% of basic = 3,000 → taxable: 0)
    ↳ 25% of basic = 3,000; housing = 3,000 → exactly at limit, no excess taxable
  ────────────────────────────────
  Gross Taxable              14,200  (Basic + taxable transport excess 0 + housing excess 0)
    Note: transport ETB 2,200 ≤ exempt limit → 0 taxable transport
    Gross for PIT base = Basic 12,000 + Housing excess 0 = 12,000
    (Transport within exempt limit; housing = 25% of basic = exempt)

  Employee Pension (7%)     =  12,000 × 7%   =    840
  Net Taxable for PIT       =  12,000 − 840   = 11,160

  Schedule A: ETB 11,160 → bracket: Over ETB 10,900 → Rate 35%, Deduction ETB 1,500
  PIT = (11,160 × 35%) − 1,500 = 3,906 − 1,500 = ETB 2,406

  Employer Pension (11%)    =  12,000 × 11%  =  1,320
  Net Pay = 12,000 + 2,200 + 3,000 − 840 − 2,406 = 13,954
  (Housing and transport not pensionable; pension base = basic only)
══════════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════════
  Employee 5: Yonas Bekele | Permanent | IT
══════════════════════════════════════════════════════════════════
  Basic Salary              15,000
  Transport Allow.           2,200  (within exempt → ETB 0 taxable)
  Housing Allow.             3,750  (25% of 15,000 = 3,750 → exactly at limit, 0 excess)

  Pension base (basic only) = 15,000
  Employee Pension (7%)     =  15,000 × 7%  =  1,050
  Net Taxable for PIT       =  15,000 − 1,050 = 13,950

  Schedule A: ETB 13,950 → Rate 35%, Deduction ETB 1,500
  PIT = (13,950 × 35%) − 1,500 = 4,882.50 − 1,500 = ETB 3,382.50 ≈ 3,383

  Employer Pension (11%)    =  15,000 × 11% =  1,650
  Net Pay = 15,000 + 2,200 + 3,750 − 1,050 − 3,383 = 16,517
══════════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════════
  Employee 11: Getachew Desta | Part-time | Sales
══════════════════════════════════════════════════════════════════
  Basic Salary (50% FTE)     4,000
  Transport Allow.             800  (within exempt → 0 taxable)
  Housing Allow.               800  (25% of 4,000 = 1,000 → 800 < limit → 0 taxable)

  Employee Pension (7%)     =  4,000 × 7%  =  280
  Net Taxable for PIT       =  4,000 − 280  = 3,720

  Schedule A: ETB 3,720 → bracket ETB 3,201–5,250 → Rate 20%, Deduction ETB 302.50
  PIT = (3,720 × 20%) − 302.50 = 744 − 302.50 = ETB 441.50 ≈ 442

  Employer Pension (11%)    =  4,000 × 11% =  440
  Net Pay = 4,000 + 800 + 800 − 280 − 442 = 4,878
══════════════════════════════════════════════════════════════════
```

### PIT Schedule A — Full Rate Table (Proclamation 979/2016)

```
══════════════════════════════════════════════════════════════════
  Monthly Taxable Income     Rate    Deductible     Max PIT (ETB)
  (ETB)                       (%)    Amount (ETB)
══════════════════════════════════════════════════════════════════
  ETB       0  –     600       0%          0             0
  ETB     601  –   1,650      10%         60           105
  ETB   1,651  –   3,200      15%        142.50        337.50
  ETB   3,201  –   5,250      20%        302.50        747.50
  ETB   5,251  –   7,800      25%        565.00      1,385.00
  ETB   7,801  – 10,900       30%        955.00      2,315.00
  ETB  10,901  and above      35%      1,500.00      Unlimited
══════════════════════════════════════════════════════════════════
```

> **In OVDS:** PIT is auto-calculated per employee on every payroll run using this table. Navigate to **HR → Payroll → Run Payroll** — OVDS applies the pension deduction first, then the Schedule A rates. Review the breakdown per employee in **Payroll → Employee Payslip**.


---

## 26. Annual HR & Benefits Schedule — IAS 19 Full Disclosure
### ዓመታዊ የሠራተኞች ጥቅም ሰሌዳ | For Year Ended Sene 30, 2016 E.C.

This schedule forms Note 7 (Employee Benefits) in the financial statements. It covers all 12 months and every IAS 19 component.

### 26a. Annual Payroll Summary (12-Month Aggregate)

```
══════════════════════════════════════════════════════════════════
     ABC TRADING PLC — ANNUAL PAYROLL SUMMARY | 2016 E.C.
        ዓመታዊ ደሞዝ ሰሌዳ ማጠቃለያ | Hamle 1 – Sene 30, 2016 E.C.
══════════════════════════════════════════════════════════════════

                              Per Month    ×12      Annual
                                (ETB)     months   (ETB)
──────────────────────────────────────────────────────────────────
PAYROLL EXPENSE (P&L)
  Gross Salaries (all staff)    175,250      12    2,103,000
  Employer Pension (11%)         13,112      12      157,344
  ──────────────────────────────────────────────────────────
  Total Payroll Charge P&L      188,362      12    2,260,344

STATUTORY DEDUCTIONS (employee-funded, not P&L)
  Employee Pension (7%)           8,344      12      100,128
  PIT / Income Tax                28,588     12      343,056

REMITTANCES TO ERCA/NSSA
  PIT remitted to MoR             28,588     12      343,056
  Pension to NSSA
    Employee portion (7%)          8,344     12      100,128
    Employer portion (11%)        13,112     12      157,344
    Total Pension Remittance      21,456     12      257,472

NET PAY DISBURSED               138,318      12    1,659,816
══════════════════════════════════════════════════════════════════
  CROSS-CHECK (P&L):
  Gross Salary Expense                        2,103,000
  Employer Pension Expense                      157,344
  ────────────────────────────────────────────────────
  Total IAS 19 Expense (Note 7)              2,260,344
══════════════════════════════════════════════════════════════════
```

### 26b. Leave Entitlement & Accrual Schedule (IAS 19)

Ethiopian Labour Proclamation 1156/2019 minimum leave entitlements:

| Leave Type | Entitlement | Carry-forward | IAS 19 Treatment |
|-----------|------------|---------------|-----------------|
| Annual Leave | 16 working days/year (after 1yr service) | Max 30 days | Accrue monthly; measure at current salary rate |
| Sick Leave | Up to 6 months (full pay for first month) | No carry-forward | Accrue expected sick leave cost |
| Maternity Leave | 90 calendar days (full pay) | N/A | Accrue when pregnancy known; IAS 19 §11 |
| Paternity Leave | 3 working days | N/A | Expense when taken |
| Bereavement Leave | Up to 3 days | N/A | Expense when taken |
| Study Leave | Up to 5 days/year | No | Expense when taken |
| Public Holidays | 13 days per year | N/A | Included in salary cost |

```
ANNUAL LEAVE ACCRUAL CALCULATION (IAS 19)
══════════════════════════════════════════════════════════════════
  Accrual rate: 16 days ÷ 12 months = 1.333 days/month

  Employee: Abebe Tadesse | Basic Salary ETB 12,000
  Daily rate = 12,000 ÷ 26 working days = ETB 461.54
  Monthly accrual = 1.333 × 461.54 = ETB 615.23

  Full 15-employee monthly leave accrual:
    Total monthly gross (basic only) = 119,200
    Avg daily rate = 119,200 ÷ 26 ÷ 15 = ETB 305.64
    Monthly accrual (15 staff) ≈ 1.333 × 305.64 × 15 = ETB 6,117

JOURNAL — Monthly Leave Accrual:
  Dr  6012  Leave Expense             6,117
    Cr  2051  Accrued Leave Payable   6,117

Annual Leave Liability (Balance Sheet)
  Opening balance                     48,000
  Add: 12 months accrual (12 × 6,117) 73,404
  Less: Leave taken and paid         (60,000)
  ────────────────────────────────────────────
  Closing Accrued Leave Payable       61,404
══════════════════════════════════════════════════════════════════
```

### 26c. Severance & End-of-Service Provision (IAS 19 + IAS 37)

Ethiopian Labour Proc. 1156/2019 severance entitlement:

```
Severance = 1 month's salary per year of service
Maximum = 12 months' salary (for 12+ years)

For IAS 19/37 — accrue for each permanent employee
based on probability-weighted expected payout.

SEVERANCE PROVISION CALCULATION:
══════════════════════════════════════════════════════════════════
  Probability of payout within next year = 15% (management estimate)
  Total annual salary bill = 2,103,000
  Average years of service = 3.5 years
  Expected severance per ETB 1 of salary = 3.5 months × 15% = 0.525

  Provision = 2,103,000 ÷ 12 × 0.525 = ETB 91,881

JOURNAL — Year-End Severance Provision:
  Dr  6013  Severance Expense          91,881
    Cr  2150  Provision for Severance  91,881
══════════════════════════════════════════════════════════════════
```

> **In OVDS:** Navigate to **HR → Benefits → Leave Tracker** to monitor leave balances per employee. Post the IAS 19 leave and severance accruals via **Accounting → Journal Entries** at year-end. View all IAS 19 obligations under **ovds → IFRS Dashboard → Employee Benefits**.


---

## 27. Ethiopian Audit Rules Applied to IFRS Financial Statements
### የኢትዮጵያ ኦዲት ደምቦች ከ IFRS ጋር

Ethiopia has its own audit regulatory framework that sits on top of IFRS. Understanding both layers is essential before MoR submission.

---

### 27a. Audit Regulatory Framework

```
┌─────────────────────────────────────────────────────────────┐
│           ETHIOPIAN AUDIT REGULATORY HIERARCHY              │
├─────────────────────────────────────────────────────────────┤
│  Level 1: FDRE Constitution + Commercial Code               │
│           Foundation for financial disclosure obligations    │
├─────────────────────────────────────────────────────────────┤
│  Level 2: AABE (Accounting & Auditing Board of Ethiopia)     │
│           → Sets IFRS adoption tiers and audit standards     │
│           → Issues Directives on financial statement         │
│             preparation and audit firm licensing             │
│           → Enforcement body for Tier 1 & Tier 2            │
├─────────────────────────────────────────────────────────────┤
│  Level 3: MoR / ERCA                                        │
│           → Tax audit authority (BIT, VAT, WHT, Pension)    │
│           → Accepts IFRS-based financials for BIT filing     │
│           → Reconciles financial statements with tax returns │
├─────────────────────────────────────────────────────────────┤
│  Level 4: ISA (International Standards on Auditing)         │
│           → Adopted by AABE; applied by licensed auditors   │
│           → ISA 700, 705, 706 — audit opinion standards     │
│           → ISA 500-series — audit evidence                  │
│           → ISA 240 — fraud consideration                   │
└─────────────────────────────────────────────────────────────┘
```

### 27b. Who Must be Audited — AABE Requirements

| Entity Type | Audit Required | Auditor | Deadline |
|------------|---------------|---------|---------|
| Tier 1 — Full IFRS entities | **Mandatory statutory audit** | Licensed Ethiopian CPA firm | Within 6 months of FY end |
| Tier 2 — IFRS for SMEs | **Recommended; soon mandatory** | Licensed auditor or review engagement | Within 6 months of FY end |
| Tier 3 — Micro entities | Not required | N/A | N/A |
| Banks & insurance (NBE-regulated) | **Mandatory** | NBE-approved external auditor | NBE deadline |
| Government enterprises | **Mandatory** | Office of Federal Auditor General (OFAG) | OFAG deadline |
| NGOs / CSOs | **Mandatory** (ACSO requirement) | Licensed auditor | ACSO deadline |
| Listed companies | **Mandatory** | ESX-approved auditor | ESX rules |

### 27c. Types of Audit Opinion (ISA 700 / ISA 705)

| Opinion Type | When Issued | Impact on MoR |
|-------------|------------|---------------|
| **Unqualified (Clean)** | FS fairly present; IFRS complied with | MoR accepts without query |
| **Qualified** | Material misstatement in specific area, not pervasive | MoR may request explanation or correction |
| **Adverse** | FS do not present fairly; material + pervasive | MoR will reject; re-filing required |
| **Disclaimer** | Auditor unable to obtain sufficient evidence | MoR will request re-audit or explanations |
| **Emphasis of Matter** | Draws attention to note (e.g., going concern) | MoR may follow up on flagged issue |

> For BIT filing purposes, MoR requires at minimum a **signed management declaration** for Tier 3, and an **external audit report** for Tier 1 and Tier 2 companies.

### 27d. Ethiopian Audit Standards Applied to IFRS — Mapping

| ISA Standard | Topic | IFRS Link | Audit Procedure in Ethiopia |
|-------------|-------|-----------|----------------------------|
| ISA 200 | Overall objectives | IAS 1 | Assess risk of material misstatement in FS |
| ISA 230 | Audit documentation | All IFRS | Review journal entries, approvals, signed accounts |
| ISA 240 | Fraud risk | IAS 10, IAS 24 | Review related-party transactions; journal entry testing |
| ISA 250 | Laws & regulations | Proc. 979/2016, 1341/2024 | Verify tax returns filed; compliance checks |
| ISA 300 | Planning | All | Understand business, assess inherent risk |
| ISA 315 | Risk assessment | IFRS 15, IFRS 9 | Identify revenue cut-off, ECL model risks |
| ISA 500 | Audit evidence | All | Inspect invoices, bank statements, agreements |
| ISA 505 | External confirmations | IAS 7, IAS 32 | Bank confirmations; receivable confirmations |
| ISA 510 | Opening balances | IAS 1 (comparatives) | Verify prior year audited closing = current opening |
| ISA 520 | Analytical procedures | IAS 1 | Compare current year to prior; ratio analysis |
| ISA 530 | Sampling | All | Select sample of invoices, payroll, journals |
| ISA 540 | Accounting estimates | IAS 16, IFRS 9, IAS 37 | Challenge depreciation, ECL, provisions |
| ISA 550 | Related parties | IAS 24 | Identify director loans, family company transactions |
| ISA 560 | Subsequent events | IAS 10 | Review events between FY end and audit report date |
| ISA 570 | Going concern | IAS 1 §25 | Assess 12-month viability; review cash flow forecast |
| ISA 700 | Forming an opinion | IAS 1 | Issue audit report with appropriate opinion |
| ISA 705 | Modified opinion | IAS 1 | Qualify/adverse if material misstatement found |
| ISA 720 | Other information | IAS 1 | Review directors' report consistency with FS |

### 27e. Key ERCA Tax Audit Triggers

ERCA (under MoR) conducts tax audits separately from AABE financial audits. These are the conditions that trigger a tax audit:

| Trigger | Description | Prevention |
|---------|-------------|-----------|
| VAT/BIT Revenue Discrepancy | Output VAT base ≠ BIT declared revenue | Run reconciliation (Section 8) before filing |
| Missing Monthly VAT Returns | One or more months not filed | File zero return even if no transactions |
| High Input VAT Claims | Input VAT unusually high vs prior year | Retain all original VAT invoices with QR codes |
| Cash Transactions > ETB 30,000 Deducted | Not paid via bank/cheque | Enforce bank payment policy |
| Large Year-on-Year Revenue Swing | >30% unexplained change | Document business reasons; attach explanatory note |
| Related-Party Transactions | Sales/purchases to/from connected entities at non-arm's-length prices | Disclose in IAS 24 note; apply transfer pricing |
| Delayed BIT Filing | Filed after November 7 | File on time; pay interest 2%/month on balance |
| Pension Not Remitted | 7%+11% not reaching NSSA/ERCA | Automate pension remittance from payroll run |
| WHT Not Withheld | Service payments ≥ ETB 500 without WHT | OVDS auto-withholds; verify vendor TIN in bills |
| Director Salary vs Dividend Mix | Salary minimised; excessive dividends (10% WHT vs 35% PIT) | Document arms-length basis; maintain payroll records |

### 27f. Audit Evidence Required for Each IFRS Area

| IFRS Area | Evidence Required by Auditors | Where in OVDS |
|-----------|------------------------------|--------------|
| Revenue (IFRS 15) | Sales invoices, contracts, delivery notes, bank credits | Sales → Invoices |
| Receivables (IFRS 9) | Aged debtor listing, customer confirmations, ECL workings | Reports → AR Aging |
| Inventory (IAS 2) | Stocktake sheets, purchase invoices, NRV assessments | ovds → Inventory |
| PPE (IAS 16) | Fixed asset register, purchase invoices, depreciation schedule, site visits | ovds → Fixed Assets |
| Leases (IFRS 16) | Lease agreements, amortisation schedule, ROU calculations | Accounting → Journal Entries |
| Payables (IAS 37) | Vendor invoices, GRN, bank payments, WHT certificates | Purchases → Bills |
| Payroll (IAS 19) | Payroll registers, bank transfer records, PIT receipts, pension receipts | HR → Payroll |
| Tax (IAS 12) | VAT returns (12 months), BIT computation, ERCA receipts, deferred tax working | Tax → Tax Filing |
| Cash (IAS 7) | Bank statements, bank confirmation letters, reconciliations | ovds → Bank Accounts |
| Related Parties (IAS 24) | Director contracts, loan agreements, transaction details | Accounting → Journal Entries |


---

## 28. Complete IFRS Income Statement with Full HR/Payroll Integration
### ሙሉ IAS 19 ደሞዝ ወጪዎች ያካተተ የገቢና ወጪ መግለጫ

This is the production-ready Income Statement incorporating all HR and payroll data from Section 24, all IAS 19 accruals from Section 26, and all Ethiopian tax obligations.

```
══════════════════════════════════════════════════════════════════════
           ABC TRADING PLC — ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
           TIN: 0012345678  |  AABE Tier 2  |  VAT Registered
    ──────────────────────────────────────────────────────────────
    STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME
         የገቢና ወጪ እና አጠቃላይ ሌሎች ሃብት/ኪሳራ መግለጫ
    For the Year Ended Sene 30, 2016 E.C. (July 7, 2024)
    Prepared in accordance with IFRS for SMEs (AABE Tier 2)
    Functional currency: Ethiopian Birr (ETB)
══════════════════════════════════════════════════════════════════════
                                         Note   2016 E.C.  2015 E.C.
                                                ETB         ETB
──────────────────────────────────────────────────────────────────────
REVENUE (ገቢ)                              4
  Sales — Domestic (15% VAT)                    3,650,000  3,200,000
  Sales — Export (0% VAT)                       1,200,000  1,000,000
  Service Revenue                                 350,000    280,000
  Other Income                                     45,000     30,000
                                                ─────────  ─────────
  TOTAL REVENUE (ጠቅላላ ገቢ)                      5,245,000  4,510,000

COST OF GOODS SOLD (የሸቀጣሸቀጥ ዋጋ)           6
  Opening Inventory                               480,000    390,000
  Purchases (net of returns)                    2,100,000  1,850,000
  Less: Closing Inventory                        (520,000)  (480,000)
  Inventory Write-Down (IAS 2 NRV)                  8,000      5,000
                                                ─────────  ─────────
  TOTAL COGS                                    2,068,000  1,765,000
                                                ─────────  ─────────
GROSS PROFIT (ጠቅላላ ትርፍ)                       3,177,000  2,745,000
  Gross Margin %                                   60.6%      60.9%

OPERATING EXPENSES (የሥራ ወጪዎች)
  ── Employee Costs (IAS 19) ──              7
    Basic Salaries                              1,433,400  1,243,200
      (ETB 119,200 × 12 months)
    Transport Allowances                          320,400    278,400
      (ETB 26,700 × 12 months)
    Housing Allowances                            352,200    305,400
      (ETB 29,350 × 12 months)
    Employer Pension (11%)                        157,344    136,499
      (ETB 13,112 × 12 months)
    Annual Leave Accrual (IAS 19)                  73,404     63,700
    Severance Provision (IAS 19 / IAS 37)          91,881     79,718
    Staff Training & Development                   24,000     18,000
                                                ─────────  ─────────
    Total Employee Costs                        2,452,629  2,124,917

  ── Asset Costs ──
    Depreciation — Buildings (IAS 16)              12,000     12,000
    Depreciation — Vehicles (IAS 16)               65,000     65,000
    Depreciation — Equipment (IAS 16)              19,000     19,000
    Amortisation — Software (IAS 38)               12,000     12,000
    Depreciation — ROU Asset (IFRS 16)             42,000     42,000
                                                ─────────  ─────────
    Total Depreciation & Amortisation             150,000    150,000

  ── Operating Overheads ──
    Rent — Short-term leases (<12 months)          24,000     21,600
    Utilities (Electricity, Water, Internet)        96,000     84,000
    Marketing & Advertising                         64,000     52,000
    Professional Fees (Audit, Legal, Tax)           54,000     45,000
    Insurance                                       18,000     15,000
    Travel & Transport (business)                   36,000     30,000
    Office Supplies & Consumables                   12,000     10,000
    Repairs & Maintenance                           24,000     20,000
    Communication (Telephone, Data)                 18,000     15,000
    Impairment Loss — Bad Debts (IFRS 9)            26,500     18,000
    Inventory Write-Down (IAS 2)                     8,000      5,000
    Miscellaneous Administrative                    15,000     12,000
                                                ─────────  ─────────
    Total Overheads                               395,500    327,600

  ── DRRF Levy ──
    Disaster Risk Reduction Fund (1%)               52,450     45,100
      (1% × ETB 5,245,000 domestic revenue)
                                                ─────────  ─────────
  TOTAL OPERATING EXPENSES                      3,050,579  2,647,617
                                                ─────────  ─────────
OPERATING PROFIT / EBIT                           126,421     97,383
  (የሥራ ትርፍ)

  ── ovds Costs ──                        11
    Interest on Bank Loan                         (48,000)   (48,000)
    Interest on Lease Liability (IFRS 16)         (24,000)   (28,800)
    Bank Charges                                   (6,000)    (5,400)
    Foreign Exchange Loss (IAS 21)                 (8,000)    (4,000)
                                                ─────────  ─────────
    Total ovds Costs                           (86,000)   (86,200)
                                                ─────────  ─────────
PROFIT BEFORE TAX (ከግብር በፊት ትርፍ)                 40,421     11,183

  ── Taxation (IAS 12) ──                    12
    Current Tax — BIT (30%)                       (12,126)    (3,355)
    MAT check (2.5% × 5,245,000 = 131,125)
    Tax = MAX(12,126 ; 131,125)                  (131,125)  (112,500)
    Deferred Tax (IAS 12)                          (1,500)    (1,200)
                                                ─────────  ─────────
    Total Tax Expense                            (131,125)  (112,500)
                                                ─────────  ─────────
NET PROFIT / (LOSS) AFTER TAX                    (90,704)  (101,317)
  (ከግብር በኋላ የተጣራ ትርፍ / ኪሳራ)

OTHER COMPREHENSIVE INCOME (OCI)
  Revaluation Surplus (IAS 16)                        —          —
  Foreign Currency Translation (IAS 21)               —          —
                                                ─────────  ─────────
TOTAL COMPREHENSIVE INCOME / (LOSS)              (90,704)  (101,317)
══════════════════════════════════════════════════════════════════════
  Note: MAT = Minimum Alternative Tax (2.5% of turnover) applies
  because profit margin is thin. Tax payable = ETB 131,125 regardless
  of the low profit. This is a common outcome for high-cost businesses.
══════════════════════════════════════════════════════════════════════
```

> **Important management insight:** This statement shows the impact of applying full IAS 19 (leave accruals, severance provision) and IFRS 16 (lease interest). When all IFRS adjustments are correctly applied, a business with ETB 5.2M revenue can still incur a net loss due to the MAT floor. This demonstrates why IFRS compliance and Ethiopian MAT awareness are critical for business planning.


---

## 29. Complete MoR Submission Package — Ready to Submit
### ሙሉ ወደ ሚኒስቴር ገቢዎች ማቅረቢያ ሰነዶች | Complete Document Package

---

### 29a. Cover Letter Template (Amharic–English)

```
══════════════════════════════════════════════════════════════════
                                        ቀን (Date): Hidar 1, 2017 E.C.
                                        (November 7, 2024)

ለ (To):
  ዋና ዳይሬክተር                            The Director General
  ኢትዮጵያ ገቢዎች ሚኒስቴር                     Ministry of Revenues
  አዲስ አበባ                              Addis Ababa, Ethiopia

ርዕሰ ጉዳይ (Subject):
  የ2016 ዓ.ም ዓመታዊ የንግድ ልዩ ገቢ ግብር ማቅረቢያ
  Annual Business Income Tax Return Submission — FY 2016 E.C.

ክቡር ዳይሬክተር / Dear Director General,

  ኩባንያ ስም   (Company Name):  ABC Trading PLC / ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
  TIN ቁጥር   (TIN):          0012345678
  ምዝገባ ቁጥር  (Reg. No.):    001/PLC/2010
  ዘርፍ        (Sector):      Trade & Commerce
  የሒሳብ ዓመት  (Fiscal Year): Hamle 1 – Sene 30, 2016 E.C. (July 8, 2023 – July 7, 2024)

  ለ2016 ዓ.ም ዓመታዊ የምህዳር ሪፖርት ማቅረቢያ ቀን (ህዳር 1 ቀን 2017 ዓ.ም) መሰረት
  ተዘጋጅቶ የቀረበው ሙሉ የፋይናንሻል ሪፖርት ፓኬጅ ከዚህ ጋር ያያይዛል።
  In accordance with the annual BIT return deadline (Hidar 1, 2017 E.C. /
  November 7, 2024), we hereby submit our complete Financial Reporting
  Package for the fiscal year ended Sene 30, 2016 E.C.

  ከዚህ ሰነድ ጋር የሚያያዙ ሰነዶች (Attached Documents):
  ☑  1. Annual BIT Return Form (eTax Reference: ETX-BIT-2016-XXXXX)
  ☑  2. Statement of Profit or Loss (Audited)
  ☑  3. Statement of Financial Position (Audited)
  ☑  4. Statement of Cash Flows (Audited)
  ☑  5. Statement of Changes in Equity (Audited)
  ☑  6. Notes to the Financial Statements
  ☑  7. BIT Tax Computation Schedule
  ☑  8. VAT/BIT Revenue Reconciliation
  ☑  9. Annual Payroll Register (12 months)
  ☑  10. PIT Remittance Receipts (Hamle – Sene, 12 months)
  ☑  11. Pension Remittance Receipts (12 months)
  ☑  12. External Audit Report (Signed — [Audit Firm Name])
  ☑  13. Fixed Asset Register (IAS 16 Schedule)
  ☑  14. BIT Advance Tax Payment Receipts (4 quarters)
  ☑  15. VAT Return Summary (12 months, eTax references)

  ቅድሚያ የተከፈለ ሁለቱ ታክስ (Advance Tax Payments):
    Q1 (Sep 7, 2023) Bank Ref: CBE-XXXX-0001   ETB 30,000
    Q2 (Dec 7, 2023) Bank Ref: CBE-XXXX-0002   ETB 30,000
    Q3 (Mar 7, 2024) Bank Ref: CBE-XXXX-0003   ETB 30,000
    Q4 (Jun 7, 2024) Bank Ref: CBE-XXXX-0004   ETB 30,000
    Total Advance Paid:                         ETB 120,000
    Balance Due on Filing:                      ETB  11,125

  ፊርማ (Signature):
  ──────────────────────────────
  ስም (Name): _______________________
  ቦታ (Title): ዋና ሥራ አስፈፃሚ / CEO
  ቀን (Date): Hidar 1, 2017 E.C. (November 7, 2024)
  ፊርማ: ___________________  ማህተም: [ማህተም]
                              Stamp:   [Company Seal]

  ──────────────────────────────
  ስም (Name): _______________________
  ቦታ (Title): ዋና የሒሳብ ኃላፊ / CFO
  ቀን (Date): Hidar 1, 2017 E.C.
  ፊርማ: ___________________  ማህተም: [ማህተም]

  ──────────────────────────────
  የፈቃዱ ሒሳብ ባለሙያ ፊርማ (Licensed Accountant):
  ስም: ________________________  ፈቃድ ቁጥር: ICPAE-XXXX
  ቀን: ________________________  ፊርማ: __________________
══════════════════════════════════════════════════════════════════
```

---

### 29b. BIT Return Data Entry Sheet (eTax Portal Reference)

When filing on the eTax portal at [etax.erca.gov.et](https://etax.erca.gov.et), enter the following values:

```
══════════════════════════════════════════════════════════════════
      BIT RETURN DATA ENTRY — eTax Portal | 2016 E.C.
══════════════════════════════════════════════════════════════════

SECTION A — TAXPAYER INFORMATION
  TIN:                          0012345678
  Taxpayer Name:                ABC Trading PLC
  Category:                     Category A (VAT Registered)
  Business Type:                Trade & Commerce
  Fiscal Year:                  2016 E.C. (Jul 8, 2023 – Jul 7, 2024)

SECTION B — INCOME DECLARATION
  Total Revenue:                5,245,000
  Cost of Goods Sold:           2,068,000
  Gross Profit:                 3,177,000
  Total Operating Expenses:     3,050,579
  ovds Costs:                   86,000
  Accounting Profit (PBT):         40,421

SECTION C — TAX ADJUSTMENTS
  Add: Non-deductible expenses:      8,000
    (fines, personal items, excess cash payments)
  Less: Capital Allowances:        (24,000)
    (ERCA rates differ from IFRS depreciation)
  Adjusted Taxable Income:          24,421
  BIT @ 30%:                         7,326

SECTION D — MAT CHECK
  Annual Gross Turnover:         5,245,000
  MAT (2.5%):                     131,125
  Tax Payable = MAX(7,326 ; 131,125) = 131,125

SECTION E — CREDITS & ADVANCE PAYMENTS
  Total Advance Tax Paid:         120,000
  WHT Credits (if any):                 0
  Balance Payable:                 11,125

SECTION F — DRRF LEVY (if applicable)
  Annual Revenue subject to DRRF: 5,245,000
  DRRF Rate (Trade):               1%
  Annual DRRF:                    52,450
  Already paid quarterly:         52,450
  Balance:                              0

PAYMENT DETAILS
  Amount to pay:                  ETB 11,125
  Payment method:                 Commercial Bank / Telebirr
  Bank Ref (after payment):       ______________________
══════════════════════════════════════════════════════════════════
```


---

### 29c. Pension & PIT Remittance Summary (Annual Schedule for MoR)

```
══════════════════════════════════════════════════════════════════
   ANNUAL PIT & PENSION REMITTANCE SUMMARY | 2016 E.C.
   ABC TRADING PLC | TIN: 0012345678
══════════════════════════════════════════════════════════════════
Month         Gross      PIT        Employee  Employer  Total       Bank
(ወር)          Salary     Paid       Pension   Pension   Pension     Reference
              (ETB)      (ETB)      7%(ETB)   11%(ETB)  (ETB)
──────────────────────────────────────────────────────────────────
Hamle (Jul)   175,250    28,588      8,344     13,112    21,456    CBE-PIT-07
Nehase (Aug)  175,250    28,588      8,344     13,112    21,456    CBE-PIT-08
Meskerem(Sep) 176,500    28,820      8,390     13,183    21,573    CBE-PIT-09
Tikmt (Oct)   175,250    28,588      8,344     13,112    21,456    CBE-PIT-10
Hidar (Nov)   175,250    28,588      8,344     13,112    21,456    CBE-PIT-11
Tahsas (Dec)  178,000    29,120      8,540     13,420    21,960    CBE-PIT-12
Tir (Jan)     175,250    28,588      8,344     13,112    21,456    CBE-PIT-01
Yekatit(Feb)  175,250    28,588      8,344     13,112    21,456    CBE-PIT-02
Megabit(Mar)  175,250    28,588      8,344     13,112    21,456    CBE-PIT-03
Miazia (Apr)  175,250    28,588      8,344     13,112    21,456    CBE-PIT-04
Ginbot (May)  177,500    29,010      8,470     13,310    21,780    CBE-PIT-05
Sene (Jun)    175,250    28,588      8,344     13,112    21,456    CBE-PIT-06
──────────────────────────────────────────────────────────────────
ANNUAL TOTAL  2,109,500  344,762   100,560   157,921   258,481
══════════════════════════════════════════════════════════════════
  Certified correct by: _________________ (CFO/HR Manager)
  Date: ___________________  Signature: _____________________
══════════════════════════════════════════════════════════════════
```

---

### 29d. Submission Tracking Log
### ማቅረቢያ ምዝገባ ሰሌዳ | Use this to track every filing obligation

```
══════════════════════════════════════════════════════════════════
   ANNUAL TAX FILING TRACKER | 2016 E.C. | ABC Trading PLC
══════════════════════════════════════════════════════════════════
Obligation         Deadline     Filed Date   Ref No.       Status   Amount
                                                                     Paid (ETB)
──────────────────────────────────────────────────────────────────
VAT — Hamle        Aug 30       Aug 28       ETX-VAT-07    ✅        52,000
VAT — Nehase       Sep 30       Sep 29       ETX-VAT-08    ✅        49,500
VAT — Meskerem     Oct 30       Oct 30       ETX-VAT-09    ✅        51,200
VAT — Tikmt        Nov 30       Nov 28       ETX-VAT-10    ✅        50,400
VAT — Hidar        Dec 30       Dec 30       ETX-VAT-11    ✅        48,600
VAT — Tahsas       Jan 30       Jan 28       ETX-VAT-12    ✅        53,000
VAT — Tir          Feb 28       Feb 27       ETX-VAT-01    ✅        47,800
VAT — Yekatit      Mar 30       Mar 28       ETX-VAT-02    ✅        51,500
VAT — Megabit      Apr 30       Apr 29       ETX-VAT-03    ✅        50,200
VAT — Miazia       May 30       May 30       ETX-VAT-04    ✅        52,100
VAT — Ginbot       Jun 30       Jun 28       ETX-VAT-05    ✅        49,800
VAT — Sene         Jul 30       Jul 29       ETX-VAT-06    ✅        50,650
──────────────────────────────────────────────────────────────────
DRRF — Q1 (Jul-Sep) Oct 15      Oct 12       DRRF-Q1-2016  ✅        13,115
DRRF — Q2 (Oct-Dec) Jan 15      Jan 13       DRRF-Q2-2016  ✅        13,050
DRRF — Q3 (Jan-Mar) Apr 15      Apr 14       DRRF-Q3-2016  ✅        13,200
DRRF — Q4 (Apr-Jun) Jul 15      Jul 12       DRRF-Q4-2016  ✅        13,085
──────────────────────────────────────────────────────────────────
BIT Advance Q1     Sep 7        Sep 5        ADV-Q1-2016   ✅        30,000
BIT Advance Q2     Dec 7        Dec 5        ADV-Q2-2016   ✅        30,000
BIT Advance Q3     Mar 7        Mar 5        ADV-Q3-2016   ✅        30,000
BIT Advance Q4     Jun 7        Jun 5        ADV-Q4-2016   ✅        30,000
──────────────────────────────────────────────────────────────────
BIT Annual Return  Nov 7        Nov 7        ETX-BIT-2016  ✅        11,125
Audited FS to AABE Jan 7        Jan 6        AABE-2016     ✅        Filed
──────────────────────────────────────────────────────────────────
PIT (monthly ×12)  Payroll date All on time  PAY-PIT-2016  ✅       344,762
Pension (monthly)  Payroll date All on time  PAY-PEN-2016  ✅       258,481
══════════════════════════════════════════════════════════════════
  Total Tax & Levy Payments Made in 2016 E.C.:
    VAT (net payments):               606,750
    DRRF Levies:                       52,450
    BIT Advance + Balance:            131,125
    PIT (employees):                  344,762
    Pension (total):                  258,481
    ─────────────────────────────────────────
    GRAND TOTAL PAID TO MoR/NSSA:   1,393,568
══════════════════════════════════════════════════════════════════
```

> **In OVDS:** This tracker is automatically maintained under **Tax → Compliance Auditor**. Every filing recorded in OVDS updates the compliance score in real time. Export the full tracker as PDF from **Reports → Tax Liability → Annual Summary**.


---

### 29e. MoR Report Format — IFRS-Based Submission Order
### የሪፖርት ቅርጸት | Binder / PDF Order for Ministry of Revenues

Use this order when preparing the final report for MoR, external audit, AABE filing, or board approval. The aim is to make every number in the financial statements traceable to source documents, tax schedules, payroll records, and audit evidence.

```
══════════════════════════════════════════════════════════════════
          MoR-READY IFRS REPORT FORMAT | ETHIOPIA
          የ IFRS የፋይናንሻል ሪፖርት ለሚኒስቴር ገቢዎች
══════════════════════════════════════════════════════════════════

SECTION 1 — COVER AND COMPANY IDENTITY
  1. Cover page: company name, TIN, VAT number, fiscal year
  2. Cover letter to MoR
  3. Certificate of Registration
  4. Current business licence
  5. TIN, VAT, and pension registration certificates

SECTION 2 — MANAGEMENT RESPONSIBILITY
  6. Directors' responsibility statement
  7. Management approval minutes
  8. Going concern assessment
  9. Significant accounting policies summary

SECTION 3 — AUDITOR'S REPORT
  10. Independent auditor's report
  11. Audit opinion and basis for opinion
  12. Key audit matters, if applicable
  13. Auditor licence / AABE registration evidence

SECTION 4 — IFRS FINANCIAL STATEMENTS
  14. Statement of Profit or Loss and Other Comprehensive Income
  15. Statement of Financial Position
  16. Statement of Cash Flows
  17. Statement of Changes in Equity
  18. Notes to the Accounts

SECTION 5 — TAX COMPUTATION FOR MoR
  19. Business Income Tax computation
  20. Minimum Alternative Tax check, if applicable
  21. Non-deductible expense schedule
  22. Tax depreciation vs IFRS depreciation reconciliation
  23. VAT revenue vs IFRS revenue reconciliation
  24. Withholding tax schedule
  25. Advance tax and final balance payable schedule

SECTION 6 — HR, PAYROLL, AND PENSION SUPPORT
  26. Annual payroll register
  27. Employee PIT deduction schedule
  28. Employee pension 7% schedule
  29. Employer pension 11% schedule
  30. PIT and pension remittance receipts
  31. Leave, bonus, severance, and IAS 19 accrual support
  32. HR lifecycle cost schedule: recruitment, onboarding, training,
      performance, employee relations, and compliance

SECTION 7 — ACCOUNTING WORKING PAPERS
  33. Trial balance: unadjusted and adjusted
  34. General ledger extract
  35. Journal entry listing, including year-end adjustments
  36. Bank reconciliations for all accounts
  37. Fixed asset register and depreciation schedule
  38. Inventory count and valuation schedule
  39. Receivables aging and IFRS 9 ECL calculation
  40. Payables aging and accrual listing

SECTION 8 — FILING EVIDENCE
  41. eTax submission confirmation
  42. Bank / Telebirr payment references
  43. VAT filing receipts for the year
  44. PIT, pension, WHT, DRRF, and BIT receipts
  45. Final compliance checklist signed by CFO and CEO
══════════════════════════════════════════════════════════════════
```

#### Report Line Mapping — From Accounting Cycle to MoR Package

| Accounting Cycle Output | IFRS Report Location | MoR / Audit Evidence |
|-------------------------|----------------------|----------------------|
| Invoices and receipts | Revenue note; VAT reconciliation | Sales invoice file, VAT returns, eTax receipts |
| Purchase bills and expenses | P&L expense notes; BIT computation | Supplier invoices, WHT records, non-deductible schedule |
| Payroll run | Salaries, benefits, IAS 19 note | Payroll register, PIT schedule, pension receipts |
| Fixed asset register | PPE note; depreciation expense | Asset register, depreciation schedule, physical verification |
| Bank reconciliation | Cash and cash equivalents note | Bank statements, reconciliation sign-off |
| Adjusted trial balance | All four IFRS statements | TB export, GL detail, adjustment journals |
| HR lifecycle schedules | IAS 19 notes and operating expenses | Recruitment, training, performance, labour compliance files |
| Audit adjustments | Final statements and notes | Auditor adjustment log and management approval |
| Tax computation | BIT return and tax payable note | MoR computation sheet, payment receipt, eTax confirmation |

#### Final Sign-Off

Before submission, the report should be signed by:

| Signatory | Responsibility |
|-----------|----------------|
| CEO / General Manager | Confirms the report is authorised for submission |
| CFO / ovds Manager | Confirms accounting records, IFRS presentation, and tax computation |
| HR / Payroll Manager | Confirms PIT, pension, payroll, and employee benefit schedules |
| External Auditor | Issues the independent audit opinion, if audit is required |
| Company Secretary / Legal Officer | Confirms registration documents, licences, and board approvals |

> **Filing note:** The report format can be bilingual. Use Amharic–English headings for front-facing statements and schedules when the report will be reviewed by both management and government officers.


---

## 30. External Audit Report Template (ISA 700 / Ethiopian Format)
### የኦዲት ሪፖርት ናሙና | ISA 700 Compliant

```
══════════════════════════════════════════════════════════════════
         INDEPENDENT AUDITOR'S REPORT
         ነጻ የኦዲተር ሪፖርት
══════════════════════════════════════════════════════════════════

TO THE SHAREHOLDERS OF ABC TRADING PLC
ለ ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ ባለ አክሲዮኖች

OPINION (አስተያየት)
We have audited the financial statements of ABC Trading PLC
(the "Company"), which comprise:

  • The Statement of Financial Position as at Sene 30, 2016 E.C.
    (July 7, 2024)
  • The Statement of Profit or Loss and Other Comprehensive Income
    for the year then ended
  • The Statement of Cash Flows for the year then ended
  • The Statement of Changes in Equity for the year then ended
  • Notes to the financial statements, including a summary of
    significant accounting policies

In our opinion, the accompanying financial statements present
fairly, in all material respects, the financial position of the
Company as at Sene 30, 2016 E.C., and its financial performance
and cash flows for the year then ended in accordance with IFRS
for SMEs as adopted by the Accounting and Auditing Board of
Ethiopia (AABE).

BASIS FOR OPINION (አስተያየቱ መሰረት)
We conducted our audit in accordance with International Standards
on Auditing (ISAs) as adopted in Ethiopia by AABE. Our
responsibilities under those standards are described in the
"Auditor's Responsibilities" section of our report.

We are independent of the Company in accordance with the IESBA
Code of Ethics as adopted in Ethiopia, and have fulfilled our
other ethical responsibilities in accordance with the Code.

We believe that the audit evidence we have obtained is sufficient
and appropriate to provide a basis for our opinion.

KEY AUDIT MATTERS (ዋና የኦዲት ጉዳዮች)

1. Revenue Recognition (IFRS 15)
   Revenue of ETB 5,245,000 is material. We tested a sample of
   50 sales transactions, verified delivery documentation, and
   confirmed that revenue was recognised when performance
   obligations were satisfied. We found no material misstatement.

2. Expected Credit Loss — Trade Receivables (IFRS 9)
   We challenged management's ECL provision of ETB 26,500,
   verified the aging analysis against the AR ledger, and
   assessed default rates against historical write-off data.
   The provision is reasonable.

3. Depreciation (IAS 16)
   We verified the fixed asset register, agreed opening balances
   to prior-year audited accounts, confirmed additions with
   purchase invoices, and recalculated depreciation. No material
   differences were noted.

4. Payroll and Employee Obligations (IAS 19)
   We agreed payroll totals to bank transfer records, confirmed
   PIT remittances against ERCA receipts, and tested pension
   remittances against NSSA certificates. All obligations were
   duly remitted.

5. Tax Compliance (IAS 12)
   We reviewed the BIT computation, confirmed deferred tax
   calculations, and reconciled VAT returns to revenue. We found
   the tax provision of ETB 131,125 (MAT basis) to be correct.

OTHER INFORMATION
The directors are responsible for the other information.
The other information comprises the Directors' Report but does
not include the financial statements and our auditor's report.
Our opinion on the financial statements does not cover the other
information.

RESPONSIBILITIES OF MANAGEMENT (የዳይሬክተሮች ኃላፊነት)
Management is responsible for the preparation and fair
presentation of the financial statements in accordance with
IFRS for SMEs (AABE), and for such internal controls as
management determines are necessary to enable the preparation
of financial statements that are free from material misstatement.

AUDITOR'S RESPONSIBILITIES (የኦዲተር ኃላፊነቶች)
Our objectives are to obtain reasonable assurance about whether
the financial statements are free from material misstatement
and to issue an auditor's report that includes our opinion.

[Audit Firm Name] — Licensed by AABE
Audit Firm Registration No.: AABE-AF-XXXX
Partner: ______________________ CPA Licence: ICPAE-XXXX
Date: Tir 15, 2017 E.C. (January 24, 2025)
Address: Bole Sub-city, Addis Ababa, Ethiopia
══════════════════════════════════════════════════════════════════
```

---

## 31. IFRS Accounting Cycle — Complete Visual Flow (OVDS)
### ሙሉ የሒሳብ ዑደት ፍሰት ካርታ

```
═══════════════════════════════════════════════════════════════════
              IFRS ACCOUNTING CYCLE — OVDS WORKFLOW
              ሙሉ የ IFRS ሒሳብ ዑደት በ OVDS ውስጥ
═══════════════════════════════════════════════════════════════════

  1. DATA COLLECTION (ሰነዶች መሰብሰብ)
     │
     ├── Sales Invoices (ERCA QR)     →  Sales → Invoices
     ├── Purchase Invoices            →  Purchases → Bills
     ├── Payroll Records              →  HR → Payroll
     ├── Bank Statements              →  ovds → Bank Accounts
     ├── Fixed Asset Purchases        →  ovds → Fixed Assets
     └── Expense Claims               →  Purchases → Expenses
     │
     ▼
  2. JOURNAL ENTRIES (ምዝገባ) — Auto-posted by OVDS
     │
     ├── Invoice posted  →  Dr AR / Cr Revenue + VAT Payable
     ├── Bill posted     →  Dr Expense / Cr AP + WHT Payable
     ├── Payroll run     →  Dr Salary Expense / Cr Cash + PIT + Pension
     └── Payment posted  →  Dr AP or AR / Cr Cash
     │
     ▼
  3. LEDGER POSTING — Auto-posted to GL (ዋናው ሒሳብ ደፍተር)
     │
     ├── General Ledger   →  Accounting → General Ledger
     ├── Asset Ledger     →  ovds → Fixed Assets
     └── Tax Ledger       →  Tax → VAT Administration
     │
     ▼
  4. TRIAL BALANCE (ሙከራ ሚዛን)
     │
     ├── Unadjusted TB   →  Reports → Financial → Trial Balance
     └── Verify Debits = Credits before adjustments
     │
     ▼
  5. ADJUSTING ENTRIES (ማስተካከያ ምዝገባዎች)
     │
     ├── Depreciation run     →  ovds → Fixed Assets → Post Depreciation
     ├── Accruals             →  Accounting → Journal Entries (manual)
     ├── Prepayment expiry    →  Accounting → Journal Entries (manual)
     ├── ECL calculation      →  ovds → IFRS Dashboard → ECL
     ├── IAS 37 Provisions    →  Accounting → Journal Entries (manual)
     ├── IAS 19 Leave Accrual →  HR → Benefits → Post Accrual
     └── Deferred Tax (IAS 12)→  Accounting → Journal Entries (manual)
     │
     ▼
  6. ADJUSTED TRIAL BALANCE
     │
     └── Reports → Financial → Trial Balance (Adjusted)
     │
     ▼
  7. FINANCIAL STATEMENTS (ፋይናንሻል ስቴትመንቶች)
     │
     ├── P&L Statement        →  Reports → Financial → Profit & Loss
     ├── Balance Sheet        →  Reports → Financial → Balance Sheet
     ├── Cash Flow            →  Reports → Financial → Cash Flow
     ├── Equity Statement     →  Reports → Financial → Equity
     └── Notes (full PDF)     →  Reports → Financial → Full Report
     │
     ▼
  8. TAX COMPUTATION (ግብር ሒሳብ)
     │
     ├── BIT Computation      →  Tax → Business Income Tax → Compute
     ├── MAT Check            →  Tax → Business Income Tax (auto)
     ├── VAT/BIT Reconcile    →  Tax → VAT Administration → Reconcile
     └── DRRF Final Quarter   →  Tax → Disaster Fund
     │
     ▼
  9. EXTERNAL AUDIT (Tier 1 & 2)
     │
     └── Tax → Audit Outsourcing → Create Engagement
     │
     ▼
 10. MoR SUBMISSION (ወደ ሚ/ገቢ ማቅረብ)
     │
     ├── eTax Portal Filing   →  Tax → Tax Filing → Submit BIT
     ├── Pay Balance Due      →  Commercial bank / Telebirr
     ├── Record Payment       →  Tax → BIT → Record Payment
     ├── Attach Receipts      →  Tax → Tax Filing → Attach
     └── Lock Year            →  ovds → Period Close → Lock Year
     │
     ▼
 11. COMPLIANCE SCORE UPDATE (ምዝገባ ቅበላ)
     │
     └── Tax → Compliance Auditor → Refresh Score
         Score: 100/100 = All filings current ✅
═══════════════════════════════════════════════════════════════════
```

---

## 32. Final Management Sign-Off Declaration
### የዳይሬክተሮች ፊርማ ማረጋገጫ

This declaration must be signed by the CEO and CFO and attached to every set of submitted financial statements.

```
══════════════════════════════════════════════════════════════════
        DIRECTORS' RESPONSIBILITY STATEMENT
        የዳይሬክተሮች ኃላፊነት መግለጫ
══════════════════════════════════════════════════════════════════

We, the undersigned Directors of ABC Trading PLC (TIN: 0012345678),
confirm that to the best of our knowledge and belief:

1.  The financial statements for the year ended Sene 30, 2016 E.C.
    have been prepared in accordance with IFRS for SMEs as adopted
    by the Accounting and Auditing Board of Ethiopia (AABE).

2.  The financial statements give a true and fair view of the
    financial position, results of operations, and cash flows of
    the Company for the year ended Sene 30, 2016 E.C.

3.  All revenue, expenses, assets, and liabilities have been
    recorded on an accrual basis in accordance with IAS 1 §27.

4.  All applicable Ethiopian tax laws have been complied with,
    including Proclamation 979/2016 (Income Tax), Proclamation
    1341/2024 (VAT), Proclamation 715/2011 (Pension), and
    Regulation 570/2025 (DRRF).

5.  All monthly VAT returns, PIT remittances, pension remittances,
    and DRRF levies have been filed and paid on time.

6.  The BIT annual return for 2016 E.C. has been filed on the
    eTax portal (ref: ETX-BIT-2016-XXXXX) and the balance due
    of ETB 11,125 has been paid via [Bank Name] on [Date].

7.  We have maintained adequate internal controls to ensure the
    accuracy and completeness of the financial records.

8.  We are not aware of any material misstatement or fraud in the
    financial statements.

Signed on behalf of the Board of Directors:

──────────────────────────────────────────────────────────────────
Name: _________________________   Name: _________________________
Title: Chief Executive Officer    Title: Chief Financial Officer
Date:  _______________________    Date:  _______________________
Sign:  _______________________    Sign:  _______________________

Company Seal / ማህተም: [__________]
══════════════════════════════════════════════════════════════════
```

---

> **Document updated:** July 2026 | Part II extensions added  
> **Total sections:** 32 | **Total IFRS standards covered:** IAS 1, 2, 7, 10, 12, 16, 19, 20, 21, 24, 34, 36, 37, 38 + IFRS 9, 15, 16, 17  
> **Ethiopian law covered:** Proc. 979/2016, 1156/2019, 715/2011, 1341/2024, Reg. 570/2025  
> **Audit standards covered:** ISA 200, 230, 240, 250, 300, 315, 500, 505, 510, 520, 530, 540, 550, 560, 570, 700, 705, 720  
> Always verify at [mor.gov.et](https://mor.gov.et) · [aabe.gov.et](https://aabe.gov.et) · [etax.erca.gov.et](https://etax.erca.gov.et)

---

---

# PART III — COMPANY REGISTRATION, FULL HR LIFECYCLE & INTEGRATED MoR REPORT
## ክፍል ሶስት — የኩባንያ ምዝገባ፣ ሙሉ የሰው ሃብት ዑደት እና የተዋሃደ ሪፖርት

> This part covers: Ethiopian company registration under the 2021 Commercial Code, the complete HR lifecycle (recruitment → onboarding → training → performance → employee relations → labour compliance), how each HR stage generates financial obligations, and a fully integrated IFRS financial statement set with all HR costs properly classified for MoR submission.

---

## 33. Ethiopian Company Registration — 2021 Commercial Code
### የኩባንያ ምዝገባ | Commercial Code Proc. 1243/2021

The 2021 Commercial Code (Proclamation 1243/2021) replaced the 1960 Code and introduced new business structures. Registration is the legal foundation that connects founders, investors, MoR, ERCA, employees, creditors, customers, suppliers, and other third parties. Every later financial obligation — VAT registration, business income tax filing, pension registration, payroll withholding, audit responsibility, and licence renewal — flows from a correctly registered entity.

Formation should therefore be treated as the first control point in the reporting cycle, not as a standalone administrative step. The legal form selected at registration affects capital structure, owner liability, governance records, IFRS tier assessment, tax registration, audit scope, and the documents that must be retained for MoR inspection. Careful planning at this stage reduces future disputes, regulatory exposure, delayed filings, and unnecessary compliance costs.

---

### 33a. Business Structures Available Under the 2021 Code

| Structure | Amharic | Minimum Capital | Members | Liability | IFRS Tier Likely |
|-----------|---------|-----------------|---------|-----------|-----------------|
| Sole Proprietorship | ግለ ሥራ ፈጣሪ | None | 1 owner | Unlimited personal | Tier 3 / micro |
| General Partnership | ጠቅላላ አጋርነት | None | 2+ partners | Joint & unlimited | Tier 3 |
| Limited Partnership | ወሰን ያለው አጋርነት | None | 1 general + 1 limited | Mixed | Tier 3 / Tier 2 |
| **Limited Liability Partnership (LLP)** | **ሃ/ሃ አጋርነት** | **ETB 15,000** | **2–20** | **Limited to contribution** | **Tier 2 (new 2021)** |
| **One-Person Company (OPC)** | **አንድ ሰው ኩባንያ** | **ETB 15,000** | **1** | **Limited** | **Tier 2 (new 2021)** |
| Private Limited Company (PLC) | ኃ/የተ/የግ/ማ | ETB 15,000 | 2–50 | Limited to shares | Tier 2 |
| Share Company (S.C.) | አ/ማ | ETB 50,000 | 5+ (public: no max) | Limited to shares | Tier 1 |
| Cooperative Society | የኅብረት ሥራ ማህበር | Varies | 10+ | Limited | Tier 2 / 3 |
| Branch Office (Foreign) | ቅርንጫፍ ቢሮ | Varies | Parent company | Parent liable | Tier 1 |
| Representative Office | ወኪል ቢሮ | N/A | Parent company | Non-trading | No IFRS FS |

> **Key 2021 reforms:** The One-Person Company (OPC) allows a single individual to form a limited liability entity — previously impossible. The LLP introduces a new hybrid for professional service firms (law, accounting, consulting). Both are subject to the same AABE IFRS tiers as PLCs.

---

### 33b. Registration Steps — From Idea to First VAT Invoice

```
══════════════════════════════════════════════════════════════════
     COMPANY REGISTRATION PROCESS — ETHIOPIA 2021
     የኩባንያ ምዝገባ ሂደት | Commercial Code Proc. 1243/2021
══════════════════════════════════════════════════════════════════

PHASE 1 — PRE-REGISTRATION (ቅድመ ምዝገባ)
  │
  ├── Step 1: Choose business structure (OPC, PLC, LLP, S.C.)
  │           Consider: number of founders, capital, liability,
  │           sector restrictions, future investor access
  │
  ├── Step 2: Reserve company name
  │           → Ethiopian Trade Register (online: etrade.gov.et)
  │           → Name must be unique; not misleading; in Amharic or
  │             Latin; prohibited words require special approval
  │
  ├── Step 3: Draft founding documents
  │           → Memorandum of Association (የመሥራቻ ሰነድ)
  │           → Articles of Association (የድርጅቱ ደንብ)
  │           → Must comply with 2021 Commercial Code §§ 212–350
  │
  └── Step 4: Open pre-registration bank account (CBE or other)
              → Deposit minimum paid-up capital
              → Obtain bank certificate of deposit

PHASE 2 — REGISTRATION (ምዝገባ)
  │
  ├── Step 5: Submit to Trade Register / Addis Ababa City Admin
  │           Documents required:
  │           ☑ Completed registration form
  │           ☑ Memorandum & Articles of Association (notarised)
  │           ☑ Bank certificate of capital deposit
  │           ☑ National ID / passport of all founders
  │           ☑ TIN of all founders (personal TIN)
  │           ☑ Lease agreement for business premises
  │           ☑ Professional licence (if regulated sector)
  │
  ├── Step 6: Pay registration fee
  │           PLC: ETB 350 + ETB 50 per additional page
  │           OPC/LLP: ETB 250
  │           S.C.: ETB 1,000+
  │
  └── Step 7: Receive Certificate of Registration
              → Legal existence begins on this date
              → Company TIN issued within 3 working days

PHASE 3 — POST-REGISTRATION LICENSING (ድህረ ምዝገባ)
  │
  ├── Step 8: Obtain Business Licence
  │           → Sector-specific licence from relevant authority
  │           → Trade: Ministry of Trade & Regional Industry Bureau
  │           → Construction: Ministry of Urban & Infrastructure
  │           → Health: Ministry of Health
  │           → Education: Ministry of Education
  │           → Financial services: NBE
  │
  ├── Step 9: Register for Tax (TIN activation)
  │           → MoR registration: mor.gov.et or nearest MoR office
  │           → Register for BIT (all companies)
  │           → Register for VAT if turnover ≥ ETB 2,000,000/year
  │             (or voluntarily register from day 1)
  │           → Register for WHT collection
  │
  ├── Step 10: Register for Pension
  │            → Private Organisations Employees Social Security
  │              Agency (POESSA) — formerly PESNSSA
  │            → Register within 30 days of hiring first employee
  │            → Obtain employer pension account number
  │
  ├── Step 11: Open corporate bank account
  │            → TIN certificate required
  │            → Business licence required
  │            → Authorised signatory list
  │
  └── Step 12: Register for eTax portal
               → etax.erca.gov.et
               → Set up online tax filing credentials
               → Link TIN to portal account
══════════════════════════════════════════════════════════════════
```

---

### 33c. Founding Documents — Key Provisions (IAS 1 & IFRS Impact)

The Memorandum and Articles of Association establish the financial rules of the company. These provisions directly affect how IFRS financial statements are prepared and what disclosures are required.

| Founding Document Provision | IFRS / Accounting Impact |
|-----------------------------|-------------------------|
| Share capital amount & classes | IAS 1 equity presentation; Note 16 disclosure |
| Profit distribution / dividend policy | IAS 1 Statement of Changes in Equity |
| Financial year (fiscal year end) | IAS 1 — reporting period; Ethiopia: Sene 30 |
| Accounting basis declaration | IAS 1 §27 — must state accrual basis |
| Auditor appointment | ISA 700 — annual audit requirement |
| Borrowing powers | IAS 7 financing activities; IFRS 9 |
| Director remuneration | IAS 19 + IAS 24 related-party disclosure |
| Quorum & voting for financial approvals | Corporate governance; IAS 1 going concern |
| Retained earnings distribution limit | IAS 1 equity; legal reserve requirements |

> **Ethiopian legal reserve:** PLCs and Share Companies must maintain a **legal reserve** equal to at least **5% of annual net profit** until the reserve reaches **20% of paid-up capital**. This reserve is not distributable and must be disclosed separately in equity.

---

### 33d. Registration Costs — Opening Balance Sheet Impact

When a company is first registered, the registration and start-up costs are incurred. IFRS treatment:

```
OPENING JOURNAL ENTRIES AT REGISTRATION DATE
══════════════════════════════════════════════════════════════════
Event                    Debit               Credit         ETB
──────────────────────────────────────────────────────────────────
Capital contribution     1010 Cash           3010 Share     50,000
                                             Capital
Bank account opened      1010 Bank           1010 Cash      50,000
                         (Corporate)         (Founders)
Registration fee paid    6050 Prof. Fees     1010 Bank         350
  (IAS 38 — expense;     (or Org. Costs)
  not capitalised)
Business licence fee     6050 Prof. Fees     1010 Bank       1,500
  (annual; expense)
Premise lease deposit    1050 Prepaid Rent   1010 Bank      12,000
  (IFRS 16 if > 12 mo.)  (or ROU Asset)
Initial inventory        1060 Inventory      2010 AP /      80,000
  purchase                                   Bank
Office equipment         1120 Equipment      2010 AP /      45,000
  (PPE — IAS 16)                             Bank
══════════════════════════════════════════════════════════════════
NOTE: Under IAS 38, company formation costs (registration,
notary, legal fees) must be EXPENSED — they cannot be
capitalised as intangible assets. This is a common error
in Ethiopian accounting practice.
══════════════════════════════════════════════════════════════════
```


---

## 34. Full HR Lifecycle — Five Pillars with IFRS & Ethiopian Law Integration
### ሙሉ የሰው ሃብት ዑደት — 5 ዋና ዓምዶች

Every HR activity generates a financial transaction. The table below maps each HR pillar to its IFRS standard, Ethiopian law, and the specific journal entry it creates.

```
══════════════════════════════════════════════════════════════════
              HR LIFECYCLE → FINANCIAL IMPACT MAP
══════════════════════════════════════════════════════════════════

  [1. RECRUITMENT]──→[2. ONBOARDING]──→[3. TRAINING]
        │                   │                │
        ▼                   ▼                ▼
   IAS 19 expense      IAS 19 expense   IAS 19 expense
   Recruitment cost    Joining bonus    Training cost
        │                   │                │
        └───────────────────┴────────────────┘
                            │
                            ▼
                [4. PERFORMANCE MANAGEMENT]
                            │
                     IAS 19 — Bonus
                     IAS 19 — Increment
                            │
                            ▼
                [5. EMPLOYEE RELATIONS & COMPLIANCE]
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        IAS 37          IAS 19        Labour Proc.
      Provisions       Severance       1156/2019
     (Disputes)         (Termination)  (Compliance)
══════════════════════════════════════════════════════════════════
```

---

### 34a. PILLAR 1 — Recruitment (ምልምላ / ቅጥር)

Recruitment is the process of sourcing, screening, and selecting talent. In Ethiopia, it is governed by Labour Proclamation 1156/2019 and sector-specific rules (e.g., priority to Ethiopian nationals; work permits for expatriates).

#### Recruitment Process & Compliance Requirements

| Stage | Activity | Ethiopian Law Requirement | IFRS Impact |
|-------|----------|--------------------------|-------------|
| **Job Posting** | Advertise vacancy | Post in Amharic; accessible to all nationalities if specialised | Advertising cost → P&L expense |
| **Screening** | CV review, shortlisting | No discrimination (Art. 14 — Proc. 1156/2019) | Staff time → included in salary cost |
| **Interview** | Panel interview | Written record recommended; avoid bias | Staff time cost |
| **Reference Check** | Verify prior employment | Proc. 1156/2019 Art. 33 — prior service record matters for severance | — |
| **Medical Exam** | Pre-employment health check | Required for certain sectors (food, healthcare) | Medical cost → HR expense |
| **Offer Letter** | Written employment offer | Proc. 1156/2019 — contract must be in writing for terms > 45 days | Creates IAS 19 obligation from acceptance |
| **Contract Signing** | Employment agreement | Must specify: type, duration, salary, notice period, place of work | Determines IAS 19 benefit obligation |
| **Work Permit** | For expatriate employees | Issued by Ministry of Labour; renewed annually | Permit cost → HR expense; IAS 21 if USD-denominated |

#### Recruitment Cost Journal Entry

```
JOURNAL — Recruitment Costs | Meskerem 2016 E.C.
Ref: JE-HR-REC-001
──────────────────────────────────────────────────────────────────
DEBIT:
  6012  Recruitment & HR Expenses     18,500
    ├── Job advertisement (online/newspaper)  5,000
    ├── Recruitment agency fee               8,000
    ├── Interview travel reimbursements      3,000
    ├── Pre-employment medical exams         2,500
                                           ──────
CREDIT:
  1010  Bank / Cash                         18,500
──────────────────────────────────────────────────────────────────
IAS 19 note: Recruitment costs are PERIOD EXPENSES.
They are NOT capitalised as intangible assets under IAS 38.
══════════════════════════════════════════════════════════════════
```

---

#### Recruitment Workflow Type A — Corporate Agency invoice

HR departments that outsource hiring to staffing or placement agencies must establish clear written agreements before any fees are incurred. The agency invoice cycle maps to the standard AP workflow but carries HR-specific fee structures, refund guarantees, and WHT obligations.

**Fee Structure Patterns:**

| Type | Description | IFRS Treatment |
|------|-------------|---------------|
| Fixed placement fee | Flat amount per successful hire | Period expense — `6012` when candidate starts |
| % of annual salary | e.g., 15% of first-year CTC | Accrue on hire date; expense in period of placement |
| Retainer + success fee | Monthly retainer during search + placement fee | Retainer: expense monthly; success fee: expense on hire |
| Temporary staffing markup | Agency invoices cost + margin for contract workers | Expense as incurred; no placement fee on conversion |

**Agency invoice Cycle:**

```
══════════════════════════════════════════════════════════════════
[1. AGREEMENT]──→[2. SEARCH]──→[3. PLACEMENT]──→[4. INVOICE]
     │                │               │               │
     ▼                ▼               ▼               ▼
  Signed SLA     No invoice     Candidate        Bill raised
  (fee, refund   raised yet     accepts offer    in system
   guarantee,                   & starts work    (AP workflow)
   WHT clause)
     │
     ▼
[5. GUARANTEE PERIOD]──→[6a. PASS] → Invoice settled (NET of WHT)
     │                   [6b. FAIL] → Debit Note raised for refund
══════════════════════════════════════════════════════════════════
```

**System Steps:**

1. Record the agency as a **Vendor** — enter TIN, payment terms, and mark as *Recruitment Agency*
2. When the candidate starts: create a **Bill** under `Purchases → Bills`
   - Vendor: recruitment agency
   - Category: `6012 Recruitment & HR Expenses — Agency Fee`
    - WHT auto-calculated at 2% if agency TIN present and amount ≥ ETB 500
3. Link the bill to the hired **Employee** record for lifecycle tracking
4. During the guarantee period, hold final payment if refund clause is active
5. If the hire fails the guarantee period: raise a **Debit Note** against the agency bill
   - Debit note reduces the net payable or triggers a cash refund
   - Post the reversal credit to `6012` and update the GL automatically

```
JOURNAL — Agency Placement Fee (Guarantee Passed)
Ref: JE-HR-AGY-001
──────────────────────────────────────────────────────────────────
DEBIT:
  6012  Recruitment & HR Expenses — Agency Fee    8,000
                                                  ─────
CREDIT:
  2010  Accounts Payable (Agency)                 7,760
   2210  WHT Payable (2%)                            160
──────────────────────────────────────────────────────────────────
On payment:
DEBIT:
  2010  Accounts Payable (Agency)                 7,760
CREDIT:
  1010  Bank                                      7,760
══════════════════════════════════════════════════════════════════

JOURNAL — Agency Refund via Debit Note (Guarantee Failed)
Ref: JE-HR-AGY-DN-001
──────────────────────────────────────────────────────────────────
DEBIT:
  2010  Accounts Payable (Agency)                 8,000
CREDIT:
  6012  Recruitment & HR Expenses — Agency Fee    8,000
  (Reversal — candidate left within guarantee period)
══════════════════════════════════════════════════════════════════
```

---

#### Recruitment Workflow Type B — Worker / Candidate Cost Recovery

HR departments regularly advance costs on behalf of candidates during recruitment — travel, accommodation, assessments, pre-employment medicals, and relocation. Where an agreement exists to recover these costs from the worker or candidate, they must be tracked as receivables or payroll deductions, not expensed until confirmed irrecoverable.

**Cost Recovery Agreement Requirements:**

Before advancing any cost, HR must document:
- The specific cost items covered and their capped amounts
- The trigger for recovery (candidate declines offer, resigns before X months, no-show)
- The recovery method (payroll deduction schedule or cash repayment)
- The write-off policy if the candidate cannot repay

**Common Scenarios and Accounting Treatment:**

| Cost Incurred | Candidate Joins | Candidate Does Not Join | Early Resignation |
|--------------|----------------|------------------------|------------------|
| Interview travel advance | Deduct via payroll or treat as benefit | Raise receivable → demand letter → write-off if uncollectable | Recover remaining balance via payroll acceleration or receivable |
| Relocation allowance | Amortise deduction over agreed months | Raise receivable for full amount | Pro-rata recovery per service bond terms |
| Pre-employment medical | Expense `6012` — non-recoverable by convention | Recoverable if offer declined; raise receivable | Not applicable (cost predates employment) |
| Skills certification fee | Expense `6012` with service bond — recover if candidate leaves early | Raise receivable if candidate refuses without joining | Pro-rata recovery per IAS 19 service bond rules |
| Work permit / visa (expatriate) | Expense `6012`; recover portion if contract ends early | N/A | IAS 21 — FX impact if USD-denominated; recover at spot rate |

**System Workflow — Advance and Recovery:**

```
══════════════════════════════════════════════════════════════════
[1. ADVANCE PAID]
  Dr  1030  Staff Advance — Recruitment
    Cr  1010  Bank
──────────────────────────────────────────────────────────────────
[2a. CANDIDATE JOINS]
  → Link advance to Employee record
  → Set up payroll deduction (Other Deductions → Advance Recovery)
  → System deducts monthly until balance = 0
  → When cleared:
      Dr  6012  Recruitment & HR Expenses
        Cr  1030  Staff Advance — Recruitment
──────────────────────────────────────────────────────────────────
[2b. CANDIDATE DOES NOT JOIN / RESIGNS WITHIN RECOVERY PERIOD]
  → Transfer advance to receivable:
      Dr  1020  Receivable — Candidate Cost Recovery
        Cr  1030  Staff Advance — Recruitment
  → Issue formal demand letter; track in AR Aging
  → If recovered:
      Dr  1010  Bank
        Cr  1020  Receivable — Candidate Cost Recovery
  → If unrecoverable (write-off approved):
      Dr  6012  Recruitment & HR Expenses
        Cr  1020  Receivable — Candidate Cost Recovery
══════════════════════════════════════════════════════════════════
```

**Reimbursing Candidates for Agreed Interview Costs:**

Where the company agrees to cover a candidate's travel or accommodation for an interview and no recovery clause applies:
1. Candidate submits receipts to HR
2. HR creates an **Expense Claim** on the candidate's behalf (`/expenses` — HR role required)
3. ovds approves; payment is made via **Fund Transfer** to the candidate's bank account
4. Post directly to `6012 Recruitment & HR Expenses — Interview Reimbursement`
5. No receivable is created — cost is a period expense under IAS 19

**IAS 19 Classification Summary for Both Workflow Types:**

| Cost Item | IAS 19 Category | P&L Line |
|-----------|----------------|----------|
| Agency placement fee | Short-term employee benefit cost (pre-employment) | Operating expenses — HR |
| Agency retainer | Operating expense — period charge | Operating expenses — HR |
| Interview travel reimbursement to candidate | Pre-employment cost — expense immediately | Operating expenses — HR |
| Relocation advance (recovered via payroll) | Balance sheet advance until recovered; then `6012` | Operating expenses — HR |
| Unrecovered advance written off | Period expense — impairment of receivable | Operating expenses — HR |
| Service bond certification fee (not recovered) | IAS 19 training cost — expense over service bond period | Operating expenses — Staff development |

---

#### Employment Contract Types — Payroll & Tax Treatment

```
══════════════════════════════════════════════════════════════════
CONTRACT TYPE    DURATION   NOTICE PERIOD   PROBATION   PENSION
──────────────────────────────────────────────────────────────────
Indefinite term  Open-ended 1 month (basic) Up to 45 days  ✅ 7%+11%
Fixed-term       Specified  End of contract Up to 45 days  ✅ 7%+11%
  (≤ 1 year may be renewed once only; then becomes indefinite)
Part-time        Hourly/day Proportional   Proportional   ✅ Proportional
Casual/daily     Per day    None required  None           ❌ Exempt
Apprenticeship   ≤ 2 years  Per agreement  N/A            ❌ Depends
Expatriate       Fixed      Per contract   Per contract   Negotiated
══════════════════════════════════════════════════════════════════
```

---

### 34b. PILLAR 2 — Onboarding (ስምሪት / ማስተዋወቅ)

Onboarding covers the period from contract signing through the probation end. Costs in this phase include orientation materials, joining bonuses, uniform/PPE issuance, and IT setup.

#### Onboarding Cost Schedule

| Cost Item | Amount (ETB) | IFRS Treatment | Account |
|-----------|-------------|---------------|---------|
| Orientation programme (2 days) | 3,600 | IAS 19 — period expense | 6012 Training |
| Joining bonus (if agreed in contract) | 5,000 | IAS 19 — employee benefit; accrue if conditional | 6010 Salaries |
| Uniform / safety equipment | 2,400 | IAS 2 / IAS 16 if significant; otherwise expense | 6080 Office Supplies |
| IT equipment setup (laptop) | 28,000 | IAS 16 — capitalise as PPE; depreciate | 1150 IT Equipment |
| ID card / access card | 500 | Period expense | 6080 Misc Admin |
| Mandatory medical insurance | 1,800/month | IAS 19 — employee benefit | 6060 Insurance |

#### Probation Period Rules (Labour Proc. 1156/2019 Art. 10)

```
Maximum probation period:  45 working days (for standard employment)
                           3 months (for managerial/professional roles)

During probation:
  → Either party may terminate without notice or severance
  → PIT and pension obligations STILL APPLY from day 1
  → If terminated during probation: no severance
  → After probation ends: full employment protection applies

IAS 19 Impact:
  → Leave accrual starts from day 1 of employment (not end of probation)
  → Severance provision: start accruing from end of probation
    (probability of payout increases significantly after confirmation)
```

---

### 34c. PILLAR 3 — Training & Development (ሥልጠና እና ዕድገት)

#### Types of Training & IFRS Treatment

| Training Type | Purpose | IAS Treatment | Deductible for BIT? |
|--------------|---------|--------------|---------------------|
| Induction training | Orientation to role | IAS 19 — expense immediately | ✅ Yes |
| Technical/skills training | Job performance | IAS 19 — expense; not capitalised | ✅ Yes |
| Management development | Leadership pipeline | IAS 19 — expense | ✅ Yes |
| University / MBA sponsorship | Long-term development | IAS 19 — accrue if service bond applies; expense if not | ✅ Yes (if bonded) |
| Safety & compliance training | Legal requirement (Labour Proc.) | IAS 19 — mandatory; expense | ✅ Yes |
| Overseas training | International certification | IAS 19 + IAS 21 (FX if USD fees) | ✅ Yes |
| Software / system training | OVDS, ERP, accounting tools | Can be part of software implementation cost (IAS 38) | ✅ Yes |

```
JOURNAL — Annual Training Programme | 2016 E.C.
Ref: JE-HR-TRN-2016
──────────────────────────────────────────────────────────────────
DEBIT:
  6012  Staff Training & Development    24,000
    ├── Internal trainer costs           6,000
    ├── External training provider      12,000
    ├── Training materials & books       3,000
    ├── Venue & catering                 3,000
                                        ──────
CREDIT:
  1010  Bank                            20,000
  2060  Accrued Training Payable         4,000
  (outstanding invoice from provider)
──────────────────────────────────────────────────────────────────
NOTE: Training costs are NEVER capitalised under IAS 38.
Even if training improves employee performance (like an
intangible), it does not meet the capitalisation criteria
because the trained employee could leave the company.
══════════════════════════════════════════════════════════════════
```

#### Service Bond Accounting (Study Leave with Return Obligation)

When a company sponsors an employee's education and includes a service bond (e.g., "work for 3 years or repay training fees"), account as follows:

```
During sponsorship:
  Dr  1030  Staff Advance — Education Bond    80,000
    Cr  1010  Bank                            80,000

Each year of service fulfilled:
  Dr  6012  Training Expense (P&L)            26,667
    Cr  1030  Staff Advance — Education Bond  26,667
  (ETB 80,000 ÷ 3 years = ETB 26,667/year)

If employee leaves before bond ends:
  Dr  1020  Receivable from Employee          (remaining balance)
    Cr  1030  Staff Advance — Education Bond
  (Recover via final settlement or legal action)
```


---

### 34d. PILLAR 4 — Performance Management (የሥራ አፈጻጸም ምዘና)

Performance management generates the financial obligations of salary increments, bonuses, and promotions. Under IAS 19, all these are employee benefits that must be recognised when the obligation arises.

#### Performance Review Cycle — Ethiopian Best Practice

```
══════════════════════════════════════════════════════════════════
PERFORMANCE MANAGEMENT CYCLE (Annual)
══════════════════════════════════════════════════════════════════

  Hamle (Jul) ─── Sene (Jun)
  │
  ├── Hamle: Set KPIs and objectives for new FY
  │          → HR → Performance → Set Objectives
  │
  ├── Tikmt: Mid-year review (informal check-in)
  │          → HR → Performance → Mid-Year Review
  │
  ├── Miazia: End-of-year performance appraisal
  │           → HR → Performance → Annual Review
  │           → Score: 1 (Below) to 5 (Outstanding)
  │
  └── Sene: Results communicated; decisions made
            → Increment decisions
            → Bonus calculations
            → Promotion approvals
            → PIP (Performance Improvement Plans)
            → Termination (if score ≤ 1 after PIP)
══════════════════════════════════════════════════════════════════
```

#### Performance-Linked Financial Obligations

| Outcome | Amount (ETB) | IFRS Treatment | Journal |
|---------|-------------|---------------|---------|
| Annual salary increment (5–15%) | Varies per employee | IAS 19 — new obligation from effective date | Adjust payroll from Hamle |
| Performance bonus (1–3 months salary) | ETB 10,000–45,000 per employee | IAS 19 — accrue when constructive obligation exists (board approval) | Dr Bonus Expense / Cr Bonus Payable |
| Promotion (grade change) | Higher salary from promotion date | IAS 19 — from effective date; may affect severance calculation | Update payroll; adjust leave accrual rate |
| Annual merit increase pool | 10% of basic salary bill | IAS 19 §19 — accrue entire pool at year-end if obligation probable | Dr Salary Expense / Cr Accrued Increments |
| PIP (no improvement → dismissal) | Severance if applicable | IAS 37 — provision when dismissal plan approved | Dr Severance Expense / Cr Provision |

```
JOURNAL — Year-End Bonus Accrual | Sene 30, 2016 E.C.
Ref: JE-HR-BON-2016
──────────────────────────────────────────────────────────────────
Board approved annual bonus pool = ETB 120,000 (all staff)
(Accrued because board approved; payment in Hamle next year)

DEBIT:
  6010  Employee Bonus Expense         120,000

CREDIT:
  2050  Bonus Payable (Current Liability) 120,000
──────────────────────────────────────────────────────────────────
PIT on bonus: Payable when bonus is paid (next period).
Pension on bonus: Bonus is pensionable — pension deducted at payment.
══════════════════════════════════════════════════════════════════
```

#### Salary Increment Schedule — Updated Payroll Impact

```
══════════════════════════════════════════════════════════════════
ANNUAL SALARY INCREMENT | Effective Hamle 1, 2017 E.C.
══════════════════════════════════════════════════════════════════
Employee         Old Basic  Increment%  New Basic  Additional
                 (ETB)                  (ETB)      Monthly Cost(ETB)
──────────────────────────────────────────────────────────────────
Abebe Tadesse    12,000      8%         12,960          960
Tigist Mekonen    9,500     10%         10,450          950
Dawit Alemu       7,200      7%          7,704          504
Selamawit Haile   6,500      8%          7,020          520
Yonas Bekele     15,000     10%         16,500        1,500
Hiwot Girma       8,000      7%          8,560          560
Solomon Tesfaye   6,000      8%          6,480          480
Meron Assefa      5,500      7%          5,885          385
Biruk Negash     11,000     10%         12,100        1,100
Fikirte Wolde     8,500      8%          9,180          680
Getachew Desta    4,000      7%          4,280          280
Almaz Kebede      5,000      7%          5,350          350
Robel Hailu       5,800      7%          6,206          406
Kidist Berhe      6,200      8%          6,696          496
Liya Tsegaye      9,000      8%          9,720          720
──────────────────────────────────────────────────────────────────
TOTAL           119,200             128,081         9,891/month
Additional annual cost (from Hamle 2017):  ETB 118,692/year
══════════════════════════════════════════════════════════════════
```

---

### 34e. PILLAR 5 — Employee Relations & Labour Compliance
### ሠራተኞች ግንኙነት እና የሥራ ሕግ ተፈጻሚነት

This pillar covers grievance handling, disciplinary procedures, termination processes, and full compliance with Ethiopian labour law. It generates IAS 37 provisions and IAS 19 termination benefit obligations.

#### Disciplinary Process (Labour Proc. 1156/2019 Art. 27–42)

```
DISCIPLINARY PROCESS — REQUIRED STEPS
══════════════════════════════════════════════════════════════════

Minor Misconduct (ቀለል ያለ ጥፋት):
  → Verbal warning → Written warning (1st) → Written warning (2nd)
  → After 3 warnings within 12 months → Termination for cause

Serious Misconduct (ከፋ ያለ ጥፋት — Art. 27):
  → Fraud, theft, violence, willful damage to company property,
    sexual harassment, 10+ consecutive unauthorised absences
  → Summary dismissal allowed (no notice; no severance)
  → Must be reported to Labour Office within 10 days

Required Procedure Before Dismissal:
  ☑  Written charges served to employee
  ☑  Employee given minimum 5 working days to respond
  ☑  Union representation allowed (if unionised)
  ☑  Written decision issued with reasons
  ☑  Employee informed of right to appeal to Labour Court
  ☑  File all documentation in personnel record

IFRS Impact:
  → Wrongful dismissal claim risk → IAS 37 provision if probable
  → Redundancy/restructuring → IAS 19 termination benefits
```

#### Termination Types & Financial Obligations

| Termination Type | Notice | Severance Pay | IAS Treatment |
|-----------------|--------|--------------|---------------|
| Resignation (employee-initiated) | 1 month (standard) | None | No provision needed |
| Termination for cause (serious misconduct) | None | None | No provision; expense if legal challenge |
| Termination without cause (employer-initiated) | 1 month or pay in lieu | **1 month salary × years of service** (max 12 months) | IAS 37 provision when decision made |
| Redundancy (economic/restructuring) | 1 month | **1 month salary × years of service** | IAS 19 termination benefit + IAS 37 provision |
| Mutual agreement | Negotiated | Negotiated (≥ statutory minimum) | IAS 19 at agreed amount |
| End of fixed-term (not renewed) | None | Statutory severance if > 1 year | Accrue from end of contract date |
| Retirement | None | Pension (POESSA) + gratuity | IAS 19 post-employment |
| Death | N/A | Paid to beneficiary | IAS 19 + IAS 37 |

```
SEVERANCE CALCULATION EXAMPLE:
══════════════════════════════════════════════════════════════════
Employee: Abebe Tadesse
  Years of service:        6.5 years
  Last basic salary:       ETB 12,960 (after increment)
  Severance entitlement:   6.5 months × ETB 12,960 = ETB 84,240
  Capped at 12 months:     ETB 84,240 < (12 × 12,960 = 155,520) ✓

  Tax on severance:        EXEMPT — not subject to PIT
  Pension on severance:    NOT pensionable

JOURNAL — Severance Payment:
  Dr  2150  Provision for Severance    84,240
    Cr  1010  Bank                     84,240
  (Release provision when paid; provision was accrued annually)
══════════════════════════════════════════════════════════════════
```

#### Labour Compliance Calendar

| Obligation | Law | Frequency | Penalty for Non-Compliance |
|-----------|-----|-----------|---------------------------|
| Written employment contracts | Proc. 1156/2019 Art. 8 | On hiring | Labour Court claim; fines |
| Maintain personnel records | Proc. 1156/2019 Art. 33 | Ongoing | Labour inspection finding |
| Remit PIT | Proc. 979/2016 | Monthly | 2%/month + penalties |
| Remit pension (7%+11%) | Proc. 715/2011 | Monthly | Legal action by POESSA |
| Minimum wage compliance | Sector agreements | Ongoing | Labour Court order |
| Annual leave entitlement | Proc. 1156/2019 Art. 75 | Annual | Employee claim + damages |
| Overtime pay (150%/175%/200%) | Proc. 1156/2019 Art. 68 | When applicable | Back-pay + penalties |
| Maternity leave (90 days, full pay) | Proc. 1156/2019 Art. 88 | When applicable | Labour Court; damages |
| Work permit (expatriates) | Proc. 923/2016 | Annual renewal | Deportation; company fine |
| Safety training (hazardous work) | Proc. 1156/2019 Art. 93 | Before commencement | Labour inspection closure |
| Register with Labour Office | Proc. 1156/2019 | Within 30 days of opening | Fine |
| Annual HR report to Labour Office | Proc. 1156/2019 | Annual | Fine |


---

## 35. Full HR Cost Note — IAS 19 Complete Disclosure (Note 7 Extended)
### ሙሉ የሠራተኞች ጥቅም ማብራሪያ | IAS 19 Employee Benefits — Full Note 7

This is the complete Note 7 for the financial statements, incorporating all five HR lifecycle pillars.

```
══════════════════════════════════════════════════════════════════
      NOTE 7 — EMPLOYEE BENEFITS (IAS 19)
      ማስታወሻ 7 — የሠራተኞች ጥቅም
      For the Year Ended Sene 30, 2016 E.C. (July 7, 2024)
══════════════════════════════════════════════════════════════════

7A. EMPLOYEE NUMBERS (Average headcount during the year)
────────────────────────────────────────────────────────
  Department         2016 E.C.   2015 E.C.
  Sales                   3           3
  ovds                 2           2
  Operations              3           2
  HR & Admin              3           3
  IT                      3           2
  Casual/Part-time        1           1
  ──────────────────────────────────
  Total                  15          13

  Full-time equivalent (FTE):      14.5         12.5
  Permanent employees:               12           10
  Fixed-term employees:               2            2
  Part-time employees:                1            1

──────────────────────────────────────────────────────────────────
7B. SHORT-TERM EMPLOYEE BENEFITS (IAS 19 §8)
────────────────────────────────────────────
                                 2016 E.C.   2015 E.C.
                                 ETB         ETB
  Basic Salaries               1,433,400   1,243,200
  Transport Allowances           320,400     278,400
  Housing Allowances             352,200     305,400
  Overtime Pay                    48,000      36,000
  Annual Performance Bonuses      120,000      96,000
  ──────────────────────────────────────────────────
  Total Short-term Benefits     2,274,000   1,959,000

──────────────────────────────────────────────────────────────────
7C. POST-EMPLOYMENT BENEFITS — DEFINED CONTRIBUTION (IAS 19 §27)
──────────────────────────────────────────────────────────────────
  Employer Pension (11% of basic)  157,344     136,499
  Employee Pension (7% of basic)   100,128      87,024
  (Employee portion deducted from gross; not a P&L charge)
  ──────────────────────────────────────────────────
  P&L charge (employer portion only) 157,344   136,499

  Pension is a defined contribution plan administered by
  Private Organisations Employees Social Security Agency
  (POESSA). The company has no further obligation beyond
  remitting 11% of each employee's basic salary monthly.

──────────────────────────────────────────────────────────────────
7D. OTHER LONG-TERM BENEFITS (IAS 19 §153)
────────────────────────────────────────────
  Annual Leave Accrual:
    Opening balance                 48,000      39,500
    Charged to P&L                  73,404      63,700
    Leave taken (at cost)          (60,000)    (55,200)
    ──────────────────────────────────────────────────
    Closing Accrued Leave Payable   61,404      48,000

──────────────────────────────────────────────────────────────────
7E. TERMINATION BENEFITS — PROVISIONS (IAS 19 §159 / IAS 37)
──────────────────────────────────────────────────────────────────
  Severance Provision:
    Opening balance                 72,000      58,000
    Charged to P&L (new accrual)    91,881      79,718
    Paid during year               (36,000)    (65,718)
    ──────────────────────────────────────────────────
    Closing Provision for Severance 127,881      72,000

  Note: Severance provision is based on a probability-weighted
  estimate of expected payouts within 12 months. Management
  assumes a 15% annual turnover rate based on historical data.

──────────────────────────────────────────────────────────────────
7F. HR LIFECYCLE COSTS (Additional P&L Classification)
────────────────────────────────────────────────────────
                                           2016 E.C.   2015 E.C.
                                           ETB         ETB
  RECRUITMENT — Workflow Type A (Agency invoice):
    Job advertisement (online/newspaper)     2,500       1,800
    Recruitment agency placement fee         8,000       6,800
    Pre-employment medical exams             2,500       1,800
    ───────────────────────────────────────────────────────────
    Subtotal — Agency & Advertising         13,000      10,400

  RECRUITMENT — Workflow Type B (Candidate Cost Recovery):
    Interview travel reimbursements           3,000       2,200
    Candidate cost advances — written off        0           0
      (no irrecoverable advances this year)
    Relocation assistance (net of payroll
      deductions recovered)                  2,500       1,600
    ───────────────────────────────────────────────────────────
    Subtotal — Candidate Cost Recovery        5,500       3,800

  ONBOARDING & ORIENTATION                   7,600       5,400
  TRAINING & DEVELOPMENT                    24,000      18,000
  PERFORMANCE MANAGEMENT (systems)           6,000       4,500
  LABOUR COMPLIANCE & LEGAL (HR law advice)  8,000       6,000
  ──────────────────────────────────────────────────────
  Total HR Lifecycle Costs                  64,100      48,100

  Notes:
  (i)  Agency fees (Type A) are expensed when the placed candidate
       starts work. Any refund within the guarantee period is
       credited back via Debit Note against account 6012.
  (ii) Candidate advances (Type B) are initially carried in
       account 1030 (Staff Advance — Recruitment) and transferred
       to 6012 only when recovered via payroll deduction or when
       confirmed irrecoverable and written off with management approval.
  (iii)No candidate advances remain outstanding at Sene 30, 2016 E.C.
       (2015: nil). All advances made during the year were either
       recovered through payroll deductions or refunded by the
       respective candidates.

──────────────────────────────────────────────────────────────────
7G. TOTAL IAS 19 CHARGE TO P&L
────────────────────────────────
                                 2016 E.C.   2015 E.C.
                                 ETB         ETB
  Short-term employee benefits  2,274,000   1,959,000
  Employer pension (11%)          157,344     136,499
  Annual leave accrual             73,404      63,700
  Severance provision accrual      91,881      79,718
  HR lifecycle costs               64,100      48,100
  ──────────────────────────────────────────────────
  TOTAL EMPLOYEE BENEFIT EXPENSE 2,660,729   2,287,017

──────────────────────────────────────────────────────────────────
7H. BALANCE SHEET — EMPLOYEE LIABILITIES (Current)
────────────────────────────────────────────────────
                                 2016 E.C.   2015 E.C.
                                 ETB         ETB
  Accrued Salaries Payable          48,000      42,000
  PIT Payable                       28,588      24,000
  Pension Payable (7%+11%)          21,456      18,000
  Bonus Payable                    120,000      96,000
  Accrued Leave Payable             61,404      48,000
  ──────────────────────────────────────────────────
  Total Current Employee Liabilities 279,448   228,000

  Provision for Severance (Non-current) 127,881  72,000
══════════════════════════════════════════════════════════════════
```


---

## 36. Integrated IFRS Financial Statements — Full HR Lifecycle Applied
### ሙሉ የሰው ሃብት ዑደት ወጪዎች ያካተቱ ፋይናንሻል ስቴትመንቶች

This is the production-ready, fully integrated set incorporating company registration context, all five HR pillars, full IAS 19, Ethiopian audit standards, and MoR-ready format.

---

### 36a. Statement of Profit or Loss — Full Version (Bilingual)

```
══════════════════════════════════════════════════════════════════════
         ABC TRADING PLC — ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
    Registered: Addis Ababa Trade Register No. 001/PLC/2010
    TIN: 0012345678  |  VAT Reg: VAT-001-2010  |  AABE Tier 2
    ──────────────────────────────────────────────────────────────
    STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME
         የገቢና ወጪ እና አጠቃላይ ሌሎች ሃብት/ኪሳራ መግለጫ
    For the Year Ended Sene 30, 2016 E.C. (July 7, 2024)
    Basis: Accrual | Currency: ETB | Standard: IFRS for SMEs (AABE)
══════════════════════════════════════════════════════════════════════
                                      Note  2016 E.C.    2015 E.C.
                                            ETB           ETB
──────────────────────────────────────────────────────────────────────
REVENUE — ገቢ                           4
  Sales Revenue — Domestic (15% VAT)        3,650,000    3,200,000
  Sales Revenue — Export (0% VAT)           1,200,000    1,000,000
  Service Revenue                             350,000      280,000
  Other Income (rent, gains)                   45,000       30,000
                                            ─────────    ─────────
  TOTAL REVENUE — ጠቅላላ ገቢ                  5,245,000    4,510,000

COST OF GOODS SOLD — የሸቀጣሸቀጥ ዋጋ       5
  Opening Inventory (IAS 2 — FIFO)           480,000      390,000
  Purchases                                2,100,000    1,850,000
  Less: Closing Inventory                   (520,000)    (480,000)
  Inventory Write-Down to NRV (IAS 2)          8,000        5,000
                                            ─────────    ─────────
  TOTAL COST OF GOODS SOLD                 2,068,000    1,765,000
                                            ─────────    ─────────
GROSS PROFIT — ጠቅላላ ትርፍ                  3,177,000    2,745,000
  Gross Profit Margin                          60.6%        60.9%

OPERATING EXPENSES — የሥራ ወጪዎች

  EMPLOYEE COSTS (IAS 19)               7
  ─── Short-term Benefits ───
    Basic Salaries                         1,433,400    1,243,200
    Transport Allowances                     320,400      278,400
    Housing Allowances                       352,200      305,400
    Overtime Pay                              48,000       36,000
    Performance Bonuses (accrued)            120,000       96,000
  ─── Post-employment (Pension) ───
    Employer Pension Contribution (11%)      157,344      136,499
  ─── Other Long-term Benefits ───
    Annual Leave Accrual (IAS 19)             73,404       63,700
    Severance Provision (IAS 37)              91,881       79,718
  ─── HR Lifecycle Costs ───
    Recruitment (ads, agency, medicals)       18,500       14,200
    Onboarding & Orientation                   7,600        5,400
    Staff Training & Development              24,000       18,000
    Performance Management Systems            6,000        4,500
    Labour Compliance & Legal (HR)             8,000        6,000
                                            ─────────    ─────────
    TOTAL EMPLOYEE COSTS                   2,660,729    2,287,017

  ASSET-RELATED COSTS (IAS 16 / IAS 38 / IFRS 16)
    Depreciation — Buildings (IAS 16)         12,000       12,000
    Depreciation — Vehicles (IAS 16)          65,000       65,000
    Depreciation — Equipment (IAS 16)         19,000       19,000
    Amortisation — Software (IAS 38)          12,000       12,000
    Depreciation — ROU Asset (IFRS 16)        42,000       42,000
                                            ─────────    ─────────
    TOTAL DEPRECIATION & AMORTISATION        150,000      150,000

  OPERATING OVERHEADS
    Rent — Short-term leases                   24,000       21,600
    Utilities (Electricity, Water, Internet)   96,000       84,000
    Marketing & Advertising                    64,000       52,000
    Professional Fees (Audit ETB 30k,
      Legal ETB 14k, Tax advisory ETB 10k)     54,000       45,000
    Insurance (business)                       18,000       15,000
    Travel & Business Transport                36,000       30,000
    Office Supplies & Consumables              12,000       10,000
    Repairs & Maintenance                      24,000       20,000
    Communication & IT                         18,000       15,000
    Impairment — Bad Debts (IFRS 9 ECL)        26,500       18,000
    Miscellaneous Administrative               15,000       12,000
                                            ─────────    ─────────
    TOTAL OVERHEADS                           387,500      322,600

  STATUTORY LEVIES
    DRRF Levy (1% of turnover)                 52,450       45,100
                                            ─────────    ─────────
  TOTAL OPERATING EXPENSES                 3,250,679    2,804,717
                                            ─────────    ─────────
OPERATING LOSS / (PROFIT)                    (73,679)     (59,717)
  (ከወለድ እና ግብር በፊት የሥራ ትርፍ/ኪሳራ)

ovds COSTS                           11
  Interest on Bank Loan                       (48,000)     (48,000)
  Interest on Lease Liability (IFRS 16)       (24,000)     (28,800)
  Bank Charges & Fees                          (6,000)      (5,400)
  Foreign Exchange Loss (IAS 21)               (8,000)      (4,000)
                                            ─────────    ─────────
  TOTAL ovds COSTS                         (86,000)     (86,200)
                                            ─────────    ─────────
LOSS BEFORE TAX — ከግብር በፊት ኪሳራ             (159,679)    (145,917)

TAXATION (IAS 12)                       12
  Current Tax: BIT 30% × Taxable Income            0            0
  MAT: 2.5% × ETB 5,245,000 (floor applies)  (131,125)    (112,750)
    Note: BIT on loss = nil; MAT = ETB 131,125
    (Company pays MAT even though it has a loss)
  Deferred Tax Benefit (IAS 12)                 1,800        1,500
                                            ─────────    ─────────
  TOTAL TAX EXPENSE                          (129,325)    (111,250)
                                            ─────────    ─────────
TOTAL LOSS AFTER TAX                         (289,004)    (257,167)
  ከግብር በኋላ ጠቅላላ ኪሳራ

OTHER COMPREHENSIVE INCOME (OCI)
  Revaluation surplus on PPE (IAS 16)               —            —
  FX translation differences (IAS 21)               —            —
                                            ─────────    ─────────
TOTAL COMPREHENSIVE LOSS                     (289,004)    (257,167)
══════════════════════════════════════════════════════════════════════
Note: The net loss arises because full IAS 19 accruals (leave,
severance, bonuses) and all HR lifecycle costs are correctly
recognised. The MAT floor of ETB 131,125 applies regardless of
the accounting loss, as it is calculated on gross turnover.
This is a critical insight for Ethiopian business planning:
a company can report an accounting loss and still owe MAT.
══════════════════════════════════════════════════════════════════════
```


---

### 36b. Statement of Financial Position — Full Version with HR Liabilities

```
══════════════════════════════════════════════════════════════════════
         ABC TRADING PLC — ኤቢሲ ትሬዲንግ ኃ/የተ/የግ/ማ
              STATEMENT OF FINANCIAL POSITION
                   የፋይናንሻል ሁኔታ መግለጫ
         As at Sene 30, 2016 E.C. (July 7, 2024)
══════════════════════════════════════════════════════════════════════
                                      Note  2016 E.C.    2015 E.C.
                                            ETB           ETB
──────────────────────────────────────────────────────────────────────
ASSETS — ሃብቶች

NON-CURRENT ASSETS — ቋሚ ሃብቶች
  Property, Plant & Equipment — net  9      776,000      960,000
  Intangible Assets (Software)       13      36,000       48,000
  Right-of-Use Assets (IFRS 16)      14     168,000      210,000
  Deferred Tax Asset (IAS 12)        12       3,300        1,500
  Staff Bond Advance (Education)           53,333       80,000
                                           ─────────    ─────────
  Total Non-Current Assets                1,036,633    1,299,500

CURRENT ASSETS — ተንቀሳቃሽ ሃብቶች
  Inventories (IAS 2 — FIFO)         6      520,000      480,000
  Trade Receivables (net ECL)        10      671,500      680,000
  Input VAT Receivable                        42,000       38,000
  Prepaid Expenses                            28,000       36,000
  Staff Advances (expense claims)             12,000        8,000
  Cash and Cash Equivalents          15      385,996      654,000
                                           ─────────    ─────────
  Total Current Assets                     1,659,496    1,896,000
                                           ─────────    ─────────
TOTAL ASSETS — ጠቅላላ ሃብቶች                  2,696,129    3,195,500

──────────────────────────────────────────────────────────────────────
EQUITY — ፍትሃዊ ድርሻ

  Share Capital                      16      500,000      500,000
  Legal Reserve (5% × prior profit)          12,858       10,000
  Retained Earnings / (Accumulated
    Deficit)                               (318,004)     (29,000)
    Opening                                (28,997)     228,170
    Net Loss for year                      (289,004)    (257,167)
    Dividends                                     0            0
                                           ─────────    ─────────
  TOTAL EQUITY                               194,854      481,000

NON-CURRENT LIABILITIES — ረጅም ጊዜ ዕዳዎች
  Long-term Bank Loan                17      137,000      200,000
  Lease Liability — Non-current      14      120,000      140,000
  Deferred Tax Liability (IAS 12)    12       35,100       36,000
  Provision for Severance (IAS 37)   7      127,881       72,000
                                           ─────────    ─────────
  Total Non-Current Liabilities             419,981      448,000

CURRENT LIABILITIES — አጭር ጊዜ ዕዳዎች
  Trade Payables                              98,000       82,000
  VAT Payable (Output − Input)         1      52,000       44,000
  PIT Payable                          7      28,588       24,000
  Pension Payable (7% + 11%)           7      21,456       18,000
  Accrued Salaries                     7      48,000       42,000
  Bonus Payable                        7     120,000       96,000
  Accrued Leave Payable                7      61,404       48,000
  Accrued Recruitment & Training              18,500       14,200
  Short-term Working Capital Facility      1,478,000    1,740,000
  Current Portion — Bank Loan         17      63,000       72,000
  Current Portion — Lease             14      20,000       20,000
  DRRF Levy Payable                            9,150        8,300
  Provision for Tax Disputes (IAS 37)         36,196       36,000
  Deferred Revenue (IFRS 15)                  15,000       12,000
  Other Accrued Expenses                      12,000       10,000
                                           ─────────    ─────────
  Total Current Liabilities                2,081,294    2,266,500
  (incl. all HR lifecycle liabilities)
                                           ─────────    ─────────
TOTAL EQUITY AND LIABILITIES               2,696,129    3,195,500 ✓
══════════════════════════════════════════════════════════════════════
```

---

### 36c. Key Financial Ratios — MoR & Management Reference

```
══════════════════════════════════════════════════════════════════
     KEY FINANCIAL RATIOS | 2016 E.C. | ABC Trading PLC
══════════════════════════════════════════════════════════════════
Ratio                    Formula              2016 E.C.   2015 E.C.
────────────────────────────────────────────────────────────────────
Gross Profit Margin      GP ÷ Revenue          60.6%       60.9%
Operating Loss Margin    Oper.Loss ÷ Revenue   (1.4%)      (1.3%)
Net Loss Margin          Net Loss ÷ Revenue    (5.5%)      (5.7%)
Employee Cost Ratio      Emp.Cost ÷ Revenue    50.7%       50.7%
MAT Ratio                MAT ÷ Revenue          2.5%        2.5%
Current Ratio            CA ÷ CL               0.80        0.84
Quick Ratio              (CA−Inventory) ÷ CL   0.55        0.63
Debt-to-Equity           Total Debt ÷ Equity  12.8x        5.6x
Revenue per Employee     Revenue ÷ 15 staff  ETB 349,667  ETB 346,923
Payroll-to-Revenue       Payroll ÷ Revenue     42.8%       43.4%
────────────────────────────────────────────────────────────────────
Note: Current ratio < 1.0 indicates working capital pressure.
Management should review cash flow and consider credit line.
══════════════════════════════════════════════════════════════════
```


---

### 36d. IFRS Profit or Loss to MoR Tax Return Bridge
### ከ IFRS የትርፍ/ኪሳራ መግለጫ ወደ MoR የግብር ሪተርን

This bridge explains how the IFRS profit or loss is converted into the tax filing amount. It should be attached behind the Business Income Tax computation in the MoR package.

```
══════════════════════════════════════════════════════════════════
       IFRS TO MoR TAX COMPUTATION BRIDGE | 2016 E.C.
       ABC TRADING PLC | TIN: 0012345678
══════════════════════════════════════════════════════════════════
Line                                                     ETB
──────────────────────────────────────────────────────────────────
IFRS LOSS BEFORE TAX — per Statement of Profit or Loss       (159,679)

ADD BACK: Non-deductible / tax-adjusted expenses
  Entertainment above allowable limit                           12,000
  Penalties and late fees                                        3,500
  IFRS ECL provision not yet tax-deductible                     26,500
  Severance provision not paid in cash                          91,881
  Leave accrual not paid in cash                                73,404
  IFRS depreciation above tax depreciation                      18,000
  Accounting depreciation on ROU asset (IFRS 16)                42,000
  Interest on lease liability (IFRS 16)                         24,000
                                                              ────────
Subtotal add-backs                                             291,285

DEDUCT: Tax-allowable / timing deductions
  Tax depreciation allowance                                   (58,000)
  Actual severance paid during the year                        (36,000)
  Actual leave paid during the year                            (60,000)
  Lease payments allowed for tax basis                         (66,000)
                                                              ────────
Subtotal deductions                                           (220,000)

TAXABLE INCOME BEFORE LOSS RELIEF                              (88,394)
Loss carried forward / taxable income for BIT                        0

BUSINESS INCOME TAX (BIT): 30% × taxable income                      0
MINIMUM ALTERNATIVE TAX (MAT): 2.5% × 5,245,000                131,125
                                                              ────────
TAX PAYABLE TO MoR: HIGHER OF BIT OR MAT                      131,125

Less: quarterly BIT advance payments                         (120,000)
                                                              ────────
FINAL BALANCE PAYABLE                                          11,125
══════════════════════════════════════════════════════════════════
```

#### Why This Bridge Matters

| Issue | IFRS Treatment | MoR Tax Treatment |
|-------|----------------|-------------------|
| Revenue | Recognised when earned under IFRS 15 | Must reconcile to VAT-declared revenue |
| Depreciation | Economic useful life under IAS 16 | Tax depreciation may follow fixed tax rules |
| ECL / bad debts | Expected loss under IFRS 9 | Tax deduction usually requires evidence and write-off support |
| Leave and severance | Accrued under IAS 19 / IAS 37 | Deductibility may depend on payment and tax rules |
| Lease accounting | ROU asset and lease liability under IFRS 16 | Tax may follow actual lease payments |
| MAT | Not an IFRS expense basis | MoR floor tax based on turnover when applicable |

> **Control point:** The CFO should sign this bridge after confirming that all add-backs, deductions, and timing differences are supported by working papers.

---

### 36e. HR, Payroll, PIT, and Pension Reconciliation to MoR
### የ HR / Payroll / PIT / Pension ማስታረቂያ

This schedule links the HR module, payroll register, financial statements, and MoR liabilities. It should be reviewed before submitting PIT, pension, or annual Business Income Tax support schedules.

```
══════════════════════════════════════════════════════════════════
      PAYROLL TO FINANCIAL STATEMENTS RECONCILIATION | 2016 E.C.
      ABC TRADING PLC | 15 Employees | Currency: ETB
══════════════════════════════════════════════════════════════════
Payroll / HR Source                                      ETB
──────────────────────────────────────────────────────────────────
Gross payroll per annual payroll register              2,274,000
Employer pension contribution (11%)                       157,344
Leave accrual recognised under IAS 19                      73,404
Severance provision recognised under IAS 37 / IAS 19       91,881
Recruitment, onboarding, training, performance,
  and labour compliance costs                              64,100
                                                       ──────────
TOTAL EMPLOYEE BENEFIT EXPENSE — Note 7 / P&L           2,660,729
══════════════════════════════════════════════════════════════════

Payroll deductions and liabilities:
──────────────────────────────────────────────────────────────────
Employee pension deducted from payroll (7%)               100,128
Employer pension contribution (11%)                       157,344
                                                       ──────────
Total pension payable / remitted                          257,472

PIT withheld from employees                               344,762
Less: PIT remitted to MoR during the year                (316,174)
                                                       ──────────
PIT PAYABLE AT YEAR-END                                    28,588

Pension payable for final payroll month                    21,456
Accrued salaries payable                                   48,000
Bonus payable                                             120,000
Accrued leave payable                                      61,404
Provision for severance                                   127,881
══════════════════════════════════════════════════════════════════
```

#### Payroll Control Checks Before Filing

| Check | Required Evidence | Responsible Owner |
|-------|-------------------|-------------------|
| Gross payroll equals payroll register total | Signed monthly payroll sheets | HR / Payroll |
| PIT withheld equals PIT return totals | PIT calculation worksheet and eTax receipts | Payroll / ovds |
| Pension 7% and 11% are calculated on correct base | Employee pension schedule | HR / Payroll |
| Employer pension is included in P&L | Journal entry and Note 7 | ovds |
| Employee pension is not treated as P&L expense | Payroll deduction ledger | ovds |
| Leave, bonus, and severance accruals are posted | IAS 19 working paper | ovds / HR |
| Final month liabilities agree to balance sheet | GL accounts for PIT, pension, salary, leave, bonus | CFO |

#### Payroll Journal Entry Summary

| Entry | Debit | Credit |
|-------|-------|--------|
| Gross payroll expense | Salaries and benefits | Salary payable, PIT payable, pension payable |
| Employer pension | Employer pension expense | Pension payable |
| Net salary payment | Salary payable | Bank |
| PIT remittance | PIT payable | Bank |
| Pension remittance | Pension payable | Bank |
| Leave accrual | Employee benefit expense | Accrued leave payable |
| Bonus accrual | Employee benefit expense | Bonus payable |
| Severance provision | Severance expense | Provision for severance |

> **MoR submission note:** Attach the annual payroll register, PIT schedule, pension schedule, remittance receipts, and year-end employee liability reconciliation behind the financial statements. This protects both the income statement employee cost line and the balance sheet payroll liabilities during audit review.


---

## 37. Ethiopian Audit Rules — Full Application to This Report
### የኢትዮጵያ ኦዲት ሕጎች ሙሉ ተፈጻሚነት

This section documents how every Ethiopian audit requirement has been applied to the financial statements in Section 36.

### 37a. AABE Compliance Confirmation

| AABE Requirement | Applied in This Report | Reference |
|-----------------|----------------------|-----------|
| IFRS for SMEs (Tier 2) — 4 statements + notes | ✅ All 4 prepared with comparatives | §36a, 36b, IAS 1 |
| Accrual basis | ✅ All revenue/expenses on accrual | IAS 1 §27 |
| Accounting policies note | ✅ Note 1 included | IAS 1 §117 |
| Going concern assessed | ✅ Directors confirm 12-month viability | IAS 1 §25 |
| Material items separately presented | ✅ MAT, severance, ECL shown separately | IAS 1 §86 |
| Comparative period | ✅ 2015 E.C. shown throughout | IAS 1 §38 |
| Functional currency stated | ✅ ETB stated in header | IAS 21 §8 |
| External audit (Tier 2 recommended) | ✅ Audit report in §30 | ISA 700 |
| AABE submission within 6 months | ✅ By Tir 7, 2017 E.C. (January 2025) | AABE Directive |

### 37b. ERCA Tax Audit Defence — Evidence Prepared

| ERCA Risk Area | Evidence Prepared | Location |
|---------------|------------------|----------|
| Revenue completeness | All 12 VAT returns reconciled to P&L (§8) | §29b |
| Payroll — PIT withheld | Monthly payroll register + ERCA receipts (§24) | §29c |
| Pension remitted | 12 monthly pension receipts (POESSA certificates) | §29c |
| Depreciation rate difference | Deferred tax working (IAS 12 Note 12) | §36b |
| Cash transactions | Bank payment policy enforced; all >ETB 30k via bank | §15 |
| WHT on services | WHT withheld on all bills ≥ ETB 500 | §6-tax-compliance |
| DRRF paid | 4 quarterly DRRF receipts attached | §29d |
| Related parties | Note (IAS 24) — director salaries disclosed | Note 7H |
| MAT calculation | Documented at 2.5% × ETB 5,245,000 = ETB 131,125 | §29b |
| ECL provision | Aging analysis + default rates applied (IFRS 9) | Note 10 |

### 37c. Labour Compliance Audit — HR Evidence File

The Labour Office and MoR may inspect HR records. Maintain the following:

| Document | Retention Period | Status |
|----------|-----------------|--------|
| Signed employment contracts (all 15 staff) | Life of employment + 10 years | ✅ Filed |
| Payroll registers (monthly, signed) | 10 years | ✅ Archived |
| PIT remittance receipts (12 months) | 10 years | ✅ Attached |
| Pension remittance certificates (12 months) | 10 years | ✅ Attached |
| Disciplinary records (warnings, PIPs) | Life of employment + 5 years | ✅ HR file |
| Leave records (taken, balances) | 5 years | ✅ OVDS HR module |
| Training records (certificates, attendance) | 5 years | ✅ HR file |
| Work permits (expatriates) | Validity + 3 years | ✅ Filed |
| Performance appraisal records | 3 years | ✅ OVDS Performance |
| Termination letters and settlements | Life of case + 10 years | ✅ Legal file |

---

## 38. Complete Integrated MoR Submission Checklist — Part III
### ሙሉ የዝግጅት ማረጋገጫ ዝርዝር | Final Pre-Submission Checklist

```
══════════════════════════════════════════════════════════════════
      FINAL MoR SUBMISSION CHECKLIST — PART III
      ABC TRADING PLC | TIN: 0012345678 | 2016 E.C.
══════════════════════════════════════════════════════════════════

COMPANY REGISTRATION COMPLIANCE
  ☑  Certificate of Registration current and valid
  ☑  Business licence renewed for 2016 E.C.
  ☑  TIN active and linked to eTax portal
  ☑  VAT registration active
  ☑  Pension registration with POESSA active
  ☑  Labour Office registration current

FINANCIAL STATEMENTS (IFRS — AABE Tier 2)
  ☑  Statement of Profit or Loss (with comparatives)
  ☑  Statement of Financial Position (with comparatives)
  ☑  Statement of Cash Flows (indirect method)
  ☑  Statement of Changes in Equity
  ☑  Notes 1–17 (all required IFRS disclosures)
  ☑  IFRS-to-MoR tax bridge (§36d) attached behind BIT computation
  ☑  Signed by CEO and CFO
  ☑  Company seal affixed
  ☑  External audit report attached (if Tier 1/2 audit done)

HR & PAYROLL DOCUMENTATION
  ☑  Annual payroll register (all 15 staff, all 12 months)
  ☑  PIT remittance receipts (Hamle–Sene, 12 months)
  ☑  Pension remittance receipts (12 months)
  ☑  Payroll/PIT/pension reconciliation to MoR (§36e) prepared
  ☑  Bonus payable accrual documented (Note 7G)
  ☑  Leave liability accrual documented (Note 7D)
  ☑  Severance provision documented (Note 7E)
  ☑  IAS 19 Note 7 complete with all sub-sections
  ☑  HR lifecycle costs classified in Note 7F (Type A + Type B split)

HR RECRUITMENT WORKFLOWS
  ☑  Signed agency agreements on file for all placement invoices
  ☑  Agency placement invoices matched to employee start dates
  ☑  WHT applied and remitted for all agency bills ≥ ETB 500
  ☑  Guarantee-period tracking confirmed — no outstanding refund claims
  ☑  Debit notes raised and posted where candidates left within guarantee
  ☑  All agency fee journal entries posted to 6012 (Type A) with WHT to 2210
  ☑  Candidate advance register reconciled — all advances cleared or in payroll deduction
  ☑  No irrecoverable candidate advances outstanding (or write-off approved)
  ☑  Candidate cost recovery agreements (offer letters / cost recovery letters) on file
  ☑  Interview reimbursements to external candidates expensed to 6012 (Type B)
  ☑  Staff Advance account 1030 — Recruitment balance confirmed at zero at year-end

TAX COMPUTATIONS
  ☑  BIT computation: Taxable income = ETB 0 (loss); MAT = ETB 131,125
  ☑  MAT basis confirmed: 2.5% × ETB 5,245,000 = ETB 131,125
  ☑  Add-backs and deductions agreed to IFRS-to-MoR bridge (§36d)
  ☑  VAT/BIT revenue reconciliation (§8): zero variance
  ☑  Deferred tax working paper (IAS 12) attached
  ☑  DRRF: 4 quarterly remittances totalling ETB 52,450 confirmed

TAX FILINGS (all 12 months)
  ☑  VAT returns: 12/12 filed on time
  ☑  WHT returns: filed monthly with VAT
  ☑  PIT: 12/12 remitted on payroll date
  ☑  Pension: 12/12 remitted on payroll date
  ☑  DRRF: 4/4 quarterly payments on time
  ☑  BIT Advance: 4/4 quarterly payments (ETB 120,000 total)
  ☑  BIT Annual Return: filed by Hidar 1 (Nov 7), balance ETB 11,125 paid

SUBMISSION PACKAGE
  ☑  Cover letter (bilingual Amharic–English) — signed and sealed
  ☑  eTax BIT filing reference number obtained
  ☑  Bank payment reference for MAT balance obtained
  ☑  All documents scanned and uploaded to eTax portal
  ☑  Physical copy lodged at nearest MoR tax office
  ☑  Submission receipt from MoR/eTax portal saved
  ☑  OVDS compliance score: 100/100 ✅
══════════════════════════════════════════════════════════════════
  Prepared by:  _____________________ | CFO | Date: ___________
  Reviewed by:  _____________________ | CEO | Date: ___________
  Filed by:     _____________________ | Tax Advisor | Licence: _
══════════════════════════════════════════════════════════════════
```

---

> **Document updated:** July 2026 | Part III added — Company Registration, Full HR Lifecycle, Integrated IFRS Statements  
> **Total sections:** 38 | **Total lines:** ~2,900+  
> **IFRS standards:** IAS 1, 2, 7, 10, 12, 16, 19, 20, 21, 24, 34, 36, 37, 38 + IFRS 9, 15, 16, 17  
> **Ethiopian law:** Commercial Code Proc. 1243/2021 | Labour Proc. 1156/2019 | Income Tax Proc. 979/2016  
>                    VAT Proc. 1341/2024 | Pension Proc. 715/2011 | DRRF Reg. 570/2025 | Work Permit Proc. 923/2016  
> **Audit standards:** ISA 200–720 (full range)  
> **Verify at:** [mor.gov.et](https://mor.gov.et) · [aabe.gov.et](https://aabe.gov.et) · [etax.erca.gov.et](https://etax.erca.gov.et) · [etrade.gov.et](https://etrade.gov.et)

---

---

# PART IV — INTERNAL CONTROLS, CONSOLIDATION, FOREIGN CURRENCY, SECTOR FINANCIALS & OVDS SETUP
## ክፍል አራት — ውስጣዊ ቁጥጥር፣ ማጠናከሪያ፣ ውጭ ምንዛሬ፣ ዘርፍ-ተኮር ፋይናንሻል እና OVDS ቅንብር

> This part adds: internal control framework (COSO applied to Ethiopian IFRS), branch/subsidiary consolidation under IFRS 10, foreign currency accounting (IAS 21 with ETB devaluation scenarios), full financials for a manufacturing company and a service firm, and the complete OVDS system configuration guide for IFRS compliance.

---

## 39. Internal Controls Framework — COSO Applied to Ethiopian IFRS Reporting
### ውስጣዊ ቁጥጥር ማዕቀፍ | COSO + Ethiopian Regulatory Environment

Strong internal controls are a prerequisite for reliable IFRS financial statements and a clean audit opinion. ERCA auditors and AABE inspectors both assess whether adequate controls exist. The COSO framework (Committee of Sponsoring Organizations) is the international standard adopted by Ethiopian auditors under ISA 315.

---

### 39a. COSO Five Components — Ethiopian IFRS Context

```
══════════════════════════════════════════════════════════════════
              COSO INTERNAL CONTROL FRAMEWORK
              የ COSO ውስጣዊ ቁጥጥር ማዕቀፍ — IFRS / Ethiopia
══════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │  1. CONTROL ENVIRONMENT (የቁጥጥር ከባቢ)                    │
  │     Tone at the top; ethics; competence                 │
  ├─────────────────────────────────────────────────────────┤
  │  2. RISK ASSESSMENT (የስጋት ምዘና)                         │
  │     Identify and analyse financial reporting risks      │
  ├─────────────────────────────────────────────────────────┤
  │  3. CONTROL ACTIVITIES (የቁጥጥር እንቅስቃሴዎች)               │
  │     Authorisation, segregation of duties, reconciliation│
  ├─────────────────────────────────────────────────────────┤
  │  4. INFORMATION & COMMUNICATION (መረጃ እና ግንኙነት)        │
  │     Accurate, timely financial information flows        │
  ├─────────────────────────────────────────────────────────┤
  │  5. MONITORING (ክትትል)                                   │
  │     Ongoing assessment; internal audit; compliance score│
  └─────────────────────────────────────────────────────────┘
```

### 39b. Control Activities — Mapped to IFRS Risk Areas

| IFRS Risk Area | Risk | Control Activity | OVDS Control |
|---------------|------|-----------------|-------------|
| Revenue (IFRS 15) | Fictitious or early recognition | Sales order → invoice → delivery 3-way match | Invoices require approval before posting |
| Receivables (IFRS 9) | Unrecorded bad debts | Monthly AR aging review; ECL recalculation | OVDS ECL calculator; auto-aging buckets |
| Inventory (IAS 2) | Overstatement; LIFO use | Monthly stock count; FIFO enforced | OVDS enforces FIFO; inventory reconcile |
| PPE (IAS 16) | Unrecorded additions; wrong useful life | Capital expenditure approval policy; asset tagging | Fixed asset register; depreciation auto-run |
| Payroll (IAS 19) | Ghost employees; PIT underpayment | HR headcount reconciled to payroll each month | OVDS HR module links employees to payroll |
| VAT (Proc. 1341) | Input VAT overclaimed | All input VAT invoices verified with ERCA QR | OVDS verifies vendor TIN on every bill |
| Cash (IAS 7) | Misappropriation | Bank reconciliation; dual signatory | Bank reconciliation module; payment approvals |
| Provisions (IAS 37) | Unrecorded liabilities | Legal register reviewed quarterly | Provisions tracked in journal entries |
| Related parties (IAS 24) | Undisclosed transactions | Board-approved related-party register | Vendor/customer TIN flagged if linked to directors |
| Tax (IAS 12) | Deferred tax errors | Tax computation reviewed by CFO and auditor | BIT computation auto-generated in OVDS |

### 39c. Segregation of Duties Matrix

Minimum segregation of duties for a 15-person company to prevent fraud and error:

```
══════════════════════════════════════════════════════════════════
FUNCTION                 INITIATES    APPROVES    RECORDS    RECONCILES
──────────────────────────────────────────────────────────────────
Sales invoice            Sales rep    Sales Mgr   Accountant  CFO
Purchase order           Ops/Stores   Dept Mgr    Accountant  CFO
Bill payment             Accountant   CFO         Accountant  CEO
Payroll processing       HR Officer   HR Manager  Accountant  CFO
PIT/Pension remittance   Accountant   CFO         Accountant  External
Bank reconciliation      Accountant   CFO         Accountant  CEO
Journal entries (manual) Accountant   CFO         Accountant  Auditor
Fixed asset addition     Dept Mgr     CEO         Accountant  CFO
VAT return               Accountant   CFO         Accountant  Auditor
BIT return               Accountant   CFO/Auditor Filed       MoR
══════════════════════════════════════════════════════════════════
MINIMUM RULE: No single person should initiate, approve,
and record the same transaction. In OVDS, role-based
permissions enforce this automatically.
══════════════════════════════════════════════════════════════════
```

### 39d. Internal Audit Programme — Annual Plan

| Quarter | Audit Area | IFRS Standard | Procedure |
|---------|-----------|--------------|-----------|
| Q1 (Hamle–Tikmt) | Revenue & Receivables | IFRS 15, IFRS 9 | Sample 30 invoices; verify delivery; recalculate ECL |
| Q1 | Cash & Bank | IAS 7 | Confirm all bank accounts; reconcile to GL |
| Q2 (Hidar–Yekatit) | Payroll & HR Compliance | IAS 19, Labour Proc. 1156 | Agree headcount; verify PIT/pension receipts |
| Q2 | VAT Returns | Proc. 1341/2024 | Reconcile 6 months VAT to P&L revenue |
| Q3 (Megabit–Sene) | Fixed Assets | IAS 16 | Physical verification; agree to register |
| Q3 | Provisions & Liabilities | IAS 37 | Review all provisions; test adequacy |
| Q4 (Year-end) | Full Financial Statement | IAS 1 | Review all four statements; tie to GL |
| Q4 | Tax Computation | IAS 12 | Verify BIT, MAT, deferred tax workings |
| Q4 | Related Parties | IAS 24 | Review all director transactions |
| Annual | Labour Compliance | Proc. 1156/2019 | Check contracts, leave records, permits |

> **In OVDS:** Navigate to **Tax → Compliance Auditor** for the automated compliance score. Navigate to **Tax → Audit Outsourcing** to assign internal or external audit tasks, track findings, and issue management responses.


---

## 40. Foreign Currency Accounting — IAS 21 in Ethiopian Context
### የውጭ ምንዛሬ ሒሳብ አያያዝ | IAS 21 + NBE Exchange Rate Policy

Ethiopia's managed exchange rate and periodic Birr devaluations create material foreign currency differences that must be correctly accounted for under IAS 21. This is one of the most common IFRS errors in Ethiopian practice.

---

### 40a. IAS 21 Core Rules

```
══════════════════════════════════════════════════════════════════
IAS 21 — THE EFFECTS OF CHANGES IN FOREIGN EXCHANGE RATES
══════════════════════════════════════════════════════════════════

TRANSACTION DATE RULE:
  → Translate at spot rate on the date of transaction
  → Use NBE official rate (not parallel/black market rate)

PERIOD-END RULE — MONETARY ITEMS:
  → Restate at closing rate at Balance Sheet date
  → Difference goes to P&L as exchange gain or loss

PERIOD-END RULE — NON-MONETARY ITEMS:
  → Do NOT restate (e.g., PPE purchased in USD stays
    at historical rate translated at acquisition date)

FUNCTIONAL CURRENCY:
  → ETB for most Ethiopian businesses
  → If primary business is USD-denominated → USD functional
    (requires IAS 21 §38 disclosure)

PRESENTATION CURRENCY:
  → Can differ from functional currency (IAS 21 §38)
  → Translate using closing rate for assets/liabilities,
    average rate for income/expenses (IAS 21 §39)
══════════════════════════════════════════════════════════════════
```

### 40b. Import Purchase — Full IAS 21 Accounting

```
SCENARIO: ABC Trading PLC imports goods from China
══════════════════════════════════════════════════════════════════
TRANSACTION DATE: Meskerem 15, 2016 E.C. (September 25, 2023)
  Invoice amount:    USD 10,000
  NBE rate on date:  ETB 56.25 per USD
  ETB equivalent:    ETB 562,500

JOURNAL — Goods Received (Meskerem 15):
  Dr  1060  Inventory                   562,500
    Cr  2010  Accounts Payable (USD)    562,500
  (Translated at transaction-date spot rate: 56.25)

PERIOD-END RESTATEMENT: Tikmt 30, 2016 E.C. (October 30, 2023)
  Closing NBE rate:   ETB 57.80 per USD
  Restated AP:        USD 10,000 × 57.80 = ETB 578,000
  Original AP:        ETB 562,500
  FX LOSS:            ETB 578,000 − 562,500 = ETB 15,500

JOURNAL — Period-End Restatement (Tikmt 30):
  Dr  7040  Foreign Exchange Loss        15,500
    Cr  2010  Accounts Payable (USD)     15,500

PAYMENT DATE: Hidar 20, 2016 E.C. (November 30, 2023)
  Payment rate:       ETB 58.40 per USD
  Payment ETB:        USD 10,000 × 58.40 = ETB 584,000
  AP balance (restated):                   ETB 578,000
  Additional FX LOSS on settlement:        ETB   6,000

JOURNAL — Payment (Hidar 20):
  Dr  2010  Accounts Payable (USD)      578,000
  Dr  7040  Foreign Exchange Loss         6,000
    Cr  1010  Bank                       584,000

INVENTORY STAYS at original ETB 562,500 (non-monetary item)
Total FX loss for this transaction: ETB 21,500
══════════════════════════════════════════════════════════════════
```

### 40c. Export Revenue — IAS 21 + IFRS 15 Combined

```
SCENARIO: Export sale to European buyer
══════════════════════════════════════════════════════════════════
SALE DATE: Ginbot 10, 2016 E.C. (May 18, 2024)
  Invoice:           EUR 8,000
  NBE EUR/ETB rate:  ETB 62.40
  ETB revenue:       EUR 8,000 × 62.40 = ETB 499,200

JOURNAL — Revenue Recognised (Ginbot 10 — on shipment):
  Dr  1020  Trade Receivables (EUR)    499,200
    Cr  4011  Export Revenue (0% VAT)  499,200

PERIOD-END (Sene 30 — FY end):
  Closing rate: ETB 63.80
  Restated AR:  EUR 8,000 × 63.80 = ETB 510,400
  FX GAIN:      ETB 510,400 − 499,200 = ETB 11,200

JOURNAL — Period-End Restatement (Sene 30):
  Dr  1020  Trade Receivables (EUR)     11,200
    Cr  4032  Foreign Exchange Gain     11,200

COLLECTION AFTER YEAR-END: Hamle 25, 2017 E.C.
  Collection rate: ETB 64.20
  Cash received: EUR 8,000 × 64.20 = ETB 513,600
  AR restated balance:                ETB 510,400
  FX GAIN on settlement:              ETB   3,200
  → Recognised in 2017 E.C. P&L

DISCLOSURE REQUIRED (IAS 21 §52):
  → Amount of FX gains/losses recognised in P&L: ETB (21,500)
    loss on imports; ETB 11,200 gain on exports
  → Net FX position disclosed in Notes
══════════════════════════════════════════════════════════════════
```

### 40d. Birr Devaluation Impact — Scenario Analysis

Ethiopia devalued the Birr by approximately 30% in July 2024 (Hamle 2016 E.C.). This creates significant IAS 21 impacts for businesses with USD/EUR-denominated liabilities.

```
══════════════════════════════════════════════════════════════════
DEVALUATION IMPACT ANALYSIS | Hamle 2016 E.C.
Pre-devaluation rate:  ETB 57.00 per USD
Post-devaluation rate: ETB 74.10 per USD (30% devaluation)
══════════════════════════════════════════════════════════════════

Company's USD Liabilities at Devaluation Date:
  Accounts Payable (USD):   USD 25,000
  Bank Loan (USD):          USD 50,000
  Total USD Liabilities:    USD 75,000

Pre-devaluation ETB value:  USD 75,000 × 57.00 = ETB 4,275,000
Post-devaluation ETB value: USD 75,000 × 74.10 = ETB 5,557,500
FX LOSS (one-day event):                         ETB 1,282,500

JOURNAL — Devaluation Restatement (Hamle 1, 2016 E.C.):
  Dr  7040  Foreign Exchange Loss     1,282,500
    Cr  2010  Accounts Payable (USD)    427,500
    Cr  2110  Long-term Loan (USD)      855,000

NOTE FOR AUDITORS (IAS 21 §52 + IAS 10 Subsequent Events):
  "On Hamle 1, 2016 E.C. (July 8, 2024), the National Bank
  of Ethiopia adjusted the official exchange rate from
  ETB 57.00 to ETB 74.10 per USD, representing a 30%
  devaluation. This resulted in a foreign exchange loss of
  ETB 1,282,500 on the Company's USD-denominated liabilities,
  which has been recognised in the Statement of Profit or Loss
  for the year ended Sene 30, 2016 E.C."

MANAGEMENT RESPONSE — HEDGING OPTIONS:
  → Natural hedge: match USD receivables with USD payables
  → NBE forward contract (where available)
  → Price contracts in ETB where possible
  → Maintain USD cash buffer for 30–60 days of imports
══════════════════════════════════════════════════════════════════
```


---

## 41. Branch & Subsidiary Consolidation — IFRS 10 in Ethiopia
### ቅርንጫፍ እና ተጀማሪ ኩባንያ ማጠናከሪያ | IFRS 10 Consolidated Financial Statements

When an Ethiopian parent company has branches or subsidiaries, consolidated financial statements are required under IFRS 10. This section covers intra-group elimination, branch accounting, and the OVDS multi-company consolidation workflow.

---

### 41a. When Consolidation Is Required

| Structure | Consolidation Required? | Standard |
|-----------|------------------------|---------|
| Parent with >50% owned subsidiary | **Yes** — control exists | IFRS 10 |
| Parent with subsidiary and special purpose entity | **Yes** — de-facto control | IFRS 10 |
| Joint venture (50/50 ownership) | **Equity method** in parent FS | IAS 28 |
| Associate (20–50% ownership) | **Equity method** | IAS 28 |
| Branch offices (same legal entity) | **Combine** — not consolidate | IAS 21 §8 |
| Minority interest (<20%) | **Cost method** or FVTPL | IFRS 9 |
| One-person company under parent | **Consolidate** if control exists | IFRS 10 |

### 41b. Intra-Group Elimination Entries

When a parent sells goods to a subsidiary, the inter-company transaction must be eliminated on consolidation.

```
══════════════════════════════════════════════════════════════════
CONSOLIDATION ELIMINATIONS — ABC Group
Parent: ABC Trading PLC | Subsidiary: ABC Retail PLC (100%)
══════════════════════════════════════════════════════════════════

STEP 1 — Eliminate investment in subsidiary:
  Dr  3010  Share Capital (Subsidiary)       500,000
    Cr  1180  Investment in Subsidiary        500,000

STEP 2 — Eliminate inter-company sales:
  Parent sold ETB 800,000 of goods to Subsidiary at cost + 25%
  Subsidiary still holds ETB 200,000 of these goods in inventory

  Eliminate inter-company revenue/COGS:
  Dr  4010  Sales Revenue (Parent)           800,000
    Cr  5010  Cost of Goods Sold (Sub)        640,000
    Cr  1060  Inventory (unrealised profit)   160,000

  Unrealised profit in inventory:
  Dr  5010  Cost of Goods Sold               160,000
    Cr  1060  Consolidated Inventory         160,000

STEP 3 — Eliminate inter-company receivables/payables:
  Parent AR from Subsidiary:  ETB 120,000
  Dr  2010  Accounts Payable (Sub)           120,000
    Cr  1020  Accounts Receivable (Parent)   120,000

STEP 4 — Eliminate inter-company loan:
  Parent lent ETB 300,000 to Subsidiary
  Dr  2110  Loan Payable (Sub)               300,000
    Cr  1180  Loan to Subsidiary (Parent)    300,000

STEP 5 — Eliminate inter-company interest:
  Sub paid ETB 18,000 interest to Parent
  Dr  4040  Interest Income (Parent)          18,000
    Cr  7010  Interest Expense (Sub)          18,000

RESULT: Consolidated FS shows only:
  → External revenues, external costs
  → Only external assets, liabilities, equity
  → NCI (non-controlling interest) = 0 (100% owned)
══════════════════════════════════════════════════════════════════
```

### 41c. Branch Office Accounting (Single Legal Entity)

Ethiopian branches of the same legal entity are not consolidated — they are **combined**. All branch transactions are recorded in the same Chart of Accounts using branch cost centres.

```
BRANCH ACCOUNTING STRUCTURE
══════════════════════════════════════════════════════════════════
Head Office (HO) — Addis Ababa
  Cost Centre: CC-001
  All corporate transactions; all taxes filed centrally

Branch 1 — Hawassa
  Cost Centre: CC-002
  Sales, expenses, assets recorded at branch level
  All transactions post to HO General Ledger

Branch 2 — Dire Dawa
  Cost Centre: CC-003
  Same as Branch 1

INTER-BRANCH TRANSFERS (not eliminated — same entity):
  HO transfers inventory to Branch 1:
  Dr  CC-002  Inventory (Branch 1)      50,000
    Cr  CC-001  Inventory (HO)          50,000
  (At cost — no profit on internal transfer)

COMBINED INCOME STATEMENT:
  Total Revenue = HO + Branch1 + Branch2 revenues
  (No elimination needed — same legal entity)

TAX FILING:
  Single TIN; single VAT return; single BIT return
  (All branches included in one annual return)

OVDS NAVIGATION:
  Settings → Branches → Add Branch
  Reports → Financial → By Branch (cost centre filter)
══════════════════════════════════════════════════════════════════
```

---

## 42. Sector-Specific Complete Financials — Manufacturing Company
### የማምረቻ ድርጅት ሙሉ ፋይናንሻል | Manufacturing Sector IFRS

A manufacturing company has unique IFRS requirements: IAS 2 work-in-progress, IAS 16 heavy machinery, IAS 20 government grants, and production overhead allocation.

---

### 42a. Manufacturing Cost Structure

```
══════════════════════════════════════════════════════════════════
MANUFACTURING COST CLASSIFICATION — IAS 2
ETH TEXTILE MANUFACTURING PLC | TIN: 0099887766
For the Year Ended Sene 30, 2016 E.C.
══════════════════════════════════════════════════════════════════

DIRECT COSTS (Variable — per unit)
  Raw Materials Consumed              3,200,000
    Opening RM                          480,000
    + Purchases (cotton, dyes)        3,050,000
    − Closing RM                        (330,000)
  Direct Labour (production workers)  1,800,000
    (45 production staff × avg ETB 3,333/month × 12)
  Direct Power & Fuel                   240,000
  ──────────────────────────────────────────────
  TOTAL DIRECT COSTS                  5,240,000

MANUFACTURING OVERHEADS (Absorbed into inventory)
  Factory Depreciation (IAS 16)         180,000
    (Building ETB 80k + Machinery ETB 100k)
  Factory Manager Salary (IAS 19)        84,000
  Maintenance & Repairs                  60,000
  Factory Utilities                     120,000
  Quality Control (QC staff)             48,000
  Factory Insurance                      24,000
  ──────────────────────────────────────────────
  TOTAL FACTORY OVERHEADS               516,000

TOTAL MANUFACTURING COST              5,756,000

INVENTORY MOVEMENT (IAS 2)
  Opening WIP                           120,000
  Opening Finished Goods                350,000
  + Manufacturing cost                5,756,000
  − Closing WIP                        (145,000)
  − Closing Finished Goods             (420,000)
  ──────────────────────────────────────────────
  COST OF GOODS SOLD                   5,661,000

ABSORPTION RATE:
  Factory overhead rate = ETB 516,000 ÷ 60,000 units
                        = ETB 8.60 per unit produced
══════════════════════════════════════════════════════════════════
```

### 42b. Manufacturing P&L (IFRS Format)

```
══════════════════════════════════════════════════════════════════
ETH TEXTILE MANUFACTURING PLC
STATEMENT OF PROFIT OR LOSS | Sene 30, 2016 E.C.
TIN: 0099887766 | AABE Tier 1 | VAT Registered
══════════════════════════════════════════════════════════════════
                                             ETB
──────────────────────────────────────────────────
REVENUE
  Sales — Domestic (15% VAT)            5,400,000
  Sales — Export (0% VAT)               3,600,000
  Government Grant Income (IAS 20)        180,000
                                         ─────────
  TOTAL REVENUE                          9,180,000

COST OF GOODS SOLD                      (5,661,000)
  (per manufacturing cost schedule above)
                                         ─────────
GROSS PROFIT                             3,519,000
  Gross Margin: 38.3%

OPERATING EXPENSES
  Administration Salaries (IAS 19)        960,000
    (20 admin staff × avg ETB 4,000 × 12)
  Admin Pension Employer 11%              105,600
  Admin Leave Accrual                      46,000
  Admin Severance Provision                55,000
  Sales & Marketing Staff (IAS 19)        480,000
  Marketing & Trade Fair Costs            180,000
  Depreciation — Office (IAS 16)           36,000
  Amortisation — Patent (IAS 38)           24,000
  Professional Fees                        60,000
  DRRF Levy (1% manufacturing)             91,800
  Other Administrative                     72,000
                                         ─────────
  TOTAL OPERATING EXPENSES               2,110,400

OPERATING PROFIT                         1,408,600

ovds COSTS
  Interest — Factory Loan                (240,000)
  Interest — Equipment Lease (IFRS 16)    (60,000)
  FX Loss on USD machinery imports        (45,000)
                                         ─────────
PROFIT BEFORE TAX                        1,063,600

TAXATION (IAS 12)
  BIT: ETB 1,063,600 × 30%              (319,080)
  MAT: 2.5% × ETB 9,180,000 = 229,500
  Tax = MAX(319,080; 229,500)            (319,080)
  Deferred Tax (IAS 12)                   (12,000)
                                         ─────────
NET PROFIT AFTER TAX                       732,520
══════════════════════════════════════════════════════════════════
```

### 42c. IAS 20 — Government Grant Accounting

Ethiopian manufacturers in industrial parks (IPDC) often receive government incentives:

```
IAS 20 — GOVERNMENT GRANTS
══════════════════════════════════════════════════════════════════
TYPE 1 — Capital Grant (free or subsidised land in Bole Lemi IP)
  Land value at market rate:     ETB 2,000,000
  Amount paid by company:        ETB 400,000
  GOVERNMENT GRANT:              ETB 1,600,000

  IFRS Treatment (IAS 20 §24):
  Option A — Deduct from asset cost:
    Dr  Land (IAS 16)             400,000
      Cr  Bank                    400,000
    (Depreciation base = ETB 400,000 only)

  Option B — Deferred Income (more transparent):
    Dr  Land (IAS 16)           2,000,000
      Cr  Bank                    400,000
      Cr  Deferred Grant Income 1,600,000
    Release to P&L over useful life:
    Dr  Deferred Grant Income     40,000/year
      Cr  Other Income (IAS 20)   40,000/year

TYPE 2 — Revenue Grant (tax holiday, reduced tariff on imports)
  5-year tax holiday from ERCA for priority sector:
  → BIT rate reduced to 0% for 5 years
  → Disclose as contingent liability (repay if conditions not met)
  → No accounting entry needed for zero tax (IAS 12 §24)
  → Note disclosure required

TYPE 3 — Training Grant (TVET subsidy)
  Government subsidises 50% of worker training cost (ETB 120,000)
  Dr  Bank / Receivable (Grant)    60,000
    Cr  6012  Training Expense     60,000
  (Reduce training expense by grant received — IAS 20 §29)
══════════════════════════════════════════════════════════════════
```


---

## 43. Sector-Specific Complete Financials — Service Company
### የአገልግሎት ድርጅት ሙሉ ፋይናንሻል | IT / Professional Services IFRS

A service company has no inventory but heavy reliance on human capital (IAS 19), software assets (IAS 38), and IFRS 15 contract revenue recognition.

---

### 43a. Revenue Recognition Schedule — IFRS 15 Service Contracts

```
══════════════════════════════════════════════════════════════════
ADDIS TECH SOLUTIONS PLC — IFRS 15 REVENUE SCHEDULE
TIN: 0055443322 | AABE Tier 2 | Software & IT Services
For the Year Ended Sene 30, 2016 E.C.
══════════════════════════════════════════════════════════════════

CONTRACT 1 — ERP Implementation (Fixed Fee)
  Customer: Hawassa Textile Factory
  Contract value:       ETB 2,400,000
  Duration:             12 months (Hamle 2015 – Sene 2016)
  Progress at Sene 30:  85% complete (input method)
  Revenue recognised:   ETB 2,400,000 × 85% = ETB 2,040,000
  Revenue prior year:   ETB 2,400,000 × 40% =   ETB 960,000
  Revenue this year:                             ETB 1,080,000

  Balance Sheet:
  Contract Asset (unbilled):  ETB 2,040,000 − ETB 1,800,000
                              billed = ETB 240,000
  (Contract asset because revenue > billings)

CONTRACT 2 — Annual Support Retainer
  Customer: CBE Branch (multiple)
  Value:  ETB 60,000/month × 12 = ETB 720,000
  Performance obligation: Monthly support availability
  Revenue recognised: Over time — ETB 60,000/month = ETB 720,000

CONTRACT 3 — Software Licence Sale
  Customer: Addis Chamber of Commerce
  Licence value: ETB 480,000 (one-time)
  Performance obligation: Deliver software + 30-day go-live support
  Revenue at delivery: ETB 440,000 (licence)
  Revenue over 30 days: ETB 40,000 (support)
  Recognised at Sene 30: ETB 480,000 (both obligations satisfied)

CONTRACT 4 — Training Services (Public courses)
  Total attendees × fee: ETB 360,000
  All courses completed by Sene 30
  Revenue recognised: ETB 360,000 (point in time — course end)

──────────────────────────────────────────────────────────────────
TOTAL IFRS 15 REVENUE RECOGNISED THIS YEAR:
  ERP Implementation:          1,080,000
  Support Retainer:              720,000
  Software Licence:              480,000
  Training Services:             360,000
  ──────────────────────────────────────
  TOTAL REVENUE:               2,640,000
══════════════════════════════════════════════════════════════════
```

### 43b. Service Company P&L — Full IFRS Format

```
══════════════════════════════════════════════════════════════════
ADDIS TECH SOLUTIONS PLC
STATEMENT OF PROFIT OR LOSS | Sene 30, 2016 E.C.
══════════════════════════════════════════════════════════════════
                                             ETB
──────────────────────────────────────────────────
REVENUE (IFRS 15)
  ERP Implementation (over time)         1,080,000
  Support Retainer (over time)             720,000
  Software Licence (point in time)         480,000
  Training Services (point in time)        360,000
                                          ─────────
  TOTAL REVENUE                           2,640,000

DIRECT SERVICE COSTS (Cost of Revenue)
  Developer/Engineer Salaries (IAS 19)    960,000
    (12 technical staff × ETB 6,667 avg × 12)
  Employer Pension (11%)                  105,600
  Contract Deliverables & Subcontractors  180,000
  Software Licences for Client Use         96,000
  Travel to Client Sites                   48,000
                                          ─────────
  TOTAL DIRECT COSTS                     1,389,600
                                          ─────────
GROSS PROFIT                             1,250,400
  Gross Margin: 47.4%

OPERATING EXPENSES
  Admin & HR Staff (IAS 19)               480,000
    (8 admin/sales staff × ETB 5,000 × 12)
  Admin Pension Employer (11%)             52,800
  Leave & Severance Accruals (IAS 19)      84,000
  Recruitment & Training (HR Lifecycle)    42,000
  Office Rent (IFRS 16 — ROU dep.)         48,000
  Software & Tools (IAS 38 amortisation)   36,000
  Marketing (digital, events)              60,000
  Professional Fees (audit, legal)         45,000
  Communication & Cloud Services           36,000
  Utilities & Office Supplies              24,000
  DRRF Levy (10% services — rate check)   132,000
    (DRRF 5% if IT classified as tech services)
  Impairment — Contract Asset (IFRS 9)     18,000
                                          ─────────
  TOTAL OPERATING EXPENSES               1,057,800

OPERATING PROFIT                           192,600

ovds COSTS
  Interest — Bank Overdraft               (18,000)
  Interest — Lease Liability (IFRS 16)    (12,000)
                                          ─────────
PROFIT BEFORE TAX                         162,600

TAXATION (IAS 12)
  BIT: ETB 162,600 × 30%                  (48,780)
  MAT: 2.5% × ETB 2,640,000 = 66,000
  Tax = MAX(48,780; 66,000)               (66,000)
  Deferred Tax (IAS 12)                    (3,600)
                                          ─────────
NET PROFIT AFTER TAX                        93,000
══════════════════════════════════════════════════════════════════
KEY NOTE: MAT applies even though BIT < MAT.
Service companies with low margin and high revenue
are particularly exposed to MAT.
DRRF rate for IT services requires verification with
ERCA — classified under "Telecommunications/Technology"
at 3% or general services at varied rates.
══════════════════════════════════════════════════════════════════
```

### 43c. IAS 38 — Internally Developed Software

Service and IT companies often develop software internally. IAS 38 splits the cost into two phases:

```
IAS 38 — INTANGIBLE ASSETS: SOFTWARE DEVELOPMENT
══════════════════════════════════════════════════════════════════
RESEARCH PHASE (Expense immediately):
  → Feasibility studies, market research
  → Cannot demonstrate technical feasibility yet
  → Dr R&D Expense / Cr Bank

DEVELOPMENT PHASE (Capitalise when all 6 criteria met):
  IAS 38 §57 criteria:
  ✓ Technical feasibility of completing
  ✓ Intention to complete and use/sell
  ✓ Ability to use or sell
  ✓ Probable future economic benefits
  ✓ Adequate resources to complete
  ✓ Ability to measure reliably

CAPITALISED DEVELOPMENT COSTS:
  Developer salaries (time on project):  ETB 280,000
  Software tools and licences:            ETB  45,000
  Testing and quality assurance:          ETB  30,000
  ──────────────────────────────────────────────────
  Total Capitalised (IAS 38):            ETB 355,000

  AMORTISATION: Over useful life (3–5 years)
  Dr  1161  Amortisation (P&L)           ETB 71,000/year
    Cr  1160  Intangible Asset — Software ETB 71,000/year
  (ETB 355,000 ÷ 5 years)

  DISCLOSURE (Note 13):
  → Carrying amount, amortisation rate, useful life
  → Whether acquired externally or internally generated
  → No active market → cost model only (no revaluation allowed
    for internally generated intangibles per IAS 38 §75)
══════════════════════════════════════════════════════════════════
```


---

## 44. Year-on-Year Comparative Analysis & Trend Commentary
### ዓመት-ለ-ዓመት ንጽጽር ትንተና | Management Commentary for MoR Submission

Ethiopian companies are expected to include a Directors' Report or Management Commentary alongside the financial statements. This section provides the analytical narrative required.

---

### 44a. Three-Year Financial Trend Summary

```
══════════════════════════════════════════════════════════════════
ABC TRADING PLC — THREE-YEAR FINANCIAL SUMMARY
ሦስት ዓመት የፋይናንሻል ማጠቃለያ
══════════════════════════════════════════════════════════════════
                        2014 E.C.    2015 E.C.    2016 E.C.
                        ETB          ETB          ETB
──────────────────────────────────────────────────────────────────
REVENUE
  Total Revenue         3,850,000    4,510,000    5,245,000
  Growth %                  —          +17.1%       +16.3%

PROFITABILITY
  Gross Profit          2,348,500    2,745,000    3,177,000
  Gross Margin %          61.0%        60.9%        60.6%
  Operating Profit/(Loss) 142,000     (59,717)     (73,679)
  Net Profit/(Loss)        88,000    (257,167)    (289,004)

EMPLOYEE COSTS
  Total IAS 19 Expense  1,980,000    2,287,017    2,660,729
  Headcount                  12           13           15
  Cost per Employee      165,000      175,924      177,382

BALANCE SHEET
  Total Assets          3,450,000    3,195,500    2,696,129
  Total Equity            738,000      481,003      194,854
  Current Ratio               1.1          0.84         0.80
  Debt-to-Equity              3.7x         5.6x        12.8x

TAX PAYMENTS
  Total MoR/NSSA Payments 980,000    1,120,000    1,393,568
  MAT Paid                100,000      112,750      131,125
  PIT Paid (employees)    280,000      315,000      344,762
  Pension Paid (total)    180,000      218,000      258,481
══════════════════════════════════════════════════════════════════
```

### 44b. Management Commentary — Required Disclosures

```
══════════════════════════════════════════════════════════════════
        DIRECTORS' REPORT AND MANAGEMENT COMMENTARY
        የዳይሬክተሮች ሪፖርት እና የአስተዳደር ትንተና
        For the Year Ended Sene 30, 2016 E.C.
        ABC Trading PLC | TIN: 0012345678
══════════════════════════════════════════════════════════════════

1. BUSINESS OVERVIEW (የድርጅቱ አጠቃላይ ሁኔታ)
   ABC Trading PLC is a Category A taxpayer registered under
   the 2021 Commercial Code (Reg. 001/PLC/2010). The Company
   engages in import/export trade and professional services,
   operating from its head office in Bole Sub-city, Addis Ababa.

2. FINANCIAL PERFORMANCE (የፋይናንሻል አፈጻጸም)
   Revenue grew by 16.3% to ETB 5,245,000 (2015: 4,510,000),
   driven by a 15.6% increase in domestic sales and a 20%
   increase in export revenues following new market entries
   in Djibouti and Sudan.

   The Company reported a net loss of ETB 289,004 (2015:
   ETB 257,167 loss). The loss is primarily attributable to:
   a) Full IAS 19 accruals: leave (ETB 73,404), severance
      (ETB 91,881), and performance bonuses (ETB 120,000)
      recognised in accordance with IFRS for SMEs;
   b) Minimum Alternative Tax (MAT) of ETB 131,125 (2.5% of
      turnover), which exceeds the BIT on accounting loss;
   c) Foreign exchange loss of ETB 8,000 from USD-denominated
      import payables following the July 2024 NBE rate adjustment.

3. STAFF AND EMPLOYMENT (የሠራተኞች ሁኔታ)
   Headcount increased from 13 to 15 during the year (two new
   IT specialists recruited in Meskerem and Hidar 2016 E.C.).
   All employment contracts comply with Labour Proclamation
   1156/2019. Total employee benefit expense per IAS 19 was
   ETB 2,660,729 (2015: ETB 2,287,017), representing 50.7%
   of total revenue.

4. CAPITAL INVESTMENT (ካፒታል ኢንቨስትመንት)
   No new fixed asset purchases were made during 2016 E.C.
   (2015: ETB 192,000). The Company's Net PPE declined from
   ETB 960,000 to ETB 776,000 due to annual depreciation.
   Management is evaluating a vehicle replacement programme
   for 2017 E.C.

5. LIQUIDITY AND CASH POSITION (ፈሳሽ ሁኔታ)
   Cash reduced from ETB 654,000 to ETB 385,996. The current
   ratio of 0.80 (below 1.0) indicates short-term working
   capital pressure. Management has secured a 6-month trade
   ovds facility of ETB 200,000 from CBE to bridge
   the seasonal import cycle.

6. TAX COMPLIANCE (የግብር ተፈጻሚነት)
   All 12 monthly VAT returns were filed and paid on time.
   All PIT and pension obligations were remitted monthly.
   DRRF levies for all four quarters were paid on time.
   BIT Advance of ETB 120,000 was paid quarterly.
   BIT Annual Return is filed herewith with balance due of
   ETB 11,125. Total payments to MoR and NSSA for 2016 E.C.
   amounted to ETB 1,393,568.

7. GOING CONCERN (የሥራ ቀጣይነት)
   Despite the reported net loss, the Board is satisfied that
   the Company will continue as a going concern for at least
   12 months from the date of this report. This assessment is
   based on: confirmed revenue pipeline (ETB 2,800,000 in
   purchase orders for Hamle–Tikmt 2017), the CBE credit
   facility, and the Company's established customer base.

8. POST-BALANCE SHEET EVENTS (ከሚዛን ሺት ቀን በኋላ ያሉ ክስተቶች — IAS 10)
   In Hamle 2017 E.C. (July 2024), the Company entered a
   3-year lease for expanded warehouse space at ETB 35,000/month.
   This lease will be recognised under IFRS 16 in the 2017 E.C.
   financial statements.

9. OUTLOOK (ወደፊት ዕቅዶች)
   Management projects 18% revenue growth in 2017 E.C. based
   on new customer contracts and the warehouse expansion. The
   salary increment of ETB 118,692/year (Section 34d) takes
   effect from Hamle 1, 2017 E.C. Management expects to return
   to profitability in 2017 E.C. as revenue growth outpaces
   the MAT floor.

──────────────────────────────────────────────────────────────────
Approved by the Board of Directors:

Name: ____________________  Title: Chairman of the Board
Date: Hidar 1, 2017 E.C.   Signature: ___________________
══════════════════════════════════════════════════════════════════
```


---

## 45. OVDS System Configuration Guide — Complete IFRS Setup
### OVDS ሥርዓት ቅንብር | Full IFRS Configuration Checklist

This section walks through every system setting required in OVDS to produce IFRS-compliant financial statements and MoR-ready reports from day one.

---

### 45a. Company Setup — IFRS Foundation Settings

Navigate to **Settings → Company** to configure:

| Setting | Value | IFRS Impact |
|---------|-------|-------------|
| Company Name (Legal) | As registered (Amharic + Latin) | Appears on all statements |
| TIN | 10-digit MoR TIN | Required on every invoice, return |
| VAT Registration Number | VAT-XXXXXXXX | Required on invoices |
| Business Licence Number | From Trade Register | Audit evidence |
| Fiscal Year Start | Hamle 1 (July 8) | IAS 1 reporting period |
| Fiscal Year End | Sene 30 (July 7) | IAS 1 period boundary |
| Functional Currency | ETB | IAS 21 §8 |
| Accounting Basis | **Accrual** (mandatory for IFRS) | IAS 1 §27 |
| AABE IFRS Tier | Tier 1 or Tier 2 | Determines which standards apply |
| Tax Category | Category A (VAT) or B (TOT) | Drives VAT module |
| DRRF Sector | Select from 17 categories | Auto-calculates DRRF rate |
| Pension Employer Rate | **11%** | IAS 19; POESSA requirement |
| Pension Employee Rate | **7%** | Deducted from gross salary |

### 45b. Chart of Accounts — IFRS Import

```
SETUP STEPS — CHART OF ACCOUNTS
══════════════════════════════════════════════════════════════════
1. Navigate to: Settings → Chart of Accounts
2. Click: Import Template → Download CSV
3. Populate using account structure from Section 17
   (1xxx Assets, 2xxx Liabilities, 3xxx Equity,
    4xxx Revenue, 5xxx COGS, 6xxx Expenses,
    7xxx ovds Costs, 8xxx Tax)
4. Upload CSV → Validate → Confirm Import
5. Map accounts to financial statement categories:
   → Assets → Balance Sheet (Current / Non-current)
   → Liabilities → Balance Sheet (Current / Non-current)
   → Equity → Balance Sheet / Equity Statement
   → Revenue → P&L (Revenue section)
   → Expenses → P&L (Operating / ovds / Tax)

KEY ACCOUNT SETTINGS:
  Account 4010  →  Revenue type: Domestic VAT 15%
  Account 4011  →  Revenue type: Export 0% VAT
  Account 1020  →  Enable ECL (IFRS 9) aging
  Account 1060-62 → Inventory method: FIFO
  Account 1110-51 → Enable depreciation (IAS 16)
  Account 2030  →  Tax type: PIT
  Account 2040  →  Tax type: Pension
══════════════════════════════════════════════════════════════════
```

### 45c. Fixed Assets — IAS 16 Configuration

Navigate to **ovds → Fixed Assets → Settings**:

| Field | Configuration | Standard |
|-------|--------------|---------|
| Depreciation Method | Straight-Line (default) or Declining Balance | IAS 16 §62 |
| Useful Life | Per asset class (buildings: 40yr, vehicles: 5yr, IT: 3yr) | IAS 16 §50 |
| Residual Value | Management estimate (0 for IT; 10% for vehicles) | IAS 16 §53 |
| Depreciation Start | Month of acquisition or following month | IAS 16 §55 |
| Componentisation | Enable for assets with distinct components > 10% of total | IAS 16 §43 |
| Revaluation Model | Off by default (cost model); enable if policy changed | IAS 16 §29 |
| ERCA Rate Override | Enable separate ERCA tax rate field for deferred tax | IAS 12 |
| Auto-Post | Monthly — auto-generates depreciation journal on period close | IAS 16 |

### 45d. Payroll — IAS 19 & Ethiopian Tax Configuration

Navigate to **HR → Payroll → Settings**:

```
PAYROLL CONFIGURATION CHECKLIST
══════════════════════════════════════════════════════════════════
☑  PIT Schedule:          Ethiopian Schedule A (7 brackets)
                          Auto-applied by OVDS

☑  Pension Employee:      7% of basic salary
☑  Pension Employer:      11% of basic salary
☑  Pension Base:          Basic salary only (not allowances)

☑  PIT Base Calculation:  Gross − Employee Pension first,
                          then apply Schedule A

☑  Transport Exempt:      ETB 2,200/month (enter exempt limit)
☑  Housing Exempt:        25% of basic (auto-calculated)

☑  Overtime Rates:
     Normal weekday:      150% of hourly rate
     Rest day:            200% of hourly rate
     Public holiday:      250% of hourly rate

☑  Leave Accrual:
     Annual leave rate:   16 days/year = 1.333 days/month
     Auto-accrue:         Monthly (IAS 19)
     Accrual base:        Basic salary ÷ 26 working days

☑  Severance Provision:
     Auto-calculate:      YES (probability-weighted IAS 37)
     Turnover assumption: 15% (adjust annually from HR data)

☑  Payroll Period:        Monthly (Hamle 1 – Sene 30)
☑  Payment Method:        Bank transfer (required >ETB 30,000)
☑  PIT Remittance:        Auto-generate remittance slip monthly
☑  Pension Remittance:    Auto-generate POESSA schedule monthly
══════════════════════════════════════════════════════════════════
```

### 45e. VAT & Tax Module Configuration

Navigate to **Tax → Settings**:

| Setting | Value | Reference |
|---------|-------|-----------|
| VAT Rate (Standard) | 15% | Proc. 1341/2024 |
| VAT Rate (Export) | 0% | Proc. 1341/2024 |
| VAT Registration Threshold | ETB 2,000,000 | Proc. 1341/2024 |
| WHT Rate (Services ≥ ETB 500) | 2% | Proc. 979/2016 |
| WHT Rate (Goods ≥ ETB 10,000) | 2% | Proc. 979/2016 |
| BIT Rate | 30% | Proc. 979/2016 |
| MAT Rate | 2.5% of annual turnover | Proc. 979/2016 |
| Advance Tax (Quarterly) | 25% of estimated annual BIT | Proc. 979/2016 |
| DRRF Rate (Trade) | 1% | Reg. 570/2025 |
| Cash Transaction Limit | ETB 30,000 (alert above this) | Proc. 979/2016 |
| eTax Portal Integration | Enable → enter TIN credentials | ERCA |

### 45f. IFRS Dashboard — Period-End Automation

Navigate to **ovds → IFRS Dashboard → Automation Settings**:

```
PERIOD-END AUTOMATION SETUP
══════════════════════════════════════════════════════════════════
☑  Auto-run depreciation:   On period close
☑  Auto-run ECL:            Monthly (IFRS 9 simplified approach)
☑  Auto-accrue leave:       Monthly (IAS 19)
☑  Auto-prepayment release: Monthly (based on prepayment schedule)
☑  Bank reconciliation:     Required before period lock
☑  Trial balance check:     Must balance before period lock
☑  VAT computation:         Auto-trigger on 28th of each month
☑  Compliance score:        Refresh on each filing entry

PERIOD LOCK SETTINGS:
  Lock previous period:     After CFO approval
  Lock previous year:       After external audit sign-off
  Allow backdated entries:  No (prevent after lock)
  Audit trail:              Full (all changes logged)

REPORT GENERATION:
  Auto-schedule reports:    On period close
  Formats:                  PDF (financial statements)
                            CSV (tax returns)
                            Excel (payroll)
  Recipients:               CFO, CEO, External Auditor (read-only)
══════════════════════════════════════════════════════════════════
```

### 45g. User Roles & Permissions — Segregation of Duties

Navigate to **Settings → Users & Roles**:

| Role | Key Permissions | Restrictions |
|------|----------------|-------------|
| **CEO** | Approve payments, view all reports | Cannot post journal entries |
| **CFO** | All financial permissions, period close, tax filing | Cannot approve own transactions |
| **Accountant** | Post journals, invoices, bills, payroll | Cannot approve payments >ETB 50,000 |
| **HR Manager** | Manage employees, approve leave, run payroll | Cannot modify salary without CFO approval |
| **Sales Manager** | Create invoices, manage customers | Cannot approve credit notes |
| **Purchase Manager** | Create bills, POs, manage vendors | Cannot approve own purchase orders |
| **Tax Officer** | View/file tax returns, generate reports | Cannot modify financial data |
| **External Auditor** | Read-only all financial data | Cannot modify anything |
| **IFRS Officer** | IFRS dashboard, ECL, provisions | Read/write on adjusting entries only |

> **In OVDS:** Navigate to **Settings → Users** to assign roles. Each role maps to specific OVDS permission keys (e.g., `vat:file`, `bit:read`, `ovds:write`). The segregation enforced by OVDS roles satisfies ISA 315 internal control requirements.


---

## 46. Complete Trial Balance — Pre and Post Adjustments
### ሙሉ ሙከራ ሚዛን | Unadjusted and Adjusted Trial Balance

The trial balance is the working paper that links the ledger to the financial statements. Both versions are required for audit purposes.

```
══════════════════════════════════════════════════════════════════
ABC TRADING PLC | TRIAL BALANCE | Sene 30, 2016 E.C.
TIN: 0012345678
══════════════════════════════════════════════════════════════════
                          UNADJUSTED        ADJUSTMENTS     ADJUSTED
Account                  Dr      Cr       Dr      Cr      Dr      Cr
                         ETB     ETB      ETB     ETB     ETB     ETB
──────────────────────────────────────────────────────────────────────
ASSETS
1010 Cash              385,996              —       —    385,996
1020 Trade Receivables 698,000              —  26,500   671,500
1021 ECL Allowance                26,000   26,500     —           52,500
1030 Other Receivables  12,000              —       —     12,000
1040 Input VAT Recv.    42,000              —       —     42,000
1050 Prepaid Expenses   64,000              — 36,000     28,000
1060 Inventory         528,000              —  8,000    520,000
1110 Buildings — Cost  600,000              —       —    600,000
1111 Bldgs Accum Dep.          138,000       — 12,000              150,000
1120 Equipment — Cost  176,000              —       —    176,000
1121 Equip Accum Dep.          116,000       — 19,000              135,000
1130 Vehicles — Cost   280,000              —       —    280,000
1131 Veh Accum Dep.            228,000       — 65,000              293,000
1150 IT Equipment       96,000              —       —     96,000
1151 IT Accum Dep.              72,000       — 12,000               84,000
1160 Intangibles        60,000              —       —     60,000
1161 Intang Amort.              36,000       — 12,000               48,000
1170 ROU Asset         210,000              —       —    210,000
1171 ROU Accum Dep.            168,000       — 42,000              210,000
1180 Long-term Invest.      0              —       —          0
1190 Deferred Tax Asset     0              3,300   —      3,300
──────────────────────────────────────────────────────────────────────
LIABILITIES
2010 Trade Payables             98,000       —       —               98,000
2020 VAT Payable                52,000       —       —               52,000
2030 PIT Payable                28,588       —       —               28,588
2040 Pension Payable            21,456       —       —               21,456
2050 Accrued Salaries               0   48,000  —                    48,000
2051 Accrued Leave                  0   61,404  —                    61,404
2060 Accrued Expenses           14,200  18,500  —                    32,700
2070 Deferred Revenue           12,000       — 3,000                15,000
2080 Current Loan               63,000       —       —               63,000
2081 Current Lease              20,000       —       —               20,000
2090 DRRF Payable                9,150       —       —                9,150
2095 Tax Provision              36,000       — 196                   36,196
2110 Long-term Loan            137,000       —       —              137,000
2120 Lease Liability           120,000       —       —              120,000
2130 Deferred Tax Liab.         34,904       — 196                   35,100
2150 Severance Provision        72,000  91,881  —                   163,881
  (Note: split 127,881 NC + excess)
──────────────────────────────────────────────────────────────────────
EQUITY
3010 Share Capital             500,000       —       —              500,000
3020 Legal Reserve              12,858       —       —               12,858
3030 Retained Earnings (open)   28,997       —       —               28,997
──────────────────────────────────────────────────────────────────────
REVENUE
4010 Sales Domestic          3,650,000       —       —            3,650,000
4011 Sales Export            1,200,000       —       —            1,200,000
4020 Service Revenue           350,000       —       —              350,000
4030 Other Income               45,000       —       —               45,000
4032 FX Gain                    11,200       —       —               11,200
──────────────────────────────────────────────────────────────────────
EXPENSES
5010 COGS                  2,060,000       8,000   —          2,068,000
6010 Salaries              2,106,000      48,000   —          2,154,000
     (basic+transport+housing+overtime)
6011 Employer Pension        157,344              —       —      157,344
6012 Training & Recruitment   60,500       7,600   —             68,100
6013 Leave & Severance           0       165,285   —            165,285
     (73,404 leave + 91,881 severance)
6020 Depreciation               0       150,000   —            150,000
6030 Rent & Utilities          120,000        —    —            120,000
6040 Marketing                  64,000        —    —             64,000
6050 Professional Fees          54,000        —    —             54,000
6060 Insurance                  18,000        —    —             18,000
6070 Travel                     36,000        —    —             36,000
6080 Office Supplies            12,000        —    —             12,000
6090 Repairs                    24,000        —    —             24,000
6095 ECL / Impairment              0       26,500   —             26,500
6096 Inventory Write-Down          0        8,000   —              8,000
7010 Interest — Loan            48,000        —    —             48,000
7020 Interest — Lease           24,000        —    —             24,000
7030 Bank Charges                6,000        —    —              6,000
7040 FX Loss                    21,500        —    —             21,500
8010 BIT / MAT                     0       131,125  —            131,125
     (MAT applies — 2.5% × 5,245,000)
8020 Deferred Tax Expense          0         1,800  —              1,800
      (net: DTL 196 − DTA 3,300 relief)
──────────────────────────────────────────────────────────────────────
DRRF Expense                    52,450        —    —             52,450
──────────────────────────────────────────────────────────────────────
TOTALS              6,056,990 6,056,990  —    —   BALANCED  ✓
══════════════════════════════════════════════════════════════════════
NOTE: Adjustments column includes:
  (a) ECL provision increase (IFRS 9): ETB 26,500
  (b) Prepayment expiry: ETB 36,000
  (c) Depreciation run (all assets): ETB 150,000
  (d) Leave accrual (IAS 19): ETB 73,404
  (e) Severance provision (IAS 37): ETB 91,881
  (f) Inventory write-down (IAS 2): ETB 8,000
  (g) Bonus accrual (IAS 19): included in 6010
  (h) MAT provision (IAS 12): ETB 131,125
  (i) Deferred tax (IAS 12): ETB 3,300 DTA / ETB 196 DTL
══════════════════════════════════════════════════════════════════════
```

---

## 47. Master Reference — All IFRS Standards Applicable to Ethiopian Business

A single-page lookup of every standard referenced in this document with its Ethiopian application note.

| Standard | Title | Key Ethiopian Application | OVDS Feature |
|----------|-------|--------------------------|-------------|
| **IAS 1** | Presentation of Financial Statements | 4 statements + notes; accrual; going concern; Sene 30 FY | All financial reports |
| **IAS 2** | Inventories | FIFO/WA only; NRV test; LIFO prohibited | Inventory module |
| **IAS 7** | Statement of Cash Flows | Indirect method; 3 activities | Cash Flow report |
| **IAS 10** | Events After Reporting Period | Birr devaluation; lease signed after year-end | Period close |
| **IAS 12** | Income Taxes | BIT 30%; MAT 2.5%; deferred tax on IFRS/ERCA timing diffs | BIT computation |
| **IAS 16** | Property, Plant & Equipment | Economic useful life vs ERCA rates; componentisation | Fixed Assets module |
| **IAS 19** | Employee Benefits | PIT, pension 7%+11%, leave accrual, severance provision | HR + Payroll |
| **IAS 20** | Government Grants | IPDC land grants; TVET subsidies; tax holidays | Journal entries |
| **IAS 21** | Foreign Currency | NBE rate; monetary item restatement; devaluation loss | Multi-currency |
| **IAS 24** | Related Party Disclosures | Director salaries, family company transactions | Notes |
| **IAS 28** | Associates & JVs | Equity method for 20–50% investments | Investments |
| **IAS 34** | Interim Financial Reporting | Quarterly management reports (Tier 1 recommendation) | Period reports |
| **IAS 36** | Impairment of Assets | Test when indicators present (devaluation, market decline) | Fixed Assets |
| **IAS 37** | Provisions | Tax disputes, severance, warranty, legal claims | Provisions |
| **IAS 38** | Intangible Assets | Software: research expense / development capitalise | Fixed Assets |
| **IAS 40** | Investment Property | Rental properties; fair value or cost model | Fixed Assets |
| **IFRS 9** | Financial Instruments | ECL on receivables; simplified approach | IFRS Dashboard |
| **IFRS 10** | Consolidated FS | Parent + subsidiary; branch combination | Multi-company |
| **IFRS 15** | Revenue Recognition | 5-step model; align with VAT reporting | Invoices |
| **IFRS 16** | Leases | ROU asset + lease liability for all leases >12 months | Fixed Assets |
| **IFRS 17** | Insurance Contracts | Banks/insurers; effective Jan 2023 (Tier 1 mandatory) | N/A (sector-specific) |

---

## 48. Quick Reference — Ethiopian Business Key Numbers

All critical rates, thresholds, and deadlines in one place for daily use.

```
══════════════════════════════════════════════════════════════════
ETHIOPIAN BUSINESS KEY NUMBERS | 2016–2017 E.C.
══════════════════════════════════════════════════════════════════

TAX RATES
  VAT Standard Rate:              15%
  VAT Export Rate:                 0%
  VAT Registration Threshold:    ETB 2,000,000/year
  TOT — Goods (Category B):        2%
  TOT — Services (Category B):    10%
  WHT — Services ≥ ETB 500:      2%
  WHT — Goods ≥ ETB 10,000:       2%
  WHT — Dividend:                 10%
  WHT — Rent:                      3%
  BIT Rate:                       30% of net taxable profit
  MAT Rate:                        2.5% of gross turnover
  Capital Gains Tax:              15%
  DRRF — Manufacturing:            1%
  DRRF — Construction:             2%
  DRRF — Financial Services:       3%
  DRRF — Mining:                   5%
  DRRF — Trade & Commerce:         1%

PAYROLL RATES
  PIT Brackets:      0% → 10% → 15% → 20% → 25% → 30% → 35%
  PIT-free threshold: ETB 600/month
  Top PIT rate:       35% on income > ETB 10,900/month
  Employee Pension:   7% of basic salary
  Employer Pension:  11% of basic salary
  Transport Exempt:  ETB 2,200/month
  Housing Exempt:    25% of basic salary

PENALTIES
  Late VAT filing:   ETB 500/day (max ETB 50,000)
  Late BIT filing:   2%/month on outstanding tax
  Late pension:      Legal action by POESSA
  Late PIT:          2%/month interest
  Cash >ETB 30,000:  Non-deductible expense

KEY DEADLINES (Ethiopian Calendar)
  VAT filing:         30th of following month
  PIT/Pension:        Payroll date each month
  DRRF Q1:            Tikmt 15 (October 15)
  DRRF Q2:            Tir 15 (January 15)
  DRRF Q3:            Miazia 15 (April 15)
  DRRF Q4:            Hamle 15 (July 15)
  BIT Advance Q1:     Meskerem 7 (September 7)
  BIT Advance Q2:     Tahsas 7 (December 7)
  BIT Advance Q3:     Megabit 7 (March 7)
  BIT Advance Q4:     Sene 7 (June 7)
  BIT Annual Return:  Hidar 1 (November 7)
  AABE FS Submission: Within 6 months of FY end

COMPANY REGISTRATION (2021 Commercial Code)
  PLC minimum capital:     ETB 15,000
  OPC minimum capital:     ETB 15,000
  S.C. minimum capital:    ETB 50,000
  Legal reserve:           5% of net profit until 20% of capital
  Probation period:        45 working days (max 3 months managers)
  Severance:               1 month × years of service (max 12)
  Annual leave:            16 working days (after 1 year)
  Maternity leave:         90 calendar days (full pay)

AABE IFRS THRESHOLDS (meet 2 of 4)
  Tier 1: Turnover >ETB 300M / Employees >200 /
          Assets >ETB 200M / Liabilities >ETB 200M
  Tier 2: Turnover >ETB 20M / Employees >20 /
          Assets >ETB 20M / Liabilities >ETB 20M
══════════════════════════════════════════════════════════════════
```

---

> **Document finalised:** July 2026 | Parts I–IV complete  
> **Total sections:** 48 | **Total content:** ~4,800+ lines  
> **Coverage:** Full IFRS accounting cycle · Company registration · HR lifecycle (5 pillars) ·  
>               Manufacturing & service sectors · Foreign currency (IAS 21) · Consolidation ·  
>               Internal controls (COSO) · Complete trial balance · Full MoR submission package ·  
>               OVDS system configuration · Ethiopian audit rules · Bilingual Amharic–English  
> **IFRS standards:** IAS 1, 2, 7, 10, 12, 16, 19, 20, 21, 24, 28, 34, 36, 37, 38, 40 +  
>                     IFRS 9, 10, 15, 16, 17  
> **Ethiopian law:** Commercial Code 1243/2021 · Labour 1156/2019 · Income Tax 979/2016 ·  
>                    VAT 1341/2024 · Pension 715/2011 · DRRF 570/2025 · Work Permit 923/2016  
> **Audit standards:** ISA 200, 230, 240, 250, 300, 315, 500, 505, 510, 520, 530, 540, 550,  
>                      560, 570, 700, 705, 720 + COSO Framework  
> **Verify current rates:** [mor.gov.et](https://mor.gov.et) · [aabe.gov.et](https://aabe.gov.et) ·  
>                           [etax.erca.gov.et](https://etax.erca.gov.et) · [etrade.gov.et](https://etrade.gov.et)

---

---

# PART V — WORKING CAPITAL, BUDGET REPORTING, IFRS 1 TRANSITION, FULL NOTES & FINAL BINDING GUIDE
## ክፍል አምስት — የሥራ ካፒታል፣ በጀት ሪፖርት፣ IFRS 1 ሽግግር፣ ሙሉ ማስታወሻዎች እና የሪፖርት ማቀናጃ መመሪያ

> This final part covers: working capital management and cash flow forecasting, budget vs actual variance reporting for MoR context, IFRS 1 first-time adoption for Ethiopian companies transitioning from cash/tax accounting, all 17 Notes written in full production format, pension fund reconciliation to POESSA, the 12-month VAT working file, and the definitive guide to binding and submitting the complete annual report package to MoR.

---

## 49. Working Capital Management & Cash Flow Forecasting
### የሥራ ካፒታል አስተዳደር | IAS 7 Forward-Looking Analysis

Working capital (current assets minus current liabilities) directly affects whether a company can meet its tax obligations, pay staff, and continue as a going concern. With a current ratio of 0.80, ABC Trading PLC requires active cash flow management.

---

### 49a. Working Capital Components — Cycle Analysis

```
══════════════════════════════════════════════════════════════════
WORKING CAPITAL CYCLE — ABC TRADING PLC | 2016 E.C.
══════════════════════════════════════════════════════════════════

  [CASH] ──→ [PURCHASE INVENTORY] ──→ [SELL ON CREDIT]
     ↑                                        │
     └──── [COLLECT RECEIVABLES] ←────────────┘

DAYS METRICS:
  Inventory Days  = Avg Inventory × 365 ÷ COGS
                  = ((480,000 + 520,000) ÷ 2) × 365 ÷ 2,068,000
                  = 500,000 × 365 ÷ 2,068,000
                  = 88 days  (goods sit in warehouse ~3 months)

  Receivable Days = Avg Receivables × 365 ÷ Revenue
                  = ((680,000 + 671,500) ÷ 2) × 365 ÷ 5,245,000
                  = 675,750 × 365 ÷ 5,245,000
                  = 47 days  (customers pay ~7 weeks after invoice)

  Payable Days    = Avg Payables × 365 ÷ Purchases
                  = ((82,000 + 98,000) ÷ 2) × 365 ÷ 2,100,000
                  = 90,000 × 365 ÷ 2,100,000
                  = 16 days  (paying suppliers very quickly)

  CASH CONVERSION CYCLE:
  = Inventory Days + Receivable Days − Payable Days
  = 88 + 47 − 16
  = 119 days  ← company funds 119 days of operations from own cash

  PROBLEM: The company pays suppliers in 16 days but waits
  88 days to sell inventory + 47 days to collect = 135 days.
  This 119-day gap is the working capital funding requirement.

  SOLUTION OPTIONS:
  → Negotiate 45-day credit terms with suppliers (Payable Days ↑)
  → Reduce inventory holding to 60 days (offer discounts for quick sale)
  → Offer early-payment discounts (Receivable Days ↓ to 30 days)
  → Secure trade ovds line (CBE ETB 200,000 already in place)
══════════════════════════════════════════════════════════════════
```

### 49b. 12-Month Cash Flow Forecast — 2017 E.C.

```
══════════════════════════════════════════════════════════════════
ABC TRADING PLC — MONTHLY CASH FLOW FORECAST | 2017 E.C.
Hamle 1, 2017 E.C. to Sene 30, 2017 E.C.
(Based on 18% revenue growth projection)
══════════════════════════════════════════════════════════════════
                   Hamle   Nehase  Meskerem  Tikmt   Hidar
                    Jul     Aug     Sep       Oct     Nov
                    ETB     ETB     ETB       ETB     ETB
──────────────────────────────────────────────────────────────────
RECEIPTS
 Collections (AR)  380,000 410,000  430,000  420,000 450,000
 Export proceeds   120,000 130,000  125,000  130,000 140,000
 Other income        3,500   3,500    3,500    3,500   3,500
                   ─────── ─────── ──────── ──────── ───────
 Total Receipts    503,500 543,500  558,500  553,500 593,500

PAYMENTS
 Supplier payments 185,000 190,000  195,000  188,000 200,000
 Payroll (net pay) 155,000 155,000  156,500  155,000 155,000
 PIT remittance     31,000  31,000   31,500   31,000  31,000
 Pension remittance 23,500  23,500   23,800   23,500  23,500
 VAT net payment    48,000  51,000   52,000   50,000  54,000
 Rent & utilities   10,000  10,000   10,000   10,000  10,000
 Loan repayment      7,000   7,000    7,000    7,000   7,000
 Lease payment       3,500   3,500    3,500    3,500   3,500
 DRRF Q1 (Oct 15)       0       0        0   13,115       0
 BIT Advance (Sep7)     0       0   32,500        0       0
 Other overheads    18,000  18,000   18,000   18,000  18,000
                   ─────── ─────── ──────── ──────── ───────
 Total Payments    481,000 489,000  529,800  499,115 502,000
──────────────────────────────────────────────────────────────────
 NET CASH FLOW      22,500  54,500   28,700   54,385  91,500
 Opening Cash      385,996 408,496  462,996  491,696 546,081
                   ─────── ─────── ──────── ──────── ───────
 CLOSING CASH      408,496 462,996  491,696  546,081 637,581
══════════════════════════════════════════════════════════════════
(Continued for remaining 7 months through Sene 2017 E.C.)
Projected year-end cash: ETB 820,000+ (recovery from 2016 low)
══════════════════════════════════════════════════════════════════
```

### 49c. Working Capital Improvement Plan — Journal Impact

| Action | Financial Impact | Journal Entry | IFRS Effect |
|--------|-----------------|--------------|-------------|
| Negotiate 45-day supplier terms | Payable Days 16→45; ETB 164,000 cash freed | No entry — contractual change | IAS 1 going concern improves |
| Early payment discount to customers (2/10 net 30) | Receivable Days 47→28; ETB 110,000 cash freed | Dr Discount Expense / Cr AR | IFRS 15 — variable consideration |
| Write off long-overdue receivables (>365 days) | ETB 14,000 ECL provision released | Dr ECL Allowance / Cr AR | IFRS 9 §5.4.4 |
| Reduce reorder point (inventory optimisation) | Inventory Days 88→60; ETB 150,000 cash freed | No entry — operational change | IAS 2 — lower holding cost |
| Convert CBE overdraft to term loan | Reclassify current liability to non-current | Dr Bank Overdraft (CL) / Cr Term Loan (NCL) | IAS 1 — current ratio improves |


---

## 50. Budget vs Actual Variance Report — MoR Context
### ዕቅድ እና ትክክለኛ ወጪ ንፅፅር ሪፖርት | Management Reporting

A budget vs actual analysis supports the Directors' Report and demonstrates to MoR auditors that the company has adequate financial controls and planning discipline.

```
══════════════════════════════════════════════════════════════════
ABC TRADING PLC — BUDGET vs ACTUAL | 2016 E.C.
ዕቅድ vs ትክክለኛ ንፅፅር ሪፖርት
For the Year Ended Sene 30, 2016 E.C.
══════════════════════════════════════════════════════════════════
                       Budget      Actual    Variance   Var %
                       ETB         ETB       ETB        %
──────────────────────────────────────────────────────────────────
REVENUE
Sales — Domestic      3,800,000   3,650,000  (150,000)  (3.9%)  ▼
Sales — Export        1,000,000   1,200,000   200,000   +20.0%  ▲
Service Revenue         300,000     350,000    50,000   +16.7%  ▲
Other Income             40,000      45,000     5,000   +12.5%  ▲
                      ─────────   ─────────  ────────
TOTAL REVENUE         5,140,000   5,245,000   105,000   +2.0%   ▲

COST OF GOODS SOLD    2,000,000   2,068,000   (68,000)  (3.4%)  ▼
                      ─────────   ─────────  ────────
GROSS PROFIT          3,140,000   3,177,000    37,000   +1.2%   ▲
Gross Margin             61.1%       60.6%     (0.5%)

EMPLOYEE COSTS        2,450,000   2,660,729  (210,729)  (8.6%)  ▼
  ── Variance analysis:
  Salary increments effective Hidar (ETB 95,000 extra)    ▼
  2 new IT hires from Meskerem (ETB 72,000 partial year)  ▼
  Severance provision exceeded estimate by ETB 43,729     ▼

DEPRECIATION            150,000     150,000         0    0.0%   ✓

OVERHEADS               360,000     387,500   (27,500)  (7.6%)  ▼
  ── Variance analysis:
  Impairment — IFRS 9 ECL higher than forecast (ETB 8,500)▼
  Audit fee increase from new firm (ETB 9,000)             ▼
  Utilities increase due to new IT equipment (ETB 10,000)  ▼

DRRF LEVY                52,000      52,450      (450)  (0.9%)  ✓

ovds COSTS            82,000      86,000    (4,000)  (4.9%)  ▼
  ── FX loss ETB 8,000 not budgeted (NBE rate adjustment)  ▼

TOTAL OPERATING EXP.  3,094,000   3,336,679  (242,679)  (7.8%) ▼

PROFIT/(LOSS) BEFORE TAX  46,000    (91,679)  (137,679) n/m    ▼

TAX (MAT)               128,500     131,125    (2,625)  (2.0%)  ▼

NET PROFIT/(LOSS)        (82,500)   (222,804)  (140,304) n/m    ▼
══════════════════════════════════════════════════════════════════
KEY VARIANCE EXPLANATIONS (for MoR/audit context):
1. Domestic sales ETB 150,000 below budget: Q1 demand
   softer than expected due to import delays at customs.
2. Export sales ETB 200,000 above budget: new Djibouti
   customer contract signed in Tikmt 2016 E.C.
3. Employee costs ETB 210,729 over budget: full IAS 19
   accruals (leave + severance + bonus) were not fully
   budgeted in prior year's planning cycle. Budget
   process updated for 2017 E.C. to include all IAS 19.
4. FX loss ETB 8,000: July 2024 NBE rate adjustment —
   not foreseeable at time of budget preparation.
══════════════════════════════════════════════════════════════════
```

> **In OVDS:** Navigate to **Reports → Comparison → Budget vs Actual** to generate this report for any period. Upload the annual budget via **ovds → Budget → Import**. Variances above 10% trigger an automatic alert to the CFO and appear highlighted in the report.


---

## 51. IFRS 1 — First-Time Adoption for Ethiopian Companies
### IFRS 1 — ለ ኢትዮጵያ ኩባንያዎች ለመጀመሪያ ጊዜ IFRS ላይ መሸጋገሪያ

Many Ethiopian companies are transitioning from cash-basis or tax-basis accounting to IFRS for the first time under AABE's mandatory timetable. IFRS 1 governs this transition.

---

### 51a. Transition Date & Opening Balance Sheet

```
══════════════════════════════════════════════════════════════════
IFRS 1 TRANSITION TIMELINE — Tier 2 Entity Example
══════════════════════════════════════════════════════════════════
  Transition Date:    Hamle 1, 2015 E.C. (July 8, 2022)
                      (First day of comparative period)

  First IFRS Reporting Date:  Sene 30, 2016 E.C. (July 7, 2024)
                               (First annual IFRS financial statements)

  Comparative Period:         2015 E.C. (restated under IFRS)

OPENING IFRS BALANCE SHEET at Hamle 1, 2015 E.C.:
  Must recognise ALL assets and liabilities that IFRS requires
  Must derecognise items IFRS does not permit
  Measure all items using IFRS measurement bases
══════════════════════════════════════════════════════════════════
```

### 51b. Common Transition Adjustments — Ethiopian Companies

```
══════════════════════════════════════════════════════════════════
IFRS 1 OPENING BALANCE SHEET ADJUSTMENTS
Transition Date: Hamle 1, 2015 E.C.
══════════════════════════════════════════════════════════════════

ADJUSTMENT 1 — Recognise operating leases as ROU Assets (IFRS 16)
  Office lease: ETB 35,000/month × 36 remaining months
  PV at 14% incremental borrowing rate = ETB 1,050,000 × PV factor
  ROU Asset recognised:    ETB 840,000
  Lease Liability:         ETB 840,000

  Dr  1170  Right-of-Use Asset        840,000
    Cr  2120  Lease Liability          840,000

ADJUSTMENT 2 — Restate inventory from LIFO to FIFO (IAS 2)
  LIFO closing inventory:  ETB 320,000
  FIFO closing inventory:  ETB 390,000
  Increase in inventory:   ETB  70,000

  Dr  1060  Inventory                  70,000
    Cr  3030  Retained Earnings         70,000
  (Net of deferred tax: 70,000 × 30% = 21,000)
  Dr  3030  Retained Earnings          21,000
    Cr  2130  Deferred Tax Liability    21,000

ADJUSTMENT 3 — Recognise accrued leave liability (IAS 19)
  Previously unrecognised: employees had accumulated leave
  Accrued leave at transition:  ETB 39,500

  Dr  3030  Retained Earnings         39,500
    Cr  2051  Accrued Leave Payable    39,500
  (Net of deferred tax: 39,500 × 30% = 11,850)
  Dr  2190  Deferred Tax Asset         11,850
    Cr  3030  Retained Earnings        11,850

ADJUSTMENT 4 — Recognise severance provision (IAS 37)
  Previously unrecognised: no provision under cash accounting
  Probability-weighted provision at transition: ETB 58,000

  Dr  3030  Retained Earnings         58,000
    Cr  2150  Provision for Severance  58,000
  (Net of deferred tax: 58,000 × 30% = 17,400)
  Dr  2190  Deferred Tax Asset         17,400
    Cr  3030  Retained Earnings        17,400

ADJUSTMENT 5 — Restate PPE to fair value or cost (IAS 16)
  IFRS 1 optional exemption: measure PPE at fair value
  as deemed cost on transition date
  Vehicles previously understated (fully depreciated but still used):
  Fair value uplift: ETB 120,000

  Dr  1130  Vehicles — Cost           120,000
    Cr  3030  Retained Earnings        84,000
    Cr  2130  Deferred Tax Liability   36,000

ADJUSTMENT 6 — Recognise ECL on receivables (IFRS 9)
  Previously: only specific provisions; no ECL model
  ECL at transition (aging-based): ETB 18,000

  Dr  3030  Retained Earnings         18,000
    Cr  1021  ECL Allowance            18,000
  (Net of deferred tax: 18,000 × 30% = 5,400)
  Dr  2190  Deferred Tax Asset          5,400
    Cr  3030  Retained Earnings         5,400

──────────────────────────────────────────────────────────────────
SUMMARY — IMPACT ON OPENING RETAINED EARNINGS:
  LIFO to FIFO uplift (net of tax):            +49,000
  Accrued leave provision (net of tax):        (27,650)
  Severance provision (net of tax):            (40,600)
  PPE fair value uplift (net of tax):          +84,000
  ECL provision (net of tax):                 (12,600)
  ROU Asset/Lease Liability — nil P&L impact:       0
  ──────────────────────────────────────────────────
  NET IFRS 1 ADJUSTMENT TO OPENING RE:        +52,150
══════════════════════════════════════════════════════════════════
```

### 51c. IFRS 1 Mandatory Exceptions & Optional Exemptions

| Item | Mandatory Exception (cannot apply retrospectively) | Optional Exemption (can use practical shortcut) |
|------|---------------------------------------------------|------------------------------------------------|
| Estimates | Do not revise prior estimates; use IFRS to make new ones | — |
| Derecognition of financial assets | Cannot derecognise pre-transition assets/liabilities | — |
| Hedge accounting | Cannot designate retrospective hedges | — |
| PPE / Investment Property | Must use IFRS measurement from transition | **Deemed cost**: use fair value as opening cost |
| Business combinations | Retrospective restatement complex | **Exemption**: do not restate pre-transition acquisitions |
| Leases (IFRS 16) | Must recognise all qualifying leases | **Modified approach**: use remaining lease term only |
| Employee benefits (IAS 19) | Must recognise all | **Corridor elimination**: recognise all actuarial gains/losses at transition |
| FX cumulative differences | Complex | **Deemed zero**: reset cumulative FX differences to zero |

> **Ethiopian practical note:** Most Tier 2 companies use the IFRS 16 modified approach (avoid restating historical lease payments) and the PPE deemed cost exemption (one-time fair value of assets without full IAS 16 retrospective depreciation). Both reduce the complexity of transition significantly.


---

## 52. Complete Notes to Financial Statements — Full Production Text
### ሙሉ ማስታወሻዎች ሙሉ ቅጽ | Notes 1–17 Full Text

These are the production-ready notes as they should appear in the printed financial statements submitted to MoR and AABE.

---

```
══════════════════════════════════════════════════════════════════
NOTES TO THE FINANCIAL STATEMENTS
ለፋይናንሻል ስቴትመንቶች ማስታወሻዎች
For the Year Ended Sene 30, 2016 E.C. (July 7, 2024)
ABC Trading PLC | TIN: 0012345678
Prepared under IFRS for SMEs (AABE Tier 2)
══════════════════════════════════════════════════════════════════

──────────────────────────────────────────────────────────────────
NOTE 1 — GENERAL INFORMATION (ጠቅላላ መረጃ)
──────────────────────────────────────────────────────────────────
ABC Trading PLC ("the Company") is a private limited company
incorporated under the Commercial Code of Ethiopia
(Proclamation No. 1243/2021) on Meskerem 10, 2002 E.C.
(September 20, 2009), registered under No. 001/PLC/2010 with
the Addis Ababa Trade Register. The Company's registered office
is at Bole Sub-city, Woreda 03, Addis Ababa, Ethiopia.

The principal activities of the Company are import and export
trade, and the provision of professional services. The Company
is registered for Value Added Tax (VAT Registration No.
VAT-001-2010) and is a Category A taxpayer under the Ministry
of Revenues (TIN: 0012345678).

These financial statements were approved for issue by the Board
of Directors on Hidar 1, 2017 E.C. (November 7, 2024).

──────────────────────────────────────────────────────────────────
NOTE 2 — BASIS OF PREPARATION (ዝግጅት መሠረት)
──────────────────────────────────────────────────────────────────
2.1 Statement of Compliance
These financial statements have been prepared in accordance with
International Financial Reporting Standards for SMEs ("IFRS for
SMEs") as adopted by the Accounting and Auditing Board of
Ethiopia (AABE) for Tier 2 entities. The Company meets the Tier
2 criteria having annual turnover exceeding ETB 20 million and
more than 20 employees.

2.2 Basis of Measurement
The financial statements have been prepared on the historical
cost basis, except as otherwise indicated in the accounting
policies below.

2.3 Functional and Presentation Currency
These financial statements are presented in Ethiopian Birr (ETB),
which is the Company's functional currency (IAS 21 §8). All
financial information presented in ETB has been rounded to the
nearest Birr.

2.4 Accrual Basis of Accounting
The Company prepares its financial statements using the accrual
basis of accounting, in accordance with IAS 1 §27. Revenue is
recognised when earned and expenses when incurred, regardless
of the timing of cash flows.

2.5 Going Concern
The Directors have assessed the Company's ability to continue as
a going concern for at least 12 months from the date of approval
of these financial statements. Based on the confirmed order
pipeline, the CBE trade ovds facility of ETB 200,000, and
the projected 18% revenue growth, the Directors are satisfied
that the going-concern basis of preparation is appropriate
(IAS 1 §25).

──────────────────────────────────────────────────────────────────
NOTE 3 — SIGNIFICANT ACCOUNTING POLICIES (ዋና የሒሳብ ፖሊሲዎች)
──────────────────────────────────────────────────────────────────
3.1 Revenue Recognition (IFRS 15)
Revenue is recognised when (or as) the Company satisfies a
performance obligation by transferring a promised good or service
to a customer. The Company recognises revenue as follows:
  (a) Sale of goods: at the point in time when control transfers
      to the customer, generally on delivery.
  (b) Export sales: at the point in time when goods are shipped
      (FOB terms), consistent with IFRS 15 §38.
  (c) Service revenue: over time as services are rendered,
      using the output method (milestones achieved).
  (d) Interest income: using the effective interest rate method.

3.2 Inventories (IAS 2)
Inventories are measured at the lower of cost and net realisable
value. Cost is determined using the First-In First-Out (FIFO)
method and includes purchase price, import duties, transport,
and other directly attributable costs. Net realisable value is
the estimated selling price less estimated costs to complete
and sell (IAS 2 §9).

3.3 Property, Plant & Equipment (IAS 16)
PPE is initially recognised at cost (IAS 16 §15) and subsequently
measured using the cost model: cost less accumulated depreciation
and accumulated impairment losses. Depreciation is calculated
on a straight-line basis over the estimated useful lives:
  Buildings:          40 years
  Motor Vehicles:      5 years
  Equipment:          10 years
  IT Equipment:        4 years
  Furniture:          10 years
Residual values and useful lives are reviewed annually. Gains
or losses on disposal are recognised in profit or loss.

3.4 Intangible Assets (IAS 38)
Separately acquired intangibles are recognised at cost.
Internally generated intangibles are recognised only when
capitalisation criteria of IAS 38 §57 are met. Amortisation
is on a straight-line basis over 3 years for software.
Formation and organisation costs are expensed as incurred.

3.5 Leases (IFRS 16)
At inception, the Company assesses whether a contract contains
a lease. For contracts that are, or contain, a lease, the Company
recognises a right-of-use (ROU) asset and a corresponding lease
liability at the commencement date, measured at the present value
of remaining lease payments discounted at the incremental
borrowing rate (14% per annum — current CBE lending rate plus
spread). Short-term leases (≤12 months) and low-value asset
leases are expensed on a straight-line basis.

3.6 Financial Instruments (IFRS 9)
Trade receivables are measured at amortised cost using the
simplified approach for impairment. An Expected Credit Loss
(ECL) allowance is recognised based on lifetime ECL from initial
recognition, using a provision matrix based on historical loss
rates adjusted for forward-looking information (IFRS 9 §5.5.15).

3.7 Employee Benefits (IAS 19)
  (a) Short-term: wages, salaries, and bonuses are accrued in
      the period in which services are rendered.
  (b) Post-employment: The Company operates a defined
      contribution plan (employer pension: 11% of basic salary;
      employee: 7%) administered by POESSA. Obligations are
      limited to monthly contributions.
  (c) Leave accrual: Unused annual leave is accrued at current
      salary rates, measured using the current daily rate.
  (d) Severance: A provision is recognised based on
      probability-weighted expected payouts (IAS 37).

3.8 Provisions (IAS 37)
Provisions are recognised when: (a) the Company has a present
obligation as a result of a past event; (b) it is probable that
an outflow of resources will be required; and (c) a reliable
estimate can be made.

3.9 Income Tax (IAS 12)
Current tax is the expected tax payable on taxable income, using
rates enacted at the reporting date (BIT: 30%; MAT: 2.5% of
gross turnover — the higher of the two applies). Deferred tax
is recognised on temporary differences between the carrying
amounts of assets and liabilities for financial reporting
purposes and the amounts used for taxation purposes.

3.10 Foreign Currency (IAS 21)
Transactions in foreign currencies are translated at the
National Bank of Ethiopia (NBE) official exchange rate on
the transaction date. Monetary items are retranslated at the
closing rate at the reporting date. Exchange differences are
recognised in profit or loss.

3.11 Government Grants (IAS 20)
Government grants related to income are recognised in profit or
loss in the period in which the related expenditure is incurred.
Grants related to assets are either deducted from the cost of
the asset or recognised as deferred income.
```


```
──────────────────────────────────────────────────────────────────
NOTE 4 — REVENUE (ገቢ — IFRS 15)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Sales Revenue — Domestic (15% VAT)   3,650,000    3,200,000
Sales Revenue — Export (0% VAT)      1,200,000    1,000,000
Service Revenue                        350,000      280,000
Other Income                            45,000       30,000
                                     ─────────    ─────────
TOTAL REVENUE                        5,245,000    4,510,000

Revenue is disaggregated as follows:
  Revenue recognised at a point in time: 4,850,000 (92.5%)
  Revenue recognised over time:            395,000  (7.5%)

All revenue is from contracts with customers. There are no
significant variable consideration components, financing
components, or warranty obligations.

Geographic split:
  Ethiopia (domestic)       4,045,000  (77.1%)
  Export (Djibouti, Sudan)  1,200,000  (22.9%)

──────────────────────────────────────────────────────────────────
NOTE 5 — COST OF GOODS SOLD (የሸቀጣሸቀጥ ዋጋ — IAS 2)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Opening Inventory                      480,000      390,000
Add: Purchases during the year       2,100,000    1,850,000
Less: Closing Inventory               (520,000)    (480,000)
Add: Inventory Write-Down (to NRV)       8,000        5,000
                                     ─────────    ─────────
TOTAL COST OF GOODS SOLD             2,068,000    1,765,000

The write-down of ETB 8,000 (2015: ETB 5,000) relates to slow-
moving electrical goods where net realisable value fell below
cost. The write-down has been recognised in profit or loss.

──────────────────────────────────────────────────────────────────
NOTE 6 — INVENTORIES (ዕቃዎች — IAS 2)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Raw Materials / Stock-in-Trade         520,000      480,000
Less: Write-Down to NRV                (8,000)      (5,000)
                                     ─────────    ─────────
NET INVENTORIES                        512,000      475,000

Inventories are valued on the FIFO basis. No inventories are
pledged as security for liabilities. Management assessed NRV at
Sene 30, 2016 E.C. and wrote down ETB 8,000 of obsolete items.

──────────────────────────────────────────────────────────────────
NOTE 8 — RENT & UTILITIES (ኪራይ እና አገልግሎቶች)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Short-term lease — Office rent          24,000       21,600
Electricity                             48,000       42,000
Water                                    6,000        5,400
Internet & IT infrastructure            42,000       36,600
                                     ─────────    ─────────
TOTAL                                  120,000      105,600

The Company's main office lease expires Tahsas 30, 2017 E.C.
A new 3-year lease for expanded warehouse space was signed in
Hamle 2017 E.C. at ETB 35,000/month; this will be recognised
as an IFRS 16 ROU Asset in the 2017 E.C. financial statements
(IAS 10 — subsequent event).

──────────────────────────────────────────────────────────────────
NOTE 9 — PROPERTY, PLANT & EQUIPMENT (ቋሚ ሀብቶች — IAS 16)
──────────────────────────────────────────────────────────────────
                Buildings  Vehicles  Equipment   IT Eq.   Total
                ETB        ETB       ETB         ETB      ETB
Cost:
  Opening       600,000    280,000   176,000     96,000  1,152,000
  Additions           0          0         0          0          0
  Disposals           0          0   (96,000)         0    (96,000)
                ───────    ───────   ───────     ──────  ─────────
  Closing       600,000    280,000    80,000     96,000  1,056,000

Accum. Dep.:
  Opening       126,000    163,000    97,000     60,000    446,000
  Charge         12,000     65,000    19,000     12,000    108,000
  Disposals           0          0   (96,000)         0    (96,000)
                ───────    ───────   ───────     ──────  ─────────
  Closing       138,000    228,000    20,000     72,000    458,000

Net Book Value:
  2016 E.C.     462,000     52,000    60,000     24,000    598,000
  2015 E.C.     474,000    117,000    79,000     36,000    706,000

One piece of old processing equipment (cost ETB 96,000, fully
depreciated) was disposed of during the year. Proceeds of
ETB 8,000 were received (gain recognised in Other Income).
No PPE is pledged as security. There were no capital commitments
at the reporting date.

──────────────────────────────────────────────────────────────────
NOTE 10 — TRADE RECEIVABLES & ECL (ዕዳ ሰብሳቢ — IFRS 9)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Trade Receivables (gross)              698,000      706,000
Less: ECL Allowance                    (26,500)     (26,000)
                                     ─────────    ─────────
Trade Receivables (net)                671,500      680,000

ECL Provision Matrix:
  Aging Bucket    Gross     ECL Rate   ECL
  Current         420,000    0.5%       2,100
  1–30 days       160,000    2%         3,200
  31–60 days       72,000    5%         3,600
  61–90 days       32,000   20%         6,400
  >90 days         14,000   80%        11,200
                  ───────             ──────
  TOTAL           698,000             26,500

No individual receivable exceeds 15% of the total gross balance.
The Company has no significant concentration of credit risk.

──────────────────────────────────────────────────────────────────
NOTE 11 — ovds COSTS (የፋይናንስ ወጪዎች)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Interest on bank loan                   48,000       48,000
Interest on lease liabilities           24,000       28,800
Bank charges                             6,000        5,400
Foreign exchange loss (IAS 21)           8,000        4,000
                                     ─────────    ─────────
TOTAL ovds COSTS                     86,000       86,200

The FX loss of ETB 8,000 arose from the restatement of USD-
denominated accounts payable at the closing NBE rate of
ETB 74.10/USD (opening: ETB 57.00/USD following the National
Bank of Ethiopia rate adjustment in Hamle 2016 E.C.).

──────────────────────────────────────────────────────────────────
NOTE 12 — TAXATION (ግብር — IAS 12)
──────────────────────────────────────────────────────────────────
12a. Tax Expense Recognised in P&L:
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Current tax — BIT (30% × taxable income)   0            0
Minimum Alternative Tax (MAT 2.5%)    131,125      112,750
Deferred tax expense                     1,800        1,200
                                     ─────────    ─────────
TOTAL TAX EXPENSE                      129,325      111,950

MAT applies because BIT on accounting loss = nil, but
MAT = 2.5% × ETB 5,245,000 = ETB 131,125 > BIT of nil.
Advance tax of ETB 120,000 was paid quarterly; balance of
ETB 11,125 is due and payable by Hidar 1, 2017 E.C.

12b. Deferred Tax:
  Deferred Tax Liability:    ETB 35,100  (IAS 16 timing: IFRS
                              depreciation slower than ERCA rates)
  Deferred Tax Asset:        ETB  3,300  (IAS 37 provisions not
                              yet tax-deductible)
  Net Deferred Tax Liability: ETB 31,800

12c. Tax Loss Carry-Forward:
  No tax losses carried forward (MAT applies; cash BIT = nil
  but MAT creates a payable; tax loss unused).

──────────────────────────────────────────────────────────────────
NOTE 13 — INTANGIBLE ASSETS (ማይዳሰሱ ሀብቶች — IAS 38)
──────────────────────────────────────────────────────────────────
                           Software    Other     Total
                           ETB         ETB       ETB
Cost:
  Opening                   60,000       0       60,000
  Additions                      0       0            0
  Closing                   60,000       0       60,000
Accum. Amortisation:
  Opening                   12,000       0       12,000
  Charge (IAS 38)           12,000       0       12,000
  Closing                   24,000       0       24,000
Net Book Value:
  2016 E.C.                 36,000       0       36,000
  2015 E.C.                 48,000       0       48,000

Software (OVDS accounting platform) was acquired in 2014 E.C.
Amortised over 5 years on a straight-line basis.
No internally generated intangibles exist (formation costs
were expensed in 2002 E.C. per IAS 38 §69).

──────────────────────────────────────────────────────────────────
NOTE 14 — LEASES (IFRS 16)
──────────────────────────────────────────────────────────────────
Right-of-Use Assets:
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
  Opening                              210,000      252,000
  Depreciation                         (42,000)     (42,000)
                                     ─────────    ─────────
  Closing                              168,000      210,000

Lease Liabilities:
  Current portion                       20,000       20,000
  Non-current portion                  120,000      140,000
                                     ─────────    ─────────
  Total                                140,000      160,000

Lease relates to the Company's main delivery vehicle (5-year
lease commenced Hamle 2012 E.C., ETB 3,500/month).
Incremental borrowing rate applied: 14% per annum.
Maturity of lease payments:
  Within 1 year:   ETB 42,000
  1–2 years:       ETB 42,000
  2–3 years:       ETB 42,000
  3–5 years:       ETB 42,000
  Total undiscounted: ETB 168,000

──────────────────────────────────────────────────────────────────
NOTE 15 — CASH AND CASH EQUIVALENTS (ጥሬ ገንዘብ — IAS 7)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
  Cash at bank — CBE current account   342,000      590,000
  Cash at bank — Awash Bank              38,000       58,000
  Petty cash                              5,996        6,000
                                     ─────────    ─────────
  TOTAL                                385,996      654,000

Bank balances are confirmed by bank confirmation letters as
at Sene 30, 2016 E.C. There are no restrictions on cash use.
The CBE account is denominated in ETB. No USD cash held.

──────────────────────────────────────────────────────────────────
NOTE 16 — SHARE CAPITAL & EQUITY (ድርሻ ካፒታል — IAS 1)
──────────────────────────────────────────────────────────────────
Authorised and Issued:
  100,000 ordinary shares of ETB 5 each    ETB 500,000
  All shares fully paid; no unpaid capital
  All shares carry equal voting rights and dividend rights

Legal Reserve:
  Per Commercial Code 1243/2021 Art. 523:
  5% of annual net profit to be retained as legal reserve
  until the reserve equals 20% of paid-up capital.
  Target legal reserve: ETB 500,000 × 20% = ETB 100,000
  Current legal reserve: ETB 12,858 (2.6% of capital)
  Annual appropriation will continue until target is reached.
  Note: Legal reserve is not distributable as dividends.

No dividends were declared or paid during 2016 E.C.
(2015: nil). Given the net loss position, no dividend
distribution is proposed.

──────────────────────────────────────────────────────────────────
NOTE 17 — BANK LOAN & COMMITMENTS (ብድር — IFRS 9)
──────────────────────────────────────────────────────────────────
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
Commercial Bank of Ethiopia (CBE):
  Term loan (5-year, 14% p.a.):
  Current portion                       63,000       72,000
  Non-current portion                  137,000      200,000
                                     ─────────    ─────────
  Total                                200,000      272,000

  Trade ovds facility (6-month):   200,000            0
  (Drawn in Hamle 2017 E.C. for seasonal imports)

Loan maturity:
  Within 1 year:   ETB  63,000
  1–2 years:       ETB  63,000
  2–3 years:       ETB  63,000
  3–5 years:       ETB  11,000
  Total remaining: ETB 200,000

The loan is secured by a charge over the Company's vehicles
and equipment. Interest is fixed at 14% per annum.
Annual repayment: ETB 63,000/year.
No covenant breaches occurred during the year.

Capital Commitments: None (2015: None).
Contingent Liabilities:
  A minor employment claim of ETB 15,000 was filed by a
  former employee in Ginbot 2016 E.C. Legal counsel advises
  the claim is unlikely to succeed. No provision has been
  recognised (IAS 37 — contingent liability disclosed only).

──────────────────────────────────────────────────────────────────
NOTE 18 — RELATED PARTIES (IAS 24)
──────────────────────────────────────────────────────────────────
Key Management Personnel (KMP) are the CEO and CFO.
Their remuneration during 2016 E.C.:
                                     2016 E.C.    2015 E.C.
                                     ETB          ETB
  CEO Salary (basic + allowances)      240,000      216,000
  CFO Salary (basic + allowances)      192,000      168,000
  Employer Pension (CEO + CFO 11%)      46,200       41,580
  Total KMP remuneration               478,200      425,580

  No loans were made to directors or KMP during the year.
  No transactions occurred with entities controlled by
  directors or their immediate family members.
  All salaries are included in Note 7 employee costs.
══════════════════════════════════════════════════════════════════
```


---

## 53. Pension Fund Reconciliation — POESSA Schedule
### የጡረታ ስሌዳ ማረጋገጫ | POESSA Annual Reconciliation

This schedule reconciles the company's pension payroll deductions to the POESSA certificates received. It is required evidence for both the ERCA tax audit and the external auditor (ISA 500 — evidence procedure).

```
══════════════════════════════════════════════════════════════════
ABC TRADING PLC — ANNUAL PENSION RECONCILIATION | 2016 E.C.
TIN: 0012345678 | POESSA Employer No.: PO-0012345
══════════════════════════════════════════════════════════════════
                  Employee  Employer   Total      POESSA     Variance
Month             Pension   Pension    Due        Receipt    ETB
                  7% ETB    11% ETB    ETB        ETB
──────────────────────────────────────────────────────────────────
Hamle (Jul)        8,344    13,112    21,456     21,456         0
Nehase (Aug)       8,344    13,112    21,456     21,456         0
Meskerem (Sep)     8,390    13,183    21,573     21,573         0
Tikmt (Oct)        8,344    13,112    21,456     21,456         0
Hidar (Nov)        8,344    13,112    21,456     21,456         0
Tahsas (Dec)       8,540    13,420    21,960     21,960         0
Tir (Jan)          8,344    13,112    21,456     21,456         0
Yekatit (Feb)      8,344    13,112    21,456     21,456         0
Megabit (Mar)      8,344    13,112    21,456     21,456         0
Miazia (Apr)       8,344    13,112    21,456     21,456         0
Ginbot (May)       8,470    13,310    21,780     21,780         0
Sene (Jun)         8,344    13,112    21,456     21,456         0
──────────────────────────────────────────────────────────────────
ANNUAL TOTAL      100,356  157,921   258,277    258,277         0 ✓
══════════════════════════════════════════════════════════════════
BALANCE SHEET RECONCILIATION:
  Pension Payable (opening)              18,000
  + Total pension expense (11%)         157,921
  + Employee deductions (7%)            100,356
  − Remitted to POESSA                 (258,277)
  ─────────────────────────────────────────────
  Pension Payable (closing)              17,000
    (Represents December payroll not yet remitted at Sene 30)
  Per Balance Sheet — Pension Payable:  21,456  (Sene payroll)
══════════════════════════════════════════════════════════════════
  Certified by: _________________ | HR Manager | Date: _________
  POESSA certificates attached: Yes ☑ (12 monthly certificates)
══════════════════════════════════════════════════════════════════
```

---

## 54. 12-Month VAT Working File — Complete Monthly Schedule
### 12 ወር ተጨ/እሴት ታክስ የሥራ ፋይል | Monthly VAT Computation

This working file supports the annual BIT return by proving that the sum of 12 monthly VAT returns equals the annual revenue figure in the P&L (the VAT/BIT reconciliation from Section 8).

```
══════════════════════════════════════════════════════════════════
ABC TRADING PLC — MONTHLY VAT WORKING FILE | 2016 E.C.
TIN: 0012345678 | VAT Reg: VAT-001-2010
══════════════════════════════════════════════════════════════════
         Taxable   Output   Input   Net VAT   eTax Ref      Status
Month    Revenue   VAT 15%  VAT     Payable   Number        Filed?
         ETB       ETB      ETB     ETB
──────────────────────────────────────────────────────────────────
Hamle    346,000   51,900  (6,250)  45,650   ETX-VAT-07-01  ✅
Nehase   330,000   49,500  (5,800)  43,700   ETX-VAT-08-01  ✅
Meskerem 341,333   51,200  (6,100)  45,100   ETX-VAT-09-01  ✅
Tikmt    335,200   50,280  (6,200)  44,080   ETX-VAT-10-01  ✅
Hidar    323,600   48,540  (5,900)  42,640   ETX-VAT-11-01  ✅
Tahsas   353,000   52,950  (6,400)  46,550   ETX-VAT-12-01  ✅
Tir      318,533   47,780  (5,500)  42,280   ETX-VAT-01-02  ✅
Yekatit  343,067   51,460  (6,300)  45,160   ETX-VAT-02-02  ✅
Megabit  334,400   50,160  (5,800)  44,360   ETX-VAT-03-02  ✅
Miazia   347,267   52,090  (6,100)  45,990   ETX-VAT-04-02  ✅
Ginbot   331,667   49,750  (6,000)  43,750   ETX-VAT-05-02  ✅
Sene     337,133   50,570  (5,900)  44,670   ETX-VAT-06-02  ✅
──────────────────────────────────────────────────────────────────
TOTAL  4,045,200  606,180 (72,250) 533,930
══════════════════════════════════════════════════════════════════
RECONCILIATION TO P&L REVENUE:
  Total Domestic revenue (P&L):       3,650,000
  Add: Service revenue (VAT-taxable):   395,200
  ─────────────────────────────────────────────
  Total VAT-taxable revenue:          4,045,200  ✓ matches above

  Export revenue (0% VAT):            1,200,000
  Other income (not VAT-taxable):        45,000
  ─────────────────────────────────────────────
  Total P&L Revenue:                  5,290,200
  Less: Export + non-VAT items:      (1,245,000)
  VAT-taxable revenue per VAT returns: 4,045,200 ✓

VARIANCE (P&L vs VAT Returns):        ETB 0 ✓
══════════════════════════════════════════════════════════════════
  Prepared by: _________________ | Accountant | Date: _________
  Reviewed by: _________________ | CFO        | Date: _________
══════════════════════════════════════════════════════════════════
```

> **In OVDS:** This schedule is auto-generated under **Tax → VAT Administration → Annual Summary**. Each month's computation pulls directly from the invoices and bills posted during that period, ensuring the VAT returns and P&L revenue are always synchronised.


---

## 55. Final Annual Report Binding & Submission Guide
### የዓመታዊ ሪፖርት ማቀናጃ እና ማቅረቢያ መመሪያ | Physical & Digital Submission

This section is the definitive guide to assembling, ordering, binding, and submitting the complete annual financial report package to MoR (BIT return), AABE (audited financial statements), and retaining the company copy.

---

### 55a. Document Order — Standard MoR Binding Sequence

```
══════════════════════════════════════════════════════════════════
ANNUAL REPORT PACKAGE — BINDING ORDER
ዓመታዊ ሪፖርት ፓኬጅ — ቅደም ተከተል
══════════════════════════════════════════════════════════════════

COVER PAGE (ሽፋን ገጽ)
  Company name (Amharic + English)
  TIN + VAT Registration Number
  Fiscal Year: Hamle 1 – Sene 30, 2016 E.C.
  Date of issue: Hidar 1, 2017 E.C.
  "CONFIDENTIAL — ANNUAL FINANCIAL REPORT"
  Company seal + CEO + CFO signature
──────────────────────────────────────────────────────────────────
TAB 1 — DIRECTORS' REPORT & MANAGEMENT COMMENTARY (§44b)
  ☑  Business overview
  ☑  Financial performance narrative
  ☑  Employee and HR summary
  ☑  Capital investment
  ☑  Liquidity and cash position
  ☑  Tax compliance confirmation
  ☑  Going concern assessment
  ☑  Post-balance sheet events (IAS 10)
  ☑  Outlook and projections
  ☑  Signed and sealed by Chairman
──────────────────────────────────────────────────────────────────
TAB 2 — INDEPENDENT AUDITOR'S REPORT (§30)
  ☑  Opinion paragraph
  ☑  Basis for opinion
  ☑  Key audit matters (5 items)
  ☑  Responsibilities of management
  ☑  Auditor's responsibilities
  ☑  Signed by licensed AABE auditor + firm seal
──────────────────────────────────────────────────────────────────
TAB 3 — FINANCIAL STATEMENTS (§36)
  ☑  Statement of Profit or Loss (with comparative)
  ☑  Statement of Financial Position (with comparative)
  ☑  Statement of Cash Flows (indirect method)
  ☑  Statement of Changes in Equity
  ☑  All signed by CEO and CFO with company seal
──────────────────────────────────────────────────────────────────
TAB 4 — NOTES TO FINANCIAL STATEMENTS (§52 + this section)
  ☑  Note 1 — General Information
  ☑  Note 2 — Basis of Preparation
  ☑  Note 3 — Significant Accounting Policies
  ☑  Note 4 — Revenue (IFRS 15)
  ☑  Note 5 — Cost of Goods Sold
  ☑  Note 6 — Inventories (IAS 2)
  ☑  Note 7 — Employee Benefits (IAS 19) — full 8 sub-sections
  ☑  Note 8 — Rent & Utilities
  ☑  Note 9 — Property, Plant & Equipment (IAS 16)
  ☑  Note 10 — Trade Receivables & ECL (IFRS 9)
  ☑  Note 11 — ovds Costs
  ☑  Note 12 — Taxation (IAS 12)
  ☑  Note 13 — Intangible Assets (IAS 38)
  ☑  Note 14 — Leases (IFRS 16)
  ☑  Note 15 — Cash & Cash Equivalents
  ☑  Note 16 — Share Capital & Equity
  ☑  Note 17 — Bank Loan & Commitments
  ☑  Note 18 — Related Parties (IAS 24)
──────────────────────────────────────────────────────────────────
TAB 5 — TAX COMPUTATION SCHEDULES
  ☑  BIT Tax Computation (§7 + §29b)
  ☑  IFRS-to-MoR Tax Computation Bridge (§36d)
  ☑  MAT Calculation (2.5% × revenue)
  ☑  VAT/BIT Revenue Reconciliation (§8 + §54)
  ☑  12-Month VAT Working File (§54)
  ☑  DRRF Quarterly Schedule (§29d)
  ☑  Deferred Tax Working Paper (IAS 12)
──────────────────────────────────────────────────────────────────
TAB 6 — PAYROLL & HR SCHEDULES
  ☑  Annual Payroll Register (12 months, all 15 staff)
  ☑  Payroll/PIT/Pension Reconciliation to MoR (§36e)
  ☑  PIT Remittance Summary (12 months)
  ☑  Pension Reconciliation (§53)
  ☑  Leave Liability Schedule (Note 7D)
  ☑  Severance Provision Movement (Note 7E)
  ☑  Bonus Payable Accrual (Note 7B)
──────────────────────────────────────────────────────────────────
TAB 7 — SUPPORTING SCHEDULES
  ☑  Fixed Asset Register — IAS 16 Schedule (Note 9)
  ☑  Trade Receivables Aging — ECL Matrix (Note 10)
  ☑  Trial Balance — Adjusted (§46)
  ☑  Bank Reconciliation (all accounts)
  ☑  Lease Amortisation Schedule (Note 14)
  ☑  Loan Repayment Schedule (Note 17)
──────────────────────────────────────────────────────────────────
TAB 8 — RECEIPTS & FILING EVIDENCE
  ☑  eTax BIT submission receipt (Ref: ETX-BIT-2016-XXXXX)
  ☑  VAT receipts (12 months)
  ☑  BIT Advance receipts (4 quarters)
  ☑  POESSA Pension certificates (12 months)
  ☑  PIT remittance receipts (12 months)
  ☑  DRRF payment receipts (4 quarters)
  ☑  Bank payment references (all MoR payments)
──────────────────────────────────────────────────────────────────
TAB 9 — COMPANY REGISTRATION DOCUMENTS
  ☑  Certificate of Registration (current)
  ☑  Business Licence (current year)
  ☑  TIN Certificate
  ☑  VAT Certificate
  ☑  POESSA Registration Certificate
──────────────────────────────────────────────────────────────────
BACK COVER
  Directors' Responsibility Statement (§32) — signed + sealed
══════════════════════════════════════════════════════════════════
```

### 55b. Physical Submission Requirements

| Requirement | Specification |
|-------------|--------------|
| Paper size | A4 (210mm × 297mm) |
| Font | Times New Roman 12pt or Arial 11pt |
| Binding | Spiral bind or hard-cover bind (for AABE submission) |
| Copies | 3 copies: MoR original, AABE original, company file |
| Language | Amharic or English (bilingual preferred) |
| Signatures | Original wet signatures + company seal on all statements |
| Notarisation | Not required unless MoR specifically requests |
| Page numbering | Sequential from cover page |
| Date on every page | Yes — footer with company name + FY |

### 55c. Digital Submission — eTax Portal Steps

```
ETAX PORTAL DIGITAL SUBMISSION STEPS
etax.erca.gov.et
══════════════════════════════════════════════════════════════════
Step 1:  Log in with TIN (0012345678) and password
Step 2:  Navigate to: Tax Declaration → Business Income Tax
Step 3:  Select Fiscal Year: 2016 E.C.
Step 4:  Complete all sections A–F (per §29b data entry sheet)
Step 5:  Upload documents:
          → Audited Financial Statements (PDF, max 10MB)
          → BIT Tax Computation (PDF)
          → VAT/BIT Reconciliation (PDF)
Step 6:  Review all entries → click Submit
Step 7:  Download Submission Receipt (PDF)
         → Save as: BIT-2016-Receipt-ETX-XXXXX.pdf
Step 8:  Pay balance ETB 11,125:
          → Click Pay Now → select bank or Telebirr
          → Print payment slip
          → Pay at CBE branch or via Telebirr
          → Bank stamps payment slip and provides reference
Step 9:  Return to eTax → Record Payment
          → Enter bank reference number
          → Upload payment receipt scan
Step 10: Confirm status changes to "PAID AND FILED" ✅
══════════════════════════════════════════════════════════════════
```

### 55d. AABE Financial Statement Submission

For Tier 2 entities, AABE requires audited financial statements within **6 months of fiscal year end** (by Tir 7, 2017 E.C. / January 7, 2025):

```
AABE SUBMISSION — ADDIS ABABA OFFICE
══════════════════════════════════════════════════════════════════
Address:  AABE, Meskel Square Area, Addis Ababa
          (or submit via aabe.gov.et online portal)
Documents:
  → 2 hard copies of audited financial statements
    (bound, signed by directors + auditor)
  → Auditor's registration certificate (AABE-licensed firm)
  → Cover letter (on company letterhead, signed by CEO)
  → Copy of TIN certificate
  → Copy of business licence

Submission Deadline: Tir 7, 2017 E.C. (January 7, 2025)
Late submission: AABE may issue a compliance notice and
                 escalate to enforcement
══════════════════════════════════════════════════════════════════
```

### 55e. Record Retention Policy — Ethiopian & IFRS Requirements

| Document Category | Minimum Retention | Requirement |
|------------------|------------------|-------------|
| Financial statements (signed) | 10 years | Commercial Code 1243/2021 |
| Journal entries + GL | 10 years | MoR audit requirement |
| VAT invoices & returns | 10 years | Proc. 1341/2024 |
| BIT returns + tax computations | 10 years | Proc. 979/2016 |
| Payroll registers | 10 years | Labour Proc. 1156/2019 |
| Employment contracts | Life + 10 years | Labour Proc. 1156/2019 |
| Fixed asset register | Life of asset + 10 years | IAS 16 audit evidence |
| Bank statements | 10 years | Anti-money laundering |
| POESSA pension certificates | 10 years | POESSA regulation |
| Lease agreements | Lease term + 10 years | IFRS 16 audit evidence |
| Company registration docs | Life of company | Commercial Code |
| Board minutes | Life of company + 10 years | Commercial Code |

> **In OVDS:** All digital records are stored indefinitely in the system. Navigate to **Settings → Backups** to configure automatic daily backups to cloud storage. Physical documents should be scanned and attached to the relevant transactions in OVDS for instant audit access.


---

## 56. OVDS End-to-End Workflow Summary — From Registration to Filed Report
### OVDS ሙሉ የሥራ ዑደት | Single-Page Master Workflow

```
═══════════════════════════════════════════════════════════════════════
     OVDS COMPLETE ANNUAL WORKFLOW — Ethiopian IFRS + MoR Filing
     ሙሉ ዓመታዊ የ OVDS ሥራ ዑደት | Hamle 2016 – Hidar 2017 E.C.
═══════════════════════════════════════════════════════════════════════

 SETUP (One-time)
 ────────────────
 Settings → Company    TIN, FY, currency, IFRS tier, DRRF sector
 Settings → CoA        Import IFRS-aligned Chart of Accounts (§17)
 Settings → Users      Assign roles (CEO/CFO/Accountant/HR/Auditor)
 HR → Employees        Add all 15 staff with salary and contract type
 ovds → Fixed Assets Register all PPE with cost and useful life
 Tax → Settings        VAT rate, WHT, BIT, MAT, DRRF, pension rates
 ovds → IFRS         Set ECL rates, leave accrual, severance %

 MONTHLY (Hamle through Sene — 12 times)
 ─────────────────────────────────────────
 Sales → Invoices       Issue all customer invoices (ERCA QR auto)
 Purchases → Bills      Record all supplier bills (WHT auto-calc)
 HR → Payroll           Run payroll → post journal → remit PIT+Pension
 Tax → VAT Admin        Compute VAT → generate return → submit eTax
 ovds → Bank         Reconcile all bank accounts
 ovds → Fixed Assets Post monthly depreciation (auto)
 ovds → IFRS         Run ECL → update ECL provision
 Journal Entries        Post accruals, prepayment releases manually
 Period Close           Lock month after CFO approval

 QUARTERLY (Oct, Jan, Apr, Jul)
 ────────────────────────────────
 Tax → Disaster Fund    Compute DRRF → pay → record receipt
 Tax → BIT Advance      Pay quarterly advance → record receipt
 Reports → Comparison   Generate Budget vs Actual quarterly review
 Reports → AR Aging     Review and escalate 90+ day balances

 YEAR-END (Sene 30 — July 7)
 ────────────────────────────
 ovds → Fixed Assets  Final depreciation run (all assets)
 ovds → Inventory     Physical stocktake → reconcile → NRV check
 ovds → IFRS → ECL    Final year-end ECL recalculation
 Journal Entries          Post: leave accrual, severance, bonus, DT
 Reports → Trial Balance  Adjusted TB: confirm Dr = Cr ✓
 Reports → Financial      Generate all 4 statements + Notes PDF
 Tax → BIT → Compute      BIT computation → MAT check → schedule
 Tax → VAT → Reconcile    VAT/BIT revenue reconciliation → zero ✓
 Tax → Audit Outsourcing  External auditor engagement → findings
 ovds → Period Close   Lock year after audit sign-off

 MoR SUBMISSION (by Hidar 1 / November 7)
 ──────────────────────────────────────────
 Tax → Tax Filing → Submit BIT   File on etax.erca.gov.et
 Pay Balance Due                 Bank/Telebirr → attach receipt
 Reports → Export All            Bundle full PDF package (Tabs 1–9)
 Physical Submission             3 copies to MoR tax office
 AABE Submission                 2 copies to AABE (by Tir 7)
 Tax → Compliance Auditor        Refresh → confirm Score: 100/100 ✅
 ovds → Period Close → Lock   Lock fiscal year permanently

 POST-FILING (Hidar – Tahsas)
 ─────────────────────────────
 Settings → Backups              Verify annual backup to cloud
 HR → Performance                Set new KPIs for 2017 E.C.
 ovds → Budget                Upload 2017 E.C. budget
 Tax → BIT                       Set Q1 2017 advance payment reminder
═══════════════════════════════════════════════════════════════════════
```

---

## 57. Troubleshooting — Common Errors in Ethiopian IFRS Reporting
### ተደጋጋሚ ስህተቶች እና መፍትሄዎቻቸው

| # | Error | Cause | Correct Treatment | IFRS Reference |
|---|-------|-------|------------------|---------------|
| 1 | Company formation costs capitalised | Treating registration fees as intangible asset | Expense immediately when incurred | IAS 38 §69 |
| 2 | LIFO used for inventory | Copied from tax practice | Switch to FIFO or Weighted Average | IAS 2 §25 |
| 3 | Depreciation on ERCA rates in FS | Confusion between tax and IFRS rules | Use economic useful life; apply IAS 12 for timing difference | IAS 16 §50, IAS 12 |
| 4 | Leave liability not accrued | Cash-basis habit | Accrue monthly at current salary rate | IAS 19 §11 |
| 5 | Severance not provisioned | "We haven't had any severances" | Provision based on probability — even if no recent terminations | IAS 37 §14 |
| 6 | Only 2 statements prepared | Unaware of IFRS 4-statement requirement | Prepare all 4 + notes for AABE Tier 2 | IAS 1 §10 |
| 7 | Operating lease off balance sheet | Old practice before IFRS 16 | Capitalise all leases >12 months as ROU | IFRS 16 §22 |
| 8 | No deferred tax | "We just pay what ERCA says" | Calculate timing differences; recognise DTL/DTA | IAS 12 §15 |
| 9 | Revenue on cash receipt | Cash accounting | Switch to accrual; recognise on delivery/performance | IFRS 15 §31 |
| 10 | ECL not applied | Provision only when actually bad | Apply ECL from day 1 on all trade receivables | IFRS 9 §5.5 |
| 11 | FX not restated at period-end | Monetary items left at transaction rate | Restate all monetary FX items at closing NBE rate | IAS 21 §23 |
| 12 | Related party transactions not disclosed | Not aware of IAS 24 | Disclose all KMP remuneration and connected-party deals | IAS 24 §17 |
| 13 | No going concern assessment | Not considered | Directors must formally assess 12-month viability each year | IAS 1 §25 |
| 14 | MAT not considered | Only BIT calculated | Always check: Tax = MAX(BIT 30%, MAT 2.5%) | Proc. 979/2016 |
| 15 | Prior year figures not shown | New accountant omitted comparatives | Mandatory — restate prior year in same format | IAS 1 §38 |
| 16 | No IFRS-to-MoR bridge | Financial statements and tax return prepared separately | Attach §36d bridge showing add-backs, deductions, MAT, and advance tax | IAS 12 / Proc. 979 |
| 17 | Payroll liabilities do not agree to MoR receipts | HR, payroll, and GL not reconciled | Attach §36e reconciliation for PIT, pension, salaries, leave, bonus, and severance | IAS 19 |
| 18 | Agency placement fee capitalised as intangible | Treating recruitment fee as an asset (cost of acquiring talent) | Expense immediately when candidate starts — IAS 19 period cost; IAS 38 prohibits capitalising recruited human capital | IAS 38 §69, IAS 19 §11 |
| 19 | WHT not applied to recruitment agency invoice | Agency bill processed without checking vendor TIN and amount threshold | Apply WHT 2% automatically on all agency bills ≥ ETB 500 where the agency has a TIN; deduct from payment and remit to ERCA | Proc. 979/2016 |
| 20 | Candidate advance posted directly to expense | HR paid interview travel or relocation and expensed immediately without considering recovery clause | If a recovery clause exists in the offer letter, record as Staff Advance (1030) first; move to expense only when recovered via payroll or confirmed irrecoverable | IAS 19 §11, IAS 37 |
| 21 | Agency refund (guarantee failure) not posted | Candidate left within guarantee period but no debit note raised; original fee remains in expense | Raise a Debit Note against the agency bill; credit back 6012 Recruitment Expense; reduce net AP; track on AR aging if cash refund is pending | IAS 37 §14 |
| 22 | Candidate advance written off without approval | HR or accountant writes off unrecoverable advance without formal management sign-off or board minute | Always obtain documented write-off approval; the write-off amount must be classified under 6012 and disclosed in Note 7F if material | IAS 37 §14, IAS 19 |

---

## 58. Master Document Index & Cross-Reference Table
### ሙሉ ሰነድ ማውጫ | Every Section with Its Purpose and Cross-Reference

| Section | Title | Key Deliverable | IFRS / Law | MoR Use |
|---------|-------|-----------------|-----------|---------|
| 1 | IFRS Tier Classification | Determine which tier applies | AABE | Registration decision |
| 2 | Step-by-Step Accounting Cycle | Full cycle map | IAS 1 | Foundation |
| 3 | Financial Statements (IFRS) | 4 statements sample | IAS 1, 7 | Core submission |
| 4 | Payroll Schedule (5 employees) | Sample payroll | IAS 19 | PIT/pension evidence |
| 5 | Notes to Accounts | Notes 1–12 overview | IAS 1 §112 | Statutory disclosure |
| 6 | IFRS vs Ethiopian Practice | Comparison table | All | Compliance gap check |
| 7 | BIT Tax Computation | BIT schedule | Proc. 979 | Annual BIT return |
| 8 | VAT/BIT Reconciliation | Zero variance proof | ERCA | Audit defence |
| 9 | Final Review Checklist | 24 checks | All | Pre-submission gate |
| 10 | MoR Submission Workflow | 5-phase process | All | Submission roadmap |
| 11 | Tax Calendar | All deadlines | All | Compliance schedule |
| 12 | OVDS Navigation | Route map | OVDS | System guide |
| 13–16 | IFRS Standards Detail | IAS 1–37, IFRS 9–16 | All IAS/IFRS | Technical reference |
| 17 | Chart of Accounts | 1xxx–8xxx codes | IAS 1 | System setup |
| 18 | Bilingual Glossary | 80+ terms EN/AM | All | Communication |
| 19 | Amharic Statements | Full Amharic format | IAS 1 | MoR submission |
| 20 | Period-Close Checklist | 30-item close | All | Monthly/annual close |
| 21 | FAQ | 10 Q&A | All | Quick answers |
| 22 | Related Documents | File cross-references | — | Navigation |
| 23 | Company Registration | 2021 Code structures | Proc. 1243 | Legal foundation |
| 24 | 15-Employee Payroll | Full payroll register | IAS 19 | PIT/pension support |
| 25 | PIT Calculations | Step-by-step | Proc. 979 | Payroll accuracy |
| 26 | Annual IAS 19 Schedule | 12-month benefits | IAS 19 | Note 7 support |
| 27 | Ethiopian Audit Rules | ISA + ERCA | ISA 200–720 | Audit compliance |
| 28 | Full P&L with IAS 19 | Complete income statement | IAS 1, 19 | Primary statement |
| 29 | MoR Package (cover + forms) | Ready-to-submit | All | Submission |
| 30 | Audit Report Template | ISA 700 format | ISA 700 | External audit |
| 31 | Accounting Cycle Diagram | Visual OVDS flow | All | Training |
| 32 | Management Declaration | Directors' sign-off | IAS 1 | Binding requirement |
| 33 | Company Registration Guide | 12-step process | Proc. 1243 | New companies |
| 34 | HR Lifecycle (5 pillars) | Recruit→Relations | Labour 1156 | HR compliance |
| 34a-A | Agency invoice Workflow | Fee structures, WHT, debit notes, guarantee tracking | IAS 19, Proc. 979 | AP billing + audit evidence |
| 34a-B | Candidate Cost Recovery Workflow | Advances, payroll deductions, write-offs, interview reimbursements | IAS 19, IAS 37 | Balance sheet advances + receivables |
| 35 | IAS 19 Note 7 Full | 8 sub-sections | IAS 19 | Financial statement note |
| 36 | Integrated Statements + MoR Bridges | Full statements, tax bridge, payroll reconciliation | All | Primary statements + filing support |
| 37 | Audit Rules Application | Evidence mapping | ISA 315 | Audit preparation |
| 38 | Part III Checklist | 30-item integrated | All | Final gate |
| 39 | COSO Controls | Internal control matrix | ISA 315 | Governance |
| 40 | IAS 21 Foreign Currency | Import/export FX | IAS 21 | FX businesses |
| 41 | IFRS 10 Consolidation | Elimination entries | IFRS 10 | Groups |
| 42 | Manufacturing Financials | Full P&L + costing | IAS 2, 16, 20 | Sector-specific |
| 43 | Service Company Financials | IFRS 15 contracts | IFRS 15, 38 | Sector-specific |
| 44 | 3-Year Trend + Directors' Report | Narrative + ratios | IAS 1 | Management report |
| 45 | OVDS Configuration | System setup guide | OVDS | Implementation |
| 46 | Complete Trial Balance | Pre/post adjustments | IAS 1 | Working paper |
| 47 | IFRS Standards Master Table | All 21 standards | All IAS/IFRS | Reference |
| 48 | Key Numbers Quick Reference | All rates/deadlines | All | Daily use |
| 49 | Working Capital Management | CCC + forecast | IAS 7 | Cash planning |
| 50 | Budget vs Actual | Variance analysis | IAS 1 | Management reporting |
| 51 | IFRS 1 First-Time Adoption | Transition guide | IFRS 1 | New adopters |
| 52 | Complete Notes 1–18 | Full production notes | IAS 1 §112 | Statutory notes |
| 53 | Pension Reconciliation | POESSA schedule | IAS 19 | Audit evidence |
| 54 | 12-Month VAT Working File | Monthly VAT detail | Proc. 1341 | BIT reconciliation |
| 55 | Binding & Submission Guide | Physical + digital | All | Final submission |
| 56 | OVDS Master Workflow | One-page summary | OVDS | Annual roadmap |
| 57 | Troubleshooting | 17 common errors | All IAS | Error prevention |
| 58 | This index | Full cross-reference | — | Navigation |

---

> **DOCUMENT COMPLETE — July 2026**  
> **Parts I–V | Sections 1–58 | ~6,400+ lines**  
>  
> **What this document covers end-to-end:**  
> ✅ Ethiopian company registration (2021 Commercial Code — all 8 structures)  
> ✅ Full IFRS accounting cycle (data collection → MoR submission)  
> ✅ All 4 IFRS financial statements with bilingual (Amharic + English) format  
> ✅ Complete 15-employee payroll with full PIT, pension, IAS 19 notes  
> ✅ Full HR lifecycle: recruitment, onboarding, training, performance, relations  
> ✅ **HR Recruitment Workflows — Type A (Corporate Agency invoice): fee structures, WHT, guarantee periods, debit notes**  
> ✅ **HR Recruitment Workflows — Type B (Worker/Candidate Cost Recovery): advances, payroll deductions, receivables, write-offs**  
> ✅ Ethiopian Labour Proclamation 1156/2019 compliance at every stage  
> ✅ Manufacturing sector (IAS 2 costing, IAS 20 grants) + Service sector (IFRS 15, IAS 38)  
> ✅ Foreign currency (IAS 21) with Birr devaluation scenario  
> ✅ Branch/subsidiary consolidation (IFRS 10) with elimination entries  
> ✅ Internal controls (COSO) mapped to IFRS risk areas  
> ✅ Ethiopian audit rules (ISA 200–720) mapped to evidence  
> ✅ IFRS 1 first-time adoption guide for transitioning companies  
> ✅ Working capital management and 12-month cash flow forecast  
> ✅ Budget vs actual variance reporting  
> ✅ Complete Notes 1–18 in full production text (Note 7F updated for Type A/B split)  
> ✅ Pension reconciliation to POESSA certificates  
> ✅ 12-month VAT working file with P&L reconciliation  
> ✅ Complete MoR submission package (cover letter, eTax data, tracking log)  
> ✅ Full OVDS system configuration guide (14 modules)  
> ✅ Complete trial balance (unadjusted + adjusted + all 9 adjustments)  
> ✅ 22 common IFRS errors with corrections (incl. 5 recruitment-specific errors)  
> ✅ Ethiopian business key numbers quick reference  
>  
> **Standards:** IAS 1, 2, 7, 10, 12, 16, 19, 20, 21, 24, 28, 34, 36, 37, 38, 40 + IFRS 1, 9, 10, 15, 16, 17  
> **Ethiopian law:** Proc. 1243/2021, 1156/2019, 979/2016, 1341/2024, 715/2011, 570/2025, 923/2016  
> **Audit:** ISA 200–720 + COSO Framework  
>  
> **Verify current rates at:**  
> [mor.gov.et](https://mor.gov.et) · [aabe.gov.et](https://aabe.gov.et) · [etax.erca.gov.et](https://etax.erca.gov.et) · [etrade.gov.et](https://etrade.gov.et)




