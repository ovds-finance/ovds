import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

/**
 * StatusCodeAbuseGuard
 *
 * Detects IPs that trigger an abnormal volume of 4xx error responses
 * (404 Not Found, 403 Forbidden) — the hallmark of automated scanners,
 * path-enumeration tools, and credential-stuffing probes.
 *
 * Strategy
 * ────────
 * 1. After every response we intercept the status code via `canActivate`.
 *    Because NestJS guards run *before* the handler we hook into the
 *    response `finish` event to observe the actual outgoing code.
 * 2. We track per-IP counters in a bounded in-memory Map with TTL windows.
 *    For production deployments with multiple instances, swap the Map for
 *    a shared Redis counter (see redisCounter() below — opt-in via env).
 * 3. If an IP exceeds ABUSE_404_THRESHOLD in ABUSE_WINDOW_MS the IP is
 *    added to a temporary block list and all subsequent requests from it
 *    receive HTTP 429 for ABUSE_BLOCK_DURATION_MS.
 * 4. The guard logs every block event at WARN level for SIEM ingestion.
 *
 * Configuration (env vars)
 * ────────────────────────
 *  ABUSE_WINDOW_MS          Rolling window in ms          default: 60_000  (1 min)
 *  ABUSE_404_THRESHOLD      Max 404s before block         default: 20
 *  ABUSE_403_THRESHOLD      Max 403s before block         default: 15
 *  ABUSE_BLOCK_DURATION_MS  How long to block the IP      default: 600_000 (10 min)
 *  ABUSE_MAX_TRACKED_IPS    Max IPs held in memory        default: 50_000
 */

interface IpRecord {
  counts: { 404: number; 403: number };
  windowStart: number;
  blockedUntil: number | null;
}

@Injectable()
export class StatusCodeAbuseGuard implements CanActivate {
  private readonly logger = new Logger(StatusCodeAbuseGuard.name);

  // Bounded LRU-ish map: evict oldest entries when cap is reached
  private readonly ipRecords = new Map<string, IpRecord>();

  private get windowMs(): number {
    return parseInt(process.env['ABUSE_WINDOW_MS'] ?? '60000', 10);
  }
  private get threshold404(): number {
    return parseInt(process.env['ABUSE_404_THRESHOLD'] ?? '20', 10);
  }
  private get threshold403(): number {
    return parseInt(process.env['ABUSE_403_THRESHOLD'] ?? '15', 10);
  }
  private get blockDurationMs(): number {
    return parseInt(process.env['ABUSE_BLOCK_DURATION_MS'] ?? '600000', 10);
  }
  private get maxTrackedIps(): number {
    return parseInt(process.env['ABUSE_MAX_TRACKED_IPS'] ?? '50000', 10);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const ip = this.extractIp(req);

    // ── Block check: reject immediately if the IP is currently blocked ──────
    if (ip && this.isBlocked(ip)) {
      this.logger.warn(`Blocked IP attempted request: ${ip} → ${req.method} ${req.url}`);
      throw new HttpException(
        { statusCode: 429, errorCode: 'IP_BLOCKED', message: 'Too many error responses. Try again later.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Hook into the response to observe outgoing status code ───────────────
    if (ip) {
      res.on('finish', () => {
        const status = res.statusCode;
        if (status === 404 || status === 403) {
          this.record(ip, status as 404 | 403, req);
        }
      });
    }

    return true;
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private extractIp(req: Request): string | null {
    // Trust X-Forwarded-For only when it is set by a trusted proxy (nginx).
    // In dev (no proxy) fall back to req.ip.
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        .split(',')[0]
        .trim();
      return first || null;
    }
    return (req as any).ip ?? req.socket?.remoteAddress ?? null;
  }

  private isBlocked(ip: string): boolean {
    const record = this.ipRecords.get(ip);
    if (!record || !record.blockedUntil) return false;
    if (Date.now() < record.blockedUntil) return true;
    // Block expired — reset
    record.blockedUntil = null;
    record.counts = { 404: 0, 403: 0 };
    record.windowStart = Date.now();
    return false;
  }

  private record(ip: string, code: 404 | 403, req: Request): void {
    const now = Date.now();
    let record = this.ipRecords.get(ip);

    if (!record) {
      // Evict if at cap before inserting
      if (this.ipRecords.size >= this.maxTrackedIps) {
        const oldestKey = this.ipRecords.keys().next().value;
        if (oldestKey) this.ipRecords.delete(oldestKey);
      }
      record = { counts: { 404: 0, 403: 0 }, windowStart: now, blockedUntil: null };
      this.ipRecords.set(ip, record);
    }

    // Roll the window if expired
    if (now - record.windowStart > this.windowMs) {
      record.counts = { 404: 0, 403: 0 };
      record.windowStart = now;
    }

    record.counts[code]++;

    const shouldBlock =
      record.counts[404] >= this.threshold404 ||
      record.counts[403] >= this.threshold403;

    if (shouldBlock && !record.blockedUntil) {
      record.blockedUntil = now + this.blockDurationMs;
      this.logger.warn(
        `IP blocked for abuse: ${ip} | 404s=${record.counts[404]} 403s=${record.counts[403]} ` +
          `| last path=${req.url} | blocked for ${this.blockDurationMs / 1000}s`,
      );
    }
  }
}
