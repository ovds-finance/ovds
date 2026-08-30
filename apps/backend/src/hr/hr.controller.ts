import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { AttendanceService } from './attendance/attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('hr')
@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class HrController {
  constructor(private readonly hrService: HrService, private readonly attendanceService: AttendanceService) {}

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
  @ApiOperation({ summary: 'Calculate gratuity' })
  calculateGratuity(@Body() body: any) {
    return { success: true, data: { ...body, id: 'grat-' + Date.now() } };
  }

  @Post('gratuity')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create gratuity record' })
  createGratuity(@Body() body: any) {
    return { success: true, data: { ...body, id: 'grat-' + Date.now() } };
  }

  @Post('gratuity/:id/mark-paid')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark gratuity as paid' })
  markGratuityPaid(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { id, ...body } };
  }
}
