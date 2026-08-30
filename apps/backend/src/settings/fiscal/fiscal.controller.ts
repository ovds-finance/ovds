import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('fiscal')
@Controller('fiscal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class FiscalController {
  @Get('periods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List fiscal periods' })
  getPeriods() {
    return { success: true, data: [] };
  }

  @Post('periods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create fiscal period' })
  createPeriod(@Body() body: any) {
    return { success: true, data: { ...body, id: 'fp-' + Date.now() } };
  }

  @Patch('periods/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close fiscal period' })
  closePeriod(@Param('id') id: string) {
    return { success: true };
  }
}

