<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Bank Statement Import & Reconciliation

> **Part of:** [Banking](./README.md)
>
> **Requires:** Login · `bank_reconciliation:read` · `bank_statement_import:write`

Navigate to **Banking → Import Statement** (`/bank-statement-import`) and **Banking → Reconcile**.

Bank reconciliation matches every transaction in OVDS against your official bank statement. It is the core control that keeps your books accurate and your VAT and BIT returns trustworthy. Reconcile monthly — ideally within the first week after month-end.

---

## Step 1 — Download Your Bank Statement

Download your statement from your bank's online portal in one of the supported formats:

| Format | Notes |
|--------|-------|
| **CSV** | Supported by most Ethiopian and international banks — preferred |
| **OFX / QFX** | Open Financial Exchange — some international banks |
| **PDF (OCR)** | For banks that only provide PDF statements — requires AI key setup |

---

## Step 2 — Import the Statement

Navigate to **Banking → Import Statement** (`/bank-statement-import`).

### CSV Import

1. Go to **Import Statement** → select your **Bank Account**.
2. Upload the CSV file.
3. **Map columns** — match your bank's column headers to OVDS fields:
   - Date
   - Description
   - Debit (money out)
   - Credit (money in)
   - Balance (optional)
4. **Preview** the imported transactions — review the first rows for accuracy.
5. Click **Import** — all transactions are created and marked **Unreconciled**.

### PDF Import (OCR)

For banks that only provide PDF statements:

1. Upload the PDF statement.
2. OVDS uses AI (OpenAI GPT-4 or Gemini) to extract transactions automatically.
3. **Review** the extracted data — correct any OCR errors before importing.
4. Click **Confirm** — transactions are imported and marked Unreconciled.

> **Setup required:** Add `OPENAI_API_KEY` or `GEMINI_API_KEY` to your `.env` environment file to enable PDF OCR.

### Duplicate Detection

OVDS automatically flags potential duplicate transactions before import based on:
- Same date + same amount + same description

Flagged duplicates are shown for review — confirm or dismiss each one before completing the import.

---

## Step 3 — Reconcile

Navigate to the bank account detail page → click **Reconcile**.

1. Enter the **Statement Ending Date** and **Ending Balance** from your physical bank statement.
2. OVDS displays all unreconciled transactions for the period.

### Matching Transactions

For each transaction in OVDS, take one of these actions:

| Action | When to Use |
|--------|------------|
| **Match** | Click to mark the transaction as reconciled — links it to the corresponding bank statement line |
| **Unmatch** | Undo a match if you made an error |
| **Create** | A transaction appears on the bank statement but has no corresponding OVDS entry — add it directly from the reconciliation screen (e.g. bank charges, interest earned) |

Work through all transactions until the **Difference** counter reaches **ETB 0.00**.

### Transaction Statuses

| Status | Meaning |
|--------|---------|
| **Unreconciled** | Transaction exists in OVDS but not yet matched to the bank statement |
| **Reconciled** | Matched and confirmed — locked against editing |
| **Excluded** | Intentionally excluded (e.g. in-transit deposits, outstanding cheques) |

---

## Step 4 — Investigate Differences

If the difference is not ETB 0.00, investigate before finishing:

| Common Issue | Likely Cause | Fix |
|-------------|-------------|-----|
| Outstanding deposit | Deposit in OVDS not yet cleared by the bank | Mark as **in-transit** and exclude |
| Outstanding cheque | Cheque issued in OVDS but not yet cashed | Mark as **in-transit** and exclude |
| Bank charges | Bank fees deducted but not yet recorded in OVDS | Click **Create** to add the transaction |
| Interest earned | Bank credited interest not in OVDS | Click **Create** to add as income |
| Timing differences | Transaction recorded in wrong period | Check the date and move to correct period |
| Data entry error | Amount entered incorrectly in OVDS | Unmatch, edit the original transaction, re-match |

---

## Step 5 — Finish Reconciliation

When the **Difference = ETB 0.00**:

1. Click **Finish Reconciliation**.
2. OVDS generates and saves a **Reconciliation Report** for this period.
3. All matched transactions are **locked** — they cannot be edited without unlocking.
4. The completed reconciliation appears in the reconciliation history for audit purposes.

---

## Monthly Reconciliation Checklist

Follow this sequence each month-end:

1. ☐ Download bank statement from your bank portal (CSV or PDF)
2. ☐ Import via **Banking → Import Statement**
3. ☐ Review imported transactions — fix any OCR or mapping errors
4. ☐ Go to the bank account → click **Reconcile**
5. ☐ Match each OVDS transaction to a bank statement line
6. ☐ Add any missing transactions (bank charges, interest)
7. ☐ Mark in-transit items as Excluded
8. ☐ Confirm Difference = ETB 0.00
9. ☐ Click **Finish Reconciliation**
10. ☐ Export the reconciliation report for your records

> Reconcile monthly within the first week of the following month. This ensures your financial statements are accurate before the VAT filing deadline (30th of each month).

---

## Reconciliation Report

After finishing, the report is saved under the bank account's **Reconciliation History**. It shows:
- Opening and closing balances per the bank statement
- All matched transactions
- Any in-transit items excluded
- The final difference (must be ETB 0.00 for a complete reconciliation)
- Timestamp and the user who completed it

Export as PDF for your external auditor or as a supporting document for the BIT return.

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Add a bank account | [Bank Accounts](./bank-accounts.md) |
| Record a manual transaction | [Bank Accounts → Manual Transactions](./bank-accounts.md#recording-transactions-manually) |
| Digital payments (Telebirr, Chapa) | [Digital Payments](./digital-payments.md) |
| Match invoice payments | [Financial Ops → Managing Invoices](../04-financial-ops/managing-invoices.md) |
| Period lock after reconciliation | [Tax & Compliance → IFRS & Audit → Period Lock](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |




