import * as crypto from 'crypto';

import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  private static readonly cookieName = 'csrf_token';
  private readonly headerName = 'x-xsrf-token';
  private readonly safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  // Public auth routes that are pre-authentication bootstrapping endpoints.
  // CSRF protection on these provides no security benefit (an attacker cannot
  // exploit a victim's credentials via CSRF on a login form) and causes the
  // 400 "Invalid CSRF token" error when a stale csrf_token cookie is present
  // in the browser from a prior session but no x-xsrf-token header is sent.
  private readonly publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/check-email',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/otp/send',
    '/api/auth/otp/2fa',
    // DOM tamper alert beacon — fired from security-shield.js; sendBeacon
    // does not attach cookies, so CSRF validation would always fail.
    '/api/security/dom-alert',
    // Socket.IO polling transport sends POST requests during WS handshake.
    // The socket.io-client library does not forward custom HTTP headers on
    // these low-level transport requests, so CSRF validation always fails
    // with 400. Socket.IO uses its own auth handshake (JWT via auth.token)
    // which is a stronger per-connection check than cookie-based CSRF.
    '/socket.io',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    if (this.safeMethods.includes(req.method)) {
      return next();
    }

    // Skip CSRF check for public pre-authentication endpoints
    const path = req.path;
    if (this.publicPaths.some((p) => path === p || path.startsWith(p + '/'))) {
      return next();
    }

    const cookieToken = req.cookies?.[CsrfProtectionMiddleware.cookieName];
    if (!cookieToken) {
      return next();
    }

    const headerToken = req.headers[this.headerName];
    if (!headerToken || cookieToken !== headerToken) {
      throw new BadRequestException('Invalid CSRF token');
    }

    next();
  }

  static setCsrfCookie(res: Response) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CsrfProtectionMiddleware.cookieName, token, {
      // httpOnly MUST be false — the frontend JS reads it to send the header
      httpOnly: false,
      // Secure=true in production; allows http on localhost dev only
      secure: process.env.NODE_ENV === 'production',
      // SameSite=Strict: cookie is never sent on cross-site requests,
      // providing the strongest CSRF protection available.
      sameSite: 'strict',
      path: '/',
      // Match the access-token lifetime so CSRF token does not outlive the session.
      // ACCESS_TOKEN_MAX_AGE is in milliseconds (from @ovds/shared constants).
      maxAge: parseInt(process.env.CSRF_COOKIE_MAX_AGE || '86400000', 10),
    });
    return token;
  }
}
