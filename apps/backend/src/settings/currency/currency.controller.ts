import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('currency')
@Controller('currency')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class CurrencyController {
  @Get('rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List currency rates' })
  getRates() {
    return { success: true, data: [] };
  }

  @Post('rates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create currency rate' })
  createRate(@Body() body: any) {
    return { success: true, data: { ...body, id: 'rate-' + Date.now() } };
  }

  @Patch('rates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update currency rate' })
  updateRate(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Get('fx')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get FX rates' })
  getFx() {
    return { success: true, data: [] };
  }
}

