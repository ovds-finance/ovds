import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Permissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';

import { BusinessRegistrationService } from './business-registration.service';

@ApiTags('business-registration')
@Controller('business-registration')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('onboarding:read')
export class BusinessRegistrationController {
  constructor(private readonly svc: BusinessRegistrationService) {}

  // ── GET record ─────────────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full business registration record for the authenticated company' })
  getRecord(@Query('companyId') qCompanyId?: string, @Request() req?: any) {
    const companyId = qCompanyId ?? req?.user?.companyId;
    return this.svc.getRecord(companyId);
  }

  // ── Step 1 — Fayda NID ────────────────────────────────────────────────────

  @Post('nid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save / verify NID (Fayda ID) step' })
  saveNid(@Body() body: any, @Request() req?: any) {
    return this.svc.saveNid(body, req?.user?.companyId);
  }

  // ── Step 2 — TIN ──────────────────────────────────────────────────────────

  @Post('tin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save / verify TIN step' })
  saveTin(@Body() body: any, @Request() req?: any) {
    return this.svc.saveTin(body, req?.user?.companyId);
  }

  // ── Step 3 — Business License ─────────────────────────────────────────────

  @Post('license')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save / verify business license step' })
  saveLicense(@Body() body: any, @Request() req?: any) {
    return this.svc.saveLicense(body, req?.user?.companyId);
  }

  // ── Step 4 — VAT Registration ─────────────────────────────────────────────

  @Post('vat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save / verify VAT registration step' })
  saveVat(@Body() body: any, @Request() req?: any) {
    return this.svc.saveVat(body, req?.user?.companyId);
  }

  // ── Step 5 — Cross-Reference ──────────────────────────────────────────────

  @Post('cross-reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save cross-reference harmonization step' })
  saveCrossReference(@Body() body: any, @Request() req?: any) {
    return this.svc.saveCrossReference(body, req?.user?.companyId);
  }

  // ── Complete ──────────────────────────────────────────────────────────────

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark business registration as complete and derive harmonization status' })
  complete(@Body() body: any, @Request() req?: any) {
    return this.svc.complete(body, req?.user?.companyId);
  }
}
