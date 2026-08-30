import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@Injectable()
export class BankingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAccounts(companyId: string | null, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where = companyId ? { companyId } : {};
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
}
