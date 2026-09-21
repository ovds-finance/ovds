/**
 * AttendanceController — real Prisma-backed attendance + reimbursement management.
 *
 * Main routes delegate to AttendanceService.
 * Reimbursement sub-routes delegate to HrService (ReimbursementClaim model).
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

import { AttendanceService } from './attendance.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('attendance')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('attendance:read')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly hrService: HrService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Attendance ────────────────────────────────────────────────────────────

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Biometric check-in' })
  checkIn(@Body() body: any) {
    return this.attendanceService.createCheckIn(body);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Biometric check-out' })
  checkOut(@Body() body: any) {
    return this.attendanceService.createCheckOut(body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List attendance records' })
  getAttendance(@Query() query: Record<string, unknown>) {
    return this.attendanceService.findAll(query);
  }

  @Get('report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Daily attendance report' })
  getReport() {
    return this.attendanceService.findAll({});
  }

  @Get('who-is-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Currently checked-in employees' })
  getWhoIsIn() {
    return this.attendanceService.findAll({ status: 'PRESENT' });
  }

  @Get('reports-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '7-day attendance stats' })
  getReportsSummary() {
    return this.attendanceService.findAll({});
  }

  @Patch('verify/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify attendance record' })
  verify(@Param('id') id: string) {
    return this.attendanceService.verify(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete attendance record' })
  deleteAttendance(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }

  // ── Reimbursements (ReimbursementClaim) ───────────────────────────────────
  // NOTE: static paths (rates, stats, bulk-status) MUST appear BEFORE :id routes.

  @Get('reimbursement/rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get per-diem reimbursement rates from settings' })
  async getReimbursementRates(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    // Per-diem rates are stored as SettingValue under key 'REIMBURSEMENT_RATES'
    const setting = await this.prisma.settingValue.findFirst({
      where: { key: 'REIMBURSEMENT_RATES', ...(companyId ? { companyId } : {}) } as any,
    }).catch(() => null);
    const rates = setting ? JSON.parse((setting as any).value ?? '[]') : [];
    return { success: true, data: rates };
  }

  @Get('reimbursement/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reimbursement statistics for the company' })
  async getReimbursementStats(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const [total, pending, approved, totalAmtAgg] = await Promise.all([
      this.prisma.reimbursementClaim.count({ where }),
      this.prisma.reimbursementClaim.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.reimbursementClaim.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.reimbursementClaim.aggregate({ where, _sum: { amount: true } }),
    ]);
    return {
      success: true,
      data: {
        total, pending, approved,
        totalEtb: Number(totalAmtAgg._sum.amount ?? 0),
      },
    };
  }

  @Patch('reimbursement/bulk-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk approve or reject reimbursement claims' })
  async bulkReimbursementStatus(
    @Request() req: any,
    @Body() body: { ids: string[]; status: string },
  ) {
    if (!body.ids?.length) return { success: true, data: { processed: 0 } };
    const approvedBy = req?.user?.userId ?? 'system';
    const updateData: any = { status: body.status };
    if (body.status === 'APPROVED') {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    await this.prisma.reimbursementClaim.updateMany({
      where: { id: { in: body.ids } },
      data: updateData,
    });
    return { success: true, data: { processed: body.ids.length } };
  }

  @Get('reimbursement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List reimbursement claims' })
  async getReimbursements(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const companyId = cid(h, req);
    const result = await this.hrService.findReimbursements({
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

  @Post('reimbursement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a reimbursement claim' })
  async createReimbursement(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req);
    const data = await this.hrService.createReimbursement({
      ...body,
      companyId,
      status: 'PENDING',
    });
    return { success: true, data };
  }

  @Get('reimbursement/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a reimbursement claim by ID' })
  async getReimbursement(@Param('id') id: string) {
    const data = await this.hrService.findReimbursement(id);
    return { success: true, data };
  }

  @Patch('reimbursement/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a reimbursement claim' })
  async updateReimbursementStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { status: string; reason?: string },
  ) {
    const approvedBy = req?.user?.userId ?? 'system';
    let data: any;
    if (body.status === 'APPROVED') {
      data = await this.hrService.approveReimbursement(id, approvedBy);
    } else {
      const existing = await this.hrService.findReimbursement(id);
      if (!existing) throw new NotFoundException(`Reimbursement ${id} not found`);
      data = await this.hrService.updateReimbursement(id, { status: body.status });
    }
    return { success: true, data };
  }

  @Patch('reimbursement/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a reimbursement claim' })
  async updateReimbursement(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.hrService.updateReimbursement(id, body);
    return { success: true, data };
  }

  @Delete('reimbursement/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a reimbursement claim' })
  async deleteReimbursement(@Param('id') id: string) {
    await this.hrService.deleteReimbursement(id);
    return { success: true };
  }
}
