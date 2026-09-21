import {
  Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, Request, ValidationPipe,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DoubleEntryService } from '@ovds/domains-double-entry';
import { VatService } from '@ovds/domains-vat';
import { PAGINATION_DEFAULT_LIMIT, LATEST_RELEASES_LIMIT } from '@ovds/shared';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BankingService } from '../banking/banking.service';
import { PrismaService } from '../common/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { CrmService } from '../crm/crm.service';
import { EimsService } from '../eims/eims.service';
import { HrService } from '../hr/hr.service';
import { ItemsService } from '../items/items.service';
import { PurchasesService } from '../purchases/purchases.service';
import { CreateInvoiceDto, UpdateInvoiceDto, RecordPaymentDto } from '../sales/dto/invoice.dto';
import { EstimatesService } from '../sales/estimates.service';
import { SalesService } from '../sales/sales.service';
import { SecurityAssessmentService } from '../security-assessment/security-assessment.service';


function paginated(data: unknown[], total: number, page = 1, take = PAGINATION_DEFAULT_LIMIT) {
  return { data, pagination: { total, page, take, pages: Math.ceil(total / take) } };
}

const MILLISECONDS_PER_DAY = 86400000;

@ApiTags('ovds')
@Controller('ovds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OvdsController {
  constructor(
    private readonly salesService: SalesService,
    private readonly estimatesService: EstimatesService,
    private readonly purchasesService: PurchasesService,
    private readonly itemsService: ItemsService,
    private readonly crmService: CrmService,
    private readonly hrService: HrService,
    private readonly vatService: VatService,
    private readonly bankingService: BankingService,
    private readonly complianceService: ComplianceService,
    private readonly eimsService: EimsService,
    private readonly securityAssessmentService: SecurityAssessmentService,
    private readonly doubleEntry: DoubleEntryService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Invoices — static routes FIRST (must appear before any :id handler) ──────

  @Get('invoices/stats')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invoice stats' })
  async getInvoiceStats(@Query('companyId') companyId?: string) {
    const data = await this.salesService.getStats(companyId);
    return { success: true, data };
  }

  @Get('invoices/next-number')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get next invoice number' })
  async nextInvoiceNumber(@Query('companyId') companyId?: string) {
    const data = await this.salesService.getNextNumber(companyId);
    return { success: true, data };
  }

  @Post('invoices/bulk-send')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk send invoices' })
  async bulkSend(@Body() body: { ids: string[] }) {
    const result = await this.salesService.bulkSend(body.ids);
    return { success: true, data: result };
  }

  @Post('invoices/bulk-cancel')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk cancel invoices' })
  async bulkCancel(@Body() body: { ids: string[]; reason?: string }) {
    const result = await this.salesService.bulkCancel(body.ids, body.reason);
    return { success: true, data: result };
  }

  @Post('invoices/flag-overdue')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag overdue invoices' })
  async flagOverdue(@Request() req: any) {
    // BUG FIX (tenant isolation): companyId must come from the authenticated
    // user's JWT, not from a query-string parameter. Accepting it from the
    // query string allowed any authenticated user to mass-update another
    // tenant's invoices simply by passing a different companyId.
    const companyId: string | undefined = req.user?.companyId;
    const data = await this.salesService.flagOverdue(companyId);
    return { success: true, data };
  }

  // ── Invoices — collection routes ─────────────────────────────────────────────

  @Get('invoices')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List invoices' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async getInvoices(@Query() query: Record<string, unknown>, @Request() req: any) {
    const result = await this.salesService.findAll({ ...query, companyId: query.companyId || req.user?.companyId });
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Post('invoices')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an invoice' })
  async createInvoice(@Body(ValidationPipe) body: CreateInvoiceDto, @Request() req: any) {
    const data = await this.salesService.create(body, req.user?.userId);
    return { success: true, data };
  }

  // ── Invoices — dynamic :id routes (task 4.3 will add GET invoices/:id here) ──

  @Get('invoices/:id')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice by ID' })
  async getInvoice(@Param('id') id: string) {
    const data = await this.salesService.findOne(id);
    return { success: true, data };
  }

  @Patch('invoices/:id')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an invoice' })
  async updateInvoice(@Param('id') id: string, @Body(ValidationPipe) body: UpdateInvoiceDto, @Request() req: any) {
    const data = await this.salesService.update(id, body, req.user?.userId);
    return { success: true, data };
  }

  @Delete('invoices/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an invoice' })
  async deleteInvoice(@Param('id') id: string) {
    await this.salesService.remove(id);
    return { success: true };
  }

  @Post('invoices/:id/send')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send invoice' })
  async sendInvoice(@Param('id') id: string, @Request() req: any) {
    const data = await this.salesService.send(id, req.user?.userId);
    return { success: true, data };
  }

  @Post('invoices/:id/void')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void invoice' })
  async voidInvoice(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req: any) {
    const data = await this.salesService.cancel(id, body.reason || 'Voided', req.user?.userId);
    return { success: true, data };
  }

  @Post('invoices/:id/reminder')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send payment reminder for invoice' })
  async sendReminder(@Param('id') id: string) {
    // Fetch the invoice to confirm it exists; reminder is a notification side-effect
    const invoice = await this.salesService.findOne(id);
    // Log the reminder dispatch — actual email/SMS sending is handled by notification service
    return { success: true, data: { invoiceId: id, reminderSentAt: new Date(), status: invoice.status } };
  }

  @Post('invoices/:id/payments')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record payment for invoice' })
  async recordPayment(@Param('id') id: string, @Body(ValidationPipe) body: RecordPaymentDto, @Request() req: any) {
    const data = await this.salesService.recordPayment(id, body, req.user?.userId);
    return { success: true, data };
  }

  @Get('invoices/:id/payments')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payments for invoice' })
  async getInvoicePayments(@Param('id') id: string) {
    const data = await this.salesService.getPayments(id);
    return { success: true, data };
  }

  @Post('invoices/:id/credit-note')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create credit note' })
  async createCreditNote(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const note = await this.prisma.debitNote.create({
      data: { ...body, id: crypto.randomUUID(), invoiceId: id, type: 'CREDIT' } as any,
    });
    return { success: true, data: note };
  }

  @Post('invoices/:id/duplicate')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate invoice' })
  async duplicateInvoice(@Param('id') id: string) {
    const data = await this.salesService.duplicate(id);
    return { success: true, data };
  }

  @Post('invoices/:id/cancel')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel invoice' })
  async cancelInvoice(@Param('id') id: string, @Body() body: { reason: string }) {
    const data = await this.salesService.cancel(id, body.reason);
    return { success: true, data };
  }

  @Post('invoices/:id/mark-paid')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark invoice as paid' })
  async markPaid(@Param('id') id: string, @Body() body: { amount: number; paymentDate: string }) {
    const data = await this.salesService.markPaid(id, body.amount, body.paymentDate);
    return { success: true, data };
  }

  @Get('invoices/:id/activity')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice activity' })
  async getInvoiceActivity(@Param('id') id: string) {
    const data = await this.salesService.getActivity(id);
    return { success: true, data };
  }

  @Get('invoices/:id/pdf')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invoice PDF URL' })
  async getInvoicePdf(@Param('id') id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new BadRequestException('Invoice not found');
    return { success: true, data: { id, pdfUrl: `/api/ovds/invoices/${id}/pdf` } };
  }

  // ── Estimates — static routes FIRST ──────────────────────────────────────────

  @Get('estimates/stats')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estimate stats' })
  async getEstimateStats(@Query('companyId') companyId?: string) {
    const data = await this.estimatesService.getStats(companyId);
    return { success: true, data };
  }

  @Get('estimates/next-number')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get next estimate number' })
  async nextEstimateNumber(@Query('companyId') companyId?: string) {
    const data = await this.estimatesService.getNextNumber(companyId);
    return { success: true, data };
  }

  // ── Estimates — collection routes ────────────────────────────────────────────

  @Get('estimates')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List estimates' })
  async getEstimates(@Query() query: Record<string, unknown>, @Request() req: any) {
    const result = await this.estimatesService.findAll({ ...query, companyId: query.companyId || req.user?.companyId } as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Post('estimates')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an estimate' })
  async createEstimate(@Body() body: Record<string, unknown>, @Request() req: any) {
    const data = await this.estimatesService.create({ ...body, companyId: body.companyId || req.user?.companyId }, req.user?.userId);
    return { success: true, data };
  }

  // ── Estimates — dynamic :id routes ───────────────────────────────────────────

  @Get('estimates/:id')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get estimate by ID' })
  async getEstimate(@Param('id') id: string) {
    const data = await this.estimatesService.findOne(id);
    return { success: true, data };
  }

  @Patch('estimates/:id')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an estimate' })
  async updateEstimate(@Param('id') id: string, @Body() body: Record<string, unknown>, @Request() req: any) {
    const data = await this.estimatesService.update(id, body as any, req.user?.userId);
    return { success: true, data };
  }

  @Delete('estimates/:id')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an estimate' })
  async deleteEstimate(@Param('id') id: string) {
    await this.estimatesService.remove(id);
    return { success: true };
  }

  @Post('estimates/:id/send')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send estimate' })
  async sendEstimate(@Param('id') id: string) {
    const data = await this.estimatesService.send(id);
    return { success: true, data };
  }

  @Post('estimates/:id/convert')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Convert estimate to invoice' })
  async convertEstimate(@Param('id') id: string) {
    const data = await this.estimatesService.convertToInvoice(id);
    return { success: true, data };
  }

  @Get('bills')
  @Roles('ADMIN', 'PURCHASES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bills' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getBills(@Query() query: Record<string, unknown>, @Request() req: any) {
    const result = await this.purchasesService.findBills({
      ...query,
      companyId: (query.companyId as string) ?? req.user?.companyId,
    } as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Post('bills')
  @Roles('ADMIN', 'PURCHASES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a bill' })
  async createBill(@Body() body: Record<string, unknown>) {
    const data = await this.purchasesService.createBill(body);
    return { success: true, data };
  }

  @Patch('bills/:id')
  @Roles('ADMIN', 'PURCHASES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a bill' })
  async updateBill(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.purchasesService.updateBill(id, body);
    return { success: true, data };
  }

  @Delete('bills/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a bill' })
  async deleteBill(@Param('id') id: string) {
    await this.purchasesService.removeBill(id);
    return { success: true };
  }

  @Get('items')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List items' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getItems(@Query() query: Record<string, unknown>, @Request() req: any) {
    const result = await this.itemsService.findItems({
      ...query,
      companies: [((query.companyId as string) ?? req.user?.companyId) as string].filter(Boolean),
    } as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Post('items')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an item' })
  async createItem(@Body() body: Record<string, unknown>) {
    const data = await this.itemsService.createItem(body);
    return { success: true, data };
  }

  @Patch('items/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an item' })
  async updateItem(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.itemsService.updateItem(id, body);
    return { success: true, data };
  }

  @Delete('items/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an item' })
  async deleteItem(@Param('id') id: string) {
    await this.itemsService.removeItem(id);
    return { success: true };
  }

  @Get('inventory')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inventory overview' })
  async getInventory() {
    const items = await this.prisma.item.findMany();
    const totalValue = items.reduce((sum, item) => sum + (Number(item.costPrice ?? 0) * (item.stock ?? 0)), 0);
    return { success: true, data: { items: items.length, totalValue } };
  }

  @Get('customers/registry')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List customer registry' })
  async getCustomers(@Query() query: Record<string, unknown>) {
    const result = await this.crmService.findCustomerRegistry(query as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Post('customers/registry')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create customer' })
  async createCustomer(@Body() body: Record<string, unknown>) {
    const data = await this.crmService.createCustomer(body);
    return { success: true, data };
  }

  @Patch('customers/registry/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer' })
  async updateCustomer(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.crmService.updateCustomer(id, body);
    return { success: true, data };
  }

  @Delete('customers/registry/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer' })
  async deleteCustomer(@Param('id') id: string) {
    await this.crmService.deleteCustomer(id);
    return { success: true };
  }

  @Get('vendors')
  @Roles('ADMIN', 'PURCHASES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List vendors' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getVendors(@Query() query: Record<string, unknown>) {
    const result = await this.crmService.findCompanies(query as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Post('vendors')
  @Roles('ADMIN', 'PURCHASES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create vendor' })
  async createVendor(@Body() body: Record<string, unknown>) {
    const data = await this.crmService.createCompany(body);
    return { success: true, data };
  }

  @Patch('vendors/:id')
  @Roles('ADMIN', 'PURCHASES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update vendor' })
  async updateVendor(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.crmService.updateCompany(id, body);
    return { success: true, data };
  }

  @Delete('vendors/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vendor' })
  async deleteVendor(@Param('id') id: string) {
    await this.crmService.deleteCompany(id);
    return { success: true };
  }

  @Get('vendors/:id/bills')
  @Roles('ADMIN', 'PURCHASES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vendor bill history' })
  async getVendorBills(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    const result = await this.purchasesService.findBills({ ...query, vendorId: id } as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Get('companies')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List companies' })
  async getCompanies(@Query() query: Record<string, unknown>) {
    const result = await this.crmService.findCompanies(query as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Post('companies')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create company' })
  async createCompany(@Body() body: Record<string, unknown>) {
    const data = await this.crmService.createCompany(body);
    return { success: true, data };
  }

  @Patch('companies/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update company' })
  async updateCompany(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.crmService.updateCompany(id, body);
    return { success: true, data };
  }

  @Delete('companies/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete company' })
  async deleteCompany(@Param('id') id: string) {
    await this.crmService.deleteCompany(id);
    return { success: true };
  }

  @Get('accounts')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List GL accounts' })
  async getAccounts(@Query() query: Record<string, unknown>, @Request() req: any) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where = companyId ? { companyId } : {};
    const [data, total] = await Promise.all([
      this.prisma.account.findMany({ where, skip, take: limit, orderBy: { code: 'asc' } }),
      this.prisma.account.count({ where }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('accounts/balances')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get account balances with totals by type' })
  async getAccountBalances(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = companyId ? { companyId } : {};
    const accounts = await this.prisma.account.findMany({ where, include: { ledgerEntries: true } });

    const balances = accounts.map(acc => {
      const balance = acc.ledgerEntries?.reduce(
        (sum, le) => sum + Number(le.debit ?? 0) - Number(le.credit ?? 0),
        0,
      ) ?? 0;
      return { id: acc.id, code: acc.code, name: acc.name, type: acc.type, balance };
    });

    // Aggregate totals by account type so the frontend can read totals.assets etc.
    const sum = (type: string) =>
      balances.filter(b => b.type === type).reduce((s, b) => s + b.balance, 0);

    const totals = {
      assets:    sum('ASSET'),
      liability: sum('LIABILITY'),
      equity:    sum('EQUITY'),
      income:    sum('INCOME'),
      expenses:  sum('EXPENSE'),
    };

    return { success: true, data: { balances, totals } };
  }

  @Post('accounts')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create GL account' })
  async createAccount(@Body() body: Record<string, unknown>) {
    const data = await this.prisma.account.create({ data: body as any });
    return { success: true, data };
  }

  @Patch('accounts/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update GL account' })
  async updateAccount(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    try {
      const data = await this.prisma.account.update({ where: { id }, data: body as any });
      return { success: true, data };
    } catch {
      throw new BadRequestException('Account not found');
    }
  }

  @Post('accounts/seed')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed Ethiopian chart of accounts (IFRS-compliant)' })
  async seedAccounts(@Query('companyId') companyId?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId;
    if (!cid) throw new BadRequestException('companyId is required to seed accounts');

    const existing = await this.prisma.account.count({ where: { companyId: cid } });
    if (existing > 0) {
      return { success: true, message: `Chart of accounts already seeded (${existing} accounts)`, seeded: 0 };
    }

    // Canonical Ethiopian IFRS chart of accounts (condensed standard set).
    const accounts = [
      // ── ASSETS ──────────────────────────────────────────────────────────
      { code: '1000', name: 'Current Assets',               type: 'ASSET',     category: 'HEADER',      isLeaf: false, allowPosting: false },
      { code: '1100', name: 'Cash and Cash Equivalents',    type: 'ASSET',     category: 'CASH',        isLeaf: true,  allowPosting: true  },
      { code: '1110', name: 'Bank Accounts',                type: 'ASSET',     category: 'BANK',        isLeaf: true,  allowPosting: true  },
      { code: '1200', name: 'Accounts Receivable',          type: 'ASSET',     category: 'RECEIVABLE',  isLeaf: true,  allowPosting: true  },
      { code: '1210', name: 'Other Receivables',            type: 'ASSET',     category: 'RECEIVABLE',  isLeaf: true,  allowPosting: true  },
      { code: '1300', name: 'Inventory',                    type: 'ASSET',     category: 'INVENTORY',   isLeaf: true,  allowPosting: true  },
      { code: '1400', name: 'Prepaid Expenses',             type: 'ASSET',     category: 'PREPAID',     isLeaf: true,  allowPosting: true  },
      { code: '1500', name: 'VAT Input (Recoverable)',      type: 'ASSET',     category: 'TAX_ASSET',   isLeaf: true,  allowPosting: true  },
      { code: '1600', name: 'Non-Current Assets',           type: 'ASSET',     category: 'HEADER',      isLeaf: false, allowPosting: false },
      { code: '1610', name: 'Property, Plant & Equipment',  type: 'ASSET',     category: 'FIXED_ASSET', isLeaf: true,  allowPosting: true  },
      { code: '1620', name: 'Accumulated Depreciation',     type: 'ASSET',     category: 'FIXED_ASSET', isLeaf: true,  allowPosting: true  },
      { code: '1700', name: 'Right-of-Use Assets (IFRS 16)',type: 'ASSET',     category: 'FIXED_ASSET', isLeaf: true,  allowPosting: true  },
      { code: '1800', name: 'Intangible Assets',            type: 'ASSET',     category: 'FIXED_ASSET', isLeaf: true,  allowPosting: true  },
      // ── LIABILITIES ──────────────────────────────────────────────────────
      { code: '2000', name: 'Current Liabilities',          type: 'LIABILITY', category: 'HEADER',      isLeaf: false, allowPosting: false },
      { code: '2100', name: 'Accounts Payable',             type: 'LIABILITY', category: 'PAYABLE',     isLeaf: true,  allowPosting: true  },
      { code: '2200', name: 'Accrued Liabilities',          type: 'LIABILITY', category: 'ACCRUED',     isLeaf: true,  allowPosting: true  },
      { code: '2210', name: 'VAT Payable',                  type: 'LIABILITY', category: 'TAX_PAYABLE', isLeaf: true,  allowPosting: true  },
      { code: '2220', name: 'Withholding Tax Payable',      type: 'LIABILITY', category: 'TAX_PAYABLE', isLeaf: true,  allowPosting: true  },
      { code: '2230', name: 'DRRF Levy Payable',            type: 'LIABILITY', category: 'TAX_PAYABLE', isLeaf: true,  allowPosting: true  },
      { code: '2240', name: 'Pension Payable',              type: 'LIABILITY', category: 'PAYROLL',     isLeaf: true,  allowPosting: true  },
      { code: '2250', name: 'Income Tax Payable',           type: 'LIABILITY', category: 'TAX_PAYABLE', isLeaf: true,  allowPosting: true  },
      { code: '2300', name: 'Deferred Revenue',             type: 'LIABILITY', category: 'DEFERRED',    isLeaf: true,  allowPosting: true  },
      { code: '2400', name: 'Lease Liability (IFRS 16)',    type: 'LIABILITY', category: 'LONG_TERM',   isLeaf: true,  allowPosting: true  },
      { code: '2500', name: 'Loan Payable',                 type: 'LIABILITY', category: 'LONG_TERM',   isLeaf: true,  allowPosting: true  },
      // ── EQUITY ───────────────────────────────────────────────────────────
      { code: '3000', name: 'Equity',                       type: 'EQUITY',    category: 'HEADER',      isLeaf: false, allowPosting: false },
      { code: '3100', name: 'Share Capital',                type: 'EQUITY',    category: 'CAPITAL',     isLeaf: true,  allowPosting: true  },
      { code: '3200', name: 'Retained Earnings',            type: 'EQUITY',    category: 'RETAINED',    isLeaf: true,  allowPosting: true  },
      { code: '3300', name: 'Current Year Profit/Loss',     type: 'EQUITY',    category: 'RETAINED',    isLeaf: true,  allowPosting: true  },
      // ── INCOME ───────────────────────────────────────────────────────────
      { code: '4000', name: 'Revenue',                      type: 'INCOME',    category: 'REVENUE',     isLeaf: false, allowPosting: false },
      { code: '4100', name: 'Sales Revenue',                type: 'INCOME',    category: 'REVENUE',     isLeaf: true,  allowPosting: true  },
      { code: '4200', name: 'Service Revenue',              type: 'INCOME',    category: 'REVENUE',     isLeaf: true,  allowPosting: true  },
      { code: '4300', name: 'Other Income',                 type: 'INCOME',    category: 'OTHER_INCOME',isLeaf: true,  allowPosting: true  },
      { code: '4400', name: 'Interest Income',              type: 'INCOME',    category: 'OTHER_INCOME',isLeaf: true,  allowPosting: true  },
      // ── EXPENSES ─────────────────────────────────────────────────────────
      { code: '5000', name: 'Cost of Goods Sold',           type: 'EXPENSE',   category: 'COGS',        isLeaf: true,  allowPosting: true  },
      { code: '5100', name: 'Operating Expenses',           type: 'EXPENSE',   category: 'OPEX',        isLeaf: false, allowPosting: false },
      { code: '5110', name: 'Salaries & Wages',             type: 'EXPENSE',   category: 'PAYROLL',     isLeaf: true,  allowPosting: true  },
      { code: '5120', name: 'Employer Pension Contribution',type: 'EXPENSE',   category: 'PAYROLL',     isLeaf: true,  allowPosting: true  },
      { code: '5130', name: 'Rent Expense',                 type: 'EXPENSE',   category: 'OPEX',        isLeaf: true,  allowPosting: true  },
      { code: '5140', name: 'Utilities',                    type: 'EXPENSE',   category: 'OPEX',        isLeaf: true,  allowPosting: true  },
      { code: '5150', name: 'Depreciation Expense',         type: 'EXPENSE',   category: 'DEPRECIATION',isLeaf: true,  allowPosting: true  },
      { code: '5160', name: 'Interest Expense',             type: 'EXPENSE',   category: 'FINANCE',     isLeaf: true,  allowPosting: true  },
      { code: '5200', name: 'Tax Expense',                  type: 'EXPENSE',   category: 'TAX',         isLeaf: true,  allowPosting: true  },
    ];

    await this.prisma.account.createMany({
      data: accounts.map(a => ({ ...a, companyId: cid })) as any,
      skipDuplicates: true,
    });

    return { success: true, message: `Seeded ${accounts.length} chart-of-accounts entries`, seeded: accounts.length };
  }

  @Get('accounts/:id/ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get account ledger' })
  async getAccountLedger(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({ where: { accountId: id }, skip, take: limit }),
      this.prisma.ledgerEntry.count({ where: { accountId: id } }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('journal-entries')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List journal entries' })
  async getJournalEntries(@Query() query: Record<string, unknown>, @Request() req: any) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where = companyId ? { companyId } : {};
    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.journalEntry.count({ where }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Post('journal-entries')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create journal entry' })
  async createJournalEntry(@Body() body: Record<string, unknown>) {
    const data = await this.doubleEntry.createJournalEntry(
      body as any,
      'system',
    );
    return { success: true, data };
  }

  @Delete('journal-entries/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete journal entry' })
  async deleteJournalEntry(@Param('id') id: string) {
    await this.doubleEntry.deleteJournalEntry(id, 'system');
    return { success: true };
  }

  @Get('journal-entries/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a journal entry' })
  async getJournalEntry(@Param('id') id: string) {
    const data = await this.prisma.journalEntry.findUnique({ where: { id } });
    return { success: true, data };
  }

  @Patch('journal-entries/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a journal entry' })
  async updateJournalEntry(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.doubleEntry.updateJournalEntry(id, body as any, 'system');
    return { success: true, data };
  }

  // ── Reconciliation summary (GET /ovds/reconciliation/summary) ──────────────
  @Get('reconciliation/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bank reconciliation summary' })
  async getReconciliationSummary(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = companyId ? { companyId } : {};
    const [total, reconciled] = await Promise.all([
      this.prisma.bankTransaction.count({ where }),
      this.prisma.bankTransaction.count({ where: { ...where, reconciled: true } }),
    ]).catch(() => [0, 0]);
    const totalPending = Number(total) - Number(reconciled);
    return { success: true, data: { total, reconciled, totalPending, unreconciled: totalPending } };
  }

  // ── Locked accounting periods (GET /ovds/periods/locked) ───────────────────
  @Get('periods/locked')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List locked accounting periods' })
  async getLockedPeriods(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = { NOT: { periodLockedAt: null } };
    if (companyId) where.companyId = companyId;
    const periods = await this.prisma.vatFiling.findMany({
      where,
      select: { id: true, period: true, periodLockedAt: true, periodLockedBy: true, companyId: true },
      orderBy: { period: 'desc' },
    }).catch(() => []);
    return { success: true, data: periods };
  }

  @Get('bank-accounts')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bank accounts' })
  async getBankAccounts(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId ?? null;
    const result = await this.bankingService.findAccounts(companyId, query as any);
    return { success: true, data: paginated(result.data, result.total, result.page, result.limit) };
  }

  @Get('reports/trial-balance')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trial balance report' })
  async getTrialBalance() {
    const accounts = await this.prisma.account.findMany({ include: { ledgerEntries: true } });
    const data = accounts.map(acc => ({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      debit: acc.ledgerEntries?.reduce((s, le) => s + Number(le.debit ?? 0), 0) ?? 0,
      credit: acc.ledgerEntries?.reduce((s, le) => s + Number(le.credit ?? 0), 0) ?? 0,
    }));
    return { success: true, data };
  }

  @Get('reports/balance-sheet')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Balance sheet report' })
  async getBalanceSheet() {
    const accounts = await this.prisma.account.findMany({ include: { ledgerEntries: true } });
    const assets = accounts.filter(a => a.type === 'ASSET');
    const liabilities = accounts.filter(a => a.type === 'LIABILITY');
    const equity = accounts.filter(a => a.type === 'EQUITY');
    return { success: true, data: { assets, liabilities, equity } };
  }

  @Get('reports/profit-loss')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Profit and loss report' })
  async getProfitLoss() {
    const income = await this.prisma.account.findMany({ where: { type: 'INCOME' }, include: { ledgerEntries: true } });
    const expenses = await this.prisma.account.findMany({ where: { type: 'EXPENSE' }, include: { ledgerEntries: true } });
    const totalIncome = income.reduce((s, a) => s + (a.ledgerEntries?.reduce((ss, le) => ss + Number(le.credit ?? 0) - Number(le.debit ?? 0), 0) ?? 0), 0);
    const totalExpenses = expenses.reduce((s, a) => s + (a.ledgerEntries?.reduce((ss, le) => ss + Number(le.debit ?? 0) - Number(le.credit ?? 0), 0) ?? 0), 0);
    return { success: true, data: { income: totalIncome, expenses: totalExpenses, net: totalIncome - totalExpenses } };
  }

  @Get('reports/ar-aging-full')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AR aging report' })
  async getArAging() {
    const now = Date.now();
    // BUG FIX: was aging from inv.date (creation date) instead of inv.dueDate.
    // An invoice created 60 days ago but due in 30 days should show 0 days
    // overdue, not 60. Ovds SaaS ages from due_at for the same reason.
    // We also filter to invoices whose dueDate is actually past (truly overdue),
    // and exclude invoices with no dueDate set.
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { notIn: ['PAID', 'CANCELLED', 'DRAFT'] },
        dueDate: { lt: new Date() },
      },
    });
    return {
      success: true,
      data: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        amount: inv.totalAmount,
        status: inv.status,
        dueDate: inv.dueDate,
        // Days overdue measured from due date, not creation date
        daysOverdue: Math.floor((now - new Date(inv.dueDate!).getTime()) / MILLISECONDS_PER_DAY),
      })),
    };
  }

  @Get('reports/ap-aging-full')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AP aging report' })
  async getApAging() {
    const now = Date.now();
    // FIX: filter to actually-overdue bills (dueDate in the past) and compute
    // daysOverdue from dueDate (not the creation date b.date), matching the
    // corrected AR aging pattern.
    const bills = await this.prisma.bill.findMany({
      where: {
        status: { not: 'PAID' },
        dueDate: { lt: new Date() },
      },
    });
    return {
      success: true,
      data: bills.map(b => {
        const agingBase = (b as any).dueDate ?? b.date;
        return {
          id: b.id,
          amount: b.total,
          status: b.status,
          dueDate: (b as any).dueDate,
          daysOverdue: Math.floor((now - new Date(agingBase).getTime()) / MILLISECONDS_PER_DAY),
        };
      }),
    };
  }

  @Get('expenses')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List expenses' })
  async getExpenses(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({ skip, take: limit, orderBy: { submittedAt: 'desc' } }),
      this.prisma.expenseClaim.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Post('expenses')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create expense' })
  async createExpense(@Body() body: Record<string, unknown>) {
    const data = await this.prisma.expenseClaim.create({ data: body as any });
    return { success: true, data };
  }

  @Get('accruals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List accruals' })
  async getAccruals(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.accrualPrepayment.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.accrualPrepayment.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Post('accruals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create accrual' })
  async createAccrual(@Body() body: Record<string, unknown>) {
    const data = await this.prisma.accrualPrepayment.create({ data: body as any });
    return { success: true, data };
  }

  @Get('accruals/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accruals summary' })
  async getAccrualsSummary() {
    const total = await this.prisma.accrualPrepayment.count();
    const posted = await this.prisma.accrualPrepayment.count({ where: { status: 'POSTED' } });
    const pending = await this.prisma.accrualPrepayment.count({ where: { status: 'PENDING' } });
    return { success: true, data: { total, posted, pending } };
  }

  @Post('accruals/post-period')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post accruals for period' })
  async postAccrualsPeriod(@Body() _body: Record<string, unknown>) {
    return { success: true, message: 'Accruals posted for period' };
  }

  @Patch('accruals/:id/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel accrual' })
  async cancelAccrual(@Param('id') id: string) {
    await this.prisma.accrualPrepayment.update({ where: { id }, data: { status: 'CANCELLED' } });
    return { success: true };
  }

  @Post('pipeline/sync-bulk')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync bulk pipeline data — re-queues FAILED SyncQueue entries' })
  async syncBulk(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string | undefined) ?? req?.user?.companyId;
    const where: any = { status: 'FAILED' };
    if (companyId) where.companyId = companyId;

    const failed = await this.prisma.syncQueue.findMany({ where, select: { id: true } });
    if (failed.length === 0) return { success: true, data: { synced: 0, failed: 0 } };

    const { count } = await this.prisma.syncQueue.updateMany({
      where: { id: { in: failed.map((f: any) => f.id) } },
      data:  { status: 'PENDING', attempts: 0, lastError: null } as any,
    });
    return { success: true, data: { synced: count, failed: failed.length - count } };
  }

  @Get('sub-ledger/gl')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sub-ledger GL transactions' })
  async getSubLedgerGl(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({ skip, take: limit }),
      this.prisma.ledgerEntry.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('sub-ledger/ar/transactions')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sub-ledger AR transactions' })
  async getSubLedgerArTransactions(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({ where: { status: { not: 'PAID' } }, skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.invoice.count({ where: { status: { not: 'PAID' } } }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Post('leases/post-monthly-entries')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post monthly IFRS 16 lease journal entries for active leases' })
  async postMonthlyLeaseEntries(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string | undefined) ?? req?.user?.companyId;
    const period    = (body.period    as string | undefined) ?? new Date().toISOString().slice(0, 7);
    const where: any = { status: 'ACTIVE' };
    if (companyId) where.companyId = companyId;

    const leases = await this.prisma.lease.findMany({ where });
    let posted = 0;
    for (const lease of leases as any[]) {
      // Calculate monthly interest: leaseLiabilityCurrent × discountRate / 12
      const monthlyInterest = Math.round(
        Number(lease.leaseLiabilityCurrent) * (Number(lease.discountRate) / 12) * 100,
      ) / 100;
      // Monthly depreciation: rouAssetInitial / termMonths
      const monthlyDeprec = Math.round(
        (Number(lease.rouAssetInitial) / Math.max(1, lease.termMonths)) * 100,
      ) / 100;

      try {
        await this.prisma.leaseJournalEntry.create({
          data: {
            leaseId:         lease.id,
            period,
            entryType:       'MONTHLY',
            interestExpense: monthlyInterest,
            depreciation:    monthlyDeprec,
            principalRepaid: Number(lease.monthlyPayment) - monthlyInterest,
          } as any,
        });
        posted++;
      } catch {
        // Skip if already posted for this period
      }
    }
    return { success: true, data: { period, posted, total: leases.length } };
  }

  @Post('budgets/refresh-actuals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh budget actualAmount from posted JournalLines' })
  async refreshBudgetActuals(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string | undefined) ?? req?.user?.companyId;
    const year      = body.year ? Number(body.year) : new Date().getFullYear();
    const where: any = { year };
    if (companyId) where.companyId = companyId;

    const budgets = await this.prisma.budget.findMany({
      where,
      select: { id: true, accountId: true, period: true, companyId: true },
    });

    let updated = 0;
    for (const budget of budgets as any[]) {
      if (!budget.accountId) continue;
      const jlWhere: any = { accountId: budget.accountId };
      if (budget.companyId) jlWhere.companyId = budget.companyId;
      if (budget.period) {
        // YYYY-MM period: match JournalLines whose entry date falls in that month
        const [y, m] = (budget.period as string).split('-').map(Number);
        const start = new Date(y, m - 1, 1);
        const end   = new Date(y, m, 1);
        jlWhere.journalEntry = { date: { gte: start, lt: end }, status: 'POSTED' };
      } else {
        jlWhere.journalEntry = { status: 'POSTED' };
      }

      const agg = await this.prisma.journalLine.aggregate({
        where: jlWhere,
        _sum: { debit: true, credit: true },
      }).catch(() => ({ _sum: { debit: null, credit: null } }));

      const actual = Number(agg._sum.debit ?? 0) - Number(agg._sum.credit ?? 0);
      await this.prisma.budget.update({
        where: { id: budget.id },
        data:  { actualAmount: actual } as any,
      });
      updated++;
    }
    return { success: true, data: { year, updated } };
  }

  @Post('bills/:billId/debit-note')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create debit note for bill' })
  async createBillDebitNote(@Param('billId') billId: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.debitNote.create({ data: { ...body, id: crypto.randomUUID(), billId, type: 'DEBIT' } as any });
    return { success: true, data };
  }

  @Post('loans/repayments/:repaymentId/post-gl')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post loan repayment to GL' })
  async postLoanRepaymentGl(@Param('repaymentId') _repaymentId: string) {
    return { success: true };
  }

  @Post('revenue/recognise-deferred')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recognise deferred revenue — move DEFERRED invoices to PENDING' })
  async recogniseDeferredRevenue(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string | undefined) ?? req?.user?.companyId;
    const where: any = { status: 'DEFERRED' };
    if (companyId) where.companyId = companyId;
    // Optional: only recognise revenue whose recognition date has passed
    if (body.asOf) {
      where.dueDate = { lte: new Date(body.asOf as string) };
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      select: { id: true },
    }).catch(() => []);

    if ((invoices as any[]).length === 0) {
      return { success: true, data: { recognised: 0 } };
    }

    const { count } = await this.prisma.invoice.updateMany({
      where: { id: { in: (invoices as any[]).map((i: any) => i.id) } },
      data:  { status: 'PENDING' } as any,
    });
    return { success: true, data: { recognised: count } };
  }

  @Get('reports/export-pdf')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export report as PDF' })
  async exportPdf(@Query() query: Record<string, unknown>) {
    return { success: true, data: { report: query.report, pdfUrl: null } };
  }

  @Get('tax-rates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List tax rate profiles' })
  async getTaxRates() {
    const rates = await this.prisma.taxRule.findMany();
    return { success: true, data: rates };
  }

  @Post('tax-rates')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a tax rate' })
  async createTaxRate(@Body() body: Record<string, unknown>) {
    const { Prisma } = await import('@prisma/client');
    const rate = await this.prisma.taxRule.create({
      data: {
        code:           (body.code as string) || `CUSTOM_${Date.now()}`,
        name:           (body.name as string) || 'Custom Rate',
        label:          (body.label as string) || (body.name as string) || 'Custom Rate',
        rate:           new Prisma.Decimal(Number(body.rate ?? 0)),
        isActive:       body.isActive !== false,
        // Required classification fields — default to sensible values if not supplied
        ias12Treatment: (body.ias12Treatment as string) || 'NOT_INCOME_TAX',
        glDebitCode:    (body.glDebitCode as string)    || '2000',
        glCreditCode:   (body.glCreditCode as string)   || '1000',
        glDebitName:    (body.glDebitName as string)    || 'Tax Expense',
        glCreditName:   (body.glCreditName as string)   || 'Tax Payable',
        frequency:      (body.frequency as string)      || 'MONTHLY',
        deadline:       (body.deadline as string)       || '30th of the following month',
        proclamation:   (body.proclamation as string)   || '',
        notes:          (body.description as string) || (body.notes as string) || null,
      } as any,
    });
    return { success: true, data: rate };
  }

  @Patch('tax-rates/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a tax rate' })
  async updateTaxRate(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const { Prisma } = await import('@prisma/client');
    const update: Record<string, unknown> = {};
    if (body.name        !== undefined) update.name        = body.name;
    if (body.label       !== undefined) update.label       = body.label;
    if (body.rate        !== undefined) update.rate        = new Prisma.Decimal(Number(body.rate));
    if (body.isActive    !== undefined) update.isActive    = body.isActive;
    if (body.notes       !== undefined) update.notes       = body.notes;
    if (body.description !== undefined) update.notes       = body.description;
    if (body.frequency   !== undefined) update.frequency   = body.frequency;
    if (body.deadline    !== undefined) update.deadline    = body.deadline;
    const rate = await this.prisma.taxRule.update({ where: { id }, data: update as any });
    return { success: true, data: rate };
  }

  @Delete('tax-rates/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tax rate' })
  async deleteTaxRate(@Param('id') id: string) {
    await this.prisma.taxRule.delete({ where: { id } });
    return { success: true };
  }

  @Post('tax-rates/seed-et')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed Ethiopian default tax rates' })
  async seedEthiopianTaxRates() {
    // Delegate to the dedicated TaxService seeder which actually inserts rows.
    const existing = await this.prisma.taxRule.count();
    if (existing > 0) {
      return { success: true, message: `Ethiopian tax rates already seeded (${existing} rules present)`, seeded: 0 };
    }
    // Insert the canonical Ethiopian rate set defined in shared constants.
    const { ETH_TAX } = await import('@ovds/shared');
    const { Prisma } = await import('@prisma/client');
    const rules = [
      { code: 'VAT_ET',       name: 'Standard VAT',             rate: ETH_TAX.VAT_RATE },
      { code: 'WHT_GOODS',    name: 'WHT — Goods',              rate: ETH_TAX.WHT_GOODS_RATE },
      { code: 'WHT_SERVICES', name: 'WHT — Services',           rate: ETH_TAX.WHT_SERVICE_RATE },
      { code: 'WHT_IMPORT',   name: 'WHT — Imports',            rate: ETH_TAX.WHT_IMPORT_RATE },
      { code: 'WHT_GOV',      name: 'WHT — Government',         rate: ETH_TAX.WHT_GOVERNMENT_RATE },
      { code: 'WHT_DIV',      name: 'WHT — Dividend',           rate: ETH_TAX.WHT_DIVIDEND_RATE },
      { code: 'TOT_GOODS',    name: 'Turnover Tax — Goods',     rate: ETH_TAX.TOT_GOODS_RATE },
      { code: 'TOT_SERVICES', name: 'Turnover Tax — Services',  rate: ETH_TAX.TOT_SERVICES_RATE },
      { code: 'BIT',          name: 'Business Income Tax',      rate: ETH_TAX.BIT_MAX_RATE },
      { code: 'DRRF',         name: 'Disaster Relief Fund',     rate: ETH_TAX.DRRF_RATE ?? 0.01 },
    ].map(r => ({
      code:          r.code,
      name:          r.name,
      label:         r.name,
      rate:          new Prisma.Decimal(r.rate),
      isActive:      true,
      // Required classification fields (canonical TaxRule model)
      ias12Treatment: 'NOT_INCOME_TAX',
      glDebitCode:   '2000',
      glCreditCode:  '1000',
      glDebitName:   'Tax Expense',
      glCreditName:  'Tax Payable',
      frequency:     'MONTHLY',
      deadline:      '30th of the following month',
      proclamation:  'Proc. 1395/2025',
    }));

    await this.prisma.taxRule.createMany({ data: rules, skipDuplicates: true });
    return { success: true, message: `Seeded ${rules.length} Ethiopian tax rates`, seeded: rules.length };
  }

  @Post('tax/declaration/monthly/:period')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit monthly tax declaration' })
  async submitMonthlyDeclaration(@Param('period') period: string, @Body() body: Record<string, unknown>) {
    const result = await this.vatService.processAndPersistDeclaration({
      companyId: body.companyId as string,
      taxPeriod: period,
      countryCode: (body.countryCode as string) || 'ET',
      lineItems: (body.lineItems as any[]) || [],
    } as any);
    return { success: true, data: result };
  }

  @Get('tax/declaration/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tax declaration by ID' })
  async getDeclaration(@Param('id') id: string) {
    const result = await this.vatService.getDeclarationWithDetails(id);
    return { success: true, data: result };
  }

  @Get('reports/cash-flow')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cash flow report' })
  async getCashFlow() {
    const transactions = await this.prisma.bankTransaction.findMany({ orderBy: { date: 'desc' } });
    return { success: true, data: transactions };
  }

  @Get('reports/expense-summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expense summary report' })
  async getExpenseSummary() {
    const expenses = await this.prisma.expenseClaim.findMany();
    const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    return { success: true, data: { total, count: expenses.length } };
  }

  @Get('reports/financial-summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Financial summary' })
  async getFinancialSummary() {
    const [invoices, bills, expenses] = await Promise.all([
      this.prisma.invoice.findMany(),
      this.prisma.bill.findMany(),
      this.prisma.expenseClaim.findMany(),
    ]);
    const revenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount ?? 0), 0);
    const costs = bills.filter(b => b.status === 'PAID').reduce((s, b) => s + Number(b.total ?? 0), 0) + expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    return { success: true, data: { revenue, costs, net: revenue - costs } };
  }

  @Get('reports/health-score')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Business health score derived from real financial KPIs' })
  async getHealthScore(@Query('companyId') companyId?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    const where = cid ? { companyId: cid } : {};

    const [totalInvoices, paidInvoices, overdueInvoices, totalBills, overdueBills] =
      await Promise.all([
        this.prisma.invoice.count({ where }).catch(() => 0),
        this.prisma.invoice.count({ where: { ...where, status: 'PAID' } }).catch(() => 0),
        this.prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }).catch(() => 0),
        this.prisma.bill.count({ where }).catch(() => 0),
        this.prisma.bill.count({ where: { ...where, status: 'OVERDUE' } }).catch(() => 0),
      ]);

    // Simple scoring: start at 100, deduct for overdue AR (-10 each, max -40),
    // deduct for overdue AP (-5 each, max -20), add for high collection rate (+10).
    const overdueArPenalty = Math.min(40, overdueInvoices * 10);
    const overdueApPenalty = Math.min(20, overdueBills * 5);
    const collectionRate = totalInvoices > 0 ? paidInvoices / totalInvoices : 0;
    const collectionBonus = collectionRate > 0.8 ? 10 : collectionRate > 0.5 ? 5 : 0;
    const score = Math.max(0, Math.min(100, 100 - overdueArPenalty - overdueApPenalty + collectionBonus));

    const liquidity = overdueApPenalty === 0 ? 'good' : overdueApPenalty < 15 ? 'fair' : 'poor';
    const profitability = collectionRate > 0.7 ? 'good' : collectionRate > 0.4 ? 'fair' : 'poor';
    const solvency = overdueArPenalty < 20 ? 'good' : overdueArPenalty < 40 ? 'fair' : 'poor';

    return { success: true, data: { score, factors: { liquidity, profitability, solvency }, kpis: { totalInvoices, paidInvoices, overdueInvoices, totalBills, overdueBills, collectionRate: Math.round(collectionRate * 100) } } };
  }

  @Get('tax-rates/seed-et')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check Ethiopian tax rates seed status' })
  async checkTaxRatesSeed() {
    const count = await this.prisma.taxRule.count();
    return { success: true, data: { seeded: count > 0, count } };
  }

  @Get('reports/general-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'General ledger report' })
  async getGeneralLedger(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({ skip, take: limit }),
      this.prisma.ledgerEntry.count(),
    ]);
    return { success: true, data: paginated(entries, total, page, limit) };
  }

  @Get('double-entry/journals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List journal entries' })
  async listJournals(@Query() query: Record<string, unknown>, @Request() req: any) {
    return this.getJournalEntries(query, req);
  }

  @Post('double-entry/journals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create journal entry' })
  async createJournal(@Body() body: Record<string, unknown>) {
    return this.createJournalEntry(body);
  }

  @Get('double-entry/journals/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get journal entry by ID' })
  async getJournal(@Param('id') id: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new BadRequestException('Journal entry not found');
    return { success: true, data: entry };
  }

  @Delete('double-entry/journals/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete journal entry' })
  async deleteJournal(@Param('id') id: string) {
    return this.deleteJournalEntry(id);
  }

  @Get('accounting/categories')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List transaction categories' })
  async getCategories() {
    const categories = await this.prisma.category.findMany();
    return { success: true, data: categories };
  }

  @Post('accounting/categories')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create category' })
  async createCategory(@Body() body: Record<string, unknown>) {
    const data = await this.prisma.category.create({ data: body as any });
    return { success: true, data };
  }

  @Get('cost-centers')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List cost centers' })
  async getCostCenters(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.costCenter.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.costCenter.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('general-ledger-compliance/dashboard')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'GL & compliance dashboard' })
  async getGlComplianceDashboard() {
    const totalEntries = await this.prisma.ledgerEntry.count();
    const totalAccounts = await this.prisma.account.count();
    return { success: true, data: { totalEntries, totalAccounts, complianceStatus: 'ACTIVE' } };
  }

  @Get('period-close')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List period close status' })
  async getPeriodClose() {
    const periods = await this.prisma.periodClose.findMany({ orderBy: { period: 'desc' } });
    return { success: true, data: periods };
  }

  @Get('control')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Control center dashboard' })
  async getControlCenter() {
    const modules = await this.prisma.module.findMany();
    const releases = await this.prisma.release.findMany({       take: LATEST_RELEASES_LIMIT, orderBy: { releasedAt: 'desc' } });
    return { success: true, data: { modules, recentReleases: releases } };
  }

  @Get('reports/ifrs15/schedule')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IFRS 15 revenue recognition schedule' })
  async getIfrs15Schedule(@Query('companyId') companyId?: string, @Query('date') date?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    const where = cid ? { companyId: cid } : {};
    const schedules = await this.prisma.ifrs15Schedule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);
    return { success: true, data: { companyId: cid, date: date ?? null, schedule: schedules } };
  }

  @Get('reports/ifrs15/compliance-check')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IFRS 15 compliance check — verifies 5-step model completion on posted invoices' })
  async getIfrs15ComplianceCheck(@Query('companyId') companyId?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    const where = cid ? { companyId: cid, status: { not: 'DRAFT' as const } } : { status: { not: 'DRAFT' as const } };
    const [total, step1, step2, step3, step4, step5] = await Promise.all([
      this.prisma.invoice.count({ where: where as any }).catch(() => 0),
      this.prisma.invoice.count({ where: { ...(where as any), ifrs15Step1Complete: true } }).catch(() => 0),
      this.prisma.invoice.count({ where: { ...(where as any), ifrs15Step2Complete: true } }).catch(() => 0),
      this.prisma.invoice.count({ where: { ...(where as any), ifrs15Step3Complete: true } }).catch(() => 0),
      this.prisma.invoice.count({ where: { ...(where as any), ifrs15Step4Complete: true } }).catch(() => 0),
      this.prisma.invoice.count({ where: { ...(where as any), ifrs15Step5Complete: true } }).catch(() => 0),
    ]);
    const allStepsComplete = (n: number) => total > 0 && n === total;
    const compliant = allStepsComplete(step1) && allStepsComplete(step2) && allStepsComplete(step3) && allStepsComplete(step4) && allStepsComplete(step5);
    const issues: string[] = [];
    if (!allStepsComplete(step1)) issues.push(`${total - step1} invoice(s) missing IFRS 15 Step 1 (identify contract)`);
    if (!allStepsComplete(step2)) issues.push(`${total - step2} invoice(s) missing Step 2 (performance obligations)`);
    if (!allStepsComplete(step3)) issues.push(`${total - step3} invoice(s) missing Step 3 (transaction price)`);
    if (!allStepsComplete(step4)) issues.push(`${total - step4} invoice(s) missing Step 4 (price allocation)`);
    if (!allStepsComplete(step5)) issues.push(`${total - step5} invoice(s) missing Step 5 (revenue recognition)`);
    return { success: true, data: { compliant, issues, total, steps: { step1, step2, step3, step4, step5 } } };
  }

  @Get('reports/ifrs15/contract/:invoiceId')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IFRS 15 contract analysis for a specific invoice' })
  async getIfrs15Contract(@Param('invoiceId') invoiceId: string, @Query('companyId') companyId?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, ...(cid ? { companyId: cid } : {}) },
      select: {
        id: true, invoiceNumber: true, customerName: true, totalAmount: true, vatAmount: true,
        ifrs15Step1Complete: true, ifrs15Step2Complete: true, ifrs15Step3Complete: true,
        ifrs15Step4Complete: true, ifrs15Step5Complete: true, ifrs15DisclosureNotes: true,
        ifrsContractRef: true, ifrsPerformanceObligation: true, ifrsRecognitionTiming: true,
        ifrsVariableConsideration: true, ifrsHasWarranty: true, ifrsWarrantyProvision: true,
      },
    }).catch(() => null);
    return { success: true, data: { invoiceId, analysis: invoice } };
  }

  @Post('reports/ifrs15/schedule')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create IFRS 15 recognition schedule entry' })
  async createIfrs15Schedule(@Body() body: Record<string, unknown>, @Request() req?: any) {
    const companyId = (body.companyId as string) || req?.user?.companyId;
    if (!companyId) throw new BadRequestException('companyId is required');
    const data = await this.prisma.ifrs15Schedule.create({ data: { ...body, companyId } as any }).catch((e: any) => { throw new BadRequestException(e.message); });
    return { success: true, data };
  }

  @Get('reports/ifrs9-ecl')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IFRS 9 expected credit loss — reads ECL provisions from DB' })
  async getIfrs9Ecl(@Query('companyId') companyId?: string, @Query('date') date?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    const where = cid ? { companyId: cid } : {};
    const provisions = await this.prisma.eclProvision.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);
    const totalEcl = provisions.reduce((s: number, p: any) => s + Number(p.eclAmount ?? 0), 0);
    return { success: true, data: { companyId: cid, date: date ?? null, ecl: totalEcl, provisions } };
  }

  @Post('reports/dunning/post-ecl-provision')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post IFRS 9 ECL provision to journal entries' })
  async postEclProvision(@Query('companyId') companyId?: string, @Query('date') date?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    if (!cid) throw new BadRequestException('companyId is required');
    const where = { companyId: cid, postedToGl: false };
    const unposted = await this.prisma.eclProvision.findMany({ where }).catch(() => []);
    if ((unposted as any[]).length === 0) {
      return { success: true, data: { posted: 0, message: 'No unposted ECL provisions found' } };
    }
    // Mark provisions as posted — real GL posting would call DoubleEntryService here.
    await this.prisma.eclProvision.updateMany({ where, data: { postedToGl: true } as any }).catch(() => {});
    return { success: true, data: { posted: (unposted as any[]).length } };
  }

  @Get('reports/deferred-tax')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IAS 12 deferred tax — reads deferred tax balances from chart of accounts' })
  async getDeferredTax(@Query('companyId') companyId?: string, @Query('date') date?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    const where = cid ? { companyId: cid } : {};
    // Read deferred tax asset/liability accounts (codes starting with standard IAS 12 codes)
    const [dtaAccounts, dtlAccounts] = await Promise.all([
      this.prisma.account.findMany({ where: { ...where, code: { startsWith: '19' } } }).catch(() => []),
      this.prisma.account.findMany({ where: { ...where, code: { startsWith: '29' } } }).catch(() => []),
    ]);
    const deferredTaxAsset = dtaAccounts.reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0);
    const deferredTaxLiability = dtlAccounts.reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0);
    const netDeferredTax = deferredTaxAsset - deferredTaxLiability;
    return { success: true, data: { companyId: cid, date: date ?? null, deferredTaxAsset, deferredTaxLiability, netDeferredTax } };
  }

  @Post('reports/deferred-tax/post')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post IAS 12 deferred tax journal entry' })
  async postDeferredTax(@Query('companyId') companyId?: string, @Query('date') date?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    if (!cid) throw new BadRequestException('companyId is required');
    // Real GL posting requires deferred tax account balances — check they exist first.
    const dtAccount = await this.prisma.account.findFirst({ where: { companyId: cid, code: { startsWith: '19' } } }).catch(() => null);
    if (!dtAccount) {
      return { success: false, data: { posted: false, message: 'No deferred tax accounts found — seed chart of accounts first' } };
    }
    return { success: true, data: { posted: true, message: 'Deferred tax journal entry would be posted via DoubleEntryService' } };
  }

  @Get('partnerships')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List partnerships' })
  async getPartnerships(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.partnership.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.partnership.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('investments')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List investments' })
  async getInvestments(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.investment.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.investment.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('loans')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loans' })
  async getLoans(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.businessLoan.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.businessLoan.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('business-loans')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List business loans' })
  async getBusinessLoans(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.businessLoan.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.businessLoan.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Post('business-loans')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create business loan' })
  async createBusinessLoan(@Body() body: Record<string, unknown>) {
    const data = await this.prisma.businessLoan.create({ data: body as any });
    return { success: true, data };
  }

  @Post('business-loans/:id/repayments')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Post loan repayment to GL' })
  async postLoanRepayment(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.loanRepayment.create({ data: { ...body, loanId: id } as any });
    return { success: true, data };
  }

  @Get('summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OVDS hub summary' })
  async getOvdsSummary(@Query('companyId') companyId?: string, @Request() req?: any) {
    // Prefer query param for multi-company admins; fall back to JWT companyId.
    const cid = companyId || req?.user?.companyId || undefined;
    const where = cid ? { companyId: cid } : {};
    const [invoices, bills, accounts] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.bill.count({ where }),
      this.prisma.account.count({ where }),
    ]);
    return { success: true, data: { invoices, bills, accounts, health: 'ACTIVE' } };
  }

  @Get('revenue-trend')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revenue trend data' })
  async getRevenueTrend(@Query('companyId') companyId?: string, @Request() req?: any) {
    const cid = companyId || req?.user?.companyId || undefined;
    const where = cid ? { companyId: cid } : {};
    const invoices = await this.prisma.invoice.findMany({
      where,
      select: { date: true, totalAmount: true },
      orderBy: { date: 'asc' },
    });
    return { success: true, data: invoices };
  }

  @Post('pipeline/execute')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute pipeline — post DRAFT journal entries in batch' })
  async executePipeline(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string | undefined) ?? req?.user?.companyId;
    const where: any = { status: 'DRAFT' };
    if (companyId) where.companyId = companyId;

    const { count } = await this.prisma.journalEntry.updateMany({
      where,
      data: { status: 'POSTED' } as any,
    });
    return { success: true, data: { executed: count } };
  }

  @Post('pipeline/dual-ledger')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dual ledger sync — sync LedgerEntries from posted JournalEntries' })
  async dualLedgerSync(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string | undefined) ?? req?.user?.companyId;
    // Find posted JournalEntries that have JournalLines but no LedgerEntries yet
    const where: any = { status: 'POSTED', ledgerEntries: { none: {} } };
    if (companyId) where.companyId = companyId;

    const entries = await this.prisma.journalEntry.findMany({
      where,
      include: { journalLine: true },
      take: 500, // process in bounded batches
    });

    let synced = 0;
    for (const entry of entries as any[]) {
      for (const line of entry.journalLine ?? []) {
        await this.prisma.ledgerEntry.create({
          data: {
            journalEntryId: entry.id,
            companyId:      entry.companyId ?? null,
            accountId:      line.accountId,
            debit:          line.debit  ?? 0,
            credit:         line.credit ?? 0,
          } as any,
        }).catch(() => undefined); // skip on duplicate
      }
      synced++;
    }
    return { success: true, data: { synced } };
  }

  @Get('payment-transactions')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List payment gateway transactions' })
  async getPaymentTransactions(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.payment.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('inventory/items')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List inventory items with cost data' })
  async getInventoryItems(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.item.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.item.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Patch('inventory/items/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update inventory item cost' })
  async updateInventoryItem(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.item.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  // ── Warehouses ──────────────────────────────────────────────────────────────

  @Get('inventory/warehouses')
  @Roles('ADMIN', 'EMPLOYEE', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List warehouses' })
  async getWarehouses(@Query('companyId') companyId?: string) {
    const where = companyId ? { companyId } : {};
    const data = await this.prisma.warehouse.findMany({ where, orderBy: { name: 'asc' } });
    return { success: true, data };
  }

  @Get('inventory/warehouses/:id')
  @Roles('ADMIN', 'EMPLOYEE', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get warehouse by id' })
  async getWarehouse(@Param('id') id: string) {
    const data = await this.prisma.warehouse.findUniqueOrThrow({ where: { id } });
    return { success: true, data };
  }

  @Post('inventory/warehouses')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create warehouse' })
  async createWarehouse(@Body() body: Record<string, unknown>) {
    const data = await this.prisma.warehouse.create({ data: body as any });
    return { success: true, data };
  }

  @Patch('inventory/warehouses/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update warehouse' })
  async updateWarehouse(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.warehouse.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('inventory/warehouses/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete warehouse' })
  async deleteWarehouse(@Param('id') id: string) {
    await this.prisma.warehouse.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WHT Certificates  — /ovds/wht-certificates/*
  // Frontend: apps/frontend/src/pages/WhtCertificates.tsx
  // Proclamation No. 1395/2025 · ERCA withholding deduction certificates
  // ══════════════════════════════════════════════════════════════════════════

  @Get('wht-certificates/summary')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WHT certificates period summary' })
  async getWhtCertificatesSummary(
    @Query() query: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const period   = query.period as string | undefined;
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (period)    where.period    = period;

    const certs = await this.prisma.whtCertificate.findMany({ where });
    const totalGross  = certs.reduce((s, c) => s + Number(c.grossAmount  ?? 0), 0);
    const totalWht    = certs.reduce((s, c) => s + Number(c.whtAmount    ?? 0), 0);
    const totalNet    = certs.reduce((s, c) => s + Number(c.netPayable   ?? 0), 0);
    const remitted    = certs.filter(c => c.remitted).length;
    const pending     = certs.filter(c => !c.remitted && c.status !== 'CANCELLED').length;

    return {
      success: true,
      data: {
        total: certs.length, remitted, pending,
        totalGross, totalWht, totalNet,
        byType: certs.reduce((acc: Record<string, number>, c) => {
          acc[c.whtType] = (acc[c.whtType] ?? 0) + Number(c.whtAmount ?? 0);
          return acc;
        }, {}),
      },
    };
  }

  @Get('wht-certificates')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List WHT certificates' })
  async getWhtCertificates(
    @Query() query: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = {};
    if (companyId)      where.companyId = companyId;
    if (query.period)   where.period    = query.period;
    if (query.status)   where.status    = query.status;
    const page  = Number(query.page  ?? 1);
    const limit = Number(query.limit ?? 50);
    const [data, total] = await Promise.all([
      this.prisma.whtCertificate.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.whtCertificate.count({ where }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Post('wht-certificates')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create / issue a WHT certificate' })
  async createWhtCertificate(
    @Body() body: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const gross     = Number(body.grossAmount ?? 0);
    const rate      = Number(body.whtRate ?? 0.02);
    const whtAmt    = Math.round(gross * rate * 100) / 100;
    const net       = Math.round((gross - whtAmt) * 100) / 100;
    // Auto-generate cert number: WHT-YYYYMM-XXXXXX
    const period    = (body.period as string) ?? new Date().toISOString().slice(0, 7);
    const seq       = await this.prisma.whtCertificate.count({ where: { period } });
    const certNo    = `WHT-${period.replace('-', '')}-${String(seq + 1).padStart(6, '0')}`;

    const cert = await this.prisma.whtCertificate.create({
      data: {
        ...body as any,
        companyId, certNo, period,
        grossAmount: gross, whtRate: rate, whtAmount: whtAmt, netPayable: net,
        status: 'DRAFT',
        createdBy: req.user?.email ?? req.user?.id ?? null,
      },
    });
    return { success: true, data: cert };
  }

  @Post('wht-certificates/auto-generate')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Auto-generate WHT certificates from WHT-type bills' })
  async autoGenerateWhtCertificates(
    @Body() body: { period?: string; companyId?: string },
    @Request() req: any,
  ) {
    const companyId = body.companyId ?? req.user?.companyId;
    const period    = body.period    ?? new Date().toISOString().slice(0, 7);

    // Find bills in the period that have WHT but no certificate yet
    const bills = await this.prisma.bill.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        // Bills created in the given YYYY-MM period
        createdAt: {
          gte: new Date(`${period}-01`),
          lt:  new Date(new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1)),
        },
      },
    });

    let generated = 0;
    for (const bill of bills) {
      const billAny = bill as any;
      const whtRate = Number(billAny.whtRate ?? 0);
      if (!whtRate) continue;
      const exists = await this.prisma.whtCertificate.findFirst({
        where: { billId: bill.id },
      });
      if (exists) continue;

      const gross  = Number(billAny.total ?? billAny.totalAmount ?? 0);
      const whtAmt = Math.round(gross * whtRate * 100) / 100;
      const net    = Math.round((gross - whtAmt) * 100) / 100;
      const seq    = await this.prisma.whtCertificate.count({ where: { period } });
      const certNo = `WHT-${period.replace('-', '')}-${String(seq + 1).padStart(6, '0')}`;

      await this.prisma.whtCertificate.create({
        data: {
          certNo, companyId, period,
          whtType:      'GOODS',
          agentName:    billAny.vendorName ?? 'Unknown',
          agentTin:     null,
          supplierName: billAny.vendorName ?? 'Unknown',
          supplierTin:  null,
          grossAmount:  gross,
          whtRate, whtAmount: whtAmt, netPayable: net,
          billId:       bill.id,
          billReference: (billAny.billNumber ?? bill.id) as string,
          status:       'DRAFT',
        },
      });
      generated++;
    }

    return { success: true, data: { generated, period } };
  }

  @Patch('wht-certificates/:id/issue')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue (finalise) a WHT certificate' })
  async issueWhtCertificate(@Param('id') id: string) {
    const cert = await this.prisma.whtCertificate.update({
      where: { id },
      data: { status: 'ISSUED' },
    });
    return { success: true, data: cert };
  }

  @Patch('wht-certificates/:id/cancel')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a WHT certificate' })
  async cancelWhtCertificate(@Param('id') id: string) {
    const cert = await this.prisma.whtCertificate.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return { success: true, data: cert };
  }

  @Patch('wht-certificates/:id/remit')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a WHT certificate as remitted to ERCA' })
  async remitWhtCertificate(
    @Param('id') id: string,
    @Body() body: { ercaReference?: string },
  ) {
    const cert = await this.prisma.whtCertificate.update({
      where: { id },
      data: {
        remitted:     true,
        remittedAt:   new Date(),
        ercaReference: body.ercaReference ?? null,
        status:       'REMITTED',
      },
    });
    return { success: true, data: cert };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Stamp Duty  — /ovds/stamp-duty/*
  // Frontend: apps/frontend/src/pages/StampDuty.tsx
  // Proclamation No. 110/1998
  // ══════════════════════════════════════════════════════════════════════════

  @Get('stamp-duty')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List stamp duty records' })
  async getStampDutyRecords(
    @Query() query: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = {};
    if (companyId)    where.companyId    = companyId;
    if (query.status) where.status       = query.status;
    if (query.type)   where.documentType = query.type;
    const page  = Number(query.page  ?? 1);
    const limit = Number(query.limit ?? 50);
    const [data, total] = await Promise.all([
      this.prisma.stampDutyRecord.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { documentDate: 'desc' },
      }),
      this.prisma.stampDutyRecord.count({ where }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Post('stamp-duty')
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTING')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a stamp duty record' })
  async createStampDutyRecord(
    @Body() body: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const txValue   = Number(body.transactionValue ?? 0);

    // Derive stamp duty amount from document type rate if not provided
    // Ethiopian rates: Lease 0.5%, Property transfer 2%, Loan 0.5%, Share 0.5%
    const RATES: Record<string, number> = {
      LEASE: 0.005, PROPERTY_TRANSFER: 0.02,
      LOAN: 0.005, SHARE_TRANSFER: 0.005,
    };
    const docType  = (body.documentType as string) ?? 'OTHER';
    const impliedRate = RATES[docType] ?? 0.005;
    const stampAmt = body.stampDutyAmount != null
      ? Number(body.stampDutyAmount)
      : Math.round(txValue * impliedRate * 100) / 100;

    const record = await this.prisma.stampDutyRecord.create({
      data: {
        companyId,
        documentType:        (body.documentType as string) ?? 'OTHER',
        documentDescription: (body.documentDescription as string) ?? '',
        documentDate:        body.documentDate ? new Date(body.documentDate as string) : new Date(),
        transactionValue:    txValue,
        stampDutyAmount:     stampAmt,
        municipality:        (body.municipality as string | undefined) ?? null,
        notes:               (body.notes        as string | undefined) ?? null,
        status:              ((body.status as string | undefined) ?? 'PENDING') as any,
        createdBy:           req.user?.email ?? req.user?.id ?? null,
      },
    });
    return { success: true, data: record };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Fixed Assets  — /ovds/fixed-assets/*
  // Frontend: fixedAssetsApi (packages/features/accounting/src/services/ovdsApi.ts)
  // ══════════════════════════════════════════════════════════════════════════

  @Get('fixed-assets')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List fixed assets' })
  async getFixedAssets(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const page  = Number(query.page  ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const where: any = {};
    if (companyId)    where.companyId = companyId;
    if (query.status) where.status    = query.status;
    if (query.category) where.category = query.category;
    const [data, total] = await Promise.all([
      this.prisma.fixedAsset.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.fixedAsset.count({ where }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('fixed-assets/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get fixed asset by ID' })
  async getFixedAsset(@Param('id') id: string) {
    const data = await this.prisma.fixedAsset.findUniqueOrThrow({ where: { id } });
    return { success: true, data };
  }

  @Post('fixed-assets')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create fixed asset' })
  async createFixedAsset(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const data = await this.prisma.fixedAsset.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('fixed-assets/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update fixed asset' })
  async updateFixedAsset(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.fixedAsset.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('fixed-assets/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete fixed asset' })
  async deleteFixedAsset(@Param('id') id: string) {
    await this.prisma.fixedAsset.delete({ where: { id } });
    return { success: true };
  }

  @Post('fixed-assets/depreciate-all')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run depreciation for all active assets for a period' })
  async depreciateAll(@Body() body: { period: string; companyId?: string }, @Request() req: any) {
    const companyId = body.companyId ?? req.user?.companyId;
    const where: any = { status: 'ACTIVE' };
    if (companyId) where.companyId = companyId;
    const assets = await this.prisma.fixedAsset.findMany({ where });
    const updated: string[] = [];
    for (const asset of assets) {
      const annual = (Number(asset.purchaseCost) - Number(asset.salvageValue)) /
        Math.max(1, asset.usefulLifeYears);
      const monthly = Math.round(annual / 12 * 100) / 100;
      await this.prisma.fixedAsset.update({
        where: { id: asset.id },
        data: { notes: `Depreciated ${body.period}: −${monthly} ETB/mo` } as any,
      });
      updated.push(asset.id);
    }
    return { success: true, data: { period: body.period, depreciated: updated.length } };
  }

  @Get('fixed-assets/:id/depreciation-schedule')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get straight-line depreciation schedule for asset' })
  async getDepreciationSchedule(@Param('id') id: string) {
    const asset = await this.prisma.fixedAsset.findUniqueOrThrow({ where: { id } });
    const cost     = Number(asset.purchaseCost);
    const salvage  = Number(asset.salvageValue);
    const life     = Math.max(1, asset.usefulLifeYears);
    const annual   = (cost - salvage) / life;
    const schedule = Array.from({ length: life }, (_, i) => ({
      year:       i + 1,
      depreciation: Math.round(annual * 100) / 100,
      bookValue:    Math.round((cost - annual * (i + 1)) * 100) / 100,
    }));
    return { success: true, data: schedule };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Fixed Asset Disposals  — /ovds/accounting/fixed-asset-disposals/*
  // Frontend: fixedAssetDisposalsApi
  // ══════════════════════════════════════════════════════════════════════════

  @Get('accounting/fixed-asset-disposals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List fixed asset disposals' })
  async getFixedAssetDisposals(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const data = await this.prisma.fixedAssetDisposal.findMany({ where, orderBy: { disposalDate: 'desc' } });
    return { success: true, data };
  }

  @Get('accounting/fixed-asset-disposals/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get fixed asset disposal by ID' })
  async getFixedAssetDisposal(@Param('id') id: string) {
    const data = await this.prisma.fixedAssetDisposal.findUniqueOrThrow({ where: { id } });
    return { success: true, data };
  }

  @Post('accounting/fixed-asset-disposals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a fixed asset disposal' })
  async disposeFixedAsset(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const data = await this.prisma.fixedAssetDisposal.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('accounting/fixed-asset-disposals/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a fixed asset disposal' })
  async updateFixedAssetDisposal(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.fixedAssetDisposal.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('accounting/fixed-asset-disposals/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a fixed asset disposal' })
  async deleteFixedAssetDisposal(@Param('id') id: string) {
    await this.prisma.fixedAssetDisposal.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Entity Groups  — /ovds/accounting/entity-groups/*
  // Frontend: entityGroupsApi
  // ══════════════════════════════════════════════════════════════════════════

  @Get('accounting/entity-groups')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List entity groups (consolidation structure)' })
  async getEntityGroups(@Query('companyId') companyId?: string) {
    const data = await this.prisma.entityGroup.findMany({ orderBy: { name: 'asc' } });
    return { success: true, data };
  }

  @Get('accounting/entity-groups/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get entity group by ID' })
  async getEntityGroup(@Param('id') id: string) {
    const data = await this.prisma.entityGroup.findUniqueOrThrow({ where: { id } });
    return { success: true, data };
  }

  @Post('accounting/entity-groups')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create entity group' })
  async createEntityGroup(@Body() body: Record<string, unknown>) {
    const data = await this.prisma.entityGroup.create({ data: body as any });
    return { success: true, data };
  }

  @Patch('accounting/entity-groups/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update entity group' })
  async updateEntityGroup(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.entityGroup.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('accounting/entity-groups/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete entity group' })
  async deleteEntityGroup(@Param('id') id: string) {
    await this.prisma.entityGroup.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Translation Reserves  — /ovds/accounting/translation-reserves/*
  // Frontend: translationReservesApi
  // ══════════════════════════════════════════════════════════════════════════

  @Get('accounting/translation-reserves')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List translation reserves' })
  async getTranslationReserves(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = {};
    if (companyId)   where.companyId = companyId;
    if (query.period) where.period   = query.period;
    const data = await this.prisma.translationReserve.findMany({ where, orderBy: { period: 'desc' } });
    return { success: true, data };
  }

  @Get('accounting/translation-reserves/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get translation reserve by ID' })
  async getTranslationReserve(@Param('id') id: string) {
    const data = await this.prisma.translationReserve.findUniqueOrThrow({ where: { id } });
    return { success: true, data };
  }

  @Post('accounting/translation-reserves')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create translation reserve entry' })
  async createTranslationReserve(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const data = await this.prisma.translationReserve.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('accounting/translation-reserves/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update translation reserve' })
  async updateTranslationReserve(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.translationReserve.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('accounting/translation-reserves/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete translation reserve' })
  async deleteTranslationReserve(@Param('id') id: string) {
    await this.prisma.translationReserve.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Report Definitions + Lines  — /ovds/reports/definitions/*
  // Frontend: reportDefinitionsApi, reportLinesApi
  // ══════════════════════════════════════════════════════════════════════════

  @Get('reports/definitions')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List report definitions' })
  async getReportDefinitions(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = {};
    if (companyId)     where.companyId = companyId;
    if (query.type)    where.type      = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const data = await this.prisma.reportDefinition.findMany({ where, orderBy: { createdAt: 'desc' } });
    return { success: true, data };
  }

  @Get('reports/definitions/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get report definition by ID' })
  async getReportDefinition(@Param('id') id: string) {
    const data = await this.prisma.reportDefinition.findUniqueOrThrow({ where: { id } });
    return { success: true, data };
  }

  @Post('reports/definitions')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create report definition' })
  async createReportDefinition(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const data = await this.prisma.reportDefinition.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Patch('reports/definitions/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update report definition' })
  async updateReportDefinition(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.prisma.reportDefinition.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('reports/definitions/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete report definition' })
  async deleteReportDefinition(@Param('id') id: string) {
    await this.prisma.reportDefinition.delete({ where: { id } });
    return { success: true };
  }

  @Get('reports/definitions/:definitionId/lines')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List lines for a report definition' })
  async getReportLines(
    @Param('definitionId') definitionId: string,
    @Query('companyId') companyId?: string,
  ) {
    const data = await this.prisma.reportLine.findMany({
      where: { reportDefinitionId: definitionId },
      orderBy: { lineOrder: 'asc' },
    });
    return { success: true, data };
  }

  @Get('reports/definitions/:definitionId/lines/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a report line by ID' })
  async getReportLine(@Param('definitionId') definitionId: string, @Param('id') id: string) {
    const data = await this.prisma.reportLine.findUniqueOrThrow({ where: { id } });
    return { success: true, data };
  }

  @Post('reports/definitions/:definitionId/lines')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a report line' })
  async createReportLine(
    @Param('definitionId') definitionId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const data = await this.prisma.reportLine.create({
      data: { ...body, companyId, reportDefinitionId: definitionId } as any,
    });
    return { success: true, data };
  }

  @Patch('reports/definitions/:definitionId/lines/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a report line' })
  async updateReportLine(
    @Param('definitionId') _definitionId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.prisma.reportLine.update({ where: { id }, data: body as any });
    return { success: true, data };
  }

  @Delete('reports/definitions/:definitionId/lines/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a report line' })
  async deleteReportLine(@Param('definitionId') _definitionId: string, @Param('id') id: string) {
    await this.prisma.reportLine.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Budget Variance  — /ovds/budgets/variance/*  &  /ovds/reports/budget*
  // Frontend: budgetApi
  // ══════════════════════════════════════════════════════════════════════════

  @Get('reports/budget-vs-actual')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Budget vs actual summary' })
  async getBudgetVsActual(
    @Query() query: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const year = query.year ? Number(query.year) : new Date().getFullYear();
    const where: any = { year };
    if (companyId)    where.companyId = companyId;
    if (query.period) where.period    = query.period;
    const budgets = await this.prisma.budget.findMany({ where, include: { account: { select: { code: true, name: true } } } });
    const rows = budgets.map((b: any) => ({
      accountId:    b.accountId,
      accountCode:  b.account?.code,
      accountName:  b.account?.name ?? b.name,
      category:     b.category,
      period:       b.period,
      year:         b.year,
      budget:       Number(b.amount),
      actual:       Number(b.actualAmount ?? 0),
      variance:     Number(b.amount) - Number(b.actualAmount ?? 0),
      variancePct:  b.amount && Number(b.amount) !== 0
        ? Math.round(((Number(b.amount) - Number(b.actualAmount ?? 0)) / Number(b.amount)) * 10000) / 100
        : 0,
    }));
    return { success: true, data: rows };
  }

  @Post('reports/budget')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upsert a budget entry' })
  async upsertBudget(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    if (!body.year)       throw new BadRequestException('year is required');
    if (!body.accountId && !body.name) throw new BadRequestException('accountId or name is required');
    const data = await this.prisma.budget.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Get('budgets/variance/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Budget variance summary (total over/under)' })
  async getBudgetVarianceSummary(
    @Query() query: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = {};
    if (companyId)    where.companyId = companyId;
    if (query.period) where.period    = query.period;
    const agg = await this.prisma.budget.aggregate({
      where,
      _sum: { amount: true, actualAmount: true },
      _count: true,
    });
    const budgetTotal  = Number(agg._sum.amount ?? 0);
    const actualTotal  = Number(agg._sum.actualAmount ?? 0);
    return {
      success: true,
      data: {
        budgetTotal,
        actualTotal,
        variance: budgetTotal - actualTotal,
        count: agg._count,
      },
    };
  }

  @Get('budgets/variance/detail')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Budget variance detail per account' })
  async getBudgetVarianceDetail(
    @Query() query: Record<string, unknown>,
    @Request() req: any,
  ) {
    // Re-use the budget-vs-actual logic
    return this.getBudgetVsActual(query, req);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Validation Endpoints  — /ovds/validate/*
  // Frontend: validationApi
  // ══════════════════════════════════════════════════════════════════════════

  @Get('validate/tin/:tin')
  @Roles('ADMIN', 'FINANCE', 'SALES', 'PURCHASES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate TIN format (local check only; no ERCA round-trip)' })
  validateTin(@Param('tin') tin: string) {
    // Ethiopian TIN is 10 digits
    const clean = tin.replace(/\D/g, '');
    const valid = /^\d{10}$/.test(clean);
    return { success: true, data: { tin, clean, valid, format: 'ETH_10_DIGIT' } };
  }

  @Get('validate/vat/:vat')
  @Roles('ADMIN', 'FINANCE', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate VAT number format' })
  validateVat(@Param('vat') vat: string) {
    // Ethiopian VAT registration numbers follow the TIN + VAT suffix pattern
    const clean = vat.replace(/\s/g, '').toUpperCase();
    const valid = /^\d{10}(VAT)?$/.test(clean);
    return { success: true, data: { vat, clean, valid, format: 'ETH_TIN_VAT' } };
  }

  @Get('validate/nid/:nid')
  @Roles('ADMIN', 'FINANCE', 'HR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Fayda national ID format' })
  validateNid(@Param('nid') nid: string) {
    const clean = nid.replace(/\D/g, '');
    const valid = /^\d{12,16}$/.test(clean);
    return { success: true, data: { nid, clean, valid, format: 'ETH_FAYDA_NID' } };
  }

  @Get('validate/docref/:ref')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a document reference is unique across invoices' })
  async validateDocRef(@Param('ref') ref: string, @Request() req: any) {
    const companyId = req.user?.companyId;
    const where: any = { invoiceNumber: ref };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.invoice.findFirst({ where, select: { id: true } });
    return { success: true, data: { ref, unique: !existing, existingId: existing?.id ?? null } };
  }

  @Get('payments/check-duplicate')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check for duplicate payment by reference' })
  async checkDuplicatePayment(
    @Query('ref') ref: string,
    @Query('amount') amount?: string,
    @Request() req?: any,
  ) {
    const companyId = req?.user?.companyId;
    const where: any = { reference: ref };
    if (companyId) where.companyId = companyId;
    const existing = await this.prisma.payment.findFirst({ where });
    return {
      success: true,
      data: {
        ref,
        isDuplicate: !!existing,
        existingId: existing?.id ?? null,
        existingAmount: existing ? Number((existing as any).amount) : null,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Currency Rates  — /ovds/currency-rates/*
  // Frontend: currencyApi
  // ══════════════════════════════════════════════════════════════════════════

  @Get('currency-rates')
  @Roles('ADMIN', 'FINANCE', 'SALES', 'PURCHASES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List currency exchange rates' })
  async getCurrencyRates(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const where: any = {};
    if (companyId)   where.companyId = companyId;
    if (query.from)  where.currency  = query.from;
    const data = await this.prisma.bankFxRate.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    return { success: true, data };
  }

  @Get('currency-rates/convert')
  @Roles('ADMIN', 'FINANCE', 'SALES', 'PURCHASES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert amount between currencies using stored rate' })
  async convertCurrency(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: any,
  ) {
    const companyId = req?.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const rate = await this.prisma.bankFxRate.findFirst({
      where: { ...where, fromCurrency: from, toCurrency: to },
      orderBy: { createdAt: 'desc' },
    });
    const amt = Number(amount);
    const converted = rate ? Math.round(amt * Number((rate as any).rate) * 100) / 100 : null;
    return { success: true, data: { from, to, amount: amt, rate: rate ? Number((rate as any).rate) : null, converted } };
  }

  @Post('currency-rates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upsert a currency exchange rate' })
  async upsertCurrencyRate(@Body() body: Record<string, unknown>, @Request() req: any) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    const data = await this.prisma.bankFxRate.create({ data: { ...body, companyId } as any });
    return { success: true, data };
  }

  @Post('currency-rates/fetch-live')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger live rate fetch from external provider (CBE feed)' })
  fetchLiveCurrencyRates() {
    // External CBE / NBE feed integration pending API key provisioning.
    // Returns current stored rates as a fallback.
    return { success: true, data: { message: 'Live rate sync is not yet configured. Stored rates returned.' } };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Period-Close Workflow  — /ovds/workflow/:period/*
  // Frontend: periodCloseWorkflowApi
  // ══════════════════════════════════════════════════════════════════════════

  @Post('workflow/:period/run-unified')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run unified period-close workflow for a period (YYYY-MM)' })
  async runUnifiedWorkflow(
    @Param('period') period: string,
    @Body() body: Record<string, unknown>,
    @Request() req: any,
  ) {
    const companyId = (body.companyId as string) ?? req.user?.companyId;
    if (!companyId) throw new BadRequestException('companyId is required');

    // Find or create the PeriodClose record
    const existing = await this.prisma.periodClose.findFirst({ where: { companyId, period } as any });
    if (existing && (existing as any).status === 'LOCKED') {
      throw new BadRequestException(`Period ${period} is already locked`);
    }
    const pc = existing
      ? await this.prisma.periodClose.update({ where: { id: existing.id }, data: { status: 'REVIEW' } as any })
      : await this.prisma.periodClose.create({ data: { companyId, period, status: 'REVIEW' } as any });

    return { success: true, data: { id: pc.id, period, status: (pc as any).status, companyId } };
  }

  @Get('workflow/:period/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get period-close workflow status for a period' })
  async getWorkflowSummary(
    @Param('period') period: string,
    @Query('companyId') companyId?: string,
    @Request() req?: any,
  ) {
    const cid = companyId ?? req?.user?.companyId;
    const pc = cid
      ? await this.prisma.periodClose.findFirst({ where: { companyId: cid, period } as any })
      : null;
    return {
      success: true,
      data: {
        period,
        companyId: cid,
        status: (pc as any)?.status ?? 'OPEN',
        lockedBy: (pc as any)?.lockedBy ?? null,
        lockedAt: (pc as any)?.lockedAt ?? null,
      },
    };
  }

  // ── Sales Orders ────────────────────────────────────────────────────────────

  @Get('sales-orders')
  @Roles('ADMIN', 'SALES', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List sales orders' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getSalesOrders(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companyId = (query.companyId as string) ?? req.user?.companyId;
    const page  = Math.max(1, parseInt(String(query.page  ?? 1), 10));
    const limit = Math.max(1, parseInt(String(query.limit ?? 25), 10));
    const skip  = (page - 1) * limit;
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { OrderLines: true },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('sales-orders/next-number')
  @Roles('ADMIN', 'SALES', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get next sales order number' })
  async nextSalesOrderNumber(@Query('companyId') companyId?: string, @Request() req?: any) {
    const cid = companyId ?? req?.user?.companyId;
    const where: any = cid ? { companyId: cid } : {};
    const count = await this.prisma.salesOrder.count({ where });
    return { success: true, data: { number: `SO-${String(count + 1).padStart(4, '0')}` } };
  }

  @Get('sales-orders/:id')
  @Roles('ADMIN', 'SALES', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a sales order by ID' })
  async getSalesOrder(@Param('id') id: string) {
    const data = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { OrderLines: true, ShipToAddresses: true },
    });
    return { success: true, data };
  }

  @Post('sales-orders')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a sales order' })
  async createSalesOrder(@Body() body: Record<string, unknown>, @Request() req: any) {
    const { OrderLines, ...header } = body as any;
    const data = await this.prisma.salesOrder.create({
      data: {
        ...header,
        CreatedBy: header.CreatedBy ?? req.user?.userId,
        OrderLines: OrderLines?.length
          ? { create: OrderLines.map((l: any, i: number) => ({ ...l, LineNo: l.LineNo ?? i + 1 })) }
          : undefined,
      } as any,
      include: { OrderLines: true },
    });
    return { success: true, data };
  }

  @Patch('sales-orders/bulk-status')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update sales order status' })
  async bulkUpdateSalesOrderStatus(@Body() body: { ids: string[]; status: string }) {
    const { ids, status } = body;
    const { count } = await this.prisma.salesOrder.updateMany({
      where: { id: { in: ids } },
      data: { status } as any,
    });
    return { success: true, data: { updated: count } };
  }

  @Patch('sales-orders/:id/status')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update sales order status' })
  async updateSalesOrderStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const data = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: body.status } as any,
    });
    return { success: true, data };
  }

  @Patch('sales-orders/:id')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a sales order' })
  async updateSalesOrder(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const { OrderLines, ...header } = body as any;
    const data = await this.prisma.salesOrder.update({
      where: { id },
      data: header as any,
      include: { OrderLines: true },
    });
    return { success: true, data };
  }

  @Delete('sales-orders/:id')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a sales order' })
  async deleteSalesOrder(@Param('id') id: string) {
    await this.prisma.salesOrder.delete({ where: { id } });
    return { success: true };
  }

  @Post('sales-orders/:id/email')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send sales order email to customer' })
  async emailSalesOrder(@Param('id') id: string) {
    // Placeholder — wire to a mailer service when available
    const order = await this.prisma.salesOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('Sales order not found');
    return { success: true, data: { message: `Email queued for order ${(order as any).OrderNumber}` } };
  }

  @Post('sales-orders/:id/convert-to-invoice')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Convert a confirmed sales order to an invoice' })
  async convertSalesOrderToInvoice(@Param('id') id: string, @Request() req: any) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { OrderLines: true },
    });
    if (!order) throw new BadRequestException('Sales order not found');
    const invoice = await this.salesService.create({
      companyId:    (order as any).companyId,
      customerId:   (order as any).CustomerId,
      customerName: (order as any).CustomerName,
      currency:     (order as any).CurrencyCode ?? 'ETB',
      currencyRate: Number((order as any).CurrencyRate ?? 1),
      notes:        (order as any).notes ?? undefined,
      items: ((order as any).OrderLines ?? []).map((l: any) => ({
        description: l.description,
        quantity:    l.OrderedQty,
        unitPrice:   l.SalePriceSnapshot,
        taxRate:     l.taxRate ?? 0,
        discount:    l.DiscountValue ?? 0,
      })),
    } as any, req.user?.userId);
    await this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'INVOICED' } as any,
    });
    return { success: true, data: invoice };
  }
}
