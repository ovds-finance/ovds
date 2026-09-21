/**
 * PayrollController — real Prisma-backed payroll record management.
 * Delegates to HrService for all DB operations.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { THROTTLE_TTL_MS, PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { CheckPolicy } from '../../auth/decorators/check-policy.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccessPolicyGuard } from '../../auth/guards/access-policy.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../common/prisma.service';
import { Throttle } from '../../common/throttle.decorator';
import { HrService } from '../hr.service';

function cid(h: Record<string, string | undefined>, req: any) {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('payroll')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard, AccessPolicyGuard)
export class PayrollController {
  constructor(
    private readonly hrService: HrService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List payroll records for the company' })
  async getPayroll(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const companyId = cid(h, req);
    const result = await this.hrService.findPayrollRecords({
      page: parseInt(page, 10),
      limit: parseInt(take, 10),
      companyId,
      employeeId,
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      status,
    });
    return {
      success: true,
      data: {
        data: result.data,
        pagination: { total: result.total, page: result.page, take: result.limit, pages: result.totalPages },
      },
    };
  }

  @Get('dashboard-stats')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payroll dashboard statistics' })
  async getDashboardStats(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const now = new Date();
    const where = companyId ? { companyId } : {};
    const [currentMonth, employeeCount] = await Promise.all([
      this.prisma.payrollRecord.aggregate({
        where: { ...where, year: now.getFullYear(), month: now.getMonth() + 1 },
        _sum: { netPay: true },
        _count: true,
      }).catch(() => ({ _sum: { netPay: null }, _count: 0 })),
      this.prisma.employee.count({ where }).catch(() => 0),
    ]);
    return {
      success: true,
      data: {
        currentMonthTotal: Number(currentMonth._sum.netPay ?? 0),
        currentMonthCount: currentMonth._count,
        employees: employeeCount,
      },
    };
  }

  @Get('workflow-status')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payroll workflow status summary' })
  async getWorkflowStatus(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where = companyId ? { companyId } : {};
    const byStatus = await this.prisma.payrollRecord.groupBy({
      by: ['status'],
      where,
      _count: true,
    }).catch(() => []);
    return { success: true, data: byStatus };
  }

  @Get('overtime-summary')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Overtime summary' })
  async getOvertimeSummary(@Headers() h: Record<string, string | undefined>, @Request() req: any) {
    const companyId = cid(h, req);
    const where = companyId ? { companyId } : {};
    const data = await this.prisma.payrollRecord.aggregate({
      where,
      _sum: { otPay: true, otHours: true },
    }).catch(() => ({ _sum: { otPay: null, otHours: null } }));
    return { success: true, data: { totalOtPay: Number(data._sum.otPay ?? 0), totalOtHours: Number(data._sum.otHours ?? 0) } };
  }

  @Get('employee-history/:employeeId')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payroll history for an employee' })
  async getEmployeeHistory(@Param('employeeId') employeeId: string) {
    const result = await this.hrService.findPayrollRecords({ employeeId, limit: 48 });
    return { success: true, data: result.data };
  }

  @Get('export-csv/:year/:month')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export payroll as CSV for a month' })
  async exportCsv(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const companyId = cid(h, req);
    const where = {
      ...(companyId ? { companyId } : {}),
      year: parseInt(year, 10),
      month: parseInt(month, 10),
    };
    const records = await this.prisma.payrollRecord.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true, bankName: true, accountNumber: true } } },
      orderBy: [{ employee: { lastName: 'asc' } }],
    }).catch(() => []);
    const header = 'employeeId,name,baseSalary,grossPay,incomeTax,employeePension,loanDeduction,totalDeductions,netPay,status';
    const rows = records.map((r: any) =>
      [
        r.employee?.employeeId ?? '',
        `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim(),
        r.basicSalary, r.grossPay, r.incomeTax, r.employeePension,
        r.loanDeduction, r.totalDeductions, r.netPay, r.status,
      ].join(','),
    );
    return { success: true, data: [header, ...rows].join('\n') };
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a payroll record by ID' })
  async getPayrollRecord(@Param('id') id: string) {
    const data = await this.hrService.findPayrollRecord(id);
    return { success: true, data };
  }

  @Post()
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payroll record' })
  async createPayrollRecord(@Body() body: Record<string, unknown>) {
    const data = await this.hrService.createPayrollRecord(body);
    return { success: true, data };
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @Permissions('payroll:approve')
  @CheckPolicy('payroll:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a payroll record' })
  async approvePayrollRecord(@Param('id') id: string, @Request() req: any) {
    const data = await this.hrService.approvePayrollRecord(id, req?.user?.userId ?? 'system');
    return { success: true, data };
  }

  @Patch(':id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a payroll record' })
  async updatePayrollRecord(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.hrService.updatePayrollRecord(id, body);
    return { success: true, data };
  }
}
