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
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WebhookVerificationGuard } from '../common/webhook-verification.guard';


import { EimsDataRegistryService } from './eims-data-registry.service';
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
import { EimsService } from './eims.service';

/**
 * Resolve the active companyId from:
 *   1. `x-company-id` request header (set by the EIMS frontend API client)
 *   2. JWT user payload on the request object (fallback for authenticated requests without the header)
 * Returns empty string when neither source provides a value — callers should treat '' as "no company".
 */
function companyIdFrom(headers: Record<string, string | undefined>, req?: any): string {
  return headers['x-company-id'] ?? req?.user?.companyId ?? '';
}

@ApiTags('eims')
@Controller('eims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EimsController {
  constructor(
    private readonly eims: EimsService,
    private readonly registry: EimsDataRegistryService,
  ) {}

  @Get('compliance/readiness')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'EIMS compliance readiness for the company' })
  readiness(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    const cid = companyIdFrom(headers, req);
    if (!cid) return { success: true, data: { ready: false, progress: 0, steps: [] } };
    return this.eims.complianceReadiness(cid);
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
  bspReport(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.bspReport(companyIdFrom(headers, req));
  }

  @Post('compliance/bsp-results')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a BSP test case result' })
  recordBspResult(@Headers() headers: Record<string, string | undefined>, @Request() req: any, @Body() dto: { testCaseId: string; documentNumber?: string; irn?: string; result: 'PASS' | 'FAIL'; notes?: string }) {
    return this.eims.recordBspResult(companyIdFrom(headers, req), dto);
  }

  @Get('dashboard')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  dashboard(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.complianceReadiness(companyIdFrom(headers, req));
  }

  @Get('registrations')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  registrations(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Query('status') status?: string,
  ) {
    return this.eims.listRegistrations(companyIdFrom(headers, req), status);
  }

  @Get('bulk-jobs')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  bulkJobs(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.listBulkJobs(companyIdFrom(headers, req));
  }

  @Get('source-systems')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  sourceSystems(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.listSourceSystems(companyIdFrom(headers, req));
  }

  @Post('source-systems')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register / update a MoR EIMS source system' })
  registerSourceSystem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: RegisterSourceSystemDto,
  ) {
    return this.eims.registerSourceSystem(companyIdFrom(headers, req), dto);
  }

  // Static sub-paths MUST come before parameterised (:id) routes so NestJS
  // (Express) does not mistake the literal segment for a parameter value.
  @Get('source-systems/enterprises')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List MoR enterprises for the company' })
  listEnterprises(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.listEnterprises(companyIdFrom(headers, req));
  }

  @Get('source-systems/enterprises/:enterpriseId/establishments')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List establishments for a MoR enterprise' })
  listEstablishments(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('enterpriseId') enterpriseId: string,
  ) {
    return this.eims.listEstablishments(companyIdFrom(headers, req), enterpriseId);
  }

  @Put('source-systems/:id/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a source system registration' })
  approveSourceSystem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.updateSourceSystemStatus(companyIdFrom(headers, req), id, 'APPROVED');
  }

  @Put('source-systems/:id/credentials')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update source system credentials' })
  updateSourceSystemCredentials(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: Record<string, string>,
  ) {
    return this.eims.updateSourceSystemCredentials(companyIdFrom(headers, req), id, dto);
  }

  @Put('source-systems/:id/step')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update source system onboarding step' })
  updateSourceSystemStep(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: { step: string },
  ) {
    return this.eims.updateSourceSystemStep(companyIdFrom(headers, req), id, dto.step);
  }

  @Get('certificates')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS certificates' })
  listCertificates(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.listCertificates(companyIdFrom(headers, req));
  }

  // Static sub-paths MUST come before parameterised (:id) routes.
  @Get('certificates/expiry-check')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check certificate expiry status' })
  certificateExpiryCheck(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.certificateExpiryCheck(companyIdFrom(headers, req));
  }

  @Post('certificates/generate-csr')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a CSR for EIMS certificate' })
  generateCsr(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() dto: {
      tin: string;
      systemNumber: string;
      organizationName: string;
      email: string;
      organizationalUnitName?: string;
      countryName?: string;
      stateOrProvinceName?: string;
      localityName?: string;
      sourceSystemId?: string;
    },
  ) {
    return this.eims.generateCsr(companyIdFrom(headers, req), dto);
  }

  @Post('certificates/:id/install')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Install a signed EIMS certificate' })
  installCertificate(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: { certificatePem: string },
  ) {
    return this.eims.installCertificate(companyIdFrom(headers, req), id, dto.certificatePem);
  }

  @Post('certificates/:id/submit-csr')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit CSR to MoR for signing' })
  submitCsr(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: { csrPem: string },
  ) {
    return this.eims.submitCsr(companyIdFrom(headers, req), id, dto.csrPem);
  }

  // Static sub-paths MUST come before parameterised (:id) routes.
  @Post('invoices/submit-summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an invoice summary report to the MoR EIMS' })
  submitInvoiceSummaryReport(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: SubmitInvoiceSummaryReportDto,
  ) {
    return this.eims.submitInvoiceSummaryReport(companyIdFrom(headers, req), dto);
  }

  @Post('invoices/:id/register')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an OVDS invoice with the MoR EIMS (resolves the MoR payload server-side)' })
  registerInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: RegisterInvoiceInputDto,
  ) {
    return this.eims.registerSalesInvoice(companyIdFrom(headers, req), id, dto);
  }

  @Post('invoices/:id/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a registered invoice with the MoR EIMS' })
  cancelInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.eims.cancelInvoice(companyIdFrom(headers, req), id, dto);
  }

  @Get('invoices/:id/verify')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OVDS invoice IRN with the MoR EIMS' })
  verifyInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.verifyInvoiceById(companyIdFrom(headers, req), id);
  }

  @Post('invoices/:id/retry')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry a failed invoice registration' })
  retryInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.retryInvoice(companyIdFrom(headers, req), id);
  }

  @Get('invoices/:id/registrations')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registration history for an invoice' })
  invoiceRegistrations(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.listInvoiceRegistrations(companyIdFrom(headers, req), id);
  }

  @Get('receipts')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List EIMS receipts' })
  listReceipts(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Query('invoiceId') invoiceId?: string,
  ) {
    return this.eims.listReceipts(companyIdFrom(headers, req), invoiceId);
  }

  @Post('bulk/register')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk-register invoices (async, returns conversationId)' })
  bulkRegister(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: BulkRegisterDto,
  ) {
    // The frontend sends invoiceIds; the per-invoice DTOs are resolved server
    // side before calling the MoR /v1/bulkRegister endpoint.
    return this.eims.bulkRegister(companyIdFrom(headers, req), dto);
  }

  @Post('bulk/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk-cancel invoices (async, returns conversationId)' })
  bulkCancel(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: BulkCancelDto,
  ) {
    return this.eims.bulkCancel(companyIdFrom(headers, req), dto);
  }

  @Post('receipts/sales')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a sales receipt with the MoR EIMS' })
  salesReceipt(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: SalesReceiptDto,
  ) {
    return this.eims.registerSalesReceipt(companyIdFrom(headers, req), dto);
  }

  @Post('receipts/withholding')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a withholding receipt with the MoR EIMS' })
  withholdingReceipt(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: WithholdingReceiptDto,
  ) {
    return this.eims.registerWithholdingReceipt(companyIdFrom(headers, req), dto);
  }

  @Post('callbacks/bulk')
  @UseGuards(WebhookVerificationGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoR bulk job callback endpoint' })
  bulkCallback(@Body() dto: BulkCallbackDto) {
    return this.eims.handleBulkCallback(dto.conversationId, dto.status, dto.results);
  }

  // ── Cyber Audit ──────────────────────────────────────────────────────────────
  // Static sub-paths before parameterised (:id) routes.

  @Get('cyber-audit/checklist')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'INSA cybersecurity audit checklist template' })
  cyberAuditChecklist() {
    return this.eims.getCyberAuditChecklist();
  }

  @Get('cyber-audit')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List cyber audits for the company' })
  listCyberAudits(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.listCyberAudits(companyIdFrom(headers, req));
  }

  @Post('cyber-audit')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cyber audit' })
  createCyberAudit(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: { title: string; description?: string; conductedBy?: string },
  ) {
    return this.eims.createCyberAudit(companyIdFrom(headers, req), dto);
  }

  @Get('cyber-audit/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a cyber audit with metrics and findings' })
  getCyberAudit(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.getCyberAudit(companyIdFrom(headers, req), id);
  }

  @Put('cyber-audit/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a cyber audit' })
  updateCyberAudit(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: { title?: string; description?: string; conductedBy?: string },
  ) {
    return this.eims.updateCyberAudit(companyIdFrom(headers, req), id, dto);
  }

  @Post('cyber-audit/:id/delete')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a cyber audit' })
  deleteCyberAudit(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.deleteCyberAudit(companyIdFrom(headers, req), id);
  }

  @Post('cyber-audit/:id/start')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a cyber audit (set status to IN_PROGRESS)' })
  startCyberAudit(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.startCyberAudit(companyIdFrom(headers, req), id);
  }

  @Post('cyber-audit/:id/complete')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a cyber audit (set status to COMPLETED)' })
  completeCyberAudit(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.completeCyberAudit(companyIdFrom(headers, req), id);
  }

  @Get('cyber-audit/:id/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cyber audit summary (scores, finding counts)' })
  cyberAuditSummary(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.getCyberAuditSummary(companyIdFrom(headers, req), id);
  }

  @Get('cyber-audit/:id/metrics')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List metrics for a cyber audit' })
  cyberAuditMetrics(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.getCyberAuditMetrics(companyIdFrom(headers, req), id);
  }

  @Put('cyber-audit/:id/metrics/:metricId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a cyber audit metric (status, evidence, remarks)' })
  updateCyberAuditMetric(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Param('metricId') metricId: string,
    @Body() dto: { status?: string; evidence?: string; remarks?: string },
  ) {
    return this.eims.updateCyberAuditMetric(companyIdFrom(headers, req), id, metricId, dto);
  }

  @Get('cyber-audit/:id/findings')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List findings for a cyber audit' })
  cyberAuditFindings(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.getCyberAuditFindings(companyIdFrom(headers, req), id);
  }

  @Post('cyber-audit/:id/findings')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a finding for a cyber audit' })
  createCyberAuditFinding(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: { severity: string; title: string; description: string; remediation?: string; assignedTo?: string; metricId?: string },
  ) {
    return this.eims.createCyberAuditFinding(companyIdFrom(headers, req), id, dto);
  }

  @Put('cyber-audit/:auditId/findings/:findingId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a cyber audit finding' })
  updateCyberAuditFinding(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('auditId') auditId: string,
    @Param('findingId') findingId: string,
    @Body() dto: { severity?: string; title?: string; description?: string; remediation?: string; status?: string; assignedTo?: string },
  ) {
    return this.eims.updateCyberAuditFinding(companyIdFrom(headers, req), auditId, findingId, dto);
  }

  @Post('cyber-audit/:auditId/findings/:findingId/delete')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a cyber audit finding' })
  deleteCyberAuditFinding(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('auditId') auditId: string,
    @Param('findingId') findingId: string,
  ) {
    return this.eims.deleteCyberAuditFinding(companyIdFrom(headers, req), auditId, findingId);
  }

  // ── Master Compliance Checklist ──────────────────────────────────────────────
  // Static sub-paths before parameterised (:id) routes.

  @Get('master-compliance/template')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the BSP master compliance checklist template' })
  masterComplianceTemplate() {
    return this.eims.getMasterComplianceTemplate();
  }

  @Get('master-compliance/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summary of all master compliance checklists for the company' })
  masterComplianceSummary(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.getMasterComplianceSummary(companyIdFrom(headers, req));
  }

  @Get('master-compliance')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List master compliance checklists for the company' })
  listMasterCompliance(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.listMasterCompliance(companyIdFrom(headers, req));
  }

  @Post('master-compliance')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a master compliance checklist (pre-populated with BSP template items)' })
  createMasterCompliance(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: { title: string; bspName?: string; bspTin?: string; testingLocation?: string; systemType?: string; systemName?: string },
  ) {
    return this.eims.createMasterCompliance(companyIdFrom(headers, req), dto);
  }

  @Get('master-compliance/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a master compliance checklist with all items' })
  getMasterCompliance(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.getMasterCompliance(companyIdFrom(headers, req), id);
  }

  @Put('master-compliance/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a master compliance checklist header' })
  updateMasterCompliance(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: {
      title?: string; status?: string; bspName?: string; bspTin?: string;
      testingLocation?: string; systemType?: string; systemName?: string;
      hostingType?: string; versionBuild?: string; testedEnv?: string;
      testerName?: string; testerSignature?: string;
      testDate?: string; releaseDate?: string;
    },
  ) {
    return this.eims.updateMasterCompliance(companyIdFrom(headers, req), id, dto);
  }

  @Post('master-compliance/:id/delete')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a master compliance checklist' })
  deleteMasterCompliance(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.deleteMasterCompliance(companyIdFrom(headers, req), id);
  }

  @Get('master-compliance/:id/items')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List items for a master compliance checklist' })
  listMasterComplianceItems(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.listMasterComplianceItems(companyIdFrom(headers, req), id);
  }

  @Put('master-compliance/:id/items/:itemId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a master compliance checklist item (status, resultData, remarks)' })
  updateMasterComplianceItem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: { status?: string; resultData?: string; remarks?: string },
  ) {
    return this.eims.updateMasterComplianceItem(companyIdFrom(headers, req), id, itemId, dto);
  }

  // ── Accreditation Checklist ───────────────────────────────────────────────────
  // Static sub-paths before parameterised (:id) routes.

  @Get('accreditation/summary')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summary of all accreditation checklists for the company' })
  accreditationSummary(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.getAccreditationSummary(companyIdFrom(headers, req));
  }

  @Get('accreditation')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List accreditation checklists for the company' })
  listAccreditations(@Headers() headers: Record<string, string | undefined>, @Request() req: any) {
    return this.eims.listAccreditations(companyIdFrom(headers, req));
  }

  @Post('accreditation')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an accreditation checklist (Directive No. 1142/2026)' })
  createAccreditation(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Body() dto: { title: string; softwareType?: string; softwareName?: string; softwareVersion?: string; providerCompanyName?: string; providerContactName?: string },
  ) {
    return this.eims.createAccreditation(companyIdFrom(headers, req), dto);
  }

  @Get('accreditation/:id')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an accreditation checklist with all items' })
  getAccreditation(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.getAccreditation(companyIdFrom(headers, req), id);
  }

  @Put('accreditation/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an accreditation checklist' })
  updateAccreditation(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Body() dto: {
      title?: string; status?: string; dateOfAdmission?: string; dateOfReport?: string;
      softwareType?: string; softwareName?: string; softwareVersion?: string;
      providerContactName?: string; providerCompanyName?: string; providerPosition?: string;
      providerAddress?: string; providerMobile?: string; providerTelephone?: string;
      providerFax?: string; providerEmail?: string;
      ownerLegalName?: string; ownerAddress?: string; ownerCity?: string;
      ownerCountry?: string; ownerTelephone?: string; ownerContactName?: string; ownerWebEmail?: string;
      strengths?: string; nonConformities?: string; observations?: string;
      finalDecision?: string; conditionDetails?: string; signatures?: string;
    },
  ) {
    return this.eims.updateAccreditation(companyIdFrom(headers, req), id, dto);
  }

  @Post('accreditation/:id/delete')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an accreditation checklist' })
  deleteAccreditation(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.deleteAccreditation(companyIdFrom(headers, req), id);
  }

  @Get('accreditation/:id/items')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List items for an accreditation checklist' })
  listAccreditationItems(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    return this.eims.listAccreditationItems(companyIdFrom(headers, req), id);
  }

  @Put('accreditation/:id/items/:itemId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an accreditation checklist item (status, comment, evidence)' })
  updateAccreditationItem(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: { status?: string; comment?: string; evidence?: string },
  ) {
    return this.eims.updateAccreditationItem(companyIdFrom(headers, req), id, itemId, dto);
  }

  // ── Data-Mapping Registry endpoints ───────────────────────────────────────

  /**
   * GET /eims/registry
   * Returns the complete OVDS ↔ MoR field-mapping registry.
   * Useful for admin diagnostics and audit trail documentation.
   */
  @Get('registry')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OVDS ↔ MoR EIMS field-mapping registry (all field translations)' })
  getFieldRegistry() {
    return {
      success: true,
      data: this.registry.getFieldRegistry(),
    };
  }

  /**
   * GET /eims/registry/resolve?ovdsField=Invoice.invoiceNumber
   * Resolve the MoR JSON path for a given OVDS field name.
   */
  @Get('registry/resolve')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve the MoR JSON path for an OVDS field name' })
  resolveMorPath(@Query('ovdsField') ovdsField: string) {
    if (!ovdsField) {
      return { success: false, message: 'ovdsField query param is required' };
    }
    const morPath = this.registry.resolveMorPath(ovdsField);
    return {
      success: !!morPath,
      data: { ovdsField, morPath: morPath ?? null },
    };
  }

  /**
   * GET /eims/summary/compile?from=2024-01-01&to=2024-01-31&reportType=MONTHLY
   * Compile the MoR invoice summary report from the OVDS ledger for the given
   * period — preview without submitting.
   */
  @Get('summary/compile')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compile MoR invoice summary report from OVDS ledger (preview, no submission)' })
  async compileSummary(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Query('from') from: string,
    @Query('to') to: string,
    @Query('reportType') reportType?: 'DAILY' | 'MONTHLY' | 'QUARTERLY',
  ) {
    const companyId = companyIdFrom(headers, req);
    const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
    const toDate = to ? new Date(to) : new Date();
    const report = await this.registry.compileSummaryReport(
      companyId,
      fromDate,
      toDate,
      reportType ?? 'DAILY',
    );
    return { success: true, data: report };
  }

  /**
   * GET /eims/invoices/:id/preflight
   * Run Ethiopian tax-law compliance pre-flight checks on an invoice before
   * submitting it to the MoR.
   */
  @Get('invoices/:id/preflight')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run AABE/ERCA compliance pre-flight checks on an invoice before MoR submission' })
  async preflightInvoice(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any, @Param('id') id: string,
  ) {
    const result = await this.registry.runCompliancePreFlight(companyIdFrom(headers, req), id);
    return { success: true, data: result };
  }
}
