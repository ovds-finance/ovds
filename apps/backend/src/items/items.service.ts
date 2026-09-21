import { Injectable, NotFoundException } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findItems(query: { page?: number; limit?: number; type?: string; status?: string; search?: string; companies?: string[]; companiesIn?: string[] }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.companies) where.companyId = { in: query.companies };
    if (query.companiesIn) where.companyId = { in: query.companiesIn };

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.item.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findItem(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async createItem(data: Record<string, unknown>) {
    return this.prisma.item.create({ data: data as any });
  }

  async updateItem(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.item.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Item not found');
    }
  }

  async removeItem(id: string) {
    try {
      return await this.prisma.item.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Item not found');
    }
  }
}