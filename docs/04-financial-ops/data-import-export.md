<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Data Import & Export

> **Part of:** [Financial Operations](./README.md) › Data Import / Export
>
> **Requires:** Login · permissions vary by module (see table below)
>
> **Related:** [Getting Started → Install](../01-getting-started/INSTALL.md) · [Reports → Scheduled Exports](../07-reports/README.md)

This section covers how to bring data into OVDS at setup time (opening balances, customer and vendor lists, items) and how to export data for reporting, audits, and external tools.

---

## Recommended Import Order for New Companies

When setting up OVDS for the first time, always import data in this sequence to avoid dependency errors:

```
1. Chart of Accounts
        ↓
2. Customers
        ↓
3. Vendors
        ↓
4. Items / Products
        ↓
5. Employees
        ↓
6. Opening Balances  ← set last, after all entities are created
```

---

## Setting Opening Balances

Navigate to **Accounting → Opening Balances** (`/accounting/opening-balances`) — requires `ovds:write`.

Opening balances set the starting financial position for your business on the date you begin using OVDS. Every balance sheet account needs a value on your cutover date.

### How to Set Opening Balances

1. Go to **Accounting → Opening Balances**.
2. For each GL account, enter the balance as it stood on your **cutover date** (the day before you start using OVDS for live transactions).
3. Common accounts to set:

| Account Type | Examples |
|-------------|---------|
| Cash & Bank | All bank accounts and petty cash balances |
| Accounts Receivable | Per-customer outstanding balances |
| Accounts Payable | Per-vendor outstanding balances |
| Inventory | Closing stock value at cost |
| Fixed Assets | Cost and accumulated depreciation per asset |
| Loans & Liabilities | Outstanding loan balances |
| Equity | Retained earnings and share capital |

4. Click **Confirm Opening Balances** — once confirmed, the balances are locked and cannot be changed without ovds Director approval.
5. The system posts a single opening balance journal entry dated to your cutover date.

### Verify After Confirming

Immediately after confirming, navigate to **Reports → Trial Balance** and check that:
- **Total Debits = Total Credits**

Any imbalance means a missing or incorrect account entry. Contact your accountant to identify and correct the discrepancy before posting any live transactions.

---

## Import Center

Navigate to **Import Center** (`/import-center`) — permission varies by module.

The Import Center provides a unified CSV import tool for all data types. Each module follows the same four-step process:

### Import Process

1. **Download Template** — click the template link for the module you are importing. The template contains correct column headers and sample data rows.
2. **Fill in Your Data** — open the CSV in Excel or Google Sheets and populate your records.
3. **Upload** — drag and drop or browse to upload the completed CSV.
4. **Preview** — review the first 5 rows to confirm the mapping looks correct.
5. **Import** — click **Import**. The system validates every row and reports errors at the field level.
6. **Review Summary** — check the succeeded / failed counts. Fix errors in your CSV and re-import the failed rows.

### Import Modules & Required Fields

**Chart of Accounts**

| Column | Required | Notes |
|--------|----------|-------|
| Account Code | ✅ | Unique numeric or alphanumeric code |
| Account Name | ✅ | Descriptive name |
| Type | ✅ | Asset, Liability, Equity, Revenue, Expense |
| Sub-type | Optional | e.g. Current Asset, Fixed Asset, Operating Expense |
| Opening Balance | Optional | Can be set here or in the Opening Balances screen |

**Customers**

| Column | Required | Notes |
|--------|----------|-------|
| Name | ✅ | Legal business name or individual name |
| Email | Optional | For invoice delivery |
| Phone | Optional | |
| TIN | Optional | Required for B2B VAT invoices |
| Currency | Optional | Defaults to ETB |
| Payment Terms | Optional | e.g. Net 30 |
| Opening Balance | Optional | Outstanding AR as at cutover date |

**Vendors**

| Column | Required | Notes |
|--------|----------|-------|
| Name | ✅ | Legal business name |
| Email | Optional | For PO and bill delivery |
| Phone | Optional | |
| TIN | Optional | Required for WHT auto-calculation |
| Currency | Optional | Defaults to ETB |
| Payment Terms | Optional | |
| Bank Name | Optional | For payment batch export |
| Account Number | Optional | For payment batch export |
| Opening Balance | Optional | Outstanding AP as at cutover date |

**Items / Products**

| Column | Required | Notes |
|--------|----------|-------|
| Name | ✅ | Display name on invoices |
| Type | ✅ | Product, Service, Bundle |
| Unit Price | ✅ | Default selling price |
| Cost Price | Optional | For margin and COGS |
| SKU | Optional | |
| Category | Optional | Must match an existing category name |
| VAT Rate | ✅ | 15, 0, or Exempt |
| Track Inventory | Optional | TRUE / FALSE |
| Reorder Level | Optional | Numeric |

**Employees**

| Column | Required | Notes |
|--------|----------|-------|
| Full Name | ✅ | |
| Employee ID | Optional | Internal reference |
| Job Title | Optional | |
| Department | Optional | Must match an existing department |
| Email | ✅ | Used for payslip delivery and system access |
| Start Date | ✅ | |
| Salary | Optional | Base gross salary in ETB |
| Bank Account | Optional | For payroll direct deposit |

---

## Export Options

OVDS can export data from most list views.

| Report / List | Formats | Location |
|--------------|---------|---------|
| Invoice list | CSV, PDF | Sales → Invoices → Export |
| Bill list | CSV | Purchases → Bills → Export |
| Customer list | CSV | Sales → Customers → Export |
| Vendor list | CSV | Purchases → Vendors → Export |
| Items catalog | CSV | Items → Export |
| General Ledger | CSV, PDF | Reports → Financial → General Ledger |
| Trial Balance | PDF | Reports → Financial → Trial Balance |
| AR Aging | CSV, PDF | Reports → AR Aging |
| AP Aging | CSV, PDF | Reports → AP Aging |
| Tax Summary | PDF | Reports → Tax Summary |
| Fixed Asset Register | PDF | Reports → Fixed Asset Register |
| Payroll Summary | CSV, PDF | HR → Payroll → Export |

### How to Export a List

1. Navigate to the relevant list (e.g. **Sales → Invoices**).
2. Apply any filters — date range, status, customer, etc.
3. Click **Export**.
4. Select the format (CSV or PDF where both are available).
5. The file downloads immediately to your browser.

---

## Scheduled Exports

Automate report delivery on a recurring schedule — useful for management reporting, external accountants, or ERCA filing reminders.

1. Navigate to **Reports → Builder → Scheduled Exports**.
2. Click **New Scheduled Export**.
3. Configure:
   - **Report Type** — e.g. Invoice List, Tax Summary, Payroll Summary
   - **Format** — CSV or PDF
   - **Frequency** — Daily, Weekly, Monthly, Quarterly
   - **Recipients** — enter one or more email addresses
4. Click **Save** — the report is emailed automatically on the schedule.

> To pause a scheduled export, open it and toggle **Active** to off.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Import items in bulk | [Items Catalog → Bulk Import](./items-catalog.md#bulk-import) |
| Set up the Chart of Accounts | [Settings](../03-settings/README.md) |
| Opening balance verification (Trial Balance) | [Reports](../07-reports/README.md) |
| Scheduled reports | [Reports → Navigation Flow](../07-reports/README.md) |
| ERCA filing exports | [Tax & Compliance](../06-tax-compliance/README.md) |




