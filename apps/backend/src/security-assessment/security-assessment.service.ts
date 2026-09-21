import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SecurityAssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAssessments(query: { page?: number; limit?: number; status?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.securityAssessment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.securityAssessment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAssessment(id: string) {
    const assessment = await this.prisma.securityAssessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Security assessment not found');
    return assessment;
  }

  async createAssessment(data: Record<string, unknown>) {
    return this.prisma.securityAssessment.create({ data: data as any });
  }

  async updateAssessment(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.securityAssessment.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Security assessment not found');
    }
  }

  async removeAssessment(id: string) {
    try {
      return await this.prisma.securityAssessment.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Security assessment not found');
    }
  }

  async startAssessment(id: string) {
    const assessment = await this.prisma.securityAssessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Security assessment not found');
    if (assessment.status === 'IN_PROGRESS') throw new BadRequestException('Assessment already in progress');
    if (assessment.status === 'COMPLETED') throw new BadRequestException('Assessment already completed');

    return this.prisma.securityAssessment.update({
      where: { id },
      data: { status: 'IN_PROGRESS', currentPhase: 'PHASE_1_ATTACK_SURFACE', startedAt: new Date() },
    });
  }

  async completeAssessment(id: string) {
    const assessment = await this.prisma.securityAssessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Security assessment not found');
    if (assessment.status !== 'IN_PROGRESS') throw new BadRequestException('Assessment is not in progress');

    return this.prisma.securityAssessment.update({
      where: { id },
      data: { status: 'COMPLETED', currentPhase: 'ALL', completedAt: new Date() },
    });
  }

  async findScans(assessmentId: string) {
    const assessment = await this.prisma.securityAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Security assessment not found');
    return this.prisma.securityScan.findMany({ where: { assessmentId }, orderBy: { createdAt: 'asc' } });
  }

  async createScan(assessmentId: string, data: Record<string, unknown>) {
    const assessment = await this.prisma.securityAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Security assessment not found');

    return this.prisma.securityScan.create({
      data: { ...data, assessmentId } as any,
    });
  }

  async updateScan(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.securityScan.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Security scan not found');
    }
  }

  async findFindings(query: { page?: number; limit?: number; severity?: string; status?: string; category?: string; assessmentId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.assessmentId) where.assessmentId = query.assessmentId;

    const [data, total] = await Promise.all([
      this.prisma.securityFinding.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.securityFinding.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findFinding(id: string) {
    const finding = await this.prisma.securityFinding.findUnique({ where: { id } });
    if (!finding) throw new NotFoundException('Security finding not found');
    return finding;
  }

  async updateFinding(id: string, data: Record<string, unknown>) {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (updateData.status === 'RESOLVED' && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      return await this.prisma.securityFinding.update({ where: { id }, data: updateData as any });
    } catch {
      throw new NotFoundException('Security finding not found');
    }
  }

  async getSummary() {
    const [totalAssessments, activeAssessments, totalFindings, openFindings, criticalFindings, findingsBySeverity, findingsByCategory] = await Promise.all([
      this.prisma.securityAssessment.count(),
      this.prisma.securityAssessment.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.securityFinding.count(),
      this.prisma.securityFinding.count({ where: { status: 'OPEN' } }),
      this.prisma.securityFinding.count({ where: { severity: 'CRITICAL', status: { not: 'RESOLVED' } } }),
      this.prisma.securityFinding.groupBy({ by: ['severity'], _count: { severity: true } }),
      this.prisma.securityFinding.groupBy({ by: ['category'], _count: { category: true } }),
    ]);

    return {
      totalAssessments,
      activeAssessments,
      totalFindings,
      openFindings,
      criticalFindings,
      findingsBySeverity: findingsBySeverity.map((item: any) => ({ severity: item.severity, count: item._count.severity })),
      findingsByCategory: findingsByCategory.map((item: any) => ({ category: item.category, count: item._count.category })),
    };
  }
}
