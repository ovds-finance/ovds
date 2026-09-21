import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MASTER_COMPLIANCE_CHECKLIST_TEMPLATE, PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MasterComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async findChecklists(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.masterComplianceChecklist.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.masterComplianceChecklist.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findChecklist(id: string) {
    const checklist = await this.prisma.masterComplianceChecklist.findUnique({ where: { id } });
    if (!checklist) throw new NotFoundException('Master compliance checklist not found');
    return checklist;
  }

  async createChecklist(data: Record<string, unknown>) {
    const created = await this.prisma.masterComplianceChecklist.create({ data: data as any });

    await this.prisma.$transaction(async (tx) => {
      for (const item of MASTER_COMPLIANCE_CHECKLIST_TEMPLATE) {
        await tx.masterComplianceItem.create({
          data: {
            checklistId: created.id,
            sectionKey: item.sectionKey,
            itemKey: item.itemKey,
            itemText: item.itemText,
            status: 'PENDING',
          },
        });
      }
    });

    return this.findChecklist(created.id);
  }

  async updateChecklist(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.masterComplianceChecklist.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Master compliance checklist not found');
    }
  }

  async removeChecklist(id: string) {
    try {
      return await this.prisma.masterComplianceChecklist.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Master compliance checklist not found');
    }
  }

  async findItems(checklistId: string) {
    const checklist = await this.prisma.masterComplianceChecklist.findUnique({ where: { id: checklistId } });
    if (!checklist) throw new NotFoundException('Master compliance checklist not found');
    return this.prisma.masterComplianceItem.findMany({ where: { checklistId }, orderBy: { sectionKey: 'asc', itemKey: 'asc' } });
  }

  async updateItem(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.masterComplianceItem.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Master compliance item not found');
    }
  }

  async getTemplate() {
    return { success: true, data: MASTER_COMPLIANCE_CHECKLIST_TEMPLATE };
  }

  async getSummary() {
    const [totalChecklists, draftChecklists, inProgressChecklists, completedChecklists, totalItems, pendingItems, passItems, failItems, itemsBySection] = await Promise.all([
      this.prisma.masterComplianceChecklist.count(),
      this.prisma.masterComplianceChecklist.count({ where: { status: 'DRAFT' } }),
      this.prisma.masterComplianceChecklist.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.masterComplianceChecklist.count({ where: { status: 'COMPLETED' } }),
      this.prisma.masterComplianceItem.count(),
      this.prisma.masterComplianceItem.count({ where: { status: 'PENDING' } }),
      this.prisma.masterComplianceItem.count({ where: { status: 'PASS' } }),
      this.prisma.masterComplianceItem.count({ where: { status: 'FAIL' } }),
      this.prisma.masterComplianceItem.groupBy({ by: ['sectionKey'], _count: { sectionKey: true } }),
    ]);

    return {
      totalChecklists,
      draftChecklists,
      inProgressChecklists,
      completedChecklists,
      totalItems,
      pendingItems,
      passItems,
      failItems,
      complianceScore: totalItems > 0 ? Math.round((passItems / totalItems) * 100) : 0,
      itemsBySection: itemsBySection.map((item: any) => ({ sectionKey: item.sectionKey, count: item._count.sectionKey })),
    };
  }
}

