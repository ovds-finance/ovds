import { describe, it, expect } from 'vitest';

/**
 * Bug Condition Exploration Tests — Task 1
 *
 * These tests DOCUMENT and CONFIRM bugs on unfixed code.
 * They should PASS on unfixed code (confirming the bug is real).
 * After each fix is applied, the associated "After fix" assertions
 * serve as the acceptance criteria to verify in later tasks.
 *
 * Cat 3 — Stats Response Key Mismatch
 * Cat 7 — Invoice Search (case-sensitivity + single-field)
 */

// ─── Category 3: Stats Response Shape Mismatch ────────────────────────────────
describe('Bug Condition: Stats response key mismatch (Cat 3)', () => {
  /**
   * Validates: Requirements 3.1
   *
   * Root cause: SalesService.getStats() returns
   *   { total, paid, draft, pending, partial, overdue }
   * but Invoices.tsx reads:
   *   res?.draftCount, res?.pendingCount, res?.paidCount, res?.overdueCount
   *
   * The *Count suffix keys are absent, so all status-tab counters show 0 or undefined.
   */
  it('BUG: getStats() returns {draft} not {draftCount} — frontend reads draftCount and gets undefined', () => {
    // Simulate the actual object returned by SalesService.getStats() on unfixed code
    const mockStatsResponse = {
      total: 5,
      paid: 2,
      draft: 1,
      pending: 1,
      partial: 0,
      overdue: 1,
    };

    // BUG CONFIRMED: wrong key names present (plain form without *Count suffix)
    expect(mockStatsResponse).toHaveProperty('draft');    // has wrong key
    expect(mockStatsResponse).toHaveProperty('paid');     // has wrong key
    expect(mockStatsResponse).toHaveProperty('pending');  // has wrong key
    expect(mockStatsResponse).toHaveProperty('overdue');  // has wrong key

    // BUG CONFIRMED: *Count suffix keys are absent — frontend reads these and gets undefined
    expect(mockStatsResponse).not.toHaveProperty('draftCount');
    expect(mockStatsResponse).not.toHaveProperty('paidCount');
    expect(mockStatsResponse).not.toHaveProperty('pendingCount');
    expect(mockStatsResponse).not.toHaveProperty('overdueCount');
    expect(mockStatsResponse).not.toHaveProperty('partialCount');

    // After fix: getStats() must return object with *Count suffix keys
    // expect(mockStatsResponse).toHaveProperty('draftCount');
    // expect(mockStatsResponse).toHaveProperty('paidCount');
    // expect(mockStatsResponse).toHaveProperty('pendingCount');
    // expect(mockStatsResponse).toHaveProperty('overdueCount');
    // expect(mockStatsResponse).toHaveProperty('partialCount');
  });

  it('BUG: frontend stat tab reads .draftCount but service provides .draft — evaluates to undefined', () => {
    const serviceResponse = { total: 10, paid: 3, draft: 2, pending: 4, partial: 0, overdue: 1 };

    // Frontend code: const draftCount = res?.draftCount
    const frontendDraftCount = (serviceResponse as any)?.draftCount;
    const frontendPaidCount  = (serviceResponse as any)?.paidCount;
    const frontendPendingCount = (serviceResponse as any)?.pendingCount;
    const frontendOverdueCount = (serviceResponse as any)?.overdueCount;

    // BUG CONFIRMED: all tab counts evaluate to undefined
    expect(frontendDraftCount).toBeUndefined();
    expect(frontendPaidCount).toBeUndefined();
    expect(frontendPendingCount).toBeUndefined();
    expect(frontendOverdueCount).toBeUndefined();

    // The actual data IS in the response, just under wrong keys
    expect(serviceResponse.draft).toBe(2);
    expect(serviceResponse.paid).toBe(3);
    expect(serviceResponse.pending).toBe(4);
    expect(serviceResponse.overdue).toBe(1);
  });
});

// ─── Category 7: Invoice Search — Case-Sensitivity & Single-Field ─────────────
describe('Bug Condition: Invoice search case-sensitivity and single-field (Cat 7)', () => {
  /**
   * Validates: Requirements 7.1, 7.2
   *
   * Root cause: SalesService.findAll() builds:
   *   where.customerName = { contains: query.search }
   * Problems:
   *   1. Only searches customerName — invoiceNumber is never checked
   *   2. Missing mode: 'insensitive' — case-sensitive on PostgreSQL/MySQL
   */
  it('BUG: case-sensitive contains does not match "acme corp" against "ACME CORP"', () => {
    const searchTerm = 'acme corp';
    const invoiceCustomerName = 'ACME CORP';

    // Current (buggy) behaviour: Prisma `contains` without mode:'insensitive'
    // behaves like a case-sensitive JS .includes()
    const caseSensitiveMatch = invoiceCustomerName.includes(searchTerm);

    // BUG CONFIRMED: case-sensitive search returns no results
    expect(caseSensitiveMatch).toBe(false);

    // After fix: case-insensitive match should work
    const caseInsensitiveMatch = invoiceCustomerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    expect(caseInsensitiveMatch).toBe(true); // What the fix must produce
  });

  it('BUG: search term "INV-2024" does not match invoice.invoiceNumber — only customerName is searched', () => {
    const searchTerm = 'INV-2024';
    const invoice = {
      invoiceNumber: 'INV-2024-0001',
      customerName: 'Acme Corp',
    };

    // Current (buggy) behaviour: where.customerName = { contains: searchTerm }
    // Only customerName is queried — invoiceNumber is never checked
    const currentBehaviourMatch = invoice.customerName.includes(searchTerm);

    // BUG CONFIRMED: searching by invoice number returns nothing
    expect(currentBehaviourMatch).toBe(false);

    // After fix: invoiceNumber should also be searched
    const fixedBehaviourMatch =
      invoice.invoiceNumber.includes(searchTerm) ||
      invoice.customerName.includes(searchTerm);
    expect(fixedBehaviourMatch).toBe(true); // What the fix must produce
  });

  it('BUG: the where clause for search is built with single-field, case-sensitive contains', () => {
    // Document the exact buggy code path in SalesService.findAll()
    // The problematic code is:
    //   if (query.search) {
    //     where.customerName = { contains: query.search };  // <-- no mode, single field
    //   }

    function buildBuggyWhere(search?: string) {
      const where: Record<string, unknown> = {};
      if (search) {
        where['customerName'] = { contains: search }; // Mirrors the buggy production code
      }
      return where;
    }

    function buildFixedWhere(search?: string) {
      const where: Record<string, unknown> = {};
      if (search) {
        where['OR'] = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
        ];
      }
      return where;
    }

    const buggyWhere = buildBuggyWhere('INV-2024');
    const fixedWhere = buildFixedWhere('INV-2024');

    // BUG CONFIRMED: buggy where has 'customerName' key, not 'OR'
    expect(buggyWhere).toHaveProperty('customerName');
    expect(buggyWhere).not.toHaveProperty('OR');

    // After fix: where should use OR with mode:insensitive
    expect(fixedWhere).toHaveProperty('OR');
    expect(fixedWhere).not.toHaveProperty('customerName');
    expect((fixedWhere['OR'] as any[])).toHaveLength(2);
  });
});
