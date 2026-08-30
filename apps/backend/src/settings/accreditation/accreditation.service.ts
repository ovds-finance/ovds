import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ACCREDITATION_CHECKLIST_TEMPLATE, PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@Injectable()
export class AccreditationService {
  constructor(private readonly prisma: PrismaService) {}

  async findChecklists(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.accreditationChecklist.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.accreditationChecklist.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findChecklist(id: string) {
    const checklist = await this.prisma.accreditationChecklist.findUnique({ where: { id } });
    if (!checklist) throw new NotFoundException('Accreditation checklist not found');
    return checklist;
  }

  async createChecklist(data: Record<string, unknown>) {
    const created = await this.prisma.accreditationChecklist.create({ data: data as any });

    await this.prisma.$transaction(async (tx) => {
      for (const item of ACCREDITATION_CHECKLIST_TEMPLATE) {
        await tx.accreditationItem.create({
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
      return await this.prisma.accreditationChecklist.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Accreditation checklist not found');
    }
  }

  async removeChecklist(id: string) {
    try {
      return await this.prisma.accreditationChecklist.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Accreditation checklist not found');
    }
  }

  async findItems(checklistId: string) {
    const checklist = await this.prisma.accreditationChecklist.findUnique({ where: { id: checklistId } });
    if (!checklist) throw new NotFoundException('Accreditation checklist not found');
    return this.prisma.accreditationItem.findMany({ where: { checklistId }, orderBy: { sectionKey: 'asc', itemKey: 'asc' } });
  }

  async updateItem(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.accreditationItem.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Accreditation item not found');
    }
  }

  async bulkUpdateItems(items: Array<{ id: string; status: string; comment?: string }>) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const updated = await tx.accreditationItem.update({
          where: { id: item.id },
          data: { status: item.status, comment: item.comment },
        });
        results.push(updated);
      }
      return results;
    });
  }

  async getTemplate() {
    return { success: true, data: ACCREDITATION_CHECKLIST_TEMPLATE };
  }

  async getSummary() {
    const [totalChecklists, draftChecklists, inProgressChecklists, completedChecklists, totalItems, pendingItems, passItems, failItems, naItems] = await Promise.all([
      this.prisma.accreditationChecklist.count(),
      this.prisma.accreditationChecklist.count({ where: { status: 'DRAFT' } }),
      this.prisma.accreditationChecklist.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.accreditationChecklist.count({ where: { status: 'COMPLETED' } }),
      this.prisma.accreditationItem.count(),
      this.prisma.accreditationItem.count({ where: { status: 'PENDING' } }),
      this.prisma.accreditationItem.count({ where: { status: 'PASS' } }),
      this.prisma.accreditationItem.count({ where: { status: 'FAIL' } }),
      this.prisma.accreditationItem.count({ where: { status: 'NOT_APPLICABLE' } }),
    ]);

    const gradedItems = passItems + failItems + naItems;
    return {
      totalChecklists,
      draftChecklists,
      inProgressChecklists,
      completedChecklists,
      totalItems,
      pendingItems,
      passItems,
      failItems,
      naItems,
      complianceScore: gradedItems > 0 ? Math.round((passItems / gradedItems) * 100) : 0,
    };
  }
}

