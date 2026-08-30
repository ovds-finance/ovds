<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Payment Edge Cases

> **Part of:** [Financial Operations](./README.md)
>
> **Requires:** Login · `invoices:write` · `ovds:write`

Real-world payments rarely go exactly as planned. This guide covers the most common non-standard payment scenarios: overpayments, advance deposits, returned/bounced payments, write-offs, and applying payments across multiple invoices.

---

## Customer Overpayment

When a customer pays more than the invoice amount:

### Option 1 — Apply Excess as a Credit

1. Record the full amount received via **Invoice → Add Payment**.
2. The invoice is marked **Paid**. The excess amount remains as a **customer credit** (overpayment balance).
3. Navigate to **Sales → Customers → [Customer] → Overpayment Balance** to see the credit.
4. Apply the credit to the next invoice:
   - Open the next invoice → **Apply Credit** → select the overpayment.
   - The invoice balance is reduced by the credit amount.

### Option 2 — Refund the Excess

1. Record the full payment received (invoice marked Paid, excess noted).
2. Go to **Sales → Refunds** → click **New Refund**.
3. Select the customer and enter the overpaid amount.
4. Select the refund method (bank transfer, Telebirr).
5. GL entries posted:
   ```
   On refund:
     Dr  Accounts Receivable (overpaid amount)
         Cr  Cash / Bank
   ```

---

## Customer Advance / Deposit

When a customer pays a deposit before any invoice is raised:

1. Navigate to **Sales → Receipts** → click **New Receipt**.
2. Select or create the customer.
3. Enter the deposit amount and payment method.
4. Set the **Receipt Type** to **Advance Payment** — this creates a liability (deferred revenue) rather than income:
   ```
   Dr  Cash / Bank
       Cr  Customer Advance / Deferred Revenue (2200)
   ```
5. When the invoice is eventually raised and sent, apply the advance:
   - Open the invoice → **Apply Advance** → select the customer's advance.
   - The invoice balance is reduced, and the advance is recognised as revenue:
   ```
   Dr  Customer Advance (2200)
       Cr  Revenue (4000)
   ```

> This treatment is required under **IFRS 15** — revenue is only recognised when the performance obligation is satisfied, not when cash is received.

---

## Returned / Bounced Payment

When a bank notifies you that a previously recorded payment has bounced (cheque returned, Telebirr reversal, etc.):

1. Go to **Sales → Invoices** → open the affected invoice.
2. The invoice currently shows **Paid** — you need to reverse the payment.
3. Open the **Payment History** tab → find the payment → click **Reverse Payment**.
4. Enter the reversal date and reason (e.g. *Cheque returned — insufficient funds*).
5. OVDS reverses the GL entry and resets the invoice status to **Sent** (or **Overdue** if past due date):
   ```
   Original payment:
     Dr  Bank Account        ETB 25,000
         Cr  Accounts Receivable              ETB 25,000

   Reversal:
     Dr  Accounts Receivable ETB 25,000
         Cr  Bank Account                     ETB 25,000
   ```
6. Add an **internal note** to the invoice: *"Cheque [ref] bounced — awaiting replacement payment"*.
7. Re-send a payment reminder to the customer.

### Bank Charge on a Bounced Cheque

If the bank charges you a fee for the returned cheque:

1. Go to **Banking → Transactions → New Transaction**.
2. Type: **Expense**, Account: your operating account.
3. Category: **Bank Charges** (maps to GL 6xxx).
4. Amount: the fee charged by the bank.

---

## Partial Payment on Multiple Invoices

When a customer makes one payment that needs to be split across several open invoices:

1. Open the **oldest** overdue invoice → click **Add Payment**.
2. Enter the partial amount that covers this invoice (or less).
3. Repeat for the next invoice.

Alternatively, use the **Collections → Payment Batches** workflow:
1. Go to **ovds → Collections → Payment Batches → New Batch**.
2. Add multiple invoice payments to the batch.
3. Click **Post Batch** — all payments are recorded simultaneously.

**Automatic allocation logic:** If you receive a single bank transfer reference with no indication of which invoices it covers, the reconciliation engine attempts to match by amount. Review and confirm allocations in **Banking → Reconcile → Unmatched Transactions**.

---

## Write-Off (Uncollectable Invoice)

When a debt is deemed unrecoverable after exhausting collection efforts:

1. Open the invoice → click **More Actions → Write Off**.
2. Select the **Bad Debt Expense** GL account (e.g. 6800 Bad Debt Expense).
3. Enter the reason and any supporting context (collection history, demand letter reference).
4. Click **Confirm** — GL entries posted:
   ```
   Dr  Bad Debt Expense (6800)
       Cr  Accounts Receivable
   ```
5. The invoice balance is cleared. The invoice status changes to **Written Off**.
6. The write-off appears in the P&L under Operating Expenses.

> Requires `ovds:write` + `ovds:approve`. The write-off is logged in the Audit Trail with approval details.

### IFRS 9 Impact

After a write-off, update the IFRS 9 ECL provision — the actual loss is now confirmed and the provision can be released for that debtor:

1. Go to **Reports → IFRS 9 ECL**.
2. Re-run the ECL calculation — the written-off amount no longer appears in receivables.
3. The reduction in provision is recognised as a **recovery of impairment** in P&L.

---

## Vendor Overpayment

When you pay a vendor more than the bill amount:

1. The excess amount remains in **Accounts Payable** as a credit.
2. Apply it to the next bill from the same vendor:
   - Open the next bill → **Pay Bill** → enter the net amount payable (bill amount minus credit).
3. Or request a refund from the vendor:
   - The vendor issues a **credit note** (in their system) or sends a refund payment.
   - Record the incoming refund as: `Dr Bank / Cr Accounts Payable`.

---

## Payment via Multiple Methods (Split Payment)

When a customer pays part by Telebirr and part by bank transfer:

1. Open the invoice → click **Add Payment**.
2. Select **Telebirr** as the method, enter the Telebirr amount.
3. Click **Add Payment** again.
4. Select **Bank Transfer**, enter the remaining amount and bank reference.
5. Both payments are recorded on the invoice's Payment History tab.
6. The invoice status changes to **Paid** once the total reaches the full balance.

---

## Payment on a Pro-Forma Invoice

Pro-forma invoices are not financial documents — they don't create GL entries. To record a payment against a pro-forma:

1. Convert the pro-forma to a final invoice first: **Sales → Proforma Invoices → [Invoice] → Convert to Invoice**.
2. Record the payment on the final invoice as normal.

See [Estimates & Sales Orders → Proforma Invoices](./estimates-and-sales-orders.md#proforma-invoices).

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Standard payment recording | [Managing Invoices → Recording a Payment](./managing-invoices.md#recording-a-payment) |
| Refunds and credit notes | [Credit Notes](./credit-notes.md) |
| Collections and overdue AR | [Banking → Treasury & Collections](../05-banking/treasury-collections.md) |
| IFRS 9 ECL on written-off debts | [Reports → Financial Reports](../07-reports/financial-reports.md#ifrs-9-ecl--expected-credit-loss) |
| Bank reconciliation after reversal | [Banking → Bank Reconciliation](../05-banking/bank-reconciliation.md) |
| Advance deposits under IFRS 15 | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md) |




