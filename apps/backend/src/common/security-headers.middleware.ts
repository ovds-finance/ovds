import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/**
 * SecurityHeadersMiddleware
 *
 * Applied globally in main.ts before all route handlers.
 * Enforces every recommended HTTP security header:
 *
 *  • Content-Security-Policy  — strict nonce-based policy; no unsafe-inline scripts
 *  • HSTS                     — 2 years, includeSubDomains, preload (HSTS preload list)
 *  • X-Frame-Options          — DENY (clickjacking)
 *  • X-Content-Type-Options   — nosniff (MIME sniffing)
 *  • Referrer-Policy          — strict-origin-when-cross-origin
 *  • Permissions-Policy       — locks down all sensor/hardware APIs
 *  • CORP / COOP / COEP       — cross-origin isolation
 *  • X-XSS-Protection         — legacy browser fallback
 *  • Cache-Control            — no-store on all auth/admin/sensitive paths
 *  • Remove X-Powered-By      — server fingerprint suppression
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  // Paths whose responses must never be cached anywhere in the chain
  private static readonly SENSITIVE_PATH_PREFIXES = [
    '/api/auth',
    '/api/admin',
    '/api/eims',
    '/api/offline',
    '/api/tax',
    '/api/settings',
    '/api/hr',
    '/api/payroll',
    '/api/banking',
    '/api/vat',
    '/api/ledger',
    '/api/sales',
    '/api/purchases',
    '/api/platform',
    '/api/security',
  ];

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const nonce = this.generateNonce();
    res.locals.cspNonce = nonce;

    // ── Strict Content-Security-Policy (nonce-based, no unsafe-inline scripts) ──
    // Adjust connect-src in .env via CSP_EXTRA_CONNECT_SRC when additional
    // WebSocket or API origins are needed (e.g. Firebase VITE endpoints).
    const extraConnectSrc = this.configService.get<string>('CSP_EXTRA_CONNECT_SRC', '');
    const connectSrc = ['\'self\'', 'ws:', 'wss:', extraConnectSrc]
      .filter(Boolean)
      .join(' ');

    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        // Scripts: only self + nonce; no unsafe-inline, no unsafe-eval
        `script-src 'self' 'nonce-${nonce}'`,
        // Styles: nonce for injected critical CSS; unsafe-inline kept for Tailwind
        // compatibility only — scope removal is tracked in security backlog.
        `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
        // Images: allow data URIs for inline icons and HTTPS for external avatars
        "img-src 'self' data: https:",
        // Fonts: self + Google Fonts CDN
        "font-src 'self' data: https://fonts.gstatic.com",
        // Connections (XHR, fetch, WebSocket)
        `connect-src ${connectSrc}`,
        // Iframes: blocked everywhere
        "frame-src 'none'",
        "frame-ancestors 'none'",
        // Objects/embeds: blocked
        "object-src 'none'",
        // Base tag: locked to self (prevents base-tag hijacking)
        "base-uri 'self'",
        // Form POST: only self (prevents form hijacking to external origins)
        "form-action 'self'",
        // Workers: only self
        "worker-src 'self' blob:",
        // Manifest: only self
        "manifest-src 'self'",
        // Block all mixed content upgrades at policy level
        'upgrade-insecure-requests',
      ].join('; '),
    );

    // ── HSTS: 2 years, preload-eligible ────────────────────────────────────
    // 63072000 seconds = 2 years (minimum for preload list submission).
    // Only set in production — local dev would break on http://localhost.
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload',
      );
    }

    // ── Clickjacking prevention ─────────────────────────────────────────────
    res.setHeader('X-Frame-Options', 'DENY');

    // ── MIME sniffing prevention ────────────────────────────────────────────
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // ── XSS auditor (legacy IE/Chrome < 78) ────────────────────────────────
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // ── Referrer leakage control ────────────────────────────────────────────
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // ── Cross-origin isolation headers ─────────────────────────────────────
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // ── Permissions-Policy: deny all hardware/sensor APIs ──────────────────
    res.setHeader(
      'Permissions-Policy',
      [
        'accelerometer=()',
        'ambient-light-sensor=()',
        'autoplay=()',
        'battery=()',
        'camera=()',
        'display-capture=()',
        'document-domain=()',
        'encrypted-media=()',
        'fullscreen=(self)',
        'geolocation=()',
        'gyroscope=()',
        'interest-cohort=()',
        'magnetometer=()',
        'microphone=()',
        'midi=()',
        'payment=()',
        'picture-in-picture=()',
        'publickey-credentials-get=(self)',
        'screen-wake-lock=()',
        'sync-xhr=()',
        'usb=()',
        'web-share=()',
        'xr-spatial-tracking=()',
      ].join(', '),
    );

    // ── Remove all server-identity headers ─────────────────────────────────
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // ── Cache control for sensitive paths ──────────────────────────────────
    // Configurable via CACHE_NO_STORE_PATHS env var (comma-separated prefixes).
    const configuredPaths = this.configService
      .get<string>('CACHE_NO_STORE_PATHS', '')
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    const sensitivePaths =
      configuredPaths.length > 0
        ? configuredPaths
        : SecurityHeadersMiddleware.SENSITIVE_PATH_PREFIXES;

    if (sensitivePaths.some((p) => req.path.startsWith(p))) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, no-transform, private',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    next();
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64');
  }
}
