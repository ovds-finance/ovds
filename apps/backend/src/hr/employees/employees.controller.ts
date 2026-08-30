import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Throttle } from '../../common/throttle.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT, AUTH_REGISTER_THROTTLE_LIMIT, PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  @Get()
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all employees' })
  getEmployees(@Query() query: any) {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post()
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new employee' })
  createEmployee(@Body() body: any) {
    return { success: true, data: { ...body, id: 'emp-' + Date.now() } };
  }

  @Get('payroll-status-summary')
  @Roles('ADMIN', 'HR', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payroll config status' })
  getPayrollStatusSummary() {
    return { success: true, data: [] };
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get employee by ID' })
  getEmployee(@Param('id') id: string) {
    return { success: true, data: { id } };
  }

  @Patch(':id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employee details' })
  updateEmployee(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete employee record' })
  deleteEmployee(@Param('id') id: string) {
    return { success: true };
  }
}

