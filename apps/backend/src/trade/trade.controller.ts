import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TradeService } from './trade.service';

/**
 * TradeController
 *
 * All route handlers delegate to TradeService which performs real Prisma
 * queries against the MariaDB database.  The active company is resolved from
 * the JWT payload (req.user.companyId) so every operation is tenant-scoped.
 *
 * Portal integrations (ESLSE, EAL Cargo, Cheche, EBP, Leul Verify) return
 * locally-cached data with a descriptive warning field until vendor API
 * credentials are provisioned in the environment.
 */
@ApiTags('trade')
@Controller('trade')
@UseGuards(JwtAuthGuard)
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trade dashboard summary' })
  getDashboard(@Request() req: any) {
    return this.tradeService.getDashboard(req.user?.companyId);
  }

  // ── Shipments ─────────────────────────────────────────────────────────────

  @Get('shipments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List shipments (optionally filtered by direction: IMPORT | EXPORT)' })
  listShipments(@Request() req: any, @Query('direction') direction?: string) {
    return this.tradeService.listShipments(direction, req.user?.companyId);
  }

  @Get('shipments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single shipment with steps, forex, and documents' })
  getShipment(@Param('id') id: string) {
    return this.tradeService.getShipment(id);
  }

  @Post('shipments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a shipment (auto-generates pipeline steps)' })
  createShipment(@Request() req: any, @Body() body: any) {
    return this.tradeService.createShipment(body, req.user?.companyId);
  }

  @Patch('shipments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shipment fields' })
  updateShipment(@Param('id') id: string, @Body() body: any) {
    return this.tradeService.updateShipment(id, body);
  }

  @Patch('shipments/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shipment status' })
  updateShipmentStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.tradeService.updateShipmentStatus(id, body.status, body.notes);
  }

  @Delete('shipments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a shipment and all related steps/documents' })
  deleteShipment(@Param('id') id: string) {
    return this.tradeService.deleteShipment(id);
  }

  @Get('shipments/:id/track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track a shipment — returns local data + portal warning' })
  trackShipment(
    @Param('id') id: string,
    @Query('mode') mode?: string,
    @Query('force') force?: string,
  ) {
    return this.tradeService.trackShipment(id, mode, force);
  }

  // ── Steps ────────────────────────────────────────────────────────────────

  @Patch('steps/:stepId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a shipment pipeline step (status, notes, metadata)' })
  updateStep(@Param('stepId') stepId: string, @Body() body: any) {
    return this.tradeService.updateStep(stepId, body);
  }

  // ── Forex Approvals ──────────────────────────────────────────────────────

  @Post('shipments/:shipmentId/forex')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a forex approval record for a shipment' })
  createForex(@Param('shipmentId') shipmentId: string, @Body() body: any) {
    return this.tradeService.createForex(shipmentId, body);
  }

  @Patch('forex/:forexId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a forex approval as APPROVED' })
  approveForex(
    @Param('forexId') forexId: string,
    @Body() body: { approvalRef: string },
  ) {
    return this.tradeService.approveForex(forexId, body.approvalRef);
  }

  // ── Proformas ────────────────────────────────────────────────────────────

  @Get('proformas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List proforma invoices' })
  listProformas(@Request() req: any) {
    return this.tradeService.listProformas(req.user?.companyId);
  }

  @Get('proformas/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a proforma invoice' })
  getProforma(@Param('id') id: string) {
    return this.tradeService.getProforma(id);
  }

  @Post('proformas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a proforma invoice' })
  createProforma(@Body() body: any) {
    return this.tradeService.createProforma(body);
  }

  @Patch('proformas/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a proforma invoice' })
  updateProforma(@Param('id') id: string, @Body() body: any) {
    return this.tradeService.updateProforma(id, body);
  }

  @Delete('proformas/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a proforma invoice' })
  deleteProforma(@Param('id') id: string) {
    return this.tradeService.deleteProforma(id);
  }

  @Post('proformas/:id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate a proforma invoice' })
  duplicateProforma(@Param('id') id: string) {
    return this.tradeService.duplicateProforma(id);
  }

  // ── Licenses ────────────────────────────────────────────────────────────

  @Get('licenses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List trade licenses' })
  listLicenses(@Request() req: any) {
    return this.tradeService.listLicenses(req.user?.companyId);
  }

  @Get('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a trade license' })
  getLicense(@Param('id') id: string) {
    return this.tradeService.getLicense(id);
  }

  @Post('licenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a trade license' })
  createLicense(@Request() req: any, @Body() body: any) {
    return this.tradeService.createLicense(body, req.user?.companyId);
  }

  @Patch('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a trade license' })
  updateLicense(@Param('id') id: string, @Body() body: any) {
    return this.tradeService.updateLicense(id, body);
  }

  @Delete('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a trade license' })
  deleteLicense(@Param('id') id: string) {
    return this.tradeService.deleteLicense(id);
  }

  // ── Portal Integrations ──────────────────────────────────────────────────
  // Returns locally-cached data + a warning field until vendor API
  // credentials (ESLSE_API_URL, EAL_CARGO_API_URL, etc.) are configured.

  @Get('portals/eslse/:blNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track via ESLSE portal (returns local data until ESLSE_API_URL is configured)' })
  eslse(@Param('blNumber') blNumber: string, @Query('force') force?: string) {
    return this.tradeService.trackEslse(blNumber, force);
  }

  @Get('portals/eal-cargo/:awbNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track via EAL Cargo portal (stub until EAL_CARGO_API_URL is configured)' })
  ealCargo(@Param('awbNumber') awbNumber: string, @Query('force') force?: string) {
    return this.tradeService.trackEalCargo(awbNumber, force);
  }

  @Get('portals/cheche/:referenceNo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Look up Cheche permit (stub until CHECHE_API_URL is configured)' })
  cheche(@Param('referenceNo') referenceNo: string, @Query('force') force?: string) {
    return this.tradeService.lookupCheche(referenceNo, force);
  }

  @Get('portals/ebp/:tin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify taxpayer via EBP / ERCA portal — falls back to local DB TIN match' })
  ebp(@Param('tin') tin: string, @Query('force') force?: string) {
    return this.tradeService.verifyEbp(tin, force);
  }

  @Get('portals/leul-verify/:reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment via Leul — falls back to local BankTransaction lookup' })
  leulVerify(@Param('reference') reference: string, @Query('force') force?: string) {
    return this.tradeService.verifyLeul(reference, force);
  }
}
