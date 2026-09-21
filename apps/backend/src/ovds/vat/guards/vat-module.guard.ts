/**
 * @file vat-module.guard.ts
 * @module OvdsVatModule
 *
 * VatModuleGuard
 * ──────────────
 * Route-level guard that verifies the calling tenant has the required
 * country VAT module ACTIVATED before reaching the controller handler.
 *
 * How country code is resolved (in priority order):
 *  1. Route param    :countryCode  (e.g. GET /vat/periods/ET/2025)
 *  2. Request body   countryCode
 *  3. Query param    countryCode
 *  4. Guard skips check if no country code found anywhere (fail-open for
 *     catalogue/admin endpoints that don't target a specific country)
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, VatModuleGuard)
 *   @Get('periods/:countryCode/:year')
 *   getPeriods(…) { … }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { VatModuleRegistry }  from '@ovds/core/vat';
import { Request } from 'express';

import { VAT_MODULE_REGISTRY } from '../vat-declaration.orchestrator';

@Injectable()
export class VatModuleGuard implements CanActivate {
  constructor(
    @Inject(VAT_MODULE_REGISTRY)
    private readonly registry: VatModuleRegistry,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // Extract tenant from authenticated user (set by JwtAuthGuard)
    const tenantId: string | undefined = (req as any).user?.companyId;
    if (!tenantId) return true; // Let JwtAuthGuard handle unauthenticated calls

    // Resolve country code from the request
    const countryCode = this.resolveCountryCode(req);
    if (!countryCode) return true; // No country context — not our concern

    const code = countryCode.toUpperCase();

    // Verify the module is installed globally
    if (!this.registry.allCodes().includes(code)) {
      throw new ForbiddenException(
        `VAT module "${code}" is not installed on this platform. ` +
        `Available modules: ${this.registry.allCodes().join(', ')}`,
      );
    }

    // Verify the module is activated for this tenant
    if (!this.registry.isActive(tenantId, code)) {
      throw new ForbiddenException(
        `VAT module "${code}" is not activated for your organisation. ` +
        `Please activate it via POST /api/vat/modules/activate before using this endpoint.`,
      );
    }

    return true;
  }

  private resolveCountryCode(req: Request): string | undefined {
    // 1. Route param
    const fromParam = (req.params as any)?.countryCode;
    if (fromParam && typeof fromParam === 'string' && fromParam.length === 2) {
      return fromParam;
    }

    // 2. Request body
    const body = req.body as Record<string, unknown> | undefined;
    const fromBody = body?.countryCode;
    if (typeof fromBody === 'string' && fromBody.length === 2) {
      return fromBody;
    }

    // 3. Query string
    const fromQuery = (req.query as any)?.countryCode;
    if (typeof fromQuery === 'string' && fromQuery.length === 2) {
      return fromQuery;
    }

    return undefined;
  }
}
