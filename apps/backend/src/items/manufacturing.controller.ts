import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('manufacturing')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('items:read')
export class ManufacturingController {
  @Get('production-orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List production orders' })
  getProductionOrders() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('production-orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create production order' })
  createProductionOrder(@Body() body: any) {
    return { success: true, data: { ...body, id: 'po-' + Date.now() } };
  }

  @Patch('production-orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update production order' })
  updateProductionOrder(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Get('boms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bills of materials' })
  getBoms() {
    return { success: true, data: [] };
  }

  @Post('boms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bill of materials' })
  createBom(@Body() body: any) {
    return { success: true, data: { ...body, id: 'bom-' + Date.now() } };
  }
}

