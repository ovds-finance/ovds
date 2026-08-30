import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async findSourceSystems() {
    return this.prisma.eimsSourceSystem.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findSourceSystem(id: string) {
    const system = await this.prisma.eimsSourceSystem.findUnique({ where: { id } });
    if (!system) throw new NotFoundException('Source system not found');
    return system;
  }

  async createSourceSystem(data: Record<string, unknown>) {
    return this.prisma.eimsSourceSystem.create({ data: data as any });
  }

  async updateSourceSystem(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.eimsSourceSystem.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Source system not found');
    }
  }

  async removeSourceSystem(id: string) {
    try {
      return await this.prisma.eimsSourceSystem.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Source system not found');
    }
  }

  async findCertificates() {
    return this.prisma.eimsCertificate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findCertificate(id: string) {
    const cert = await this.prisma.eimsCertificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async createCertificate(data: Record<string, unknown>) {
    return this.prisma.eimsCertificate.create({ data: data as any });
  }

  async updateCertificate(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.eimsCertificate.update({ where: { id }, data: data as any });
    } catch (e) {
      throw new NotFoundException('Certificate not found');
    }
  }

  async removeCertificate(id: string) {
    try {
      return await this.prisma.eimsCertificate.delete({ where: { id } });
    } catch (e) {
      throw new NotFoundException('Certificate not found');
    }
  }

  async findRegistrations(query: { page?: number; limit?: number; invoiceId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.invoiceId) where.invoiceId = query.invoiceId;

    const [data, total] = await Promise.all([
      this.prisma.eimsRegistration.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.eimsRegistration.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findRegistration(id: string) {
    const reg = await this.prisma.eimsRegistration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Registration not found');
    return reg;
  }

  async createRegistration(data: Record<string, unknown>) {
    return this.prisma.eimsRegistration.create({ data: data as any });
  }

  async cancelRegistration(id: string, reason: string) {
    return this.prisma.eimsRegistration.update({
      where: { id },
      data: { status: 'CANCELLED', reason },
    });
  }

  async verifyRegistration(id: string) {
    const reg = await this.prisma.eimsRegistration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Registration not found');
    return { success: true, status: reg.status, irn: reg.irn };
  }

  async findReceipts(query: { page?: number; limit?: number; type?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      this.prisma.eimsReceipt.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.eimsReceipt.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createReceipt(data: Record<string, unknown>) {
    return this.prisma.eimsReceipt.create({ data: data as any });
  }

  async findBulkJobs(query: { page?: number; limit?: number; type?: string; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.eimsBulkJob.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.eimsBulkJob.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createBulkJob(data: Record<string, unknown>) {
    return this.prisma.eimsBulkJob.create({ data: data as any });
  }
}
