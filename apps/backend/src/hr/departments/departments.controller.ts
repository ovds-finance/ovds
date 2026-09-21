/**
 * DepartmentsController — real Prisma-backed CRUD for departments.
 * Delegates to HrService which owns all department DB operations.
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { HrService } from '../hr.service';


function cid(h: Record<string, string | undefined>, req: any) {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('departments')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly hrService: HrService) {}

  @Get()
  @Roles('ADMIN', 'HR', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all departments for the company' })
  async getDepartments(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
  ) {
    const companyId = cid(h, req);
    const result = await this.hrService.findDepartments({
      page: parseInt(page, 10),
      limit: parseInt(take, 10),
      companyId,
    });
    return {
      success: true,
      data: {
        data: result.data,
        pagination: { total: result.total, page: result.page, take: result.limit, pages: result.totalPages },
      },
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'HR', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a department by ID' })
  async getDepartment(@Param('id') id: string) {
    const data = await this.hrService.findDepartment(id);
    return { success: true, data };
  }

  @Post()
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a department' })
  async createDepartment(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const data = await this.hrService.createDepartment({ ...body, ...(companyId ? { companyId } : {}) });
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a department' })
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.hrService.updateDepartment(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a department' })
  async deleteDepartment(@Param('id') id: string) {
    await this.hrService.removeDepartment(id);
    return { success: true };
  }
}
