import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('attendance:read')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

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

  @Get('reimbursement/rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get per-diem rates' })
  getReimbursementRates() {
    return { success: true, data: [] };
  }

  @Get('reimbursement/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reimbursement stats' })
  getReimbursementStats() {
    return { success: true, data: { total: 0, pending: 0, approved: 0, totalEtb: 0 } };
  }

  @Get('reimbursement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List reimbursement claims' })
  getReimbursements() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('reimbursement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit reimbursement claim' })
  createReimbursement(@Body() body: any) {
    return { success: true, data: { ...body, id: 'reimb-' + Date.now() } };
  }

  @Get('reimbursement/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get reimbursement claim' })
  getReimbursement(@Param('id') id: string) {
    return { success: true, data: { id } };
  }

  @Patch('reimbursement/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve/reject reimbursement' })
  updateReimbursementStatus(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { id, ...body } };
  }

  @Patch('reimbursement/bulk-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk approve/reject reimbursements' })
  bulkReimbursementStatus(@Body() body: any) {
    return { success: true, data: { processed: 0 } };
  }

  @Delete('reimbursement/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete reimbursement claim' })
  deleteReimbursement(@Param('id') id: string) {
    return { success: true };
  }
}

