import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * HoneypotGuard
 *
 * Used exclusively on HoneypotController endpoints.
 * When any request reaches a honeypot route the guard:
 *  1. Logs the full request context at WARN level (SIEM feed).
 *  2. Records the source IP in the shared HoneypotBlocklistService.
 *  3. Always returns true so the controller can send a convincing decoy
 *     response — the attacker should not know they were caught.
 *
 * The blocklist is consulted by StatusCodeAbuseGuard on subsequent requests.
 */
@Injectable()
export class HoneypotGuard implements CanActivate {
  private readonly logger = new Logger('HoneypotGuard');

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    const path = req.url;
    const method = req.method;

    this.logger.warn(
      `[HONEYPOT HIT] ip=${ip} method=${method} path=${path} ua="${userAgent}"`,
    );

    // Record in the module-level blocklist so StatusCodeAbuseGuard
    // blocks subsequent requests from the same IP immediately.
    HoneypotBlocklistService.getInstance().block(ip ?? 'unknown');

    return true; // let the controller send the decoy response
  }

  private extractIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        .split(',')[0]
        .trim();
    }
    return (req as any).ip ?? req.socket?.remoteAddress ?? null;
  }
}

/**
 * HoneypotBlocklistService (singleton, no DI needed)
 *
 * Lightweight in-process IP blocklist shared between HoneypotGuard and
 * StatusCodeAbuseGuard.  Entries expire after HONEYPOT_BLOCK_DURATION_MS.
 */
export class HoneypotBlocklistService {
  private static instance: HoneypotBlocklistService;
  private readonly blocklist = new Map<string, number>(); // ip → unblockedAt

  static getInstance(): HoneypotBlocklistService {
    if (!HoneypotBlocklistService.instance) {
      HoneypotBlocklistService.instance = new HoneypotBlocklistService();
    }
    return HoneypotBlocklistService.instance;
  }

  block(ip: string): void {
    const durationMs = parseInt(
      process.env['HONEYPOT_BLOCK_DURATION_MS'] ?? '86400000', // 24 h default
      10,
    );
    this.blocklist.set(ip, Date.now() + durationMs);
  }

  isBlocked(ip: string): boolean {
    const unblockedAt = this.blocklist.get(ip);
    if (!unblockedAt) return false;
    if (Date.now() >= unblockedAt) {
      this.blocklist.delete(ip);
      return false;
    }
    return true;
  }
}
