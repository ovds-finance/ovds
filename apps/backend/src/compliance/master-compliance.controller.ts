import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MasterComplianceService } from './master-compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('master-compliance')
@Controller('master-compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterComplianceController {
  constructor(private readonly masterComplianceService: MasterComplianceService) {}

  @Get('checklists')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List master compliance checklists' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  listChecklists(@Query() query: Record<string, unknown>) {
    return this.masterComplianceService.findChecklists(query);
  }

  @Get('checklists/:id')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get checklist by ID' })
  @ApiParam({ name: 'id' })
  getChecklist(@Param('id') id: string) {
    return this.masterComplianceService.findChecklist(id);
  }

  @Post('checklists')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create master compliance checklist' })
  createChecklist(@Body() data: Record<string, unknown>) {
    return this.masterComplianceService.createChecklist(data);
  }

  @Put('checklists/:id')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update checklist' })
  @ApiParam({ name: 'id' })
  updateChecklist(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.masterComplianceService.updateChecklist(id, data);
  }

  @Delete('checklists/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete checklist' })
  @ApiParam({ name: 'id' })
  removeChecklist(@Param('id') id: string) {
    return this.masterComplianceService.removeChecklist(id);
  }

  @Get('checklists/:id/items')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List items for a checklist' })
  @ApiParam({ name: 'id' })
  listItems(@Param('id') checklistId: string) {
    return this.masterComplianceService.findItems(checklistId);
  }

  @Put('items/:id')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update checklist item' })
  @ApiParam({ name: 'id' })
  updateItem(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.masterComplianceService.updateItem(id, data);
  }

  @Get('template')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get checklist template' })
  getTemplate() {
    return this.masterComplianceService.getTemplate();
  }

  @Get('summary')
  @Roles('ADMIN', 'COMPLIANCE', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get summary statistics' })
  getSummary() {
    return this.masterComplianceService.getSummary();
  }
}

