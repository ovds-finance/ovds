import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class BiometricsService {
  private readonly logger = new Logger(BiometricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; employeeId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.employeeId) where.employeeId = query.employeeId;

    const [data, total] = await Promise.all([
      this.prisma.biometricData.findMany({ where, skip, take: limit, orderBy: { registeredAt: 'desc' } }),
      this.prisma.biometricData.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const record = await this.prisma.biometricData.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Biometric record not found');
    return record;
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.biometricData.findMany({
      where: { employeeId },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async create(data: { type: string; template: string; employeeId: string }) {
    return this.prisma.biometricData.create({
      data: {
        type: data.type as any,
        template: data.template,
        employeeId: data.employeeId,
      },
    });
  }

  async update(id: string, data: { type?: string; template?: string }) {
    try {
      return await this.prisma.biometricData.update({
        where: { id },
        data: {
          ...(data.type && { type: data.type as any }),
          ...(data.template && { template: data.template }),
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to update biometric record ${id}: ${e instanceof Error ? e.message : String(e)}`);
      throw new NotFoundException('Biometric record not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.biometricData.delete({ where: { id } });
    } catch (e) {
      this.logger.warn(`Failed to delete biometric record ${id}: ${e instanceof Error ? e.message : String(e)}`);
      throw new NotFoundException('Biometric record not found');
    }
  }
}

