import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Headers, Request, UseGuards, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

import { AttendanceService } from './attendance/attendance.service';
import { HrService } from './hr.service';

@ApiTags('hr')
@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class HrController {
  constructor(
    private readonly hrService: HrService,
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('employees')
  @Permissions('employees:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List employees' })
  listEmployees(@Query() query: Record<string, unknown>) {
    return this.hrService.findEmployees(query);
  }

  @Get('employees/:id')
  @Permissions('employees:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get employee by ID' })
  getEmployee(@Param('id') id: string) {
    return this.hrService.findEmployee(id);
  }

  @Post('employees')
  @Permissions('employees:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create employee' })
  createEmployee(@Body() data: Record<string, unknown>) {
    return this.hrService.createEmployee(data);
  }

  @Put('employees/:id')
  @Permissions('employees:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employee' })
  updateEmployee(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.hrService.updateEmployee(id, data);
  }

  @Delete('employees/:id')
  @Permissions('employees:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete employee' })
  removeEmployee(@Param('id') id: string) {
    return this.hrService.removeEmployee(id);
  }

  @Get('departments')
  @Permissions('employees:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List departments' })
  listDepartments(@Query() query: Record<string, unknown>) {
    return this.hrService.findDepartments(query);
  }

  @Get('departments/:id')
  @Permissions('employees:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get department by ID' })
  getDepartment(@Param('id') id: string) {
    return this.hrService.findDepartment(id);
  }

  @Post('departments')
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create department' })
  createDepartment(@Body() data: Record<string, unknown>) {
    return this.hrService.createDepartment(data);
  }

  @Put('departments/:id')
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.hrService.updateDepartment(id, data);
  }

  @Delete('departments/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete department' })
  removeDepartment(@Param('id') id: string) {
    return this.hrService.removeDepartment(id);
  }

  @Post('attendance/check-in')
  @Permissions('attendance:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Biometric check-in' })
  checkIn(@Body() body: { employeeId: string; method?: string; latitude?: number; longitude?: number; companyId?: string }) {
    return this.attendanceService.createCheckIn(body);
  }

  @Post('attendance/check-out')
  @Permissions('attendance:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Biometric check-out' })
  checkOut(@Body() body: { employeeId: string; method?: string }) {
    return this.attendanceService.createCheckOut(body);
  }

  @Get('attendance')
  @Permissions('attendance:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List attendance records' })
  listAttendance(@Query() query: Record<string, unknown>) {
    return this.attendanceService.findAll(query);
  }

  @Patch('attendance/verify/:id')
  @Permissions('attendance:verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify attendance record' })
  verifyAttendance(@Param('id') id: string) {
    return this.attendanceService.verify(id);
  }

  @Delete('attendance/:id')
  @Permissions('attendance:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete attendance record' })
  removeAttendance(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }

  @Post('gratuity/calculate')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate gratuity entitlement for an employee' })
  async calculateGratuity(
    @Body() body: { employeeId: string; asOfDate?: string },
    @Request() req: any,
  ) {
    if (!body.employeeId) throw new BadRequestException('employeeId is required');
    const employee = await this.prisma.employee.findUnique({
      where: { id: body.employeeId },
      select: {
        id: true, firstName: true, lastName: true,
        baseSalary: true, createdAt: true,
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const asOf = body.asOfDate ? new Date(body.asOfDate) : new Date();
    const serviceYears = (asOf.getTime() - employee.createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const baseSalary = Number(employee.baseSalary ?? 0);

    // Ethiopian Labour Proclamation No. 1156/2019 — gratuity formula:
    // < 1 year: 0  |  1–3 yrs: 1 month/yr  |  3–10 yrs: 1.5 months/yr  |  10+ yrs: 2 months/yr
    let multiplier = 0;
    if (serviceYears >= 10)     multiplier = 2.0;
    else if (serviceYears >= 3) multiplier = 1.5;
    else if (serviceYears >= 1) multiplier = 1.0;

    const gratuityAmount = Math.round(baseSalary * multiplier * serviceYears * 100) / 100;

    return {
      success: true,
      data: {
        employeeId: body.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        baseSalary,
        serviceYears: Math.round(serviceYears * 100) / 100,
        multiplier,
        gratuityAmount,
        asOf: asOf.toISOString(),
      },
    };
  }

  @Get('gratuity')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List gratuity records' })
  async listGratuity(@Request() req: any) {
    const companyId = req?.user?.companyId;
    const where = companyId ? { employee: { companyId } } : {};
    const data = await this.prisma.gratuityRecord.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);
    return { success: true, data };
  }

  @Post('gratuity')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a gratuity record' })
  async createGratuity(@Body() body: Record<string, unknown>, @Request() req: any) {
    if (!body.employeeId) throw new BadRequestException('employeeId is required');
    const data = await this.prisma.gratuityRecord.create({ data: body as any });
    return { success: true, data };
  }

  @Patch('gratuity/:id')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a gratuity record' })
  async updateGratuity(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.gratuityRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Gratuity record ${id} not found`);
    const data = await this.prisma.gratuityRecord.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Post('gratuity/:id/mark-paid')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a gratuity record as paid' })
  async markGratuityPaid(
    @Param('id') id: string,
    @Body() body: { paidAt?: string; paidBy?: string; paymentRef?: string },
    @Request() req: any,
  ) {
    const existing = await this.prisma.gratuityRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Gratuity record ${id} not found`);
    const data = await this.prisma.gratuityRecord.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        paidBy: body.paidBy ?? req?.user?.userId ?? null,
      } as any,
    });
    return { success: true, data };
  }
}
