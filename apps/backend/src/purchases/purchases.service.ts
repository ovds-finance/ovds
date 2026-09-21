import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findBills(query: { page?: number; limit?: number; status?: string; vendorId?: string; companyId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.companyId) where.companyId = query.companyId;

    const [data, total] = await Promise.all([
      this.prisma.bill.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.bill.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBill(id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  private calculateBillTotals(
    items: Array<{ price?: number; unitPrice?: number; quantity?: number; discount?: number }>,
    vatRate = 15,
  ): { subtotal: number; vatAmount: number; total: number } {
    const subtotal = items.reduce((acc, item) => {
      const price    = Number(item.price ?? item.unitPrice ?? 0);
      const quantity = Number(item.quantity ?? 1);
      const discount = Number(item.discount ?? 0);
      return acc + Math.max(0, price * quantity - discount);
    }, 0);
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total     = Math.round((subtotal + vatAmount) * 100) / 100;
    return { subtotal, vatAmount, total };
  }

  async createBill(data: Record<string, unknown>) {
    const items = (data.items as any[]) ?? [];
    const totals = items.length > 0
      ? this.calculateBillTotals(items, Number(data.vatRate ?? 15))
      : {
          subtotal:  Number(data.subtotal  ?? 0),
          vatAmount: Number(data.vatAmount ?? 0),
          total:     Number(data.total     ?? 0),
        };
    return this.prisma.bill.create({
      data: { ...data, ...totals } as any,
    });
  }

  async updateBill(id: string, data: Record<string, unknown>) {
    try {
      const items = (data.items as any[]) ?? [];
      const totals = items.length > 0
        ? this.calculateBillTotals(items, Number(data.vatRate ?? 15))
        : {};
      return await this.prisma.bill.update({
        where: { id },
        data: { ...data, ...totals } as any,
      });
    } catch (e) {
      this.logger.warn(`Failed to update bill ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Bill not found');
    }
  }

  async removeBill(id: string) {
    try {
      return await this.prisma.bill.delete({ where: { id } });
    } catch (e) {
      this.logger.warn(`Failed to delete bill ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Bill not found');
    }
  }

  async findPurchaseOrders(query: { page?: number; limit?: number; status?: string; vendorId?: string; companyId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.companyId) where.companyId = query.companyId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async createPurchaseOrder(data: Record<string, unknown>) {
    return this.prisma.purchaseOrder.create({ data: data as any });
  }

  async updatePurchaseOrder(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.purchaseOrder.update({ where: { id }, data: data as any });
    } catch (e) {
      this.logger.warn(`Failed to update purchase order ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Purchase order not found');
    }
  }

  async removePurchaseOrder(id: string) {
    try {
      return await this.prisma.purchaseOrder.delete({ where: { id } });
    } catch (e) {
      this.logger.warn(`Failed to delete purchase order ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Purchase order not found');
    }
  }

  async findGrns(query: { page?: number; limit?: number; status?: string; companyId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.companyId) where.companyId = query.companyId;

    const [data, total] = await Promise.all([
      this.prisma.goodsReceivedNote.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.goodsReceivedNote.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createGrn(data: Record<string, unknown>) {
    return this.prisma.goodsReceivedNote.create({ data: data as any });
  }

  async findVendorPayments(query: { page?: number; limit?: number; vendorId?: string; companyId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.companyId) where.companyId = query.companyId;

    const [data, total] = await Promise.all([
      this.prisma.vendorPayment.findMany({ where, skip, take: limit, orderBy: { paymentDate: 'desc' } }),
      this.prisma.vendorPayment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createVendorPayment(data: Record<string, unknown>) {
    return this.prisma.vendorPayment.create({ data: data as any });
  }
}
