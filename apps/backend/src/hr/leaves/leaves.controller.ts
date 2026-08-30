import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('leaves')
@Controller('leaves')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('leaves:read_own')
export class LeavesController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all leave requests' })
  getLeaves() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Get('my-leaves')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user leave requests' })
  getMyLeaves() {
    return { success: true, data: [] };
  }

  @Get('balance/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get leave balance for employee' })
  getLeaveBalance(@Param('id') id: string) {
    return { success: true, data: { id, balance: 22, used: 0, pending: 0 } };
  }

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit leave request' })
  applyLeave(@Body() body: any) {
    return { success: true, data: { ...body, id: 'leave-' + Date.now() } };
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve leave request' })
  approveLeave(@Param('id') id: string) {
    return { success: true };
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject leave request' })
  rejectLeave(@Param('id') id: string) {
    return { success: true };
  }
}

