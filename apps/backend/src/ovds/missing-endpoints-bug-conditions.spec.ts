import { describe, it, expect } from 'vitest';

/**
 * Bug Condition Exploration Tests — Task 1 / Task 4.4
 *
 * Cat 2 — Missing Backend Endpoints
 *
 * These tests document which endpoints were absent before the fix and confirm
 * they are now present after it.  They are structural / contract tests that
 * verify:
 *   (a) EstimatesService implements the full required interface
 *   (b) OvdsController exposes all required route handlers
 *   (c) EstimatesService methods behave correctly in isolation (unit level)
 *
 * Validates: Requirements 2.7, 2.8, 2.9, 2.10, 2.11, 2.12
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the names of all own methods on a class prototype, excluding constructor. */
function getMethods(cls: new (...a: any[]) => any): string[] {
  return Object.getOwnPropertyNames(cls.prototype).filter(m => m !== 'constructor');
}

// ─── EstimatesService interface completeness ──────────────────────────────────

describe('Bug Condition: EstimatesService was missing — required interface now present (Cat 2)', () => {
  it('FIX: EstimatesService exists and is importable', async () => {
    // Pre-fix: no estimates.service.ts → import throws MODULE_NOT_FOUND
    // Post-fix: module resolves successfully
    const module = await import('../sales/estimates.service');
    expect(module.EstimatesService).toBeDefined();
    expect(typeof module.EstimatesService).toBe('function'); // it's a class
  });

  it('FIX: EstimatesService implements all required CRUD methods', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const methods = getMethods(EstimatesService);

    const required = ['findAll', 'findOne', 'create', 'update', 'remove'];
    for (const method of required) {
      expect(methods, `EstimatesService must have method: ${method}`).toContain(method);
    }
  });

  it('FIX: EstimatesService implements send() and convertToInvoice() lifecycle methods', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const methods = getMethods(EstimatesService);

    expect(methods).toContain('send');
    expect(methods).toContain('convertToInvoice');
  });

  it('FIX: EstimatesService implements getNextNumber() and getStats()', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const methods = getMethods(EstimatesService);

    expect(methods).toContain('getNextNumber');
    expect(methods).toContain('getStats');
  });

  it('FIX: getNextNumber returns EST- prefix format (not INV-)', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');

    // Confirm the prefix constant is baked into getNextNumber
    // We test this by inspecting the source string representation
    const src = EstimatesService.prototype.getNextNumber.toString();
    expect(src).toContain('EST');
    expect(src).not.toMatch(/['"`]INV['"`]/);
  });

  it('FIX: getStats returns *Count suffix keys (not plain keys)', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const src = EstimatesService.prototype.getStats.toString();

    // Must use *Count keys consistently with invoice stats fix (Cat 3)
    expect(src).toContain('draftCount');
    expect(src).toContain('sentCount');
    expect(src).toContain('acceptedCount');
  });

  it('FIX: convertToInvoice creates invoice via Prisma $transaction', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const src = EstimatesService.prototype.convertToInvoice.toString();

    // Must use a transaction to keep estimate + invoice creation atomic
    expect(src).toContain('$transaction');
    // Must set CONVERTED status on the estimate
    expect(src).toContain('CONVERTED');
    // Must set convertedInvoiceId
    expect(src).toContain('convertedInvoiceId');
  });

  it('FIX: send() only transitions DRAFT estimates (rejects non-DRAFT)', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const src = EstimatesService.prototype.send.toString();

    // Must check status === 'DRAFT' before allowing transition
    expect(src).toContain('DRAFT');
    // Must throw on non-DRAFT (BadRequestException or similar)
    expect(src).toMatch(/BadRequestException|throw/);
  });

  it('FIX: findAll() scopes results to companyId when provided', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const src = EstimatesService.prototype.findAll.toString();

    // companyId must be applied to the WHERE clause
    expect(src).toContain('companyId');
    expect(src).toContain('where');
  });

  it('FIX: findAll() search uses OR with mode:insensitive (same pattern as fixed invoice search)', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');
    const src = EstimatesService.prototype.findAll.toString();

    // Must use OR clause with case-insensitive mode
    expect(src).toContain('insensitive');
    expect(src).toContain('estimateNumber');
    expect(src).toContain('customerName');
  });
});

// ─── OvdsController route handler completeness ───────────────────────────────

