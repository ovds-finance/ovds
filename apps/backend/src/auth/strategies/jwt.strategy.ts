import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { TokenBlacklistService } from '../../common/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(TokenBlacklistService) private readonly tokenBlacklistService: TokenBlacklistService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required for authentication');
    }
    super({
      jwtFromRequest: (req) => {
        if (!req) return null;
        const authHeader = req.headers?.authorization?.replace('Bearer ', '');
        if (authHeader) return authHeader;
        const cookies = req?.cookies;
        if (cookies?.access_token) return cookies.access_token;
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const jti = payload?.jti;
    if (jti) {
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    // Normalise role to uppercase so guards always receive canonical Role values
    // regardless of whether the token was issued before or after the schema migration
    // that renamed 'ovds' → 'OVDS'.
    const role = typeof payload.role === 'string'
      ? payload.role.toUpperCase()
      : payload.role;
    return {
      userId: payload.sub,
      email: payload.email,
      role,
      jti: payload.jti,
      companyId: payload.companyId,
    };
  }
}
