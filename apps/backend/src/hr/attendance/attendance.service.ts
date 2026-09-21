import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; employeeId?: string; companyId?: string; date?: string; status?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.companyId) {
      const employee = await this.prisma.employee.findFirst({ where: { companyId: query.companyId }, select: { id: true } });
      if (employee) where.employeeId = employee.id;
    }
    if (query.date) {
      const date = new Date(query.date);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      where.checkIn = { gte: date, lt: next };
    }
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({ where, skip, take: limit, orderBy: { checkIn: 'desc' }, include: { employee: { select: { firstName: true, lastName: true } } } }),
      this.prisma.attendance.count({ where }),
    ]);

    const records = data.map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      employeeName: `${a.employee?.firstName ?? ''} ${a.employee?.lastName ?? ''}`.trim() || a.employeeId,
      checkIn: a.checkIn.toISOString(),
      checkOut: a.checkOut?.toISOString() ?? null,
      method: a.method,
      status: a.status,
      overtimeHours: a.overtimeHours,
      verified: a.verified,
      createdAt: a.createdAt.toISOString(),
    }));

    return { data: records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const record = await this.prisma.attendance.findUnique({ where: { id }, include: { employee: true } });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async createCheckIn(data: { employeeId: string; method?: string; latitude?: number; longitude?: number; companyId?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        checkIn: { gte: today, lt: tomorrow },
      },
    });

    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    return this.prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        method: (data.method as any) ?? 'MANUAL',
        status: 'PRESENT',
        latitude: data.latitude,
        longitude: data.longitude,
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  async createCheckOut(data: { employeeId: string; method?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record = await this.prisma.attendance.findFirst({
      where: {
        employeeId: data.employeeId,
        checkIn: { gte: today, lt: tomorrow },
        checkOut: null,
      },
    });

    if (!record) {
      throw new BadRequestException('No active check-in found');
    }

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: new Date(), method: (data.method as any) ?? 'MANUAL' },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
  }

  async verify(id: string) {
    try {
      return await this.prisma.attendance.update({
        where: { id },
        data: { verified: true },
      });
    } catch (e) {
      this.logger.warn(`Failed to verify attendance record ${id}: ${e instanceof Error ? e.message : String(e)}`);
      throw new NotFoundException('Attendance record not found');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.attendance.delete({ where: { id } });
    } catch (e) {
      this.logger.warn(`Failed to delete attendance record ${id}: ${e instanceof Error ? e.message : String(e)}`);
      throw new NotFoundException('Attendance record not found');
    }
  }
}

