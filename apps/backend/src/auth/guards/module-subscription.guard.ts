import * as crypto from 'crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isSuperUser } from '@ovds/shared';

import { PrismaService } from '../../common/prisma.service';
import { getTenantContext } from '../../common/tenant-context.middleware';

export const REQUIRED_MODULE_KEY_METADATA = 'requiredModuleKey';

/**
 * @RequiredModule('invoicing')
 *
 * Decorates a controller method or class to enforce that the requesting
 * company has the named module enabled in `CompanyModule`.  Returns 403 when
 * the tenant subscription is missing or inactive.
 */
export const RequiredModule = (moduleKey: string) =>
  SetMetadata(REQUIRED_MODULE_KEY_METADATA, moduleKey);

/**
 * ModuleSubscriptionGuard
 *
 * Layer between PermissionsGuard (RBAC) and AccessPolicyGuard (ABAC):
 *   1. JwtAuthGuard         — who is the user?
 *   2. PermissionsGuard     — do they have the permission?
 *   3. ModuleSubscriptionGuard — is the module subscribed? (this guard)
 *   4. AccessPolicyGuard    — ABAC: IP, time-window, resource ownership
 *
 * Inspects the `CompanyModule` table for the active tenant and checks
 * `isEnabled`.  Bypasses the check for On-Premise single-tenant mode and
 * for super-users (SPURADMIN / SUPERADMIN).
 *
 * For premium enterprise modules, enforces offline license signature
 * verification using PKI (RSA/SHA256) to support air-gapped on-premise
 * deployments without cloud telemetry.
 */
@Injectable()
export class ModuleSubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModuleKey = this.reflector.get<string>(
      REQUIRED_MODULE_KEY_METADATA,
      context.getHandler(),
    );

    if (!requiredModuleKey) {
      return true; // No module gate on this endpoint — it is core framework functionality
    }

    const request = context.switchToHttp().getRequest<any>();
    const tenantCtx = getTenantContext();
    const companyId =
      request.headers?.['x-company-id'] ||
      request.user?.companyId ||
      tenantCtx?.companyId;

    const deploymentMode = process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS';
    const role = (request.user?.role ?? tenantCtx?.role ?? '').toUpperCase();
    const isSuper = isSuperUser(role as any);

    // On-Premise single-tenant: skip subscription checks — all modules are local
    if (deploymentMode === 'ON_PREMISE_SINGLE') {
      return true;
    }

    // Super-users bypass module subscription enforcement
    if (isSuper) {
      return true;
    }

    if (!companyId) {
      throw new ForbiddenException('Tenant company identifier context not discovered.');
    }

    // Dynamic Module State Check — queries CompanyModule for this tenant
    const subscription = await this.prisma.companyModule.findFirst({
      where: {
        companyId: String(companyId),
        moduleKey: requiredModuleKey,
        isEnabled: true,
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        `The module '${requiredModuleKey}' is inactive or uninstalled for this workspace organization.`,
      );
    }

    // PKI Air-Gapped Verification Guard — enforce offline license for premium modules
    const settings = this.parseSettings(subscription.settings);
    if (settings?.isPremium) {
      const license = await this.prisma.licenseActivation.findFirst({
        where: { companyId: String(companyId), isValid: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!license || !this.verifyOfflineLicense(license.licenseKey, license.signature)) {
        throw new ForbiddenException(
          'Premium enterprise module activation contains an invalid signature or missing offline token.',
        );
      }
    }

    return true;
  }

  private parseSettings(raw: string | null | undefined): Record<string, any> | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, any>;
    } catch {
      return null;
    }
  }

  private verifyOfflineLicense(licenseKey: string, signature: string): boolean {
    try {
      const publicKey = process.env.OFFLINE_PUBLIC_KEY;
      if (!publicKey) return false;

      const verifier = crypto.createVerify('SHA256');
      verifier.update(licenseKey);
      return verifier.verify(publicKey, signature, 'hex');
    } catch {
      return false;
    }
  }
}
