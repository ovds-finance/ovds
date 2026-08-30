import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  private static readonly cookieName = 'csrf_token';
  private readonly headerName = 'x-xsrf-token';
  private readonly safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  use(req: Request, res: Response, next: NextFunction) {
    if (this.safeMethods.includes(req.method)) {
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
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return token;
  }
}
