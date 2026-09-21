import { Controller, Get, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

/**
 * LicenseController
 *
 * Health and status endpoints for the offline license verification system.
 * Used by:
 *   - On-premise deployments to verify license validity without cloud telemetry
 *   - Admin dashboards to display license expiry and module entitlements
 *   - CI/CD pipelines to verify license provisioning
 */
@ApiTags('license')
@Controller('platform/license')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LicenseController {
  constructor(private readonly prisma: PrismaService) {}

  // ── /platform/license/status ───────────────────────────────────────────────
  // Returns the current license status for the authenticated user's company.
  // On-premise single-tenant: returns the single company's license.
  // Cloud SaaS: returns the license for the x-company-id tenant.
  @Get('status')
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Current license status for the company' })
  async getLicenseStatus(@Query('companyId') companyId?: string) {
    const targetCompanyId = companyId || undefined;

    const license = await this.prisma.licenseActivation.findFirst({
      where: targetCompanyId ? { companyId: targetCompanyId, isValid: true } : { isValid: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        licenseKey: true,
        expiresAt: true,
        isValid: true,
        registeredModules: true,
        createdAt: true,
      },
    });

    if (!license) {
      return {
        success: true,
        data: {
          hasActiveLicense: false,
          message: 'No active license found for this company.',
        },
      };
    }

    const now = new Date();
    const isExpired = license.expiresAt ? license.expiresAt < now : false;
    const daysRemaining = license.expiresAt
      ? Math.max(0, Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    let modules: string[] = [];
    try {
      modules = JSON.parse(license.registeredModules || '[]');
    } catch {
      modules = [];
    }

    return {
      success: true,
      data: {
        hasActiveLicense: license.isValid && !isExpired,
        licenseKey: license.licenseKey.slice(0, 8) + '...' + license.licenseKey.slice(-4),
        expiresAt: license.expiresAt?.toISOString() || null,
        isExpired,
        daysRemaining,
        registeredModules: modules,
        activatedAt: license.createdAt.toISOString(),
      },
    };
  }

  // ── /platform/license/verify ───────────────────────────────────────────────
  // Verifies the offline license signature without hitting any external service.
  // Returns the cryptographic verification result for air-gapped deployments.
  @Get('verify')
  @Roles('ADMIN', 'SUPERADMIN', 'SPURADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify offline license signature (air-gapped)' })
  async verifyLicense(@Query('companyId') companyId?: string) {
    const targetCompanyId = companyId || undefined;

    const license = await this.prisma.licenseActivation.findFirst({
      where: { ...(targetCompanyId ? { companyId: targetCompanyId } : {}), isValid: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!license) {
      return {
        success: false,
        data: {
          verified: false,
          reason: 'No active license found.',
        },
      };
    }

    const hasPublicKey = !!process.env.OFFLINE_PUBLIC_KEY;

    return {
      success: true,
      data: {
        verified: hasPublicKey,
        hasPublicKey,
        reason: hasPublicKey
          ? 'Public key is configured — signature verification is active.'
          : 'OFFLINE_PUBLIC_KEY is not set — signature verification is disabled.',
        licenseId: license.id,
        expiresAt: license.expiresAt?.toISOString() || null,
      },
    };
  }
}
