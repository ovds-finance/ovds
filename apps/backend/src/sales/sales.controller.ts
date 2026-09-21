import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';


import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CreateInvoiceDto, UpdateInvoiceDto, QueryInvoicesDto, RecordPaymentDto } from './dto/invoice.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('invoices')
  @Permissions('invoices:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List invoices' })
  list(@Query() query: QueryInvoicesDto, @Request() req: any) {
    return this.salesService.findAll({ ...query, companyId: query.companyId || req.user?.companyId });
  }

  @Get('invoices/next-number')
  @Permissions('invoices:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get next invoice number' })
  // GAP-4 FIX: accept companyId as an optional query param so that users who
  // manage multiple companies (e.g. SysAdmin switching context in the UI) get
  // the sequence for the selected company, not their auth-token company.
  // Falls back to req.user?.companyId for single-company setups.
  nextNumber(@Query('companyId') companyId: string, @Request() req: any) {
    return this.salesService.getNextNumber(companyId || req.user?.companyId);
  }

  @Get('invoices/stats')
  @Permissions('invoices:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice stats' })
  stats(@Request() req: any) {
    return this.salesService.getStats(req.user?.companyId);
  }

  @Post('invoices/flag-overdue')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag overdue invoices' })
  flagOverdue(@Request() req: any) {
    return this.salesService.flagOverdue(req.user?.companyId);
  }

  @Get('invoices/:id')
  @Permissions('invoices:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice by ID' })
  get(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post('invoices')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create invoice' })
  create(@Body(ValidationPipe) data: CreateInvoiceDto, @Request() req: any) {
    return this.salesService.create(data, req.user?.userId);
  }

  @Put('invoices/:id')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full replace of an invoice (PUT)' })
  update(@Param('id') id: string, @Body(ValidationPipe) data: UpdateInvoiceDto, @Request() req: any) {
    return this.salesService.update(id, data, req.user?.userId);
  }

  @Patch('invoices/:id')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Partial update of an invoice (PATCH) — only provided fields are changed' })
  patch(@Param('id') id: string, @Body(ValidationPipe) data: Partial<UpdateInvoiceDto>, @Request() req: any) {
    return this.salesService.update(id, data as UpdateInvoiceDto, req.user?.userId);
  }

  @Delete('invoices/:id')
  @Permissions('invoices:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.salesService.remove(id, req.user?.userId);
  }

  @Post('invoices/:id/send')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send invoice' })
  send(@Param('id') id: string, @Request() req: any) {
    return this.salesService.send(id, req.user?.userId);
  }

  @Post('invoices/:id/cancel')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel invoice' })
  cancel(@Param('id') id: string, @Body() body: { reason: string }, @Request() req: any) {
    return this.salesService.cancel(id, body.reason, req.user?.userId);
  }

  @Post('invoices/:id/mark-paid')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markPaid(@Param('id') id: string, @Body() body: { amount: number; paymentDate: string }, @Request() req: any) {
    return this.salesService.markPaid(id, body.amount, body.paymentDate, req.user?.userId);
  }

  @Post('invoices/:id/duplicate')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate invoice' })
  duplicate(@Param('id') id: string, @Request() req: any) {
    return this.salesService.duplicate(id, req.user?.userId);
  }

  @Post('invoices/bulk-send')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk send invoices' })
  @ApiBody({ type: [String] })
  bulkSend(@Body() body: { ids: string[] }, @Request() req: any) {
    return this.salesService.bulkSend(body.ids, req.user?.userId);
  }

  @Post('invoices/bulk-cancel')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk cancel invoices' })
  bulkCancel(@Body() body: { ids: string[]; reason?: string }, @Request() req: any) {
    return this.salesService.bulkCancel(body.ids, body.reason, req.user?.userId);
  }

  @Post('invoices/:id/payments')
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record payment' })
  recordPayment(@Param('id') id: string, @Body(ValidationPipe) data: RecordPaymentDto, @Request() req: any) {
    return this.salesService.recordPayment(id, data, req.user?.userId);
  }

  @Get('invoices/:id/payments')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'List payments' })
  getPayments(@Param('id') id: string) {
    return this.salesService.getPayments(id);
  }

  @Get('invoices/:id/activity')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get invoice activity' })
  getActivity(@Param('id') id: string) {
    return this.salesService.getActivity(id);
  }
}
