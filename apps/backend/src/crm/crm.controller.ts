import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from '@nestjs/common';

@ApiTags('crm')
@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List leads' })
  listLeads(@Query() query: Record<string, unknown>) {
    return this.crmService.findLeads(query);
  }

  @Get('leads/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get lead by ID' })
  getLead(@Param('id') id: string) {
    return this.crmService.findLead(id);
  }

  @Post('leads')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create lead' })
  createLead(@Body() data: Record<string, unknown>) {
    return this.crmService.createLead(data);
  }

  @Put('leads/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update lead' })
  updateLead(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.crmService.updateLead(id, data);
  }

  @Delete('leads/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete lead' })
  removeLead(@Param('id') id: string) {
    return this.crmService.removeLead(id);
  }

  @Post('leads/:id/convert')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert lead to opportunity' })
  convertLead(@Param('id') id: string, @Body() body: { customerId: string }) {
    return this.crmService.convertLead(id, body.customerId);
  }

  @Get('opportunities')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List opportunities' })
  listOpportunities(@Query() query: Record<string, unknown>) {
    return this.crmService.findOpportunities(query);
  }

  @Get('opportunities/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get opportunity by ID' })
  getOpportunity(@Param('id') id: string) {
    return this.crmService.findOpportunity(id);
  }

  @Post('opportunities')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create opportunity' })
  createOpportunity(@Body() data: Record<string, unknown>) {
    return this.crmService.createOpportunity(data);
  }

  @Put('opportunities/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update opportunity' })
  updateOpportunity(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.crmService.updateOpportunity(id, data);
  }

  @Delete('opportunities/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete opportunity' })
  removeOpportunity(@Param('id') id: string) {
    return this.crmService.removeOpportunity(id);
  }

  @Post('opportunities/:id/convert')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert opportunity to invoice' })
  convertOpportunity(@Param('id') id: string) {
    return this.crmService.convertOpportunityToInvoice(id);
  }

  @Get('activities')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List activities' })
  listActivities(@Query() query: Record<string, unknown>) {
    return this.crmService.findActivities(query);
  }

  @Post('activities')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create activity' })
  createActivity(@Body() data: Record<string, unknown>) {
    return this.crmService.createActivity(data);
  }

  @Post('activities/:id/complete')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete activity' })
  completeActivity(@Param('id') id: string) {
    return this.crmService.completeActivity(id);
  }

  @Get('contacts')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List contacts' })
  getContacts(@Query() query: Record<string, unknown>) {
    return this.crmService.findContacts(query);
  }

  @Post('contacts')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create contact' })
  createContact(@Body() data: Record<string, unknown>) {
    return this.crmService.createContact(data);
  }

  @Put('contacts/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update contact' })
  updateContact(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.crmService.updateContact(id, data);
  }

  @Delete('contacts/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete contact' })
  deleteContact(@Param('id') id: string) {
    return this.crmService.deleteContact(id);
  }

  @Get('companies')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List CRM companies' })
  getCompanies(@Query() query: Record<string, unknown>) {
    return this.crmService.findCompanies(query);
  }

  @Post('companies')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create CRM company' })
  createCompany(@Body() data: Record<string, unknown>) {
    return this.crmService.createCompany(data);
  }

  @Put('companies/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update CRM company' })
  updateCompany(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.crmService.updateCompany(id, data);
  }

  @Delete('companies/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete CRM company' })
  deleteCompany(@Param('id') id: string) {
    return this.crmService.deleteCompany(id);
  }

  @Get('deals')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List deals' })
  getDeals(@Query() query: Record<string, unknown>) {
    return this.crmService.findDeals(query);
  }

  @Get('deals/stats')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get deal stats' })
  getDealStats() {
    return this.crmService.getDealStats();
  }

  @Post('deals')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create deal' })
  createDeal(@Body() data: Record<string, unknown>) {
    return this.crmService.createDeal(data);
  }

  @Put('deals/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update deal' })
  updateDeal(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.crmService.updateDeal(id, data);
  }

  @Delete('deals/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete deal' })
  deleteDeal(@Param('id') id: string) {
    return this.crmService.deleteDeal(id);
  }

  @Get('pipelines')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List pipelines' })
  getPipelines(@Query() query: Record<string, unknown>) {
    return this.crmService.findPipelines(query);
  }

  @Post('pipelines')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create pipeline' })
  createPipeline(@Body() data: Record<string, unknown>) {
    return this.crmService.createPipeline(data);
  }

  @Put('pipelines/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update pipeline' })
  updatePipeline(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.crmService.updatePipeline(id, data);
  }

  @Delete('pipelines/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete pipeline' })
  deletePipeline(@Param('id') id: string) {
    return this.crmService.deletePipeline(id);
  }

  @Get('customers/registry')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List customer registry' })
  getCustomerRegistry(@Query() query: Record<string, unknown>) {
    return this.crmService.findCustomerRegistry(query);
  }

  @Get('customers/me')
  @Roles('ADMIN', 'SALES', 'CRM', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current customer profile' })
  getMyProfile(@Request() req: any) {
    return this.crmService.findCustomerByUserId(req.user?.userId);
  }
}
