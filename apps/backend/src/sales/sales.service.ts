import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto, RecordPaymentDto } from './dto/invoice.dto';
import { DRRF_RATE, DEFAULT_DUE_DAYS_MS, PAGINATION_DEFAULT_LIMIT, DEFAULT_VAT_RATE, INVOICE_ACTIVITY_LIMIT, ETH_TAX } from '@ovds/shared';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private logAudit(action: string, data: Record<string, unknown>) {
    this.logger.log(`[AUDIT] ${action}: ${JSON.stringify(data)}`);
  }

  async findAll(query: { page?: number; limit?: number; status?: string; customerId?: string; companyId?: string; search?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'date';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Record<string, unknown> = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) {
      where.customerName = { contains: query.search };
    }
    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) (where.date as any).gte = new Date(query.dateFrom);
      if (query.dateTo) (where.date as any).lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { invoiceItem: true, invoicePayment: true, customer: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { invoiceItem: true, invoicePayment: true, customer: true, company: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private calcLineTotal(price: number, quantity: number, discountValue: number, showDiscount: boolean, discountType: string): number {
    const gross = price * quantity;
    const disc = showDiscount && discountType === 'PERCENT'
      ? gross * (discountValue / 100)
      : discountValue;
    return Math.max(0, gross - disc);
  }

  private calcLineTax(net: number, rate: number): number {
    return Math.round(net * (rate / 100) * 100) / 100;
  }

  private calculateInvoiceTotals(items: any[], vatRate: number) {
    const subtotal = items.reduce((acc, item) => {
      return acc + this.calcLineTotal(
        Number(item.price || 0),
        Number(item.quantity || 1),
        Number(item.discountValue || 0),
        !!item.showDiscount,
        item.discountType || 'FIXED'
      );
    }, 0);

    const vatAmount = items.reduce((acc, item) => {
      const net = this.calcLineTotal(
        Number(item.price || 0),
        Number(item.quantity || 1),
        Number(item.discountValue || 0),
        !!item.showDiscount,
        item.discountType || 'FIXED'
      );
      return acc + (item.showTax !== false ? this.calcLineTax(net, vatRate) : 0);
    }, 0);

    const drrfAmount = Math.round(subtotal * DRRF_RATE * 100) / 100;
    const grandTotal = Math.round((subtotal + vatAmount + drrfAmount) * 100) / 100;

    return { subtotal, vatAmount, drrfAmount, grandTotal };
  }

  async create(data: CreateInvoiceDto, userId?: string) {
    const { items, ...rest } = data as any;
    const itemsData = items || [];
    const vatRate = Number((data as any).vatRate || (data as any).settings?.ovds_default_vat_rate || DEFAULT_VAT_RATE);
    const totals = this.calculateInvoiceTotals(itemsData, vatRate);

    // Serialize buyerDetails for storage if provided
    const buyerDetailsJson = (data as any).buyerDetails
      ? JSON.stringify((data as any).buyerDetails)
      : null;

    const companyId: string | null = (data as any).companyId || null;

    const invoice = await this.prisma.$transaction(async (tx) => {
      // 1. Create the invoice row
      const inv = await tx.invoice.create({
        data: {
          ...rest,
          customerName: (data as any).customerName || (data as any).customer || '',
          customerId: (data as any).customerId || null,
          companyId,
          date: (data as any).date ? new Date((data as any).date) : new Date(),
          dueDate: (data as any).dueDate ? new Date((data as any).dueDate) : null,
          currencyCode:
            (data as any).currencyCode ||
            this.config.get<string>('DEFAULT_CURRENCY') ||
            ETH_TAX.CURRENCY,
          currencyRate: Number((data as any).currencyRate || 1),
          status: (data as any).status || 'DRAFT',
          subtotal: totals.subtotal,
          vatAmount: totals.vatAmount,
          drrfAmount: totals.drrfAmount,
          totalAmount: totals.grandTotal,
          vatRate,
          buyerDetails: buyerDetailsJson,
          items: JSON.stringify(itemsData),
          invoiceItem: {
            create: itemsData.map((item: any) => ({
              description: item.description || '',
              quantity: Number(item.quantity || 1),
              salePrice: Number(item.price || 0),
              discount: Number(item.discountValue || 0),
              discountType: item.discountType || 'FIXED',
              discountValue: Number(item.discountValue || 0),
              companyId,
            })),
          },
        },
        include: { invoiceItem: true, invoicePayment: true },
      });

      // 2. Double-entry journal: DR Accounts Receivable / CR Revenue + VAT Payable
      // Only post when the invoice is not a DRAFT (DRAFT invoices are not yet GL events).
      if (inv.status !== 'DRAFT' && companyId && totals.grandTotal > 0) {
        await this.postInvoiceJournalEntry(tx, inv, companyId, totals);
      }

      return inv;
    });

    this.logAudit('INVOICE_CREATED', { invoiceId: invoice.id, total: totals.grandTotal });
    return invoice;
  }

  /**
   * Post the IFRS-compliant double-entry journal for a sales invoice.
   *
   * DR  Accounts Receivable (asset)     = invoice total
   * CR  Revenue (income)                = subtotal
   * CR  VAT Payable (liability)         = vatAmount  [if VAT > 0]
   * CR  DRRF Payable (liability)        = drrfAmount [if DRRF > 0]
   *
   * Accounts are resolved by looking up the company's Chart of Accounts
   * using standard account codes. If a code is not found the journal line
   * is omitted for that component rather than failing the entire invoice.
   */
  private async postInvoiceJournalEntry(
    tx: any,
    invoice: { id: string; invoiceNumber: string; date: Date; companyId?: string | null },
    companyId: string,
    totals: { subtotal: number; vatAmount: number; drrfAmount: number; grandTotal: number },
  ): Promise<void> {
    // Resolve accounts by type code — these are the standard Ethiopian chart of accounts codes
    const [arAccount, revenueAccount, vatAccount, drrfAccount] = await Promise.all([
      tx.account.findFirst({ where: { companyId, code: '1200', isActive: true } }), // AR
      tx.account.findFirst({ where: { companyId, code: '4000', isActive: true } }), // Revenue
      tx.account.findFirst({ where: { companyId, code: '2210', isActive: true } }), // VAT Payable
      tx.account.findFirst({ where: { companyId, code: '2220', isActive: true } }), // DRRF Payable
    ]);

    if (!arAccount || !revenueAccount) {
      // Chart of accounts not configured — skip GL posting (no-op for fresh tenants)
      this.logger.warn(
        `Invoice ${invoice.invoiceNumber}: GL posting skipped — accounts 1200 (AR) or 4000 (Revenue) not found for company ${companyId}`,
      );
      return;
    }

    const journalEntry = await tx.journalEntry.create({
      data: {
        companyId,
        date: invoice.date,
        description: `Sales Invoice ${invoice.invoiceNumber}`,
        reference: invoice.invoiceNumber,
        status: 'POSTED',
        journalLine: {
          create: [
            // DR Accounts Receivable
            {
              accountId: arAccount.id,
              companyId,
              debit: totals.grandTotal,
              credit: 0,
              description: `AR – Invoice ${invoice.invoiceNumber}`,
            },
            // CR Revenue
            {
              accountId: revenueAccount.id,
              companyId,
              debit: 0,
              credit: totals.subtotal,
              description: `Revenue – Invoice ${invoice.invoiceNumber}`,
            },
            // CR VAT Payable (only if VAT collected)
            ...(totals.vatAmount > 0 && vatAccount
              ? [{
                  accountId: vatAccount.id,
                  companyId,
                  debit: 0,
                  credit: totals.vatAmount,
                  description: `VAT 15% – Invoice ${invoice.invoiceNumber}`,
                }]
              : []),
            // CR DRRF Payable (only if DRRF collected)
            ...(totals.drrfAmount > 0 && drrfAccount
              ? [{
                  accountId: drrfAccount.id,
                  companyId,
                  debit: 0,
                  credit: totals.drrfAmount,
                  description: `DRRF 1% – Invoice ${invoice.invoiceNumber}`,
                }]
              : []),
          ],
        },
      },
    });

    // Link journal entry back to the invoice
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { journalEntryId: journalEntry.id },
    });
  }


  async update(id: string, data: UpdateInvoiceDto, userId?: string) {
    const { items, ...rest } = data as any;
    const itemsData = items || [];
    const vatRate = Number((data as any).vatRate || DEFAULT_VAT_RATE);
    const totals = this.calculateInvoiceTotals(itemsData, vatRate);

    // Serialize buyerDetails for storage if provided
    const buyerDetailsJson = (data as any).buyerDetails
      ? JSON.stringify((data as any).buyerDetails)
      : undefined;

    const invoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          ...rest,
          customerName: (data as any).customerName || (data as any).customer || undefined,
          customerId: (data as any).customerId,
          date: (data as any).date ? new Date((data as any).date) : undefined,
          dueDate: (data as any).dueDate ? new Date((data as any).dueDate) : undefined,
          currencyCode: (data as any).currencyCode,
          currencyRate: Number((data as any).currencyRate || 1),
          subtotal: totals.subtotal,
          vatAmount: totals.vatAmount,
          drrfAmount: totals.drrfAmount,
          totalAmount: totals.grandTotal,
          vatRate,
          buyerDetails: buyerDetailsJson,
          items: JSON.stringify(itemsData),
          invoiceItem: {
            deleteMany: { invoiceId: id },
            create: itemsData.map((item: any) => ({
              description: item.description || '',
              quantity: Number(item.quantity || 1),
              salePrice: Number(item.price || 0),
              discount: Number(item.discountValue || 0),
              discountType: item.discountType || 'FIXED',
              discountValue: Number(item.discountValue || 0),
              companyId: (data as any).companyId || undefined,
            })),
          },
        },
        include: { invoiceItem: true, invoicePayment: true },
      });

      this.logAudit('INVOICE_UPDATED', { invoiceId: id, total: totals.grandTotal });
      return invoice;
  }

  async remove(id: string, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    await this.prisma.invoice.delete({ where: { id } });
    this.logAudit('INVOICE_DELETED', { invoiceId: id });
    return { success: true };
  }

  async send(id: string, userId?: string) {
    const invoice = await this.findOne(id);
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'PENDING', sentAt: new Date() },
      include: { invoiceItem: true, invoicePayment: true },
    });
    this.logAudit('INVOICE_SENT', { invoiceId: id });
    return updated;
  }

  async cancel(id: string, reason: string, userId?: string) {
    const invoice = await this.findOne(id);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason },
      include: { invoiceItem: true, invoicePayment: true },
    });
    this.logAudit('INVOICE_CANCELLED', { invoiceId: id, reason });
    return updated;
  }

  async markPaid(id: string, amount: number, paymentDate: string, userId?: string) {
    const invoice = await this.findOne(id);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already marked as paid');
    }

    // Record the payment entry and determine the correct status.
    // Never overwrite the invoice's totalAmount — that is the contract value.
    const payment = await this.prisma.invoicePayment.create({
      data: {
        invoiceId: id,
        companyId: invoice.companyId,
        amount: amount,
        method: 'CASH',
        paidAt: paymentDate ? new Date(paymentDate) : new Date(),
      },
    });

    const totalPaid = await this.prisma.invoicePayment.aggregate({
      where: { invoiceId: id },
      _sum: { amount: true },
    });
    const totalPaidAmount = Number(totalPaid._sum.amount || 0);
    const invoiceTotal = Number(invoice.totalAmount);

    const newStatus =
      totalPaidAmount >= invoiceTotal ? 'PAID' :
      totalPaidAmount > 0 ? 'PARTIAL' :
      invoice.status;

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: newStatus },
      include: { invoiceItem: true, invoicePayment: true },
    });

    this.logAudit('INVOICE_MARKED_PAID', { invoiceId: id, amount, status: newStatus });
    return updated;
  }

  async bulkSend(ids: string[], userId?: string) {
    const results = await Promise.allSettled(
      ids.map(id => this.send(id, userId))
    );
    const sent = results.filter(r => r.status === 'fulfilled').length;
    return { sent, failed: ids.length - sent };
  }

  async bulkCancel(ids: string[], reason?: string, userId?: string) {
    const results = await Promise.allSettled(
      ids.map(id => this.cancel(id, reason || 'Bulk cancelled', userId))
    );
    return { cancelled: results.filter(r => r.status === 'fulfilled').length };
  }

  async duplicate(id: string, userId?: string) {
    const original = await this.findOne(id);
    const duplicated = await this.prisma.invoice.create({
      data: {
        customerName: original.customerName,
        customerId: original.customerId,
        companyId: original.companyId,
        status: 'DRAFT',
        date: new Date(),
        dueDate: new Date(Date.now() + DEFAULT_DUE_DAYS_MS),
        currencyCode: original.currencyCode,
        currencyRate: original.currencyRate,
        vatRate: original.vatRate,
        items: original.items,
        invoiceItem: {
          create: (original.invoiceItem || []).map((item) => ({
            description: item.description,
            quantity: item.quantity,
            salePrice: item.salePrice,
            discount: item.discount,
            discountType: item.discountType,
            discountValue: item.discountValue,
            companyId: item.companyId,
          })),
        },
      },
      include: { invoiceItem: true, invoicePayment: true },
    });
    this.logAudit('INVOICE_DUPLICATED', { originalId: id, newId: duplicated.id });
    return duplicated;
  }

  async getNextNumber(companyId?: string): Promise<{ nextNumber: string }> {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    const where: Record<string, unknown> = { invoiceNumber: { startsWith: `${prefix}-${year}-` } };
    if (companyId) where.companyId = companyId;

    const last = await this.prisma.invoice.findFirst({
      where,
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextSeq = 1;
    if (last?.invoiceNumber) {
      const match = last.invoiceNumber.match(/INV-\d{4}-(\d+)/);
      if (match) nextSeq = parseInt(match[1]) + 1;
    }
    return { nextNumber: `INV-${year}-${String(nextSeq).padStart(4, '0')}` };
  }

  async getStats(companyId?: string) {
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    const [total, paid, pending, overdue] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
    ]);
    return { total, paid, pending, overdue };
  }

  async flagOverdue(companyId?: string) {
    const where: Record<string, unknown> = {
      status: { not: 'PAID' },
      dueDate: { lt: new Date() },
    };
    if (companyId) where.companyId = companyId;

    const result = await this.prisma.invoice.updateMany({
      where,
      data: { status: 'OVERDUE' },
    });

    return { flagged: result.count };
  }

  async recordPayment(invoiceId: string, data: RecordPaymentDto, userId?: string) {
    const invoice = await this.findOne(invoiceId);

    const payment = await this.prisma.$transaction(async (tx) => {
      const pmt = await tx.invoicePayment.create({
        data: {
          ...data,
          invoiceId,
          companyId: invoice.companyId,
          amount: Number(data.amount),
          paidAt: data.paidAt ? new Date(data.paidAt as string) : new Date(),
        },
        include: { invoice: true },
      });

      const totalPaid = await tx.invoicePayment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });

      const totalPaidAmount = Number(totalPaid._sum.amount || 0);
      const invoiceTotal = Number(invoice.totalAmount);
      const newStatus =
        totalPaidAmount >= invoiceTotal ? 'PAID' :
        totalPaidAmount > 0 ? 'PARTIAL' :
        invoice.status;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      // Double-entry: DR Cash/Bank CR Accounts Receivable on payment receipt
      if (invoice.companyId && Number(data.amount) > 0) {
        const [cashAccount, arAccount] = await Promise.all([
          tx.account.findFirst({
            where: { companyId: invoice.companyId, code: '1100', isActive: true },
          }),
          tx.account.findFirst({
            where: { companyId: invoice.companyId, code: '1200', isActive: true },
          }),
        ]);

        if (cashAccount && arAccount) {
          await tx.journalEntry.create({
            data: {
              companyId: invoice.companyId,
              date: pmt.paidAt,
              description: `Payment received – Invoice ${invoice.invoiceNumber}`,
              reference: invoice.invoiceNumber,
              status: 'POSTED',
              journalLine: {
                create: [
                  {
                    accountId: cashAccount.id,
                    companyId: invoice.companyId,
                    debit: Number(data.amount),
                    credit: 0,
                    description: `Cash receipt – Invoice ${invoice.invoiceNumber}`,
                  },
                  {
                    accountId: arAccount.id,
                    companyId: invoice.companyId,
                    debit: 0,
                    credit: Number(data.amount),
                    description: `AR cleared – Invoice ${invoice.invoiceNumber}`,
                  },
                ],
              },
            },
          });
        }
      }

      return pmt;
    });

    this.logAudit('PAYMENT_RECORDED', { invoiceId, amount: payment.amount });
    return payment;
  }

  async getPayments(invoiceId: string) {
    const payments = await this.prisma.invoicePayment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });
    return payments;
  }

  async getActivity(invoiceId: string) {
    const activities = await this.prisma.invoiceActivity.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
      take: INVOICE_ACTIVITY_LIMIT,
    });
    return activities;
  }
}
