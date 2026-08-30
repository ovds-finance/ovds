import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBills(query: { page?: number; limit?: number; status?: string; vendorId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;

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

  async createBill(data: Record<string, unknown>) {
    return this.prisma.bill.create({ data: data as any });
  }

  async updateBill(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.bill.update({ where: { id }, data: data as any });
    } catch (e) {
      console.error(`[PURCHASES] Failed to update bill ${id}:`, e);
      throw new NotFoundException('Bill not found');
    }
  }

  async removeBill(id: string) {
    try {
      return await this.prisma.bill.delete({ where: { id } });
    } catch (e) {
      console.error(`[PURCHASES] Failed to delete bill ${id}:`, e);
      throw new NotFoundException('Bill not found');
    }
  }

  async findPurchaseOrders(query: { page?: number; limit?: number; status?: string; vendorId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;

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
      console.error(`[PURCHASES] Failed to update purchase order ${id}:`, e);
      throw new NotFoundException('Purchase order not found');
    }
  }

  async removePurchaseOrder(id: string) {
    try {
      return await this.prisma.purchaseOrder.delete({ where: { id } });
    } catch (e) {
      console.error(`[PURCHASES] Failed to delete purchase order ${id}:`, e);
      throw new NotFoundException('Purchase order not found');
    }
  }

  async findGrns(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.goodsReceivedNote.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.goodsReceivedNote.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createGrn(data: Record<string, unknown>) {
    return this.prisma.goodsReceivedNote.create({ data: data as any });
  }

  async findVendorPayments(query: { page?: number; limit?: number; vendorId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.vendorId) where.vendorId = query.vendorId;

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
