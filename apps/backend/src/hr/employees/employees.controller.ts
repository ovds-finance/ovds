/**
 * EmployeesController — real Prisma-backed CRUD for employees.
 * Delegates to HrService which owns all employee DB operations.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { THROTTLE_TTL_MS, PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../common/prisma.service';
import { Throttle } from '../../common/throttle.decorator';
import { HrService } from '../hr.service';

function cid(h: Record<string, string | undefined>, req: any) {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('employees')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(
    private readonly hrService: HrService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all employees for the company' })
  async getEmployees(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const result = await this.hrService.findEmployees({
      page: parseInt(page, 10),
      limit: parseInt(take, 10),
      companyId,
      departmentId,
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

  @Get('payroll-status-summary')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payroll config status per employee' })
  async getPayrollStatusSummary(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where = companyId ? { companyId } : {};
    const data = await this.prisma.employee.groupBy({
      by: ['companyId'],
      where,
      _count: { _all: true },
    }).catch(() => []);
    // Return a per-department count so the dashboard can show configuration gaps
    const byDept = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      where,
      _count: { _all: true },
    }).catch(() => []);
    return { success: true, data: byDept };
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get employee by ID' })
  async getEmployee(@Param('id') id: string) {
    const data = await this.hrService.findEmployee(id);
    return { success: true, data };
  }

  @Post()
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  async createEmployee(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const data = await this.hrService.createEmployee({ ...body, ...(companyId ? { companyId } : {}) });
    return { success: true, data };
  }

  @Patch(':id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employee details' })
  async updateEmployee(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.hrService.updateEmployee(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete employee record' })
  async deleteEmployee(@Param('id') id: string) {
    await this.hrService.removeEmployee(id);
    return { success: true };
  }
}
