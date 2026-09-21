import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { AccreditationService } from './accreditation.service';

@ApiTags('accreditation')
@Controller('accreditation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccreditationController {
  constructor(private readonly accreditationService: AccreditationService) {}

  @Get('checklists')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List accreditation checklists' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  listChecklists(@Query() query: Record<string, unknown>) {
    return this.accreditationService.findChecklists(query);
  }

  @Get('checklists/:id')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get accreditation checklist by ID' })
  @ApiParam({ name: 'id' })
  getChecklist(@Param('id') id: string) {
    return this.accreditationService.findChecklist(id);
  }

  @Post('checklists')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create accreditation checklist' })
  createChecklist(@Body() data: Record<string, unknown>) {
    return this.accreditationService.createChecklist(data);
  }

  @Put('checklists/:id')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update accreditation checklist' })
  @ApiParam({ name: 'id' })
  updateChecklist(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.accreditationService.updateChecklist(id, data);
  }

  @Delete('checklists/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete accreditation checklist' })
  @ApiParam({ name: 'id' })
  removeChecklist(@Param('id') id: string) {
    return this.accreditationService.removeChecklist(id);
  }

  @Get('checklists/:id/items')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List items for an accreditation checklist' })
  @ApiParam({ name: 'id' })
  listItems(@Param('id') checklistId: string) {
    return this.accreditationService.findItems(checklistId);
  }

  @Put('items/:id')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update accreditation item' })
  @ApiParam({ name: 'id' })
  updateItem(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.accreditationService.updateItem(id, data);
  }

  @Post('items/bulk-update')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update accreditation items' })
  bulkUpdateItems(@Body() data: { items: Array<{ id: string; status: string; comment?: string }> }) {
    return this.accreditationService.bulkUpdateItems(data.items);
  }

  @Get('template')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get accreditation checklist template' })
  getTemplate() {
    return this.accreditationService.getTemplate();
  }

  @Get('summary')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get accreditation summary statistics' })
  getSummary() {
    return this.accreditationService.getSummary();
  }
}

