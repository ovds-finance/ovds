import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('disaster-fund')
@Controller('disaster-fund')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('disaster_fund:read')
export class DisasterFundController {
  @Get('contributions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List disaster fund contributions' })
  getContributions() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('contributions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create disaster fund contribution' })
  createContribution(@Body() body: any) {
    return { success: true, data: { ...body, id: 'df-' + Date.now() } };
  }

  @Get('allocations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List disaster fund allocations' })
  getAllocations() {
    return { success: true, data: [] };
  }

  @Post('allocations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create disaster fund allocation' })
  createAllocation(@Body() body: any) {
    return { success: true, data: { ...body, id: 'dfa-' + Date.now() } };
  }
}

