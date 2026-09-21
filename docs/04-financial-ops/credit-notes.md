<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# Credit Notes

> **Part of:** [Financial Operations](./README.md) › Invoices & Estimates
>
> **Requires:** Login · `invoices:read` · `invoices:write`
>
> **Navigate to:** **Sales → Credit Notes** (`/credit-notes`)

A credit note is a document that reduces a customer's outstanding balance — used when an invoice has been overcharged, goods were returned, a service was not delivered, or a refund needs to be formally recorded. In Ovds, credit notes are mirrored invoices with negative amounts, prefixed `CN-`, and linked to the original invoice for a full audit trail.

---

## When to Use a Credit Note

| Scenario | Use |
|----------|-----|
| Customer was overcharged on an invoice | Credit note for the overcharged amount |
| Goods returned after invoice was sent | Credit note for the returned goods value |
| Service not fully delivered | Partial credit note for the undelivered portion |
| Invoice already paid — customer wants a refund | Credit note + refund transaction |
| Invoice already paid — apply credit to future invoice | Credit note applied as future credit |
| Pricing error on a sent (not paid) invoice | Cancel invoice and reissue, OR credit note + new invoice |

---

## Creating a Credit Note

### From an Existing Invoice (Recommended)

1. Open the original invoice from **Sales → Invoices**.
2. Click **More Actions (⋯) → Create Credit Note**.
3. Ovds pre-fills the credit note with the original invoice's customer, items, and amounts.
4. Adjust the items or amounts if this is a partial credit (e.g. only some items were returned).
5. Add a **Reason** — this appears on the credit note PDF for the customer.
6. Click **Save** — the credit note is created with number prefix `CN-` and linked to the original invoice.

### Manually (without an original invoice)

1. Go to **Sales → Credit Notes** → click **New Credit Note**.
2. Select the **Customer**.
3. Add line items with the amounts to credit (enter as positive numbers — OVDS stores them as negatives).
4. Add a **Reason**.
5. Click **Save**.

---

## Credit Note Number Format

Credit notes follow the numbering format: `CN-{YEAR}-{SEQUENCE}` — e.g. `CN-2026-0042`.

The sequence is independent from invoice numbering and auto-increments per company.

---

## Applying a Credit Note

After creating a credit note, you have two options:

### Option 1 — Apply to a Future Invoice

1. Open a future (open) invoice for the same customer.
2. In the payment section, click **Apply Credit Note**.
3. Select the credit note from the list.
4. The invoice balance is reduced by the credit note amount.
5. The customer only needs to pay the remaining balance.

### Option 2 — Issue a Cash Refund

1. Open the credit note and click **Issue Refund**.
2. Select the refund method (bank transfer, Telebirr, etc.) and the account.
3. Click **Confirm** — a refund transaction is recorded and the credit note is marked as settled.
4. GL entries are posted automatically:
   ```
   Dr  Accounts Receivable / Revenue (reversal)
       Cr  Cash / Bank
   ```

---

## Partial Credit Notes

If only part of an invoice needs to be credited (e.g. 2 of 5 items were returned):

1. Create the credit note from the original invoice.
2. On the pre-filled form, delete the lines that are not being credited, or adjust quantities.
3. The credit note amount will be less than the original invoice total.
4. The original invoice retains the remaining paid balance.

---

## Credit Note Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Created but not yet sent to the customer |
| **Sent** | Emailed to the customer |
| **Applied** | Applied against a future invoice |
| **Refunded** | A cash refund has been issued |
| **Void** | Cancelled — no financial effect |

---

## GL Impact

When a credit note is created and applied or refunded, Ovds posts the following entries:

**On creation (for an already-paid invoice):**
```
Dr  Sales Revenue        (reversal of the original revenue)
    Cr  Accounts Receivable   (or Cash if refunded directly)
```

**On applying to a future invoice:**
```
Dr  Accounts Receivable   (reduces the customer's balance)
    Cr  Credit Note Applied   (clearing account, nets to zero)
```

**Output VAT is also reversed** — the credit note reduces the Output VAT for the period in which it is issued.

---

## Sending a Credit Note to the Customer

1. Open the credit note and click **Send To**.
2. Confirm the customer's email address.
3. Click **Send** — the customer receives the credit note PDF by email.
4. The credit note PDF includes your company logo, TIN, and an ERCA QR code.

---

## Credit Notes and VAT

Credit notes affect your VAT position:

- **Output VAT is reduced** by the VAT amount on the credit note
- The credit note appears in the **Sales Tax Summary** report as a negative output VAT line
- Issue the credit note in the **same VAT period** as the original invoice where possible — this simplifies VAT reconciliation

If the original invoice and the credit note fall in **different VAT periods**, the credit note's VAT reduction is applied in the period the credit note is issued.

---

## Debit Notes (Vendor Side)

For the equivalent on the purchasing side — adjusting what a vendor owes you — see [Creating a Bill → Debit Notes](./creating-a-bill.md#debit-notes).

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Issue a refund on a paid invoice | [Managing Invoices → Refunds](./managing-invoices.md#handle-refunds-and-credit-notes) |
| Debit notes for vendor adjustments | [Creating a Bill → Debit Notes](./creating-a-bill.md#debit-notes) |
| VAT impact on credit notes | [Tax & Compliance → VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| Credit note in the customer's account | [Customers & Vendors → Customer 360°](./customers-and-vendors.md#customer-360-view) |
| GL reversal entries | [General Ledger & Journal Entries](./general-ledger-and-journals.md) |



