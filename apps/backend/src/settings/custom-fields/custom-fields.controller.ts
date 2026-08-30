import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('custom-fields')
@Controller('custom-fields')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('settings:read')
export class CustomFieldsController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List custom fields' })
  getCustomFields() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create custom field' })
  createCustomField(@Body() body: any) {
    return { success: true, data: { ...body, id: 'cf-' + Date.now() } };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update custom field' })
  updateCustomField(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete custom field' })
  deleteCustomField(@Param('id') id: string) {
    return { success: true };
  }
}

