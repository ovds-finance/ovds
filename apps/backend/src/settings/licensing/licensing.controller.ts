/**
 * LicensingController — real Prisma-backed SaaS licensing management.
 *
 * "Licenses" surface → MonetizationProduct (what can be licensed)
 *                    + MonetizationSubscription (who has an active license)
 *
 * GET  /licensing/licenses         → list all MonetizationProducts (catalogue)
 * POST /licensing/licenses         → create a MonetizationProduct
 * PATCH /licensing/licenses/:id    → update a MonetizationProduct
 * DELETE /licensing/licenses/:id   → soft-deactivate a MonetizationProduct
 *
 * GET  /licensing/subscriptions    → list subscriptions for a company
 * POST /licensing/subscriptions    → create/activate a subscription
 * PATCH /licensing/subscriptions/:id/cancel → cancel a subscription
 */
import {
  Controller, Get, Post, Body, Patch, Delete, Param,
  Headers, Request, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { Permissions } from '../../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { PrismaService } from '../../common/prisma.service';
import { AirGappedLicenseService } from '../../core/licensing/air-gapped-license.service';


function cid(h: Record<string, string | undefined>, req: any): string | undefined {
  return (h['x-company-id'] as string | undefined) || req?.user?.companyId;
}

@ApiTags('licensing')
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('licensing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('apps:read')
export class LicensingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly licenseService: AirGappedLicenseService,
  ) {}

  // ── Product catalogue (licenses) ──────────────────────────────────────────

  @Get('licenses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List available license products' })
  async getLicenses(@Query('isActive') isActive?: string) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive !== 'false';
    const data = await this.prisma.monetizationProduct.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }

  @Get('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a license product by ID or slug' })
  async getLicense(@Param('id') id: string) {
    const data = await this.prisma.monetizationProduct.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!data) throw new NotFoundException(`License product ${id} not found`);
    return { success: true, data };
  }

  @Post('licenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a license product' })
  async createLicense(@Body() body: Record<string, unknown>) {
    if (!body.name) throw new BadRequestException('name is required');
    if (!body.slug) throw new BadRequestException('slug is required');
    if (!body.featureKeys) throw new BadRequestException('featureKeys (JSON array) is required');
    const data = await this.prisma.monetizationProduct.create({
      data: {
        ...body,
        featureKeys: Array.isArray(body.featureKeys)
          ? JSON.stringify(body.featureKeys)
          : (body.featureKeys as string),
        isActive: body.isActive !== false,
      } as any,
    });
    return { success: true, data };
  }

  @Patch('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a license product' })
  async updateLicense(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const existing = await this.prisma.monetizationProduct.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) throw new NotFoundException(`License product ${id} not found`);
    const updateData: any = { ...body };
    if (Array.isArray(body.featureKeys)) {
      updateData.featureKeys = JSON.stringify(body.featureKeys);
    }
    const data = await this.prisma.monetizationProduct.update({
      where: { id: existing.id },
      data: updateData,
    });
    return { success: true, data };
  }

  @Delete('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a license product' })
  async deleteLicense(@Param('id') id: string) {
    const existing = await this.prisma.monetizationProduct.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) throw new NotFoundException(`License product ${id} not found`);
    await this.prisma.monetizationProduct.update({
      where: { id: existing.id },
      data: { isActive: false } as any,
    });
    return { success: true };
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  @Get('subscriptions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List subscriptions for a company' })
  async getSubscriptions(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Query('page') page = '1',
    @Query('take') take = String(PAGINATION_DEFAULT_LIMIT),
    @Query('status') status?: string,
  ) {
    const companyId = cid(h, req);
    const pg = parseInt(page, 10);
    const lm = parseInt(take, 10);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status)    where.status    = status;

    const [data, total] = await Promise.all([
      this.prisma.monetizationSubscription.findMany({
        where, skip: (pg - 1) * lm, take: lm,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, slug: true, type: true } } },
      }),
      this.prisma.monetizationSubscription.count({ where }),
    ]);
    return {
      success: true,
      data: { data, pagination: { total, page: pg, take: lm, pages: Math.ceil(total / lm) } },
    };
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Activate a subscription for a company' })
  async createSubscription(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: Record<string, unknown>,
  ) {
    const companyId = cid(h, req) ?? (body.companyId as string);
    if (!companyId)   throw new BadRequestException('companyId is required');
    if (!body.productId) throw new BadRequestException('productId is required');

    const product = await this.prisma.monetizationProduct.findUnique({
      where: { id: body.productId as string },
    });
    if (!product) throw new NotFoundException(`Product ${body.productId} not found`);

    const now = new Date();
    const periodEnd = new Date(now);
    const billingCycle = (body.billingCycle as string | undefined) ?? 'MONTHLY';
    if (billingCycle === 'ANNUAL') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const data = await this.prisma.monetizationSubscription.create({
      data: {
        companyId,
        productId:          body.productId as string,
        billingCycle,
        status:             'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd:   periodEnd,
        providerRef:        body.providerRef as string | undefined,
      } as any,
      include: { product: { select: { name: true, slug: true } } },
    });
    return { success: true, data };
  }

  @Patch('subscriptions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a subscription' })
  async cancelSubscription(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const existing = await this.prisma.monetizationSubscription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Subscription ${id} not found`);
    const data = await this.prisma.monetizationSubscription.update({
      where: { id },
      data: {
        status:       'CANCELLED',
        cancelledAt:  new Date(),
        cancelReason: body.reason ?? null,
      } as any,
    });
    return { success: true, data };
  }

  // ── Air-Gapped Offline License Activation ────────────────────────────────
  // For ON_PREMISE_SINGLE deployments: customers paste a license key string
  // that is cryptographically verified (RSA-SHA256) and stored locally.
  // No internet phone-home — the public key is provisioned via OFFLINE_PUBLIC_KEY env.

  @Post('offline-activate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit and verify an air-gapped offline license key',
    description: 'Validates an RSA-SHA256-signed license key offline (no telemetry). ' +
      'On success, stores the activation record and enables registered modules.',
  })
  async activateOfflineLicense(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
    @Body() body: { licenseKey: string },
  ) {
    const companyId = cid(h, req);
    if (!companyId) {
      throw new BadRequestException('companyId (x-company-id header or JWT) is required');
    }
    if (!body.licenseKey) {
      throw new BadRequestException('licenseKey is required');
    }

    // Verify the license signature offline
    const result = this.licenseService.verifyLicense(body.licenseKey, companyId);

    if (!result.valid || !result.payload) {
      throw new BadRequestException('License verification failed: invalid signature, expired, or company mismatch.');
    }

    // Parse registered modules from the license payload
    const payloadJson = Buffer.from(body.licenseKey.split('.')[0], 'base64').toString('utf8');
    const licensePayload = JSON.parse(payloadJson);
    const registeredModules: string[] = licensePayload.registeredModules || [];

    // Store or update the license activation record
    await this.prisma.licenseActivation.upsert({
      where: { companyId_licenseKey: { companyId, licenseKey: body.licenseKey } },
      create: {
        companyId,
        licenseKey: body.licenseKey,
        signature: result.payload.signature,
        expiresAt: result.payload.expiresAt > 0
          ? new Date(result.payload.expiresAt)
          : null,
        isValid: true,
        registeredModules: JSON.stringify(registeredModules),
      },
      update: {
        signature: result.payload.signature,
        expiresAt: result.payload.expiresAt > 0
          ? new Date(result.payload.expiresAt)
          : null,
        isValid: true,
        registeredModules: JSON.stringify(registeredModules),
      },
    });

    // Ensure each registered module has a CompanyModule entry enabled
    for (const moduleKey of registeredModules) {
      await this.prisma.companyModule.upsert({
        where: { companyId_moduleKey: { companyId, moduleKey } },
        create: {
          companyId,
          moduleKey,
          isEnabled: true,
        },
        update: { isEnabled: true },
      });
    }

    return {
      success: true,
      message: `License activated for company ${companyId}. Enabled modules: ${registeredModules.join(', ') || 'none'}`,
      payload: {
        companyId: result.payload.companyId,
        version: result.payload.version,
        expiresAt: result.payload.expiresAt,
        registeredModules,
      },
    };
  }

  @Get('offline-status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check the current offline license status' })
  async getOfflineLicenseStatus(
    @Headers() h: Record<string, string | undefined>,
    @Request() req: any,
  ) {
    const companyId = cid(h, req);
    if (!companyId) {
      throw new BadRequestException('companyId (x-company-id header or JWT) is required');
    }

    const license = await this.prisma.licenseActivation.findFirst({
      where: { companyId, isValid: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!license) {
      return { success: true, data: { licensed: false, message: 'No valid license found' } };
    }

    const expired = this.licenseService.isExpired({
      payload: {
        companyId: license.companyId,
        issuedAt: 0,
        expiresAt: license.expiresAt?.getTime() ?? 0,
        version: '',
        signature: license.signature,
      },
      valid: true,
    });

    return {
      success: true,
      data: {
        licensed: !expired,
        licenseKey: license.licenseKey,
        expiresAt: license.expiresAt,
        registeredModules: JSON.parse(license.registeredModules || '[]'),
        version: '',
      },
    };
  }
}
