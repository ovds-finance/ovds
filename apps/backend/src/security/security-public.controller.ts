import {
  Controller,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { z } from 'zod';

import { PrismaService } from '../common/prisma.service';
import { Throttle } from '../common/throttle.decorator';

/**
 * SecurityPublicController
 *
 * Handles unauthenticated security signals from the client.
 * Has NO class-level JwtAuthGuard — these endpoints must be reachable
 * even when the user's session has been hijacked or corrupted.
 *
 * Endpoints
 * ─────────
 *  POST /security/dom-alert
 *    Beacon receiver for the MutationObserver in security-shield.js.
 *    Fires when the browser detects an unauthorised DOM injection
 *    (extension-injected scripts, in-page XSS, etc.).
 *
 * Rate-limiting: per-endpoint @Throttle (20 req/min) plus global
 * CustomThrottlerGuard (100 req/min) and nginx bot_zone.
 */

/** Zod schema — enforces strict field types AND length limits on the beacon payload */
const DomAlertSchema = z.object({
  /** HTML element tag name — SCRIPT, LINK, etc. */
  tag: z.string().max(32).optional(),
  /** src or href of the injected resource — capped to prevent DB bloat */
  src: z.string().max(512).optional(),
  /** Date.now() timestamp from the browser */
  time: z.number().int().min(0).optional(),
  /** window.location.href at time of detection — cap prevents URL injection */
  url: z.string().max(1024).optional(),
});

type DomAlertDto = z.infer<typeof DomAlertSchema>;

@ApiTags('security')
@Controller('security')
export class SecurityPublicController {
  private readonly logger = new Logger(SecurityPublicController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /api/security/dom-alert
   *
   * Receives a `navigator.sendBeacon` payload from security-shield.js when
   * the MutationObserver detects an injected <script> or <link> node.
   *
   * Security measures:
   *  - @Throttle(60000, 20): max 20 beacons/min per IP (prevents DB flooding)
   *  - Zod validation: all fields parsed and length-capped before persistence
   *  - 204 No Content: sendBeacon ignores the body; never echo input back
   */
  @Post('dom-alert')
  @Throttle(60000, 20)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Receive DOM-tampering beacon from the frontend security shield (public)',
  })
  async domAlert(
    @Body() rawBody: unknown,
    @Request() req: any,
  ): Promise<void> {
    // ── Parse & validate — reject malformed payloads silently ───────────────
    const parsed = DomAlertSchema.safeParse(rawBody);
    if (!parsed.success) {
      // Invalid beacon — log and ignore; never return 4xx (would break sendBeacon)
      this.logger.warn('[DOM_TAMPER] Rejected malformed beacon payload');
      return;
    }

    const body: DomAlertDto = parsed.data;

    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.ip ??
      'unknown';

    this.logger.warn(
      `[DOM_TAMPER] ip=${ip} tag=${body.tag ?? '?'} src="${body.src ?? ''}" url="${body.url ?? ''}"`,
    );

    // Persist as an AuditLog row so the security dashboard can surface it.
    // Best-effort: never throw — HTTP 204 must return unconditionally so
    // sendBeacon has the highest chance of completing before the page reloads.
    try {
      await this.prisma.auditLog.create({
        data: {
          action:    'DOM_TAMPER_ALERT',
          userId:    req?.user?.userId    ?? null,
          companyId: req?.user?.companyId ?? null,
          details: JSON.stringify({
            ip,
            tag:  body.tag  ?? null,
            // Truncate again at DB layer as a defence-in-depth measure.
            src:  (body.src  ?? '').slice(0, 512) || null,
            time: body.time ?? null,
            url:  (body.url  ?? '').slice(0, 1024) || null,
          }),
        } as any,
      });
    } catch (e) {
      this.logger.error(
        'Failed to persist DOM tamper alert',
        (e as Error).message,
      );
    }

    // 204 No Content — implicit void return
  }
}
