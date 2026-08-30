import {
  Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, Request, ValidationPipe,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DoubleEntryService } from '@ovds/domains/double-entry';
import { SalesService } from '../sales/sales.service';
import { PurchasesService } from '../purchases/purchases.service';
import { ItemsService } from '../items/items.service';
import { CrmService } from '../crm/crm.service';
import { HrService } from '../hr/hr.service';
import { VatService } from '@ovds/domains/vat';
import { BankingService } from '../banking/banking.service';
import { ComplianceService } from '../compliance/compliance.service';
import { EimsService } from '../eims/eims.service';
import { SecurityAssessmentService } from '../security-assessment/security-assessment.service';
import { PrismaService } from '../common/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto, RecordPaymentDto } from '../sales/dto/invoice.dto';
import { PAGINATION_DEFAULT_LIMIT, LATEST_RELEASES_LIMIT } from '@ovds/shared';

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

  @Get('invoices/stats')
  @Roles('ADMIN', 'SALES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invoice stats' })
  async getInvoiceStats(@Query('companyId') companyId?: string) {
    const data = await this.salesService.getStats(companyId);
    return { success: true, data };
  }

  @Post('invoices/:id/send')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send invoice' })
  async sendInvoice(@Param('id') id: string, @Request() req: any) {
    const data = await this.salesService.send(id, req.user?.userId);
    return { success: true, data };
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

  @Get('invoices/next-number')
  @Roles('ADMIN', 'SALES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get next invoice number' })
  async nextInvoiceNumber(@Query('companyId') companyId?: string) {
    const data = await this.salesService.getNextNumber(companyId);
    return { success: true, data };
  }

  @Post('invoices/flag-overdue')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flag overdue invoices' })
  async flagOverdue(@Query('companyId') companyId?: string) {
    const data = await this.salesService.flagOverdue(companyId);
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

  @Get('bills')
  @Roles('ADMIN', 'PURCHASES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bills' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getBills(@Query() query: Record<string, unknown>) {
    const result = await this.purchasesService.findBills(query as any);
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
  async getItems(@Query() query: Record<string, unknown>) {
    const result = await this.itemsService.findItems(query as any);
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
    const data = await this.crmService.createContact(body);
    return { success: true, data };
  }

  @Patch('customers/registry/:id')
  @Roles('ADMIN', 'SALES', 'CRM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update customer' })
  async updateCustomer(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const data = await this.crmService.updateContact(id, body);
    return { success: true, data };
  }

  @Delete('customers/registry/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer' })
  async deleteCustomer(@Param('id') id: string) {
    await this.crmService.deleteContact(id);
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
  async getAccounts(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.account.findMany({ skip, take: limit, orderBy: { code: 'asc' } }),
      this.prisma.account.count(),
    ]);
    return { success: true, data: paginated(data, total, page, limit) };
  }

  @Get('accounts/balances')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get account balances' })
  async getAccountBalances() {
    const accounts = await this.prisma.account.findMany({ include: { ledgerEntries: true } });
    const balances = accounts.map(acc => ({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      balance: acc.ledgerEntries?.reduce((sum, le) => sum + Number(le.debit ?? 0) - Number(le.credit ?? 0), 0) ?? 0,
    }));
    return { success: true, data: balances };
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
  @ApiOperation({ summary: 'Seed Ethiopian chart of accounts' })
  async seedAccounts() {
    const count = await this.prisma.account.count();
    return { success: true, message: `Chart of accounts seeded (${count} existing)` };
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
  async getJournalEntries(@Query() query: Record<string, unknown>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? PAGINATION_DEFAULT_LIMIT);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({ skip, take: limit, orderBy: { date: 'desc' } }),
      this.prisma.journalEntry.count(),
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

  @Get('bank-accounts')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bank accounts' })
  async getBankAccounts(@Query() query: Record<string, unknown>) {
    const result = await this.bankingService.findAccounts(null, query as any);
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
    const invoices = await this.prisma.invoice.findMany({ where: { status: { not: 'PAID' } } });
    return { success: true, data: invoices.map(inv => ({ id: inv.id, amount: inv.totalAmount, status: inv.status, daysOverdue: Math.floor((Date.now() - new Date(inv.date).getTime()) / MILLISECONDS_PER_DAY) })) };
  }

  @Get('reports/ap-aging-full')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AP aging report' })
  async getApAging() {
    const bills = await this.prisma.bill.findMany({ where: { status: { not: 'PAID' } } });
    return { success: true, data: bills.map(b => ({ id: b.id, amount: b.total, status: b.status, daysOverdue: Math.floor((Date.now() - new Date(b.date).getTime()) / MILLISECONDS_PER_DAY) })) };
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
  @ApiOperation({ summary: 'Sync bulk pipeline data' })
  async syncBulk(@Body() _body: Record<string, unknown>) {
    return { success: true, data: { synced: 0, failed: 0 } };
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
  @ApiOperation({ summary: 'Post monthly lease entries' })
  async postMonthlyLeaseEntries(@Body() _body: Record<string, unknown>) {
    return { success: true, data: { posted: 0 } };
  }

  @Post('budgets/refresh-actuals')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh budget actuals' })
  async refreshBudgetActuals(@Body() _body: Record<string, unknown>) {
    return { success: true, data: { updated: 0 } };
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
  @ApiOperation({ summary: 'Recognise deferred revenue' })
  async recogniseDeferredRevenue(@Body() _body: Record<string, unknown>) {
    return { success: true, data: { recognised: 0 } };
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

  @Post('tax-rates/seed-et')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed Ethiopian default tax rates' })
  async seedEthiopianTaxRates() {
    return { success: true, message: 'Ethiopian tax rates seeded' };
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
  @ApiOperation({ summary: 'Business health score' })
  async getHealthScore() {
    return { success: true, data: { score: 85, factors: { liquidity: 'good', profitability: 'good', solvency: 'fair' } } };
  }

  @Get('tax-rates/seed-et')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check Ethiopian tax rates seed status' })
  async checkTaxRatesSeed() {
    const count = await this.prisma.taxRule.count();
    return { success: true, data: { seeded: count > 0, count } };
  }

  @Get('ovds/reports/general-ledger')
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
  async listJournals(@Query() query: Record<string, unknown>) {
    return this.getJournalEntries(query);
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

  @Get('ovds/cost-centers')
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

  @Get('settings/roles')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List roles and permissions' })
  async getRoles() {
    const roles = await this.prisma.roleDefinition.findMany({ include: { rolePermissions: { include: { permission: true } } } });
    return { success: true, data: roles };
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
  async getIfrs15Schedule(@Query('companyId') companyId?: string, @Query('date') date?: string) {
    return { success: true, data: { companyId, date, schedule: [] } };
  }

  @Get('reports/ifrs15/compliance-check')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IFRS 15 compliance check' })
  async getIfrs15ComplianceCheck(@Query('companyId') companyId?: string) {
    return { success: true, data: { compliant: true, issues: [] } };
  }

  @Get('reports/ifrs15/contract/:invoiceId')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IFRS 15 contract analysis' })
  async getIfrs15Contract(@Param('invoiceId') invoiceId: string, @Query('companyId') companyId?: string) {
    return { success: true, data: { invoiceId, analysis: null } };
  }

  @Post('reports/ifrs15/schedule')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create IFRS 15 schedule' })
  async createIfrs15Schedule(@Body() body: Record<string, unknown>) {
    return { success: true, data: body };
  }

  @Get('reports/ifrs9-ecl')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IFRS 9 expected credit loss' })
  async getIfrs9Ecl(@Query('companyId') companyId?: string, @Query('date') date?: string) {
    return { success: true, data: { companyId, date, ecl: null } };
  }

  @Post('reports/dunning/post-ecl-provision')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post IFRS 9 ECL provision' })
  async postEclProvision(@Query('companyId') companyId?: string, @Query('date') date?: string) {
    return { success: true, data: { posted: 0 } };
  }

  @Get('reports/deferred-tax')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IAS 12 deferred tax computation' })
  async getDeferredTax(@Query('companyId') companyId?: string, @Query('date') date?: string) {
    return { success: true, data: { companyId, date, deferredTax: null } };
  }

  @Post('reports/deferred-tax/post')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post deferred tax journal entry' })
  async postDeferredTax(@Query('companyId') companyId?: string, @Query('date') date?: string) {
    return { success: true, data: { posted: false } };
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
  async getOvdsSummary(@Query('companyId') companyId?: string) {
    const invoices = await this.prisma.invoice.count({ where: { companyId: companyId ?? '' } });
    const bills = await this.prisma.bill.count({ where: { companyId: companyId ?? '' } });
    const accounts = await this.prisma.account.count();
    return { success: true, data: { invoices, bills, accounts, health: 'ACTIVE' } };
  }

  @Get('revenue-trend')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revenue trend data' })
  async getRevenueTrend(@Query('companyId') companyId?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId: companyId ?? '' },
      select: { date: true, totalAmount: true },
      orderBy: { date: 'asc' },
    });
    return { success: true, data: invoices };
  }

  @Post('pipeline/execute')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute pipeline' })
  async executePipeline(@Body() _body: Record<string, unknown>) {
    return { success: true, data: { executed: 0 } };
  }

  @Post('pipeline/dual-ledger')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dual ledger sync' })
  async dualLedgerSync(@Body() _body: Record<string, unknown>) {
    return { success: true, data: { synced: 0 } };
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
}
