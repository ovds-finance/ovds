/**
 * MonetizationController — real DB-backed SaaS billing endpoints.
 *
 * Delegates all business logic to MonetizationService which reads / writes
 * MonetizationSubscription, MonetizationTrial, MonetizationPurchase, and the
 * MonetizationEntitlement cache in the database.
 *
 * Company context is taken from the authenticated user's JWT (req.user.companyId)
 * or from the x-company-id header (for super-admin cross-company billing ops).
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { MonetizationService } from './monetization.service';

function resolveCompany(
  headers: Record<string, string | undefined>,
  req: any,
): string {
  const cid = (headers['x-company-id'] as string | undefined) || req?.user?.companyId;
  if (!cid) throw new BadRequestException('x-company-id header or authenticated company context is required');
  return cid;
}

@ApiTags('monetization')
@ApiHeader({ name: 'x-company-id', description: 'Active company context', required: false })
@Controller('monetization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonetizationController {
  constructor(private readonly monetizationService: MonetizationService) {}

  // ── Entitlement checks ────────────────────────────────────────────────────

  @Get('status')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription / entitlement status for the company' })
  async getStatus(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.getStatus(companyId);
    return { success: true, data };
  }

  @Get('check/:featureKey')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check whether a specific feature key is entitled for the company' })
  async checkFeature(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('featureKey') featureKey: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const entitled = await this.monetizationService.checkFeature(companyId, featureKey);
    return { success: true, data: { featureKey, entitled, companyId } };
  }

  // ── Products ──────────────────────────────────────────────────────────────

  @Get('products')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List available subscription products / plans' })
  async listProducts() {
    const data = await this.monetizationService.listProducts();
    return { success: true, data };
  }

  @Get('products/:id')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a product by ID' })
  async getProduct(@Param('id') id: string) {
    const data = await this.monetizationService.getProduct(id);
    return { success: true, data };
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  @Post('subscription')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create / start a subscription for the company' })
  async createSubscription(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { productId: string; billingCycle?: string; providerRef?: string; providerSubId?: string },
  ) {
    if (!body.productId) throw new BadRequestException('productId is required');
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.createSubscription(companyId, body);
    return { success: true, data };
  }

  @Delete('subscription/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a subscription' })
  async cancelSubscription(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.cancelSubscription(companyId, id, body?.reason);
    return { success: true, data };
  }

  @Post('subscription/:id/pause')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active subscription' })
  async pauseSubscription(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.pauseSubscription(companyId, id);
    return { success: true, data };
  }

  @Post('subscription/:id/resume')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused subscription' })
  async resumeSubscription(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.resumeSubscription(companyId, id);
    return { success: true, data };
  }

  @Post('subscription/:id/switch')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch a subscription to a different product / billing cycle' })
  async switchSubscription(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { productId: string; billingCycle?: string },
  ) {
    if (!body.productId) throw new BadRequestException('productId is required');
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.switchSubscription(
      companyId,
      id,
      body.productId,
      body.billingCycle,
    );
    return { success: true, data };
  }

  // ── Trial ─────────────────────────────────────────────────────────────────

  @Post('trial')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a free trial for a product' })
  async startTrial(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { productId: string },
  ) {
    if (!body.productId) throw new BadRequestException('productId is required');
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.startTrial(companyId, body.productId);
    return { success: true, data };
  }

  // ── Lifetime purchase ─────────────────────────────────────────────────────

  @Post('purchase')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a lifetime purchase' })
  async createPurchase(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { productId: string; amountPaid: number; providerRef?: string; receiptUrl?: string },
  ) {
    if (!body.productId) throw new BadRequestException('productId is required');
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.createPurchase(companyId, body);
    return { success: true, data };
  }

  // ── License activation ────────────────────────────────────────────────────

  @Post('activate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a license key for the company' })
  async activateLicense(
    @Headers() headers: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { licenseKey: string },
  ) {
    if (!body.licenseKey) throw new BadRequestException('licenseKey is required');
    const companyId = resolveCompany(headers, req);
    const data = await this.monetizationService.activateLicense(companyId, body.licenseKey);
    return { success: true, data };
  }

  // ── Admin billing ─────────────────────────────────────────────────────────

  @Get('admin/billing/:companyId')
  @Roles('SUPERADMIN', 'SPURADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get full billing info for a company (super-admin only)' })
  async getCompanyBilling(@Param('companyId') companyId: string) {
    const data = await this.monetizationService.getCompanyBilling(companyId);
    return { success: true, data };
  }

  @Post('admin/rebuild-cache/:companyId')
  @Roles('SUPERADMIN', 'SPURADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rebuild the entitlement cache for a company (super-admin only)' })
  async rebuildCache(@Param('companyId') companyId: string) {
    await this.monetizationService.rebuildEntitlements(companyId);
    return { success: true, data: { companyId, rebuilt: true } };
  }

  @Post('admin/subscription/:companyId/renew/:subscriptionId')
  @Roles('SUPERADMIN', 'SPURADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually renew a subscription (super-admin only)' })
  async renewSubscription(
    @Param('companyId') companyId: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    const data = await this.monetizationService.renewSubscription(companyId, subscriptionId);
    return { success: true, data };
  }
}
