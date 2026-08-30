/**
 * EIMS controller — proxies the OVDS frontend's /eims/* calls to the MoR core
 * API and persists the outcome.
 *
 * Every MUTATING endpoint is RBAC-guarded: submitting invoices / receipts and
 * running bulk jobs require ADMIN or FINANCE; cancelling requires ADMIN. Read
 * endpoints (verify, dashboard, registrations) are available to ADMIN/FINANCE.
 *
 * The active company is taken from the `x-company-id` header (set by the
 * frontend api client) so submissions are scoped and the per-company MoR
 * source-system credentials are used.
 */
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WebhookVerificationGuard } from '../common/webhook-verification.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EimsService } from './eims.service';
import {
  RegisterInvoiceInputDto,
  CancelInvoiceDto,
  BulkRegisterDto,
  BulkCancelDto,
  SalesReceiptDto,
  WithholdingReceiptDto,
  RegisterSourceSystemDto,
  BulkCallbackDto,
  SubmitInvoiceSummaryReportDto,
} from './eims.dto';

function companyIdFrom(headers: Record<string, string | undefined>): string {
  const cid = headers['x-company-id'];
  if (!cid) throw new NotFoundException('Missing x-company-id header');
  return cid;
}

@ApiTags('eims')
@Controller('eims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EimsController {
  constructor(private readonly eims: EimsService) {}

  @Get('compliance/readiness')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'EIMS compliance readiness for the company' })
  readiness(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.complianceReadiness(companyIdFrom(headers));
  }

  @Get('compliance/checklist')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'INSA cybersecurity compliance checklist' })
  readinessChecklist() {
    const { INSA_COMPLIANCE_CHECKLIST, getInsaComplianceSummary } = require('@ovds/shared');
    return {
      success: true,
      data: {
        checklist: INSA_COMPLIANCE_CHECKLIST,
        summary: getInsaComplianceSummary(),
      },
    };
  }

  @Get('compliance/bsp-checklist')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoR BSP test case checklist' })
  bspChecklist() {
    return this.eims.bspChecklist();
  }

  @Get('compliance/onboarding')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoR EIMS onboarding checklist' })
  onboardingChecklist() {
    return this.eims.onboardingChecklist();
  }

  @Get('compliance/bsp-report')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoR BSP test case report' })
  bspReport(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.bspReport(companyIdFrom(headers));
  }

  @Post('compliance/bsp-results')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a BSP test case result' })
  recordBspResult(@Headers() headers: Record<string, string | undefined>, @Body() dto: { testCaseId: string; documentNumber?: string; irn?: string; result: 'PASS' | 'FAIL'; notes?: string }) {
    return this.eims.recordBspResult(companyIdFrom(headers), dto);
  }

  @Get('dashboard')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  dashboard(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.complianceReadiness(companyIdFrom(headers));
  }

  @Get('registrations')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  registrations(
    @Headers() headers: Record<string, string | undefined>,
    @Query('status') status?: string,
  ) {
    return this.eims.listRegistrations(companyIdFrom(headers), status);
  }

  @Get('bulk-jobs')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  bulkJobs(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.listBulkJobs(companyIdFrom(headers));
  }

  @Get('source-systems')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  sourceSystems(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.listSourceSystems(companyIdFrom(headers));
  }

  @Post('source-systems')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register / update a MoR EIMS source system' })
  registerSourceSystem(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: RegisterSourceSystemDto,
  ) {
    return this.eims.registerSourceSystem(companyIdFrom(headers), dto);
  }

  @Put('source-systems/:id/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a source system registration' })
  approveSourceSystem(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    return this.eims.updateSourceSystemStatus(companyIdFrom(headers), id, 'APPROVED');
  }

  @Put('source-systems/:id/credentials')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update source system credentials' })
  updateSourceSystemCredentials(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() dto: Record<string, string>,
  ) {
    return this.eims.updateSourceSystemCredentials(companyIdFrom(headers), id, dto);
  }

  @Put('source-systems/:id/step')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update source system onboarding step' })
  updateSourceSystemStep(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() dto: { step: string },
  ) {
    return this.eims.updateSourceSystemStep(companyIdFrom(headers), id, dto.step);
  }

  @Get('source-systems/enterprises')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List MoR enterprises for the company' })
  listEnterprises(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.listEnterprises(companyIdFrom(headers));
  }

  @Get('source-systems/enterprises/:enterpriseId/establishments')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List establishments for a MoR enterprise' })
  listEstablishments(
    @Headers() headers: Record<string, string | undefined>,
    @Param('enterpriseId') enterpriseId: string,
  ) {
    return this.eims.listEstablishments(companyIdFrom(headers), enterpriseId);
  }

  @Get('certificates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS certificates' })
  listCertificates(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.listCertificates(companyIdFrom(headers));
  }

  @Post('certificates/generate-csr')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a CSR for EIMS certificate' })
  generateCsr(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: { tin: string; systemNumber: string; organizationName: string; email: string; organizationalUnitName?: string; sourceSystemId?: string },
  ) {
    return this.eims.generateCsr(companyIdFrom(headers), dto);
  }

  @Post('certificates/:id/install')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Install a signed EIMS certificate' })
  installCertificate(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() dto: { certificatePem: string },
  ) {
    return this.eims.installCertificate(companyIdFrom(headers), id, dto.certificatePem);
  }

  @Post('certificates/:id/submit-csr')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit CSR to MoR for signing' })
  submitCsr(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() dto: { csrPem: string },
  ) {
    return this.eims.submitCsr(companyIdFrom(headers), id, dto.csrPem);
  }

  @Get('certificates/expiry-check')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check certificate expiry status' })
  certificateExpiryCheck(@Headers() headers: Record<string, string | undefined>) {
    return this.eims.certificateExpiryCheck(companyIdFrom(headers));
  }

  @Post('invoices/:id/register')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an OVDS invoice with the MoR EIMS (resolves the MoR payload server-side)' })
  registerInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() dto: RegisterInvoiceInputDto,
  ) {
    return this.eims.registerSalesInvoice(companyIdFrom(headers), id, dto);
  }

  @Post('invoices/submit-summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an invoice summary report to the MoR EIMS' })
  submitInvoiceSummaryReport(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: SubmitInvoiceSummaryReportDto,
  ) {
    return this.eims.submitInvoiceSummaryReport(companyIdFrom(headers), dto);
  }

  @Post('invoices/:id/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a registered invoice with the MoR EIMS' })
  cancelInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.eims.cancelInvoice(companyIdFrom(headers), id, dto);
  }

  @Get('invoices/:id/verify')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OVDS invoice IRN with the MoR EIMS' })
  verifyInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    return this.eims.verifyInvoiceById(companyIdFrom(headers), id);
  }

  @Post('invoices/:id/retry')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry a failed invoice registration' })
  retryInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    return this.eims.retryInvoice(companyIdFrom(headers), id);
  }

  @Get('invoices/:id/registrations')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registration history for an invoice' })
  invoiceRegistrations(
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    return this.eims.listInvoiceRegistrations(companyIdFrom(headers), id);
  }

  @Get('receipts')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS receipts' })
  listReceipts(
    @Headers() headers: Record<string, string | undefined>,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.eims.listReceipts(companyIdFrom(headers), invoiceId);
  }

  @Post('bulk/register')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk-register invoices (async, returns conversationId)' })
  bulkRegister(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: BulkRegisterDto,
  ) {
    // The frontend sends invoiceIds; the per-invoice DTOs are resolved server
    // side before calling the MoR /v1/bulkRegister endpoint.
    return this.eims.bulkRegister(companyIdFrom(headers), dto);
  }

  @Post('bulk/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk-cancel invoices (async, returns conversationId)' })
  bulkCancel(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: BulkCancelDto,
  ) {
    return this.eims.bulkCancel(companyIdFrom(headers), dto);
  }

  @Post('receipts/sales')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a sales receipt with the MoR EIMS' })
  salesReceipt(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: SalesReceiptDto,
  ) {
    return this.eims.registerSalesReceipt(companyIdFrom(headers), dto);
  }

  @Post('receipts/withholding')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a withholding receipt with the MoR EIMS' })
  withholdingReceipt(
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: WithholdingReceiptDto,
  ) {
    return this.eims.registerWithholdingReceipt(companyIdFrom(headers), dto);
  }

  @Post('callbacks/bulk')
  @UseGuards(WebhookVerificationGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoR bulk job callback endpoint' })
  bulkCallback(@Body() dto: BulkCallbackDto) {
    return this.eims.handleBulkCallback(dto.conversationId, dto.status, dto.results);
  }
}
