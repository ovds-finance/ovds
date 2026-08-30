import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VatService, SubmitVatDeclarationDto, TaxDeclarationStatus } from '@ovds/domains/vat';
import { TaxSerializationInterceptor } from '../common/tax-serialization.interceptor';
import { EthiopianTinPipe } from '../common/ethiopian-tin.pipe';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('vat')
@Controller('vat')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TaxSerializationInterceptor)
export class VatController {
  constructor(private readonly vatService: VatService) {}

  @Get('filings')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT filings' })
  getFilings() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('filings/calculate')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate VAT filing' })
  calculateFiling(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vat-' + Date.now() } };
  }

  @Get('summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT summary' })
  getSummary() {
    return { success: true, data: { totalOutputVat: 0, totalInputVat: 0, netPayable: 0 } };
  }

  @Get('dashboard')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT dashboard' })
  getDashboard() {
    return { success: true, data: { totalOutputVat: 0, totalInputVat: 0, netPayable: 0 } };
  }

  @Get('input-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT input ledger' })
  getInputLedger() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Delete('input-ledger/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete VAT input ledger entry' })
  deleteInputLedger(@Param('id') id: string) {
    return { success: true };
  }

  @Get('output-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT output ledger' })
  getOutputLedger() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Delete('output-ledger/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete VAT output ledger entry' })
  deleteOutputLedger(@Param('id') id: string) {
    return { success: true };
  }

  @Get('withholding')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT withholding' })
  getWithholding() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Patch('withholding/:id/toggle-remitted')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle VAT withholding remitted' })
  toggleWithholding(@Param('id') id: string) {
    return { success: true };
  }

  @Get('irn')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'IRN records' })
  getIrn() {
    return { success: true, data: [] };
  }

  @Post('irn/generate')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate IRN' })
  generateIrn(@Body() body: any) {
    return { success: true, data: { ...body, id: 'irn-' + Date.now() } };
  }

  @Get('irn/:invoiceId')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get IRN for invoice' })
  getIrnForInvoice(@Param('invoiceId') invoiceId: string) {
    return { success: true, data: { invoiceId, irn: null } };
  }

  @Post('filings/:filingId/lock')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock VAT filing' })
  lockFiling(@Param('filingId') filingId: string) {
    return { success: true, data: { filingId, locked: true } };
  }

  @Patch('filings/:filingId/apportionment')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update VAT filing apportionment' })
  updateApportionment(@Param('filingId') filingId: string, @Body() body: any) {
    return { success: true, data: { filingId, ...body } };
  }

  @Post('declarations/submit')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit VAT declaration' })
  async submitDeclaration(@Body(EthiopianTinPipe) dto: SubmitVatDeclarationDto) {
    const result = await this.vatService.processAndPersistDeclaration(dto);
    return { success: true, data: result };
  }

  @Get('declarations/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get VAT declaration with line items' })
  async getDeclaration(@Param('id') id: string) {
    const result = await this.vatService.getDeclarationWithDetails(id);
    return { success: true, data: result };
  }

  @Get('declarations')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List VAT declarations by period' })
  async getDeclarations(@Query() query: { companyId: string; taxPeriod: string }) {
    const result = await this.vatService.getDeclarationsByPeriod(query.companyId, query.taxPeriod);
    return { success: true, data: result };
  }

  @Post('input-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create VAT input ledger entry' })
  createInputLedger(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vil-' + Date.now() } };
  }

  @Post('output-ledger')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create VAT output ledger entry' })
  createOutputLedger(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vol-' + Date.now() } };
  }

  @Post('withholding')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create VAT withholding entry' })
  createWithholding(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vwh-' + Date.now() } };
  }

  @Delete('withholding/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete VAT withholding entry' })
  deleteWithholding(@Param('id') id: string) {
    return { success: true };
  }

  @Get('reverse-charges')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT reverse charges' })
  getReverseCharges() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('reverse-charges')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create VAT reverse charge' })
  createReverseCharge(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vrc-' + Date.now() } };
  }

  @Delete('reverse-charges/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete VAT reverse charge' })
  deleteReverseCharge(@Param('id') id: string) {
    return { success: true };
  }

  @Get('refund-claims')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT refund claims' })
  getRefundClaims() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('refund-claims')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create VAT refund claim' })
  createRefundClaim(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vrc-' + Date.now() } };
  }

  @Patch('refund-claims/:id/status')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update VAT refund claim status' })
  updateRefundClaimStatus(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { id, ...body } };
  }

  @Delete('refund-claims/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete VAT refund claim' })
  deleteRefundClaim(@Param('id') id: string) {
    return { success: true };
  }

  @Get('notes')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT notes' })
  getNotes() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('notes')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create VAT note' })
  createNote(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vnt-' + Date.now() } };
  }

  @Delete('notes/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete VAT note' })
  deleteNote(@Param('id') id: string) {
    return { success: true };
  }

  @Get('export-evidence')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT export evidence' })
  getExportEvidence() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('export-evidence')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create VAT export evidence' })
  createExportEvidence(@Body() body: any) {
    return { success: true, data: { ...body, id: 'vee-' + Date.now() } };
  }

  @Patch('export-evidence/:id/cycle/:field')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cycle VAT export evidence field status' })
  cycleExportEvidence(@Param('id') id: string, @Param('field') field: string) {
    return { success: true, data: { id, [field]: 'partial' } };
  }

  @Delete('export-evidence/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete VAT export evidence' })
  deleteExportEvidence(@Param('id') id: string) {
    return { success: true };
  }

  @Get('etax-submissions')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'eTax submissions' })
  getEtaxSubmissions() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post('etax-submissions')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit eTax return' })
  submitEtax(@Body() body: any) {
    return { success: true, data: { ...body, id: 'etax-' + Date.now(), ercaReferenceNo: 'ERCA-' + Date.now() } };
  }

  @Get('period-summary/:period')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VAT period summary' })
  getPeriodSummary(@Param('period') period: string, @Query('companyId') companyId?: string) {
    return { success: true, data: { totalOutputVat: 0, totalInputVat: 0, claimableInputVat: 0, netPayable: 0, totalWithheld: 0, totalReverseCharge: 0, pendingRefunds: 0, unremittedWithholding: 0, reverseCharge: [], refundClaims: [], withholding: [], inputLedger: [], outputLedger: [] } };
  }

  @Get('filings/:filingId/apportionment')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get VAT filing apportionment' })
  getFilingApportionment(@Param('filingId') filingId: string) {
    return { success: true, data: { filingId, apportionmentPct: 1.0, totalInputVat: 0, claimableInputVat: 0, nonClaimableInputVat: 0, periodLocked: false } };
  }

  @Patch('input-ledger/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update VAT input ledger entry' })
  updateInputLedger(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { id, ...body } };
  }

  @Patch('output-ledger/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update VAT output ledger entry' })
  updateOutputLedger(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { id, ...body } };
  }
}
