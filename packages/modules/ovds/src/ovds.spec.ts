import { describe, it, expect } from 'vitest';
import { ovdsModule, ovdsModuleProvider, FinancialService } from './index';
import { createMockEventBus, createMockContainer } from '@ovds/core';

describe('OvdsModuleProvider', () => {
  it('is created from the singleton instance', () => {
    expect(ovdsModule).toBeInstanceOf(ovdsModuleProvider);
  });

  it('has correct module info', () => {
    expect(ovdsModule.info.name).toBe('ovds');
    expect(ovdsModule.info.category).toBe('ovds');
    expect(ovdsModule.info.icon).toBe('DollarSign');
    expect(ovdsModule.info.dependsOn).toEqual(['core', 'settings']);
  });

  it('defines routes for invoice and banking', () => {
    const routes = ovdsModule.routes();
    const paths = routes.map((r) => r.path);

    expect(paths).toContain('/sales/invoices');
    expect(paths).toContain('/purchases/bills');
    expect(paths).toContain('/banking/accounts');
  });

  it('defines menu items', () => {
    const menus = ovdsModule.menus();
    expect(menus.length).toBeGreaterThan(0);
    expect(menus[0].key).toBe('ovds');
  });

  it('defines invoice_prefix and payment terms settings', () => {
    const settings = ovdsModule.settings();
    const keys = settings.map((s) => s.key);

    expect(keys).toContain('invoice_prefix');
    expect(keys).toContain('default_payment_terms');
  });

  it('defines invoice permissions', () => {
    const permissions = ovdsModule.permissions();
    const keys = permissions.map((p) => p.key);

    expect(keys).toContain('invoices.view');
    expect(keys).toContain('invoices.create');
    expect(keys).toContain('accounting.view');
  });

  it('registers and boots successfully', async () => {
    const mod = new ovdsModuleProvider();
    const eventBus = createMockEventBus();
    const container = createMockContainer();

    await mod.register(eventBus as any);
    await mod.boot(container as any);

    expect(mod.isRegistered).toBe(true);
    expect(mod.isBooted).toBe(true);
  });
});

describe('FinancialService', () => {
  it('creates an invoice with calculated totals', async () => {
    const service = new FinancialService();

    const invoice = await service.createInvoice({
      customerId: 'cust-1',
      items: [
        { description: 'Product A', quantity: 2, unitPrice: 100 },
        { description: 'Product B', quantity: 1, unitPrice: 50 },
      ],
      companyId: 'comp-1',
    });

    expect(invoice.subtotal).toBe(250);
    expect(invoice.taxAmount).toBe(37.5);
    expect(invoice.total).toBe(287.5);
    expect(invoice.status).toBe('draft');
    expect(service.getInvoiceCount()).toBe(1);
  });

  it('applies custom tax rate when provided', async () => {
    const service = new FinancialService();

    const invoice = await service.createInvoice({
      customerId: 'cust-1',
      items: [{ description: 'Item', quantity: 1, unitPrice: 1000 }],
      taxRate: 0.1,
      companyId: 'comp-1',
    });

    expect(invoice.taxAmount).toBe(100);
    expect(invoice.total).toBe(1100);
  });

  it('marks invoice as paid', async () => {
    const eventBus = createMockEventBus();
    const service = new FinancialService(eventBus);

    const invoice = await service.createInvoice({
      customerId: 'cust-1',
      items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
      companyId: 'comp-1',
    });

    const paid = service.markInvoicePaid(invoice.id);
    expect(paid?.status).toBe('paid');
    expect(eventBus.dispatchedEvents).toHaveLength(2);
  });

  it('returns null for marking non-existent invoice as paid', () => {
    const service = new FinancialService();
    const result = service.markInvoicePaid('nonexistent');
    expect(result).toBeNull();
  });

  it('creates a bill', async () => {
    const service = new FinancialService();

    const bill = await service.createBill({
      vendorId: 'vend-1',
      items: [{ description: 'Service', quantity: 1, unitPrice: 500 }],
      companyId: 'comp-1',
    });

    expect(bill.billNumber).toMatch(/^BILL-/);
    expect(service.getBillCount()).toBe(1);
  });

  it('finds invoice by id', async () => {
    const service = new FinancialService();
    const invoice = await service.createInvoice({
      customerId: 'cust-1',
      items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
      companyId: 'comp-1',
    });

    expect(service.findInvoice(invoice.id)?.invoiceNumber).toMatch(/^INV-/);
  });

  it('lists invoices filtered by company', async () => {
    const service = new FinancialService();
    await service.createInvoice({ customerId: 'c1', items: [{ description: 'Item', quantity: 1, unitPrice: 100 }], companyId: 'comp-1' });
    await service.createInvoice({ customerId: 'c2', items: [{ description: 'Item', quantity: 1, unitPrice: 100 }], companyId: 'comp-2' });

    expect(service.listInvoices('comp-1')).toHaveLength(1);
  });
});
