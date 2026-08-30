import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('procurement')
@Controller('procurement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('bills:read')
export class ProcurementController {
  @Get('requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List procurement requests' })
  getRequests() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create procurement request' })
  createRequest(@Body() body: any) {
    return { success: true, data: { ...body, id: 'pr-' + Date.now() } };
  }

  @Patch('requests/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update procurement request' })
  updateRequest(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Get('rfqs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List RFQs' })
  getRfqs() {
    return { success: true, data: [] };
  }

  @Post('rfqs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create RFQ' })
  createRfq(@Body() body: any) {
    return { success: true, data: { ...body, id: 'rfq-' + Date.now() } };
  }
}

