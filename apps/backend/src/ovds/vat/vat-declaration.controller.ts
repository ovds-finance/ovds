/**
 * @file vat-declaration.controller.ts
 * @module OvdsVatModule
 *
 * REST surface for the VAT Declaration engine.
 *
 * Route prefix: /api/vat
 *
 * Endpoints
 * ─────────
 *  GET    /vat/modules                         — catalogue of all installed country modules
 *  GET    /vat/modules/tenant                  — modules active for calling tenant
 *  POST   /vat/modules/activate                — activate one or more country modules
 *  POST   /vat/modules/deactivate              — deactivate modules
 *
 *  POST   /vat/calculate                       — real-time VAT calculation
 *  POST   /vat/validate                        — compliance check without persisting
 *  GET    /vat/periods/:countryCode/:year       — filing periods for a year
 *
 *  POST   /vat/returns/build                   — build a VAT return draft from ledger
 *  POST   /vat/reports/render                  — render a report (PDF/XLSX/XML/JSON/CSV)
 *  GET    /vat/reports/templates/:countryCode  — available templates for a country
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';

import { Permissions }      from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard }     from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';

import {
  CalculateVatSchema,
  BuildReturnSchema,
  RenderReportSchema,
  ActivateModulesSchema,
  DeactivateModulesSchema,
  GetPeriodsSchema,
  SaveFilingSchema,
  ListFilingsSchema,
  SubmitFilingSchema,
  AmendFilingSchema,
  RecordAckSchema,
} from './dto/vat-declaration.dto';
import { VatModuleGuard }   from './guards/vat-module.guard';
import { VatDeclarationOrchestrator } from './vat-declaration.orchestrator';
import { VatFilingService }           from './vat-filing.service';

@ApiTags('VAT Declaration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vat')
export class VatDeclarationController {
  constructor(
    private readonly orchestrator: VatDeclarationOrchestrator,
    private readonly filingService: VatFilingService,
  ) {}

  // ── Module catalogue ──────────────────────────────────────────────────────

  @Get('modules')
  @Permissions('vat:read')
  @ApiOperation({ summary: 'List all installed country VAT modules' })
  getCatalogue() {
    return {
      success: true,
      data: this.orchestrator.getCatalogue(),
    };
  }

  @Get('modules/tenant')
  @Permissions('vat:read')
  @ApiOperation({ summary: 'List VAT modules active for the calling tenant' })
  getTenantModules(@Req() req: Request) {
    const tenantId = (req as any).user?.companyId ?? null;
    // Super-admins may have no companyId — return empty catalogue rather than throwing
    if (!tenantId) {
      return { success: true, data: [] };
    }
    return {
      success: true,
      data: this.orchestrator.getCatalogueForTenant(tenantId),
    };
  }

  @Post('modules/activate')
  @Permissions('vat:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate one or more country VAT modules for this tenant' })
  @ApiResponse({ status: 200, description: 'Modules activated' })
  async activateModules(@Req() req: Request, @Body() body: unknown) {
    const dto     = ActivateModulesSchema.parse(body);
    const user    = (req as any).user;
    const tenantId = user?.companyId;

    await this.orchestrator.activateModules({
      tenantId,
      countryCodes: dto.countryCodes,
      activatedBy:  user?.userId ?? 'system',
    });

    return { success: true, message: `Activated: ${dto.countryCodes.join(', ')}` };
  }

  @Post('modules/deactivate')
  @Permissions('vat:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate country VAT modules for this tenant' })
  async deactivateModules(@Req() req: Request, @Body() body: unknown) {
    const dto      = DeactivateModulesSchema.parse(body);
    const user     = (req as any).user;
    const tenantId = user?.companyId;

    await this.orchestrator.deactivateModules(
      tenantId,
      dto.countryCodes,
      user?.userId ?? 'system',
    );

    return { success: true, message: `Deactivated: ${dto.countryCodes.join(', ')}` };
  }

  // ── VAT Calculation ───────────────────────────────────────────────────────

  @Post('calculate')
  @Permissions('vat:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate VAT for a single transaction in real-time' })
  @ApiResponse({ status: 200, description: 'VatResult with lines, totals, and effective rate' })
  calculate(@Req() req: Request, @Body() body: unknown) {
    const dto      = CalculateVatSchema.parse(body);
    const tenantId = (req as any).user?.companyId;

    const result = this.orchestrator.calculate({ tenantId, ...dto });
    return { success: true, data: result };
  }

  @Post('validate')
  @Permissions('vat:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run compliance validation on a transaction (no DB write)' })
  async validateTransaction(@Req() req: Request, @Body() body: unknown) {
    const dto      = CalculateVatSchema.parse(body);
    const tenantId = (req as any).user?.companyId;

    const result = await this.orchestrator.validate({ tenantId, ...dto });
    return { success: true, data: result };
  }

  // ── Filing Periods ────────────────────────────────────────────────────────

  @Get('periods/:countryCode/:year')
  @Permissions('vat:read')
  @UseGuards(VatModuleGuard)
  @ApiOperation({ summary: 'Get VAT filing periods for a jurisdiction and year' })
  getPeriods(
    @Req()  req:         Request,
    @Param('countryCode') countryCode: string,
    @Param('year', ParseIntPipe) year: number,
    @Query('frequency')   frequency?: string,
  ) {
    const tenantId = (req as any).user?.companyId;
    const dto      = GetPeriodsSchema.parse({ countryCode, year, frequency });
    const periods  = this.orchestrator.getPeriods(tenantId, dto.countryCode, dto.year);
    return { success: true, data: periods };
  }

  // ── Return Builder ────────────────────────────────────────────────────────

  @Post('returns/build')
  @Permissions('vat:write')
  @UseGuards(VatModuleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build a VAT return draft from ledger data for a given period' })
  async buildReturn(@Req() req: Request, @Body() body: unknown, @Query('save') save?: string) {
    const dto      = BuildReturnSchema.parse(body);
    const user     = (req as any).user;
    const tenantId = user?.companyId as string;

    // ?save=true auto-persists the draft to VatFilingRecord
    const returnDraft = save === 'true'
      ? await this.orchestrator.buildAndSave({ tenantId, ...dto }, user?.userId ?? 'system')
      : await this.orchestrator.buildReturn({ tenantId, ...dto });

    return { success: true, data: returnDraft };
  }

  // ── Report Rendering ──────────────────────────────────────────────────────

  @Get('reports/templates/:countryCode')
  @Permissions('vat:read')
  @ApiOperation({ summary: 'List available report templates for a country' })
  getTemplates(@Param('countryCode') countryCode: string) {
    const templates = this.orchestrator.getTemplatesForCountry(countryCode);
    return { success: true, data: templates };
  }

  @Post('reports/render')
  @Permissions('vat:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Render a VAT report in the requested format' })
  @ApiResponse({ status: 200, description: 'Binary (PDF/XLSX) or text (XML/JSON/CSV) report' })
  async renderReport(
    @Req()  req:  Request,
    @Res()  res:  Response,
    @Body() body: unknown,
  ) {
    const dto      = RenderReportSchema.parse(body);
    const tenantId = (req as any).user?.companyId;

    const result = await this.orchestrator.renderReport({
      tenantId,
      templateId: dto.templateId,
      format:     dto.format,
      periodKey:  dto.periodKey,
      meta: {
        ...dto.meta,
        countryCode: dto.meta.countryCode ?? dto.templateId.slice(0, 2).toUpperCase(),
      },
    });

    // Binary formats — stream as attachment
    if (result.buffer) {
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('X-Rendered-At', result.renderedAt);
      return res.send(result.buffer);
    }

    // Text formats — return JSON envelope with content field
    return res.status(HttpStatus.OK).json({
      success:    true,
      filename:   result.filename,
      mimeType:   result.mimeType,
      content:    result.content,
      renderedAt: result.renderedAt,
    });
  }

  // ── Filing Persistence ────────────────────────────────────────────────────
  //
  //  POST   /vat/filings/save           — save (upsert) a DRAFT
  //  GET    /vat/filings                — list filings for this tenant
  //  GET    /vat/filings/:id            — get one filing
  //  GET    /vat/filings/:id/events     — immutable audit trail
  //  POST   /vat/filings/:id/submit     — transition DRAFT → SUBMITTED
  //  POST   /vat/filings/:id/ack        — record ACCEPTED / REJECTED from authority
  //  POST   /vat/filings/:id/amend      — create amendment (new DRAFT from submitted)

  @Post('filings/save')
  @Permissions('vat:write')
  @UseGuards(VatModuleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save (create or update) a VAT return draft' })
  @ApiResponse({ status: 200, description: 'FilingRecord in DRAFT status' })
  async saveFiling(@Req() req: Request, @Body() body: unknown) {
    const dto      = SaveFilingSchema.parse(body);
    const user     = (req as any).user;
    const tenantId = user?.companyId as string;
    const actorId  = user?.userId ?? 'system';

    const filing = await this.filingService.saveDraft(tenantId, dto, actorId);
    return { success: true, data: filing };
  }

  @Get('filings')
  @Permissions('vat:read')
  @ApiOperation({ summary: 'List VAT filings for the calling tenant' })
  async listFilings(@Req() req: Request, @Query() query: unknown) {
    const dto      = ListFilingsSchema.parse(query);
    const tenantId = (req as any).user?.companyId as string;

    const result = await this.filingService.listFilings(tenantId, dto);
    return { success: true, ...result };
  }

  @Get('filings/:id')
  @Permissions('vat:read')
  @ApiOperation({ summary: 'Get a single VAT filing by id' })
  async getFiling(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const tenantId = (req as any).user?.companyId as string;
    const filing   = await this.filingService.getFiling(tenantId, id);
    return { success: true, data: filing };
  }

  @Get('filings/:id/events')
  @Permissions('vat:read')
  @ApiOperation({ summary: 'Get the immutable audit trail for a filing' })
  async getFilingEvents(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const tenantId = (req as any).user?.companyId as string;
    const events   = await this.filingService.getFilingEvents(tenantId, id);
    return { success: true, data: events };
  }

  @Post('filings/:id/submit')
  @Permissions('vat:submit')
  @UseGuards(VatModuleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a VAT filing to the tax authority' })
  @ApiResponse({ status: 200, description: 'FilingRecord in SUBMITTED status' })
  async submitFiling(
    @Req()  req:  Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const dto     = SubmitFilingSchema.parse(body);
    const user    = (req as any).user;
    const tenantId = user?.companyId as string;
    const actorId  = user?.userId ?? 'system';

    const filing = await this.filingService.submitFiling(tenantId, id, dto, actorId);
    return { success: true, data: filing };
  }

  @Post('filings/:id/ack')
  @Permissions('vat:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record an authority acknowledgement (ACCEPTED / REJECTED)',
    description: 'Called by the authority integration adapter or a webhook handler.',
  })
  async recordAck(
    @Req()  req:  Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const dto      = RecordAckSchema.parse(body);
    const user     = (req as any).user;
    const tenantId = user?.companyId as string;
    const actorId  = user?.userId ?? 'system';

    const filing = await this.filingService.recordAck(tenantId, id, dto, actorId);
    return { success: true, data: filing };
  }

  @Post('filings/:id/amend')
  @Permissions('vat:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create an amendment (new DRAFT) of a submitted filing' })
  @ApiResponse({ status: 200, description: 'New FilingRecord in DRAFT status with amendmentOf set' })
  async amendFiling(
    @Req()  req:  Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const dto      = AmendFilingSchema.parse(body);
    const user     = (req as any).user;
    const tenantId = user?.companyId as string;
    const actorId  = user?.userId ?? 'system';

    const filing = await this.filingService.amendFiling(tenantId, id, dto, actorId);
    return { success: true, data: filing };
  }
}
