import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantRoutingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const hostParts = host.split('.');

    if (hostParts.length < 3) {
      throw new UnauthorizedException('Missing or invalid tenant identifier');
    }

    const tenantSubdomain = hostParts[0];
    req['tenantId'] = tenantSubdomain;

    next();
  }
}
