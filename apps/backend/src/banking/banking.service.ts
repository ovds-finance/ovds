import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class BankingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAccounts(companyId: string | null, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;

    // Guard: never return all tenants' accounts when companyId is absent
    if (!companyId) return { data: [], total: 0, page, limit, totalPages: 0 };

    const skip = (page - 1) * limit;
    const where = { companyId };
    const [data, total] = await Promise.all([
      this.prisma.bankAccount.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.bankAccount.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAccount(companyId: string | null, id: string) {
    const where = companyId ? { id, companyId } : { id };
    const account = await this.prisma.bankAccount.findFirst({ where });
    if (!account) throw new NotFoundException('Bank account not found');
    return account;
  }

  async createAccount(companyId: string | null, data: Record<string, unknown>) {
    const createData: Record<string, unknown> = companyId ? { ...data, companyId } : data;
    return this.prisma.bankAccount.create({ data: createData as any });
  }

  async updateAccount(companyId: string | null, id: string, data: Record<string, unknown>) {
    const where = companyId ? { id, companyId } : { id };
    try {
      return await this.prisma.bankAccount.update({ where, data: data as any });
    } catch (e) {
      throw new NotFoundException('Bank account not found');
    }
  }

  async removeAccount(companyId: string | null, id: string) {
    const where = companyId ? { id, companyId } : { id };
    try {
      return await this.prisma.bankAccount.delete({ where });
    } catch (e) {
      throw new NotFoundException('Bank account not found');
    }
  }

  async findTransactions(companyId: string | null, query: { page?: number; limit?: number; accountId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (query.accountId) where.accountId = query.accountId;

    const [data, total] = await Promise.all([
      this.prisma.bankTransaction.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.bankTransaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createTransaction(companyId: string | null, data: Record<string, unknown>) {
    const createData: Record<string, unknown> = companyId ? { ...data, companyId } : data;
    return this.prisma.bankTransaction.create({ data: createData as any });
  }

  async findTransaction(companyId: string | null, id: string) {
    const where = companyId ? { id, companyId } : { id };
    const txn = await this.prisma.bankTransaction.findFirst({ where });
    if (!txn) throw new NotFoundException('Bank transaction not found');
    return txn;
  }

  async updateTransaction(companyId: string | null, id: string, data: Record<string, unknown>) {
    const where = companyId ? { id, companyId } : { id };
    const existing = await this.prisma.bankTransaction.findFirst({ where });
    if (!existing) throw new NotFoundException('Bank transaction not found');
    return this.prisma.bankTransaction.update({ where: { id }, data: data as any });
  }

  async removeTransaction(companyId: string | null, id: string) {
    const where = companyId ? { id, companyId } : { id };
    const existing = await this.prisma.bankTransaction.findFirst({ where });
    if (!existing) throw new NotFoundException('Bank transaction not found');
    return this.prisma.bankTransaction.delete({ where: { id } });
  }

  async findTransfers(companyId: string | null, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where = companyId ? { companyId } : {};
    const [data, total] = await Promise.all([
      this.prisma.fundTransfer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.fundTransfer.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createTransfer(companyId: string | null, data: Record<string, unknown>) {
    const createData: Record<string, unknown> = companyId ? { ...data, companyId } : data;
    return this.prisma.fundTransfer.create({ data: createData as any });
  }

  async findTransfer(companyId: string | null, id: string) {
    const where = companyId ? { id, companyId } : { id };
    const transfer = await this.prisma.fundTransfer.findFirst({ where });
    if (!transfer) throw new NotFoundException('Fund transfer not found');
    return transfer;
  }

  async updateTransfer(companyId: string | null, id: string, data: Record<string, unknown>) {
    const where = companyId ? { id, companyId } : { id };
    const existing = await this.prisma.fundTransfer.findFirst({ where });
    if (!existing) throw new NotFoundException('Fund transfer not found');
    return this.prisma.fundTransfer.update({ where: { id }, data: data as any });
  }

  async removeTransfer(companyId: string | null, id: string) {
    const where = companyId ? { id, companyId } : { id };
    const existing = await this.prisma.fundTransfer.findFirst({ where });
    if (!existing) throw new NotFoundException('Fund transfer not found');
    return this.prisma.fundTransfer.delete({ where: { id } });
  }
}
