import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { INSA_CYBER_AUDIT_CHECKLIST, PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@Injectable()
export class CyberAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAudits(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.cyberAudit.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.cyberAudit.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAudit(id: string) {
    const audit = await this.prisma.cyberAudit.findUnique({ where: { id } });
    if (!audit) throw new NotFoundException('Cyber audit not found');
    return audit;
  }

  async createAudit(data: Record<string, unknown>) {
    const created = await this.prisma.cyberAudit.create({ data: data as any });

    await this.prisma.$transaction(async (tx) => {
      for (const item of INSA_CYBER_AUDIT_CHECKLIST) {
        await tx.cyberAuditMetric.create({
          data: {
            auditId: created.id,
            areaNumber: item.areaNumber,
            areaName: item.areaName,
            metricNumber: item.metricNumber,
            metricName: item.metricName,
            requirement: item.requirement,
            explanation: item.explanation,
            status: 'PENDING',
          },
        });
      }
    });

    return this.findAudit(created.id);
  }

  async updateAudit(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.cyberAudit.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Cyber audit not found');
    }
  }

  async removeAudit(id: string) {
    try {
      return await this.prisma.cyberAudit.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Cyber audit not found');
    }
  }

  async startAudit(id: string) {
    const audit = await this.prisma.cyberAudit.findUnique({ where: { id } });
    if (!audit) throw new NotFoundException('Cyber audit not found');
    if (audit.status === 'IN_PROGRESS') throw new BadRequestException('Audit already in progress');
    if (audit.status === 'COMPLETED') throw new BadRequestException('Audit already completed');

    return this.prisma.cyberAudit.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  async completeAudit(id: string) {
    const audit = await this.prisma.cyberAudit.findUnique({ where: { id } });
    if (!audit) throw new NotFoundException('Cyber audit not found');
    if (audit.status !== 'IN_PROGRESS') throw new BadRequestException('Audit is not in progress');

    return this.prisma.cyberAudit.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async findMetrics(auditId: string) {
    const audit = await this.prisma.cyberAudit.findUnique({ where: { id: auditId } });
    if (!audit) throw new NotFoundException('Cyber audit not found');
    return this.prisma.cyberAuditMetric.findMany({ where: { auditId }, orderBy: { areaNumber: 'asc', metricNumber: 'asc' } });
  }

  async updateMetric(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.cyberAuditMetric.update({ where: { id }, data: data as any });
    } catch {
      throw new NotFoundException('Audit metric not found');
    }
  }

  async findFindings(query: { page?: number; limit?: number; severity?: string; status?: string; auditId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;
    if (query.auditId) where.auditId = query.auditId;

    const [data, total] = await Promise.all([
      this.prisma.cyberAuditFinding.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.cyberAuditFinding.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findFinding(id: string) {
    const finding = await this.prisma.cyberAuditFinding.findUnique({ where: { id } });
    if (!finding) throw new NotFoundException('Cyber audit finding not found');
    return finding;
  }

  async createFinding(data: Record<string, unknown>) {
    return this.prisma.cyberAuditFinding.create({ data: data as any });
  }

  async updateFinding(id: string, data: Record<string, unknown>) {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (updateData.status === 'RESOLVED' && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      return await this.prisma.cyberAuditFinding.update({ where: { id }, data: updateData as any });
    } catch {
      throw new NotFoundException('Cyber audit finding not found');
    }
  }

  async removeFinding(id: string) {
    try {
      return await this.prisma.cyberAuditFinding.delete({ where: { id } });
    } catch {
      throw new NotFoundException('Cyber audit finding not found');
    }
  }

  async getChecklistTemplate() {
    return { success: true, data: INSA_CYBER_AUDIT_CHECKLIST };
  }

  async getSummary() {
    const [totalAudits, activeAudits, totalMetrics, compliantMetrics, nonCompliantMetrics, totalFindings, openFindings, criticalFindings, findingsBySeverity, findingsByArea] = await Promise.all([
      this.prisma.cyberAudit.count(),
      this.prisma.cyberAudit.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.cyberAuditMetric.count(),
      this.prisma.cyberAuditMetric.count({ where: { status: 'COMPLIANT' } }),
      this.prisma.cyberAuditMetric.count({ where: { status: 'NON_COMPLIANT' } }),
      this.prisma.cyberAuditFinding.count(),
      this.prisma.cyberAuditFinding.count({ where: { status: 'OPEN' } }),
      this.prisma.cyberAuditFinding.count({ where: { severity: 'CRITICAL', status: { not: 'RESOLVED' } } }),
      this.prisma.cyberAuditFinding.groupBy({ by: ['severity'], _count: { severity: true } }),
      this.prisma.cyberAuditMetric.groupBy({ by: ['areaNumber', 'areaName'], _count: { areaNumber: true } }),
    ]);

    return {
      totalAudits,
      activeAudits,
      totalMetrics,
      compliantMetrics,
      nonCompliantMetrics,
      totalFindings,
      openFindings,
      criticalFindings,
      complianceScore: totalMetrics > 0 ? Math.round((compliantMetrics / totalMetrics) * 100) : 0,
      findingsBySeverity: findingsBySeverity.map((item: any) => ({ severity: item.severity, count: item._count.severity })),
      findingsByArea: findingsByArea.map((item: any) => ({ areaNumber: item.areaNumber, areaName: item.areaName, count: item._count.areaNumber })),
    };
  }
}
