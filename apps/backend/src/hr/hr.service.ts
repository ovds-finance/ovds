/**
 * HrService — Prisma-backed HR domain operations.
 *
 * Covers: employees, departments, payroll records, leaves, attendance,
 * and reimbursement claims. All error logging uses NestJS Logger, not
 * console.error, so output is properly formatted and filterable.
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);
  constructor(private readonly prisma: PrismaService) {}

  // ── Employees ──────────────────────────────────────────────────────────────

  async findEmployees(query: {
    page?: number; limit?: number;
    departmentId?: string; companyId?: string; status?: string;
  }) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.companyId)    where.companyId    = query.companyId;

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
      this.logger.warn(`Failed to update employee ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Employee not found');
    }
  }

  async removeEmployee(id: string) {
    try {
      return await this.prisma.employee.delete({ where: { id } });
    } catch (e) {
      this.logger.warn(`Failed to delete employee ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Employee not found');
    }
  }

  // ── Departments ────────────────────────────────────────────────────────────

  async findDepartments(query: { page?: number; limit?: number; companyId?: string }) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip  = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (query.companyId) where.companyId = query.companyId;

    const [data, total] = await Promise.all([
      this.prisma.department.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.department.count({ where }),
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
      this.logger.warn(`Failed to update department ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Department not found');
    }
  }

  async removeDepartment(id: string) {
    try {
      return await this.prisma.department.delete({ where: { id } });
    } catch (e) {
      this.logger.warn(`Failed to delete department ${id}: ${(e as Error).message}`);
      throw new NotFoundException('Department not found');
    }
  }

  // ── Payroll ────────────────────────────────────────────────────────────────

  async findPayrollRecords(query: {
    page?: number; limit?: number;
    companyId?: string; employeeId?: string;
    year?: number; month?: number; status?: string;
  }) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.companyId)  where.companyId  = query.companyId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.year)       where.year       = Number(query.year);
    if (query.month)      where.month      = Number(query.month);
    if (query.status)     where.status     = query.status;

    const [data, total] = await Promise.all([
      this.prisma.payrollRecord.findMany({
        where, skip, take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
      }),
      this.prisma.payrollRecord.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPayrollRecord(id: string) {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!record) throw new NotFoundException('Payroll record not found');
    return record;
  }

  async createPayrollRecord(data: Record<string, unknown>) {
    return this.prisma.payrollRecord.create({ data: data as any });
  }

  async updatePayrollRecord(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.payrollRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payroll record not found');
    return this.prisma.payrollRecord.update({ where: { id }, data: data as any });
  }

  async approvePayrollRecord(id: string, approvedBy: string) {
    const existing = await this.prisma.payrollRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Payroll record not found');
    return this.prisma.payrollRecord.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  // ── Leaves ─────────────────────────────────────────────────────────────────

  async findLeaves(query: {
    page?: number; limit?: number;
    companyId?: string; employeeId?: string; status?: string; type?: string;
  }) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.companyId)  where.employee  = { companyId: query.companyId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status)     where.status     = query.status;
    if (query.type)       where.type       = query.type;

    const [data, total] = await Promise.all([
      this.prisma.leave.findMany({
        where, skip, take: limit,
        orderBy: { startDate: 'desc' },
        include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
      }),
      this.prisma.leave.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLeave(id: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id }, include: { employee: true } });
    if (!leave) throw new NotFoundException('Leave record not found');
    return leave;
  }

  async createLeave(data: Record<string, unknown>) {
    return this.prisma.leave.create({ data: data as any });
  }

  async updateLeave(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.leave.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leave record not found');
    return this.prisma.leave.update({ where: { id }, data: data as any });
  }

  async approveLeave(id: string, approvedBy: string) {
    const existing = await this.prisma.leave.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leave record not found');
    return this.prisma.leave.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy } as any,
    });
  }

  async rejectLeave(id: string, rejectedBy: string, reason?: string) {
    const existing = await this.prisma.leave.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leave record not found');
    return this.prisma.leave.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: rejectedBy } as any,
    });
  }

  async deleteLeave(id: string) {
    const existing = await this.prisma.leave.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Leave record not found');
    return this.prisma.leave.delete({ where: { id } });
  }

  // ── Attendance ─────────────────────────────────────────────────────────────

  async findAttendance(query: {
    page?: number; limit?: number;
    companyId?: string; employeeId?: string;
    dateFrom?: string; dateTo?: string;
  }) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.companyId)  where.employee   = { companyId: query.companyId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.dateFrom || query.dateTo) {
      const checkIn: Record<string, unknown> = {};
      if (query.dateFrom) checkIn.gte = new Date(query.dateFrom);
      if (query.dateTo)   checkIn.lte = new Date(query.dateTo);
      where.checkIn = checkIn;
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where, skip, take: limit,
        orderBy: { checkIn: 'desc' },
        include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
      }),
      this.prisma.attendance.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAttendanceRecord(id: string) {
    const record = await this.prisma.attendance.findUnique({ where: { id }, include: { employee: true } });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async createAttendance(data: Record<string, unknown>) {
    return this.prisma.attendance.create({ data: data as any });
  }

  async updateAttendance(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');
    return this.prisma.attendance.update({ where: { id }, data: data as any });
  }

  async deleteAttendance(id: string) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');
    return this.prisma.attendance.delete({ where: { id } });
  }

  // ── Reimbursements ─────────────────────────────────────────────────────────

  async findReimbursements(query: {
    page?: number; limit?: number;
    companyId?: string; employeeId?: string; status?: string;
  }) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || PAGINATION_DEFAULT_LIMIT;
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.companyId)  where.companyId  = query.companyId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status)     where.status     = query.status;

    const [data, total] = await Promise.all([
      this.prisma.reimbursementClaim.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
      }),
      this.prisma.reimbursementClaim.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findReimbursement(id: string) {
    const claim = await this.prisma.reimbursementClaim.findUnique({ where: { id }, include: { employee: true } });
    if (!claim) throw new NotFoundException('Reimbursement claim not found');
    return claim;
  }

  async createReimbursement(data: Record<string, unknown>) {
    return this.prisma.reimbursementClaim.create({ data: data as any });
  }

  async updateReimbursement(id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.reimbursementClaim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reimbursement claim not found');
    return this.prisma.reimbursementClaim.update({ where: { id }, data: data as any });
  }

  async approveReimbursement(id: string, approvedBy: string) {
    const existing = await this.prisma.reimbursementClaim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reimbursement claim not found');
    return this.prisma.reimbursementClaim.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  async deleteReimbursement(id: string) {
    const existing = await this.prisma.reimbursementClaim.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reimbursement claim not found');
    return this.prisma.reimbursementClaim.delete({ where: { id } });
  }
}
