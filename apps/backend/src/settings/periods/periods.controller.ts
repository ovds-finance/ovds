import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('accounting')
@Controller('periods')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('period_close:read')
export class PeriodsController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List accounting periods' })
  getPeriods() {
    return { success: true, data: [] };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create accounting period' })
  createPeriod(@Body() body: any) {
    return { success: true, data: { ...body, id: 'per-' + Date.now() } };
  }

  @Get('locked')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List locked periods' })
  getLockedPeriods() {
    return { success: true, data: [] };
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock accounting period' })
  lockPeriod(@Param('id') id: string) {
    return { success: true };
  }

  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlock accounting period' })
  unlockPeriod(@Param('id') id: string) {
    return { success: true };
  }
}

