/**
 * LeavesController — real Prisma CRUD for leave requests.
 * Delegates to HrService (which has the full leave domain methods).
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PrismaService } from '../../common/prisma.service';
import { HrService } from '../hr.service';


function cid(h: Record<string, string | undefined>, req: any) {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('leaves')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('leaves:read_own')
export class LeavesController {
  constructor(
    private readonly hrService: HrService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all leave requests' })
  async getLeaves(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const companyId = cid(h, req);
    const result = await this.hrService.findLeaves({
      page: parseInt(page, 10),
      limit: parseInt(take, 10),
      companyId,
      employeeId,
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

  @Get('my-leaves')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user leave requests (linked to employee record)' })
  async getMyLeaves(@Request() req: any) {
    // Resolve the employee linked to this user
    const employee = await this.prisma.employee.findFirst({
      where: { userId: req?.user?.userId },
      select: { id: true },
    }).catch(() => null);
    if (!employee) return { success: true, data: [] };
    const result = await this.hrService.findLeaves({ employeeId: employee.id, limit: 50 });
    return { success: true, data: result.data };
  }

  @Get('balance/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get leave balance for an employee' })
  async getLeaveBalance(
    @Headers() h: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { leaveEntitlement: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // Count approved/pending leaves this year
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const [approved, pending] = await Promise.all([
      this.prisma.leave.count({ where: { employeeId: id, status: 'APPROVED', startDate: { gte: yearStart, lt: yearEnd } } }),
      this.prisma.leave.count({ where: { employeeId: id, status: 'PENDING' } }),
    ]);
    return {
      success: true,
      data: {
        employeeId: id,
        entitlement: employee.leaveEntitlement,
        used: approved,
        pending,
        balance: Math.max(0, employee.leaveEntitlement - approved),
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a leave request by ID' })
  async getLeave(@Param('id') id: string) {
    const data = await this.hrService.findLeave(id);
    return { success: true, data };
  }

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a leave request' })
  async applyLeave(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.hrService.createLeave({ ...body, status: 'PENDING' });
    return { success: true, data };
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a leave request' })
  async approveLeave(@Param('id') id: string, @Request() req: any) {
    const data = await this.hrService.approveLeave(id, req?.user?.userId ?? 'system');
    return { success: true, data };
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a leave request' })
  async rejectLeave(@Param('id') id: string, @Request() req: any, @Body() body: { reason?: string }) {
    const data = await this.hrService.rejectLeave(id, req?.user?.userId ?? 'system', body?.reason);
    return { success: true, data };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a leave request (before approval)' })
  async updateLeave(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.hrService.updateLeave(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel / delete a leave request' })
  async deleteLeave(@Param('id') id: string) {
    await this.hrService.deleteLeave(id);
    return { success: true };
  }
}
