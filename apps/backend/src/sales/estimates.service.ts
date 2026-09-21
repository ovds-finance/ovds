import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT, DEFAULT_VAT_RATE, DEFAULT_DUE_DAYS_MS } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private logAudit(action: string, data: Record<string, unknown>) {
    this.logger.log(`[AUDIT] ${action}: ${JSON.stringify(data)}`);
  }

  // ─── Total Calculation ───────────────────────────────────────────────────────

  /**
   * Calculates estimate totals from line items.
   * Same formula as SalesService.calculateInvoiceTotals() but without DRRF —
   * estimates are not fiscal documents so no Disaster Risk Response Fund levy applies.
   *
   * grandTotal = subtotal + vatAmount
   */
  private calcLineTotal(
    price: number,
    quantity: number,
    discountValue: number,
    showDiscount: boolean,
    discountType: string,
  ): number {
    const gross = price * quantity;
    const disc =
      showDiscount && discountType === 'PERCENT'
        ? gross * (discountValue / 100)
        : discountValue;
    return Math.max(0, gross - disc);
  }

  private calcLineTax(net: number, rate: number): number {
    return Math.round(net * (rate / 100) * 100) / 100;
  }

  private calculateEstimateTotals(
    items: any[],
    vatRate: number,
    estimateDiscountValue = 0,
    estimateDiscountType: 'PERCENT' | 'FIXED' = 'FIXED',
  ): { subtotal: number; subtotalAfterDisc: number; vatAmount: number; grandTotal: number } {
    const subtotal = items.reduce((acc, item) => {
      return (
        acc +
        this.calcLineTotal(
          Number(item.price || 0),
          Number(item.quantity || 1),
          Number(item.discountValue || 0),
          !!item.showDiscount,
          item.discountType || 'FIXED',
        )
      );
    }, 0);

    const estimateDisc =
      estimateDiscountType === 'PERCENT'
        ? subtotal * (estimateDiscountValue / 100)
        : estimateDiscountValue;
    const subtotalAfterDisc = Math.max(0, subtotal - estimateDisc);

    const vatAmount = items.reduce((acc, item) => {
      const net = this.calcLineTotal(
        Number(item.price || 0),
        Number(item.quantity || 1),
        Number(item.discountValue || 0),
        !!item.showDiscount,
        item.discountType || 'FIXED',
      );
      return acc + (item.showTax !== false ? this.calcLineTax(net, vatRate) : 0);
    }, 0);

    const grandTotal = Math.round((subtotalAfterDisc + vatAmount) * 100) / 100;

    return { subtotal, subtotalAfterDisc, vatAmount, grandTotal };
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    companyId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'date';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Record<string, unknown> = {};
    if (query.companyId) where.companyId = query.companyId;
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { estimateNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) (where.date as any).gte = new Date(query.dateFrom);
      if (query.dateTo) (where.date as any).lte = new Date(query.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.estimate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.estimate.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const estimate = await this.prisma.estimate.findUnique({ where: { id } });
    if (!estimate) throw new NotFoundException('Estimate not found');
    return estimate;
  }

  async create(data: Record<string, any>, _userId?: string) {
    const itemsData: any[] = data.items || [];
    const vatRate = Number(data.vatRate || DEFAULT_VAT_RATE);
    const totals = this.calculateEstimateTotals(
      itemsData,
      vatRate,
      Number(data.discountValue || 0),
      (data.discountType || 'FIXED') as 'PERCENT' | 'FIXED',
    );

    const estimate = await this.prisma.estimate.create({
      data: {
        customerName: data.customerName || data.customer || '',
        customerId: data.customerId || null,
        companyId: data.companyId || null,
        status: data.status || 'DRAFT',
        date: data.date ? new Date(data.date) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + DEFAULT_DUE_DAYS_MS),
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        totalAmount: totals.grandTotal,
        notes: data.notes || null,
        items: JSON.stringify(itemsData),
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        customerAddress: data.customerAddress || null,
        customerTin: data.customerTin || null,
        paymentTerms: data.paymentTerms || null,
      },
    });

    this.logAudit('ESTIMATE_CREATED', { estimateId: estimate.id, total: totals.grandTotal });
    return estimate;
  }

  async update(id: string, data: Record<string, any>, _userId?: string) {
    // Verify the estimate exists first
    await this.findOne(id);

    const itemsData: any[] = data.items || [];
    const vatRate = Number(data.vatRate || DEFAULT_VAT_RATE);

    // Only recalculate totals when items are supplied in the update payload
    let totalsUpdate: Record<string, unknown> = {};
    if (data.items !== undefined) {
      const totals = this.calculateEstimateTotals(
        itemsData,
        vatRate,
        Number(data.discountValue || 0),
        (data.discountType || 'FIXED') as 'PERCENT' | 'FIXED',
      );
      totalsUpdate = {
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        totalAmount: totals.grandTotal,
        items: JSON.stringify(itemsData),
      };
    }

    const estimate = await this.prisma.estimate.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined && { customerName: data.customerName }),
        ...(data.customerId !== undefined && { customerId: data.customerId }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.customerEmail !== undefined && { customerEmail: data.customerEmail }),
        ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone }),
        ...(data.customerAddress !== undefined && { customerAddress: data.customerAddress }),
        ...(data.customerTin !== undefined && { customerTin: data.customerTin }),
        ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
        ...totalsUpdate,
      },
    });

    this.logAudit('ESTIMATE_UPDATED', { estimateId: id });
    return estimate;
  }

  async remove(id: string) {
    const estimate = await this.prisma.estimate.findUnique({ where: { id } });
    if (!estimate) throw new NotFoundException('Estimate not found');

    await this.prisma.estimate.delete({ where: { id } });
    this.logAudit('ESTIMATE_DELETED', { estimateId: id });
    return { success: true };
  }

  // ─── Lifecycle Transitions ───────────────────────────────────────────────────

  async send(id: string) {
    const estimate = await this.findOne(id);
    if (estimate.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot send an estimate with status "${estimate.status}". Only DRAFT estimates may be sent.`,
      );
    }

    const updated = await this.prisma.estimate.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    this.logAudit('ESTIMATE_SENT', { estimateId: id });
    return updated;
  }

  /**
   * Converts an estimate to an invoice.
   *
   * - Creates a new Invoice (status DRAFT) from the estimate's fields.
   * - Sets `convertedInvoiceId` on the estimate and transitions its status to CONVERTED.
   * - Returns the newly created invoice.
   */
  async convertToInvoice(id: string) {
    const estimate = await this.findOne(id);

    if (estimate.status === 'CONVERTED') {
      throw new BadRequestException('Estimate has already been converted to an invoice');
    }

    // Re-parse items from stored JSON to recalculate with current defaults
    const itemsData: any[] = (() => {
      try {
        return JSON.parse((estimate.items as string) ?? '[]');
      } catch {
        return [];
      }
    })();
    const vatRate = DEFAULT_VAT_RATE;
    const totals = this.calculateEstimateTotals(itemsData, vatRate);

    const invoice = await this.prisma.$transaction(async (tx) => {
      // 1. Create the invoice from the estimate data
      const inv = await tx.invoice.create({
        data: {
          customerName: estimate.customerName,
          customerId: estimate.customerId,
          companyId: estimate.companyId,
          status: 'DRAFT',
          date: new Date(),
          dueDate: estimate.dueDate ?? new Date(Date.now() + DEFAULT_DUE_DAYS_MS),
          currencyCode: 'ETB',
          currencyRate: 1,
          vatRate,
          subtotal: totals.subtotal,
          vatAmount: totals.vatAmount,
          drrfAmount: 0,
          totalAmount: totals.grandTotal,
          notes: estimate.notes,
          items: estimate.items,
          customerEmail: estimate.customerEmail,
          customerPhone: estimate.customerPhone,
          customerAddress: estimate.customerAddress,
          customerTin: estimate.customerTin,
          paymentTerms: estimate.paymentTerms,
          invoiceItem: {
            create: itemsData.map((item: any) => ({
              description: item.description || '',
              quantity: Number(item.quantity || 1),
              salePrice: Number(item.price || 0),
              discount: Number(item.discountValue || 0),
              discountType: item.discountType || 'FIXED',
              discountValue: Number(item.discountValue || 0),
              companyId: estimate.companyId,
            })),
          },
        },
        include: { invoiceItem: true, invoicePayment: true },
      });

      // 2. Mark the estimate as CONVERTED and link back to the invoice
      await tx.estimate.update({
        where: { id },
        data: { status: 'CONVERTED', convertedInvoiceId: inv.id },
      });

      return inv;
    });

    this.logAudit('ESTIMATE_CONVERTED', { estimateId: id, invoiceId: invoice.id });
    return invoice;
  }

  // ─── Numbering & Stats ───────────────────────────────────────────────────────

  async getNextNumber(companyId?: string): Promise<{ nextNumber: string }> {
    const prefix = 'EST';
    const year = new Date().getFullYear();
    const where: Record<string, unknown> = { estimateNumber: { startsWith: `${prefix}-${year}-` } };
    if (companyId) where.companyId = companyId;

    const last = await this.prisma.estimate.findFirst({
      where,
      orderBy: { estimateNumber: 'desc' },
      select: { estimateNumber: true },
    });

    let nextSeq = 1;
    if (last?.estimateNumber) {
      const match = last.estimateNumber.match(/EST-\d{4}-(\d+)/);
      if (match) nextSeq = parseInt(match[1]) + 1;
    }
    return { nextNumber: `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}` };
  }

  async getStats(companyId?: string) {
    const where: Record<string, unknown> = companyId ? { companyId } : {};
    const [total, draftCount, sentCount, acceptedCount, declinedCount, convertedCount] =
      await Promise.all([
        this.prisma.estimate.count({ where }),
        this.prisma.estimate.count({ where: { ...where, status: 'DRAFT' } }),
        this.prisma.estimate.count({ where: { ...where, status: 'SENT' } }),
        this.prisma.estimate.count({ where: { ...where, status: 'ACCEPTED' } }),
        this.prisma.estimate.count({ where: { ...where, status: 'DECLINED' } }),
        this.prisma.estimate.count({ where: { ...where, status: 'CONVERTED' } }),
      ]);

    return { total, draftCount, sentCount, acceptedCount, declinedCount, convertedCount };
  }
}
