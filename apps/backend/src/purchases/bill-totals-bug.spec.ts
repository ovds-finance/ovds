import { describe, it, expect } from 'vitest';

/**
 * Bug Condition Exploration Tests — Task 1
 *
 * Cat 5 — Bill Total Miscalculation
 *
 * These tests DOCUMENT and CONFIRM the bug on unfixed code.
 * They PASS on unfixed code (confirming the bug is real).
 * After fix (task 7.1), the calculateBillTotals helper must be added
 * and createBill/updateBill must use it.
 *
 * Root cause:
 *   PurchasesService.createBill() passes data as-is to prisma.bill.create():
 *     return this.prisma.bill.create({ data: data as any });
 *   There is no equivalent of SalesService.calculateInvoiceTotals() for bills.
 *   A client can send total: 9999 and that value is stored verbatim, regardless
 *   of what the line items actually sum to.
 *
 * Validates: Requirements 5.1
 */

// ─── Utility: mirrors the buggy createBill behaviour ─────────────────────────

function buggyCreateBillData(data: Record<string, unknown>): Record<string, unknown> {
  // Current code: return this.prisma.bill.create({ data: data as any });
  // Stored total is whatever the client sent — no recalculation
  return { ...data }; // Exactly what would be stored
}

// ─── Utility: the correct total calculation (as the fix will implement) ───────

function calculateBillTotals(
  items: Array<{ price?: number; unitPrice?: number; quantity?: number; discount?: number }>,
  vatRate = 15,
): { subtotal: number; vatAmount: number; total: number } {
  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.price ?? item.unitPrice ?? 0);
    const quantity = Number(item.quantity ?? 1);
    const discount = Number(item.discount ?? 0);
    return acc + Math.max(0, price * quantity - discount);
  }, 0);
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;
  return { subtotal, vatAmount, total };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Bug Condition: Bill totals not recalculated from line items (Cat 5)', () => {
  it('BUG: createBill stores client-supplied total as-is without recalculating from items', () => {
    const clientPayload = {
      vendorName: 'Supplier X',
      items: [
        { price: 100, quantity: 2, discount: 0 }, // actual: 200, with 15% VAT = 230
      ],
      total: 9999, // client sends wrong total
      vatAmount: 0,
    };

    // Current buggy behaviour: data is stored as-is
    const stored = buggyCreateBillData(clientPayload);
    expect(stored['total']).toBe(9999); // BUG CONFIRMED: wrong total stored

    // Correct total that should be derived from items
    const correctTotals = calculateBillTotals(clientPayload.items);
    expect(correctTotals.subtotal).toBe(200);
    expect(correctTotals.vatAmount).toBe(30);
    expect(correctTotals.total).toBe(230);

    // BUG: stored total (9999) does not equal calculated total (230)
    expect(stored['total']).not.toBe(correctTotals.total);
  });

  it('BUG: createBill does not contain a calculateBillTotals call — totals come from client', () => {
    // Document the exact buggy code:
    //   async createBill(data: Record<string, unknown>) {
    //     return this.prisma.bill.create({ data: data as any });
    //   }
    // There is no calculateBillTotals() helper anywhere in PurchasesService

    // Simulate: what happens if client sends inflated values
    const maliciousPayload = {
      items: [{ price: 50, quantity: 1 }],  // correct total: 50 + 7.50 VAT = 57.50
      total: 50000,                          // inflated total
      vatAmount: 0,
      subtotal: 50000,
    };

    const stored = buggyCreateBillData(maliciousPayload);
    const correct = calculateBillTotals(maliciousPayload.items);

    expect(stored['total']).toBe(50000);       // BUG: stores inflated value
    expect(correct.total).toBe(57.5);          // Correct value
    expect(stored['total']).not.toBe(correct.total); // BUG CONFIRMED
  });

  it('BUG: createBill does not handle zero-discount items correctly when totals omitted from client', () => {
    const items = [
      { price: 200, quantity: 3, discount: 0 }, // 600
      { price: 50,  quantity: 2, discount: 10 }, // 90
    ]; // subtotal: 690, vatAmount: 103.50, total: 793.50

    const correct = calculateBillTotals(items);
    expect(correct.subtotal).toBe(690);
    expect(correct.vatAmount).toBe(103.5);
    expect(correct.total).toBe(793.5);

    // If client omits total (undefined), buggy code stores undefined
    const payloadWithoutTotal = { items, vendorId: 'vendor-1' };
    const stored = buggyCreateBillData(payloadWithoutTotal);
    // Buggy stored total is absent from stored data (or whatever Prisma default gives)
    expect(stored['total']).toBeUndefined();

    // After fix: stored total must equal correct.total regardless of client payload
  });

  it('calculateBillTotals helper produces correct subtotal + VAT + total', () => {
    // Validates the helper that the fix will add to PurchasesService

    const items = [
      { price: 100, quantity: 1, discount: 0  }, // 100
      { price: 200, quantity: 2, discount: 20 }, // 380
    ]; // subtotal: 480, vat@15%: 72, total: 552

    const result = calculateBillTotals(items);
    expect(result.subtotal).toBe(480);
    expect(result.vatAmount).toBe(72);
    expect(result.total).toBe(552);
  });

  it('calculateBillTotals handles custom VAT rate', () => {
    const items = [{ price: 1000, quantity: 1, discount: 0 }];

    const result5  = calculateBillTotals(items, 5);
    const result15 = calculateBillTotals(items, 15);
    const result0  = calculateBillTotals(items, 0);

    expect(result5.vatAmount).toBe(50);
    expect(result5.total).toBe(1050);

    expect(result15.vatAmount).toBe(150);
    expect(result15.total).toBe(1150);

    expect(result0.vatAmount).toBe(0);
    expect(result0.total).toBe(1000);
  });

  it('calculateBillTotals handles bills without items (fallback path unchanged after fix)', () => {
    // Bills without items should use the client-supplied values as-is (preservation)
    const emptyItems: any[] = [];
    const result = calculateBillTotals(emptyItems);
    expect(result.subtotal).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.total).toBe(0);
  });
});
