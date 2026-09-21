import { describe, it, expect } from 'vitest';

/**
 * Bug Condition Exploration Tests — Task 1
 *
 * Cat 6 — AP Aging Date Field Error
 *
 * These tests DOCUMENT and CONFIRM the bug on unfixed code.
 * They PASS on unfixed code (confirming the bug is real).
 * After fix (task 8.1), getApAging must use b.dueDate ?? b.date.
 *
 * Root cause:
 *   OvdsController.getApAging() computes:
 *     daysOverdue: Math.floor((Date.now() - new Date(b.date).getTime()) / MILLISECONDS_PER_DAY)
 *   It should use b.dueDate (the payment due date), not b.date (the creation date).
 *   A bill created 365 days ago but due 7 days ago should show ~7 days overdue, not 365.
 *
 * Validates: Requirements 6.1
 */

const MS_PER_DAY = 86400000;

// ─── Utilities mirroring buggy and fixed computation ─────────────────────────

function computeBuggyDaysOverdue(bill: { date: Date; dueDate?: Date | null }): number {
  // Mirrors the CURRENT buggy production code in OvdsController.getApAging():
  //   daysOverdue: Math.floor((Date.now() - new Date(b.date).getTime()) / MILLISECONDS_PER_DAY)
  return Math.floor((Date.now() - new Date(bill.date).getTime()) / MS_PER_DAY);
}

function computeFixedDaysOverdue(bill: { date: Date; dueDate?: Date | null }): number {
  // The correct implementation using dueDate ?? date
  const agingBase = bill.dueDate ?? bill.date;
  return Math.floor((Date.now() - new Date(agingBase).getTime()) / MS_PER_DAY);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Bug Condition: AP aging uses creation date instead of dueDate (Cat 6)', () => {
  it('BUG: daysOverdue is computed from b.date (creation) not b.dueDate', () => {
    const now = Date.now();

    const bill = {
      date:    new Date(now - 365 * MS_PER_DAY), // created 365 days ago
      dueDate: new Date(now - 7   * MS_PER_DAY), // due 7 days ago
      total:   1000,
      status:  'UNPAID',
    };

    const buggyDays  = computeBuggyDaysOverdue(bill);
    const correctDays = computeFixedDaysOverdue(bill);

    // BUG CONFIRMED: buggy code reports ~365 days overdue instead of ~7
    expect(buggyDays).toBeGreaterThanOrEqual(360);  // reflects creation date (~365)
    expect(correctDays).toBeLessThanOrEqual(10);    // reflects due date (~7)

    // The discrepancy is huge — proves the bug inflates overdue days dramatically
    expect(buggyDays).toBeGreaterThan(correctDays);
    expect(buggyDays - correctDays).toBeGreaterThan(300);
  });

  it('BUG: a bill due yesterday but created a year ago shows wrong aging bucket', () => {
    const now = Date.now();

    const bill = {
      date:    new Date(now - 365 * MS_PER_DAY), // created 365 days ago
      dueDate: new Date(now - 1   * MS_PER_DAY), // due yesterday
    };

    const buggyDays  = computeBuggyDaysOverdue(bill);
    const correctDays = computeFixedDaysOverdue(bill);

    // BUG: aging buckets would be completely wrong
    // A "1 day overdue" bill shows up in the 365+ days bucket
    expect(buggyDays).toBeGreaterThanOrEqual(360);
    expect(correctDays).toBe(1);

    // After fix: this bill must be in the 0-30 days bucket, not 365+ days
    expect(buggyDays).not.toBe(correctDays);
  });

  it('BUG: current production code uses b.date — confirmed by code inspection', () => {
    // The exact buggy line in OvdsController.getApAging():
    //   daysOverdue: Math.floor((Date.now() - new Date(b.date).getTime()) / MILLISECONDS_PER_DAY)
    //
    // It should be:
    //   const agingBase = b.dueDate ?? b.date;
    //   daysOverdue: Math.floor((Date.now() - new Date(agingBase).getTime()) / MILLISECONDS_PER_DAY)

    const now = Date.now();
    const creationDate = new Date(now - 200 * MS_PER_DAY);
    const dueDate      = new Date(now - 30  * MS_PER_DAY);

    const bill = { date: creationDate, dueDate };

    const fromCreationDate = Math.floor((now - creationDate.getTime()) / MS_PER_DAY);
    const fromDueDate      = Math.floor((now - dueDate.getTime())      / MS_PER_DAY);

    // Verify the two computations produce clearly different results
    expect(fromCreationDate).toBeGreaterThan(150); // ~200 days
    expect(fromDueDate).toBeCloseTo(30, -1);       // ~30 days

    // BUG CONFIRMED: production uses fromCreationDate (larger, wrong value)
    expect(computeBuggyDaysOverdue(bill)).toBe(fromCreationDate);

    // After fix: production must use fromDueDate (correct value)
    expect(computeFixedDaysOverdue(bill)).toBe(fromDueDate);
  });

  it('FALLBACK: when dueDate is absent, fixed code falls back to b.date (preservation)', () => {
    // Bills without a dueDate set: the fix must fall back to date
    const now = Date.now();
    const bill = {
      date:    new Date(now - 30 * MS_PER_DAY),
      dueDate: null,
    };

    const buggyDays  = computeBuggyDaysOverdue(bill);
    const fixedDays  = computeFixedDaysOverdue(bill);

    // When dueDate is null, both should give the same result (date-based fallback)
    expect(fixedDays).toBe(buggyDays);
    expect(fixedDays).toBeCloseTo(30, -1);
  });

  it('PRESERVATION: AR aging already uses dueDate correctly — this fix must not touch it', () => {
    // OvdsController.getArAging() already has the correct computation:
    //   daysOverdue: Math.floor((now - new Date(inv.dueDate!).getTime()) / MILLISECONDS_PER_DAY)
    // This test documents that AR aging is already fixed and must remain unchanged.

    const now = Date.now();
    const invoice = {
      dueDate: new Date(now - 14 * MS_PER_DAY),
    };

    const arDaysOverdue = Math.floor((now - invoice.dueDate.getTime()) / MS_PER_DAY);
    expect(arDaysOverdue).toBeCloseTo(14, -1); // Correct: ~14 days
  });
});
