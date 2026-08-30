import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async findEmployees(query: { page?: number; limit?: number; departmentId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.departmentId) where.departmentId = query.departmentId;

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({ where, skip, take: limit, orderBy: { firstName: 'asc' } }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findEmployee(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async createEmployee(data: Record<string, unknown>) {
    return this.prisma.employee.create({ data: data as any });
  }

  async updateEmployee(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.employee.update({ where: { id }, data: data as any });
    } catch (e) {
      console.error(`[HR] Failed to update employee ${id}:`, e);
      throw new NotFoundException('Employee not found');
    }
  }

  async removeEmployee(id: string) {
    try {
      return await this.prisma.employee.delete({ where: { id } });
    } catch (e) {
      console.error(`[HR] Failed to delete employee ${id}:`, e);
      throw new NotFoundException('Employee not found');
    }
  }

  async findDepartments(query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.department.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findDepartment(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async createDepartment(data: Record<string, unknown>) {
    return this.prisma.department.create({ data: data as any });
  }

  async updateDepartment(id: string, data: Record<string, unknown>) {
    try {
      return await this.prisma.department.update({ where: { id }, data: data as any });
    } catch (e) {
      console.error(`[HR] Failed to update department ${id}:`, e);
      throw new NotFoundException('Department not found');
    }
  }

  async removeDepartment(id: string) {
    try {
      return await this.prisma.department.delete({ where: { id } });
    } catch (e) {
      console.error(`[HR] Failed to delete department ${id}:`, e);
      throw new NotFoundException('Department not found');
    }
  }
}
