/**
 * AccessPolicyGuard — ABAC / PBAC enforcement gate.
 *
 * Position in the guard chain (applied via @UseGuards on a controller):
 *
 *   JwtAuthGuard          — layer 0: authenticate JWT, populate request.user
 *   ─────────────────────────────────────────────────────────────────────────
 *   TenantContextInterceptor  — (interceptor) stamp AsyncLocalStorage context
 *   ─────────────────────────────────────────────────────────────────────────
 *   PermissionsGuard      — layer 1: static role→permission matrix + contextual rules
 *   AccessPolicyGuard     — layer 2: this guard (ABAC: IP, time, MFA, ownership)
 *
 * The guard reads the permission list from @CheckPolicy() metadata, extracts
 * request context (resource body/params, client IP, wall-clock time), then
 * delegates to AccessPolicyService.enforce().
 *
 * If no @CheckPolicy() metadata is present the guard is a no-op — routes
 * that don't need ABAC don't pay any overhead.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AccessPolicyService } from '../access-policy/access-policy.service';
import type { PolicyEnforceInput } from '../access-policy/access-policy.types';
import { CHECK_POLICY_KEY } from '../decorators/check-policy.decorator';

@Injectable()
export class AccessPolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: AccessPolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Read the permissions this route declared via @CheckPolicy(...)
    const permissions = this.reflector.getAllAndOverride<string[]>(
      CHECK_POLICY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @CheckPolicy metadata → guard is a transparent pass-through
    if (!permissions || permissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<any>();
    const { user } = request;

    // Should never happen after JwtAuthGuard, but guard defensively
    if (!user) return true;

    // ── Resolve client IP ──────────────────────────────────────────────────
    // Respect X-Forwarded-For set by Nginx / Plesk reverse proxy.
    // Take only the first (leftmost) address — it's the originating client;
    // subsequent entries may be added by intermediary proxies.
    const forwarded: string | undefined =
      request.headers?.['x-forwarded-for'] as string | undefined;
    const ipAddress: string =
      (forwarded ? forwarded.split(',')[0].trim() : null) ||
      request.socket?.remoteAddress ||
      request.ip ||
      '0.0.0.0';

    // ── Build resource context from request ────────────────────────────────
    // Merge body + params (not query — query params rarely carry ownership
    // metadata, and merging them risks false-positive ownership matches on
    // filter fields like ?userId=...).
    const resource: Record<string, unknown> = {
      ...(request.params ?? {}),
      ...(request.body   ?? {}),
    };

    const input: PolicyEnforceInput = {
      user: {
        userId:     user.userId,
        role:       user.role,
        companyId:  user.companyId ?? null,
        mfaEnrolled: user.mfaEnrolled ?? false,
        mfaVerified: user.mfaVerified ?? false,
      },
      permissions,
      resource,
      environment: {
        ipAddress,
        requestTime: new Date(),
      },
    };

    const decision = await this.policyService.enforce(input);

    if (!decision.allowed) {
      throw new ForbiddenException(
        decision.reason ?? 'Access denied by security policy',
      );
    }

    return true;
  }
}