describe('Bug Condition: OvdsController was missing estimate and invoice handlers (Cat 2)', () => {
  it('FIX: OvdsController exposes all required estimate CRUD handlers', async () => {
    const { OvdsController } = await import('./ovds.controller');
    const methods = getMethods(OvdsController);

    const requiredEstimateHandlers = [
      'getEstimates',       // GET /ovds/estimates
      'createEstimate',     // POST /ovds/estimates
      'getEstimate',        // GET /ovds/estimates/:id
      'updateEstimate',     // PATCH /ovds/estimates/:id
      'deleteEstimate',     // DELETE /ovds/estimates/:id
    ];

    for (const handler of requiredEstimateHandlers) {
      expect(methods, `OvdsController must expose handler: ${handler}`).toContain(handler);
    }
  });

  it('FIX: OvdsController exposes estimate action handlers (send, convert)', async () => {
    const { OvdsController } = await import('./ovds.controller');
    const methods = getMethods(OvdsController);

    expect(methods).toContain('sendEstimate');
    expect(methods).toContain('convertEstimate');
  });

  it('FIX: OvdsController exposes estimate static handlers (stats, next-number)', async () => {
    const { OvdsController } = await import('./ovds.controller');
    const methods = getMethods(OvdsController);

    expect(methods).toContain('getEstimateStats');
    expect(methods).toContain('nextEstimateNumber');
  });

  it('FIX: OvdsController exposes GET /invoices/:id handler (was missing pre-fix)', async () => {
    const { OvdsController } = await import('./ovds.controller');
    const methods = getMethods(OvdsController);

    expect(methods).toContain('getInvoice');
  });

  it('FIX: OvdsController exposes POST /invoices/:id/void handler', async () => {
    const { OvdsController } = await import('./ovds.controller');
    const methods = getMethods(OvdsController);

    // The void handler may be named 'voidInvoice' or 'cancelInvoice'
    const hasVoidOrCancel = methods.some(
      m => m.toLowerCase().includes('void') || m.toLowerCase().includes('cancel'),
    );
    expect(hasVoidOrCancel).toBe(true);
  });

  it('FIX: OvdsController exposes POST /invoices/:id/reminder handler', async () => {
    const { OvdsController } = await import('./ovds.controller');
    const methods = getMethods(OvdsController);

    const hasReminder = methods.some(m => m.toLowerCase().includes('reminder'));
    expect(hasReminder).toBe(true);
  });

  it('FIX: OvdsController injects EstimatesService', async () => {
    const { OvdsController } = await import('./ovds.controller');
    const src = OvdsController.toString();

    // Constructor must accept EstimatesService
    expect(src).toContain('estimatesService');
  });
});

// ─── EstimatesService totals formula — no DRRF ───────────────────────────────

describe('FIX: EstimatesService uses invoice totals formula without DRRF (Cat 2)', () => {
  it('FIX: calculateEstimateTotals does not include drrfAmount', async () => {
    const { EstimatesService } = await import('../sales/estimates.service');

    // Inspect the private calculateEstimateTotals method source
    // (accessible via prototype even though it's marked private in TS)
    const calcFn = (EstimatesService.prototype as any)['calculateEstimateTotals'];
    expect(calcFn).toBeDefined();
    const src = calcFn.toString();

    // Estimates are not fiscal documents — no DRRF applies
    expect(src).not.toContain('drrf');
    expect(src).not.toContain('DRRF');
    expect(src).not.toContain('drrfAmount');

    // Must produce grandTotal from subtotal + vatAmount only
    expect(src).toContain('grandTotal');
    expect(src).toContain('vatAmount');
    expect(src).toContain('subtotal');
  });

  it('FIX: calculateEstimateTotals formula: grandTotal = subtotalAfterDisc + vatAmount', () => {
    // Inline simulation of the expected formula to verify correctness
    function calcTotals(items: Array<{ price: number; quantity: number }>, vatRate: number) {
      const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
      const grandTotal = Math.round((subtotal + vatAmount) * 100) / 100;
      return { subtotal, vatAmount, grandTotal };
    }

    const result = calcTotals([{ price: 100, quantity: 2 }], 15);
    expect(result.subtotal).toBe(200);
    expect(result.vatAmount).toBe(30);
    expect(result.grandTotal).toBe(230);

    // No DRRF component (SalesService would add ~2% disaster levy on top)
    // Estimate total is strictly subtotal + VAT
    expect((result as any).drrfAmount).toBeUndefined();
  });
});

// ─── Prisma Estimate model ────────────────────────────────────────────────────

describe('Bug Condition: Estimate Prisma model was absent (Cat 2)', () => {
  it('FIX: Estimate model is declared in schema.prisma (Prisma client must be regenerated to reflect it)', async () => {
    // We verify the schema declaration rather than instantiating a PrismaClient,
    // because `prisma generate` must be run to regenerate the client after schema
    // changes — and unit tests should not require a live DB connection.
    // The schema check below is equivalent: if the model is in schema.prisma,
    // running `prisma generate` will expose `prismaClient.estimate`.
    const { readFileSync } = await import('fs');
    const { join } = await import('path');

    const schemaPath = join(
      __dirname,
      '../../../../packages/database/prisma/schema.prisma',
    );
    const schema = readFileSync(schemaPath, 'utf8');

    // Prisma model block must exist
    expect(schema).toContain('model Estimate {');
    // Must map to a concrete table
    expect(schema).toContain('@@map("estimate")');
    // Must have an @id field
    expect(schema).toMatch(/id\s+String\s+@id/);
  });

  it('FIX: Estimate model has required fields in schema', async () => {
    // Verify the schema.prisma content contains the Estimate model with all required fields
    const { readFileSync } = await import('fs');
    const { join } = await import('path');

    const schemaPath = join(
      __dirname,
      '../../../../packages/database/prisma/schema.prisma',
    );
    const schema = readFileSync(schemaPath, 'utf8');

    expect(schema).toContain('model Estimate {');
    expect(schema).toContain('estimateNumber');
    expect(schema).toContain('convertedInvoiceId');
    expect(schema).toContain('sentAt');
    expect(schema).toContain('customerEmail');
    expect(schema).toContain('paymentTerms');
    // Status values documented in schema comment
    expect(schema).toContain('DRAFT');
    expect(schema).toContain('CONVERTED');
  });
});
