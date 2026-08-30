import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SecurityAssessmentService } from './security-assessment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('security-assessment')
@Controller('security-assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SecurityAssessmentController {
  constructor(private readonly securityAssessmentService: SecurityAssessmentService) {}

  @Get('assessments')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List security assessments' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  listAssessments(@Query() query: Record<string, unknown>) {
    return this.securityAssessmentService.findAssessments(query);
  }

  @Get('assessments/:id')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiParam({ name: 'id' })
  getAssessment(@Param('id') id: string) {
    return this.securityAssessmentService.findAssessment(id);
  }

  @Post('assessments')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create security assessment' })
  createAssessment(@Body() data: Record<string, unknown>) {
    return this.securityAssessmentService.createAssessment(data);
  }

  @Put('assessments/:id')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update security assessment' })
  @ApiParam({ name: 'id' })
  updateAssessment(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.securityAssessmentService.updateAssessment(id, data);
  }

  @Delete('assessments/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete security assessment' })
  @ApiParam({ name: 'id' })
  removeAssessment(@Param('id') id: string) {
    return this.securityAssessmentService.removeAssessment(id);
  }

  @Post('assessments/:id/start')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start security assessment' })
  @ApiParam({ name: 'id' })
  startAssessment(@Param('id') id: string) {
    return this.securityAssessmentService.startAssessment(id);
  }

  @Post('assessments/:id/complete')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete security assessment' })
  @ApiParam({ name: 'id' })
  completeAssessment(@Param('id') id: string) {
    return this.securityAssessmentService.completeAssessment(id);
  }

  @Get('assessments/:id/scans')
  @Roles('ADMIN', 'SECURITY', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List scans for an assessment' })
  @ApiParam({ name: 'id' })
  listScans(@Param('id') assessmentId: string) {
    return this.securityAssessmentService.findScans(assessmentId);
  }

  @Post('assessments/:id/scans')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create scan for an assessment' })
  @ApiParam({ name: 'id' })
  createScan(@Param('id') assessmentId: string, @Body() data: Record<string, unknown>) {
    return this.securityAssessmentService.createScan(assessmentId, data);
  }

  @Put('scans/:id')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update scan' })
  @ApiParam({ name: 'id' })
  updateScan(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.securityAssessmentService.updateScan(id, data);
  }

  @Get('findings')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List security findings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  listFindings(@Query() query: Record<string, unknown>) {
    return this.securityAssessmentService.findFindings(query);
  }

  @Get('findings/:id')
  @Roles('ADMIN', 'SECURITY')
  @ApiOperation({ summary: 'Get finding by ID' })
  @ApiParam({ name: 'id' })
  getFinding(@Param('id') id: string) {
    return this.securityAssessmentService.findFinding(id);
  }

  @Put('findings/:id')
  @Roles('ADMIN', 'SECURITY')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update finding' })
  @ApiParam({ name: 'id' })
  updateFinding(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.securityAssessmentService.updateFinding(id, data);
  }

  @Get('summary')
  @Roles('ADMIN', 'SECURITY')
  @ApiOperation({ summary: 'Get security assessment summary' })
  getSummary() {
    return this.securityAssessmentService.getSummary();
  }
}
