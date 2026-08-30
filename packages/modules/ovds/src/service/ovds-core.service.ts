import type { InvoiceDto, CreateInvoiceDto, CreateBillDto } from '../dto/ovds.dto';
import { dispatchEvent, type EventBusInterface } from '@ovds/core';

export class FinancialService {
  private invoices: Map<string, InvoiceDto> = new Map();
  private bills: Map<string, CreateBillDto & { id: string; billNumber: string }> = new Map();

  constructor(private eventBus?: EventBusInterface, private taxRate: number = 0.15) {}

  async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceDto> {
    const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const invoiceNumber = `INV-${String(this.invoices.size + 1).padStart(4, '0')}`;
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxRate = dto.taxRate ?? this.taxRate;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoice: InvoiceDto = {
      id,
      invoiceNumber,
      customerId: dto.customerId,
      items: dto.items,
      subtotal,
      taxAmount,
      total,
      status: 'draft',
      dueDate: dto.dueDate,
      companyId: dto.companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.invoices.set(id, invoice);
    await dispatchEvent(this.eventBus, 'ovds.invoice.created', invoice, FinancialService.name);
    return invoice;
  }

  markInvoicePaid(id: string): InvoiceDto | null {
    const invoice = this.invoices.get(id);
    if (!invoice) return null;

    const paid: InvoiceDto = {
      ...invoice,
      status: 'paid',
      updatedAt: new Date(),
    };
    this.invoices.set(id, paid);
    dispatchEvent(this.eventBus, 'ovds.invoice.paid', paid, FinancialService.name);
    return paid;
  }

  async createBill(dto: CreateBillDto): Promise<CreateBillDto & { id: string; billNumber: string }> {
    const id = `bill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const billNumber = `BILL-${String(this.bills.size + 1).padStart(4, '0')}`;
    const bill = { id, billNumber, ...dto };
    this.bills.set(id, bill);
    await dispatchEvent(this.eventBus, 'ovds.bill.created', bill, FinancialService.name);
    return bill;
  }

  findInvoice(id: string): InvoiceDto | null {
    return this.invoices.get(id) ?? null;
  }

  listInvoices(companyId: string): InvoiceDto[] {
    return Array.from(this.invoices.values()).filter((inv) => inv.companyId === companyId);
  }

  getInvoiceCount(): number {
    return this.invoices.size;
  }

  getBillCount(): number {
    return this.bills.size;
  }
}
