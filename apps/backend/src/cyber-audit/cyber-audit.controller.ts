import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CyberAuditService } from './cyber-audit.service';

@ApiTags('cyber-audit')
@Controller('cyber-audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CyberAuditController {
  constructor(private readonly cyberAuditService: CyberAuditService) {}

  @Get('audits')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List cyber audits' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  listAudits(@Query() query: Record<string, unknown>) {
    return this.cyberAuditService.findAudits(query);
  }

  @Get('audits/:id')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get audit by ID' })
  @ApiParam({ name: 'id' })
  getAudit(@Param('id') id: string) {
    return this.cyberAuditService.findAudit(id);
  }

  @Post('audits')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create cyber audit' })
  createAudit(@Body() data: Record<string, unknown>) {
    return this.cyberAuditService.createAudit(data);
  }

  @Put('audits/:id')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cyber audit' })
  @ApiParam({ name: 'id' })
  updateAudit(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.cyberAuditService.updateAudit(id, data);
  }

  @Delete('audits/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete cyber audit' })
  @ApiParam({ name: 'id' })
  removeAudit(@Param('id') id: string) {
    return this.cyberAuditService.removeAudit(id);
  }

  @Post('audits/:id/start')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start cyber audit' })
  @ApiParam({ name: 'id' })
  startAudit(@Param('id') id: string) {
    return this.cyberAuditService.startAudit(id);
  }

  @Post('audits/:id/complete')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete cyber audit' })
  @ApiParam({ name: 'id' })
  completeAudit(@Param('id') id: string) {
    return this.cyberAuditService.completeAudit(id);
  }

  @Get('audits/:id/metrics')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List metrics for an audit' })
  @ApiParam({ name: 'id' })
  listMetrics(@Param('id') auditId: string) {
    return this.cyberAuditService.findMetrics(auditId);
  }

  @Put('metrics/:id')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update audit metric' })
  @ApiParam({ name: 'id' })
  updateMetric(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.cyberAuditService.updateMetric(id, data);
  }

  @Get('findings')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List cyber audit findings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'auditId', required: false })
  listFindings(@Query() query: Record<string, unknown>) {
    return this.cyberAuditService.findFindings(query);
  }

  @Get('findings/:id')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get finding by ID' })
  @ApiParam({ name: 'id' })
  getFinding(@Param('id') id: string) {
    return this.cyberAuditService.findFinding(id);
  }

  @Post('findings')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create finding' })
  createFinding(@Body() data: Record<string, unknown>) {
    return this.cyberAuditService.createFinding(data);
  }

  @Put('findings/:id')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update finding' })
  @ApiParam({ name: 'id' })
  updateFinding(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.cyberAuditService.updateFinding(id, data);
  }

  @Delete('findings/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete finding' })
  @ApiParam({ name: 'id' })
  removeFinding(@Param('id') id: string) {
    return this.cyberAuditService.removeFinding(id);
  }

  @Get('checklist')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @ApiOperation({ summary: 'Get static INSA checklist template' })
  getChecklist() {
    return this.cyberAuditService.getChecklistTemplate();
  }

  @Get('summary')
  @Roles('ADMIN', 'SECURITY', 'COMPLIANCE')
  @ApiOperation({ summary: 'Get cyber audit summary' })
  getSummary() {
    return this.cyberAuditService.getSummary();
  }
}
