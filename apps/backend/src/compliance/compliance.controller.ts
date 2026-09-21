import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { ComplianceService } from './compliance.service';

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('source-systems')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS source systems' })
  listSourceSystems() {
    return this.complianceService.findSourceSystems();
  }

  @Get('source-systems/:id')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get source system by ID' })
  getSourceSystem(@Param('id') id: string) {
    return this.complianceService.findSourceSystem(id);
  }

  @Post('source-systems')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create source system' })
  createSourceSystem(@Body() data: Record<string, unknown>) {
    return this.complianceService.createSourceSystem(data);
  }

  @Put('source-systems/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update source system' })
  updateSourceSystem(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.complianceService.updateSourceSystem(id, data);
  }

  @Delete('source-systems/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete source system' })
  removeSourceSystem(@Param('id') id: string) {
    return this.complianceService.removeSourceSystem(id);
  }

  @Get('certificates')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS certificates' })
  listCertificates() {
    return this.complianceService.findCertificates();
  }

  @Get('certificates/:id')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get certificate by ID' })
  getCertificate(@Param('id') id: string) {
    return this.complianceService.findCertificate(id);
  }

  @Post('certificates')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create certificate' })
  createCertificate(@Body() data: Record<string, unknown>) {
    return this.complianceService.createCertificate(data);
  }

  @Put('certificates/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update certificate' })
  updateCertificate(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.complianceService.updateCertificate(id, data);
  }

  @Delete('certificates/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete certificate' })
  removeCertificate(@Param('id') id: string) {
    return this.complianceService.removeCertificate(id);
  }

  @Get('eims/registrations')
  @Roles('ADMIN', 'COMPLIANCE', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS registrations' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'invoiceId', required: false })
  listRegistrations(@Query() query: Record<string, unknown>) {
    return this.complianceService.findRegistrations(query);
  }

  @Get('eims/registrations/:id')
  @Roles('ADMIN', 'COMPLIANCE', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registration by ID' })
  getRegistration(@Param('id') id: string) {
    return this.complianceService.findRegistration(id);
  }

  @Post('eims/registrations')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create registration' })
  createRegistration(@Body() data: Record<string, unknown>) {
    return this.complianceService.createRegistration(data);
  }

  @Post('eims/registrations/:id/cancel')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel registration' })
  cancelRegistration(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.complianceService.cancelRegistration(id, body.reason);
  }

  @Post('eims/registrations/:id/verify')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify registration' })
  verifyRegistration(@Param('id') id: string) {
    return this.complianceService.verifyRegistration(id);
  }

  @Get('eims/receipts')
  @Roles('ADMIN', 'COMPLIANCE', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS receipts' })
  listReceipts(@Query() query: Record<string, unknown>) {
    return this.complianceService.findReceipts(query);
  }

  @Post('eims/receipts')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create receipt' })
  createReceipt(@Body() data: Record<string, unknown>) {
    return this.complianceService.createReceipt(data);
  }

  @Get('eims/bulk-jobs')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bulk jobs' })
  listBulkJobs(@Query() query: Record<string, unknown>) {
    return this.complianceService.findBulkJobs(query);
  }

  @Post('eims/bulk-jobs')
  @Roles('ADMIN', 'COMPLIANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bulk job' })
  createBulkJob(@Body() data: Record<string, unknown>) {
    return this.complianceService.createBulkJob(data);
  }
}
