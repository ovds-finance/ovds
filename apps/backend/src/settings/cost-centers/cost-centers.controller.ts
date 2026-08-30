import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('cost-centers')
@Controller('cost-centers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ovds:read')
export class CostCentersController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List cost centers' })
  getCostCenters() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create cost center' })
  createCostCenter(@Body() body: any) {
    return { success: true, data: { ...body, id: 'cc-' + Date.now() } };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cost center' })
  updateCostCenter(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete cost center' })
  deleteCostCenter(@Param('id') id: string) {
    return { success: true };
  }
}

