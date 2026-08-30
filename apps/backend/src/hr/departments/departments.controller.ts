import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('departments')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  @Get()
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all departments' })
  getDepartments() {
    return { success: true, data: [] };
  }

  @Post()
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create department' })
  createDepartment(@Body() body: any) {
    return { success: true, data: { ...body, id: 'dept-' + Date.now() } };
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete department' })
  deleteDepartment(@Param('id') id: string) {
    return { success: true };
  }
}

